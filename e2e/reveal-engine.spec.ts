import type { Locator, Page } from "@playwright/test";
import { test, expect, setConsent } from "./helpers";
import { installProbe, matrixOf, productOpacity } from "./coreografia";

// IL MOTORE DEI REVEAL NEL BROWSER (A18, A20 di Alberto; C22; D21; spec §2.4),
// sul build di produzione con motion ok. /vendi ha tutti i casi: blocchi `ctn`
// sotto la piega, blocchi con link (declassati a `still`), il blocco con lo
// scarto `delay` di oggi (VendiContent.tsx:845), l'ancora #contatti.
// Lo scroll è `window.scrollTo` istantaneo: qui si prova il motore, non
// l'inerzia della rotella. productOpacity e matrixOf bastano a sé; installProbe
// è facoltativa e serve solo al test del salto, che legge window.__dtProbe.opacity
// dentro un ciclo di fotogrammi.

test.beforeEach(async ({ page }) => {
  await setConsent(page, "accepted");
  await installProbe(page);
});

type Sonde = { __rientri?: string[]; __tolti?: string[]; __stati?: string[]; __tempi?: Record<string, number> };

const jump = (page: Page, y: number) => page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
const vh = (page: Page) => page.evaluate(() => window.innerHeight);
const absTop = (el: Locator) => el.evaluate((e) => e.getBoundingClientRect().top + window.scrollY);

async function armed(page: Page) {
  await expect.poll(() => page.locator("#main [data-reveal-state]").count(), { timeout: 10_000 }).toBeGreaterThan(0);
}

type Esame = { gruppi: number; bersagli: number; fuori: string[] };

/**
 * D44: la posa di un gruppo si legge sui suoi membri e sui loro bersagli GSAP, come li trovano
 * collect() e targetsOf() di reveal-engine.ts, e non sul nodo del gruppo: un RevealGroup non
 * porta data-reveal, il motore non lo anima e la sua opacità resta 1 in ogni stato. Membri: i
 * [data-reveal] il cui gruppo più vicino è `g`, compreso `g` quando porta data-reveal. Bersagli
 * (ROLES di text-roles.ts): i [data-c] per title e accent, le .dt-line per lead, il membro stesso
 * per ctn e still. «nascosti»: i gruppi hidden, bersagli a opacità ≤ 0,01 (lead, che non anima
 * l'opacità: riga spostata di almeno metà altezza). «sopra»: i gruppi interamente sopra il
 * viewport, shown e con bersagli a opacità ≥ 0,99 (lead: riga ferma entro 1 px).
 * Gira nella pagina (evaluateAll): niente riferimenti fuori dal corpo.
 */
function membriFuoriPosa(tutti: Element[], quali: "nascosti" | "sopra"): Esame {
  const gruppi = (tutti as HTMLElement[]).filter((g) =>
    quali === "nascosti" ? g.getAttribute("data-reveal-state") === "hidden" : g.getBoundingClientRect().bottom <= 0,
  );
  const fuori: string[] = [];
  let bersagli = 0;
  for (const g of gruppi) {
    const stato = g.getAttribute("data-reveal-state");
    if (quali === "sopra" && stato !== "shown") fuori.push(`gruppo ${stato}: «${(g.textContent ?? "").trim().slice(0, 40)}»`);
    const membri = [g, ...Array.from(g.querySelectorAll<HTMLElement>("[data-reveal]"))].filter(
      (m) => m.hasAttribute("data-reveal") && m.closest("[data-reveal-group]") === g,
    );
    for (const m of membri) {
      const ruolo = m.getAttribute("data-reveal");
      const sel = ruolo === "title" || ruolo === "accent" ? "[data-c]" : ruolo === "lead" ? ".dt-line" : null;
      for (const t of sel === null ? [m] : Array.from(m.querySelectorAll<HTMLElement>(sel))) {
        bersagli++;
        const cs = getComputedStyle(t);
        let ok: boolean;
        if (ruolo === "lead") {
          const dy = Math.abs(new DOMMatrixReadOnly(cs.transform === "none" ? undefined : cs.transform).m42);
          ok = quali === "nascosti" ? dy >= t.offsetHeight * 0.5 : dy < 1;
        } else {
          const o = Number(cs.opacity);
          ok = quali === "nascosti" ? o <= 0.01 : o >= 0.99;
        }
        if (!ok) {
          fuori.push(`${ruolo} «${(m.textContent ?? "").trim().slice(0, 40)}»: opacity ${cs.opacity}, transform ${cs.transform}`);
        }
      }
    }
  }
  return { gruppi: gruppi.length, bersagli, fuori };
}

