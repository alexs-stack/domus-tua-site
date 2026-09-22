import type { Page } from "@playwright/test";
import sharp from "sharp";
import { test, expect, setConsent } from "./helpers";
import tinte from "../app/lib/motion/tinte.json";
import { SIZES_TESTA } from "../app/lib/motion/testa";

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
/** La grafite del lead (`--color-graphite`) ha lo stesso valore dell'inchiostro. */
const GRAFITE = "rgb(70, 66, 61)";
const ROSSO = "rgb(210, 10, 10)";
/** A51 (22 set.): sulla carta rosa pesca l'occhiello (16 px) è nel rosso cupo, il rosso dei testi piccoli sull'avorio. */
const ROSSO_CUPO = "rgb(163, 7, 7)";
const CREAM_DEEP = "rgb(242, 207, 197)";
/** L'avorio della carta, in RGB: i pixel sotto le scritte devono essere questo, ±3 per canale (A46). */
const AVORIO_RGB = [246, 217, 208] as const;
/** D124: dove `tinte.json` dichiara l'avorio, la pagina spedisce un token. A46 (21 set. 2026): col
    cielo mascherato il riquadro si vede attraverso la foto, quindi il token è il FONDO PAGINA. */
const TOKEN_ALTA = "--color-cream";
/** A46: la cima del soggetto di una rotta in px (`cielo.cima`: la prima riga con almeno il 5 % di pixel opachi;
    sopra c'è solo carta), data l'altezza resa dello strato della foto. La `linea` (dove il soggetto riempie la
    larghezza) sta più in basso e con lei l'H1 di /vendi posava sui cipressi: non si usa. */
