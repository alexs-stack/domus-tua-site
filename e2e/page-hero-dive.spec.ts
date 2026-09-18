import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { matrixOf, scrollToProgress } from "./coreografia";
import { BAND_SIZES, DIVE, DIVE_BOTTOM_SEL, diveDeltas } from "../app/lib/motion/page-dive";

// IL TUFFO DELLE 11 PAGEHERO.
//
// A20 di Alberto (13 settembre 2026, «Fedeltà letterale», spec §5.1): da 1024 px e
// 640 px d'altezza con motion ok (D22) la testa di ogni pagina interna è un
// corridoio sticky; il testo esce dall'alto prima che la foto si ingrandisca, e la
// foto passa da 1 a 2. Sotto la soglia nessuno sticky e la foto cresce dentro la
// sua cornice. D33: la foto base è l'LCP, lo strato nitido arriva dopo e solo a
// DPR 1. Le viewport fuori dai progetti (1024×768, 1280×720, 1920×1080, 768×1024,
// 1440×600) si impostano nel test; ogni matrice gira in un progetto solo. I titoli cominciano
// con il gruppo del lavoro (`tuffo:`, `bande1:`, `bande2:`, `bande3:`) per `--grep`.

test.use({ contextOptions: { reducedMotion: "no-preference" } });

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

const DIVE_SEL = '[data-corridor="page-dive"]';
const ROTTE = [
  "/vendi",
  "/acquista",
  "/servizi",
  "/metodo",
  "/chi-siamo",
  "/recensioni",
  "/open-domus",
  "/lavora-con-noi",
  "/domande-frequenti",
  "/privacy",
  "/cookie",
] as const;
const LINGUE = ["it", "en", "fr", "de", "es"] as const;
type Lingua = (typeof LINGUE)[number];
type Matrice = { a: number; b: number; c: number; d: number; m41: number; m42: number };

function soloIn(progetto: string, attuale: string) {
  test.skip(attuale !== progetto, `matrice impostata nel test: gira solo in ${progetto}`);
}

async function inLingua(page: Page, lingua: Lingua) {
  await page.context().addCookies([{ name: "dt_locale", value: lingua, domain: "127.0.0.1", path: "/" }]);
}

/** LocaleProvider rende `it` nel server e passa alla lingua del cookie dopo l'idratazione. */
async function attendiLingua(page: Page, lingua: Lingua) {
  if (lingua === "it") return;
  await expect(page.locator(`html[lang="${lingua}"]`)).toHaveCount(1, { timeout: 10_000 });
}

async function acceso(page: Page) {
  await expect(page.locator(`${DIVE_SEL}[data-on]`)).toHaveCount(1, { timeout: 10_000 });
}

/** Gli host accesi dei corridoi di A19 in ordine alfabetico: la stessa lettura di hostsOn in e2e/corridors.spec.ts. */
function hostsOn(page: Page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-corridor][data-on]"), (el) => el.dataset.corridor ?? "").sort(),
  );
}

/** Spec §5.3: su /chi-siamo sotto il tuffo corre anche la rotaia del team, un corridoio acceso di A19 (corridor="team"). */
const HOST_ATTESI: Partial<Record<(typeof ROTTE)[number], string[]>> = { "/chi-siamo": ["page-dive", "team"] };

/** cubic-bezier(x1, y1, x2, y2), come una CustomEase a un segmento di gsap.ts: y in funzione di x, per bisezione. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const b = (p1: number, p2: number, t: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (b(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return b(y1, y2, (lo + hi) / 2);
  };
}
/** dtEase e dtIn: cifre di spec §2.6, registrate in gsap.ts e scritte in chapters.ts. */
const DT_EASE = bezier(0.25, 0.1, 0.25, 1);
const DT_IN = bezier(0.5, 0, 0.75, 0);

function identita(m: Matrice) {
  return (
    Math.abs(m.a - 1) < 1e-3 &&
    Math.abs(m.b) < 1e-3 &&
    Math.abs(m.c) < 1e-3 &&
    Math.abs(m.d - 1) < 1e-3 &&
    Math.abs(m.m41) < 0.5 &&
    Math.abs(m.m42) < 0.5
  );
}

/** Porta il corridoio al progresso p e controlla il contratto dell'helper: start "top top", end "bottom bottom". */
async function aProgresso(page: Page, p: number) {
  await scrollToProgress(page, DIVE_SEL, p);
  const atteso = await page.evaluate(
    ({ sel, p }) => {
      const s = document.querySelector<HTMLElement>(sel)!;
      const top = s.getBoundingClientRect().top + window.scrollY;
      return Math.round(top + p * (s.offsetHeight - window.innerHeight));
    },
    { sel: DIVE_SEL, p },
  );
  await expect
    .poll(async () => Math.abs((await page.evaluate(() => Math.round(window.scrollY))) - atteso), { timeout: 3_000 })
    .toBeLessThanOrEqual(2);
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  await page.waitForTimeout(60);
}

/** Area d'intersezione fra ogni testo del tuffo ancora sotto il bordo alto e la foto che scala. */
function intersezioni(page: Page) {
  return page.evaluate(() => {
    const z = document.querySelector("[data-dive-zoom]")!.getBoundingClientRect();
    return [...document.querySelectorAll<HTMLElement>("[data-dive-text]")]
      .map((t) => ({ t, r: t.getBoundingClientRect() }))
      .filter(({ r }) => r.bottom > 0)
      .map(({ t, r }) => {
        const w = Math.max(0, Math.min(r.right, z.right) - Math.max(r.left, z.left));
        const h = Math.max(0, Math.min(r.bottom, z.bottom) - Math.max(r.top, z.top));
        return { testo: (t.textContent ?? "").trim().slice(0, 30), area: w * h };
      });
  });
}

/** Il progresso vero del corridoio, dallo scrollY raggiunto. */
function progressoReale(page: Page) {
  return page.evaluate((sel) => {
    const s = document.querySelector<HTMLElement>(sel)!;
    const top = s.getBoundingClientRect().top + window.scrollY;
    return (window.scrollY - top) / (s.offsetHeight - window.innerHeight);
  }, DIVE_SEL);
}

