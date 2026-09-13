# Home, capitoli 7-12: Paths, Method, OpenDomus, D.O.C., Services, CostiChiari

Corsia homeB. Decisioni di partenza: A18 «Coreografia piena», A19 «Sticky dove serve», A20 «Fedeltà letterale» (memoria domus-coreografia-era.md:13-16). Sono direttive di Alberto, superano C03 e il Don't di DESIGN.md:587, e vanno girate alla cliente come domanda.

Riferimenti: `ERA:n` = reverse-engineering/era-residence/js/main.pretty.js; `CAT §n` = docs/superpowers/specs/2026-09-13-coreografia-era-residence/map/era-catalog.md.

---

## 0. Premesse

### 0.1 Primitive della corsia «sistema» che questo documento usa

| Primitiva | Cosa le chiedo |
|---|---|
| **lessico dei tempi** | durS 0.4, durM 0.8, durL 1.2, delayReveal 0.3, stagger 0.1 (ERA:2858-2862). Ease da registrare in app/lib/motion/gsap.ts, una per riga nella forma `CustomEase.create("nome", "a,b,c,d")` (la regex di intro-clocks.test.ts:73 legge quella forma): `dtIn` 0.5,0,0.75,0 · `dtInOut` 0.75,0,0.25,1 · `dtEase` 0.25,0.1,0.25,1 · `dtWrite` 0.333,0,0.667,1. Già presenti: `dtOut` (gsap.ts:73), `dtDiveIn` (:72), `dtHorScroll` (:78). |
| **useCorridor** | Dentro `gsap.matchMedia()` con `${MQ.motionOk} and ${MQ.lg}`: mette `data-on` sull'host, lo toglie al revert, e chiama `ScrollTrigger.refresh()` DOPO aver cambiato l'altezza del corridoio. Senza questo refresh gli scrub dei capitoli 11 e 12, sotto la finestra, nascono con posizioni vecchie (trappola «ScrollTrigger in fondo alla home» e «refresh su altezze dinamiche», memoria domus-wow-layer). |
| **useAmbientVideo** | `useAmbientVideo(videoRef, hostRef, { rootMargin, minWidth })`: play solo con host in vista, motion ok, minWidth, `!navigator.connection?.saveData`, scheda visibile; pausa altrimenti; mai scrivere `currentTime` (ripresa dal punto, come ERA:393-396). Estrae il gate di Congedo.tsx:52-79: con l'acqua i consumatori diventano due, quindi l'hook ha senso (condizione di media P1). |
| **SplitReveal** | Il flip per lettera dei titoli (A20) con uscita speculare e innesco a IntersectionObserver. In questi sei capitoli sostituisce TextLines su h2 e h3. Non è il gesto di sezione. |

### 0.2 La regola che separa testo e gesto

Testo identico ovunque, gesto di sezione unico per capitolo. Eyebrow, titoli, lead e link si comportano allo stesso modo in tutti i capitoli (SplitReveal e Reveal). Il vincolo A20 «né easing, né durata, né range di trigger» vale per il gesto di sezione. Scritto così, l'articolo non si contraddice più (critic.md punto 5).

### 0.3 Tabella di unicità dei capitoli 7-12

| # | Capitolo | Gesto | Bersaglio | Ease | Durata / scrub | Range o innesco | Sotto 1024 |
|---|---|---|---|---|---|---|---|
| 7 | Paths | colonne in controfase | le due colonne di ogni riga | `power1.inOut` | scrub 0.5 | riga `top 125%` → `bottom -25%` | stessa controfase in px (±11 px a 390) |
| 8 | Method | tendina a verso alternato | `.dt-media-half` di ogni atto | `power4.out` | 2.4 s, delay 0.8 | IO al bordo basso (threshold 0) | identica |
| 9 | OpenDomus | finestra sticky, otturatore e 1.84 | tende, stage | `none` (otturatore), `dtInOut` (scala) | scrub true | area `top bottom` → +300vh | otturatore a tempo sulla foto quadrata |
| 10 | D.O.C. | righe che si tirano | hairline di riga e spina verticale | `dtWrite` | 1.2 s (spina 1.6 s), stagger 0.1, delay 0.3 | IO a 80% (`rootMargin 0 0 -20% 0`) | identica, senza spina sotto md |
| 11 | Services | zoom d'ingresso | interno della foto | `dtEase` | scrub 0.25 | box `top bottom` → `bottom bottom` | identico |
| 12 | CostiChiari | l'acqua che sale | banda video | `power2.out` | scrub 1 | banda `top 75%` → `bottom 85%` | clip sul poster, niente video |

Uscite: Method 0.4 s `dtIn`; D.O.C. 0.5 s `power3.in`; OpenDomus sotto 1024 reverse a timeScale 2. Gli scrub non hanno uscita propria: risalendo si riavvolgono (speculari per costruzione).

Collisioni già presenti in pagina, da tenere d'occhio nella tabella generale:
- Il sipario del territorio usa `inset(0% 100% 0% 0%)` → `inset(0%)`, 1.6 s, `dtOut`, scala 1.15 → 1 (HorizonScroller.tsx:53-62, :334-360, :580-601). È l'antenato della tendina di Era (CAT §6c). Per questo Method NON prende `dtOut` né la scala: prende `power4.out`, 2.4 s, verso alternato.
- Tre capitoli della home portano uno `scale .75 → 1`: HomeSearchGateway (3), lo stage di OpenDomus (9), il footer del Congedo (17). Lo stage di OpenDomus è l'unico con origine `50% 0%`, ease `dtInOut`, senza opacità e dentro la timeline del corridoio (posizioni 0.6 → 1.0).
- `ease none` in scrub: Posizionamento (wordSpacing) e Social (xPercent, ERA:2612-2638) lo useranno se restano letterali. Per questo Paths prende `power1.inOut`. L'otturatore della finestra resta `none` perché è un tratto interno di una timeline, come in ERA:2727-2746.

---

## 7. Paths: le colonne in controfase

