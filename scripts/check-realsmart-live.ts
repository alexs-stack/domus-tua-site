// Verifica dell'integrazione contro il feed RealSmart LIVE.
//
//   npm run check:realsmart
//
// NON gira in CI, di proposito: il feed è un sistema di terzi e se è giù la pipeline non deve
// diventare rossa per un problema che non è nostro. Serve prima di un rilascio, o quando si
// sospetta che il gestionale abbia cambiato qualcosa.
//
// Cosa controlla, sul feed vero:
//  • che il feed risponda e sia parsabile;
//  • che i campi che il sito mostra siano davvero valorizzati su una quota ragionevole di
//    annunci (una copertura crollata = il gestionale ha rinominato o svuotato un tag);
//  • che nessuna descrizione arrivi in pagina con del markup residuo;
//  • che tutte le immagini stiano su un host consentito;
//  • che i tre stati di disponibilità siano riconoscibili.
//
// Esce con codice 1 solo se qualcosa è ROTTO (feed irraggiungibile, campi chiave a zero,
// markup o URL non consentiti). Le coperture basse ma plausibili sono avvisi, non errori.

import { XMLParser } from "fast-xml-parser";
import { parseRealSmartPayload } from "../app/lib/realsmart/parse";
import { normalizeRealSmartListing } from "../app/lib/realsmart/normalize";
import { normalizedToProperty } from "../app/lib/realsmart/toProperty";

const FEED_URL =
  process.env.REALSMART_FEED_URL ?? "https://www.gestim2002.it/portali/immobili_724.xml";

const problems: string[] = [];
const warnings: string[] = [];

function pct(n: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((n / total) * 100)}%`;
}

async function main(): Promise<void> {
  console.log(`[realsmart] feed: ${FEED_URL}`);

  let xml: string;
  try {
    const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    xml = await res.text();
  } catch (err) {
    console.error(`[realsmart] feed NON raggiungibile: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
  const raw = parseRealSmartPayload(parser.parse(xml));
  if (raw.length === 0) {
    console.error("[realsmart] il feed non ha prodotto nessun annuncio: struttura cambiata?");
    process.exit(1);
  }

  const normalized = raw.map(normalizeRealSmartListing);
  const properties = normalized.map(normalizedToProperty);
  const total = properties.length;
  console.log(`[realsmart] annunci: ${total}\n`);

  // ── Copertura dei campi mostrati dal sito ────────────────────────────────────────────
  const coverage: { label: string; count: number; min: number }[] = [
    { label: "titolo", count: properties.filter((p) => p.title.length > 0).length, min: 1 },
    { label: "comune", count: properties.filter((p) => p.zone.length > 0).length, min: 1 },
    { label: "provincia", count: properties.filter((p) => /\(\w{2}\)$/.test(p.zone)).length, min: 0.8 },
    { label: "prezzo", count: properties.filter((p) => p.priceValue > 0).length, min: 0.8 },
    { label: "superficie", count: properties.filter((p) => p.sqm !== "—").length, min: 0.8 },
    { label: "descrizione", count: properties.filter((p) => p.description.length > 0).length, min: 0.9 },
    { label: "immagini", count: properties.filter((p) => p.gallery.length > 0).length, min: 0.9 },
    { label: "classe energetica", count: properties.filter((p) => !!p.energyClass).length, min: 0.5 },
    { label: "stato immobile", count: properties.filter((p) => !!p.condition).length, min: 0.5 },
    { label: "piano", count: properties.filter((p) => !!p.floor).length, min: 0.5 },
    {
      label: "dotazioni dichiarate",
      count: properties.filter((p) => Object.values(p.amenities ?? {}).some((v) => v !== undefined))
        .length,
      min: 0.8,
    },
  ];

  console.log("Copertura dei campi:");
  for (const { label, count, min } of coverage) {
    const ratio = total === 0 ? 0 : count / total;
    const ok = ratio >= min;
    console.log(`  ${ok ? "✔" : "✖"} ${label.padEnd(22)} ${String(count).padStart(4)}/${total}  ${pct(count, total)}`);
    if (!ok) {
      const msg = `copertura "${label}" al ${pct(count, total)} (attesa ≥ ${Math.round(min * 100)}%)`;
      // I campi anagrafici sono un errore; gli attributi facoltativi solo un avviso.
      if (["titolo", "comune", "prezzo", "descrizione", "immagini"].includes(label)) problems.push(msg);
      else warnings.push(msg);
    }
  }

  // ── Nessun markup residuo nel testo che arriva in pagina ─────────────────────────────
  const withMarkup = properties.filter((p) =>
    [...p.description, p.excerpt].some((t) => /<[a-z/][^>]*>/i.test(t)),
  );
  if (withMarkup.length > 0) {
    problems.push(`${withMarkup.length} descrizioni contengono ancora markup (es. ${withMarkup[0].slug})`);
  }

  // ── Immagini solo da host consentiti ─────────────────────────────────────────────────
  const badImages = properties.flatMap((p) =>
    p.gallery.filter((src) => !/^https:\/\/([a-z0-9-]+\.)?realsmart\.it\//.test(src) && !src.startsWith("/")),
  );
  if (badImages.length > 0) {
    problems.push(`${badImages.length} immagini su host non consentito (es. ${badImages[0]})`);
  }

  // ── Disponibilità: i tre stati devono restare distinguibili ──────────────────────────
  const counts = {
    available: properties.filter((p) => (p.availability ?? "available") === "available").length,
    reserved: properties.filter((p) => p.availability === "reserved").length,
    sold: properties.filter((p) => p.availability === "sold").length,
  };
  console.log(
    `\nDisponibilità: ${counts.available} disponibili · ${counts.reserved} in trattativa · ${counts.sold} venduti`,
  );
  if (counts.available === 0) problems.push("nessun immobile disponibile: il sito mostrerebbe una vetrina vuota");

  // ── Esito ────────────────────────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    console.log("\nAvvisi:");
    for (const w of warnings) console.log(`  • ${w}`);
  }
  if (problems.length > 0) {
    console.error("\nProblemi:");
    for (const p of problems) console.error(`  ✖ ${p}`);
    process.exit(1);
  }
  console.log("\n[realsmart] feed live coerente con il mapping del sito.");
}

void main();
