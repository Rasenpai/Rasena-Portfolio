"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";

/**
 * Crop foto profil (persegi, tampil bulat). Tanpa library:
 * geser = drag, zoom = slider / scroll mouse / pinch. Output JPG 512x512.
 */

const STAGE = 288; // ukuran area crop (px)
const OUTPUT = 512; // ukuran hasil (px)
const MAX_ZOOM = 4;

type Nat = { w: number; h: number };
type View = { x: number; y: number; zoom: number };

function clampView(v: View, nat: Nat): View {
  const zoom = Math.min(Math.max(v.zoom, 1), MAX_ZOOM);
  const scale = (STAGE / Math.min(nat.w, nat.h)) * zoom;
  const maxX = Math.max(0, (nat.w * scale - STAGE) / 2);
  const maxY = Math.max(0, (nat.h * scale - STAGE) / 2);
  return {
    zoom,
    x: Math.min(Math.max(v.x, -maxX), maxX),
    y: Math.min(Math.max(v.y, -maxY), maxY),
  };
}

type Props = {
  file: File;
  onCancel: () => void;
  onDone: (cropped: File) => void;
};

export default function AvatarCropper({ file, onCancel, onDone }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<Nat | null>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  // Object URL untuk file yang dipilih
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNat(null);
    setView({ x: 0, y: 0, zoom: 1 });
    setError("");
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Esc = batal, kunci scroll halaman saat modal terbuka
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  const update = useCallback(
    (fn: (v: View) => View) => {
      if (!nat) return;
      setView((prev) => clampView(fn(prev), nat));
    },
    [nat],
  );

  // Zoom pakai scroll mouse (listener non-passive supaya halaman tidak ikut scroll)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      update((v) => ({
        ...v,
        zoom: v.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08),
      }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [update]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const map = pointers.current;
    const prev = map.get(e.pointerId);
    if (!prev) return;

    if (map.size === 2) {
      // Pinch zoom
      const [a, b] = [...map.values()];
      const before = Math.hypot(a.x - b.x, a.y - b.y);
      map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [c, d] = [...map.values()];
      const after = Math.hypot(c.x - d.x, c.y - d.y);
      if (before > 0)
        update((v) => ({ ...v, zoom: v.zoom * (after / before) }));
      return;
    }

    // Drag (geser)
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });
    update((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
  }

  function apply() {
    const img = imgRef.current;
    if (!img || !nat || busy) return;
    setBusy(true);
    setError("");

    const scale = (STAGE / Math.min(nat.w, nat.h)) * view.zoom;
    const size = STAGE / scale; // sisi area crop dalam piksel gambar asli
    const cx = nat.w / 2 - view.x / scale;
    const cy = nat.h / 2 - view.y / scale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return setError("Browser tidak mendukung crop.");
    }
    ctx.fillStyle = "#0d0b20"; // latar untuk PNG transparan
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      cx - size / 2,
      cy - size / 2,
      size,
      size,
      0,
      0,
      OUTPUT,
      OUTPUT,
    );

    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (!blob) return setError("Gagal memproses gambar.");
        onDone(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  }

  const scale = nat ? (STAGE / Math.min(nat.w, nat.h)) * view.zoom : 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Crop foto profil"
    >
      <div className="w-full max-w-[360px] rounded-3xl border border-white/10 bg-[#0d0b20] p-5 shadow-2xl">
        <h4 className="m-0 text-lg font-bold tracking-[-0.02em]">
          Crop foto profil
        </h4>
        <p className="m-0 mt-1 text-[13px] text-muted">
          Geser untuk memosisikan, zoom untuk memperbesar.
        </p>

        {/* Area crop */}
        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ width: STAGE, height: STAGE }}
          className="relative mx-auto mt-4 cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-black/40 active:cursor-grabbing"
        >
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setNat({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                })
              }
              onError={() =>
                setError("Gambar tidak bisa dibaca. Coba file lain.")
              }
              style={{
                width: nat?.w,
                height: nat?.h,
                visibility: nat ? "visible" : "hidden",
                transform: `translate(-50%, -50%) translate(${view.x}px, ${view.y}px) scale(${scale})`,
              }}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none origin-center"
            />
          )}
          {/* Mask lingkaran */}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgba(7,6,26,0.7)] ring-2 ring-white/60" />
        </div>

        {/* Zoom */}
        <label className="mt-4 flex items-center gap-3 text-xs text-muted">
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={view.zoom}
            disabled={!nat}
            onChange={(e) =>
              update((v) => ({ ...v, zoom: Number(e.target.value) }))
            }
            className="h-1.5 flex-1 cursor-pointer accent-[#7c5cff]"
            aria-label="Zoom"
          />
        </label>

        {error && (
          <p role="alert" className="m-0 mt-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 cursor-pointer rounded-xl border border-white/10 text-sm font-medium text-muted transition hover:border-white/25 hover:text-ink"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!nat || busy}
            className="h-11 cursor-pointer rounded-xl bg-linear-to-r from-[#5b6cff] to-[#a855f7] text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Memproses..." : "Terapkan"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
