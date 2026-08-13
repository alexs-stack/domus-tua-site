import { test, expect, setConsent } from "./helpers";

// Consenso e recensioni. La regola è una sola e non ammette sfumature: **prima del consenso,
// nessuna richiesta a terze parti**. Il widget recensioni è il caso concreto.

test("prima del consenso nessuna richiesta parte verso il widget recensioni", async ({ page, goto }) => {
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    const url = r.url();
    if (/trustindex|google|gstatic/i.test(url)) thirdParty.push(url);
  });

  await goto("/recensioni");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Il banner è lì e chiede di scegliere.
  await expect(page.getByRole("region", { name: /cookie/i })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500);

  expect(thirdParty, `richieste partite senza consenso:\n${thirdParty.join("\n")}`).toEqual([]);
});

test("rifiutando i cookie il widget resta chiuso e la pagina resta utile", async ({ page, goto }) => {
  await setConsent(page, "rejected");
  const thirdParty: string[] = [];
  page.on("request", (r) => {
    if (/trustindex/i.test(r.url())) thirdParty.push(r.url());
  });

  await goto("/recensioni");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForTimeout(1500);

  expect(thirdParty).toEqual([]);
  // Senza widget la pagina non è vuota: le recensioni verificate restano leggibili.
  await expect(page.locator("#main")).toContainText(/recension|google/i);
});

test("accettando, il gate si apre", async ({ page, goto }) => {
  await setConsent(page, "accepted");
  await goto("/recensioni");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Il banner non ricompare a chi ha già scelto.
  await page.waitForTimeout(1200);
  await expect(page.getByRole("region", { name: /cookie/i })).toHaveCount(0);
});

test("col consenso il widget recensioni resta pigro finché non ci si avvicina", async ({
  page,
  goto,
  guards,
}) => {
  // `guards` monta il mock delle terze parti: lo script di Trustindex, se
  // parte, viene servito vuoto invece di raggiungere la rete.
  void guards;
  await setConsent(page, "accepted");

  await goto("/");
  // Il widget vive in fondo al capitolo recensioni, sotto la piega. Il suo
  // iframe usa `srcDoc`, su cui `loading="lazy"` non ha effetto: senza il
  // cancello IntersectionObserver monterebbe — e caricherebbe Trustindex — già
  // al primo paint, mentre si guarda ancora l'hero (~700ms di thread principale
  // di terze parti, misurati). Deve restare fuori dal DOM.
  const frame = page.locator('iframe[title*="Trustindex" i]');
  await page.waitForTimeout(1200);
  await expect(frame).toHaveCount(0);

  // Avvicinandosi (rootMargin 600px), il cancello si arma e l'iframe monta.
  await page
    .getByRole("heading", {
      name: /parola per parola|word for word|mot pour mot|wort für wort|palabra por palabra/i,
    })
    .scrollIntoViewIfNeeded();
  await expect(frame).toHaveCount(1, { timeout: 10_000 });
});

test("il banner si usa con la tastiera e non intrappola il focus @layout", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "il Tab si verifica sui viewport desktop: su un dispositivo touch non c'è");
  await goto("/");
  const banner = page.getByRole("region", { name: /cookie/i });
  await expect(banner).toBeVisible({ timeout: 15_000 });

  // QUESTO TEST ASSERIVA IL CONTRARIO DEL PROPRIO TITOLO, e per tutto il tempo
  // in cui è esistito: si chiama «non intrappola il focus» e pretendeva che il
  // Tab restasse dentro il banner, cioè esattamente una trappola. Il titolo
  // diceva l'intenzione, il corpo l'incidente.
  // Dalla Fase 4 il banner non è più `role="dialog" aria-modal="true"`: quella
  // coppia prometteva a chi legge con uno screen reader che il resto della
  // pagina fosse indisponibile, mentre non lo era. Un avviso sui cookie non è
  // un compito che l'utente ha scelto di iniziare — è una regione con azioni.
  // Quindi: nessun furto del focus al caricamento, e il Tab esce.

  // Non ruba il focus: si arriva al banner tabulando, non venendoci sbattuti.
  await expect(banner.getByRole("button", { name: /accetta/i })).not.toBeFocused();

  // È raggiungibile SUBITO — sta appena dopo lo skip-link, che è dove sta anche
  // per gli occhi. Se finisse in fondo al DOM sarebbe l'ultima cosa raggiungibile
  // su una home da 46 schermate.
  let dentro = false;
  for (let i = 0; i < 4 && !dentro; i++) {
    await page.keyboard.press("Tab");
    dentro = await banner.evaluate((b) => b.contains(document.activeElement));
  }
  expect(dentro, "il banner non si raggiunge con pochi Tab dall'inizio della pagina").toBe(true);

  // E il Tab ESCE: continuando si finisce nella pagina, non in un anello.
  let uscito = false;
  for (let i = 0; i < 6 && !uscito; i++) {
    await page.keyboard.press("Tab");
    uscito = !(await banner.evaluate((b) => b.contains(document.activeElement)));
  }
  expect(uscito, "il focus è rimasto intrappolato nel banner").toBe(true);

  // La scelta si fa comunque da tastiera.
  await banner.getByRole("button", { name: /accetta/i }).press("Enter");
  await expect(banner).toHaveCount(0);
});

test("il link 'Preferenze cookie' riapre il banner dopo una scelta (revoca a un clic)", async ({ page, goto }) => {
  // La Cookie Policy promette di poter cambiare idea «in qualsiasi momento»: dev'essere vero.
  // Pagina senza intro/preloader, così il test misura il riapri-banner, non l'animazione.
  await setConsent(page, "accepted");
  await goto("/recensioni");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // Chi ha già scelto non vede il banner.
  await page.waitForTimeout(1000);
  const banner = page.getByRole("region", { name: /cookie/i });
  await expect(banner).toHaveCount(0);

  // Il link "Preferenze cookie" nel footer esiste, è etichettato e riapre il pannello.
  // Si attiva il vero onClick via evaluate: su alcune pagine una sezione animata copre il
  // footer e intercetterebbe il puntatore — è un artefatto di layout del test, non del bottone
  // (la clicabilità reale è verificata a parte). Ciò che conta qui è il comportamento: riapre.
  const reopen = page.getByRole("button", { name: /preferenze cookie/i });
  await expect(reopen).toBeVisible();
  await reopen.evaluate((el) => (el as HTMLButtonElement).click());
  await expect(banner).toBeVisible({ timeout: 5_000 });
});
