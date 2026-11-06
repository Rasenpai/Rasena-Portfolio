"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MAX = 48;

// Path dari URL bisa ter-encode (%20, dll) dan bisa sangat panjang
function readablePath(raw: string | null) {
  let p = raw || "/";
  try {
    p = decodeURIComponent(p);
  } catch {
    /* pakai apa adanya kalau encoding-nya rusak */
  }
  if (p.length > MAX) p = `${p.slice(0, MAX - 3)}...`;
  return p;
}

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#5b4dff] to-[#b04dff] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_#7c5cff40] transition-all hover:-translate-y-0.5 hover:brightness-110";

const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#8b6dff50] px-6 py-3 text-sm font-semibold text-[#d9c7ff] transition-colors hover:bg-[#b58aff20]";

export default function NotFound() {
  const path = readablePath(usePathname());

  return (
    <div className="grid min-h-screen place-items-center px-4 pb-16 pt-28">
      <div className="w-full max-w-[640px] text-center">
        <p className="m-0 animate-rise text-xs font-bold uppercase tracking-[0.2em] text-accent">
          Error 404
        </p>

        <h1 className="m-0 mt-3 animate-rise bg-linear-to-r from-[#6f72ff] to-[#b07bff] bg-clip-text text-[clamp(72px,18vw,140px)] font-extrabold leading-none tracking-[-0.05em] text-transparent">
          404
        </h1>

        <h2 className="m-0 mt-4 animate-rise text-[clamp(22px,3.5vw,30px)] font-bold tracking-[-0.03em] text-ink">
          Halaman tidak ditemukan
        </h2>
        <p className="mx-auto mb-0 mt-3 max-w-[460px] animate-rise text-[15px] text-muted">
          Alamat yang kamu tuju tidak ada atau sudah dipindahkan. Periksa
          kembali URL-nya, atau kembali ke beranda.
        </p>

        <div
          aria-hidden="true"
          className="mx-auto mt-8 animate-rise overflow-hidden rounded-2xl border border-[#8b6dff30] bg-[#0d0b20]/80 text-left backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-[#ff6e7a]/80" />
            <span className="size-2.5 rounded-full bg-[#ffd166]/80" />
            <span className="size-2.5 rounded-full bg-mint/80" />
            <span className="ml-2 font-mono text-[11px] text-muted">
              rasena@portfolio:~
            </span>
          </div>

          <div className="grid gap-1 px-4 py-4 font-mono text-[13px] leading-relaxed">
            <p className="m-0 break-all text-ink">
              <span className="text-mint">$</span> curl -I {path}
            </p>
            <p className="m-0 text-[#ff9aa3]">HTTP/1.1 404 Not Found</p>

            <p className="m-0 mt-1 break-all text-ink">
              <span className="text-mint">$</span> ls {path}
            </p>
            <p className="m-0 break-all text-[#ff9aa3]">
              ls: cannot access &apos;{path}&apos;: No such file or directory
            </p>

            <p className="m-0 mt-1 text-muted">
              <span className="text-mint">$</span> cd /
              <span className="animate-blink">_</span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={primaryBtn}>
            Kembali ke Beranda
          </Link>
          <Link href="/#portfolio" className={ghostBtn}>
            Lihat Portfolio
          </Link>
          <Link href="/#contact" className={ghostBtn}>
            Hubungi Saya
          </Link>
        </div>
      </div>
    </div>
  );
}
