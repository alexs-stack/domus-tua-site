# SEO — policy dei venduti, sitemap, multilingua

Confini SEO resi ESPLICITI e testabili. Le decisioni di business (soprattutto i venduti) le
prende il cliente: qui ogni opzione ha un effetto prevedibile e un solo posto da cambiare.

## 1. Schede degli immobili venduti — DA DECIDERE

Oggi ~168 schede su 196 sono venduti. La policy vive in `app/lib/seo/soldPolicy.ts`
(`SOLD_URL_POLICY`, override d'ambiente `SOLD_URL_POLICY`). **Default: `noindex`** — prudente e
reversibile; il cliente conferma la scelta definitiva.

| Opzione | Scheda online? | Indicizzata? | Nel sitemap? | Effetto SEO |
|---|:--:|:--:|:--:|---|
| `index` | sì | sì | sì | Storia/long-tail conservata, ma pagine "esaurite" competono nell'indice e il sitemap dichiara URL non in vendita. |
| **`noindex`** (default) | sì | no | no | Utenti con link/bookmark atterrano sul banner "venduto" + correlati; fuori dall'indice e dal sitemap. Reversibile, non rompe i link in ingresso. |
| `redirect` | no (301→/acquista) | — | no | Consolida il segnale ma PERDE la pagina; i backlink puntano al catalogo. |
| `gone` | no (410) | no | no | Deindicizza in fretta ("rimosso di proposito"). Il più aggressivo; richiede un **middleware** (una pagina SSG non restituisce 410 da sola: oggi ripiega su 404). |

Test: `app/lib/seo/__tests__/soldPolicy.test.ts`. Cambiare policy = una riga (o l'env), e i test
verificano che sitemap e robots seguano.

> **Domanda al cliente:** le schede dei venduti devono restare online e indicizzate, restare online
> ma noindex (default attuale), redirigere al catalogo, o essere rimosse (410)?

## 2. Cosa NON entra mai nel sitemap

`app/sitemap.ts` include solo URL eleggibili:
- **venduti** solo con policy `index` (sopra);
- **nascosti/ritirati/bozza**: già esclusi a monte (`getVisibleListings`/normalize);
- **mock**: non arrivano mai in produzione (client.ts, fail-closed);
- **contenuto FAIL** (segnaposto "____", ecc.): non raggiungono la produzione — l'audit contenuti
  **blocca il deploy** (job CI "Audit contenuti annunci");
- **rotte noindex** (`/privacy`, `/cookie`): escluse finché il testo legale è placeholder.

Niente `lastModified` finto (una data uguale ovunque smette di essere creduta) e niente
`changeFrequency` (Google lo ignora).

## 3. Multilingua — SPENTO fino a rotte per lingua complete

Il sito ha copy in it/en/fr/de/es, ma la lingua vive in un **cookie** (`dt_locale`), non nell'URL:
nessuna rotta `/en`, nessun `hreflang`, nessuna alternate nel sitemap. È corretto per il lancio
(solo-italiano indicizzato). Un SEO multilingua a metà è peggio di niente (crawler su 404, segnale
diluito). Il guardiano è `app/lib/__tests__/seo-i18n.test.ts`: fallisce se qualcuno aggiunge
hreflang/alternate/rotte per lingua senza l'implementazione completa (self+alternate hreflang,
canonical localizzati, metadata tradotti, alternate nel sitemap).

> **Domanda al cliente:** il multilingua è fuori scope per il primo lancio? (Consigliato sì:
> accenderlo a metà danneggia il posizionamento italiano.)

## 4. Cosa serve da Domus Tua
1. La policy sui venduti (§1).
2. Conferma che il multilingua è fuori scope al lancio (§3).
3. Gli export per la riconciliazione dei redirect: vedi `docs/seo-redirects.md`.