/** Un gruppo-di-sé nascosto almeno 300 px sotto la piega, senza `delay`; `still` con un link dentro. */
async function pick(page: Page, role: "ctn" | "still", mark: string): Promise<Locator> {
  const ok = await page.evaluate(
    ({ role, mark }) => {
      const el = Array.from(
        document.querySelectorAll<HTMLElement>(`#main [data-reveal-group][data-reveal="${role}"][data-reveal-state="hidden"]`),
      ).find((e) => {
        const r = e.getBoundingClientRect();
        return (
          r.top > window.innerHeight + 300 &&
          r.height > 20 &&
          r.height < window.innerHeight * 0.4 &&
          !e.hasAttribute("data-reveal-extra") &&
          (role === "ctn" || e.querySelector("a[href]") !== null)
        );
      });
      el?.setAttribute("data-e2e", mark);
      return Boolean(el);
    },
    { role, mark },
  );
  expect(ok, `nessun blocco ${role} nascosto sotto la piega su /vendi`).toBe(true);
  return page.locator(`[data-e2e="${mark}"]`);
}

test("un blocco ctn entra quando la sua scatola dipinta tocca il fondo, sale di --dt-ctn-y e arriva pieno", async ({
  page,
  goto,
}) => {
  await goto("/vendi");
  await armed(page);
  const el = await pick(page, "ctn", "ingresso");
  expect(await productOpacity(el)).toBeLessThan(0.01);
  const corsa = await page.evaluate(
    () => (Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--dt-ctn-y")) * window.innerWidth) / 100,
  );
  expect(Math.abs((await matrixOf(el)).m42 - corsa)).toBeLessThanOrEqual(1);
  const h = await vh(page);

  // Scarto dichiarato nelle Scelte del commit 4: l'IO misura la scatola traslata.
  // Con il bordo di layout 10 px dentro il fondo, quella scatola è ancora sotto.
  await jump(page, (await absTop(el)) - corsa - h + 10);
  await page.waitForTimeout(400);
  await expect(el).toHaveAttribute("data-reveal-state", "hidden");

  await jump(page, (await absTop(el)) - h + 30);
  await expect(el).toHaveAttribute("data-reveal-state", /revealing|shown/, { timeout: 500 });
  await expect.poll(() => productOpacity(el), { timeout: 2_500 }).toBeGreaterThan(0.99);
  await expect.poll(async () => (await matrixOf(el)).m42, { timeout: 2_500 }).toBeLessThan(0.5);
});

test("risalendo, un blocco che scende sotto l'85 % esce e l'uscita si vede", async ({ page, goto }) => {
  await goto("/vendi");
  await armed(page);
  const el = await pick(page, "ctn", "uscita");
  const h = await vh(page);
  await jump(page, (await absTop(el)) - h * 0.4);
  await expect.poll(() => productOpacity(el), { timeout: 2_500 }).toBeGreaterThan(0.99);

  await jump(page, (await absTop(el)) - h * 0.92);
  const top = await el.evaluate((e) => e.getBoundingClientRect().top);
  expect(top).toBeGreaterThan(h * 0.85);
  expect(top).toBeLessThan(h);
  await expect.poll(() => productOpacity(el), { timeout: 1_300 }).toBeLessThan(0.1);
  expect(await el.evaluate((e) => e.getBoundingClientRect().top)).toBeLessThan(h);
  await expect(el).toHaveAttribute("data-reveal-state", /hiding|hidden/);
});

test("un blocco uscito dall'alto rientra già pieno", async ({ page, goto }) => {
  await goto("/vendi");
  await armed(page);
  const el = await pick(page, "ctn", "alto");
  const h = await vh(page);
  await jump(page, (await absTop(el)) - h * 0.4);
  await expect.poll(() => productOpacity(el), { timeout: 2_500 }).toBeGreaterThan(0.99);

  const altezza = await el.evaluate((e) => e.getBoundingClientRect().height);
  await jump(page, (await absTop(el)) + altezza + 300);
  await page.waitForTimeout(400);
  await expect(el).toHaveAttribute("data-reveal-state", "shown");

  await jump(page, (await absTop(el)) - h * 0.3);
  const minimo = await el.evaluate(
    (e) =>
      new Promise<number>((resolve) => {
        let m = 1;
        const t0 = performance.now();
        const tick = () => {
          m = Math.min(m, Number(getComputedStyle(e).opacity));
          if (performance.now() - t0 > 700) resolve(m);
          else requestAnimationFrame(tick);
        };
        tick();
      }),
  );
  expect(minimo).toBeGreaterThan(0.99);
});

test("un blocco nascosto scavalcato da un salto rientra dall'alto già pieno, senza ingresso", async ({ page, goto }) => {
  await goto("/vendi");
  await armed(page);
  // Oltre la rete dei 2.500 ms dall'armamento: da qui decidono solo l'IO e sweep().
  await page.waitForTimeout(2_700);
  const el = await pick(page, "ctn", "scavalcato");
  const h = await vh(page);
  const altezza = await el.evaluate((e) => e.getBoundingClientRect().height);
  // Un salto solo, da sopra la piega a oltre il blocco: l'IO non vede nessuna intersezione.
  await jump(page, (await absTop(el)) + altezza + h);
  await page.waitForTimeout(300);
  await el.evaluate((e) => {
    const w = window as unknown as Sonde;
    w.__stati = [];
    new MutationObserver(() => w.__stati!.push(e.getAttribute("data-reveal-state") ?? "")).observe(e, {
      attributes: true,
      attributeFilter: ["data-reveal-state"],
    });
  });
  await jump(page, (await absTop(el)) - h * 0.3);
  // La notifica dell'IO arriva nel task dopo il fotogramma del salto: si campiona dal secondo fotogramma.
  const minimo = await el.evaluate(
    (e) =>
      new Promise<number>((resolve) => {
        let m = 1;
        let t0 = 0;
        const tick = (t: number) => {
          if (!t0) t0 = t;
          m = Math.min(m, window.__dtProbe!.opacity(e));
          if (t - t0 > 700) resolve(m);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(() => requestAnimationFrame(tick));
      }),
  );
  expect(minimo).toBeGreaterThan(0.99);
  expect(await page.evaluate(() => (window as unknown as Sonde).__stati ?? [])).not.toContain("revealing");
  await expect(el).toHaveAttribute("data-reveal-state", "shown");
});

test("con l'ancora i gruppi sopra l'arrivo sono pieni subito e, risalendo, nessuno entra dall'alto", async ({ page, goto }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Sonde;
    w.__rientri = [];
    new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as HTMLElement;
        if (el.getAttribute("data-reveal-state") === "revealing" && el.getBoundingClientRect().top < 0) {
          w.__rientri!.push((el.textContent ?? "").trim().slice(0, 40));
        }
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-reveal-state"] });
  });
  await goto("/vendi#contatti");
  await armed(page);
  // L'arrivo è lo scroll nativo del browser al frammento, smooth per
  // html { scroll-behavior: smooth } (~1,5 s): il motore non lo interrompe,
  // perché il refresh di D39 aspetta lo scroll fermo. Qui si misura l'arrivo
  // e non solo il motore: il bordo alto di #contatti dentro il viewport
  // (scrollY ≥ top assoluto dell'ancora − innerHeight).
  const mancante = () =>
    page.evaluate(() => {
      const a = document.getElementById("contatti");
      return a ? a.getBoundingClientRect().top - window.innerHeight : Number.POSITIVE_INFINITY;
    });
  await expect
    .poll(mancante, { message: "/vendi#contatti non arriva all'ancora", timeout: 6_000, intervals: [100] })
    .toBeLessThanOrEqual(0);
  // I gruppi interamente sopra il viewport: shown, e pieni nei bersagli dei membri (D44).
  const conta = () => page.locator("#main [data-reveal-group]").evaluateAll(membriFuoriPosa, "sopra" as const);
  // Pieni all'armamento o alla prima notifica: niente attesa della rete dei 2.500 ms.
  await expect.poll(async () => (await conta()).fuori, { timeout: 400, intervals: [50] }).toEqual([]);
  const sopra = await conta();
  expect(sopra.gruppi).toBeGreaterThan(0);
  expect(sopra.bersagli).toBeGreaterThan(0);

  const h = await vh(page);
  for (let k = 0; k < 4; k++) {
    await page.evaluate((dy) => window.scrollBy({ top: -dy, behavior: "instant" }), h * 0.5);
    await page.waitForTimeout(150);
  }
  expect(await page.evaluate(() => (window as unknown as Sonde).__rientri)).toEqual([]);
});

