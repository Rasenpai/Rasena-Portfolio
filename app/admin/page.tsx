import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/admin-session";
import { listProjects, listCertificates } from "../../lib/admin-data";
import {
  ProjectForm,
  CertificateForm,
  ReplaceCertificateForm,
  DeleteButton,
  LogoutButton,
} from "./AdminForms";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const card =
  "rounded-2xl border border-[#8b6dff40] bg-linear-to-b from-[#2a1f5c]/50 to-[#3b1f5c]/40 p-5 shadow-[0_20px_80px_#7c5cff20] backdrop-blur-xl sm:p-6";
const h2 = "m-0 text-xl font-bold tracking-[-0.02em] text-white";

const shell = {
  backgroundImage: "var(--page-glow)",
  backgroundRepeat: "no-repeat",
} as const;

// Shell statis: ini yang diprerender, bagian dinamis di-stream lewat Suspense
export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContent />
    </Suspense>
  );
}

function AdminFallback() {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-bg"
      style={shell}
    >
      <p className="m-0 text-sm text-[#cfc8ea]">Memuat...</p>
    </div>
  );
}

async function AdminContent() {
  const session = await getSession();
  if (!session) redirect("/login");

  const projectList = listProjects();
  const certList = listCertificates();

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg" style={shell}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full border border-[#8b6dff50] bg-[#5b4dff25] px-3 py-1 text-xs font-semibold text-[#c9bcff]">
              Admin Portal
            </span>
            <h1 className="mb-0 mt-3 text-[clamp(26px,4vw,36px)] font-bold tracking-[-0.03em] text-white">
              Kelola Portfolio
            </h1>
            <p className="m-0 mt-1 text-sm text-[#cfc8ea]">{session.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/messages"
              className="rounded-lg border border-[#8b6dff50] px-3.5 py-2 text-xs font-semibold text-[#d9c7ff] transition-colors hover:bg-[#b58aff20]"
            >
              Pesan
            </Link>
            <LogoutButton />
          </div>
        </header>

        {/* ---------- Project ---------- */}
        <section className="mb-10 grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className={card}>
            <h2 className={`${h2} mb-5`}>Tambah Project</h2>
            <ProjectForm />
          </div>

          <div className={card}>
            <h2 className={`${h2} mb-5`}>
              Daftar Project{" "}
              <span className="text-sm font-normal text-[#9d93c9]">
                ({projectList.length})
              </span>
            </h2>
            {projectList.length === 0 ? (
              <p className="m-0 text-sm text-[#9d93c9]">Belum ada project.</p>
            ) : (
              <ul className="m-0 grid list-none gap-4 p-0">
                {projectList.map((p) => (
                  <li
                    key={p.id}
                    className="flex gap-4 rounded-xl border border-[#8b6dff30] bg-[#1a1240]/50 p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.poster_url}
                      alt={p.title}
                      loading="lazy"
                      className="h-20 w-28 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-white">
                        {p.title}
                      </div>
                      <div className="truncate text-xs text-[#9d93c9]">
                        /{p.slug}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-[#cfc8ea]">
                        {p.description}
                      </div>
                      <div className="mt-1.5 truncate text-[11px] text-[#9d93c9]">
                        {p.technologies.length
                          ? p.technologies.join(" · ")
                          : "—"}{" "}
                        · {p.key_features.length} fitur
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <a
                          href={p.demo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#b58aff] hover:underline"
                        >
                          Demo ↗
                        </a>
                        <Link
                          href={`/admin/edit/${p.id}`}
                          className="rounded-lg border border-[#8b6dff50] px-3 py-1.5 text-xs font-semibold text-[#d9c7ff] transition-colors hover:bg-[#b58aff20]"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={p.id} kind="project" name={p.title} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ---------- Sertifikat ---------- */}
        <section className="grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div className={card}>
            <h2 className={`${h2} mb-5`}>Tambah Sertifikat</h2>
            <CertificateForm />
          </div>

          <div className={card}>
            <h2 className={`${h2} mb-5`}>
              Daftar Sertifikat{" "}
              <span className="text-sm font-normal text-[#9d93c9]">
                ({certList.length})
              </span>
            </h2>
            {certList.length === 0 ? (
              <p className="m-0 text-sm text-[#9d93c9]">
                Belum ada sertifikat.
              </p>
            ) : (
              <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0">
                {certList.map((c) => (
                  <li
                    key={c.id}
                    className="grid gap-2 rounded-xl border border-[#8b6dff30] bg-[#1a1240]/50 p-2.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image_url}
                      alt="Sertifikat"
                      loading="lazy"
                      className="aspect-[4/3] w-full rounded-lg object-cover"
                    />
                    <ReplaceCertificateForm id={c.id} />
                    <DeleteButton
                      id={c.id}
                      kind="certificate"
                      name="sertifikat ini"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
