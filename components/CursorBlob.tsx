"use client";

import { useEffect, useRef } from "react";

const SIZE = 130; // diameter area glow (px), tepinya memudar jadi tidak terlihat
const FOLLOW = 0.14; // makin kecil = makin "ngelag" mengikuti kursor
const MAX_STRETCH = 0.7; // seberapa memanjang saat kursor cepat

// Mask radial: bagian tengah penuh, memudar ke transparan.
// Mask ini juga yang melembutkan tepi backdrop-blur, jadi tidak ada garis bentuk.
const FEATHER =
  "radial-gradient(circle at center, #000 0%, rgba(0,0,0,0.55) 35%, transparent 72%)";

export default function CursorBlob() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hanya untuk perangkat dengan mouse, dan hormati reduced-motion
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let tx = 0,
      ty = 0; // posisi kursor (target)
    let x = 0,
      y = 0; // posisi glow
    let sx = 1,
      sy = 1; // skala saat ini
    let angle = 0;
    let visible = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        x = tx;
        y = ty;
        visible = true;
        el.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      el.style.opacity = "0";
    };

    const tick = () => {
      const dx = tx - x;
      const dy = ty - y;
      x += dx * FOLLOW;
      y += dy * FOLLOW;

      // Jarak tersisa ke kursor = "kecepatan": bergerak -> memanjang, berhenti -> kembali bulat
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) angle = Math.atan2(dy, dx);

      const stretch = Math.min(dist / 80, 1) * MAX_STRETCH;
      sx += (1 + stretch - sx) * 0.18;
      sy += (1 - stretch * 0.35 - sy) * 0.18;

      el.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0) rotate(${angle}rad) scale(${sx}, ${sy})`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-10 opacity-0 transition-opacity duration-500"
      style={{
        width: SIZE,
        height: SIZE,
        willChange: "transform",
        // Tint ungu tipis, tanpa tepi tegas
        background:
          "radial-gradient(circle at center, rgba(124,92,255,0.32) 0%, rgba(176,77,255,0.16) 45%, transparent 75%)",
        // Efek kaca: konten di belakang jadi buram
        backdropFilter: "blur(14px) saturate(1.3)",
        WebkitBackdropFilter: "blur(14px) saturate(1.3)",
        maskImage: FEATHER,
        WebkitMaskImage: FEATHER,
      }}
    />
  );
}
