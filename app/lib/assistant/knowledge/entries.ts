// Corpus di conoscenza dell'agenzia — versionato e tracciabile.
//
// REGOLA UNICA: solo le voci `verified` finiscono nelle risposte. Le `pending` esistono per
// tracciare cosa manca, le `disabled` per ricordare cosa è stato tolto e perché. Su un tema
// non verificato l'assistente dice che non lo sa e propone il team: è il comportamento
// voluto, non una mancanza da tappare improvvisando.
//
// Gli immobili NON stanno qui: arrivano live da RealSmart tramite i tool dedicati.
// Duplicarli in questo file significherebbe avere due verità che divergono.
//
// Come si aggiunge o si approva una voce: docs/assistant-knowledge.md.

import { site } from "../../site";
import { LEAD_EMAIL_TO } from "../config";

export type KnowledgeStatus = "verified" | "pending" | "disabled";

/** Le dodici aree di conoscenza previste dal programma. */
export type KnowledgeCategory =
  | "identita"
  | "contatti"
  | "orari"
  | "area"
  | "metodo"
  | "domus-doc"
  | "open-domus"
  | "acquisto"
  | "vendita"
  | "valutazione"
  | "appuntamenti"
  | "proposte"
  | "faq"
  | "limiti";

export interface KnowledgeEntry {
  /** ID stabile: non cambiarlo mai, test e log vi fanno riferimento. */
  id: string;
  category: KnowledgeCategory;
  /** Titolo breve, usato nel retrieval lessicale. */
  title: string;
  /** Testo utilizzabile nelle risposte. Vuoto finché lo stato non è `verified`. */
  content: string;
  status: KnowledgeStatus;
  /** Da dove viene il contenuto (documento, pagina, persona). Mai vuoto. */
  source: string;
  /** Data ISO dell'ultima verifica. Vuota se non ancora verificata. */
  lastVerified: string;
  /** Lingua del contenuto. Al lancio: solo italiano. */
  locale: "it";
  /** Termini aggiuntivi per il match lessicale (sinonimi, modi di dire). */
  keywords: string[];
  /** Perché una voce è `pending` o `disabled`: serve a chi dovrà sbloccarla. */
  note?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATE — l'unica conoscenza che l'assistente può usare oggi.
// Ogni voce cita una fonte controllabile. Niente che derivi da copy di marketing
// non approvato, niente numeri che cambiano nel tempo.
// ─────────────────────────────────────────────────────────────────────────────

const VERIFIED: KnowledgeEntry[] = [
  {
    id: "identita-agenzia",
    category: "identita",
    title: "Chi è Domus Tua",
    content: `Domus Tua Immobiliare (${site.legal}) è un'agenzia immobiliare di Tradate, in provincia di Varese, attiva dal ${site.since}. È un'agenzia a guida femminile. Sede: ${site.address.street}, ${site.address.city} (${site.address.province}).`,
    status: "verified",
    source: "Registro Imprese (P.IVA 03836560122, REA VA 382680) + sito ufficiale domustua.com",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["agenzia", "azienda", "societa", "sede", "storia", "anni", "fondata", "chi siete"],
  },
  {
    id: "identita-assistente",
    category: "identita",
    title: "Sono un assistente virtuale",
    content:
      "Sono l'assistente virtuale del sito di Domus Tua: un software, non una persona. Ti aiuto a cercare casa tra gli annunci dell'agenzia e a metterti in contatto con il team, che è fatto di persone vere.",
    status: "verified",
    source: "natura del servizio — verificabile per costruzione",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["assistente", "robot", "bot", "umano", "persona", "intelligenza artificiale", "sei vero"],
  },
  {
    id: "contatti-ufficiali",
    category: "contatti",
    title: "Recapiti dell'agenzia",
    content: `Telefono: ${site.phone.label}. WhatsApp: ${site.whatsapp.label}. Per le richieste scritte: ${LEAD_EMAIL_TO}. Sede: ${site.address.street}, ${site.address.city} (${site.address.province}).`,
    status: "verified",
    source: "sito ufficiale domustua.com/contatti + configurazione contatti del programma",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["telefono", "chiamare", "numero", "whatsapp", "email", "mail", "scrivere", "indirizzo", "recapiti", "dove siete"],
  },
  {
    id: "contatto-umano",
    category: "contatti",
    title: "Parlare con una persona",
    content:
      "Se preferisci parlare con una persona, puoi scrivere su WhatsApp o telefonare durante gli orari di apertura. In alternativa lasci una richiesta scritta e ti ricontatta il team.",
    status: "verified",
    source: "canali di contatto attivi del sito (WhatsApp, telefono, richiesta scritta)",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["parlare", "operatore", "agente", "consulente", "ricontattare", "richiamare", "appuntamento telefonico"],
  },
  {
    id: "orari-apertura",
    category: "orari",
    title: "Orari di apertura",
    content: `Dal lunedì al venerdì: ${site.hours.weekdays}. Sabato: ${site.hours.saturday}. Domenica chiuso.`,
    status: "verified",
    source: "sito ufficiale domustua.com/contatti",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["orari", "aperto", "chiuso", "sabato", "domenica", "pomeriggio", "mattina", "apertura", "chiusura"],
  },
  {
    id: "area-servita",
    category: "area",
    title: "Zona in cui operiamo",
    content:
      "Lavoriamo su Tradate e nei comuni vicini della provincia di Varese. Gli immobili che trovi sul sito sono quelli che seguiamo direttamente.",
    status: "verified",
    source: "catalogo immobili RealSmart (comuni effettivamente presenti nel feed)",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["zona", "comuni", "provincia", "varese", "tradate", "area", "territorio", "raggio", "coprite"],
  },
  {
    id: "limiti-assistente",
    category: "limiti",
    title: "Cosa non posso fare",
    content:
      "Non posso dare consulenza legale, fiscale, notarile, tecnica o finanziaria, non posso confermare la conformità urbanistica o catastale di un immobile, non posso fare valutazioni e non posso fissare appuntamenti da solo. Per tutto questo ti metto in contatto con il team.",
    status: "verified",
    source: "vincoli di programma dell'assistente (docs/assistant-architecture.md)",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["limiti", "legale", "fiscale", "notaio", "tasse", "mutuo", "conformita", "catastale", "urbanistica", "perizia", "consulenza"],
  },
  {
    id: "limiti-garanzie",
    category: "limiti",
    title: "Nessuna promessa su tempi e prezzi",
    content:
      "Non posso garantire tempi di vendita, prezzi finali o l'esito di una trattativa: dipendono dall'immobile, dal mercato e dalle persone coinvolte. Chi può parlartene con cognizione è il team.",
    status: "verified",
    source: "vincoli di programma dell'assistente (docs/assistant-architecture.md)",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["garanzia", "garantisci", "promessa", "sicuro", "tempi", "quanto ci vuole", "riuscite", "certezza"],
  },
  {
    id: "privacy-conversazione",
    category: "limiti",
    title: "Cosa succede a questa conversazione",
    content:
      "Questa conversazione non viene salvata: resta nel tuo browser finché la pagina è aperta e non viene conservata dall'agenzia. Se lasci una richiesta, i dati che scrivi servono solo a ricontattarti.",
    status: "verified",
    source: "implementazione: nessuna persistenza lato server (app/api/assistant/route.ts)",
    lastVerified: "2026-07-31",
    locale: "it",
    keywords: ["privacy", "dati", "conservate", "salvate", "registrate", "gdpr", "cancellare", "trattamento"],
  },
  {
    id: "lavora-con-noi",
    category: "faq",
    title: "Candidarsi per lavorare in Domus Tua",
    // Solo il MECCANISMO, che è verificabile perché è come funziona il sito:
    // dove si manda una candidatura e come. Niente posizioni aperte, requisiti,
    // contratti o tempi di risposta: quelli li dice l'agenzia, non l'assistente.
    content:
      "Chi vuole lavorare con Domus Tua può candidarsi dalla pagina /lavora-con-noi: si sceglie l'area (consulenza immobiliare, front office e pratiche, home staging, contenuti e video, tirocinio) oppure si manda una candidatura spontanea. Il sito non riceve allegati: nel modulo si lascia un link al proprio profilo o CV online, oppure si scrive a " +
      `${site.email.label}. Non so quali posizioni siano aperte in questo momento: quello te lo dice il team.`,
    status: "verified",
    source: "pagina /lavora-con-noi del sito (form candidature, app/components/CareerApplication.tsx)",
    lastVerified: "2026-08-01",
    locale: "it",
    keywords: [
      "lavoro",
      "lavorare",
      "assunzioni",
      "assumete",
      "candidatura",
      "candidarmi",
      "curriculum",
      "cv",
      "posizioni aperte",
      "stage",
      "tirocinio",
      "colloquio",
      "carriera",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// IN ATTESA — testi che servono ma che il cliente non ha ancora approvato.
// Restano vuoti di proposito: un contenuto scritto da noi e messo qui diventerebbe
// indistinguibile da uno approvato. Elenco operativo in docs/assistant-knowledge.md.
// ─────────────────────────────────────────────────────────────────────────────

/** Costruisce una voce in attesa: contenuto vuoto, fonte = chi deve fornirla. */
function pending(
  id: string,
  category: KnowledgeCategory,
  title: string,
  keywords: string[],
  note: string,
): KnowledgeEntry {
  return {
    id,
    category,
    title,
    content: "",
    status: "pending",
    source: "da richiedere a Raffaela — vedi docs/assistant-knowledge.md",
    lastVerified: "",
    locale: "it",
    keywords,
    note,
  };
}

const PENDING: KnowledgeEntry[] = [
  pending("metodo-domus", "metodo", "Il Metodo Domus Tua", ["metodo", "come lavorate", "fasi", "percorso", "processo"],
    "Spiegazione ufficiale del Metodo: fasi, cosa comprende, cosa si aspetta il cliente."),
  pending("domus-doc", "domus-doc", "Domus D.O.C.", ["doc", "d.o.c.", "certificata", "origine", "documenti verificati"],
    "Definizione ufficiale del protocollo e cosa viene effettivamente verificato."),
  pending("open-domus", "open-domus", "Open Domus", ["open domus", "open house", "porte aperte", "visite collettive"],
    "Come funziona, chi può partecipare, come ci si iscrive."),
  pending("processo-vendita", "vendita", "Come si vende casa con Domus Tua", ["vendere", "vendita", "incarico", "mandato", "da dove comincio"],
    "Passi dal primo contatto all'incarico. Include costi e condizioni se comunicabili."),
  pending("processo-acquisto", "acquisto", "Come si compra casa con Domus Tua", ["comprare", "acquisto", "acquistare", "primo passo"],
    "Passi dalla ricerca alla proposta, cosa fa l'agenzia per chi compra."),
  pending("valutazione-immobile", "valutazione", "Valutazione dell'immobile", ["valutazione", "quanto vale", "stima", "prezzo casa mia", "gratuita"],
    "Modalità, tempi, se è gratuita e senza impegno, chi la esegue."),
  pending("appuntamenti-visite", "appuntamenti", "Appuntamenti e visite", ["appuntamento", "visita", "vedere casa", "sopralluogo", "prenotare"],
    "Procedura per prenotare una visita e cosa serve portare."),
  pending("proposte-documenti", "proposte", "Proposta d'acquisto e documenti", ["proposta", "offerta", "caparra", "preliminare", "compromesso", "rogito"],
    "Spiegazione GENERALE della proposta, senza scendere in consulenza legale."),
  pending("trattativa-prezzo", "proposte", "Trattare sul prezzo", ["trattare", "sconto", "abbassare", "proposta piu bassa", "margine"],
    "Cosa si può dire su una proposta al ribasso senza impegnare l'agenzia."),
  pending("referente-casi-complessi", "contatti", "A chi rivolgersi per i casi complessi", ["referente", "responsabile", "titolare", "chi segue"],
    "Nome e ruolo della persona a cui rimandare i casi che l'assistente non copre."),
  pending("faq-generali", "faq", "Domande frequenti", ["faq", "domande frequenti"],
    "Elenco FAQ con risposte approvate. Ogni FAQ diventerà una voce con ID proprio."),
  pending("privacy-policy", "limiti", "Informativa privacy", ["privacy policy", "informativa", "gdpr"],
    "Informativa definitiva, per poterla citare e collegare."),
];

// ─────────────────────────────────────────────────────────────────────────────
// DISABILITATE — tolte di proposito. Restano qui perché il motivo non vada perso
// e nessuno le reintroduca per distrazione.
// ─────────────────────────────────────────────────────────────────────────────

const DISABLED: KnowledgeEntry[] = [
  {
    id: "reputazione-recensioni",
    category: "identita",
    title: "Recensioni e valutazione media",
    content: "",
    status: "disabled",
    source: "Trustindex / Google",
    lastVerified: "",
    locale: "it",
    keywords: ["recensioni", "stelle", "rating", "reputazione", "google"],
    note: "Dato VIVO: numero e media cambiano nel tempo. Scritto a mano nel prompt diventerebbe falso senza che nessuno se ne accorga. Se il cliente lo vuole nelle risposte, va letto da una fonte aggiornata, non da questo file.",
  },
  {
    id: "metriche-aziendali",
    category: "identita",
    title: "Numeri dell'agenzia (mq valutati, transazioni, % venduti)",
    content: "",
    status: "disabled",
    source: "componente Stats del sito — nessuna fonte documentata nel codice",
    lastVerified: "",
    locale: "it",
    keywords: ["quante case", "quanti immobili", "transazioni", "statistiche", "numeri", "percentuale"],
    note: "Metriche di volume (metratura valutata, persone servite, transazioni, percentuale di venduto) mai documentate dall'agenzia. Sono già state tolte dalle pagine; l'assistente non deve reintrodurle. Se il cliente fornisce i dati reali vanno in app/lib/site.ts con la fonte annotata, non qui.",
  },
  {
    id: "consulenza-professionale",
    category: "limiti",
    title: "Consulenza legale, fiscale e tecnica",
    content: "",
    status: "disabled",
    source: "—",
    lastVerified: "",
    locale: "it",
    keywords: [],
    note: "Volutamente assente come contenuto: su questi temi l'assistente non deve avere una fonte da cui attingere, deve rimandare al professionista. Vedi limiti-assistente.",
  },
];

export const KNOWLEDGE: KnowledgeEntry[] = [...VERIFIED, ...PENDING, ...DISABLED];

/**
 * Le sole voci realmente utilizzabili in una risposta.
 * Il doppio controllo (stato + contenuto non vuoto) è voluto: una voce marcata `verified`
 * per sbaglio ma ancora senza testo non deve poter arrivare al modello.
 */
export function verifiedEntries(entries: KnowledgeEntry[] = KNOWLEDGE): KnowledgeEntry[] {
  return entries.filter((e) => e.status === "verified" && e.content.trim().length > 0);
}
