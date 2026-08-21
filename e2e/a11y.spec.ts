import { test, expect, setConsent, a11yViolations } from "./helpers";

// Accessibilità automatizzata: axe su WCAG 2.1 A/AA, contrasto compreso.
//
// Un controllo automatico non certifica l'accessibilità — trova una parte dei problemi, non
// tutti. Ma i problemi che trova sono veri, e questa suite impedisce che tornino.

// Reduced motion: le rivelazioni parola-per-parola passano da opacità intermedie, e axe
// misurerebbe il contrasto di un testo a metà dissolvenza. Con la preferenza attiva il testo è
// nel suo stato finale — che è poi quello che deve essere leggibile.
test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

// Le rotte scoperte erano sei — /chi-siamo, /recensioni, /servizi, /lavora-con-noi,
// /domande-frequenti e /cookie — cioè un terzo del sito fuori dalla passata axe. Il §4.5
// del Documento finale smonta il falso positivo sui «9 link privi di nome accessibile»,
// e ha ragione: ma un presidio vale solo per le pagine che guarda.
const PAGES = [
  "/", "/acquista", "/case-vendute", "/valutazione-immobile-tradate", "/vendi", "/metodo",
  "/open-domus", "/contatti", "/privacy", "/chi-siamo", "/recensioni", "/servizi",
  "/lavora-con-noi", "/domande-frequenti", "/cookie",
];

for (const path of PAGES) {
  test(`${path} non ha violazioni di accessibilità`, async ({ page, goto }) => {
    await goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Le animazioni d'ingresso partono allo scroll: si dà loro il tempo di posarsi, altrimenti
    // axe misura il contrasto di un testo a metà dissolvenza.
    await page.waitForTimeout(600);

    const violations = await a11yViolations(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}

test("il contrasto regge anche sul pannello dell'assistente", async ({ page, goto }) => {
  await goto("/");
  const launcher = page.getByRole("button", { name: /assistente/i }).first();
  await expect(async () => {
    await launcher.click();
    // Il pannello dell'assistente è un dialogo VERO — si apre perché lo si è
    // chiesto, e intrappola il focus davvero. Resta `role="dialog"`: è il
    // banner cookie ad aver smesso di fingersi modale (Fase 4), non questo.
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 25_000 });

  const violations = await a11yViolations(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test("il banner cookie è accessibile", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("region", { name: /cookie/i })).toBeVisible({ timeout: 15_000 });

  const violations = await a11yViolations(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test("si naviga con la sola tastiera, e si vede dove si è", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "il Tab si verifica sui viewport desktop: su un dispositivo touch non c'è");
  await goto("/");

  // Primo Tab: il salto al contenuto, che deve essere raggiungibile e visibile.
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /salta al contenuto/i });
  await expect(skip).toBeFocused();

  // L'anello di focus è visibile: nessun outline azzerato senza sostituto.
  const outline = await skip.evaluate((el) => {
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle, shadow: s.boxShadow };
  });
  const hasRing = outline.style !== "none" || outline.shadow !== "none";
  expect(hasRing, "il focus non si vede").toBe(true);

  // Da lì si arriva al contenuto principale.
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("ogni immagine ha un'alternativa testuale sensata", async ({ page, goto }) => {
  await goto("/acquista");
  const missing = await page.locator("img:not([alt])").count();
  expect(missing, "immagini senza attributo alt").toBe(0);
});

test("la gerarchia dei titoli parte da un solo h1", async ({ page, goto }) => {
  for (const path of ["/", "/acquista", "/vendi", "/contatti"]) {
    await goto(path);
    const h1 = await page.locator("h1").count();
    expect(h1, `${path} ha ${h1} h1`).toBe(1);
  }
});

// Il dialog del video in pagina (§6.5). Sta qui e non in home.spec.ts perché la
// domanda è la stessa delle altre passate axe: una superficie nuova che copre lo
// schermo è anche una superficie nuova da cui non si deve restare intrappolati.
test("il dialog del video non ha violazioni di accessibilità", async ({ page, goto }) => {
  await goto("/");
  await page
    .getByRole("link", { name: /guarda il video|watch the video|regarder|video ansehen|ver el v/i })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Si usa l helper condiviso, che esclude gli iframe: dentro il player c e il markup di
  // YouTube, che non e nostro e che non possiamo correggere. Fuori dall iframe, invece,
  // la passata copre TUTTA la pagina con il dialog aperto — cosi si vede anche se il
  // dialog rompe qualcosa dietro di se.
  const violazioni = await a11yViolations(page);
  expect(violazioni, JSON.stringify(violazioni, null, 2)).toEqual([]);

  // Il bersaglio per chiudere è da dito, non da mouse: 44×44 pieni (WCAG 2.5.8).
  const chiudi = dialog.getByRole("button", { name: /chiud|clos|ferm|schließ|cerrar/i }).last();
  const box = await chiudi.boundingBox();
  expect(box?.width ?? 0, "larghezza del comando chiudi").toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0, "altezza del comando chiudi").toBeGreaterThanOrEqual(44);
});
