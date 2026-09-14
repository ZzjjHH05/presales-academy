# Trae 提示词 · Phase 8（eval 评测集 + 演示打磨）

> 使用方法：开一个**全新的 Trae 对话**，把下方代码块整块粘贴。
> 前置条件：Phase 0-7 已完成并验收。本地 `.env.local` 已配真实 DeepSeek Key（eval 真实模式要用）。
> **人工 gate 有两道**：① 10 条评测样本的 expectedPoints 口径要你确认；② README 数字与演示脚本要你过目。

```text
# 角色
你是本仓库「售前学院」（presales-academy）的开发者。技术栈：Next.js 15.5（App Router）+ TypeScript + Tailwind；pnpm；数据库 @libsql/client（lib/db.ts 导出 async 的 run/get/all）。线上 https://zzjjhh05.com（香港服务器 Docker）。

# 背景
仓库根目录《AI升级实施方案_Trae执行版.md》的「Phase 8 · 评测集 + 演示打磨」一节是本任务依据。Phase 0-7 已完成：AI 统一网关 + 三大 AI 功能（JD 解析 / 模拟面试 / 方案工作台）全部上线。本 Phase 把「我感觉效果还行」变成数字：建 eval 评测集跑出通过率写进 README，并打磨 README/about 与 3 分钟演示脚本。**这是简历叙事的重点——eval 数字是同类学生项目几乎没有的东西。**

# 关键前置事实（均已核对，直接使用，不要臆造）
- **JD 解析链路现状**：`app/api/ai/jd/route.ts`（POST，zod 校验 → consumeRateLimit → buildNoteList + SYSTEM_PROMPT → aiJSON（schema=jdResultSchema，fallback=jdFallback）→ sanitizeSlugs → 响应带 degraded/cached/remaining）。zod 契约在 `lib/jd-schema.ts`（jdInputSchema 20-8000 字 / jdResultSchema：position + requirements≥3（point/domain/weight/relatedNotes）+ predictedQuestions≥2）。
- **为什么必须先重构**：eval 脚本用 tsx 在 Next 之外跑，而 route.ts 引用了 consumeRateLimit → getSessionUser → next/headers 的 cookies()——离开请求上下文会抛异常。所以要把「纯解析核心」抽成无 Next 依赖的 lib 文件（P4 当初要求 ai.ts 保持纯库，就是为今天这一步）。
- **网关** `lib/ai.ts`：`aiJSON<T>({ system, user, schema, fallback })` 返回 `{ data, degraded, cached }`；成功才写 ai_cache（hash = sha256(AI_MODEL + system + user)——该 contentHash 目前是私有函数，本 Phase 要导出）。**降级（degraded=true）时网关不写缓存**。
- **降级引擎** `lib/ai-fallback.ts` 的 `jdFallback(jd)` 返回同构 JdResult。
- **笔记白名单**：`getAllArticles()`（lib/content.ts）；P5 的 sanitizeSlugs 范式在 jd route 内。
- **本机 pnpm 提示**：安装依赖时若提示需要确认清空 node_modules（本机 store 历史状态偏差），交互确认 y 即可。
- eval 期间会向 data/app.db 的 ai_cache 写入内容寻址行——属正常使用，无需清理。

# 任务（按顺序，共 6 件）

## 1. 重构：抽取 lib/jd-core.ts（纯解析核心，零 Next 依赖）
从 `app/api/ai/jd/route.ts` 把以下内容**原样迁移**到新文件 `lib/jd-core.ts`：buildNoteList、SYSTEM_PROMPT、sanitizeSlugs、以及新导出的组合函数：
```ts
export function buildJdPrompt(jd: string): { system: string; user: string };
// user = `请分析以下招聘 JD，输出能力差距卡 JSON：\n\n${jd}`（与现行为逐字一致）

