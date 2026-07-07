# Media — checklist finale (performance / LCP)

> Documento **interno sersan**. Target e regole per mantenere il sito **dinamico ma veloce**.
> Le immagini passano da `next/image` (ottimizzazione on-the-fly in WebP/AVIF + resize per
> breakpoint), quindi ciò che conta di più è: **una sola immagine priority per pagina** (LCP),
> tutto il resto lazy, e **sorgenti non enormi**. Vedi anche `docs/media-optimization.md` e
> `docs/performance-notes.md`.

## Stato verificato (pass)

- **LCP / priority** — solo **2** immagini con `priority`, una per pagina: hero homepage
  (`HeroCinematic`) e hero pagine interne (`PageHero`). Nessun'altra immagine è priority. ✅
- **Below-the-fold** — tutte le altre `<Image>` sono **lazy** di default (next/image). ✅
- **`sizes`** — tutte le immagini `fill` hanno un attributo `sizes` corretto (nessun fetch
  a `100vw` non voluto). ✅
- **Hero video** — `heroCinematic.enabled = false`: nessun `<video>` viene montato. Quando sarà
  attivo, monta **dopo** il paint del poster (`requestIdleCallback`, solo desktop, no
  reduced-motion) → **non blocca l'LCP**. ✅
- **Trustindex** — iframe `loading="lazy"`, dentro `srcDoc`. ✅
- **YouTube** — nessun iframe auto-caricato: featured via `LazyYouTubeEmbed` (click-to-load), le
  altre card sono **thumbnail → link** al canale. ✅

## Target dimensioni sorgenti

| Asset | Target sorgente | Note |
|---|---|---|
| Hero poster / base (`villa-pool.jpg` ecc.) | ~1600–2000px lato lungo, **≤ 300 KB** | è l'LCP: sorgente snella = ottimizzazione più rapida |
| Hero video (mp4 + webm) | 15–35s, ~1080p, muto, loop, **≤ 3–4 MB** | attivare solo con file ottimizzati (`heroMedia`/`heroCinematic.enabled`) |
| Foto immobili (RealSmart) | lato lungo ~1600px | servite via next/image; il feed fornisce gli URL |
| Foto editoriali / staging | ~1600px lato lungo, **≤ 300 KB** | |
| Thumbnail video / card | ~1280×720, **≤ 200 KB** | |
| Loghi / premi | PNG/SVG, **≤ 150 KB** | preferire SVG dove possibile |

**Formati:** esportare in **WebP** (o AVIF) dove possibile; `next/image` serve comunque
WebP/AVIF ai browser che li supportano, ma sorgenti più leggere aiutano build e Data Cache.

## Regola YouTube (mantenere)

Mai più di **un** iframe YouTube caricato alla volta, e **solo al click** (`LazyYouTubeEmbed`).
Le gallerie video restano thumbnail statiche che linkano al video/canale.

## Da ottimizzare prima del go-live (sorgenti pesanti trovate)

Sorgenti **> 400 KB** da ri-esportare più leggere (senza perdere qualità visibile):

- [ ] `public/images/reali/yt-banner.jpg` — **1.0 MB**
- [ ] `public/images/reali/premio-team.jpg` — **652 KB**
- [ ] `public/images/reali/villa-pool.jpg` — **544 KB** (è l'hero base/LCP: prioritario)
- [ ] `public/images/reali/piscina-lusso.jpg` — **536 KB**
- [ ] `public/images/reali/premio-top-agency.jpg` — **452 KB**

> Non ricomprimere in automatico le foto reali del cliente: ri-esportarle con cura (o farle
> ri-esportare) mantenendo la qualità. `next/image` mitiga l'impatto lato utente, ma sorgenti
> snelle riducono i tempi di build/ottimizzazione e il peso del repo.

## Verifica post-deploy

- [ ] Lighthouse mobile: LCP < 2.5s sulla homepage (con feed/immagini reali).
- [ ] L'immagine LCP è l'hero (non un'immagine sotto la piega).
- [ ] Nessun iframe (Trustindex/YouTube) nella waterfall iniziale prima dell'interazione.
