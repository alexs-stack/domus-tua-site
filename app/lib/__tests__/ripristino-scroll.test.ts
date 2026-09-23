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
import { writeConsent } from "../consent";

const root = join(__dirname, "..", "..", "..");
const layout = readFileSync(join(root, "app/layout.tsx"), "utf8");
const css = readFileSync(join(root, "app/globals.css"), "utf8");

/** Il boot script con le costanti interpolate come nel build (SKIP_S e SKIP_TAIL_MS come in layout.tsx). */
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
    SKIP_S: C.INTRO_T.skip,
    SKIP_TAIL_MS: Math.round((C.INTRO_T.skipCoda + 0.35) * 1000),
  };
  return m![1].replace(/\$\{(\w+)\}/g, (_, nome: string) => {
    assert.ok(nome in valori, `interpolazione nuova nel boot script: ${nome}`);
    return String(valori[nome]);
  });
}

type Ascolto = { tipo: string; fn: (e: unknown) => void; opzioni: unknown };
type Esito = {
  attributi: Map<string, string>;
  stili: Map<string, string>;
  scrollRestoration: string;
  win: Record<string, unknown>;
  ascolti: Ascolto[];
};

/**
 * Esegue il boot script su «/» con il tipo di navigazione, l'ancora, la chiave dell'intro, i cookie, il
 * localStorage (`archivio`) e la larghezza del viewport dati.
 */
