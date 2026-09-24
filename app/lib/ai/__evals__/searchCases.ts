// Casi d'oro della ricerca in linguaggio naturale: frase → filtri attesi.
//
// Una sola batteria, due consumatori:
//  • `scripts/test-parser.ts` — parser locale, deterministico, dentro `npm test`;
//  • `scripts/eval-search.ts` — percorso AI col provider vero (`npm run eval:search`).
//
// Perché condivisi: il parser locale è il FALLBACK del percorso AI. Misurarli sugli stessi
// casi è l'unico modo di rispondere alla domanda che conta davvero — l'AI fa meglio di ciò
// che sostituisce? — invece di sapere solo che "funziona".
//
// ⚠️ Le attese descrivono il contratto del parser locale. Un modello può divergere ed avere
// comunque ragione: il report dell'eval AI mostra le differenze, non le nasconde dietro
// una percentuale.

import type { ParsedSearch, SearchFacets } from "../types";

export const FACETS: SearchFacets = {
  comuni: [
    "Tutti", "Tradate", "Varese", "Venegono Inferiore", "Venegono Superiore",
    "Mozzate", "Samarate", "Solbiate Arno", "Gorla Minore", "Cislago",
    "Lonate Ceppino", "Castellanza", "Busto Arsizio", "Como",
  ],
  types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
  featureLabels: ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"],
};

export type Expect = Partial<Pick<ParsedSearch, "contract" | "type" | "comune" | "minBudget" | "maxBudget" | "minRooms" | "minSqm" | "maxSqm">> & {
  features?: string[]; // set esatto atteso (ordinato)
  notFeatures?: string[]; // feature che NON devono comparire (negazione)
};

