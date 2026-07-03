// Parsing del feed XML RealSmart (interscambio) → RealSmartListingRaw[].
//
// Sorgente reale: feed pubblico generato da RealSmart per il sito dell'agenzia
// (es. https://www.gestim2002.it/portali/immobili_724.xml), aggiornato più volte al giorno,
// contiene SOLO immobili attivi. Struttura: <Dati><immobili><immobile>…</immobile></immobili></Dati>.
//
// Questa funzione riceve l'oggetto già prodotto da fast-xml-parser (in client.ts) e lo
// trasforma nella forma grezza RealSmartListingRaw, in modo DIFENSIVO: mai throw su dati
// sporchi, entry non valide scartate.

import type { RealSmartListingRaw, RealSmartMedia } from "./types";

// ── Helper difensivi ─────────────────────────────────────────────────────────
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function asArray<T = unknown>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x === undefined || x === null || x === "") return [];
  return [x as T];
}
/** Valore testuale ripulito; undefined se vuoto. CDATA e numeri gestiti da fast-xml-parser. */
function str(x: unknown): string | undefined {
  if (x === undefined || x === null) return undefined;
  const s = String(x).trim();
  return s.length > 0 ? s : undefined;
}
function isSi(x: unknown): boolean {
  return typeof x === "string" ? /^s[iì]$/i.test(x.trim()) : false;
}
function toNum(x: unknown): number {
  if (typeof x === "number") return Number.isFinite(x) ? x : 0;
  if (typeof x === "string") {
    const d = x.replace(/[^\d]/g, "");
    return d ? Number.parseInt(d, 10) : 0;
  }
  return 0;
}

/** Converte una data RealSmart "dd/mm/yyyy[ hh:mm:ss]" in ISO 8601 (stringa vuota se non valida). */
function itDateToIso(input: string | undefined): string {
  if (!input) return "";
  const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return "";
  const [, dd, mm, yyyy, hh = "00", mi = "00", ss = "00"] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
}

/** Deriva le caratteristiche (features) dai flag dell'immobile, allineate ai filtri del sito. */
function deriveFeatures(im: Record<string, unknown>): string[] {
  const f: string[] = [];
  if (isSi(im.Giardino)) f.push("Giardino");
  if (isSi(im.Box) || isSi(im.PostoAuto)) f.push("Box / posto auto");
  if (isSi(im.Terrazzo)) f.push("Terrazzo");
  if (isSi(im.Ascensore)) f.push("Ascensore");
  if (isSi(im.AriaCondizionata)) f.push("Aria condizionata");
  if (toNum(im.Bagni) >= 2) f.push("Doppi servizi");
  return f;
}

/** Mappa un singolo <immobile> nella forma grezza RealSmartListingRaw. */
function mapImmobile(im: Record<string, unknown>): RealSmartListingRaw | null {
  const codice = str(im.Codice) ?? str(im.Riferimento);
  if (!codice) return null; // senza chiave, entry inutile → scartata

  const fotoUrls = asArray(isRecord(im.ElencoFoto) ? im.ElencoFoto.Foto : undefined)
    .map((u) => str(u))
    .filter((u): u is string => !!u && /^https?:\/\//i.test(u));
  const media: RealSmartMedia[] = fotoUrls.map((url, i) => ({ url, tipo: "foto", ordine: i }));

  return {
    codice,
    riferimento: str(im.Riferimento),
    titolo: str(im.Titolo) ?? str(im.Tipologia) ?? "Immobile",
    descrizione: str(im.AnnuncioCompleto),
    prezzo: (im.Costo as number | string) ?? (im.ValoreCosto as number | string),
    tipologia: str(im.Tipologia),
    contratto: str(im.Contratto)?.toLowerCase(),
    localita: {
      comune: str(im.Comune) ?? "",
      provincia: "",
      indirizzo: str(im.Indirizzo),
      cap: str(im.CAP),
      zona: str(im.Zona),
    },
    mq: toNum(im.Mq),
    locali: toNum(im.Locali),
    bagni: toNum(im.Bagni),
    camere: toNum(im.Camere),
    piano: str(im.Piano),
    classeEnergetica: str(im.ClasseImmobile),
    caratteristiche: deriveFeatures(im),
    // Il feed contiene SOLO immobili attivi → published (evita il default "draft" = nascosto).
    statoPubblicazione: "published",
    inEvidenza: isSi(im.Evidenza),
    media,
    dataPubblicazione: itDateToIso(str(im.DataInserimento)),
    dataAggiornamento: itDateToIso(str(im.UltimaModifica)),
  };
}

/**
 * Trasforma l'oggetto prodotto da fast-xml-parser (feed RealSmart) in RealSmartListingRaw[].
 * Accetta l'inviluppo <Dati><immobili><immobile>. Difensiva: ritorna [] su payload inatteso.
 */
export function parseRealSmartPayload(payload: unknown): RealSmartListingRaw[] {
  if (!isRecord(payload)) return [];
  const dati = isRecord(payload.Dati) ? payload.Dati : payload;
  const immobiliNode = isRecord(dati.immobili) ? dati.immobili.immobile : undefined;
  const immobili = asArray<Record<string, unknown>>(immobiliNode).filter(isRecord);
  return immobili
    .map(mapImmobile)
    .filter((x): x is RealSmartListingRaw => x !== null);
}
