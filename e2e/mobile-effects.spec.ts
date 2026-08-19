import type { Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";

// Fase 2 dell'onda «parità mobile 2» — hero e cromo (docs/mobile-parity-2.md,
// mandato §9.3): per ogni famiglia PORT si osserva a 390 LO STESSO TIPO di
// trasformazione del desktop — matrix con scala, clip-path che cambia,
// translateY legato allo scroll, variabili della maschera — mai un fade. E per
// ogni famiglia almeno una rotta non-home: CameraIn su /contatti, Parallax su
// /vendi, WordReveal su /lavora-con-noi, Footer su /privacy.
//
// Le regole ereditate da mobile-motion.spec.ts valgono qui identiche:
//  • sessione a caldo (fixture `goto`: `dt-intro-seen` in sessionStorage
//    prima del caricamento) così l'intro non entra nelle misure;
//  • prima di ogni gesto si aspetta un SEGNALE d'idratazione scritto dal JS
//    (`animation: none` sul blocco dell'hero, un inline transform, un
//    will-change, un attributo, una classe) — mai un timer fisso;
//  • le misure di scrub si prendono a scroll FERMO: `scrollTo` qui sotto
//    aspetta che scrollY sia arrivato e che due fotogrammi siano passati;
//    con Lenis a bordo il nativo `window.scrollTo` sincronizza comunque
//    ScrollTrigger (`onNativeScroll` → emit → ScrollTrigger.update), quindi lo
//    scrub è già alla quota quando si legge — e sotto carico si legge con
//    `expect.poll`, non una volta sola.
// I test dipendenti dalla larghezza portano `@layout` (playwright.site.config:
// i tre viewport intermedi eseguono solo quelli) e leggono i valori attesi
// dalla larghezza del progetto: 768 è la soglia degli effetti di sezione,
// 1024 quella dei set piece e della densità (Footer, Fioritura), 640 quella
// della MobileActionBar (il cue).

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

/** Larghezza del viewport del progetto corrente. */
const larghezza = (testInfo: { project: { use: { viewport?: { width: number } | null } } }) =>
  testInfo.project.use.viewport?.width ?? 0;

/**
 * Scroll programmatico a quota, e ritorno solo a scroll FERMO: scrollY entro
 * 1 px dalla quota (clampata al massimo) per due fotogrammi consecutivi. Il
 * `behavior: "instant"` sovrascrive lo `scroll-behavior: smooth` di <html>
 * (globals.css), che senza Lenis (reduced-motion) animerebbe la corsa.
 */
async function scrollTo(page: Page, y: number) {
  await page.evaluate(async (target) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const dest = Math.max(0, Math.min(Math.round(target), max));
    window.scrollTo({ top: dest, behavior: "instant" });
    const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    let fermi = 0;
    for (let i = 0; i < 240 && fermi < 2; i++) {
      await raf();
      if (Math.abs(window.scrollY - dest) <= 1) fermi++;
      else {
        fermi = 0;
        window.scrollTo({ top: dest, behavior: "instant" });
      }
    }
  }, y);
}

/** Scroll a `delta` px dal FONDO, col massimo riletto sul momento. */
async function scrollFromEnd(page: Page, delta: number) {
  const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  await scrollTo(page, max - delta);
}

/**
 * La coda del footer ha smesso di cambiare altezza: dopo `load`, tre letture
 * uguali a 300 ms l'una dall'altra (tetto 8 s). Serve perché la coda cresce
 * DOPO la prima misura del footer quando monta l'assistente
 * (`body:has([data-assistant-launcher])` le dà 2,5 rem in più sotto 768,
 * globals.css): misurare prima vorrebbe dire confrontare due code diverse.
 */
async function codaAssestata(page: Page) {
  await page.waitForLoadState("load");
  await page.evaluate(async () => {
    const tail = document.querySelector<HTMLElement>("[data-footer-tail]");
    if (!tail) return;
    let last = -1;
    let uguali = 0;
    const t0 = performance.now();
    while (uguali < 3 && performance.now() - t0 < 8000) {
      await new Promise((r) => setTimeout(r, 300));
      const h = tail.offsetHeight;
      uguali = h === last ? uguali + 1 : 0;
      last = h;
    }
  });
}

/** Come in mobile-motion.spec.ts: HeroCinematic ha idratato e preso il timone. */
async function heroReady(page: Page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>(".dt-hero-rest");
      if (!el) return false;
      return el.style.animationName === "none" || Number(getComputedStyle(el).opacity) > 0.9;
    },
    null,
    { timeout: 20_000, polling: 50 },
  );
}

/** `matrix(a, b, c, d, e, f)` → {a, f}; `none` → identità. */
function matrice(tf: string): { a: number; f: number; none: boolean } {
  if (tf === "none") return { a: 1, f: 0, none: true };
  const m = /^matrix\(([^)]+)\)$/.exec(tf);
  if (!m) return { a: NaN, f: NaN, none: false };
  const n = m[1].split(",").map((s) => Number(s.trim()));
  return { a: n[0], f: n[5], none: false };
}

/**
 * `inset(t r b l round …)` computato → [t, r, b, l] in %. Chromium accorcia
 * come per margin (`inset(6% 5% 10%)`), quindi si espande a mano.
 */
function inset(clip: string): number[] | null {
  const m = /^inset\(([^)]*)\)$/.exec(clip);
  if (!m) return null;
  const parte = m[1].split(" round ")[0].trim();
  const n = parte.split(/\s+/).map((s) => parseFloat(s));
  if (n.some((v) => Number.isNaN(v))) return null;
  if (n.length === 1) return [n[0], n[0], n[0], n[0]];
  if (n.length === 2) return [n[0], n[1], n[0], n[1]];
  if (n.length === 3) return [n[0], n[1], n[2], n[1]];
  return n.slice(0, 4);
}

