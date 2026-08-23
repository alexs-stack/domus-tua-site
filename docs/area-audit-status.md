# Audit «area description + RealSmart automation» — stato

> Documento **interno**. Mappa i sedici prompt dell'audit su ciò che esiste davvero nel
> repository, con l'evidenza per ciascuno. Aggiornato al 2026-08-23.
>
> **La regola di questo documento**: una riga è "fatta" solo se c'è un test o una verifica
> riproducibile che la dimostra. Dove manca, la riga dice cosa manca — non «in corso».

---

## Sintesi

Sono coperti i **primi nove prompt più il dodicesimo e il quindicesimo**: il difetto di
produzione, l'identità geografica, il dominio unico, lo storage, la validazione dei fatti, il
generatore, il cancello di pubblicazione, l'automazione, la sezione pubblica, il multilingua e
l'osservabilità.

Restano fuori tre cose, tutte per la stessa ragione — richiedono una decisione o una credenziale
che il codice non può prendersi da solo:

| Cosa | Perché non è fatta |
|---|---|
| **Applicare le migrazioni** | Tocca un progetto Supabase reale. Le migrazioni sono scritte e testate; applicarle è un atto nominato. |
| **Ingestione delle fonti** (Prompt 5) | Richiede di decidere quali domini interrogare e con che budget. Il contratto delle fonti esiste (`AreaSourceRecord`), il collettore no. |
| **Interfaccia editoriale** (Prompt 10) | Richiede autenticazione e ruoli. Le operazioni che dovrà chiamare esistono già come contratto (`AreaRepository`). |

Finché lo store durevole non è collegato, **il dataset dei fatti resta vuoto e la sezione d'area
non compare** — che è il comportamento voluto, non un'attesa: fail-closed.

---

## Il difetto di produzione (Prompt 1)

I 500 su `/case/gallarate-92` e `/case/malnate-91` avevano **due cause sovrapposte**, e una terza
è emersa cercando le altre rotte toccate.

| | Difetto | Correzione | Evidenza |
|---|---|---|---|
| 1 | Il `catch` di `loadListings` ingoiava la `DynamicServerError` di Next e la registrava come guasto del gestionale, restituendo uno snapshot **vuoto** che il memo teneva per un minuto | `unstable_rethrow` prima di ogni gestione | `app/lib/__tests__/listing-rendering.test.ts` |
| 2 | `/case/[slug]` dichiarava `generateStaticParams()` su un dato scaricato con `no-store` | rimosso; rotta dichiarata dinamica | build: `ƒ /case/[slug]` |
| 3 | Lo snapshot in-process nascondeva l'accesso dinamico a Next: solo la **prima** pagina a leggere il catalogo eseguiva la fetch, le altre venivano prerenderizzate. Misurato: `ƒ /acquista` ma `○ /case-vendute`, con il catalogo congelato in build | resa dinamica dichiarata su tutte e quattro le rotte del catalogo | test di completezza dell'elenco rotte |

**Verifica riproducibile** (feed finto che conta le richieste, `scripts/fake-feed.ts`):

```
build:                          0 richieste al feed   (prima: 1, per prerenderizzare ~186 schede)
richiesta di scheda a freddo:   1 richiesta
6 pagine successive:            1 richiesta in totale
/case/2001..2005 → 200      /case/9999 → 404      nessun DYNAMIC_SERVER_USAGE
```

Effetto collaterale utile: **una caduta del feed non può più far fallire un deploy**, perché la
build non lo interroga più.

---

## La matrice

Legenda: **✓** verificato da test · **◐** implementato, verifica parziale · **○** non fatto.