const cieloPx = (rotta: Rotta, altezzaStrato: number) => tinte[rotta].cielo.cima * altezzaStrato;

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
    // La scatola della foto (A48): dentro lo strato, alta quanto la foto (sotto lg) o quanto lo strato (da lg).
    const foto = strato?.querySelector<HTMLElement>("[data-testa-foto-box]") ?? null;
    const img = foto?.querySelector<HTMLImageElement>("img") ?? null;
    const soggetto = strato?.querySelector<HTMLElement>("[data-testa-soggetto]") ?? null;
    // I marcatori del segno (22 set.): uno per banda `segno` di tinte.json.
    const marcatori = Array.from(strato?.querySelectorAll<HTMLElement>("[data-testa-soggetto]") ?? []).map((m) => ({ ...(box(m) as Rett), bg: m.getAttribute("data-bg") }));
    const blocco = section?.querySelector<HTMLElement>(".dt-testa_blocco") ?? null;
    const pagina = section?.querySelector<HTMLElement>(".dt-testa_sopra") ?? null;
    const h1 = section?.querySelector<HTMLElement>("h1") ?? null;
    const script = section?.querySelector<HTMLElement>(".script-word") ?? null;
    const eyebrow = section?.querySelector<HTMLElement>(".eyebrow") ?? null;
    const lead = section?.querySelector<HTMLElement>("p.lead") ?? null;
    const solid = section?.querySelector<HTMLElement>("a.dt-btn--cta-solid") ?? null;
    const ghost = section?.querySelector<HTMLElement>("a.dt-btn--ghost") ?? null;
    const punti = section?.querySelector<HTMLElement>(".dt-testa_sopra ul") ?? null;
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
      foto: box(foto),
      img: box(img),
      soggetto: box(soggetto),
      marcatori,
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
      stili: { h1: stile(h1), eyebrow: stile(eyebrow), script: stile(script), lead: stile(lead), solid: stile(solid), ghost: stile(ghost), punti: stile(punti) },
      op: img ? getComputedStyle(img).objectPosition : null,
      fondoRiquadro: riquadro ? getComputedStyle(riquadro).backgroundColor : null,
      fondoStrato: strato ? getComputedStyle(strato).backgroundColor : null,
      fondoFoto: foto ? getComputedStyle(foto).backgroundColor : null,
      fondoPagina: pagina ? getComputedStyle(pagina).backgroundColor : null,
      dataBgRiquadro: riquadro?.getAttribute("data-bg") ?? null,
      dataBgSoggetto: soggetto?.getAttribute("data-bg") ?? null,
      cieloVar: section ? getComputedStyle(section).getPropertyValue("--dt-cielo-h").trim() : null,
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
// D176/D177: su nove + due rotte la carta è il primo pixel della pagina (`margin-top` negativo sotto la
// testata trasparente); dentro, in alto, stanno occhiello, H1, calligrafia, lead e i due comandi,
// centrati come «Perfect sea views» (A41); i tre punti sotto. A45 (Alberto, 21 set. 2026: «le foto su
// era residence sono la pagina stessa … stai scrollando la foto stessa come se fosse la pagina»): la
// foto è IN FLUSSO, alta quanto resa, e scorre con la pagina. A46 (Alberto, 21 set. 2026, sera: «su
// eraresidence questa foto che usa come background alta ha il cielo mascherato, è no bg: ecco perché
// sembra un tutt'uno il cielo con il colore dello sfondo del sito. Dobbiamo fare la stessa cosa»): il
// cielo delle foto alte è trasparente e il riquadro è la carta (avorio); le scritte tornano nell'inchiostro
// della rivista (occhiello rosso, h1 inchiostro, lead grafite, corsivo rosso, bottone rosso pieno, link
// fantasma inchiostro) e stanno SOPRA il soggetto: il blocco è alto quanto il contenuto (da lg almeno
// 100svh) e lo strato della foto, in flusso dopo il blocco, sale fino alla CIMA del soggetto, così il
// soggetto comincia al fondo del blocco e nessuna lettera gli sta sopra. D184: nessuna ombra su nessun
// nodo e nessun reset.
test.describe("la testa", () => {
  for (const vp of [
    { w: 1440, h: 900 },
    { w: 1024, h: 768 },
  ] as const) {
    for (const rotta of ROTTE) {
      test(`${rotta} a ${vp.w}×${vp.h}: carta dal pixel 0, blocco inchiostro sull'avorio alto almeno 100svh in cinque lingue, foto in flusso col soggetto al fondo del blocco, tre punti dopo, sizes della sorgente`, async ({ page, goto }, info) => {
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
          expect(g.sticky, `${lang}: uno sticky nella testa (A45: la foto scorre con la pagina)`).toBe(0);
          expect(g.posizioneRiquadro).toBe("relative");
          expect(Math.abs(g.section!.top), `${lang}: la section non comincia a scroll 0 (D176)`).toBeLessThanOrEqual(1);
          expect(Math.abs(g.riquadro!.top), `${lang}: il riquadro non è il pixel 0`).toBeLessThanOrEqual(1);
          // A45/A46: lo strato della foto è alto quanto la foto resa a larghezza piena (`aspect-ratio` dal
          // sorgente) e sta in flusso dopo il blocco, portato su di quanto vale il cielo trasparente; il
          // riquadro (la carta) è alto quanto blocco + strato − cielo.
          const [sw, sh] = tinte[rotta].sorgente;
          const altoFoto = (g.riquadro!.width * sh) / sw;
          // A48: lo strato è alto max(foto, cielo + contenuto sopra); sulle rotte di oggi il contenuto sta dentro la
          // foto, così la scatola della foto (= lo strato da lg) resta la foto resa e nessuna scritta finisce sul cielo.
          expect(g.strato!.height - altoFoto, `${lang}: lo strato è più basso della foto resa (A45)`).toBeGreaterThanOrEqual(-2);
          // A48/A54: le sezioni riempiono la foto dal fondo del blocco in giù («riempire più spazi possibili»); una coda
          // (≤ 15 % della foto: /metodo a 1024 in tedesco con le tre leve) fa crescere lo strato e il cover scala la foto
          // di altrettanto (zoom ≤ 1,15, la cima del soggetto scende di cima × Δ, sotto il blocco). Oltre, la pagina ha
          // posato troppo sulla foto: la coda scalerebbe la foto e il cielo.
          expect(g.strato!.height - altoFoto, `${lang}: le sezioni sopra la foto sono più alte della foto (A48): la coda scalerebbe la foto e il cielo`).toBeLessThanOrEqual(0.15 * altoFoto);
          expect(Math.abs(g.foto!.height - g.strato!.height), `${lang}: da lg la scatola della foto non riempie lo strato (A48)`).toBeLessThanOrEqual(1);
          // Il cielo in px dalla foto RESA (altoFoto): il margine negativo dello strato è scritto sulla larghezza (CSS 2.1 §8.3),
          // non sulla scatola, che con una coda corta è più alta della foto di qualche px (A48).
          const cielo = cieloPx(rotta, altoFoto);
          expect(Math.abs(g.riquadro!.height - (g.blocco!.height + g.strato!.height - cielo)), `${lang}: il riquadro non è blocco + foto − cielo (A46)`).toBeLessThanOrEqual(2);
          expect(Math.round(g.riquadro!.width)).toBe(g.clientWidth);
          expect(g.overflow).toBe("clip");
          expect(g.posizioneBlocco, `${lang}: il blocco sta dentro il riquadro, in flusso e in cima (A45)`).toBe("relative");
          expect(Math.abs(g.blocco!.top), `${lang}: il blocco non comincia al pixel 0`).toBeLessThanOrEqual(1);
          // Da lg il blocco è alto almeno 100svh e i comandi stanno in fondo al primo schermo, sull'avorio.
          expect(g.blocco!.height, `${lang}: il blocco non è alto almeno 100svh`).toBeGreaterThanOrEqual(g.innerHeight - 1);
          expect(g.blocco!.bottom, `${lang}: il blocco esce dal riquadro`).toBeLessThanOrEqual(g.riquadro!.bottom + 1);
          // Lo strato parte a blocco − cima (a 1440 e 1024 mai sopra il pixel 0: la cima più profonda, /acquista, sta
          // a 863 px) e chiude il riquadro; il soggetto comincia al fondo del blocco.
          expect(Math.abs(g.strato!.top - (g.blocco!.bottom - cielo)), `${lang}: lo strato non sale fino alla cima del soggetto (A46)`).toBeLessThanOrEqual(2);
          expect(g.strato!.top, `${lang}: lo strato esce sopra la carta`).toBeGreaterThanOrEqual(-1);
          expect(Math.abs(g.strato!.bottom - g.riquadro!.bottom), `${lang}: lo strato non chiude il riquadro`).toBeLessThanOrEqual(1);
          // I marcatori del segno (22 set., C01/G02): uno per banda di tinte.json, tutti dentro lo strato e tutti `foto`.
          expect(g.marcatori.length, `${lang}: nessun marcatore del segno`).toBe(tinte[rotta].segno.length);
          for (const m of g.marcatori) {
            expect(m.top, `${lang}: un marcatore comincia sopra lo strato`).toBeGreaterThanOrEqual(g.strato!.top - 1);
            expect(m.bottom, `${lang}: un marcatore finisce sotto lo strato`).toBeLessThanOrEqual(g.strato!.bottom + 1);
            expect(m.bg, `${lang}: un marcatore del segno non è la zona foto`).toBe("foto");
          }
          expect(g.dataBgRiquadro, `${lang}: il riquadro porta data-bg: il segno sarebbe avorio sull'avorio`).toBeNull();
          // --dt-cielo (la cima come quota del marcatore) è morta il 22 set. (C01/G02): resta --dt-cielo-h, la cima in frazione della larghezza.
          expect(Number(g.cieloVar), `${lang}: --dt-cielo-h non è la cima di tinte.json in frazione della larghezza`).toBeCloseTo((tinte[rotta].cielo.cima * sh) / sw, 4);
          expect(g.img!.left).toBeLessThanOrEqual(g.strato!.left + 1);
          expect(g.img!.right).toBeGreaterThanOrEqual(g.strato!.right - 1);
          expect(g.trasformata).toMatch(FERMA);
          expect(g.op, `${lang}: l'inquadratura da lg non è quella di tinte.json (D180)`).toBe(tinte[rotta].objectPosition.lg);
          // I nodi stanno dentro il blocco; i tre punti dopo la foto (la fascia segue il riquadro in flusso).
          expect(g.nodiFuori, `${lang}: nodi fuori dal blocco`).toBe(0);
          // A48 (22 set.): da lg i tre punti stanno SULLA foto, in bianco, dalla banda scura di tinte.json (`sopra`:
          // la piscina su /vendi, il prato su /acquista), entro il loro padding; mai sul cielo trasparente.
          if (g.punti && tinte[rotta].trattamento === "testa") {
            // A48/A54 (22 set.): da lg i tre punti stanno SULLA foto subito sotto il blocco (entro il loro padding), in
            // bianco con l'ombra attaccata alle lettere (A54): le sezioni riempiono la foto da lì in giù.
            expect(g.punti.top, `${lang}: i tre punti non stanno sulla foto subito dopo il blocco (A48)`).toBeGreaterThanOrEqual(g.blocco!.bottom - 1);
            expect(g.punti.top, `${lang}: i tre punti stanno troppo sotto il blocco`).toBeLessThanOrEqual(g.blocco!.bottom + 80);
            // A56 (22 set., pomeriggio: «le scritte bianche sopra le immagini, mettile di colore grigio, come quello della
            // hero della scritta "domus"»): il grigio del lockup (`--color-graphite`), senza l'ombra di A54.
            expect(g.stili.punti?.color, `${lang}: sulla foto i tre punti non sono nel grigio del lockup (A56)`).toBe("rgb(70, 66, 61)");
            expect(g.stili.punti?.shadow, `${lang}: sulla foto i tre punti portano ancora l'ombra (A56: col grigio non serve)`).toBe("none");
          } else if (g.punti) {
            // Nessuna banda scura (/recensioni, il muro bianco a sinistra): i tre punti seguono la foto, in pietra sulla carta.
            expect(g.punti.top, `${lang}: senza banda i tre punti non seguono la foto (A48)`).toBeGreaterThanOrEqual(g.foto!.bottom - 2);
            expect(g.stili.punti?.color, `${lang}: senza banda i tre punti non sono in pietra`).not.toBe("rgb(255, 255, 255)");
          }
          // Centrato (A41): H1 e lead hanno lo stesso centro del riquadro, entro 2 px.
          const cx = (g.riquadro!.left + g.riquadro!.right) / 2;
          for (const z of ["h1", "lead", "solid"] as const) if (g[z]) expect(Math.abs((g[z]!.left + g[z]!.right) / 2 - cx), `${lang}: ${z} non è centrato`).toBeLessThanOrEqual(2);
          expect(g.lead!.top, `${lang}: il lead non sta in alto`).toBeLessThan(g.h1!.top);
          expect(g.solid!.top, `${lang}: il bottone non sta in basso`).toBeGreaterThan(g.h1!.bottom);
          // I colori della rivista (A46), e nessuna ombra (D184).
          expect(g.stili.h1?.color, `${lang}: l'H1 non è inchiostro`).toBe(INK);
          expect(g.stili.eyebrow?.color, `${lang}: l'occhiello non è nel rosso cupo (A51)`).toBe(ROSSO_CUPO);
          expect(g.stili.lead?.color, `${lang}: il lead non è grafite`).toBe(GRAFITE);
          if (tinte[rotta].trattamento === "testa" || g.stili.script) expect(g.stili.script?.color, `${lang}: la calligrafia non è rossa`).toBe(ROSSO);
          for (const z of ["h1", "eyebrow", "lead", "ghost", "script", "solid"] as const) if (g.stili[z]) expect(g.stili[z]!.shadow, `${lang}: ${z} porta un'ombra (D184)`).toBe("none");
          expect(g.stili.h1!.classi).not.toMatch(/dt-alone|dt-ink-media/);
          if (g.stili.ghost) {
            expect(g.stili.ghost.color, `${lang}: il fantasma non è inchiostro`).toBe(INK);
            expect(g.stili.ghost.size, `${lang}: il fantasma non è 18 px (D174)`).toBe("18px");
            expect(g.ghost!.top, `${lang}: il fantasma non sta sotto il bottone`).toBeGreaterThanOrEqual(g.solid!.bottom - 1);
          }
          // I byte: `sizes` dal rapporto della sorgente; il bitmap non è più stretto di quel che lo strato dipinge.
          expect(g.sizes).toBe(SIZES_TESTA);
          const bucket = bucketDi(g.currentSrc);
          const serve = Math.max(g.foto!.width, (g.foto!.height * sw) / sh);
          // A48/A54: con una coda (≤ 15 % della foto) il cover scala la foto di altrettanto e la dipinge fino al 15 % più
          // larga dello strato (/metodo a 1024 in tedesco: 1107 px contro il bucket 1024): un ingrandimento ≤ 1,15.
          expect(bucket, `${lang}: bucket ${bucket} più stretto di ${serve.toFixed(0)}`).toBeGreaterThanOrEqual(Math.min(serve, sw) * 0.85 - 1);
          expect(g.naturalWidth).toBeGreaterThan(0);
          // Il WebP col cielo trasparente dove c'è (A46), altrimenti la sorgente.
          expect(g.currentSrc ?? "", `${lang}: la foto montata non è quella di tinte.json`).toContain(encodeURIComponent(tinte[rotta].cielo.file ?? tinte[rotta].file));
          // I fondi: il riquadro è la carta, la scatola della foto porta il placeholder (la tinta alta, D125), lo spazio sopra è nudo.
          expect(g.fondoRiquadro, `${lang}: il riquadro non è la carta (A46)`).toBe(rgb("#f6d9d0"));
          expect(g.fondoFoto, `${lang}: la scatola della foto non porta la tinta di attesa (D125)`).toBe(await tintaAttesa(page, rotta));
          expect(g.fondoStrato, `${lang}: lo strato ha un fondo: colorerebbe lo spazio sotto la foto (A48)`).toBe("rgba(0, 0, 0, 0)");
          expect(g.fondoPagina, `${lang}: lo spazio sopra la foto ha un fondo (A48: niente velo)`).toBe("rgba(0, 0, 0, 0)");
        }
      });
    }
  }
});

