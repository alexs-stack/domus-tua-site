// Stato di approvazione dei documenti legali (Privacy Policy e Cookie Policy) — FONTE UNICA.
//
// Perché esiste. Le pagine /privacy e /cookie contengono oggi testo PLACEHOLDER, redatto per
// l'impaginazione ma NON validato da legale/DPO (finalità, basi giuridiche, tempi di
// conservazione, titolare). Finché non sono approvate:
//   • restano `noindex` (non finiscono su Google);
//   • il comando di launch-readiness (`npm run launch-check`) FALLISCE, così non si va live
//     con documenti legali provvisori.
//
// L'approvazione è un atto ESPLICITO: si imposta la variabile d'ambiente `LEGAL_DOCS_APPROVED`
// a "true" SOLO dopo che il testo definitivo, fornito e validato dal cliente/consulente, è in
// pagina. Non è `NEXT_PUBLIC_*`: la decisione non deve dipendere dal bundle del browser ed è
// letta a build-time (le pagine legali sono statiche) e dal launch-check.
//
// Nessun fatto legale è inventato qui: questo modulo governa SOLO indicizzazione e gate, non
// il contenuto. Il contenuto approvato va nelle rispettive pagine, il testo proposto e le
// domande al cliente in docs/legal-launch-inventory.md.

/**
 * true SOLO quando Privacy e Cookie Policy sono state validate e approvate (testo definitivo in
 * pagina). Default false: si parte sempre da placeholder finché non lo si imposta di proposito.
 */
export function legalDocsApproved(): boolean {
  return process.env.LEGAL_DOCS_APPROVED === "true";
}

/**
 * Direttiva robots per le pagine legali.
 * - Non approvate → `noindex, follow` (placeholder fuori dall'indice; i link restano seguibili).
 * - Approvate     → `index, follow` (indicizzabili, se è la policy SEO scelta).
 * Lo stesso meccanismo che tiene fuori il placeholder rende indicizzabile il testo finale.
 */
export function legalRobots(): { index: boolean; follow: boolean } {
  return legalDocsApproved() ? { index: true, follow: true } : { index: false, follow: true };
}