export const CASI: { q: string; e: Expect }[] = [
  // ── Budget: direzione min/max/range, formati ──────────────────────────────
  { q: "trilocale vicino a tradate sopra i 300000", e: { type: "Appartamento", comune: "Tradate", minRooms: 3, minBudget: 300000 } },
  { q: "trilocale a tradate sotto 250.000", e: { type: "Appartamento", comune: "Tradate", minRooms: 3, maxBudget: 250000 } },
  { q: "casa oltre 400 mila a varese", e: { comune: "Varese", minBudget: 400000 } },
  { q: "villa tra 300000 e 500000", e: { type: "Villa", minBudget: 300000, maxBudget: 500000 } },
  { q: "villa da 300000 a 500000", e: { type: "Villa", minBudget: 300000, maxBudget: 500000 } },
  { q: "bilocale a 250000", e: { type: "Appartamento", minRooms: 2, maxBudget: 250000 } },
  { q: "appartamento almeno 200k", e: { type: "Appartamento", minBudget: 200000 } },
  { q: "attico fino a 1,2 milioni", e: { type: "Attico", maxBudget: 1200000 } },
  { q: "casa sopra mezzo milione", e: { minBudget: 500000 } },
  { q: "trilocale non oltre 300000", e: { type: "Appartamento", minRooms: 3, maxBudget: 300000 } },
  { q: "budget massimo 350mila", e: { maxBudget: 350000 } },
  { q: "prezzo €280.000", e: { maxBudget: 280000 } },
  { q: "casa da 200.000 a 350.000 euro", e: { minBudget: 200000, maxBudget: 350000 } },
  { q: "villa entro 800k con giardino", e: { type: "Villa", maxBudget: 800000, features: ["Giardino"] } },

  // ── Superficie (m²): nuovo asse ───────────────────────────────────────────
  { q: "appartamento almeno 100 mq a tradate", e: { type: "Appartamento", comune: "Tradate", minSqm: 100 } },
  { q: "trilocale di 90 mq", e: { type: "Appartamento", minRooms: 3, minSqm: 90 } },
  { q: "villa da 200 mq", e: { type: "Villa", minSqm: 200 } },
  { q: "casa fino a 120 mq", e: { maxSqm: 120 } },
  { q: "appartamento tra 80 e 110 mq", e: { type: "Appartamento", minSqm: 80, maxSqm: 110 } },
  { q: "150 metri quadri a mozzate", e: { comune: "Mozzate", minSqm: 150 } },
  { q: "apartment at least 100 sqm", e: { type: "Appartamento", minSqm: 100 } },
  // superficie e prezzo insieme non si confondono
  { q: "trilocale 90 mq sotto 250000", e: { type: "Appartamento", minRooms: 3, minSqm: 90, maxBudget: 250000 } },

  // ── Locali ────────────────────────────────────────────────────────────────
  { q: "monolocale in affitto", e: { type: "Appartamento", contract: "Affitto", minRooms: 1 } },
  { q: "quadrilocale con doppi servizi e posto auto", e: { type: "Appartamento", minRooms: 4, features: ["Box / posto auto", "Doppi servizi"] } },
  { q: "attico 3 locali con terrazzo", e: { type: "Attico", minRooms: 3, features: ["Terrazzo"] } },
  { q: "casa con almeno 4 vani", e: { minRooms: 4 } },
  { q: "appartamento 3 camere", e: { type: "Appartamento", minRooms: 3 } },
  { q: "trilocale", e: { type: "Appartamento", minRooms: 3 } },
  { q: "casa con 3+ locali", e: { minRooms: 3 } },
  { q: "cinque locali a varese", e: { comune: "Varese", minRooms: 5 } },

  // ── Tipologia ───────────────────────────────────────────────────────────
  { q: "cerco casa a tradate", e: { comune: "Tradate", type: undefined } }, // "casa" generico NON forza Villa
  { q: "villetta a schiera con giardino", e: { type: "Villa", features: ["Giardino"] } },
  { q: "casa indipendente a cislago", e: { type: "Villa", comune: "Cislago" } },
  { q: "rustico da ristrutturare", e: { type: "Villa" } },
  { q: "negozio in affitto a busto arsizio", e: { type: "Commerciale", contract: "Affitto", comune: "Busto Arsizio" } },
  { q: "capannone industriale", e: { type: "Commerciale" } },
  { q: "ufficio 4 locali", e: { type: "Commerciale", minRooms: 4 } },
  { q: "terreno edificabile a samarate", e: { type: "Terreno", comune: "Samarate" } },
  { q: "attico con terrazzo panoramico", e: { type: "Attico", features: ["Terrazzo"] } },
  { q: "loft open space", e: { type: "Appartamento" } },
  { q: "monolocale", e: { type: "Appartamento", minRooms: 1 } },

  // ── Contratto ──────────────────────────────────────────────────────────────
  { q: "vendesi trilocale a gorla minore", e: { contract: "Vendita", type: "Appartamento", minRooms: 3, comune: "Gorla Minore" } },
  { q: "affittasi bilocale", e: { contract: "Affitto", type: "Appartamento", minRooms: 2 } },
  { q: "compro casa con giardino", e: { contract: "Vendita", features: ["Giardino"] } },
  { q: "cerco in affitto un appartamento", e: { contract: "Affitto", type: "Appartamento" } },

  // ── Comune: preposizioni, accenti, falsi positivi ──────────────────────────
  { q: "appartamento comodo al centro", e: { type: "Appartamento", comune: undefined } }, // "comodo" != Como
  { q: "zona venegono inferiore", e: { comune: "Venegono Inferiore" } },
  { q: "casa nei pressi di lonate ceppino", e: { comune: "Lonate Ceppino" } },
  { q: "villa a como", e: { type: "Villa", comune: "Como" } },
  { q: "trilocale luminoso a solbiate arno con box", e: { type: "Appartamento", minRooms: 3, comune: "Solbiate Arno", features: ["Box / posto auto"] } },

  // ── Negazione (feature che NON devono comparire) ───────────────────────────
  { q: "trilocale senza giardino", e: { type: "Appartamento", minRooms: 3, notFeatures: ["Giardino"] } },
  { q: "bilocale senza box ma con terrazzo", e: { type: "Appartamento", minRooms: 2, features: ["Terrazzo"], notFeatures: ["Box / posto auto"] } },
  { q: "appartamento no garage", e: { type: "Appartamento", notFeatures: ["Box / posto auto"] } },
  { q: "villa without garden with terrace", e: { type: "Villa", features: ["Terrazzo"], notFeatures: ["Giardino"] } },

  // ── Multilingua ────────────────────────────────────────────────────────────
  { q: "two bedroom apartment with garden in tradate under 250k", e: { type: "Appartamento", comune: "Tradate", minRooms: 2, maxBudget: 250000, features: ["Giardino"] } },
  { q: "villa with pool near varese over 400000", e: { type: "Villa", comune: "Varese", minBudget: 400000 } },
  { q: "appartement avec jardin à tradate", e: { type: "Appartamento", comune: "Tradate", features: ["Giardino"] } },
  { q: "wohnung mit garten bis 300.000", e: { type: "Appartamento", maxBudget: 300000, features: ["Giardino"] } },
  { q: "piso con terraza en varese", e: { type: "Appartamento", comune: "Varese", features: ["Terrazzo"] } },

  // ── Combinati / stress ──────────────────────────────────────────────────────
  { q: "villa 4 locali con giardino e box a tradate tra 400000 e 600000", e: { type: "Villa", comune: "Tradate", minRooms: 4, minBudget: 400000, maxBudget: 600000, features: ["Box / posto auto", "Giardino"] } },
  { q: "attico ristrutturato almeno 120 mq con terrazzo a varese sopra 350000", e: { type: "Attico", comune: "Varese", minSqm: 120, minBudget: 350000, features: ["Terrazzo"] } },

  // ── Red-team: range con unità condivisa, trattino, idiomi, negazione multi-parola, multilingua ──
  { q: "da 200 a 300 mila", e: { minBudget: 200000, maxBudget: 300000 } },
  { q: "tra 300 e 500 mila a mozzate", e: { comune: "Mozzate", minBudget: 300000, maxBudget: 500000 } },
  { q: "trilocale a varese 300.000 - 400.000", e: { type: "Appartamento", comune: "Varese", minRooms: 3, minBudget: 300000, maxBudget: 400000 } },
  { q: "casa da 250000 in su", e: { minBudget: 250000, maxBudget: undefined, type: undefined } },
  { q: "appartamento non oltre 280.000", e: { type: "Appartamento", maxBudget: 280000, minBudget: undefined } },
  { q: "trilocale sui 250mila a tradate", e: { type: "Appartamento", comune: "Tradate", minRooms: 3, maxBudget: 250000 } },
  { q: "casa 1,3 milioni con giardino", e: { maxBudget: 1300000, features: ["Giardino"], type: undefined } },
  { q: "spendo massimo 250 mila euro", e: { maxBudget: 250000 } },
  { q: "casa 90mq 250000", e: { minSqm: 90, maxBudget: 250000 } },
  { q: "villa 200 mq giardino 450000", e: { type: "Villa", minSqm: 200, maxBudget: 450000, features: ["Giardino"] } },
  { q: "trilocale tra 80 e 120 mq entro 300k a varese", e: { type: "Appartamento", comune: "Varese", minRooms: 3, minSqm: 80, maxSqm: 120, maxBudget: 300000 } },
  { q: "quadrilocale con 3 camere e doppi servizi", e: { type: "Appartamento", minRooms: 4, features: ["Doppi servizi"] } },
  { q: "5 vani a gorla minore", e: { comune: "Gorla Minore", minRooms: 5 } },
  { q: "apartamento con dos habitaciones en samarate", e: { type: "Appartamento", comune: "Samarate", minRooms: 2 } },
  { q: "bilocale trasformabile in trilocale", e: { minRooms: 2 } }, // l'immobile È un bilocale: min 2 (sicuro, include i trilocali)
  { q: "trilocale senza giardino condominiale e box auto", e: { type: "Appartamento", minRooms: 3, notFeatures: ["Giardino", "Box / posto auto"] } },
  { q: "trilocale senza giardino né terrazzo né box", e: { type: "Appartamento", minRooms: 3, notFeatures: ["Giardino", "Terrazzo", "Box / posto auto"] } },
  { q: "piso sin jardin pero con terraza y garaje", e: { type: "Appartamento", features: ["Terrazzo", "Box / posto auto"], notFeatures: ["Giardino"] } },
  { q: "box no, terrazzo sì", e: { features: ["Terrazzo"], notFeatures: ["Box / posto auto"] } },
  { q: "maison avec jardin à partir de 400000", e: { minBudget: 400000, maxBudget: undefined, features: ["Giardino"] } },
];

