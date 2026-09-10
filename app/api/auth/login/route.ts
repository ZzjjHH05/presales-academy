import { NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* ignore */
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
  await createSession(user.id, res);
  return res;
}
