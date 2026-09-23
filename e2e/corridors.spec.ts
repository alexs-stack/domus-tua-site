import type { Locator, Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { productOpacity, settle, wheelTo } from "./coreografia";
import { LAST_Y_KEY } from "../app/lib/motion/intro-constants";

// I corridoi sticky: A19 di Alberto («Sticky dove serve»), soglia D22 (spec §4 e §9.2).
//
// Oggi in home ne sono accesi tre, ognuno con la sua meccanica:
// - il nastro (storia);
// - le stelle (recensioni);
// - la rotaia (team).
// Ogni corridoio nuovo allunga EXPECTED_HOME, SCREEN_ROUTES o EXPECTED_VENDI
// nel suo commit.
// Il gate è 1024 px di larghezza, 640 di altezza e motion ok: sotto quella
// soglia, a 390 e con reduced motion non c'è nessun corridoio.

/** Gli host accesi sulla home a 1024×768 e 1440×900, in ordine alfabetico (A49: il tuffo dell'hero è morto;
    A72: il nastro di Costi chiari, `costi`). */
const EXPECTED_HOME = ["cartolina", "costi", "finestra", "recensioni", "storia", "team"];
/** Gli host accesi su /vendi a 1440×900: nessuno, dal 20 settembre 2026 (A38/A41: la testa di
    era è sticky e ferma; il tuffo "page-dive" e i capitoli di pagina "ingresso" e "soglia" sono morti). */
const EXPECTED_VENDI: string[] = [];
/** Le rotte, e su ognuna i corridoi che hanno uno schermo [data-corridor-screen] da misurare. */
const SCREEN_ROUTES: Array<{ path: string; screens: string[] }> = [
  { path: "/", screens: ["cartolina"] },
];
/**
 * Il contenitore dei testi quando non è lo schermo, relativo all'host. Nella
 * finestra di Open Domus (A19, spec §3.10) lo schermo è la zona delle tende,
 * aria-hidden e senza testo; il testo sta nello stage, fratello dello schermo,
 * sotto la foto di 100svh. Gli host con una voce qui si misurano a fine
 * corridoio contro il viewport; gli altri in cima alla pagina, contro il
 * bordo basso del loro schermo.
 */
// A57: la finestra è un nastro e non ha più uno stage col testo sotto lo schermo: nessuna voce.
const SCREEN_TEXT: Partial<Record<string, string>> = {};

async function hostsOn(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-corridor][data-on]"), (el) => el.dataset.corridor ?? "").sort(),
  );
}

/**
 * Aspetta che GSAP abbia scelto il ramo (D22). Con motion ok, sulla home, le
 * stelle portano data-on (corridoio) o data-sr-mob (sotto la soglia).
 * Altrimenti si aspettano il load e un secondo e mezzo. Non va confuso con
 * `settle` di coreografia.ts, che aspetta lo scroll fermo.
 */
async function waitGate(page: Page, motion = true) {
  await page.waitForLoadState("load");
  if (motion && (await page.locator(".dt-starrev").count()) > 0) {
    await expect(page.locator(".dt-starrev[data-on], .dt-starrev[data-sr-mob]")).toHaveCount(1, { timeout: 15_000 });
  } else {
    await page.waitForTimeout(1_500);
  }
}

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

