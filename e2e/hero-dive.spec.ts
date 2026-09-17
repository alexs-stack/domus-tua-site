import type { Locator, Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { matrixOf } from "./coreografia";

// Il tuffo dell'hero. Alberto, 13 settembre 2026: coreografia piena (A18),
// corridoi sticky dove servono (A19), fedeltà letterale (A20), lettere
// piatte (A22), foto che sale fino a 0,80·tImg (A23). Spec coreografia §3.2
// e §2.5. Motion attivo (default della suite); il sipario lo salta `goto`.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

type Matrice = { a: number; b: number; c: number; d: number; m41: number; m42: number };
const identita = (m: Matrice) =>
  Math.abs(m.a - 1) < 1e-3 && Math.abs(m.d - 1) < 1e-3 && Math.abs(m.b) < 1e-3 && Math.abs(m.c) < 1e-3 &&
  Math.abs(m.m41) < 0.5 && Math.abs(m.m42) < 0.5;

/** Inizio e fine della corsa: `top ${stickTop}px` → `bottom bottom` (useCorridor, stick bottom). */
async function corsa(page: Page) {
  return page.evaluate(() => {
    const top = document.querySelector<HTMLElement>("#top")!;
    const screen = top.querySelector<HTMLElement>("[data-corridor-screen]")!;
    const docTop = top.getBoundingClientRect().top + window.scrollY;
    const stickTop = Math.min(0, window.innerHeight - screen.offsetHeight);
    return { start: docTop - stickTop, end: docTop + top.offsetHeight - window.innerHeight };
  });
}

async function scrollaA(page: Page, y: number) {
  await page.evaluate(async (t) => {
    window.scrollTo({ top: Math.max(0, t), behavior: "instant" as ScrollBehavior });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
  await page.waitForTimeout(150);
}

const cta = (page: Page): Locator => page.locator("#top").getByRole("link", { name: "Richiedi la valutazione" });

test.describe("il tuffo da 1024 px con motion ok", () => {
  test.skip(({ isMobile }) => !!isMobile, "il corridoio vive da 1024 × 640");

  for (const vp of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`${vp.width}×${vp.height}: identità a riposo, foto dentro il ritaglio, segno fuori campo (A23)`, async ({ page, goto }) => {
      await page.setViewportSize(vp);
      await goto("/");
      await expect(page.locator("#top")).toHaveAttribute("data-on", "");
      expect(identita(await matrixOf(page.locator("[data-hero-zoom]")))).toBe(true);
      expect(identita(await matrixOf(page.locator("[data-hero-block-lift]")))).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
      await expect(cta(page)).toBeInViewport();

      const g = await corsa(page);
      for (const p of [0.3, 0.6, 1]) {
        await scrollaA(page, g.start + p * (g.end - g.start));
        const r = await page.evaluate(() => {
          const media = document.querySelector("[data-hero-media]")!.getBoundingClientRect();
          const z = document.querySelector("[data-hero-zoom]")!.getBoundingClientRect();
          return { mediaBottom: media.bottom, zoomBottom: z.bottom, segno: z.top + 0.86 * z.height };
        });
        expect(r.zoomBottom, `a p ${p} la foto scopre il fondo della banda`).toBeGreaterThanOrEqual(r.mediaBottom - 1);
        expect(r.segno, `a p ${p} il segno a quattro punte entra in campo`).toBeGreaterThan(r.mediaBottom);
      }
    });

    test(`${vp.width}×${vp.height}: a metà corsa il blocco è salito, a 0,75 la foto scala oltre 1,05, a fine corsa il foglio copre`, async ({ page, goto }) => {
      await page.setViewportSize(vp);
      await goto("/");
      await expect(page.locator("#top")).toHaveAttribute("data-on", "");
      const g = await corsa(page);
      await scrollaA(page, g.start + 0.5 * (g.end - g.start));
      expect((await matrixOf(page.locator("[data-hero-block-lift]"))).m42).toBeLessThan(-100);
      // Con dtIn la scala a p 0,5 vale 1,002: il controllo sta a p 0,75 (spec §3.2, da correggere al commit 22).
      await scrollaA(page, g.start + 0.75 * (g.end - g.start));
      expect((await matrixOf(page.locator("[data-hero-zoom]"))).a).toBeGreaterThan(1.05);
      await scrollaA(page, g.end);
      const fine = await page.evaluate(() => {
        const cover = document.querySelector<HTMLElement>("[data-hero-cover]")!;
        const al = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        return { top: cover.getBoundingClientRect().top, sopra: !!al && cover.contains(al) };
      });
      expect(fine.top).toBeGreaterThanOrEqual(-1);
      expect(fine.top).toBeLessThanOrEqual(1);
      expect(fine.sopra, "al centro dello schermo non c'è il foglio di Posizionamento").toBe(true);
    });

    test(`${vp.width}×${vp.height}: la firma torna a −26 % della sua altezza dopo andata e ritorno`, async ({ page, goto }) => {
      await page.setViewportSize(vp);
      await goto("/");
      await expect(page.locator("#top")).toHaveAttribute("data-on", "");
      const g = await corsa(page);
      await scrollaA(page, g.start + 0.6 * (g.end - g.start));
      await scrollaA(page, 0);
      const f = await page.evaluate(() => {
        const span = document.querySelector<HTMLElement>("[data-hero-script]")!;
        const wrap = span.parentElement!;
        return {
          delta: span.getBoundingClientRect().bottom - wrap.getBoundingClientRect().bottom,
          h: span.offsetHeight,
          lift: wrap.hasAttribute("data-hero-lift"),
        };
      });
      expect(f.lift).toBe(true);
      expect(Math.abs(f.delta - 0.26 * f.h)).toBeLessThanOrEqual(1);
    });

    test(`${vp.width}×${vp.height}: il fuoco sulla CTA a metà corsa riporta all'inizio del tuffo`, async ({ page, goto }) => {
      await page.setViewportSize(vp);
      await goto("/");
      await expect(page.locator("#top")).toHaveAttribute("data-on", "");
      const g = await corsa(page);
      await scrollaA(page, g.start + 0.5 * (g.end - g.start));
      // Un tasto prima del fuoco da script: Chromium dà :focus-visible (la condizione del hook) dopo un input da tastiera.
      await page.keyboard.press("Shift");
      await cta(page).focus();
      await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 500 }).toBeLessThanOrEqual(g.start + 2);
      await expect(cta(page)).toBeInViewport({ ratio: 1 });
    });

    // D52: a p 0 la CTA sporge di ~18 px sotto il bordo (860-919 a 1440×900, 726-785 a 1024×768,
    // misurato): il hook non la riporta a st.start, la porta in vista lo scroll nativo del fuoco.
    test(`${vp.width}×${vp.height}: col Tab da scrollY 0 la CTA prende il fuoco intera e la pagina si sposta al più di quanto sporge, senza tornare a st.start`, async ({ page, goto }) => {
      await page.setViewportSize(vp);
      await goto("/");
      await expect(page.locator("#top")).toHaveAttribute("data-on", "");
      const g = await corsa(page);
      await scrollaA(page, 0);
      const sporge = await cta(page).evaluate((el) => Math.max(0, el.getBoundingClientRect().bottom - window.innerHeight));
      let sullaCta = false;
      for (let i = 0; i < 60 && !sullaCta; i += 1) {
        await page.keyboard.press("Tab");
        sullaCta = await cta(page).evaluate((el) => el === document.activeElement);
      }
      expect(sullaCta, "60 Tab senza arrivare alla CTA dell'hero").toBe(true);
      await page.waitForTimeout(600);
      const y = await page.evaluate(() => window.scrollY);
      expect(y, "il fuoco sulla CTA ha riportato la pagina a st.start").toBeLessThan(g.start);
      expect(y, `il fuoco ha spostato la pagina più dei ${sporge.toFixed(1)} px di cui la CTA sporge`).toBeLessThanOrEqual(sporge + 1);
      // Col fondo della CTA sul bordo il rapporto di intersezione resta sotto 1 di una frazione di pixel (0,996 misurato).
      await expect(cta(page)).toBeInViewport({ ratio: 0.99 });
    });
  }

  test("1440×900: il marcatore data-bg copre il corridoio fino al foglio, anche dopo un resize", async ({ page, goto }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await goto("/");
    await expect(page.locator("#top")).toHaveAttribute("data-on", "");
    const misura = () =>
      page.evaluate(() => {
        const bg = document.querySelector<HTMLElement>('#top > [data-bg="foto"]')!.getBoundingClientRect();
        const band = document.querySelector<HTMLElement>("[data-hero-media]")!.getBoundingClientRect();
        const cover = document.querySelector<HTMLElement>("[data-hero-cover]")!.getBoundingClientRect();
        return { top: bg.top, bottom: bg.bottom, bandTop: band.top, coverTop: cover.top };
      });
    await scrollaA(page, 0);
    const riposo = await misura();
    expect(Math.abs(riposo.top - riposo.bandTop), "a scroll 0 il marcatore non parte dalla banda").toBeLessThanOrEqual(1);
    expect(Math.abs(riposo.bottom - riposo.coverTop), "a scroll 0 il marcatore non arriva alla cima del foglio").toBeLessThanOrEqual(1);
    await scrollaA(page, 1000);
    for (const giro of ["prima", "dopo"] as const) {
      if (giro === "dopo") {
        await page.evaluate(() => window.dispatchEvent(new Event("resize")));
        await page.waitForTimeout(300);
      }
      const r = await misura();
      expect(r.top, `${giro} del resize il marcatore non parte da sopra lo schermo`).toBeLessThanOrEqual(0);
      expect(r.bottom, `${giro} del resize il marcatore non arriva al foglio`).toBeGreaterThanOrEqual(r.coverTop - 1);
    }
  });

  test("1023×768: niente corridoio, spaziatore spento, altezza di oggi, zoom fino a 1,12", async ({ page, goto }) => {
    await page.setViewportSize({ width: 1023, height: 768 });
    await goto("/");
    const top = page.locator("#top");
    await expect(top).toBeAttached();
    await expect(top).not.toHaveAttribute("data-on");
    await expect(page.locator("#top [data-corridor-run]")).toHaveCSS("display", "none");
    const h = await page.evaluate(() => {
      const t = document.querySelector<HTMLElement>("#top")!;
      return {
        top: t.offsetHeight,
        parti:
          t.querySelector<HTMLElement>("[data-hero-media]")!.offsetHeight +
          t.querySelector<HTMLElement>("[data-hero-block]")!.offsetHeight,
      };
    });
    expect(Math.abs(h.top - h.parti)).toBeLessThanOrEqual(1);
    const zoom = page.locator("[data-hero-zoom]");
    expect(identita(await matrixOf(zoom))).toBe(true);
    const fine = await page.evaluate(() => {
      const band = document.querySelector<HTMLElement>("[data-hero-media]")!;
      const head = document.querySelector<HTMLElement>("header")!;
      return band.getBoundingClientRect().bottom + window.scrollY - head.offsetHeight;
    });
    // Il ramo non sticky (spec §3.2, 768-1023): lo stesso controllo del bordo basso e del segno a p 0,3, 0,6 e 1.
    for (const p of [0.3, 0.6, 1]) {
      await scrollaA(page, p * fine);
      const r = await page.evaluate(() => {
        const media = document.querySelector("[data-hero-media]")!.getBoundingClientRect();
        const z = document.querySelector("[data-hero-zoom]")!.getBoundingClientRect();
        return { mediaBottom: media.bottom, zoomBottom: z.bottom, segno: z.top + 0.86 * z.height };
      });
      expect(r.zoomBottom, `a p ${p} la foto scopre il fondo della banda`).toBeGreaterThanOrEqual(r.mediaBottom - 1);
      expect(r.segno, `a p ${p} il segno a quattro punte entra in campo`).toBeGreaterThan(r.mediaBottom);
    }
    await expect.poll(async () => (await matrixOf(zoom)).a, { timeout: 3000 }).toBeGreaterThan(1.1);
    expect((await matrixOf(zoom)).a).toBeLessThanOrEqual(1.121);
  });
});

