// Guard DETERMINISTICO contro le affermazioni SOGGETTIVE nei fatti d'area (Prompt 9).
//
// Un fatto d'area deve essere FATTUALE e verificabile. Questo controllo blocca (in approvazione e
// come rete di sicurezza in pubblicazione) il linguaggio valutativo o sensibile: sicurezza,
// prestigio, "migliore", demografia/classi protette, garanzie d'investimento, previsioni di prezzo,
// idoneità a un gruppo. Non è un modello: sono regole pure e testabili. In caso di dubbio, BLOCCA:
// un fatto sensibile va riscritto in forma neutra o rifiutato.

export type SubjectiveCategory =
  | "safety"
  | "prestige"
  | "superlative"
  | "demographic"
  | "investment"
  | "suitability";

export interface SubjectiveViolation {
  category: SubjectiveCategory;
  /** Frammento che ha fatto scattare la regola (per il report editoriale). */
  match: string;
}

// Pattern in italiano (copia canonica) + qualche termine inglese per le traduzioni. Case-insensitive.
const RULES: Array<{ category: SubjectiveCategory; re: RegExp }> = [
  { category: "safety", re: /\b(sicur\w*|insicur\w*|pericolos\w*|criminalit\w*|malfamat\w*|degrad\w*|safe|unsafe|crime)\b/i },
  { category: "prestige", re: /\b(prestigios\w*|esclusiv\w*|rinomat\w*|chic|elegante|signorile|blasonat\w*|prestigious|upscale)\b/i },
  { category: "superlative", re: /\b(miglior\w*|peggior\w*|eccellent\w*|il più bell\w*|imbattibil\w*|top|best|worst)\b/i },
  { category: "demographic", re: /\b(ricc\w*|povert\w*|povera|famiglie bene|stranier\w*|immigrat\w*|etnic\w*|religios\w*|ceto\b|classe sociale|wealthy|poor neighborhood)\b/i },
  { category: "investment", re: /\b(investiment\w*|rivalutazion\w*|il valore (cresce|crescer\w*|aumenter\w*)|prezzi in (aumento|crescita)|affar[ei]\b|occasione d'oro|appreciat\w*)\b/i },
  { category: "suitability", re: /\b(ideale per|perfett\w* per|adatt\w* (a|per) (famiglie|anziani|giovani|single|pensionati)|ideal for|perfect for)\b/i },
];

/** Ritorna le violazioni soggettive trovate nel testo (vuoto = fattuale/neutro). */
export function findSubjectiveViolations(text: string): SubjectiveViolation[] {
  const out: SubjectiveViolation[] = [];
  for (const { category, re } of RULES) {
    const m = text.match(re);
    if (m) out.push({ category, match: m[0] });
  }
  return out;
}

/** true se il testo è fattuale/neutro (nessuna violazione). */
export function isFactualText(text: string): boolean {
  return findSubjectiveViolations(text).length === 0;
}
