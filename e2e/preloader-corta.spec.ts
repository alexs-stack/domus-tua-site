import { test, expect, setConsent } from "./helpers";
import {
  INTRO_EVENT,
  INTRO_FILM,
  INTRO_KEY,
  INTRO_SHORT,
  LAST_Y_KEY,
  GOMMA_TEMPI,
} from "../app/lib/motion/intro-constants";

/** La corta è la gomma `veloce` intera (22 set. 2026: la porta ad arco non c'è più). */
const CORTA_MS = GOMMA_TEMPI.veloce.delay + GOMMA_TEMPI.veloce.draw + GOMMA_TEMPI.veloce.hold + GOMMA_TEMPI.veloce.exit;

// LA PORTA CORTA E LA MACCHINA A STATI (spec §6.2). Alberto il 13 settembre
// 2026: il film intero alla prima entrata nella home, la porta corta a ogni
// altro caricamento completo (A18, A20), nessun sipario su /case/* (A26).
// D31 toglie la corta con back/forward e con la ricarica lontana dalla cima,
// e la mette su avorio profondo. Come mobile-motion.spec.ts: niente fixture
// `goto` (scrive INTRO_QUIET e spegne il sipario), `page.goto` nudo e un
// registro dentro la pagina installato prima di ogni documento.

type Corta = {
  valore: string | null;
  tVisto: number | null;
  tLive: number | null;
  tCaduto: number | null;
  handoff: number | null;
  t0: number | null;
  contenuto: string | null;
  sagoma: string | null;
  sagomaAnim: string | null;
  pannello: string | null;
  fondo: string | null;
  nav: string | null;
  /** Fotogrammi sotto l'attributo con la shell nel DOM. */
  sotto: number;
  /** Fotogrammi sotto l'attributo fuori dalla cima: [scrollY, gomma montata (1/0), innerHeight]. */
  fuori: number[][];
  /** Lo scrollY più grande visto dopo la caduta dell'attributo. */
  dopoMax: number;
};
type ConCorta = { __dtCorta: Corta; __dtPreT0?: number };

function registraCorta(evento: string) {
  const ne = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const rec: Corta = {
    valore: null,
    tVisto: null,
    tLive: null,
    tCaduto: null,
    handoff: null,
    t0: null,
    contenuto: null,
    sagoma: null,
    sagomaAnim: null,
    pannello: null,
    fondo: null,
    nav: ne?.type ?? null,
    sotto: 0,
    fuori: [],
    dopoMax: 0,
  };
  (window as unknown as ConCorta).__dtCorta = rec;
  const leggi = () => {
    const html = document.documentElement;
    if (!html) return;
    const v = html.getAttribute("data-preloader");
    if (v !== null && rec.tVisto === null) {
      rec.tVisto = performance.now();
      rec.valore = v;
    }
    if (rec.tLive === null && html.hasAttribute("data-pre-live")) rec.tLive = performance.now();
    if (rec.tVisto !== null && v === null && rec.tCaduto === null) rec.tCaduto = performance.now();
  };
  leggi();
  new MutationObserver(leggi).observe(document, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-preloader", "data-pre-live"],
  });
  window.addEventListener(evento, () => {
    if (rec.handoff === null) rec.handoff = performance.now();
  });
  // Gli stili si leggono al primo fotogramma in cui la shell c'è INTERA sotto
  // l'attributo: prima la shell non è ancora nel DOM, e al primo fotogramma
  // può esserci a metà. Misurato su «/» dopo una pagina interna (riga 4): il
  // parser cede dopo aver inserito `#dt-preloader` e prima dei suoi figli, la
  // rAF gira lì, e un getComputedStyle(null) lanciava e fermava il
  // campionamento per sempre («la home non ha sipario» col film in scena).
  const campiona = () => {
    const html = document.documentElement;
    const root = document.getElementById("dt-preloader");
    // D65: sotto il sipario la pagina sta in cima; un fotogramma fuori dalla
    // cima si segna con lo stato della gomma (1 se è montata: da lì può
    // scoprire la pagina; 0 se copre ancora il pannello pieno).
    if (root && html?.hasAttribute("data-preloader")) {
      rec.sotto += 1;
      if (window.scrollY > 1) {
        const gomma = html.hasAttribute("data-gomma") && html.getAttribute("data-gomma") !== "done" ? 1 : 0;
        rec.fuori.push([Math.round(window.scrollY), gomma, window.innerHeight]);
      }
    } else if (rec.tCaduto !== null) rec.dopoMax = Math.max(rec.dopoMax, Math.round(window.scrollY));
    if (root && html?.hasAttribute("data-preloader") && rec.pannello === null) {
      const q = (s: string) => root.querySelector<HTMLElement>(s);
      const fig = q("[data-pre-figure]");
      const contenuto = q("[data-pre-content]");
      const pannello = q("[data-pre-panel]");
      const fondo = q(".dt-pre-fondo");
      if (fig && contenuto && pannello && fondo) {
        rec.contenuto = getComputedStyle(contenuto).display;
        rec.sagoma = getComputedStyle(fig).display;
        rec.sagomaAnim = getComputedStyle(fig).animationDuration;
        rec.pannello = getComputedStyle(pannello).backgroundColor;
        rec.fondo = getComputedStyle(fondo).display;
        rec.t0 = (window as unknown as ConCorta).__dtPreT0 ?? null;
      }
    }
    if (performance.now() < 15_000) requestAnimationFrame(campiona);
  };
  requestAnimationFrame(campiona);
}

