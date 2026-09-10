# 售前学院 · 部署手册

**当前主路线：「方案 B：香港服务器 Docker」（已购腾讯云香港轻量服务器）。**
「方案 A：Vercel + Turso」全套保留为备用路径（代码零改动即切回，见下）。
两套物料都在仓库里，互不干扰。

---

## 方案 A：Vercel + Turso（当前路线）

> 目标：把仓库接到 Vercel（免费 Hobby 档）+ Turso 托管数据库，零成本上线 `https://xxx.vercel.app`，后期可接自定义域名。
> Vercel serverless 没有持久文件系统，所以生产数据库用 Turso（libSQL 托管，免费档对个人项目够用）；本地开发仍用 `data/app.db` 零配置。

### A0. 前置准备（账号）
- 一个 GitHub 账号，且本仓库已推上去（`git remote -v` 能看到 origin）。
- 一个 Vercel 账号（用 GitHub 登录最快）：https://vercel.com
- 一个 Turso 账号（可用 GitHub 登录）：https://turso.tech

### A1. Turso：创建数据库并拿到凭据

**方式一（推荐，零安装）：网页控制台**
1. 开代理打开 https://app.turso.tech/signup → 用 GitHub 登录（首次会让你创建组织，名字随意）
2. Databases → **Create database** → 名字填 `presales` → Group/位置用默认（或选新加坡）→ 创建
3. 点进数据库详情页 → 复制连接 URL（形如 `libsql://presales-<你的组织>.turso.io`）
4. 在库详情页或其 Settings/Token 入口点 **Create token** → 复制长令牌（只显示一次，存好）

**方式二（备选，官方 CLI；Windows 需先装 WSL）：**
```bash
# Windows：管理员 PowerShell 执行 wsl --install 并重启进入 WSL 后：
wsl
# macOS/Linux/WSL 通用（注意：旧的 install.ps1 已下线 404，勿再用）：
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create presales
turso db show presales --url
turso db tokens create presales
```
记下两个值：`TURSO_DATABASE_URL`、`TURSO_AUTH_TOKEN`。

### A2. Vercel：导入仓库并配置环境变量
1. 打开 https://vercel.com → 右上角 **Add New...** → **Project**。
2. 在 **Import Git Repository** 列表里选 `presales-academy`（没看到就点 **Adjust GitHub App Permissions** 给 Vercel 授权访问该仓库）。
3. 框架预设会自动识别为 **Next.js**，**Root Directory** 保持默认（仓库根），**Build Command / Output Directory** 都不用改。
4. 展开 **Environment Variables**，逐个填入（Production / Preview / Development 三栏都勾，或只勾 Production 也行）：
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | 先填 Vercel 部署后会分配的 `https://<project>.vercel.app`（第一次可先留空或填占位，部署拿到域名后再回来改） |
   | `TURSO_DATABASE_URL` | 上一步 `turso db show --url` 的值 |
   | `TURSO_AUTH_TOKEN` | 上一步 `turso db tokens create` 的值 |
   | `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` | 如有 AI 网关密钥再填，没有可先不填 |
5. 点 **Deploy**，等构建跑完（首次约 1-2 分钟）。看到 **Congratulations** 即上线成功。
6. 回到 Vercel 项目 **Settings → Domains** 复制分配的 `*.vercel.app` 域名，再进 **Settings → Environment Variables** 把 `NEXT_PUBLIC_SITE_URL` 改成该域名并 **Redeploy**（让 sitemap / robots 里的 URL 用对正式域名）。

### A3.（强烈建议，可后补）自定义域名
1. 在域名注册商/Cloudflare DNS 加一条 CNAME：
   - 主机记录：`pa`（或 `@`）
   - 目标：`cname.vercel-dns.com`
2. Vercel 项目 **Settings → Domains → Add**，输入你的域名，按提示完成 DNS 验证（Vercel 自动签 HTTPS 证书）。
3. 回 **Settings → Environment Variables** 把 `NEXT_PUBLIC_SITE_URL` 更新为 `https://你的域名` → **Redeploy**。

