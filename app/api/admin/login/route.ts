import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  clientIp,
  createSessionToken,
  hashIp,
} from "@/lib/admin-session";
import { verifyAdminLogin } from "@/lib/admin-auth";
import { isSameOrigin, tooLarge } from "@/lib/request-guard";

const GENERIC = "Email atau password salah.";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (tooLarge(req, 2_000)) {
    return NextResponse.json({ error: GENERIC }, { status: 413 });
  }

  const body = (await req.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;

  if (typeof body?.email !== "string" || typeof body?.password !== "string") {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }
  const email = body.email.trim().toLowerCase();
  const password = body.password;
  if (!email || email.length > 120 || !password || password.length > 200) {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const result = await verifyAdminLogin(email, password, hashIp(clientIp(req)));

  if (!result.ok) {
    if (result.reason === "rate_limited") {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429 },
      );
    }
    if (result.reason === "locked") {
      return NextResponse.json(
        { error: "Akun terkunci sementara. Coba lagi nanti." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(result.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return res;
}