const leggi = (page: import("@playwright/test").Page) =>
  page.evaluate(() => (window as unknown as ConCorta).__dtCorta);

/** Campiona `html[data-preloader]` a ogni fotogramma per `ms`: true se è comparso. */
const compareEntro = (page: import("@playwright/test").Page, ms: number) =>
  page.evaluate(
    (durata) =>
      new Promise<boolean>((fatto) => {
        const t0 = performance.now();
        let visto = false;
        const f = () => {
          if (document.documentElement.hasAttribute("data-preloader")) visto = true;
          if (performance.now() - t0 < durata) requestAnimationFrame(f);
          else fatto(visto);
        };
        f();
      }),
    ms,
  );

const AFFAMATA_MS = 2500;

/** Prima entrata nella home col film, chiuso col tasto dopo che il JS è al timone. */
async function filmVisto(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () =>
      document.documentElement.hasAttribute("data-pre-live") ||
      !document.documentElement.hasAttribute("data-preloader"),
    undefined,
    { timeout: 15_000, polling: "raf" },
  );
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    ([k, v]) => !document.documentElement.hasAttribute("data-preloader") && sessionStorage.getItem(k) === v,
    [INTRO_KEY, INTRO_FILM] as const,
    { timeout: 20_000, polling: "raf" },
  );
}

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
  await page.addInitScript(registraCorta, INTRO_EVENT);
});

test("su /acquista alla prima entrata suona la corta senza sagoma, su avorio profondo (A20, D31)", async ({ page }) => {
  await page.goto("/acquista", { waitUntil: "commit" });
  await expect
    .poll(async () => (await leggi(page)).pannello, { timeout: 15_000, message: "la corta non è mai comparsa su /acquista" })
    .not.toBeNull();
  const r = await leggi(page);
  expect(r.valore, "sulle pagine interne la corta è short-page").toBe("short-page");
  expect(r.contenuto, "lockup, didascalie e linea di carica non si dipingono nella corta").toBe("none");
  expect(r.sagoma, "la sagoma della home non va sulle pagine interne").toBe("none");
  expect(r.fondo, "il fondo espresso non va nella corta").toBe("none");
  expect(r.pannello, "il pannello della corta è ancora espresso").not.toBe("rgb(28, 21, 18)");
  expect(r.pannello, "il pannello della corta non è --color-cream-deep").toBe("rgb(242, 207, 197)");

  await expect
    .poll(async () => (await leggi(page)).tCaduto, { timeout: 15_000, message: "la corta non si è chiusa da sola" })
    .not.toBeNull();
  const fine = await leggi(page);
  test.skip(
    fine.tLive !== null && fine.tVisto !== null && fine.tLive - fine.tVisto > AFFAMATA_MS,
    `macchina affamata: JS al timone a ${Math.round((fine.tLive ?? 0) - (fine.tVisto ?? 0))}ms (soglia ${AFFAMATA_MS})`,
  );
  // La gomma veloce si monta al takeover e si chiude da sola: tutta, più il
  // margine del ticker.
  const durata = Math.round(fine.tCaduto! - (fine.tLive ?? fine.tVisto!));
  expect(durata, `la corta è durata ${durata}ms dal takeover, budget ${CORTA_MS + 400}ms`).toBeLessThan(CORTA_MS + 400);
  expect(durata, `la corta è durata ${durata}ms dal takeover: la gomma veloce (${CORTA_MS}ms) non ha suonato intera`).toBeGreaterThanOrEqual(
    CORTA_MS - 100,
  );
  expect(fine.handoff, "INTRO_EVENT non è partito nella corta").not.toBeNull();
  expect(await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY)).toBe(INTRO_SHORT);
});

