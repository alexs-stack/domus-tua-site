// FAQ italiane di /open-domus — fonte unica.
//
// Stessa architettura di app/lavora-con-noi/faq.ts, e per la stessa ragione: le domande
// servono a DUE consumatori — la sezione visibile (OpenDomusPageContent, locale `it`) e
// il JSON-LD FAQPage in page.tsx. Se divergessero, i motori leggerebbero risposte diverse
// da quelle in pagina, che è esattamente il tipo di markup che Google considera spam.
//
// PERCHÉ QUESTE MERITANO UN FAQPage PROPRIO. La regola del repo è che non esistano due
// dichiarazioni per lo stesso contenuto: i blocchi compatti in coda a /vendi e /acquista
// mostrano un sottoinsieme delle risposte di /domande-frequenti e infatti NON portano
// markup. Qui è diverso — queste quattro domande non compaiono in /domande-frequenti
// (verificate una per una): sono contenuto proprio, sul format esclusivo dell'agenzia,
// e rispondono a un pubblico che sta decidendo se l'Open Domus fa per la sua casa.
//
// Le altre quattro lingue restano inline nel dizionario del componente: il markup è solo
// in italiano, come tutti i metadata del sito (scelta SEO, mercato locale — docs/i18n.md).
//
// Regola per chi aggiunge una voce: solo domande la cui risposta l'agenzia controlla
// davvero. «Quanto ci mette a vendere» non va qui, e non va da nessuna parte: la FAQ
// generale rifiuta di promettere tempi, ed è il tratto più credibile del sito.

/** ID stabile: non cambiarlo mai. Serve a ritrovare una voce senza dipendere dal testo. */
export type OpenDomusFaqId = "durata" | "casa-libera" | "partecipanti" | "adatto";

export type FaqEntry = { id: OpenDomusFaqId; q: string; a: string };

export const faqIt: FaqEntry[] = [
  {
    id: "durata",
    q: "Quanto dura un Open Domus?",
    a: "In genere una giornata dedicata, con visite per appuntamento distribuite in fasce orarie. Concentrare l’interesse in poche ore crea slancio e comparabilità tra le proposte.",
  },
  {
    id: "casa-libera",
    q: "Devo lasciare libera la casa?",
    a: "No. Ci occupiamo noi della preparazione, dell’accoglienza e della gestione delle visite. A te chiediamo solo di fidarti del metodo: al resto pensiamo noi.",
  },
  {
    id: "partecipanti",
    q: "Chi partecipa alle visite?",
    a: "Solo acquirenti prequalificati e realmente interessati. Filtriamo a monte per proteggere la tua casa e il tuo tempo.",
  },
  {
    id: "adatto",
    q: "È adatto a qualsiasi immobile?",
    a: "Open Domus dà il meglio quando c’è una storia da raccontare. Ne parliamo insieme e ti diciamo con onestà se è il format giusto per te.",
  },
];