/** Le misure della formula di A20 (spec §5.1) a progresso 0: offsetTop e offsetHeight, che i transform non toccano. Il fondo del testo comprende la calligrafia (DIVE_BOTTOM_SEL). */
function geometria(page: Page) {
  return page.evaluate(({ sel, fondo }) => {
    const sec = document.querySelector<HTMLElement>(sel)!;
    const screen = sec.querySelector<HTMLElement>(":scope > [data-corridor-screen]")!;
    const content = sec.querySelector<HTMLElement>("[data-dive-content]")!;
    const band = content.querySelector<HTMLElement>("[data-dive-band]")!;
    const offsetIn = (el: HTMLElement) => {
      let y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== content) {
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return y;
    };
    let textBottom = 0;
    content.querySelectorAll<HTMLElement>(fondo).forEach((t) => {
      textBottom = Math.max(textBottom, offsetIn(t) + t.offsetHeight);
    });
    return { vh: screen.offsetHeight, bandTop: offsetIn(band), bandH: band.offsetHeight, textBottom };
  }, { sel: DIVE_SEL, fondo: DIVE_BOTTOM_SEL });
}

/** Il centro del segno fisso di D34: x = 4vw, y = --dt-head-h / 2 (spec §6.1, lane-globali.md:320). */
function asseDelSegno(page: Page) {
  return page.evaluate(() => {
    const sonda = document.createElement("div");
    sonda.style.cssText = "position:absolute;left:0;top:0;width:1px;visibility:hidden;height:var(--dt-head-h)";
    document.body.append(sonda);
    const y = sonda.getBoundingClientRect().height / 2;
    sonda.remove();
    return { x: 0.04 * window.innerWidth, y };
  });
}

for (const rotta of ROTTE) {
  test(`tuffo: ${rotta} a 1440, a scroll 0 la testa è ferma e il corridoio è acceso`, async ({ page, goto }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await goto(rotta);
    await acceso(page);
    await expect.poll(() => hostsOn(page), { timeout: 10_000 }).toEqual(HOST_ATTESI[rotta] ?? ["page-dive"]);
    await expect(page.locator(`${DIVE_SEL} > [data-corridor-screen]`)).toHaveCSS("position", "sticky");
    await expect(page.locator(`${DIVE_SEL} > [data-corridor-run]`)).toHaveCSS("display", "block");
    await expect(page.locator("img[data-dive-base]")).toHaveAttribute("sizes", BAND_SIZES);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    for (const sel of ["[data-dive-content]", "[data-dive-band]", "[data-dive-zoom]"]) {
      expect(identita(await matrixOf(page.locator(sel))), `${rotta}: ${sel} non è l'identità a scroll 0`).toBe(true);
    }
  });
}

test("tuffo: /vendi a 1440, a metà corridoio il testo è salito e la foto cresce; tornando su tutto torna", async ({
  page,
  goto,
}, testInfo) => {
  soloIn("desktop-1440", testInfo.project.name);
  await goto("/vendi");
  await acceso(page);
  await aProgresso(page, 0.5);
  const contenuto = await matrixOf(page.locator("[data-dive-content]"));
  const banda = await matrixOf(page.locator("[data-dive-band]"));
  const zoom = await matrixOf(page.locator("[data-dive-zoom]"));
  expect(contenuto.m42).toBeLessThan(0);
  expect(banda.m42).toBeGreaterThanOrEqual(0);
  expect(zoom.a).toBeGreaterThan(1);
  await aProgresso(page, 1);
  expect((await matrixOf(page.locator("[data-dive-zoom]"))).a).toBeCloseTo(DIVE.zoomTo, 2);
  await aProgresso(page, 0);
  for (const sel of ["[data-dive-content]", "[data-dive-band]", "[data-dive-zoom]"]) {
    expect(identita(await matrixOf(page.locator(sel))), `${sel} non torna all'identità`).toBe(true);
  }
});

