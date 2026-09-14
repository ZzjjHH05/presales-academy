# 售前学院 · Presales Academy

售前 / 解决方案工程师秋招学习站：**能力树 + 23 篇笔记 + 公司库 + 题库 + AI 工具箱（JD 解析 / 模拟面试 / 方案工作台）**。
既是个人学习工具，也是全栈项目演示作品。线上：<https://zzjjhh05.com>

## 技术栈

- **Next.js 15.5（App Router）+ TypeScript + Tailwind CSS**
- **Markdown 内容管线**：`gray-matter` + `unified / remark / rehype`（含 GFM、代码高亮、标题锚点）
- **数据层 `@libsql/client`**：本地 `file:` 模式（data/app.db）/ Turso 托管双模式，零代码切换
- **认证与安全**：自研认证（scrypt 密码哈希 + httpOnly Secure Cookie + 登录防爆破落库限流）
- **安全响应头**：CSP / HSTS / X-Frame-Options 等 + AI 调用落库限流 + 在线备份（`scripts/db-backup.mjs`）

## AI 架构

统一 AI 网关（`lib/ai.ts`）是所有 AI 功能的公共底座，四大能力：

1. **结构化输出**：调用前用 zod 定义输出 schema，校验失败携带错误重试一次，两次都失败才降级——永不 500；
2. **落库缓存**：结果按 `sha256(model + system + user)` 写 `ai_cache`（30 天），同参数请求秒回；
3. **落库限流**：`ai_rate` 表按天计数（匿名 8 次/天、登录 20 次/天），IP 加盐哈希不存明文；
4. **同构降级**：规则引擎兜底，输出结构与 AI 一致，UI 形态不降级（无 Key / 断网 / 超时均可演示）。

三大 AI 功能：**[JD 解析](/jd)**（能力差距卡：岗位要求 → 六域 → 站内笔记）、**[模拟面试](/interview)**（出题 + 逐题点评）、**[方案工作台](/workbench)**（澄清 → 方案骨架 → 分段点评，AI 不代写正文）。

**JD 解析 eval 评测**（10 条真实行业样本跑出的通过率，`pnpm eval`）：

| 指标 | 数值 |
|---|---|
| 评测样本 | 10 条 / 10 个行业 |
| schema 合法率 | 100%（10/10） |
| slug 白名单率 | 100%（真实 + 降级两遍） |
| 非降级率（真实 Key） | 100%（10/10） |
| 总召回率（真实 Key） | 86.0%（expectedPoints 子串匹配） |
| 降级路径（无 Key） | PASS |
| 运行命令 | `pnpm eval` |

**演示兜底**：`pnpm seed:demo` 预置一条典型 JD 的解析结果进 `ai_cache`——现场断网 / 模型抽风时贴这条 JD 依然秒出完整差距卡。

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm eval       # 跑 JD 解析评测（10 条样本，两遍：真实 + 无 Key 降级）
pnpm seed:demo  # 预置演示缓存（幂等，断网可演示）
```

生产构建：

```bash
pnpm build
pnpm start
```

生产部署（香港服务器 Docker + Caddy）：`docker compose up -d --build`，详见 [deploy/README.md](deploy/README.md)。

## 目录结构

```
presales-academy/
├─ app/                    # 页面路由（App Router）
│  ├─ page.tsx             # 首页
│  ├─ companies/           # 公司库（17 家目标公司）
│  ├─ jd/                  # JD 解析（AI 能力差距卡）
│  ├─ interview/           # 模拟面试（AI 出题 + 点评）
│  ├─ workbench/           # 方案工作台（AI 辅助方案搭建）
│  ├─ learn/               # 学习内容列表 + 文章页 [slug]
│  ├─ roadmap/             # 学习路线（能力树）
│  ├─ recruit/             # 秋招投递看板
│  ├─ quiz/                # 售前面经题库自测
│  ├─ about/               # 关于项目（演示叙事）
│  └─ api/
│     ├─ ai/               # AI 端点（health / jd / interview / solution）
│     └─ auth·sync         # 认证与同步 API
├─ components/             # UI 组件
├─ content/
│  ├─ learn/<domain>/*.md  # 原创笔记（frontmatter 含来源/核实字段）
│  ├─ quiz/*.md            # 面经题库（四类分类）
│  └─ roadmap/presales.json# 能力树节点（JSON 数据驱动）
├─ data/domains.ts         # 六大知识域定义
├─ eval/                   # JD 评测集（10 条标注样本，json）
├─ lib/                    # 内容、Markdown、认证、数据库、AI 网关、降级引擎
├─ scripts/                # eval-jd.ts / seed-demo-cache.ts / db-backup.mjs
└─ deploy/                 # 生产部署文档
```

## 内容规范

每篇笔记 frontmatter 固定字段：`title / description / domain / order / tags / minutes / updated / source / verified`。
正文使用四段式模板：**📌 一句话结论 → 🧠 知识要点 → 💼 面试怎么问 → ✅ 自检清单**。

## 路线图（真实状态）

- [x] P0 基线：骨架 + 内容管线 + 六大域笔记
- [x] P1 上线：Docker + Caddy + HTTPS（zzjjhh05.com）
- [x] P2 公司库 17 家
- [x] P3 题库 30 题（行为面 / 方案面 / 技术广度 / 开放题）
- [x] P4 AI 统一网关：缓存 / 限流 / 同构降级
- [x] P5 JD 解析（能力差距卡）
- [x] P6 模拟面试（出题 + 点评）
- [x] P7 方案工作台（AI 辅助不代写）
- [x] P8 eval 评测集 + 演示打磨（10 条样本，召回率 ≥80%）
- [ ] P9 运营分发（内容渠道引流，进行中）

## 3 分钟演示脚本

1. **首页**（30s）：一句话定位——售前岗秋招学习站；内容/题库/公司库/AI 工具箱四块入口。
2. **/jd 贴示例 JD**（60s）：粘贴预置 JD（或现场贴一条真实 JD）→ 秒出能力差距卡；讲网关四件套：缓存（同参数秒回）、限流（落库按天）、降级（拔 Key 演示 UI 不降级）、zod 校验（输出永远合法）。
3. **/interview 走一题**（45s）：选一道行为面，AI 出题 → 答两句 → 点评给出 STAR 改进建议。
4. **/workbench 讲红线**（45s）：演示澄清 → 骨架 → 分段点评；强调「AI 只搭框架不代写正文」的边界设计。
5. **/about 讲数字与安全**（30s）：eval 10 条样本 / schema 100% / 召回 86%；scrypt + httpOnly + CSP/HSTS + 落库限流。
