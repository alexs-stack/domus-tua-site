// Assistente — interfaccia, sicurezza dell'endpoint e integrità dell'insieme di eval.
//
// L'endpoint si prova davvero: si costruisce una Request e si chiama il route handler, come
// farebbe il browser. Il provider non è configurato in CI, quindi ogni turno finisce sul
// ripiego — che è esattamente il caso peggiore da verificare.
//
// L'interfaccia si verifica sul sorgente: le proprietà che contano (target da 44px, safe area,
// reduced motion, un solo aria-live) sono statiche, e un test che le legge non ha bisogno di
// un browser per accorgersi che sono sparite.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { POST } from "../../api/assistant/route";
import { EVAL_CASES, EXPECTED_COUNTS } from "../ai/__evals__/cases";
import { evalContext, SOLD_SLUGS } from "../ai/__evals__/fixtures";
import { runTool, TOOL_NAMES } from "../ai/tools";
import { assistantCopy } from "../../components/assistantCopy";
import { locales } from "../i18n/dictionaries";

const APP = path.join(process.cwd(), "app");
const read = (...p: string[]) => fs.readFileSync(path.join(APP, ...p), "utf8");
const PANEL = read("components", "Assistant.tsx");
const MOUNT = read("components", "AssistantMount.tsx");
const ROUTE = read("api", "assistant", "route.ts");
const CONSENT = read("components", "CookieConsent.tsx");

