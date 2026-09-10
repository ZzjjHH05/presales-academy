# Trae 提示词 · Phase 1 · 服务器版（方案 B · 暂不执行）

> ⚠️ 状态（2026-09 修订）：当前已改走 **Vercel + Turso 免费路线**（见《Trae提示词_Phase1_Vercel版.md》）。本文件是**后期购买香港服务器时**的升级路径，现在不要执行。
>
> 使用方法：开一个全新的 Trae 对话，把下方代码块整块粘贴。
> 粘贴前必改：【我的域名】处填你买的域名（只填域名本身，不带 https:// 和 www.，例如 presales.cn）。
> 前置条件：已购买香港轻量服务器（Ubuntu 22.04）+ 域名并配好 A 记录。

```text
# 角色
你是本仓库「售前学院」（presales-academy）的开发者。技术栈：Next.js 15.5（App Router）+ TypeScript + Tailwind + node:sqlite；pnpm；Node ≥22.5。

# 背景
仓库根目录《AI升级实施方案_Trae执行版.md》是完整实施计划，Phase 0（基线整理）已完成并提交（commit 5f83348）。本次会话只执行 **Phase 1（部署上线 v0）的代码部分**。服务器上的实际部署操作由我手动完成——你负责把代码和部署物料准备好，最后输出一份我可以照抄的服务器命令清单。

# 我的信息
- 我的域名：【粘贴前必改——填你的真实域名，只填域名本身，不带 https:// 和 www.，例如 presales.cn】

# 任务（只做以下 5 件事，按顺序）
1. **核对部署物料与当前代码一致**：
   - 逐一读 Dockerfile / docker-compose.yml / Caddyfile，核对：镜像内 Node 版本与 package.json engines（≥22.5）一致、用 pnpm 安装依赖、build/start 命令正确、数据卷挂载 ./data:/app/data 存在
   - 把 Caddyfile 里的域名占位符（your-domain.com）全部替换为我的域名
   - 发现不一致就修复，并在汇报中说明改了什么、为什么
2. **SEO 基础**：
   - app/layout.tsx 补全 metadata：metadataBase（用我的域名）、title 模板（「%s · 售前学院」）、站点级 description、openGraph 卡片（标题/描述/locale zh_CN）
   - 新建 app/sitemap.ts：静态列出全部公开路由（/、/learn、/roadmap、/recruit、/quiz、/about、/sources），并用 lib/content.ts 的 getAllArticles() 为每篇笔记生成 /learn/<slug> 条目
   - 新建 app/robots.ts：允许全部公开页，Disallow /api
   - 新建 app/icon.svg：品牌色 + 简洁图形（如「售」字或书本/靶心意象），作为 favicon
3. **部署文档增补**：在 deploy/README.md 末尾新增一节「AI 网关环境变量」：上线后需在服务器项目根目录创建 .env，写入 AI_API_KEY / AI_BASE_URL / AI_MODEL（参考 .env.example），Phase 4 起生效；提醒 .env 已被 gitignore，不会入库
4. **自测**：pnpm build 通过；然后本地 pnpm start，用 curl 验证 /sitemap.xml 返回 XML、/robots.txt 返回规则文本（贴出片段作为证据），验证完停掉服务
5. **提交**：git add 相关文件（不含 data/*.db），commit message：`phase 1: deploy assets + seo metadata`

# 硬性约束
- 只做上述 5 件事；不改业务逻辑代码、不动 data/ 与 content/ 的内容、不实现任何 AI 功能
- 域名只允许出现在 Caddyfile 与 metadata 配置中，不许硬编码进组件或业务代码
- 若发现与我描述不符的代码现状，停下来报告，不要自行扩大改动范围

# 完成标准（逐条自检，并在最终回复中给出证据）
1. Caddyfile 中不再出现 your-domain.com 占位符
2. pnpm build 通过
3. /sitemap.xml 与 /robots.txt 本地可访问且内容正确
4. git log 出现 phase 1 提交

# 汇报格式（最终回复必须包含）
1. 变更文件清单（路径 + 一句话说明）
2. 完成标准逐条结果（✅/❌ + 证据）
3. **服务器命令清单**：从「SSH 登录」到「docker compose up -d --build」再到「上线验收」的完整步骤，按顺序编号、域名替换为我的真实域名，保证我可以逐条照抄执行
4. 需要我决策的事项
```

---

## Trae 完成后，你在服务器上手动做的事

（Trae 汇报里也会给一份定制版命令清单，二选一照抄即可；这里是通用版流程对照）

1. `ssh root@服务器IP` → 按 deploy/README.md §1 装 Docker
2. `git clone` 你的 GitHub 仓库 → `cd presales-academy`
3. `docker compose up -d --build` → 等 2-3 分钟
4. 验收四件事：
   - 浏览器开 `https://你的域名` 首页正常
   - 注册账号 → 打卡一篇 → 换手机/另一个浏览器登录 → 进度还在
   - 手机扫码访问正常
   - `docker compose logs app` 无报错
