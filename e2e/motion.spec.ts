import { test, expect, setConsent } from "./helpers";

// Reduced motion. Chi ha chiesto meno animazioni deve vedere lo stesso sito, fermo — non un
// sito a metà: nessun testo invisibile in attesa di un'animazione che non partirà mai.

test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

test("con reduced motion l'intro non parte e il contenuto è subito lì @layout", async ({ page }) => {
  // Niente scorciatoie: si carica la home come la caricherebbe un visitatore.
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toBeVisible({ timeout: 5_000 });
  // Nessun overlay del preloader rimasto a coprire la pagina.
  await expect(page.locator("[data-preloader]")).toHaveCount(0);
});

test("i testi rivelati dall'animazione sono comunque leggibili", async ({ page, goto }) => {
  await goto("/vendi");
  await page.waitForTimeout(400);

  // Ogni parola animata è a piena opacità: senza animazione non resta niente di nascosto.
  const faded = await page.locator("[data-w]").evaluateAll((els) =>
    els.filter((e) => Number(getComputedStyle(e).opacity) < 0.9).length,
  );
  expect(faded, "parole rimaste invisibili con reduced motion").toBe(0);
});

test("le sezioni che entrano allo scroll sono già visibili", async ({ page, goto }) => {
  await goto("/metodo");
  await page.waitForTimeout(400);

  const invisible = await page.locator("#main section").evaluateAll((els) =>
    els.filter((e) => {
      const s = getComputedStyle(e);
      return Number(s.opacity) < 0.9 && s.display !== "none";
    }).length,
  );
  expect(invisible, "sezioni rimaste trasparenti con reduced motion").toBe(0);
});

test("lo scroller orizzontale con reduced motion resta una colonna completa", async ({ page, goto }) => {
  await goto("/");
  const horizon = page.locator(".dt-horizon");
  await expect(horizon).toBeAttached();
  // Senza motion l'attributo che attiva pin e track orizzontale non deve esserci.
  expect(await horizon.getAttribute("data-on")).toBeNull();
  // I pannelli restano in flusso normale, visibili e completi.
  await page.locator(".dt-horizon_panel").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".dt-horizon_panel").first()).toBeVisible();
  await expect(page.locator(".dt-horizon_panel").last()).toBeAttached();
});

test("lo scroll è quello del browser, non uno smooth scroll forzato", async ({ page, goto }) => {
  await goto("/");
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(200);
});

// ── Precarico ─────────────────────────────────────────────────────────────
// Fuori dal regime reduced-motion del resto del file: qui serve il preloader
// vero, perché è lui che deve aver già fatto il lavoro pesante.
//
// Fioritura campiona la scritta pixel per pixel e ne ricava migliaia di
// particelle. Se quel campionamento cade nel callback dell'IntersectionObserver,
// la pagina singhiozza proprio mentre le arrivi addosso — è il difetto segnalato
// dal cliente. Il preloader lo anticipa; questo test lo tiene anticipato.
test.describe("il lavoro pesante sta dietro il sipario", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("i fiori sono già campionati prima che li si raggiunga @layout", async ({ page }) => {
    await setConsent(page, "accepted");
    await page.goto("/", { waitUntil: "load" });

    // Nessuno scroll: si guarda soltanto se il lavoro è già stato fatto.
    await page.waitForFunction(
      () => document.querySelectorAll("canvas[data-fiorita]").length > 0,
      undefined,
      { timeout: 15_000 },
    );

    const pronte = await page
      .locator("canvas[data-fiorita]")
      .evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.fiorita)));

    expect(pronte.length, "nessun canvas fiorito prima dello scroll").toBeGreaterThan(0);
    expect(
      pronte.every((n) => n > 0),
      `canvas campionati a vuoto: ${pronte.join(", ")}`,
    ).toBe(true);
  });
});
