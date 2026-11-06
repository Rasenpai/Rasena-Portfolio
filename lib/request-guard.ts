// Server only. Pengaman tambahan untuk route yang mengubah data.

/**
 * Anti-CSRF: request yang mengubah data harus datang dari halaman di host yang sama.
 * Browser selalu mengirim header Origin untuk POST/PATCH/DELETE lewat fetch.
 */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Tolak body yang jelas kebesaran sebelum diparse. */
export function tooLarge(req: Request, maxBytes: number) {
  const len = Number(req.headers.get("content-length") ?? 0);
  return Number.isFinite(len) && len > maxBytes;
}