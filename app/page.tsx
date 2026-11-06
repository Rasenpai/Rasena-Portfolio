import Hero from "../components/Hero";
import About from "../components/About";
import Contact from "../components/Contact";
import Skills from "../components/Skills";
import PortfolioSection from "../components/PortfolioSection";

export default function Page() {
  return (
    <>
      <Hero />
      <About />
      <PortfolioSection />
      <Skills />
      <Contact />
    </>
  );
}
