import type { Locator, Page } from "@playwright/test";
import sharp from "sharp";
import { test, expect, setConsent, clickUntil, videoTile } from "./helpers";
import {
  clipOf,
  heldTimeouts,
  holdTimeouts,
  insetValues,
  installProbe,
  matrixOf,
  muteIntersectionObserver,
  noOverflowX,
  observedAt,
  placeEdge,
  productOpacity,
  releaseTimeouts,
  wheelTo,
} from "./coreografia";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

test("alla seconda visita suona la porta corta e l'H1 resta visibile entro 4 s", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 12_000 });

  // Seconda visita nella stessa sessione: il film intero non torna, suona la
  // porta corta da 2,38 s (Alberto, 13 settembre 2026, A18 e A20; spec §6.2).
  const started = Date.now();
  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("html"), "alla seconda visita non è suonata la porta corta").toHaveAttribute(
    "data-preloader",
    "short",
    { timeout: 3_000 },
  );
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 4_000 });
  await expect(page.locator("html")).not.toHaveAttribute("data-preloader", /.*/, { timeout: 6_000 });
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
  // A57: i nastri sono due (storia e la finestra di Open Domus): qui si guarda quello di storia.
  const horizon = page.locator("#storia");
  await expect(horizon).toHaveAttribute("data-on", "");

  // Si scrolla come un utente (wheel → Lenis) fin dentro la sezione pinnata:
  // il track deve tradursi in orizzontale mentre la pagina scende.
  await horizon.scrollIntoViewIfNeeded();
  const readX = () =>
    page
      .locator("#storia .dt-horizon_track")
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
//
// Audit del 21 settembre 2026 (blocco 23), difetto H03: nel fotogramma finale
// il titolo a gradini cavalca la foto aerea per scelta (A18-A20, `-11vw` in
// globals.css), ma sottotitolo, lead e link no — ogni loro riga (rettangoli del
// Range) deve fermarsi PRIMA del bordo sinistro della foto, con un canale
// d'aria. Prima della correzione le righe lunghe finivano sotto la foto di
// 13,8 px a 1440×900, 42,9 a 1366×768 e 107,8 a 1024×640 (scratchpad
// impl-G1/misura-h03.mjs); dopo il primo giro toccavano la foto a filo (0,5 px
// a 1024, 1,3 a 1366, 7,9 a 1440: revisori del 21 settembre), perché il gruppo
// rendeva esattamente gli 11vw dei gradini e il suo bordo destro coincideva col
// bordo della foto. Ora il gruppo rende 11vw + 2rem, e qui si pretendono almeno
// ARIA_MIN_PX. Il test è `@layout` (gira anche a 1366×768) e ha un giro a
// 1024×640, il viewport minimo del corridoio (spec §9.2), dove il difetto era
// più grande.
const ARIA_MIN_PX = 24;

/** Le righe di h4, lead e link del territorio troppo vicine alla foto aerea (o sotto). */
const righeAddossoAllaFoto = (storia: Locator) =>
  storia.evaluate((el, ariaMin) => {
    const pannello = el.querySelector(".dt-horizon_panel--territory")!;
    const foto = pannello.querySelector('[data-horizon-slide][data-bg="foto"]')!.getBoundingClientRect();
    const h4 = pannello.querySelector("h4")!;
    const bersagli: Array<[string, Element]> = [
      ["h4", h4],
      ["lead", h4.nextElementSibling!],
      ["link", pannello.querySelector('a[href="/acquista"]')!],
    ];
    const out: string[] = [];
    for (const [nome, nodo] of bersagli) {
      const range = document.createRange();
      range.selectNodeContents(nodo);
      for (const r of range.getClientRects()) {
        if (r.width < 2 || r.height < 2) continue;
        const aria = foto.left - r.right;
        if (aria < ariaMin) out.push(`${nome}: riga a y ${Math.round(r.top)} a ${aria.toFixed(1)}px dalla foto (minimo ${ariaMin})`);
      }
    }
    return out;
  }, ARIA_MIN_PX);

/** Porta il nastro al fotogramma finale (il territorio inquadrato, lettere entrate) e restituisce la y. */
async function fineCorsaTerritorio(page: Page, storia: Locator, lettere: Locator) {
  const y = await storia.evaluate(
    (el) => el.getBoundingClientRect().top + window.scrollY + (el as HTMLElement).offsetHeight - window.innerHeight,
  );
  await scrollNastro(page, y);
  await expect.poll(() => minLettere(lettere), { timeout: 3_500 }).toBeGreaterThanOrEqual(0.99);
  return y;
}

test("il blocco del territorio entra nel nastro ed esce a destra risalendo @layout", async ({ page, goto }) => {
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
  let y = await fineCorsaTerritorio(page, storia, lettere);
  expect(await sinistra()).toBeLessThan(0.85);

  const addosso = await righeAddossoAllaFoto(storia);
  expect(addosso, `lead, sottotitolo o link del territorio addosso alla foto:\n${addosso.join("\n")}`).toEqual([]);

  // Risalita a passi da 150 px; scrub 0,25 del track, 400 ms per passo.
  for (let i = 0; i < 30 && (await sinistra()) < 0.88; i++) {
    y -= 150;
    await scrollNastro(page, y);
    await page.waitForTimeout(400);
  }
  expect(await sinistra(), "il gruppo non è tornato a destra della linea d'uscita").toBeGreaterThanOrEqual(0.88);
  await expect.poll(() => maxLettere(lettere), { timeout: 1_300 }).toBeLessThan(0.1);
});

