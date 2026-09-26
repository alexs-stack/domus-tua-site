# RealSmart — mappatura campi (grezzo → normalizzato → UI)

Documento operativo che traccia **ogni campo** dal formato grezzo del gestionale RealSmart
(`RealSmartListingRaw`) fino alla forma pulita consumata dal sito (`NormalizedProperty`) e ai
punti della UI dove viene mostrato.

Sorgenti di verità del codice:
- Tipi grezzi + normalizzati: `app/lib/realsmart/types.ts`
- Logica di mappatura (pura e difensiva): `app/lib/realsmart/normalize.ts`
- Filtro stati + fetch: `app/lib/realsmart/client.ts`

> Nota: oggi la UI degli immobili (`app/components/Listings.tsx`, `PropertyCard.tsx`,
> `PropertyGallery.tsx`, `PropertySearch.tsx`, `app/case/[slug]/page.tsx`) legge ancora il
> modello **DEMO** `app/lib/properties.ts`. La colonna "Dove usato nella UI" indica la
> **superficie di destinazione**: cioè dove ciascun campo `NormalizedProperty` andrà a
> confluire quando le pagine `case` verranno collegate a `getLiveListings()`. La forma dei dati
> è già allineata a quella del `Property` demo, quindi il ricollegamento è meccanico.

Legenda obbligatorietà (lato feed RealSmart, per una scheda pubblicabile e non "monca"):
- **Obb.** = obbligatorio: senza, la scheda è incompleta o non pubblicabile.
- **Cons.** = consigliato: la UI funziona senza (fallback difensivo), ma la qualità cala.
- **Opz.** = opzionale: puro arricchimento.

---

## 1. Tabella di mappatura

