import "server-only";
import bcrypt from "bcryptjs";
import { getWritableDb } from "./db";

// ASUMSI: portfolio_admins.password_hash berformat bcrypt ($2a/$2b/$2y).

const MAX_FAILS = 5;
const LOCK_MIN = 15;
const IP_LIMIT = 10; // percobaan gagal per IP
const IP_WINDOW_MIN = 15;

// Dibandingkan saat email tidak ditemukan, supaya waktu respons
// tidak membocorkan apakah email itu terdaftar.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export type LoginResult =
  | { ok: true; id: string; email: string }
  | { ok: false; reason: "invalid" | "locked" | "rate_limited" };

type AdminRow = {
  id: string;
  email: string;
  password_hash: string;
  failed_attempts: string | number | null;
  locked_until: string | null;
};

// Timestamp dari backup Postgres berbentuk "2026-10-01 12:00:00.123+00"
function parseTs(v: unknown): number {
  if (!v) return 0;
  let s = String(v).trim().replace(" ", "T");
  if (/[+-]\d\d$/.test(s)) s += ":00";
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

export async function verifyAdminLogin(
  email: string,
  password: string,
  ipHash: string,
): Promise<LoginResult> {
  const db = getWritableDb();

  const since = new Date(Date.now() - IP_WINDOW_MIN * 60_000).toISOString();
  const { n } = db
    .prepare(
      "SELECT COUNT(*) AS n FROM portfolio_login_attempts WHERE ip_hash = ? AND created_at >= ?",
    )
    .get(ipHash, since) as { n: number };
  if (n >= IP_LIMIT) return { ok: false, reason: "rate_limited" };

  const admin = db
    .prepare(
      "SELECT id,email,password_hash,failed_attempts,locked_until FROM portfolio_admins WHERE lower(email) = ?",
    )
    .get(email) as AdminRow | undefined;

  if (admin && parseTs(admin.locked_until) > Date.now()) {
    return { ok: false, reason: "locked" };
  }

  // Selalu jalankan satu bcrypt.compare, ada atau tidak ada akunnya.
  let match = false;
  try {
    match = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
  } catch {
    match = false;
  }

  if (!admin || !match) {
    db.prepare(
      "INSERT INTO portfolio_login_attempts (ip_hash, created_at) VALUES (?, ?)",
    ).run(ipHash, new Date().toISOString());
    if (admin) {
      const fails = Number(admin.failed_attempts ?? 0) + 1;
      db.prepare(
        "UPDATE portfolio_admins SET failed_attempts = ?, locked_until = ? WHERE id = ?",
      ).run(
        fails,
        fails >= MAX_FAILS
          ? new Date(Date.now() + LOCK_MIN * 60_000).toISOString()
          : null,
        admin.id,
      );
    }
    return { ok: false, reason: "invalid" };
  }

  db.prepare(
    "UPDATE portfolio_admins SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?",
  ).run(new Date().toISOString(), admin.id);

  return { ok: true, id: admin.id, email: admin.email };
}