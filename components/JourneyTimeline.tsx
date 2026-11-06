"use client";

import Image from "next/image";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Container } from "./ui";

/* =====================================================================
   DATA: edit isi timeline di sini.
   - Tambah entri baru di array STEPS (urutkan dari yang paling lama).
   - Gambar diletakkan di public/images/. Kalau `image` dikosongkan,
     akan tampil panel pengganti berisi ikon.
   - `current: true` memberi efek titik berdenyut pada langkah yang
     sedang dijalani.
   ===================================================================== */
type IconKind =
  | "cap"
  | "briefcase"
  | "server"
  | "graduation-cap"
  | "network"
  | "terminal";

type Step = {
  no: string;
  years: string;
  label: string;
  icon: IconKind;
  title: string;
  /** Boleh teks biasa atau JSX (untuk link/highlight di dalam kalimat). */
  desc: ReactNode;
  skills: string[];
  /** Gambar di public/images/. Kosongkan kalau belum ada, nanti tampil panel pengganti. */
  image?: string;
  imageAlt?: string;
  current?: boolean;
};

const MAPS_SMK = "https://maps.app.goo.gl/XprC2iyeLuLpz9dw6";
const MAPS_KAMPUS = "https://maps.app.goo.gl/wRQpewAxWC1v1XE57";

/** Nama tempat yang di-highlight dan jadi link ke Google Maps. */
function PlaceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="box-decoration-clone rounded-md bg-accent2/15 px-1.5 py-0.5 font-semibold text-accent ring-1 ring-accent2/30 transition-colors duration-200 hover:bg-accent2/30 hover:text-ink"
    >
      {children}
      <span aria-hidden="true" className="ml-0.5 text-[0.85em]">
        ↗
      </span>
      <span className="sr-only"> (buka di Google Maps, tab baru)</span>
    </a>
  );
}

const STEPS: Step[] = [
  {
    no: "01",
    years: "2023 – 2026",
    label: "The Foundation",
    icon: "cap",
    title: "Masa Sekolah & Jurusan TKJ",
    desc: (
      <>
        Mulai mengenal dunia IT di jurusan TKJ{" "}
        <PlaceLink href={MAPS_SMK}>SMKS Sandikta Kota Bekasi</PlaceLink>.
        Belajar dasar jaringan komputer, hardware, troubleshooting, serta
        administrasi sistem. Dari sinilah saya mulai tertarik dengan
        infrastruktur dan server.
      </>
    ),
    skills: ["Networking", "TCP/IP", "Hardware", "Troubleshooting"],
    image: "/images/journey-1.jpg",
    imageAlt: "Switch jaringan dengan kabel LAN",
  },
  {
    no: "02",
    years: "2026 – Now",
    label: "The Learning",
    icon: "graduation-cap",
    title: "Teknik Informatika",
    desc: (
      <>
        Memulai perjalanan kuliah di bidang Teknik Informatika di{" "}
        <PlaceLink href={MAPS_KAMPUS}>Universitas Dian Nusantara</PlaceLink>{" "}
        sambil mempelajari dasar pemrograman menggunakan Python. Berfokus pada
        logika pemrograman, algoritma, basis data, dan pemecahan masalah sebagai
        fondasi untuk mendalami networking dan system administration.
      </>
    ),
    skills: ["Python", "Algorithms", "Database", "Problem Solving"],
    image: "/images/journey-2.jpg",
    imageAlt: "Belajar pemrograman Python dan ilmu komputer",
  },
  {
    no: "03",
    years: "2026 – Now",
    label: "The Network Path",
    icon: "network",
    title: "Memperdalam Skill Networking",
    desc: "Setelah lulus dari SMK angkatan 2026, saya terus memperdalam networking: subnetting, routing, switching, dan VLAN, hingga konfigurasi Linux server dan otomasi jaringan. Target berikutnya adalah sertifikasi dan karier sebagai Network Engineer dan Sysadmin.",
    skills: ["Routing & Switching", "VLAN", "Linux Server", "Automation"],
    image: "/images/Journey-3.jpg",
    imageAlt: "Perangkat jaringan dan rak server",
    current: true,
  },
  {
    no: "04",
    years: "2026 – Now",
    label: "The Linux Path",
    icon: "terminal",
    title: "Memperdalam Skill Linux",
    desc: "Mendalami Linux secara lebih serius untuk memahami administrasi sistem dan pengelolaan server. Berlatih menggunakan command line, mengatur user dan permission, mengonfigurasi SSH, mengelola service, serta men-deploy aplikasi di Linux. Target berikutnya adalah menguasai Linux server sebagai fondasi karier Sysadmin.",
    skills: ["Linux CLI", "Bash", "SSH", "System Administration"],
    image: "/images/Journey-4.jpg",
    imageAlt: "Terminal Linux pada lingkungan server",
    current: true,
  },
  {
    no: "05",
    years: "One Day",
    label: "The Aspiration",
    icon: "server",
    title: "Dari Belajar Menuju Dampak Nyata",
    desc: "Menuju karier sebagai Network Engineer dan Sysadmin dengan terus mengembangkan kemampuan networking, administrasi Linux server, keamanan sistem, dan otomasi. Pengalaman dibangun lewat homelab, proyek nyata, dan sertifikasi, demi mewujudkan infrastruktur yang stabil, aman, dan andal.",
    skills: ["Networking", "Linux Server", "Security", "Automation"],
    image: "/images/Journey-5.jpg",
    imageAlt: "Ruang server modern dengan infrastruktur jaringan profesional",
  },
];

