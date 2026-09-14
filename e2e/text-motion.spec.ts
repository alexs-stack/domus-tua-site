import { test, expect, setConsent } from "./helpers";
import { budget, entryTimes, inkOf, timeToHidden, watchMinInk, wheelToTop } from "./coreografia";

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
