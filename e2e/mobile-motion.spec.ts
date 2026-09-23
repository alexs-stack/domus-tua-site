import type { Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import {
  GOMMA_MS,
  GOMMA_TEMPI,
  INTRO_EVENT,
  INTRO_FILM,
  INTRO_KEY,
  INTRO_T,
} from "../app/lib/motion/intro-constants";

/** La gomma a una velocità: fino all'allargamento (l'handoff) e intera, in ms. */
const gommaMs = (v: keyof typeof GOMMA_TEMPI) => {
  const g = GOMMA_TEMPI[v];
  return { reveal: g.delay + g.draw + g.hold, tutta: g.delay + g.draw + g.hold + g.exit };
};

// Coreografia mobile — wave "parità mobile".
//
// Questi test misurano il MOVIMENTO, non la presenza dei nodi. È la lacuna che
// l'audit ha trovato nella suite (docs/mobile-parity.md §6.2): a 390px non c'era
// una sola asserzione che provasse che un tween fosse partito. Un `toBeVisible()`
// ignora l'opacità, quindi passava identico che l'animazione ci fosse o no.
//
// Rivista bianca (2026-09-10): restano qui la rete anti-traboccamento e il
// sipario Arco Domus. Il fermo-immagine del primo gesto (`.dt-hero-rest`) e i
// set piece mobili (Paths, muro delle voci, orizzonte) non esistono più, e i
// loro test sono stati tolti con loro.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

// ── Nessun traboccamento orizzontale ──────────────────────────────────────
// Passava già prima della wave, e resta scritto come rete: è il difetto che si
// nota per primo su un telefono, e ogni ramo mobile nuovo è un'occasione di
// reintrodurlo.
// `/case-vendute` e `/valutazione-immobile-tradate` sono in `app/sitemap.ts` (e in
// a11y.spec.ts): rotte vere, non le si lascia fuori dalla rete.
const ROTTE = [
  "/",
  "/acquista",
  "/vendi",
  "/metodo",
  "/chi-siamo",
  "/contatti",
  "/case-vendute",
  "/valutazione-immobile-tradate",
] as const;

for (const rotta of ROTTE) {
  test(`nessun traboccamento orizzontale su ${rotta} @layout`, async ({ page, goto }) => {
    await goto(rotta);
    // Una passata intera: il traboccamento può nascere da un elemento che entra
    // in scena, non solo da quelli già a schermo al caricamento.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    const excess = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(excess, `${rotta} trabocca di ${excess}px in orizzontale`).toBeLessThanOrEqual(0);
  });
}

// ── Nessuna parola e nessun titolo fuori dallo schermo, nelle cinque lingue ──
// Audit del 21 settembre 2026 (blocco 23), difetto V04: su /metodo a 390 px l'h2
// «Cura, trasparenza, accompagnamento.» sbordava — la parola più lunga (413 px)
// non entra nei 351 px della colonna, `.dt-w` è nowrap e html/body hanno
// `overflow-x: clip`, quindi scrollWidth resta 390 e la rete qui sopra non lo
// vede. Questa guarda gli ELEMENTI, non il documento: dopo una passata intera,
// nessuna parola spezzata (`.dt-w`) e nessun h1/h2/h3 può avere il bordo destro
// oltre lo schermo o il sinistro prima. Le lingue si scelgono col cookie
// `dt_locale`, come fa il boot script del layout; i titoli per lettera in
// tedesco e francese sono il rischio dichiarato (spec §9 «nessun
// traboccamento»). Restano fuori, per disegno e non per comodità: le tessere
// dei nastri guidati da JS (`[data-on]`: stanno fuori dallo schermo finché lo
// scroll non le porta dentro), quelle dei nastri nativi (un antenato che
// scorre in orizzontale: il dito le raggiunge) e ciò che è invisibile (opacità
// ≤ 0,05 o `visibility: hidden` sull'elemento o su un antenato): il titolo di
// «Seguici» in uscita è scalato a 1,12 e sfuma (A25), e un rettangolo che
// nessuno vede non è un traboccamento. La misura si prende a animazioni
// finite: l'accento entra da 10vw a destra (text-roles.ts) e una lettera a
// metà corsa non è un traboccamento.
//
// SECONDO GIRO (revisori del 21 settembre): il primo giro escludeva anche ciò
// che un antenato dentro lo schermo ritaglia (`overflow-x: hidden|clip`). Era
// una rete cieca: `.dt-testa_riquadro` ha `overflow: clip` ed è largo quanto lo
// schermo, quindi l'H1 di OGNI rotta con la testa di era non veniva misurato, e
// a 360 «Besichtigung.» a +26 px oltre lo schermo rispondeva verde. Un
// antenato che ritaglia NASCONDE il testo che sporge: è il difetto da vedere,
// non una ragione per non guardare. L'esclusione è tolta.
//
// Due misure in più, sempre dopo la passata:
// - ogni parola (`.dt-w`) sta dentro la scatola del SUO titolo (h1-h4): un h4
//   dentro una griglia a tre colonne può restare dentro lo schermo mentre la
//   parola corre nel margine o sopra la colonna accanto («Dokumentenprüfung»
//   sui passi di /metodo, «Immobilienberatung» sui ruoli di /lavora-con-noi:
//   la taglia segue la colonna, DESIGN.md);
// - le teste d1 (h1-h3 con `text-d1`) hanno UNA taglia sola sulla pagina:
//   sotto i 640 la scala segue la larghezza per tutte (globals.css), non per
//   il componente che ha la parola lunga — sulla stessa colonna due misure per
//   lo stesso rango erano il rilievo dei revisori (31,2 e 38,4 px a 390).
//   UNA PER SUPERFICIE, da lg: le sezioni che la pagina posa sulla foto della
//   testa (`.dt-testa[data-sopra="foto"] .dt-testa_sopra`, A48/A54) non stanno
//   nella colonna della carta, e A70 (Alberto, 22 set. 2026, sera: «prova a
//   farle più grandi e grosse e bianche») dà ai loro titoli una misura propria
//   da 1280 (globals.css: `calc(var(--text-d2) * 1.2)`, 69,12 px a 1440×900
//   contro i 90 del d1 sulla carta: i Valori di /chi-siamo e le tre leve di
//   /metodo). Lì la regola vale dentro ciascuna superficie; sotto lg quelle
//   sezioni seguono la foto in inchiostro, nella colonna di tutte, e si
//   contano con le altre.
const ROTTE_PAROLE = [
  ...ROTTE,
  "/servizi",
  "/open-domus",
  "/recensioni",
  "/lavora-con-noi",
  "/domande-frequenti",
] as const;
const LINGUE = ["it", "en", "fr", "de", "es"] as const;

/** Quanto aspettare dopo la passata perché entrate e uscite dei testi siano finite. */
const TESTI_FERMI_MS = 2000;

type Sbordo = { tag: string; testo: string; px: number; lato: "destra" | "sinistra" };

for (const lingua of LINGUE) {
  for (const rotta of ROTTE_PAROLE) {
    test(`nessuna parola né titolo fuori dallo schermo su ${rotta} in ${lingua} @layout`, async ({ page, goto }) => {
      await page.context().addCookies([{ name: "dt_locale", value: lingua, domain: "127.0.0.1", path: "/" }]);
      await goto(rotta);
      // Il server rende in italiano e il client si allinea al cookie dopo
      // l'idratazione (LocaleProvider): si misura il documento nella lingua chiesta.
      await page.waitForFunction((l) => document.documentElement.lang === l, lingua, { timeout: 20_000 });
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
      });
      await page.waitForTimeout(TESTI_FERMI_MS);
      const { lang, fuori, fuoriColonna, taglieD1 } = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const scorrevole = (el: Element) => {
          for (let p = el.parentElement; p; p = p.parentElement) {
            const o = getComputedStyle(p).overflowX;
            if ((o === "auto" || o === "scroll") && p.scrollWidth > p.clientWidth + 1) return true;
          }
          return false;
        };
        const invisibile = (el: Element) => {
          for (let p: Element | null = el; p && p !== document.documentElement; p = p.parentElement) {
            const cs = getComputedStyle(p);
            if (Number(cs.opacity) <= 0.05 || cs.visibility === "hidden") return true;
          }
          return false;
        };
        const breve = (el: Element) => (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
        const out: Sbordo[] = [];
        for (const el of document.querySelectorAll(".dt-w, h1, h2, h3")) {
          const b = el.getBoundingClientRect();
          // Nascosti (display none, sr-only) non impaginano nulla.
          if (b.width <= 1 || b.height <= 1) continue;
          if (el.closest("[data-on]") || scorrevole(el) || invisibile(el)) continue;
          const tag = el.tagName === "SPAN" ? `${el.closest("h1,h2,h3,h4,p")?.tagName ?? "SPAN"}>.dt-w` : el.tagName;
          if (b.right > W + 1) out.push({ tag, testo: breve(el), px: +(b.right - W).toFixed(1), lato: "destra" });
          else if (b.left < -1) out.push({ tag, testo: breve(el), px: +(-b.left).toFixed(1), lato: "sinistra" });
        }
        // Ogni parola dentro la scatola del suo titolo. Da 1024 in su le righe
        // foto+testo hanno un canale di 6vw fra le colonne (DESIGN.md, «Griglia»):
        // una parola che vi sporge di pochi pixel non tocca nulla — a 1440
        // «Marketingkampagnen» (Servizi, de) sporge di 8,9 px in un canale di 86 —
        // quindi lì la tolleranza è 12 px; sotto, dove le colonne sono una, 1 px.
        const tolleranzaColonna = W >= 1024 ? 12 : 1;
        const colonna: string[] = [];
        for (const h of document.querySelectorAll("h1, h2, h3, h4")) {
          const hb = h.getBoundingClientRect();
          if (hb.width <= 1 || hb.height <= 1) continue;
          if (h.closest("[data-on]") || scorrevole(h) || invisibile(h)) continue;
          for (const w of h.querySelectorAll(".dt-w")) {
            const b = w.getBoundingClientRect();
            if (b.width <= 1) continue;
            const oltre = Math.max(b.right - hb.right, hb.left - b.left);
            if (oltre > tolleranzaColonna) {
              colonna.push(
                `${h.tagName} «${breve(h)}»: la parola «${breve(w)}» (${b.width.toFixed(1)}px) sporge di ${oltre.toFixed(1)}px dalla colonna del titolo (${hb.width.toFixed(1)}px)`,
              );
            }
          }
        }
        // Una taglia sola per le teste d1, per superficie: da lg (il blocco
        // `min-width: 64rem` di globals.css) quelle posate sulla foto della
        // testa fanno gruppo a sé (A70), sotto lg sono sulla carta con le altre.
        const daLg = matchMedia("(min-width: 64rem)").matches;
        const taglie = { carta: new Map<string, string>(), foto: new Map<string, string>() };
        for (const h of document.querySelectorAll(":is(h1, h2, h3).text-d1")) {
          const fs = getComputedStyle(h).fontSize;
          const sup = daLg && h.closest('.dt-testa[data-sopra="foto"] .dt-testa_sopra') ? taglie.foto : taglie.carta;
          if (!sup.has(fs)) sup.set(fs, `${h.tagName} «${breve(h)}»`);
        }
        return {
          lang: document.documentElement.lang,
          fuori: out,
          fuoriColonna: colonna,
          taglieD1: Object.entries(taglie).map(([sup, m]) => ({
            sup,
            elenco: [...m].map(([fs, chi]) => `${fs}: ${chi}`),
          })),
        };
      });
      expect(lang, "la lingua del documento non è quella del cookie").toBe(lingua);
      const elenco = fuori.map((f) => `${rotta} [${lingua}] ${f.tag} «${f.testo}»: +${f.px}px a ${f.lato}`).join("\n");
      expect(fuori, `parole o titoli fuori dallo schermo:\n${elenco}`).toEqual([]);
      expect(fuoriColonna, `parole fuori dalla colonna del loro titolo su ${rotta} [${lingua}]:\n${fuoriColonna.join("\n")}`).toEqual([]);
      for (const { sup, elenco: misure } of taglieD1) {
        expect(misure.length, `le teste d1 sulla ${sup} di ${rotta} [${lingua}] hanno più di una taglia:\n${misure.join("\n")}`).toBeLessThanOrEqual(1);
      }
    });
  }
}

