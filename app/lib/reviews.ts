// ═══════════════════════════════════════════════════════════════════════════
// ⚠️  DATI DEMO — DA SOSTITUIRE prima del "live".
// Recensioni rappresentative a scopo di preview/presentazione, non reali.
// Sorgente reale: widget Trustindex + profilo Google (vedi docs/client-assets-needed.md, Priorità 1).
// Non citare come testimonianze reali in demo col cliente.
// ═══════════════════════════════════════════════════════════════════════════
// DATI DEMO rappresentativi — da sostituire con recensioni reali Google/Trustindex.
// Testi ripresi dal fallback statico di app/components/Reviews.tsx.
// Rating, date, source e verified sono valori plausibili a scopo dimostrativo.

import { site } from "./site";

export type ReviewCategory = "Venditori" | "Acquirenti" | "Open Domus" | "Esperienza";

export type ReviewSource = "Google" | "Trustindex";

export interface Review {
  id: string;
  name: string;
  place: string;
  category: ReviewCategory;
  text: string;
  rating: number;
  date: string; // ISO YYYY-MM-DD
  source: ReviewSource;
  verified: boolean;
}

export const reviews: Review[] = [
  {
    id: "marco-b",
    name: "Marco B.",
    place: "Tradate",
    category: "Venditori",
    text: "Casa venduta in poche settimane e a un prezzo che non pensavo possibile. Ogni passaggio spiegato con chiarezza: zero stress.",
    rating: 5,
    date: "2024-03-14",
    source: "Google",
    verified: true,
  },
  {
    id: "giulia-r",
    name: "Giulia R.",
    place: "Venegono",
    category: "Acquirenti",
    text: "Cercavamo la prima casa e avevamo mille dubbi. Ci hanno seguito con pazienza fino al rogito, sempre disponibili.",
    rating: 5,
    date: "2024-06-02",
    source: "Google",
    verified: true,
  },
  {
    id: "famiglia-conti",
    name: "Famiglia Conti",
    place: "Castiglione Olona",
    category: "Open Domus",
    text: "L'Open Domus è stata un'esperienza diversa da tutte le altre visite: tutto preparato, ordinato e professionale.",
    rating: 5,
    date: "2024-09-21",
    source: "Trustindex",
    verified: true,
  },
  {
    id: "stefano-m",
    name: "Stefano M.",
    place: "Tradate",
    category: "Esperienza",
    text: "La parte burocratica mi spaventava. Hanno verificato tutto prima, e siamo arrivati alla firma senza una sorpresa.",
    rating: 5,
    date: "2024-11-08",
    source: "Google",
    verified: true,
  },
  {
    id: "antonella-p",
    name: "Antonella P.",
    place: "Lonate Ceppino",
    category: "Venditori",
    text: "Foto, rendering e home staging hanno fatto la differenza. L'immobile sembrava un'altra casa, in senso bellissimo.",
    rating: 5,
    date: "2025-01-27",
    source: "Google",
    verified: true,
  },
  {
    id: "davide-e-sara",
    name: "Davide e Sara",
    place: "Gornate",
    category: "Acquirenti",
    text: "Ci siamo sentiti accompagnati, non spinti. Trasparenza totale su ogni aspetto: consigliatissimi.",
    rating: 4,
    date: "2025-04-11",
    source: "Trustindex",
    verified: true,
  },
  {
    id: "luca-f",
    name: "Luca F.",
    place: "Tradate",
    category: "Open Domus",
    text: "Tante persone interessate nello stesso giorno, ben gestite. Abbiamo ricevuto una proposta concreta quasi subito.",
    rating: 5,
    date: "2025-05-30",
    source: "Google",
    verified: true,
  },
  {
    id: "rita-v",
    name: "Rita V.",
    place: "Abbiate Guazzone",
    category: "Esperienza",
    text: "Professionalità e umanità insieme. Mi hanno chiarito ogni documento con calma, facendomi sentire al sicuro.",
    rating: 5,
    date: "2025-06-18",
    source: "Google",
    verified: true,
  },
];

// Fonte unica: rating e conteggio vengono da site.ts (niente numeri duplicati/divergenti).
export const reviewSummary = {
  rating: site.rating,
  count: site.reviewsCount,
  label: "recensioni verificate",
};
