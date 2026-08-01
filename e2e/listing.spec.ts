import { test, expect, setConsent, firstListingLink } from "./helpers";

// Scheda immobile e lightbox. Nessun test conosce uno slug: si apre sempre il primo immobile
// che la griglia mostra.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

async function openFirstListing(page: import("@playwright/test").Page, goto: (p: string) => Promise<void>) {
  await goto("/case");
  const link = firstListingLink(page);
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  await link.click();
  await expect(page).toHaveURL(new RegExp(href!.replace(/[/]/g, "\\/")));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  return href!;
}

test("dalla griglia si apre la scheda dell'immobile @layout", async ({ page, goto, guards }) => {
  await openFirstListing(page, goto);

  // Le informazioni portanti ci sono: prezzo, caratteristiche, contatto.
  await expect(page.locator("#main")).toContainText(/€|mese/);
  await expect(page.getByRole("link", { name: /whatsapp/i }).first()).toBeAttached();

  expect(guards.consoleErrors, guards.consoleErrors.join("\n")).toEqual([]);
  expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
});

test("la scheda dichiara ciò che non sa, invece di inventarlo", async ({ page, goto }) => {
  await openFirstListing(page, goto);
  const text = (await page.locator("#main").textContent()) ?? "";
  // Se un dato manca, la scheda lo dice: mai un "no" al posto di un "non lo sappiamo".
  if (/informazione non disponibile/i.test(text)) {
    await expect(page.getByText(/informazione non disponibile/i).first()).toBeVisible();
  }
  // Un immobile aperto dalla vetrina non può essere venduto.
  expect(text).not.toMatch(/^venduto$/im);
});

test("il lightbox si apre, naviga e si chiude con la tastiera", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "tastiera: si verifica sui viewport desktop");
  await openFirstListing(page, goto);

  const opener = page.getByRole("button", { name: /apri la foto \d+ a schermo intero/i }).first();
  test.skip((await opener.count()) === 0, "questo immobile non ha galleria");
  await opener.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/immagine \d+ di \d+/i);

  // Frecce: il contatore cambia (se c'è più di una foto).
  const counter = dialog.getByText(/immagine \d+ di \d+/i).first();
  const before = await counter.textContent();
  await page.keyboard.press("ArrowRight");
  const total = Number((before ?? "").match(/di (\d+)/)?.[1] ?? "1");
  if (total > 1) await expect(counter).not.toHaveText(before!);

  // Il focus resta dentro il dialog. Si aspetta che ci sia entrato: al primo istante dopo
  // l'apertura può essere ancora sul bottone che l'ha aperto.
  await expect.poll(() => dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  // Il focus torna alla foto da cui si era partiti.
  await expect(opener).toBeFocused();
});

test("il lightbox occupa lo schermo senza traboccare @layout", async ({ page, goto }) => {
  await openFirstListing(page, goto);
  const opener = page.getByRole("button", { name: /apri la foto \d+ a schermo intero/i }).first();
  test.skip((await opener.count()) === 0, "questo immobile non ha galleria");
  await opener.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.height).toBeLessThanOrEqual(viewport.height + 1);
  await page.keyboard.press("Escape");
});
