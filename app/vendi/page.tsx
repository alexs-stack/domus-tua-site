import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import VendiContent from "./VendiContent";
import { breadcrumbJsonLd, jsonLdScript } from "../lib/site";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Vendere casa";
const BREADCRUMB_PATH = "/vendi";

export const metadata: Metadata = {
  title: "Vendere casa a Tradate: valutazione gratuita",
  description:
    "Nessun costo anticipato, si paga solo a vendita conclusa. Valutazione professionale, documenti verificati, home staging, video e Open Domus compresi nel metodo.",
  alternates: { canonical: "/vendi" },
  openGraph: {
    title: "Vendere casa a Tradate: valutazione gratuita",
    description:
    "Nessun costo anticipato, si paga solo a vendita conclusa. Valutazione professionale, documenti verificati, home staging, video e Open Domus compresi nel metodo.",
  },
};

export default function VendiPage() {
  return (
    <>
      {/* Briciolo di pane: è ciò che Google mostra al posto dell'URL nudo nei
          risultati. Costruito da breadcrumbJsonLd (site.ts), non ricopiato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(BREADCRUMB_NAME, BREADCRUMB_PATH)) }}
      />
      <Header />
      <VendiContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