// Il viewport minimo del corridoio (1024×640, spec §9.2): qui il lead del
// territorio prende sei righe e il difetto H03 era di 107,8 px. Solo sui
// progetti desktop: il descrittore del telefono porta DPR 3 e tocco, e il
// nastro non è il suo caso.
test("a 1024×640 il testo del territorio tiene il canale d'aria dalla foto @layout", async ({ page, goto }) => {
  const vp = page.viewportSize()!;
  test.skip(vp.width < 1024, "misura del corridoio al minimo: solo dai progetti desktop");
  await page.setViewportSize({ width: 1024, height: 640 });
  await goto("/");
  const storia = page.locator("#storia");
  await expect(storia).toHaveAttribute("data-on", "");
  const gruppo = storia.locator("[data-reveal-group]").filter({ has: page.locator("h4") }).first();
  const lettere = gruppo.locator("h4 [data-c]");
  await expect(lettere.first()).toBeAttached();
  await fineCorsaTerritorio(page, storia, lettere);
  const addosso = await righeAddossoAllaFoto(storia);
  expect(addosso, `a 1024×640 il testo del territorio è addosso alla foto:\n${addosso.join("\n")}`).toEqual([]);
  // Il pannello sta nello schermo: h4, lead e link non scendono sotto i 640 px.
  const fondo = await gruppo.evaluate((el) => el.getBoundingClientRect().bottom);
  expect(fondo, "il gruppo del territorio esce dal fondo dello schermo a 1024×640").toBeLessThanOrEqual(640);
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
    // La colonna del testo e' piu' bassa dal 2026-09-20 (via il lead di percorso, D236:
    // titolo, tre punti e link, ~290 px): con gli stessi yPercent ±10 la sua corsa
    // fra p 0,1 e p 0,9 vale 0,2 × 290 × 0,645 ≈ 37 px. Il gesto e' lo stesso.
    expect(b1 - b9).toBeGreaterThanOrEqual(30);
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

// La finestra di Open Domus (A57/A58 di Alberto, 22 set. 2026, sera): un nastro come «Tra la Pineta e
// Milano» con la facciata che sale. Da 1024×640 con motion ok lo schermo si aggancia con la foto a
// schermo intero DA SUBITO (niente tende né scala: A58), la cornice sale di `lead` px finché la cima
// delle terrazze non sta al 10 % del viewport (la posa dello screenshot di A57), poi il track scorre
// di lato: la foto esce a sinistra e i due pannelli del capitolo entrano coi sipari del nastro.
test.describe("la finestra di Open Domus", () => {
  const CIMA = (JSON.parse(readFileSync(join(__dirname, "../app/lib/motion/finestra.json"), "utf8")) as { cielo: { cima: number } }).cielo.cima;
  const CIMA_CODA = (JSON.parse(readFileSync(join(__dirname, "../app/lib/motion/coda.json"), "utf8")) as { cielo: { cima: number } }).cielo.cima;
  for (const vp of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    test(`a ${vp.width}×${vp.height} la facciata è a schermo intero da subito, sale dietro il titolo, poi il nastro scorre di lato e la coda scende`, async ({ page, goto, isMobile }) => {
      test.skip(!!isMobile, "il corridoio vive da 1024 px");
      await page.setViewportSize(vp);
      await goto("/");
      const od = page.locator("#open-domus");
      await expect(od).toHaveAttribute("data-on", "");
      // A58: tende, stage, pista, marcatori, spazio sopra, chiusura e la soglia sono morti.
      expect(await od.locator(".dt-od_shutterzone, .dt-od_stage, .dt-od_run, .dt-od_mark, .dt-od_content, .dt-od_area, .dt-od_porta").count()).toBe(0);
      await expect(od.locator(".dt-horizon_screen")).toHaveCSS("position", "sticky");
      const geo = await od.evaluate((el) => {
        const win = el.querySelector<HTMLElement>(".dt-od_window")!;
        const titolo = el.querySelector<HTMLElement>(".dt-od_titolo")!;
        const track = el.querySelector<HTMLElement>(".dt-horizon_track")!;
        const coda = el.querySelector<HTMLElement>(".dt-od_coda_foto")!;
        return {
          top: el.getBoundingClientRect().top + window.scrollY,
          h: (el as HTMLElement).offsetHeight,
          winH: win.offsetHeight,
          copri: titolo.offsetTop + 0.5 * titolo.offsetHeight,
          trackW: track.offsetWidth,
          // La corsa del track si misura sullo schermo del nastro, senza la barra di scorrimento.
          screenW: el.querySelector<HTMLElement>(".dt-horizon_screen")!.clientWidth,
          codaH: coda.offsetHeight,
          vh: window.innerHeight,
          vw: window.innerWidth,
        };
      });
      const lead = Math.max(0, CIMA * geo.winH - geo.copri);
      const run = geo.trackW - geo.screenW;
      const from = -Math.max(0, CIMA_CODA * geo.codaH - 0.55 * geo.vh);
      const tail = Math.max(0, geo.codaH - geo.vh + from);
      expect(lead, "la salita c'è").toBeGreaterThan(100);
      expect(tail, "la coda c'è").toBeGreaterThan(200);
      // La sezione è alta salita + corsa del track + coda + schermo (il gesto è 1:1), e il track sono tre pannelli.
      expect(Math.abs(geo.h - (lead + run + tail + geo.vh))).toBeLessThanOrEqual(3);
      expect(Math.abs(geo.trackW - 3 * geo.vw)).toBeLessThanOrEqual(3);

      // All'aggancio (s ≈ 0; wheelTo arriva a passi): la scatola della foto è salita di quanto la sezione è
      // passata sotto il bordo (letto dal DOM), il titolo è fermo nella cornice, il track è fermo; in cima la
      // carta del cielo e il titolo in inchiostro (A46), la trave della pergola in vista.
      await wheelTo(page, Math.round(geo.top));
      await page.waitForTimeout(600);
      const relA = await od.evaluate((el) => el.getBoundingClientRect().top);
      expect(relA, "wheelTo è finito oltre la salita").toBeGreaterThan(-(lead - 50));
      expect(Math.abs((await matrixOf(od.locator(".dt-od_window"))).m42 - Math.max(-lead, Math.min(0, relA)))).toBeLessThanOrEqual(3);
      expect(Math.abs((await matrixOf(od.locator(".dt-od_cornice"))).m42), "il titolo non deve muoversi (A65)").toBeLessThanOrEqual(0.5);
      expect(Math.abs((await matrixOf(od.locator(".dt-horizon_track"))).m41)).toBeLessThanOrEqual(2);
      await verificaCieloFinestra(page, `${vp.width}×${vp.height} all'aggancio`);

      // Fine salita (s ≥ lead): la scatola è salita di `lead` e resta lì; il tetto delle terrazze sta a metà
      // delle lettere del titolo, che non si è mosso (A65); il track ha appena cominciato; niente overflow.
      await wheelTo(page, Math.round(geo.top + lead + 120));
      await page.waitForTimeout(700);
      const salita = await od.evaluate((el) => {
        const w = el.querySelector(".dt-od_window")!.getBoundingClientRect();
        const t = el.querySelector(".dt-od_titolo")!.getBoundingClientRect();
        return { top: w.top, h: w.height, titolo: t.top + 0.5 * t.height };
      });
      expect(Math.abs((await matrixOf(od.locator(".dt-od_window"))).m42 + lead)).toBeLessThanOrEqual(3);
      expect(Math.abs(salita.top + CIMA * salita.h - salita.titolo), "il tetto non sta a metà delle lettere del titolo").toBeLessThanOrEqual(4);
      const xB = (await matrixOf(od.locator(".dt-horizon_track"))).m41;
      expect(xB).toBeLessThanOrEqual(0);
      expect(xB, "a inizio nastro il track è quasi fermo (dtInOut parte lenta)").toBeGreaterThan(-0.2 * geo.vw);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);

      // A metà nastro (p ≈ 0,5: dtInOut è simmetrica, x ≈ −1vw; wheelTo può scostare e la curva lì è ripida) il
      // secondo pannello è in scena: la foto è uscita a sinistra, il video di Teresa ha il sipario aperto e
      // l'occhiello è entrato.
      await wheelTo(page, Math.round(geo.top + lead + 0.5 * run));
      await page.waitForTimeout(2200);
      const x = (await matrixOf(od.locator(".dt-horizon_track"))).m41;
      expect(Math.abs(x + geo.vw), `il track sta a ${x}, non attorno a −1vw`).toBeLessThanOrEqual(0.35 * geo.vw);
      expect((await od.locator(".dt-od_window").boundingBox())!.x + geo.vw, "la foto non è uscita a sinistra").toBeLessThanOrEqual(0.1 * geo.vw);
      const video = od.locator(".dt-od_panel--claim [data-horizon-slide]");
      await expect.poll(async () => insetValues(await clipOf(video)), { timeout: 3000 }).toEqual([0, 0, 0, 0]);
      await expect.poll(() => productOpacity(od.locator(".dt-od_panel--claim .eyebrow").first()), { timeout: 3000 }).toBeGreaterThan(0.99);

      // Fine del track (s = lead + corsa): la coda è in scena, la piscina a sipario aperto e già alzata (`from`:
      // il soggetto al 55 % dello schermo, A67); sopra, sulla carta, il titolo a gradini, le liste e il rilancio
      // dentro lo schermo. wheelTo può sforare: la coda è già scesa di quel tanto.
      await wheelTo(page, Math.round(geo.top + lead + run));
      await page.waitForTimeout(2200);
      const coda = od.locator(".dt-od_coda");
      await expect.poll(async () => insetValues(await clipOf(coda)), { timeout: 3000 }).toEqual([0, 0, 0, 0]);
      // wheelTo può fermarsi fino a ~100 px oltre la quota (ScrollTrigger e DOM non coincidono al pixel dopo
      // il rientro della testata): la coda può essere già scesa di quel tanto, non di più, e mai risalita.
      const fb = (await od.locator(".dt-od_coda_foto").boundingBox())!;
      expect(Math.abs(fb.x)).toBeLessThanOrEqual(3);
      expect(Math.abs(fb.width - geo.vw), "la piscina è larga tutto").toBeLessThanOrEqual(3);
      expect(fb.y, "la piscina non è arrivata alzata quanto deve").toBeLessThanOrEqual(from + 4);
      expect(fb.y, "la piscina è scesa troppo per la quota raggiunta").toBeGreaterThanOrEqual(from - 120);
      const gb = (await od.locator("[data-horizon-stair]").first().boundingBox())!;
      expect(gb.y).toBeGreaterThanOrEqual(0);
      expect(gb.x).toBeGreaterThanOrEqual(0);
      const cta = od.getByRole("link", { name: /Scopri Open Domus/ });
      const cb = (await cta.boundingBox())!;
      expect(cb.x).toBeGreaterThanOrEqual(0);
      expect(cb.y + cb.height).toBeLessThanOrEqual(geo.vh);

      // Fine della coda: 150 px oltre la fine della sezione (le quote di ScrollTrigger e il DOM possono
      // scostare di qualche decina di px dopo il carico) lo schermo si è sganciato e sale con la pagina, la
      // piscina è scesa di tutta la coda — il suo fondo era al fondo dello schermo e ora sta 150 px sopra —
      // e il track non si è mosso oltre la sua corsa.
      // La quota si rilegge dal DOM: la sezione di Voci si accorcia di ~80 px dopo il primo passaggio (misurato
      // il 22 set. sera) e tutto quel che sta sotto sale di altrettanto.
      const topFine = await od.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      await wheelTo(page, Math.round(topFine + geo.h - geo.vh + 150));
      await page.waitForTimeout(900);
      const fine = (await od.locator(".dt-od_coda_foto").boundingBox())!;
      expect(Math.abs(fine.y + fine.height - (geo.vh - 150)), "il fondo della piscina non è arrivato al fondo dello schermo prima dello sgancio").toBeLessThanOrEqual(6);
      expect(Math.abs((await matrixOf(od.locator(".dt-horizon_track"))).m41 + run)).toBeLessThanOrEqual(3);

      // A68: all'uscita la piscina si chiude in cartolina (8/22, ChiusuraFoto) finché il fondo della sezione
      // non arriva al 10 % del viewport; 100 px oltre quel punto la cornice è piena.
      await wheelTo(page, Math.round(topFine + geo.h - 0.1 * geo.vh + 100));
      await page.waitForTimeout(1200);
      const cartolina = insetValues(await clipOf(od.locator(".dt-od_coda")))!;
      expect(Math.abs(cartolina[0] - 8), `cornice sopra ${cartolina[0]} %`).toBeLessThanOrEqual(1);
      expect(Math.abs(cartolina[1] - 22), `cornice a destra ${cartolina[1]} %`).toBeLessThanOrEqual(1);
    });
  }

  // A46 (Alberto, 21 set. 2026, sera): il WebP col cielo trasparente, il titolo in inchiostro come
  // «ARCHITECTURE» su era, e i pixel: dove c'era il cielo (la cima della finestra) c'è l'avorio della
  // carta; sotto il titolo, nascosto per un istante, l'inchiostro regge su quel che c'è (carta o facciata).
  async function verificaCieloFinestra(page: Page, dove: string) {
    const win = page.locator("#open-domus .dt-od_window");
    const titolo = page.locator("#open-domus .dt-od_titolo");
    // A47: la facciata che sale, 9:16, col cielo trasparente (finestra.json).
    await expect(page.locator("#open-domus .dt-od_window img")).toHaveAttribute("src", /villa-facciata-sale-alta-cielo\.webp/);
    await expect(titolo, `${dove}: il titolo non è inchiostro`).toHaveCSS("color", "rgb(70, 66, 61)");
    await page.locator("#open-domus .dt-od_window img").evaluate((el) => (el as HTMLImageElement).decode().catch(() => undefined));
    await page.waitForTimeout(200);
    const r = await win.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const t = el.parentElement!.querySelector<HTMLElement>(".dt-od_titolo")!;
      const tb = t.getBoundingClientRect();
      t.style.setProperty("visibility", "hidden");
      return { x: b.left, y: b.top, w: b.width, h: b.height, titolo: { x: tb.left, y: tb.top, w: tb.width, h: tb.height } };
    });
    const png = await page.screenshot({ animations: "disabled" });
    await titolo.evaluate((t) => (t as HTMLElement).style.removeProperty("visibility"));
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
    const k = info.width / vp.w;
    const dentro = (x: number, y: number) => x >= 0 && y >= 0 && x < vp.w && y < vp.h;
    const pixel = (x: number, y: number) => {
      const i = (Math.round(y * k) * info.width + Math.round(x * k)) * info.channels;
      return [data[i], data[i + 1], data[i + 2]];
    };
    const avorio = (p: number[]) => Math.abs(p[0] - 246) <= 3 && Math.abs(p[1] - 217) <= 3 && Math.abs(p[2] - 208) <= 3;
    // A schermo intero lo stage sticky può stare qualche decina di px sopra il bordo (a 1440×900 la
    // finestra comincia a −84): si campiona la parte VISIBILE della finestra. Il cielo trasparente della
    // facciata è sottile in cima (le punte dei cipressi ai lati stanno a 0,121 dell'altezza della foto).
    const vis = { x: Math.max(0, r.x), y: Math.max(0, r.y), right: Math.min(r.x + r.w, vp.w), bottom: Math.min(r.y + r.h, vp.h) };
    const vw = vis.right - vis.x;
    const vh = vis.bottom - vis.y;
    expect(vh, `${dove}: la finestra non è in vista`).toBeGreaterThan(200);
    // A schermo intero la cima della finestra sta già sopra il bordo (−84 a 1440×900, −93 a 1024×768) e
    // dei cipressi ai lati restano le punte: la carta si cerca nella prima riga visibile, nel 60 % centrale
    // (lì il soggetto comincia a 0,150 dell'altezza della foto: 22-42 px di viewport ancora di cielo).
    // Sotto lg la testata sticky (avorio profondo, non la carta) copre le prime righe del viewport: il cielo si
    // campiona sotto di lei (col quadrato aperto il cielo della facciata scende a 0,246 della foto: ci sta).
    const testata = await page.evaluate(() => {
      const h = document.querySelector("header");
      if (!h) return 0;
      const b = h.getBoundingClientRect();
      return b.height > 0 && b.top <= 0 && b.bottom > 0 ? b.bottom : 0;
    });
    const yCielo = Math.max(vis.y, testata) + 2;
    for (const fx of [0.4, 0.5, 0.6] as const) {
      const x = vis.x + fx * vw;
      const p = pixel(x, yCielo);
      expect(avorio(p), `${dove}: in cima alla finestra, a (${Math.round(x)}, ${Math.round(yCielo)}), non c'è la carta ma rgb(${p})`).toBe(true);
    }
    // Il titolo resta leggibile: sotto ogni punto del suo rettangolo (nascosto) — carta del cielo, o la
    // facciata bianca dove il titolo le si appoggia, come «ARCHITECTURE» su era (A45) — l'inchiostro regge
    // almeno 3:1 (è un titolo da 12vw). Griglia di 9×3 punti dentro il viewport.
    const luminanza = (c: number[]) => {
      const lin = c.map((v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4));
      return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    };
    const INCHIOSTRO = luminanza([70, 66, 61]);
    let campionati = 0;
    for (let i = 1; i <= 9; i++) {
      for (let j = 1; j <= 3; j++) {
        const [x, y] = [r.titolo.x + (r.titolo.w * i) / 10, r.titolo.y + (r.titolo.h * j) / 4];
        if (!dentro(x, y)) continue;
        campionati += 1;
        const p = pixel(x, y);
        const rapporto = (Math.max(luminanza(p), INCHIOSTRO) + 0.05) / (Math.min(luminanza(p), INCHIOSTRO) + 0.05);
        expect(rapporto, `${dove}: sotto il titolo, a (${i}/10, ${j}/4), c'è rgb(${p}): l'inchiostro fa ${rapporto.toFixed(2)}:1, sotto 3:1 (A46)`).toBeGreaterThanOrEqual(3);
      }
    }
    // A 1024×768 a schermo intero il titolo (104 px, appoggiato alla cima) sta già tutto sopra il bordo
    // (la finestra comincia a −93): la griglia non ha punti e la lettura vale sugli altri stage.
    if (campionati > 0) expect(campionati, `${dove}: del titolo si vede troppo poco per misurarlo`).toBeGreaterThanOrEqual(3);
    // E la foto c'è: sulla trave di legno della pergola più alta (x 0,15, y 0,295 della foto: scura, e in
    // vista sia a schermo intero sia col quadrato aperto sul telefono) il pixel non è carta.
    const trave = { x: r.x + 0.15 * r.w, y: r.y + 0.295 * r.h };
    expect(dentro(trave.x, trave.y), `${dove}: la trave della pergola non è nel viewport`).toBe(true);
    const villa = pixel(trave.x, trave.y);
    expect(avorio(villa), `${dove}: sulla trave della pergola c'è la carta, non la villa`).toBe(false);
  }

  // A57/A58 sotto 1024: nessun nastro; la foto è la 9:16 intera, in flusso, a tutta larghezza, e i due
  // pannelli del capitolo la seguono in colonna; il cielo è la carta e il titolo sta in inchiostro sopra.
  test("sotto 1024 la facciata è intera, in flusso, e il capitolo la segue in colonna", async ({ page, goto, isMobile }) => {
    test.skip(!isMobile, "il ramo del telefono");
    await goto("/");
    const od = page.locator("#open-domus");
    expect(await od.getAttribute("data-on")).toBeNull();
    const win = od.locator(".dt-od_window");
    await win.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const r = await win.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { w: b.width, h: b.height, vw: window.innerWidth, clip: getComputedStyle(el).clipPath };
    });
    expect(Math.abs(r.w - r.vw), "la foto è larga come lo schermo").toBeLessThanOrEqual(1);
    expect(Math.abs(r.w / r.h - 2160 / 3870)).toBeLessThan(0.02);
    expect(r.clip, "nessun otturatore (A58)").toBe("none");
    // La cima della foto sotto la testata sticky del telefono (che coprirebbe il titolo): il cielo è la
    // carta e il titolo sta in inchiostro sopra (A46).
    await win.evaluate((el) => {
      const testata = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - testata - 4, behavior: "instant" });
    });
    await page.waitForTimeout(400);
    await verificaCieloFinestra(page, "telefono, foto in flusso");
    // Il capitolo segue la foto: l'occhiello sta sotto il fondo della foto.
    const sotto = await page.evaluate(() => {
      const w = document.querySelector("#open-domus .dt-od_window")!.getBoundingClientRect();
      const e = document.querySelector("#open-domus .dt-od_panel--claim .eyebrow")!.getBoundingClientRect();
      return e.top - w.bottom;
    });
    expect(sotto).toBeGreaterThan(0);
  });

  // La rete di fuoco del nastro (HorizonScroller, A57): il Tab dal rilancio del Metodo porta il fuoco al
  // video di Teresa, nel secondo pannello; lo schermo non scorre in orizzontale e il pannello è in scena.
  test("da «Vedi i nove passi» il Tab porta il video di Teresa in scena nel nastro", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "la rete di fuoco del nastro vive da 1024 px");
    await goto("/");
    await expect(page.locator("#open-domus")).toHaveAttribute("data-on", "");
    await page.getByRole("link", { name: "Vedi i nove passi", exact: true }).focus();
    await page.keyboard.press("Tab");
    const facciata = page.locator("#open-domus .dt-od_panel--claim button").first();
    await expect(facciata).toBeFocused();
    await page.waitForTimeout(600);
    const r = await facciata.evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { left: b.left, right: b.right, top: b.top, bottom: b.bottom, vw: window.innerWidth, vh: window.innerHeight, sl: el.closest(".dt-horizon_screen")!.scrollLeft };
    });
    expect(r.sl, "lo schermo del nastro non deve scorrere in orizzontale col focus").toBe(0);
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(r.vw);
    expect(r.top).toBeGreaterThanOrEqual(0);
    expect(r.bottom).toBeLessThanOrEqual(r.vh);
  });
});

