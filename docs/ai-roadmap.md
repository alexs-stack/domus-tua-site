# AI Roadmap — Domus Tua

L'AI è desiderata ma **non è MVP-critica**. La ricerca classica viene prima. L'input in linguaggio
naturale oggi presente (`PropertySearch`) è **solo un teaser non attivo** ("Ricerca intelligente in
arrivo"): non esegue alcuna query e non deve indurre l'utente a pensare che funzioni.

## Fasi

**Fase 1 — Ricerca classica + sync RealSmart (ora / in corso)**
- Filtri multi-campo (zona, contratto, tipologia, budget, locali, caratteristiche) su dati normalizzati.
- Sorgente immobili via `app/lib/realsmart/` (oggi mock, domani feed/API reale). Vedi
  `docs/realsmart-integration-notes.md`.

**Fase 2 — Ricerca in linguaggio naturale sugli annunci pubblici**
- Parsing della frase ("trilocale con giardino a Tradate sotto 300k") in `PropertyFilters`.
- Nessun dato privato: opera solo sugli annunci pubblici già sincronizzati.
- Attivare il campo NL già presente (rimuovere il teaser, collegare `searchProperties`).

**Fase 3 — Chatbot sui contenuti pubblici del sito**
- Q&A su metodo, Open Domus, Domus D.O.C., zone, come vendere/comprare.
- Base di conoscenza = solo contenuti pubblici del sito. Nessun dato riservato.

**Fase 4 — Voce / dettatura**
- Ricerca e chatbot utilizzabili a voce (accessibilità + mobile).

**Fase 5 — Assistente interno / RAG su dati privati (Drive)**
- Strumento interno per il team su documenti privati (Drive/gestionale).
- Richiede autenticazione, permessi e trattamento dati dedicati. Fuori dal sito pubblico.

## Regole
- Non creare comportamenti AI finti.
- Il campo NL resta chiaramente "in arrivo" finché la Fase 2 non è pronta (commento nel codice di
  `PropertySearch.tsx`).
- Nessun dato sensibile nel repo o nel client.
