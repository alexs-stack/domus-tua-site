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
 *
 * PERCHÉ SONO TANTI. Con i soli attacchi "canonici" ("è dotata di", "si compone di") su
 * venti annunci reali uscivano SETTE elenchi in tutto: tutte le altre enumerazioni —
 * e sono la maggioranza — restavano prosa, cioè restavano il muro di testo che questo
 * modulo esiste per smontare. Gli attacchi qui sotto sono tutti verbi di DOTAZIONE presi
 * dal corpus reale; il rischio di falso positivo non sta nel verbo ma in ciò che segue,
 * ed è lì che `readEnumeration` continua a essere severo (3-8 voci, sintagmi brevi,
 * nessun punto fermo interno, niente subordinate).
 */
// NB: il confine iniziale è un lookbehind Unicode, non `\b`. In JavaScript `\b` ragiona
// solo su [A-Za-z0-9_]: davanti a "è dotata di" il confine cadrebbe SEMPRE, e l'attacco
// più frequente degli annunci italiani non verrebbe mai riconosciuto.
export const ENUM_LEAD_INS = new RegExp(
  `(?<!\\p{L})(?:${[
    // Dotazione esplicita
    "(?:è |sono |ed è |e sono )?dotat[oaei] (?:anche )?di",
    "corredat[oaei] (?:anche )?di",
    "arricchit[oaei] d[ai]",
    "caratterizzat[oaei] d[ai]",
    "costituit[oaei] d[ai]",
    // Composizione
    "si compone di",
    "(?:è |sono |ad oggi )?compost[oaei] d[ai]",
    "si sviluppa (?:su|con)",
    "comprende",
    "include",
    "dispone di",
    // Offerta / possesso — il soggetto è l'immobile, l'elenco è ciò che mette a
    // disposizione. Verbi frequentissimi negli annunci e sempre seguiti da sintagmi.
    "offr(?:e|ono)",
    "ospit(?:a|ano)",
    "present(?:a|ano)",
    "vant(?:a|ano)",
    "annover(?:a|ano)",
    // Inversione: "Completano il piano un ampio bagno, un disimpegno…". L'oggetto
    // resta un elenco CHIUSO: senza, il lead si mangerebbe la prima voce.
    "completa(?:no)? (?:il piano(?: terra| rialzato| primo| secondo| interrato)?|la proprietà|l'immobile|l’immobile|la casa|la villa|l'appartamento|l’appartamento|l'unità|l’unità|la zona giorno|la zona notte|la dotazione|il tutto|gli spazi)",
    // "Al piano troviamo una camera, uno studio e due bagni."
    "trov(?:iamo|i|ate)",
    "si trov(?:a|ano)(?: inoltre| anche)?",
    "abbiamo",
  ].join("|")})\\s+`,
  "iu",
);

/**
 * Parole con cui una VOCE D'ELENCO non può mai cominciare.
 *
 * È il vero guardiano degli elenchi, e vale più dell'attacco che li introduce. Una voce
 * d'elenco è un sintagma NOMINALE — «un disimpegno con arredo», «radiatori in ghisa» —
 * mentre la prosa spezzata alle virgole comincia sistematicamente per preposizione,
 * congiunzione, avverbio o participio: «ognuna con la possibilità di…», «mentre la
 * graziosa cucina…», «dotato di passerella…», «soprattutto nel caso in cui…».
 *
 * Basta UNA voce che cominci così perché l'intero elenco venga rifiutato e il paragrafo
 * resti prosa: in una vera enumerazione non ce n'è nessuna, in un falso positivo ce n'è
 * quasi sempre più d'una. È la regola che permette di allargare gli attacchi (ENUM_LEAD_INS)
 * senza pagare in elenchi sbagliati — e un elenco sbagliato è peggio di nessun elenco.
 */
export const ITEM_STOP_OPENERS: ReadonlySet<string> = new Set([
  // Preposizioni e locuzioni
  "con", "senza", "per", "tra", "fra", "da", "di", "in", "su", "a", "ad", "presso", "verso",
  "dal", "dalla", "dallo", "dai", "dalle", "del", "della", "dello", "dei", "delle", "degli",
  "nel", "nella", "nello", "nei", "nelle", "negli", "sul", "sulla", "sullo", "sui", "sulle",
  "al", "alla", "allo", "ai", "alle", "agli", "col", "coi",
  // Forme elise: la voce viene troncata all'apostrofo, quindi qui basta il moncone
  // ("dall'ingresso" → "dall"). L'articolo elidato — "l'armonia", "un'ampia" — resta fuori:
  // quello un sintagma lo apre eccome.
  "dall", "dell", "nell", "sull", "all", "coll", "quell",
  // Congiunzioni e connettivi
  "e", "ed", "o", "od", "oppure", "ma", "però", "mentre", "come", "così", "che", "chi", "cui",
  "dove", "quando", "se", "perché", "poiché", "sebbene", "benché", "nonché", "ovvero", "cioè",
  "quindi", "dunque", "anzi", "ossia", "né",
  // Avverbi e quantificatori che continuano il periodo
  "oltre", "più", "meno", "non", "mai", "sempre", "già", "ancora", "anche", "pure", "solo",
  "soltanto", "soprattutto", "specialmente", "particolarmente", "veramente", "davvero",
  "infine", "inoltre", "poi", "sia", "ognuno", "ognuna", "ciascuno", "ciascuna", "entrambi",
  "entrambe", "tutto", "tutti", "tutta", "tutte",
  // Participi e aggettivi predicativi: descrivono la voce PRECEDENTE, non ne aprono una nuova
  "dotato", "dotata", "dotati", "dotate", "composto", "composta", "composti", "composte",
  "corredato", "corredata", "corredati", "corredate", "arricchito", "arricchita",
  "sviluppato", "sviluppata", "sviluppati", "sviluppate", "situato", "situata", "situati",
  "situate", "posto", "posta", "collegato", "collegata", "affacciato", "affacciata",
  "completo", "completa", "completi", "complete", "unito", "unita", "uniti", "unite",
  "comodo", "comoda", "comodi", "comode", "ideale", "ideali", "adatto", "adatta",
  "perfetto", "perfetta", "perfetti", "perfette", "fantastico", "fantastica",
  "ottimo", "ottima", "utile", "utili", "pratico", "pratica", "magnifico", "splendido",
]);

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
  // Ragioni sociali: senza queste "S.p.A. con sede…" si spezza dopo "S.p." — il punto
  // fermo senza spazio ora è un confine valido, e le sigle vanno protette a mano.
  "s.p",
  "s.r",
  "s.a",
  "s.n",
];