test.describe("quali corridoi si accendono", () => {
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`a ${vp.width}×${vp.height} la home accende i corridoi della lista`, async ({ page, goto, isMobile }) => {
      test.skip(!!isMobile, "misura dei corridoi da desktop");
      await page.setViewportSize(vp);
      await goto("/");
      await waitGate(page);
      await expect.poll(() => hostsOn(page)).toEqual(EXPECTED_HOME);
    });
  }

  for (const vp of [
    { width: 1440, height: 600 },
    { width: 1280, height: 600 },
  ]) {
    test(`a ${vp.width}×${vp.height} nessun corridoio: l'altezza è sotto 640 (D22)`, async ({ page, goto, isMobile }) => {
      test.skip(!!isMobile, "misura dei corridoi da desktop");
      await page.setViewportSize(vp);
      await goto("/");
      await waitGate(page);
      await expect(page.locator(".dt-starrev")).toHaveAttribute("data-sr-mob", "");
      expect(await hostsOn(page)).toEqual([]);
      const sticky = await page.evaluate(() =>
        [".dt-horizon_screen", ".dt-starrev_screen", ".dt-railway > .dt-rail"].filter((sel) => {
          const el = document.querySelector(sel);
          return !!el && getComputedStyle(el).position === "sticky";
        }),
      );
      expect(sticky).toEqual([]);
    });
  }

  test("a 1440×600 la rotaia resta nativa con indicatore e pan, le stelle suonano nel box (D22)", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "misura dei corridoi da desktop");
    await page.setViewportSize({ width: 1440, height: 600 });
    await goto("/");
    await waitGate(page);
    const rail = page.locator("#chi-siamo .dt-rail").first();
    expect(await rail.getAttribute("data-on")).toBeNull();
    expect(await rail.evaluate((el) => getComputedStyle(el).overflowX)).toBe("auto");
    // RailProgress è l'ultimo figlio di .dt-railway, aria-hidden: con MQ.belowCorridor (D22) si vede.
    const progress = page.locator("#chi-siamo .dt-railway > div[aria-hidden]").last();
    await expect.poll(() => progress.evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
    const room = await rail.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(room, "a 1440×600 la rotaia deve avere tessere fuori campo").toBeGreaterThan(1);
    const pan = rail.locator(".dt-rail_pan").first();
    const panBefore = await pan.evaluate((el) => getComputedStyle(el).transform);
    await rail.evaluate((el, x) => {
      el.scrollLeft = x;
    }, Math.min(400, room));
    await expect.poll(() => pan.evaluate((el) => getComputedStyle(el).transform)).not.toBe(panBefore);

    // Le stelle sotto la soglia (A12 invariato, D22): il box del film è alto al più 62svh e sta dentro la sezione (StarReviews.tsx:292).
    const box = await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>(".dt-starrev");
      const intro = section?.querySelector<HTMLElement>(".dt-starrev_intro");
      if (!section || !intro) return null;
      const s = section.getBoundingClientRect();
      const b = intro.getBoundingClientRect();
      return { h: b.height, top: b.top - s.top, bottom: s.bottom - b.bottom, ih: window.innerHeight };
    });
    expect(box).not.toBeNull();
    expect(box!.h).toBeLessThanOrEqual(box!.ih * 0.62 + 1);
    expect(box!.top).toBeGreaterThanOrEqual(-1);
    expect(box!.bottom).toBeGreaterThanOrEqual(-1);

    const team = await page.locator("#chi-siamo").evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY));
    await wheelTo(page, team);
    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflowX).toBeLessThanOrEqual(1);
  });

  test("a 390 nessun corridoio", async ({ page, goto, isMobile }) => {
    test.skip(!isMobile, "progetto mobile-390");
    await goto("/");
    await waitGate(page);
    expect(await hostsOn(page)).toEqual([]);
  });

  test("su /vendi a 1440 i corridoi delle pagine interne", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "misura dei corridoi da desktop");
    await goto("/vendi");
    await waitGate(page);
    await expect.poll(() => hostsOn(page)).toEqual(EXPECTED_VENDI);
  });
});

