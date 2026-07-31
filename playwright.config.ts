// Configurazione Playwright per la verifica end-to-end della scheda immobile.
//
// I test girano contro il BUILD di produzione (`next build && next start`): è l'unico modo per
// verificare davvero l'HTML server-rendered che vede l'utente, compresa la pipeline RealSmart.
//
//   npm run e2e                    esegue i test
//   npm run e2e -- --update-snapshots   rigenera gli screenshot di riferimento
//
// Gli screenshot di riferimento sono in e2e/__screenshots__/ e vanno letti nel diff della PR.

import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  snapshotDir: "./e2e/__screenshots__",
  // Un solo worker: i test condividono un unico server e confrontano screenshot.
  workers: 1,
  fullyParallel: false,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 60_000,
  expect: {
    // Tolleranza minima: cattura le regressioni di layout senza rompersi per l'antialiasing.
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" },
  },
  use: {
    baseURL: BASE_URL,
    // Le animazioni d'ingresso GSAP sono già disattivate da prefers-reduced-motion: così gli
    // screenshot sono stabili e, insieme, si verifica che il rispetto della preferenza funzioni.
    // (Un test dedicato controlla che la preferenza arrivi davvero alla pagina.)
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "laptop-1366", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
    { name: "tablet-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "mobile-390", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } } },
    { name: "mobile-430", use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npx next start --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
