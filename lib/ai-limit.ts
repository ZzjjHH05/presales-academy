/**
 * Phase 4 · AI 统一网关 —— 落库限流。
 *
 * v2 修订版：跨请求状态全部落 ai_rate 表（生产 Docker 单机/多实例都正确，禁用内存 Map）。
 *  - 匿名（无登录会话）：3 次/天；登录：20 次/天（getSessionUser() 判断）
 *  - IP 提取：req.headers 的 x-forwarded-for（取第一个）或 x-real-ip，取不到用 "unknown"
 *  - ip_hash = sha256(ip + AI_RATE_SALT)，不存明文 IP；盐未配置用固定默认值（开发便利，生产必配随机串）
 *  - consume 用 INSERT ... ON CONFLICT DO UPDATE 原子自增，count 超限则 ok: false
 *  - check 只读不写（给需要预检的场景）
 *
 * 注意：health 端点不消耗限流额度（自检用）；业务端点（jd/interview/solution）必须调 consumeRateLimit。
 */
import { createHash } from "node:crypto";
import { get, run } from "./db";
import { getSessionUser } from "./auth";

const RATE_SALT = process.env.AI_RATE_SALT || "pa-default-salt-dev-only";
// 一轮完整模拟面试 = 1 次出题 + 3 次点评 = 4 次 AI 调用；
// 匿名游客至少能完整走完一轮（产品原则 2：游客优先拿价值）
const ANON_LIMIT = 5;
const USER_LIMIT = 20;

interface RateRow {
  count: number;
}

/** 从 req.headers 提取客户端 IP（取第一个 x-forwarded-for 或 x-real-ip，取不到用 "unknown"）。 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** ip_hash = sha256(ip + 盐)，不存明文 IP。 */
function ipHash(ip: string): string {
  return createHash("sha256").update(ip + RATE_SALT).digest("hex");
}

/** 服务器本地时区 YYYY-MM-DD。 */
function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 判断当前是否登录用户并返回当天额度。 */
async function resolveLimit(req: Request): Promise<{ limit: number; isUser: boolean }> {
  const user = await getSessionUser();
  void req;
  return user ? { limit: USER_LIMIT, isUser: true } : { limit: ANON_LIMIT, isUser: false };
}

/** 只读：检查当前是否还有额度（不写库）。 */
export async function checkRateLimit(req: Request): Promise<{ ok: boolean; remaining: number }> {
  const { limit } = await resolveLimit(req);
  const ip = getClientIp(req);
  const hash = ipHash(ip);
  const day = today();
  const row = await get<RateRow>(
    "SELECT count FROM ai_rate WHERE ip_hash = ? AND day = ?",
    [hash, day]
  );
  const used = row?.count ?? 0;
  const remaining = Math.max(0, limit - used);
  return { ok: used < limit, remaining };
}

/**
 * 写库：原子自增一次。
 * 用 `INSERT ... ON CONFLICT(ip_hash, day) DO UPDATE SET count = count + 1`
 * 自增后再读回 count 判断是否超限——ON CONFLICT 保证计数不丢、并发安全。
 */
export async function consumeRateLimit(req: Request): Promise<{ ok: boolean; remaining: number }> {
  const { limit } = await resolveLimit(req);
  const ip = getClientIp(req);
  const hash = ipHash(ip);
  const day = today();

  await run(
    `INSERT INTO ai_rate (ip_hash, day, count) VALUES (?,?,1)
     ON CONFLICT(ip_hash, day) DO UPDATE SET count = count + 1`,
    [hash, day]
  );

  const row = await get<RateRow>(
    "SELECT count FROM ai_rate WHERE ip_hash = ? AND day = ?",
    [hash, day]
  );
  const used = row?.count ?? 0;
  const ok = used <= limit;
  const remaining = ok ? Math.max(0, limit - used) : 0;
  return { ok, remaining };
}
