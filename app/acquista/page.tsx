import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import EditorialRows from "../components/EditorialRows";
import PropertySearch from "../components/PropertySearch";
import DomusDocProtocol from "../components/DomusDocProtocol";
import { getVisibleListings } from "../lib/listings";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";
import SectionDivider from "../components/SectionDivider";

export const metadata: Metadata = {
  title: "Comprare casa a Tradate, con sicurezza",
  description:
    "Acquista casa con Domus Tua: ricerca mirata, informazioni chiare prima della visita, documentazione verificata e assistenza in ogni passaggio fino al rogito.",
};

const buySteps = [
  {
    n: "01",
    title: "Ricerca mirata",
    copy: "Ascoltiamo cosa cerchi davvero e selezioniamo solo immobili coerenti con le tue esigenze e il tuo budget. Niente visite a vuoto.",
    image: "/images/hero_04_living_moderno_bianco.jpg",
    alt: "Living moderno e luminoso",
  },
  {
    n: "02",
    title: "Le risposte prima della visita",
    copy: "Prima di una visita vogliamo che tu abbia già le informazioni importanti: caratteristiche, documenti, contesto. Così entri in casa con consapevolezza.",
    image: "/images/rendering_03_master_bedroom_legno.jpg",
    alt: "Camera da letto con finiture in legno",
  },
  {
    n: "03",
    title: "Visite guidate e documenti chiari",
    copy: "Ti accompagniamo in visita e mettiamo nero su bianco la documentazione, con trasparenza totale su ogni aspetto dell'immobile.",
    image: "/images/premium_01_living_tv_divano.jpg",
    alt: "Soggiorno arredato con divano",
  },
  {
    n: "04",
    title: "Proposta, trattativa e rogito",
    copy: "Ti supportiamo nella proposta, nella negoziazione e in ogni passaggio fino alla firma. Compri con sicurezza, non con ansia.",
    image: "/images/premium_03_cucina_moderna.jpg",
    alt: "Cucina moderna",
  },
];

export default async function AcquistaPage() {
  const listings = await getVisibleListings();
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Per chi acquista"
          title={
            <>
              Acquistare casa,
              <br />
              <span className="text-red-soft">con sicurezza.</span>
            </>
          }
          subcopy="Non ti mostriamo solo case. Ti accompagniamo verso una scelta sicura, con informazioni chiare, documenti verificati e assistenza in ogni passaggio."
          image="/images/hero_04_living_moderno_bianco.jpg"
          alt="Living moderno bianco e luminoso"
          primary={{ label: "Cerco casa", href: "#contatti" }}
          secondary={{ label: "Vedi le case", href: "#case" }}
          trust={["Informazioni prima della visita", "Documenti verificati", "Assistenza fino al rogito"]}
        />

        <Highlights
          eyebrow="Comprare sereni"
          title="Una casa è una scelta importante. Meriti di farla informato."
          intro="Acquistare casa non dovrebbe significare dubbi e ansie. Con Domus Tua ogni decisione poggia su informazioni chiare e su un team al tuo fianco."
          items={[
            {
              title: "Trasparenza totale",
              copy: "Ti diciamo come stanno davvero le cose: pregi, vincoli e contesto di ogni immobile.",
            },
            {
              title: "Nessuna sorpresa",
              copy: "Documentazione verificata prima della proposta: sai esattamente cosa stai acquistando.",
            },
            {
              title: "Sempre accompagnato",
              copy: "Dalla prima visita al rogito, hai un riferimento che ti guida in ogni passaggio.",
            },
          ]}
        />

        <EditorialRows
          id="percorso"
          eyebrow="Come funziona l'acquisto"
          title="Il percorso che ti porta alle chiavi, con serenità."
          intro="Un metodo chiaro per scegliere bene, senza fretta e senza pressioni."
          rows={buySteps}
        />

        <PropertySearch properties={listings} />
        <FeaturedTestimonial
          quote="Ci siamo sentiti accompagnati in ogni passaggio, fino al rogito. Informazioni chiare e trasparenza totale: abbiamo scelto senza ansie."
          author="Cliente Domus Tua"
          context="Acquisto seguito fino al rogito, Tradate"
          image="/images/reali/open-domus-teresa.jpg"
          alt="Il team Domus Tua con una cliente nella sede di Tradate"
          videoHref="https://www.youtube.com/@DOMUSTUASRLIMMOBILIARE"
        />
        <DomusDocProtocol tone="cream" />
        <Reviews />
        <div className="bg-cream-deep">
          <SectionDivider tone="cream-deep" />
        </div>
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
