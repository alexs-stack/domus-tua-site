# Misure della coreografia di era-residence

Numeri presi con Playwright headless sul build di produzione (`next start`, mai `next dev`: Turbopack serve `globals.css` con un'edizione di ritardo), con motion attivo e il sipario saltato come fa la fixture `goto` di `e2e/helpers.ts`. Ogni script di questa cartella, e `scripts/probe-lcp-base.mjs`, aggiunge in fondo una sezione con data, commit misurato e viewport; sotto la tabella c'è la decisione che il numero ha preso. Un commit col segno `+` aveva modifiche non committate a file tracciati.

Script:
- `lib.mjs`: server sulla 3178, contesto con motion attivo, scroll, campionamento, tabelle.
- `02-testo-oggi.mjs`: `sonda` conta le righe dei titoli TextLines della home, sceglie il titolo del test 2 e ne misura l'uscita dalla matrice delle righe con `lib.mjs`, senza la sonda dell'inchiostro dei test; `report` legge i tempi di `e2e/text-motion.spec.ts` dal report JSON e li confronta con la sonda.
- `scripts/probe-lcp-base.mjs`: base dell'LCP e del CLS di spec §2.5, scrive `e2e/baseline/lcp-base.json`.


## 02 · Sonda dell'uscita di oggi (02-testo-oggi.mjs sonda)

2026-09-14 · commit ffe4295 · desktop-1440 (Desktop Chrome, 1440×900) e mobile-390 (iPhone 13 su chromium, 390×664) · next start sulla 3178 col build della suite, un contesto alla volta, motion attivo, consenso accettato, sipario saltato · ScrollTrigger rinfrescati dall'attrezzatura dopo lo split (D38: cambio di larghezza di 1 px e ritorno; oggi il sito non rinfresca dopo l'idratazione; condizione aggiunta nel giro di correzione 1: la misura era già presa così) · uscita: ms dal primo fotogramma col bordo alto sotto 0,85 × innerHeight al primo con tutte le righe a yPercent ≥ 90 (m42 della matrice / altezza della riga), dopo una rotellata da 0,5 a 0,93

| titolo | testo | righe 1440 | righe 390 | uscita prevista ms (righe massime) | idoneo |
| --- | --- | --- | --- | --- | --- |
| #cerca h2 | Che casa stai cercando? | 2 | 2 | 1107 | sì |
| #perche-domus-tua h2 | Perché scegliere Domus Tua | 2 | 3 | 1197 | no |
| #voci h2 | Le storie in video | 1 | 2 | 1107 | sì |
| #metodo h2 | Un percorso chiaro, dalla prima stima al | 3 | 4 | 1287 | no |
| #metodo h3 | Prima, le persone | 2 | 2 | 1107 | sì |
| #open-domus h2 | Open Domus. | 1 | 1 | 1017 | sì |
| #domus-doc h2 | Domus D.O.C. | 1 | 1 | 1017 | sì |
| #servizi h2 | Tutto ciò che serve per valorizzare, pro | 3 | 6 | 1467 | no |
| #costi h2 | Nessun costo anticipato. | 2 | 2 | 1107 | sì |
| #chi-siamo h2 | Persone prima degli immobili. | 3 | 2 | 1197 | no |
| #contatti h2 | Inizia dal primo passo: una valutazione  | 3 | 5 | 1377 | no |
| #recensioni h2 | Cinque stelle, una alla volta. | — | 2 | — | no |

| progetto | titolo | giri ms | mediana ms | peggiore ms | righe |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | #costi h2 | 1150 / 1150 / 1150 | 1150 | 1150 | 2 |
| mobile-390 | #costi h2 | 1217 / 1217 / 1217 | 1217 | 1217 | 2 |

Decisione: EXIT_TARGET resta #costi h2: al più due righe sui due progetti, giro peggiore 1217 ms ≤ 1230 ms.

## 02 · Tempi del testo di oggi (e2e/text-motion.spec.ts su TextLines e Reveal, confronto con la sonda)

2026-09-14 · commit ffe4295 · desktop-1440 (1440×900) e mobile-390 (iPhone 13 su chromium, 390×664) · build della suite sulla 3177, --workers=1, --repeat-each=3, motion attivo, consenso accettato, sipario saltato · test 1 e 2 a ScrollTrigger rinfrescati dall'attrezzatura dopo lo split (D38: cambio di larghezza di 1 px e ritorno; oggi il sito non rinfresca dopo l'idratazione; condizione aggiunta nel giro di correzione 1: la misura era già presa così, la scossa stava dentro `ready` al primo scroll) · ingresso: ms dal fotogramma in cui il bordo alto entra dal basso all'inizio dell'ultimo tratto pieno, peggiore fra titoli e blocchi in vista; uscita: ms dal passaggio della linea dell'85 % all'inchiostro massimo sotto 0,1

| gesto | titolo o capitolo | progetto | giri | mediana ms | peggiore ms | dettaglio |
| --- | --- | --- | --- | --- | --- | --- |
| dall-alto | #servizi h2 | desktop-1440 | 3 | — | — | inchiostro minimo 1.00 |
| dall-alto | #servizi h2 | mobile-390 | 3 | — | — | inchiostro minimo 1.00 |
| ingresso | #contatti | desktop-1440 | 3 | 1717 | 1717 | titoli 1, blocchi 2 |
| ingresso | #contatti | mobile-390 | 3 | 1767 | 1767 | titoli 1, blocchi 2 |
| ingresso | #servizi | desktop-1440 | 3 | 900 | 1533 | titoli 1, blocchi 1 |
| ingresso | #servizi | mobile-390 | 3 | 1733 | 1750 | titoli 1, blocchi 1 |
| rientro-dall-alto | #servizi h2 | desktop-1440 | 3 | — | — | inchiostro minimo 1.00 |
| rientro-dall-alto | #servizi h2 | mobile-390 | 3 | — | — | inchiostro minimo 1.00 |
| uscita | #costi h2 | desktop-1440 | 3 | 1150 | 1150 | foglie 2 |
| uscita | #costi h2 | mobile-390 | 3 | 1217 | 1217 | foglie 2 |

| progetto | uscita del test, mediana ms | uscita della sonda, mediana ms | scarto ms |
| --- | --- | --- | --- |
| desktop-1440 | 1150 | 1150 | 0 |
| mobile-390 | 1217 | 1217 | 0 |

Decisione: Il test 2 e la sonda misurano la stessa uscita di #costi h2 (scarto delle mediane ≤ 50 ms, giro peggiore ≤ 1230 ms) e i test 1-3 sono verdi in tutti i giri.

## 02 · Base dell'LCP e del CLS (scripts/probe-lcp-base.mjs)

2026-09-14 · commit ffe4295 · contesti nudi 1440×900 e 390×664 a DPR 1 (chiavi di measure-lcp.mjs, confronto con §2.5) e progetti desktop-1440 (Desktop Chrome, 1440×900) e mobile-390 (iPhone 13 su chromium, 390×664, DPR 3), che legge il test 6 · next start sulla 3178 col build della suite, un contesto alla volta, senza consenso, sipario saltato, rete e CPU non frenate, load più 4000 ms, ultima voce LCP, mediana di 3 giri · AMD Ryzen 7 7800X3D 8-Core Processor           

| rotta | 1440×900 (§2.5) | 390×664 (§2.5) | desktop-1440 (test 6) | mobile-390 (test 6) | CLS 1440 / 390 (massimo) | §2.5 1440 · 390 | scarti > 60 ms o tag diverso |
| --- | --- | --- | --- | --- | --- | --- | --- |
| / | IMG 124 ms | IMG 116 ms | IMG 180 ms | IMG 132 ms | 0 / 0.0002 | IMG 104 · IMG 124 | — |
| /vendi | IMG 112 ms | IMG 140 ms | IMG 104 ms | IMG 128 ms | 0 / 0.0002 | IMG 76 · IMG 72 | 390: IMG 72 → IMG 140 |
| /contatti | H1 124 ms | H1 116 ms | H1 128 ms | H1 128 ms | 0 / 0.0002 | H1 80 · H1 104 | — |
| /case-vendute | H1 100 ms | H1 88 ms | H1 112 ms | H1 84 ms | 0 / 0.0002 | H1 112 · H1 116 | — |
| /valutazione-immobile-tradate | H1 128 ms | H1 64 ms | H1 136 ms | H1 120 ms | 0 / 0.0002 | H1 116 · H1 116 | — |

Decisione: Sulle tre pagine senza foto l'elemento LCP è l'H1 nelle due forme, come in spec §2.5: la regola del lead intero vale. Questa è la base del test 6 su questa macchina; la tabella di §2.5 resta la misura della spec.

Scarti fra i giri oltre 100 ms: desktop-1440 /: scarto fra i giri 104 ms.

Nota del giro di correzione 1 (2026-09-14): le colonne «1440×900», «390×664», «CLS 1440 / 390» e «§2.5 1440 · 390» di questa tabella erano scritte scambiate (lo script enumerava le chiavi intere con `Object.keys`, che le ordina 390, 1440, contro intestazioni scritte 1440, 390) e sono state rimesse al loro posto a mano; la colonna «scarti», che nomina la larghezza in ogni voce, era giusta. Prima misura, non committata in `lcp-base.json`.

## 02 · Base dell'LCP e del CLS (scripts/probe-lcp-base.mjs)

2026-09-14 · commit ffe4295 · contesti nudi 1440×900 e 390×664 a DPR 1 (chiavi di measure-lcp.mjs, confronto con §2.5) e progetti desktop-1440 (Desktop Chrome, 1440×900) e mobile-390 (iPhone 13 su chromium, 390×664, DPR 3), che legge il test 6 · next start sulla 3178 col build della suite, un contesto alla volta, senza consenso, sipario saltato, rete e CPU non frenate, load più 4000 ms, ultima voce LCP, mediana di 3 giri · AMD Ryzen 7 7800X3D 8-Core Processor           

| rotta | 1440×900 (§2.5) | 390×664 (§2.5) | desktop-1440 (test 6) | mobile-390 (test 6) | CLS 1440 / 390 (massimo) | §2.5 1440 · 390 | scarti > 60 ms o tag diverso |
| --- | --- | --- | --- | --- | --- | --- | --- |
| / | IMG 140 ms | IMG 124 ms | IMG 152 ms | IMG 116 ms | 0 / 0.0002 | IMG 104 · IMG 124 | — |
| /vendi | IMG 108 ms | IMG 112 ms | IMG 104 ms | IMG 108 ms | 0 / 0.0002 | IMG 76 · IMG 72 | — |
| /contatti | H1 120 ms | H1 120 ms | H1 140 ms | H1 112 ms | 0 / 0.0002 | H1 80 · H1 104 | — |
| /case-vendute | H1 104 ms | H1 80 ms | H1 108 ms | H1 80 ms | 0 / 0.0002 | H1 112 · H1 116 | — |
| /valutazione-immobile-tradate | H1 108 ms | H1 132 ms | H1 128 ms | H1 120 ms | 0 / 0.0002 | H1 116 · H1 116 | — |

Decisione: Sulle tre pagine senza foto l'elemento LCP è l'H1 nelle due forme, come in spec §2.5: la regola del lead intero vale. Questa è la base del test 6 su questa macchina; la tabella di §2.5 resta la misura della spec.

Scarti fra i giri oltre 100 ms: desktop-1440 /: scarto fra i giri 104 ms.

Nota del giro di correzione 1 (2026-09-14): le colonne «1440×900», «390×664», «CLS 1440 / 390» e «§2.5 1440 · 390» di questa tabella erano scritte scambiate (stessa causa della sezione sopra) e sono state rimesse al loro posto dai valori di `e2e/baseline/lcp-base.json` («1440 /» = 140, «390 /» = 124, CLS 0 a 1440 e 0,0002 a 390) e da `SPEC` dello script; il JSON, che il test 6 legge, era e resta giusto. Da qui in poi lo script fissa l'ordine 1440, 390 e deriva le intestazioni dallo stesso elenco.

## 02 · Sonda dell'uscita di oggi (02-testo-oggi.mjs sonda)

2026-09-14 · commit 1a77744+ · desktop-1440 (Desktop Chrome, 1440×900) e mobile-390 (iPhone 13 su chromium, 390×664) · next start sulla 3178 col build della suite, un contesto alla volta, motion attivo, consenso accettato, sipario saltato · ScrollTrigger rinfrescati dall'attrezzatura dopo lo split (D38: cambio di larghezza di 1 px e ritorno; oggi il sito non rinfresca dopo l'idratazione) · uscita: ms dal primo fotogramma col bordo alto sotto 0,85 × innerHeight al primo con tutte le righe a yPercent ≥ 90 (m42 della matrice / altezza della riga), dopo una rotellata da 0,5 a 0,93

| titolo | testo | righe 1440 | righe 390 | uscita prevista ms (righe massime) | idoneo |
| --- | --- | --- | --- | --- | --- |
| #cerca h2 | Che casa stai cercando? | 2 | 2 | 1107 | sì |
| #perche-domus-tua h2 | Perché scegliere Domus Tua | 2 | 3 | 1197 | no |
| #voci h2 | Le storie in video | 1 | 2 | 1107 | sì |
| #metodo h2 | Un percorso chiaro, dalla prima stima al | 3 | 4 | 1287 | no |
| #metodo h3 | Prima, le persone | 2 | 2 | 1107 | sì |
| #open-domus h2 | Open Domus. | 1 | 1 | 1017 | sì |
| #domus-doc h2 | Domus D.O.C. | 1 | 1 | 1017 | sì |
| #servizi h2 | Tutto ciò che serve per valorizzare, pro | 3 | 6 | 1467 | no |
| #costi h2 | Nessun costo anticipato. | 2 | 2 | 1107 | sì |
| #chi-siamo h2 | Persone prima degli immobili. | 3 | 2 | 1197 | no |
| #contatti h2 | Inizia dal primo passo: una valutazione  | 3 | 5 | 1377 | no |
| #recensioni h2 | Cinque stelle, una alla volta. | — | 2 | — | no |

| progetto | titolo | giri ms | mediana ms | peggiore ms | righe |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | #costi h2 | 1150 / 1150 / 1150 | 1150 | 1150 | 2 |
| mobile-390 | #costi h2 | 1216 / 1217 / 1217 | 1217 | 1217 | 2 |

Decisione: EXIT_TARGET resta #costi h2: al più due righe sui due progetti, giro peggiore 1217 ms ≤ 1230 ms.

## 02 · Tempi del testo di oggi (e2e/text-motion.spec.ts su TextLines e Reveal, confronto con la sonda)

2026-09-14 · commit 1a77744+ · desktop-1440 (1440×900) e mobile-390 (iPhone 13 su chromium, 390×664) · build della suite sulla 3177, --workers=1, --repeat-each=3, motion attivo, consenso accettato, sipario saltato · test 1 e 2 a ScrollTrigger rinfrescati dall'attrezzatura dopo lo split (refreshTriggers, D38: cambio di larghezza di 1 px e ritorno; oggi il sito non rinfresca dopo l'idratazione) · ingresso: ms dal fotogramma in cui il bordo alto entra dal basso all'inizio dell'ultimo tratto pieno, peggiore fra titoli e blocchi in vista; uscita: ms dal passaggio della linea dell'85 % all'inchiostro massimo sotto 0,1

| gesto | titolo o capitolo | progetto | giri | mediana ms | peggiore ms | dettaglio |
| --- | --- | --- | --- | --- | --- | --- |
| dall-alto | #servizi h2 | desktop-1440 | 3 | — | — | inchiostro minimo 1.00 |
| dall-alto | #servizi h2 | mobile-390 | 3 | — | — | inchiostro minimo 1.00 |
| ingresso | #contatti | desktop-1440 | 3 | 1700 | 1700 | titoli 1, blocchi 2 |
| ingresso | #contatti | mobile-390 | 3 | 1767 | 1767 | titoli 1, blocchi 2 |
| ingresso | #servizi | desktop-1440 | 3 | 1533 | 1533 | titoli 1, blocchi 1 |
| ingresso | #servizi | mobile-390 | 3 | 1733 | 1750 | titoli 1, blocchi 1 |
| rientro-dall-alto | #servizi h2 | desktop-1440 | 3 | — | — | inchiostro minimo 1.00 |
| rientro-dall-alto | #servizi h2 | mobile-390 | 3 | — | — | inchiostro minimo 1.00 |
| uscita | #costi h2 | desktop-1440 | 3 | 1150 | 1150 | foglie 2 |
| uscita | #costi h2 | mobile-390 | 3 | 1217 | 1217 | foglie 2 |

| progetto | uscita del test, mediana ms | uscita della sonda, mediana ms | scarto ms |
| --- | --- | --- | --- |
| desktop-1440 | 1150 | 1150 | 0 |
| mobile-390 | 1217 | 1217 | 0 |

Decisione: Il test 2 e la sonda misurano la stessa uscita di #costi h2 (scarto delle mediane ≤ 50 ms, giro peggiore ≤ 1230 ms) e i test 1-3 sono verdi in tutti i giri.

## 04 · Motore dei reveal (commit 4)

2026-09-14 · base ded54b4+ più le modifiche del commit 4 · build di produzione sulla 3178, chromium headless, motion attivo, consenso accettato, sipario saltato, scroll istantaneo

| rotta | viewport | blocco | ingresso ms (ctn e still 1.050-1.450; delay 120: 1.170-1.570) | salita ms (280-420; delay 120: 400-540) | uscita ms (≤ 600) | uscita in vista | min rientrando dall'alto (≥ 0,99) | identità nell'ingresso (still: sì) | pointer-events da nascosto (none) | CLS (≤ 0,001) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /vendi | 1440×900 | ctn | 1166 | 316 | 400 | sì | 1 | no | none | 0 |
| / | 1440×900 | ctn | 1166 | 316 | 398 | sì | 1 | no | none | 0 |
| /vendi | 1440×900 | ctn delay 120 | 1282 | 432 | 400 | sì | 1 | no | none | 0 |
| /vendi | 1440×900 | still | 1166 | 316 | 400 | sì | 1 | sì | none | 0 |
| /vendi | 390×664 | ctn | 1166 | 316 | 400 | sì | 1 | no | none | 0 |
| / | 390×664 | ctn | 1166 | 316 | 400 | sì | 1 | no | none | 0 |
| /vendi | 390×664 | ctn delay 120 | 1282 | 435 | 400 | sì | 1 | no | none | 0 |
| /vendi | 390×664 | still | 1166 | 317 | 399 | sì | 1 | sì | none | 0 |

| scheda | viewport | gruppi (0) | membri armati (0) | tooltip social (0s) | .reveal congelati (> 0) | durata .reveal (0.9s, 0.9s) |
| --- | --- | --- | --- | --- | --- | --- |
| /case/2082 | 1440×900 | 0 | 0 | 0s | 7 | 0.9s, 0.9s |
| /case/2082 | 390×664 | 0 | 0 | 0s | 7 | 0.9s, 0.9s |

| rotta a 390 CPU×4 | gruppi | passate d'armamento | letture ms | scritture ms | sweep ms (≤ 16) | long task fino a 3 s | long task più lungo ms | long task attorno all'armamento ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /vendi | 54 | 1 | 3.5 | 21.1 | 3.6 | 2 | 113 | 113 |
| / | 64 | 1 | 2.7 | 21.3 | 3.2 | 2 | 254 | 254 |

Criteri: letture + scritture della passata più lunga ≤ 50 ms, cioè il motore da solo non fa un long task.
Tutti i numeri nel campo atteso.

## 04 · Motore dei reveal (commit 4)

2026-09-14 · base 7d53011+ più le modifiche del commit 4 · build di produzione sulla 3178, chromium headless, motion attivo, consenso accettato, sipario saltato, scroll istantaneo

| rotta | viewport | blocco | ingresso ms (ctn e still 1.050-1.450; delay 120: 1.170-1.570) | salita ms (280-420; delay 120: 400-540) | uscita ms (≤ 600) | uscita in vista | min rientrando dall'alto (≥ 0,99) | identità nell'ingresso (still: sì) | pointer-events da nascosto (none) | CLS (≤ 0,001) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /vendi | 1440×900 | ctn | 1167 | 317 | 400 | sì | 1 | no | none | 0 |
| / | 1440×900 | ctn | 1165 | 315 | 400 | sì | 1 | no | none | 0 |
| /vendi | 1440×900 | ctn delay 120 | 1282 | 433 | 400 | sì | 1 | no | none | 0 |
| /vendi | 1440×900 | still | 1166 | 316 | 400 | sì | 1 | sì | none | 0 |
| /vendi | 390×664 | ctn | 1167 | 317 | 402 | sì | 1 | no | none | 0 |
| / | 390×664 | ctn | 1167 | 317 | 399 | sì | 1 | no | none | 0 |
| /vendi | 390×664 | ctn delay 120 | 1283 | 433 | 400 | sì | 1 | no | none | 0 |
| /vendi | 390×664 | still | 1166 | 317 | 399 | sì | 1 | sì | none | 0 |

| scheda | viewport | gruppi (0) | membri armati (0) | tooltip social (0s) | .reveal congelati (> 0) | durata .reveal (0.9s, 0.9s) |
| --- | --- | --- | --- | --- | --- | --- |
| /case/attico-travi-tradate-centro | 1440×900 | 0 | 0 | 0s | 4 | 0.9s, 0.9s |
| /case/attico-travi-tradate-centro | 390×664 | 0 | 0 | 0s | 4 | 0.9s, 0.9s |

| rotta a 390 CPU×4 | gruppi | passate d'armamento | letture ms | scritture ms | sweep ms (≤ 16) | long task fino a 3 s | long task più lungo ms | long task attorno all'armamento ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /vendi | 54 | 1 | 3.6 | 21.4 | 4.3 | 2 | 118 | 118 |
| / | 64 | 1 | 2.7 | 23 | 4.6 | 3 | 259 | 259 |

Criteri: letture + scritture della passata più lunga ≤ 50 ms, cioè il motore da solo non fa un long task.
Tutti i numeri nel campo atteso.

