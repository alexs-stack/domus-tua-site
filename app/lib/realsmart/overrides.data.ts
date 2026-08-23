// ═══════════════════════════════════════════════════════════════════════════
// UNICA FONTE degli override manuali degli immobili.
//
// Qui dentro finiscono SOLO le informazioni che l'agenzia ci comunica e che abbiamo
// verificato: RealSmart resta la fonte principale, questo file gestisce le eccezioni.
//
// COME SI AGGIUNGE UNA MODIFICA → docs/realsmart-overrides.md
//
// In sintesi:
//   1. si parte dal CODICE RealSmart dell'immobile (<Codice>, es. "2055"), non dal titolo;
//   2. si compilano SEMPRE motivo, fonte, data (YYYY-MM-DD) e autore;
//   3. si esegue `npm run check`: un override sbagliato fa fallire la build, non la pagina.
//
// SERVER-ONLY: questo file non deve mai finire nel bundle del browser. La guardia sotto lo
// rende esplicito — se un import client lo trascinasse dentro, l'errore arriva subito.
// ═══════════════════════════════════════════════════════════════════════════

import { indexOverrides, type ListingOverride } from "./overrides";

if (typeof window !== "undefined") {
  throw new Error(
    "[realsmart/overrides] questo modulo è server-only: leggi gli immobili dalla facciata " +
      "app/lib/listings.ts, mai il file degli override.",
  );
}

/**
 * Override attivi in produzione.
 *
 * Nessun contenuto demo, nessun immobile di esempio: gli esempi vivono solo nelle fixture di
 * test (app/lib/realsmart/__tests__/overrides.test.ts). Qui entra solo ciò che è stato deciso.
 */
const OVERRIDES: ListingOverride[] = [
  {
    // T447, l'attico duplex di Tradate. La descrizione a gestionale contiene un segnaposto mai
    // compilato — «un ampio bagno di oltre ____ mq» — scritto da qualcuno che pensava di
    // tornarci. La pipeline toglie da sola la sola frase-misura incompleta e pubblica «un ampio
    // bagno, un disimpegno con arredo e un sottoscala che funge da comodo ripostiglio»: nessun
    // «____» è mai arrivato in pagina, e nessuna misura è stata inventata.
    //
    // Questa riga non cambia una virgola di ciò che si legge sul sito: dichiara che quel testo,
    // senza la misura, è quello VOLUTO. Serviva perché finché la decisione non era registrata
    // l'audit lo trattava — giustamente — come un difetto ancora da riparare, e teneva rossa la
    // CI di ogni PR, difetto o no.
    //
    // Resta comunque nell'elenco delle cose da sistemare alla fonte: chi rientra nel gestionale
    // può completare la misura e togliere anche questa riga.
    codice: "2055",
    motivo:
      "segnaposto «____» mai compilato nella descrizione: approvata la pubblicazione senza la misura (la frase-misura incompleta viene tolta dalla pipeline, nessun dato inventato)",
    fonte: "approvazione del titolare del sito, in sessione di lavoro sul repository",
    data: "2026-08-23",
    autore: "a.serratt94@gmail.com",
    segnapostoApprovato: true,
  },
];

/** Indice codice → override. La validazione avviene qui, a import-time (quindi in build). */
export const listingOverrides = indexOverrides(OVERRIDES);

/** Override di un immobile, se esiste. */
export function getListingOverride(codice: string): ListingOverride | undefined {
  return listingOverrides.get(codice.trim());
}
