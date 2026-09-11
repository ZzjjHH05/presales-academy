/**
 * 安全加固 · 认证防爆破（落库限流，遵循 D8：跨请求状态只落数据库）。
 *
 *  - 登录失败（login_fail）：同 IP 每天失败 ≥ LOGIN_FAIL_LIMIT → 429 拒绝（预检在 scrypt 之前，同时防 CPU 消耗）
 *  - 注册尝试（register）：同 IP 每天尝试 ≥ REGISTER_LIMIT → 429 拒绝（防垃圾账号）
 *  - ip_hash = sha256(ip + AI_RATE_SALT)，不存明文 IP；盐与 AI 限流共用（AI_RATE_SALT 即"通用限流盐"）
 *  - 登录成功后清零该 IP 当天 login_fail 计数（对真实用户友好：输错几次不影响后续）
 *  - 用与 ai-limit.ts 相同的 INSERT ... ON CONFLICT 原子自增，并发安全
 */
import { createHash } from "node:crypto";
import { get, run } from "./db";
import { getClientIp } from "./ai-limit";

const RATE_SALT = process.env.AI_RATE_SALT || "pa-default-salt-dev-only";
export const LOGIN_FAIL_LIMIT = 10;
export const REGISTER_LIMIT = 5;

export type AuthRateKind = "login_fail" | "register";

interface CountRow {
  count: number;
}

/** ip_hash = sha256(ip + 盐)，不存明文 IP。 */
function ipHash(ip: string): string {
  return createHash("sha256").update(ip + RATE_SALT).digest("hex");
}

/** 服务器本地时区 YYYY-MM-DD（与 ai-limit.ts 口径一致）。 */
function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 只读预检：该 IP 当天指定类型的计数是否已达上限。 */
export async function checkAuthRate(
  req: Request,
  kind: AuthRateKind
): Promise<boolean> {
  const hash = ipHash(getClientIp(req));
  const row = await get<CountRow>(
    "SELECT count FROM auth_rate WHERE ip_hash = ? AND day = ? AND kind = ?",
    [hash, today(), kind]
  );
  const used = row?.count ?? 0;
  const limit = kind === "login_fail" ? LOGIN_FAIL_LIMIT : REGISTER_LIMIT;
  return used < limit;
}

/** 原子自增一次（INSERT ... ON CONFLICT，并发不丢计数）。 */
export async function bumpAuthRate(
  req: Request,
  kind: AuthRateKind
): Promise<void> {
  const hash = ipHash(getClientIp(req));
  await run(
    `INSERT INTO auth_rate (ip_hash, day, kind, count) VALUES (?,?,?,1)
     ON CONFLICT(ip_hash, day, kind) DO UPDATE SET count = count + 1`,
    [hash, today(), kind]
  );
}

/** 登录成功后清零该 IP 当天的登录失败计数（只影响 login_fail）。 */
export async function resetLoginFails(req: Request): Promise<void> {
  const hash = ipHash(getClientIp(req));
  await run(
    "DELETE FROM auth_rate WHERE ip_hash = ? AND day = ? AND kind = 'login_fail'",
    [hash, today()]
  );
}
