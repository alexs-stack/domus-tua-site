// Helper puro per costruire un URL WhatsApp precompilato (wa.me / api.whatsapp.com).
//
// MVP del lead capture: nessun backend. Al submit il form apre WhatsApp con il messaggio
// già scritto (vedi `formatLeadMessage` in ./lead.ts). Questo helper si limita a inserire
// in modo sicuro il messaggio nel parametro `?text=`, preservando il resto dell'URL.

/**
 * Restituisce `baseHref` con il parametro `text` impostato a `message`
 * (correttamente URL-encoded). Se un `?text=` è già presente viene sostituito,
 * altrimenti viene aggiunto. Gli altri eventuali parametri di query restano intatti.
 *
 * Funzione PURA: nessun side effect, nessun accesso a `window`.
 *
 * @param baseHref URL WhatsApp di partenza (es. `site.whatsapp.href`).
 * @param message  Testo del messaggio in chiaro (verrà codificato con encodeURIComponent).
 */
export function buildWhatsAppUrl(baseHref: string, message: string): string {
  const encoded = encodeURIComponent(message);

  // Separiamo l'eventuale fragment (#...) per non corromperlo.
  const hashIndex = baseHref.indexOf("#");
  const hash = hashIndex >= 0 ? baseHref.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? baseHref.slice(0, hashIndex) : baseHref;

  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const query = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";

  // Ricostruiamo i parametri escludendo un eventuale `text` preesistente.
  const params = query
    .split("&")
    .filter((pair) => pair.length > 0 && !/^text=/i.test(pair));

  params.push(`text=${encoded}`);

  return `${path}?${params.join("&")}${hash}`;
}
