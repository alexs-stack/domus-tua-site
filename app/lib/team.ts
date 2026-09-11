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
    // 2560×1920 in una cornice 4:5: taglia in larghezza, non in altezza. Il 32 %
    // tiene lei a sinistra e il riflesso nello specchio a destra.
    imagePos: "32% 50%",
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

export type TeamPhoto = {
  src: string;
  /** Alt fattuale: chi c'è e dove, niente di più. */
  alt: Record<Locale, string>;
  /** Didascalia della tessera: UNA riga, etichetta corta (non una frase). */
  label: Record<Locale, string>;
  /** object-position del ritaglio 4:5, misurato sulla foto vera. */
  pos?: string;
};

/**
 * Le foto di gruppo REALI per la rotaia del team (Team.tsx), dopo i ritratti.
 * Il cliente ha chiesto «carosello o scroll orizzontale con le foto grandi»
 * (2026-08-06): finché non arrivano i ritratti delle singole colleghe, i
 * volti veri stanno qui — niente monogrammi vuoti, niente facce finte.
 *
 * UNA SOLA CORNICE (2026-09-11). Le tessere erano 4:5, 3:2 e 4:3 insieme: il
 * bordo basso della rotaia era frastagliato e la tessera più alta dettava
 * l'altezza di tutte. Ora la cornice è una sola (`.dt-media-column`, 4:5) e
 * qui restano solo le foto che quel ritaglio regge senza tagliare una faccia:
 *   - `team-trio.jpg` è uscita: fondale nero da studio, e il sito non ha
 *     superfici scure fuori dal preloader (resta su /lavora-con-noi).
 *   - `premio-team.jpg` è uscita: è già la foto del capitolo delle cinque
 *     stelle (StarReviews). In home ogni file compare una volta sola.
 * Ogni `pos` è misurato sul file: 1920×1280 per il gruppo, 809×936 per le
 * giacche rosse.
 */
export const teamPhotos: TeamPhoto[] = [
  {
    src: "/images/reali/team-red.jpg",
    // La foto è quasi verticale (809×936): in 4:5 entra quasi intera.
    pos: "50% 22%",
    alt: {
      it: "Il team Domus Tua con la giacca rossa",
      en: "The Domus Tua team in their red blazers",
      fr: "L’équipe Domus Tua en veste rouge",
      de: "Das Domus Tua Team in roten Blazern",
      es: "El equipo Domus Tua con la chaqueta roja",
    },
    // «Il team» da solo ripeterebbe l'eyebrow del blocco: l'etichetta dice
    // quale foto è, non quale sezione.
    label: {
      it: "Il team in rosso",
      en: "The team in red",
      fr: "L’équipe en rouge",
      de: "Das Team in Rot",
      es: "El equipo en rojo",
    },
  },
  {
    src: "/images/reali/team-group.jpg",
    // 3:2 in una cornice 4:5 tiene il 53 % della larghezza: al 62 % i bordi
    // cadono sulle spalle delle due colleghe ai lati, non sui loro volti.
    pos: "62% 45%",
    alt: {
      it: "Raffaela Rizza con il team Domus Tua in studio",
      en: "Raffaela Rizza with the Domus Tua team in the studio",
      fr: "Raffaela Rizza avec l’équipe Domus Tua en studio",
      de: "Raffaela Rizza mit dem Domus Tua Team im Studio",
      es: "Raffaela Rizza con el equipo Domus Tua en el estudio",
    },
    label: {
      it: "In studio",
      en: "In the studio",
      fr: "En studio",
      de: "Im Studio",
      es: "En el estudio",
    },
  },
];
