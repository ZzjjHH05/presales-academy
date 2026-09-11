/**
 * Phase 4 · AI 统一网关 —— 所有后续 AI 功能（JD 解析/模拟面试/方案工作台）的公共底座。
 *
 * 设计要点（v2 修订版：跨请求状态全部落库，生产 Docker 单机也用落库方案免改造）：
 *  - 缓存落 ai_cache 表（hash = sha256(AI_MODEL + system + user)），30 天有效
 *  - 无 AI_API_KEY 直接降级；网络异常/超时/校验失败均降级，**永不 throw、永不 500**
 *  - 纯库实现，不 import 任何 React/Next 组件，将来能被 scripts/ 下 Node 脚本复用（Phase 8 eval 会用到）
 *  - AI_API_KEY 只从 process.env 读，绝不进日志/提交/字面量
 *
 * 决策流程：无Key → 缓存 → 调用 → zod 校验 → 失败重试一次 → 成功落库 / 降级
 */
import { createHash } from "node:crypto";
import type { z } from "zod";
import { run, get } from "./db";

const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || "https://api.deepseek.com";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

/** AI 调用结果。 */
export interface AIResult<T> {
  data: T;
  degraded: boolean;
  cached: boolean;
}

interface CacheRow {
  hash: string;
  result: string;
  created_at: number;
}

/** 内容哈希：sha256(AI_MODEL + system + user)。纳入 model 保证换模型不串结果。 */
function contentHash(system: string, user: string): string {
  return createHash("sha256")
    .update(AI_MODEL + system + user)
    .digest("hex");
}

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天
const CALL_TIMEOUT_MS = 30_000; // AbortController 30 秒超时

/** 读 ai_cache 命中且未过 TTL。 */
async function readCache(hash: string): Promise<string | null> {
  const row = await get<CacheRow>(
    "SELECT hash, result, created_at FROM ai_cache WHERE hash = ?",
    [hash]
  );
  if (!row) return null;
  if (Date.now() - row.created_at > CACHE_TTL_MS) return null;
  return row.result;
}

/** 写 ai_cache（INSERT OR REPLACE 覆盖旧条目）。 */
async function writeCache(hash: string, result: string): Promise<void> {
  await run(
    "INSERT OR REPLACE INTO ai_cache (hash, result, created_at) VALUES (?,?,?)",
    [hash, result, Date.now()]
  );
}

/**
 * 发起一次 OpenAI 兼容协议调用。
 * 返回模型输出的字符串内容（message.content）。失败抛错由调用方降级。
 */
async function callModel(
  system: string,
  user: string,
  retryHint?: string
): Promise<string> {
  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: system },
    {
      role: "user",
      content: retryHint ? `${user}\n\n${retryHint}` : user,
    },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("empty content");
    }
    return content;
  } finally {
    clearTimeout(timer);
    // 耗时仅用于日志，不暴露 Key/Body
    void started;
  }
}

/** 结构化日志一行（hash 前缀/降级/缓存/耗时 ms），方便服务器排障。 */
function logOutcome(
  hash: string,
  degraded: boolean,
  cached: boolean,
  ms: number
): void {
  console.log(
    `[ai] hash=${hash.slice(0, 10)} degraded=${degraded} cached=${cached} ms=${ms}`
  );
}

/**
 * 统一网关入口：调用 AI 并按 zod schema 校验，失败可重试一次，最终降级到 fallback。
 *
 * 四条路径全覆盖：
 *  1. 无 Key → 直接返回 { data: fallback, degraded: true, cached: false }
 *  2. 缓存命中 → { data: 解析结果, degraded: false, cached: true }
 *  3. 调用 → 校验通过 → 落库 + { data, degraded: false, cached: false }
 *  4. 校验失败重试一次 → 成功落库 / 再失败降级；网络异常/超时降级
 *
 * **永不 throw、永不 500**——任何异常都吞掉返回 fallback。
 */
export async function aiJSON<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  fallback: T;
}): Promise<AIResult<T>> {
  const { system, user, schema, fallback } = opts;
  const started = Date.now();

  // 路径 1：无 Key 直接降级，不发请求
  if (!AI_API_KEY) {
    logOutcome("no-key", true, false, Date.now() - started);
    return { data: fallback, degraded: true, cached: false };
  }

  const hash = contentHash(system, user);

  // 路径 2：缓存命中
  try {
    const cached = await readCache(hash);
    if (cached !== null) {
      const parsed = schema.safeParse(JSON.parse(cached));
      if (parsed.success) {
        logOutcome(hash, false, true, Date.now() - started);
        return { data: parsed.data, degraded: false, cached: true };
      }
      // 缓存内容过期/损坏，继续走真请求覆盖
    }
  } catch {
    // 缓存读失败不影响主流程
  }

  // 路径 3：调用模型 + zod 校验
  try {
    const raw = await callModel(system, user);
    let parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) {
      await writeCache(hash, raw);
      logOutcome(hash, false, false, Date.now() - started);
      return { data: parsed.data, degraded: false, cached: false };
    }

    // 路径 4：校验失败 → 带错误信息重试一次
    const retryHint = `上次输出未通过校验：${JSON.stringify(
      parsed.error.issues
    )}，请严格按 JSON schema 重输`;
    const raw2 = await callModel(system, user, retryHint);
    parsed = schema.safeParse(JSON.parse(raw2));
    if (parsed.success) {
      await writeCache(hash, raw2);
      logOutcome(hash, false, false, Date.now() - started);
      return { data: parsed.data, degraded: false, cached: false };
    }

    // 重试仍失败 → 降级
    logOutcome(hash, true, false, Date.now() - started);
    return { data: fallback, degraded: true, cached: false };
  } catch (err) {
    // 网络异常/超时/解析异常 → 降级，永不 throw
    logOutcome(hash, true, false, Date.now() - started);
    void err;
    return { data: fallback, degraded: true, cached: false };
  }
}
