/**
 * Phase 6 · AI 模拟面试 —— 降级引擎（纯服务端，禁止 import 进客户端组件）。
 *
 * 当 AI 无 Key / 超时 / 校验失败时，网关返回本函数产出的同构结果，
 * 前端 UI 形态一致——「降级不降体验」（同 P5 范式）。
 *
 * 设计：
 *  - generateFallback：从 getQuiz() 里筛所选类别的题，随机起点轮转抽 3 题
 *    （不足 3 题时用全题库补齐），relatedNotes 复用 quiz 已白名单过滤的 slug。
 *  - reviewFallback：按题型返回站内方法论 rubric 模板（STAR / 五步法 / 技术三段 / 开放三段），
 *    strengths 给 1 条通用真实项，improvements 与 referencePoints 用 checklist，relatedNotes 用真实 rubric slug。
 *
 * 纯库实现，依赖 lib/quiz.ts（内部用 node:fs），仅服务端使用。
 */
import { getQuiz } from "./quiz";
import type { QuizCategory } from "@/data/quiz-categories";
import type { InterviewQuestion, ReviewOutput } from "./interview-schema";

/** rubric 接地的真实 slug（已核实存在，与笔记一一对应）。 */
const RUBRIC_NOTES: Record<QuizCategory, string[]> = {
  behavior: ["interview-question-types", "communicate-as-presales"],
  solution: ["solution-five-steps"],
  tech: ["tech-breadth-map"],
  open: ["presales-overview"],
};

/** 每个题型的 rubric 模板：structure 一句话 + improvements/referencePoints checklist。 */
const RUBRIC: Record<
  QuizCategory,
  {
    structure: string;
    improvements: string[];
    referencePoints: string[];
  }
> = {
  behavior: {
    structure: "按 STAR 结构自查：情境(S)→任务(T)→行动(A)→结果(R)",
    improvements: [
      "情境(S)：是否给出了具体的时间/客户/项目背景，而非泛泛而谈",
      "任务(T)：是否说清你当时要解决的具体问题或目标",
      "行动(A)：是否聚焦「你」做了什么，而非团队整体；动作是否具体",
      "结果(R)：是否尽量量化（数字/对比），并补一句复盘反思",
    ],
    referencePoints: [
      "S 情境：背景一句话讲清",
      "T 任务：你的目标/职责",
      "A 行动：你具体做的事（动词为主）",
      "R 结果：可量化的产出 + 反思",
    ],
  },
  solution: {
    structure: "按五步法自查：现状→痛点→方案→价值→风险",
    improvements: [
      "现状：是否说清客户当时的业务/技术现状",
      "痛点：是否点出客户的核心痛点，而非罗列功能",
      "方案：是否给出结构化方案（不止是产品堆砌）",
      "价值：是否把方案价值量化/对齐痛点",
      "风险：是否主动提及落地风险与应对",
    ],
    referencePoints: [
      "现状：客户业务/技术背景",
      "痛点：核心问题聚焦",
      "方案：结构化设计",
      "价值：可量化收益",
      "风险：落地风险与应对",
    ],
  },
  tech: {
    structure: "自查：概念准确 → 与相邻技术对比 → 落到客户场景",
    improvements: [
      "概念准确：核心定义是否讲对，无硬伤",
      "对比：是否与相邻技术做了区分（如容器 vs 虚拟机）",
      "客户场景：是否落到一个真实售前场景，说明何时该用它",
    ],
    referencePoints: [
      "概念：准确定义",
      "对比：与相邻技术区分",
      "场景：售前何时推荐它",
    ],
  },
  open: {
    structure: "自查：岗位认知 → 动机真实性 → 你的差异化",
    improvements: [
      "岗位认知：是否说清售前 vs 产品/销售/技术支持的区别",
      "动机真实性：是否结合自身经历讲，而非套话",
      "差异化：是否给出你独有的优势或视角",
    ],
    referencePoints: [
      "认知：售前岗位边界",
      "动机：结合自身经历",
      "差异化：你的独有优势",
    ],
  },
};

/**
 * 降级出题：从题库里筛所选类别的题，随机起点轮转抽 3 题。
 * 不足 3 题时用全题库补齐，保证 schema.length(3) 通过。
 * relatedNotes 复用 quiz 已白名单过滤的 slug。
 */
export function generateFallback(categories: QuizCategory[]): InterviewQuestion[] {
  const pool = getQuiz();
  const wanted = new Set(categories);
  // 先取所选类别，不足再补全题库（去重）
  let candidates = pool.filter((q) => wanted.has(q.category));
  if (candidates.length < 3) {
    const extra = pool.filter((q) => !wanted.has(q.category));
    candidates = [...candidates, ...extra];
  }
  // 随机起点轮转抽 3 题（避免每次都从第 0 题开始，给降级一点变化）
  const start = candidates.length > 0 ? Math.floor(Math.random() * candidates.length) : 0;
  const picks: typeof pool = [];
  for (let i = 0; i < 3 && candidates.length > 0; i++) {
    const idx = (start + i) % candidates.length;
    picks.push(candidates[idx]);
  }
  // 兜底：题库不足 3 题（极端情况）时重复补齐到 3 条
  while (picks.length < 3 && picks.length > 0) {
    picks.push(picks[picks.length % picks.length]);
  }
  return picks.map((q) => ({
    question: q.question,
    type: q.category,
    relatedNotes: q.relatedNotes,
  }));
}

/** 降级点评：按题型返回 rubric 模板，保证 schema 通过、UI 形态一致。 */
export function reviewFallback(type: QuizCategory): ReviewOutput {
  const r = RUBRIC[type];
  return {
    structure: r.structure,
    strengths: ["已完成作答，可对照右侧要点自查（当前为降级模式，未接 AI 点评）"],
    improvements: r.improvements,
    referencePoints: r.referencePoints,
    relatedNotes: RUBRIC_NOTES[type],
  };
}
