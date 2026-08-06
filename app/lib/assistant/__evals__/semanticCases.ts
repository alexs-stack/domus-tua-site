// Casi per tarare la soglia del retrieval semantico (ASSISTANT_SEMANTIC_FLOOR).
//
// La soglia decide una cosa sola, ma è quella che conta: se una domanda fuori corpus riceve
// comunque una fonte, l'assistente risponde a fianco della domanda con la sicurezza di chi
// ha una fonte in mano. Meglio troppo alta (costa un "non lo so") che troppo bassa.
//
// Il valore attuale (0,6) è un'ipotesi mai misurata, perché misurarla richiede una chiave
// Voyage. Questi casi sono il metro: `npm run calibrate:semantic` li esegue contro l'API
// vera e stampa la soglia che li separa. Vedi scripts/calibrate-semantic.ts.
//
// DUE GRUPPI, e servono entrambi:
//  • DEVE_AGGANCIARE — riformulazioni che il lessicale NON prende (parole diverse da quelle
//    del corpus). Sono la ragione per cui il livello semantico esiste: se la soglia le
//    taglia, la chiave Voyage è soldi spesi per niente.
//  • DEVE_TACERE — domande che nessuna voce copre. Sono la ragione per cui la soglia esiste.

/** Domanda + voce che dovrebbe emergere. Il lessicale su queste è debole o muto. */
export interface CasoSemantico {
  q: string;
  id: string;
  /** Perché il lessicale non basta: serve a capire il caso quando fallisce. */
  perche: string;
}

export const DEVE_AGGANCIARE: CasoSemantico[] = [
  {
    q: "Mi conviene affidarmi a un'agenzia invece di fare da solo?",
    id: "processo-vendita",
    perche: "nessuna parola in comune con la voce: parla di 'affidarsi', non di 'vendere'",
  },
  {
    q: "Come faccio a capire se sto pagando troppo per questa casa?",
    id: "valutazione-immobile",
    perche: "'pagare troppo' e 'valutazione' non condividono radici",
  },
  {
    q: "Che garanzie ho che non ci siano problemi con le carte?",
    id: "domus-doc",
    perche: "'problemi con le carte' è il modo parlato di dire conformità documentale",
  },
  {
    q: "Non voglio gente sconosciuta che gira per casa mia",
    id: "open-domus",
    perche: "è l'obiezione che Open Domus risolve, senza mai nominarlo",
  },
  {
    q: "Ho fretta di trasferirmi, riuscite ad aiutarmi?",
    id: "processo-vendita",
    perche: "intento di vendita espresso come circostanza personale",
  },
  {
    q: "Vi occupate voi di tutta la burocrazia?",
    id: "proposte-documenti",
    perche: "'burocrazia' non compare nel corpus, ma è ciò di cui parla la voce",
  },
  {
    q: "Che differenza c'è tra voi e le altre agenzie?",
    id: "metodo-domus",
    perche: "la risposta è il metodo, ma la domanda non usa la parola",
  },
  {
    q: "Vorrei far vedere la casa a qualcuno di serio, non ai curiosi",
    id: "open-domus",
    perche: "descrive la prequalifica senza nominarla",
  },
  {
    q: "Prima di firmare qualcosa posso parlare con qualcuno?",
    id: "contatto-umano",
    perche: "richiesta di contatto umano espressa come esitazione",
  },
  {
    q: "Siete solo di zona o lavorate anche altrove?",
    id: "area-servita",
    perche: "'altrove' e 'di zona' non sono le parole della voce",
  },

  // Le tre qui sotto stavano in DEVE_TACERE, ed era un errore mio (2026-08-06): "non posso
  // aiutarti su questo" È una risposta, e la fonte che la autorizza è `limiti-assistente`.
  // Silenzio e rifiuto motivato sembrano vicini ma non lo sono: il primo lascia l'utente
  // senza niente, il secondo gli dice perché e lo manda dalla persona giusta. Etichettarle
  // come rumore faceva sembrare sbagliato un comportamento corretto — e avrebbe spinto ad
  // alzare la soglia per curare un sintomo inesistente.
  {
    q: "Mi conviene un mutuo a tasso fisso o variabile?",
    id: "limiti-assistente",
    perche: "consulenza finanziaria: la risposta giusta è il limite dichiarato, non il silenzio",
  },
  {
    q: "Quanto pagherò di IMU su questa casa?",
    id: "limiti-assistente",
    perche: "consulenza fiscale: idem",
  },
  {
    q: "Posso detrarre le spese di ristrutturazione?",
    id: "limiti-assistente",
    perche: "consulenza fiscale: idem",
  },
];

/**
 * Domande che nessuna voce copre, nemmeno per dire "non posso". La ricerca vettoriale
 * restituisce comunque "la cosa più vicina": queste servono a vedere QUANTO vicina.
 *
 * ATTENZIONE a cosa finisce qui. Non basta che la domanda sia fuori tema: deve essere fuori
 * tema E senza una voce che la governi. Le domande su mutui e tasse, per esempio, NON stanno
 * qui — le governa `limiti-assistente`, e infatti sono fra quelle che devono agganciare.
 * Mettere in questa lista una domanda che una voce copre legittimamente falsa la misura
 * verso l'alto: la soglia sale per escludere un comportamento che era giusto.
 *
 * Le ultime tre sono la parte difficile: parlano di immobili e di agenzia, ma chiedono cose
 * che il corpus tace di proposito (numeri vivi, metriche mai documentate, un ruolo che il
 * sito non assegna). Sono quelle su cui il semantico sbaglia più volentieri.
 */
export const DEVE_TACERE: string[] = [
  "Qual è la capitale del Perù?",
  "Mi consigli un ristorante a Milano?",
  "Che tempo farà domani?",
  "Scrivimi una poesia sulla primavera",
  "Consigliami un buon commercialista",
  "Quante case avete venduto in totale?",
  "Che voto avete su Google?",
  "Chi è il referente per i casi complessi?",
];
