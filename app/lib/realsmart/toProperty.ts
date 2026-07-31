// Mappa NormalizedProperty (RealSmart) → Property (forma consumata dalla UI del sito).
// La facciata app/lib/listings.ts usa questo mapper quando il feed live è attivo.
// Difensivo sui campi mancanti.

import type { NormalizedProperty } from "./types";
import type { Property } from "../properties";
import { isListingSold } from "./soldOverrides";
import { toParagraphs, excerptFrom } from "./description";

/** Bucket di tipologia usati dai filtri del sito. */
function toType(raw: string): Property["type"] {
  const s = raw.toLowerCase();
  if (s.includes("attico")) return "Attico";
  if (s.includes("negozio") || s.includes("ufficio") || s.includes("capannone") || s.includes("commerciale") || s.includes("laboratorio")) return "Commerciale";
  if (s.includes("terreno")) return "Terreno";
  if (s.includes("villa") || s.includes("casa") || s.includes("terratetto") || s.includes("terra-tetto") || s.includes("rustico") || s.includes("schiera") || s.includes("bifam") || s.includes("trifam")) return "Villa";
  return "Appartamento";
}

/**
 * Piano leggibile. "T"/"t" = piano terra è l'unica abbreviazione che traduciamo, perché è
 * l'unica documentata senza ambiguità nel feed. Tutto il resto passa come arriva: meglio un
 * "s1" grezzo che un "Seminterrato" indovinato.
 */
function toFloorLabel(raw: string | undefined): string | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  if (/^t$/i.test(v)) return "Piano terra";
  if (/^\d+$/.test(v)) return `Piano ${v}`;
  return v;
}

export function normalizedToProperty(n: NormalizedProperty): Property {
  const cover = n.images[0]?.src ?? "/images/premium_01_living_tv_divano.jpg";
  const beds = n.bedrooms > 0 ? n.bedrooms : Math.max(0, n.rooms - 1);
  const paragraphs = toParagraphs(n.description);

  // ── Disponibilità: tre stati, mai collassati in un booleano ──────────────────────────
  // Venduto/affittato: il feed pubblica solo immobili attivi e NON espone lo stato di
  // vendita, ma l'agenzia lascia i venduti in vetrina marcandoli con un badge "VENDUTO"
  // bruciato sulla copertina. Fonti, in ordine: stato/badge del gestionale, titolo, e infine
  // il rilevamento OCR della copertina (isListingSold, alimentato da scripts/detect-sold.ts —
  // è quello che scatta per i venduti reali, dato che il badge vive solo nei pixel).
  const sold =
    n.status === "sold" ||
    n.badges.includes("Venduto") ||
    n.badges.includes("Affittato") ||
    /\bvendut[oaie]\b/i.test(n.title) ||
    isListingSold(n.sourceRef.codice, cover);
  // In trattativa (TrattativaRiservata="Si" nel feed): resta sul mercato, ma la scheda lo dice.
  const reserved = !sold && n.status === "reserved";
  const availability: Property["availability"] = sold ? "sold" : reserved ? "reserved" : "available";

  const soldBadge = n.contract === "affitto" ? "Affittato" : "Venduto";
  const badges = sold && !n.badges.includes(soldBadge) ? [soldBadge, ...n.badges] : n.badges;

  return {
    slug: n.slug,
    title: n.title,
    zone: n.province ? `${n.town} (${n.province})` : n.town,
    type: toType(n.type),
    status: n.contract === "affitto" ? "Affitto" : "Vendita",
    price: n.priceLabel,
    priceValue: n.price,
    // "—" quando il gestionale non dichiara il dato: la scheda non inventa uno zero.
    sqm: n.sqm ? `${n.sqm} m²` : "—",
    rooms: n.rooms ? `${n.rooms} ${n.rooms === 1 ? "locale" : "locali"}` : "—",
    beds: beds ? `${beds} ${beds === 1 ? "camera" : "camere"}` : "—",
    baths: n.baths ? `${n.baths} ${n.baths === 1 ? "bagno" : "bagni"}` : "—",
    badges,
    cover,
    gallery: n.images.length ? n.images.map((i) => i.src) : [cover],
    excerpt: excerptFrom(n.description) || n.title,
    description: paragraphs,
    features: n.features,
    floor: toFloorLabel(n.floor),
    energyClass: n.energyClass,
    energyClassStatus: n.energyClassStatus,
    condition: n.condition,
    availability,
    amenities: n.amenities,
    ref: n.sourceRef.riferimento,
  };
}
