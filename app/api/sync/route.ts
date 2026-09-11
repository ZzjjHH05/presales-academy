import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { all, run } from "@/lib/db";

const SCOPES = ["pa-progress-v1", "pa-quiz-v1", "pa-recruit-v1", "pa-interview-v1"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await all<{ scope: string; data: string }>(
    "SELECT scope, data FROM sync_blob WHERE user_id = ?",
    [user.id]
  );
  const out: Record<string, string> = {};
  for (const r of rows) out[r.scope] = r.data;
  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* ignore */
  }

  // 原写法为循环外 prepare、循环内 run；libsql 无 prepare，等价改写为循环内逐条 run。
  const sql = `INSERT INTO sync_blob (user_id, scope, data, updated_at) VALUES (?,?,?,?)
     ON CONFLICT(user_id, scope) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`;
  for (const scope of SCOPES) {
    const val = body[scope];
    if (typeof val === "string" && val.length < 10_000_000) {
      await run(sql, [user.id, scope, val, Date.now()]);
    }
  }
  return NextResponse.json({ ok: true });
}
