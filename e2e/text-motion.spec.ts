import { test, expect, setConsent } from "./helpers";
import { budget, entryTimes, inkOf, refreshTriggers, timeToHidden, watchMinInk, wheelToTop } from "./coreografia";

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
    const watch = await entryTimes(page, stop, { timeoutMs: 6000 });
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
  expect(ms(v.tdFast)).toBe(250);
  expect(bezier(v.tdSmooth)).toBe("cubic-bezier(.22,1,.36,1)");
});
