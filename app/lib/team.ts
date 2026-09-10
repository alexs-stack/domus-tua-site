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
      — senza foto parte il monogramma.
      Nota 2026-08-06: raffaela-ritratto.jpg era escluso perché aveva due
      fasce bianche cotte nel file. Le fasce erano solo in alto e in basso
      (39px e 77px), quindi il ritaglio le ha tolte davvero: il file è ora
      763×442 pulito e utilizzabile anche qui. */
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

/** Cornice della tessera nella rotaia: 4:5 per i ritratti, 3:2 e 4:3 per i gruppi. */
export type TeamPhotoFrame = "portrait" | "landscape" | "classic";

export type TeamPhoto = {
  src: string;
  /** Didascalia e alt, fattuali: chi c'è e dove, niente di più. */
  alt: Record<Locale, string>;
  /** object-position del ritaglio, se il gruppo non sta al centro. */
  pos?: string;
  frame: TeamPhotoFrame;
};

/**
 * Le foto di gruppo REALI per la rotaia del team (Team.tsx), dopo i ritratti.
 * Il cliente ha chiesto «carosello o scroll orizzontale con le foto grandi»
 * (2026-08-06): finché non arrivano i ritratti delle singole colleghe, i
 * volti veri stanno qui — niente monogrammi vuoti, niente facce finte.
 * Nessuna di queste foto compare altrove in home (ognuna una volta sola).
 */
export const teamPhotos: TeamPhoto[] = [
  {
    src: "/images/reali/team-trio.jpg",
    frame: "landscape",
    alt: {
      it: "Tre componenti del team Domus Tua in studio",
      en: "Three members of the Domus Tua team in the studio",
      fr: "Trois membres de l’équipe Domus Tua en studio",
      de: "Drei Mitglieder des Domus Tua Teams im Studio",
      es: "Tres integrantes del equipo Domus Tua en el estudio",
    },
  },
  {
    src: "/images/reali/team-red.jpg",
    frame: "portrait",
    alt: {
      it: "Il team Domus Tua con la giacca rossa",
      en: "The Domus Tua team in their red blazers",
      fr: "L’équipe Domus Tua en veste rouge",
      de: "Das Domus Tua Team in roten Blazern",
      es: "El equipo Domus Tua con la chaqueta roja",
    },
  },
  {
    src: "/images/reali/team-group.jpg",
    frame: "landscape",
    alt: {
      it: "Il team Domus Tua al completo, con Raffaela Rizza al centro",
      en: "The full Domus Tua team, with Raffaela Rizza at the centre",
      fr: "L’équipe Domus Tua au complet, avec Raffaela Rizza au centre",
      de: "Das komplette Domus Tua Team, mit Raffaela Rizza in der Mitte",
      es: "El equipo Domus Tua al completo, con Raffaela Rizza en el centro",
    },
  },
  {
    src: "/images/reali/premio-team.jpg",
    frame: "classic",
    alt: {
      it: "Il team Domus Tua con la targa Top Agency 2025 di Wikicasa",
      en: "The Domus Tua team with the Wikicasa Top Agency 2025 plaque",
      fr: "L’équipe Domus Tua avec la plaque Top Agency 2025 de Wikicasa",
      de: "Das Domus Tua Team mit der Wikicasa Top Agency 2025 Plakette",
      es: "El equipo Domus Tua con la placa Top Agency 2025 de Wikicasa",
    },
  },
];
