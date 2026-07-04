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
  alternates: { canonical: "/chi-siamo" },
  openGraph: {
    title: "Chi siamo",
    description:
      "Dal 2007 a Tradate, Domus Tua è l'agenzia immobiliare indipendente nata dalla visione di Raffaela Rizza. Professionalità, innovazione e integrità al servizio delle persone.",
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
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
