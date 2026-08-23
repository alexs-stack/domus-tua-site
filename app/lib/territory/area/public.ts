// Proiezione PUBBLICA dei fatti d'area (Prompt 9): l'unico punto in cui un fatto verificato diventa
// citabile dall'assistente. Deterministica e conservativa — pubblica SOLO ciò che è:
//   • approvato (status "approved");                  • non scaduto (reviewBy nel futuro);
//   • senza conflitti di fonte non risolti;           • fattuale (guard soggettivo come rete finale).
// Localizzazione: si usa la traduzione APPROVATA per la lingua richiesta, altrimenti la copia
// canonica italiana (una traduzione non approvata non esce). Nessun campo interno nel risultato.

import { AREA_CATEGORY_ORDER } from "./categories";
import { areaSlug } from "./identity";
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
 * Costruisce il profilo pubblico d'area per un comune: solo fatti pubblicabili, ordinati per
 * categoria, localizzati. `null` se non c'è nulla da mostrare (l'assistente lo dice).
 */
export function toPublicAreaProfile(
  facts: readonly AreaFact[],
  options: { now: Date; locale: KnowledgeLocale; municipality: string },
): PublicAreaProfile | null {
  // CONFRONTO PER CHIAVE, non per stringa mostrata. Prima qui c'era `f.municipality === options
  // .municipality`, cioè un'uguaglianza esatta fra due testi liberi: il chiamante passava
  // "tradate" (già normalizzato) e il fatto conteneva "Tradate", quindi il filtro non poteva
  // combaciare MAI. Non se n'era accorto nessuno solo perché il dataset dei fatti è ancora vuoto.
  // `areaSlug` è la stessa regola usata per costruire le chiavi d'area: "Tradate", "tradate" e
  // "Tradate (VA)" collassano sulla stessa area, come devono.
  const wanted = areaSlug(options.municipality);
  const usable = facts
    .filter((f) => areaSlug(f.municipality) === wanted && isPublishable(f, options.now))
    .sort((a, b) => {
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
  // L'etichetta mostrata viene dal DATO ("Tradate"), non dalla chiave di ricerca ("tradate"):
  // il chiamante può cercare con una chiave, ma il pubblico deve leggere un nome scritto bene.
  return { municipality: usable[0].municipality, facts: publicFacts };
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
