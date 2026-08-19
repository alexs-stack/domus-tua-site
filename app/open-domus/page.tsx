import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import OpenDomusPageContent from "./OpenDomusPageContent";
import { breadcrumbJsonLd, jsonLdScript } from "../lib/site";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Open Domus";
const BREADCRUMB_PATH = "/open-domus";

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
