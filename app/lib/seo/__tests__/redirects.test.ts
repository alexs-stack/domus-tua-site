// Inventario redirect (app/lib/seo/redirects.ts): la lista reale è pulita, e il validatore
// riconosce loop, catene, doppioni e URL legacy scoperti.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  legacyRedirects,
  validateRedirects,
  unmappedLegacyUrls,
  normalizePath,
  type RedirectRule,
} from "../redirects";
import { SITEMAP_ROUTES, NON_INDEXABLE_ROUTES } from "../../../sitemap";

describe("inventario reale — nessun difetto strutturale", () => {
  test("i redirect legaci non hanno loop, catene, doppioni o self", () => {
    assert.deepEqual(validateRedirects(legacyRedirects), []);
  });
  test("ogni destinazione è una rotta viva del sito (o una scheda immobile)", () => {
    // Rotte vive = indicizzabili (sitemap) + legali noindex-ma-online + /sitemap.xml.
    const routes = new Set<string>([
      ...SITEMAP_ROUTES.map(normalizePath),
      ...NON_INDEXABLE_ROUTES.map(normalizePath),
      "/sitemap.xml",
    ]);
    for (const r of legacyRedirects) {
      const dst = normalizePath(r.destination);
      assert.ok(routes.has(dst) || /^\/case\//.test(dst), `destinazione non viva: ${r.destination}`);
    }
  });
});

describe("validateRedirects — riconosce i difetti", () => {
  test("loop A⇄B", () => {
    const rules: RedirectRule[] = [
      { source: "/a", destination: "/b", permanent: true },
      { source: "/b", destination: "/a", permanent: true },
    ];
    assert.ok(validateRedirects(rules).some((i) => i.kind === "loop"));
  });

  test("catena multi-hop A→B→C", () => {
    const rules: RedirectRule[] = [
      { source: "/a", destination: "/b", permanent: true },
      { source: "/b", destination: "/c", permanent: true },
    ];
    assert.ok(validateRedirects(rules).some((i) => i.kind === "chain"));
  });

  test("doppione di source (case/slash a parte)", () => {
    const rules: RedirectRule[] = [
      { source: "/Vendi-Casa/", destination: "/vendi", permanent: true },
      { source: "/vendi-casa", destination: "/acquista", permanent: true },
    ];
    assert.ok(validateRedirects(rules).some((i) => i.kind === "duplicate-source"));
  });

  test("source auto-referenziale", () => {
    const rules: RedirectRule[] = [{ source: "/x/", destination: "/x", permanent: true }];
    assert.ok(validateRedirects(rules).some((i) => i.kind === "self"));
  });
});

describe("unmappedLegacyUrls — riconciliazione con gli export del cliente", () => {
  test("segnala solo gli URL legacy non coperti", () => {
    const legacy = [
      "https://www.domustua.com/vendi-casa/", // redirect → coperto
      "/contatti/", //                            rotta viva → coperto
      "/case/villa-x/", //                        scheda immobile → coperto
      "/servizi-domus/home-staging/", //          jolly /servizi-domus/:slug → coperto
      "/category/notizie/", //                    NON coperto
      "/?p=123", //                               NON coperto
    ];
    const unmapped = unmappedLegacyUrls(legacy, SITEMAP_ROUTES);
    assert.ok(unmapped.includes("/category/notizie/"));
    assert.ok(unmapped.includes("/?p=123"));
    assert.ok(!unmapped.some((u) => /vendi-casa|contatti|villa-x|home-staging/.test(u)), `falsi scoperti: ${unmapped}`);
  });
});
