import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import ServiziContent from "./ServiziContent";
import { breadcrumbJsonLd, jsonLdScript, organizationJsonLd, siteUrl } from "../lib/site";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Servizi";
const BREADCRUMB_PATH = "/servizi";

export const metadata: Metadata = {
  title: "Home staging, rendering e video per vendere casa",
  description:
    "Home staging, rendering e virtual rendering, video emozionali, campagne marketing e servizi tecnico-legali. Tutto compreso nel mandato di vendita.",
  alternates: { canonical: "/servizi" },
  openGraph: {
    title: "Home staging, rendering e video per vendere casa",
    description:
    "Home staging, rendering e virtual rendering, video emozionali, campagne marketing e servizi tecnico-legali. Tutto compreso nel mandato di vendita.",
  },
};

// I servizi come CATALOGO dichiarato (voce 26). Sono gli stessi che la pagina descrive —
// i tre creativi di ServiziContent più i due che il metodo comprende — perché un markup che
// elenca servizi non visibili in pagina è la stessa promessa non mantenuta di un FAQPage
// con risposte diverse da quelle mostrate.
//
// NESSUN prezzo, e non per pigrizia: i servizi sono compresi nel mandato e si pagano a
// vendita conclusa (§5.6, §6.4). Dichiararli a listino contraddirebbe la riga che il
// documento chiama l'argomento di vendita più forte dell'agenzia.
//
// `provider` per @id all'organizzazione invece di ridichiararla: l'entità è una sola, e
// due descrizioni della stessa azienda nello stesso sito sono due entità per Google.
const SERVIZI = [
  "Rendering e virtual rendering",
  "Home staging",
  "Emotional video real estate",
  "Marketing immobiliare e campagne",
  "Servizi tecnico-amministrativi e legali",
];

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "OfferCatalog",
  "@id": `${siteUrl}/servizi#catalogo`,
  name: "I servizi Domus Tua",
  provider: { "@id": `${siteUrl}/#organization` },
  areaServed: organizationJsonLd().areaServed,
  itemListElement: SERVIZI.map((nome, i) => ({
    "@type": "Offer",
    position: i + 1,
    itemOffered: {
      "@type": "Service",
      name: nome,
      provider: { "@id": `${siteUrl}/#organization` },
      serviceType: nome,
    },
  })),
};

export default function ServiziPage() {
  return (
    <>
      {/* Catalogo dei servizi: vedi la nota sopra. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(serviceJsonLd) }}
      />
      {/* Briciolo di pane: è ciò che Google mostra al posto dell'URL nudo nei
          risultati. Costruito da breadcrumbJsonLd (site.ts), non ricopiato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(BREADCRUMB_NAME, BREADCRUMB_PATH)) }}
      />
      <Header />
      <ServiziContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