const LISTA_DOC = "#domus-doc [data-doc-sheet] ul";
const RIGHE_DOC = '#domus-doc [data-hairline="doc"][data-axis="x"]';
const SPINA_DOC = '#domus-doc [data-hairline="doc"][data-axis="y"]';
const APERTE = Array.from({ length: 5 }, () => [0, 0, 0, 0]);
const USCITE = Array.from({ length: 5 }, () => [0, 0, 0, 100]);

/** I clip calcolati di tutti gli elementi del locator, come quattro numeri (insetValues del commit 11). */
async function insetsOf(l: Locator) {
  return (await l.evaluateAll((els) => els.map((e) => getComputedStyle(e).clipPath))).map(insetValues);
}

// Capitolo 10, Domus D.O.C. (spec §3.11; A20 di Alberto, D26). Le righe sopra i
// pilastri si tirano da sinistra e la spina (da md) scende dall'alto quando la
// lista passa la linea del 60 % (rootMargin −40 %); quando la lista torna sotto
// la linea proseguono ed escono (C22 della cliente: il gesto rigioca nei due
// versi). Prima la quota della spec (lista al 50 %, tutto disegnato a 1,8 s),
// poi la linea dai due lati: bordo alto a 0,61 fuori, a 0,59 dentro.
async function righeNeiDueVersi(page: Page) {
  const width = page.viewportSize()?.width ?? 0;
  const righe = page.locator(RIGHE_DOC);
  const spina = page.locator(SPINA_DOC);
  await expect(righe).toHaveCount(5);
  await expect(spina).toHaveCount(1);

  // A scroll 0 la lista è sotto lo schermo: lo stato chiuso lo scrive il JS.
  await expect.poll(async () => (await insetsOf(righe))[0], { timeout: 10_000 }).toEqual([0, 100, 0, 0]);
  if (width >= 768) await expect.poll(async () => insetValues(await clipOf(spina))).toEqual([0, 0, 100, 0]);

  // Lista al 50 % (spec §3.11). Riga i da 0,2 + i × 0,08 s per 0,8 s: l'ultima
  // corre fra 0,52 e 1,32 s, la spina (0,2 + 1,12 s) finisce con lei. placeEdge
  // torna circa 0,17 s dopo lo scroll, quindi la prima lettura cade verso 0,9 s:
  // l'ultima riga ha ancora circa il 20 % da tirare. Tempi più corti della firma
  // (per esempio 0,5 s senza ritardo) la troverebbero già chiusa.
  await placeEdge(page, LISTA_DOC, "top", 0.5);
  await page.waitForTimeout(700);
  expect((await insetsOf(righe))[4], "a 0,7 s dalla quota l'ultima riga è già tutta tirata").not.toEqual([0, 0, 0, 0]);
  // 1,8 s dalla quota, senza poll: la firma superata di lane-homeB (1,2 s, stagger 0,1, ritardo 0,3) finirebbe a 1,9 s.
  await page.waitForTimeout(1_100);
  expect(await insetsOf(righe)).toEqual(APERTE);
  if (width >= 768) expect(insetValues(await clipOf(spina))).toEqual([0, 0, 0, 0]);

  // Bordo alto a 0,61, sotto la linea: uscita 0,5 s dall'ultima riga, stagger 0,05 → 0,7 s.
  await placeEdge(page, LISTA_DOC, "top", 0.61);
  await page.waitForTimeout(900);
  expect(await insetsOf(righe)).toEqual(USCITE);
  if (width >= 768) expect(insetValues(await clipOf(spina))).toEqual([100, 0, 0, 0]);

  // Bordo alto a 0,59, sopra la linea: le righe rientrano (C22).
  await placeEdge(page, LISTA_DOC, "top", 0.59);
  await page.waitForTimeout(1_800);
  expect(await insetsOf(righe)).toEqual(APERTE);
  if (width >= 768) expect(insetValues(await clipOf(spina))).toEqual([0, 0, 0, 0]);
}

