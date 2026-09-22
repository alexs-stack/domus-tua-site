import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect, setConsent } from "./helpers";
import { clipOf, insetValues } from "./coreografia";

// IL MONOGRAMMA SEMPRE VISIBILE (spec §6.1). Alberto il 13 settembre 2026,
// «Si stacca da 1024» (A21, D34): da 1280 il segno parte sopra il badge
// della testata e scivola nel margine a 4vw; da 1024 a 1279 compare fra metà
// testata e testata; sotto 1024, con reduced-motion e su /case/* (A26) non
// c'è. T1: sopra [data-bg="foto"] le tacche virano all'avorio, il monogramma
// resta grigio e rosso (C23 della cliente). I viewport fuori dai progetti si
// impostano dentro il test; i test desktop girano solo in desktop-1440.

type Segno = {
  hidden: boolean;
  tema: string | null;
  left: number;
  top: number;
  w: number;
  cx: number;
  cy: number;
  opacity: number;
  vw: number;
};

const leggiSegno = (page: Page) =>
  page.evaluate((): Segno | null => {
    const el = document.querySelector<HTMLElement>("[data-segno]");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      hidden: el.hidden,
      tema: el.getAttribute("data-tema"),
      left: r.left,
      top: r.top,
      w: r.width,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      opacity: Number(getComputedStyle(el).opacity),
      vw: window.innerWidth,
    };
  });

/** Il badge della testata: il genitore dell'anello, che non ruota. */
const leggiSlot = (page: Page) =>
  page.evaluate(() => {
    const ring = document.querySelector("[data-segno-slot] [data-rot-ring]");
    const badge = ring?.parentElement;
    if (!badge) return null;
    const r = badge.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, visibile: badge.checkVisibility(), opacity: Number(getComputedStyle(badge).opacity) };
  });

async function scrollA(page: Page, y: number) {
  await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
  await page.waitForFunction((v) => Math.abs(window.scrollY - Math.min(v, document.documentElement.scrollHeight - innerHeight)) < 2, y);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

const soloDesktop = (nome: string) => test.skip(nome !== "desktop-1440", "viewport desktop impostato dentro il test");

/** I colori dipinti nel segno: le tacche (currentColor) e i due path del monogramma (C23). */
const coloriSegno = (page: Page) =>
  page.evaluate(() => {
    const segno = document.querySelector<HTMLElement>("[data-segno]")!;
    return {
      tacche: getComputedStyle(segno.querySelector("[data-rot-ring]")!).color,
      monogramma: Array.from(segno.querySelectorAll("[data-rot-mark] path")).map((p) => getComputedStyle(p).fill),
    };
  });
const INK = "rgb(70, 66, 61)"; // --color-ink
const CREAM = "rgb(249, 245, 239)"; // --color-cream
const MONOGRAMMA = ["rgb(89, 90, 88)", "rgb(227, 7, 22)"]; // #595a58 e #e30716, MarkDomus.tsx (C23)

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

test("1440, scroll 0: il segno sta sullo slot della testata, il badge è a opacità 0 e fermo", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto("/");
  await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
  const s = (await leggiSegno(page))!;
  const slot = (await leggiSlot(page))!;
  expect(Math.abs(s.left - slot.left), `segno a x ${s.left}, slot a ${slot.left}`).toBeLessThanOrEqual(1);
  expect(Math.abs(s.top - slot.top), `segno a y ${s.top}, slot a ${slot.top}`).toBeLessThanOrEqual(1);
  expect(Math.abs(s.w - slot.w)).toBeLessThanOrEqual(1);
  expect(s.opacity).toBe(1);
  expect(slot.opacity, "due cuori a schermo: il badge della testata non è sparito").toBe(0);
  // Il badge della testata riceve `paused` (RotatingMark): il suo anello non
  // gira più. GSAP scrive il transform inline sull'svg: si legge il calcolato e
  // l'attributo, due letture a 500 ms devono coincidere.
  const anello = page.locator("[data-segno-slot] [data-rot-ring]");
  const posa = () => anello.evaluate((el) => `${getComputedStyle(el).transform}|${el.getAttribute("transform") ?? ""}`);
  const t1 = await posa();
  await page.waitForTimeout(500);
  const t2 = await posa();
  expect(t2, "il badge della testata gira ancora sotto il segno acceso").toBe(t1);
});