for (const [w, h] of [
  [1440, 900],
  [1024, 768],
] as const) {
  test(`tuffo: /vendi a ${w}×${h}, le curve: salita dtEase fino a 0,6, zoom dtIn da 0,4, origine al 75 %`, async ({
    page,
    goto,
  }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await page.setViewportSize({ width: w, height: h });
    await goto("/vendi");
    await acceso(page);
    // Δt e Δb con la formula di A20 (spec §5.1), misurata come la misura PageHeroDive.
    const scatola = await geometria(page);
    const { db, dt } = diveDeltas(scatola);
    // Riscontro indipendente del riferimento delle misure: a p 0 i rettangoli veri, relativi allo schermo, danno gli
    // stessi numeri della catena di offsetTop. Tolleranza 2 px: offsetTop e offsetHeight sono interi arrotondati.
    const veri = await page.evaluate(({ sel, fondo }) => {
      const sec = document.querySelector<HTMLElement>(sel)!;
      const s = sec.querySelector<HTMLElement>(":scope > [data-corridor-screen]")!.getBoundingClientRect().top;
      const band = sec.querySelector<HTMLElement>("[data-dive-band]")!.getBoundingClientRect();
      const fondi = [...sec.querySelector<HTMLElement>("[data-dive-content]")!.querySelectorAll<HTMLElement>(fondo)].map(
        (t) => t.getBoundingClientRect().bottom - s,
      );
      return { bandTop: band.top - s, bandBottom: band.bottom - s, textBottom: Math.max(...fondi) };
    }, { sel: DIVE_SEL, fondo: DIVE_BOTTOM_SEL });
    expect(Math.abs(veri.bandTop - scatola.bandTop), `bandTop: rettangolo ${veri.bandTop}, offsetTop ${scatola.bandTop}`).toBeLessThanOrEqual(2);
    expect(Math.abs(veri.bandBottom - (scatola.bandTop + scatola.bandH)), `bandBottom: rettangolo ${veri.bandBottom}`).toBeLessThanOrEqual(2);
    expect(Math.abs(veri.textBottom - scatola.textBottom), `textBottom: rettangolo ${veri.textBottom}, offsetTop ${scatola.textBottom}`).toBeLessThanOrEqual(2);
    const colpe: string[] = [];
    for (const p of [0.2, 0.4, 0.5, 0.6, 0.7, 0.85, 1]) {
      await aProgresso(page, p);
      // Il progresso vero, dallo scrollY raggiunto: i ±2 px di scroll non diventano errore di curva.
      const reale = await progressoReale(page);
      if (p === 0.6 || p === 0.85) {
        // Geometria di spec §5.1 sui rettangoli veri: a salita finita la banda tocca il fondo dello schermo (se Δb > 0)
        // e il testo più basso, calligrafia compresa, è uscito di almeno 24 px.
        const r = await page.evaluate((fondo) => ({
          banda: document.querySelector("[data-dive-band]")!.getBoundingClientRect().bottom,
          testo: Math.max(
            ...[...document.querySelector("[data-dive-content]")!.querySelectorAll(fondo)].map((t) => t.getBoundingClientRect().bottom),
          ),
          vh: window.innerHeight,
        }), DIVE_BOTTOM_SEL);
        if (db > 0 && Math.abs(r.banda - r.vh) > 2) colpe.push(`p ${reale.toFixed(3)}: bordo basso della banda a ${r.banda.toFixed(1)} invece di ${r.vh}`);
        if (r.testo > -DIVE.textMargin + 2) colpe.push(`p ${reale.toFixed(3)}: il testo più basso finisce a ${r.testo.toFixed(1)}, non oltre −${DIVE.textMargin}`);
      }
      const salita = DT_EASE(Math.min(reale / DIVE.liftEnd, 1));
      const scalaAttesa =
        reale <= DIVE.zoomStart ? 1 : 1 + (DIVE.zoomTo - 1) * DT_IN((reale - DIVE.zoomStart) / (1 - DIVE.zoomStart));
      const contenuto = await matrixOf(page.locator("[data-dive-content]"));
      const banda = await matrixOf(page.locator("[data-dive-band]"));
      const zoom = await matrixOf(page.locator("[data-dive-zoom]"));
      const q = `p ${reale.toFixed(3)}`;
      if (Math.abs(contenuto.m42 + dt * salita) > 2) colpe.push(`${q}: contenuto a ${contenuto.m42.toFixed(1)} invece di ${(-dt * salita).toFixed(1)}`);
      if (Math.abs(banda.m42 - (dt - db) * salita) > 2) colpe.push(`${q}: banda a ${banda.m42.toFixed(1)} invece di ${((dt - db) * salita).toFixed(1)}`);
      const tolleranza = reale <= DIVE.zoomStart ? 0.001 : 0.01;
      if (Math.abs(zoom.a - scalaAttesa) > tolleranza) colpe.push(`${q}: scala ${zoom.a.toFixed(4)} invece di ${scalaAttesa.toFixed(4)}`);
    }
    const origine = await page.locator("[data-dive-zoom]").evaluate((el) => {
      const y = Number.parseFloat(getComputedStyle(el).transformOrigin.split(" ")[1] ?? "NaN");
      return { y, h: (el as HTMLElement).offsetHeight };
    });
    expect(Math.abs(origine.y - 0.75 * origine.h), `origine a ${origine.y} px su un'altezza di ${origine.h}`).toBeLessThanOrEqual(1);
    expect(colpe, colpe.join(" | ")).toEqual([]);
  });
}

for (const rotta of ["/vendi", "/domande-frequenti"] as const) {
  for (const [w, h] of [
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ] as const) {
    test(`tuffo: ${rotta} a ${w}×${h}, nessuna scritta sopra la foto in 21 quote del corridoio`, async ({
      page,
      goto,
    }, testInfo) => {
      soloIn("desktop-1440", testInfo.project.name);
      await page.setViewportSize({ width: w, height: h });
      await goto(rotta);
      await acceso(page);
      const colpe: string[] = [];
      for (let i = 0; i <= 20; i += 1) {
        const p = i / 20;
        await aProgresso(page, p);
        for (const x of await intersezioni(page)) {
          if (x.area > 0) colpe.push(`p ${p.toFixed(2)} «${x.testo}» ${Math.round(x.area)} px²`);
        }
      }
      expect(colpe, colpe.join(" | ")).toEqual([]);
    });
  }
}

/** Le nove rotte con scriptWord: tutte tranne le due legali (PageHero.tsx, «Le pagine legali non la passano»). */
const CON_FIRMA = ROTTE.filter((r) => r !== "/privacy" && r !== "/cookie");

for (const rotta of CON_FIRMA) {
  for (const [w, h] of [
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ] as const) {
    test(`tuffo: ${rotta} a ${w}×${h}, da p 0,6 la calligrafia è fuori dallo schermo e non torna sopra la foto`, async ({
      page,
      goto,
    }, testInfo) => {
      soloIn("desktop-1440", testInfo.project.name);
      await page.setViewportSize({ width: w, height: h });
      await goto(rotta);
      await acceso(page);
      await expect(page.locator("[data-dive-content] .script-word")).toHaveCount(1);
      const colpe: string[] = [];
      // Spec §5.1: il contenuto esce dall'alto prima dello zoom, calligrafia compresa (DIVE_BOTTOM_SEL); da p 0,6 la
      // parola resta sopra il bordo alto mentre la foto cresce con l'origine al 75 %.
      for (const p of [DIVE.liftEnd, 0.8, 1]) {
        await aProgresso(page, p);
        const fondo = await page.evaluate(() => document.querySelector("[data-dive-content] .script-word")!.getBoundingClientRect().bottom);
        if (fondo > 0.5) colpe.push(`p ${p}: il fondo della calligrafia sta a ${fondo.toFixed(1)} px, dentro lo schermo`);
      }
      expect(colpe, colpe.join(" | ")).toEqual([]);
    });
  }
}