// ── la foto è la pagina ──────────────────────────────────────────────────────
// A45 (Alberto, 21 set. 2026): «le foto su era residence sono la pagina stessa: quando scrolli, le
// scritte salgono su come se fossero in quello spazio della foto, e stai scrollando la foto stessa come
// se fosse la pagina». Il riquadro è in flusso e alto quanto la foto: a ogni quota scorre 1:1 con la
// pagina, il blocco dei testi (dentro) con lui, la fascia dei punti segue; nessuno sticky, nessuna
// trasformata, nessuno ScrollTrigger della testa.
test.describe("la foto è la pagina", () => {
  for (const rotta of ["/vendi", "/metodo"] as const) {
    test(`${rotta} a 1440×900: riquadro, blocco e fascia scorrono 1:1 con la pagina; strato mai trasformato; nessun trigger`, async ({ page, goto }, info) => {
      test.skip(info.project.name !== "desktop-1440", "le quote sono a 1440×900");
      await goto(rotta);
      await idratata(page);
      const riposo = await geometria(page);
      expect(Math.abs(riposo.riquadro!.top)).toBeLessThanOrEqual(1);
      const altoFoto = riposo.riquadro!.height;
      expect(altoFoto, "il riquadro non è più alto dello schermo: la foto alta non è la pagina").toBeGreaterThan(900 + 100);
      expect(riposo.trasformata).toMatch(FERMA);
      // A48: lo spazio sopra la foto; dove è vuoto (nessun punto, nessuna sezione) è display: none e non si misura.
      const fascia = riposo.pagina!.height;
      const st0 = await page.evaluate(() => window.__dtST!());
      // `geometria` dà quote DI PAGINA (top + scrollY): in flusso restano quelle di riposo a ogni quota.
      for (const y of [300, 900, Math.round(altoFoto) + 260, 450, 0]) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(350);
        const g = await geometria(page);
        expect(Math.abs(g.riquadro!.top), `scroll ${y}: il riquadro non scorre con la pagina`).toBeLessThanOrEqual(1);
        expect(Math.abs(g.blocco!.top), `scroll ${y}: il blocco non scorre con la foto`).toBeLessThanOrEqual(1);
        if (fascia > 0) {
          expect(Math.abs(g.pagina!.top - riposo.pagina!.top), `scroll ${y}: lo spazio sopra la foto non scorre con la pagina`).toBeLessThanOrEqual(1);
          expect(Math.abs(g.pagina!.height - fascia)).toBeLessThanOrEqual(1);
        }
        expect(g.trasformata, `scroll ${y}: lo strato si è mosso`).toMatch(FERMA);
      }
      expect(await page.evaluate(() => window.__dtST!()), "scorrendo la testa ha creato altri ScrollTrigger").toBe(st0);
    });
  }
});

// ── la foto si chiude (A53) ──────────────────────────────────────────────────
// Alberto, 22 set. 2026, sera: «vorrei che quando arriviamo alla fine della foto (dove c'è l'erba) la foto
// con un animazione si chiude, come qui» (la cartolina del Congedo). ChiusuraFoto.tsx: quando il fondo dello
// spazio sopra passa la cima del viewport (da lg) la scatola della foto si ritira nella cornice 8/22 mentre
// sale, fino al 10 % del viewport; sotto lg quando il fondo della foto arriva al fondo del viewport, nella
// cornice 4/10, fino al 30 %. Si arma solo se la coda libera è almeno un quarto di viewport; nessuno sticky.
/** I numeri di un `inset(a% b%)` serializzato da Chrome (vuoto per `none`). */
const insetValues = (v: string) => (v.match(/[\d.]+(?=%)/g) ?? []).map(Number);