// ── 1. HERO — il frame-in ────────────────────────────────────────────────
// Sotto 768 c'era una sola deriva yPercent; ora è la stessa timeline del
// desktop: clip-path + yPercent + scale sul canvas [data-hero-media], in
// scrub. Si legge il canvas a scrollY 0 e a 0,4×innerHeight: il clip-path
// deve passare da inset nullo a inset positivo, e la transform da identità a
// una matrix con scala > 1 — cioè si osserva la trasformazione, non l'effetto
// percepito. Il will-change è a tempo: promosso durante lo scrub, tolto oltre
// il fondo dell'hero.
test("hero: il frame-in ritaglia e scala il canvas anche sul telefono, e il will-change è a tempo @layout", async ({
  page,
  goto,
}, testInfo) => {
  const w = larghezza(testInfo);
  await goto("/");
  await heroReady(page);

  const leggi = () =>
    page.evaluate(() => {
      const m = document.querySelector<HTMLElement>("[data-hero-media]")!;
      const cs = getComputedStyle(m);
      return {
        y: window.scrollY,
        vh: window.innerHeight,
        clip: cs.clipPath,
        tf: cs.transform,
        wc: m.style.willChange,
        heroH: document.querySelector<HTMLElement>("#top")!.offsetHeight,
      };
    });

  const riposo = await leggi();
  const clip0 = inset(riposo.clip);
  expect(
    riposo.clip === "none" || (clip0 !== null && clip0.every((v) => v === 0)),
    `a scrollY 0 il canvas è già ritagliato: clip-path ${riposo.clip}`,
  ).toBe(true);
  expect(matrice(riposo.tf).a, `a scrollY 0 il canvas è già scalato: ${riposo.tf}`).toBeCloseTo(1, 3);

  // A 0,4 vh: inset positivo (top > 0) E matrix con scala > 1 — lo stesso
  // TIPO del desktop. Poll: sotto carico il tick di ScrollTrigger può
  // arrivare un fotogramma dopo lo scroll.
  await scrollTo(page, Math.round(riposo.vh * 0.4));
  await expect
    .poll(async () => matrice((await leggi()).tf).a, {
      timeout: 10_000,
      message: "a 0,4 vh il canvas dell'hero non è scalato (nessuna matrix con a > 1)",
    })
    .toBeGreaterThan(1.005);
  const aMeta = await leggi();
  const clipMeta = inset(aMeta.clip);
  expect(clipMeta, `a 0,4 vh il clip-path non è un inset: ${aMeta.clip}`).not.toBeNull();
  expect(clipMeta![0], `a 0,4 vh l'inset alto è ${clipMeta![0]}%: il frame-in non ritaglia`).toBeGreaterThan(0.5);
  expect(clipMeta![2], "l'inset basso non cresce con lo scroll").toBeGreaterThan(clipMeta![0]);
  const mMeta = matrice(aMeta.tf);
  expect(mMeta.a, `a 0,4 vh la transform è ${aMeta.tf}: nessuna scala`).toBeGreaterThan(1.005);
  expect(mMeta.a, "scala oltre il tetto 1.05 dello scrub").toBeLessThanOrEqual(1.05);
  expect(mMeta.f, "yPercent non applicato (translateY nullo)").toBeGreaterThan(1);
  expect(aMeta.wc, "will-change assente durante lo scrub dell'hero").toContain("clip-path");

  // Oltre il fondo dell'hero: scrub a fine corsa — l'inset FINALE dipende
  // dalla larghezza (5 % laterale sotto 768, 4 % sopra: FRAME in
  // HeroCinematic.tsx) — e will-change tolto.
  await scrollTo(page, aMeta.heroH + 200);
  await expect
    .poll(async () => (await leggi()).wc, {
      timeout: 10_000,
      message: "oltre il fondo dell'hero il canvas resta promosso (will-change non tolto)",
    })
    .toBe("");
  const fine = await leggi();
  const clipFine = inset(fine.clip)!;
  expect(clipFine, "a fine corsa il clip-path non è un inset").not.toBeNull();
  const lato = w >= 768 ? 4 : 5;
  expect(clipFine[0], "inset alto finale").toBeCloseTo(6, 1);
  expect(clipFine[2], "inset basso finale").toBeCloseTo(10, 1);
  expect(clipFine[1], `inset laterale finale a ${w}px`).toBeCloseTo(lato, 1);
  expect(matrice(fine.tf).a, "scala finale").toBeCloseTo(1.05, 3);
});

// ── 2. HERO — lo scroll cue ──────────────────────────────────────────────
// Vive da 768 in su, a 1,5 rem dal fondo dell'hero, alto 32 px. Sotto 768
// NON esiste, ed è il verdetto misurato (vedi il test successivo e il
// commento in HeroCinematic.tsx): l'hero sfonda il viewport e ogni quota
// possibile finisce sopra i CTA. Da 768 in su: si spegne in scrub nei primi
// 140 px (autoAlpha 0 + `data-cue-off` → pulse in pausa) e si riaccende
// tornando in cima.
test("hero: lo scroll cue si spegne dopo 200 px e si riaccende in cima @layout", async ({
  page,
  goto,
}, testInfo) => {
  const w = larghezza(testInfo);
  test.skip(w < 768, "sotto 768 il cue non esiste: KEEP OFF misurato, provato dal test successivo");
  await goto("/");
  await heroReady(page);

  const leggi = () =>
    page.evaluate(() => {
      const cue = document.querySelector<HTMLElement>("[data-hero-cue]")!;
      const pulse = cue.firstElementChild as HTMLElement;
      const cs = getComputedStyle(cue);
      const sec = document.querySelector<HTMLElement>("#top")!;
      const r = cue.getBoundingClientRect();
      return {
        y: window.scrollY,
        vh: window.innerHeight,
        display: cs.display,
        opacity: Number(cs.opacity),
        visibility: cs.visibility,
        off: cue.hasAttribute("data-cue-off"),
        play: getComputedStyle(pulse).animationPlayState,
        h: pulse.getBoundingClientRect().height,
        bottom: r.bottom,
        dalFondoHero: sec.getBoundingClientRect().bottom - r.bottom,
        heroH: sec.offsetHeight,
      };
    });

  // L'ingresso (t≈2,1 s dall'handoff, qui dal mount): si aspetta il segnale,
  // cioè l'opacità piena, non il tempo.
  await expect
    .poll(async () => (await leggi()).opacity, { timeout: 15_000, message: "il cue non si è mai acceso" })
    .toBeGreaterThan(0.99);
  const acceso = await leggi();
  expect(acceso.display, "il cue è display:none a questa larghezza").not.toBe("none");
  expect(acceso.visibility).toBe("visible");
  expect(acceso.off, "data-cue-off presente a scrollY 0").toBe(false);
  expect(acceso.play, "il pulse non gira a riposo").toBe("running");
  // Le misure geometriche: altezza e quota dal fondo dell'hero (= la quota
  // della MobileActionBar sotto 640: mai sotto la barra).
  expect(acceso.h, `altezza del cue a ${w}px`).toBeCloseTo(32, 0);
  // La quota è dal fondo del PRIMO SCHERMO, non da quello della sezione: le
  // due coincidono quando l'hero entra nel viewport (768×1024) e divergono
  // sui viewport bassi (1366×768: l'hero sfonda di ~38 px).
  expect(acceso.bottom, `quota dal fondo del primo schermo a ${w}px`).toBeCloseTo(acceso.vh - 24, 0);

  // Dopo 200 px: spento (opacity 0), attributo, pulse in pausa.
  await scrollTo(page, 200);
  await expect
    .poll(async () => (await leggi()).opacity, { timeout: 10_000, message: "dopo 200 px il cue è ancora acceso" })
    .toBeLessThan(0.01);
  const spento = await leggi();
  expect(spento.off, "data-cue-off assente a cue spento").toBe(true);
  expect(spento.play, "il pulse ticchetta ancora a cue spento (alleggerimento mancato)").toBe("paused");

  // In cima: attributo via, pulse che riparte, opacità che risale.
  await scrollTo(page, 0);
  await expect
    .poll(async () => (await leggi()).opacity, { timeout: 10_000, message: "tornati in cima il cue non si riaccende" })
    .toBeGreaterThan(0.99);
  const riacceso = await leggi();
  expect(riacceso.off).toBe(false);
  expect(riacceso.play).toBe("running");
});

