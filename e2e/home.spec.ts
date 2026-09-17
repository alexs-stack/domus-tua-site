import type { Locator, Page } from "@playwright/test";
import { test, expect, setConsent, clickUntil, videoTile } from "./helpers";
import { clipOf, insetValues, installProbe, matrixOf, productOpacity } from "./coreografia";

// Homepage: che carichi, che l'intro non intrappoli nessuno, che l'header funzioni alla
// larghezza in cui ci si trova.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

test("la homepage carica con il suo contenuto principale @layout", async ({ page, goto, guards }) => {
  await goto("/");

  await expect(page).toHaveTitle(/Domus Tua/i);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#main")).toBeVisible();
  await expect(page.locator("footer")).toBeAttached();
  // Le sezioni portanti ci sono, qualunque sia la larghezza (la vetrina immobili
  // non vive più in home: il catalogo è su /acquista).
  await expect(page.locator("#cerca")).toBeAttached();
  await expect(page.locator("#contatti")).toBeAttached();

  expect(guards.consoleErrors, guards.consoleErrors.join("\n")).toEqual([]);
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("il preloader finisce da solo e si può saltare", async ({ page, guards }) => {
  // Qui l'intro NON viene saltata: è il soggetto del test.
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Con reduced motion l'intro non parte affatto: in quel caso il test verifica solo che la
  // pagina sia subito utilizzabile, che è esattamente ciò che deve succedere.
  const h1 = page.getByRole("heading", { level: 1 });
  await page.keyboard.press("Enter"); // skip: l'intro ascolta tasto e puntatore
  await expect(h1).toBeVisible({ timeout: 12_000 });
  // Dopo l'intro la pagina scorre: nessun overlay rimasto ad assorbire i click.
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  expect(guards.consoleErrors, guards.consoleErrors.join("\n")).toEqual([]);
});

test("l'intro non si ripresenta nella stessa sessione", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 12_000 });

  // Seconda visita nella stessa sessione: l'hero deve essere lì subito, senza rivedere l'intro.
  const started = Date.now();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 4_000 });
  expect(Date.now() - started).toBeLessThan(8_000);
});

