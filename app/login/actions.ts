"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "../../lib/admin-session";
import { verifyAdminLogin } from "../../lib/admin-auth";

export type LoginState = { error?: string };

const GENERIC = "Email atau password salah.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// IP di-hash (HMAC) sebelum disimpan, jadi IP asli tidak tercatat di database
async function ipHash() {
  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown";
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET!)
    .update(ip)
    .digest("hex");
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  // Tolak selain string (mis. File) dan input berukuran tidak wajar
  if (typeof rawEmail !== "string" || typeof rawPassword !== "string") {
    return { error: GENERIC };
  }
  const email = rawEmail.trim().toLowerCase();
  if (
    email.length > 254 ||
    !EMAIL_RE.test(email) ||
    rawPassword.length < 1 ||
    rawPassword.length > 128
  ) {
    return { error: GENERIC };
  }

  let result;
  try {
    result = await verifyAdminLogin(email, rawPassword, await ipHash());
  } catch (e) {
    console.error("[admin-login] db error:", e);
    return { error: "Terjadi kesalahan server. Coba lagi." };
  }

  // Pesan sama untuk email salah, password salah, akun terkunci, maupun IP diblokir
  if (!result.ok) return { error: GENERIC };

  await createSession({ id: result.id, email: result.email });
  redirect("/admin");
}