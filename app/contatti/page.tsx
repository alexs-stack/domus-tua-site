import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import Contact from "../components/Contact";
import ContattiContent from "./ContattiContent";
import { site } from "../lib/site";

// Recapiti e orari derivati da app/lib/site.ts: erano l'unica copia fuori dalla fonte
// unica, quindi si sarebbero disallineati in silenzio (ed è esattamente quello che era
// successo con l'orario pomeridiano, 15:00 qui contro 14:30 ovunque).
//
// Il title porta l'indirizzo: per una ricerca locale "dove sono" è l'informazione che
// decide il clic, e "Contatti" da solo non la dava.
const title = `Contatti — Domus Tua, ${site.address.street}, ${site.address.locality} (${site.address.region})`;

const description =
  `Telefono ${site.phone.label}, WhatsApp ${site.whatsapp.label}, ${site.email.label}. ` +
  `Aperti lunedì–venerdì ${site.hours.weekdays}, sabato ${site.hours.saturday}.`;

export const metadata: Metadata = {
  // §6.8: assoluto — il title porta già «Domus Tua» insieme all'indirizzo.
  title: { absolute: title },
  description,
  alternates: { canonical: "/contatti" },
  openGraph: {
    title,
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