test("back/forward non rimette il sipario (D31)", async ({ page }) => {
  await page.goto("/acquista", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-preloader"), undefined, {
    timeout: 15_000,
  });
  await page.goto("/vendi", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-preloader"), undefined, {
    timeout: 15_000,
  });
  await page.goBack({ waitUntil: "commit" });
  expect(await compareEntro(page, 1200), "tornando indietro il sipario è ricomparso").toBe(false);
  const r = await leggi(page);
  // Con la cache back/forward il documento è quello di prima: il registro
  // porta il suo tipo di navigazione e non dice niente del ritorno.
  if (r.nav === "back_forward") expect(r.tVisto, "documento back_forward con il sipario").toBeNull();
});

test("/?intro con la chiave del film rifà il film intero", async ({ page }) => {
  await filmVisto(page);
  await page.goto("/?intro", { waitUntil: "commit" });
  await expect
    .poll(async () => (await leggi(page)).pannello, { timeout: 15_000, message: "con /?intro il sipario non è comparso" })
    .not.toBeNull();
  const r = await leggi(page);
  expect(r.valore, "con /?intro suona la corta invece del film").toBe("");
  expect(r.contenuto, "il film intero ha il lockup").not.toBe("none");
  expect(r.pannello, "il film intero resta sull'espresso").toBe("rgb(28, 21, 18)");
});

test("ricarica a due schermi dalla cima senza corta; vicino alla cima con la corta e la sagoma", async ({ page }) => {
  await filmVisto(page);
  await page.evaluate(() => window.scrollTo(0, 2 * window.innerHeight));
  await page.waitForFunction(() => window.scrollY >= 2 * window.innerHeight - 2, undefined, { timeout: 5_000 });
  await page.reload({ waitUntil: "commit" });
  expect(await compareEntro(page, 1200), "ricaricando a due schermi dalla cima è suonata la corta").toBe(false);
  expect((await leggi(page)).nav).toBe("reload");
  expect(
    await page.evaluate((k) => sessionStorage.getItem(k) !== null, LAST_Y_KEY),
    "il pagehide non ha scritto LAST_Y_KEY",
  ).toBe(true);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.scrollY === 0, undefined, { timeout: 5_000 });
  await page.reload({ waitUntil: "commit" });
  await expect
    .poll(async () => (await leggi(page)).pannello, { timeout: 15_000, message: "ricaricando in cima la corta non è suonata" })
    .not.toBeNull();
  const r = await leggi(page);
  expect(r.valore).toBe("short");
  expect(r.sagoma, "su «/» la corta tiene la sagoma").not.toBe("none");
  expect(r.sagomaAnim).toBe("0.3s");
  expect(r.contenuto).toBe("none");
});

