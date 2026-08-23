// IDENTITÀ GEOGRAFICA CANONICA — la chiave con cui il sito nomina un'area (Prompt 3).
//
// PERCHÉ ESISTE. Prima di questo modulo l'unica geografia che sopravviveva al feed era la
// stringa di VISUALIZZAZIONE `Property.zone` ("Tradate (VA)"), e quella stessa stringa veniva
// usata come CHIAVE di lettura dei fatti d'area. Due difetti in uno:
//
//   • il `<Zona>` del gestionale (la frazione: "Abbiate Guazzone", "Ceppine") veniva LETTO dal
//     parser e poi buttato via dal normalizzatore. Due immobili in due frazioni diverse dello
//     stesso comune erano indistinguibili, quindi non potevano ricevere contesto locale diverso;
//   • una chiave di database non può essere un'etichetta da mostrare. "Tradate (VA)", "Tradate",
//     "TRADATE" e "Tradate " sono la stessa area e quattro chiavi diverse.
//
// Da qui la separazione, applicata ovunque: **etichetta** (si mostra) e **chiave** (si confronta,
// si indicizza, si salva) sono due campi distinti e non intercambiabili.
//
// FORMA DELLA CHIAVE — cinque segmenti posizionali separati da `|`:
//
//     paese | regione | provincia | comune | quartiere
//     it    | lombardia | va      | tradate | abbiate-guazzone
//
// I segmenti mancanti restano VUOTI, non si accorciano: `it|||tradate|` è un comune senza
// provincia/regione note, e resta distinguibile da qualunque altra cosa. Una chiave accorciata
// avrebbe fatto collidere posizioni diverse.
//
// COSA QUESTO MODULO NON FA: non indovina. Se il comune non è nel registro, la provincia e la
// regione NON vengono dedotte dal nome, dal CAP o dalla vicinanza: restano assenti e la voce
// esce con una segnalazione di revisione. Un comune ambiguo ("Venegono", che è due comuni) non
// viene risolto a caso: viene segnalato. È la stessa regola dei fatti d'area — in mancanza di
// evidenza si dichiara l'assenza, non si riempie il vuoto.

// ─────────────────────────────────────────────────────────────
// Normalizzazione delle chiavi
// ─────────────────────────────────────────────────────────────

/**
 * Slug canonico di un nome di località: la forma con cui si CONFRONTA e si INDICIZZA.
 *
 * Deterministica su tutto ciò che i feed italiani producono davvero:
 *   "Tradate (VA)"        → "tradate"        (via il suffisso provincia tra parentesi)
 *   "  VENEGONO   SUP. "  → "venegono-sup"   (spazi collassati, minuscolo)
 *   "Sant'Ambrogio"       → "sant-ambrogio"  (apostrofo = separatore)
 *   "Gornate-Olona"       → "gornate-olona"
 *   "Cassano Magnago"     → "cassano-magnago"
 *   "Brissago‑Valtravaglia" → "brissago-valtravaglia"  (trattino unicode)
 *
 * Gli accenti si rimuovono per DECOMPOSIZIONE (NFD) e non con una tabella di sostituzione: così
 * "Cerro Maggiore" e "Cerrò Maggiore" collassano sulla stessa chiave senza che nessuno debba
 * prevedere la coppia. L'etichetta da mostrare conserva ovviamente gli accenti: è un altro campo.
 */
export function areaSlug(value: string | undefined | null): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/\s*\([^)]*\)\s*$/, "") // "(VA)", "(Varese)" e simili in coda
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // segni diacritici scorporati da NFD
    .replace(/[^a-z0-9]+/g, "-") // apostrofi, punti, spazi, trattini unicode → "-"
    .replace(/^-+|-+$/g, "");
}