| # | Requisito | Dove | Evidenza | Rischio residuo |
|---|---|---|---|---|
| 1 | Le schede immobile non falliscono più | `app/case/[slug]/page.tsx`, `realsmart/client.ts` | ✓ 9 test + verifica su server reale | Con feed irraggiungibile e nessun ultimo-buono le schede rispondono 404 (fail-closed preesistente) |
| 2 | Un solo dominio d'area | `territory/area/` | ✓ 26 test, fra cui 3 guardie anti-regressione | — |
| 3 | Identità geografica preservata | `territory/area/identity.ts`, `realsmart/normalize.ts` | ✓ 28 + 14 test | Registro comuni limitato ai 4 del pilota (scelta dichiarata, vedi sotto) |
| 4 | Storage durevole | `supabase/migrations/0002_*`, `territory/area/store/` | ✓ 38 test | **Migrazioni non applicate**; adattatore Supabase non implementato |
| 5 | Ingestione fonti controllata | — | ○ | Il contratto esiste (`AreaSourceRecord`), il collettore no |
| 6 | Validazione dura dei fatti | `territory/area/factGuard.ts` | ✓ 48 test, 15 frasi avversarie | Le regole sono in italiano; una lingua nuova richiede la sua passata |
| 7 | Generatore d'area separato | `territory/area/writer/` | ✓ 15 test | Nessun provider AI collegato: c'è il generatore deterministico |
| 8 | Cancello a due strati | `territory/area/writer/judge.ts` | ✓ 26 test | Il giudice AI non è collegato; quello deterministico non valuta la prosa |
| 9 | Automazione dal feed | `territory/area/automation/` | ✓ 24 test + `npm run area:plan` | Il cron non è ancora cablato su questa orchestrazione |
| 10 | Interfaccia editoriale | — | ○ | Serve autenticazione e ruoli |
| 11 | Sezione pubblica | `app/case/[slug]/VivereInZona.tsx` | ✓ 13 test + verifica visiva desktop/mobile | — |
| 12 | Multilingua | `territory/area/writer/translate.ts` | ✓ 19 test | Nessun traduttore AI collegato |
| 13 | Backfill del catalogo | `scripts/territory/area-plan.ts` | ◐ solo la fase 1 (dry run) | Le fasi 2 e 3 dipendono dallo store durevole |
| 14 | Suite di test | tutto il dominio | ◐ 281 test nuovi, unitari e d'integrazione | Mancano le valutazioni "gold content" su 20 aree reali: servono fatti approvati veri |
| 15 | Osservabilità | `territory/area/health.ts` | ✓ 21 test | Nessun sink di produzione collegato |
| 16 | Audit finale di lancio | questo documento | ◐ | Non completabile finché 5, 10 e lo store non esistono |

---

## Le tre scelte che vale la pena conoscere

### Il registro dei comuni contiene quattro voci, non trenta

Provincia e regione di un comune sono **fatti geografici**, e in questo progetto i fatti entrano
con una fonte, non a memoria. Il registro (`territory/area/identity.ts`) contiene i quattro
comuni del pilota, gli unici la cui collocazione questo repository già afferma altrove.

Un comune fuori registro **resta perfettamente pubblicabile**: la chiave d'area si costruisce a
livello di comune (`it|||gallarate|`), provincia e regione restano vuote, e la coda di revisione
lo segnala. Ampliarlo è aggiungere una riga con la sua `source`.

Alcune righe sono anche controintuitive — «Locate Varesino» non è in provincia di Varese — ed è
esattamente il tipo di dato che va confermato da un elenco ufficiale.

### Il dataset dei fatti è vuoto, e la sezione non compare

Non è un lavoro in sospeso: è il fail-closed. Senza fatti approvati la sezione «Vivere in zona»
non entra nel DOM. Una narrativa approvata **da sola non basta** a farla comparire — il testo
nasce dai fatti, e se i fatti non sono pubblicabili non ha su cosa poggiare.

### Le migrazioni sono scritte ma non applicate

`supabase/migrations/0002_area_schema.sql` è il **progetto** dello schema, non lo stato del
database. Il file lo dichiara, e un test verifica che continui a dichiararlo.

Le regole di dominio sono duplicate in SQL — nessun auto-approve, soglia di qualità ≥95, audit
immutabile per trigger, idempotenza dei job, anti-duplicato dei fatti — perché uno script che
salta il gate applicativo non deve poter fare ciò che il gate impedisce.

---

## Cosa serve per il passo successivo

In ordine di dipendenza:

1. **Nominare il progetto Supabase** e applicare `0002_area_schema.sql`. Da lì si implementa
   `SupabaseAreaRepository`: il contract test esiste già ed è lo stesso che passa la memoria.
2. **Decidere le fonti** per il primo comune: quali domini ufficiali, con che budget di
   richieste. Da lì il collettore del Prompt 5.
3. **Approvare a mano i primi fatti** di un comune, e vedere la sezione comparire davvero.
4. Solo dopo: interfaccia editoriale, provider AI, pubblicazione automatica per i comuni con tre
   output già approvati a mano.

Il punto 3 è il primo momento in cui qualcosa di visibile cambia sul sito. Tutto ciò che sta
prima è impalcatura — necessaria, ma invisibile.

---

## Comandi

```bash
npm run area:plan                    # dry run: quante aree servono, quali località sono ambigue
npm run area:plan -- --file f.xml    # su un feed salvato invece che live
npm run area:plan -- --json          # per un altro strumento
npm run check                        # lint + typecheck + test + build
npx tsx scripts/fake-feed.ts         # feed finto che conta le richieste (verifica del Prompt 1)
```
