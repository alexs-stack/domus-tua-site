import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import OpenDomus from "../components/OpenDomus";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";

export const metadata: Metadata = {
  title: "Open Domus, l'evento che vende meglio",
  description:
    "Open Domus è il format di visita evoluto di Domus Tua: immobile preparato, documenti disponibili, acquirenti prequalificati e visite organizzate. Più consapevolezza, proposte più rapide.",
};

const phases = [
  {
    n: "01",
    title: "Preparazione dell'immobile",
    copy: "Prima dell'evento la casa viene valorizzata: ordine, luce, dettagli e, dove serve, home staging. L'immobile si presenta al meglio.",
    image: "/images/home_staging_01_sala_reale_sedie_gialle.jpg",
    alt: "Sala preparata con home staging",
  },
  {
    n: "02",
    title: "Accoglienza e materiali",
    copy: "Chi arriva trova documentazione chiara e materiali informativi: caratteristiche, planimetrie, contesto. Tutto quello che serve per decidere con serenità.",
    image: "/images/premium_02_living_dining_piante.jpg",
    alt: "Living accogliente con zona pranzo",
  },
  {
    n: "03",
    title: "Visite organizzate",
    copy: "Gli acquirenti prequalificati visitano in modo ordinato, senza caos e senza sovrapposizioni. Un'esperienza professionale per tutti.",
    image: "/images/hero_05_living_cucina_tavolo.jpg",
    alt: "Living open space con cucina",
  },
  {
    n: "04",
    title: "Feedback e proposte",
    copy: "Raccogliamo i feedback e gestiamo le proposte con trasparenza. Spesso la proposta giusta arriva più in fretta del previsto.",
    image: "/images/premium_01_living_tv_divano.jpg",
    alt: "Soggiorno arredato",
  },
];

export default function OpenDomusPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Asset proprietario"
          title={
            <>
              Open Domus.
              <br />
              <span className="text-red-soft">Un evento, non una visita.</span>
            </>
          }
          subcopy="Un format evoluto che unisce preparazione, accoglienza, documentazione e prequalifica. Trasforma la visita in un momento consapevole, ordinato e professionale."
          image="/images/premium_05_living_accenti_senape.jpg"
          alt="Living moderno con accenti senape"
          primary={{ label: "Organizza il tuo Open Domus", href: "#contatti" }}
          secondary={{ label: "Come si svolge", href: "#percorso" }}
        />

        <OpenDomus />

        <Highlights
          tone="cream"
          eyebrow="Perché è diverso"
          title="Non è un open house. È un'esperienza preparata."
          intro="La differenza non sta nell'aprire le porte, ma in tutto quello che succede prima e durante."
          items={[
            {
              title: "Per chi vende",
              copy: "Più interesse concentrato, immobile valorizzato e proposte più qualificate, in meno tempo.",
            },
            {
              title: "Per chi acquista",
              copy: "Informazioni chiare e documenti già disponibili: si visita con consapevolezza, senza ansie.",
            },
            {
              title: "Per tutti",
              copy: "Un'esperienza ordinata e professionale, che rende la compravendita un momento sereno.",
            },
          ]}
        />

        <EditorialRows
          id="percorso"
          eyebrow="Come si svolge"
          title="Dietro ogni Open Domus, un metodo."
          rows={phases}
        />

        <Reviews />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