// Il cue va VISTO nel primo schermo, o non serve a niente. Da 768 in su ci
// sta (l'hero è alto esattamente quanto il viewport: 1 024 su 1 024 misurati
// a 768×1024). Sotto 768 no, e non per un pixel: l'hero sfonda di 88-427 px
// perché copy, founder, due CTA e link recensioni si impilano — quindi il cue
// ancorato al fondo della sezione cade sotto la piega, e ancorarlo al fondo
// del primo schermo lo metterebbe sopra il blocco dei CTA. Lì è KEEP OFF, e
// questo test lo pretende: `display: none`, non «c'è ma non si vede».
test("hero: il cue sta nel primo schermo da 768 in su, e sotto non c'è @layout", async ({ page, goto }, testInfo) => {
  const w = larghezza(testInfo);
  await goto("/");
  await heroReady(page);
  const g = await page.evaluate(() => {
    const cue = document.querySelector<HTMLElement>("[data-hero-cue]")!;
    const sec = document.querySelector<HTMLElement>("#top")!;
    return {
      display: getComputedStyle(cue).display,
      bottom: cue.getBoundingClientRect().bottom,
      vh: window.innerHeight,
      heroH: sec.offsetHeight,
      y: window.scrollY,
    };
  });
  expect(g.y).toBe(0);
  if (w < 768) {
    expect(
      g.display,
      `a ${w}px il cue dovrebbe essere spento: l'hero è alto ${g.heroH}px su un viewport di ${g.vh}`,
    ).toBe("none");
    expect(g.heroH, "se l'hero entrasse nel viewport il verdetto andrebbe rifatto").toBeGreaterThan(g.vh);
    return;
  }
  expect(g.display).not.toBe("none");
  expect(
    g.bottom,
    `a ${w}px il cue ha il bordo basso a ${Math.round(g.bottom)}px su un viewport di ${g.vh}: fuori dal primo schermo`,
  ).toBeLessThanOrEqual(g.vh);
});

// ── 3. CAMERA-IN su /contatti ────────────────────────────────────────────
// Un solo dolly, due tarature: da 768 in su scale .96→1 + y 30, sotto
// .98→1 + y 15, finestra top 94% → 42%. Si porta il wrapper a ~70 % del
// viewport e si legge una matrix con scala nell'intervallo aperto e
// translateY > 0; sotto il 42 % l'identità. Mai opacity < 1, mai
// pointer-events none: dentro c'è un form.
test("camera-in: su /contatti il dolly è una matrix con scala e risalita, e sotto il 42 % è identità @layout", async ({
  page,
  goto,
}, testInfo) => {
  const w = larghezza(testInfo);
  const from = w >= 768 ? 0.96 : 0.98;
  await goto("/contatti");
  // Segnale d'idratazione: il fromTo dello scrub scrive subito lo stato di
  // partenza inline (scale/y) sul primo [data-camera-in].
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLElement>("[data-camera-in]");
      return !!el && el.style.transform !== "";
    },
    null,
    { timeout: 20_000, polling: 50 },
  );

  const leggi = () =>
    page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("[data-camera-in]")!;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        y: window.scrollY,
        vh: window.innerHeight,
        top: r.top,
        tf: cs.transform,
        opacity: Number(cs.opacity),
        pe: cs.pointerEvents,
        inlineOpacity: el.style.opacity,
      };
    });

  const stato = (s: Awaited<ReturnType<typeof leggi>>) => {
    expect(s.opacity, `opacity ${s.opacity} a scrollY ${s.y}: il wrapper si nasconde`).toBe(1);
    expect(s.pe, `pointer-events ${s.pe} a scrollY ${s.y}`).not.toBe("none");
    expect(s.inlineOpacity, "opacity inline scritta sul wrapper").toBe("");
  };

  const partenza = await leggi();
  stato(partenza);
  const m0 = matrice(partenza.tf);
  expect(m0.a, `alla partenza la scala è ${m0.a}, attesa ${from}`).toBeCloseTo(from, 3);

  // Il top di layout (senza la propria translateY) a ~70 % del viewport. Il
  // rect include il transform, quindi si toglie la f corrente.
  const layoutTop = (s: { top: number; tf: string; y: number }) => s.top - matrice(s.tf).f + s.y;
  await scrollTo(page, layoutTop(partenza) - partenza.vh * 0.7);
  await expect
    .poll(
      async () => {
        const s = await leggi();
        const m = matrice(s.tf);
        // A metà corsa: scala strettamente fra `from` e 1.
        return m.a > from + 0.001 && m.a < 0.9999;
      },
      { timeout: 10_000, message: "a 70 % del viewport il dolly non è a metà corsa" },
    )
    .toBe(true);
  const meta = await leggi();
  stato(meta);
  const mm = matrice(meta.tf);
  const ratio = (meta.top - mm.f) / meta.vh;
  expect(ratio, `il wrapper è a ${Math.round(ratio * 100)}% del viewport, non ~70%`).toBeGreaterThan(0.55);
  expect(ratio).toBeLessThan(0.85);
  expect(mm.a, `a ~70 % la scala è ${mm.a}: fuori da (${from}, 1)`).toBeGreaterThan(from);
  expect(mm.a).toBeLessThan(1);
  expect(mm.f, `a ~70 % translateY è ${mm.f}: nessuna risalita`).toBeGreaterThan(0);

  // Sotto il 42 %: identità.
  await scrollTo(page, layoutTop(meta) - meta.vh * 0.35);
  await expect
    .poll(
      async () => {
        const s = await leggi();
        const m = matrice(s.tf);
        return Math.abs(m.a - 1) < 0.001 && Math.abs(m.f) < 0.5;
      },
      { timeout: 10_000, message: "sotto il 42 % il dolly non è tornato all'identità" },
    )
    .toBe(true);
  stato(await leggi());
});

