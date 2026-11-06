import type { Metadata } from "next";
import Image from "next/image";
import { Caveat } from "next/font/google";
import { Container } from "../../components/ui";
import JourneyTimeline from "../../components/JourneyTimeline";

const JOURNEY_TITLE = "My Journey: Perjalanan Menjadi Network Engineer";
const JOURNEY_DESCRIPTION =
  "Perjalanan Rasena belajar, mencoba, gagal, dan berkembang di dunia jaringan, Linux, dan infrastruktur menuju Network Engineer dan Sysadmin.";

export const metadata: Metadata = {
  title: JOURNEY_TITLE,
  description: JOURNEY_DESCRIPTION,
  alternates: { canonical: "/journey" },
  openGraph: {
    type: "website",
    url: "/journey",
    siteName: "Rasena - Portfolio",
    title: JOURNEY_TITLE,
    description: JOURNEY_DESCRIPTION,
    locale: "id_ID",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Rasena - Network Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: JOURNEY_TITLE,
    description: JOURNEY_DESCRIPTION,
    images: ["/og.png"],
  },
};

// Font tulisan tangan untuk kutipan di gambar
const handwritten = Caveat({ subsets: ["latin"], weight: ["500", "700"] });

export default function JourneyPage() {
  return (
    // <main> sudah ada di layout.tsx, jadi di sini cukup <div>
    <div>
      {/* ============ HEADER (full-bleed, menyatu dengan background) ============ */}
      <section className="relative isolate overflow-hidden">
        {/*
          Gambar di-MASK (transparan di tepi), bukan ditimpa warna solid, jadi glow + grid
          background halaman tetap tembus. Wrapper luar = fade atas/bawah, dalam = fade kiri.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,transparent_0%,#000_24%,#000_66%,transparent_100%)]"
        >
          <div className="absolute inset-0 opacity-40 lg:opacity-90 lg:[mask-image:linear-gradient(to_right,transparent_0%,transparent_24%,rgba(0,0,0,0.5)_46%,#000_74%)]">
            {/* Taruh gambarmu di public/images/journey-hero.jpg */}
            <Image
              src="/images/journey-hero.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[70%_center] lg:object-right"
            />
            <div className="absolute inset-0 bg-accent2/10 mix-blend-color" />
          </div>
        </div>

        {/* Kutipan tulisan tangan, menempel di sisi kanan layar */}
        <p
          className={`${handwritten.className} pointer-events-none absolute right-5 top-6 hidden max-w-[11ch] -rotate-3 text-right text-xl font-medium leading-tight text-accent drop-shadow-[0_0_14px_rgba(124,92,255,0.7)] sm:block sm:text-2xl lg:right-[6%] lg:top-1/2 lg:-translate-y-1/2 lg:text-3xl`}
        >
          &ldquo;Better Systems, Bigger Opportunities&rdquo;
        </p>

        {/* Teks tetap sejajar dengan navbar */}
        <Container className="relative z-10 flex min-h-[300px] items-center py-14 sm:min-h-[340px] sm:py-16 lg:min-h-[380px] lg:py-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
              Rasena · My Journey
            </p>

            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              From Student to
              <br />
              <span className="bg-linear-to-r from-accent2 to-accent bg-clip-text text-transparent">
                System Builder
              </span>
            </h1>

            <span
              aria-hidden="true"
              className="mt-5 block h-[3px] w-10 rounded-full bg-linear-to-r from-accent2 to-accent"
            />

            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink/70">
              Perjalanan saya dalam belajar, mencoba, gagal, dan terus
              berkembang di dunia jaringan, sistem, dan infrastruktur. Setiap
              tahap membawa saya lebih dekat ke tujuan menjadi Network Engineer
              dan Sysadmin.
            </p>
          </div>
        </Container>
      </section>

      {/* ============ TIMELINE ============ */}
      <JourneyTimeline />
    </div>
  );
}
