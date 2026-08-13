// Validazione pre-go-live, a livello di repository (nessun accesso a produzione):
//  • redirect legacy WordPress — source/destination/308/no-loop/no-catena/query;
//  • sitemap — host, rotte, immobili, niente URL noindex/anteprima/duplicati;
//  • robots — allow+sitemap in produzione, disallow totale in anteprima;
//  • dati strutturati organizzazione — campi critici, niente aggregateRating.
//
// Lo smoke test contro il dominio reale è un'altra cosa: scripts/smoke.ts.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import nextConfig from "../../../next.config";
import { buildSitemap, SITEMAP_ROUTES, NON_INDEXABLE_ROUTES } from "../../sitemap";
import { robotsRules, RETRIEVAL_BOTS } from "../../robots";
import { organizationJsonLd, siteUrl } from "../site";

type Redirect = { source: string; destination: string; permanent?: boolean };

async function getRedirects(): Promise<Redirect[]> {
  const r = nextConfig.redirects ? await nextConfig.redirects() : [];
  return r as Redirect[];
}

describe("redirect legacy — go-live", () => {
  test("sono configurati (l'inventario WordPress non è vuoto)", async () => {
    const redirects = await getRedirects();
    assert.ok(redirects.length >= 10, `troppi pochi redirect: ${redirects.length}`);
  });

  test("ogni redirect ha source/destination assoluti e permanent:true (308 accettato)", async () => {
    for (const r of await getRedirects()) {
      assert.ok(r.source.startsWith("/"), `source non assoluto: ${r.source}`);
      assert.ok(r.destination.startsWith("/"), `destination non assoluta: ${r.destination}`);
      assert.equal(r.permanent, true, `${r.source}: atteso permanent (Next emette 308)`);
    }
  });

  test("nessun loop: una source non redirige a sé stessa", async () => {
    for (const r of await getRedirects()) {
      assert.notEqual(r.source, r.destination, `loop diretto: ${r.source}`);
    }
  });

  test("nessuna CATENA evitabile: la destinazione non è a sua volta una source", async () => {
    const redirects = await getRedirects();
    const sources = new Set(redirects.map((r) => r.source));
    for (const r of redirects) {
      const destPath = r.destination.split(/[?#]/)[0];
      assert.ok(
        !sources.has(destPath),
        `catena: ${r.source} → ${r.destination} (la destinazione è anche una source)`
      );
    }
  });

  test("nessuna destination annulla i query param (nessun '?' hardcoded)", async () => {
    for (const r of await getRedirects()) {
      assert.ok(
        !r.destination.includes("?"),
        `${r.source} → ${r.destination}: query hardcoded impedirebbe il passaggio dei parametri`
      );
    }
  });

  test("i redirect WordPress rappresentativi puntano alla destinazione giusta", async () => {
    const map = new Map((await getRedirects()).map((r) => [r.source, r.destination]));
    for (const [source, dest] of [
      ["/case", "/acquista"],
      ["/cerchi-casa", "/acquista"],
      ["/vendi-casa", "/vendi"],
      ["/servizi-domus", "/servizi"],
      ["/servizi-domus/open-domus", "/open-domus"],
      ["/team", "/chi-siamo"],
      ["/privacy-policy", "/privacy"],
      ["/cookies-policy", "/cookie"],
      ["/wp-sitemap.xml", "/sitemap.xml"],
    ] as const) {
      assert.equal(map.get(source), dest, `redirect mancante/errato: ${source} → ${dest}`);
    }
  });
});

describe("sitemap — go-live", () => {
  const listings = [
    { slug: "villa-con-giardino-x", cover: "/images/a.jpg" },
    { slug: "attico-y", cover: "https://cloud2.realsmart.it/x.jpg" },
  ];
  const sm = buildSitemap(siteUrl, SITEMAP_ROUTES, listings);

  test("ogni URL è sull'host di produzione", () => {
    for (const e of sm) assert.ok(e.url.startsWith(siteUrl), e.url);
  });

  test("include le rotte statiche attese, homepage compresa", () => {
    const urls = new Set(sm.map((e) => e.url));
    assert.ok(urls.has(siteUrl), "homepage assente");
    for (const r of ["/servizi", "/acquista", "/contatti", "/lavora-con-noi"]) {
      assert.ok(urls.has(`${siteUrl}${r}`), `rotta assente: ${r}`);
    }
  });

  test("rotte immobile valide, con foto in URL ASSOLUTO", () => {
    const villa = sm.find((e) => e.url.endsWith("/case/villa-con-giardino-x"));
    assert.ok(villa, "immobile con path relativo assente");
    assert.ok(villa!.images?.[0]?.startsWith(siteUrl), "foto /images non resa assoluta");
    const attico = sm.find((e) => e.url.endsWith("/case/attico-y"));
    assert.ok(attico!.images?.[0]?.startsWith("https://cloud2.realsmart.it"), "foto http alterata");
  });

  test("nessuna rotta noindex (privacy/cookie) nel sitemap", () => {
    for (const r of NON_INDEXABLE_ROUTES) {
      assert.ok(!sm.some((e) => e.url === `${siteUrl}${r}`), `${r} non deve stare nel sitemap`);
    }
  });

  test("nessun URL di anteprima o localhost", () => {
    for (const e of sm) {
      assert.doesNotMatch(e.url, /vercel\.app|localhost|127\.0\.0\.1/, e.url);
    }
  });

  test("nessun URL duplicato", () => {
    const urls = sm.map((e) => e.url);
    assert.equal(urls.length, new Set(urls).size, "URL duplicati nel sitemap");
  });
});

describe("robots — go-live", () => {
  test("produzione: allow, sitemap dichiarato, bot di retrieval ammessi", () => {
    const r = robotsRules(true);
    assert.equal(r.sitemap, `${siteUrl}/sitemap.xml`);
    const rules = r.rules as { userAgent: string; allow?: string; disallow?: string }[];
    assert.ok(rules.some((x) => x.userAgent === "*" && x.allow === "/"), "manca allow: * /");
    for (const bot of RETRIEVAL_BOTS) {
      assert.ok(rules.some((x) => x.userAgent === bot && x.allow === "/"), `bot mancante: ${bot}`);
    }
  });

  test("anteprima/staging: disallow totale, nessun sitemap esposto", () => {
    const r = robotsRules(false);
    assert.equal(r.sitemap, undefined, "un'anteprima non deve esporre il sitemap");
    const rule = r.rules as { userAgent: string; disallow?: string };
    assert.equal(rule.userAgent, "*");
    assert.equal(rule.disallow, "/");
  });
});

describe("dati strutturati organizzazione — go-live", () => {
  const ld = organizationJsonLd();

  test("tipo, @id perno e campi societari verificati", () => {
    assert.equal(ld["@type"], "RealEstateAgent");
    assert.equal(ld["@id"], `${siteUrl}/#organization`);
    assert.ok(ld.name.length > 0);
    assert.ok(ld.vatID.length > 0);
    assert.equal(ld.address["@type"], "PostalAddress");
    assert.ok(ld.address.addressLocality.length > 0);
    assert.ok(ld.address.addressRegion.length > 0);
    assert.ok(Array.isArray(ld.openingHours) && ld.openingHours.length > 0);
    assert.ok(Array.isArray(ld.sameAs) && ld.sameAs.every((u) => u.startsWith("https://")));
  });

  test("NIENTE aggregateRating finché non c'è contenuto recensioni idoneo (policy Google)", () => {
    assert.ok(!("aggregateRating" in ld), "aggregateRating non deve comparire");
  });

  test("URL assoluti sul dominio di produzione", () => {
    assert.ok(ld.url.startsWith(siteUrl), ld.url);
    assert.ok(ld.image.startsWith(siteUrl), ld.image);
  });
});