for (const [w, h] of [
  [1024, 768],
  [1440, 900],
] as const) {
  test(`tuffo: /vendi a ${w}×${h}, la scatola che scala porta data-bg="foto" e a fine corsa copre lo schermo`, async ({
    page,
    goto,
  }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await page.setViewportSize({ width: w, height: h });
    await goto("/vendi");
    await acceso(page);
    await aProgresso(page, 1);
    const r = await page.locator("[data-dive-zoom]").evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { bg: el.getAttribute("data-bg"), top: b.top, left: b.left, right: b.right, bottom: b.bottom, vw: window.innerWidth, vh: window.innerHeight };
    });
    expect(r.bg).toBe("foto");
    expect(r.top).toBeLessThanOrEqual(0);
    expect(r.left).toBeLessThanOrEqual(0);
    expect(r.right).toBeGreaterThanOrEqual(r.vw);
    expect(r.bottom).toBeGreaterThanOrEqual(r.vh);
  });

  test(`tuffo: /vendi a ${w}×${h}, a p 0,8 la scatola con data-bg="foto" ha il bordo alto della formula${w === 1440 ? " e copre il centro del segno" : ""}`, async ({
    page,
    goto,
  }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await page.setViewportSize({ width: w, height: h });
    await goto("/vendi");
    await acceso(page);
    const scatola = await geometria(page);
    const { db } = diveDeltas(scatola);
    await aProgresso(page, 0.8);
    const reale = await progressoReale(page);
    const scala = 1 + (DIVE.zoomTo - 1) * DT_IN((reale - DIVE.zoomStart) / (1 - DIVE.zoomStart));
    // A salita finita il bordo alto della banda sta a bandTop − Δb; lo zoom con origine al 75 % lo alza di 0,75 · bandH · (s − 1).
    const atteso = scatola.bandTop - db - 0.75 * scatola.bandH * (scala - 1);
    const r = await page.locator("[data-dive-zoom]").evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { bg: el.getAttribute("data-bg"), top: b.top, left: b.left, right: b.right, bottom: b.bottom };
    });
    const asse = await asseDelSegno(page);
    testInfo.annotations.push({
      type: "p 0,8",
      description: `${w}×${h}: bordo alto ${r.top.toFixed(1)} px, formula ${atteso.toFixed(1)} px, centro del segno a y ${asse.y.toFixed(1)} px`,
    });
    expect(r.bg).toBe("foto");
    expect(Math.abs(r.top - atteso), `a p ${reale.toFixed(3)} il bordo alto sta a ${r.top.toFixed(1)} px invece di ${atteso.toFixed(1)}`).toBeLessThanOrEqual(3);
    if (w === 1440) {
      // Spec §5.1 e §6.1 (D34): a p 0,8 il centro del segno cade sulla foto, tema foto. A 1024×768 la stessa timeline
      // lascia il bordo a ≈ +108 px, sotto il centro del segno: lì il tema resta grafite e il test non lo pretende.
      const sopra = r.left <= asse.x && r.right >= asse.x && r.top <= asse.y && r.bottom >= asse.y;
      expect(sopra, `a 1440×900 il centro del segno (${asse.x.toFixed(1)}, ${asse.y.toFixed(1)}) non sta sulla foto`).toBe(true);
    }
  });
}

for (const rotta of ["/vendi", "/domande-frequenti"] as const) {
  test(`tuffo: ${rotta} a 1440×900, a p 0 e 0,5 lo schermo è sticky e ritagliato con clip, nessun antenato trasformato o ritagliato`, async ({
    page,
    goto,
  }, testInfo) => {
    // Spec §4 e §9.2 (corridors.spec prova gli antenati solo sulla home): nessun transform e nessun
    // overflow che crei un contenitore fra lo schermo sticky e <html>.
    soloIn("desktop-1440", testInfo.project.name);
    await goto(rotta);
    await acceso(page);
    for (const p of [0, 0.5]) {
      await aProgresso(page, p);
      const colpe = await page.evaluate((sel) => {
        const out: string[] = [];
        const screen = document.querySelector<HTMLElement>(`${sel} > [data-corridor-screen]`)!;
        const cs = getComputedStyle(screen);
        if (cs.position !== "sticky") out.push(`schermo con position ${cs.position}`);
        if (cs.overflowX !== "clip" || cs.overflowY !== "clip") out.push(`schermo con overflow ${cs.overflowX}/${cs.overflowY}`);
        if (cs.transform !== "none") out.push(`schermo con transform ${cs.transform}`);
        for (let n = screen.parentElement; n; n = n.parentElement) {
          const a = getComputedStyle(n);
          const nome = `${n.tagName.toLowerCase()}${n.id ? `#${n.id}` : ""}${n.dataset.corridor ? `[data-corridor=${n.dataset.corridor}]` : ""}`;
          if (a.transform !== "none") out.push(`transform su ${nome}`);
          if (/hidden|auto|scroll/.test(`${a.overflowX} ${a.overflowY}`)) out.push(`overflow ${a.overflowX}/${a.overflowY} su ${nome}`);
        }
        return out;
      }, DIVE_SEL);
      expect(colpe, `${rotta} p ${p}: ${colpe.join(" | ")}`).toEqual([]);
    }
  });
}

for (const [w, h] of [
  [1280, 720],
  [1440, 900],
] as const) {
  test(`tuffo: /vendi a ${w}×${h}, Tab fino alla CTA uscita la riporta nel viewport`, async ({ page, goto }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await page.setViewportSize({ width: w, height: h });
    await goto("/vendi");
    await acceso(page);
    // Partenza della tabulazione: l'occhiello, che precede la CTA nell'ordine del documento e non è focalizzabile.
    // Un fuoco da script con preventScroll non porta la pagina da nessuna parte; la rete di tastiera del hook di A19
    // parte solo su :focus-visible, cioè col Tab vero.
    await page.locator("[data-dive-content] .eyebrow").first().evaluate((el) => {
      el.setAttribute("tabindex", "-1");
      (el as HTMLElement).focus({ preventScroll: true });
    });
    // A 0,6 il contenuto ha finito la salita: la CTA sta sopra il bordo alto.
    await aProgresso(page, DIVE.liftEnd);
    const cta = page.locator('[data-dive-content] a[href="#contatti"]').first();
    expect(
      await cta.evaluate((el) => el.getBoundingClientRect().bottom <= 0),
      "a fine salita la CTA dovrebbe essere già sopra il bordo alto",
    ).toBe(true);
    const suCta = () => cta.evaluate((el) => el === document.activeElement);
    for (let i = 0; i < 8 && !(await suCta()); i += 1) {
      await page.keyboard.press("Tab");
    }
    expect(await suCta(), "otto Tab dall'occhiello non arrivano alla CTA").toBe(true);
    // Un pixel di tolleranza sui due bordi: il fuoco di default del hook (A19, useCorridor) cerca per
    // bisezione il progresso in cui l'elemento sta nel viewport, quindi converge sul progresso limite e
    // lascia la CTA a filo del bordo alto — misurata, a 1280×720 sta a −0,4 px e a 1440×900 a +0,4 px,
    // con 59 dei suoi 60 px dentro. Il test chiede che la CTA sia tornata visibile, non che sia staccata
    // dal bordo di un pixel intero.
    await expect
      .poll(
        () =>
          cta.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return r.top >= -1 && r.bottom <= window.innerHeight + 1;
          }),
        { timeout: 2_000 },
      )
      .toBe(true);
  });
}

