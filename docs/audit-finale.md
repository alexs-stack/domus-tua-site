# Audit finale — Domus Tua

Verifica indipendente del sito, fatta **guardandolo funzionare**, non leggendo i report delle PR
precedenti. Dove ho potuto misurare c'è il numero; dove non ho potuto, è scritto che non ho
potuto.

Ambiente della verifica: build di produzione con **feed RealSmart live** (193 annunci reali, 26
disponibili), `NEXT_PUBLIC_SITE_URL=https://www.domustua.com`, servita in locale.

---

## 1. Checklist PASS / FAIL

| # | Verifica | Esito | Prova |
|---|---|:--:|---|
| 1 | Destinazione dei lead dichiarata | **PASS** | il form passa da `/api/lead` (webhook Google Sheet, `SHEETS_WEBHOOK_URL`); l'assistente manda email a `immobiliare@domustua.it`, costante unica in `assistant/config.ts`. `/api/health` dichiara quale dei due è configurato |
| 2 | WhatsApp +39 346 604 2314 | **PASS** | 4 link, tutti `wa.me/393466042314`, testo codificato, `rel="noopener"` |
| 3 | Chiamata diretta | **PASS** | 2 link, entrambi `tel:+390331844898` |
| 4 | Assenza di CRM di terze parti | **PASS** | nessun CRM esterno. Google Sheet resta la destinazione del form via `/api/lead`: è dichiarato, non nascosto |
| 5 | Roster del team | **FAIL — decisione del cliente** | `app/lib/team.ts` elenca ancora sei persone, Eleonora D'Agati e Tiziana Galeone comprese, come roster attuale. La fonte dichiarata è domustua.com/chi-siamo (lug 2026). Chi è in organico oggi lo sa solo l'agenzia: finché non lo conferma, togliere due nomi reali da una pagina pubblica sarebbe una modifica non verificata. Vedi §5, punto 4 |
| 6 | Menu | **PASS** | 8 voci, tutte in chiaro nella barra desktop e nel pannello mobile; nessuna pagina raggiungibile solo da URL |
| 7 | RealSmart | **PASS** | 193 annunci; titolo/comune/superficie/descrizione/immagini 100%, provincia 99%, prezzo 99%, classe energetica 89% |
| 8 | Filtri comuni | **PASS** | 39 comuni in tendina, generati dai dati live |
| 9 | Immobili venduti | **PASS** | 26 in vetrina, 0 badge "venduto"; **8 schede vendute controllate a campione: tutte etichettate, nessuna con CTA "prenota una visita"** |
| 10 | Descrizioni | **PASS** | 6 schede reali: nessun `<br>` a video, nessuna descrizione vuota |
| 11 | Lightbox | **PASS** | apertura, contatore, frecce, Escape, trap del focus, ritorno del focus — coperto da 4 test e2e su due viewport |
| 12 | Chatbot | **PASS** | flag spento: nessun launcher in pagina. Backend: 60 test + 100 eval, ma **soglie col modello non misurate** (§5) |
| 13 | Consenso Trustindex | **PASS** | **0 richieste a terze parti prima del consenso**, misurate su prima visita mobile |
| 14 | Mobile | **PASS** | 390×844 su feed live: idratazione ok, zero errori in console, banner cookie presente, nessun traboccamento |
| 15 | Accessibilità | **PASS** | axe WCAG 2.1 A/AA su 8 pagine + chat + banner: **0 violazioni**; Lighthouse a11y **100** |
| 16 | Performance | **FAIL parziale** | perf 80–82 (richiesto ≥ 90), LCP 5,0–5,4 s (richiesto ≤ 2,5 s). CLS **0**, TBT ≤ 80 ms. Causa misurata: [performance.md](performance.md) |
| 17 | Sicurezza | **PASS dopo correzioni** | tre falle trovate e chiuse qui (§2) |
| 18 | Metadata | **PASS** | title, description, canonical, OG image, 3 blocchi JSON-LD sulla scheda, tutti validi |
| 19 | Sitemap e robots | **PASS con nota** | 203 URL, host corretto; robots blocca l'indicizzazione fuori produzione (§4) |
| 20 | Health endpoint | **PASS** | solo booleani e metadati pubblici, con un test che elenca le stringhe ammesse e fallisce su ogni altra |
| 21 | Numeri o contenuti inventati | **PASS** | 26 test di integrità; le vecchie cifre sopravvivono solo nei commenti che ne spiegano la rimozione |

