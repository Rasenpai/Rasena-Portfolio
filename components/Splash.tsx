"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { splash } from "../data/content";

const TYPE_START = 900; // ms sebelum teks mulai diketik
const TYPE_SPEED = 45; // ms per huruf
const LEAVE_AT = 3000; // ms sebelum splash mulai menghilang
const REMOVE_AT = 3700; // ms sebelum splash dilepas dari DOM

const WAVE_BARS = 9; // jumlah bar
const WAVE_STEP = 110; // ms selisih fase antar bar (makin kecil = gelombang makin rapat)

function IconBubble({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}) {
  return (
    <span
      className="grid h-14 w-14 animate-pop place-items-center rounded-full border border-white/10 bg-[#1a1033] text-white shadow-[0_0_32px_#7c5cff55]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

// Equalizer gelombang: tiap bar punya fase beda, jadi tinggi naik-turun merambat ke samping
function Equalizer() {
  return (
    <div
      className="mt-6 flex h-10 animate-rise items-end gap-1.5"
      style={{ animationDelay: "1000ms" }}
    >
      {Array.from({ length: WAVE_BARS }).map((_, i) => (
        <span
          key={i}
          className="h-full w-1.5 origin-bottom animate-wave rounded-full bg-linear-to-t from-[#5b4dff] to-[#b04dff] shadow-[0_0_12px_#7c5cff66]"
          style={{ animationDelay: `${-i * WAVE_STEP}ms` } as CSSProperties}
        />
      ))}
    </div>
  );
}

export default function Splash() {
  const [typed, setTyped] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;

    // Tidak ditandai "on" (mis. reduced-motion): splash disembunyikan lewat CSS, tidak perlu apa-apa
    if (root.dataset.splash !== "on") return;

    root.style.overflow = "hidden";

    let i = 0;
    let typer: ReturnType<typeof setInterval> | undefined;

    const startTyping = setTimeout(() => {
      typer = setInterval(() => {
        i += 1;
        setTyped(splash.typed.slice(0, i));
        if (i >= splash.typed.length) clearInterval(typer);
      }, TYPE_SPEED);
    }, TYPE_START);

    const startLeaving = setTimeout(() => setLeaving(true), LEAVE_AT);

    const finish = setTimeout(() => {
      delete root.dataset.splash;
      root.style.overflow = "";
      window.dispatchEvent(new Event("splash:done"));
      setGone(true);
    }, REMOVE_AT);

    return () => {
      clearTimeout(startTyping);
      clearTimeout(startLeaving);
      clearTimeout(finish);
      if (typer) clearInterval(typer);
      root.style.overflow = "";
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`splash ${leaving ? "is-leaving" : ""}`} aria-hidden="true">
      <div className="flex flex-col items-center px-5 text-center">
        <div className="flex gap-5">
          <IconBubble delay={0}>
            <path d="m18 16 4-4-4-4" />
            <path d="m6 8-4 4 4 4" />
            <path d="m14.5 4-5 16" />
          </IconBubble>
          <IconBubble delay={120}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </IconBubble>
          <IconBubble delay={240}>
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </IconBubble>
        </div>

        <h1
          className="mt-10 animate-rise text-[clamp(34px,7vw,60px)] font-bold leading-[1.15] tracking-[-0.03em]"
          style={{ animationDelay: "450ms" }}
        >
          <span className="bg-linear-to-b from-white to-[#d9d1ff] bg-clip-text text-transparent">
            {splash.line1}
          </span>
          <br />
          <span className="bg-linear-to-r from-[#5b4dff] to-[#b04dff] bg-clip-text text-transparent">
            {splash.line2}
          </span>
        </h1>

        <div
          className="mt-9 flex min-h-[44px] animate-rise items-center gap-2.5 rounded-full px-5 py-2 text-base text-[#8b6dff] shadow-[0_0_40px_#7c5cff30] sm:text-lg"
          style={{ animationDelay: "750ms" }}
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
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
          <span>
            {typed}
            <span className="ml-0.5 inline-block h-[1.1em] w-[2px] animate-blink bg-[#b04dff] align-middle" />
          </span>
        </div>

        <Equalizer />
      </div>
    </div>
  );
}
