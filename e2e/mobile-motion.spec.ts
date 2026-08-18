import type { Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { INTRO_EVENT, INTRO_KEY, INTRO_MS, INTRO_T } from "../app/lib/motion/intro-constants";

// Coreografia mobile — wave "parità mobile".
//
// Questi test misurano il MOVIMENTO, non la presenza dei nodi. È la lacuna che
// l'audit ha trovato nella suite (docs/mobile-parity.md §6.2): a 390px non c'era
// una sola asserzione che provasse che un tween fosse partito. Un `toBeVisible()`
// ignora l'opacità, quindi passava identico che l'animazione ci fosse o no.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

// ── Il fermo-immagine del primo gesto ─────────────────────────────────────
// Decisione 2026-08-11 (docs/mobile-parity.md §9.2): resta sulla rotella, sparisce
// sul dito. Col mouse è una finezza; col dito era una pagina che non rispondeva
// per quasi un secondo — misurato 991ms, ed è un blocco vero perché
// `lenis.stop()` mette `lenis-stopped` su <html>, che in CSS è `overflow: hidden`.
// L'hero è «pronto al gesto» quando HeroCinematic ha idratato e ha armato il
// rito del primo scroll: lo si legge dallo stile inline `animation: none` che
// scrive sul blocco `.dt-hero-rest` (spegne la rete CSS: da lì comanda GSAP).
// Prima si aspettava un timer fisso (600 ms dopo domcontentloaded): sotto il
// carico dei quattro worker l'idratazione arriva dopo, il listener non esiste
// ancora e il gesto cade nel vuoto — un rosso che non dice niente sul sito.
// Se invece è già scattata la rete CSS (idratazione oltre HERO_REST_WARM_MS,
// 6 s: il blocco è visibile e il rito è ceduto alla CSS per scelta), lo si
// dichiara: il test del fermo-immagine si salta col numero in chiaro.
async function heroReady(page: Page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>(".dt-hero-rest");
      if (!el) return false;
      // Chromium serializza lo shorthand inline come «none 0s ease 0s …»: si legge il longhand.
      return el.style.animationName === "none" || Number(getComputedStyle(el).opacity) > 0.9;
    },
    null,
    { timeout: 20_000, polling: 50 },
  );
}
async function heroNetAlreadyFired(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".dt-hero-rest");
    return !!el && el.style.animationName !== "none";
  });
}

test.describe("il primo gesto sull'hero", () => {
  test("con la rotella la pagina si ferma un istante, ed è voluto", async ({ page, goto }) => {
    // `goto` e non `page.goto`: da 768 in su il sipario parte, e finché copre
    // tiene Lenis fermo per conto suo. Senza saltarlo, questi due test
    // leggerebbero `lenis-stopped` e crederebbero di aver misurato il gesto.
    await goto("/");
    await heroReady(page);
    if (await heroNetAlreadyFired(page)) {
      test.skip(true, "idratazione oltre HERO_REST_WARM_MS: il rito del primo gesto è ceduto alla rete CSS (voluto)");
    }

    await page.mouse.wheel(0, 200);
    // Il blocco deve comparire: è la firma del gesto sul puntatore.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis-stopped")), {
        timeout: 2_000,
        message: "il fermo-immagine della rotella non è scattato",
      })
      .toBe(true);

    // …e deve rilasciare da solo, senza che l'utente faccia altro.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis-stopped")), {
        timeout: 4_000,
        message: "il fermo-immagine non si è mai sciolto: la pagina resta bloccata",
      })
      .toBe(false);
  });

  test("col dito la pagina non si blocca mai @layout", async ({ page, goto }, testInfo) => {
    test.skip(
      !testInfo.project.use.hasTouch,
      "serve un contesto touch: qui il gesto del dito non esiste",
    );
    await goto("/");
    await heroReady(page);

    // Il gesto vero del dito, come lo sente il listener della hero.
    await page.evaluate(() => window.dispatchEvent(new Event("touchmove", { bubbles: true })));
    await page.waitForTimeout(300);

    expect(
      await page.evaluate(() => document.documentElement.classList.contains("lenis-stopped")),
      "il dito ha bloccato il viewport: è esattamente ciò che la decisione §9.2 toglie",
    ).toBe(false);

    // E il blocco sotto si rivela lo stesso: si perde il fermo, non il gesto.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.querySelector(".dt-hero-rest");
            return el ? Number(getComputedStyle(el).opacity) : 0;
          }),
        { timeout: 4_000, message: "il blocco sotto l'hero non si è rivelato al tocco" },
      )
      .toBeGreaterThan(0.9);
  });
});