test.describe("prima dell'idratazione", () => {
  /** I chunk JS di Next: abortiti, resta il primo paint (boot script e CSS); in ritardo, il primo paint si separa dall'idratazione. */
  const CHUNK = /\/_next\/static\/chunks\/[^?]+\.js(\?.*)?$/;

  test("a 1440×900 le stelle hanno runway e schermo sticky dal CSS (spec §4, D22)", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "misura dei corridoi da desktop");
    // Layout prima del paint (D22): si fermano solo i chunk JS di Next. Lo script
    // di boot inline gira e scrive data-hero-intro, React no. Il CSS resta servito.
    await page.route(CHUNK, (route) => route.abort());
    await goto("/");
    const m = await page.evaluate(() => {
      const section = document.querySelector<HTMLElement>(".dt-starrev");
      const runway = section?.querySelector<HTMLElement>(".dt-starrev_runway");
      const screen = section?.querySelector<HTMLElement>(".dt-starrev_screen");
      return {
        intro: document.documentElement.hasAttribute("data-hero-intro"),
        on: section ? section.hasAttribute("data-on") : null,
        runway: runway ? runway.getBoundingClientRect().height : 0,
        position: screen ? getComputedStyle(screen).position : "",
        ih: window.innerHeight,
      };
    });
    expect(m.intro, "lo script di boot non ha scritto data-hero-intro").toBe(true);
    expect(m.on, "c'è data-on: React ha girato e il test non misura il CSS").toBe(false);
    expect(Math.abs(m.runway - 3.6 * m.ih)).toBeLessThanOrEqual(2);
    expect(m.position).toBe("sticky");
  });

  // I nastri e la rotaia prima del paint (23 set. 2026; globals.css, nastro-prepaint.test.ts). Fino ad
  // allora [data-on] e l'altezza arrivavano solo da JS: a 1440×900 storia passava da 1264 a 2995 px
  // all'idratazione, la finestra da 6170 a 5501, i costi da 4002 a 5103, la rotaia da 819 a 1513, e
  // tutto ciò che sta sotto saltava con loro. Qui la stessa home due volte: coi chunk JS abortiti (il
  // primo paint, solo boot script e CSS) e idratata. Host, stage delle stelle e capitoli dopo devono
  // stare alla stessa quota e alla stessa altezza, al più 2 px (gli arrotondamenti di size()).
  // Col consenso accettato (il beforeEach del file) anche il cancello di Trustindex in Voci conta: il
  // server lo rende e all'idratazione arriva il widget, che prima del paint era 375 px più alto
  // (globals.css, `.dt-voci_cancello`). Le terze parti restano finte (`guards`): il widget vero dichiara
  // la sua altezza quando carica (399 px a 1440×900 contro i 480 riservati), e quel salto è di Trustindex,
  // non del layout del sito.
  const geometria = (page: Page) =>
    page.evaluate(() => {
      const box = (sel: string) => {
        const el = document.querySelector<HTMLElement>(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top + window.scrollY), h: Math.round(r.height) };
      };
      return {
        host: {
          storia: box("#storia"),
          finestra: box("#open-domus"),
          costi: box("#costi"),
          rotaia: box('.dt-railway[data-corridor="team"]'),
          stage: box(".dt-starrev_stage"),
          metodo: box("#metodo"),
          contatti: box("#contatti"),
        },
        doc: document.documentElement.scrollHeight,
        on: Array.from(document.querySelectorAll("[data-corridor][data-on]")).length,
        schermo: getComputedStyle(document.querySelector("#storia .dt-horizon_screen")!).position,
      };
    });
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`a ${vp.width}×${vp.height} nastri, rotaia e stelle hanno al primo paint la geometria dell'idratazione`, async ({ page, goto, guards, isMobile }) => {
      test.skip(!!isMobile, "misura dei corridoi da desktop");
      void guards; // il mock delle terze parti
      await page.setViewportSize(vp);
      await page.route(CHUNK, (route) => route.abort());
      await goto("/");
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const prima = await geometria(page);
      expect(prima.on, "c'è data-on: React ha girato e il test non misura il CSS").toBe(0);
      expect(prima.schermo, "lo schermo del nastro non è sticky prima del paint").toBe("sticky");

      await page.unroute(CHUNK);
      await goto("/");
      await waitGate(page);
      await expect.poll(() => hostsOn(page)).toEqual(EXPECTED_HOME);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const dopo = await geometria(page);
      for (const [nome, p] of Object.entries(prima.host)) {
        const d = dopo.host[nome as keyof typeof dopo.host];
        expect(p && d, `${nome}: manca`).toBeTruthy();
        expect(Math.abs(p!.h - d!.h), `${nome}: alto ${p!.h} px al primo paint e ${d!.h} idratato`).toBeLessThanOrEqual(2);
        expect(Math.abs(p!.top - d!.top), `${nome}: a ${p!.top} px al primo paint e a ${d!.top} idratato`).toBeLessThanOrEqual(2);
      }
      expect(Math.abs(prima.doc - dopo.doc)).toBeLessThanOrEqual(2);
    });

    // La misura del 23 settembre (1440×900, chunk in ritardo di 1,5 s, ricarica appena sotto #voci):
    // il ripristino nativo arrivava a 12018 e all'idratazione una voce layout-shift da 1,0. Qui la
    // stessa ricarica e altre tre quote: dentro la finestra (il nastro con salita e coda), a metà delle
    // stelle (lo stage) e su #contatti (sotto tutti i nastri e la rotaia).
    test(`a ${vp.width}×${vp.height} ricaricando sotto #voci, nella finestra, fra le stelle e su #contatti il layout non salta all'idratazione`, async ({ page, goto, guards, isMobile }) => {
      test.skip(!!isMobile, "i nastri e la rotaia vivono da 1024");
      void guards; // il mock delle terze parti
      await page.setViewportSize(vp);
      // L'osservatore entra a ogni caricamento prima degli script della pagina.
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: { v: number; src: string[] }[] };
        w.__cls = [];
        new PerformanceObserver((lista) => {
          for (const e of lista.getEntries() as unknown as { value: number; hadRecentInput: boolean; sources?: { node?: Node | null }[] }[]) {
            if (e.hadRecentInput) continue;
            w.__cls.push({
              v: e.value,
              src: (e.sources ?? []).map((s) => (s.node instanceof Element ? `${s.node.tagName.toLowerCase()}${s.node.id ? `#${s.node.id}` : ""}.${Array.from(s.node.classList).slice(0, 2).join(".")}` : "?")),
            });
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      // Il primo paint si separa dall'idratazione: i chunk arrivano 1,5 s dopo il documento.
      await page.route(CHUNK, async (route) => {
        await new Promise((r) => setTimeout(r, 1_500));
        await route.continue();
      });
      await goto("/");
      await waitGate(page);
      const quote: Array<[string, string, number, number]> = [
        ["sotto #voci", "#voci", 1, 0.5],
        ["a metà della finestra", "#open-domus", 0.5, 0],
        ["a metà delle stelle", "#recensioni", 0.5, 0],
        ["su #contatti", "#contatti", 0.2, 0],
      ];
      for (const [dove, sel, frazione, sopra] of quote) {
        const y = await page.evaluate(
          ([s, f, o]) => {
            const r = document.querySelector(s as string)!.getBoundingClientRect();
            return Math.round(r.top + window.scrollY + (f as number) * r.height - (o as number) * window.innerHeight);
          },
          [sel, frazione, sopra] as const,
        );
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(800);
        await page.reload({ waitUntil: "load" });
        await waitGate(page);
        await page.waitForTimeout(1_500);
        const voci = await page.evaluate(() => (window as unknown as { __cls: { v: number; src: string[] }[] }).__cls);
        const cls = voci.reduce((a, e) => a + e.v, 0);
        expect(cls, `${dove} (y ${y}): CLS ${cls.toFixed(4)} — ${voci.map((e) => `${e.v.toFixed(3)} ${e.src.join(", ")}`).join(" | ")}`).toBeLessThan(0.01);
      }
    });
  }
});

test.describe("con reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("nessun corridoio e nessuno spaziatore acceso", async ({ page, goto }) => {
    await goto("/");
    await waitGate(page, false);
    expect(await hostsOn(page)).toEqual([]);
    const runs = await page.evaluate(
      () => Array.from(document.querySelectorAll("[data-corridor-run]")).filter((el) => getComputedStyle(el).display !== "none").length,
    );
    expect(runs).toBe(0);
  });
});

