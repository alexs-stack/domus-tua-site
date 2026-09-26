// FAQ italiane di /lavora-con-noi — fonte unica.
//
// Stanno qui, e non dentro il dizionario del contenuto, perché servono a DUE
// consumatori: la sezione visibile (LavoraConNoiContent, locale `it`) e il JSON-LD
// FAQPage in page.tsx. Se divergessero, i motori leggerebbero risposte diverse da
// quelle in pagina — che è esattamente il tipo di markup che Google considera spam.
//
// Le altre lingue restano inline nel dizionario: il markup è solo in italiano,
// come tutti i metadata del sito (scelta SEO, mercato locale — vedi docs/i18n.md).
//
// Regola per chi aggiunge una voce: solo domande la cui risposta è verificabile
// guardando il sito (come si candida, cosa succede ai dati, dove si lavora). Le
// domande su contratti, compensi o tempi di risposta le risponde l'agenzia.

import { site } from "../lib/site";

export type FaqEntry = { q: string; a: string };

export const faqIt: FaqEntry[] = [
  {
    q: "Posso candidarmi anche se non c’è una posizione aperta?",
    a: "Sì, questa pagina serve proprio a questo. Le candidature restano a disposizione del team e le riprendiamo quando si apre una posizione.",
  },
  {
    q: "Come vi mando il curriculum?",
    a: `Il sito non riceve allegati. Nel form puoi lasciare un link al tuo profilo o al CV online, oppure inviarcelo per email a ${site.email.label}.`,
  },
  {
    q: "Che fine fanno i miei dati?",
    a: "Li usiamo solo per valutare la tua candidatura e per ricontattarti. I dettagli sono nell’informativa privacy, linkata sotto al form.",
  },
  {
    q: "Dove si lavora?",
    a: `In sede, in ${site.address.street} a Tradate. Il lavoro però è sul territorio: Tradate e la provincia di ${site.address.province}.`,
  },
];
