// Normalizzazione: da RealSmartListingRaw (forma grezza gestionale) a NormalizedProperty
// (forma pulita usata dal sito). Funzione PURA e difensiva: nessun side effect, nessuna
// eccezione su campi mancanti. Se il feed reale userà nomi diversi, si adatta qui la mappatura.

import { normalizeDescription, buildExcerpt } from "./description";
import { redactParagraphs } from "./privacy";
import { quarantineParagraphs } from "./placeholders";
import { factsFromDescription, factsFromFields, mergeFacts } from "./facts";
import { splitDescription } from "./descriptionSplit";
import { getListingOverride } from "./overrides.data";
import { applyRemovals, overrideFacts } from "./overrides";
import { cleanField, validateListing } from "./validate";
import { applyAiNormalization, type AiNormalizer } from "./aiNormalizer";
import type {
  ContractType,
  ListingStatus,
  NormalizedImage,
  NormalizedProperty,
  RealSmartListingRaw,
  RealSmartMedia,
} from "./types";

const VALID_STATUSES: ReadonlySet<string> = new Set<ListingStatus>([
  "draft",
  "published",
  "reserved",
  "sold",
  "withdrawn",
]);

// Formatter it-IT riusabile (separatore migliaia ".", nessun decimale).
const priceFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** Converte in numero un valore che può essere number, stringa "420.000" o undefined. */
function toNumber(value: number | string | undefined | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    // Rimuove tutto ciò che non è cifra (punti migliaia, "€", "m²", spazi, ecc.).
    const digits = value.replace(/[^\d]/g, "");
    if (digits.length === 0) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * Rende URL-safe il codice RealSmart preservandone la forma (maiuscole incluse):
 * lo slug dell'immobile È il suo codice univoco. Sostituisce solo i caratteri non
 * ammessi in un segmento di path con un trattino; ripiega sul codice grezzo nel
 * caso-limite di un codice fatto di soli simboli (mai visto nel feed reale).
 */
function codeSlug(codice: string): string {
  const cleaned = codice
    .trim()
    .replace(/[^A-Za-z0-9-]+/g, "-") // spazi/simboli → trattino
    .replace(/^-+|-+$/g, "") // trim dei trattini
    .replace(/-{2,}/g, "-"); // collassa trattini multipli
  return cleaned.length > 0 ? cleaned : codice.trim();
}

/**
 * Rende sentence-case un titolo che arriva quasi tutto in MAIUSCOLO dal feed
 * (es. "TERRENO EDIFICABILE A 5 MIN. DAL CENTRO"). Si attiva SOLO quando almeno
 * il 70% delle lettere è maiuscolo: i titoli già in mixed-case restano intatti.
 * Minuscolizza tutto, poi capitalizza la prima lettera della stringa e la prima
 * lettera dopo ogni terminatore di frase (. ! ?).
 */
function titleize(input: string): string {
  const letters = input.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return input;

  const upper = letters.filter((ch) => ch !== ch.toLowerCase()).length;
  // Se meno del 70% delle lettere è maiuscolo, il titolo è già mixed-case: non tocchiamo nulla.
  if (upper / letters.length < 0.7) return input;

  const lowered = input.toLowerCase();
  // Capitalizza la prima lettera della stringa e la prima lettera dopo . ! ?
  return lowered.replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_match, prefix, letter) => {
    return prefix + (letter as string).toUpperCase();
  });
}

/** Normalizza il contratto: default "vendita" se assente/non riconosciuto. */
function normalizeContract(raw: string | undefined): ContractType {
  return raw?.toLowerCase() === "affitto" ? "affitto" : "vendita";
}

/**
 * Normalizza lo stato. Uno stato assente/non riconosciuto NON deve pubblicare per errore
 * (rischio: mostrare un immobile venduto): default "draft" (nascosto dalla lista pubblica).
 * Mappare gli stati reali del feed RealSmart prima del go-live.
 */
function normalizeStatus(raw: string | undefined): ListingStatus {
  if (raw && VALID_STATUSES.has(raw)) {
    return raw as ListingStatus;
  }
  return "draft";
}

