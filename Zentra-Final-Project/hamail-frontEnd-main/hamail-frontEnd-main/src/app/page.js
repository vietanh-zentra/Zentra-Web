import ZentraHero from "@/components/ZentraHero";
import WhyZentraSection from "@/components/WhyZentraSection";
import TraderVisionSection from "@/components/TraderVisionSection";
import InControlSection from "@/components/InControlSection";
import ForEveryTraderSection from "@/components/ForEveryTraderSection";
import StatesExplanationSection from "@/components/StatesExplanationSection";
import ScrollToTop from "@/components/ScrollToTop";
import { Table } from "lucide-react";

export default function Home() {
  return (
    <>
      <ZentraHero />
      {/* <TabletHero /> */}
      <TraderVisionSection />
      <WhyZentraSection />
      <ForEveryTraderSection />
      <StatesExplanationSection />
      <InControlSection />
      <ScrollToTop />
    </>
  );
}
