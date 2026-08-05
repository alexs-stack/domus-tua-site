// E2E dell'assistente: il contratto della UI, nell'applicazione vera.
//
// Ogni test gira su desktop E su iPhone (vedi playwright.config.ts): il traffico reale è in
// maggioranza da smartphone, quindi il mobile non è una verifica accessoria.

import { expect, test } from "@playwright/test";
import { CARD_PROVA, apriAssistente, bolla, mockAssistant, mockLead } from "./mock";

test.describe("apertura e chiusura", () => {
  test("il launcher apre il pannello e Escape lo chiude", async ({ page }) => {
    await apriAssistente(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Il pannello si presenta col nome: "Assistente Raffaela" (una L sola). Si guarda il
    // titolo, non un testo qualunque: il nome ricorre anche nel saluto.
    await expect(dialog.locator("#assistant-title")).toHaveText("Assistente Raffaela");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("il launcher resta nascosto finché il banner cookie è a schermo", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");

    // Il banner arriva a fine intro: gli diamo il tempo di comparire.
    const banner = page.getByRole("button", { name: /solo necessari/i });
    await expect(banner).toBeVisible({ timeout: 15_000 });
    // Nascosto anche a tastiera e screen reader, non solo alla vista.
    await expect(page.getByRole("button", { name: /assistente/i })).toBeHidden();

    await banner.click();
    await expect(page.getByRole("button", { name: /assistente/i })).toBeVisible();
  });

  test("alla chiusura il focus torna al launcher", async ({ page }) => {
    await apriAssistente(page);
    await page.getByRole("button", { name: /chiudi/i }).click();
    await expect(page.getByRole("button", { name: /assistente/i })).toBeFocused();
  });
});

test.describe("conversazione", () => {
  test("il messaggio parte e la risposta compare", async ({ page }) => {
    await mockAssistant(page, [
      { type: "text", value: "Ciao! " },
      { type: "text", value: "Come posso aiutarti?" },
      { type: "done" },
    ]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Buongiorno");
    await page.getByRole("button", { name: /invia/i }).click();

    await expect(bolla(page, "Buongiorno")).toBeVisible();
    // Il testo arriva in due frammenti: la UI deve ricomporlo.
    await expect(bolla(page, "Ciao! Come posso aiutarti?")).toBeVisible();
  });

  test("i suggerimenti iniziali inviano il messaggio", async ({ page }) => {
    await mockAssistant(page, [{ type: "text", value: "Ecco cosa posso fare." }, { type: "done" }]);
    await apriAssistente(page);

    await page.getByRole("button", { name: "Cerco una villa" }).click();
    await expect(bolla(page, "Ecco cosa posso fare.")).toBeVisible();
  });

  test("«Nuova conversazione» riporta al saluto iniziale", async ({ page }) => {
    await mockAssistant(page, [{ type: "text", value: "Risposta di prova." }, { type: "done" }]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Ciao");
    await page.getByRole("button", { name: /invia/i }).click();
    await expect(bolla(page, "Risposta di prova.")).toBeVisible();

    await page.getByRole("button", { name: /nuova conversazione/i }).click();
    await expect(bolla(page, "Risposta di prova.")).toBeHidden();
    await expect(page.getByRole("button", { name: "Cerco una villa" })).toBeVisible();
  });
});

test.describe("ricerca immobili", () => {
  test("le card compaiono e portano alla scheda giusta", async ({ page }) => {
    await mockAssistant(page, [
      { type: "listings", value: CARD_PROVA },
      { type: "text", value: "Ho trovato due ville." },
      { type: "done" },
    ]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Cerco una villa");
    await page.getByRole("button", { name: /invia/i }).click();

    const card = page.getByRole("link", { name: /Villa con giardino/ });
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("href", "/case/villa-giardino-tradate");
    await expect(page.getByText("€ 280.000")).toBeVisible();
    await expect(page.getByText("Tradate", { exact: true }).first()).toBeVisible();
  });

  test("con zero risultati non compare nessuna card", async ({ page }) => {
    await mockAssistant(page, [
      { type: "text", value: "Non ho trovato nulla con questi criteri." },
      { type: "done" },
    ]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Villa a 1 euro");
    await page.getByRole("button", { name: /invia/i }).click();

    await expect(bolla(page, /non ho trovato nulla/i)).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("link")).toHaveCount(1); // solo l'informativa
  });

  test("una nuova ricerca non riporta le card della precedente", async ({ page }) => {
    // Regressione dell'onda 1: le card restavano "appiccicate" al turno successivo.
    let chiamate = 0;
    await page.route("**/api/assistant", async (route) => {
      chiamate += 1;
      const eventi =
        chiamate === 1
          ? [{ type: "listings", value: CARD_PROVA }, { type: "text", value: "Eccone due." }, { type: "done" }]
          : [{ type: "text", value: "Su questo non ho risultati." }, { type: "done" }];
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
        body: eventi.map((e) => `data: ${JSON.stringify(e)}\n\n`).join(""),
      });
    });
    await apriAssistente(page);

    const input = page.getByPlaceholder(/scrivi qui/i);
    await input.fill("Cerco una villa");
    await page.getByRole("button", { name: /invia/i }).click();
    await expect(page.getByRole("link", { name: /Villa con giardino/ })).toBeVisible();

    await input.fill("E a Milano?");
    await page.getByRole("button", { name: /invia/i }).click();
    await expect(bolla(page, /non ho risultati/i)).toBeVisible();
    // La card resta agganciata al primo turno, non si ripropone nel secondo.
    await expect(page.getByRole("link", { name: /Villa con giardino/ })).toHaveCount(1);
  });
});

test.describe("passaggio a un canale umano", () => {
  test("WhatsApp apre il numero corretto con messaggio precompilato", async ({ page }) => {
    await mockAssistant(page, [
      {
        type: "handoff",
        value: {
          kind: "whatsapp",
          url: "https://wa.me/393466042314?text=Ciao%20Domus%20Tua",
          message: "Ciao Domus Tua",
          label: "Scrivi su WhatsApp",
        },
      },
      { type: "text", value: "Ti metto in contatto con il team." },
      { type: "done" },
    ]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Voglio parlare con voi");
    await page.getByRole("button", { name: /invia/i }).click();

    const wa = page.getByRole("link", { name: /scrivi su whatsapp/i });
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/393466042314\?text=/);
    await expect(wa).toHaveAttribute("target", "_blank");
  });

  test("il modulo email invia e conferma solo dopo la risposta del server", async ({ page }) => {
    await mockAssistant(page, [
      {
        type: "handoff",
        value: {
          kind: "email",
          to: "immobiliare@domustua.it",
          subject: "Richiesta",
          body: "Vorrei informazioni.",
          label: "Lascia una richiesta",
        },
      },
      { type: "text", value: "Lasciami i tuoi dati." },
      { type: "done" },
    ]);
    await mockLead(page, { ok: true });
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Mandate una mail");
    await page.getByRole("button", { name: /invia/i }).click();

    await page.getByRole("dialog").getByLabel("Nome", { exact: true }).fill("Mario Rossi");
    await page.getByRole("dialog").getByLabel("Email", { exact: true }).fill("mario@example.com");
    await page.getByRole("dialog").getByRole("checkbox").check();
    await page.getByRole("dialog").getByRole("button", { name: /invia richiesta/i }).click();

    await expect(page.getByRole("dialog").getByText(/richiesta inviata/i)).toBeVisible();
  });

  test("se il canale email non è configurato non mostra un falso successo", async ({ page }) => {
    await mockAssistant(page, [
      {
        type: "handoff",
        value: {
          kind: "email",
          to: "immobiliare@domustua.it",
          subject: "Richiesta",
          body: "Vorrei informazioni.",
          label: "Lascia una richiesta",
        },
      },
      { type: "text", value: "Lasciami i tuoi dati." },
      { type: "done" },
    ]);
    await mockLead(page, { ok: false, code: "email-non-configurata" }, 503);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Mandate una mail");
    await page.getByRole("button", { name: /invia/i }).click();

    await page.getByRole("dialog").getByLabel("Nome", { exact: true }).fill("Mario Rossi");
    await page.getByRole("dialog").getByLabel("Email", { exact: true }).fill("mario@example.com");
    await page.getByRole("dialog").getByRole("checkbox").check();
    await page.getByRole("dialog").getByRole("button", { name: /invia richiesta/i }).click();

    await expect(page.getByRole("dialog").getByText(/richiesta inviata/i)).toBeHidden();
    await expect(page.getByRole("dialog").getByRole("alert")).toContainText(/whatsapp|chiamaci/i);
  });

  test("il consenso privacy è obbligatorio", async ({ page }) => {
    await mockAssistant(page, [
      {
        type: "handoff",
        value: { kind: "email", to: "x@y.it", subject: "R", body: "B", label: "Lascia una richiesta" },
      },
      { type: "text", value: "Dati?" },
      { type: "done" },
    ]);
    await apriAssistente(page);
    await page.getByPlaceholder(/scrivi qui/i).fill("mail");
    await page.getByRole("button", { name: /invia/i }).click();

    await page.getByRole("dialog").getByLabel("Nome", { exact: true }).fill("Mario");
    await page.getByRole("dialog").getByLabel("Email", { exact: true }).fill("mario@example.com");
    // Senza spuntare il consenso il browser blocca l'invio: nessuna richiesta parte.
    await page.getByRole("dialog").getByRole("button", { name: /invia richiesta/i }).click();
    await expect(page.getByRole("dialog").getByText(/richiesta inviata/i)).toBeHidden();
  });
});

test.describe("stati d'errore", () => {
  test("il provider giù produce un messaggio utile, non una bolla vuota", async ({ page }) => {
    await mockAssistant(page, [
      { type: "text", value: "In questo momento non riesco a rispondere. Puoi scriverci su WhatsApp." },
      { type: "error", value: { code: "provider-unavailable" } },
      { type: "done" },
    ]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Ciao");
    await page.getByRole("button", { name: /invia/i }).click();
    await expect(bolla(page, /non riesco a rispondere/i)).toBeVisible();
  });

  test("il rate limit ha un messaggio suo, non quello generico", async ({ page }) => {
    await mockAssistant(page, [{ type: "error", value: { code: "rate-limited" } }, { type: "done" }], 429);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Ciao");
    await page.getByRole("button", { name: /invia/i }).click();
    await expect(bolla(page, /molti messaggi di fila/i)).toBeVisible();
  });

  test("una risposta interrotta viene segnalata", async ({ page }) => {
    await mockAssistant(page, [
      { type: "text", value: "La villa ha un giardino di circa" },
      { type: "incomplete", value: { reason: "length" } },
      { type: "done" },
    ]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Parlami della villa");
    await page.getByRole("button", { name: /invia/i }).click();
    await expect(bolla(page, /si è interrotta/i)).toBeVisible();
  });
});

test.describe("accessibilità e tastiera", () => {
  test("il pannello è un dialog con nome accessibile", async ({ page }) => {
    await apriAssistente(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    await expect(dialog).toHaveAccessibleName(/assistente/i);
  });

  test("si può conversare senza mouse", async ({ page }) => {
    await mockAssistant(page, [{ type: "text", value: "Risposta." }, { type: "done" }]);
    await apriAssistente(page);

    // All'apertura il focus è già nel campo di scrittura. `pressSequentially` emette veri
    // eventi da tastiera: `fill()` scriverebbe il valore aggirando proprio ciò che si vuole
    // verificare.
    const input = page.getByPlaceholder(/scrivi qui/i);
    await expect(input).toBeFocused();
    await input.pressSequentially("Buongiorno");
    await expect(input).toHaveValue("Buongiorno");
    await input.press("Enter");
    await expect(bolla(page, "Risposta.")).toBeVisible();
  });

  test("l'ultima risposta è annunciata agli screen reader una sola volta", async ({ page }) => {
    await mockAssistant(page, [{ type: "text", value: "Risposta annunciata." }, { type: "done" }]);
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Ciao");
    await page.getByRole("button", { name: /invia/i }).click();

    const live = page.locator('[aria-live="polite"]');
    await expect(live).toHaveText("Risposta annunciata.");
    await expect(live).toHaveCount(1);
  });

  test("l'informativa privacy è raggiungibile dal pannello", async ({ page }) => {
    await apriAssistente(page);
    const privacy = page.getByRole("dialog").getByRole("link", { name: /informativa|privacy/i });
    await expect(privacy).toHaveAttribute("href", "/privacy");
  });
});

test.describe("audit finale — regressioni", () => {
  test("azzerare la conversazione mentre una risposta è in arrivo non cancella il saluto", async ({
    page,
  }) => {
    // La richiesta resta appesa: possiamo premere «Nuova conversazione» mentre è in volo.
    let sblocca: () => void = () => {};
    const appesa = new Promise<void>((r) => {
      sblocca = r;
    });
    await page.route("**/api/assistant", async (route) => {
      await appesa;
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
        body: 'data: {"type":"done"}\n\n',
      });
    });
    await apriAssistente(page);

    await page.getByPlaceholder(/scrivi qui/i).fill("Ciao");
    await page.getByRole("button", { name: /invia/i }).click();
    await expect(page.getByRole("button", { name: /ferma/i })).toBeVisible();

    await page.getByRole("button", { name: /nuova conversazione/i }).click();
    sblocca();

    // Il saluto deve restare: l'annullamento riguardava la conversazione precedente.
    await expect(bolla(page, /sono Assistente Raffaela/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerco una villa" })).toBeVisible();
  });
});
