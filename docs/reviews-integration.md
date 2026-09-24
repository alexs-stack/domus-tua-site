# Recensioni — integrazione Google / Trustindex

Le recensioni sono un asset di credibilità enorme per Domus Tua e devono risultare **chiaramente
Google/Trustindex**, non testimonianze decorative.

## Stato attuale
- `app/lib/site.ts` → `embeds.trustindexLoader` è **valorizzato** con il loader reale Trustindex di
  Domus Tua. Quindi `Reviews.tsx` mostra il **widget reale** (recensioni Google verificate), non le
  card demo. `googleReviewsUrl` usa il **CID Google reale** ricavato dal Maps embed del sito ufficiale.
- `app/lib/reviews.ts` contiene **8 recensioni DEMO** usate SOLO come fallback in anteprima.
- **Il widget è dietro al consenso cookie.** Trustindex è un terzo che carica script e cookie
  propri: l'iframe si monta SOLO con `dt_consent=accepted`. L'unica implementazione del consenso è
  `app/lib/consent.ts` (hook `useConsent()`), la stessa che scrive il banner `CookieConsent`;
  accettando, il widget compare senza reload. Un test di content integrity verifica il gate.
- `app/components/Reviews.tsx` — logica a rami:
  1. loader valorizzato **e consenso accettato** → **widget Trustindex reale** (in un iframe
     `srcDoc` UTF-8, contenuto in una sezione premium). Mostra la riga "Recensioni Google
     verificate tramite Trustindex.".
  2. loader valorizzato **senza consenso** → nessun widget, nessuna demo: rating 4.9/5, nota che
     spiega perché il widget non si carica e CTA "Leggi tutte le recensioni su Google".
  3. loader assente **e** `NEXT_PUBLIC_PREVIEW_BADGE=true` → griglia demo + tab categoria
     (Venditori/Acquirenti/Open Domus/Esperienza) + nota "esempi dimostrativi". **Solo anteprima.**
  4. loader assente in **produzione** → **nessuna recensione demo**: solo rating 4.9/5 + CTA
     "Leggi tutte le recensioni su Google". Così non si spaccia mai il demo per reale.

## Andare live — 2 opzioni

**A) Widget Trustindex (consigliato, il cliente lo usa già sul sito attuale)**
1. Dal pannello Trustindex copia lo script del widget (formato `https://cdn.trustindex.io/loader.js?<HASH>`).
2. Incollalo in `app/lib/site.ts` → `embeds.trustindexSrc`.
3. `Reviews.tsx` mostra automaticamente il **widget reale** al posto della griglia demo (branch
   `site.embeds.trustindexSrc`).

**B) Recensioni native reali (card sul sito)**
1. Aggiungi le recensioni reali all'array **`approvedNativeReviews`** in `app/lib/reviews.ts`,
   ciascuna con **`status: "approved"`**, la **provenienza** (`google` / `trustindex` / `native`),
   testo, nome, luogo, rating (1–5) e data ISO. **NON** si tocca l'array `demoReviews` e **non** si
   inventa nulla.
2. Da quel momento `nativeReviews()` mostra le approvate **anche in produzione** (e il selettore
   ignora del tutto le demo). Il bollino "verificata" compare solo su queste.
3. Aggiorna `googleReviewsUrl` con l'**URL del profilo Google Business** reale (non una ricerca).

> Il vecchio campo `verified: boolean` non esiste più: una demo poteva dichiararsi `verified:true` e
> sembrare reale. Ora è lo **stato di pubblicazione** (`demo` vs `approved`) a decidere, e solo
> `approved` va in produzione — vedi `isPublishableReview` / `nativeReviews`.

## Cosa serve dal cliente per abilitare le testimonianze native
Finché non arriva quanto segue, `approvedNativeReviews` resta **vuoto** e la sezione a card **non**
compare in produzione (restano voto reale + link a Google + widget Trustindex sotto consenso):

1. **Le recensioni da pubblicare come card**, scelte dal cliente fra quelle vere di Google/Trustindex.
2. Per ciascuna: **testo** (o estratto fedele), **nome** (anche solo nome + iniziale, come lo mostra
   Google), **luogo**, **voto**, **data**, **provenienza**.
3. Il **permesso a ripubblicarle sul sito** (una recensione pubblica su Google non implica il
   consenso a replicarla altrove come testimonianza — meglio metterlo per iscritto).
4. Conferma che **non** vogliamo aggiungere dati strutturati di recensione (schema `AggregateRating`)
   finché non c'è contenuto reale e visibile a supporto (policy Google; oggi deliberatamente omesso).
- Restano validi: **codice widget Trustindex** e **URL profilo Google Business**.

## Nota
Le recensioni demo sono marcate `status: "demo"` in `app/lib/reviews.ts`. Non presentarle come reali
in una demo cliente senza dirlo. In produzione **non** vengono mai mostrate: il selettore le esclude,
non solo un ramo del componente.

## Checklist di lancio (recensioni)
Da spuntare sul **dominio di produzione finale** prima del go-live:

- [ ] **Widget Trustindex** si carica e renderizza sul **dominio di produzione** (alcuni widget sono
      vincolati al dominio: verificare che l'hash sia abilitato per `www.domustua.com`, non solo per
      il sito attuale/preview).
- [ ] **Google Maps CID** — `googleReviewsUrl` (`?cid=…` in `site.ts`) apre il **profilo Google
      Business reale** di Domus Tua Tradate, non una ricerca generica.
- [ ] **Rating e numero** (`app/lib/reviews.ts` → `reviewSummary`) allineati al valore reale mostrato
      da Google/Trustindex (oggi 4,9/5 · ~531).
- [ ] **Nessuna recensione demo visibile** in produzione: con `NEXT_PUBLIC_PREVIEW_BADGE=false` e
      widget attivo, la griglia demo non deve comparire.
- [ ] La riga "Recensioni Google verificate tramite Trustindex." è presente e corretta.
