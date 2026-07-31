import { defineConfig, devices } from "@playwright/test";

// E2E dell'assistente.
//
// Il server di prova gira con NEXT_PUBLIC_ENABLE_ASSISTANT=true e SENZA chiavi: i test non
// devono mai dipendere da un provider AI, dal feed RealSmart o dal provider email. Le
// risposte arrivano da uno stream SSE simulato via intercettazione di rete (e2e/mock.ts),
// così ciò che si verifica è il contratto della UI — che è esattamente ciò che gli unit test
// non possono coprire.
//
//   npm run e2e            headless
//   npm run e2e -- --ui    interattivo

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // La homepage è pesante (hero, GSAP, media) e l'intro dura qualche secondo: con troppi
  // worker in parallelo il solo caricamento consumava il budget del test. Meno worker e
  // più margine rendono la suite stabile senza nascondere problemi veri.
  workers: 4,
  timeout: 60_000,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Il traffico reale è in maggioranza da smartphone: il mobile non è un extra.
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "npm run build && npm run start -- --port 3210",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      NEXT_PUBLIC_ENABLE_ASSISTANT: "true",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3210",
      NEXT_PUBLIC_USE_REALSMART: "false",
    },
  },
});