test("l'header porta alle sezioni del sito @layout", async ({ page, goto, isMobile }, testInfo) => {
  await goto("/");
  const width = page.viewportSize()?.width ?? 0;
  const compact = isMobile || width < 1024;

  if (compact) {
    // Sotto il desktop la navigazione sta dietro un bottone.
    const menu = page.getByRole("button", { name: /menu/i });
    await expect(menu).toBeVisible();
    // Il pannello mobile, non il piè di pagina: le stesse voci esistono in entrambi.
    const panel = page.locator("#mobile-menu");
    await clickUntil(
      () => menu.click(),
      () => expect(panel.getByRole("link", { name: "Vendi", exact: true })).toBeVisible(),
    );
    await expect(panel.getByRole("link", { name: "Acquista", exact: true })).toBeVisible();
    // Servizi è raggiungibile dalla navigazione anche sul telefono.
    await expect(panel.getByRole("link", { name: "Servizi", exact: true })).toBeVisible();
    // Escape richiude e restituisce il focus al bottone.
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
  } else {
    // Da desktop la testata è UNA riga con le SEI voci primarie: nove parole
    // maiuscole in fila erano un nastro che attraversava lo schermo — il «menu
    // sopra» che il cliente ha bocciato l'11 settembre — e il riferimento ne
    // tiene quattro. Le tre che avanzano (Servizi, Recensioni, Lavora con noi)
    // restano raggiungibili dal piè di pagina e dal menu del telefono; la
    // sorgente unica è `nav` in app/lib/site.ts, col flag `primary`.
    const nav = page.locator("header").first();
    for (const label of [
      "Vendi",
      "Acquista",
      "Metodo Domus",
      "Open Domus",
      "Chi siamo",
      "Contatti",
    ]) {
      await expect(nav.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
    }
    // E le secondarie NON stanno nella testata: se ci tornano, la riga si
    // riallunga e il difetto rientra senza che nessuno se ne accorga.
    for (const label of ["Servizi", "Recensioni", "Lavora con noi"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveCount(0);
    }
    // Restano raggiungibili: stanno nel piè di pagina, su ogni pagina.
    const footer = page.locator("footer").first();
    for (const label of ["Servizi", "Recensioni", "Lavora con noi"]) {
      await expect(footer.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
    }
  }

  testInfo.annotations.push({ type: "viewport", description: `${width}px, compatto: ${compact}` });
});

test("dalla home si arriva alla ricerca immobili", async ({ page, goto }) => {
  await goto("/");
  const width = page.viewportSize()?.width ?? 0;

  if (width < 1024) {
    // Sotto il desktop la voce sta dentro il pannello: prima lo si apre.
    const menu = page.getByRole("button", { name: /menu/i });
    const panel = page.locator("#mobile-menu");
    await clickUntil(
      () => menu.click(),
      () => expect(panel.getByRole("link", { name: "Acquista", exact: true })).toBeVisible(),
    );
    await panel.getByRole("link", { name: "Acquista", exact: true }).click();
  } else {
    await page.locator("header").first().getByRole("link", { name: "Acquista", exact: true }).first().click();
  }

  await expect(page).toHaveURL(/\/acquista/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("il set piece orizzontale cuce i pannelli allo scroll", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "lo scroller orizzontale vive solo da desktop");
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width < 1024, "sotto i 1024 i pannelli restano in colonna");
  await goto("/");

  // Attivo solo via JS (desktop + motion ok): l'attributo è la prova del pin.
  const horizon = page.locator(".dt-horizon");
  await expect(horizon).toHaveAttribute("data-on", "");

  // Si scrolla come un utente (wheel → Lenis) fin dentro la sezione pinnata:
  // il track deve tradursi in orizzontale mentre la pagina scende.
  await horizon.scrollIntoViewIfNeeded();
  const readX = () =>
    page
      .locator(".dt-horizon_track")
      .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  let x = 0;
  for (let i = 0; i < 80 && x > -50; i++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(60);
    x = await readX();
  }
  expect(x, "il track non si è mosso in orizzontale").toBeLessThan(-50);

  // E il documento non guadagna mai uno scroll orizzontale suo.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("le cinque stelle si accendono quando la fila è in scena", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "sul telefono il film suona a tempo dentro un box: qui si prova il palcoscenico del desktop");
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width < 1024, "sotto i 1024 non c'è lo schermo sticky");
  await goto("/");
  const stars = page.locator(".dt-starrev");
  // Il palcoscenico lo dichiara JS con motion ok.
  await expect(stars).toHaveAttribute("data-on", "");
  // `scrollIntoViewIfNeeded` porta al CENTRO della corsa (360svh): si è già
  // dentro la sezione. Pochi colpi di rotella, non tanti: oltre il fondo della
  // corsa il riflesso si spegne di proposito ([data-lit] cade a «bottom top»).
  await stars.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(80);
  }
  // In scena il riflesso è acceso ([data-lit]) e la fila conta cinque stelle d'oro.
  await expect(stars).toHaveAttribute("data-lit", "");
  await expect(page.locator(".dt-starrev_star")).toHaveCount(5);
});

// ── Capitoli 4 e 5 (commit 10b del piano 2026-09-13): attrezzi comuni ──────
// Scroll istantaneo con due fotogrammi d'attesa; opacità e matrice di tutte le
// lettere [data-c] di un titolo, non solo della prima o dell'ultima.
const scrollNastro = (page: Page, y: number) =>
  page.evaluate(async (top) => {
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
const opacitaLettere = (lettere: Locator) =>
  lettere.evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
const minLettere = async (lettere: Locator) => Math.min(...(await opacitaLettere(lettere)));
const maxLettere = async (lettere: Locator) => Math.max(...(await opacitaLettere(lettere)));
const lettereIdentita = (lettere: Locator) =>
  lettere.evaluateAll((els) =>
    els.every((e) => {
      const t = getComputedStyle(e).transform;
      const m = new DOMMatrixReadOnly(t === "none" ? undefined : t);
      return (
        Math.abs(m.a - 1) < 1e-3 &&
        Math.abs(m.b) < 1e-3 &&
        Math.abs(m.c) < 1e-3 &&
        Math.abs(m.d - 1) < 1e-3 &&
        Math.abs(m.m41) < 0.5 &&
        Math.abs(m.m42) < 0.5
      );
    }),
  );

// ── Capitolo 4: il manifesto del nastro (spec §2.4, §3.5) ────────────────
// Con MQ.corridor (D22) il gruppo di <HorizonEnter> è manuale (data-reveal-mode
// "manual"): l'IO non decide, lo fanno entrare il cue «top 70%» della radice e
// uscire la risalita sotto quel punto. Il campione sotto il cue si prende entro
// 1.200 ms dal salto, dentro la finestra della rete dei manuali (2.500 ms, spec
// §2.4). Sotto la soglia il gruppo è a IO ed esce quando il suo bordo alto (py-20
// compreso) scende sotto la linea dell'85 %.
// Tetti (D19): ingresso 0,3 + stagger al più 1,2 + 1,2 = 2,7 s; uscita 0,4 s più
// stagger al più 0,4 s.
test("il manifesto del nastro entra al cue «top 70%» e riesce risalendo", async ({ page, goto }) => {
  const vp = page.viewportSize()!;
  const corridoio = vp.width >= 1024 && vp.height >= 640;
  await goto("/");
  const storia = page.locator("#storia");
  const gruppo = storia.locator("[data-reveal-group]").filter({ has: page.locator("h3") }).first();
  const lettere = gruppo.locator("h3 [data-c]");
  await expect(lettere.first()).toBeAttached();

  if (corridoio) {
    await expect(storia).toHaveAttribute("data-corridor", "storia");
    await expect(storia).toHaveAttribute("data-on", "");
    await expect(gruppo).toHaveAttribute("data-reveal-mode", "manual");
    const top = await storia.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    // Radice a 0,80 dell'altezza: il cue «top 70%» non è passato.
    await scrollNastro(page, top - 0.8 * vp.height);
    await page.waitForTimeout(1_200);
    expect(await maxLettere(lettere)).toBeLessThan(0.1);
    // Radice a 0,60: il cue è passato, entrano tutte le lettere.
    await scrollNastro(page, top - 0.6 * vp.height);
    await expect.poll(() => minLettere(lettere), { timeout: 3_500 }).toBeGreaterThanOrEqual(0.99);
    expect(await lettereIdentita(lettere)).toBe(true);
    // Di nuovo a 0,80: il cue ripassa all'indietro e il gruppo esce.
    await scrollNastro(page, top - 0.8 * vp.height);
    await expect.poll(() => maxLettere(lettere), { timeout: 1_300 }).toBeLessThan(0.1);
    return;
  }

  await expect(storia).not.toHaveAttribute("data-on", /.*/);
  await expect(gruppo).toHaveAttribute("data-reveal-mode", "io");
  const centro = await gruppo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
  });
  await scrollNastro(page, centro);
  await expect.poll(() => minLettere(lettere), { timeout: 3_500 }).toBeGreaterThanOrEqual(0.99);
  expect(await lettereIdentita(lettere)).toBe(true);
  // Bordo alto del GRUPPO a 0,95 dell'altezza: sotto la linea dell'85 %, uscita di decide().
  const sotto = await gruppo.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY - 0.95 * window.innerHeight,
  );
  await scrollNastro(page, sotto);
  await expect.poll(() => maxLettere(lettere), { timeout: 1_300 }).toBeLessThan(0.1);
});

