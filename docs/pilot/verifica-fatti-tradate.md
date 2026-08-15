# Verifica dei fatti d'area dimostrativi — Tradate

**Data della verifica:** 14 agosto 2026 · **Metodo:** ogni fatto scomposto con `area/claims.ts` e
controllato affermazione per affermazione contro fonti raggiungibili.

Questo documento esiste perché la lezione del programma è che **nessun controllo automatico sa se una
frase è vera**. I fatti qui sotto erano già passati da schema, guard soggettivo e controlli di stile.
La verifica manuale ne ha trovati **due sbagliati su sei**.

## Esito

| # | Fatto | Esito | Note |
|---|---|---|---|
| 1 | Stazione / linea ferroviaria | ❌ → corretto | Era «linea **S40** … diretti a **Como San Giovanni**». **Entrambi falsi.** Tradate è sulla **Saronno–Laveno** (Ferrovienord), servizi Trenord verso **Milano Cadorna via Saronno** |
| 2 | Varesina / ex SS233 | ✅ | Percorso istitutivo: Milano – Saronno – **Tradate** – Varese – Ponte Tresa; Tradate è fra i comuni attraversati |
| 3 | Servizi comunali | ❌ → corretto | Era «**in centro** … biblioteca civica **e** uffici anagrafe». Sono in **vie diverse**: anagrafe in **piazza Mazzini 6**, biblioteca civica in **via Zara 37**. «In centro» per la biblioteca non è verificabile |
| 4 | Ospedale | ✅ | **Ospedale «Luigi Galmarini»**, Tradate, parte di **ASST dei Sette Laghi** |
| 5 | Scuole | ✅ (precisato) | Le superiori esistono: **ISIS «Don Milani»** (liceo artistico, ITCG, ITIS). Il testo ora le nomina invece di dire genericamente «ogni grado» |
| 6 | Parco Pineta | ✅ | **4.828 ettari** la cifra più citata (le fonti variano fra ~4.586 e ~4.864): «circa 4.800» regge |

## Cosa insegna

- **2 errori su 6** in fatti che sembravano impeccabili: scritti bene, con una fonte accanto, senza
  giudizi. È la percentuale che spiega perché `AREA_FACTS` in produzione è vuoto e perché
  `approveAreaFact` pretende una persona.
- I due errori sono di tipo diverso e nessuno dei due è "una svista":
  1. **dato inventato con sicurezza** (la sigla di linea e una destinazione plausibile ma inesistente);
  2. **due cose vere unite da un legame falso** («in centro» applicato a due sedi in vie diverse).
     È il caso più insidioso: ogni singolo pezzo è vero, la frase no.
- **La checklist coglieva solo il primo.** Sul secondo errore produceva UNA sola casella
  («Tradate»): «biblioteca civica» e «uffici dell'anagrafe» sono nomi comuni, giustamente non
  trattati come nomi propri, e la parte falsa non era un nome ma il LEGAME fra i due. Avevo scritto
  che la checklist l'avrebbe intercettato: **non era vero**, verificato eseguendola.
  Da lì il controllo delle **affermazioni condivise** (`kind: "condivisa"`), che riconosce la forma
  «A e B» con predicato in comune e chiede di verificare i due membri separatamente. Ora quella
  frase produce la domanda giusta; le forme innocue (verbi coordinati, nomi propri che contengono
  «e») restano senza flag, con test a fissarlo.

## Limiti di questa verifica

- `trenord.it` risponde **403** alle richieste automatiche: la linea è confermata dalla documentazione
  della ferrovia Saronno–Laveno, non dalla pagina di linea dell'operatore. **Da riconfermare a mano.**
- I **tempi di percorrenza** (la cosa che chi compra chiede per prima) restano **assenti**: le cifre
  reperibili vengono da aggregatori, non da fonte primaria. Citare Trenord per un numero preso da
  Trainline sarebbe una falsa provenienza.
- Le fonti raggiunte sono in parte **secondarie** (voci enciclopediche, stampa locale). Per la
  pubblicazione servono le pagine ufficiali di Comune, ASST, Parco e operatore ferroviario.

**Conclusione: questi fatti restano DIMOSTRATIVI.** Sono corretti al meglio di ciò che è verificabile
da qui, non approvati. Prima della pubblicazione vanno ri-verificati da una persona sulle fonti
ufficiali correnti, con la checklist alla mano.
