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
import BeforeAfter from "./components/BeforeAfter";
import SocialVideoWall from "./components/SocialVideoWall";
import Listings from "./components/Listings";
import FeaturedTestimonial from "./components/FeaturedTestimonial";
import Reviews from "./components/Reviews";
import Social from "./components/Social";
import Team from "./components/Team";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import SectionDivider from "./components/SectionDivider";

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
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default function Home() {
  return (
    <>
      <Header />
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
        <BeforeAfter />
        <Listings />
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
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
