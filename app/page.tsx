import type { Metadata } from "next";
import { ratingLabel, site } from "./lib/site";
import Header from "./components/Header";
import HeroCinematic from "./components/HeroCinematic";
import Posizionamento from "./components/Posizionamento";
import HomeSearchGateway from "./components/HomeSearchGateway";
import ComeLavoriamo from "./components/ComeLavoriamo";
import Voci from "./components/Voci";
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
import Congedo from "./components/Congedo";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";

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
      {/* CONTRATTO DI DIREZIONE — «la rivista bianca» (spec 2026-09-10 §3.0).
          THESIS: una rivista immobiliare bianca — titoli maiuscoli enormi,
          paragrafi grandi e leggeri, media squadrati a tutta larghezza, vuoto
          generoso. Rifiuta la home «a card» e la home «cinematografica scura».
          OWN-WORLD: un solo fondo avorio; Playfair maiuscolo per i titoli;
          corsivo Pinyon rosso una volta per capitolo; rosso solo per accento
          e CTA; nessun raggio, nessuna ombra, nessun velo.
          STORY: chi deve vendere capisce in un colpo cosa fa l'agenzia, vede
          persone e case vere, legge le voci dei clienti e trova una sola
          azione: chiedere la valutazione.
          FIRST VIEWPORT: header chiaro; lockup «Domus Tua» a 13vw con la
          firma staccata sotto; H1; video a tutta larghezza; blocco CTA a
          destra sotto il video.
          FORM: il canone del riferimento pinnato dalla cliente
          (immobiliaregoldengoal.it), eseguito nella nostra palette: rosso al
          posto dell'oro, fondo chiaro al posto della banda nera. Nessuna
          sezione pinnata tranne la rotaia del team; nessun cambio di tono fra
          i capitoli, perché il fondo è uno. */}
      <Header />
      <main className="flex-1">
        <HeroCinematic />
        <Posizionamento />
        <HomeSearchGateway />
        <ComeLavoriamo />
        <Voci />
        <Paths />
        <Method />
        <OpenDomus />
        <DomusDocProtocol />
        <Services />
        <CostiChiari />
        <FeaturedTestimonial />
        <Social />
        <Team />
        <Contact />
        <Congedo />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
