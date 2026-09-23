import type { Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { CHIUSURA, HERO, RAFFAELA, RESPIRO_SVH, hwDi, salitaRiposo } from "../app/lib/motion/hero";
import foto from "../app/lib/motion/hero.json";

// L'HERO ALTO della home (A49 e A71 di Alberto, 22 settembre 2026): la foto alta col cielo trasparente
// in flusso come le teste di era, senza corridoio, tuffo, zoom né lift; da lg il blocco bianco sulla
// banda scura (il portico a destra di Raffaela) e il lockup sull'acqua, la chiusura in cartolina
// all'uscita; sul telefono la striscia 9:16, il lockup sull'acqua e il blocco dopo la foto. I numeri
// stanno in app/lib/motion/hero.ts e hero.json. Sostituisce hero-dive.spec.ts (il tuffo è morto).
// Motion attivo (default della suite); il sipario lo salta `goto`.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

const INCHIOSTRO = "rgb(70, 66, 61)";
const BIANCO = "rgb(255, 255, 255)";

async function scrollaA(page: Page, y: number) {
  await page.evaluate(async (t) => {
    window.scrollTo({ top: Math.max(0, t), behavior: "instant" as ScrollBehavior });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
  await page.waitForTimeout(150);
}

/** La geometria dell'hero in coordinate di pagina, più i colori e gli stili che contano. */
async function geometria(page: Page) {
  return page.evaluate(() => {
    const y = window.scrollY;
    const r = (el: Element | null) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: b.top + y, bottom: b.bottom + y, left: b.left, right: b.right, width: b.width, height: b.height };
    };
    const top = document.querySelector<HTMLElement>("#top")!;
    const strato = top.querySelector<HTMLElement>("[data-testa-strato]")!;
    const box = top.querySelector<HTMLElement>("[data-testa-foto-box]")!;
    const img = box.querySelector("img")!;
    const h1 = top.querySelector<HTMLElement>("h1")!;
    return {
      headBottom: document.querySelector<HTMLElement>("header")!.getBoundingClientRect().bottom + y,
      sezione: r(top)!,
      strato: r(strato)!,
      box: r(box)!,
      sopra: r(top.querySelector(".dt-testa_sopra"))!,
      marca: r(top.querySelector("[data-hero-lockup]"))!,
      lockup: r(top.querySelector("[data-hero-lockup] > div"))!,
      firma: r(top.querySelector("[data-hero-script]"))!,
      blocco: r(top.querySelector("[data-hero-block]"))!,
      h1: r(h1)!,
      src: decodeURIComponent(img.currentSrc),
      h1Color: getComputedStyle(h1).color,
      boxClip: getComputedStyle(box).clipPath,
      boxTransform: getComputedStyle(box).transform,
      stratoTransform: getComputedStyle(strato).transform,
      on: top.hasAttribute("data-on"),
      corridoio: top.querySelectorAll("[data-corridor-screen], [data-corridor-run], [data-hero-zoom]").length,
      sticky: Array.from(top.querySelectorAll<HTMLElement>("*")).filter((el) => getComputedStyle(el).position === "sticky").length,
      vw: window.innerWidth,
      vh: window.innerHeight,
      docW: document.documentElement.clientWidth,
    };
  });
}

/** I numeri di un `inset(a% b%)` serializzato da Chrome (vuoto per `none`). */
const insetValues = (v: string) => (v.match(/[\d.]+(?=%)/g) ?? []).map(Number);

/** L'idratazione è finita (a28.spec): il chunk di gsap.ts è eseguito e, con motion ok, Lenis è montato. */
async function idratata(page: Page) {
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __dtST?: unknown }).__dtST === "function" &&
      (!matchMedia("(prefers-reduced-motion: no-preference)").matches || document.documentElement.classList.contains("lenis")),
    undefined,
    { timeout: 15_000 },
  );
}

