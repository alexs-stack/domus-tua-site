# Logo — asset ufficiali (ORIGINAL-FIRST)

> **Direttiva cliente (non negoziabile): NON ridisegnare il logo in MVP.**
> Il logo ufficiale Domus Tua è già usato su tutti i materiali del cliente e deve restare
> l'identità del sito. Il codice è già configurato per usarlo come **default**: basta
> depositare i file in `/public`.

---

## 1. File richiesti dal cliente

Deposita questi file in `public/` con **esattamente** questi nomi (il codice li cerca già):

| File | Uso | Note |
|------|-----|------|
| `public/logo-domustua-original.svg` | Header (su sfondo chiaro) | versione **a colori** |
| `public/logo-domustua-original-light.svg` | Footer (su sfondo scuro grafite) | versione **chiara/monocromatica** |
| `public/favicon.ico` | Favicon browser + avatar | multi-size 16/32/48 |

Formati, in ordine di preferenza per farci ricavare gli SVG puliti: **SVG** → **PDF vettoriale** → **AI/EPS**. Evitare PNG/JPG come asset primario (raster, sgranano, colore non editabile).

### Requisiti degli asset

- **Sfondo trasparente** (obbligatorio): niente riquadro bianco/colorato dietro il logo.
- **Vettoriale** (SVG), testo tracciato *oppure* font incorporato/segnalato.
- **Due varianti**: chiaro/colore per fondi chiari (header), chiara per fondi scuri (footer).
- **Solo simbolo** (senza wordmark), se esiste: utile per favicon e usi piccoli.
- **Codici colore ufficiali** (HEX/RGB, eventuale Pantone/CMYK) per verificare che combacino con i token del brand (`--color-red`, `--color-graphite`, `--color-stone`). Restare dentro la palette rosso/grigio/bianco caldo: **no oro, no blu, no nero luxury**.

### Dimensioni

- Il componente rende il logo a **176 × 42 px** di default (`brand.width`/`brand.height` in `app/lib/brand.ts`). Regolare lì se l'aspect ratio ufficiale è diverso — l'SVG scala nitido comunque.
- **Favicon**: `favicon.ico` multi-size (almeno 32×32). Opzionale `apple-touch-icon` 180×180.
- **Avatar social / OG**: quadrato 512×512 dal solo simbolo (vedi anche `og-image` in `docs/` per l'immagine di condivisione 1200×630).

---

## 2. Come funziona nel codice (già pronto)

- **`app/lib/brand.ts`** — `useOriginalLogo: true` (default). Contiene i percorsi ufficiali e `favicon`. `showLogoDevPlaceholder` decide quando mostrare il placeholder.
- **`app/components/Logo.tsx`** — rende `<img>` con l'asset ufficiale (variante `light` per il footer). Se il file **manca** (404):
  - in **dev/preview** (`NEXT_PUBLIC_PREVIEW_BADGE=true` o sviluppo) mostra un placeholder onesto **“Logo ufficiale mancante”** — mai un logo finto ridisegnato;
  - in **produzione reale** ripiega su un wordmark testuale minimale (solo il *nome* "Domus Tua", non un mark inventato).
- **`LogoMark`** (il mark casa+cuore ricostruito in codice) resta esportato **solo come fallback interno di sviluppo**, attivabile con `useOriginalLogo: false`. **Non è il default e non va usato in presentazione cliente.**
- **`app/layout.tsx`** — `metadata.icons` punta a `/favicon.ico`.
- **Header/Footer** rendono già `<Logo />` e `<Logo light />`: appena i file sono in `public/`, il logo ufficiale compare ovunque senza altre modifiche.

---

## 3. Messa in opera (quando arrivano i file)

1. Copia i file in `public/` con i nomi esatti della tabella (§1).
2. Ricarica: header e footer mostrano subito il logo ufficiale; il placeholder sparisce.
3. Verifica su **fondo chiaro (header)** e **fondo scuro (footer)** + **mobile**.
4. Se l'aspect ratio è diverso, regola `brand.width`/`brand.height` in `app/lib/brand.ts`.
5. **Non** modificare `Header.tsx`/`Footer.tsx`.

---

## 4. Checklist consegna

- [ ] Ricevuti dal cliente: `logo-domustua-original.svg`, `logo-domustua-original-light.svg`, `favicon.ico`
- [ ] Sfondo trasparente verificato su tutti i file
- [ ] Codici colore allineati ai token del brand (rosso/grigio/stone)
- [ ] File depositati in `public/` con i nomi esatti
- [ ] Verificato header (chiaro), footer (`light`, scuro), mobile
- [ ] Favicon visibile nel tab del browser
- [ ] (Opzionale) solo-simbolo per avatar social/OG 512×512
- [ ] Confermato: **logo NON ridisegnato** — è l'asset ufficiale del cliente