test("1440, scroll 1200: centro a 4vw, taglia clamp(40px, 3,75vw, 56px), sull'asse della testata", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto("/");
  await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
  const s0 = (await leggiSegno(page))!;
  const cy0 = s0.cy;
  // A metà testata, in scrub (spec §6.1, M1): centro a metà strada fra lo slot e
  // 4vw, lato a metà fra 56 px e il clamp, y ferma sull'asse della testata.
  const testata = await page.evaluate(() => document.querySelector("header .dt-row")!.getBoundingClientRect().height);
  const yMeta = Math.round(testata / 2);
  await scrollA(page, yMeta);
  const k = yMeta / testata;
  const lato = Math.min(56, Math.max(40, 0.0375 * 1440));
  const meta = (await leggiSegno(page))!;
  expect(Math.abs(meta.cx - (s0.cx + (0.04 * 1440 - s0.cx) * k)), `a metà testata centro a ${meta.cx}`).toBeLessThanOrEqual(1);
  expect(Math.abs(meta.w - (56 + (lato - 56) * k)), `a metà testata lato ${meta.w}`).toBeLessThanOrEqual(1);
  expect(Math.abs(meta.cy - cy0)).toBeLessThanOrEqual(1);
  await scrollA(page, 1200);
  await expect.poll(async () => Math.abs((await leggiSegno(page))!.cx - 0.04 * 1440), { timeout: 3_000 }).toBeLessThanOrEqual(1);
  const s = (await leggiSegno(page))!;
  expect(Math.abs(s.w - Math.min(56, Math.max(40, 0.0375 * 1440)))).toBeLessThanOrEqual(1);
  expect(Math.abs(s.cy - cy0)).toBeLessThanOrEqual(1);
});

for (const vp of [
  // La testa di era (A38, A41, A45, 20-21 set. 2026): la foto alta è la pagina, in
  // flusso. A46 (Alberto, 21 set., sera): il cielo della foto è trasparente e il
  // riquadro è la carta: sopra il cielo (dove stanno le scritte, in inchiostro) il
  // segno resta grafite — tacche avorio sull'avorio non si vedrebbero — e vira
  // «foto» (tacche avorio, monogramma intatto, C23) solo dentro le BANDE scure della
  // striscia del segno (`.dt-testa_soggetto`, uno per corsa `segno` di tinte.json:
  // 22 set. 2026, C01/G02 — prima un marcatore unico dalla cima in giù le faceva
  // sparire sul cielo trasparente e sui muri bianchi); poi torna grafite sull'avorio.
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
]) {
  test(`/vendi ${vp.width}×${vp.height}: tema grafite a scroll 200 (il cielo è la carta), foto sul soggetto, grafite sotto la testa; le tacche virano, il monogramma no (T1, C23, A46)`, async ({ page, goto }, info) => {
    soloDesktop(info.project.name);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await goto("/vendi");
    await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
    // Sotto xl il segno si accende scorrendo (opacità 0 → 1 nella seconda metà della testata,
    // MarkSegno) e a opacità 0 non misura: la prima lettura si fa a scroll 200, oltre la testata,
    // dove sotto il segno c'è ancora il cielo, cioè la carta (la cima del soggetto di /vendi sta al
    // fondo del blocco: 900 px a 1440, 768 a 1024).
    await scrollA(page, 200);
    await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe("grafite");
    await expect.poll(async () => (await coloriSegno(page)).tacche, { timeout: 2_000, message: "sul cielo, che è la carta, le tacche non sono --color-ink (A46)" }).toBe(INK);
    const testa = await page.locator("section[data-testa]").evaluate((el) => {
      const r = el.getBoundingClientRect();
      const s = el.querySelector("[data-testa-soggetto]")!.getBoundingClientRect();
      return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, soggetto: s.top + window.scrollY, fondoFoto: s.bottom + window.scrollY };
    });
    expect(testa.soggetto, "la cima del soggetto di /vendi sta sopra il segno a scroll 200").toBeGreaterThan(200 + 100);
    // Sul soggetto: tema foto. La transizione di `color` dura --td-duration-fast (250 ms): si aspetta il colore finale.
    await scrollA(page, Math.round((testa.soggetto + testa.fondoFoto) / 2));
    await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe("foto");
    await expect.poll(async () => (await coloriSegno(page)).tacche, { timeout: 2_000, message: "sopra la foto le tacche non sono --color-cream" }).toBe(CREAM);
    expect((await coloriSegno(page)).monogramma, "sopra la foto il monogramma è stato ricolorato (C23)").toEqual(MONOGRAMMA);
    await scrollA(page, Math.round(testa.bottom + vp.height * 0.6));
    await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe("grafite");
    await expect.poll(async () => (await coloriSegno(page)).tacche, { timeout: 2_000, message: "con la grafite le tacche non sono --color-ink" }).toBe(INK);
    expect((await coloriSegno(page)).monogramma, "con la grafite il monogramma non è grigio e rosso").toEqual(MONOGRAMMA);
  });
}

