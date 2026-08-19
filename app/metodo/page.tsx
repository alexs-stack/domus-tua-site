import type { Metadata } from "next";
import MetodoContent from "./MetodoContent";

export const metadata: Metadata = {
  // §6.8: assoluto perché il title porta già il marchio — col suffisso del template
  // «Domus Tua» si leggerebbe due volte, e la seconda finirebbe troncata nei risultati.
  title: { absolute: "Il Metodo Domus Tua: come vendiamo casa, passo per passo" },
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