// Ogni chiamata usa un IP suo: il rate limit è per IP e i test non devono limitarsi a vicenda.
let ipCounter = 0;
function post(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  ipCounter += 1;
  return POST(
    new Request("https://domustua.com/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${ipCounter}`, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

async function sseText(res: Response): Promise<string> {
  return await res.text();
}

// ── Interfaccia ─────────────────────────────────────────────────────────────────────────

describe("assistente UI — comandi della conversazione", () => {
  test("si può interrompere una risposta in corso", () => {
    assert.match(PANEL, /const stop = useCallback\(\(\) => \{\s*\n\s*abortRef\.current\?\.abort\(\);/);
    assert.match(PANEL, /aria-label=\{c\.stop\}/);
    // Il pulsante prende il posto di "invia": una sola azione alla volta, nello stesso punto.
    assert.match(PANEL, /\{loading \? \(/);
  });

  test("si può ricominciare da capo", () => {
    assert.match(PANEL, /const newChat = useCallback/);
    assert.match(PANEL, /aria-label=\{c\.newChat\}/);
    // Ricominciare interrompe il turno in corso, altrimenti la vecchia risposta atterra nella
    // conversazione nuova.
    assert.match(PANEL, /const newChat = useCallback\(\(\) => \{\s*\n\s*abortRef\.current\?\.abort\(\);/);
  });

  test("riprova resta disponibile su ogni turno non concluso", () => {
    assert.match(PANEL, /onClick=\{retry\}/);
    assert.match(PANEL, /disabled=\{loading \|\| offline\}/);
  });

  test("senza connessione lo dice invece di far scrivere invano", () => {
    assert.match(PANEL, /window\.addEventListener\("offline", sync\)/);
    assert.match(PANEL, /navigator\.onLine === false/);
    assert.match(PANEL, /role="status"/);
    assert.match(PANEL, /disabled=\{!input\.trim\(\) \|\| offline\}/);
  });

  test("tre canali umani distinti, sempre raggiungibili", () => {
    assert.match(PANEL, /href=\{site\.email\.href\}/);
    assert.match(PANEL, /href=\{site\.whatsapp\.href\}/);
    assert.match(PANEL, /href=\{site\.phone\.href\}/);
    // WhatsApp apre un'altra scheda: mai senza noopener.
    assert.match(PANEL, /rel="noopener noreferrer"/);
  });
});

describe("assistente UI — accessibilità e mobile", () => {
  test("dialog modale con titolo, Escape e trap del Tab", () => {
    assert.match(PANEL, /role="dialog"/);
    assert.match(PANEL, /aria-modal="true"/);
    assert.match(PANEL, /aria-labelledby="assistant-title"/);
    assert.match(PANEL, /e\.key === "Escape"/);
    assert.match(PANEL, /e\.key !== "Tab"/);
  });

  test("il focus torna al launcher alla chiusura", () => {
    assert.match(MOUNT, /launcherRef\.current\?\.focus\(\)/);
    assert.match(PANEL, /\(inputRef\.current \?\? dialogRef\.current\)\?\.focus\(\)/);
  });

  test("un solo aria-live, e annuncia la risposta una volta sola", () => {
    assert.equal(PANEL.match(/aria-live=/g)?.length, 1);
    // Lo stato si scrive a turno finito, non a ogni pezzo dello stream.
    assert.doesNotMatch(PANEL, /setLiveReply\(acc\);\s*\n\s*push\(\)/);
    assert.match(PANEL, /className="sr-only"/);
  });

  test("i target touch arrivano a 44px", () => {
    // h-11 = 44px, h-14 = 56px (launcher).
    for (const cls of ["h-11 w-11", "min-h-11"]) assert.ok(PANEL.includes(cls), `manca ${cls}`);
    assert.match(MOUNT, /h-14 w-14/);
  });

  test("100dvh e safe area: la barra del browser non copre il pannello", () => {
    assert.match(PANEL, /env\(safe-area-inset-bottom\)/);
    assert.match(PANEL, /100dvh/);
  });

  test("le animazioni rispettano reduced motion", () => {
    assert.match(PANEL, /motion-safe:animate-bounce/);
    assert.match(MOUNT, /motion-safe:hover:scale-105/);
    assert.doesNotMatch(PANEL, /(?<!motion-safe:)animate-bounce/);
  });

  test("il pannello arriva solo all'apertura", () => {
    assert.match(MOUNT, /dynamic\(\(\) => import\("\.\/Assistant"\), \{ ssr: false \}\)/);
    assert.match(MOUNT, /\{mounted && <AssistantPanel/);
    assert.match(MOUNT, /const openPanel = useCallback\(\(\) => \{\s*\n\s*setMounted\(true\);/);
    // Il launcher non importa il pannello nemmeno per i testi.
    assert.match(MOUNT, /from "\.\/assistantCopy"/);
  });
});

describe("assistente UI — niente sovrapposizioni", () => {
  test("launcher e banner cookie non convivono", () => {
    assert.match(MOUNT, /const consentOpen = useOverlayOpen\("consent"\)/);
    assert.match(MOUNT, /const launcherHidden = open \|\| consentOpen/);
    assert.match(CONSENT, /setOverlayOpen\("consent", visible\)/);
  });

  test("mentre la chat è aperta il banner si ritira", () => {
    assert.match(PANEL, /setOverlayOpen\("assistant", open\)/);
    assert.match(CONSENT, /useOverlayOpen\("assistant"\)/);
  });

  test("il launcher sta sopra la barra azioni mobile e la sede WhatsApp", () => {
    // Barra mobile: bottom ~0.75rem + 52px ≈ 4rem. WhatsApp desktop: bottom-5, ~3.75rem alto.
    assert.match(MOUNT, /fixed bottom-24 right-5 z-50/);
    // Il pannello sta sopra entrambi e sopra il banner (z-[60]).
    assert.match(PANEL, /z-\[70\]/);
  });
});

describe("assistente UI — testi richiesti", () => {
  test("saluto e suggerimenti sono quelli approvati", () => {
    assert.equal(
      assistantCopy.it.greeting,
      "Ciao! Sono l’assistente di Domus Tua. Posso aiutarti a trovare casa, capire come vendere o rispondere alle domande più comuni. Come posso aiutarti?",
    );
    assert.deepEqual(assistantCopy.it.suggestions, [
      "Cerco una villa",
      "Vorrei vendere casa",
      "Come funziona Open Domus?",
      "Voglio parlare con voi",
    ]);
  });

  test("ogni lingua ha tutti i testi, nessuno vuoto", () => {
    for (const l of locales) {
      const c = assistantCopy[l];
      assert.equal(c.suggestions.length, 4, `${l}: servono 4 suggerimenti`);
      for (const [k, v] of Object.entries(c)) {
        if (typeof v === "string") assert.ok(v.trim().length > 0, `${l}.${k} vuoto`);
      }
      for (const [k, v] of Object.entries(c.contact)) {
        assert.ok(v.trim().length > 0, `${l}.contact.${k} vuoto`);
      }
    }
  });
});

// ── Sicurezza dell'endpoint ─────────────────────────────────────────────────────────────

describe("assistente — l'endpoint sotto attacco", () => {
  test("payload enorme: rifiutato prima di leggerlo", async () => {
    const res = await post({ locale: "it", messages: [] }, { "content-length": "900000" });
    assert.equal(res.status, 413);
  });

  test("JSON malformato: 400, non un'eccezione", async () => {
    const res = await post("{ questo non è json");
    assert.equal(res.status, 400);
  });

  test("messaggi assenti o vuoti: 400", async () => {
    assert.equal((await post({ locale: "it" })).status, 400);
    assert.equal((await post({ locale: "it", messages: [] })).status, 400);
    assert.equal((await post({ locale: "it", messages: [{ role: "user", content: "   " }] })).status, 400);
  });

  test("ruolo falsificato: diventa un turno utente, non un'istruzione di sistema", () => {
    assert.match(ROUTE, /role: m\.role === "assistant" \? "assistant" : "user"/);
    // Nessun ramo che accetti "system" dal client.
    assert.doesNotMatch(ROUTE, /=== "system"/);
  });

  test("spam: due finestre, una lunga e una contro la raffica", async () => {
    assert.match(ROUTE, /ASSISTANT_BURST_LIMIT/);
    let limited = false;
    for (let i = 0; i < 8; i++) {
      const res = await POST(
        new Request("https://domustua.com/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "10.9.9.9" },
          body: JSON.stringify({ locale: "it", messages: [{ role: "user", content: "ciao" }] }),
        }),
      );
      if (res.status === 429) {
        limited = true;
        assert.ok(res.headers.get("retry-after"), "429 senza retry-after");
        break;
      }
    }
    assert.ok(limited, "otto richieste di fila non hanno mai incontrato il limite");
  });

  test("caratteri di controllo e invisibili vengono rimossi", () => {
    assert.match(ROUTE, /function sanitize\(text: string\): string/);
    assert.match(ROUTE, /u200b-\\u200f/);
    assert.match(ROUTE, /content: sanitize\(m\.content\.slice\(0, MAX_LEN\)\)/);
  });

  test("la risposta è sempre uno stream, anche in errore", async () => {
    const res = await post({ locale: "it", messages: [{ role: "user", content: "Cerco una villa" }] });
    assert.match(res.headers.get("content-type") ?? "", /text\/event-stream/);
    assert.equal(res.headers.get("cache-control"), "no-store");
    const body = await sseText(res);
    assert.match(body, /^data: \{/);
  });

  test("nessuna traccia della conversazione nei log", () => {
    // Si logga l'esito, mai il contenuto: niente m.content, niente history, niente body.
    const logs = ROUTE.match(/console\.\w+\([^)]*\)/g) ?? [];
    for (const l of logs) {
      assert.doesNotMatch(l, /content|history|body|messages/, `log con contenuto: ${l}`);
    }
  });
});

describe("assistente — HTML e URL", () => {
  test("le risposte non vengono mai interpretate come markup", () => {
    assert.doesNotMatch(PANEL, /dangerouslySetInnerHTML/);
    // Il testo passa da <p>: React lo scrive come testo, non come HTML.
    assert.match(PANEL, /m\.content\.split\("\\n"\)\.map/);
  });

  test("una scheda può puntare solo a una pagina immobile del sito", () => {
    assert.match(PANEL, /\/\^\\\/case\\\/\[a-z0-9-\]\+\$\/i\.test\(p\.url\)/);
    assert.match(PANEL, /isDisplayableImage\(p\.cover\)/);
  });
});

// ── Insieme di eval ─────────────────────────────────────────────────────────────────────

describe("eval — integrità dell'insieme", () => {
  test("cento casi, ripartiti come richiesto", () => {
    assert.equal(EVAL_CASES.length, 100);
    for (const [cat, n] of Object.entries(EXPECTED_COUNTS)) {
      assert.equal(EVAL_CASES.filter((c) => c.category === cat).length, n, `categoria ${cat}`);
    }
  });

  test("identificatori unici e strumenti esistenti", () => {
    const ids = EVAL_CASES.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, "identificatori duplicati");
    for (const c of EVAL_CASES) {
      if (c.expectTool !== null) assert.ok(TOOL_NAMES.includes(c.expectTool), `${c.id}: strumento ignoto`);
      assert.equal(c.messages[c.messages.length - 1].role, "user", `${c.id}: l'ultimo turno non è dell'utente`);
    }
  });

  test("nessuna ricerca dell'insieme fa uscire un venduto", async () => {
    const ctx = evalContext();
    const queries = EVAL_CASES.filter((c) => c.expectTool === "search_listings").map(
      (c) => c.messages[c.messages.length - 1].content,
    );
    assert.ok(queries.length >= 30, "troppo poche ricerche nell'insieme");
    for (const q of queries) {
      const out = await runTool("search_listings", { query: q }, ctx);
      const slugs = (out.listings ?? []).map((l) => l.slug);
      for (const s of SOLD_SLUGS) assert.ok(!slugs.includes(s), `"${q}" ha restituito il venduto ${s}`);
      assert.ok(slugs.length <= 4, `"${q}" ha restituito ${slugs.length} risultati`);
    }
  });
});
