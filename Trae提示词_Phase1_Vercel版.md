# Trae 提示词 · Phase 1 · Vercel + Turso 版（当前执行路线）

> 使用方法：开一个全新的 Trae 对话，把下方代码块**整块**粘贴，无任何需要替换的内容。
> 粘贴前你只有一个准备动作：在 github.com 上建一个**空仓库**（不要勾选 README/.gitignore/license），名字建议 presales-academy——Trae 会向你要仓库地址并完成推送。
> 成本说明：Vercel Hobby / Turso 免费档对个人项目够用；域名（Cloudflare ~$10/年）在部署后再绑，用于大陆稳定访问。

```text
# 角色
你是本仓库「售前学院」（presales-academy）的开发者。技术栈：Next.js 15.5（App Router）+ TypeScript + Tailwind；数据库当前为 node:sqlite（本地文件 data/app.db），本次迁移到 @libsql/client；包管理器 pnpm，Node ≥22.5。

# 背景
仓库根目录《AI升级实施方案_Trae执行版.md》是完整实施计划，Phase 0（基线整理）已完成并提交（commit 5f83348）。本次只执行 **Phase 1 的 Vercel + Turso 变体**：把项目改造成可部署到 Vercel（免费 Hobby 档）+ Turso 托管数据库的形态，并补齐 SEO。Vercel / Turso 控制台上的操作由我手动完成——你负责代码改造、本地自测，最后给我一份照抄级的手动操作清单。

# 决策背景（为什么迁移）
- Vercel serverless 没有持久文件系统，SQLite 本地文件在生产行不通 → 生产数据库换 Turso（libSQL 托管，免费档对个人项目够用）
- 开发体验不变：@libsql/client 支持 file: URL，本地仍然零配置用 data/app.db
- Docker / Caddy 部署物料保留不动（后期买服务器时的升级路径，本次不碰）

# 任务（按顺序，共 8 件）
0. **确认 GitHub 远端**：git remote -v 若已有 origin 则跳过；若没有，向我要 GitHub 仓库地址，完成 git remote add origin + git push -u origin main
1. **安装依赖**：pnpm add @libsql/client
2. **迁移数据库层（本次唯一允许较大改动的部分）**：
   - lib/db.ts：用 createClient 替换 DatabaseSync——有 TURSO_DATABASE_URL 环境变量时连 Turso（url + authToken）；没有时用 file: 协议指向 data/app.db（保留 data/ 目录自动创建逻辑）
   - 三张表（users / sessions / sync_blob）的 CREATE TABLE IF NOT EXISTS 原样保留，启动时执行；WAL 与 busy_timeout 两个 PRAGMA 仅在本地 file 模式下执行，Turso 模式跳过
   - libsql 是异步 API，需同步调整全部调用点（**只加 async/await，不改任何逻辑**）：
     - lib/auth.ts：createUser / findUserByEmail / createSession / getSessionUser / destroySession 五个函数
     - app/api/sync/route.ts：GET 的 .all() 与 POST 的 .run()（注意 POST 里 stmt 在循环外 prepare、循环内 run 的写法，等价改写即可）
   - 建议 db.ts 导出最小的 async 工具封装（run / get / all），让调用点改动最小、类型清晰
3. **Vercel 运行时适配**：next.config.mjs 增加 outputFileTracingIncludes（Next 15 顶层配置项；若类型检查不认则放到 experimental 下），把运行时用 fs 读取的 content/ 目录（learn 笔记、quiz 题库、roadmap JSON）全部纳入 serverless 打包；全仓搜索 process.cwd() 的读取点逐一确认覆盖
4. **SEO 基础**：
   - app/layout.tsx 补全 metadata：metadataBase 用 new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")、title 模板「%s · 售前学院」、站点级 description、openGraph 卡片（locale zh_CN）
   - 新建 app/sitemap.ts：静态列出全部公开路由（/、/learn、/roadmap、/recruit、/quiz、/about、/sources），并用 lib/content.ts 的 getAllArticles() 为每篇笔记生成 /learn/<slug> 条目；URL base 同样取 NEXT_PUBLIC_SITE_URL
   - 新建 app/robots.ts：Allow 全部公开页，Disallow /api
   - 新建 app/icon.svg：品牌色 + 简洁图形（「售」字或靶心/书本意象），作为 favicon
5. **文档同步**：
   - .env.example 增加 NEXT_PUBLIC_SITE_URL= 、TURSO_DATABASE_URL= 、TURSO_AUTH_TOKEN=（保留 AI_* 三项；注释注明生产值配置在 Vercel 控制台，不入库）
   - deploy/README.md：顶部新增「方案 A：Vercel + Turso（当前路线）」一节，完整写清上线步骤；原服务器章节标题改为「方案 B：香港服务器 Docker（后期升级可选）」
6. **自测（本地 file 模式，不设任何 TURSO_* 变量）**：
   - pnpm build 通过
   - pnpm start 后用 curl 模拟全链路：注册 → 登录拿会话 Cookie → POST /api/sync 写入一块数据 → GET /api/sync 验证能读回 → 证明本地模式没坏（贴出关键请求与响应）
   - curl 验证 /sitemap.xml 返回 XML、/robots.txt 返回规则文本（贴片段）；验证完停掉服务
7. **提交与推送**：commit message：`phase 1: turso migration + vercel config + seo metadata`，并 push 到 origin

# 硬性约束
- 只改任务中点名的文件；Dockerfile / docker-compose.yml / Caddyfile / lib/cloud.ts / 各前端组件一律不动
- 不改三张表的 schema；不改任何业务逻辑（数据库调用点只允许加 async/await）
- 严禁在代码或提交历史中出现任何真实 token / 密钥；.env.local 由我本人手动创建，不归你管
- 若发现代码现状与本提示不符，停下来向我报告，不要自行扩大改动范围

# 完成标准（逐条自检，并在最终回复中给出证据）
1. 本地 file 模式全链路通过（注册→登录→sync 读写，贴 curl 序列与响应）
2. pnpm build 通过
3. /sitemap.xml 与 /robots.txt 本地可访问且内容正确
4. git log 出现 phase 1 提交且已 push 到 origin

# 汇报格式（最终回复必须包含）
1. 变更文件清单（路径 + 一句话说明）
2. 完成标准逐条结果（✅/❌ + 证据）
3. **我手动操作的照抄清单**（按序编号、写清每步在哪 个网页/终端 里做什么）：
   a. Turso：本地装 CLI（官方一行命令）→ 登录 → 创建数据库 → 拿数据库 URL → 创建 token
   b. Vercel：vercel.com 用 GitHub 登录 → Add New → Project → Import 本仓库 → Environment Variables 逐个填 NEXT_PUBLIC_SITE_URL（先填 Vercel 分配的 *.vercel.app 地址）/ TURSO_DATABASE_URL / TURSO_AUTH_TOKEN → Deploy
   c. （强烈建议，可后补）Cloudflare 域名：按 Vercel 项目 Settings → Domains 的提示配置 DNS → Vercel Add Domain → 把 NEXT_PUBLIC_SITE_URL 更新为正式域名并 Redeploy
   d. 上线验收：打开首页、注册→打卡→换浏览器登录验证同步、Vercel 部署日志无错
4. 需要我决策的事项
```

---

## Trae 完成后你手动做的事（Trae 汇报里会有定制版，此为对照）

1. **Turso**（本机终端，约 5 分钟）：装 CLI → 登录 → `turso db create presales` → `turso db show` 拿 URL → `turso db tokens create` 拿 token
2. **Vercel**（浏览器，约 5 分钟）：GitHub 登录 → Import 仓库 → 填三个环境变量 → Deploy
3. **验收**：打开分配的 `*.vercel.app` 地址；注册→打卡→换浏览器验证同步；部署日志无错
4. **域名**（强烈建议尽快补上）：Cloudflare 买 .com（~$10/年）→ 按 Vercel 提示配 DNS → Add Domain → 更新 NEXT_PUBLIC_SITE_URL 并 Redeploy。不绑域名的话大陆访问 *.vercel.app 基本不通，你自己都打不开自己的站。

## 后期升级回服务器时怎么办

方案 B 物料原封保留。届时：域名 DNS 从 Vercel 改指服务器 IP → 服务器 git clone + docker compose up → `lib/db.ts` 从 Turso 分支回切 node:sqlite（或继续用 Turso 也行）。预计 1 小时内完成切换。
