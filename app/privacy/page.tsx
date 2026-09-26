import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PrivacyContent from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sul trattamento dei dati personali di Domus Tua srl ai sensi del Regolamento UE 2016/679 (GDPR).",
  // Testo placeholder non ancora validato da legale/DPO: escluso dall'indicizzazione
  // finché non sarà finalizzato. I link restano seguibili.
  robots: { index: false, follow: true },
};

// ⚠️ ATTENZIONE: testo placeholder redatto per finalità di impaginazione.
// PRIMA DELLA PUBBLICAZIONE deve essere verificato e validato da un legale /
// DPO, in particolare finalità, basi giuridiche e tempi di conservazione.

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <PrivacyContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
