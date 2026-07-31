import { defineConfig, devices } from "@playwright/test";

// Test di browser. Oggi coprono l'assistente (mobile e desktop); la suite completa del sito
// arriverà nella stessa cartella, con questa stessa configurazione — un solo framework.
//
// Il server parte da qui su una porta sua, così non litiga con `npm run dev`. Non riusiamo mai
// un server già in ascolto: sulla stessa macchina possono esserci altri worktree dello stesso
// progetto, e un server "riusato" che viene da un altro branch fa fallire i test per finta.
// La chat è dietro un flag: lo accendiamo solo per i test, mai in produzione.

const PORT = Number(process.env.E2E_PORT ?? 3177);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Reduced motion: salta il preloader (che è escluso proprio da questa preferenza) e rende
    // ripetibile l'apertura del pannello. Che le animazioni siano davvero condizionate lo
    // verificano i test unitari sul sorgente.
    contextOptions: { reducedMotion: "reduce" },
    // Screenshot e traccia solo quando qualcosa è andato storto: il resto è rumore.
    screenshot: "only-on-failure",
    video: "off",
    trace: "on-first-retry",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    // Build di produzione, non dev server: è quello che va in rete, non ha l'overlay di
    // sviluppo e non dipende dall'HMR (che in un browser pilotato non si aggancia).
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      // Il flag serve al test, non al sito: resta spento ovunque altro.
      NEXT_PUBLIC_ENABLE_ASSISTANT: "true",
    },
  },
});