test("D.O.C.: le righe si tirano quando la lista passa il 60 % e proseguono tornando sotto", async ({ page, goto }) => {
  await goto("/");
  await righeNeiDueVersi(page);
});

// Il LocaleProvider rende `it` sul server e passa alla lingua del cookie dopo il
// montaggio (LocaleProvider.tsx:24-36; spec §2.3, test al primo caricamento con
// `dt_locale=de`): i `li` hanno per chiave il titolo del pilastro e React li
// rimonta. Il foglio si riarma sui nodi nuovi (useHairlineSheet con [locale]).
test("D.O.C.: con dt_locale=de al primo caricamento le righe nuove hanno lo stesso gesto", async ({ page, goto }) => {
  await page.context().addCookies([{ name: "dt_locale", value: "de", domain: "127.0.0.1", path: "/" }]);
  await goto("/");
  await expect(page.locator("#domus-doc [data-doc-sheet] li").first()).toContainText("Unterlagen");
  await righeNeiDueVersi(page);
});

// La rete dei 2.500 ms (spec §3.11 e §2.4; D26): se l'IntersectionObserver non
// avvisa, righe chiuse in vista si tirano quando scatta la rete, e non prima. La
// rete è trattenuta da holdTimeouts: il test la fa scattare quando la lista è in
// vista, senza dipendere dal tempo d'idratazione.
test("D.O.C.: senza avvisi dell'IntersectionObserver la rete dei 2.500 ms tira le righe", async ({ page, goto }) => {
  await muteIntersectionObserver(page);
  await holdTimeouts(page, 2_500);
  await goto("/");
  const righe = page.locator(RIGHE_DOC);
  await expect.poll(async () => (await insetsOf(righe))[0], { timeout: 10_000 }).toEqual([0, 100, 0, 0]);
  const armata = await observedAt(page, LISTA_DOC);
  expect(armata, "useHairlineSheet non ha osservato la lista").not.toBeNull();
  // La rete nasce nello stesso giro dell'observe: un timeout da 2.500 ms registrato con lui.
  expect(
    (await heldTimeouts(page)).some((t) => Math.abs(t - armata!) < 50),
    "nessuna rete da 2.500 ms armata insieme all'IntersectionObserver del foglio",
  ).toBe(true);

  await placeEdge(page, LISTA_DOC, "top", 0.5);
  await page.waitForTimeout(600);
  expect((await insetsOf(righe))[0], "senza avvisi e prima della rete le righe restano chiuse").toEqual([0, 100, 0, 0]);
  expect(await releaseTimeouts(page)).toBeGreaterThan(0);
  // Rete scattata adesso: ultima riga a 0,2 + 4 × 0,08 + 0,8 = 1,32 s.
  await expect.poll(() => insetsOf(righe), { timeout: 2_000 }).toEqual(APERTE);
});

// La rete vale solo finché l'IntersectionObserver non ha deciso (spec §3.11; D26,
// C22): righe uscite sotto la linea con la lista ancora in vista restano uscite
// anche quando le reti rimaste scattano.
test("D.O.C.: uscite sotto la linea, la rete dei 2.500 ms non le ridisegna", async ({ page, goto }) => {
  await holdTimeouts(page, 2_500);
  await goto("/");
  const righe = page.locator(RIGHE_DOC);
  await expect(righe).toHaveCount(5);
  await expect.poll(async () => (await insetsOf(righe))[0], { timeout: 10_000 }).toEqual([0, 100, 0, 0]);

  await placeEdge(page, LISTA_DOC, "top", 0.59);
  await page.waitForTimeout(1_800);
  expect(await insetsOf(righe)).toEqual(APERTE);
  await placeEdge(page, LISTA_DOC, "top", 0.61);
  await page.waitForTimeout(900);
  expect(await insetsOf(righe)).toEqual(USCITE);

  // Scattano le reti trattenute: quella del foglio l'ha già tolta l'IntersectionObserver.
  await releaseTimeouts(page);
  await page.waitForTimeout(1_600);
  expect(await insetsOf(righe), "la rete ha ridisegnato righe uscite con la lista in vista").toEqual(USCITE);
});

// Capitolo 11, Services (spec §3.12; A20 di Alberto, D27). L'interno della foto
// scende da 1,15 a 1 ancorato al bordo basso mentre la scatola entra, e si posa
// quando il bordo basso della scatola tocca il fondo dello schermo. Services vive
// anche su /servizi (spec §5.3): lo stesso gesto, subito dopo la testa della pagina.
for (const path of ["/", "/servizi"]) {
  test(`Services su ${path}: la foto si posa da 1,15 a 1 mentre la scatola entra`, async ({ page, goto, isMobile }) => {
    await goto(path);
    const width = page.viewportSize()?.width ?? 0;
    const scatola = "#servizi [data-zoom-box]";
    await expect(page.locator(scatola)).toHaveCount(3);
    const zoom = page.locator(`${scatola} > [data-zoom]`).first();

    // Da desktop la rotella attraversa i corridoi sopra Services, come un utente:
    // lo scrub vive nella zona in fondo alla home dove ScrollTrigger sfasava (spec §2.4).
    if (!isMobile) {
      const y = await page
        .locator(scatola)
        .first()
        .evaluate((el) => el.getBoundingClientRect().top + window.scrollY - window.innerHeight);
      await wheelTo(page, Math.max(0, y));
    }
    await placeEdge(page, scatola, "top", 0.95);
    await page.waitForTimeout(1_500); // scrub 1,0: il valore raggiunge lo scroll in circa un secondo
    const entrata = await matrixOf(zoom);
    expect(entrata.a).toBeGreaterThan(width >= 1024 ? 1.1 : 1.08);
    expect(entrata.d).toBeCloseTo(entrata.a, 4);
    expect(Math.abs(entrata.b)).toBeLessThan(0.001);

    await placeEdge(page, scatola, "bottom", 1);
    await page.waitForTimeout(1_500);
    const posata = await matrixOf(zoom);
    expect(Math.abs(posata.a - 1)).toBeLessThanOrEqual(0.01);

    await noOverflowX(page);
  });
}

