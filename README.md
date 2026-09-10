# 售前学院 · Presales Academy

售前 / 解决方案工程师秋招专用学习站：**售前能力树（六大知识域）+ Markdown 知识库 + 学习打卡**。
既是个人学习工具，也是全栈项目演示作品。

## 技术栈

- **Next.js 15（App Router）+ TypeScript**
- **Tailwind CSS + @tailwindcss/typography**
- **Markdown 内容管线**：`gray-matter` + `unified / remark / rehype`（含 GFM、代码高亮、标题锚点）
- **进度打卡**：localStorage + 登录后自动同步到云端
- **认证与存储**：自研认证（scrypt 密码哈希 + httpOnly 会话 Cookie）+ Node 内置 node:sqlite（数据在 data/app.db）

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

生产构建：

```bash
pnpm build
pnpm start
```

## 目录结构

```
presales-academy/
├─ app/                    # 页面路由
│  ├─ page.tsx             # 首页
│  ├─ learn/               # 学习内容列表 + 文章页 [slug]
│  ├─ roadmap/             # 学习路线（能力树）
│  ├─ recruit/             # 秋招投递看板
│  ├─ quiz/                # 售前面经题库自测
│  ├─ api/                 # 认证与同步 API（register/login/logout/me/sync）
│  └─ about/               # 关于项目（演示叙事）
├─ components/             # UI 组件（搜索/打卡/看板/题库/登录）
├─ data/                   # 本地 SQLite（app.db，git 忽略）
├─ data/domains.ts         # 六大知识域定义
├─ lib/                    # 内容加载、Markdown、认证、数据库、云同步
└─ content/
   ├─ learn/<domain>/*.md  # 原创笔记（frontmatter 含来源/核实字段）
   ├─ quiz/*.md            # 面经题库（四类分类）
   └─ roadmap/presales.json# 能力树节点（JSON 数据驱动）
```

## 内容规范

每篇笔记 frontmatter 固定字段：`title / description / domain / order / tags / minutes / updated / source / verified`。
正文使用四段式模板：**📌 一句话结论 → 🧠 知识要点 → 💼 面试怎么问 → ✅ 自检清单**。

## 路线图（迭代计划，2026-09 秋招季优先）

- [x] M0 骨架 + M1 内容管线 + 六大域首批内容
- [x] M2 学习路线（能力树）交互与本地打卡
- [x] M4a 秋招投递看板（公司/岗位/状态/时间线，localStorage 起步）
- [x] M4b 题库自测（售前面经分类 12 题：行为面/方案面/技术广度/开放题）
- [x] M3 登录/注册 + 云端进度同步（自研 scrypt 认证 + httpOnly 会话 + node:sqlite）
- [ ] M5 演示打磨：SEO/OG、测试、部署、README + 1 分钟演示稿
- [ ] P2：AI 辅助 JD 解析 / 简历匹配、评论、PWA