/* ===================================================================== */

/* ---------- prefers-reduced-motion (sama seperti di Skills) ---------- */
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServer = () => false;

/** Satu ruas garis antar dua titik timeline (koordinat relatif terhadap <ol>). */
type Seg = { x: number; y1: number; y2: number };

function StepIcon({ kind }: { kind: IconKind }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (kind === "cap" || kind === "graduation-cap")
    return (
      <svg {...common}>
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </svg>
    );

  if (kind === "briefcase")
    return (
      <svg {...common}>
        <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        <rect width="20" height="14" x="2" y="6" rx="2" />
      </svg>
    );

  if (kind === "network")
    return (
      <svg {...common}>
        <rect x="16" y="16" width="6" height="6" rx="1" />
        <rect x="2" y="16" width="6" height="6" rx="1" />
        <rect x="9" y="2" width="6" height="6" rx="1" />
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
        <path d="M12 12V8" />
      </svg>
    );

  if (kind === "terminal")
    return (
      <svg {...common}>
        <path d="M4 17l6-6-6-6" />
        <path d="M12 19h8" />
      </svg>
    );

  // "server"
  return (
    <svg {...common}>
      <rect width="20" height="8" x="2" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 6h.01M6 18h.01" />
    </svg>
  );
}

function StepImage({ step }: { step: Step }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      {step.image ? (
        <>
          <Image
            src={step.image}
            alt={step.imageAlt ?? ""}
            fill
            sizes="(min-width: 1024px) 320px, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-accent2/15 mix-blend-color"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-bg/60 via-transparent to-transparent"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="grid h-full w-full place-items-center bg-linear-to-br from-accent2/25 via-accent2/5 to-transparent text-accent/70"
        >
          <span className="scale-[2.2]">
            <StepIcon kind={step.icon} />
          </span>
        </div>
      )}
    </div>
  );
}

