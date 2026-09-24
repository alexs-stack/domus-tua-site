// Quarantena dei SEGNAPOSTO non compilati nella descrizione (es. «un ampio bagno di oltre ____ mq»).
//
// Nel feed live esiste davvero una frase con «____»: qualcuno l'ha scritta pensando di tornarci e
// non ci è tornato. Un segnaposto pubblicato è un buco nel testo che arriva a chi compra casa.
//
// PRINCIPIO NON NEGOZIABILE: non si inventa la misura mancante. Quindi, in modo deterministico,
// togliamo la FRASE-MISURA incompleta che contiene il segnaposto (senza aggiungere nulla), così in
// pagina non compare mai un «____». La correzione VERA resta a monte:
//   • si corregge la frase nel gestionale RealSmart, oppure
//   • si approva un override (descrizione sostitutiva) per quell'immobile.
// Che una quarantena sia avvenuta viaggia sul dato normalizzato (`placeholderQuarantined`) e fa
// FALLIRE l'audit dei contenuti: questa è una rete di sicurezza, non la riparazione.

// Segnaposto tipici lasciati da chi compila a mano.
const PLACEHOLDER = "(?:_{2,}|\\bX{3,}\\b|\\bT\\.?B\\.?D\\b|\\bN\\/D\\b)";

// Frammento-misura incompleto: eventuale "di/da (oltre|circa|almeno|quasi|più di)" + SEGNAPOSTO +
// eventuale unità (mq/m²/mc/metri quadri/vani/locali/camere/bagni). Si rimuove l'intero frammento.
const PLACEHOLDER_MEASURE_RE = new RegExp(
  `\\s*(?:(?:di|da)\\s+)?(?:oltre|circa|almeno|quasi|più\\s+di)?\\s*${PLACEHOLDER}\\s*(?:mq|m²|m2|mc|metri\\s+quadri?|vani|locali|camere|bagni)?`,
  "giu",
);

export interface QuarantineOutcome {
  /** Testo senza il frammento-segnaposto. */
  text: string;
  /** Quanti segnaposto sono stati messi in quarantena. */
  quarantined: number;
}

/** Rileva (senza modificare) la presenza di un segnaposto non compilato. */
export function hasPlaceholder(text: string): boolean {
  return new RegExp(PLACEHOLDER, "u").test(text);
}

/** Toglie i frammenti-misura incompleti; ricompatta spazi/punteggiatura solo se ha tolto qualcosa. */
export function quarantinePlaceholders(text: string): QuarantineOutcome {
  let quarantined = 0;
  let out = text.replace(PLACEHOLDER_MEASURE_RE, () => {
    quarantined += 1;
    return "";
  });
  if (quarantined > 0) {
    out = out
      .replace(/\(\s*\)/g, "") // eventuali parentesi rimaste vuote
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+([.,;:])/g, "$1")
      .trim();
  }
  return { text: out, quarantined };
}

/** Quarantena su un elenco di paragrafi, scartando quelli rimasti vuoti. */
export function quarantineParagraphs(
  paragraphs: readonly string[],
): { paragraphs: string[]; quarantined: number } {
  let quarantined = 0;
  const out: string[] = [];
  for (const par of paragraphs) {
    const r = quarantinePlaceholders(par);
    quarantined += r.quarantined;
    if (r.text.trim().length > 0) out.push(r.text);
  }
  return { paragraphs: out, quarantined };
}