### Stato attuale
- Sezione `dt-chapter` (Paths.tsx:214). Testa con Reveal e TextLines h2 d2 (:216-221).
- Due righe `grid gap-[6vw] lg:grid-cols-2 lg:items-center`, con `id` vendi/acquista sulla riga (:228-231). La riga pari specchia con `lg:order-2 lg:justify-self-end` (:233-236).
- Foto in `Parallax speed={-0.04}` (:236-247): yPercent ±0.56% (Parallax.tsx:92, speed×14). Testo con TextLines h3 (:249), Reveal su lead e CTA (:252-267).
- `coverSizes` = 90·r / 84·r / 42·r vw (:48-49). Foto: raffaela-specchio-profilo.jpg 2560×1920, villa-pool.jpg 1920×1280 (un'altra villa, con Raffaela).

### Gesto e valori (CAT §11, ERA:875-904)
- Colonna visivamente a SINISTRA: `yPercent -10 → 10` (ctn-down). Colonna a DESTRA: `yPercent 10 → -10` (ctn-up). Nella riga 1 la foto sta a sinistra e scende; nella riga 2 la foto sta a destra e sale.
- `fromTo`, ease `power1.inOut` (vedi 0.3), scrub 0.5.
- Trigger: la RIGA, non la colonna. Era usa l'elemento stesso (ERA:884), ma ScrollTrigger misura al refresh con l'animazione riportata all'inizio, quindi con la colonna già spostata del 10%. La riga non si muove mai.
- start `top 125%`, end `bottom -25%`. A metà corsa il centro della riga passa a metà viewport, e lì le colonne sono allineate come nel layout fermo.
- Via la Parallax dalla foto (:236-247): un gesto per capitolo.

### DOM e attributi
```tsx
<div id={p.id} data-paths-row className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-[6vw] lg:grid-cols-2 lg:items-center">
  <div data-paths-col className={i % 2 ? "lg:order-2 lg:justify-self-end" : ""}>
    <div className="dt-media-half"><Image … sizes={coverSizes(p.ratio)} /></div>
  </div>
  <div data-paths-col className={i % 2 ? "lg:pr-[6vw]" : "lg:pl-[6vw]"}>…</div>
</div>
```
Il verso si calcola dal lato visivo: da lg la colonna con `lg:order-2` è a destra.

### Larghezze
- **1440**: foto 605 px, spostamento ±60 px; testo ~550 px, ±55 px. Fra le righe il margine resta sopra 70 px anche nel caso peggiore: margine fermo 90 + 27 px di centratura, avvicinamento massimo ~11 px, perché la riga 2 parte con 0.35 di progresso di ritardo. Il conto va confermato dall'e2e.
- **1024-1279**: stessa meccanica; foto 430 px (±43), testo più alto (~700 px, ±70).
- **768-1023**: colonne impilate, foto sopra, testo sotto (`lg:order-2` agisce solo da lg). La percentuale farebbe toccare foto e testo: gap 6vw = 46 px, spostamento del 10% ≈ 60 px. Si passa a pixel: foto `y -A → A`, testo `y A → -A`, con `A = floor(gap/2) - 1`. Fa 22 px a 768: in partenza si allontanano, in arrivo si avvicinano di 44 px, meno del gap.
- **390**: stessa regola, gap 23 px, A = 11 px. Visibile, perché sopra la soglia dei 10 px scritta in Parallax.tsx:37-45. Nessuno scroll-hijack: è uno scrub.

### Reduced-motion, senza JS, focus
- **Reduced-motion**: nessun tween, nessuno stile inline.
- **Senza JS**: layout fermo di oggi.
- **Focus**: si trasla solo, nessuno stato nascosto. La CTA ghost (:263-267) resta sempre visibile e cliccabile. `useGSAP` con `dependencies: [locale]` e `revertOnUpdate: true`, perché l'altezza delle colonne cambia con la lingua.

### LCP, CLS, sizes
Paths sta sotto la piega, nessun LCP. Solo transform, quindi CLS 0. Nessuna scala: `coverSizes` resta com'è.

### Test
- **Nuovo e2e** in e2e/motion.spec.ts, describe con `reducedMotion: "no-preference"`: a 1440, due quote di scroll su `#vendi` (riga a 90% e a 10% del viewport). La matrice `f` delle due `[data-paths-col]` cambia di almeno 40 px, con segni opposti fra le colonne. A 390 `|f| ≤ 12`.
- **Reduced-motion** (regime del file, motion.spec.ts:6): `transform` none sulle colonne.
- **Reti esistenti**: mobile-motion.spec.ts:27-53 (rotta «/») e home.spec.ts:219-227 restano verdi.

### Perché è distinto
È l'unico capitolo in cui si muovono due COLONNE in versi opposti sull'asse verticale. Social (14) usa la controfase orizzontale. Nessun altro capitolo usa `power1.inOut` né il range `top 125% → bottom -25%`.

---

## 8. Method (compact in home, intero su /metodo): la tendina

### Stato attuale
- Sezione `#metodo` (Method.tsx:194). Testa a destra con TextLines h2 d1 (:196-203).
- Tre atti (:208-275). Foto in `lg:order-2 lg:justify-self-end` (:224), dentro `Parallax speed={-0.04}` (:225-236), su `.dt-media-half !aspect-video` (:226).
- `coverSizes` con k = max(1, ratio/16·9) (:183-187). Foto: ritratto 763/442, villa-mozart 1280/505, handshake 1920/1087 (:172-176).
- Codice condiviso: /metodo rende `<Method />` (MetodoContent.tsx:226) con gli stessi atti e i nove passi (:291-303). Il gesto vale anche lì, lo dichiaro.

### Gesto e valori (CAT §6c, ERA:2653-2669)
- **Riga pari** (atti 1 e 3): `clipPath "inset(0% 100% 0% 0%)"` → `"inset(0% 0% 0% 0%)"`, la tendina si apre da sinistra.
- **Riga dispari** (atto 2): `"inset(0% 0% 0% 100%)"` → `"inset(0% 0% 0% 0%)"`, si apre da destra.
- **Ingresso**: durata 2·durL = 2.4 s, delay durM = 0.8 s, ease `power4.out` (non `dtOut`, vedi 0.3). Nessuna scala interna.
- **Innesco**: IntersectionObserver sulla scatola, threshold 0, rootMargin 0. È l'equivalente di `"top bottom"` di Era. Niente ScrollTrigger: memoria «ScrollTrigger inaffidabile in fondo alla home».
- **Ingresso dal basso** (`isIntersecting` e `boundingClientRect.top > 0`): `tl.restart()`.
- **Uscita verso il basso** (risalendo): la tendina prosegue nel suo verso, alla maniera dell'animatore `line` (ERA:603-611). Righe pari verso `"inset(0% 0% 0% 100%)"`, righe dispari verso `"inset(0% 100% 0% 0%)"`, durS 0.4, `dtIn`. Si fa `out?.kill()` prima di ogni `restart()`, mai `overwrite: true` (condizione di timing P4).
- **Uscite o rientri dall'alto**: niente, resta aperta.
- **Stato chiuso**: si scrive al PRIMO callback dell'IO, solo se la scatola è sotto il viewport. Se è già in vista o sopra resta aperta: nessun lampo visibile → nascosto → visibile, condizione di media P4.
- **will-change: clip-path**: solo fra onStart e onComplete, ripulito nel cleanup del context.
- **Parallax**: via da :225 e :236.

### DOM e attributi
```tsx
<div className="lg:order-2 lg:justify-self-end">
  <div className="dt-media-half !aspect-video" data-method-blind={i % 2 ? "destra" : "sinistra"}>
    <Image … sizes={coverSizes(img.ratio)} />
  </div>
</div>
```

### Larghezze
- **1440**: scatola 605×340; il verso alterna e segue il lato della riga.
- **1024-1279**: scatola 430×242; identico.
- **768-1023**: foto sopra il testo, scatola 84vw (645×363 a 768); il verso resta alternato.
- **390**: scatola 351×197. Stesso gesto, a tempo: nessuno sticky.

### Reduced-motion, senza JS, focus
- **Reduced-motion**: nessun clip-path scritto.
- **Senza JS**: foto intera.
- **Focus**: il clip sta su una scatola non focalizzabile. La CTA del video (:259-271) sta nella colonna di testo e non viene ritagliata.

### LCP, CLS, sizes
- **LCP**: su /metodo è PageHero (MetodoContent.tsx:193-203); gli atti stanno dopo Highlights, sotto la piega a ogni larghezza.
- **CLS**: 0.
- **sizes**: invariati, nessuna scala.

### Test
- **motion.spec.ts:45-56** (sezioni di /metodo con reduced-motion): resta verde. Il clip non tocca l'opacità, e con reduce non viene scritto.
- **Nuovo e2e** nello stesso file, regime reduce: su /metodo `#metodo [data-method-blind]` ha `clip-path` uguale a `none`.
- **Nuovo e2e con motion ok** (1440 e 390), su «/» e su /metodo:
  - a scroll 0 il primo `[data-method-blind]` ha clip diverso da none;
  - portato a metà viewport, dopo 3.4 s vale `inset(0%)`;
  - tornati a scroll 0 e ridiscesi, si riapre.

### Perché è distinto
È l'unica apertura a tempo con verso alternato riga per riga, e l'unica a 2.4 s con attesa di 0.8 s. Il sipario del territorio va sempre da sinistra, dura 1.6 s con `dtOut` e scala 1.15. D.O.C. tira linee, non foto.

---

## 9. OpenDomus: la finestra sticky

### Stato attuale
- Sezione `#open-domus dt-chapter` (OpenDomus.tsx:158). Griglia con la facciata `LazyYouTubeEmbed` in `.dt-media-half aspect-video!` (:159-172).
- Nessuna Parallax, per scelta scritta: «bersaglio mobile» (:154-156).
- Testo con TextLines h2 (:174-187), due liste (:195-209), CTA ghost (:214-220).
- Componente condiviso da /metodo (MetodoContent.tsx:247) e /open-domus (OpenDomusPageContent.tsx:746).

### Dove vale
Solo in home, con una prop nuova: `<OpenDomus finestra />` in page.tsx:84. Su /metodo e /open-domus il componente resta senza finestra: la foto _DSC2022 va solo qui.

### Il meccanismo di Era, letto sul codice
- Due sticky (arch-dome.css:34-37, :49-56). Lo schermo delle tende (`.arch-intro-s`) sta sopra, z-index 1, alto 100vh, `margin-bottom: -100vh`. Lo stage (`.arch-w`) sta dietro, sticky anche lui.
- Il foro delle tende non mostra una foto sua: mostra lo stage, che intanto scala da .75 a 1 con origine `center top` (ERA:2763-2769).
- Timeline (ERA:2720-2769): trigger `.arch-intro-s`, `top bottom` → `200% top`, scrub true. Otturatore 0 → 0.5 (ease none); montanti 0.5 → 0.6; scala 1.84 dello schermo e .75 → 1 dello stage 0.6 → 1.0 (InOut).

### Adattamento: struttura
- Lo stage è la banda della foto (_DSC2022 a tutto schermo) seguita dal contenuto di Open Domus. Tutto lo stage scala .75 → 1: «aprire la casa».
- Le tende hanno il colore del fondo, `var(--color-cream)` #f9f5ef (globals.css:59): la finestra si apre nell'avorio della pagina dopo il Metodo.
- Trigger: il wrapper NON sticky `.dt-od_area` (CAT §12, «usare come trigger il wrapper non sticky»).
- Nessun antenato trasformato o ritagliato. Section e area non hanno transform né overflow.
- La scala 1.84 NON va sull'elemento sticky dello schermo ma su un figlio, `.dt-od_shutters`. Lo schermo, che è l'elemento sticky stesso, ha `overflow: hidden` e ritaglia le tende scalate: niente scroll orizzontale del documento. Era ritaglia invece l'antenato `section.clip`, che qui è vietato.

### DOM e attributi
```tsx
<section id="open-domus" className="dt-od bg-cream" data-od>
  <div className="dt-od_area">
    <div className="dt-od_screen" aria-hidden>
      <div className="dt-od_shutters">
        <div className="dt-od_shutter dt-od_shutter--l" />
        <div className="dt-od_shutter dt-od_shutter--r" />
      </div>
    </div>
    <div className="dt-od_stage">
      <div className="dt-od_window" data-bg="foto">
        <Image src="/images/reali/villa-facciata-piscina.jpg" alt={c.villaAlt} fill sizes={SIZES_FINESTRA}
               className="object-cover" style={{ objectPosition: "50% 38%" }} />
      </div>
      <div className="dt-od_content dt-chapter">{/* il contenuto di oggi, :159-220 */}</div>
    </div>
    <div className="dt-od_run" aria-hidden />
  </div>
</section>
```
- `data-bg="foto"` serve alla corsia del monogramma, per il cambio di tema sopra le foto. Nessuna scritta bianca sulla foto: nessun punto nuovo da dichiarare.
- `c.villaAlt` in cinque lingue, dice ciò che si vede. it: «Villa contemporanea con rivestimento in rame e piscina in primo piano». Nessuna frase su vendita o incarico.

### CSS
Dopo globals.css:436, così lo slice per indexOf di moduli-media.test.ts:57-63 non si rompe.
```css
/* Senza corridoio (sotto lg, reduced-motion, senza JS): niente tende, niente pista. */
.dt-od:not([data-on]) .dt-od_screen,
.dt-od:not([data-on]) .dt-od_run { display: none; }
.dt-od:not([data-on]) .dt-od_window {            /* sotto lg: la metà quadrata */
  position: relative; overflow: hidden; background: var(--color-cream-deep);
  margin-inline: 5vw; aspect-ratio: 1 / 1;
}
@media (min-width: 48rem) { .dt-od:not([data-on]) .dt-od_window { margin-inline: 8vw; } }
@media (min-width: 64rem) { .dt-od:not([data-on]) .dt-od_window { aspect-ratio: 16 / 9; } } /* fermo da lg: la banda */

.dt-od[data-on] .dt-od_area { position: relative; }
.dt-od[data-on] .dt-od_screen {
  position: sticky; top: 0; z-index: 1; height: 100svh; margin-bottom: -100svh;
  overflow: hidden; pointer-events: none;
}
.dt-od[data-on] .dt-od_shutters { position: absolute; inset: 0; transform-origin: 50% 50%; }
.dt-od_shutter { position: absolute; background: var(--color-cream); }
.dt-od_shutter--l { inset: -1% calc(50% - 1px) 0% 0%; }    /* arch-dome.css:58-62 */
.dt-od_shutter--r { inset: -1% 0% 0% 50%; }                /* arch-dome.css:68-72 */
.dt-od[data-on] .dt-od_stage { position: sticky; top: 0; transform-origin: 50% 0%; }
.dt-od[data-on] .dt-od_window {
  position: relative; width: 100%; height: 100svh; overflow: hidden; background: var(--color-cream-deep);
}
.dt-od[data-on] .dt-od_content { padding-top: 22svh; }     /* vedi «La soglia del contenuto» */
.dt-od[data-on] .dt-od_run { height: 200svh; }
```
- Lo stato iniziale delle tende NON sta nel CSS: senza `data-on` le tende non esistono (display none).
- Con `data-on` il JS scrive i poligoni nello stesso tick in cui mette l'attributo, dentro il callback di `useCorridor`, prima del paint. Il corridoio sta a più di dieci schermi dall'inizio della pagina.

### Timeline (≥1024, motion ok, dentro `useCorridor`)
```ts
const L0 = "polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 36.111%, 98.889% 36.111%, 98.889% 99.074%, 44.444% 99.074%, 1.111% 100%, 100% 100%, 100% 0%)";
const L1 = "polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 18.519%, 98.889% 18.519%, 98.889% 81.481%, 44.444% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)";
const L2 = "polygon(0% 0%, 0% 100%, 44.444% 100%, 44.444% 18.519%, 100% 18.519%, 100% 81.481%, 44.444% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)";
const R0 = "polygon(0% 0%, 0% 100%, 1.111% 100%, 1.111% 0.926%, 55.556% 0.926%, 55.556% 63.889%, 1.111% 63.889%, 1.111% 100%, 100% 100%, 100% 0%)";
const R1 = "polygon(0% 0%, 0% 100%, 1.111% 100%, 1.111% 18.519%, 55.556% 18.519%, 55.556% 81.481%, 1.111% 81.481%, 1.111% 100%, 100% 100%, 100% 0%)";
const R2 = "polygon(0% 0%, 0% 100%, 0% 100%, 0% 18.519%, 55.556% 18.519%, 55.556% 81.481%, 0% 81.481%, 0% 100%, 100% 100%, 100% 0%)";

gsap.timeline({ scrollTrigger: {
    trigger: area, start: "top bottom",
    end: () => "+=" + 3 * window.innerHeight,   // 300vh, come «top bottom → 200% top» su uno schermo alto 100vh
    scrub: true, invalidateOnRefresh: true,
    onLeave: () => { screen.style.visibility = "hidden"; },      // lo schermo non contiene focalizzabili
    onEnterBack: () => { screen.style.visibility = ""; },
  } })
  .fromTo(shL, { clipPath: L0 }, { clipPath: L1, ease: "none", duration: 0.5 })
  .fromTo(shR, { clipPath: R0 }, { clipPath: R1, ease: "none", duration: 0.5 }, "<")
  .to(shL, { clipPath: L2, ease: "none", duration: 0.1 })
  .to(shR, { clipPath: R2, ease: "none", duration: 0.1 }, "<")
  .to(shutters, { scale: 1.84, ease: "dtInOut", duration: 0.4 })
  // immediateRender resta TRUE di proposito: lo stage deve stare a .75 già durante
  // l'otturatore (ERA:2763). La trappola «fromTo più avanti → immediateRender false»
  // vale quando lo stato iniziale NON deve vedersi prima; qui deve.
  .fromTo(stage, { scale: 0.75 }, { scale: 1, ease: "dtInOut", duration: 0.4, immediateRender: true }, "<");
```
- Frazioni esatte dei poligoni: 36.111% = 13/36, 18.519% = 5/27, 81.481% = 22/27, 99.074% = 107/108, 0.926% = 1/108, 63.889% = 23/36, 44.444% = 4/9, 98.889% = 89/90, 1.111% = 1/90, 55.556% = 5/9.
- Nel viewport la finestra finale va da 22.22vw a 77.78vw e da 17.70vh a 81.30vh: alta 17/27 di 101vh = 63.59vh. All'inizio la metà sinistra del foro è abbassata di 19/108 di 101vh (17.8vh) e la destra alzata della stessa misura.
- 1.84 = 1.8 × 1.022: la finestra finisce a 102.2vw × 117vh.

### Scansione dello scroll a 1440×900
s = 0 quando il bordo alto dell'area tocca quello del viewport.

| s | Progresso | Stato |
|---|---|---|
| −900 px (−100vh) | 0 | l'area entra dal basso; otturatore sfalsato |
| 0 | 0.333 | schermo e stage agganciati; otturatore al 67% |
| +450 (+50vh) | 0.5 | metà sinistra e metà destra allineate; restano i montanti |
| +720 (+80vh) | 0.6 | montanti spariti (fessura 49.44 → 50.56vw chiusa) |
| +1800 (+200vh) | 1.0 | finestra 1.84, stage a 1: la foto riempie lo schermo; lo stage si sgancia, lo schermo va a `visibility: hidden` |
| +1800 → +2700 | | la banda della foto sale ed esce; arriva il contenuto |

### La soglia del contenuto
Perché 22svh di padding sopra il contenuto dello stage, invece dei 14vh di `.dt-chapter` (globals.css:444):
- A scala .75 con origine in alto la banda della foto copre da 0 a 75vh.
- Durante l'otturatore la metà sinistra del foro scende fino a 99vh. Diventa visibile nel viewport da s = −25vh, quando il bordo basso del foro vale 90.2vh.
- Fra 75vh e 90.2vh si vede quindi lo stage sotto la foto: se lì ci fosse l'eyebrow, comparirebbe mezza scritta nell'angolo della finestra.
- Serve un vuoto di (90.2 − 75)/0.75 = 20.3vh: arrotondo a 22svh.
- Nella striscia fra il fondo della foto e il fondo del foro si vede avorio su avorio, quindi il bordo del foro non si legge. Durante la scala resta così: fondo della foto 75 + 25u, fondo del foro 81.3 + 26.3u, con u l'ease della scala.

Bordi laterali alla fine della scala: con la stessa ease la mezza larghezza della foto vale 37.5 + 12.5u vw, quella del foro 27.78 + 23.33u vw. Il foro la supera solo per u > 0.9: una lista d'avorio di al massimo 0.6vw (8 px) vicino al bordo dello schermo, per pochi fotogrammi, poi esce dallo schermo. Accettata. La correzione vorrebbe una banda più larga dello stage, cioè ritagliare un antenato, e lo escludo.

### Focus
- **Schermo**: `aria-hidden`, nessun focalizzabile, `pointer-events: none`.
- **Rete `focusin`** sullo stage (solo con `data-on`), sullo schema di HorizonScroller.tsx:471-477: se il focus entra in `.dt-od_content` mentre il progresso è sotto 1, o se l'elemento è fuori dal viewport, `getLenis()?.scrollTo(y, { immediate: true })` (SmoothScroll.tsx:24).
- **Calcolo di y**: `st.start + 4·innerHeight + offsetNelContenuto − 0.25·innerHeight`. `st.start` = area − 100vh; lo stage si sgancia ad area + 200vh; il contenuto parte 100vh più giù.
- **Perché serve**: con lo stage agganciato il `scrollIntoView` nativo non basta, perché lo stage non si sposta finché resta sticky.
- **La facciata YouTube** si attiva solo al click (LazyYouTubeEmbed.tsx:73-77). Mai sotto il puntatore durante la scala: a progresso < 1 il contenuto sta sotto la piega.

### Sotto 1024 (motion ok): l'otturatore a tempo
- **Foto**: in testa al capitolo, nella metà quadrata (CSS sopra).
- **Clip**: un solo `clip-path` a due rettangoli sfalsati, cuciti da un segmento percorso due volte (area nulla). Le misure sono le frazioni di Era riportate al foro:
  - scarto 19/68 = 27.941%;
  - fessura fra 49% e 51% (27.22vw su 55.56vw = 0.49).
```ts
const M0 = "polygon(0% 27.941%, 49% 27.941%, 49% 127.941%, 0% 127.941%, 0% 27.941%, 51% -27.941%, 100% -27.941%, 100% 72.059%, 51% 72.059%, 51% -27.941%)";
const M1 = "polygon(0% 0%, 49% 0%, 49% 100%, 0% 100%, 0% 0%, 51% 0%, 100% 0%, 100% 100%, 51% 100%, 51% 0%)";
const M2 = "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%, 0% 0%, 50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 0%)";
// tl in pausa: M0→M1 1.0 s dtInOut, poi M1→M2 0.2 s none
```
- **Innesco**: IO con threshold 0.35. Entrando dal basso `restart()`; uscendo verso il basso `reverse()` con `timeScale(2)` (0.6 s). Stato chiuso scritto al primo callback solo se la scatola è sotto il viewport.
- **Contenuto**: nessuno scale, solo SplitReveal e Reveal. Lo `.75 → 1` sotto 1024 ripeterebbe il gesto di HomeSearchGateway.
- **1024-1279**: corridoio pieno. A 1024×768 il foro è 569×488 e lo stage chiede 1152 px (sizes).
- **768-1023**: quadrato 84vw. **390**: quadrato 90vw (351 px).

### Reduced-motion e senza JS
- Nessun `data-on`: niente tende, niente pista, nessuno stile inline.
- Da lg la foto è una banda 16:9 larga 84vw in testa al capitolo; sotto lg è il quadrato. Il contenuto è quello di oggi.
- Senza JS è lo stesso, perché `data-on` arriva solo dal JS.

### Pixel, sizes e file (_DSC2022, 5977×3985, 3:2)

Tre modi di mettere la foto dietro le tende, con la larghezza resa nel momento peggiore:

| Variante | 1440×900 | 1920×1080 | Verdetto |
|---|---|---|---|
| F: foto a tutto schermo DENTRO lo schermo scalato 1.84 | 1440×1.84 = **2650 px** (184vw) | 1920×1.84 = **3533 px** (184vw): oltre la variante massima 2560 (next.config.ts:149), ingrandimento 1.38× a DPR 1 | no: fuori da «~1,05×» (DESIGN.md:397) |
| H: foto nel rettangolo finale del foro, scalata 1.84 | foro 800×572, cover per altezza 858 px × 1.84 = **1580 px** (110vw) | foro 1067×687, cover per larghezza × 1.84 = **1963 px** (102vw) | regge, ma non è Era |
| **S: foto sullo stage (Era letterale), scala massima 1** | box 1440×900, cover per larghezza = **1440 px** | **1920 px** | **scelta**: nessun pixel oltre lo schermo |

Con S la scala 1.84 la subiscono solo le tende, e lo stage a .75 chiede meno pixel. La banda dello stage è 100vw × 100svh: la resa è 100vw quando il viewport è largo almeno 3:2, altrimenti 150vh.
```ts
const SIZES_FINESTRA =
  "(prefers-reduced-motion: reduce) and (min-width: 1024px) 84vw, " + // fermo: banda 16:9 nella riga
  "(min-width: 1024px) and (min-aspect-ratio: 3/2) 100vw, " +
  "(min-width: 1024px) and (min-aspect-ratio: 1/1) 150vw, " +         // resa 1.5vh: 4:3 → 113vw, 1:1 → 150vw (tetto del ramo)
  "(min-width: 1024px) 200vw, " +                                     // iPad Pro verticale 1024×1366 → 200vw
  "(max-width: 767.98px) 135vw, 126vw";                               // quadrato: 90vw×1,5 e 84vw×1,5
```
- **16:10 (1440×900)**: 1.6 supera 3:2, quindi vale il ramo 100vw. 1440 px, variante 1536 a DPR 1. A DPR 2 la variante 2560 contro 2880 chiesti: 1.12×.
- **1920×1080**: variante 1920 a DPR 1, 2560 a DPR 2 (1.5×, come ogni banda 100vw del sito oggi).
- **Media query nei sizes**: `prefers-reduced-motion` e `aspect-ratio` dentro `sizes` sono media condition valide. Verificare nel pannello Network la variante scelta a 1440, 1920, 1024×768 e con reduce.
- **File**: `public/images/reali/villa-facciata-piscina.jpg`, lato lungo **2560 px** (2560×1707), JPEG mozjpeg q82. È la variante massima che il loader può servire (`deviceSizes` fino a 2560, next.config.ts:149): i 5977 px del sorgente costerebbero solo peso nel repo e CPU dell'ottimizzatore. Nome neutro, senza l'indirizzo (media-nuovi.md:35).
- **Taglio**: `objectPosition "50% 38%"`. A 1920 la banda perde 251 px d'altezza: si tiene la linea del tetto e si toglie acqua. Nel quadrato il centro orizzontale tiene il blocco centrale simmetrico.
- **Caricamento**: lazy (default di next/image), niente `preload`: la foto sta a più di dieci schermi dall'inizio. Finché non arriva, dal foro si vede `cream-deep`, appena più scuro delle tende: il foro resta leggibile.
- **CLS**: lo sticky e le altezze li decide il CSS dopo `data-on`, e il corridoio è sotto la piega. Un ricaricamento con lo scroll ripristinato più in basso sposterebbe però la pagina: `useCorridor` deve mettere `data-on` prima del ripristino dello scroll oppure compensare. Vale per tutti e sei i corridoi: la segnalo alla corsia sistema.

### Altezza aggiunta alla home
| Pezzo | 1440×900 |
|---|---|
| pista `.dt-od_run` 200svh (stage agganciato mentre la timeline va da 0.333 a 1) | 1800 px |
| banda della foto 100svh | 900 px |
| padding del contenuto 22svh invece di 14vh | 72 px |
| **Totale** | **2772 px ≈ 3,1 schermi** |

- Sotto 1024 la finestra aggiunge solo il quadrato: 351 px + margine a 390, 645 px a 768.
- Il primo 100vh della timeline (s −100 → 0) scorre mentre il Metodo esce, e non allunga la pagina.
- **Variante compressa**, solo se Alberto la chiede: pista 100svh e `end` a +200vh. Otturatore s −100 → 0, montanti 0 → +20, scala +20 → +100. Aggiunge 1872 px ≈ 2,1 schermi.
- **Da dire ad Alberto**: la memoria stima «3-4 schermi» per i tre corridoi nuovi (domus-coreografia-era.md:14). Con la fedeltà letterale la sola finestra ne aggiunge 3,1.

### Test
- **home.spec.ts, nuovo** «la finestra di Open Domus si apre e porta la casa a tutto schermo» (desktop ≥1024, motion ok):
  - `.dt-od` ha `data-on`;
  - a s = 0 il `clip-path` di `.dt-od_shutter--l` contiene un'ordinata fra 18.519 e 36.111 (atteso ≈ 24.4);
  - a s = +200vh la matrice di `.dt-od_shutters` ha `a` = 1.84 ± 0.01, quella di `.dt-od_stage` ha `a` = 1 ± 0.005, e `.dt-od_screen` è `visibility: hidden`;
  - traboccamento ≤ 1 px, come home.spec.ts:152-155.
- **motion.spec.ts (reduce)**, sullo schema di :58-98: `data-on` nullo, `.dt-od_screen` e `.dt-od_run` a `display: none`, la foto visibile.
- **Nuovo e2e a 390** con motion ok: nessun `data-on`; dopo lo scroll e 1.3 s il `clip-path` della finestra vale M2.
- **tastiera.spec.ts, nuovo**: dal link «Vedi i nove passi» (Method.tsx:286) un Tab va alla facciata di Open Domus; il bottone ha `getBoundingClientRect()` dentro il viewport.
- **a11y**: una passata axe su «/» con `reducedMotion: "no-preference"`, perché a11y.spec.ts:11 gira solo con reduce (critic.md punto 26).
- **Guardia sul numero di corridoi**: un test unitario che conta in globals.css le regole `[data-on]` con `position: sticky` e ne pretende sei (critic.md punto 25: oggi nessun test fissa il conto).
- **Reti esistenti**: mobile-motion.spec.ts:27-53 e home.spec.ts:219-227 restano verdi.

### Perché è distinto
È l'unico otturatore, l'unica scala 1.84 e l'unico corridoio che scala due livelli in versi opposti. Il tuffo dell'hero scala una foto da 1 a 2 con origine 50% 75% ed ease In. HomeSearchGateway usa .75 → 1 con opacità, origine al centro, ease none e scrub 0.5.

---

## 10. Domus D.O.C.: le righe che si tirano

### Stato attuale
- Sezione `dt-chapter` (DomusDocProtocol.tsx:237).
- Sigillo SVG con un `<circle r=46>` (:241-250). Testa con TextLines h2 (:256).
- Lista dei cinque pilastri `ul grid md:grid-cols-2 gap-x-[4vw] gap-y-6` (:271), ogni `li` con il trattino rosso `h-px w-6` (:273-274). Nota (:294-296), CTA (:297-301).
- Il commento dice «niente timeline GSAP — solo Reveal e TextLines» (:234-235): va aggiornato.
- Componente condiviso: home (page.tsx:85), /vendi (VendiContent.tsx:961), /metodo (MetodoContent.tsx:246), /acquista (AcquistaContent.tsx:622). Il gesto vale in tutte e quattro: lo dichiaro. Su /metodo convive con la tendina di Method, con valori diversi (0.3).

### Gesto e valori (animatore `line`, ERA:588-618, CAT §C5)
- **Il documento viene rigato.** Una hairline sopra ogni pilastro e una spina verticale fra le due colonne.
- **Spina**, Era letterale (una linea verticale, come il divisore alto 13vw di Era): `clipPath "inset(0% 0% 100% 0%)"` → `"inset(0% 0% 0% 0%)"`. Durata 1.2 + 0.1×4 = 1.6 s, così finisce con l'ultima riga. Ease `dtWrite`, delay 0.3.
- **Righe orizzontali**: il clip verticale di Era su una linea alta 1 px non si vede. La riga si tira da sinistra: `"inset(0% 100% 0% 0%)"` → `"inset(0% 0% 0% 0%)"`. Durata durL 1.2 s, ease `dtWrite` (quasi lineare, la velocità di una penna), stagger 0.1 nell'ordine del DOM, delay delayReveal 0.3.
- **Innesco**: IO sulla `ul`, threshold 0, `rootMargin "0px 0px -20% 0px"` (≈ `top 80%`). Entrando dal basso si parte.
- **Uscita verso il basso**: righe verso `"inset(0% 0% 0% 100%)"` (proseguono), spina verso `"inset(100% 0% 0% 0%)"`. 0.5 s, `power3.in`, stagger 0.05 dall'ultima.
- **Stato chiuso**: scritto al primo callback dell'IO, solo se la lista è sotto.

### DOM e attributi
```tsx
<ul data-doc-sheet className="relative mt-12 grid gap-x-[4vw] gap-y-6 text-body text-graphite md:grid-cols-2">
  <span aria-hidden data-doc-spine className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-line md:block" />
  {c.pillars.map((p) => (
    <li key={p.t} className="relative flex gap-3 pt-6">
      <span aria-hidden data-doc-rule className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" />
      …
```
- **Colore**: `--color-line` #e4dccf (globals.css:58), la stessa hairline della testata (Header.tsx:204 `border-line`).
- **Nessun ornamento**: sono righe di struttura, presenti anche a riposo (C12 riguarda fiori e ornamenti disegnati). Resta una decisione di lavoro (D) da registrare: la lista guadagna le righe anche ferma.
- **La translate CSS della spina** non interferisce: GSAP anima solo `clipPath`.

### Larghezze
- **1440** e **1024-1279**: due colonne, spina al centro del gap di 4vw, cinque righe (tre a sinistra, due a destra).
- **768-1023**: md fa due colonne; spina visibile.
- **390**: una colonna, niente spina (`hidden md:block`); cinque righe piene in cascata.

### Reduced-motion, senza JS, focus
- **Reduced-motion e senza JS**: righe e spina disegnate e ferme.
- **Focus**: nessun elemento animato è focalizzabile; testi e CTA non cambiano.

### LCP, CLS, sizes
- Nessun media.
- `pt-6` è nel markup SSR: cambio di layout statico, non un'animazione. CLS 0.

### Test
- **Nuovo e2e con motion ok a 1440** su «/»: a scroll 0 il primo `[data-doc-rule]` ha `clip-path` che comincia con `inset(0% 100%`; con `#domus-doc ul` a metà viewport, dopo 2 s vale `inset(0%)`.
- **Reduce** (motion.spec.ts): `clip-path` none; `[data-doc-rule]` alto 1 px con `background-color` rgb(228, 220, 207).
- **Esistenti**: domusDoc.test.ts e i test del copy restano verdi (il testo non cambia).

### Perché è distinto
È l'unico capitolo che anima le linee di struttura, e non media o testo, ed è l'unico con `dtWrite`. La tendina di Method apre fotografie, a 2.4 s con attesa.

### Segnalazione fuori corsia
Il sigillo è un cerchio (DomusDocProtocol.tsx:245-246), mentre LazyYouTubeEmbed.tsx:86-87 dichiara il play «l'unica curva ammessa». Non lo tocco, ma va confrontato con C01.

---

## 11. Services: lo zoom d'ingresso

### Stato attuale
- Sezione `#servizi` (Services.tsx:262), testa con TextLines h2 (:268).
- Tre righe (:273-336) con la foto in `Parallax speed={-0.04} scale={1.03}` direttamente su `.dt-media-half` (:285-298).
- `SHOT_SIZES "(max-width: 1024px) 180vw, 75vw"` (:247). Foto (:237-241):
  - home_staging_01 **1024×683**;
  - villa-tramonto 1600×900 (un'altra villa, drone di sera);
  - rendering_01 1920×1080 (un render).
- Componente condiviso con /servizi (ServiziContent.tsx:236): il gesto e le foto valgono anche lì.

### Gesto e valori (CAT §7, ERA:2671-2685)
- `fromTo` (non `from`) sull'interno `[data-zoom]`: `scale 1.15 → 1`, `transformOrigin "50% 100%"`, ease `dtEase` (0.25,0.1,0.25,1). Trigger la scatola `.dt-media-half`, start `top bottom`, end `bottom bottom`, scrub 0.25.
- Si ingrandisce entrando e si posa a 1 quando la scatola è tutta in vista. Risalendo si riavvolge.
- **La parallasse del genitore** (`img`, yPercent −15 → 15, scrub 0.5, ERA:822-838) **non la porto**, per tre ragioni:
  - è la primitiva `img` che Era usa in tre capitoli, non il gesto del §7;
  - `ease none` più scrub 0.5 è il registro che A20 lascerebbe a un altro capitolo;
  - senza scoprire i bordi servirebbe un interno alto 130%: la resa sale da 1.73× a 2.24× la scatola, e home_staging_01 (1024 px) verrebbe ingrandita 1.3× a 1440.
- **Variante B**, se Alberto la vuole comunque: interno `inset: -8% 0`, yPercent −6.9 → 6.9 (= 8/116), scrub 0.5, ease none, e sizes × 1.16.
- Via la Parallax (:285-298). La scatola torna un `div.dt-media-half` con dentro `div.absolute.inset-0[data-zoom]`: la transform sta sul wrapper e non sull'`img` di next/image.

### sizes (resa = scatola × rapporto × 1.15, all'inizio dello zoom)
```ts
const zoomSizes = (ratio: number, z = 1.15) => {
  const k = Math.max(1, ratio) * z; // scatola quadrata: una sorgente larga è resa larga scatola × rapporto
  return `(max-width:767px) ${Math.ceil(90 * k)}vw, (max-width:1023px) ${Math.ceil(84 * k)}vw, (min-width:1524px) ${Math.ceil(640 * k)}px, ${Math.ceil(42 * k)}vw`;
};
// 3:2  → 156vw, 145vw, 1104px, 73vw
// 16:9 → 185vw, 172vw, 1309px, 86vw
```
Il ramo 1524 px viene dal tetto di 640 px del modulo (globals.css:433-434). Per ogni foto va passato il rapporto vero, come fa `coverSizes` in Paths.tsx:48.

**Pixel a 1440, DPR 1:**
- home_staging_01: all'inizio dello zoom 605 × 1.5 × 1.15 = 1044 px chiesti, su 1024 disponibili: 1.02×, dentro «~1,05×». A riposo 908 px.
- villa-tramonto: 1238 px su 1600.
- rendering_01: 1238 px su 1920.

A DPR 2 le prime due vengono ingrandite: oggi succede già con 75vw.

### Larghezze
- **1440** e **1024-1279**: scatola 42vw, righe alternate.
- **768-1023**: scatola 84vw, impilate.
- **390**: scatola 90vw (351 px). Stessi valori: è uno scrub, non uno sticky.

### Le foto della villa nelle righe? Verdetto: no in home, con un'eccezione da proporre
Le cinque foto sono esterni: facciata, piscina, lettini, portico.
- **Riga 1** (01 tecnico-legali, 02 home staging): una foto d'esterno non documenta un allestimento. Metterla sotto «Home staging» fabbricherebbe una prova.
  - Fatto nuovo: home_staging_01 è la stessa sala della villa di Tradate. Il tour la mostra identica fra 81 e 87 s: tavolo, sedie gialle, lampada ad arco, libreria (docs/superpowers/specs/2026-09-13-coreografia-era-residence/design/frames-interni.jpg, fotogrammi 84.6 e 86.2 s senza persone).
  - Proposta: sostituire il file da 1024 px con il fotogramma a 84.6 s del 4K, ritagliato `crop=iw*0.90:ih*0.90:iw*0.10:ih*0.10` (3456×1944, 16:9). Stessa stanza, 3,4 volte i pixel.
  - Da controllare a piena risoluzione il mosso del gimbal.
  - Resta un dubbio da girare ad Alberto: l'alt di oggi dice «Salone valorizzato dall'home staging» (Services.tsx:40), e né il file né il tour provano che l'allestimento sia opera di Domus Tua.
- **Riga 2** (03 video, 04 contenuti e campagne): le foto verrebbero dallo stesso servizio del tour prodotto da Domus Tua (media-nuovi.md:28), quindi reggerebbero il racconto. Ma la riga ha già uno scatto vero (villa-tramonto). E la villa di Tradate in home compare già cinque volte: hero-aerial in HorizonStory, la sala in Services, la finestra di Open Domus, l'acqua in CostiChiari, il drone del Congedo. Una sesta farebbe della home la scheda di un solo immobile.
- **Riga 3** (05 Open Domus, 06 rendering): il render illustra il servizio stesso. Una foto vera al suo posto sarebbe falsa rispetto al titolo «Rendering».

Le foto _DSC2014, _DSC2016, _DSC2024 e _DSC2025 restano libere per le PageHero delle pagine interne (corsia pagine).

### Reduced-motion, senza JS, focus
- **Reduced-motion e senza JS**: scala 1, nessuno stile inline.
- **Focus**: la scatola non contiene focalizzabili.

### LCP, CLS
- **LCP**: nessuno in home. Su /servizi l'LCP è PageHero (ServiziContent.tsx:224-233).
- **CLS**: 0.
- **Salto al primo frame**: se la pagina si ricarica con la scatola a metà del range, lo scrub porta subito la scala al valore corrente (per esempio da 1 a 1.07). Non è uno stato nascosto.

### Test
- **Nuovo e2e con motion ok a 1440** su «/»: con la prima scatola di `#servizi` a top = 95% del viewport, la matrice di `[data-zoom]` ha `a > 1.1`; con il bordo basso sul fondo del viewport, `a` = 1 ± 0.01. A 390 lo stesso con `a > 1.08`.
- **Reduce**: `transform` none.
- **Esistente**: il test della parallasse di motion.spec.ts:115-173 legge PageHero di /vendi e non cambia.

### Perché è distinto
È l'unica scala che SCENDE, ancorata al bordo basso, pilotata dall'ingresso della scatola e posata prima che la scatola lasci lo schermo. Il tuffo dell'hero sale da 1 a 2; la finestra scala le tende al centro.

---

## 12. CostiChiari: l'acqua che sale

### Stato attuale
- «Riga-dichiarazione», non capitolo: `py-[clamp(1rem,3vh,2rem)]` (CostiChiari.tsx:117, motivo scritto a :23-29).
- Griglia `lg:grid-cols-2 lg:items-end` (:118): TextLines h2 (:123), lead e CTA in Reveal (:136-143).
- Chiamata anche da /vendi (VendiContent.tsx:926).
- Il lead cita «fotografie professionali, video» (:55): il loop è un pezzo di quel video.

### Dove vale
Prop nuova `acqua`, solo in home: `<CostiChiari acqua />` in page.tsx:87. Su /vendi resta la riga di oggi.

### Asset: misurato oggi sul sorgente
- **Sorgente**: `C:\Users\alber\Downloads\Tradate Via Cima rossa.mov`, tratto 35.60-40.16 s (4.56 s, dentro il taglio 35.56-40.2 di media-nuovi.md:39-40).
- **Ricetta** del loop con dissolvenza di cucitura di 0.6 s: gli ultimi 0.6 s si fondono nei primi, quindi l'ultimo fotogramma arriva al primo senza salto.
```sh
ffmpeg -ss 35.60 -t 4.56 -i "Tradate Via Cima rossa.mov" -an -filter_complex \
 "[0:v]crop=iw*0.90:ih*0.90:iw*0.10:ih*0.10,scale=1920:1080:flags=lanczos,fps=25,format=yuv420p,split=3[a][b][c];\
  [a]trim=0.6:3.96,setpts=PTS-STARTPTS[mid];[b]trim=3.96:4.56,setpts=PTS-STARTPTS[tail];[c]trim=0:0.6,setpts=PTS-STARTPTS[head];\
  [tail][head]xfade=transition=fade:duration=0.6:offset=0[x];[mid][x]concat=n=2:v=1:a=0[out]" \
 -map "[out]" -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart acqua-piscina.mp4
ffmpeg -i acqua-piscina.mp4 -c:v libvpx-vp9 -crf 34 -b:v 0 -deadline good -cpu-used 2 -row-mt 1 -an acqua-piscina.webm
ffmpeg -i acqua-piscina.mp4 -frames:v 1 -q:v 3 acqua-piscina.jpg
```
- **Pesi misurati** (docs/superpowers/specs/2026-09-13-coreografia-era-residence/design/acqua/):

| File | Durata | Peso |
|---|---|---|
| mp4 H.264 CRF 24 slow | 3.96 s, 99 fotogrammi, 1920×1080 | **3.83 MB** (7.7 Mbps: le increspature comprimono male) |
| mp4 CRF 27 (ricodificato dal CRF 24, quindi stima ottimista sulla qualità) | 3.96 s | **2.11 MB** |
| WebM VP9 CRF 34 | 3.96 s | **2.25 MB** |
| mp4 1280×720 CRF 24 | 3.96 s | 1.60 MB |
| poster JPEG q3, 1920×1080 | | 168 KB |

- **Raccomandazione**: mp4 a CRF 26-27 fatto dal sorgente, obiettivo ≤ 2.5 MB, più WebM CRF 34 (2.25 MB) prima nella lista delle sorgenti. Nessuna variante 720: dove il video parte (≥768) la banda è larga 645-1612 px e a DPR 2 chiede il 1080p. Il `media` su `<source>` lo ignorano i browser vecchi (condizione di media P2).
- **Controllo a vista**: fotogrammi 0, 50 e 98 in acqua-sheet.jpg. Nessun logo, nessuna persona; l'ombra di una palma in basso a sinistra.
- **File nel sito**: `public/media/acqua-piscina.webm`, `public/media/acqua-piscina.mp4`, `public/media/acqua-piscina.jpg` (poster servito da next/image). Nomi neutri. Muto (`-an`), faststart, nessuna traccia dati.
- **Dopo la sostituzione**: kill del server e `rm -rf .next` (memoria domus-wow-layer, Turbopack).

### Gesto e valori (CAT C3 per il video, animatore di clip dal basso)
- **DOM**: dopo la griglia, `div.dt-row.mt-[clamp(2.5rem,7vh,5rem)]` con la banda `.dt-media-full` (16:9, larga quanto la riga).
- **Clip sulla banda**, che contiene poster e video: `clipPath "inset(100% 0% 0% 0%)"` → `"inset(0% 0% 0% 0%)"`, ease `power2.out`, scrub 1 (un secondo di inerzia, «acqua»). Trigger la banda, start `top 75%`, end `bottom 85%`.
- **Range, conto a 1440×900**: banda 1210×680. La corsa è di 590 px. Il bordo che sale vale `1355 − 1270·p`: entra dal fondo dello schermo a p = 0.36 e arriva al bordo alto della banda (85 px) a p = 1. L'acqua si vede salire per i due terzi della corsa. Con un range più corto il bordo resterebbe sotto la piega per metà gesto.
- **Video**:
  - `useAmbientVideo(videoRef, bandRef, { rootMargin: "0px", minWidth: MQ.desktop })`, cioè Era `top bottom → bottom top` (ERA:389-396): play in vista, pausa fuori, ripresa dal punto;
  - `<video muted loop playsInline preload="none" aria-hidden disablePictureInPicture disableRemotePlayback>` con WebM poi mp4, nessun `autoPlay`;
  - sotto il video, `<Image src="/media/acqua-piscina.jpg" alt="" fill sizes="(max-width: 767px) 90vw, 84vw" quality={75}>`, come Congedo.tsx:99-124.
- **`data-bg="foto"`** sulla banda per il monogramma. Nessuna scritta sopra.

### Larghezze
- **1440**: banda 1210×680, il video parte.
- **1024-1279**: banda 860-1075 px, il video parte.
- **768-1023**: banda 645-859 px, il video parte (soglia 768 di DESIGN.md:401).
- **390**: banda 351×197; resta il poster, nessuna richiesta del video. Il clip dal basso sul poster resta, con gli stessi valori: è uno scrub corto su una banda bassa e non tocca il dito.

### Reduced-motion, senza JS, focus
- **Reduced-motion**: poster fermo, nessun clip, 0 byte di video (`preload="none"`, nessun play).
- **Senza JS**: poster visibile, il video non si carica mai.
- **Focus**: la banda non contiene focalizzabili; la CTA sopra resta com'è.

### LCP, CLS
- **LCP**: la banda sta sotto la piega.
- **CLS**: 0, perché la banda ha `aspect-ratio` nel markup SSR.
- **Pagina più lunga**: la sezione cresce di 680 px + margine a 1440 e di 197 px + margine a 390. Il commento di :23-29 va riscritto: resta una riga, seguita da una banda.

### Test
- **home.spec.ts, nuovo** (desktop-1440, motion ok): scroll alla banda di `#costi`, `video.paused === false`; ritorno in cima, `paused === true`; ritorno alla banda, `currentTime` maggiore o uguale al valore letto prima della pausa, letto subito dopo la ripresa.
- **Nuovo e2e a 390 e con reduce a 1440**: nessuna richiesta che finisca in `acqua-piscina.mp4` o `.webm` (`page.on("request")`), e `clip-path` none con reduce.
- **Rete**: e2e/helpers.ts:95 ignora già `net::ERR_ABORTED` delle richieste range annullate alla pausa (idea-media.md:112).

### Perché è distinto
È l'unico capitolo con un video che parte e si ferma da solo, e l'unica apertura dal basso con scrub a inerzia (1) e `power2.out`. Il Congedo (17) usa il drone e una cornice `inset(8% 22%)`.

---

## 13. Media in home dopo questa corsia

| Capitolo | Foto o clip | Note |
|---|---|---|
| 1 Hero | hero-raffaela.jpg | corsia hero |
| 2 Posizionamento | consulenza.jpg (Posizionamento.tsx:86) | |
| 4 HorizonStory | hero-aerial.jpg (HorizonStory.tsx:309), drone della villa di Tradate | |
| 5 StarReviews | premio-team.jpg (StarReviews.tsx:86) | |
| 7 Paths | raffaela-specchio-profilo.jpg, villa-pool.jpg (altra villa) | invariate |
| 8 Method | raffaela-ritratto.jpg, video-villa-mozart.jpg, handshake.jpg | invariate |
| 9 OpenDomus | **villa-facciata-piscina.jpg** (_DSC2022, nuova) + poster open-domus-teresa.jpg | una volta sola |
| 11 Services | home_staging_01 (sala di Tradate), villa-tramonto.jpg, rendering_01 | proposta: fotogramma 4K al posto della sala a 1024 px |
| 12 CostiChiari | **acqua-piscina** (loop 35.6-40.2 s, nuovo) | una clip in un posto solo |
| 13 FeaturedTestimonial | recensione-clienti.jpg (FeaturedTestimonial.tsx:100) | |
| 15 Team | raffaela-founder.jpg (Team.tsx:162) | |
| 16 Contact | raffaela-keys.jpg (Contact.tsx:764) | |
| 17 Congedo | loop del drone 0-9.1 s (corsia congedo), poster piscina-lusso.jpg | |

- Nessuna foto ripetuta.
- La villa di Tradate compare cinque volte: aereo, sala, facciata, acqua, drone. Le altre quattro foto nuove restano fuori dalla home.
- Autorizzazione del proprietario e diritti sono una domanda aperta (docs/da-chiedere-alla-cliente.md §2.2 e §6.2, media-nuovi.md:31-32). Vale anche per la finestra e per l'acqua.

---

## 14. Segnalazioni per chi compone le corsie

1. **Unicità delle ease.** La tabella 0.3 prende `power1.inOut`, `power4.out`, `dtInOut`, `dtWrite`, `dtEase`, `power2.out`, e `none` solo dentro la timeline della finestra. La tabella generale dei 17 capitoli deve verificare che nessun'altra corsia usi le stesse.
2. **Contratto di `useCorridor`**: refresh dopo `data-on`, e `data-on` prima del ripristino dello scroll oppure compensazione (sezione 9, CLS).
3. **Altezza.** Solo la finestra aggiunge 2772 px a 1440×900. La stima «3-4 schermi» della memoria non regge con i sei corridoi letterali.
4. **Sigillo D.O.C. circolare** (DomusDocProtocol.tsx:245-246) da confrontare con C01.
5. **Alt «home staging»** (Services.tsx:40) su una sala che il tour mostra arredata allo stesso modo: da verificare prima di scriverla ancora.
6. **/case/[slug]**: nessuno dei sei componenti è importato sotto app/case (grep dei nomi su app/). Guardia proposta: un test unitario che legge PropertyDetail.tsx, PropertyGallery.tsx e app/case/[slug]/page.tsx e fallisce se importano `useCorridor`, `SplitReveal`, `useAmbientVideo` o se contengono `data-on`, `data-method-blind`, `data-doc-rule`, `data-zoom`.
7. **Componenti condivisi**:
   - Method e D.O.C. portano il gesto su /metodo (e D.O.C. anche su /vendi e /acquista);
   - Services porta zoom e foto su /servizi;
   - OpenDomus e CostiChiari portano il gesto solo in home, con le prop `finestra` e `acqua`.

## 15. Documenti da aggiornare quando il codice c'è
- **Spec §11**: le righe D di questa corsia, con la data:
  - righe e spina del D.O.C.;
  - Parallax tolta da Paths, Method e Services;
  - drift del §7 non portato;
  - finestra con la foto sullo stage;
  - loop dell'acqua in home.
- **DESIGN.md**:
  - :573 e :587, sei corridoi;
  - :559-560, voce «Video d'ambiente» (acqua e congedo);
  - :508-509, la deriva di parallasse non tocca più Paths, Method e Services.
- **PRODUCT.md:132-137**, sulla stessa lista chiusa.
- **Contratto di page.tsx:63-73**: «tre nastri … nessun'altra sezione pinnata» diventa la lista dei sei.
- **Commenti del codice**: Paths.tsx:8-9, Method.tsx:3-7, OpenDomus.tsx:154-156, DomusDocProtocol.tsx:234-235, CostiChiari.tsx:23-29, Services.tsx:285 (con il conto dei `sizes`).
