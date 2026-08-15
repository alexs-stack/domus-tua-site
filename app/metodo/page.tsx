import type { Metadata } from "next";
import MetodoContent from "./MetodoContent";

export const metadata: Metadata = {
  title: "Il Metodo Domus Tua: come vendiamo casa, passo per passo",
  description:
    "Nove passaggi dalla prima stima alla firma: ascolto, valutazione, verifica documentale, preparazione, marketing, Open Domus, trattativa, rogito.",
  alternates: { canonical: "/metodo" },
  openGraph: {
    title: "Il Metodo Domus Tua: come vendiamo casa, passo per passo",
    description:
    "Nove passaggi dalla prima stima alla firma: ascolto, valutazione, verifica documentale, preparazione, marketing, Open Domus, trattativa, rogito.",
  },
};

export default function MetodoPage() {
  return <MetodoContent />;
}
