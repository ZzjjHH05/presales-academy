import { NextResponse } from "next/server";
import { createUser, createSession, findUserByEmail } from "@/lib/auth";
import { checkAuthRate, bumpAuthRate, REGISTER_LIMIT } from "@/lib/auth-rate";

const MAX_PASSWORD_LEN = 128; // 上限防 scrypt CPU 放大（超长密码在 scrypt 里耗时线性增长）

export async function POST(request: Request) {
  // 防垃圾注册预检：同 IP 当天尝试超限直接 429
  if (!(await checkAuthRate(request, "register"))) {
    return NextResponse.json(
      { error: "注册尝试过于频繁，请明天再试" },
      { status: 429 }
    );
  }

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
  if (password.length > MAX_PASSWORD_LEN) {
    return NextResponse.json({ error: "密码最多 128 位" }, { status: 400 });
  }

  // 格式校验通过即计数（在邮箱查重之前：连「探测已注册邮箱」也被限到 5 次/天）
  await bumpAuthRate(request, "register");

  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
  }

  const user = await createUser(email, name, password);
  const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
  await createSession(user.id, res);
  return res;
}
