import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

const SCOPES = ["pa-progress-v1", "pa-quiz-v1", "pa-recruit-v1"];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = db
    .prepare("SELECT scope, data FROM sync_blob WHERE user_id = ?")
    .all(user.id) as unknown as { scope: string; data: string }[];
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

  const stmt = db.prepare(
    `INSERT INTO sync_blob (user_id, scope, data, updated_at) VALUES (?,?,?,?)
     ON CONFLICT(user_id, scope) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  );
  for (const scope of SCOPES) {
    const val = body[scope];
    if (typeof val === "string" && val.length < 10_000_000) {
      stmt.run(user.id, scope, val, Date.now());
    }
  }
  return NextResponse.json({ ok: true });
}
