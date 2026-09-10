# 售前学院 · 生产镜像（多阶段构建）
# 依赖: node:sqlite 需要 Node >= 23.4（免 flag），这里用 Node 24 LTS
FROM node:24-alpine AS deps
RUN npm install -g pnpm@11.25.0
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
RUN npm install -g pnpm@11.25.0
ENV NEXT_TELEMETRY_DISABLED=1
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
COPY --from=build /app/next.config.mjs ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/content ./content

# SQLite 数据目录：建空目录并挂 volume（./data:/app/data）
RUN mkdir -p /app/data && chown -R node:node /app
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000 || exit 1

CMD ["pnpm", "start"]
