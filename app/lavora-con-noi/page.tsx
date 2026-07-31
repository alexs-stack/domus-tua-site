import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import LavoraConNoiContent from "./LavoraConNoiContent";
import { faqIt } from "./faq";
import { site, siteUrl } from "../lib/site";

// NIENTE JSON-LD JobPosting, di proposito: schema.org/JobPosting richiede annunci
// reali e databili (titolo, data di pubblicazione, sede, tipo di contratto) e Google
// penalizza le offerte scadute o inventate. Questa pagina raccoglie candidature
// spontanee: quando il cliente aprirà posizioni vere, si aggiunge il markup con i
// dati suoi. Vedi docs/lavora-con-noi.md.
const title = "Lavora con noi";
const description =
  "Candidature spontanee per Domus Tua Immobiliare, Tradate (VA): consulenza immobiliare, front office, home staging, contenuti e video, tirocini. Raccontaci chi sei: leggiamo ogni candidatura.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/lavora-con-noi" },
  openGraph: { title, description },
};

const pageUrl = `${siteUrl}/lavora-con-noi`;

// Le domande sono le STESSE mostrate in pagina (./faq.ts): markup che promette
// risposte diverse da quelle visibili è, per le linee guida di Google, spam.
// NB: dal 2023 i rich result FAQ sono riservati a siti governativi e sanitari,
// quindi qui non ci aspettiamo il box in SERP: il markup resta perché rende la
// pagina leggibile a chi la interroga in modo automatico (Bing, assistenti AI).
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${pageUrl}#faq`,
  mainEntity: faqIt.map((item) => ({
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

export default function LavoraConNoiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <LavoraConNoiContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
