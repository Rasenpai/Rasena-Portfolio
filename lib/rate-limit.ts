import "server-only";
import { getWritableDb } from "./db";

let ready = false;
function db() {
  const d = getWritableDb();
  if (!ready) {
    d.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_rate_limits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_hash TEXT NOT NULL,
        kind TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    ready = true;
  }
  return d;
}

/** true kalau IP ini sudah mencapai batas `limit` untuk jenis `kind` dalam `windowMin` menit */
export function isLimited(
  ipHash: string,
  kind: string,
  limit: number,
  windowMin: number,
) {
  const since = new Date(Date.now() - windowMin * 60_000).toISOString();
  const { n } = db()
    .prepare(
      "SELECT COUNT(*) AS n FROM portfolio_rate_limits WHERE ip_hash = ? AND kind = ? AND created_at >= ?",
    )
    .get(ipHash, kind, since) as { n: number };
  return n >= limit;
}

export function recordHit(ipHash: string, kind: string) {
  db()
    .prepare(
      "INSERT INTO portfolio_rate_limits (ip_hash, kind, created_at) VALUES (?, ?, ?)",
    )
    .run(ipHash, kind, new Date().toISOString());
}