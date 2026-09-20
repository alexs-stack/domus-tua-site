import type { Page } from "@playwright/test";
import sharp from "sharp";
import { test, expect } from "./helpers";
import tinte from "../app/lib/motion/tinte.json";
import { sizesDi, sizesSottoLg } from "../app/lib/motion/testa";

// A38 di Alberto (20 settembre 2026): «la testa di era» sulle nove rotte e lo stato fermo dei due
// legali, commit T (brief qualita/a38/commit-T-testa-di-era-brief.md; D172-D198). Una sezione per
// cosa: «la testa», «la foto ferma», «la testata», «sotto lg», «senza JS e con moto ridotto»,
// «CLS 0», «sizes sotto lg», più «le tinte» e «l'aggancio della ricerca» del commit R (R1, R2) che
// restano. Tutto su `next build` + `next start` (playwright.site.config.ts): i project sono
// desktop-1440 (1440×900; i viewport da lg si impostano lì) e mobile-390 (iPhone 13: 390×664 a DPR 3;
// i telefoni di §10 si impostano lì; il caso a DPR 2 in un contesto suo).

type Rotta = keyof typeof tinte;
const ROTTE = Object.keys(tinte) as Rotta[];
const ROTTE_TESTA = ROTTE.filter((r) => tinte[r].trattamento === "testa");
const LINGUE = ["it", "en", "fr", "de", "es"] as const;
const FERMA = /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/;
const INK = "rgb(70, 66, 61)";
const BIANCO = "rgb(255, 255, 255)";
/** D124: dove `tinte.json` dichiara l'avorio, la pagina spedisce il token della zona. */
const TOKEN_ALTA = "--color-cream-deep";

/**
 * L'idratazione è finita: c'è `window.__dtST` (il chunk di app/lib/motion/gsap.ts è eseguito) e, a
 * motion attivo, Lenis ha scritto la classe `lenis` su <html> nel suo useEffect (SmoothScroll.tsx).
 */
async function idratata(page: Page) {
  await page.waitForFunction(
    () =>
      typeof window.__dtST === "function" &&
      (!matchMedia("(prefers-reduced-motion: no-preference)").matches || document.documentElement.classList.contains("lenis")),
    undefined,
    { timeout: 15_000 },
  );
}

async function lingua(page: Page, lang: string) {
  await page.context().addCookies([{ name: "dt_locale", value: lang, domain: "127.0.0.1", path: "/" }]);
}

const rgb = (hex: string) => `rgb(${[1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)).join(", ")})`;
/** Il valore atteso della tinta alta: la tinta del JSON, o il token della zona risolto su :root (D124). */
async function tintaAttesa(page: Page, rotta: Rotta) {
  const hex = tinte[rotta].alta.hex;
  if (hex !== "avorio") return rgb(hex);
  return rgb(await page.evaluate((nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim().toLowerCase(), TOKEN_ALTA));
}

type Rett = { top: number; bottom: number; left: number; right: number; width: number; height: number };

/** La geometria della testa letta dal DOM, in coordinate di pagina. */
async function geometria(page: Page) {
  return page.evaluate(() => {
    const y = window.scrollY;
    const box = (el: Element | null): Rett | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top + y, bottom: r.bottom + y, left: r.left, right: r.right, height: r.height, width: r.width };
    };
    const section = document.querySelector<HTMLElement>("[data-testa]");
    const riquadro = section?.querySelector<HTMLElement>("[data-dive-zoom]") ?? null;
    const strato = section?.querySelector<HTMLElement>("[data-testa-strato]") ?? null;
    const img = strato?.querySelector<HTMLImageElement>("img") ?? null;
    const blocco = section?.querySelector<HTMLElement>(".dt-testa_blocco") ?? null;
    const pagina = section?.querySelector<HTMLElement>(".dt-testa_pagina") ?? null;
    const h1 = section?.querySelector<HTMLElement>("h1") ?? null;
    const script = section?.querySelector<HTMLElement>(".script-word") ?? null;
    const eyebrow = section?.querySelector<HTMLElement>(".eyebrow") ?? null;
    const lead = section?.querySelector<HTMLElement>("p.lead") ?? null;
    const solid = section?.querySelector<HTMLElement>("a.dt-btn--cta-solid") ?? null;
    const ghost = section?.querySelector<HTMLElement>("a.dt-btn--ghost") ?? null;
    const punti = section?.querySelector<HTMLElement>(".dt-testa_pagina ul") ?? null;
    const stile = (el: Element | null) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return { color: s.color, shadow: s.textShadow, size: s.fontSize, opacity: s.opacity, classi: el.className };
    };
    const tuttiDentro = (radice: Element | null, cont: Rett | null) => {
      if (!radice || !cont) return null;
      let fuori = 0;
      for (const el of radice.querySelectorAll<HTMLElement>(".eyebrow, h1, .script-word, p.lead, a.dt-btn")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.top + y < cont.top - 1 || r.bottom + y > cont.bottom + 1 || r.left < cont.left - 1 || r.right > cont.right + 1) fuori += 1;
      }
      return fuori;
    };
    const rq = box(riquadro);
    return {
      section: box(section),
      riquadro: rq,
      strato: box(strato),
      img: box(img),
      blocco: box(blocco),
      pagina: box(pagina),
      h1: box(h1),
      eyebrow: box(eyebrow),
      script: box(script),
      lead: box(lead),
      solid: box(solid),
      ghost: box(ghost),
      punti: box(punti),
      nodiFuori: tuttiDentro(blocco, box(blocco)),
      stili: { h1: stile(h1), eyebrow: stile(eyebrow), script: stile(script), lead: stile(lead), solid: stile(solid), ghost: stile(ghost) },
      op: img ? getComputedStyle(img).objectPosition : null,
      fondoRiquadro: riquadro ? getComputedStyle(riquadro).backgroundColor : null,
      fondoPagina: pagina ? getComputedStyle(pagina).backgroundColor : null,
      posizioneRiquadro: riquadro ? getComputedStyle(riquadro).position : null,
      posizioneBlocco: blocco ? getComputedStyle(blocco).position : null,
      overflow: riquadro ? getComputedStyle(riquadro).overflow : null,
      trasformata: strato ? getComputedStyle(strato).transform : null,
      sizes: img?.getAttribute("sizes") ?? null,
      currentSrc: img?.currentSrc ?? null,
      naturalWidth: img?.naturalWidth ?? 0,
      naturalHeight: img?.naturalHeight ?? 0,
      sticky: section ? Array.from(section.querySelectorAll("*")).filter((el) => getComputedStyle(el).position === "sticky").length : -1,
      corridoi: section ? section.querySelectorAll("[data-corridor]").length + (section.hasAttribute("data-corridor") ? 1 : 0) : -1,
      clientWidth: document.documentElement.clientWidth,
      innerHeight: window.innerHeight,
      dpr: window.devicePixelRatio,
    };
  });
}