test.describe("la foto si chiude (A53)", () => {
  test("/acquista a 1440×900: a riposo nessun clip; a fine coda la cornice 8/22; lo strato resta in flusso e senza trasformate", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "desktop-1440", "la coda del prato si misura dal desktop");
    await goto("/acquista");
    await idratata(page);
    const g = await geometria(page);
    const clip = () => page.locator("[data-testa-foto-box]").first().evaluate((el) => getComputedStyle(el).clipPath);
    expect(await clip(), "a riposo la foto è già ritagliata").toBe("none");
    const coda = g.foto!.bottom - g.pagina!.bottom;
    expect(coda, "su /acquista non resta una coda libera sotto la ricerca: niente da chiudere").toBeGreaterThanOrEqual(900 * 0.25);
    // Prima della coda: il fondo dello spazio sopra ancora nel viewport → nessun ritaglio.
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.round(g.pagina!.bottom - 200));
    await page.waitForTimeout(1200);
    expect(await clip(), "la foto si chiude mentre la ricerca è ancora in vista").toMatch(/^none$|^inset\(0(px|%)?( 0(px|%)?){0,3}\)$/);
    // Fine della coda: il fondo della foto al 10 % del viewport → la cornice della cartolina.
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.round(g.foto!.bottom - 90));
    await page.waitForTimeout(1500);
    // Chrome serializza la cornice simmetrica in due valori; lo scrub (0,9 s) può stare a un millesimo dalla fine.
    const cornice = insetValues(await clip());
    expect(cornice, "a fine coda la foto non è nella cornice della cartolina (A53)").toHaveLength(2);
    expect(cornice[0]).toBeCloseTo(8, 1);
    expect(cornice[1]).toBeCloseTo(22, 1);
    const dopo = await geometria(page);
    expect(dopo.trasformata, "la chiusura ha scritto una trasformata (A45)").toMatch(FERMA);
    expect(dopo.sticky, "la chiusura ha creato uno sticky (A45)").toBe(0);
    expect(Math.abs(dopo.riquadro!.top), "il riquadro non scorre più con la pagina").toBeLessThanOrEqual(1);
  });

  test("/acquista a 390×844: la foto si ritira nella cornice 4/10 quando il suo fondo sale al 30 %", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "mobile-390", "la cornice del telefono");
    await goto("/acquista");
    await idratata(page);
    const g = await geometria(page);
    const clip = () => page.locator("[data-testa-foto-box]").first().evaluate((el) => getComputedStyle(el).clipPath);
    expect(await clip()).toBe("none");
    // Nel contesto touch di Playwright uno scrollTo istantaneo (e la rotella) non fanno arrivare a ScrollTrigger l'evento
    // di scroll che un dito produce (misurato il 22 set. nel pannello browser: progresso fermo a 0 con lo scroll a 855
    // px, cornice piena appena parte un evento `scroll`): si scorre e si emette l'evento, com'è nel gesto reale.
    await page.evaluate((top) => {
      window.scrollTo({ top, behavior: "instant" });
      window.dispatchEvent(new Event("scroll"));
    }, Math.round(g.foto!.bottom - 844 * 0.3) + 40);
    await page.waitForTimeout(1500);
    // Lo scrub (0,9 s) può stare a un millesimo dalla fine: si confrontano i numeri, a un decimo di punto.
    const cornice = insetValues(await clip());
    expect(cornice, "sul telefono la foto non è nella cornice 4/10 (A53, D29)").toHaveLength(2);
    expect(cornice[0]).toBeCloseTo(4, 1);
    expect(cornice[1]).toBeCloseTo(10, 1);
  });
});

// ── la ricerca sulla foto (A48) ──────────────────────────────────────────────
// Alberto, 22 set. 2026: «la ricerca intelligente va più su, in modo che appaia sopra la foto e dopo la
// scritta hero». Da lg la testa della ricerca (occhiello, campo, stato) sta nello spazio sopra la foto di
// /acquista, dopo i tre punti, in bianco nudo, dentro la foto; i filtri e i risultati (#case) restano
// sulla carta. Sotto lg segue la foto, in inchiostro. Un solo campo di ricerca nella pagina.
test.describe("la ricerca sulla foto (A48)", () => {
  const casi = [
    { w: 1440, h: 900, progetto: "desktop-1440", suFoto: true },
    { w: 1024, h: 768, progetto: "desktop-1440", suFoto: true },
    { w: 390, h: 844, progetto: "mobile-390", suFoto: false },
  ] as const;
  for (const c of casi) {
    test(`/acquista a ${c.w}×${c.h}: la testa della ricerca ${c.suFoto ? "posa sulla foto dopo i tre punti, in bianco" : "segue la foto, in inchiostro"}; filtri e risultati dopo`, async ({ page, goto }, info) => {
      test.skip(info.project.name !== c.progetto, `${c.w}×${c.h} si misura nel progetto ${c.progetto}`);
      await page.setViewportSize({ width: c.w, height: c.h });
      await goto("/acquista");
      await idratata(page);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const g = await geometria(page);
      const campo = page.getByRole("textbox", { name: /descrivi la casa/i });
      await expect(campo, "un solo campo della ricerca nella pagina").toHaveCount(1);
      const r = await campo.first().evaluate((el) => {
        const b = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const occhiello = el.closest(".dt-testa_sopra, #case")?.querySelector<HTMLElement>(".eyebrow");
        return { top: b.top + window.scrollY, bottom: b.bottom + window.scrollY, color: s.color, dentroSopra: !!el.closest(".dt-testa_sopra"), dentroCase: !!el.closest("#case"), occhiello: occhiello ? getComputedStyle(occhiello).color : null };
      });
      expect(r.dentroSopra, "il campo della ricerca non sta nello spazio sopra la foto (A48)").toBe(true);
      expect(r.dentroCase, "il campo della ricerca sta ancora in #case").toBe(false);
      expect(r.top, "la ricerca non viene dopo i tre punti").toBeGreaterThanOrEqual(g.punti!.bottom - 1);
      if (c.suFoto) {
        expect(r.bottom, "la ricerca esce dalla foto").toBeLessThanOrEqual(g.foto!.bottom + 1);
        // A56: il grigio del lockup al posto del bianco.
        expect(r.color, "sulla foto il campo non è nel grigio del lockup (A56)").toBe("rgb(70, 66, 61)");
        expect(r.occhiello, "sulla foto l'occhiello non è nel grigio del lockup (A56)").toBe("rgb(70, 66, 61)");
      } else {
        expect(r.top, "sotto lg la ricerca non segue la foto").toBeGreaterThanOrEqual(g.foto!.bottom - 1);
        expect(r.color, "sotto lg il campo non è inchiostro").toBe(INK);
      }
      // A52: la ricerca è un blocco solo: le cinque tendine stanno col campo, nello spazio sopra; sulla carta (#case)
      // restano gli affinamenti (chip di testo) e i risultati, dopo la testa.
      await expect(page.locator(".dt-testa_sopra").getByRole("combobox"), "le cinque tendine non stanno con il campo (A52)").toHaveCount(5);
      await expect(page.locator("#case").getByRole("combobox"), "una tendina è rimasta sulla carta: ricerca spezzata in due (A52)").toHaveCount(0);
      if (c.suFoto) expect(g.pagina!.bottom, "la ricerca esce dalla foto").toBeLessThanOrEqual(g.foto!.bottom + 1);
      const caseTop = await page.locator("#case").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      expect(caseTop, "#case non viene dopo la testa").toBeGreaterThanOrEqual(g.section!.bottom - 1);
      await expect(page.locator("#case").getByRole("button", { pressed: true }).first()).toBeVisible();
    });
  }
});