test("1440, col footer al 40 %: il marcatore della cartolina coincide col ritaglio ±1 px (§3.18)", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto("/");
  const sec = page.locator('[data-corridor="cartolina"]');
  await expect(sec).toHaveAttribute("data-on", "");
  // Come «la banda si ritira in cartolina e il footer sale» (commit 17): dentro
  // la cartolina, a metà corsa, poi col footer al 40 % la cartolina è ferma a
  // inset(8% 22% 8% 22%). Oggi un refresh di ScrollTrigger a fine corsa (un
  // salto diretto dalla cima, un resize) lascia il ritaglio a inset(0% 0% 8%)
  // (Congedo.tsx, commit 17; segnalato al coordinatore col commit 20): qui la
  // guardia è sul marcatore, che segue il ritaglio, e il percorso è quello del
  // test del commit 17.
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const q = await page.evaluate(() => {
    const quota = (el: HTMLElement) => {
      let y = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      return y;
    };
    return {
      secTop: quota(document.querySelector<HTMLElement>('[data-corridor="cartolina"]')!),
      footTop: quota(document.querySelector<HTMLElement>("footer[data-postcard-foot]")!),
      vh: window.innerHeight,
    };
  });
  await scrollA(page, Math.round(q.secTop + q.vh * 0.4));
  await page.waitForTimeout(1200);
  await scrollA(page, Math.round(q.footTop - q.vh * 0.4));
  await page.waitForTimeout(1500);
  const clip = sec.locator("[data-postcard-clip]");
  const lati = insetValues(await clipOf(clip));
  expect(lati, "col footer al 40 % il clip-path non è un inset").not.toBeNull();
  const [t, r, b, l] = lati!;
  expect(Math.abs(t - 8), "la cartolina non è ferma a inset 8 %").toBeLessThanOrEqual(0.2);
  const geo = await page.evaluate(() => {
    const sec = document.querySelector('[data-corridor="cartolina"]')!;
    const box = (el: Element) => {
      const k = el.getBoundingClientRect();
      return { l: k.left, r: k.right, t: k.top, b: k.bottom, w: k.width, h: k.height };
    };
    return {
      clip: box(sec.querySelector("[data-postcard-clip]")!),
      marker: box(sec.querySelector('[data-corridor-screen] > [data-bg="foto"]')!),
    };
  });
  // Il ritaglio visibile: la scatola del clip ridotta dei quattro lati di inset().
  const ritaglio = {
    l: geo.clip.l + (geo.clip.w * l) / 100,
    r: geo.clip.r - (geo.clip.w * r) / 100,
    t: geo.clip.t + (geo.clip.h * t) / 100,
    b: geo.clip.b - (geo.clip.h * b) / 100,
  };
  for (const lato of ["l", "r", "t", "b"] as const) {
    expect(
      Math.abs(geo.marker[lato] - ritaglio[lato]),
      `lato ${lato}: marcatore a ${geo.marker[lato]}, ritaglio a ${ritaglio[lato]}`,
    ).toBeLessThanOrEqual(1);
  }
});

