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
  // Con reduced-motion il motore dei reveal non arma nessun gruppo (D21, spec §2.4):
  // la pagina è completa e ferma, nessuno stato nascosto nemmeno scritto da JS.
  await expect(page.locator("[data-reveal-armed]")).toHaveCount(0);

  // I blocchi che entrano allo scroll (`.reveal`, Reveal.tsx), i titoli per lettera
  // (`[data-c]`, SplitTitle) e i lead a righe (Lead), A20 di Alberto: con reduced motion
  // sono a piena opacità, senza traslazione né sfocatura, e il lead resta un paragrafo intero.
  const blocks = page.locator("#main .reveal");
  expect(await blocks.count(), "nessun blocco .reveal su /vendi").toBeGreaterThan(0);
  const faded = await page.locator("#main .reveal, #main h1, #main h2, #main .lead, #main [data-c]").evaluateAll((els) =>
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
  expect(await page.locator("#main .dt-line").count(), "con reduced motion Lead non spezza in righe").toBe(0);
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

test("lo scroller orizzontale con reduced motion resta una colonna completa", async ({ page, goto }) => {
  await goto("/");
  const horizon = page.locator(".dt-horizon");
  await expect(horizon).toBeAttached();
  // Senza motion l'attributo che attiva pin e track orizzontale non deve esserci.
  expect(await horizon.getAttribute("data-on")).toBeNull();
  // I pannelli restano in flusso normale, visibili e completi.
  await page.locator(".dt-horizon_panel").first().scrollIntoViewIfNeeded();
  await expect(page.locator(".dt-horizon_panel").first()).toBeVisible();
  await expect(page.locator(".dt-horizon_panel").last()).toBeAttached();
});

test("le cinque stelle con reduced motion sono già d'oro, senza palcoscenico", async ({ page, goto }) => {
  await goto("/");
  const stars = page.locator(".dt-starrev");
  await expect(stars).toBeAttached();
  // Né lo schermo sticky del desktop né il box del telefono: li mette solo JS con motion ok.
  expect(await stars.getAttribute("data-on")).toBeNull();
  expect(await stars.getAttribute("data-sr-mob")).toBeNull();
  await stars.scrollIntoViewIfNeeded();
  await expect(page.locator(".dt-starrev_star")).toHaveCount(5);
  await expect(page.locator(".dt-starrev_star").first()).toBeVisible();
  // Il layer del film resta fuori scena.
  await expect(page.locator(".dt-starrev_intro")).toBeHidden();
});

// D26 e D27 con reduced motion (spec §3.11, §3.12): righe e spina del D.O.C.
// disegnate e senza clip, le foto di Services ferme a scala 1.
test("D.O.C. e Services con reduced motion: righe disegnate e foto ferme", async ({ page, goto }) => {
  await goto("/");
  const righe = page.locator('#domus-doc [data-hairline="doc"]');
  // Prima il conteggio: senza foglio lo scroll qui sotto aspetterebbe fino al timeout del test.
  await expect(page.locator("#domus-doc [data-doc-sheet]")).toHaveCount(1);
  // Il foglio e non la prima linea: la prima in ordine DOM è la spina, `display: none`
  // sotto md, e scrollIntoViewIfNeeded su un nodo senza layout ritenta fino al timeout.
  await page.locator("#domus-doc [data-doc-sheet]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const misure = await righe.evaluateAll((els) =>
    els.map((e) => {
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return { axis: e.getAttribute("data-axis"), display: s.display, clip: s.clipPath, bg: s.backgroundColor, h: r.height, w: r.width };
    }),
  );
  const orizzontali = misure.filter((m) => m.axis === "x");
  expect(orizzontali).toHaveLength(5);
  for (const m of misure.filter((m) => m.display !== "none")) {
    expect(m.clip).toBe("none");
    expect(m.bg).toBe("rgb(228, 220, 207)");
  }
  for (const m of orizzontali) expect(m.h).toBe(1);

  await expect(page.locator("#servizi [data-zoom-box]")).toHaveCount(3);
  await page.locator("#servizi [data-zoom-box]").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const zoom = await page.locator("#servizi [data-zoom]").evaluateAll((els) => els.map((e) => getComputedStyle(e).transform));
  expect(zoom).toEqual(["none", "none", "none"]);
});

test("con reduced motion le colonne di Percorsi e le tendine del Metodo restano ferme", async ({ page, goto }) => {
  await goto("/");
  await page.waitForTimeout(400);
  const colonne = await page
    .locator("[data-paths-col]")
    .evaluateAll((els) => els.map((e) => getComputedStyle(e).transform));
  expect(colonne).toEqual(["none", "none", "none", "none"]);
  const tendineHome = await page
    .locator('[data-clip="method"]')
    .evaluateAll((els) => els.map((e) => getComputedStyle(e).clipPath));
  expect(tendineHome).toEqual(["none", "none", "none"]);

  await goto("/metodo");
  await page.waitForTimeout(400);
  const tendineMetodo = await page
    .locator('#metodo [data-clip="method"]')
    .evaluateAll((els) => els.map((e) => getComputedStyle(e).clipPath));
  expect(tendineMetodo).toEqual(["none", "none", "none"]);
});

test("lo scroll è quello del browser, non uno smooth scroll forzato", async ({ page, goto }) => {
  await goto("/");
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(300);
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(200);
});

// La finestra di Open Domus (A19, A20) con reduced motion: nessun corridoio, nessuna tenda,
// nessuna pista; la foto sta in testa al capitolo, quadrata sotto lg e 16:9 da lg.
test("la finestra di Open Domus con reduced motion è la foto in testa al capitolo @layout", async ({ page, goto }) => {
  await goto("/");
  const od = page.locator("#open-domus");
  await expect(od).toBeAttached();
  expect(await od.getAttribute("data-on")).toBeNull();
  for (const sel of [".dt-od_shutterzone", ".dt-od_run", ".dt-od_mark--a", ".dt-od_mark--f"]) {
    await expect(od.locator(sel)).toHaveCSS("display", "none");
  }
  const win = od.locator(".dt-od_window");
  await win.scrollIntoViewIfNeeded();
  await expect(win.locator("img")).toBeVisible();
  const box = (await win.boundingBox())!;
  const w = page.viewportSize()?.width ?? 0;
  expect(Math.abs(box.width / box.height - (w >= 1024 ? 16 / 9 : 1))).toBeLessThan(0.02);
  expect(await od.locator(".dt-od_stage").getAttribute("style")).toBeNull();
  expect(await win.getAttribute("style")).toBeNull();
});

// Il tuffo dell'hero con reduced motion (A19-A20 di Alberto, spec coreografia
// §3.2-§3.3): nessun corridoio, nessuno stile, Posizionamento in flusso.
test("con reduced motion l'hero non è un corridoio e Posizionamento non copre", async ({ page, goto }) => {
  await goto("/");
  const top = page.locator("#top");
  await expect(top).toBeAttached();
  expect(await top.getAttribute("data-on")).toBeNull();
  expect(await page.locator("[data-hero-zoom]").getAttribute("style")).toBeNull();
  await expect(page.locator("#top [data-corridor-run]")).toHaveCSS("display", "none");
  await expect(page.locator("[data-hero-cover]")).toHaveCSS("margin-top", "0px");
  const alt = await page.evaluate(() => ({
    bg: document.querySelector<HTMLElement>('#top > [data-bg="foto"]')!.offsetHeight,
    band: document.querySelector<HTMLElement>("[data-hero-media]")!.offsetHeight,
  }));
  expect(Math.abs(alt.bg - alt.band), "con reduced motion il marcatore data-bg non è alto quanto la banda").toBeLessThanOrEqual(1);
});

// Ricerca e Voci con reduced motion (A18-A20 di Alberto, spec coreografia §3.4
// e §3.7): nessun gesto, nessuno stile inline, pannello e tessere pieni.
test("con reduced motion il pannello della ricerca e le tessere di Voci restano senza stile", async ({ page, goto }) => {
  await goto("/");
  await page.locator("#voci").scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  expect(await page.locator("[data-dock]").getAttribute("style")).toBeNull();
  expect(await page.locator("[data-dock-panel]").getAttribute("style")).toBeNull();
  const conStile = await page
    .locator("#voci [data-voci-slide], #voci [data-voci-slide-inner]")
    .evaluateAll((els) => els.filter((e) => e.hasAttribute("style")).length);
  expect(conStile).toBe(0);
  expect(await page.locator("#voci [data-voci-slide]").count()).toBeGreaterThan(0);
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
        // L'inner di Parallax è l'antenato che porta la matrice. Si CERCA invece
        // di contarlo: la cornice intermedia è sparita quando la banda è passata
        // al modulo `.dt-media-full` (11 settembre), e il test leggeva il
        // wrapper esterno, che non si muove mai.
        let inner: HTMLElement = img;
        for (let i = 0; i < 4 && inner.parentElement; i += 1) {
          inner = inner.parentElement;
          if (/^matrix\(/.test(getComputedStyle(inner).transform)) break;
        }
        const m = /^matrix\(([^)]+)\)$/.exec(getComputedStyle(inner).transform);
        return {
          f: m ? Number(m[1].split(",")[5]) : 0,
          top: inner.getBoundingClientRect().top + window.scrollY,
          h: inner.getBoundingClientRect().height,
          vh: window.innerHeight,
        };
      }, SEL);
    const scrollTo = (y: number) =>
      page.evaluate(async (t) => {
        window.scrollTo({ top: Math.max(0, t), behavior: "instant" });
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, y);

    const p0 = await leggi();
    // DUE QUOTE CHE ESISTONO DAVVERO. Le vecchie erano «foto appena entrata dal
    // basso» (top − vh + 40) e «a metà viewport» (top − vh/2): da quando la
    // banda di PageHero risale sotto il titolo — 11 settembre — la foto comincia
    // a y≈400, quindi a 768 ENTRAMBE le quote diventavano negative, il browser
    // le bloccava a 0 e il test misurava due volte lo stesso fotogramma
    // (Δy 0) concludendo che la parallasse non c'era. Ora la seconda quota è
    // presa OLTRE la foto, che esiste a qualunque larghezza.
    await scrollTo(Math.max(0, p0.top - p0.vh + 40));
    await page.waitForTimeout(250);
    const bordo = await leggi();
    await scrollTo(p0.top + p0.h / 2);
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
