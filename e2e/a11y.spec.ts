import type { Page } from "@playwright/test";
import sharp from "sharp";
import { test, expect, setConsent, a11yViolations, videoTile } from "./helpers";

/* A46 (Alberto, 21 set. 2026, sera): il cielo delle foto alte è trasparente e le scritte delle teste
   stanno sull'avorio, nell'inchiostro della rivista: la deroga a WCAG 1.4.3 delle scritte bianche sulla
   foto (A38 + A40) è chiusa. axe non misura un testo che ha un <img> nella pila (lo segna «incomplete»,
   `imgNode`), quindi il contrasto di h1 e lead si misura qui sui pixel resi: si nasconde il testo, si
   campiona il colore medio della carta nel suo rettangolo e si calcola il rapporto WCAG col colore
   calcolato del testo. Il pavimento è 4,5:1 anche per l'H1 (che da grande basterebbe a 3:1). */
const lineare = (v: number) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
const luminanza = ([r, g, b]: number[]) => 0.2126 * lineare(r) + 0.7152 * lineare(g) + 0.0722 * lineare(b);
const rapporto = (a: number[], b: number[]) => {
  const [l1, l2] = [luminanza(a), luminanza(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
async function contrastoSullaCarta(page: Page, selettore: string) {
  const el = page.locator(selettore).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const info = await el.evaluate((n) => {
    const r = n.getBoundingClientRect();
    const colore = getComputedStyle(n).color.match(/\d+/g)!.map(Number).slice(0, 3);
    (n as HTMLElement).style.setProperty("visibility", "hidden");
    return { x: r.left, y: r.top, w: r.width, h: r.height, colore };
  });
  const png = await page.screenshot({ clip: { x: Math.max(0, info.x), y: Math.max(0, info.y), width: Math.max(1, info.w), height: Math.max(1, info.h) }, animations: "disabled" });
  await el.evaluate((n) => (n as HTMLElement).style.removeProperty("visibility"));
  const { data, info: meta } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const somma = [0, 0, 0];
  const n = meta.width * meta.height;
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) somma[c] += data[i * meta.channels + c];
  const fondo = somma.map((v) => Math.round(v / n));
  return { rapporto: rapporto(info.colore, fondo), testo: info.colore, fondo };
}

// Accessibilità automatizzata: axe su WCAG 2.1 A/AA, contrasto compreso.
//
// Un controllo automatico non certifica l'accessibilità — trova una parte dei problemi, non
// tutti. Ma i problemi che trova sono veri, e questa suite impedisce che tornino.

// Reduced motion: le rivelazioni parola-per-parola passano da opacità intermedie, e axe
// misurerebbe il contrasto di un testo a metà dissolvenza. Con la preferenza attiva il testo è
// nel suo stato finale — che è poi quello che deve essere leggibile.
test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

// Le rotte scoperte erano sei — /chi-siamo, /recensioni, /servizi, /lavora-con-noi,
// /domande-frequenti e /cookie — cioè un terzo del sito fuori dalla passata axe. Il §4.5
// del Documento finale smonta il falso positivo sui «9 link privi di nome accessibile»,
// e ha ragione: ma un presidio vale solo per le pagine che guarda.
const PAGES = [
  "/", "/acquista", "/case-vendute", "/valutazione-immobile-tradate", "/vendi", "/metodo",
  "/open-domus", "/contatti", "/privacy", "/chi-siamo", "/recensioni", "/servizi",
  "/lavora-con-noi", "/domande-frequenti", "/cookie",
];

for (const path of PAGES) {
  test(`${path} non ha violazioni di accessibilità`, async ({ page, goto }) => {
    await goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // La testa di era (A38/A41/A46): le scritte stanno sull'avorio sopra il soggetto, e la foto
    // col cielo trasparente sta sotto. Sul build la prima richiesta a next/image di una sorgente
    // da 2560 px dura secondi: si aspetta la foto, così la misura è quella della pagina finita.
    const foto = page.locator("img[data-testa-foto]");
    if (await foto.count()) {
      await foto.evaluate((img) => {
        const el = img as HTMLImageElement;
        return el.complete && el.naturalWidth > 0
          ? undefined
          : new Promise<void>((r) => el.addEventListener("load", () => r(), { once: true }));
      });
      // Il blocco dei testi cresce dove non ci sta (D177: /open-domus a 390×664, l'iPhone 13 del
      // progetto mobile): l'ultimo comando finisce sotto la piega. Si scorre del minimo che porta
      // l'ultimo testo del blocco dentro il viewport (0 dove ci sta già).
      const oltre = await page.evaluate(() => {
        const testi = Array.from(document.querySelectorAll(".dt-testa_blocco a, .dt-testa_blocco p, .dt-testa_blocco h1"));
        const fondo = Math.max(0, ...testi.map((t) => t.getBoundingClientRect().bottom));
        return Math.max(0, Math.ceil(fondo - window.innerHeight));
      });
      if (oltre > 0) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), oltre);
        await page.waitForTimeout(300);
      }
    }
    // Le animazioni d'ingresso partono allo scroll: si dà loro il tempo di posarsi, altrimenti
    // axe misura il contrasto di un testo a metà dissolvenza.
    await page.waitForTimeout(600);

    const violations = await a11yViolations(page);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

    // A46: sulle teste h1 e lead reggono 4,5:1 sulla carta, misurato sui pixel (la deroga 1.4.3 è chiusa).
    if (await foto.count()) {
      for (const sel of [".dt-testa_blocco h1", ".dt-testa_blocco p.lead"]) {
        const c = await contrastoSullaCarta(page, sel);
        expect(c.rapporto, `${path} ${sel}: rgb(${c.testo}) su rgb(${c.fondo}) fa ${c.rapporto.toFixed(2)}:1, sotto 4,5:1`).toBeGreaterThanOrEqual(4.5);
        for (let i = 0; i < 3; i++) expect(Math.abs(c.fondo[i] - [249, 245, 239][i]), `${path} ${sel}: sotto il testo non c'è la carta (rgb(${c.fondo}))`).toBeLessThanOrEqual(3);
      }
    }
  });
}