| Campo RealSmart grezzo (`RealSmartListingRaw`) | Campo `NormalizedProperty` | Trasformazione in `normalize.ts` | Dove usato nella UI | Obbligo |
|---|---|---|---|---|
| `codice` | `id`, `sourceRef.codice`, base dello `slug` | `id = codice`; lo `slug` è `slugify(titolo + comune + codice)` | Chiave React nelle liste; URL permanente `/case/[slug]`; `sourceRef` per debug/tracciabilità | **Obb.** |
| `riferimento` | `sourceRef.riferimento` | `trim()`, `undefined` se vuoto | Scheda immobile come "RIF. …" (dettaglio `/case/[slug]`) | Cons. |
| `titolo` | `title` | `trim()`, default `""` | Titolo card (`PropertyCard`), `<h1>` dettaglio, `alt` immagini di fallback, `<title>`/OG via `generateMetadata` | **Obb.** |
| `descrizione` | `description` | `trim()`, default `""` | Blocco descrittivo dettaglio; `meta description` / OG | Cons. |
| `prezzo` (`number \| string`) | `price` (number), `priceLabel` (string) | `toNumber()` (rimuove `€`, `.`, spazi); `priceLabel` = formato it-IT `€ 420.000`, oppure `"Prezzo su richiesta"` se `price === 0` | `priceLabel` mostrato in card e dettaglio; `price` usato dai filtri budget di `PropertySearch` | **Obb.** |
| `tipologia` | `type` | `trim()`, default `"Immobile"` | Etichetta tipologia in scheda; filtro "tipo" di `PropertySearch` (Appartamento/Attico/Villa) | **Obb.** |
| `contratto` (`"vendita"\|"affitto"\|string`) | `contract` (`"vendita"\|"affitto"`) | `normalizeContract()`: `affitto` solo se stringa `=== "affitto"`, altrimenti default `vendita` | Filtro "Vendita/Affitto" di `PropertySearch`; label prezzo (es. "/mese" in futuro) | **Obb.** |
| `localita.comune` | `town` | `trim()`, default `""` | Riga zona/comune in card e dettaglio; elenco comuni del filtro `PropertySearch` | **Obb.** |
| `localita.provincia` | `province` | `trim()`, default `""` | Localizzazione estesa (es. "Tradate (VA)") | **Obb.** |
| `localita.indirizzo` | `address` | `trim()`, `undefined` se vuoto | Indirizzo civico in dettaglio **solo se pubblicabile** (vedi privacy, §10 note integrazione) | Opz. |
| `localita.cap` | — (non mappato) | non usato oggi | — (disponibile nel raw se servirà per schema.org/mappe) | Opz. |
| `localita.zona` | — (non mappato) | non usato oggi | — (candidato per la riga "zona" tipo "Tradate, centro" del demo) | Opz. |
| `mq` (`number \| string`) | `sqm` (number) | `toNumber()`, `0` se ignoto | Specifica "Superficie" (card + tabella specs dettaglio) | Cons. |
| `locali` (`number \| string`) | `rooms` (number) | `toNumber()`, `0` se ignoto | Specifica "Locali"; filtro "locali minimi" di `PropertySearch` | Cons. |
| `bagni` (`number \| string`) | `baths` (number) | `toNumber()`, `0` se ignoto | Specifica "Bagni" nel dettaglio | Cons. |
| `camere` (`number \| string`) | — (non mappato) | **non ancora mappato** in `NormalizedProperty` | Il demo mostra "camere/beds": se serve in UI, aggiungere `beds` a `NormalizedProperty` e mapparlo qui | Cons. |
| `piano` (`number \| string`) | `floor` (string opz.) | `String(piano)` se numero, altrimenti `trim()`; `undefined` se vuoto | Specifica "Piano" nel dettaglio | Opz. |
| `classeEnergetica` | `energyClass` (string opz.) | `trim()`, `undefined` se vuoto | Specifica "Classe energetica" (badge/etichetta dettaglio) | Cons. |
| `caratteristiche[]` | `features[]` + input a `badges[]` | `trim()` + rimozione vuoti; alimenta `deriveBadges()` | Lista dotazioni nel dettaglio; matching dei filtri feature di `PropertySearch` (giardino, box, terrazzo, doppi servizi) | Cons. |
| `statoPubblicazione` | `status` + input a `badges[]` | `normalizeStatus()`: default `published` se assente/non valido; filtra la visibilità (vedi §2) | Gating della lista pubblica (`client.ts`); badge di stato in card/dettaglio | **Obb.** |
| `media[]` (foto/planimetria/video/tour) | `images[]` (`{src, alt}`) | `sortMedia()` per `ordine`; filtra a `tipo === "foto"` o `tipo` assente; `alt` = `didascalia` o fallback `titolo — comune` | Galleria (`PropertyGallery`), cover di `PropertyCard` (`images[0]`) | **Obb.** (almeno 1 foto) |
| `media[].url` | `images[].src` | passato tal quale a `next/image` | `src` di ogni `<Image>` — **richiede `remotePatterns`** se host esterno (vedi deployment) | **Obb.** (con foto) |
| `media[].tipo` | (filtro) | usato per tenere solo le foto nella gallery | Determina cosa entra in `images[]` | Cons. |
| `media[].ordine` | (ordinamento) | chiave di `sortMedia()`; `undefined` → in coda | Ordine di scorrimento della gallery | Cons. |
| `media[].didascalia` | `images[].alt` | usata come `alt`; fallback se assente | Accessibilità/SEO immagini | Opz. |
| `dataPubblicazione` | `publishedAt` (ISO string) | `trim()`, `""` se assente | Ordinamento lista (fallback quando manca `updatedAt`) | Opz. |
| `dataAggiornamento` | `updatedAt` (ISO string) | `trim()`, `""` se assente | **Ordinamento principale** della lista (più recente prima, `client.ts`) | Cons. |
| — (derivato) | `badges[]` | `deriveBadges(status, features, contract)` | Badge su cover card e dettaglio | derivato |

### Badge derivati (`deriveBadges` in `normalize.ts`)

| Origine | Badge prodotto |
|---|---|
| `status === "reserved"` | `Sotto proposta` |
| `status === "sold"` | `Venduto` (o `Affittato` se `contract === "affitto"`) |
| `status === "withdrawn"` | `Ritirato` |
| feature contiene `"esclusiv"` | `In esclusiva` |
| feature contiene `"virtual"` o `"tour"` | `Virtual tour` |
| feature contiene `"open domus"` | `Open Domus` |
| feature contiene `"document"` **e** `"verific"` | `Documenti verificati` |