// ── 4. PARALLAX — /vendi (PORT) e la lastra Servizi (mob off, misura) ────
// Su /vendi l'hero (PageHero) ha una parallasse `mobile` con scale 1.08: la
// sua transform (matrix con f) deve cambiare fra scrollY 0 e 400 — stessa
// trasformazione del desktop, corsa dimezzata sotto 768 — e il will-change
// vive solo mentre l'hero è in viewport. Il numero-fantasma delle righe
// editoriali (range 26 → ±13 sotto 768) fa lo stesso: translateY che cambia.
test("parallax: su /vendi l'hero e il numero-fantasma derivano in translateY, will-change solo in campo @layout", async ({
  page,
  goto,
}, testInfo) => {
  const w = larghezza(testInfo);
  await goto("/vendi");
  const SEL = "main section .absolute.inset-0 > div";
  // Segnale d'idratazione: a scrollY 0 l'hero è in campo → will-change scritto.
  await page.waitForFunction(
    (sel) => document.querySelector<HTMLElement>(sel)?.style.willChange === "transform",
    SEL,
    { timeout: 20_000, polling: 50 },
  );
  const leggi = () =>
    page.evaluate((sel) => {
      const inner = document.querySelector<HTMLElement>(sel)!;
      const hero = inner.closest("section")!;
      return {
        y: window.scrollY,
        vh: window.innerHeight,
        tf: getComputedStyle(inner).transform,
        wc: inner.style.willChange,
        heroH: hero.offsetHeight,
        innerH: inner.offsetHeight,
      };
    }, SEL);

  const a0 = await leggi();
  const m0 = matrice(a0.tf);
  expect(m0.a, "l'overscan 1.08 non è applicato").toBeCloseTo(1.08, 3);
  expect(a0.wc).toBe("transform");

  // A META' del layer, non a 400 px fissi. Da quando la foto di PageHero sotto
  // i 768 e' una FASCIA (globals.css, "Le foto a tutto schermo diventano
  // fasce") il layer non e' piu' alto quanto la sezione: a 390 sono ~304 px,
  // quindi a scrollY 400 e' gia' uscito dal campo e will-change e' tolto —
  // correttamente. L'asserzione da fare resta la stessa ("in campo il layer e'
  // promosso"), ma il punto in cui la si misura va preso dalla geometria vera
  // invece che da un numero scritto a mano.
  const dentro = Math.max(80, Math.round((await leggi()).innerH / 2));
  await scrollTo(page, dentro);
  await expect
    .poll(async () => Math.abs(matrice((await leggi()).tf).f - m0.f), {
      timeout: 10_000,
      message: "lungo lo scrub la translateY dell'hero di /vendi non cambia",
    })
    .toBeGreaterThan(1);
  const a400 = await leggi();
  expect(matrice(a400.tf).a, "la scala cambia lungo lo scrub (deve restare 1.08)").toBeCloseTo(1.08, 3);
  expect(a400.wc).toBe("transform");

  // Fuori campo: will-change tolto.
  await scrollTo(page, a400.heroH + a400.vh + 50);
  await expect
    .poll(async () => (await leggi()).wc, {
      timeout: 10_000,
      message: "con l'hero fuori dal viewport il layer resta promosso",
    })
    .toBe("");

  // Il numero-fantasma: `.w-fit > div` è l'inner del Parallax (range 26).
  const fantasma = () =>
    page.evaluate(() => {
      const inner = document.querySelector<HTMLElement>(".w-fit > div")!;
      const outer = inner.parentElement!;
      const m = /^matrix\(([^)]+)\)$/.exec(getComputedStyle(inner).transform);
      const f = m ? Number(m[1].split(",")[5]) : NaN;
      return { f, outerTop: outer.getBoundingClientRect().top - f + window.scrollY, vh: window.innerHeight };
    });
  const g0 = await fantasma();
  // Riga appena sotto il bordo basso (prima di start "top bottom"): lo stato
  // di partenza del fromTo, f = −ampiezza (13 sotto 768, 26 sopra).
  await scrollTo(page, g0.outerTop - g0.vh - 40);
  const amp = w >= 768 ? 26 : 13;
  await expect
    .poll(async () => (await fantasma()).f, { timeout: 10_000, message: "il numero-fantasma non è alla partenza" })
    .toBeCloseTo(-amp, 0);
  // Riga a metà viewport: f cresce verso 0.
  await scrollTo(page, g0.outerTop - g0.vh / 2);
  await expect
    .poll(async () => (await fantasma()).f, { timeout: 10_000, message: "il numero-fantasma non deriva con lo scroll" })
    .toBeGreaterThan(-amp + 5);
});

