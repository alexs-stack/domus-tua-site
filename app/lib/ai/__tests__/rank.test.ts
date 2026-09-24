// Il ranking della ricerca: ordina, ma non deve MAI essere il motivo per cui non ci sono
// risultati.
//
// Il caso che ha reso necessaria questa suite (2026-08-06): il ramo semantico chiama
// `getListingVectors`, avvolta in `unstable_cache`, che LANCIA fuori da un contesto di
// richiesta Next. Finché non esisteva un provider di embeddings quel ramo non veniva mai
// eseguito e nessuno se ne accorgeva; dal momento in cui gli embeddings sono diventati
// disponibili (Gemini, con la chiave già configurata), ogni chiamata fuori da una request
// faceva fallire l'INTERA ricerca invece del solo ordinamento.
//
// I test girano proprio fuori da un contesto Next, quindi esercitano quella condizione senza
// doverla simulare: è la stessa ragione per cui il bug non si vedeva prima.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyFilters, rankResults } from "../rank";
import type { Property } from "../../properties";

function casa(slug: string, title: string, zone: string, extra: Partial<Property> = {}): Property {
  return {
    slug,
    title,
    zone,
    type: "Villa",
    price: "€ 300.000",
    excerpt: "",
    features: [],
    ...extra,
  } as Property;
}

const CANDIDATI = [
  casa("villa-giardino", "Villa con ampio giardino", "Tradate (VA)"),
  casa("bilocale-centro", "Bilocale in centro", "Varese (VA)"),
  casa("villa-piscina", "Villa con piscina e giardino", "Tradate (VA)"),
];

describe("rankResults — l'ordinamento non può far cadere la ricerca", () => {
  it("restituisce tutti i candidati anche quando il livello semantico non è disponibile", async () => {
    // Con un provider di embeddings configurato questa chiamata passa dal ramo semantico e
    // incontra l'invariante di unstable_cache; senza, va diritta alle parole chiave. In
    // entrambi i casi il contratto è lo stesso, ed è questo il punto.
    const { slugs } = await rankResults(CANDIDATI, {
      semanticQuery: "casa con giardino",
      keywords: ["giardino"],
    } as never);

    assert.equal(slugs.length, CANDIDATI.length, "il ranking ha perso dei candidati");
    assert.deepEqual(
      [...slugs].sort(),
      CANDIDATI.map((c) => c.slug).sort(),
      "il ranking ha cambiato l'insieme dei risultati, non solo l'ordine",
    );
  });

  it("non lancia mai, qualunque sia la query", async () => {
    for (const parsed of [
      { semanticQuery: "casa con giardino", keywords: ["giardino"] },
      { semanticQuery: "", keywords: [] },
      { keywords: ["villa", "piscina"] },
      { semanticQuery: "qualcosa di molto specifico che non esiste" },
    ]) {
      await assert.doesNotReject(() => rankResults(CANDIDATI, parsed as never));
    }
  });

  it("un solo candidato non ha bisogno di essere ordinato", async () => {
    const { slugs, semantic } = await rankResults([CANDIDATI[0]], {
      semanticQuery: "giardino",
    } as never);
    assert.deepEqual(slugs, ["villa-giardino"]);
    assert.equal(semantic, false, "con un candidato solo il ramo semantico è spreco");
  });

  it("il ranking per parole chiave mette davanti chi le contiene", async () => {
    // Senza embeddings è questo il comportamento garantito, ed è il fallback di tutto il
    // resto: se si rompe, non c'è rete di sicurezza sotto.
    const { slugs } = await rankResults(CANDIDATI, { keywords: ["piscina"] } as never);
    assert.equal(slugs[0], "villa-piscina", `ordine inatteso: ${slugs.join(", ")}`);
  });

  it("applyFilters e rankResults lavorano sullo stesso insieme", async () => {
    const filtrati = applyFilters(CANDIDATI, { comune: "Tradate" } as never);
    const { slugs } = await rankResults(filtrati, { keywords: ["giardino"] } as never);
    assert.equal(slugs.length, filtrati.length);
  });
});
