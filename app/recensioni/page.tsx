import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import RecensioniContent from "./RecensioniContent";

export const metadata: Metadata = {
  title: "Recensioni Domus Tua: 531 clienti raccontano",
  description:
    "Leggi e guarda le recensioni di chi ha venduto o acquistato casa con Domus Tua a Tradate e in provincia di Varese. Media 4,9/5 su Google.",
  alternates: { canonical: "/recensioni" },
  openGraph: {
    title: "Recensioni Domus Tua: 531 clienti raccontano",
    description:
    "Leggi e guarda le recensioni di chi ha venduto o acquistato casa con Domus Tua a Tradate e in provincia di Varese. Media 4,9/5 su Google.",
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