test("D65: ricarica a 0,3 schermi su «/», la corta si apre sulla pagina in cima e il ripristino nativo torna \"auto\"", async ({ page }) => {
  await filmVisto(page);
  await page.evaluate(() => window.scrollTo({ top: Math.round(0.3 * window.innerHeight), behavior: "instant" }));
  await page.waitForFunction(() => Math.abs(window.scrollY - Math.round(0.3 * window.innerHeight)) <= 1, undefined, {
    timeout: 5_000,
  });
  await page.reload({ waitUntil: "commit" });
  await expect
    .poll(async () => (await leggi(page)).tCaduto, { timeout: 15_000, message: "ricaricando a 0,3 schermi la corta non è caduta" })
    .not.toBeNull();
  // Il guardiano del boot script si ritira a sipario caduto e load passato:
  // da lì si guarda ancora un secondo, la finestra in cui il browser
  // ripristinerebbe al load.
  await page.waitForFunction(
    () => document.readyState === "complete" && ((window as unknown as { __dtPreTop?: number }).__dtPreTop ?? 0) === 0,
    undefined,
    { timeout: 15_000, polling: "raf" },
  );
  await page.waitForTimeout(1_000);
  const r = await leggi(page);
  expect(r.nav).toBe("reload");
  expect(r.valore, "a 0,3 schermi dalla cima la ricarica di «/» ha la corta").toBe("short");
  expect(r.sotto, "troppo pochi fotogrammi sotto la corta").toBeGreaterThan(30);
  // Il ripristino nativo dei primi layout può arrivare in un fotogramma prima
  // che il guardiano lo riporti a 0: lì la gomma non è ancora montata e il
  // pannello copre tutto. Da quando la gomma è in scena (e può scoprire la
  // pagina), la pagina è in cima in ogni fotogramma.
  const visibili = r.fuori.filter(([, gomma]) => gomma === 1);
  expect(visibili, "fotogrammi [scrollY, gomma montata, innerHeight] con la gomma su una pagina fuori dalla cima").toEqual([]);
  expect(r.dopoMax, "dopo la corta la pagina è scesa (ripristino nativo al load)").toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => (window as unknown as { __dtPreTop?: number }).__dtPreTop), "il guardiano non si è armato").toBe(0);
  expect(await page.evaluate(() => history.scrollRestoration), "il guardiano non ha rimesso auto").toBe("auto");

  // ScrollTrigger rilegge il valore dell'avvio dopo ogni refresh: deve dire
  // "auto" anche lui (un refresh con un cambio di larghezza di 1 px).
  const vp = page.viewportSize()!;
  const n0 = await page.evaluate(() => (window as unknown as { __dtSTRefresh?: number }).__dtSTRefresh ?? 0);
  // Col telefono emulato ScrollTrigger rinfresca solo sul resize a larghezza
  // diversa (ignoreMobileResize): si aspetta il refresh prima di tornare.
  await page.setViewportSize({ width: vp.width + 1, height: vp.height });
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __dtSTRefresh?: number }).__dtSTRefresh ?? 0), {
      timeout: 5_000,
      message: "nessun refresh di ScrollTrigger dopo il cambio di larghezza",
    })
    .toBeGreaterThan(n0);
  expect(await page.evaluate(() => history.scrollRestoration), "ScrollTrigger ha riscritto manual").toBe("auto");
  await page.setViewportSize(vp);
});

test("/case/<slug> alla prima atterrata: nessun sipario (A26)", async ({ page, request }) => {
  const html = await (await request.get("/acquista")).text();
  const slug = /href="(\/case\/[^"?#]+)"/.exec(html)?.[1];
  expect(slug, "nessuna scheda /case/ nell'HTML di /acquista").toBeTruthy();
  await page.goto(slug!, { waitUntil: "commit" });
  expect(await compareEntro(page, 1500), `su ${slug} è comparso un sipario`).toBe(false);
  expect(
    await page.evaluate(() => document.getElementById("dt-preloader")?.getAnimations({ subtree: true }).length ?? -1),
  ).toBe(0);
  expect(await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY), "la scheda ha consumato la sessione").toBeNull();
});

/** Aspetta che il sipario in corso cada, poi restituisce la chiave di sessione. */
async function dopoIlSipario(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-preloader"), undefined, {
    timeout: 15_000,
    polling: "raf",
  });
  return page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY);
}

test("riga 4: dopo una corta interna, la prima entrata nella home ha il film intero", async ({ page }) => {
  await page.goto("/acquista", { waitUntil: "domcontentloaded" });
  expect(await dopoIlSipario(page), "la prima corta interna non ha scritto INTRO_SHORT").toBe(INTRO_SHORT);
  await page.goto("/", { waitUntil: "commit" });
  await expect
    .poll(async () => (await leggi(page)).pannello, { timeout: 15_000, message: "dopo la corta la home non ha sipario" })
    .not.toBeNull();
  const r = await leggi(page);
  expect(r.valore, "dopo una corta interna la home suona la corta invece del film: il film non arriverebbe più").toBe("");
  expect(r.contenuto, "il film intero ha il lockup").not.toBe("none");
  expect(await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY), "il film non segna INTRO_FILM all'armamento").toBe(INTRO_FILM);
});

test("riga 5: dopo il film, una pagina interna ha la corta senza sagoma e la chiave resta INTRO_FILM", async ({ page }) => {
  await filmVisto(page);
  await page.goto("/vendi", { waitUntil: "commit" });
  await expect
    .poll(async () => (await leggi(page)).pannello, { timeout: 15_000, message: "su /vendi dopo il film la corta non è suonata" })
    .not.toBeNull();
  const r = await leggi(page);
  expect(r.valore).toBe("short-page");
  expect(r.sagoma, "la sagoma della home non va sulle pagine interne").toBe("none");
  expect(await dopoIlSipario(page), "la corta interna ha riscritto la chiave del film").toBe(INTRO_FILM);
});

