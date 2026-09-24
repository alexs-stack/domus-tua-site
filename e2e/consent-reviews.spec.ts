import { test, expect, setConsent } from "./helpers";

// Consenso e recensioni. La regola è una sola e non ammette sfumature: **prima del consenso,
// nessuna richiesta a terze parti**. Il widget recensioni è il caso concreto.

test("prima del consenso nessuna richiesta parte verso il widget recensioni", async ({ page, goto }) => {
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    const url = r.url();
    if (/trustindex|google|gstatic/i.test(url)) thirdParty.push(url);
  });

  await goto("/recensioni");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Il banner è lì e chiede di scegliere.
  await expect(page.getByRole("dialog", { name: /cookie/i })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);

  expect(thirdParty, `richieste partite senza consenso:\n${thirdParty.join("\n")}`).toEqual([]);
});

test("rifiutando i cookie il widget resta chiuso e la pagina resta utile", async ({ page, goto }) => {
  await setConsent(page, "rejected");
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    if (/trustindex/i.test(r.url())) thirdParty.push(r.url());
  });

  await goto("/recensioni");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(1500);

  expect(thirdParty).toEqual([]);
  // Senza widget la pagina non è vuota: le recensioni verificate restano leggibili.
  await expect(page.locator("#main")).toContainText(/recension|google/i);
});

test("accettando, il gate si apre", async ({ page, goto }) => {
  await setConsent(page, "accepted");
  await goto("/recensioni");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Il banner non ricompare a chi ha già scelto.
  await page.waitForTimeout(1200);
  await expect(page.getByRole("dialog", { name: /cookie/i })).toHaveCount(0);
});

test("il banner si usa con la tastiera e non intrappola il focus @layout", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "il Tab si verifica sui viewport desktop: su un dispositivo touch non c'è");
  await goto("/");
  const banner = page.getByRole("dialog", { name: /cookie/i });
  await expect(banner).toBeVisible({ timeout: 15_000 });

  // Il focus parte sull'azione primaria.
  await expect(banner.getByRole("button", { name: /accetta/i })).toBeFocused();

  // Il Tab resta dentro il banner finché la scelta non è fatta.
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Tab");
    expect(await banner.evaluate((b) => b.contains(document.activeElement))).toBe(true);
  }

  await page.keyboard.press("Enter");
  await expect(banner).toHaveCount(0);
});
