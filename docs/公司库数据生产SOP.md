# 公司库数据生产 SOP · 完整性与准确性保障方案

> 目的：让「售前校招公司库」的每一条数据**可溯源、可验证、可维护**。
> 本 SOP 是数据生产的唯一流程依据；数据文件 `data/companies.ts` 的每个字段都按此流程产生。

---

## 1 · 质量体系：一条红线 + 三道关卡

### 🔴 红线：无来源，不写数据
AI（任何 AI）**不允许凭"记忆"生成 URL、薪资、面经、时间线**。每个事实字段必须对应一条可点击的来源。搜不到官方来源的公司**不入库**，进 backlog——完整性靠"显式追踪未完成项"，不靠"假装完成"。

### Gate 1 · 溯源（写入时）
| 字段 | 允许的来源类型 |
|---|---|
| careerUrl | 官方域名页面（公司自有域名 / 官方招聘系统如 Moka） |
| status: open | 官方页面时间线，或高校就业网转载（标 `repost`） |
| interviewStyle | 已核实的面经帖（sources 里必须有对应链接） |
| salaryBand | **仅限公开 offer 帖**（牛客 offer 区 / OffersHow），并记 salarySource |
| hiringHistory | 官方校招页时间线（首选）或注明转载来源 |

### Gate 2 · 验证（写入后）
- `careerUrl` 必须**实际访问**（web fetch）确认 HTTP 200 且页面标题/内容与该公司一致 → `careerUrlVerified: true`
- 只搜到、未访问 → `careerUrlVerified: false`（页面显示"链接待验证"样式）
- fetch 失败 ≠ 链接死（部分站点反爬）：标 `false` 并在 SOP 日志注明，不删数据

### Gate 3 · 人工终审（入库前）
用户审核：公司增删、salaryBand 公开口径（是否展示、展示格式）、面经标注方式。**未经终审的批次不合并到 main。**

## 2 · 数据分层（决定维护频率）

- **稳定层**（按年变）：name / business / directions / cities / interviewStyle —— 一次核实，长期有效
- **波动层**（按周变）：careerUrl / status / verifiedAt / hiringHistory —— **只导航不追赶**：存官方链接 + 核实时间戳，页面上永远有"以官网为准"提示和外跳按钮
- **时效层**：verifiedAt 驱动新鲜度徽章（≤7 天绿 / ≤30 天黄 / >30 天灰）

## 3 · 验证日志（审计链）

### 2026-09-10 批量验证 · 结果：17 家入库

| 公司 | 验证动作 | 结果 |
|---|---|---|
| 奇安信 | fetch campus.qianxin.com/campus/graduates | ✅ 200，官方页含 2027 届完整时间线 |
| 新华三 | fetch career.h3c.com/campus/jobs | ✅ 200，官方校招页 |
| 深信服 | fetch hr.sangfor.com/campucompon/schoolRecruitment | ✅ 200，官方校招岗位页 |
| 绿盟科技 | fetch nsfocus.com.cn/campus/1_1.html | ✅ 200，官方页含 2027 时间线 + Moka 网申入口 |
| 华为 | fetch career.huawei.com/cn | ✅ 200，华为招聘官网 |
| 腾讯 | fetch join.qq.com | ✅ 200，腾讯校招官网 |
| 中兴通讯 | fetch job.zte.com.cn/cn/ | ✅ 200，官网含「2027届秋招 2026-08-31 启动」新闻 + 校招导航（营销类含客户经理/MKT-技术岗） |
| 联想 | fetch talent.lenovo.com.cn/home | ✅ 200，官方校招站；2027 届秋招公告（美院学生处转载）含网申时间 8/5-11/13 |
| 阿里巴巴 | fetch talent.alibaba.com（campus.alibaba.com 301 跳转至此） | ✅ 200，官方招聘官网；2027 届全球启动有兰州大学就业网转载 |
| 京东 | fetch campus.jd.com | ✅ 200，京东校招官网；2027 校招启动有山东就业网转载 |
| 字节跳动 | fetch jobs.bytedance.com/campus | ✅ 200，官方校招站（status: unknown——2027 售前岗未单独核实） |
| 百度 | fetch talent.baidu.com/campus/index | ✅ 官方域响应（登录门 JSON）；2027 届启动有南开就业网代发 |
| 天翼云 | fetch ctyun.hotjob.cn → wecruit.hotjob.cn | ⚠️ 403 反爬（招聘系统常见），URL 来自官方公告转载 → careerUrlVerified: false，浏览器实测为准 |
| 亚信安全 | fetch asiainfo-sec.jobs.feishu.cn/campus/ | ✅ 200，官方飞书招聘页 |
| 海康威视 | fetch campushr.hikvision.com（campus.hikvision.com ENOTFOUND） | ✅ 200，官方校招站；2027 校招进行中有南开转载 |
| 科大讯飞 | fetch iflytek.zhiye.com（campus.iflytek.com 跳转至此） | ✅ 200，官方招聘站；2027 届非凡计划有就业网转载 |
| 网易 | fetch campus.163.com | ✅ 200，网易校招官网（status: unknown） |

