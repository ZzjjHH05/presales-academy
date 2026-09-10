import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { run, get } from "./db";

export const SESSION_COOKIE = "pa_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/* ---------- 密码：scrypt 加盐哈希 ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const test = scryptSync(password, salt, 64);
  return timingSafeEqual(Buffer.from(hash, "hex"), test);
}

/* ---------- 用户 ---------- */

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
}

export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<{ id: string; name: string; email: string }> {
  const id = randomBytes(16).toString("hex");
  await run(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?,?,?,?,?)",
    [id, email.toLowerCase(), name, hashPassword(password), Date.now()]
  );
  return { id, name, email: email.toLowerCase() };
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const row = await get<StoredUser>(
    "SELECT id, email, name, password_hash FROM users WHERE email = ?",
    [email.toLowerCase()]
  );
  return row ?? null;
}

/* ---------- 会话 ---------- */

export async function createSession(userId: string, res: NextResponse): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)", [
    token,
    userId,
    Date.now() + SESSION_MS,
  ]);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await get<{ id: string; name: string; email: string }>(
    `SELECT s.user_id AS id, u.name, u.email
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`,
    [token, Date.now()]
  );
  return row ? { id: row.id, name: row.name, email: row.email } : null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE token = ?", [token]);
}
