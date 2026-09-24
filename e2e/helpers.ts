import { test as base, expect, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { CONSENT_COOKIE } from "../app/lib/consent";
import { INTRO_KEY } from "../app/components/motion/Preloader";

// Attrezzatura comune della suite.
//
// Tre problemi risolti una volta sola:
//  1. **Il preloader.** Gira una volta per sessione. Un test che aspetta la fine dell'intro a
//     ogni pagina è lento e ballerino: `skipIntro` scrive la chiave di sessione prima del
//     caricamento, come se l'intro fosse già stata vista. Il test dedicato all'intro non lo usa.
//  2. **I provider esterni.** YouTube, Trustindex, le tessere della mappa: in CI non devono
//     essere raggiunti. Vengono bloccati per default e serviti come risposte finte, così i test
//     non dipendono da servizi altrui né dalla rete.
//  3. **Gli errori silenziosi.** Ogni test raccoglie errori di console e richieste fallite; a
//     fine test la fixture li fa emergere invece di lasciarli passare.

export { expect };

/** Host di terze parti che in CI non vengono mai contattati. */
const EXTERNAL_HOSTS = [
  "youtube.com",
  "youtube-nocookie.com",
  "ytimg.com",
  "googlevideo.com",
  "trustindex.io",
  "google.com",
  "gstatic.com",
  "tile.openstreetmap.org",
  "basemaps.cartocdn.com",
  "unpkg.com",
];

/** Richieste che possono fallire senza che sia un problema del sito. */
const IGNORED_FAILURES = [/_next\/static\/.*\.map$/, /favicon/, /__nextjs/, /\/_next\/webpack-hmr/];

/** Errori di console che non dicono niente sul sito. */
const IGNORED_CONSOLE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /webpack-hmr/i,
  /ERR_INTERNET_DISCONNECTED/i, // prodotto di proposito dai test offline
];

export type Guards = {
  /** Errori di console raccolti finora. */
  consoleErrors: string[];
  /** Richieste fallite che non rientrano fra quelle ignorate. */
  failedRequests: string[];
};

type Fixtures = {
  guards: Guards;
  /** Va su `path` con l'intro già "vista": la pagina è subito utilizzabile. */
  goto: (path: string) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  guards: async ({ page }, use) => {
    const guards: Guards = { consoleErrors: [], failedRequests: [] };

    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const text = m.text();
      if (IGNORED_CONSOLE.some((r) => r.test(text))) return;
      guards.consoleErrors.push(text);
    });
    page.on("pageerror", (e) => guards.consoleErrors.push(`pageerror: ${e.message}`));
    page.on("requestfailed", (r) => {
      const url = r.url();
      if (IGNORED_FAILURES.some((re) => re.test(url))) return;
      // Le terze parti le blocchiamo noi: non sono un fallimento del sito.
      if (EXTERNAL_HOSTS.some((h) => url.includes(h))) return;
      guards.failedRequests.push(`${url} :: ${r.failure()?.errorText}`);
    });

    // Terze parti: mai contattate. Rispondiamo con qualcosa di innocuo, così il sito degrada
    // come farebbe con un provider lento o bloccato da un ad blocker.
    await page.route(
      (url) => EXTERNAL_HOSTS.some((h) => url.hostname.endsWith(h)),
      (route: Route) => {
        const type = route.request().resourceType();
        if (type === "image") {
          return route.fulfill({
            status: 200,
            contentType: "image/gif",
            body: Buffer.from("R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==", "base64"),
          });
        }
        if (type === "script") return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
        return route.fulfill({ status: 204, body: "" });
      },
    );

    await use(guards);
  },

  goto: async ({ page }, use) => {
    await page.addInitScript(
      ([key]) => {
        try {
          sessionStorage.setItem(key, "1");
        } catch {
          /* storage negato: pazienza, l'intro partirà */
        }
      },
      [INTRO_KEY],
    );
    await use(async (path: string) => {
      // `domcontentloaded`, non `load`: la home ha un video di sfondo da diversi megabyte e
      // aspettare che finisca di scaricarsi non dice niente sul fatto che la pagina funzioni —
      // dice solo quanto è veloce la rete. Ciò che serve è l'HTML e l'idratazione, e quella la
      // aspettano le asserzioni.
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("header").first()).toBeVisible();
    });
  },
});

/** Registra la scelta sui cookie prima del caricamento: niente banner, niente gate chiusi. */
export async function setConsent(page: Page, value: "accepted" | "rejected") {
  await page.context().addCookies([
    { name: CONSENT_COOKIE, value, domain: "127.0.0.1", path: "/" },
  ]);
}

/**
 * Un click che sopravvive all'idratazione.
 *
 * L'HTML arriva prima del JavaScript: un click sul bottone giusto un istante troppo presto non
 * trova ancora un gestore. Si riprova finché l'effetto atteso non c'è.
 */
export async function clickUntil(
  click: () => Promise<void>,
  expectation: () => Promise<void>,
  timeout = 25_000,
) {
  await expect(async () => {
    await click();
    await expectation();
  }).toPass({ timeout });
}

/**
 * Violazioni di accessibilità sulla pagina corrente (WCAG A/AA, contrasto compreso).
 *
 * Gli iframe restano fuori dall'analisi: dentro c'è il widget recensioni di Trustindex, con il
 * suo markup e i suoi colori. Segnalarne il contrasto qui significherebbe tenere rossa la suite
 * per un difetto che non possiamo correggere — e nasconderebbe i nostri.
 */
export async function a11yViolations(page: Page, disable: string[] = []) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("iframe")
    .disableRules(disable)
    .analyze();
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    help: v.help,
    target: v.nodes[0]?.target?.join(" "),
  }));
}

/** Il primo immobile della griglia, qualunque sia — i test non conoscono nessuno slug. */
export function firstListingLink(page: Page) {
  return page.locator('a[href^="/case/"]').first();
}
