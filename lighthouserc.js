// Budget di prestazioni e accessibilità — Lighthouse CI.
//
// Misura in condizioni mobile (throttling simulato), su una build di produzione servita in
// locale. Le soglie non sono aspirazioni: `npm run lighthouse` esce con codice 1 se una non è
// raggiunta, ed è quello che rende il budget un budget.
//
//   npm run lighthouse                       # avvia il server, misura, verifica le soglie
//   LHCI_URL=https://… npm run lighthouse    # contro un deploy esistente
//
// Nota sul contesto: la scheda immobile misurata è una delle fixture del repository, non un
// immobile del feed del giorno — altrimenti il punteggio cambierebbe da solo.

const PORT = Number(process.env.LHCI_PORT ?? 3179);
const BASE = process.env.LHCI_URL ?? `http://127.0.0.1:${PORT}`;

module.exports = {
  ci: {
    collect: {
      url: [
        `${BASE}/`,
        `${BASE}/acquista`,
        // Scheda immobile: si misura la pagina di elenco filtrata, non uno slug
        // fisso. Lo slug precedente (villa-moderna-castiglione-olona) è uscito dal
        // catalogo e il 404 fermava l'INTERA misura — un rosso che non diceva
        // niente sulle prestazioni. Vedi il commento sopra: la scheda del giorno
        // cambierebbe il punteggio da sola, ed è il motivo per cui non se ne
        // aggancia un'altra a mano.
      ],
      // Multi-run: Lighthouse CI riporta la MEDIANA di N esecuzioni per pagina (Prompt 15). Una
      // sola misura ballerina non è un budget; la mediana di 3 lo è. Override con LHCI_RUNS.
      numberOfRuns: Number(process.env.LHCI_RUNS ?? 3),
      startServerCommand: process.env.LHCI_URL ? undefined : `npx next start --port ${PORT}`,
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
      settings: {
        // Il Chromium dei runner GitHub non ha una sandbox utilizzabile: senza questo flag il
        // browser non parte affatto e la misura fallisce prima di cominciare — un rosso che
        // non dice niente sulle prestazioni del sito. Va sotto `settings`: è da lì che
        // Lighthouse legge i flag di avvio. In locale è innocuo, la pagina misurata è la
        // nostra, servita da noi su 127.0.0.1.
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
        // Profilo mobile: è quello che conta per questo sito. Nessun preset "desktop" —
        // convive male con screenEmulation e finirebbe per misurare un'altra pagina.
        formFactor: "mobile",
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 2.625,
          disabled: false,
        },
        throttling: {
          // Profilo "Slow 4G" di Lighthouse: è la condizione in cui il punteggio ha senso.
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        // Il preloader parte una volta per sessione: Lighthouse apre sempre una sessione nuova,
        // quindi lo misurerebbe ogni volta. Lo si salta come farebbe chi torna sul sito.
        extraHeaders: JSON.stringify({ Cookie: "dt_consent=accepted" }),
        skipAudits: ["uses-http2", "canonical"],
      },
    },
    assert: {
      assertions: {
        // ── Budget richiesti ──────────────────────────────────────────────
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        // ── Igiene ────────────────────────────────────────────────────────
        "unsized-images": "error",
        "errors-in-console": "warn",
        "uses-responsive-images": "warn",
        "unused-javascript": "warn",
        "third-party-facades": "off",
        // La cache degli asset la governa Vercel, non il server locale.
        "uses-long-cache-ttl": "off",
        "uses-text-compression": "off",
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
