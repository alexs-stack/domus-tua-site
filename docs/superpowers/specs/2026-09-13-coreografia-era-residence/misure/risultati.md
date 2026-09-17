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
