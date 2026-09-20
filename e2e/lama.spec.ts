import { test, expect, setConsent, firstListingLink } from "./helpers";
import { LAMA_FOR, clipSlantFrom } from "../app/lib/motion/lama";

// La lama (A36 di Alberto, 19-20 set. 2026; D200-D219): le foto non a schermo intero entrano
// col ritaglio a parallelogramma di era-residence mentre scivolano di X %. Qui si prova nel
// browser quel che lama.test.ts prova sulla carta: lo stato armato sotto la piega, l'entrata
// che si compie senza lasciare stili, il rispetto di reduced-motion, il DOM di /case che non
// cambia (D205), il link della testimonianza che avvolge il modulo (D208).

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

/** Il modulo della lama sotto `sel`, con ciò che il browser calcola su modulo e interno. */
async function stato(page: import("@playwright/test").Page, sel: string) {
  return page.locator(sel).first().evaluate((box) => {
    const inner = box.querySelector<HTMLElement>("[data-lama-inner]");
    const r = box.getBoundingClientRect();
    return {
      from: box.getAttribute("data-from"),
      clip: getComputedStyle(box).clipPath,
      clipInline: (box as HTMLElement).style.clipPath,
      transform: inner ? getComputedStyle(inner).transform : null,
      willChange: [(box as HTMLElement).style.willChange, inner?.style.willChange ?? ""],
      top: r.top,
      width: r.width,
      bg: box.getAttribute("data-bg"),
    };
  });
}

test("su /chi-siamo la villa è armata sotto la piega e si apre entrando: nessuno stile a fine corsa", async ({ page, goto }) => {
  await goto("/chi-siamo");
  const sel = '[data-lama][data-from="right"]';
  await expect(page.locator(sel).first()).toHaveCount(1);
  // Armata: il primo callback dell'IO la trova sotto la piega e scrive lo stato chiuso (D209).
  await expect.poll(async () => norm((await stato(page, sel)).clipInline), { timeout: 5_000 }).toBe(
    norm(clipSlantFrom(0, "right")),
  );
  const chiusa = await stato(page, sel);
  expect(chiusa.top).toBeGreaterThan(0);
  // L'interno parte a +X % della scatola (da destra): matrix(1, 0, 0, 1, tx, 0), tx = X/100 × larghezza.
  const tx = Number.parseFloat(chiusa.transform?.match(/matrix\(1, 0, 0, 1, (-?[\d.]+), 0\)/)?.[1] ?? "NaN");
  expect(Math.abs(tx - (LAMA_FOR["chi-siamo"].x / 100) * chiusa.width)).toBeLessThan(1.5);
  // Entra: la si porta a metà viewport e in 1,2 s + 0,3 di ritardo si apre.
  await page.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect.poll(async () => (await stato(page, sel)).clipInline, { timeout: 4_000 }).toBe("");
  const aperta = await stato(page, sel);
  expect(aperta.transform).toBe("none");
  expect(aperta.willChange).toEqual(["", ""]);
  expect(aperta.clip).toBe("none");
});

test("Paths in home entra da sinistra (regola della fila, D203): profilo X 3, villa X 10", async ({ page, goto }) => {
  await goto("/");
  const vendi = "#vendi [data-lama]";
  const acquista = "#acquista [data-lama]";
  await expect(page.locator(vendi)).toHaveAttribute("data-from", "left");
  await expect(page.locator(acquista)).toHaveAttribute("data-from", "left");
  await expect.poll(async () => norm((await stato(page, vendi)).clipInline), { timeout: 8_000 }).toBe(norm(clipSlantFrom(0, "left")));
  const p1 = await stato(page, vendi);
  const p2 = await stato(page, acquista);
  const tx = (s: { transform: string | null }) => Number.parseFloat(s.transform?.match(/matrix\(1, 0, 0, 1, (-?[\d.]+), 0\)/)?.[1] ?? "NaN");
  expect(tx(p1)).toBeLessThan(0);
  expect(Math.abs(tx(p1) + 0.03 * p1.width)).toBeLessThan(1.5);
  expect(Math.abs(tx(p2) + 0.1 * p2.width)).toBeLessThan(1.5);
});

