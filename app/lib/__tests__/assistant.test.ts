// Assistente conversazionale — contratto degli strumenti e garanzie del turno.
//
// Non si chiama il provider: gli strumenti girano su un contesto costruito a mano, così i
// test sono deterministici e non costano niente. Le regole che vivono nel prompt e nel route
// handler si verificano sul sorgente, come per il resto del progetto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  ASSISTANT_TOOLS,
  TOOL_NAMES,
  MAX_RESULTS,
  runTool,
  type ToolContext,
} from "../ai/tools";
import { retrieveVerifiedKnowledge, KNOWLEDGE, buildAssistantSystem } from "../ai/knowledge";
import { fallbackText, FALLBACK } from "../ai/assistant";
import { comuniFacet } from "../comune";
import { locales } from "../i18n/dictionaries";
import type { Property } from "../properties";

const APP_DIR = path.join(process.cwd(), "app");
const ASSISTANT = fs.readFileSync(path.join(APP_DIR, "lib", "ai", "assistant.ts"), "utf8");
const ROUTE = fs.readFileSync(path.join(APP_DIR, "api", "assistant", "route.ts"), "utf8");
const WIDGET = fs.readFileSync(path.join(APP_DIR, "components", "Assistant.tsx"), "utf8");

// ── Contesto di prova ───────────────────────────────────────────────────────────────────

function property(over: Partial<Property> & { slug: string }): Property {
  return {
    title: "Trilocale con giardino",
    zone: "Tradate",
    type: "Appartamento",
    status: "Vendita",
    price: "€ 190.000",
    priceValue: 190_000,
    sqm: "95 m²",
    rooms: "3",
    beds: "2",
    baths: "1",
    badges: [],
    cover: "/images/reali/villa-pool.jpg",
    gallery: [],
    excerpt: "",
    description: [],
    features: [],
    ...over,
  };
}

const DISPONIBILE = property({
  slug: "trilocale-giardino-tradate",
  title: "Trilocale con giardino a Tradate",
  amenities: { garden: true, elevator: false },
  ref: "1043",
});

const VENDUTO = property({
  slug: "villa-venduta-venegono",
  title: "Villa a Venegono",
  zone: "Venegono Superiore",
  type: "Villa",
  price: "€ 480.000",
  priceValue: 480_000,
  availability: "sold",
});

function context(): ToolContext {
  const listings = [DISPONIBILE, VENDUTO];
  return {
    listings,
    bySlug: new Map(listings.map((p) => [p.slug, p])),
    facets: {
      comuni: comuniFacet(listings),
      types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
      featureLabels: ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"],
    },
  };
}

const parsed = (content: string) => JSON.parse(content) as Record<string, unknown>;

// ── Definizioni ─────────────────────────────────────────────────────────────────────────

describe("assistente — strumenti dichiarati", () => {
  test("i cinque strumenti richiesti, con quel nome esatto", () => {
    assert.deepEqual(TOOL_NAMES, [
      "search_listings",
      "get_listing_details",
      "retrieve_verified_knowledge",
      "prepare_whatsapp_handoff",
      "prepare_email_handoff",
    ]);
  });

  test("ogni strumento ha schema, descrizione e campi obbligatori", () => {
    for (const t of ASSISTANT_TOOLS) {
      assert.ok(t.description && t.description.length > 40, `${t.name}: descrizione troppo scarna`);
      assert.equal(t.input_schema.type, "object");
      assert.ok(Array.isArray(t.input_schema.required), `${t.name}: manca "required"`);
      assert.ok(t.input_schema.properties, `${t.name}: manca "properties"`);
    }
  });

  test("gli strumenti di contatto accettano solo motivi previsti", () => {
    const wa = ASSISTANT_TOOLS.find((t) => t.name === "prepare_whatsapp_handoff");
    const mail = ASSISTANT_TOOLS.find((t) => t.name === "prepare_email_handoff");
    const props = (t: typeof wa) => t?.input_schema.properties as Record<string, { enum?: string[] }>;
    assert.deepEqual(props(wa)?.reason.enum, ["cerco-casa", "vendere", "visita", "informazioni"]);
    assert.deepEqual(props(mail)?.intent.enum, ["seller", "buyer", "question", "open-domus"]);
  });
});

