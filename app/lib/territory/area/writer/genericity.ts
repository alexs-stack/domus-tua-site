// «QUESTO TESTO POTREBBE DESCRIVERE QUALUNQUE PAESE?» (Prompt 14).
//
// È la modalità di fallimento più subdola di tutto il dominio, perché non produce nulla di
// falso. Ogni frase è corretta, ogni affermazione è agganciata a un fatto approvato, il cancello
// la lascia passare — e il risultato è un testo che vale identico per Tradate, per Gallarate e
// per centomila altri comuni italiani. Non è un errore: è inutilità, e su duecento schede è
// inutilità moltiplicata per duecento.
//
// LA DIFFICOLTÀ, ed è quella che rende il problema interessante: due comuni vicini CONDIVIDONO
// davvero dei fatti. Hanno entrambi un municipio, entrambi una farmacia, magari la stessa linea
// ferroviaria. Un controllo che pretendesse testi tutti diversi costringerebbe a parafrasare per
// forza — cioè a peggiorare la scrittura per superare un controllo, che è il modo in cui i
// controlli si guadagnano il diritto di essere spenti.
//
// LA DISTINZIONE che questo modulo fa è quindi fra:
//
//   • SOVRAPPOSIZIONE LEGITTIMA — due testi condividono frasi perché condividono FATTI. Le
//     parole in comune sono nomi propri, numeri, denominazioni: «la linea S40», «il Parco
//     Pineta». Va benissimo, e forzare una differenza sarebbe un danno.
//
//   • GENERICITÀ — un testo è fatto quasi solo di parole che valgono ovunque: «servizi»,
//     «collegamenti», «nelle vicinanze», «zona». Nessun nome, nessun numero, niente che un
//     lettore possa cercare. Questo non deve uscire.
//
// Il segnale che le separa è la DENSITÀ DI ANCORE: quanti nomi propri e numeri per cento parole.
// Un testo con molte ancore può somigliare a un altro quanto vuole — sta parlando di cose
// precise. Un testo senza ancore è generico anche se è l'unico che abbiamo scritto.

import { significantWords, jaccardSimilarity } from "../factGuard";

/**
 * Parole che compaiono in qualunque descrizione territoriale e non distinguono niente.
 *
 * Non sono parole vietate — «servizi» in una frase con un nome proprio va benissimo. Sono parole
 * che, da sole, non dicono DOVE si è.
 */
const FILLER_WORDS = new Set([
  "zona", "area", "quartiere", "comune", "paese", "città", "centro", "territorio", "località",
  "servizi", "servizio", "collegamenti", "collegamento", "struttura", "strutture", "presenza",
  "presenti", "presente", "vicinanze", "prossimità", "raggiungibile", "raggiungibili",
  "disponibile", "disponibili", "diverse", "diversi", "vari", "varie", "alcune", "alcuni",
  "numerose", "numerosi", "principali", "locale", "locali", "abitanti", "residenti",
  "quotidiana", "quotidiano", "vita", "offre", "offrono", "trova", "trovano", "situato",
  "situata", "dispone", "dispongono", "consente", "permette",
]);

export interface GenericityReport {
  /** Parole significative totali. */
  words: number;
  /** ANCORE: nomi propri e numeri. Sono ciò che rende un testo su QUESTO posto. */
  anchors: string[];
  /** Ancore per cento parole significative. È il numero che decide. */
  anchorDensity: number;
  /** Quota di parole significative che sono riempitivo. */
  fillerRatio: number;
  /** true se il testo è troppo generico per essere pubblicato. */
  tooGeneric: boolean;
  reasons: string[];
}

/** Sotto questa densità di ancore, il testo non sta parlando di un posto in particolare. */
export const MIN_ANCHOR_DENSITY = 4; // ≈ quattro nomi o numeri ogni cento parole

/** Sopra questa quota di riempitivo, il testo è fatto di parole che valgono ovunque. */
export const MAX_FILLER_RATIO = 0.45;

/**
 * Le ANCORE di un testo: nomi propri interni alla frase e numeri.
 *
 * Un'ancora è ciò che un lettore può cercare — su un cartello, su un orario, su una mappa. Un
 * testo senza ancore non gli lascia niente in mano.
 */