/** Ordina i media per `ordine` crescente (undefined in coda) mantenendo stabilità. */
function sortMedia(media: readonly RealSmartMedia[]): RealSmartMedia[] {
  return media
    .map((m, index) => ({ m, index }))
    .sort((a, b) => {
      const oa = typeof a.m.ordine === "number" ? a.m.ordine : Number.MAX_SAFE_INTEGER;
      const ob = typeof b.m.ordine === "number" ? b.m.ordine : Number.MAX_SAFE_INTEGER;
      if (oa !== ob) return oa - ob;
      return a.index - b.index; // fallback: ordine di arrivo
    })
    .map((entry) => entry.m);
}

/** Deriva i badge editoriali da stato + caratteristiche. */
function deriveBadges(
  status: ListingStatus,
  features: readonly string[],
  contract: ContractType,
): string[] {
  const badges: string[] = [];

  // Badge di stato prioritari.
  if (status === "reserved") badges.push("Sotto proposta");
  if (status === "sold") badges.push(contract === "affitto" ? "Affittato" : "Venduto");
  if (status === "withdrawn") badges.push("Ritirato");

  // Badge derivati dalle caratteristiche (match case-insensitive).
  const lower = features.map((f) => f.toLowerCase());
  const has = (needle: string) => lower.some((f) => f.includes(needle));

  if (has("esclusiv")) badges.push("In esclusiva");
  if (has("virtual") || has("tour")) badges.push("Virtual tour");
  if (has("open domus")) badges.push("Open Domus");
  // NB: il badge "Documenti verificati" NON si deduce più dal testo di marketing (era
  // has("document") && has("verific")): è un'affermazione sul singolo immobile e si abilita
  // solo con evidenza esplicita (override docVerified), aggiunta in normalizeRealSmartListing.

  // Deduplica preservando l'ordine.
  return Array.from(new Set(badges));
}

/**
 * Normalizza un singolo media raw in immagine.
 * L'alt viene valorizzato SOLO se il gestionale fornisce una didascalia vera: un alt di ripiego
 * identico su tutte le foto dell'immobile è peso morto nella cache condivisa.
 */
function toImage(media: RealSmartMedia): NormalizedImage {
  const caption = media.didascalia?.trim();
  return caption && caption.length > 0 ? { src: media.url, alt: caption } : { src: media.url };
}

/**
 * Normalizza un annuncio grezzo RealSmart nella forma pulita del sito.
 * Difensiva: gestisce campi mancanti senza lanciare eccezioni.
 */
