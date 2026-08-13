// Policy SEO per le schede degli immobili VENDUTI — confine tipizzato, una sola decisione.
//
// PERCHÉ ESISTE. Oggi le schede dei venduti sono indicizzabili e finiscono nel sitemap (nel feed
// audìto ~168 su 196). Che cosa farne — tenerle indicizzate, tenerle ma noindex, redirigere, o
// dichiararle rimosse (410) — è una DECISIONE DI BUSINESS/SEO del cliente, non un'ottimizzazione
// tecnica. Questo modulo NON la sceglie: la rende ESPLICITA, tipizzata e testabile, con un default
// conservativo e reversibile, così cambiarla è una riga sola e ogni opzione ha effetti prevedibili.
//
// Le implicazioni SEO delle quattro opzioni (docs/seo-policy.md):
//  • "index"    → i venduti restano indicizzati e nel sitemap. Storia/long-tail conservata, ma
//                 pagine "esaurite" competono nell'indice e il sitemap dichiara URL non più in vendita.
//  • "noindex"  → pagina online per gli utenti (link/bookmark, banner "venduto" + correlati), ma
//                 fuori dall'indice e fuori dal sitemap. Reversibile, non rompe i link in ingresso.
//  • "redirect" → 301 verso il catalogo: consolida il segnale, ma PERDE la pagina (e i suoi backlink
//                 puntano altrove). Serve un target esplicito.
//  • "gone"     → 410: dice a Google "rimosso di proposito", deindicizza in fretta. Il più aggressivo;
//                 richiede middleware (una pagina SSG non può da sola restituire 410).
//
// DEFAULT: "noindex". È il più prudente: toglie i venduti da indice e sitemap (risolve il problema
// segnalato) senza rompere link in ingresso né buttare via la pagina. Il cliente conferma la scelta
// definitiva. Override d'ambiente `SOLD_URL_POLICY` per provarne un'altra senza deploy di codice.

export type SoldUrlPolicy = "index" | "noindex" | "redirect" | "gone";

const VALID: readonly SoldUrlPolicy[] = ["index", "noindex", "redirect", "gone"];

/** Policy attiva. Default "noindex"; override con l'env `SOLD_URL_POLICY` se valida. */
export const SOLD_URL_POLICY: SoldUrlPolicy = (() => {
  const raw = (process.env.SOLD_URL_POLICY ?? "").trim() as SoldUrlPolicy;
  return VALID.includes(raw) ? raw : "noindex";
})();

/** Dove rediriggere un venduto quando la policy è "redirect": il catalogo degli immobili. */
export const SOLD_REDIRECT_TARGET = "/acquista";

/** true se le schede dei venduti possono comparire nel sitemap (solo con policy "index"). */
export function soldEligibleForSitemap(policy: SoldUrlPolicy = SOLD_URL_POLICY): boolean {
  return policy === "index";
}

/** Direttiva robots per una scheda VENDUTA. null quando la policy non è "index"/"noindex" (il
 *  comportamento — redirect/gone — non è una questione di meta robots ma di risposta HTTP). */
export function soldRobots(
  policy: SoldUrlPolicy = SOLD_URL_POLICY,
): { index: boolean; follow: boolean } | null {
  if (policy === "index") return { index: true, follow: true };
  if (policy === "noindex") return { index: false, follow: true };
  return null; // redirect/gone: gestiti come risposta HTTP, non come meta
}

export interface SoldPageDirective {
  /** Cosa deve fare la pagina di un immobile venduto. */
  kind: SoldUrlPolicy;
  /** Presente solo per "redirect". */
  redirectTo?: string;
}

/** La direttiva completa per la pagina /case/[slug] quando l'immobile è venduto. */
export function soldPageDirective(policy: SoldUrlPolicy = SOLD_URL_POLICY): SoldPageDirective {
  return policy === "redirect"
    ? { kind: "redirect", redirectTo: SOLD_REDIRECT_TARGET }
    : { kind: policy };
}
