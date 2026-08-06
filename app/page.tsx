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
import ToneShift from "./components/motion/ToneShift";

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
        {/* "Due percorsi" apre e chiude su FOTOGRAFIE a tutta pagina, non su
            un colore piatto: un ToneShift ai suoi confini accosterebbe una
            campitura a un'immagine (misurato: ΔRGB 263 e 563). Lì la
            transizione dovrà nascere dentro la sezione stessa. */}
        <Paths />
        <Method />
        {/* Da qui in giù ogni cambio di tono è un PASSAGGIO, non un bordo, e
            il gesto è SEMPRE lo STESSO: la cupola. era-residence ripete il
            suo arco due volte in home ed è così che l'esperienza resta
            continua — un gesto ripetuto è un linguaggio, cinque gesti
            diversi sono cinque eccezioni. Qui la cupola è anche la forma del
            marchio, quindi il confine fra due capitoli disegna il logo.
            Varia solo la PROFONDITÀ: più bassa dove il capitolo è breve, più
            alta dove si apre un respiro. */}
        <ToneShift from="cream-deep" to="paper" depth="22svh" />
        <OpenDomus />
        <ToneShift from="paper" to="cream-deep" depth="17svh" />
        <DomusDocProtocol tone="cream-deep" />
        {/* NIENTE cucitura fra D.O.C. e Servizi: cream-deep e cream distano
            ΔRGB 11, cioè sono lo stesso colore per l'occhio. Una transizione
            fra due toni identici non nasconde uno stacco che non esiste — lo
            INVENTA, e si nota proprio perché non serve. Le cuciture restano
            dove il salto è reale (ΔRGB 61-72). */}
        <Services />
        <ToneShift from="cream" to="paper" depth="19svh" />
        <FeaturedTestimonial />
        <div data-tone="paper" className="bg-paper">
          <SectionDivider tone="paper" />
        </div>
        <ToneShift from="paper" to="cream" depth="24svh" />
        <Social />
        <div data-tone="cream" className="bg-cream">
          <SectionDivider tone="cream" />
        </div>
        <Team />
        <Contact />
        {/* Eco di chiusura: la promessa dell'hero torna gigante, in deriva con lo scroll */}
        <KineticStrip surface="cream-deep" className="bg-cream-deep" />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