export function anchorsIn(text: string): string[] {
  const out = new Set<string>();
  for (const line of text.split(/\n+/)) {
    for (const sentence of line.split(/(?<=[.!?:])\s+/)) {
      sentence
        .trim()
        .split(/\s+/)
        .forEach((raw, i) => {
          const token = raw.replace(/^[«"'(]+|[»"'),.;:!?]+$/g, "");
          if (/^\d+([.,]\d+)*$/.test(token)) {
            out.add(token); // un numero è un'ancora ovunque, anche a inizio frase
            return;
          }
          if (/^[A-Z]{1,3}\d{1,4}$/.test(token)) {
            out.add(token); // codici: S40, SS233
            return;
          }
          if (i === 0) return; // apertura di frase: la maiuscola non dice nulla
          if (/^[A-ZÀ-Ù][\wÀ-ù'’-]{2,}$/.test(token)) out.add(token);
        });
    }
  }
  return [...out];
}

/** Quanto questo testo parla di un posto in particolare. */
export function measureGenericity(text: string): GenericityReport {
  const words = significantWords(text);
  const anchors = anchorsIn(text);
  const anchorDensity = words.length === 0 ? 0 : (anchors.length / words.length) * 100;
  const filler = words.filter((w) => FILLER_WORDS.has(w)).length;
  const fillerRatio = words.length === 0 ? 0 : filler / words.length;

  const reasons: string[] = [];
  if (anchorDensity < MIN_ANCHOR_DENSITY) {
    reasons.push(
      `solo ${anchors.length} nomi o numeri su ${words.length} parole (${anchorDensity.toFixed(1)} per cento): ` +
        "il testo non nomina niente che un lettore possa cercare",
    );
  }
  if (fillerRatio > MAX_FILLER_RATIO) {
    reasons.push(
      `${Math.round(fillerRatio * 100)}% di parole che valgono per qualunque comune ` +
        "(«zona», «servizi», «collegamenti»…)",
    );
  }

  return { words: words.length, anchors, anchorDensity, fillerRatio, tooGeneric: reasons.length > 0, reasons };
}

// ─────────────────────────────────────────────────────────────
// Confronto fra aree
// ─────────────────────────────────────────────────────────────

export interface SimilarityPair {
  a: string;
  b: string;
  /** Somiglianza complessiva sulle parole significative. */
  similarity: number;
  /** Somiglianza calcolata IGNORANDO le ancore: è quella che rivela il testo riciclato. */
  similarityWithoutAnchors: number;
  /** Le ancore che i due testi NON condividono: la prova che parlano di posti diversi. */
  distinctAnchors: string[];
  suspicious: boolean;
  reason?: string;
}

/**
 * Oltre questa somiglianza SENZA ANCORE, due testi sono la stessa impalcatura con dentro nomi
 * diversi. Sopra 0.9 non è più «stessa struttura editoriale»: è il medesimo testo.
 */
export const MAX_STRUCTURAL_SIMILARITY = 0.9;

/**
 * Confronta due narrative d'area.
 *
 * IL CALCOLO CHE CONTA è il secondo: la somiglianza dopo aver tolto le ancore. Due testi su due
 * comuni con gli stessi servizi condividono legittimamente molte parole — ma se, tolti i nomi
 * propri e i numeri, resta la stessa frase identica, allora non sono due descrizioni: sono un
 * modello riempito due volte.
 *
 * E se le ancore sono diverse, la somiglianza grezza non è un problema: due comuni possono
 * davvero avere entrambi «una farmacia, un supermercato e la stazione».
 */
export function compareNarratives(
  a: { key: string; text: string },
  b: { key: string; text: string },
): SimilarityPair {
  const anchorsA = new Set(anchorsIn(a.text).map((x) => x.toLowerCase()));
  const anchorsB = new Set(anchorsIn(b.text).map((x) => x.toLowerCase()));

  const strip = (text: string, anchors: Set<string>): string =>
    significantWords(text)
      .filter((w) => !anchors.has(w))
      .join(" ");

  const similarity = jaccardSimilarity(a.text, b.text);
  const similarityWithoutAnchors = jaccardSimilarity(
    strip(a.text, anchorsA),
    strip(b.text, anchorsB),
  );

  const distinctAnchors = [
    ...[...anchorsA].filter((x) => !anchorsB.has(x)),
    ...[...anchorsB].filter((x) => !anchorsA.has(x)),
  ].sort();

  const suspicious = similarityWithoutAnchors >= MAX_STRUCTURAL_SIMILARITY;
  return {
    a: a.key,
    b: b.key,
    similarity,
    similarityWithoutAnchors,
    distinctAnchors,
    suspicious,
    ...(suspicious
      ? {
          reason:
            `tolti i nomi propri e i numeri, i due testi coincidono al ` +
            `${Math.round(similarityWithoutAnchors * 100)}%: è lo stesso modello riempito due volte`,
        }
      : {}),
  };
}

/** Tutte le coppie sospette in un insieme di narrative. */
export function findSuspiciousPairs(
  narratives: readonly { key: string; text: string }[],
): SimilarityPair[] {
  const out: SimilarityPair[] = [];
  for (let i = 0; i < narratives.length; i++) {
    for (let j = i + 1; j < narratives.length; j++) {
      const pair = compareNarratives(narratives[i], narratives[j]);
      if (pair.suspicious) out.push(pair);
    }
  }
  return out.sort((x, y) => y.similarityWithoutAnchors - x.similarityWithoutAnchors);
}
