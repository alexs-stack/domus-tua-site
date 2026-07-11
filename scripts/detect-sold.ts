// Rilevamento "VENDUTO/AFFITTATO" dalle COPERTINE del feed RealSmart.
//
// PERCHÉ ESISTE: il feed XML non espone lo stato "venduto" (campo <stato> vuoto, i nomi file
// foto sono hash opachi). L'agenzia, quando vende, sovrappone alla copertina un badge grafico
// "VENDUTO al primo Open Domus!" — quindi l'UNICO segnale è nei pixel dell'immagine.
//
// COSA FA: scarica la copertina di ogni annuncio, isola il TESTO ROSSO nella banda inferiore
// (dove sta il badge), fa OCR su quella maschera pulita e marca l'annuncio come venduto se
// legge "VENDUTO"/"SOLD"/"AFFITTATO". Isolare il rosso prima dell'OCR è ciò che rende il
// riconoscimento affidabile anche su sfondi complessi/poco contrastati (prato, vialetto).
//
// DOVE FINISCE: scrive app/lib/realsmart/sold-detected.json, letto a runtime (costo zero) da
// soldOverrides.ts → toProperty.ts accende Property.sold. NON gira nel percorso di richiesta:
// va eseguito offline / in CI su schedule (vedi package.json "detect-sold").
//
// USO:
//   npx tsx scripts/detect-sold.ts            # incrementale (ri-OCR solo copertine cambiate)
//   npx tsx scripts/detect-sold.ts --force    # ri-OCR tutto
//   npx tsx scripts/detect-sold.ts --limit 20 # primi 20 (debug)
//   npx tsx scripts/detect-sold.ts --codici 1861,1966

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import sharp from "sharp";
import { createScheduler, createWorker, PSM } from "tesseract.js";
import { getRealSmartConfig } from "../app/lib/realsmart/env";
import { parseRealSmartPayload } from "../app/lib/realsmart/parse";

const OUT_PATH = join(process.cwd(), "app/lib/realsmart/sold-detected.json");
const WORKERS = 4;

type ListingState = "sold" | "reserved" | "available";
type Item = { sold: boolean; state: ListingState; cover: string; text?: string; error?: string };
type Store = {
  generatedAt: string;
  feed: string;
  counts: { total: number; sold: number; reserved: number };
  items: Record<string, Item>;
};

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const force = argv.includes("--force");
const limitArg = argv.find((a) => a.startsWith("--limit"));
const limit = limitArg ? Number(argv[argv.indexOf(limitArg) + 1] ?? limitArg.split("=")[1]) : 0;
const codiciArg = argv.find((a) => a.startsWith("--codici"));
const onlyCodici = codiciArg
  ? new Set((argv[argv.indexOf(codiciArg) + 1] ?? codiciArg.split("=")[1] ?? "").split(",").map((s) => s.trim()).filter(Boolean))
  : null;

// ── Rilevamento: maschera del rosso nella banda inferiore + OCR ───────────────
// L'agenzia usa più badge rossi sulla copertina, non solo "VENDUTO":
//   • VENDUTO / VENDUTA / AFFITTATO / PROPOSTA ACCETTATA / PRELIMINARE → affare chiuso o
//     vincolante = NON disponibile → lo trattiamo come "sold" (nascosto dalla ricerca di default).
//   • IN TRATTATIVA → ancora negoziabile → "reserved" (resta visibile, badge "Sotto proposta").
// Match su testo SENZA spazi ("flat") perché l'OCR spesso spezza le lettere del testo rosso
// su sfondo mosso (es. "VE N DUTO", "SP VE NDUTO B"): despaziare recupera molti veri positivi.
const SOLD_RE = /VENDUT|VENDU|ENDUTO|VENPUR|AFFITT|PRELIMIN|PROPOSTA|ACCETTATA/;
const RESERVED_RE = /TRATTATIVA/;

function classifyState(norm: string): ListingState {
  const flat = norm.replace(/\s+/g, "");
  if (SOLD_RE.test(flat)) return "sold";
  if (RESERVED_RE.test(flat)) return "reserved";
  return "available";
}

