import { contact, profile } from "./content";

// Domain asli bisa diatur lewat env NEXT_PUBLIC_SITE_URL. Kalau tidak diisi, pakai domain di bawah.
// Protokol https:// ditambahkan otomatis kalau lupa ditulis, karena new URL() butuh protokol.
const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://rasena.web.id";

export const SITE_URL = (
  /^https?:\/\//i.test(RAW_SITE_URL) ? RAW_SITE_URL : `https://${RAW_SITE_URL}`
).replace(/\/$/, "");

export const SITE_NAME = "Rasena";

export const PROFESSIONAL_TITLE =
  "Network Engineer | NOC | Technical Support | IT Infrastructure Enthusiast";

// Title tag: dijaga pendek (< 60 karakter) supaya tidak terpotong di Google
export const SEO_TITLE = "Rasena - Network Engineer | NOC | Technical Support";

// Bahasa Indonesia, sama dengan lang="id" dan isi situs. Dijaga di bawah ~160 karakter.
export const SEO_DESCRIPTION =
  "Rasena, calon Network Engineer dan Linux System Administrator dari Indonesia. Berfokus pada jaringan, Linux, server, dan infrastruktur IT.";

export const AREAS_OF_INTEREST = [
  "Network Engineering",
  "Linux & System Administration",
  "Infrastructure & Server Management",
];

export const KEYWORDS = [
  "Rasena",
  "Rasena Network Engineer",
  "hyrasena",
  "Rasenpai",
  "Network Engineer",
  "Calon Network Engineer",
  "Network Engineer Indonesia",
  "NOC",
  "Technical Support",
  "IT Infrastructure",
  "Linux System Administrator",
  "Server Management",
  "MikroTik",
  "Cisco",
  "Portfolio",
  "Indonesia",
];

// Nama lain / handle yang dipakai di berbagai platform, supaya Google
// menghubungkan semuanya ke satu orang yang sama.
export const ALTERNATE_NAMES = [
  contact.instagramHandle,
  contact.tiktokHandle,
  contact.githubHandle,
  "hyrasena",
  "Rasenpai",
].filter((v, i, arr) => arr.indexOf(v) === i);

// Semua profil resmi. Dipakai di Person.sameAs.
// Tambahkan URL baru di sini (YouTube, Medium, Linktree, Credly, dll.) setelah akunnya ada.
export const SAME_AS = [
  contact.linkedin,
  contact.github,
  contact.instagram,
  contact.tiktok,
].filter(Boolean);

const photoUrl = profile.photo.startsWith("http")
  ? profile.photo
  : `${SITE_URL}${profile.photo.startsWith("/") ? "" : "/"}${profile.photo}`;

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const PROFILE_PAGE_ID = `${SITE_URL}/#profilepage`;

// Structured data: dasar Google mengenali "Rasena" sebagai satu orang/entitas
export const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: profile.name,
  alternateName: ALTERNATE_NAMES,
  url: SITE_URL,
  mainEntityOfPage: { "@id": PROFILE_PAGE_ID },
  image: {
    "@type": "ImageObject",
    url: photoUrl,
    caption: profile.photoAlt,
  },
  jobTitle: PROFESSIONAL_TITLE,
  description: SEO_DESCRIPTION,
  knowsAbout: AREAS_OF_INTEREST,
  knowsLanguage: ["id", "en"],
  nationality: { "@type": "Country", name: "Indonesia" },
  homeLocation: { "@type": "Country", name: "Indonesia" },
  sameAs: SAME_AS,
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: `${SITE_NAME} - Portfolio`,
  alternateName: [SITE_NAME, `${SITE_NAME} Portfolio`],
  description: SEO_DESCRIPTION,
  inLanguage: "id-ID",
  author: { "@id": PERSON_ID },
  publisher: { "@id": PERSON_ID },
};

// ProfilePage: memberi tahu Google bahwa halaman ini adalah profil milik satu orang
export const profilePageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": PROFILE_PAGE_ID,
  url: SITE_URL,
  name: SEO_TITLE,
  description: SEO_DESCRIPTION,
  inLanguage: "id-ID",
  isPartOf: { "@id": WEBSITE_ID },
  mainEntity: { "@id": PERSON_ID },
};

// Satu blok @graph berisi semua entitas yang saling terhubung lewat @id.
// Cukup render ini satu kali di layout, tidak perlu lagi tiga script terpisah.
export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { ...personJsonLd, "@context": undefined },
    { ...websiteJsonLd, "@context": undefined },
    { ...profilePageJsonLd, "@context": undefined },
  ],
};