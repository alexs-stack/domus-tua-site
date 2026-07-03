// Mappa NormalizedProperty (RealSmart) → Property (forma consumata dalla UI del sito).
// La facciata app/lib/listings.ts usa questo mapper quando il feed live è attivo.
// Difensivo sui campi mancanti.

import type { NormalizedProperty } from "./types";
import type { Property } from "../properties";

/** Bucket di tipologia usati dai filtri del sito. */
function toType(raw: string): Property["type"] {
  const s = raw.toLowerCase();
  if (s.includes("attico")) return "Attico";
  if (s.includes("negozio") || s.includes("ufficio") || s.includes("capannone") || s.includes("commerciale") || s.includes("laboratorio")) return "Commerciale";
  if (s.includes("terreno")) return "Terreno";
  if (s.includes("villa") || s.includes("casa") || s.includes("terratetto") || s.includes("terra-tetto") || s.includes("rustico") || s.includes("schiera") || s.includes("bifam") || s.includes("trifam")) return "Villa";
  return "Appartamento";
}

/** Aggiunge uno spazio dopo un punto incollato alla parola successiva ("fine.Inizio" → "fine. Inizio"). */
function tidy(text: string): string {
  return text.replace(/([.!?;:])([A-ZÀ-ÖØ-Þ])/g, "$1 $2").replace(/\s{2,}/g, " ").trim();
}

/** Spezza una descrizione lunga in paragrafi leggibili (~3 frasi ciascuno). */
function toParagraphs(text: string): string[] {
  const clean = tidy(text);
  if (!clean) return [];
  // Se ci sono già a capo, rispettali.
  const byNewline = clean.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  // Altrimenti raggruppa le frasi a gruppi di 3.
  const sentences = clean.match(/[^.!?]+[.!?]+/g) ?? [clean];
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    paras.push(sentences.slice(i, i + 3).join(" ").trim());
  }
  return paras.filter(Boolean);
}

function excerptFrom(text: string): string {
  const clean = tidy(text);
  if (clean.length <= 170) return clean;
  const cut = clean.slice(0, 170);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 120 ? lastSpace : 170)}…`;
}

export function normalizedToProperty(n: NormalizedProperty): Property {
  const cover = n.images[0]?.src ?? "/images/premium_01_living_tv_divano.jpg";
  const beds = n.bedrooms > 0 ? n.bedrooms : Math.max(0, n.rooms - 1);
  const paragraphs = toParagraphs(n.description);
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
    beds: beds ? `${beds} ${beds === 1 ? "camera" : "camere"}` : "—",
    baths: n.baths ? `${n.baths} ${n.baths === 1 ? "bagno" : "bagni"}` : "—",
    badges: n.badges,
    cover,
    gallery: n.images.length ? n.images.map((i) => i.src) : [cover],
    excerpt: paragraphs[0] ? excerptFrom(paragraphs[0]) : n.title,
    description: paragraphs,
    features: n.features,
  };
}
