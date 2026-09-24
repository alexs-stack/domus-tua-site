import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import OpenDomusPageContent from "./OpenDomusPageContent";
import { breadcrumbJsonLd, jsonLdScript, siteUrl } from "../lib/site";
import { faqIt } from "./faq";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Open Domus";
const BREADCRUMB_PATH = "/open-domus";


// Le domande del markup sono ESATTAMENTE quelle mostrate in pagina (./faq.ts, lingua it):
// un FAQPage che promette risposte diverse da quelle visibili è, per le linee guida di
// Google, markup ingannevole. La prova sta in e2e/pages.spec.ts, perché markup e pagina si
// incontrano solo nell'HTML servito.
//
// NON è in conflitto con quello di /domande-frequenti: queste quattro domande sono
// contenuto PROPRIO, non un sottoinsieme (verificate una per una). La regola che vieta i
// doppioni resta valida per /vendi e /acquista, che mostrano risposte generali e infatti
// non portano markup.
//
// NB: dal 2023 i rich result FAQ in SERP sono riservati a siti governativi e sanitari,
// quindi non ci aspettiamo il box: il markup serve a chi interroga la pagina in modo
// automatico (Bing, assistenti conversazionali).
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${siteUrl}/open-domus#faq`,
  mainEntity: faqIt.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export const metadata: Metadata = {
  title: "Open Domus: l'open house che non lascia nulla al caso",
  description:
    "Immobile preparato, documenti già disponibili, acquirenti prequalificati e visite per appuntamento. Il format esclusivo di Domus Tua a Tradate.",
  alternates: { canonical: "/open-domus" },
  openGraph: {
    title: "Open Domus: l'open house che non lascia nulla al caso",
    description:
    "Immobile preparato, documenti già disponibili, acquirenti prequalificati e visite per appuntamento. Il format esclusivo di Domus Tua a Tradate.",
  },
};

export default function OpenDomusPage() {
  return (
    <>
      {/* Domande e risposte: vedi la nota sopra. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      {/* Briciolo di pane: è ciò che Google mostra al posto dell'URL nudo nei
          risultati. Costruito da breadcrumbJsonLd (site.ts), non ricopiato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(BREADCRUMB_NAME, BREADCRUMB_PATH)) }}
      />
      <Header />
      <OpenDomusPageContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