// ── IL SIPARIO ARCO DOMUS, ADESSO CHE SUONA ANCHE SUL TELEFONO ────────────
// Fase 3 della parità mobile (2026-08-11), riscritto per la Fase 1 dell'onda
// «parità mobile 2» (2026-08-17/18). Prima di quel blocco l'intro aveva DUE
// test e nessuno dei due la misurava — docs/mobile-parity.md §6.1 li smonta
// uno per uno, e vale la pena riscriverli qui perché sono tre modi diversi di
// scrivere un'asserzione vuota, non un solo errore ripetuto:
//   • `home.spec.ts:36` guarda `overflow` su **body**, ma il blocco è su
//     **html** (`html[data-preloader]{overflow:hidden}`, globals.css, e
//     `.lenis.lenis-stopped`). Su body non c'è mai stato niente da leggere:
//     l'asserzione passa a sipario alzato e a sipario calato;
//   • `toBeVisible()` ignora l'opacità, e l'h1 dell'hero sta a **0.02** per
//     costruzione (`html[data-hero-intro]`) sotto un overlay `z-index:96`: è
//     "visibile" dal primo fotogramma, con l'intro in corso;
//   • `home.spec.ts:33` preme Invio subito dopo `domcontentloaded`, cioè quasi
//     certamente prima che il listener di skip esista — lo skip non viene
//     provato, viene mancato.
//
// IL CONTRATTO NUOVO (opzione D, docs/mobile-parity-2.md §8.5; mandato §6 e
// §9.3). La shell dell'intro è markup reso dal SERVER (PreloaderShell.tsx,
// `#dt-preloader.dt-preloader`, nel primo HTML di ogni rotta): l'atto I è CSS
// (globals.css «Preloader»: `dt-pre-char/schar/cap/word` sulle lettere,
// `dt-pre-track` sulla linea di carica) e parte al primo paint sotto
// `html[data-preloader]`, che il boot script del layout mette prima della
// shell (con `__dtPreArmed`/`__dtPreT0`). DAL 22 SETTEMBRE 2026 LA PORTA È LA
// GOMMA (Alberto: «devi sostituire l'entrata ad arco del preloader con
// questo»): Preloader.tsx legge l'orologio CSS, scrive `data-pre-live` («sono
// al timone»), a INTRO_T.gomma monta DomusTuaPreloader nella shell
// (`html[data-gomma]`), spara INTRO_EVENT quando la cancellatura si allarga e
// chiude quando ha scoperto tutto; lo skip (`html[data-pre-skip]`) fa partire
// subito la gomma `veloce`. Quindi qui si misura DAVVERO il film — le lettere,
// la linea, il tratto della gomma, la cancellatura — non la presenza dei nodi,
// e a due larghezze (390 e 1440: è lo stesso montaggio).
//
// TRE SCELTE DI METODO, tutte e tre ereditate dai commenti qui sopra:
//  1. NIENTE fixture `goto`. Quella scrive `dt-intro-seen` prima del
//     caricamento: è il modo giusto di togliersi l'intro dai piedi in tutti
//     gli altri test, ed è il modo sicuro di non provare niente in questi.
//     Si carica con `page.goto` nudo, come un visitatore nuovo.
//  2. Si aspetta un SEGNALE, mai un ritardo. I segnali sono `data-preloader`
//     (il film è partito), `data-pre-live` (il JS è al timone: i listener di
//     skip li attacca in fondo allo stesso layout effect che scrive
//     l'attributo in cima, quindi quando è leggibile quel corpo è già girato
//     per intero), INTRO_EVENT, la caduta dell'attributo.
//  3. La misura si prende DENTRO la pagina, A FRAME. Il registro qui sotto è
//     installato prima del primo script (`addInitScript`), osserva `document`
//     e campiona il film in rAF: vede l'attributo messo dal boot script
//     *prima del primo paint*, vede la shell comparire, legge a ogni ~80 ms
//     l'opacità della prima lettera, la trasformata della linea, la quota
//     `--arch-y` dell'arco, e segna handoff, skip, banner cookie e caduta,
//     ognuno col suo istante. Dal driver, quegli istanti sarebbero già
//     passati — e un `page.evaluate` fra un atto e l'altro misurerebbe la
//     latenza del protocollo, non il film.
//
// QUEL CHE QUI NON SI PROVA, detto per intero: la sfogliata vera col pollice.
// Playwright non ha un gesto di swipe (`touchscreen` ha solo `tap`), e
// costruirlo a mano con `Input.dispatchTouchEvent` via CDP misurerebbe il
// nostro finto dito, non il sito. Lo scorrimento si guida quindi con la
// rotella o con `scrollBy` — che va bene come prova del blocco, perché la
// serratura è `overflow:hidden` su <html> e quella ferma anche il dito.

/** Un fotogramma del film, letto in rAF dentro la pagina. */
type Fotogramma = {
  /** `performance.now()` del fotogramma. */
  t: number;
  /** Opacità computata della PRIMA lettera del titolo (atto I). */
  char: number;
  /** La prima lettera ha `dt-pre-char` fra le proprie animazioni CSS. */
  charAnim: boolean;
  /** `transform` computata della linea di carica (atto II). */
  track: string;
  /** La linea ha `dt-pre-track` fra le proprie animazioni CSS. */
  trackAnim: boolean;
  /** `html[data-gomma]`: null prima che la gomma entri, poi "active" e "reveal". */
  gomma: string | null;
  /** Il tratto della gomma: `stroke-dashoffset` del percorso (lunghezza → 0 mentre disegna; NaN senza gomma). */
  tratto: number;
  /** La cancellatura che si allarga: `stroke-width` dell'allargamento (0 fino all'handoff; NaN senza gomma). */
  allarga: number;
};

/** Ciò che il registro in-pagina raccoglie di ogni documento. */
type RegistroIntro = {
  /** `data-preloader` è comparso (lo scrive l'inline script, pre-paint). */
  visto: boolean;
  /** Il valore di `data-preloader` quando è comparso: "" film, "short" o "short-page" corta. */
  valore: string | null;
  /** Preloader.tsx idratato e al timone (timer di handoff/chiusura, skip): il film è CSS dal paint. */
  live: boolean;
  /** Opacità delle lettere dell'h1 nell'istante del takeover. */
  heroOpacita: number | null;
  tVisto: number | null;
  tLive: number | null;
  /** La shell `#dt-preloader` è comparsa nel DOM (markup del server). */
  tShell: number | null;
  /** Nell'istante in cui la shell è comparsa: <html> aveva già `data-preloader`? */
  preAllaShell: boolean | null;
  /** …e aveva GIÀ `data-pre-live`? (Deve essere no: il film precede il JS.) */
  liveAllaShell: boolean | null;
  /** Istante in cui il sipario è caduto (attributo rimosso, da chiunque). */
  tCaduto: number | null;
  /** Ogni `pointerdown` arrivato alla finestra (in cattura: precede tutti). */
  tocchi: number[];
  /** Diario degli input (pointerdown/touchstart/click/keydown), per i messaggi. */
  eventi: string[];
  /** Istante di INTRO_EVENT, l'handoff all'hero. */
  handoff: number | null;
  /** Istante di `html[data-pre-skip]` (lo skip in CSS). */
  tSkip: number | null;
  /** Istante di `html[data-consent]` (il banner cookie che compare). */
  tConsent: number | null;
  /** Il film, un fotogramma ogni ~80 ms finché l'attributo è su <html>. */
  film: Fotogramma[];
};

