import { test, expect, setConsent } from "./helpers";
import { SIZES_TESTA } from "../app/lib/motion/testa";
import tinte from "../app/lib/motion/tinte.json";

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
  // A57: i nastri sono due (storia e la finestra di Open Domus): qui si guarda quello di storia.
  const horizon = page.locator("#storia");
  await expect(horizon).toBeAttached();
  // Senza motion l'attributo che attiva pin e track orizzontale non deve esserci.
  expect(await horizon.getAttribute("data-on")).toBeNull();
  // I pannelli restano in flusso normale, visibili e completi.
  await page.locator("#storia .dt-horizon_panel").first().scrollIntoViewIfNeeded();
  await expect(page.locator("#storia .dt-horizon_panel").first()).toBeVisible();
  await expect(page.locator("#storia .dt-horizon_panel").last()).toBeAttached();
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
    // A51 (22 set.): il filo è #e9c9c0 sulla carta rosa tramonto.
    expect(m.bg).toBe("rgb(233, 201, 192)");
  }
  for (const m of orizzontali) expect(m.h).toBe(1);

  await expect(page.locator("#servizi [data-zoom-box]")).toHaveCount(3);
  await page.locator("#servizi [data-zoom-box]").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const zoom = await page.locator("#servizi [data-zoom]").evaluateAll((els) => els.map((e) => getComputedStyle(e).transform));
  expect(zoom).toEqual(["none", "none", "none"]);
});

