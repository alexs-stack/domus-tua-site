// La sezione d'area, provata nel browser sul build di produzione (Prompt 14).
//
// Oggi il dataset dei fatti è VUOTO, e questa suite prova esattamente quello: che il sistema si
// comporti bene quando non ha niente da dire. È il caso più importante da tenere sotto test,
// perché è quello in cui un difetto non si vede — un titolo vuoto, un contenitore senza figli,
// un «informazioni in aggiornamento» passano inosservati in revisione e restano online per mesi.
//
// I test unitari coprono le regole di proiezione. Qui si verificano le due cose che solo il
// browser può dire: cosa arriva davvero nei byte serviti, e cosa vede una persona.

import { test, expect } from "./helpers";
import { organizationJsonLd } from "../app/lib/site";

/** Il contenitore della sezione pubblica: `aria-labelledby` è il suo aggancio stabile. */
const AREA_SECTION = 'section[aria-labelledby="vivere-in-zona-title"]';

/** La prima scheda immobile dell'elenco pubblico. */
async function firstListingPath(page: import("@playwright/test").Page): Promise<string> {
  await page.goto("/acquista");
  const href = await page
    .locator('a[href^="/case/"]')
    .first()
    .getAttribute("href");
  if (!href) throw new Error("nessuna scheda in /acquista: il catalogo di prova è vuoto");
  return href;
}

test.describe("sezione d'area", () => {
  test("senza fatti approvati la sezione NON compare, e la scheda resta intera", async ({
    page,
    goto,
  }) => {
    const path = await firstListingPath(page);
    await goto(path);

    // Il fail-closed: niente fatti approvati → niente sezione.
    await expect(page.locator(AREA_SECTION)).toHaveCount(0);

    // E soprattutto: nessun MONCONE. Un titolo senza corpo, o un segnaposto di cortesia, è
    // peggio dell'assenza — dice al lettore che qui ci sarebbe qualcosa e non c'è.
    const body = await page.locator("main").innerText();
    for (const stub of [/informazioni in aggiornamento/i, /contenuto non disponibile/i, /\bTODO\b/]) {
      expect(body, `segnaposto lasciato nel DOM: ${stub}`).not.toMatch(stub);
    }

    // L'assenza deve essere una scelta, non una pagina rotta: il resto della scheda c'è.
    await expect(page.locator("h1")).toBeVisible();
  });

  test("l'unica coordinata servita al browser è la sede dell'agenzia", async ({
    page,
    request,
  }) => {
    // Requisito permanente numero 3 dell'audit: la coordinata esatta di un IMMOBILE resta lato
    // server. I tipi già lo impediscono — lo schema pubblico non ha un campo coordinata — ma un
    // tipo non è una prova: props serializzati, payload RSC e JSON-LD si scrivono a runtime.
    // Questo test guarda i byte serviti.
    //
    // Il confronto NON è «nessuna coordinata»: la sede dell'agenzia sta nei dati strutturati
    // schema.org, ed è pubblica per costruzione (è l'indirizzo sul biglietto da visita). Il
    // confronto è più stretto e più utile: **quella e nessun'altra**. Se un giorno la coordinata
    // di un immobile finisse in pagina, qui comparirebbe un secondo valore e il test cadrebbe.
    const html = await (await request.get(await firstListingPath(page))).text();

    const geo = organizationJsonLd().geo;
    const degrees = (key: "latitude" | "longitude"): string[] => [
      ...html.matchAll(new RegExp(String.raw`\\?"${key}\\?"\s*:\s*(-?\d+(?:\.\d+)?)`, "g")),
    ].map((m) => m[1]);

    expect([...new Set(degrees("latitude"))]).toEqual([String(geo.latitude)]);
    expect([...new Set(degrees("longitude"))]).toEqual([String(geo.longitude)]);

    // `lat`/`lng` abbreviati sono le chiavi dello schema INTERNO (app/lib/territory/types.ts).
    // Nei dati pubblici schema.org si scrivono per esteso: una chiave corta qui dentro non è
    // una coordinata pubblica scritta diversamente, è un record privato uscito dal server.
    expect(html).not.toMatch(/\\?"(lat|lng|lon)\\?"\s*:\s*-?\d/);
  });
});

test.describe("redazione d'area", () => {
  test("senza segreto configurato la rotta non esiste: 404, non 403", async ({ request }) => {
    // 403 direbbe «c'è qualcosa qui dietro». 404 no. La differenza è tutta la protezione che
    // una pagina interna senza login pubblico può avere.
    expect((await request.get("/area-review")).status()).toBe(404);
  });

  test("non è indicizzabile nemmeno se qualcuno la trova", async ({ request }) => {
    // robots.txt NON la vieta, ed è voluto: una pagina vietata dal crawl può finire lo stesso
    // nell'indice partendo da un link esterno, e il `noindex` in pagina non verrebbe mai letto.
    // Il divieto giusto è quello che il crawler deve poter leggere.
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).not.toMatch(/Disallow:\s*\/area-review/i);
  });

  test("non compare nella sitemap", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/area-review");
  });
});