/** I cinque segmenti di una chiave d'area. Tutti opzionali tranne il paese. */
export interface AreaKeyParts {
  /** ISO 3166-1 alpha-2 minuscolo. Oggi sempre "it". */
  country: string;
  /** Regione, slug ("lombardia"). Assente se non nota. */
  region?: string;
  /** Sigla provincia, slug minuscolo ("va"). Assente se non nota. */
  province?: string;
  /** Comune, slug ("tradate"). Assente solo se il feed non dà il comune. */
  municipality?: string;
  /** Frazione/quartiere, slug ("abbiate-guazzone"). Assente se il feed non dà la zona. */
  neighbourhood?: string;
}

const AREA_KEY_SEPARATOR = "|";

/**
 * Compone la chiave canonica. I valori vengono ri-slugificati qui dentro, così è impossibile
 * costruire una chiave con dentro un'etichetta.
 */
export function buildAreaKey(parts: AreaKeyParts): string {
  return [
    areaSlug(parts.country) || "it",
    areaSlug(parts.region),
    areaSlug(parts.province),
    areaSlug(parts.municipality),
    areaSlug(parts.neighbourhood),
  ].join(AREA_KEY_SEPARATOR);
}

/** Scompone una chiave canonica. I segmenti vuoti tornano `undefined`, non stringa vuota. */
export function parseAreaKey(key: string): AreaKeyParts {
  const [country = "", region = "", province = "", municipality = "", neighbourhood = ""] =
    String(key).split(AREA_KEY_SEPARATOR);
  return {
    country: country || "it",
    region: region || undefined,
    province: province || undefined,
    municipality: municipality || undefined,
    neighbourhood: neighbourhood || undefined,
  };
}

/**
 * La chiave del COMUNE a partire da una chiave qualsiasi: si azzera il solo segmento quartiere.
 *
 * Serve al riuso del profilo d'area: due frazioni dello stesso comune condividono i fatti a
 * scala comunale (municipio, stazione, ospedale) e si distinguono solo su quelli a scala di
 * quartiere. Senza questa funzione ogni frazione ricomincerebbe la ricerca da zero.
 */
export function municipalityAreaKey(key: string): string {
  return buildAreaKey({ ...parseAreaKey(key), neighbourhood: undefined });
}

/** true se la chiave nomina un quartiere (e non solo un comune). */
export function isNeighbourhoodKey(key: string): boolean {
  return parseAreaKey(key).neighbourhood !== undefined;
}

// ─────────────────────────────────────────────────────────────
// Registro dei comuni — tabella CONTROLLATA, non una deduzione
// ─────────────────────────────────────────────────────────────

/** Una voce del registro: l'unico posto da cui possono venire provincia e regione. */
export interface MunicipalityRegistryEntry {
  /** Etichetta da mostrare, con accenti e maiuscole corrette. */
  label: string;
  /** Sigla provincia ("VA"). */
  provinceCode: string;
  /** Nome esteso provincia ("Varese"). */
  province: string;
  /** Regione ("Lombardia"). */
  region: string;
  /**
   * Frazioni RICONOSCIUTE: slug → etichetta. Non è un elenco chiuso — una zona del feed che non
   * compare qui viene comunque conservata, con una segnalazione perché qualcuno la confermi.
   */
  neighbourhoods?: Readonly<Record<string, string>>;
  /** Da dove viene questa riga. Obbligatoria: una riga senza provenienza non è verificabile. */
  source: string;
}

/**
 * REGISTRO DEI COMUNI. Volutamente PICCOLO.
 *
 * Contiene i quattro comuni del pilota — gli stessi di ADR-001 e di
 * `PILOT_MUNICIPALITIES` — perché sono gli unici la cui collocazione amministrativa questo
 * repository già afferma altrove: la sede dell'agenzia è "21049 Tradate (VA)" (app/lib/site.ts)
 * e il pilota territoriale è dichiarato sui quattro comuni dell'ADR.
 *
 * NON è stato riempito con gli altri ~30 comuni presenti in `COMUNI_COORDS`, e la ragione è la
 * regola di questo progetto, non pigrizia: provincia e regione di un comune sono FATTI
 * GEOGRAFICI, e qui i fatti entrano con una fonte e una revisione, non a memoria. Alcuni sono
 * anche genuinamente controintuitivi — "Locate Varesino" non è in provincia di Varese — ed è
 * esattamente il tipo di riga che va confermata da un elenco ufficiale, non indovinata.
 *
 * COME SI AMPLIA: si aggiunge la riga con `source` che punta all'elenco ufficiale usato
 * (es. l'elenco dei comuni ISTAT, o la pagina del Comune). Finché una riga manca, gli immobili
 * di quel comune restano perfettamente funzionanti: la chiave d'area si costruisce lo stesso a
 * livello di comune, provincia e regione restano vuote, e la coda di revisione lo segnala.
 */