test("1440, salto dentro la cartolina e 2 s fermi: il tema segue il marcatore anche a scrub finito (D67)", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto("/");
  const sec = page.locator('[data-corridor="cartolina"]');
  await expect(sec).toHaveAttribute("data-on", "");
  await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
  // Lo scrub della cartolina (0,9 s, Congedo.tsx) ritira il ritaglio anche
  // dopo l'ultimo evento di scroll: il salto istantaneo ne manda uno solo. Il
  // tema deve seguire il marcatore a scrub finito, senza un altro scroll (D67:
  // MarkSegno rilegge per MARK_TEMA_CODA_S dopo ogni evento).
  const esiti: Array<{ f: number; tema: string | null; dentro: boolean; left: number }> = [];
  for (const f of [0.35, 0.65, 1, 1.3]) {
    const alto = await sec.evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));
    await scrollA(page, alto);
    await page.waitForTimeout(2000);
    await scrollA(page, Math.round(alto + f * 900));
    await page.waitForTimeout(2000);
    esiti.push({
      f,
      ...(await page.evaluate(() => {
        const s = document.querySelector<HTMLElement>("[data-segno]")!;
        const r = s.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const m = document.querySelector('[data-corridor="cartolina"] [data-corridor-screen] > [data-bg="foto"]')!.getBoundingClientRect();
        return { tema: s.getAttribute("data-tema"), dentro: cx >= m.left && cx <= m.right && cy >= m.top && cy <= m.bottom, left: Math.round(m.left) };
      })),
    });
  }
  const riga = esiti.map((e) => `f ${e.f}: tema ${e.tema}, centro ${e.dentro ? "dentro" : "fuori"} (marcatore da x ${e.left})`).join("\n");
  expect(esiti.some((e) => !e.dentro), `nessun salto porta il marcatore fuori dal centro del segno:\n${riga}`).toBe(true);
  for (const e of esiti) expect(e.tema, riga).toBe(e.dentro ? "foto" : "grafite");
});

test("1279: nessun badge in testata; il segno compare nel margine dopo la testata", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  await page.setViewportSize({ width: 1279, height: 900 });
  await goto("/");
  expect((await leggiSlot(page))!.visibile, "a 1279 il badge della testata è visibile").toBe(false);
  await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
  expect((await leggiSegno(page))!.opacity).toBeLessThanOrEqual(0.01);
  await scrollA(page, 200);
  await expect.poll(async () => (await leggiSegno(page))!.opacity, { timeout: 3_000 }).toBeGreaterThanOrEqual(0.99);
  expect(Math.abs((await leggiSegno(page))!.cx - 0.04 * 1279)).toBeLessThanOrEqual(1);
});

test("sotto 1024 il segno non si accende (1023 e il telefono)", async ({ page, goto }, info) => {
  if (info.project.name === "desktop-1440") await page.setViewportSize({ width: 1023, height: 900 });
  else test.skip(info.project.name !== "mobile-390", "solo 1023 su desktop e il telefono a 390");
  await goto("/");
  await page.waitForTimeout(1500);
  await scrollA(page, 600);
  expect((await leggiSegno(page))!.hidden).toBe(true);
});

test("su /case/<slug> il segno non esiste e il badge resta in testata (A26)", async ({ page, goto, request }, info) => {
  soloDesktop(info.project.name);
  const html = await (await request.get("/acquista")).text();
  const slug = /href="(\/case\/[^"?#]+)"/.exec(html)?.[1];
  expect(slug).toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto(slug!);
  await page.waitForTimeout(1500);
  expect(await page.locator("[data-segno]").count()).toBe(0);
  expect((await leggiSlot(page))!.opacity).toBe(1);
});