test("390: la foto resta ferma, salgono solo lockup e firma; il marcatore resta alto quanto la banda", async ({ page, goto, isMobile }) => {
  test.skip(!isMobile, "ramo sotto 768");
  await goto("/");
  await expect(page.locator("#top")).not.toHaveAttribute("data-on");
  const zoom = page.locator("[data-hero-zoom]");
  for (const y of [0, 300, 600, 1200]) {
    await scrollaA(page, y);
    if (y === 300) {
      await expect
        .poll(async () => (await matrixOf(page.locator("[data-hero-lift]").first())).m42, { timeout: 3000 })
        .toBeLessThan(-1);
    }
    expect(identita(await matrixOf(zoom)), `a scrollY ${y} lo zoom non è identità`).toBe(true);
  }
  const alt = await page.evaluate(() => ({
    bg: document.querySelector<HTMLElement>('#top > [data-bg="foto"]')!.offsetHeight,
    band: document.querySelector<HTMLElement>("[data-hero-media]")!.offsetHeight,
  }));
  expect(Math.abs(alt.bg - alt.band), "sotto il gate il marcatore data-bg non è alto quanto la banda").toBeLessThanOrEqual(1);
});

// Senza JS (spec §3.2 e §8): nessun data-hero-intro, quindi nessun corridoio e l'hero del patto della porta.
test.describe("senza JS", () => {
  test.use({ javaScriptEnabled: false });

  test("l'hero è quello del patto della porta: nessun corridoio, spaziatore spento, foglio in flusso", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#top")).toBeAttached();
    expect(await page.locator("#top").getAttribute("data-on")).toBeNull();
    await expect(page.locator("#top [data-corridor-run]")).toHaveCSS("display", "none");
    await expect(page.locator('[data-corridor="hero"] > [data-corridor-screen]')).toHaveCSS("position", "static");
    await expect(page.locator("[data-hero-cover]")).toHaveCSS("margin-top", "0px");
  });
});

