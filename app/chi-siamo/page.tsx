import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { site } from "../lib/site";
import ChiSiamoContent from "./ChiSiamoContent";

export const metadata: Metadata = {
  title: "Chi siamo — agenzia immobiliare a Tradate dal 2007",
  description:
    "Domus Tua nasce nel 2007 dalla visione di Raffaela Rizza: agenzia indipendente a guida femminile, tre anni consecutivi Top Agency Wikicasa.",
  alternates: { canonical: "/chi-siamo" },
  openGraph: {
    title: "Chi siamo — agenzia immobiliare a Tradate dal 2007",
    description:
    "Domus Tua nasce nel 2007 dalla visione di Raffaela Rizza: agenzia indipendente a guida femminile, tre anni consecutivi Top Agency Wikicasa.",
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
