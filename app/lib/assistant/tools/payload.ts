// Conversione immobile → payload per il modello e card per la UI.
//
// Principio: un campo che il gestionale non fornisce vale `null`, MAI 0 o "—".
// La differenza è sostanziale: `null` significa "informazione non disponibile" e il prompt
// impone di dirlo così; uno 0 verrebbe letto come "non ce l'ha" e diventerebbe una risposta
// negativa falsa.

import type { NormalizedProperty } from "../../realsmart/types";
import type { Property } from "../../properties";
import type { ListingCard } from "../types";

/** Immobile come lo vede il modello. Solo dati provenienti dal feed. */
export interface ListingPayload {
  slug: string;
  /** Riferimento commerciale dell'agenzia, se fornito. */
  ref: string | null;
  title: string;
  comune: string;
  provincia: string | null;
  /** "Vendita" o "Affitto". */
  contratto: string;
  tipologia: string;
  prezzo: string;
  prezzoEuro: number | null;
  mq: number | null;
  locali: number | null;
  camere: number | null;
  bagni: number | null;
  piano: string | null;
  classeEnergetica: string | null;
  caratteristiche: string[];
  /** Percorso della scheda sul sito. */
  url: string;
  /** Sempre true: gli immobili non disponibili non escono da questa funzione. */
  disponibile: true;
}

function orNull(value: number): number | null {
  return value > 0 ? value : null;
}

function textOrNull(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function toListingPayload(property: Property, normalized: NormalizedProperty): ListingPayload {
  return {
    slug: property.slug,
    ref: textOrNull(normalized.sourceRef.riferimento),
    title: property.title,
    comune: normalized.town,
    provincia: textOrNull(normalized.province),
    contratto: property.status,
    tipologia: property.type,
    prezzo: property.price,
    prezzoEuro: orNull(normalized.price),
    mq: orNull(normalized.sqm),
    locali: orNull(normalized.rooms),
    camere: orNull(normalized.bedrooms),
    bagni: orNull(normalized.baths),
    piano: textOrNull(normalized.floor),
    classeEnergetica: textOrNull(normalized.energyClass),
    caratteristiche: normalized.features,
    url: `/case/${property.slug}`,
    disponibile: true,
  };
}

export function toListingCard(property: Property): ListingCard {
  return {
    slug: property.slug,
    title: property.title,
    zone: property.zone,
    price: property.price,
    type: property.type,
    url: `/case/${property.slug}`,
    cover: property.cover,
  };
}
