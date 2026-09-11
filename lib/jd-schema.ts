/**
 * Phase 5 · JD 解析 —— 输入与输出的 zod 契约（服务端/客户端共用类型）。
 *
 * 输出 schema 由 AI 与降级规则引擎（lib/ai-fallback.ts）共用，必须同构——
 * 这样无论走 AI 还是降级，前端拿到的结构完全一致，UI 形态不降级。
 *
 * relatedNotes 在 AI/降级产出后由服务端 route 再做一次白名单过滤
 * （lib/quiz.ts 的同款范式：new Set(getAllArticles().map(a=>a.slug))），
 * 不存在的 slug 直接丢弃不报错。
 */
import { z } from "zod";

/** 输入 schema（API body 用）。 */
export const jdInputSchema = z.object({
  jd: z
    .string()
    .min(20, "JD 内容太短（至少 20 字）")
    .max(8000),
});

/** 六域枚举（与 data/domains.ts 的 DomainKey 保持一致）。 */
const domainEnum = z.enum([
  "industry",
  "tech",
  "core",
  "solutions",
  "soft",
  "job",
]);

/** 四类题型枚举（与 data/quiz-categories.ts 的 QuizCategory 保持一致）。 */
const questionTypeEnum = z.enum(["behavior", "solution", "tech", "open"]);

/** 输出 schema（AI 与降级共用，必须同构）。 */
export const jdResultSchema = z.object({
  position: z.string().min(1),
  requirements: z
    .array(
      z.object({
        point: z.string().min(1),
        domain: domainEnum,
        weight: z.enum(["must", "nice"]),
        relatedNotes: z.array(z.string()).default([]),
      })
    )
    .min(3),
  predictedQuestions: z
    .array(
      z.object({
        q: z.string().min(1),
        type: questionTypeEnum,
        relatedNotes: z.array(z.string()).default([]),
      })
    )
    .min(2),
});

export type JdInput = z.infer<typeof jdInputSchema>;
export type JdResult = z.infer<typeof jdResultSchema>;
