// Che cosa succede quando RealSmart non risponde — REGOLA DI SICUREZZA (Prompt 3 del reaudit).
//
// Il feed è l'unica fonte degli immobili reali. Se cade, in PRODUZIONE il sito non deve MAI
// spacciare un immobile finto (mock demo) per reale. Il comportamento atteso:
//   • live riuscito            → source "live", dato reale, memorizzato come ultimo-buono;
//   • live fallito + ultimo-buono → source "stale" (dato reale, un po' vecchio);
//   • live fallito senza buono → source "unavailable", lista vuota (fail-closed);
//   • mock demo                → SOLO offline esplicito (USE_REALSMART="false") e fuori produzione.
//
// I mock non sono più un ripiego di produzione: questi test lo verificano scenario per scenario.

import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  loadListings,
  mockModeAllowed,
  isRealListingSource,
  __resetLastKnownGoodForTests,
} from "../client";
import { getMockRealSmartListings } from "../mocks";
import { normalizeRealSmartListing } from "../normalize";
import { normalizedToProperty } from "../toProperty";
import type { RealSmartListingRaw } from "../types";

// Sorgenti iniettabili deterministiche (nessuna rete).
const RAW: RealSmartListingRaw[] = getMockRealSmartListings();
const liveOk = async (): Promise<RealSmartListingRaw[]> => RAW;
const liveEmpty = async (): Promise<RealSmartListingRaw[]> => [];
const liveDown = async (): Promise<RealSmartListingRaw[]> => {
  throw new Error("ECONNREFUSED (simulato)");
};

