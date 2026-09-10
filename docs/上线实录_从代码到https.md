# 《售前学院》上线实录 · 从代码到 https://zzjjhh05.com

> 记录 2026-09 秋招季一次真实的全栈部署全过程：决策、步骤、踩坑、排障。
> 用途：自己复盘、面试素材、后人照做。所有命令均实际执行过。

---

## 1 · 架构总览（最终形态）

```
访客
  → https://zzjjhh05.com（腾讯云 DNSPod 注册，子域名可无限扩展）
  → DNS A 记录 → 150.109.157.242（腾讯云轻量·香港 2C2G，Ubuntu 26.04 LTS，¥38/月）
  → 云防火墙放行 22/80/443
  → Caddy 容器（自动申请+续期 Let's Encrypt 证书，80 自动 308 跳 https，www 跳主域）
  → app 容器（Next.js 15.5，@libsql/client 本地 file 模式）
  → SQLite 数据卷 ./data:/app/data（注册用户/打卡/看板数据持久化）
```

**代码线**：本地开发 → git push GitHub（github.com/ZzjjHH05/presales-academy）→ 服务器 git pull → docker compose up -d --build。

**为什么这套选型**（面试标准答案，每条都真实发生过）：
- 香港轻量：免 ICP 备案（大陆服务器 80/443 要备案，2-4 周）、大陆延迟 ~50ms、学生价
- Docker：本地/服务器环境一致，"在我电脑上是好的"永不发生
- Caddy：零配置 HTTPS——证书自动申请自动续期，不用手动管
- SQLite + volume：个人项目零外部数据库依赖，数据在宿主机，容器随便重建
- 纯净系统镜像不用宝塔：自己装的每一层都认得，出问题知道从哪查

## 2 · 上线步骤实录（可照抄）

### 2.1 采购清单
| 项 | 规格 | 价格 |
|---|---|---|
| 腾讯云轻量服务器 | 香港 · 2C2G · 40G SSD · 20Mbps · 0.5TB/月，Ubuntu 26.04 LTS 纯净镜像，免密登录 | ¥38/月（先买 2 个月试跑） |
| 域名 | zzjjhh05.com（DNSPod 注册，实名认证≠备案） | 首年几十元 |

