// Autorizzazione e operazioni editoriali.
//
// La metà più importante di questi test verifica che qualcosa NON si possa fare — e non per un
// ruolo insufficiente, ma per nessun ruolo: approvare un fatto che i guard bocciano, pubblicare
// senza motivazione, approvare una narrativa sotto soglia. Sono i casi in cui un'interfaccia
// "utile" offrirebbe una forzatura, ed è esattamente lì che non deve essercene una.

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  issueReviewToken,
  verifyReviewToken,
  requirePermission,
  hasPermission,
  permissionsOf,
  isReviewConfigured,
  ReviewAuthError,
  type ReviewRole,
  type ReviewSession,
} from "../auth";
import { AreaReviewService, ReviewOperationError } from "../service";
import { InMemoryAreaRepository } from "../../store/memory";
import { AREA_SCHEMA_VERSION, AREA_PROMPT_VERSION } from "../../types";
import type { AreaFact, AreaNarrative, AreaProfile } from "../../types";
import { areaFactsHash } from "../../hash";

const SECRET = "un-segreto-lungo-almeno-trentadue-caratteri";
const AREA_KEY = "it|lombardia|va|tradate|";
const NOW = new Date("2026-08-20T10:00:00.000Z");

let previousSecret: string | undefined;
let previousCoords: string | undefined;

beforeEach(() => {
  previousSecret = process.env.AREA_REVIEW_SECRET;
  previousCoords = process.env.AREA_REVIEW_COORDINATE_ACCESS;
  process.env.AREA_REVIEW_SECRET = SECRET;
  delete process.env.AREA_REVIEW_COORDINATE_ACCESS;
});

afterEach(() => {
  if (previousSecret === undefined) delete process.env.AREA_REVIEW_SECRET;
  else process.env.AREA_REVIEW_SECRET = previousSecret;
  if (previousCoords === undefined) delete process.env.AREA_REVIEW_COORDINATE_ACCESS;
  else process.env.AREA_REVIEW_COORDINATE_ACCESS = previousCoords;
});

const session = (role: ReviewRole, actor = "redazione"): ReviewSession => ({
  actor,
  role,
  expiresAt: Math.floor(NOW.getTime() / 1000) + 3600,
});

describe("token di sessione", () => {
  test("un token emesso si verifica e riporta identità e ruolo", () => {
    const token = issueReviewToken({ actor: "anna", role: "editor" }, { now: NOW });
    const s = verifyReviewToken(token, NOW);
    assert.equal(s?.actor, "anna");
    assert.equal(s?.role, "editor");
  });

  test("un token manomesso non passa", () => {
    // È il punto della firma: senza, chiunque potrebbe scriversi il ruolo che preferisce.
    const token = issueReviewToken({ actor: "anna", role: "viewer" }, { now: NOW });
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ actor: "anna", role: "publisher", expiresAt: 99999999999 }))
      .toString("base64url");
    assert.equal(verifyReviewToken(`${forged}.${signature}`, NOW), null);
    assert.equal(verifyReviewToken(`${payload}.firmafarlocca`, NOW), null);
  });

  test("un token scaduto non passa", () => {
    const token = issueReviewToken({ actor: "anna", role: "editor" }, { now: NOW, ttlSeconds: 60 });
    assert.ok(verifyReviewToken(token, new Date(NOW.getTime() + 30_000)));
    assert.equal(verifyReviewToken(token, new Date(NOW.getTime() + 120_000)), null);
  });

  test("senza segreto la redazione è SPENTA, non aperta", () => {
    // Il fallimento sicuro: nessun segreto non significa nessun controllo.
    delete process.env.AREA_REVIEW_SECRET;
    assert.equal(isReviewConfigured(), false);
    assert.equal(verifyReviewToken("qualsiasi.cosa", NOW), null);
    assert.throws(() => issueReviewToken({ actor: "a", role: "editor" }, { now: NOW }), ReviewAuthError);
  });

  test("un segreto troppo corto non conta come segreto", () => {
    process.env.AREA_REVIEW_SECRET = "corto";
    assert.equal(isReviewConfigured(), false);
  });

  test("input storto: null, mai un'eccezione", () => {
    for (const bad of [undefined, null, "", "senzapunto", "a.b.c.d", "...."]) {
      assert.equal(verifyReviewToken(bad, NOW), null, JSON.stringify(bad));
    }
  });
});

