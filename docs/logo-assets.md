# Logo — asset ufficiali (ORIGINAL-FIRST)

> **Direttiva cliente (non negoziabile): NON ridisegnare il logo in MVP.**
> Il logo ufficiale Domus Tua è già usato su tutti i materiali del cliente e deve restare
> l'identità del sito. Il codice è già configurato per usarlo come **default**: basta
> depositare i file in `/public`.

---

## 1. File del logo

Dal redesign «rivista bianca» (2026-09-10) il footer è chiaro come la testata: stanno tutti e due
sull'avorio (`bg-cream`), quindi il logo a colori va bene su entrambi. Il codice oggi legge un
solo file per entrambi (`app/lib/brand.ts`):

| File | Uso | Note |
|------|-----|------|
| `public/logo-domustua-original.png` | Testata e footer (entrambi su avorio); immagine OG (`app/opengraph-image.tsx`, su fondo chiaro) | PNG trasparente 500×92 dal sito ufficiale, a colori (grigio e rosso) |

Il favicon non viene da un file del logo. Lo generano con `next/og` le file-convention
`app/icon.tsx` (256×256) e `app/apple-icon.tsx` (180×180): un monogramma «D» in Playfair Display su
rosso. In `public/` non c'è nessun `favicon.ico`.

Dal cliente serve comunque un **vettoriale** a colori, `public/logo-domustua-original.svg`: il PNG
largo 500 px su schermi grandi si vede morbido.

Formati, in ordine di preferenza per farci ricavare gli SVG puliti: **SVG** → **PDF vettoriale** → **AI/EPS**. Evitare PNG/JPG come asset primario (raster, sgranano, colore non editabile).

### Requisiti degli asset

- **Sfondo trasparente** (obbligatorio): niente riquadro bianco/colorato dietro il logo.
- **Vettoriale** (SVG), testo tracciato *oppure* font incorporato/segnalato.
- **A colori, grigio e rosso**: è la versione che va in testata e nel footer, entrambi su avorio.
  Il marchio compare però anche su una superficie scura, il pannello espresso del preloader: lì il
  badge (`MarkBadge`, anello di tacche e monogramma, in `app/components/motion/PreloaderShell.tsx`)
  resta grigio e rosso perché posa su un disco carta. Il pannello scuro e il disco sono tutti e due
  domande aperte nella spec `docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md`, §11.3 (domande 7 e 8), e il disco va contro «metti il
  logo senza sfondo bianco» (la cliente, 2026-08-06): come si leggerebbe il marchio sull'espresso
  senza disco non è deciso. Il test `app/components/__tests__/logo-colore.test.ts` impedisce di
  rendere le negative del logo che sono in `public/` (il suo commento cita la direttiva della
  cliente del 2026-08-26: il logo resta grigio e rosso).
- **Solo simbolo** (senza wordmark), se esiste: utile per gli usi piccoli, e per il favicon se si
  decide di sostituire il monogramma generato (andrebbe riscritto `app/icon.tsx`).
- **Codici colore ufficiali** (HEX/RGB, eventuale Pantone/CMYK) per verificare che combacino con i token del brand (`--color-red`, `--color-graphite`, `--color-stone`). Restare dentro la palette rosso/grigio/bianco caldo: **no oro, no blu, no nero luxury**.

### Dimensioni