type ConRegistro = { __dtIntro: RegistroIntro; __dtPreT0?: number; __dtPreArmed?: number };

/**
 * Il registro, installato prima di ogni documento.
 *
 * `document.documentElement` qui non esiste ancora — l'init script gira prima
 * che <html> sia analizzato — quindi si osserva `document` con `subtree`, che
 * è l'unico bersaglio già presente, e si guarda dentro solo quando c'è.
 */
function registraIntro(evento: string) {
  const rec: RegistroIntro = {
    visto: false,
    valore: null,
    live: false,
    heroOpacita: null,
    tVisto: null,
    tLive: null,
    tShell: null,
    preAllaShell: null,
    liveAllaShell: null,
    tCaduto: null,
    tocchi: [],
    eventi: [],
    handoff: null,
    tSkip: null,
    tConsent: null,
    film: [],
  };
  (window as unknown as ConRegistro).__dtIntro = rec;

  const leggi = () => {
    const html = document.documentElement;
    if (!html) return;
    const coperto = html.hasAttribute("data-preloader");
    if (coperto && !rec.visto) {
      rec.visto = true;
      rec.valore = html.getAttribute("data-preloader");
      rec.tVisto = performance.now();
    }
    if (!rec.live && html.hasAttribute("data-pre-live")) {
      rec.live = true;
      rec.tLive = performance.now();
      // L'hero mentre il sipario è a schermo: la lettura che `toBeVisible()`
      // non fa. Si prende qui e non dal driver perché all'handoff (il tuffo,
      // 3,13 s) le lettere salgono a 1 mentre l'attributo è ancora su <html>:
      // campionando da fuori si misurerebbe la corsa.
      const ch = document.querySelector("[data-hero-char]");
      rec.heroOpacita = ch ? Number(getComputedStyle(ch).opacity) : null;
    }
    if (rec.tSkip === null && html.hasAttribute("data-pre-skip")) rec.tSkip = performance.now();
    if (rec.tConsent === null && html.hasAttribute("data-consent")) rec.tConsent = performance.now();
    if (rec.visto && !coperto && rec.tCaduto === null) rec.tCaduto = performance.now();
  };
  leggi();
  new MutationObserver(leggi).observe(document, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-preloader", "data-pre-live", "data-pre-skip", "data-consent"],
  });

  // In CATTURA: questo listener precede quello di skip del preloader (che sta
  // su window in bolla), quindi l'istante registrato è quello del dito, non
  // quello di ciò che il dito ha provocato. Si tengono TUTTI i tocchi: un
  // tocco arrivato prima che il JS fosse al timone non salta niente, e il
  // test deve poter dire quale tocco ha davvero prodotto lo skip.
  window.addEventListener(
    "pointerdown",
    () => {
      rec.tocchi.push(performance.now());
    },
    { capture: true },
  );
  window.addEventListener(evento, () => {
    if (rec.handoff === null) rec.handoff = performance.now();
  });
  // Il diario degli input, per i messaggi d'errore: tipo@ms:bersaglio. È ciò
  // che ha permesso di leggere il caso «tocco prima del JS» (vedi il test
  // dello skip): senza, si vedeva un ritardo e non la sua causa.
  for (const tipo of ["pointerdown", "touchstart", "click", "keydown"]) {
    window.addEventListener(
      tipo,
      (e) => {
        const tag = (e.target as Element | null)?.tagName ?? "?";
        rec.eventi.push(`${tipo}@${Math.round(performance.now())}:${tag}`);
      },
      { capture: true },
    );
  }

  // LA SENTINELLA DEL FILM. In rAF, dentro la pagina: aspetta la shell, e
  // finché `data-preloader` è su <html> legge a ogni ~80 ms la prima lettera,
  // la linea di carica e la gomma. `getAnimations()` restituisce anche le
  // animazioni finite con `fill` e quelle ancora nel proprio delay: il nome c'è
  // per tutta l'intro, il VALORE (opacità, transform, tratto, allargamento)
  // dice se si muove.
  let root: HTMLElement | null = null;
  let ultimo = -Infinity;
  const nomi = (el: Element | null) => {
    try {
      return (el?.getAnimations() ?? []).map((a) => (a as CSSAnimation).animationName);
    } catch {
      return [] as string[];
    }
  };
  const campiona = () => {
    const html = document.documentElement;
    const now = performance.now();
    if (!root && html) {
      root = document.getElementById("dt-preloader");
      if (root) {
        rec.tShell = now;
        rec.preAllaShell = html.hasAttribute("data-preloader");
        rec.liveAllaShell = html.hasAttribute("data-pre-live");
      }
    }
    if (root && html?.hasAttribute("data-preloader") && now - ultimo >= 80) {
      ultimo = now;
      const ch = root.querySelector("[data-pre-char]");
      const tr = root.querySelector("[data-pre-track]");
      // Il percorso della gomma (dentro il logo, sotto la clip) e l'allargamento.
      const gomma = root.querySelector(".dt-gomma");
      const tratto = gomma?.querySelector("[data-gomma-logo] > g > path") ?? null;
      const allarga = gomma?.querySelector("[data-gomma-swell]") ?? null;
      rec.film.push({
        t: now,
        char: ch ? Number(getComputedStyle(ch).opacity) : -1,
        charAnim: nomi(ch).includes("dt-pre-char"),
        track: tr ? getComputedStyle(tr).transform : "",
        trackAnim: nomi(tr).includes("dt-pre-track"),
        gomma: html.getAttribute("data-gomma"),
        tratto: tratto ? parseFloat(tratto.getAttribute("stroke-dashoffset") ?? "NaN") : NaN,
        allarga: allarga ? parseFloat(allarga.getAttribute("stroke-width") ?? "NaN") : NaN,
      });
    }
    // Si smette alla caduta (o dopo 20 s: un documento che non ha mai avuto
    // l'intro non deve tenere una rAF viva per tutto il test).
    if (rec.tCaduto === null && now < 20_000) requestAnimationFrame(campiona);
  };
  requestAnimationFrame(campiona);
}

const leggiRegistro = (page: Page) =>
  page.evaluate(() => (window as unknown as ConRegistro).__dtIntro);

/** L'orologio del boot script: l'istante in cui `data-preloader` è stato messo. */
const leggiT0 = (page: Page) =>
  page.evaluate(() => (window as unknown as ConRegistro).__dtPreT0 ?? null);

/** Le due serrature dello scroll, lette dove stanno davvero: <html>, mai body. */
const bloccata = (page: Page) =>
  page.evaluate(() => ({
    lenis: document.documentElement.classList.contains("lenis-stopped"),
    overflow: getComputedStyle(document.documentElement).overflowY,
    attributo: document.documentElement.hasAttribute("data-preloader"),
  }));

/** `.dt-preloader` com'è a schermo: display/visibility computati. */
const overlay = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector(".dt-preloader");
    if (!el) return { presente: false, display: "none", visibility: "hidden" };
    const cs = getComputedStyle(el);
    return { presente: true, display: cs.display, visibility: cs.visibility };
  });

/**
 * La pagina SCORRE davvero: `scrollBy` e poi si legge `scrollY`. Programmatico
 * e non rotella, di proposito: qui si prova la SERRATURA (`overflow:hidden` su
 * <html>, che ferma anche `scrollBy`), non ScrollTrigger. Si insiste per
 * qualche secondo perché Lenis, appena rilasciato, può avere un fotogramma di
 * assestamento.
 */
async function scorreDavvero(page: Page) {
  const scadenza = Date.now() + 5_000;
  let y = 0;
  while (Date.now() < scadenza && y === 0) {
    y = await page.evaluate(async () => {
      window.scrollBy(0, 400);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      return Math.round(window.scrollY);
    });
    if (y === 0) await page.waitForTimeout(100);
  }
  return y;
}

const arrotonda = (n: number) => Math.round(n * 10) / 10;

/**
 * LA MACCHINA È AFFAMATA? Il JS al timone (`data-pre-live`) su un build di
 * produzione servito da localhost arriva a 600-1 000 ms dall'armatura su una
 * macchina libera (misurato a 390 e 1440, 2026-08-18). Con altri processi
 * pesanti accanto (build, altre suite, altre sessioni) l'abbiamo visto a 2, 3
 * e 5,8 s: lì il film CSS suona lo stesso — è ciò per cui esiste l'opzione D
 * — ma le misure di QUESTI test (handoff entro 4 800 dal boot, skip entro
 * 1 700 dal tocco, fotogrammi della sentinella) misurano la coda della CPU,
 * non il sito. Oltre la soglia il test si dichiara non misurabile e SALTA con
 * il numero in chiaro: un rosso finto costa una rilettura a tutti, un verde
 * finto (soglie allargate) non costa niente a nessuno e non prova niente. Un
 * JS davvero lento come regressione del sito lo vedono la sonda CDP e il
 * `perf:report` (mandato §9.4-5), che misurano i byte e i tempi a rete
 * strozzata di proposito, non questa suite.
 */
const AFFAMATA_MS = 2500;
function saltaSeAffamata(r: RegistroIntro, dove: string) {
  const live = r.tLive !== null && r.tVisto !== null ? Math.round(r.tLive - r.tVisto) : null;
  test.skip(
    live !== null && live > AFFAMATA_MS,
    `${dove}: macchina affamata — il JS è arrivato al timone a ${live}ms dall'armatura (soglia ${AFFAMATA_MS}): le misure temporali non dicono niente del sito, rilancia a macchina libera`,
  );
}

