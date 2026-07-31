// Peso reale delle pagine: quanti byte passano dal filo, divisi per tipo.
//
// Lighthouse dà i punteggi; questo dà i numeri che li spiegano — HTML, JavaScript, immagini,
// e quanti nodi ha il DOM al primo render. Serve per rispondere a "cos'è che pesa", non solo
// a "quanto pesa".
//
//   npm run perf:report                     # contro http://127.0.0.1:3179
//   PERF_URL=https://… npm run perf:report
//   npm run perf:report -- --json before.json
//
// Il server dev NON va bene: misura i chunk di sviluppo. Serve una build di produzione.

import { chromium, type Browser } from "playwright";
import fs from "node:fs";

const BASE = process.env.PERF_URL ?? "http://127.0.0.1:3179";

const ROUTES = ["/", "/acquista", "/case", "/vendi", "/metodo", "/contatti"];

type Row = {
  route: string;
  html: number;
  js: number;
  css: number;
  images: number;
  fonts: number;
  media: number;
  total: number;
  requests: number;
  domNodes: number;
  /** Byte del payload di flight (i dati serializzati nell'HTML per l'idratazione). */
  flight: number;
};

const kb = (n: number) => `${(n / 1024).toFixed(1)} kB`;

async function measure(browser: Browser, route: string): Promise<Row> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    // Consenso già dato: misuriamo la pagina completa, non quella col gate chiuso.
    storageState: { cookies: [], origins: [] },
  });
  await context.addCookies([
    { name: "dt_consent", value: "accepted", url: BASE },
  ]);
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem("dt-intro-seen", "1"));

  const bytes: Record<string, number> = {};
  let requests = 0;
  page.on("response", async (res) => {
    requests += 1;
    const type = res.request().resourceType();
    try {
      const len = Number(res.headers()["content-length"] ?? 0);
      const size = len || (await res.body().then((b) => b.length).catch(() => 0));
      bytes[type] = (bytes[type] ?? 0) + size;
    } catch {
      /* risposta già scartata: la si salta */
    }
  });

  // `load`, non `networkidle`: dopo il caricamento Next preleva in anticipo le rotte dei link
  // in vista, e contarle direbbe quanto pesa la navigazione futura, non questa pagina.
  await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 60_000 });

  const domNodes = await page.evaluate(() => document.querySelectorAll("*").length);
  // Il payload di flight sta negli script inline `self.__next_f.push(...)`: è la parte di HTML
  // che serve solo all'idratazione. Se cresce, si sta serializzando roba che non serve.
  const flight = await page.evaluate(() =>
    [...document.querySelectorAll("script:not([src])")]
      .map((s) => s.textContent ?? "")
      .filter((t) => t.includes("__next_f"))
      .reduce((n, t) => n + t.length, 0),
  );

  await context.close();

  const html = bytes.document ?? 0;
  const js = bytes.script ?? 0;
  const css = bytes.stylesheet ?? 0;
  const images = bytes.image ?? 0;
  const fonts = bytes.font ?? 0;
  const media = bytes.media ?? 0;
  const total = Object.values(bytes).reduce((a, b) => a + b, 0);

  return { route, html, js, css, images, fonts, media, total, requests, domNodes, flight };
}

async function main() {
  const args = process.argv.slice(2);
  const jsonPath = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

  const browser = await chromium.launch();
  const rows: Row[] = [];
  for (const route of ROUTES) {
    rows.push(await measure(browser, route));
    process.stdout.write(".");
  }
  await browser.close();
  console.log("\n");

  const head = ["Route", "HTML", "flight", "JS", "CSS", "Immagini", "Totale", "Richieste", "Nodi DOM"];
  const table = [
    `| ${head.join(" | ")} |`,
    `|${head.map(() => "---").join("|")}|`,
    ...rows.map((r) =>
      `| \`${r.route}\` | ${kb(r.html)} | ${kb(r.flight)} | ${kb(r.js)} | ${kb(r.css)} | ${kb(r.images)} | ${kb(r.total)} | ${r.requests} | ${r.domNodes} |`,
    ),
  ].join("\n");
  console.log(table);

  if (jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
    console.log(`\nDati grezzi in ${jsonPath}`);
  }
}

void main();
