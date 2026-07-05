// Suite di regressione del parser locale (ricerca in linguaggio naturale, keyless).
// Esegui:  npx tsx scripts/test-parser.ts
// Esce con codice 1 se un caso fallisce (adatto a una gate di CI).

import { parseQueryLocal } from "../app/lib/ai/parseQuery";
import type { ParsedSearch, SearchFacets } from "../app/lib/ai/types";

const facets: SearchFacets = {
  comuni: [
    "Tutti", "Tradate", "Varese", "Venegono Inferiore", "Venegono Superiore",
    "Mozzate", "Samarate", "Solbiate Arno", "Gorla Minore", "Cislago",
    "Lonate Ceppino", "Castellanza", "Busto Arsizio", "Como",
  ],
  types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
  featureLabels: ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"],
};

type Expect = Partial<Pick<ParsedSearch, "contract" | "type" | "comune" | "minBudget" | "maxBudget" | "minRooms" | "minSqm" | "maxSqm">> & {
  features?: string[]; // set esatto atteso (ordinato)
  notFeatures?: string[]; // feature che NON devono comparire (negazione)
};

const CASES: { q: string; e: Expect }[] = [
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

function arrEq(a: string[] | undefined, b: string[]): boolean {
  const x = [...(a ?? [])].sort();
  const y = [...b].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

let pass = 0;
const failures: string[] = [];

for (const { q, e } of CASES) {
  const r = parseQueryLocal(q, facets);
  const errs: string[] = [];
  const check = (k: keyof Expect) => {
    if (!(k in e)) return;
    if (k === "features") {
      if (!arrEq(r.features, e.features!)) errs.push(`features=${JSON.stringify(r.features)} atteso ${JSON.stringify(e.features)}`);
    } else if (k === "notFeatures") {
      const present = (e.notFeatures ?? []).filter((f) => (r.features ?? []).includes(f as never));
      if (present.length) errs.push(`feature negata presente: ${JSON.stringify(present)}`);
    } else {
      const got = (r as Record<string, unknown>)[k];
      const want = (e as Record<string, unknown>)[k];
      if (got !== want) errs.push(`${k}=${JSON.stringify(got)} atteso ${JSON.stringify(want)}`);
    }
  };
  (Object.keys(e) as (keyof Expect)[]).forEach(check);
  if (errs.length) failures.push(`✗ "${q}"\n    ${errs.join("\n    ")}`);
  else pass++;
}

console.log(`\nParser test: ${pass}/${CASES.length} passati.`);
if (failures.length) {
  console.log(`\n${failures.length} falliti:\n`);
  console.log(failures.join("\n\n"));
  process.exit(1);
}
console.log("Tutti i casi passano. ✓\n");