test.describe("il sipario Arco Domus a sessione fredda", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(registraIntro, INTRO_EVENT);
  });

  // ── I QUATTRO ATTI, SULLA HOME ──────────────────────────────────────────
  // Il film intero suona solo alla prima entrata nella home: Alberto il 13
  // settembre 2026 (A18, A20; spec §6.2). Le pagine interne hanno la porta
  // corta, provata in e2e/preloader-corta.spec.ts. Il test gira nei due
  // progetti «interi» (390 e 1440): è lo stesso montaggio, quindi le stesse
  // asserzioni; sotto i 768 cambiano solo le geometrie dell'arco, e sui px di
  // `--arch-y` non si asserisce nessun numero assoluto.
  for (const rotta of ["/"] as const) {
    test(`su ${rotta} suona con i quattro atti, copre l'hero, si chiude da sola e restituisce la pagina`, async ({
      page,
      request,
    }) => {
      // (a) PRIMA DELL'IDRATAZIONE — anzi, prima del browser: l'HTML servito
      // contiene già la shell intera. `request.get` è una fetch nuda, senza
      // cookie di sessione e senza JS: quello che arriva è ciò che il server
      // rende per un visitatore qualunque. E NON contiene `data-preloader` su
      // <html> né `data-pre-live`: quelli li mette il browser (boot script,
      // poi Preloader.tsx) — se comparissero nell'HTML l'intro suonerebbe
      // anche senza JS e a ogni visita, senza nessuno che la chiuda.
      const html = await (await request.get(rotta)).text();
      expect(html, `l'HTML servito per ${rotta} non contiene la shell #dt-preloader`).toContain(
        'id="dt-preloader"',
      );
      for (const marcatore of ["data-pre-char", "data-pre-schar", "data-pre-track", "data-pre-panel", "data-pre-content"]) {
        expect(html, `nell'HTML servito manca [${marcatore}]: la shell non è più intera dal server`).toContain(
          marcatore,
        );
      }
      expect(html, "l'HTML servito porta già data-preloader su <html>: deve metterlo il boot script").not.toMatch(
        /<html[^>]*\sdata-preloader/,
      );
      expect(html, "l'HTML servito porta data-pre-live: è il JS a doverlo scrivere").not.toContain(
        "data-pre-live",
      );

      // `page.goto` nudo, `commit`: dal primo byte del documento in poi ogni
      // istante lo prende il registro dentro la pagina.
      await page.goto(rotta, { waitUntil: "commit" });

      // La shell compare, e quando compare l'attributo c'è già (il boot
      // script sta PRIMA di lei nel body) e il JS non è ancora al timone.
      await page.waitForFunction(
        () => (window as unknown as ConRegistro).__dtIntro.tShell !== null,
        undefined,
        { timeout: 15_000, polling: "raf" },
      );
      const allaShell = await leggiRegistro(page);
      expect(
        allaShell.preAllaShell,
        "la shell #dt-preloader è comparsa SENZA html[data-preloader]: il boot script non l'ha armata (o è dopo la shell nel body)",
      ).toBe(true);
      expect(
        allaShell.liveAllaShell,
        "html[data-pre-live] c'era già quando la shell è comparsa: il film non precede il JS",
      ).toBe(false);
      expect(
        allaShell.visto,
        "html[data-preloader] non è mai comparso: a sessione fredda l'intro non è nemmeno prevista",
      ).toBe(true);

      // (b) ATTO I: i tween per lettera. Non «il nodo esiste»: OGNI lettera del
      // titolo porta l'animazione `dt-pre-char`, la firma `dt-pre-schar`, i
      // caps `dt-pre-cap`, il payoff visibile `dt-pre-word` — letti da
      // `getAnimations()`, che le vede anche nel proprio delay. Si legge
      // subito dopo la shell, cioè a atto I in corso: la PRIMA lettera parte
      // a 0,12 s e finisce a 1,42, quindi in questo istante il suo stato è
      // «running» o «pending», mai «finished» — se fosse finished, o il
      // campionamento è arrivato dopo 1,5 s (e lo dice il messaggio) o le
      // keyframe sono partite prima del paint della shell.
      const attoI = await page.evaluate(() => {
        const root = document.getElementById("dt-preloader")!;
        // Solo i nodi dipinti: il payoff è reso in cinque lingue e quattro
        // sono display:none SUL GENITORE (niente animazione, per costruzione;
        // e la `display` computata del figlio resta "block", quindi
        // `checkVisibility()`, che guarda gli antenati).
        const conta = (sel: string, nome: string) => {
          const els = Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) =>
            el.checkVisibility(),
          );
          const animate = els.filter((el) =>
            el.getAnimations().some((a) => (a as CSSAnimation).animationName === nome),
          ).length;
          return { n: els.length, animate };
        };
        const primo = root.querySelector("[data-pre-char]")?.getAnimations()[0];
        return {
          char: conta("[data-pre-char]", "dt-pre-char"),
          schar: conta("[data-pre-schar]", "dt-pre-schar"),
          cap: conta("[data-pre-cap]", "dt-pre-cap"),
          word: conta("[data-pre-word]", "dt-pre-word"),
          statoPrimo: primo?.playState ?? "assente",
          tPrimo: (window as unknown as ConRegistro).__dtIntro.tShell,
          tOra: performance.now(),
          coperto: document.documentElement.hasAttribute("data-preloader"),
        };
      });
      // La stessa guardia di `saltaSeAffamata`, ma PRIMA del JS: se il driver
      // è riuscito a guardare la shell solo secondi dopo che è comparsa (o a
      // sipario già caduto), la macchina è in coda e nessuna lettura qui
      // sotto parla del sito. Misurato con altri processi pesanti accanto:
      // 2 minuti per una suite che ne prende uno, e la shell letta a
      // attributo già caduto (> 5,2 s dopo).
      const ritardoDriver = Math.round(attoI.tOra - (attoI.tPrimo ?? attoI.tOra));
      test.skip(
        !attoI.coperto || ritardoDriver > AFFAMATA_MS,
        `quattro atti su ${rotta}: macchina affamata — il driver ha letto la shell ${ritardoDriver}ms dopo la sua comparsa${attoI.coperto ? "" : ", a sipario già caduto"} (soglia ${AFFAMATA_MS}): rilancia a macchina libera`,
      );
      expect(attoI.char.n, "nessuna lettera [data-pre-char] nella shell").toBeGreaterThan(0);
      expect(
        attoI.char.animate,
        `atto I: ${attoI.char.animate} lettere del titolo su ${attoI.char.n} hanno l'animazione dt-pre-char`,
      ).toBe(attoI.char.n);
      expect(
        attoI.schar.animate,
        `atto I: ${attoI.schar.animate} lettere della firma su ${attoI.schar.n} hanno dt-pre-schar`,
      ).toBe(attoI.schar.n);
      expect(attoI.cap.n, "nessun cap [data-pre-cap] dipinto nella shell").toBeGreaterThan(0);
      expect(attoI.cap.animate, `atto I: caps animati ${attoI.cap.animate}/${attoI.cap.n}`).toBe(attoI.cap.n);
      expect(attoI.word.n, "righe del payoff dipinte: dev'essere UNA lingua, due righe").toBe(2);
      expect(attoI.word.animate, `atto I: righe del payoff animate ${attoI.word.animate}/${attoI.word.n}`).toBe(2);
      const dallaShell = Math.round(attoI.tOra - (attoI.tPrimo ?? 0));
      test.info().annotations.push({ type: "atto I", description: `prima lettera «${attoI.statoPrimo}» a ${dallaShell}ms dalla shell` });
      // (Sotto carico questa lettura può arrivare a lettera già finita —
      // 1,42 s: allora non dice niente e lo si annota; il transito lo prova
      // comunque la sentinella, più sotto.)
      expect(
        ["running", "pending"].includes(attoI.statoPrimo) || dallaShell > 1300,
        `atto I: la prima lettera è «${attoI.statoPrimo}» a ${dallaShell}ms dalla shell — o è finita prima di essere vista, o non è mai partita`,
      ).toBe(true);

      // Il JS prende il timone (segnale, non ritardo).
      await expect
        .poll(async () => (await leggiRegistro(page)).live, {
          timeout: 15_000,
          message:
            "Preloader.tsx non ha mai preso il timone (data-pre-live): il film CSS suona da solo, ma handoff, chiusura e skip non hanno orchestratore",
        })
        .toBe(true);
      const alTimone = await leggiRegistro(page);
      saltaSeAffamata(alTimone, `quattro atti su ${rotta}`);
      // L'hero cinematico (e le sue lettere [data-hero-char]) c'è solo in home.
      if (rotta === "/") {
        expect(
          alTimone.heroOpacita,
          "nessuna lettera [data-hero-char] da leggere: o l'hero non è più reso dal server, o l'attributo è cambiato nome",
        ).not.toBeNull();
        // 0.02 per costruzione. È QUESTA la lettura che manca a `toBeVisible()`:
        // l'h1 è nel DOM, dipinto e "visibile", e non lo vede nessuno. (Vale
        // finché il JS arriva prima della rete CSS dell'hero, HERO_REST_MS =
        // 3,33 s: se questo rosso compare con tLive > 3,3 s è la macchina, non
        // il sito, e il messaggio lo dice.)
        expect(
          alTimone.heroOpacita!,
          `con il sipario a schermo le lettere dell'hero stanno a ${alTimone.heroOpacita} (JS al timone a ${Math.round(alTimone.tLive! - alTimone.tVisto!)}ms dall'armatura): dovrebbero essere ancora nascoste`,
        ).toBeLessThan(0.1);
      }

      // Si chiude da solo: nessun gesto, nessun tasto.
      await expect
        .poll(async () => (await leggiRegistro(page)).tCaduto !== null, {
          timeout: 25_000,
          message:
            "il sipario non è mai caduto da solo: la pagina resta murata (html[data-preloader] è overflow:hidden)",
        })
        .toBe(true);

      const fine = await leggiRegistro(page);
      const t0 = (await leggiT0(page)) ?? fine.tVisto!;
      const durata = Math.round(fine.tCaduto! - (fine.tLive ?? fine.tVisto!));
      test.info().annotations.push({
        type: "durata intro",
        description: `${durata}ms dal takeover alla caduta; dall'armatura: JS al timone ${Math.round(fine.tLive! - t0)}ms, handoff ${Math.round((fine.handoff ?? NaN) - t0)}ms, caduta ${Math.round(fine.tCaduto! - t0)}ms; ${fine.film.length} fotogrammi`,
      });

      // (e) L'HANDOFF: INTRO_EVENT parte quando la cancellatura della gomma
      // comincia ad allargarsi (le lettere dell'hero non devono accendersi a
      // gomma ancora al lavoro — sarebbe un altro tipo di intro). L'istante
      // atteso si ricava da quando la gomma è entrata: a INTRO_T.gomma, o
      // appena il JS è al timone se è arrivato dopo (e allora `veloce` oltre
      // INTRO_T.tardi); più il suo delay, il tratto e la pausa. Derivato, non
      // scritto: i tempi sono quelli del componente (GOMMA_TEMPI).
      expect(fine.handoff, "INTRO_EVENT (dt:intro:done) non è mai partito").not.toBeNull();
      const handoffDaT0 = Math.round(fine.handoff! - t0);
      const liveDaT0 = Math.round(fine.tLive! - t0);
      const entra = Math.max(INTRO_T.gomma * 1000, liveDaT0);
      const passo = gommaMs(entra >= INTRO_T.tardi * 1000 ? "veloce" : "normale");
      const attesoHandoff = entra + passo.reveal;
      expect(
        handoffDaT0,
        `l'handoff è partito a ${handoffDaT0}ms dall'armatura: PRIMA che la gomma finisse di disegnare (atteso ~${attesoHandoff}ms) — nessuno l'ha saltata`,
      ).toBeGreaterThanOrEqual(attesoHandoff - 150);
      const tettoHandoff = attesoHandoff + 1500;
      expect(
        handoffDaT0,
        `l'handoff è partito a ${handoffDaT0}ms dall'armatura, tetto ${tettoHandoff}ms (la gomma + 1,5 s di margine per il ticker, il precarico e la lettura del registro)`,
      ).toBeLessThan(tettoHandoff);

      // IL BUDGET SI ASSERISCE, non si annota. L'intro è UN solo montaggio a
      // ogni larghezza (onda «parità mobile 2», legge 3), e dal 22 settembre
      // finisce con la gomma: GOMMA_MS (atto I fino a INTRO_T.gomma, poi la
      // gomma `normale` intera), in app/lib/motion/intro-constants.ts. Il
      // margine copre il ticker e la lettura del registro, non un atto.
      // Nota: `durata` parte da `tLive` (il JS al timone), che arriva a atto I
      // già in corso: è ≤ dell'intro intera, il budget resta valido anche col
      // JS in ritardo (la gomma allora è `veloce`, più corta).
      const budget = GOMMA_MS + 170;
      expect(
        durata,
        `l'intro è durata ${durata}ms, budget ${budget}ms — un solo montaggio, GOMMA_MS in intro-constants.ts`,
      ).toBeLessThan(budget);
      // E a chiuderla è stato il JS, non il failsafe del boot script: quello
      // toglie SOLO `data-preloader` e lascia `data-pre-live` su <html>
      // (non sa niente del JS, né di Lenis, né dei listener di skip), mentre
      // `finish()` toglie tutti gli attributi insieme. Se qui restasse
      // `data-pre-live`, il verde sullo scroll qui sotto sarebbe merito di
      // SmoothScroll (la bretella), non del contratto.
      expect(
        await page.evaluate(() => document.documentElement.hasAttribute("data-pre-live")),
        "html[data-pre-live] è rimasto dopo la caduta: l'attributo l'ha tolto il failsafe di boot, non finish() di Preloader.tsx",
      ).toBe(false);
      // La caduta dall'armatura, con un tetto largo: la gomma intera dal suo
      // ingresso, più 1,5 s (il precarico che la gomma aspetta come `ready`
      // sta dentro, per costruzione: scade prima della fine del tratto). Oltre
      // sarebbe una pagina murata a film finito.
      const tettoCaduta = entra + passo.tutta + 1500;
      expect(
        Math.round(fine.tCaduto! - t0),
        `l'attributo è caduto ${Math.round(fine.tCaduto! - t0)}ms dopo l'armatura: più di 1,5 s dopo la fine della gomma (tetto ${tettoCaduta}ms): la pagina resta murata a intro finita`,
      ).toBeLessThan(tettoCaduta);

      // ── IL FILM, FOTOGRAMMA PER FOTOGRAMMA ─────────────────────────────
      const film = fine.film;
      /**
       * Il buco più largo della sentinella dentro [da, a] (ms dall'armatura):
       * fra due fotogrammi consecutivi, dal primo fotogramma all'inizio della
       * finestra, dall'ultimo alla sua fine. Serve a distinguere «l'atto non
       * c'è» da «la sentinella non c'era» (rAF affamata: vedi atti III-IV).
       */
      const bucoIn = (da: number, a: number) => {
        let max = 0;
        if (film.length === 0) return Math.round(a - da);
        const primo = film[0].t - t0;
        if (primo > da) max = Math.max(max, Math.min(primo, a) - da);
        for (let i = 1; i < film.length; i++) {
          const t1 = film[i - 1].t - t0;
          const t2 = film[i].t - t0;
          if (t2 < da || t1 > a) continue;
          max = Math.max(max, Math.min(t2, a) - Math.max(t1, da));
        }
        const ultimo = film[film.length - 1].t - t0;
        if (ultimo < a) max = Math.max(max, a - Math.max(ultimo, da));
        return Math.round(max);
      };
      expect(film.length, "la sentinella ha campionato troppo poco del film").toBeGreaterThan(10);
      // (b bis) ATTO I in movimento: la prima lettera è stata vista A METÀ
      // (0 < opacità < 1) e poi piena. Un fade-in che si vede, non solo un
      // nome di animazione.
      const aMeta = film.filter((f) => f.char > 0.02 && f.char < 0.98);
      expect(
        aMeta.length,
        `atto I: la prima lettera non è mai stata vista in transito (opacità fra 0 e 1) in ${film.length} fotogrammi — o è comparsa di colpo, o non è mai comparsa`,
      ).toBeGreaterThan(0);
      expect(
        film.some((f) => f.char >= 0.98),
        "atto I: la prima lettera non è mai arrivata a opacità piena",
      ).toBe(true);
      expect(film[0].charAnim, "atto I: al primo fotogramma la lettera non porta dt-pre-char").toBe(true);

      // (c) ATTO II: la linea di carica porta `dt-pre-track` — il nome esatto
      // di globals.css — e la sua `transform` CAMBIA lungo la corsa
      // (translateY −100% → 0, 0,60 → 2,15 s): almeno due valori distinti
      // in tutto il film (−100% prima, 0 dopo: bastano quelli). Se la
      // sentinella non ha coperto la corsa (buco ≥ 500 ms fra 0,6 e 2,15 s)
      // la prova non c'è, e lo si annota invece di inventarla.
      expect(
        film.some((f) => f.trackAnim),
        "atto II: [data-pre-track] non ha mai avuto l'animazione dt-pre-track",
      ).toBe(true);
      const trasformate = new Set(film.map((f) => f.track));
      const bucoTrack = bucoIn(INTRO_T.track * 1000, (INTRO_T.track + INTRO_T.trackDur) * 1000);
      test.info().annotations.push({
        type: "atto II",
        description: `${trasformate.size} trasformate distinte della linea di carica; buco massimo della sentinella nella corsa ${bucoTrack}ms`,
      });
      expect(
        trasformate.size >= 2 || bucoTrack >= 500,
        `atto II: la linea di carica ha mostrato ${trasformate.size} trasformata/e distinta/e in ${film.length} fotogrammi con la sentinella che copriva la corsa 0,6-2,15 s (buco massimo ${bucoTrack}ms) — non si è mossa`,
      ).toBe(true);

      // (d) LA GOMMA (22 set. 2026, al posto di porta e tuffo). La sentinella
      // legge `html[data-gomma]`, il `stroke-dashoffset` del tratto (dalla
      // lunghezza a 0 mentre la gomma disegna il cuore) e lo `stroke-width`
      // dell'allargamento (0 fino all'handoff, poi fino a coprire lo schermo).
      // Si prova per VALORI, come per l'arco: la rAF sotto carico resta a secco
      // anche per un secondo, quindi un fotogramma mancante in una finestra
      // senza copertura è la macchina (e lo si annota), con copertura è il film.
      const conGomma = film.filter((f) => f.gomma !== null && Number.isFinite(f.tratto));
      expect(
        conGomma.length,
        "la gomma non è mai stata vista: `html[data-gomma]` e il suo tratto non sono mai comparsi sotto il sipario",
      ).toBeGreaterThan(5);
      // Entra all'ora giusta: non prima di INTRO_T.gomma (col lockup ancora al centro).
      const tEntra = Math.round(conGomma[0].t - t0);
      expect(
        tEntra,
        `la gomma è entrata a ${tEntra}ms dall'armatura: prima di INTRO_T.gomma (${INTRO_T.gomma * 1000}), col lockup ancora in scena`,
      ).toBeGreaterThanOrEqual(INTRO_T.gomma * 1000 - 100);
      // Il tratto DISEGNA: un fotogramma a metà (fra la partenza e lo zero), e
      // mai all'indietro (tolleranza di mezza unità: è un attributo arrotondato).
      const partenza = conGomma[0].tratto;
      const aMetaTratto = conGomma.filter((f) => f.tratto < partenza - 1 && f.tratto > 1);
      const bucoTratto = bucoIn(entra + passo.reveal - 2000, entra + passo.reveal - 400);
      test.info().annotations.push({
        type: "la gomma",
        description: `entrata a ${tEntra}ms; ${aMetaTratto.length} fotogrammi col tratto a metà; buco massimo della sentinella nel tratto ${bucoTratto}ms`,
      });
      expect(
        aMetaTratto.length > 0 || bucoTratto >= 500,
        `la gomma non è mai stata vista a metà tratto (dashoffset fra 1 e ${arrotonda(partenza)}) con la sentinella che copriva il disegno (buco massimo ${bucoTratto}ms): il cuore non si è disegnato`,
      ).toBe(true);
      const indietro = conGomma.filter((f, i) => i > 0 && f.tratto > conGomma[i - 1].tratto + 0.5);
      expect(
        indietro.length,
        `il tratto della gomma è TORNATO INDIETRO in ${indietro.length} fotogramma/i (es. a ${indietro[0] ? Math.round(indietro[0].t - t0) : "?"}ms)`,
      ).toBe(0);
      // La cancellatura si allarga DOPO l'handoff, e solo in avanti.
      const allarga = film.filter((f) => Number.isFinite(f.allarga) && f.allarga > 0);
      const bucoAllarga = bucoIn(handoffDaT0 + 100, handoffDaT0 + passo.tutta - passo.reveal);
      expect(
        allarga.length > 0 || bucoAllarga >= 400,
        `la cancellatura non si è mai vista allargarsi con la sentinella che copriva l'uscita (buco massimo ${bucoAllarga}ms)`,
      ).toBe(true);
      if (allarga.length > 0) {
        expect(
          Math.round(allarga[0].t - t0),
          "la cancellatura si allargava già prima dell'handoff: le lettere dell'hero arriverebbero a sipario mezzo aperto",
        ).toBeGreaterThanOrEqual(handoffDaT0 - 100);
        const restringe = allarga.filter((f, i) => i > 0 && f.allarga < allarga[i - 1].allarga - 0.5);
        expect(restringe.length, "la cancellatura si è ristretta mentre si allargava").toBe(0);
        expect(
          allarga.every((f) => f.gomma === "reveal"),
          "la cancellatura si allarga ma `html[data-gomma]` non dice «reveal»",
        ).toBe(true);
      }

      // (f) LA PAGINA RESTITUITA: attributo via, overlay fuori dal paint,
      // Lenis rilasciato, la pagina SCORRE, la sessione segnata.
      const serrature = await bloccata(page);
      expect(serrature.attributo, "html[data-preloader] è ancora lì dopo la caduta registrata").toBe(false);
      const ov = await overlay(page);
      expect(ov.presente, "la shell è stata rimossa dal DOM: il contratto è display:none, non un unmount").toBe(true);
      expect(
        ov.display === "none" || ov.visibility === "hidden",
        `l'overlay è ancora dipinto a intro finita (display ${ov.display}, visibility ${ov.visibility})`,
      ).toBe(true);
      // E non resta sopra la pagina a mangiarsi i click: al centro dello
      // schermo deve esserci il sito.
      const sopra = await page.evaluate(() => {
        const el = document.elementFromPoint(
          Math.round(window.innerWidth / 2),
          Math.round(window.innerHeight / 2),
        );
        return el?.closest(".dt-preloader") ? "preloader" : (el?.tagName ?? "niente");
      });
      expect(sopra, "al centro dello schermo c'è ancora l'overlay dell'intro").not.toBe("preloader");
      await expect
        .poll(async () => (await bloccata(page)).lenis, {
          timeout: 5_000,
          message: "<html> porta ancora `lenis-stopped` dopo l'intro: in globals.css è overflow:hidden, cioè un viewport murato",
        })
        .toBe(false);
      expect(
        (await bloccata(page)).overflow,
        "l'overflow verticale di <html> è ancora hidden a intro finita",
      ).not.toBe("hidden");
      const y = await scorreDavvero(page);
      expect(
        y,
        "dopo l'intro la pagina non si è mossa di un pixel con scrollBy: è il modo peggiore di rompersi, perché sembra che il sito sia arrivato",
      ).toBeGreaterThan(0);
      expect(
        await page.evaluate((chiave) => sessionStorage.getItem(chiave), INTRO_KEY),
        `sessionStorage ${INTRO_KEY} non è INTRO_FILM a film finito: alla prossima entrata nella home si rivedrebbe il film`,
      ).toBe(INTRO_FILM);

      // (g) IL FILM NON SI RIPETE, SUONA LA CORTA. Alberto il 13 settembre
      // 2026 (A18, A20): alla seconda entrata nella home la porta corta con
      // la sagoma (spec §6.2, riga 3); la chiave resta INTRO_FILM.
      await page.goto(rotta, { waitUntil: "domcontentloaded" });
      const ritorno = await leggiRegistro(page);
      expect(ritorno.visto, `alla seconda navigazione su ${rotta} la porta corta non è suonata`).toBe(true);
      expect(ritorno.valore, "alla seconda navigazione della home è suonato il film invece della corta").toBe("short");
      await expect
        .poll(async () => (await leggiRegistro(page)).tCaduto !== null, {
          timeout: 15_000,
          message: "la porta corta non si è chiusa da sola",
        })
        .toBe(true);
      const corta = await leggiRegistro(page);
      // La corta è la gomma `veloce`, montata appena il JS è al timone: si
      // chiude entro la sua durata più 1,5 s da lì.
      const tettoCorta = gommaMs("veloce").tutta + 1500;
      const cortaDalJs = Math.round(corta.tCaduto! - (corta.tLive ?? corta.tVisto!));
      expect(
        cortaDalJs,
        `la corta è caduta ${cortaDalJs}ms dopo il JS al timone, oltre la gomma veloce + 1,5 s (${tettoCorta}ms)`,
      ).toBeLessThan(tettoCorta);
    });
  }

  test("si salta al PRIMO tocco che il JS può sentire, e la gomma veloce suona intera @layout", async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.use.hasTouch,
      "serve un contesto touch: qui il gesto del dito non esiste",
    );
    await page.goto("/", { waitUntil: "commit" });
    // Il sipario c'è: da qui il visitatore può toccare.
    await page.waitForFunction(
      () => document.documentElement.hasAttribute("data-preloader"),
      undefined,
      { timeout: 15_000, polling: "raf" },
    );

    // UN DITO VERO, RIPETUTO. Il listener di skip è `pointerdown`, e Chromium
    // lo genera dal tocco (verificato: pointerdown arriva PRIMA di
    // touchstart). Il tap cade al centro, dove c'è l'overlay stesso: nessun
    // link sotto da attivare per sbaglio.
    // Si tocca dal momento in cui il sipario c'è — come farebbe chi ha
    // fretta — e si ritocca ogni ~150 ms finché `html[data-pre-skip]` non
    // compare. Il film è CSS dal paint ma lo skip è del JS: un tocco arrivato
    // PRIMA di `data-pre-live` può cadere nel vuoto (nessun listener) o —
    // misurato, vedi sotto — far idratare React lì per lì ed essere servito
    // con mezzo secondo di ritardo. Il test lo registra (annotazioni
    // «tocchi persi» e «tocco → handoff») invece di nasconderlo dietro
    // un'attesa. Ci si ferma comunque se l'handoff è arrivato da solo: la
    // corsa è persa, e lo si dice.
    const vp = page.viewportSize()!;
    const scadenza = Date.now() + 8_000;
    let stato = { skip: false, handoff: false, tocchi: 0 };
    while (Date.now() < scadenza && !stato.skip && !stato.handoff) {
      await page.touchscreen.tap(Math.round(vp.width / 2), Math.round(vp.height / 2));
      await page.waitForTimeout(150);
      const r = await leggiRegistro(page);
      stato = { skip: r.tSkip !== null, handoff: r.handoff !== null, tocchi: r.tocchi.length };
    }
    // Lo skip compare al dito (boot script), l'handoff arriva quando il JS
    // idrata: qui si aspetta il secondo, altrimenti si leggerebbe il registro
    // in mezzo ai due e si direbbe «l'handoff non è avvenuto» mentre sta per
    // avvenire. Il tetto è quello del mandato più il margine dell'idratazione.
    if (stato.skip && !stato.handoff) {
      await expect
        .poll(async () => (await leggiRegistro(page)).handoff !== null, {
          timeout: 8_000,
          message: "dopo lo skip il JS non ha mai sparato INTRO_EVENT",
        })
        .toBe(true);
    }
    const sonda = await leggiRegistro(page);
    saltaSeAffamata(sonda, "skip al tocco");
    const rel = (t: number | null) => (t === null ? "—" : `${Math.round(t - (sonda.tVisto ?? 0))}`);
    const cronologia = `ms dall'armatura — live ${rel(sonda.tLive)}, tocchi [${sonda.tocchi.map((t) => rel(t)).join(", ")}], skip ${rel(sonda.tSkip)}, handoff ${rel(sonda.handoff)}; eventi ${sonda.eventi.join(" ")}`;
    test.info().annotations.push({ type: "cronologia skip", description: cronologia });
    test.info().annotations.push({
      type: "tocchi persi",
      description: `${sonda.tocchi.filter((t) => sonda.handoff === null || t < sonda.handoff).length - 1} tocco/hi caduti nel vuoto prima di quello servito (JS live a ${Math.round((sonda.tLive ?? 0) - (sonda.tVisto ?? 0))}ms dall'armatura)`,
    });
    expect(
      sonda.tocchi.length,
      "il tap non ha prodotto nessun pointerdown: il listener dello skip non è nemmeno raggiungibile dal dito",
    ).toBeGreaterThan(0);
    expect(
      sonda.tSkip,
      `html[data-pre-skip] non è mai comparso dopo ${sonda.tocchi.length} tocchi: lo skip in CSS non è scattato${sonda.handoff !== null ? " (l'intro è arrivata al tuffo da sola: la corsa è persa, non è un difetto dello skip)" : ""}`,
    ).not.toBeNull();
    expect(sonda.handoff, "dopo lo skip non è mai partito INTRO_EVENT: l'handoff all'hero non è avvenuto").not.toBeNull();

    // LA DISCRIMINANTE, RISCRITTA IL 2026-08-18 (lo skip è uscito dal JS).
    // Prima skip e handoff erano lo stesso istante — li faceva entrambi
    // `seekToDive()` nel gestore del pointerdown — e il test pretendeva che
    // distassero meno di 200 ms. Ora il primo tocco lo raccoglie lo script di
    // boot PRIMA del paint (layout.tsx): `data-pre-skip` compare al dito,
    // mentre `INTRO_EVENT` lo spara Preloader.tsx quando idrata, che è più
    // tardi. Quella distanza non è più un difetto: è la misura
    // dell'idratazione, e la risposta VISIVA (le keyframe che vanno al tuffo)
    // non l'ha aspettata. Quindi si pretendono tre cose diverse:
    //   1. lo skip è servito al dito, sempre — è la garanzia nuova, e sotto i
    //      200 ms anche quando React non c'è ancora;
    //   2. lo skip precede il tuffo naturale: è ciò che distingue uno skip da
    //      un'attesa (`data-pre-skip` lo scrive SOLO lo skip, e prima di dive);
    //   3. l'handoff SEGUE lo skip ed entra nel tetto del mandato (1 700 ms).
    // Il tocco che conta è l'ULTIMO prima dello skip: i precedenti, se ci
    // sono, sono caduti quando ancora nessuno ascoltava.
    const toccoBuono = sonda.tocchi.filter((t) => t <= sonda.tSkip!).pop();
    expect(toccoBuono, "lo skip precede ogni tocco registrato").not.toBeUndefined();
    const servito = sonda.tSkip! - toccoBuono!;
    const ritardo = sonda.handoff! - toccoBuono!;
    const dopoLive = sonda.tLive !== null && toccoBuono! >= sonda.tLive;
    test.info().annotations.push({
      type: "tocco → skip → handoff",
      description: `skip ${Math.round(servito)}ms, handoff ${Math.round(ritardo)}ms (${dopoLive ? "tocco a JS già al timone" : "tocco PRIMA del JS: lo serve il boot script"})`,
    });
    expect(
      servito,
      `fra il dito e html[data-pre-skip] sono passati ${Math.round(servito)}ms: lo skip non è più sincrono — il boot script dovrebbe servirlo senza JS (${cronologia})`,
    ).toBeLessThan(200);
    expect(
      sonda.tSkip! - (sonda.tVisto ?? 0),
      `lo skip è arrivato dopo l'ultimo istante in cui è offerto (${Math.round(sonda.tSkip! - (sonda.tVisto ?? 0))}ms dall'armatura, INTRO_T.skip ${INTRO_T.skip * 1000}): non è uno skip, è un'attesa (${cronologia})`,
    ).toBeLessThan(INTRO_T.skip * 1000);
    expect(
      sonda.handoff! - sonda.tSkip!,
      `l'handoff precede lo skip di ${Math.round(sonda.tSkip! - sonda.handoff!)}ms: non viene da quel gesto (${cronologia})`,
    ).toBeGreaterThan(-50);
    // Dal 22 settembre lo skip fa partire la gomma `veloce`, che disegna il
    // cuore prima dell'handoff: il tetto è la sua corsa fino all'allargamento,
    // contata da quando il JS ha potuto montarla (il tocco, o il JS al timone
    // se il tocco l'ha servito il boot script prima), più un margine.
    const montabile = Math.max(toccoBuono!, sonda.tLive ?? toccoBuono!);
    const veloce = gommaMs("veloce");
    expect(
      sonda.handoff! - montabile,
      `tocco → dt:intro:done ${Math.round(sonda.handoff! - montabile)}ms dal JS in grado di rispondere, oltre la gomma veloce fino all'allargamento + 1 s (${veloce.reveal + 1000}ms) (${cronologia})`,
    ).toBeLessThan(veloce.reveal + 1000);

    // Saltare fa partire la gomma `veloce` e lei suona per intero: lo skip
    // taglia il preambolo, non la porta. Si aspetta la caduta e si misura che
    // NON sia stata istantanea (un taglio secco lascerebbe il cuore a metà) e
    // che non abbia aspettato l'intro naturale (GOMMA_MS).
    await expect
      .poll(async () => (await bloccata(page)).attributo, {
        timeout: 10_000,
        message: "saltata l'intro, il sipario è rimasto su <html>: la pagina resta bloccata",
      })
      .toBe(false);
    const dopo = await leggiRegistro(page);
    const chiusuraDalTocco = Math.round(dopo.tCaduto! - toccoBuono!);
    const chiusuraDalJs = Math.round(dopo.tCaduto! - montabile);
    test.info().annotations.push({ type: "skip → caduta", description: `${chiusuraDalTocco}ms dal tocco, ${chiusuraDalJs}ms dal JS in grado di rispondere` });
    expect(
      chiusuraDalJs,
      `il sipario è caduto ${chiusuraDalJs}ms dopo che il JS ha potuto montare la gomma: la gomma veloce (${veloce.tutta}ms) non ha suonato intera`,
    ).toBeGreaterThanOrEqual(veloce.tutta - 100);
    // Il tetto: la gomma veloce intera, con il margine di un thread occupato.
    // Che non sia la fine naturale lo dice, oltre a `data-pre-skip`, il
    // confronto con quando sarebbe finita da sola.
    expect(
      chiusuraDalJs,
      `il sipario è caduto ${chiusuraDalJs}ms dopo il JS al timone: lo skip non ha accorciato niente`,
    ).toBeLessThan(veloce.tutta + 1500);
    const fineNaturale = Math.round(GOMMA_MS - (toccoBuono! - sonda.tVisto!));
    if (fineNaturale - veloce.tutta > 800) {
      expect(
        chiusuraDalTocco,
        `il sipario è caduto ${chiusuraDalTocco}ms dopo il tocco, cioè alla fine NATURALE (${fineNaturale}ms dal tocco): lo skip non ha spostato la chiusura`,
      ).toBeLessThan(fineNaturale - 400);
    }
    await expect
      .poll(async () => (await bloccata(page)).lenis, {
        timeout: 5_000,
        message: "l'uscita per skip ha lasciato Lenis fermo: pagina viva a vedersi, morta a scorrere",
      })
      .toBe(false);
    expect(await scorreDavvero(page), "dopo lo skip la pagina non scorre").toBeGreaterThan(0);
  });

  // ── L'ASSERZIONE PER CUI ESISTE TUTTA LA FASE ───────────────────────────
  // @layout non perché il layout cambi, ma perché la serratura è la stessa a
  // tutte e cinque le larghezze e ogni progetto deve vederla aprirsi. Un'uscita
  // che lascia Lenis fermo non è un difetto d'animazione: è il sito che non
  // scorre. Qui, a differenza del test dei quattro atti, si scorre con la
  // ROTELLA: è il gesto dell'utente, e passa da Lenis.
  test("uscita l'intro, la pagina scorre di nuovo @layout", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Prima di aspettare l'uscita: c'era davvero qualcosa da cui uscire. Senza
    // questa riga, il giorno in cui il sipario non partisse più questo test
    // diventerebbe verde e muto — aspetterebbe la caduta di un attributo mai
    // comparso e la troverebbe subito.
    expect(
      (await leggiRegistro(page)).visto,
      "nessun sipario da cui uscire: `data-preloader` non è mai comparso",
    ).toBe(true);
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-preloader"),
      undefined,
      { timeout: 30_000, polling: "raf" },
    );

    // Le due serrature, lette dove stanno davvero: <html>, non body.
    await expect
      .poll(async () => (await bloccata(page)).lenis, {
        timeout: 5_000,
        message:
          "<html> porta ancora `lenis-stopped` dopo l'intro: in globals.css è overflow:hidden, cioè un viewport murato",
      })
      .toBe(false);
    const serrature = await bloccata(page);
    expect(
      serrature.overflow,
      "l'overflow verticale di <html> è ancora hidden a intro finita",
    ).not.toBe("hidden");

    // E poi il gesto vero, perché gli attributi possono anche essere a posto
    // mentre la pagina non si muove. Rotella e non `window.scrollTo`: Lenis
    // alimenta ScrollTrigger coi propri eventi, e uno scroll programmatico
    // scavalcherebbe esattamente il pezzo che stiamo provando.
    //
    // Si insiste per qualche secondo di proposito: Lenis appena rilasciato può
    // avere un fotogramma di assestamento, e un solo colpo lo scambierebbe per
    // una pagina morta.
    let y = 0;
    const scadenza = Date.now() + 10_000;
    while (Date.now() < scadenza && y === 0) {
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(120);
      y = await page.evaluate(() => Math.round(window.scrollY));
    }
    expect(
      y,
      "dopo l'intro la pagina non si è mossa di un pixel in 10s di rotella: è il modo peggiore di rompersi, perché sembra che il sito sia arrivato",
    ).toBeGreaterThan(0);
  });

  test("alla seconda navigazione della home suona la porta corta, con la sagoma", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Il tasto DOPO il segnale: premuto subito dopo `domcontentloaded` non
    // trova nessun listener. Oppure il film è già finito da solo sotto carico.
    await page.waitForFunction(
      () =>
        document.documentElement.hasAttribute("data-pre-live") ||
        !document.documentElement.hasAttribute("data-preloader"),
      undefined,
      { timeout: 15_000, polling: "raf" },
    );
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      ([chiave, film]) =>
        !document.documentElement.hasAttribute("data-preloader") && sessionStorage.getItem(chiave) === film,
      [INTRO_KEY, INTRO_FILM] as const,
      { timeout: 20_000, polling: "raf" },
    );

    // Seconda navigazione: la porta corta con la sagoma (Alberto, 13 settembre
    // 2026, A18 e A20; spec §6.2 riga 3). La corta salta lockup, didascalie,
    // linea e payoff (D31).
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const ritorno = await leggiRegistro(page);
    expect(ritorno.visto, "alla seconda navigazione della home la porta corta non è suonata").toBe(true);
    expect(ritorno.valore).toBe("short");
    const dentro = await page.evaluate(() => {
      const root = document.getElementById("dt-preloader");
      if (!root || !document.documentElement.hasAttribute("data-preloader")) return null;
      const fig = root.querySelector("[data-pre-figure]")!;
      return {
        contenuto: getComputedStyle(root.querySelector("[data-pre-content]")!).display,
        sagoma: getComputedStyle(fig).animationName,
        durata: getComputedStyle(fig).animationDuration,
        animazioni: root.getAnimations({ subtree: true }).length,
      };
    });
    test.skip(dentro === null, "la corta era già caduta quando il driver l'ha letta: macchina affamata, rilancia");
    expect(dentro!.contenuto, "nella corta [data-pre-content] si dipinge").toBe("none");
    expect(dentro!.sagoma).toBe("dt-pre-in-fade");
    expect(dentro!.durata).toBe("0.3s");
    expect(dentro!.animazioni, "nella corta nessuna keyframe è partita").toBeGreaterThan(0);
    await page.waitForFunction(() => !document.documentElement.hasAttribute("data-preloader"), undefined, {
      timeout: 15_000,
      polling: "raf",
    });
    expect(await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY)).toBe(INTRO_FILM);

    // E l'hero è leggibile davvero dopo la corta: i gruppi di lettere IN SCENA
    // si accendono. D-A49-5 (52fad5e): il rito suona all'handoff per i gruppi
    // in scena e alla prima entrata nel viewport per gli altri; a 1440 a
    // riposo il lockup e la firma stanno sull'acqua sotto la piega e restano
    // armati (0,02) finché non ci si arriva, e in scena c'è l'H1; a 390 in
    // scena c'è il lockup. «In scena» come lo legge HeroCinematic: il
    // riquadro del gruppo nel viewport. Nessun gruppo in scena vale 0.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const gruppi = [
              ["[data-hero-char]", "[data-hero-lockup]"],
              ["[data-hero-tchar]", "h1"],
              ["[data-hero-schar]", "[data-hero-script]"],
            ] as const;
            const inScena: number[] = [];
            for (const [lettera, host] of gruppi) {
              const el = document.querySelector(`#top ${lettera}`);
              const h = document.querySelector(`#top ${host}`);
              if (!el || !h) continue;
              const b = h.getBoundingClientRect();
              if (b.bottom > 0 && b.top < window.innerHeight) inScena.push(Number(getComputedStyle(el).opacity));
            }
            return inScena.length > 0 ? Math.min(...inScena) : 0;
          }),
        { timeout: 10_000, message: "le lettere dell'hero in scena sono rimaste nascoste dopo la corta" },
      )
      .toBeGreaterThan(0.9);
  });

  // ── IL BANNER COOKIE COMPARE ALL'HANDOFF ────────────────────────────────
  // Sotto il sipario, mai (CookieConsent.tsx: il pannello sta PRIMA di #main,
  // sarebbe il primo bersaglio del Tab sotto un telo opaco); all'handoff, sì
  // — INTRO_EVENT, o `hasIntroFired()` se il JS idrata a tuffo già partito.
  // Il `beforeEach` in cima al file registra il consenso per TUTTA la suite:
  // qui lo si toglie, perché il banner è il soggetto.
  test("il banner cookie compare all'handoff, non prima", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect((await leggiRegistro(page)).visto, "nessun sipario: il test non prova niente").toBe(true);

    await expect
      .poll(async () => (await leggiRegistro(page)).handoff !== null, {
        timeout: 15_000,
        message: "INTRO_EVENT non è mai partito",
      })
      .toBe(true);
    await expect
      .poll(async () => (await leggiRegistro(page)).tConsent !== null, {
        timeout: 5_000,
        message: "html[data-consent] non è mai comparso dopo l'handoff: il banner cookie non si vede",
      })
      .toBe(true);
    const r = await leggiRegistro(page);
    const dopoHandoff = Math.round(r.tConsent! - r.handoff!);
    test.info().annotations.push({ type: "banner dopo handoff", description: `${dopoHandoff}ms` });
    // Mai prima: con il sipario ancora chiuso il banner sarebbe un landmark
    // invisibile e tre comandi sotto un telo. (Il boot script non mette
    // `data-consent` quando arma il sipario; l'effect di CookieConsent lo
    // mette all'evento.) Un margine di un frame per l'ordine degli observer.
    expect(
      dopoHandoff,
      `il banner cookie è comparso ${-dopoHandoff}ms PRIMA dell'handoff: sotto il sipario`,
    ).toBeGreaterThanOrEqual(-50);
    // E subito dopo, non alla rete di HERO_REST_MS o chissà quando.
    expect(dopoHandoff, `il banner cookie è arrivato ${dopoHandoff}ms dopo l'handoff`).toBeLessThan(1_000);
    // A schermo, davvero: la regione è dipinta e sopra il pannello.
    await expect(page.getByRole("region", { name: /cookie/i })).toBeVisible();
    // Con la fine dell'intro, il banner è ancora lì (non lo porta via finish()).
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute("data-preloader"),
      undefined,
      { timeout: 15_000, polling: "raf" },
    );
    await expect(page.getByRole("region", { name: /cookie/i })).toBeVisible();
  });

  test.describe("con reduced-motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("anche alla visita di ritorno nessun sipario, né film né corta", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      expect((await leggiRegistro(page)).visto, "con reduced-motion alla prima visita è comparso un sipario").toBe(false);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      expect((await leggiRegistro(page)).visto, "con reduced-motion alla visita di ritorno è comparsa la corta").toBe(false);
      await page.goto("/acquista", { waitUntil: "domcontentloaded" });
      expect((await leggiRegistro(page)).visto, "con reduced-motion su /acquista è comparsa la corta").toBe(false);
    });

    test("l'intro non parte mai e la pagina arriva intera", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const registro = await leggiRegistro(page);
      expect(
        registro.visto,
        "con reduced-motion `data-preloader` è comparso lo stesso: l'inline script del layout non sta escludendo la preferenza",
      ).toBe(false);
      // La shell è nel documento a ogni visita (server); senza l'attributo è
      // display:none e nessuna @keyframes del film parte.
      const ov = await overlay(page);
      expect(ov.presente, "la shell dell'intro manca dal documento").toBe(true);
      expect(ov.display, "overlay dell'intro visibile con reduced-motion").toBe("none");
      expect(
        await page.evaluate(() => {
          const root = document.getElementById("dt-preloader");
          return root ? root.getAnimations({ subtree: true }).length : -1;
        }),
        "con reduced-motion il film CSS è partito lo stesso dentro la shell nascosta",
      ).toBe(0);
      expect(
        registro.film.length,
        "con reduced-motion la sentinella ha campionato fotogrammi del film: l'attributo è comparso",
      ).toBe(0);

      // Nessuna serratura, di nessun tipo: qui Lenis non esiste nemmeno
      // (SmoothScroll lo distrugge), quindi `lenis-stopped` sarebbe un
      // residuo che nessuno verrebbe più a togliere.
      const serrature = await bloccata(page);
      expect(serrature.lenis, "`lenis-stopped` su <html> con reduced-motion").toBe(false);
      expect(serrature.overflow, "<html> con overflow nascosto e nessuno che lo riapra").not.toBe(
        "hidden",
      );

      // "Completa" non vuol dire "presente": senza intro non c'è nessun tween
      // che rivelerà l'hero, quindi tutto ciò che l'intro avrebbe rivelato
      // deve essere già a piena opacità — le lettere del lockup, della firma e
      // dell'H1 (il blocco CTA non è più di quella timeline: è sempre visibile).
      const spente = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll("[data-hero-char], [data-hero-tchar], [data-hero-schar]"),
        ).filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length,
      );
      expect(spente, "pezzi dell'hero rimasti trasparenti in attesa di un'animazione che non parte").toBe(0);
      // E l'hero è a schermo. A44 (20 set. 2026): la banda della foto è a schermo intero e il primo
      // h1 sta sotto la piega, come su era-residence; è visibile, a piena opacità, e uno scroll lo porta
      // nel viewport senza che nessuna animazione debba rivelarlo.
      const h1 = page.locator("h1").first();
      await expect(h1, "l'h1 dell'hero non è visibile con reduced-motion").toBeVisible();
      expect(await h1.evaluate((el) => Number(getComputedStyle(el).opacity)), "l'h1 non è a piena opacità").toBeGreaterThanOrEqual(0.9);
      await h1.scrollIntoViewIfNeeded();
      await expect(h1).toBeInViewport();
      // La pagina scorre: nessuna serratura residua.
      expect(await scorreDavvero(page), "con reduced-motion la pagina non scorre").toBeGreaterThan(0);
    });
  });
});
