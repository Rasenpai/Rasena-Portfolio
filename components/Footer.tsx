import { Container } from "./ui";
import { contact } from "../data/content";

const socials = [
  { label: "LinkedIn", href: contact.linkedin },
  { label: "GitHub", href: contact.github },
  { label: "Instagram", href: contact.instagram },
  { label: "TikTok", href: contact.tiktok },
];

export default async function Footer() {
  "use cache";

  return (
    <footer className="border-t border-line py-6 text-xs text-muted">
      <Container className="flex flex-wrap items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} Rasena · Network & Systems</span>

        <nav
          aria-label="Profil dan proyek Rasena"
          className="flex flex-wrap gap-x-4 gap-y-1"
        >
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="me noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              {s.label}
            </a>
          ))}
          <a
            href="https://network.rasena.web.id"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            NetworkLab
          </a>
        </nav>

        <span>Built with curiosity, documented with care.</span>
      </Container>
    </footer>
  );
}
