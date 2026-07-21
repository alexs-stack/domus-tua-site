# Motion scale & surface system

Disciplina di movimento e superfici per Domus Tua (Prompt 9). Obiettivo: togliere il
"look da template" (tutte card 2rem, tutti reveal uguali col blur) mantenendo il brand
(rosso, crema/carta/espresso, Fraunces + Plus Jakarta Sans, Segno Domus — niente oro/blu).

## Scala di movimento (token in `app/globals.css`)

| Token | Valore | Uso |
|---|---|---|
| `--motion-fast` | `0.25s` | micro-interazioni: hover, focus, toggle, press |
| `--motion-base` | `0.45s` | transizioni standard: card, pannelli, dropdown |
| `--motion-reveal` | `0.7s` | reveal di sezione (opacity + translate modesto) |
| `--motion-cinematic` | `1.1s` | momenti firma (hero, ken burns) — con parsimonia |

Easing:
- `--ease-soft` `cubic-bezier(0.32,0.72,0,1)` → interazioni UI.
- `--ease-out-expo` `cubic-bezier(0.16,1,0.3,1)` → entrate/reveal editoriali.

**Regola:** usare i token invece di durate ad hoc. Le animazioni continue (marquee, ken burns,
scroll cue) e ogni movimento sono disattivati sotto `prefers-reduced-motion: reduce`.

## Reveal

- **Default** (`.reveal`): SOLO opacity + `translateY(1.5rem)`. **Niente blur** — non lascia
  testo sfocato durante lo scroll veloce e non appiattisce tutto sullo stesso effetto.
- **Firma** (`.reveal-cinematic`, opt-in via `className`): aggiunge un blur-in cinematografico.
  Riservato a **uno/due** momenti (oggi: intestazione del caso Open Domus). Non abusarne.

## Grain

`.grain` opacity `0.035` (ridotto): texture percepibile ma che **non intorbidisce** le foto
degli immobili né il testo piccolo.

## Tre tipi di superficie

Non tutto è una card. Scegliere consapevolmente:

1. **Editoriale / senza contenitore** — testo e immagini che vivono direttamente sulla sezione
   (niente bordo/card). Per racconto, intestazioni, liste. È il default: preferirlo.
2. **Soft card** (`--radius-card` 1.75rem, `--shadow-card`) — riservata a contenuto
   **interattivo o raggruppato** (schede immobile, pannelli, form). Non avvolgere ogni sezione.
3. **Cinematic full-bleed** — immagine/video a tutta larghezza (hero, before/after, poster
   sticky del caso Open Domus). Le immagini selezionate possono arrivare al bordo del viewport.

## Rosso

Il rosso pieno è per le **azioni primarie** (una per viewport) e per la **prova significativa**,
non per decorazione diffusa. Ridurre pill/pallini rossi non essenziali.

## Radius / border / shadow (già normalizzati come token)

`--radius-card` `1.75rem`, `--radius-card-lg` `2rem`, `--radius-field` `0.75rem`;
`--shadow-card`, `--shadow-card-hover`, `--shadow-float`. Usare i token, non valori sparsi.
