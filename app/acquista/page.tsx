import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { getVisibleListings } from "../lib/listings";
import { toGridProperty } from "../lib/properties";
import AcquistaContent from "./AcquistaContent";
import { breadcrumbJsonLd, jsonLdScript } from "../lib/site";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Case in vendita";
const BREADCRUMB_PATH = "/acquista";

export const metadata: Metadata = {
  title: "Case in vendita a Tradate e provincia di Varese",
  description:
    "Appartamenti, ville, attici e immobili commerciali a Tradate, Venegono, Gornate Olona e Mozzate. Documenti verificati prima della visita, assistenza fino al rogito.",
  alternates: { canonical: "/acquista" },
  openGraph: {
    title: "Case in vendita a Tradate e provincia di Varese",
    description:
    "Appartamenti, ville, attici e immobili commerciali a Tradate, Venegono, Gornate Olona e Mozzate. Documenti verificati prima della visita, assistenza fino al rogito.",
  },
};

export default async function AcquistaPage() {
  // Alla griglia servono i dati della scheda, non il testo lungo né la galleria: quello che
  // non si passa non viene serializzato nell'HTML (vedi toGridProperty).
  const listings = (await getVisibleListings()).map(toGridProperty);
  return (
    <>
      {/* Briciolo di pane: è ciò che Google mostra al posto dell'URL nudo nei
          risultati. Costruito da breadcrumbJsonLd (site.ts), non ricopiato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(BREADCRUMB_NAME, BREADCRUMB_PATH)) }}
      />
      <Header />
      <AcquistaContent listings={listings} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