export async function analyzeJd(jd: string): Promise<{
  result: JdResult; degraded: boolean; cached: boolean;
}>;
// 逻辑与现 route 完全一致：jdFallback(jd) 作 fallback → aiJSON（jdResultSchema）→ sanitizeSlugs
```
同时：
- `lib/ai.ts` 给 `contentHash` 加 `export`（仅加关键字，不改实现）。
- `app/api/ai/jd/route.ts` 改为薄壳：zod 校验 → consumeRateLimit → `analyzeJd` → NextResponse（响应字段、状态码、限流行为与现在**完全一致**）。
- ⚠️ 重构完成后 JD 端点行为必须零变化——这是后续 eval 数字可信的前提。jd route 里 prompt 文案一个字都不要改（改了会导致线上缓存 hash 变化 + eval 样本失真）。

## 2. 新建 eval/jd-cases.json —— 10 条标注样本
格式：`[{ "id": "case-01", "industry": "网络安全", "jdText": "…", "expectedPoints": ["等保", "售前方案", "客户沟通"] }, …]`
- 10 条覆盖不同行业：网络安全、云计算、网络设备、软件/IT 服务、政务信息化、制造业、零售/消费、金融科技、数据/大数据、硬件/服务器（各 1 条）。
- jdText 每条 300-600 字、真实感 JD（岗位职责 + 任职要求结构，不要真实公司名，用「某 XX 厂商/某 XX 企业」）。
- expectedPoints 每条 3-6 个**短能力关键词**（2-8 字，如「等保」「上云」「POC」「沟通表达」「决策链」「招投标」）——这些词是召回率判定的锚点，会按「子串包含 requirement.point 全文（小写化、去空白）」匹配，所以写词不要写长句。
- ⚠️ expectedPoints 口径最终由用户 Gate 确认——汇报时全部列出等用户审。

## 3. 新建 scripts/eval-jd.ts + package.json 接线
- `pnpm add -D tsx`；`package.json` scripts 增 `"eval": "tsx scripts/eval-jd.ts"`。
- 脚本开头：若存在 `.env.local` 则手动解析（读行、按 `KEY=VALUE` 切分、塞 process.env；无第三方依赖）——让 AI_API_KEY/AI_MODEL 生效。
- 数据流：读 eval/jd-cases.json（fs.readFileSync + JSON.parse）→ 逐条 `analyzeJd(case.jdText)`（**不调 consumeRateLimit，不烧额度**）。
- **两遍跑法**：
  - 第一遍（真实模式，当前 env）：逐条记录 { degraded, cached, recall, schemaOk, slugsOk }。
  - 第二遍（降级模式）：`delete process.env.AI_API_KEY` 后重跑全部 case——断言不崩溃、schemaOk 全真、slugsOk 全真（降级也必须守红线）。
- **断言与输出**（recal 匹配规则：expectedPoint 小写化去空白后，是任一 requirement.point 小写化去空白后的子串，即算命中；recall = 命中数 / 该 case expectedPoints 总数）：
  1. schema 合法率（真实模式）= 100%
  2. slug 白名单率（两遍）= 100%
  3. 非降级率（真实模式）≥ 90%（10 条最多 1 条降级）
  4. 总召回率（真实模式）≥ 80%（各 case 召回率也要逐条打印）
  5. 降级模式全 case 通过（不崩溃 + schema + slug）
- 输出：逐 case 明细表（id/行业/recall/degraded/问题数）+ 各断言 ✓/✗ + **总通过率**；最后打印一段**可直接粘贴进 README 的 markdown 数字块**（表格：指标/数值）。
- 任一断言失败 → exit 1（供未来 CI 用）。

## 4. 新建 scripts/seed-demo-cache.ts —— 演示兜底缓存
- `package.json` scripts 增 `"seed:demo": "tsx scripts/seed-demo-cache.ts"`。
- 逻辑：取一条固定的典型 JD（可直接用 eval 里最有代表性的 case，写成常量）→ `analyzeJd(DEMO_JD)`：
  - 若 degraded=false（本机有 Key）：网关已写 ai_cache，打印确认即可。
  - 若 degraded=true（无 Key）：手动兜底写入——`buildJdPrompt` 取 system/user → `contentHash(AI_MODEL + system + user)` 算 hash → `INSERT OR REPLACE INTO ai_cache` 写入 fallback 的 result JSON（经 lib/db 的 run）。保证现场断网/模型抽风时，演示这条 JD 依然秒出完整差距卡。
- 幂等：重复跑不报错。跑完打印「演示缓存就绪：hash 前 10 位 …」。

## 5. README.md 重写打磨（现状全部过时：还写着 node:sqlite、"12 题"、M0-M4b 路线图）
逐节更新（内容必须与实际一致，禁止吹没做的功能）：
1. **头部**：一句话定位更新——「售前/解决方案工程师秋招学习站：能力树 + 23 篇笔记 + 公司库 + 题库 + AI 工具箱（JD 解析/模拟面试/方案工作台）」；加线上链接 `https://zzjjhh05.com`。
2. **技术栈**：修正「Node 内置 node:sqlite」→「@libsql/client（本地 file / Turso 双模式，零代码切换）」；补认证安全行（scrypt + httpOnly + Secure Cookie + 登录防爆破）；补「安全响应头（CSP/HSTS）+ 落库限流 + 在线备份」一行。
3. **新增「## AI 架构」节**（放在技术栈之后）：
   - 统一网关：结构化输出（zod 校验 + 失败带错误重试一次）、落库缓存（ai_cache，同参数秒回）、落库限流（匿名 8/天、登录 20/天，ip 加盐不存明文）、同构降级（规则引擎兜底，UI 形态一致、永不 500）；
   - 三大功能一句话各带链接路径（/jd、/interview、/workbench）；
   - **eval 数字表**：粘贴任务 3 输出的 markdown 块（指标：schema 合法率 100%、非降级率 X%、总召回率 X%、降级路径 PASS）+ 运行命令 `pnpm eval`；
   - 演示兜底说明一句（seed:demo 预置典型解析，断网可演示）。