test("tuffo: /vendi#contatti a 1440, il bersaglio resta fermo nel viewport mentre il corridoio si accende e il CLS resta 0", async ({
  page,
  goto,
}, testInfo) => {
  // D22 (lane-globali.md §1.6): il layout del corridoio sta in CSS prima del paint, quindi accendere data-on non
  // sposta né la pagina né lo scroll. Si campiona a ogni fotogramma da DOMContentLoaded per 8 s la top del bersaglio
  // nel viewport, lo scrollY e lo stato del corridoio.
  soloIn("desktop-1440", testInfo.project.name);
  await page.addInitScript(() => {
    type Campione = { t: number; top: number; y: number; on: boolean };
    const w = window as unknown as { __cls: number; __ancora: Campione[] };
    w.__cls = 0;
    w.__ancora = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!e.hadRecentInput) w.__cls += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    document.addEventListener("DOMContentLoaded", () => {
      const t0 = performance.now();
      const giro = () => {
        const bersaglio = document.getElementById("contatti");
        if (bersaglio) {
          w.__ancora.push({
            t: Math.round(performance.now() - t0),
            top: bersaglio.getBoundingClientRect().top,
            y: window.scrollY,
            on: document.querySelector('[data-corridor="page-dive"][data-on]') !== null,
          });
        }
        if (performance.now() - t0 < 8_000) requestAnimationFrame(giro);
      };
      requestAnimationFrame(giro);
    });
  });
  await goto("/vendi#contatti");
  await acceso(page);
  await page.waitForTimeout(2_500);
  const { campioni, cls } = await page.evaluate(() => {
    const w = window as unknown as { __cls: number; __ancora: Array<{ t: number; top: number; y: number; on: boolean }> };
    return { campioni: w.__ancora, cls: w.__cls };
  });
  const conAncora = campioni.filter((c) => c.y > 0);
  const primaDellAccensione = conAncora.filter((c) => !c.on);
  const dopoLAccensione = conAncora.filter((c) => c.on);
  expect(dopoLAccensione.length, "nessun campione con l'ancora applicata e il corridoio acceso").toBeGreaterThan(10);
  // Riferimento: l'ultimo fotogramma con l'ancora applicata prima di data-on; se l'ancora arriva dopo, il primo con data-on.
  const riferimento = primaDellAccensione.at(-1) ?? dopoLAccensione[0];
  // 1. Il layout. Si confronta la quota del bersaglio NEL DOCUMENTO (top nel viewport + scrollY), non la
  // sua top nel viewport: su questa rotta l'arrivo al frammento è ancora in corsa quando il corridoio si
  // accende — `scroll-behavior: smooth` in globals.css e Lenis con `anchors: true` in SmoothScroll.tsx —
  // quindi la top cambia di suo mentre la pagina scorre. Ciò che D22 vieta è che accendere `data-on`
  // sposti il documento sotto i piedi: la quota deve restare ferma, e con lei il CLS a 0.
  const quota = (c: { top: number; y: number }) => c.top + c.y;
  const scarti = dopoLAccensione.filter((c) => Math.abs(quota(c) - quota(riferimento)) > 2);
  expect(
    scarti.slice(0, 5).map((c) => `${c.t} ms: quota ${quota(c).toFixed(1)} (top ${c.top.toFixed(1)}, scrollY ${c.y})`),
    `riferimento a ${riferimento.t} ms: quota ${quota(riferimento).toFixed(1)}`,
  ).toEqual([]);
  // 2. Lo scroll. La quota ferma non basta: se il corridoio spostasse lo scroll, top calerebbe di quanto
  // scrollY cresce e la somma non se ne accorgerebbe. L'arrivo liscio muove lo scroll e si tollera, la
  // compensazione del hook no, perché D22 non la prevede. Misurato sul build a 1440×900, l'arrivo è
  // un'andatura sola: va sempre in avanti e cambia passo poco per volta, e prima di data-on (≈ 200 ms)
  // si vedono due o tre passi soli, da 0,9 a 6 px/ms, contro una punta di 43 px/ms più avanti — un tetto
  // preso di lì sarebbe rosso per costruzione, quindi il passo si giudica sui suoi vicini.
  const passi = dopoLAccensione.slice(1).map((c, i) => {
    const d = c.y - dopoLAccensione[i].y;
    return { t: c.t, d, v: d / Math.max(1, c.t - dopoLAccensione[i].t) };
  });
  const vicini = (i: number) => Math.max(passi[i - 1]?.v ?? 0, passi[i + 1]?.v ?? 0, 0);
  testInfo.annotations.push({
    type: "ancora",
    description: `${primaDellAccensione.length ? "prima di data-on" : "dopo data-on"}: ${riferimento.t} ms, quota nel documento ${quota(riferimento).toFixed(1)}, top ${riferimento.top.toFixed(1)}, scrollY ${riferimento.y}; dopo data-on ${passi.length} passi, punta ${Math.max(0, ...passi.map((p) => p.v)).toFixed(1)} px/ms, scrollY finale ${dopoLAccensione.at(-1)?.y}`,
  });
  // 2a. Mai all'indietro: un ritorno dello scroll è la firma di una compensazione, e in tre giri di misura
  // non c'è un solo passo negativo (il pixel di tolleranza è per il sotto-pixel).
  const indietro = passi.filter((p) => p.d < -1);
  expect(
    indietro.slice(0, 5).map((p) => `${p.t} ms: ${p.d.toFixed(1)} px`),
    "dopo data-on lo scrollY torna indietro",
  ).toEqual([]);
  // 2b. Mai uno strappo in avanti: nessun fotogramma corre più di cinque volte i suoi vicini, più 2 px/ms
  // di fermo. Il fotogramma peggiore dell'arrivo — quello in cui il thread si libera dopo l'idratazione —
  // misura 27 px/ms contro vicini a 13, cioè poco più del doppio; a pagina arrivata i vicini valgono 0 e
  // il tetto è il solo fermo, così uno strappo di qualche decina di px dopo l'arrivo resta visibile.
  const strappi = passi.map((p, i) => ({ ...p, tetto: 5 * vicini(i) + 2 })).filter((p) => p.v > p.tetto);
  expect(
    strappi.slice(0, 5).map((p) => `${p.t} ms: +${p.d.toFixed(1)} px (${p.v.toFixed(1)} px/ms, tetto ${p.tetto.toFixed(1)})`),
    "un fotogramma dello scroll fuori dall'andatura dell'arrivo",
  ).toEqual([]);
  expect(Number(cls.toFixed(4))).toBe(0);
});

