import { NextResponse, connection } from "next/server";
import { randomUUID } from "node:crypto";
import { getWritableDb } from "@/lib/db";
import { nowTs } from "@/lib/admin-data";
import { saveImage, removeUploadedUrls } from "@/lib/uploads";
import { isLimited, recordHit } from "@/lib/rate-limit";
import { clientIp, hashIp, isAdmin } from "@/lib/admin-session";
import { isSameOrigin, tooLarge } from "@/lib/request-guard";

const MAX_FILE = 5 * 1024 * 1024;
const MAX_BODY = MAX_FILE + 100_000; // foto + field teks
const LIMIT = 5; // komentar
const WINDOW_MIN = 10; // per 10 menit per IP
const PAGE_DEFAULT = 20;
const PAGE_MAX = 50;

type Row = {
  id: string;
  name: string;
  message: string;
  avatar_url: string | null;
  is_admin: unknown;
  pinned: unknown;
  pinned_at: string | null;
  created_at: string;
};

// Boolean dari backup Postgres tersimpan sebagai 't'/'f'; data baru 1/0
const truthy = (v: unknown) =>
  v === 1 || v === true || v === "1" || v === "t" || v === "true";

const PINNED_SQL = "CASE WHEN pinned IN ('t','true','1',1) THEN 1 ELSE 0 END";

// "2026-10-01 12:00:00.123+00" -> ISO yang aman dibaca new Date() di browser
function toIso(v: string | null) {
  if (!v) return v;
  let s = v.trim().replace(" ", "T");
  if (/[+-]\d\d$/.test(s)) s += ":00";
  const t = Date.parse(s);
  return Number.isNaN(t) ? v : new Date(t).toISOString();
}

function intParam(value: string | null, fallback: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

// GET /api/comments?limit=20&offset=0
export async function GET(req: Request) {
  // Paksa dijalankan per request (jangan di-prerender saat build).
  await connection();

  const url = new URL(req.url);
  const limit = intParam(url.searchParams.get("limit"), PAGE_DEFAULT, 1, PAGE_MAX);
  const offset = intParam(url.searchParams.get("offset"), 0, 0, 100_000);

  try {
    const db = getWritableDb();
    const { n } = db
      .prepare("SELECT COUNT(*) AS n FROM portfolio_comments")
      .get() as { n: number };

    const rows = db
      .prepare(
        `SELECT id,name,message,avatar_url,is_admin,pinned,pinned_at,created_at
         FROM portfolio_comments
         ORDER BY ${PINNED_SQL} DESC, pinned_at DESC, created_at DESC, id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as Row[];

    return NextResponse.json({
      comments: rows.map((r) => ({
        id: r.id,
        name: r.name,
        message: r.message,
        avatar_url: r.avatar_url,
        is_admin: truthy(r.is_admin),
        pinned: truthy(r.pinned),
        pinned_at: toIso(r.pinned_at),
        created_at: toIso(r.created_at),
      })),
      count: n,
      hasMore: offset + rows.length < n,
    });
  } catch (e) {
    console.error("[comments] GET:", e);
    return NextResponse.json({ error: "Gagal memuat komentar." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (tooLarge(req, MAX_BODY)) {
    return NextResponse.json({ error: "Ukuran request terlalu besar." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }

  // Honeypot: bot mengisi, manusia tidak. Pura-pura sukses.
  if (String(form.get("website") ?? "")) {
    return NextResponse.json({ ok: true });
  }

  const rawName = form.get("name");
  const rawMessage = form.get("message");
  const photo = form.get("photo");
  if (typeof rawName !== "string" || typeof rawMessage !== "string") {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
  const name = rawName.trim();
  const message = rawMessage.trim();

  if (name.length < 1 || name.length > 50) {
    return NextResponse.json({ error: "Nama wajib diisi (maks 50 karakter)." }, { status: 400 });
  }
  if (message.length < 1 || message.length > 500) {
    return NextResponse.json({ error: "Pesan wajib diisi (maks 500 karakter)." }, { status: 400 });
  }

  // Rate limit per IP
  const ipHash = hashIp(clientIp(req));
  if (isLimited(ipHash, "comment", LIMIT, WINDOW_MIN)) {
    return NextResponse.json(
      { error: "Terlalu banyak komentar. Coba lagi beberapa menit lagi." },
      { status: 429 },
    );
  }

  // Foto opsional
  let avatarUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_FILE) {
      return NextResponse.json({ error: "Ukuran foto maksimal 5MB." }, { status: 400 });
    }
    const saved = await saveImage(photo, "avatars");
    if ("error" in saved) {
      return saved.error === "type"
        ? NextResponse.json(
            { error: "Format foto harus JPG, PNG, WEBP, atau GIF." },
            { status: 400 },
          )
        : NextResponse.json({ error: "Gagal mengunggah foto." }, { status: 500 });
    }
    avatarUrl = saved.url;
  }

  try {
    getWritableDb()
      .prepare(
        `INSERT INTO portfolio_comments (id,name,message,avatar_url,is_admin,pinned,pinned_at,created_at)
         VALUES (?,?,?,?,?,0,NULL,?)`,
      )
      .run(randomUUID(), name, message, avatarUrl, (await isAdmin()) ? 1 : 0, nowTs());
  } catch (e) {
    console.error("[comments] POST:", e);
    await removeUploadedUrls([avatarUrl]);
    return NextResponse.json({ error: "Gagal menyimpan komentar." }, { status: 500 });
  }

  recordHit(ipHash, "comment");
  return NextResponse.json({ ok: true }, { status: 201 });
}