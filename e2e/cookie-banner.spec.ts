import { test, expect } from "./helpers";
import { HERO_REST_MS } from "../app/lib/motion/intro-constants";

// Il banner cookie dopo il sipario: una scelta fatta resta fatta.
//
// Audit del 21 settembre 2026 (blocco 23), difetto V01. CookieConsent aspetta
// INTRO_EVENT per mostrarsi (mai sotto il sipario) e tiene una rete di sicurezza
// a HERO_REST_MS «se l'evento va perso». La rete NON veniva cancellata quando
// l'evento arrivava, e scattava dopo la scelta: chi cliccava «Solo necessari»
// entro ~1,3 s dalla fine della porta corta vedeva il banner tornare, col cookie
// già scritto (sonda: scratchpad/audit-interne/probe-cookie2.mjs, mutazioni
// [1136 consent=true] [2622 …]). Qui si rifà il gesto del visitatore nei due
// percorsi in cui il banner arriva dopo il sipario: la porta corta di una pagina
// interna e il film della home saltato col tasto.
//
// La rete si arma nell'effect di CookieConsent, cioè all'idratazione: il difetto
// si vede solo se l'idratazione precede l'handoff (porta corta a 0,88 s) o se lo
// skip arriva dopo l'idratazione (film). Nel messaggio d'errore c'è la cronologia
// di `data-consent` letta dentro la pagina, così un rosso dice CHI ha rimesso
// l'attributo.
//
// QUANTO DISCRIMINA, DETTO ONESTAMENTE (revisori del 21 settembre, secondo giro).
// Rieseguita sul codice prima della correzione, la matrice era rossa in un caso
// su quattro: la porta corta su desktop-1440. Sulla corta il rosso dipende
// dalla macchina — la finestra c'è solo se l'idratazione arriva prima dei 0,88 s
// della porta, come a caldo e in produzione, non su un server appena partito —
// e sul film il tasto si preme quando il JS è al timone (`data-pre-live`), ma il
// difetto lì non si è mai riprodotto. Quindi: il test della porta corta è la
// REGRESSIONE (rossa quando la finestra si apre), i due del film sono FUMO
// (il banner arriva dopo il tuffo e una scelta resta chiusa). La rete che non
// si cancella non torna per via del sorgente: intro-clocks.test.ts pretende che
// CookieConsent.tsx usi afterCurtain di fold.ts, senza setTimeout né INTRO_EVENT
// suoi, ed è afterCurtain a cancellare la rete all'handoff.
//
// NIENTE fixture `goto`: scrive INTRO_QUIET e il banner apparirebbe prima del
// paint, cioè fuori dal percorso che si sta provando (vedi mobile-motion.spec.ts).

/** Quanto aspettare dopo il clic perché la rete, se scatta, sia scattata. */
const OLTRE_LA_RETE_MS = HERO_REST_MS + 1500;

type Cronologia = Array<[number, string]>;

/** Registra ogni mutazione di `data-consent` e `data-preloader` su <html>, con l'ora. */
function registraConsenso() {
  const w = window as unknown as { __dtConsenso: Cronologia };
  w.__dtConsenso = [];
  const leggi = () => {
    const h = document.documentElement;
    w.__dtConsenso.push([
      Math.round(performance.now()),
      `consent=${h.hasAttribute("data-consent")} pre=${h.getAttribute("data-preloader") ?? "-"}`,
    ]);
  };
  new MutationObserver(leggi).observe(document, {
    subtree: true,
    attributes: true,
    attributeFilter: ["data-consent", "data-preloader"],
  });
}

async function scegliSoloNecessari(page: import("@playwright/test").Page) {
  const banner = page.getByRole("region", { name: /cookie/i });
  await expect(banner, "il banner non è comparso dopo il sipario").toBeVisible({ timeout: 15_000 });
  await banner.getByRole("button", { name: /solo necessari|necessary only|nécessaires|notwendige|necesarias/i }).click();
  await expect(banner).toBeHidden();
  await page.waitForTimeout(OLTRE_LA_RETE_MS);
  const stato = await page.evaluate(() => ({
    attributo: document.documentElement.hasAttribute("data-consent"),
    cookie: document.cookie,
    cronologia: (window as unknown as { __dtConsenso: Cronologia }).__dtConsenso,
  }));
  const cronologia = stato.cronologia.map(([t, s]) => `[${t} ${s}]`).join(" ");
  await expect(banner, `il banner è ricomparso dopo la scelta — ${cronologia}`).toBeHidden();
  expect(stato.attributo, `html porta ancora data-consent dopo la scelta — ${cronologia}`).toBe(false);
  expect(stato.cookie).toMatch(/dt_consent=rejected/);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(registraConsenso);
});

test("porta corta su /vendi: «Solo necessari» appena il banner compare, e il banner non torna (regressione)", async ({ page, guards }) => {
  void guards;
  await page.goto("/vendi", { waitUntil: "domcontentloaded" });
  await scegliSoloNecessari(page);
});

test("film della home saltato col tasto: «Solo necessari» subito, e il banner non torna (fumo)", async ({ page, guards }) => {
  void guards;
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Il tasto salta al tuffo solo quando il JS è al timone (data-pre-live); se
  // il film è già finito il banner è comunque lì. Un respiro dopo l'idratazione,
  // così gli effect (e la rete del banner) sono già a posto quando si salta.
  await page.waitForFunction(
    () =>
      document.documentElement.hasAttribute("data-pre-live") ||
      !document.documentElement.hasAttribute("data-preloader"),
    undefined,
    { timeout: 15_000, polling: "raf" },
  );
  await page.waitForTimeout(300);
  await page.keyboard.press("Enter");
  await scegliSoloNecessari(page);
});
