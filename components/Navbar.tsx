"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Container } from "./ui";
import { navLinks } from "../data/content";

// Section dianggap "aktif" kalau bagian atasnya sudah melewati garis ini (px dari atas layar).
// Sedikit lebih besar dari scroll-padding-top (86px) supaya langsung aktif setelah klik menu.
const SPY_OFFSET = 120;
// Selama smooth scroll karena klik menu, scroll-spy dijeda agar underline tidak "loncat-loncat".
const SCROLL_LOCK_MS = 1000;

function hashOf(href: string) {
  const i = href.indexOf("#");
  return i === -1 ? "" : href.slice(i + 1);
}

/* Fallback statis: dirender saat prerender, sebelum pathname tersedia.
   Tinggi sama dengan header asli supaya tidak ada layout shift. */
function NavbarFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-transparent bg-transparent">
      <Container className="flex h-16 items-center justify-between gap-5 sm:h-[72px]">
        <Link
          href="/"
          aria-label="Rasena beranda"
          className="font-extrabold tracking-[0.08em]"
        >
          Rasena
        </Link>
      </Container>
    </header>
  );
}

function NavbarInner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Indikator underline
  const [ind, setInd] = useState({ x: 0, w: 0 });
  const [indVisible, setIndVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const lockRef = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------------- Tentukan menu aktif ---------------- */
  const computeActive = useCallback((): string | null => {
    // Halaman lain (mis. /journey): aktif kalau href-nya cocok dengan path
    if (pathname !== "/") {
      const hit = navLinks.find(
        (l) =>
          !l.href.includes("#") &&
          l.href !== "/" &&
          (pathname === l.href || pathname.startsWith(l.href + "/")),
      );
      return hit?.href ?? null;
    }

    // Halaman utama: scroll-spy berdasarkan section yang ada di DOM
    const sections = navLinks
      .filter((l) => l.href.startsWith("/#"))
      .map((l) => ({
        key: l.href,
        el: document.getElementById(hashOf(l.href)),
      }))
      .filter((s): s is { key: string; el: HTMLElement } => s.el !== null);

    let current = "/"; // Home
    let best = -Infinity;
    for (const s of sections) {
      const top = s.el.getBoundingClientRect().top;
      if (top <= SPY_OFFSET && top > best) {
        best = top;
        current = s.key;
      }
    }

    // Mentok di bawah halaman: section paling bawah dianggap aktif
    // (section terakhir yang pendek tidak akan pernah menyentuh garis atas)
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;
    if (atBottom && window.scrollY > 0 && sections.length) {
      let lowest = sections[0];
      let lowestTop = lowest.el.getBoundingClientRect().top;
      for (const s of sections) {
        const top = s.el.getBoundingClientRect().top;
        if (top > lowestTop) {
          lowest = s;
          lowestTop = top;
        }
      }
      current = lowest.key;
    }
    return current;
  }, [pathname]);

  const runSpy = useCallback(() => {
    setScrolled(window.scrollY > 8);
    if (lockRef.current) return;
    setActiveKey((prev) => {
      const next = computeActive();
      return prev === next ? prev : next;
    });
  }, [computeActive]);

  // Scroll + resize (dibatasi 1x per frame)
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        runSpy();
      });
    };
    // Panggilan awal lewat rAF (bukan sinkron) supaya tidak setState langsung di body effect
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [runSpy]);

  const unlock = useCallback(() => {
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = null;
    lockRef.current = false;
    runSpy();
  }, [runSpy]);

  useEffect(() => {
    window.addEventListener("scrollend", unlock);
    return () => {
      window.removeEventListener("scrollend", unlock);
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [unlock]);

  /* ---------------- Posisi underline ---------------- */
  const measure = useCallback(() => {
    const el = activeKey ? itemRefs.current[activeKey] : null;
    if (!el || el.offsetWidth === 0) {
      setIndVisible(false);
      return;
    }
    setInd({ x: el.offsetLeft, w: el.offsetWidth });
    setIndVisible(true);
  }, [activeKey]);

  useEffect(() => {
    // Ukur lewat rAF (bukan sinkron) supaya tidak setState langsung di body effect
    const id = requestAnimationFrame(measure);
    const nav = navRef.current;
    if (!nav) return () => cancelAnimationFrame(id);
    const ro = new ResizeObserver(measure); // font selesai load / ganti breakpoint
    ro.observe(nav);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [measure]);

  // Posisi pertama muncul tanpa animasi; setelah itu baru meluncur halus
  useEffect(() => {
    if (!indVisible || animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [indVisible, animate]);

  /* ---------------- Klik menu ---------------- */
  function onNavClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    setOpen(false);

    const isAnchor = href === "/" || href.startsWith("/#");
    // Dari halaman lain, atau menuju halaman lain: biarkan Next.js yang navigasi
    if (pathname !== "/" || !isAnchor) return;

    e.preventDefault();
    const hash = hashOf(href);
    const target = hash ? document.getElementById(hash) : null;
    if (hash && !target) return;

    // Jeda scroll-spy selama animasi scroll
    lockRef.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(unlock, SCROLL_LOCK_MS);
    setActiveKey(href);

    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", hash ? `/#${hash}` : "/");
  }

  // Esc menutup menu mobile
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ${
        solid
          ? "border-white/[0.06] bg-bg/70 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          : "border-transparent bg-transparent shadow-none backdrop-blur-0"
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-5 sm:h-[72px]">
        <Link
          href="/"
          aria-label="Rasena beranda"
          onClick={(e) => onNavClick(e, "/")}
          className="font-extrabold tracking-[0.08em]"
        >
          Rasena
        </Link>

        <button
          type="button"
          aria-label="Buka navigasi"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-[10px] border border-line bg-transparent px-[11px] py-2 text-ink sm:hidden"
        >
          {open ? "✕" : "☰"}
        </button>

        {/* Mobile: dropdown absolute di bawah header.
            Desktop (sm+): relative + reset top/left/right, kalau tidak "top-full" menggeser nav ke bawah. */}
        <nav
          ref={navRef}
          aria-label="Navigasi utama"
          className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-1 border-b border-white/[0.06] bg-bg/95 px-5 py-3 backdrop-blur-xl sm:relative sm:left-auto sm:right-auto sm:top-auto sm:flex sm:flex-row sm:gap-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none`}
        >
          {navLinks.map((link) => {
            const active = activeKey === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  itemRefs.current[link.href] = el;
                }}
                onClick={(e) => onNavClick(e, link.href)}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex py-2 text-[15px] font-semibold transition-colors duration-300 ${
                  active ? "text-accent" : "text-ink/75 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Underline aktif: satu elemen yang meluncur ke menu aktif (desktop) */}
          <span
            aria-hidden="true"
            style={{ transform: `translateX(${ind.x}px)`, width: ind.w }}
            className={`pointer-events-none absolute bottom-0 left-0 hidden h-[2px] rounded-full bg-linear-to-r from-accent2 to-accent sm:block ${
              indVisible ? "opacity-100" : "opacity-0"
            } ${
              animate
                ? "transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                : ""
            }`}
          />
        </nav>
      </Container>
    </header>
  );
}

export default function Navbar() {
  return (
    <Suspense fallback={<NavbarFallback />}>
      <NavbarInner />
    </Suspense>
  );
}