// Capitolo 12, Costi chiari (spec §3.13; A20 di Alberto, D25, D28). La banda
// dell'acqua si apre dal basso a tempo quando passa la linea dell'80 % dello
// schermo (rootMargin −20 %) e si richiude verso il basso quando ci torna sotto
// (C22). La linea si prova dai due lati: bordo alto a 0,79 dentro, a 0,81 fuori.
// Il video lo prova e2e/ambient-video.spec.ts.
const BANDA = "#costi [data-acqua-band]";

test("Costi chiari: l'acqua sale quando la banda passa l'80 % e scende tornando sotto", async ({ page, goto, isMobile }) => {
  await goto("/");
  await expect(page.locator(BANDA)).toHaveCount(1);
  // A scroll 0 la banda è sotto lo schermo: chiusa dal basso, scritto dal JS.
  await expect.poll(async () => insetValues(await clipOf(page.locator(BANDA))), { timeout: 10_000 }).toEqual([100, 0, 0, 0]);

  // Da desktop la rotella attraversa i corridoi che stanno sopra (spec §3.13).
  if (!isMobile) {
    const y = await page.locator(BANDA).evaluate((el) => el.getBoundingClientRect().top + window.scrollY - window.innerHeight);
    await wheelTo(page, Math.max(0, y));
  }
  // 0,79: sopra la linea dell'80 % (placeEdge tiene lo scarto entro 0,005). Dopo 2 s,
  // come dice la spec, inset(0%): 1,8 s expo.out.
  await placeEdge(page, BANDA, "top", 0.79);
  await page.waitForTimeout(2_000);
  expect(insetValues(await clipOf(page.locator(BANDA)))).toEqual([0, 0, 0, 0]);

  // 0,81: sotto la linea. Uscita 0,7 s sine.in.
  await placeEdge(page, BANDA, "top", 0.81);
  await page.waitForTimeout(1_000);
  expect(insetValues(await clipOf(page.locator(BANDA)))).toEqual([100, 0, 0, 0]);
});

// La rete dei 2.500 ms dell'acqua (spec §3.13; D25, C22) salva una banda chiusa in vista
// solo se l'IntersectionObserver non ha deciso: richiusa sotto la linea con la banda in
// vista, resta chiusa anche quando le reti trattenute scattano.
test("Costi chiari: richiusa sotto la linea, la rete dei 2.500 ms non la riapre", async ({ page, goto }) => {
  await holdTimeouts(page, 2_500);
  await goto("/");
  await expect(page.locator(BANDA)).toHaveCount(1);
  await expect.poll(async () => insetValues(await clipOf(page.locator(BANDA))), { timeout: 10_000 }).toEqual([100, 0, 0, 0]);

  await placeEdge(page, BANDA, "top", 0.79);
  await page.waitForTimeout(2_000);
  expect(insetValues(await clipOf(page.locator(BANDA)))).toEqual([0, 0, 0, 0]);
  await placeEdge(page, BANDA, "top", 0.81);
  await page.waitForTimeout(1_000);
  expect(insetValues(await clipOf(page.locator(BANDA)))).toEqual([100, 0, 0, 0]);

  // Scattano le reti trattenute: quella della banda l'ha già tolta l'IntersectionObserver.
  await releaseTimeouts(page);
  await page.waitForTimeout(1_000); // una rete scattata avrebbe già aperto più del 90 % (expo.out)
  expect(insetValues(await clipOf(page.locator(BANDA))), "la rete ha riaperto una banda richiusa in vista").toEqual([100, 0, 0, 0]);
});

// ── Capitoli 13-16: i gesti in coda alla home (spec 2026-09-13 §3.14-3.17) ──
// A20 di Alberto: un gesto per capitolo, scrubbato e quindi speculare (C22).
// Si scorre con `scrollTo` istantaneo e si aspetta che lo scrub si assesti
// (1,2 s il più lento di questi quattro, 1,3 s Seguici).

async function vai(page: Page, y: number, attesa: number) {
  await page.evaluate((t) => window.scrollTo({ top: Math.max(0, t), behavior: "instant" }), y);
  await page.waitForTimeout(attesa);
}

/** Quota di layout (offsetTop, che i transform non toccano), altezza e viewport. */
function layout(page: Page, sel: string) {
  return page.locator(sel).first().evaluate((el) => {
    let y = 0;
    for (let n: HTMLElement | null = el as HTMLElement; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
    return { top: y, h: (el as HTMLElement).offsetHeight, vh: window.innerHeight, vw: window.innerWidth };
  });
}

test.describe("capitoli 13-16: i gesti in coda alla home", () => {
  test("la foto della testimonianza affonda dentro la cornice ferma", async ({ page, goto }) => {
    await goto("/");
    const frame = page.locator("main a[data-sink-frame]").first();
    const sink = frame.locator("[data-sink]");
    await expect(sink).toHaveCount(1);
    await frame.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const g = await layout(page, "main a[data-sink-frame]");

    // Bordo basso della cornice a metà viewport: progresso 0,5, dtAffonda 0,185.
    await vai(page, g.top + g.h - g.vh * 0.5, 1600);
    const meta = await matrixOf(sink);
    expect(meta.m42, "a metà corsa la foto non affonda").toBeGreaterThan(1);
    expect(meta.m42).toBeLessThanOrEqual(0.1 * g.h + 1);

    // Bordo basso al 5 % del viewport: progresso 0,95, dtAffonda 0,87.
    await vai(page, g.top + g.h - g.vh * 0.05, 1600);
    const fine = await matrixOf(sink);
    expect(fine.m42).toBeGreaterThan(0.08 * g.h - 1);
    expect(fine.m42).toBeLessThanOrEqual(0.1 * g.h + 1);

    // Il link non si muove: nessun transform su di lui né sugli antenati fino alla section.
    const mosso = await frame.evaluate((el) => {
      const out: string[] = [];
      for (let n: Element | null = el; n && n.tagName !== "SECTION"; n = n.parentElement) {
        if (getComputedStyle(n).transform !== "none") out.push(`${n.tagName}.${n.className}`);
      }
      return out;
    });
    expect(mosso).toEqual([]);
  });

  test("il titolo di Seguici si congeda crescendo e sfumando (A25)", async ({ page, goto }) => {
    await goto("/");
    const block = page.locator("[data-seguici-congedo]");
    await expect(block).toHaveCount(1);
    await block.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const g = await layout(page, "[data-seguici-congedo]");
    const start = g.top + g.h / 2 - g.vh / 2; // center center
    const end = g.top + g.h; // bottom top
    // Numeri, non la matrice: un DOMMatrixReadOnly non attraversa `evaluate`.
    const leggi = () =>
      block.evaluate((el) => {
        const t = getComputedStyle(el).transform;
        return {
          a: new DOMMatrixReadOnly(t === "none" ? undefined : t).a,
          o: Number(getComputedStyle(el).opacity),
        };
      });

    // Al centro del viewport: pieno.
    await vai(page, start - 2, 1800);
    const pieno = await leggi();
    expect(pieno.a).toBeCloseTo(1, 3);
    expect(pieno.o).toBeGreaterThan(0.99);

    // Progresso 0,9 dell'uscita: expo.in vale 0,503 → scala 1,060, opacità 0,497.
    // (A progresso 0,5 expo.in vale 0,023: la «metà uscita» di §3.15 si misura qui.)
    await vai(page, start + 0.9 * (end - start), 1800);
    const uscita = await leggi();
    expect(uscita.a).toBeGreaterThan(1.05);
    expect(uscita.o).toBeLessThan(0.7);
    const trabocca = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(trabocca).toBeLessThanOrEqual(1);

    // Rientrando dall'alto torna pieno: speculare per scrub.
    await vai(page, start - 2, 1800);
    const ritorno = await leggi();
    expect(ritorno.a).toBeCloseTo(1, 3);
    expect(ritorno.o).toBeGreaterThan(0.99);
  });

  test("il modulo dei contatti resta indietro da 1024 (D30)", async ({ page, goto, isMobile }) => {
    await goto("/");
    const col = page.locator("#contatti [data-lag-col]");
    await expect(col).toHaveCount(1);
    await col.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const g = await layout(page, "#contatti [data-lag-grid]");
    const centro = g.top + g.h / 2 - g.vh / 2;

    // In home la foto sta ferma accanto al modulo: nessun Reveal intorno (spec §3.17,
    // correzione bloccante 4 di homeC; D28). Vale a ogni larghezza.
    const foto = page.locator('#contatti img[src*="raffaela-keys"]').first();
    await expect(foto).toHaveCount(1);
    expect(await foto.evaluate((el) => !!el.closest(".reveal, [data-reveal]"))).toBe(false);

    await vai(page, centro, 1500);
    if (isMobile || g.vw < 1024) {
      expect(await col.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
      return;
    }
    const a = await matrixOf(col);
    expect(a.m42).toBeGreaterThanOrEqual(-40);
    expect(a.m42).toBeLessThanOrEqual(40);
    await vai(page, centro + 400, 1500);
    const b = await matrixOf(col);
    expect(b.m42).toBeGreaterThan(a.m42);
    await vai(page, centro + 800, 1500);
    const c = await matrixOf(col);
    expect(c.m42).toBeGreaterThan(b.m42);
    expect(c.m42).toBeLessThanOrEqual(40);
  });

  test("Tab su una tessera del team la porta in vista senza scrollLeft (§3.16)", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "la rotaia pilotata dallo scroll vive solo da 1024");
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width < 1024, "sotto i 1024 la rotaia è uno scorrimento nativo col dito");
    await goto("/");
    const rail = page.locator("#chi-siamo .dt-rail");
    await expect(rail).toHaveAttribute("data-on", "");
    const tiles = rail.locator(".dt-rail_track > figure");
    expect(await tiles.count()).toBeGreaterThanOrEqual(3);

    await tiles.nth(1).focus();
    await page.waitForTimeout(600);
    await page.keyboard.press("Tab");
    await expect(tiles.nth(2)).toBeFocused();
    await page.waitForTimeout(900);

    const r = await tiles.nth(2).evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { l: b.left, r: b.right, t: b.top, b: b.bottom, vw: window.innerWidth, vh: window.innerHeight };
    });
    expect(r.l, "la terza tessera esce a sinistra").toBeGreaterThanOrEqual(-1);
    expect(r.r, "la terza tessera esce a destra").toBeLessThanOrEqual(r.vw + 1);
    expect(r.t).toBeLessThan(r.vh);
    expect(r.b).toBeGreaterThan(0);
    expect(await rail.evaluate((el) => el.scrollLeft)).toBe(0);
  });

  test("un clic del mouse su una tessera del team non fa saltare la pagina (§3.16, :focus-visible)", async ({
    page,
    goto,
    isMobile,
  }) => {
    test.skip(!!isMobile, "la rotaia pilotata dallo scroll vive solo da 1024");
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width < 1024, "sotto i 1024 la rotaia è uno scorrimento nativo col dito");
    await goto("/");
    const rail = page.locator("#chi-siamo .dt-rail");
    await expect(rail).toHaveAttribute("data-on", "");

    // Il nastro a metà corsa: le stesse quote di layout di HorizontalRail parcheggiata.
    const q = await page.locator("#chi-siamo .dt-railway").evaluate((wrap) => {
      let y = 0;
      for (let n: HTMLElement | null = wrap as HTMLElement; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      const r = wrap.querySelector<HTMLElement>(".dt-rail")!;
      const top = Math.max(0, Math.round((window.innerHeight - r.offsetHeight) / 2));
      return { start: y - top, end: y + (wrap as HTMLElement).offsetHeight - (top + r.offsetHeight) };
    });
    await vai(page, (q.start + q.end) / 2, 1200);

    // La tessera intera in orizzontale più vicina al centro: il clic non chiede al
    // browser nessuno scroll-into-view.
    const tiles = rail.locator(".dt-rail_track > figure");
    const i = await tiles.evaluateAll((els) => {
      const vw = window.innerWidth;
      let best = -1;
      let dist = Number.POSITIVE_INFINITY;
      els.forEach((el, k) => {
        const b = el.getBoundingClientRect();
        const cy = b.top + b.height / 2;
        if (b.left < 0 || b.right > vw || cy < 0 || cy > window.innerHeight) return;
        const d = Math.abs(b.left + b.width / 2 - vw / 2);
        if (d < dist) {
          dist = d;
          best = k;
        }
      });
      return best;
    });
    expect(i, "a metà corsa nessuna tessera intera a schermo").toBeGreaterThanOrEqual(0);
    const tile = tiles.nth(i);
    const prima = await page.evaluate(() => window.scrollY);
    const box = (await tile.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(tile).toBeFocused();
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBe(prima);
  });
});