export const MUNICIPALITY_REGISTRY: Readonly<Record<string, MunicipalityRegistryEntry>> = {
  tradate: {
    label: "Tradate",
    provinceCode: "VA",
    province: "Varese",
    region: "Lombardia",
    neighbourhoods: {
      "abbiate-guazzone": "Abbiate Guazzone",
      ceppine: "Ceppine",
    },
    source: "app/lib/site.ts (sede dell'agenzia: 21049 Tradate VA) · docs/adr/001-territorial-enrichment.md",
  },
  "venegono-superiore": {
    label: "Venegono Superiore",
    provinceCode: "VA",
    province: "Varese",
    region: "Lombardia",
    source: "docs/adr/001-territorial-enrichment.md (comuni del pilota)",
  },
  "venegono-inferiore": {
    label: "Venegono Inferiore",
    provinceCode: "VA",
    province: "Varese",
    region: "Lombardia",
    source: "docs/adr/001-territorial-enrichment.md (comuni del pilota)",
  },
  "lonate-ceppino": {
    label: "Lonate Ceppino",
    provinceCode: "VA",
    province: "Varese",
    region: "Lombardia",
    source: "docs/adr/001-territorial-enrichment.md (comuni del pilota)",
  },
};

/**
 * ALIAS SICURI: varianti di scrittura che indicano SENZA AMBIGUITÀ un comune del registro.
 *
 * Solo abbreviazioni e forme che non possono voler dire altro. "Venegono" da solo NON è qui:
 * sono due comuni distinti, e sceglierne uno sarebbe indovinare — vedi AMBIGUOUS_LOCALITIES.
 */
export const LOCALITY_ALIASES: Readonly<Record<string, string>> = {
  "venegono-sup": "venegono-superiore",
  "venegono-superiore-va": "venegono-superiore",
  "venegono-inf": "venegono-inferiore",
  "venegono-inferiore-va": "venegono-inferiore",
  "tradate-va": "tradate",
};

/**
 * LOCALITÀ AMBIGUE: un nome, più comuni possibili. Non si risolvono mai in automatico.
 *
 * Ogni voce produce una segnalazione con l'elenco dei candidati, così chi rivede sceglie
 * conoscendo le alternative invece di scoprire mesi dopo che metà degli immobili di Venegono
 * erano stati assegnati al comune sbagliato.
 */
export const AMBIGUOUS_LOCALITIES: Readonly<Record<string, readonly string[]>> = {
  venegono: ["venegono-superiore", "venegono-inferiore"],
};

/**
 * FRAZIONI NOTE che i gestionali scrivono a volte nel campo *Comune* invece che nel campo *Zona*.
 *
 * `COMUNI_COORDS` (app/lib/geo/comuni.ts) contiene già "abbiate guazzone" trattata come se fosse
 * un comune: è una frazione di Tradate. Se il feed la mette nel campo Comune, questo modulo NON
 * la promuove a comune — la riconosce come frazione, la sposta al segmento giusto della chiave e
 * lo segnala.
 */
export const KNOWN_FRAZIONI: Readonly<Record<string, { municipality: string; label: string }>> = {
  "abbiate-guazzone": { municipality: "tradate", label: "Abbiate Guazzone" },
};

// ─────────────────────────────────────────────────────────────
// Risoluzione
// ─────────────────────────────────────────────────────────────

/** Perché una voce va guardata da un umano. Nessuno di questi codici blocca la pubblicazione
    dell'immobile: bloccano l'uso della sua area come chiave di contenuti verificati. */
