// Verifica end-to-end della scheda immobile, sul build di produzione.
//
// Caso principale: l'attico duplex di Via Petrarca 7 (rif. T447), lo stesso annuncio dello
// screenshot da cui è partito tutto il lavoro. Se il feed cambia, il test cerca comunque
// l'immobile giusto dall'elenco invece di dipendere da uno slug scritto a mano.

import { test, expect, type Page } from "@playwright/test";

/** Riferimento commerciale dell'annuncio di riferimento. */
const TARGET_REF = "T447";
/** Frammento presente nella descrizione: identifica l'annuncio anche se cambia lo slug. */
const TARGET_TEXT = "Monte Rosa";

let cachedPath: string | null = null;

/** Trova la scheda dell'attico partendo dall'elenco pubblico. */
async function targetPath(page: Page): Promise<string> {
  if (cachedPath) return cachedPath;

  await page.goto("/case");
  const links = await page.locator('a[href^="/case/"]').evaluateAll((els) =>
    [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))],
  );

  for (const href of links) {
    if (/attico|petrarca/i.test(href)) {
      await page.goto(href);
      const body = await page.locator("main").innerText();
      if (body.includes(TARGET_REF) || body.includes(TARGET_TEXT)) {
        cachedPath = href;
        return href;
      }
    }
  }
  throw new Error(
    `Nessuna scheda con "${TARGET_REF}"/"${TARGET_TEXT}" tra ${links.length} annunci: ` +
      "il feed RealSmart potrebbe non contenere più l'attico di riferimento.",
  );
}

async function openTarget(page: Page) {
  await page.goto(await targetPath(page));
  await expect(page.locator("h1")).toBeVisible();
}

/**
 * Prepara la pagina per un confronto pixel stabile: registra il consenso ai cookie (il banner
 * è fisso e coprirebbe il contenuto) e nasconde gli elementi in position: fixed, che nello
 * screenshot di un singolo elemento verrebbero disegnati sopra di esso.
 */
async function prepareForScreenshot(page: Page) {
  await page.context().addCookies([
    { name: "dt_consent", value: "accepted", url: page.url() },
  ]);
  await page.addStyleTag({
    content: "header, [aria-labelledby='cookie-consent-title'], a[href*='wa.me'][class*='fixed'] { display: none !important; }",
  });
}

/** Testo del box il cui titolo corrisponde. */
function box(page: Page, title: string) {
  return page.locator("main aside section").filter({ has: page.getByRole("heading", { name: title }) });
}