/** Confronto insiemistico, ordine irrilevante. */
export function arrEq(a: string[] | undefined, b: string[]): boolean {
  const x = [...(a ?? [])].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

export interface Esito {
  /** Differenze rispetto al caso d'oro, in forma leggibile. */
  errori: string[];
  /**
   * Filtri che il caso d'oro dice di NON produrre e che invece compaiono: feature negate
   * dalla frase ("senza giardino") o campi attesi assenti.
   *
   * Separati dal resto perché sono l'unico difetto che fa danno visibile: un filtro
   * inventato TOGLIE immobili buoni dai risultati, e l'utente non vede nulla di sbagliato —
   * vede solo meno case. Un campo mancante, al confronto, allarga soltanto la ricerca.
   */
  inventati: string[];
}

/** Verifica un risultato contro il caso d'oro. Non lancia: descrive. */
export function verifica(risultato: ParsedSearch, atteso: Expect): Esito {
  const errori: string[] = [];
  const inventati: string[] = [];

  for (const chiave of Object.keys(atteso) as (keyof Expect)[]) {
    if (chiave === "features") {
      if (!arrEq(risultato.features, atteso.features!)) {
        errori.push(
          `features=${JSON.stringify(risultato.features)} atteso ${JSON.stringify(atteso.features)}`,
        );
      }
      continue;
    }
    if (chiave === "notFeatures") {
      const presenti = (atteso.notFeatures ?? []).filter((f) =>
        (risultato.features ?? []).includes(f as never),
      );
      if (presenti.length) {
        const messaggio = `feature negata presente: ${JSON.stringify(presenti)}`;
        errori.push(messaggio);
        inventati.push(messaggio);
      }
      continue;
    }
    const ottenuto = (risultato as Record<string, unknown>)[chiave];
    const voluto = (atteso as Record<string, unknown>)[chiave];
    if (ottenuto === voluto) continue;
    const messaggio = `${chiave}=${JSON.stringify(ottenuto)} atteso ${JSON.stringify(voluto)}`;
    errori.push(messaggio);
    // Atteso assente e invece valorizzato: filtro inventato, non solo impreciso.
    if (voluto === undefined && ottenuto !== undefined) inventati.push(messaggio);
  }

  return { errori, inventati };
}

/**
 * Casi che il parser locale NON può risolvere per costruzione: abbreviazioni colloquiali,
 * diminutivi, nomi di comune accorciati, importi senza unità. Le regex lavorano su confini
 * di parola e su una soglia di prezzo fissa — "trilo", "appartamentino", "Busto", "sui 600"
 * le passano attraverso.
 *
 * Non stanno in CASI perché `npm run test:parser` fallirebbe di proposito. Servono a
 * misurare la cosa che i casi d'oro, scritti sul contratto del fallback, non possono
 * mostrare: **quanto vale davvero il percorso AI**. Senza questi, un'eval che dice
 * "81/81 come il parser locale" suggerisce che la chiave non serva a niente.
 */
export const CASI_COLLOQUIALI: { q: string; e: Expect }[] = [
  { q: "un appartamentino a varese", e: { type: "Appartamento", comune: "Varese" } },
  { q: "un trilo a tradate", e: { type: "Appartamento", comune: "Tradate", minRooms: 3 } },
  { q: "bilo con terrazzino a como", e: { type: "Appartamento", comune: "Como", minRooms: 2, features: ["Terrazzo"] } },
  { q: "negozio in centro a busto", e: { type: "Commerciale", comune: "Busto Arsizio" } },
  { q: "cerco una casetta indipendente a mozzate", e: { type: "Villa", comune: "Mozzate" } },
  { q: "villa a tradate, spendo sui 600", e: { type: "Villa", comune: "Tradate", maxBudget: 600000 } },
];
