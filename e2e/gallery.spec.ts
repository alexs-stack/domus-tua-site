import { test, expect, clickUntil } from "./helpers";
import AxeBuilder from "@axe-core/playwright";

// Accessibilità e interazione della galleria della scheda immobile
// (app/components/PropertyGallery.tsx): alt della foto principale, miniature
// mute dentro controlli con nome, navigazione da tastiera, semantica tab/tabpanel.

async function gotoFirstListing(
  page: import("@playwright/test").Page,
  goto: (p: string) => Promise<void>
) {
  await goto("/acquista");
  const first = page.locator('#main a[href^="/case/"]').first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/case\/[a-z0-9-]+/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/**
 * Apre una scheda con ALMENO `min` foto, provando le prime schede del catalogo.
 *
 * Serve perché i test del carosello, con un semplice `test.skip` sul conteggio,
 * venivano SALTATI tutti: la prima scheda di /acquista ha poche foto e il nastro
 * lì non scorre nemmeno. Un test che non gira è peggio di nessun test — dà la
 * riga verde senza aver guardato niente.
 */
async function gotoListingConFoto(
  page: import("@playwright/test").Page,
  goto: (p: string) => Promise<void>,
  min: number
): Promise<number> {
  await goto("/acquista");
  const href = page.locator('#main a[href^="/case/"]');
  await expect(href.first()).toBeVisible();
  const rotte = (
    await href.evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href"))
    )
  )
    .filter((h): h is string => !!h)
    .filter((h, i, arr) => arr.indexOf(h) === i)
    .slice(0, 8);

  for (const r of rotte) {
    await goto(r);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const n = await page.getByRole("tab").count();
    if (n >= min) return n;
  }
  throw new Error(
    `nessuna delle prime ${rotte.length} schede del catalogo ha almeno ${min} foto`
  );
}

test("la foto principale ha un alt descrittivo dai campi dell'annuncio, non posizionale", async ({
  page,
  goto,
}) => {
  await gotoFirstListing(page, goto);
  const title = ((await page.getByRole("heading", { level: 1 }).first().textContent()) ?? "").trim();
  expect(title.length).toBeGreaterThan(0);

  const panel = page.locator('[role="tabpanel"]').first();
  await expect(panel).toBeVisible();
  const alt = await panel.locator("img").first().getAttribute("alt");
  expect(alt, "la foto principale deve avere un alt").toBeTruthy();
  // Non è l'alt posizionale ("foto N di M"): sulla principale è descrittivo.
  expect(alt ?? "").not.toMatch(/foto \d+ di \d+/i);
  // Usa il titolo verificato dell'annuncio.
  expect(alt ?? "").toContain(title);
});

test("le miniature sono duplicati muti dentro controlli con nome accessibile", async ({
  page,
  goto,
}) => {
  await gotoFirstListing(page, goto);
  const tabs = page.getByRole("tab");
  const n = await tabs.count();
  expect(n, "la scheda usata ha più foto (miniature)").toBeGreaterThan(1);

  for (let i = 0; i < n; i++) {
    // Il controllo ha un nome accessibile chiaro…
    await expect(tabs.nth(i)).toHaveAccessibleName(/foto \d+ di \d+/i);
    // …e l'immagine dentro è MUTA (alt=""): è un duplicato della foto grande,
    // non deve creare rumore ripetuto sullo screen reader.
    expect(await tabs.nth(i).locator("img").getAttribute("alt")).toBe("");
  }
});

test("la galleria si naviga da tastiera: le frecce cambiano foto, selezione e pannello", async ({
  page,
  goto,
  isMobile,
}) => {
  test.skip(
    !!isMobile,
    "la navigazione da tastiera si verifica su desktop: un dispositivo touch non ha tastiera fisica"
  );
  await gotoFirstListing(page, goto);
  const tabs = page.getByRole("tab");

  // Prova di idratazione: si RIPROVA il click su una miniatura diversa finché la
  // selezione cambia (l'HTML arriva prima del JS; un click un istante troppo
  // presto non trova ancora il gestore). Quando il click "prende", `onKeyDown`
  // dello stesso componente è attaccato e la tastiera è verificabile senza flake.
  await clickUntil(
    () => tabs.nth(1).click(),
    () => expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true")
  );

  // Ora la tastiera: `locator.press` dà il focus E preme sul tab, così la freccia
  // arriva proprio a quel controllo (più affidabile di focus()+keyboard.press).
  // Da tab 1, ArrowLeft torna a tab 0 (selezione + focus).
  await tabs.nth(1).press("ArrowLeft");
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "false");

  // Il pannello immagine è etichettato dal tab ATTIVO (aria-labelledby aggiornato)…
  const panel = page.locator('[role="tabpanel"]').first();
  const activeId = await tabs.nth(0).getAttribute("id");
  expect(activeId).toBeTruthy();
  await expect(panel).toHaveAttribute("aria-labelledby", activeId ?? "");
  // …e i tab controllano il pannello.
  await expect(tabs.nth(0)).toHaveAttribute("aria-controls", (await panel.getAttribute("id")) ?? "");
});

