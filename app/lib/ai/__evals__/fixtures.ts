// Immobili di prova per gli eval dell'assistente.
//
// Non sono i dati demo del sito e non sono il feed live: sono un insieme piccolo e scelto,
// con dentro tutto ciò che deve essere verificato — un venduto, un riservato, un immobile
// senza classe energetica, uno senza dotazioni dichiarate. Così un eval che passa dice
// qualcosa di preciso, e non cambia significato quando cambia il feed dell'agenzia.

import type { Property } from "../../properties";
import { comuniFacet } from "../../comune";
import type { ToolContext } from "../tools";

function base(over: Partial<Property> & { slug: string; title: string }): Property {
  return {
    zone: "Tradate",
    type: "Appartamento",
    status: "Vendita",
    price: "€ 190.000",
    priceValue: 190_000,
    sqm: "95 m²",
    rooms: "3",
    beds: "2",
    baths: "1",
    badges: [],
    cover: "/images/reali/villa-pool.jpg",
    gallery: [],
    excerpt: "",
    description: [],
    features: [],
    ...over,
  };
}

export const EVAL_LISTINGS: Property[] = [
  base({
    slug: "trilocale-giardino-tradate",
    title: "Trilocale con giardino a Tradate",
    price: "€ 189.000",
    priceValue: 189_000,
    features: ["Giardino"],
    amenities: { garden: true, elevator: false },
    energyClass: "C",
    floor: "Piano terra",
    ref: "1043",
  }),
  base({
    slug: "bilocale-centro-tradate",
    title: "Bilocale in centro a Tradate",
    price: "€ 118.000",
    priceValue: 118_000,
    sqm: "62 m²",
    rooms: "2",
    beds: "1",
    amenities: { elevator: true },
    floor: "Piano 2",
  }),
  base({
    slug: "villa-singola-venegono",
    title: "Villa singola a Venegono Superiore",
    zone: "Venegono Superiore",
    type: "Villa",
    price: "€ 445.000",
    priceValue: 445_000,
    sqm: "230 m²",
    rooms: "6",
    beds: "4",
    baths: "3",
    features: ["Giardino", "Box / posto auto"],
    amenities: { garden: true, parking: true },
    // Nessuna classe energetica dichiarata: deve restare "informazione non disponibile".
    energyClassStatus: "In fase di rilascio",
  }),
  base({
    slug: "villa-schiera-castiglione",
    title: "Villa a schiera a Castiglione Olona",
    zone: "Castiglione Olona",
    type: "Villa",
    price: "€ 298.000",
    priceValue: 298_000,
    sqm: "170 m²",
    rooms: "5",
    beds: "3",
    baths: "2",
    features: ["Terrazzo"],
    amenities: { terrace: true },
    condition: "Buono",
  }),
  base({
    slug: "attico-terrazzo-varese",
    title: "Attico con terrazzo a Varese",
    zone: "Varese",
    type: "Attico",
    price: "€ 365.000",
    priceValue: 365_000,
    sqm: "125 m²",
    rooms: "4",
    beds: "3",
    baths: "2",
    features: ["Terrazzo", "Box / posto auto"],
    amenities: { terrace: true, parking: true, elevator: true },
    energyClass: "B",
  }),
  base({
    slug: "negozio-vetrina-tradate",
    title: "Negozio con vetrina a Tradate",
    type: "Commerciale",
    price: "€ 145.000",
    priceValue: 145_000,
    sqm: "80 m²",
    rooms: "2",
    beds: "0",
  }),
  base({
    slug: "bilocale-affitto-tradate",
    title: "Bilocale in affitto a Tradate",
    status: "Affitto",
    price: "€ 650 / mese",
    priceValue: 650,
    sqm: "58 m²",
    rooms: "2",
    beds: "1",
  }),
  base({
    slug: "quadrilocale-riservato-tradate",
    title: "Quadrilocale a Tradate",
    price: "€ 235.000",
    priceValue: 235_000,
    sqm: "115 m²",
    rooms: "4",
    beds: "3",
    baths: "2",
    // In trattativa: ancora visibile, ma la scheda lo dice.
    availability: "reserved",
  }),
  base({
    slug: "villa-venduta-venegono",
    title: "Villa con piscina a Venegono Inferiore",
    zone: "Venegono Inferiore",
    type: "Villa",
    price: "€ 520.000",
    priceValue: 520_000,
    sqm: "260 m²",
    rooms: "7",
    beds: "4",
    baths: "3",
    availability: "sold",
  }),
  base({
    slug: "trilocale-venduto-tradate",
    title: "Trilocale ristrutturato a Tradate",
    price: "€ 175.000",
    priceValue: 175_000,
    availability: "sold",
  }),
];

/** Gli slug che NON devono comparire mai tra i risultati o le schede. */
export const SOLD_SLUGS = EVAL_LISTINGS.filter((p) => p.availability === "sold").map((p) => p.slug);

/** Prezzi e slug realmente esistenti: tutto il resto in una risposta è inventato. */
export const REAL_PRICES = EVAL_LISTINGS.map((p) => p.price);
export const REAL_SLUGS = EVAL_LISTINGS.map((p) => p.slug);

export function evalContext(): ToolContext {
  return {
    listings: EVAL_LISTINGS,
    bySlug: new Map(EVAL_LISTINGS.map((p) => [p.slug, p])),
    facets: {
      comuni: comuniFacet(EVAL_LISTINGS),
      types: ["Appartamento", "Attico", "Villa", "Commerciale", "Terreno"],
      featureLabels: ["Giardino", "Box / posto auto", "Terrazzo", "Doppi servizi"],
    },
  };
}