export type AreaIdentityReviewCode =
  /** Il feed non dà il comune: senza, non c'è area. */
  | "municipality-missing"
  /** Comune valido ma non nel registro: provincia e regione restano vuote. */
  | "municipality-not-in-registry"
  /** Il nome corrisponde a più comuni: nessuno viene scelto. */
  | "municipality-ambiguous"
  /** Nel campo Comune è arrivata una frazione nota: spostata al segmento quartiere. */
  | "municipality-is-frazione"
  /** Zona presente ma non ancora confermata nel registro del comune. */
  | "neighbourhood-not-in-registry"
  /** CAP presente ma non è un CAP italiano (5 cifre): scartato, non corretto. */
  | "postal-code-invalid";

export interface AreaIdentityReview {
  code: AreaIdentityReviewCode;
  /** Il valore GREZZO che ha provocato la segnalazione, per diagnosticare senza rileggere il feed. */
  value: string;
  /** Alternative possibili, quando il codice è "municipality-ambiguous". */
  candidates?: readonly string[];
}

/** Quanto è fine la collocazione ottenuta. Non dice nulla su DOVE stia la casa nel comune. */
export type AreaPrecision = "neighbourhood" | "municipality" | "unresolved";

/** Ciò che il gestionale offre sulla collocazione, già ripulito dai segnaposto ("N/D" → assente). */
export interface RawAreaInput {
  /** <Comune>. */
  municipality?: string;
  /** <Zona>: frazione/quartiere. */
  neighbourhood?: string;
  /** <Provincia> — nel feed reale arriva vuota, ma il contratto la prevede. */
  province?: string;
  /** <CAP>. */
  postalCode?: string;
}

/** L'identità geografica risolta: etichette da mostrare, chiavi da confrontare, segnalazioni. */
export interface AreaIdentity {
  /** Chiave canonica a cinque segmenti. Sempre presente (al limite `it||||`). */
  areaKey: string;
  /** Chiave del solo comune: due frazioni dello stesso comune la condividono. */
  municipalityAreaKey: string;
  municipalityKey?: string;
  /** Etichetta del comune: quella del registro se c'è (accenti/maiuscole corrette), altrimenti
      quella del feed ripulita. Mai la chiave. */
  municipalityLabel?: string;
  neighbourhoodKey?: string;
  neighbourhoodLabel?: string;
  provinceCode?: string;
  provinceLabel?: string;
  region?: string;
  postalCode?: string;
  precision: AreaPrecision;
  review: AreaIdentityReview[];
}

/** Ripulisce e collassa gli spazi. I segnaposto ("N/D") li ha già tolti chi chiama. */
function tidy(value: string | undefined): string | undefined {
  const t = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  return t.length > 0 ? t : undefined;
}

/** CAP italiano: esattamente cinque cifre. Tutto il resto si scarta, non si aggiusta. */
function validPostalCode(value: string | undefined): string | undefined {
  return value !== undefined && /^\d{5}$/.test(value) ? value : undefined;
}

/**
 * Dalla località grezza del gestionale all'identità canonica.
 *
 * PURA e senza eccezioni: qualunque input produce un'identità: al peggio `unresolved` con la
 * segnalazione che dice perché. Un annuncio con la geografia sporca non deve mai far cadere il
 * catalogo — deve finire in coda di revisione restando pubblicabile.
 */