test.describe("con reduced-motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });
  test("1440: il segno resta hidden e il badge resta in testata", async ({ page, goto }, info) => {
    soloDesktop(info.project.name);
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto("/");
    await page.waitForTimeout(1500);
    await scrollA(page, 1200);
    expect((await leggiSegno(page))!.hidden).toBe(true);
    await scrollA(page, 0);
    expect((await leggiSlot(page))!.opacity).toBe(1);
  });
});

for (const rotta of ["/", "/vendi", "/metodo"]) {
  for (const vp of [
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ]) {
    test(`${rotta} ${vp.width}: il segno non copre titoli, link e bottoni`, async ({ page, goto }, info) => {
      soloDesktop(info.project.name);
      test.setTimeout(300_000);
      await page.setViewportSize(vp);
      await goto(rotta);
      await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
      const colpe = await page.evaluate(async () => {
        const segno = document.querySelector<HTMLElement>("[data-segno]")!;
        const vai = async (y: number, ms: number) => {
          window.scrollTo({ top: y, behavior: "instant" });
          await new Promise((r) => setTimeout(r, ms));
        };
        const opacita = (el: Element | null) => {
          let p = 1;
          for (let n = el; n && n !== document.documentElement; n = n.parentElement) p *= Number(getComputedStyle(n).opacity);
          return p;
        };
        const ESCLUSI = "header, #mobile-menu, .dt-preloader, [data-segno]";
        // Contenuto che si muove in scrub e non col flusso: lì la previsione non vale.
        const MOBILI = "[data-corridor][data-on], .dt-od_area";
        // `[data-horizon-stair]` sta nell'elenco perché i gradini del titolo del
        // territorio si muovono in transform dentro l'h3 (parallasse contraria,
        // HorizonScroller): il rettangolo dell'h3 non segue i figli trasformati,
        // così la riga che davvero si avvicina al segno sarebbe invisibile al
        // test (D68, per A27 di Alberto). L'aria che resta la misura
        // misure/20-territorio.mjs; qui si guarda solo che nessuno finisca sotto.
        const bersagli = (radice: ParentNode) =>
          Array.from(radice.querySelectorAll<HTMLElement>("h1, h2, h3, a, button, [data-horizon-stair]")).filter(
            (el) => !el.closest(ESCLUSI),
          );
        const visibile = (el: HTMLElement) => el.checkVisibility() && opacita(el) >= 0.1;
        const acceso = () => !segno.hidden && Number(getComputedStyle(segno).opacity) >= 0.1;
        // Sovrapposizione col rettangolo del segno, e l'elemento davvero in cima lì.
        const sotto = (el: HTMLElement, s: DOMRect) => {
          const r = el.getBoundingClientRect();
          const l = Math.max(r.left, s.left);
          const d = Math.min(r.right, s.right);
          const t = Math.max(r.top, s.top);
          const b = Math.min(r.bottom, s.bottom);
          if (d - l <= 0 || b - t <= 0) return false;
          return document.elementsFromPoint((l + d) / 2, (t + b) / 2).some((x) => el.contains(x));
        };
        const nome = (el: HTMLElement) => `${el.tagName.toLowerCase()} «${(el.textContent ?? "").trim().slice(0, 40)}»`;
        const out: string[] = [];
        const testata = document.querySelector("header .dt-row")?.getBoundingClientRect().height ?? 0;
        const riposo = Math.ceil(testata) + 1;
        const max = document.documentElement.scrollHeight - innerHeight;

        // 1. La discesa nei primi --dt-head-h px, dove il segno scivola: controllo
        //    diretto a passi di 8 px.
        for (let y = 0; y <= Math.min(max, riposo); y += 8) {
          await vai(y, 120);
          if (!acceso()) continue;
          const s = segno.getBoundingClientRect();
          for (const el of bersagli(document)) if (visibile(el) && sotto(el, s)) out.push(`${nome(el)} a scroll ${y} (discesa)`);
        }

        // 2. Il flusso. Il segno a riposo sta fermo nella sua fascia: un elemento
        //    visibile che cade nella colonna della fascia passerà sotto il segno a
        //    uno scroll fra `riposo` e `max`. Lo si trova un viewport alla volta, si
        //    calcola lo scroll in cui il suo centro incontra quello della fascia e
        //    lì si verifica davvero.
        await vai(Math.min(max, riposo), 400);
        const fascia = segno.getBoundingClientRect();
        const visti = new Set<HTMLElement>();
        const candidati: Array<{ el: HTMLElement; y: number }> = [];
        for (let y = 0; ; y = Math.min(max, y + innerHeight)) {
          await vai(y, 300);
          for (const el of bersagli(document)) {
            if (visti.has(el) || el.closest(MOBILI) || !visibile(el)) continue;
            const r = el.getBoundingClientRect();
            if (r.bottom <= 0 || r.top >= innerHeight) continue;
            if (r.right <= fascia.left || r.left >= fascia.right) continue;
            const alto = r.top + y;
            const da = alto - fascia.bottom;
            const a = alto + r.height - fascia.top;
            if (a <= riposo || da >= max) continue;
            visti.add(el);
            const incontro = alto + r.height / 2 - (fascia.top + fascia.height / 2);
            candidati.push({ el, y: Math.round(Math.min(max, Math.max(riposo, incontro))) });
          }
          if (y >= max) break;
        }
        for (const { el, y } of candidati) {
          await vai(y, 300);
          if (acceso() && visibile(el) && sotto(el, segno.getBoundingClientRect())) out.push(`${nome(el)} a scroll ${y}`);
        }

        // 3. Il contenuto in scrub (corridoi accesi, finestra di Open Domus): a
        //    passi di 40 px lungo tutta la corsa, col rettangolo vero del segno.
        for (const zona of Array.from(document.querySelectorAll<HTMLElement>(MOBILI))) {
          const alto = zona.getBoundingClientRect().top + window.scrollY;
          const basso = alto + zona.offsetHeight;
          for (let y = Math.max(riposo, Math.floor(alto - innerHeight)); y <= Math.min(max, Math.ceil(basso)); y += 40) {
            await vai(y, 120);
            if (!acceso()) continue;
            const s = segno.getBoundingClientRect();
            for (const el of bersagli(zona)) if (visibile(el) && sotto(el, s)) out.push(`${nome(el)} a scroll ${y} (in scrub)`);
          }
        }
        return Array.from(new Set(out));
      });
      expect(colpe, `${rotta} ${vp.width}×${vp.height}:\n${colpe.join("\n")}`).toEqual([]);
    });
  }
}

