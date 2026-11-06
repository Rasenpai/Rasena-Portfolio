import type { MetadataRoute } from "next";
import { SITE_URL } from "../data/seo";
import { navLinks } from "../data/content";
import { getProjects } from "../lib/portfolio";

// Harus sama dengan nama folder route detail: app/project/[slug]
const PROJECT_BASE_PATH = "/project";

// Sitemap dibuat ulang paling cepat tiap 1 jam
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  // Ikut menu navbar: href dibuang bagian #anchor-nya (Google mengabaikan #fragment),
  // lalu digabung kalau path-nya sama. Jadi menu baru di navLinks otomatis masuk sitemap.
  const paths = [
    ...new Set(navLinks.map((l) => l.href.split("#")[0] || "/")),
  ];

  const pages: MetadataRoute.Sitemap = paths.map((p) => ({
    url: p === "/" ? SITE_URL : `${SITE_URL}${p}`,
  }));

  try {
    for (const proj of getProjects()) {
      pages.push({ url: `${SITE_URL}${PROJECT_BASE_PATH}/${proj.slug}` });
    }
  } catch {
    /* DB belum siap: lewati, sitemap utama tetap jalan */
  }

  return pages;
}