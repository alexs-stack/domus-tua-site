import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import Services from "../components/Services";
import EditorialRows from "../components/EditorialRows";
import BeforeAfter from "../components/BeforeAfter";
import Contact from "../components/Contact";

export const metadata: Metadata = {
  title: "Servizi immobiliari, oltre l'annuncio",
  description:
    "I servizi Domus Tua: valutazione, servizi tecnici e legali, rendering e virtual rendering, home staging, emotional video, marketing e Open Domus. Valorizziamo, proteggiamo e raccontiamo la tua casa.",
};

const services = [
  {
    n: "01",
    title: "Rendering e virtual rendering",
    copy: "Trasformiamo planimetrie e immobili da ristrutturare in immagini desiderabili. Il potenziale diventa visibile, e vendibile.",
    image: "/images/rendering_01_living_divano_grigio.jpg",
    alt: "Rendering fotorealistico di un living",
  },
  {
    n: "02",
    title: "Home staging",
    copy: "Allestiamo gli spazi per farli percepire al meglio. Una casa preparata si vende prima e a condizioni migliori.",
    image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
    alt: "Ambiente preparato con home staging",
  },
  {
    n: "03",
    title: "Emotional video real estate",
    copy: "Video che raccontano la casa e l'emozione di viverla, non solo le sue stanze. Il modo più coinvolgente per farsi ricordare.",
    image: "/images/premium_03_cucina_moderna.jpg",
    alt: "Cucina moderna in video",
  },
];

export default function ServiziPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Servizi Domus"
          title={
            <>
              Valorizzare, proteggere,
              <br />
              <span className="text-red-soft">raccontare la tua casa.</span>
            </>
          }
          subcopy="Dietro ogni vendita c'è un insieme di servizi che fanno la differenza: tecnici e legali, creativi e di marketing. Tutti parte di un unico metodo."
          image="/images/premium_03_cucina_moderna.jpg"
          alt="Cucina moderna luminosa"
          primary={{ label: "Parla con noi", href: "#contatti" }}
          secondary={{ label: "Esplora i servizi", href: "#servizi" }}
        />

        <Services />

        <EditorialRows
          eyebrow="I servizi creativi"
          title="Far percepire il valore prima ancora della visita."
          intro="Immagini, allestimenti e video che fanno innamorare gli acquirenti dell'immobile, dal primo scroll."
          rows={services}
          tone="paper"
        />

        <BeforeAfter />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
