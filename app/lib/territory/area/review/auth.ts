// AUTORIZZAZIONE della redazione d'area (Prompt 10). SERVER-ONLY.
//
// Due cose separate, e tenerle separate è metà del lavoro:
//   • AUTENTICAZIONE — chi sei. Un token firmato, letto da un cookie.
//   • AUTORIZZAZIONE — cosa puoi fare. Una matrice ruolo → permessi, controllata prima di OGNI
//     operazione che scrive, mai solo prima di mostrare un pulsante.
//
// La differenza conta perché nascondere un pulsante non è una difesa: le azioni server di Next
// sono endpoint, raggiungibili anche da chi la pagina non l'ha mai aperta. Il controllo che vale
// è quello dentro l'operazione — `requirePermission` — e la UI si limita a non proporre ciò che
// comunque verrebbe rifiutato.
//
// PERCHÉ UN TOKEN FIRMATO E NON UNA PASSWORD CONDIVISA. Il repository ha già il precedente di un
// segreto Bearer server-only (app/api/territory/revalidate/route.ts) e per una API va benissimo.
// Qui serve qualcosa in più: le decisioni editoriali finiscono in un audit APPEND-ONLY con nome
// e cognome, e un segreto condiviso fra quattro persone renderebbe quell'audit una finzione —
// tutte le approvazioni firmate "chiunque avesse il segreto". Il token porta invece l'identità e
// il ruolo di UNA persona, e la firma impedisce di scriverseli da soli.

import { createHmac, timingSafeEqual } from "node:crypto";

if (typeof window !== "undefined") {
  throw new Error("[territory/area/review] autorizzazione: modulo server-only.");
}

// ─────────────────────────────────────────────────────────────
// Ruoli e permessi
// ─────────────────────────────────────────────────────────────

/**
 * I quattro ruoli, dal più stretto al più ampio.
 *
 * Sono quattro e non due perché le tre decisioni in gioco sono davvero diverse: raccogliere
 * evidenza, dichiararla vera, e metterla sul sito. Chi fa ricerca non deve poter approvare ciò
 * che ha appena trovato — non per sfiducia, ma perché il secondo paio di occhi è l'unica cosa
 * che distingue un dato verificato da un dato inserito.
 */
export type ReviewRole = "viewer" | "researcher" | "editor" | "publisher";

export type ReviewPermission =
  /** Vedere code e dettagli. */
  | "read"
  /** Accodare ricerche, registrare fonti candidate. */
  | "research"
  /** Approvare o rifiutare un FATTO, risolvere un conflitto. */
  | "approve-fact"
  /** Correggere il testo di un fatto (con traccia). */
  | "edit-fact"
  /** Far rigenerare una narrativa. */
  | "regenerate"
  /** Approvare una NARRATIVA. */
  | "approve-narrative"
  /** Pubblicare, ritirare, tornare a una versione precedente. */
  | "publish"
  /** Vedere le coordinate private. Separato da tutto il resto. */
  | "view-coordinates";

/**
 * La matrice. Esplicita e per esteso: un permesso derivato per gerarchia («publisher può tutto
 * ciò che può editor») è comodo finché qualcuno non aggiunge un permesso e scopre di averlo dato
 * a tre ruoli senza volerlo.
 */
const ROLE_PERMISSIONS: Record<ReviewRole, readonly ReviewPermission[]> = {
  viewer: ["read"],
  researcher: ["read", "research"],
  editor: ["read", "research", "approve-fact", "edit-fact", "regenerate", "approve-narrative"],
  publisher: [
    "read",
    "research",
    "approve-fact",
    "edit-fact",
    "regenerate",
    "approve-narrative",
    "publish",
  ],
};

/**
 * Le COORDINATE non sono nella matrice dei ruoli, e non è una dimenticanza.
 *
 * Sono un permesso a sé, concesso per persona e non per ruolo: la stragrande maggioranza del
 * lavoro editoriale non ne ha bisogno — si approvano fatti e testi, non posizioni — e un
 * permesso che sta in un ruolo finisce per essere dato a chiunque abbia quel ruolo.
 */
