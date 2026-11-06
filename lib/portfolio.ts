import "server-only";
import Database from "better-sqlite3";
import path from "path";
import type { ProjectItem, CertificateItem } from "../components/PortfolioShowcase";

let db: Database.Database | null = null;
function getDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), "data.db"), {
      readonly: true,
      fileMustExist: true,
    });
  }
  return db;
}

// Terima array Postgres ({a,"b c"}), JSON (["a","b"]), atau null
export function parseList(v: unknown): string[] {
  if (v == null || v === "") return [];
  const s = String(v).trim();
  if (s.startsWith("[")) {
    try {
      const a = JSON.parse(s);
      return Array.isArray(a) ? a.map(String) : [];
    } catch {
      return [];
    }
  }
  if (s.startsWith("{") && s.endsWith("}")) {
    const inner = s.slice(1, -1);
    if (!inner) return [];
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (inQ) {
        if (ch === "\\") cur += inner[++i];
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  }
  return [s];
}

export type ProjectDetail = {
  title: string;
  slug: string;
  poster_url: string;
  gallery_urls: string[] | null;
  description: string;
  readme_md: string | null;
  technologies: string[];
  demo_url: string;
  key_features: string[];
};

export function getProjects(): ProjectItem[] {
  const rows = getDb()
    .prepare(
      "SELECT id,title,slug,poster_url,description,technologies FROM portfolio_projects ORDER BY created_at DESC",
    )
    .all() as Record<string, string | null>[];
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    poster_url: r.poster_url as string,
    description: (r.description ?? "") as string,
    technologies: parseList(r.technologies),
  }));
}

export function getCertificates(): CertificateItem[] {
  return getDb()
    .prepare("SELECT id,image_url FROM portfolio_certificates ORDER BY created_at DESC")
    .all() as CertificateItem[];
}

export function getProjectBySlug(slug: string): ProjectDetail | null {
  const r = getDb()
    .prepare(
      "SELECT title,slug,poster_url,gallery_urls,description,readme_md,technologies,demo_url,key_features FROM portfolio_projects WHERE slug = ?",
    )
    .get(slug) as Record<string, string | null> | undefined;
  if (!r) return null;
  const gallery = parseList(r.gallery_urls);
  return {
    title: r.title as string,
    slug: r.slug as string,
    poster_url: r.poster_url as string,
    gallery_urls: gallery.length ? gallery : null,
    description: (r.description ?? "") as string,
    readme_md: r.readme_md,
    technologies: parseList(r.technologies),
    demo_url: (r.demo_url ?? "") as string,
    key_features: parseList(r.key_features),
  };
}