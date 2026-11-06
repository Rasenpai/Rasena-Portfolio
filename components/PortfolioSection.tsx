import { Suspense } from "react";
import { Container, Section, Kicker } from "./ui";
import Reveal from "./Reveal";
import PortfolioShowcase from "./PortfolioShowcase";
import { getProjects, getCertificates } from "../lib/portfolio";

export default function PortfolioSection() {
  return (
    <Section id="portfolio">
      <Container>
        <Reveal className="mb-3">
          <Kicker>02 / Portfolio</Kicker>
        </Reveal>
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