- Il componente rende il logo a **200 × 37 px** di default (`brand.width`/`brand.height` in `app/lib/brand.ts`); la testata lo porta a `w-[clamp(150px,13vw,210px)]`, il footer a `w-[200px]`. Regolare `brand.width`/`brand.height` se l'aspect ratio ufficiale è diverso: l'SVG scala nitido comunque.
- **Favicon**: oggi generato in codice (vedi sopra), quindi il sito non usa un `favicon.ico`. Per farne il solo simbolo del logo serve il simbolo in vettoriale.
- **Avatar social / OG**: quadrato 512×512 dal solo simbolo (l'immagine di condivisione 1200×630 è generata da `app/opengraph-image.tsx`).

---

## 2. Come funziona nel codice

- **`app/lib/brand.ts`** — `useOriginalLogo: true` (default). `brand.logo` punta al file ufficiale. Il campo `favicon: "/favicon.ico"` è rimasto, ma non lo legge nessuno e il file non esiste. `showLogoDevPlaceholder` decide quando mostrare il placeholder.
- **`app/components/Logo.tsx`** — rende `<img>` con l'asset ufficiale. Se il file **manca** (404):
  - in **dev/preview** (`NEXT_PUBLIC_PREVIEW_BADGE=true` o sviluppo) mostra un placeholder onesto **“Logo ufficiale mancante”** — mai un logo finto ridisegnato;
  - in **produzione reale** ripiega su un wordmark testuale minimale (solo il *nome* "Domus Tua", non un mark inventato).
  La prop `light` esiste ancora (legge `brand.logoLight`, che oggi punta allo stesso PNG), ma nessun componente la usa.
- **`LogoMark`** (il mark casa+cuore ricostruito in codice) resta esportato **solo come fallback interno di sviluppo**, attivabile con `useOriginalLogo: false`. **Non è il default e non va usato in presentazione cliente.**
- **`app/icon.tsx`** e **`app/apple-icon.tsx`** — generano favicon e icona apple-touch (monogramma «D» su rosso). `app/layout.tsx` non imposta `metadata.icons`, e un suo commento lo dice.
- **Testata e footer** rendono tutti e due `<Logo />`, a colori: cambiato il file in `public/` (o ripuntato `brand.logo`), il logo nuovo compare in entrambi senza altre modifiche.
- **`app/opengraph-image.tsx`** legge il PNG direttamente dal disco, non da `brand.logo`: se cambia il file, va aggiornato anche lì.

---

## 3. Messa in opera (quando arrivano i file)

1. Copia i file in `public/` (§1). Se il nome o il formato cambiano, ripunta `brand.logo` in `app/lib/brand.ts` e il percorso in `app/opengraph-image.tsx`.
2. Ricarica: testata e footer mostrano subito il logo; se il file manca, in dev/preview compare il placeholder.
3. Verifica su **testata e footer (entrambi su avorio)**, **mobile** e immagine OG.
4. Se l'aspect ratio è diverso, regola `brand.width`/`brand.height` in `app/lib/brand.ts`.
5. **Non** modificare `Header.tsx`/`Footer.tsx`.

---

## 4. Checklist consegna

- [ ] Ricevuto dal cliente il logo a colori in vettoriale (`logo-domustua-original.svg`)
- [ ] Sfondo trasparente verificato su tutti i file
- [ ] Codici colore allineati ai token del brand (rosso/grigio/stone)
- [ ] File depositati in `public/`; `brand.logo` e `app/opengraph-image.tsx` ripuntati se il nome è cambiato
- [ ] Verificati testata e footer (entrambi su avorio), mobile e immagine OG
- [ ] Favicon generato (`app/icon.tsx`) visibile nel tab del browser
- [ ] (Opzionale) solo-simbolo per avatar social/OG 512×512
- [ ] Confermato: **logo NON ridisegnato** — è l'asset ufficiale del cliente


---

## 5. Logo nuovo e font delle scritte «Domus Tua» (dal 2026-09-10)

La cliente ha chiesto un **logo nuovo** (non ancora consegnato) e che **tutte le scritte
"Domus Tua"** — il lockup dell'hero, le occorrenze nel testo — usino **lo stesso font del logo**.
Il sito è pronto per lo scambio in due punti:

1. **Il file del logo**: depositarlo come nel §1 (`public/logo-domustua-original.svg`, oppure un
   `.png` al posto dell'attuale) e ripuntare `brand.logo` in `app/lib/brand.ts` se il nome cambia.
2. **Il font**: in `app/globals.css` il token `--font-brand` (oggi `var(--font-jakarta)`) decide il font
   delle scritte "Domus Tua" che lo usano (`font-brand` in `HeroCinematic.tsx`). Quando si sa quale
   font usa il logo nuovo: caricarlo con `next/font` in `app/layout.tsx` (variabile es. `--font-logo`) e
   ripuntare `--font-brand: var(--font-logo);`. Se il font è commerciale (Gotham, ecc.), servono i file
   licenziati in `app/fonts/` e `next/font/local`.

Oggi `font-brand` lo usa solo il lockup dell'hero. Il lockup «Domus Tua» del preloader è in Playfair
(`font-hero`, `app/components/motion/PreloaderShell.tsx`), quindi lo scambio del token non lo
raggiunge. Se allinearlo già ora o aspettare il logo nuovo è una domanda aperta (registro in
`DESIGN.md` alla radice del repo).

Il logo attuale (`logo-domustua-original.png`) è in un grottesco geometrico molto vicino a **Montserrat**
(libero su Google Fonts): se il logo nuovo conferma quel carattere, `Montserrat` a peso 800 è lo swap
più semplice.
