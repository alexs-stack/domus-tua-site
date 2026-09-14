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
