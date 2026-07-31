// Parsing del feed XML RealSmart (interscambio) → RealSmartListingRaw[].
//
// Sorgente reale: feed pubblico generato da RealSmart per il sito dell'agenzia
// (es. https://www.gestim2002.it/portali/immobili_724.xml), aggiornato più volte al giorno,
// contiene SOLO immobili attivi. Struttura: <Dati><immobili><immobile>…</immobile></immobili></Dati>.
//
// Questa funzione riceve l'oggetto già prodotto da fast-xml-parser (in client.ts) e lo
// trasforma nella forma grezza RealSmartListingRaw, in modo DIFENSIVO: mai throw su dati
// sporchi, entry non valide scartate.

import type { RealSmartDetails, RealSmartListingRaw, RealSmartMedia, RealSmartRoom } from "./types";

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
/** Numero opzionale: undefined se il campo è assente o non numerico (0 resta 0). */
function optNum(x: unknown): number | undefined {
  const s = str(x);
  if (s === undefined) return undefined;
  const d = s.replace(/[^\d]/g, "");
  return d ? Number.parseInt(d, 10) : undefined;
}

/** Tri-stato Si/No del feed: undefined quando il campo è vuoto (assenza ≠ "No"). */
function optSiNo(x: unknown): boolean | undefined {
  const s = str(x);
  if (s === undefined) return undefined;
  if (/^s[iì]$/i.test(s)) return true;
  if (/^no$/i.test(s)) return false;
  return undefined;
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

/**
 * Classe energetica dal campo <ACE>.
 *
 * ATTENZIONE: <ClasseImmobile> ("media", "signorile", "economica", "lusso") NON è la classe
 * energetica ed è un errore usarla come tale — l'etichetta energetica è regolamentata.
 * <ACE> contiene la classe reale (A4..G, più le vecchie A+/A++) oppure uno STATO testuale
 * ("In fase di rilascio", "Mancante", "Non richiesta"): solo il primo caso è una classe.
 */
function energyClassFrom(raw: unknown): string | undefined {
  const value = str(raw);
  if (!value) return undefined;
  return /^(?:A[1-4]?\+{0,2}|[B-G])$/i.test(value) ? value.toUpperCase() : undefined;
}

/** Stato dell'APE quando <ACE> non è una classe ("In fase di rilascio", "In corso di valutazione"). */
function energyStatusFrom(raw: unknown): string | undefined {
  const value = str(raw);
  if (!value || energyClassFrom(raw)) return undefined;
  // "Mancante"/"Non richiesta" non sono un'informazione da pubblicare: solo gli stati "in corso".
  return /in\s+(?:fase\s+di\s+rilascio|corso\s+di\s+valutazione)/i.test(value)
    ? value.toLowerCase()
    : undefined;
}

/** Ambienti censiti dal gestionale (presenza, mai conteggi — vedi RealSmartRoom). */
function mapRooms(node: unknown): RealSmartRoom[] | undefined {
  const raw = asArray<Record<string, unknown>>(isRecord(node) ? node.Ambiente : undefined).filter(isRecord);
  const rooms = raw
    .map((r) => ({ descrizione: str(r.Descrizione) ?? "", qta: toNum(r.Qta) || 1 }))
    .filter((r) => r.descrizione.length > 0);
  return rooms.length > 0 ? rooms : undefined;
}

/**
 * Combina un flag esplicito con un indizio: il flag vince sempre; se manca, l'indizio può
 * solo AGGIUNGERE una presenza, mai dichiarare un'assenza (assenza di dato ≠ "No").
 */
function presence(explicit: boolean | undefined, hint: boolean): boolean | undefined {
  if (explicit !== undefined) return explicit;
  return hint ? true : undefined;
}

/** Campi tecnici espliciti del feed (fonte #2 dei fatti strutturati). */
function mapDetails(im: Record<string, unknown>): RealSmartDetails {
  const tipoBox = `${str(im.Tipo_Box) ?? ""} ${str(im.Tipo_Box_2) ?? ""}`;
  return {
    riscaldamento: str(im.Riscaldamento),
    ariaCondizionata: optSiNo(im.AriaCondizionata),
    ascensore: optSiNo(im.Ascensore),
    terrazzo: optSiNo(im.Terrazzo),
    mqTerrazzo: optNum(im.mq_terrazzo),
    giardino: optSiNo(im.Giardino),
    tipoGiardino: str(im.Tipo_Giardino),
    mqGiardino: optNum(im.mq_giardino),
    // <Box> dice "c'è un'autorimessa"; <Tipo_Box>/<Tipo_Box_2> distinguono box e posto auto.
    // Il flag esplicito vince sempre sull'indizio: un "No" dichiarato resta "No".
    box: presence(optSiNo(im.Box), /\bbox\b/i.test(tipoBox)),
    postoAuto: presence(optSiNo(im.PostoAuto), /posto\s+auto/i.test(tipoBox)),
    ambienti: mapRooms(im.Ambienti),
  };
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
    // NB: <ClasseImmobile> è la CLASSE dell'immobile (media/signorile/economica/lusso) e NON
    // deve mai alimentare la classe energetica. Quella vera è <ACE>.
    classeEnergetica: energyClassFrom(im.ACE),
    statoAttestatoEnergetico: energyStatusFrom(im.ACE),
    dettagli: mapDetails(im),
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
