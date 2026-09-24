# Il Segno Domus

Un motif visivo ricorrente derivato dal logo casa + cuore. Serve a dare al sito
una firma riconoscibile senza aggiungere decorazione fine a se stessa: ogni volta
che compare, il visitatore ritrova — anche inconsciamente — lo stesso gesto del marchio.

---

## Cos'è

Due tratti che dialogano, ripresi direttamente dal `LogoMark`:

1. **La linea-tetto** — un segmento rosso (`--color-red`, `#d20a0a`) che scende in
   diagonale, come lo spiovente del tetto nel logo (`M6 21.5 24 7l18 14.5`).
   È il gesto della protezione, del "coprire" una casa.
2. **La linea-abbraccio** — una curva grigia morbida (`--color-line` / `--color-stone`)
   che accoglie o sottolinea la diagonale rossa. È l'eco del cuore e del corpo-casa
   arrotondato del logo: il lato umano, il "Tua".

Insieme formano un piccolo sistema: **rosso che protegge, grigio che accoglie**.
Non è un secondo logo, è la sua grammatica ridotta a due linee.

```
        ╲              ← linea-tetto (rossa, diagonale, sottile)
         ╲
    ‿‿‿‿‿‿‿‿‿          ← linea-abbraccio (grigia, curva, bassa opacità)
```

---

## Perché si collega al logo attuale

- **Stessa origine geometrica.** La diagonale nasce dal path del tetto; la curva
  nasce dalla rotondità del corpo-casa e dalla forma del cuore. Nessuna forma nuova
  è inventata: il motif è un frammento del marchio, non un ornamento parallelo.
- **Stessa coppia cromatica.** Grafite/grigio come struttura, rosso come accento
  puntuale — esattamente la logica di "**Domus** grigio + **Tua** rosso".
- **Stesso tono.** Il logo è lineare, sottile (stroke 2.6), con un solo pieno rosso
  (il cuore). Il motif eredita questa misura: linee, non campiture; un solo punto di rosso.

---

## Dove usarlo

| Contesto | Come si presenta |
| --- | --- |
| **Divider di sezione** | Al posto della `.hairline` piatta, occasionalmente, una diagonale rossa sottile che interrompe la linea grigia in un punto. Marca il passaggio tra due sezioni senza urlare. |
| **Hover card** | Su hover, la linea-tetto rossa appare/si estende in un angolo della card (top-right), come firma che "attiva" l'elemento. Coerente con l'hover `hover:border-red` già usato. |
| **Mask immagini / video** | La curva-abbraccio come clip morbido sul bordo inferiore di un'immagine, oppure la diagonale come taglio d'angolo di un poster video. Sempre sottile, mai a coprire il soggetto. |
| **Badge** | Micro-versione del segno accanto a etichette di fiducia ("Documenti verificati", rating). Da usare con parsimonia: uno per vista, non su ogni badge. |
| **Sfondi CTA** | Sulle sezioni CTA (es. contatti), il motif in grande, a bassissima opacità, come texture di fondo che incornicia il messaggio — nello spirito dell'`alone caldo` radiale già presente nello Hero. |

---

## Come usarlo con misura

- **Uno per vista.** Al massimo un'occorrenza forte per schermata. Il resto, se presente,
  deve stare sotto la soglia dell'attenzione (texture, non elemento).
- **Sempre sottile.** Spessori da 1px a 2.6px (come lo stroke del logo). Mai tratti spessi
  o pieni ampi di rosso.
- **Opacità bassa sulle superfici.** Come sfondo o texture: 4–8% (in linea con `.grain` 0.035
  e con l'alone Hero a `rgba(210,10,10,0.06)`). In primo piano (divider, hover): opacità piena
  ma ingombro minimo.
- **Progressivo, non permanente.** Meglio se rivelato dall'interazione (hover) o dallo scroll
  (coerente con `.reveal` / `ease-out-expo`) piuttosto che sempre stampato ovunque.
- **Rispetta `prefers-reduced-motion`.** Se il segno si anima (estensione della linea su hover
  o al reveal), l'animazione va disattivata nella media query già in uso.
- **Un solo punto di rosso.** Come nel logo c'è un solo cuore pieno, nel motif il rosso è
  l'accento singolo; il grigio fa il lavoro strutturale.

---

## Cosa evitare

- **Niente pesantezza / effetto cheesy.** No pattern ripetuto a tappezzeria, no cuori sparsi,
  no "casette" stilizzate ovunque. Il segno è un accenno, non un timbro.
- **Non competere col logo.** Mai posizionare il motif accanto o troppo vicino al `Logo`/`LogoMark`
  (header, footer): si annullerebbero. Il motif vive nelle sezioni, il logo negli angoli di brand.
- **Mai sul testo.** Il segno non passa sopra titoli o paragrafi, non fa da sottolineatura di parole,
  non riduce la leggibilità. Se sta su un blocco di testo, sta come sfondo lontano a bassa opacità.
- **Niente fuori palette.** Solo rosso `#d20a0a` (o `--color-red-dark` per lo stato hover)
  e i grigi `--color-line` / `--color-stone`. **Niente oro, niente blu, niente nero pieno**,
  niente gradienti sgargianti.
- **Niente ridondanza.** Se una sezione ha già un forte segnale rosso (CTA piena, eyebrow marcata),
  il motif si fa da parte o sparisce.

---

## Riferimenti tecnici rapidi

- **Colori:** `--color-red` `#d20a0a` (accento), `--color-red-dark` `#a30707` (hover),
  `--color-line` `#e7e2da` e `--color-stone` `#6b665f` (struttura/curva).
- **Spessori:** 1px (divider/texture) → 2.6px (allineato allo `strokeWidth` del logo).
- **Opacità superfici:** 0.04–0.08.
- **Motion:** `--ease-out-expo` per il reveal del segno; disattivare in `prefers-reduced-motion`.
- **Geometria di partenza:** path tetto `M6 21.5 24 7l18 14.5` e corpo-casa arrotondato del
  `LogoMark` (`app/components/Logo.tsx`).