test("tuffo: /vendi a 1440, ricaricando a metà corridoio lo scroll torna entro ±2 px", async ({ page, goto }, testInfo) => {
  // D22: alla ricarica lo scroll torna al capitolo (ripristino di Preloader.tsx con restoreTarget, attivo con
  // MQ.corridor); lane-globali.md:785 chiede ±2 px su /vendi a 1440.
  soloIn("desktop-1440", testInfo.project.name);
  await goto("/vendi");
  await acceso(page);
  await aProgresso(page, 0.5);
  const prima = await page.evaluate(() => Math.round(window.scrollY));
  await page.reload({ waitUntil: "domcontentloaded" });
  await acceso(page);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 5_000 }).toBeGreaterThan(0);
  await page.waitForTimeout(1_500);
  const dopo = await page.evaluate(() => Math.round(window.scrollY));
  expect(Math.abs(dopo - prima), `scrollY prima ${prima}, dopo la ricarica ${dopo}`).toBeLessThanOrEqual(2);
});

for (const [w, h, scala, progetto] of [
  [390, 664, DIVE.phoneScale, "mobile-390"],
  [768, 1024, DIVE.tabletScale, "mobile-390"],
  [1440, 600, DIVE.tabletScale, "desktop-1440"],
] as const) {
  test(`tuffo: /vendi a ${w}×${h}, niente sticky e la foto cresce fino a ${scala} dentro la cornice`, async ({
    page,
    goto,
  }, testInfo) => {
    // 1440×600 è sotto MQ.corridor per l'altezza (D22): MQ.desktop è vero e la scala arriva a 1,08 (D37).
    soloIn(progetto, testInfo.project.name);
    await page.setViewportSize({ width: w, height: h });
    await goto("/vendi");
    const dive = page.locator(DIVE_SEL);
    // Prima il conteggio: senza la section la fase rossa cade qui, non al timeout di getAttribute.
    await expect(dive).toHaveCount(1);
    await page.waitForTimeout(1_000);
    expect(await dive.getAttribute("data-on")).toBeNull();
    await expect(page.locator(`${DIVE_SEL} > [data-corridor-screen]`)).not.toHaveCSS("position", "sticky");
    await expect(page.locator(`${DIVE_SEL} > [data-corridor-run]`)).toHaveCSS("display", "none");
    expect(identita(await matrixOf(page.locator("[data-dive-inner]")))).toBe(true);
    const fineBanda = await page.locator("[data-dive-band]").evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
    await page.evaluate((y) => window.scrollTo({ top: y + 40, behavior: "instant" }), fineBanda);
    await page.waitForTimeout(400);
    const inner = await matrixOf(page.locator("[data-dive-inner]"));
    expect(inner.a).toBeCloseTo(scala, 2);
    expect(inner.a).toBeLessThanOrEqual(scala + 0.001);
    expect(identita(await matrixOf(page.locator("[data-dive-zoom]"))), "sotto soglia la scatola non scala").toBe(true);
    await expect(page.locator("img[data-dive-sharp]")).toHaveCount(0);
  });
}

for (const rotta of ROTTE) {
  test(`tuffo: ${rotta} a 1440, l'H1 ha per nome il suo testo e la banda un alt nelle 5 lingue`, async ({
    page,
    goto,
  }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    for (const lingua of LINGUE) {
      await inLingua(page, lingua);
      await goto(rotta);
      await attendiLingua(page, lingua);
      const h1 = page.locator(`${DIVE_SEL} h1`);
      await expect(h1).toHaveCount(1);
      // Gli h1 sono in maiuscolo (globals.css:310-315, rivista bianca): innerText è trasformato, aria-label no, e la ß
      // tedesca diventa SS. Si confrontano normalizzati, come il test degli H1 delle 11 PageHero in text-motion.spec.ts.
      const norm = (s: string) => s.replace(/ß/g, "ss").toLocaleLowerCase(lingua).replace(/\s+/g, " ").trim();
      await expect.poll(async () => ((await h1.getAttribute("aria-label")) ?? "").trim().length, { timeout: 10_000 }).toBeGreaterThan(3);
      const nome = (await h1.getAttribute("aria-label")) ?? "";
      const letto = await h1.evaluate((el) => (el as HTMLElement).innerText);
      expect(norm(letto), `${rotta} ${lingua}: il testo letto non è il nome`).toBe(norm(nome));
      await expect(h1, `${rotta} ${lingua}`).toHaveAccessibleName(nome);
      const alt = (await page.locator("img[data-dive-base]").getAttribute("alt")) ?? "";
      expect(alt.length, `${rotta} ${lingua}: alt della banda troppo corto`).toBeGreaterThanOrEqual(10);
    }
  });
}

for (const rotta of ROTTE) {
  test(`tuffo: ${rotta}, i testi della testa stanno nello schermo a 1024×768 e 1440×900, in it e de`, async ({
    page,
    goto,
  }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    for (const [w, h, lingua] of [
      [1024, 768, "it"],
      [1024, 768, "de"],
      [1440, 900, "it"],
      [1440, 900, "de"],
    ] as const) {
      await page.setViewportSize({ width: w, height: h });
      await inLingua(page, lingua);
      await goto(rotta);
      await attendiLingua(page, lingua);
      await acceso(page);
      await page.waitForTimeout(300);
      const eccesso = await page.evaluate((sel) => {
        const screen = document.querySelector<HTMLElement>(`${sel} > [data-corridor-screen]`)!;
        const top = screen.getBoundingClientRect().top;
        const fondo = Math.max(...[...screen.querySelectorAll<HTMLElement>("[data-dive-text]")].map((t) => t.getBoundingClientRect().bottom - top));
        return fondo - screen.clientHeight;
      }, DIVE_SEL);
      expect(eccesso, `${rotta} ${w}×${h} ${lingua}: il testo esce dallo schermo di ${eccesso} px`).toBeLessThanOrEqual(1);
    }
  });
}

