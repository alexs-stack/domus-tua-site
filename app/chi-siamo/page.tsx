import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { site } from "../lib/site";
import ChiSiamoContent from "./ChiSiamoContent";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "Dal 2007 a Tradate, Domus Tua è l'agenzia immobiliare indipendente nata dalla visione di Raffaela Rizza. Professionalità, innovazione e integrità al servizio delle persone.",
};

export default function ChiSiamoPage() {
  return (
    <>
      <Header />
      <ChiSiamoContent since={site.since} />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
