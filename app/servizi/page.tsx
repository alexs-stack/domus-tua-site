import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import ServiziContent from "./ServiziContent";

export const metadata: Metadata = {
  title: "Home staging, rendering e video per vendere casa",
  description:
    "Home staging, rendering e virtual rendering, video emozionali, campagne marketing e servizi tecnico-legali. Tutto compreso nel mandato di vendita.",
  alternates: { canonical: "/servizi" },
  openGraph: {
    title: "Home staging, rendering e video per vendere casa",
    description:
    "Home staging, rendering e virtual rendering, video emozionali, campagne marketing e servizi tecnico-legali. Tutto compreso nel mandato di vendita.",
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