// A46 (Alberto, 21 set. 2026, sera): la facciata della finestra di Open Domus ha il cielo trasparente e
// a schermo intero sotto il segno, in alto a sinistra, c'è il cielo, cioè la carta: lì il tema resta
// grafite (marcatore `foto-chiara`) anche se l'elemento in cima è un <img>. Sovrapposizione non vuol
// dire visibilità (lezione di 6a33f85): l'immagine col cielo è l'eccezione dichiarata. A47 (22 set.): la
// facciata è quella che SALE, 9:16 (`villa-facciata-sale-alta-cielo.webp`), intera: sotto il segno passano
// il cielo, i muri bianchi e il travertino (grafite) e le travi scure delle pergole, che hanno i loro
// marcatori `foto` (le bande di finestra.json, scripts/media/finestra.mjs): lì il tema vira.
const FOTO_COL_CIELO = /villa-facciata-sale-alta-cielo\.webp/;
const BANDE_FINESTRA = (JSON.parse(readFileSync(join(__dirname, "../app/lib/motion/finestra.json"), "utf8")) as { segno: number[][] }).segno;
/** Il tema atteso sotto il segno quando in cima c'è la facciata: `foto` dentro una banda, `grafite` fuori; null a un pelo dal bordo. */
function temaSullaFacciata(fy: number, bande: number[][]): "foto" | "grafite" | null {
  if (bande.some(([a, z]) => Math.abs(fy - a) < 0.004 || Math.abs(fy - z) < 0.004)) return null;
  return bande.some(([a, z]) => fy >= a && fy <= z) ? "foto" : "grafite";
}

