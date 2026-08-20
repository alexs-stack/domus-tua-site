import type { Metadata } from "next";
import { breadcrumbJsonLd, jsonLdScript, ratingLabel, site } from "../lib/site";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import RecensioniContent from "./RecensioniContent";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Recensioni";
const BREADCRUMB_PATH = "/recensioni";

export const metadata: Metadata = {
  // §6.8: assoluto — il marchio è già nel title (vedi /metodo).
  title: { absolute: `Recensioni Domus Tua: ${site.reviewsCount} clienti raccontano` },
  description:
    `Leggi e guarda le recensioni di chi ha venduto o acquistato casa con Domus Tua a Tradate e in provincia di Varese. Media ${ratingLabel("it")}/5 su Google.`,
  alternates: { canonical: "/recensioni" },
  openGraph: {
    title: `Recensioni Domus Tua: ${site.reviewsCount} clienti raccontano`,
    description:
    `Leggi e guarda le recensioni di chi ha venduto o acquistato casa con Domus Tua a Tradate e in provincia di Varese. Media ${ratingLabel("it")}/5 su Google.`,
  },
};

export default function RecensioniPage() {
  return (
    <>
      {/* Briciolo di pane: è ciò che Google mostra al posto dell'URL nudo nei
          risultati. Costruito da breadcrumbJsonLd (site.ts), non ricopiato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(BREADCRUMB_NAME, BREADCRUMB_PATH)) }}
      />
      <Header />
      <RecensioniContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
