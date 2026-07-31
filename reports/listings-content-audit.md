# Audit contenuti annunci RealSmart

Generato il 2026-07-31. Sola lettura: nessun annuncio o feed è stato modificato.
Il report non contiene indirizzi civici, telefoni o email.

## Riepilogo

- annunci analizzati: **193**
- PASS: **184**
- REVIEW: **9** (questioni editoriali, non bloccanti)
- FAIL: **0** (difetti strutturali, bloccanti in CI)
- payload in cache: **1490 KB** su 2048 KB (limite Data Cache di Next)

### Controlli scattati

- `fatto-ambiguo`: 11
- `fatto-contraddittorio`: 1

### Override manuali

- applicati: 25
- orfani (immobile non più nel feed): 0

## REVIEW — da guardare a mano

| Riferimento | Controllo | Dettaglio |
| --- | --- | --- |
| T4007 | `fatto-ambiguo` | giardino: "Giardino" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T3019 | `fatto-ambiguo` | studio: "Studio" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T402 | `fatto-ambiguo` | postiAuto: "Posti auto" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T702 | `fatto-ambiguo` | terrazzi: "Terrazzi" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T702 | `fatto-ambiguo` | giardino: "Giardino" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T602 | `fatto-ambiguo` | autorimesse: "Autorimesse" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T602 | `fatto-ambiguo` | giardino: "Giardino" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T602 | `fatto-ambiguo` | sottotetto: "Sottotetto" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T336 | `fatto-ambiguo` | studio: "Studio" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T906 | `fatto-contraddittorio` | balconi: "Balconi" vale sia 3 sia 2 nella stessa descrizione. |
| T615 | `fatto-ambiguo` | giardino: "Giardino" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |
| T450 | `fatto-ambiguo` | giardino: "Giardino" compare in una frase ipotetica/evocativa: non è un'affermazione sull'immobile. |

## Provenienza dei dati

