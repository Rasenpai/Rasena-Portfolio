"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Container, Section, Kicker } from "./ui";
import Reveal from "./Reveal";
import { SiCisco, SiLinux, SiMikrotik, SiPython } from "react-icons/si";

/* ---------- Data ----------
 * Ikon dari react-icons (set Simple Icons). Untuk menambah skill, cari ikonnya
 * di https://react-icons.github.io/react-icons/icons/si/ lalu impor di atas.
 * Ukuran ikon otomatis mengikuti kotak (36x36), warna mengikuti text color.
 * Urutan: separuh pertama tampil di kiri, sisanya di kanan.
 */
type Skill = { name: string; icon: ReactNode };

const skills: Skill[] = [
  { name: "MikroTik", icon: <SiMikrotik aria-hidden="true" /> },
  { name: "Cisco", icon: <SiCisco aria-hidden="true" /> },
  { name: "Linux", icon: <SiLinux aria-hidden="true" /> },
  { name: "Python", icon: <SiPython aria-hidden="true" /> },
];

const HALF = Math.ceil(skills.length / 2); // index < HALF -> kiri
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

type Line = { d: string; x1: number; y1: number; x2: number; y2: number };

/* ---------- prefers-reduced-motion ----------
 * Dibaca lewat useSyncExternalStore (cara resmi React untuk membaca sumber
 * eksternal seperti matchMedia), jadi tidak perlu setState di dalam effect. */
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServer = () => false;

/* ---------- Komponen ---------- */
export default function Skills() {
  return (
    <Section id="skills">
      <Container>
        <Reveal className="mb-3">
          <Kicker>03 / Skills</Kicker>
        </Reveal>
        <Reveal delay={200}>
          <Diagram />
        </Reveal>
      </Container>
    </Section>
  );
}

