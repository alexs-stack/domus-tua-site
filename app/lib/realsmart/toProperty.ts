// Mappa NormalizedProperty (RealSmart) → Property (forma consumata dalla UI del sito).
// La facciata app/lib/listings.ts usa questo mapper quando il feed live è attivo.
// Difensivo sui campi mancanti.

import type { NormalizedProperty } from "./types";
import type { Property } from "../properties";
import { isListingSold } from "./soldOverrides";

/** Bucket di tipologia usati dai filtri del sito. */
function toType(raw: string): Property["type"] {
  const s = raw.toLowerCase();
  if (s.includes("attico")) return "Attico";
  if (s.includes("negozio") || s.includes("ufficio") || s.includes("capannone") || s.includes("commerciale") || s.includes("laboratorio")) return "Commerciale";
  if (s.includes("terreno")) return "Terreno";
  if (s.includes("villa") || s.includes("casa") || s.includes("terratetto") || s.includes("terra-tetto") || s.includes("rustico") || s.includes("schiera") || s.includes("bifam") || s.includes("trifam")) return "Villa";
  return "Appartamento";
}

export function normalizedToProperty(n: NormalizedProperty): Property {
  const cover = n.images[0]?.src ?? "/images/premium_01_living_tv_divano.jpg";
  // Descrizione già normalizzata a monte (./description.ts): qui non si ri-elabora nulla.
  // Venduto/affittato. Il feed RealSmart forza "published" e NON espone lo stato, ma l'agenzia
  // lascia i venduti come vetrina marcandoli con un badge "VENDUTO" bruciato sulla copertina.
  // Fonti, in ordine: status/badge del gestionale, titolo, e infine il rilevamento OCR della
  // copertina (isListingSold, alimentato da scripts/detect-sold.ts — è quello che scatta per i
  // venduti reali, dato che il badge vive solo nei pixel dell'immagine).
  const sold =
    n.status === "sold" ||
    n.badges.includes("Venduto") ||
    n.badges.includes("Affittato") ||
    /\bvendut[oaie]\b/i.test(n.title) ||
    isListingSold(n.sourceRef.codice, cover);
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
    sqm: n.sqm ? `${n.sqm} m²` : "—",
    rooms: n.rooms ? `${n.rooms} ${n.rooms === 1 ? "locale" : "locali"}` : "—",
    beds: n.bedrooms ? `${n.bedrooms} ${n.bedrooms === 1 ? "camera" : "camere"}` : "—",
    baths: n.baths ? `${n.baths} ${n.baths === 1 ? "bagno" : "bagni"}` : "—",
    badges,
    cover,
    gallery: n.images.length ? n.images.map((i) => i.src) : [cover],
    excerpt: n.excerpt || n.title,
    description: n.descriptionParagraphs,
    features: n.features,
    energyClass: n.energyClass,
    sold,
    ref: n.sourceRef.riferimento,
  };
}
