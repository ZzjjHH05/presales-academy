# Trae 提示词 · Phase 4（AI 统一网关）

> 使用方法：开一个**全新的 Trae 对话**，把下方代码块整块粘贴。
> 前置条件：用户已在本地 `.env.local` 配好 AI_API_KEY（若没配，任务仍可执行——网关的降级路径就是为无 Key 场景设计的，构建和验收都能跑）。
> 本 Phase 无 UI 改动——纯后端基建，Phase 5-7 的 AI 功能全部踩在这上面。

```text
# 角色
你是本仓库「售前学院」（presales-academy）的开发者。技术栈：Next.js 15.5（App Router）+ TypeScript + Tailwind；pnpm；数据库为 @libsql/client（lib/db.ts 导出 async 的 run/get/all 封装）。线上地址 https://zzjjhh05.com（香港服务器 Docker 部署，compose 已配 env_file 注入 .env）。

# 背景
仓库根目录《AI升级实施方案_Trae执行版.md》是完整实施计划，其「Phase 4 · AI 统一网关（serverless 修订版）」一节是本任务依据（v2 修订版：跨请求状态全部落库，严禁内存 Map——生产是 Docker 单机不是 serverless，但落库方案对两种部署都正确且免改造）。Phase 0-3 已完成。本次只执行 **Phase 4：AI 统一网关**——所有后续 AI 功能（JD 解析/模拟面试/方案工作台）的公共底座。本 Phase 不做任何前端页面。

# 关键前置事实
- lib/db.ts：`run(sql, args) / get<T>(sql, args) / all<T>(sql, args)` 全 async；`dbReady` Promise 保证建表先于查询；新增表**只增不改**（users/sessions/sync_blob 三表不动）
- lib/auth.ts：`getSessionUser()` 返回当前登录用户或 null（限流用它区分匿名/登录）
- zod 已安装（^4.x，Phase 0 装的）
- 环境变量：AI_API_KEY / AI_BASE_URL / AI_MODEL（.env.example 已有；生产由 compose env_file 注入）
- Next.js 15 App Router：API route 放 app/api/**/route.ts；动态 route 需 `export const runtime = "nodejs"`（默认即是，显式声明更稳）

# 任务（按顺序，共 6 件）

## 1. lib/db.ts 新增两张表（在现有 CREATE TABLE 语句后追加，只增不改）
```sql
CREATE TABLE IF NOT EXISTS ai_cache (
  hash TEXT PRIMARY KEY,        -- sha256(AI_MODEL + system + user)
  result TEXT NOT NULL,         -- AI 成功输出（JSON 字符串）
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_rate (
  ip_hash TEXT NOT NULL,        -- sha256(ip + 盐)，盐从环境变量 AI_RATE_SALT 取，未配置则用固定默认值（开发便利）
  day TEXT NOT NULL,            -- YYYY-MM-DD（按天计数）
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);
```

## 2. 新建 lib/ai.ts —— 统一网关（核心文件）
导出：
```ts
export async function aiJSON<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  fallback: T;                       // 降级结果（与 schema 同构）
}): Promise<{ data: T; degraded: boolean; cached: boolean }>
```
实现要求：
- **无 AI_API_KEY**：直接返回 { data: fallback, degraded: true, cached: false }，不发请求
- **缓存**：先算 hash = sha256(AI_MODEL + system + user)，查 ai_cache 命中且 30 天内 → 直接返回 { data: 解析结果, degraded: false, cached: true }
- **调用**：OpenAI 兼容协议 fetch（`${AI_BASE_URL}/chat/completions`），body 含 model/system+user messages、`response_format: { type: "json_object" }`、temperature 0.2；AbortController 30 秒超时
- **校验**：响应 JSON 先过 zod safeParse；失败 → 把校验错误信息附进重试请求（"上次输出未通过校验：<errors>，请严格按 JSON schema 重输"）重试一次；再失败 → 返回 fallback + degraded: true
- **成功**：写入 ai_cache（INSERT OR REPLACE），返回 { data, degraded: false, cached: false }
- **任何网络异常/超时**：catch 住，返回 fallback + degraded: true —— **永不 throw、永不 500**
- 日志：console.log 一行结构化信息（hash 前缀/degraded/cached/耗时 ms），方便服务器排障

## 3. 新建 lib/ai-limit.ts —— 落库限流
```ts
export async function checkRateLimit(req: Request): Promise<{ ok: boolean; remaining: number }>
export async function consumeRateLimit(req: Request): Promise<{ ok: boolean; remaining: number }>
```
- 匿名（无登录会话）：3 次/天；登录：20 次/天（getSessionUser() 判断）
- IP 提取：req.headers 的 x-forwarded-for（取第一个）或 x-real-ip，取不到用 "unknown"；**ip_hash = sha256(ip + AI_RATE_SALT)**，不存明文 IP
- day 用服务器本地时区 YYYY-MM-DD
- consume 用 `INSERT INTO ai_rate ... ON CONFLICT(ip_hash, day) DO UPDATE SET count = count + 1` 原子自增；count 超限则 ok: false
- check 只读不写（给需要预检的场景）

## 4. 新建 app/api/ai/health/route.ts —— 网关自检端点（也是本 Phase 的验收工具）
- GET：不耗限流额度。返回 { ok: true, keyConfigured: boolean, degraded: boolean, cached: boolean, model: string }
- 内部调 aiJSON({ system: "你是健康检查器", user: '请返回 {"status":"ok"}', schema: z.object({ status: z.literal("ok") }), fallback: { status: "ok" } })
- 有 Key：真调一次模型（小请求，验证链路）；无 Key：走降级。**两种情况都返回 200**，用 degraded 字段区分

## 5. 自测（贴证据）
- pnpm build 通过
- `pnpm start` 后 curl 验证（贴请求与响应）：
  a. GET /api/ai/health —— 无 Key 状态下应返回 degraded: true 且 200
  b. 连续 GET /api/ai/health 多次 —— 应命中缓存（第二次起 cached: true；health 端点设计为不耗额度，见下）
- ⚠️ health 端点**不消耗限流额度**（它只是自检），但要在代码注释里写明「业务端点必须调 consumeRateLimit」
- 若本地 .env.local 已配 Key：再贴一次 health 结果证明真实调用成功（degraded: false）

## 6. 提交
- .env.example 追加一行 `AI_RATE_SALT=`（注释：限流盐，生产必配随机串）
- git commit -m "phase 4: unified ai gateway - libsql cache + rate limit + zod validation + graceful fallback"，并 push

# 硬性约束
- 不做任何前端页面/组件改动；不动 users/sessions/sync_blob 逻辑；不新增除 ai_cache/ai_rate 之外的表
- AI_API_KEY 只从 process.env 读，严禁出现在任何代码字面量、日志、提交内容里
- lib/ai.ts 不 import 任何 React/Next 组件——它是纯库，将来要能被 scripts/ 下的 Node 脚本复用（Phase 8 eval 会用到）
- 限流/缓存的 SQL 一律走 lib/db.ts 的封装，不直连 db 对象
- 若发现代码现状与本提示不符，停下来报告

# 完成标准（逐条自检，最终回复给出证据）
1. lib/ai.ts 的 aiJSON 四条路径全覆盖：缓存命中 / 成功 / 校验失败重试一次后成功或降级 / 无 Key 直接降级——代码结构能一一对应
2. 无 Key 时 curl /api/ai/health 返回 200 + degraded: true（不 500）
3. 重复请求命中 ai_cache（响应 cached: true 或日志可见）
4. 限流表原子自增逻辑正确（ON CONFLICT 不丢计数）
5. pnpm build 通过；commit 已 push

# 汇报格式（最终回复必须包含）
1. 变更文件清单
2. 完成标准逐条结果（✅/❌ + 证据）
3. aiJSON 的决策流程图（文字版：无Key→缓存→调用→校验→重试→降级）
4. 需要用户决策的事项
```

---

## Trae 完成后的验收清单（导师执行）

- [ ] 独立 pnpm build
- [ ] 无 Key 场景：curl /api/ai/health → 200 + degraded:true（降级路径活）
- [ ] 配 Key 场景：degraded:false（真实链路通）——**需要用户先把 Key 填进 .env.local**
- [ ] 二次请求 cached:true（缓存活）
- [ ] 代码走查：aiJSON 永不 throw；限流走 db 封装；Key 无字面量泄漏
- [ ] 服务器上线：.env 补 AI_API_KEY + AI_RATE_SALT（随机串）→ docker compose up -d --build
