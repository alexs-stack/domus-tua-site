// Formato dei recapiti — UNA sola definizione, usata dal client (validazione
// nel form) e dal server (validateLead). Se le due divergessero, un input
// accettato a schermo verrebbe respinto dal backend (o viceversa): la regola
// deve essere la stessa da entrambi i lati.
//
// Nessuna delle due è una validazione RFC/E.164 completa: quelle respingono
// indirizzi e numeri validi. Servono a fermare gli errori evidenti (una email
// senza @, un telefono di tre cifre), non a certificare la consegnabilità.

// TLD di almeno 2 caratteri: `a@b.c` non è un indirizzo reale (nessun TLD è di una
// sola lettera) e prima passava. Resta volutamente permissiva sul resto — non è
// una validazione RFC completa, che respingerebbe indirizzi validi.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS_RE = /^\+?\d{6,15}$/;

/** Lunghezze massime dei recapiti (client e server allineati). */
export const CONTACT_MAX = { phone: 40, email: 160 } as const;

/** Una @, un dominio, un punto e un TLD di almeno 2 caratteri, niente spazi, entro il cap. */
export function isEmailFormat(v: string): boolean {
  const t = v.trim();
  return t.length > 0 && t.length <= CONTACT_MAX.email && EMAIL_RE.test(t);
}

/** Da 6 a 15 cifre con un eventuale + iniziale; spazi/trattini/punti/parentesi ignorati. */
export function isPhoneFormat(v: string): boolean {
  const compact = v.trim().replace(/[\s\-.()/]/g, "");
  return PHONE_DIGITS_RE.test(compact);
}