test.describe("scheda immobile — attico di riferimento", () => {
  test("nessun markup a schermo e descrizione in veri paragrafi", async ({ page }) => {
    await openTarget(page);

    const description = page.locator("main").getByRole("heading", { name: "Descrizione" }).locator("..");
    const text = await description.innerText();

    expect(text).not.toContain("<br");
    expect(text).not.toMatch(/&(amp|lt|gt|nbsp|quot);/);
    expect(text).not.toMatch(/<\/?[a-z][^>]*>/i);

    const paragraphs = description.locator("p");
    expect(await paragraphs.count()).toBeGreaterThan(3);
    for (const p of await paragraphs.all()) {
      expect((await p.innerText()).trim().length).toBeGreaterThan(0);
    }
  });

  test("i dati tecnici sono nei box giusti", async ({ page }) => {
    await openTarget(page);

    await expect(box(page, "Esterni e pertinenze")).toContainText("Terrazzi");
    await expect(box(page, "Esterni e pertinenze")).toContainText("2");
    await expect(box(page, "Esterni e pertinenze")).toContainText("Autorimesse");

    await expect(box(page, "Comfort e impianti")).toContainText("Riscaldamento");
    await expect(box(page, "Comfort e impianti")).toContainText("a pavimento");
    await expect(box(page, "Comfort e impianti")).toContainText("Cappotto termico");
    await expect(box(page, "Comfort e impianti")).toContainText("parquet");
    await expect(box(page, "Comfort e impianti")).toContainText("Ascensore");

    await expect(box(page, "Spazi")).toContainText("Cucina abitabile");
    await expect(box(page, "Spazi")).toContainText("Studio");

    await expect(box(page, "Punti di forza")).toContainText("Vista");
    await expect(box(page, "Punti di forza")).toContainText("Monte Rosa");
  });

  test("«Classe B» compare solo come classe energetica validata", async ({ page }) => {
    await openTarget(page);

    // Il valore c'è, ma sempre accanto alla sua etichetta: mai come "Classe B" sciolta.
    const dati = box(page, "Dati principali");
    await expect(dati).toContainText("Classe energetica");
    await expect(dati.locator("dd").filter({ hasText: /^B$/ })).toHaveCount(1);

    const main = await page.locator("main").innerText();
    expect(main).not.toMatch(/\bClasse B\b(?!\s*·)/);
  });

  test("la riga telegrafica non viene ripetuta nel testo narrativo", async ({ page }) => {
    await openTarget(page);
    const description = await page
      .locator("main")
      .getByRole("heading", { name: "Descrizione" })
      .locator("..")
      .innerText();

    expect(description).not.toContain("Classe B · Doppio terrazzo");
    // …ma il racconto in cui le stesse cose sono narrate resta intatto.
    expect(description).toContain("soggiorno");
    expect(description).toContain("Monte Rosa");
    expect(description.length).toBeGreaterThan(2000);
  });

  test("nessun dato duplicato fra striscia superiore e sidebar", async ({ page }) => {
    await openTarget(page);

    const strip = page.locator("main dl").first();
    const stripLabels = await strip.locator("dt").allInnerTexts();
    expect(stripLabels.map((s) => s.toLowerCase()).sort()).toEqual([
      "bagni",
      "camere",
      "locali",
      "superficie",
    ]);

    // Prezzo e riferimento: una volta ciascuno.
    const main = await page.locator("main").innerText();
    expect(main.match(/370\.000/g)?.length ?? 0).toBe(1);
    expect(main.match(/Rif\. T447/g)?.length ?? 0).toBe(1);
  });

  test("nessun «—» e nessun box vuoto", async ({ page }) => {
    await openTarget(page);

    for (const dd of await page.locator("main aside dd").all()) {
      const value = (await dd.innerText()).trim();
      expect(value).not.toBe("");
      expect(value).not.toBe("—");
      expect(value.toLowerCase()).not.toBe("no");
    }
    for (const section of await page.locator("main aside section").all()) {
      expect(await section.locator("dt, li").count()).toBeGreaterThan(0);
    }
  });

  test("le CTA sono raggiungibili e la sidebar non è mai bloccata", async ({ page }) => {
    await openTarget(page);

    await expect(page.getByRole("link", { name: /Richiedi una visita/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Parla con Domus Tua/i }).first()).toBeVisible();

    // Nessuno scroll interno nell'aside: tutto si raggiunge con lo scroll normale della pagina.
    const innerScrollers = await page.locator("main aside *").evaluateAll((els) =>
      els.filter((e) => ["auto", "scroll"].includes(getComputedStyle(e).overflowY)).length,
    );
    expect(innerScrollers).toBe(0);

    // L'ultimo box della sidebar si raggiunge scorrendo.
    const last = page.locator("main aside section").last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeVisible();
  });

  test("nessun overflow orizzontale", async ({ page }) => {
    await openTarget(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("accessibilità: gerarchia dei titoli e coppie label/valore", async ({ page }) => {
    await openTarget(page);

    expect(await page.locator("main h1").count()).toBe(1);
    expect(await page.locator("main h2").count()).toBeGreaterThan(4);

    // Ogni dt ha il suo dd: nessuna etichetta orfana.
    const pairs = await page.locator("main dl").evaluateAll((lists) =>
      lists.map((l) => ({ dt: l.querySelectorAll("dt").length, dd: l.querySelectorAll("dd").length })),
    );
    for (const p of pairs) expect(p.dt).toBe(p.dd);

    // Le icone di spunta sono decorative: l'informazione è sempre anche testo.
    const ticks = await page.locator("main aside li svg").count();
    if (ticks > 0) {
      const labelled = await page.locator("main aside li").evaluateAll((items) =>
        items.every((li) => (li.textContent ?? "").trim().length > 0),
      );
      expect(labelled).toBe(true);
    }
  });

  test("reduced motion: la preferenza arriva alla pagina e i dati restano visibili", async ({ page }) => {
    await openTarget(page);

    const reduced = await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    expect(reduced).toBe(true);

    // Con le animazioni d'ingresso disattivate i numeri devono essere comunque leggibili:
    // il rischio è che restino a opacity 0 in attesa di un tween che non parte mai.
    for (const dd of await page.locator("main dl").first().locator("dd").all()) {
      await expect(dd).toBeVisible();
      expect(await dd.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.9);
    }
  });

  test("navigazione da tastiera: le CTA sono focalizzabili", async ({ page }) => {
    await openTarget(page);
    const cta = page.getByRole("link", { name: /Richiedi una visita/i }).first();
    await cta.focus();
    await expect(cta).toBeFocused();
  });
});

test.describe("scheda immobile — robustezza", () => {
  // Le due prove che attraversano molte schede girano su un solo viewport: verificano il
  // CONTENUTO, non il layout, e ripeterle su cinque viewport allunga la suite senza aggiungere
  // informazione. Sono lente perché ogni scheda è server-rendered sul feed reale.
  test.beforeEach(({}, testInfo) => {
    if (testInfo.title.startsWith("[una sola volta]")) {
      test.skip(testInfo.project.name !== "desktop-1440", "prova di contenuto: basta un viewport");
      test.slow(); // ogni scheda è server-rendered sul feed reale
    }
  });

  test("zoom 200%: nessun overflow e CTA ancora visibile", async ({ page }) => {
    await openTarget(page);
    const viewport = page.viewportSize()!;
    // Emula lo zoom del browser dimezzando il viewport CSS a parità di contenuto.
    await page.setViewportSize({
      width: Math.round(viewport.width / 2),
      height: Math.round(viewport.height / 2),
    });
    await expect(page.getByRole("link", { name: /Richiedi una visita/i }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await page.setViewportSize(viewport);
  });

  test("[una sola volta] descrizione molto lunga: la pagina resta leggibile", async ({ page }) => {
    await page.goto("/case");
    const hrefs = await page.locator('a[href^="/case/"]').evaluateAll((els) =>
      [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))],
    );
    let longest = { href: "", chars: 0 };
    for (const href of hrefs.slice(0, 8)) {
      await page.goto(href);
      const chars = (await page.locator("main p").allInnerTexts()).join(" ").length;
      if (chars > longest.chars) longest = { href, chars };
    }
    await page.goto(longest.href);
    // Il testo non deve mai correre per tutta la larghezza dello schermo.
    const width = await page
      .locator("main")
      .getByRole("heading", { name: "Descrizione" })
      .locator("xpath=following-sibling::div[1]")
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeLessThanOrEqual(760);
  });

  test("[una sola volta] un immobile senza caratteristiche estratte non mostra box vuoti", async ({ page }) => {
    await page.goto("/case");
    const hrefs = await page.locator('a[href^="/case/"]').evaluateAll((els) =>
      [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))],
    );
    for (const href of hrefs.slice(0, 10)) {
      await page.goto(href);
      for (const section of await page.locator("main aside section").all()) {
        expect(await section.locator("dt, li").count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe("regressione visiva", () => {
  test("colonna narrativa + box strutturati", async ({ page }, testInfo) => {
    await openTarget(page);
    await prepareForScreenshot(page);
    await page.reload();
    await prepareForScreenshot(page);
    await page.waitForLoadState("networkidle").catch(() => {});

    // Si fotografa SOLO il blocco che questa modifica ridisegna. Una fullPage includerebbe la
    // gallery (che ruota) e la striscia degli immobili correlati (che dipende dal feed):
    // rumore che farebbe fallire il confronto senza dire nulla sul layout.
    const block = page
      .locator("main")
      .getByRole("heading", { name: "Descrizione" })
      .locator("xpath=ancestor::div[contains(@class,'grid')][1]");

    await expect(block).toHaveScreenshot(`scheda-${testInfo.project.name}.png`, {
      mask: [page.locator("main img"), page.locator("main canvas")],
    });
  });
});
