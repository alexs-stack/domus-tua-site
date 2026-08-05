// Il team Domus Tua — FONTE UNICA e PURA.
//
// I nomi e i ruoli stavano dentro Team.tsx ("use client", con gsap e next/image):
// non erano riusabili da un'altra pagina né verificabili da un test. Ora vivono qui,
// come per i video in app/lib/videos.ts, e chi li mostra (Team.tsx, /lavora-con-noi)
// legge da questo modulo. Aggiungere o togliere una persona si fa in UN posto solo.
//
// Dati PUBBLICI e verificati: roster di domustua.com/chi-siamo (lug 2026), vedi
// docs/content-replacement-checklist.md. Grafia della fondatrice: "Raffaela" (una L),
// confermata da una recensione Google reale — non correggere in "Raffaella".

import type { Locale } from "./i18n/dictionaries";

/** Chiave del ruolo: stabile, non tradotta. Le etichette stanno in `teamRoleLabels`. */
export type TeamRoleKey =
  | "founder"
  | "office"
  | "architect"
  | "frontOffice"
  | "executive"
  | "homeStager";

export type TeamMember = {
  /** Nome reale, come pubblicato dall'agenzia. */
  name: string;
  role: TeamRoleKey;
  /** Una sola persona: marca il pallino rosso accanto alle iniziali. */
  founder?: boolean;
  /** Ritratto per il trail di TeamTrail. Il cliente consegnerà le foto delle
      singole persone (2026-08): quando arrivano, basta compilare questo campo
      — senza foto parte il monogramma. NON usare i file con la cornice bianca
      cotta dentro (es. raffaela-ritratto.jpg): il ritaglio non può toglierla. */
  image?: string;
  /** object-position del ritaglio (il soggetto non è sempre al centro). */
  imagePos?: string;
};

/** Il roster, nell'ordine in cui va mostrato. */
export const team: TeamMember[] = [
  {
    name: "Raffaela Rizza",
    role: "founder",
    founder: true,
    image: "/images/reali/raffaela-specchio-sorriso.jpg",
    imagePos: "30% 28%",
  },
  { name: "Paloma Cavalcante", role: "office" },
  { name: "Eleonora D’Agati", role: "architect" },
  { name: "Viola Benatti", role: "frontOffice" },
  { name: "Tiziana Galeone", role: "executive" },
  { name: "Katya Fedrigo", role: "homeStager" },
];

/**
 * Etichette dei ruoli per lingua.
 *
 * Molti titoli restano in inglese anche in italiano perché è così che l'agenzia li
 * usa davvero sul proprio sito (Founder & CEO, Office Manager, Home Stager): non
 * sono anglicismi nostri, sono i loro biglietti da visita.
 */
export const teamRoleLabels: Record<Locale, Record<TeamRoleKey, string>> = {
  it: {
    founder: "Founder & CEO",
    office: "Office Manager",
    architect: "Architetto",
    frontOffice: "Front Office",
    executive: "Executive",
    homeStager: "Home Stager",
  },
  en: {
    founder: "Founder & CEO",
    office: "Office Manager",
    architect: "Architect",
    frontOffice: "Front Office",
    executive: "Executive",
    homeStager: "Home Stager",
  },
  fr: {
    founder: "Founder & CEO",
    office: "Office Manager",
    architect: "Architecte",
    frontOffice: "Front Office",
    executive: "Executive",
    homeStager: "Home Stager",
  },
  de: {
    founder: "Founder & CEO",
    office: "Office Manager",
    architect: "Architektin",
    frontOffice: "Front Office",
    executive: "Executive",
    homeStager: "Home Stager",
  },
  es: {
    founder: "Founder & CEO",
    office: "Office Manager",
    architect: "Arquitecta",
    frontOffice: "Front Office",
    executive: "Executive",
    homeStager: "Home Stager",
  },
};

/** Iniziali per gli avatar tipografici (max due lettere). */
export function teamInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("");
}
