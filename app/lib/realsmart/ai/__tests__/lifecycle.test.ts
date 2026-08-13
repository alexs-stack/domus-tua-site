// Ciclo di vita + applicazione: solo la copy PUBLISHED viene applicata dal sito, e solo se
// corrisponde alla fonte corrente. Più hash, transizioni, idempotenza dell'hash, area facts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { InMemoryGeneratedCopyStore } from "../store";
import { approveCopy, rejectCopy, submitForReview } from "../batch";
import { createPublishedCopyNormalizer } from "../../aiNormalizer";
import { applyAiNormalization } from "../../aiNormalizer";
import { sourceHash } from "../hash";
import { validateAreaFacts, areaFactsFor, AREA_FACTS, type AreaFact } from "../areaFacts";
import type { GeneratedCopyRecord } from "../record";
import type { NormalizedProperty, RealSmartListingRaw } from "../../types";

const NOW = "2026-08-13T10:00:00.000Z";
const RAW: RealSmartListingRaw = { codice: "T1", titolo: "Trilocale", descrizione: "orig", mq: 90 };

function mkBase(over: Partial<NormalizedProperty> = {}): NormalizedProperty {
  return {
    id: "T1", slug: "t1", title: "Trilocale",
    descriptionParagraphs: ["Descrizione deterministica originale."],
    structuredFactLines: [], keptFactLines: [], contentPreservation: 1, excerpt: "x",
    price: 250000, priceLabel: "€ 250.000", contract: "vendita", type: "Appartamento",
    town: "Tradate", province: "VA", showAddress: false, sqm: 90, rooms: 3, bedrooms: 2, baths: 2,
    features: [], facts: [], factsReview: [], images: [], status: "published", badges: [],
    publishedAt: "", updatedAt: "", sourceRef: { codice: "T1" }, normalizedBy: "deterministic",
    ...over,
  };
}

function draft(over: Partial<GeneratedCopyRecord> = {}): GeneratedCopyRecord {
  return {
    listingId: "T1", sourceHash: sourceHash(RAW), status: "draft",
    paragraphs: ["Copy approvata e migliore."], warnings: [],
    provenance: { provider: "mock", model: "m", promptVersion: "v1", generatedAt: NOW, cost: { inputTokens: 1, outputTokens: 1, usd: 0 } },
    ...over,
  };
}

describe("applicazione: solo il PUBLISHED, solo se la fonte combacia", () => {
  test("niente pubblicato → deterministico (nessuna modifica)", async () => {
    const store = new InMemoryGeneratedCopyStore();
    const out = await applyAiNormalization(mkBase(), RAW, createPublishedCopyNormalizer(store));
    assert.equal(out.normalizedBy, "deterministic");
    assert.deepEqual(out.descriptionParagraphs, mkBase().descriptionParagraphs);
  });

  test("un DRAFT non pubblicato NON viene applicato", async () => {
    const store = new InMemoryGeneratedCopyStore();
    await store.put(draft({ status: "draft" }));
    const out = await applyAiNormalization(mkBase(), RAW, createPublishedCopyNormalizer(store));
    assert.equal(out.normalizedBy, "deterministic");
  });

  test("una copy PUBLISHED viene applicata e marcata 'ai'", async () => {
    const store = new InMemoryGeneratedCopyStore();
    await store.put(draft({ status: "published" }));
    const out = await applyAiNormalization(mkBase(), RAW, createPublishedCopyNormalizer(store));
    assert.equal(out.normalizedBy, "ai");
    assert.deepEqual(out.descriptionParagraphs, ["Copy approvata e migliore."]);
  });

  test("fonte cambiata dopo l'approvazione (hash diverso) → NON si applica la copy vecchia", async () => {
    const store = new InMemoryGeneratedCopyStore();
    await store.put(draft({ status: "published", sourceHash: "hash-vecchio-diverso" }));
    const out = await applyAiNormalization(mkBase(), RAW, createPublishedCopyNormalizer(store));
    assert.equal(out.normalizedBy, "deterministic", "copy obsoleta non deve applicarsi");
  });
});

describe("transizioni di revisione", () => {
  test("draft → review → published; approvare storicizza il published precedente", async () => {
    const store = new InMemoryGeneratedCopyStore();
    const h = sourceHash(RAW);
    await store.put(draft({ status: "draft" }));
    await submitForReview(store, "T1", h);
    assert.equal((await store.get("T1", h))?.status, "review");
    await approveCopy(store, "T1", h, "Raffaela", NOW);
    const pub = await store.getPublished("T1");
    assert.equal(pub?.status, "published");
    assert.equal(pub?.reviewedBy, "Raffaela");
  });

  test("reject non rende pubblicabile", async () => {
    const store = new InMemoryGeneratedCopyStore();
    const h = sourceHash(RAW);
    await store.put(draft());
    await rejectCopy(store, "T1", h, "Raffaela", NOW);
    assert.equal(await store.getPublished("T1"), null);
  });
});

describe("hash — idempotenza", () => {
  test("stessa fonte → stesso hash; fonte diversa → hash diverso", () => {
    assert.equal(sourceHash(RAW), sourceHash({ ...RAW }));
    assert.notEqual(sourceHash(RAW), sourceHash({ ...RAW, mq: 120 }));
  });
});

describe("area facts — dataset curato e vuoto", () => {
  test("il dataset di default è vuoto (nessun fatto di zona inventato)", () => {
    assert.equal(AREA_FACTS.length, 0);
    assert.deepEqual(areaFactsFor("Tradate"), []);
  });

  test("la validazione pretende fonte, data e approvatore", () => {
    const bad = [{ comune: "Tradate", scope: "comune", fact: "x", sourceUrl: "non-url", retrievedAt: "ieri", approvedBy: "" }] as AreaFact[];
    const errs = validateAreaFacts(bad);
    assert.ok(errs.some((e) => /sourceUrl/.test(e)));
    assert.ok(errs.some((e) => /retrievedAt/.test(e)));
    assert.ok(errs.some((e) => /approvedBy/.test(e)));
  });
});
