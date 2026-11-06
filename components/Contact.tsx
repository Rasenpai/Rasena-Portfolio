"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode, SVGProps, UIEvent } from "react";
import { Container, Section } from "./ui";
import Reveal from "./Reveal";
import AvatarCropper from "./AvatarCropper";
import { contact } from "../data/content";

/* ------------------------------ Icons ------------------------------ */
type IconProps = SVGProps<SVGSVGElement>;
const Svg = ({ children, ...p }: IconProps & { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
);
const UserIcon = (p: IconProps) => (
  <Svg {...p}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Svg>
);
const MailIcon = (p: IconProps) => (
  <Svg {...p}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></Svg>
);
const MessageSquareIcon = (p: IconProps) => (
  <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>
);
const MessageCircleIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Svg>
);
const SendIcon = (p: IconProps) => (
  <Svg {...p}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Svg>
);
const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
  </Svg>
);
const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </Svg>
);
const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </Svg>
);
const ImagePlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 5h6" /><path d="M19 2v6" />
    <path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /><circle cx="9" cy="9" r="2" />
  </Svg>
);
const LockIcon = (p: IconProps) => (
  <Svg {...p}><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
);
const CropIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></Svg>
);
const XIcon = (p: IconProps) => (
  <Svg {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Svg>
);
const ArrowUpRightIcon = (p: IconProps) => (
  <Svg {...p}><path d="M7 7h10v10" /><path d="M7 17 17 7" /></Svg>
);
const LinkedinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </Svg>
);
const InstagramIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </Svg>
);
const TiktokIcon = (p: IconProps) => (
  <Svg {...p}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></Svg>
);
const GithubIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </Svg>
);

/* ------------------------------ Helpers ------------------------------ */
type Comment = {
  id: string;
  name: string;
  message: string;
  avatar_url: string | null;
  is_admin: boolean;
  pinned: boolean;
  pinned_at: string | null;
  created_at: string;
};

type CommentsPage = { comments: Comment[]; count: number; hasMore: boolean };

const PAGE = 20;
const MAX_FILE = 5 * 1024 * 1024;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

