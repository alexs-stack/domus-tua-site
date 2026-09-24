// Inventario degli URL del vecchio sito WordPress — FONTE UNICA.
//
// PERCHÉ ESISTE. La mappa dei redirect vive in next.config.ts, ma l'INVENTARIO di ciò che
// deve essere coperto no: stava in tre posti diversi e incompleti (undici voci nel test di
// go-live, tre nello smoke, nessuna nella forma con lo slash finale — che è la sola forma
// in cui quegli URL esistono davvero là fuori). Con l'inventario sparso, "i redirect sono a
// posto" era una frase che nessuno poteva verificare: si controllavano i rappresentanti,
// non i rappresentati.
//
// Da qui leggono DUE controlli, e sono complementari:
//   • app/lib/__tests__/golive.test.ts — a repository fermo: ogni voce trova una regola in
//     next.config.ts e atterra dove deve, senza catene. Gira in CI, non tocca la rete.
//   • scripts/smoke.ts — contro l'host reale: ogni voce, NELLA FORMA CON LO SLASH, arriva a
//     200 contando i salti. È l'unico dei due che vede la normalizzazione di Next.
//
// ⚠️ QUESTA NON È LA LISTA DELL'INDICIZZATO. Sono i 25 URL esposti da
// https://www.domustua.com/wp-sitemap-posts-page-1.xml (rilevati il 2026-08-10), cioè il
// sitemap del NUCLEO WordPress: un sito vivo dal 2007 ha URL che quel sitemap non espone
// (/?p=N, /category/*, /tag/*, pagine allegato). Prima del cutover va incrociata con il
// rapporto Pagine di Search Console degli ultimi 16 mesi, e le voci mancanti vanno aggiunte
// QUI — non solo in next.config.ts, o tornano invisibili ai controlli.
// Vedi docs/migration-checklist.md §5 e docs/retainer-plan.md §5.0-5.1.

/** Una voce dell'inventario: come esisteva sul vecchio sito, e dove deve atterrare. */
export interface LegacyUrl {
  /** Il percorso ESATTO del vecchio sito, con lo slash finale: è la forma che gira nei link. */
  from: string;
  /** La rotta del sito nuovo su cui deve atterrare (200, non un altro redirect). */
  to: string;
  /**
   * Perché la destinazione è quella, quando non è ovvia. Serve a chi rileggerà questa lista
   * dopo che le pagine mancanti saranno state create (§5.4 del Documento finale di sintesi).
   */
  note?: string;
}

/**
 * Le voci che sul sito nuovo cambiano indirizzo: qui il redirect è obbligatorio.
 */
