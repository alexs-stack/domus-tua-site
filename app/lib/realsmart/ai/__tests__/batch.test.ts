// Batch: idempotenza, tetto di spesa, kill switch, tetto di batch — controlli di costo/abuso.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { generateBatch, type BatchItem } from "../batch";
import { InMemoryGeneratedCopyStore } from "../store";
import type { CopyModel } from "../schema";
import type { NormalizedProperty, RealSmartListingRaw } from "../../types";
import { GENERATION_LIMITS } from "../record";

const NOW = "2026-08-13T10:00:00.000Z";

function mkItem(codice: string): BatchItem {
  const base: NormalizedProperty = {
    id: codice, slug: codice, title: "Trilocale",
    descriptionParagraphs: ["Luminoso trilocale con doppi servizi."],
    structuredFactLines: [], keptFactLines: [], contentPreservation: 1, excerpt: "x",
    price: 250000, priceLabel: "€ 250.000", contract: "vendita", type: "Appartamento",
    town: "Tradate", province: "VA", showAddress: false, sqm: 90, rooms: 3, bedrooms: 2, baths: 2,
    features: [], facts: [], factsReview: [], images: [], status: "published", badges: [],
    publishedAt: "", updatedAt: "", sourceRef: { codice }, normalizedBy: "deterministic",
  };
  const raw: RealSmartListingRaw = { codice, titolo: "Trilocale", descrizione: "x" };
  return { base, raw };
}

const model: CopyModel = {
  provider: "mock", model: "mock-1",
  async generate() {
    return { text: JSON.stringify({ paragrafi: ["Trilocale luminoso e ben distribuito."] }), usage: { inputTokens: 500, outputTokens: 200 } };
  },
};

describe("idempotenza", () => {
  test("una seconda esecuzione sulla stessa fonte salta tutto (nessun costo)", async () => {
    const store = new InMemoryGeneratedCopyStore();
    const items = [mkItem("A"), mkItem("B")];
    const first = await generateBatch(items, model, store, { now: NOW });
    assert.equal(first.generated, 2);
    assert.ok(first.totalCostUsd > 0);

    const second = await generateBatch(items, model, store, { now: NOW });
    assert.equal(second.generated, 0);
    assert.equal(second.skippedIdempotent, 2);
    assert.equal(second.totalCostUsd, 0, "nessun costo su fonte invariata");
  });
});

describe("controlli di costo/abuso", () => {
  test("kill switch: nessuna generazione", async () => {
    const store = new InMemoryGeneratedCopyStore();
    const s = await generateBatch([mkItem("A")], model, store, { now: NOW, killed: true });
    assert.equal(s.generated, 0);
    assert.equal(s.stoppedBy, "kill-switch");
  });

  test("tetto di spesa: si ferma quando il costo cumulato lo supera", async () => {
    const store = new InMemoryGeneratedCopyStore();
    const items = [mkItem("A"), mkItem("B"), mkItem("C"), mkItem("D")];
    const limits = { ...GENERATION_LIMITS, concurrency: 1, costCapUsd: 0.0000001 };
    const s = await generateBatch(items, model, store, { now: NOW, limits });
    assert.equal(s.stoppedBy, "tetto-spesa");
    assert.ok(s.generated < items.length, "non deve generarli tutti");
  });

  test("tetto di batch: più annunci del massimo → troncato", async () => {
    const store = new InMemoryGeneratedCopyStore();
    const items = Array.from({ length: 5 }, (_, i) => mkItem(`L${i}`));
    const limits = { ...GENERATION_LIMITS, maxBatch: 2, costCapUsd: 999 };
    const s = await generateBatch(items, model, store, { now: NOW, limits });
    assert.equal(s.stoppedBy, "tetto-batch");
    assert.equal(s.generated, 2);
  });
});
