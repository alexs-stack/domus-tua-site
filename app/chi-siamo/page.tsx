import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { jsonLdScript, site, siteUrl } from "../lib/site";
import { team, teamRoleLabels } from "../lib/team";
import ChiSiamoContent from "./ChiSiamoContent";

export const metadata: Metadata = {
  title: "Chi siamo — agenzia immobiliare a Tradate dal 2007",
  description:
    "Domus Tua nasce nel 2007 dalla visione di Raffaela Rizza: agenzia indipendente a guida femminile, tre anni consecutivi Top Agency Wikicasa.",
  alternates: { canonical: "/chi-siamo" },
  openGraph: {
    title: "Chi siamo — agenzia immobiliare a Tradate dal 2007",
    description:
    "Domus Tua nasce nel 2007 dalla visione di Raffaela Rizza: agenzia indipendente a guida femminile, tre anni consecutivi Top Agency Wikicasa.",
  },
};

/**
 * Le persone come dato strutturato (punto 26: `Person` era fra i tipi mancanti).
 *
 * Sono le sei persone reali del roster, con il nome che l'agenzia pubblica e il ruolo che
 * si legge in pagina — nessun dato inventato e nessun campo che il sito non mostri già.
 * `worksFor` le aggancia al nodo #organization: senza, sarebbero sei persone senza
 * contesto invece del team di Domus Tua.
 *
 * NIENTE `image`, `email` o `telephone`: le foto individuali non ci sono ancora (vedi
 * team.ts) e i recapiti personali non sono pubblicati sul sito. Un dato strutturato deve
 * descrivere la pagina, non superarla.
 *
 * Le etichette sono quelle italiane perché tutti i metadata del sito lo sono; il roster
 * multilingua resta al componente.
 */
const teamJsonLd = team.map((m) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteUrl}/chi-siamo#${m.name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
  name: m.name,
  jobTitle: teamRoleLabels.it[m.role],
  worksFor: { "@id": `${siteUrl}/#organization` },
}));

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: site.name, item: siteUrl },
    { "@type": "ListItem", position: 2, name: "Chi siamo", item: `${siteUrl}/chi-siamo` },
  ],
};

export default function ChiSiamoPage() {
  return (
    <>
      {teamJsonLd.map((person) => (
        <script
          key={person["@id"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(person) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <Header />
      <ChiSiamoContent since={site.since} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
