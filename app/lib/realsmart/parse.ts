// Parsing difensivo: da payload GREZZO e non fidato (unknown) a RealSmartListingRaw[].
//
// Confine di fiducia: tutto ciò che entra qui arriva da una sorgente esterna (feed/API/file)
// e NON è verificato. Questo modulo è l'unico punto in cui `unknown` diventa `RealSmartListingRaw`.
//
// Regole:
//  - NON lancia MAI su input malformato: filtra/salta le voci non valide e prosegue.
//  - Una voce senza i campi minimi obbligatori (`codice`, `titolo`) viene scartata.
//  - I campi opzionali restano permissivi (number|string) come nel tipo raw: la pulizia
//    numerica/formattazione avviene a valle in normalize.ts.
//
// ⚠️ STATO ATTUALE: supporta SOLO la forma del payload mock/sample
// (vedi app/lib/realsmart/__fixtures__/sample-feed.json e app/lib/realsmart/mocks.ts),
// cioè un oggetto { listings: [...] } oppure direttamente un array di annunci.
//
// TODO(realsmart): quando riceveremo lo schema reale (XML/JSON) da RealSmart/cliente
// (vedi docs/realsmart-client-questions.md), estendere/riscrivere questo parser:
//  - se XML: aggiungere uno step di deserializzazione XML → oggetto PRIMA di queste guardie;
//  - mappare i nomi dei campi reali del feed sui nomi di RealSmartListingRaw;
//  - gestire eventuali involucri (envelope) e paginazione.
// I nomi dei campi qui usati sono quelli dei nostri mock e NON sono ancora confermati.

import type {
  ListingStatus,
  RealSmartListingRaw,
  RealSmartLocation,
  RealSmartMedia,
} from "./types";

// ─────────────────────────────────────────────────────────────
// Helper di validazione difensiva — piccoli, puri, riusabili.
// ─────────────────────────────────────────────────────────────

/** True se il valore è un oggetto non-null e non-array (una "mappa" di proprietà). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Ritorna la stringa (trimmata) se non vuota, altrimenti undefined. */
export function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/**
 * Ritorna un valore numerico "grezzo" preservando la permissività del tipo raw:
 *  - number finito → number
 *  - string non vuota → string (la conversione a number avviene in normalize.ts)
 *  - tutto il resto → undefined
 * NB: non converte le stringhe in numeri di proposito, per non perdere formati come "420.000".
 */
export function asNumber(value: unknown): number | string | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/** Ritorna l'array se il valore è un array, altrimenti un array vuoto (mai undefined/throw). */
export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Come asArray ma preserva `undefined` (utile per campi opzionali che vogliamo omettere). */
function asOptionalArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

// ─────────────────────────────────────────────────────────────
// Parser dei sotto-oggetti.
// ─────────────────────────────────────────────────────────────

/** Localizzazione: richiede almeno `comune` e `provincia` (stringhe). */
function parseLocation(value: unknown): RealSmartLocation | undefined {
  if (!isRecord(value)) return undefined;
  const comune = asString(value.comune);
  const provincia = asString(value.provincia);
  if (!comune || !provincia) return undefined;
  return {
    comune,
    provincia,
    indirizzo: asString(value.indirizzo),
    cap: asString(value.cap),
    zona: asString(value.zona),
  };
}

/** Un media valido richiede almeno `url` (stringa). Le voci senza url sono scartate. */
function parseMedia(value: unknown): RealSmartMedia | undefined {
  if (!isRecord(value)) return undefined;
  const url = asString(value.url);
  if (!url) return undefined;
  const ordine = value.ordine;
  return {
    url,
    tipo: asString(value.tipo),
    ordine: typeof ordine === "number" && Number.isFinite(ordine) ? ordine : undefined,
    didascalia: asString(value.didascalia),
  };
}

/** Array di media: scarta le voci invalide; undefined se il campo non è un array. */
function parseMediaArray(value: unknown): RealSmartMedia[] | undefined {
  const arr = asOptionalArray(value);
  if (arr === undefined) return undefined;
  const media = arr
    .map(parseMedia)
    .filter((m): m is RealSmartMedia => m !== undefined);
  return media;
}

/** Array di caratteristiche: tiene solo le stringhe non vuote. */
function parseFeatures(value: unknown): string[] | undefined {
  const arr = asOptionalArray(value);
  if (arr === undefined) return undefined;
  const features = arr
    .map(asString)
    .filter((f): f is string => f !== undefined);
  return features;
}

/**
 * Parsing di un singolo annuncio grezzo.
 * Ritorna undefined (→ voce scartata) se mancano i campi minimi obbligatori.
 * NON valida l'enum di stato qui: `statoPubblicazione` resta grezzo e viene
 * normalizzato/difeso in normalize.ts (uno stato ignoto lì diventa "draft", quindi nascosto).
 */
function parseListing(value: unknown): RealSmartListingRaw | undefined {
  if (!isRecord(value)) return undefined;

  // Campi minimi obbligatori: senza questi l'annuncio non è utilizzabile.
  const codice = asString(value.codice);
  const titolo = asString(value.titolo);
  if (!codice || !titolo) return undefined;

  const contratto = asString(value.contratto);
  const statoPubblicazione = asString(value.statoPubblicazione) as
    | ListingStatus
    | string
    | undefined;

  return {
    codice,
    riferimento: asString(value.riferimento),
    titolo,
    descrizione: asString(value.descrizione),
    prezzo: asNumber(value.prezzo),
    tipologia: asString(value.tipologia),
    contratto,
    localita: parseLocation(value.localita),
    mq: asNumber(value.mq),
    locali: asNumber(value.locali),
    bagni: asNumber(value.bagni),
    camere: asNumber(value.camere),
    piano: asNumber(value.piano),
    classeEnergetica: asString(value.classeEnergetica),
    caratteristiche: parseFeatures(value.caratteristiche),
    statoPubblicazione,
    media: parseMediaArray(value.media),
    dataPubblicazione: asString(value.dataPubblicazione),
    dataAggiornamento: asString(value.dataAggiornamento),
  };
}

/**
 * Estrae l'array di annunci grezzi da un payload sconosciuto.
 *
 * Forme supportate (mock/sample):
 *  - un array diretto: `[ {...}, {...} ]`
 *  - un envelope: `{ "listings": [ {...} ] }`
 *
 * Qualsiasi altra forma → array vuoto (nessun throw).
 * TODO(realsmart): adattare quando conosceremo l'envelope reale del feed.
 */
function extractRawArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.listings)) {
    return payload.listings;
  }
  return [];
}

/**
 * Parsa un payload grezzo (unknown) in RealSmartListingRaw[].
 *
 * Contratto: MAI lancia. Su input malformato ritorna il sottoinsieme valido
 * (potenzialmente un array vuoto). Le voci invalide vengono semplicemente saltate.
 */
export function parseRealSmartPayload(payload: unknown): RealSmartListingRaw[] {
  return extractRawArray(payload)
    .map(parseListing)
    .filter((l): l is RealSmartListingRaw => l !== undefined);
}