/** Il bucket `w` dell'ottimizzatore in `currentSrc`. */
const bucketDi = (src: string | null) => Number(/[?&]w=(\d+)(&|$)/.exec(src ?? "")?.[1] ?? 0);

// ── la testa ───────────────────────────────────────────────────────────────
// D176/D177: su nove + due rotte la fotografia è il primo pixel della pagina (`margin-top` negativo
// sotto la testata trasparente), in un riquadro alto 100svh; dentro, in alto, in bianco NUDO (A40 di
// Alberto: «negli screenshot di era-residence non c'erano le ombre sulle scritte bianche») stanno
// occhiello, H1, calligrafia, lead e i due comandi, centrati come «Perfect sea views» (A41); i tre
// punti sotto, sull'avorio. D184: nessuna ombra su nessun nodo e nessun reset; il bottone rosso pieno
// com'è. A41: il riquadro della foto è sticky (fermo mentre la pagina gli scorre sopra), il blocco dei
// testi sta in flusso sopra di lui, alto almeno 100svh.
test.describe("la testa", () => {
  for (const vp of [
    { w: 1440, h: 900 },
    { w: 1024, h: 768 },
  ] as const) {
    for (const rotta of ROTTE) {
      test(`${rotta} a ${vp.w}×${vp.h}: foto dal pixel 0, riquadro 100svh, blocco bianco, nudo e centrato dentro in cinque lingue, tre punti sotto, sizes della sorgente`, async ({ page, goto }, info) => {
        test.skip(info.project.name !== "desktop-1440", "le quote da lg si misurano dal desktop");
        await page.setViewportSize({ width: vp.w, height: vp.h });
        for (const lang of LINGUE) {
          await lingua(page, lang);
          await goto(rotta);
          await idratata(page);
          await page.locator("[data-testa-strato] img").first().evaluate((el) => (el as HTMLImageElement).decode().catch(() => undefined));
          const g = await geometria(page);
          expect(g.section, `${lang}: nessuna section della testa`).not.toBeNull();
          expect(g.corridoi, `${lang}: la testa non è un corridoio`).toBe(0);
          expect(g.sticky, `${lang}: uno sticky solo nella testa, il riquadro (A41)`).toBe(1);
          expect(g.posizioneRiquadro).toBe("sticky");
          expect(Math.abs(g.section!.top), `${lang}: la section non comincia a scroll 0 (D176)`).toBeLessThanOrEqual(1);
          expect(Math.abs(g.riquadro!.top), `${lang}: il riquadro non è il pixel 0`).toBeLessThanOrEqual(1);
          expect(Math.abs(g.riquadro!.height - g.innerHeight), `${lang}: il riquadro non è 100svh`).toBeLessThanOrEqual(1);
          expect(Math.round(g.riquadro!.width)).toBe(g.clientWidth);
          expect(g.overflow).toBe("clip");
          expect(g.posizioneBlocco, `${lang}: il blocco sta in flusso sopra la foto (A41)`).toBe("relative");
          expect(Math.abs(g.blocco!.top), `${lang}: il blocco non comincia al pixel 0`).toBeLessThanOrEqual(1);
          expect(g.blocco!.height, `${lang}: il blocco non è alto almeno 100svh`).toBeGreaterThanOrEqual(g.innerHeight - 1);
          // La foto copre il riquadro da ogni lato: lo strato È il riquadro (A41: nessun margine, nessuna trasformata).
          expect(Math.abs(g.strato!.bottom - g.riquadro!.bottom)).toBeLessThanOrEqual(1);
          expect(Math.abs(g.strato!.height - g.riquadro!.height), `${lang}: lo strato non è il riquadro`).toBeLessThanOrEqual(1);
          expect(g.img!.left).toBeLessThanOrEqual(g.riquadro!.left + 1);
          expect(g.img!.right).toBeGreaterThanOrEqual(g.riquadro!.right - 1);
          expect(g.trasformata).toMatch(FERMA);
          expect(g.op, `${lang}: l'inquadratura da lg non è quella di tinte.json (D180)`).toBe(tinte[rotta].objectPosition.lg);
          // I nodi stanno dentro il blocco; i tre punti dopo il blocco (sopra la foto, che resta sticky).
          expect(g.nodiFuori, `${lang}: nodi fuori dal blocco`).toBe(0);
          if (g.punti) expect(g.punti.top, `${lang}: i tre punti non stanno dopo il blocco`).toBeGreaterThanOrEqual(g.blocco!.bottom - 1);
          // Centrato (A41): H1 e lead hanno lo stesso centro del riquadro, entro 2 px.
          const cx = (g.riquadro!.left + g.riquadro!.right) / 2;
          for (const z of ["h1", "lead", "solid"] as const) if (g[z]) expect(Math.abs((g[z]!.left + g[z]!.right) / 2 - cx), `${lang}: ${z} non è centrato`).toBeLessThanOrEqual(2);
          expect(g.lead!.top, `${lang}: il lead non sta in alto`).toBeLessThan(g.h1!.top);
          expect(g.solid!.top, `${lang}: il bottone non sta in basso`).toBeGreaterThan(g.h1!.bottom);
          // I colori, e nessuna ombra (D184, A40).
          for (const z of ["h1", "eyebrow", "lead"] as const) expect(g.stili[z]?.color, `${lang}: ${z} non è bianco`).toBe(BIANCO);
          if (tinte[rotta].trattamento === "testa" || g.stili.script) expect(g.stili.script?.color, `${lang}: la calligrafia non è bianca`).toBe(BIANCO);
          for (const z of ["h1", "eyebrow", "lead", "ghost", "script", "solid"] as const) if (g.stili[z]) expect(g.stili[z]!.shadow, `${lang}: ${z} porta un'ombra (A40)`).toBe("none");
          expect(g.stili.h1!.classi).not.toMatch(/dt-alone|dt-ink-media/);
          if (g.stili.ghost) {
            expect(g.stili.ghost.color).toBe(BIANCO);
            expect(g.stili.ghost.size, `${lang}: il fantasma non è 18 px (D174)`).toBe("18px");
            expect(g.ghost!.top, `${lang}: il fantasma non sta sotto il bottone`).toBeGreaterThanOrEqual(g.solid!.bottom - 1);
          }
          // I byte: `sizes` dal rapporto della sorgente; il bitmap non è più stretto di quel che lo strato dipinge.
          const [sw, sh] = tinte[rotta].sorgente;
          expect(g.sizes).toBe(sizesDi(sw / sh));
          const bucket = bucketDi(g.currentSrc);
          const serve = Math.max(g.strato!.width, (g.strato!.height * sw) / sh);
          expect(bucket, `${lang}: bucket ${bucket} più stretto di ${serve.toFixed(0)}`).toBeGreaterThanOrEqual(Math.min(serve, sw) - 1);
          expect(g.naturalWidth).toBeGreaterThan(0);
          // Il fondo: il placeholder è la tinta alta, la pagina sotto l'avorio.
          expect(g.fondoRiquadro).toBe(await tintaAttesa(page, rotta));
          expect(g.fondoPagina).toBe(rgb("#f9f5ef"));
        }
      });
    }
  }
});

