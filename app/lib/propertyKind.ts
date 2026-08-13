// Classificazione semantica dell'immobile — un posto solo per la domanda
// «questo è una casa, un negozio o un terreno?», e per «quali numeri hanno
// senso mostrare».
//
// Il gestionale RealSmart dà una tipologia (`Property["type"]`) già raccolta in
// cinque bucket dal mapper (app/lib/realsmart/toProperty.ts). Da lì derivano
// due cose che prima erano sparse e implicite nei componenti:
//   1. la CATEGORIA — residenziale / commerciale / terreno;
//   2. quali FATTI-numero sono pertinenti a quella categoria.
//
// «Camere» e «bagni» sono concetti residenziali: su un negozio o un terreno non
// vanno mostrati, anche se il feed per rumore li riportasse. «Locali» (vani) ha
// senso su un commerciale ma non su un terreno. La superficie vale ovunque.
// Questo evita che una card commerciale si descriva come una casa — con la CTA
// «Scopri la casa» o con «3 camere» su un capannone.

import type { Property } from "./properties";

export type PropertyCategory = "residential" | "commercial" | "land";

/** Da tipologia a categoria semantica. Difensiva: una tipologia inattesa
    ricade sul residenziale (il caso dominante di un'agenzia residenziale) —
    ma le tipologie non residenziali note sono già intercettate dal mapper. */
export function propertyCategory(type: Property["type"]): PropertyCategory {
  switch (type) {
    case "Commerciale":
      return "commercial";
    case "Terreno":
      return "land";
    case "Appartamento":
    case "Attico":
    case "Villa":
      return "residential";
    default:
      return "residential";
  }
}

/** Vero solo per gli immobili abitativi: decide la CTA con «casa» invece di
    quella neutra con «immobile». */
export function isResidential(type: Property["type"]): boolean {
  return propertyCategory(type) === "residential";
}

/** I quattro numeri sintetici che card, anteprima e striscia possono mostrare. */
export type CoreFactKey = "sqm" | "rooms" | "beds" | "baths";

// Quali fatti sono PERTINENTI a ciascuna categoria. La superficie vale sempre;
// i locali reggono su un commerciale ma non su un terreno; camere e bagni sono
// residenziali e basta.
const RELEVANT: Record<PropertyCategory, ReadonlySet<CoreFactKey>> = {
  residential: new Set<CoreFactKey>(["sqm", "rooms", "beds", "baths"]),
  commercial: new Set<CoreFactKey>(["sqm", "rooms"]),
  land: new Set<CoreFactKey>(["sqm"]),
};

/** Il fatto è pertinente alla categoria dell'immobile? */
export function factApplies(type: Property["type"], key: CoreFactKey): boolean {
  return RELEVANT[propertyCategory(type)].has(key);
}

export type CoreFact = { key: CoreFactKey; value: string };

/** I fatti-numero da rendere: pertinenti alla categoria E davvero presenti nel
    dato ("—" = assente). Ordine stabile (superficie, locali, camere, bagni).
    Card, CaseQuickLook e la striscia della scheda passano tutte da qui, così la
    stessa regola non si riscrive tre volte con tre esiti che divergono. */
export function coreFacts(
  p: Pick<Property, "type" | "sqm" | "rooms" | "beds" | "baths">
): CoreFact[] {
  const all: CoreFact[] = [
    { key: "sqm", value: p.sqm },
    { key: "rooms", value: p.rooms },
    { key: "beds", value: p.beds },
    { key: "baths", value: p.baths },
  ];
  return all.filter((f) => f.value !== "" && f.value !== "—" && factApplies(p.type, f.key));
}
