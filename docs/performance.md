# Prestazioni e accessibilità — misure, budget, divario

Misure in condizioni Lighthouse mobile (Slow 4G simulato: 1,6 Mbps, RTT 150 ms, CPU ×4), su
build di produzione servita in locale.

```bash
npm run lighthouse     # budget: esce con codice 1 se una soglia non è raggiunta
npm run perf:report    # peso delle pagine per tipo di risorsa
```

---

## 1. Prima / dopo

| Pagina | | perf | a11y | SEO | LCP | CLS | TBT |
|---|---|:--:|:--:|:--:|--:|--:|--:|
| `/` | prima | 80 | 100 | 69 | 5,3 s | 0 | 90 ms |
| | **dopo** | **80** | **100** | 69 | **5,4 s** | **0** | **80 ms** |
| `/acquista` | prima | 76 | 99 | 69 | 7,5 s | 0 | 50 ms |
| | **dopo** | **80** | **100** | 69 | **5,4 s** | **0** | **40 ms** |
| `/case/[slug]` | prima | 81 | 100 | 69 | 5,0 s | 0 | 0 ms |
| | **dopo** | **82** | **100** | 69 | **5,0 s** | **0** | **0 ms** |

Il guadagno grosso è su `/acquista`: **−2,1 s di LCP**. Su desktop c'è un guadagno che questa
tabella non mostra, ed è il più grande di tutti (§3, preloader).

**SEO 69 è un artefatto della misura in locale**, non una regressione: senza
`NEXT_PUBLIC_SITE_URL` il sito si dichiara non indicizzabile di proposito (gli URL di anteprima
non devono finire su Google). Con la variabile impostata l'audit `is-crawlable` passa e la
categoria torna a 100.

### Peso delle pagine (byte non compressi, `npm run perf:report`)

| Route | HTML | flight | JS | CSS | Immagini | Totale | Nodi DOM |
|---|--:|--:|--:|--:|--:|--:|--:|
| `/` | 244 kB | 30 kB | 1792 kB | 117 kB | 39 kB | 2704 kB | 1774 |
| `/acquista` | 167 kB | 20 kB | 1787 kB | 117 kB | 59 kB | 2641 kB | 1178 |
| `/case` | 120 kB | 20 kB | 1766 kB | 107 kB | 59 kB | 2427 kB | 778 |

In transito reale (Lighthouse, compresso): **~1,0 MB**, di cui **~550 kB di JavaScript** e
**291 kB di font**.

---

## 2. Cosa è stato fatto

| Intervento | Effetto |
|---|---|
| **Proiezione da griglia** (`toGridProperty`) | `/case` e `/acquista` non serializzano più descrizione e galleria di ogni immobile nell'HTML. Con le 7 fixture demo sono 2 kB; **con i 193 annunci del feed reale sono decine di kB per pagina** |
| **Mappa caricata a richiesta** | Leaflet, i cluster e i loro CSS arrivano quando si passa alla vista mappa, non prima |
| **WebGL fuori dal percorso critico** | `HoverDistort` è un import dinamico: `ogl` non finisce più nel chunk condiviso con GSAP, che si carica su **ogni** pagina |
| **Cromo animato differito** | Preloader, transizione di pagina e cursore custom arrivano dopo il primo paint: −53 kB di JS in transito |
| **Effetti costosi spenti dove non servono** | WebGL già escluso da reduced motion, puntatore grosso e schermi stretti; ora anche da `saveData`, meno di 4 GB di RAM o meno di 4 core |
| **Foto di sfondo a qualità 60** | Sono sotto due velature scure e in movimento: il file dimezza e la differenza non si vede. È l'LCP di `/acquista`, `/vendi`, `/metodo` |
| **Gerarchia dei titoli** | Un `h2` solo-per-screen-reader sulla griglia dei risultati: le schede (`h3`) non seguono più l'`h1` saltando un livello (a11y 99 → 100 su `/acquista`) |

Nessun contenuto e nessuna funzionalità sono stati rimossi per guadagnare punti.

---

## 3. Preloader: da 8 s a 2,5 s

Lo script inline nel layout marca `<html data-preloader>` prima del primo paint e lo toglie
quando l'intro finisce. Il failsafe — per il caso in cui il bundle non si idrati mai — era a
**8 secondi**.

Non è teoria: nella prima misura, fatta per errore a larghezza desktop, l'LCP era **8,5 s**, di
cui 7,9 s di "render delay". Il sipario restava sopra la pagina fino allo scadere del failsafe.
Ora è **2,5 s**, allineato alla durata reale dell'intro (~2,2 s).

---

## 4. Il divario che resta, e perché

| Budget | Richiesto | Misurato | Esito |
|---|---|---|:--:|
| Performance mobile, home | ≥ 90 | 80 | ✗ |
| Performance mobile, scheda | ≥ 90 | 82 | ✗ |
| Accessibilità | ≥ 95 | 100 | ✓ |
| CLS | ≤ 0,1 | **0** | ✓ |
| LCP | ≤ 2,5 s | 5,0–5,4 s | ✗ |
| TBT (task lunghi) | — | 0–80 ms | ✓ |
| SEO | nessuna regressione | 69 in locale / 100 con `SITE_URL` | ✓ |

**Il collo di bottiglia è la banda, non il codice.** A 1,6 Mbps simulati, 1 MB di risorse sono
~5 secondi: è tutto lì. La prova è diretta — bloccando i soli font, l'LCP scende da 5,3 s a
**3,8 s** e il punteggio sale a **88**. I 291 kB di font valgono 1,5 s da soli.

Le due strade per chiudere il divario, entrambe fuori dal mandato "non cambiare design":

