import type { Metadata } from "next";
import Header from "./components/Header";
import HeroCinematic from "./components/HeroCinematic";
import HomeSearchGateway from "./components/HomeSearchGateway";
import Stats from "./components/Stats";
import Authority from "./components/Authority";
import Paths from "./components/Paths";
import Method from "./components/Method";
import OpenDomus from "./components/OpenDomus";
import DomusDocProtocol from "./components/DomusDocProtocol";
import Services from "./components/Services";
import SocialVideoWall from "./components/SocialVideoWall";
import FeaturedTestimonial from "./components/FeaturedTestimonial";
import Reviews from "./components/Reviews";
import Social from "./components/Social";
import Team from "./components/Team";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import SectionDivider from "./components/SectionDivider";
import KineticStrip from "./components/motion/KineticStrip";
import ThreadNav from "./components/motion/ThreadNav";

export const metadata: Metadata = {
  title: {
    absolute: "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza",
  },
  description:
    "Dal 2007 a Tradate, Domus Tua accompagna venditori e acquirenti con un metodo fatto di valutazione, documenti verificati, marketing, Open Domus e assistenza fino al rogito. 4.9/5 da oltre 500 recensioni.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza",
    description:
      "Un metodo completo per vendere e acquistare casa con cura, trasparenza e assistenza fino al rogito. Tradate (VA), dal 2007.",
  },
};

export default function Home() {
  return (
    <>
      <Header />
      {/* Il filo rosso che cuce i capitoli della home (desktop, motion ok) */}
      <ThreadNav />
      <main className="flex-1">
        <HeroCinematic />
        <HomeSearchGateway />
        <Stats />
        <Authority />
        <SocialVideoWall />
        <Paths />
        <Method />
        <OpenDomus />
        <DomusDocProtocol tone="cream-deep" />
        <Services />
        <FeaturedTestimonial />
        <div className="bg-paper">
          <SectionDivider tone="paper" />
        </div>
        <Reviews />
        <Social />
        <div className="bg-cream">
          <SectionDivider tone="cream" />
        </div>
        <Team />
        <Contact />
        {/* Eco di chiusura: la promessa dell'hero torna gigante, in deriva con lo scroll */}
        <KineticStrip className="bg-cream-deep" />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
