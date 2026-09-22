// Il ripristino dello scroll alla ricarica è un salto, non una corsa (e2e/home.spec.ts, Voci, D22).
//
// `html { scroll-behavior: smooth }` (globals.css) vale anche per il ripristino nativo del
// browser: quando Chromium lo esegue dopo il primo paint, la pagina scivola dalla cima alla
// quota salvata (misurato a 390×664: 0 → 6228 px in ~1,3 s, dal load in poi) e ciò che si arma
// all'idratazione — l'IO di Voci, i reveal — trova la pagina a metà strada. Con lo scroll
// istantaneo il ripristino arriva già durante il parsing, prima dell'idratazione. Alla ricarica e
// al back/forward il boot script del layout marca <html data-ripristino> e la CSS rimette lo
// scroll istantaneo per tutta la visita (mai a tempo: ScrollTrigger legge scroll-behavior una
// volta sola, alla nascita dello scroller, e protegge i suoi refresh solo se allora era smooth).
// L'arrivo all'ancora di una navigazione nuova (/#contatti, D45) resta morbido.
//
// Il boot script si esegue davvero, in un DOM finto: conta cosa fa, non come è scritto.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as C from "../motion/intro-constants";

const root = join(__dirname, "..", "..", "..");
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
const css = readFileSync(join(root, "app/globals.css"), "utf8");

/** Il boot script con le costanti interpolate come nel build (DIVE_S e SKIP_TAIL_MS come in layout.tsx). */
function bootScript(): string {
  const m = layout.match(/const preloaderBootScript = `([^`]*)`/);
  assert.ok(m, "preloaderBootScript non trovato in app/layout.tsx");
  const valori: Record<string, string | number> = {
    INTRO_KEY: C.INTRO_KEY,
    INTRO_FILM: C.INTRO_FILM,
    INTRO_SHORT: C.INTRO_SHORT,
    INTRO_QUIET: C.INTRO_QUIET,
    LAST_Y_KEY: C.LAST_Y_KEY,
    RELOAD_KEEP_Y: C.RELOAD_KEEP_Y,
    PRE_FAILSAFE_MS: C.PRE_FAILSAFE_MS,
    PRE_SHORT_FAILSAFE_MS: C.PRE_SHORT_FAILSAFE_MS,
    DIVE_S: C.INTRO_T.dive,
    SKIP_TAIL_MS: Math.round((C.INTRO_T.diveDur + 0.35) * 1000),
  };
  return m![1].replace(/\$\{(\w+)\}/g, (_, nome: string) => {
    assert.ok(nome in valori, `interpolazione nuova nel boot script: ${nome}`);
    return String(valori[nome]);
  });
}

type Esito = { attributi: Map<string, string>; scrollRestoration: string };

/** Esegue il boot script su «/» con il tipo di navigazione, l'ancora e la chiave dell'intro dati. */
function esegui(nav: string, { hash = "", chiave = C.INTRO_QUIET as string | null } = {}): Esito {
  const attributi = new Map<string, string>();
  const html = {
    setAttribute: (k: string, v: string) => void attributi.set(k, v),
    getAttribute: (k: string) => attributi.get(k) ?? null,
    hasAttribute: (k: string) => attributi.has(k),
    removeAttribute: (k: string) => void attributi.delete(k),
    style: { setProperty() {} },
  };
  const storia = { scrollRestoration: "auto" };
  const finto: Record<string, unknown> = {
    document: {
      documentElement: html,
      cookie: "",
      visibilityState: "visible",
      prerendering: false,
      head: { appendChild() {} },
      createElement: () => ({ setAttribute() {} }),
    },
    location: { hash, pathname: "/", search: "" },
    performance: { getEntriesByType: () => [{ type: nav }], now: () => 0 },
    matchMedia: () => ({ matches: true }),
    sessionStorage: { getItem: (k: string) => (k === C.INTRO_KEY ? chiave : null), setItem() {}, removeItem() {} },
    innerHeight: 664,
    CSS: { registerProperty() {}, supports: () => true },
    history: storia,
    addEventListener() {},
    removeEventListener() {},
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    requestAnimationFrame() {},
    setTimeout: () => 0,
    clearTimeout() {},
    scrollY: 0,
    scrollTo() {},
  };
  finto.window = finto;
  new Function(...Object.keys(finto), bootScript())(...Object.values(finto));
  return { attributi, scrollRestoration: storia.scrollRestoration };
}

describe("il ripristino dello scroll alla ricarica è istantaneo (Voci, D22)", () => {
  for (const nav of ["reload", "back_forward"]) {
    test(`${nav}: il boot script marca <html data-ripristino>`, () => {
      const { attributi } = esegui(nav);
      // L'ultima riga del boot script è arrivata: il DOM finto regge tutto lo script, non solo l'inizio.
      assert.ok(attributi.has("data-consent"), "il boot script si è fermato prima della fine");
      assert.equal(attributi.get("data-ripristino"), "");
    });
  }

  test("navigazione nuova, anche con l'ancora: nessun data-ripristino (D45, l'arrivo a /#contatti resta morbido)", () => {
    for (const hash of ["", "#contatti"]) {
      const { attributi } = esegui("navigate", { hash });
      assert.ok(attributi.has("data-locale"), "il boot script non è partito");
      assert.equal(attributi.has("data-ripristino"), false, `navigate${hash}: il ripristino non c'entra`);
    }
  });

  test("ricarica col sipario armato (D65): data-ripristino accanto al guardiano, che tiene la cima", () => {
    const { attributi, scrollRestoration } = esegui("reload", { chiave: null });
    assert.equal(attributi.get("data-preloader"), "");
    assert.equal(scrollRestoration, "manual");
    assert.equal(attributi.get("data-ripristino"), "");
  });

  test("globals.css: html[data-ripristino] rimette lo scroll istantaneo, html resta smooth per il resto", () => {
    // `\r?\n`: su Windows il checkout può avere i CRLF (core.autocrlf).
    assert.match(css, /\nhtml\[data-ripristino\] \{\r?\n\s*scroll-behavior: auto;\r?\n\}/);
    assert.match(css, /\nhtml \{\r?\n\s*scroll-behavior: smooth;/);
  });
});
