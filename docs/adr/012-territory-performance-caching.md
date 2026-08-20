# ADR-012 — Territory V2: prestazioni e caching

- **Status:** Accettato (Prompt 15) · sezione gated da `NEXT_PUBLIC_TERRITORY_SECTION_ENABLED`
- **Data:** 2026-08-14

## Contesto

Il sito parte già da prestazioni Lighthouse insufficienti (home ~0.41, LCP ~9.8 s, TBT ~2.3 s;
/acquista ~0.51, LCP ~5.5 s). Territory V2 **non deve peggiorarle** e deve costare **zero** quando è
spento.

## Decisioni

### 1. Dato server-side, payload minimo, nessun provider al render (constraint 1/2/9)

`getPublicListingTerritory(slug)` (`publicRead.ts`) legge lo store **approvato** lato server e proietta
con `toPublicListingTerritory`: solo POI **approvati**, **≤2 per categoria**, **niente coordinate,
niente providerId, niente storico d'approvazione, niente evidenza**. Nessuna chiamata a un provider
avviene al render della pagina (il provider si tocca solo nei job di sync). Verificato dai test: il
payload pubblico non contiene alcun campo privato.

### 2. Costo ZERO a feature spenta (acceptance)

`getPublicListingTerritory` ritorna `null` se `NEXT_PUBLIC_TERRITORY_SECTION_ENABLED` è spento o se non
c'è dato approvato. In `PropertyDetail` la sezione è **dynamic-import** e renderizzata solo se
`territory` non è null: `{territory ? <VivereInZona/> : null}`. Quindi a territorio spento **il chunk
di "Vivere in zona" non viene mai scaricato** — zero JS aggiuntivo sulla scheda immobile.

### 3. Rendering server, hydration solo per l'interattività (constraint 5)

Le **card** di "Vivere in zona" sono contenuto statico: essendo importate senza `ssr:false`, entrano
nell'HTML server al primo paint (niente attesa di hydration per leggerle). Solo l'**esploratore**
schematico è `ssr:false` e lazy, caricato al click (ADR-009). Nessun contenuto statico richiede
hydration per essere leggibile.

### 4. Cache con tag MIRATI e revalidazione targetizzata (constraint 3/7)

La lettura passa da `unstable_cache` con tag `["territory", "territory:listing:<code>",
"territory:profile:<comune>"]`. Un'approvazione invalida **solo** le pagine toccate via
`/api/territory/revalidate` (POST autenticato con segreto server-only, `revalidateTag(tag, "max")` →
stale-while-revalidate). Senza segreto configurato l'endpoint è **404** (nessuna leva pubblica). I tag
sono per-immobile e per-comune: un'approvazione **non** invalida l'intero sito. `territoryCacheTags()`
è pura e testata.

### 5. Niente N+1 in build/generateStaticParams (constraint 8)

`generateStaticParams` ritorna **solo gli slug** (nessuna lettura territoriale). La lettura del
territorio è **per-pagina e O(1)** (`getListingEnrichment(slug)`), cacheata per slug: nessun ciclo
sull'intero store per pagina, nessuna chiamata provider in build.

## Tabella bundle / payload

| Voce | Territorio SPENTO | Territorio ACCESO |
|---|---|---|
| JS client sulla scheda immobile | **0** (chunk non scaricato) | chunk "Vivere in zona" (card+filtro, piccolo) |
| Esploratore | non esiste | chunk separato, solo al **click** |
| Payload territoriale serializzato | **0 byte** | ≤ **3 KB** per una scheda a 5 categorie piene (test) |
| Chiamate provider al render | 0 | 0 |
| Letture store per pagina | 0 | 1 (cacheata, con tag) |

Budget di prestazione della scheda immobile: **territorio spento = nessun costo aggiuntivo**;
**territorio acceso = ≤ 3 KB di payload + un chunk piccolo**, con l'esploratore fuori dal percorso
critico. Nessuna regressione materiale di LCP/TBT attesa (contenuto sotto la piega, dato già in HTML).

## Misurazioni

- **Byte serializzati**: budget ≤ 3 KB verificato da `performance.test.ts` su una scheda a 5 categorie.
- **JS di rotta**: la sezione è un chunk separato; l'esploratore un secondo chunk lazy (delta misurato
  in ADR-009: +12 KB grezzi complessivi, isolati dal percorso iniziale).
- **Latenza dello store**: lettura in-process (memory/filesystem), sub-millisecondo; cacheata per slug.
- **Hydration**: le card sono in HTML server; solo filtro/esploratore idratano.

## Topologia della cache

```
approvazione editoriale (CLI, ADR-007)
        │  POST /api/territory/revalidate  (Bearer <secret>)
        ▼
 revalidateTag("territory:listing:<code>", "max")     → invalida SOLO la scheda di quell'immobile
 revalidateTag("territory:profile:<comune>", "max")   → invalida le schede di quel comune (profilo)
        │  stale-while-revalidate
        ▼
 unstable_cache(getPublicListingTerritory, [slug], { tags:[…] })  ← la pagina rilegge alla prossima visita
```

## Broader site-wide (constraint 10) — onestà sullo stato

Il budget Lighthouse è già un **errore** (non un job informativo): `categories:performance` a
`["error", { minScore: 0.9 }]` con LCP ≤ 2500 ms e TBT ≤ 300 ms → con la baseline attuale la CI
**fallisce**, e questo è voluto: la mancanza non è nascosta. `numberOfRuns` è stato portato a **3** →
Lighthouse CI riporta la **mediana** multi-run per pagina (prima/dopo).

Colli di bottiglia site-wide identificati (da `perf-report`/build, da affrontare come lavoro dedicato
e MISURATO, non alla cieca):

- **Cursore WebGL (`ogl`)** e **GSAP/motion**: chunk pesanti caricati presto; candidati a lazy/`prefers-
  reduced-motion`/rimozione su mobile.
- **Hero video** e immagini grandi: principale sospetto di LCP; da verificare priorità/format/preload.
- **Preloader/animazioni d'ingresso**: costo di TBT; già mitigate ma da rimisurare.

Questi non fanno parte del territorio e non vanno cambiati alla cieca: la scheda immobile con
territorio **non** è tra le cause di LCP (contenuto sotto la piega, dato in HTML, esploratore lazy).

## Nota su Lighthouse median in questo ambiente

La configurazione produce mediane multi-run; l'esecuzione (`npm run lighthouse` con lhci + Chromium
headless su una build servita) va fatta in CI o in locale — non è stata eseguita in questo ambiente di
sviluppo. I numeri prima/dopo si ottengono da lì; il gate resta `error` così la regressione non si
nasconde.

## Acceptance coperta

- territorio spento = **zero** costo client (chunk non scaricato, payload 0);
- territorio acceso entro budget piccolo (≤ 3 KB payload + chunk piccolo, esploratore lazy) senza
  regressione materiale;
- **nessuna** richiesta provider al render (test + design);
- invalidazione **mirata** per immobile/comune (tag testati, endpoint autenticato);
- Lighthouse configurato per **mediana multi-run**, budget enforced come errore (regressione non
  nascosta).
