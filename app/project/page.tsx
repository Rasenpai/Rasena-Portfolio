import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, Section, Kicker } from "../../components/ui";
import PortfolioShowcase from "@/components/PortfolioShowcase";
import { getProjects, getCertificates } from "../../lib/portfolio";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Kumpulan project dan sertifikat Rasena.",
};

export default function ProjectsPage() {
  return (
    <Section id="portfolio">
      <Container>
        <Kicker>Portfolio</Kicker>
        <h1 className="mb-8 mt-2.5 text-[clamp(29px,4vw,42px)] font-bold leading-[1.15] tracking-[-0.04em] text-ink">
          Project & sertifikat saya.
        </h1>
        <Suspense
          fallback={
            <p className="m-0 text-sm text-muted">Memuat portfolio...</p>
          }
        >
          <ShowcaseData />
        </Suspense>
      </Container>
    </Section>
  );
}

async function ShowcaseData() {
  return (
    <PortfolioShowcase
      projects={getProjects()}
      certificates={getCertificates()}
    />
  );
}