test("dopo un salto verso l'alto di più di un viewport un blocco rimasto sotto torna nascosto e, ridiscendendo, rigioca l'ingresso senza un'uscita in vista", async ({
  page,
  goto,
}) => {
  await goto("/vendi");
  await armed(page);
  const el = await pick(page, "ctn", "salto-su");
  const h = await vh(page);
  const top = await absTop(el);
  await jump(page, top - h * 0.4);
  await expect(el).toHaveAttribute("data-reveal-state", "shown", { timeout: 3_000 });
  // Passato: sopra il viewport, e resta shown (D21: dall'alto non succede niente).
  const altezza = await el.evaluate((e) => e.getBoundingClientRect().height);
  await jump(page, top + altezza + 300);
  await page.waitForTimeout(400);
  await expect(el).toHaveAttribute("data-reveal-state", "shown");
  // Home, barra di scorrimento, ancora verso l'alto: un salto solo, di almeno un viewport, che
  // lascia il blocco interamente sotto. Da sopra a sotto in un evento nessuno dei due
  // osservatori cambia stato d'intersezione: decide sweep() al fotogramma dopo (C22, D40, spec §2.4).
  const su = Math.max(0, top - h * 3);
  await jump(page, su);
  await expect(el).toHaveAttribute("data-reveal-state", "hidden", { timeout: 500 });
  expect(await productOpacity(el)).toBeLessThan(0.01);
  await el.evaluate((e) => {
    const w = window as unknown as Sonde;
    w.__stati = [];
    new MutationObserver(() => w.__stati!.push(e.getAttribute("data-reveal-state") ?? "")).observe(e, {
      attributes: true,
      attributeFilter: ["data-reveal-state"],
    });
  });
  // Ridiscesa a passi di mezzo viewport (nessun salto): l'ingresso rigioca dal bordo, senza
  // passare da un'uscita in vista.
  for (let y = su + h * 0.5; y < top - h * 0.4; y += h * 0.5) {
    await jump(page, y);
    await page.waitForTimeout(120);
  }
  await jump(page, top - h * 0.4);
  await expect(el).toHaveAttribute("data-reveal-state", /revealing|shown/, { timeout: 1_000 });
  await expect.poll(() => productOpacity(el), { timeout: 2_500 }).toBeGreaterThan(0.99);
  const stati = await page.evaluate(() => (window as unknown as Sonde).__stati ?? []);
  expect(stati[0]).toBe("revealing");
  expect(stati).not.toContain("hiding");
});