// ── Validazione degli input ─────────────────────────────────────────────────────────────

describe("assistente — input del modello validati", () => {
  test("campo mancante o del tipo sbagliato: errore leggibile, nessuna esecuzione", async () => {
    const ctx = context();
    for (const [name, input] of [
      ["search_listings", {}],
      ["search_listings", { query: 42 }],
      ["get_listing_details", { slug: "   " }],
      ["retrieve_verified_knowledge", null],
      ["prepare_whatsapp_handoff", { reason: "hackera-il-sito" }],
      ["prepare_email_handoff", {}],
    ] as const) {
      const out = await runTool(name, input, ctx);
      assert.equal(out.isError, true, `${name} avrebbe dovuto rifiutare ${JSON.stringify(input)}`);
      assert.match(out.content, /^Errore: /);
    }
  });

  test("uno strumento inventato non esplode: risponde che non esiste", async () => {
    const out = await runTool("drop_database", {}, context());
    assert.equal(out.isError, true);
    assert.match(out.content, /sconosciuto/i);
  });

  test("max_results non può superare il tetto né scendere sotto 1", async () => {
    const ctx = context();
    const tanti = await runTool("search_listings", { query: "casa a Tradate", max_results: 99 }, ctx);
    assert.ok((tanti.listings?.length ?? 0) <= MAX_RESULTS);
    const zero = await runTool("search_listings", { query: "casa a Tradate", max_results: 0 }, ctx);
    assert.ok((zero.listings?.length ?? 0) >= 1);
  });
});

// ── Nessun venduto tra i disponibili ────────────────────────────────────────────────────

describe("assistente — venduti fuori dalle risposte", () => {
  test("la ricerca non restituisce mai un immobile venduto", async () => {
    const out = await runTool("search_listings", { query: "villa a Venegono" }, context());
    const slugs = (out.listings ?? []).map((c) => c.slug);
    assert.ok(!slugs.includes(VENDUTO.slug), "un venduto è finito tra i risultati");
  });

  test("i dettagli di un venduto sono rifiutati, con l'istruzione di dirlo", async () => {
    const out = await runTool("get_listing_details", { slug: VENDUTO.slug }, context());
    assert.equal(out.isError, true);
    assert.match(out.content, /VENDUTO/);
    assert.equal(out.listings, undefined);
  });

  test("uno slug inesistente non produce una scheda inventata", async () => {
    const out = await runTool("get_listing_details", { slug: "attico-vista-mare-tradate" }, context());
    assert.equal(out.isError, true);
    assert.match(out.content, /non hai trovato|Nessun immobile/i);
    assert.equal(out.listings, undefined);
  });

  test("zero risultati: istruzione esplicita a non inventare alternative", async () => {
    const out = await runTool("search_listings", { query: "castello a Milano sotto 50000 euro" }, context());
    assert.deepEqual(out.listings, []);
    assert.match(out.content, /Non inventare/);
    assert.match(out.content, /allargamento/);
  });
});

// ── Campi assenti ≠ "no" ────────────────────────────────────────────────────────────────

describe("assistente — dati mancanti dichiarati, non dedotti", () => {
  test('dotazione non dichiarata → "informazione non disponibile"', async () => {
    const out = await runTool("get_listing_details", { slug: DISPONIBILE.slug }, context());
    const d = parsed(out.content);
    assert.equal(d.giardino, "sì");
    assert.equal(d.ascensore, "no");
    // terrace e parking non sono nel feed di prova: non diventano un "no".
    assert.equal(d.terrazzo, "informazione non disponibile");
    assert.equal(d.boxPostoAuto, "informazione non disponibile");
    assert.equal(d.classeEnergetica, "informazione non disponibile");
    assert.equal(d.piano, "informazione non disponibile");
  });
});