// ── la foto ferma ────────────────────────────────────────────────────────────
// A41: la foto è sticky in alto e non si muove; il blocco dei testi e la fascia dei punti le scorrono
// sopra finché la section finisce (alta 100svh + la fascia, ≥ 60svh); poi tutto scorre insieme. Nessun
// ScrollTrigger, nessuna trasformata, a nessuna quota.
test.describe("la foto ferma", () => {
  for (const rotta of ["/vendi", "/metodo"] as const) {
    test(`${rotta} a 1440×900: riquadro a 0 mentre il blocco sale e la fascia lo copre; poi scorre con la pagina; strato mai trasformato`, async ({ page, goto }, info) => {
      test.skip(info.project.name !== "desktop-1440", "le quote sono a 1440×900");
      await goto(rotta);
      await idratata(page);
      const riposo = await geometria(page);
      expect(Math.abs(riposo.riquadro!.top)).toBeLessThanOrEqual(1);
      expect(Math.round(riposo.riquadro!.height)).toBe(900);
      expect(riposo.trasformata).toMatch(FERMA);
      // La fascia dei punti: ≥ 60svh dove i punti ci sono (/vendi); /metodo non ne passa e la fascia è vuota (0).
      const fascia = riposo.pagina!.height;
      if (riposo.punti) expect(fascia, "la fascia dei punti non è alta almeno 60svh (A41)").toBeGreaterThanOrEqual(540 - 1);
      const st0 = await page.evaluate(() => window.__dtST!());
      // `geometria` dà quote DI PAGINA (top + scrollY): il riquadro fermo nel viewport ha top di pagina = y,
      // il blocco in flusso resta a 0, la fascia resta a 900 (sotto il blocco alto 100svh).
      for (const y of [300, Math.round(fascia), Math.round(fascia) + 260, 450, 0]) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(350);
        const g = await geometria(page);
        const atteso = -Math.max(0, y - fascia);
        const riquadroViewport = g.riquadro!.top - y;
        expect(Math.abs(riquadroViewport - atteso), `scroll ${y}: il riquadro sta a ${riquadroViewport} invece di ${atteso}`).toBeLessThanOrEqual(1);
        expect(Math.abs(g.blocco!.top), `scroll ${y}: il blocco non scorre in flusso`).toBeLessThanOrEqual(1);
        expect(Math.abs(g.pagina!.top - 900), `scroll ${y}: la fascia non sale sopra la foto`).toBeLessThanOrEqual(1);
        expect(g.trasformata, `scroll ${y}: lo strato si è mosso`).toMatch(FERMA);
      }
      expect(await page.evaluate(() => window.__dtST!()), "la testa ha creato uno ScrollTrigger").toBe(st0);
    });
  }
});

