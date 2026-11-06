"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import MarkdownView from "../../components/MarkdownView";
import {
  createProject,
  createCertificate,
  updateProject,
  updateCertificate,
  deleteProject,
  deleteCertificate,
  logoutAction,
  type FormState,
} from "./actions";

const initial: FormState = {};

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DESC = 2000;

const label =
  "grid gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#c9c3e0]";
const field =
  "w-full rounded-xl border border-[#8b6dff40] bg-[#1a1240]/60 px-3.5 py-3 text-sm font-normal normal-case tracking-normal text-white outline-none placeholder:text-[#7d74a8] focus:border-[#b58aff] focus:shadow-[0_0_0_3px_#b58aff25]";
const fileField = `${field} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#5b4dff] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`;
const hint =
  "text-[11px] font-normal normal-case tracking-normal text-[#8f88b0]";

function Submit({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-[46px] cursor-pointer rounded-xl bg-linear-to-r from-[#5b4dff] to-[#b04dff] text-sm font-semibold text-white shadow-[0_10px_30px_#7c5cff40] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function Notice({ state }: { state: FormState }) {
  if (state.error)
    return (
      <p
        role="alert"
        className="m-0 rounded-lg border border-[#ff6e7a50] bg-[#ff6e7a15] px-3.5 py-2.5 text-[13px] text-[#ff9aa3]"
      >
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className="m-0 rounded-lg border border-[#7ce3bd50] bg-[#7ce3bd15] px-3.5 py-2.5 text-[13px] text-[#9ff0cf]">
        Berhasil disimpan.
      </p>
    );
  return null;
}

type ToolId = "bold" | "italic" | "link" | "code" | "list";

// Editor deskripsi: Markdown + HTML aman, dengan toolbar dan preview.
// Nilai dikirim lewat <input type="hidden">, jadi textarea boleh disembunyikan
// saat tab Preview aktif tanpa memblokir submit.
function RichTextField({
  name,
  max,
  initialValue = "",
}: {
  name: string;
  max: number;
  initialValue?: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);
  const [tab, setTab] = useState<"write" | "preview">("write");

  function apply(next: string, selStart: number, selEnd: number) {
    if (next.length > max) return;
    setValue(next);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  function wrap(before: string, after: string, placeholder: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = value.slice(s, e) || placeholder;
    apply(
      value.slice(0, s) + before + sel + after + value.slice(e),
      s + before.length,
      s + before.length + sel.length,
    );
  }

  function prefixLines(prefix: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const start = s === 0 ? 0 : value.lastIndexOf("\n", s - 1) + 1;
    let end = value.indexOf("\n", e);
    if (end === -1) end = value.length;
    const block = value
      .slice(start, end)
      .split("\n")
      .map((l) => prefix + l)
      .join("\n");
    apply(
      value.slice(0, start) + block + value.slice(end),
      start,
      start + block.length,
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      e.preventDefault();
      wrap("**", "**", "teks tebal");
    } else if (k === "i") {
      e.preventDefault();
      wrap("*", "*", "teks miring");
    }
  }

  // Data murni (tanpa fungsi) supaya tidak ada akses ref saat render
  const tools: { id: ToolId; label: string; title: string; cls?: string }[] = [
    { id: "bold", label: "B", title: "Tebal (Ctrl+B)", cls: "font-bold" },
    { id: "italic", label: "I", title: "Miring (Ctrl+I)", cls: "italic" },
    { id: "link", label: "Link", title: "Tautan" },
    { id: "code", label: "</>", title: "Kode", cls: "font-mono" },
    { id: "list", label: "• List", title: "Daftar" },
  ];

  // Dipanggil hanya dari event handler klik
  function runTool(id: ToolId) {
    if (id === "bold") wrap("**", "**", "teks tebal");
    else if (id === "italic") wrap("*", "*", "teks miring");
    else if (id === "link") wrap("[", "](https://)", "teks link");
    else if (id === "code") wrap("`", "`", "kode");
    else prefixLines("- ");
  }

  const tabBtn = (t: "write" | "preview", text: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold normal-case tracking-normal transition-colors ${
        tab === t
          ? "bg-[#5b4dff] text-white"
          : "text-[#c9bcff] hover:bg-[#b58aff20]"
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={value} />

      <div className="flex flex-wrap items-center gap-1.5">
        {tabBtn("write", "Tulis")}
        {tabBtn("preview", "Preview")}
        {tab === "write" && (
          <div className="ml-auto flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <button
                key={t.id}
                type="button"
                title={t.title}
                onClick={() => runTool(t.id)}
                className={`cursor-pointer rounded-md border border-[#8b6dff50] px-2.5 py-1 text-xs normal-case tracking-normal text-[#d9c7ff] transition-colors hover:bg-[#b58aff20] ${t.cls ?? "font-semibold"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={max}
          rows={7}
          placeholder={
            "Jelaskan project ini.\n\nContoh: **tebal**, *miring*, <b>HTML</b>, [link](https://...)"
          }
          className={`${field} resize-y font-mono`}
        />
      ) : (
        <div className={`${field} min-h-[170px]`}>
          {value.trim() ? (
            <MarkdownView source={value} breaks />
          ) : (
            <p className="m-0 text-[#7d74a8]">
              Belum ada isi untuk di-preview.
            </p>
          )}
        </div>
      )}

      <span className={hint}>
        Mendukung Markdown (<code>**tebal**</code>, <code>*miring*</code>,{" "}
        <code>- list</code>, <code>[teks](url)</code>) dan HTML aman (
        <code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>, <code>&lt;u&gt;</code>
        ). Script dan style dibuang otomatis. {value.length}/{max}
      </span>
    </div>
  );
}

type PickedImage = { file: File; url: string };

// Picker multi-gambar: akumulasi pilihan, preview thumbnail, hapus & ganti cover.
// File disinkronkan ke <input type="file"> tersembunyi lewat DataTransfer,
// jadi form action tetap menerima semuanya di fd.getAll(name).
// onCount (opsional) memberi tahu parent berapa gambar baru yang dipilih.
function ImagePicker({
  name,
  max,
  onCount,
}: {
  name: string;
  max: number;
  onCount?: (n: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PickedImage[]>([]);
  const [warn, setWarn] = useState("");
  const itemsRef = useRef<PickedImage[]>([]);

  // Hanya cleanup saat unmount: lepaskan semua object URL yang masih ada
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    };
  }, []);

  function sync(next: PickedImage[]) {
    itemsRef.current = next;
    setItems(next);
    const dt = new DataTransfer();
    next.forEach((i) => dt.items.add(i.file));
    if (inputRef.current) inputRef.current.files = dt.files;
    onCount?.(next.length);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);
    const next = [...items];
    const messages: string[] = [];

    for (const f of incoming) {
      const dup = next.some(
        (x) =>
          x.file.name === f.name &&
          x.file.size === f.size &&
          x.file.lastModified === f.lastModified,
      );
      if (dup) continue;
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
        messages.push(`${f.name}: format harus JPG, PNG, atau WebP.`);
        continue;
      }
      if (f.size > MAX_IMAGE_BYTES) {
        messages.push(`${f.name}: ukuran lebih dari 5MB.`);
        continue;
      }
      if (next.length >= max) {
        messages.push(`Maksimal ${max} gambar.`);
        break;
      }
      next.push({ file: f, url: URL.createObjectURL(f) });
    }

    setWarn([...new Set(messages)].join(" "));
    sync(next);
  }

  function remove(i: number) {
    setWarn("");
    URL.revokeObjectURL(items[i].url);
    sync(items.filter((_, idx) => idx !== i));
  }

  function makeCover(i: number) {
    const next = [...items];
    const [picked] = next.splice(i, 1);
    next.unshift(picked);
    sync(next);
  }

  return (
    <div className="grid gap-2">
      <input
        ref={inputRef}
        name={name}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={items.length >= max}
        className={`${fileField} flex items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className="rounded-lg bg-[#5b4dff] px-3 py-1.5 text-xs font-semibold text-white">
          {items.length ? "Tambah Gambar" : "Pilih Gambar"}
        </span>
        <span className="text-sm text-[#cfc8ea]">
          {items.length
            ? `${items.length}/${max} gambar dipilih`
            : "Belum ada gambar dipilih"}
        </span>
      </button>

      <span className={hint}>
        Bisa pilih berkali-kali (maks {max}, tiap gambar maks 5MB). Gambar
        pertama jadi cover.
      </span>

      {warn && (
        <p
          role="alert"
          className="m-0 rounded-lg border border-[#ff6e7a50] bg-[#ff6e7a15] px-3 py-2 text-xs normal-case tracking-normal text-[#ff9aa3]"
        >
          {warn}
        </p>
      )}

      {items.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
          {items.map((it, i) => (
            <li
              key={it.url}
              className="relative grid gap-1.5 rounded-xl border border-[#8b6dff30] bg-[#1a1240]/50 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.url}
                alt={it.file.name}
                className="aspect-[4/3] w-full rounded-lg object-cover"
              />

              {i === 0 && (
                <span className="absolute left-3.5 top-3.5 rounded-full bg-[#5b4dff] px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-white">
                  Cover
                </span>
              )}

              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Hapus ${it.file.name}`}
                className="absolute right-3.5 top-3.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-black/60 text-xs font-bold text-white transition-colors hover:bg-[#ff6e7a]"
              >
                ✕
              </button>

              <div className="truncate text-[11px] normal-case tracking-normal text-[#cfc8ea]">
                {it.file.name}
              </div>

              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeCover(i)}
                  className="cursor-pointer rounded-md border border-[#8b6dff50] px-2 py-1 text-[11px] font-semibold normal-case tracking-normal text-[#d9c7ff] transition-colors hover:bg-[#b58aff20]"
                >
                  Jadikan cover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProjectForm() {
  const [state, action, pending] = useActionState(createProject, initial);
  const ref = useRef<HTMLFormElement>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [mdWarn, setMdWarn] = useState("");
  const [prevState, setPrevState] = useState(state);

  // Sesuaikan state saat render (bukan di effect) ketika hasil action berubah
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) {
      setPickerKey((k) => k + 1); // kosongkan picker gambar & editor deskripsi
      setMdWarn("");
    }
  }

  // Effect hanya menyentuh DOM (reset form), tanpa setState
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  function onReadmePick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setMdWarn("");
      return;
    }
    if (!/\.(md|markdown)$/i.test(f.name)) {
      setMdWarn("File harus berformat .md atau .markdown.");
      e.target.value = "";
      return;
    }
    if (f.size > 200 * 1024) {
      setMdWarn("Ukuran file markdown maksimal 200KB.");
      e.target.value = "";
      return;
    }
    setMdWarn("");
  }

  return (
    <form ref={ref} action={action} className="grid gap-4">
      <label className={label}>
        Title
        <input
          name="title"
          required
          maxLength={100}
          placeholder="Nama project"
          className={field}
        />
        <span className={hint}>Slug dibuat otomatis dari title.</span>
      </label>

      <div className={label}>
        Preview / Poster
        <ImagePicker key={pickerKey} name="posters" max={MAX_IMAGES} />
      </div>

      <div className={label}>
        Deskripsi
        <RichTextField key={pickerKey} name="description" max={MAX_DESC} />
      </div>

      <label className={label}>
        README / Dokumentasi (opsional)
        <input
          name="readme"
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={onReadmePick}
          className={fileField}
        />
        <span className={hint}>File .md atau .markdown, maks 200KB.</span>
        {mdWarn && (
          <span
            role="alert"
            className="rounded-lg border border-[#ff6e7a50] bg-[#ff6e7a15] px-3 py-2 text-xs normal-case tracking-normal text-[#ff9aa3]"
          >
            {mdWarn}
          </span>
        )}
      </label>

      <label className={label}>
        Teknologi (opsional)
        <input
          name="technologies"
          placeholder="Next.js, Tailwind, Supabase"
          className={field}
        />
        <span className={hint}>Pisahkan dengan koma.</span>
      </label>

      <label className={label}>
        Link Demo
        <input
          name="demo_url"
          type="url"
          required
          maxLength={500}
          placeholder="https://project-kamu.com"
          className={field}
        />
      </label>

      <label className={label}>
        Key Features
        <textarea
          name="key_features"
          required
          rows={3}
          placeholder="Login admin, Upload gambar, Responsive"
          className={field}
        />
        <span className={hint}>Pisahkan dengan koma.</span>
      </label>

      <Notice state={state} />
      <Submit pending={pending}>
        {pending ? "Menyimpan..." : "Tambah Project"}
      </Submit>
    </form>
  );
}

export type EditableProject = {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  demo_url: string;
  key_features: string[];
  gallery: { path: string; url: string }[];
  has_readme: boolean;
};

// Form edit project. Gambar lama dikirim lewat <input name="keep"> (urutan = urutan akhir),
// gambar baru lewat ImagePicker (name="posters").
export function EditProjectForm({ project }: { project: EditableProject }) {
  const [state, action, pending] = useActionState(updateProject, initial);
  const [kept, setKept] = useState(project.gallery);
  const [newCount, setNewCount] = useState(0);
  const [mdWarn, setMdWarn] = useState("");

  const room = Math.max(0, MAX_IMAGES - kept.length);

  function removeKept(i: number) {
    setKept((k) => k.filter((_, idx) => idx !== i));
  }

  function makeCover(i: number) {
    setKept((k) => {
      const next = [...k];
      const [picked] = next.splice(i, 1);
      next.unshift(picked);
      return next;
    });
  }

  function onReadmePick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setMdWarn("");
      return;
    }
    if (!/\.(md|markdown)$/i.test(f.name)) {
      setMdWarn("File harus berformat .md atau .markdown.");
      e.target.value = "";
      return;
    }
    if (f.size > 200 * 1024) {
      setMdWarn("Ukuran file markdown maksimal 200KB.");
      e.target.value = "";
      return;
    }
    setMdWarn("");
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={project.id} />
      {kept.map((g) => (
        <input key={g.path} type="hidden" name="keep" value={g.path} />
      ))}

      <label className={label}>
        Title
        <input
          name="title"
          required
          maxLength={100}
          defaultValue={project.title}
          className={field}
        />
        <span className={hint}>
          Slug tidak berubah, supaya link lama tetap jalan.
        </span>
      </label>

      <div className={label}>
        Gambar saat ini
        {kept.length === 0 ? (
          <span className={hint}>
            Semua gambar lama dihapus. Tambahkan gambar baru di bawah.
          </span>
        ) : (
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
            {kept.map((g, i) => (
              <li
                key={g.path}
                className="relative grid gap-1.5 rounded-xl border border-[#8b6dff30] bg-[#1a1240]/50 p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.url}
                  alt=""
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
                {i === 0 && (
                  <span className="absolute left-3.5 top-3.5 rounded-full bg-[#5b4dff] px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-white">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeKept(i)}
                  aria-label="Hapus gambar"
                  className="absolute right-3.5 top-3.5 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-black/60 text-xs font-bold text-white transition-colors hover:bg-[#ff6e7a]"
                >
                  ✕
                </button>
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="cursor-pointer rounded-md border border-[#8b6dff50] px-2 py-1 text-[11px] font-semibold normal-case tracking-normal text-[#d9c7ff] transition-colors hover:bg-[#b58aff20]"
                  >
                    Jadikan cover
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={label}>
        Tambah gambar baru
        {room === 0 && newCount === 0 ? (
          <span className={hint}>
            Sudah mencapai maksimal {MAX_IMAGES} gambar. Hapus salah satu dulu.
          </span>
        ) : (
          <ImagePicker name="posters" max={room} onCount={setNewCount} />
        )}
      </div>

      <div className={label}>
        Deskripsi
        <RichTextField
          name="description"
          max={MAX_DESC}
          initialValue={project.description}
        />
      </div>

      <label className={label}>
        Ganti README (opsional)
        <input
          name="readme"
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={onReadmePick}
          className={fileField}
        />
        <span className={hint}>
          {project.has_readme
            ? "Project ini sudah punya README. Kosongkan untuk mempertahankannya."
            : "Project ini belum punya README."}
        </span>
        {mdWarn && (
          <span
            role="alert"
            className="rounded-lg border border-[#ff6e7a50] bg-[#ff6e7a15] px-3 py-2 text-xs normal-case tracking-normal text-[#ff9aa3]"
          >
            {mdWarn}
          </span>
        )}
      </label>

      {project.has_readme && (
        <label className="flex items-center gap-2 text-xs font-normal normal-case tracking-normal text-[#cfc8ea]">
          <input type="checkbox" name="remove_readme" />
          Hapus README yang ada (diabaikan jika kamu upload file baru)
        </label>
      )}

      <label className={label}>
        Teknologi (opsional)
        <input
          name="technologies"
          defaultValue={project.technologies.join(", ")}
          placeholder="Next.js, Tailwind, Supabase"
          className={field}
        />
        <span className={hint}>Pisahkan dengan koma.</span>
      </label>

      <label className={label}>
        Link Demo
        <input
          name="demo_url"
          type="url"
          required
          maxLength={500}
          defaultValue={project.demo_url}
          className={field}
        />
      </label>

      <label className={label}>
        Key Features
        <textarea
          name="key_features"
          required
          rows={3}
          defaultValue={project.key_features.join(", ")}
          className={field}
        />
        <span className={hint}>Pisahkan dengan koma.</span>
      </label>

      <Notice state={state} />
      <Submit pending={pending}>
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </Submit>
    </form>
  );
}

export function CertificateForm() {
  const [state, action, pending] = useActionState(createCertificate, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-4">
      <label className={label}>
        Gambar Sertifikat
        <input
          name="image"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className={fileField}
        />
      </label>
      <Notice state={state} />
      <Submit pending={pending}>
        {pending ? "Mengupload..." : "Tambah Sertifikat"}
      </Submit>
    </form>
  );
}

// Ganti gambar sertifikat (dipakai di tiap item daftar sertifikat)
export function ReplaceCertificateForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(updateCertificate, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-1.5">
      <input type="hidden" name="id" value={id} />
      <input
        name="image"
        type="file"
        required
        accept="image/jpeg,image/png,image/webp"
        className="w-full cursor-pointer text-[11px] text-[#cfc8ea] file:mr-2 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#5b4dff] file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-white"
      />
      {state.error && (
        <p role="alert" className="m-0 text-[11px] text-[#ff9aa3]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="m-0 text-[11px] text-[#9ff0cf]">Gambar diganti.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-lg border border-[#8b6dff50] px-3 py-1.5 text-xs font-semibold text-[#d9c7ff] transition-colors hover:bg-[#b58aff20] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Mengganti..." : "Ganti Gambar"}
      </button>
    </form>
  );
}

export function DeleteButton({
  id,
  kind,
  name,
}: {
  id: string;
  kind: "project" | "certificate";
  name: string;
}) {
  return (
    <form
      action={kind === "project" ? deleteProject : deleteCertificate}
      onSubmit={(e) => {
        if (!confirm(`Hapus "${name}"? Tindakan ini tidak bisa dibatalkan.`))
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="cursor-pointer rounded-lg border border-[#ff6e7a50] bg-[#ff6e7a15] px-3 py-1.5 text-xs font-semibold text-[#ff9aa3] transition-colors hover:bg-[#ff6e7a30]"
      >
        Hapus
      </button>
    </form>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="cursor-pointer rounded-lg border border-[#8b6dff50] px-3.5 py-2 text-xs font-semibold text-[#d9c7ff] transition-colors hover:bg-[#b58aff20]"
      >
        Logout
      </button>
    </form>
  );
}
