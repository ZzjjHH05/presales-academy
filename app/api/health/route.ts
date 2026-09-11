/**
 * 轻量健康检查端点（可用性监控专用）。
 *
 * 与 /api/ai/health 的分工：
 *  - 本端点：只查数据库连通性，毫秒级返回、不耗任何 AI 额度——给 Docker HEALTHCHECK
 *    和外部拨测监控（如 UptimeRobot）用。
 *  - /api/ai/health：真调一次 AI 验证网关链路，是 AI 功能的人工验收工具。
 */
import { NextResponse } from "next/server";
import { get } from "@/lib/db";

export async function GET() {
  try {
    await get("SELECT 1 AS ok");
    return NextResponse.json({ ok: true, db: "ok" });
  } catch {
    return NextResponse.json({ ok: false, db: "error" }, { status: 503 });
  }
}