Decisione: misura rifatta nel giro di correzione 1 del commit 4, sul build con il refresh di D39 a scroll fermo (rimandato durante l'arrivo al frammento e a scroll in corso) e con D40 (sweep() nasconde senza animare i gruppi shown finiti interamente sotto il viewport): i numeri restano nel campo, come nella sezione sopra; il salto verso l'alto lo presidia e2e/reveal-engine.spec.ts.

## 05-titoli · 2026-09-14 · 17a2003+

Titolo di #servizi sulla home:

| progetto | caratteri | ingresso ms | tetto ms | uscita ms (≤ 1300) | dall'alto (≥ 0,99) |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | 62 | 2370 | 2950 | 815 | 1 |
| mobile-390 | 62 | 2369 | 2950 | 815 | 1 |

Accento di Method su /metodo:

| progetto | caratteri | m41 armato px | atteso px (±2) | d armato (< 0,05) | ingresso ms | tetto ms | uscita ms (≤ 1300) | traboccamento px (≤ 0) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| desktop-1440 | 7 | 144 | 144 | 0 | 1858 | 2350 | 712 | 0 |
| mobile-390 | 7 | 39 | 39 | 0 | 1775 | 2350 | 711 | 0 |

[data-c] sulla home a 1440 dopo una passata: 847 (base del test 8, e2e/baseline/data-c.json).

## 05-titoli · 2026-09-14 · e4bf40d+

Titolo di #servizi sulla home:

| progetto | caratteri | ingresso ms | tetto ms | uscita ms (≤ 1300) | dall'alto (≥ 0,99) |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | 62 | 2376 | 2950 | 808 | 1 |
| mobile-390 | 62 | 2378 | 2950 | 814 | 1 |

Accento di Method su /metodo:

| progetto | caratteri | m41 armato px | atteso px (±2) | d armato (< 0,05) | ingresso ms | tetto ms | uscita ms (≤ 1300) | traboccamento px (≤ 0) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| desktop-1440 | 7 | 144 | 144 | 0 | 1857 | 2350 | 710 | 0 |
| mobile-390 | 7 | 39 | 39 | 0 | 1776 | 2350 | 711 | 0 |

[data-c] sulla home a 1440 dopo una passata: 847 (base del test 8, e2e/baseline/data-c.json).

kern-table.json: 43.170 byte (tetto 65.536, D36). Estremi per chiave (D42):

| chiave | coppie | min em | max em | tetto em |
| --- | --- | --- | --- | --- |
| display-400 | 929 | -0.133 | 0.087 | ±0.2 |
| display-500 | 1112 | -0.132 | 0.094 | ±0.2 |
| brand-800 | 1169 | -0.1 | 0.19 | ±0.2 |
| script-400 | 307 | -0.244 | 0.195 | ±0.25 |

Decisione: misura rifatta nel giro di correzione 1 della verifica del commit 5, sul build in cui SplitChars divide le parole col trattino dopo il trattino (una `span.dt-w` per pezzo, unite da `<wbr/>`, spec §2.3). `e4bf40d` nell'intestazione è il commit 5 prima della correzione, poi riscritto con amend. I numeri restano nel criterio, i `[data-c]` restano 847 (`e2e/baseline/data-c.json` non cambia) e la sezione porta il peso di `kern-table.json` che la riga di D36 in spec §1.3 cita.

## 06-h1-dipinti · 2026-09-14 · 03d6d06+

| progetto | rotta | LCP ms (mediana) | elemento LCP | area LCP px² | area lead px² | area paragrafo banner px² | base ms | tetto ms | lampi su 3 | pieno − armato ms (≤ 2850) | registrazione → armo ms (/vendi, ≤ 17) | armo dopo la prima LCP (senza foto) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| desktop-1440 | /vendi | 172 | IMG.object-cover | 419040 | 93915 | 28941 | 104 | 204 | 0 | 954 | 0 | — |
| desktop-1440 | /contatti | 124 | H1.mt-6.max-w-[16ch].font-display | 100492 | 70757 | 28941 | 140 | 240 | 0 | 1004 | — | sì |
| desktop-1440 | /case-vendute | 116 | P.lead.mt-8 | 85725 | 94342 | 28941 | 108 | 208 | 0 | 1009 | — | sì |
| desktop-1440 | /valutazione-immobile-tradate | 128 | P.mt-7.max-w-2xl.text-[1.05rem] | 48488 | 54999 | 28941 | 128 | 228 | 0 | 1007 | — | sì |
| desktop-1440 | / | 144 | IMG.object-cover | 777600 | 8370 | 28941 | 152 | 252 | 0 | — | — | — |
| mobile-390 | /vendi | 116 | IMG.object-cover | 120845 | 61304 | 25896 | 108 | 208 | 0 | 969 | 0 | — |
| mobile-390 | /contatti | 124 | P.lead.mt-8 | 49907 | 51087 | 25896 | 112 | 212 | 0 | 1010 | — | sì |
| mobile-390 | /case-vendute | 104 | P.lead.mt-8 | 60723 | 61304 | 25896 | 80 | 180 | 0 | 1003 | — | sì |
| mobile-390 | /valutazione-immobile-tradate | 128 | P.mt-7.max-w-2xl.text-[1.05rem] | 44850 | 47742 | 25896 | 120 | 220 | 0 | 1013 | — | sì |
| mobile-390 | / | 132 | IMG.object-cover | 155220 | 14599 | 25896 | 116 | 216 | 0 | — | — | — |

Decisione: misura rifatta nel giro di correzione 2 di 6-6, sullo stesso build dello Step 34. Lo script riconosce il pannello dei cookie risalendo a `.dt-consent` dall'elemento LCP, ne misura il paragrafo `#cookie-consent-desc` e fa scattare l'uscita 3 sulla sola ultima voce LCP nel pannello, senza confronto col rettangolo del lead (D48). Il cancello è provato con lo script vero e tutto il body nascosto tranne il pannello: uscita 3. Qui nessuna ultima voce LCP sul pannello, uscita 0.

## 06b-lead · 2026-09-14 · 03d6d06+

| progetto | righe | scarto dalla posa 110 % px (≤ 2) | ingresso ms | tetto ms | uscita ms (≤ 1300) |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | 5 | 0.4 | 1536 | 2150 | 606 |
| mobile-390 | 6 | 0.1 | 1629 | 2250 | 662 |

## 06-h1-dipinti · 2026-09-14 · 03d6d06+

| progetto | rotta | LCP ms (mediana) | elemento LCP | area LCP px² | area lead px² | area paragrafo banner px² | base ms | tetto ms | lampi su 3 | pieno − armato ms (≤ 2850) | registrazione → armo ms (/vendi, ≤ 17) | armo dopo la prima LCP (senza foto) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| desktop-1440 | /vendi | 160 | IMG.object-cover | 419040 | 93915 | 28941 | 104 | 204 | 0 | 971 | 0 | — |
| desktop-1440 | /contatti | 120 | H1.mt-6.max-w-[16ch].font-display | 100492 | 70757 | 28941 | 140 | 240 | 0 | 1005 | — | sì |
| desktop-1440 | /case-vendute | 112 | P.lead.mt-8 | 85725 | 94342 | 28941 | 108 | 208 | 0 | 1006 | — | sì |
| desktop-1440 | /valutazione-immobile-tradate | 124 | P.mt-7.max-w-2xl.text-[1.05rem] | 48488 | 54999 | 28941 | 128 | 228 | 0 | 1004 | — | sì |
| desktop-1440 | / | 176 | IMG.object-cover | 777600 | 8370 | 28941 | 152 | 252 | 0 | — | — | — |
| mobile-390 | /vendi | 100 | IMG.object-cover | 120845 | 61304 | 25896 | 108 | 208 | 0 | 957 | 0 | — |
| mobile-390 | /contatti | 120 | P.lead.mt-8 | 49907 | 51087 | 25896 | 112 | 212 | 0 | 1003 | — | sì |
| mobile-390 | /case-vendute | 88 | P.lead.mt-8 | 60723 | 61304 | 25896 | 80 | 180 | 0 | 990 | — | sì |
| mobile-390 | /valutazione-immobile-tradate | 124 | P.mt-7.max-w-2xl.text-[1.05rem] | 44850 | 47742 | 25896 | 120 | 220 | 0 | 999 | — | sì |
| mobile-390 | / | 140 | IMG.object-cover | 155220 | 14599 | 25896 | 116 | 216 | 0 | — | — | — |

Decisione: misura della verifica completa del commit 6, sul build del suo albero con le variabili della suite (`03d6d06+` è il commit 5 con l'albero del 6, prima del commit), dopo text-motion e gli e2e di controllo verdi. Uscita 0: LCP mediano entro base + 100 ms in tutte e dieci le righe (margine più stretto desktop /vendi, 160 su 204), 0 lampi su 3, pieno − armato 957-1006 ms, /vendi registrazione → armo 0 ms, armamento dopo la prima voce LCP sulle tre teste senza foto, nessuna ultima voce LCP sul pannello dei cookie (D48). I numeri restano nel campo della sezione sopra.

## 06b-lead · 2026-09-14 · 03d6d06+

| progetto | righe | scarto dalla posa 110 % px (≤ 2) | ingresso ms | tetto ms | uscita ms (≤ 1300) |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | 5 | 0.4 | 1539 | 2150 | 623 |
| mobile-390 | 6 | 0.1 | 1620 | 2250 | 662 |

Decisione: misura della verifica completa del commit 6, sullo stesso build di 06-h1-dipinti qui sopra. Uscita 0: righe spezzate nei due progetti, posa armata a yPercent 110 entro 0,4 px, ingresso entro il tetto stampato, uscita ≤ 1.300 ms; i numeri restano nel campo della sezione sopra.

## 06-h1-dipinti · 2026-09-16 · f13fbce+

| progetto | rotta | LCP ms (mediana) | elemento LCP | area LCP px² | area lead px² | area paragrafo banner px² | base ms | tetto ms | lampi su 3 | pieno − armato ms (≤ 2850) | registrazione → armo ms (/vendi, ≤ 17) | armo dopo la prima LCP (senza foto) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| desktop-1440 | /vendi | 108 | IMG.object-cover | 419040 | 93915 | 28941 | 104 | 204 | 0 | 960 | 0 | — |
| desktop-1440 | /contatti | 124 | H1.mt-6.max-w-[16ch].font-display | 100492 | 70757 | 28941 | 140 | 240 | 0 | 998 | — | sì |
| desktop-1440 | /case-vendute | 92 | P.lead.mt-8 | 85725 | 94342 | 28941 | 108 | 208 | 0 | 1001 | — | sì |
| desktop-1440 | /valutazione-immobile-tradate | 120 | P.mt-7.max-w-2xl.text-[1.05rem] | 48488 | 54999 | 28941 | 128 | 228 | 0 | 998 | — | sì |
| desktop-1440 | / | 140 | IMG.object-cover | 777600 | 8370 | 28941 | 152 | 252 | 0 | — | — | — |
| mobile-390 | /vendi | 112 | IMG.object-cover | 120845 | 61304 | 25896 | 108 | 208 | 0 | 960 | 0 | — |
| mobile-390 | /contatti | 120 | P.lead.mt-8 | 49907 | 51087 | 25896 | 112 | 212 | 0 | 1010 | — | sì |
| mobile-390 | /case-vendute | 80 | P.lead.mt-8 | 60723 | 61304 | 25896 | 80 | 180 | 0 | 1013 | — | sì |
| mobile-390 | /valutazione-immobile-tradate | 128 | P.mt-7.max-w-2xl.text-[1.05rem] | 44850 | 47742 | 25896 | 120 | 220 | 0 | 1008 | — | sì |
| mobile-390 | / | 124 | IMG.object-cover | 155220 | 14599 | 25896 | 116 | 216 | 0 | — | — | — |

Decisione: misura del giro di correzione 1 della verifica del commit 6, sul build del giro di controllo (albero di f13fbce con D50, colonna del lead di PageHero gruppo annidato, e D51, delimitatore delle parole in Lead), con le variabili della suite, dopo text-motion e gli e2e di controllo verdi. Uscita 0: LCP mediano entro base + 100 ms in tutte e dieci le righe (margine più stretto 92 ms: mobile /contatti, /valutazione-immobile-tradate e /), 0 lampi su 3, pieno − armato 960-1013 ms, /vendi registrazione → armo 0 ms, armamento dopo la prima voce LCP sulle tre teste senza foto, nessuna ultima voce LCP sul pannello dei cookie (D48). Le aree restano quelle delle sezioni sopra. `f13fbce+` è il commit 6 con l'albero corretto, prima dell'amend che lo riscrive.

## 06b-lead · 2026-09-16 · f13fbce+

| progetto | righe | scarto dalla posa 110 % px (≤ 2) | ingresso ms | tetto ms | uscita ms (≤ 1300) |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | 5 | 0.4 | 1539 | 2150 | 607 |
| mobile-390 | 6 | 0.1 | 1624 | 2250 | 662 |

Decisione: misura del giro di correzione 1 della verifica del commit 6, sullo stesso build di 06-h1-dipinti qui sopra, col delimitatore delle parole di Lead (D51). Uscita 0: righe spezzate nei due progetti (5 e 6, come prima: il lead di Posizionamento non ha parole col trattino), posa armata a yPercent 110 entro 0,4 px, ingresso entro il tetto stampato, uscita ≤ 1.300 ms. Le righe naturali dei lead con le parole col trattino le prova il test 7d di text-motion.spec.ts (D51).

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-17, ee0f0be+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | recensioni storia team | recensioni storia team | 3 | 29772 | 0 |  | ok |
| 1024×768 | / | recensioni storia team | recensioni storia team | 3 | 25820 | 0 |  | ok |
| 1920×1080 | / | recensioni storia team | recensioni storia team | 3 | 33374 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 20933 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 21622 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 27710 | 0 |  | ok |
| 1440×900 | /vendi | nessuno | nessuno | 0 | 16310 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 20479) | ok |

Decisione: misura della verifica completa del commit 7, sul build lasciato dagli e2e di 7f (Step 30b: codice del commit a meno dei commenti di `mq.ts`), prima degli e2e di Step 33. Uscita 0: sopra la soglia (1440×900, 1024×768, 1920×1080) accesi `recensioni storia team` e 3 sticky in #main, cioè i tre schermi; sotto (1280×600, 1440×600, 390×664) nessun corridoio e nessuno sticky nuovo (l'unico a 390 è la testata mobile di Header.tsx, `sticky top-0 lg:relative`, preesistente); /vendi nessuno fino al commit 18; overflowX 0 ovunque; ricarica a metà di #servizi a 0,6 px dal bordo atteso (bordo di prima − 120) con scrollY 20.479. Regola 2 di Step 32: nessuna riga precedente porta l'altezza della home, quindi il confronto è con spec §4 «Oggi»: 29.772 px a 1440×900 (29.692, +80 px, 0,27 %) e 25.820 px a 1024×768 (25.740, +80 px, 0,31 %), entro l'1 %. Regola 3: a 600 px d'altezza i nastri tornano in colonna, 20.933 px (1280×600) e 21.622 px (1440×600), registrati e basta.

### 08 · tuffo dell'hero e foglio di Posizionamento (2026-09-17, commit 058fe26+, 1440×900)

| p | H | stickTop | start | end | bandH | tImg | tPrime | corsa | margineFoglio | scala | yFoto | yTesto | fondoFotoMenoBanda | segnoMenoBanda | foglioTop | foglioAlCentro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| geometria | 984 | -84 | 175 | 1975 | 540 | 1019 | 815 | 1800 | -900 |  |  |  |  |  |  |  |
| 0 |  |  |  |  |  |  |  |  |  | 1 | 0 | 0 | 479 | 336 | 1800 | 0 |
| 0.3 |  |  |  |  |  |  |  |  |  | 1 | -221 | -384 | 258 | 115 | 1260 | 0 |
| 0.5 |  |  |  |  |  |  |  |  |  | 1.002 | -271 | -471 | 209 | 66 | 900 | 0 |
| 0.6 |  |  |  |  |  |  |  |  |  | 1.016 | -275 | -479 | 208 | 63 | 720 | 0 |
| 0.75 |  |  |  |  |  |  |  |  |  | 1.117 | -275 | -479 | 233 | 74 | 450 | 1 |
| 1 |  |  |  |  |  |  |  |  |  | 2 | -275 | -479 | 458 | 173 | 0 | 1 |

### 08 · tuffo dell'hero e foglio di Posizionamento (2026-09-17, commit 058fe26+, 1024×768)

| p | H | stickTop | start | end | bandH | tImg | tPrime | corsa | margineFoglio | scala | yFoto | yTesto | fondoFotoMenoBanda | segnoMenoBanda | foglioTop | foglioAlCentro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| geometria | 854 | -86 | 164 | 1700 | 461 | 724 | 579 | 1536 | -768 |  |  |  |  |  |  |  |
| 0 |  |  |  |  |  |  |  |  |  | 1 | 0 | 0 | 264 | 162 | 1536 | 0 |
| 0.3 |  |  |  |  |  |  |  |  |  | 1 | -95 | -306 | 169 | 67 | 1075 | 0 |
| 0.5 |  |  |  |  |  |  |  |  |  | 1.002 | -116 | -375 | 148 | 46 | 768 | 0 |
| 0.6 |  |  |  |  |  |  |  |  |  | 1.016 | -118 | -381 | 148 | 45 | 614 | 0 |
| 0.75 |  |  |  |  |  |  |  |  |  | 1.117 | -118 | -381 | 167 | 53 | 384 | 1 |
| 1 |  |  |  |  |  |  |  |  |  | 2 | -118 | -381 | 327 | 124 | 0 | 1 |

### 08 · tuffo dell'hero e foglio di Posizionamento (2026-09-17, commit 058fe26+, 1920×1080)

| p | H | stickTop | start | end | bandH | tImg | tPrime | corsa | margineFoglio | scala | yFoto | yTesto | fondoFotoMenoBanda | segnoMenoBanda | foglioTop | foglioAlCentro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| geometria | 1114 | -34 | 139 | 2299 | 648 | 1358 | 1086 | 2160 | -1080 |  |  |  |  |  |  |  |
| 0 |  |  |  |  |  |  |  |  |  | 1 | 0 | 0 | 710 | 520 | 2160 | 0 |
| 0.3 |  |  |  |  |  |  |  |  |  | 1 | -352 | -570 | 359 | 168 | 1512 | 0 |
| 0.5 |  |  |  |  |  |  |  |  |  | 1.002 | -431 | -698 | 280 | 89 | 1080 | 0 |
| 0.6 |  |  |  |  |  |  |  |  |  | 1.016 | -438 | -710 | 277 | 84 | 864 | 0 |
| 0.75 |  |  |  |  |  |  |  |  |  | 1.117 | -438 | -710 | 312 | 99 | 540 | 1 |
| 1 |  |  |  |  |  |  |  |  |  | 2 | -438 | -710 | 612 | 231 | 0 | 1 |

### 08 · tuffo dell'hero e foglio di Posizionamento (2026-09-17, commit 058fe26+, 1280×720)

| p | H | stickTop | start | end | bandH | tImg | tPrime | corsa | margineFoglio | scala | yFoto | yTesto | fondoFotoMenoBanda | segnoMenoBanda | foglioTop | foglioAlCentro |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| geometria | 834 | -114 | 187 | 1627 | 432 | 906 | 725 | 1440 | -720 |  |  |  |  |  |  |  |
| 0 |  |  |  |  |  |  |  |  |  | 1 | 0 | 0 | 474 | 347 | 1440 | 0 |
| 0.3 |  |  |  |  |  |  |  |  |  | 1 | -235 | -380 | 239 | 112 | 1008 | 0 |
| 0.5 |  |  |  |  |  |  |  |  |  | 1.002 | -288 | -466 | 186 | 59 | 720 | 0 |
| 0.6 |  |  |  |  |  |  |  |  |  | 1.016 | -293 | -474 | 184 | 56 | 576 | 0 |
| 0.75 |  |  |  |  |  |  |  |  |  | 1.117 | -293 | -474 | 207 | 66 | 360 | 1 |
| 1 |  |  |  |  |  |  |  |  |  | 2 | -293 | -474 | 407 | 154 | 0 | 1 |

### 08 · hero sotto il gate, ramo 768-1023 (2026-09-17, commit 058fe26+, 1023×768)

| p | on | bandH | tImg | salita | fine | scala | yFoto | liftMin | liftMax | yBlocco | fondoFotoMenoBanda | segnoMenoBanda |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| geometria | 0 | 461 | 724 | 118.2 | 461 |  |  |  |  |  |  |  |
| 0 |  |  |  |  |  | 1 | 0 | 0 | 0 | 0 | 263 | 162 |
| 0.3 |  |  |  |  |  | 1.001 | -30.2 | -47.2 | -47.2 | 0 | 233 | 132 |
| 0.6 |  |  |  |  |  | 1.016 | -52.3 | -81.7 | -81.7 | 0 | 213 | 111 |
| 1 |  |  |  |  |  | 1.12 | -59.1 | -92.2 | -92.2 | 0 | 226 | 112 |

### 08 · hero sotto il gate, ramo sotto 768 (2026-09-17, commit 058fe26+, 390×664)

| p | on | bandH | tImg | salita | fine | scala | yFoto | liftMin | liftMax | yBlocco | fondoFotoMenoBanda | segnoMenoBanda |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| geometria | 0 | 398 | 398 | 0 | 398 |  |  |  |  |  |  |  |
| 0 |  |  |  |  |  | 1 | 0 | 0 | 0 | 0 | 0 | -56 |
| 0.3 |  |  |  |  |  | 1 | 0 | -27.1 | -27.1 | 0 | 0 | -56 |
| 0.6 |  |  |  |  |  | 1 | 0 | -47 | -47 | 0 | 0 | -56 |
| 1 |  |  |  |  |  | 1 | 0 | -53.1 | -53.1 | 0 | 0 | -56 |

### 08 · parole di Posizionamento (it) (2026-09-17, commit 058fe26+, 1440×900)

| p | riga | parole | slack | xUltima | atteso | fuori |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 3 | 119 | 0 | 0 | -118.8 |
| 0 | 2 | 2 | 183 | 0 | 0 | -182.8 |
| 0 | 3 | 1 | 266 | 0 | 0 | -266.5 |
| 0 | 4 | 2 | 32 | 0 | 0 | -31.8 |
| 0.5 | 1 | 3 | 119 | 59.5 | 59.4 | -59.3 |
| 0.5 | 2 | 2 | 183 | 72.1 | 72 | -110.7 |
| 0.5 | 3 | 1 | 266 | 0 | 0 | -266.5 |
| 0.5 | 4 | 2 | 32 | 15.9 | 15.9 | -15.9 |
| 1 | 1 | 3 | 119 | 118.8 | 118.8 | 0 |
| 1 | 2 | 2 | 183 | 144 | 144 | -38.8 |
| 1 | 3 | 1 | 266 | 0 | 0 | -266.5 |
| 1 | 4 | 2 | 32 | 31.8 | 31.8 | 0 |

### 08 · parole di Posizionamento (de) (2026-09-17, commit 058fe26+, 1440×900)

| p | riga | parole | slack | xUltima | atteso | fuori |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 2 | 10 | 0 | 0 | -10.5 |
| 0 | 2 | 2 | 92 | 0 | 0 | -92 |
| 0 | 3 | 2 | 48 | 0 | 0 | -47.9 |
| 0 | 4 | 2 | 127 | 0 | 0 | -127.5 |
| 0.5 | 1 | 2 | 10 | 5.2 | 5.2 | -5.2 |
| 0.5 | 2 | 2 | 92 | 46.1 | 46 | -46 |
| 0.5 | 3 | 2 | 48 | 24 | 23.9 | -23.9 |
| 0.5 | 4 | 2 | 127 | 63.8 | 63.7 | -63.7 |
| 1 | 1 | 2 | 10 | 10.5 | 10.5 | 0 |
| 1 | 2 | 2 | 92 | 92 | 92 | 0 |
| 1 | 3 | 2 | 48 | 47.9 | 47.9 | 0 |
| 1 | 4 | 2 | 127 | 127.5 | 127.5 | 0 |

### 08 · parole di Posizionamento (it) (2026-09-17, commit 058fe26+, 390×664)

| p | riga | parole | slack | xUltima | atteso | fuori |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 3 | 123 | 0 | 0 | -123.2 |
| 0 | 2 | 3 | 22 | 0 | 0 | -21.7 |
| 0 | 3 | 2 | 68 | 0 | 0 | -67.6 |
| 0.5 | 1 | 3 | 123 | 39 | 39 | -84.2 |
| 0.5 | 2 | 3 | 22 | 10.8 | 10.8 | -10.8 |
| 0.5 | 3 | 2 | 68 | 19.5 | 19.5 | -48.1 |
| 1 | 1 | 3 | 123 | 78 | 78 | -45.2 |
| 1 | 2 | 3 | 22 | 21.7 | 21.7 | 0 |
| 1 | 3 | 2 | 68 | 39 | 39 | -28.6 |

### 08 · parole di Posizionamento (de) (2026-09-17, commit 058fe26+, 390×664)

| p | riga | parole | slack | xUltima | atteso | fuori |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 2 | 54 | 0 | 0 | -54 |
| 0 | 2 | 3 | 22 | 0 | 0 | -22.2 |
| 0 | 3 | 2 | 106 | 0 | 0 | -105.7 |
| 0 | 4 | 1 | 185 | 0 | 0 | -184.9 |
| 0.5 | 1 | 2 | 54 | 19.5 | 19.5 | -34.5 |
| 0.5 | 2 | 3 | 22 | 11.1 | 11.1 | -11.1 |
| 0.5 | 3 | 2 | 106 | 19.5 | 19.5 | -86.2 |
| 0.5 | 4 | 1 | 185 | 0 | 0 | -184.9 |
| 1 | 1 | 2 | 54 | 39 | 39 | -15 |
| 1 | 2 | 3 | 22 | 22.2 | 22.2 | 0 |
| 1 | 3 | 2 | 106 | 39 | 39 | -66.7 |
| 1 | 4 | 1 | 185 | 0 | 0 | -184.9 |

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-17, 058fe26+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | hero recensioni storia team | hero recensioni storia team | 4 | 30672 | 0 |  | ok |
| 1024×768 | / | hero recensioni storia team | hero recensioni storia team | 4 | 26588 | 0 |  | ok |
| 1920×1080 | / | hero recensioni storia team | hero recensioni storia team | 4 | 34454 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 20933 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 21622 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 27710 | 0 |  | ok |
| 1440×900 | /vendi | nessuno | nessuno | 0 | 16310 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 21379) | ok |

