# RealSmart — checklist di validazione "live"

> Documento **interno sersan**. Il feed XML pubblico RealSmart è **collegato e funzionante**
> (`app/lib/realsmart/`). Prima del **lancio definitivo** resta da validare col cliente il
> **mapping dei campi** — non la modalità. Questa checklist va spuntata su un deploy con
> `NEXT_PUBLIC_USE_REALSMART` live (default) puntato al feed reale dell'agenzia.
>
> Sorgente: feed XML pubblico generato da RealSmart (default in `env.ts`,
> `https://www.gestim2002.it/portali/immobili_724.xml`), solo immobili attivi, ~5 update/giorno.
> Contesto: `docs/realsmart-integration-notes.md`, `docs/realsmart-field-mapping.md`,
> `docs/realsmart-security.md`.

---

## 1. Volume e presenza

- [ ] **Numero di immobili live** su `/case` è plausibile (ordine di grandezza atteso: ~180+).
- [ ] Il conteggio combacia con quello atteso dal gestionale (chiedere conferma al cliente).
- [ ] `GET /api/health` → `integrations.listingsMode === "realsmart"` (non `mock`).

## 2. Primi 10 annunci (spot-check contenuti)

- [ ] I **titoli dei primi 10** immobili sono sensati e in italiano corretto (no mojibake `Ã¨`, `â€™`).
- [ ] Zona/comune presenti e coerenti col titolo.
- [ ] Tipologia (Appartamento/Attico/Villa/…) mappata correttamente.

## 3. Immagini

- [ ] Le **foto caricano** (nessun broken-image) su listing e scheda.
- [ ] La prima immagine è quella "di copertina" attesa, non una planimetria.
- [ ] `next/image` non emette warning di dominio (host foto in `next.config.ts` → `remotePatterns`).

## 4. Stati e visibilità

- [ ] Immobili **venduti / ritirati / bozza NON compaiono** nelle liste pubbliche
      (filtro `HIDDEN_STATUSES` in `client.ts`).
- [ ] Se il cliente vuole i "Venduto" come prova sociale, è una scelta esplicita (oggi nascosti).

## 5. Prezzi

- [ ] **Formattazione prezzo** corretta (separatori migliaia IT, simbolo €, nessun `.00` sporco).
- [ ] Immobili "trattativa riservata"/senza prezzo gestiti con etichetta pulita, non `0 €`.

## 6. Slug e routing

- [ ] Gli **slug sono stabili** (derivati da riferimento/ID, non solo dal titolo che può cambiare).
- [ ] Nessun 404 sulle schede linkate dalle liste.
- [ ] Le **pagine di dettaglio `/case/[slug]` si generano** (SSG) senza errori in build.

## 7. Privacy / dati riservati (bloccante)

- [ ] **Nessun campo privato/catastale** esposto nelle schede pubbliche: dati catastali,
      note interne, anagrafica proprietari, provvigioni, indirizzo civico esatto se riservato.
- [ ] Solo i campi pubblici approvati sono mappati in `NormalizedProperty` (vedi `normalize.ts`).
- [ ] Vedi `docs/realsmart-security.md` per l'elenco di ciò che non deve mai uscire.

## 8. Robustezza

- [ ] Se il feed è lento/irraggiungibile, il sito **ripiega sui mock** (non pagina vuota) — e in
      preview il badge segnala il fallback (vedi `docs/realsmart-integration-notes.md` §fallback).
- [ ] `npm run check` (lint + typecheck + build) passa con il feed live.

---

## Gap noti da confermare col cliente (mapping)

Allineato a `MEMORY`/note: il feed **non espone** in modo affidabile **provincia** e **classe
energetica**. Decidere con il cliente se:

- lasciare quei campi vuoti/nascosti (comportamento attuale: specifiche vuote non mostrate), oppure
- integrarli da un'altra fonte prima del lancio.

Ogni altro campo dubbio (es. spese condominiali, anno costruzione) va verificato su 3–4 annunci
reali prima di darlo per buono in scheda.
