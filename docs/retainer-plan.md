# Piano di retainer — Domus Tua Immobiliare

> Documento **interno sersan**, operativo. Serve a due cose: sapere cosa si fa ogni mese e
> perché, e reggere una discussione con la cliente senza dover inventare niente.
> La versione da mostrare a Raffaela è la pagina web sintetica; questa è la fonte.
>
> **Fase 3.** [phase-plan.md](phase-plan.md) chiama Fase 1 il sito e Fase 2 l'intelligenza
> attorno al sito. Questo è ciò che viene dopo: la crescita continua. La regola di scopo resta
> la stessa — non si vende la fase successiva finché la precedente non è live.

Ricerca a monte: 8 fronti indipendenti + 3 verificatori avversariali su fonti primarie,
agosto 2026. Poi una seconda passata di controllo che ha messo il piano contro ~30 skill SEO /
AEO / GEO / content installate: sul merito non ha aggiunto quasi nulla — le skill sono materiale
statico, in parte vecchio di due generazioni — ma usate come griglia di lettura **sul codice
reale** hanno prodotto sette correzioni verificate e una lista di lavoro mancante, quasi tutta
nella meccanica della migrazione e nel processo editoriale. Quelle correzioni sono già dentro.

Ogni numero qui dentro ha una fonte o è marcato come tale. Dove la fonte non regge, sta
scritto **[non disponibile]** invece di un numero comodo.

---

## 1. Il punto di partenza, verificato

### 1.1 Il sito nuovo non è online — e il vecchio verrà spento

`www.domustua.com` serve ancora il **vecchio WordPress**. Verificato il 10 agosto 2026:
`robots.txt` con `Disallow: /wp-admin/`, sitemap `wp-sitemap.xml` (nucleo WordPress, quindi
nessun plugin SEO installato), menu *Cerchi Casa / Vendi Casa / Valuta il tuo immobile /
Servizi Domus / Chi siamo / Contattaci* — che non corrisponde alle rotte del repo.

**Confermato dalla cliente (10 agosto 2026):** il vecchio sito sarà **dismesso** e il dominio
puntato a questo. Non resta online in parallelo, non finisce su un sottodominio.

Due conseguenze, e la seconda ha una scadenza.

1. Finché non c'è il go-live, nessuna attività sul nuovo sito produce effetti. Il retainer si
   apre lì.
2. **Nel momento in cui il vecchio sito si spegne, i suoi contenuti spariscono.** Le 6 pagine
   servizio e le 7 pagine team che il sito nuovo non ha (§5.1) sono anche l'unico posto dove
   quei testi e quelle foto esistono. Vanno **archiviati prima dello spegnimento**: dopo, per
   ricostruirli restano solo la cache di Google e l'Internet Archive — e nessuno dei due
   restituisce le immagini a piena risoluzione. È un'attività di due ore che, saltata, ne costa
   venti.

### 1.2 Alla migrazione, 24 URL su 25 sarebbero andati in 404 — [RISOLTO]

[next.config.ts](../next.config.ts) conteneva **un solo redirect** (`/case` → `/acquista`). Il
vecchio sito ne espone 25, fra cui 7 legati al team e 7 ai servizi che nel sito nuovo non hanno
alcun corrispondente.

Mappa completa scritta e verificata sul server: tutti gli URL legacy atterrano su 200. Gli URL
con lo slash finale — cioè tutti quelli del vecchio sito — passano da **due** risposte, non una:
Next normalizza `/vendi-casa/` → `/vendi-casa` e poi applica il redirect. È accettabile (Google
segue le catene brevi senza penalità) ed è documentato nel file, così nessuno lo "corregge"
introducendo un middleware che non serve. `permanent: true` emette **308**, non 301: chi
verifica con `curl` deve accettarlo, altrimenti segnala 25 falsi errori.

Resta da fare **prima del passaggio**, e non dipende da noi: incrociare questi 25 URL con il
rapporto Pagine di Search Console degli ultimi 16 mesi. Venticinque è il conteggio del sitemap
WordPress, non dell'indicizzato (§5.0).

### 1.3 Gli immobili venduti mentivano a Google — [RISOLTO]

La scheda **mostrava correttamente** il venduto a chi legge: il blocco "questo immobile è stato
venduto" esiste in cinque lingue in
[PropertyDetail.tsx:408](../app/case/[slug]/PropertyDetail.tsx:408). Erano i dati strutturati a
dire il contrario — `availability: InStock` scritto senza mai guardare `p.sold`. La stessa
pagina affermava due cose opposte: *venduto* a una persona, *disponibile* a Google, che chiede
invece dati strutturati che siano *"a true representation of the page content"*.

Non era un difetto di interfaccia, quindi non è costato lavoro di interfaccia. Oggi la scheda
emette `SoldOut` sul venduto e distingue vendita da locazione con `businessFunction` — prima un
affitto da 800 € e una villa da 800.000 € portavano lo stesso identico markup.

### 1.4 Una copia del sito era indicizzabile su un dominio di servizio — [RISOLTO]

Trovato il 10 agosto 2026 mentre si preparava il passaggio: `domus-tua-ten.vercel.app`
rispondeva con `robots.txt` aperto a tutti i crawler e una riga
`Sitemap: https://www.domustua.com/sitemap.xml`. Cioè una copia completa del sito, indicizzabile,
che dichiarava come proprie delle URL servite in quel momento dal **vecchio WordPress**.

Il difetto non era una variabile dimenticata: `VERCEL_ENV` valeva legittimamente `production`,
perché quello *è* il deploy di produzione — solo su un dominio provvisorio. Nessuna variabile
d'ambiente può accorgersi della differenza, perché `NEXT_PUBLIC_SITE_URL` dice dove il sito
*vorrebbe* stare, non da dove *sta rispondendo*.

Ora la decisione guarda l'host della richiesta: il sito si dichiara indicizzabile solo quando
risponde dal proprio dominio (apex o `www`, indifferentemente). Conseguenza pratica: ogni
anteprima resta chiusa da sé, e il giorno in cui il dominio viene agganciato il sito si apre da
sé. Nessuna casella da spuntare in un momento in cui si stanno già spuntando venti caselle.

### 1.5 Non esiste alcuna misurazione

Nessun GA4, nessun Vercel Analytics, nessun tag. Confermato dal codice e da
[da-chiedere-alla-cliente.md](da-chiedere-alla-cliente.md) §5.9. Un retainer senza baseline non
è misurabile: la misurazione è il primo deliverable, non un accessorio.

### 1.6 Quello che invece è già fatto bene

Non è un sito da rifare. È un sito da far uscire e poi far crescere.

| Cosa | Dove |
|---|---|
| `RealEstateAgent` completo: `PostalAddress`, `GeoCoordinates`, `openingHours`, `sameAs` | [app/layout.tsx:102](../app/layout.tsx:102) |
| `aggregateRating` **deliberatamente omesso** per policy Google | [app/layout.tsx:101](../app/layout.tsx:101) |
| FAQPage allineato al testo visibile, con test di integrità | [app/domande-frequenti/faq.ts](../app/domande-frequenti/faq.ts) |
| Sitemap che esclude i `noindex` e non si contraddice | [app/sitemap.ts:8](../app/sitemap.ts:8) |
| Robots che blocca preview e staging | [app/robots.ts:13](../app/robots.ts:13) |
| Testo sempre nell'HTML iniziale (server component) | vincolo di [PRODUCT.md](../PRODUCT.md) |
| Budget LCP < 2,5s e CLS 0 — più severi delle soglie Google | [lighthouserc.js](../lighthouserc.js) |

L'ultima riga vale più di quanto sembri: **nessun crawler AI esegue JavaScript** (Vercel,
~1,3 miliardi di fetch — GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Perplexity, Meta,
ByteDance). Il vincolo "testo nell'HTML iniziale", nato per la SEO classica, ha già risolto a
monte il problema numero uno del GEO. Non c'è niente da rifare su questo fronte.

`aggregateRating` omesso è l'altra decisione che regge: Google, doc aggiornata al 24 luglio
2026, *"If the entity that's being reviewed controls the reviews about itself, their pages
that use LocalBusiness or any other type of Organization structured data are ineligible for
star review feature"* — con menzione esplicita dei widget di terze parti. Le stelle non
sarebbero comparse comunque; averle chieste avrebbe reso la pagina non eleggibile.

---

## 2. Cosa NON faremo, e perché

Questa sezione va **dentro la proposta commerciale**, non nascosta qui. È il differenziatore
verso chi venderà a Domus Tua "ottimizzazione per l'AI" a canone.