// ── la testata ─────────────────────────────────────────────────────────────
// A46: la testata è quella del resto del sito. Da lg è trasparente sulla carta (il cielo è avorio) e
// scorre via con la pagina: nav in inchiostro, senza ombra, nessun `data-su-foto` (D186 è superata).
// Sotto lg a scroll 0 la barra sticky è trasparente e «Menu» è inchiostro; da 24 px `data-solid` prende
// cream-deep come su ogni rotta (D82 è morta: sotto la barra c'è la carta, poi la foto). Il segno resta
// `grafite` sul cielo (scroll 0 e 450 su /metodo a 1440: la cima del soggetto sta a 900 px, cioè al fondo
// del blocco, sotto il segno a 450 + 40), vira `foto` sul soggetto e torna `grafite` cento pixel sotto il
// fondo della foto.
test.describe("la testata", () => {
  test("da lg: nessun data-su-foto nell'HTML, nav inchiostro, senza ombra, a scroll 0 e 40, il selettore lingua se c'è; il segno grafite sul cielo, foto sul soggetto, grafite sotto la foto", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "desktop-1440", "la nav esiste da lg");
    for (const rotta of ["/metodo", "/vendi", "/privacy"] as const) {
      const html = await (await page.request.get(rotta)).text();
      expect(html, `${rotta}: data-su-foto è ancora nell'HTML iniziale (A46)`).not.toMatch(/<header[^>]*\bdata-su-foto\b/);
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
        expect(nav.suFoto).toBe(false);
        expect(nav.nav?.color, `${rotta} a scroll ${s}: la nav non è inchiostro (A46)`).toBe(INK);
        expect(nav.nav?.shadow, `${rotta} a scroll ${s}: la nav porta un'ombra`).toBe("none");
        if (nav.lingua) {
          expect(nav.lingua.color, `${rotta}: il selettore lingua non è grafite come sul resto del sito`).toBe(GRAFITE);
          expect(nav.lingua.shadow).toBe("none");
        } else if (s === 0) info.annotations.push({ type: "lingua", description: `${rotta}: selettore lingua assente (NEXT_PUBLIC_ENABLE_I18N spento)` });
      }
    }
    // Il segno (A21; tema.ts salta la testata): sul cielo, che è la carta, resta grafite; sul soggetto vira foto.
    await goto("/metodo");
    await idratata(page);
    const tema = () => page.locator(".dt-segno").first().getAttribute("data-tema");
    await expect.poll(tema, { timeout: 8000 }).toBe("grafite");
    await page.evaluate(() => window.scrollTo({ top: 450, behavior: "instant" }));
    await expect.poll(tema, { timeout: 8000 }).toBe("grafite");
    const g = await geometria(page);
    // 22 set. (C01/G02): il segno vira «foto» dentro le BANDE scure della sua striscia (tinte.json `segno`), non
    // dalla cima del soggetto: su /metodo la cima è una punta di cipresso a destra e a sinistra c'è cielo per 700 px.
    const banda = g.marcatori[0];
    expect(banda, "/metodo senza bande del segno").toBeTruthy();
    expect(banda.top, "la prima banda scura di /metodo a 1440 sta sopra 450 + testata: il segno sarebbe già sulla foto").toBeGreaterThan(450 + 80);
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.round((banda.top + banda.bottom) / 2 - 45));
    await expect.poll(tema, { timeout: 8000 }).toBe("foto");
    const fondoFoto = g.riquadro!.bottom;
    expect(fondoFoto, "la foto alta non è più alta di uno schermo (A45)").toBeGreaterThan(900 + 100);
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.round(fondoFoto) + 100);
    await expect.poll(tema, { timeout: 8000 }).toBe("grafite");
    // Il lockup non si ricolora (C23): è la stessa immagine di sempre.
    expect(await page.locator('header img[alt="Domus Tua Immobiliare"]').first().getAttribute("src")).toBe("/logo-domustua-original.png");
  });

  test("sotto lg a scroll 0: barra trasparente sulla carta, «Menu» inchiostro, senza ombra; da 24 px la barra cream-deep come ovunque (D82 morta, A46)", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "mobile-390", "la barra sticky è del telefono");
    await page.setViewportSize({ width: 390, height: 844 });
    for (const rotta of ["/vendi", "/servizi", "/cookie"] as const) {
      await goto(rotta);
      await idratata(page);
      const header = page.locator("header").first();
      const menu = page.locator("header button[aria-controls='mobile-menu']");
      await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(menu).toHaveCSS("color", INK);
      expect(await menu.evaluate((el) => getComputedStyle(el).textShadow)).toBe("none");
      // Sotto la barra trasparente c'è la carta (D176): il primo elemento fuori dalla testata è il riquadro, o il
      // blocco dei testi col suo fondo trasparente, mai un nodo di testo (il lead parte sotto la testata).
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
      expect(sotto, `${rotta}: sotto la barra non c'è la carta`).toBe("riquadro");
      await page.evaluate(() => window.scrollTo({ top: 120, behavior: "instant" }));
      await expect(header).toHaveAttribute("data-solid", "true");
      await expect(header, `${rotta}: la barra solida non è cream-deep come sul resto del sito (A46)`).toHaveCSS("background-color", CREAM_DEEP);
      await expect(menu).toHaveCSS("color", INK);
    }
  });

  // 2.4.7: il bottone rosso pieno sta sull'avorio (A46) e tiene l'anello del sito, rosso 2 px a offset 3
  // (`:focus-visible` in globals.css): la regola dell'anello bianco a offset 0, nata per il bottone dentro la
  // foto (brief T §7), è morta. Il fantasma tiene l'anello del sito e il suo focus-visible (crema + sottolineatura).
  test("il fuoco sul bottone rosso sull'avorio: l'anello del sito, rosso a offset 3 (2.4.7); il fantasma idem", async ({ page, goto }, info) => {
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
      expect(anello.color, `${rotta}: l'anello del bottone non è quello del sito, rosso (A46)`).toBe(ROSSO);
      expect(anello.offset, `${rotta}: l'anello non sta a offset 3 come sul resto del sito`).toBe("3px");
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
        // Il ghost inchiostro a fuoco vira al rosso (`.dt-btn--ghost:focus-visible`), come sul resto del sito.
        await expect(ghost, `${rotta}: a fuoco il fantasma non è rosso`).toHaveCSS("color", rgb("#d20a0a"));
      }
    }
  });
});