// ── Capitolo 4: il blocco del territorio dentro il nastro (spec §2.4) ──────
// Gruppo a IO sotto `.dt-horizon[data-on] .dt-horizon_track` (RIBBON del
// motore): entra quando interseca lo schermo ed esce quando, risalendo, il suo
// bordo sinistro torna oltre l'85 % della larghezza (rootMargin "0px -15% 0px 0px").
test("il blocco del territorio entra nel nastro ed esce a destra risalendo", async ({ page, goto }) => {
  const vp = page.viewportSize()!;
  test.skip(vp.width < 1024 || vp.height < 640, "il nastro vive solo con MQ.corridor (D22)");
  await goto("/");
  const storia = page.locator("#storia");
  await expect(storia).toHaveAttribute("data-on", "");
  const gruppo = storia.locator("[data-reveal-group]").filter({ has: page.locator("h4") }).first();
  const lettere = gruppo.locator("h4 [data-c]");
  await expect(lettere.first()).toBeAttached();
  await expect(gruppo).toHaveAttribute("data-reveal-mode", "io");
  const sinistra = () => gruppo.evaluate((el) => el.getBoundingClientRect().left / window.innerWidth);

  // Fine della corsa: l'ultimo fotogramma del nastro inquadra il territorio.
  let y = await storia.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY + (el as HTMLElement).offsetHeight - window.innerHeight,
  );
  await scrollNastro(page, y);
  await expect.poll(() => minLettere(lettere), { timeout: 3_500 }).toBeGreaterThanOrEqual(0.99);
  expect(await sinistra()).toBeLessThan(0.85);

  // Risalita a passi da 150 px; scrub 0,25 del track, 400 ms per passo.
  for (let i = 0; i < 30 && (await sinistra()) < 0.88; i++) {
    y -= 150;
    await scrollNastro(page, y);
    await page.waitForTimeout(400);
  }
  expect(await sinistra(), "il gruppo non è tornato a destra della linea d'uscita").toBeGreaterThanOrEqual(0.88);
  await expect.poll(() => maxLettere(lettere), { timeout: 1_300 }).toBeLessThan(0.1);
});

// ── Capitolo 5: il titolo delle cinque stelle al beat 0,94 (spec §2.4, §3.6) ──
// Progresso p del film: runway «top 55%» → «bottom bottom»; il cue 0,94 su 1,3
// unità cade a p 0,723. Lo scrub 0,6 insegue lo scroll per circa un secondo.
// Tetti del gruppo (D19): ingresso 2,7 s, uscita 0,8 s.
// La rete dei manuali (spec §2.4: hidden e intersecante per 2.500 ms → in) è
// voluta, e qui la si fa scattare: fermi a p 0,66 le lettere si accendono sotto
// il wrapper [data-sr-el] ancora a 0 (prodotto delle opacità < 0,1); alla prima
// battuta del film, a p 0,64 e sempre sotto il cue, onFilm le riporta nascoste.
// Il wrapper arriva a 1 da t 1,075 (p 0,83): il prodotto si pretende a fine runway.
test("il titolo delle cinque stelle arriva col beat 0,94 e riesce sotto", async ({ page, goto }) => {
  const vp = page.viewportSize()!;
  const corridoio = vp.width >= 1024 && vp.height >= 640;
  await installProbe(page);
  await goto("/");
  const lettere = page.locator("#recensioni h2 [data-c]");
  const runway = page.locator("#recensioni .dt-starrev_runway");
  const intro = page.locator("#recensioni .dt-starrev_intro");
  const gruppo = page.locator("#recensioni [data-reveal-group]").filter({ has: page.locator("h2") }).first();
  await expect(lettere.first()).toBeAttached();

  if (!corridoio) {
    // Sotto la soglia nessun [data-set-on]: il gruppo manuale passa all'IO.
    await expect(runway).not.toHaveAttribute("data-set-on", /.*/);
    await expect(gruppo).toHaveAttribute("data-reveal-mode", "io");
    const centro = await gruppo.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
    });
    await scrollNastro(page, centro);
    await expect.poll(() => minLettere(lettere), { timeout: 3_500 }).toBeGreaterThanOrEqual(0.99);
    await expect(intro).not.toHaveAttribute("data-bg", /.*/);
    return;
  }

  await expect(runway).toHaveAttribute("data-set-on", "");
  await expect(gruppo).toHaveAttribute("data-reveal-mode", "manual");
  const vaiA = async (p: number) => {
    const y = await runway.evaluate((el, prog) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const start = top - 0.55 * window.innerHeight;
      const end = top + (el as HTMLElement).offsetHeight - window.innerHeight;
      return start + prog * (end - start);
    }, p);
    await scrollNastro(page, y);
  };

  // Sotto il cue, dentro la finestra della rete: lettere e prodotto spenti.
  await vaiA(0.66);
  await page.waitForTimeout(1_200);
  expect(await maxLettere(lettere)).toBeLessThan(0.1);
  expect(await productOpacity(lettere.first())).toBeLessThan(0.1);

  // Fermi: la rete dei 2.500 ms accende le lettere, il wrapper a 0 le tiene invisibili.
  await expect.poll(() => minLettere(lettere), { timeout: 6_000 }).toBeGreaterThanOrEqual(0.99);
  expect(await productOpacity(lettere.first())).toBeLessThan(0.1);

  // Prima battuta del film, ancora sotto il cue: onFilm riporta il gruppo nascosto.
  await vaiA(0.64);
  await expect.poll(() => maxLettere(lettere), { timeout: 1_300 }).toBeLessThan(0.1);

  // Oltre il cue: tutte le lettere a 1.
  await vaiA(0.78);
  await expect.poll(() => minLettere(lettere), { timeout: 4_500 }).toBeGreaterThanOrEqual(0.99);

  // Di nuovo sotto: escono.
  await vaiA(0.66);
  await expect.poll(() => maxLettere(lettere), { timeout: 2_500 }).toBeLessThan(0.1);

  // La copertina per il monogramma (contratto di §6.1).
  await vaiA(0.04);
  await expect(intro).not.toHaveAttribute("data-bg", /.*/, { timeout: 2_000 });
  await vaiA(0.46);
  await expect(intro).toHaveAttribute("data-bg", "foto", { timeout: 2_000 });

  // Fine runway (spec §3.6): lettere a 1 e identità, wrapper acceso, copertina spenta.
  await vaiA(1);
  await expect.poll(() => minLettere(lettere), { timeout: 4_500 }).toBeGreaterThanOrEqual(0.99);
  expect(await lettereIdentita(lettere)).toBe(true);
  await expect.poll(() => productOpacity(lettere.first()), { timeout: 2_000 }).toBeGreaterThanOrEqual(0.99);
  await expect(intro).not.toHaveAttribute("data-bg", /.*/);
});

