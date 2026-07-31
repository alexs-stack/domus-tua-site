// Test di INTEGRAZIONE sul feed RealSmart reale.
//
// Separato dal resto e OPT-IN: `REALSMART_INTEGRATION=1 npm test`. La CI resta deterministica
// e non diventa rossa perché l'agenzia ha venduto una casa o il gestionale è momentaneamente
// irraggiungibile.
//
// Non verifica QUALI immobili ci sono — sarebbe una fotografia destinata a scadere. Verifica
// che il feed regga ancora le ASSUNZIONI su cui è costruita la ricerca. Se una salta, la
// suite lo dice prima che se ne accorga un utente.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { XMLParser } from "fast-xml-parser";
import { parseRealSmartPayload } from "../../realsmart/parse";
import { normalizeRealSmartListing } from "../../realsmart/normalize";
import { buildAssistantListings } from "../listings";
import type { NormalizedProperty } from "../../realsmart/types";

const ENABLED = process.env.REALSMART_INTEGRATION === "1";
const FEED_URL = process.env.REALSMART_FEED_URL || "https://www.gestim2002.it/portali/immobili_724.xml";

/** Caratteristiche che il feed espone. Se ne compare una nuova, la ricerca non la conosce. */
const CARATTERISTICHE_NOTE = new Set([
  "giardino",
  "box / posto auto",
  "doppi servizi",
  "terrazzo",
  "aria condizionata",
  "ascensore",
]);

let cached: NormalizedProperty[] | null = null;

async function loadFeed(): Promise<NormalizedProperty[]> {
  if (cached) return cached;
  const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(60_000) });
  assert.ok(res.ok, `feed non raggiungibile: HTTP ${res.status}`);
  const payload = new XMLParser({ ignoreAttributes: true, trimValues: true }).parse(await res.text());
  cached = parseRealSmartPayload(payload).map(normalizeRealSmartListing);
  return cached;
}

describe("integrazione RealSmart", { skip: ENABLED ? false : "opt-in: REALSMART_INTEGRATION=1" }, () => {
  it("il feed è raggiungibile e produce immobili", async () => {
    const listings = await loadFeed();
    assert.ok(listings.length > 0, "il feed non ha restituito immobili");
  });

  it("ogni immobile ha i campi su cui si basa la ricerca", async () => {
    for (const p of await loadFeed()) {
      assert.ok(p.slug.length > 0, `slug mancante: ${p.sourceRef.codice}`);
      assert.ok(p.title.length > 0, `titolo mancante: ${p.slug}`);
      assert.ok(p.town.length > 0, `comune mancante: ${p.slug}`);
      assert.ok(["vendita", "affitto"].includes(p.contract), `contratto anomalo: ${p.slug}`);
      assert.ok(p.priceLabel.length > 0, `prezzo non formattato: ${p.slug}`);
      assert.ok(Array.isArray(p.images), `immagini non valide: ${p.slug}`);
    }
  });

  it("gli immobili non pubblici restano fuori dalla vista dell'assistente", async () => {
    const visible = (await loadFeed()).filter((p) => !["draft", "sold", "withdrawn"].includes(p.status));
    const snapshot = buildAssistantListings(visible, "live");

    assert.ok(snapshot.available, "lo snapshot dovrebbe essere consultabile");
    for (const p of snapshot.properties) {
      assert.equal(p.sold, false, `immobile venduto tra i disponibili: ${p.slug}`);
    }
  });

  it("le caratteristiche del feed sono tutte cercabili", async () => {
    // Se il gestionale introduce una caratteristica nuova, la ricerca non sa filtrarla:
    // meglio scoprirlo qui che da un utente che chiede "con cantina" e non trova nulla.
    const sconosciute = new Set<string>();
    for (const p of await loadFeed()) {
      for (const f of p.features) {
        const norm = f.toLowerCase().trim();
        if (!CARATTERISTICHE_NOTE.has(norm)) sconosciute.add(norm);
      }
    }
    assert.deepEqual(
      [...sconosciute],
      [],
      `caratteristiche non cercabili — aggiungerle a FeatureLabel e FEATURE_MATCH`,
    );
  });

  it("gli slug sono univoci", async () => {
    // Uno slug duplicato manderebbe due immobili diversi alla stessa scheda.
    const seen = new Set<string>();
    for (const p of await loadFeed()) {
      assert.ok(!seen.has(p.slug), `slug duplicato: ${p.slug}`);
      seen.add(p.slug);
    }
  });

  it("documenta i campi che il feed NON fornisce", async () => {
    const listings = await loadFeed();
    const conClasse = listings.filter((p) => p.energyClass).length;
    const conProvincia = listings.filter((p) => p.province).length;

    // Non sono fallimenti: sono assunzioni. L'assistente risponde "informazione non
    // disponibile" su questi campi, e deve continuare a farlo finché restano vuoti.
    // Se un giorno il feed li popola, questo test lo segnala e si può migliorare la risposta.
    assert.equal(conClasse, 0, `il feed ora fornisce la classe energetica (${conClasse} immobili): l'assistente può smettere di dire "non disponibile"`);
    assert.equal(conProvincia, 0, `il feed ora fornisce la provincia (${conProvincia} immobili): verificare la chiave di zona in listings.ts`);
  });
});
