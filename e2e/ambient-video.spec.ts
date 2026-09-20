import type { Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { wheelTo } from "./coreografia";

// Video d'ambiente (spec 2026-09-13 §2.7, §9.2). L'acqua di Costi chiari (A18 e
// A20 di Alberto; D25, D28) e il video del Congedo (la clip da 02:00, A29) suonano
// solo in vista, con motion ok, da 768 px e senza risparmio dati; fuori si fermano
// e riprendono dal punto, perché il tempo del video non si scrive mai. Il Congedo
// suona anche durante l'entrata della lastra (A35): il foglio piega il video che
// suona, come Lusion (Alberto, 20 set.). Sotto 768, a 390 e con reduced-motion
// resta il poster e non parte nessuna richiesta di video.
// In Chromium di Playwright manca H.264: la sorgente scelta è la WebM.

const VIDEO = /\.(mp4|webm)(\?|$)/;
const ACQUA = "#costi [data-acqua-band]";
const CONGEDO = 'section[aria-labelledby="congedo-title"]';

// L'host del hook è l'elemento con `data-ambient`, sulla sezione o dentro di lei:
// oggi la section del Congedo, dal commit 17 il ritaglio `[data-postcard-clip]`.
const hostOf = (page: Page, sel: string) => page.locator(`${sel}[data-ambient], ${sel} [data-ambient]`).first();

type Stato = { ambient: string | null; paused: boolean; t: number; dur: number; src: string };
const stato = (page: Page, sel: string): Promise<Stato> =>
  hostOf(page, sel).evaluate((h) => {
    const v = (h.querySelector("video") ?? h.closest("section")!.querySelector("video"))!;
    return { ambient: h.getAttribute("data-ambient"), paused: v.paused, t: v.currentTime, dur: v.duration || 1, src: v.currentSrc };
  });
const quotaDi = (page: Page, sel: string) =>
  page.locator(sel).evaluate((el) => el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3);

async function passataIntera(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForTimeout(800);
}

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

for (const caso of [
  { nome: "l'acqua di Costi chiari", host: ACQUA, file: /\/media\/acqua-1080\.webm/ },
  { nome: "il video del Congedo", host: CONGEDO, file: /\/media\/congedo-drone-(1080|720)\.webm/ },
]) {
  test(`${caso.nome} suona in vista, si ferma fuori e riprende dal punto`, async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "sotto 768 resta il poster: lo prova il test del telefono");
    await goto("/");
    await page.waitForTimeout(800);
    const quota = () => quotaDi(page, caso.host);

    await wheelTo(page, Math.max(0, await quota()));
    await expect.poll(async () => (await stato(page, caso.host)).ambient, { timeout: 15_000 }).toBe("playing");
    const a = await stato(page, caso.host);
    await page.waitForTimeout(300);
    const b = await stato(page, caso.host);
    expect(b.paused).toBe(false);
    expect((b.t - a.t + b.dur) % b.dur, "il video non avanza").toBeGreaterThan(0.15);
    expect(b.src).toMatch(caso.file);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect.poll(async () => (await stato(page, caso.host)).paused, { timeout: 5_000 }).toBe(true);
    await expect.poll(async () => (await stato(page, caso.host)).ambient).toBe("paused");
    const fermo = (await stato(page, caso.host)).t;

    // Il tempo si legge all'evento `playing`, prima che il loop possa ricominciare.
    await hostOf(page, caso.host).evaluate((h) => {
      const v = (h.querySelector("video") ?? h.closest("section")!.querySelector("video"))!;
      (window as unknown as { __ripresa?: Promise<number> }).__ripresa = new Promise<number>((res) =>
        v.addEventListener("playing", () => res(v.currentTime), { once: true }),
      );
    });
    await wheelTo(page, Math.max(0, await quota()));
    const ripresa = await page.evaluate(() => (window as unknown as { __ripresa: Promise<number> }).__ripresa);
    expect(ripresa, "il video è ripartito da capo").toBeGreaterThanOrEqual(fermo - 0.05);
  });
}

test("sul telefono resta il poster: nessuna richiesta di video", async ({ page, goto, isMobile }) => {
  test.skip(!isMobile, "è il ramo sotto 768");
  const richieste: string[] = [];
  page.on("request", (r) => {
    if (VIDEO.test(r.url())) richieste.push(r.url());
  });
  await goto("/");
  await passataIntera(page);
  expect(richieste).toEqual([]);
  await expect(hostOf(page, ACQUA)).toHaveAttribute("data-ambient", "off");
  await expect(hostOf(page, CONGEDO)).toHaveAttribute("data-ambient", "off");
});

