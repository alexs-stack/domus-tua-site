# Piano di implementazione — Documento Finale di Sintesi

> **Stato al 21 agosto 2026 — fino al commit `d33600c`.**
>
> **Chiuso il §6.6 (microcopy del modulo) e il §6.5 (i video).** Tre PR:
>
> - [#69](https://github.com/alexs-stack/domus-tua-site/pull/69) — la conferma del modulo LEGGE l'esito della consegna, invece di
>   buttarlo via con `void`. Prima diceva la stessa cosa a 429, 502, rete caduta e
>   «nessun canale configurato»: il server era già onesto, era il client a non ascoltarlo.
>   Ora «Abbiamo ricevuto la tua richiesta» compare solo quando è vero, e la conferma porta
>   i quattro contenuti che il §6.6 chiede — chi chiama, da quale numero, entro quando,
>   cosa preparare. Più il testo sopra il modulo indicizzato per intento, «Indirizzo
>   dell'immobile», «(facoltativo)», e due difetti di flusso: `/open-domus` apriva il
>   modulo sul tab «Voglio vendere», e il riferimento dell'immobile viaggiava col lead
>   senza comparire mai.
> - [#70](https://github.com/alexs-stack/domus-tua-site/pull/70) — §6.7, una formula per famiglia. Sette scarti veri corretti, tre
>   varianti riconosciute come legittime e lasciate dov'erano. Più diciassette chiavi morte
>   via dal dizionario, fra cui un `cta: "Cerca casa"` che contraddiceva la formula viva.
> - [#71](https://github.com/alexs-stack/domus-tua-site/pull/71) — §6.5, il video si guarda IN PAGINA. Zero richieste a YouTube prima
>   del clic (misurato in build di produzione). Una verifica avversariale sul diff ha
>   trovato un bloccante mio: il dialog nasceva dentro `<main>`, che è un contesto di
>   impilamento, e l'header restava cliccabile sopra una superficie `aria-modal`.
>   `CaseQuickLook` documentava già quella trappola.
>
> **§9 CHIUSO.** Su venti blocchi della home tredici superavano gia la prova con parole
> proprie e tre sono chrome, a cui il criterio non si applica. Corretti i quattro che non la
> superavano o la superavano male:
>
> - **la ricerca in home** era l’unico blocco che si limitava a mostrare immobili, cioe
>   proprio il «pubblicare semplicemente» da cui la frase del §9 prende le distanze. La card
>   venditore faceva la domanda e saltava alla CTA: adesso in mezzo c’e la ragione.
> - **il pannello territorio** diceva «conosciamo il valore di ogni via», cioe quanto siamo
>   bravi. Adesso quella conoscenza e agganciata alla valutazione, che e il primo atto del
>   metodo — un fatto gia dichiarato in `Method.tsx`.
> - **il muro delle voci** parlava delle case «vendute con Open Domus»: un esito osservato.
>   Adesso sono «raccontate in video e vendute», che e il lavoro dichiarato.
> - **il footer** e stato chiuso a parte ([#73](https://github.com/alexs-stack/domus-tua-site/pull/73)).
>
> `KineticStrip` non supera la prova letta alla lettera, e resta dov’e: non e copy — il testo
> vive in `content: var(--kin)` dentro un blocco `aria-hidden`, quindi non entra nell’albero
> del documento e non costa parole a nessuno. Tagliarlo lascerebbe la home senza congedo.
>
> Nella stessa passata e saltato fuori che **il territorio era ancora scritto a mano** in
> `HorizonStory` (quattro lingue) e nell’annuncio di lavoro (cinque): la stessa correzione
> gia fatta nelle FAQ, sopravvissuta altrove. Ora tutto passa da `territoryLabelBy`.
>
> **Restava del documento, dentro il perimetro:** la passata §9 sezione per sezione. Su venti
> blocchi della home tredici superano la prova «prepara / protegge / racconta / governa»
> con parole proprie, due sono deboli (pannello territorio, muro delle voci) e tre non la
> superano — la ricerca in home, la riga del footer e `KineticStrip`, che però è
> decorazione senza testo nel DOM. **Il caso peggiore è una DECISIONE della cliente:** il
> footer ripete «Con Domus Tua è facile vendere ed è sicuro acquistare», che è la stessa
> frase che `description.ts:206` cancella dagli annunci importati come firma commerciale.
> È la sua tagline: si segnala, non si toglie di iniziativa.
>
> **Una conferma tecnica che serve dalla cliente:** `callback` in `app/lib/site.ts` dice chi
> richiama e da quale numero. Se al primo contatto risponde una collega, o se le chiamate
> partono da un cellulare, sono due righe da cambiare — e un numero sbagliato in una
> conferma è peggio di nessun numero, perché insegna a non rispondere.
>
> **Stato al 20 agosto 2026 — fino al commit `98bda02`.**
> **Chiusa anche la Fase 5 per la parte che dipende da noi**: i tre difetti §5.8 che si
> possono togliere senza riscrivere una parola — doppio spazio nel titolo ([#66](https://github.com/alexs-stack/domus-tua-site/pull/66)),
> recapito web e frase troncata ([#67](https://github.com/alexs-stack/domus-tua-site/pull/67)) — non arrivano più in pagina. Con loro
> se n'è andato anche il blocco delle «righe singole»: territorio nelle altre quattro
> lingue, CTA acquirente su una formula per lingua, i tre slogan del team, due frasi
> dell'assistente che non combaciavano col sito.
>
> Restano di Fase 5 due difetti che si **segnalano** e non si correggono («e'» per «è» e le
> abbreviazioni da appunti: lì la regex dovrebbe cambiare una parola, non toglierne una), il
> refuso e il registro — entrambi della Direzione — e i due lavori strutturali in coda alla
> sezione (campi per categoria, alt di galleria).
>

> **Fasi 0, 1 e 3 chiuse** — ogni voce che non dipende dalla cliente è in `main`,
> comprese le tre di copy del §3bis. Restano solo le due voci ESTERNE di Fase 0 (testi
> legali validati, `NEXT_PUBLIC_SITE_URL`), la Fase 2 ferma sulle recensioni nominative
> che deve consegnare la Direzione, e la decisione sulla barra prove (§2.1).
>
> **Le 16 PR aperte del 13 agosto sono state triagate e chiuse tutte** (dettaglio in
> §3ter): tre mergiate, quattro residui riapplicati, nove chiuse con motivazione. Il loro
> lavoro era già su `main` per un'altra strada — mergiarle avrebbe riportato indietro il
> codice.
>
> Le vecchie righe qui sotto restano per storia:
> **Fasi 0, 1 e 3 chiuse** per tutto ciò che non dipende dalla cliente. Restano aperte in
> Fase 0 le due voci esterne (testi legali, `NEXT_PUBLIC_SITE_URL`); in Fase 3 restano tre
> voci che sono **decisioni di copy**, non correzioni meccaniche, elencate in §4bis.
>
> Cinque cose emerse ESEGUENDO, che questo piano non aveva previsto o aveva sottostimato:
> - `reviewsApprox` — il campo nato per allineare «oltre 500» e «531» **non lo usava
>   nessuno**: descriveva l'incoerenza invece di risolverla. Tolto; vince il numero esatto.
> - Il blocco `hero` di `dictionaries.ts` teneva otto campi morti che erano la copia
>   **ferma** dell'hero prima del §6.1 («Ti accompagniamo», «oltre 500»). Rimossi.
> - Un pixel di scarto in `--dt-footer-h` ha rivelato un bug in `watchHeight`: il
>   `ResizeObserver` scartava la prima consegna senza aggiornare il riferimento, e una
>   variazione arrivata in quella finestra spariva per sempre.
> - Il residuo del §3.3 era di **24 occorrenze, non 14**: le forme aggettivali («mauvaises
>   surprises», «böse Überraschungen», «sorpresas desagradables») non erano state contate,
>   e in `VendiContent.tsx` l'italiano era già corretto mentre le quattro traduzioni no.
> - Il server di sviluppo rispondeva **500 su tutte le pagine** per un errore CSS, e la
>   causa non era quella che sembrava: non lo scanner di Tailwind che tronca `Footer.tsx`,
>   ma una classe **citata in forma abbreviata dentro `docs/mobile-parity-2.md`**, che
>   Tailwind scandisce come sorgente. Corretto a monte con `@source not "../docs"`.
>
> Stato delle verifiche: **1296 unit test**, **325 e2e verdi** (la suite era interamente
> bloccata prima del fix CSS), e lo smoke conferma **22/22 URL legacy su 200** — la voce
> 01 passa da «configurata» a «verificata».

> Verifica del *Documento Finale di Sintesi* (Domus Tua, 11 agosto 2026) contro il codice
> reale, al 19 agosto 2026, e piano di esecuzione di ciò che resta.
>
> Metodo: le ~50 richieste del documento sono state scomposte in **142 requisiti verificabili**,
> assegnati a 12 revisori indipendenti, e ogni verdetto è passato per un **avversario** con il
> compito di smentirlo tornando al codice da solo. Nove verdetti sono stati ribaltati — tutti e
> nove nella stessa direzione: da «fatto» a «fatto a metà».
>
> Nessuna riga di questo documento poggia su `docs/`. La documentazione dichiara intenzioni;
> qui conta solo ciò che è scritto in `app/`, `next.config.ts`, `scripts/` ed `e2e/`.

---

## 1. Il verdetto

**Il documento è già eseguito per due terzi.** La cronologia lo dice apertamente: i commit
`00c2c67` e `b418cea` (*feat(sintesi)*), `f5b0dbb` (*cinque sezioni recensioni diventano due*),
`c41d810` (*case-vendute*), `4b8dff8` (*faq*) sono l'esecuzione dei Blocchi 1 e 2 — e il codice
cita il documento per paragrafo nei propri commenti (`app/valutazione-immobile-tradate/page.tsx:10`
rimanda al §3.2).

| Stato | Voci | Cosa significa |
|---|---:|---|
| **FATTO** | 67 | Implementato e verificato nel codice |
| **PARZIALE** | 38 | Fatto in parte, o fatto in un posto e non negli altri |
| **DA FARE** | 17 | Assente |
| **ESTERNO** | 13 | Non dipende da noi: DNS, Search Console, Google Business, o contenuti della Direzione |
| **SUPERATO** | 7 | Il codice ha risolto diversamente, e meglio — o la premessa non è più vera |

Il rischio non è più quello che il documento temeva. La mappa di redirect **c'è**, l'H1 **c'è**,
il premio **è riscritto**, il blocco costi **è uscito dall'accordion**. Il rischio residuo è di
un'altra natura, ed è più insidioso: **le cose fatte al 90% sembrano fatte al 100%**, e nessuno
le riapre.

---

## 2. Le cinque cose che il documento chiede e che ancora non sono vere

> **Questa sezione è la DIAGNOSI del 19 agosto, tenuta com'era.** Tre delle cinque sono state
> nel frattempo risolte e sono marcate qui sotto: si tiene il testo originale perché un piano
> che riscrive la propria diagnosi a cose fatte non permette più di controllare se aveva visto
> giusto. Le due aperte — la barra prove e le recensioni — non dipendono da noi.

Sono le scoperte che valgono più di tutte le altre messe insieme. Quattro su cinque sono state
trovate dall'avversario, non dal primo revisore: erano tutte marcate «fatto».

### 2.1 🔴 La barra prove esiste, ma nessuno la vede prima dello scroll

La voce 09 chiede di esporre il premio Wikicasa **prima dello scroll**. Il testo c'è, esatto e
verbatim (`HeroCinematic.tsx:917-956`): 4,9/5 · 531 recensioni · il sigillo Wikicasa · «A Tradate
dal 2007» · «Nessun costo anticipato».

Ma quel blocco porta la classe `dt-hero-rest`, e `app/globals.css:2078` la mette a `opacity: 0`.
Il commento in `HeroCinematic.tsx:494-496` lo dichiara: *«Il "resto" dell'hero (subcopy, founder,
CTA, recensioni) appare SOLO al primo scroll (richiesta cliente, rif. era-residence)»*.

Quindi nel primo fotogramma — l'unico che moltissimi visitatori mobile vedono — restano il lockup,
il sovratitolo e l'H1. **Tutte e quattro le prove sono sotto il velo, insieme alla CTA primaria.**

Non è un difetto di implementazione: è un conflitto fra due richieste della cliente, entrambe
scritte. Il documento chiede «prima dello scroll»; la direzione artistica chiede l'ingresso pulito
alla era-residence. **Va risolto da lei, non da noi** — e la via che li concilia esiste (§4.2).

### 2.2 ✅ La promessa assoluta è tornata dentro con un sinonimo — RISOLTO (commit 8dfb7ba)

Il §3.3 è il paragrafo giuridicamente più delicato del documento: *«zero sorprese al rogito»* è
una promessa di risultato che un mediatore non controlla. La forma letterale è stata eliminata.

La sostanza no. **«senza sorprese» / «nessuna sorpresa» sopravvive in 14 punti, in tutte e cinque
le lingue:**

- `app/domande-frequenti/faq.ts:72, 178, 284, 390, 496` — *«è il modo in cui si arriva al rogito senza sorprese»*
- `app/lib/domusDoc.ts:46, 56, 61, 66, 75, 80, 85, 90, 95` — *«per arrivare al rogito senza sorprese»*, *«visiti e scegli con serenità, senza sorprese»*
- `app/acquista/AcquistaContent.tsx:53, 147, 335` — il titolo della card è letteralmente **«Nessuna sorpresa»**

`app/lib/domusDoc.ts` è il testo che compare **sulla scheda immobile**, cioè esattamente il posto
che il §5.8 indica come «il punto più pericoloso di tutto il progetto».

Il fatto che sia rientrato dopo essere stato tolto è la prova che serve un presidio, non una
correzione: senza un pattern in `content-integrity.test.ts` rientra al primo copia-incolla.

### 2.3 🔴 Le recensioni sono ancora zero

La convergenza più forte dei due audit, la voce 10, il §5.3. Ad oggi:

- `approvedNativeReviews` (`app/lib/reviews.ts:159`) è **vuoto**;
- la testimonianza in evidenza della home (`FeaturedTestimonial.tsx:29`) è firmata **«Cliente Domus Tua»** — la stringa che il documento cita come esempio di non-prova;
- il sottotitolo di `StarReviews` dice ancora, in cinque lingue, che *le parole vere restano su Google*, con il pulsante che porta fuori;
- il widget Trustindex è stato declassato a coda **solo nella home**: `Reviews.tsx` è montato su altre cinque pagine e lì è ancora la sezione.

L'infrastruttura è pronta e ben fatta (schema tipizzato, provenienza, stato di approvazione).
**Manca solo il contenuto, e il contenuto lo deve consegnare la Direzione.** È il collo di
bottiglia numero uno dell'intero progetto, ed è fermo su una richiesta già inoltrata
(`docs/da-chiedere-alla-cliente.md:275`) che per giunta chiede 6–8 recensioni dove il documento
ne chiede 12–15.

### 2.4 🟠 Due bloccanti di go-live che il documento non conosce — APERTI (esterni)

`npm run launch-check` oggi esce con **exit 1**:

```
Legale    BLOCKED   Privacy & Cookie Policy validate e approvate
                    ↳ testo placeholder: non validato da legale/DPO
Dominio   BLOCKED   NEXT_PUBLIC_SITE_URL punta al dominio di produzione
                    ↳ non impostato
```

Il documento redige una checklist di go-live in sette voci e **nessuna delle due compare**.
Pubblicare con una privacy policy segnaposto è un rischio di natura diversa da tutti gli altri
elencati nel §8, e non si recupera con una correzione di copy.

### 2.5 ✅ Il metodo ha ancora due conteggi, e uno parla ai clienti — RISOLTO (commit 8dfb7ba)

Il §4.2 decide: **nove passaggi è il numero canonico**. In pagina è rispettato. Ma
`app/lib/assistant/knowledge/entries.ts:311` — la base di conoscenza dell'assistente, cioè la
superficie che *risponde alle domande dei clienti* — dice ancora: *«Su /metodo lo stesso percorso
è raccontato in cinque fasi»*, e tiene `"cinque fasi"` fra le parole chiave (`:320`).

È la contraddizione che il documento chiama «sciatteria registrata proprio nella sezione che deve
dimostrare rigore», spostata dalla pagina alla conversazione.

---

## 3. Cosa serve dalla cliente prima che noi possiamo fare la nostra parte

Tredici voci sono **esterne**. Sei di esse bloccano lavoro nostro già pronto a partire. Vanno
chieste in un colpo solo, non a rate.

| # | Cosa serve | Blocca |
|---|---|---|
| 1 | **12–15 recensioni nominative** (nome, comune, tipo di percorso, risultato) + il nome vero della testimonianza in evidenza | §2.3 — l'intera Fase 2 |
| 2 | **Export Search Console**, rapporto Pagine ultimi 16 mesi | Il completamento della mappa redirect prima del DNS |
| 3 | **Decisione scritta su `annunci.domustua.com`** (redirect o dismissione) + puntamento DNS al progetto Vercel | Il cutover. La regola è già scritta, ma non entra in funzione finché il DNS non punta qui |
| 4 | **Conferma del premio Wikicasa**: denominazione esatta, anni 2024/25/26 consecutivi, perimetro nazionale e criterio fatturato | La rimozione del flag `pendingConfirmation` e l'esposizione per esteso |
| 5 | **Testi definitivi di Privacy e Cookie Policy**, validati da legale/DPO | Il go-live (bloccante `launch-check`) |
| 6 | **Testi e foto delle 6 pagine servizio e delle 6 schede persona** del vecchio WordPress, **prima dello spegnimento** | Fase 4. Dopo lo spegnimento restano solo la cache e l'Internet Archive, e nessuno dei due restituisce le foto a piena risoluzione |
| 7 | Durata dell'incarico, cosa succede alla scadenza, esclusiva sì/no | Le due FAQ mancanti del §5.7 |
| 8 | Numeri Open Domus con periodo e campione dichiarati | Voce 33 |
| 9 | Date di pubblicazione e descrizione dei 6 video | `VideoObject` (voce 26) |
| 10 | Descrizioni immobili riscritte al «tu» nel gestionale | §5.8 punto (d) |
| 11 | Accesso alla proprietà **Search Console esistente** (non ricrearla: si perde lo storico) | Voce 07 |
| 12 | Orari sul profilo **Google Business** allineati a 14:30 | Voce 05, metà esterna |
| 13 | Accensione di **Speed Insights** nella dashboard Vercel prima del cutover | Voce 34 |

---

## 3bis. Le tre voci di copy della Fase 3

**Chiuse tutte e tre.** Erano decisioni di copy, e le parole sono state scritte: restano
da leggere, non da decidere. Le due voci di copy sono in `main` con una tabella
prima/dopo nelle rispettive PR — è lì che la cliente le rivede in un colpo d'occhio.

| Voce | Stato | Perché serve una decisione |
|---|---|---|
| ~~`FAQPage` su `/open-domus`~~ | **FATTO** | Estratto in `app/open-domus/faq.ts` come `lavora-con-noi`: il locale it e il markup leggono la stessa fonte, e una nuova guardia e2e verifica che il markup non dichiari domande assenti dalla pagina — e che non ricompaiano in `/domande-frequenti`, o tornerebbero le due dichiarazioni in conflitto. |
| ~~«Ti accompagniamo» → attività verificabili~~ | **FATTO** ([#60](https://github.com/alexs-stack/domus-tua-site/pull/60)) | 44 stringhe, cinque lingue. Regola seguita: cambiare il VERBO, non buttare il contenuto — quasi tutte avevano già lo specifico giusto dopo l'attacco generico. Riscrivendo sono saltati fuori due titoli che contraddicevano la propria copy («Trasparenza totale» sopra un testo che parla di vincoli; «Sempre accompagnato» sopra uno che promette un riferimento) e due assolute della famiglia del §3.3. Non toccate: le testimonianze dei clienti, e il title di /open-domus, che è testo approvato dal §6.8. |
| ~~Versioni brevi del metodo che si dichiarano tali~~ | **FATTO** ([#61](https://github.com/alexs-stack/domus-tua-site/pull/61)) | Applicato NON alla lettera, e il perché è la parte utile: la formula del §4.2 sarebbe falsa in due casi su tre. Solo su `/vendi` i quattro passi sono la sintesi dei nove del mandato; su `/acquista` sono il percorso di CHI COMPRA (che i nove passaggi non li attraversa) e su `/open-domus` sono le fasi dell'EVENTO. Ogni pagina ora dice cosa elenca: il lettore non incontra più il conflitto, e nessuna riga mente. |


## 3ter. Le 16 PR aperte del 13 agosto

Sedici PR, tutte dello stesso giorno, **nessuna mai mergiata**. L'istinto dice di mergiarle;
sarebbe stato l'errore.

Il loro lavoro era già su `main`, arrivato per un'altra strada — riscritto su rami diversi e
mergiato da lì. È anche la spiegazione dei conflitti: **tredici su sedici confliggevano perché
il codice che volevano portare era già lì, in una versione più recente.** `launchReadiness.ts`,
`security/rateLimit.ts`, l'intero `realsmart/`, `territory/`: tutto presente.

Triage: una PR per agente, e un avversario su ogni verdetto «superata» — perché dichiarare
superata una PR che porta ancora qualcosa significa **buttare lavoro**, ed è l'errore costoso
in questa direzione.

| Esito | PR | Cosa è stato fatto |
|---|---|---|
| **Mergiate** | #31 #40 #43 | Voce dell'assistente; rate limiting su `/api/lead` e `/api/search` (erano scoperte, con l'IP in chiaro nelle chiavi); MVP arricchimento AI — **spento di default**, serve `REALSMART_AI_NORMALIZE` più una chiave, e nessuna delle due è impostata. |
| **Residui riapplicati** | #39→#56 · #29→#57 · #35 e #41→#58 | Il report che dichiarava consegnati i lead quando nessun canale li riceveva; le camere sugli uffici (§4.1); un indirizzo senza accento che sfuggiva alla redazione privacy; tre asserzioni che passavano a vuoto. |
| **Chiuse, superate** | #32 #33 #34 #36 #37 #44 #45 | Contenuto già su `main`, riscritto meglio. Verificate una per una, con un secondo passaggio avversariale. |
| **Chiuse, residuo annotato** | #30 #42 | Un sottocomando CLI di redazione e la policy tipizzata dei venduti. Fuori dal perimetro corrente; il residuo è descritto nel commento di chiusura perché non vada perso. |

Ogni chiusura porta la sua motivazione scritta. Chiudere dodici PR in blocco, senza dire
perché, sarebbe stato peggio che lasciarle aperte.

## 4. Il piano

Sei fasi. L'ordine non è per importanza ma per **irreversibilità**: prima ciò che si paga per
mesi se sbagliato, poi ciò che si corregge in un pomeriggio.

### Fase 0 — Sbloccare il go-live · *bloccante, non negoziabile*

Nulla di quanto segue conta se il sito non può andare online.

| Intervento | File | Sforzo |
|---|---|---|
| Testi legali definitivi in pagina, poi `LEGAL_DOCS_APPROVED=true` | `app/privacy/`, `app/cookie/` | M · dipende da §3.5 |
| `NEXT_PUBLIC_SITE_URL` sul dominio finale nelle env di produzione Vercel | Vercel | S · esterno |
| Rendere **bloccante** il check robots di `scripts/smoke.ts:97-102` quando il base URL è l'host di produzione: deve uscire 1 se trova `Disallow: /` | `scripts/smoke.ts` | S |
| Estendere `golive.test.ts:83-96` a **tutti e 25** gli URL legacy, comprese le forme con lo slash finale — oggi non verificate da nessuna parte | `app/lib/__tests__/golive.test.ts` | M |
| Aggiungere a `smoke.ts` un ciclo su tutti i legacy con conteggio dei salti, e una modalità `--host annunci.domustua.com` | `scripts/smoke.ts` | M |
| Mettere per iscritto la scelta sul doppio salto (normalizzazione + redirect) o scrivere `middleware.ts` per rispondere in un salto solo | `docs/retainer-plan.md` §5.1 | S/L |

> **Nota sul doppio salto.** Gli URL legacy finiscono tutti con `/`, le rotte nuove no: Next
> normalizza e poi reindirizza, quindi sono due risposte. È accettabile — Google segue le catene
> brevi — ma `docs/retainer-plan.md:410-418` dichiara questo criterio violato. Va chiuso in un
> senso o nell'altro, non lasciato in contraddizione fra due documenti.

### Fase 1 — La verità · *sforzo minimo, rischio massimo*

Tutta la fase è riscrittura di stringhe. Nessuna modifica strutturale. Si chiude in un giorno e
toglie l'esposizione legale che il §3.3 chiama «il punto più sottovalutato dei due audit».

1. **Eliminare le 14 occorrenze di «senza sorprese»** in `faq.ts`, `domusDoc.ts`,
   `AcquistaContent.tsx`, in cinque lingue. Sostituto già deciso dal documento: *«I problemi
   emergono all'inizio, non davanti al notaio»* — frase già usata a `faq.ts:87`, quindi coerente.
2. **Aggiungere il pattern alla lista `FORBIDDEN`** di `app/lib/__tests__/content-integrity.test.ts`:
   `/senza sorprese|sans surprises|no surprises|ohne Überraschung|sin sorpresas/`. Senza questo, la
   correzione ha vita breve.
3. **Dichiarare che Domus D.O.C. è uno standard interno**, una volta sola. Sede migliore: la
   `footnote` già esistente in `DomusDocProtocol.tsx:76` (× 5 lingue, già renderizzata a `:435` —
   nessun JSX da toccare). *«…svolte prima della messa sul mercato. Domus D.O.C. è uno standard
   interno di Domus Tua, non una certificazione rilasciata da terzi.»*
4. **Aggiungere la riga di definizione** del protocollo (§3.3, testo letterale già scritto nel
   documento) in `DomusDocProtocol.tsx`, e allineare le altre due definizioni pubblicate:
   `faq.ts:72` e `entries.ts:337`.
5. **Togliere «certificazione» dove predica l'immobile**: `entries.ts:391` («e certificazione»
   nell'elenco dei servizi) e `domusDoc.ts:75-95`, dove «Origine Certificata» scivola da nome del
   protocollo ad attributo della casa.
6. **Allineare l'assistente al canone dei nove passaggi**: `entries.ts:311` e `:320`.

> Skill: `professional-proofreader` per la passata multilingua, `ux-copy` per le riformulazioni.

### Fase 2 — La prova · *sbloccata dal punto 1 della tabella §3*

È la fase che il documento considera decisiva («531 recensioni che si possano leggere senza uscire
dal sito») ed è ferma su un input della Direzione. Appena arriva:

1. Popolare `approvedNativeReviews` (`app/lib/reviews.ts:159`) con i record approvati. Il campo
   «tipo di percorso» esiste già (`category`); il **«risultato» no** — va aggiunto allo schema o
   incorporato nel testo.
2. Montare in home un blocco da **3–4 card nominative** e dare un nome vero a
   `FeaturedTestimonial.tsx:29`.
3. **Solo dopo**, declassare il link a Google da `variant="cta"` a verifica testuale
   (`StarReviews.tsx:819`, `Reviews.tsx:247` e `:399`) e riscrivere il sottotitolo di `StarReviews`
   in cinque lingue. L'ordine conta: togliere il link prima di avere le recensioni lascia il vuoto
   al posto della prova.
4. Declassare il widget Trustindex a coda **anche nelle cinque pagine che montano `Reviews`**, non
   solo in home.
5. **Barra prove (§2.1)** — decisione della cliente fra tre vie:
   - **(a)** far uscire la barra prove da `dt-hero-rest`, come già fatto per il sovratitolo (il
     precedente esiste ed è documentato in `HeroCinematic.tsx:838-840`);
   - **(b)** tenerla sotto il velo e ripetere premio e voto in una fascia sottile
     immediatamente sotto la piega — costo zero sull'ingresso cinematografico;
   - **(c)** accettare che «prima dello scroll» non valga per questo sito, e scriverlo.
   La (b) è la raccomandazione: concilia le due richieste senza che nessuna delle due ceda.
6. Portare `LazyYouTubeEmbed` sui due momenti che contano (storia in evidenza dell'hero e
   `FeaturedTestimonial`), invece dei link al canale — §6.5, ultimo capoverso.

> Skill: `impeccable` per la fascia prove e il blocco recensioni (sono decisioni di composizione,
> non di copy), `gsap-scrolltrigger` per il reveal se si sceglie la via (a).

### Fase 3 — Coerenza · *un pomeriggio, molto attrito tolto*

Nessuna di queste voci è grave da sola. Insieme sono ciò che il documento chiama «sciatteria
registrata».

| Cosa | Dove |
|---|---|
| `"su Google · oltre 500 recensioni"` → derivare da `site.reviewsCount` (531) | `dictionaries.ts:55` |
| `4.9` → `4,9` in italiano (separatore decimale) | `RecensioniContent.tsx:25`, `layout.tsx:181` |
| Interpolare `site.rating` / `site.reviewsCount` **anche nei metadata**, invece di scriverli a mano | `layout.tsx`, `page.tsx`, `recensioni/page.tsx` |
| Le versioni brevi del metodo devono dichiararsi tali: *«I nove passaggi del Metodo Domus, in sintesi»* | `VendiContent.tsx`, `AcquistaContent.tsx`, `OpenDomusPageContent.tsx` (× 5 lingue) |
| ~~Famiglia acquirente su **una** formula~~ — **FATTO**. La CTA «vedi le case» prima; in [#66](https://github.com/alexs-stack/domus-tua-site/pull/66) anche la CTA «cerco casa», che in francese aveva tre varianti («un bien», «une maison», e un «Je cherche» monco) e in tedesco due | `HeroCinematic.tsx`, `Paths.tsx`, `AcquistaContent.tsx`, `Contact.tsx`, `PropertyDetail.tsx` |
| ~~Territorio nei **testi visibili** esteso all'alta provincia di Como~~ — **FATTO** ([#66](https://github.com/alexs-stack/domus-tua-site/pull/66)). L'italiano era già su `territoryLabel`; le altre quattro lingue interpolavano ancora `site.address.province`, cioè «Varese» e basta, mentre il JSON-LD della stessa pagina dichiarava anche Como. Ora `territoryLabelBy` è fonte unica per tutte e cinque | `site.ts:232`, `faq.ts` |
| «Ti accompagniamo» → attività verificabili (5 occorrenze). È l'ultima delle tre formule generiche del §2 rimasta in piedi | home, `/acquista`, `/metodo` |
| ~~«Professionalità · Innovazione · Integrità» in `Team.tsx`~~ — **FATTO** ([#66](https://github.com/alexs-stack/domus-tua-site/pull/66)). Al loro posto le tre cose verificabili che il sito già dichiara altrove: non si prende l'incarico se il prezzo non sta in piedi, i documenti si controllano prima di pubblicare, al telefono risponde la stessa persona. Cinque lingue | `Team.tsx` |
| Template title `"%s | Domus Tua Immobiliare Tradate"` → `"%s | Domus Tua"`; `absolute` sulle 4 pagine che già contengono il nome | `layout.tsx:178` + 4 file |
| `BreadcrumbList` sulle 8 rotte scoperte — estrarre un `breadcrumbJsonLd()` in `site.ts` invece di copiarlo a mano | 8 `page.tsx` |
| ~~`Service` su `/servizi`, `FAQPage` su `/open-domus`~~ — fatti | `servizi/page.tsx`, `open-domus/page.tsx` |
| Premio nel **footer** e su **`/chi-siamo` con link verificabile** (il sigillo è già in `public/badges/`) | `Footer.tsx:341`, `ChiSiamoContent.tsx:377-392` |
| Premio nell'immagine di anteprima social | `app/opengraph-image.tsx:76-92` |
| `/case-vendute` non ha **nessun ingresso**: né menu, né footer, né home. Esiste e nessuno la trova | `site.ts:241` o `Footer.tsx:386` |
| Card «Rendering e virtual rendering» è l'unico dei sei servizi **senza href** | `Services.tsx:424` |
| Eventi di conversione: il form di `/lavora-con-noi` (`CareerApplication.tsx`) invia lead senza tracciarli | `CareerApplication.tsx:439` |
| Estendere la passata `axe` alle 5 rotte scoperte (`/chi-siamo`, `/recensioni`, `/servizi`, `/lavora-con-noi`, `/domande-frequenti`, `/cookie`) | `e2e/a11y.spec.ts:17` |

> Skill: `seo-schema` e `seo-meta-optimizer` per i dati strutturati e i title, `ui-a11y` per la
> copertura axe.

### Fase 4 — Le pagine che il vecchio sito aveva · *dipende dall'archiviazione*

Il §5.4 è l'unica parte del documento con una **scadenza esterna**: quei testi e quelle foto
esistono solo sul WordPress che verrà spento.

1. **Archiviare** le 6 pagine servizio e le 6 schede persona prima dello spegnimento. Due ore di
   lavoro che, saltate, ne costano venti.
2. Congelare gli slug: il documento (§5.1) e `docs/retainer-plan.md:351-355` ne propongono di
   diversi. Serve una lista sola.
3. Creare le **5 rotte servizio** (`app/servizi/<slug>/`) con contenuto proprio, metadata,
   `BreadcrumbList` e `Service`. Poi sostituire il jolly `next.config.ts:106` con cinque righe
   puntuali **prima** di esso, aggiungerle a `golive.test.ts` e a `sitemap.ts`.
   *Perché conta:* oggi cinque URL indicizzati atterrano tutti sull'hub, ed è la forma che Google
   tratta come soft 404 — il criterio è scritto in `docs/retainer-plan.md:415`.
4. Creare le **6 pagine persona** (`app/chi-siamo/[persona]/`) da `app/lib/team.ts`, con `Person`
   JSON-LD completo di `image` e `url`. Poi sei redirect puntuali al posto del jolly
   `next.config.ts:111`.
5. Riscrivere `SERVICE_LINKS` (`Services.tsx:216`) sulle destinazioni reali — chiude la voce 25.

### Fase 5 — Le schede immobili · *il §5.8, «il punto più pericoloso»*

Il contenitore è ottimo, e la pulizia automatica esiste già (`app/lib/realsmart/`). Restano i
difetti che il documento elenca uno per uno:

| Difetto (§5.8) | Stato |
|---|---|
| ~~URL dentro il racconto~~ | **FATTO** ([#67](https://github.com/alexs-stack/domus-tua-site/pull/67)). Nel feed erano due annunci. Se la frase è solo un invito all'azione se ne va intera; se porta anche un dato dell'immobile se ne va il solo recapito, con la preposizione che lo reggeva |
| ~~Frase troncata «compra e vendi in serenità con»~~ | **FATTO** ([#67](https://github.com/alexs-stack/domus-tua-site/pull/67)). Erano sei, e finivano tutte su una parola-funzione. Si toglie la frase, non il paragrafo; e la potatura gira anche in fondo alla catena, perché la sesta («chiama ora lo e») il moncone ce l'ha lasciato la nostra redazione del telefono |
| ~~Doppio spazio nel titolo~~ | **FATTO** ([#66](https://github.com/alexs-stack/domus-tua-site/pull/66)). `cleanField` collassa gli spazi interni dei campi di una riga. Erano cinque annunci |
| «e'» invece di «è» (2 annunci) | **Segnalato, non corretto.** Qui la regex dovrebbe cambiare una PAROLA, e quella è la riga che `description.ts` non attraversa. Le tre voci qui sopra sono rimozioni, non riscritture |
| «ns», «vs» (2 annunci) | **Segnalato, non corretto.** Stessa ragione |
| Refuso «valore attuale di marcato» | **Direzione** — nessuna regex ripara un refuso senza riscrivere |
| Registro `Immaginate → tuo figlio → vostri cari` | **Direzione** — riscrittura al «tu» nel gestionale o via override |

> I quattro controlli §5.8 del report guardano ora la **FONTE** e non il testo pubblicato: da
> quando due difetti su quattro spariscono in pubblicazione, la domanda utile non è più
> «l'abbiamo pubblicato?» ma «c'è ancora nel gestionale?». Un report muto verrebbe letto come
> «non c'è niente da correggere».

In più, due lavori strutturali:

- **Campi per categoria** (voce 20): la categoria `box` oggi confluisce in «Commerciale»
  (`toProperty.ts:26-31`); mancano le chiavi *vetrine · destinazione d'uso · accesso ·
  destinazione urbanistica · edificabilità* in `facts.ts`. Il pulsante dinamico è **già fatto**.
- **Alt delle foto galleria**: portare `gallery` da `string[]` a `{src, alt?}[]` e aprire una
  chiave `immagini` negli override, così la Direzione può consegnare le didascalie degli immobili
  di punta. *(Nota: l'accusa del documento — «45 su 46 senza descrizione» — è **superata**: il
  codice dà a ogni foto un alt onesto. Qui si tratta di alzare l'asticella, non di riparare un
  difetto.)*

### Fase 6 — Dopo il lancio

Voci 29, 30, 33, 34 e il §9 — nessuna è bloccante, tutte hanno bisogno di dati che oggi non
esistono.

- **Paginazione `/acquista`**: 1 MB → 558 KB è già stato fatto (`46afd19`). Se 558 KB in un
  documento solo bastino è una decisione che oggi vive **solo in un messaggio di commit**. Va
  scritta in `docs/` o va fatta la paginazione.
- **Pagine locali** (voce 30): non partire senza immobili, recensioni e casi veri per comune. Il
  documento è esplicito: «cinque pagine vere valgono più di quattordici cloni».
- **Collegamenti interni**: oggi ogni CTA in fondo alle pagine editoriali riporta all'ancora del
  modulo della stessa pagina. Il documento indica i link interni come una delle tre leve; è l'unica
  delle tre che non è stata toccata.
- **§9 — il criterio di verifica finale.** Il documento chiede che *ogni sezione* superi la prova
  «prepara / protegge / racconta / governa», o vada tagliata. Nessuno l'ha applicato. È una passata
  di mezza giornata su `app/page.tsx:46-126`, e produce il criterio di accettazione delle sezioni
  future.

---

## 5. Cancelli di verifica

Ogni fase si chiude con lo stesso rituale, che il repo ha già:

```bash
npm run check
```

`lint` + `typecheck` + 1239 unit test + `build`. In più, per fase:

| Fase | Verifica aggiuntiva |
|---|---|
| 0 | `npm run launch-check` deve uscire 0 · `npm run smoke -- <host>` su tutti i legacy — **eseguito in locale il 19 ago: 22/22 su 200** |
| 1 | Il nuovo pattern `FORBIDDEN` in `content-integrity.test.ts` deve fallire prima della correzione e passare dopo |
| 2 | `npm run test:e2e` (porta 3177) · verifica visiva mobile+desktop in una sola passata |
| 3 | `structured-data.test.ts` esteso a `SITEMAP_ROUTES` · `e2e/a11y.spec.ts` su 15 rotte |
| 4 | `golive.test.ts` sui redirect puntuali · `sitemap.ts` aggiornato |
| 5 | `npm run audit:listings-content` · rigenerare `descriptions.snapshot.json` **leggendo il diff** |

> Su Windows gli snapshot e2e sono `darwin-only`: la suite del sito è `npm run test:e2e`.
> Verificare il motion **solo** con Playwright headless, mai a occhio.

---

## 6. Quello che il documento sbagliava

Onestà nei due sensi. Tre punti del documento non reggono alla verifica:

1. **«45 foto su 46 senza descrizione alternativa»** (§5.8). Il codice dà a ogni foto un alt
   costruito e onesto (`PropertyGallery.tsx:94-98`). L'accusa non è più vera.
2. **«/valutazione → 404»** (§5.4). La pagina esiste, con la scala a due livelli che il §3.2
   chiede, e title e description **identici** alla proposta del §6.8.
3. **«9 link privi di nome accessibile»** — il documento lo dichiara già falso positivo, e ha
   ragione: la verifica indipendente conferma. Il presidio automatico esiste
   (`e2e/a11y.spec.ts`), gli mancano solo cinque rotte.

E un punto dove il codice ha scelto meglio del documento: le **stat numeriche non verificabili**
sono state rimosse di proposito (PRODUCT.md), e non vanno reintrodotte per obbedienza letterale a
una tabella.

---

## 7. In una riga

Il documento diceva: *«il sito è già bello, adesso deve smettere di dire quanto siete brave e
cominciare a farlo vedere»*. Due terzi di quel lavoro sono fatti.

Restano tre cose vere: **una promessa che è rientrata da una porta di servizio**, **531 recensioni
che ancora nessuno può leggere**, e **quattro prove nascoste sotto un velo che si alza solo se
scorri**.

Le prime due si risolvono con del testo. La terza è una decisione della cliente, ed è l'unica del
piano che non possiamo prendere noi.
