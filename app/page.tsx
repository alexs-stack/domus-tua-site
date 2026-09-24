import type { Metadata } from "next";
import { ratingLabel, site } from "./lib/site";
import Header from "./components/Header";
import HeroCinematic from "./components/HeroCinematic";
import Posizionamento from "./components/Posizionamento";
import HomeSearchGateway from "./components/HomeSearchGateway";
import HorizonStory from "./components/HorizonStory";
import StarReviews from "./components/StarReviews";
import Paths from "./components/Paths";
import Method from "./components/Method";
import OpenDomus from "./components/OpenDomus";
import DomusDocProtocol from "./components/DomusDocProtocol";
import Services from "./components/Services";
import CostiChiari from "./components/CostiChiari";
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

// Il title dice COSA e DOVE, non lo slogan: "agenzia immobiliare a Tradate" è la query
// con cui le persone cercano davvero, e la vecchia versione ("Vendere senza stress,
// acquistare con sicurezza") non la conteneva. La sigla (VA) disambigua il comune —
// esiste anche una Tradate omonima nei risultati di altre province.
export const metadata: Metadata = {
  title: {
    absolute: "Agenzia Immobiliare a Tradate (VA) | Domus Tua",
  },
  description:
    `Vendi casa a Tradate e in provincia di Varese: valutazione professionale, documenti verificati prima del mercato, Open Domus e assistenza fino al rogito. ${ratingLabel("it")}/5 su ${site.reviewsCount} recensioni Google. Dal 2007.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Agenzia Immobiliare a Tradate (VA) | Domus Tua",
    description:
      "Vendi casa a Tradate e in provincia di Varese: valutazione professionale, documenti verificati prima del mercato, Open Domus e assistenza fino al rogito. Dal 2007.",
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
        {/* Fra l'hero e la ricerca, e non è un dettaglio di ordine.
            Il primo blocco interattivo della home era la ricerca immobili: lo spazio più
            prezioso della pagina assegnato a chi COMPRA. Ma chi compra arriva comunque dai
            portali ed è volume; chi deve scegliere a chi affidare un incarico è il
            fatturato, e trovava un modulo di ricerca al posto di una ragione per
            fidarsi. Adesso prima si dice cosa distingue l'agenzia, poi si cerca casa. */}
        <Posizionamento />
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
        {/* NIENTE cucitura fra Metodo e Open Domus (2026-08-09, direttiva
            cliente: «questo stacco non mi piace, c'è una transizione inutile lì
            in mezzo»). Qui la cupola non copriva un taglio: il monogramma che
            chiude il Metodo la precede già come congedo, e il blocco vuoto
            sotto — 19svh di gesto più i respiri delle due sezioni — apriva
            mezzo schermo di nulla fra un capitolo e l'altro. Il colore continua
            comunque a virare senza bordi, perché a interpolare cream-deep →
            paper è la superficie continua (SurfaceFlow), non la cucitura: le
            due tappe `data-tone` restano dove sono. Le altre cupole della home
            restano: lì il gesto arriva su un confine che altrimenti si vede. */}
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
        {/* Subito dopo l'elenco di tutto ciò che è compreso arriva la domanda che
            quell'elenco fa nascere — «e quanto mi costa?». La risposta stava solo
            dentro un accordion delle FAQ. Nessuna cucitura con FeaturedTestimonial:
            sono entrambe paper, e una transizione fra due toni identici inventerebbe
            uno stacco invece di nasconderlo (vedi la nota qui sopra). */}
        <CostiChiari surface="paper" />
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
