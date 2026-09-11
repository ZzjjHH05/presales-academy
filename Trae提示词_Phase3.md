# Trae 提示词 · Phase 3（学练闭环：题库扩容 + 错题跳笔记）

> 使用方法：开一个**全新的 Trae 对话**，把下方代码块整块粘贴。
> 本 Phase 特殊点：**题目内容需要人工终审**——Trae 出完题后必须停下等你审核，审核通过才算完成。
> 参考文件：现有题库 `content/quiz/*.md`（12 题的四段式格式）、笔记管线 `lib/quiz.ts`、答题组件 `components/QuizApp.tsx`。

```text
# 角色
你是本仓库「售前学院」（presales-academy）的开发者。技术栈：Next.js 15.5（App Router）+ TypeScript + Tailwind；pnpm。线上地址 https://zzjjhh05.com。

# 背景
仓库根目录《AI升级实施方案_Trae执行版.md》是完整实施计划。Phase 0/1/2 已完成上线。本次只执行 **Phase 3：学练闭环**——题库扩容 + 每题挂钩笔记 + 答错可跳转复习 + 结果页薄弱域提示 + 技术域补 3 篇笔记。

# 关键前置事实
- 题库管线 `lib/quiz.ts`：frontmatter 字段 category/question/hint/minutes，正文是参考答案；当前 12 题在 `content/quiz/`
- 笔记 slug 是文件名（如 content/learn/core/solution-five-steps.md 的 slug 是 solution-five-steps）；全部真实 slug 列表用 lib/content.ts 的 getAllArticles() 可得
- 四类题型定义在 `data/quiz-categories.ts`（behavior/solution/tech/open）
- 答题组件 `components/QuizApp.tsx` 现有交互逻辑保持，只做增强

# 任务（按顺序，共 5 件）

## 1. lib/quiz.ts：QuizQuestion 增加 relatedNotes 字段
- frontmatter 新增可选字段 `relatedNotes: string[]`（相关笔记 slug 列表）
- 读取时**过滤为真实存在的 slug**（用 getAllArticles() 的 slug 集合做白名单过滤——不存在的 slug 直接丢弃，不报错）
- 类型定义同步更新

## 2. 题库 12 → 30 题（content/quiz/*.md）
新增 18 个文件，严格遵循现有题目的 frontmatter 与正文格式（先读 behavior-star-project.md 和 tech-iaas-paas-saas.md 作为格式样板）：
- behavior 类共 8 题（现有 3 + 新增 5）：冲突处理、失败经历、学习能力、团队合作、压力应对
- solution 类共 8 题（现有 3 + 新增 5）：需求澄清、方案设计、价格谈判、竞品应对、客户异议
- tech 类共 8 题（现有 3 + 新增 5）：网络基础、数据库、安全、容器、灾备（对应下述新增笔记）
- open 类共 6 题（现有 3 + 新增 3）：AI 对售前的影响、职业规划、为什么选售前不选开发
- **每题 frontmatter 至少 1 个 relatedNotes**（指向 content/learn/ 里真实存在的 slug；技术类新题优先指向本次新增的 3 篇笔记）
- 正文参考答案保持现有风格：要点式、有「售前向加分」或「避坑」提示、面向应届生
- 文件命名：`behavior-<主题>.md` / `solution-<主题>.md` / `tech-<主题>.md` / `open-<主题>.md`

## 3. 技术广度域补 3 篇笔记（content/learn/tech/）
严格按现有笔记的 frontmatter 规范（title/description/domain/order/tags/minutes/updated/source/verified——参考 tech/cloud-and-virtualization.md 的写法）与四段式正文模板（📌一句话结论 → 🧠知识要点 → 💼面试怎么问 → ✅自检清单）：
- `network-fundamentals.md`：网络基础（TCP/IP 分层、HTTP/HTTPS、DNS、常见端口——售前对话够用级别）
- `database-basics.md`：数据库常识（关系型 vs NoSQL、索引为什么快、事务 ACID、主从/集群——能和客户聊的深度）
- `security-basics.md`：安全入门（等保、防火墙/WAF/IDS 概念区别、加密与证书、零信任——售前安全对话常识）
- domain: tech，order 顺延现有编号，verified: false（source 注明「AI 起草初稿（待人工复核）」——这是内容管线既有惯例，见 recruitment-timeline.md）
- 同步在 `content/roadmap/presales.json` 注册 3 个新节点（tech-5/6/7，article 指向对应 slug）

## 4. QuizApp 增强（components/QuizApp.tsx）
- **答错后**：显示「📖 复习对应笔记」链接（题目 relatedNotes 的第一个 slug → /learn/<slug>，多个时全部显示）
- **结果页**：按四类统计正确率，正确率最低的类别标注「薄弱项」，旁边给「去复习」链接（指向该类题目 relatedNotes 里出现频次最高的笔记）
- 现有的答题流程、评分、localStorage 持久化（pa-quiz-v1）逻辑一律不动

## 5. 自测与提交
- pnpm build 通过
- 本地验证：写一个临时 Node 脚本或用现有代码路径断言「30 题、每题 relatedNotes 非空且全部是真实 slug」（贴输出证据，然后删掉临时脚本）
- ⚠️ **提交前必须暂停：把 30 题的题干清单 + 每题 relatedNotes + 3 篇新笔记的标题发给用户终审，等确认后才执行 git commit**
- 确认后：git commit -m "phase 3: quiz expansion 12->30 + relatedNotes + weak-domain review + 3 tech notes"，并 push

# 硬性约束
- 不动 lib/content.ts、lib/db.ts、lib/cloud.ts、data/ 目录任何文件（roadmap JSON 除外——只增 3 个节点）
- 答题与同步的既有逻辑（pa-quiz-v1 结构）不许改
- 新增内容全部中文、面向应届售前求职者、不得编造具体公司/薪资/数据
- 若发现代码现状与本提示不符，停下来报告

# 完成标准（逐条自检，最终回复给出证据）
1. 题库 30 题（behavior 8 / solution 8 / tech 8 / open 6），每题 relatedNotes 有效（白名单过滤后非空）
2. 3 篇新笔记 + roadmap 3 个新节点
3. 答错显示复习链接；结果页有薄弱类提示
4. pnpm build 通过；临时断言脚本输出 30/30
5. 内容终审通过后才 commit + push

# 汇报格式（最终回复必须包含）
1. 变更文件清单
2. 完成标准逐条结果（✅/❌ + 证据）
3. **30 题题干清单**（编号 + 类别 + 题干一行 + relatedNotes slug）供终审
4. 3 篇新笔记标题 + description 一行
5. 需要用户决策的事项
```

---

## Trae 暂停时你要做的（内容终审，约 15 分钟）

Trae 会把 30 题清单发给你，审核三件事：
1. **题干质量**：有没有太水/太偏的题？删或改（直接回复它改哪几题）
2. **relatedNotes 挂得对不对**：行为题挂 STAR 笔记、方案题挂五步法笔记——错挂的指出来
3. **3 篇技术笔记的深度**：目标读者是“能和客户聊”的售前，不是背八股的开发——太深的段落让它删

## Trae 完成后的验收清单（导师执行）

- [ ] 独立 pnpm build
- [ ] /quiz 页 30 题可见，答错一题看「复习对应笔记」链接真实可达
- [ ] 结果页薄弱域提示正常
- [ ] /learn/tech/ 三篇新笔记渲染正常、frontmatter 合规
- [ ] /roadmap 三个新节点可打卡
- [ ] 服务器上线后手机复测
