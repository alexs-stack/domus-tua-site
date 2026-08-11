import { test, expect, setConsent } from "./helpers";

// Coreografia mobile — wave "parità mobile".
//
// Questi test misurano il MOVIMENTO, non la presenza dei nodi. È la lacuna che
// l'audit ha trovato nella suite (docs/mobile-parity.md §6.2): a 390px non c'era
// una sola asserzione che provasse che un tween fosse partito. Un `toBeVisible()`
// ignora l'opacità, quindi passava identico che l'animazione ci fosse o no.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
});

// ── Il fermo-immagine del primo gesto ─────────────────────────────────────
// Decisione 2026-08-11 (docs/mobile-parity.md §9.2): resta sulla rotella, sparisce
// sul dito. Col mouse è una finezza; col dito era una pagina che non rispondeva
// per quasi un secondo — misurato 991ms, ed è un blocco vero perché
// `lenis.stop()` mette `lenis-stopped` su <html>, che in CSS è `overflow: hidden`.
test.describe("il primo gesto sull'hero", () => {
  test("con la rotella la pagina si ferma un istante, ed è voluto", async ({ page, goto }) => {
    // `goto` e non `page.goto`: da 768 in su il sipario parte, e finché copre
    // tiene Lenis fermo per conto suo. Senza saltarlo, questi due test
    // leggerebbero `lenis-stopped` e crederebbero di aver misurato il gesto.
    await goto("/");
    await page.waitForTimeout(600);

    await page.mouse.wheel(0, 200);
    // Il blocco deve comparire: è la firma del gesto sul puntatore.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis-stopped")), {
        timeout: 2_000,
        message: "il fermo-immagine della rotella non è scattato",
      })
      .toBe(true);

    // …e deve rilasciare da solo, senza che l'utente faccia altro.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("lenis-stopped")), {
        timeout: 4_000,
        message: "il fermo-immagine non si è mai sciolto: la pagina resta bloccata",
      })
      .toBe(false);
  });

  test("col dito la pagina non si blocca mai @layout", async ({ page, goto }, testInfo) => {
    test.skip(
      !testInfo.project.use.hasTouch,
      "serve un contesto touch: qui il gesto del dito non esiste",
    );
    await goto("/");
    await page.waitForTimeout(600);

    // Il gesto vero del dito, come lo sente il listener della hero.
    await page.evaluate(() => window.dispatchEvent(new Event("touchmove", { bubbles: true })));
    await page.waitForTimeout(300);

    expect(
      await page.evaluate(() => document.documentElement.classList.contains("lenis-stopped")),
      "il dito ha bloccato il viewport: è esattamente ciò che la decisione §9.2 toglie",
    ).toBe(false);

    // E il blocco sotto si rivela lo stesso: si perde il fermo, non il gesto.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.querySelector(".dt-hero-rest");
            return el ? Number(getComputedStyle(el).opacity) : 0;
          }),
        { timeout: 4_000, message: "il blocco sotto l'hero non si è rivelato al tocco" },
      )
      .toBeGreaterThan(0.9);
  });
});

// ── I set piece entrano MENTRE li si guarda ───────────────────────────────
// Il test che mancava, e da cui è passato un difetto vero: il sipario di Paths
// scattava con il pannello 170px SOTTO il bordo basso dello schermo, su tutti e
// due i pannelli, per l'intera sessione — perché il documento cresce di ~238px
// dopo l'idratazione e la riga di partenza era stata calcolata prima. Nessuna
// asserzione se ne accorgeva: il nodo c'era, l'animazione partiva, il contenuto
// finiva composto. Semplicemente non lo vedeva nessuno.
//
// Quindi qui non si chiede «è partita?» ma «dov'era quando è partita?».
const SET_PIECE = [
  { nome: "il sipario di Paths", sel: ".dt-paths [data-paths-panel], .dt-paths article", prop: "clipPath" },
  { nome: "le tessere del muro", sel: "[data-wall-tile]", prop: "opacity" },
  { nome: "il sipario dell'orizzonte", sel: "[data-horizon-slide]", prop: "clipPath" },
] as const;

