import { test, expect, type Page, type Route } from "@playwright/test";

// L'assistente nel browser, mobile e desktop.
//
// Le risposte del modello sono finte, e lo sono di proposito: qui non si valuta cosa dice
// l'assistente (quello lo fanno gli eval, scripts/eval-assistant.ts) ma cosa fa l'interfaccia
// mentre la risposta arriva — che si legga mentre si scrive, che si possa fermare, che il
// focus non si perda, che niente copra niente. Con un provider vero non sarebbe ripetibile.

/** Serve uno stream SSE a pezzi, con una pausa fra l'uno e l'altro. */
async function streamReply(route: Route, events: string[], delayMs = 120) {
  const body = events.map((e) => `data: ${e}\n\n`).join("");
  await new Promise((r) => setTimeout(r, delayMs));
  await route.fulfill({
    status: 200,
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store" },
    body,
  });
}

const TEXT_REPLY = [
  JSON.stringify({ type: "text", text: "Ne abbiamo due disponibili. " }),
  JSON.stringify({ type: "text", text: "La villa singola a Venegono Superiore e la villa a schiera a Castiglione Olona." }),
  JSON.stringify({
    type: "listings",
    listings: [
      {
        slug: "villa-singola-venegono",
        title: "Villa singola a Venegono Superiore",
        zone: "Venegono Superiore",
        price: "€ 445.000",
        url: "/case/villa-singola-venegono",
        cover: "/images/reali/villa-pool.jpg",
      },
    ],
  }),
  JSON.stringify({ type: "done" }),
];

/** Toglie di mezzo il banner cookie: senza una scelta il launcher non compare (di proposito). */
async function acceptCookies(page: Page) {
  await page.context().addCookies([
    { name: "dt_consent", value: "accepted", domain: "127.0.0.1", path: "/" },
  ]);
}

async function openAssistant(page: Page) {
  await page.goto("/");
  const launcher = page.getByRole("button", { name: /assistente|assistant|asistente/i }).first();
  // Il bottone esiste nell'HTML prima che React lo abbia idratato: un click troppo presto non
  // ha ancora un gestore. Si riprova finché il pannello non c'è davvero.
  await expect(async () => {
    await launcher.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 25_000 });
  return launcher;
}

test.beforeEach(async ({ page }) => {
  await acceptCookies(page);
});

test("il pannello non esiste finché non si apre", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const launcher = page.getByRole("button", { name: /assistente|assistant|asistente/i }).first();
  await expect(launcher).toBeVisible();
  await expect(launcher).toHaveAttribute("aria-expanded", "false");
});

test("il launcher non compare finché il banner cookie è a schermo", async ({ page }) => {
  // Senza il cookie di consenso il banner appare: il launcher non deve galleggiarci sopra.
  await page.context().clearCookies();
  await page.goto("/");
  const banner = page.getByRole("dialog", { name: /cookie/i });
  await expect(banner).toBeVisible({ timeout: 15_000 });
  const launcher = page.getByRole("button", { name: /assistente|assistant|asistente/i }).first();
  await expect(launcher).toBeHidden();
  const accept = banner.getByRole("button", { name: /accetta|accept|akzept|acepta/i });
  await expect(async () => {
    await accept.click();
    await expect(launcher).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 25_000 });
});

