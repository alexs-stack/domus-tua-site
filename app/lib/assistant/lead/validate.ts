// Validazione della richiesta scritta lasciata dall'assistente.
//
// Superficie esposta a internet: va validata sul server, sempre. La validazione lato client
// serve solo a dare un buon feedback, non è una difesa.
//
// Nessun dato viene salvato: quello che passa di qui viene formattato in un'email e
// dimenticato. Vedi docs/assistant-architecture.md.

import { z } from "zod";

/** Errori "safe": etichette, mai messaggi interni. Il client li traduce in italiano. */
export type LeadErrorCode =
  | "nome-mancante"
  | "contatto-mancante"
  | "contatto-non-valido"
  | "messaggio-mancante"
  | "consenso-mancante"
  | "sospetto"
  | "troppi-link"
  | "bad-request";

const schema = z
  .object({
    nome: z.string().min(1).max(80),
    /** Email oppure telefono: almeno uno dei due, controllato sotto. */
    email: z.string().max(120).optional(),
    telefono: z.string().max(40).optional(),
    messaggio: z.string().min(1).max(1500),
    /** Slug dell'immobile di interesse. Facoltativo, validato contro il catalogo dal chiamante. */
    immobile: z.string().max(160).optional(),
    /** Consenso privacy: obbligatorio, e deve essere esattamente true. */
    consenso: z.literal(true),
    /** Pagina da cui scrive l'utente. Relativa, mai protocol-relative. */
    pagePath: z
      .string()
      .max(200)
      .regex(/^\/(?!\/)[^\s]*$/)
      .optional(),
    /**
     * Honeypot: campo nascosto che un umano non vede e non compila.
     * Se arriva valorizzato è un bot.
     */
    azienda: z.string().max(200).optional(),
  })
  .strict();

export type Lead = {
  nome: string;
  email?: string;
  telefono?: string;
  messaggio: string;
  immobile?: string;
  pagePath?: string;
};

export type LeadValidation =
  | { ok: true; lead: Lead }
  /** `silenzioso` = rispondere con un finto successo senza inviare (bot in trappola). */
  | { ok: false; code: LeadErrorCode; silenzioso?: boolean };

// Volutamente permissiva: la validazione di un'email non è il posto dove fare i pignoli,
// e rifiutare un indirizzo valido è peggio che accettarne uno sbagliato (l'agenzia se ne
// accorge e usa il telefono).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
// Almeno 6 cifre, con i separatori che la gente usa davvero.
const PHONE_RE = /^[+\d][\d\s./()-]{5,}$/;

/**
 * Quanti link DISTINTI contiene il messaggio.
 *
 * La prima alternativa consuma l'URL fino allo spazio: senza, un singolo
 * "https://www.domustua.com/case/villa" verrebbe contato tre volte (schema + "www." +
 * dominio) e una richiesta legittima finirebbe scambiata per spam.
 */
function countLinks(text: string): number {
  return (
    text.match(/(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(?:com|net|ru|xyz|top|shop)\b/gi) ?? []
  ).length;
}

/**
 * Soglia oltre la quale un messaggio è trattato come spam.
 *
 * Tre, non due: qualcuno può legittimamente incollare i link di due immobili da confrontare.
 * E, a differenza dell'honeypot, questo esito NON è silenzioso — una persona vera vede
 * l'errore e può correggere, invece di veder sparire la richiesta senza saperlo.
 */
const MAX_LINKS = 3;

export function validateLead(raw: unknown): LeadValidation {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    // Distinguiamo i casi che l'utente può correggere da quelli che non deve nemmeno vedere.
    const campi = new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "")));
    if (campi.has("consenso")) return { ok: false, code: "consenso-mancante" };
    if (campi.has("nome")) return { ok: false, code: "nome-mancante" };
    if (campi.has("messaggio")) return { ok: false, code: "messaggio-mancante" };
    return { ok: false, code: "bad-request" };
  }

  const data = parsed.data;

  // Honeypot pieno = bot. Rispondiamo "ok" senza inviare: dire "sei un bot" insegnerebbe
  // al bot come aggirare il controllo.
  if (data.azienda && data.azienda.trim().length > 0) {
    return { ok: false, code: "sospetto", silenzioso: true };
  }

  const email = data.email?.trim() || undefined;
  const telefono = data.telefono?.trim() || undefined;

  if (!email && !telefono) return { ok: false, code: "contatto-mancante" };
  if (email && !EMAIL_RE.test(email)) return { ok: false, code: "contatto-non-valido" };
  if (telefono && !PHONE_RE.test(telefono)) return { ok: false, code: "contatto-non-valido" };

  // Un messaggio pieno di link su un form immobiliare è spam, non una richiesta.
  if (countLinks(data.messaggio) >= MAX_LINKS) {
    return { ok: false, code: "troppi-link" };
  }

  return {
    ok: true,
    lead: {
      nome: data.nome.trim(),
      email,
      telefono,
      messaggio: data.messaggio.trim(),
      immobile: data.immobile?.trim() || undefined,
      pagePath: data.pagePath,
    },
  };
}
