import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getWritableDb } from "@/lib/db";
import { nowTs } from "@/lib/admin-data";
import { isLimited, recordHit } from "@/lib/rate-limit";
import { clientIp, hashIp } from "@/lib/admin-session";
import { isSameOrigin, tooLarge } from "@/lib/request-guard";

const LIMIT = 3; // pesan
const WINDOW_MIN = 30; // per 30 menit per IP
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let ready = false;
function messagesDb() {
  const db = getWritableDb();
  if (!ready) {
    // Tidak berpengaruh kalau tabel sudah ada (mis. hasil migrasi dari backup)
    db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_messages (
        id TEXT,
        name TEXT,
        email TEXT,
        message TEXT,
        read_at TEXT,
        created_at TEXT
      )
    `);
    ready = true;
  }
  return db;
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (tooLarge(req, 20_000)) {
    return NextResponse.json({ error: "Ukuran request terlalu besar." }, { status: 413 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  // Honeypot
  if (typeof body.website === "string" && body.website) {
    return NextResponse.json({ ok: true });
  }

  if (
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.message !== "string"
  ) {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  const name = body.name.trim();
  const email = body.email.trim();
  const message = body.message.trim();

  if (name.length < 1 || name.length > 80) {
    return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 120) {
    return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
  }
  if (message.length < 1 || message.length > 2000) {
    return NextResponse.json({ error: "Pesan wajib diisi (maks 2000 karakter)." }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(req));
  if (isLimited(ipHash, "message", LIMIT, WINDOW_MIN)) {
    return NextResponse.json(
      { error: "Terlalu banyak pesan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  try {
    messagesDb()
      .prepare(
        "INSERT INTO portfolio_messages (id,name,email,message,read_at,created_at) VALUES (?,?,?,?,NULL,?)",
      )
      .run(randomUUID(), name, email, message, nowTs());
  } catch (e) {
    console.error("[contact] POST:", e);
    return NextResponse.json({ error: "Gagal mengirim pesan." }, { status: 500 });
  }

  recordHit(ipHash, "message");
  return NextResponse.json({ ok: true }, { status: 201 });
}