import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import Contact from "../components/Contact";
import ContattiContent from "./ContattiContent";
import { site } from "../lib/site";

// Testo identico a prima, ma numeri e indirizzo derivati da app/lib/site.ts: erano l'unica
// copia dei recapiti fuori dalla fonte unica, quindi si sarebbero disallineati in silenzio.
const description =
  `Domus Tua Immobiliare, ${site.address.street}, Tradate (VA). ` +
  `Telefono ${site.phone.label}, WhatsApp ${site.whatsapp.label}. ` +
  `Scrivici per una valutazione o per cercare casa.`;

export const metadata: Metadata = {
  title: "Contatti",
  description,
  alternates: { canonical: "/contatti" },
  openGraph: {
    title: "Contatti",
    description,
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