> **入库规模决策（用户裁定）**：目标 30 家；若"秋招已开放售前岗"的公司不足 30 家，降为 15 家。当前 17 家 ≥ 15 家门槛，**达标封版**，backlog 留待后续轮次扩充。

## 4 · Backlog（未入库公司与追查线索）

| 公司 | 状态 | 卡点 / 下一步线索 |
|---|---|---|
| 锐捷网络 | 2027 届秋招启动有南开就业网转载 | 官方入口未定位：campus.ruijie.com 不存在；下一步从官网 ruijie.com.cn 或官方公众号找网申系统 |
| 安恒信息 | 第三方平台显示有「售前解决方案专家」岗（27届） | campus.dbappsecurity.com.cn 不存在、主站 /campus 404；下一步查官方公众号「安恒fan」或网申系统 |
| 启明星辰 | 历史届校招有高校就业网记录 | topsec.com.cn/campus 301 无 Location；下一步查官网招聘板块或公众号 |
| 天融信 | 仅搜到 2024 届历史信息 | 官方入口未定位，观察 |
| 浪潮 | 仅高校就业网聚合页 | campus.inspur.com 不存在；下一步查浪潮集团官网人才板块 |
| 金山云 | 第三方平台有 27 届秋招记录 | 官方入口未定位 |
| 中科曙光 | 2027 届简章有南开就业网转载 | 官方入口未验证（本轮未尝试 fetch） |
| 金蝶 | 2027 届简章有南开就业网转载 | 官方入口未验证 |
| 用友 / 东软 / 神州数码 | 未启动验证 | 稳定层候补（软件/IT服务方向） |

> Backlog 处理节奏：每轮扩充 3-5 家（搜索 → fetch 验证 → 入库 → Gate 3），旺季（9-11月）每周可跑一轮。**换搜索方法**（用户提议）：可改用各公司官方微信公众号菜单、牛客企业主页（nowcoder.com/enterprise）的官方认证链接作为入口线索来源。

## 5 · 扩充流程（加一家公司的标准动作）

1. **搜索**：`"<公司名> <届别> 校园招聘 官网"`，只认官方域名结果
2. **访问**：fetch 候选 URL，确认 200 + 页面归属正确
3. **补稳定层**：business/directions/cities（公司公开信息）；interviewStyle 仅在找到面经时填
4. **补波动层**：careerUrl + verifiedAt + status（有来源才填 open）
5. **登记**：sources 数组写全；hiringHistory 按年归档只增不删
6. **过 Gate 3**：提交用户审核 → 合并

## 6 · 维护节奏

- **旺季（9-11 月）每周**：巡检各家 careerUrl 死链 + status 更新（新一轮搜索"XX 2027 秋招 补录"）
- **平季每月**：死链巡检一次即可
- **每年归档**：年底把当年 hiringHistory 固化（它就是下一届的预判依据——"去年绿盟 7 月 28 开网申"）

## 7 · 薪资带政策（Gate 3 已裁定：2026-09-10）

**不展示薪资。** 用户终审决定：薪资带一律不填、页面不渲染该字段——避免引战、过期与准确性风险。`salaryBand` 字段保留在类型定义中（未来若改变口径可启用），当前及后续扩充批次均留空。
