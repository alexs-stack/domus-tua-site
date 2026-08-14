// E2E della sezione "Vivere in zona" su un BUILD DI PRODUZIONE.
//
// Finora questa sezione era verificata a mano nel browser: qui diventa un CANCELLO. Copre le
// promesse che non devono mai regredire in silenzio:
//   • la frase sull'ORIGINE dice la verità (centroide comunale ⇒ "dal centro di …", mai "dall'immobile");
//   • le distanze sono "in linea d'aria" e MAI "a piedi"/"in auto";
//   • le descrizioni d'area escono con FONTE e data di verifica;
//   • il filtro toglie una categoria senza nascondere le altre (stato parziale);
//   • l'esploratore è progressivo: non esiste finché non lo si apre;
//   • PRIVACY: nessuna coordinata nella sezione, nessun tile di mappa in rete;
//   • accessibilità: nessuna violazione axe sulla pagina.

import { test, expect, a11yViolations } from "./helpers";

const PREVIEW = "/territory-preview";

/** La sezione territoriale, individuata dal suo heading (non da una classe che può cambiare). */
function section(page: import("@playwright/test").Page) {
  return page.locator("section", { has: page.getByRole("heading", { name: "Vivere in zona" }) });
}

test.describe("Vivere in zona", () => {
  test("dichiara l'origine delle distanze e il metodo, senza mai promettere percorribilità", async ({ goto, page }) => {
    await goto(PREVIEW);
    const s = section(page);
    await expect(s).toBeVisible();

    // Origine: la fixture è a precisione comunale ⇒ la frase DEVE dire "dal centro di Tradate".
    await expect(s).toContainText("Distanze indicative dal centro di Tradate");
    await expect(s).toContainText("in linea d'aria");

    // Mai percorribilità: sono le affermazioni che non possiamo sostenere.
    const text = (await s.innerText()).toLowerCase();
    for (const vietato of ["a piedi", "in auto", "minuti a piedi"]) {
      expect(text, `la sezione non deve promettere percorribilità ("${vietato}")`).not.toContain(vietato);
    }
    // Mai giudizi di valore sulla zona.
    for (const giudizio of ["prestigios", "esclusiv", "zona sicura", "la migliore"]) {
      expect(text, `nessun giudizio soggettivo ("${giudizio}")`).not.toContain(giudizio);
    }
  });

  test("mostra le descrizioni d'area con fonte e data di verifica", async ({ goto, page }) => {
    await goto(PREVIEW);
    const s = section(page);

    await expect(page.getByRole("heading", { name: "La zona in sintesi" })).toBeVisible();
    // Ogni fatto è tracciabile: almeno una fonte cliccabile e una data di verifica.
    await expect(s).toContainText("verificato il");
    const fonte = s.getByRole("link", { name: /Trenord|Comune di Tradate|ASST|Parco Pineta/ }).first();
    await expect(fonte).toBeVisible();
    await expect(fonte).toHaveAttribute("href", /^https:\/\//);
    await expect(fonte).toHaveAttribute("rel", /noopener/);
  });

  test("il filtro toglie una categoria senza nascondere le altre", async ({ goto, page }) => {
    await goto(PREVIEW);
    const s = section(page);

    const stazione = s.getByRole("button", { name: "Stazione ferroviaria" });
    // NB: si punta alla CARD del POI (il link), non al testo: "Stazione di Tradate" compare anche
    // nella descrizione d'area ("La stazione di Tradate è servita dalla linea S40…").
    const cardStazione = s.getByRole("link", { name: "Stazione di Tradate" });

    await expect(stazione).toHaveAttribute("aria-pressed", "true");
    await expect(cardStazione).toBeVisible();

    await stazione.click();

    await expect(stazione).toHaveAttribute("aria-pressed", "false");
    await expect(cardStazione).toHaveCount(0);
    // Le altre categorie restano: una mancante non nasconde le valide.
    await expect(s.getByText("Farmacia Centrale")).toBeVisible();
    await expect(s.getByText("Esselunga")).toBeVisible();
  });

  test("l'esploratore è progressivo: compare solo dopo il click", async ({ goto, page }) => {
    await goto(PREVIEW);
    const s = section(page);

    // Prima dell'interazione non esiste nel DOM (chunk non caricato).
    await expect(page.locator("#territory-distance-explorer")).toHaveCount(0);

    const apri = s.getByRole("button", { name: "Esplora le distanze" });
    await expect(apri).toHaveAttribute("aria-expanded", "false");
    await apri.click();

    const diagramma = page.locator("#territory-distance-explorer");
    await expect(diagramma).toBeVisible();
    // È un'immagine con descrizione sintetica per screen reader, non un elemento muto.
    await expect(diagramma.getByRole("img")).toHaveAttribute("aria-label", /distanze in linea d'aria/i);
    // La didascalia dichiara che le direzioni sono illustrative: onestà del diagramma.
    await expect(diagramma).toContainText("le direzioni sono illustrative");
  });

  test("PRIVACY: nessuna coordinata nella sezione e nessun tile di mappa in rete", async ({ goto, page }) => {
    const richieste: string[] = [];
    page.on("request", (r) => richieste.push(r.url()));

    await goto(PREVIEW);
    const s = section(page);
    await s.getByRole("button", { name: "Esplora le distanze" }).click();
    await expect(page.locator("#territory-distance-explorer")).toBeVisible();

    // 1) Nessuna coordinata nel markup della sezione (l'esploratore usa percentuali, non lat/lng).
    const html = await s.innerHTML();
    expect(html).not.toMatch(/\b45\.\d{3,}/);
    expect(html).not.toMatch(/\b8\.9\d{2,}/);
    expect(html).not.toMatch(/"(lat|lng|coord)"/);

    // 2) Nessun servizio di mappe contattato: la sezione non scarica tile né geocodifica.
    const sospette = richieste.filter((u) =>
      /tile|openstreetmap\.org\/(\d|tile)|mapbox|googleapis\.com\/maps|nominatim/i.test(u),
    );
    expect(sospette, `richieste di mappa inattese: ${sospette.join(", ")}`).toHaveLength(0);
  });

  test("nessuna violazione di accessibilità sulla pagina @layout", async ({ goto, page }) => {
    await goto(PREVIEW);
    await section(page).getByRole("button", { name: "Esplora le distanze" }).click();
    await expect(page.locator("#territory-distance-explorer")).toBeVisible();

    const violazioni = await a11yViolations(page);
    expect(violazioni, JSON.stringify(violazioni, null, 2)).toHaveLength(0);
  });

  test("nessun errore di console né richiesta fallita", async ({ goto, page, guards }) => {
    await goto(PREVIEW);
    await section(page).getByRole("button", { name: "Esplora le distanze" }).click();
    await expect(page.locator("#territory-distance-explorer")).toBeVisible();

    expect(guards.consoleErrors, guards.consoleErrors.join("\n")).toHaveLength(0);
    expect(guards.failedRequests, guards.failedRequests.join("\n")).toHaveLength(0);
  });
});
