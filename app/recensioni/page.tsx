import type { Metadata } from "next";
import { ratingLabel, site } from "../lib/site";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import RecensioniContent from "./RecensioniContent";

export const metadata: Metadata = {
  // §6.8: assoluto — il marchio è già nel title (vedi /metodo).
  title: { absolute: `Recensioni Domus Tua: ${site.reviewsCount} clienti raccontano` },
  description:
    `Leggi e guarda le recensioni di chi ha venduto o acquistato casa con Domus Tua a Tradate e in provincia di Varese. Media ${ratingLabel("it")}/5 su Google.`,
  alternates: { canonical: "/recensioni" },
  openGraph: {
    title: `Recensioni Domus Tua: ${site.reviewsCount} clienti raccontano`,
    description:
    `Leggi e guarda le recensioni di chi ha venduto o acquistato casa con Domus Tua a Tradate e in provincia di Varese. Media ${ratingLabel("it")}/5 su Google.`,
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