// ── Capitolo 17: la cartolina del Congedo e l'entrata alla Lusion (spec 2026-09-13 §3.18; A35) ──
// A19 e A20 di Alberto: da 1024 px e 640 px d'altezza con motion ok la banda è
// uno schermo sticky di 100svh; il video si ritira in inset(8% 22%) e il footer
// sale da sotto crescendo da 0,75 a 1. A35 e A42 (19-20 set.): davanti alla
// cartolina sta l'entrata — il video parte nello slot 16:9 a destra del titolo
// e cresce fino allo schermo intero, lineare su 100svh, cominciando 65svh prima
// dell'aggancio dello sticky; pianerottolo 20svh; corridoio 135svh. La testa
// (h2 e comando) sta in flusso sopra lo schermo, inchiostro su crema (D108,
// D111). Sotto la soglia la banda non è sticky, nessuna entrata, e si ritira in
// inset(4% 10%) a 390 (D29).

const CARTOLINA = '[data-corridor="cartolina"]';
/** Le cifre di lastra.ts: corsa 100svh, anticipo 0,65, pianerottolo 20svh. */
const CORSA = 1.0;
const ANTICIPO = 0.65;
const PIAN = 0.2;

/** Quote di layout (offsetTop) della cartolina e del footer, e le quote della timeline. */
function quoteCartolina(page: Page) {
  return page
    .evaluate((sel) => {
      const quota = (el: HTMLElement) => {
        let y = 0;
        for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
        return y;
      };
      const sec = document.querySelector<HTMLElement>(sel)!;
      const screen = sec.querySelector<HTMLElement>("[data-corridor-screen]")!;
      const testa = sec.querySelector<HTMLElement>(".dt-postcard_testa")!;
      const foot = document.querySelector<HTMLElement>("footer[data-postcard-foot]")!;
      // La quota dello schermo è section + testa in flusso, MAI offsetTop dello sticky:
      // quando è agganciato Chromium ne riporta la posizione spostata (trappola di A35).
      const secTop = quota(sec);
      return {
        secTop,
        screenTop: secTop + testa.offsetHeight,
        screenH: screen.offsetHeight,
        footTop: quota(foot),
        vh: window.innerHeight,
      };
    }, CARTOLINA)
    .then((q) => ({
      ...q,
      /** La quota zero dell'entrata: 31,5svh prima dell'aggancio dello schermo. */
      start: q.screenTop - ANTICIPO * CORSA * q.vh,
      /** Dove comincia la cartolina: dopo 90svh di entrata e 20svh di pianerottolo. */
      cartStart: q.screenTop + (CORSA - ANTICIPO * CORSA + PIAN) * q.vh,
    }));
}
/** Lo scroll a cui l'entrata sta a progresso e. */
const aE = (q: { start: number; vh: number }, e: number) => Math.round(q.start + e * CORSA * q.vh);

/** La testa sta in flusso sopra lo schermo, col comando sotto il titolo (D108, D111): niente lettere sulla fotografia. */
async function testaSopra(page: Page, etichetta: string) {
  const g = await page.evaluate((sel) => {
    const sec = document.querySelector<HTMLElement>(sel)!;
    const screen = sec.querySelector<HTMLElement>("[data-corridor-screen]")!;
    const banda = screen;
    const fascia = sec.querySelector<HTMLElement>(".dt-postcard_testa")!;
    const h2 = document.getElementById("congedo-title")!;
    const a = fascia.querySelector("a.dt-btn")!;
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim();
    const probe = document.createElement("span");
    probe.style.color = ink;
    document.body.appendChild(probe);
    const inkRgb = getComputedStyle(probe).color;
    probe.remove();
    return {
      h2NelloSchermo: screen.contains(h2),
      h2PrimaDelloSchermo: !!(h2.compareDocumentPosition(screen) & Node.DOCUMENT_POSITION_FOLLOWING),
      ctaNellaFascia: fascia.contains(a) && !screen.contains(a),
      fasciaDopoLaBanda: !!(fascia.compareDocumentPosition(banda) & Node.DOCUMENT_POSITION_FOLLOWING),
      letteSullaFoto: !!banda.querySelector("h1, h2, h3, p, a, button"),
      h2Color: getComputedStyle(h2).color,
      inkRgb,
      ombra: getComputedStyle(h2).textShadow,
    };
  }, CARTOLINA);
  expect(g.h2NelloSchermo, `${etichetta}: l'h2 sta dentro lo schermo sticky`).toBe(false);
  expect(g.h2PrimaDelloSchermo, `${etichetta}: l'h2 non precede lo schermo`).toBe(true);
  expect(g.ctaNellaFascia, `${etichetta}: il comando non sta nella testa`).toBe(true);
  expect(g.fasciaDopoLaBanda, `${etichetta}: la testa non precede lo schermo`).toBe(true);
  expect(g.letteSullaFoto, `${etichetta}: testo o comandi sopra la fotografia (D108, D111)`).toBe(false);
  expect(g.h2Color, `${etichetta}: l'h2 non è inchiostro`).toBe(g.inkRgb);
  expect(g.ombra, `${etichetta}: ombra sul titolo su crema`).toBe("none");
}

async function apriCartolina(page: Page) {
  const sec = page.locator(CARTOLINA);
  await expect(sec).toHaveAttribute("data-on", "");
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  return quoteCartolina(page);
}

