# Hero brand film — shot list & specifiche di consegna

Documento per il team di produzione (riprese Domus Tua). L'hero della homepage
(`app/components/HeroCinematic.tsx`) è **video-ready**: appena i file arrivano in
`/public/media` e si imposta `enabled: true` in `app/lib/media.ts`, il video parte.
Finché non ci sono, l'hero mostra il **poster reale** (foto della fondatrice + villa).

> **Regola d'oro:** solo girato **reale** di Domus Tua. Niente stock generico, niente
> finzione, niente 3D/particelle. Case vere, team vero, clienti veri, emozione vera.

---

## Direzione creativa

Caldo, umano, "founder-led". Cinema immobiliare editoriale, non demo tecnologica.
Luce naturale, palette coerente col brand (rosso/crema/espresso), ritmo lento e sicuro.
**Muto** (nessun audio in autoplay): la storia si racconta con le immagini.

## Shot list (ordine esatto)

1. **Porta o chiave che si apre** — dettaglio: mano che gira la chiave / porta che si apre
   sulla luce. È l'inizio (e il punto di loop). ~2s.
2. **Raffaela che accoglie un cliente** — sguardo, sorriso, stretta di mano sulla soglia. ~3s.
3. **Il team che prepara un Open Domus** — allestimento, home staging, cura dei dettagli. ~2–3s.
4. **Dettagli dell'immobile** — luce sui materiali, ambienti valorizzati, texture. ~2–3s.
5. **Visitatori e conversazione** — persone reali che vivono l'Open Domus, dialogo. ~2–3s.
6. **Consegna al cliente / finale emotivo** — chiavi consegnate, abbraccio, gioia autentica. ~2–3s.
7. **Loop fluido verso l'apertura** — chiusura che rientra sullo shot 1 senza stacco visibile. ~1–2s.

Totale: **15–20 secondi**, in loop continuo e impercettibile.

## Specifiche di consegna

| Parametro | Target |
|---|---|
| Durata | 15–20 s, loop seamless |
| Audio | **nessuno** (muto) |
| Master desktop | 16:9, 1080p |
| Peso video | **< 5 MB** preferibile (per sorgente) |
| Formati | **AV1** (`domus-hero.av1.webm`), **VP9 WebM** (`domus-hero.webm`), **H.264 MP4** (`domus-hero.mp4`) |
| Poster video | `domus-hero-poster.jpg`, 16:9, **< 300 KB** dove accettabile |
| Impatto | nessun peggioramento di **LCP** né **CLS** (il video monta dopo il poster) |

### File attesi in `/public/media/`

```
domus-hero.av1.webm     ← AV1 (miglior compressione)
domus-hero.webm         ← VP9 (fallback moderno)
domus-hero.mp4          ← H.264 (fallback universale)
domus-hero-poster.jpg   ← poster del <video>
```

### Codifica (esempi ffmpeg, indicativi)

```bash
# H.264 MP4 (fallback universale)
ffmpeg -i master.mov -vf "scale=1920:-2" -c:v libx264 -crf 24 -preset slow -an -movflags +faststart domus-hero.mp4
# VP9 WebM
ffmpeg -i master.mov -vf "scale=1920:-2" -c:v libvpx-vp9 -b:v 0 -crf 33 -an domus-hero.webm
# AV1 (WebM)
ffmpeg -i master.mov -vf "scale=1920:-2" -c:v libaom-av1 -crf 34 -b:v 0 -an domus-hero.av1.webm
# Poster (primo frame significativo)
ffmpeg -i master.mov -ss 00:00:01 -frames:v 1 -q:v 3 domus-hero-poster.jpg
```

## Comportamento a runtime (già implementato)

- Il video parte **solo** su desktop (≥768px), **senza** `prefers-reduced-motion`
  e **senza** data-saver / connessioni 2G.
- Viene montato **dopo** il paint del poster (via `requestIdleCallback`), quindi non
  entra nel percorso critico dell'LCP.
- Se una sorgente fallisce, il browser prova la successiva; se falliscono tutte,
  **fallback automatico** al poster immagine reale.
- Controllo **pausa/play** discreto in basso a destra (accessibilità: l'utente può fermare
  il movimento). Nessun audio.
- In sviluppo, se `enabled: true` ma i file mancano, la console **avvisa** con l'URL 404.

## Andare "live"

1. Metti i quattro file in `/public/media/`.
2. In `app/lib/media.ts` imposta `heroCinematic.enabled: true`.
3. Verifica su desktop, mobile, `prefers-reduced-motion: reduce` e con data-saver attivo.
4. Conferma con `/api/health` (`heroVideoLive: true`) dopo il deploy.