test("tuffo: /domande-frequenti a 1440 e DPR 1, sorgente da 1920 px e nessuno strato nitido (D33)", async ({ page, goto }, testInfo) => {
  soloIn("desktop-1440", testInfo.project.name);
  await goto("/domande-frequenti");
  await acceso(page);
  await page.waitForTimeout(DIVE.sharpIdleMs + 1_500);
  await expect(page.locator("img[data-dive-sharp]")).toHaveCount(0);
});

const BANDE_1 = [
  { rotta: "/vendi", file: "villa-piscina-facciata.jpg", pos: "50% 55%" },
  { rotta: "/acquista", file: "villa-lettini.jpg", pos: "50% 50%" },
  { rotta: "/servizi", file: "villa-angolo-piscina.jpg", pos: "50% 60%" },
  { rotta: "/open-domus", file: "villa-portico-tenda.jpg", pos: "50% 60%" },
] as const;

for (const b of BANDE_1) {
  test(`bande1: ${b.rotta} a 1440, la banda è ${b.file} con object-position ${b.pos}`, async ({ page, goto }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await goto(b.rotta);
    const img = page.locator("img[data-dive-base]");
    await expect
      .poll(() => img.evaluate((el) => decodeURIComponent((el as HTMLImageElement).currentSrc)), { timeout: 15_000 })
      .toContain(`/images/reali/${b.file}`);
    await expect(img).toHaveCSS("object-position", b.pos);
  });
}

test("bande1: /vendi a 1440 e DPR 1, lo strato nitido arriva dopo l'LCP, si accende sopra 0,4 e si spegne sotto", async ({
  page,
  goto,
}, testInfo) => {
  soloIn("desktop-1440", testInfo.project.name);
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: string[] };
    w.__lcp = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as unknown as Array<{ url: string }>) w.__lcp.push(e.url);
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await goto("/vendi");
  await acceso(page);
  const sharp = page.locator("img[data-dive-sharp]");
  await expect(sharp).toHaveCount(1, { timeout: DIVE.sharpIdleMs + 5_000 });
  await expect(sharp).toHaveAttribute("data-ready", "1", { timeout: 30_000 });
  expect(await sharp.evaluate((el) => (el as HTMLElement).style.opacity)).toBe("0");
  const lcp = await page.evaluate(() => (window as unknown as { __lcp: string[] }).__lcp.at(-1) ?? "");
  const base = await page.locator("img[data-dive-base]").evaluate((el) => (el as HTMLImageElement).currentSrc);
  expect(lcp, "l'LCP non è la foto base").toBe(base);
  await aProgresso(page, 0.6);
  await expect.poll(() => sharp.evaluate((el) => (el as HTMLElement).style.opacity)).toBe("1");
  await aProgresso(page, 0.2);
  await expect.poll(() => sharp.evaluate((el) => (el as HTMLElement).style.opacity)).toBe("0");
});

test("bande1: /servizi a 1440, dopo il tuffo lo zoom di Services va da 1,15 a 1", async ({ page, goto }, testInfo) => {
  // Spec §5.3 e §3.12: su /servizi Services scala subito dopo il tuffo, due scale di verso opposto in fila. Le quote
  // vengono dalla scatola, così il test prova che i trigger di Services si sono misurati con la pagina già allungata.
  soloIn("desktop-1440", testInfo.project.name);
  await goto("/servizi");
  await acceso(page);
  const scatola = page.locator("#servizi [data-zoom-box]").first();
  const zoom = scatola.locator(":scope > [data-zoom]");
  const quote = await scatola.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, vh: window.innerHeight };
  });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(quote.top - quote.vh + 2));
  await page.waitForTimeout(1_500);
  const inizio = (await matrixOf(zoom)).a;
  expect(inizio, `con la scatola appena entrata la scala è ${inizio.toFixed(4)}`).toBeGreaterThan(1.14);
  expect(inizio).toBeLessThanOrEqual(1.1501);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(quote.bottom - quote.vh));
  await expect.poll(async () => Math.abs((await matrixOf(zoom)).a - 1), { timeout: 4_000 }).toBeLessThanOrEqual(0.01);
});

test.describe("strato nitido a DPR 2", () => {
  test.use({ deviceScaleFactor: 2 });

  test("bande1: /vendi a 1440 e DPR 2, lo strato nitido non si monta (D33)", async ({ page, goto }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await goto("/vendi");
    await acceso(page);
    await page.waitForTimeout(DIVE.sharpIdleMs + 1_500);
    await expect(page.locator("img[data-dive-sharp]")).toHaveCount(0);
  });
});

const POSIZIONI = JSON.parse(readFileSync(join(process.cwd(), "app/lib/motion/band-positions.json"), "utf8")) as Record<string, string>;
/** Le bande del gruppo 2, come percorso sotto public/images/. `misurata` distingue i tre fermi 16:9 del video
    tour, che leggono band-positions.json, da /privacy: il suo fermo non esiste e nessuna foto della villa è
    libera, quindi la rotta tiene la foto di oggi e il centro di default (D63 del coordinatore, 18 set. 2026). */
const FERMI = [
  { rotta: "/metodo", file: "reali/villa-vetrata-lanterne.jpg", misurata: true },
  { rotta: "/recensioni", file: "reali/villa-salotto-ombrellone.jpg", misurata: true },
  { rotta: "/privacy", file: "hero_01_attico_travi_salotto.jpg", misurata: false },
  { rotta: "/cookie", file: "reali/villa-uliveto.jpg", misurata: true },
] as const;

for (const f of FERMI) {
  test(`bande2: ${f.rotta} a 1440, il fermo della villa con l'object-position misurato`, async ({ page, goto }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    const presente = existsSync(join(process.cwd(), "public/images", f.file));
    await goto(f.rotta);
    const img = page.locator("img[data-dive-base]");
    const src = () => img.evaluate((el) => decodeURIComponent((el as HTMLImageElement).currentSrc));
    if (!presente) {
      expect(f.rotta, "solo /cookie può restare senza fermo").toBe("/cookie");
      await expect.poll(src, { timeout: 15_000 }).toContain("/images/hero_01_attico_travi_salotto.jpg");
      return;
    }
    await expect.poll(src, { timeout: 15_000 }).toContain(`/images/${f.file}`);
    await expect(img).toHaveCSS("object-position", f.misurata ? POSIZIONI[f.rotta] : "50% 50%");
  });
}

