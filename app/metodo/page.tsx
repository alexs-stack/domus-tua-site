import type { Metadata } from "next";
import MetodoContent from "./MetodoContent";

export const metadata: Metadata = {
  title: "Il Metodo Domus Tua",
  description:
    "Il sistema proprietario Domus Tua: valutazione, documenti verificati, preparazione, marketing, Open Domus, trattativa e assistenza fino al rogito. Un percorso, non un annuncio.",
  alternates: { canonical: "/metodo" },
  openGraph: {
    title: "Il Metodo Domus Tua",
    description:
      "Il sistema proprietario Domus Tua: valutazione, documenti verificati, preparazione, marketing, Open Domus, trattativa e assistenza fino al rogito. Un percorso, non un annuncio.",
    images: ["/images/hero_01_attico_travi_salotto.jpg"],
  },
};

export default function MetodoPage() {
  return <MetodoContent />;
}
