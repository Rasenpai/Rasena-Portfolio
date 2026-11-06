import { NextResponse } from "next/server";
import { getWritableDb } from "@/lib/db";
import { nowTs } from "@/lib/admin-data";
import { removeUploadedUrls } from "@/lib/uploads";
import { isAdmin } from "@/lib/admin-session";
import { isSameOrigin } from "@/lib/request-guard";

type Ctx = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pin / unpin
export async function PATCH(req: Request, { params }: Ctx) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { pinned?: unknown } | null;
  if (typeof body?.pinned !== "boolean") {
    return NextResponse.json({ error: "Field 'pinned' wajib boolean." }, { status: 400 });
  }

  try {
    getWritableDb()
      .prepare("UPDATE portfolio_comments SET pinned = ?, pinned_at = ? WHERE id = ?")
      .run(body.pinned ? 1 : 0, body.pinned ? nowTs() : null, id);
  } catch (e) {
    console.error("[comments] PATCH:", e);
    return NextResponse.json({ error: "Gagal mengubah pin." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Hapus komentar (+ foto profilnya)
export async function DELETE(req: Request, { params }: Ctx) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  const { id } = await params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const db = getWritableDb();
  const row = db
    .prepare("SELECT avatar_url FROM portfolio_comments WHERE id = ?")
    .get(id) as { avatar_url: string | null } | undefined;

  try {
    db.prepare("DELETE FROM portfolio_comments WHERE id = ?").run(id);
  } catch (e) {
    console.error("[comments] DELETE:", e);
    return NextResponse.json({ error: "Gagal menghapus komentar." }, { status: 500 });
  }

  await removeUploadedUrls([row?.avatar_url]);
  return NextResponse.json({ ok: true });
}