| Non lo facciamo | Motivo, con fonte |
|---|---|
| **llms.txt** | Ahrefs, 137.210 domini, maggio 2026: il 28% pubblica un file valido, **il 97% di quei file non ha ricevuto una sola richiesta in un mese**. I bot AI di retrieval sono l'1,1% del traffico residuo. Google dichiara di non usarlo. Se la cliente lo chiede perché gliel'hanno proposto altrove: lo generiamo gratis e lo misuriamo nei log per 60 giorni. |
| **Schema markup "per l'AI"** | Unico test con gruppo di controllo (Ahrefs, 1.885 pagine vs ~4.000 controlli, 11 maggio 2026): AI Overviews **−4,6%**, statisticamente significativo; AI Mode e ChatGPT indistinguibili da zero. Google: *"there's no special schema.org markup you need to add"*. Lo schema si mantiene per rich result ed entità, non si vende come leva di citazione. |
| **Rich result FAQ** | Feature spenta il 7 maggio 2026, documentazione rimossa il 15 giugno 2026. Il markup resta valido e innocuo; il risultato non c'è più. |
| **`aggregateRating` con le recensioni proprie** | Rende la pagina *ineligible*. Vale anche per i widget embeddati — da verificare che Trustindex non inietti markup `Review` nel DOM. |
| **Pagine per comune senza materiale proprio** | Spam policies aggiornate 15 maggio 2026, *doorway abuse*, esempio testuale: *"Having multiple domain names or pages targeted at specific regions or cities that funnel users to one page"*. Il criterio è intento ed esito, non il metodo di produzione — per questo la voce dice "senza materiale proprio" e non "a template": `/mercato/[comune]` (§7.2) *è* un template ripetuto per comune, e sta nel livello più caro. Ciò che lo rende legittimo è il dato OMI e il commento firmato, non la forma. |
| **Chiedere keyword nelle recensioni, incentivare, filtrare i soddisfatti** | Google Maps UGC Policy vieta esplicitamente incentivi e *"request that specific content be included"*. |
| **Refresh sistematico "per le AI Overviews"** | Nelle AIO i contenuti citati hanno in media 1.432 giorni contro i 1.416 dell'organico: differenza dell'1,1%, cioè nessuna (Ahrefs, 16,9M URL). Cambiare la data senza toccare il contenuto è segnalato da Google come pratica problematica. |
| **Audit mensile di cannibalizzazione** | Ahrefs, 9.700 casi + 80 keyword riviste a mano: **1 su 80** richiedeva intervento. Serve una mappa intento→URL prima di pubblicare, non un audit ricorrente da fatturare. |
| **Garanzie di posizione** | Google, "Do I need an SEO?": *"No one can guarantee a #1 ranking on Google"*. Chi lo promette è un red flag secondo Google stesso. |
| **Promettere traffico dalle AI** | Search Console dà **solo impression** sulle feature generative: niente click, niente CTR, niente query. Similarweb: i servizi professionali hanno un citation rate **sotto il 4%**. Il GEO è posizionamento a 12-24 mesi, non un canale. |
| **Speakable, sitelinks searchbox** | Speakable è beta USA/inglese; il sitelinks search box è dismesso da fine 2024. |

### 2.1 Fuori perimetro — da scrivere in contratto, non lasciato implicito

Lo scope creep è il primo ostacolo alla redditività di un retainer (59 agenzie su 115,
SE Ranking). Queste attività non sono né incluse né escluse oggi, e una cliente che pubblica
già molto su Instagram darà per scontato che ce ne occupiamo noi.

| Fuori | Nota |
|---|---|
| Calendario editoriale social della cliente, community management, advertising | Includiamo **solo** la distribuzione dei pezzi che produciamo: 1 post GBP + 1 adattamento social per pezzo (§6, settimana 3) |
| Scrittura degli annunci sui portali | Restano al gestionale e all'agenzia. Vedi però la regola di scrittura delle schede in §7.2 |
| Newsletter e lead magnet scaricabile | Introducono un adempimento ricorrente e un obbligo privacy senza un proprietario del canale lato cliente |
| Calcolatori interattivi ("quanto costa vendere casa a…") | È sviluppo, non redazione: si prezza a parte e non si promette finché i cluster non sono in piedi |

E i numeri che **non** useremo, perché la verifica li ha smontati: "+44% con FAQ schema",
"+403% inquiry con video", "ROI SEO 1.389%", "+40% local pack con NAP coerente",
"3,2x citazioni con topic cluster". Nessuno regge a una fonte primaria.

> Dichiarare cosa non faremo, con la fonte accanto, è l'argomento di vendita più forte verso
> un'imprenditrice che ha costruito il posizionamento sulla trasparenza — e verso concorrenti
> che venderanno esattamente quelle cose.

---

## 3. Quello che invece è vero, e su cui si costruisce

**3.1 Le query locali pure sono fuori dal perimetro AI.** Whitespark, 540 query manuali su
6 verticali *fra cui gli agenti immobiliari* (maggio 2025, campione USA):

| Intento | AI Overview | Local Pack |
|---|---|---|
| Locale (*agenzia immobiliare Tradate*) | 15% | **93%** |
| Informativo (*quanto costa vendere casa*) | **92%** | 6% |
| Ibrido (*quanto costa vendere casa a Tradate*) | **97%** | 17% |

Due canali distinti, due lavori distinti: il Local Pack si vince con Google Business Profile e
recensioni, l'AI Overview con i contenuti informativi. Non c'è una leva sola.

**3.2 Le menzioni contano più dei link.** Ahrefs, 75.000 brand: menzioni web brandizzate
**0,664**, anchor brandizzate 0,527, Domain Rating 0,326, **backlink 0,218**. È una
correlazione, non una causa — gli autori lo dichiarano. Ma sposta il budget dal link building
alla presenza reale: liste, aggregatori, stampa locale, professionisti del territorio.

**3.3 Esiste una fonte dati locale ufficiale, gratuita e citabile.** L'Osservatorio del Mercato
Immobiliare dell'Agenzia delle Entrate pubblica €/mq min-max per zona omogenea di ogni comune,
per tipologia e stato, semestralmente (ultimo: 2° semestre 2025, aggiornato 16 marzo 2026).
Obbligo di citazione: «Agenzia delle Entrate – OMI». È l'unico modo di fare pagine per comune
che non siano doorway: ogni pagina porta un dato ufficiale che nessun concorrente locale usa.

**3.4 Il campo editoriale locale è deserto.** Verificato uno per uno:

| Concorrente | Contenuti |
|---|---|
| Atmosphera Immobiliare | 57 articoli, **ultimo 14 maggio 2025** — fermo da 15 mesi |
| Giglio Immobiliare | sitemap dei post `lastmod 2021-03-02` — morto da 5 anni |
| MIHOMI | 3 post del 28 gennaio 2025, zero FAQ, zero dati, autore generico "MIHOMI" |
| Studio Venegono (Getrix) | nessun blog |
| Tecnocasa Malnate | nessun blog, pagina zona **senza H1** |
| Gabetti | assente dal bacino: la sede più vicina è Saronno |

I riferimenti di categoria da studiare sono altrove: **OMH Oh My House** (Gallarate) con
"Vendite di successo", video testimonianze e FAQ, 303 recensioni a 4,7; e **Dove.it** a livello
nazionale, con l'hub `/guida/vendere` — che però **non firma nessun articolo e non ha FAQ**.
È esattamente il varco: contenuti firmati da chi il lavoro lo fa.

**3.5 Le recensioni hanno una scadenza.** BrightLocal 2026 (1.002 adulti, campione USA — la
direzione vale, i valori assoluti no): il **74%** considera solo le recensioni degli ultimi
3 mesi; l'**80%** preferisce chi risponde a tutte; il **50%** diffida delle risposte
template; il **45%** usa già l'AI per raccomandazioni locali.

Domus Tua ha 531 recensioni a 4,9. Il KPI non è il totale — è saturo. Il KPI è
**quante ne arrivano ogni mese e quanti giorni sono passati dall'ultima**.

---

## 4. Quali query si possono vincere, e quali no

**Sì, e vanno presidiate**

- `agenzia immobiliare Tradate` e i comuni limitrofi → Local Pack (93% sulle query locali) +
  organico. A Tradate prossimità e categoria sono già vinte per costruzione.
- Informative e ibride locali: *quanto costa vendere casa a Tradate*, *chi paga la provvigione*,
  *quali documenti servono per vendere*, *quanto passa dal preliminare al rogito*,
  *quanto costa l'APE*, *prezzo al mq a Venegono*. Campo libero (§3.4) e formato con la
  probabilità di AI Overview più alta (92-97%).
- Query di servizio: *valutazione immobiliare [comune]*, *home staging*, *virtual rendering*,
  *video marketing immobiliare*, *successioni e immobili ereditati*. Oggi **non hanno pagina**
  sul sito nuovo — e ce l'avevano sul vecchio.
- **Brand ed entità proprietarie**: *domus tua tradate*, *domus tua immobiliare recensioni*,
  *domus tua opinioni*, *Open Domus*, *Metodo Domus Tua*. Convertono più di tutto il resto e
  costano nulla; oggi quelle posizioni sono occupate dal vecchio sito, dalle 7 pagine team e
  dalla scheda Maps. Controllo della SERP di brand nei **giorni 1, 7 e 30** dopo lo spegnimento:
  è il primo posto dove una migrazione sbagliata si vede. *Open Domus* e *Metodo Domus Tua*
  sono l'unico terreno dove non si compete con nessuno.