Decisione: misure del giro di correzione 1 del commit 8, sul build lasciato dagli e2e del giro (sette spec verdi sui tre progetti: 238 passati, 41 saltati), albero con D54 (`whenStill` in `gsap.ts`, cambio lingua a scroll fermo), D55 (bordo del lockup 0,35 s nell'e2e) e D56 (`load` fuori da `autoRefreshEvents`, refresh dopo load a scroll fermo); `058fe26+` è il commit 8 nella prima versione, con l'albero corretto, prima dell'amend che lo riscrive. Uscita 0 per `08-hero-dive.mjs` e `07-corridoi.mjs`, coi numeri della prima versione: tuffo a 1440×900 H 984, stickTop −84, aggancio 175 e sgancio 1975 (spec §3.2: 174/1974, +1 px), tImg 1019, t′ 815, corsa 1800, margine del foglio −900, foto −275 e testo −479 a p 0,6, scala 1,117 a p 0,75 e 2 a p 1 col foglio a 0 e al centro, segno a quattro punte sempre sotto il bordo (minimo +63 a 1440, +45 a 1024×768); 1023×768 scala 1,12, foto −59,1, lift −92,2 (−12svh); 390×664 foto ferma, lift −53,1 (−8svh); parole di Posizionamento sull'atteso entro 0,1 px e mai fuori dall'h2, in it e de. Corridoi `hero recensioni storia team` a 1440×900, 1024×768 e 1920×1080; altezza della home 30.672 px a 1440×900 (+900 sul commit 7, spec §4), 26.588 a 1024×768, 34.454 a 1920×1080; sotto il gate invariata (21.622 a 1440×600, 27.710 a 390×664); ricarica a metà di `#servizi` a 0,6 px. Deep link `/#contatti` a 1440×900 (sonda del report del giro, `next start` avviato dalla sonda e prima navigazione a server appena acceso): a freddo e a caldo l'arrivo si ferma a scrollY 23.960, cioè 3.415 px prima dell'ancora in `it` (difetto preesistente del commit 7: la pagina cresce dopo load) e 3.972 con cookie `de` (stessa quota, ancora tedesca 557 px più in basso), contro i 25.146-25.922 a freddo e i 19.856 in `de` prima di D54 e D56; le danze dei misuratori di ScrollTrigger partono a 1,9-2,3 s, ad arrivo finito.

### 09 · aggancio della ricerca e carosello di Voci (2026-09-17, commit 926e7f0+, 1440×900)

| gesto | bordoAlto | opacita | scala | innescoFermo | chiuseAlMontaggio | t | clip | rotaia | trabocco |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ricerca | 95 % | 0.02 | 0.75 | 1 |  |  |  |  |  |
| ricerca | 85 % | 0.668 | 0.915 | 1 |  |  |  |  |  |
| ricerca | 75 % | 0.869 | 0.967 | 1 |  |  |  |  |  |
| ricerca | 65 % | 0.969 | 0.992 | 1 |  |  |  |  |  |
| ricerca | 55 % | 1 | 1 | 1 |  |  |  |  |  |
| ricerca | 40 % | 1 | 1 | 1 |  |  |  |  |  |
| voci |  |  |  |  | 3 |  |  |  |  |
| voci |  |  |  |  |  | 3 | polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%) | translate(25%, 0%) | 0 |
| voci |  |  |  |  |  | 252 | polygon(92.5026% 0%, 100% 0%, 100.925% 100%, 115.628% 100%) | translate(23.1256%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 500 | polygon(35.807% 0%, 100% 0%, 100.358% 100%, 44.7588% 100%) | translate(8.9518%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 751 | polygon(4.8139% 0%, 100% 0%, 100.048% 100%, 6.0174% 100%) | translate(1.2035%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1001 | polygon(0.002% 0%, 100% 0%, 100% 100%, 0.0025% 100%) | translate(0.0005%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1350 | vuoto | vuoto | 0 |
| voci |  |  |  |  |  | 1601 | vuoto | vuoto | 0 |

### 09 · aggancio della ricerca e carosello di Voci (2026-09-17, commit 926e7f0+, 390×664)

| gesto | bordoAlto | opacita | scala | innescoFermo | chiuseAlMontaggio | t | clip | rotaia | trabocco |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ricerca | 95 % | 0.02 | 0.75 | 1 |  |  |  |  |  |
| ricerca | 85 % | 0.67 | 0.916 | 1 |  |  |  |  |  |
| ricerca | 75 % | 0.869 | 0.967 | 1 |  |  |  |  |  |
| ricerca | 65 % | 0.969 | 0.992 | 1 |  |  |  |  |  |
| ricerca | 55 % | 1 | 1 | 1 |  |  |  |  |  |
| ricerca | 40 % | 1 | 1 | 1 |  |  |  |  |  |
| voci |  |  |  |  | 1 |  |  |  |  |
| voci |  |  |  |  |  | 4 | polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%) | translate(25%, 0%) | 0 |
| voci |  |  |  |  |  | 252 | polygon(92.6543% 0%, 100% 0%, 100.927% 100%, 115.818% 100%) | translate(23.1636%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 502 | polygon(36.0917% 0%, 100% 0%, 100.361% 100%, 45.1146% 100%) | translate(9.0229%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 752 | polygon(4.8603% 0%, 100% 0%, 100.049% 100%, 6.0754% 100%) | translate(1.2151%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1004 | polygon(0.002% 0%, 100% 0%, 100% 100%, 0.0025% 100%) | translate(0.0005%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1353 | vuoto | vuoto | 0 |
| voci |  |  |  |  |  | 1602 | vuoto | vuoto | 0 |

Decisione: misure del commit 9 sul build lasciato dagli e2e del giro (sei spec verdi sui due progetti: 226 passati, 22 saltati), albero con D57 (con l'ancora su `#cerca` o più giù l'aggancio nasce a scroll fermo, `whenStill` di gsap.ts, aspettando il primo scroll se l'arrivo non è ancora partito, tetto 4 s) e senza `invalidateOnRefresh` sul tween del pannello; `926e7f0+` è l'albero del commit 9 prima del commit. Uscita 0 per `09-ricerca-voci.mjs`: pannello a 0,02/0,75 col bordo dell'innesco al 95 %, 0,668/0,915 all'85 %, 0,869/0,967 al 75 %, 0,969/0,992 al 65 %, 1/1 al 55 % e al 40 %, innesco `[data-dock]` senza transform a ogni quota, uguale a 1440×900 e 390×664; Voci: tessere chiuse al montaggio 3 a 1440 e 1 a 390, traboccamento 0 px in ogni fotogramma, clip in corsa a 252/500/751 ms (parallelogramma da 100 %/125 % verso 0 %, rotaia da translate 25 % a 0), nessuno stile inline da 1,35 s (limite 1,6 s). Sonde del giro (non committate): con `/#cerca`, prima di D57, lo ScrollTrigger nasceva a 265 ms con l'arrivo smooth in corso (y 42 → 2.850 a 1440 fino a ~1,0 s; y 79 → 1.796 a 390 fino a ~0,8 s) e dipingeva 0,02, poi 0,39 a 526 ms e 1 a ~0,7 s; a 1440, con lo scroll al 40 % prima dell'idratazione, il refresh rimandato a scroll fermo (t≈1,44 s) con `invalidateOnRefresh` riportava il pannello a 1 col bordo al 95 % (revert del refresh e nessun ridisegno a progresso 0 con `immediateRender: false`), da cui la rimozione; dopo le due cure il pannello con `/#cerca` non ha fotogrammi sotto 1 e al 95 % scende a 0,02 in 0,35 s.

### 09 · aggancio della ricerca e carosello di Voci (2026-09-17, commit 92fe6a2+, 1440×900)

| gesto | bordoAlto | opacita | scala | innescoFermo | chiuseAlMontaggio | t | clip | rotaia | trabocco |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ricerca | 95 % | 0.02 | 0.75 | 1 |  |  |  |  |  |
| ricerca | 85 % | 0.668 | 0.915 | 1 |  |  |  |  |  |
| ricerca | 75 % | 0.869 | 0.967 | 1 |  |  |  |  |  |
| ricerca | 65 % | 0.969 | 0.992 | 1 |  |  |  |  |  |
| ricerca | 55 % | 1 | 1 | 1 |  |  |  |  |  |
| ricerca | 40 % | 1 | 1 | 1 |  |  |  |  |  |
| voci |  |  |  |  | 3 |  |  |  |  |
| voci |  |  |  |  |  | 4 | polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%) | translate(25%, 0%) | 0 |
| voci |  |  |  |  |  | 252 | polygon(92.5784% 0%, 100% 0%, 100.926% 100%, 115.723% 100%) | translate(23.1446%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 502 | polygon(35.807% 0%, 100% 0%, 100.358% 100%, 44.7588% 100%) | translate(8.9518%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 752 | polygon(4.8139% 0%, 100% 0%, 100.048% 100%, 6.0174% 100%) | translate(1.2035%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1002 | polygon(0.002% 0%, 100% 0%, 100% 100%, 0.0025% 100%) | translate(0.0005%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1351 | vuoto | vuoto | 0 |
| voci |  |  |  |  |  | 1602 | vuoto | vuoto | 0 |

### 09 · aggancio della ricerca e carosello di Voci (2026-09-17, commit 92fe6a2+, 390×664)

| gesto | bordoAlto | opacita | scala | innescoFermo | chiuseAlMontaggio | t | clip | rotaia | trabocco |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ricerca | 95 % | 0.02 | 0.75 | 1 |  |  |  |  |  |
| ricerca | 85 % | 0.67 | 0.916 | 1 |  |  |  |  |  |
| ricerca | 75 % | 0.869 | 0.967 | 1 |  |  |  |  |  |
| ricerca | 65 % | 0.969 | 0.992 | 1 |  |  |  |  |  |
| ricerca | 55 % | 1 | 1 | 1 |  |  |  |  |  |
| ricerca | 40 % | 1 | 1 | 1 |  |  |  |  |  |
| voci |  |  |  |  | 1 |  |  |  |  |
| voci |  |  |  |  |  | 13 | polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%) | translate(25%, 0%) | 0 |
| voci |  |  |  |  |  | 261 | polygon(93.7423% 0%, 100% 0%, 100.937% 100%, 117.178% 100%) | translate(23.4356%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 511 | polygon(40.5565% 0%, 100% 0%, 100.406% 100%, 50.6957% 100%) | translate(10.1391%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 761 | polygon(5.5879% 0%, 100% 0%, 100.056% 100%, 6.9849% 100%) | translate(1.397%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1011 | polygon(0.0366% 0%, 100% 0%, 100% 100%, 0.0457% 100%) | translate(0.0091%, 0%) translate3d(0px, 0px, 0px) | 0 |
| voci |  |  |  |  |  | 1361 | vuoto | vuoto | 0 |
| voci |  |  |  |  |  | 1610 | vuoto | vuoto | 0 |

### 10a nastro invariato (prima), 2026-09-17, c453359, 1440x900

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 1 | 0 | -38 | inset(0% 100% 0% 0%) |
| 0.25 | 1 | -293 | -19 | inset(0% 100% 0% 0%) |
| 0.5 | 1 | -908 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 1 | -1521 | 19 | inset(0%) |
| 1 | 1 | -1814 | 38 | inset(0%) |

### 10a nastro invariato (prima), 2026-09-17, c453359+, 1024x768

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 1 | 0 | -27 | inset(0% 100% 0% 0%) |
| 0.25 | 1 | -206 | -13 | inset(0% 100% 0% 0%) |
| 0.5 | 1 | -644 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 1 | -1084 | 13 | inset(0%) |
| 1 | 1 | -1290 | 27 | inset(0%) |

### 10a nastro invariato (prima), 2026-09-17, c453359+, 390x664

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | -3 | inset(0% 100% 0% 0%) |
| 0.25 | 0 | 0 | -2 | inset(0% 100% 0% 0%) |
| 0.5 | 0 | 0 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 0 | 0 | 2 | inset(0% 100% 0% 0%) |
| 1 | 0 | 0 | 3 | inset(0%) |

### 10a nastro invariato (dopo), 2026-09-17, c453359+, 1440x900

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 1 | 0 | -38 | inset(0% 100% 0% 0%) |
| 0.25 | 1 | -293 | -19 | inset(0% 100% 0% 0%) |
| 0.5 | 1 | -908 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 1 | -1521 | 19 | inset(0%) |
| 1 | 1 | -1814 | 38 | inset(0%) |

### 10a nastro invariato (dopo), 2026-09-17, c453359+, 1024x768

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 1 | 0 | -27 | inset(0% 100% 0% 0%) |
| 0.25 | 1 | -206 | -13 | inset(0% 100% 0% 0%) |
| 0.5 | 1 | -644 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 1 | -1084 | 13 | inset(0%) |
| 1 | 1 | -1290 | 27 | inset(0%) |

### 10a nastro invariato (dopo), 2026-09-17, c453359+, 390x664

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | -3 | inset(0% 100% 0% 0%) |
| 0.25 | 0 | 0 | -2 | inset(0% 100% 0% 0%) |
| 0.5 | 0 | 0 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 0 | 0 | 2 | inset(0% 100% 0% 0%) |
| 1 | 0 | 0 | 3 | inset(0%) |

### 10b pellicola del manifesto (prima), 2026-09-17, 8e4f4d4+, 1440x900

| passo | radice / innerHeight | ms | lettere | min opacità | max opacità | a 1ª lettera (cos rotateY) | m42 1ª lettera |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.8 | 0 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 300 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 600 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 1200 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 2500 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 3000 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 0 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 300 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 600 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 1200 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 2500 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 3000 | 69 | 0 | 0 | 0 | 28.8 |
| 3 | 0.6 | 0 | 69 | 0 | 0 | 0 | 28.8 |
| 3 | 0.6 | 300 | 69 | 0 | 0 | 0 | 28.8 |
| 3 | 0.6 | 600 | 69 | 0 | 0 | 0 | 28.8 |
| 3 | 0.6 | 1200 | 69 | 0 | 0 | 0 | 28.8 |
| 3 | 0.6 | 2500 | 69 | 0 | 0 | 0 | 28.8 |
| 3 | 0.6 | 3000 | 69 | 0 | 0 | 0 | 28.8 |
| 4 | 0.55 | 0 | 69 | 0 | 0 | 0 | 28.8 |
| 4 | 0.55 | 300 | 69 | 0 | 0 | 0 | 28.8 |
| 4 | 0.55 | 600 | 69 | 0 | 0 | 0 | 28.8 |
| 4 | 0.55 | 1200 | 69 | 0 | 0 | 0 | 28.8 |
| 4 | 0.55 | 2500 | 69 | 0 | 0 | 0 | 28.8 |
| 4 | 0.55 | 3000 | 69 | 0 | 0 | 0 | 28.8 |
| 5 | 0.45 | 0 | 69 | 0 | 0.154 | 0.239 | 24.4 |
| 5 | 0.45 | 300 | 69 | 0 | 0.751 | 0.924 | 7.2 |
| 5 | 0.45 | 600 | 69 | 0 | 0.952 | 0.997 | 1.4 |
| 5 | 0.45 | 1200 | 69 | 0 | 1 | 1 | 0 |
| 5 | 0.45 | 2500 | 69 | 0.889 | 1 | 1 | 0 |
| 5 | 0.45 | 3000 | 69 | 0.998 | 1 | 1 | 0 |
| 6 | 0.8 | 0 | 69 | 0.999 | 1 | 1 | 0 |
| 6 | 0.8 | 300 | 69 | 0.978 | 1 | 1 | 0 |
| 6 | 0.8 | 600 | 69 | 0.855 | 1 | 1 | 0 |
| 6 | 0.8 | 1200 | 69 | 0 | 1 | 1 | 0 |
| 6 | 0.8 | 2500 | 69 | 0 | 0.934 | 0.995 | 1.9 |
| 6 | 0.8 | 3000 | 69 | 0 | 0.294 | 0.446 | 20.3 |

### 10b pellicola del titolo delle stelle (prima), 2026-09-17, 8e4f4d4+, 1440x900

| passo | p | ms | lettere | min opacità | max opacità | identità | prodotto fino a #main | data-bg |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.66 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 600 | 26 | 0 | 0.729 | 0 | 0 | 0 |
| 1 | 0.66 | 1200 | 26 | 0 | 0.996 | 0 | 0 | 0 |
| 1 | 0.66 | 2500 | 26 | 0.999 | 1 | 1 | 0 | 0 |
| 1 | 0.66 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 1 | 0.66 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 3 | 0.78 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 3 | 0.78 | 600 | 26 | 1 | 1 | 1 | 0.868 | 0 |
| 3 | 0.78 | 1200 | 26 | 1 | 1 | 1 | 0.868 | 0 |
| 3 | 0.78 | 2500 | 26 | 1 | 1 | 1 | 0.868 | 0 |
| 3 | 0.78 | 4500 | 26 | 1 | 1 | 1 | 0.868 | 0 |
| 3 | 0.78 | 5000 | 26 | 1 | 1 | 1 | 0.868 | 0 |
| 4 | 0.66 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 7 | 1 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 7 | 1 | 600 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 1200 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 2500 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 4500 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 5000 | 26 | 1 | 1 | 1 | 1 | 0 |

### 10b pellicola del manifesto (prima), 2026-09-17, 8e4f4d4+, 1024x768

| passo | radice / innerHeight | ms | lettere | min opacità | max opacità | a 1ª lettera (cos rotateY) | m42 1ª lettera |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.8 | 0 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 300 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 600 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 1200 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 2500 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 3000 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 0 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 300 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 600 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 1200 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 2500 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 3000 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 0 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 300 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 600 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 1200 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 2500 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 3000 | 69 | 0 | 0 | 0 | 21.5 |
| 4 | 0.55 | 0 | 69 | 0 | 0 | 0 | 21.5 |
| 4 | 0.55 | 300 | 69 | 0 | 0 | 0 | 21.5 |
| 4 | 0.55 | 600 | 69 | 0 | 0 | 0 | 21.5 |
| 4 | 0.55 | 1200 | 69 | 0 | 0 | 0 | 21.5 |
| 4 | 0.55 | 2500 | 69 | 0 | 0 | 0 | 21.5 |
| 4 | 0.55 | 3000 | 69 | 0 | 0 | 0 | 21.5 |
| 5 | 0.45 | 0 | 69 | 0 | 0.16 | 0.249 | 18.1 |
| 5 | 0.45 | 300 | 69 | 0 | 0.752 | 0.925 | 5.3 |
| 5 | 0.45 | 600 | 69 | 0 | 0.952 | 0.997 | 1 |
| 5 | 0.45 | 1200 | 69 | 0 | 1 | 1 | 0 |
| 5 | 0.45 | 2500 | 69 | 0.889 | 1 | 1 | 0 |
| 5 | 0.45 | 3000 | 69 | 0.998 | 1 | 1 | 0 |
| 6 | 0.8 | 0 | 69 | 0.999 | 1 | 1 | 0 |
| 6 | 0.8 | 300 | 69 | 0.978 | 1 | 1 | 0 |
| 6 | 0.8 | 600 | 69 | 0.855 | 1 | 1 | 0 |
| 6 | 0.8 | 1200 | 69 | 0 | 1 | 1 | 0 |
| 6 | 0.8 | 2500 | 69 | 0 | 0.934 | 0.995 | 1.4 |
| 6 | 0.8 | 3000 | 69 | 0 | 0.297 | 0.449 | 15.1 |

### 10b pellicola del titolo delle stelle (prima), 2026-09-17, 8e4f4d4+, 1024x768

| passo | p | ms | lettere | min opacità | max opacità | identità | prodotto fino a #main | data-bg |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.66 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 600 | 26 | 0 | 0.73 | 0 | 0 | 0 |
| 1 | 0.66 | 1200 | 26 | 0 | 0.996 | 0 | 0 | 0 |
| 1 | 0.66 | 2500 | 26 | 0.999 | 1 | 1 | 0 | 0 |
| 1 | 0.66 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 1 | 0.66 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 3 | 0.78 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 3 | 0.78 | 600 | 26 | 1 | 1 | 1 | 0.869 | 0 |
| 3 | 0.78 | 1200 | 26 | 1 | 1 | 1 | 0.869 | 0 |
| 3 | 0.78 | 2500 | 26 | 1 | 1 | 1 | 0.869 | 0 |
| 3 | 0.78 | 4500 | 26 | 1 | 1 | 1 | 0.869 | 0 |
| 3 | 0.78 | 5000 | 26 | 1 | 1 | 1 | 0.869 | 0 |
| 4 | 0.66 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 5 | 0.04 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 600 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 1200 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 2500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 4500 | 26 | 1 | 1 | 1 | 0 | 0 |
| 6 | 0.46 | 5000 | 26 | 1 | 1 | 1 | 0 | 0 |
| 7 | 1 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 7 | 1 | 600 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 1200 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 2500 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 4500 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 5000 | 26 | 1 | 1 | 1 | 1 | 0 |

### 10b pellicola del manifesto (dopo), 2026-09-17, 8e4f4d4+, 1440x900

| passo | radice / innerHeight | ms | lettere | min opacità | max opacità | a 1ª lettera (cos rotateY) | m42 1ª lettera |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.8 | 0 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 300 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 600 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 1200 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 2500 | 69 | 0 | 0 | 0 | 28.8 |
| 1 | 0.8 | 3000 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 0 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 300 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 600 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 1200 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 2500 | 69 | 0 | 0 | 0 | 28.8 |
| 2 | 0.7 | 3000 | 69 | 0 | 0.585 | 0.795 | 11.9 |
| 3 | 0.6 | 0 | 69 | 0 | 0.805 | 0.953 | 5.6 |
| 3 | 0.6 | 300 | 69 | 0 | 0.966 | 0.999 | 1 |
| 3 | 0.6 | 600 | 69 | 0 | 0.998 | 1 | 0.1 |
| 3 | 0.6 | 1200 | 69 | 0.805 | 1 | 1 | 0 |
| 3 | 0.6 | 2500 | 69 | 1 | 1 | 1 | 0 |
| 3 | 0.6 | 3000 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 0 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 300 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 600 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 1200 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 2500 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 3000 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 0 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 300 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 600 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 1200 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 2500 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 3000 | 69 | 1 | 1 | 1 | 0 |
| 6 | 0.8 | 0 | 69 | 0.999 | 1 | 1 | 0 |
| 6 | 0.8 | 300 | 69 | 0.411 | 1 | 0.602 | -17 |
| 6 | 0.8 | 600 | 69 | 0 | 0.845 | 0 | -28.8 |
| 6 | 0.8 | 1200 | 69 | 0 | 0 | 0 | -28.8 |
| 6 | 0.8 | 2500 | 69 | 0 | 0 | 0 | -28.8 |
| 6 | 0.8 | 3000 | 69 | 0 | 0 | 0 | -28.8 |

### 10b pellicola del titolo delle stelle (dopo), 2026-09-17, 8e4f4d4+, 1440x900

| passo | p | ms | lettere | min opacità | max opacità | identità | prodotto fino a #main | data-bg |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.66 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 600 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 4500 | 26 | 0.904 | 1 | 0 | 0 | 0 |
| 1 | 0.66 | 5000 | 26 | 0.999 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 600 | 26 | 0 | 0.884 | 0 | 0 | 0 |
| 2 | 0.64 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 2 | 0.64 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 2 | 0.64 | 4500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 2 | 0.64 | 5000 | 26 | 0 | 0 | 0 | 0 | 0 |
| 3 | 0.78 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 3 | 0.78 | 600 | 26 | 0 | 0.64 | 0 | 0.555 | 0 |
| 3 | 0.78 | 1200 | 26 | 0 | 0.991 | 0 | 0.86 | 0 |
| 3 | 0.78 | 2500 | 26 | 0.997 | 1 | 1 | 0.868 | 0 |
| 3 | 0.78 | 4500 | 26 | 1 | 1 | 1 | 0.868 | 0 |
| 3 | 0.78 | 5000 | 26 | 1 | 1 | 1 | 0.868 | 0 |
| 4 | 0.66 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 600 | 26 | 0 | 0.951 | 0 | 0 | 0 |
| 4 | 0.66 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 4 | 0.66 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 4 | 0.66 | 4500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 4 | 0.66 | 5000 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 0 | 26 | 0 | 0 | 0 | 0 | 1 |
| 5 | 0.04 | 600 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 4500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 5000 | 26 | 0 | 0 | 0 | 0 | 0 |
| 6 | 0.46 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 6 | 0.46 | 600 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 1200 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 2500 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 4500 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 5000 | 26 | 0 | 0 | 0 | 0 | 1 |
| 7 | 1 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 600 | 26 | 0 | 0.664 | 0 | 0.664 | 0 |
| 7 | 1 | 1200 | 26 | 0 | 0.993 | 0 | 0.993 | 0 |
| 7 | 1 | 2500 | 26 | 0.998 | 1 | 1 | 1 | 0 |
| 7 | 1 | 4500 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 5000 | 26 | 1 | 1 | 1 | 1 | 0 |

### 10b pellicola del manifesto (dopo), 2026-09-17, 8e4f4d4+, 1024x768

| passo | radice / innerHeight | ms | lettere | min opacità | max opacità | a 1ª lettera (cos rotateY) | m42 1ª lettera |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.8 | 0 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 300 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 600 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 1200 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 2500 | 69 | 0 | 0 | 0 | 21.5 |
| 1 | 0.8 | 3000 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 0 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 300 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 600 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 1200 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 2500 | 69 | 0 | 0 | 0 | 21.5 |
| 2 | 0.7 | 3000 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 0 | 69 | 0 | 0 | 0 | 21.5 |
| 3 | 0.6 | 300 | 69 | 0 | 0.154 | 0.239 | 18.2 |
| 3 | 0.6 | 600 | 69 | 0 | 0.752 | 0.925 | 5.3 |
| 3 | 0.6 | 1200 | 69 | 0 | 0.997 | 1 | 0.1 |
| 3 | 0.6 | 2500 | 69 | 0.999 | 1 | 1 | 0 |
| 3 | 0.6 | 3000 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 0 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 300 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 600 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 1200 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 2500 | 69 | 1 | 1 | 1 | 0 |
| 4 | 0.55 | 3000 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 0 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 300 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 600 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 1200 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 2500 | 69 | 1 | 1 | 1 | 0 |
| 5 | 0.45 | 3000 | 69 | 1 | 1 | 1 | 0 |
| 6 | 0.8 | 0 | 69 | 0.999 | 1 | 1 | 0 |
| 6 | 0.8 | 300 | 69 | 0.418 | 1 | 0.61 | -12.5 |
| 6 | 0.8 | 600 | 69 | 0 | 0.848 | 0 | -21.5 |
| 6 | 0.8 | 1200 | 69 | 0 | 0 | 0 | -21.5 |
| 6 | 0.8 | 2500 | 69 | 0 | 0 | 0 | -21.5 |
| 6 | 0.8 | 3000 | 69 | 0 | 0 | 0 | -21.5 |

### 10b pellicola del titolo delle stelle (dopo), 2026-09-17, 8e4f4d4+, 1024x768

| passo | p | ms | lettere | min opacità | max opacità | identità | prodotto fino a #main | data-bg |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0.66 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 600 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 1 | 0.66 | 4500 | 26 | 0.893 | 1 | 0 | 0 | 0 |
| 1 | 0.66 | 5000 | 26 | 0.999 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 2 | 0.64 | 600 | 26 | 0 | 0.885 | 0 | 0 | 0 |
| 2 | 0.64 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 2 | 0.64 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 2 | 0.64 | 4500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 2 | 0.64 | 5000 | 26 | 0 | 0 | 0 | 0 | 0 |
| 3 | 0.78 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 3 | 0.78 | 600 | 26 | 0 | 0.638 | 0 | 0.555 | 0 |
| 3 | 0.78 | 1200 | 26 | 0 | 0.991 | 0 | 0.862 | 0 |
| 3 | 0.78 | 2500 | 26 | 0.997 | 1 | 1 | 0.869 | 0 |
| 3 | 0.78 | 4500 | 26 | 1 | 1 | 1 | 0.869 | 0 |
| 3 | 0.78 | 5000 | 26 | 1 | 1 | 1 | 0.869 | 0 |
| 4 | 0.66 | 0 | 26 | 1 | 1 | 1 | 0 | 0 |
| 4 | 0.66 | 600 | 26 | 0 | 0.953 | 0 | 0 | 0 |
| 4 | 0.66 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 4 | 0.66 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 4 | 0.66 | 4500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 4 | 0.66 | 5000 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 0 | 26 | 0 | 0 | 0 | 0 | 1 |
| 5 | 0.04 | 600 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 1200 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 2500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 4500 | 26 | 0 | 0 | 0 | 0 | 0 |
| 5 | 0.04 | 5000 | 26 | 0 | 0 | 0 | 0 | 0 |
| 6 | 0.46 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 6 | 0.46 | 600 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 1200 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 2500 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 4500 | 26 | 0 | 0 | 0 | 0 | 1 |
| 6 | 0.46 | 5000 | 26 | 0 | 0 | 0 | 0 | 1 |
| 7 | 1 | 0 | 26 | 0 | 0 | 0 | 0 | 0 |
| 7 | 1 | 600 | 26 | 0 | 0.666 | 0 | 0.666 | 0 |
| 7 | 1 | 1200 | 26 | 0 | 0.993 | 0 | 0.993 | 0 |
| 7 | 1 | 2500 | 26 | 0.998 | 1 | 1 | 1 | 0 |
| 7 | 1 | 4500 | 26 | 1 | 1 | 1 | 1 | 0 |
| 7 | 1 | 5000 | 26 | 1 | 1 | 1 | 1 | 0 |

Nota per Alberto (spec §9.3; corsia sistema §3.6): confrontare le tabelle «10b pellicola del manifesto (prima)» e «(dopo)». Prima: caratteri spezzati da SplitText nel client, innesco a «top 55%» della radice, 1,2 s dtOut, stagger 0,03 s, prospettiva 800. Dopo: SplitTitle col ruolo title di spec §2.2 (1,2 s dtOut, stagger 0,05 col tetto di D19), lettere piatte (A22), cue «top 70%» della radice, quello di `enter` in spec §2.4.

### 10a nastro invariato (dopo 10b), 2026-09-17, 8e4f4d4+, 1440x900

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 1 | 0 | -38 | inset(0% 100% 0% 0%) |
| 0.25 | 1 | -293 | -19 | inset(0% 100% 0% 0%) |
| 0.5 | 1 | -908 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 1 | -1521 | 19 | inset(0%) |
| 1 | 1 | -1814 | 38 | inset(0%) |

### 10a nastro invariato (dopo 10b), 2026-09-17, 8e4f4d4+, 1024x768

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 1 | 0 | -27 | inset(0% 100% 0% 0%) |
| 0.25 | 1 | -206 | -13 | inset(0% 100% 0% 0%) |
| 0.5 | 1 | -644 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 1 | -1084 | 13 | inset(0%) |
| 1 | 1 | -1290 | 27 | inset(0%) |

### 10a nastro invariato (dopo 10b), 2026-09-17, 8e4f4d4+, 390x664

| quota | data-on | track m41 | gradino m41 | clip sipario |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | -3 | inset(0% 100% 0% 0%) |
| 0.25 | 0 | 0 | -2 | inset(0% 100% 0% 0%) |
| 0.5 | 0 | 0 | 0 | inset(0% 100% 0% 0%) |
| 0.75 | 0 | 0 | 2 | inset(0% 100% 0% 0%) |
| 1 | 0 | 0 | 3 | inset(0%) |

### 11 paths, riga al progresso p del suo range, 2026-09-17, b2f09af+, 1440x900

| p | m42 col 1 | m42 col 2 | h col 1 | h col 2 | row-gap | testo − foto (px) |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | -60.5 | 47.9 | 605 | 479 | 86.4 | -433.6 |
| 0.1 | -39.2 | 31.1 | 605 | 479 | 86.4 | -471.7 |
| 0.25 | -12.2 | 9.7 | 605 | 479 | 86.4 | -520 |
| 0.4 | -1 | 0.8 | 605 | 479 | 86.4 | -540.2 |
| 0.5 | 0 | 0 | 605 | 479 | 86.4 | -542 |
| 0.6 | 1 | -0.8 | 605 | 479 | 86.4 | -543.7 |
| 0.75 | 12.2 | -9.7 | 605 | 479 | 86.4 | -563.9 |
| 0.9 | 39.1 | -31 | 605 | 479 | 86.4 | -612.1 |
| 1 | 60.5 | -47.9 | 605 | 479 | 86.4 | -650.4 |

### 11 paths, bordo alto della riga a una frazione del viewport, 2026-09-17, b2f09af+, 1440x900

| bordo alto / innerHeight | p del range | m42 col 1 | m42 col 2 | h riga |
| --- | --- | --- | --- | --- |
| 0.9 | 0.161 | -27 | 21.4 | 605 |
| 0.1 | 0.529 | 0.1 | 0 | 605 |

Δ m42 col 1 fra le due quote: 27.1 px. Lettura da riportare nella frase di §3.8 al commit 22 (spec §10).

### 11 paths, riga al progresso p del suo range, 2026-09-17, b2f09af+, 1024x768

| p | m42 col 1 | m42 col 2 | h col 1 | h col 2 | row-gap | testo − foto (px) |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | -43 | 54 | 430 | 540 | 61.4 | -388.2 |
| 0.1 | -27.9 | 35 | 430 | 540 | 61.4 | -422.3 |
| 0.25 | -8.7 | 11 | 430 | 540 | 61.4 | -465.5 |
| 0.4 | -0.7 | 0.9 | 430 | 540 | 61.4 | -483.7 |
| 0.5 | 0 | 0 | 430 | 540 | 61.4 | -485.2 |
| 0.6 | 0.7 | -0.9 | 430 | 540 | 61.4 | -486.7 |
| 0.75 | 8.7 | -11 | 430 | 540 | 61.4 | -504.9 |
| 0.9 | 27.9 | -35 | 430 | 540 | 61.4 | -548.1 |
| 1 | 43 | -54 | 430 | 540 | 61.4 | -582.2 |

### 11 paths, bordo alto della riga a una frazione del viewport, 2026-09-17, b2f09af+, 1024x768

| bordo alto / innerHeight | p del range | m42 col 1 | m42 col 2 | h riga |
| --- | --- | --- | --- | --- |
| 0.9 | 0.159 | -19.5 | 24.5 | 540 |
| 0.1 | 0.522 | 0 | 0 | 540 |

Δ m42 col 1 fra le due quote: 19.5 px. Lettura da riportare nella frase di §3.8 al commit 22 (spec §10).

### 11 paths, riga al progresso p del suo range, 2026-09-17, b2f09af+, 768x1024

| p | m42 col 1 | m42 col 2 | h col 1 | h col 2 | row-gap | testo − foto (px) |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | -22 | 22 | 645 | 364 | 46.1 | 90.1 |
| 0.1 | -14.3 | 14.3 | 645 | 364 | 46.1 | 74.6 |
| 0.25 | -4.5 | 4.5 | 645 | 364 | 46.1 | 55 |
| 0.4 | -0.4 | 0.4 | 645 | 364 | 46.1 | 46.8 |
| 0.5 | 0 | 0 | 645 | 364 | 46.1 | 46.1 |
| 0.6 | 0.3 | -0.3 | 645 | 364 | 46.1 | 45.4 |
| 0.75 | 4.5 | -4.5 | 645 | 364 | 46.1 | 37.2 |
| 0.9 | 14.3 | -14.3 | 645 | 364 | 46.1 | 17.6 |
| 1 | 22 | -22 | 645 | 364 | 46.1 | 2.1 |

### 11 paths, riga al progresso p del suo range, 2026-09-17, b2f09af+, 390x664

| p | m42 col 1 | m42 col 2 | h col 1 | h col 2 | row-gap | testo − foto (px) |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | -10 | 10 | 351 | 507 | 23.4 | 43.4 |
| 0.1 | -6.5 | 6.5 | 351 | 507 | 23.4 | 36.3 |
| 0.25 | -2 | 2 | 351 | 507 | 23.4 | 27.4 |
| 0.4 | -0.2 | 0.2 | 351 | 507 | 23.4 | 23.7 |
| 0.5 | 0 | 0 | 351 | 507 | 23.4 | 23.4 |
| 0.6 | 0.2 | -0.2 | 351 | 507 | 23.4 | 23.1 |
| 0.75 | 2 | -2 | 351 | 507 | 23.4 | 19.3 |
| 0.9 | 6.5 | -6.5 | 351 | 507 | 23.4 | 10.4 |
| 1 | 10 | -10 | 351 | 507 | 23.4 | 3.4 |

### 11 method /, 2026-09-17, b2f09af+, 1440x900

| momento | inset (t r b l) |
| --- | --- |
| scatola 1, scroll 0 | 0 100 0 0 |
| scatola 1, 400 ms | 0 100 0 0 |
| scatola 1, 3400 ms | 0 0 0 0 |
| scatola 1, uscita 600 ms | 0 0 0 100 |
| scatola 2, 400 ms | 0 0 0 100 |
| scatola 2, 3400 ms | 0 0 0 0 |

### 11 method /metodo, 2026-09-17, b2f09af+, 1440x900

| momento | inset (t r b l) |
| --- | --- |
| scatola 1, scroll 0 | 0 100 0 0 |
| scatola 1, 400 ms | 0 100 0 0 |
| scatola 1, 3400 ms | 0 0 0 0 |
| scatola 1, uscita 600 ms | 0 0 0 100 |
| scatola 2, 400 ms | 0 0 0 100 |
| scatola 2, 3400 ms | 0 0 0 0 |

### 11 method /, 2026-09-17, b2f09af+, 390x664

| momento | inset (t r b l) |
| --- | --- |
| scatola 1, scroll 0 | 0 100 0 0 |
| scatola 1, 400 ms | 0 100 0 0 |
| scatola 1, 3400 ms | 0 0 0 0 |
| scatola 1, uscita 600 ms | 0 0 0 100 |
| scatola 2, 400 ms | 0 0 0 100 |
| scatola 2, 3400 ms | 0 0 0 0 |

### 11 method /metodo, 2026-09-17, b2f09af+, 390x664

| momento | inset (t r b l) |
| --- | --- |
| scatola 1, scroll 0 | 0 100 0 0 |
| scatola 1, 400 ms | 0 100 0 0 |
| scatola 1, 3400 ms | 0 0 0 0 |
| scatola 1, uscita 600 ms | 0 0 0 100 |
| scatola 2, 400 ms | 0 0 0 100 |
| scatola 2, 3400 ms | 0 0 0 0 |

### 12 · media della villa · 2026-09-17 · 67da3df+

| file | byte |
| --- | --- |
| images/reali/villa-portico-tenda.jpg | 415910 |
| images/reali/villa-piscina-facciata.jpg | 523126 |
| images/reali/villa-fronte-acqua.jpg | 401868 |
| images/reali/villa-angolo-piscina.jpg | 520374 |
| images/reali/villa-lettini.jpg | 551907 |
| images/reali/villa-salotto-ombrellone.jpg | 432989 |
| images/reali/villa-vetrata-lanterne.jpg | 259822 |
| images/reali/villa-uliveto.jpg | 688025 |
| images/reali/territorio-quartiere.jpg | 763495 |
| media/congedo-drone-poster.jpg | 335386 |
| media/acqua-poster.jpg | 176854 |
| media/congedo-drone-1080.mp4 | 5894724 |
| media/congedo-drone-1080.webm | 5542745 |
| media/congedo-drone-720.mp4 | 2331464 |
| media/congedo-drone-720.webm | 2292300 |
| media/acqua-1080.mp4 | 2989769 |
| media/acqua-1080.webm | 2168165 |

Pannello del territorio, variante servita:

| passata | layout px | scala massima | DPR | w chiesta | naturalWidth | w / (layout × scala × DPR) |
| --- | --- | --- | --- | --- | --- | --- |
| 1440x900 reduce | 653 | 1 | 1 | 1024 | 792 | 1.57 |
| 390x664 reduce | 351 | 1 | 1 | 420 | 390 | 1.20 |
| 1440x900 motion, sipario | 700 | 1.15 | 1 | 1024 | 792 | 1.27 |

A24: il tratto 75-81 s è un'orbita sulla villa, non una ripresa larga; la villa del territorio è la stessa del Congedo.

Correzione del 17 settembre (giro di correzione 1 del commit 12): la riga di A24 qui sopra, la riga `territorio-quartiere.jpg` dei pesi e la tabella del pannello valgono per il file di quella misura, che non è più nel repo. Il fermo 1.950 non passa R1 e nessun altro candidato della finestra lo passa (tabella dei fermi qui sotto): per la regola del passo 12.8 il file non si produce, `HorizonStory` tiene `/media/hero-aerial.jpg` e A24 resta senza un fermo valido, da dire ad Alberto. Il pannello è rimisurato nella sezione «12 · media della villa» in coda al file.

Fermi del passo 12.8, guardati sui quattro quadranti a piena risoluzione (1728×972) e, per R4-T, sul foglio 1880-2020 e sull'anteprima del 1.950:

| nome | indice | quadranti | R1 | R2 | R3 | R4 | decimi R4-T |
| --- | --- | --- | --- | --- | --- | --- | --- |
| villa-uliveto | 660 | 4/4 | sì | sì | sì | sì (ulivi, prato, vialetto in pietra) | — |
| villa-salotto-ombrellone | 770 | 4/4 | sì | sì | sì | sì (divani sotto l'ombrellone, muro in pietra, siepe) | — |
| villa-facciata-lettini | 850 | 4/4 | NO: persona seduta al tavolo dietro la vetrata (q3, in alto a destra); c'è anche a 830, 840, 860 e 870 | sì | sì | sì | — · escluso |
| villa-vetrata-lanterne | 1185 | 4/4 | sì | sì (quadri senza scritte) | sì | sì (vetrata, due lanterne bianche sul muretto) | — |
| territorio-quartiere | 1950 | 4/4 | NO: persona in piedi sotto la gronda del portico, a sinistra della tenda sinistra (pantaloni blu e scarpa bianca, a cavallo fra q1 e q2, x≈1700-1780 y≈890-1000 del fermo 3456×1944), con una seconda sagoma scura accanto. La stessa figura c'è in tutti i nove candidati di R4-T, guardati a piena risoluzione sulla stessa zona: 1880 e 1900 intera (testa, busto, braccia) con una seconda persona, 1920 e 1940 busto e gambe, 1960, 1980, 2000 e 2020 gambe e scarpa. La macchia bianca accanto al cipresso in q3, vista a 6×, non è una persona riconoscibile | sì (nessuna targa leggibile sulle due auto in q3, nessuna scritta) | sì | sì (villa con piscina e pannelli solari, siepi alte, giardini, case vicine) | 1880: 5 · 1900: 5 · 1920: 5 · 1940: 5 · 1950: 4 · 1960: 4 · 1980: 4 · 2000: 4 · 2020: 4 — tutti entro un decimo, per R4-T vinceva il 1.950 · escluso: nessun candidato passa R1 |
| villa-sala-tour | 2115 | 4/4 | sì | NO: targa a muro sopra il divano (q3) con una frase leggibile («A man is not complete until he's married…»); leggibile anche a 2125 e 2135, 2105 e 2095 fuori finestra | sì | sì | — · escluso |

Righe di `check` dopo il rilancio della regola 4 del passo 12.12 (`enc congedo-drone 24 36 26 38`, `enc acqua 25 36`):

| clip | fotogrammi | raccordo | passo | rapporto | mediana dei passi | rapporto mediano |
| --- | --- | --- | --- | --- | --- | --- |
| congedo-drone | 202 | 0,918 | 0,946 | 0,970 OK | 0,936 | 0,980 OK |
| acqua | 94 | 0,809 | 0,831 | 0,974 OK | 0,857 | 0,944 OK |

Pesi contro le soglie del passo 12.12: MP4 del drone dentro i tetti (5.894.724 ≤ 6.100.000; 2.331.464 ≤ 3.000.000); i due WebM del drone restano sopra 0,6 × il loro MP4 anche dopo il rilancio (5.542.745 contro 3.536.834; 2.292.300 contro 1.398.878) e si tengono a CRF 36/38 per D59 (decisione di lavoro del 17 settembre: «i WebM del drone si tengono al peso dell'H.264 perché il VP9 non comprime meglio su questo fogliame; il rapporto 0,6 di lane-homeC §8.3 era una stima»); `acqua-1080.mp4` 2.989.769 sopra l'obiettivo di 2.500.000 anche a CRF 25 (si tiene e si scrive il numero), `acqua-1080.webm` 2.168.165 dentro.

### 12 · media della villa · 2026-09-17 · f28e4b4+

| file | byte |
| --- | --- |
| images/reali/villa-portico-tenda.jpg | 415910 |
| images/reali/villa-piscina-facciata.jpg | 523126 |
| images/reali/villa-fronte-acqua.jpg | 401868 |
| images/reali/villa-angolo-piscina.jpg | 520374 |
| images/reali/villa-lettini.jpg | 551907 |
| images/reali/villa-salotto-ombrellone.jpg | 432989 |
| images/reali/villa-vetrata-lanterne.jpg | 259822 |
| images/reali/villa-uliveto.jpg | 688025 |
| media/congedo-drone-poster.jpg | 335386 |
| media/acqua-poster.jpg | 176854 |
| media/congedo-drone-1080.mp4 | 5894724 |
| media/congedo-drone-1080.webm | 5542745 |
| media/congedo-drone-720.mp4 | 2331464 |
| media/congedo-drone-720.webm | 2292300 |
| media/acqua-1080.mp4 | 2989769 |
| media/acqua-1080.webm | 2168165 |

Pannello del territorio (`/media/hero-aerial.jpg`), variante servita:

| passata | layout px | scala massima | DPR | w chiesta | naturalWidth | w / (layout × scala × DPR) |
| --- | --- | --- | --- | --- | --- | --- |
| 1440x900 reduce | 653 | 1 | 1 | 1024 | 792 | 1.57 |
| 390x664 reduce | 351 | 1 | 1 | 420 | 390 | 1.20 |
| 1440x900 motion, sipario | 700 | 1.15 | 1 | 1024 | 792 | 1.27 |

A24: nessun fermo valido. Il tratto 75-81 s è un'orbita sulla villa, non una ripresa larga, e in tutti i nove candidati 1880-2020 c'è una persona in piedi sotto la gronda del portico (R1): il pannello tiene `/media/hero-aerial.jpg`.

Questa sezione è la rimisura del giro di correzione 1 del commit 12, dopo l'esclusione di `territorio-quartiere.jpg`: i pesi sono gli stessi della sezione «12 · media della villa · 67da3df+» meno quel file, e il pannello con `/media/hero-aerial.jpg` dà gli stessi rapporti (≥ 0,95 nelle tre passate, `sizes` invariato). La tabella dei fermi (con la cella R1 del territorio corretta), le righe di `check` e i pesi contro le soglie con D59 restano quelli della sezione precedente.

### 13 · altezza di #open-domus prima della finestra · 2026-09-17 · b7f0726

| viewport | section px |
| --- | --- |
| 1440x900 | 930 |
| 1024x768 | 1018 |
| 390x664 | 1362 |

### 13 · finestra di Open Domus · 2026-09-17 · ff960cc+

Geometria col corridoio (px):

| viewport | section | pista | foto | padding contenuto |
| --- | --- | --- | --- | --- |
| 1440x900 | 3702 | 1800 | 900 | 198 |
| 1024x768 | 3384 | 1536 | 768 | 169 |
| 1920x1080 | 4323 | 2160 | 1080 | 238 |

Campioni di scroll (↑ = in risalita):

| viewport | s (schermi) | p | ordinata tenda sx % | a tende | a stage | schermo | top contenuto / vh | opacità h2 | traboccamento |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x900 | -1 | 0.000 | 36.11 | 1.000 | 0.750 | visible | 1.75 | 0.00 | 0 |
| 1440x900 | -0.5 | 0.167 | 30.25 | 1.000 | 0.750 | visible | 1.25 | 0.00 | 0 |
| 1440x900 | -0.25 | 0.250 | 27.32 | 1.000 | 0.750 | visible | 1.00 | 0.00 | 0 |
| 1440x900 | 0 | 0.334 | 24.38 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1440x900 | 0.25 | 0.417 | 21.45 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1440x900 | 0.5 | 0.500 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1440x900 | 0.8 | 0.600 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1440x900 | 1 | 0.667 | 18.52 | 1.018 | 0.755 | visible | 0.76 | 0.00 | 0 |
| 1440x900 | 1.5 | 0.834 | 18.52 | 1.639 | 0.940 | visible | 0.94 | 0.00 | 0 |
| 1440x900 | 2.01 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.99 | 0.00 | 0 |
| 1440x900 | 2.5 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.50 | 0.45 | 0 |
| 1440x900 | 3 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | -0.00 | 0.95 | 0 |
| 1440x900 | 3.2 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | -0.20 | 1.00 | 0 |
| 1440x900 | 2.5 ↑ | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.50 | 1.00 | 0 |
| 1440x900 | 1.5 ↑ | 0.834 | 18.52 | 1.639 | 0.940 | visible | 0.94 | 0.00 | 0 |
| 1440x900 | 0.5 ↑ | 0.500 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1024x768 | -1 | 0.000 | 36.11 | 1.000 | 0.750 | visible | 1.75 | 0.00 | 0 |
| 1024x768 | -0.5 | 0.167 | 30.25 | 1.000 | 0.750 | visible | 1.25 | 0.00 | 0 |
| 1024x768 | -0.25 | 0.250 | 27.32 | 1.000 | 0.750 | visible | 1.00 | 0.00 | 0 |
| 1024x768 | 0 | 0.334 | 24.38 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1024x768 | 0.25 | 0.417 | 21.45 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1024x768 | 0.5 | 0.500 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1024x768 | 0.8 | 0.600 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1024x768 | 1 | 0.667 | 18.52 | 1.018 | 0.755 | visible | 0.76 | 0.00 | 0 |
| 1024x768 | 1.5 | 0.834 | 18.52 | 1.639 | 0.940 | visible | 0.94 | 0.00 | 0 |
| 1024x768 | 2.01 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.99 | 0.00 | 0 |
| 1024x768 | 2.5 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.50 | 0.45 | 0 |
| 1024x768 | 3 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | -0.00 | 0.95 | 0 |
| 1024x768 | 3.2 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | -0.20 | 1.00 | 0 |
| 1024x768 | 2.5 ↑ | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.50 | 1.00 | 0 |
| 1024x768 | 1.5 ↑ | 0.834 | 18.52 | 1.639 | 0.940 | visible | 0.94 | 0.00 | 0 |
| 1024x768 | 0.5 ↑ | 0.500 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1920x1080 | -1 | 0.000 | 36.11 | 1.000 | 0.750 | visible | 1.75 | 0.00 | 0 |
| 1920x1080 | -0.5 | 0.167 | 30.25 | 1.000 | 0.750 | visible | 1.25 | 0.00 | 0 |
| 1920x1080 | -0.25 | 0.250 | 27.32 | 1.000 | 0.750 | visible | 1.00 | 0.00 | 0 |
| 1920x1080 | 0 | 0.333 | 24.38 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1920x1080 | 0.25 | 0.417 | 21.45 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1920x1080 | 0.5 | 0.500 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1920x1080 | 0.8 | 0.600 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |
| 1920x1080 | 1 | 0.667 | 18.52 | 1.018 | 0.755 | visible | 0.76 | 0.00 | 0 |
| 1920x1080 | 1.5 | 0.833 | 18.52 | 1.639 | 0.940 | visible | 0.94 | 0.00 | 0 |
| 1920x1080 | 2.01 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.99 | 0.00 | 0 |
| 1920x1080 | 2.5 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.50 | 0.46 | 0 |
| 1920x1080 | 3 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.00 | 0.95 | 0 |
| 1920x1080 | 3.2 | 1.000 | 18.52 | 1.840 | 1.000 | hidden | -0.20 | 1.00 | 0 |
| 1920x1080 | 2.5 ↑ | 1.000 | 18.52 | 1.840 | 1.000 | hidden | 0.50 | 1.00 | 0 |
| 1920x1080 | 1.5 ↑ | 0.833 | 18.52 | 1.639 | 0.940 | visible | 0.94 | 0.00 | 0 |
| 1920x1080 | 0.5 ↑ | 0.500 | 18.52 | 1.000 | 0.750 | visible | 0.75 | 0.00 | 0 |

Variante servita della foto:

| passata | w | scatola larga | scatola alta | resa cover | DPR | w / (resa × DPR) |
| --- | --- | --- | --- | --- | --- | --- |
| 1440x900 corridoio | 1536 | 1440 | 900 | 1440 | 1 | 1.07 |
| 1024x768 corridoio | 1536 | 1024 | 768 | 1152 | 1 | 1.33 |
| 1920x1080 corridoio | 1920 | 1920 | 1080 | 1920 | 1 | 1.00 |
| 1440x900 reduce | 1280 | 1210 | 680 | 1210 | 1 | 1.06 |

Senza corridoio:

| viewport | data-on | section | banda | foto | clip al 20 % | clip al 50 % dopo 1,7 s | opacità h2 | traboccamento |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440x600 | no | 1585 | 776 | 680 | polygon(0% 27.941%, 49% 27.941%, 49% 127.941%, 0% 127.941%, 0% 27.941%, 51% -27.941%, 100% -27.941%, 100% 72.059%, 51% 72.059%, 51% -27.941%) | polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%, 0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 0%) | 1.00 | 0 |
| 390x664 | no | 1766 | 404 | 351 | polygon(0% 27.941%, 49% 27.941%, 49% 127.941%, 0% 127.941%, 0% 27.941%, 51% -27.941%, 100% -27.941%, 100% 72.059%, 51% 72.059%, 51% -27.941%) | polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%, 0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 0%) | 1.00 | 0 |

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-17, ff960cc+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | finestra hero recensioni storia team | finestra hero recensioni storia team | 6 | 33444 | 0 |  | ok |
| 1024×768 | / | finestra hero recensioni storia team | finestra hero recensioni storia team | 6 | 28954 | 0 |  | ok |
| 1920×1080 | / | finestra hero recensioni storia team | finestra hero recensioni storia team | 6 | 37781 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 21634 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 22398 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 28075 | 0 |  | ok |
| 1440×900 | /vendi | nessuno | nessuno | 0 | 16310 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 24151) | ok |

## Commit 14 · D.O.C. rigato e zoom di Services (2026-09-17, a6c60a0+)

### D.O.C. su /, tempi dai campioni rAF (ms e %)

| viewport | riga 1 parte | passi d'ingresso | durate d'ingresso | lato dx riga 1 a 400 ms | spina inizio / durata / fine | riga 5 esce da | passi d'uscita (5→1) | durate d'uscita | lato sx riga 5 a 250 / 400 ms | spina in uscita |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 222 | 67 / 83 / 84 / 84 | 792 / 809 / 809 / 808 / 809 | 25.1 | 222 / 1126 / 1347 (riga 5: 1347) | 21 | 50 / 50 / 50 / 51 | 509 / 492 / 492 / 492 / 492 | 13.4 / 40.0 | 492 |
| 1024×768 | 196 | 83 / 84 / 84 / 83 | 809 / 809 / 808 / 809 / 809 | 27.0 | 196 / 1142 / 1337 (riga 5: 1337) | 22 | 50 / 50 / 50 / 50 | 492 / 492 / 491 / 492 / 492 | 13.4 / 40.3 | 492 |
| 768×1024 | 202 | 84 / 83 / 84 / 83 | 809 / 808 / 809 / 808 / 808 | 27.2 | 202 / 1126 / 1327 (riga 5: 1343) | 9 | 50 / 50 / 50 / 50 | 509 / 509 / 509 / 509 / 509 | 13.4 / 39.5 | 509 |
| 390×664 | 219 | 67 / 83 / 84 / 84 | 792 / 808 / 808 / 809 / 808 | 25.0 | sotto 768 | 8 | 50 / 50 / 50 / 50 | 508 / 508 / 508 / 508 / 508 | 13.3 / 40.0 | sotto 768 |

### Services, scala dell'interno e sorgente della riga 1

| pagina | viewport | scala a top 100 / 95 / 80 / 60 % | scala a fondo | w scaricata / servita | traboccamento (px) |
| --- | --- | --- | --- | --- | --- |
| / | 1440×900 | 1.150 / 1.133 / 1.082 / 1.029 | 1.000 | 1280 / 1044 | 0 |
| / | 1024×768 | 1.150 / 1.129 / 1.070 / 1.015 | 1.000 | 768 / 742 | 0 |
| / | 768×1024 | 1.150 / 1.131 / 1.078 / 1.024 | 1.000 | 1280 / 1113 | 0 |
| / | 390×664 | 1.150 / 1.127 / 1.066 / 1.011 | 1.000 | 640 / 606 | 0 |
| /servizi | 1440×900 | 1.150 / 1.133 / 1.082 / 1.029 | 1.000 | 1280 / 1044 | 0 |
| /servizi | 390×664 | 1.150 / 1.128 / 1.066 / 1.011 | 1.000 | 640 / 606 | 0 |

### CLS con sorgente nel foglio del D.O.C.

| pagina | viewport | somma | nodi | quote della passata |
| --- | --- | --- | --- | --- |
| /vendi | 390×664 | 0.0000 | nessuno | 0.500 / 0.800 / 0.500 |
| /metodo | 390×664 | 0.0000 | nessuno | 0.500 / 0.799 / 0.500 |
| /acquista | 390×664 | 0.0000 | nessuno | 0.500 / 0.800 / 0.500 |

## Commit 15 · acqua di Costi chiari e video d'ambiente (2026-09-17, 7a8fdb6+)

| viewport | misura | valore |
| --- | --- | --- |
| file | acqua-1080.webm | 2.17 MB |
| file | acqua-1080.mp4 | 2.99 MB |
| 1440×900 | banda / margine / crescita / #costi (px) | 680.4 / 63.0 / 743.4 / 1000.1 |
| 1440×900 | salita: inizio / durata (ms), bordo a 150 / 300 ms (%) | 21 / 1775, 56.4 / 31.8 |
| 1440×900 | discesa: inizio / durata (ms), bordo a 350 / 560 ms (%) | 23 / 692, 29.4 / 70.8 |
| 1440×900 | acqua: sorgente, avanzamento in 300 ms, vp9 | /media/acqua-1080.webm, 0.312 s, probably |
| 1440×900 | Congedo: sorgente | /media/congedo-drone-1080.webm |
| 1440×900 | richieste video | 2 |
| 1366×768 | Congedo: sorgente | /media/congedo-drone-720.webm |
| 390×664 no-preference | banda / margine / crescita / #costi (px) | 197.4 / 46.5 / 243.9 / 667.7 |
| 390×664 no-preference | richieste video / data-ambient | 0 / off, off |
| 1440×900 reduce | richieste video / data-ambient | 0 / off, off |

### Commit 16 · capitoli 13-16 della home (2026-09-17, 8cbbdd5+, 1440×900 · 1024×768 · 390×664)

| viewport | misura | valore | atteso | esito |
| --- | --- | --- | --- | --- |
| 1440×900 | 13 m42 a metà corsa | 6.288 | (1, 35.0] | ok |
| 1440×900 | 13 m42 a p 0,95 | 29.608 | [26.2, 35.0] | ok |
| 1440×900 | 13 transform del link | none | none | ok |
| 1440×900 | 14 scala al centro | 1 | [0,995, 1,005] | ok |
| 1440×900 | 14 opacità al centro | 1 | ≥ 0,99 | ok |
| 1440×900 | 14 scala a p 0,9 | 1.06 | [1,05, 1,07] (atteso 1,060) | ok |
| 1440×900 | 14 opacità a p 0,9 | 0.496 | [0,45, 0,55] (atteso 0,497) | ok |
| 1440×900 | 14 traboccamento orizzontale | 0 | ≤ 1 | ok |
| 1440×900 | 15 x del track a p 0.25 | -73.203 | -73.2 ± 13.8 | ok |
| 1440×900 | 15 x del track a p 0.5 | -345.5 | -345.5 ± 13.8 | ok |
| 1440×900 | 15 x del track a p 0.75 | -617.797 | -617.8 ± 13.8 | ok |
| 1440×900 | 15 Tab alla terza tessera | left 720, right 1325, scrollLeft 0 | dentro [0, vw], scrollLeft 0 | ok |
| 1440×900 | 16 m42 griglia al centro | -18.759 | [−40, 40] | ok |
| 1440×900 | 16 m42 a +400 e +800 | 8.00355 · 37.5703 | crescente, ≤ 40 | ok |
| 1024×768 | 13 m42 a metà corsa | 4.472 | (1, 25.2] | ok |
| 1024×768 | 13 m42 a p 0,95 | 21.085 | [18.4, 25.2] | ok |
| 1024×768 | 13 transform del link | none | none | ok |
| 1024×768 | 14 scala al centro | 1 | [0,995, 1,005] | ok |
| 1024×768 | 14 opacità al centro | 1 | ≥ 0,99 | ok |
| 1024×768 | 14 scala a p 0,9 | 1.061 | [1,05, 1,07] (atteso 1,060) | ok |
| 1024×768 | 14 opacità a p 0,9 | 0.492 | [0,45, 0,55] (atteso 0,497) | ok |
| 1024×768 | 14 traboccamento orizzontale | 0 | ≤ 1 | ok |
| 1024×768 | 15 x del track a p 0.25 | -52.279 | -52.0 ± 9.8 | ok |
| 1024×768 | 15 x del track a p 0.5 | -245.5 | -245.5 ± 9.8 | ok |
| 1024×768 | 15 x del track a p 0.75 | -439.229 | -439.0 ± 9.8 | ok |
| 1024×768 | 15 Tab alla terza tessera | left 513, right 943, scrollLeft 0 | dentro [0, vw], scrollLeft 0 | ok |
| 1024×768 | 16 m42 griglia al centro | -19.256 | [−40, 40] | ok |
| 1024×768 | 16 m42 a +400 e +800 | 8.78795 · 38.5678 | crescente, ≤ 40 | ok |
| 390×664 | 13 m42 a metà corsa | 3.625 | (1, 20.7] | ok |
| 390×664 | 13 m42 a p 0,95 | 17.125 | [14.8, 20.7] | ok |
| 390×664 | 13 transform del link | none | none | ok |
| 390×664 | 14 scala al centro | 1 | [0,995, 1,005] | ok |
| 390×664 | 14 opacità al centro | 1 | ≥ 0,99 | ok |
| 390×664 | 14 scala a p 0,9 | 1.061 | [1,05, 1,07] (atteso 1,060) | ok |
| 390×664 | 14 opacità a p 0,9 | 0.495 | [0,45, 0,55] (atteso 0,497) | ok |
| 390×664 | 14 traboccamento orizzontale | 0 | ≤ 1 | ok |
| 390×664 | 15 rotaia | scorrimento nativo | sotto 1024 nessun [data-on] | ok |
| 390×664 | 16 transform della colonna |  ·  ·  | none a ogni quota | ok |

### Commit 16 · capitoli 13-16 della home (2026-09-17, 140f76a+, 1440×900 · 1024×768 · 390×664)

| viewport | misura | valore | atteso | esito |
| --- | --- | --- | --- | --- |
| 1440×900 | 13 m42 a metà corsa | 6.288 | (1, 35.0] | ok |
| 1440×900 | 13 m42 a p 0,95 | 29.608 | [26.2, 35.0] | ok |
| 1440×900 | 13 transform del link | none | none | ok |
| 1440×900 | 14 scala al centro | 1 | [0,995, 1,005] | ok |
| 1440×900 | 14 opacità al centro | 1 | ≥ 0,99 | ok |
| 1440×900 | 14 scala a p 0,9 | 1.06 | [1,05, 1,07] (atteso 1,060) | ok |
| 1440×900 | 14 opacità a p 0,9 | 0.496 | [0,45, 0,55] (atteso 0,497) | ok |
| 1440×900 | 14 traboccamento orizzontale | 0 | ≤ 1 | ok |
| 1440×900 | 15 x del track a p 0.25 | -73.203 | -73.2 ± 13.8 | ok |
| 1440×900 | 15 x del track a p 0.5 | -345.5 | -345.5 ± 13.8 | ok |
| 1440×900 | 15 x del track a p 0.75 | -617.797 | -617.8 ± 13.8 | ok |
| 1440×900 | 15 Tab alla terza tessera | left 720, right 1325, scrollLeft 0 | dentro [0, vw], scrollLeft 0 | ok |
| 1440×900 | 16 m42 griglia al centro | -18.759 | [−40, 40] | ok |
| 1440×900 | 16 m42 a +400 e +800 | 8.00355 · 37.5703 | crescente, ≤ 40 | ok |
| 1024×768 | 13 m42 a metà corsa | 4.472 | (1, 25.2] | ok |
| 1024×768 | 13 m42 a p 0,95 | 21.085 | [18.4, 25.2] | ok |
| 1024×768 | 13 transform del link | none | none | ok |
| 1024×768 | 14 scala al centro | 1 | [0,995, 1,005] | ok |
| 1024×768 | 14 opacità al centro | 1 | ≥ 0,99 | ok |
| 1024×768 | 14 scala a p 0,9 | 1.061 | [1,05, 1,07] (atteso 1,060) | ok |
| 1024×768 | 14 opacità a p 0,9 | 0.492 | [0,45, 0,55] (atteso 0,497) | ok |
| 1024×768 | 14 traboccamento orizzontale | 0 | ≤ 1 | ok |
| 1024×768 | 15 x del track a p 0.25 | -52.279 | -52.0 ± 9.8 | ok |
| 1024×768 | 15 x del track a p 0.5 | -245.5 | -245.5 ± 9.8 | ok |
| 1024×768 | 15 x del track a p 0.75 | -439.229 | -439.0 ± 9.8 | ok |
| 1024×768 | 15 Tab alla terza tessera | left 513, right 943, scrollLeft 0 | dentro [0, vw], scrollLeft 0 | ok |
| 1024×768 | 16 m42 griglia al centro | -19.256 | [−40, 40] | ok |
| 1024×768 | 16 m42 a +400 e +800 | 8.78795 · 38.5678 | crescente, ≤ 40 | ok |
| 390×664 | 13 m42 a metà corsa | 3.625 | (1, 20.7] | ok |
| 390×664 | 13 m42 a p 0,95 | 17.125 | [14.8, 20.7] | ok |
| 390×664 | 13 transform del link | none | none | ok |
| 390×664 | 14 scala al centro | 1 | [0,995, 1,005] | ok |
| 390×664 | 14 opacità al centro | 1 | ≥ 0,99 | ok |
| 390×664 | 14 scala a p 0,9 | 1.061 | [1,05, 1,07] (atteso 1,060) | ok |
| 390×664 | 14 opacità a p 0,9 | 0.495 | [0,45, 0,55] (atteso 0,497) | ok |
| 390×664 | 14 traboccamento orizzontale | 0 | ≤ 1 | ok |
| 390×664 | 15 rotaia | scorrimento nativo | sotto 1024 nessun [data-on] | ok |
| 390×664 | 16 transform della colonna |  ·  ·  | none a ogni quota | ok |

Questa sezione è la rimisura del giro di correzione 1 del commit 16, dopo il passaggio del refresh di
`Contact` a `whenStill` (D39, D53, D54, D56, D57): i gesti dei capitoli 13-16 non cambiano, 39 righe
su 39 «ok» e i valori coincidono con la sezione «8cbbdd5+» entro il rumore dello scrub. Sulla rotta
del cambio, `/?intent=buyer#cerca` e `/?intent=question#cerca` a 1440×900 e 390×664, il pannello
della ricerca resta a opacità 1,000 su ~230 fotogrammi in 4 s, e l'intento cambia a +277…+295 ms con
ancora 1.334-2.514 px di arrivo nativo da percorrere: è la finestra in cui un refresh forzato
cancellerebbe l'arrivo (sonda nello scratchpad, non committata).

### Commit 17 · base di --pc-focus, la banda del commit 16 (2026-09-17, 9d5f35c, 390 · 768 · 1024 · 1440 · 1920)

| viewport | fascia | fotogramma | candidato | luminanza media | quota > 180 |
| --- | --- | --- | --- | --- | --- |
| 390×664 | sotto 768 (regola base) | poster | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 119.4 | 0.142 |
| 768×1024 | 768-1023 (@media min-width 768px) | poster | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 127.9 | 0.101 |
| 1024×768 | da 1024 (@media min-width 1024px) | poster | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 96.5 | 0.105 |
| 1440×900 | da 1024 (@media min-width 1024px) | poster | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 118.4 | 0.117 |
| 1920×1080 | da 1024 (@media min-width 1024px) | poster | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 125.7 | 0.101 |

### Commit 17 · --pc-focus, luminanza sotto il titolo (2026-09-17, 9d5f35c+, 390 · 768 · 1024 · 1440 · 1920)

| viewport | fascia | fotogramma | candidato | luminanza media | quota > 180 |
| --- | --- | --- | --- | --- | --- |
| 390×664 | sotto 768 (regola base) | poster | 8% 50% | 127.9 | 0.179 |
| 390×664 | sotto 768 (regola base) | poster | 12% 50% | 128 | 0.193 |
| 390×664 | sotto 768 (regola base) | poster | 16% 50% | 131 | 0.224 |
| 390×664 | sotto 768 (regola base) | poster | 24% 50% | 140.2 | 0.28 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 8% 50% | 122.6 | 0.158 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 12% 50% | 122.4 | 0.17 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 16% 50% | 124.9 | 0.183 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 24% 50% | 133 | 0.221 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 8% 50% | 129.2 | 0.202 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 12% 50% | 133.1 | 0.222 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 16% 50% | 138.4 | 0.246 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 24% 50% | 151.6 | 0.313 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 8% 50% | 123.4 | 0.135 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 12% 50% | 124.1 | 0.151 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 16% 50% | 126.7 | 0.174 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 24% 50% | 135.7 | 0.228 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 149 | 0.342 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 151.5 | 0.359 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 153.9 | 0.373 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 158.9 | 0.405 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 169.2 | 0.458 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 159.2 | 0.41 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 160.5 | 0.417 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 161.6 | 0.425 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 163.7 | 0.438 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 170.3 | 0.487 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 150.8 | 0.358 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 153.3 | 0.377 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 155.5 | 0.394 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 160.2 | 0.431 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 171.4 | 0.511 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 162.3 | 0.432 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 163.2 | 0.438 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 164.2 | 0.445 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 166.1 | 0.456 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 171.7 | 0.486 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 167.1 | 0.47 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 167.5 | 0.473 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 167.9 | 0.476 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 168.5 | 0.481 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 169.6 | 0.492 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 163.5 | 0.461 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 164.3 | 0.467 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 165.2 | 0.475 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 166.9 | 0.488 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 172.8 | 0.524 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 167.2 | 0.492 |

| fascia | --pc-focus | caso peggiore | quota > 180 | tetto | esito |
| --- | --- | --- | --- | --- | --- |
| sotto 768 (regola base) | 12% 50% | 128 | 0.193 | ≤ 119.4 (base) | KO |
| 768-1023 (@media min-width 768px) | 8% 50% | 129.2 | 0.202 | ≤ 127.9 (base) | KO |
| da 1024 (@media min-width 1024px) | 8% 50% | 170.4 | 0.495 | ≤ 125.7 (base) | KO |

### Commit 17 · --pc-focus, luminanza sotto il titolo (2026-09-17, 9d5f35c+, 390 · 768 · 1024 · 1440 · 1920)

| viewport | fascia | fotogramma | candidato | luminanza media | quota > 180 |
| --- | --- | --- | --- | --- | --- |
| 390×664 | sotto 768 (regola base) | poster | 8% 50% | 127.9 | 0.179 |
| 390×664 | sotto 768 (regola base) | poster | 12% 50% | 128 | 0.193 |
| 390×664 | sotto 768 (regola base) | poster | 16% 50% | 131 | 0.224 |
| 390×664 | sotto 768 (regola base) | poster | 24% 50% | 140.2 | 0.28 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 8% 50% | 122.6 | 0.158 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 12% 50% | 122.4 | 0.17 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 16% 50% | 124.9 | 0.183 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 24% 50% | 133 | 0.221 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 8% 50% | 129.2 | 0.202 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 12% 50% | 133.1 | 0.222 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 16% 50% | 138.4 | 0.246 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 24% 50% | 151.6 | 0.313 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 8% 50% | 123.4 | 0.135 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 12% 50% | 124.1 | 0.151 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 16% 50% | 126.7 | 0.174 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 24% 50% | 135.7 | 0.228 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 149 | 0.342 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 151.5 | 0.359 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 153.9 | 0.373 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 158.9 | 0.405 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 169.2 | 0.458 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 159.2 | 0.41 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 160.5 | 0.417 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 161.6 | 0.425 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 163.7 | 0.438 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 170.3 | 0.487 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 150.8 | 0.358 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 153.3 | 0.377 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 155.5 | 0.394 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 160.2 | 0.431 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 171.4 | 0.511 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 162.3 | 0.432 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 163.2 | 0.438 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 164.2 | 0.445 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 166.1 | 0.456 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 171.7 | 0.486 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 167.1 | 0.47 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 167.5 | 0.473 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 167.9 | 0.476 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 168.5 | 0.481 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 169.6 | 0.492 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 163.5 | 0.461 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 164.3 | 0.467 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 165.2 | 0.475 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 166.9 | 0.488 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 172.8 | 0.524 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 166.2 | 0.46 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 170.4 | 0.495 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 167.2 | 0.492 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 167.2 | 0.492 |

| fascia | --pc-focus | caso peggiore | quota > 180 | tetto | esito |
| --- | --- | --- | --- | --- | --- |
| sotto 768 (regola base) | 12% 50% | 128 | 0.193 | ≤ 119.4 (base) | KO |
| 768-1023 (@media min-width 768px) | 8% 50% | 129.2 | 0.202 | ≤ 127.9 (base) | KO |
| da 1024 (@media min-width 1024px) | 8% 50% | 170.4 | 0.495 | ≤ 125.7 (base) | KO |

### Commit 17 · la cartolina del Congedo (2026-09-17, 9d5f35c+, 1024 · 1440 · 1920 · 768 · 390)

| viewport | misura | valore | atteso | esito |
| --- | --- | --- | --- | --- |
| 1024×768 | data-on sulla cartolina | true | true | ok |
| 1024×768 | altezza della section | 1382 | 1382 ± 1 (180svh) | ok |
| 1024×768 | margin-top del footer | -61.44 | -61.4 ± 1 (−8svh) | ok |
| 1024×768 | aggiunta d'altezza della home (§4) | 744.56 | 745 ± 2 | ok |
| 1024×768 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1024×768 | inset alto a metà corsa | 4.11 | (0, 8) | ok |
| 1024×768 | opacità del footer al 90 % | 0.068 | < 0,2 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.55 | top 763.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.7 | top 611.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.85 | top 459.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 1 | top 307.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1024×768 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1024×768 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1024×768 | video d'ambiente a metà corsa | playing | playing | ok |
| 1024×768 | titolo dentro la finestra (it) | true | true | ok |
| 1024×768 | titolo dentro la finestra (en) | true | true | ok |
| 1024×768 | titolo dentro la finestra (fr) | true | true | ok |
| 1024×768 | titolo dentro la finestra (de) | true | true | ok |
| 1024×768 | titolo dentro la finestra (es) | true | true | ok |
| 1440×900 | data-on sulla cartolina | true | true | ok |
| 1440×900 | altezza della section | 1620 | 1620 ± 1 (180svh) | ok |
| 1440×900 | margin-top del footer | -72 | -72.0 ± 1 (−8svh) | ok |
| 1440×900 | aggiunta d'altezza della home (§4) | 738 | 738 ± 2 | ok |
| 1440×900 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1440×900 | inset alto a metà corsa | 4.143 | (0, 8) | ok |
| 1440×900 | opacità del footer al 90 % | 0.07 | < 0,2 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.55 | top 895.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.7 | top 716.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.85 | top 538.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 1 | top 360.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1440×900 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1440×900 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1440×900 | video d'ambiente a metà corsa | playing | playing | ok |
| 1440×900 | titolo dentro la finestra (it) | true | true | ok |
| 1440×900 | titolo dentro la finestra (en) | true | true | ok |
| 1440×900 | titolo dentro la finestra (fr) | true | true | ok |
| 1440×900 | titolo dentro la finestra (de) | true | true | ok |
| 1440×900 | titolo dentro la finestra (es) | true | true | ok |
| 1920×1080 | data-on sulla cartolina | true | true | ok |
| 1920×1080 | altezza della section | 1944 | 1944 ± 1 (180svh) | ok |
| 1920×1080 | margin-top del footer | -86.4 | -86.4 ± 1 (−8svh) | ok |
| 1920×1080 | aggiunta d'altezza della home (§4) | 777.6 | 778 ± 2 | ok |
| 1920×1080 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1920×1080 | inset alto a metà corsa | 4.141 | (0, 8) | ok |
| 1920×1080 | opacità del footer al 90 % | 0.07 | < 0,2 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.55 | top 1074.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.7 | top 860.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.85 | top 646.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 1 | top 432.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1920×1080 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1920×1080 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1920×1080 | video d'ambiente a metà corsa | playing | playing | ok |
| 1920×1080 | titolo dentro la finestra (it) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (en) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (fr) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (de) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (es) | true | true | ok |
| 768×1024 | niente data-on, schermo non sticky | false · relative | false · relative | ok |
| 768×1024 | margin-top del footer | 0px | 0px | ok |
| 768×1024 | inset a fine tratto | 0 0 0 0 | 4 14 4 14 ± 0,2 | KO |
| 768×1024 | opacità del footer a fine tratto | 1 | 1 | ok |
| 768×1024 | titolo dentro la finestra (it) | true | true | ok |
| 390×664 | niente data-on, schermo non sticky | false · relative | false · relative | ok |
| 390×664 | margin-top del footer | 0px | 0px | ok |
| 390×664 | inset a fine tratto | 4 10 4 10 | 4 10 4 10 ± 0,2 | ok |
| 390×664 | opacità del footer a fine tratto | 1 | 1 | ok |
| 390×664 | titolo dentro la finestra (it) | true | true | ok |
| 390×664 | richieste video | 0 | 0 | ok |

### Commit 17 · la cartolina del Congedo (2026-09-17, 9d5f35c+, 1024 · 1440 · 1920 · 768 · 390)

| viewport | misura | valore | atteso | esito |
| --- | --- | --- | --- | --- |
| 1024×768 | data-on sulla cartolina | true | true | ok |
| 1024×768 | altezza della section | 1382 | 1382 ± 1 (180svh) | ok |
| 1024×768 | margin-top del footer | -61.44 | -61.4 ± 1 (−8svh) | ok |
| 1024×768 | aggiunta d'altezza della home (§4) | 744.56 | 745 ± 2 | ok |
| 1024×768 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1024×768 | inset alto a metà corsa | 4.11 | (0, 8) | ok |
| 1024×768 | opacità del footer al 90 % | 0.068 | < 0,2 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.55 | top 763.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.7 | top 611.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.85 | top 459.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 1 | top 307.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1024×768 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1024×768 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1024×768 | video d'ambiente a metà corsa | playing | playing | ok |
| 1024×768 | titolo dentro la finestra (it) | true | true | ok |
| 1024×768 | titolo dentro la finestra (en) | true | true | ok |
| 1024×768 | titolo dentro la finestra (fr) | true | true | ok |
| 1024×768 | titolo dentro la finestra (de) | true | true | ok |
| 1024×768 | titolo dentro la finestra (es) | true | true | ok |
| 1440×900 | data-on sulla cartolina | true | true | ok |
| 1440×900 | altezza della section | 1620 | 1620 ± 1 (180svh) | ok |
| 1440×900 | margin-top del footer | -72 | -72.0 ± 1 (−8svh) | ok |
| 1440×900 | aggiunta d'altezza della home (§4) | 738 | 738 ± 2 | ok |
| 1440×900 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1440×900 | inset alto a metà corsa | 4.143 | (0, 8) | ok |
| 1440×900 | opacità del footer al 90 % | 0.07 | < 0,2 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.55 | top 895.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.7 | top 716.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.85 | top 538.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 1 | top 360.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1440×900 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1440×900 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1440×900 | video d'ambiente a metà corsa | playing | playing | ok |
| 1440×900 | titolo dentro la finestra (it) | true | true | ok |
| 1440×900 | titolo dentro la finestra (en) | true | true | ok |
| 1440×900 | titolo dentro la finestra (fr) | true | true | ok |
| 1440×900 | titolo dentro la finestra (de) | true | true | ok |
| 1440×900 | titolo dentro la finestra (es) | true | true | ok |
| 1920×1080 | data-on sulla cartolina | true | true | ok |
| 1920×1080 | altezza della section | 1944 | 1944 ± 1 (180svh) | ok |
| 1920×1080 | margin-top del footer | -86.4 | -86.4 ± 1 (−8svh) | ok |
| 1920×1080 | aggiunta d'altezza della home (§4) | 777.6 | 778 ± 2 | ok |
| 1920×1080 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1920×1080 | inset alto a metà corsa | 4.141 | (0, 8) | ok |
| 1920×1080 | opacità del footer al 90 % | 0.07 | < 0,2 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.55 | top 1074.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.7 | top 860.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.85 | top 646.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 1 | top 432.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1920×1080 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1920×1080 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1920×1080 | video d'ambiente a metà corsa | playing | playing | ok |
| 1920×1080 | titolo dentro la finestra (it) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (en) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (fr) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (de) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (es) | true | true | ok |
| 768×1024 | niente data-on, schermo non sticky | false · relative | false · relative | ok |
| 768×1024 | margin-top del footer | 0px | 0px | ok |
| 768×1024 | inset a fine tratto | 4 14 4 14 | 4 14 4 14 ± 0,2 | ok |
| 768×1024 | opacità del footer a fine tratto | 1 | 1 | ok |
| 768×1024 | titolo dentro la finestra (it) | true | true | ok |
| 390×664 | niente data-on, schermo non sticky | false · relative | false · relative | ok |
| 390×664 | margin-top del footer | 0px | 0px | ok |
| 390×664 | inset a fine tratto | 4 10 4 10 | 4 10 4 10 ± 0,2 | ok |
| 390×664 | opacità del footer a fine tratto | 1 | 1 | ok |
| 390×664 | titolo dentro la finestra (it) | true | true | ok |
| 390×664 | richieste video | 0 | 0 | ok |

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-17, 9d5f35c+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 34998 | 0 |  | ok |
| 1024×768 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 30308 | 0 |  | ok |
| 1920×1080 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 39613 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 22352 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 23193 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 28439 | 0 |  | ok |
| 1440×900 | /vendi | nessuno | nessuno | 0 | 16382 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 24223) | ok |

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-17, 9d5f35c+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-1080.webm | sì | no (scrollY 33299) | 280 | 1.98 | 3.24 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-17, 9d5f35c+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-1080.webm | sì | sì (scrollY 33279) | 490 | 1.99 | 10.41 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-17, 9d5f35c+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-1080.webm | sì | sì (scrollY 33279) | 492 | 1.96 | 6.89 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-17, 9d5f35c+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-720.webm | sì | sì (scrollY 33279) | 486 | 1.84 | 2.56 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | ok |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-17, 9d5f35c+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-720.webm | sì | sì (scrollY 33279) | 488 | 1.97 | 3.24 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | ok |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

Nota: questa passata --base sostituisce quella del 2026-09-17 qui sopra. Lì il video veniva messo in pausa e nascosto, e il tetto era il solo poster; da 768 px la banda del commit 16 riproduce lo stesso loop del drone della cartolina, quindi le due passate si guardano col video acceso (misure/17-pc-focus.mjs, conVideo = vp.width >= 768).

### Commit 17 · base di --pc-focus, la banda del commit 16 (2026-09-18, 9d5f35c, 390 · 768 · 1024 · 1440 · 1920)

| viewport | fascia | fotogramma | candidato | luminanza media | quota > 180 |
| --- | --- | --- | --- | --- | --- |
| 390×664 | sotto 768 (regola base) | poster | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 119.4 | 0.142 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 130.7 | 0.218 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 140 | 0.283 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 132.4 | 0.189 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 153.1 | 0.373 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 161.2 | 0.443 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 154.3 | 0.389 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 151.4 | 0.366 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 161.9 | 0.43 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 153.6 | 0.387 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 144.7 | 0.315 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 162 | 0.409 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | oggi: piscina-lusso.jpg a 16% 50%, zoom 1,14 | 147.5 | 0.333 |

### Commit 17 · --pc-focus, luminanza sotto il titolo (2026-09-18, 9d7383f+, 390 · 768 · 1024 · 1440 · 1920)

| viewport | fascia | fotogramma | candidato | luminanza media | quota > 180 |
| --- | --- | --- | --- | --- | --- |
| 390×664 | sotto 768 (regola base) | poster | 8% 50% | 127.9 | 0.179 |
| 390×664 | sotto 768 (regola base) | poster | 12% 50% | 128 | 0.193 |
| 390×664 | sotto 768 (regola base) | poster | 16% 50% | 131 | 0.224 |
| 390×664 | sotto 768 (regola base) | poster | 24% 50% | 140.2 | 0.28 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 8% 50% | 122.6 | 0.158 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 12% 50% | 122.4 | 0.17 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 16% 50% | 124.9 | 0.183 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 0.00 s | 24% 50% | 133 | 0.221 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 8% 50% | 129.2 | 0.202 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 12% 50% | 133.1 | 0.222 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 16% 50% | 138.4 | 0.246 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 4.04 s | 24% 50% | 151.6 | 0.313 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 8% 50% | 123.4 | 0.135 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 12% 50% | 124.1 | 0.151 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 16% 50% | 126.7 | 0.174 |
| 768×1024 | 768-1023 (@media min-width 768px) | t 7.98 s | 24% 50% | 135.7 | 0.228 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 149 | 0.342 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 151.5 | 0.359 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 153.9 | 0.373 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 158.9 | 0.405 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 169.2 | 0.458 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 159.2 | 0.41 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 160.5 | 0.417 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 161.6 | 0.425 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 163.7 | 0.438 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 170.3 | 0.487 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 150.8 | 0.358 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 153.3 | 0.377 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 155.5 | 0.394 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 160.2 | 0.431 |
| 1024×768 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 171.4 | 0.511 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 162.3 | 0.426 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 163.2 | 0.431 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 164.3 | 0.439 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 166.1 | 0.449 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 171.8 | 0.48 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 167.1 | 0.466 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 167.5 | 0.468 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 167.9 | 0.471 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 168.6 | 0.476 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 169.6 | 0.487 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 163.5 | 0.456 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 164.3 | 0.462 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 165.3 | 0.47 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 167 | 0.483 |
| 1440×900 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 172.8 | 0.52 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 8% 50% | 166.2 | 0.448 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 12% 50% | 166.2 | 0.448 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 16% 50% | 166.2 | 0.448 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 24% 50% | 166.2 | 0.448 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 0.00 s | 50% 50% | 166.2 | 0.448 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 8% 50% | 170.5 | 0.484 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 12% 50% | 170.5 | 0.484 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 16% 50% | 170.5 | 0.484 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 24% 50% | 170.5 | 0.484 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 4.04 s | 50% 50% | 170.5 | 0.484 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 8% 50% | 167.3 | 0.483 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 12% 50% | 167.3 | 0.483 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 16% 50% | 167.3 | 0.483 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 24% 50% | 167.3 | 0.483 |
| 1920×1080 | da 1024 (@media min-width 1024px) | t 7.98 s | 50% 50% | 167.3 | 0.483 |

| fascia | --pc-focus | caso peggiore | quota > 180 | tetto | esito |
| --- | --- | --- | --- | --- | --- |
| sotto 768 (regola base) | 12% 50% | 128 | 0.193 | ≤ 119.4 (base) | KO |
| 768-1023 (@media min-width 768px) | 8% 50% | 129.2 | 0.202 | ≤ 140.0 (base) | ok |
| da 1024 (@media min-width 1024px) | 8% 50% | 170.5 | 0.484 | ≤ 162.0 (base) | KO |

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-18, 9d7383f+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-720.webm | sì | sì (scrollY 33279) | 490 | 1.82 | 7.87 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-18, 9d7383f+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-720.webm | sì | sì (scrollY 33279) | 487 | 1.9 | 3.49 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | ok |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-18, 9d7383f+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-720.webm | sì | sì (scrollY 33279) | 494 | 1.98 | 4.89 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-18, 9d7383f+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-1080.webm | sì | sì (scrollY 33279) | 489 | 1.97 | 8.96 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-18, 9d7383f+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-1080.webm | sì | sì (scrollY 33279) | 493 | 2.01 | 6.93 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

### Commit 17 · paint della cartolina nello sticky, 1440×900, CPU ×4 (2026-09-18, 9d7383f+)

| viewport | video | sorgente | mark | fine nello sticky | fotogrammi con paint | p95 ms | max ms | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | playing | /media/congedo-drone-1080.webm | sì | sì (scrollY 33279) | 492 | 1.98 | 7.06 | max < 4 ms, ≥ 30 fotogrammi, video playing, fine nello sticky | KO |

Nota: useAmbientVideo sceglie la sorgente al primo play, quindi la ripiega «sd forzata» di spec §3.18 vale per tutta la sessione, non solo durante lo sticky.

## 05-titoli · 2026-09-18 · 9d7383f+

Titolo di #servizi sulla home:

| progetto | caratteri | ingresso ms | tetto ms | uscita ms (≤ 1300) | dall'alto (≥ 0,99) |
| --- | --- | --- | --- | --- | --- |
| desktop-1440 | 62 | 2373 | 2950 | 815 | 1 |
| mobile-390 | 62 | 2381 | 2950 | 813 | 1 |

Accento di Method su /metodo:

| progetto | caratteri | m41 armato px | atteso px (±2) | d armato (< 0,05) | ingresso ms | tetto ms | uscita ms (≤ 1300) | traboccamento px (≤ 0) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| desktop-1440 | 7 | 144 | 144 | 0 | 1854 | 2350 | 711 | 0 |
| mobile-390 | 7 | 39 | 39 | 0 | 1774 | 2350 | 708 | 0 |

[data-c] sulla home a 1440 dopo una passata: 1031 (base del test 8, e2e/baseline/data-c.json).

kern-table.json: 43.170 byte (tetto 65.536, D36). Estremi per chiave (D42):

| chiave | coppie | min em | max em | tetto em |
| --- | --- | --- | --- | --- |
| display-400 | 929 | -0.133 | 0.087 | ±0.2 |
| display-500 | 1112 | -0.132 | 0.094 | ±0.2 |
| brand-800 | 1169 | -0.1 | 0.19 | ±0.2 |
| script-400 | 307 | -0.244 | 0.195 | ±0.25 |

### Commit 17 · la cartolina del Congedo (2026-09-18, 9d7383f+, 1024 · 1440 · 1920 · 768 · 390)

| viewport | misura | valore | atteso | esito |
| --- | --- | --- | --- | --- |
| 1024×768 | data-on sulla cartolina | true | true | ok |
| 1024×768 | altezza della section | 1382 | 1382 ± 1 (180svh) | ok |
| 1024×768 | margin-top del footer | -61.44 | -61.4 ± 1 (−8svh) | ok |
| 1024×768 | aggiunta d'altezza della home (§4) | 744.56 | 745 ± 2 | ok |
| 1024×768 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1024×768 | inset alto a metà corsa | 4.11 | (0, 8) | ok |
| 1024×768 | opacità del footer al 90 % | 0.068 | < 0,2 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.55 | top 763.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.7 | top 611.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 0.85 | top 459.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | footer sotto il bordo basso della finestra a p 1 | top 307.8 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1024×768 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1024×768 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1024×768 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1024×768 | video d'ambiente a metà corsa | playing | playing | ok |
| 1024×768 | titolo dentro la finestra (it) | true | true | ok |
| 1024×768 | titolo dentro la finestra (en) | true | true | ok |
| 1024×768 | titolo dentro la finestra (fr) | true | true | ok |
| 1024×768 | titolo dentro la finestra (de) | true | true | ok |
| 1024×768 | titolo dentro la finestra (es) | true | true | ok |
| 1440×900 | data-on sulla cartolina | true | true | ok |
| 1440×900 | altezza della section | 1620 | 1620 ± 1 (180svh) | ok |
| 1440×900 | margin-top del footer | -72 | -72.0 ± 1 (−8svh) | ok |
| 1440×900 | aggiunta d'altezza della home (§4) | 738 | 738 ± 2 | ok |
| 1440×900 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1440×900 | inset alto a metà corsa | 4.143 | (0, 8) | ok |
| 1440×900 | opacità del footer al 90 % | 0.07 | < 0,2 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.55 | top 895.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.7 | top 716.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 0.85 | top 538.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | footer sotto il bordo basso della finestra a p 1 | top 360.3 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1440×900 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1440×900 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1440×900 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1440×900 | video d'ambiente a metà corsa | playing | playing | ok |
| 1440×900 | titolo dentro la finestra (it) | true | true | ok |
| 1440×900 | titolo dentro la finestra (en) | true | true | ok |
| 1440×900 | titolo dentro la finestra (fr) | true | true | ok |
| 1440×900 | titolo dentro la finestra (de) | true | true | ok |
| 1440×900 | titolo dentro la finestra (es) | true | true | ok |
| 1920×1080 | data-on sulla cartolina | true | true | ok |
| 1920×1080 | altezza della section | 1944 | 1944 ± 1 (180svh) | ok |
| 1920×1080 | margin-top del footer | -86.4 | -86.4 ± 1 (−8svh) | ok |
| 1920×1080 | aggiunta d'altezza della home (§4) | 777.6 | 778 ± 2 | ok |
| 1920×1080 | top dello schermo a metà corsa | 0 | \|top\| ≤ 1 | ok |
| 1920×1080 | inset alto a metà corsa | 4.141 | (0, 8) | ok |
| 1920×1080 | opacità del footer al 90 % | 0.07 | < 0,2 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.55 | top 1074.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.7 | top 860.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 0.85 | top 646.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | footer sotto il bordo basso della finestra a p 1 | top 432.0 · b 8 % | top ≥ bordo della finestra − 1 | ok |
| 1920×1080 | inset col footer al 40 % | 8 22 8 22 | 8 22 8 22 ± 0,2 | ok |
| 1920×1080 | footer al 40 %: opacità e scala | 1 · 1 | 1 · 1 ± 0,001 | ok |
| 1920×1080 | CTA libera a 0, metà, fine | true · true · true | true · true · true | ok |
| 1920×1080 | video d'ambiente a metà corsa | playing | playing | ok |
| 1920×1080 | titolo dentro la finestra (it) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (en) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (fr) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (de) | true | true | ok |
| 1920×1080 | titolo dentro la finestra (es) | true | true | ok |
| 768×1024 | niente data-on, schermo non sticky | false · relative | false · relative | ok |
| 768×1024 | margin-top del footer | 0px | 0px | ok |
| 768×1024 | inset a fine tratto | 4 14 4 14 | 4 14 4 14 ± 0,2 | ok |
| 768×1024 | opacità del footer a fine tratto | 1 | 1 | ok |
| 768×1024 | titolo dentro la finestra (it) | true | true | ok |
| 390×664 | niente data-on, schermo non sticky | false · relative | false · relative | ok |
| 390×664 | margin-top del footer | 0px | 0px | ok |
| 390×664 | inset a fine tratto | 4 10 4 10 | 4 10 4 10 ± 0,2 | ok |
| 390×664 | opacità del footer a fine tratto | 1 | 1 | ok |
| 390×664 | titolo dentro la finestra (it) | true | true | ok |
| 390×664 | richieste video | 0 | 0 | ok |

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-18, 9d7383f+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 34998 | 0 |  | ok |
| 1024×768 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 30308 | 0 |  | ok |
| 1920×1080 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 39613 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 22352 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 23193 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 28439 | 0 |  | ok |
| 1440×900 | /vendi | nessuno | nessuno | 0 | 16382 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 24223) | ok |

### Commit 17 · i due cancelli aperti, da portare ad Alberto (2026-09-18, 9d7383f+)

Spec §3.18 ha due criteri che il commit 17 non passa. Il codice è scritto e tutto
il resto è verde; la scelta è di Alberto, non del commit (brief Step 13 e Step 15).

**1. `--pc-focus`, la luminanza sotto il titolo bianco.** Le due passate ora si
guardano col video acceso da 768 px in tutt'e due (prima la passata `--base`
metteva il video in pausa e misurava il solo poster, e il confronto non era
omogeneo). Caso peggiore fra viewport e fotogrammi, luminanza media su 255:

| fascia | banda del commit 16 (tetto) | cartolina, candidato scelto | quota > 180 | esito |
| --- | --- | --- | --- | --- |
| sotto 768 | 119,4 | 128,0 (`12% 50%`) | 0,193 | KO di 8,6 |
| 768-1023 | 140,0 | 129,2 (`8% 50%`) | 0,202 | ok |
| da 1024 | 162,0 | 170,5 (`8% 50%`) | 0,484 | KO di 8,5 |

Da 1024 nessuna inquadratura può rientrare: il caso peggiore lo detta 1920×1080,
dove la banda è 16:9 come il loop e `object-cover` mostra il fotogramma intero,
così `8%`, `12%`, `16%` e `24%` danno tutti 170,5 (solo `50% 50%` è peggio, 172,8).
A 1024 e 1440, dove l'inquadratura conta, `8% 50%` è il più scuro (159,2 e 167,1,
contro 171,4 e 172,8 di `50% 50%`). Sotto 768 il video non parte mai: lì i 8,6
punti vengono dal poster riquadrato senza lo zoom 1,14 del commit 16.
Le leve che restano sono di Alberto: un altro punto del loop, un altro taglio
alla codifica, o accettare questi numeri. Titolo, ombra `INK_ON_VIDEO` e
`max-w-[12ch]` non si toccano per rientrare (brief Step 13).

**2. Costo di paint nello sticky, 1440×900, CPU ×4, tetto `max < 4 ms`.** Tre
lanci per sorgente sullo stesso build, a macchina scarica:

| sorgente | max ms (tre lanci) | p95 ms | fotogrammi | esito |
| --- | --- | --- | --- | --- |
| congedo-drone-720 | 7,87 · 3,49 · 4,89 | 1,82 · 1,90 · 1,98 | 490 · 487 · 494 | KO in 2 lanci su 3 |
| congedo-drone-1080 | 8,96 · 6,93 · 7,06 | 1,97 · 2,01 · 1,98 | 489 · 493 · 492 | KO in 3 su 3 |

Il massimo è una statistica di massimo su ~490 fotogrammi e oscilla: le due
passate verdi del 17 settembre (2,56 e 3,24 ms) erano la coda fortunata della
stessa distribuzione, non un altro comportamento. Il p95 invece è stabile e non
distingue le due sorgenti, quindi non può giustificare la 720p da solo. La 720p
resta scritta in `Congedo.tsx` perché taglia le punte ed è la ripiega che spec
§3.18 dice di provare per prima, ma il cancello è rosso con tutt'e due: la scelta
fra accettare il numero, cambiare criterio o cambiare la sorgente è di Alberto.

## 18 · il tuffo delle PageHero: geometria del corridoio (motion ok, DPR 1)

2026-09-18 · commit d57cddc+

| viewport | rotta | section senza corridoio px | section col corridoio px | aggiunta px | Δb px | Δt px | p testo uscito | margine minimo testo-foto px | bordo alto foto a p 0,8 px | centro del segno a y px | foto sul centro del segno da p | copre a p 1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1024×768 | /vendi | 1190 | 1690 | 500 | 422 | 618 | 0.5 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /domande-frequenti | 933 | 1690 | 757 | 165 | 361 | 0.45 | 20 | 108 | 38.4 | 0.9 | sì |
| 1440×900 | /vendi | 1328 | 1980 | 652 | 428 | 535 | 0.4 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /domande-frequenti | 1135 | 1980 | 845 | 235 | 323 | 0.4 | 27 | -29 | 45.0 | 0.75 | sì |
| 1920×1080 | /vendi | 1554 | 2376 | 822 | 474 | 593 | 0.3 | 38 | -158 | 52.0 | 0.4 | sì |
| 1920×1080 | /domande-frequenti | 1458 | 2376 | 918 | 378 | 473 | 0.3 | 29 | -158 | 52.0 | 0.35 | sì |

Regole di spec §5.1: margine > 0, testo uscito entro p 0,6, copertura a p 1. «aggiunta px» si confronta con le stime +690 / +740 / +700. Bordo alto a p 0,8 e p della foto sul centro del segno: dati per la scelta sul tema foto a 1024×768 (spec §5.1 contro §6.1), non soglie di questo commit.

## 18 · il tuffo sotto soglia su /vendi (spec §5.1, D37)

2026-09-18 · commit d57cddc+

| viewport | quota | scrollY | scala di [data-dive-inner] | tetto | scatola all'identità |
| --- | --- | --- | --- | --- | --- |
| 390×664 | scroll 0 | 0 | 1.0000 | 1.06 | sì |
| 390×664 | metà intervallo | 458 | 1.0300 | 1.06 | sì |
| 390×664 | fine intervallo | 842 | 1.0600 | 1.06 | sì |
| 390×664 | fine + 40 px | 882 | 1.0600 | 1.06 | sì |
| 768×1024 | scroll 0 | 0 | 1.0000 | 1.08 | sì |
| 768×1024 | metà intervallo | 479 | 1.0400 | 1.08 | sì |
| 768×1024 | fine intervallo | 855 | 1.0800 | 1.08 | sì |
| 768×1024 | fine + 40 px | 895 | 1.0800 | 1.08 | sì |
| 1440×600 | scroll 0 | 0 | 1.0000 | 1.08 | sì |
| 1440×600 | metà intervallo | 728 | 1.0400 | 1.08 | sì |
| 1440×600 | fine intervallo | 1383 | 1.0800 | 1.08 | sì |
| 1440×600 | fine + 40 px | 1423 | 1.0800 | 1.08 | sì |

Regole: nessuno sticky; scala 1 a scroll 0, fra 1 e il tetto a metà dell'intervallo section top top → banda bottom top, uguale al tetto (±0,005) alla fine e oltre; scatola sempre all'identità.

## 18 · object-position dei fermi 16:9 nelle bande (ritaglio 4:5 del telefono)

2026-09-18 · commit d57cddc+

| rotta | file | W×H | entropia a x 30/40/50/60/70 % | scelta | ritagli |
| --- | --- | --- | --- | --- | --- |
| /metodo | reali/villa-vetrata-lanterne.jpg | 2560×1440 | 6.797 / 6.715 / 6.654 / 6.656 / 6.701 | 30% 50% | misure/18/ritaglio-metodo-<x>.jpg |
| /recensioni | reali/villa-salotto-ombrellone.jpg | 2560×1440 | 7.426 / 7.396 / 7.413 / 7.494 / 7.572 | 70% 50% | misure/18/ritaglio-recensioni-<x>.jpg |
| /privacy | hero_01_attico_travi_salotto.jpg | 1920×1067 | 7.216 / 7.332 / 7.417 / 7.402 / 7.307 | 50% 50% | misure/18/ritaglio-privacy-<x>.jpg |
| /cookie | reali/villa-uliveto.jpg | 2560×1440 | 7.608 / 7.507 / 7.379 / 7.336 / 7.303 | 30% 50% | misure/18/ritaglio-cookie-<x>.jpg |

Regola: vince l'entropia massima, a meno che superi quella a 50 % di meno di 0,05 bit. La scelta si conferma guardando i ritagli e si corregge con `scegli` (18c Step 1).

## 18 · object-position dei fermi corretti a occhio

2026-09-18 · commit d57cddc+

| rotta | misura | scelta a occhio |
| --- | --- | --- |
| /metodo | 30% 50% | 60% 50% |
| /recensioni | 70% 50% | 30% 50% |
| /cookie | 30% 50% | 60% 50% |

Col valore della misura il ritaglio 4:5 tagliava a metà il soggetto della foto (ritagli in misure/18/).

## 18 · calligrafia sulla banda della villa (spec §7.4, nota di D15)

2026-09-18 · commit d57cddc+

| viewport | rotta | px di parola sulla foto | pixel ≥ 3:1 col rosso sotto la parola | immagine | esito |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | /vendi | 0 | - | - | la parola non tocca la foto |
| 1440×900 | /acquista | 0 | - | - | la parola non tocca la foto |
| 1440×900 | /servizi | 22 | 2 % | misure/18/calligrafia-servizi-1440.png | da guardare |
| 1440×900 | /open-domus | 22 | 18 % | misure/18/calligrafia-open-domus-1440.png | da guardare |
| 1440×900 | /metodo | 22 | 97 % | misure/18/calligrafia-metodo-1440.png | da guardare |
| 1440×900 | /recensioni | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /vendi | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /acquista | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /servizi | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /open-domus | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /metodo | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /recensioni | 0 | - | - | la parola non tocca la foto |

La quota aiuta a guardare, non decide: l'esito lo dà il controllo a occhio dei PNG (18c Step 9), scritto con `calligrafia-esito`.

## 18 · esito del controllo a occhio della calligrafia

2026-09-18 · commit d57cddc+

| rotta | esito |
| --- | --- |
| /vendi | leggibile |
| /acquista | leggibile |
| /servizi | illeggibile |
| /open-domus | leggibile |
| /metodo | leggibile |
| /recensioni | leggibile |

Dove l'esito è «illeggibile» PageHero riceve `scriptInset`, cioè `lg:pb-[5.5vw]` (spec §7.4).

## 18 · calligrafia sulla banda della villa (spec §7.4, nota di D15)

2026-09-18 · commit d57cddc+

| viewport | rotta | px di parola sulla foto | pixel ≥ 3:1 col rosso sotto la parola | immagine | esito |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | /vendi | 0 | - | - | la parola non tocca la foto |
| 1440×900 | /acquista | 0 | - | - | la parola non tocca la foto |
| 1440×900 | /servizi | 7 | 1 % | misure/18/calligrafia-servizi-1440.png | da guardare |
| 1440×900 | /open-domus | 22 | 18 % | misure/18/calligrafia-open-domus-1440.png | da guardare |
| 1440×900 | /metodo | 22 | 97 % | misure/18/calligrafia-metodo-1440.png | da guardare |
| 1440×900 | /recensioni | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /vendi | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /acquista | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /servizi | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /open-domus | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /metodo | 0 | - | - | la parola non tocca la foto |
| 1024×768 | /recensioni | 0 | - | - | la parola non tocca la foto |

La quota aiuta a guardare, non decide: l'esito lo dà il controllo a occhio dei PNG (18c Step 9), scritto con `calligrafia-esito`.

## 18 · object-position dei fermi corretti a occhio

2026-09-18 · commit d57cddc+

| rotta | misura | scelta a occhio |
| --- | --- | --- |
| /metodo | 60% 50% | 30% 50% |

Col valore della misura il ritaglio 4:5 tagliava a metà il soggetto della foto (ritagli in misure/18/).

Nota per Alberto su /metodo (terzo ramo della regola di 18c Step 1). La colonna «misura» qui sopra dice
60 % perché `scegli` scrive il valore che trovava nel JSON, cioè la scelta a occhio precedente: la misura
dell'entropia è 30 %, come nella tabella delle entropie. Il soggetto dell'alt di spec §7.5 sono le due
lanterne bianche sul muretto, e **nessuna delle cinque x le tiene tutt'e due intere**: la finestra 4:5
copre il 45 % della larghezza del fermo, le lanterne stanno a circa il 12 % e il 78 %. A 30 % una lanterna
è intera e resta la vetrata, la prima cosa nominata dall'alt; a 40 % si vedono tutt'e due ma tagliate; da
50 % in su la vetrata esce dal ritaglio. Per la regola, quando nessuna x tiene il soggetto intero resta la
x della misura: /metodo torna a `30% 50%`. Vale solo sotto 768 px, perché da lì la cornice è 16:9 come il
fermo e l'`object-position` non taglia nulla.

## 18 · volti di consulenza.jpg nel tuffo (spec §8, origine 50 % 75 %)

2026-09-18 · commit d57cddc+

| viewport | rotta | p | scala | uniforme | immagine |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | /lavora-con-noi | 0.600 | 1.016 | sì | misure/18/volti-lavora-con-noi-1440-06.jpg |
| 1440×900 | /lavora-con-noi | 0.800 | 1.196 | sì | misure/18/volti-lavora-con-noi-1440-08.jpg |
| 1440×900 | /lavora-con-noi | 1.000 | 2.000 | sì | misure/18/volti-lavora-con-noi-1440-1.jpg |
| 1440×900 | /domande-frequenti | 0.600 | 1.016 | sì | misure/18/volti-domande-frequenti-1440-06.jpg |
| 1440×900 | /domande-frequenti | 0.800 | 1.196 | sì | misure/18/volti-domande-frequenti-1440-08.jpg |
| 1440×900 | /domande-frequenti | 1.000 | 2.000 | sì | misure/18/volti-domande-frequenti-1440-1.jpg |
| 1920×1080 | /lavora-con-noi | 0.600 | 1.016 | sì | misure/18/volti-lavora-con-noi-1920-06.jpg |
| 1920×1080 | /lavora-con-noi | 0.800 | 1.196 | sì | misure/18/volti-lavora-con-noi-1920-08.jpg |
| 1920×1080 | /lavora-con-noi | 1.000 | 2.000 | sì | misure/18/volti-lavora-con-noi-1920-1.jpg |
| 1920×1080 | /domande-frequenti | 0.600 | 1.016 | sì | misure/18/volti-domande-frequenti-1920-06.jpg |
| 1920×1080 | /domande-frequenti | 0.800 | 1.196 | sì | misure/18/volti-domande-frequenti-1920-08.jpg |
| 1920×1080 | /domande-frequenti | 1.000 | 2.000 | sì | misure/18/volti-domande-frequenti-1920-1.jpg |

Controllo a occhio (18d Step 3): a p 1 nessun volto tagliato a metà dal bordo dello schermo e nessun volto più alto di metà schermo.

Esito del controllo a occhio (18 set., i dodici JPEG letti uno per uno, prima i quattro a p 1): **la prima
regola cade, la seconda regge.** A p 1 il bordo alto dello schermo taglia il volto della consulente: a
1440×900, su tutt'e due le rotte, restano dentro naso, bocca, guancia e mento e restano fuori occhi e fronte
(`volti-lavora-con-noi-1440-1.jpg`, `volti-domande-frequenti-1440-1.jpg`); a 1920×1080 il taglio scende
ancora e dentro resta il solo mento (`volti-lavora-con-noi-1920-1.jpg`, `volti-domande-frequenti-1920-1.jpg`).
La seconda regge ovunque: il volto visibile è alto circa 130 px su 900, molto meno di metà schermo. L'origine
`50 % 75 %` è una cifra di spec §5.1 e il commit 18 non la cambia: la scelta va ad Alberto.

## 18 · il tuffo delle PageHero: geometria del corridoio (motion ok, DPR 1)

2026-09-18 · commit d57cddc+

| viewport | rotta | section senza corridoio px | section col corridoio px | aggiunta px | Δb px | Δt px | p testo uscito | margine minimo testo-foto px | bordo alto foto a p 0,8 px | centro del segno a y px | foto sul centro del segno da p | copre a p 1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1024×768 | /vendi | 1190 | 1690 | 500 | 422 | 618 | 0.5 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /acquista | 1075 | 1690 | 615 | 307 | 503 | 0.45 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /servizi | 903 | 1690 | 787 | 135 | 331 | 0.45 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /metodo | 933 | 1690 | 757 | 165 | 361 | 0.45 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /chi-siamo | 855 | 1690 | 835 | 87 | 283 | 0.4 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /recensioni | 1034 | 1690 | 656 | 266 | 462 | 0.45 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /open-domus | 963 | 1690 | 727 | 195 | 391 | 0.45 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /lavora-con-noi | 1075 | 1690 | 615 | 307 | 503 | 0.45 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /domande-frequenti | 933 | 1690 | 757 | 165 | 361 | 0.45 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /privacy | 903 | 1690 | 787 | 135 | 331 | 0.45 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /cookie | 873 | 1690 | 817 | 105 | 301 | 0.4 | 20 | 107 | 38.4 | 0.9 | sì |
| 1440×900 | /vendi | 1328 | 1980 | 652 | 428 | 535 | 0.4 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /acquista | 1224 | 1980 | 756 | 324 | 409 | 0.45 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /servizi | 1213 | 1980 | 767 | 313 | 399 | 0.45 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /metodo | 1135 | 1980 | 845 | 235 | 323 | 0.4 | 27 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /chi-siamo | 1123 | 1980 | 857 | 223 | 309 | 0.4 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /recensioni | 1259 | 1980 | 721 | 359 | 449 | 0.45 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /open-domus | 1135 | 1980 | 845 | 235 | 323 | 0.4 | 27 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /lavora-con-noi | 1272 | 1980 | 708 | 372 | 465 | 0.45 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /domande-frequenti | 1135 | 1980 | 845 | 235 | 323 | 0.4 | 27 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /privacy | 1088 | 1980 | 892 | 188 | 274 | 0.4 | 29 | -28 | 45.0 | 0.75 | sì |
| 1440×900 | /cookie | 1088 | 1980 | 892 | 188 | 274 | 0.4 | 29 | -28 | 45.0 | 0.75 | sì |
| 1920×1080 | /vendi | 1554 | 2376 | 822 | 474 | 593 | 0.3 | 38 | -158 | 52.0 | 0.4 | sì |
| 1920×1080 | /acquista | 1479 | 2376 | 897 | 399 | 499 | 0.3 | 38 | -159 | 52.0 | 0.35 | sì |
| 1920×1080 | /servizi | 1555 | 2376 | 821 | 475 | 594 | 0.3 | 38 | -159 | 52.0 | 0.4 | sì |
| 1920×1080 | /metodo | 1458 | 2376 | 918 | 378 | 473 | 0.3 | 29 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /chi-siamo | 1381 | 2376 | 995 | 301 | 376 | 0.3 | 29 | -159 | 52.0 | 0.35 | sì |
| 1920×1080 | /recensioni | 1473 | 2376 | 903 | 393 | 491 | 0.3 | 38 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /open-domus | 1458 | 2376 | 918 | 378 | 473 | 0.3 | 29 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /lavora-con-noi | 1535 | 2376 | 841 | 455 | 569 | 0.3 | 29 | -158 | 52.0 | 0.4 | sì |
| 1920×1080 | /domande-frequenti | 1458 | 2376 | 918 | 378 | 473 | 0.3 | 29 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /privacy | 1390 | 2376 | 986 | 310 | 388 | 0.25 | 38 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /cookie | 1390 | 2376 | 986 | 310 | 388 | 0.25 | 38 | -158 | 52.0 | 0.35 | sì |

Regole di spec §5.1: margine > 0, testo uscito entro p 0,6, copertura a p 1. «aggiunta px» si confronta con le stime +690 / +740 / +700. Bordo alto a p 0,8 e p della foto sul centro del segno: dati per la scelta sul tema foto a 1024×768 (spec §5.1 contro §6.1), non soglie di questo commit.

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-18, d57cddc+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 34998 | 0 |  | ok |
| 1024×768 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 30308 | 0 |  | ok |
| 1920×1080 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 39613 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 22352 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 23193 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 28479 | 0 |  | ok |
| 1440×900 | /vendi | page-dive | page-dive | 1 | 17034 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 24223) | ok |

## 18 · iPad Pro 1024×1366 a scroll 0 (spec §9.3)

2026-09-18 · commit d57cddc+

| viewport | rotta | corridoio acceso | CLS | avorio sotto la banda px | immagine |
| --- | --- | --- | --- | --- | --- |
| 1024×1366 DPR 2 | /vendi | sì | 0.0000 | 146 | misure/18/ipad-vendi.png |
| 1024×1366 DPR 2 | /acquista | sì | 0.0000 | 261 | misure/18/ipad-acquista.png |
| 1024×1366 DPR 2 | /servizi | sì | 0.0000 | 433 | misure/18/ipad-servizi.png |
| 1024×1366 DPR 2 | /metodo | sì | 0.0000 | 403 | misure/18/ipad-metodo.png |
| 1024×1366 DPR 2 | /chi-siamo | sì | 0.0000 | 493 | misure/18/ipad-chi-siamo.png |
| 1024×1366 DPR 2 | /recensioni | sì | 0.0000 | 302 | misure/18/ipad-recensioni.png |
| 1024×1366 DPR 2 | /open-domus | sì | 0.0000 | 373 | misure/18/ipad-open-domus.png |
| 1024×1366 DPR 2 | /lavora-con-noi | sì | 0.0000 | 261 | misure/18/ipad-lavora-con-noi.png |
| 1024×1366 DPR 2 | /domande-frequenti | sì | 0.0000 | 403 | misure/18/ipad-domande-frequenti.png |
| 1024×1366 DPR 2 | /privacy | sì | 0.0000 | 433 | misure/18/ipad-privacy.png |
| 1024×1366 DPR 2 | /cookie | sì | 0.0000 | 463 | misure/18/ipad-cookie.png |

Regola: CLS 0 su ogni rotta. L'avorio sotto la banda dentro lo schermo sticky non è una soglia: le immagini vanno ad Alberto.

## 18 · D33: LCP a 390×664 DPR 3, CPU ×4, Slow 4G, contro la base del commit 2

2026-09-18 · commit d57cddc+

| rotta | base ms | ramo ms | Δ ms | tetto ms | elemento | w servito | 133vw stimato ms | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /vendi | 1352 | 3204 | 1852 | 1502 | IMG | 2560 | 2256 (con route: 2976 → 2028, w 1920) | sfora anche a 133vw |
| /acquista | 1348 | 3404 | 2056 | 1498 | IMG | 2560 | 2340 (con route: 3096 → 2032, w 1920) | sfora anche a 133vw |
| /metodo | 1324 | 1924 | 600 | 1474 | IMG | 2560 | 1528 (con route: 1664 → 1268, w 1920) | sfora anche a 133vw |

Base: commit 1a77744 del 2026-09-18 (390×664 DPR 3, CPU ×4, Slow 4G (1,6 Mbps, 750 kbps, 150 ms RTT), 5 giri dopo un giro di riscaldo, senza consenso, sipario saltato), la stessa della chiusura. Soglie di spec §5.1 e §9.3: ramo ≤ base + 150 ms e ≤ 2,5 s se la base sta sotto 2,5 s. Sfora anche 133vw, o supera 2,5 s con la base sotto: il blocco si ferma e riferisce questi numeri.

## 18 · D33: LCP a 390×664 DPR 3, CPU ×4, Slow 4G, contro la base del commit 2

2026-09-18 · commit d57cddc+

| rotta | base ms | ramo ms | Δ ms | tetto ms | elemento | w servito | 133vw stimato ms | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /vendi | 1352 | 3212 | 1860 | 1502 | IMG | 2560 | 2268 (con route: 2972 → 2028, w 1920) | sfora anche a 133vw |
| /acquista | 1348 | 3384 | 2036 | 1498 | IMG | 2560 | 2336 (con route: 3092 → 2044, w 1920) | sfora anche a 133vw |
| /metodo | 1324 | 1924 | 600 | 1474 | IMG | 2560 | 1516 (con route: 1660 → 1252, w 1920) | sfora anche a 133vw |

Base: commit 1a77744 del 2026-09-18 (390×664 DPR 3, CPU ×4, Slow 4G (1,6 Mbps, 750 kbps, 150 ms RTT), 5 giri dopo un giro di riscaldo, senza consenso, sipario saltato), la stessa della chiusura. Soglie di spec §5.1 e §9.3: ramo ≤ base + 150 ms e ≤ 2,5 s se la base sta sotto 2,5 s. Sfora anche 133vw, o supera 2,5 s con la base sotto: il blocco si ferma e riferisce questi numeri.

## 18 · D64: i numeri di oggi si tengono (deroga di Alberto a D33 sull'LCP del telefono)

2026-09-18 · commit d57cddc+

| rotta | base ms | ramo ms | Δ ms | tetto ms | esito di D33 | decisione |
| --- | --- | --- | --- | --- | --- | --- |
| /vendi | 1352 | 3212 | 1860 | 1502 | sfora, anche a 133vw | D64: si tiene |
| /acquista | 1348 | 3384 | 2036 | 1498 | sfora, anche a 133vw | D64: si tiene |
| /metodo | 1324 | 1924 | 600 | 1474 | sfora, anche a 133vw | D64: si tiene |

D64 (Alberto, 18 settembre 2026, riferita dal coordinatore): «tenere i numeri di oggi». Viste le tre alternative — ritagli a 780 px, ritagli a 1170 px, niente foto della villa sotto 768 — le foto della villa restano intere: `BAND_SIZES` e `SHARP_SIZES` restano quelli di D33 (200vw sotto 768, 108vw fino a 1023, 100vw da 1024; strato nitido 200vw), nessun ritaglio per il telefono e nessun calo di qualità (resta `quality={60}`). Il criterio di D33 in spec §5.1 smette di valere come cancello per il commit 18: l'LCP mediano sul telefono resta sopra il tetto e i numeri della tabella qui sopra sono quelli che entrano nel ramo. Il costo sta nei byte della banda nuova prima che nei `sizes` (sonda del giro precedente su `/_next/image` con `q=60`: la testa di repertorio di /vendi pesa ~54 KB a w 1280, la banda della villa ~89 KB a w 1280, ~176 KB a w 1920 e ~279 KB a w 2560), quindi nemmeno la variante 133vw del brief basterebbe. La riga di D64 nei due registri la scrive il commit 22.

## 18 · il tuffo delle PageHero: geometria del corridoio (motion ok, DPR 1)

2026-09-18 · commit d8281d8+

| viewport | rotta | section senza corridoio px | section col corridoio px | aggiunta px | Δb px | Δt px | p testo uscito | p calligrafia uscita | calligrafia sulla foto a 180 px | margine minimo testo-foto px | bordo alto foto a p 0,8 px | centro del segno a y px | foto sul centro del segno da p | copre a p 1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1024×768 | /vendi | 1190 | 1690 | 500 | 422 | 618 | 0.5 | 0.15 | -500 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /acquista | 1075 | 1690 | 615 | 307 | 503 | 0.45 | 0.2 | -339 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /servizi | 903 | 1690 | 787 | 135 | 339 | 0.4 | 0.45 | -127 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /metodo | 933 | 1690 | 757 | 165 | 361 | 0.45 | 0.3 | -198 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /chi-siamo | 855 | 1690 | 835 | 87 | 283 | 0.4 | 0.3 | -165 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /recensioni | 1034 | 1690 | 656 | 266 | 462 | 0.45 | 0.2 | -344 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /open-domus | 963 | 1690 | 727 | 195 | 391 | 0.45 | 0.25 | -228 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /lavora-con-noi | 1075 | 1690 | 615 | 307 | 503 | 0.45 | 0.25 | -294 | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /domande-frequenti | 933 | 1690 | 757 | 165 | 361 | 0.45 | 0.3 | -198 | 20 | 108 | 38.4 | 0.9 | sì |
| 1024×768 | /privacy | 903 | 1690 | 787 | 135 | 331 | 0.45 | - | - | 20 | 107 | 38.4 | 0.9 | sì |
| 1024×768 | /cookie | 873 | 1690 | 817 | 105 | 301 | 0.4 | - | - | 20 | 107 | 38.4 | 0.9 | sì |
| 1440×900 | /vendi | 1328 | 1980 | 652 | 428 | 535 | 0.4 | 0.2 | -285 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /acquista | 1224 | 1980 | 756 | 324 | 409 | 0.45 | 0.35 | -107 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /servizi | 1213 | 1980 | 767 | 313 | 435 | 0.35 | 0.45 | -50 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /metodo | 1135 | 1980 | 845 | 235 | 372 | 0.3 | 0.45 | -43 | 27 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /chi-siamo | 1123 | 1980 | 857 | 223 | 309 | 0.4 | 0.4 | -70 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /recensioni | 1259 | 1980 | 721 | 359 | 449 | 0.45 | 0.25 | -208 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /open-domus | 1135 | 1980 | 845 | 235 | 372 | 0.3 | 0.45 | -43 | 27 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /lavora-con-noi | 1272 | 1980 | 708 | 372 | 465 | 0.45 | 0.4 | -95 | 29 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /domande-frequenti | 1135 | 1980 | 845 | 235 | 372 | 0.3 | 0.45 | -43 | 27 | -29 | 45.0 | 0.75 | sì |
| 1440×900 | /privacy | 1088 | 1980 | 892 | 188 | 274 | 0.4 | - | - | 29 | -28 | 45.0 | 0.75 | sì |
| 1440×900 | /cookie | 1088 | 1980 | 892 | 188 | 274 | 0.4 | - | - | 29 | -28 | 45.0 | 0.75 | sì |
| 1920×1080 | /vendi | 1554 | 2376 | 822 | 474 | 593 | 0.3 | 0.2 | -188 | 38 | -158 | 52.0 | 0.4 | sì |
| 1920×1080 | /acquista | 1479 | 2376 | 897 | 399 | 499 | 0.3 | 0.25 | -106 | 38 | -159 | 52.0 | 0.35 | sì |
| 1920×1080 | /servizi | 1555 | 2376 | 821 | 475 | 594 | 0.3 | 0.35 | -34 | 38 | -159 | 52.0 | 0.4 | sì |
| 1920×1080 | /metodo | 1458 | 2376 | 918 | 378 | 473 | 0.3 | 0.35 | -6 | 29 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /chi-siamo | 1381 | 2376 | 995 | 301 | 376 | 0.3 | 0.4 | 1 | 29 | -159 | 52.0 | 0.35 | sì |
| 1920×1080 | /recensioni | 1473 | 2376 | 903 | 393 | 491 | 0.3 | 0.25 | -100 | 38 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /open-domus | 1458 | 2376 | 918 | 378 | 473 | 0.3 | 0.35 | -6 | 29 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /lavora-con-noi | 1535 | 2376 | 841 | 455 | 569 | 0.3 | 0.35 | -13 | 29 | -158 | 52.0 | 0.4 | sì |
| 1920×1080 | /domande-frequenti | 1458 | 2376 | 918 | 378 | 473 | 0.3 | 0.35 | -6 | 29 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /privacy | 1390 | 2376 | 986 | 310 | 388 | 0.25 | - | - | 38 | -158 | 52.0 | 0.35 | sì |
| 1920×1080 | /cookie | 1390 | 2376 | 986 | 310 | 388 | 0.25 | - | - | 38 | -158 | 52.0 | 0.35 | sì |

Regole di spec §5.1: margine > 0, testo e calligrafia usciti entro p 0,6 (Δt col fondo della calligrafia, DIVE_BOTTOM_SEL), copertura a p 1. «calligrafia sulla foto a 180 px» è la stima di spec §5.1, un dato e non una soglia (≤ 0: già fuori dalla foto). «p testo uscito» e il margine leggono i soli `data-dive-text`: la calligrafia a p 0 attraversa la foto per scelta (DESIGN.md:583). «aggiunta px» si confronta con le stime +690 / +740 / +700. Bordo alto a p 0,8 e p della foto sul centro del segno: dati per la scelta sul tema foto a 1024×768 (spec §5.1 contro §6.1), non soglie di questo commit.

## 18 · volti di consulenza.jpg nel tuffo (spec §8, origine 50 % 75 %)

2026-09-18 · commit d8281d8+

| viewport | rotta | p | scala | uniforme | immagine |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | /lavora-con-noi | 0.600 | 1.016 | sì | misure/18/volti-lavora-con-noi-1440-06.jpg |
| 1440×900 | /lavora-con-noi | 0.800 | 1.196 | sì | misure/18/volti-lavora-con-noi-1440-08.jpg |
| 1440×900 | /lavora-con-noi | 1.000 | 2.000 | sì | misure/18/volti-lavora-con-noi-1440-1.jpg |
| 1440×900 | /domande-frequenti | 0.600 | 1.016 | sì | misure/18/volti-domande-frequenti-1440-06.jpg |
| 1440×900 | /domande-frequenti | 0.800 | 1.196 | sì | misure/18/volti-domande-frequenti-1440-08.jpg |
| 1440×900 | /domande-frequenti | 1.000 | 2.000 | sì | misure/18/volti-domande-frequenti-1440-1.jpg |
| 1920×1080 | /lavora-con-noi | 0.600 | 1.016 | sì | misure/18/volti-lavora-con-noi-1920-06.jpg |
| 1920×1080 | /lavora-con-noi | 0.800 | 1.196 | sì | misure/18/volti-lavora-con-noi-1920-08.jpg |
| 1920×1080 | /lavora-con-noi | 1.000 | 2.000 | sì | misure/18/volti-lavora-con-noi-1920-1.jpg |
| 1920×1080 | /domande-frequenti | 0.600 | 1.016 | sì | misure/18/volti-domande-frequenti-1920-06.jpg |
| 1920×1080 | /domande-frequenti | 0.800 | 1.196 | sì | misure/18/volti-domande-frequenti-1920-08.jpg |
| 1920×1080 | /domande-frequenti | 1.000 | 2.000 | sì | misure/18/volti-domande-frequenti-1920-1.jpg |

Controllo a occhio (18d Step 3): a p 1 nessun volto tagliato a metà dal bordo dello schermo e nessun volto più alto di metà schermo.

Esito del controllo a occhio dopo il giro di correzione 1 del commit 18 (18 set.), sui dodici JPEG rigenerati: il
fondo del testo di Δt comprende ora la calligrafia (spec §5.1), e a p 0,8 e 1 «Domande» e «Insieme» non stanno più
al bordo alto sopra la foto (sei JPEG cambiati: `…-domande-frequenti-1440-{06,08,1}`, `…-domande-frequenti-1920-{08,1}`,
`…-lavora-con-noi-1440-1`; gli altri sei sono identici byte per byte). I volti non cambiano, perché il moto netto della
banda (−Δb) e lo zoom non dipendono da Δt: **la prima regola cade ancora, la seconda regge.** A p 1 a 1440×900 restano
dentro naso, bocca e mento e fuori occhi e fronte; a 1920×1080 resta dentro il solo mento.

Dato per la scelta di Alberto (sonda fuori dal repo, testa della consulente in `consulenza.jpg` 1920×1625 letta a
occhio: capelli a y 450, occhi a 605, mento a 700): con l'origine di oggi, 75 %, a p 1 gli occhi stanno a −19 px a
1440×900 e a −145 px a 1920×1080. Tengono la testa intera dentro lo schermo, con la foto che copre ancora tutto lo
schermo, le origini verticali fra 15 e 40 % a 1440×900 e fra 5 e 30 % a 1920×1080: in comune 15-30 % (per esempio
`50% 25%` sulle sole due rotte di `consulenza.jpg`). La testa intera resta sotto metà schermo (375 px su 900, 500 su
1080). L'origine `50 % 75 %` è una cifra di spec §5.1: la scelta resta ad Alberto (accettare, un'origine per rotta,
un'altra foto) e il commit 18 non la cambia.

## 19 · ricarica e navigazione nuova («prima»)

2026-09-18 · commit 251dfe4+ · scripts/probe-intro-reload.mjs, mediana di 5 giri, senza consenso. 1440×900 senza freno; 390×664 DPR 3, CPU ×4, 1,6 Mbps / 150 ms.

| caso | rotta | fase | LCP ms | elemento | CLS max | sipario | caduta ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440 | / | ricarica | 128 | IMG | 0 | nessuno nessuno nessuno nessuno nessuno | — |
| 1440 | / | nuova | 128 | IMG | 0 | nessuno nessuno nessuno nessuno nessuno | — |
| 1440 | /vendi | ricarica | 104 | IMG | 0 | nessuno nessuno nessuno nessuno nessuno | — |
| 1440 | /vendi | nuova | 100 | IMG | 0 | nessuno nessuno nessuno nessuno nessuno | — |
| 1440 | /contatti | ricarica | 68 | H1 | 0 | nessuno nessuno nessuno nessuno nessuno | — |
| 1440 | /contatti | nuova | 60 | H1 | 0 | nessuno nessuno nessuno nessuno nessuno | — |
| 390-lento | / | ricarica | 1892 | IMG | 0.0002 | nessuno nessuno nessuno nessuno nessuno | — |
| 390-lento | / | nuova | 1856 | IMG | 0.0002 | nessuno nessuno nessuno nessuno nessuno | — |
| 390-lento | /vendi | ricarica | 3248 | IMG | 0.0002 | nessuno nessuno nessuno nessuno nessuno | — |
| 390-lento | /vendi | nuova | 3256 | IMG | 0.0002 | nessuno nessuno nessuno nessuno nessuno | — |
| 390-lento | /contatti | ricarica | 1124 | P | 0.0002 | nessuno nessuno nessuno nessuno nessuno | — |
| 390-lento | /contatti | nuova | 1108 | P | 0.0002 | nessuno nessuno nessuno nessuno nessuno | — |

## 19 · porta corta con motion attivo

2026-09-18 · commit 251dfe4+ · misure/19-preloader-corta.mjs, 3 giri per caso, consenso accettato. Attesi: dt-pre-door 0/1100 ms, dt-pre-dive 880/1500 ms, dt-pre-autohide 2480/500 ms; handoff in [830, 1180] ms a 1440 e [830, 1500] ms a 390; caduta ≤ 2980 ms; pannello e anelli eco rgb(244, 236, 226).

| viewport | caso | giro | data-preloader | keyframe delay/durata ms | handoff ms | caduta ms | contenuto | sagoma | pannello | anelli eco | partenza vh | risalite | fotogrammi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | interna /acquista | 1 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 944 | 2445 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 142 |
| 1440×900 | interna /acquista | 2 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 949 | 2450 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 141 |
| 1440×900 | interna /acquista | 3 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 961 | 2462 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 142 |
| 1440×900 | home / dopo il film | 1 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 954 | 2456 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 137 |
| 1440×900 | home / dopo il film | 2 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 970 | 2471 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 138 |
| 1440×900 | home / dopo il film | 3 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 957 | 2458 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 138 |
| 390×664 | interna /acquista | 1 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 951 | 2451 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 142 |
| 390×664 | interna /acquista | 2 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 960 | 2460 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 141 |
| 390×664 | interna /acquista | 3 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 960 | 2461 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 142 |
| 390×664 | home / dopo il film | 1 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 968 | 2471 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 138 |
| 390×664 | home / dopo il film | 2 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 966 | 2468 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 138 |
| 390×664 | home / dopo il film | 3 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 968 | 2469 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 139 |

Regole rispettate.

## 19 · ricarica e navigazione nuova («dopo»)

2026-09-18 · commit 251dfe4+ · scripts/probe-intro-reload.mjs, mediana di 5 giri, senza consenso. 1440×900 senza freno; 390×664 DPR 3, CPU ×4, 1,6 Mbps / 150 ms.

| caso | rotta | fase | LCP ms | elemento | CLS max | sipario | caduta ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440 | / | ricarica | 136 | IMG | 0 | short short short short short | 2450 |
| 1440 | / | nuova | 136 | IMG | 0 | short short short short short | 2440 |
| 1440 | /vendi | ricarica | 104 | IMG | 0 | short-page short-page short-page short-page short-page | 2423 |
| 1440 | /vendi | nuova | 104 | IMG | 0 | short-page short-page short-page short-page short-page | 2432 |
| 1440 | /contatti | ricarica | 60 | H1 | 0 | short-page short-page short-page short-page short-page | 2406 |
| 1440 | /contatti | nuova | 64 | H1 | 0 | short-page short-page short-page short-page short-page | 2410 |
| 390-lento | / | ricarica | 1924 | IMG | 0.0002 | short short short short short | 2994 |
| 390-lento | / | nuova | 1896 | IMG | 0.0002 | short short short short short | 2989 |
| 390-lento | /vendi | ricarica | 3216 | IMG | 0.0002 | short-page short-page short-page short-page short-page | 2761 |
| 390-lento | /vendi | nuova | 3248 | IMG | 0.0002 | short-page short-page short-page short-page short-page | 2765 |
| 390-lento | /contatti | ricarica | 1112 | P | 0.0002 | short-page short-page short-page short-page short-page | 2479 |
| 390-lento | /contatti | nuova | 1100 | P | 0.0002 | short-page short-page short-page short-page short-page | 2488 |

Deroga da portare ad Alberto (caduta a 390 lento oltre SHORT_MS + 600 ms, lane-globali §4.9):
- 390-lento / ricarica: caduta 2994 ms, fra 2980 e 3880
- 390-lento / nuova: caduta 2989 ms, fra 2980 e 3880

## 19 · ricarica e navigazione nuova («dopo»)

2026-09-18 · commit 4293262+ · scripts/probe-intro-reload.mjs, mediana di 5 giri, senza consenso. 1440×900 senza freno; 390×664 DPR 3, CPU ×4, 1,6 Mbps / 150 ms.

| caso | rotta | fase | LCP ms | elemento | CLS max | sipario | caduta ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440 | / | ricarica | 140 | IMG | 0 | short short short short short | 2445 |
| 1440 | / | nuova | 140 | IMG | 0 | short short short short short | 2444 |
| 1440 | /vendi | ricarica | 104 | IMG | 0 | short-page short-page short-page short-page short-page | 2430 |
| 1440 | /vendi | nuova | 108 | IMG | 0 | short-page short-page short-page short-page short-page | 2437 |
| 1440 | /contatti | ricarica | 64 | H1 | 0 | short-page short-page short-page short-page short-page | 2413 |
| 1440 | /contatti | nuova | 64 | H1 | 0 | short-page short-page short-page short-page short-page | 2407 |
| 390-lento | / | ricarica | 1976 | IMG | 0.0002 | short short short short short | 3227 |
| 390-lento | / | nuova | 1988 | IMG | 0.0002 | short short short short short | 3214 |
| 390-lento | /vendi | ricarica | 3220 | IMG | 0.0002 | short-page short-page short-page short-page short-page | 2708 |
| 390-lento | /vendi | nuova | 3244 | IMG | 0.0002 | short-page short-page short-page short-page short-page | 2711 |
| 390-lento | /contatti | ricarica | 1096 | P | 0.0002 | short-page short-page short-page short-page short-page | 2485 |
| 390-lento | /contatti | nuova | 1096 | P | 0.0002 | short-page short-page short-page short-page short-page | 2482 |

Soglie NON rispettate:
- 390-lento / nuova: LCP 1988 > prima 1856 + 100

Deroga da portare ad Alberto (caduta a 390 lento oltre SHORT_MS + 600 ms, lane-globali §4.9):
- 390-lento / ricarica: caduta 3227 ms, fra 2980 e 3880
- 390-lento / nuova: caduta 3214 ms, fra 2980 e 3880

## 19 · ricarica e navigazione nuova («dopo»)

2026-09-18 · commit 4293262+ · scripts/probe-intro-reload.mjs, mediana di 5 giri, senza consenso. 1440×900 senza freno; 390×664 DPR 3, CPU ×4, 1,6 Mbps / 150 ms.

| caso | rotta | fase | LCP ms | elemento | CLS max | sipario | caduta ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440 | / | ricarica | 136 | IMG | 0 | short short short short short | 2450 |
| 1440 | / | nuova | 140 | IMG | 0 | short short short short short | 2447 |
| 1440 | /vendi | ricarica | 96 | IMG | 0 | short-page short-page short-page short-page short-page | 2426 |
| 1440 | /vendi | nuova | 108 | IMG | 0 | short-page short-page short-page short-page short-page | 2426 |
| 1440 | /contatti | ricarica | 64 | H1 | 0 | short-page short-page short-page short-page short-page | 2408 |
| 1440 | /contatti | nuova | 64 | H1 | 0 | short-page short-page short-page short-page short-page | 2414 |
| 390-lento | / | ricarica | 1892 | IMG | 0.0002 | short short short short short | 3026 |
| 390-lento | / | nuova | 1916 | IMG | 0.0002 | short short short short short | 2971 |
| 390-lento | /vendi | ricarica | 3244 | IMG | 0.0002 | short-page short-page short-page short-page short-page | 2877 |
| 390-lento | /vendi | nuova | 3304 | IMG | 0.0002 | short-page short-page short-page short-page short-page | 2886 |
| 390-lento | /contatti | ricarica | 1112 | P | 0.0002 | short-page short-page short-page short-page short-page | 2484 |
| 390-lento | /contatti | nuova | 1116 | P | 0.0002 | short-page short-page short-page short-page short-page | 2479 |

Deroga da portare ad Alberto (caduta a 390 lento oltre SHORT_MS + 600 ms, lane-globali §4.9):
- 390-lento / ricarica: caduta 3026 ms, fra 2980 e 3880

## 19 · porta corta con motion attivo

2026-09-18 · commit 4293262+ · misure/19-preloader-corta.mjs, 3 giri per caso, consenso accettato. Attesi: dt-pre-door 0/1100 ms, dt-pre-dive 880/1500 ms, dt-pre-autohide 2480/500 ms; handoff in [830, 1180] ms a 1440 e [830, 1500] ms a 390; caduta ≤ 2980 ms; pannello e anelli eco rgb(244, 236, 226).

| viewport | caso | giro | data-preloader | keyframe delay/durata ms | handoff ms | caduta ms | contenuto | sagoma | pannello | anelli eco | partenza vh | risalite | fotogrammi |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | interna /acquista | 1 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 941 | 2442 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 141 |
| 1440×900 | interna /acquista | 2 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 954 | 2455 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 142 |
| 1440×900 | interna /acquista | 3 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 976 | 2477 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 142 |
| 1440×900 | home / dopo il film | 1 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 961 | 2463 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 136 |
| 1440×900 | home / dopo il film | 2 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 993 | 2494 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 139 |
| 1440×900 | home / dopo il film | 3 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 967 | 2468 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 138 |
| 390×664 | interna /acquista | 1 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 943 | 2444 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 140 |
| 390×664 | interna /acquista | 2 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 970 | 2472 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 142 |
| 390×664 | interna /acquista | 3 | short-page | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 943 | 2444 | none | none 0.9s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 141 |
| 390×664 | home / dopo il film | 1 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 951 | 2452 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 137 |
| 390×664 | home / dopo il film | 2 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 980 | 2481 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 140 |
| 390×664 | home / dopo il film | 3 | short | dt-pre-door 0/1100, dt-pre-dive 880/1500, dt-pre-autohide 2480/500 | 983 | 2483 | none | block 0.3s | rgb(244, 236, 226) | rgb(244, 236, 226) | 104 | 0 | 139 |

Regole rispettate.

### 19 · nota del giro di correzione 1 (D65)

2026-09-18. Le tre sezioni qui sopra (due volte la sonda «dopo», porta corta) e la 19b qui sotto sono state lanciate sul build col guardiano della ricarica (D65); `19-intro-reload-dopo.json` è quello del secondo lancio. Il primo lancio della sonda «dopo» è uscito 1 per l'LCP di «/» a 390 lento in navigazione nuova (1988 contro 1856 + 100): la navigazione nuova non arma il guardiano (solo `nav === "reload"`), e il secondo lancio, sullo stesso build, dà 1916 ed esce 2. La deroga resta: a 390 lento su «/» l'attributo cade a 3026 ms (ricarica) e 2971 ms (nuova) nel secondo lancio, 3227 e 3214 nel primo, contro 2980. Nessuna soglia cambiata: la decisione è di Alberto e il push del blocco aspetta la sua risposta.

### 19 · la caduta dell'attributo sulla porta corta (D69)

2026-09-18, decisione del coordinatore (D69). Sulla porta corta a «/» a 390 lento l'attributo `data-preloader` cade 9-14 ms dopo `PRE_SHORT_FAILSAFE_MS` (2980 ms), cioè a 2989-2994 ms. A 2,48 s l'autohide ha già fatto svanire il sipario: in quei millisecondi non c'è niente da vedere, è ritardo del timer e si accetta. Nessuna soglia cambia e nessun codice si tocca. La tabella «dopo» qui sopra, mediana di 5 giri, segna per lo stesso caso 3026 ms in ricarica e 2971 in navigazione nuova: è lo stesso fenomeno misurato in giri diversi.

## 19b · ricarica a 0.3 schermi su «/» con la corta (D65)

2026-09-18 · commit 4293262+ · misure/19b-ricarica-cima.mjs, 3 giri per caso, consenso accettato, chiave INTRO_FILM. 1440×900 senza freno; 390×664 DPR 3, CPU ×4, 1,6 Mbps / 150 ms. «fuori dalla cima» = fotogrammi rAF sotto l'attributo con scrollY > 1; «porta min» = la quota più alta della porta in quei fotogrammi, in % di innerHeight (≥ 100: sotto il bordo, pagina coperta). Tempi in ms dall'armamento.

| viewport | giro | scrollY prima | data-preloader | fotogrammi sotto | fuori dalla cima | porta min % | porta aperta fuori cima | scrollY max dopo (3000 ms) | caduta | load | ritiro guardiano | scrollRestoration ritiro / refresh ST |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440 | 1 | 270 | short | 139 | 1 (max 270) | 104 | 0 | 0 | 2393 | 17 | 2393 | auto / auto |
| 1440 | 2 | 270 | short | 140 | 1 (max 270) | 104 | 0 | 0 | 2390 | 18 | 2390 | auto / auto |
| 1440 | 3 | 270 | short | 139 | 1 (max 270) | 104 | 0 | 0 | 2389 | 22 | 2389 | auto / auto |
| 390-lento | 1 | 199 | short | 126 | 1 (max 199) | 104 | 0 | 0 | 3241 | 3678 | 3854 | auto / auto |
| 390-lento | 2 | 199 | short | 126 | 1 (max 199) | 104 | 0 | 0 | 3111 | 3490 | 3631 | auto / auto |
| 390-lento | 3 | 199 | short | 127 | 1 (max 199) | 104 | 0 | 0 | 3200 | 3598 | 3744 | auto / auto |

Regole rispettate.

## 20 · segno fisso e tema

2026-09-18 · commit c3b1c9c+ · misure/20-segno.mjs --parte segno. Attesi (spec §6.1, M1): da 1280 centro = slot + (4vw − slot)·k ±1 px e lato = 56 + (clamp − 56)·k ±1 con k = scroll/testata (1 oltre la testata), badge a opacità 0; fra 1024 e 1279 centro a 4vw ±1, opacità q ±0,03 e lato clamp·(0,8 + 0,2·q) ±1 con q = clamp((scroll − 0,5·testata)/(0,5·testata), 0, 1); risalendo a 0 di nuovo sullo slot (o a opacità 0).

| viewport | scroll | y letto | hidden | opacità | attesa | centro x | atteso x | lato | atteso lato | badge op. | tema |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1440×900 | 0,25·testata | 23 | false | 1.00 | 1.00 | 121.3 | 121.8 | 55.5 | 55.5 | 0.00 | grafite |
| 1440×900 | 0,5·testata | 45 | false | 1.00 | 1.00 | 100.4 | 100.4 | 55.0 | 55.0 | 0.00 | grafite |
| 1440×900 | 0,75·testata | 68 | false | 1.00 | 1.00 | 78.5 | 79.0 | 54.5 | 54.5 | 0.00 | foto |
| 1440×900 | testata | 90 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | 1200 | 1200 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0,25·testata | 20 | false | 1.00 | 1.00 | 110.6 | 110.6 | 54.0 | 54.0 | 0.00 | grafite |
| 1280×800 | 0,5·testata | 40 | false | 1.00 | 1.00 | 90.8 | 90.8 | 52.0 | 52.0 | 0.00 | grafite |
| 1280×800 | 0,75·testata | 60 | false | 1.00 | 1.00 | 71.0 | 71.0 | 50.0 | 50.0 | 0.00 | foto |
| 1280×800 | testata | 80 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | 1200 | 1200 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1024×768 | 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,25·testata | 19 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,5·testata | 38 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,75·testata | 58 | false | 0.51 | 0.51 | 41.0 | 41.0 | 36.1 | 36.1 | — | foto |
| 1024×768 | testata | 77 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | 1200 | 1200 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | ritorno a 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | foto |

Tema a 1440 su «/», passi da 450 px: 76 passi, 6 con una foto sotto il centro, 0 col tema sbagliato.

Rilevatore (querySelectorAll a ogni chiamata), 200 chiamate per quota col layout sporcato prima di ognuna, soglia 1 ms per chiamata:

| quota | scrollY | zone [data-bg] | ms per chiamata |
| --- | --- | --- | --- |
| 0 | 0 | 16 | 0.151 |
| 0,25 | 8525 | 16 | 0.608 |
| 0,5 | 17049 | 16 | 0.652 |
| 0,75 | 25574 | 16 | 0.680 |
| 1 | 34098 | 16 | 0.183 |

Regole rispettate.

## 20 · VMAX del monogramma

2026-09-18 · commit c3b1c9c+ · misure/20-segno.mjs --parte vmax, 1440×900, |Δ scrollY| per fotogramma (px), tre giri.

| giro | rotella p95 | rotella max | End max | Home max | ancora max |
| --- | --- | --- | --- | --- | --- |
| 1 | 32 | 36 | 6385 | 6479 | 276 |
| 2 | 32 | 34 | 6338 | 6481 | 276 |
| 3 | 32 | 37 | 6453 | 6476 | 352 |

VMAX = 35 px per fotogramma (regola: p95 della rotella per eccesso a 5, fra 20 e 200). Salto minimo di End/Home 6476: i salti sono tagliati.

## 20 · il segno copre

2026-09-18 · commit 4afea84+ (giro di correzione del blocco 20-fix; il rosso di partenza è di a4aabde) · `e2e/segno.spec.ts:305`, «il segno non copre titoli, link e bottoni» (desktop-1440, viewport impostato nel test). **Chiuso da D68: verde su «/», /vendi e /metodo a 1024, 1280 e 1440.**

Prima (build di a4aabde, contenuto del pannello a `px-[5vw]` col corridoio acceso): /vendi e /metodo 0 elementi ai tre viewport, «/» rosso a tutti e tre, sempre nel pannello del territorio di HorizonStory (corridoio «storia»), nel tratto in cui il nastro ha finito la corsa e la sezione risale:

| viewport | elemento | scroll |
| --- | --- | --- |
| 1024×768 | h3 «Tra la Pineta e Milano» | 6432, 6472, 6512, 6552, 6592, 6632 (in scrub) |
| 1024×768 | a «Vedi le case in vendita» | 6912 (in scrub) |
| 1280×800 | h3 «Tra la Pineta e Milano» | 7115, 7155, 7195, 7235, 7275, 7315, 7355, 7395 (in scrub) |
| 1280×800 | a «Vedi le case in vendita» | 7635, 7675 (in scrub) |
| 1440×900 | h3 «Tra la Pineta e Milano» | 7807, 7847, 7887, 7927, 7967, 8007, 8047, 8087 (in scrub) |
| 1440×900 | a «Vedi le case in vendita» | 8327, 8367, 8407 (in scrub) |

Il bordo destro della scatola del segno a riposo sta a 4vw + clamp(40px, 3,75vw, 56px) / 2: 84,6 px a 1440, 75,2 a 1280, 61,0 a 1024, 104,8 a 1920. Le tacche esterne dell'anello stanno a 46,5/96 del lato dal centro: a 1440 arrivavano a 83,8 px, cioè sui primi ~11 px delle lettere. Nel nastro in corsa nessun elemento passava sotto il segno.

**D68 (coordinatore, per A27 di Alberto).** Il segno non copre mai un titolo, un link o un bottone, e il pannello del territorio porta il contenuto oltre il bordo del segno anche col corridoio acceso, con almeno 16 px di riserva. `HorizonStory.tsx` prende `lg:pl-[9.5vw]`: rientro sinistro di 9,5vw da 1024 in su col nastro acceso, rientro destro fermo a 5vw. In colonna la variante `[.dt-horizon:not([data-on])_&]:lg:px-[8vw]` tiene gli 8vw di prima sui due lati (specificità maggiore: vince sul `pl`), e lì basta, perché nessun gradino cavalca la foto. Il segno non si è mosso e nessun altro capitolo è stato toccato.

**Perché 8vw non bastava.** Chi si avvicina davvero al segno non è la scatola dell'h3 — che resta ferma al posto di layout, e che era l'unica cosa che il test guardasse — ma il gradino di mezzo del titolo, «Pineta»: ha `lg:ml-[9vw]` e la parallasse contraria di `HorizonScroller.tsx` lo porta a `xPercent` −25 nella posa di fine corsa, quella in cui il capitolo si guarda. Dal codice (colonna sinistra 0,46·(100vw − pl − 5vw), più gli 11vw del `margin-right: -11vw` di `.dt-horizon_stairs` in globals.css, meno `ml` 9vw, meno il 25 % della propria larghezza) il bordo delle lettere sta a 1,115·pl − 0,0243·larghezza: con 8vw restava a 5,8 / 7,7 / 9,3 px dal segno a 1024 / 1280 / 1440, sotto la riserva. Il rientro che tocca esattamente i 16 px è 8,9vw a 1024 (8,6 a 1280, 8,4 a 1440): si è preso 9,5vw, il primo mezzo vw che lascia margine alla soglia invece di sfiorarla.

Misura dopo D68 (`misure/20-territorio.mjs`, ora committato: la sonda dei giri precedenti stava nello scratchpad; build di produzione sulla 3178, corsa del corridoio «storia» a passi di 40 px). «Margine» = bordo sinistro dell'elemento − bordo destro della scatola del segno, nei soli campioni in cui l'elemento si sovrappone in verticale al segno; per i gradini è la scatola d'inchiostro (Range sul testo), non quella del blocco.

| viewport | segno destra | rientro sinistro 5vw → 8vw → 9,5vw | larghezza utile | margine h3 e link | margine peggiore dei gradini |
| --- | --- | --- | --- | --- | --- |
| 1024×768 | 61,0 | 51,2 → 81,9 → **97,3** | 921,6 → 890,9 → **875,5** | −9,5 → 21,2 → **36,5** | −28,5 → 5,8 → **22,9** |
| 1280×800 | 75,2 | 64,0 → 102,4 → **121,6** | 1152,0 → 1113,6 → **1094,4** | −11,4 → 27,0 → **46,2** | −35,1 → 7,7 → **29,1** |
| 1440×900 | 84,6 | 72,0 → 115,2 → **136,8** | 1296,0 → 1252,8 → **1231,2** | −12,2 → 31,0 → **52,6** | −38,9 → 9,3 → **33,4** |
| 1920×1080 | 104,8 | 96,0 → 153,6 → **182,4** | 1408,0 → 1350,4 → **1321,6** | +151,4 → 209,0 → **237,8** | +152,7 → 216,9 → **249,0** |

Stato in colonna (altezza sotto 640: il segno c'è, il corridoio no), col rientro fermo a 8vw sui due lati: a 1024×600 h3 e link a 20,9 px e il gradino peggiore a 22,1; a 1440×600 30,6 e 31,3; larghezza utile 860,2 e 1209,6. Anche qui ogni bersaglio sta oltre i 16 px.

Niente sfora: i tre gradini restano su una riga sola e larghi come prima (244,5 / 250,6 / 341,5 px a 1024, 305,8 / 313,5 / 427,2 a 1280, 344,2 / 352,8 / 480,8 a 1440, 355,1 / 364,1 / 496,1 a 1920: l'inchiostro non dipende dal rientro, solo dal `clamp` del corpo), nessuno `scrollWidth` oltre il `clientWidth` né nel pannello né nel documento ai sei viewport, e `07-corridoi.mjs` dà di nuovo overflowX 0 ovunque con la home a 34.998 px a 1440. La foto del territorio non si taglia di più (A27): la scatola è `aspect-ratio: 16/9` e la sorgente 2560×1280, quindi la quota in quadro non dipende da quanto la scatola si stringe — 1,778 di rapporto e 88,9 % in quadro a 1280, 1440 e 1920 (88,7 % a 1024), `sizes` invariato e stessa variante servita (w 640 / 768 / 1024 / 1280).

Il cancello: `e2e/segno.spec.ts` ora mette `[data-horizon-stair]` fra i bersagli, accanto a `h1, h2, h3, a, button`. Senza, il test guardava una scatola ferma e la riga che davvero si avvicina al segno gli era invisibile: una regressione della parallasse, di `ml-[9vw]`, del `-11vw` o delle 46/54fr sarebbe rimasta verde. L'aria che resta non la dice il test ma `20-territorio.mjs`, che esce 1 sotto i 16 px.

## 20 · segno fisso e tema

2026-09-18 · commit 20f0e7a+ · misure/20-segno.mjs --parte segno. Attesi (spec §6.1, M1): da 1280 centro = slot + (4vw − slot)·k ±1 px e lato = 56 + (clamp − 56)·k ±1 con k = scroll/testata (1 oltre la testata), badge a opacità 0; fra 1024 e 1279 centro a 4vw ±1, opacità q ±0,03 e lato clamp·(0,8 + 0,2·q) ±1 con q = clamp((scroll − 0,5·testata)/(0,5·testata), 0, 1); risalendo a 0 di nuovo sullo slot (o a opacità 0).

| viewport | scroll | y letto | hidden | opacità | attesa | centro x | atteso x | lato | atteso lato | badge op. | tema |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1440×900 | 0,25·testata | 23 | false | 1.00 | 1.00 | 121.3 | 121.8 | 55.5 | 55.5 | 0.00 | grafite |
| 1440×900 | 0,5·testata | 45 | false | 1.00 | 1.00 | 100.4 | 100.4 | 55.0 | 55.0 | 0.00 | grafite |
| 1440×900 | 0,75·testata | 68 | false | 1.00 | 1.00 | 78.5 | 79.0 | 54.5 | 54.5 | 0.00 | foto |
| 1440×900 | testata | 90 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | 1200 | 1200 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0,25·testata | 20 | false | 1.00 | 1.00 | 110.6 | 110.6 | 54.0 | 54.0 | 0.00 | grafite |
| 1280×800 | 0,5·testata | 40 | false | 1.00 | 1.00 | 90.8 | 90.8 | 52.0 | 52.0 | 0.00 | grafite |
| 1280×800 | 0,75·testata | 60 | false | 1.00 | 1.00 | 71.0 | 71.0 | 50.0 | 50.0 | 0.00 | foto |
| 1280×800 | testata | 80 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | 1200 | 1200 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1024×768 | 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,25·testata | 19 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,5·testata | 38 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,75·testata | 58 | false | 0.51 | 0.51 | 41.0 | 41.0 | 36.1 | 36.1 | — | foto |
| 1024×768 | testata | 77 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | 1200 | 1200 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | ritorno a 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | foto |

Tema a 1440 su «/», passi da 450 px: 76 passi, 7 con una foto sotto il centro, 0 col tema sbagliato.

Rilevatore (querySelectorAll a ogni chiamata), 200 chiamate per quota col layout sporcato prima di ognuna, soglia 1 ms per chiamata:

| quota | scrollY | zone [data-bg] | ms per chiamata |
| --- | --- | --- | --- |
| 0 | 0 | 16 | 0.158 |
| 0,25 | 8525 | 16 | 0.603 |
| 0,5 | 17049 | 16 | 0.584 |
| 0,75 | 25574 | 16 | 0.656 |
| 1 | 34098 | 16 | 0.199 |

Regole rispettate.

## 20 · la coda del tema dopo un salto nella cartolina (D67)

2026-09-18 · build del giro di correzione 1 (20f0e7a + coda sul ticker di GSAP, MARK_TEMA_CODA_S = 1,5 s) · sonda di revisione `probe-tema-stale.mjs` (scratchpad, non committata), `next start` sulla 3178 da lib.mjs, 1440×900. Per ogni quota: salto istantaneo dalla cima della cartolina a +f·100vh, lettura subito, a 2 s senza scroll e dopo uno `scroll` sintetico. Cella: tema / centro del segno dentro il marcatore / bordo sinistro e alto del marcatore in px.

| f | subito | a 2 s fermi | dopo lo scroll sintetico | stantio |
| --- | --- | --- | --- | --- |
| 0,15 | foto / sì / 1, 0 | foto / sì / 13, 3 | foto / sì | no |
| 0,25 | foto / sì / 1, 0 | foto / sì / 47, 11 | foto / sì | no |
| 0,35 | foto / sì / 3, 1 | grafite / no / 122, 28 | grafite / no | no |
| 0,5 | foto / sì / 7, 1 | grafite / no / 226, 51 | grafite / no | no |
| 0,65 | foto / sì / 30, 7 | grafite / no / 276, 63 | grafite / no | no |
| 0,8 | foto / sì / 20, 4 | grafite / no / 301, 68 | grafite / no | no |
| 1 | foto / sì / 37, −171 | grafite / no / 315, −108 | grafite / no | no |
| 1,3 | grafite / no / 84, −431 | grafite / no / 317, −378 | grafite / no | no |

Prima della coda (revisione del commit 20, stesso percorso) il tema restava «foto» a 2 s fermi da f 0,35 a 1,3: 6 quote su 8 stantie. Con la coda 0 su 8. Lo presidia l'e2e «1440, salto dentro la cartolina e 2 s fermi» di segno.spec.ts (rosso prima della coda con i bordi a 122, 276, 315, 317 px; verde dopo).

## 20 · segno fisso e tema

2026-09-18 · commit a4aabde+ · misure/20-segno.mjs --parte segno. Attesi (spec §6.1, M1): da 1280 centro = slot + (4vw − slot)·k ±1 px e lato = 56 + (clamp − 56)·k ±1 con k = scroll/testata (1 oltre la testata), badge a opacità 0; fra 1024 e 1279 centro a 4vw ±1, opacità q ±0,03 e lato clamp·(0,8 + 0,2·q) ±1 con q = clamp((scroll − 0,5·testata)/(0,5·testata), 0, 1); risalendo a 0 di nuovo sullo slot (o a opacità 0).

| viewport | scroll | y letto | hidden | opacità | attesa | centro x | atteso x | lato | atteso lato | badge op. | tema |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1440×900 | 0,25·testata | 23 | false | 1.00 | 1.00 | 121.3 | 121.8 | 55.5 | 55.5 | 0.00 | grafite |
| 1440×900 | 0,5·testata | 45 | false | 1.00 | 1.00 | 100.4 | 100.4 | 55.0 | 55.0 | 0.00 | grafite |
| 1440×900 | 0,75·testata | 68 | false | 1.00 | 1.00 | 78.5 | 79.0 | 54.5 | 54.5 | 0.00 | foto |
| 1440×900 | testata | 90 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | 1200 | 1200 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0,25·testata | 20 | false | 1.00 | 1.00 | 110.6 | 110.6 | 54.0 | 54.0 | 0.00 | grafite |
| 1280×800 | 0,5·testata | 40 | false | 1.00 | 1.00 | 90.8 | 90.8 | 52.0 | 52.0 | 0.00 | grafite |
| 1280×800 | 0,75·testata | 60 | false | 1.00 | 1.00 | 71.0 | 71.0 | 50.0 | 50.0 | 0.00 | foto |
| 1280×800 | testata | 80 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | 1200 | 1200 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1024×768 | 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,25·testata | 19 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,5·testata | 38 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,75·testata | 58 | false | 0.51 | 0.51 | 41.0 | 41.0 | 36.1 | 36.1 | — | foto |
| 1024×768 | testata | 77 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | 1200 | 1200 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | ritorno a 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | foto |

Tema a 1440 su «/», passi da 450 px: 76 passi, 6 con una foto sotto il centro, 0 col tema sbagliato.

Rilevatore (querySelectorAll a ogni chiamata), 200 chiamate per quota col layout sporcato prima di ognuna, soglia 1 ms per chiamata:

| quota | scrollY | zone [data-bg] | ms per chiamata |
| --- | --- | --- | --- |
| 0 | 0 | 16 | 0.146 |
| 0,25 | 8525 | 16 | 0.589 |
| 0,5 | 17049 | 16 | 0.610 |
| 0,75 | 25574 | 16 | 0.637 |
| 1 | 34098 | 16 | 0.181 |

Regole rispettate.

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-18, a4aabde+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 34998 | 0 |  | ok |
| 1024×768 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 30308 | 0 |  | ok |
| 1920×1080 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 39613 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 22352 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 23193 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 28479 | 0 |  | ok |
| 1440×900 | /vendi | page-dive | page-dive | 1 | 17034 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 24223) | ok |

## 20 · il territorio oltre il segno (D68)

2026-09-18 · commit 4afea84+ · misure/20-territorio.mjs · corsa del corridoio «storia» su «/» a passi di 40 px, build di produzione sulla 3178.
«Margine» = bordo sinistro dell'elemento − bordo destro della scatola del segno, nei soli campioni in cui l'elemento si sovrappone in verticale al segno;
per i gradini è la scatola d'inchiostro (Range sul testo), non quella del blocco. Riserva chiesta da D68: 16 px.

| viewport | elemento | segno destra | rientro sinistro | margine peggiore | a scroll | campioni |
| --- | --- | --- | --- | --- | --- | --- |
| 1024×768 nastro | h3 (scatola) | 61.0 | 97.3 | 36.5 | 6432 | 6 |
| 1024×768 nastro | link (scatola) | 61.0 | 97.3 | 36.5 | 6912 | 1 |
| 1024×768 nastro | gradino 1 «Tra la» | 61.0 | 97.3 | 62.3 | 6432 | 3 |
| 1024×768 nastro | gradino 2 «Pineta» | 61.0 | 97.3 | 22.9 | 6472 | 4 |
| 1024×768 nastro | gradino 3 «e Milano» | 61.0 | 97.3 | 196.1 | 6552 | 3 |
| 1280×800 nastro | h3 (scatola) | 75.2 | 121.6 | 46.2 | 7115 | 8 |
| 1280×800 nastro | link (scatola) | 75.2 | 121.6 | 46.2 | 7635 | 2 |
| 1280×800 nastro | gradino 1 «Tra la» | 75.2 | 121.6 | 78.4 | 7115 | 4 |
| 1280×800 nastro | gradino 2 «Pineta» | 75.2 | 121.6 | 29.1 | 7195 | 4 |
| 1280×800 nastro | gradino 3 «e Milano» | 75.2 | 121.6 | 245.6 | 7275 | 4 |
| 1440×900 nastro | h3 (scatola) | 84.6 | 136.8 | 52.6 | 7807 | 8 |
| 1440×900 nastro | link (scatola) | 84.6 | 136.8 | 52.6 | 8327 | 3 |
| 1440×900 nastro | gradino 1 «Tra la» | 84.6 | 136.8 | 88.8 | 7767 | 5 |
| 1440×900 nastro | gradino 2 «Pineta» | 84.6 | 136.8 | 33.4 | 7887 | 4 |
| 1440×900 nastro | gradino 3 «e Milano» | 84.6 | 136.8 | 277.0 | 7967 | 5 |
| 1920×1080 nastro | h3 (scatola) | 104.8 | 182.4 | 237.8 | 9370 | 9 |
| 1920×1080 nastro | link (scatola) | 104.8 | 182.4 | 237.8 | 9930 | 2 |
| 1920×1080 nastro | gradino 1 «Tra la» | 104.8 | 182.4 | 278.7 | 9330 | 5 |
| 1920×1080 nastro | gradino 2 «Pineta» | 104.8 | 182.4 | 249.0 | 9450 | 5 |
| 1920×1080 nastro | gradino 3 «e Milano» | 104.8 | 182.4 | 500.2 | 9530 | 5 |
| 1024×600 colonna | h3 (scatola) | 61.0 | 81.9 | 20.9 | 4140 | 6 |
| 1024×600 colonna | link (scatola) | 61.0 | 81.9 | 20.9 | 4660 | 2 |
| 1024×600 colonna | gradino 1 «Tra la» | 61.0 | 81.9 | 22.1 | 4140 | 3 |
| 1024×600 colonna | gradino 2 «Pineta» | 61.0 | 81.9 | 100.3 | 4300 | 4 |
| 1024×600 colonna | gradino 3 «e Milano» | 61.0 | 81.9 | 74.0 | 4260 | 3 |
| 1440×600 colonna | h3 (scatola) | 84.6 | 115.2 | 30.6 | 4190 | 9 |
| 1440×600 colonna | link (scatola) | 84.6 | 115.2 | 30.6 | 4750 | 2 |
| 1440×600 colonna | gradino 1 «Tra la» | 84.6 | 115.2 | 31.3 | 4190 | 4 |
| 1440×600 colonna | gradino 2 «Pineta» | 84.6 | 115.2 | 147.7 | 4430 | 5 |
| 1440×600 colonna | gradino 3 «e Milano» | 84.6 | 115.2 | 99.0 | 4350 | 5 |

| viewport | larghezza utile | gradini: inchiostro e righe | trabocca pannello | trabocca documento | foto del territorio |
| --- | --- | --- | --- | --- | --- |
| 1024×768 nastro | 875.5 | 244.5 (1 riga) · 250.6 (1 riga) · 341.5 (1 riga) | 0 | 0 | 472.8×265.9 (1.778, 88.7 % in quadro, w=640) |
| 1280×800 nastro | 1094.4 | 305.8 (1 riga) · 313.5 (1 riga) · 427.2 (1 riga) | 0 | 0 | 591.0×332.4 (1.778, 88.9 % in quadro, w=768) |
| 1440×900 nastro | 1231.2 | 344.2 (1 riga) · 352.8 (1 riga) · 480.8 (1 riga) | 0 | 0 | 664.8×374.0 (1.778, 88.9 % in quadro, w=1024) |
| 1920×1080 nastro | 1321.6 | 355.1 (1 riga) · 364.1 (1 riga) · 496.1 (1 riga) | 0 | 0 | 713.7×401.4 (1.778, 88.9 % in quadro, w=1280) |
| 1024×600 colonna | 860.2 | 244.5 (1 riga) · 250.6 (1 riga) · 341.5 (1 riga) | 0 | 0 | 464.5×261.3 (1.778, 88.7 % in quadro, w=640) |
| 1440×600 colonna | 1209.6 | 344.2 (1 riga) · 352.8 (1 riga) · 480.8 (1 riga) | 0 | 0 | 653.2×367.4 (1.778, 88.9 % in quadro, w=1024) |

**Regole rispettate:** ogni bersaglio oltre i 16 px, i gradini su una riga sola, nessun traboccamento.

## 20 · segno fisso e tema

2026-09-18 · commit 4afea84+ · misure/20-segno.mjs --parte segno. Attesi (spec §6.1, M1): da 1280 centro = slot + (4vw − slot)·k ±1 px e lato = 56 + (clamp − 56)·k ±1 con k = scroll/testata (1 oltre la testata), badge a opacità 0; fra 1024 e 1279 centro a 4vw ±1, opacità q ±0,03 e lato clamp·(0,8 + 0,2·q) ±1 con q = clamp((scroll − 0,5·testata)/(0,5·testata), 0, 1); risalendo a 0 di nuovo sullo slot (o a opacità 0).

| viewport | scroll | y letto | hidden | opacità | attesa | centro x | atteso x | lato | atteso lato | badge op. | tema |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1440×900 | 0,25·testata | 23 | false | 1.00 | 1.00 | 121.3 | 121.8 | 55.5 | 55.5 | 0.00 | grafite |
| 1440×900 | 0,5·testata | 45 | false | 1.00 | 1.00 | 100.4 | 100.4 | 55.0 | 55.0 | 0.00 | grafite |
| 1440×900 | 0,75·testata | 68 | false | 1.00 | 1.00 | 78.5 | 79.0 | 54.5 | 54.5 | 0.00 | foto |
| 1440×900 | testata | 90 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | 1200 | 1200 | false | 1.00 | 1.00 | 57.6 | 57.6 | 54.0 | 54.0 | 0.00 | foto |
| 1440×900 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 143.2 | 143.2 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1280×800 | 0,25·testata | 20 | false | 1.00 | 1.00 | 110.6 | 110.6 | 54.0 | 54.0 | 0.00 | grafite |
| 1280×800 | 0,5·testata | 40 | false | 1.00 | 1.00 | 90.8 | 90.8 | 52.0 | 52.0 | 0.00 | grafite |
| 1280×800 | 0,75·testata | 60 | false | 1.00 | 1.00 | 71.0 | 71.0 | 50.0 | 50.0 | 0.00 | foto |
| 1280×800 | testata | 80 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | 1200 | 1200 | false | 1.00 | 1.00 | 51.2 | 51.2 | 48.0 | 48.0 | 0.00 | foto |
| 1280×800 | ritorno a 0 | 0 | false | 1.00 | 1.00 | 130.4 | 130.4 | 56.0 | 56.0 | 0.00 | grafite |
| 1024×768 | 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,25·testata | 19 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,5·testata | 38 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | grafite |
| 1024×768 | 0,75·testata | 58 | false | 0.51 | 0.51 | 41.0 | 41.0 | 36.1 | 36.1 | — | foto |
| 1024×768 | testata | 77 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | 1200 | 1200 | false | 1.00 | 1.00 | 41.0 | 41.0 | 40.0 | 40.0 | — | foto |
| 1024×768 | ritorno a 0 | 0 | false | 0.00 | 0.00 | 41.0 | 41.0 | 32.0 | 32.0 | — | foto |

Tema a 1440 su «/», passi da 450 px: 76 passi, 6 con una foto sotto il centro, 0 col tema sbagliato.

Rilevatore (querySelectorAll a ogni chiamata), 200 chiamate per quota col layout sporcato prima di ognuna, soglia 1 ms per chiamata:

| quota | scrollY | zone [data-bg] | ms per chiamata |
| --- | --- | --- | --- |
| 0 | 0 | 16 | 0.163 |
| 0,25 | 8525 | 16 | 0.560 |
| 0,5 | 17049 | 16 | 0.594 |
| 0,75 | 25574 | 16 | 0.621 |
| 1 | 34098 | 16 | 0.183 |

Regole rispettate.

### Commit 7: corridoi accesi e ripristino al capitolo (2026-09-18, 4afea84+)

| viewport | rotta | accesi | attesi | sticky | altezza | overflowX | scarto ricarica (px) | esito |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 34998 | 0 |  | ok |
| 1024×768 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 30308 | 0 |  | ok |
| 1920×1080 | / | cartolina finestra hero recensioni storia team | cartolina finestra hero recensioni storia team | 7 | 39613 | 0 |  | ok |
| 1280×600 | / | nessuno | nessuno | 0 | 22352 | 0 |  | ok |
| 1440×600 | / | nessuno | nessuno | 0 | 23193 | 0 |  | ok |
| 390×664 | / | nessuno | nessuno | 1 | 28479 | 0 |  | ok |
| 1440×900 | /vendi | page-dive | page-dive | 1 | 17034 | 0 |  | ok |
| 1440×900 | / ricarica a metà di #servizi |  |  |  |  |  | 0.6 (scrollY 24223) | ok |

### Commit T · paint dell'alone della testa di era, 1440×900, CPU ×4 (2026-09-20, cec1551+) — riproduzione del metro di 17-paint.mjs

| misura | viewport | fotogrammi / pixel | p95 ms / p10 | max ms / riposo | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- |
| cartolina (17-paint.mjs) | 1440×900 | 490 | 2.01 | 7.1 | p95 < 4 ms, ≥ 30 fotogrammi (17-paint: p95 1,8-2,0, max 7,9-10,4) | ok |

Nota: lo stesso metro di 17-paint.mjs (Paint per finestra da 16,7 ms fra due mark, thread del renderer).

### Commit T · paint dell'alone della testa di era, 1440×900, CPU ×4 (2026-09-20, cec1551+) — coi controlli della corsa

| misura | viewport | fotogrammi / pixel | p95 ms / p10 | max ms / riposo | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- |
| posa title /servizi de (lancio 1, 2705 ms) | 1440×900 | 113 | 1.81 | 6.51 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 1) | 1440×900 | 254 | 10.44 | 12.56 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 1) | 1440×900 | 292 | 12.48 | 92.47 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 1) | 1440×900 | 247 | 10.96 | 18.04 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| posa title /servizi de (lancio 2, 2706 ms) | 1440×900 | 115 | 1.88 | 5.26 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 2) | 1440×900 | 242 | 11.13 | 14.25 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 2) | 1440×900 | 249 | 10.72 | 19.37 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 2) | 1440×900 | 245 | 11.52 | 13.77 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| posa title /servizi de (lancio 3, 2707 ms) | 1440×900 | 113 | 1.97 | 5.78 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 3) | 1440×900 | 247 | 10.83 | 13.31 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 3) | 1440×900 | 274 | 14.3 | 16.39 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 3) | 1440×900 | 269 | 13.81 | 25.48 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa: mediana del ramo − mediana del controllo (b) strato fermo (3 lanci) | 1440×900 | — | 10.83 | 11.52 | delta ≤ +1 ms: la parallasse della testa non aggiunge paint alla corsa (D199, T4) | ok (-0.68 ms) |
| corsa: mediana del ramo − mediana del controllo (a) senza alone (3 lanci) | 1440×900 | — | 10.83 | 12.48 | dato: il costo delle 18 ombre lungo la corsa | — (-1.65 ms) |
| fermo a t 1020 ms: p10 dei pixel pieni delle 0/54 lettere atterrate | 1440×900 | 0 | — | — | ≥ riposo − 0,02 sugli stessi pixel (le lettere atterrano pulite, D230) | — (nessuna lettera a terra: nulla da sporcare) |
| fermo a t 2021 ms: p10 dei pixel pieni delle 24/54 lettere atterrate | 1440×900 | 9396 | 1 | 1 | ≥ riposo − 0,02 sugli stessi pixel (le lettere atterrano pulite, D230) | ok |
| fine posa a t 2710 ms: p10 dei pixel pieni dell'H1 intero | 1440×900 | 24485 | 1 | 1 | riposo ± 0,02 (l'immagine è quella a riposo, D230) | ok |

