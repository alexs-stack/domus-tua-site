import { defineConfig, devices } from "@playwright/test";

// E2E dell'ASSISTENTE, separati da playwright.config.ts (regressione visiva della scheda).
//
// Perché due configurazioni e non una: le due suite hanno bisogno di build DIVERSE.
// Gli screenshot di riferimento sono stati presi senza assistente; costruire con
// NEXT_PUBLIC_ENABLE_ASSISTANT=true farebbe comparire il launcher in ogni schermata e
// romperebbe tutti i confronti. Tenerle separate evita di dover scegliere quale sacrificare.
//
//   npm run e2e:assistant
//
// Le risposte arrivano da uno stream SSE simulato via intercettazione di rete (e2e/mock.ts):
// nessuna chiave, nessun feed, nessuna rete. Tutto il resto è l'applicazione vera.

const PORT = Number(process.env.E2E_ASSISTANT_PORT ?? 3210);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Solo le specifiche dell'assistente: la regressione visiva vive nell'altra configurazione.
  testMatch: ["assistant.spec.ts", "tastiera.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // La homepage è pesante (hero, GSAP, media) e l'intro dura qualche secondo: con troppi
  // worker in parallelo il solo caricamento consumava il budget del test.
  workers: 4,
  timeout: 60_000,
  reporter: process.env.CI ? [["github"], ["line"]] : [["list"]],
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Il traffico reale è in maggioranza da smartphone, e iPhone significa WebKit: è lì che
    // sono emersi il focus non restituito al launcher e altre differenze da Chrome.
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    // NEXT_PUBLIC_* è inlinato al BUILD: l'assistente va acceso qui, non allo start.
    command: `npm run build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_ENABLE_ASSISTANT: "true",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      NEXT_PUBLIC_USE_REALSMART: "false",
    },
  },
});
