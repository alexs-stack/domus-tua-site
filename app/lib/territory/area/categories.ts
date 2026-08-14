// Ordine canonico ed etichette delle categorie di fatti d'area (Prompt 9).

import type { AreaFactCategory } from "./types";

/** Ordine di presentazione stabile delle categorie. */
export const AREA_CATEGORY_ORDER: readonly AreaFactCategory[] = [
  "transport",
  "regional-connection",
  "municipal-service",
  "healthcare",
  "school",
  "park-facility",
  "market-event",
];

/** Etichette italiane (per l'assistente e un'eventuale sezione). */
export const AREA_CATEGORY_LABEL_IT: Record<AreaFactCategory, string> = {
  transport: "Trasporti",
  "regional-connection": "Collegamenti regionali",
  "municipal-service": "Servizi comunali",
  healthcare: "Sanità",
  school: "Scuole",
  "park-facility": "Parchi e strutture pubbliche",
  "market-event": "Mercati ed eventi",
};