export function resolveAreaIdentity(raw: RawAreaInput): AreaIdentity {
  const review: AreaIdentityReview[] = [];

  const rawMunicipality = tidy(raw.municipality);
  const rawNeighbourhood = tidy(raw.neighbourhood);

  const postalCode = validPostalCode(tidy(raw.postalCode));
  if (raw.postalCode !== undefined && tidy(raw.postalCode) && !postalCode) {
    review.push({ code: "postal-code-invalid", value: String(raw.postalCode) });
  }

  // Senza comune non esiste area: si esce subito, con la chiave "vuota" ben formata.
  if (!rawMunicipality) {
    review.push({ code: "municipality-missing", value: "" });
    const areaKey = buildAreaKey({ country: "it" });
    return {
      areaKey,
      municipalityAreaKey: areaKey,
      postalCode,
      precision: "unresolved",
      review,
    };
  }

  let municipalityKey = areaSlug(rawMunicipality);
  let municipalityLabel = rawMunicipality;
  let neighbourhoodKey = areaSlug(rawNeighbourhood);
  let neighbourhoodLabel = rawNeighbourhood;

  // 1) Alias sicuro → chiave canonica. Solo forme non ambigue.
  const alias = LOCALITY_ALIASES[municipalityKey];
  if (alias) municipalityKey = alias;

  // 2) Nome ambiguo → non si sceglie. Si segnala con i candidati e si resta senza comune.
  const ambiguous = AMBIGUOUS_LOCALITIES[municipalityKey];
  if (ambiguous) {
    review.push({
      code: "municipality-ambiguous",
      value: rawMunicipality,
      candidates: ambiguous,
    });
    const areaKey = buildAreaKey({ country: "it" });
    return {
      areaKey,
      municipalityAreaKey: areaKey,
      postalCode,
      precision: "unresolved",
      review,
    };
  }

  // 3) Frazione nota finita nel campo Comune → si sposta al segmento giusto, non si promuove.
  //    Se il feed dava GIÀ una zona, quella vince: è più specifica di quanto sappiamo noi.
  const frazione = KNOWN_FRAZIONI[municipalityKey];
  if (frazione) {
    review.push({ code: "municipality-is-frazione", value: rawMunicipality });
    if (!neighbourhoodKey) {
      neighbourhoodKey = municipalityKey;
      neighbourhoodLabel = frazione.label;
    }
    municipalityKey = frazione.municipality;
    municipalityLabel = MUNICIPALITY_REGISTRY[frazione.municipality]?.label ?? frazione.municipality;
  }

  // 4) Registro: l'UNICA fonte di provincia e regione. Fuori dal registro restano vuote.
  const entry = MUNICIPALITY_REGISTRY[municipalityKey];
  if (entry) {
    municipalityLabel = entry.label; // accenti e maiuscole corrette, non quelle del feed
    if (neighbourhoodKey) {
      const known = entry.neighbourhoods?.[neighbourhoodKey];
      if (known) neighbourhoodLabel = known;
      else review.push({ code: "neighbourhood-not-in-registry", value: neighbourhoodLabel! });
    }
  } else {
    review.push({ code: "municipality-not-in-registry", value: rawMunicipality });
    if (neighbourhoodKey) {
      review.push({ code: "neighbourhood-not-in-registry", value: neighbourhoodLabel! });
    }
  }

  const parts: AreaKeyParts = {
    country: "it",
    region: entry?.region,
    province: entry?.provinceCode,
    municipality: municipalityKey,
    neighbourhood: neighbourhoodKey || undefined,
  };

  return {
    areaKey: buildAreaKey(parts),
    municipalityAreaKey: buildAreaKey({ ...parts, neighbourhood: undefined }),
    municipalityKey,
    municipalityLabel,
    neighbourhoodKey: neighbourhoodKey || undefined,
    neighbourhoodLabel: neighbourhoodKey ? neighbourhoodLabel : undefined,
    provinceCode: entry?.provinceCode,
    provinceLabel: entry?.province,
    region: entry?.region,
    postalCode,
    precision: neighbourhoodKey ? "neighbourhood" : "municipality",
    review,
  };
}

/**
 * L'etichetta pubblica dell'area: il quartiere quando c'è, altrimenti il comune.
 *
 * È il testo che la sezione "Vivere in zona" mette nel titolo ("Vivere in Abbiate Guazzone" /
 * "Vivere a Tradate"). `null` quando non c'è nulla di dichiarabile — e allora la sezione non
 * compare, invece di intestarsi a un'area che non sappiamo nominare.
 */
export function publicAreaLabel(identity: AreaIdentity): string | null {
  return identity.neighbourhoodLabel ?? identity.municipalityLabel ?? null;
}
