import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Splash from "../components/Splash";
import CursorBlob from "../components/CursorBlob";
import ScrollIndicator from "../components/ScrollIndicator";
import {
  SITE_URL,
  SITE_NAME,
  SEO_TITLE,
  SEO_DESCRIPTION,
  KEYWORDS,
  personJsonLd,
  websiteJsonLd,
} from "../data/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE,
    template: "%s — Rasena",
  },
  description: SEO_DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: "Rasena", url: SITE_URL }],
  creator: "Rasena",
  publisher: "Rasena",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: `${SITE_NAME} - Portfolio`,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    locale: "id_ID",
    // Letakkan gambar 1200x630 di public/og.png
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
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b12",
};

// Jalan sebelum render: splash tampil di setiap load/refresh halaman penuh (bukan saat pindah halaman
// lewat <Link>), kecuali pengguna memilih reduced-motion
const splashFlag = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.splash='on'}catch(e){}`;

// Escape "<" supaya JSON tidak bisa menutup tag script
const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Script
          id="splash-flag"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: splashFlag }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(websiteJsonLd) }}
        />
        <Splash />
        <CursorBlob />
        <ScrollIndicator />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