test("l'anteprima immobile è un dialog accessibile: Esc chiude e ripristina il focus", async ({
  page,
  goto,
  isMobile,
}) => {
  test.skip(!!isMobile, "il trap del focus e il ripristino si verificano su desktop (tastiera)");
  await goto("/acquista");
  // Il bottone "Anteprima" apre CaseQuickLook (un dialog con la foto dell'immobile).
  const trigger = page.getByRole("button", { name: /anteprima:|quick look:/i }).first();
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  // Esc chiude il dialog e riporta il focus al bottone che l'ha aperto.
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("nessuna violazione di accessibilità nella regione galleria @layout", async ({ page, goto }) => {
  await gotoFirstListing(page, goto);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include('[role="tabpanel"]')
    .include('[role="tablist"]')
    .analyze();
  const violations = results.violations.map((v) => ({ id: v.id, help: v.help }));
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

// ── Il carosello: frecce sulla foto e nastro scorrevole ──────────────────────
//
// La griglia a 4 colonne stampava TUTTE le miniature: su una scheda da 46 foto
// erano dodici righe sotto la foto grande, su una da 77 erano venti. Ora il
// nastro ne mostra quante ne stanno e le altre le tiene in corsa.

test("le frecce sfogliano le foto, e clic rapidi avanzano di uno per volta", async ({
  page,
  goto,
}) => {
  const n = await gotoListingConFoto(page, goto, 12);
  const next = page.getByRole("button", { name: "Foto successiva" });
  const tabs = page.getByRole("tab");

  // Idratazione: si riprova finché il primo clic "prende".
  await clickUntil(
    () => next.click(),
    () => expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true")
  );

  // CINQUE clic NELLO STESSO TICK devono avanzare di CINQUE, non di uno.
  //
  // I clic si sparano da `page.evaluate`, non con cinque `await next.click()`:
  // Playwright aspetta fra un clic e l'altro, quindi ogni clic cade in un render
  // diverso e il difetto NON si riproduce — il test passerebbe anche con il bug
  // dentro (verificato: 23 verdi con la regressione reintrodotta). Nello stesso
  // tick invece `select(active + 1)` legge cinque volte lo stesso `active` e la
  // galleria avanza di una foto sola. È il caso di chi martella la freccia.
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button[aria-label]")].find(
      (x) => x.getAttribute("aria-label") === "Foto successiva"
    ) as HTMLButtonElement | undefined;
    for (let i = 0; i < 5; i++) b?.click();
  });
  await expect(tabs.nth(6)).toHaveAttribute("aria-selected", "true");

  // E il giro: dalla prima, indietro si arriva all'ultima.
  const prev = page.getByRole("button", { name: "Foto precedente" });
  for (let i = 0; i < 6; i++) await prev.click();
  await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
  await prev.click();
  await expect(tabs.nth(n - 1)).toHaveAttribute("aria-selected", "true");
});

test("il nastro insegue la miniatura attiva senza muovere la pagina @layout", async ({
  page,
  goto,
}) => {
  const n = await gotoListingConFoto(page, goto, 12);
  const tabs = page.getByRole("tab");

  const next = page.getByRole("button", { name: "Foto successiva" });
  await clickUntil(
    () => next.click(),
    () => expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true")
  );

  const pageYPrima = await page.evaluate(() => window.scrollY);
  for (let i = 0; i < n - 2; i++) await next.click();

  // L'ULTIMA miniatura è in vista dentro il nastro…
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const rail = document.querySelector(".dt-gallery-rail");
        const att = [...document.querySelectorAll('[role="tab"]')].find(
          (t) => t.getAttribute("aria-selected") === "true"
        );
        if (!rail || !att) return false;
        const rr = rail.getBoundingClientRect();
        const er = att.getBoundingClientRect();
        return er.left >= rr.left - 2 && er.right <= rr.right + 2;
      })
    )
    .toBe(true);

  // …e la PAGINA non si è mossa. È il motivo per cui non si usa scrollIntoView:
  // quello scorre anche gli antenati e farebbe saltare la scheda a ogni foto.
  expect(await page.evaluate(() => window.scrollY)).toBe(pageYPrima);
});

test("le frecce del nastro si spengono a fine corsa, e non mentono @layout", async ({
  page,
  goto,
}) => {
  await gotoListingConFoto(page, goto, 12);

  const indietro = page.getByRole("button", { name: "Scorri le miniature indietro" });
  const avanti = page.getByRole("button", { name: "Scorri le miniature avanti" });

  // A nastro fermo all'inizio: indietro spenta, avanti accesa.
  await expect(indietro).toBeDisabled();
  await expect(avanti).toBeEnabled();

  // Dopo aver scorso, indietro si accende. Lo stato si RIMISURA dopo lo
  // spostamento: aspettare solo l'evento `scroll` lasciava la freccia spenta
  // con il nastro già a fondo corsa — un controllo che mente su dove si trova.
  await clickUntil(
    () => avanti.click(),
    () => expect(indietro).toBeEnabled()
  );
});
