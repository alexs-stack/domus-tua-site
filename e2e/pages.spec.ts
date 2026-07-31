import { test, expect, setConsent } from "./helpers";

// Le pagine di contenuto: che esistano, che dicano la cosa giusta nel titolo, che non
// producano errori e che portino da qualche parte.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

const PAGES = [
  { path: "/acquista", title: /comprare casa/i },
  { path: "/vendi", title: /vendere casa/i },
  { path: "/metodo", title: /metodo/i },
  { path: "/open-domus", title: /open domus/i },
  { path: "/chi-siamo", title: /chi siamo|domus tua/i },
  { path: "/servizi", title: /servizi/i },
  { path: "/recensioni", title: /recensioni/i },
  { path: "/contatti", title: /contatti/i },
  { path: "/case", title: /case|immobili/i },
  { path: "/privacy", title: /privacy/i },
  { path: "/cookie", title: /cookie/i },
];

for (const p of PAGES) {
  test(`${p.path} carica senza errori`, async ({ page, goto, guards }) => {
    await goto(p.path);

    await expect(page).toHaveTitle(p.title);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("footer")).toBeAttached();

    expect(guards.consoleErrors, guards.consoleErrors.join("\n")).toEqual([]);
    expect(guards.failedRequests, guards.failedRequests.join("\n")).toEqual([]);
  });
}

test("le pagine di contenuto stanno nella larghezza @layout", async ({ page, goto }) => {
  for (const path of ["/vendi", "/metodo", "/open-domus", "/contatti"]) {
    await goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} scorre in orizzontale`).toBeLessThanOrEqual(1);
  }
});

test("privacy e cookie policy si raggiungono dal piè di pagina", async ({ page, goto }) => {
  await goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: /privacy/i }).first()).toHaveAttribute("href", /privacy/);
  await expect(footer.getByRole("link", { name: /cookie/i }).first()).toHaveAttribute("href", /cookie/);
});

test("la cookie policy spiega come cambiare idea", async ({ page, goto }) => {
  await goto("/cookie");
  await expect(page.locator("#main")).toContainText(/cookie/i);
  // Deve esistere un modo per rivedere la scelta, non solo una pagina di testo.
  await expect(page.locator("#main")).toContainText(/consenso|preferenz|revoc|modific/i);
});