export function normalizeRealSmartListing(raw: RealSmartListingRaw): NormalizedProperty {
  // Campi testuali passano TUTTI da cleanField: trim + i segnaposto ("N/D", "-",
  // "da definire"…) diventano assenti, mai dati (vedi ./validate.ts).
  const title = cleanField(raw.titolo) ?? "";
  const town = cleanField(raw.localita?.comune) ?? "";
  const province = cleanField(raw.localita?.provincia) ?? "";
  // Zona/quartiere: la si porta avanti SOLO se il feed la dichiara (l'agenzia l'ha già resa
  // pubblica). Alimenta la precisione d'origine per zona; non è un indirizzo e non lo sostituisce.
  const zoneName = cleanField(raw.localita?.zona);
  const typology = cleanField(raw.tipologia);
  const energyClass = cleanField(raw.classeEnergetica);
  const floorValue = cleanField(typeof raw.piano === "number" ? String(raw.piano) : raw.piano);

  const contract = normalizeContract(raw.contratto);
  const status = normalizeStatus(raw.statoPubblicazione);

  const price = toNumber(raw.prezzo);
  const priceLabel = price > 0 ? priceFormatter.format(price) : "Prezzo su richiesta";

  const features = (raw.caratteristiche ?? [])
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  // Slug = codice univoco RealSmart (es. "2079", "T123"), fedele al sistema
  // originale del gestionale: annunci.domustua.com/case/<codice>. NON è un testo
  // derivato da titolo/comune. Il codice è tenuto VERBATIM (maiuscole comprese: il
  // vecchio sito serviva /case/T123, non /case/t123); si sanificano solo i caratteri
  // non-URL, e il fallback copre l'improbabile codice fatto di soli simboli.
  const slug = codeSlug(raw.codice);

  // Media → solo foto per la gallery del sito, ordinate.
  const images: NormalizedImage[] = sortMedia(raw.media ?? [])
    .filter((m) => m.tipo === undefined || m.tipo === "foto")
    .map(toImage);

  const addressRaw = cleanField(raw.localita?.indirizzo);

  // Override manuale approvato: è la fonte con priorità massima (vedi ./overrides.ts).
  const override = getListingOverride(raw.codice);

  // Privacy-first: l'indirizzo civico si pubblica SOLO se un override lo autorizza. È una policy,
  // decisa qui una volta e applicata a ogni output (testo compreso), non un dettaglio di rendering.
  const showAddress = override?.mostraIndirizzo === true;

  // Descrizione: una sola normalizzazione, riusata da paragrafi, estratto ed estrazione fatti.
  // Se il cliente ci ha fornito un testo approvato, quello sostituisce integralmente il feed.
  const description = normalizeDescription(raw.descrizione);
  const sourceParagraphs = override?.descrizione ?? description.paragraphs;

  // REDAZIONE PRIVACY DETERMINISTICA (app/lib/realsmart/privacy.ts). Applicata PRIMA di estrarre
  // fatti/estratto, così indirizzi civici (se showAddress=false) e telefoni non escono da nessun
  // output pubblico. Il comune sostituisce l'indirizzo redatto, preservando il contesto di zona.
  // `sourceAddress` è l'indirizzo strutturato del gestionale: alimenta il layer a più alta
  // precisione (redazione dell'indirizzo NOTO e delle sue varianti), oltre al pattern generico.
  const redactedParagraphs = redactParagraphs(sourceParagraphs, {
    showAddress,
    comune: town,
    sourceAddress: addressRaw,
  }).paragraphs;

  // QUARANTENA SEGNAPOSTO (app/lib/realsmart/placeholders.ts). Un «____» non compilato non deve mai
  // finire in pagina: si toglie la frase-misura incompleta (senza inventare la misura). Il segnale
  // viaggia su `placeholderQuarantined` e fa fallire l'audit — la correzione vera è alla fonte/override.
  const quarantine = quarantineParagraphs(redactedParagraphs);
  const paragraphs = quarantine.paragraphs;
  const placeholderQuarantined = quarantine.quarantined > 0;

  // Fatti strutturati, in ordine di priorità: campo esplicito RealSmart > descrizione.
  // Gli override manuali approvati si innestano davanti a tutto in ./overrides.ts.
  const fieldFacts = factsFromFields({
    tipologia: typology,
    contratto: contract,
    mq: toNumber(raw.mq),
    locali: toNumber(raw.locali),
    camere: toNumber(raw.camere), // MAI dedotte da "locali - 1"
    bagni: toNumber(raw.bagni),
    piano: floorValue,
    classeEnergetica: energyClass,
    statoAttestatoEnergetico: raw.statoAttestatoEnergetico,
    dettagli: raw.dettagli,
  });
  const descriptionFacts = factsFromDescription(paragraphs);

  // override > campo RealSmart > descrizione; poi si tolgono le chiavi non pubblicabili.
  const facts = applyRemovals(
    mergeFacts(overrideFacts(override), fieldFacts, descriptionFacts.facts),
    override,
  );

  // I fatti pubblicati decidono quali righe telegrafiche possono uscire dal testo.
  const split = splitDescription(paragraphs, facts);

  // Evidenza esplicita del protocollo D.O.C. su QUESTO immobile: SOLO dall'override manuale
  // (con fonte/data/autore), mai dedotta dal testo di marketing. Abilita l'affermazione
  // "verificata" sulla scheda e il badge "Documenti verificati".
  const docVerified = override?.docVerified === true;
  const derivedBadges = deriveBadges(status, features, contract);
  const verifiedBadges = docVerified ? [...derivedBadges, "Documenti verificati"] : derivedBadges;
  const badges = raw.inEvidenza
    ? Array.from(new Set(["In evidenza", ...verifiedBadges]))
    : Array.from(new Set(verifiedBadges));

  const property: NormalizedProperty = {
    id: raw.codice,
    slug,
    title: titleize(title),
    // In pagina va la sola narrativa: le righe interamente tecniche vivono nei box.
    descriptionParagraphs: split.narrativeParagraphs,
    structuredFactLines: split.structuredFactLines.map((l) => l.line),
    keptFactLines: split.keptFactLines,
    contentPreservation: split.contentPreservation,
    // true se una frase-segnaposto è stata messa in quarantena: l'audit lo trasforma in FAIL.
    placeholderQuarantined,
    // Estratto (card, meta description, JSON-LD): DERIVATO dal corpo GIÀ redatto (`paragraphs`),
    // non dall'estratto del feed. Due conseguenze volute:
    //   • se un override sostituisce il corpo, l'estratto nasce dal testo approvato — scheda e meta
    //     description non mostrano più due testi diversi (era la incoerenza estratto/override);
    //   • l'estratto è per costruzione un sottoinsieme del corpo redatto: non può contenere un
    //     indirizzo/telefono che il corpo non contiene già.
    excerpt: buildExcerpt(paragraphs),
    price,
    priceLabel,
    contract,
    type: typology ?? "Immobile",
    town,
    province,
    ...(zoneName ? { zoneName } : {}),
    address: addressRaw,
    // Privacy-first: l'indirizzo civico si pubblica solo se un override lo autorizza.
    // `showAddress` è la const decisa una volta sopra (riusata dalla redazione dei paragrafi/estratto).
    showAddress,
    docVerified,
    sqm: toNumber(raw.mq),
    rooms: toNumber(raw.locali),
    bedrooms: toNumber(raw.camere),
    baths: toNumber(raw.bagni),
    floor: floorValue,
    energyClass,
    features,
    facts,
    factsReview: descriptionFacts.review,
    images,
    status,
    badges,
    publishedAt: raw.dataPubblicazione?.trim() ?? "",
    updatedAt: raw.dataAggiornamento?.trim() ?? "",
    sourceRef: {
      codice: raw.codice,
      riferimento: cleanField(raw.riferimento),
    },
    // Default e unica strada oggi: la normalizzazione è deterministica.
    // L'eventuale passo AI (opzionale, spento) lo riscrive in applyAiNormalization.
    normalizedBy: "deterministic",
  };

  // Avvisi deterministici sui dati sospetti (audit/go-live, mai in pagina).
  const warnings = validateListing(property, raw);
  return warnings.length > 0 ? { ...property, warnings } : property;
}