describe("matrice dei permessi", () => {
  test("chi fa ricerca non può approvare ciò che ha trovato", () => {
    // Non per sfiducia: il secondo paio di occhi è l'unica cosa che distingue un dato
    // verificato da un dato inserito.
    assert.equal(hasPermission(session("researcher"), "research"), true);
    assert.equal(hasPermission(session("researcher"), "approve-fact"), false);
  });

  test("chi approva i testi non li pubblica", () => {
    assert.equal(hasPermission(session("editor"), "approve-narrative"), true);
    assert.equal(hasPermission(session("editor"), "publish"), false);
    assert.equal(hasPermission(session("publisher"), "publish"), true);
  });

  test("chi guarda e basta guarda e basta", () => {
    assert.deepEqual(permissionsOf(session("viewer")), ["read"]);
  });

  test("le COORDINATE sono un permesso per persona, non per ruolo", () => {
    // Un permesso che sta in un ruolo finisce per essere dato a chiunque abbia quel ruolo.
    assert.equal(hasPermission(session("publisher", "anna"), "view-coordinates"), false);
    process.env.AREA_REVIEW_COORDINATE_ACCESS = "anna, marco";
    assert.equal(hasPermission(session("publisher", "anna"), "view-coordinates"), true);
    assert.equal(hasPermission(session("publisher", "luisa"), "view-coordinates"), false);
    // E non dipendono dal ruolo: anche un viewer autorizzato le vede.
    assert.equal(hasPermission(session("viewer", "marco"), "view-coordinates"), true);
  });

  test("requirePermission LANCIA invece di ritornare un booleano", () => {
    // Un controllo che ritorna un valore si può dimenticare di leggere, e il caso in cui ci si
    // dimentica è quello in cui l'operazione procede.
    assert.throws(() => requirePermission(null, "read"), /Sessione assente/);
    assert.throws(() => requirePermission(session("viewer"), "publish"), /non può "publish"/);
    assert.equal(requirePermission(session("editor"), "approve-fact").actor, "redazione");
  });
});

// ─────────────────────────────────────────────────────────────
// Operazioni
// ─────────────────────────────────────────────────────────────

