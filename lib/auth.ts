import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";

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

export function createUser(
  email: string,
  name: string,
  password: string
): { id: string; name: string; email: string } {
  const id = randomBytes(16).toString("hex");
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?,?,?,?,?)"
  ).run(id, email.toLowerCase(), name, hashPassword(password), Date.now());
  return { id, name, email: email.toLowerCase() };
}

export function findUserByEmail(email: string): StoredUser | null {
  const row = db
    .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .get(email.toLowerCase());
  return (row as unknown as StoredUser) ?? null;
}

/* ---------- 会话 ---------- */

export async function createSession(userId: string, res: NextResponse): Promise<void> {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)").run(
    token,
    userId,
    Date.now() + SESSION_MS
  );
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
  const row = db
    .prepare(
      `SELECT s.user_id AS id, u.name, u.email
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .get(token, Date.now()) as any;
  return row ? { id: row.id, name: row.name, email: row.email } : null;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
