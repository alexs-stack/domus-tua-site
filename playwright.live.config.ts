import { defineConfig, devices } from "@playwright/test";

// Smoke test sul feed VERO di RealSmart — configurazione separata, di proposito.
//
// Non condivide nulla con la suite principale: altra cartella, altro server (col feed live
// acceso), altro comando. Così non può finire per sbaglio nella CI bloccante, e un guasto del
// gestionale non fa diventare rosso un pull request che non c'entra.
//
//   npm run test:e2e:live                       # build locale col feed acceso
//   E2E_LIVE_URL=https://… npm run test:e2e:live  # contro un deploy esistente
//
// Serve un ambiente con NEXT_PUBLIC_USE_REALSMART=true e le credenziali del feed.

const PORT = Number(process.env.E2E_PORT ?? 3178);
const EXTERNAL = process.env.E2E_LIVE_URL;

export default defineConfig({
  testDir: "./e2e-live",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: EXTERNAL ?? `http://127.0.0.1:${PORT}`,
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "live", use: { ...devices["Desktop Chrome"] } }],
  // Contro un deploy esistente non si avvia niente in locale.
  ...(EXTERNAL
    ? {}
    : {
        webServer: {
          command: `npm run build && npm run start -- --port ${PORT}`,
          url: `http://127.0.0.1:${PORT}`,
          reuseExistingServer: false,
          timeout: 300_000,
          env: { NEXT_PUBLIC_USE_REALSMART: "true" },
        },
      }),
});