// Il nastro di Costi chiari con reduced motion (A72): nessun corridoio, i tre pannelli in colonna, la
// facciata intera senza clip né transform, la cornice di Carmine senza sipario, il titolo di Seguici fermo.
test("il nastro di Costi chiari con reduced motion: tre pannelli in colonna, la facciata intera, nessun clip", async ({ page, goto }) => {
  await goto("/");
  const cc = page.locator("#costi");
  await expect(cc).toHaveCount(1);
  expect(await cc.getAttribute("data-on")).toBeNull();
  const win = cc.locator(".dt-cc_window");
  await win.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(win).toHaveCSS("clip-path", "none");
  await expect(win).toHaveCSS("transform", "none");
  await expect(win.locator("img")).toBeVisible();
  await expect(cc.locator(".dt-horizon_track")).toHaveCSS("transform", "none");
  const carmine = cc.locator("a[data-sink-frame]");
  await carmine.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await expect(carmine).toHaveCSS("clip-path", "none");
  await expect(carmine.locator("[data-horizon-slide-img]")).toHaveCSS("transform", "none");
  // Nessun video dell'acqua: è uscita dal codice.
  expect(await cc.locator("video, [data-acqua-band]").count()).toBe(0);
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
// nessuna pista; la foto sta in testa al capitolo, intera, 9:16 a ogni larghezza (A47).
test("la finestra di Open Domus con reduced motion è la foto in testa al capitolo @layout", async ({ page, goto }) => {
  await goto("/");
  const od = page.locator("#open-domus");
  await expect(od).toBeAttached();
  expect(await od.getAttribute("data-on")).toBeNull();
  // A57/A58: tende, pista, marcatori e stage non esistono più; con reduced motion il nastro non scrive nulla.
  expect(await od.locator(".dt-od_shutterzone, .dt-od_run, .dt-od_mark--a, .dt-od_mark--f, .dt-od_stage").count()).toBe(0);
  expect(await od.getAttribute("style")).toBeNull();
  expect(await od.locator(".dt-od_cornice").getAttribute("style")).toBeNull();
  expect(await od.locator(".dt-od_window").getAttribute("style")).toBeNull();
  expect(await od.locator(".dt-od_coda_foto").getAttribute("style")).toBeNull();
  const win = od.locator(".dt-od_window");
  await win.scrollIntoViewIfNeeded();
  await expect(win.locator("img")).toBeVisible();
  const box = (await win.boundingBox())!;
  expect(Math.abs(box.width / box.height - 2160 / 3870)).toBeLessThan(0.02);
  expect(await win.getAttribute("style")).toBeNull();
});

// L'hero alto con reduced motion (A49 di Alberto, 22 set. 2026; A19-A20 per il resto): la foto alta è
// in flusso a ogni larghezza e con moto ridotto non si chiude nemmeno in cartolina: nessun corridoio,
// nessuno stile, nessun clip; Posizionamento la segue senza margine.
test("con reduced motion l'hero è la foto alta ferma: nessun corridoio, nessun clip, Posizionamento in flusso", async ({ page, goto }) => {
  await goto("/");
  const top = page.locator("#top");
  await expect(top).toBeAttached();
  expect(await top.getAttribute("data-on")).toBeNull();
  expect(await page.locator("#top [data-corridor-screen], #top [data-corridor-run], [data-hero-zoom]").count()).toBe(0);
  await expect(page.locator("#posizionamento")).toHaveCSS("margin-top", "0px");
  const box = page.locator("#top [data-testa-foto-box]");
  await expect(box).toHaveCSS("clip-path", "none");
  expect(await box.getAttribute("style")).toBeNull();
  // A fine foto, con moto ridotto, ancora nessun ritaglio (A53 sulla home).
  await page.evaluate(() => {
    const s = document.querySelector<HTMLElement>("#top [data-testa-strato]")!;
    window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY + s.offsetHeight - window.innerHeight * 0.1, behavior: "instant" });
  });
  await page.waitForTimeout(800);
  await expect(box).toHaveCSS("clip-path", "none");
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

// ── La testa di era delle pagine interne, con reduced motion ───────────────
// A38, A40 e A41 di Alberto (20 settembre 2026): la foto è il fondo a schermo
// intero, sticky e FERMA (nessun tuffo, nessun corridoio: page-dive, soglia e
// ingresso sono morti), e dal 21 set. (A45) la foto è la pagina: il riquadro in
// flusso, alto quanto la foto, scorre con lei, il blocco dei testi dentro. Il
// layout sta nel CSS prima del paint, quindi con reduced motion, il regime di
// tutto questo file, la pagina è identica: niente `data-corridor`, niente sticky,
// niente trasformate, `sizes` dal modulo dei numeri. Il resto della testa lo
// prova e2e/a28.spec.ts.
test("su /vendi la testa resta ferma e senza corridoio @layout", async ({ page, goto }) => {
  await goto("/vendi");
  await expect(page.locator("[data-corridor]")).toHaveCount(0);
  const testa = page.locator("section[data-testa]");
  await expect(testa).toHaveCount(1);
  await expect(testa.locator(".dt-testa_riquadro")).toHaveCSS("position", "relative");
  const sorgente = tinte["/vendi"].sorgente;
  await expect(page.locator("img[data-testa-foto]")).toHaveAttribute("sizes", SIZES_TESTA);
  // Il tempo in cui un JS sbagliato scriverebbe una trasformata.
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: "instant" }));
  await page.waitForTimeout(250);
  for (const sel of [".dt-testa_riquadro", ".dt-testa_strato", ".dt-testa_blocco", "img[data-testa-foto]"]) {
    await expect(page.locator(sel).first()).toHaveCSS("transform", "none");
  }
});

// Capitoli 13-16 (spec 2026-09-13 §3.14-3.17): con reduced motion nessun gesto
// scrive transform o opacità. La pagina è completa e ferma.
test("i gesti dei capitoli 13-16 con reduced motion non muovono nulla", async ({ page, goto }) => {
  await goto("/");
  for (const sel of ["main a[data-sink-frame] [data-sink]", "[data-seguici-congedo]", "#contatti [data-lag-col]"]) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const s = await el.evaluate((n) => ({
      t: getComputedStyle(n).transform,
      o: getComputedStyle(n).opacity,
      inline: (n as HTMLElement).getAttribute("style") ?? "",
    }));
    expect(s.t, sel).toBe("none");
    expect(s.o, sel).toBe("1");
    expect(s.inline, sel).not.toMatch(/transform|translate|scale|opacity/);
  }
});

