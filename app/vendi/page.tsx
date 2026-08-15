import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import VendiContent from "./VendiContent";

export const metadata: Metadata = {
  title: "Vendere casa a Tradate: valutazione gratuita",
  description:
    "Nessun costo anticipato, si paga solo a vendita conclusa. Valutazione professionale, documenti verificati, home staging, video e Open Domus compresi nel metodo.",
  alternates: { canonical: "/vendi" },
  openGraph: {
    title: "Vendere casa a Tradate: valutazione gratuita",
    description:
    "Nessun costo anticipato, si paga solo a vendita conclusa. Valutazione professionale, documenti verificati, home staging, video e Open Domus compresi nel metodo.",
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
