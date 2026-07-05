import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import ServiziContent from "./ServiziContent";

export const metadata: Metadata = {
  title: "Servizi immobiliari, oltre l'annuncio",
  description:
    "I servizi Domus Tua: valutazione, servizi tecnici e legali, rendering e virtual rendering, home staging, emotional video, marketing e Open Domus. Valorizziamo, proteggiamo e raccontiamo la tua casa.",
  alternates: { canonical: "/servizi" },
  openGraph: {
    title: "Servizi immobiliari, oltre l'annuncio",
    description:
      "I servizi Domus Tua: valutazione, servizi tecnici e legali, rendering e virtual rendering, home staging, emotional video, marketing e Open Domus. Valorizziamo, proteggiamo e raccontiamo la tua casa.",
  },
};

export default function ServiziPage() {
  return (
    <>
      <Header />
      <ServiziContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
