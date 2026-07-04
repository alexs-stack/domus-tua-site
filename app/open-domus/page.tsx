import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import OpenDomusPageContent from "./OpenDomusPageContent";

export const metadata: Metadata = {
  title: "Open Domus, l'evento che vende meglio",
  description:
    "Open Domus è il format di visita evoluto di Domus Tua: immobile preparato, documenti disponibili, acquirenti prequalificati e visite organizzate. Più consapevolezza, proposte più rapide.",
  alternates: { canonical: "/open-domus" },
  openGraph: {
    title: "Open Domus, l'evento che vende meglio",
    description:
      "Open Domus è il format di visita evoluto di Domus Tua: immobile preparato, documenti disponibili, acquirenti prequalificati e visite organizzate. Più consapevolezza, proposte più rapide.",
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default function OpenDomusPage() {
  return (
    <>
      <Header />
      <OpenDomusPageContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
