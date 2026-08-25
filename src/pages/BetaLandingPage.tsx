import { BentoFeatures } from '../components/landing/BentoFeatures';
import { Editions } from '../components/landing/Editions';
import { FAQ } from '../components/landing/FAQ';
import { FinalCTA } from '../components/landing/FinalCTA';
import { Footer } from '../components/landing/Footer';
import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { PlansMobile } from '../components/landing/PlansMobile';
import { Pricing } from '../components/landing/Pricing';
import { TrustBar } from '../components/landing/TrustBar';
import { useIsDesktop } from '../components/landing/useIsDesktop';
import './BetaLandingPage.css';

export function BetaLandingPage() {
  const isDesktop = useIsDesktop();

  return (
    <main className="landing-site dashboard-theme-dark min-h-screen overflow-x-hidden bg-[#05070d] text-white selection:bg-cyan-500/30">
      <Header />
      <Hero />
      <TrustBar />
      <BentoFeatures />
      <InteractiveDemo />
      {/* Desktop: two full sections. Mobile: one combined tabbed card (Gratis/Pro). */}
      {isDesktop ? (
        <>
          <Editions />
          <Pricing />
        </>
      ) : (
        <PlansMobile />
      )}
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}

export default BetaLandingPage;
