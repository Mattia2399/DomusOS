import { ActionSections } from '../components/landing/Action';
import { FAQ } from '../components/landing/FAQ';
import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { SocialProof } from '../components/landing/SocialProof';
import { Technical } from '../components/landing/Technical';
import { UserStories } from '../components/landing/UserStories';
import './BetaLandingPage.css';

export function BetaLandingPage() {
  return (
    <main className="landing-site min-h-screen overflow-x-hidden bg-[#05070d] text-white selection:bg-cyan-500/30">
      <Header />
      <Hero />
      <Features />
      <InteractiveDemo />
      <UserStories />
      <Technical />
      <SocialProof />
      <FAQ />
      <ActionSections />
      <Footer />
    </main>
  );
}

export default BetaLandingPage;