// ── la testata ─────────────────────────────────────────────────────────────
// D186: da lg la testata è trasparente sopra la foto e scorre via con la pagina: nav bianca, senza ombra
// finché c'è (a scroll 0 e 40), `data-su-foto` nell'HTML iniziale. Sotto lg a scroll 0 la barra sticky è
// trasparente sopra la foto e «Menu» è bianco, senza ombra; da 24 px `data-solid` prende la tinta alta
// (D82) e «Menu» torna grafite. Il segno vira `foto` a scroll 0 e 450 su /metodo a 1440, `grafite` a 1200.
test.describe("la testata", () => {
  test("da lg: header[data-su-foto] nell'HTML, nav bianca, senza ombra, a scroll 0 e 40, il selettore lingua se c'è; il segno foto a 0 e 450, grafite a 1200", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "desktop-1440", "la nav esiste da lg");
    for (const rotta of ["/metodo", "/vendi", "/privacy"] as const) {
      const html = await (await page.request.get(rotta)).text();
      expect(html, `${rotta}: data-su-foto non è nell'HTML iniziale`).toMatch(/<header[^>]*\bdata-su-foto\b/);
      await goto(rotta);
      await idratata(page);
      for (const s of [0, 40]) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), s);
        await page.waitForTimeout(150);
        const nav = await page.evaluate(() => {
          const a = document.querySelector("header nav a");
          const l = document.querySelector<HTMLElement>('header nav button[aria-haspopup="listbox"]');
          const css = (el: Element | null) => (el ? { color: getComputedStyle(el).color, shadow: getComputedStyle(el).textShadow } : null);
          return { nav: css(a), lingua: css(l), suFoto: document.querySelector("header")?.hasAttribute("data-su-foto") };
        });
        expect(nav.suFoto).toBe(true);
        expect(nav.nav?.color, `${rotta} a scroll ${s}: la nav non è bianca`).toBe(BIANCO);
        expect(nav.nav?.shadow, `${rotta} a scroll ${s}: la nav porta un'ombra (A40)`).toBe("none");
        if (nav.lingua) {
          expect(nav.lingua.color).toBe(BIANCO);
          expect(nav.lingua.shadow).toBe("none");
        } else if (s === 0) info.annotations.push({ type: "lingua", description: `${rotta}: selettore lingua assente (NEXT_PUBLIC_ENABLE_I18N spento)` });
      }
    }
    // Il segno (A21; tema.ts salta la testata: sotto il segno c'è la foto).
    await goto("/metodo");
    await idratata(page);
    const tema = () => page.locator(".dt-segno").first().getAttribute("data-tema");
    await expect.poll(tema, { timeout: 8000 }).toBe("foto");
    await page.evaluate(() => window.scrollTo({ top: 450, behavior: "instant" }));
    await expect.poll(tema, { timeout: 8000 }).toBe("foto");
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "instant" }));
    await expect.poll(tema, { timeout: 8000 }).toBe("grafite");
    // Il lockup non si ricolora (C23): è la stessa immagine di sempre.
    expect(await page.locator('header img[alt="Domus Tua Immobiliare"]').first().getAttribute("src")).toBe("/logo-domustua-original.png");
  });

  test("sotto lg a scroll 0: barra trasparente sopra la foto, «Menu» bianco, senza ombra; da 24 px la barra tinta e «Menu» grafite (D82)", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "mobile-390", "la barra sticky è del telefono");
    await page.setViewportSize({ width: 390, height: 844 });
    for (const rotta of ["/vendi", "/servizi", "/cookie"] as const) {
      await goto(rotta);
      await idratata(page);
      const header = page.locator("header").first();
      const menu = page.locator("header button[aria-controls='mobile-menu']");
      await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(menu).toHaveCSS("color", BIANCO);
      expect(await menu.evaluate((el) => getComputedStyle(el).textShadow)).toBe("none");
      // Sotto la barra trasparente c'è la foto (D176): il primo elemento fuori dalla testata è il riquadro, o il
      // blocco dei testi (A41: sale sopra la foto per 100svh) col suo fondo trasparente, mai un nodo di testo.
      const sotto = await page.evaluate(() => {
        const h = document.querySelector("header")!.getBoundingClientRect();
        const el = document.elementsFromPoint(window.innerWidth / 2, h.height / 2).find((e) => !e.closest("header"));
        if (!el) return "niente";
        if (el.closest(".eyebrow, h1, .script-word, p.lead, a.dt-btn")) return "testo";
        if (el.closest("[data-dive-zoom]")) return "riquadro";
        const blocco = el.closest(".dt-testa_blocco");
        if (blocco && getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)") return "riquadro";
        return el.tagName.toLowerCase();
      });
      expect(sotto, `${rotta}: sotto la barra non c'è la foto`).toBe("riquadro");
      await page.evaluate(() => window.scrollTo({ top: 120, behavior: "instant" }));
      await expect(header).toHaveAttribute("data-solid", "true");
      await expect(header).toHaveCSS("background-color", await tintaAttesa(page, rotta));
      await expect(menu).toHaveCSS("color", INK);
    }
  });

  // 2.4.7 sulla foto (brief T §7, cancello-T1.md §7): a offset 3 nessun colore regge su ogni rotta (rosso 1,18:1 su
  // /metodo 1440, bianco 1,00 su /chi-siamo 390), quindi l'anello del bottone rosso pieno si attacca al bordo (offset 0)
  // e diventa bianco: il contrasto è col bottone, non con la foto. Il fantasma tiene l'anello del sito (rosso, offset 3)
  // e il suo focus-visible (crema + sottolineatura). Le rotte sono i casi peggiori della tabella, per fascia.
  test("il fuoco sul bottone rosso dentro la foto: anello bianco a offset 0 (2.4.7); il fantasma tiene l'anello del sito", async ({ page, goto }, info) => {
    const rotte = info.project.name === "mobile-390" ? (["/chi-siamo", "/vendi"] as const) : (["/metodo", "/servizi", "/vendi"] as const);
    for (const rotta of rotte) {
      await goto(rotta);
      await idratata(page);
      const solid = page.locator("[data-testa] a.dt-btn--cta-solid").first();
      await expect(solid).toBeVisible();
      // Un tasto prima del fuoco da script: Chromium dà :focus-visible dopo un input da tastiera (idioma di hero-dive.spec.ts).
      await page.keyboard.press("Shift");
      await solid.focus();
      const anello = await solid.evaluate((el) => {
        const s = getComputedStyle(el);
        return { visibile: el.matches(":focus-visible"), color: s.outlineColor, offset: s.outlineOffset, width: s.outlineWidth, style: s.outlineStyle, fondo: s.backgroundColor };
      });
      expect(anello.visibile, `${rotta}: il bottone non è :focus-visible`).toBe(true);
      expect(anello.color, `${rotta}: l'anello del bottone sulla foto non è bianco`).toBe(BIANCO);
      expect(anello.offset, `${rotta}: l'anello non è attaccato al bordo`).toBe("0px");
      expect(anello.width).toBe("2px");
      expect(anello.style).toBe("solid");
      // Il fondo a fuoco è il rosso scuro (8,1:1 col bianco dell'anello): arriva con la transizione di 0,25 s di .dt-btn.
      await expect(solid, `${rotta}: a fuoco il bottone non è rosso scuro`).toHaveCSS("background-color", rgb("#a30707"));
      const ghost = page.locator("[data-testa] a.dt-btn--ghost-testa").first();
      if (await ghost.count()) {
        await page.keyboard.press("Tab");
        const fantasma = await ghost.evaluate((el) => {
          const s = getComputedStyle(el);
          return { visibile: el.matches(":focus-visible"), color: s.outlineColor, offset: s.outlineOffset, sottolineatura: s.textDecorationLine };
        });
        expect(fantasma.visibile, `${rotta}: il Tab dal bottone non arriva al fantasma`).toBe(true);
        expect(fantasma.color).toBe(rgb("#d20a0a"));
        expect(fantasma.offset).toBe("3px");
        expect(fantasma.sottolineatura).toBe("underline");
        await expect(ghost, `${rotta}: a fuoco il fantasma non è crema`).toHaveCSS("color", rgb("#f9f5ef"));
      }
    }
  });
});