for (const { nome, sel, prop } of SET_PIECE) {
  test(`${nome} entra mentre è in campo @layout`, async ({ page, goto }, testInfo) => {
    test.skip(
      (testInfo.project.use.viewport?.width ?? 0) >= 1024,
      "questo è il contratto del ramo mobile: da lg in su comanda il set piece desktop",
    );
    // DIFETTO NOTO, NON AGGIRATO. Il sipario di Paths scatta col pannello sotto
    // il bordo basso a OGNI larghezza (misurato a frame: 717px su 640, 769px su
    // 664, 1123px su 1024). Un primo giro sembrava salvare 390px: era fortuna,
    // non una soglia. Escluse per misura, non per ipotesi: non è il ritardo di
    // campionamento (la sentinella legge in rAF dentro la pagina), non è la rete
    // di sicurezza (la sua guardia ora legge il rettangolo vivo, non `st.start`),
    // non è il selettore (matcha esattamente i due pannelli). Resta aperto
    // perché la causa non è isolata, e un verde ottenuto spostando la soglia
    // varrebbe meno di un `fixme` che dice la verità.
    test.fixme(
      nome === "il sipario di Paths",
      "difetto aperto: il sipario di Paths parte fuori campo — vedi docs/mobile-parity.md §9.4",
    );
    await goto("/");

    // Si scende a passi piccoli e a ogni passo si guarda se QUALCUNO ha appena
    // cominciato a muoversi. Al primo che parte si legge dov'era.
    //
    // DUE TRAPPOLE, ed entrambe hanno prodotto un rosso finto prima di essere
    // capite. Valgono per chiunque scriva il prossimo test di movimento.
    //
    // (1) L'assestamento prima della fotografia. Gli stati nascosti li scrive il
    //     ramo GSAP dopo l'idratazione: fotografando subito, il primo "cambio"
    //     che si vede è il NASCONDERSI, non il rivelarsi, e il test dichiarava
    //     che l'animazione parte a scrollY 0 — vero e privo di significato.
    // (2) Lo scroll va guidato dalla ROTELLA, non da `window.scrollTo`. Lenis
    //     alimenta ScrollTrigger con i propri eventi (`lenis.on("scroll",
    //     ScrollTrigger.update)`): uno scroll programmatico sposta la pagina
    //     senza passare di lì, e i trigger non si aggiornano mai. Il muro e i
    //     due pannelli restavano nascosti per tutta la corsa e il test
    //     concludeva «nessun ingresso da misurare» su un ingresso che c'è.
    //     È lo stesso motivo per cui home.spec.ts pilota con page.mouse.wheel.
    const vh = page.viewportSize()!.height;
    const settle = async () =>
      page.evaluate(async () => {
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 1200));
      });
    await settle();

    // (3) LA MISURA VA PRESA DENTRO LA PAGINA, A FRAME. Campionare da Playwright
    //     fra un colpo di rotella e l'altro misura anche il ritardo di Lenis,
    //     che è smorzato: si legge il rettangolo mentre lo scroll insegue
    //     ancora il bersaglio, e l'elemento sembra 80-90px più in basso di
    //     dov'era davvero quando il trigger è scattato. Una sentinella in rAF
    //     registra la posizione nel fotogramma esatto in cui lo stile cambia.
    const sentinella = await page.evaluateHandle(
      ([selector, property]) => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
        const base = els.map((el) => getComputedStyle(el)[property as "opacity"]);
        const nascosti = els
          .map((el, i) => ({ el, i }))
          .filter(({ i }) =>
            property === "opacity"
              ? Number(base[i]) < 0.05
              : base[i] !== "none" && !/inset\(0%\s+0%\s+0%\s+0%/.test(base[i]),
          );
        const out: { trovato: boolean; top: number; nascosti: number; n: number } = {
          trovato: false,
          top: 0,
          nascosti: nascosti.length,
          n: els.length,
        };
        const tick = () => {
          if (!out.trovato) {
            for (const { el, i } of nascosti) {
              if (getComputedStyle(el)[property as "opacity"] === base[i]) continue;
              out.trovato = true;
              out.top = el.getBoundingClientRect().top;
              break;
            }
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
        return out;
      },
      [sel, prop] as const,
    );

    for (let step = 0; step < 320; step++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(50);
      if (await page.evaluate((o) => o.trovato, sentinella)) break;
      if (await page.evaluate(() => window.scrollY + window.innerHeight >= document.body.scrollHeight - 4)) break;
    }
    const atStart = { ...(await sentinella.jsonValue()), vh };

    test.skip(
      !atStart.trovato,
      `${nome}: nessun ingresso da misurare (${atStart.n} nodi, ${atStart.nascosti} nascosti a riposo)`,
    );
    // Non "dentro il viewport" ma "abbastanza dentro da vedersi": un elemento
    // che parte col bordo alto sull'ultima riga di pixel ha già finito quando
    // arriva davvero in campo.
    expect(
      atStart.top,
      `${nome}: l'animazione è partita con il bordo alto a ${Math.round(atStart.top)}px, ` +
        `su un viewport di ${atStart.vh}px — comincia fuori campo`,
    ).toBeLessThan(atStart.vh * 0.95);
  });
}

// ── Nessun traboccamento orizzontale ──────────────────────────────────────
// Passava già prima della wave, e resta scritto come rete: è il difetto che si
// nota per primo su un telefono, e ogni ramo mobile nuovo è un'occasione di
// reintrodurlo.
const ROTTE = ["/", "/acquista", "/vendi", "/metodo", "/chi-siamo", "/contatti"] as const;

for (const rotta of ROTTE) {
  test(`nessun traboccamento orizzontale su ${rotta} @layout`, async ({ page, goto }) => {
    await goto(rotta);
    // Una passata intera: il traboccamento può nascere da un elemento che entra
    // in scena, non solo da quelli già a schermo al caricamento.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    const excess = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(excess, `${rotta} trabocca di ${excess}px in orizzontale`).toBeLessThanOrEqual(0);
  });
}