test("1440 su /, a passi di 450 px: se sotto il centro del segno c'è una foto, il tema è foto (tranne il cielo trasparente della finestra, che è carta: grafite)", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto("/");
  await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
  const errori = await page.evaluate(
    async ({ cielo, bande }) => {
      const segno = document.querySelector<HTMLElement>("[data-segno]")!;
      const out: string[] = [];
      let cieloVisto = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      for (let y = 0; y <= max; y += 450) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 250));
        if (segno.hidden || Number(getComputedStyle(segno).opacity) < 0.1) continue;
        const r = segno.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const tema = segno.getAttribute("data-tema");
        // A47: la facciata si riconosce dalla geometria, non da elementFromPoint: sopra l'<img> sta il
        // capitolo (`.dt-od_content`, col padding dello spazio sopra) e prima di p 1 lo schermo delle tende.
        // Sulla facciata a schermo intero il tema è grafite (cielo = carta, muri, travertino) tranne nelle
        // bande delle travi (finestra.json), dove vira foto; a un pelo dal bordo non si giudica.
        const fb = document.querySelector<HTMLElement>("#open-domus .dt-od_window")?.getBoundingClientRect();
        const schermo = document.querySelector<HTMLElement>("#open-domus .dt-od_screen");
        const schermoVia = !schermo || getComputedStyle(schermo).visibility === "hidden";
        if (fb && schermoVia && cx >= fb.left && cx <= fb.right && cy >= fb.top && cy <= fb.bottom) {
          cieloVisto += 1;
          const fy = (cy - fb.top) / fb.height;
          const alBordo = bande.some(([a, z]) => Math.abs(fy - a) < 0.004 || Math.abs(fy - z) < 0.004);
          const atteso = bande.some(([a, z]) => fy >= a && fy <= z) ? "foto" : "grafite";
          if (!alBordo && tema !== atteso) out.push(`scroll ${y}: sulla facciata della finestra (y ${fy.toFixed(3)}, ${atteso === "foto" ? "trave" : "carta o muro"}) il tema è ${tema}, non ${atteso} (A46, A47)`);
          continue;
        }
        const sotto = document.elementFromPoint(cx, cy);
        if (sotto && (sotto.tagName === "IMG" || sotto.tagName === "VIDEO")) {
          const src = (sotto as HTMLImageElement | HTMLVideoElement).currentSrc.split("/").pop() ?? "";
          if (new RegExp(cielo).test(decodeURIComponent(src))) continue;
          if (tema !== "foto") out.push(`scroll ${y}: ${sotto.tagName} ${src} sotto il segno col tema ${tema}`);
        }
      }
      return { out, cieloVisto };
    },
    { cielo: FOTO_COL_CIELO.source, bande: BANDE_FINESTRA },
  );
  expect(errori.out, errori.out.join("\n")).toEqual([]);
  expect(errori.cieloVisto, "la corsa non ha mai trovato la finestra a schermo intero sotto il segno").toBeGreaterThan(0);
});