test("un gruppo nascosto che uno scroll porta in vista prima della prima notifica entra senza aspettare la rete", async ({
  page,
  goto,
}) => {
  // Lo scroll parte nel microtask dopo il primo observe() di un gruppo del motore:
  // la passata d'armamento è finita e l'IO non ha ancora consegnato niente.
  await page.addInitScript(() => {
    const observe = IntersectionObserver.prototype.observe;
    let fatto = false;
    IntersectionObserver.prototype.observe = function (this: IntersectionObserver, target: Element) {
      observe.call(this, target);
      if (fatto || !(target instanceof HTMLElement) || !target.hasAttribute("data-reveal-group")) return;
      fatto = true;
      queueMicrotask(() => {
        const el = Array.from(
          document.querySelectorAll<HTMLElement>('#main [data-reveal-group][data-reveal="ctn"][data-reveal-state="hidden"]'),
        ).find((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.top > window.innerHeight + 300 &&
            r.height > 20 &&
            r.height < window.innerHeight * 0.4 &&
            !e.hasAttribute("data-reveal-extra")
          );
        });
        if (!el) return;
        el.setAttribute("data-e2e", "primo");
        (window as unknown as { __primoT0?: number }).__primoT0 = performance.now();
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5, behavior: "instant" });
      });
    };
  });
  await goto("/vendi");
  const el = page.locator('[data-e2e="primo"]');
  await expect(el).toHaveCount(1, { timeout: 10_000 });
  // 0,3 s di ritardo + 1,2 s d'ingresso + 0,1 s di margine: prima della rete dei 2,5 s.
  await expect.poll(() => productOpacity(el), { timeout: 1_600, intervals: [50] }).toBeGreaterThan(0.99);
  const ms = await page.evaluate(() => performance.now() - (window as unknown as { __primoT0: number }).__primoT0);
  expect(ms).toBeLessThan(2_500);
});