/** Estrae una maschera nero-su-bianco del solo testo ROSSO nella banda inferiore della copertina. */
async function redMaskBottomBand(buf: Buffer): Promise<Buffer> {
  const base = sharp(buf).rotate(); // auto-orient EXIF
  const meta = await base.metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!W || !H) throw new Error("dimensioni immagine sconosciute");
  const top = Math.round(H * 0.58);
  const bandH = H - top;
  const { data, info } = await sharp(buf)
    .rotate()
    .extract({ left: 0, top, width: W, height: bandH })
    .resize({ width: Math.min(1400, W * 2) }) // upscale → OCR più preciso
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height);
  for (let i = 0, p = 0; i < data.length; i += channels, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // "rosso brand": canale rosso dominante e nettamente sopra verde/blu.
    out[p] = r > 110 && r - g > 45 && r - b > 45 ? 0 : 255;
  }
  return sharp(out, { raw: { width, height, channels: 1 } }).png().toBuffer();
}

async function main() {
  const cfg = getRealSmartConfig();
  const feed = cfg.feedUrl!;
  console.log(`[detect-sold] feed: ${feed}`);

  // 1) Scarica e parse il feed → { codice, cover }.
  const res = await fetch(feed, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
  const raw = parseRealSmartPayload(parser.parse(xml));
  let listings = raw
    .map((r) => ({ codice: r.codice, cover: r.media?.[0]?.url }))
    .filter((l): l is { codice: string; cover: string } => !!l.cover);
  if (onlyCodici) listings = listings.filter((l) => onlyCodici.has(l.codice));
  if (limit > 0) listings = listings.slice(0, limit);
  console.log(`[detect-sold] copertine da valutare: ${listings.length}`);

  // 2) Carica il precedente per l'incrementale (salta le copertine invariate).
  const prev: Store | null = existsSync(OUT_PATH)
    ? (JSON.parse(readFileSync(OUT_PATH, "utf8")) as Store)
    : null;

  // 3) Scheduler OCR con pool di worker.
  const scheduler = createScheduler();
  for (let i = 0; i < WORKERS; i++) {
    const w = await createWorker("eng");
    await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    scheduler.addWorker(w);
  }

  const items: Record<string, Item> = {};
  let done = 0;
  let reused = 0;

  await Promise.all(
    listings.map(async ({ codice, cover }) => {
      const cached = prev?.items?.[codice];
      if (!force && cached && cached.cover === cover) {
        items[codice] = cached; // copertina invariata → riuso
        reused++;
        return;
      }
      try {
        const imgRes = await fetch(cover, { signal: AbortSignal.timeout(30000) });
        if (!imgRes.ok) throw new Error(`img ${imgRes.status}`);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const mask = await redMaskBottomBand(buf);
        const { data } = await scheduler.addJob("recognize", mask);
        const norm = data.text.toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim();
        const state = classifyState(norm);
        items[codice] = { sold: state === "sold", state, cover, text: norm.slice(0, 60) };
      } catch (err) {
        // In caso di errore NON marchiamo venduto (fail-safe: meglio "disponibile" che nascondere).
        items[codice] = { sold: false, state: "available", cover, error: err instanceof Error ? err.message : String(err) };
      } finally {
        done++;
        if (done % 20 === 0) console.log(`[detect-sold] ${done}/${listings.length}…`);
      }
    }),
  );

  await scheduler.terminate();

  // 4) Scrivi il JSON (ordinato per codice, per diff stabili).
  const soldCount = Object.values(items).filter((i) => i.state === "sold").length;
  const reservedCount = Object.values(items).filter((i) => i.state === "reserved").length;
  const sortedItems: Record<string, Item> = {};
  for (const k of Object.keys(items).sort()) sortedItems[k] = items[k];
  const store: Store = {
    generatedAt: new Date().toISOString(),
    feed,
    counts: { total: listings.length, sold: soldCount, reserved: reservedCount },
    items: sortedItems,
  };
  writeFileSync(OUT_PATH, JSON.stringify(store, null, 2) + "\n");

  const errors = Object.values(items).filter((i) => i.error).length;
  console.log(
    `[detect-sold] fatto: ${soldCount} venduti, ${reservedCount} in trattativa / ${listings.length} (riusati ${reused}, errori ${errors})`,
  );
  console.log(`[detect-sold] scritto ${OUT_PATH}`);
}

main().catch((err) => {
  console.error("[detect-sold] errore fatale:", err);
  process.exit(1);
});
