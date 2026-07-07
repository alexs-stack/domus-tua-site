# Recensioni — integrazione Google / Trustindex

Le recensioni sono un asset di credibilità enorme per Domus Tua e devono risultare **chiaramente
Google/Trustindex**, non testimonianze decorative.

## Stato attuale
- `app/lib/site.ts` → `embeds.trustindexLoader` è **valorizzato** con il loader reale Trustindex di
  Domus Tua. Quindi `Reviews.tsx` mostra il **widget reale** (recensioni Google verificate), non le
  card demo. `googleReviewsUrl` usa il **CID Google reale** ricavato dal Maps embed del sito ufficiale.
- `app/lib/reviews.ts` contiene **8 recensioni DEMO** usate SOLO come fallback in anteprima.
- `app/components/Reviews.tsx` — logica a 3 rami:
  1. `embeds.trustindexLoader` valorizzato → **widget Trustindex reale** (in un iframe `srcDoc`
     UTF-8, contenuto in una sezione premium). Mostra la riga "Recensioni Google verificate tramite
     Trustindex.".
  2. loader assente **e** `NEXT_PUBLIC_PREVIEW_BADGE=true` → griglia demo + tab categoria
     (Venditori/Acquirenti/Open Domus/Esperienza) + nota "esempi dimostrativi". **Solo anteprima.**
  3. loader assente in **produzione** → **nessuna recensione demo**: solo rating 4.9/5 + CTA
     "Leggi tutte le recensioni su Google". Così non si spaccia mai il demo per reale.

## Andare live — 2 opzioni

**A) Widget Trustindex (consigliato, il cliente lo usa già sul sito attuale)**
1. Dal pannello Trustindex copia lo script del widget (formato `https://cdn.trustindex.io/loader.js?<HASH>`).
2. Incollalo in `app/lib/site.ts` → `embeds.trustindexSrc`.
3. `Reviews.tsx` mostra automaticamente il **widget reale** al posto della griglia demo (branch
   `site.embeds.trustindexSrc`).

**B) Recensioni reali statiche**
1. Sostituisci l'array `reviews` in `app/lib/reviews.ts` con recensioni reali (testo, nome, luogo,
   rating, data ISO, fonte, `verified: true`).
2. Aggiorna `googleReviewsUrl` con l'**URL del profilo Google Business** reale (non una ricerca).

## Cosa serve dal cliente
- Codice widget Trustindex.
- URL profilo Google Business.
- Eventuale selezione delle recensioni migliori da mostrare in evidenza.

## Nota
Le recensioni demo sono marcate come tali nei commenti di `app/lib/reviews.ts`. Non presentare i
testi demo come reali in una demo cliente senza dirlo. In produzione le card demo **non** vengono
mai mostrate (vedi ramo 3 sopra).

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