export const LEGACY_REDIRECTS: LegacyUrl[] = [
  // ── Le due porte del vecchio menu ──────────────────────────────────────────
  { from: "/vendi-casa/", to: "/vendi" },
  { from: "/cerchi-casa/", to: "/acquista" },

  // ── Servizi. Open Domus ha una pagina propria; gli altri cinque confluiscono
  //    nell'hub finché non avranno la loro (voce 28 della checklist). Quando le
  //    sotto-pagine esisteranno, qui cambiano le destinazioni E in next.config.ts
  //    vanno cinque righe puntuali PRIMA del jolly `/servizi-domus/:slug`.
  { from: "/servizi-domus/", to: "/servizi" },
  { from: "/servizi-domus/open-domus/", to: "/open-domus" },
  {
    from: "/servizi-domus/home-staging/",
    to: "/servizi",
    note: "destinazione prevista: /servizi/home-staging (voce 28)",
  },
  {
    from: "/servizi-domus/servizio-di-rendering-e-virtual-rendering/",
    to: "/servizi",
    note: "destinazione prevista: /servizi/rendering (voce 28)",
  },
  {
    from: "/servizi-domus/emotional-video-marketing-immobiliare/",
    to: "/servizi",
    note: "destinazione prevista: /servizi/video-emozionali (voce 28)",
  },
  {
    from: "/servizi-domus/produzione-contenuti-e-campagne-marketing/",
    to: "/servizi",
    note: "destinazione prevista: /servizi/marketing-immobiliare (voce 28)",
  },
  {
    from: "/servizi-domus/servizi-tecnico-amministrativi-legali-2/",
    to: "/servizi",
    note: "destinazione prevista: /servizi/tecnico-legali (voce 28)",
  },

  // ── Team. Il duplicato "Chi siamo – Copy" era indicizzabile sul vecchio CMS.
  { from: "/team/", to: "/chi-siamo" },
  {
    from: "/team/raffaela-rizza/",
    to: "/chi-siamo",
    note:
      "l'unica scheda persona di cui il Documento finale cita lo slug. Le altre cinque " +
      "sono coperte dal jolly /team/:slug, ma i loro slug esatti NON sono verificati: " +
      "vanno letti dal rapporto Pagine di Search Console e aggiunti qui prima del cutover. " +
      "Destinazione prevista: una pagina per persona (voce 28)",
  },
  { from: "/chi-siamo-copy/", to: "/chi-siamo" },

  // ── Tre porte diverse verso la stessa cosa: le candidature ─────────────────
  { from: "/entra-a-far-parte-del-team/", to: "/lavora-con-noi" },
  { from: "/diventa-agente/", to: "/lavora-con-noi" },
  { from: "/candidatura/", to: "/lavora-con-noi" },

  // ── Legali: cambiano nome, non contenuto ──────────────────────────────────
  { from: "/privacy-policy/", to: "/privacy" },
  { from: "/cookies-policy/", to: "/cookie" },

  // ── Il catalogo immobili sul dominio principale del vecchio sito ──────────
  { from: "/proprieta/", to: "/acquista" },

  // ── Linkato dal vecchio robots.txt e citato da strumenti terzi ────────────
  { from: "/wp-sitemap.xml", to: "/sitemap.xml", note: "non porta lo slash: è un file" },
];

/**
 * Le voci che sul sito nuovo hanno LO STESSO percorso: qui il redirect sarebbe un errore,
 * ma il controllo serve lo stesso — devono rispondere 200, non 404.
 *
 * Stanno in un elenco separato di proposito: metterle fra i redirect avrebbe richiesto una
 * destinazione uguale alla sorgente, cioè esattamente il loop che golive.test.ts vieta.
 */
export const LEGACY_SAME_PATH: LegacyUrl[] = [
  { from: "/chi-siamo/", to: "/chi-siamo" },
  { from: "/contatti/", to: "/contatti" },
  { from: "/", to: "/" },
];

/** L'inventario completo: quello che, il giorno del cutover, non deve dare 404. */
export const LEGACY_ALL: LegacyUrl[] = [...LEGACY_REDIRECTS, ...LEGACY_SAME_PATH];

/**
 * Il percorso come lo vede next.config.ts: senza lo slash finale.
 *
 * Con `trailingSlash` al default (false) Next normalizza `/vendi-casa/` → `/vendi-casa`
 * PRIMA di applicare i redirect. Le `source` in next.config.ts sono quindi scritte senza
 * slash, ed è il motivo per cui il test a repository fermo deve confrontare la forma
 * normalizzata mentre lo smoke test deve invece chiedere la forma ORIGINALE: solo la
 * seconda mostra che i salti sono due, non uno.
 */
export function normalizedPath(from: string): string {
  return from.length > 1 ? from.replace(/\/+$/, "") : from;
}

/**
 * Il sottodominio del vecchio gestionale. Non è nell'inventario delle pagine perché non è
 * una pagina: è un host intero, coperto da una regola host-scoped che vive in cima a
 * next.config.ts. Lo smoke test lo verifica solo su richiesta esplicita (`--host`), perché
 * la regola entra in funzione soltanto quando il DNS del sottodominio punta a questo deploy
 * — decisione della direzione, non nostra (voce 03 della checklist).
 */
export const LEGACY_SUBDOMAIN = "annunci.domustua.com";