// La lastra Servizi sulla home tiene `mobile={false}` per misura (~3 px di
// corsa a 390): sotto 768 la sua inner resta a `scale(1.06)` costante fra due
// quote; sopra, deriva.
test("parallax: la lastra Servizi resta ferma sotto 768 e deriva sopra @layout", async ({ page, goto }, testInfo) => {
  const w = larghezza(testInfo);
  await goto("/");
  await heroReady(page);
  const SEL = 'article[data-cursor="scopri"] div[style*="scale(1.06"]';
  await page.waitForFunction((sel) => !!document.querySelector(sel), SEL, { timeout: 20_000 });
  const leggi = () =>
    page.evaluate((sel) => {
      const inner = document.querySelector<HTMLElement>(sel)!;
      const art = inner.closest("article")!;
      return {
        tf: getComputedStyle(inner).transform,
        artTop: art.getBoundingClientRect().top + window.scrollY,
        vh: window.innerHeight,
      };
    }, SEL);
  const p = await leggi();
  await scrollTo(page, p.artTop - p.vh + 10);
  await page.waitForTimeout(150);
  const bordo = await leggi();
  await scrollTo(page, p.artTop - p.vh / 2);
  await expect
    .poll(async () => (await leggi()).tf, { timeout: 5_000 })
    .toMatch(/^matrix\(1\.06/);
  const meta = await leggi();
  const df = Math.abs(matrice(meta.tf).f - matrice(bordo.tf).f);
  if (w >= 768) {
    expect(df, `a ${w}px la lastra Servizi non deriva (Δf ${df})`).toBeGreaterThan(1);
  } else {
    expect(df, `a ${w}px la lastra Servizi deriva di ${df}px: mobile={false} non rispettato`).toBeLessThan(0.5);
    expect(meta.tf).toBe("matrix(1.06, 0, 0, 1.06, 0, 0)");
  }
});

// ── 5. FIORITURA sulla home ──────────────────────────────────────────────
// I tralci d'angolo sono accesi anche sotto lg — uno per sezione, «mai sopra
// un testo»: la seconda Fioritura di HorizonStory (la scritta), di Paths e
// quella di Contact restano display:none. La prova è il canvas che sboccia:
// campionamento fatto al warmup (data-fiorita > 0 PRIMA dello scroll) e, dopo
// l'ingresso in viewport, pixel con alpha > 0 letti dal contesto 2D — è un
// disegno, non un fade. Sotto lg il dpr è tappato a 1,5.
test("fioritura: sulla home i tralci d'angolo sono uno per sezione e sbocciano davvero @layout", async ({
  page,
  goto,
}, testInfo) => {
  const w = larghezza(testInfo);
  await goto("/");
  await heroReady(page);
  const CANVAS = "canvas.font-display[aria-hidden]";
  // Il warmup campiona i canvas con un box: si aspetta il segno.
  await expect
    .poll(
      () =>
        page.evaluate(
          (sel) =>
            Array.from(document.querySelectorAll<HTMLCanvasElement>(sel)).filter(
              (c) => c.getClientRects().length > 0 && Number(c.dataset.fiorita) > 0,
            ).length,
          CANVAS,
        ),
      { timeout: 20_000, message: "meno di 6 Fioriture visibili campionate al warmup" },
    )
    .toBeGreaterThanOrEqual(6);

  const censimento = await page.evaluate((sel) => {
    const tutti = Array.from(document.querySelectorAll<HTMLCanvasElement>(sel));
    const visibili = tutti.filter((c) => c.getClientRects().length > 0);
    const perSezione = new Map<string, number>();
    for (const c of visibili) {
      const sec = c.closest("section, footer");
      const k = sec ? sec.id || sec.tagName + ":" + Array.from(sec.parentElement?.children ?? []).indexOf(sec) : "?";
      perSezione.set(k, (perSezione.get(k) ?? 0) + 1);
    }
    const contatti = document.querySelector<HTMLCanvasElement>("#contatti " + sel);
    return {
      n: visibili.length,
      boxNulli: visibili.filter((c) => {
        const r = c.getBoundingClientRect();
        return r.width <= 0 || r.height <= 0;
      }).length,
      senzaCampione: visibili.filter((c) => !(Number(c.dataset.fiorita) > 0)).length,
      doppie: Array.from(perSezione.entries()).filter(([, n]) => n > 1),
      contattiDisplay: contatti ? getComputedStyle(contatti).display : "assente",
    };
  }, CANVAS);
  expect(censimento.n, "Fioriture visibili sulla home").toBeGreaterThanOrEqual(6);
  expect(censimento.boxNulli, "canvas visibili con box a zero").toBe(0);
  expect(censimento.senzaCampione, "canvas visibili senza campionamento (data-fiorita)").toBe(0);
  if (w < 1024) {
    expect(censimento.doppie, "sotto lg una sezione ha più di un tralcio visibile").toEqual([]);
    expect(censimento.contattiDisplay, "sotto lg la Fioritura di Contact deve restare nascosta (sopra un testo)").toBe(
      "none",
    );
  }

  // Lo sboccio: la lastra Servizi (c'è a ogni larghezza). Si porta in
  // viewport e si aspettano pixel con alpha > 0.
  const SERV = "#servizi " + CANVAS;
  const geo = await page.evaluate((sel) => {
    const c = document.querySelector<HTMLCanvasElement>(sel)!;
    return { top: c.getBoundingClientRect().top + window.scrollY, vh: window.innerHeight };
  }, SERV);
  await scrollTo(page, geo.top - geo.vh / 2);
  await expect
    .poll(
      () =>
        page.evaluate((sel) => {
          const c = document.querySelector<HTMLCanvasElement>(sel)!;
          const ctx = c.getContext("2d");
          if (!ctx || c.width === 0 || c.height === 0) return -1;
          try {
            const d = ctx.getImageData(0, 0, c.width, c.height).data;
            let n = 0;
            for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
            return n;
          } catch {
            // Canvas non leggibile (taint): ripiego sul campionamento.
            return Number(c.dataset.fiorita) > 0 ? Number.MAX_SAFE_INTEGER : -2;
          }
        }, SERV),
      { timeout: 15_000, message: "il tralcio di Servizi non ha dipinto un pixel dopo l'ingresso in viewport" },
    )
    .toBeGreaterThan(0);
  const dpr = await page.evaluate((sel) => {
    const c = document.querySelector<HTMLCanvasElement>(sel)!;
    const lg = window.matchMedia("(min-width: 1024px)").matches;
    const cap = Math.min(window.devicePixelRatio || 1, lg ? 2 : 1.5);
    return { w: c.width, atteso: Math.round(c.getBoundingClientRect().width * cap), cap };
  }, SERV);
  expect(Math.abs(dpr.w - dpr.atteso), `bitmap ${dpr.w}px contro ${dpr.atteso} attesi (dpr cap ${dpr.cap})`).toBeLessThanOrEqual(1);
});

// ── 6. WORD REVEAL su /lavora-con-noi ────────────────────────────────────
// La meccanica per-parola sotto 768 apre col solo `[data-wr-mobile]`: prima
// dell'ingresso ogni `.w` è inline-block a opacity 0 e translateY(0.5em);
// dopo lo scroll a #candidatura la classe `is-in` c'è e le parole sono a
// opacity 1 / matrix identità — una risalita per parola, non un fade a blocco.
test("word-reveal: su /lavora-con-noi il titolo di #candidatura risale parola per parola @layout", async ({
  page,
  goto,
}) => {
  await goto("/lavora-con-noi");
  const SEL = "#candidatura h2.word-reveal";
  await page.waitForFunction((sel) => !!document.querySelector(sel), SEL, { timeout: 20_000 });
  const leggi = () =>
    page.evaluate((sel) => {
      const h = document.querySelector<HTMLElement>(sel)!;
      const ws = Array.from(h.querySelectorAll<HTMLElement>(".w"));
      return {
        y: window.scrollY,
        vh: window.innerHeight,
        top: h.getBoundingClientRect().top + window.scrollY,
        mobile: h.hasAttribute("data-wr-mobile"),
        isIn: h.classList.contains("is-in"),
        n: ws.length,
        parole: ws.map((w) => {
          const cs = getComputedStyle(w);
          return { display: cs.display, opacity: Number(cs.opacity), tf: cs.transform };
        }),
      };
    }, SEL);
  const prima = await leggi();
  expect(prima.mobile, "manca [data-wr-mobile]: la meccanica per-parola sotto 768 non è aperta").toBe(true);
  expect(prima.n, "nessuna parola .w").toBeGreaterThan(1);
  // Precondizione: il titolo è fuori campo, quindi ancora nascosto.
  expect(prima.top, "#candidatura è già nel primo schermo: la precondizione non regge").toBeGreaterThan(prima.vh);
  expect(prima.isIn).toBe(false);
  for (const p of prima.parole) {
    expect(p.display).toBe("inline-block");
    expect(p.opacity).toBe(0);
    expect(matrice(p.tf).f, `translateY di partenza (${p.tf})`).toBeGreaterThan(2);
  }

  await scrollTo(page, prima.top - prima.vh * 0.4);
  await expect
    .poll(async () => (await leggi()).isIn, { timeout: 10_000, message: "is-in non arriva dopo lo scroll a #candidatura" })
    .toBe(true);
  await expect
    .poll(
      async () => {
        const s = await leggi();
        return s.parole.every((p) => p.opacity === 1 && Math.abs(matrice(p.tf).f) < 0.01);
      },
      { timeout: 10_000, message: "le parole non arrivano a opacity 1 / identità" },
    )
    .toBe(true);
});

// ── 7. FOOTER — l'uncover parziale ───────────────────────────────────────
// Sotto lg è fissa la sola coda ([data-footer-tail]) dentro una cornice in
// flusso ([data-footer-tail-frame], clip-path inset(0)) alta quanto lei: la
// cornice sale con la pagina e la scopre dal basso — la STESSA trasformazione
// del main che scopre il footer sul desktop. Prova: fra scrollY = max − h e
// max il rect della cornice sale, quello della coda NON si muove. Il settle
// (wordmark che sale, riga legale che si assesta) è in scrub sull'ultimo
// tratto. A fondo pagina il link Privacy è davvero sotto il dito.
for (const rotta of ["/", "/privacy"] as const) {
  test(`footer: su ${rotta} la cornice scopre la coda fissa e in fondo il link Privacy è raggiungibile @layout`, async ({
    page,
    goto,
  }, testInfo) => {
    const w = larghezza(testInfo);
    await goto(rotta);
    const stato = () =>
      page.evaluate(() => {
        const html = document.documentElement;
        const footer = document.querySelector<HTMLElement>("footer")!;
        const tail = document.querySelector<HTMLElement>("[data-footer-tail]")!;
        const frame = document.querySelector<HTMLElement>("[data-footer-tail-frame]")!;
        const wm = document.querySelector<HTMLElement>("[data-footer-wordmark]")!;
        const legal = document.querySelector<HTMLElement>("[data-footer-legal]")!;
        const link = document.querySelector<HTMLElement>("footer a[href='/privacy']")!;
        const lr = link.getBoundingClientRect();
        const hit = document.elementFromPoint(lr.left + lr.width / 2, lr.top + lr.height / 2);
        return {
          y: window.scrollY,
          vh: window.innerHeight,
          max: html.scrollHeight - window.innerHeight,
          reveal: html.classList.contains("dt-footer-reveal"),
          varH: getComputedStyle(html).getPropertyValue("--dt-footer-h").trim(),
          footerH: footer.offsetHeight,
          footerPos: getComputedStyle(footer).position,
          tailH: tail.offsetHeight,
          tailPos: getComputedStyle(tail).position,
          tailTop: tail.getBoundingClientRect().top,
          tailBottom: tail.getBoundingClientRect().bottom,
          frameH: frame.offsetHeight,
          frameTop: frame.getBoundingClientRect().top,
          frameClip: getComputedStyle(frame).clipPath,
          wmRel: wm.getBoundingClientRect().top - tail.getBoundingClientRect().top,
          legalOpacity: Number(getComputedStyle(legal).opacity),
          legalTf: getComputedStyle(legal).transform,
          hitInLink: !!hit && link.contains(hit),
          hitTag: hit ? hit.tagName + (hit.getAttribute("href") ?? "") : null,
          launcher: !!document.querySelector("[data-assistant-launcher]"),
        };
      });

    if (w >= 1024) {
      // Desktop: comportamento invariato — footer intero fisso dietro al
      // main SE entra nel viewport (a 1366×768 non entra: nessuna classe).
      const s0 = await stato();
      if (s0.footerH > s0.vh) {
        await page.waitForTimeout(1500);
        expect((await stato()).reveal, "footer più alto del viewport ma uncover acceso").toBe(false);
        return;
      }
      await expect
        .poll(async () => (await stato()).reveal, { timeout: 20_000, message: "html.dt-footer-reveal non arriva" })
        .toBe(true);
      const s = await stato();
      expect(s.footerPos).toBe("fixed");
      expect(s.varH).toBe(`${s.footerH}px`);
      await scrollFromEnd(page, 0);
      await expect
        .poll(async () => (await stato()).hitInLink, { timeout: 5_000 })
        .toBe(true);
      return;
    }

    // Sotto lg.
    await expect
      .poll(async () => (await stato()).reveal, { timeout: 20_000, message: "html.dt-footer-reveal non arriva" })
      .toBe(true);
    await codaAssestata(page);
    const s = await stato();
    expect(s.tailPos, "la coda non è fixed").toBe("fixed");
    expect(s.frameClip, "la cornice non ritaglia").toBe("inset(0px)");
    expect(s.frameH, "la cornice è collassata").toBeGreaterThan(100);
    expect(s.tailH, "la coda non entra nel viewport").toBeLessThanOrEqual(s.vh);
    expect(s.varH).toBe(`${s.frameH}px`);

    // La geometria dell'uncover: h = altezza della cornice (è lei che scopre).
    // Il massimo si rilegge a OGNI scroll: la home cresce ancora di qualche
    // centinaio di px dopo l'idratazione (lo stesso fenomeno che
    // mobile-motion.spec.ts racconta per il sipario di Paths), e un `max`
    // letto una volta sola manderebbe la cornice a metà pagina.
    const h = s.frameH;
    const dalFondo = (delta: number) => scrollFromEnd(page, delta);
    await dalFondo(h);
    await expect
      .poll(async () => (await stato()).frameTop, { timeout: 5_000, message: "a max − h la cornice non è sul bordo basso" })
      .toBeCloseTo(s.vh, -1);
    const coperto = await stato();
    // Nulla scoperto: il fondo della coda (fissa al bordo basso) non supera
    // il bordo alto della cornice.
    expect(coperto.tailBottom, "a max − h la coda sporge già dalla cornice").toBeLessThanOrEqual(coperto.frameTop + 1);
    const tailTop0 = coperto.tailTop;

    await dalFondo(h / 2);
    await expect
      .poll(async () => (await stato()).frameTop, { timeout: 5_000, message: "a max − h/2 la cornice non è a metà" })
      .toBeCloseTo(s.vh - h / 2, -1);
    const meta = await stato();
    // «È fissa» si legge sul bordo BASSO, che `bottom: 0` inchioda al viewport:
    // il bordo alto può muoversi per conto suo se la coda cambia altezza — e
    // lo fa, perché il launcher dell'assistente monta quando gli pare e le
    // aggiunge 2,5 rem di padding (40 px: esattamente lo scarto che questa
    // asserzione, scritta sul top, leggeva come «non è fissa» sotto il carico
    // dei quattro worker).
    expect(Math.abs(meta.tailBottom - meta.vh), "la coda si è staccata dal bordo basso: non è fissa").toBeLessThan(1);
    expect(
      Math.abs(meta.tailTop - tailTop0),
      "la coda si è mossa rispetto al viewport senza cambiare altezza: non è fissa",
    ).toBeLessThan(Math.abs(meta.tailH - coperto.tailH) + 1);

    await dalFondo(0);
    await expect
      .poll(async () => (await stato()).frameTop, { timeout: 5_000, message: "a max la cornice non è alla quota di riposo" })
      .toBeCloseTo(s.vh - h, -1);
    const fondo = await stato();
    expect(Math.abs(fondo.tailTop - tailTop0)).toBeLessThan(1);
    // Il settle a fine corsa: riga legale piena e ferma, wordmark salito.
    expect(fondo.legalOpacity).toBe(1);
    expect(matrice(fondo.legalTf).f, "la riga legale non è assestata a fine corsa").toBeCloseTo(0, 0);
    // A fondo pagina il link Privacy è sotto il dito (mai la MobileActionBar).
    expect(fondo.hitInLink, `elementFromPoint sul link Privacy restituisce ${fondo.hitTag}`).toBe(true);

    // Il settle in scrub: a max − 0,6h il wordmark è più in basso nella coda
    // che a max, e la riga legale è a metà (opacity < 1, mai sotto 0,3).
    await dalFondo(h * 0.6);
    await expect
      .poll(async () => (await stato()).wmRel, { timeout: 5_000, message: "a max − 0,6h il wordmark non è ancora dentro la maschera" })
      .toBeGreaterThan(fondo.wmRel + 5);
    const inCorsa = await stato();
    expect(inCorsa.legalOpacity).toBeLessThan(1);
    expect(inCorsa.legalOpacity).toBeGreaterThanOrEqual(0.3);
    expect(matrice(inCorsa.legalTf).f, "la riga legale non è in risalita").toBeGreaterThan(0);

    // Tastiera: focus dentro la coda → scroll in fondo (WCAG 2.4.7).
    await dalFondo(h);
    await page.locator("footer a[href='/privacy']").focus();
    await expect
      .poll(async () => {
        const st = await stato();
        return st.max - st.y;
      }, { timeout: 5_000, message: "il focus dentro la coda non porta in fondo" })
      .toBeLessThanOrEqual(2);
  });
}

// La var e la cornice devono seguire l'altezza VIVA della coda: la coda può
// crescere dopo la prima misura (font, cambio lingua, e sotto 768 il padding
// in più che `body:has([data-assistant-launcher])` le dà quando l'assistente
// monta — globals.css). Misurato con l'assistente acceso (build e2e) a
// 390×664: la coda passa da 315 a 355 px ~250 ms dopo la misura del footer e
// `--dt-footer-h` resta 315px — la cornice è 40 px più bassa della coda e a
// fondo pagina i 40 px alti del wordmark restano ritagliati (frame.top 349
// contro tail.top 309). Il ResizeObserver di Footer.tsx osserva la
// content-box (default): un padding che cambia non la tocca. DIFETTO APERTO,
// dichiarato col numero e non aggirato: quando la coda cresce per l'assistente
// e la var non la segue si segna fixme; senza assistente, e appena il
// difetto è chiuso, l'asserzione gira intera.
test("footer: --dt-footer-h e la cornice seguono l'altezza viva della coda @layout", async ({ page, goto }, testInfo) => {
  const w = larghezza(testInfo);
  test.skip(w >= 1024, "sotto lg soltanto: sopra la var è l'altezza dell'intero footer (provata sopra)");
  await goto("/privacy");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dt-footer-reveal")), {
      timeout: 20_000,
    })
    .toBe(true);
  // L'assistente (se acceso) monta poco dopo: si aspetta che la coda si
  // assesti prima di confrontare.
  await codaAssestata(page);
  const s = await page.evaluate(() => {
    const html = document.documentElement;
    const tail = document.querySelector<HTMLElement>("[data-footer-tail]")!;
    const frame = document.querySelector<HTMLElement>("[data-footer-tail-frame]")!;
    return {
      varH: getComputedStyle(html).getPropertyValue("--dt-footer-h").trim(),
      tailH: tail.offsetHeight,
      frameH: frame.offsetHeight,
      launcher: !!document.querySelector("[data-assistant-launcher]"),
      vh: window.innerHeight,
    };
  });
  // Il caso che rompeva: col launcher dell'assistente montato la coda cresce
  // di PADDING (`:has()` in globals.css) e la content-box non cambia — il
  // ResizeObserver non vedeva niente e `--dt-footer-h` restava all'altezza di
  // prima. Corretto osservando la border-box (Footer.tsx); qui si pretende,
  // launcher o no.
  expect(s.varH, `--dt-footer-h ${s.varH} contro coda ${s.tailH}px`).toBe(`${s.tailH}px`);
  expect(s.frameH, "la cornice non è alta quanto la coda").toBe(s.tailH);
});

