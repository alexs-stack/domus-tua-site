import { defineConfig, devices } from "@playwright/test";

// Suite end-to-end del sito: le pagine, la ricerca, i moduli, l'accessibilità.
//
// È la terza configurazione Playwright del repo, e le tre non si sovrappongono mai:
//   playwright.config.ts            regressione visiva della scheda immobile (screenshot macOS)
//   playwright.assistant.config.ts  assistente, con un build che ha il flag acceso
//   playwright.site.config.ts       questa — tutto il resto del sito
// Le prime due hanno bisogno di build diversi da questo (screenshot presi senza assistente, e
// l'assistente acceso al build), quindi le loro specifiche sono escluse qui sotto: girano con
// la propria configurazione, non con questa.
//
// **Viewport.** Cinque, come da specifica. Farli girare tutti su ogni test moltiplicherebbe per
// cinque un tempo che non serve a nessuno: i tre viewport intermedi eseguono solo i test marcati
// `@layout`, cioè quelli in cui la larghezza cambia davvero il comportamento (header, griglie,
// pannelli). I due estremi — 390 e 1440 — eseguono tutto.
//
// **Server.** Build di produzione, non `next dev`: sotto un browser pilotato l'HMR non si
// aggancia e la pagina non arriva mai a idratarsi. Porta dedicata e mai riusata: sulla stessa
// macchina possono esserci altri worktree dello stesso progetto, e un server "riusato" venuto da
// un altro branch fa fallire i test per finta.
//
// **Terze parti.** Mai contattate: le blocca la fixture in e2e/helpers.ts.
//
// **Reduced motion.** Non è globale: il preloader va provato anche quando c'è. I test che
// vogliono una pagina ferma saltano l'intro con la fixture `goto`, che scrive la chiave di
// sessione — è il meccanismo del sito, non un trucco del test.
//
// Lo smoke test sul feed live sta in e2e-live/ e NON fa parte di questa suite (vedi
// `npm run test:e2e:live`): dipende da un servizio esterno, quindi non può bloccare la CI.

const PORT = Number(process.env.E2E_PORT ?? 3177);

/** Solo i test che dipendono dalla larghezza. */
const LAYOUT_ONLY = /@layout/;

export default defineConfig({
  testDir: "./e2e",
  // Le specifiche delle altre due configurazioni: hanno bisogno di un altro build (vedi sopra).
  testIgnore: ["property-detail.spec.ts", "assistant.spec.ts", "tastiera.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Il server sotto test è un processo solo: troppi worker in parallelo misurano la coda del
  // server, non il sito.
  workers: process.env.CI ? 2 : 4,
  // 120s, non 45. Il passaggio di axe su una pagina lunga (home, /acquista) da solo arriva a
  // ~43s con due worker attivi: con 45 il margine era zero e la suite falliva a intermittenza
  // per il tempo, non per un difetto del sito. Un test che serve davvero non deve costringere
  // a rieseguire la CI per capire se il rosso era vero.
  timeout: 120_000,
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Solo in caso di errore: il resto è rumore che occupa spazio negli artefatti.
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    // Tutti i progetti girano su Chromium: i descrittori dei dispositivi Apple porterebbero
    // WebKit, che in CI andrebbe installato a parte per misurare una cosa diversa da quella che
    // ci interessa qui — l'impaginazione alle varie larghezze, non le differenze fra motori.
    // Viewport completi: eseguono tutta la suite.
    { name: "mobile-390", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    // Viewport di controllo: solo i test di impaginazione.
    {
      name: "mobile-360",
      grep: LAYOUT_ONLY,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 640 },
        hasTouch: true,
      },
    },
    { name: "tablet-768", grep: LAYOUT_ONLY, use: { ...devices["iPad Mini"], browserName: "chromium" } },
    {
      name: "desktop-1366",
      grep: LAYOUT_ONLY,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      // Il flag serve ai test, non al sito: resta spento ovunque altro.
      NEXT_PUBLIC_ENABLE_ASSISTANT: "true",
      // Dati stabili: in CI si usano le fixture del repo, mai il feed dell'agenzia.
      NEXT_PUBLIC_USE_REALSMART: "false",
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${PORT}`,
    },
  },
});
