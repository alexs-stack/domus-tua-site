import type { Metadata } from "next";
import MetodoContent from "./MetodoContent";
import { breadcrumbJsonLd, jsonLdScript } from "../lib/site";

/** Voce del briciolo di pane per questa pagina (voce 26 della checklist). */
const BREADCRUMB_NAME = "Il Metodo Domus Tua";
const BREADCRUMB_PATH = "/metodo";

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
  return (
    <>
      {/* Briciolo di pane: è ciò che Google mostra al posto dell'URL nudo nei
          risultati. Costruito da breadcrumbJsonLd (site.ts), non ricopiato. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(BREADCRUMB_NAME, BREADCRUMB_PATH)) }}
      />
      <MetodoContent />
    </>
  );
}
