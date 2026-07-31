import { test, expect } from "@playwright/test";

// Smoke test sul feed VERO di RealSmart. Separato dalla suite e **non bloccante**.
//
// Perché a parte: dipende da un servizio di terze parti e dagli immobili del giorno. Se il
// gestionale è lento o in manutenzione, il rosso non dice niente sul nostro codice — e una CI
// che diventa rossa per motivi altrui smette di essere letta.
//
// Cosa controlla: che il feed risponda, che i dati arrivino nella forma attesa e che le regole
// di integrità reggano sui dati reali, non sulle fixture.
//
//   npm run test:e2e:live
//
// Richiede NEXT_PUBLIC_USE_REALSMART=true e le credenziali del feed nell'ambiente.

test.describe.configure({ mode: "serial" });

test("il feed live risponde e ha immobili disponibili", async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/api/health`);
  expect(res.ok()).toBe(true);
  const health = await res.json();

  test.skip(
    health.integrations?.listingsMode !== "live",
    "ambiente non collegato al feed live (listingsMode != live)",
  );
  expect(health.integrations.listingsFeedConfigured).toBe(true);
});

test("la vetrina mostra immobili reali e nessun venduto", async ({ page, baseURL }) => {
  await page.context().addCookies([
    { name: "dt_consent", value: "accepted", domain: new URL(baseURL!).hostname, path: "/" },
  ]);
  await page.goto("/case", { waitUntil: "domcontentloaded" });

  const cards = page.locator('#main a[href^="/case/"]');
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await page.locator("#main").getByText(/^venduto$/i).count()).toBe(0);
});

test("una scheda reale si apre e mostra i dati del gestionale", async ({ page }) => {
  await page.goto("/case", { waitUntil: "domcontentloaded" });
  const first = page.locator('#main a[href^="/case/"]').first();
  await expect(first).toBeVisible({ timeout: 30_000 });
  await first.click();

  await expect(page).toHaveURL(/\/case\/[a-z0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Prezzo o "trattativa riservata": uno dei due dev'esserci, mai il vuoto.
  await expect(page.locator("#main")).toContainText(/€|riservat|mese/i);
  // Le foto vengono dal gestionale: nessuna sorgente estranea.
  const srcs = await page
    .locator("#main img")
    .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).currentSrc || (e as HTMLImageElement).src));
  for (const src of srcs) {
    expect(src, `sorgente immagine inattesa: ${src}`).toMatch(/^(data:|blob:|https?:\/\/[^/]*(realsmart\.it|127\.0\.0\.1|localhost))/);
  }
});
