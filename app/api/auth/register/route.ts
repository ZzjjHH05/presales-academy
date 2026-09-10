import { NextResponse } from "next/server";
import { createUser, createSession, findUserByEmail } from "@/lib/auth";

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* ignore */
  }
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (!name) return NextResponse.json({ error: "请填写昵称" }, { status: 400 });
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const user = createUser(email, name, password);
  const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
  await createSession(user.id, res);
  return res;
}
