import { defineConfig, devices } from "@playwright/test";

// E2E della sezione TERRITORIALE ("Vivere in zona"), separata dalle altre tre configurazioni.
//
// Perché una configurazione a sé: come per l'assistente, questa suite ha bisogno di un BUILD
// diverso. La route di anteprima è 404 in produzione per costruzione; qui il build viene fatto con
// `TERRITORY_PREVIEW=1`, che la rende raggiungibile SOLO in questo contesto di test. I deploy di
// produzione non impostano mai quella variabile.
//
//   npm run e2e:territory
//
// Nessuna rete esterna: i dati della pagina di anteprima sono fixture nel repository, i POI non
// vengono da un provider e non esiste alcun tile di mappa da scaricare.

const PORT = Number(process.env.E2E_TERRITORY_PORT ?? 3211);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["territory.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 4,
  timeout: 60_000,
  reporter: process.env.CI ? [["github"], ["line"]] : [["list"]],
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      // Rende raggiungibile /territory-preview su un build di produzione, SOLO qui.
      TERRITORY_PREVIEW: "1",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      NEXT_PUBLIC_USE_REALSMART: "false",
      REALSMART_ALLOW_MOCK: "true",
    },
  },
});