// ── Capitolo 7: Percorsi in controfase (spec §3.8) ────────────────────────
// Quota di scroll al progresso p del range «top 125%» → «bottom -25%» della
// riga. dtSosta: f(0,1) = 0,176, f(0,5) = 0,500, f(0,9) = 0,824, quindi da
// 1024 px yPercent vale −6,5 %, 0 %, +6,5 % sulla colonna di sinistra: a 1440
// la colonna della foto (605 px) passa da −39 a +39 px, e al centro sosta.
// Sotto 768 la corsa è in px, A = floor(gap/2) − 1 = 10 a 390.
// LETTURA DEL TEST DI SPEC §3.8 («m42 delle due colonne cambia di ≥ 40 px fra
// riga al 90 % e al 10 %»): la riga al 90 % e al 10 % del SUO range, «top
// 125%» → «bottom -25%», cioè p 0,9 e p 0,1 (Δ atteso 78 px a 1440). L'altra
// lettura, col bordo alto della riga al 90 % e al 10 % del viewport, a 1440x900
// e con la riga alta 607 px cade a p 0,161 e 0,529: gsap.parseEase("dtSosta")
// vi vale 0,2765 e 0,5005, Δ = 20 % × 0,224 × 605 px = 27,1 px, e coi valori
// della stessa spec non arriva a 40. misure/11-paths-method.mjs registra tutte
// e due le letture in risultati.md; la frase di §3.8 si precisa al commit 22
// (spec §10).
test("Percorsi: le colonne vanno in controfase e sostano al centro", async ({ page, goto }) => {
  const w = page.viewportSize()?.width ?? 0;
  await goto("/");
  const riga = (id: "vendi" | "acquista") => page.locator(`[data-paths-row]#${id}`);
  const al = async (id: "vendi" | "acquista", p: number) => {
    const y = await riga(id).evaluate((el, p) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const vh = window.innerHeight;
      const start = top - 1.25 * vh;
      const end = top + (el as HTMLElement).offsetHeight + 0.25 * vh;
      return start + p * (end - start);
    }, p);
    await page.evaluate((y) => window.scrollTo({ top: Math.max(0, y), behavior: "instant" }), y);
    await page.waitForTimeout(1_200); // scrub 0,5 e Lenis
    const cols = riga(id).locator("[data-paths-col]");
    return [(await matrixOf(cols.nth(0))).m42, (await matrixOf(cols.nth(1))).m42];
  };

  if (w >= 1024) {
    const [a1, b1] = await al("vendi", 0.1);
    const [a5, b5] = await al("vendi", 0.5);
    const [a9, b9] = await al("vendi", 0.9);
    // #vendi: la foto (prima nel DOM) sta a sinistra e scende.
    expect(a1).toBeLessThan(0);
    expect(b1).toBeGreaterThan(0);
    expect(a9).toBeGreaterThan(0);
    expect(b9).toBeLessThan(0);
    expect(a9 - a1).toBeGreaterThanOrEqual(40);
    expect(b1 - b9).toBeGreaterThanOrEqual(40);
    expect(Math.abs(a5)).toBeLessThanOrEqual(2);
    expect(Math.abs(b5)).toBeLessThanOrEqual(2);
    // #acquista: la foto ha lg:order-2 ed è a destra, quindi sale.
    const [fotoA, testoA] = await al("acquista", 0.1);
    expect(fotoA).toBeGreaterThan(0);
    expect(testoA).toBeLessThan(0);
  } else {
    for (const p of [0.1, 0.5, 0.9]) {
      const [a, b] = await al("vendi", p);
      expect(Math.abs(a), `foto a p ${p}`).toBeLessThanOrEqual(11);
      expect(Math.abs(b), `testo a p ${p}`).toBeLessThanOrEqual(11);
    }
    const [a, b] = await al("vendi", 0.1);
    expect(a).toBeLessThan(0);
    expect(b).toBeGreaterThan(0);
  }
});

// ── Capitolo 8: la tendina del Metodo, in home e su /metodo (spec §3.9) ────
// Ingresso: ritardo 0,8 s e 2,4 s power4.out dal callback dell'IO, quindi a
// 0,4 s dallo scroll è ancora chiusa. Uscita: scatola sotto il 90 %, 0,4 s
// power4.in, la tendina prosegue nel suo verso.
// I tempi si contano dal primo campione che lascia lo stato di partenza, non
// dallo scroll (D58): il callback dell'IO sotto carico (quattro worker, DPR 3,
// salto dall'alto della home) arriva anche 0,6-0,7 s dopo lo scroll, e una
// scadenza fissa dallo scroll scade su codice giusto. La latenza ha il suo
// bilancio (1,5 s), poi la cifra della spec ha 0,4 s di tolleranza (durDt.s);
// campioni ogni 100 ms (50 ms per l'avvio): la cadenza di default di
// expect.poll, 100/250/500/1000 ms senza ultimo tentativo se la scadenza cade
// dentro l'intervallo, lascia buchi di un secondo. La frase «dopo 3,4 s» di
// §3.9 si precisa al commit 22 (spec §10).
for (const rotta of ["/", "/metodo"] as const) {
  test(`Metodo su ${rotta}: la tendina si apre a verso alternato e si richiude risalendo`, async ({ page, goto }) => {
    await goto(rotta);
    const scatole = page.locator('#metodo [data-clip="method"]');
    await expect(scatole).toHaveCount(3);
    await expect(scatole.nth(0)).toHaveAttribute("data-from", "left");
    await expect(scatole.nth(1)).toHaveAttribute("data-from", "right");
    await expect(scatole.nth(2)).toHaveAttribute("data-from", "left");
    type Inset = [number, number, number, number];
    const clip = async (i: number) => insetValues(await clipOf(scatole.nth(i)));
    const centra = (i: number) =>
      scatole.nth(i).evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2, behavior: "instant" });
      });
    // ClipMedia chiude sempre un lato intero (100 %): un campione con un 100 è
    // chiuso (o è l'arrivo dell'uscita), [0,0,0,0] è aperto.
    const chiusa = (v: Inset | null) => v !== null && (v[1] === 100 || v[3] === 100);
    const aperta = (v: Inset | null) => v !== null && v.every((n) => n === 0);
    // Apertura contata dal suo avvio: primo campione che lascia il chiuso entro
    // 1,5 s (ritardo 0,8 s più la latenza scroll → IO), poi [0,0,0,0] entro
    // 2,4 + 0,4 s da quel campione.
    const siApre = async (i: number) => {
      await expect
        .poll(async () => chiusa(await clip(i)), {
          timeout: 1_500,
          intervals: [50],
          message: `scatola ${i}: la tendina non parte`,
        })
        .toBe(false);
      await expect
        .poll(() => clip(i), { timeout: 2_800, intervals: [100], message: `scatola ${i}: la tendina non si apre in 2,4 + 0,4 s` })
        .toEqual([0, 0, 0, 0]);
    };
    // Uscita contata dal suo avvio: primo campione che lascia l'aperto entro
    // 1,5 s, poi il lato d'uscita chiuso entro 0,4 + 0,4 s da quel campione.
    const siChiude = async (i: number, verso: Inset) => {
      await expect
        .poll(async () => aperta(await clip(i)), {
          timeout: 1_500,
          intervals: [50],
          message: `scatola ${i}: la tendina non riparte in uscita`,
        })
        .toBe(false);
      await expect
        .poll(() => clip(i), { timeout: 800, intervals: [100], message: `scatola ${i}: la tendina non si chiude in 0,4 + 0,4 s` })
        .toEqual(verso);
    };

    // A scroll 0 le scatole sono sotto il viewport: chiuse dal loro lato.
    await expect.poll(() => clip(0)).toEqual([0, 100, 0, 0]);
    await expect.poll(() => clip(1)).toEqual([0, 0, 0, 100]);

    await centra(0);
    await page.waitForTimeout(400);
    expect(await clip(0)).toEqual([0, 100, 0, 0]);
    await siApre(0);

    // Risalita: la scatola scende sotto il 90 % e la tendina prosegue verso destra.
    await scatole.nth(0).evaluate((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - 0.95 * window.innerHeight, behavior: "instant" });
    });
    await siChiude(0, [0, 0, 0, 100]);

    // Ridiscesa: si riapre dal suo lato (C22, replay a ogni passaggio). La
    // stessa attesa di 0,4 s della prima apertura, così il bilancio per la
    // latenza scroll → IO è lo stesso; a 0,4 s non si afferma nulla perché la
    // scatola può stare ancora sul lato d'uscita o già su quello d'ingresso.
    await centra(0);
    await page.waitForTimeout(400);
    await siApre(0);

    await centra(1);
    await page.waitForTimeout(400);
    await siApre(1);
  });
}

