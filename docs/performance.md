# Prestazioni e accessibilità — misure, budget, divario

> **Nota del 2026-08-17 — i numeri di questo documento sono superati.** La tabella di §1
> (home 80 / LCP 5,4 s / TBT 80 ms) e il divario di §4 fotografano un momento precedente
> all'onda «parità mobile» e alla misura di riverifica; le misure vere stanno in
> `docs/mobile-parity.md` §11-12 e sono queste, sulla stessa configurazione Lighthouse:
> home **perf 0,50 · LCP 9 812 ms · TBT 1 045 ms** (Lighthouse simulato, fine wave — e con
> l'intro che ora suona SEMPRE in laboratorio, perché Lighthouse parte a `sessionStorage`
> vuoto); con throttling **applicato** (sonda CDP, §12.1) LCP a freddo 1 724 ms e **TBT
> proxy 2 898 ms** dopo il cancello di viewport su Trustindex (§12.3, era 3 561). L'imputato
> del TBT non è l'intro (a freddo 3 561 ms contro 3 908 a caldo: l'intro non aggiunge TBT
> netto, §12.1) ma **l'idratazione di react-dom** dell'albero client della home (~2 s in un
> Lighthouse locale, §12.2/12.4). Il gate CI della home è rosso per questo, e il go/no-go
> sull'idratazione differita è una decisione a parte, non un'ottimizzazione da fare di
> passaggio. Il testo sotto resta come storia di ciò che è stato fatto e perché; dove cita
> la durata dell'intro (§3) il numero è stato corretto in linea.

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
Ora è **2,5 s** su desktop e **1,8 s** sotto i 768 px (`app/layout.tsx`, script di boot).
Qui c'era scritto «allineato alla durata reale dell'intro (~2,2 s)»: quel numero non era la
durata dell'intro. La timeline misurata dura **4,63 s su desktop** (3,50 s sul sipario di
ripiego senza `mask-composite`) e **1,75 s sul telefono** (al `c4bccf8`, 2026-08-17; conto
tween per tween in `docs/mobile-parity.md` §5.2 e nell'intestazione di `Preloader.tsx`). Il
failsafe quindi non «segue» l'intro: è il tetto di attesa se il bundle non idrata mai, e sta
sotto l'intro di proposito — un sipario muto più lungo dell'intro vera non ha senso. Quando
scatta da solo, a rimettere in moto Lenis ci pensa la rete di `SmoothScroll.tsx`
(`docs/mobile-parity.md` §5.3).

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
