// ═══════════════════════════════════════════════════════════════════════════
// ⚠️  DATI DEMO — DA SOSTITUIRE prima del "live".
// Recensioni rappresentative a scopo di preview/presentazione, non reali.
// Sorgente reale: widget Trustindex + profilo Google (vedi docs/da-chiedere-alla-cliente.md §4.6).
// Non citare come testimonianze reali in demo col cliente.
// ═══════════════════════════════════════════════════════════════════════════
// DATI DEMO rappresentativi — da sostituire con recensioni reali Google/Trustindex.
// Testi ripresi dal fallback statico di app/components/Reviews.tsx.
// Rating, date e source sono valori plausibili a scopo dimostrativo; `status`
// è "demo" per costruzione, così non possono mai passare per reali (vedi sotto).

import { site } from "./site";

export type ReviewCategory = "Venditori" | "Acquirenti" | "Open Domus" | "Esperienza";

export type ReviewSource = "Google" | "Trustindex";

/** Da dove viene la recensione (provenienza dichiarata). */
export type ReviewProvenance = "google" | "trustindex" | "native";

/**
 * Stato di pubblicazione. È il campo che tiene le demo lontane dalla produzione:
 *  • "demo"     → esempio dimostrativo. Non deve MAI comparire come recensione
 *                 reale in un build di produzione (solo in anteprima, etichettato).
 *  • "approved" → recensione vera, autorizzata dal cliente alla pubblicazione
 *                 (con nome/estratto/permesso). È l'unica che il sito mostra come reale.
 */
export type ReviewStatus = "demo" | "approved";

export interface Review {
  id: string;
  name: string;
  place: string;
  category: ReviewCategory;
  text: string;
  rating: number;
  date: string; // ISO YYYY-MM-DD
  source: ReviewSource;
  /** Provenienza dichiarata (Google/Trustindex/raccolta nativa). */
  provenance: ReviewProvenance;
  /** Stato di pubblicazione: vedi ReviewStatus. Sostituisce il vecchio
      `verified: boolean`, che una demo poteva dichiarare `true` sembrando reale. */
  status: ReviewStatus;
}

/**
 * ⚠️ DEMO — esempi dimostrativi, NON recensioni reali. `status: "demo"` le tiene
 * fuori dalla produzione (il selettore `nativeReviews` le rende solo in anteprima,
 * e il componente le etichetta). Contenuto invariato: non si inventano nomi,
 * città, voti o citazioni (né qui né altrove).
 */
export const demoReviews: Review[] = [
  {
    id: "marco-b",
    name: "Marco B.",
    place: "Tradate",
    category: "Venditori",
    text: "Casa venduta in poche settimane e a un prezzo che non pensavo possibile. Ogni passaggio spiegato con chiarezza: zero stress.",
    rating: 5,
    date: "2024-03-14",
    source: "Google",
    provenance: "google",
    status: "demo",
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
    provenance: "google",
    status: "demo",
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
    provenance: "trustindex",
    status: "demo",
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
    provenance: "google",
    status: "demo",
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
    provenance: "google",
    status: "demo",
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
    provenance: "trustindex",
    status: "demo",
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
    provenance: "google",
    status: "demo",
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
    provenance: "google",
    status: "demo",
  },
];

/**
 * RECENSIONI NATIVE APPROVATE — vuoto finché il cliente non consegna recensioni
 * reali AUTORIZZATE alla pubblicazione. Ogni voce dovrà avere `status: "approved"`,
 * la provenienza dichiarata e il permesso del cliente (nome/estratto). Finché
 * questo elenco è vuoto, la sezione nativa delle recensioni resta nascosta in
 * produzione (vedi `nativeReviews`): niente segnaposto, niente demo spacciate.
 * Cosa serve dal cliente: docs/da-chiedere-alla-cliente.md §4.6.
 */
export const approvedNativeReviews: Review[] = [];

/**
 * Una recensione è pubblicabile come REALE solo se è approvata dal cliente E
 * ben formata. Difende anche dai dati malformati: un record senza testo, senza
 * nome o con un voto fuori scala non finisce mai in pagina.
 */
export function isPublishableReview(r: unknown): r is Review {
  if (!r || typeof r !== "object") return false;
  const x = r as Record<string, unknown>;
  return (
    x.status === "approved" &&
    typeof x.name === "string" &&
    x.name.trim().length > 0 &&
    typeof x.text === "string" &&
    x.text.trim().length > 0 &&
    typeof x.rating === "number" &&
    x.rating >= 1 &&
    x.rating <= 5 &&
    typeof x.date === "string" &&
    !Number.isNaN(Date.parse(x.date))
  );
}

/** Esiste almeno una recensione nativa approvata e ben formata? */
export const hasApprovedNativeReviews = approvedNativeReviews.filter(isPublishableReview).length > 0;

/**
 * Le recensioni native da MOSTRARE nella sezione a card.
 *  • Produzione: SOLO quelle approvate e ben formate (oggi nessuna → la sezione
 *    nativa non compare: la prova reale resta voto + link a Google + Trustindex).
 *  • Anteprima (NEXT_PUBLIC_PREVIEW_BADGE=true): le demo, che il componente
 *    etichetta sempre come esempi dimostrativi.
 * Non fabbrica mai contenuti: se non c'è nulla di approvato, in produzione torna [].
 */
export function nativeReviews({ preview }: { preview: boolean }): Review[] {
  const approved = approvedNativeReviews.filter(isPublishableReview);
  if (approved.length > 0) return approved;
  return preview ? demoReviews : [];
}

// Fonte unica: rating e conteggio vengono da site.ts (niente numeri duplicati/divergenti).
// NB: sono il voto e il CONTEGGIO RECENSIONI di Google/Trustindex — non un numero
// di clienti distinti (una persona può lasciare più recensioni, e non tutti i
// clienti ne lasciano). Vedi il test di sicurezza recensioni.
export const reviewSummary = {
  rating: site.rating,
  count: site.reviewsCount,
  label: "recensioni verificate",
};
