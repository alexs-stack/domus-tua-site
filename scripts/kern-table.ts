/**
 * Tabella di crenatura dei caratteri spezzati (spec §2.3, D20; A20 di Alberto: flip per lettera;
 * D36: al massimo 64 KB, perché la tabella entra nel bundle client con SplitTitle).
 *
 * Un carattere dentro un inline-block perde le coppie di kerning. SplitChars le rimette con
 * `--k` sul carattere di sinistra, letto da app/lib/motion/kern-table.json. La misura si fa NEL
 * DOM del build di produzione: uno span con la classe del ruolo (quindi la stessa `font`
 * calcolata dei titoli e le `font-feature-settings` del body, globals.css:249), 100 px,
 * `k = w("ab") − w("a") − w("b")` con Range.getBoundingClientRect.
 *
 *   npm run build
 *   npx tsx scripts/kern-table.ts                         # next start sulla 3179, misura, scrive, chiude
 *   npx tsx scripts/kern-table.ts --brand-senza-accenti   # D36: brand-800 senza minuscole accentate
 *
 * `script-400` misura solo i glifi delle parole calligrafiche dei sorgenti di app/ (D36). Si
 * rigenera nello stesso commit che cambia un font (layout.tsx:137-162) o aggiunge una parola
 * calligrafica. Uscita 2: tabella oltre 64 KB.
 */
import { chromium } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PORT = 3179;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(ROOT, "app/lib/motion/kern-table.json");
const TETTO_BYTE = 64 * 1024;
const SENZA_ACCENTI = process.argv.includes("--brand-senza-accenti");

// Maiuscole latine con gli accentati di it/fr/de/es, minuscole (solo per il logo), cifre e la
// punteggiatura dei titoli.
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÀÁÂÄÇÈÉÊËÌÍÎÏÑÒÓÔÖÙÚÛÜ";
const LOWER_BASE = "abcdefghijklmnopqrstuvwxyz";
const LOWER_ACCENTI = "àáâäçèéêëìíîïñòóôöùúûüß";
const DIGITS = "0123456789";
const PUNCT = "’'«»-:?!&/,.";

/** I glifi delle parole calligrafiche (ruolo `accent`, spec §2.2) nelle cinque lingue, dai sorgenti di app/. */
function glifiCalligrafici(): string {
  const file: string[] = [];
  const giro = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "__tests__") giro(p);
      } else if (e.name.endsWith(".tsx")) {
        file.push(p);
      }
    }
  };
  giro(path.join(ROOT, "app"));
  const set = new Set<string>();
  const aggiungi = (s: string) => {
    for (const g of Array.from(s)) if (g.trim() !== "") set.add(g);
  };
  for (const f of file) {
    const t = readFileSync(f, "utf8");
    // PageHero: scriptWord={{ it: "…", en: "…", fr: "…", de: "…", es: "…" }[locale]}
    for (const m of t.matchAll(/scriptWord=\{\{([^}]*)\}/g)) for (const q of m[1].matchAll(/"([^"]+)"/g)) aggiungi(q[1]);
    // HorizonStory, CostiChiari: scriptWord: "…" nei dizionari del componente
    for (const m of t.matchAll(/scriptWord:\s*"([^"]+)"/g)) aggiungi(m[1]);
    // Method: word: "…" dei tre atti
    if (path.basename(f) === "Method.tsx") for (const m of t.matchAll(/\bword:\s*"([^"]+)"/g)) aggiungi(m[1]);
  }
  if (set.size === 0) throw new Error("nessuna parola calligrafica trovata in app/: controllare le regex di glifiCalligrafici()");
  return [...set].sort().join("");
}

type Key = "display-400" | "display-500" | "brand-800" | "script-400";
const SETS: Record<Key, { className: string; weight: string; glyphs: string }> = {
  "display-400": { className: "font-display", weight: "400", glyphs: UPPER + DIGITS + PUNCT },
  "display-500": { className: "font-display", weight: "500", glyphs: UPPER + DIGITS + PUNCT },
  "brand-800": {
    className: "font-brand",
    weight: "800",
    glyphs: UPPER + LOWER_BASE + (SENZA_ACCENTI ? "" : LOWER_ACCENTI) + DIGITS + PUNCT,
  },
  "script-400": { className: "script-word", weight: "400", glyphs: glifiCalligrafici() },
};

async function aspettaServer() {
  for (let i = 0; i < 240; i += 1) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      /* non ancora in ascolto */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`next start non risponde su ${BASE}: manca il build?`);
}

async function main() {
  const server = spawn(process.execPath, [path.join(ROOT, "node_modules/next/dist/bin/next"), "start", "-p", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, REALSMART_ALLOW_MOCK: "true" },
    stdio: "inherit",
  });
  try {
    await aspettaServer();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    // tsx compila con `keepNames`: ogni funzione con nome dentro la closure di `page.evaluate`
    // diventa `__name(fn, "nome")`, e nella pagina `__name` non esiste. Stesso shim di
    // scripts/mobile-cdp-probe.ts:187-193 e scripts/intro-filmstrip.ts:111-114.
    await page.addInitScript(() => {
      (window as unknown as { __name?: unknown }).__name = (f: unknown) => f;
    });
    await page.goto(`${BASE}/contatti`, { waitUntil: "networkidle" });
    const out = await page.evaluate(async (sets) => {
      const result: Record<string, Record<string, number>> = {};
      for (const [key, s] of Object.entries(sets)) {
        const probe = document.createElement("span");
        probe.className = s.className;
        Object.assign(probe.style, {
          position: "absolute",
          left: "0",
          top: "0",
          display: "inline-block",
          fontSize: "100px",
          fontWeight: s.weight,
          lineHeight: "1",
          letterSpacing: "0",
          textTransform: "none",
          whiteSpace: "pre",
          margin: "0",
          padding: "0",
          visibility: "hidden",
        });
        document.body.appendChild(probe);
        const family = getComputedStyle(probe).fontFamily;
        await document.fonts.load(`${s.weight} 100px ${family}`, s.glyphs);
        await document.fonts.ready;
        const range = document.createRange();
        const w = (t: string) => {
          probe.textContent = t;
          range.selectNodeContents(probe);
          return range.getBoundingClientRect().width;
        };
        const glyphs = Array.from(s.glyphs);
        const single = new Map(glyphs.map((g) => [g, w(g)] as const));
        const pairs: Record<string, number> = {};
        for (const a of glyphs) {
          for (const b of glyphs) {
            const k = Math.round(((w(a + b) - single.get(a)! - single.get(b)!) / 100) * 1000) / 1000;
            if (Math.abs(k) >= 0.002) pairs[a + b] = k;
          }
        }
        result[key] = pairs;
        probe.remove();
      }
      return result;
    }, SETS);
    await browser.close();
    writeFileSync(OUT, `${JSON.stringify(out)}\n`);
    for (const [k, v] of Object.entries(out)) console.log(`${k}: ${Object.keys(v).length} coppie`);
    const byte = statSync(OUT).size;
    console.log(`kern-table.json: ${byte} byte (tetto D36: ${TETTO_BYTE})`);
    if (byte > TETTO_BYTE) {
      console.error(
        SENZA_ACCENTI
          ? "oltre 64 KB anche senza minuscole accentate in brand-800: fermarsi e chiedere ad Alberto (D36)"
          : "oltre 64 KB: rilanciare con --brand-senza-accenti (D36)",
      );
      process.exitCode = 2;
    }
  } finally {
    // Su Windows kill() lascerebbe vivo il processo che tiene la porta (lib.mjs del commit 2).
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]);
    else server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
