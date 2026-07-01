import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import BeforeAfter from "../components/BeforeAfter";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";

export const metadata: Metadata = {
  title: "Vendere casa a Tradate, senza stress",
  description:
    "Vendi casa con il metodo Domus Tua: valutazione professionale, documenti verificati, home staging, rendering, marketing e Open Domus, con assistenza fino al rogito.",
};

const sellSteps = [
  {
    n: "01",
    title: "Valutazione e analisi di mercato",
    copy: "Partiamo dal valore reale del tuo immobile: analisi della zona, delle caratteristiche e della domanda, per definire prezzo e strategia senza illusioni e senza svendere.",
    image: "/images/hero_03_attico_dining_living.jpg",
    alt: "Attico luminoso con zona pranzo e living",
  },
  {
    n: "02",
    title: "Verifica documentale",
    copy: "Controlliamo conformità, titoli e documenti prima di mettere in vendita. Così arrivi alla trattativa e al rogito senza intoppi né brutte sorprese.",
    image: "/images/premium_04_living_libreria.jpg",
    alt: "Living elegante con libreria",
  },
  {
    n: "03",
    title: "Preparazione e home staging",
    copy: "Valorizziamo gli spazi con consigli mirati e, dove serve, home staging: la casa si presenta al meglio e attira più interesse, più in fretta.",
    image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
    alt: "Sala preparata con home staging",
  },
  {
    n: "04",
    title: "Marketing e Open Domus",
    copy: "Foto, video, rendering e campagne multicanale raccontano la casa. L'evento Open Domus concentra acquirenti qualificati e accelera le proposte.",
    image: "/images/premium_05_living_accenti_senape.jpg",
    alt: "Living moderno con accenti color senape",
  },
];

export default function VendiPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Per chi vende"
          title={
            <>
              Vendere casa,
              <br />
              <span className="text-red-soft">senza stress.</span>
            </>
          }
          subcopy="Non mettiamo semplicemente online il tuo immobile. Lo prepariamo, lo raccontiamo e lo vendiamo con metodo, riducendo errori, tempi morti e incertezze."
          image="/images/premium_02_living_dining_piante.jpg"
          alt="Living luminoso con zona pranzo"
          primary={{ label: "Valuta il tuo immobile", href: "#contatti" }}
          secondary={{ label: "Come funziona", href: "#percorso" }}
          trust={[
            "Valutazione senza impegno",
            "Documenti verificati",
            "Assistenza fino al rogito",
          ]}
        />

        <Highlights
          tone="paper"
          eyebrow="Perché affidarti a noi"
          title="Vendere da soli può costare caro. Con metodo, no."
          intro="Prezzo sbagliato, documenti incompleti e acquirenti non qualificati sono le tre trappole più comuni. Il metodo Domus Tua le trasforma in altrettanti punti di forza."
          items={[
            {
              title: "Il valore giusto",
              copy: "Una valutazione professionale evita di svendere o di restare mesi sul mercato a prezzo fuori target.",
            },
            {
              title: "Documenti a posto",
              copy: "Verifichiamo tutto prima: niente sorprese che bloccano la trattativa o il rogito.",
            },
            {
              title: "Acquirenti giusti",
              copy: "Prequalifichiamo chi visita e gestiamo le proposte con trasparenza, tutelando i tuoi interessi.",
            },
          ]}
        />

        <EditorialRows
          id="percorso"
          eyebrow="Il percorso di vendita"
          title="Dalla prima stima alla firma, un passo alla volta."
          intro="Ogni vendita segue lo stesso metodo collaudato. Tu resti sempre informato, noi gestiamo la complessità."
          rows={sellSteps}
          tone="cream"
        />

        <BeforeAfter />
        <FeaturedTestimonial />
        <Reviews />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
