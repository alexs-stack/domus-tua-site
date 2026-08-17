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
// Lo stesso principio vale per le FAQ: le risposte pubblicate su /domande-frequenti NON
// vengono ricopiate qui, si leggono dalla loro fonte unica (app/domande-frequenti/faq.ts)
// tramite `fromFaq`. Se il cliente corregge una risposta sul sito, l'assistente cambia con
// lei nello stesso deploy — senza che nessuno debba ricordarsi di allineare due file.
//
// Come si aggiunge o si approva una voce: docs/assistant-knowledge.md.

import { faqFlat, type FaqEntryId } from "../../../domande-frequenti/faq";
import { faqIt as careersFaq, type CareersFaqId } from "../../../lavora-con-noi/faq";
import { site } from "../../site";
import { team, teamRoleLabels } from "../../team";
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

/** Le FAQ italiane pubblicate sul sito, per ID. Definite prima di VERIFIED: le usa. */
const FAQ_IT = new Map(faqFlat("it").map((entry) => [entry.id, entry] as const));
const CAREERS_FAQ_IT = new Map(careersFaq.map((entry) => [entry.id, entry] as const));

/**
 * Promuove una FAQ del sito a voce di conoscenza, SENZA ricopiarne il testo.
 *
 * Domanda e risposta restano dove sono già la fonte unica per la pagina, per i blocchi in
 * coda a /vendi e /acquista e per il JSON-LD. Una correzione fatta lì arriva all'assistente
 * da sola: è lo stesso motivo per cui gli immobili non stanno in questo file.
 *
 * L'ID (`faq-costi`, `faq-doc`, …) è stabile perché lo è quello della FAQ.
 * La `q` diventa il titolo: è già la domanda dell'utente, il segnale migliore per il
 * retrieval lessicale. Le `keywords` restano curate a mano — sono i modi in cui la stessa
 * domanda viene posta a voce, che nella FAQ scritta non compaiono.
 */
function fromFaq(
  id: FaqEntryId,
  category: KnowledgeCategory,
  keywords: string[],
): KnowledgeEntry {
  // Un ID inesistente è impossibile (FaqEntryId è chiuso), ma se la FAQ venisse rimossa dal
  // sito il contenuto resterebbe vuoto: `verifiedEntries` la scarterebbe e knowledge.test.ts
  // fallirebbe subito. Meglio un test rosso che una voce muta in produzione.
  const entry = FAQ_IT.get(id);
  return {
    id: `faq-${id}`,
    category,
    title: entry?.q ?? "",
    content: entry?.a ?? "",
    status: "verified",
    source: `pagina /domande-frequenti del sito, voce "${id}" (app/domande-frequenti/faq.ts)`,
    lastVerified: "2026-08-06",
    locale: "it",
    keywords,
  };
}

/**
 * Come `fromFaq`, per le domande di /lavora-con-noi.
 *
 * Sono un file a parte perché rispondono a chi si candida, non a chi compra o vende, e
 * hanno un JSON-LD tutto loro. Ma il principio non cambia: pubblicate = utilizzabili, e
 * lette dalla fonte invece che ricopiate.
 */
