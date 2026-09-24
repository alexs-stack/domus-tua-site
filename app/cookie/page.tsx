import type { Metadata } from "next";
import CookieContent from "./CookieContent";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Come Domus Tua srl utilizza i cookie e le tecnologie simili sul proprio sito, e come gestire le tue preferenze.",
  // Testo placeholder non ancora validato da legale/DPO: escluso dall'indicizzazione
  // finché non sarà finalizzato. I link restano seguibili.
  robots: { index: false, follow: true },
};

// ⚠️ ATTENZIONE: testo placeholder redatto per finalità di impaginazione.
// PRIMA DELLA PUBBLICAZIONE deve essere verificato e validato da un legale /
// DPO, in coerenza con i cookie effettivamente installati dal sito e dalle
// piattaforme di terze parti (analytics, social, mappe).

export default function CookiePage() {
  return <CookieContent />;
}