I badge sono deduplicati preservando l'ordine. Nota: i badge di `sold`/`withdrawn` vengono
prodotti ma **non arrivano in pagina** finché quegli stati restano nascosti (vedi §2).

---

## 2. Stati (`ListingStatus`) e visibilità pubblica

Union chiusa definita in `types.ts`:

| `status` | Significato | Visibile sul sito? | Badge derivato | Note |
|---|---|---|---|---|
| `published` | Attivo e pubblicabile | **Sì** | — | Default se `statoPubblicazione` manca o non è riconosciuto |
| `reserved` | Sotto proposta / opzionato | **Sì** | `Sotto proposta` | Mostrato apposta: comunica dinamismo/urgenza |
| `sold` | Venduto (o affittato) | **No** (nascosto) | `Venduto` / `Affittato` | In `HIDDEN_STATUSES` |
| `withdrawn` | Ritirato / archiviato | **No** (nascosto) | `Ritirato` | In `HIDDEN_STATUSES` |
| `draft` | Bozza, non pubblicabile | **No** (nascosto) | — | In `HIDDEN_STATUSES` |

Il filtro vive in `app/lib/realsmart/client.ts`:

```ts
const HIDDEN_STATUSES = new Set(["draft", "sold", "withdrawn"]);
// getLiveListings() → normalizza, poi .filter(p => !HIDDEN_STATUSES.has(p.status))
```

Comportamenti chiave da ricordare:

- **Default permissivo.** `normalizeStatus()` restituisce `published` per valori assenti o non
  riconosciuti. Se RealSmart usasse etichette diverse (es. `"venduto"`, `"attivo"`, codici
  numerici), **quelle schede risulterebbero pubblicate per errore**: la mappatura degli stati
  del feed reale va aggiunta in `normalizeStatus()` prima del go-live (vedi checklist deployment).
- **Feed che rimuove i venduti.** Se RealSmart non marca i venduti ma li toglie dal feed,
  l'esclusione è automatica (spariscono dalla sorgente).
- **Riesporre i "Venduto" come social proof (futuro).** Il badge è già derivato: basta togliere
  `"sold"` da `HIDDEN_STATUSES` e filtrarli in una vista dedicata. Da confermare col cliente.
- **`reserved` è pubblico di proposito.** Se il cliente preferisce nasconderlo, aggiungerlo a
  `HIDDEN_STATUSES`.

---

## 3. Campi ancora da estendere (gap noti)

Utili da chiudere quando arriva il feed reale:

- **`camere` → `beds`**: presente nel raw e nel demo (`beds`), ma **non** in `NormalizedProperty`.
  Aggiungere il campo ai tipi + mappa in `normalize.ts` se la UI mostra "camere".
- **`localita.zona`**: il demo usa una riga zona ("Tradate, centro"). Valutare `zona` → un campo
  `zone`/label composita comune+zona.
- **`localita.cap`**: non mappato; utile solo se si aggiunge JSON-LD `schema.org/Residence` o mappe.
- **Media non-foto** (`planimetria`, `virtual-tour`, `video`): oggi scartati dalla gallery.
  Se serviranno tab "Planimetria"/"Tour", vanno mappati in campi dedicati, non in `images[]`.

---

## File coinvolti

- `app/lib/realsmart/types.ts` — definizione `RealSmartListingRaw` + `NormalizedProperty`.
- `app/lib/realsmart/normalize.ts` — `normalizeRealSmartListing()` e helper (`toNumber`, `slugify`, `deriveBadges`, `sortMedia`).
- `app/lib/realsmart/client.ts` — `getLiveListings()`, `HIDDEN_STATUSES`, ordinamento, `REVALIDATE_SECONDS`.
- `app/components/PropertyCard.tsx`, `PropertyGallery.tsx`, `PropertySearch.tsx`, `Listings.tsx`, `app/case/[slug]/page.tsx` — superfici UI di destinazione.
- Contesto e domande aperte: `docs/realsmart-integration-notes.md`.
