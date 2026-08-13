// Funzioni geografiche PURE per l'arricchimento territoriale.
//
// Nessuna dipendenza esterna, nessuna rete: solo matematica deterministica. La distanza è
// SEMPRE in linea d'aria (Haversine): non è né a piedi né in auto, e non va mai etichettata così
// (constraint: "Never label straight-line distance as walking or driving distance").

/** Coordinata geografica. Lato server può descrivere l'origine di calcolo; mai esposta al client. */
export interface GeoCoord {
  lat: number;
  lng: number;
}

/** Raggio medio terrestre in metri (sfera). */
const EARTH_RADIUS_M = 6_371_000;

/** true se la latitudine è un numero finito nell'intervallo [-90, 90]. */
export function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

/** true se la longitudine è un numero finito nell'intervallo [-180, 180]. */
export function isValidLng(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

/** true se la coordinata è valida (latitudine e longitudine entrambe nel dominio). */
export function isValidCoord(coord: GeoCoord): boolean {
  return isValidLat(coord.lat) && isValidLng(coord.lng);
}

/**
 * Restituisce la coordinata se valida, altrimenti lancia. Usato ai confini (input provider,
 * lettura store) dove una coordinata impossibile deve fermare il flusso, non propagarsi.
 */
export function assertValidCoord(coord: GeoCoord): GeoCoord {
  if (!isValidCoord(coord)) {
    throw new Error(`Coordinata non valida: lat=${coord.lat}, lng=${coord.lng}`);
  }
  return coord;
}

/**
 * Arrotonda una coordinata a `dp` decimali (default 3 ≈ ~110 m di risoluzione).
 * Serve al fingerprint: micro-variazioni sotto la soglia non devono cambiare l'impronta né
 * innescare un ri-arricchimento. Normalizza anche il -0 a 0 per impronte stabili.
 */
export function roundCoord(coord: GeoCoord, dp = 3): GeoCoord {
  assertValidCoord(coord);
  const factor = 10 ** dp;
  const round = (v: number) => {
    const r = Math.round(v * factor) / factor;
    return Object.is(r, -0) ? 0 : r;
  };
  return { lat: round(coord.lat), lng: round(coord.lng) };
}

/**
 * Distanza in linea d'aria (Haversine) tra due coordinate, in METRI, arrotondata all'intero.
 * Simmetrica e pari a 0 per punti coincidenti. Lancia su coordinate non valide.
 */
export function haversineMeters(a: GeoCoord, b: GeoCoord): number {
  assertValidCoord(a);
  assertValidCoord(b);
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const d = 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(d);
}

/**
 * Chiave/slug normalizzato di un comune, stabile per storage e fingerprint.
 *
 * Il feed scrive "Venegono-Superiore" o "Gornate Olona (VA)"; la stessa località deve produrre
 * SEMPRE la stessa chiave. Regole: togli il suffisso provincia tra parentesi, minuscolo,
 * rimuovi accenti, riduci ogni sequenza non alfanumerica a un singolo trattino.
 * Ritorna "" per input vuoto/non stringa (il chiamante decide come trattare il vuoto).
 */
export function normalizeMunicipality(name: string): string {
  if (typeof name !== "string") return "";
  return name
    .trim()
    .replace(/\s*\([^)]*\)\s*$/, "") // "(VA)" e simili
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accenti
    .replace(/[^a-z0-9]+/g, "-") // qualsiasi separatore → trattino
    .replace(/^-+|-+$/g, ""); // niente trattini ai bordi
}
