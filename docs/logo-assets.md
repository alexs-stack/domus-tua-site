# Logo — asset ufficiali e sostituzione

Oggi il sito usa un logo **ricostruito in codice** (SVG inline) dentro
`app/components/Logo.tsx`: un mark "tetto + cuore" e un wordmark "Domus" (grafite) + "Tua"
(rosso) con payoff "IMMOBILIARE". Funziona ed è on-brand, ma **non è il logo ufficiale del
cliente**. Questa guida spiega cosa chiedere al cliente e come sostituirlo senza rischi.

---

## 1. Regola per l'MVP: NON ridisegnare il logo

**In fase MVP non si reinventa né si "migliora" il logo.** Il mark attuale è una resa
fedele-ma-approssimata, pensata per non lasciare buchi in attesa dell'asset vero. Non va
usato come identità definitiva.

- ❌ Non creare varianti nuove del simbolo.
- ❌ Non cambiare proporzioni, font o colori "a occhio".
- ✅ Chiedere al cliente il **file originale del logo** e sostituirlo 1:1.

I colori attuali sono corretti e **vanno mantenuti**: grafite per "Domus", rosso per
"Tua", stone per il payoff. Sono già i token del design system (`--color-graphite`,
`--color-red`, `--color-stone`) e coerenti con il brand rosso/grigio/bianco caldo (niente
oro/blu/nero). Se l'asset ufficiale del cliente arriva con colori leggermente diversi,
allinearsi ai suoi valori originali ma restando dentro la palette del brand.

---

## 2. Cosa chiedere al cliente

Richiedere a Domus Tua (Raffaella / referente) il **logo originale**, in ordine di
preferenza:

1. **SVG** — formato ideale per il web: vettoriale, nitido a ogni dimensione, leggero,
   colori editabili. È quello che useremo.
2. **PDF vettoriale** — ottimo per far ricavare un SVG pulito.
3. **AI / EPS** (file sorgente Illustrator) — il master da cui esportare qualsiasi
   formato.

Da chiedere insieme al file:

- Versioni disponibili: **a colori**, **monocromatica** (per fondi scuri / stampa), e
  l'eventuale **solo simbolo** (senza testo) per favicon e usi piccoli.
- **Codici colore ufficiali** (HEX/RGB per web, eventuale Pantone/CMYK per stampa) per
  verificare che i nostri token combacino.
- **Font del wordmark** (nome esatto), se il logo è testo vivo e non tracciato.
- **Area di rispetto e dimensione minima**, se esiste un manuale/brand book.

> Evitare PNG/JPG del logo come asset primario: sono raster, sgranano se ingranditi e non
> permettono di cambiare colore. Un PNG ad alta risoluzione va bene solo come ripiego
> temporaneo, non come soluzione.

---

## 3. Dove salvare gli asset

Percorsi consigliati in `public/`:

```
public/logo-domustua.svg          ← logo completo a colori (principale)
public/logo-domustua-light.svg    ← versione per fondi scuri (usata nel Footer)
public/logo-domustua-mark.svg     ← solo simbolo (opzionale: favicon, usi piccoli)
```

I file in `public/` sono serviti dalla root, quindi si referenziano come
`/logo-domustua.svg`.

---

## 4. Dove viene usato il logo oggi

Il componente vive in `app/components/Logo.tsx` ed esporta due funzioni:

- `Logo` — wordmark + mark + payoff (usato in header).
- `LogoMark` — solo il simbolo.

Punti di utilizzo attuali (da qui in poi tutto passa dal componente, quindi si aggiorna in
un solo posto):

- `app/components/Header.tsx` → riga 36: `<Logo />`
- `app/components/Footer.tsx` → riga 20: `<Logo light />` (variante per fondo scuro)

Il prop `light` serve al footer per schiarire testo/payoff su sfondo scuro: la versione
reale dovrà gestire lo stesso caso (vedi sotto).