test.describe("dentro i corridoi", () => {
  for (const route of SCREEN_ROUTES) {
    for (const vp of [
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
    ]) {
      for (const lang of ["it", "de"] as const) {
        test(`${route.path} a ${vp.width}×${vp.height} in ${lang}: i testi degli schermi stanno negli schermi`, async ({
          page,
          goto,
          isMobile,
        }) => {
          test.skip(!!isMobile, "misura dei corridoi da desktop");
          await page.context().addCookies([{ name: "dt_locale", value: lang, domain: "127.0.0.1", path: "/" }]);
          await page.setViewportSize(vp);
          await goto(route.path);
          await waitGate(page);
          // LocaleProvider passa alla lingua del cookie in un effetto passivo
          // (spec §2.3): si misura dopo il cambio e coi font caricati (D22).
          await expect(page.locator("html")).toHaveAttribute("lang", lang);
          await page.evaluate(() => document.fonts.ready.then(() => true));
          /**
           * Nel browser: per ogni host acceso scelto, l'ultimo rigo di testo del
           * contenitore contro il suo limite. `only` null prende gli host senza
           * voce in SCREEN_TEXT; una lista prende quelli elencati. Il limite è il
           * bordo basso dello schermo (`screen`) o del viewport (`viewport`).
           */
          const measure = (only: string[] | null, limit: "screen" | "viewport") =>
            page.evaluate(
              (arg) =>
                Array.from(document.querySelectorAll<HTMLElement>("[data-corridor][data-on]"))
                  .filter((host) => {
                    const id = host.dataset.corridor ?? "";
                    return arg.only === null ? !(id in arg.texts) : arg.only.includes(id);
                  })
                  .flatMap((host) => {
                    const id = host.dataset.corridor ?? "";
                    const screen = host.querySelector<HTMLElement>("[data-corridor-screen]");
                    if (!screen) return [];
                    const sel = arg.texts[id];
                    const box = sel ? host.querySelector<HTMLElement>(sel) : screen;
                    if (!box) return [{ id, over: 9999, lines: 0 }];
                    const bottom = arg.limit === "screen" ? screen.getBoundingClientRect().bottom : window.innerHeight;
                    const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
                    let last = Number.NEGATIVE_INFINITY;
                    let lines = 0;
                    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
                      if (!n.textContent?.trim()) continue;
                      const range = document.createRange();
                      range.selectNodeContents(n);
                      // Un rettangolo alto 1 px è il testo sr-only dei titoli (spec §2.3, A20): non si vede e non conta.
                      for (const r of Array.from(range.getClientRects())) {
                        if (r.height <= 1) continue;
                        lines += 1;
                        last = Math.max(last, r.bottom);
                      }
                    }
                    const over = Number.isFinite(last) ? Math.round(last - bottom) : 0;
                    return [{ id, over, lines }];
                  }),
              { texts: SCREEN_TEXT, only, limit },
            );
          // Host senza voce in SCREEN_TEXT: da fermi, in cima alla pagina, il testo
          // sta nello schermo e si misura contro il bordo basso dello schermo.
          const report = await measure(null, "screen");
          // Host con voce in SCREEN_TEXT (la finestra, dal commit 13): il testo sta
          // nello stage, sotto la foto di 100svh, e a scroll 0 è sotto lo schermo
          // per costruzione. Si scrolla a fine corridoio (bordo basso dell'host al
          // bordo basso del viewport: p 1, schermo `visibility: hidden`, stage a
          // scala 1) e il limite è il viewport: spec §2.7 e §3.10 (A19), «i testi
          // dello schermo stanno dentro 100svh nella lingua più lunga».
          for (const id of (await hostsOn(page)).filter((h) => h in SCREEN_TEXT)) {
            const host = page.locator(`[data-corridor="${id}"][data-on]`).first();
            const end = await host.evaluate(
              (el) => el.getBoundingClientRect().top + window.scrollY + (el as HTMLElement).offsetHeight - window.innerHeight,
            );
            await wheelTo(page, Math.round(end));
            // Scrub 0,15 s (spec §3.10) più la coda di Lenis: 600 ms bastano.
            await page.waitForTimeout(600);
            report.push(...(await measure([id], "viewport")));
          }
          expect(report.map((r) => r.id).sort()).toEqual(route.screens);
          // Un contenitore di SCREEN_TEXT senza testo renderebbe il test vuoto (spec §3.10, A19).
          expect(report.filter((r) => r.id in SCREEN_TEXT && r.lines === 0)).toEqual([]);
          expect(report.filter((r) => r.over > 1)).toEqual([]);
        });
      }
    }
  }

  test("a 1440 gli antenati degli sticky non hanno transform, ritagli né overflow che crei un contenitore, da fermi e in corsa", async ({
    page,
    goto,
    isMobile,
  }) => {
    test.skip(!!isMobile, "misura dei corridoi da desktop");
    await goto("/");
    await waitGate(page);
    await expect.poll(() => hostsOn(page)).toEqual(EXPECTED_HOME);
    // Spec §8 (A19): nessun transform, clip-path od overflow hidden/auto/scroll
    // su un antenato dello sticky più esterno di ogni host acceso.
    const faults = (only: string | null) =>
      page.evaluate((id) => {
        const out: string[] = [];
        const hosts = Array.from(document.querySelectorAll<HTMLElement>("[data-corridor][data-on]")).filter(
          (h) => id === null || h.dataset.corridor === id,
        );
        for (const host of hosts) {
          const all = [host, ...Array.from(host.querySelectorAll<HTMLElement>("*"))].filter(
            (el) => getComputedStyle(el).position === "sticky",
          );
          const outer = all.filter((s) => !all.some((o) => o !== s && o.contains(s)));
          if (outer.length === 0) out.push(`${host.dataset.corridor}: nessuno sticky`);
          for (const s of outer) {
            for (let a = s.parentElement; a; a = a.parentElement) {
              const cs = getComputedStyle(a);
              const name = `${a.tagName.toLowerCase()}${a.id ? `#${a.id}` : ""}`;
              if (cs.transform !== "none") out.push(`${host.dataset.corridor}: transform su ${name}`);
              if (/hidden|auto|scroll/.test(`${cs.overflowX} ${cs.overflowY}`)) {
                out.push(`${host.dataset.corridor}: overflow ${cs.overflowX}/${cs.overflowY} su ${name}`);
              }
              if (cs.clipPath !== "none") out.push(`${host.dataset.corridor}: clip-path ${cs.clipPath} su ${name}`);
            }
          }
        }
        return out;
      }, only);

    expect(await faults(null)).toEqual([]);
    // In corsa: a metà di ogni host, dopo che lo scrub ha scritto i suoi transform (A19).
    for (const id of EXPECTED_HOME) {
      const mid = await page
        .locator(`[data-corridor="${id}"]`)
        .evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY + (el as HTMLElement).offsetHeight * 0.5));
      await wheelTo(page, mid);
      await page.waitForTimeout(400);
      expect(await faults(id), `a metà di ${id}`).toEqual([]);
    }
  });

  for (const vp of [
    { width: 1440, height: 600, mobile: false },
    { width: 390, height: 844, mobile: true },
  ]) {
    test(`a ${vp.width}×${vp.height} i testi di Open Domus e del Congedo arrivano a opacità 1`, async ({
      page,
      goto,
      isMobile,
    }) => {
      test.skip(!!isMobile !== vp.mobile, vp.mobile ? "progetto mobile-390" : "progetto desktop");
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await goto("/");
      await waitGate(page);
      // Spec §9.2 e §3.10 (A19, D22): tutti i testi, non solo il titolo. Si misurano
      // i ruoli [data-reveal] dei commit 4-6; un capitolo ancora senza ruoli si
      // misura sui suoi h2 e p. Titolo e lead: la prima foglia [data-c] o .dt-line
      // (le righe di Lead dal commit 6; .tl-line resta solo a FrozenLines, sotto
      // /case/[slug], dove questo test non passa); ctn e still: l'elemento stesso.
      for (const chapterSel of ["#open-domus", "section:has(#congedo-title)"]) {
        const chapter = page.locator(chapterSel).first();
        const roles = chapter.locator("[data-reveal]");
        const targets: Locator = (await roles.count()) > 0 ? roles : chapter.locator("h2, p");
        const n = await targets.count();
        expect(n, `${chapterSel}: nessun testo da misurare`).toBeGreaterThan(0);
        for (let i = 0; i < n; i++) {
          const el = targets.nth(i);
          const y = await el.evaluate((node) => node.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5);
          await wheelTo(page, Math.max(0, Math.round(y)));
          const leaf = el.locator("[data-c], .dt-line").first();
          const target = (await leaf.count()) > 0 ? leaf : el;
          await expect
            .poll(() => productOpacity(target), { timeout: 3_500, message: `${chapterSel}, testo ${i + 1} di ${n}` })
            .toBeGreaterThanOrEqual(0.99);
        }
      }
    });
  }

  test("a 1440 la ricarica a metà di #servizi torna al capitolo (±2 px)", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "i corridoi misurati da JS esistono solo da desktop");
    // Ripristino al capitolo (D22, spec §2.7). Il ripristino nativo è spento:
    // ScrollTrigger rilegge history.scrollRestoration all'avvio e lo rimette
    // dopo ogni refresh, quindi resta "manual". Allo scarto salvato si
    // aggiungono 120 px: arriva al punto giusto solo il codice che legge id e
    // dy e scrolla a top(id) + dy, non il browser.
    await page.addInitScript((key) => {
      history.scrollRestoration = "manual";
      try {
        const s = JSON.parse(sessionStorage.getItem(key) ?? "null") as { dy?: unknown } | null;
        if (s && typeof s.dy === "number") {
          s.dy += 120;
          sessionStorage.setItem(key, JSON.stringify(s));
        }
      } catch {
        /* storage negato (D22): il poll qui sotto fallisce, com'è giusto */
      }
    }, LAST_Y_KEY);
    await goto("/");
    await waitGate(page);
    await expect.poll(() => hostsOn(page)).toEqual(EXPECTED_HOME);
    const mid = await page
      .locator("#servizi")
      .evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY + (el as HTMLElement).offsetHeight / 2));
    await wheelTo(page, mid);
    await page.waitForTimeout(600);
    const title = page.locator("#servizi h2").first();
    const before = await title.evaluate((el) => el.getBoundingClientRect().top);

    await page.reload({ waitUntil: "load" });
    const saved = JSON.parse(
      (await page.evaluate((key) => sessionStorage.getItem(key), LAST_Y_KEY)) ?? "null",
    ) as { p: string; id: string; dy: number } | null;
    expect(saved?.p).toBe("/");
    expect(saved?.id).toBe("servizi");
    expect(saved?.dy ?? -1).toBeGreaterThan(120);
    await expect
      .poll(async () => Math.abs((await title.evaluate((el) => el.getBoundingClientRect().top)) - (before - 120)), {
        timeout: 15_000,
      })
      .toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test("a 1440 chi scorre durante la ricarica non viene riportato al capitolo (D22)", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "i corridoi misurati da JS esistono solo da desktop");
    await page.addInitScript(() => {
      history.scrollRestoration = "manual";
    });
    await goto("/");
    await waitGate(page);
    await expect.poll(() => hostsOn(page)).toEqual(EXPECTED_HOME);
    const mid = await page
      .locator("#servizi")
      .evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY + (el as HTMLElement).offsetHeight / 2));
    await wheelTo(page, mid);
    await page.waitForTimeout(600);
    const title = page.locator("#servizi h2").first();
    const before = await title.evaluate((el) => el.getBoundingClientRect().top);

    // Un foglio di stile lento tiene il load a 6 s (D22): fra il primo refresh,
    // che ripristina, e quello del load c'è il tempo di un gesto.
    await page.route("**/__dt-load-lento.css", async (route) => {
      await new Promise((r) => setTimeout(r, 6_000));
      await route.fulfill({ status: 200, contentType: "text/css", body: "" });
    });
    await page.addInitScript(() => {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "/__dt-load-lento.css";
          document.head.appendChild(link);
        },
        { once: true },
      );
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect
      .poll(async () => Math.abs((await title.evaluate((el) => el.getBoundingClientRect().top)) - before), { timeout: 5_000 })
      .toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => document.readyState), "il load è già arrivato: la prova non vale").not.toBe("complete");
    const restored = await page.evaluate(() => window.scrollY);
    await page.mouse.move(12, 450);
    await page.mouse.wheel(0, -300);
    const moved = await settle(page);
    expect(restored - moved).toBeGreaterThan(100);
    await page.waitForLoadState("load");
    await page.waitForTimeout(1_000);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - moved)).toBeLessThanOrEqual(2);
  });
});

