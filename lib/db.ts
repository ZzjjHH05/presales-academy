import { createClient, type Client, type InArgs, type Row } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

const tursoUrl = process.env.TURSO_DATABASE_URL;
const useTurso = !!tursoUrl;

export const db: Client = useTurso
  ? createClient({ url: tursoUrl!, authToken: process.env.TURSO_AUTH_TOKEN })
  : (() => {
      // 本地 file 模式：保留 data/ 目录自动创建逻辑
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const dbPath = path.join(DATA_DIR, "app.db").replace(/\\/g, "/");
      // libsql 的 execute 每次用独立连接，busy_timeout 必须通过 client 配置才能对每条连接生效
      return createClient({ url: `file:${dbPath}`, timeout: 5000 });
    })();

// 初始化表结构 + 本地 PRAGMA。WAL 与 busy_timeout 仅在本地 file 模式下执行，Turso 模式跳过。
const dbReady: Promise<void> = (async () => {
  if (!useTurso) {
    await db.execute("PRAGMA journal_mode = WAL;");
    await db.execute("PRAGMA busy_timeout = 5000;");
  }
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_blob (
      user_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, scope)
    );
  `);
})();

/* ---------- 最小 async 工具封装，让调用点改动最小、类型清晰 ---------- */

export async function run(sql: string, args: InArgs = []): Promise<void> {
  await dbReady;
  await db.execute({ sql, args: args as InArgs });
}

export async function get<T = Row>(sql: string, args: InArgs = []): Promise<T | null> {
  await dbReady;
  const rs = await db.execute({ sql, args: args as InArgs });
  return (rs.rows[0] as T) ?? null;
}

export async function all<T = Row>(sql: string, args: InArgs = []): Promise<T[]> {
  await dbReady;
  const rs = await db.execute({ sql, args: args as InArgs });
  return rs.rows as T[];
}
