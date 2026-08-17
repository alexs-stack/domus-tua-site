import type { Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { INTRO_EVENT, INTRO_KEY } from "../app/components/motion/Preloader";

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
test.describe("il primo gesto sull'hero", () => {
  test("con la rotella la pagina si ferma un istante, ed è voluto", async ({ page, goto }) => {
    // `goto` e non `page.goto`: da 768 in su il sipario parte, e finché copre
    // tiene Lenis fermo per conto suo. Senza saltarlo, questi due test
    // leggerebbero `lenis-stopped` e crederebbero di aver misurato il gesto.
    await goto("/");
    await page.waitForTimeout(600);

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
    await page.waitForTimeout(600);

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
// Fase 3 della parità mobile (2026-08-11). Prima di questo blocco l'intro
// aveva DUE test e nessuno dei due la misurava — docs/mobile-parity.md §6.1 li
// smonta uno per uno, e vale la pena riscriverli qui perché sono tre modi
// diversi di scrivere un'asserzione vuota, non un solo errore ripetuto:
//   • `home.spec.ts:36` guarda `overflow` su **body**, ma il blocco è su
//     **html** (`html[data-preloader]{overflow:hidden}`, globals.css:1592, e
//     `.lenis.lenis-stopped`, :164). Su body non c'è mai stato niente da
//     leggere: l'asserzione passa a sipario alzato e a sipario calato;
//   • `toBeVisible()` ignora l'opacità, e l'h1 dell'hero sta a **0.02** per
//     costruzione (`html[data-hero-intro]`, globals.css:1661) sotto un overlay
//     `z-index:96`: è "visibile" dal primo fotogramma, con l'intro in corso;
//   • `home.spec.ts:33` preme Invio subito dopo `domcontentloaded`, cioè quasi
//     certamente prima che il chunk `ssr:false` abbia attaccato il listener —
//     lo skip non viene provato, viene mancato.
//
// Qui si misura invece il contratto vero, che è di TRE righe: il sipario deve
// partire, deve poter essere saltato col primo dito, e — la sola che vale
// davvero — deve restituire una pagina che SCORRE. Un telefono che esce
// dall'intro con Lenis fermo non è un telefono con un'animazione sbagliata: è
// una pagina morta che sembra arrivata, e l'unico gesto che la salva è il
// ricaricamento (§5.3, ed è il motivo per cui `SmoothScroll` si è preso una
// rete propria).
//
// TRE SCELTE DI METODO, tutte e tre ereditate dai commenti qui sopra:
//  1. NIENTE fixture `goto`. Quella scrive `dt-intro-seen` prima del
//     caricamento: è il modo giusto di togliersi l'intro dai piedi in tutti
//     gli altri test, ed è il modo sicuro di non provare niente in questi.
//     Si carica con `page.goto` nudo, come un visitatore nuovo.
//  2. Si aspetta un SEGNALE, mai un ritardo. Il segnale è `data-pre-live`, che
//     `Preloader.tsx` scrive in cima al proprio layout effect: i listener di
//     skip li attacca in fondo allo stesso effect, quindi quando l'attributo è
//     leggibile da fuori quel corpo è già girato per intero. È l'unico istante
//     in cui "il chunk è pronto" è un fatto e non una speranza.
//  3. La misura si prende DENTRO la pagina. Il registro qui sotto è installato
//     prima del primo script (`addInitScript`) e osserva `document`: vede
//     l'attributo messo dallo script di boot *prima del primo paint*, vede il
//     takeover e vede la caduta, ognuno col suo istante. Dal driver, quegli
//     istanti sarebbero già passati.
//
// QUEL CHE QUI NON SI PROVA, detto per intero: la sfogliata vera col pollice.
// Playwright non ha un gesto di swipe (`touchscreen` ha solo `tap`), e
// costruirlo a mano con `Input.dispatchTouchEvent` via CDP misurerebbe il
// nostro finto dito, non il sito. Lo scorrimento si guida quindi con la
// rotella — che va bene come prova del blocco, perché la serratura è
// `overflow:hidden` su <html> e quella ferma anche il dito.

/** Ciò che il registro in-pagina raccoglie di ogni documento. */
type RegistroIntro = {
  /** `data-preloader` è comparso (lo scrive l'inline script, pre-paint). */
  visto: boolean;
  /** Il vero overlay ha preso il timone: il chunk ssr:false è atterrato. */
  live: boolean;
  /** Opacità delle lettere dell'h1 nell'istante del takeover. */
  heroOpacita: number | null;
  tVisto: number | null;
  tLive: number | null;
  /** Istante in cui il sipario è caduto (attributo rimosso, da chiunque). */
  tCaduto: number | null;
  /** Primo `pointerdown` arrivato alla finestra (in cattura: precede tutti). */
  tocco: number | null;
  /** Istante di INTRO_EVENT, l'handoff all'hero. */
  handoff: number | null;
};

type ConRegistro = { __dtIntro: RegistroIntro };

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
    tCaduto: null,
    tocco: null,
    handoff: null,
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
      // 0,95s sul telefono) le lettere salgono a 1 mentre l'attributo è
      // ancora su <html>: campionando da fuori si misurerebbe la corsa.
      const ch = document.querySelector("[data-hero-char]");
      rec.heroOpacita = ch ? Number(getComputedStyle(ch).opacity) : null;
    }
    if (rec.visto && !coperto && rec.tCaduto === null) rec.tCaduto = performance.now();
  };
  leggi();
  new MutationObserver(leggi).observe(document, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-preloader", "data-pre-live"],
  });

  // In CATTURA: questo listener precede quello di skip del preloader (che sta
  // su window in bolla), quindi l'istante registrato è quello del dito, non
  // quello di ciò che il dito ha provocato.
  window.addEventListener(
    "pointerdown",
    () => {
      if (rec.tocco === null) rec.tocco = performance.now();
    },
    { capture: true },
  );
  window.addEventListener(evento, () => {
    if (rec.handoff === null) rec.handoff = performance.now();
  });
}

const leggiRegistro = (page: Page) =>
  page.evaluate(() => (window as unknown as ConRegistro).__dtIntro);

/** Le due serrature dello scroll, lette dove stanno davvero: <html>, mai body. */
const bloccata = (page: Page) =>
  page.evaluate(() => ({
    lenis: document.documentElement.classList.contains("lenis-stopped"),
    overflow: getComputedStyle(document.documentElement).overflowY,
    attributo: document.documentElement.hasAttribute("data-preloader"),
  }));

test.describe("il sipario Arco Domus a sessione fredda", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(registraIntro, INTRO_EVENT);
  });

  test("suona davvero, copre l'hero, e si chiude da solo", async ({ page }) => {
    // `page.goto` nudo: la fixture salterebbe il soggetto del test.
    await page.goto("/", { waitUntil: "domcontentloaded" });

    expect(
      (await leggiRegistro(page)).visto,
      "html[data-preloader] non è mai comparso: a sessione fredda l'intro non è nemmeno prevista",
    ).toBe(true);

    await expect
      .poll(async () => (await leggiRegistro(page)).live, {
        timeout: 15_000,
        message:
          "il chunk ssr:false non ha mai preso il timone (data-pre-live): a schermo c'è il fondo del boot script, non la coreografia",
      })
      .toBe(true);

    const alTimone = await leggiRegistro(page);
    expect(
      alTimone.heroOpacita,
      "nessuna lettera [data-hero-char] da leggere: o l'hero non è più reso dal server, o l'attributo è cambiato nome",
    ).not.toBeNull();
    // 0.02 per costruzione. È QUESTA la lettura che manca a `toBeVisible()`:
    // l'h1 è nel DOM, dipinto e "visibile", e non lo vede nessuno.
    expect(
      alTimone.heroOpacita!,
      `con il sipario a schermo le lettere dell'hero stanno a ${alTimone.heroOpacita}: dovrebbero essere ancora nascoste`,
    ).toBeLessThan(0.1);

    // Si chiude da solo: nessun gesto, nessun tasto.
    await expect
      .poll(async () => (await leggiRegistro(page)).tCaduto !== null, {
        timeout: 25_000,
        message:
          "il sipario non è mai caduto da solo: la pagina resta murata (html[data-preloader] è overflow:hidden)",
      })
      .toBe(true);

    const fine = await leggiRegistro(page);
    const durata = Math.round(fine.tCaduto! - (fine.tLive ?? fine.tVisto!));
    test.info().annotations.push({ type: "durata intro", description: `${durata}ms dal takeover alla caduta` });

    // IL BUDGET SI ASSERISCE, non si annota. Tutta la Fase 3 esiste per portare
    // l'intro del telefono da 4,63s a meno di 1,8; registrarlo e basta vuol dire
    // che la suite resta verde se domani qualcuno allunga un tuffo o rimette
    // un'attesa senza tetto. È lo stesso principio per cui in questa wave i
    // difetti aperti si dichiarano invece di allargare la soglia.
    // Il margine sopra il bersaglio copre il ticker (l'ultimo fotogramma cade
    // dopo la fine nominale) e il tempo di lettura del registro, non un atto.
    const budget = page.viewportSize()!.width < 768 ? 1900 : 4800;
    expect(
      durata,
      `l'intro è durata ${durata}ms, budget ${budget}ms — il taglio mobile è §5.4 di docs/mobile-parity.md`,
    ).toBeLessThan(budget);

    // E l'overlay non resta sopra la pagina a mangiarsi i click: `.dt-preloader`
    // torna `display:none` con l'attributo (globals.css:1590-1598), quindi al
    // centro dello schermo deve esserci il sito.
    const sopra = await page.evaluate(() => {
      const el = document.elementFromPoint(
        Math.round(window.innerWidth / 2),
        Math.round(window.innerHeight / 2),
      );
      return el?.closest(".dt-preloader") ? "preloader" : (el?.tagName ?? "niente");
    });
    expect(sopra, "al centro dello schermo c'è ancora l'overlay dell'intro").not.toBe("preloader");
  });

  test("si salta al PRIMO tocco, e il tocco lo si aspetta @layout", async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.use.hasTouch,
      "serve un contesto touch: qui il gesto del dito non esiste",
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Il segnale, non un ritardo: `data-pre-live` significa che il layout
    // effect del preloader è girato per intero — listener di skip compresi.
    await page.waitForFunction(
      () => document.documentElement.hasAttribute("data-pre-live"),
      undefined,
      { timeout: 15_000, polling: "raf" },
    );

    // Un dito vero. Il listener di skip è `pointerdown`, e Chromium lo genera
    // dal tocco (verificato: pointerdown arriva PRIMA di touchstart). Il tap
    // cade al centro, dove c'è l'overlay stesso: nessun link sotto da attivare
    // per sbaglio.
    const vp = page.viewportSize()!;
    await page.touchscreen.tap(Math.round(vp.width / 2), Math.round(vp.height / 2));

    await expect
      .poll(async () => (await leggiRegistro(page)).handoff !== null, {
        timeout: 8_000,
        message: "dal tocco non è mai partito INTRO_EVENT: l'handoff all'hero non è avvenuto",
      })
      .toBe(true);

    const sonda = await leggiRegistro(page);
    expect(
      sonda.tocco,
      "il tap non ha prodotto nessun pointerdown: il listener dello skip non è nemmeno raggiungibile dal dito",
    ).not.toBeNull();

    // LA DISCRIMINANTE. Lo skip chiama `fireIntro()` in modo SINCRONO dentro
    // il gestore del pointerdown: fra il dito e l'handoff non c'è un frame.
    // L'intro naturale invece ci arriva al `dive`, cioè 0,95s dopo il takeover
    // sul telefono e 3,13s su desktop. Senza questo confronto un'asserzione
    // "dopo il tocco l'intro finisce" passerebbe identica anche se lo skip non
    // esistesse: finirebbe da sola, e nessuno se ne accorgerebbe.
    const ritardo = sonda.handoff! - sonda.tocco!;
    expect(
      ritardo,
      `il tuffo era già partito ${Math.abs(Math.round(ritardo))}ms PRIMA del tocco: la misura è persa perché l'intro naturale ha vinto la corsa — non è un difetto dello skip`,
    ).toBeGreaterThanOrEqual(0);
    expect(
      ritardo,
      `fra il dito e l'handoff sono passati ${Math.round(ritardo)}ms: lo skip è sincrono, questo è il tuffo che sarebbe arrivato comunque`,
    ).toBeLessThan(200);

    // Saltare fa `seek("dive")`, quindi la porta suona per intero (0,8s sul
    // telefono, 1,5s su desktop): lo skip taglia il preambolo, non il tuffo.
    await expect
      .poll(async () => (await bloccata(page)).attributo, {
        timeout: 10_000,
        message: "saltata l'intro, il sipario è rimasto su <html>: la pagina resta bloccata",
      })
      .toBe(false);
    await expect
      .poll(async () => (await bloccata(page)).lenis, {
        timeout: 5_000,
        message: "l'uscita per skip ha lasciato Lenis fermo: pagina viva a vedersi, morta a scorrere",
      })
      .toBe(false);
  });

  // ── L'ASSERZIONE PER CUI ESISTE TUTTA LA FASE ───────────────────────────
  // @layout non perché il layout cambi, ma perché il MONTAGGIO cambia a 768
  // (`MQ.belowDesktop`, 767.98: sotto 1,75s e due atti, sopra 4,63s e quattro)
  // e la serratura è la stessa a tutte e cinque le larghezze. Un'uscita che
  // lascia Lenis fermo non è un difetto d'animazione: è il sito che non scorre.
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
    expect(
      await page.locator(".dt-preloader").count(),
      "l'overlay è stato montato lo stesso: 119 nodi e la sagoma da 79 KB scaricati per nessuno",
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

  test.describe("con reduced-motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("l'intro non parte mai e la pagina arriva intera", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      const registro = await leggiRegistro(page);
      expect(
        registro.visto,
        "con reduced-motion `data-preloader` è comparso lo stesso: l'inline script del layout non sta escludendo la preferenza",
      ).toBe(false);
      expect(
        await page.locator(".dt-preloader").count(),
        "overlay dell'intro montato con reduced-motion",
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
    });
  });
});