test.describe("l'hero alto da 1024 px con motion ok (A49)", () => {
  test.skip(({ isMobile }) => !!isMobile, "il blocco sulla foto vive da lg");

  for (const vp of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`${vp.width}×${vp.height}: la foto alta intera in flusso sotto la testata, la salita a riposo, il blocco bianco a destra e il lockup sull'acqua (D-A49-1..3)`, async ({ page, goto }) => {
      await page.setViewportSize(vp);
      await goto("/");
      await expect
        .poll(() => page.evaluate(() => decodeURIComponent(document.querySelector<HTMLImageElement>("#top [data-testa-foto-box] img")?.currentSrc ?? "")), { timeout: 10_000, message: "la foto montata non è il WebP alto col cielo" })
        .toMatch(/hero-raffaela-piscina-alta-cielo\.webp/);
      const g = await geometria(page);
      expect(g.on, "l'hero è ancora un corridoio").toBe(false);
      expect(g.corridoio, "resta un pezzo del tuffo (schermo, spaziatore o zoom)").toBe(0);
      expect(g.sticky, "uno sticky dentro l'hero (A45: la foto scorre con la pagina)").toBe(0);
      // La scatola: larga tutto, alta quanto la foto resa (2:3), nessuna trasformata né ritaglio a riposo.
      const H = g.docW * hwDi(foto.sorgente);
      expect(Math.abs(g.box.width - g.docW)).toBeLessThanOrEqual(1);
      expect(Math.abs(g.box.height - H), "la scatola non ha il rapporto della foto").toBeLessThanOrEqual(2);
      expect(g.boxTransform).toBe("none");
      expect(g.stratoTransform).toBe("none");
      expect(g.boxClip).toBe("none");
      // La salita a riposo (D-A75-1): lo strato sale finché Raffaela è intera nel primo schermo, le suole a
      // 6svh dal fondo; la sezione resta sotto la testata e il riquadro ritaglia lì la foto (D-A75-2).
      const respiro = (RESPIRO_SVH / 100) * g.vh;
      const salita = salitaRiposo({ testo: HERO.testo, piedi: RAFFAELA.piedi, fotoH: H, band: g.vh - g.headBottom, respiro });
      expect(Math.abs(g.headBottom - g.strato.top - salita), `la salita a riposo non è ${salita.toFixed(1)} px`).toBeLessThanOrEqual(2);
      expect(Math.abs(g.sezione.top - g.headBottom), "la sezione non comincia sotto la testata (flow-root)").toBeLessThanOrEqual(1);
      expect(g.strato.top + RAFFAELA.testa * H, "la testa di Raffaela è sopra la testata").toBeGreaterThanOrEqual(g.headBottom);
      expect(Math.abs(g.strato.top + RAFFAELA.piedi * H - (g.vh - respiro)), "le suole di Raffaela non stanno a 6svh dal fondo").toBeLessThanOrEqual(2);
      // Il blocco comincia alla cima del portico (`testo`), sotto la testata.
      expect(Math.abs(g.blocco.top - (g.strato.top + HERO.testo * H)), "il blocco non comincia a `testo`").toBeLessThanOrEqual(3);
      expect(g.blocco.top, "il blocco passa sotto la testata").toBeGreaterThanOrEqual(g.headBottom);
      // A destra di Raffaela (x ≥ 58 %), bianco, allineato a sinistra dentro la riga.
      expect(g.blocco.left / g.vw).toBeGreaterThanOrEqual(0.58);
      expect(g.blocco.right / g.vw).toBeLessThanOrEqual(0.93);
      expect(g.h1Color, "l'H1 sulla foto non è bianco (A70)").toBe(BIANCO);
      // Il lockup finisce sull'acqua a `coda`, a destra; sotto resta la coda libera per la cartolina.
      expect(Math.abs(g.marca.bottom - (g.strato.top + HERO.coda * H)), "la marca non finisce a `coda`").toBeLessThanOrEqual(3);
      expect(g.lockup.right / g.vw).toBeLessThanOrEqual(0.93);
      expect(g.lockup.left / g.vw, "il lockup non sta a destra").toBeGreaterThanOrEqual(0.5);
      expect(g.firma.bottom, "la firma non sta sotto il lockup").toBeGreaterThan(g.lockup.bottom);
      expect(g.strato.top + H - g.sopra.bottom, "la coda libera sotto le scritte").toBeGreaterThanOrEqual(g.vh * 0.25);
      // In flusso, 1:1: a tre quote la foto sta dove stava, senza trasformate.
      for (const p of [0.3, 0.6, 0.9]) {
        await scrollaA(page, g.strato.top + p * H - g.vh / 2);
        const s = await geometria(page);
        expect(Math.abs(s.strato.top - g.strato.top), `a p ${p} la foto si è mossa`).toBeLessThanOrEqual(1);
        expect(s.boxTransform).toBe("none");
      }
    });

    test(`${vp.width}×${vp.height}: all'uscita la foto si ritira nella cornice 8/22 (A53) mentre il suo fondo va dal 130 % al 35 % del viewport (A79), prima no`, async ({ page, goto }) => {
      await page.setViewportSize(vp);
      await goto("/");
      await idratata(page);
      const g = await geometria(page);
      const H = g.docW * hwDi(foto.sorgente);
      const clip = () => page.locator("#top [data-testa-foto-box]").evaluate((el) => getComputedStyle(el).clipPath);
      // A79: la corsa della chiusura va dal fondo della foto al 130 % del viewport (ancora sotto il bordo) al fondo
      // della foto al 35 % (CHIUSURA di hero.ts, prop `fondo` di ChiusuraFoto). Prima di A79 partiva quando il fondo
      // dello spazio sopra passava la cima del viewport, a lockup uscito, e finiva col fondo della foto al 10 %.
      const fondoFoto = g.strato.top + H;
      const inizio = fondoFoto - (CHIUSURA[0] / 100) * g.vh;
      const fine = fondoFoto - (CHIUSURA[1] / 100) * g.vh;
      const medio = (inizio + fine) / 2;
      // Il fondo della foto ancora 200 px sotto il 130 %: nessun ritaglio.
      await scrollaA(page, inizio - 200);
      await page.waitForTimeout(1000);
      expect(await clip(), "la foto si chiude prima che il suo fondo arrivi al 130 % del viewport").toMatch(/^none$|^inset\(0(px|%)?( 0(px|%)?){0,3}\)$/);
      // A79 («si chiude troppo in fondo e non si nota neanche quando scrolli»): a metà corsa il lockup è in scena.
      expect(g.marca.bottom > medio && g.marca.top < medio + g.vh, "a metà corsa il lockup non è in scena: la chiusura non si nota scorrendo").toBe(true);
      // A metà corsa un ritaglio parziale; a fine corsa la cornice della cartolina. Lo scrub (0,9 s) si aspetta
      // col poll; il messaggio porta la diagnosi (scroll, clip, pagina visibile, frame) perché uno scrub di GSAP
      // non avanza se la pagina è nascosta.
      const diagnosi = () =>
        page.evaluate(async () => {
          let frames = 0;
          await new Promise<void>((r) => {
            const t0 = performance.now();
            const tick = () => {
              frames += 1;
              if (performance.now() - t0 > 300) r();
              else requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            setTimeout(r, 800);
          });
          const box = document.querySelector<HTMLElement>("#top [data-testa-foto-box]")!;
          const lista = (window as unknown as { __dtSTList?: () => Array<{ trigger: string; start: number; end: number; progress: number }> }).__dtSTList?.() ?? [];
          const strato = lista.filter((t) => t.trigger.includes("data-testa-strato")).map((t) => `${t.trigger}: ${Math.round(t.start)}→${Math.round(t.end)} p ${t.progress.toFixed(3)}`);
          return `scrollY ${window.scrollY}, clip ${getComputedStyle(box).clipPath}, hidden ${document.hidden}, frame in 300 ms ${frames}, trigger ${lista.length}, sullo strato [${strato.join("; ")}]`;
        });
      await scrollaA(page, medio);
      await expect.poll(async () => insetValues(await clip()).length, { timeout: 4_000, message: `a metà corsa (${Math.round(medio)}, fra ${Math.round(inizio)} e ${Math.round(fine)}) la foto non si ritira: ${await diagnosi()}` }).toBeGreaterThan(0);
      await scrollaA(page, fine);
      // Si aspetta che lo scrub si posi sulla cornice intera, al decimo di punto (la tolleranza di toBeCloseTo(…, 1)):
      // letta subito dopo il primo valore oltre 7,5, la cornice poteva essere ancora in corsa.
      await expect
        .poll(async () => insetValues(await clip()).map((v) => Math.round(v * 10) / 10), { timeout: 4_000, message: `a fine corsa la foto non è nella cornice simmetrica 8/22 della cartolina: ${await diagnosi()}` })
        .toEqual([8, 22]);
      const dopo = await geometria(page);
      expect(dopo.boxTransform, "la chiusura ha scritto una trasformata (A45)").toBe("none");
      expect(dopo.sticky).toBe(0);
    });
  }

  // A75: l'entrata col film intero (niente fixture `goto`, che spegne il sipario). Con la gomma (22 set.,
  // 376c591) l'orologio dell'entrata non è più il tuffo a un'ora fissa del film: Preloader.tsx lo tiene
  // lontano finché la gomma disegna e ci scrive l'ora quando la cancellatura comincia ad allargarsi
  // (`html[data-gomma="reveal"]`) più DISCESA.entrata (0,5 s). Da lì, fra le lettere accese (0,3 s + stagger,
  // 1,2 s) e la salita (+2,2 s) il lockup d'entrata è intero al centro della banda, sulla carta, e il tetto
  // della foto sta sotto il fondo dello schermo; poi la foto sale, si ferma alla salita a riposo (Raffaela
  // intera) e HeroCinematic toglie l'attributo. Si misura al primo fotogramma con le lettere accese.
  test("1440×900: l'entrata col film (A75): il lockup al centro sulla carta, la foto sotto la piega, poi sale fino a Raffaela", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-hero-entrata"))).toBe("intro");
    // L'handoff della gomma; o il sipario caduto senza gomma (JS arrivato dopo la rete CSS: allora
    // l'orologio dell'entrata è quello della rete, PRE_AUTOHIDE_MS).
    await page.waitForFunction(
      () =>
        /^(reveal|done)$/.test(document.documentElement.getAttribute("data-gomma") ?? "") ||
        !document.documentElement.hasAttribute("data-preloader"),
      undefined,
      { timeout: 20_000, polling: "raf" },
    );
    const meta = await page.evaluate(
      (cima) =>
        new Promise<{ tetto: number; vh: number; head: number; banda: number[]; min: number; centroLettere: number }>((fatto) => {
          const misura = () => {
            const strato = document.querySelector<HTMLElement>("#top [data-testa-strato]")!;
            const s = strato.getBoundingClientRect();
            const e = document.querySelector<HTMLElement>("#top .dt-hero_entrata")!.getBoundingClientRect();
            const head = document.querySelector<HTMLElement>("header")!.getBoundingClientRect().bottom;
            const chars = Array.from(document.querySelectorAll<HTMLElement>("#top .dt-hero_entrata [data-entrata-riga] .dt-c"));
            const lettere = chars.map((c) => c.getBoundingClientRect());
            return {
              tetto: s.top + cima * s.height,
              vh: innerHeight,
              head,
              banda: [e.top, e.bottom],
              min: Math.min(...chars.map((c) => Number(getComputedStyle(c).opacity))),
              centroLettere: (Math.min(...lettere.map((r) => r.top)) + Math.max(...lettere.map((r) => r.bottom))) / 2,
            };
          };
          // Il primo fotogramma con le lettere accese, o l'ultimo dopo 6 s (le asserzioni dicono cosa manca).
          const t0 = performance.now();
          const giro = () => {
            const m = misura();
            if (m.min > 0.9 || performance.now() - t0 > 6_000) fatto(m);
            else requestAnimationFrame(giro);
          };
          giro();
        }),
      foto.cielo.cima,
    );
    expect(meta.tetto, "il tetto si vede prima della salita").toBeGreaterThanOrEqual(meta.vh);
    expect(Math.abs(meta.banda[0] - meta.head), "il lockup d'entrata non comincia sotto la testata").toBeLessThanOrEqual(2);
    expect(meta.min, "le lettere del lockup d'entrata non sono accese").toBeGreaterThan(0.9);
    expect(meta.centroLettere, "il lockup non sta nella metà alta della banda").toBeLessThan((meta.banda[0] + meta.banda[1]) / 2 + 40);
    expect(meta.centroLettere).toBeGreaterThan(meta.head);
    await expect.poll(() => page.evaluate(() => document.documentElement.getAttribute("data-hero-entrata")), { timeout: 12_000, message: "l'attributo dell'entrata non cade" }).toBeNull();
    const g = await geometria(page);
    expect(g.stratoTransform).toBe("none");
    const H = g.docW * hwDi(foto.sorgente);
    const salita = salitaRiposo({ testo: HERO.testo, piedi: RAFFAELA.piedi, fotoH: H, band: g.vh - g.headBottom, respiro: (RESPIRO_SVH / 100) * g.vh });
    expect(Math.abs(g.headBottom - g.strato.top - salita), "a fine entrata la foto non è alla salita a riposo").toBeLessThanOrEqual(2);
    expect(await page.locator("#top .dt-hero_entrata").evaluate((el) => getComputedStyle(el).display)).toBe("none");
  });

  // D-A49-5: a riposo il lockup sta sull'acqua, sotto la piega: le sue lettere aspettano la prima entrata in
  // scena e poi entrano col ruolo title (flip su Y). D-A75-1: l'H1 invece è nel primo schermo, accanto a
  // Raffaela, ed entra subito.
  test("1440×900: l'H1 in scena entra subito; le lettere del lockup restano armate finché non entrano in scena, poi si accendono col ruolo", async ({ page, goto }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto("/");
    const opacita = (sel: string) => page.evaluate((s) => Number(getComputedStyle(document.querySelector<HTMLElement>(s)!).opacity), sel);
    await expect.poll(() => page.evaluate(() => (document.querySelector<HTMLElement>("[data-hero-char]")?.style.animation ?? "").includes("none")), { timeout: 5_000 }).toBe(true);
    await expect.poll(() => opacita("[data-hero-tchar]"), { timeout: 4_000, message: "l'H1 è nel primo schermo e non è entrato" }).toBeGreaterThan(0.9);
    await page.waitForTimeout(1_500);
    expect(await opacita("[data-hero-char]"), "il lockup è entrato fuori campo").toBeLessThanOrEqual(0.05);
    const g = await geometria(page);
    await scrollaA(page, g.marca.top - g.vh / 2);
    await expect.poll(() => opacita("[data-hero-char]"), { timeout: 4_000 }).toBeGreaterThan(0.9);
    await expect.poll(() => opacita("[data-hero-tchar]"), { timeout: 4_000 }).toBeGreaterThan(0.9);
    await expect.poll(() => opacita("[data-hero-schar]"), { timeout: 4_000 }).toBeGreaterThan(0.9);
  });
});

