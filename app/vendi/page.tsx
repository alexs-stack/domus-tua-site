import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import VendiContent from "./VendiContent";

export const metadata: Metadata = {
  title: "Vendere casa a Tradate, senza stress",
  description:
    "Vendi casa con il metodo Domus Tua: valutazione professionale, documenti verificati, home staging, rendering, marketing e Open Domus, con assistenza fino al rogito.",
  alternates: { canonical: "/vendi" },
  openGraph: {
    title: "Vendere casa a Tradate, senza stress",
    description:
      "Vendi casa con il metodo Domus Tua: valutazione professionale, documenti verificati, home staging, rendering, marketing e Open Domus, con assistenza fino al rogito.",
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default function VendiPage() {
  return (
    <>
      <Header />
      <VendiContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
