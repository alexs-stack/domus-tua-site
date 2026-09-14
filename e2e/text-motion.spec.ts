import { readFileSync } from "node:fs";
import { join } from "node:path";
import { devices, type BrowserContextOptions, type Page } from "@playwright/test";
import { INTRO_KEY } from "../app/lib/motion/intro-constants";
import { test, expect, setConsent } from "./helpers";
import {
  budget,
  entryTimes,
  inkOf,
  lampo,
  letturaLampi,
  matrixOf,
  noOverflowX,
  primoPieno,
  productOpacity,
  readLcpBase,
  refreshTriggers,
  registraLampi,
  routeExternal,
  timeToHidden,
  waitArmed,
  watchMinInk,
  wheelTo,
  wheelToTop,
} from "./coreografia";

// Il testo in movimento (spec 2026-09-13 §9.2, test 1-3).
//
// La cliente ha chiesto il 4 agosto che i reveal rigiochino a ogni passaggio,
// in entrambe le direzioni (C22); Alberto il 13 settembre entrate e uscite
// speculari (A18); la decisione di lavoro D21 ne fissa la semantica: ingresso a
// filo del bordo, uscita alla linea dell'85 %, nulla dall'alto. Oggi i titoli
// sono di TextLines (righe in maschera, ScrollTrigger «top 86%»,
// `toggleActions: "restart none none reverse"`: escono solo risalendo e non
// rigiocano rientrando dall'alto) e i blocchi di Reveal (IntersectionObserver a
// soglia 0,12, transizione CSS di 0,9 s). Questi test passano su quel codice coi
// tetti di spec §9.2. Il test 3 guarda solo i titoli: oggi Reveal spegne i
// blocchi anche quando escono dall'alto (Reveal.tsx:34-38).
// I test sono a tempo: nel file girano in fila nello stesso worker (mode
// "default"), perché con fullyParallel (playwright.site.config.ts:41) si
// contenderebbero la CPU, e le misure del piano li lanciano con --workers=1.
// `guards` monta il mock delle terze parti (helpers.ts:59-118): la rotella
// attraversa #voci col consenso accettato, e Trustindex non arriva dalla rete.
// I test 1 e 2 misurano a ScrollTrigger rinfrescati dopo lo split
// (`refreshTriggers`, decisione di lavoro D38): oggi TextLines crea i trigger
// prima che il layout finisca di crescere e nessuno li rinfresca, e senza il
// refresh l'uscita del test 2 non arriva finché il titolo non è fuori dallo
// schermo. Il commit 2 non tocca il sito (difetto riferito al coordinatore): la
// scossa è dichiarata qui e nelle condizioni di misure/risultati.md, così un
// motore che non rinfresca da sé non passa per sbaglio. Il test 3 non la
// chiede: fra 0,5 × innerHeight e sopra il bordo alto nessun trigger cambia
// stato, con lo start stantio o rinfrescato.

test.use({ contextOptions: { reducedMotion: "no-preference" } });
test.describe.configure({ mode: "default" });

/** Titolo dell'uscita: il titolo TextLines con al più due righe a 1440 e a 390 scelto da misure/02-testo-oggi.mjs sonda. */
const EXIT_TARGET = "#costi h2";
/** Titolo che passa sopra il bordo alto: il più lungo in fondo alla home. */
const FROM_TOP_TARGET = "#servizi h2";

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

