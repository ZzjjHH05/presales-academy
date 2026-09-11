/**
 * 数据库在线备份（本地 file 模式 · 方案 B 可用性保障）。
 *
 * 原理：SQLite 的 `VACUUM INTO` 在不停服、不锁写的情况下产出一份一致性快照，
 * 优于直接 cat/cp 数据库文件（WAL 模式下那样可能拷出损坏数据）。
 *
 * 用法：
 *   服务器（推荐，cron 每日一次）：
 *     docker compose exec -T app node scripts/db-backup.mjs
 *   本地：node scripts/db-backup.mjs
 *
 * 环境变量：BACKUP_KEEP（保留份数，默认 7）
 * 备份落在 data/backups/（容器内即 volume 内 → 宿主机 ./data/backups，随卷持久化）。
 */
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

if (process.env.TURSO_DATABASE_URL) {
  console.log("[backup] 当前是 Turso 模式：云端自带备份，本脚本仅用于本地 file 模式，退出。");
  process.exit(0);
}

const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP || 7));
const dataDir = path.join(process.cwd(), "data");
const backupDir = path.join(dataDir, "backups");
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date()
  .toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" })
  .replace(/[- :]/g, "")
  .replace(/^(\d{8})T?(\d{6})$/, "$1-$2");
const target = path.join(backupDir, `app-${stamp}.db`).replace(/\\/g, "/");

const db = createClient({
  url: `file:${path.join(dataDir, "app.db").replace(/\\/g, "/")}`,
  timeout: 5000,
});
await db.execute(`VACUUM INTO '${target}'`);
db.close();

const size = (fs.statSync(target).size / 1024).toFixed(1);
console.log(`[backup] 已生成 ${target}（${size} KB）`);

// 只保留最近 KEEP 份
const files = fs
  .readdirSync(backupDir)
  .filter((f) => f.startsWith("app-") && f.endsWith(".db"))
  .sort();
for (const old of files.slice(0, -KEEP)) {
  fs.rmSync(path.join(backupDir, old));
  console.log(`[backup] 清理旧备份 ${old}`);
}
console.log(`[backup] 完成，当前保留 ${Math.min(files.length, KEEP)} 份`);