function esegui(
  nav: string,
  { hash = "", chiave = C.INTRO_QUIET as string | null, cookie = "", archivio = {} as Record<string, string>, larghezza = 1440 } = {},
): Esito {
  const attributi = new Map<string, string>();
  const stili = new Map<string, string>();
  const html = {
    setAttribute: (k: string, v: string) => void attributi.set(k, v),
    getAttribute: (k: string) => attributi.get(k) ?? null,
    hasAttribute: (k: string) => attributi.has(k),
    removeAttribute: (k: string) => void attributi.delete(k),
    style: { setProperty: (k: string, v: string) => void stili.set(k, v) },
    clientWidth: 375,
    clientHeight: 664,
  };
  const ascolti: Ascolto[] = [];
  const storia = { scrollRestoration: "auto" };
  const finto: Record<string, unknown> = {
    document: {
      documentElement: html,
      cookie,
      visibilityState: "visible",
      prerendering: false,
      head: { appendChild() {} },
      createElement: () => ({ setAttribute() {} }),
    },
    location: { hash, pathname: "/", search: "" },
    performance: { getEntriesByType: () => [{ type: nav }], now: () => 0 },
    matchMedia: () => ({ matches: true }),
    sessionStorage: { getItem: (k: string) => (k === C.INTRO_KEY ? chiave : null), setItem() {}, removeItem() {} },
    localStorage: { getItem: (k: string) => archivio[k] ?? null },
    innerWidth: larghezza,
    innerHeight: 664,
    CSS: { registerProperty() {}, supports: () => true },
    history: storia,
    addEventListener: (tipo: string, fn: (e: unknown) => void, opzioni: unknown) => void ascolti.push({ tipo, fn, opzioni }),
    removeEventListener: (tipo: string, fn: (e: unknown) => void) => {
      const i = ascolti.findIndex((a) => a.tipo === tipo && a.fn === fn);
      if (i >= 0) ascolti.splice(i, 1);
    },
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
  return { attributi, stili, scrollRestoration: storia.scrollRestoration, win: finto, ascolti };
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

// Col consenso già dato il server rende in Voci il cancello di Trustindex, e all'idratazione arriva il
// widget alto 480 px: a 1440×900 tutto ciò che segue scendeva di 375 px (globals.css, 23 set. 2026).
describe("il consenso già dato prima del paint (il cancello di Trustindex in Voci)", () => {
  test("il boot script mette data-consent-accepted solo col cookie «accepted», intero", () => {
    for (const [cookie, atteso] of [
      ["dt_consent=accepted", true],
      ["dt_locale=de; dt_consent=accepted", true],
      ["dt_consent=accepted; dt_locale=de", true],
      ["dt_consent=rejected", false],
      ["xdt_consent=accepted", false],
      ["dt_consent=acceptedx", false],
      ["", false],
    ] as const) {
      const { attributi } = esegui("reload", { cookie });
      assert.ok(attributi.has("data-locale"), "il boot script non è partito");
      assert.equal(attributi.has("data-consent-accepted"), atteso, `cookie «${cookie}»`);
      if (!cookie) assert.ok(attributi.has("data-consent"), "il boot script si è fermato prima della fine");
    }
  });

  test("writeConsent tiene l'attributo allineato alla scelta, revoca compresa", () => {
    const attributi = new Set<string>();
    const g = globalThis as Record<string, unknown>;
    const prima = { document: g.document, window: g.window };
    g.document = {
      cookie: "",
      documentElement: { toggleAttribute: (k: string, si: boolean) => void (si ? attributi.add(k) : attributi.delete(k)) },
    };
    g.window = { dispatchEvent: () => true };
    try {
      writeConsent("accepted");
      assert.ok(attributi.has("data-consent-accepted"));
      writeConsent("rejected");
      assert.equal(attributi.has("data-consent-accepted"), false);
    } finally {
      g.document = prima.document;
      g.window = prima.window;
    }
  });

  test("l'altezza dichiarata dal widget diventa --dt-ti-h: solo col consenso, su questa pagina, alla stessa larghezza, se è un numero positivo", () => {
    const ok = JSON.stringify({ w: 1440, h: 399 });
    const casi: { caso: string; cookie?: string; archivio: Record<string, string>; larghezza?: number; atteso: string | null }[] = [
      { caso: "ricordata qui, a 1440", cookie: "dt_consent=accepted", archivio: { "dt-ti-h/": ok }, atteso: "399px" },
      { caso: "larghezza diversa", cookie: "dt_consent=accepted", archivio: { "dt-ti-h/": ok }, larghezza: 1024, atteso: null },
      { caso: "un'altra pagina", cookie: "dt_consent=accepted", archivio: { "dt-ti-h/recensioni": ok }, atteso: null },
      { caso: "zero", cookie: "dt_consent=accepted", archivio: { "dt-ti-h/": JSON.stringify({ w: 1440, h: 0 }) }, atteso: null },
      { caso: "non un numero", cookie: "dt_consent=accepted", archivio: { "dt-ti-h/": JSON.stringify({ w: 1440, h: "399" }) }, atteso: null },
      { caso: "valore rotto", cookie: "dt_consent=accepted", archivio: { "dt-ti-h/": "{" }, atteso: null },
      { caso: "senza scelta", archivio: { "dt-ti-h/": ok }, atteso: null },
      { caso: "rifiutato", cookie: "dt_consent=rejected", archivio: { "dt-ti-h/": ok }, atteso: null },
    ];
    for (const { caso, atteso, ...opzioni } of casi) {
      const { attributi, stili } = esegui("reload", opzioni);
      assert.equal(stili.get("--dt-ti-h") ?? null, atteso, caso);
      const accettato = opzioni.cookie === "dt_consent=accepted";
      assert.equal(attributi.has("data-consent-accepted"), accettato, `${caso}: l'attributo del consenso non dipende dall'altezza`);
    }
  });

  test("TrustindexEmbed e il boot script parlano della stessa altezza: chiave, pagina, larghezza e controllo", () => {
    const embed = readFileSync(join(root, "app/components/TrustindexEmbed.tsx"), "utf8");
    assert.match(embed, /const ALTEZZA_KEY = "dt-ti-h";/);
    assert.match(embed, /localStorage\.setItem\(ALTEZZA_KEY \+ location\.pathname, JSON\.stringify\(\{ w: window\.innerWidth, h \}\)\)/);
    assert.match(embed, /s\.w === window\.innerWidth && typeof s\.h === "number" && s\.h > 0/, "TrustindexEmbed non rilegge più l'altezza come il boot script");
    const boot = bootScript();
    assert.ok(boot.includes('localStorage.getItem("dt-ti-h"+p)'), "il boot script non legge la chiave di TrustindexEmbed per questa pagina");
    assert.ok(boot.includes('tih.w===innerWidth&&typeof tih.h=="number"&&tih.h>0'), "il boot script non controlla larghezza e altezza come TrustindexEmbed");
  });

  test("globals.css: il cancello riserva l'altezza ricordata o quella iniziale di TrustindexEmbed, e i due rami di Voci hanno lo stesso margine", () => {
    const embed = readFileSync(join(root, "app/components/TrustindexEmbed.tsx"), "utf8");
    const h0 = embed.match(/const \[frameH, setFrameH\] = useState\(\(\) => altezzaRicordata\(\) \?\? (\d+)\)/);
    assert.ok(h0, "l'altezza iniziale di TrustindexEmbed non è più «la ricordata, se no un numero»");
    assert.match(css, new RegExp(`\\nhtml\\[data-consent-accepted\\] \\.dt-voci_cancello \\{\\r?\\n\\s*min-height: var\\(--dt-ti-h, ${h0![1]}px\\);\\r?\\n\\}`));
    const voci = readFileSync(join(root, "app/components/Voci.tsx"), "utf8");
    assert.match(voci, /<div className="mt-6">\s*<TrustindexEmbed /, "il ramo del widget in Voci non è più un div mt-6 col solo widget");
    assert.match(voci, /"dt-voci_cancello mt-6"/, "Voci non marca più il cancello");
  });
});

// L'atterraggio all'ancora (watchLanding di reveal-engine.ts) si ferma al primo gesto che scorre la
// pagina, anche di prima dell'idratazione: lo registra il boot script in `window.__dtGesto`. Un
// clic che non scorre (il banner dei cookie sui deep link, il menu) non lo ferma: altrimenti chi
// accetta i cookie durante l'arrivo a /#contatti resterebbe 3.248 px sopra l'ancora (PR #81).
describe("l'arrivo all'ancora: il boot script registra i gesti che scorrono (watchLanding)", () => {
  const GESTI = ["wheel", "touchstart", "touchmove", "keydown", "click", "pointerdown"];
  /** Un bersaglio finto: closest() trova uno dei selettori in `dentro` (per esempio "a[href]", "input"). */
  const bersaglio = (...dentro: string[]) => ({
    closest: (sel: string) => (sel.split(",").some((s) => dentro.includes(s.trim())) ? {} : null),
  });
  const arma = () => esegui("navigate", { hash: "#contatti" });
  const invia = (e: Esito, evento: Record<string, unknown>) => {
    for (const a of e.ascolti.filter((x) => x.tipo === evento.type)) a.fn(evento);
  };

  test("navigazione nuova col frammento: __dtGesto a 0 e un ascolto in cattura, passivo, per ogni gesto", () => {
    const e = arma();
    assert.ok(e.attributi.has("data-consent"), "il boot script si è fermato prima della fine");
    assert.equal(e.win.__dtGesto, 0);
    assert.deepEqual(e.ascolti.map((a) => a.tipo).sort(), [...GESTI].sort());
    for (const a of e.ascolti) assert.deepEqual(a.opzioni, { capture: true, passive: true });
  });

  test("senza frammento, alla ricarica e al back/forward nessun __dtGesto: l'atterraggio non parte", () => {
    for (const [nav, hash] of [["navigate", ""], ["reload", "#contatti"], ["back_forward", "#contatti"]]) {
      const e = esegui(nav, { hash });
      assert.equal(e.win.__dtGesto, undefined, `${nav}${hash}`);
      assert.deepEqual(e.ascolti.filter((a) => GESTI.includes(a.tipo)), [], `${nav}${hash}`);
    }
  });

  const tocco = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }], target: bersaglio() });

  test("i gesti che non scorrono non lo fermano: modificatori, lettere, spazio e frecce nei campi, spazio sui bottoni, clic fuori dai link, puntatore nel viewport, un tocco", () => {
    const e = arma();
    const corpo = bersaglio();
    for (const evento of [
      // Un tocco su iOS muove il dito di qualche px (un clic sul banner dei cookie).
      { type: "touchstart", ...tocco(100, 300) },
      { type: "touchmove", ...tocco(104, 306) },
      { type: "touchmove", ...tocco(91, 309) },
      { type: "keydown", key: "Shift", target: corpo },
      { type: "keydown", key: "Control", target: corpo },
      { type: "keydown", key: "c", target: corpo },
      { type: "keydown", key: "Enter", target: corpo },
      { type: "keydown", key: " ", target: bersaglio("input") },
      { type: "keydown", key: " ", target: bersaglio("button") },
      { type: "keydown", key: "ArrowDown", target: bersaglio("select") },
      { type: "keydown", key: "End", target: bersaglio("textarea") },
      { type: "click", target: bersaglio("button") },
      { type: "click", target: corpo },
      { type: "pointerdown", button: 0, clientX: 200, clientY: 300, target: bersaglio("button") },
      { type: "pointerdown", button: 0, clientX: 374, clientY: 663, target: corpo },
    ]) {
      invia(e, evento);
      assert.equal(e.win.__dtGesto, 0, JSON.stringify({ ...evento, target: undefined }));
    }
    assert.equal(e.ascolti.length, GESTI.length, "gli ascolti sono ancora tutti lì");
  });

  const scorrono: [string, Record<string, unknown>[]][] = [
    ["rotella", [{ type: "wheel", target: bersaglio() }]],
    ["trascinamento al tocco oltre 10 px", [{ type: "touchstart", ...tocco(100, 300) }, { type: "touchmove", ...tocco(100, 312) }]],
    ["trascinamento senza un touchstart visto (nel dubbio scorre)", [{ type: "touchmove", ...tocco(100, 300) }]],
    ["trascinamento orizzontale oltre 10 px", [{ type: "touchstart", ...tocco(100, 300) }, { type: "touchmove", ...tocco(89, 300) }]],
    ["PageDown", [{ type: "keydown", key: "PageDown", target: bersaglio() }]],
    ["PageDown su un bottone (i bottoni prendono solo spazio e Invio)", [{ type: "keydown", key: "PageDown", target: bersaglio("button") }]],
    ["freccia giù su un bottone", [{ type: "keydown", key: "ArrowDown", target: bersaglio("button") }]],
    ["spazio fuori dai campi", [{ type: "keydown", key: " ", target: bersaglio() }]],
    ["Home", [{ type: "keydown", key: "Home", target: bersaglio() }]],
    ["freccia su un link", [{ type: "keydown", key: "ArrowUp", target: bersaglio("a[href]") }]],
    ["Tab, anche in un campo", [{ type: "keydown", key: "Tab", target: bersaglio("input") }]],
    ["clic su un link", [{ type: "click", target: bersaglio("a[href]") }]],
    ["barra di scorrimento", [{ type: "pointerdown", button: 0, clientX: 380, clientY: 300, target: bersaglio() }]],
    ["tasto centrale", [{ type: "pointerdown", button: 1, clientX: 200, clientY: 300, target: bersaglio() }]],
  ];
  for (const [nome, eventi] of scorrono) {
    test(`${nome}: __dtGesto a 1 e gli ascolti si staccano`, () => {
      const e = arma();
      for (const evento of eventi) invia(e, evento);
      assert.equal(e.win.__dtGesto, 1);
      assert.deepEqual(e.ascolti.filter((a) => GESTI.includes(a.tipo)), []);
    });
  }
});