| Riferimento | Stato | Da campo | Da descrizione | Da override | In revisione |
| --- | --- | ---: | ---: | ---: | ---: |
| T001 | PASS | 4 | 0 | 0 | 0 |
| T3002 | PASS | 11 | 8 | 0 | 0 |
| T2002 | PASS | 13 | 1 | 0 | 0 |
| T3003 | PASS | 14 | 7 | 0 | 0 |
| T701 | PASS | 10 | 7 | 0 | 0 |
| T4005 | PASS | 16 | 7 | 0 | 0 |
| T5002 | PASS | 18 | 6 | 0 | 0 |
| T2006 | PASS | 13 | 5 | 0 | 0 |
| T3005 | PASS | 12 | 5 | 0 | 0 |
| T2011 | PASS | 14 | 6 | 0 | 0 |
| T4007 | REVIEW | 18 | 8 | 0 | 1 |
| T3009 | PASS | 14 | 9 | 0 | 0 |
| T4008 | PASS | 15 | 6 | 0 | 0 |
| T2022 | PASS | 16 | 4 | 0 | 0 |
| T304 | PASS | 15 | 3 | 0 | 0 |
| T305 | PASS | 15 | 7 | 0 | 0 |
| T2024 | PASS | 15 | 4 | 0 | 0 |
| T5003 | PASS | 10 | 4 | 0 | 0 |
| T3018 | PASS | 11 | 5 | 0 | 0 |
| T3019 | REVIEW | 10 | 3 | 0 | 1 |
| T0008 | PASS | 9 | 3 | 0 | 0 |
| T2030 | PASS | 16 | 6 | 0 | 0 |
| T3021 | PASS | 15 | 4 | 0 | 0 |
| T2031 | PASS | 15 | 2 | 0 | 0 |
| T307 | PASS | 14 | 1 | 0 | 0 |
| T901 | PASS | 14 | 1 | 0 | 0 |
| T2033 | PASS | 14 | 0 | 0 | 0 |
| T601 | PASS | 16 | 6 | 0 | 0 |
| T402 | REVIEW | 17 | 3 | 0 | 1 |
| T702 | REVIEW | 16 | 5 | 0 | 2 |
| T303 | PASS | 14 | 3 | 0 | 0 |
| UT102 | PASS | 10 | 2 | 0 | 0 |
| T309 | PASS | 16 | 6 | 0 | 0 |
| T403 | PASS | 13 | 7 | 0 | 0 |
| T310 | PASS | 12 | 6 | 0 | 0 |
| T404 | PASS | 16 | 2 | 0 | 0 |
| T203 | PASS | 14 | 3 | 0 | 0 |
| T405 | PASS | 16 | 4 | 0 | 0 |
| T406 | PASS | 17 | 3 | 0 | 0 |
| T311 | PASS | 14 | 2 | 0 | 0 |
| T312 | PASS | 11 | 3 | 0 | 0 |
| T502 | PASS | 16 | 4 | 0 | 0 |
| T313 | PASS | 13 | 4 | 0 | 0 |
| T314 | PASS | 15 | 3 | 0 | 0 |
| T206 | PASS | 13 | 1 | 0 | 0 |
| T315 | PASS | 14 | 2 | 0 | 0 |
| T602 | REVIEW | 12 | 3 | 0 | 3 |
| T316 | PASS | 14 | 2 | 0 | 0 |
| XT002 | PASS | 4 | 1 | 0 | 0 |
| T408 | PASS | 16 | 2 | 0 | 0 |
| T207 | PASS | 13 | 0 | 0 | 0 |
| T409 | PASS | 19 | 5 | 0 | 0 |
| T317 | PASS | 10 | 1 | 0 | 0 |
| XT003 | PASS | 4 | 1 | 0 | 0 |
| T603 | PASS | 17 | 6 | 0 | 0 |
| T410 | PASS | 15 | 0 | 0 | 0 |
| T318 | PASS | 14 | 2 | 0 | 0 |
| T319 | PASS | 14 | 1 | 0 | 0 |
| T411 | PASS | 19 | 2 | 0 | 0 |
| T208 | PASS | 10 | 1 | 0 | 0 |
| T320 | PASS | 17 | 3 | 0 | 0 |
| T605 | PASS | 14 | 2 | 0 | 0 |
| T412 | PASS | 18 | 1 | 0 | 0 |
| T210 | PASS | 12 | 2 | 0 | 0 |
| T413 | PASS | 16 | 3 | 0 | 0 |
| T322 | PASS | 12 | 2 | 0 | 0 |
| T503 | PASS | 16 | 2 | 0 | 0 |
| T323 | PASS | 14 | 2 | 0 | 0 |
| T414 | PASS | 18 | 5 | 0 | 0 |
| T703 | PASS | 18 | 6 | 0 | 0 |
| T415 | PASS | 13 | 4 | 0 | 0 |
| T324 | PASS | 12 | 2 | 0 | 0 |
| UT104 | PASS | 8 | 3 | 0 | 0 |
| T325 | PASS | 13 | 0 | 0 | 0 |
| T212 | PASS | 13 | 2 | 0 | 0 |
| T416 | PASS | 15 | 3 | 0 | 0 |
| T326 | PASS | 15 | 0 | 0 | 0 |
| T505 | PASS | 15 | 1 | 0 | 0 |
| T327 | PASS | 13 | 2 | 0 | 0 |
| T802 | PASS | 17 | 2 | 0 | 0 |
| T328 | PASS | 13 | 2 | 0 | 0 |
| T329 | PASS | 16 | 3 | 0 | 0 |
| T330 | PASS | 12 | 1 | 0 | 0 |
| T331 | PASS | 14 | 2 | 0 | 0 |
| T607 | PASS | 13 | 4 | 0 | 0 |
| T332 | PASS | 19 | 3 | 0 | 0 |
| T213 | PASS | 12 | 2 | 0 | 0 |
| T214 | PASS | 13 | 2 | 0 | 0 |
| NT301 | PASS | 8 | 0 | 0 | 0 |
| T417 | PASS | 14 | 5 | 0 | 0 |
| T333 | PASS | 13 | 2 | 0 | 0 |
| UT201 | PASS | 11 | 2 | 0 | 0 |
| T418 | PASS | 14 | 1 | 0 | 0 |
| T419 | PASS | 15 | 3 | 0 | 0 |
| T903 | PASS | 14 | 2 | 0 | 0 |
| T421 | PASS | 18 | 7 | 0 | 0 |
| T422 | PASS | 16 | 2 | 0 | 0 |
| T335 | PASS | 12 | 3 | 0 | 0 |
| T336 | REVIEW | 15 | 3 | 0 | 1 |
| T423 | PASS | 13 | 3 | 0 | 0 |
| T339 | PASS | 15 | 2 | 0 | 0 |
| T215 | PASS | 13 | 2 | 0 | 0 |
| T341 | PASS | 17 | 3 | 0 | 0 |
| T344 | PASS | 15 | 5 | 0 | 0 |
| T345 | PASS | 16 | 2 | 0 | 0 |
| T425 | PASS | 18 | 5 | 0 | 0 |
| T346 | PASS | 12 | 1 | 0 | 0 |
| T347 | PASS | 17 | 3 | 0 | 0 |
| NT302 | PASS | 10 | 1 | 0 | 0 |
| A204 | PASS | 14 | 3 | 0 | 0 |
| T426 | PASS | 15 | 6 | 0 | 0 |
| T424 | PASS | 15 | 4 | 0 | 0 |
| T427 | PASS | 19 | 4 | 0 | 0 |
| T610 | PASS | 16 | 1 | 0 | 0 |
| T428 | PASS | 15 | 1 | 0 | 0 |
| T509 | PASS | 16 | 4 | 0 | 0 |
| T510 | PASS | 19 | 3 | 0 | 0 |
| T429 | PASS | 13 | 3 | 0 | 0 |
| T906 | REVIEW | 15 | 5 | 0 | 1 |
| T351 | PASS | 17 | 3 | 0 | 0 |
| T511 | PASS | 17 | 3 | 0 | 0 |
| T512 | PASS | 20 | 3 | 0 | 0 |
| T216 | PASS | 15 | 2 | 0 | 0 |
| T902 | PASS | 17 | 1 | 0 | 0 |
| T706 | PASS | 21 | 5 | 0 | 0 |
| T352 | PASS | 17 | 1 | 0 | 0 |
| T707 | PASS | 20 | 1 | 0 | 0 |
| T353 | PASS | 11 | 2 | 0 | 0 |
| T430 | PASS | 15 | 0 | 0 | 0 |
| T431 | PASS | 19 | 7 | 0 | 0 |
| T217 | PASS | 12 | 2 | 0 | 0 |
| T355 | PASS | 18 | 2 | 0 | 0 |
| T432 | PASS | 15 | 5 | 0 | 0 |
| T356 | PASS | 18 | 6 | 0 | 0 |
| T357 | PASS | 13 | 5 | 0 | 0 |
| T358 | PASS | 14 | 2 | 0 | 0 |
| T504 | PASS | 19 | 4 | 0 | 0 |
| T219 | PASS | 17 | 2 | 0 | 0 |
| T433 | PASS | 19 | 5 | 0 | 0 |
| NT303 | PASS | 8 | 2 | 0 | 0 |
| NT304 | PASS | 8 | 3 | 0 | 0 |
| T608 | PASS | 17 | 5 | 0 | 0 |
| T361 | PASS | 14 | 5 | 0 | 0 |
| T434 | PASS | 16 | 3 | 0 | 0 |
| T437 | PASS | 14 | 3 | 0 | 0 |
| T611 | PASS | 17 | 1 | 0 | 0 |
| T438 | PASS | 12 | 8 | 0 | 0 |
| T516 | PASS | 21 | 6 | 0 | 0 |
| T362 | PASS | 15 | 1 | 0 | 0 |
| T439 | PASS | 18 | 7 | 0 | 0 |
| T363 | PASS | 11 | 1 | 0 | 0 |
| T221 | PASS | 14 | 4 | 0 | 0 |
| T440 | PASS | 14 | 5 | 0 | 0 |
| T222 | PASS | 16 | 0 | 0 | 0 |
| T364 | PASS | 13 | 2 | 0 | 0 |
| T223 | PASS | 11 | 0 | 0 | 0 |
| T441 | PASS | 14 | 3 | 0 | 0 |
| T709 | PASS | 13 | 2 | 0 | 0 |
| T366 | PASS | 13 | 1 | 0 | 0 |
| T367 | PASS | 17 | 5 | 0 | 0 |
| T369 | PASS | 14 | 6 | 0 | 0 |
| T224 | PASS | 17 | 3 | 0 | 0 |
| T225 | PASS | 17 | 2 | 0 | 0 |
| T370 | PASS | 17 | 4 | 0 | 0 |
| T907 | PASS | 19 | 8 | 0 | 0 |
| T612 | PASS | 16 | 3 | 0 | 0 |
| T908 | PASS | 21 | 3 | 0 | 0 |
| UT303 | PASS | 9 | 1 | 0 | 0 |
| T442 | PASS | 18 | 4 | 0 | 0 |
| T613 | PASS | 16 | 3 | 0 | 0 |
| T518 | PASS | 19 | 7 | 0 | 0 |
| T371 | PASS | 13 | 5 | 0 | 0 |
| T803 | PASS | 15 | 0 | 0 | 0 |
| T372 | PASS | 17 | 2 | 0 | 0 |
| T226 | PASS | 10 | 3 | 0 | 0 |
| T443 | PASS | 16 | 8 | 0 | 0 |
| T373 | PASS | 15 | 5 | 0 | 0 |
| T374 | PASS | 19 | 5 | 0 | 0 |
| T444 | PASS | 17 | 8 | 0 | 0 |
| T227 | PASS | 15 | 1 | 0 | 0 |
| T377 | PASS | 18 | 4 | 0 | 0 |
| T445 | PASS | 14 | 5 | 0 | 0 |
| T446 | PASS | 19 | 9 | 0 | 0 |
| T378 | PASS | 14 | 9 | 0 | 0 |
| T447 | PASS | 15 | 12 | 0 | 0 |
| T102 | PASS | 16 | 0 | 0 | 0 |
| T448 | PASS | 17 | 3 | 0 | 0 |
| T449 | PASS | 19 | 4 | 0 | 0 |
| T379 | PASS | 14 | 8 | 0 | 0 |
| T380 | PASS | 12 | 5 | 0 | 0 |
| T615 | REVIEW | 18 | 1 | 0 | 1 |
| NT307 | PASS | 11 | 3 | 0 | 0 |
| T450 | REVIEW | 20 | 6 | 0 | 1 |