test("bande2: /metodo a 390, il ritaglio 4:5 del telefono segue band-positions.json", async ({ page, goto }, testInfo) => {
  soloIn("mobile-390", testInfo.project.name);
  await goto("/metodo");
  await expect(page.locator("img[data-dive-base]")).toHaveCSS("object-position", POSIZIONI["/metodo"]);
});

// Gruppo 3 (spec §7.4): /chi-siamo, /lavora-con-noi e /domande-frequenti tengono la foto di oggi, larga
// 1920 px, quindi niente strato nitido (D33). Qui si guardano i due vicini del tuffo su queste rotte:
// l'indice sticky delle FAQ e la rotaia del team, e il ritaglio dello schermo a fine corsa.
test("bande3: /domande-frequenti a 1440, dopo il tuffo l'indice resta appiccicato e senza antenati trasformati", async ({
  page,
  goto,
}, testInfo) => {
  soloIn("desktop-1440", testInfo.project.name);
  await goto("/domande-frequenti");
  await acceso(page);
  const nav = page.locator('#main nav[class*="lg:sticky"]').first();
  await expect(nav).toHaveCount(1);
  const y0 = await nav.evaluate((el) => el.parentElement!.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y + 200, behavior: "instant" }), y0);
  await page.waitForTimeout(300);
  const t1 = await nav.evaluate((el) => el.getBoundingClientRect().top);
  await page.evaluate((y) => window.scrollTo({ top: y + 700, behavior: "instant" }), y0);
  await page.waitForTimeout(300);
  const t2 = await nav.evaluate((el) => el.getBoundingClientRect().top);
  expect(Math.abs(t2 - t1), "l'indice non resta fermo: lo sticky si è rotto").toBeLessThanOrEqual(1);
  const trasformati = await nav.evaluate((el) => {
    const out: string[] = [];
    for (let n = el.parentElement; n; n = n.parentElement) {
      if (getComputedStyle(n).transform !== "none") out.push(`${n.tagName}.${n.className}`);
    }
    return out;
  });
  expect(trasformati).toEqual([]);
});

test("bande3: /chi-siamo a 1440, il tuffo e la rotaia del team convivono", async ({ page, goto }, testInfo) => {
  soloIn("desktop-1440", testInfo.project.name);
  await goto("/chi-siamo");
  await acceso(page);
  // Due host accesi: il tuffo e la rotaia del team, che porta data-corridor="team" (A19, spec §5.3).
  await expect.poll(() => hostsOn(page), { timeout: 10_000 }).toEqual(["page-dive", "team"]);
  await expect(page.locator('[data-corridor="page-dive"][data-on]')).toHaveCount(1);
  await expect(page.locator(".dt-railway[data-on]")).toHaveCount(1, { timeout: 10_000 });
  await page.locator(".dt-railway").evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollTo({ top: r.top + window.scrollY + (el as HTMLElement).offsetHeight / 2, behavior: "instant" });
  });
  await page.waitForTimeout(1_200);
  const track = await matrixOf(page.locator(".dt-railway .dt-rail_track").first());
  expect(Math.abs(track.m41), "a metà del suo corridoio il nastro del team non si è mosso").toBeGreaterThan(10);
});

for (const rotta of ["/lavora-con-noi", "/domande-frequenti", "/chi-siamo"] as const) {
  test(`bande3: ${rotta} a 1440, a fine tuffo la foto a scala 2 resta dentro lo schermo e nessuno strato nitido`, async ({
    page,
    goto,
  }, testInfo) => {
    soloIn("desktop-1440", testInfo.project.name);
    await goto(rotta);
    await acceso(page);
    await aProgresso(page, 1);
    await page.waitForTimeout(DIVE.sharpIdleMs + 1_000);
    await expect(page.locator("img[data-dive-sharp]")).toHaveCount(0);
    // html e body hanno già overflow-x: clip, quindi scrollWidth non vede la foto che esce. Il ritaglio
    // che conta è quello dello schermo sticky (spec §5.1: height 100svh, overflow clip).
    await expect(page.locator(`${DIVE_SEL} > [data-corridor-screen]`)).toHaveCSS("overflow", "clip");
    // 40 px oltre la fine del corridoio lo schermo si stacca dal bordo alto e il suo fondo sale nel viewport: 20 px
    // sotto quel fondo la foto a scala 2, con origine al 75 %, sporgerebbe di un quarto della sua altezza.
    const fine = await page.evaluate((sel) => {
      const s = document.querySelector<HTMLElement>(sel)!;
      return s.getBoundingClientRect().bottom + window.scrollY - window.innerHeight;
    }, DIVE_SEL);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(fine + 40));
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    await page.waitForTimeout(100);
    const sotto = await page.evaluate((sel) => {
      const screen = document.querySelector<HTMLElement>(`${sel} > [data-corridor-screen]`)!;
      const zoom = document.querySelector<HTMLElement>("[data-dive-zoom]")!;
      const y = screen.getBoundingClientRect().bottom + 20;
      const colpito = document.elementFromPoint(window.innerWidth / 2, y);
      const t = getComputedStyle(zoom).transform;
      return {
        y,
        vh: window.innerHeight,
        scala: t === "none" ? 1 : new DOMMatrixReadOnly(t).a,
        sullaFoto: colpito !== null && zoom.contains(colpito),
        cosa: colpito ? `${colpito.tagName.toLowerCase()}${colpito.id ? `#${colpito.id}` : ""}` : "niente",
      };
    }, DIVE_SEL);
    expect(sotto.y, "il punto 20 px sotto lo schermo è fuori dal viewport").toBeLessThan(sotto.vh);
    expect(sotto.scala, "oltre la fine del corridoio la foto resta a scala 2").toBeCloseTo(DIVE.zoomTo, 2);
    expect(sotto.sullaFoto, `${rotta}: 20 px sotto lo schermo c'è la foto (${sotto.cosa}), il ritaglio non tiene`).toBe(false);
  });
}
