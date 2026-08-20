import { test, expect, setConsent } from "./helpers";

// I modi per arrivare a una persona: il form, WhatsApp, il telefono.
//
// La richiesta non viene mai spedita davvero: `/api/lead` viene intercettata. Quello che si
// verifica è il contratto fra pagina e endpoint — cosa parte, cosa si vede quando funziona,
// e cosa si vede quando NON funziona (che è la parte che conta).
//
// Come si comporta il form (app/components/Contact.tsx): la scrittura server-side è
// **best-effort e non bloccante**, il canale immediato è WhatsApp, aperto in modo sincrono col
// gesto dell'utente.
//
// La conferma dice «Abbiamo ricevuto la tua richiesta» SOLO quando un canale ha davvero preso
// in carico il lead — cioè quando /api/lead risponde {ok:true}. In ogni altro esito (429, 502,
// rete caduta, o il {ok:false, reason:"not-delivered"} che l API restituisce quando nessun
// canale è configurato) la conferma parla solo di WhatsApp, che è l unica cosa che è davvero
// successa. È esattamente ciò che questi test presidiano, ed è il motivo per cui ce ne sono
// DUE: uno per il ramo che può promettere, uno per il ramo che non può.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

/** Compila i campi obbligatori del form (nome + un recapito) e il consenso.
    Telefono ed email sono ora campi DISTINTI: ne basta uno. */
async function fillLeadForm(page: import("@playwright/test").Page, withConsent = true) {
  await page.getByRole("textbox", { name: /nome e cognome/i }).first().fill("Mario Rossi");
  await page.getByRole("textbox", { name: /^email$/i }).first().fill("mario.rossi@example.com");
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

  // La conferma parla di WhatsApp e lascia il numero.
  await expect(page.getByText(/stiamo aprendo whatsapp/i).first()).toBeVisible({ timeout: 15_000 });
  await expect(leadForm(page).locator('a[href^="https://wa.me/"]').first()).toBeVisible();

  // E QUI, dove l'endpoint ha risposto ok, può anche dire che la richiesta è arrivata.
  // È l'altra metà del test del 502: là questa frase è vietata, qui è dovuta.
  await expect(page.getByText(/abbiamo ricevuto la tua richiesta/i).first()).toBeVisible({
    timeout: 15_000,
  });

  // I quattro contenuti del §6.6 nella conferma: chi chiama, da quale numero, entro quando,
  // cosa preparare. Sono la ragione per cui la conferma esiste — senza, è una spunta.
  await expect(page.getByText(/cosa succede adesso/i).first()).toBeVisible();
  await expect(page.getByText(/entro 24 ore lavorative/i).first()).toBeVisible();
  await expect(page.getByText(/se ti arriva una chiamata dallo/i).first()).toBeVisible();
  await expect(page.getByText(/cosa puoi preparare/i).first()).toBeVisible();

  // Il link di scampo porta il messaggio GIÀ COMPOSTO, non il WhatsApp generico: chi lo usa
  // è chi ha avuto il popup bloccato, cioè chi meno di tutti ha voglia di riscrivere.
  const scampo = await leadForm(page).locator('a[href^="https://wa.me/"]').first().getAttribute("href");
  expect(scampo ?? "").toMatch(/Mario(%20|\+)Rossi/i);

  // Il pulsante di invio non è più premibile a vuoto: al suo posto un comando esplicito.
  await expect(page.getByRole("button", { name: /manda un.altra richiesta/i })).toBeVisible();

  // E intanto il lead è partito verso l'endpoint, con i campi giusti — email in
  // un campo suo, non più nel vecchio `contact` combinato.
  await expect.poll(() => sent, { timeout: 10_000 }).toBeTruthy();
  expect(sent!).toMatchObject({ name: "Mario Rossi", email: "mario.rossi@example.com" });
  // Il consenso privacy viaggia con la richiesta: senza, il server la rifiuta.
  expect(sent!.consent).toBeTruthy();
});

test("un'email non valida mostra un errore accessibile e non perde i dati scritti", async ({ page, goto }) => {
  let called = false;
  await page.route("**/api/lead", (route) => {
    called = true;
    return route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
  });

  await goto("/contatti");
  const email = page.getByRole("textbox", { name: /^email$/i }).first();
  await page.getByRole("textbox", { name: /nome e cognome/i }).first().fill("Mario Rossi");
  await email.fill("non-una-email");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /invia|richiedi|valuta|trova|scopri/i }).first().click();

  // Il client blocca prima dell'invio: la richiesta non parte.
  await page.waitForTimeout(500);
  expect(called, "una email non valida non deve partire verso l'endpoint").toBe(false);

  // Errore accessibile: il campo è marcato invalido, l'errore ha role=alert ed è
  // collegato al campo via aria-describedby (uno screen reader lo annuncia).
  await expect(email).toHaveAttribute("aria-invalid", "true");
  const describedBy = await email.getAttribute("aria-describedby");
  expect(describedBy, "il campo email non punta al proprio messaggio d'errore").toBeTruthy();
  const err = page.locator(`#${describedBy}`);
  await expect(err).toHaveRole("alert");
  await expect(err).toBeVisible();

  // Il valore scritto NON si perde dopo l'errore recuperabile.
  await expect(email).toHaveValue("non-una-email");
});

test("senza né telefono né email l'errore invita a lasciare un recapito", async ({ page, goto }) => {
  await goto("/contatti");
  await page.getByRole("textbox", { name: /nome e cognome/i }).first().fill("Mario Rossi");
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /invia|richiedi|valuta|trova|scopri/i }).first().click();

  const phone = page.getByRole("textbox", { name: /^telefono$/i }).first();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toBeFocused();
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
  // E lo DICE, invece di tacere: la richiesta non è stata registrata, ecco la via che funziona.
  await expect(page.getByText(/non è riuscito a registrarla/i).first()).toBeVisible({
    timeout: 15_000,
  });
  // Il fisso resta cliccabile lì dentro: è il canale che non dipende né dall'endpoint né da WhatsApp.
  await expect(leadForm(page).locator('a[href^="tel:"]').first()).toBeVisible();
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
