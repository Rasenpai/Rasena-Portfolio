"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

export type ProjectItem = {
  id: string;
  title: string;
  slug: string;
  poster_url: string;
  description: string;
  technologies: string[];
};
export type CertificateItem = { id: string; image_url: string };

type Tab = "projects" | "certificates";

const STAGGER = 100; // ms jeda antar kartu dalam satu baris
const COLS = 3; // jumlah kolom maksimal (lg:grid-cols-3)
const LIMIT = 6; // jumlah item yang tampil sebelum "See More"

const delayFor = (i: number) => (i % COLS) * STAGGER;

// Deskripsi di admin boleh berisi Markdown dan HTML (<b>, <br>, dll).
// Di kartu hanya dipakai sebagai cuplikan 2 baris, jadi diubah ke teks polos.
function toPlainText(src: string) {
  return src
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // gambar markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // link markdown
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+\.|>)\s+/gm, "") // heading, list, kutipan
    .replace(/\*+|`/g, "") // penanda tebal/miring/kode
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, "&") // terakhir, supaya &amp;lt; tidak didekode dua kali
    .replace(/\s+/g, " ")
    .trim();
}

/*
 * Kenapa hover sebelumnya terasa kurang halus, dan perbaikannya:
 *
 * 1. Hover dipasang di elemen yang ikut bergerak (-translate-y-1). Saat kursor
 *    ada di tepi bawah kartu, kartu naik 4px, kursor jadi di luar, kartu turun
 *    lagi, dan seterusnya (bergetar). Sekarang `group` dipasang di pembungkus
 *    yang diam, dan hanya elemen dalam yang bergerak.
 * 2. Transisi box-shadow 60px blur itu berat (repaint tiap frame). Sekarang
 *    glow adalah lapisan terpisah yang hanya dianimasikan opacity-nya
 *    (dikerjakan GPU).
 * 3. backdrop-blur + overflow-hidden + transform bisa membuat sudut bergerigi
 *    dan kedip, jadi ditambah `transform-gpu` / `will-change-transform`.
 * 4. Easing disamakan dengan tema (cubic-bezier 0.22,1,0.36,1) supaya terasa
 *    sama dengan animasi lain di situs.
 */

export default function PortfolioShowcase({
  projects,
  certificates,
}: {
  projects: ProjectItem[];
  certificates: CertificateItem[];
}) {
  const [tab, setTab] = useState<Tab>("projects");
  const [zoom, setZoom] = useState<string | null>(null);
  // Status "See More" dipisah per tab, jadi pindah tab tidak mereset pilihan
  const [expanded, setExpanded] = useState<Record<Tab, boolean>>({
    projects: false,
    certificates: false,
  });
  const rootRef = useRef<HTMLDivElement>(null);

  // Lightbox: tutup dengan Esc, kunci scroll saat terbuka
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoom]);

  // Ref hanya disentuh di event handler ini, bukan saat render
  function toggle(t: Tab) {
    const next = !expanded[t];
    setExpanded((prev) => ({ ...prev, [t]: next }));
    // Saat "See Less", kembali ke awal daftar kalau awalnya sudah tergulir lewat
    if (!next) {
      const el = rootRef.current;
      if (el && el.getBoundingClientRect().top < 0) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "projects", label: "Projects", count: projects.length },
    { key: "certificates", label: "Certificates", count: certificates.length },
  ];

  const visibleProjects = expanded.projects
    ? projects
    : projects.slice(0, LIMIT);
  const visibleCerts = expanded.certificates
    ? certificates
    : certificates.slice(0, LIMIT);

  return (
    <div ref={rootRef}>
      {/* Tab dengan indikator yang bergeser */}
      <div
        role="tablist"
        aria-label="Portfolio"
        className="relative mb-8 inline-grid grid-cols-2 rounded-xl border border-[#8b6dff40] bg-[#1a1240]/50 p-1 backdrop-blur-md"
      >
        <span
          aria-hidden="true"
          className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-lg bg-linear-to-r from-[#5b4dff] to-[#b04dff] shadow-[0_8px_24px_#7c5cff40] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform:
              tab === "projects" ? "translateX(0)" : "translateX(100%)",
          }}
        />
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`relative z-10 cursor-pointer whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-300 sm:px-7 ${
              tab === t.key ? "text-white" : "text-[#cfc8ea] hover:text-white"
            }`}
          >
            {t.label}{" "}
            <span className="text-xs font-normal opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* key={tab}: konten dipasang ulang, jadi animasi muncul diputar tiap pindah tab */}
      <div key={tab}>
        {tab === "projects" &&
          (projects.length === 0 ? (
            <Empty text="Belum ada project." />
          ) : (
            <>
              <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {visibleProjects.map((p, i) => (
                  // flex + flex-1: pembungkus Reveal mengisi sel grid penuh,
                  // jadi tinggi semua kartu dalam satu baris tetap sama
                  <li key={p.id} className="flex [&>*]:min-w-0 [&>*]:flex-1">
                    <Reveal delay={delayFor(i)}>
                      {/* Pembungkus diam: tempat hover dideteksi */}
                      <div className="group relative h-full">
                        {/* Glow: hanya opacity yang dianimasikan */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_20px_60px_#7c5cff40] transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
                        />

                        {/* Kartu: satu-satunya yang bergerak */}
                        <article className="relative grid h-full transform-gpu grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-[#8b6dff40] bg-linear-to-b from-[#2a1f5c]/50 to-[#3b1f5c]/30 backdrop-blur-md will-change-transform transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:border-[#b58aff80]">
                          <Link
                            href={`/project/${p.slug}`}
                            aria-label={p.title}
                            className="block aspect-[16/10] overflow-hidden bg-[#11111b]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.poster_url}
                              alt={p.title}
                              loading="lazy"
                              className="h-full w-full transform-gpu object-cover will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                            />
                          </Link>

                          <div className="flex flex-col gap-2 p-4">
                            <h3 className="m-0 text-lg font-bold text-white">
                              <Link
                                href={`/project/${p.slug}`}
                                className="transition-colors duration-300 hover:text-[#d9c7ff]"
                              >
                                {p.title}
                              </Link>
                            </h3>
                            <p className="m-0 line-clamp-2 text-sm text-[#cfc8ea]">
                              {toPlainText(p.description)}
                            </p>

                            {p.technologies.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {p.technologies.slice(0, 4).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full border border-[#8b6dff50] bg-[#5b4dff20] px-2.5 py-0.5 text-[11px] font-medium text-[#d9c7ff]"
                                  >
                                    {t}
                                  </span>
                                ))}
                                {p.technologies.length > 4 && (
                                  <span className="px-1 text-[11px] text-[#9d93c9]">
                                    +{p.technologies.length - 4}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Tombol: hanya Lihat detail (demo ada di halaman detail) */}
                            <div className="mt-auto flex items-center pt-3">
                              <Link
                                href={`/project/${p.slug}`}
                                className="group/btn inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-[#5b4dff] to-[#b04dff] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_#7c5cff35] transition-[filter,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-110 active:scale-95"
                              >
                                Lihat detail{" "}
                                <span
                                  aria-hidden="true"
                                  className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-x-1"
                                >
                                  →
                                </span>
                              </Link>
                            </div>
                          </div>
                        </article>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>

              {projects.length > LIMIT && (
                <ToggleButton
                  expanded={expanded.projects}
                  hiddenCount={projects.length - LIMIT}
                  onClick={() => toggle("projects")}
                />
              )}
            </>
          ))}

        {tab === "certificates" &&
          (certificates.length === 0 ? (
            <Empty text="Belum ada sertifikat." />
          ) : (
            <>
              <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCerts.map((c, i) => (
                  <li key={c.id} className="flex [&>*]:min-w-0 [&>*]:flex-1">
                    <Reveal delay={delayFor(i)}>
                      <div className="group relative">
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_20px_60px_#7c5cff40] transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
                        />
                        <button
                          type="button"
                          onClick={() => setZoom(c.image_url)}
                          aria-label="Perbesar sertifikat"
                          className="relative block w-full transform-gpu cursor-zoom-in overflow-hidden rounded-2xl border border-[#8b6dff40] bg-[#11111b] will-change-transform transition-[transform,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:border-[#b58aff80]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={c.image_url}
                            alt="Sertifikat"
                            loading="lazy"
                            className="aspect-[4/3] w-full transform-gpu object-cover will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                          />
                        </button>
                      </div>
                    </Reveal>
                  </li>
                ))}
              </ul>

              {certificates.length > LIMIT && (
                <ToggleButton
                  expanded={expanded.certificates}
                  hiddenCount={certificates.length - LIMIT}
                  onClick={() => toggle("certificates")}
                />
              )}
            </>
          ))}
      </div>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sertifikat"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[120] grid animate-rise cursor-zoom-out place-items-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="Tutup"
            className="absolute right-4 top-4 grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-white/20 bg-white/10 text-lg text-white transition-colors hover:bg-white/20"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoom}
            alt="Sertifikat"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full cursor-default rounded-xl object-contain shadow-[0_30px_100px_#000a]"
          />
        </div>
      )}
    </div>
  );
}

// Tombol "See More" / "See Less" di bawah grid
function ToggleButton({
  expanded,
  hiddenCount,
  onClick,
}: {
  expanded: boolean;
  hiddenCount: number;
  onClick: () => void;
}) {
  return (
    <div className="mt-8 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={expanded}
        className="group/more inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#8b6dff50] bg-[#1a1240]/50 px-6 py-2.5 text-sm font-semibold text-[#d9c7ff] backdrop-blur-md transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#b58aff80] hover:bg-[#5b4dff25] active:scale-95"
      >
        {expanded ? "See Less" : `See More (${hiddenCount})`}
        <span
          aria-hidden="true"
          className={`text-xs transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            expanded
              ? "rotate-180 group-hover/more:-translate-y-0.5"
              : "group-hover/more:translate-y-0.5"
          }`}
        >
          ▼
        </span>
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="m-0 rounded-2xl border border-dashed border-[#8b6dff40] px-6 py-12 text-center text-sm text-[#9d93c9]">
      {text}
    </p>
  );
}