test("1 · in fondo alla home titoli e blocchi in vista entrano entro 3,5 s dal bordo", async ({ page, goto, guards }, testInfo) => {
  await goto("/");
  await refreshTriggers(page);
  for (const stop of ["#servizi", "#contatti"]) {
    // L'osservatore è armato prima della rotella: t0 è il fotogramma in cui il bordo alto entra dal basso.
    const watch = await entryTimes(page, stop, { blockRule: "engine", timeoutMs: 6000 });
    await wheelToTop(page, page.locator(stop), 0);
    const r = await watch.stop();
    await testInfo.attach("tempi", {
      contentType: "application/json",
      body: JSON.stringify({ kind: "ingresso", key: stop, titles: r.titles, blocks: r.blocks, ms: r.worstMs }),
    });
    expect(r.titles, `nessun titolo in vista in ${stop}`).toBeGreaterThan(0);
    expect(r.failures, stop).toEqual([]);
    expect(r.worstMs ?? Number.POSITIVE_INFINITY, `${stop}: ${JSON.stringify(r.items)}`).toBeLessThanOrEqual(budget(3500));
  }
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("2 · risalendo, un titolo sotto la linea dell'85 % esce entro 1,3 s", async ({ page, goto, guards }, testInfo) => {
  await goto("/");
  await refreshTriggers(page);
  const title = page.locator(EXIT_TARGET).first();
  await wheelToTop(page, title, 0.5);
  await expect.poll(async () => (await inkOf(title)).min, { timeout: 3500 }).toBeGreaterThanOrEqual(0.99);
  const watch = await timeToHidden(page, EXIT_TARGET, { line: 0.85, below: 0.1, timeoutMs: 5000 });
  await wheelToTop(page, title, 0.93, 0.03);
  const r = await watch.result;
  await testInfo.attach("tempi", {
    contentType: "application/json",
    body: JSON.stringify({ kind: "uscita", key: EXIT_TARGET, leaves: r.leaves, ms: r.ms, reason: r.reason }),
  });
  expect(r.reason, `${EXIT_TARGET}: ${r.reason}`).toBe("ok");
  expect(r.ms ?? Number.POSITIVE_INFINITY, `${EXIT_TARGET} esce in ${r.ms} ms`).toBeLessThanOrEqual(budget(1300));
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("3 · un titolo passato sopra il bordo alto resta pieno, e rientrando dall'alto non rigioca", async ({ page, goto, guards }, testInfo) => {
  await goto("/");
  const title = page.locator(FROM_TOP_TARGET).first();
  await wheelToTop(page, title, 0.5);
  await expect.poll(async () => (await inkOf(title)).min, { timeout: 3500 }).toBeGreaterThanOrEqual(0.99);
  const h = await title.evaluate((el) => el.getBoundingClientRect().height / window.innerHeight);
  // Uscita dall'alto: l'osservatore vede ogni fotogramma della discesa e 1,5 s di pagina ferma.
  const out = await watchMinInk(page, FROM_TOP_TARGET);
  await wheelToTop(page, title, -h - 0.25, 0.05);
  await page.waitForTimeout(1500);
  const worstOut = await out.stop();
  // Rientro dall'alto: un replay porterebbe le righe sotto la maschera almeno per un fotogramma.
  const back = await watchMinInk(page, FROM_TOP_TARGET);
  await wheelToTop(page, title, 0.3);
  await page.waitForTimeout(1500);
  const worstBack = await back.stop();
  const FROM_TOP_BLOCK = '#servizi :is(.reveal, [data-reveal="ctn"], [data-reveal="still"])';
  const block = page.locator(FROM_TOP_BLOCK).first();
  await wheelToTop(page, block, 0.5);
  await expect.poll(() => productOpacity(block), { timeout: 3500 }).toBeGreaterThanOrEqual(0.99);
  const hb = await block.evaluate((el) => el.getBoundingClientRect().height / window.innerHeight);
  const outBlock = await watchMinInk(page, FROM_TOP_BLOCK, "[data-dt-nessuna-foglia]");
  await wheelToTop(page, block, -hb - 0.25, 0.05);
  await page.waitForTimeout(1500);
  const worstOutBlock = await outBlock.stop();
  const backBlock = await watchMinInk(page, FROM_TOP_BLOCK, "[data-dt-nessuna-foglia]");
  await wheelToTop(page, block, 0.3);
  await page.waitForTimeout(1500);
  const worstBackBlock = await backBlock.stop();
  expect(worstOutBlock, `${FROM_TOP_BLOCK} sopra il bordo scende a ${worstOutBlock.toFixed(2)}`).toBeGreaterThanOrEqual(0.99);
  expect(worstBackBlock, `${FROM_TOP_BLOCK} rientrando dall'alto scende a ${worstBackBlock.toFixed(2)}`).toBeGreaterThanOrEqual(0.99);
  await testInfo.attach("tempi", {
    contentType: "application/json",
    body: JSON.stringify({ kind: "dall-alto", key: FROM_TOP_TARGET, minInk: worstOut }),
  });
  await testInfo.attach("tempi", {
    contentType: "application/json",
    body: JSON.stringify({ kind: "rientro-dall-alto", key: FROM_TOP_TARGET, minInk: worstBack }),
  });
  expect(worstOut, `${FROM_TOP_TARGET} sopra il bordo scende a ${worstOut.toFixed(2)}`).toBeGreaterThanOrEqual(0.99);
  expect(worstBack, `${FROM_TOP_TARGET} rientrando dall'alto scende a ${worstBack.toFixed(2)}`).toBeGreaterThanOrEqual(0.99);
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

// 9 · I token del lessico arrivano al CSS del build (D17; spec §2.6 e §9.2).
// Tailwind emette solo le variabili di tema usate, salvo `@theme static`: qui
// si leggono dal documento vero, perché le leggono anche JS e i test di
// movimento. I numeri passano da parseFloat e le curve da `bezier()`: il
// minificatore può scrivere `.4s` per `0.4s` e `.25` per `0.25`. I tempi in
// millisecondi passano da `ms()`: il minificatore scrive `.25s` per `250ms`.
test("9 · i token del lessico arrivano al CSS del build", async ({ page, goto }) => {
  await goto("/");
  const v = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    const g = (n: string) => s.getPropertyValue(n).trim();
    return {
      s: g("--dur-dt-s"),
      m: g("--dur-dt-m"),
      l: g("--dur-dt-l"),
      stagger: g("--stagger-dt"),
      delay: g("--delay-dt-reveal"),
      painted: g("--dt-painted"),
      ctn: g("--dt-ctn-y"),
      out: g("--ease-dt-out"),
      in: g("--ease-dt-in"),
      tdFast: g("--td-duration-fast"),
      tdSmooth: g("--td-ease-smooth-out"),
      width: window.innerWidth,
    };
  });
  const bezier = (x: string) => x.replace(/\s/g, "").replace(/(^|[(,])0\./g, "$1.");
  const ms = (x: string) => (x.endsWith("ms") ? Number.parseFloat(x) : Number.parseFloat(x) * 1000);
  expect(Number.parseFloat(v.s)).toBe(0.4);
  expect(Number.parseFloat(v.m)).toBe(0.8);
  expect(Number.parseFloat(v.l)).toBe(1.2);
  expect(Number.parseFloat(v.stagger)).toBe(0.1);
  expect(Number.parseFloat(v.delay)).toBe(0.3);
  expect(Number.parseFloat(v.painted)).toBe(0.02);
  expect(v.ctn.endsWith("vw")).toBe(true);
  expect(Number.parseFloat(v.ctn)).toBe(v.width >= 1024 ? 3.333 : 11.54);
  expect(bezier(v.out)).toBe("cubic-bezier(.25,1,.5,1)");
  expect(bezier(v.in)).toBe("cubic-bezier(.5,0,.75,0)");
  expect(ms(v.tdFast)).toBe(250);
  expect(bezier(v.tdSmooth)).toBe("cubic-bezier(.22,1,.36,1)");
});

// ── Commit 5: titoli per lettera (spec §2.3, §9.2 test 1-4, 7-9; A20 e A22 di Alberto) ──

type Stato = { n: number; min: number; maxY: number; maxRot: number };

// Caratteri dei titoli dentro `scope` (o del titolo `scope` stesso): minimo del prodotto delle
// opacità fino a #main e scarto massimo dalla matrice identità, |m42| in px e max(|a − 1|, |b|).
// Con `inVista` solo i titoli che intersecano il viewport. Spec §9.2 test 1; corsia sistema §7.2.1.
async function statoCaratteri(page: Page, scope: string, inVista: boolean): Promise<Stato> {
  return page.evaluate(
    ([s, vista]) => {
      const prod = (el: Element) => {
        let p = 1;
        for (let n: Element | null = el; n; n = n.parentElement) {
          p *= Number(getComputedStyle(n).opacity);
          if (n.id === "main") break;
        }
        return p;
      };
      const radice = document.querySelector(s);
      if (!radice) throw new Error(`manca ${s}`);
      const titoli = [
        ...(radice.matches('[data-reveal="title"]') ? [radice] : []),
        ...Array.from(radice.querySelectorAll('[data-reveal="title"]')),
      ].filter((t) => {
        if (!vista) return true;
        const r = t.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      });
      const out = { n: 0, min: 1, maxY: 0, maxRot: 0 };
      for (const t of titoli) {
        for (const c of Array.from(t.querySelectorAll("[data-c]"))) {
          const tr = getComputedStyle(c).transform;
          const m = new DOMMatrixReadOnly(tr === "none" ? undefined : tr);
          out.n += 1;
          out.min = Math.min(out.min, prod(c));
          out.maxY = Math.max(out.maxY, Math.abs(m.m42));
          out.maxRot = Math.max(out.maxRot, Math.abs(m.a - 1), Math.abs(m.b));
        }
      }
      return out;
    },
    [scope, inVista] as const,
  );
}

const pieno = (v: Stato) => v.n > 0 && v.min > 0.99 && v.maxY < 0.5 && v.maxRot < 0.01;

async function topDi(page: Page, sel: string) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) throw new Error(`manca ${s}`);
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, h: r.height, vh: window.innerHeight };
  }, sel);
}

