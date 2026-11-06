import "server-only";
import Database from "better-sqlite3";
import path from "path";

// Koneksi yang bisa menulis (dipakai login/admin).
// lib/portfolio.ts tetap memakai koneksi readonly sendiri.
let db: Database.Database | null = null;

export function getWritableDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), "data.db"), {
      fileMustExist: true,
    });
    db.pragma("busy_timeout = 5000");
    db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
  }
  return db;
}