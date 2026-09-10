# CONTEXT — 售前学院 presales-academy 速查

> 给未来的自己 / 协作方快速上手用。完整运行手册与踩坑记录已存 Hindsight 记忆。

## 这是什么
面向售前/解决方案工程师岗位的**个人学习 + 求职工具 + 面试演示**全栈站。
路径 `D:\dsh\qiuzhao`（2026-09 已由 presales-academy 整体迁入），开发地址 http://localhost:3000。

## 技术栈
Next.js 15.5.25 (App Router) + TypeScript + Tailwind + gray-matter/remark/rehype 内容管线 + 自研认证(scrypt+httpOnly cookie) + Node 内置 node:sqlite。包管理用 **pnpm**（npm 本机不可用）。

## 已实现
- 学习内容 19 篇（六大域）/ 学习路线 19 节点能力树 + 打卡 / 投递看板 / 题库 12 题 / 登录+云端进度同步 / 资料库 40+ 链接
- 数据在 `data/app.db`（SQLite）；localStorage 键 `pa-progress-v1` / `pa-quiz-v1` / `pa-recruit-v1`

## 运行
```bash
pnpm dev    # http://localhost:3000（在 DSH 沙箱下需提权后台跑）
pnpm build  # 生产构建
```
⚠️ **build 和 dev 不能同时跑**（共用 .next 会冲突致 500）。dev server 会周期性自己挂掉，打不开就重启。

## 里程碑
M0-M4b、M3 ✅ 完成；下一步 **M5 部署上线 + 换托管数据库**（真云端）、P2 AI 辅助。

## 内容规范
每篇 frontmatter 含 `title/description/domain/order/tags/minutes/updated/source/verified`；正文四段式（📌结论→🧠要点→💼面试怎么问→✅自检清单）；从网络整理的内容：真实 source 链接 + `verified: false`（待人工核实）。
