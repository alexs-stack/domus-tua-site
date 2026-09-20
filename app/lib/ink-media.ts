/* L'INCHIOSTRO SOPRA LE IMMAGINI — UN VALORE PER TUTTO IL SITO (D80; A40 di Alberto).
   Chi l'ha chiesto: D80 di A28 (coordinatore, 18 settembre 2026), dopo aver
   trovato tre valori divergenti e nessun token — Congedo.tsx (due raggi),
   StarReviews.tsx (un raggio a 0,25) e PreloaderShell.tsx (un raggio a 28 px
   sul bruno). Com'è fatto oggi: vince il valore del Congedo, il più severo e il
   solo già passato da una lente, e vive qui come costante per i siti che
   scrivono `style` e in globals.css come utility `.dt-ink-media` per quelli che
   scrivono classi.

   È l'unico trattamento ammesso sul bianco che sta sopra un'immagine SCURA:
   l'ombra sta ATTACCATA ALLE LETTERE. NON è un velo — niente rettangolo,
   niente vignettatura, niente sfondo (la cliente, C14, DESIGN.md:580). Vale per
   il video del Congedo, le stelle e il preloader. NON vale per le teste di A38
   (le scritte bianche dentro le foto a schermo intero): lì A40 di Alberto
   (20 set. 2026, «negli screenshot di era-residence non c'erano le ombre sulle
   scritte bianche, rimuovile subito») vuole il bianco nudo, senza ombra né
   alone, come su era-residence. `ink-media.test.ts` ammette DUE occorrenze
   della proprietà in app/ (questa costante e l'utility) e nessun reset. */
export const INK_ON_MEDIA = {
  textShadow: "0 1px 2px rgb(0 0 0 / 0.35), 0 0 28px rgb(0 0 0 / 0.45)",
} as const;