// Salviamo e ripristiniamo le env che governano la modalità.
const ENV_USE = process.env.NEXT_PUBLIC_USE_REALSMART;
const ENV_VERCEL = process.env.VERCEL_ENV;
const ENV_ALLOW_MOCK = process.env.REALSMART_ALLOW_MOCK;
function setVercelEnv(v: string | undefined): void {
  if (v === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = v;
}
function setAllowMock(v: string | undefined): void {
  if (v === undefined) delete process.env.REALSMART_ALLOW_MOCK;
  else process.env.REALSMART_ALLOW_MOCK = v;
}

describe("feed live: successo, vuoto e diagnostica", () => {
  before(() => {
    delete process.env.NEXT_PUBLIC_USE_REALSMART; // default ON (live)
  });
  after(() => {
    if (ENV_USE === undefined) delete process.env.NEXT_PUBLIC_USE_REALSMART;
    else process.env.NEXT_PUBLIC_USE_REALSMART = ENV_USE;
  });
  beforeEach(() => __resetLastKnownGoodForTests());

  test("live riuscito: source 'live', dato reale, ok, diagnostica coerente", async () => {
    const snap = await loadListings(liveOk);
    assert.equal(snap.source, "live");
    assert.equal(snap.ok, true);
    assert.equal(snap.stale, false);
    assert.ok(snap.itemCount > 0);
    assert.equal(snap.itemCount, snap.listings.length);
    assert.ok(snap.fetchedAt && snap.fetchedAt.length > 0, "live: fetchedAt valorizzato");
    assert.ok(snap.lastAttemptAt.length > 0, "lastAttemptAt sempre valorizzato");
  });

  test("zero risultati: source 'live', ok, lista vuota (non è un errore)", async () => {
    const snap = await loadListings(liveEmpty);
    assert.equal(snap.source, "live");
    assert.equal(snap.ok, true);
    assert.equal(snap.itemCount, 0);
    assert.deepEqual(snap.listings, []);
  });
});

describe("feed live caduto: mai i mock, ultimo-buono o fail-closed", () => {
  before(() => {
    delete process.env.NEXT_PUBLIC_USE_REALSMART; // live
  });
  after(() => {
    if (ENV_USE === undefined) delete process.env.NEXT_PUBLIC_USE_REALSMART;
    else process.env.NEXT_PUBLIC_USE_REALSMART = ENV_USE;
  });
  beforeEach(() => __resetLastKnownGoodForTests());

  test("caduto senza ultimo-buono: fail-closed 'unavailable', lista vuota, MAI mock", async () => {
    const snap = await loadListings(liveDown);
    assert.equal(snap.source, "unavailable");
    assert.equal(snap.ok, false);
    assert.equal(snap.stale, true);
    assert.deepEqual(snap.listings, [], "fail-closed: nessun immobile, tantomeno finto");
    assert.ok(!isRealListingSource(snap.source));
  });

  test("caduto CON ultimo-buono: serve 'stale' (dato reale), non i mock", async () => {
    const good = await loadListings(liveOk); // popola l'ultimo-buono
    assert.equal(good.source, "live");

    const snap = await loadListings(liveDown); // ora il feed cade
    assert.equal(snap.source, "stale");
    assert.equal(snap.stale, true);
    assert.equal(snap.ok, true);
    assert.ok(isRealListingSource(snap.source), "stale è dato reale, citabile");
    // Sono gli stessi immobili dell'ultimo buono, non i mock caricati da capo.
    assert.deepEqual(
      snap.listings.map((l) => l.slug),
      good.listings.map((l) => l.slug),
    );
  });

  test("feed reale irraggiungibile (fetcher di default): 'unavailable', non lancia, non mock", async () => {
    const original = process.env.REALSMART_FEED_URL;
    process.env.REALSMART_FEED_URL = "http://127.0.0.1:1/realsmart-non-raggiungibile.xml";
    try {
      const snap = await loadListings(); // fetcher live reale, endpoint morto
      assert.notEqual(snap.source, "mock", "un feed morto non deve MAI diventare mock");
      assert.equal(snap.source, "unavailable");
      assert.equal(snap.ok, false);
    } finally {
      if (original === undefined) delete process.env.REALSMART_FEED_URL;
      else process.env.REALSMART_FEED_URL = original;
    }
  });
});

describe("modalità mock offline: autorizzazione SERVER-ONLY, mai in produzione", () => {
  after(() => {
    if (ENV_USE === undefined) delete process.env.NEXT_PUBLIC_USE_REALSMART;
    else process.env.NEXT_PUBLIC_USE_REALSMART = ENV_USE;
    setVercelEnv(ENV_VERCEL);
    setAllowMock(ENV_ALLOW_MOCK);
  });
  beforeEach(() => __resetLastKnownGoodForTests());

  test("CI/dev + USE_REALSMART=false + REALSMART_ALLOW_MOCK=true: mock ammessi, source 'mock'", async () => {
    process.env.NEXT_PUBLIC_USE_REALSMART = "false";
    setVercelEnv(undefined); // come una build di CI: nessun VERCEL_ENV
    setAllowMock("true"); // autorizzazione server-only esplicita
    assert.equal(mockModeAllowed(), true);
    const snap = await loadListings(liveDown); // il fetcher non deve nemmeno essere chiamato
    assert.equal(snap.source, "mock");
    assert.ok(snap.itemCount > 0);
  });

  test("USE_REALSMART=false SENZA REALSMART_ALLOW_MOCK: niente mock → 'unavailable'", async () => {
    process.env.NEXT_PUBLIC_USE_REALSMART = "false";
    setVercelEnv(undefined);
    setAllowMock(undefined); // manca l'autorizzazione server-only
    assert.equal(mockModeAllowed(), false, "senza opt-in server-only i mock non sono ammessi");
    const snap = await loadListings(liveDown);
    assert.equal(snap.source, "unavailable");
  });

  test("PRODUZIONE VERA (VERCEL_ENV=production) sovrascrive ANCHE l'opt-in: NIENTE mock", async () => {
    process.env.NEXT_PUBLIC_USE_REALSMART = "false";
    setVercelEnv("production");
    setAllowMock("true"); // anche con l'opt-in acceso…
    assert.equal(mockModeAllowed(), false, "in produzione reale i mock non sono mai ammessi");
    const snap = await loadListings(liveDown);
    assert.notEqual(snap.source, "mock");
    assert.equal(snap.source, "unavailable");
  });
});

describe("contenuto dei mock demo: pulito quanto il reale (restano dev-only)", () => {
  test("nessun markup, paragrafi veri, fatti con provenienza", () => {
    const properties = getMockRealSmartListings()
      .map(normalizeRealSmartListing)
      .map(normalizedToProperty);

    assert.ok(properties.length > 0);
    for (const p of properties) {
      assert.ok(p.description.length > 0, `${p.slug}: nessun paragrafo`);
      for (const par of p.description) {
        assert.ok(par.trim().length > 0, `${p.slug}: paragrafo vuoto`);
        assert.ok(!/<br|<[a-z/][^>]*>/i.test(par), `${p.slug}: markup nel testo`);
      }
      for (const f of p.facts ?? []) {
        assert.ok(["override", "realsmart", "descrizione"].includes(f.source), f.key);
        assert.notEqual(f.value, "—");
      }
    }
  });
});
