import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "../../../../lib/admin-session";
import { getProjectForEdit } from "../../../../lib/admin-data";
import { EditProjectForm } from "../../AdminForms";

export const metadata: Metadata = {
  title: "Edit Project",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const card =
  "rounded-2xl border border-[#8b6dff40] bg-linear-to-b from-[#2a1f5c]/50 to-[#3b1f5c]/40 p-5 shadow-[0_20px_80px_#7c5cff20] backdrop-blur-xl sm:p-6";

const shell = {
  backgroundImage: "var(--page-glow)",
  backgroundRepeat: "no-repeat",
} as const;

// Shell statis; bagian dinamis (cek sesi + query) di-stream lewat Suspense
export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <EditContent params={params} />
    </Suspense>
  );
}

async function EditContent({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const project = getProjectForEdit(id);
  if (!project) notFound();

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-bg" style={shell}>
      <div className="mx-auto w-full max-w-[760px] px-4 py-8 sm:py-10">
        <Link
          href="/admin"
          className="mb-5 inline-flex text-sm font-semibold text-[#b58aff] hover:underline"
        >
          ← Kembali ke admin
        </Link>
        <div className={card}>
          <h1 className="m-0 mb-5 text-xl font-bold tracking-[-0.02em] text-white">
            Edit Project
          </h1>
          <EditProjectForm project={project} />
        </div>
      </div>
    </div>
  );
}
