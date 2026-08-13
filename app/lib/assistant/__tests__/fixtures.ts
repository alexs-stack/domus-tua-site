// Catalogo controllato per i test dell'assistente.
//
// I test NON devono dipendere dal feed RealSmart: un immobile può sparire da un giorno
// all'altro e renderebbe rossa una suite che invece è corretta. Qui costruiamo immobili finti
// nella forma REALE (NormalizedProperty), così passano dalla stessa normalizzazione della
// produzione. La verifica del feed vero è un test di integrazione separato (realsmart.test.ts).
//
// Allineato al feed live (verificato su 193 immobili):
//  • le caratteristiche sono l'insieme chiuso che il gestionale espone davvero;
//  • la classe energetica non c'è mai (il feed non la fornisce): resta sempre assente;
//  • alcuni immobili hanno mq/bagni/camere a 0, cioè "dato non disponibile";
//  • un immobile ha prezzo 0, cioè "prezzo su richiesta".
//
// Differenza voluta rispetto alla produzione: qui la provincia è valorizzata, così la chiave
// di zona diventa "Tradate (VA)" e la traduzione nome↔chiave viene esercitata. Sul feed vero
// la provincia oggi è vuota, quindi le due coincidono — ma il codice non deve dipenderne.

import { buildAssistantListings, type AssistantListings } from "../listings";
import type { NormalizedProperty } from "../../realsmart/types";

function listing(overrides: Partial<NormalizedProperty> & { id: string }): NormalizedProperty {
  const { id, ...rest } = overrides;
  return {
    id,
    slug: id,
    title: "Immobile di prova",
    descriptionParagraphs: ["Descrizione di prova."],
    structuredFactLines: [],
    keptFactLines: [],
    contentPreservation: 1,
    excerpt: "Descrizione di prova.",
    showAddress: false,
    price: 250000,
    priceLabel: "€ 250.000",
    contract: "vendita",
    type: "Appartamento",
    town: "Tradate",
    province: "VA",
    sqm: 90,
    rooms: 3,
    bedrooms: 2,
    baths: 1,
    features: [],
    images: [{ src: "https://cloud2.realsmart.it/foto.jpg", alt: "" }],
    status: "published",
    badges: [],
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    facts: [],
    factsReview: [],
    sourceRef: { codice: id },
    normalizedBy: "deterministic",
    ...rest,
  };
}

