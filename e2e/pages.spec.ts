import { test, expect, setConsent } from "./helpers";

// Le pagine di contenuto: che esistano, che dicano la cosa giusta nel titolo, che non
// producano errori e che portino da qualche parte.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

// I title sono quelli definitivi del §6.8 del Documento finale di sintesi: dicono COSA si
// trova nella pagina, non come si chiama la sezione del menu. Due di queste voci non
// contengono più la parola che le nominava — /acquista non dice «comprare casa» ma «case
// in vendita», /servizi non dice «servizi» ma i servizi veri (home staging, rendering,
// video) — ed è voluto: sono le parole con cui le persone cercano.
// I pattern qui sotto puntano quindi al contenuto informativo del titolo, non a
// un'etichetta di navigazione.
const PAGES = [
  { path: "/acquista", title: /case in vendita a tradate/i },
  { path: "/case-vendute", title: /case vendute/i },
  { path: "/vendi", title: /vendere casa a tradate/i },
  { path: "/metodo", title: /metodo domus tua/i },
  { path: "/open-domus", title: /open domus/i },
  { path: "/chi-siamo", title: /chi siamo|domus tua/i },
  { path: "/servizi", title: /home staging, rendering e video/i },
  { path: "/recensioni", title: /recensioni/i },
  { path: "/contatti", title: /contatti/i },
  { path: "/domande-frequenti", title: /domande frequenti/i },
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

// Il markup FAQPage promette risposte: devono essere ESATTAMENTE quelle in pagina.
// Un FAQPage che dichiara domande non visibili e', per le linee guida di Google, spam —
// e nessun test unitario puo' verificarlo, perche' il markup e la pagina si incontrano
// solo qui, nell'HTML servito.
test("lo schema FAQPage dichiara solo domande e risposte visibili in pagina", async ({ page, goto }) => {
  await goto("/domande-frequenti");

  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faq = blocks.map((b) => JSON.parse(b)).find((j) => j["@type"] === "FAQPage");
  expect(faq, "manca lo schema FAQPage").toBeTruthy();
  expect(faq.mainEntity.length).toBeGreaterThanOrEqual(10);

  // textContent, non innerText: un <details> chiuso non ha testo RESO, ma il testo è
  // comunque nel DOM ed è quello che leggono i crawler. Che sia poi raggiungibile
  // dall'utente lo garantisce <details> stesso — nativo, apribile anche senza JS.
  const domande = await page.locator("details summary").allTextContents();
  const risposte = await page.locator("details p").allTextContents();
  const normalizza = (s: string) => s.replace(/\s+/g, " ").trim();

  for (const q of faq.mainEntity) {
    expect(domande.map(normalizza), `domanda non in pagina: ${q.name}`).toContain(normalizza(q.name));
    expect(
      risposte.map(normalizza),
      `risposta non in pagina: ${q.acceptedAnswer.text.slice(0, 50)}…`,
    ).toContain(normalizza(q.acceptedAnswer.text));
  }
});

test("solo /domande-frequenti porta lo schema FAQPage delle domande generali", async ({ page, goto }) => {
  // I blocchi compatti di /vendi e /acquista mostrano le stesse risposte ma NON il markup:
  // tre FAQPage per lo stesso contenuto sarebbero tre dichiarazioni in conflitto.
  for (const path of ["/vendi", "/acquista"]) {
    await goto(path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const tipi = blocks.map((b) => JSON.parse(b)["@type"]);
    expect(tipi, `${path} dichiara un FAQPage`).not.toContain("FAQPage");
  }
});

test("le pagine di contenuto stanno nella larghezza @layout", async ({ page, goto }) => {
  for (const path of ["/vendi", "/metodo", "/open-domus", "/contatti", "/domande-frequenti"]) {
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