- Long tail del singolo immobile su `/case/[slug]` — **ma non per il motivo ovvio**. Lo stesso
  immobile esiste anche su idealista e immobiliare.it, quasi certamente con la descrizione dello
  stesso feed RealSmart e le stesse foto: è duplicazione verso domini con due ordini di
  grandezza di autorità in più, e su un descrittore generico ("trilocale ristrutturato
  Venegono") vince la copia più autorevole, che non è la nostra. La scheda vince sulle query di
  codice e indirizzo, sulla navigazione di brand, e su ciò che il portale non può ospitare.
  Da cui una regola di scrittura, non un'assunzione (§7.2).

**No, e va detto in proposta**

- `case in vendita [comune]`: contro idealista.it (29,85M visite/mese), immobiliare.it
  (26,16M), casa.it (5,85M) — la più grande rete di agenzie, tecnocasa.it, si ferma a 1,02M
  (Semrush, giugno 2026). Quel traffico si intercetta **pubblicando sui portali**, non
  contendendolo.
- Il transazionale dentro ChatGPT: idealista ha lanciato la propria app nativa il 13 marzo 2026
  (copertura per l'Italia **da verificare**).
- Il Local Pack su Varese, Malnate, Castiglione, Venegono: la prossimità è il secondo fattore e
  non si compra. Quei comuni si prendono con organico e contenuti, non con Maps.

> ⚠️ **Non abbiamo ancora una baseline SERP.** I rilevamenti fatti in ricerca sono passati da
> un backend Bing non geolocalizzato su Tradate, senza Local Pack. Vanno rifatti su Google
> geolocalizzato come **prima attività** del retainer. Fino ad allora nessuna posizione va
> scritta in un documento per la cliente.

---

## 5. Il lancio — una settimana, non un mese

Il sito è pronto per andare online. Quindi l'avvio non è un mese di lavoro: è una settimana di
cose che vanno fatte **nell'ordine giusto**, più due che dipendono da quando la cliente stacca
il vecchio hosting. Fatturato a parte come avvio, perché non si ripete.

### 5.-1 Cosa è già stato fatto — 10 agosto 2026

Il debito tecnico che avrebbe reso sbagliato il go-live è chiuso. Verificato sul server, non
solo scritto:

| Fatto | Verifica |
|---|---|
| Mappa completa dei redirect legacy | 15 URL provati con `curl`: tutti finiscono su 200 |
| `SoldOut` e `businessFunction` sulle schede | La prima scheda del sitemap è un venduto, e ora lo dichiara |
| `["Product","Residence"]` → grafo `RealEstateListing` + `Apartment`/`House`/`Place` + `Offer` | Nodi legati da `@id`, superficie in `QuantitativeValue` (MTK), locali e bagni |
| `@id` sull'organizzazione | `https://www.domustua.com/#organization`, già referenziato da `provider` e `seller` di ogni scheda |
| `lastmod` che mentiva → rimosso | 0 `lastmod`, 0 `changefreq` nel sitemap |
| Immagini nel sitemap | 196 foto dichiarate, una per scheda |
| Canonical ereditato dal layout → rimosso | `/privacy` e `/cookie` non dichiarano più la home come propria canonica |
| Bot di retrieval nel `robots.txt` | 7 gruppi nominati, **solo** nel ramo di produzione |
| `keywords` rimosso | Non compare più nel `<head>` |
| Title delle schede | 63 caratteri su un caso reale, comune incluso |

Typecheck pulito, 517 test verdi, parser 81/81, build a 196 schede, nessun errore a runtime.

### 5.-0 Cosa resta, in ordine

1. **Archiviare il vecchio sito** (§5.0) — l'unica cosa irreversibile, e ha una scadenza che
   non decidiamo noi.
2. **Chiudere l'inventario degli URL** con Search Console e completare la mappa: mezza giornata.
3. **Misurazione** (§5.2): senza, il giorno del lancio non esiste un "prima".
4. **Passaggio del dominio** con la checklist di §5.1 — TTL abbassato 48 ore prima.
5. **Profilo Google** (§5.4) e baseline SERP geolocalizzata: si possono fare anche dopo, ma
   entro la prima settimana.

Dal giorno dopo si entra nel ciclo mensile di §6. Non c'è un "mese di preparazione": il primo
mese di canone produce già contenuti.

### 5.0 Archiviare il vecchio sito — [scadenza: prima dello spegnimento]

Da fare **come primissima attività**, perché è l'unica irreversibile.

- Crawl completo dei 25 URL: HTML, testi, `<title>` e meta description, `<h1>`/`<h2>`.
- Immagini a piena risoluzione da `/wp-content/uploads/` — comprese quelle delle 7 pagine
  team, che sono ritratti professionali probabilmente non archiviati altrove.
- Export dei testi delle 6 pagine servizio: sono la materia prima delle nuove pagine (§7.1),
  e riscriverli da zero è il grosso del costo di quel lavoro.
- Screenshot integrali a scopo di prova (com'era il sito il giorno del passaggio).

**L'inventario dei 25 URL non è l'inventario dell'indicizzato.** Venticinque è il conteggio di
`wp-sitemap.xml`; un sito vivo dal 2007 ha quasi certamente URL indicizzati che il sitemap del
nucleo WordPress non espone. L'elenco definitivo si costruisce incrociando:

- rapporto **Pagine** di Search Console sugli ultimi 16 mesi — **tutti** gli URL con impression,
  non solo quelli con click (dopo lo spegnimento il dato non è più ricostruibile);
- Bing Webmaster Tools e i backlink noti;
- i pattern WordPress che il sitemap non elenca: `/?p=N`, `/feed/`, `/category/*`, `/tag/*`,
  `/author/*`, le pagine allegato delle immagini, le paginate.

Da decidere nello stesso passaggio: cosa risponde il server a `/wp-content/uploads/**`. Quelle
foto sono indicizzate in Google Immagini e linkate da portali e social. O si redirigono ai nuovi
percorsi, o si accetta la perdita — ma va deciso, non subìto.

**Inventario delle citazioni esterne.** Per ogni scheda dell'agenzia fuori dal sito (portali,
elenchi, associazioni, camera di commercio, aggregatori, vecchi comunicati): nome esatto,
indirizzo, telefono e **URL pubblicato**. Il motivo non è statistico — §2 smonta giustamente il
"+40% local pack" — è meccanico: diciannove anni di citazioni puntano a URL legacy e
sopravvivono solo finché reggono i redirect. Le directory che mostrano l'URL come testo, o che
validano i link periodicamente, non li seguono. Le difformità si annotano qui e si correggono a
mano dopo il go-live (§8).

Archivio in `_refs/legacy-site/`, fuori dal bundle.

### 5.1 Go-live e mappa dei redirect

I 25 URL legacy, con la destinazione. Le sei righe marcate ▲ **non hanno oggi una destinazione
propria**: è il motivo per cui le pagine servizio (§7.1) sono il primo lavoro editoriale e non
il terzo.

| URL legacy | Destinazione |
|---|---|
| `/` | `/` |
| `/cerchi-casa/` | `/acquista` |
| `/vendi-casa/` | `/vendi` |
| `/servizi-domus/` | `/servizi` |
| `/servizi-domus/open-domus/` | `/open-domus` |
| `/servizi-domus/home-staging/` ▲ | `/servizi/home-staging` |
| `/servizi-domus/servizio-di-rendering-e-virtual-rendering/` ▲ | `/servizi/rendering-e-virtual-tour` |
| `/servizi-domus/emotional-video-marketing-immobiliare/` ▲ | `/servizi/video-marketing-immobiliare` |
| `/servizi-domus/servizi-tecnico-amministrativi-legali-2/` ▲ | `/servizi/servizi-tecnici-e-legali` |
| `/servizi-domus/produzione-contenuti-e-campagne-marketing/` ▲ | `/servizi/contenuti-e-campagne` |
| `/chi-siamo/` | `/chi-siamo` |
| `/team/` | `/chi-siamo` |
| `/team/raffaela-rizza/` ▲ | `/chi-siamo/raffaela-rizza` |
| `/team/eleonora-dagati/` | `/chi-siamo` → poi pagina persona |
| `/team/katya-fedrigo/` | `/chi-siamo` → poi pagina persona |
| `/team/tiziana-galeone/` | `/chi-siamo` → poi pagina persona |
| `/team/paloma-cavalcante/` | `/chi-siamo` → poi pagina persona |
| `/team/viola-benatti/` | `/chi-siamo` → poi pagina persona |
| `/contatti/` | `/contatti` |
| `/entra-a-far-parte-del-team/` | `/lavora-con-noi` |
| `/candidatura/` | `/lavora-con-noi` |
| `/diventa-agente/` | `/lavora-con-noi` |
| `/privacy-policy/` | `/privacy` |
| `/cookies-policy/` | `/cookie` |
| `/chi-siamo-copy/` | `/chi-siamo` — duplicato indicizzabile, va chiuso |

Da verificare prima del go-live: **"Valuta il tuo immobile"** è nel menu del sito vivo ma
**non nella sitemap**. Se è una pagina reale o uno strumento esterno, va in mappa; se è un
ancora, no.

#### Da verificare una volta sola, per iscritto, prima del passaggio

- **`NEXT_PUBLIC_SITE_URL` in Production risolve a `https://www.domustua.com`.**
  [app/lib/site.ts:101](../app/lib/site.ts:101) ha un fallback corretto, ma una variabile
  *impostata male* (l'URL `vercel.app` dell'anteprima) non dà errore da nessuna parte: canonical,
  Open Graph e l'intero sitemap si autodichiarerebbero fuori dominio. Asserzione in CI più
  controllo a occhio sull'HTML del primo deploy in produzione.
  L'indicizzazione, invece, **non dipende più da questa variabile**: il sito si apre ai
  crawler solo quando risponde davvero dal proprio dominio (§1.4), quindi il giorno del
  passaggio non c'è alcun flag da ricordarsi di girare.
- **`domustua.com` e `www.domustua.com` entrambi sul progetto Vercel**, `www` primario, apex in
  redirect permanente. Il vecchio WordPress sta su `www`: un apex scoperto apre due host
  indicizzabili nel giorno peggiore.
- **TTL del record DNS abbassato a 300s almeno 48 ore prima**, e ora del cambio concordata con
  chi tiene il DNS. Con un TTL alto il passaggio si trascina un giorno intero, con crawler e
  persone su un hosting già spento.
- **HSTS.** [next.config.ts:24](../next.config.ts:24) invia già `includeSubDomains; preload`:
  verificare che nessun sottodominio legacy (posta, webmail, vecchi staging) debba restare
  raggiungibile in HTTP, e se il dominio è già stato sottomesso alla lista di preload. Dieci
  minuti; il nesso con il go-live non lo indovina nessuno.

#### La verifica dei redirect si fa PRIMA, non dopo

Script `curl -sIL` sui 25 URL legacy **nella forma esatta con lo slash finale**, contro il
deploy Vercel con l'Host di produzione, la settimana prima del passaggio. Per ciascuno: numero
di salti, catena dei `Location`, stato finale.

Criterio di accettazione: **redirect permanente (301 o 308), un solo salto, destinazione 200**,
nessun redirect verso la home (Google li tratta come soft 404). Mai `robots.txt` come strumento
di rimozione, mai catene.

> **Due dettagli che cambiano l'implementazione, entrambi da chiudere prima di scrivere la mappa.**
>
> **Lo slash finale.** Tutti e 25 gli URL legacy finiscono con `/`, le rotte nuove no, e
> `next.config.ts` non imposta `trailingSlash` (default `false`). Next normalizza
> `/cerchi-casa/` → `/cerchi-casa` e *poi* applica il redirect dichiarato: **due salti**, cioè
> esattamente ciò che il criterio qui sopra vieta. O si accetta consapevolmente — e allora la
> regola si riscrive "un salto oltre la normalizzazione" — oppure la mappa intera va in
> `middleware.ts`, che gira prima della normalizzazione e risponde con un solo redirect alla
> destinazione finale. Scoprirlo dopo il rilascio significa scoprirlo a vecchio sito già spento.
>
> **301 contro 308.** In Next 16 `permanent: true` emette **308**, non 301. Ai fini della
> canonicalizzazione sono equivalenti: chi verifica con la regola "deve essere 301" segnalerà
> venticinque falsi problemi, o forzerà `statusCode: 301` senza motivo.

### 5.2 Misurazione, da zero

1. Search Console — accesso **in lettura** in fase di audit, come raccomanda Google, poi
   delega piena. Serve lo storico 12-16 mesi del dominio attuale, che si perde se la proprietà
   viene ricreata.
2. GA4 con consenso rispettato (il gate esiste già in [app/lib/consent.ts](../app/lib/consent.ts)),
   più un canale personalizzato **AI Assistants** con le regex per chatgpt.com, perplexity.ai,
   gemini.google.com, copilot.microsoft.com, claude.ai.
3. **Bing Webmaster Tools** + report *AI Performance* (public preview dal 10 febbraio 2026).
   Dà quello che Google non dà: citazioni in Copilot e, soprattutto, le **grounding queries**.
   Gratuito. Bing vale il 5,1% in Italia come motore, ma è l'indice da cui pescano ChatGPT
   Search e Copilot: si presidia per quello, non per la sua quota.
4. Vercel Observability, bot in **tre categorie distinte**, non una:
   - *training/batch* — GPTBot, ClaudeBot, CCBot;
   - *retrieval per l'indice* — OAI-SearchBot, PerplexityBot, Claude-SearchBot;
   - **fetch innescati da una persona** — ChatGPT-User, Perplexity-User.

   Solo la terza è un segnale di domanda, e **GA4 non la vede**: molti di quei passaggi arrivano
   senza referrer e finiscono in `direct`, quindi il canale *AI Assistants* del punto 2 li perde
   per costruzione. È l'unica misura di visibilità AI gratuita, non stocastica e coerente con
   §2: non promette citazioni, conta fetch reali lato server.
5. IndexNow (Bing + Yandex), agganciato al rilascio.
6. **Eventi di conversione, definiti all'installazione e non dopo**: invio form, click su
   `tel:`, click su WhatsApp, click su `mailto:`, richiesta di valutazione. Per un'agenzia
   locale la conversione principale è la telefonata: senza il click su `tel:` si misurano solo
   i form — cioè la minoranza dei contatti — e si conclude che i contenuti non convertono.
   Insieme, una **tassonomia UTM decisa una volta** e applicata a: URL del sito nel profilo
   Google, link nei post GBP, profili aggregatori rivendicati (§8), descrizioni YouTube. Senza,
   quei tre canali collassano in `organic`/`direct` e il terzo KPI contrattuale non è
   producibile.
7. **Rendimento del profilo Google, con export mensile** in `_refs/`: ricerche dirette,
   discovery, chiamate, richieste di indicazioni, click al sito. Lo storico è consultabile solo
   per una finestra limitata e non si ricostruisce. Oggi il canale che questo stesso piano
   valuta "quanto tutto il resto del mese messo insieme" è l'unico non misurato.
8. **Sitemap inviato** in Search Console e Bing, con controllo dello stato di lettura — è
   l'unico posto dove si legge il tasso di indicizzazione per tipo di contenuto. E una
   **proprietà di tipo Dominio** (verifica DNS) accanto a quella con prefisso URL: copre www,
   apex, http e https in un colpo, ed è il solo modo di accorgersi se dopo il passaggio
   qualcosa continua a essere servito sull'host sbagliato. Non tocca la proprietà esistente,
   quindi non mette a rischio lo storico.
9. **Fonti di domanda proprietarie**, per coprire il freddo dei primi mesi. Search Console
   mostra solo le query per cui *già* si compare: sui contenuti nuovi è vuota per 3-4 mesi, e
   lo storico del dominio è quello di un WordPress da 25 pagine senza blog, cioè quasi solo
   navigazionale di brand. Dal giorno uno abbiamo invece:
   - logging anonimizzato (nessun dato personale, dentro il gate di
     [app/lib/consent.ts](../app/lib/consent.ts)) del testo delle domande che passano da
     `/api/assistant` e delle stringhe di `/api/search`, con export mensile;
   - un foglio in agenzia dove si annota **la frase testuale** delle domande che arrivano al
     telefono, su WhatsApp, in mail e al banchetto degli Open Domus.

   Da lì escono le formulazioni letterali che diventano gli H2. È materia prima che nessun
   concorrente può replicare né comprare, e costa un'ora di lavoro su endpoint che esistono già.
10. **Presidio dei 404 — giorni 1, 3, 7, 14, 30, poi mensile.** Fonti: rapporto *Pagine → Non
    trovata* di GSC, log Vercel filtrati su stato 404 con il referrer, Bing. Nota
    implementativa: [app/not-found.tsx](../app/not-found.tsx) è statica e non riporta il
    percorso richiesto — il dato viene dai log, non dal componente. È il solo modo di trovare
    gli URL legacy che nessuno aveva in lista mentre c'è ancora tempo per redirigerli.
11. **Fotografia del "prima"**: screenshot e export di tutto, incluso il report delle feature
    generative in GSC. Senza, fra sei mesi non si dimostra niente.

### 5.3 I fix tecnici — quasi tutti già applicati

Le righe elencate in §5.-1 sono **fatte e verificate**: restano qui perché la colonna "perché"
è la motivazione da dare alla cliente se chiede conto di una scelta, e perché chi tocca quei
file fra sei mesi deve sapere che non erano sviste.

Non ancora fatte, e sono le uniche tre che richiedono lavoro vero:
**sitemap segmentate per tipo** (poche ore, prima della prima ondata di pagine),
**soglia di qualità in ingresso dal feed**, e **breadcrumb come primitiva condivisa**. Più i
test in CI, che si aggiungono quando si aggiunge la prima rotta nuova.

| Fix | Dove | Perché |
|---|---|---|
| Il venduto: stato in pagina **e** nello schema | [app/case/[slug]/page.tsx](../app/case/[slug]/page.tsx), [app/sitemap.ts](../app/sitemap.ts) | La pagina il venduto lo mostrava già (§1.3): erano i dati strutturati a contraddirla. Valori esatti: `SoldOut` (non `OutOfStock`, che significa temporaneamente esaurito) e `businessFunction` `Sell`/`LeaseOut` — [availability.ts](../app/lib/availability.ts) documenta che `sold` copre "venduto **o affittato**", e prima un affitto da 800 € e una villa da 800.000 € portavano lo stesso identico markup |
| Fine vita dell'URL dell'immobile | idem + `sold-detected.json` | Lo slug che sparisce dal feed oggi finisce in `notFound()`: 404 secco. `sold-detected.json` esiste già ed è già mantenuto: si usa per un 301 verso `/acquista` filtrato sul comune, oppure per tenere in piedi una pagina "venduto". Far evaporare quegli URL a ogni rogito butta via la long tail che §4 indica come terreno da presidiare |
| `["Product","Residence"]` → `RealEstateListing` + nodo collegato | idem | `Product` richiede un prodotto realmente acquistabile con prezzo esposto e vincolante: un immobile in trattativa non lo è. **Non è una sostituzione uno-a-uno**: `RealEstateListing` è sottotipo di `WebPage` e non porta `address`, `geo`, superficie o locali. Due nodi: `RealEstateListing` (`url`, `datePosted`, `offers`) con `mainEntity` → `Apartment`/`House`/`SingleFamilyResidence` che porta `address`, `geo`, `floorSize` come `QuantitativeValue` in m², `numberOfRooms`, `yearBuilt`. **In proposta va detto che nessuna delle due forme produce un rich result**: Google non ne ha uno per gli immobili. Si fa per pulizia di entità |
| Grafo di entità: gli `@id` prima di tutti gli altri schema | [app/layout.tsx:102](../app/layout.tsx:102) e ogni rotta con JSON-LD | In tutto il repo **non esiste un solo `@id`**: ogni pagina ripete oggetti letterali. Stiamo per aggiungere `Person`, `Service`, `Article` e `VideoObject` su decine di rotte: senza `@id` Raffaela diventa cinque entità diverse e l'agenzia un nodo scollegato ripetuto ovunque. `${siteUrl}/#organization`, `${siteUrl}/#website` (senza `SearchAction`, dismesso), `${siteUrl}/chi-siamo/<slug>#person`. Va fatto **prima**: rifarlo dopo significa toccare tutte le rotte |
| `lastmod`: regola provvisoria | [app/sitemap.ts:29](../app/sitemap.ts:29) | Oggi un solo `new Date()` per tutto: a ogni deploy ogni URL dichiara di essere cambiato. Google lo usa *"if it's consistently and verifiably accurate"*. Finché RealSmart non espone `updatedAt`: **data stabile per URL, oppure campo omesso**. Omettere è legittimo e non costa nulla; mentire brucia il campo per l'intero host, e la risposta della cliente può arrivare fra mesi mentre il deploy no |
| Sitemap segmentate per tipo + indice | idem | `/case`, `/servizi`, `/zone`, `/mercato`, `/video`, editoriale, istituzionali. Next.js supporta più sitemap nativamente. È ciò che rende leggibile il tasso di indicizzazione **per pattern** in GSC — "l'ondata zone è indicizzata al 100%, le schede al 60%" — invece di un unico numero aggregato. Poche ore, da fare prima della prima ondata |
| Test in CI di copertura del sitemap | idem | Ogni rotta indicizzabile compare una e una sola volta, nessuna rotta `noindex` vi compare, ogni URL risponde 200. La lista `routes` in [app/sitemap.ts:11](../app/sitemap.ts:11) è compilata a mano e stiamo per aggiungere decine di rotte |
| Togliere `changeFrequency` | idem | Google lo ignora: codice morto che suggerisce una garanzia inesistente |
| Soglia di qualità in ingresso dal feed | [app/case/[slug]/page.tsx](../app/case/[slug]/page.tsx) | La scheda va in `noindex` finché descrizione e numero di foto restano sotto soglia, con report mensile delle schede sotto soglia da girare alla cliente perché le completi nel gestionale. `/case/[slug]` è **il vero sistema a scala del sito**, l'unico che cresce da solo, alimentato da un feed la cui qualità non controlliamo |
| Canonical derivato dal pathname + test in CI | [app/layout.tsx:76](../app/layout.tsx:76) | Oggi il layout impone `/` e 12 rotte lo sovrascrivono; `/privacy` e `/cookie` lo ereditano. Trappola armata per ogni rotta futura — e ne stiamo per aggiungere decine |
| Test in CI di unicità di title e description | tutte le rotte | Fallisce se due rotte condividono title o description. È il modo più economico di rendere operativa la mappa intento→URL (§7.0): se due pagine collidono, se ne accorge la CI prima di Google |
| Title delle schede immobile | [app/case/[slug]/page.tsx:25](../app/case/[slug]/page.tsx:25) | `${p.title}, ${p.zone}` più il template ` · Domus Tua Immobiliare` supera i 70 caratteri su casi reali, e **il comune è la prima cosa che sparisce** nella troncatura. È la famiglia di URL più numerosa. Si sovrascrive il template su questa rotta: una riga |
| Verificare "4.9/5 da oltre 500 recensioni" | [app/layout.tsx:74](../app/layout.tsx:74) | È nella meta description di default, quindi **ereditata da ogni rotta** che non la sovrascrive. §13 dice che il dato viene dal widget Trustindex, cioè auto-riportato. §5.5 impone che i contatori del *vecchio* sito siano documentabili o rimossi: la stessa regola vale per il nuovo |
| Togliere l'array `keywords` | [app/layout.tsx:78](../app/layout.tsx:78) | Google non lo usa da oltre quindici anni. Stesso ragionamento di `changeFrequency` |
| Audit `nosnippet` / `max-snippet` | tutto il sito | È **l'unico requisito tecnico** per comparire nelle AI feature: *"a page must be indexed and eligible to be shown with a snippet"* |
| robots.txt: i gruppi nominati **dentro** il ramo di produzione | [app/robots.ts:18](../app/robots.ts:18) | Nel protocollo robots i gruppi **non si sommano**: `User-agent: OAI-SearchBot` non eredita le regole di `*`, vince il più specifico. Oggi in preview si emette `{ userAgent: "*", disallow: "/" }`: aggiungendo i gruppi nominati in modo incondizionato, sulle anteprime i bot di retrieval smettono di essere coperti dal blocco — cioè si rompe la protezione che §1.6 elenca fra le cose già fatte bene, su un sito che **vive ancora sulle anteprime**. Quindi: gruppi nominati dentro `isProduction`, test in CI che in preview non ne venga emesso nessuno, test di parità che ogni futuro `Disallow` su `*` sia replicato |
| Google-Extended: riga a sé, non fra i bot di training | idem | Non è un crawler assimilabile a GPTBot e ClaudeBot: è un token che governa se il contenuto già raccolto da Googlebot può essere usato dalle app Gemini e dal grounding di Vertex. Il grounding è **retrieval**: bloccarlo toglie Domus Tua dalle risposte di Gemini. Presentarlo alla cliente come scelta indolore sull'addestramento ne sottostima il costo. (AI Overviews e AI Mode seguono Googlebot e non hanno opt-out separato) |
| Sitemap immagini | [app/sitemap.ts](../app/sitemap.ts) | Next.js supporta il campo `images` nativamente. Le foto sono un asset proprietario |
| Breadcrumb come primitiva condivisa | 3 pagine + `PropertyDetail` | Oggi è scritto a mano in tre punti e duplicato a parte. Nav visibile e JSON-LD dalla stessa fonte, con test di integrità: stiamo per aggiungere cinque famiglie di rotte a profondità due, ed è uno dei pochi rich result ancora vivi e rilevanti |
| INP: metrica di campo, non di laboratorio | §5.2 + [lighthouserc.js](../lighthouserc.js) | **Correzione a quanto scritto altrove:** l'INP si misura al 75° percentile su interazioni reali; un audit Lighthouse non lo produce, e [lighthouserc.js:74](../lighthouserc.js:74) asserisce già `total-blocking-time` a 300ms, che è il proxy di laboratorio. In CI si stringe il TBT verso i 200ms; l'INP vero entra fra le fonti di §5.2 (Segnali web essenziali in GSC, CrUX, Vercel Speed Insights). Il rischio resta quello identificato — GSAP + Lenis + carosello + assistente — ma lo strumento era sbagliato |

### 5.4 Google Business Profile

Ruolo **manager**, mai owner. Categoria primaria e secondarie, campo Servizi (quasi certamente
vuoto), orari reali estesi e orari speciali, pin, foto, verifica di profili duplicati o mai
rivendicati dal 2007. È il canale che copre il 93% delle query locali: vale quanto tutto il
resto del mese messo insieme.

Più una cosa che nessuno fa: **popolare la sezione Domande e risposte del profilo**, riusando le
domande già in produzione editoriale — chi paga la provvigione, quanto costa l'APE, quali
documenti servono, quanto passa dal preliminare al rogito — con risposta breve e link alla
pagina. Da tenere ben distinto dal divieto di §2: chiedere contenuto specifico *dentro una
recensione* è vietato dalla UGC Policy; porre e rispondere a domande sul proprio profilo è una
funzione prevista da Google.

### 5.5 I numeri sul sito attuale

Il vecchio sito espone contatori ("clienti soddisfatti", "transazioni concluse"). O sono
documentabili dal gestionale, o vanno rimossi: sono in conflitto diretto con la regola di
[PRODUCT.md](../PRODUCT.md) e sono materiale che i modelli linguistici leggono e ripetono.

---

## 6. Il ciclo mensile

Dal mese 2, ogni mese ha la stessa forma. Cambia il contenuto, non la struttura.

| Settimana | Cosa |
|---|---|
| **1** | Lettura dei dati (GSC, GA4, rendimento GBP, Bing AI Performance, log bot per le tre categorie). Griglia di ranking locale sui comuni. Nuove recensioni e risposte. Selezione dei pezzi **dalle domande realmente arrivate** — query in ingresso, log dell'assistente e della ricerca, foglio delle domande al telefono (§5.2.9) — non da una lista fatta a gennaio. Brief compilati (§7.0). |
| **2** | Produzione: scrittura, foto, trascrizioni. **Bozza al firmatario entro fine settimana**, ritorno entro tre giorni lavorativi: oltre, il pezzo slitta al mese dopo. Non si pubblica non firmato. |
| **3** | Pubblicazione: pagine, schema, link interni, sitemap, IndexNow. Post GBP con UTM e un adattamento social **per ogni pezzo** — nient'altro (§2.1). Lato YouTube dei video che diventano watch page: descrizione, capitoli, link. |
| **4** | Verifica dell'indicizzazione **dal rapporto sitemap di GSC**, controllo delle pagine orfane, presidio dei 404, fix tecnici emersi, trenta giorni di osservazione dopo un eventuale core update, nota mensile alla cliente. |

**Il ritmo delle interviste.** Il livello Crescita produce fino a otto deliverable al mese e
ciascuno, per regola, porta un elemento non replicabile: mezz'ora al mese non ne estrae otto.
Serve una **sessione registrata trimestrale da 60-90 minuti a tema**, che alimenta una banca
citazioni indicizzata per pezzo, più 10-15 minuti asincroni a settimana per le verifiche
puntuali. O il ritmo si adegua, o la regola non negoziabile salta al secondo mese.

**Le pagine orfane non sono igiene, qui.** Una pagina comune raggiungibile solo dalla sitemap
*è* il segnale che Google punisce come doorway. Il controllo mensile — nessuna pagina con zero
link interni in entrata, ogni articolo di cluster linka il proprio hub, alcuni si linkano fra
loro — è il presidio del rischio di §7.2, non un adempimento. Sugli anchor: mai "scopri di più"
o "leggi tutto", e mai lo stesso anchor esatto due volte verso la stessa pagina.

**Presidio degli aggiornamenti algoritmici.** Nel 2026 tre core update e due spam update.
SE Ranking (100k keyword): dopo marzo 2026 il **79,5%** delle posizioni TOP3 era cambiato,
contro il 66,8% di dicembre 2025. Conseguenza contrattuale: finestre di misura a **90 giorni**,
mai ranking settimanali, e trenta giorni di osservazione dopo ogni update prima di toccare
qualcosa.

---

## 7. Il piano dei contenuti

Ogni pezzo rispetta lo stesso formato, che è quello che la ricerca supporta e che coincide con
la voce del brand: **H2 come domanda, risposta nella prima frase, blocchi autoconsistenti di
100-130 parole**. (Pillarbase, 15,7M citazioni AI Mode: passaggio mediano 117 parole, risposta
nella prima frase nell'80% dei casi, autoconsistente nell'85%. È descrittivo, non causale — ma
è anche, semplicemente, come si scrive bene.)

Regola non negoziabile: **ogni pezzo porta almeno un elemento non replicabile** — un dato OMI
citato, una frase attribuita a una persona, una foto nostra, un numero del gestionale. Senza,
non si pubblica. È la differenza fra un contenuto e un riempitivo, ed è anche la differenza fra
la nostra pagina e le 57 di Atmosphera ferme da 15 mesi.

Nota di formato, perché si presta all'equivoco: **100-130 parole è l'unità del blocco, non la
lunghezza del pezzo.** La risposta onesta a "chi paga la provvigione" sta in 600 parole;
portarla a 1.500 produce esattamente il *commodity content* che Google porta a esempio.

### 7.0 Due artefatti che vengono prima di scrivere

**La mappa intento→URL.** §2 rifiuta l'audit ricorrente di cannibalizzazione e in cambio
promette "una mappa intento→URL prima di pubblicare". Va prodotta, o si è rinunciato all'audit
senza mettere in campo l'alternativa: in dodici mesi il piano genera oltre 40 URL nuovi su un
perimetro semantico strettissimo. Un foglio, una riga per query primaria — query e intento ·
URL unico proprietario · tipo di pagina · stato (esiste / da scrivere / non presidiata) —
prodotto prima della prima ondata e aggiornato **a ogni pubblicazione**. Il controllo costa due
minuti: `site:domustua.com` sulla query primaria più il rapporto Query→Pagine di GSC, per vedere
se un URL esistente sta già raccogliendo impression.

Regola di confine, perché è lì che si collide: `/mercato/[comune]` è **dato e prezzo** (intento
informativo), la pagina zona è **presenza e compravendite chiuse** (intento locale). *Un comune,
al massimo una pagina per intento*; dove non c'è materiale per reggerne due, se ne fa una sola
che contiene entrambi. Con 10-12 comuni sono fino a 24 pagine potenzialmente in collisione,
costruite in mesi diversi da due filoni di lavoro: è esattamente il caso che l'audit scartato
avrebbe intercettato.

**Le rotte editoriali, decise ora.** Nel repo non esiste né `/blog` né `/guide` né `/storie`, e
ogni cambio dopo costa un redirect:

| Rotta | Cosa ospita |
|---|---|
| `/guide/vendere-casa` · `/guide/comprare-casa` | Gli hub informativi, con gli articoli sotto |
| `/storie` · `/storie/[slug]` | Le storie di vendita — il "Vendite di successo" di OMH |
| `/video` · `/video/[slug]` | Indice e watch page |
| `/mercato/[comune]` | Osservatorio prezzi |

Tutte raggiungibili dal menu. Il piano impone la regola dell'orfanità alle pagine zona e poi
rischia di non applicarla ai due formati che produce in volume maggiore: a regime Crescita sono
fino a 48 pagine l'anno.

> **Perché gli hub e non `/vendi` e `/acquista`.** `/acquista` non è un pillar: è la pagina di
> ricerca con i filtri, destinazione del redirect `/case` → `/acquista`
> ([next.config.ts:36](../next.config.ts:36)) e trattata come catalogo dal sitemap. Appenderci
> sotto otto guide informative mette due intenti sulla stessa URL e annega di contenuto
> informativo la pagina che deve reggere le query di catalogo. Gli hub linkano `/vendi` e
> `/acquista` come chiamata all'azione, non ci stanno sotto. È anche la struttura di Dove.it
> (`/guida/vendere`), che §3.4 indica come riferimento.

**Il brief di pezzo.** Oggi la regola dell'elemento non replicabile è un veto che scatta a pezzo
finito: significa buttare una settimana di lavoro. Diventa una precondizione di avvio — una
scheda di una pagina, compilata prima di scrivere:

1. la domanda-obiettivo nella **formulazione letterale raccolta** (assistente, ricerca interna,
   telefono, PAA);
2. cosa mostra oggi la SERP per quella domanda — AI Overview sì/no, snippet a paragrafo o a
   lista, PAA — e formato scelto di conseguenza;
3. risposta **autoportante entro le prime 40-60 parole**;
4. elemento non replicabile **già reperito**: quale dato OMI, quale frase di chi, quale foto;
5. firma e credenziale · link in entrata e uscita · **title, description e slug definitivi**;
6. passo di conversione dichiarato, con l'evento GA4 corrispondente;
7. data reale.

Title e description nel brief e non a pezzo finito: altrimenti sono due giri di approvazione al
mese per otto deliverable, ed è il punto in cui §11 avverte che il processo diventa attrito.

### 7.1 Pagine servizio — priorità 1

Sei pagine, che sono anche le destinazioni dei redirect ▲ del §5.1. Whitespark colloca la
**pagina dedicata per ogni servizio** al primo posto fra i fattori dell'organico locale e al
secondo per la visibilità AI. Il materiale esiste già: va riorganizzato, non inventato.

`/servizi/valutazione-immobiliare` · `/servizi/home-staging` ·
`/servizi/rendering-e-virtual-tour` · `/servizi/video-marketing-immobiliare` ·
`/servizi/servizi-tecnici-e-legali` · `/servizi/contenuti-e-campagne`

Struttura: problema → come lo affrontiamo → prova (foto, video, numero) → domande → CTA.
`/servizi` resta l'hub, `/metodo` e `/open-domus` restano dove sono. Schema `Service` con
`provider` → `@id` dell'agenzia: mezz'ora su pagine che si scrivono comunque — **da non
nominare in proposta come beneficio**, perché nessun rich result esiste per `Service`. Serve a
disambiguare l'entità, che è l'uso di schema che §2 dichiara legittimo.

Per home staging, rendering e video marketing la "prova" non è un paragrafo ma una serie
**prima/dopo** per immobile: stessa inquadratura, stessa luce, didascalia con tempi ed esito. Il
materiale è l'output del lavoro quotidiano, quindi il costo marginale è la liberatoria, non la
produzione — ed è l'unico contenuto del piano che si distribuisce senza riscrittura su
Instagram, dove la cliente ha già pubblico.

### 7.2 Cluster editoriali

**Vendere casa** (hub `/guide/vendere-casa`) — quanto costa vendere e chi paga la provvigione · quali
documenti servono davvero · conformità urbanistica e catastale · l'APE: costo, durata, chi lo
rilascia · dal preliminare al rogito, i tempi reali · vendere una casa ereditata · vendere con
l'inquilino dentro · quando si paga la plusvalenza · prezzo richiesto e prezzo di vendita.

**Comprare casa** (hub `/guide/comprare-casa`) — quanto serve avere da parte · la proposta
d'acquisto, riga per riga · caparra confirmatoria e acconto · il mutuo: tempi e documenti ·
agevolazioni prima casa · i costi del rogito e chi li paga · cosa chiedere prima di firmare ·
comprare da ristrutturare.

**Scegliere l'intermediario** (pillar `/metodo`) — vendere da soli o con l'agenzia, costi e
tempi reali · cosa fa davvero un'agenzia dal mandato al rogito · quanto costa e cosa comprende
la provvigione · mandato in esclusiva sì o no · come scegliere un'agenzia a Tradate, le domande
da fare. I primi due cluster coprono il *come si fa* e le pagine servizio il *cosa vendiamo*:
in mezzo manca lo stadio in cui la persona decide se le serve un'agenzia e quale. È lì che si
vince o si perde il mandato, sono query ibride locali — il formato con la probabilità di AI
Overview più alta, 97% — e nessun concorrente del bacino le presidia.

Nota: Google, nella guida ufficiale sull'AI, sceglie proprio *"7 Tips for First-Time
Homebuyers"* come esempio di *commodity content* da non scrivere. La differenza fra quello e
i nostri pezzi è una sola: i nostri parlano di **Tradate**, con dati OMI e con una firma.

**Registro dei contenuti a dipendenza normativa.** Per ogni pezzo che cita una norma,
un'aliquota, una scadenza o un importo — agevolazioni prima casa, plusvalenza, imposte di
registro, conformità catastale, costo e durata dell'APE — si annota quale norma è citata e la
fonte ufficiale. Revisione **a gennaio** dopo la legge di bilancio, e su evento (circolare
dell'Agenzia delle Entrate, modifica regionale). In pagina, "verificato al [data]" con nota di
cosa è cambiato. Non contraddice §2: lì si demolisce il refresh cosmetico a calendario *per le
AI Overviews*. Questa è un'altra cosa — metà del cluster "Vendere casa" poggia su materia che
cambia per legge ogni gennaio, e un contenuto **firmato** con un'aliquota vecchia è un danno di
credibilità, non di ranking.

**Regola di scrittura delle schede immobile.** La descrizione sul sito va scritta **diversa** da
quella inviata al feed dei portali, e la scheda costruita su ciò che il portale non può
ospitare: planimetria commentata, dato OMI della zona, contesto del quartiere, video, firma di
chi segue l'immobile. Più link bidirezionali con la pagina del comune corrispondente — oggi la
scheda linka solo tre immobili correlati ([app/case/[slug]/page.tsx:55](../app/case/[slug]/page.tsx:55)),
e le schede sono l'unica famiglia che si rinnova da sola col feed: sono il distributore naturale
di link verso le pagine comune, che un menu non può reggere per dodici comuni più dodici pagine
mercato.

**Storie di vendita** — 1-2 al mese: immobile, comune, ostacolo, tempi, esito. Firmate,
con liberatoria. È il formato di OMH, ed è fonte primaria: né i portali né un modello
linguistico possono produrla.

**Watch page video** `/video/[slug]` — un video per pagina, trascrizione in HTML, `VideoObject`
(`name`, `thumbnailUrl`, `uploadDate` obbligatori, più `contentUrl`/`embedUrl`, `description`,
`duration` ISO 8601, `Clip` per i capitoli). Google è esplicita: un articolo con un video
embeddato **non** è una watch page. Si parte dai 7 video già censiti in
[app/lib/site.ts](../app/lib/site.ts).

Sui video, il dato utile è controintuitivo (Otterly, >100M istanze di citazione): YouTube è la
**seconda** fonte social citata dalle AI (31,8%, dietro Reddit); il **94%** delle citazioni va
a video long-form contro il 5,7% agli Shorts; il **40,8%** dei video citati ha meno di 1.000
visualizzazioni e la correlazione con view, like e iscritti è **nulla** (−0,03). Correla invece
la **lunghezza della descrizione** (+0,31, media 334 parole) e i timestamp (il 31% li ha, e il
78% di quelli è citato più volte). Tradotto: il canale di Domus Tua non ha bisogno di più
visualizzazioni per essere citato — ha bisogno di descrizioni scritte bene e capitoli.

Da cui tre cose che vanno assegnate, perché oggi non le fa nessuno.

- **(a) Censimento prima di promettere una cadenza.** Un foglio con tutti i video YouTube e
  Instagram: durata, tema, long-form o short, stato della trascrizione automatica italiana,
  liberatoria. Sette video censiti contro 24 watch page l'anno sono tre mesi e mezzo di
  magazzino, e §13 ammette che la dimensione reale del canale non è verificata. O la cliente
  produce long-form a ritmo sufficiente — e allora è una **dipendenza** da scrivere in §11,
  perché il video lo gira lei — o dal mese 4 il livello Crescita non è erogabile come descritto.
- **(b) Il lato YouTube è un deliverable, non un contorno.** Per ogni video che diventa watch
  page: titolo, **descrizione da 300+ parole** (non tre righe), **capitoli con timestamp** nella
  descrizione, link alla watch page, commento fissato. Abbiamo la prova qui sopra e poi non
  assegnavamo il lavoro a nessuno: è la leva a costo più basso e a evidenza più diretta di tutto
  §7. Senza timestamp reali, per giunta, il markup `Clip` non è compilabile.
- **(c) "Trascrizione in HTML" non è incollare l'automatica.** Pulizia, riscrittura in blocchi
  autoconsistenti, H2 come domanda posta nel video, riepilogo iniziale di 100-130 parole,
  capitoli allineati ai `Clip`. Una trascrizione verbatim italiana è testo senza punteggiatura,
  con ripetizioni e falsi avvii: è il contenuto sottile che rifiutiamo ovunque altrove. Detto
  male, "2 watch page al mese" sembra un lavoro da venti minuti e viene prezzato come tale.

Due precisioni di markup che si sbagliano di default: `contentUrl` ed `embedUrl` **non** sono
intercambiabili — per YouTube `embedUrl` è `https://www.youtube.com/embed/ID`, e mettere la
watch URL in `contentUrl` è l'errore standard. E ogni `Clip` richiede `name`, `startOffset` e
una `url` con timestamp che **sulla nostra pagina deve risolvere davvero**: è lavoro sul player,
non solo markup, e cambia la stima.

**Osservatorio del mercato** `/mercato/[comune]` — dal mese 6. €/mq min-max per zona e
tipologia da OMI, con la citazione obbligatoria, più un commento firmato. Refresh semestrale
con un motivo reale (la nuova pubblicazione OMI), non per far girare una data.

**Pagine zona** — a ondate di 4-6 per trimestre, **solo dove ci sono compravendite chiuse**,
ciascuna con almeno tre elementi non replicabili, raggiungibili dal menu e non solo dalla
sitemap. Meglio 12 pagine vere in un anno che 45 vuote in un mese: è la leva a rischio più alto
del piano, ed è quella che va governata con più disciplina.

Prima delle ondate, però, **una sola pagina aggregata "dove operiamo"**: due o tre frasi per
comune, dato OMI, rimando ai contatti. Con criterio di promozione scritto — quando un comune
raggiunge i tre elementi non replicabili si stacca e prende pagina propria, e la voce
nell'aggregata diventa un link. Senza, un comune ha due soli stati, pagina piena o niente, e per
la maggior parte dell'anno la maggior parte dei comuni non esiste sul sito.

E nessuna ondata esce con lo stesso identico scheletro di H2: la ripetizione strutturale fra
pagine gemelle pubblicate insieme è un marcatore esplicito nelle linee guida per i quality
rater.

> **Due orologi, non uno.** A **21-28 giorni** dalla pubblicazione di un'ondata si verifica un
> fatto binario: le pagine sono state scansionate (log Vercel) e indicizzate (GSC), e ricevono
> impression su query che contengono il nome del comune? Se no, l'ondata successiva non parte e
> si indaga la causa. Il giudizio di **risultato** resta a 90 giorni, come in §6 — ma quella
> finestra difende dalla volatilità delle posizioni, che con l'indicizzazione non c'entra nulla.
> Aspettare 90 giorni per scoprire un problema di indicizzazione costa metà dell'anno.

### 7.3 Persone e firme

`/chi-siamo/raffaela-rizza` con `ProfilePage` e `Person` (Google ammette esplicitamente
*"an employee page on a company website"*), poi le altre. Oggi l'unico asset autore di Domus
Tua vive sul **vecchio** sito. Eleonora D'Agati è architetto: è una credenziale reale, e va
sui contenuti tecnici — conformità, planimetrie, ristrutturazione.

Dove.it non firma nessun articolo. È il varco — ma solo se la firma esiste anche per una
macchina. Quindi: **`Article`/`BlogPosting` sui pezzi editoriali**, con `author` → `@id` della
`Person`, `datePublished` e `dateModified` reali, e **byline e data visibili nell'HTML**, non
solo nel JSON-LD. Su `/chi-siamo/eleonora-dagati`: `jobTitle`, `worksFor` → `@id` dell'agenzia,
`hasCredential` per il titolo di architetto — dichiarando **solo ciò che è visibile in pagina**.

E un **blocco-entità su `/chi-siamo`**: 100-130 parole in terza persona, nella prima schermata,
che dicono chi è Domus Tua, dove ha sede, dall'anno, cosa fa e su quali comuni opera, con
indirizzo e telefono identici a Google Business Profile e al JSON-LD. §5.5 sostiene
giustamente che i modelli leggono e ripetono ciò che trovano: tanto vale fornire il paragrafo
che vorremmo venisse ripetuto.

---

## 8. Local, recensioni, menzioni

**Motore recensioni conforme.** Richiesta standardizzata a *tutti* i clienti alla chiusura
della pratica — nessun incentivo, nessun suggerimento di contenuto, nessun filtro sui
soddisfatti. Risposte scritte a mano entro 7 giorni, firmate: l'81% se le aspetta entro una
settimana e il 50% diffida delle risposte template. Gli **11 voti a 1 stella** sono l'unico
vettore reputazionale aperto: vanno letti e gestiti uno per uno.

**Rivendica degli aggregatori.** Domus Tua, con 531 recensioni, **non compare** nella lista
RealAdvisor per il CAP 21049, dove ci sono agenzie con 4-16 recensioni. Da rivendicare:
RealAdvisor, Wikicasa, Bing Places, Apple Business Connect, più le liste "migliori agenzie"
curate — che il sondaggio Whitespark mette al **primo posto** fra i fattori di visibilità AI.

**Menzioni locali — e con cosa andarci.** Stampa del Varesotto, associazioni, notai, geometri,
banche. Non link building: menzioni, che correlano 0,664 contro lo 0,218 dei backlink. Ma un
giornale locale non pubblica che esiste un'agenzia: pubblica un numero sul mercato di casa
propria che nessun altro ha.

Quindi un **deliverable semestrale agganciato all'uscita OMI**, in tre pezzi: il dataset del
gestionale estratto e ripulito (per esempio quanto passa davvero da mandato a rogito nel bacino,
o lo scostamento medio fra prezzo richiesto e prezzo di vendita sui mandati Domus Tua), la
pagina che lo ospita, e la lista nominativa dei destinatari a cui si manda il giorno
dell'uscita. Oggi il dato del gestionale vive nel piano solo come domanda alla cliente (§11.7) e
mai come cosa da produrre — mentre è l'unico asset **proprietario** che l'agenzia possiede.

**Correzione delle citazioni dopo il go-live.** Dall'inventario di §5.0: le schede il cui URL
non seguirà i 301 si aggiornano a mano, una per una.

---

## 9. Misurazione e KPI

**Dentro il contratto**

1. Click e impression organiche sui cluster di query definiti, da Search Console.
2. Impression nelle feature generative, da GSC — **solo presenza, mai click**: Google non
   li espone.
3. Lead qualificati con sorgente tracciata fino al CRM — che esiste solo se gli eventi e la
   tassonomia UTM di §5.2.6 sono stati messi in piedi il primo mese.
4. **Azioni sul profilo Google**: chiamate, richieste di indicazioni, click al sito. È il canale
   che copre il 93% delle query locali e la prima cosa che si muove: lasciarlo fuori dai KPI
   significa non poter mostrare risultati per i primi tre mesi, quando l'organico non ne ha
   ancora.

**Fuori, con la motivazione scritta**

- Posizione media come valore-soglia: Google la definisce *"a complex metric that can be
  misleading"*.
- Garanzie di posizionamento: *"no one can guarantee a #1 ranking"*.
- Quota di citazioni AI da tool terzi: output stocastici, stime puntuali senza intervalli di
  confidenza.
- DA/DR e numero grezzo di keyword in top 10.

**Orizzonte da scrivere in proposta: 6-12 mesi.** Solo il 5,7% delle pagine entra in top 10
entro un anno per almeno una keyword, e chi ci riesce impiega 61-182 giorni (Ahrefs — dataset
2017, tuttora il più ampio pubblicamente disponibile). Nei primi 90 giorni si misurano
**KPI di produzione e di ingresso**: pagine pubblicate, query nuove in ingresso, impression,
impression AI, lead per pagina. I KPI di risultato dal mese 6.

Una trappola di reporting da disinnescare subito: il calo di impression su
`/domande-frequenti` e `/lavora-con-noi` da maggio 2026 è la **dismissione del rich result
FAQ**, non un problema. Va fotografato prima di partire, o fra sei mesi sembrerà un nostro
errore.

---

## 10. I tre livelli

Prezzi **da validare** prima di andare in proposta. Riferimenti disponibili: SE Ranking/Duda su
260 agenzie (bracket più comune 500-1.000 $/mese, 34%; dati dicembre 2024); Ahrefs, retainer
medio local 1.557 $/mese (pagina aggiornata agosto 2024); tariffe orarie europee, solo il 6%
sopra i 125 $/h. **Una survey italiana con metodologia pubblica non esiste**: i 500-1.500 €/mese
che circolano per PMI e local vengono da listini di agenzie, non da una rilevazione.

### Avvio — una tantum, 1.900 €

**Il prezzo scende da 2.400 perché una parte del lavoro è già stata fatta** (§5.-1): redirect,
schema, sitemap, robots, canonical e title sono chiusi e verificati. Resta: archivio del vecchio
sito, inventario degli URL da Search Console, checklist di cutover e passaggio del dominio,
misurazione da zero con eventi e UTM, profilo Google, baseline SERP geolocalizzata, mappa
intento→URL e rotte editoriali (§7.0), riscrittura di title e description delle 15 rotte
esistenti, smontaggio una tantum di OMH e Dove.it, fotografia del "prima".

Una settimana di lavoro, non un mese. Senza, non parte nessun livello.

### Presidio — 890 €/mese

Per tenere la posizione, non per crescere in fretta.
Manutenzione tecnica e schema · GBP e motore recensioni · **1 contenuto/mese** · monitoraggio
indicizzazione e bot · report trimestrale · presidio dei core update.

### Crescita — 1.690 €/mese · **consigliato**

Tutto il Presidio, più:
**3-4 contenuti/mese** · le 6 pagine servizio nel primo trimestre · 1-2 storie di vendita/mese ·
2 watch page video/mese **con il lato YouTube** (descrizione, capitoli, link) · pagine persona e
firme · rivendica aggregatori e liste · 1 post GBP e 1 adattamento social per ogni pezzo
pubblicato · report mensile con lettura, non solo numeri · strumenti inclusi.

> Il ritmo delle watch page dipende dal magazzino video reale (§7.2) e da una sessione
> registrata trimestrale da 60-90 minuti con Raffaela: sono le due dipendenze da verificare
> **prima** di firmare questo livello, non dopo.

È il livello che regge il piano scritto sopra. Sotto, il calendario non sta in piedi.

### Autorità — 2.900 €/mese

Tutto Crescita, più:
Osservatorio OMI per comune · pagine zona a ondate, con gate di indicizzazione a 21-28 giorni e
giudizio di risultato a 90 · nota semestrale sui dati del gestionale con lista dei destinatari ·
menzioni e PR locale (stampa, associazioni, professionisti) · monitoraggio della visibilità AI
con strumento dedicato (Otterly Standard, 189 $/mese, incluso) · una revisione strategica a
trimestre in presenza.

> **Alternativa da valutare sullo strumento AI.** DataForSEO offre a consumo ciò per cui Otterly
> chiede un canone (visibilità nelle risposte AI, SERP geolocalizzata con Local Pack, elenchi
> di attività locali da fonte vera, sottotitoli YouTube senza accessi della cliente): per un
> singolo cliente locale potrebbe costare molto meno. **Non verificato**: non è installato nei
> nostri strumenti, quindi costi e resa vanno provati prima di metterlo a contratto.
> Nota di merito, visto che ci si appoggia una scelta: la documentazione di quello strumento
> afferma che "le menzioni YouTube hanno la correlazione più forte (0,737) con la visibilità
> AI". Quel numero non compare in nessuna fonte primaria della nostra ricerca, dove il massimo
> è 0,664 per le menzioni di brand. Non lo useremo, e vale come promemoria che anche gli
> strumenti che compriamo vanno letti con la regola di §2.

**Durata.** Minimo 6 mesi, poi mensile con 60 giorni di preavviso. Il minimo non è una clausola
commerciale: è il tempo sotto il quale i dati non dicono niente. Nessun benchmark pubblico
esiste su durate e preavvisi "di mercato" — è una nostra scelta, e va presentata come tale.

**Il rischio numero uno della redditività è lo scope creep** (59 agenzie su 115 lo indicano come
primo ostacolo, SE Ranking). Il perimetro va scritto per esclusione, non solo per inclusione.

---

## 11. Cosa serve dalla cliente

**Bloccanti**

1. **La data del passaggio del dominio, con due settimane di anticipo.** Il vecchio sito verrà
   dismesso (confermato): l'archiviazione del §5.0 e la mappa 301 devono essere pronte *prima*,
   non il giorno stesso. Serve anche sapere chi materialmente spegne il vecchio hosting e
   quando scade, perché un hosting che si disattiva da solo a fine abbonamento è lo stesso
   evento senza preavviso.
2. Search Console, in lettura durante l'audit e poi in delega. Serve lo storico: si perde se la
   proprietà viene ricreata.
3. GA4 (editor) e, se esiste, Google Ads.
4. Google Business Profile come **manager**. Verifica di profili duplicati dal 2007.
5. Chi approva le modifiche a metadata, JSON-LD e canonical — oggi trattati come intoccabili
   ([PRODUCT.md](../PRODUCT.md)). O il processo si formalizza, o diventa il primo attrito.

**Dati**

6. **La lista dei 10-12 comuni con compravendite chiuse negli ultimi 24 mesi.** Senza, la
   roadmap delle pagine zona non è costruibile e il rischio doorway non è governabile.
7. Quali numeri sono documentabili dal gestionale: tempi medi mandato→rogito, scostamento
   richiesto/venduto, numero di Open Domus, distribuzione per comune. Se esistono in forma
   verificabile valgono più di qualunque dato OMI. Se non esistono, non si pubblicano.
8. Quota reale di lead per fonte (portali / organico / Maps / passaparola). Senza, non si
   dimensiona l'investimento e non si dimostra l'incrementalità.
9. Il feed RealSmart espone `updatedAt` per immobile? Da questo dipende il fix del `lastmod`.
10. **Il testo del feed RealSmart è lo stesso che finisce sul sito e sui portali?** Se sì, ogni
    scheda è un duplicato di sé stessa su domini con due ordini di grandezza di autorità in più
    (§4), e serve un secondo testo per il sito.
11. Provenienza geografica dei contatti: decide la sorte delle 5 lingue.

**Materiali**

11. Liberatorie per le storie di vendita: quelle delle videotestimonianze coprono anche l'uso in
    pagine testuali con foto e dettagli della trattativa? Serve un modulo standard prima del
    primo pezzo.
12. YouTube Analytics e **la dimensione reale del canale**: quanti video long-form esistono,
    quanti se ne producono al mese, stato delle trascrizioni automatiche italiane. Il livello
    Crescita promette 24 watch page l'anno e oggi il magazzino censito ne copre sette: o il
    ritmo di produzione regge — ed è una **dipendenza dalla cliente**, perché i video li gira
    lei — o quel deliverable va ridimensionato prima della firma.
13. Capacità reale di risposta: chi risponde alle interviste, chi firma, chi approva, con che
    ritmo. Servono una sessione registrata trimestrale da 60-90 minuti e 10-15 minuti asincroni
    a settimana. Il calendario dipende da questo più che da noi.
14. Foto e video per comune. Una pagina zona senza materiale proprio è una doorway.
15. Verifica che il widget Trustindex non inietti markup `Review`/`AggregateRating` nel DOM: i
    widget di terze parti lo fanno spesso, e la policy Google li nomina.

---

## 12. Le cinque lingue

Oggi l'i18n è client-side, senza URL distinti: l'hreflang è tecnicamente impossibile e per i
crawler AI — che non eseguono JavaScript — esistono solo i contenuti italiani. È uno stato di
fatto documentato in [i18n.md](i18n.md), non un difetto nascosto, ma va **detto alla cliente**
invece di lasciarlo implicito.

Due strade, e nessuna urgenza: o le traduzioni restano una cortesia di interfaccia dichiarata
fuori perimetro SEO, oppure si promuove **solo l'inglese** a rotta `/en/` server-rendered con
hreflang reciproco e `x-default`. La seconda ha senso solo se i dati del punto 11 mostrano
domanda reale — Malpensa è a venti minuti, quindi non è assurdo, ma va misurato prima di
spenderci sopra.

Se un giorno si fa, quattro cose che si sbagliano proprio cercando di essere prudenti:
canonical **auto-referenziale** sulle pagine inglesi e mai verso l'italiano (un canonical
incrociato fa scartare l'intero set hreflang); `x-default` all'italiano; codici `it` e `en`
senza qualificatore di regione; e il selettore lingua deve **linkare** a `/en/` invece di
scrivere il cookie, altrimenti le pagine inglesi nascono orfane.

---

## 13. Cosa resta non verificato

Onestà di metodo: queste cose non le sappiamo ancora, e non vanno scritte in un documento per
la cliente finché non le abbiamo controllate.

- La composizione reale delle SERP di Tradate, Venegono e Varese su Google **geolocalizzato**,
  Local Pack incluso.
- Presenza fisica di RE/MAX ed Engel & Völkers nel bacino.
- Il JSON-LD dei concorrenti (va letto sull'HTML grezzo, non con un fetch che scarta gli
  `<script>`).
- I conteggi recensioni dei concorrenti, presi da RealAdvisor e non da Google Maps.
- Dimensione reale del canale YouTube di Domus Tua e di quelli dei concorrenti.
- Se l'app idealista dentro ChatGPT copre l'Italia.
- Le 531 recensioni: il dato viene dal widget Trustindex, cioè auto-riportato. Va riscontrato
  sul profilo Google.