test("1b · in fondo alla home ogni carattere in vista arriva pieno e a matrice identità entro 3,5 s", { tag: "@titoli" }, async ({ page, goto, guards }) => {
  await goto("/");
  await waitArmed(page);
  // Oltre #recensioni con la rotella, senza misurarla: il suo titolo arriva col film delle
  // stelle a 0,94 (spec §2.4) e dentro il wrapper [data-sr-el] resta a 0 fino ad allora.
  const stelle = await topDi(page, "#recensioni");
  await wheelTo(page, stelle.top + stelle.h);
  for (const id of ["#servizi", "#chi-siamo", "#contatti"] as const) {
    // D45: la rotella porta a 0,3 × innerHeight il primo titolo della sezione, non il suo bordo,
    // e wheelToTop ne rilegge la posizione a ogni colpo: a 390 il ritratto di Team sta sopra il
    // titolo di #chi-siamo, che col bordo della sezione a 0,3 resta sotto il viewport.
    await wheelToTop(page, page.locator(`${id} [data-reveal="title"]`).first(), 0.3);
    expect((await statoCaratteri(page, id, true)).n, `${id}: nessun carattere di titolo in vista`).toBeGreaterThan(0);
    await expect
      .poll(async () => pieno(await statoCaratteri(page, id, true)), { timeout: budget(3_500), intervals: [100] })
      .toBe(true);
  }
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("2b · uscita del titolo più lungo: col bordo alto fra 85 % e 100 % i caratteri di #servizi scendono sotto 0,1 entro 1,3 s", { tag: "@titoli" }, async ({ page, goto, guards }) => {
  await goto("/");
  await waitArmed(page);
  const sel = '#servizi [data-reveal="title"]';
  // D45: la posizione del titolo si rilegge prima di ogni colpo di rotella (wheelToTop, come nei
  // test 2 e 3): una lettura sola, fatta all'armamento, non segue l'altezza che la pagina sopra
  // #servizi prende dopo, e il bordo può finire fuori dalla fascia 85-100 %.
  const title = page.locator(sel).first();
  await wheelToTop(page, title, 0.4);
  await expect.poll(async () => pieno(await statoCaratteri(page, sel, false)), { timeout: budget(3_500) }).toBe(true);
  await wheelToTop(page, title, 0.92);
  const bordo = await page.evaluate((s) => document.querySelector(s)!.getBoundingClientRect().top / window.innerHeight, sel);
  expect(bordo).toBeGreaterThan(0.85);
  expect(bordo).toBeLessThan(1);
  await expect
    .poll(
      () =>
        page.evaluate((s) => {
          let max = 0;
          for (const c of Array.from(document.querySelectorAll(`${s} [data-c]`))) {
            let p = 1;
            for (let n: Element | null = c; n; n = n.parentElement) {
              p *= Number(getComputedStyle(n).opacity);
              if (n.id === "main") break;
            }
            max = Math.max(max, p);
          }
          return max;
        }, sel),
      { timeout: budget(1_300), intervals: [50] },
    )
    .toBeLessThan(0.1);
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("4 · ancora /#contatti: i titoli sopra l'ancora sono già pieni al primo campione", { tag: "@titoli" }, async ({ page, goto, guards }) => {
  await goto("/#contatti");
  await waitArmed(page);
  // D45: l'arrivo all'ancora è lo scroll nativo al frammento (html { scroll-behavior: smooth }),
  // e il motore fa nascere shown i gruppi che attraversa (D39). Il salto a #servizi parte a
  // scroll fermo, con l'h2 di #servizi già passato sopra il viewport. A 1440 lo scroll nativo si
  // ferma prima di #contatti, perché la pagina cresce dopo load (difetto del sito riferito al
  // coordinatore): qui si misura l'attraversamento, e l'arrivo lo presidia reveal-engine.spec.ts
  // su /vendi. Il campione legge l'h2, in vista dopo il salto: gli h3 dei servizi finiscono
  // sotto il viewport e il motore li nasconde (D40).
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const y = window.scrollY;
          await new Promise((r) => setTimeout(r, 250));
          const h = document.querySelector('#servizi [data-reveal="title"]');
          return !!h && y > 0 && window.scrollY === y && h.getBoundingClientRect().bottom < 0;
        }),
      { message: "l'arrivo a /#contatti non attraversa il titolo di #servizi", timeout: 10_000, intervals: [100] },
    )
    .toBe(true);
  await page.evaluate(() => {
    const h = document.querySelector('#servizi [data-reveal="title"]');
    if (!h) throw new Error("manca il titolo di #servizi");
    window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - 120, behavior: "instant" });
  });
  const unita = page.locator('#servizi [data-reveal="title"]').first().locator("[data-c]");
  expect(await unita.count()).toBeGreaterThan(0);
  expect(await productOpacity(unita.first())).toBeGreaterThan(0.99);
  expect(await productOpacity(unita.last())).toBeGreaterThan(0.99);
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

// Cambio lingua su /metodo col cookie al primo caricamento (spec §2.3 «Cambio lingua», §9.2
// test 7; corsia sistema §7.2.7). Lo switcher è spento nel build degli e2e
// (LanguageSwitcher.tsx:12, :38): LocaleProvider applica il cookie dopo l'idratazione
// (LocaleProvider.tsx:30-37), SplitChars riusa gli span per indice e RevealGroup si registra
// di nuovo. I caratteri riusati e quelli nuovi (il tedesco ne ha di più) devono arrivare pieni.
test("7 · cambio lingua su /metodo: nomi, lettere e stato dei caratteri in de e fr", { tag: "@lingua" }, async ({ page, goto, guards }) => {
  test.setTimeout(90_000);
  await page.context().addCookies([{ name: "dt_locale", value: "it", domain: "127.0.0.1", path: "/" }]);
  await goto("/metodo");
  const nomeIt = (await page.locator("#main h1").getAttribute("aria-label")) ?? "";
  expect(nomeIt, "aria-label italiano vuoto").not.toBe("");
  for (const lingua of ["de", "fr"] as const) {
    await page.context().addCookies([{ name: "dt_locale", value: lingua, domain: "127.0.0.1", path: "/" }]);
    await goto("/metodo");
    await expect(page.locator("html")).toHaveAttribute("lang", lingua);
    await waitArmed(page);
    const h1 = page.locator("#main h1");
    await expect(h1).not.toHaveAttribute("aria-label", nomeIt);
    if (lingua === "de") await expect(h1).toHaveAttribute("aria-label", "Kein Inserat. Eine Methode.");
    const incoerenti = await page.locator('#main [data-reveal="title"]').evaluateAll((els) =>
      els
        .map((el) => ({
          nome: el.getAttribute("aria-label") ?? el.querySelector(".sr-only")?.textContent ?? "",
          lettere: Array.from(el.querySelectorAll("[data-c]"), (c) => c.textContent ?? "").join(""),
        }))
        .filter((x) => x.nome.replace(/\s+/g, "") !== x.lettere),
    );
    expect(incoerenti, lingua).toEqual([]);
    await expect
      .poll(async () => pieno(await statoCaratteri(page, "#main h1", false)), { timeout: budget(3_500), intervals: [100] })
      .toBe(true);
    const passi = '#main h4[data-reveal="title"]';
    const t = await topDi(page, passi);
    await wheelTo(page, t.top - t.vh * 0.5);
    await expect
      .poll(async () => pieno(await statoCaratteri(page, passi, false)), { timeout: budget(3_500), intervals: [100] })
      .toBe(true);
  }
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

// L'accento (spec §2.2, riga `accent`; A20 e A22 di Alberto): la calligrafia di Method su /metodo
// nasce armata a x 10vw e rotateX 90; entra entro 0,3 + min(0,1; 1,2/(n−1))·(n−1) + 1,2 s più
// 250 ms; col bordo alto al 92 % esce sotto 0,1 entro 1,3 s; a 390 la corsa di 10vw non allarga
// la pagina (spec §9.2, traboccamento).
test("7a · accento: la calligrafia di Method entra da x 10vw, esce e non trabocca", { tag: "@accento" }, async ({ page, goto, guards }) => {
  await goto("/metodo");
  await waitArmed(page);
  const sel = '#metodo [data-reveal="accent"]';
  const t = await topDi(page, sel);
  await wheelTo(page, Math.max(0, t.top - t.vh * 1.5));
  const primo = page.locator(`${sel} [data-c]`).first();
  const vw = await page.evaluate(() => window.innerWidth);
  await expect.poll(async () => (await matrixOf(primo)).m41, { timeout: 2_000 }).toBeGreaterThan(0.1 * vw - 2);
  const armato = await matrixOf(primo);
  expect(armato.m41, "x all'armamento").toBeLessThan(0.1 * vw + 2);
  expect(Math.abs(armato.d), "rotateX 90 all'armamento").toBeLessThan(0.05);
  // Method rende tre calligrafie, una per atto: il tetto di spec §2.2 e D19 conta gli n caratteri
  // della prima (quella di `t`), la stessa che ingresso e uscita misurano.
  const n = await page.locator(sel).first().locator("[data-c]").count();
  const tetto = Math.round((0.3 + Math.min(0.1, 1.2 / Math.max(1, n - 1)) * (n - 1) + 1.2) * 1000) + 250;
  const ingresso = await page.evaluate(
    async ([s, limite]) => {
      const el = document.querySelector(s)!;
      const chars = Array.from(el.querySelectorAll("[data-c]"));
      const prod = (c: Element) => {
        let p = 1;
        for (let k: Element | null = c; k; k = k.parentElement) {
          p *= Number(getComputedStyle(k).opacity);
          if (k.id === "main") break;
        }
        return p;
      };
      const fermo = (c: Element) => {
        const tr = getComputedStyle(c).transform;
        const m = new DOMMatrixReadOnly(tr === "none" ? undefined : tr);
        return Math.abs(m.m41) < 0.5 && Math.abs(m.d - 1) < 0.01;
      };
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5, behavior: "instant" });
      const t0 = performance.now();
      let largo = 0;
      while (performance.now() - t0 < limite + 1500) {
        await new Promise((r) => requestAnimationFrame(r));
        largo = Math.max(largo, document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (chars.every((c) => fermo(c) && prod(c) > 0.99)) return { ms: Math.round(performance.now() - t0), largo };
      }
      return { ms: -1, largo };
    },
    [sel, tetto] as const,
  );
  expect(ingresso.ms, `ingresso mai completo (tetto ${tetto} ms)`).toBeGreaterThanOrEqual(0);
  expect(ingresso.ms, `ingresso ${ingresso.ms} ms, tetto ${tetto} ms`).toBeLessThanOrEqual(budget(tetto));
  expect(ingresso.largo, "la corsa di 10vw ha allargato la pagina").toBeLessThanOrEqual(0);
  await noOverflowX(page);
  await wheelTo(page, t.top - t.vh * 0.92);
  await expect
    .poll(
      () =>
        page.evaluate((s) => {
          let max = 0;
          for (const c of Array.from(document.querySelector(s)!.querySelectorAll("[data-c]"))) {
            let p = 1;
            for (let k: Element | null = c; k; k = k.parentElement) {
              p *= Number(getComputedStyle(k).opacity);
              if (k.id === "main") break;
            }
            max = Math.max(max, p);
          }
          return max;
        }, sel),
      { timeout: budget(1_300), intervals: [50] },
    )
    .toBeLessThan(0.1);
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("8 · budget dei nodi: i [data-c] della home a 1440 non superano la base di più del 20 %", { tag: "@titoli" }, async ({ page, goto, guards }, info) => {
  test.skip(info.project.name !== "desktop-1440", "la base è fissata a 1440 (spec §2.3)");
  await goto("/");
  await waitArmed(page);
  const altezza = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < altezza; y += 900) await wheelTo(page, y);
  const n = await page.locator("[data-c]").count();
  const base = JSON.parse(readFileSync(join(process.cwd(), "e2e/baseline/data-c.json"), "utf8")) as { "/": { "1440": number } };
  expect(n).toBeGreaterThan(0);
  expect(n, `[data-c] ${n} contro la base ${base["/"]["1440"]}`).toBeLessThanOrEqual(Math.ceil(base["/"]["1440"] * 1.2));
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

const PAGE_HERO = ["/acquista", "/chi-siamo", "/cookie", "/domande-frequenti", "/lavora-con-noi", "/metodo", "/open-domus", "/privacy", "/recensioni", "/servizi", "/vendi"];
const LINGUE = ["it", "en", "fr", "de", "es"] as const;

// Spec §2.3 «Accessibilità»: sugli 11 H1 di PageHero × 5 lingue il nome accessibile coincide
// con innerText normalizzato. LocaleProvider scrive `lang` prima che React renda la lingua
// nuova (LocaleProvider.tsx:34-35): nome e testo si leggono nello stesso evaluate, e fuori
// dall'italiano il testo dell'hero deve essere cambiato rispetto a quello italiano della stessa
// rotta. D43: la lingua nuova si riconosce dal testo della sezione di PageHero e non dal nome
// dell'H1, perché /cookie e /privacy hanno lo stesso titolo in it e en («Cookie Policy.»,
// «Privacy Policy.»).
test("nomi · gli H1 delle 11 PageHero hanno nelle cinque lingue il nome che si legge", { tag: "@lingua" }, async ({ page, goto, guards }, info) => {
  test.skip(info.project.name !== "desktop-1440", "undici rotte per cinque lingue: basta una larghezza");
  test.setTimeout(300_000);
  const norm = (s: string, l: string) => s.replace(/ß/g, "ss").toLocaleLowerCase(l).replace(/\s+/g, " ").trim();
  const heroIt = new Map<string, string>();
  for (const l of LINGUE) {
    await page.context().addCookies([{ name: "dt_locale", value: l, domain: "127.0.0.1", path: "/" }]);
    for (const r of PAGE_HERO) {
      await goto(r);
      await expect(page.locator("html")).toHaveAttribute("lang", l);
      const h1 = page.locator("#main h1");
      const leggi = () =>
        h1.evaluate((el) => ({
          nome: el.getAttribute("aria-label") ?? "",
          testo: (el as HTMLElement).innerText,
          hero: el.closest("section")?.innerText ?? "",
        }));
      await expect
        .poll(
          async () => {
            const v = await leggi();
            const cambiato = l === "it" || (v.hero !== "" && v.hero !== heroIt.get(r));
            return v.nome !== "" && cambiato && norm(v.testo, l) === norm(v.nome, l);
          },
          { timeout: 5_000, intervals: [100] },
        )
        .toBe(true);
      const { nome, hero } = await leggi();
      if (l === "it") heroIt.set(r, hero);
      await expect(page.getByRole("heading", { level: 1, name: nome, exact: true })).toHaveCount(1);
    }
  }
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

// ── Commit 6: H1 dipinti e lead a righe (spec §2.5, §5.2, §9.2 test 5-7; A20 di Alberto) ──

const ROTTE_H1 = ["/vendi", "/contatti", "/case-vendute", "/valutazione-immobile-tradate", "/"] as const;
/** Spec §2.5: partenza 150 ms dopo l'armamento, ritardo 0,3 s, durata 1,2 s, tetto dello stagger 1,2 s. */
const TETTO_PIENO_MS = 150 + 300 + 1200 + 1200;

// Spec §9.2 test 5 e §2.5. Il titolo sopra la piega non passa mai da ≥ 0,9 a ≤ 0,1 e alla fine si
// legge. Sulle rotte interne, in più: al primo campione è dipinto (≤ 0,1, la regola dello 0,02),
// l'H1 l'ha armato il motore e non la rete CSS dei 6 s, e il primo carattere è pieno entro
// TETTO_PIENO_MS dall'armamento o, col sipario, dall'handoff.
async function controllaLampi(page: Page, rotta: string, sipario: boolean) {
  const r = await letturaLampi(page);
  const traccia = r.serie.map((v, i) => `${r.tempi[i]}:${v.toFixed(2)}`).join(" ");
  expect(r.serie.length, "nessun campione: manca il primo carattere in #main").toBeGreaterThan(30);
  expect(lampo(r.serie), traccia).toBe(false);
  expect(r.serie.at(-1) ?? 0, `il titolo non è mai diventato leggibile: ${traccia}`).toBeGreaterThanOrEqual(0.9);
  if (rotta === "/") return;
  expect(r.serie[0], `al primo campione l'H1 non è dipinto a 0,02: ${traccia}`).toBeLessThanOrEqual(0.1);
  expect(r.armato, "l'h1 non è mai stato armato dal motore").not.toBeNull();
  const primo = primoPieno(r.serie, r.tempi);
  expect(primo, traccia).not.toBeNull();
  const da = sipario && r.intro !== null ? Math.max(r.armato!, r.intro) : r.armato!;
  expect(primo! - da, `primo carattere pieno a ${primo} ms, armato a ${r.armato} ms, handoff a ${r.intro} ms`).toBeLessThanOrEqual(
    budget(TETTO_PIENO_MS),
  );
}

for (const rotta of ROTTE_H1) {
  test(`5 · nessun lampo su ${rotta}, senza sipario`, { tag: "@lampo" }, async ({ page, goto }) => {
    await registraLampi(page);
    await goto(rotta);
    await page.waitForTimeout(4_500);
    await controllaLampi(page, rotta, false);
  });

  test(`5 · nessun lampo su ${rotta}, col sipario`, { tag: "@lampo" }, async ({ page }) => {
    await registraLampi(page);
    await page.goto(rotta, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8_000);
    await controllaLampi(page, rotta, true);
  });

  for (const lingua of ["de", "fr"] as const) {
    test(`5 · nessun lampo su ${rotta}, dt_locale=${lingua} al primo caricamento`, { tag: "@lampo" }, async ({ page, goto }) => {
      await page.context().addCookies([{ name: "dt_locale", value: lingua, domain: "127.0.0.1", path: "/" }]);
      await registraLampi(page);
      await goto(rotta);
      await expect(page.locator("html")).toHaveAttribute("lang", lingua);
      await page.waitForTimeout(4_500);
      await controllaLampi(page, rotta, false);
    });
  }
}

// Il declassamento guarda il membro (spec §2.2: «vale per la riga CTA di PageHero.tsx:131-142»):
// in una testa-gruppo con le CTA l'occhiello resta `ctn` e all'armamento sta a --dt-ctn-y (48 px a
// 1440), la riga CTA è `still` e ferma. Lo stato si legge nel microtask dopo l'armamento.
test("5b · teste di /vendi e /valutazione: occhiello ctn con la corsa, riga CTA still e ferma", { tag: "@lampo" }, async ({ page, goto }, info) => {
  test.skip(info.project.name !== "desktop-1440", "la corsa --dt-ctn-y vale 48 px a 1440");
  type Voce = { ruolo: string | null; m42: number };
  await page.addInitScript(() => {
    const w = window as unknown as { __dtTesta: Record<string, { ruolo: string | null; m42: number }> };
    w.__dtTesta = {};
    const leggi = (k: string, el: Element | null | undefined) => {
      if (!el || w.__dtTesta[k]) return;
      const tr = getComputedStyle(el).transform;
      w.__dtTesta[k] = { ruolo: el.getAttribute("data-reveal"), m42: new DOMMatrixReadOnly(tr === "none" ? undefined : tr).m42 };
    };
    new MutationObserver(() => {
      const testa = document.querySelector("#main section");
      leggi("occhiello", testa?.querySelector("[data-reveal][data-reveal-armed]:has(> .eyebrow)"));
      leggi("cta", testa?.querySelector("[data-reveal][data-reveal-armed]:has(a[href])"));
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-reveal-armed"] });
  });
  for (const rotta of ["/vendi", "/valutazione-immobile-tradate"]) {
    await goto(rotta);
    await expect
      .poll(() => page.evaluate(() => Object.keys((window as unknown as { __dtTesta: object }).__dtTesta).length), { timeout: 8_000 })
      .toBe(2);
    const t = await page.evaluate(() => (window as unknown as { __dtTesta: Record<string, { ruolo: string | null; m42: number }> }).__dtTesta);
    const occhiello: Voce = t.occhiello;
    const cta: Voce = t.cta;
    const corsa = await page.evaluate(
      () => (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dt-ctn-y")) * window.innerWidth) / 100,
    );
    expect(occhiello.ruolo, `${rotta}: occhiello`).toBe("ctn");
    expect(Math.abs(occhiello.m42 - corsa), `${rotta}: corsa dell'occhiello ${occhiello.m42} px contro ${corsa} px`).toBeLessThanOrEqual(1);
    expect(cta.ruolo, `${rotta}: riga CTA`).toBe("still");
    expect(cta.m42, `${rotta}: riga CTA spostata`).toBe(0);
  }
});

test.describe("6 · LCP contro la base di spec §2.5", () => {
  test.describe.configure({ mode: "serial" });
  for (const rotta of ROTTE_H1) {
    test(`6 · LCP di ${rotta} entro la base + 100 ms, senza consenso`, { tag: "@lcp" }, async ({ browser, baseURL }, info) => {
      const rif = readLcpBase().projects[info.project.name]?.[rotta]?.lcpMs ?? 0;
      expect(rif, `manca ${info.project.name} ${rotta} in e2e/baseline/lcp-base.json`).toBeGreaterThan(0);
      // Le condizioni della base (scripts/probe-lcp-base.mjs, block-01-02.md:2036-2083): descrittore
      // del progetto, contesto nuovo senza consenso, motion ok, sipario saltato, terze parti
      // bloccate, ultima voce LCP 4 s dopo load, mediana di tre giri.
      const descrittore: BrowserContextOptions & { defaultBrowserType?: string } =
        info.project.name === "mobile-390"
          ? { ...devices["iPhone 13"] }
          : { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } };
      delete descrittore.defaultBrowserType;
      const giri: number[] = [];
      for (let i = 0; i < 3; i += 1) {
        const ctx = await browser.newContext({ ...descrittore, reducedMotion: "no-preference" });
        await routeExternal(ctx);
        await ctx.addInitScript((k) => {
          try {
            sessionStorage.setItem(k, "1");
          } catch {
            /* storage negato */
          }
          const w = window as unknown as { __lcp: number[] };
          w.__lcp = [];
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) w.__lcp.push(Math.round(e.startTime));
          }).observe({ type: "largest-contentful-paint", buffered: true });
        }, INTRO_KEY);
        const p = await ctx.newPage();
        await p.goto(`${baseURL}${rotta}`, { waitUntil: "load", timeout: 60_000 });
        await p.waitForTimeout(4_000);
        giri.push(await p.evaluate(() => (window as unknown as { __lcp: number[] }).__lcp.at(-1) ?? 0));
        await ctx.close();
      }
      giri.sort((a, b) => a - b);
      expect(giri[1], `LCP ${rotta} su ${info.project.name}: giri ${giri.join(", ")} ms, base ${rif} ms`).toBeLessThanOrEqual(rif + 100);
    });
  }
});

test("7b · cambio lingua su /metodo: le righe del lead si rifanno senza il testo di prima", { tag: "@lead" }, async ({ page, goto }) => {
  const DE = "Jeder Verkauf und jeder Kauf folgt einem klaren Weg aus Sorgfalt, Unterlagen, Marketing und Begleitung bis zum Notartermin. So arbeiten wir seit 2007.";
  const senzaSpazi = (s: string) => s.replace(/\s+/g, "");
  await page.context().addCookies([{ name: "dt_locale", value: "de", domain: "127.0.0.1", path: "/" }]);
  await goto("/metodo");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  const lead = page.locator('#main [data-reveal="lead"]').first();
  await expect(lead).toHaveAttribute("data-lead", "split", { timeout: 8_000 });
  const righe = await lead.locator(".dt-line").allTextContents();
  expect(righe.length).toBeGreaterThan(0);
  expect(senzaSpazi(righe.join(""))).toBe(senzaSpazi(DE));
  expect(senzaSpazi((await lead.textContent()) ?? "")).toBe(senzaSpazi(DE));
});

// Il gesto `lead` (spec §2.2, riga lead: yPercent 110 → 0 in 1,2 s, stagger 0,1; uscita −110 in
// 0,4 s, stagger 0,05; A20 di Alberto): le righe del lead di Posizionamento, il primo Lead della
// home, nascono a yPercent 110, arrivano a 0 entro 0,3 + 0,1·(righe − 1) + 1,2 s più 250 ms e, col
// bordo alto al 92 %, escono sopra la maschera entro 1,3 s.
test("7c · lead: le righe salgono dalla maschera ed escono verso l'alto", { tag: "@lead" }, async ({ page, goto }) => {
  await goto("/");
  await waitArmed(page);
  const sel = '#main [data-reveal="lead"]';
  const t = await topDi(page, sel);
  await wheelTo(page, Math.max(0, t.top - t.vh * 1.5));
  await expect(page.locator(sel).first()).toHaveAttribute("data-lead", "split", { timeout: 8_000 });
  const righe = () =>
    page.evaluate(
      (s) =>
        Array.from(document.querySelector(s)!.querySelectorAll<HTMLElement>(".dt-line"), (r) => {
          const tr = getComputedStyle(r).transform;
          return { m42: new DOMMatrixReadOnly(tr === "none" ? undefined : tr).m42, h: r.offsetHeight };
        }),
      sel,
    );
  const armate = await righe();
  expect(armate.length, "nessuna riga nel lead").toBeGreaterThan(0);
  for (const r of armate) expect(Math.abs(r.m42 - 1.1 * r.h), `riga armata a ${r.m42} px, attesi ${1.1 * r.h}`).toBeLessThanOrEqual(2);
  const tetto = Math.round((0.3 + Math.min(0.1, 1.2 / Math.max(1, armate.length - 1)) * (armate.length - 1) + 1.2) * 1000) + 250;
  const ms = await page.evaluate(
    async ([s, limite]) => {
      const el = document.querySelector(s)!;
      const linee = Array.from(el.querySelectorAll<HTMLElement>(".dt-line"));
      const y = (l: HTMLElement) => {
        const tr = getComputedStyle(l).transform;
        return new DOMMatrixReadOnly(tr === "none" ? undefined : tr).m42;
      };
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5, behavior: "instant" });
      const t0 = performance.now();
      while (performance.now() - t0 < limite + 1500) {
        await new Promise((r) => requestAnimationFrame(r));
        if (linee.every((l) => Math.abs(y(l)) < 0.5)) return Math.round(performance.now() - t0);
      }
      return -1;
    },
    [sel, tetto] as const,
  );
  expect(ms, `ingresso delle righe mai completo (tetto ${tetto} ms)`).toBeGreaterThanOrEqual(0);
  expect(ms, `ingresso delle righe ${ms} ms, tetto ${tetto} ms`).toBeLessThanOrEqual(budget(tetto));
  await wheelTo(page, t.top - t.vh * 0.92);
  await expect
    .poll(async () => (await righe()).every((r) => r.m42 <= -r.h), { timeout: budget(1_300), intervals: [50] })
    .toBe(true);
});

// D51 (giro di correzione 1 della verifica del commit 6): le righe di SplitText sono le righe del
// testo intero anche con le parole col trattino («multi-proposta» su /metodo it, «Open-Domus-Event»
// e «Mehrkanal-Kampagnen» su /vendi de, «pre-qualification» su /open-domus en): Lead taglia le parole
// dopo il trattino come SplitChars (spec §2.3). Prima, la parola intera finiva nella riga in cui
// comincia, la .dt-line a blocco (D47) era alta due righe e il paragrafo cresceva di una riga.
// Per ogni lead spezzato della pagina: tante .dt-line quante le righe del testo intero, nessuna
// più alta di una riga, paragrafo alto quanto il testo intero. Il testo intero si misura su una
// copia del paragrafo nello stesso genitore (stessi stili ereditati), fuori flusso e larga quanto
// il paragrafo, poi tolta.
const LEAD_TRATTINI = [
  ["/metodo", "it"],
  ["/vendi", "de"],
  ["/open-domus", "en"],
  ["/domande-frequenti", "fr"],
] as const;
for (const [rotta, lingua] of LEAD_TRATTINI) {
  test(`7d · righe naturali dei lead su ${rotta} in ${lingua}, parole col trattino comprese`, { tag: "@lead" }, async ({ page, goto }) => {
    if (lingua !== "it") await page.context().addCookies([{ name: "dt_locale", value: lingua, domain: "127.0.0.1", path: "/" }]);
    await goto(rotta);
    await expect(page.locator("html")).toHaveAttribute("lang", lingua);
    await waitArmed(page);
    await expect.poll(() => page.locator('#main [data-reveal="lead"][data-lead="pending"]').count(), { timeout: 10_000 }).toBe(0);
    expect(await page.locator('#main [data-reveal="lead"][data-lead="split"]').count(), "nessun lead spezzato").toBeGreaterThan(0);
    const fuori = await page.evaluate(() => {
      type Esito = { testo: string; righe: number; naturali: number; h: number; hIntero: number; rigaMax: number; riga: number };
      const out: Esito[] = [];
      for (const p of Array.from(document.querySelectorAll<HTMLElement>('#main [data-reveal="lead"][data-lead="split"]'))) {
        const box = p.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        const riga = Number.parseFloat(getComputedStyle(p).lineHeight);
        const righe = Array.from(p.querySelectorAll<HTMLElement>(".dt-line"));
        const copia = document.createElement("p");
        copia.className = p.className;
        copia.textContent = p.textContent ?? "";
        copia.style.cssText = `position:absolute;left:0;top:0;width:${box.width}px;max-width:none;margin:0;visibility:hidden;pointer-events:none`;
        p.parentElement!.insertBefore(copia, p);
        const hIntero = copia.getBoundingClientRect().height;
        const rg = document.createRange();
        rg.selectNodeContents(copia);
        const naturali = new Set(Array.from(rg.getClientRects()).filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
        copia.remove();
        const rigaMax = Math.max(0, ...righe.map((r) => r.getBoundingClientRect().height));
        const male = righe.length !== naturali || Math.abs(box.height - hIntero) > 0.5 || (Number.isFinite(riga) && rigaMax > riga + 0.5);
        if (male) out.push({ testo: (p.textContent ?? "").slice(0, 40), righe: righe.length, naturali, h: +box.height.toFixed(1), hIntero: +hIntero.toFixed(1), rigaMax: +rigaMax.toFixed(1), riga: +riga.toFixed(1) });
      }
      return out;
    });
    expect(fuori, JSON.stringify(fuori)).toEqual([]);
  });
}
