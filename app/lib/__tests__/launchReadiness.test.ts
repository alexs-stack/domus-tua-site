// Launch-readiness (app/lib/launchReadiness.ts) e robots delle pagine legali (app/lib/legal.ts).
// Il cancello deve BLOCCARE finché i documenti legali non sono approvati.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { assertVillaMediaCleared, evaluateLaunchReadiness } from "../launchReadiness";

const PROD_ENV = {
  LEGAL_DOCS_APPROVED: "true",
  NEXT_PUBLIC_SITE_URL: "https://www.domustua.com",
  NEXT_PUBLIC_PREVIEW_BADGE: undefined,
  VILLA_MEDIA_CLEARED: "true",
};

describe("launch-readiness — il legale è il cancello", () => {
  test("legale non approvato → BLOCKED, non pronto", () => {
    const r = evaluateLaunchReadiness({ ...PROD_ENV, LEGAL_DOCS_APPROVED: undefined });
    const legal = r.checks.find((c) => c.area === "Legale")!;
    assert.equal(legal.status, "BLOCKED");
    assert.equal(r.ready, false);
    assert.ok(r.blockers >= 1);
  });

  test("solo 'true' approva (niente coercizione)", () => {
    for (const v of ["1", "yes", "TRUE", "on", ""]) {
      const r = evaluateLaunchReadiness({ ...PROD_ENV, LEGAL_DOCS_APPROVED: v });
      assert.equal(r.checks.find((c) => c.area === "Legale")!.status, "BLOCKED", v);
    }
  });

  test("ambiente di produzione completo → tutto PASS, pronto", () => {
    const r = evaluateLaunchReadiness(PROD_ENV);
    assert.equal(r.ready, true);
    assert.equal(r.blockers, 0);
    assert.ok(r.checks.every((c) => c.status === "PASS"));
  });

  test("dominio di anteprima/localhost → BLOCKED", () => {
    for (const url of ["https://example.com", "http://127.0.0.1:3000", "https://domus-tua-ten.vercel.app", ""]) {
      const r = evaluateLaunchReadiness({ ...PROD_ENV, NEXT_PUBLIC_SITE_URL: url });
      assert.equal(r.checks.find((c) => c.area === "Dominio")!.status, "BLOCKED", url);
    }
  });

  test("badge anteprima acceso in produzione → BLOCKED", () => {
    const r = evaluateLaunchReadiness({ ...PROD_ENV, NEXT_PUBLIC_PREVIEW_BADGE: "true" });
    assert.equal(r.checks.find((c) => c.area === "Anteprima")!.status, "BLOCKED");
    assert.equal(r.ready, false);
  });

  // Foto e riprese della villa del video tour (D35, A24 di Alberto): la
  // produzione aspetta i punti 2.2, 2.13 e 6.2 di docs/da-chiedere-alla-cliente.md.
  test("media della villa senza autorizzazione → BLOCKED", () => {
    for (const v of [undefined, "", "1", "TRUE"]) {
      const r = evaluateLaunchReadiness({ ...PROD_ENV, VILLA_MEDIA_CLEARED: v });
      assert.equal(r.checks.find((c) => c.area === "Media")!.status, "BLOCKED", String(v));
      assert.equal(r.ready, false);
    }
  });

  // Il cancello al build (D35, spec §11 punto 12): su Vercel Production `next build` si ferma
  // finché VILLA_MEDIA_CLEARED non vale "true"; Preview, CI e build locali passano.
  test("il build di Vercel Production si ferma senza VILLA_MEDIA_CLEARED", () => {
    for (const v of [undefined, "", "1", "TRUE"]) {
      assert.throws(
        () => assertVillaMediaCleared({ VERCEL_ENV: "production", VILLA_MEDIA_CLEARED: v }),
        /VILLA_MEDIA_CLEARED/,
        String(v),
      );
    }
    assert.doesNotThrow(() => assertVillaMediaCleared({ VERCEL_ENV: "production", VILLA_MEDIA_CLEARED: "true" }));
    for (const env of [undefined, "preview", "development"]) {
      assert.doesNotThrow(() => assertVillaMediaCleared({ VERCEL_ENV: env }), String(env));
    }
  });

  test("next.config.ts chiama il cancello nella fase di build di produzione", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    assert.match(config, /import \{ PHASE_PRODUCTION_BUILD \} from "next\/constants";/);
    assert.match(config, /if \(phase === PHASE_PRODUCTION_BUILD\) assertVillaMediaCleared\(process\.env\);/);
    assert.match(config, /export default function config\(phase: string\): NextConfig \{/);
  });
});

describe("robots pagine legali (app/lib/legal.ts)", () => {
  const ORIG = process.env.LEGAL_DOCS_APPROVED;
  test("non approvato → noindex, follow", async () => {
    delete process.env.LEGAL_DOCS_APPROVED;
    const { legalRobots, legalDocsApproved } = await import("../legal");
    assert.equal(legalDocsApproved(), false);
    assert.deepEqual(legalRobots(), { index: false, follow: true });
    if (ORIG === undefined) delete process.env.LEGAL_DOCS_APPROVED;
    else process.env.LEGAL_DOCS_APPROVED = ORIG;
  });
});