export const FIXTURE_LISTINGS: NormalizedProperty[] = [
  listing({
    id: "villa-giardino-tradate",
    title: "Villa con giardino",
    type: "Villa",
    town: "Tradate",
    price: 280000,
    priceLabel: "€ 280.000",
    sqm: 180,
    rooms: 5,
    bedrooms: 3,
    baths: 2,
    features: ["Giardino", "Box / posto auto"],
    descriptionParagraphs: ["Villa luminosa e indipendente con giardino privato e box doppio."],
    excerpt: "Villa luminosa e indipendente con giardino privato e box doppio.",
  }),
  listing({
    id: "villa-cara-tradate",
    title: "Villa signorile",
    type: "Villa",
    town: "Tradate",
    price: 450000,
    priceLabel: "€ 450.000",
    sqm: 220,
    rooms: 6,
    bedrooms: 4,
    baths: 3,
    features: ["Giardino", "Doppi servizi"],
    descriptionParagraphs: ["Villa signorile indipendente con ampio parco."],
    excerpt: "Villa signorile indipendente con ampio parco.",
  }),
  listing({
    id: "trilocale-venegono",
    title: "Trilocale ristrutturato",
    town: "Venegono Superiore",
    price: 195000,
    priceLabel: "€ 195.000",
    // mq e bagni assenti: caso "informazione non disponibile", non "non ce l'ha".
    sqm: 0,
    baths: 0,
    features: ["Terrazzo"],
    descriptionParagraphs: ["Trilocale luminoso completamente ristrutturato."],
    excerpt: "Trilocale luminoso completamente ristrutturato.",
  }),
  listing({
    id: "bilocale-ascensore-tradate",
    title: "Bilocale con ascensore",
    town: "Tradate",
    price: 145000,
    priceLabel: "€ 145.000",
    sqm: 65,
    rooms: 2,
    bedrooms: 1,
    baths: 1,
    features: ["Ascensore", "Aria condizionata"],
    descriptionParagraphs: ["Bilocale in palazzina con ascensore, pronto da abitare."],
    excerpt: "Bilocale in palazzina con ascensore, pronto da abitare.",
  }),
  listing({
    id: "quadrilocale-castiglione",
    title: "Quadrilocale con doppi servizi",
    town: "Castiglione Olona",
    price: 260000,
    priceLabel: "€ 260.000",
    sqm: 120,
    rooms: 4,
    bedrooms: 3,
    baths: 2,
    features: ["Ascensore", "Box / posto auto", "Doppi servizi"],
    descriptionParagraphs: ["Quadrilocale luminoso con doppi servizi e box."],
    excerpt: "Quadrilocale luminoso con doppi servizi e box.",
  }),
  listing({
    id: "villetta-lonate",
    title: "Villetta a schiera",
    type: "Villa",
    town: "Lonate Ceppino",
    price: 320000,
    priceLabel: "€ 320.000",
    sqm: 160,
    rooms: 5,
    bedrooms: 3,
    baths: 2,
    features: ["Giardino", "Terrazzo"],
    descriptionParagraphs: ["Villetta a schiera da ristrutturare con giardino."],
    excerpt: "Villetta a schiera da ristrutturare con giardino.",
  }),
  listing({
    id: "attico-varese",
    title: "Attico panoramico",
    type: "Attico",
    town: "Varese",
    price: 340000,
    priceLabel: "€ 340.000",
    sqm: 110,
    rooms: 4,
    bedrooms: 3,
    baths: 2,
    features: ["Terrazzo", "Ascensore"],
    descriptionParagraphs: ["Attico molto luminoso con terrazzo panoramico."],
    excerpt: "Attico molto luminoso con terrazzo panoramico.",
  }),
  listing({
    id: "negozio-tradate",
    title: "Negozio fronte strada",
    type: "Negozio",
    town: "Tradate",
    price: 180000,
    priceLabel: "€ 180.000",
    sqm: 90,
    rooms: 2,
    bedrooms: 0,
    baths: 1,
    descriptionParagraphs: ["Negozio fronte strada in posizione di passaggio."],
    excerpt: "Negozio fronte strada in posizione di passaggio.",
  }),
  listing({
    id: "terreno-venegono",
    title: "Terreno edificabile",
    type: "Terreno ed",
    town: "Venegono Inferiore",
    price: 90000,
    priceLabel: "€ 90.000",
    sqm: 1200,
    rooms: 0,
    bedrooms: 0,
    baths: 0,
    descriptionParagraphs: ["Terreno edificabile in zona residenziale."],
    excerpt: "Terreno edificabile in zona residenziale.",
  }),
  listing({
    id: "affitto-tradate",
    title: "Trilocale in affitto",
    town: "Tradate",
    contract: "affitto",
    price: 850,
    priceLabel: "€ 850",
    sqm: 70,
    rooms: 3,
    bedrooms: 2,
    baths: 1,
    features: ["Box / posto auto"],
    descriptionParagraphs: ["Trilocale arredato in affitto, zona centrale."],
    excerpt: "Trilocale arredato in affitto, zona centrale.",
  }),
  listing({
    id: "casa-prezzo-richiesta-tradate",
    title: "Casa singola riservata",
    type: "Casa singola",
    town: "Tradate",
    // Prezzo su richiesta: il feed lo espone come 0.
    price: 0,
    priceLabel: "Prezzo su richiesta",
    sqm: 200,
    rooms: 6,
    bedrooms: 4,
    baths: 3,
    features: ["Giardino"],
    descriptionParagraphs: ["Casa singola con giardino, trattativa riservata."],
    excerpt: "Casa singola con giardino, trattativa riservata.",
  }),
  listing({
    id: "attico-venduto-tradate",
    title: "Attico panoramico",
    type: "Attico",
    town: "Tradate",
    price: 390000,
    priceLabel: "€ 390.000",
    sqm: 140,
    // Il feed dichiara "published" ma il badge lo marca venduto: deve sparire comunque.
    badges: ["Venduto"],
    descriptionParagraphs: ["Attico con vista aperta."],
    excerpt: "Attico con vista aperta.",
  }),
];

/** Catalogo live pronto per i tool. */
export function fixtureListings(): AssistantListings {
  return buildAssistantListings(FIXTURE_LISTINGS, "live");
}

/** Catalogo non consultabile (feed giù, oppure modalità mock). */
export function unavailableListings(): AssistantListings {
  return buildAssistantListings(FIXTURE_LISTINGS, "mock");
}
