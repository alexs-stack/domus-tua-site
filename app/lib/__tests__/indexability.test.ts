import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isIndexableDeployment, siteHost } from "../site";

// Il caso che ha motivato questa regola (10 ago 2026): il sito girava su
// `domus-tua-ten.vercel.app` con VERCEL_ENV=production, robots aperto a tutti e un
// `Sitemap:` che puntava a www.domustua.com — dominio che allora serviva ancora il
// vecchio WordPress. Una copia completa e indicizzabile che dichiarava URL altrui.
//
// Nessuna variabile d'ambiente può accorgersene: NEXT_PUBLIC_SITE_URL dice dove il sito
// vorrebbe stare, non da dove sta rispondendo. Serve l'host della richiesta.

describe("indicizzabilità del deploy", () => {
  test("produzione sul dominio canonico: indicizzabile", () => {
    assert.equal(
      isIndexableDeployment({ vercelEnv: "production", requestHost: siteHost }),
      true,
    );
  });

  test("produzione su un'anteprima Vercel: NON indicizzabile", () => {
    assert.equal(
      isIndexableDeployment({
        vercelEnv: "production",
        requestHost: "domus-tua-ten.vercel.app",
      }),
      false,
    );
  });

  test("www e apex sono lo stesso sito", () => {
    const apex = siteHost.replace(/^www\./, "");
    assert.equal(isIndexableDeployment({ vercelEnv: "production", requestHost: apex }), true);
    assert.equal(
      isIndexableDeployment({ vercelEnv: "production", requestHost: `www.${apex}` }),
      true,
    );
  });

  test("host maiuscolo: confronto insensibile alle maiuscole", () => {
    assert.equal(
      isIndexableDeployment({ vercelEnv: "production", requestHost: siteHost.toUpperCase() }),
      true,
    );
  });

  test("ambiente preview di Vercel: mai indicizzabile, nemmeno sul dominio giusto", () => {
    assert.equal(
      isIndexableDeployment({ vercelEnv: "preview", requestHost: siteHost }),
      false,
    );
  });

  test("host assente: si sceglie di non indicizzare", () => {
    assert.equal(
      isIndexableDeployment({ vercelEnv: "production", requestHost: null }),
      false,
    );
  });

  test("fuori da Vercel (locale) la regola resta il badge di anteprima", () => {
    // Qui l'host non conta: in locale si risponde da localhost e bloccare sempre
    // impedirebbe di verificare il robots vero con `npm run dev`.
    assert.equal(isIndexableDeployment({ requestHost: "localhost:3000" }), true);
    assert.equal(
      isIndexableDeployment({ previewBadge: "true", requestHost: "localhost:3000" }),
      false,
    );
  });
});
