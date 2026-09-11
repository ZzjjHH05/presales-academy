/**
 * Phase 7 · 五步法工作台 —— 三 mode 的 zod 契约（服务端/客户端共用类型）。
 *
 * 输出 schema 由 AI 与降级引擎（lib/solution-fallback.ts）共用，必须同构——
 * 这样无论走 AI 还是降级，前端拿到的结构完全一致，UI 形态不降级（同 P5/P6 范式）。
 *
 * 产品红线（原则 3：AI 是教练不是枪手）编码进 schema 的硬约束：
 *  - clarify.questions[].q 上限 120 字、why 上限 200 字——问句装不下正文
 *  - outline.sections[].heading 上限 30 字、prompts[] 上限 80 字——标题/引导问句装不下成段正文
 *  - outline.sections.length(5)——恰好五段
 *  - review.suggestion 里改写示例上限在 prompt 侧再卡 40 字（schema 给 800 字总量）
 *
 * relatedNotes 在 AI/降级产出后由服务端 route 再做一次白名单过滤
 * （lib/quiz.ts 的同款范式：new Set(getAllArticles().map(a=>a.slug))），不存在的 slug 直接丢弃。
 */
import { z } from "zod";

/** 五段式方案文档结构枚举（现状→痛点→方案→价值→风险）。 */
const sectionKeyEnum = z.enum(["现状", "痛点", "方案", "价值", "风险"]);

/** clarify 模式输入：场景描述（≥20 字，≤4000 字）。 */
export const clarifyInputSchema = z.object({
  mode: z.literal("clarify"),
  scenario: z.string().min(20, "场景描述太短（至少 20 字）").max(4000),
});

/** outline 模式输入：场景描述（≥20 字，≤4000 字）。 */
export const outlineInputSchema = z.object({
  mode: z.literal("outline"),
  scenario: z.string().min(20).max(4000),
});

/** review 模式输入：段落 key + 场景 + 学生草稿正文。 */
export const reviewInputSchema = z.object({
  mode: z.literal("review"),
  sectionKey: sectionKeyEnum,
  scenario: z.string().min(20).max(4000),
  content: z.string().min(1, "草稿不能为空").max(6000),
});

/** clarify 输出：5-8 个澄清问题，每条配 why（为什么要问这个）。 */
export const clarifyOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        q: z.string().min(1).max(120), // 澄清问题（问句）
        why: z.string().min(1).max(200), // 为什么要问这个
      })
    )
    .min(5)
    .max(8),
});

/** outline 输出：恰好五段骨架，每段 heading + 2-4 条引导问句（prompts 不是正文！）。 */
export const outlineOutputSchema = z.object({
  sections: z
    .array(
      z.object({
        key: sectionKeyEnum,
        heading: z.string().min(1).max(30), // 段落标题
        prompts: z
          .array(z.string().min(5).max(80))
          .min(2)
          .max(4), // 引导问句——不是正文！
      })
    )
    .length(5), // 恰好五段
});

/** review 输出：verdict + 一句话点评 + 可执行建议 + 相关笔记。 */
export const reviewOutputSchema = z.object({
  verdict: z.enum(["good", "improve"]),
  comment: z.string().min(1).max(500), // 对照该段要素的一句话点评
  suggestion: z.string().min(1).max(800), // 可执行的修改建议
  relatedNotes: z.array(z.string()).default([]),
});

export type SectionKey = z.infer<typeof sectionKeyEnum>;
export type ClarifyOutput = z.infer<typeof clarifyOutputSchema>;
export type OutlineOutput = z.infer<typeof outlineOutputSchema>;
export type ReviewOutput = z.infer<typeof reviewOutputSchema>;
