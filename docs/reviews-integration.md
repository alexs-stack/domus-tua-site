# Recensioni — integrazione Google / Trustindex

Le recensioni sono un asset di credibilità enorme per Domus Tua e devono risultare **chiaramente
Google/Trustindex**, non testimonianze decorative.

## Stato attuale
- `app/lib/reviews.ts` contiene **8 recensioni DEMO** (rating, data, fonte Google/Trustindex,
  `verified`). Sono rappresentative, **da sostituire** con recensioni reali.
- `app/components/Reviews.tsx` mostra: badge fonte per card ("Recensione Google"/"Recensione
  Trustindex"), rating a stelle, data, spunta "verificato", link "Leggi su Google", tab per
  categoria (Venditori/Acquirenti/Open Domus/Esperienza) e la card riepilogo 4.9/5.
- `app/lib/site.ts` → `googleReviewsUrl` (oggi una ricerca Google generica) e `embeds.trustindexSrc`
  (vuoto).

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
testi demo come reali in una demo cliente senza dirlo.