// ── I set piece entrano MENTRE li si guarda ───────────────────────────────
// Il test che mancava, e da cui è passato un difetto vero: il sipario di Paths
// scattava con il pannello 170px SOTTO il bordo basso dello schermo, su tutti e
// due i pannelli, per l'intera sessione — perché il documento cresce di ~238px
// dopo l'idratazione e la riga di partenza era stata calcolata prima. Nessuna
// asserzione se ne accorgeva: il nodo c'era, l'animazione partiva, il contenuto
// finiva composto. Semplicemente non lo vedeva nessuno.
//
// Quindi qui non si chiede «è partita?» ma «dov'era quando è partita?».
const SET_PIECE = [
  { nome: "il sipario di Paths", sel: ".dt-paths [data-paths-panel], .dt-paths article", prop: "clipPath" },
  { nome: "le tessere del muro", sel: "[data-wall-tile]", prop: "opacity" },
  { nome: "il sipario dell'orizzonte", sel: "[data-horizon-slide]", prop: "clipPath" },
] as const;

for (const { nome, sel, prop } of SET_PIECE) {
  test(`${nome} entra mentre è in campo @layout`, async ({ page, goto }, testInfo) => {
    test.skip(
      (testInfo.project.use.viewport?.width ?? 0) >= 1024,
      "questo è il contratto del ramo mobile: da lg in su comanda il set piece desktop",
    );
    // DIFETTO NOTO, NON AGGIRATO. Il sipario di Paths scatta col pannello sotto
    // il bordo basso a OGNI larghezza (misurato a frame: 717px su 640, 769px su
    // 664, 1123px su 1024). Un primo giro sembrava salvare 390px: era fortuna,
    // non una soglia. Escluse per misura, non per ipotesi: non è il ritardo di
    // campionamento (la sentinella legge in rAF dentro la pagina), non è la rete
    // di sicurezza (la sua guardia ora legge il rettangolo vivo, non `st.start`),
    // non è il selettore (matcha esattamente i due pannelli). Resta aperto
    // perché la causa non è isolata, e un verde ottenuto spostando la soglia
    // varrebbe meno di un `fixme` che dice la verità.
    test.fixme(
      nome === "il sipario di Paths",
      "difetto aperto: il sipario di Paths parte fuori campo — vedi docs/mobile-parity.md §9.4",
    );
    await goto("/");

    // Si scende a passi piccoli e a ogni passo si guarda se QUALCUNO ha appena
    // cominciato a muoversi. Al primo che parte si legge dov'era.
    //
    // DUE TRAPPOLE, ed entrambe hanno prodotto un rosso finto prima di essere
    // capite. Valgono per chiunque scriva il prossimo test di movimento.
    //
    // (1) L'assestamento prima della fotografia. Gli stati nascosti li scrive il
    //     ramo GSAP dopo l'idratazione: fotografando subito, il primo "cambio"
    //     che si vede è il NASCONDERSI, non il rivelarsi, e il test dichiarava
    //     che l'animazione parte a scrollY 0 — vero e privo di significato.
    // (2) Lo scroll va guidato dalla ROTELLA, non da `window.scrollTo`. Lenis
    //     alimenta ScrollTrigger con i propri eventi (`lenis.on("scroll",
    //     ScrollTrigger.update)`): uno scroll programmatico sposta la pagina
    //     senza passare di lì, e i trigger non si aggiornano mai. Il muro e i
    //     due pannelli restavano nascosti per tutta la corsa e il test
    //     concludeva «nessun ingresso da misurare» su un ingresso che c'è.
    //     È lo stesso motivo per cui home.spec.ts pilota con page.mouse.wheel.
    const vh = page.viewportSize()!.height;
    const settle = async () =>
      page.evaluate(async () => {
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 1200));
      });
    await settle();

    // (3) LA MISURA VA PRESA DENTRO LA PAGINA, A FRAME. Campionare da Playwright
    //     fra un colpo di rotella e l'altro misura anche il ritardo di Lenis,
    //     che è smorzato: si legge il rettangolo mentre lo scroll insegue
    //     ancora il bersaglio, e l'elemento sembra 80-90px più in basso di
    //     dov'era davvero quando il trigger è scattato. Una sentinella in rAF
    //     registra la posizione nel fotogramma esatto in cui lo stile cambia.
    const sentinella = await page.evaluateHandle(
      ([selector, property]) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
        const base = els.map((el) => getComputedStyle(el)[property as "opacity"]);
        const nascosti = els
          .map((el, i) => ({ el, i }))
          .filter(({ i }) =>
            property === "opacity"
              ? Number(base[i]) < 0.05
              : base[i] !== "none" && !/inset\(0%\s+0%\s+0%\s+0%/.test(base[i]),
          );
        const out: { trovato: boolean; top: number; nascosti: number; n: number } = {
          trovato: false,
          top: 0,
          nascosti: nascosti.length,
          n: els.length,
        };
        const tick = () => {
          if (!out.trovato) {
            for (const { el, i } of nascosti) {
              if (getComputedStyle(el)[property as "opacity"] === base[i]) continue;
              out.trovato = true;
              out.top = el.getBoundingClientRect().top;
              break;
            }
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
        return out;
      },
      [sel, prop] as const,
    );

    for (let step = 0; step < 320; step++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(50);
      if (await page.evaluate((o) => o.trovato, sentinella)) break;
      if (await page.evaluate(() => window.scrollY + window.innerHeight >= document.body.scrollHeight - 4)) break;
    }
    const atStart = { ...(await sentinella.jsonValue()), vh };

    test.skip(
      !atStart.trovato,
      `${nome}: nessun ingresso da misurare (${atStart.n} nodi, ${atStart.nascosti} nascosti a riposo)`,
    );
    // Non "dentro il viewport" ma "abbastanza dentro da vedersi": un elemento
    // che parte col bordo alto sull'ultima riga di pixel ha già finito quando
    // arriva davvero in campo.
    expect(
      atStart.top,
      `${nome}: l'animazione è partita con il bordo alto a ${Math.round(atStart.top)}px, ` +
        `su un viewport di ${atStart.vh}px — comincia fuori campo`,
    ).toBeLessThan(atStart.vh * 0.95);
  });
}

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
// `#dt-preloader.dt-preloader`, nel primo HTML di ogni rotta) e il FILM
// INTERO è CSS (globals.css «Preloader»): atto I `dt-pre-char/schar/cap/word`
// sulle lettere, atto II `dt-pre-track` sulla linea di carica, atto III
// `dt-pre-door` (2,25 s) e atto IV `dt-pre-dive` (3,13 s) sull'overlay via le
// custom property REGISTRATE `--arch-w/--arch-y/--arch-s`. Tutto parte al
// primo paint sotto `html[data-preloader]`, che il boot script del layout
// mette prima della shell (con `__dtPreArmed`/`__dtPreT0`). Preloader.tsx
// (client, import statico) non muove più niente: legge l'orologio CSS, scrive
// `data-pre-live` («sono al timone»), spara INTRO_EVENT a INTRO_T.dive, chiude
// a INTRO_MS (attributo via, Lenis start, sessionStorage), e gestisce lo skip
// (`html[data-pre-skip]` → tuffo subito, chiusura +1,5 s). Quindi qui si
// misura DAVVERO il film — le lettere, la linea, la porta, il tuffo — non la
// presenza dei nodi, e a due larghezze (390 e 1440: è lo stesso montaggio).
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
  /** `--arch-y` computata sull'overlay, in px (atti III-IV; NaN se assente). */
  archY: number;
  /** L'overlay ha `dt-pre-door` / `dt-pre-dive` fra le proprie animazioni CSS. */
  porta: boolean;
  tuffo: boolean;
};