test("1440: i marcatori dell'hero e della finestra di Open Domus (§3.2, §3.10; A46: sul cielo della finestra grafite)", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto("/");
  await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
  await scrollA(page, 1000);
  await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe("foto");
  const area = await page.evaluate(() => {
    const a = document.querySelector<HTMLElement>(".dt-od_area");
    return a ? a.getBoundingClientRect().top + window.scrollY : null;
  });
  expect(area, "manca .dt-od_area in home").not.toBeNull();
  await scrollA(page, Math.round(area! + 900));
  await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe("grafite");
  // A46: da +150svh la finestra è a schermo intero e sotto il segno c'è il cielo trasparente della
  // facciata, cioè la carta: il marcatore è `foto-chiara` e il tema resta grafite (le tacche avorio
  // sparirebbero nell'avorio). A47: sulle travi delle pergole (bande di finestra.json) vira foto. Sotto
  // il segno c'è davvero l'<img> col cielo.
  await scrollA(page, Math.round(area! + 2.2 * 900));
  // La facciata si riconosce dalla geometria (sopra l'<img> sta il capitolo con lo spazio sopra): il centro
  // del segno dentro la scatola della foto, con lo schermo delle tende già nascosto dal cue di p 1, e la
  // foto montata è il WebP col cielo.
  const sotto = await page.evaluate(() => {
    const r = document.querySelector<HTMLElement>("[data-segno]")!.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const win = document.querySelector<HTMLElement>("#open-domus .dt-od_window")!;
    const fb = win.getBoundingClientRect();
    const schermo = document.querySelector<HTMLElement>("#open-domus .dt-od_screen")!;
    return {
      dentro: cx >= fb.left && cx <= fb.right && cy >= fb.top && cy <= fb.bottom,
      schermoVia: getComputedStyle(schermo).visibility === "hidden",
      src: decodeURIComponent(win.querySelector("img")?.currentSrc ?? ""),
      fy: (cy - fb.top) / fb.height,
    };
  });
  expect(sotto.dentro && sotto.schermoVia, "sotto il segno non c'è la facciata a schermo intero").toBe(true);
  expect(sotto.src, "la finestra non monta la facciata col cielo trasparente").toMatch(FOTO_COL_CIELO);
  const atteso = temaSullaFacciata(sotto.fy, BANDE_FINESTRA);
  if (atteso) await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe(atteso);
});

// 22 set. 2026 (revisione avversaria di A46, C01/G02): su /recensioni il muro bianco della villa tocca
// il bordo alto della foto nella colonna del segno; con un marcatore dalla cima in giù le tacche
// viravano all'avorio su un fondo quasi avorio (misurato: media rgb 248,238,233, 100 % entro ±8) per
// ~400 px di scroll. Ora le bande di tinte.json cominciano dove la striscia è scura.
test("1440 su /recensioni: sul muro bianco in cima alla foto il segno resta grafite; dentro la prima banda scura vira foto (22 set.)", async ({ page, goto }, info) => {
  soloDesktop(info.project.name);
  await page.setViewportSize({ width: 1440, height: 900 });
  await goto("/recensioni");
  await expect.poll(async () => (await leggiSegno(page))?.hidden, { timeout: 10_000 }).toBe(false);
  const geo = await page.locator("section[data-testa]").evaluate((el) => {
    const s = el.querySelector("[data-testa-strato]")!.getBoundingClientRect();
    const bande = Array.from(el.querySelectorAll("[data-testa-soggetto]")).map((m) => m.getBoundingClientRect()).map((r) => ({ top: r.top + window.scrollY, bottom: r.bottom + window.scrollY }));
    return { stratoTop: s.top + window.scrollY, bande };
  });
  expect(geo.bande.length, "/recensioni senza bande").toBeGreaterThan(0);
  expect(geo.bande[0].top - geo.stratoTop, "la prima banda comincia sul muro bianco").toBeGreaterThan(60);
  // Il centro del segno (asse della testata, ~45 px) sul muro, fra la cima dello strato e la prima banda.
  await scrollA(page, Math.round((geo.stratoTop + geo.bande[0].top) / 2 - 45));
  await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe("grafite");
  await expect.poll(async () => (await coloriSegno(page)).tacche, { timeout: 2_000, message: "sul muro bianco le tacche non sono --color-ink" }).toBe(INK);
  await scrollA(page, Math.round((geo.bande[0].top + geo.bande[0].bottom) / 2 - 45));
  await expect.poll(async () => (await leggiSegno(page))?.tema, { timeout: 3_000 }).toBe("foto");
  await expect.poll(async () => (await coloriSegno(page)).tacche, { timeout: 2_000 }).toBe(CREAM);
});