1. **Tipografia.** Fraunces variabile con asse `SOFT` (usato davvero: `font-variation-settings:
   "SOFT" 46`) più il corsivo vero: 149 kB + 120 kB, entrambi sopra la piega, entrambi in
   preload. Ridurli significa rinunciare a un asse o al corsivo — **è una decisione del
   cliente sul marchio**, non un'ottimizzazione tecnica.
2. **Livello motion.** GSAP, ScrollTrigger, Lenis e le decine di componenti client che li usano
   sono ~550 kB. Portarli a caricamento differito componente per componente è un lavoro a sé,
   con rischio reale di regressione sulle animazioni approvate.

Per questo il job Lighthouse in CI è **informativo**: le soglie sono quelle vere e restano
scritte nel budget, ma un gate rosso dal primo giorno verrebbe disattivato entro una settimana.
Diventa bloccante quando una delle due strade sopra è percorsa.

---

## 5. Note di metodo

- Le misure vanno fatte su **build di produzione**: il server di sviluppo serve chunk diversi.
- `numberOfRuns: 1` è veloce ma rumoroso: fra due esecuzioni identiche ho visto ±0,3 s di LCP.
  Per decidere, meglio 3 run e la mediana.
- I tempi di rete nel report Lighthouse sono **osservati** (senza throttling): le metriche
  invece sono **simulate**. Confrontare le due colonne porta fuori strada.
- `npm run perf:report` misura byte **non compressi** e si ferma a `load`: dopo, Next preleva in
  anticipo le rotte dei link in vista, e contarle direbbe quanto pesa la navigazione futura.

---

## 6. Reaudit — payload lista e rischio cache (Prompt 10)

Misure **deterministiche** (byte serializzati, non Lighthouse) sul feed reale (196 annunci):

| Cosa | Prima | Dopo | Come |
|---|--:|--:|---|
| `/acquista` — GridProperty[] serializzato (28 card disponibili) | 75 KB | **16 KB** | `toGridProperty` ora scarta anche `facts` |
| Voce cache `getLiveListingsSnapshot` (196 annunci) | 1512 KB / 2048 | 1512 KB | invariata (vedi sotto) |

**`facts` fuori dal payload di griglia (−59 KB non compressi su `/acquista`).** La card mostra
copertina, badge e i quattro numeri; filtro, ranking e ricerca usano `features`/`excerpt`/`badges`,
**mai** `facts` (verificato: `app/lib/ai/rank.ts`, `PropertyCard`, `PropertySearch`). I fatti
strutturati servono solo alla scheda `/case/[slug]`, che li ha dai propri dati. Era il campo più
pesante della card dopo descrizione e galleria (già escluse). Vale anche per le risposte di
`/api/search`, che restituisce GridProperty. Test: `app/lib/__tests__/gridProperty.test.ts`.

**Rischio cache (§5 del prompt).** La voce `unstable_cache` degli immobili normalizzati pesa
**1512 KB su 2048** (74%): con la crescita del catalogo (~265 annunci) supererebbe il limite,
`unstable_cache` **smetterebbe di memorizzare** e ogni richiesta rielaborerebbe il feed da 2,6 MB —
un guasto silenzioso. È già **presidiato in CI**: l'audit contenuti (`npm run audit:listings-content`,
job "Audit contenuti annunci") misura il payload e **fallisce oltre i 2 MB**. Ripartizione per campo:
`images` 524 KB, `descriptionParagraphs` 428 KB, `facts` 389 KB (di cui ~77 KB di `source`, tracciabilità
non renderizzata). Riduzioni possibili senza toccare il design, come lavoro successivo: togliere dalla
sola voce di cache `facts[].source`/`evidence` e i campi solo-audit (`factsReview`/`keptFactLines`/…,
~85 KB) o **separare indice e dettaglio** (la card non ha bisogno di gallery/descrizione). Non fatte
qui per non introdurre type-surgery e rischio su una voce già presidiata.

## 7. Il divario Lighthouse resta fuori mandato — budget scaglionati

La baseline CI del reaudit (Home perf **0,41**, LCP **9,83 s**; `/acquista` **0,53**, LCP **5,21 s**)
è più severa della misura locale in §1: runner GitHub, throttling e cold start la peggiorano. Il
collo di bottiglia resta la **banda**, non il codice (§4):

1. **Font** — è il singolo fattore più grande (bloccandoli l'LCP scende di ~1,5 s). Ridurre pesi/
   famiglie tocca il marchio: **decisione del cliente**, non un'ottimizzazione tecnica. (Pinyon è
   nel hero: `preload:false` darebbe un FOUT visibile sul fregio, non fatto.)
2. **Livello motion** (~550 kB: GSAP/ScrollTrigger/Lenis) — differirlo componente per componente è
   un lavoro a sé con rischio reale sulle animazioni approvate.

Perciò `0,90` **non è raggiungibile qui** senza una di queste due decisioni. Il job Lighthouse
resta **informativo** (le soglie vere restano scritte). **Proposta di budget scaglionati** —
diventano bloccanti quando la decisione arriva:

| Tappa | Prerequisito | Budget perf | Budget LCP |
|---|---|--:|--:|
| Oggi | — (informativo) | — | — |
| T1 | Cliente approva riduzione font | ≥ 0,70 | ≤ 4,0 s |
| T2 | Motion layer differito | ≥ 0,85 | ≤ 3,0 s |
| T3 | Entrambe | **≥ 0,90** | **≤ 2,5 s** |

> ⚠️ I numeri di questa sezione che riguardano Lighthouse (0,41/9,83…) sono la baseline CI citata
> dal prompt: non li ho riprodotti in locale (questo ambiente ha varianza da carico). Vanno
> riconfermati su un run CI pulito prima di fissare le tappe con date.