function fromCareersFaq(id: CareersFaqId, keywords: string[]): KnowledgeEntry {
  const entry = CAREERS_FAQ_IT.get(id);
  return {
    id: `faq-lavoro-${id}`,
    category: "faq",
    title: entry?.q ?? "",
    content: entry?.a ?? "",
    status: "verified",
    source: `pagina /lavora-con-noi del sito, voce "${id}" (app/lavora-con-noi/faq.ts)`,
    lastVerified: "2026-08-06",
    locale: "it",
    keywords,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATE — l'unica conoscenza che l'assistente può usare oggi.
// Ogni voce cita una fonte controllabile. Niente numeri che cambiano nel tempo.
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
    // "aperto" da solo NON va messo qui: stessa radice di "aperte", e agganciava
    // "Posso candidarmi se non ci sono posizioni aperte?" — cioè una domanda sul lavoro
    // che si portava a casa una fonte sugli orari. Terza occorrenza della stessa trappola
    // dopo "tempi" e "tempo": in italiano le parole comuni condividono le radici, e una
    // keyword generica costa più di quanto renda. "siete aperti" e "aprite" dicono la
    // stessa cosa senza collidere.
    keywords: ["orari", "orario", "siete aperti", "aprite", "chiuso", "sabato", "domenica", "pomeriggio", "mattina", "apertura", "chiusura"],
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
    id: "faq-pagina",
    category: "faq",
    title: "Le domande frequenti del sito",
    content:
      "Il sito ha una pagina di domande frequenti su come si vende e si compra casa con noi: la trovi in /domande-frequenti. Se la risposta che cerchi non c'è, il team risponde volentieri.",
    status: "verified",
    // Non contiene le risposte, e continua a non contenerle: ora ci sono le voci `faq-*`,
    // che le leggono una per una dalla loro fonte. Questa resta perché "avete una pagina di
    // domande frequenti?" è una domanda a sé, e la risposta è un indirizzo, non un elenco.
    source: "pagina /domande-frequenti del sito (app/domande-frequenti/faq.ts)",
    lastVerified: "2026-08-05",
    locale: "it",
    keywords: ["domande frequenti", "faq", "domande comuni", "dubbi frequenti", "domande ricorrenti"],
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
    // Le imposte hanno nomi propri, e sono quelli che la gente scrive: "IMU", "detrarre",
    // "agevolazioni". Senza, *"Quanto pagherò di IMU su questa casa?"* agganciava `faq-costi`
    // — cioè la provvigione dell'agenzia — e l'assistente rispondeva a una domanda fiscale
    // parlando di quanto costa vendere. Una fonte sbagliata è peggio di nessuna fonte: qui
    // la risposta giusta esiste ed è "su questo non posso, te lo dice un professionista".
    // NB: niente "eredità"/"ereditato" — chi ha ereditato una casa di solito vuole venderla,
    // e quella domanda deve continuare ad arrivare a `processo-vendita`.
    keywords: ["limiti", "legale", "fiscale", "notaio", "tasse", "imposte", "imu", "detrarre", "detrazioni", "agevolazioni", "mutuo", "conformita", "catastale", "urbanistica", "perizia", "consulenza"],
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
    // "tempi" da solo NON va messo qui: agganciava "Che tempo farà domani?", perché in
    // italiano tempo/tempi hanno la stessa radice. È il falso positivo raccontato in
    // docs/assistant-knowledge.md, corretto nel corpus di prova ma rimasto vivo qui fino al
    // 2026-08-06. Le domande sui tempi di vendita le prende `faq-tempi`, che risponde
    // meglio: sul sito c'è già scritto che non si promettono.
    keywords: ["garanzia", "garantisci", "promessa", "sicuro", "quanto ci vuole", "riuscite", "certezza"],
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

  // ───────────────────────────────────────────────────────────────────────────
  // DAL COPY PUBBLICATO — riassunti dei contenuti che l'agenzia ha già messo
  // online. La fonte è la pagina: chiunque può aprirla e controllare la frase.
  // Regola tenuta stretta anche qui: si riassume ciò che la pagina DICE, non si
  // aggiunge ciò che sarebbe utile dire. Dove il sito tace, tace anche la voce —
  // e lo dichiara, rimandando al team.
  // ───────────────────────────────────────────────────────────────────────────
  {
    id: "metodo-domus",
    category: "metodo",
    title: "Il Metodo Domus Tua",
    content:
      "Il Metodo Domus Tua è un percorso in nove passaggi, uguale per ogni incarico: primo ascolto, valutazione dell'immobile e del mercato, verifica documentale, preparazione della casa (con home staging dove serve), racconto visivo con foto e video, marketing e anteprime social, Open Domus e visite qualificate, proposta e trattativa, assistenza fino al rogito. Su /metodo lo stesso percorso è raccontato in cinque fasi, ancorate al protocollo Domus D.O.C.",
    status: "verified",
    source: "pagine /metodo e home del sito (app/components/Method.tsx, app/metodo/MetodoContent.tsx)",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "metodo",
      "come lavorate",
      "nove passaggi",
      "cinque fasi",
      "percorso",
      "che metodo",
      "sistema",
      "in cosa consiste",
      // "Perché voi e non un'altra agenzia" è la domanda vera dietro il metodo, e non
      // contiene nessuna delle parole qui sopra.
      "differenza con altre agenzie",
      "perche scegliere voi",
      "cosa vi distingue",
    ],
  },
  {
    id: "domus-doc",
    category: "domus-doc",
    title: "Domus D.O.C., Domus di Origine Certificata",
    content:
      "Domus D.O.C. — Domus di Origine Certificata — è il protocollo con cui l'agenzia verifica un immobile prima di portarlo sul mercato, non durante la trattativa. Cinque pilastri: Documenti (le carte pronte), Conformità (catasto, urbanistica e impianti), Trasparenza verso chi compra, Preparazione della casa e Tutela fino al rogito. Vale per ogni incarico. Quali verifiche siano già state fatte su un immobile preciso te lo conferma il team: io non posso attestarlo.",
    status: "verified",
    source: "sezione Domus D.O.C. delle pagine /metodo e /vendi (app/components/DomusDocProtocol.tsx)",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "d.o.c",
      "doc",
      "domus d.o.c",
      "origine certificata",
      "protocollo",
      "certificata",
      "certificazione",
      "documenti verificati",
      "cinque pilastri",
      // Chi ha paura di brutte sorprese parla di "carte" e di roba "in regola", non di
      // protocolli: *"Che garanzie ho che non ci siano problemi con le carte?"* finiva su
      // `limiti-garanzie` — cioè "non promettiamo tempi né prezzi", che è un'altra domanda.
      "carte",
      "in regola",
      "problemi con i documenti",
      "sorprese",
    ],
  },
  {
    id: "open-domus",
    category: "open-domus",
    title: "Open Domus, il format di visita",
    content:
      "Open Domus è il format di visita di Domus Tua: una giornata dedicata a un immobile, con visite su appuntamento in fasce orarie. La casa viene preparata prima, documenti e planimetrie sono già disponibili, e partecipano solo acquirenti prequalificati — niente viavai di curiosi. Non devi lasciare libera la casa: preparazione, accoglienza e visite le cura l'agenzia. Non è adatto a ogni immobile: se lo sia per il tuo lo valuta il team con te. Il racconto completo è su /open-domus.",
    status: "verified",
    source: "pagina /open-domus del sito (app/open-domus/OpenDomusPageContent.tsx)",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "open domus",
      "open house",
      "porte aperte",
      "giornata dedicata",
      "visite collettive",
      "evento",
      "prequalificati",
      // Il problema con le parole di chi vende, non con le nostre: quasi nessuno chiede
      // "come funziona la prequalifica", molti dicono "non voglio curiosi per casa".
      "curiosi",
      "gente in casa",
      "sconosciuti",
    ],
  },
  {
    id: "processo-vendita",
    category: "vendita",
    title: "Come si vende casa con Domus Tua",
    content:
      "Si parte da una valutazione gratuita e senza impegno, poi quattro passi: valutazione e analisi di mercato per definire prezzo e strategia; verifica di conformità, titoli e planimetrie prima di mettere in vendita; preparazione della casa e, dove serve, home staging; marketing e Open Domus, con foto, video e campagne. Nessun costo anticipato: si paga solo a vendita conclusa, e foto, video, home staging e certificazione fanno parte del metodo. Per cominciare basta contattare il team.",
    status: "verified",
    source: "pagina /vendi del sito (app/vendi/VendiContent.tsx)",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "vendere",
      "vendita",
      "vendita casa",
      "mettere in vendita",
      "incarico",
      "mandato",
      "da dove comincio",
      "voglio vendere",
      // Chi valuta se rivolgersi a un'agenzia non usa la parola "vendita": chiede se
      // conviene, o dice che ci proverebbe da solo.
      "affidarmi",
      "affidarsi",
      "fare da solo",
      "senza agenzia",
      "conviene",
    ],
  },
  {
    id: "processo-acquisto",
    category: "acquisto",
    title: "Come si compra casa con Domus Tua",
    content:
      "Chi compra segue quattro passaggi: ricerca mirata su immobili coerenti con esigenze e budget, invece di visite a vuoto; le informazioni prima della visita — caratteristiche, documenti, contesto; visita accompagnata, con la documentazione nero su bianco; proposta, trattativa e assistenza fino al rogito. Se tra gli annunci non trovi quello che cerchi puoi lasciare una richiesta con zona e budget: molte ricerche partono prima che l'immobile arrivi online.",
    status: "verified",
    source: "pagina /acquista del sito (app/acquista/AcquistaContent.tsx)",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "comprare",
      "acquisto",
      "acquistare",
      "comprare casa",
      "cerco casa",
      "primo passo",
      "come si compra",
    ],
  },
  {
    id: "valutazione-immobile",
    category: "valutazione",
    title: "La valutazione dell'immobile",
    content:
      "La valutazione è gratuita e senza impegno: una stima professionale su dati reali — caratteristiche, zona e domanda del momento — che serve a definire prezzo e strategia. Un prezzo troppo alto lascia la casa ferma per mesi, uno troppo basso lascia valore sul tavolo. La fa il team di persona: io non posso stimare quanto vale una casa, nemmeno approssimativamente. Per richiederla: modulo del sito, WhatsApp o telefono.",
    status: "verified",
    source: "pagina /vendi del sito e FAQ 'costi'/'prezzo' (app/vendi/VendiContent.tsx, app/domande-frequenti/faq.ts)",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "valutazione",
      "valutare",
      "quanto vale",
      "stima",
      "stimare",
      "prezzo casa mia",
      "gratuita",
      "perizia gratuita",
    ],
  },
  {
    id: "appuntamenti-visite",
    category: "appuntamenti",
    title: "Appuntamenti e visite",
    content:
      "Le visite le fissa il team: io non posso prenotare un appuntamento da solo, ma posso metterti in contatto su WhatsApp o al telefono, o raccogliere la tua richiesta. Prima della visita ricevi le informazioni sull'immobile — caratteristiche, documenti, contesto — perché la visita serva a capire se la casa è la tua. Sugli immobili con un Open Domus in programma si va su appuntamento, nella giornata dedicata.",
    status: "verified",
    source: "pagine /acquista e /open-domus del sito + limiti di programma dell'assistente",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "appuntamento",
      "visita",
      "visitare",
      "vedere casa",
      "sopralluogo",
      "prenotare",
      "prenotare una visita",
      "fissare",
    ],
  },
  {
    id: "proposte-documenti",
    category: "proposte",
    title: "Proposta d'acquisto, documenti e rogito",
    content:
      "La documentazione degli immobili seguiti dall'agenzia è verificata a monte e condivisa con chi compra appena disponibile: si sa cosa si acquista prima di fare una proposta. Nella proposta e nella trattativa il team assiste, e segue ogni adempimento fino alla firma dal notaio. Sul contenuto della proposta, sulla caparra, sul preliminare e sul rogito non posso darti consulenza, e non posso dirti quanto offrire: se ne parla col team, che conosce l'immobile.",
    status: "verified",
    source: "pagine /acquista e /vendi del sito + FAQ 'documenti-acquisto'/'dopo-proposta'",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "proposta",
      "proposta d'acquisto",
      "offerta",
      "caparra",
      "preliminare",
      "compromesso",
      "rogito",
      "notaio",
      "documenti",
      // Le parole con cui la trattativa si chiede DAVVERO. `trattativa-prezzo` resta
      // pending perché il sito non dà una regola sul ribasso, ma il silenzio non è la
      // risposta giusta: questa voce dice quel che il sito dice — che la trattativa la
      // segue il team — e ammette il resto.
      "trattativa",
      "trattare",
      "negoziazione",
      "offrire",
      "cifra piu bassa",
      "sconto",
      // "Burocrazia" e "pratiche" sono il nome che la gente dà agli adempimenti fino al
      // rogito. Nel corpus non comparivano da nessuna parte.
      "burocrazia",
      "pratiche",
      "adempimenti",
    ],
  },
  {
    id: "servizi-agenzia",
    category: "metodo",
    title: "I servizi di Domus Tua",
    content:
      "I servizi fanno parte del metodo, non sono voci da aggiungere in fondo al preventivo. Sul fronte tecnico: consulenza catastale, urbanistica e amministrativa. Sul racconto: rendering e virtual rendering (il potenziale di un immobile da ristrutturare, visibile prima dei lavori), home staging, emotional video real estate e campagne marketing mirate. E Open Domus, il format di visita. Sono descritti su /servizi.",
    status: "verified",
    source: "pagina /servizi del sito (app/servizi/ServiziContent.tsx, app/components/Services.tsx)",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "servizi",
      "cosa offrite",
      "cosa fate",
      "home staging",
      "rendering",
      "video",
      "fotografie",
      "marketing",
      "campagne",
      "virtual",
    ],
  },
  {
    id: "team-agenzia",
    category: "identita",
    // I nomi e i ruoli si leggono da app/lib/team.ts, la fonte unica che alimenta anche
    // /chi-siamo: se il roster cambia, cambia anche questa voce. Scriverli a mano qui
    // avrebbe creato la solita seconda verità, quella che invecchia senza dirlo.
    title: "Chi lavora in Domus Tua",
    content: `Il team di Domus Tua, come pubblicato su /chi-siamo: ${team
      .map((m) => `${m.name} (${teamRoleLabels.it[m.role]})`)
      .join(", ")}. È un'agenzia a guida femminile. Chi seguirà la tua pratica te lo dice il team: dipende da cosa ti serve.`,
    status: "verified",
    source: "pagina /chi-siamo del sito, roster in app/lib/team.ts",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "team",
      "squadra",
      "collaboratori",
      "chi lavora",
      "raffaela",
      "rizza",
      "fondatrice",
      "titolare",
      "agenti",
      "persone",
    ],
  },
  {
    id: "recensioni-pagina",
    category: "identita",
    // La voce `reputazione-recensioni` resta disabled, e questa NON la aggira: là il
    // problema erano il numero e la media, dati vivi che scritti a mano diventano falsi
    // senza che nessuno se ne accorga. Qui non c'è nessuna cifra — c'è un indirizzo.
    //
    // Prima "Quante recensioni avete?" non trovava niente e l'assistente proponeva il team:
    // onesto, ma inutile. Le recensioni sono pubbliche, su una pagina del sito: mandarci
    // l'utente è più utile del silenzio e altrettanto vero. "Non so quante, ma sono lì" è
    // una risposta; "non lo so" da solo non lo è.
    title: "Dove leggere le recensioni",
    content:
      "Le recensioni dei clienti sono raccolte sulla pagina /recensioni del sito, e arrivano da Google. Quante siano e quale sia la media in questo momento non te lo so dire — sono numeri che cambiano — ma le trovi tutte lì, firmate da chi ha venduto o comprato casa con noi.",
    status: "verified",
    source: "pagina /recensioni del sito (app/recensioni/RecensioniContent.tsx), recensioni Google via Trustindex",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "recensioni",
      "opinioni",
      "testimonianze",
      "cosa dicono",
      "reputazione",
      "stelle",
      "rating",
      "feedback clienti",
    ],
  },
  {
    id: "privacy-pagina",
    category: "limiti",
    title: "L'informativa privacy del sito",
    content: `L'informativa privacy completa è pubblicata su /privacy, e la cookie policy su /cookie: sono quelle le versioni che fanno fede, e non te le riassumo io. Il titolare del trattamento è ${site.legal}, con sede in ${site.address.street}, ${site.address.city} (${site.address.province}). Per una richiesta sui tuoi dati — accesso, rettifica, cancellazione — puoi scrivere a ${LEAD_EMAIL_TO} o telefonare all'agenzia.`,
    status: "verified",
    // Solo il MECCANISMO (dove sta l'informativa, chi è il titolare, dove si scrive), che è
    // verificabile. Il TESTO no: la pagina stessa dichiara che è una traduzione automatica
    // da rivedere con un legale. Vedi la voce `privacy-policy` fra le pending.
    source: "pagina /privacy del sito (app/privacy/PrivacyContent.tsx) + Registro Imprese",
    lastVerified: "2026-08-06",
    locale: "it",
    keywords: [
      "informativa",
      "privacy policy",
      "cookie policy",
      "titolare del trattamento",
      "diritti",
      "cancellare i dati",
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DALLE FAQ PUBBLICATE — una voce per domanda, testo letto dalla fonte unica.
  // Le FAQ già coperte da una voce dedicata restano fuori: `sede-orari`,
  // `contatti` e `zone` ripeterebbero orari-apertura / contatti-ufficiali /
  // area-servita, che dicono le stesse cose leggendo lo stesso `site`.
  // Fuori anche `storia`: la sua risposta cita valutazione media e numero di
  // recensioni, che cambiano nel tempo — è il motivo per cui esiste la voce
  // disabilitata `reputazione-recensioni`, e non lo si aggira da qui.
  // ───────────────────────────────────────────────────────────────────────────
  fromFaq("costi", "vendita", [
    "quanto costa",
    "provvigione",
    "commissione",
    "spese agenzia",
    "costi anticipati",
    "quanto vi devo",
    "pagare",
  ]),
  fromFaq("prezzo", "valutazione", [
    "stabilite il prezzo",
    "come decidete il prezzo",
    "prezzo giusto",
    "prezzo di vendita",
    "chi decide il prezzo",
  ]),
  fromFaq("prima-online", "vendita", [
    "prima di pubblicare",
    "prima dell'annuncio",
    "cosa fate prima",
    "prima che vada online",
  ]),
  fromFaq("doc", "domus-doc", ["protocollo d.o.c", "cosa verificate", "che cos'e il protocollo"]),
  fromFaq("non-vendo", "vendita", [
    "se non vendo",
    "e se poi non vendo",
    "cosa succede se non si vende",
    "quanto mi costa se non vendete",
    "devo pagare comunque",
    "quanto dura il mandato",
    "durata incarico",
    "posso recedere",
  ]),
  fromFaq("eredita", "vendita", [
    "casa ereditata",
    "ho ereditato",
    "successione",
    "vendere casa in successione",
    "piu eredi",
    "fratelli non sono d'accordo",
    "voltura catastale",
  ]),
  fromFaq("mutuo", "vendita", [
    "mutuo in corso",
    "c'e ancora il mutuo",
    "vendere con il mutuo",
    "ipoteca",
    "estinzione mutuo",
    "conteggio estintivo",
    "cancellazione ipoteca",
  ]),
  fromFaq("tempi", "vendita", [
    "tempi di vendita",
    "quanto ci mette",
    "in quanto tempo",
    "quanto tempo serve",
    "quando si vende",
  ]),
  fromFaq("open-domus", "open-domus", ["che cos'e un open domus", "come si svolge"]),
  fromFaq("documenti-acquisto", "acquisto", [
    "documenti in ordine",
    "carte a posto",
    "conformita",
    "planimetrie",
    "che documenti",
  ]),
  fromFaq("info-visita", "appuntamenti", [
    "prima della visita",
    "informazioni prima",
    "sapere prima",
  ]),
  fromFaq("richiesta-su-misura", "acquisto", [
    "non trovo",
    "richiesta su misura",
    "ricerca personalizzata",
    "avvisatemi",
    "lasciare una richiesta",
  ]),
  fromFaq("dopo-proposta", "proposte", [
    "dopo la proposta",
    "seguite anche dopo",
    "fino al rogito",
    "assistenza",
  ]),

  // Le FAQ di /lavora-con-noi. `lavora-con-noi` qui sopra resta: dice il meccanismo
  // completo (le aree, il modulo, dove scrivere); queste rispondono a quattro domande
  // precise che quella riassume soltanto.
  fromCareersFaq("candidatura-spontanea", [
    "candidatura spontanea",
    "posizione aperta",
    "posizioni aperte",
    "assumete",
    "cercate personale",
  ]),
  fromCareersFaq("curriculum", ["curriculum", "cv", "allegato", "mandare il cv", "come candidarsi"]),
  fromCareersFaq("dati", ["dati della candidatura", "che fine fanno"]),
  fromCareersFaq("sede-lavoro", ["dove si lavora", "smart working", "sede di lavoro", "in ufficio"]),
];

// ─────────────────────────────────────────────────────────────────────────────
// IN ATTESA — quello che il SITO NON DICE.
//
// Da 2026-08-06 questa lista è corta, e il criterio è cambiato: prima erano in attesa i
// temi su cui mancava un testo approvato, adesso solo quelli su cui manca un testo, punto.
// Tutto ciò che l'agenzia ha già pubblicato è stato promosso a voce verificata, con la
// pagina come fonte: se una frase è buona per un visitatore, è buona per l'assistente.
//
// Restano vuote di proposito: un contenuto scritto da noi e messo qui diventerebbe
// indistinguibile da uno pubblicato. Elenco operativo in docs/assistant-knowledge.md.
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
  pending("trattativa-prezzo", "proposte", "Trattare sul prezzo", ["trattare", "sconto", "abbassare", "offrire una cifra piu bassa", "margine"],
    "Cosa si può dire a chi chiede se può offrire meno del prezzo richiesto. Il sito NON " +
      "lo dice da nessuna parte: /vendi e /acquista promettono che la trattativa è gestita " +
      "con trasparenza, ma non danno una regola sul ribasso — ed è giusto così, perché " +
      "dipende dall'immobile e dal mandato. Finché l'agenzia non decide una formula " +
      "comunicabile, la domanda la intercetta `proposte-documenti`, che risponde quello " +
      "che il sito dice davvero (la trattativa la segue il team) e ammette il resto."),
  pending("referente-casi-complessi", "contatti", "A chi rivolgersi per i casi complessi", ["referente", "responsabile", "chi segue"],
    "Nome e ruolo della persona a cui rimandare i casi che l'assistente non copre. Il sito " +
      "pubblica il team su /chi-siamo ma non assegna questo ruolo a nessuno: dedurlo " +
      "sarebbe inventare. Serve una riga da Raffaela."),
  pending("privacy-policy", "limiti", "Testo dell'informativa privacy", ["cosa dice l'informativa", "come trattate i dati"],
    "Il testo dell'informativa, per poterlo citare invece che rimandarci. NON promosso " +
      "insieme al resto del copy pubblicato, e per un motivo scritto sulla pagina stessa: " +
      "app/privacy/PrivacyContent.tsx si apre con 'machine translation of legal text — " +
      "requires professional/legal review before go-live', e il testo ripete che i " +
      "contenuti vanno verificati da un legale prima della pubblicazione. Un assistente " +
      "che recita un testo legale provvisorio è peggio di uno che linka la pagina. " +
      "Intanto `privacy-pagina` copre il meccanismo: dove sta, chi è il titolare, a chi " +
      "si scrive. Da sbloccare quando l'informativa passa la revisione legale."),
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