// Sotto i 768: la striscia 9:16 (D-A49-4), la foto al suo posto nel primo schermo, il lockup sull'acqua e il
// blocco dopo la foto sulla carta, in inchiostro; le lettere del lockup entrano all'handoff perché sono in scena.
test("390: la striscia 9:16 intera, il lockup centrato sull'acqua, il blocco dopo la foto in inchiostro", async ({ page, goto, isMobile }) => {
  test.skip(!isMobile, "ramo sotto 768");
  await goto("/");
  // `currentSrc` è vuoto finché il browser non ha scelto la sorgente del <picture>: si aspetta.
  await expect
    .poll(() => page.evaluate(() => decodeURIComponent(document.querySelector<HTMLImageElement>("#top [data-testa-foto-box] img")?.currentSrc ?? "")), { timeout: 10_000, message: "sul telefono la foto non è la striscia 9:16" })
    .toMatch(/hero-raffaela-piscina-alta-m-cielo\.webp/);
  const g = await geometria(page);
  expect(g.on).toBe(false);
  const H = g.docW * hwDi(foto.telefono.sorgente);
  expect(Math.abs(g.box.height - H), "la scatola non ha il rapporto della striscia").toBeLessThanOrEqual(2);
  expect(Math.abs(g.strato.top - g.headBottom), "sul telefono la foto deve stare al suo posto sotto la testata (salita 0)").toBeLessThanOrEqual(2);
  // La marca: la scatola dell'acqua, larga quanto la foto, da `acqua` al fondo della foto; il lockup centrato
  // e la firma sopra il cotto.
  expect(Math.abs(g.marca.width - g.docW), "la marca non è larga quanto la foto").toBeLessThanOrEqual(1);
  expect(Math.abs(g.marca.top - (g.strato.top + HERO.acqua * H)), "la marca non comincia sull'acqua").toBeLessThanOrEqual(3);
  expect(Math.abs(g.marca.bottom - (g.strato.top + H)), "la marca non finisce al fondo della foto").toBeLessThanOrEqual(3);
  expect(Math.abs((g.lockup.left + g.lockup.right) / 2 - g.vw / 2), "il lockup non è centrato").toBeLessThanOrEqual(2);
  // Il corsivo ha l'interlinea 0,8: il rettangolo delle lettere sporge di qualche px sotto la riga (misurato 5 a 390).
  expect(g.firma.bottom, "la firma scende sul cotto").toBeLessThanOrEqual(g.strato.top + (1 - HERO.cotto) * H + 8);
  expect(g.lockup.top, "il lockup comincia sopra l'acqua").toBeGreaterThanOrEqual(g.strato.top + HERO.acqua * H - 1);
  // Il blocco dopo la foto, sull'avorio, in inchiostro.
  expect(g.blocco.top, "il blocco comincia sulla foto: sotto lg va dopo").toBeGreaterThanOrEqual(g.strato.top + H - 1);
  expect(g.h1Color).toBe(INCHIOSTRO);
  // Il lockup è in scena a riposo: entra all'handoff.
  await expect.poll(() => page.evaluate(() => Number(getComputedStyle(document.querySelector<HTMLElement>("[data-hero-char]")!).opacity)), { timeout: 6_000 }).toBeGreaterThan(0.9);
});