function profile(over: Partial<AreaProfile> = {}): AreaProfile {
  return {
    areaKey: AREA_KEY,
    label: "Tradate",
    municipalityAreaKey: AREA_KEY,
    scope: "municipality",
    status: "draft",
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

function fact(over: Partial<AreaFact> & { id: string }): AreaFact {
  return {
    municipality: "Tradate",
    category: "transport",
    scope: "municipality",
    text: "La stazione di Tradate è servita da una linea ferroviaria regionale.",
    translations: [],
    source: {
      url: "https://comune.tradate.va.it/stazione",
      owner: "Comune di Tradate",
      retrievedAt: "2026-08-01T00:00:00.000Z",
    },
    reviewBy: "2027-02-01T00:00:00.000Z",
    status: "draft",
    conflicts: [],
    schemaVersion: AREA_SCHEMA_VERSION,
    ...over,
  };
}

async function serviceWith(facts: AreaFact[] = [fact({ id: "af_1" })]) {
  const repo = new InMemoryAreaRepository();
  await repo.putProfile(profile());
  for (const f of facts) await repo.putFact(AREA_KEY, f);
  const service = new AreaReviewService({
    repo,
    now: () => NOW,
    promptVersion: AREA_PROMPT_VERSION,
  });
  return { repo, service };
}

describe("coda e dettaglio", () => {
  test("la coda mette davanti ciò che aspetta una decisione", async () => {
    const { repo, service } = await serviceWith();
    await repo.putProfile(
      profile({ areaKey: "it|||gallarate|", label: "Gallarate", municipalityAreaKey: "it|||gallarate|" }),
    );
    const rows = await service.queue(session("viewer"));
    assert.equal(rows[0].areaKey, AREA_KEY); // ha un fatto candidato
    assert.equal(rows[0].candidateFacts, 1);
  });

  test("il dettaglio porta i motivi del blocco ACCANTO al fatto", async () => {
    // Un'interfaccia che nasconde i motivi finché non si prova insegna a riprovare, non a
    // correggere.
    const { service } = await serviceWith([
      fact({ id: "af_bloccato", text: "Zona tranquilla e ben servita, ideale per famiglie." }),
    ]);
    const detail = await service.detail(session("editor"), AREA_KEY);
    assert.ok(detail);
    assert.ok(detail.facts[0].violations.length > 0);
    assert.ok(detail.facts[0].violations.some((v) => v.code === "subjective-language"));
  });

  test("senza sessione non si legge niente", async () => {
    const { service } = await serviceWith();
    await assert.rejects(() => service.queue(null), ReviewAuthError);
    await assert.rejects(() => service.detail(null, AREA_KEY), ReviewAuthError);
  });
});

describe("approvazione dei fatti", () => {
  test("un fatto pulito si approva, con nome e istante", async () => {
    const { service, repo } = await serviceWith();
    const approved = await service.approveFact(session("editor", "anna"), {
      areaKey: AREA_KEY,
      factId: "af_1",
    });
    assert.equal(approved.status, "approved");
    assert.equal(approved.approvedBy, "anna");
    const events = await repo.listReviewEvents({ subjectId: "af_1" });
    assert.equal(events[0].action, "approve");
    assert.equal(events[0].actor, "anna");
    assert.ok(events[0].beforeHash && events[0].afterHash);
  });

  test("NESSUN ruolo può approvare un fatto che i guard bocciano", async () => {
    // Non è un fatto su cui manca un'autorizzazione: è un fatto da correggere. Perciò nemmeno
    // il ruolo più ampio può forzarlo, e nemmeno con una motivazione.
    const { service } = await serviceWith([
      fact({ id: "af_1", text: "Zona prestigiosa, la migliore della provincia." }),
    ]);
    await assert.rejects(
      () =>
        service.approveFact(session("publisher"), {
          areaKey: AREA_KEY,
          factId: "af_1",
          reason: "lo vuole il cliente",
        }),
      (err: unknown) => {
        assert.ok(err instanceof ReviewOperationError);
        assert.ok(err.reasons.some((r) => r.startsWith("subjective-language")));
        return true;
      },
    );
  });

  test("i guard rigirano al momento della SCRITTURA, non del disegno della pagina", async () => {
    // Fra il momento in cui la pagina è stata disegnata e quello in cui si preme il pulsante può
    // essere passata un'ora, e in quell'ora la fonte può essere scaduta.
    const { service, repo } = await serviceWith([
      fact({ id: "af_1", reviewBy: "2026-01-01T00:00:00.000Z" }), // già scaduto
    ]);
    await assert.rejects(
      () => service.approveFact(session("editor"), { areaKey: AREA_KEY, factId: "af_1" }),
      /non è approvabile/,
    );
    assert.equal((await repo.getFact("af_1"))?.status, "draft");
  });

  test("un ruolo insufficiente non approva", async () => {
    const { service } = await serviceWith();
    await assert.rejects(
      () => service.approveFact(session("researcher"), { areaKey: AREA_KEY, factId: "af_1" }),
      ReviewAuthError,
    );
  });

  test("un rifiuto senza motivazione non passa", async () => {
    const { service } = await serviceWith();
    await assert.rejects(
      () => service.rejectFact(session("editor"), { areaKey: AREA_KEY, factId: "af_1", reason: "  " }),
      /richiede una motivazione/,
    );
  });

  test("correggere il testo riporta il fatto a BOZZA", async () => {
    // Un fatto approvato il cui testo cambia non è più il fatto che è stato approvato.
    const { service, repo } = await serviceWith();
    await service.approveFact(session("editor"), { areaKey: AREA_KEY, factId: "af_1" });
    assert.equal((await repo.getFact("af_1"))?.status, "approved");

    await service.editFact(session("editor"), {
      areaKey: AREA_KEY,
      factId: "af_1",
      text: "La stazione di Tradate serve la linea Saronno–Varese.",
      reason: "precisata la linea",
    });
    const edited = await repo.getFact("af_1");
    assert.equal(edited?.status, "draft");
    assert.equal(edited?.approvedBy, undefined);
  });
});

describe("narrativa e pubblicazione", () => {
  function narrative(facts: AreaFact[], over: Partial<AreaNarrative> = {}): AreaNarrative {
    return {
      areaKey: AREA_KEY,
      locale: "it",
      title: "Vivere a Tradate",
      intro: Array.from({ length: 70 }, () => "parola").join(" "),
      sections: [
        {
          category: "transport",
          heading: "Mobilità",
          body: "Il collegamento passa dalla stazione, sulla linea regionale.",
          factIds: [facts[0].id],
        },
        {
          category: "municipal-service",
          heading: "Servizi",
          body: "Gli sportelli comunali sono in centro.",
          factIds: [facts[1].id],
        },
      ],
      claimMap: [{ claim: "La stazione serve la linea regionale.", factIds: [facts[0].id] }],
      sourceIdsUsed: ["as_1"],
      factsHash: areaFactsHash(facts, { locale: "it", promptVersion: AREA_PROMPT_VERSION }),
      promptVersion: AREA_PROMPT_VERSION,
      generatedAt: "2026-08-19T10:00:00.000Z",
      status: "draft",
      schemaVersion: AREA_SCHEMA_VERSION,
      ...over,
    };
  }

  async function withApprovedFacts() {
    const approved = {
      status: "approved" as const,
      approvedBy: "redazione",
      approvedAt: "2026-08-10T00:00:00.000Z",
    };
    const facts = [
      fact({ id: "af_1", ...approved }),
      fact({
        id: "af_2",
        category: "municipal-service",
        text: "Gli sportelli anagrafici del Comune sono in centro.",
        source: {
          url: "https://comune.tradate.va.it/anagrafe",
          owner: "Comune di Tradate",
          retrievedAt: "2026-08-01T00:00:00.000Z",
        },
        ...approved,
      }),
    ];
    return { ...(await serviceWith(facts)), facts };
  }

  test("una narrativa sotto soglia non si approva", async () => {
    const { repo, service, facts } = await withApprovedFacts();
    await repo.putNarrative(narrative(facts, { qualityScore: 88 }));
    await assert.rejects(
      () => service.approveNarrative(session("editor"), { areaKey: AREA_KEY }),
      /almeno 95/,
    );
  });

  test("una narrativa senza punteggio non si approva", async () => {
    // Nessun punteggio significa che il cancello non è mai stato eseguito.
    const { repo, service, facts } = await withApprovedFacts();
    await repo.putNarrative(narrative(facts));
    await assert.rejects(
      () => service.approveNarrative(session("editor"), { areaKey: AREA_KEY }),
      /assente/,
    );
  });

  test("una narrativa che i guard bocciano non si approva, punteggio alto o no", async () => {
    const { repo, service, facts } = await withApprovedFacts();
    await repo.putNarrative(narrative(facts, { qualityScore: 100, factsHash: "impronta-vecchia" }));
    await assert.rejects(
      () => service.approveNarrative(session("editor"), { areaKey: AREA_KEY }),
      (err: unknown) => {
        assert.ok(err instanceof ReviewOperationError);
        assert.ok(err.reasons.some((r) => r.startsWith("facts-hash-mismatch")));
        return true;
      },
    );
  });

  test("pubblicare richiede una motivazione", async () => {
    // È l'unica riga che, fra sei mesi, spiega perché quest'area è uscita e un'altra no.
    const { service } = await withApprovedFacts();
    await assert.rejects(
      () => service.publishProfile(session("publisher"), { areaKey: AREA_KEY, reason: "" }),
      /richiede una motivazione/,
    );
  });

  test("non si pubblica un profilo senza fatti approvati", async () => {
    // Pubblicherebbe un'intestazione senza contenuto.
    const { service } = await serviceWith([fact({ id: "af_1" })]);
    await assert.rejects(
      () => service.publishProfile(session("publisher"), { areaKey: AREA_KEY, reason: "pronta" }),
      /Nessun fatto approvato/,
    );
  });

  test("non si pubblica un profilo con una narrativa non approvata", async () => {
    const { repo, service, facts } = await withApprovedFacts();
    await repo.putNarrative(narrative(facts, { qualityScore: 97 }));
    await assert.rejects(
      () => service.publishProfile(session("publisher"), { areaKey: AREA_KEY, reason: "pronta" }),
      /approvarla prima/,
    );
  });

  test("il giro completo: approva narrativa, poi pubblica", async () => {
    const { repo, service, facts } = await withApprovedFacts();
    await repo.putNarrative(narrative(facts, { qualityScore: 97 }));

    await service.approveNarrative(session("editor", "anna"), { areaKey: AREA_KEY });
    const published = await service.publishProfile(session("publisher", "marco"), {
      areaKey: AREA_KEY,
      reason: "fonti verificate, primo comune del pilota",
    });
    assert.equal(published.status, "approved");
    assert.equal(published.approvedBy, "marco");

    const events = await repo.listReviewEvents({ areaKey: AREA_KEY });
    assert.equal(events[0].action, "publish");
    assert.equal(events[0].reason, "fonti verificate, primo comune del pilota");
    // Due persone diverse nelle due decisioni: è la traccia che rende l'audit utile.
    assert.ok(events.some((e) => e.action === "approve" && e.actor === "anna"));
  });

  test("un editor non può pubblicare, un publisher sì", async () => {
    const { repo, service, facts } = await withApprovedFacts();
    await repo.putNarrative(narrative(facts, { qualityScore: 97 }));
    await service.approveNarrative(session("editor"), { areaKey: AREA_KEY });
    await assert.rejects(
      () => service.publishProfile(session("editor"), { areaKey: AREA_KEY, reason: "x" }),
      ReviewAuthError,
    );
    assert.ok(await service.publishProfile(session("publisher"), { areaKey: AREA_KEY, reason: "x" }));
  });

  test("ritirare richiede una motivazione e lascia traccia", async () => {
    const { repo, service, facts } = await withApprovedFacts();
    await repo.putNarrative(narrative(facts, { qualityScore: 97 }));
    await service.approveNarrative(session("editor"), { areaKey: AREA_KEY });
    await service.publishProfile(session("publisher"), { areaKey: AREA_KEY, reason: "pronta" });

    await assert.rejects(
      () => service.unpublishProfile(session("publisher"), { areaKey: AREA_KEY, reason: "" }),
      /richiede una motivazione/,
    );
    const withdrawn = await service.unpublishProfile(session("publisher"), {
      areaKey: AREA_KEY,
      reason: "la stazione ha cambiato linea",
    });
    assert.equal(withdrawn.status, "draft");
  });
});

describe("prove insufficienti", () => {
  test('è uno stato FINALE, non una rinuncia', async () => {
    // Senza, quell'area resterebbe per sempre in coda come se nessuno l'avesse aperta, e la coda
    // smetterebbe di indicare dove c'è lavoro.
    const { service, repo } = await serviceWith([]);
    const marked = await service.markInsufficientEvidence(session("editor"), {
      areaKey: AREA_KEY,
      reason: "il comune non pubblica orari né elenchi di servizi",
    });
    assert.equal(marked.status, "insufficient-evidence");
    const events = await repo.listReviewEvents({ areaKey: AREA_KEY });
    assert.match(events[0].reason ?? "", /non pubblica orari/);
  });

  test("serve una motivazione: dice a chi riaprirà cosa manca", async () => {
    const { service } = await serviceWith([]);
    await assert.rejects(
      () => service.markInsufficientEvidence(session("editor"), { areaKey: AREA_KEY, reason: " " }),
      /motivazione/,
    );
  });
});

describe("rigenerazione", () => {
  test("accoda, non genera", async () => {
    const { service, repo } = await serviceWith();
    assert.equal(
      await service.requestRegeneration(session("editor"), { areaKey: AREA_KEY, reason: "prompt aggiornato" }),
      true,
    );
    const jobs = await repo.listJobs({ state: "pending" });
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].jobType, "generate-narrative");
    assert.equal((await repo.listNarratives()).length, 0);
  });
});

describe("coordinate", () => {
  test("di default nessuno le vede, nemmeno un publisher", async () => {
    const { service } = await serviceWith();
    assert.equal(service.canSeeCoordinates(session("publisher", "anna")), false);
  });

  test("solo chi è nominato esplicitamente", async () => {
    process.env.AREA_REVIEW_COORDINATE_ACCESS = "anna";
    const { service } = await serviceWith();
    assert.equal(service.canSeeCoordinates(session("viewer", "anna")), true);
    assert.equal(service.canSeeCoordinates(session("publisher", "marco")), false);
    assert.equal(service.canSeeCoordinates(null), false);
  });
});