test("riga 8: con l'ancora nessun sipario; l'ancora segna il film solo su «/»", async ({ page }) => {
  await page.goto("/vendi#contatti", { waitUntil: "commit" });
  expect(await compareEntro(page, 1200), "con l'ancora su /vendi è comparso un sipario").toBe(false);
  expect(
    await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY),
    "l'ancora su una pagina interna ha scritto la chiave",
  ).toBeNull();
  await page.goto("/#contatti", { waitUntil: "commit" });
  expect(await compareEntro(page, 1200), "con l'ancora su «/» è comparso un sipario").toBe(false);
  expect(await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY), "l'ancora su «/» non ha segnato il film").toBe(INTRO_FILM);
});

test("riga 11 con la chiave c: navigazione client verso «/», ricarica a due schermi, né corta né film (D31)", async ({ page }) => {
  await page.goto("/acquista", { waitUntil: "domcontentloaded" });
  expect(await dopoIlSipario(page)).toBe(INTRO_SHORT);
  await page.evaluate(() => {
    (window as unknown as { __dtStessoDoc?: number }).__dtStessoDoc = 1;
  });
  await page.locator('header a[href="/"]').first().click();
  await page.waitForURL((u) => u.pathname === "/", { timeout: 15_000 });
  expect(
    await page.evaluate(() => (window as unknown as { __dtStessoDoc?: number }).__dtStessoDoc),
    "il link verso «/» ha caricato un documento nuovo: non è una navigazione client",
  ).toBe(1);
  await page.waitForFunction(() => document.querySelector("#top") !== null, undefined, { timeout: 15_000 });
  // Uno scroll istantaneo, come in D65: dopo una navigazione nuova la radice
  // è `scroll-behavior: smooth` (Lenis mette `lenis-smooth` solo mentre corre
  // lui), e un scrollTo nudo è una corsa. Se il refresh di ScrollTrigger al
  // montaggio della home arriva durante la corsa, la ferma alla quota che ha
  // letto: misurato a 390, la pagina restava in cima per 3 s e l'attesa qui
  // sotto scadeva (il rosso a intermittenza della CI).
  await page.evaluate(() => window.scrollTo({ top: 2 * window.innerHeight, behavior: "instant" }));
  await page.waitForFunction(() => window.scrollY >= 2 * window.innerHeight - 2, undefined, { timeout: 5_000 });
  await page.reload({ waitUntil: "commit" });
  expect(await compareEntro(page, 1500), "ricaricando a due schermi con la chiave c è suonato un sipario").toBe(false);
  expect((await leggi(page)).nav).toBe("reload");
  expect(await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY)).toBe(INTRO_SHORT);
});

test("riga 13: /case/<slug> con la chiave presente, nessun sipario e chiave invariata (A26)", async ({ page, request }) => {
  const html = await (await request.get("/acquista")).text();
  const slug = /href="(\/case\/[^"?#]+)"/.exec(html)?.[1];
  expect(slug, "nessuna scheda /case/ nell'HTML di /acquista").toBeTruthy();
  await page.goto("/acquista", { waitUntil: "domcontentloaded" });
  expect(await dopoIlSipario(page)).toBe(INTRO_SHORT);
  await page.goto(slug!, { waitUntil: "commit" });
  expect(await compareEntro(page, 1500), `su ${slug} con la chiave presente è comparso un sipario`).toBe(false);
  expect(await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY), "la scheda ha toccato la chiave").toBe(INTRO_SHORT);
});

test("riga 15: /acquista?intro dopo il film toglie la chiave e suona la corta interna", async ({ page }) => {
  await filmVisto(page);
  await page.goto("/acquista?intro", { waitUntil: "commit" });
  await expect
    .poll(async () => (await leggi(page)).pannello, { timeout: 15_000, message: "su /acquista?intro la corta non è suonata" })
    .not.toBeNull();
  expect((await leggi(page)).valore).toBe("short-page");
  expect(
    await page.evaluate((k) => sessionStorage.getItem(k), INTRO_KEY),
    "?intro non ha tolto la chiave prima di leggerla",
  ).toBe(INTRO_SHORT);
});