// Senza JS (spec §8): nessun data-hero-intro, nessun corridoio, la foto intera e ferma, le lettere accese.
test.describe("senza JS", () => {
  test.use({ javaScriptEnabled: false });

  test("l'hero è la foto alta ferma e completa: nessun corridoio, nessun ritaglio, lettere a opacità 1", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#top")).toBeAttached();
    expect(await page.locator("#top").getAttribute("data-on")).toBeNull();
    expect(await page.locator("#top [data-corridor-screen], #top [data-hero-zoom]").count()).toBe(0);
    await expect(page.locator("#top [data-testa-foto-box]")).toHaveCSS("clip-path", "none");
    await expect(page.locator("[data-hero-char]").first()).toHaveCSS("opacity", "1");
    await expect(page.locator("#top h1")).toBeVisible();
  });
});

// Spec §2.3, «Cambio lingua»: LocaleProvider rende `it` nel server e passa alla lingua del cookie in un
// effetto passivo, dopo l'armamento; l'H1 tedesco ha lettere in più e nessuna deve lampeggiare.
test("con cookie dt_locale=de l'H1 tedesco si accende intero quando entra in scena, senza lampi (§2.3)", async ({ page, goto }) => {
  await page.context().addCookies([{ name: "dt_locale", value: "de", domain: "127.0.0.1", path: "/" }]);
  await page.addInitScript(() => {
    const rec = { lampi: 0 };
    (window as unknown as { __de: typeof rec }).__de = rec;
    const massimo = new WeakMap<Element, number>();
    const t0 = performance.now();
    const giro = () => {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-hero-char], [data-hero-tchar], [data-hero-schar]"))) {
        const p = Number(getComputedStyle(el).opacity);
        const m = Math.max(massimo.get(el) ?? 0, p);
        if (m >= 0.9 && p <= 0.1) rec.lampi += 1;
        massimo.set(el, m);
      }
      if (performance.now() - t0 < 15_000) requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
  });
  await goto("/");
  await expect(page.locator("#top h1")).toContainText("Verkaufen");
  const g = await geometria(page);
  await scrollaA(page, g.blocco.top - g.vh / 2);
  await expect
    .poll(
      () => page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>("[data-hero-tchar]")).every((el) => Number(getComputedStyle(el).opacity) > 0.9)),
      { timeout: 6_000 },
    )
    .toBe(true);
  expect(await page.evaluate(() => (window as unknown as { __de: { lampi: number } }).__de.lampi), "una lettera dell'hero è passata da ≥ 0,9 a ≤ 0,1").toBe(0);
});
