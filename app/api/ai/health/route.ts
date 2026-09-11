/**
 * Phase 4 · AI 网关自检端点（也是本 Phase 的验收工具）。
 *
 * 行为：
 *  - GET：不耗限流额度（自检用，非业务调用）。
 *  - 内部调 aiJSON 发一次最小请求，验证 Key 配置与链路。
 *  - 有 Key：真调一次模型；无 Key：走降级。
 *  - **两种情况都返回 200**，用 degraded 字段区分。
 *
 * ⚠️ 业务端点（jd/interview/solution）必须调 consumeRateLimit 扣额度，health 不扣。
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { aiJSON } from "@/lib/ai";

export const maxDuration = 60;

export async function GET() {
  const keyConfigured = !!process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "deepseek-chat";

  const { degraded, cached } = await aiJSON({
    system: "你是健康检查器",
    user: '请返回 {"status":"ok"}',
    schema: z.object({ status: z.literal("ok") }),
    fallback: { status: "ok" },
  });

  return NextResponse.json(
    { ok: true, keyConfigured, degraded, cached, model },
    { status: 200 }
  );
}
