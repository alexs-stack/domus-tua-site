# ADR-009 — Territory V2: esperienza pubblica "Vivere in zona" e mappa

- **Status:** Accettato (Prompt 12) · sezione gated da `NEXT_PUBLIC_TERRITORY_SECTION_ENABLED`
- **Data:** 2026-08-14

## Contesto

La sezione pubblica "Vivere in zona" mostra i POI vicini con le distanze. Il payload pubblico
(`PublicListingTerritory`) è **privo di coordinate per costruzione** (ADR-001/002): niente lat/lng, solo
categoria, nome, distanza, attribuzione e la **base d'origine** (precisione + etichetta). Questo prompt
migliora l'esperienza — chiarezza sull'origine, contesto, filtro, esploratore visivo — **senza**
sacrificare accuratezza, privacy, accessibilità o performance.

## Decisione chiave: la "mappa" è uno SCHEMA di distanze, non una mappa geografica

Poiché il payload non contiene coordinate, **una mappa geografica è impossibile** — ed è esattamente la
garanzia di privacy che vogliamo. L'esploratore è quindi un **diagramma radiale schematico**
(`explorerModel.ts`, puro e testato): anelli di distanza "tondi" e punti collocati per **distanza**
(raggio) e **categoria** (settore angolare). Le direzioni sono **illustrative**, dichiarate tali dalla
didascalia. Non esistono tile di mappa, né chiamate di rete, né coordinate: **niente può rivelare la
posizione dell'immobile** attraverso centro mappa, payload o richieste.

Questo vale per tutte le modalità d'origine; il **centro** cambia solo l'etichetta (immobile / zona /
comune), mai una posizione reale. In modalità ristretta (centroide) non c'è nulla da nascondere perché
non c'è nulla di geolocalizzato da mostrare.

## Cosa cambia nella UI

1. **Base d'origine esplicita** (`view.originLabel`, derivata SOLO dalla precisione): "dall'immobile"
   per una coordinata autorizzata, "dal centro della zona X" / "dal centro di X" per i centroidi. Mai
   "dall'immobile" per un centroide.
2. **Contesto senza gergo** (`contextLabel`: "Comune di Tradate" / "Zona San Rocco") + data del dato +
   attribuzione (ODbL) visibili.
3. **Tre modalità distinte** (`originMode`: property / zone / municipality) che guidano testo e centro.
4. **Filtro per categoria** con controlli semantici `<button>`, `aria-pressed`, focus visibile
   (outline rosso globale), `role="group"` + `aria-label`, navigabile da tastiera.
5. **Esploratore progressivo**: `next/dynamic(..., { ssr: false })` renderizzato **solo dopo il click**
   su "Esplora le distanze" → il chunk entra in rete solo su interazione. L'SVG è `role="img"` con
   `aria-label` sintetico; il dettaglio autorevole resta nelle card.
6. **Stati parziali/vuoti**: una categoria mancante **non** nasconde le altre; il filtro che azzera i
   risultati mostra un messaggio, non una sezione rotta.
7. **Mai percorribilità**: sempre "in linea d'aria"; il routing (a piedi/in auto) resta una futura
   feature con provenienza separata.
8. **i18n centralizzata** in `view.ts` (it/en/fr/de/es); nessun impatto sulla SEO multilingua
   (disabilitata) perché le stringhe sono lato client come già l'intera sezione.
9. **Reduced-motion / low-data / mobile**: animazioni solo `motion-safe`; l'esploratore è
   interaction-gated (low-data non paga il chunk se non lo apre); layout responsive (griglia 1→3
   colonne, SVG fluido).

## Privacy — verifica (acceptance)

- **Nessuna coordinata** nel modello di vista né in quello dell'esploratore (test:
  `view.test.ts` "nessuna coordinata", `explorerModel.test.ts` "PRIVACY: nessuna coordinata").
- **Nessun tile di mappa, nessuna richiesta con coordinate**: verificato dal network trace del preview
  (solo asset dell'app; lo `sourceUrl` è un semplice link, non una fetch).
- **Centro mappa non rivelatore**: il centro è un'etichetta, il diagramma è schematico.

## Performance — costo del bundle (misurato)

- Client chunks totali: **2564 KB → 2576 KB** (+12 KB grezzi su TUTTI i chunk), **+2 file** (il chunk
  dell'esploratore e la route di anteprima dev).
- **Percorso "feature-off / non aperto"**: l'esploratore è un **chunk separato** caricato **solo al
  click** (confermato dal network trace: il chunk `TerritoryDistanceExplorer` compare dopo
  l'interazione, non nel caricamento iniziale). Gli import statici aggiunti a `VivereInZona` (stato del
  filtro, wrapper `dynamic`) sono trascurabili. L'LCP/TBT iniziali non sono materialmente toccati.

## Accessibilità (acceptance)

- Filtro: `<button>` nativi (operabili da tastiera), `aria-pressed`, `role="group"`+`aria-label`, focus
  visibile globale; toggle "Tutte" per reset.
- Esploratore: bottone con `aria-expanded`/`aria-controls`; SVG `role="img"` + `aria-label` sintetico;
  il dato autorevole (nomi/distanze) resta testuale nelle card, quindi pienamente leggibile da screen
  reader anche senza aprire il diagramma.
- Verificato via `read_page` e ispezione DOM: semantica e stati corretti; filtro e stati parziali
  funzionano (togliendo "Stazione ferroviaria" restano le altre 4 categorie).

## Anteprima dev

`app/territory-preview/page.tsx` renderizza la sezione con dati fixture per la verifica visiva/E2E; in
**produzione** restituisce 404 (`notFound`) e non è indicizzabile (`robots: noindex`).

## Acceptance coperta

- l'utente capisce **da dove** è misurata ogni distanza (origine esplicita per modalità);
- gli annunci ristretti **non rivelano** la posizione (centro/payload/rete);
- la sezione funziona da tastiera e con screen reader;
- il percorso a feature spenta aggiunge JS client trascurabile;
- nessuna regressione: lint, typecheck, test e build verdi (i test visivi/E2E restano da eseguire in CI
  con Lighthouse quando la sezione verrà attivata con dati reali).