function coordinateGrantees(): Set<string> {
  const raw = process.env.AREA_REVIEW_COORDINATE_ACCESS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export interface ReviewSession {
  /** Identità della persona: finisce nell'audit, quindi deve essere un nome, non un ruolo. */
  actor: string;
  role: ReviewRole;
  /** Scadenza del token (epoch in secondi). */
  expiresAt: number;
}

/** I permessi effettivi di una sessione, coordinate comprese se concesse a questa persona. */
export function permissionsOf(session: ReviewSession): ReviewPermission[] {
  const base = [...ROLE_PERMISSIONS[session.role]];
  if (coordinateGrantees().has(session.actor.toLowerCase())) base.push("view-coordinates");
  return base;
}

export function hasPermission(session: ReviewSession, permission: ReviewPermission): boolean {
  return permissionsOf(session).includes(permission);
}

// ─────────────────────────────────────────────────────────────
// Token
// ─────────────────────────────────────────────────────────────

export class ReviewAuthError extends Error {
  constructor(
    message: string,
    /** `unauthenticated` = non so chi sei; `forbidden` = so chi sei e non puoi. */
    readonly kind: "unauthenticated" | "forbidden" | "not-configured",
  ) {
    super(message);
    this.name = "ReviewAuthError";
  }
}

/** Il segreto di firma. Assente = la redazione è SPENTA, non aperta. */
function signingSecret(): string | null {
  const raw = process.env.AREA_REVIEW_SECRET;
  return typeof raw === "string" && raw.trim().length >= 32 ? raw.trim() : null;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Emette un token per una persona. Si usa da CLI: non esiste una pagina di login pubblica,
 * perché non esiste un pubblico a cui darla.
 */
export function issueReviewToken(
  session: Omit<ReviewSession, "expiresAt">,
  options: { ttlSeconds?: number; now: Date },
): string {
  const secret = signingSecret();
  if (!secret) {
    throw new ReviewAuthError(
      "AREA_REVIEW_SECRET non configurato (minimo 32 caratteri): la redazione è spenta.",
      "not-configured",
    );
  }
  const expiresAt = Math.floor(options.now.getTime() / 1000) + (options.ttlSeconds ?? 12 * 3600);
  const payload = JSON.stringify({ actor: session.actor, role: session.role, expiresAt });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${sign(encoded, secret)}`;
}

/**
 * Verifica un token e ne estrae la sessione. `null` per qualunque motivo di rifiuto.
 *
 * Il confronto della firma è a TEMPO COSTANTE: un `===` su una stringa esce al primo carattere
 * diverso, e la differenza di tempo fra "sbagliata subito" e "sbagliata alla fine" è
 * sufficiente, con abbastanza tentativi, a ricostruire la firma un byte alla volta.
 */
export function verifyReviewToken(token: string | undefined | null, now: Date): ReviewSession | null {
  const secret = signingSecret();
  if (!secret || typeof token !== "string") return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Partial<ReviewSession>;
    if (typeof parsed.actor !== "string" || !parsed.actor.trim()) return null;
    if (typeof parsed.role !== "string" || !(parsed.role in ROLE_PERMISSIONS)) return null;
    if (typeof parsed.expiresAt !== "number") return null;
    if (parsed.expiresAt * 1000 <= now.getTime()) return null; // scaduto
    return { actor: parsed.actor, role: parsed.role as ReviewRole, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

/** Il nome del cookie di sessione. */
export const REVIEW_COOKIE = "dt_area_review";

/**
 * Il cancello da chiamare all'INIZIO di ogni operazione che scrive.
 *
 * Lancia, non ritorna un booleano: un controllo che ritorna un valore si può dimenticare di
 * leggere, e il caso in cui ci si dimentica è quello in cui l'operazione procede.
 */
export function requirePermission(
  session: ReviewSession | null,
  permission: ReviewPermission,
): ReviewSession {
  if (!session) {
    throw new ReviewAuthError("Sessione assente o scaduta.", "unauthenticated");
  }
  if (!hasPermission(session, permission)) {
    throw new ReviewAuthError(
      `Il ruolo "${session.role}" non può "${permission}".`,
      "forbidden",
    );
  }
  return session;
}

/** true se la redazione è configurata. A false ogni rotta risponde 404: non esiste. */
export function isReviewConfigured(): boolean {
  return signingSecret() !== null;
}