// ── sotto lg ───────────────────────────────────────────────────────────────
// D176/D177, A45, A46: sul telefono la stessa testa dal pixel 0 sotto la testata sticky trasparente: il
// blocco centrato sta in cima, sull'avorio, alto quanto il suo contenuto (occhiello, H1, calligrafia,
// lead, comandi: nessun pavimento di 100svh, così il soggetto entra subito dopo i comandi senza un buco
// d'avorio), la foto 2:3 segue a larghezza piena (585 px a 390) portata su fino alla cima del soggetto,
// e i tre punti dopo. Nulla si taglia (il tedesco cresce, D177).
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
    test(`${c.rotta} a ${c.w}×${c.h} in ${c.lang}: blocco inchiostro sull'avorio alto quanto il contenuto, foto 2:3 a larghezza piena col soggetto subito dopo i comandi, tutto dentro, nessuna trasformata`, async ({ page, goto }, info) => {
      test.skip(info.project.name !== "mobile-390", "il ramo sotto la soglia si misura sul telefono");
      await page.setViewportSize({ width: c.w, height: c.h });
      await lingua(page, c.lang);
      await goto(c.rotta);
      await idratata(page);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const g = await geometria(page);
      expect(Math.abs(g.section!.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(g.riquadro!.top)).toBeLessThanOrEqual(1);
      // Lo strato è la foto resa a larghezza piena; il riquadro è blocco + foto − cielo (A46).
      const [sw, sh] = tinte[c.rotta].sorgente;
      expect(Math.abs(g.foto!.height - (g.riquadro!.width * sh) / sw), "la scatola della foto non è la foto resa a larghezza piena (A46, A48)").toBeLessThanOrEqual(2);
      expect(g.strato!.height, "lo strato è più basso della foto").toBeGreaterThanOrEqual(g.foto!.height - 1);
      const cielo = cieloPx(c.rotta, g.foto!.height);
      expect(Math.abs(g.riquadro!.height - (g.blocco!.height + g.strato!.height - cielo)), "il riquadro non è blocco + foto − cielo (A46)").toBeLessThanOrEqual(2);
      expect(g.overflow).toBe("clip");
      expect(g.posizioneRiquadro).toBe("relative");
      expect(g.posizioneBlocco).toBe("relative");
      expect(g.sticky, "uno sticky nella testa (A45)").toBe(0);
      expect(Math.abs(g.blocco!.top)).toBeLessThanOrEqual(1);
      // Sotto lg il blocco è alto quanto il contenuto: l'ultimo comando sta a un passo (il padding) dal fondo.
      const ultimo = g.ghost ?? g.solid!;
      expect(g.blocco!.bottom - ultimo.bottom, "sotto lg il blocco lascia un buco d'avorio sotto i comandi (A46: altezza del contenuto)").toBeLessThanOrEqual(80);
      expect(g.blocco!.bottom - ultimo.bottom, "l'ultimo comando tocca la foto").toBeGreaterThanOrEqual(24);
      // Il soggetto comincia al fondo del blocco: la foto sale fino alla sua cima.
      expect(Math.abs(g.strato!.top - (g.blocco!.bottom - cielo)), "la foto non sale fino alla cima del soggetto (A46)").toBeLessThanOrEqual(2);
      expect(g.strato!.top).toBeGreaterThanOrEqual(-1);
      expect(g.marcatori.length, "i marcatori del segno non sono le bande di tinte.json (22 set.)").toBe(tinte[c.rotta].segno.length);
      expect(g.op, "l'inquadratura sotto lg non è quella di tinte.json (D180)").toBe(tinte[c.rotta].objectPosition.sotto);
      expect(g.nodiFuori, "nodi fuori dal blocco").toBe(0);
      expect(ultimo.bottom, "l'ultimo comando esce dal blocco").toBeLessThanOrEqual(g.blocco!.bottom + 1);
      expect(g.blocco!.bottom, "il blocco esce dal riquadro").toBeLessThanOrEqual(g.riquadro!.bottom + 1);
      expect(Math.abs(g.strato!.bottom - g.riquadro!.bottom)).toBeLessThanOrEqual(1);
      // A48: sotto lg i tre punti stanno DOPO la foto (alta quanto la sorgente resa), in inchiostro.
      if (g.punti) {
        expect(g.punti.top, "sotto lg i tre punti non stanno dopo la foto").toBeGreaterThanOrEqual(g.foto!.bottom - 2);
        expect(g.stili.punti?.color, "sotto lg i tre punti non sono in pietra").not.toBe("rgb(255, 255, 255)");
      }
      // I colori della rivista anche qui (A46).
      expect(g.stili.h1?.color).toBe(INK);
      expect(g.stili.lead?.color).toBe(GRAFITE);
      expect(g.stili.eyebrow?.color).toBe(ROSSO_CUPO);
      expect(g.sizes).toBe(SIZES_TESTA);
      await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
      await page.waitForTimeout(400);
      const dopo = await geometria(page);
      expect(dopo.trasformata, "sotto la soglia lo strato si muove").toMatch(FERMA);
      // Quote di pagina (A45): riquadro e blocco scorrono 1:1 con la pagina, restano a 0 di pagina.
      expect(Math.abs(dopo.riquadro!.top), "a scroll 300 la foto non scorre con la pagina").toBeLessThanOrEqual(1);
      expect(Math.abs(dopo.blocco!.top), "il blocco non scorre con la foto").toBeLessThanOrEqual(1);
    });
  }
});