// La cartolina del Congedo (spec 2026-09-13 §3.18) con reduced motion: nessun
// corridoio, la banda piena e ferma, il footer in flusso a scala 1.
test("la cartolina del Congedo con reduced motion resta una banda piena e ferma", async ({ page, goto }) => {
  await goto("/");
  const sec = page.locator('[data-corridor="cartolina"]');
  await expect(sec).toBeAttached();
  expect(await sec.getAttribute("data-on")).toBeNull();
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const s = await page.evaluate(() => {
    const sec = document.querySelector<HTMLElement>('[data-corridor="cartolina"]')!;
    const foot = document.querySelector<HTMLElement>("footer")!;
    return {
      pos: getComputedStyle(sec.querySelector<HTMLElement>("[data-corridor-screen]")!).position,
      clip: getComputedStyle(sec.querySelector<HTMLElement>("[data-postcard-clip]")!).clipPath,
      run: getComputedStyle(sec.querySelector<HTMLElement>("[data-corridor-run]")!).display,
      ft: getComputedStyle(foot).transform,
      fo: getComputedStyle(foot).opacity,
      mt: getComputedStyle(foot).marginTop,
    };
  });
  expect(s.pos).toBe("relative");
  expect(s.clip).toBe("none");
  expect(s.run).toBe("none");
  expect(s.ft).toBe("none");
  expect(s.fo).toBe("1");
  expect(s.mt).toBe("0px");
});

// Reduced motion (spec 2026-09-13 §3.18; A35, A42): la banda resta piena e ferma, la testa
// (h2 e comando) sta in flusso sopra lo schermo a una colonna, lo slot della miniatura non
// esiste (D108, D111); nessuna entrata: né attributi né canvas né transform sul ritaglio, su
// cinque larghezze (i lati finali della cartolina di D29 non c'entrano più col titolo).
test("la cartolina con reduced motion: testa sopra a una colonna, banda piena senza entrata né slot", async ({ page, goto, isMobile }) => {
  test.skip(!!isMobile, "le cinque larghezze si impostano dentro il test");
  for (const vp of [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 664 },
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await goto("/");
    await page.locator('[data-corridor="cartolina"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const g = await page.evaluate(() => {
      const sec = document.querySelector<HTMLElement>('[data-corridor="cartolina"]')!;
      const screen = sec.querySelector<HTMLElement>("[data-corridor-screen]")!;
      const banda = screen;
      const clip = sec.querySelector<HTMLElement>("[data-postcard-clip]")!;
      const h2 = document.getElementById("congedo-title")!;
      const a = sec.querySelector<HTMLElement>(".dt-postcard_testa a.dt-btn")!;
      return {
        clip: getComputedStyle(clip).clipPath,
        clipT: clip.style.transform,
        entrata: sec.getAttribute("data-entrata"),
        canvas: !!sec.querySelector("canvas"),
        h2Fuori: !screen.contains(h2),
        h2Sopra: h2.getBoundingClientRect().bottom <= banda.getBoundingClientRect().top + 1,
        ctaSotto: a.getBoundingClientRect().bottom <= banda.getBoundingClientRect().top + 1,
        slot: getComputedStyle(sec.querySelector(".dt-postcard_slot")!).display,
        lettere: !!banda.querySelector("h1, h2, h3, p, a, button"),
      };
    });
    const at = `${vp.width}×${vp.height}`;
    expect(g.clip, at).toBe("none");
    expect(g.clipT, at).toBe("");
    expect(g.entrata, at).toBeNull();
    expect(g.canvas, at).toBe(false);
    expect(g.h2Fuori, `${at}: l'h2 sta dentro lo schermo`).toBe(true);
    expect(g.h2Sopra, `${at}: l'h2 non sta sopra la banda`).toBe(true);
    expect(g.ctaSotto, `${at}: il comando non sta sopra la banda, nella testa`).toBe(true);
    expect(g.slot, `${at}: lo slot esiste senza l'entrata`).toBe("none");
    expect(g.lettere, `${at}: lettere sulla fotografia`).toBe(false);
  }
});