// ── sotto lg ───────────────────────────────────────────────────────────────
// D176/D177, A41: sul telefono la stessa testa dal pixel 0 sotto la testata sticky trasparente: il
// riquadro sticky è 100svh, il blocco centrato sta in flusso sopra di lui ed è alto almeno 100svh
// (cresce dove l'H1 tedesco lo chiede, nulla si taglia: la foto sotto resta ferma), i tre punti dopo.
const SOTTO_LG: Array<{ rotta: Rotta; w: number; h: number; lang: (typeof LINGUE)[number] }> = [
  { rotta: "/vendi", w: 390, h: 844, lang: "de" },
  { rotta: "/vendi", w: 390, h: 844, lang: "it" },
  { rotta: "/vendi", w: 390, h: 844, lang: "en" },
  { rotta: "/vendi", w: 390, h: 844, lang: "fr" },
  { rotta: "/vendi", w: 390, h: 844, lang: "es" },
  { rotta: "/servizi", w: 390, h: 844, lang: "de" },
  { rotta: "/servizi", w: 390, h: 844, lang: "it" },
  { rotta: "/servizi", w: 390, h: 844, lang: "fr" },
  { rotta: "/metodo", w: 390, h: 844, lang: "de" },
  { rotta: "/metodo", w: 390, h: 844, lang: "it" },
  { rotta: "/vendi", w: 375, h: 667, lang: "de" },
  { rotta: "/servizi", w: 375, h: 667, lang: "de" },
  { rotta: "/vendi", w: 360, h: 640, lang: "de" },
  { rotta: "/servizi", w: 360, h: 640, lang: "de" },
  { rotta: "/vendi", w: 844, h: 390, lang: "de" },
  { rotta: "/servizi", w: 844, h: 390, lang: "de" },
];
test.describe("sotto lg", () => {
  for (const c of SOTTO_LG) {
    test(`${c.rotta} a ${c.w}×${c.h} in ${c.lang}: riquadro sticky 100svh, blocco centrato ≥ 100svh, tutto dentro, nessuna trasformata`, async ({ page, goto }, info) => {
      test.skip(info.project.name !== "mobile-390", "il ramo sotto la soglia si misura sul telefono");
      await page.setViewportSize({ width: c.w, height: c.h });
      await lingua(page, c.lang);
      await goto(c.rotta);
      await idratata(page);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const g = await geometria(page);
      expect(Math.abs(g.section!.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(g.riquadro!.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(g.riquadro!.height - g.innerHeight), "il riquadro non è 100svh").toBeLessThanOrEqual(1);
      expect(g.overflow).toBe("clip");
      expect(g.posizioneRiquadro).toBe("sticky");
      expect(g.posizioneBlocco).toBe("relative");
      expect(Math.abs(g.blocco!.top)).toBeLessThanOrEqual(1);
      expect(g.blocco!.height, "il blocco non è alto almeno 100svh").toBeGreaterThanOrEqual(g.innerHeight - 1);
      expect(g.op, "l'inquadratura sotto lg non è quella di tinte.json (D180)").toBe(tinte[c.rotta].objectPosition.sotto);
      expect(Math.abs(g.strato!.height - g.riquadro!.height)).toBeLessThanOrEqual(1);
      expect(g.nodiFuori, "nodi fuori dal blocco").toBe(0);
      const ultimo = g.ghost ?? g.solid!;
      expect(ultimo.bottom, "l'ultimo comando esce dal blocco").toBeLessThanOrEqual(g.blocco!.bottom + 1);
      if (g.punti) expect(g.punti.top).toBeGreaterThanOrEqual(g.blocco!.bottom - 1);
      expect(g.sizes).toBe(sizesDi(tinte[c.rotta].sorgente[0] / tinte[c.rotta].sorgente[1]));
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
      await page.waitForTimeout(400);
      const dopo = await geometria(page);
      expect(dopo.trasformata, "sotto la soglia lo strato si muove").toMatch(FERMA);
      // Quote di pagina: il riquadro sticky resta fermo nel viewport finché la section ha corsa (la sua altezza
      // meno quella del riquadro: la fascia dei punti e quel che il blocco supera i 100svh; su /metodo e /servizi
      // senza punti la corsa può essere zero e la foto scorre con la pagina), poi scorre col resto. Il blocco in
      // flusso resta a 0 di pagina.
      const corsa = Math.max(0, g.section!.height - g.riquadro!.height);
      const attesoPagina = Math.min(300, corsa);
      expect(Math.abs(dopo.riquadro!.top - attesoPagina), `a scroll 300 la foto non sta a ${attesoPagina} di pagina (sticky con corsa ${Math.round(corsa)})`).toBeLessThanOrEqual(1);
      expect(Math.abs(dopo.blocco!.top), "il blocco non scorre sopra la foto").toBeLessThanOrEqual(1);
    });
  }
});

// ── senza JS e con moto ridotto ────────────────────────────────────────────
// D190: lo stato del CSS è lo stato a riposo; senza JS la pagina è completa e ferma, la foto intera
// (strato = riquadro), l'H1 bianco e nudo (A40), testo e tinta nell'HTML
// iniziale, `data-su-foto` sulla testata.
test.describe("senza JS e con moto ridotto", () => {
  test.describe("senza JS", () => {
    test.use({ javaScriptEnabled: false });

    test("undici rotte: nessun data-hero-intro, nessuno sticky, foto intera, H1 bianco e nudo, tinta, H1 e data-su-foto nell'HTML iniziale", async ({ page }) => {
      for (const rotta of ROTTE) {
        const html = await (await page.request.get(rotta)).text();
        expect(html, `${rotta}: la tinta non è nell'HTML iniziale`).toContain("--dt-tinta-alta:");
        expect(html, `${rotta}: l'H1 non è nell'HTML iniziale`).toMatch(/<h1[\s>]/);
        expect(html, `${rotta}: data-su-foto non è nell'HTML iniziale`).toMatch(/<header[^>]*\bdata-su-foto\b/);
        await page.goto(rotta, { waitUntil: "domcontentloaded" });
        expect(await page.evaluate(() => document.documentElement.hasAttribute("data-hero-intro"))).toBe(false);
        const h1 = page.locator("[data-testa] h1").first();
        await expect(h1).toBeVisible();
        expect(((await h1.textContent()) ?? "").trim().length, `${rotta}: H1 vuoto`).toBeGreaterThan(3);
        await expect(h1, `${rotta}: l'H1 non è bianco`).toHaveCSS("color", BIANCO);
        const g = await geometria(page);
        expect(g.sticky, `${rotta}: uno sticky solo senza JS, il riquadro (A41)`).toBe(1);
        expect(g.corridoi).toBe(0);
        expect(Math.abs(g.strato!.height - g.riquadro!.height), `${rotta}: lo strato non è il riquadro`).toBeLessThanOrEqual(1);
        expect(g.trasformata).toMatch(FERMA);
        expect(g.riquadro!.height).toBeGreaterThan(100);
        expect(g.stili.h1!.shadow).toBe("none");
      }
    });
  });

  test.describe("con moto ridotto", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("nove teste: strato uguale al riquadro, nessuna trasformata dopo lo scroll, nessun corridoio, testi bianchi dentro", async ({ page, goto }) => {
      for (const rotta of ROTTE_TESTA) {
        await goto(rotta);
        await page.waitForLoadState("load");
        expect(await page.evaluate(() => document.documentElement.hasAttribute("data-hero-intro"))).toBe(false);
        const g = await geometria(page);
        expect(Math.abs(g.strato!.height - g.riquadro!.height), `${rotta}: lo strato non è il riquadro`).toBeLessThanOrEqual(1);
        expect(g.corridoi).toBe(0);
        expect(g.stili.h1!.color).toBe(BIANCO);
        expect(g.stili.lead!.color).toBe(BIANCO);
        expect(Math.abs(g.blocco!.top)).toBeLessThanOrEqual(1);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
        await page.waitForTimeout(400);
        expect((await geometria(page)).trasformata, `${rotta}: con moto ridotto lo strato si muove`).toMatch(FERMA);
      }
    });
  });
});

// ── CLS 0 ──────────────────────────────────────────────────────────────────
// D191: altezza della scatola in svh dal CSS del server, blocco assoluto da lg, in flusso sotto lg con i
// font self-hosted: il primo paint è già quello finale, e la scatola che cresce (/servizi de a 390) non sposta nulla.
test.describe("CLS 0", () => {
  const cls = async (page: Page, goto: (p: string) => Promise<void>, rotta: string, corsa: number) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __dtCls: number };
      w.__dtCls = 0;
      new PerformanceObserver((lista) => {
        for (const voce of lista.getEntries() as Array<PerformanceEntry & { hadRecentInput?: boolean; value?: number }>) {
          if (!voce.hadRecentInput) w.__dtCls += voce.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await goto(rotta);
    await idratata(page);
    await page.waitForLoadState("load");
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), corsa);
    await page.waitForTimeout(600);
    return page.evaluate(() => (window as unknown as { __dtCls: number }).__dtCls);
  };

  test("a 1440×900 su /vendi, /metodo, /chi-siamo: nessuno spostamento di layout dal primo paint alla fine della corsa", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "desktop-1440", "una misura per fascia");
    for (const rotta of ["/vendi", "/metodo", "/chi-siamo"]) expect(await cls(page, goto, rotta, 900), rotta).toBe(0);
  });

  test("a 390×844 su /vendi, /metodo, /chi-siamo e /servizi in de (la scatola che cresce): 0", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "mobile-390", "una misura per fascia");
    await page.setViewportSize({ width: 390, height: 844 });
    for (const rotta of ["/vendi", "/metodo", "/chi-siamo"]) expect(await cls(page, goto, rotta, 844), rotta).toBe(0);
    await lingua(page, "de");
    expect(await cls(page, goto, "/servizi", 949), "/servizi de").toBe(0);
  });
});