// La rotaia del team in
// #chi-siamo (HorizontalRail con corridoio). Da 1024 in su, con motion ok, il JS
// mette [data-on] e il track trasla in orizzontale mentre la pagina scende.
test("la rotaia del team scorre in orizzontale mentre la pagina scende", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "la rotaia pilotata dallo scroll vive solo da desktop");
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width < 1024, "sotto i 1024 la rotaia è uno scorrimento nativo col dito");
  await goto("/");

  // Attivo solo via JS (desktop + motion ok): l'attributo è la prova del takeover.
  const rail = page.locator("#chi-siamo .dt-rail");
  await expect(rail).toHaveAttribute("data-on", "");

  // Ci si porta appena sopra il corridoio (la sezione sta in fondo alla home), poi
  // si scrolla come un utente (wheel → Lenis) dentro il tratto in cui il nastro è
  // parcheggiato: il track deve tradursi in orizzontale.
  const top = await page
    .locator("#chi-siamo .dt-railway")
    .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.max(0, top - 400));
  await page.waitForTimeout(300);
  const readX = () =>
    page
      .locator("#chi-siamo .dt-rail_track")
      .evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  let x = 0;
  for (let i = 0; i < 80 && x > -50; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(60);
    x = await readX();
  }
  expect(x, "il track del team non si è mosso in orizzontale").toBeLessThan(-50);

  // E il documento non guadagna mai uno scroll orizzontale suo.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("niente scorre in orizzontale @layout", async ({ page, goto }) => {
  await goto("/");
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  // Un pixel di tolleranza per gli arrotondamenti sub-pixel.
  expect(overflow).toBeLessThanOrEqual(1);
});

// §6.5 — «Le didascalie dei video (testo già esistente, oggi invisibile)».
//
// Il documento le trovava dentro gli attributi. Oggi sono TESTO VISIBILE sotto le tessere
// del carosello «Le voci» (#voci), e questo test serve a tenercele. Il presidio che
// c'era controllava i titoli come DATO (app/lib/__tests__/content-integrity.test.ts): passa
// verde anche se nessuno li rende. Qui si guarda lo schermo.
test("le didascalie dei video sono testo visibile, non attributi @layout", async ({ page, goto }) => {
  await goto("/");
  // Il carosello sta a metà home: ci si porta lì (scroll nativo: Lenis lo segue).
  await page.locator("#voci").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  // Almeno tre delle sei: il video in evidenza vive in «Come lavoriamo» e non nel carosello,
  // e pretenderle tutte renderebbe il test una guardia sul layout invece che sul testo.
  const attese = [
    "Villa di Roberta, venduta al primo Open Domus",
    "Teresa, venduta al primo Open Domus",
    "Recensione — Felicemente venduta",
    "Recensione — Serenamente venduta",
    "Recensione — Facile vendere, sicuro acquistare",
    "Il team Domus Tua si presenta",
  ];
  // Si misura la SCATOLA, non la visibilità.
  //
  // Prima versione di questo test: `isVisible()` su ogni titolo. Restava VERDE con le
  // didascalie sostituite da `sr-only` — che è esattamente la regressione da bloccare,
  // perché `sr-only` è una scatola da 1×1 ritagliata, e per Playwright è visibile.
  // Un testo leggibile occupa spazio: qui si pretendono almeno 60px di larghezza e 10 di
  // altezza. Riverificato: con le didascalie messe in sr-only, questo test è rosso.
  // Timeout corto: un titolo che NON è nel carosello (il video in evidenza) non deve
  // far aspettare il test fino al suo tetto — conta zero e si passa al prossimo.
  const misura = async (t: string) => {
    const box = await page
      .getByText(t, { exact: false })
      .first()
      .boundingBox({ timeout: 2_000 })
      .catch(() => null);
    return !!box && box.width >= 60 && box.height >= 10;
  };
  let viste = 0;
  for (const t of attese) if (await misura(t)) viste += 1;
  expect(viste, `didascalie LEGGIBILI nel carosello delle voci: ${viste}/6`).toBeGreaterThanOrEqual(3);
});

