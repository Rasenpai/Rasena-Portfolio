import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container, Section } from "../../../components/ui";
import PrivateRepoButton from "../../../components/PrivateRepoButton";
import ProjectGallery from "../../../components/ProjectGallery";
import MarkdownView from "../../../components/MarkdownView";
import { getProjectBySlug } from "../../../lib/portfolio";
import { SITE_URL, SITE_NAME } from "../../../data/seo";

// Harus sama dengan nama folder route ini (app/project/[slug]) dan dengan
// PROJECT_BASE_PATH di app/sitemap.ts.
const PROJECT_BASE_PATH = "/project";
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

/* ---------- Helper SEO ---------- */

// Deskripsi project berformat markdown: bersihkan jadi teks biasa untuk meta description
function toPlainText(md: string | null | undefined, max = 155): string {
  const text = (md ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/[*`>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (
    cut.slice(0, lastSpace > 80 ? lastSpace : max).replace(/[.,;:!\s-]+$/, "") +
    "…"
  );
}

// URL gambar harus absolut untuk Open Graph dan structured data
function absoluteUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("/")) return `${SITE_URL}${u}`;
  return null;
}

// Escape "<" supaya JSON tidak bisa menutup tag script
const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

/* ---------- Metadata per project ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = SLUG_RE.test(slug) ? getProjectBySlug(slug) : null;

  if (!p) {
    return {
      title: "Project tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const path = `${PROJECT_BASE_PATH}/${slug}`;
  const title = `${p.title} (Project Portfolio)`;
  const description =
    toPlainText(p.description) ||
    `Project ${p.title} oleh Rasena${
      p.technologies.length
        ? `, dibangun dengan ${p.technologies.join(", ")}`
        : ""
    }.`;
  const image = absoluteUrl(p.poster_url) ?? `${SITE_URL}/og.png`;

  return {
    title,
    description,
    keywords: [p.title, ...p.technologies, "Rasena", "Portfolio"],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      siteName: `${SITE_NAME} - Portfolio`,
      title,
      description,
      locale: "id_ID",
      images: [{ url: image, alt: p.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

const panel =
  "rounded-2xl border border-[#8b6dff30] bg-[#0f0c24]/70 backdrop-blur-md";

function CubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <Section id="project-loading">
          <Container>
            <p className="m-0 text-sm text-muted">Memuat project...</p>
          </Container>
        </Section>
      }
    >
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();

  const p = getProjectBySlug(slug);
  if (!p) notFound();

  // Project lama (tanpa gallery) tetap tampil dengan poster sebagai satu-satunya gambar
  const images =
    p.gallery_urls && p.gallery_urls.length > 0
      ? p.gallery_urls
      : [p.poster_url];

  // Structured data: project ini + breadcrumb, terhubung ke entitas Person di layout
  const pageUrl = `${SITE_URL}${PROJECT_BASE_PATH}/${slug}`;
  const personRef = { "@id": `${SITE_URL}/#person` };
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${pageUrl}#project`,
        name: p.title,
        description: toPlainText(p.description, 300),
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        image: images
          .map((u) => absoluteUrl(u))
          .filter((u): u is string => Boolean(u)),
        keywords: p.technologies.join(", "),
        inLanguage: "id-ID",
        author: personRef,
        creator: personRef,
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: p.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <Section id="project-detail">
        <Container>
          {/* Back + breadcrumb */}
          <div className="mb-7 flex min-w-0 items-center gap-3 sm:mb-10 sm:gap-4">
            <Link
              href="/#portfolio"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#8b6dff30] bg-[#0f0c24]/70 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b58aff20] sm:gap-2.5 sm:px-5 sm:py-3 sm:text-[15px]"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-sm text-muted sm:gap-2.5 sm:text-[15px]"
            >
              <Link
                href="/#portfolio"
                className="hidden hover:text-white sm:inline"
              >
                Projects
              </Link>
              <span aria-hidden="true" className="hidden sm:inline">
                ›
              </span>
              <span className="truncate font-medium text-white">{p.title}</span>
            </nav>
          </div>

          {/*
            Mobile: wrapper kiri/kanan memakai `contents`, jadi semua blok jadi
            satu kolom dan urutannya diatur lewat `order-*`.
            Desktop (lg): wrapper jadi dua kolom seperti semula.
          */}
          <div className="grid min-w-0 lg:grid-cols-[1.05fr_.95fr] lg:items-start lg:gap-14">
            {/* Kolom kiri */}
            <div className="contents lg:block">
              <div className="order-1">
                <h1 className="m-0 break-words text-[clamp(28px,7.5vw,64px)] font-bold leading-[1.1] tracking-[-0.03em] bg-linear-to-r from-[#e9e2ff] to-[#b9a8ff] bg-clip-text text-transparent">
                  {p.title}
                </h1>
                <div className="mb-6 mt-4 h-1 w-20 rounded-full bg-linear-to-r from-[#5b4dff] to-[#b04dff] shadow-[0_0_16px_#7c5cff80] sm:mb-8 sm:mt-5 sm:w-24" />
              </div>

              <div className="order-3 mb-6 lg:mb-8">
                <MarkdownView source={p.description} variant="lead" breaks />
              </div>

              {/* Statistik */}
              <div
                className={`${panel} order-4 mb-5 grid grid-cols-2 gap-3 p-3 sm:gap-4 sm:p-4 lg:mb-8`}
              >
                <div className="flex items-center gap-3 rounded-xl border border-[#5b4dff40] bg-[#14123a]/70 p-3 sm:gap-4 sm:p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#5b4dff30] text-[#8b9dff] sm:h-10 sm:w-10">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-xl font-bold leading-none text-white sm:text-2xl">
                      {p.technologies.length}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted sm:text-sm">
                      Teknologi
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-[#b04dff40] bg-[#1d1240]/70 p-3 sm:gap-4 sm:p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#b04dff30] text-[#c9a0ff] sm:h-10 sm:w-10">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m12 2 10 5-10 5L2 7l10-5Z" />
                      <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-xl font-bold leading-none text-white sm:text-2xl">
                      {p.key_features.length}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted sm:text-sm">
                      Fitur Utama
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol */}
              <div className="order-5 mb-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap sm:gap-4 lg:mb-10">
                <a
                  href={p.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-[#5b4dff50] bg-[#14123a]/70 px-5 py-3.5 text-[15px] font-semibold text-[#8b9dff] transition-all hover:-translate-y-0.5 hover:border-[#8b9dff80] hover:bg-[#1b1850]/70 sm:px-6 sm:py-4"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>
                  Lihat Demo
                </a>
                <div className="grid [&>*]:w-full [&>*]:justify-center sm:block sm:[&>*]:w-auto">
                  <PrivateRepoButton />
                </div>
              </div>

              {/* Teknologi */}
              {p.technologies.length > 0 && (
                <div className="order-6 mb-8 lg:mb-0">
                  <h2 className="mb-4 mt-0 flex items-center gap-3 text-xl font-bold text-white sm:mb-5 sm:text-2xl">
                    <span className="text-[#8b9dff]" aria-hidden="true">
                      &lt;/&gt;
                    </span>
                    Technologies Used
                  </h2>
                  <div className="flex flex-wrap gap-2.5 sm:gap-3">
                    {p.technologies.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#5b4dff40] bg-[#14123a]/70 px-3 py-2 text-[13px] font-semibold text-[#9aa8ff] sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        <CubeIcon />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Kolom kanan */}
            <div className="contents lg:grid lg:min-w-0 lg:gap-6">
              <div className="order-2 mb-7 min-w-0 lg:mb-0">
                <ProjectGallery images={images} title={p.title} />
              </div>

              <div className={`${panel} order-7 p-5 sm:p-8`}>
                <h2 className="m-0 mb-5 flex items-center gap-3 text-xl font-bold text-white sm:mb-6 sm:text-2xl">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="#b58aff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2Z" />
                  </svg>
                  Key Features
                </h2>
                <ul className="m-0 grid list-none gap-4 p-0 sm:gap-5">
                  {p.key_features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3.5 text-base text-[#e6e0f5] sm:gap-4 sm:text-[17px]"
                    >
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#8b9dff]" />
                      <span className="min-w-0 break-words">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Dokumentasi (README markdown) */}
          {p.readme_md && (
            <div className={`${panel} order-last mt-10 p-4 sm:p-10 lg:mt-14`}>
              <h2 className="m-0 mb-5 flex items-center gap-3 text-xl font-bold text-white sm:mb-6 sm:text-2xl">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#b58aff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                Dokumentasi
              </h2>
              <MarkdownView source={p.readme_md} />
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
