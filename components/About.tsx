"use client";

import { useState } from "react";
import { Container, Section, Kicker } from "./ui";
import Reveal from "./Reveal";
import { aboutChecklist, profile, quote, cv } from "../data/content";

type Lang = "en" | "id";

export default function About() {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <Section id="about">
      <Container className="grid items-start gap-6 md:grid-cols-[.8fr_1.2fr] md:gap-12">
        <Reveal variant="left">
          <figure className="relative m-0 aspect-[4/5] overflow-hidden rounded-[18px] border border-[#8b6dff50] bg-[#11111b] shadow-[0_20px_60px_-20px_#7c5cff80]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.photo}
              alt={profile.photoAlt}
              loading="lazy"
              className="h-full w-full origin-[50%_55%] scale-[1.35] object-cover saturate-[0.9] contrast-105 transition-transform duration-700 hover:scale-[1.42]"
            />

            {/* Warna ungu di atas foto supaya menyatu dengan tema */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#5b4dff]/40 via-transparent to-[#b04dff]/40 mix-blend-soft-light"
            />
            {/* Gelap di tepi supaya latar tidak mencolok */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_50%_45%,transparent_35%,#0b0b12cc_100%)]"
            />

            {[
              { label: "Linux", cls: "left-4 top-5" },
              { label: "MikroTik", cls: "right-4 top-16" },
              { label: "Network", cls: "left-5 top-[48%]" },
            ].map((c) => (
              <span
                key={c.label}
                aria-hidden="true"
                className={`pointer-events-none absolute ${c.cls} rounded-full border border-[#8b6dff50] bg-[#0d0b20]/70 px-3 py-1 font-mono text-[11px] text-[#d9c7ff] backdrop-blur-md`}
              >
                {c.label}
              </span>
            ))}

            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-[#0b0b12] to-transparent px-5 pb-5 pt-16">
              <div className="text-lg font-bold">{profile.name}</div>
              <div className="text-xs text-muted">{profile.role}</div>
            </figcaption>
          </figure>
        </Reveal>

        <div className="text-muted">
          <Reveal>
            <Kicker>01 / Tentang saya</Kicker>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mb-8 mt-2.5 max-w-[650px] text-[clamp(29px,4vw,42px)] font-bold leading-[1.15] tracking-[-0.04em] text-ink">
              Membangun infrastruktur yang andal, aman, dan efisien.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mb-4">
              Halo, saya Rasena, lulusan SMK Teknik Komputer dan Jaringan yang
              saat ini sedang menempuh pendidikan tinggi pada program studi
              Teknik Informatika. Saya memiliki ketertarikan pada administrasi
              sistem Linux, manajemen jaringan, dan infrastruktur server. Fokus
              saya mencakup pengelolaan layanan server, konfigurasi lingkungan
              laboratorium, teknologi container, serta troubleshooting jaringan
              dan layanan sistem. Saya terus mengembangkan kompetensi teknis
              melalui praktik langsung dan eksplorasi teknologi untuk membangun
              infrastruktur yang andal, aman, dan efisien.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="mb-4">
              Target saya adalah berkembang menjadi profesional infrastruktur
              yang mampu menjaga layanan tetap stabil, aman, dan mudah
              dipelihara. Saya terbuka untuk kesempatan junior, magang, atau
              kolaborasi yang memberi ruang untuk belajar dan berkontribusi.
            </p>
          </Reveal>
          <ul className="mt-5 grid list-none gap-3 p-0">
            {aboutChecklist.map((item, idx) => (
              <Reveal
                key={item}
                as="li"
                delay={400 + idx * 130}
                className="flex items-start gap-[11px] text-sm text-[#d9d5e6]"
              >
                <span className="font-black text-mint">✓</span>
                <span>{item}</span>
              </Reveal>
            ))}
          </ul>

          {/* Quote: backdrop blur + gradient */}
          <Reveal delay={400 + aboutChecklist.length * 130}>
            <blockquote className="relative m-0 mt-7 overflow-hidden rounded-xl border border-[#5b4dff40] bg-linear-to-r from-[#1a1033]/70 via-[#14102a]/60 to-[#7c5cff]/20 px-5 py-4 shadow-[0_10px_40px_#0006] backdrop-blur-md">
              {/* glow di sisi kanan */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 top-1/2 h-24 w-44 -translate-y-1/2 rounded-full bg-[#b04dff]/25 blur-2xl"
              />

              <div className="relative flex items-start gap-3.5">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="currentColor"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[#5b4dff]/70"
                >
                  <path d="M3 21c3 0 7-1 7-8V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4c0 3.5-1 4-5 4zm12 0c3 0 7-1 7-8V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4c0 3.5-1 4-5 4z" />
                </svg>

                <div className="min-w-0">
                  <p
                    key={lang}
                    lang={lang}
                    className="m-0 animate-rise text-[14px] italic leading-relaxed text-[#e6e0f5] sm:text-[15px]"
                  >
                    &ldquo;{quote[lang]}&rdquo;
                  </p>

                  <div
                    role="group"
                    aria-label="Terjemahan quote"
                    className="mt-3 inline-flex overflow-hidden rounded-lg border border-[#5b4dff50] text-[11px] font-bold uppercase tracking-[0.08em]"
                  >
                    {(["en", "id"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLang(l)}
                        aria-pressed={lang === l}
                        className={`cursor-pointer px-3.5 py-1.5 transition-colors ${
                          lang === l
                            ? "bg-linear-to-r from-[#5b4dff] to-[#b04dff] text-white"
                            : "bg-transparent text-[#d9c7ff] hover:bg-[#b58aff20]"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </blockquote>
          </Reveal>

          {/* Download CV */}
          <Reveal delay={400 + (aboutChecklist.length + 1) * 130}>
            <a
              href={cv.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 rounded-xl bg-linear-to-r from-[#5b4dff] to-[#b04dff] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_#7c5cff40] transition-all hover:-translate-y-0.5 hover:brightness-110"
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
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
              Download CV
            </a>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
