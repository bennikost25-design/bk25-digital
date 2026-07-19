import { HeroSection } from "@/components/home/HeroSection";
import { ProblemSection } from "@/components/home/ProblemSection";
import { PrinciplesSection } from "@/components/home/PrinciplesSection";
import { ProjectShowcase } from "@/components/home/ProjectShowcase";
import { PackagesSection } from "@/components/home/PackagesSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { AboutSection } from "@/components/home/AboutSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <PrinciplesSection />
      <ProjectShowcase />
      <PackagesSection />
      <ProcessSection />
      <AboutSection />
      <FinalCtaSection />
    </>
  );
}