// ── sizes sotto lg ─────────────────────────────────────────────────────────
// D183: in un riquadro 100svh un telefono verticale dipinge la foto per 100svh·r di larghezza (1266 /
// 1501 / 1518 px CSS a 390×844 per 3:2 / 16:9 / 1,8); `sizes` apre con 338vw / 400vw / 405vw e a DPR 2
// il browser riceve il bucket 2560 sulle sorgenti 2560 e 1920 sulle 1920 (dichiarato: ×1,32 e ×1,58).
test.describe("sizes sotto lg", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  test("390×844 a DPR 2 su /vendi (3:2), /metodo (16:9) e /chi-siamo (1,8): il primo termine, il bucket vero, la larghezza dipinta", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "mobile-390", "il caso a DPR 2 vive nel project del telefono");
    // Il srcset di next/image è la lista dei deviceSizes qualunque sia la sorgente: a DPR 2 il browser chiede
    // sempre `w=2560`; l'ottimizzatore non ingrandisce mai, e sulle sorgenti 1920 il bitmap che arriva è 1920.
    const casi = [
      { rotta: "/vendi" as Rotta, primo: "338vw", dipinta: 1266 },
      { rotta: "/metodo" as Rotta, primo: "400vw", dipinta: 1501 },
      { rotta: "/chi-siamo" as Rotta, primo: "405vw", dipinta: 1518 },
    ];
    for (const c of casi) {
      await goto(c.rotta);
      await idratata(page);
      await page.locator("[data-testa-strato] img").first().evaluate((el) => (el as HTMLImageElement).decode().catch(() => undefined));
      const g = await geometria(page);
      expect(g.dpr).toBe(2);
      const [sw, sh] = tinte[c.rotta].sorgente;
      expect(g.sizes!.startsWith(`(max-width: 1023.98px) ${c.primo}, `), `${c.rotta}: sizes ${g.sizes}`).toBe(true);
      expect(sizesSottoLg(sw / sh)).toBe(c.primo);
      expect(bucketDi(g.currentSrc), `${c.rotta}: bucket`).toBe(2560);
      // `naturalWidth` di un candidato `w` è corretto per la densità (2560 / 1318 css px ≈ 1,94): il bitmap
      // vero si legge dal file servito.
      const bitmap = (await sharp(await (await page.request.get(g.currentSrc!)).body()).metadata()).width ?? 0;
      expect(bitmap, `${c.rotta}: il bitmap non è min(2560, sorgente)`).toBe(Math.min(2560, sw));
      const dipinta = Math.max(g.riquadro!.width, (g.riquadro!.height * sw) / sh);
      expect(Math.abs(dipinta - c.dipinta), `${c.rotta}: dipinta ${dipinta.toFixed(0)}`).toBeLessThanOrEqual(2);
      // Il bitmap chiesto (dipinta × 2) contro quello che arriva: 1,000 sulle 2560 (×1,17 sulla 16:9), ×1,58 dichiarato sulle 1920 (D183).
      const ingr = (dipinta * 2) / bitmap;
      expect(ingr, `${c.rotta}: ingrandimento ×${ingr.toFixed(2)}`).toBeLessThanOrEqual(sw >= 2560 ? (sw / sh > 1.7 ? 1.18 : 1.001) : 1.6);
    }
  });
});