Nota: con D198 le lettere in moto (posa `title`) non portano ombra; le 18 ombre stanno sulla copia statica sotto, che il browser rasterizza una volta e dissolve; il tetto dei 4 ms vale sulla posa e sulla cartolina. La corsa si giudica sul delta contro il controllo (b), la stessa pagina con lo strato fermo (`--dt-testa-mf: 0`, trasformata e will-change azzerati con `!important`): il paint della corsa è dei reveal delle sezioni sotto la testa e del segno (stili inline mutati a ogni fotogramma sul layer radice, invalidation tracking di Chromium) e c'è anche con la testa ferma; il delta contro (a) (`.dt-alone { text-shadow: none !important }`) è il dato sull'alone. I controlli sono intercalati ai lanci del ramo (stessa macchina, stesso momento) e per la stessa via (pagina nuova, posa finita, corsa: ramo e controllo differiscono solo per il CSS iniettato). I fermi (D230): a t 1,0 s nessuna lettera è a terra per costruzione (la prima vola da 0,3 a 1,5 s), a 2,0 s le atterrate, a fine posa (≈ 2,7 s) l'H1 intero. Il blocco di Open Domus dentro la finestra si misura in T2.2.

### Commit T · paint dell'alone della testa di era, 1440×900, CPU ×4 (2026-09-20, cec1551+) — coi controlli della corsa

