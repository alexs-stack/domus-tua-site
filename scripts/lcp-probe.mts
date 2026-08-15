// SONDA LCP — quale elemento Chrome promuove a Largest Contentful Paint, e quando.
//
// Lighthouse dice CHI ha vinto. Non dice chi ha partecipato, e su questo sito è quella la
// domanda: la home ha una fotografia a tutto schermo che sembra ovviamente l'LCP e non lo è
// mai. Senza questa sonda si ottimizza per settimane l'elemento sbagliato.
//
//   npx tsx scripts/lcp-probe.mts                                   # home, prima visita
//   npx tsx scripts/lcp-probe.mts "http://127.0.0.1:3179/acquista"  # un'altra pagina
//   CONSENT=1 npx tsx scripts/lcp-probe.mts                         # con il consenso già dato
//
// Serve un server in ascolto (`npx next start --port 3179` su una build di produzione: in dev i
// numeri non vogliono dire niente). CONSENT=1 mette il cookie di consenso, così il banner non si
// monta: è il modo per vedere chi sarebbe l'LCP senza di lui.
//
// COSA HA GIÀ TROVATO (2026-08-15, home, viewport 390×844):
//   • L'elemento LCP della home è sempre un piccolo elemento di TESTO: il paragrafo del banner
//     cookie (~19.700 px²) quando l'intro non parte, uno span del titolo hero quando parte.
//     In entrambi i casi ~4,85 s su Slow-4G (Lighthouse, mediana di 3, macchina scarica).
//   • Con il consenso già dato vince uno SPAN del titolo hero a `opacity: 0.02` (~14.238 px²).
//     Quindi l'`opacity: 0.02` di globals.css funziona davvero: Chrome quei box li conta. Il
//     limite è un altro — il titolo è spezzato in un box per carattere (SplitText) e l'LCP misura
//     il box, non la frase.
//   • La foto dell'hero NON entra mai fra i candidati, pur essendo 390×898 al top (329.160 px²
//     dentro il viewport), `opacity: 1`, `visibility: visible`, completa a 45 ms. Non è un
//     problema di caricamento né di trasparenza: Chrome semplicemente non la promuove.
// Conseguenza: sulla home l'LCP si sposta cambiando il testo e il momento in cui compare il
// banner, NON ottimizzando le immagini.
import { chromium } from "@playwright/test";

const URL_ = process.argv[2] ?? "http://127.0.0.1:3179/#senza-intro";
/** Quanto si osserva dopo il load: l'LCP può ancora cambiare finché non c'è un input utente. */
const ATTESA_MS = 9_000;

interface Candidato {
  ms: number;
  size: number;
  tag: string;
  cls: string;
  opacity?: string;
  testo: string;
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  if (process.env.CONSENT === "1") {
    await context.addCookies([
      { name: "dt_consent", value: "accepted", domain: "127.0.0.1", path: "/" },
    ]);
  }
  const page = await context.newPage();

  // L'osservatore va installato PRIMA del documento: `buffered: true` recupera comunque i
  // candidati già emessi, ma solo se l'observer nasce nella stessa pagina.
  await page.addInitScript(() => {
    (window as unknown as { __lcp: Candidato[] }).__lcp = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const el = (e as unknown as { element?: Element }).element;
        (window as unknown as { __lcp: Candidato[] }).__lcp.push({
          ms: Math.round(e.startTime),
          size: (e as unknown as { size: number }).size,
          tag: el?.tagName ?? "?",
          cls: String(el?.className ?? "").slice(0, 50),
          opacity: el ? getComputedStyle(el).opacity : undefined,
          testo: (el?.textContent ?? "").trim().slice(0, 40),
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForTimeout(ATTESA_MS);

  // Le immagini con l'area EFFETTIVAMENTE dentro il viewport: è quella che conterebbe. Serve a
  // distinguere «non è candidata perché non si vede» da «non è candidata e basta».
  const immagini = await page.evaluate(() => {
    const vh = innerHeight;
    const vw = innerWidth;
    return [...document.querySelectorAll("img")].slice(0, 6).map((img) => {
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const area =
        Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) *
        Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
      return {
        src: (img.currentSrc || img.src).split("/").pop()?.slice(0, 34) ?? "",
        rect: `${Math.round(r.width)}×${Math.round(r.height)} @top ${Math.round(r.top)}`,
        areaInViewport: Math.round(area),
        completa: img.complete,
        opacity: cs.opacity,
        visibility: cs.visibility,
      };
    });
  });
  const candidati = await page.evaluate(
    () => (window as unknown as { __lcp: Candidato[] }).__lcp,
  );
  await browser.close();

  console.log(`\n${URL_}${process.env.CONSENT === "1" ? "  (consenso già dato)" : ""}`);
  console.log("\ncandidati LCP, nell'ordine in cui Chrome li ha promossi:");
  if (candidati.length === 0) console.log("  nessuno (la pagina non ha prodotto candidati)");
  for (const c of candidati) {
    console.log(
      `  ${String(c.ms).padStart(6)} ms  area ${String(c.size).padStart(7)}  opacity ${c.opacity}  <${c.tag}> ${c.cls}`,
    );
    console.log(`           «${c.testo}»`);
  }
  console.log("\nimmagini, a fine osservazione:");
  // La nota si accende solo se l'immagine è PIÙ GRANDE del candidato che ha vinto: è quello il
  // caso che sorprende («la cosa più grande in pagina non è l'LCP»). Un logo da 3.306 px² che
  // perde contro un paragrafo da 19.719 non è una notizia, e segnalarlo renderebbe rumorosa
  // proprio la riga che deve saltare all'occhio.
  const vincitore = Math.max(0, ...candidati.map((c) => c.size));
  for (const i of immagini) {
    const nota =
      i.areaInViewport > vincitore && !candidati.some((c) => c.tag === "IMG")
        ? "  ← PIÙ GRANDE del vincitore, e mai candidata"
        : "";
    console.log(
      `  ${i.src.padEnd(36)} ${i.rect.padEnd(24)} area ${String(i.areaInViewport).padStart(7)}  completa=${i.completa} opacity=${i.opacity}${nota}`,
    );
  }
  console.log("");
}

await main();
