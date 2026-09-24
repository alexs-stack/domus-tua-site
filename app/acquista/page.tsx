import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { getVisibleListings } from "../lib/listings";
import { toGridProperty } from "../lib/properties";
import AcquistaContent from "./AcquistaContent";

export const metadata: Metadata = {
  title: "Comprare casa a Tradate, con sicurezza",
  description:
    "Acquista casa con Domus Tua: ricerca mirata, informazioni chiare prima della visita, documentazione verificata e assistenza in ogni passaggio fino al rogito.",
  alternates: { canonical: "/acquista" },
  openGraph: {
    title: "Comprare casa a Tradate, con sicurezza",
    description:
      "Acquista casa con Domus Tua: ricerca mirata, informazioni chiare prima della visita, documentazione verificata e assistenza in ogni passaggio fino al rogito.",
  },
};

export default async function AcquistaPage() {
  // Alla griglia servono i dati della scheda, non il testo lungo né la galleria: quello che
  // non si passa non viene serializzato nell'HTML (vedi toGridProperty).
  const listings = (await getVisibleListings()).map(toGridProperty);
  return (
    <>
      <Header />
      <AcquistaContent listings={listings} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