test("il delay di oggi si somma al ritardo del gruppo: la salita comincia dopo 0,42 s e shown arriva a tween finito", async ({
  page,
  goto,
}) => {
  await goto("/vendi");
  await armed(page);
  // VendiContent.tsx:845: <Reveal delay={120}> con la sola frase di chiusura, quindi ctn.
  // Il primo ctn con lo scarto nel DOM è quello di PageHero.tsx:127, in vista al
  // caricamento a 1440 e quindi shown: si prende il primo nascosto e lo si marca,
  // perché il locator non segua lo stato che cambia.
  const ok = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(
      '#main [data-reveal-group][data-reveal="ctn"][data-reveal-extra="120"][data-reveal-state="hidden"]',
    );
    el?.setAttribute("data-e2e", "scarto");
    return Boolean(el);
  });
  expect(ok, "nessun blocco ctn nascosto con delay={120} su /vendi").toBe(true);
  const el = page.locator('[data-e2e="scarto"]');
  await expect(el).toHaveAttribute("data-reveal-state", "hidden");
  await el.evaluate((e) => {
    const w = window as unknown as Sonde;
    w.__tempi = {};
    new MutationObserver(() => {
      const s = e.getAttribute("data-reveal-state") ?? "";
      w.__tempi![s] ??= performance.now();
      if (s === "revealing") {
        // Opacità al primo fotogramma oltre 380 ms dall'inizio del passaggio. Senza lo
        // scarto la salita comincia a 300 ms e a 380 dtOut è già oltre 0,2; con lo scarto
        // (0,3 + 0,12 s) comincia a 420 ms, quindi a 380 è ancora zero.
        const t0 = performance.now();
        const tick = () => {
          if (performance.now() - t0 >= 380) w.__tempi!.a380 = Number(getComputedStyle(e).opacity);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
      if (s === "shown") w.__tempi!.opacita = Number(getComputedStyle(e).opacity);
    }).observe(e, { attributes: true, attributeFilter: ["data-reveal-state"] });
  });
  const h = await vh(page);
  await jump(page, (await absTop(el)) - h * 0.5);
  await expect(el).toHaveAttribute("data-reveal-state", "shown", { timeout: 3_000 });
  const t = await page.evaluate(() => (window as unknown as Sonde).__tempi!);
  expect(t.a380, "a 380 ms dall'inizio l'opacità deve essere ancora zero: lo scarto di 120 ms non è nel delay del tween").toBeLessThan(0.05);
  // 0,3 s + 0,12 s + 1,2 s = 1,62 s fra revealing e shown, non 1,5 s.
  expect(t.shown - t.revealing).toBeGreaterThanOrEqual(1_600);
  expect(t.shown - t.revealing).toBeLessThanOrEqual(1_800);
  expect(t.opacita).toBeGreaterThanOrEqual(0.99);
});

