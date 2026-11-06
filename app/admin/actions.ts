"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWritableDb } from "../../lib/db";
import { galleryOf, nowTs } from "../../lib/admin-data";
import { getSession, destroySession } from "../../lib/admin-session";

export type FormState = { error?: string; ok?: boolean };

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_IMG = 5 * 1024 * 1024;
const MAX_PROJECT_IMAGES = 8;
const MAX_MD = 200 * 1024; // 200KB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = Record<string, string | null>;

// Setiap action wajib lolos pengecekan sesi di server
async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

// Halaman publik dibaca dari SQLite, jadi segarkan semuanya setelah ada perubahan
function refreshAll() {
  revalidatePath("/", "layout");
}

// Deteksi tipe gambar dari isi file (magic bytes), bukan dari nama/tipe kiriman klien
function detectImage(b: Uint8Array): { ext: string; mime: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return { ext: "png", mime: "image/png" };
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return { ext: "webp", mime: "image/webp" };
  return null;
}

type Saved = { path: string; url: string };

async function saveImage(
  file: FormDataEntryValue | null,
  folder: "projects" | "certificates",
): Promise<Saved | { error: string }> {
  if (!(file instanceof File) || file.size === 0)
    return { error: "Gambar wajib dipilih." };
  if (file.size > MAX_IMG) return { error: "Ukuran gambar maksimal 5MB." };

  const buf = new Uint8Array(await file.arrayBuffer());
  const type = detectImage(buf);
  if (!type) return { error: "Format harus JPG, PNG, atau WebP." };

  const rel = `${folder}/${randomUUID()}.${type.ext}`;
  try {
    const target = path.join(UPLOAD_ROOT, rel);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buf);
  } catch (e) {
    console.error("[admin] save image error:", e);
    return { error: "Gagal menyimpan gambar." };
  }
  return { path: rel, url: `/uploads/${rel}` };
}

// Hapus file di public/uploads berdasarkan URL-nya. URL lain (mis. Supabase lama) diabaikan.
async function removeUrls(urls: (string | null | undefined)[]) {
  for (const u of new Set(urls)) {
    if (!u || !u.startsWith("/uploads/")) continue;
    try {
      const target = path.resolve(
        UPLOAD_ROOT,
        decodeURIComponent(u.slice("/uploads/".length)),
      );
      if (!target.startsWith(UPLOAD_ROOT + path.sep)) continue;
      await unlink(target);
    } catch {
      // file sudah tidak ada: tidak masalah
    }
  }
}

// Simpan banyak gambar; kalau satu gagal, yang sudah tersimpan dibatalkan
async function saveImages(
  files: FormDataEntryValue[],
  folder: "projects" | "certificates",
): Promise<Saved[] | { error: string }> {
  const valid = files.filter((f): f is File => f instanceof File && f.size > 0);
  if (valid.length === 0) return { error: "Pilih minimal 1 gambar." };
  if (valid.length > MAX_PROJECT_IMAGES)
    return { error: `Maksimal ${MAX_PROJECT_IMAGES} gambar.` };

  const done: Saved[] = [];
  for (const f of valid) {
    const res = await saveImage(f, folder);
    if ("error" in res) {
      await removeUrls(done.map((d) => d.url));
      return { error: res.error };
    }
    done.push(res);
  }
  return done;
}

// Baca file markdown (opsional). Return: teks, null (tidak diisi), atau error.
async function readMarkdown(
  file: FormDataEntryValue | null,
): Promise<{ text: string | null } | { error: string }> {
  if (!(file instanceof File) || file.size === 0) return { text: null };
  if (!/\.(md|markdown)$/i.test(file.name))
    return { error: "File README harus berformat .md atau .markdown." };
  if (file.size > MAX_MD) return { error: "Ukuran file markdown maksimal 200KB." };

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      new Uint8Array(await file.arrayBuffer()),
    );
  } catch {
    return { error: "File markdown harus berupa teks UTF-8 yang valid." };
  }

  text = text.replace(/^﻿/, ""); // buang BOM
  if (text.includes("\u0000"))
    return { error: "File markdown berisi karakter yang tidak valid." };
  if (!text.trim()) return { text: null };
  return { text };
}

function slugify(s: string) {
  const out = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return out || "project";
}

function splitList(raw: string, maxItems: number, maxLen: number) {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const v = part.trim().slice(0, maxLen);
    if (v) seen.add(v);
  }
  return [...seen].slice(0, maxItems);
}

