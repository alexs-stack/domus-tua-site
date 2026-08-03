// Regressione: la tastiera deve funzionare su TUTTO il sito.
//
// Difetto trovato durante l'onda 9, presente in produzione e indipendente dall'assistente:
// il preloader registrava un listener globale che annullava Invio, spazio e ogni lettera per
// saltare l'intro. La guardia "intro già finita" stava DENTRO la funzione di salto, cioè
// dopo `preventDefault()`, e il listener restava attaccato a `window` per tutta la vita della
// pagina. Risultato: a intro conclusa nessuno poteva più scrivere in nessun campo del sito —
// ricerca immobili e form contatti compresi.
//
// Era invisibile a ogni verifica manuale fatta con strumenti che impostano il valore dei
// campi invece di premere i tasti. Da qui la regola di questo file: SEMPRE eventi da
// tastiera veri (`pressSequentially`, `press`), mai `fill()`.

import { expect, test } from "@playwright/test";
import { consensoGiaDato } from "./mock";

test.describe("la tastiera funziona su tutto il sito", () => {
  test("nessun listener globale annulla i tasti dopo l'intro", async ({ page }) => {
    await consensoGiaDato(page);
    await page.goto("/");
    // Ben oltre la durata dell'intro.
    await page.waitForTimeout(6000);

    const prevenuti = await page.evaluate(() => {
      const prova = (key: string) => {
        const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
        document.body.dispatchEvent(ev);
        return ev.defaultPrevented;
      };
      return { lettera: prova("a"), invio: prova("Enter"), spazio: prova(" ") };
    });

    expect(prevenuti.lettera, "una lettera non deve essere annullata").toBe(false);
    expect(prevenuti.invio, "Invio non deve essere annullato").toBe(false);
    expect(prevenuti.spazio, "lo spazio non deve essere annullato").toBe(false);
  });

  test("si può scrivere nella ricerca immobili del sito", async ({ page }) => {
    await consensoGiaDato(page);
    await page.goto("/acquista");
    await page.waitForTimeout(6000);

    const campo = page.locator('input[type="search"], input[type="text"]').first();
    await campo.focus();
    await campo.pressSequentially("tradate");
    await expect(campo).toHaveValue("tradate");
  });
});
