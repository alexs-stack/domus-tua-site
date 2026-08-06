// FAQ italiane di /lavora-con-noi — fonte unica.
//
// Stanno qui, e non dentro il dizionario del contenuto, perché servono a TRE
// consumatori: la sezione visibile (LavoraConNoiContent, locale `it`), il JSON-LD
// FAQPage in page.tsx, e la knowledge base dell'assistente, che le promuove a voci
// verificate con `fromCareersFaq` senza ricopiarne il testo. Se divergessero, i motori
// leggerebbero risposte diverse da quelle in pagina — che è esattamente il tipo di
// markup che Google considera spam — e l'assistente ne direbbe una terza.
//
// Le altre lingue restano inline nel dizionario: il markup è solo in italiano,
// come tutti i metadata del sito (scelta SEO, mercato locale — vedi docs/i18n.md).
//
// Regola per chi aggiunge una voce: solo domande la cui risposta è verificabile
// guardando il sito (come si candida, cosa succede ai dati, dove si lavora). Le
// domande su contratti, compensi o tempi di risposta le risponde l'agenzia.

import { site } from "../lib/site";

/** ID stabile: non cambiarlo mai. La knowledge base dell'assistente vi fa riferimento. */
export type CareersFaqId = "candidatura-spontanea" | "curriculum" | "dati" | "sede-lavoro";

export type FaqEntry = { id: CareersFaqId; q: string; a: string };

export const faqIt: FaqEntry[] = [
  {
    id: "candidatura-spontanea",
    q: "Posso candidarmi anche se non c’è una posizione aperta?",
    a: "Sì, questa pagina serve proprio a questo. Le candidature restano a disposizione del team e le riprendiamo quando si apre una posizione.",
  },
  {
    id: "curriculum",
    q: "Come vi mando il curriculum?",
    a: `Il sito non riceve allegati. Nel form puoi lasciare un link al tuo profilo o al CV online, oppure inviarcelo per email a ${site.email.label}.`,
  },
  {
    id: "dati",
    q: "Che fine fanno i miei dati?",
    a: "Li usiamo solo per valutare la tua candidatura e per ricontattarti. I dettagli sono nell’informativa privacy, linkata sotto al form.",
  },
  {
    id: "sede-lavoro",
    q: "Dove si lavora?",
    a: `In sede, in ${site.address.street} a Tradate. Il lavoro però è sul territorio: Tradate e la provincia di ${site.address.province}.`,
  },
];
