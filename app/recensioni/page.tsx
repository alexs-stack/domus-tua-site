import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import RecensioniContent from "./RecensioniContent";

export const metadata: Metadata = {
  title: "Recensioni dei clienti",
  description:
    "Oltre 500 recensioni e una media di 4.9/5. Le storie di chi ha venduto e acquistato casa con Domus Tua: fiducia, cura e accompagnamento fino al rogito.",
  alternates: { canonical: "/recensioni" },
  openGraph: {
    title: "Recensioni dei clienti",
    description:
      "Oltre 500 recensioni e una media di 4.9/5. Le storie di chi ha venduto e acquistato casa con Domus Tua: fiducia, cura e accompagnamento fino al rogito.",
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default function RecensioniPage() {
  return (
    <>
      <Header />
      <RecensioniContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