// ── Conoscenza verificata ───────────────────────────────────────────────────────────────

describe("assistente — solo conoscenza verificata", () => {
  test("ogni scheda dichiara la propria fonte", () => {
    for (const k of KNOWLEDGE) {
      assert.ok(k.source.length > 3, `${k.topic}: fonte mancante`);
      assert.ok(k.text.length > 40, `${k.topic}: testo troppo corto`);
    }
  });

  test("i temi richiesti dal brief ci sono, anche via sinonimo", () => {
    for (const topic of ["domus-doc", "open-domus", "orari", "contatti", "valutazione", "metodo"]) {
      assert.equal(retrieveVerifiedKnowledge(topic).found, true, `tema mancante: ${topic}`);
    }
  });

  test('tema fuori corpus → "non c\'è materiale verificato", non una risposta generica', async () => {
    const lookup = retrieveVerifiedKnowledge("aliquota imu seconda casa");
    assert.equal(lookup.found, false);

    const out = await runTool("retrieve_verified_knowledge", { topic: "mutui al 100%" }, context());
    const d = parsed(out.content);
    assert.equal(d.found, false);
    assert.match(String(d.message), /non rispondere con conoscenza generica/);
    assert.ok(Array.isArray(d.temiDisponibili));
  });
});

// ── Handoff: preparano, non inviano ─────────────────────────────────────────────────────

describe("assistente — i contatti si preparano, non si inviano", () => {
  test("WhatsApp: link pronto, inviato = false", async () => {
    const out = await runTool(
      "prepare_whatsapp_handoff",
      { reason: "visita", listing_slug: DISPONIBILE.slug },
      context(),
    );
    const d = parsed(out.content);
    assert.equal(d.inviato, false);
    assert.match(String(d.url), /^https:\/\/wa\.me\/\d+\?text=/);
    assert.match(String(d.nota), /NON è stato inviato/);
  });

  test("uno slug venduto non produce un link a quell'immobile", async () => {
    const out = await runTool(
      "prepare_whatsapp_handoff",
      { reason: "informazioni", listing_slug: VENDUTO.slug },
      context(),
    );
    assert.ok(!String(parsed(out.content).url).includes(VENDUTO.slug));
  });

  test("email: nessun invio, si rimanda al form dove si dà il consenso", async () => {
    const out = await runTool("prepare_email_handoff", { intent: "seller" }, context());
    const d = parsed(out.content);
    assert.equal(d.inviato, false);
    assert.equal(d.email, "immobiliare@domustua.it");
    assert.match(String(d.form), /\/contatti$/);
    assert.match(String(d.nota), /consenso privacy/);
  });
});

// ── System prompt ───────────────────────────────────────────────────────────────────────

