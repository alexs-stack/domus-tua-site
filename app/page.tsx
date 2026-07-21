import type { Metadata } from "next";
import Header from "./components/Header";
import HeroCinematic from "./components/HeroCinematic";
import HomeSearchGateway from "./components/HomeSearchGateway";
import Authority from "./components/Authority";
import Method from "./components/Method";
import OpenDomus from "./components/OpenDomus";
import DomusDocProtocol from "./components/DomusDocProtocol";
import BeforeAfter from "./components/BeforeAfter";
import SocialVideoWall from "./components/SocialVideoWall";
import Listings from "./components/Listings";
import Reviews from "./components/Reviews";
import Team from "./components/Team";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";

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
      <main className="flex-1">
        {/* 1. Apertura: hero cinematografico + gateway compra/vendi */}
        <HeroCinematic />
        <HomeSearchGateway />
        {/* 2. Prova compatta (dati verificati) */}
        <Authority />
        {/* 3. Immobili in evidenza — subito dopo la prova */}
        <Listings />
        {/* 4. Open Domus: l'esperienza firma */}
        <OpenDomus />
        {/* 5. Prima/dopo */}
        <BeforeAfter />
        {/* 6. Metodo (3 fasi) + Domus D.O.C. (teaser) */}
        <Method variant="home" />
        <DomusDocProtocol tone="cream-deep" variant="teaser" />
        {/* 7. Storia del team */}
        <Team />
        {/* 8. Recensioni verificate */}
        <Reviews />
        {/* 9. Media verificati (1 storia + 3 card) come chiusura, prima del contatto */}
        <SocialVideoWall />
        {/* 10. Contatto / valutazione finale */}
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
