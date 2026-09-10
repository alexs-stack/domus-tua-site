import { test, expect, setConsent } from "./helpers";

// Reduced motion. Chi ha chiesto meno animazioni deve vedere lo stesso sito, fermo — non un
// sito a metà: nessun testo invisibile in attesa di un'animazione che non partirà mai.

test.use({ contextOptions: { reducedMotion: "reduce" } });

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

test("con reduced motion l'intro non parte e il contenuto è subito lì @layout", async ({ page }) => {
  // Niente scorciatoie: si carica la home come la caricherebbe un visitatore.
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toBeVisible({ timeout: 5_000 });
  // Nessun overlay del preloader rimasto a coprire la pagina.
  await expect(page.locator("[data-preloader]")).toHaveCount(0);
});

test("i testi rivelati dall'animazione sono comunque leggibili", async ({ page, goto }) => {
  await goto("/vendi");
  await page.waitForTimeout(400);

  // I blocchi che entrano allo scroll (`.reveal`, Reveal.tsx) e i titoli che TextLines
  // rivela riga per riga: con reduced motion sono a piena opacità, senza traslazione
  // né sfocatura — non resta niente di nascosto in attesa di un'animazione.
  const blocks = page.locator("#main .reveal");
  expect(await blocks.count(), "nessun blocco .reveal su /vendi").toBeGreaterThan(0);
  const faded = await page.locator("#main .reveal, #main h1, #main h2, #main .lead").evaluateAll((els) =>
    els
      .filter((e) => {
        const s = getComputedStyle(e);
        // `.reveal.is-in` computa `blur(0px)`: è identità, non una sfocatura.
        const fermo = s.transform === "none" || s.transform === "matrix(1, 0, 0, 1, 0, 0)";
        const nitido = s.filter === "none" || /^blur\(0(px)?\)$/.test(s.filter);
        return Number(s.opacity) < 0.9 || !fermo || !nitido;
      })
      .map((e) => `${e.tagName}.${e.className} «${(e.textContent ?? "").trim().slice(0, 30)}»`),
  );
  expect(faded, `testi rimasti invisibili o spostati con reduced motion: ${faded.join(" | ")}`).toEqual([]);
});

test("le sezioni che entrano allo scroll sono già visibili", async ({ page, goto }) => {
  await goto("/metodo");
  await page.waitForTimeout(400);

  const invisible = await page.locator("#main section").evaluateAll((els) =>
    els.filter((e) => {
      const s = getComputedStyle(e);
      return Number(s.opacity) < 0.9 && s.display !== "none";
    }).length,
  );
  expect(invisible, "sezioni rimaste trasparenti con reduced motion").toBe(0);
});

test("la rotaia del team con reduced motion resta uno scorrimento nativo completo", async ({ page, goto }) => {
  await goto("/");
  const rail = page.locator("#chi-siamo .dt-rail");
  await expect(rail).toBeAttached();
  // Senza motion l'attributo che spegne lo scroll nativo e passa il nastro a GSAP non
  // deve esserci: il nastro si trascina, e il corridoio sticky non esiste.
  expect(await rail.getAttribute("data-on")).toBeNull();
  expect(await page.locator("#chi-siamo .dt-railway").getAttribute("data-on")).toBeNull();
  await expect(rail).toHaveCSS("overflow-x", "auto");
  // Le tessere restano tutte nel nastro, visibili e complete.
  const tiles = rail.locator("figure");
  await tiles.first().scrollIntoViewIfNeeded();
  await expect(tiles.first()).toBeVisible();
  await expect(tiles.last()).toBeAttached();
});

test("lo scroll è quello del browser, non uno smooth scroll forzato", async ({ page, goto }) => {
  await goto("/");
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(200);
});

// ── Parallasse ────────────────────────────────────────────────────────────
// Fuori dal regime reduced-motion del resto del file: qui il movimento deve
// esserci. La rivista bianca ammette una sola deriva allo scroll, `Parallax`
// (±4 %), e la foto di PageHero su /vendi la porta con `mobile={false}`: da 768
// in su la sua translateY cambia fra due quote di scroll (una matrix, non un
// fade), sotto resta ferma — la corsa a 390 starebbe sotto i 10 px. Con
// reduced motion è ferma ovunque (il resto del file).
test.describe("la parallasse della foto di pagina", () => {
  test.use({ contextOptions: { reducedMotion: "no-preference" } });

  test("su /vendi la foto deriva da 768 in su e resta ferma sotto @layout", async ({ page, goto }, testInfo) => {
    const w = testInfo.project.use.viewport?.width ?? 0;
    await setConsent(page, "accepted");
    await goto("/vendi");
    // L'inner di Parallax: il figlio diretto del wrapper che contiene la foto 16:9.
    const SEL = "#main section img[sizes='100vw']";
    await expect(page.locator(SEL).first()).toBeAttached();
    const leggi = () =>
      page.evaluate((sel) => {
        const img = document.querySelector<HTMLElement>(sel)!;
        // img → div.relative (cornice) → inner di Parallax
        const inner = img.parentElement!.parentElement!;
        const m = /^matrix\(([^)]+)\)$/.exec(getComputedStyle(inner).transform);
        return {
          f: m ? Number(m[1].split(",")[5]) : 0,
          top: inner.getBoundingClientRect().top + window.scrollY,
          vh: window.innerHeight,
        };
      }, SEL);
    const scrollTo = (y: number) =>
      page.evaluate(async (t) => {
        window.scrollTo({ top: Math.max(0, t), behavior: "instant" });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, y);

    const p0 = await leggi();
    // Foto appena entrata dal basso, poi a metà viewport.
    await scrollTo(p0.top - p0.vh + 40);
    await page.waitForTimeout(250);
    const bordo = await leggi();
    await scrollTo(p0.top - p0.vh / 2);
    await page.waitForTimeout(250);
    const meta = await leggi();
    // La corsa intera è ±4 % dell'altezza della foto (≈ 5-9 px a 768-1440): fra
    // le due quote si pretende una deriva misurabile, non un numero grande.
    const df = Math.abs(meta.f - bordo.f);
    if (w >= 768) {
      expect(df, `a ${w}px la foto di /vendi non deriva (Δy ${df}px)`).toBeGreaterThan(0.5);
    } else {
      expect(df, `a ${w}px la foto deriva di ${df}px: mobile={false} non rispettato`).toBeLessThan(0.2);
    }
  });
});
