// QUALITÀ EDITORIALE di un fatto d'area — deterministica, complementare al guard soggettivo.
//
// Distinzione importante: `subjective.ts` difende la VERITÀ (un giudizio non si pubblica, punto);
// questo file difende l'UTILITÀ e la VOCE. Un fatto può essere verissimo, sourced e inutile:
// «Il territorio comunale è attraversato dalla ex strada statale 233» è vero e non dice niente a
// chi sta comprando casa. Oppure può essere scritto in burocratese — «hanno sede gli sportelli
// anagrafici» — che è esattamente il registro che le regole di voce del sito vietano.
//
// Perciò questi NON sono blocker: sono SUGGERIMENTI per il revisore. La verità blocca, lo stile
// consiglia. Compaiono nel pacchetto di review accanto al fatto, così chi approva vede subito
// cosa migliorare senza doverlo intuire.

/** Gergo burocratico → come lo direbbe una persona. Le chiavi sono in minuscolo. */
const BUROCRATESE: Array<{ pattern: RegExp; suggerimento: string }> = [
  { pattern: /\bhanno sede\b|\bha sede\b/i, suggerimento: "«ha sede» → «si trova», «è in»" },
  { pattern: /\bsportell[oi]\b/i, suggerimento: "«sportelli» → «uffici», oppure di' cosa ci si fa" },
  { pattern: /\bè ubicat[oa]\b|\brisulta ubicat[oa]\b/i, suggerimento: "«è ubicato» → «si trova»" },
  { pattern: /\bai sensi d[ei]\b/i, suggerimento: "«ai sensi di» → togli il rimando normativo" },
  { pattern: /\bsi provvede\b|\bviene effettuat[oa]\b|\bè stato istituit[oa]\b/i, suggerimento: "forma impersonale → di' chi fa cosa" },
  { pattern: /\bin oggetto\b|\bdi cui trattasi\b|\bpredett[oa]\b/i, suggerimento: "formula da atto amministrativo: togli" },
  { pattern: /\bsi segnala che\b|\bè importante segnalare\b|\bsi evidenzia che\b/i, suggerimento: "apertura vuota: parti dal fatto" },
  { pattern: /\busufruire\b/i, suggerimento: "«usufruire» → «usare»" },
  { pattern: /\bnonché\b|\bmedesim[oa]\b/i, suggerimento: "registro da circolare: semplifica" },
  // Il posto raccontato come in un atto invece che come lo vive chi ci abita. Passa i controlli
  // precedenti (ha nomi propri, non è gergo) ed è comunque la frase meno utile della pagina:
  // «Il territorio comunale è attraversato dalla ex statale 233» → «La Varesina attraversa Tradate».
  { pattern: /\bil territorio comunale\b|\bl'ente\b|\bl'amministrazione comunale\b|\bla cittadinanza\b/i,
    suggerimento: "registro da atto: nomina il posto e di' cosa cambia per chi ci vive" },
];

export type AreaQualityKind = "gergo" | "vago" | "lungo" | "apertura";

export interface AreaQualityHint {
  kind: AreaQualityKind;
  /** Cosa non va, in una riga. */
  message: string;
  /** Il frammento che l'ha fatto scattare, quando esiste. */
  match?: string;
}

/** Lunghezza oltre la quale una frase singola diventa faticosa in pagina. */
const MAX_CHARS = 200;

/**
 * Un fatto è ANCORATO se contiene almeno un elemento verificabile e concreto: un numero (linea,
 * ettari, orario) oppure un nome proprio (un ente, una linea, un luogo). Senza ancore è una frase
 * generica — vera magari, ma che non aiuta a decidere e non si può nemmeno verificare bene.
 */
function haAncora(testo: string): boolean {
  if (/\d/.test(testo)) return true;
  // Nome proprio: una maiuscola non a inizio frase (esclusi i mesi/articoli comuni a inizio).
  const parole = testo.split(/\s+/).slice(1);
  return parole.some((p) => /^[«"']?\p{Lu}\p{L}+/u.test(p));
}

/**
 * Suggerimenti di qualità per il testo di un fatto d'area. Vuoto = niente da segnalare.
 * Deterministico: stesso testo → stessi suggerimenti.
 */
export function areaQualityHints(testo: string): AreaQualityHint[] {
  const hints: AreaQualityHint[] = [];
  const pulito = testo.trim();

  for (const { pattern, suggerimento } of BUROCRATESE) {
    const m = pulito.match(pattern);
    if (m) hints.push({ kind: /segnala|importante|evidenzia/.test(pattern.source) ? "apertura" : "gergo", message: suggerimento, match: m[0] });
  }

  if (!haAncora(pulito)) {
    hints.push({
      kind: "vago",
      message: "nessun dato concreto (numero o nome proprio): dice poco a chi deve decidere",
    });
  }

  if (pulito.length > MAX_CHARS) {
    hints.push({ kind: "lungo", message: `${pulito.length} caratteri: spezza in due frasi (max ${MAX_CHARS})` });
  }

  return hints;
}

/** true se il testo non ha alcun suggerimento aperto: pronto per la pubblicazione anche nella forma. */
export function isWellWritten(testo: string): boolean {
  return areaQualityHints(testo).length === 0;
}