// §6.5 — il video si guarda IN PAGINA, e non costa niente a chi non lo guarda.
//
// Due garanzie in un test solo, perché sono due facce della stessa scelta: il dialog
// monta l'iframe soltanto quando lo si apre, quindi finché nessuno chiede di vedere un
// video nessuna richiesta parte verso YouTube — e chi non guarda non viene tracciato.
test("il video della home si apre in pagina, e prima non chiama YouTube", async ({
  page,
  goto,
}) => {
  const versoYouTube: string[] = [];
  page.on("request", (r) => {
    if (/youtube|ytimg|googlevideo/i.test(r.url())) versoYouTube.push(r.url());
  });
  // La tessera è un link vero verso YouTube (target _blank): un clic prima dell'idratazione
  // aprirebbe una scheda nuova, che si chiude e basta — il toPass qui sotto riprova.
  page.on("popup", (p) => void p.close().catch(() => {}));

  await goto("/");
  // Le miniature del carosello passano dal proxy immagini di Next, non da ytimg: qualunque
  // chiamata a youtube.com prima del clic sarebbe il player montato a vuoto.
  const player = versoYouTube.filter((u) => /youtube(-nocookie)?\.com/i.test(u));
  expect(player, `richieste al player prima del clic: ${player.join(", ")}`).toHaveLength(0);

  // La tessera di «Le voci»: il «Guarda il video» dell'hero non c'è più (rivista bianca).
  const cta = videoTile(page);
  const dialog = page.getByRole("dialog");

  // NIENTE attesa fissa prima del clic. Ce n'era una da 1200ms, e il verificatore ha
  // mostrato che e' una moneta lanciata: ritardando i chunk di 1600ms il dialog non si
  // apriva e il test diventava rosso senza che il sito avesse un difetto. Prima
  // dell'idratazione l'onClick non e' agganciato e il link fa quel che dice l'href.
  // Si riprova finche' il comportamento e' attaccato, che e' la condizione vera.
  await expect(async () => {
    await cta.click();
    await expect(dialog).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 25_000 });

  await expect(dialog).toHaveAttribute("aria-modal", "true");
  // Il player e' QUI dentro, non su un'altra pagina.
  await expect(dialog.locator('iframe[src*="youtube-nocookie.com"]')).toBeVisible();
  // E la pagina e' ancora la home: non si e' usciti dal sito.
  await expect(page).toHaveURL(/^https?:\/\/[^/]+\/?$/);

  // MODALE PER DAVVERO. Questa e' l'asserzione che mancava, ed e' quella che avrebbe
  // preso il difetto: il dialog nasceva dentro <main>, che e' un contesto di
  // impilamento, quindi l'header (fratello di <main>, z-50) restava dipinto sopra il
  // velo e cliccabile — si premeva una voce di menu e la pagina se ne andava da sotto
  // una superficie che si dichiara aria-modal. Qui si chiede al browser CHI riceve
  // davvero il clic al centro di un link dell'header.
  // Si guarda la STRUTTURA, non la geometria. Una sonda con elementFromPoint su un link
  // dell'header trovava il difetto a 390 e non a 1440, perche' li' il pannello centrato
  // copre per caso il punto campionato: una guardia che dipende dal viewport prende il
  // difetto solo su meta' dei progetti. L'invariante vero e' che il dialog NON stia
  // dentro <main> — se ci sta, il suo z-index e' prigioniero di quel contesto di
  // impilamento e header, banner cookie e grana gli si dipingono sopra, a qualunque
  // larghezza. Verificato: con il portal tolto questo controllo e' rosso ovunque.
  const dove = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    if (!d) return "nessun dialog";
    return d.closest("main") ? "dentro main" : "fuori da main";
  });
  expect(dove, "il dialog deve essere portato su body, non reso dentro <main>").toBe(
    "fuori da main",
  );

  // Esc chiude E il focus torna a chi ha aperto. La seconda meta' non era verificata:
  // il commento la prometteva e il test guardava solo che il dialog sparisse.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(cta).toBeFocused();
});

// Il comando per uscire deve stare DENTRO lo schermo, non solo essere grande abbastanza.
// Su un telefono in orizzontale — cioe' la posizione naturale per guardare un video — il
// bottone «chiudi» finiva 97px sopra il bordo alto, con il documento bloccato e nessuno
// scroll per raggiungerlo: zero uscite premibili col dito.
test("su uno schermo basso il comando per chiudere il video resta raggiungibile", async ({
  page,
  goto,
}) => {
  page.on("popup", (p) => void p.close().catch(() => {}));
  await page.setViewportSize({ width: 844, height: 390 });
  await goto("/");
  const cta = videoTile(page);
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    await cta.click();
    await expect(dialog).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 25_000 });

  const chiudi = dialog.getByRole("button", { name: /chiud|clos|ferm|schließ|cerrar/i }).first();
  const box = await chiudi.boundingBox();
  expect(box, "il comando chiudi non ha un rettangolo").not.toBeNull();
  expect(box!.y, "il comando chiudi esce dal bordo alto").toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height, "il comando chiudi esce dal bordo basso").toBeLessThanOrEqual(390);
  // E si puo' davvero premere: se qualcosa lo copre, questo clic fallisce.
  await chiudi.click();
  await expect(dialog).toHaveCount(0);
});