test("il contrasto regge anche sul pannello dell'assistente", async ({ page, goto }) => {
  await goto("/");
  const launcher = page.getByRole("button", { name: /assistente/i }).first();
  await expect(async () => {
    await launcher.click();
    // Il pannello dell'assistente è un dialogo VERO — si apre perché lo si è
    // chiesto, e intrappola il focus davvero. Resta `role="dialog"`: è il
    // banner cookie ad aver smesso di fingersi modale (Fase 4), non questo.
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 25_000 });

  const violations = await a11yViolations(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test("il banner cookie è accessibile", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("region", { name: /cookie/i })).toBeVisible({ timeout: 15_000 });

  const violations = await a11yViolations(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test("si naviga con la sola tastiera, e si vede dove si è", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "il Tab si verifica sui viewport desktop: su un dispositivo touch non c'è");
  await goto("/");

  // Primo Tab: il salto al contenuto, che deve essere raggiungibile e visibile.
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: /salta al contenuto/i });
  await expect(skip).toBeFocused();

  // L'anello di focus è visibile: nessun outline azzerato senza sostituto.
  const outline = await skip.evaluate((el) => {
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle, shadow: s.boxShadow };
  });
  const hasRing = outline.style !== "none" || outline.shadow !== "none";
  expect(hasRing, "il focus non si vede").toBe(true);

  // Da lì si arriva al contenuto principale.
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
});

test("ogni immagine ha un'alternativa testuale sensata", async ({ page, goto }) => {
  await goto("/acquista");
  const missing = await page.locator("img:not([alt])").count();
  expect(missing, "immagini senza attributo alt").toBe(0);
});

test("la gerarchia dei titoli parte da un solo h1", async ({ page, goto }) => {
  for (const path of ["/", "/acquista", "/vendi", "/contatti"]) {
    await goto(path);
    const h1 = await page.locator("h1").count();
    expect(h1, `${path} ha ${h1} h1`).toBe(1);
  }
});

// Il dialog del video in pagina (§6.5). Sta qui e non in home.spec.ts perché la
// domanda è la stessa delle altre passate axe: una superficie nuova che copre lo
// schermo è anche una superficie nuova da cui non si deve restare intrappolati.
// Il comando che lo apre è una tessera di «Le voci» (helpers: videoTile).
test("il dialog del video non ha violazioni di accessibilità", async ({ page, goto }) => {
  // Prima dell'idratazione il link fa quel che dice l'href (YouTube in una scheda nuova):
  // la si chiude e si riprova finché l'onClick è agganciato. `page.on("popup")` e NON
  // `context.on("page")`: axe apre una pagina vuota sua per raccogliere i risultati dei
  // frame, e chiudergliela sotto fa fallire l'analisi con «Target page … closed».
  page.on("popup", (p) => void p.close().catch(() => {}));
  await goto("/");
  const tile = videoTile(page);
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    await tile.click();
    await expect(dialog).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 25_000 });

  // Si usa l helper condiviso, che esclude gli iframe: dentro il player c e il markup di
  // YouTube, che non e nostro e che non possiamo correggere. Fuori dall iframe, invece,
  // la passata copre TUTTA la pagina con il dialog aperto — cosi si vede anche se il
  // dialog rompe qualcosa dietro di se.
  const violazioni = await a11yViolations(page);
  expect(violazioni, JSON.stringify(violazioni, null, 2)).toEqual([]);

  // Il bersaglio per chiudere è da dito, non da mouse: 44×44 pieni (WCAG 2.5.8).
  const chiudi = dialog.getByRole("button", { name: /chiud|clos|ferm|schließ|cerrar/i }).last();
  const box = await chiudi.boundingBox();
  expect(box?.width ?? 0, "larghezza del comando chiudi").toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0, "altezza del comando chiudi").toBeGreaterThanOrEqual(44);
});