function cleanUrl(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function createProject(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const title = str(fd.get("title"));
  const description = str(fd.get("description"));
  const demo = cleanUrl(str(fd.get("demo_url")));
  const technologies = splitList(str(fd.get("technologies")), 20, 40);
  const features = splitList(str(fd.get("key_features")), 20, 120);

  if (!title || title.length > 100) return { error: "Title wajib, maksimal 100 karakter." };
  if (!description || description.length > 2000)
    return { error: "Deskripsi wajib, maksimal 2000 karakter." };
  if (!demo) return { error: "Link demo harus berupa URL http/https yang valid." };
  if (features.length === 0) return { error: "Isi minimal 1 key feature." };

  // Validasi markdown sebelum simpan gambar, supaya tidak ada gambar yatim
  const md = await readMarkdown(fd.get("readme"));
  if ("error" in md) return { error: md.error };

  const ups = await saveImages(fd.getAll("posters"), "projects");
  if ("error" in ups) return { error: ups.error };

  const paths = ups.map((u) => u.path);
  const urls = ups.map((u) => u.url);

  try {
    const db = getWritableDb();
    // Slug otomatis; kalau bentrok tambahkan akhiran acak
    const base = slugify(title);
    let slug = base;
    for (let i = 0; i < 4; i++) {
      if (!db.prepare("SELECT 1 FROM portfolio_projects WHERE slug = ?").get(slug))
        break;
      slug = `${base}-${randomUUID().slice(0, 4)}`;
    }

    db.prepare(
      `INSERT INTO portfolio_projects
        (id,title,slug,poster_url,poster_path,gallery_urls,gallery_paths,description,readme_md,technologies,demo_url,key_features,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      randomUUID(),
      title,
      slug,
      urls[0], // cover = gambar pertama
      paths[0],
      JSON.stringify(urls),
      JSON.stringify(paths),
      description,
      md.text,
      JSON.stringify(technologies),
      demo,
      JSON.stringify(features),
      nowTs(),
    );
  } catch (e) {
    console.error("[admin] insert project:", e);
    await removeUrls(urls); // batalkan gambar yatim
    return { error: "Gagal menyimpan project." };
  }

  refreshAll();
  return { ok: true };
}

// Edit project: field teks, README, dan galeri gambar.
// Slug sengaja tidak diubah supaya link lama tetap jalan.
export async function updateProject(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = str(fd.get("id"));
  if (!UUID_RE.test(id)) return { error: "ID project tidak valid." };

  const title = str(fd.get("title"));
  const description = str(fd.get("description"));
  const demo = cleanUrl(str(fd.get("demo_url")));
  const technologies = splitList(str(fd.get("technologies")), 20, 40);
  const features = splitList(str(fd.get("key_features")), 20, 120);

  if (!title || title.length > 100) return { error: "Title wajib, maksimal 100 karakter." };
  if (!description || description.length > 2000)
    return { error: "Deskripsi wajib, maksimal 2000 karakter." };
  if (!demo) return { error: "Link demo harus berupa URL http/https yang valid." };
  if (features.length === 0) return { error: "Isi minimal 1 key feature." };

  // Validasi markdown sebelum simpan gambar, supaya tidak ada gambar yatim
  const md = await readMarkdown(fd.get("readme"));
  if ("error" in md) return { error: md.error };
  const removeReadme = fd.get("remove_readme") === "on";

  const db = getWritableDb();
  const cur = db
    .prepare(
      "SELECT poster_url,poster_path,gallery_urls,gallery_paths FROM portfolio_projects WHERE id = ?",
    )
    .get(id) as Row | undefined;
  if (!cur) return { error: "Project tidak ditemukan." };

  const curG = galleryOf(cur);

  // Urutan "keep" dari form = urutan akhir; hanya path milik project ini yang diterima
  const keepPaths: string[] = [];
  const keepUrls: string[] = [];
  for (const v of fd.getAll("keep")) {
    if (typeof v !== "string") continue;
    const idx = curG.paths.indexOf(v);
    if (idx === -1 || keepPaths.includes(v)) continue;
    keepPaths.push(v);
    keepUrls.push(curG.urls[idx]);
  }

  const newFiles = fd
    .getAll("posters")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (keepPaths.length + newFiles.length === 0)
    return { error: "Project harus punya minimal 1 gambar." };
  if (keepPaths.length + newFiles.length > MAX_PROJECT_IMAGES)
    return { error: `Maksimal ${MAX_PROJECT_IMAGES} gambar.` };

  let addedPaths: string[] = [];
  let addedUrls: string[] = [];
  if (newFiles.length) {
    const ups = await saveImages(newFiles, "projects");
    if ("error" in ups) return { error: ups.error };
    addedPaths = ups.map((u) => u.path);
    addedUrls = ups.map((u) => u.url);
  }

  const paths = [...keepPaths, ...addedPaths];
  const urls = [...keepUrls, ...addedUrls];

  // README: file baru menimpa; centang hapus mengosongkan; selain itu tidak berubah
  let readmeSql = "";
  const params: (string | null)[] = [
    title,
    urls[0], // cover = gambar pertama
    paths[0],
    JSON.stringify(urls),
    JSON.stringify(paths),
    description,
    JSON.stringify(technologies),
    demo,
    JSON.stringify(features),
  ];
  if (md.text !== null) {
    readmeSql = ", readme_md = ?";
    params.push(md.text);
  } else if (removeReadme) {
    readmeSql = ", readme_md = NULL";
  }
  params.push(id);

  try {
    db.prepare(
      `UPDATE portfolio_projects SET
        title = ?, poster_url = ?, poster_path = ?, gallery_urls = ?, gallery_paths = ?,
        description = ?, technologies = ?, demo_url = ?, key_features = ?${readmeSql}
       WHERE id = ?`,
    ).run(...params);
  } catch (e) {
    console.error("[admin] update project:", e);
    await removeUrls(addedUrls);
    return { error: "Gagal menyimpan perubahan." };
  }

  // Hapus file yang sudah tidak dipakai
  const used = new Set(urls);
  await removeUrls([...curG.urls, cur.poster_url].filter((u) => u && !used.has(u)));

  refreshAll();
  redirect("/admin");
}

export async function deleteProject(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd.get("id"));
  if (!UUID_RE.test(id)) return;

  const db = getWritableDb();
  const cur = db
    .prepare(
      "SELECT poster_url,poster_path,gallery_urls,gallery_paths FROM portfolio_projects WHERE id = ?",
    )
    .get(id) as Row | undefined;
  if (!cur) return;

  try {
    db.prepare("DELETE FROM portfolio_projects WHERE id = ?").run(id);
  } catch (e) {
    console.error("[admin] delete project:", e);
    return;
  }
  await removeUrls([...galleryOf(cur).urls, cur.poster_url]);
  refreshAll();
}

export async function createCertificate(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const up = await saveImage(fd.get("image"), "certificates");
  if ("error" in up) return { error: up.error };

  try {
    getWritableDb()
      .prepare(
        "INSERT INTO portfolio_certificates (id,image_url,image_path,created_at) VALUES (?,?,?,?)",
      )
      .run(randomUUID(), up.url, up.path, nowTs());
  } catch (e) {
    console.error("[admin] insert certificate:", e);
    await removeUrls([up.url]);
    return { error: "Gagal menyimpan sertifikat." };
  }
  refreshAll();
  return { ok: true };
}

// Edit sertifikat = ganti gambarnya (satu-satunya field yang ada)
export async function updateCertificate(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const id = str(fd.get("id"));
  if (!UUID_RE.test(id)) return { error: "ID tidak valid." };

  const db = getWritableDb();
  const cur = db
    .prepare("SELECT image_url FROM portfolio_certificates WHERE id = ?")
    .get(id) as Row | undefined;
  if (!cur) return { error: "Sertifikat tidak ditemukan." };

  const up = await saveImage(fd.get("image"), "certificates");
  if ("error" in up) return { error: up.error };

  try {
    db.prepare(
      "UPDATE portfolio_certificates SET image_url = ?, image_path = ? WHERE id = ?",
    ).run(up.url, up.path, id);
  } catch (e) {
    console.error("[admin] update certificate:", e);
    await removeUrls([up.url]);
    return { error: "Gagal mengganti sertifikat." };
  }

  await removeUrls([cur.image_url]);
  refreshAll();
  return { ok: true };
}

export async function deleteCertificate(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd.get("id"));
  if (!UUID_RE.test(id)) return;

  const db = getWritableDb();
  const cur = db
    .prepare("SELECT image_url FROM portfolio_certificates WHERE id = ?")
    .get(id) as Row | undefined;
  if (!cur) return;

  try {
    db.prepare("DELETE FROM portfolio_certificates WHERE id = ?").run(id);
  } catch (e) {
    console.error("[admin] delete certificate:", e);
    return;
  }
  await removeUrls([cur.image_url]);
  refreshAll();
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function markMessageRead(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd.get("id"));
  if (!UUID_RE.test(id)) return;
  try {
    getWritableDb()
      .prepare("UPDATE portfolio_messages SET read_at = ? WHERE id = ? AND read_at IS NULL")
      .run(nowTs(), id);
  } catch (e) {
    console.error("[admin] mark message:", e);
    return;
  }
  revalidatePath("/admin/messages");
}

export async function deleteMessage(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd.get("id"));
  if (!UUID_RE.test(id)) return;
  try {
    getWritableDb().prepare("DELETE FROM portfolio_messages WHERE id = ?").run(id);
  } catch (e) {
    console.error("[admin] delete message:", e);
    return;
  }
  revalidatePath("/admin/messages");
}