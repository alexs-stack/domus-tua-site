import { test, expect, clickUntil } from "./helpers";
import AxeBuilder from "@axe-core/playwright";

// Accessibilità e interazione della galleria della scheda immobile
// (app/components/PropertyGallery.tsx): alt della foto principale, miniature
// mute dentro controlli con nome, navigazione da tastiera, semantica tab/tabpanel.

async function gotoFirstListing(
  page: import("@playwright/test").Page,
  goto: (p: string) => Promise<void>
) {
  await goto("/acquista");
  const first = page.locator('#main a[href^="/case/"]').first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/case\/[a-z0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test("la foto principale ha un alt descrittivo dai campi dell'annuncio, non posizionale", async ({
  page,
  goto,
}) => {
  await gotoFirstListing(page, goto);
  const title = ((await page.getByRole("heading", { level: 1 }).first().textContent()) ?? "").trim();
  expect(title.length).toBeGreaterThan(0);

  const panel = page.locator('[role="tabpanel"]').first();
  await expect(panel).toBeVisible();
  const alt = await panel.locator("img").first().getAttribute("alt");
  expect(alt, "la foto principale deve avere un alt").toBeTruthy();
  // Non è l'alt posizionale ("foto N di M"): sulla principale è descrittivo.
  expect(alt ?? "").not.toMatch(/foto \d+ di \d+/i);
  // Usa il titolo verificato dell'annuncio.
  expect(alt ?? "").toContain(title);
});

test("le miniature sono duplicati muti dentro controlli con nome accessibile", async ({
  page,
  goto,
}) => {
  await gotoFirstListing(page, goto);
  const tabs = page.getByRole("tab");
  const n = await tabs.count();
  expect(n, "la scheda usata ha più foto (miniature)").toBeGreaterThan(1);

  for (let i = 0; i < n; i++) {
    // Il controllo ha un nome accessibile chiaro…
    await expect(tabs.nth(i)).toHaveAccessibleName(/foto \d+ di \d+/i);
    // …e l'immagine dentro è MUTA (alt=""): è un duplicato della foto grande,
    // non deve creare rumore ripetuto sullo screen reader.
    expect(await tabs.nth(i).locator("img").getAttribute("alt")).toBe("");
  }
});

test("la galleria si naviga da tastiera: le frecce cambiano foto, selezione e pannello", async ({
  page,
  goto,
  isMobile,
}) => {
  test.skip(
    !!isMobile,
    "la navigazione da tastiera si verifica su desktop: un dispositivo touch non ha tastiera fisica"
  );
  await gotoFirstListing(page, goto);
  const tabs = page.getByRole("tab");

  // Prova di idratazione: si RIPROVA il click su una miniatura diversa finché la
  // selezione cambia (l'HTML arriva prima del JS; un click un istante troppo
  // presto non trova ancora il gestore). Quando il click "prende", `onKeyDown`
  // dello stesso componente è attaccato e la tastiera è verificabile senza flake.
  await clickUntil(
    () => tabs.nth(1).click(),
    () => expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true")
  );

  // Ora la tastiera: `locator.press` dà il focus E preme sul tab, così la freccia
  // arriva proprio a quel controllo (più affidabile di focus()+keyboard.press).
  // Da tab 1, ArrowLeft torna a tab 0 (selezione + focus).
  await tabs.nth(1).press("ArrowLeft");
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "false");

  // Il pannello immagine è etichettato dal tab ATTIVO (aria-labelledby aggiornato)…
  const panel = page.locator('[role="tabpanel"]').first();
  const activeId = await tabs.nth(0).getAttribute("id");
  expect(activeId).toBeTruthy();
  await expect(panel).toHaveAttribute("aria-labelledby", activeId ?? "");
  // …e i tab controllano il pannello.
  await expect(tabs.nth(0)).toHaveAttribute("aria-controls", (await panel.getAttribute("id")) ?? "");
});

test("l'anteprima immobile è un dialog accessibile: Esc chiude e ripristina il focus", async ({
  page,
  goto,
  isMobile,
}) => {
  test.skip(!!isMobile, "il trap del focus e il ripristino si verificano su desktop (tastiera)");
  await goto("/acquista");
  // Il bottone "Anteprima" apre CaseQuickLook (un dialog con la foto dell'immobile).
  const trigger = page.getByRole("button", { name: /anteprima:|quick look:/i }).first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  // Esc chiude il dialog e riporta il focus al bottone che l'ha aperto.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("nessuna violazione di accessibilità nella regione galleria @layout", async ({ page, goto }) => {
  await gotoFirstListing(page, goto);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include('[role="tabpanel"]')
    .include('[role="tablist"]')
    .analyze();
  const violations = results.violations.map((v) => ({ id: v.id, help: v.help }));
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