export default function JourneyTimeline() {
  const olRef = useRef<HTMLOListElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [segs, setSegs] = useState<Seg[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reduced = useSyncExternalStore(
    subscribeReduced,
    getReduced,
    getReducedServer,
  );

  /* Garis dihitung dari posisi nyata tiap titik, jadi tetap nyambung walau
     tinggi kartu berubah (teks membungkus di layar kecil, font baru dimuat). */
  const measure = useCallback(() => {
    const ol = olRef.current;
    if (!ol) return;
    const or = ol.getBoundingClientRect();

    const pts = dotRefs.current.map((el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.left - or.left + r.width / 2,
        y: r.top - or.top + r.height / 2,
      };
    });

    const next: Seg[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (!a || !b) continue;
      next.push({ x: a.x, y1: a.y, y2: b.y });
    }
    setSegs(next);
    setSize({ w: or.width, h: or.height });
  }, []);

  /* Effect hanya berlangganan ke sumber eksternal (ukuran elemen, resize, font).
     ResizeObserver memanggil measure sekali saat observe() dimulai. */
  useLayoutEffect(() => {
    const ol = olRef.current;
    const ro = new ResizeObserver(measure);
    if (ol) ro.observe(ol);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <section
      aria-label="Timeline perjalanan"
      className="relative isolate overflow-x-clip pb-20 pt-2 sm:pb-24"
    >
      {/* Glow di belakang kartu, supaya efek backdrop-blur (kaca) terlihat */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <span className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-accent2/25 blur-[100px]" />
        <span className="absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-accent/15 blur-[110px]" />
        <span className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-accent2/20 blur-[100px]" />
      </div>

      <Container>
        <ol ref={olRef} className="relative space-y-6">
          {/* Garis animasi antar titik (layer sendiri, di belakang titik & kartu) */}
          <svg
            aria-hidden="true"
            width={size.w}
            height={size.h}
            className="pointer-events-none absolute left-0 top-0 transform-gpu overflow-visible"
          >
            {segs.map((l, i) => {
              const d = `M${l.x} ${l.y1} L${l.x} ${l.y2}`;
              return (
                <g key={i}>
                  {/* garis dasar */}
                  <path
                    d={d}
                    fill="none"
                    stroke="#8b6dff"
                    strokeWidth={2}
                    strokeOpacity={0.4}
                    strokeLinecap="round"
                  />
                  {/* garis putus-putus yang mengalir ke bawah */}
                  <path
                    d={d}
                    fill="none"
                    stroke="#c9a8ff"
                    strokeWidth={1.5}
                    strokeDasharray="6 8"
                    strokeLinecap="round"
                    strokeOpacity={0.75}
                  >
                    {!reduced && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="14"
                        to="0"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                  {/* titik yang bergerak di sepanjang garis */}
                  {!reduced && (
                    <circle
                      r="3.5"
                      fill="#efe8ff"
                      style={{ filter: "drop-shadow(0 0 4px #b58aff)" }}
                    >
                      <animateMotion
                        path={d}
                        dur="2.6s"
                        begin={`${i * 0.9}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {STEPS.map((s, i) => (
            <li key={s.no} className="relative pl-9 sm:pl-12">
              {/* Titik di rail (juga jadi titik ukur garis) */}
              <span
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                aria-hidden="true"
                className="absolute left-0 top-[42px] grid h-[15px] w-[15px] place-items-center"
              >
                {s.current && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-accent/50" />
                )}
                <span className="relative h-[15px] w-[15px] rounded-full bg-accent shadow-[0_0_0_4px_rgba(181,138,255,0.18),0_0_18px_rgba(181,138,255,0.8)]" />
              </span>

              <article className="grid gap-6 rounded-2xl border border-white/[0.1] bg-white/[0.04] p-5 shadow-[0_24px_60px_-34px_rgba(0,0,0,0.9)] backdrop-blur-xl backdrop-saturate-150 transition-colors duration-300 hover:border-accent/30 sm:p-6 lg:grid-cols-[150px_1fr_minmax(0,320px)] lg:items-center lg:gap-8">
                {/* Meta */}
                <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-2">
                  <span className="inline-flex h-8 min-w-10 items-center justify-center rounded-lg bg-accent2/20 px-2 text-sm font-bold text-accent ring-1 ring-accent2/40">
                    {s.no}
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-tight text-ink">
                      {s.years}
                    </p>
                    <p className="text-sm text-ink/60">{s.label}</p>
                  </div>
                  <span className="ml-auto text-accent lg:ml-0 lg:mt-1">
                    <StepIcon kind={s.icon} />
                  </span>
                </div>

                {/* Isi */}
                <div>
                  <h2 className="text-xl font-bold leading-snug text-ink">
                    {s.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-ink/70">
                    {s.desc}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-ink/50">Skills:</span>
                    {s.skills.map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-line bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-ink/80"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gambar */}
                <StepImage step={s} />
              </article>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