test("la risposta si legge mentre arriva, con le schede immobile", async ({ page }) => {
  await page.route("**/api/assistant", (route) => streamReply(route, TEXT_REPLY));
  await openAssistant(page);

  await page.getByRole("button", { name: "Cerco una villa" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Ne abbiamo due disponibili");
  await expect(dialog.getByRole("link", { name: /Villa singola a Venegono/ })).toBeVisible();
  await expect(dialog.getByRole("link", { name: /Villa singola a Venegono/ })).toHaveAttribute(
    "href",
    "/case/villa-singola-venegono",
  );
});

test("si può interrompere la risposta e riprovare", async ({ page }) => {
  // Stream che non finisce mai: il pulsante "interrompi" è l'unica via d'uscita.
  await page.route("**/api/assistant", async (route) => {
    await new Promise((r) => setTimeout(r, 20_000));
    await route.abort();
  });
  await openAssistant(page);
  await page.getByRole("button", { name: "Cerco una villa" }).click();

  const stop = page.getByRole("button", { name: /interrompi|stop|abbrechen|detener/i });
  await expect(stop).toBeVisible();
  await stop.click();
  await expect(stop).toBeHidden();
  await expect(page.getByRole("button", { name: /riprova|try again|réessayer|erneut|reintentar/i })).toBeVisible();
});

test("nuova conversazione riporta al saluto", async ({ page }) => {
  await page.route("**/api/assistant", (route) => streamReply(route, TEXT_REPLY));
  await openAssistant(page);
  await page.getByRole("button", { name: "Cerco una villa" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Ne abbiamo due disponibili");

  await dialog.getByRole("button", { name: /nuova conversazione|new conversation|nouvelle|neue|nueva/i }).click();
  await expect(dialog).not.toContainText("Ne abbiamo due disponibili");
  await expect(dialog.getByRole("button", { name: "Cerco una villa" })).toBeVisible();
});

test("Escape chiude e il focus torna al launcher", async ({ page }) => {
  const launcher = await openAssistant(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("il Tab resta dentro il pannello", async ({ page }) => {
  await openAssistant(page);
  const dialog = page.getByRole("dialog");
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const inside = await dialog.evaluate((d) => d.contains(document.activeElement));
    expect(inside, `il focus è uscito dal pannello dopo ${i + 1} Tab`).toBe(true);
  }
});

test("i tre canali umani sono raggiungibili e grandi abbastanza", async ({ page }) => {
  await openAssistant(page);
  const dialog = page.getByRole("dialog");
  const email = dialog.getByRole("link", { name: /email|e-mail/i });
  const whatsapp = dialog.getByRole("link", { name: /whatsapp/i });
  const phone = dialog.getByRole("link", { name: /telefon|call|llamar|anrufen/i });

  await expect(email).toHaveAttribute("href", /^mailto:/);
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\//);
  await expect(phone).toHaveAttribute("href", /^tel:/);

  for (const link of [email, whatsapp, phone]) {
    const box = await link.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test("il pannello sta dentro il viewport, safe area compresa", async ({ page }) => {
  await openAssistant(page);
  const box = await page.getByRole("dialog").boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual((viewport?.height ?? 0) + 1);
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
});

test("senza rete lo dice e non fa scrivere invano", async ({ page, context }) => {
  await openAssistant(page);
  await context.setOffline(true);
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("status")).toBeVisible();
  await expect(dialog.getByRole("textbox")).toBeDisabled();
  await context.setOffline(false);
  await expect(dialog.getByRole("textbox")).toBeEnabled();
});

test("un errore del server lascia una via d'uscita, non un vicolo cieco", async ({ page }) => {
  await page.route("**/api/assistant", (route) =>
    streamReply(route, [
      JSON.stringify({ type: "text", text: "L'assistente non è disponibile in questo momento. Scrivici su WhatsApp o chiamaci." }),
      JSON.stringify({ type: "error", reason: "provider-error" }),
    ]),
  );
  await openAssistant(page);
  await page.getByRole("button", { name: "Cerco una villa" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("WhatsApp");
  await expect(dialog.getByRole("button", { name: /riprova|try again|réessayer|erneut|reintentar/i })).toBeVisible();
});

test("nessun errore in console durante una conversazione", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));

  await page.route("**/api/assistant", (route) => streamReply(route, TEXT_REPLY));
  await openAssistant(page);
  await page.getByRole("button", { name: "Cerco una villa" }).click();
  await expect(page.getByRole("dialog")).toContainText("Ne abbiamo due disponibili");
  await page.keyboard.press("Escape");

  expect(errors, errors.join("\n")).toEqual([]);
});
