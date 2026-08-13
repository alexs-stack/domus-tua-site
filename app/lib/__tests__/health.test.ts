// /api/health — forma della risposta e regola che la governa.
//
// L'endpoint esiste per rispondere a "com'è configurato questo ambiente?" senza aprire la
// dashboard di Vercel. Vale solo se si può interrogare da fuori, quindi vale solo se **non
// espone niente di segreto**: questo test è il guardiano di quella regola.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { GET } from "../../api/health/route";

const ROUTE = fs.readFileSync(
  path.join(process.cwd(), "app", "api", "health", "route.ts"),
  "utf8",
);

async function payload(): Promise<Record<string, unknown>> {
  const res = await GET();
  return (await res.json()) as Record<string, unknown>;
}

/** Tutte le foglie del JSON, con il loro percorso. */
function leaves(value: unknown, prefix = ""): [string, unknown][] {
  if (value === null || typeof value !== "object") return [[prefix, value]];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    leaves(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("/api/health — niente segreti", () => {
  test("le uniche stringhe sono metadati pubblici", async () => {
    const body = await payload();
    // Stringhe ammesse: sono pubbliche per definizione o innocue.
    const allowed = [
      "timestamp",
      "deploy.commit",
      "deploy.environment",
      "deploy.siteUrl",
      "deploy.nodeEnv",
      "integrations.listingsMode",
      "integrations.assistant.model",
    ];
    for (const [key, value] of leaves(body)) {
      if (typeof value !== "string") continue;
      assert.ok(allowed.includes(key), `stringa non prevista in /api/health: ${key} = ${value}`);
    }
  });

  test("nessun valore somiglia a una chiave o a un URL con credenziali", async () => {
    const raw = JSON.stringify(await payload());
    for (const pattern of [/sk-[a-z0-9]/i, /re_[a-zA-Z0-9]{10}/, /api[_-]?key/i, /:\/\/[^/]*:[^@]*@/]) {
      assert.doesNotMatch(raw, pattern, `/api/health espone qualcosa che sembra un segreto`);
    }
  });

  test("la risposta non finisce in cache", async () => {
    const res = await GET();
    assert.equal(res.headers.get("cache-control"), "no-store");
  });
});

describe("/api/health — cosa deve dichiarare", () => {
  test("il blocco deploy dice commit, ambiente, indirizzo e badge", async () => {
    const body = (await payload()) as { deploy: Record<string, unknown> };
    for (const key of ["commit", "environment", "siteUrl", "nodeEnv", "previewBadge"]) {
      assert.ok(key in body.deploy, `manca deploy.${key}`);
    }
    assert.equal(typeof body.deploy.previewBadge, "boolean");
  });

  test("le integrazioni coprono tutto ciò che va verificato dopo un deploy", async () => {
    const body = (await payload()) as { integrations: Record<string, unknown> };
    for (const key of [
      "realsmart",
      "soldMap",
      "leadDelivery",
      "trustindexLive",
      "heroVideoLive",
      "semanticRankingConfigured",
      "assistant",
    ]) {
      assert.ok(key in body.integrations, `manca integrations.${key}`);
    }
  });

  test("il semantico della knowledge base è dichiarato a parte da quello della ricerca", async () => {
    // Erano lo stesso campo, e per un po' erano anche lo stesso valore. Dal 2026-08-06 no:
    // gli embeddings esistono e il ranking immobili li usa, ma sulla knowledge base il
    // livello semantico è spento di proposito (vedi docs/assistant-knowledge.md). Un health
    // che dicesse "configurato" di una cosa deliberatamente spenta manderebbe fuori strada
    // proprio chi sta controllando un deploy.
    const body = (await payload()) as {
      integrations: {
        semanticRankingConfigured: boolean;
        assistant: { knowledgeSemanticConfigured: boolean };
      };
    };
    const { semanticRankingConfigured, assistant } = body.integrations;
    assert.equal(typeof assistant.knowledgeSemanticConfigured, "boolean");
    if (!process.env.ASSISTANT_SEMANTIC_FLOOR) {
      assert.equal(
        assistant.knowledgeSemanticConfigured,
        false,
        "senza soglia misurata il semantico sulla knowledge base non è configurato",
      );
    }
    // Il contrario invece resta possibile: ranking acceso e knowledge spenta è lo stato
    // normale, ma knowledge accesa senza embeddings non lo è mai.
    if (assistant.knowledgeSemanticConfigured) {
      assert.ok(semanticRankingConfigured, "knowledge semantica senza provider di embeddings");
    }
  });

  test("la mappa dei venduti è dichiarata con i suoi numeri", async () => {
    const body = (await payload()) as {
      integrations: { soldMap: { present: boolean; detected: number; manual: number } };
    };
    const m = body.integrations.soldMap;
    assert.equal(typeof m.present, "boolean");
    assert.equal(typeof m.detected, "number");
    assert.equal(typeof m.manual, "number");
    // Nel repository la mappa c'è: se sparisce, un venduto può tornare fra i disponibili.
    assert.equal(m.present, true);
  });

  test("la consegna lead è dichiarata canale per canale, in modo veritiero", async () => {
    const body = (await payload()) as {
      integrations: {
        leadDelivery: { email: boolean; sheet: boolean; whatsapp: boolean; serverDelivered: boolean };
      };
    };
    const d = body.integrations.leadDelivery;
    // WhatsApp NON è una consegna server: la verità è che serverDelivered = email || sheet.
    for (const k of ["email", "sheet", "whatsapp", "serverDelivered"] as const) {
      assert.equal(typeof d[k], "boolean", `leadDelivery.${k} deve essere booleano`);
    }
    assert.equal(d.serverDelivered, d.email || d.sheet, "serverDelivered deve derivare da email/sheet");
    // L'endpoint riporta lo stato, non lo decide: nessun nome di variabile d'ambiente né
    // dettaglio del provider deve comparire nel suo sorgente.
    for (const leak of ["SHEETS_WEBHOOK_URL", "Apps Script", "RESEND_API_KEY"]) {
      assert.ok(!ROUTE.toLowerCase().includes(leak.toLowerCase()), `riferimento residuo: ${leak}`);
    }
  });
});