// L'hero (A49, 22 set. 2026): non è più un corridoio. La foto alta scorre in flusso con la pagina a ogni
// larghezza (hero-alto.spec.ts); qui si pretende solo che #top non si accenda mai e non abbia schermo.
test.describe("l'hero non è un corridoio (A49)", () => {
  for (const vp of [
    { width: 1024, height: 768, mobile: false },
    { width: 1440, height: 600, mobile: false },
    { width: 390, height: 664, mobile: true },
  ]) {
    test(`a ${vp.width}×${vp.height} #top non porta data-on e non ha schermo né spaziatore`, async ({ page, goto, isMobile }) => {
      test.skip(!!isMobile !== vp.mobile, vp.mobile ? "progetto mobile-390" : "progetto desktop");
      if (!vp.mobile) await page.setViewportSize({ width: vp.width, height: vp.height });
      await goto("/");
      await waitGate(page);
      expect(await page.locator("#top").getAttribute("data-on")).toBeNull();
      expect(await page.locator("#top").getAttribute("data-corridor")).toBeNull();
      expect(await page.locator("#top [data-corridor-screen], #top [data-corridor-run]").count()).toBe(0);
    });
  }
});

// La finestra di Open Domus (A57/A58): un nastro come storia. Lo schermo sticky del nastro non ha antenati
// trasformati o ritagliati (spec §2.7); la cornice che sale è trasformata ma dentro il track, e non è
// antenata di nulla di sticky. Sotto la soglia non c'è nessun corridoio.
test.describe("la finestra fra i corridoi", () => {
  test("lo schermo del nastro della finestra è sticky e non ha antenati trasformati o ritagliati", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "il corridoio vive da 1024 px");
    await goto("/");
    await expect(page.locator("#open-domus")).toHaveAttribute("data-on", "");
    const colpevoli = await page.evaluate(() => {
      const out: string[] = [];
      const start = document.querySelector<HTMLElement>("#open-domus .dt-horizon_screen")!;
      for (let el = start.parentElement; el; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (s.transform !== "none" || /hidden|auto|scroll/.test(s.overflowY) || s.clipPath !== "none") {
          out.push(`${el.tagName}.${el.className}`);
        }
      }
      return out;
    });
    expect(colpevoli).toEqual([]);
    await expect(page.locator("#open-domus .dt-horizon_screen")).toHaveCSS("position", "sticky");
    expect(await page.locator("#open-domus .dt-od_cornice *").evaluateAll((els) => els.filter((e) => getComputedStyle(e).position === "sticky").length)).toBe(0);
  });

  // D28: /metodo e /open-domus rendono <OpenDomus /> senza finestra, col markup del capitolo.
  for (const path of ["/metodo", "/open-domus"]) {
    test(`su ${path} Open Domus resta il capitolo, senza finestra (D28)`, async ({ page, goto, isMobile }) => {
      test.skip(!!isMobile, "il corridoio vivrebbe da 1024 px");
      await goto(path);
      await waitGate(page);
      const od = page.locator("#open-domus");
      await expect(od).toHaveClass(/\bdt-chapter\b/);
      expect(await od.getAttribute("data-corridor")).toBeNull();
      expect(
        await page.locator("#open-domus .dt-od_window, #open-domus .dt-od_shutterzone, #open-domus [data-corridor]").count(),
      ).toBe(0);
      const facciata = od.locator("button").first();
      await facciata.scrollIntoViewIfNeeded();
      await expect(facciata).toBeVisible();
    });
  }
});
