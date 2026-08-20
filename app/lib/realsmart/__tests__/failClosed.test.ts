// Comportamento su guasto e caching RETRY-AWARE (Prompt 3).
//
// Scenari: cold start, ultimo-buono caldo (stale), recupero del feed, zero record, XML malformato,
// timeout/rete, comportamento multi-istanza (single-flight), politica di caching negativa e
// verità della diagnostica (fetchedAt vs lastAttemptAt). Nessuna rete reale: fetcher iniettabili
// + fetch globale simulata per i casi che passano dal fetcher reale.

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  loadListings,
  getLiveListingsSnapshot,
  revalidateListingsSnapshot,
  snapshotTtlMs,
  lastKnownGoodKind,
  REVALIDATE_SECONDS,
  NEGATIVE_REVALIDATE_SECONDS,
  __resetRealSmartStateForTests,
  type ListingsSnapshot,
} from "../client";
import { getMockRealSmartListings } from "../mocks";
import type { RealSmartListingRaw } from "../types";

const RAW: RealSmartListingRaw[] = getMockRealSmartListings();
const liveOk = async (): Promise<RealSmartListingRaw[]> => RAW;
const liveEmpty = async (): Promise<RealSmartListingRaw[]> => [];
const liveDown = async (): Promise<RealSmartListingRaw[]> => {
  throw new Error("ECONNREFUSED (simulato)");
};

// Assicura la modalità LIVE (niente mock) per questi scenari.
const ENV_USE = process.env.NEXT_PUBLIC_USE_REALSMART;
const ENV_ALLOW = process.env.REALSMART_ALLOW_MOCK;
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_USE_REALSMART; // default ON = live
  delete process.env.REALSMART_ALLOW_MOCK;
  __resetRealSmartStateForTests();
});
afterEach(() => {
  if (ENV_USE === undefined) delete process.env.NEXT_PUBLIC_USE_REALSMART;
  else process.env.NEXT_PUBLIC_USE_REALSMART = ENV_USE;
  if (ENV_ALLOW === undefined) delete process.env.REALSMART_ALLOW_MOCK;
  else process.env.REALSMART_ALLOW_MOCK = ENV_ALLOW;
});

describe("diagnostica veritiera: fetchedAt vs lastAttemptAt", () => {
  test("live: fetchedAt e lastAttemptAt valorizzati", async () => {
    const s = await loadListings(liveOk);
    assert.ok(s.fetchedAt && s.lastAttemptAt);
  });

  test("stale: fetchedAt resta l'ORIGINALE, lastAttemptAt è più recente", async () => {
    const good = await loadListings(liveOk); // popola l'ultimo-buono
    await new Promise((r) => setTimeout(r, 5));
    const stale = await loadListings(liveDown);
    assert.equal(stale.source, "stale");
    assert.equal(stale.fetchedAt, good.fetchedAt, "il dato vecchio non si finge appena scaricato");
    assert.notEqual(stale.lastAttemptAt, good.fetchedAt);
    assert.ok(stale.lastAttemptAt > good.fetchedAt!, "il tentativo è successivo alla fetch buona");
  });

  test("unavailable: fetchedAt è null (nessun dato reale servito), lastAttemptAt presente", async () => {
    const s = await loadListings(liveDown);
    assert.equal(s.source, "unavailable");
    assert.equal(s.fetchedAt, null);
    assert.ok(s.lastAttemptAt.length > 0);
  });
});

describe("ultimo-buono: scritto SOLO su successo", () => {
  test("un fallimento non sovrascrive l'ultimo-buono", async () => {
    const good = await loadListings(liveOk);
    await loadListings(liveDown); // fallisce: non deve toccare l'ultimo-buono
    const stillStale = await loadListings(liveDown);
    assert.equal(stillStale.source, "stale");
    assert.deepEqual(
      stillStale.listings.map((l) => l.slug),
      good.listings.map((l) => l.slug),
    );
  });

  test("l'adapter attivo dell'ultimo-buono è 'memory' di default", () => {
    assert.equal(lastKnownGoodKind(), "memory");
  });
});

describe("politica di caching: positiva lunga, negativa breve", () => {
  test("uno snapshot usabile ha TTL positivo (12 min)", () => {
    const ok = { ok: true } as ListingsSnapshot;
    assert.equal(snapshotTtlMs(ok), REVALIDATE_SECONDS * 1000);
  });
  test("uno snapshot fail-closed ha TTL negativo breve (≈1 min), molto più corto", () => {
    const bad = { ok: false } as ListingsSnapshot;
    assert.equal(snapshotTtlMs(bad), NEGATIVE_REVALIDATE_SECONDS * 1000);
    assert.ok(snapshotTtlMs(bad) < snapshotTtlMs({ ok: true } as ListingsSnapshot));
  });
});

describe("cache in-process: single-flight e cache-hit", () => {
  test("multi-istanza/thundering herd: chiamate concorrenti = UNA sola elaborazione", async () => {
    let calls = 0;
    const slow = async (): Promise<RealSmartListingRaw[]> => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 10));
      return RAW;
    };
    const [a, b, c] = await Promise.all([
      getLiveListingsSnapshot(slow),
      getLiveListingsSnapshot(slow),
      getLiveListingsSnapshot(slow),
    ]);
    assert.equal(calls, 1, "single-flight: il feed si scarica una volta sola");
    assert.equal(a.source, "live");
    assert.deepEqual(b, a);
    assert.deepEqual(c, a);
  });

  test("cache-hit: la seconda chiamata non richiama il fetcher", async () => {
    let calls = 0;
    const counting = async (): Promise<RealSmartListingRaw[]> => {
      calls += 1;
      return RAW;
    };
    await getLiveListingsSnapshot(counting);
    await getLiveListingsSnapshot(counting);
    assert.equal(calls, 1, "il secondo accesso serve dalla cache");
  });

  test("recupero del feed: dopo la rivalidazione, unavailable → live", async () => {
    const down = await getLiveListingsSnapshot(liveDown);
    assert.equal(down.source, "unavailable");
    revalidateListingsSnapshot(); // il TTL negativo breve è scaduto (simulato)
    const back = await getLiveListingsSnapshot(liveOk);
    assert.equal(back.source, "live");
    assert.ok(back.itemCount > 0);
  });
});

describe("zero record: non è un errore", () => {
  test("feed che risponde vuoto: source 'live', ok, lista vuota", async () => {
    const s = await loadListings(liveEmpty);
    assert.equal(s.source, "live");
    assert.equal(s.ok, true);
    assert.equal(s.itemCount, 0);
  });
});

describe("fetcher reale: XML malformato e timeout non danno mai mock né eccezioni", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("XML malformato: fail-safe (mai mock, mai throw)", async () => {
    globalThis.fetch = (async () =>
      new Response("<non-xml disallineato <<", { status: 200 })) as typeof fetch;
    const s = await loadListings(); // fetcher reale
    assert.notEqual(s.source, "mock");
    assert.ok(s.source === "live" || s.source === "unavailable");
  });

  test("timeout/rete: la fetch che rifiuta → unavailable, mai mock, mai throw", async () => {
    globalThis.fetch = (async () => {
      throw new DOMException("The operation was aborted", "AbortError");
    }) as typeof fetch;
    const s = await loadListings();
    assert.equal(s.source, "unavailable");
    assert.equal(s.ok, false);
  });

  test("HTTP 500: → unavailable, mai mock", async () => {
    globalThis.fetch = (async () => new Response("errore", { status: 500 })) as typeof fetch;
    const s = await loadListings();
    assert.equal(s.source, "unavailable");
  });
});