function Diagram() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const reduced = useSyncExternalStore(
    subscribeReduced,
    getReduced,
    getReducedServer,
  );

  /* Hitung garis dari posisi nyata tiap node, jadi tetap nyambung
     di ukuran layar apa pun. Desktop: kiri -> tengah -> kanan.
     Mobile: atas -> tengah -> bawah. */
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const center = centerRef.current;
    if (!wrap || !center) return;

    const wr = wrap.getBoundingClientRect();
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return {
        l: r.left - wr.left,
        r: r.right - wr.left,
        t: r.top - wr.top,
        b: r.bottom - wr.top,
      };
    };
    const C = box(center);
    const horizontal = window.matchMedia("(min-width: 768px)").matches;

    const next: Line[] = [];
    skills.forEach((_, i) => {
      const el = nodeRefs.current[i];
      if (!el) return;
      const N = box(el);
      const isLeft = i < HALF;
      const groupSize = isLeft ? HALF : skills.length - HALF;
      const k = isLeft ? i : i - HALF;
      // Titik sambung di kotak tengah dibagi rata, seperti port di n8n
      const f = (k + 1) / (groupSize + 1);

      let x1: number, y1: number, x2: number, y2: number;
      if (horizontal) {
        const y = C.t + (C.b - C.t) * f;
        const ny = (N.t + N.b) / 2;
        if (isLeft) [x1, y1, x2, y2] = [N.r, ny, C.l, y];
        else [x1, y1, x2, y2] = [C.r, y, N.l, ny];
      } else {
        const x = C.l + (C.r - C.l) * f;
        const nx = (N.l + N.r) / 2;
        if (isLeft) [x1, y1, x2, y2] = [nx, N.b, x, C.t];
        else [x1, y1, x2, y2] = [x, C.b, nx, N.t];
      }

      const d = horizontal
        ? `M${x1} ${y1} C${x1 + (x2 - x1) / 2} ${y1}, ${x2 - (x2 - x1) / 2} ${y2}, ${x2} ${y2}`
        : `M${x1} ${y1} C${x1} ${y1 + (y2 - y1) / 2}, ${x2} ${y2 - (y2 - y1) / 2}, ${x2} ${y2}`;
      next.push({ d, x1, y1, x2, y2 });
    });

    setLines(next);
    setSize({ w: wr.width, h: wr.height });
  }, []);

  /* Effect ini hanya berlangganan ke sumber eksternal (ukuran elemen, resize,
     font). ResizeObserver otomatis memanggil measure sekali saat observe()
     dimulai, jadi tidak ada setState langsung di badan effect. */
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const ro = new ResizeObserver(measure);
    if (wrap) ro.observe(wrap);
    window.addEventListener("resize", measure);
    // ukuran teks (font) bisa berubah setelah font selesai dimuat
    document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  /* Hover dibuat murni CSS (group-hover), tanpa state React, supaya tidak ada
     re-render yang bersaing dengan animasi saat kursor masuk.
     - backdrop-blur dihapus dari ikon: blur + transform membuat browser
       menghitung ulang blur di setiap frame, ini penyebab utama patah-patah.
     - Hanya `transform` dan `opacity` yang dianimasikan (dikerjakan GPU).
     - Glow ada di dalam ikon, jadi ikut membesar dan naik bersamanya. */
  const renderNode = (s: Skill, i: number) => (
    <div key={s.name} className="group flex flex-col items-center gap-3">
      {/* Pembungkus diam: titik ukur garis + area hover yang stabil */}
      <div
        ref={(el) => {
          nodeRefs.current[i] = el;
        }}
        className="relative h-20 w-20"
      >
        <div
          className={`relative grid h-full w-full transform-gpu place-items-center rounded-2xl border border-[#8b6dff40] bg-[#14123a] text-[#d9c7ff] will-change-transform transition-[transform,border-color,color] duration-[450ms] ${EASE} group-hover:-translate-y-1.5 group-hover:scale-110 group-hover:border-[#b58aff90] group-hover:text-white`}
        >
          {/* Glow: hanya opacity yang dianimasikan */}
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_14px_44px_#7c5cff60] transition-opacity duration-[450ms] ${EASE} group-hover:opacity-100`}
          />
          <span className="relative block h-9 w-9 [&>img]:h-full [&>img]:w-full [&>img]:object-contain [&>svg]:h-full [&>svg]:w-full">
            {s.icon}
          </span>
        </div>
      </div>
      <span className="text-sm font-semibold text-white">{s.name}</span>
    </div>
  );

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto grid max-w-4xl items-center gap-12 md:grid-cols-[1fr_auto_1fr] md:gap-20"
    >
      {/* Garis: di belakang node. Layer sendiri (transform-gpu) supaya animasi
          garis yang berjalan terus tidak ikut menggambar ulang ikon. */}
      <svg
        aria-hidden="true"
        width={size.w}
        height={size.h}
        className="pointer-events-none absolute left-0 top-0 transform-gpu overflow-visible"
      >
        {lines.map((l, i) => (
          <g key={i}>
            {/* garis dasar */}
            <path
              d={l.d}
              fill="none"
              stroke="#8b6dff"
              strokeWidth={2}
              strokeOpacity={0.4}
              strokeLinecap="round"
            />
            {/* garis putus-putus yang mengalir */}
            <path
              d={l.d}
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
              <circle r="3.5" fill="#efe8ff">
                <animateMotion
                  path={l.d}
                  dur="3s"
                  begin={`${i * 0.45}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )}
            {/* port di kedua ujung */}
            {[
              [l.x1, l.y1],
              [l.x2, l.y2],
            ].map(([x, y], pi) => (
              <circle
                key={pi}
                cx={x}
                cy={y}
                r="4"
                fill="#0f0c24"
                stroke="#b58aff"
                strokeWidth="1.5"
              />
            ))}
          </g>
        ))}
      </svg>

      {/* Kiri (mobile: atas) */}
      <div className="relative z-10 flex flex-row justify-center gap-8 md:flex-col md:items-center md:gap-10">
        {skills.slice(0, HALF).map((s, i) => renderNode(s, i))}
      </div>

      {/* Tengah */}
      <div
        ref={centerRef}
        className="relative z-10 mx-auto grid min-w-[180px] place-items-center rounded-2xl border border-[#b58aff80] bg-linear-to-b from-[#2a1f5c] to-[#3b1f5c] px-12 py-10 shadow-[0_0_70px_#7c5cff45]"
      >
        <span className="bg-linear-to-r from-[#e9e2ff] to-[#b9a8ff] bg-clip-text text-3xl font-bold tracking-[-0.03em] text-transparent">
          Skills
        </span>
      </div>

      {/* Kanan (mobile: bawah) */}
      <div className="relative z-10 flex flex-row justify-center gap-8 md:flex-col md:items-center md:gap-10">
        {skills.slice(HALF).map((s, i) => renderNode(s, i + HALF))}
      </div>
    </div>
  );
}
