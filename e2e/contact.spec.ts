import { test, expect, setConsent } from "./helpers";

// I modi per arrivare a una persona: il form, WhatsApp, il telefono.
//
// La richiesta non viene mai spedita davvero: `/api/lead` viene intercettata. Quello che si
// verifica è il contratto fra pagina e endpoint — cosa parte, cosa si vede quando funziona,
// e cosa si vede quando NON funziona (che è la parte che conta).
//
// Come si comporta il form (app/components/Contact.tsx): la scrittura server-side è
// **best-effort e non bloccante**, il canale immediato è WhatsApp, aperto in modo sincrono col
// gesto dell'utente. Perciò la conferma non dice "abbiamo ricevuto la tua richiesta" — dice che
// sta aprendo WhatsApp e lascia il numero. È esattamente ciò che questi test presidiano: la
// conferma non deve mai promettere una consegna che il sito non può garantire.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

/** Compila i due campi obbligatori del form (nome e canale di ricontatto) e il consenso. */
async function fillLeadForm(page: import("@playwright/test").Page, withConsent = true) {
  await page.getByRole("textbox", { name: /nome e cognome/i }).first().fill("Mario Rossi");
  await page.getByRole("textbox", { name: /telefono o email/i }).first().fill("mario.rossi@example.com");
  if (withConsent) await page.getByRole("checkbox").first().check();
}

/** Il form della pagina contatti (la sezione, non tutta la pagina). */
const leadForm = (page: import("@playwright/test").Page) => page.locator("form").first();

test("il form manda il lead all'endpoint e passa la parola a WhatsApp", async ({ page, goto, context }) => {
  let sent: Record<string, unknown> | null = null;
  await page.route("**/api/lead", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
  // Il form apre WhatsApp in una scheda nuova: la si intercetta, altrimenti il test finisce
  // ad aspettare una pagina di terze parti che la fixture blocca comunque.
  context.on("page", (p) => void p.close().catch(() => {}));

  await goto("/contatti");
  await fillLeadForm(page);
  await page.getByRole("button", { name: /invia|richiedi|valuta|trova|scopri/i }).first().click();

  // La conferma parla di WhatsApp e lascia il numero: non promette una consegna via email.
  await expect(page.getByText(/stiamo aprendo whatsapp/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(leadForm(page).locator('a[href^="https://wa.me/"]').first()).toBeVisible();

  // E intanto il lead è partito verso l'endpoint, con i campi giusti.
  await expect.poll(() => sent, { timeout: 10_000 }).toBeTruthy();
  expect(sent!).toMatchObject({ name: "Mario Rossi", contact: "mario.rossi@example.com" });
  // Il consenso privacy viaggia con la richiesta: senza, il server la rifiuta.
  expect(sent!.consent).toBeTruthy();
});

test("se l'endpoint cade, il form non promette nulla che non possa mantenere", async ({ page, goto, context }) => {
  await page.route("**/api/lead", (route) =>
    route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ ok: false, error: "provider-error" }) }),
  );
  context.on("page", (p) => void p.close().catch(() => {}));

  await goto("/contatti");
  await fillLeadForm(page);
  await page.getByRole("button", { name: /invia|richiedi|valuta|trova|scopri/i }).first().click();

  // Nessuna conferma di ricezione: la scrittura server-side è caduta e il testo non lo nasconde.
  await expect(page.getByText(/grazie|ricevut|ti risponderemo/i)).toHaveCount(0);
  // Resta la via d'uscita vera, che non dipende dall'endpoint.
  await expect(leadForm(page).locator('a[href^="https://wa.me/"]').first()).toBeVisible({
    timeout: 15_000,
  });
});

test("il form non parte senza consenso privacy", async ({ page, goto }) => {
  let called = false;
  await page.route("**/api/lead", (route) => {
    called = true;
    return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
  });

  await goto("/contatti");
  await fillLeadForm(page, false);
  await page.getByRole("button", { name: /invia|richiedi|valuta|trova|scopri/i }).first().click();
  await page.waitForTimeout(1000);

  expect(called, "la richiesta è partita senza la spunta privacy").toBe(false);
});

test("i link WhatsApp portano al numero dell'agenzia, con un messaggio già scritto", async ({ page, goto }) => {
  await goto("/contatti");
  const links = page.locator('a[href^="https://wa.me/"]');
  const n = await links.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const href = await links.nth(i).getAttribute("href");
    expect(href).toMatch(/^https:\/\/wa\.me\/393466042314/);
    expect(href).toMatch(/[?&]text=/);
    // Testo codificato: niente spazi grezzi nell'URL.
    expect(href).not.toMatch(/text=[^&]*\s/);
    await expect(links.nth(i)).toHaveAttribute("rel", /noopener/);
  }
});

test("il numero di telefono è cliccabile ed è quello vero", async ({ page, goto }) => {
  await goto("/contatti");
  const tel = page.locator('a[href^="tel:"]').first();
  await expect(tel).toBeVisible();
  await expect(tel).toHaveAttribute("href", "tel:+390331844898");
});

test("dalla scheda immobile si scrive su WhatsApp con il riferimento giusto", async ({ page, goto }) => {
  await goto("/acquista");
  const first = page.locator('#main a[href^="/case/"]').first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/case\/[a-z0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Nell'intestazione c'è il link generico dell'agenzia: quello che conta è il link della
  // scheda, che deve nominare l'immobile che si sta guardando.
  const title = ((await page.getByRole("heading", { level: 1 }).textContent()) ?? "").trim();
  const hrefs = await page
    .locator('#main a[href^="https://wa.me/"]')
    .evaluateAll((els) => els.map((e) => decodeURIComponent((e as HTMLAnchorElement).href)));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(
    hrefs.some((h) => h.includes(title.slice(0, 12))),
    `nessun link WhatsApp nomina l'immobile:\n${hrefs.join("\n")}`,
  ).toBe(true);
});