// La soglia del gate (spec §2.7: `minWidth` di default MQ.desktop, 768 px) si prova
// al bordo, fuori dai progetti: a 767 nessun byte di video, a 768 l'acqua suona.
test("la soglia dei 768 px: a 767 resta il poster, a 768 l'acqua suona", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "il progetto del telefono ha già la sua larghezza");
  const richieste: string[] = [];
  page.on("request", (r) => {
    if (VIDEO.test(r.url())) richieste.push(r.url());
  });

  await page.setViewportSize({ width: 767, height: 900 });
  await goto("/");
  await passataIntera(page);
  expect(richieste, "a 767 px è partita una richiesta di video").toEqual([]);
  await expect(hostOf(page, ACQUA)).toHaveAttribute("data-ambient", "off");
  await expect(hostOf(page, CONGEDO)).toHaveAttribute("data-ambient", "off");

  await page.setViewportSize({ width: 768, height: 900 });
  await goto("/");
  await page.waitForTimeout(800);
  await wheelTo(page, Math.max(0, await quotaDi(page, ACQUA)));
  await expect.poll(async () => (await stato(page, ACQUA)).ambient, { timeout: 15_000 }).toBe("playing");
  expect(richieste.some((u) => /\/media\/acqua-1080\.webm/.test(u)), "a 768 px l'acqua non ha chiesto acqua-1080.webm").toBe(true);
});

// La sorgente si scrive al warm, prima del primo play: regola del commit 15 (nei suoi
// Produces). Spec §2.7 dice «scritte al primo play» e la voce dell'handoff lo chiede ad
// Alberto: con un no, questo test si riscrive sul primo play. Con l'host a un quarto di
// schermo sotto il bordo basso è dentro il margine `warm` (50 % 0px) e fuori dallo
// schermo: il <video> ha già `src` e preload="auto", non ha ancora suonato
// (played.length 0) e l'host dice "paused". In vista suona con la stessa sorgente: la
// scelta si fa una volta. La quota si legge dall'host, non dalla section, così vale
// anche quando il commit 17 sposta l'host su [data-postcard-clip].
type Sorgente = { src: string; preload: string; paused: boolean; played: number; ambient: string | null; top: number };
const sorgente = (page: Page, sel: string): Promise<Sorgente> =>
  hostOf(page, sel).evaluate((h) => {
    const v = (h.querySelector("video") ?? h.closest("section")!.querySelector("video"))!;
    return {
      src: v.getAttribute("src") ?? "",
      preload: v.preload,
      paused: v.paused,
      played: v.played.length,
      ambient: h.getAttribute("data-ambient"),
      top: h.getBoundingClientRect().top,
    };
  });
const quotaWarm = (page: Page, sel: string) =>
  hostOf(page, sel).evaluate((h) => h.getBoundingClientRect().top + window.scrollY - window.innerHeight * 1.25);

for (const caso of [
  { nome: "l'acqua di Costi chiari", host: ACQUA, file: /\/media\/acqua-1080\.webm/ },
  { nome: "il video del Congedo", host: CONGEDO, file: /\/media\/congedo-drone-(1080|720)\.webm/ },
]) {
  test(`${caso.nome}: la sorgente si scrive al warm, prima del primo play`, async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "sotto 768 non si scrive nessuna sorgente: lo prova il test del telefono");
    await goto("/");
    await expect(hostOf(page, caso.host), "manca l'host con data-ambient").toHaveCount(1);
    await page.waitForTimeout(800);
    // A scroll 0 l'host è lontano dal margine warm: nessuna sorgente, niente suonato.
    const lontano = await sorgente(page, caso.host);
    expect(lontano.src, "sorgente scritta prima del warm").toBe("");
    expect(lontano.played).toBe(0);

    await wheelTo(page, Math.max(0, await quotaWarm(page, caso.host)));
    await expect.poll(async () => (await sorgente(page, caso.host)).src, { timeout: 10_000 }).toMatch(caso.file);
    const vh = await page.evaluate(() => window.innerHeight);
    const warm = await sorgente(page, caso.host);
    expect(warm.top, "l'host è già dentro lo schermo: il warm non si distingue dal play").toBeGreaterThan(vh);
    expect(warm.preload).toBe("auto");
    expect(warm.paused).toBe(true);
    expect(warm.played, "il video ha già suonato al warm").toBe(0);
    expect(warm.ambient).toBe("paused");

    await wheelTo(page, Math.max(0, await quotaDi(page, caso.host)));
    await expect.poll(async () => (await stato(page, caso.host)).ambient, { timeout: 15_000 }).toBe("playing");
    expect((await sorgente(page, caso.host)).src, "la sorgente è cambiata al play").toMatch(caso.file);
  });
}

test.describe("con reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("nessuna richiesta di video e l'acqua ferma senza clip", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "il telefono è coperto dal test sopra");
    const richieste: string[] = [];
    page.on("request", (r) => {
      if (VIDEO.test(r.url())) richieste.push(r.url());
    });
    await goto("/");
    await passataIntera(page);
    expect(richieste).toEqual([]);
    await expect(hostOf(page, ACQUA)).toHaveAttribute("data-ambient", "off");
    await expect(hostOf(page, CONGEDO)).toHaveAttribute("data-ambient", "off");
    await expect(page.locator(ACQUA)).toHaveCSS("clip-path", "none");
  });
});