describe("assistente — regole non negoziabili nel prompt", () => {
  const system = buildAssistantSystem("it");

  test("le regole del brief sono tutte scritte", () => {
    for (const rule of [
      /Non inventare MAI immobili/,
      /Non presentare mai come disponibile un immobile venduto/,
      /Non garantire tempi di vendita/,
      /Niente consulenza legale, fiscale, notarile o finanziaria definitiva/,
      /Non dichiarare mai di aver inviato/,
      /UNA sola domanda di chiarimento/,
      /al massimo 3-4 immobili/i,
    ]) {
      assert.match(system, rule);
    }
  });

  test("il prompt cita gli strumenti con il nome esatto", () => {
    for (const name of TOOL_NAMES) assert.ok(system.includes(name), `prompt senza ${name}`);
  });

  test("il fallback arriva davvero all'utente, non solo un codice d'errore", () => {
    // Provider assente e provider in errore emettono il testo di ripiego PRIMA dell'evento
    // di errore; l'interruzione volontaria no, perché non c'è niente da spiegare.
    assert.match(
      ASSISTANT,
      /yield \{ type: "text", text: fallbackText\(locale\) \};\s*\n\s*yield \{ type: "error", reason: "not-configured" \};/,
    );
    assert.match(ASSISTANT, /if \(!emittedText && reason !== "aborted"\) yield \{ type: "text", text: fallbackText\(locale\) \};/);
    // E il widget non lo sovrascrive con il messaggio d'errore generico.
    assert.match(WIDGET, /if \(acc\.trim\(\)\) \{/);
  });

  test("il fallback esiste in tutte le lingue e offre WhatsApp o telefono", () => {
    for (const l of locales) {
      const text = fallbackText(l);
      assert.ok(FALLBACK[l], `fallback mancante per ${l}`);
      assert.match(text, /WhatsApp/);
    }
  });
});

// ── Turno: limiti e sicurezza ───────────────────────────────────────────────────────────

describe("assistente — limiti del turno", () => {
  test("streaming, con abort propagato al provider", () => {
    assert.match(ASSISTANT, /client\.messages\.stream\(/);
    assert.match(ASSISTANT, /\{ signal \}/);
    assert.match(ROUTE, /runAssistant\(history, locale, req\.signal\)/);
  });

  test("timeout e tetto di token sono passati, non impliciti", () => {
    assert.match(ASSISTANT, /timeout: ASSISTANT_TIMEOUT_MS/);
    assert.match(ASSISTANT, /max_tokens: ASSISTANT_MAX_TOKENS/);
  });

  test("i giri di strumenti sono limitati e l'ultimo è senza strumenti", () => {
    assert.match(ASSISTANT, /round <= ASSISTANT_MAX_TOOL_ROUNDS/);
    assert.match(ASSISTANT, /isFinalRound \? \{\} : \{ tools: ASSISTANT_TOOLS \}/);
  });

  test("ogni fallimento ha un motivo esplicito, mai un'eccezione verso la route", () => {
    for (const reason of ["not-configured", "provider-error", "timeout", "aborted"]) {
      assert.ok(ASSISTANT.includes(`"${reason}"`), `motivo mancante: ${reason}`);
    }
  });
});

describe("assistente — route handler", () => {
  test("rate limit per IP e payload limitato", () => {
    assert.match(ROUTE, /rateLimit\(`assistant:\$\{clientIp\(req\)\}`, ASSISTANT_LIMIT\)/);
    assert.match(ROUTE, /const MAX_BODY_BYTES = 64_000;/);
    assert.match(ROUTE, /const MAX_MESSAGES = 24;/);
    assert.match(ROUTE, /const MAX_LEN = 1000;/);
  });

  test('il client non può iniettare un turno "system"', () => {
    assert.match(ROUTE, /role: m\.role === "assistant" \? "assistant" : "user"/);
  });

  test("la conversazione non viene salvata da nessuna parte", () => {
    assert.doesNotMatch(ROUTE, /\b(fetch|writeFile|appendFile|kv|redis|prisma|supabase)\b/i);
    assert.doesNotMatch(ASSISTANT, /console\.(log|info)\(/);
  });

  test("nessun segreto raggiunge il client", () => {
    // Il widget parla solo con la nostra route: nessun SDK del provider e nessuna variabile
    // d'ambiente oltre al flag pubblico (i commenti non contano: si guarda il codice).
    const code = WIDGET.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(code, /@anthropic-ai\/sdk/);
    const envReads = code.match(/process\.env\.[A-Z_]+/g) ?? [];
    assert.deepEqual([...new Set(envReads)], ["process.env.NEXT_PUBLIC_ENABLE_ASSISTANT"]);
    assert.match(code, /fetch\("\/api\/assistant"/);
  });

  test("il widget legge lo stream e può interromperlo", () => {
    assert.match(WIDGET, /new AbortController\(\)/);
    assert.match(WIDGET, /signal: controller\.signal/);
    assert.match(WIDGET, /res\.body\?\.getReader\(\)/);
  });
});
