// Proiezione PUBBLICA dei fatti d'area (Prompt 9): l'unico punto in cui un fatto verificato diventa
// citabile dall'assistente. Deterministica e conservativa — pubblica SOLO ciò che è:
//   • approvato (status "approved");                  • non scaduto (reviewBy nel futuro);
//   • senza conflitti di fonte non risolti;           • fattuale (guard soggettivo come rete finale).
// Localizzazione: si usa la traduzione APPROVATA per la lingua richiesta, altrimenti la copia
// canonica italiana (una traduzione non approvata non esce). Nessun campo interno nel risultato.

import { AREA_CATEGORY_ORDER } from "./categories";
import { isFactualText } from "./subjective";
import type {
  AreaFact,
  KnowledgeLocale,
  PublicAreaFact,
  PublicAreaProfile,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** true se il fatto è ancora FRESCO (reviewBy non superato). */
export function isFresh(fact: Pick<AreaFact, "reviewBy">, now: Date): boolean {
  const review = Date.parse(fact.reviewBy);
  return !Number.isNaN(review) && now.getTime() <= review;
}

/** true se il fatto è PUBBLICABILE: approvato, fresco, senza conflitti, fattuale. */
export function isPublishable(fact: AreaFact, now: Date): boolean {
  return (
    fact.status === "approved" &&
    isFresh(fact, now) &&
    fact.conflicts.length === 0 &&
    isFactualText(fact.text)
  );
}

/** Testo localizzato: traduzione APPROVATA per la lingua, altrimenti la canonica italiana. */
export function localizeFactText(fact: AreaFact, locale: KnowledgeLocale): string {
  if (locale === "it") return fact.text;
  const t = fact.translations.find((x) => x.locale === locale && x.approved);
  return t ? t.text : fact.text; // ripiego alla canonica: mai una traduzione non approvata
}

/**
 * true se esiste un testo APPROVATO nella lingua richiesta (italiano: sempre; altre lingue: solo con
 * traduzione approvata).
 *
 * AGGIORNA ADR-006. La regola originale faceva ripiego sulla canonica italiana anche per un
 * visitatore inglese: su una pagina per il resto tradotta uscivano paragrafi in italiano — veri, ma
 * con l'aria di un errore. Qui il fatto viene semplicemente OMESSO per quella lingua: se non ne resta
 * nessuno la sezione non compare. Coerente col principio del sistema: si mostra solo ciò che è
 * verificato PER QUEL CONTESTO. `localizeFactText` resta invariata (è ancora il modo giusto di
 * ottenere il testo una volta deciso che il fatto è mostrabile).
 */
export function hasApprovedText(fact: AreaFact, locale: KnowledgeLocale): boolean {
  if (locale === "it") return true;
  return fact.translations.some((t) => t.locale === locale && t.approved);
}

/**
 * Costruisce il profilo pubblico d'area per un comune: solo fatti pubblicabili, ordinati per
 * categoria, localizzati. `null` se non c'è nulla da mostrare (l'assistente lo dice).
 */
export function toPublicAreaProfile(
  facts: readonly AreaFact[],
  options: { now: Date; locale: KnowledgeLocale; municipality: string; zone?: string },
): PublicAreaProfile | null {
  const usable = facts
    .filter((f) => f.municipality === options.municipality && isPublishable(f, options.now))
    // SCOPE: un fatto di ZONA riguarda quella zona, non tutto il comune. Senza una zona richiesta
    // viene ESCLUSO — mostrarlo a ogni annuncio del comune significherebbe attribuire a un immobile
    // i fatti di un'altra frazione. I fatti comunali/regionali valgono per tutti.
    .filter((f) => (f.scope === "zone" ? options.zone !== undefined && f.zone === options.zone : true))
    // LINGUA: per le lingue diverse dall'italiano si tengono SOLO i fatti con traduzione approvata.
    // Vedi `hasApprovedText`: meglio non mostrare nulla che mostrare un paragrafo italiano dentro
    // una pagina tradotta (aggiornamento ad ADR-006, documentato lì).
    .filter((f) => hasApprovedText(f, options.locale))
    .sort((a, b) => {
      // Più SPECIFICO prima: un fatto della zona dell'immobile viene prima di uno comunale.
      const sa = a.scope === "zone" ? 0 : 1;
      const sb = b.scope === "zone" ? 0 : 1;
      if (sa !== sb) return sa - sb;
      const ca = AREA_CATEGORY_ORDER.indexOf(a.category);
      const cb = AREA_CATEGORY_ORDER.indexOf(b.category);
      if (ca !== cb) return ca - cb;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
  if (usable.length === 0) return null;

  const publicFacts: PublicAreaFact[] = usable.map((f) => ({
    category: f.category,
    scope: f.scope,
    text: localizeFactText(f, options.locale),
    sourceOwner: f.source.owner,
    sourceUrl: f.source.url,
    reviewedAt: f.source.retrievedAt,
  }));
  return { municipality: options.municipality, facts: publicFacts };
}

/** Fatti in scadenza di revisione entro `withinDays` (promemoria per l'editor). */
export function factsDueForReview(facts: readonly AreaFact[], now: Date, withinDays = 30): AreaFact[] {
  const horizon = now.getTime() + withinDays * DAY_MS;
  return facts
    .filter((f) => f.status === "approved")
    .filter((f) => {
      const review = Date.parse(f.reviewBy);
      return !Number.isNaN(review) && review <= horizon;
    })
    .sort((a, b) => (a.reviewBy < b.reviewBy ? -1 : 1));
}
