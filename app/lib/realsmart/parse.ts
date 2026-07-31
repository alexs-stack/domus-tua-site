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
/**
 * Flag a TRE stati: "Si" → true, "No" → false, tag assente/vuoto → undefined.
 *
 * È la differenza fra "l'agenzia dichiara che non c'è l'ascensore" e "il feed non lo dice".
 * Prima ogni valore diverso da "Si" diventava un'assenza di feature, quindi le due cose erano
 * indistinguibili e la scheda lasciava intendere un "no" mai dichiarato.
 */
function triState(x: unknown): boolean | undefined {
  const v = str(x);
  if (v === undefined) return undefined;
  if (/^s[iì]$/i.test(v)) return true;
  if (/^no$/i.test(v)) return false;
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

/**
 * Deriva le caratteristiche (features) dai flag DICHIARATI dall'immobile, allineate ai filtri
 * del sito. Solo i `Si`: una feature elencata significa "c'è". Le assenze non si elencano —
 * per quelle c'è lo stato a tre valori in `ascensore`/`giardino`/`terrazzo`/`postoAuto`.
 *
 * Nessuna feature viene MAI dedotta dalla descrizione: il testo dell'annuncio è prosa
 * commerciale, non un elenco di dotazioni.
 */
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
 * Host consentiti per le immagini. Il feed reale serve tutte le foto da cloud2.realsmart.it;
 * accettiamo il dominio realsmart.it e i suoi sottodomini, in HTTPS, e nient'altro.
 * Deve restare allineato a `images.remotePatterns` in next.config.ts: un URL fuori lista
 * romperebbe next/image a runtime, e accettare host arbitrari dal feed significherebbe far
 * decidere a un sistema esterno da dove il browser scarica risorse.
 */
function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return parsed.hostname === "realsmart.it" || parsed.hostname.endsWith(".realsmart.it");
  } catch {
    return false;
  }
}

/**
 * Provincia dal codice ISTAT del comune: il feed NON espone la provincia, ma espone `<Istat>`.
 * Il codice va portato a sei cifre (il feed omette lo zero iniziale): 12127 → 012127 → 012.
 *
 * Mappiamo solo i codici di cui siamo certi e che coprono il territorio dell'agenzia. Un
 * codice fuori tabella NON produce una sigla inventata: la provincia resta vuota. Nel feed
 * compare per esempio 003103 (Nebbiuno), codice storico della provincia di Novara per un
 * comune oggi nel Verbano-Cusio-Ossola: meglio nessuna provincia che una sbagliata.
 */
const ISTAT_PROVINCE: Record<string, string> = {
  "012": "VA", // Varese
  "013": "CO", // Como
  "015": "MI", // Milano
};

export function provinceFromIstat(istat: string | undefined): string {
  if (!istat) return "";
  const digits = istat.replace(/\D/g, "");
  if (digits.length === 0 || digits.length > 6) return "";
  return ISTAT_PROVINCE[digits.padStart(6, "0").slice(0, 3)] ?? "";
}

/**
 * Classe energetica: valida solo se è una classe vera (A4…G, con eventuale "+").
 * Il feed usa lo stesso tag `<ACE>` anche per lo STATO del certificato ("In fase di
 * rilascio", "Mancante", "Non richiesta"): quel valore non è una classe e non va mostrato
 * come tale, ma non va nemmeno buttato — dice perché la classe non c'è.
 */
export function readEnergy(ace: unknown): { classe?: string; stato?: string } {
  const v = str(ace);
  if (!v) return {};
  if (/^[A-G][1-4]?\+*$/i.test(v)) return { classe: v.toUpperCase() };
  return { stato: v };
}

/** Mappa un singolo <immobile> nella forma grezza RealSmartListingRaw. */
function mapImmobile(im: Record<string, unknown>): RealSmartListingRaw | null {
  const codice = str(im.Codice) ?? str(im.Riferimento);
  if (!codice) return null; // senza chiave, entry inutile → scartata

  const fotoUrls = asArray(isRecord(im.ElencoFoto) ? im.ElencoFoto.Foto : undefined)
    .map((u) => str(u))
    .filter((u): u is string => !!u && isAllowedImageUrl(u));
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
      // Il feed non ha un tag Provincia: si ricava dal codice ISTAT del comune.
      provincia: provinceFromIstat(str(im.Istat)),
      indirizzo: str(im.Indirizzo),
      cap: str(im.CAP),
      zona: str(im.Zona),
    },
    istat: str(im.Istat),
    mq: toNum(im.Mq),
    locali: toNum(im.Locali),
    bagni: toNum(im.Bagni),
    camere: toNum(im.Camere),
    piano: str(im.Piano),
    // La classe energetica sta in <ACE>, non in <ClasseImmobile> (che vale
    // media/signorile/economica/lusso: la classe COMMERCIALE dell'immobile). Leggendo il tag
    // sbagliato la classe energetica non compariva mai, su nessun immobile del feed.
    classeEnergetica: str(im.ACE),
    statoImmobile: str(im.StatoInterno),
    ascensore: triState(im.Ascensore),
    giardino: triState(im.Giardino),
    terrazzo: triState(im.Terrazzo),
    // Box e posto auto sono due tag distinti: `true` se almeno uno è dichiarato presente,
    // `false` solo se ENTRAMBI sono dichiarati assenti, altrimenti non lo sappiamo.
    postoAuto: (() => {
      const box = triState(im.Box);
      const posto = triState(im.PostoAuto);
      if (box === true || posto === true) return true;
      if (box === false && posto === false) return false;
      return undefined;
    })(),
    trattativaRiservata: triState(im.TrattativaRiservata),
    caratteristiche: deriveFeatures(im),
    // Il feed contiene SOLO immobili attivi. Chi è in trattativa riservata resta pubblicato ma
    // con lo stato "reserved": è ancora sul mercato, ma la scheda deve dirlo.
    statoPubblicazione: isSi(im.TrattativaRiservata) ? "reserved" : "published",
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
