import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import FaqContent from "./FaqContent";
import { faqFlat } from "./faq";
import { site, siteUrl, jsonLdScript } from "../lib/site";

const title = "Domande frequenti";
const description =
  "Le risposte alle domande più frequenti su come vendere e comprare casa con Domus Tua a Tradate e in provincia di Varese: costi, valutazione, documenti, Open Domus, tempi e contatti.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/domande-frequenti" },
  openGraph: { title, description },
};

const pageUrl = `${siteUrl}/domande-frequenti`;

// Le domande del markup sono ESATTAMENTE quelle mostrate in pagina (./faq.ts, lingua it):
// un FAQPage che promette risposte diverse da quelle visibili è, per le linee guida di
// Google, markup ingannevole. Un test di content integrity verifica la corrispondenza.
//
// Solo italiano, come tutti i metadata del sito (scelta SEO: mercato locale, vedi docs/i18n.md).
//
// NB: dal 2023 i rich result FAQ in SERP sono riservati a siti governativi e sanitari,
// quindi qui non ci aspettiamo il box: il markup resta perché rende la pagina leggibile a
// chi la interroga in modo automatico (Bing, assistenti conversazionali).
//
// ⚠️ Questo è l'UNICO FAQPage del sito insieme a quello di /lavora-con-noi, che risponde a
// un pubblico diverso. I blocchi compatti in coda a /vendi e /acquista mostrano un
// sottoinsieme di queste stesse risposte e NON portano markup proprio: tre FAQPage per lo
// stesso contenuto sarebbero tre dichiarazioni in conflitto.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${pageUrl}#faq`,
  mainEntity: faqFlat("it").map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: site.name, item: siteUrl },
    { "@type": "ListItem", position: 2, name: title, item: pageUrl },
  ],
};

export default function DomandeFrequentiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <Header />
      <FaqContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
