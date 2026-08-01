import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import CaseContent from "./CaseContent";
import { getVisibleListings } from "../lib/listings";
import { toGridProperty } from "../lib/properties";

export const metadata: Metadata = {
  title: "Case in vendita a Tradate e provincia",
  description:
    "Le case selezionate da Domus Tua: appartamenti, attici e ville a Tradate e in provincia di Varese. Immobili raccontati con cura, documenti verificati.",
  alternates: { canonical: "/case" },
  openGraph: {
    title: "Case in vendita a Tradate e provincia",
    description:
      "Le case selezionate da Domus Tua: appartamenti, attici e ville a Tradate e in provincia di Varese. Immobili raccontati con cura, documenti verificati.",
  },
};

export default async function CasePage() {
  // Alla griglia servono i dati della scheda, non il testo lungo né la galleria: quello che
  // non si passa non viene serializzato nell'HTML (vedi toGridProperty).
  const listings = (await getVisibleListings()).map(toGridProperty);
  return (
    <>
      <Header />
      <main className="flex-1">
        <CaseContent properties={listings} />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
