import Hero from "@/components/sections/Hero";
import MetricsStrip from "@/components/sections/MetricsStrip";
import PipelineScroll from "@/components/sections/PipelineScroll";
import LayersSection from "@/components/sections/LayersSection";
import SiteMapSection from "@/components/sections/SiteMapSection";
import LimitationsSection from "@/components/sections/LimitationsSection";
import CtaSection from "@/components/sections/CtaSection";

export default function Home() {
  return (
    <>
      <Hero />
      <MetricsStrip />
      <PipelineScroll />
      <LayersSection />
      <SiteMapSection />
      <LimitationsSection />
      <CtaSection />
    </>
  );
}
