# SEO — inventario redirect e riconciliazione col cliente

I redirect legacy (WordPress → nuovo sito) vivono in **`app/lib/seo/redirects.ts`** (dato unico,
importato da `next.config.ts`). Sono validati da un test e da un comando.

## Verifica strutturale (automatica)

```bash
npm run redirect-audit
```
Controlla loop, catene multi-hop, source auto-referenziali e doppioni di case/slash. Fallisce
(exit 1) se ne trova. Girano anche come test: `app/lib/seo/__tests__/redirects.test.ts`.

Note tecniche: le `source` NON portano lo slash finale (Next lo normalizza prima); `permanent: true`
emette **308**, non 301 (equivalente ai fini della canonicalizzazione — chi verifica con `curl -sIL`
deve accettare 308).

## Riconciliazione con gli export del cliente

L'inventario di partenza (15 regole) copre i 25 URL del vecchio sitemap WordPress. **Non è
l'indicizzato reale**: un sito vivo dal 2007 ha URL che quel sitemap non espone (`/?p=N`,
`/category/*`, `/tag/*`, pagine allegato). Prima del go-live vanno incrociati.

```bash
npm run redirect-audit -- --legacy=./export-legacy.txt
```
`export-legacy.txt` = un URL per riga (righe con `#` ignorate). Il comando stampa gli URL
**SCOPERTI**: né redirette, né rotta viva, né scheda `/case/<slug>`. I permalink "nudi" su query
(`/?p=123`) sono sempre segnalati (vanno mappati alla nuova posizione, non serviti come home).

### Cosa fornire (Domus Tua)
1. **`wp-sitemap*.xml`** del vecchio sito (tutte le pagine dell'indice, non solo la prima).
2. **Rapporto Pagine di Search Console**, ultimi **16 mesi** (export CSV degli URL con impressioni/
   click): è l'unico modo per sapere quali URL portano ancora traffico e vanno mappati per primi.
3. **Backlink** ad alto valore (da GSC "Link" o da uno strumento SEO): un URL con backlink esterni
   va redirette, non lasciato 404.
4. Conferma su URL ambigui del vecchio menu (es. "Valuta il tuo immobile"): è una pagina reale?

Concatena i tre elenchi in `export-legacy.txt`, esegui il comando, e ogni URL scoperto diventa una
decisione: redirect (verso quale pagina), oppure 404 accettato consapevolmente.

## Non tocchiamo DNS né Search Console
Il comando è sola lettura sui file locali. L'accesso a Search Console e il cambio DNS restano al
cliente (docs/migration-checklist.md).
