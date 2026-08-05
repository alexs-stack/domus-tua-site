// Lessici CHIUSI per la formattazione delle descrizioni immobiliari.
//
// Sono elenchi finiti e revisionabili a mano, non euristiche aperte: chi legge questo file
// sa esattamente quali parole possono cambiare la resa di un annuncio. Nessuna voce qui
// aggiunge, toglie o riscrive testo — decide solo COME viene composto quello che c'è già.
//
// Regola d'oro: se una voce fosse ambigua, si preferisce NON aggiungerla. Un annuncio
// formattato in modo neutro è sempre meglio di un annuncio formattato male.

/**
 * Indizi di ATMOSFERA: un paragrafo che ne contiene almeno due (e nessuna misura) è
 * scritto per far immaginare, non per informare. Va in corsivo, come un a-parte.
 */
export const ATMOSPHERE_CUES: readonly RegExp[] = [
  /\bimmagin(?:a|ate|are|atevi|iamo)\b/i,
  /\bsogn(?:a|ate|are|i)\b/i,
  /\bsvegli(?:arti|arvi|arsi|are)\b/i,
  /\brisveglio\b/i,
  /\bin primavera\b/i,
  /\bin estate\b/i,
  /\bin autunno\b/i,
  /\bin inverno\b/i,
  /\bal mattino\b/i,
  /\bla sera\b/i,
  /\ble sere\b/i,
  /\btramonto\b/i,
  /\balba\b/i,
  /\bprofumo\b/i,
  /\bsilenzio\b/i,
  /\bcolazione\b/i,
  /\brifugio\b/i,
  /\bricordi\b/i,
  /\bemozion(?:a|are|ante|arti)\w*\b/i,
  /\babbracci(?:a|are|ano)\b/i,
  /\bmomenti di relax\b/i,
];

/**
 * Indizi di CHIAMATA ALL'AZIONE: chiudono l'annuncio invitando a muoversi.
 * Solo l'ULTIMO paragrafo (o la sua ultima frase) può diventare un blocco di chiusura.
 */
export const CLOSING_CUES: readonly RegExp[] = [
  /\bprenot(?:a|ate|are)\b/i,
  /\bcontatta(?:ci|teci)\b/i,
  /\bchiama(?:ci|teci)\b/i,
  /\bfiss(?:a|ate)\b(?=[^.!?]*\b(?:visita|appuntamento|sopralluogo)\b)/i,
  /\bscopri(?:la|lo)?\s+di persona\b/i,
  /\bvieni a (?:vederla|visitarla|scoprirla|vederlo|visitarlo)\b/i,
  /\bvenite a (?:vederla|visitarla|scoprirla|vederlo|visitarlo)\b/i,
  /\b(?:ti|vi) aspettiamo\b/i,
  /\brichiedi (?:una|la) visita\b/i,
  /\bnon lasciare che\b/i,
  /\bnon farti scappare\b/i,
  /\bscrivici\b/i,
];

/**
 * Attacchi di ELENCO: introducono una sequenza di caratteristiche separate da virgole.
 * Solo dopo uno di questi attacchi una frase può diventare un elenco puntato — mai
 * per il semplice fatto di contenere delle virgole.
 */
// NB: il confine iniziale è un lookbehind Unicode, non `\b`. In JavaScript `\b` ragiona
// solo su [A-Za-z0-9_]: davanti a "è dotata di" il confine cadrebbe SEMPRE, e l'attacco
// più frequente degli annunci italiani non verrebbe mai riconosciuto.
export const ENUM_LEAD_INS =
  /(?<!\p{L})(?:è dotat[oa] di|sono dotat[ei] di|si compone di|è compost[oa] d[ai]|sono compost[ei] d[ai]|comprende|completa(?:no)? (?:il piano|la proprietà|l'immobile|l’immobile|la casa|la villa|l'appartamento|l’appartamento)|dispone di|include)\s+/iu;

/**
 * PUNTI DI FORZA che meritano il grassetto — in ordine di priorità.
 *
 * I primi due gruppi sono dati misurabili già scritti nel testo (superfici, classe
 * energetica): evidenziarli non aggiunge una promessa, mette a fuoco un fatto.
 * Il terzo gruppo è un elenco chiuso di dotazioni ad alto valore, sempre inequivocabili.
 */
export const HIGHLIGHTS: readonly { priority: number; re: RegExp }[] = [
  // Superfici: "circa 176 mq", "di ben 60mq", "oltre 1200 m²".
  // Il confine finale è una lookahead, non `\b`: dopo "²" (carattere non-word) un `\b`
  // non scatta mai, e "45 m²" resterebbe senza evidenza mentre "45 mq" ce l'avrebbe.
  {
    priority: 0,
    re: /\b(?:circa |oltre |ben )?\d{1,5}(?:[.,]\d{1,2})?\s?(?:mq|m²|m2)(?![\p{L}\p{N}])/iu,
  },
  // Classe energetica. Due forme distinte, ed è una distinzione che serve davvero:
  // con "energetica" la lettera può essere minuscola; senza, DEVE essere maiuscola e non
  // può essere seguita da una minuscola — altrimenti "un tocco di classe a ogni stanza"
  // verrebbe letto come «classe A».
  // (niente flag `i`: la distinzione maiuscola/minuscola della LETTERA è tutto il punto,
  // quindi l'insensibilità vale solo sulle due parole iniziali, scritte a mano.)
  { priority: 0, re: /\b[Cc]lasse [Ee]nergetica [A-Ga-g](?:\+|[1-4])?\b/ },
  { priority: 0, re: /\b[Cc]lasse [A-G](?:\+|[1-4])?\b(?!\p{Ll})/u },
  // Dotazioni: elenco chiuso, frasi lunghe prima delle corte (il primo match vince).
  { priority: 1, re: /\briscaldamento a pavimento\b/i },
  { priority: 1, re: /\bimpianto fotovoltaico\b/i },
  { priority: 1, re: /\bpompa di calore\b/i },
  { priority: 1, re: /\bcappotto termico\b/i },
  { priority: 1, re: /\bvista panoramica\b/i },
  { priority: 1, re: /\btripla esposizione\b/i },
  { priority: 1, re: /\bdoppia esposizione\b/i },
  { priority: 1, re: /\bgiardino privato\b/i },
  { priority: 1, re: /\briscaldamento autonomo\b/i },
  { priority: 1, re: /\baria condizionata\b/i },
  { priority: 1, re: /\bdoppi servizi\b/i },
  { priority: 1, re: /\bdue autorimesse\b/i },
  { priority: 1, re: /\bdoppio box\b/i },
  { priority: 1, re: /\bfotovoltaico\b/i },
  { priority: 1, re: /\bascensore\b/i },
  { priority: 1, re: /\bpiscina\b/i },
  { priority: 1, re: /\btaverna\b/i },
  { priority: 1, re: /\bmansarda\b/i },
];

/**
 * Abbreviazioni che finiscono con un punto senza chiudere la frase.
 * Servono a non spezzare "ecc. Il resto…" a metà periodo.
 */
export const ABBREVIATIONS: readonly string[] = [
  "ecc",
  "circa",
  "ca",
  "sig",
  "sig.ra",
  "dott",
  "dott.ssa",
  "arch",
  "ing",
  "geom",
  "avv",
  "rag",
  "es",
  "n",
  "nr",
  "mq",
  "p.zza",
  "v.le",
  "c.a",
  "art",
];
