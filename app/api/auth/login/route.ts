import { NextResponse } from "next/server";
import { findUserByEmail, verifyPassword, createSession } from "@/lib/auth";
import { checkAuthRate, bumpAuthRate, resetLoginFails } from "@/lib/auth-rate";

const MAX_PASSWORD_LEN = 128; // 超长密码对 scrypt 是 CPU 放大器，直接按失败处理

export async function POST(request: Request) {
  // 防爆破预检：失败次数超限的 IP 直接 429（不进 scrypt，同时防 CPU 消耗）
  if (!(await checkAuthRate(request, "login_fail"))) {
    return NextResponse.json(
      { error: "登录尝试过于频繁，请明天再试" },
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
  const password = typeof body.password === "string" ? body.password : "";

  const fail = async () => {
    await bumpAuthRate(request, "login_fail");
    // 统一文案，不暴露「邮箱是否存在」
    return NextResponse.json({ error: "邮箱或密码不正确" }, { status: 401 });
  };

  const user = await findUserByEmail(email);
  if (!user) return await fail();
  // 超长密码不做 scrypt 运算（防 CPU 放大），按普通失败计
  if (password.length > MAX_PASSWORD_LEN) return await fail();
  if (!verifyPassword(password, user.password_hash)) return await fail();

  // 登录成功：清零当天失败计数（对真实用户友好）
  await resetLoginFails(request);

  const res = NextResponse.json({ ok: true, user: { name: user.name, email: user.email } });
  await createSession(user.id, res);
  return res;
}
