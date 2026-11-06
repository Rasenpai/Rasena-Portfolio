"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

function Lightbox({
  images,
  title,
  index,
  onIndex,
  onClose,
}: {
  images: string[];
  title: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const total = images.length;
  const touchX = useRef<number | null>(null);

  const go = (dir: 1 | -1) => onIndex((index + dir + total) % total);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onIndex((index - 1 + total) % total);
      else if (e.key === "ArrowRight") onIndex((index + 1) % total);
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, total, onIndex, onClose]);

  const navBtn =
    "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/55 text-2xl text-white backdrop-blur transition-colors hover:bg-white/25 sm:h-12 sm:w-12";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Galeri ${title}`}
      className="fixed inset-0 z-[100] grid h-dvh w-screen place-items-center bg-black/95 p-3 sm:p-4"
      onClick={onClose}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null || total < 2) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="absolute right-3 top-3 z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-black/55 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/25 sm:right-4 sm:top-4 sm:h-11 sm:w-11"
      >
        ✕
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Gambar sebelumnya"
            className={`${navBtn} left-2 sm:left-6`}
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Gambar berikutnya"
            className={`${navBtn} right-2 sm:right-6`}
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
          >
            ›
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`Screenshot ${title}, gambar ${index + 1} dari ${total}`}
        decoding="async"
        className="max-h-[85dvh] max-w-full rounded-lg object-contain shadow-[0_20px_80px_#000]"
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {index + 1} / {total}
        </div>
      )}
    </div>
  );
}

export default function ProjectGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  if (images.length === 0) return null;

  return (
    <div className="grid min-w-0 gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Perbesar gambar"
        className="group relative cursor-zoom-in overflow-hidden rounded-2xl border border-[#8b6dff30] bg-[#0b0820] shadow-[0_20px_80px_#7c5cff25]"
      >
        {/* Gambar utama ada di layar pertama: dimuat lebih dulu untuk LCP */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={`Screenshot ${title}, gambar ${active + 1} dari ${images.length}`}
          fetchPriority="high"
          decoding="async"
          className="aspect-[16/10] w-full object-contain"
        />
        <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          ⤢ Perbesar
        </span>
      </button>

      {images.length > 1 && (
        <ul className="m-0 flex list-none snap-x gap-2.5 overflow-x-auto p-0 pb-2">
          {images.map((src, i) => (
            <li key={src} className="w-20 shrink-0 snap-start sm:w-24">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Lihat gambar ${i + 1}`}
                aria-current={i === active}
                className={`block w-full cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                  i === active
                    ? "border-[#b58aff] shadow-[0_0_0_3px_#b58aff25]"
                    : "border-[#8b6dff30] opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open &&
        createPortal(
          <Lightbox
            images={images}
            title={title}
            index={active}
            onIndex={setActive}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
}