/**
 * Normalizza un LOTTO di annunci con ISOLAMENTO DEGLI ERRORI: un singolo record
 * malformato che facesse lanciare `normalizeRealSmartListing` viene SCARTATO
 * (mai un catalogo vuoto per un record rotto), gli altri passano. Restituisce
 * anche i grezzi scartati, per diagnostica.
 *
 * `ai` è iniettabile: di norma `null` (deterministico, il default); un provider
 * (reale o finto nei test) migliora ogni record con fallback sicuro.
 */
export async function normalizeListings(
  raw: readonly RealSmartListingRaw[],
  ai: AiNormalizer | null = null,
): Promise<{ listings: NormalizedProperty[]; skipped: RealSmartListingRaw[] }> {
  const listings: NormalizedProperty[] = [];
  const skipped: RealSmartListingRaw[] = [];
  for (const r of raw) {
    try {
      let n = normalizeRealSmartListing(r);
      if (ai) n = await applyAiNormalization(n, r, ai);
      listings.push(n);
    } catch (err) {
      skipped.push(r);
      console.error(
        `[realsmart] annuncio ${r?.codice ?? "(codice ignoto)"} scartato — normalizzazione fallita:`,
        err instanceof Error ? err.message : "errore",
      );
    }
  }
  return { listings, skipped };
}
