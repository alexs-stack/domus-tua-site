import { test, expect, setConsent } from "./helpers";

// Quando qualcosa non c'è o si rompe. Il metro è sempre lo stesso: la persona deve capire
// cosa è successo e avere un modo per andare avanti.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

test("una pagina inesistente risponde 404 e offre una via d'uscita", async ({ page }) => {
  const response = await page.goto("/questa-pagina-non-esiste-mai", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Non un vicolo cieco: si torna alla home e agli immobili.
  await expect(page.getByRole("link", { name: /home|torna|inizio/i }).first()).toBeVisible();

  await page.getByRole("link", { name: /home|torna|inizio/i }).first().click();
  await expect(page).toHaveURL(/\/$/);
});

test("un immobile inesistente non finge di esistere", async ({ page }) => {
  const response = await page.goto("/case/immobile-che-non-esiste-1234", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("il 404 mantiene intestazione e piè di pagina @layout", async ({ page }) => {
  await page.goto("/pagina-inventata", { waitUntil: "domcontentloaded" });
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.locator("footer")).toBeAttached();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("se un'API cade, la pagina resta in piedi", async ({ page, goto, guards }) => {
  // La ricerca AI e l'assistente possono fallire: il sito non deve andare in errore.
  await page.route("**/api/search", (route) => route.fulfill({ status: 500, body: "boom" }));
  await page.route("**/api/assistant", (route) => route.fulfill({ status: 500, body: "boom" }));

  await goto("/acquista");
  const input = page.getByRole("textbox", { name: /descrivi la casa/i }).first();
  await input.fill("villa a Tradate sotto 300000");
  await input.press("Enter");

  // I filtri manuali continuano a funzionare: la ricerca deterministica non passa dall'API.
  await expect(page.locator('#main a[href^="/case/"]').first()).toBeVisible({ timeout: 20_000 });
  // Nessuna eccezione non gestita finita in pagina.
  expect(guards.consoleErrors.filter((e) => /uncaught|is not a function/i.test(e))).toEqual([]);
});

test("l'endpoint dei lead rifiutato non blocca la navigazione", async ({ page, goto }) => {
  await page.route("**/api/lead", (route) => route.abort("failed"));
  await goto("/contatti");
  await page.getByRole("textbox", { name: /nome e cognome/i }).first().fill("Mario Rossi");
  // Telefono ed email sono ora campi distinti (ne basta uno): si usa l'email.
  await page.getByRole("textbox", { name: /^email$/i }).first().fill("mario@example.com");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /invia|richiedi|valuta|trova|scopri/i }).first().click();

  // Si può comunque continuare a navigare: il piè di pagina è sempre raggiungibile, a ogni
  // larghezza, e non dipende da un pannello aperto.
  // Il piè di pagina è fisso e resta coperto dal contenuto finché non si arriva in fondo: il
  // sito stesso lo scopre quando il focus ci entra (lo fa per il focus ring, WCAG 2.4.7). Il
  // test usa quella stessa strada, invece di inventarsi uno scroll.
  const link = page.locator("footer").getByRole("link", { name: "Vendi", exact: true }).first();
  await link.focus();
  await page.waitForTimeout(700);
  await link.click();
  await expect(page).toHaveURL(/\/vendi/);
});