/** Ciò che il registro in-pagina raccoglie di ogni documento. */
type RegistroIntro = {
  /** `data-preloader` è comparso (lo scrive l'inline script, pre-paint). */
  visto: boolean;
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
  // finché `data-preloader` è su <html> legge a ogni ~80 ms i tre nodi che
  // portano i quattro atti. `getAnimations()` restituisce anche le animazioni
  // finite con `fill` e quelle ancora nel proprio delay: il nome c'è per tutta
  // l'intro, il VALORE (opacità, transform, --arch-y) dice se si muove.
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
      const nomiRoot = nomi(root);
      rec.film.push({
        t: now,
        char: ch ? Number(getComputedStyle(ch).opacity) : -1,
        charAnim: nomi(ch).includes("dt-pre-char"),
        track: tr ? getComputedStyle(tr).transform : "",
        trackAnim: nomi(tr).includes("dt-pre-track"),
        archY: parseFloat(getComputedStyle(root).getPropertyValue("--arch-y")),
        porta: nomiRoot.includes("dt-pre-door"),
        tuffo: nomiRoot.includes("dt-pre-dive"),
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
 * <html>, che ferma anche `scrollBy`), non ScrollTrigger; e la rotella
 * innescherebbe il fermo-immagine voluto del primo gesto (§9.2), che è un
 * altro test. Si insiste per qualche secondo perché Lenis, appena rilasciato,
 * può avere un fotogramma di assestamento.
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

  // ── I QUATTRO ATTI, SU DUE ROTTE ────────────────────────────────────────
  // Su `/` e su `/acquista` (mandato §9.3.3): la shell è nel root layout,
  // quindi l'intro suona su OGNI rotta, e una rotta non-home lo prova. Il
  // test gira nei due progetti «interi» (390 e 1440): è lo stesso montaggio
  // (legge 3), quindi le stesse asserzioni; sotto i 768 cambiano solo le
  // geometrie dell'arco, e infatti sui px di `--arch-y` non si asserisce
  // nessun numero assoluto — solo che si muove, e nel verso giusto.
  for (const rotta of ["/", "/acquista"] as const) {
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
      // L'hero cinematico (e le sue lettere [data-hero-char]) c'è solo in home:
      // su /acquista sotto il sipario c'è la pagina di ricerca.
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

      // (e) L'HANDOFF: INTRO_EVENT è partito, dopo l'armatura di almeno il
      // tuffo (3,13 s: le lettere dell'hero non devono accendersi con la porta
      // ancora chiusa — sarebbe un altro tipo di intro) e comunque entro
      // 4 800 ms — il budget del mandato — dall'istante in cui il boot script
      // ha armato il sipario (`__dtPreT0`).
      expect(fine.handoff, "INTRO_EVENT (dt:intro:done) non è mai partito").not.toBeNull();
      const handoffDaT0 = Math.round(fine.handoff! - t0);
      expect(
        handoffDaT0,
        `l'handoff è partito a ${handoffDaT0}ms dall'armatura: PRIMA del tuffo (INTRO_T.dive = ${INTRO_T.dive * 1000}ms) — nessuno l'ha saltato`,
      ).toBeGreaterThanOrEqual(INTRO_T.dive * 1000 - 150);
      expect(
        handoffDaT0,
        `l'handoff è partito a ${handoffDaT0}ms dall'armatura, budget 4800`,
      ).toBeLessThan(4800);

      // IL BUDGET SI ASSERISCE, non si annota. Dal 2026-08-17 (onda «parità
      // mobile 2», legge 3) l'intro è UN solo montaggio da 4,63 s a ogni
      // larghezza — INTRO_MS in app/lib/motion/intro-constants.ts — quindi il
      // budget è uno solo, telefono compreso (prima sotto i 768 era 1 900, per
      // il montaggio corto da 1,75 s che non c'è più). Registrarlo e basta
      // vorrebbe dire che la suite resta verde se domani qualcuno allunga un
      // tuffo o rimette un'attesa senza tetto.
      // Il margine sopra il bersaglio copre il ticker (l'ultimo fotogramma cade
      // dopo la fine nominale) e il tempo di lettura del registro, non un atto.
      // Nota: `durata` parte da `tLive` (il JS al timone), che ora arriva a
      // atto I già in corso: è ≤ dell'intro intera, il budget resta valido.
      const budget = 4800;
      expect(
        durata,
        `l'intro è durata ${durata}ms, budget ${budget}ms — un solo montaggio, INTRO_MS in intro-constants.ts`,
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
      // La caduta dall'armatura, con un tetto largo. MISURATO (2026-08-18):
      // a 390 cade a ~4 700 ms; a 1440 a 4 836-4 966 con due test in
      // parallelo e a 5 274-5 547 con quattro worker — su desktop `finish()`
      // aspetta `runWarmup` (TUTTE le immagini, decode compreso) e il timer
      // di chiusura arriva in ritardo su un thread occupato (la sentinella
      // conta 40 fotogrammi invece di ~58: rAF affamata). Non è il failsafe
      // (PRE_FAILSAFE_MS, intro-constants.ts: vedi sopra) ma è un ritardo vero, e
      // sopra i 1,5 s dal film sarebbe una pagina murata a film finito.
      expect(
        Math.round(fine.tCaduto! - t0),
        `l'attributo è caduto ${Math.round(fine.tCaduto! - t0)}ms dopo l'armatura: più di 1,5 s dopo la fine del film (INTRO_MS ${INTRO_MS}): la pagina resta murata a intro finita`,
      ).toBeLessThan(INTRO_MS + 1500);

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

      // (d) ATTI III e IV: `--arch-y` letta computata sull'overlay. La porta
      // (2,25 → 3,35 s) porta la quota da 104vh alla quota di riposo `--arch-y1`
      // (16vh sul telefono, 15vh su desktop); il tuffo (3,13 → 4,63) da lì a
      // −100vh: la quota SCENDE, sempre. Niente px assoluti — solo che si
      // muove, nel verso giusto, e negli intervalli giusti.
      //
      // La prova NON è «a t=2 vale X e a t=3 vale Y»: la sentinella campiona
      // in rAF, e sotto carico (idratazione lunga, quattro worker, decode
      // immagini su desktop) la rAF resta a secco anche per un secondo —
      // misurato: 40 fotogrammi invece di ~58, e a 390 sotto carico esterno
      // NESSUN fotogramma fra 2,1 e 3,05 s. Si prova quindi per VALORI, che
      // sono univoci per atto: una quota strettamente fra la partenza (104vh)
      // e la quota di riposo — con 25 px di margine sopra il riposo, perché il
      // tuffo riparte da 0,972 della porta, cioè ~20 px sopra il riposo — la
      // può produrre SOLO la porta; una quota sotto il riposo SOLO il tuffo.
      // Se manca il fotogramma della porta si guarda se la sentinella aveva
      // copertura in quella finestra: senza copertura è la macchina (e lo si
      // annota), con copertura è il film.
      const validi = film.filter((f) => Number.isFinite(f.archY));
      expect(
        validi.length,
        "atti III-IV: --arch-y non è mai stata leggibile come lunghezza sull'overlay (@property assente? proprietà rinominata?)",
      ).toBeGreaterThan(10);
      const geo = await page.evaluate(() => {
        const root = document.getElementById("dt-preloader")!;
        const y1 = getComputedStyle(root).getPropertyValue("--arch-y1").trim();
        const m = /^([\d.]+)vh$/.exec(y1);
        return { vh: window.innerHeight, y1: m ? (Number(m[1]) / 100) * window.innerHeight : NaN, y1raw: y1 };
      });
      expect(geo.y1, `--arch-y1 non è in vh (${geo.y1raw}): il test non sa più dov'è il riposo della porta`).not.toBeNaN();
      const partenza = validi[0].archY;
      expect(
        partenza,
        `al primo fotogramma --arch-y è ${arrotonda(partenza)}px: la porta non parte da sotto il bordo (≥ 100vh = ${geo.vh}px)`,
      ).toBeGreaterThanOrEqual(geo.vh);
      // ATTO III — la porta: un fotogramma con la quota fra riposo+25 e
      // partenza−1, cioè la porta a metà corsa.
      const soloPorta = validi.filter((f) => f.archY < partenza - 1 && f.archY > geo.y1 + 25);
      const bucoPorta = bucoIn(INTRO_T.arch * 1000, INTRO_T.dive * 1000);
      test.info().annotations.push({
        type: "atto III",
        description: `${soloPorta.length} fotogrammi con la porta a metà corsa; buco massimo della sentinella nella finestra della porta ${bucoPorta}ms`,
      });
      expect(
        soloPorta.length > 0 || bucoPorta >= 500,
        `atto III: la porta non è mai stata vista a metà corsa (quota fra ${arrotonda(geo.y1 + 25)} e ${arrotonda(partenza)}px) con la sentinella che copriva la finestra 2,25-3,13 s (buco massimo ${bucoPorta}ms): la porta non è salita`,
      ).toBe(true);
      if (soloPorta.length > 0) {
        // E dentro la finestra della porta, non altrove.
        const tPorta = soloPorta.map((f) => Math.round(f.t - t0));
        expect(
          Math.min(...tPorta),
          `atto III: la porta è stata vista a metà corsa già a ${Math.min(...tPorta)}ms — prima di INTRO_T.arch (${INTRO_T.arch * 1000})`,
        ).toBeGreaterThanOrEqual(INTRO_T.arch * 1000 - 100);
      }
      // ATTO IV — il tuffo: quote SOTTO il riposo della porta, e in fondo
      // sotto lo zero (verso −100vh): l'arco è uscito dallo schermo.
      const soloTuffo = validi.filter((f) => f.archY < geo.y1 - 25);
      const bucoTuffo = bucoIn(INTRO_T.dive * 1000 + 200, INTRO_MS);
      test.info().annotations.push({
        type: "atto IV",
        description: `${soloTuffo.length} fotogrammi con l'arco sotto il riposo; ultima quota ${arrotonda(validi[validi.length - 1].archY)}px a ${Math.round(validi[validi.length - 1].t - t0)}ms; buco massimo nella finestra del tuffo ${bucoTuffo}ms`,
      });
      expect(
        soloTuffo.length > 0 || bucoTuffo >= 500,
        `atto IV: --arch-y non è mai scesa sotto il riposo della porta (${arrotonda(geo.y1)}px) con la sentinella che copriva la finestra 3,3-4,63 s (buco massimo ${bucoTuffo}ms): il tuffo non è partito`,
      ).toBe(true);
      if (soloTuffo.length > 0) {
        const tTuffo = soloTuffo.map((f) => Math.round(f.t - t0));
        expect(
          Math.min(...tTuffo),
          `atto IV: l'arco era sotto il riposo già a ${Math.min(...tTuffo)}ms — prima di INTRO_T.dive (${INTRO_T.dive * 1000})`,
        ).toBeGreaterThanOrEqual(INTRO_T.dive * 1000 - 100);
      }
      // E la corsa è MONOTONA: mai una risalita. Tolleranza di pochi px: a
      // 3,13 s il tuffo riparte da `--arch-k` (0,972 della corsa, calcolato
      // dalla bezier): una frazione di pixel fra le due keyframe non è un
      // salto che si veda.
      const risalite = validi.filter((f, i) => i > 0 && f.archY > validi[i - 1].archY + 4);
      expect(
        risalite.length,
        `l'arco è RISALITO in ${risalite.length} fotogramma/i (es. a ${risalite[0] ? Math.round(risalite[0].t - t0) : "?"}ms): porta e tuffo non sono monotoni — un salto fra le due keyframe`,
      ).toBe(0);
      // E sono le keyframe di globals.css a muovere l'arco — i nomi esatti,
      // visti dalla sentinella sulle animazioni dell'overlay durante il film.
      expect(
        film.some((f) => f.porta) && film.some((f) => f.tuffo),
        "sull'overlay mancano le keyframe della porta/del tuffo (dt-pre-door/dt-pre-dive) durante il film",
      ).toBe(true);

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
        `sessionStorage ${INTRO_KEY} non è "1" a intro finita: alla prossima navigazione si rivedrebbe`,
      ).toBe("1");

      // (g) NON SI RIPETE: seconda navigazione, documento nuovo, registro
      // nuovo. `visto` a false vuol dire che l'attributo non è comparso
      // NEMMENO PER UN FOTOGRAMMA — una lettura a posteriori non saprebbe
      // distinguerlo da un lampo — e la shell (che nell'HTML c'è sempre) è
      // display:none dal primo stile.
      await page.goto(rotta, { waitUntil: "domcontentloaded" });
      const ritorno = await leggiRegistro(page);
      expect(ritorno.visto, `alla seconda navigazione su ${rotta} il sipario è ricomparso`).toBe(false);
      expect(
        (await overlay(page)).display,
        "l'overlay dell'intro è visibile lo stesso alla visita di ritorno",
      ).toBe("none");
    });
  }

  test("si salta al PRIMO tocco che il JS può sentire, e il tuffo suona intero @layout", async ({ page }, testInfo) => {
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

    // LA DISCRIMINANTE. Lo skip chiama `fireIntro()` in modo SINCRONO dentro
    // il gestore del pointerdown: fra il dito che ha saltato e l'handoff non
    // c'è un frame. L'intro naturale invece ci arriva al `dive`, 3,13 s dopo
    // il paint. Senza questo confronto un'asserzione "dopo il tocco l'intro
    // finisce" passerebbe identica anche se lo skip non esistesse: finirebbe
    // da sola, e nessuno se ne accorgerebbe. Il mandato (§9.3) chiede
    // tocco → dt:intro:done ≤ 1 700 ms.
    // Il tocco che conta è l'ULTIMO prima dell'handoff: i precedenti, se ci
    // sono, sono caduti prima del listener.
    //
    // MISURATO (2026-08-18, 390, tre giri): il tocco che arriva PRIMA che il
    // JS sia al timone non va perso — viene SERVITO CON 550-620 ms DI RITARDO.
    // Il registro lo mostra: `pointerdown` in cattura su window a ~520 ms,
    // poi il `touchstart` dello STESSO tap a ~1 100, `data-pre-live` a ~800,
    // skip e handoff a ~1 000. È l'idratazione selettiva di React: il
    // listener di root (in cattura sul container) intercetta l'evento
    // discreto su un albero non ancora idratato e idrata IN MODO SINCRONO,
    // dentro il dispatch — il layout effect di Preloader gira lì, attacca il
    // listener di skip su window in bolla, e il dispatch, proseguendo, lo
    // raggiunge. Quindi «sincrono» vale dal tocco che il JS ha sentito
    // (≥ tLive: < 200 ms), mentre per un tocco anteriore vale il tetto del
    // mandato — e in ENTRAMBI i casi l'handoff arriva molto prima del tuffo
    // naturale, che è la sola cosa che distingue uno skip da un'attesa.
    const toccoBuono = sonda.tocchi.filter((t) => t <= sonda.handoff!).pop();
    expect(toccoBuono, "l'handoff precede ogni tocco registrato").not.toBeUndefined();
    const ritardo = sonda.handoff! - toccoBuono!;
    const dopoLive = sonda.tLive !== null && toccoBuono! >= sonda.tLive;
    test.info().annotations.push({
      type: "tocco → handoff",
      description: `${Math.round(ritardo)}ms (${dopoLive ? "tocco a JS già al timone" : "tocco PRIMA del JS, servito dall'idratazione selettiva"})`,
    });
    if (dopoLive) {
      expect(
        ritardo,
        `fra il dito e l'handoff sono passati ${Math.round(ritardo)}ms con il JS già al timone: lo skip non è sincrono (${cronologia})`,
      ).toBeLessThan(200);
    }
    expect(
      ritardo,
      `tocco → dt:intro:done ${Math.round(ritardo)}ms, oltre il tetto del mandato di 1 700 ms (${cronologia})`,
    ).toBeLessThan(1700);
    // Che non sia il tuffo naturale lo dice `data-pre-skip` (lo scrive SOLO
    // lo skip) insieme alla vicinanza handoff↔skip qui sotto: un confronto
    // con INTRO_T.dive sarebbe cieco quando, sotto carico, il tocco servito
    // arriva a ridosso dei 3,13 s (misurato: JS al timone a 2 s, tocco a
    // 2,63).
    expect(
      Math.abs(sonda.tSkip! - sonda.handoff!),
      `html[data-pre-skip] e l'handoff distano ${Math.round(sonda.tSkip! - sonda.handoff!)}ms: non vengono dallo stesso gesto`,
    ).toBeLessThan(200);

    // Saltare manda le keyframe al tuffo (`--pre-skip` + data-pre-skip),
    // quindi la porta suona per intero (1,5 s a ogni larghezza): lo skip
    // taglia il preambolo, non il tuffo. La chiusura arriva a +1,5 s: si
    // aspetta la caduta e si misura che NON sia stata istantanea (un taglio
    // secco lascerebbe l'arco a metà) e che non abbia aspettato l'intro
    // naturale (4,63 s).
    await expect
      .poll(async () => (await bloccata(page)).attributo, {
        timeout: 10_000,
        message: "saltata l'intro, il sipario è rimasto su <html>: la pagina resta bloccata",
      })
      .toBe(false);
    const dopo = await leggiRegistro(page);
    const chiusuraDalTocco = Math.round(dopo.tCaduto! - toccoBuono!);
    test.info().annotations.push({ type: "skip → caduta", description: `${chiusuraDalTocco}ms` });
    expect(
      chiusuraDalTocco,
      `il sipario è caduto ${chiusuraDalTocco}ms dopo il tocco: il tuffo (${INTRO_T.diveDur * 1000}ms) non ha suonato intero`,
    ).toBeGreaterThanOrEqual(INTRO_T.diveDur * 1000 - 100);
    // Il tetto: la chiusura viene dal timer dello skip (tocco + 1,5 s), con
    // il margine di un timer in ritardo su un thread occupato — misurato
    // 2 754 ms sotto carico. Che non sia la fine naturale lo dice, oltre a
    // `data-pre-skip`, il confronto con quando sarebbe finita da sola.
    expect(
      chiusuraDalTocco,
      `il sipario è caduto ${chiusuraDalTocco}ms dopo il tocco: lo skip non ha accorciato niente`,
    ).toBeLessThan(INTRO_T.diveDur * 1000 + 1500);
    const fineNaturale = Math.round(INTRO_MS - (toccoBuono! - sonda.tVisto!));
    if (fineNaturale - INTRO_T.diveDur * 1000 > 800) {
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
    // Si insiste per qualche secondo di proposito: il PRIMO colpo di rotella
    // sull'hero è il fermo-immagine voluto (§9.2) e tiene la pagina ferma
    // ~950ms. Un solo colpo misurerebbe quel fermo e lo scambierebbe per una
    // pagina morta.
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

  test("nella stessa sessione non si rivede alla seconda navigazione", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Il tasto DOPO il segnale, che è l'errore di home.spec.ts:33: premuto
    // subito dopo `domcontentloaded` non trova nessun listener e non salta
    // niente. Qui serve anche a chiudere l'intro in fretta, ma la condizione
    // che si aspetta è quella vera: il budget della sessione va segnato speso.
    await page.waitForFunction(
      () => document.documentElement.hasAttribute("data-pre-live"),
      undefined,
      { timeout: 15_000, polling: "raf" },
    );
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      (chiave) =>
        !document.documentElement.hasAttribute("data-preloader") &&
        sessionStorage.getItem(chiave) === "1",
      INTRO_KEY,
      { timeout: 20_000, polling: "raf" },
    );

    // Seconda navigazione: documento nuovo, registro nuovo. `visto` a false
    // vuol dire che l'attributo non è comparso NEMMENO PER UN FOTOGRAMMA —
    // una lettura a posteriori non saprebbe distinguerlo da un lampo.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const ritorno = await leggiRegistro(page);
    expect(
      ritorno.visto,
      "alla seconda navigazione della stessa sessione il sipario è ricomparso",
    ).toBe(false);
    // Dal 2026-08-17 la shell dell'intro è markup reso dal SERVER, sempre nel
    // documento (PreloaderShell.tsx): il contratto non è più «zero nodi» ma
    // «display:none senza `html[data-preloader]`» — e la sagoma è un <img>
    // lazy che senza box non parte (zero byte per chi torna, come prima).
    const ov = await overlay(page);
    expect(ov.presente, "la shell dell'intro non è nell'HTML della visita di ritorno").toBe(true);
    expect(ov.display, "l'overlay dell'intro è visibile lo stesso alla visita di ritorno").toBe("none");
    // E nessuna @keyframes del film è partita: senza box non c'è animazione.
    expect(
      await page.evaluate(() => {
        const root = document.getElementById("dt-preloader");
        return root ? root.getAnimations({ subtree: true }).length : -1;
      }),
      "alla visita di ritorno il film CSS è partito lo stesso (animazioni vive nella shell nascosta)",
    ).toBe(0);

    // E l'hero è leggibile davvero: senza preloader le lettere le rivela
    // HeroCinematic un respiro dopo l'idratazione. Se restassero a 0.02 la
    // pagina sarebbe "visibile" e vuota — di nuovo la trappola di §6.1.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.querySelector("[data-hero-char]");
            return el ? Number(getComputedStyle(el).opacity) : 0;
          }),
        {
          timeout: 10_000,
          message: "le lettere dell'hero sono rimaste nascoste sulla visita di ritorno",
        },
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
      // deve essere già a piena opacità — lettere del lockup e blocco sotto.
      const spente = await page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-hero-char], .dt-hero-rest")).filter(
          (el) => Number(getComputedStyle(el).opacity) < 0.9,
        ).length,
      );
      expect(spente, "pezzi dell'hero rimasti trasparenti in attesa di un'animazione che non parte").toBe(0);
      // E l'hero è a schermo: il primo h1 della pagina, dentro il viewport.
      const h1 = page.locator("h1").first();
      await expect(h1, "l'h1 dell'hero non è visibile con reduced-motion").toBeVisible();
      await expect(h1).toBeInViewport();
      // La pagina scorre: nessuna serratura residua.
      expect(await scorreDavvero(page), "con reduced-motion la pagina non scorre").toBeGreaterThan(0);
    });
  });
});
