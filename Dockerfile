# 售前学院 · 生产镜像（多阶段构建）
# 依赖: @libsql/client（本地 file 模式仍写入 data/app.db，volume 持久化见 compose）
# Node 24 LTS 同时满足 next 15 与 libsql 的运行要求
FROM node:24-alpine AS deps
RUN npm install -g pnpm@11.25.0
WORKDIR /app
# pnpm-workspace.yaml 必须一起 COPY：pnpm 11 的 allowBuilds（esbuild 构建脚本审批）配置在这里，
# 缺了它 pnpm install 会以 ERR_PNPM_IGNORED_BUILDS 失败（本地有该文件所以不报错）
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
RUN npm install -g pnpm@11.25.0
ENV NEXT_TELEMETRY_DISABLED=1
# 构建期注入站点域名（sitemap/OG 静态生成需要），由 docker-compose build args 传入
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-alpine AS runtime
RUN npm install -g pnpm@11.25.0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# 运行期需要的文件
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
# 与 deps 阶段同理：pnpm start 若触发依赖状态校验，审批配置需在场
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/next.config.mjs ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/content ./content
# scripts/：容器内可执行数据库备份（node scripts/db-backup.mjs）与演示缓存（tsx scripts/seed-demo-cache.ts）
COPY --from=build /app/scripts ./scripts
# lib/：seed-demo-cache 需要 import ../lib/jd-core 等纯库（type-only 的 @/ 导入会被 tsx 剥离，无需 data/）
COPY --from=build /app/lib ./lib

# SQLite 数据目录：建空目录并挂 volume（./data:/app/data）
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000
# 健康检查走 /api/health（含数据库连通性，且不耗 AI 额度）
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD ["pnpm", "start"]