### 2.2 服务器初始化（一次性）
```bash
apt update && apt upgrade -y                 # 安全更新，公网机器必做
curl -fsSL https://get.docker.com | sh       # 官方脚本装 Docker
systemctl enable --now docker                # 开机自启
git clone https://github.com/ZzjjHH05/presales-academy.git
# swap：2G 内存跑 next build 峰值 1.5G+，防 OOM 的标准操作
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2.3 DNS 与防火墙
- DNSPod 加两条 A 记录：`@` 和 `www` → 服务器公网 IP（分钟级生效，`Resolve-DnsName` 可验）
- **轻量服务器防火墙必须手动放行 443**（默认模板没开——本次最大的坑，见 §3）

### 2.4 启动与验收
```bash
cd presales-academy
cp .env.example .env && nano .env   # NEXT_PUBLIC_SITE_URL=https://zzjjhh05.com
docker compose up -d --build        # 服务器构建约 3-5 分钟
docker compose ps                   # app(healthy) + caddy(Up)
docker compose logs caddy           # 等 certificate obtained successfully
```
验收四件套：① https 首页+绿锁 ② 注册→打卡 ③ 手机流量登录同账号进度还在 ④ www 自动跳主域。

## 3 · 踩坑实录（按发现顺序）

### 坑 1：空环境变量炸了构建
- **现象**：服务器 `docker compose up --build` 在 `pnpm build` 崩：`Invalid URL, input: ''`
- **根因**：`.env` 里 `NEXT_PUBLIC_SITE_URL=` 留空 → compose 传入"存在但为空"的变量 → 代码 `??` 兜底只防"不存在"不防"空字符串" → `new URL("")` 崩溃。本地验收没发现是因为本地压根没设这个变量，走了 `??` 分支
- **修复**：`??` → `||`（三处：layout.tsx / sitemap.ts / robots.ts），并在本地**复现服务器条件**（设空变量跑 build）验证后才推送
- **教训**：⚠️ `process.env.X ?? fallback` 和 `process.env.X || fallback` 在"变量存在但为空"时行为不同；边界条件要在**与生产一致的环境变量状态**下测

### 坑 2：Caddyfile 是占位符，证书申请对着假域名空转
- **现象**：日志疯狂报 `your-domain.com` 的 403/ALPN 错误
- **根因**：配置文件在 GitHub 上已换成真域名，但**容器还在用启动时加载的旧配置**——`git pull` 拉了新文件，Caddy 不会自动重读
- **修复**：`docker compose restart caddy`
- **教训**：容器化服务的配置更新 = 改文件 + **重启容器**，缺一不可

### 坑 3：云防火墙默认不放行 443（本次耗时最长的坑）
- **现象**：`docker compose ps` 一切正常、本机 curl 正常，但公网 HTTPS 超时
- **定位**：逐层探测——TCP 80 通 / HTTP 返回 308（证明应用健康）/ **TCP 443 不通** → 问题锁定在云防火墙
- **修复**：控制台 → 防火墙 → 添加规则：TCP 443，来源 0.0.0.0/0
- **教训**：**容器端口映射正常 ≠ 公网可达**，中间还有云厂商防火墙这一层；腾讯轻量默认模板只开 22/80

### 坑 4：我的检测工具本身是坏的（对照实验的价值）
- **现象**：证书已到手，但 HTTPS 探测全部报"接收时关闭"
- **定位**：**对照实验**——用同样的工具访问百度/gitee，报一模一样的错 → 是探测环境 TLS 栈坏了，不是网站坏了。服务器日志 `certificate obtained successfully` 才是真相
- **教训**：**怀疑工具本身**是排障的最后一步但必须有——"尺子不准，量什么都是错的"；对照组（已知正常的对象）是隔离变量的标准手法

### 坑 5：Turso 的 PowerShell 安装脚本 404
- **现象**：`irm https://get.tur.so/install.ps1 | iex` 返回 GitHub Pages 404
- **根因**：官方下线了该脚本，Windows 只剩 WSL 路线（当时查证：网页控制台已能建库拿 token）
- **教训**：**过时的不是你，是教程**——第三方安装方式说变就变，以官方文档为准；修完顺手把仓库文档改对（已提交），让下一个人不踩

## 4 · 排障方法论（可迁移的五步）

1. **看报错先找"主角"**：错误信息里的域名/IP/文件名，一眼暴露"它在对谁操作"（坑 2 的 your-domain.com）
2. **逐层探测，哪层断了修哪层**：DNS → 云防火墙 → 端口 → 容器 → 应用配置，每层独立验证，不叠罗汉
3. **日志是唯一真相源**：容器世界的 `docker compose logs`，比任何外部猜测都可靠
4. **对照实验隔离变量**：怀疑工具就测已知正常的对象（坑 4 靠这招避免了一场白折腾）
5. **修复必须在复现条件下验证**：改完代码，先在本地造出和服务器一样的条件跑通，再推送（坑 1 的教训）

## 5 · 日常运维速查

| 场景 | 命令 |
|---|---|
| 改代码后更新网站 | 本地 `git push` → 服务器 `git pull && docker compose up -d --build` |
| 看日志 | `docker compose logs -f app`（应用）/ `-f caddy`（代理） |
| 重启 | `docker compose restart app`（或 caddy） |
| 备份数据库 | `docker compose exec app sh -c 'cat /app/data/app.db' > backup-$(date +%F).db` |
| 查容器状态 | `docker compose ps`（看 healthy/Up） |
| 证书问题 | `docker compose logs caddy --tail 30` 找 certificate obtained |

**续费日历**：服务器 2 月期（11 月初到期前续费！面试季别断线）；域名每年一续。

## 6 · 待办（Phase 1 收尾遗留）

- [ ] 手机日历：服务器续费提醒（11 月初）+ 域名续费（次年）
- [ ] 简历/投递看板放入 https://zzjjhh05.com
- [ ] （可选）把仓库设为 Public 便于面试官看代码 + commit 历史
- [ ] Phase 4 时回来填 AI_API_KEY 到服务器 .env 并 rebuild
