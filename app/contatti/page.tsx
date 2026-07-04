import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import Contact from "../components/Contact";
import ContattiContent from "./ContattiContent";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Domus Tua Immobiliare, Corso Bernacchi 91, Tradate (VA). Telefono 0331 844898, WhatsApp 346 6042314. Scrivici per una valutazione o per cercare casa.",
  alternates: { canonical: "/contatti" },
  openGraph: {
    title: "Contatti",
    description:
      "Domus Tua Immobiliare, Corso Bernacchi 91, Tradate (VA). Telefono 0331 844898, WhatsApp 346 6042314. Scrivici per una valutazione o per cercare casa.",
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default function ContattiPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-paper">
        <ContattiContent />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