### A4. 上线验收（对应简历故事）
1. 浏览器打开线上地址 → 首页正常、样式正常、靶心 favicon 可见。
2. 注册一个账号 → 打卡/做题 → **换浏览器或手机** 登录 → **进度还在**（证明 Turso 同步生效）。
3. Vercel 项目 **Deployments → 最新一次 → Logs** 无报错；`/sitemap.xml` 返回 XML、`/robots.txt` 返回规则文本。
4. 收尾：把线上链接放进简历/投递看板。

### A5. Vercel 方案常见问题（FAQ）
- **注册/登录 500 / `no such table`**：多半是没配 `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN`，或配了但没 Redeploy；表是首次启动自动建的，确认环境变量在 Production 生效。
- **sitemap 里 URL 是 localhost**：`NEXT_PUBLIC_SITE_URL` 没配正式域名，改完务必 Redeploy。
- **数据库要重置**：`turso db shell presales` 进去 `DROP TABLE users; DROP TABLE sessions; DROP TABLE sync_blob;` 退出，重启应用即自动重建。
- **免费额度够吗**：Turso 免费档 500 库 / 9GB / 10 亿次读 + 2500 万次写每月，个人项目远够用；Vercel Hobby 档 100GB 带宽 / 100h serverless 执行，秋招期绰绰有余。

### A6. 面试可以讲的"部署故事"（Vercel 路线）
> "上线我做了三个关键决策：**① 为什么 Vercel + Turso 而不是自建服务器**——serverless 零运维、Hobby 档免费、Git 推送即自动部署，秋招期一个人能 hold 住；**② 为什么生产数据库换 Turso**——Vercel serverless 无持久文件系统，SQLite 本地文件生产行不通，Turso 是 libSQL 托管，本地开发仍用 file 模式零配置、生产切托管只换两个环境变量；**③ 为什么先 Vercel 后服务器**——先免费上线让简历有链接可放，后期买服务器再切 Docker 方案，代码一套两部署都不丢。"

---

## 方案 B：香港服务器 Docker（后期升级可选）

> 目标：一台香港/海外轻量服务器 + 一个便宜域名 → `https://你的域名` 线上可用，简历可放链接。
> 全程无需 ICP 备案（服务器在境外即免备案）。预计 1-2 小时（不含买服务器/域名的时间）。

---

## 0. 先买东西（推荐清单）

### 服务器（选一台，推荐按顺序）
| 方案 | 价格 | 适合 | 说明 |
|---|---|---|---|
| **腾讯云 轻量应用服务器（香港）** ⭐推荐 | 新用户活动约 ¥50-100/首年 | 首次部署 | 国内直连快（延迟 ~50ms）、免备案、控制台简单；2C2G 或 2C4G，系统选 **Ubuntu 26.04 LTS**（22.04/24.04 亦可，26.04 维护期最长） |
| 阿里云 轻量应用服务器（香港） | 同价位活动 | 已有阿里账号 | 体验类似腾讯云，看哪个活动便宜 |
| 雨云 / 狗云 / RackNerd 等廉价 VPS | 约 ¥200-400/年 | 预算极紧 | 便宜但稳定性一般，线路看运气 |
| Vultr / DigitalOcean（东京/新加坡） | 约 $6-12/月 | 兼顾海外访问 | 按小时计费，可随时销毁；国内访问时快时慢 |

> 选型理由（面试可以说）：**国内面试官为主 → 香港轻量（免备案 + 国内快）；学生预算 → 活动价；要省心 → 云厂商轻量**。
> 2C2G 足够跑 Next.js + SQLite 个人项目；不用选高配。

### 域名（选一个）
| 方案 | 价格 | 说明 |
|---|---|---|
| **Cloudflare Registrar 注册 .com** ⭐推荐 | ~$10/年（成本价） | 无套路续费不涨价，自带免费 DNS + CDN；中文界面需切换 |
| 腾讯云 DNSPod / 阿里云万网 注册 .com | 首年活动约 ¥30-50，续费约 ¥70-90 | 国内平台，顺手实名即可（实名≠备案） |
| .cn 域名 | 约 ¥30/年 | 便宜但需实名，且后缀对国际观感略弱，不优先 |

> 注意：**域名在国内注册商买 + 服务器在境外 = 不需要 ICP 备案**，只是买域名时做个实名认证。
> 域名挑 **`你的名字/缩写`** 相关、好念好记的，例如 `preshu.com`、`yingshou.dev` 这类。

