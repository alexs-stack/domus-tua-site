import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import CaseContent from "./CaseContent";
import { getVisibleListings } from "../lib/listings";

export const metadata: Metadata = {
  title: "Case in vendita a Tradate e provincia",
  description:
    "Le case selezionate da Domus Tua: appartamenti, attici e ville a Tradate e in provincia di Varese. Immobili raccontati con cura, documenti verificati.",
  alternates: { canonical: "/case" },
  openGraph: {
    title: "Case in vendita a Tradate e provincia",
    description:
      "Le case selezionate da Domus Tua: appartamenti, attici e ville a Tradate e in provincia di Varese. Immobili raccontati con cura, documenti verificati.",
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default async function CasePage() {
  const listings = await getVisibleListings();
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
