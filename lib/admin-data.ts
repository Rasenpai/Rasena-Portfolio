import "server-only";
import { getWritableDb } from "./db";
import { parseList } from "./portfolio";

type Row = Record<string, string | null>;

// Format timestamp sama dengan data lama dari Postgres: "2026-11-05 08:00:00.000+00"
export function nowTs() {
  return new Date().toISOString().replace("T", " ").replace("Z", "+00");
}

// Galeri sebuah project. Baris lama bisa hanya punya poster, tanpa gallery.
export function galleryOf(r: Row): { paths: string[]; urls: string[] } {
  const urls = parseList(r.gallery_urls);
  if (urls.length === 0) {
    if (!r.poster_url) return { paths: [], urls: [] };
    return { paths: [r.poster_path || r.poster_url], urls: [r.poster_url] };
  }
  let paths = parseList(r.gallery_paths);
  if (paths.length !== urls.length) paths = urls;
  return { paths, urls };
}

export type AdminProject = {
  id: string;
  title: string;
  slug: string;
  poster_url: string;
  description: string;
  technologies: string[];
  demo_url: string;
  key_features: string[];
};
export type AdminCertificate = { id: string; image_url: string };

export function listProjects(): AdminProject[] {
  const rows = getWritableDb()
    .prepare(
      "SELECT id,title,slug,poster_url,description,technologies,demo_url,key_features FROM portfolio_projects ORDER BY created_at DESC",
    )
    .all() as Row[];
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    poster_url: r.poster_url as string,
    description: r.description ?? "",
    technologies: parseList(r.technologies),
    demo_url: r.demo_url ?? "",
    key_features: parseList(r.key_features),
  }));
}

export function listCertificates(): AdminCertificate[] {
  return getWritableDb()
    .prepare(
      "SELECT id,image_url FROM portfolio_certificates ORDER BY created_at DESC",
    )
    .all() as AdminCertificate[];
}

export function getProjectForEdit(id: string) {
  const r = getWritableDb()
    .prepare(
      "SELECT id,title,description,technologies,demo_url,key_features,poster_url,poster_path,gallery_urls,gallery_paths,readme_md FROM portfolio_projects WHERE id = ?",
    )
    .get(id) as Row | undefined;
  if (!r) return null;
  const g = galleryOf(r);
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description ?? "",
    technologies: parseList(r.technologies),
    demo_url: r.demo_url ?? "",
    key_features: parseList(r.key_features),
    gallery: g.paths.map((path, i) => ({ path, url: g.urls[i] })),
    has_readme: !!r.readme_md,
  };
}

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

// Tabel dibuat lazy oleh /api/contact, jadi bisa belum ada: anggap kosong
export function listMessages(): AdminMessage[] {
  try {
    return getWritableDb()
      .prepare(
        "SELECT id,name,email,message,read_at,created_at FROM portfolio_messages ORDER BY created_at DESC LIMIT 200",
      )
      .all() as AdminMessage[];
  } catch {
    return [];
  }
}