---

## 1. 服务器初始化（首次登录）

```bash
# SSH 登录（Windows 用 PowerShell 或终端软件）
ssh root@服务器公网IP
# 或腾讯云控制台「登录」按钮直接进 WebShell

# 更新系统 + 装 Docker
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker --version   # 确认装好
```

> 云厂商轻量服务器默认开放了 22/80/443，一般不用改防火墙；若访问不通先查控制台「防火墙/安全组」。

## 2. 把项目弄上服务器

方式任选（推荐 ①）：
```bash
# ① 服务器上直接 git clone（如果已把项目推到 GitHub）
git clone https://github.com/你的用户名/presales-academy.git
cd presales-academy

# ② 或本地打包上传（没配 git 时）
#    本地 PowerShell：scp -r D:\dsh\presales-academy\* root@IP:/root/presales-academy/
```

## 3. 配置域名

1. 到域名注册商/Cloudflare 控制台，给域名加一条 **A 记录**：
   - 主机记录：`@`（和 `www`，可加一条）
   - 记录值：**你的服务器公网 IP**
   - 类型：A
2. 等 DNS 生效（几分钟到 1 小时；可用 `ping 你的域名` 或 [dnschecker.org](https://dnschecker.org) 看是否指向你的 IP）。
3. 修改 `Caddyfile`：把 `your-domain.com` 换成你的真实域名。

## 4. 启动

```bash
cd presales-academy

# 先配环境变量（构建 sitemap/OG 要用正式域名；AI Key 到 Phase 4 再回来填）
cp .env.example .env
nano .env        # 把 NEXT_PUBLIC_SITE_URL=https://你的域名 填好，保存退出

# 确认 Caddyfile 里的域名已替换为真实域名（见上一步）
docker compose up -d --build
docker compose ps          # 两个容器都 Up 即成功
docker compose logs -f app # 看应用日志（首次会打印 Next.js ready）
```

> `.env` 会被 compose 自动注入容器（env_file），且已被 .gitignore/.dockerignore 双重排除——密钥不进 git、不进镜像。

> HTTPS 证书是 Caddy **自动签发**的：第一次访问 https://你的域名 时它会自动申请 Let's Encrypt 证书，稍等 30 秒即可，无需手动配置。

## 5. 上线验收（对应简历故事）

1. 浏览器打开 `https://你的域名` → 首页正常、样式正常
2. 注册一个账号 → 打卡 → 换浏览器（或手机）登录 → **进度还在**（证明 SQLite volume 持久化生效）
3. 手机扫码访问（后续做了 PWA 体验更佳）
4. `docker compose logs app` 无报错

## 6. 日常运维速查

| 操作 | 命令 |
|---|---|
| 看日志 | `docker compose logs -f app` |
| 重启 | `docker compose restart app` |
| 更新代码后重新部署 | `git pull && docker compose up -d --build` |
| 备份数据 | `docker compose exec app sh -c 'cat /app/data/app.db' > backup-$(date +%F).db`（停服更稳） |
| 换域名/证书 | 改 Caddyfile → `docker compose restart caddy` |

## 7. 常见问题（FAQ）

- **打开是 502/连不上**：八成是 DNS 没生效，或服务器防火墙没放行 80/443。
- **注册/登录报错**：看 `docker compose logs app`；多半是 `data/` 目录权限问题（确认 volume 挂载）。
- **重启后数据丢了**：检查 compose 里 `./data:/app/data` 是否在（数据在宿主机 `presales-academy/data/`）。
- **国内访问慢**：确认买的是香港/亚太节点；不要用欧美机器直连演示。

---

## 8. 面试可以讲的"部署故事"

> "上线我做了三个关键决策：
> **① 为什么香港服务器**——国内面试官演示要快，且境外服务器免 ICP 备案，省 2-3 周备案周期；
> **② 为什么 Caddy 而不是 nginx**——自动签 Let's Encrypt 证书，零配置 HTTPS，个人项目性价比最高；
> **③ 为什么 Docker volume 挂 SQLite**——`node:sqlite` 无外部依赖，但数据要持久化，所以把 `data/` 挂到宿主机；
> 上线后我在手机和电脑换着登录验证了跨设备同步，确认数据真的没丢。"
