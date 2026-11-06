"use client";

import { useEffect, useRef } from "react";

const HIDE_AFTER = 1200; // ms tanpa scroll sebelum indikator memudar
const MIN_THUMB = 36; // tinggi minimum thumb (px)

// Indikator scroll untuk layar sentuh (scrollbar bawaan mobile tidak bisa di-style)
export default function ScrollIndicator() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    // Hanya perangkat sentuh; desktop sudah pakai scrollbar custom CSS
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;

    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const vh = window.innerHeight;
      const total = doc.scrollHeight;
      const maxScroll = total - vh;

      if (maxScroll <= 0) {
        track.style.opacity = "0";
        return;
      }

      const trackH = vh - 16; // margin 8px atas & bawah
      const thumbH = Math.max(MIN_THUMB, (vh / total) * trackH);
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);

      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translate3d(0, ${progress * (trackH - thumbH)}px, 0)`;
    };

    const onScroll = () => {
      track.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(update);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        track.style.opacity = "0";
      }, HIDE_AFTER);
    };

    const ro = new ResizeObserver(() => {
      if (!raf) raf = requestAnimationFrame(update);
    });
    ro.observe(document.documentElement);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      clearTimeout(hideTimer);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      className="pointer-events-none fixed bottom-2 right-[3px] top-2 z-[95] w-[4px] opacity-0 transition-opacity duration-300"
    >
      <div
        ref={thumbRef}
        className="w-full rounded-full bg-linear-to-b from-[#5b4dff]/70 to-[#b04dff]/70 shadow-[0_0_8px_#7c5cff55]"
        style={{ height: MIN_THUMB, willChange: "transform" }}
      />
    </div>
  );
}
