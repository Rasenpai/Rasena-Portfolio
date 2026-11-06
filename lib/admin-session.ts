import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";

// Server only.
// Kalau project kamu SUDAH punya helper session admin (dari portfolio_admins),
// cukup ganti isi isAdmin() di bawah agar memanggil helper itu.

export const ADMIN_COOKIE = "portfolio_admin";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8; // 8 jam

export type SessionUser = { id: string; email?: string };

type SessionData = {
  sub: string;
  email?: string;
  exp: number;
};

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET harus diisi, minimal 32 karakter.");
  }
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(adminId: string, email?: string) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: adminId,
      email,
      exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// Hanya boleh dipanggil setelah akses dinamis (cookies()/connection()).
export function verifySessionToken(token?: string | null): SessionData | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionData;
    if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(user.id, user.email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
}

export async function getSession() {
  await connection(); // paksa request-time sebelum Date.now() dipakai
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export async function destroySession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  return (await getSession()) !== null;
}

export function hashIp(ip: string) {
  return createHash("sha256").update(`${ip}:${secret()}`).digest("hex");
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}