4. **目录结构**：补 companies/jd/interview/workbench 页面、api/ai/*、lib/ai*、eval/、scripts/。
5. **路线图**：旧 M0-M4b 列表整体替换为真实状态：P0 基线 / P1 上线（Docker + Caddy）/ P2 公司库 17 家 / P3 题库 30 题 / P4 AI 网关 / P5 JD 解析 / P6 模拟面试 / P7 方案工作台 / P8 eval（全部 ✅）/ P9 运营分发（进行中）。
6. **快速开始**：补 `pnpm eval`、`pnpm seed:demo`。
7. **新增「## 3 分钟演示脚本」节**：按顺序列出演示动线（首页 → /jd 贴示例 JD 讲降级与缓存 → /interview 走一题点评 → /workbench 讲"AI 不代写正文"红线 → about 讲 eval 数字与安全加固），每步一句话要点。

## 6. app/about/page.tsx 打磨
1. `TECH` 数组修正 + 追加：「@libsql/client 数据层（本地 file / Turso 零代码切换）」「AI 统一网关：zod 结构化输出 + 落库缓存 + 落库限流 + 同构降级」「AI 功能：JD 解析 / 模拟面试 / 方案工作台（含 eval 评测）」——eval 数字在 eval 跑完后把真实数值填进去（硬编码 + 注释注明来源 `pnpm eval`）。
2. 修过时文案：「三块数据自动同步」→ 按实际（进度/题库/投递/面试记录四类）；「后续迭代：部署上线、AI 辅助整理 JD」→ 改为「已上线：公司库、JD 解析、AI 模拟面试、方案工作台」。
3. 「内容策略」节下加一排功能入口链接（/companies、/jd、/interview、/workbench）。

## 7. 自测（贴证据）
- `pnpm install`（装 tsx）→ `pnpm build` 通过。
- `pnpm eval`：贴**完整输出**（含逐 case 表、各断言、总通过率、README markdown 块）。
- 无 Key 验证：`AI_API_KEY` 清空的环境下再跑一次 eval → 降级模式断言全 PASS。
- 重构回归：`next start` 后 curl /api/ai/jd（真实 JD）→ 200 + degraded:false + 二次 cached:true，响应字段与重构前一致；再 curl 一个超短 JD → 400。
- `pnpm seed:demo` → 再 curl 同一条演示 JD → `cached:true`（兜底缓存生效）。
- README/about 渲染检查：next start 后 curl / 与 /about 均 200，页面无堆栈错误。
- git add -A → commit -m "phase 8: jd eval suite (10 cases, recall>=80%) + demo cache seed + README/about polish" → push。
- 工作区无临时文件；除授权清单外未动任何文件（特别是不动 lib/ai-limit.ts、云同步、六张表语义）。

# 硬性约束
- 只做上面 7 件事；不重构无关模块；除 tsx（devDep）外不新增任何依赖。
- **route.ts 重构后对外行为零变化**（路径/入参/响应字段/状态码/限流行为）；jd 的 prompt 文案一个字不改（缓存 hash 与 eval 样本一致性依赖它）。
- eval 不调 consumeRateLimit（直连 analyzeJd，不烧额度）；eval/seed 只走 lib 层，禁止 import next/server 的任何东西（jd-core 也必须保持零 next 依赖）。
- AI_API_KEY 严禁出现在 eval 输出、README、commit、日志里；.env.local 不进 git。
- README/about 文案与实际一致：数字必须来自真实 eval 输出，不许编造或四舍五入美化；没做的功能不写。
- 不动：lib/ai-limit.ts、云同步（cloud.ts / sync route）、六张表语义、其他页面与组件。
- 若发现代码现状与本提示不符，停下来报告。

# 完成标准（逐条自检，最终回复给证据）
1. `pnpm eval` 跑通：schema 100%、slug 100%、非降级率 ≥90%、总召回率 ≥80%、降级模式 PASS，输出含 README markdown 块。
2. jd 端点重构回归通过（行为零变化）。
3. `pnpm seed:demo` 幂等跑通，同 JD 二次请求 cached:true。
4. README（AI 架构 + eval 数字 + 演示脚本 + 真实路线图）与 about（AI 行 + 功能入口）打磨完成，文案与实际一致。
5. commit 已 push；无临时文件残留。

# 汇报格式（最终回复必须包含）
1. 变更文件清单（新建/修改分开列）
2. 完成标准逐条结果（✅/❌ + 证据：eval 完整输出摘录）
3. **10 条样本的 expectedPoints 全量列表**（等用户 Gate 确认）
4. eval 数字块（将写入 README 的最终版）
5. 需要用户决策/反馈的事项
```

---

## Trae 完成后的验收清单（导师执行）

- [ ] 独立 build + `pnpm eval` 完整输出审查（数字是否真实达到阈值、匹配规则是否按 spec）
- [ ] **10 条 expectedPoints 口径 Gate**：逐条确认锚点词是否合理（防"送分题"——锚点太宽泛会虚高召回率）
- [ ] jd 端点回归：重构后行为与响应字段零变化；二次请求 cached:true
- [ ] `pnpm seed:demo` 幂等 + 兜底缓存命中验证
- [ ] 无 Key 环境 eval 第二遍 PASS（降级红线）
- [ ] README/about 与实际功能一致（重点查：没有吹没做的功能、node:sqlite 旧文案清干净、路线图真实）
- [ ] 代码走查：jd-core 零 next 依赖；eval 不烧额度；除授权清单外未动其他文件；Key 无泄漏
- [ ] commit 已 push；上线 `git pull && docker compose up -d --build`（README/about 变更随构建生效）
- [ ] **人工 gate ②**：README 与演示脚本过目；**开始练 3 分钟 demo**
