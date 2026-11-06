"use client";

import { useEffect, useState } from "react";

export default function PrivateRepoButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#8b6dff40] bg-[#2a1040]/60 px-6 py-4 text-[15px] font-semibold text-[#d9c7ff] transition-all hover:-translate-y-0.5 hover:border-[#b58aff80] hover:bg-[#3b1f5c]/60"
      >
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
        Github
      </button>

      {open && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="private-title"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[120] grid animate-rise place-items-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[512px] rounded-lg bg-[#080818] px-6 py-10 text-center shadow-[0_30px_100px_#000a]"
          >
            <div className="mx-auto grid h-[88px] w-[88px] place-items-center rounded-full border-4 border-[#9adcf5] text-5xl font-light text-[#3fb2e8]">
              i
            </div>
            <h2
              id="private-title"
              className="mb-3 mt-6 text-[28px] font-bold text-white"
            >
              Source Code Private
            </h2>
            <p className="m-0 text-base text-white">
              Maaf, source code untuk proyek ini bersifat privat.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              className="mt-7 cursor-pointer rounded-md bg-[#3085d6] px-5 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#2a77c0]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