test.describe("capitolo 17: la cartolina del Congedo", () => {
  test("la banda si ritira in cartolina e il footer sale", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "lo schermo sticky vive da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    const sec = page.locator(CARTOLINA);
    const clip = sec.locator("[data-postcard-clip]");

    // A 0,4vh dentro la cartolina lo schermo sta a top 0 e la finestra si sta chiudendo.
    await vai(page, q.cartStart + q.vh * 0.4, 1200);
    const top = await sec.locator(":scope > [data-corridor-screen]").evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThanOrEqual(1);
    const meta = insetValues(await clipOf(clip));
    expect(meta, "a metà corsa il clip-path non è un inset").not.toBeNull();
    expect(meta![0]).toBeGreaterThan(0);
    expect(meta![0]).toBeLessThan(8);

    // Col footer al 40 % la cartolina è ferma a inset(8% 22% 8% 22%).
    await vai(page, q.footTop - q.vh * 0.4, 1500);
    const fine = insetValues(await clipOf(clip))!;
    [8, 22, 8, 22].forEach((v, i) => expect(Math.abs(fine[i] - v), `lato ${i}`).toBeLessThanOrEqual(0.2));
    const foot = page.locator("footer[data-postcard-foot]");
    expect(await foot.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    expect((await matrixOf(foot)).a).toBeCloseTo(1, 3);
  });

  // Spec §3.18: il bordo basso della finestra arriva a 8 % in 0→0,54, prima che il
  // footer entri (0,545). A 1440×900 il footer sta 8svh sopra il fondo della banda
  // e la finestra finisce 8 % sopra il fondo: bordo del footer e bordo della
  // finestra coincidono, e il footer non sale mai sul video.
  test("il bordo basso della finestra chiude prima: il footer non copre mai il video", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "lo schermo sticky vive da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    const clip = page.locator(`${CARTOLINA} [data-postcard-clip]`);
    // Progresso p della cartolina: dal suo inizio (dopo entrata e pianerottolo, A35) a «clamp(top 40%)» del footer.
    const fine = q.footTop - q.vh * 0.4;
    for (const p of [0.55, 0.6, 0.7, 0.8, 0.9, 1]) {
      await vai(page, q.cartStart + p * (fine - q.cartStart), 1500);
      const b = insetValues(await clipOf(clip))?.[2] ?? 0;
      const r = await page.evaluate((sel) => {
        const s = document.querySelector(`${sel} > [data-corridor-screen]`)!.getBoundingClientRect();
        const f = document.querySelector("footer[data-postcard-foot]")!.getBoundingClientRect();
        return { sb: s.bottom, sh: s.height, ft: f.top };
      }, CARTOLINA);
      expect(r.ft, `a progresso ${p} il footer sale sopra il bordo basso della finestra`).toBeGreaterThanOrEqual(
        r.sb - (r.sh * b) / 100 - 1,
      );
    }
  });

  // A42: il comando sta nella testa, sotto il titolo; la miniatura a destra non lo copre mai
  // (né prima del via né a e 0, quando il foglio comincia a crescere).
  test("la CTA del Congedo resta cliccabile prima del via e a e 0", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "lo schermo sticky vive da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    for (const y of [q.start - 300, q.start]) {
      await vai(page, y, 1200);
      const colpita = await page.evaluate((sel) => {
        const a = document.querySelector<HTMLElement>(`${sel} .dt-postcard_testa a.dt-btn`)!;
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!hit && (hit === a || a.contains(hit));
      }, CARTOLINA);
      expect(colpita, `CTA coperta a scrollY ${Math.round(y)}`).toBe(true);
    }
  });

  for (const [w, h] of [
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ] as const) {
    test(`la testa sta in flusso sopra lo schermo e il comando nella fascia, in it e de, a ${w}×${h} (D108, D111)`, async ({ page, goto, isMobile }) => {
      test.skip(!!isMobile, "i viewport desktop si impostano dentro il test");
      await page.setViewportSize({ width: w, height: h });
      for (const loc of ["it", "de"]) {
        await page.context().addCookies([{ name: "dt_locale", value: loc, domain: "127.0.0.1", path: "/" }]);
        await goto("/");
        const q = await apriCartolina(page);
        await vai(page, q.start, 1200);
        await testaSopra(page, `${loc} a ${w}×${h}`);
        // A e 0 la testa è tutta a schermo: il titolo a sinistra, la miniatura a destra sulla stessa riga (A42).
        const g = await page.evaluate((sel) => {
          const h2 = document.getElementById("congedo-title")!.getBoundingClientRect();
          const m = document.querySelector(`${sel} [data-bg="foto"]`)!.getBoundingClientRect();
          const slot = document.querySelector(`${sel} .dt-postcard_slot`)!.getBoundingClientRect();
          const testo = document.querySelector(`${sel} .dt-postcard_testo`)!.getBoundingClientRect();
          return { h2Bottom: h2.bottom, h2Top: h2.top, h2Right: h2.right, testo: { t: testo.top, b: testo.bottom }, m: { l: m.left, t: m.top, w: m.width, h: m.height, b: m.bottom }, slot: { l: slot.left, t: slot.top, w: slot.width, h: slot.height }, vh: window.innerHeight };
        }, CARTOLINA);
        expect(g.h2Top, `${loc} a ${w}×${h}: a e 0 il titolo è tagliato sopra`).toBeGreaterThanOrEqual(-1);
        expect(g.h2Bottom, `${loc} a ${w}×${h}: a e 0 il titolo esce sotto`).toBeLessThanOrEqual(g.vh + 1);
        expect(g.m.l, `${loc} a ${w}×${h}: la miniatura non sta a destra del titolo`).toBeGreaterThanOrEqual(g.h2Right - 1);
        // La miniatura è centrata sulla colonna del testo (titolo + comando): dentro quella riga.
        expect(g.m.t, `${loc} a ${w}×${h}: la miniatura non sta sulla riga del titolo`).toBeGreaterThanOrEqual(g.testo.t - 1);
        expect(g.m.b, `${loc} a ${w}×${h}: la miniatura scende sotto la colonna del testo`).toBeLessThanOrEqual(g.testo.b + 1);
        for (const lato of ["l", "t", "w", "h"] as const) expect(Math.abs(g.m[lato] - g.slot[lato]), `${loc} a ${w}×${h}: a e 0 il foglio non sta nello slot (${lato})`).toBeLessThanOrEqual(1);
      }
    });
  }

  test("gli antenati dello schermo sticky non trasformano né ritagliano", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "lo schermo sticky vive da 1024");
    await goto("/");
    await apriCartolina(page);
    const colpevoli = await page.evaluate((sel) => {
      const out: string[] = [];
      for (let n = document.querySelector<HTMLElement>(sel); n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.transform !== "none") out.push(`${n.tagName} transform ${s.transform}`);
        if (/hidden|auto|scroll/.test(s.overflowY)) out.push(`${n.tagName} overflow-y ${s.overflowY}`);
      }
      return out;
    }, CARTOLINA);
    expect(colpevoli).toEqual([]);
  });

  test("un clic del mouse su un link del footer non fa saltare la pagina", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "lo schermo sticky vive da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    await vai(page, q.footTop - q.vh * 0.6, 1500);
    const tel = page.locator('footer[data-postcard-foot] a[href^="tel:"]').first();
    await tel.evaluate((el) =>
      el.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          (window as unknown as { __telClic?: boolean }).__telClic = true;
        },
        { once: true },
      ),
    );
    const prima = await page.evaluate(() => window.scrollY);
    const box = (await tel.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => window.scrollY)).toBe(prima);
    expect(await page.evaluate(() => (window as unknown as { __telClic?: boolean }).__telClic)).toBe(true);
  });

  test("Tab dalla CTA al primo link del footer lo porta a opacità 1 entro 1 s", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "lo schermo sticky vive da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    await vai(page, q.footTop - q.vh * 0.9, 1500);
    const foot = page.locator("footer[data-postcard-foot]");
    expect(Number(await foot.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(1);
    await page.locator(`${CARTOLINA} .dt-postcard_testa a.dt-btn`).focus();
    await page.keyboard.press("Tab");
    await expect(foot.locator("a, button").first()).toBeFocused();
    await expect
      .poll(() => foot.evaluate((el) => getComputedStyle(el).opacity), { timeout: 1000 })
      .toBe("1");
  });

  // Spec §3.18: un footer a schermo non passa mai a meno visibile. Alla ricarica
  // il Preloader riporta la pagina al capitolo dopo il primo refresh (D22), e il
  // Congedo decide lo stato armato sulla quota d'arrivo.
  test("ricaricando col footer al 60 % il footer non si abbassa mai (D22)", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "il ripristino al capitolo vive coi corridoi, da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    await vai(page, q.footTop - q.vh * 0.6, 1500);
    type Campione = { t: number; o: number; top: number; vh: number };
    // Il campionatore parte con la pagina ricaricata, prima dei suoi script: un valore per fotogramma.
    await page.addInitScript(() => {
      const w = window as unknown as { __foot: Campione[] };
      w.__foot = [];
      const t0 = performance.now();
      const tick = () => {
        const f = document.querySelector<HTMLElement>("footer[data-postcard-foot]");
        if (f) {
          w.__foot.push({
            t: performance.now() - t0,
            o: Number(getComputedStyle(f).opacity),
            top: f.getBoundingClientRect().top,
            vh: window.innerHeight,
          });
        }
        if (performance.now() - t0 < 6000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(1500);
    const s = await page.evaluate(() => (window as unknown as { __foot: Campione[] }).__foot);
    const aSchermo = s.filter((x) => x.top < x.vh);
    expect(aSchermo.length, "dopo la ricarica il footer non è tornato a schermo").toBeGreaterThan(30);
    for (let i = 1; i < aSchermo.length; i++) {
      expect(aSchermo[i].o, `a ${Math.round(aSchermo[i].t)} ms l'opacità del footer scende`).toBeGreaterThanOrEqual(
        aSchermo[i - 1].o - 0.001,
      );
    }
    const pieno = aSchermo.find((x) => x.o >= 0.999);
    expect(pieno, "il footer a schermo non arriva a opacità 1").toBeDefined();
    expect(pieno!.t - aSchermo[0].t).toBeLessThanOrEqual(150);
  });

  // Spec §3.18: stato armato e tween del footer stanno nel contesto locale del
  // Congedo, che si reverte al cambio di MQ.motionOk.
  test("uscendo sopra il capitolo e rientrando il gesto resta; con reduced motion il footer torna pieno e fermo", async ({
    page,
    goto,
    isMobile,
  }) => {
    test.skip(!!isMobile, "lo schermo sticky vive da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    const foot = page.locator("footer[data-postcard-foot]");
    const opacita = async () => Number(await foot.evaluate((el) => getComputedStyle(el).opacity));
    await vai(page, q.footTop - q.vh * 0.9, 1500);
    expect(await opacita()).toBeLessThan(1);
    await vai(page, q.secTop - q.vh, 1500);
    await vai(page, q.footTop - q.vh * 0.9, 1500);
    expect(await opacita(), "rientrando il footer non è più armato").toBeLessThan(1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(600);
    const st = await foot.evaluate((el) => ({
      t: getComputedStyle(el).transform,
      o: getComputedStyle(el).opacity,
      inline: el.getAttribute("style") ?? "",
    }));
    expect(st.t).toBe("none");
    expect(st.o).toBe("1");
    expect(st.inline).not.toMatch(/opacity|matrix|scale|translate/);
  });

  // ── L'entrata alla Lusion (A35, A42; qualita/a35/direttive-video-entrata.md) ──
  // Chromium headless ha SwiftShader: il cancello del renderer sceglie la via `scala`
  // (il ritaglio DOM riceve translate + scale, nessun canvas). Con una GPU
  // (`--use-angle=d3d11`) la via è `gl`: il canvas disegna e il ritaglio è nascosto
  // finché il foglio non è disteso. Il test accetta le due vie e ne prova la propria.
  test("l'entrata: chiusa prima della quota zero, piega a metà, distesa dopo 100svh a schermo intero; il foglio si richiude risalendo", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "l'entrata vive coi corridoi, da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    const sec = page.locator(CARTOLINA);
    const stato = () =>
      page.evaluate((sel) => {
        const s = document.querySelector<HTMLElement>(sel)!;
        const clip = s.querySelector<HTMLElement>("[data-postcard-clip]")!;
        const marker = s.querySelector<HTMLElement>('[data-bg="foto"]')!;
        const canvas = s.querySelector<HTMLCanvasElement>("canvas.dt-lastra");
        const b = marker.getBoundingClientRect();
        const sl = s.querySelector(".dt-postcard_slot")!.getBoundingClientRect();
        return {
          slot: { l: sl.left, t: sl.top, w: sl.width, h: sl.height },
          entrata: s.getAttribute("data-entrata"),
          via: s.getAttribute("data-entrata-via"),
          clipT: clip.style.transform,
          clipVis: getComputedStyle(clip).visibility,
          canvas: canvas ? getComputedStyle(canvas).visibility : null,
          foglio: marker.hasAttribute("data-foglio"),
          marker: { l: b.left, t: b.top, w: b.width, h: b.height },
          vw: window.innerWidth,
        };
      }, CARTOLINA);

    await vai(page, q.start - 40, 1500);
    let g = await stato();
    expect(g.entrata).toBe("chiusa");
    expect(["gl", "scala"]).toContain(g.via);
    // La miniatura sta nello slot: 16:9 largo min(42vw, 640px), a filo del margine destro (8vw).
    expect(Math.abs(g.marker.l - g.slot.l)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.marker.t - g.slot.t)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.marker.w - Math.min(0.42 * g.vw, 640))).toBeLessThanOrEqual(1);
    expect(Math.abs(g.marker.h - (g.marker.w * 9) / 16)).toBeLessThanOrEqual(1);
    expect(Math.abs(g.slot.l + g.slot.w - 0.92 * g.vw)).toBeLessThanOrEqual(1);
    expect(g.foglio).toBe(true);
    if (g.via === "scala") expect(g.clipT).toMatch(/^translate\([^)]+\) scale\(0\.[0-9]+\)$/);
    else {
      expect(g.canvas).toBe("visible");
      expect(g.clipVis).toBe("hidden");
    }

    await vai(page, aE(q, 0.5), 1500);
    g = await stato();
    expect(g.entrata).toBe("piega");
    expect(g.foglio).toBe(true);
    if (g.via === "scala") {
      const s = Number(/scale\(([0-9.]+)\)/.exec(g.clipT)?.[1]);
      expect(s).toBeGreaterThan(0.5);
      expect(s).toBeLessThan(1);
    } else expect(g.clipVis).toBe("hidden");

    await vai(page, aE(q, 1) + 40, 1500);
    g = await stato();
    expect(g.entrata).toBe("distesa");
    expect(g.clipT).toBe("");
    expect(g.clipVis).toBe("visible");
    expect(g.foglio).toBe(false);
    if (g.via === "gl") expect(g.canvas).toBe("hidden");
    // A foglio disteso il ritaglio è lo schermo intero, al pixel: tutto il viewport.
    const pari = await sec.evaluate((s) => {
      const c = s.querySelector("[data-postcard-clip]")!.getBoundingClientRect();
      return Math.max(Math.abs(c.left), Math.abs(c.top), Math.abs(c.width - window.innerWidth), Math.abs(c.height - window.innerHeight));
    });
    expect(pari).toBeLessThanOrEqual(0.5);

    // Risalendo in cima al corridoio il foglio si richiude nella miniatura.
    await vai(page, q.start - 40, 1500);
    g = await stato();
    expect(g.entrata).toBe("chiusa");
    expect(Math.abs(g.marker.w - Math.min(0.42 * g.vw, 640))).toBeLessThanOrEqual(1);
  });

  test("a schermo agganciato l'entrata è già a 0,65: il foglio è più largo dello slot e la testa è scorsa via", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "l'entrata vive coi corridoi, da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    await vai(page, q.screenTop, 1500);
    const g = await page.evaluate((sel) => {
      const s = document.querySelector<HTMLElement>(sel)!;
      const screen = s.querySelector("[data-corridor-screen]")!.getBoundingClientRect();
      const m = s.querySelector('[data-bg="foto"]')!.getBoundingClientRect();
      const h2 = document.getElementById("congedo-title")!.getBoundingClientRect();
      return { entrata: s.getAttribute("data-entrata"), screenTop: screen.top, mw: m.width, h2Bottom: h2.bottom, vw: window.innerWidth };
    }, CARTOLINA);
    expect(Math.abs(g.screenTop)).toBeLessThanOrEqual(1);
    expect(g.entrata).toBe("piega");
    expect(g.mw).toBeGreaterThan(Math.min(0.42 * g.vw, 640) + 20);
    expect(g.h2Bottom).toBeLessThanOrEqual(1);
  });

  test("il marcatore data-bg segue il foglio in entrata e torna all'inset della cartolina (A21, A35)", async ({ page, goto, isMobile }) => {
    test.skip(!!isMobile, "l'entrata vive coi corridoi, da 1024");
    await goto("/");
    const q = await apriCartolina(page);
    const marker = page.locator(`${CARTOLINA} [data-bg="foto"]`);
    await vai(page, aE(q, 0.5), 1500);
    expect(await marker.getAttribute("data-foglio")).not.toBeNull();
    expect(await marker.evaluate((el) => (el as HTMLElement).style.inset)).toBe("");
    expect(await marker.evaluate((el) => (el as HTMLElement).style.transform)).toMatch(/^translate\(.+\) scale\(.+\)$/);
    await vai(page, q.footTop - q.vh * 0.4, 1500);
    expect(await marker.getAttribute("data-foglio")).toBeNull();
    expect(await marker.evaluate((el) => (el as HTMLElement).style.transform)).toBe("");
    expect(await marker.evaluate((el) => (el as HTMLElement).style.inset)).toBe("8% 22%");
  });

  test("sul telefono la banda non è sticky e si ritira in inset(4% 10%)", async ({ page, goto, isMobile }) => {
    test.skip(!isMobile, "ramo del telefono: progetto mobile-390");
    const video: string[] = [];
    page.on("request", (r) => {
      if (/\.(mp4|webm)(\?|$)/i.test(r.url())) video.push(r.url());
    });
    await goto("/");
    const sec = page.locator(CARTOLINA);
    expect(await sec.getAttribute("data-on")).toBeNull();
    await sec.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    expect(await sec.locator(":scope > [data-corridor-screen]").evaluate((el) => getComputedStyle(el).position)).toBe(
      "relative",
    );
    const q = await quoteCartolina(page);
    // Fine del ramo del telefono: bordo basso della banda al 30 % del viewport.
    await vai(page, q.screenTop + q.screenH - q.vh * 0.3, 1500);
    const fine = insetValues(await clipOf(sec.locator("[data-postcard-clip]")))!;
    [4, 10, 4, 10].forEach((v, i) => expect(Math.abs(fine[i] - v), `lato ${i}`).toBeLessThanOrEqual(0.2));
    await testaSopra(page, "390");
    // Nessuna entrata sotto la soglia: né attributi né canvas né transform sul ritaglio.
    const niente = await page.evaluate((sel) => {
      const s = document.querySelector<HTMLElement>(sel)!;
      return { entrata: s.getAttribute("data-entrata"), canvas: !!s.querySelector("canvas"), t: s.querySelector<HTMLElement>("[data-postcard-clip]")!.style.transform };
    }, CARTOLINA);
    expect(niente).toEqual({ entrata: null, canvas: false, t: "" });
    expect(await page.locator("footer[data-postcard-foot]").evaluate((el) => getComputedStyle(el).marginTop)).toBe("0px");
    expect(video, `richieste video a 390: ${video.join(", ")}`).toEqual([]);
  });
});