| misura | viewport | fotogrammi / pixel | p95 ms / p10 | max ms / riposo | atteso | esito |
| --- | --- | --- | --- | --- | --- | --- |
| posa title /servizi de (lancio 1, 2707 ms) | 1440×900 | 117 | 2.58 | 6.15 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 1) | 1440×900 | 283 | 11.79 | 18.09 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 1) | 1440×900 | 259 | 10.84 | 13.74 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 1) | 1440×900 | 254 | 11.21 | 13.59 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| posa title /servizi de (lancio 2, 2703 ms) | 1440×900 | 110 | 3.02 | 6.12 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 2) | 1440×900 | 235 | 12.13 | 17.66 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 2) | 1440×900 | 246 | 11.21 | 15.75 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 2) | 1440×900 | 252 | 10.57 | 13.36 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| posa title /servizi de (lancio 3, 2706 ms) | 1440×900 | 118 | 1.8 | 7.62 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 3) | 1440×900 | 256 | 10.88 | 18.27 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 3) | 1440×900 | 254 | 10.55 | 12.51 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 3) | 1440×900 | 251 | 10.89 | 16.65 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| posa title /servizi de (lancio 4, 2702 ms) | 1440×900 | 115 | 1.39 | 7.97 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 4) | 1440×900 | 255 | 11.69 | 16.14 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 4) | 1440×900 | 258 | 10.56 | 13.18 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 4) | 1440×900 | 273 | 12.8 | 21.92 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| posa title /servizi de (lancio 5, 2712 ms) | 1440×900 | 114 | 1.8 | 6.67 | p95 < 4 ms, ≥ 30 fotogrammi | ok |
| corsa 0 → 900 /servizi de, ramo (lancio 5) | 1440×900 | 280 | 12.23 | 15.27 | ≥ 30 fotogrammi, parallasse corsa; il giudizio è il delta contro il controllo (b) | dato |
| corsa 0 → 900 /servizi de, controllo (a) senza alone (lancio 5) | 1440×900 | 252 | 10.45 | 14.04 | `.dt-alone { text-shadow: none !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa 0 → 900 /servizi de, controllo (b) strato fermo (lancio 5) | 1440×900 | 248 | 11.06 | 15.26 | `:root { --dt-testa-mf: 0 !important; } [data-testa-strato] { transform: none !important; will-change: auto !important; }` iniettato; ≥ 30 fotogrammi | dato |
| corsa: mediana del ramo − mediana del controllo (b) strato fermo (5 lanci) | 1440×900 | — | 11.79 | 11.06 | delta ≤ +1 ms: la parallasse della testa non aggiunge paint alla corsa (D199, T4) | ok (+0.73 ms) |
| corsa: mediana del ramo − mediana del controllo (a) senza alone (5 lanci) | 1440×900 | — | 11.79 | 10.56 | dato: il costo delle 18 ombre lungo la corsa | — (+1.23 ms) |
| fermo a t 1014 ms: p10 dei pixel pieni delle 0/54 lettere atterrate | 1440×900 | 0 | — | — | ≥ riposo − 0,02 sugli stessi pixel (le lettere atterrano pulite, D230) | — (nessuna lettera a terra: nulla da sporcare) |
| fermo a t 2011 ms: p10 dei pixel pieni delle 23/54 lettere atterrate | 1440×900 | 9007 | 1 | 1 | ≥ riposo − 0,02 sugli stessi pixel (le lettere atterrano pulite, D230) | ok |
| fine posa a t 2709 ms: p10 dei pixel pieni dell'H1 intero | 1440×900 | 24484 | 1 | 1 | riposo ± 0,02 (l'immagine è quella a riposo, D230) | ok |

Nota: con D198 le lettere in moto (posa `title`) non portano ombra; le 18 ombre stanno sulla copia statica sotto, che il browser rasterizza una volta e dissolve; il tetto dei 4 ms vale sulla posa e sulla cartolina. La corsa si giudica sul delta contro il controllo (b), la stessa pagina con lo strato fermo (`--dt-testa-mf: 0`, trasformata e will-change azzerati con `!important`): il paint della corsa è dei reveal delle sezioni sotto la testa e del segno (stili inline mutati a ogni fotogramma sul layer radice, invalidation tracking di Chromium) e c'è anche con la testa ferma; il delta contro (a) (`.dt-alone { text-shadow: none !important }`) è il dato sull'alone. I controlli sono intercalati ai lanci del ramo (stessa macchina, stesso momento) e per la stessa via (pagina nuova, posa finita, corsa: ramo e controllo differiscono solo per il CSS iniettato). I fermi (D230): a t 1,0 s nessuna lettera è a terra per costruzione (la prima vola da 0,3 a 1,5 s), a 2,0 s le atterrate, a fine posa (≈ 2,7 s) l'H1 intero. Il blocco di Open Domus dentro la finestra si misura in T2.2.

Lettura (T1, giro di correzione 1, per D199 in T4): due lanci dello script (`--controllo`, 3 e 5 lanci) sullo stesso build, macchina con il `next dev` di Alberto acceso sulla 3000. Corsa del ramo p95 10,4-12,2 ms; controllo (b) strato fermo 10,6-13,8; controllo (a) senza alone 10,5-14,3: le tre corse stanno nello stesso intervallo e il delta ramo − (b) vale −0,68 (3 lanci) e +0,73 ms (5 lanci), ramo − (a) −1,65 e +1,23, cioè dentro lo scarto fra un lancio e l'altro (±1,5 ms). Il paint della corsa non è della testa: c'è uguale con lo strato fermo e senza le 18 ombre. Il tetto dei 4 ms resta sulla posa `title` (1,4-3,0) e sulla cartolina (2,0).
