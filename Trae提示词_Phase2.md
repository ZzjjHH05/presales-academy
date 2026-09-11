# Trae 提示词 · Phase 2（公司库页面 · 前端实现）

> 使用方法：开一个**全新的 Trae 对话**，把下方代码块整块粘贴。
> 数据层已就绪并冻结：`data/companies.ts`（17 家，全部经实际访问验证），**Trae 只读不写数据文件**。
> 粘贴前确认：上一批未推送的提交（020b134 / 8efb29a）已 push（需要开代理）。

```text
# 角色
你是本仓库「售前学院」（presales-academy）的开发者。技术栈：Next.js 15.5（App Router）+ TypeScript + Tailwind；pnpm；Node ≥22.5。线上地址 https://zzjjhh05.com（香港服务器 Docker 部署）。

# 背景
仓库根目录《AI升级实施方案_Trae执行版.md》是完整实施计划。Phase 0（基线）、Phase 1（上线）已完成。本次只执行 **Phase 2：售前校招公司库的前端实现**。

# 关键前置事实
- 数据层已就绪：`data/companies.ts` 导出 `COMPANIES: Company[]`（17 家）、`DIRECTION_LABELS`、类型 `Company / CompanySource / HiringHistory / Direction`。**该文件已终审冻结，严禁修改**（注释里写着"由导师维护，Trae 只读不写"）
- 每家公司的 `sources[]` 是溯源链（kind: official/interview/repost）；`verifiedAt` 是核实日期；`status`（open=有来源表明在招 / unknown=未核实）；`careerUrlVerified` 标记链接是否经过实际访问验证
- 页面风格参照现有 `app/sources/page.tsx`（资料库页）与 `app/learn/page.tsx` 的列表布局；卡片配色参照 `data/domains.ts` 各域的 tailwind 类名风格
- 导航组件 `components/SiteHeader.tsx` 现有结构照旧，只加一个链接

# 任务（只做以下 5 件，按顺序）
1. **新建 `app/companies/page.tsx`（服务端组件，SSG）**：
   - 页面标题「售前校招公司库」+ 副标题说明数据口径："信息核实于 2026-09-10；招聘信息变动快，投递前请以各公司官网为准"
   - 公司卡片网格（参照 learn 页的 grid）：每卡显示——名称、business 一句话、directions 标签（用 DIRECTION_LABELS）、cities、**新鲜度徽章**（距 verifiedAt ≤7 天绿色「近期核实」/ 8-30 天黄色「30 天内核实」/ 更久灰色并显示日期）、status 徽章（open=「2027 届在招」（绿色系）/ unknown=「状态未核实」（灰色））
   - 每卡**固定外跳按钮「去官方投递 →」**（careerUrl，target=_blank + rel="noopener noreferrer"）；careerUrlVerified=false 的公司按钮旁加一行小字「链接由公告来源提供，如打不开请在官网搜索该公司校招」
   - hiringHistory 非空的公司卡内显示折叠的「2027 届时间线」小节（batches 列表或 note）
   - sources 展示为「来源」折叠区或底部小字链接列表（区分官方/面经/转载三种 kind 的小标签）
   - **严禁渲染 salaryBand 字段**（Gate 3 裁定不展示薪资，数据里该字段为空——类型上也要保证不出现薪资展示逻辑）
2. **筛选交互**（客户端子组件 `components/CompaniesExplorer.tsx`，参照 LearnExplorer 的模式）：按 direction 筛选（全部 + 六个方向，用 DIRECTION_LABELS）+ 按 status 筛选（全部/在招/未核实）。服务端取数传 props，交互在客户端
3. **投递看板集成**：`components/RecruitBoard.tsx` 的添加入口旁新增「从公司库添加」按钮 → 弹出公司选择列表（复用 COMPANIES 数据）→ 选中后预填 company（name）、position（留空让用户填）、link（careerUrl），其余字段走现有 add() 流程。注意 RecruitItem 结构（lib/use-recruit.ts）不许改，只做预填
4. **导航**：`components/SiteHeader.tsx` 加「公司库」入口（放在合适位置，与现有导航风格一致）
5. **自测与提交**：pnpm build 通过；本地 pnpm start 用 curl 验证 /companies 返回 200 且包含「售前校招公司库」字样（贴证据）；git commit -m "phase 2: company library page + recruit board integration"，并 push 到 origin

# 硬性约束
- `data/companies.ts` **一个字符都不许改**；不新增任何环境变量；不动后端/API/数据库
- 外链一律 target="_blank" rel="noopener noreferrer"
- 不写薪资展示逻辑（salaryBand 相关 UI 一律不出现）
- 代码风格与现有代码一致（中文 UI 文案、现有 tailwind 配色体系、服务端组件优先）
- 若发现代码现状与本提示不符，停下来报告，不要自行扩大改动范围

# 完成标准（逐条自检，最终回复给出证据）
1. /companies 页面 200，17 家公司全部渲染，筛选（方向 + 状态）工作正常
2. 新鲜度徽章与 status 徽章逻辑正确（today = 2026-09-10 起算，全部应为绿色「近期核实」）
3. 每张卡的外跳按钮指向该公司 careerUrl；天翼云（careerUrlVerified=false）有补充提示文案
4. 投递看板「从公司库添加」可用：选中公司后 company 与 link 字段自动预填
5. pnpm build 通过；commit 已推送

# 汇报格式（最终回复必须包含）
1. 变更文件清单（路径 + 一句话说明）
2. 完成标准逐条结果（✅/❌ + 证据）
3. 页面截图描述（卡片渲染结构、徽章样式的文字描述即可）
4. 需要我决策的事项
```

---

## Trae 完成后的验收清单（你/导师执行）

- [ ] `pnpm build` 独立复跑通过
- [ ] `/companies` 页面：17 家、筛选、徽章、外跳按钮逐项目视检查
- [ ] 投递看板「从公司库添加」→ 预填 → 保存 → localStorage 里有新条目
- [ ] `data/companies.ts` 零改动（`git diff HEAD~1 -- data/companies.ts` 为空）
- [ ] 手机访问布局正常（响应式）
- [ ] 服务器上线：`git pull && docker compose up -d --build`，手机流量访问 https://zzjjhh05.com/companies