// ── le tinte (R2) ──────────────────────────────────────────────────────────
// D78/D125: PageHero, che è server, scrive la tinta alta della rotta in uno <style> dentro il proprio
// albero, NON in <head> con `precedence`: dopo una navigazione client la pagina terrebbe la tinta della
// prima rotta visitata. Qui si naviga davvero lato client e si legge `--dt-tinta-alta` dopo ogni cambio.
async function vaiClient(page: Page, path: string) {
  await page.evaluate(() => {
    (window as unknown as { __dtStessoDoc?: number }).__dtStessoDoc = 1;
  });
  await page.evaluate((p) => {
    const a = document.querySelector<HTMLAnchorElement>(`footer a[href="${p}"]`);
    if (!a) throw new Error(`nessun link a ${p} nel piè di pagina`);
    a.click();
  }, path);
  await page.waitForURL((u) => u.pathname === path, { timeout: 15_000 });
  expect(await page.evaluate(() => (window as unknown as { __dtStessoDoc?: number }).__dtStessoDoc), `il link verso ${path} ha caricato un documento nuovo`).toBe(1);
}
async function tinteSulRoot(page: Page) {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      alta: cs.getPropertyValue("--dt-tinta-alta").trim().toLowerCase(),
      opLg: cs.getPropertyValue("--dt-op-lg").trim(),
      stili: [...document.querySelectorAll("style")].filter((s) => s.textContent?.includes("--dt-tinta-alta")).length,
    };
  });
}
test.describe("le tinte", () => {
  test("cambiano con la navigazione client e non restano appiccicate alla rotta di prima", async ({ page, goto }) => {
    const giro: Array<[string, Rotta | null]> = [
      ["/servizi", "/servizi"],
      ["/metodo", "/metodo"],
      ["/contatti", null],
      ["/lavora-con-noi", "/lavora-con-noi"],
    ];
    await goto(giro[0][0]);
    await idratata(page);
    for (const [i, [path, rotta]] of giro.entries()) {
      if (i > 0) await vaiClient(page, path);
      const atteso = rotta
        ? { alta: (await tintaAttesa(page, rotta)).replace(/^rgb\((\d+), (\d+), (\d+)\)$/, (_, r, g, b) => `#${[r, g, b].map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`), opLg: tinte[rotta].objectPosition.lg, stili: 1 }
        : { alta: "", opLg: "", stili: 0 };
      await expect
        .poll(
          async () => {
            const t = await tinteSulRoot(page);
            // L'avorio arriva come var(): il browser lo risolve al suo hex; qui si confronta l'hex.
            return { ...t, alta: t.alta.startsWith("var(") ? await page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim().toLowerCase(), TOKEN_ALTA) : t.alta };
          },
          { timeout: 10_000, message: `${path}: la tinta su :root non è quella della rotta` },
        )
        .toEqual(atteso);
    }
  });

  test("il placeholder tinto sta sul riquadro della testa, non sugli altri moduli media (D125)", async ({ page, goto }) => {
    await goto("/vendi");
    const testa = await page.locator("[data-dive-zoom]").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(testa, "il riquadro della testa non prende la tinta alta").toBe(await tintaAttesa(page, "/vendi"));
    const modulo = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "dt-media-full";
      document.querySelector("main")!.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    });
    expect(modulo).toBe(rgb("#f4ece2"));
  });
});

