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
        // LA STESSA HOME, SENZA L'INTRO — e non con un trucco: con il meccanismo del sito.
        // Lo script di boot in app/layout.tsx fa `if(deep){sessionStorage.setItem("dt-intro-seen","1")}`,
        // dove `deep = !!location.hash`. Chi arriva su /#contatti da un link non vede il sipario,
        // perché la coreografia dell'arco presuppone la pagina in cima. Un frammento che non
        // corrisponde a nessun id non fa scorrere niente: resta solo l'effetto "intro già vista".
        // Serve perché `${BASE}/` misura la PRIMA visita, e lì l'elemento LCP è il sipario stesso
        // (misurato: `div.dt-preloader.is-arch`, Load Delay 5858 ms = 60% di un LCP da 9,7 s).
        // Con quell'elemento in campo la soglia LCP≤2500 non è raggiungibile per costruzione, e un
        // rosso che non si può chiudere è un rosso che si impara a ignorare. Le due righe insieme
        // dicono la verità intera: quanto costa l'intro, e quanto costa la pagina.
        `${BASE}/#senza-intro`,
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
        // QUI C'ERA UN `extraHeaders: { Cookie: "dt_consent=accepted" }` con scritto accanto che
        // serviva a saltare il preloader «come farebbe chi torna sul sito». Non lo faceva, per due
        // motivi indipendenti, e nel frattempo la riga raccontava a chi leggeva che il numero della
        // home fosse quello della pagina senza intro. Era la bugia più costosa del file.
        //   1. Il preloader non guarda i cookie. Lo script di boot decide con
        //      `!sessionStorage.getItem("dt-intro-seen")`, e Lighthouse apre una sessione pulita a
        //      ogni run: l'intro suonava sempre, ed era lei l'elemento LCP della home.
        //   2. `extraHeaders` aggiunge un'INTESTAZIONE DI RICHIESTA, non un cookie nel browser.
        //      Il consenso qui si legge solo da `document.cookie` (app/lib/consent.ts, nessun
        //      lettore server), che restava vuoto: il banner compariva comunque — e in una delle
        //      misure è finito lui elemento LCP (`#cookie-consent-desc`).
        // Tolta: era inerte. L'intro si salta con il deep link qui sopra, che è il meccanismo vero
        // del sito; il banner resta in campo perché una prima visita lo vede davvero.
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
