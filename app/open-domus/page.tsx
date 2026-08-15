import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import OpenDomusPageContent from "./OpenDomusPageContent";

export const metadata: Metadata = {
  title: "Open Domus: l'open house che non lascia nulla al caso",
  description:
    "Immobile preparato, documenti già disponibili, acquirenti prequalificati e visite per appuntamento. Il format esclusivo di Domus Tua a Tradate.",
  alternates: { canonical: "/open-domus" },
  openGraph: {
    title: "Open Domus: l'open house che non lascia nulla al caso",
    description:
    "Immobile preparato, documenti già disponibili, acquirenti prequalificati e visite per appuntamento. Il format esclusivo di Domus Tua a Tradate.",
  },
};

export default function OpenDomusPage() {
  return (
    <>
      <Header />
      <OpenDomusPageContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
