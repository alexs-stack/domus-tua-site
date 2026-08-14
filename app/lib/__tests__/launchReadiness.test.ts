// Launch-readiness (app/lib/launchReadiness.ts) e robots delle pagine legali (app/lib/legal.ts).
// Il cancello deve BLOCCARE finché i documenti legali non sono approvati.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { evaluateLaunchReadiness } from "../launchReadiness";

const PROD_ENV = {
  LEGAL_DOCS_APPROVED: "true",
  NEXT_PUBLIC_SITE_URL: "https://www.domustua.com",
  NEXT_PUBLIC_PREVIEW_BADGE: undefined,
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
