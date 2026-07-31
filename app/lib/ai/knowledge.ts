// Conoscenza VERIFICATA di Domus Tua + system prompt dell'assistente.
//
// Corpus piccolo e curato: sta nel prompt, nessun vector DB. Gli immobili NON sono qui —
// l'assistente li trova a runtime con lo strumento search_listings, sui dati live RealSmart.
//
// Regola che questo file esiste per far rispettare: **l'assistente può spiegare solo ciò che
// è qui dentro**. Ogni voce è una scheda con una fonte dichiarata. Se un tema non è nel
// corpus, `retrieveVerifiedKnowledge` risponde che non c'è materiale verificato — e
// l'assistente deve dirlo, non improvvisare.

import { site, siteUrl } from "../site";
import type { Locale } from "../i18n/dictionaries";

const LANG: Record<string, string> = {
  it: "italiano",
  en: "English",
  fr: "français",
  de: "Deutsch",
  es: "español",
};

/** Una scheda di conoscenza verificata. `source` dice da dove viene il contenuto. */
export type KnowledgeEntry = {
  /** Chiave stabile richiesta dallo strumento retrieve_verified_knowledge. */
  topic: string;
  /** Sinonimi che il modello potrebbe usare al posto della chiave. */
  aliases: string[];
  text: string;
  source: string;
};

/**
 * Corpus verificato. Fonti: sito ufficiale domustua.com, Registro Imprese, dati di contatto
 * in app/lib/site.ts. Aggiungere una voce = dichiarare anche da dove viene.
 */
export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    topic: "agenzia",
    aliases: ["chi siete", "chi e domus tua", "storia", "azienda", "about"],
    text: `Domus Tua Immobiliare (Domus Tua srl) è un'agenzia immobiliare indipendente di Tradate, in provincia di Varese, attiva dal ${site.since}. È a guida femminile, fondata da Raffaela Rizza. Opera a Tradate, in provincia di Varese e nei dintorni.`,
    source: "domustua.com + Registro Imprese",
  },
  {
    topic: "contatti",
    aliases: ["telefono", "email", "whatsapp", "indirizzo", "dove siete", "sede"],
    text: `Telefono ${site.phone.label}. WhatsApp ${site.whatsapp.label}. Email ${site.email.label}. Sede: ${site.address.street}, ${site.address.city} (${site.address.province}).`,
    source: "domustua.com/contatti",
  },
  {
    topic: "orari",
    aliases: ["quando siete aperti", "apertura", "orario"],
    text: `Da lunedì a venerdì ${site.hours.weekdays}. Sabato ${site.hours.saturday}. Domenica chiuso.`,
    source: "domustua.com/contatti",
  },
  {
    topic: "recensioni",
    aliases: ["opinioni", "valutazione google", "google", "feedback"],
    text: `Valutazione ${site.rating}/5 su Google, su circa ${site.reviewsCount} recensioni verificate tramite Trustindex.`,
    source: "Google / Trustindex",
  },
  {
    topic: "domus-doc",
    aliases: ["doc", "domus d.o.c.", "casa di origine certificata", "certificazione"],
    text: `Domus D.O.C. ("casa di origine certificata") è il protocollo proprietario dell'agenzia: prima della vendita si verificano origine e conformità dell'immobile — conformità catastale e urbanistica, impianti e APE, provenienza, ipoteche e gravami, documentazione pronta per il notaio — e poi lo si valorizza con il pacchetto completo di servizi. Chi compra non trova sorprese; chi vende arriva alla trattativa con una posizione più solida.`,
    source: "domustua.com — pagina Metodo",
  },
  {
    topic: "servizi",
    aliases: ["pacchetto", "cosa fate", "cosa offrite"],
    text: `Il pacchetto comprende sei servizi: servizi tecnico-amministrativi e legali; rendering e virtual rendering; home staging; emotional video real estate; contenuti e campagne marketing; Open Domus.`,
    source: "domustua.com — pagina Servizi",
  },
  {
    topic: "open-domus",
    aliases: ["open house", "porte aperte", "visite"],
    text: `Open Domus è l'evoluzione dell'open house: visite organizzate e selezionate, acquirenti pre-qualificati, assistenza dedicata sia al venditore sia a chi visita.`,
    source: "domustua.com — pagina Open Domus",
  },
  {
    topic: "metodo-vendita",
    aliases: ["come vendete", "metodo", "processo", "vendere casa", "fasi"],
    text: `Il metodo di vendita ha cinque fasi: intervista analitica; valutazione e certificazione D.O.C.; marketing (foto, video emozionale, home staging, campagne); sistema Open Domus; multi-proposta per vendere al prezzo concordato. La valutazione è gratuita e senza impegno, e non ci sono costi anticipati.`,
    source: "domustua.com — pagina Vendi",
  },
  {
    topic: "valutazione",
    aliases: ["quanto vale casa mia", "stima", "perizia", "quotazione"],
    text: `La valutazione dell'immobile è gratuita e senza impegno. Si concorda un sopralluogo e l'agenzia la elabora sui dati reali dell'immobile e del mercato locale. Nessun costo anticipato.`,
    source: "domustua.com — pagina Vendi",
  },
];