// ── 8. PAGE TRANSITION — l'uscita ────────────────────────────────────────
// La porta chiude con lo stesso tempo a ogni larghezza (0,65 s con la
// maschera ad arco, 0,45 il ripiego a clip-path): dal click al cambio di
// pathname devono passare ≥ 600 ms (prima sul telefono erano ~500), e nel
// frattempo cambiano le VARIABILI della maschera (--arch-w da 125vw verso
// 34vw, --arch-y verso 104vh), non width/height. La misura è a fotogramma,
// dentro la pagina: un campionatore in rAF installato prima del click.
test("page transition: sul telefono la porta chiude in ≥ 600 ms muovendo le variabili della maschera", async ({
  page,
  goto,
}) => {
  await goto("/");
  await heroReady(page);
  const PANEL = "[aria-hidden].fixed.z-\\[92\\] > div";
  // Segnale d'idratazione di PageTransition: la classe della maschera (o,
  // senza mask-composite, il pannello con clip-path chiuso).
  await page.waitForFunction(
    (sel) => {
      const p = document.querySelector<HTMLElement>(sel);
      if (!p) return false;
      const arch = typeof CSS !== "undefined" && CSS.supports("mask-composite", "add");
      return arch ? p.classList.contains("dt-arch-mask") : true;
    },
    PANEL,
    { timeout: 20_000, polling: 50 },
  );

  const esito = await page.evaluate(async (sel) => {
    const panel = document.querySelector<HTMLElement>(sel)!;
    const root = panel.parentElement!;
    const arch = panel.classList.contains("dt-arch-mask");
    const a = document.querySelector<HTMLAnchorElement>('footer a[href="/vendi"]')!;
    const path0 = location.pathname;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    type Campione = { t: number; y: number; w: number; clip: string; vis: string; op: number; path: string; chars: number };
    const campioni: Campione[] = [];
    const st: { cambio: number | null } = { cambio: null };
    const t0 = performance.now();
    const tick = () => {
      const cs = getComputedStyle(panel);
      const t = performance.now() - t0;
      campioni.push({
        t,
        y: parseFloat(cs.getPropertyValue("--arch-y")),
        w: parseFloat(cs.getPropertyValue("--arch-w")),
        clip: cs.clipPath,
        vis: cs.visibility,
        op: Number(cs.opacity),
        path: location.pathname,
        chars: root.querySelectorAll(".dt-tr-char").length,
      });
      if (st.cambio === null && location.pathname !== path0) st.cambio = t;
      if ((st.cambio === null && t < 8000) || (st.cambio !== null && t < st.cambio + 200)) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    a.click();
    await new Promise<void>((r) => {
      const check = () => (st.cambio !== null || performance.now() - t0 > 8000 ? r() : setTimeout(check, 50));
      check();
    });
    return { arch, vh, vw, cambio: st.cambio, campioni, path: location.pathname };
  }, PANEL);

  expect(esito.cambio, "il pathname non è mai cambiato dopo il click").not.toBeNull();
  expect(esito.path).toBe("/vendi");
  expect(
    esito.cambio!,
    `il pathname è cambiato a ${Math.round(esito.cambio!)}ms dal click: la porta chiude in meno di 600 ms`,
  ).toBeGreaterThanOrEqual(600);
  test.info().annotations.push({
    type: "page transition",
    description: `${esito.arch ? "maschera ad arco" : "ripiego clip-path"}; pathname a ${Math.round(esito.cambio!)}ms; ${esito.campioni.length} fotogrammi`,
  });

  const uscita = esito.campioni.filter((c) => c.t < esito.cambio!);
  expect(uscita.length, "troppo pochi fotogrammi durante l'uscita").toBeGreaterThan(5);
  // Il pannello è a schermo durante l'uscita.
  expect(uscita.filter((c) => c.t > 100).every((c) => c.vis === "visible" && c.op === 1), "il pannello non è visibile durante l'uscita").toBe(true);
  // La parola-destinazione è composta per lettere.
  expect(Math.max(...uscita.map((c) => c.chars)), "nessun glifo .dt-tr-char nel layer parola").toBeGreaterThan(0);

  if (esito.arch) {
    const coperto = 1.04 * esito.vh; // --arch-y 104vh
    const wGone = 1.25 * esito.vw; // --arch-w 125vw
    const wCovered = 0.34 * esito.vw; // --arch-w 34vw
    const validi = uscita.filter((c) => Number.isFinite(c.y) && Number.isFinite(c.w));
    expect(validi.length, "--arch-y/--arch-w non leggibili come lunghezze sul pannello").toBeGreaterThan(3);
    // Il buco più largo della sentinella nella finestra della porta (0-650 ms):
    // sotto carico la rAF resta a secco (mobile-motion.spec.ts, atti III-IV),
    // e allora un fotogramma mancante è la macchina, non il sito. Le prove
    // sono per VALORI, che non dipendono da quando li si legge; la copertura
    // decide solo se un fotogramma «in transito» è dovuto.
    let buco = 0;
    {
      const ts = [0, ...validi.map((c) => c.t).filter((t) => t <= 650), 650];
      for (let i = 1; i < ts.length; i++) buco = Math.max(buco, ts[i] - ts[i - 1]);
    }
    test.info().annotations.push({ type: "sentinella", description: `buco massimo nella finestra della porta ${Math.round(buco)}ms` });
    // Prima di 450 ms la porta NON è ancora chiusa: nessun fotogramma con
    // --arch-y a 104vh (era il difetto del vecchio 0,5 s sul telefono).
    expect(
      validi.filter((c) => c.t <= 450).every((c) => c.y < coperto - 1),
      "--arch-y è già a 104vh entro 450 ms: la porta chiude troppo in fretta",
    ).toBe(true);
    // 104vh la si raggiunge solo verso la fine (0,65 s).
    const primoCoperto = validi.find((c) => Math.abs(c.y - coperto) < 0.5);
    expect(primoCoperto, "la porta non è mai arrivata a 104vh prima del cambio di pathname").toBeDefined();
    expect(primoCoperto!.t, `--arch-y è a 104vh già a ${Math.round(primoCoperto!.t)}ms`).toBeGreaterThanOrEqual(550);
    // --arch-w passa da 125vw verso 34vw: valori intermedi (la porta in
    // transito), mai in risalita, e a fine uscita a 34vw. Con la sentinella
    // che copre la corsa (buco < 300 ms) i valori distinti devono essere
    // almeno tre; con la rAF a secco ne basta uno, e lo si annota.
    const intermedi = validi.filter((c) => c.w < wGone - 1 && c.w > wCovered + 1).map((c) => c.w);
    const distinti = new Set(intermedi.map((v) => Math.round(v))).size;
    expect(
      distinti,
      `--arch-w non ha mostrato valori intermedi fra 125vw e 34vw (buco della sentinella ${Math.round(buco)}ms)`,
    ).toBeGreaterThanOrEqual(buco < 300 ? 3 : 1);
    for (let i = 1; i < intermedi.length; i++) {
      expect(intermedi[i], "--arch-w risale durante l'uscita").toBeLessThanOrEqual(intermedi[i - 1] + 0.01);
    }
    expect(validi[validi.length - 1].w, "a fine uscita --arch-w non è a 34vw").toBeCloseTo(wCovered, 0);
  } else {
    // Ripiego: clip-path da inset(100% 0 0 0) a inset(0).
    const clips = new Set(uscita.map((c) => c.clip));
    expect(clips.size, "senza maschera il clip-path del pannello non cambia").toBeGreaterThanOrEqual(3);
  }
});

// ── 9. REDUCED MOTION ────────────────────────────────────────────────────
// Chi ha chiesto meno animazioni ha tutto in flusso e fermo: nessun dolly
// inline, nessun uncover, nessun clip-path sull'hero.
test.describe("con reduced-motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("dolly, footer e frame-in restano fermi @layout", async ({ page, goto }) => {
    await goto("/");
    await page.waitForLoadState("load");
    // Il modulo GSAP è caricato (hook di prova) e i componenti hanno avuto
    // modo di montare: si aspetta il segnale, poi un respiro per le
    // asserzioni negative.
    await page.waitForFunction(() => typeof (window as unknown as { __dtST?: unknown }).__dtST === "function", null, {
      timeout: 20_000,
    });
    await page.waitForTimeout(1500);
    const s = await page.evaluate(() => {
      const cams = Array.from(document.querySelectorAll<HTMLElement>("[data-camera-in]"));
      const media = document.querySelector<HTMLElement>("[data-hero-media]")!;
      const tail = document.querySelector<HTMLElement>("[data-footer-tail]")!;
      return {
        nCam: cams.length,
        camInline: cams.filter((c) => c.style.transform !== "").length,
        reveal: document.documentElement.classList.contains("dt-footer-reveal"),
        tailPos: getComputedStyle(tail).position,
        heroClip: getComputedStyle(media).clipPath,
        heroInline: media.getAttribute("style"),
      };
    });
    expect(s.nCam, "nessun [data-camera-in] sulla home").toBeGreaterThan(0);
    expect(s.camInline, "con reduced-motion il dolly ha scritto un transform inline").toBe(0);
    expect(s.reveal, "con reduced-motion l'uncover del footer è acceso").toBe(false);
    expect(s.tailPos, "la coda del footer non è in flusso").not.toBe("fixed");
    expect(s.heroClip, "con reduced-motion l'hero è ritagliato").toBe("none");
    expect(s.heroInline ?? "", "con reduced-motion l'hero ha stile inline dallo scrub").not.toContain("clip-path");
  });
});