---

## 5. Come sostituire il logo con l'asset reale

L'obiettivo è cambiare **solo** l'interno di `Logo.tsx`, senza toccare Header/Footer né i
loro layout. Due strade:

### Opzione A — Servire il file SVG del cliente (consigliata)

Sostituisci il contenuto renderizzato dal componente con un `<img>` che punta all'asset
reale. Manteniamo la stessa firma (`className`, `light`) così i chiamanti non cambiano.

```tsx
// app/components/Logo.tsx
export function Logo({
  className = "",
  withPayoff = true, // mantenuto per compatibilità con i chiamanti
  light = false,
}: {
  className?: string;
  withPayoff?: boolean;
  light?: boolean;
}) {
  return (
    <img
      src={light ? "/logo-domustua-light.svg" : "/logo-domustua.svg"}
      alt="Domus Tua Immobiliare"
      className={`h-11 w-auto ${className}`}
    />
  );
}
```

Se serve anche il solo simbolo, aggiorna `LogoMark` per puntare a
`/logo-domustua-mark.svg` con lo stesso schema.

**Attenzione:** con `<img>` i colori del logo sono "cotti" dentro il file SVG del cliente,
quindi servono davvero due file (a colori + light) per gestire header e footer. Se invece
il logo deve cambiare colore via CSS, usa l'Opzione B.

### Opzione B — Inline dell'SVG del cliente (colori controllati via token)

Se il cliente fornisce un SVG **pulito** e vogliamo che i colori siano guidati dai nostri
token (una sola sorgente, niente file "light" separato), incolla i `path` ufficiali
dentro il JSX al posto di quelli attuali e sostituisci i valori `fill`/`stroke` fissi con
le CSS variable già in uso:

- `var(--color-graphite)` per la parte grafite del wordmark/simbolo
- `var(--color-red)` per la parte rossa
- `var(--color-stone)` per il payoff
- per la versione `light`, usa i valori chiari già presenti nel componente
  (`#f3eee5`, `rgba(243,238,229,0.6)`)

Questo mantiene un solo componente che si adatta a fondo chiaro/scuro via prop `light`,
esattamente come oggi. Richiede però che l'SVG del cliente sia ordinato (path nominati,
niente gruppi/maschere superflue).

### In entrambi i casi

- **Non modificare** `Header.tsx` e `Footer.tsx`: continuano a chiamare `<Logo />` e
  `<Logo light />` senza saperne di più.
- Verifica l'**allineamento verticale** e le dimensioni: il logo attuale è alto ~`h-9`
  (36px) con payoff sotto. Regola `h-*` finché l'ingombro combacia con quello attuale,
  così il layout dell'header non "salta".
- Controlla il logo su **entrambi i fondi** (header chiaro, footer scuro) e su mobile.

---

## 6. Favicon e social (nota per dopo)

Quando arriva il **solo simbolo** vettoriale, generane anche:

- `app/icon.svg` (o `.png` 512×512) per la favicon/app icon di Next.js
- l'immagine Open Graph, se si vuole il simbolo nella condivisione social

Non è bloccante per l'MVP, ma va messo a valle della consegna dell'asset ufficiale.

---

## 7. Checklist

- [ ] Richiesto al cliente il logo originale (SVG/PDF/AI) + versione mono + solo simbolo
- [ ] Verificati i codici colore ufficiali contro i token del brand
- [ ] Salvati gli asset in `public/logo-domustua*.svg`
- [ ] Aggiornato **solo** `app/components/Logo.tsx` (Opzione A o B)
- [ ] Mantenuti i colori/palette attuali (grafite/rosso/stone, no oro/blu/nero)
- [ ] Verificato header (fondo chiaro) e footer (`light`, fondo scuro) + mobile
- [ ] `Header.tsx` e `Footer.tsx` NON modificati
- [ ] (Dopo MVP) favicon `app/icon.svg` dal solo simbolo
