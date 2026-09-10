# 售前学院 · 部署手册（第一次上线版）

> 目标：一台香港/海外轻量服务器 + 一个便宜域名 → `https://你的域名` 线上可用，简历可放链接。
> 全程无需 ICP 备案（服务器在境外即免备案）。预计 1-2 小时（不含买服务器/域名的时间）。

---

## 0. 先买东西（推荐清单）

### 服务器（选一台，推荐按顺序）
| 方案 | 价格 | 适合 | 说明 |
|---|---|---|---|
| **腾讯云 轻量应用服务器（香港）** ⭐推荐 | 新用户活动约 ¥50-100/首年 | 首次部署 | 国内直连快（延迟 ~50ms）、免备案、控制台简单；2C2G 或 2C4G，系统选 **Ubuntu 22.04** |
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

## 4. 启动（一行命令）

```bash
cd presales-academy
docker compose up -d --build
docker compose ps          # 两个容器都 Up 即成功
docker compose logs -f app # 看应用日志（首次会打印 Next.js ready）
```

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