/** Risultato della ricerca nel corpus: o una scheda verificata, o un "non lo sappiamo". */
export type KnowledgeLookup =
  | { found: true; topic: string; text: string; source: string }
  | { found: false; available: string[] };

function fold(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

/**
 * Cerca un tema nel corpus VERIFICATO.
 *
 * Non ha un ramo "risposta generica": se il tema non c'è, torna `found: false` con l'elenco
 * dei temi disponibili. È così che l'assistente sa di dover dire "non lo so" invece di
 * riempire il vuoto.
 */
export function retrieveVerifiedKnowledge(topic: string): KnowledgeLookup {
  const needle = fold(topic);
  const available = KNOWLEDGE.map((k) => k.topic);
  if (!needle) return { found: false, available };

  const hit =
    KNOWLEDGE.find((k) => fold(k.topic) === needle) ??
    KNOWLEDGE.find((k) => k.aliases.some((a) => fold(a) === needle)) ??
    KNOWLEDGE.find(
      (k) => fold(k.topic).includes(needle) || k.aliases.some((a) => fold(a).includes(needle)),
    );

  if (!hit) return { found: false, available };
  return { found: true, topic: hit.topic, text: hit.text, source: hit.source };
}

/** System prompt dell'assistente. `locale` = lingua di default del sito corrente. */
export function buildAssistantSystem(locale: Locale): string {
  const lang = LANG[locale] || "italiano";
  return [
    "Sei l'assistente virtuale di Domus Tua Immobiliare. Aiuti chi visita il sito a trovare casa, a vendere e a capire come lavora l'agenzia.",
    `Rispondi SEMPRE nella lingua dell'utente. Se non è chiara, usa ${lang}.`,
    "Tono: caldo, umano, professionale, sintetico. Frasi brevi. Di norma 2-5 frasi.",
    "Rispondi SEMPRE in testo semplice: niente markdown, niente ** per il grassetto, niente titoli con #, niente elenchi con '- ' o '* '. Per separare i concetti usa paragrafi.",
    "",
    "STRUMENTI — usali, non tirare a indovinare:",
    "- search_listings: per trovare o filtrare immobili. SEMPRE, ogni volta che si parla di case da comprare o affittare.",
    "- get_listing_details: per i dettagli di un immobile già trovato (usa lo slug che ti ha dato la ricerca).",
    "- retrieve_verified_knowledge: per qualunque domanda sull'agenzia, il metodo, i servizi, Domus D.O.C., Open Domus, orari, contatti, valutazione.",
    "- prepare_whatsapp_handoff / prepare_email_handoff: quando la persona vuole parlare con qualcuno, prenotare una visita o chiedere una valutazione.",
    "",
    "REGOLE NON NEGOZIABILI:",
    "- Non inventare MAI immobili, prezzi, indirizzi, metrature o disponibilità. Puoi citare solo ciò che gli strumenti restituiscono.",
    "- Non presentare mai come disponibile un immobile venduto. Gli strumenti restituiscono solo immobili disponibili: non aggiungerne altri a memoria.",
    "- Se retrieve_verified_knowledge dice che un tema non è nel materiale verificato, dillo con onestà e proponi di parlare col team. Non colmare il vuoto con conoscenza generica.",
    "- Non garantire tempi di vendita, prezzi di realizzo o risultati. Il metodo si può descrivere; il risultato no.",
    "- Niente consulenza legale, fiscale, notarile o finanziaria definitiva. Puoi spiegare in generale come funziona il processo, poi rimanda ai tecnici dell'agenzia.",
    "- Non dichiarare mai di aver inviato un messaggio o una email: gli strumenti di contatto PREPARANO il collegamento, è la persona che lo apre.",
    "",
    "COME RISPONDERE:",
    "- Se la richiesta è ambigua fai UNA sola domanda di chiarimento, poi cerca.",
    "- Mostra al massimo 3-4 immobili. Cita due o tre titoli in modo naturale e di' che le schede complete sono qui sotto: il sito le mostra da solo. Non incollare URL grezzi.",
    "- Se la ricerca non trova nulla: dillo, proponi UN allargamento sensato (per esempio un comune vicino o un budget leggermente più alto) e offri il contatto umano.",
    `- Il sito è ${siteUrl}. Il form contatti è nella pagina Contatti.`,
  ].join("\n");
}
