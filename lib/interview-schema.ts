/**
 * Phase 6 · AI 模拟面试 —— 出题与点评的 zod 契约（服务端/客户端共用类型）。
 *
 * 输出 schema 由 AI 与降级引擎（lib/interview-fallback.ts）共用，必须同构——
 * 这样无论走 AI 还是降级，前端拿到的结构完全一致，UI 形态不降级（同 P5 范式）。
 *
 * relatedNotes 在 AI/降级产出后由服务端 route 再做一次白名单过滤
 * （lib/quiz.ts 的同款范式：new Set(getAllArticles().map(a=>a.slug))），
 * 不存在的 slug 直接丢弃不报错。
 */
import { z } from "zod";

/** 四类题型枚举（与 data/quiz-categories.ts 的 QuizCategory 保持一致）。 */
const categoryEnum = z.enum(["behavior", "solution", "tech", "open"]);

/** generate 模式输入：所选类别（≥1 ≤4）+ 可选公司 key（空 = 通用面试）。 */
export const generateInputSchema = z.object({
  mode: z.literal("generate"),
  companyKey: z.string().max(64).optional().default(""),
  categories: z.array(categoryEnum).min(1).max(4),
});

/** review 模式输入：题目 + 答案 + 题型 + 可选公司 key。 */
export const reviewInputSchema = z.object({
  mode: z.literal("review"),
  companyKey: z.string().max(64).optional().default(""),
  question: z.string().min(1).max(2000),
  answer: z.string().min(1, "答案不能为空").max(6000),
  type: categoryEnum,
});

/** 单道面试题：题目 + 题型 + 相关笔记 slug。 */
export const interviewQuestionSchema = z.object({
  question: z.string().min(1),
  type: categoryEnum,
  relatedNotes: z.array(z.string()).default([]),
});

/** generate 输出：恰好 3 道题。 */
export const generateOutputSchema = z.object({
  questions: z.array(interviewQuestionSchema).length(3),
});

/** review 输出：结构点评 + 优点 + 改进建议 + 参考要点 + 相关笔记。 */
export const reviewOutputSchema = z.object({
  structure: z.string().min(1), // 该答案的结构点评（对照 rubric）
  strengths: z.array(z.string()).min(1).max(5), // 做得好的点（至少 1 条）
  improvements: z.array(z.string()).min(1).max(5), // 可执行的改进建议
  referencePoints: z.array(z.string()).max(6), // 该题的参考要点
  relatedNotes: z.array(z.string()).default([]),
});

export type GenerateInput = z.infer<typeof generateInputSchema>;
export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type GenerateOutput = z.infer<typeof generateOutputSchema>;
export type ReviewOutput = z.infer<typeof reviewOutputSchema>;
