// Inventario dei redirect legacy (WordPress → nuovo sito) — dato UNICO, importato da next.config.ts.
//
// Estratto qui dalla config per poterlo VALIDARE e RICONCILIARE: catene, loop, doppioni di
// case/slash e — con gli export del cliente — gli URL legacy rimasti scoperti. La forma è quella
// di Next (`{ source, destination, permanent }`), così next.config lo restituisce così com'è.
//
// FORMATO DI RICONCILIAZIONE (docs/seo-redirects.md): l'inventario di partenza sono i 25 URL del
// vecchio sitemap WordPress; NON è l'indicizzato reale. Prima del go-live va incrociato con:
//  • wp-sitemap*.xml del vecchio sito,
//  • il rapporto Pagine di Search Console (ultimi 16 mesi),
//  • backlink/analytics per gli URL ad alto valore.
// `unmappedLegacyUrls()` accetta quell'elenco e dice quali non sono né redirette né rotte vive.

export interface RedirectRule {
  /** Percorso di partenza (senza slash finale: Next normalizza prima, vedi next.config). */
  source: string;
  /** Destinazione (rotta viva del nuovo sito). */
  destination: string;
  /** true = 308/301 (canonicalizzazione). Le legacy sono tutte permanenti. */
  permanent: boolean;
}

/**
 * Redirect legacy. L'ordine conta: la prima regola che combacia vince, quindi le voci puntuali
 * precedono i jolly (`:slug`). Tutte le `source` SENZA slash finale (Next normalizza prima).
 */
export const legacyRedirects: RedirectRule[] = [
  // L'indice /case non esiste più: il catalogo con la ricerca vive su /acquista.
  { source: "/case", destination: "/acquista", permanent: true },

  // ── Sito WordPress precedente (dismesso al passaggio del dominio) ──
  // Pagine di ingresso del vecchio menu.
  { source: "/cerchi-casa", destination: "/acquista", permanent: true },
  { source: "/vendi-casa", destination: "/vendi", permanent: true },

  // Servizi: Open Domus ha pagina propria; gli altri confluiscono nell'hub.
  { source: "/servizi-domus/open-domus", destination: "/open-domus", permanent: true },
  { source: "/servizi-domus/:slug", destination: "/servizi", permanent: true },
  { source: "/servizi-domus", destination: "/servizi", permanent: true },

  // Team: pagine persona + indice → /chi-siamo (che contiene il team).
  { source: "/team/:slug", destination: "/chi-siamo", permanent: true },
  { source: "/team", destination: "/chi-siamo", permanent: true },

  // Duplicato indicizzabile rimasto nel vecchio CMS ("Chi siamo – Copy").
  { source: "/chi-siamo-copy", destination: "/chi-siamo", permanent: true },

  // Tre porte verso le candidature.
  { source: "/entra-a-far-parte-del-team", destination: "/lavora-con-noi", permanent: true },
  { source: "/candidatura", destination: "/lavora-con-noi", permanent: true },
  { source: "/diventa-agente", destination: "/lavora-con-noi", permanent: true },

  // Legali: cambiano nome, non contenuto.
  { source: "/privacy-policy", destination: "/privacy", permanent: true },
  { source: "/cookies-policy", destination: "/cookie", permanent: true },

  // Sitemap del nucleo WordPress, linkato dal vecchio robots.txt e citato da strumenti terzi.
  { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
];

// ── Validazione / riconciliazione ────────────────────────────────────────────

export type RedirectIssueKind =
  | "loop" //            A→B→A
  | "chain" //           A→B e B→C (dovrebbe essere A→C: catena multi-hop)
  | "duplicate-source" // due regole per lo stesso source (case/slash a parte)
  | "self" //            source === destination
  | "unmapped-legacy"; //  URL legacy non coperto da redirect né da rotta viva

export interface RedirectIssue {
  kind: RedirectIssueKind;
  detail: string;
}

/** Normalizza un percorso per il confronto: minuscolo, senza slash finale, senza query. */
export function normalizePath(p: string): string {
  const noQuery = p.split(/[?#]/)[0];
  const noTrailing = noQuery.replace(/\/+$/, "") || "/";
  return noTrailing.toLowerCase();
}

/** Un source con `:param` è un pattern: lo riduciamo al prefisso statico per i confronti. */
function staticPrefix(source: string): string {
  return normalizePath(source.split("/:")[0]);
}

/**
 * Difetti STRUTTURALI dell'inventario redirect (indipendenti dagli export del cliente):
 * loop, catene multi-hop, source auto-referenziali, doppioni di case/slash.
 */
export function validateRedirects(rules: readonly RedirectRule[]): RedirectIssue[] {
  const issues: RedirectIssue[] = [];
  // IDENTITÀ del source = percorso completo normalizzato (con `:param` preservato): `/servizi-domus`
  // e `/servizi-domus/:slug` sono source DIVERSI (indice esatto vs jolly dei figli), non doppioni.
  const bySource = new Map<string, string>();
  const seen = new Set<string>();

  for (const r of rules) {
    const src = normalizePath(r.source);
    const dst = normalizePath(r.destination);
    if (seen.has(src)) {
      issues.push({ kind: "duplicate-source", detail: `${r.source} (doppione di ${src})` });
    }
    seen.add(src);
    if (src === dst) issues.push({ kind: "self", detail: `${r.source} → sé stesso` });
    bySource.set(src, dst);
  }

  for (const [src, dst] of bySource) {
    // Catena: la destinazione è a sua volta un source → il redirect andrebbe accorciato.
    if (bySource.has(dst)) {
      const next = bySource.get(dst)!;
      if (next === src) issues.push({ kind: "loop", detail: `${src} ⇄ ${dst}` });
      else issues.push({ kind: "chain", detail: `${src} → ${dst} → ${next} (accorciare a ${src} → ${next})` });
    }
  }
  return issues;
}

/**
 * URL legacy (dal sitemap WordPress / Search Console) NON coperti: né da un redirect, né da una
 * rotta viva del nuovo sito. Sono i candidati a diventare 404 al cambio DNS — vanno mappati o
 * accettati consapevolmente. `currentRoutes` = le rotte statiche del nuovo sito (SITEMAP_ROUTES).
 */
export function unmappedLegacyUrls(
  legacyUrls: readonly string[],
  currentRoutes: readonly string[],
  rules: readonly RedirectRule[] = legacyRedirects,
): string[] {
  const covered = new Set<string>([
    ...rules.map((r) => staticPrefix(r.source)),
    ...currentRoutes.map(normalizePath),
  ]);
  const out: string[] = [];
  for (const url of legacyUrls) {
    const pathAndQuery = url.replace(/^https?:\/\/[^/]+/i, ""); // toglie l'host se presente
    const norm = normalizePath(pathAndQuery);
    // Permalink "nudo" su query (`/?p=123`, `/?page_id=5`): il path è "/" ma NON è la home —
    // è un post/pagina WordPress che va mappato, non servito come home. Sempre scoperto.
    const isBareQueryPermalink = norm === "/" && /^\/?\?./.test(pathAndQuery.trim());
    if (isBareQueryPermalink) {
      out.push(url);
      continue;
    }
    // Coperto se combacia una rotta/source, o se è una scheda immobile ancora servita (/case/<slug>).
    if (covered.has(norm) || /^\/case\/[^/]+$/.test(norm)) continue;
    // Coperto anche da un jolly (source con prefisso statico che è padre dell'URL).
    if ([...covered].some((c) => c !== "/" && norm.startsWith(`${c}/`))) continue;
    out.push(url);
  }
  return out;
}