type Lettere = {
  armate: number | null;
  accese: number | null;
  m34: number;
  m11: number;
  m22: number;
  inizio: { char: number | null; tchar: number | null; schar: number | null };
};

test("a scroll 0 senza sipario le lettere entrano coi ruoli: flip su Y e su X, piatte, ritardi 0,3 / 0,4 / 0,3 s (§2.5, A20, A22)", async ({ page, goto }) => {
  await page.addInitScript(() => {
    const rec = {
      armate: null as number | null,
      accese: null as number | null,
      m34: 0,
      m11: 1,
      m22: 1,
      inizio: { char: null as number | null, tchar: null as number | null, schar: null as number | null },
    };
    (window as unknown as { __lettere: typeof rec }).__lettere = rec;
    const prodotto = (el: HTMLElement) => {
      let p = 1;
      for (let n: HTMLElement | null = el; n && n.id !== "main"; n = n.parentElement) p *= Number(getComputedStyle(n).opacity);
      return p;
    };
    const t0 = performance.now();
    const giro = () => {
      const ora = performance.now();
      const ch = document.querySelector<HTMLElement>("[data-hero-char]");
      const tch = document.querySelectorAll<HTMLElement>("[data-hero-tchar]");
      const sch = document.querySelector<HTMLElement>("[data-hero-schar]");
      if (ch && rec.armate === null && ch.style.animation.includes("none")) rec.armate = ora;
      if (rec.armate !== null) {
        // Inizio di un gruppo: il primo fotogramma in cui il suo primo carattere supera 0,05,
        // sopra lo 0,02 dipinto e lo 0 del `from` che la timeline scrive alla partenza.
        const primi = { char: ch, tchar: tch[0] ?? null, schar: sch };
        for (const k of ["char", "tchar", "schar"] as const) {
          const el = primi[k];
          if (el && rec.inizio[k] === null && Number(getComputedStyle(el).opacity) > 0.05) rec.inizio[k] = ora;
        }
        const ultimo = tch[tch.length - 1];
        if (ultimo && rec.accese === null && prodotto(ultimo) > 0.9) rec.accese = ora;
      }
      for (const el of [ch, tch[0], sch]) {
        if (!el) continue;
        const t = getComputedStyle(el).transform;
        if (t === "none") continue;
        const m = new DOMMatrixReadOnly(t);
        rec.m34 = Math.max(rec.m34, Math.abs(m.m34));
        if (el === ch) rec.m11 = Math.min(rec.m11, m.m11);
        if (el === sch) rec.m22 = Math.min(rec.m22, m.m22);
      }
      if (ora - t0 < 10_000) requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
  });
  await goto("/");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __lettere: Lettere }).__lettere.accese), { timeout: 10_000 })
    .not.toBeNull();
  const rec = await page.evaluate(() => (window as unknown as { __lettere: Lettere }).__lettere);
  expect(rec.armate).not.toBeNull();
  expect(
    rec.inizio.char !== null && rec.inizio.tchar !== null && rec.inizio.schar !== null,
    "un gruppo di lettere non ha mai superato 0,05",
  ).toBe(true);
  const lockup = (rec.inizio.char! - rec.armate!) / 1000;
  const h1 = (rec.inizio.tchar! - rec.inizio.char!) / 1000;
  const firma = (rec.inizio.schar! - rec.inizio.char!) / 1000;
  // Senza sipario: 150 ms dall'armamento più il ritardo del ruolo (spec §2.5): 0,45 s nominali, poi +0,1 s l'H1 e
  // +0 la firma. D55: il bordo basso del lockup è 0,35 s e non 0,40. L'armamento si legge al fotogramma dopo
  // l'effetto e una timeline di GSAP nata fra due tick parte dall'ultimo tick (gsap.js, `child._start =
  // timeline._time`): un fotogramma lungo in uno dei due punti, comune sotto i quattro worker, accorcia la misura
  // di quel fotogramma (0,388-0,407 s in sei giri a 1440×900). Il bordo discrimina ancora i 150 ms: senza, il
  // lockup misurerebbe ~0,30 s.
  expect(lockup, "lockup: 0,15 + 0,3 s dall'armamento").toBeGreaterThanOrEqual(0.35);
  expect(lockup, "lockup: 0,15 + 0,3 s dall'armamento").toBeLessThanOrEqual(0.7);
  expect(h1, "H1: 0,1 s dopo il lockup (0,4 − 0,3)").toBeGreaterThanOrEqual(0.05);
  expect(h1, "H1: 0,1 s dopo il lockup (0,4 − 0,3)").toBeLessThanOrEqual(0.15);
  expect(Math.abs(firma), "firma: lo stesso ritardo del lockup (0,3 s)").toBeLessThanOrEqual(0.05);
  expect(rec.m11, "il lockup non gira su Y (ruolo title, rotateY 90)").toBeLessThan(0.9);
  expect(rec.m22, "la firma non gira su X (ruolo accent, rotateX 90)").toBeLessThan(0.9);
  expect(rec.m34, "una lettera dell'hero ha una prospettiva (A22)").toBe(0);
  expect(rec.accese! - rec.armate!, "l'ultima lettera dell'H1 oltre 0,9 dopo 0,15 + 0,4 + 1,2 + 1,2 s").toBeLessThanOrEqual(2950);
});