**18 PASS, 1 PASS con nota, 2 FAIL.** Entrambi i FAIL sono dichiarati col numero o col nome,
non arrotondati: la performance è 80, non "quasi 90"; il roster del team elenca sei persone e
non sappiamo se sono ancora sei. Il primo aspetta una decisione sulla tipografia, il secondo
una conferma dell'agenzia — nessuno dei due si chiude scrivendo codice.

---

## 2. Problemi trovati

### P0 — bloccano la pubblicazione

Nessuno.

### P1 — gravi (corretti in questa PR)

**P1-1 · Nessuna intestazione di sicurezza.** Il sito rispondeva senza `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`. Un sito
con un form contatti che può essere incorniciato in una pagina altrui è clickjacking pronto
all'uso.

Corretto in `next.config.ts`, su ogni percorso. Verificato sulla build:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

Niente CSP: il sito carica GSAP con stili inline, Trustindex e YouTube, e una CSP scritta a
occhio si romperebbe in produzione senza che nessuno se ne accorga fino alla prima segnalazione.
Resta un lavoro a sé, da fare in report-only con un endpoint che raccolga le violazioni.

**P1-2 · Iniezione possibile nei dati strutturati.** I JSON-LD del layout, della scheda immobile
e di /lavora-con-noi usavano `JSON.stringify` dentro `dangerouslySetInnerHTML`. `JSON.stringify` **non** tocca la
sequenza `</script>`, e titoli e descrizioni degli immobili arrivano dal gestionale — cioè da
fuori. Un annuncio intitolato `Villa </script><script>…` avrebbe chiuso il tag e fatto eseguire
il resto.

Corretto con `jsonLdScript()` in `app/lib/site.ts`: sfugge `<` e i separatori di riga
U+2028/U+2029. Test di regressione con un payload ostile vero.

Il test non guarda un elenco di file scritto a mano ma **scandisce l'albero** `app/`, e verifica
le due direzioni: nessun `JSON.stringify` grezzo dentro `dangerouslySetInnerHTML`, e ogni file
che emette `application/ld+json` passa davvero dall'escaper. La differenza non è teorica: la
prima versione elencava due file, /lavora-con-noi è nata dopo, ed è rimasta scoperta senza che
niente diventasse rosso.

**P1-3 · Widget di terze parti sulla nostra origine.** L'iframe delle recensioni usa `srcDoc`,
che **eredita l'origine del documento**: lo script di Trustindex girava con accesso ai nostri
cookie e al nostro `localStorage`.

Corretto con `sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"` — senza
`allow-same-origin`, quindi in un'origine opaca. Verificato che il widget continua a funzionare:
**20 090 caratteri di recensioni renderizzati, altezza 399 px**. Effetto collaterale accettato:
dentro il loro iframe Trustindex logga un avviso perché non può leggere `sessionStorage`. È un
errore nella loro sandbox, non nel sito.

### P2 — miglioramenti (segnalati, non corretti)

- **Performance sotto il budget** (§1.16). Chiuderla richiede una decisione sul marchio
  (tipografia) o un lavoro a sé sul livello motion: [performance.md](performance.md).
- **Le 167 schede vendute sono nella sitemap.** Non è un errore: sono pagine reali, etichettate
  come vendute, e l'agenzia le tiene come portfolio. Ma portano traffico di ricerca su immobili
  non acquistabili — vale la pena deciderlo consapevolmente.
- **La CSP manca** (vedi P1-1).

### P3 — polish (corretti o annotati)

- **Test ballerino sul lightbox** (corretto). `il lightbox occupa lo schermo senza traboccare`
  falliva su mobile sotto carico: il click arrivava prima dell'idratazione. Non era un difetto
  del sito — lo stesso test da solo passa — ma un test che fallisce a caso è peggio di nessun
  test. Ora usa `clickUntil`, come gli altri.
- **La suite di browser non tollera vicini rumorosi.** Due cose imparate a mie spese durante
  questo audit, entrambe da sapere prima di leggere un rosso:
  1. non può girare mentre un'altra build è in corso nello stesso worktree — condividono
     `.next`, e il server serve chunk che non esistono più (**88 test falliti così**);
  2. su una macchina sotto pressione di memoria il sistema uccide il server di test a metà
     corsa (`Killed: 9` nel log, poi 107 `ERR_CONNECTION_REFUSED` di fila). Non è il sito: è la
     RAM. Con due viewport e due worker la stessa suite passa.

