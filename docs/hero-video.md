# Hero cinematico — video & poster

L'homepage apre con **`HeroCinematic`** (`app/components/HeroCinematic.tsx`): un canvas
full-bleed che deve trasmettere energia, emozione, prova sociale e sicurezza — con
Raffaella e il team al centro. È **video-ready**: appena i file sono pronti, parte da solo.

`HeroClassic` (`app/components/HeroClassic.tsx` → `Hero.tsx`) resta disponibile come
fallback/test: per tornare al vecchio hero, in `app/page.tsx` importa `HeroClassic` al
posto di `HeroCinematic`.

---

## 1. File richiesti

Deposita in `public/media/` con questi nomi (già cablati in `app/lib/media.ts`):

| File | Uso |
|------|-----|
| `public/media/domus-hero.mp4` | sorgente video principale (H.264) |
| `public/media/domus-hero.webm` | sorgente video alternativa (VP9/AV1, più leggera) |
| `public/media/domus-hero-poster.jpg` | poster mostrato prima/della riproduzione |

Poi imposta `heroCinematic.enabled = true` in `app/lib/media.ts`.

Finché i file mancano o `enabled=false`, l'hero mostra la **foto reale di Raffaella + team**
(`/images/reali/raffaela-team-sede.jpg`) come base: la demo non è mai vuota.

---

## 2. Il clip ideale

- **Durata**: 15–35 secondi, in loop pulito (l'inizio e la fine devono raccordarsi).
- **Contenuto** (shot list): Raffaella che parla/accoglie, il team, un Open Domus affollato,
  visite e tour di immobili, clienti felici alla consegna chiavi, clip in stile social/reel.
- **Tono**: caldo, umano, luminoso — niente stock freddo, niente musica invadente (il video è muto).
- **Formato**: 16:9 orizzontale, 1080p. Punto focale leggermente alto (il testo sta in basso a sinistra).

## 3. Compressione (indicazioni)

Obiettivo: file leggero senza scatti. Il video è muto → rimuovi la traccia audio.

```bash
# MP4 (H.264) — buon compromesso qualità/peso, target < 4–6 MB
ffmpeg -i sorgente.mov -an -vf "scale=1920:-2" -c:v libx264 -crf 24 -preset slow \
  -movflags +faststart public/media/domus-hero.mp4

# WebM (VP9) — più leggero, servito per primo ai browser che lo supportano
ffmpeg -i sorgente.mov -an -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 34 -b:v 0 \
  public/media/domus-hero.webm

# Poster dal primo frame significativo
ffmpeg -i sorgente.mov -ss 00:00:02 -frames:v 1 -q:v 3 public/media/domus-hero-poster.jpg
```

## 4. Poster & mobile

- Il **poster è obbligatorio**: è ciò che si vede prima del video e su connessioni lente.
- Su **mobile** (o con `prefers-reduced-motion`) il video **non** viene caricato: resta la
  foto base (leggera, `next/image`), il testo resta leggibile e le CTA visibili. Questo è
  gestito in `HeroCinematic` via `matchMedia` — nessuna configurazione extra.

## 5. Performance & accessibilità (già implementate)

- `muted`, `loop`, `playsInline`, `preload="metadata"`, `poster` impostato.
- Nessuna animazione JS pesante; il video parte solo su desktop e senza reduced-motion.
- `onError`: se le sorgenti non caricano, si torna alla foto base senza rotture.
- Cornice **Segno Domus** (`SegnoDomusVideoFrame`) come firma sul canvas.

## 6. Checklist

- [ ] Clip 15–35s, muto, loop pulito, contenuti founder/team/Open Domus/clienti
- [ ] Esportati `domus-hero.mp4` + `domus-hero.webm` + `domus-hero-poster.jpg` in `public/media/`
- [ ] `heroCinematic.enabled = true` in `app/lib/media.ts`
- [ ] Verificato desktop (video parte) e mobile (poster, testo leggibile, CTA visibili)
- [ ] Verificato con “riduci animazioni” attivo (mostra poster)
