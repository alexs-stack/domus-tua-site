import type { Metadata } from "next";
import Header from "./components/Header";
import HeroCinematic from "./components/HeroCinematic";
import HomeSearchGateway from "./components/HomeSearchGateway";
import HorizonStory from "./components/HorizonStory";
import StarReviews from "./components/StarReviews";
import Paths from "./components/Paths";
import Method from "./components/Method";
import OpenDomus from "./components/OpenDomus";
import DomusDocProtocol from "./components/DomusDocProtocol";
import Services from "./components/Services";
import FeaturedTestimonial from "./components/FeaturedTestimonial";
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
        {/* Il set piece "orizzonte": fondale aereo + cupola + pannelli orizzontali
            (tecnica dal dossier era-residence §11, contenuti e forme nostri).
            Le Cinque stelle (capitolo recensioni unificato) vivono DENTRO la
            stessa superficie curva: il muro delle voci consegna lo sfondo
            pulito e la stella appare sulla stessa pagina, senza la linea
            d'ombra che il cambio di superficie disegnava (fix 2026-08-04). */}
        <HorizonStory>
          <StarReviews />
        </HorizonStory>
        {/* Il momento video della home vive nel muro delle voci (HorizonStory,
            atto 4): la vecchia SocialVideoWall è stata ritirata per non
            mostrare due volte gli stessi video. */}
        <Paths />
        <Method />
        <OpenDomus />
        <DomusDocProtocol tone="cream-deep" />
        <Services />
        <FeaturedTestimonial />
        <div className="bg-paper">
          <SectionDivider tone="paper" />
        </div>
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
