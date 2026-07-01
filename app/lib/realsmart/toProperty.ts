// Mappa NormalizedProperty (RealSmart) → Property (forma consumata dalla UI del sito).
// Serve per lo switch a dati live: la facciata app/lib/listings.ts userà questo mapper
// quando getLiveListings() sarà collegato al feed reale. Difensivo sui campi mancanti.

import type { NormalizedProperty } from "./types";
import type { Property } from "../properties";

function toType(t: string): Property["type"] {
  const s = t.toLowerCase();
  if (s.includes("attico")) return "Attico";
  if (s.includes("villa")) return "Villa";
  return "Appartamento";
}

export function normalizedToProperty(n: NormalizedProperty): Property {
  const cover = n.images[0]?.src ?? "/images/premium_01_living_tv_divano.jpg";
  return {
    slug: n.slug,
    title: n.title,
    zone: n.province ? `${n.town} (${n.province})` : n.town,
    type: toType(n.type),
    status: n.contract === "affitto" ? "Affitto" : "Vendita",
    price: n.priceLabel,
    priceValue: n.price,
    sqm: n.sqm ? `${n.sqm} m²` : "—",
    rooms: n.rooms ? `${n.rooms} locali` : "—",
    beds: n.rooms ? `${Math.max(1, n.rooms - 1)} camere` : "—",
    baths: n.baths ? `${n.baths} ${n.baths === 1 ? "bagno" : "bagni"}` : "—",
    badges: n.badges,
    cover,
    gallery: n.images.length ? n.images.map((i) => i.src) : [cover],
    excerpt: n.description ? n.description.slice(0, 160) : n.title,
    description: n.description ? [n.description] : [],
    features: n.features,
  };
}