async function apiError(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

const AVATAR_GRADIENTS = [
  "from-[#6366f1] to-[#a855f7]",
  "from-[#ec4899] to-[#f97316]",
  "from-[#06b6d4] to-[#3b82f6]",
  "from-[#10b981] to-[#06b6d4]",
  "from-[#f59e0b] to-[#ef4444]",
];

function gradientFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

const field =
  "w-full rounded-xl border border-white/[0.09] bg-white/[0.04] text-[15px] text-ink outline-none transition placeholder:text-muted/60 hover:border-white/[0.16] focus:border-accent2/70 focus:bg-white/[0.06] focus:ring-4 focus:ring-accent2/15";

const primaryBtn =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#5b6cff] to-[#a855f7] px-5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,92,255,0.7)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

const honeypotCls = "absolute -left-[9999px] h-0 w-0 opacity-0";

/* ------------------------------ Left: contact form ------------------------------ */
function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honey, setHoney] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website: honey }),
      });
      if (!res.ok) {
        setError(await apiError(res, "Gagal mengirim pesan. Coba lagi nanti."));
        return setState("error");
      }
      setName("");
      setEmail("");
      setMessage("");
      setState("ok");
    } catch {
      setError("Gagal mengirim pesan. Coba lagi nanti.");
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Nama Anda</span>
        <UserIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          className={`${field} h-[52px] pl-11 pr-4`}
        />
      </label>
      <label className="relative block">
        <span className="sr-only">Email Anda</span>
        <MailIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
        <input
          required
          type="email"
          maxLength={120}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Anda"
          className={`${field} h-[52px] pl-11 pr-4`}
        />
      </label>
      <label className="relative block">
        <span className="sr-only">Pesan Anda</span>
        <MessageSquareIcon className="pointer-events-none absolute left-4 top-[17px] size-[18px] text-muted" />
        <textarea
          required
          maxLength={2000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Pesan Anda"
          className={`${field} h-[140px] resize-none py-3.5 pl-11 pr-4`}
        />
      </label>

      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        className={honeypotCls}
        aria-hidden="true"
      />

      <button type="submit" disabled={state === "sending"} className={`${primaryBtn} mt-1 h-[52px]`}>
        <SendIcon className="size-[18px]" />
        {state === "sending" ? "Mengirim..." : "Kirim Pesan"}
      </button>
      <div aria-live="polite" className="min-h-[1.25rem]">
        {state === "ok" && <p className="m-0 text-sm text-mint">Pesan terkirim. Terima kasih!</p>}
        {state === "error" && (
          <p role="alert" className="m-0 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

/* ------------------------------ Left: socials ------------------------------ */
function Socials() {
  const items = [
    {
      label: "LinkedIn",
      sub: "Let's connect",
      href: contact.linkedin,
      Icon: LinkedinIcon,
      tile: "bg-[#0a66c2]/20 text-[#5aa9ff]",
      hover: "hover:border-[#0a66c2]/60",
    },
    {
      label: "Instagram",
      sub: contact.instagramHandle,
      href: contact.instagram,
      Icon: InstagramIcon,
      tile: "bg-pink-500/15 text-pink-400",
      hover: "hover:border-pink-500/50",
    },
    {
      label: "TikTok",
      sub: contact.tiktokHandle,
      href: contact.tiktok,
      Icon: TiktokIcon,
      tile: "bg-cyan-400/15 text-cyan-300",
      hover: "hover:border-cyan-400/50",
    },
    {
      label: "GitHub",
      sub: contact.githubHandle,
      href: contact.github,
      Icon: GithubIcon,
      tile: "bg-white/10 text-ink",
      hover: "hover:border-white/35",
    },
  ];

  return (
    <div>
      <h3 className="m-0 mb-4 flex items-center gap-3 text-lg font-bold tracking-[-0.02em]">
        <span className="h-[3px] w-7 rounded-full bg-accent2" />
        Connect With Me
      </h3>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map(({ label, sub, href, Icon, tile, hover }) => (
          <li key={label}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={`group flex items-center gap-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 transition hover:-translate-y-px hover:bg-white/[0.06] ${hover}`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tile}`}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <b className="block text-[15px]">{label}</b>
                <span className="block truncate text-[13px] text-muted">{sub}</span>
              </span>
              <ArrowUpRightIcon className="size-4 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Right: comments ------------------------------ */
function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        className="size-11 shrink-0 rounded-full object-cover ring-2 ring-white/10"
      />
    );
  }
  const initial = [...name.trim()][0]?.toUpperCase() ?? "?";
  return (
    <span
      aria-hidden="true"
      className={`grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br ${gradientFor(name)} text-base font-bold text-white ring-2 ring-white/10`}
    >
      {initial}
    </span>
  );
}

function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null); // hasil crop (yang di-upload)
  const [raw, setRaw] = useState<File | null>(null); // foto asli pilihan user
  const [cropping, setCropping] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [honey, setHoney] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const fetchPage = useCallback(async (offset: number, limit: number) => {
    const res = await fetch(`/api/comments?limit=${limit}&offset=${offset}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("fetch failed");
    return (await res.json()) as CommentsPage;
  }, []);

  // Muat ulang dari awal (limit boleh lebih besar supaya posisi list tidak "mengerut")
  const load = useCallback(
    async (limit = PAGE) => {
      try {
        const data = await fetchPage(0, Math.min(Math.max(limit, PAGE), 50));
        setComments(data.comments);
        setCount(data.count);
        setHasMore(data.hasMore);
      } catch {
        /* biarkan list lama tetap tampil */
      } finally {
        setLoading(false);
      }
    },
    [fetchPage],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(comments.length, PAGE);
      setComments((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...data.comments.filter((c) => !seen.has(c.id))];
      });
      setCount(data.count);
      setHasMore(data.hasMore);
    } catch {
      /* abaikan, user bisa scroll/klik lagi */
    } finally {
      setLoadingMore(false);
    }
  }, [comments.length, fetchPage, hasMore, loadingMore]);

  useEffect(() => {
    load();
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { admin: boolean }) => setIsAdmin(d.admin))
      .catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onListScroll(e: UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) loadMore();
  }

  function onPickFile(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("File harus berupa gambar.");
    if (f.size > MAX_FILE) return setError("Ukuran file maksimal 5MB.");
    setRaw(f);
    setCropping(true); // buka modal crop dulu, baru jadi file upload
  }

  function clearFile() {
    setFile(null);
    setRaw(null);
    setCropping(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const cancelCrop = useCallback(() => {
    setCropping(false);
    // Kalau belum pernah ada hasil crop, batalkan pilihan foto sepenuhnya
    if (!file) {
      setRaw(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [file]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (posting) return;
    setPosting(true);
    setError("");

    const form = new FormData();
    form.set("name", name.trim());
    form.set("message", message.trim());
    form.set("website", honey);
    if (file) form.set("photo", file);

    try {
      const res = await fetch("/api/comments", { method: "POST", body: form });
      if (!res.ok) {
        setError(await apiError(res, "Gagal mengirim komentar. Coba lagi."));
        return;
      }
      setName("");
      setMessage("");
      clearFile();
      await load();
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Gagal mengirim komentar. Coba lagi.");
    } finally {
      setPosting(false);
    }
  }

  async function togglePin(c: Comment) {
    const res = await fetch(`/api/comments/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !c.pinned }),
    });
    if (res.status === 401) setIsAdmin(false);
    await load(comments.length);
  }

  async function remove(c: Comment) {
    if (!window.confirm(`Hapus komentar dari ${c.name}?`)) return;
    const res = await fetch(`/api/comments/${c.id}`, { method: "DELETE" });
    if (res.status === 401) setIsAdmin(false);
    await load(comments.length);
  }

  async function adminLogin(e: FormEvent) {
    e.preventDefault();
    if (loggingIn) return;
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPass }),
      });
      if (!res.ok) {
        setLoginError(await apiError(res, "Email atau password salah."));
        return;
      }
      setAdminPass("");
      setAdminEmail("");
      setShowLogin(false);
      setIsAdmin(true);
    } catch {
      setLoginError("Tidak bisa terhubung ke server.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function adminLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
  }

  return (
    <div className="flex flex-col">
      {cropping && raw && (
        <AvatarCropper
          file={raw}
          onCancel={cancelCrop}
          onDone={(cropped) => {
            setFile(cropped);
            setCropping(false);
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3.5 border-b border-white/[0.08] px-6 py-5 sm:px-8">
        <span className="grid size-11 place-items-center rounded-xl bg-accent2/20 text-accent">
          <MessageCircleIcon className="size-5" />
        </span>
        <h3 className="m-0 flex items-center gap-2.5 text-xl font-bold tracking-[-0.02em]">
          Comments
          <span className="rounded-full bg-accent2/20 px-2.5 py-0.5 text-sm font-semibold text-accent">
            {count}
          </span>
        </h3>
        <div className="ml-auto">
          {isAdmin ? (
            <button
              onClick={adminLogout}
              className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-white/25 hover:text-ink"
            >
              Admin · Logout
            </button>
          ) : (
            <button
              onClick={() => setShowLogin((v) => !v)}
              aria-label="Admin login"
              aria-expanded={showLogin}
              className="grid size-9 cursor-pointer place-items-center rounded-lg text-muted/60 transition hover:bg-white/5 hover:text-ink"
            >
              <LockIcon className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
        {showLogin && !isAdmin && (
          <form
            onSubmit={adminLogin}
            className="flex flex-col gap-3 rounded-2xl border border-accent2/30 bg-accent2/[0.07] p-4"
          >
            <div className="flex items-center justify-between">
              <b className="flex items-center gap-2 text-sm">
                <LockIcon className="size-4 text-accent" />
                Admin login
              </b>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                aria-label="Tutup"
                className="grid size-7 cursor-pointer place-items-center rounded-md text-muted transition hover:bg-white/10 hover:text-ink"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <input
                required
                type="email"
                maxLength={120}
                autoComplete="username"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Email"
                className={`${field} h-11 px-3.5`}
              />
              <input
                required
                type="password"
                maxLength={200}
                autoComplete="current-password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="Password"
                className={`${field} h-11 px-3.5`}
              />
            </div>
            {loginError && (
              <p role="alert" className="m-0 text-sm text-red-400">
                {loginError}
              </p>
            )}
            <button type="submit" disabled={loggingIn} className={`${primaryBtn} h-11`}>
              {loggingIn ? "Memeriksa..." : "Login"}
            </button>
          </form>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="cm-name" className="mb-2 block text-[13px] font-semibold">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="cm-name"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className={`${field} h-12 px-4`}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="cm-msg" className="text-[13px] font-semibold">
                Message <span className="text-red-500">*</span>
              </label>
              <span className="text-xs tabular-nums text-muted">{message.length}/500</span>
            </div>
            <textarea
              id="cm-msg"
              required
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              className={`${field} h-[112px] resize-none px-4 py-3`}
            />
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-semibold">
              Profile Photo <span className="font-normal text-muted">(optional)</span>
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              onChange={(e) => {
                onPickFile(e.target.files?.[0]);
                e.target.value = ""; // supaya file yang sama bisa dipilih ulang
              }}
            />
            <div className="flex items-center gap-3.5 rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-3 transition hover:border-accent2/50">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.06] text-muted">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="size-full object-cover" />
                ) : (
                  <UserIcon className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex max-w-full cursor-pointer items-center gap-2 text-sm font-medium text-[#a5a8ff] transition hover:text-white"
                >
                  <ImagePlusIcon className="size-4 shrink-0" />
                  <span className="truncate">
                    {file ? (raw?.name ?? file.name) : "Choose Profile Photo"}
                  </span>
                </button>
                <p className="m-0 mt-0.5 text-xs text-muted">Max file size: 5MB</p>
              </div>
              {file && raw && (
                <button
                  type="button"
                  onClick={() => setCropping(true)}
                  aria-label="Crop ulang foto"
                  title="Crop ulang"
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-white/10 hover:text-ink"
                >
                  <CropIcon className="size-4" />
                </button>
              )}
              {file && (
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Hapus foto"
                  className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition hover:bg-white/10 hover:text-ink"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </div>
          </div>

          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honey}
            onChange={(e) => setHoney(e.target.value)}
            className={honeypotCls}
            aria-hidden="true"
          />

          <div aria-live="polite">
            {error && (
              <p role="alert" className="m-0 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>

          <button type="submit" disabled={posting} className={`${primaryBtn} h-12`}>
            <SendIcon className="size-[18px]" />
            {posting ? "Posting..." : "Post Comment"}
          </button>
        </form>

        {/* List */}
        <div>
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted">
            <span>Latest comments</span>
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <div
            ref={listRef}
            onScroll={onListScroll}
            tabIndex={0}
            aria-label="Daftar komentar"
            className="-mx-2 max-h-[460px] overflow-y-auto overscroll-contain px-2 pb-6 outline-none [mask-image:linear-gradient(to_bottom,#000_calc(100%-28px),transparent)]"
          >
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {loading &&
                [0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="flex animate-pulse gap-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
                  >
                    <span className="size-11 shrink-0 rounded-full bg-white/10" />
                    <span className="flex-1 space-y-2.5 pt-1">
                      <span className="block h-3 w-1/3 rounded bg-white/10" />
                      <span className="block h-3 w-2/3 rounded bg-white/[0.07]" />
                    </span>
                  </li>
                ))}

              {!loading && comments.length === 0 && (
                <li className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="grid size-12 place-items-center rounded-full bg-accent2/15 text-accent">
                    <MessageCircleIcon className="size-5" />
                  </span>
                  <p className="m-0 text-sm text-muted">Belum ada komentar. Jadilah yang pertama!</p>
                </li>
              )}

              {comments.map((c) => (
                <li
                  key={c.id}
                  className={`flex gap-3.5 rounded-2xl border p-4 transition ${
                    c.pinned
                      ? "border-accent2/40 bg-linear-to-br from-accent2/[0.16] to-accent2/[0.03]"
                      : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <Avatar url={c.avatar_url} name={c.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <b className="max-w-full truncate text-[15px]">{c.name}</b>
                      {c.is_admin && (
                        <span className="rounded-full bg-accent2/30 px-2 py-0.5 text-[11px] font-semibold text-[#d4cfff]">
                          Admin
                        </span>
                      )}
                      {c.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                          <PinIcon className="size-3" fill="currentColor" />
                          Pinned
                        </span>
                      )}
                      <time
                        dateTime={c.created_at}
                        className="ml-auto shrink-0 text-xs text-muted"
                      >
                        {c.pinned ? formatDate(c.created_at) : timeAgo(c.created_at)}
                      </time>
                    </div>
                    <p className="m-0 mt-1.5 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-ink/90">
                      {c.message}
                    </p>
                    {isAdmin && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => togglePin(c)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-muted transition hover:border-accent2/60 hover:text-ink"
                        >
                          <PinIcon className="size-3.5" />
                          {c.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={() => remove(c)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-muted transition hover:border-red-500/60 hover:text-red-400"
                        >
                          <TrashIcon className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}

              {loadingMore && (
                <li className="py-2 text-center text-xs text-muted">Memuat komentar...</li>
              )}
              {!loading && hasMore && !loadingMore && (
                <li className="flex justify-center">
                  <button
                    onClick={loadMore}
                    className="cursor-pointer rounded-lg border border-white/10 px-4 py-1.5 text-xs font-medium text-muted transition hover:border-accent2/50 hover:text-ink"
                  >
                    Muat lebih banyak
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Section ------------------------------ */
export default function Contact() {
  return (
    <Section id="contact">
      <Container>
        <div className="grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <Reveal variant="left">
            <div className="rounded-3xl border border-white/[0.08] bg-linear-to-b from-[#241645]/80 via-[#140f2b]/85 to-[#0d0b20]/90 p-6 sm:p-8">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <h2 className="m-0 bg-linear-to-r from-[#6f72ff] to-[#b07bff] bg-clip-text pb-1 text-[38px] font-extrabold leading-tight tracking-[-0.03em] text-transparent">
                    Hubungi
                  </h2>
                  <p className="m-0 mt-1.5 text-[15px] text-muted">
                    Ada yang ingin didiskusikan? Kirim saya pesan dan mari kita bicara.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Bagikan"
                  onClick={() => {
                    const url = window.location.href;
                    if (navigator.share) navigator.share({ url }).catch(() => {});
                    else navigator.clipboard?.writeText(url);
                  }}
                  className="mt-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-accent2 transition hover:bg-white/5 hover:text-accent"
                >
                  <ShareIcon className="size-5" />
                </button>
              </div>

              <ContactForm />

              <div className="my-6 h-px bg-white/[0.08]" />

              <Socials />
            </div>
          </Reveal>

          <Reveal variant="right" delay={150}>
            <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0d0b20]/80 backdrop-blur-sm">
              <Comments />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}