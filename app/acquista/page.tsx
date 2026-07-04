import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { getVisibleListings } from "../lib/listings";
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
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default async function AcquistaPage() {
  const listings = await getVisibleListings();
  return (
    <>
      <Header />
      <AcquistaContent listings={listings} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