test("al cambio lingua dopo l'idratazione i gruppi restano armati: nessuno stato tolto, nessun lampo", async ({
  page,
  goto,
}) => {
  // Lo switcher è spento nel build degli e2e (LanguageSwitcher.tsx:12, :38): la lingua
  // cambia dal cookie, che LocaleProvider applica in un effetto dopo l'idratazione
  // (LocaleProvider.tsx:29-36). Nel build la lingua del cookie arriva prima del
  // microtask d'armamento (il layout si idrata prima della pagina), quindi qui si
  // prova solo «nessuno stato tolto, nessun lampo» con dt_locale=de al primo
  // caricamento; la registrazione per sola trigger e hold (nessun `locale` fra le
  // dipendenze) la presidia reveal-engine.test.ts.
  await page.context().addCookies([{ name: "dt_locale", value: "de", domain: "127.0.0.1", path: "/" }]);
  await page.addInitScript(() => {
    const w = window as unknown as Sonde;
    w.__tolti = [];
    new MutationObserver((records) => {
      for (const r of records) {
        const el = r.target as Element;
        if (r.oldValue !== null && !el.hasAttribute(r.attributeName!)) w.__tolti!.push(r.attributeName!);
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-reveal-state", "data-reveal-armed", "lang"],
    });
  });
  await goto("/vendi");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await armed(page);
  await page.waitForTimeout(1_000);
  expect(await page.evaluate(() => (window as unknown as Sonde).__tolti)).toEqual([]);
  // Un lampo è un bersaglio di un membro di un gruppo hidden che si vede (D44).
  const nascosti = await page.locator("#main [data-reveal-group]").evaluateAll(membriFuoriPosa, "nascosti" as const);
  expect(nascosti.gruppi).toBeGreaterThan(0);
  expect(nascosti.bersagli).toBeGreaterThan(0);
  expect(nascosti.fuori).toEqual([]);
});

test("un blocco con un link entra solo in opacità: declassato a still, fermo e non cliccabile finché è fuori", async ({
  page,
  goto,
}) => {
  await goto("/vendi");
  await armed(page);
  await expect(page.locator("#main [data-reveal-group]:has(a[href])").first()).toHaveAttribute("data-reveal", "still");
  const el = await pick(page, "still", "declassato");
  expect(await productOpacity(el)).toBeLessThan(0.01);
  expect((await matrixOf(el)).m42).toBe(0);
  expect(await el.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe("none");

  // Il puntatore torna all'inizio dell'ingresso (pointer-events inline tolto dal motore
  // prima del tween), prima che l'opacità salga: un click di Playwright su un link
  // dentro il blocco non aspetta il tween (Step 24).
  // `trial: true` fa solo i controlli di azionabilità, compreso il bersaglio del puntatore.
  const h = await vh(page);
  await jump(page, (await absTop(el)) - h * 0.5);
  await expect(el).toHaveAttribute("data-reveal-state", /revealing|shown/, { timeout: 500 });
  expect(await el.evaluate((e) => getComputedStyle(e).pointerEvents)).toBe("auto");
  await el.locator("a[href]").first().click({ trial: true, timeout: 1_000 });
});

test("il fuoco dentro un blocco nascosto lo mostra subito", async ({ page, goto }) => {
  await goto("/vendi");
  await armed(page);
  const el = await pick(page, "still", "fuoco");
  await el.evaluate((e) => (e.querySelector("a[href]") as HTMLElement).focus({ preventScroll: true }));
  await expect(el).toHaveAttribute("data-reveal-state", "shown", { timeout: 300 });
  expect(await productOpacity(el)).toBeGreaterThan(0.99);
});

test("reduced-motion a pagina aperta: via gli stati, testo pieno e fermo", async ({ page, goto }) => {
  await goto("/vendi");
  await armed(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-reveal-armed]")).toHaveCount(0, { timeout: 2_000 });
  const storti = await page
    .locator("#main .reveal")
    .evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).transform !== "none").length);
  expect(storti).toBe(0);
  expect(await page.evaluate(() => document.documentElement.hasAttribute("data-hero-intro"))).toBe(false);
});