// ── Posizionamento: il foglio e le parole ─────────────────────────────────
// Alberto, 13 settembre 2026 (A18-A20): Posizionamento scorre sopra il tuffo
// dell'hero come un foglio a bordo dritto e le parole del titolo si
// allontanano in x fino a giustificare la riga (spec coreografia §3.3, CAT §3).
test.describe("Posizionamento: il foglio e le parole", () => {
  for (const lingua of ["it", "de"] as const) {
    test(`in ${lingua} nessuna parola esce dall'h2; da 1024 il foglio arriva in cima a fine tuffo`, async ({ page, goto }) => {
      await page.context().addCookies([{ name: "dt_locale", value: lingua, domain: "127.0.0.1", path: "/" }]);
      await goto("/");
      const cover = page.locator("[data-hero-cover]");
      const vp = page.viewportSize()!;
      if (vp.width >= 1024 && vp.height >= 640) {
        await expect(page.locator("#top")).toHaveAttribute("data-on", "");
        await expect(cover).toHaveCSS("margin-top", `-${vp.height}px`);
        const fine = await page.evaluate(() => {
          const top = document.querySelector<HTMLElement>("#top")!;
          return top.getBoundingClientRect().top + window.scrollY + top.offsetHeight - window.innerHeight;
        });
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior }), fine);
        await page.waitForTimeout(300);
        const t = await cover.evaluate((el) => el.getBoundingClientRect().top);
        expect(t).toBeGreaterThanOrEqual(-1);
        expect(t).toBeLessThanOrEqual(1);
      }
      // La lingua nuova è arrivata nei caratteri (LocaleProvider passa alla lingua del cookie in un effetto).
      const h2 = cover.locator("h2");
      if (lingua === "de") await expect(h2).toHaveAttribute("aria-label", /Immobilie/);
      const misura = () =>
        h2.evaluate((el) => {
          const destra = el.getBoundingClientRect().right;
          const parole = Array.from(el.querySelectorAll<HTMLElement>(".dt-w"));
          return {
            fuori: parole.filter((w) => w.getBoundingClientRect().right > destra + 1).map((w) => w.textContent),
            mosse: parole.filter((w) => new DOMMatrixReadOnly(getComputedStyle(w).transform).m41 > 1).length,
          };
        });
      // Titolo al centro del viewport: le parole si sono già allontanate (scrub 0,8).
      await h2.evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2, behavior: "instant" as ScrollBehavior });
      });
      await page.waitForTimeout(1200);
      const centro = await misura();
      expect(centro.fuori, `parole oltre il bordo destro dell'h2: ${centro.fuori.join(", ")}`).toEqual([]);
      expect(centro.mosse, "nessuna parola si è allontanata col titolo al centro").toBeGreaterThan(0);
      // Fine del tratto (`center top`): ancora nessuna parola fuori.
      await h2.evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: r.top + window.scrollY + r.height / 2 + 10, behavior: "instant" as ScrollBehavior });
      });
      await page.waitForTimeout(1200);
      expect((await misura()).fuori).toEqual([]);
    });
  }

  test("sotto il gate dei corridoi il foglio non copre nulla @layout", async ({ page, goto }) => {
    const vp = page.viewportSize()!;
    test.skip(vp.width >= 1024 && vp.height >= 640, "qui il gate è acceso");
    await goto("/");
    await expect(page.locator("[data-hero-cover]")).toHaveCSS("margin-top", "0px");
  });
});

