// Policy SEO dei venduti (app/lib/seo/soldPolicy.ts) + effetto sul sitemap.
//
// Il punto NON è quale policy sia giusta (la sceglie il cliente): è che ognuna delle quattro
// opzioni abbia un effetto ESPLICITO e verificabile, e che il default sia quello dichiarato.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  SOLD_URL_POLICY,
  soldEligibleForSitemap,
  soldRobots,
  soldPageDirective,
  type SoldUrlPolicy,
} from "../soldPolicy";
import { buildSitemap } from "../../../sitemap";

describe("policy venduti — default esplicito", () => {
  test("il default è 'noindex' (prudente e reversibile)", () => {
    // Se qualcuno cambia il default, questo test lo rende una decisione consapevole.
    assert.equal(SOLD_URL_POLICY, process.env.SOLD_URL_POLICY?.trim() || "noindex");
  });
});

describe("policy venduti — ogni opzione ha un effetto esplicito", () => {
  const table: Record<SoldUrlPolicy, { sitemap: boolean; robotsIndex: boolean | null }> = {
    index: { sitemap: true, robotsIndex: true },
    noindex: { sitemap: false, robotsIndex: false },
    redirect: { sitemap: false, robotsIndex: null },
    gone: { sitemap: false, robotsIndex: null },
  };

  for (const policy of ["index", "noindex", "redirect", "gone"] as SoldUrlPolicy[]) {
    test(`[${policy}] sitemap=${table[policy].sitemap}, robots coerenti`, () => {
      assert.equal(soldEligibleForSitemap(policy), table[policy].sitemap);
      const r = soldRobots(policy);
      if (table[policy].robotsIndex === null) assert.equal(r, null);
      else assert.equal(r?.index, table[policy].robotsIndex);
    });
  }

  test("solo 'index' tiene i venduti nel sitemap", () => {
    assert.equal(soldEligibleForSitemap("index"), true);
    for (const p of ["noindex", "redirect", "gone"] as SoldUrlPolicy[]) {
      assert.equal(soldEligibleForSitemap(p), false, p);
    }
  });

  test("'redirect' porta un target esplicito, le altre no", () => {
    assert.equal(soldPageDirective("redirect").kind, "redirect");
    assert.ok(soldPageDirective("redirect").redirectTo, "manca il target del redirect");
    assert.equal(soldPageDirective("noindex").redirectTo, undefined);
  });
});

describe("sitemap — i venduti entrano solo se la policy li ammette", () => {
  const listings = [
    { slug: "disponibile-1", cover: "/a.jpg", sold: false },
    { slug: "venduto-1", cover: "/b.jpg", sold: true },
    { slug: "disponibile-2", cover: "/c.jpg" }, // sold assente = disponibile
  ];
  const base = "https://www.domustua.com";

  test("policy che esclude i venduti (noindex/redirect/gone): fuori dal sitemap", () => {
    const sm = buildSitemap(base, [], listings, /* soldInSitemap */ false);
    const urls = sm.map((e) => e.url);
    assert.ok(urls.includes(`${base}/case/disponibile-1`));
    assert.ok(urls.includes(`${base}/case/disponibile-2`));
    assert.ok(!urls.includes(`${base}/case/venduto-1`), "un venduto è finito nel sitemap");
  });

  test("policy 'index': i venduti entrano", () => {
    const sm = buildSitemap(base, [], listings, /* soldInSitemap */ true);
    assert.ok(sm.map((e) => e.url).includes(`${base}/case/venduto-1`));
  });
});
