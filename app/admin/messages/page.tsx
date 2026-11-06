import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/admin-session";
import { listMessages } from "../../../lib/admin-data";
import { markMessageRead, deleteMessage } from "../actions";

export const metadata: Metadata = {
  title: "Pesan",
  robots: { index: false, follow: false },
};

const shell = {
  backgroundImage: "var(--page-glow)",
  backgroundRepeat: "no-repeat",
} as const;

const btn =
  "cursor-pointer rounded-lg border border-[#8b6dff50] px-3 py-1.5 text-xs font-semibold text-[#d9c7ff] transition-colors hover:bg-[#b58aff20]";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-bg"
          style={shell}
        >
          <p className="m-0 text-sm text-[#cfc8ea]">Memuat...</p>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

function fmt(ts: string) {
  const d = new Date(ts.replace(" ", "T").replace(/\+00$/, "Z"));
  return Number.isNaN(d.getTime())
    ? ts
    : d.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      });
}

async function MessagesContent() {
  const session = await getSession();
  if (!session) redirect("/login");

  const list = listMessages();
  const unread = list.filter((m) => !m.read_at).length;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg" style={shell}>
      <div className="mx-auto w-full max-w-[860px] px-4 py-8 sm:py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="m-0 text-[clamp(26px,4vw,36px)] font-bold tracking-[-0.03em] text-white">
              Pesan Masuk
            </h1>
            <p className="m-0 mt-1 text-sm text-[#cfc8ea]">
              {list.length} pesan · {unread} belum dibaca
            </p>
          </div>
          <Link href="/admin" className={btn}>
            ← Kembali
          </Link>
        </header>

        {list.length === 0 ? (
          <p className="m-0 text-sm text-[#9d93c9]">Belum ada pesan.</p>
        ) : (
          <ul className="m-0 grid list-none gap-4 p-0">
            {list.map((m) => (
              <li
                key={m.id}
                className={`rounded-2xl border p-5 ${
                  m.read_at
                    ? "border-[#8b6dff30] bg-[#1a1240]/50"
                    : "border-[#b58aff80] bg-[#2a1f5c]/60"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <b className="text-white">{m.name}</b>
                  {!m.read_at && (
                    <span className="rounded-full bg-[#5b4dff] px-2 py-0.5 text-[10px] font-semibold text-white">
                      Baru
                    </span>
                  )}
                  <a
                    href={`mailto:${m.email}`}
                    className="text-sm text-[#b58aff] hover:underline"
                  >
                    {m.email}
                  </a>
                  <span className="ml-auto text-xs text-[#9d93c9]">
                    {fmt(m.created_at)}
                  </span>
                </div>

                <p className="m-0 mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#e6e1f7]">
                  {m.message}
                </p>

                <div className="mt-4 flex gap-2">
                  <a href={`mailto:${m.email}`} className={btn}>
                    Balas
                  </a>
                  {!m.read_at && (
                    <form action={markMessageRead}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className={btn}>
                        Tandai dibaca
                      </button>
                    </form>
                  )}
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-lg border border-[#ff6e7a50] bg-[#ff6e7a15] px-3 py-1.5 text-xs font-semibold text-[#ff9aa3] transition-colors hover:bg-[#ff6e7a30]"
                    >
                      Hapus
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
