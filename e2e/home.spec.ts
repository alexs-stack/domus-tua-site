import { test, expect, setConsent, clickUntil } from "./helpers";

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
    // Da desktop la barra è piatta: tutte le voci sono raggiungibili senza aprire nulla.
    const nav = page.locator("header").first();
    for (const label of [
      "Vendi",
      "Acquista",
      "Metodo Domus",
      "Servizi",
      "Open Domus",
      "Recensioni",
      "Chi siamo",
      "Contatti",
    ]) {
      await expect(nav.getByRole("link", { name: label, exact: true }).first()).toBeVisible();
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
// Il documento le trovava dentro gli attributi. Oggi sono TESTO VISIBILE nelle tessere del
// muro delle voci, e questo test serve a tenercele. Il presidio che c'era controllava i
// titoli come DATO (app/lib/__tests__/content-integrity.test.ts): passa verde anche se
// nessuno li rende. Qui si guarda lo schermo.
test("le didascalie dei video sono testo visibile, non attributi @layout", async ({ page, goto }) => {
  await goto("/");
  // Il muro delle voci sta in fondo alla home: lo si raggiunge con lo scroller del sito.
  await page.evaluate(() => {
    const w = window as unknown as { __lenis?: { scrollTo: (t: number, o?: unknown) => void } };
    const fondo = document.documentElement.scrollHeight;
    if (w.__lenis) w.__lenis.scrollTo(fondo, { immediate: true });
    else window.scrollTo(0, fondo);
  });
  await page.waitForTimeout(800);

  // Almeno tre delle sei: il muro ne mostra un sottoinsieme a seconda della larghezza, e
  // pretenderle tutte e sei renderebbe il test una guardia sul layout invece che sul testo.
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
  const misura = async (t: string) => {
    const box = await page.getByText(t, { exact: false }).first().boundingBox().catch(() => null);
    return !!box && box.width >= 60 && box.height >= 10;
  };
  let viste = 0;
  for (const t of attese) if (await misura(t)) viste += 1;
  expect(viste, `didascalie LEGGIBILI nel muro delle voci: ${viste}/6`).toBeGreaterThanOrEqual(3);
});