// Spec §2.3, «Cambio lingua»: LocaleProvider rende `it` nel server e passa alla lingua del
// cookie in un effetto passivo, dopo l'armamento; l'H1 tedesco ha lettere in più.
test("con cookie dt_locale=de al primo caricamento l'H1 si accende tutto entro 2,95 s, senza lampi (§2.3)", async ({ page, goto }) => {
  await page.context().addCookies([{ name: "dt_locale", value: "de", domain: "127.0.0.1", path: "/" }]);
  await page.addInitScript(() => {
    const rec = { armate: null as number | null, accese: null as number | null, lampi: 0 };
    (window as unknown as { __de: typeof rec }).__de = rec;
    const massimo = new WeakMap<Element, number>();
    const prodotto = (el: HTMLElement) => {
      let p = 1;
      for (let n: HTMLElement | null = el; n && n.id !== "main"; n = n.parentElement) p *= Number(getComputedStyle(n).opacity);
      return p;
    };
    const t0 = performance.now();
    const giro = () => {
      const ora = performance.now();
      const ch = document.querySelector<HTMLElement>("[data-hero-char]");
      if (ch && rec.armate === null && ch.style.animation.includes("none")) rec.armate = ora;
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-hero-char], [data-hero-tchar], [data-hero-schar]"))) {
        const p = prodotto(el);
        const m = Math.max(massimo.get(el) ?? 0, p);
        if (m >= 0.9 && p <= 0.1) rec.lampi += 1;
        massimo.set(el, m);
      }
      const h1 = document.querySelector("#top h1");
      const tch = Array.from(document.querySelectorAll<HTMLElement>("[data-hero-tchar]"));
      if (
        rec.armate !== null &&
        rec.accese === null &&
        !!h1?.textContent?.includes("Verkaufen") &&
        tch.length > 0 &&
        tch.every((el) => prodotto(el) > 0.9)
      ) {
        rec.accese = ora;
      }
      if (ora - t0 < 10_000) requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
  });
  await goto("/");
  await expect(page.locator("#top h1")).toContainText("Verkaufen");
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __de: { accese: number | null } }).__de.accese), { timeout: 10_000 })
    .not.toBeNull();
  const rec = await page.evaluate(
    () => (window as unknown as { __de: { armate: number | null; accese: number | null; lampi: number } }).__de,
  );
  expect(rec.armate).not.toBeNull();
  expect(rec.accese! - rec.armate!, "lettere tedesche rimaste a 0,02 in attesa della rete CSS").toBeLessThanOrEqual(2950);
  expect(rec.lampi, "una lettera dell'hero è passata da ≥ 0,9 a ≤ 0,1").toBe(0);
});