---

## 3. Prove

Tutte riproducibili con i comandi del repository.

| Cosa | Comando | Risultato |
|---|---|---|
| Feed vero | `npm run check:realsmart` | 193 annunci · 26 disponibili · 167 venduti · mapping coerente |
| Nessun venduto in vetrina | ispezione DOM su `/case` (feed live) | 26 schede, 0 badge "venduto" |
| Schede vendute oneste | 8 schede aperte per URL diretto | 8/8 etichettate, 0 con CTA di visita |
| Descrizioni pulite | 6 schede reali | 0 con `<br>` a video, 0 vuote |
| Consenso | prima visita mobile, 5 s di attesa | 0 richieste a Trustindex/Google/Meta |
| Accessibilità | `npx playwright test e2e/a11y.spec.ts` | 0 violazioni axe |
| Intestazioni | `curl -sI` sulla build | 5 intestazioni presenti (sopra) |
| Health | `curl /api/health` | solo booleani e metadati; `soldMap: 193 + 3` |

### Screenshot (feed live, 390×844)

`/tmp/shots/audit-home-mobile.png` · `audit-case-mobile.png` · `audit-scheda-mobile.png` —
homepage con banner cookie, vetrina con immobili reali, scheda immobile.

---

## 4. Configurazioni mancanti

Non sono difetti: sono valori che vivono nella dashboard e che nessuno script può impostare.
Elenco completo per ambiente in [vercel-live-checklist.md](vercel-live-checklist.md). In sintesi,
prima della pubblicazione:

`NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_USE_REALSMART=true` · `REALSMART_*` · `SHEETS_WEBHOOK_URL`
(destinazione dei lead del form) · `TRUSTINDEX_WIDGET_URL`.

Da **non** impostare in produzione: `NEXT_PUBLIC_PREVIEW_BADGE`, `NEXT_PUBLIC_ENABLE_ASSISTANT`.

Nota su robots: senza `NEXT_PUBLIC_SITE_URL`, o col badge di anteprima acceso, il sito si
dichiara non indicizzabile. È il comportamento voluto per le anteprime, ed è anche il motivo per
cui il punteggio SEO misurato in locale è 69 invece di 100.

---

## 5. Le decisioni che restano al cliente

Solo queste. Tutto il resto è fatto, o è configurazione.

1. **Tipografia e performance.** Il punteggio non raggiunge 90 perché 291 kB di font (Fraunces
   con asse `SOFT` + corsivo vero, entrambi sopra la piega) valgono 1,5 s di LCP su rete lenta.
   Rinunciare a un asse o al corsivo li dimezzerebbe. **È una scelta sul marchio, non tecnica.**
2. **Accendere il chatbot.** Il backend è pronto, il flag è spento. Servono la chiave del
   provider e gli eval con soglie verdi (scelta dello strumento ≥ 95%, zero immobili o prezzi
   inventati). **Oggi quelle soglie non sono state misurate**: senza chiave i cento casi non
   sono stati eseguiti.
3. **Le schede vendute nella sitemap**: restano indicizzabili come portfolio, o si escludono?
4. **Roster e foto del team.** `app/lib/team.ts` presenta sei persone come squadra attuale,
   con i ruoli presi dal sito ufficiale. Se qualcuno non è più in agenzia servono due cose,
   ed entrambe partono da una conferma dell'agenzia: togliere i nomi dalla fonte unica e
   rifare le foto di gruppo. Nessuna delle due è una modifica che si possa fare "per
   deduzione" — sono persone vere su una pagina pubblica
   ([client-assets-needed.md](client-assets-needed.md)).
5. **Video dell'hero**: facoltativo. Senza, resta il poster, che è una foto reale.
6. **Cutover del dominio**: non toccato, di proposito.

---

## 6. Perché non è 10/10

Tre cose mancano, e sono diverse fra loro: **la performance non rientra nel budget richiesto**
(80 contro 90, misurato), **le soglie del chatbot non sono state misurate** (verifica assente,
non fallita) e **il roster del team non è confermato** (sei nomi pubblicati, nessuna conferma
che siano ancora sei). Nessuna delle tre si risolve dichiarandola risolta.

Quello che invece è dimostrato, con numeri: nessun immobile venduto presentato come disponibile
su 193 annunci reali; nessuna richiesta a terze parti prima del consenso; zero violazioni di
accessibilità; tre falle di sicurezza chiuse e coperte da test di regressione; nessun contenuto
inventato.
