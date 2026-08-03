import { test, expect, setConsent, firstListingLink } from "./helpers";

// Ricerca immobili: la frase in linguaggio naturale, i filtri, il caso "non c'è niente" e la
// regola che vale su tutto — un venduto non compare mai fra ciò che si può comprare.
//
// Nessun test conosce uno slug: si parte sempre da quello che la pagina mostra. Così la suite
// non si rompe il giorno in cui il portafoglio dell'agenzia cambia.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

/** Il campo della ricerca in linguaggio naturale. */
const nlInput = (page: import("@playwright/test").Page) =>
  page.getByRole("textbox", { name: /descrivi la casa/i }).first();

test("la ricerca in linguaggio naturale filtra i risultati", async ({ page, goto, guards }) => {
  await goto("/acquista");

  const input = nlInput(page);
  await expect(input).toBeVisible();
  await input.fill("villa a Tradate sotto 300000");
  await input.press("Enter");

  // La ricerca AI può non essere configurata: in quel caso il parser locale fa lo stesso lavoro
  // e il risultato deve comunque arrivare. Quello che NON deve succedere è restare appesi.
  const results = page.locator('#main a[href^="/case/"]').first();
  const empty = page.getByText(/non c.è online|non c.è nulla|potrebbe arrivare/i).first();
  await expect(results.or(empty)).toBeVisible({ timeout: 20_000 });

  expect(guards.consoleErrors, guards.consoleErrors.join("\n")).toEqual([]);
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("il filtro comune restringe davvero l'elenco", async ({ page, goto }) => {
  await goto("/acquista");

  const select = page.getByRole("combobox").first();
  await expect(select).toBeVisible();
  const options = await select.locator("option").allTextContents();
  const comune = options.find((o) => !/tutti/i.test(o));
  test.skip(!comune, "nessun comune nella tendina: portafoglio vuoto");

  const before = await page.locator('a[href^="/case/"]').count();
  await select.selectOption({ label: comune! });
  await expect
    .poll(async () => page.locator('a[href^="/case/"]').count(), { timeout: 10_000 })
    .toBeLessThanOrEqual(before);

  // Verifica sul risultato, non sul markup della card: si apre il primo immobile rimasto e la
  // sua scheda deve parlare del comune scelto.
  const remaining = await page.locator('a[href^="/case/"]').count();
  test.skip(remaining === 0, "il comune scelto non ha immobili");
  await firstListingLink(page).click();
  await expect(page).toHaveURL(/\/case\//);
  await expect(page.locator("#main")).toContainText(new RegExp(comune!.split(" ")[0], "i"));
});

test("una ricerca senza risposte lo dice, e non lascia in un vicolo cieco", async ({ page, goto }) => {
  // I filtri si possono impostare dall'URL (è così che ci arriva chi clicca dalla home): qui
  // se ne sceglie una combinazione che il portafoglio non può soddisfare. Deterministico,
  // qualunque siano gli immobili del giorno.
  await goto("/acquista?type=Terreno");

  await expect(page.getByText(/potrebbe arrivare|non c.è online/i).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: /lasciaci la tua richiesta/i }).first()).toBeVisible();
  expect(await page.locator('#main a[href^="/case/"]').count()).toBe(0);

  // E si torna indietro: togliendo il filtro gli immobili ricompaiono.
  await goto("/acquista");
  await expect(firstListingLink(page)).toBeVisible();
});

test("gli immobili venduti non compaiono fra quelli in vendita", async ({ page, goto }) => {
  await goto("/acquista");
  await expect(firstListingLink(page)).toBeVisible();

  // Nessuna scheda della vetrina può essere marcata come venduta.
  const soldBadges = page.locator('a[href^="/case/"]').getByText(/^venduto$/i);
  expect(await soldBadges.count()).toBe(0);
});

test("il vecchio indice /case porta al catalogo su /acquista", async ({ page, goto }) => {
  // La pagina /case non esiste più: il redirect permanente deve conservare i query param,
  // così i vecchi link con i filtri continuano a funzionare. Si verifica con un filtro
  // che il portafoglio non può soddisfare: se l'empty state compare, il parametro è
  // arrivato DAVVERO a PropertySearch attraverso il redirect, non solo nell'URL.
  await goto("/case?type=Terreno");
  await expect(page).toHaveURL(/\/acquista\?type=Terreno/);
  await expect(page.getByText(/potrebbe arrivare|non c.è online/i).first()).toBeVisible({ timeout: 20_000 });

  // E il /case nudo porta semplicemente al catalogo pieno.
  await goto("/case");
  await expect(page).toHaveURL(/\/acquista/);
  await expect(firstListingLink(page)).toBeVisible();
});

test("la griglia degli immobili sta nella pagina @layout", async ({ page, goto }) => {
  await goto("/acquista");
  await expect(firstListingLink(page)).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