test("la sede in home entra da sinistra con l'inquadratura di D201 (100% 50%)", async ({ page, goto }) => {
  await goto("/");
  const sede = page.locator('[data-hero-cover] [data-lama]');
  await expect(sede).toHaveAttribute("data-from", "left");
  await expect(sede.locator("img")).toHaveCSS("object-position", "100% 50%");
});

test("la testimonianza su /vendi: il link avvolge il modulo, il play sta dentro il ritaglio, il modulo è la zona foto (D208, D210)", async ({ page, goto }) => {
  await goto("/vendi");
  const modulo = page.locator('a > [data-lama][data-sink-frame]');
  await expect(modulo).toHaveCount(1);
  await expect(modulo).toHaveAttribute("data-from", "right");
  // Il play è figlio del modulo, dopo l'interno: entra con la foto.
  await expect(modulo.locator(":scope > [data-lama-inner] + span")).toHaveCount(1);
  // La copertina cotta entra col solo bordo (X 0, D218): l'interno non ha trasformate neanche da chiusa.
  await expect.poll(async () => norm((await stato(page, 'a > [data-lama]')).clipInline), { timeout: 8_000 }).toBe(norm(clipSlantFrom(0, "right")));
  const chiusa = await stato(page, "a > [data-lama]");
  // X 0: `gsap.set(xPercent 0)` scrive la matrice identità, che il browser legge come tale.
  expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(chiusa.transform);
  expect(chiusa.bg).toBe("avorio");
  // Il link non riceve clip né transform (D21, eccezione come Voci).
  const link = page.locator("a:has(> [data-lama])");
  await expect(link).toHaveCSS("clip-path", "none");
  await expect(link).toHaveCSS("transform", "none");
  await modulo.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect.poll(async () => (await stato(page, "a > [data-lama]")).clipInline, { timeout: 4_000 }).toBe("");
  expect((await stato(page, "a > [data-lama]")).bg).toBe("foto");
});

test("le chiavi: ferme in home, con la lama su /contatti, entrambe dall'alto (D201, D206)", async ({ page, goto }) => {
  await goto("/");
  await expect(page.locator("#contatti [data-lama]")).toHaveCount(0);
  await expect(page.locator('#contatti img[alt][src*="raffaela-keys"]')).toHaveCSS("object-position", "50% 0%");
  await goto("/contatti");
  const chiavi = page.locator("#contatti [data-lama]");
  await expect(chiavi).toHaveCount(1);
  await expect(chiavi).toHaveAttribute("data-from", "right");
  await expect(chiavi.locator("img")).toHaveCSS("object-position", "50% 0%");
});

test("su /case/[slug] nessuna lama: le chiavi tengono il fade-up di oggi e l'inquadratura nuova (A26/D32, D205)", async ({ page, goto }) => {
  await goto("/acquista");
  const href = await firstListingLink(page).getAttribute("href");
  test.skip(!href, "nessuna scheda immobile nel feed di prova");
  await goto(href!);
  await expect(page.locator("[data-lama]")).toHaveCount(0);
  const chiavi = page.locator('.reveal:has(img[src*="raffaela-keys"])');
  await expect(chiavi).toHaveCount(1);
  await expect(chiavi.locator("img")).toHaveCSS("object-position", "50% 0%");
});

test.describe("reduced motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("con reduced motion nessun modulo riceve clip, transform o stile inline: foto intere e ferme", async ({ page, goto }) => {
    await goto("/chi-siamo");
    await page.waitForTimeout(800);
    const moduli = page.locator("[data-lama]");
    expect(await moduli.count()).toBeGreaterThan(0);
    const stili = await moduli.evaluateAll((els) =>
      els.map((el) => ({
        inline: (el as HTMLElement).getAttribute("style") ?? "",
        clip: getComputedStyle(el).clipPath,
        inner: (el.querySelector("[data-lama-inner]") as HTMLElement | null)?.getAttribute("style") ?? "",
        transform: getComputedStyle(el.querySelector("[data-lama-inner]") as Element).transform,
      })),
    );
    for (const s of stili) {
      expect(s.inline).toBe("");
      expect(s.inner).toBe("");
      expect(s.clip).toBe("none");
      expect(s.transform).toBe("none");
    }
  });
});