// ── senza JS e con moto ridotto ────────────────────────────────────────────
// D190: lo stato del CSS è lo stato a riposo; senza JS la pagina è completa e ferma, la foto intera in
// flusso sotto il blocco (A46: il soggetto comincia al fondo del blocco), l'H1 inchiostro sull'avorio,
// testo, tinta e cima del soggetto nell'HTML iniziale, nessun `data-su-foto` sulla testata.
test.describe("senza JS e con moto ridotto", () => {
  test.describe("senza JS", () => {
    test.use({ javaScriptEnabled: false });

    test("undici rotte: nessun data-hero-intro, nessuno sticky, foto intera sotto il blocco, H1 inchiostro, tinta, cielo e H1 nell'HTML iniziale, nessun data-su-foto", async ({ page }) => {
      for (const rotta of ROTTE) {
        const html = await (await page.request.get(rotta)).text();
        expect(html, `${rotta}: la tinta non è nell'HTML iniziale`).toContain("--dt-tinta-alta:");
        expect(html, `${rotta}: la cima del soggetto non è nell'HTML iniziale (A46)`).toContain("--dt-cielo-h:");
        expect(html, `${rotta}: l'H1 non è nell'HTML iniziale`).toMatch(/<h1[\s>]/);
        expect(html, `${rotta}: data-su-foto è ancora nell'HTML iniziale (A46)`).not.toMatch(/<header[^>]*\bdata-su-foto\b/);
        await page.goto(rotta, { waitUntil: "domcontentloaded" });
        expect(await page.evaluate(() => document.documentElement.hasAttribute("data-hero-intro"))).toBe(false);
        const h1 = page.locator("[data-testa] h1").first();
        await expect(h1).toBeVisible();
        expect(((await h1.textContent()) ?? "").trim().length, `${rotta}: H1 vuoto`).toBeGreaterThan(3);
        await expect(h1, `${rotta}: l'H1 non è inchiostro (A46)`).toHaveCSS("color", INK);
        const g = await geometria(page);
        expect(g.sticky, `${rotta}: uno sticky nella testa senza JS (A45)`).toBe(0);
        expect(g.corridoi).toBe(0);
        // Il cielo dalla foto RESA (larghezza × rapporto): con le sezioni sulla foto la scatola può crescere (A54).
        const cielo = cieloPx(rotta, (g.strato!.width * tinte[rotta].sorgente[1]) / tinte[rotta].sorgente[0]);
        expect(Math.abs(g.strato!.top - (g.blocco!.bottom - cielo)), `${rotta}: senza JS la foto non sale fino alla cima del soggetto (A46)`).toBeLessThanOrEqual(2);
        expect(g.trasformata).toMatch(FERMA);
        expect(g.riquadro!.height).toBeGreaterThan(100);
        expect(g.stili.h1!.shadow).toBe("none");
      }
    });
  });

  test.describe("con moto ridotto", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("nove teste: foto sotto il blocco, nessuna trasformata dopo lo scroll, nessun corridoio, testi inchiostro e grafite sull'avorio", async ({ page, goto }) => {
      for (const rotta of ROTTE_TESTA) {
        await goto(rotta);
        await page.waitForLoadState("load");
        expect(await page.evaluate(() => document.documentElement.hasAttribute("data-hero-intro"))).toBe(false);
        const g = await geometria(page);
        expect(Math.abs(g.strato!.top - (g.blocco!.bottom - cieloPx(rotta, (g.strato!.width * tinte[rotta].sorgente[1]) / tinte[rotta].sorgente[0]))), `${rotta}: con moto ridotto la foto non sale fino alla cima del soggetto (A46)`).toBeLessThanOrEqual(2);
        expect(g.corridoi).toBe(0);
        expect(g.stili.h1!.color).toBe(INK);
        expect(g.stili.lead!.color).toBe(GRAFITE);
        expect(g.fondoRiquadro).toBe(rgb("#f6d9d0"));
        expect(Math.abs(g.blocco!.top)).toBeLessThanOrEqual(1);
        await page.evaluate(() => window.scrollTo({ top: 500, behavior: "instant" }));
        await page.waitForTimeout(400);
        expect((await geometria(page)).trasformata, `${rotta}: con moto ridotto lo strato si muove`).toMatch(FERMA);
        // A53: con moto ridotto la foto non si chiude: nessun clip sulla scatola, a nessuna quota.
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.round(g.strato!.bottom - 200));
        await page.waitForTimeout(400);
        expect(await page.locator("[data-testa-foto-box]").first().evaluate((el) => getComputedStyle(el).clipPath), `${rotta}: con moto ridotto la foto si chiude (A53)`).toBe("none");
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

// ── le scritte sull'avorio (A46) ────────────────────────────────────────────
// A46 di Alberto (21 set. 2026, sera): col cielo trasparente «sembra un tutt'uno il cielo con il colore
// dello sfondo del sito». Qui si guarda coi pixel che sotto ogni scritta del blocco (occhiello, H1,
// calligrafia, lead, bottone, fantasma) ci sia SOLO la carta: si nasconde il blocco (`visibility:
// hidden`, nel solo test) e si campiona lo screenshot nei rettangoli delle scritte, che devono essere
// avorio ±3 per canale. Poi: nessun buco (il soggetto comincia al fondo del blocco), nessun
// traboccamento orizzontale, nodi tutti dentro, e CLS 0 dal primo paint alla decodifica della foto e
// oltre un viewport di scroll. Sei viewport: i due del progetto per intero, gli altri quattro su cinque
// rotte scelte (cielo profondo, cielo basso, tenda senza cielo, interno).
const VIEWPORT_A46 = [
  { w: 390, h: 844, progetto: "mobile-390", tutte: true },
  { w: 360, h: 640, progetto: "mobile-390", tutte: false },
  { w: 768, h: 1024, progetto: "desktop-1440", tutte: false },
  { w: 1024, h: 640, progetto: "desktop-1440", tutte: false },
  { w: 1440, h: 900, progetto: "desktop-1440", tutte: true },
  { w: 1920, h: 1080, progetto: "desktop-1440", tutte: false },
] as const;
const ROTTE_A46_SCELTE: Rotta[] = ["/vendi", "/acquista", "/servizi", "/open-domus", "/chi-siamo"];
const SCRITTE = ".dt-testa_blocco .eyebrow, .dt-testa_blocco h1, .dt-testa_blocco .script-word, .dt-testa_blocco p.lead, .dt-testa_blocco a.dt-btn";

/** I rettangoli delle scritte del blocco, in coordinate di pagina. */
async function rettangoliScritte(page: Page) {
  return page.evaluate((sel) => {
    const y = window.scrollY;
    return Array.from(document.querySelectorAll<HTMLElement>(sel))
      .map((el) => ({ nome: `${el.tagName.toLowerCase()}.${el.className.split(" ")[0]}`, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0)
      .map(({ nome, r }) => ({ nome, left: r.left, top: r.top + y, right: r.right, bottom: r.bottom + y }));
  }, SCRITTE);
}

/** Quanti pixel di `png` dentro il rettangolo (coordinate CSS relative al ritaglio, scala `k`) NON sono avorio ±3. */
async function pixelNonAvorio(png: Buffer, rett: { left: number; top: number; right: number; bottom: number }, k: number) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let fuori = 0;
  let totale = 0;
  let esempio = "";
  const x0 = Math.max(0, Math.ceil(rett.left * k));
  const x1 = Math.min(info.width, Math.floor(rett.right * k));
  const y0 = Math.max(0, Math.ceil(rett.top * k));
  const y1 = Math.min(info.height, Math.floor(rett.bottom * k));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * info.width + x) * ch;
      totale++;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      if (Math.abs(r - AVORIO_RGB[0]) > 3 || Math.abs(g - AVORIO_RGB[1]) > 3 || Math.abs(b - AVORIO_RGB[2]) > 3) {
        fuori++;
        if (!esempio) esempio = `(${Math.round(x / k)}, ${Math.round(y / k)}) = rgb(${r}, ${g}, ${b})`;
      }
    }
  }
  return { fuori, totale, esempio };
}

test.describe("le scritte sull'avorio (A46)", () => {
  for (const vp of VIEWPORT_A46) {
    for (const rotta of vp.tutte ? ROTTE_TESTA : ROTTE_A46_SCELTE) {
      test(`${rotta} a ${vp.w}×${vp.h}: sotto ogni scritta solo la carta (avorio ±3), soggetto al fondo del blocco, nessun traboccamento, CLS 0`, async ({ page, goto }, info) => {
        test.skip(info.project.name !== vp.progetto, `${vp.w}×${vp.h} si misura nel progetto ${vp.progetto}`);
        test.setTimeout(180_000);
        await page.setViewportSize({ width: vp.w, height: vp.h });
        // Il banner dei cookie è fisso in mezzo allo schermo: coprirebbe i rettangoli campionati.
        await setConsent(page, "accepted");
        // CLS della TESTA: si contano gli spostamenti con una sorgente dentro [data-testa] (`sources`
        // dell'API layout-shift) DA QUANDO I FONT SONO PRONTI, e sul totale la differenza prima/dopo la
        // decodifica della foto e prima/dopo uno scroll. Il tratto prima dei font non si pretende a zero:
        // sotto i quattro worker della suite Playfair, Pinyon e Plus Jakarta arrivano dopo il primo paint
        // e h1, lead, corsivo e nav rifluiscono (misurato: 0,02-0,05 a 1440, con la foto trascinata dal
        // blocco che cambia altezza; a riposo mai). Quel che A46 deve garantire è che la foto in flusso,
        // decodificando e scorrendo, non muova nulla.
        await page.addInitScript(() => {
          const w = window as unknown as { __dtCls: number; __dtClsTesta: number; __dtClsVoci: string[] };
          w.__dtCls = 0;
          w.__dtClsTesta = 0;
          w.__dtClsVoci = [];
          type Voce = PerformanceEntry & { hadRecentInput?: boolean; value?: number; sources?: Array<{ node?: Node | null }> };
          new PerformanceObserver((lista) => {
            for (const voce of lista.getEntries() as Voce[]) {
              if (voce.hadRecentInput) continue;
              w.__dtCls += voce.value ?? 0;
              const nodi = (voce.sources ?? []).map((s) => s.node).filter((n): n is Node => !!n);
              if (nodi.some((n) => (n instanceof Element ? n : n.parentElement)?.closest("[data-testa]"))) {
                w.__dtClsTesta += voce.value ?? 0;
                w.__dtClsVoci.push(nodi.map((n) => (n instanceof Element ? `${n.tagName.toLowerCase()}.${n.className}` : n.nodeName)).join(","));
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
        });
        await goto(rotta);
        await idratata(page);
        await page.evaluate(() => document.fonts.ready.then(() => true));
        await page.waitForTimeout(300);
        const leggiCls = () => page.evaluate(() => { const w = window as unknown as { __dtCls: number; __dtClsTesta: number; __dtClsVoci: string[] }; return { totale: w.__dtCls, testa: w.__dtClsTesta, voci: [...w.__dtClsVoci] }; });
        const clsPrima = await leggiCls();
        await page.locator("[data-testa-strato] img").first().evaluate((el) => (el as HTMLImageElement).decode().catch(() => undefined));
        await page.waitForTimeout(400);
        const clsDopo = await leggiCls();
        expect(clsDopo.testa - clsPrima.testa, `la testa ha mosso la pagina dopo i font: ${clsDopo.voci.slice(clsPrima.voci.length).join(" | ")}`).toBe(0);
        expect(clsDopo.totale - clsPrima.totale, "la decodifica della foto ha mosso la pagina").toBe(0);
        // Geometria: nessun buco, nulla fuori, nessun traboccamento.
        const g = await geometria(page);
        const cielo = cieloPx(rotta, (g.strato!.width * tinte[rotta].sorgente[1]) / tinte[rotta].sorgente[0]);
        expect(Math.abs(g.strato!.top - (g.blocco!.bottom - cielo)), "la foto non sale fino alla cima del soggetto").toBeLessThanOrEqual(2);
        // Dove la cima in px supera il blocco (/acquista a 1920×1080: 1150 contro 1080) lo strato comincia sopra la
        // carta e il clip taglia il solo cielo trasparente; altrove mai.
        if (!(rotta === "/acquista" && vp.w === 1920)) expect(g.strato!.top, "lo strato esce sopra la carta").toBeGreaterThanOrEqual(-1);
        if (vp.w >= 1024) expect(g.blocco!.height, "da lg il blocco non è alto almeno 100svh").toBeGreaterThanOrEqual(vp.h - 1);
        expect(g.nodiFuori, "nodi fuori dal blocco").toBe(0);
        const trabocco = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(trabocco, "traboccamento orizzontale").toBeLessThanOrEqual(0);
        // I pixel sotto le scritte: si nasconde il blocco e si guarda la carta che resta.
        const scritte = await rettangoliScritte(page);
        expect(scritte.length, "nessuna scritta trovata nel blocco").toBeGreaterThanOrEqual(4);
        await page.evaluate(() => document.querySelector<HTMLElement>(".dt-testa_blocco")!.style.setProperty("visibility", "hidden"));
        // Screenshot del VIEWPORT, mai `fullPage`: con fullPage Playwright allarga il viewport all'intera pagina
        // e i 100svh del blocco cambiano misura, quindi i rettangoli non sarebbero più quelli. Il blocco può
        // essere più alto dello schermo (360×640, /servizi a 1440): si scorre a ogni scritta, centrandola nel
        // viewport, lontano dalla barra sticky della testata (cream-deep da 24 px, sotto lg) e dalla barra
        // azioni fissa in basso (sotto 640 px) e dal lanciatore dell'assistente nell'angolo.
        for (const s of scritte) {
          const y = Math.max(0, Math.floor(s.top - (vp.h - (s.bottom - s.top)) / 2));
          await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
          await page.waitForTimeout(150);
          const scrollY = await page.evaluate(() => window.scrollY);
          const rett = { left: s.left, right: s.right, top: Math.max(0, s.top - scrollY), bottom: Math.min(s.bottom - scrollY, vp.h) };
          const png = await page.screenshot({ animations: "disabled", caret: "hide" });
          const k = ((await sharp(png).metadata()).width ?? 0) / vp.w;
          const esito = await pixelNonAvorio(png, rett, k);
          expect(esito.totale, `${s.nome}: rettangolo vuoto`).toBeGreaterThan(0);
          expect(esito.fuori, `${s.nome}: ${esito.fuori} pixel su ${esito.totale} sotto la scritta non sono avorio, es. ${esito.esempio} (A46: nessuna lettera sopra il soggetto)`).toBe(0);
        }
        await page.evaluate(() => document.querySelector<HTMLElement>(".dt-testa_blocco")!.style.removeProperty("visibility"));
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(150);
        // CLS anche dopo un viewport di scroll (la foto in flusso non muove nulla).
        const clsScroll0 = await leggiCls();
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), vp.h);
        await page.waitForTimeout(400);
        const clsScroll = await leggiCls();
        expect(clsScroll.testa - clsScroll0.testa, `scorrendo la testa ha mosso la pagina: ${clsScroll.voci.slice(clsScroll0.voci.length).join(" | ")}`).toBe(0);
        expect(clsScroll.totale - clsScroll0.totale, "spostamento di layout scorrendo").toBe(0);
      });
    }
  }
});

// ── sizes sotto lg ─────────────────────────────────────────────────────────
// D183: `sizes` è scritto per un riquadro 100svh (100svh·r di larghezza dipinta) e resta invariato con
// A46 (la foto sta a larghezza piena, 390 px a 390: il termine 151vw chiede più del necessario, mai
// meno). A44 (20 set. 2026): le nove foto sono 2:3 (2560×3816, r 0,671): `sizes` apre con 151vw e a
// DPR 2 il browser chiede 151 · 3,9 · 2 = 1178 px, cioè il bucket 1280: nessun ingrandimento (0,61).
test.describe("sizes sotto lg", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  test("390×844 a DPR 2 su /vendi, /metodo e /chi-siamo (2:3, A44): il primo termine, il bucket vero, la larghezza dipinta", async ({ page, goto }, info) => {
    test.skip(info.project.name !== "mobile-390", "il caso a DPR 2 vive nel project del telefono");
    // Il srcset di next/image è la lista dei deviceSizes qualunque sia la sorgente: con `100vw` (22 set., C02/P01/G03:
    // lo strato è largo 100vw in flusso, il conto per fold di D183 è morto con A45) a DPR 2 il browser chiede il
    // bucket 1024 (780 px); l'ottimizzatore non ingrandisce mai.
    const casi = [
      { rotta: "/vendi" as Rotta, primo: "100vw", dipinta: 390 },
      { rotta: "/metodo" as Rotta, primo: "100vw", dipinta: 390 },
      { rotta: "/chi-siamo" as Rotta, primo: "100vw", dipinta: 390 },
    ];
    for (const c of casi) {
      await goto(c.rotta);
      await idratata(page);
      await page.locator("[data-testa-strato] img").first().evaluate((el) => (el as HTMLImageElement).decode().catch(() => undefined));
      const g = await geometria(page);
      expect(g.dpr).toBe(2);
      const [sw, sh] = tinte[c.rotta].sorgente;
      expect(g.sizes, `${c.rotta}: sizes ${g.sizes}`).toBe(c.primo);
      expect(SIZES_TESTA).toBe(c.primo);
      expect(bucketDi(g.currentSrc), `${c.rotta}: bucket`).toBe(1024);
      // `naturalWidth` di un candidato `w` è corretto per la densità: il bitmap vero si legge dal file servito.
      const bitmap = (await sharp(await (await page.request.get(g.currentSrc!)).body()).metadata()).width ?? 0;
      expect(bitmap, `${c.rotta}: il bitmap non è min(1024, sorgente)`).toBe(Math.min(1024, sw));
      // A46/A48: la scatola della foto ha il rapporto della foto, il cover dipinge esattamente la sua larghezza.
      const dipinta = Math.max(g.foto!.width, (g.foto!.height * sw) / sh);
      expect(Math.abs(dipinta - c.dipinta), `${c.rotta}: dipinta ${dipinta.toFixed(0)}`).toBeLessThanOrEqual(2);
      // Il bitmap chiesto (dipinta × 2 = 780) contro quello che arriva (1024): nessun ingrandimento.
      const ingr = (dipinta * 2) / bitmap;
      expect(ingr, `${c.rotta}: ingrandimento ×${ingr.toFixed(2)}`).toBeLessThanOrEqual(1.001);
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

  test("il placeholder tinto sta sulla scatola della foto (A46, A48); il riquadro è la carta; gli altri moduli media restano cream-deep (D125)", async ({ page, goto }) => {
    await goto("/vendi");
    const scatola = await page.locator("[data-testa-foto-box]").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(scatola, "la scatola della foto non prende la tinta alta").toBe(await tintaAttesa(page, "/vendi"));
    expect(await page.locator("[data-testa-strato]").first().evaluate((el) => getComputedStyle(el).backgroundColor), "lo strato ha un fondo: colorerebbe lo spazio sotto la foto (A48)").toBe("rgba(0, 0, 0, 0)");
    const riquadro = await page.locator("[data-dive-zoom]").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(riquadro, "il riquadro della testa non è la carta (A46)").toBe(rgb("#f6d9d0"));
    // Su un interno la tinta misurata (D123) resta sullo strato e la carta resta avorio.
    await goto("/chi-siamo");
    expect(await page.locator("[data-testa-foto-box]").first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(await tintaAttesa(page, "/chi-siamo"));
    expect(await page.locator("[data-dive-zoom]").first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(rgb("#f6d9d0"));
    await goto("/vendi");
    const modulo = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "dt-media-full";
      document.querySelector("main")!.append(el);
      const c = getComputedStyle(el).backgroundColor;
      el.remove();
      return c;
    });
    expect(modulo).toBe(rgb("#f2cfc5"));
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