// ── l'aggancio della ricerca (R1) ──────────────────────────────────────────
test.describe("l'aggancio della ricerca", () => {
  async function triggerFermi(page: Page) {
    let prima = -1;
    let n = -2;
    await expect
      .poll(
        async () => {
          prima = n;
          n = await page.evaluate(() => window.__dtST!());
          return n === prima;
        },
        { timeout: 10_000, intervals: [500], message: "il numero dei ScrollTrigger non si ferma" },
      )
      .toBe(true);
    return n;
  }

  test("armato tre volte, il pannello porta uno ScrollTrigger solo", async ({ page, goto }) => {
    await goto("/");
    await idratata(page);
    const panel = page.locator("[data-dock-panel]");
    await expect.poll(() => panel.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 10_000 }).toBeLessThan(0.5);
    const n0 = await triggerFermi(page);
    for (let giro = 1; giro <= 2; giro += 1) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis")), { timeout: 5000 }).toBe(false);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await idratata(page);
      await expect
        .poll(() => panel.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 10_000, message: `giro ${giro}: il pannello non si è riarmato` })
        .toBeLessThan(0.5);
      expect(await triggerFermi(page), `giro ${giro}: i ScrollTrigger non tornano quelli di prima`).toBe(n0);
    }
    await panel.locator("input").first().evaluate((el) => (el as HTMLInputElement).focus({ preventScroll: true }));
    expect(await triggerFermi(page), "il fuoco non ha tolto esattamente lo ScrollTrigger del pannello").toBe(n0 - 1);
    await expect.poll(() => panel.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThanOrEqual(0.999);
  });
});