// ── HomeSearchGateway: l'aggancio del pannello ────────────────────────────
// Alberto, 13 settembre 2026 (A18-A20): il pannello del form si aggancia allo
// scroll, opacità 0,02 → 1 e scala 0,75 → 1 dal centro (spec coreografia §3.4, CAT §6a).
test.describe("HomeSearchGateway: l'aggancio del pannello", () => {
  /**
   * Porta il bordo alto dell'innesco `[data-dock]` alla frazione f del viewport. L'innesco non scala
   * (la scala sta su `[data-dock-panel]`): il suo bordo è quello che ScrollTrigger misura per `top 95%` e `top 55%`.
   */
  async function portaDock(page: Page, f: number) {
    await page.evaluate(async (fr) => {
      const d = document.querySelector<HTMLElement>("[data-dock]")!;
      let y = 0;
      for (let el: HTMLElement | null = d; el; el = el.offsetParent as HTMLElement | null) y += el.offsetTop;
      window.scrollTo({ top: y - fr * window.innerHeight, behavior: "instant" as ScrollBehavior });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, f);
    await page.waitForTimeout(900); // scrub 0,35 più margine
  }

  test("al 40 % è pieno e fermo; al 95 % quasi spento; il fuoco lo porta a 1 e resta 1", async ({ page, goto }) => {
    await goto("/");
    const panel = page.locator("[data-dock-panel]");
    await expect(panel).toBeAttached();
    const opacita = () => panel.evaluate((el) => Number(getComputedStyle(el).opacity));
    await portaDock(page, 0.4);
    await expect.poll(opacita, { timeout: 3000 }).toBeGreaterThanOrEqual(0.99);
    const m = await matrixOf(panel);
    expect(Math.abs(m.a - 1)).toBeLessThanOrEqual(0.01);
    expect(Math.abs(m.d - 1)).toBeLessThanOrEqual(0.01);

    await portaDock(page, 0.95);
    await expect.poll(opacita, { timeout: 3000 }).toBeLessThan(0.5);
    const innesco = await matrixOf(page.locator("[data-dock]"));
    expect([innesco.a, innesco.d], "la scala è finita sull'innesco [data-dock]").toEqual([1, 1]);
    const campo = panel.locator("input").first();
    await campo.focus();
    await page.waitForTimeout(100);
    expect(await opacita()).toBeGreaterThanOrEqual(0.999);
    await campo.fill("Villa a Tradate");
    await expect(campo).toHaveValue("Villa a Tradate");
    await campo.blur();
    await page.evaluate(() => window.scrollBy({ top: 200, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(700);
    expect(await opacita()).toBeGreaterThanOrEqual(0.999);
  });

  test("con l'ancora #cerca il pannello non passa mai sotto 0,99", async ({ page, goto }) => {
    await page.addInitScript(() => {
      const rec = { min: 1, fotogrammi: 0 };
      (window as unknown as { __dock: typeof rec }).__dock = rec;
      const t0 = performance.now();
      const giro = () => {
        const d = document.querySelector<HTMLElement>("[data-dock-panel]");
        if (d) {
          rec.fotogrammi += 1;
          rec.min = Math.min(rec.min, Number(getComputedStyle(d).opacity));
        }
        if (performance.now() - t0 < 4000) requestAnimationFrame(giro);
      };
      requestAnimationFrame(giro);
    });
    await goto("/#cerca");
    await page.waitForTimeout(4200);
    const rec = await page.evaluate(() => (window as unknown as { __dock: { min: number; fotogrammi: number } }).__dock);
    expect(rec.fotogrammi).toBeGreaterThan(0);
    expect(rec.min, `il pannello è sceso a ${rec.min}`).toBeGreaterThanOrEqual(0.99);
  });

  // Spec §3.4 (A20): l'ancora si legge dall'hash per non spegnere il pannello con `/#cerca`. Un
  // frammento malformato (`/#%`, `/#a%E2`, link troncati) fa lanciare decodeURIComponent dentro il
  // layout effect: senza guardia la home cade su app/error.tsx (React 19 lo riporta in console,
  // non come pageerror). Qui la home resta montata e l'aggancio nasce lo stesso.
  for (const frammento of ["#%", "#a%E2"]) {
    test(`con un frammento malformato (/${frammento}) la home non cade e il pannello si aggancia`, async ({ page, goto }) => {
      const errori: string[] = [];
      page.on("pageerror", (e) => errori.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errori.push(m.text());
      });
      await goto(`/${frammento}`);
      const panel = page.locator("[data-dock-panel]");
      // Senza ancora e con l'innesco sotto la linea di start lo stato spento nasce via JS dopo
      // l'idratazione: opacità 0,02. Se la home si smonta, il pannello sparisce. Conteggio e
      // opacità nello stesso task: un handle a un nodo staccato darebbe opacità "" (0).
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const p = document.querySelector<HTMLElement>("[data-dock-panel]");
              return { pannelli: document.querySelectorAll("[data-dock-panel]").length, spento: !!p && Number(getComputedStyle(p).opacity) < 0.5 };
            }),
          { timeout: 8000 },
        )
        .toEqual({ pannelli: 1, spento: true });
      // Lo stato deve reggere: con la home smontata il pannello sparisce entro pochi fotogrammi.
      await page.waitForTimeout(1000);
      expect(await panel.count(), "il pannello è sparito: la home si è smontata").toBe(1);
      expect(errori.filter((m) => /URIError|malformed/i.test(m)), "errori di pagina").toEqual([]);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});

// ── Voci: il carosello arriva da destra ───────────────────────────────────
// Alberto, 13 settembre 2026 (A18-A20): parallelogramma e scorrimento da destra
// di Era a ogni ingresso dal basso, chiusura verso sinistra risalendo (C22,
// replay nei due versi). Spec coreografia §3.7.
test.describe("Voci: il carosello arriva da destra", () => {
  const stili = (page: Page) =>
    page.evaluate(() => {
      const ul = document.querySelector<HTMLElement>("#voci ul")!;
      return {
        clip: Array.from(document.querySelectorAll<HTMLElement>("#voci [data-voci-slide]")).filter((s) => s.style.clipPath !== "").length,
        inner: Array.from(document.querySelectorAll<HTMLElement>("#voci [data-voci-slide-inner]")).filter((s) => s.style.transform !== "").length,
        ul: ul.style.transform,
      };
    });
  const portaRotaia = (page: Page, f: number) =>
    page.evaluate(async (fr) => {
      const ul = document.querySelector<HTMLElement>("#voci ul")!;
      window.scrollTo({ top: ul.getBoundingClientRect().top + window.scrollY - fr * window.innerHeight, behavior: "instant" as ScrollBehavior });
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, f);

  test("entra senza traboccare, a 1,6 s non lascia stili, risalendo si richiude e poi rientra", async ({ page, goto }) => {
    await goto("/");
    // Lo stato chiuso nasce via JS, perché al montaggio la rotaia è sotto la piega.
    await expect.poll(async () => (await stili(page)).clip, { timeout: 15_000 }).toBeGreaterThan(0);
    await page.evaluate(() => {
      const rec = { max: -1 };
      (window as unknown as { __trabocco: typeof rec }).__trabocco = rec;
      const t0 = performance.now();
      const giro = () => {
        rec.max = Math.max(rec.max, document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (performance.now() - t0 < 2200) requestAnimationFrame(giro);
      };
      requestAnimationFrame(giro);
    });
    await portaRotaia(page, 0.5);
    await page.waitForTimeout(1600);
    expect(await stili(page)).toEqual({ clip: 0, inner: 0, ul: "" });
    await page.waitForTimeout(700);
    const trabocco = await page.evaluate(() => (window as unknown as { __trabocco: { max: number } }).__trabocco.max);
    expect(trabocco, `il documento ha traboccato di ${trabocco}px durante l'ingresso`).toBeLessThanOrEqual(0);

    await portaRotaia(page, 0.9);
    await expect.poll(async () => (await stili(page)).clip, { timeout: 2000 }).toBeGreaterThan(0);
    await portaRotaia(page, 0.5);
    await page.waitForTimeout(1600);
    expect((await stili(page)).clip).toBe(0);
    expect((await stili(page)).inner).toBe(0);
  });

  // Spec §2.4 («Armamento»: in viewport nessuna uscita) e D22 (ricarica a metà pagina).
  test("ricaricando con la rotaia fra il 70 % e il 100 % del viewport le tessere in vista non si chiudono", async ({ page, goto }) => {
    // Registra l'armamento: dove sta la rotaia all'observe e se una tessera prende una clip a scroll fermo.
    await page.addInitScript(() => {
      const rec = { rapporto: null as number | null, fotogrammi: 0, chiusure: 0 };
      (window as unknown as { __voci: typeof rec }).__voci = rec;
      const observe = IntersectionObserver.prototype.observe;
      IntersectionObserver.prototype.observe = function (this: IntersectionObserver, target: Element) {
        if (rec.rapporto === null && target instanceof HTMLElement && target.matches("#voci ul")) {
          rec.rapporto = target.getBoundingClientRect().top / window.innerHeight;
          const y0 = window.scrollY;
          const t0 = performance.now();
          const giro = () => {
            if (Math.abs(window.scrollY - y0) <= 2) {
              rec.fotogrammi += 1;
              const slides = Array.from(document.querySelectorAll<HTMLElement>("#voci [data-voci-slide]"));
              if (slides.some((s) => s.style.clipPath !== "")) rec.chiusure += 1;
            }
            if (performance.now() - t0 < 1500) requestAnimationFrame(giro);
          };
          requestAnimationFrame(giro);
        }
        return observe.call(this, target);
      };
    });
    await goto("/");
    await expect(page.locator("#voci ul")).toBeAttached();
    await portaRotaia(page, 0.8);
    await page.waitForTimeout(1200);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __voci: { rapporto: number | null } }).__voci.rapporto), {
        timeout: 15_000,
      })
      .not.toBeNull();
    await page.waitForTimeout(1700);
    const rec = await page.evaluate(
      () => (window as unknown as { __voci: { rapporto: number; fotogrammi: number; chiusure: number } }).__voci,
    );
    expect(
      rec.rapporto,
      "all'armamento la rotaia non stava fra il 70 % e il 100 % del viewport: scenario non esercitato, controllare il ripristino dello scroll (D22)",
    ).toBeGreaterThan(0.7);
    expect(rec.rapporto).toBeLessThan(1);
    expect(rec.fotogrammi).toBeGreaterThan(10);
    expect(rec.chiusure, "le tessere in vista si sono chiuse all'armamento, senza scroll").toBe(0);
  });
});
