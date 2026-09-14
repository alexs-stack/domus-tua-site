# Corsia «Home C»: capitoli 13-17, footer e catena dei media

Data: 2026-09-13. Branch `claude/rivista-bianca`. Decisioni di riferimento: A18 «coreografia piena», A19 «sticky dove serve», A20 «fedeltà letterale» (tutte di Alberto, da girare alla cliente come domanda perché superano C03 e il Don't di DESIGN.md:587). Nessuna di queste scelte va attribuita alla cliente.

Tutti i numeri marcati «misurato» vengono da comandi eseguiti oggi sul master 4K e sui file del repo (sezione 7.1). Quelli marcati «stima» vanno verificati col comando indicato accanto.

---

## 0. Presupposti sulla corsia «sistema»

Questa corsia usa primitive che la corsia «sistema» deve fornire. Se i nomi cambiano, cambia solo l'aggancio.

1. **Attributo dei corridoi prima del paint.** Lo script di boot (layout.tsx, lo stesso che scrive `data-preloader`) scrive `html[data-corridoi]` quando `matchMedia("(prefers-reduced-motion: no-preference) and (min-width: 1024px)")` è vero, e un listener lo aggiorna al cambio. Le altezze dei corridoi stanno in CSS sotto quell'attributo, così il primo layout è già quello finale: CLS 0 anche atterrando con `#contatti` nell'URL. Senza JS l'attributo non esiste e non esiste nessun corridoio. Toccando il boot script va riletto `intro-clocks.test.ts` (regex sul boot, critic.md punto 27).
2. **Registro dei gesti** (`app/lib/motion/coreografia.ts`, nome indicativo): ogni capitolo dichiara `{ ease, scrub | dur, start, end }`. Un test unitario (`coreografia-unica.test.ts`) fallisce se due capitoli condividono ease, scrub/durata o coppia start/end (A20). Le righe di questa corsia sono nella tabella 1.
3. **Refresh su altezze che cambiano.** Un `ResizeObserver` su `document.body` (debounce 120 ms) e `document.fonts.ready` chiamano `ScrollTrigger.refresh()`. Serve qui per tre motivi misurabili: la conferma del modulo cambia l'altezza (Contact.tsx:561-564 avvisa già Lenis ma non ScrollTrigger), le tab d'intento cambiano i campi, e gli split dei titoli dopo `fonts.ready` cambiano le righe.
4. **Titoli per lettera** (A20): li fa la corsia sistema su tutti i TextLines. Da lei questa corsia chiede solo un callback `onLines(lines: HTMLElement[]) => cleanup` chiamato a ogni (ri)split, con il contenitore di riga più esterno (la maschera, se c'è). Serve a Social (scheda 14).
5. **Marcatori per il cambio di tema del monogramma**: la corsia sistema legge i rettangoli di `[data-bg="foto"]` (`getBoundingClientRect`, quindi transform compresi). Qui si dichiarano i marcatori, non il rilevatore.
6. **Hook `useAmbientVideo`** (sezione 6). Ora ha tre consumatori possibili (Congedo, CostiChiari, eventuale uliveto), quindi la condizione del critico «estrarre solo con due consumatori» (idea-media.md:113) è soddisfatta.
7. **Ease nuove** registrate in `app/lib/motion/gsap.ts` accanto a quelle di gsap.ts:66-82, una per riga, ognuna col suo consumatore nello stesso commit (condizione di idea-timing P1).

Regole di codice rispettate in tutte le schede: animazioni solo dentro `gsap.matchMedia()` con `MQ.motionOk` (gsap.ts:20-25, :131-141); `fromTo`, mai `from`; nessun transform né ritaglio su antenati di sticky o fixed; elementi focusabili nascosti solo con `opacity`, mai `autoAlpha`; nessun pin di GSAP.

---

## 1. Tabella dei gesti di questa corsia

| Cap. | Gesto | Ease (definizione) | Scrub | Trigger: start → end | Ampiezza | Da | Sotto 1024 |
|---|---|---|---|---|---|---|---|
| 13 FeaturedTestimonial | la foto affonda nella cornice | `dtAffonda` = `0.5,0,0.8,0.45` | 0.42 | cornice: `bottom bottom` → `bottom top` | 10 % dell'altezza della cornice | ogni larghezza | stesso gesto |
| 14 Social | le righe del titolo s'incastrano al centro e si separano | `dtIncastro` = `M0,0 C0.25,0.45 0.3,0.5 0.5,0.5 C0.7,0.5 0.75,0.55 1,1` | 0.33 | sezione: `top 85%` → `bottom 15%` | xPercent ±12 / ±8 / ±6 | ogni larghezza | ampiezza ridotta |
| 15 Team | la rotaia (invariata nella forma) | `dtRail` = `0.12,0,0.88,1` | 0.72 | corridoio esistente (HorizontalRail.tsx:113-120) | eccedenza del track, pan ±4 % | 1024 | scroll nativo con snap (invariato) |
| 16 Contact | il modulo resta indietro | `dtLento` = `0.35,0.05,0.65,0.95` | 1.1 | griglia: `top 75%` → `bottom 25%` | yPercent −3,5 → +3,5 | 1024 | nessun gesto (colonne impilate) |
| 17 Congedo + footer | la cartolina | `dtCartolina` = `0.45,0,0.15,1` | 0.85 | sezione `top top` → footer `clamp(top 40%)` | clip → `inset(8% 22% 8% 22%)`, footer .75→1 | 1024, sticky 80svh | non sticky, `inset(4% 14%)` da 768, `inset(4% 10%)` sotto |

Valori già in uso che queste righe evitano: scrub 0.6 di StarReviews.tsx:420 e HorizontalRail.tsx:118/:125, scrub 0.25 di HorizonScroller.tsx:574, scrub `true` di Parallax.tsx:104, ease `none` di Parallax.tsx:99, HorizontalRail.tsx:132 e HorizonScroller.tsx:573, trigger `top 86%` di TextLines.tsx:114. Le ease nuove non coincidono con `domus`, `domus.inOut`, `dtDiveIn`, `dtOut`, `dtHorScroll`, `dtLoader` (gsap.ts:66-82) né con le ease del catalogo di Era (era-catalog.md, sezione D).

---

## 2. Capitolo 13: FeaturedTestimonial, «la foto affonda»

### Stato attuale
- Sezione `dt-chapter` (FeaturedTestimonial.tsx:114), griglia a due colonne da lg (:115).
- La foto è un link: `<a class="dt-media-half !aspect-video">` (:121-128) dentro `<Parallax speed={-0.04}>` (:120), cioè ±0,56 % in scrub `true` (Parallax.tsx:93-119). Il link intero si muove.
- Immagine `recensione-clienti.jpg` 1280×720 (:100) con `.dt-still-trim--top` (scale 1.32, origine 50 % 100 %, globals.css:395-398), `sizes="(max-width:1024px) 132vw, 56vw"` (:138), quality 75.
- Play rosso assoluto al centro del link (:145-147). Il clic apre VideoLightbox (:107-111, :178).
- Il componente vive anche su /vendi (VendiContent.tsx:962), /acquista con `consulenza.jpg` (AcquistaContent.tsx:610-614) e /recensioni (RecensioniContent.tsx:113).

### Misura che decide l'ampiezza
- Il titolo cotto nel fotogramma finisce alla riga 143 di 720, cioè al 19,9 % dell'altezza (misurato con una scansione di luminanza su `recensione-clienti.jpg`).
- Con la foto che affonda, in alto rientra l'immagine: serve un margine nascosto sopra. Il margine si ottiene con un contenitore più alto della cornice (overscan), e ogni punto di overscan ingrandisce la foto.
- Tetto: 1,43 di ingrandimento totale per le copertine rifilate (DESIGN.md:516, D13).
- Conto: trim `s` e overscan `x` devono dare `s·(1+x) ≤ 1,43` e, a fine corsa, parte nascosta `(s−1)/s ≥ 19,9 %` più un margine.
- Scelta: **trim 1.30, overscan 10 %**. Totale 1,30 × 1,10 = 1,43. Parte nascosta a fine corsa 23,1 % (23 px di margine sul file da 720). A riposo, prima della corsa, ne resta nascosto il 30 %.
- La corsa è quindi il 10 % della cornice, contro il 20 % di Era (era-catalog.md §5). È il massimo che il fotogramma sporco consente. Quando arriva il fotogramma pulito (docs/da-chiedere-alla-cliente.md §2.9) il trim sparisce, l'overscan può salire al 20 % (ingrandimento 1,20) e il gesto torna quello di Era.

### Gesto
```ts
// dentro mm.add(MQ.motionOk) e solo con la prop `gesture`
gsap.fromTo(sink, { yPercent: 0 }, {
  yPercent: 9.0909,            // 10 % della cornice = 10/110 del contenitore
  ease: "dtAffonda",
  scrollTrigger: {
    trigger: frame, start: "bottom bottom", end: "bottom top",
    scrub: 0.42, invalidateOnRefresh: true,
    onToggle: (s) => { sink.style.willChange = s.isActive ? "transform" : ""; },
  },
});
```
Nessuno stato iniziale scritto: `yPercent 0` è lo stato CSS. Niente lampo possibile.

### DOM
```tsx
<a data-sink-frame data-bg="foto" href={href} onClick={onClick} aria-label={...}
   className="dt-media-half !aspect-video group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red">
  <div data-sink className={gesture ? "absolute inset-x-0 bottom-0 top-[-10%]" : "absolute inset-0"}>
    <Image src={image} alt={alt} fill quality={75}
      sizes={gesture ? "(max-width:1024px) 132vw, 61vw" : "(max-width:1024px) 132vw, 56vw"}
      className="dt-still-trim--top object-cover" />
  </div>
  <span className="absolute left-1/2 top-1/2 ...">{/* play invariato */}</span>
</a>
```
- Via il `<Parallax>` di :120: il link non si muove più, si muove solo il contenuto dentro la cornice (`overflow: hidden` del modulo, globals.css:416-423).
- `.dt-still-trim--top` passa da `scale(1.32)` a `scale(1.30)` (globals.css:396). La regola sta prima di `.dt-media-half,`, quindi lo slice per indexOf di `moduli-media.test.ts:57-63` non cambia.
- `sizes` con gesto: cornice 605×340 a 1440, contenitore 605×374, cover 665 px, per 1,30 fa 865 px = 60,1vw, quindi `61vw`. Sotto 1024 la resa è 1,43 × 90vw = 129vw: `132vw` resta valido.
- Prop nuova `gesture?: boolean`, default `false`. Solo `app/page.tsx:88` passa `gesture`.

### Comportamento per larghezza
| Larghezza | Cornice | Corsa | Note |
|---|---|---|---|
| 1440 | 605×340 (42vw, max 640) | 34 px | colonna sinistra della griglia |
| 1024-1279 | 430-537 × 242-302 | 24-30 px | stessa griglia |
| 768-1023 | 84vw × 16:9 (645-859 × 363-483) | 36-48 px | colonne impilate |
| 390 | 351×197 | 20 px | sopra la soglia dei ~10 px che Parallax.tsx:39-45 considera invisibile |

### Reduced-motion e senza JS
Contenitore a riposo, foto ferma, titolo cotto nascosto. Nessuno ScrollTrigger.

### Focus
Il link e il play non si spostano mai: il bersaglio del dito è la cornice ferma. L'outline di focus sta fuori dalla cornice e non viene ritagliato dal suo `overflow`.

### LCP/CLS
Sotto la piega, solo transform: CLS 0, nessun effetto su LCP.

### Test
- `e2e/home.spec.ts`, nuovo «la foto della testimonianza affonda nella cornice» (desktop-1440 e mobile-390, motion ok): si porta la cornice col bordo basso 200 px sopra il fondo del viewport, si attende 600 ms; `m42` della matrice di `[data-sink]` > 0 e ≤ 0,10 × altezza cornice + 1; il rettangolo del link `[data-sink-frame]` coincide con quello di layout (nessun transform sul link).
- `e2e/motion.spec.ts` (reduced): transform di `[data-sink]` = `none`.
- Unitario `still-trim.test.ts`: legge `scale(` di `.dt-still-trim--top` in globals.css e l'overscan `top-[-10%]` in FeaturedTestimonial.tsx; asserisce prodotto ≤ 1,43 e `(s−1)/s ≥ 0,21`.
- A occhio, una volta: fotogramma di fine corsa a 1440 e a 390, il titolo cotto non compare.

### Distinzione
È l'unico capitolo in cui la cornice sta ferma e l'immagine si sposta dentro, in verticale, solo mentre il capitolo esce.

### Rischi
- Su /acquista la foto è `consulenza.jpg` e prende lo stesso trim (esiste già oggi, :141). Senza `gesture` non cambia nulla oltre 1.32 → 1.30. Da guardare a occhio.

---

## 3. Capitolo 14: Social, «le righe s'incastrano»

### Stato attuale
- Una riga, non un capitolo (Social.tsx:7-11): `section` con `py-[clamp(1rem,3vh,2rem)]` (:67), griglia a due colonne da lg allineata in basso (:68).
- Titolo `TextLines` h2 d2 `max-w-[16ch]` (:73-75). Lead, feed Instagram opzionale e `SocialLinks` in Reveal (:79-107). Oggi `instagramIframe` è vuoto, quindi niente media.
- Le icone sono link rotondi (SocialLinks.tsx:25-42).

### Gesto
Ogni riga del titolo parte spostata in orizzontale, righe pari da una parte e dispari dall'altra; al centro dello schermo si allineano e restano ferme un tratto; uscendo si separano nel verso opposto. Scrubbato, quindi entrata e uscita sono speculari.

```ts
// Social passa onLines a TextLines (presupposto 4)
const A = matchMedia(MQ.lg).matches ? 12 : matchMedia(MQ.desktop).matches ? 8 : 6;
return (lines) => {
  const tw = gsap.fromTo(lines,
    { xPercent: (i) => (i % 2 ? -A : A) },
    { xPercent: (i) => (i % 2 ? A : -A), ease: "dtIncastro",
      scrollTrigger: { trigger: section, start: "top 85%", end: "bottom 15%",
                       scrub: 0.33, invalidateOnRefresh: true } });
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
};
```
- `dtIncastro` ha pendenza zero a 0,5: le righe sono allineate (|x| < 2 px) per circa l'8 % della corsa prima e dopo il centro.
- Il valore `A` si rilegge a ogni split: `autoSplit` ricrea le righe al resize e il cambio lingua rimonta TextLines (TextLines.tsx:195), quindi il tween nasce di nuovo con l'ampiezza giusta.
- La trasformazione va sul contenitore di riga più esterno. Se si trasla la riga dentro la sua maschera, la maschera la taglia di lato.

### DOM
- `section` prende `overflow-x-clip` (sicurezza contro lo scroll orizzontale; nessuno sticky dentro).
- Nessun cambio a lead, feed e icone.

### Comportamento per larghezza (misure stimate)
| Larghezza | Riga del titolo | Spostamento massimo | Corsa |
|---|---|---|---|
| 1440 | ~40vw (d2 = 57,6 px, 16ch) | ±12 % ≈ ±70 px, dentro il padding di 8vw (115 px) | 0,70 × 900 + ~360 = ~990 px |
| 1024-1279 | ~40vw | ±12 % ≈ ±50-60 px | ~0,70 vh + altezza riga |
| 768-1023 | colonna piena 84vw | ±8 % ≈ ±52-68 px | idem |
| 390 | 90vw (d2 clamp 2.15rem-9,5vw) | ±6 % ≈ ±21 px | idem |

### Reduced-motion e senza JS
Titolo intero e fermo. Nessuno split a scopo di questo gesto.

### Focus
Le icone e il feed non si muovono. Il titolo non è focusabile.

### LCP/CLS
Solo transform, CLS 0.

### Test
- `e2e/home.spec.ts`, «le righe di Seguici s'incastrano al centro» (1440 e 390, motion ok): con il centro della sezione al centro del viewport, `|m41|` di ogni contenitore di riga < 2 px; con il bordo alto della sezione all'85 %, la riga 0 ha `m41 > 0` e la riga 1 `m41 < 0`.
- Rete anti-traboccamento: `documentElement.scrollWidth − clientWidth ≤ 1` (stesso controllo di home.spec.ts:152-155), aggiunto alle reti di `mobile-motion.spec.ts:27-53`.
- `e2e/motion.spec.ts` (reduced): transform `none` sulle righe.

### Distinzione e rischio A20
- HorizonStory usa già righe in controfase (HorizonScroller.tsx:566-577): tre gradini, `wrap([-5,25,-15]) → wrap([5,-25,25])`, ease `none`, scrub 0.25, dentro lo scroller orizzontale, righe che non si allineano mai.
- Social cambia meccanica (convergenza con sosta al centro), asse di pagina (verticale, niente containerAnimation), ease, scrub e range.
- Resta la stessa famiglia «righe in controfase». Se Alberto la legge come lo stesso comportamento, l'alternativa è togliere a Social il gesto e lasciarlo al solo titolo per lettere della corsia sistema. Domanda da fargli.

---

## 4. Capitolo 15: Team, «la rotaia»

### Stato attuale
- Intro con ritratto in `<Parallax speed={-0.04}>` (Team.tsx:159-171), TextLines e Reveal (:173-206).
- Rotaia `HorizontalRail runway={120} snapMobile` (:219-256). Da 1024 con motion ok è sticky su un corridoio alto `rail-len + 120svh` (globals.css:2078-2085), scrub 0.6 ed ease `none` (HorizontalRail.tsx:113-132), pan ±4 % per tessera (Team.tsx:236-239, HorizontalRail.tsx:134-145). Sotto 1024 scroll nativo con snap e pan via CSS (globals.css:2121-2126).
- Le tessere sono focusabili (`tabIndex={0}`, Team.tsx:233).

### Cambi
1. **Scrub ed ease unici** (A20): scrub 0.6 è anche di StarReviews.tsx:420. HorizontalRail prende due prop con i default di oggi: `scrub?: number = 0.6`, `ease?: string = "none"`. Team passa `scrub={0.72} ease="dtRail"`. `dtRail` addolcisce l'avvio e l'arresto del track quando lo sticky si aggancia e si stacca. Il pan usa la stessa ease, così le due velocità restano proporzionali.
2. **Via la Parallax dell'intro** (Team.tsx:159): la deriva ±0,56 % è un comportamento condiviso con altri capitoli. Il capitolo resta con un gesto solo, la rotaia. Vale anche su /chi-siamo (ChiSiamoContent.tsx:359, `Team compact`): dichiararlo nel commit.
3. **Marcatore del tema**: `data-bg="foto"` sulle cornici `.dt-media-column` delle tessere e sulla foto dell'intro.
4. **Difetto di tastiera da correggere** (esistente, non introdotto qui): con `[data-on]` la rotaia ha `overflow: hidden` (globals.css:2048-2051) ma resta scorrevole da programma, e il focus su una tessera fuori campo scrive `scrollLeft` mentre GSAP scrive `x`. Proposta: `focusin` su una tessera → `rail.scrollLeft = 0` e `getLenis()?.scrollTo(y, { immediate: true })` con `y` = inizio corridoio + (offsetLeft della tessera / eccedenza) × corsa; poi `st.getTween()?.progress(1)` per saltare lo smorzamento dello scrub (API `getTween()` di ScrollTrigger, documentazione GSAP via context7).

### Comportamento per larghezza
Invariato: 1440 tessere 605×756, corridoio `rail-len + 120svh` ≈ 796 + 1080 = 1876 px; 1024-1279 stesso schema; 768-1023 e 390 scroll nativo con snap e `RailProgress`.

### Reduced-motion e senza JS
Invariati (motion.spec.ts:58-65: `data-on` nullo). Senza la Parallax il ritratto dell'intro è fermo in ogni modalità.

### LCP/CLS
Sotto la piega. Il corridoio è già alto `rail-len + 120svh` da oggi: con l'attributo di boot del presupposto 1 anche la sua altezza è scritta prima del paint, oggi arriva con `[data-on]` all'idratazione (HorizontalRail.tsx:103-106).

### Test
- Esistente `home.spec.ts:182-215` resta verde.
- Nuovo in `home.spec.ts`: Tab fino alla terza tessera a 1440 → la tessera è dentro il viewport orizzontale e `rail.scrollLeft === 0`.
- Registro gesti: riga Team con scrub 0.72 ed ease `dtRail`.

### Distinzione
Unico corridoio che trasla in orizzontale con due piani in controverso. HorizonStory trasla pannelli con containerAnimation e scrub 0.25; qui scrub 0.72, `dtRail`, runway 120svh.

---

## 5. Capitolo 16: Contact, «il modulo resta indietro»

### Stato attuale
- `section#contatti` (Contact.tsx:704), testa a tutta riga (:710-719), griglia a due colonne da lg allineata in alto (:724-728).
- Colonna sinistra: lead per intento, recapiti, foto `raffaela-keys.jpg` in `.dt-media-half` dentro `<Reveal delay={120}>` (:758-771).
- Colonna destra: il `<form>` (:775-959). L'invio apre WhatsApp in modo sincrono (:696-698) e porta il focus sul primo campo non valido (:645-647).
- Il componente vive su 12 rotte, compresa la pagina di conversione `/case/[slug]` (PropertyDetail.tsx:646).

### Nota sull'assegnazione
L'assegnazione dice «sale più lenta (ctn-up yPercent 10→−10)». In Era `ctn-up` va da +10 a −10 (era-catalog.md, C4): l'elemento sale **più veloce** della pagina. Una colonna che sale più lenta è `ctn-down` (−10 → +10). Qui si sceglie il ritardo, che tiene il modulo e il suo bottone più a lungo sotto gli occhi, e si riduce l'ampiezza perché il modulo è alto (stima ~1.040 px a 1440 sul ramo venditore).

### Gesto (solo da 1024, motion ok, solo con `gesture`)
```ts
gsap.fromTo(col, { yPercent: -3.5 }, {
  yPercent: 3.5, ease: "dtLento",
  scrollTrigger: { trigger: grid, start: "top 75%", end: "bottom 25%",
                   scrub: 1.1, invalidateOnRefresh: true,
                   onToggle: (s) => { col.style.willChange = s.isActive ? "transform" : ""; } },
});
```
- `yPercent` è relativo all'altezza della colonna: quando cambia l'intento o compare la conferma, il refresh del presupposto 3 ricalcola.
- Ampiezza: 3,5 % di ~1.040 px = ±36 px. All'inizio della corsa la colonna sta 36 px più in alto; lo spazio fra testa e griglia è `clamp(2.5rem, 6vh, 4rem)` (:726), cioè 54 px a 1440×900 e 46 px a 1024×768: nessuna sovrapposizione col titolo.
- La foto resta ferma: via il `<Reveal>` di :758 attorno alla foto (la cella di testo resta alla corsia sistema).

### DOM
```tsx
<div data-lag-col>{/* wrapper nuovo, figlio diretto della griglia */}
  <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-8">…</form>
</div>
```
Il `<form>` e `handleSubmit` non cambiano di una riga. Nessun sticky né fixed dentro il wrapper (l'honeypot è `absolute`, :777).

### Comportamento per larghezza
| Larghezza | Gesto |
|---|---|
| 1440 | ±36 px, corsa = 0,5 × 900 + altezza griglia ≈ 1.500 px |
| 1024-1279 | ±36-40 px, stessa regola |
| 768-1023 | nessuno: le colonne sono impilate e il ritardo porterebbe il modulo sopra la foto |
| 390 | nessuno |

### Reduced-motion e senza JS
Colonna ferma, foto ferma.

### LCP/CLS
Solo transform su un wrapper: CLS 0. Su /contatti (`Contact compact`, contatti/page.tsx:48) il gesto non c'è, quindi l'H1 e il modulo sopra la piega non cambiano.

### Focus
- Digitare non scorre: nessun movimento.
- Il focus che fa scorrere la pagina sposta la colonna al più di 0,044 px per px di scroll (72 px su ~1.640 px di corsa): 300 px di salto spostano il campo di ~13 px, che resta visibile.
- `window.open` sincrono e il focus sul primo errore restano identici.

### Guardia della pagina di conversione
- Prop `gesture?: boolean` default `false`; solo `app/page.tsx:91` passa `gesture`.
- Test in `e2e/pages.spec.ts` (suite con motion ok) su una `/case/<slug>` dei mock: `[data-lag-col]` ha transform `none` dopo uno scroll di 1.500 px, e `[data-sink]` non esiste.
- Unitario: `PropertyDetail.tsx` rende `<Contact` senza `gesture` (regex sul sorgente senza commenti, come `soloCodice` di logo-colore.test.ts).

### Test
- `home.spec.ts`, «il modulo dei contatti resta indietro» (1440): con la griglia al centro, `m42` di `[data-lag-col]` ∈ [−40, 40]; scorrendo di 400 px il valore cresce.
- `motion.spec.ts` (reduced): transform `none`.
- Mobile-390: transform `none`.

### Distinzione
Una sola colonna di una griglia a due si muove, e in ritardo. Paths (capitolo 7) muove due colonne in versi opposti con i valori di Era (±10 %); qui una colonna, ±3,5 %, scrub 1.1, `dtLento`, range `top 75% → bottom 25%`.

---

## 6. Il gate dei video d'ambiente: `useAmbientVideo`

Oggi il gate del Congedo è a mano (Congedo.tsx:52-79): IntersectionObserver con `rootMargin "40% 0px"`, reduced-motion, 768 px (DESIGN.md:401), `play().catch()` e `pause()`, nessuna scrittura di `currentTime`.

### Firma
```ts
useAmbientVideo(videoRef, hostRef, {
  sources: { webm1080: string; mp41080: string; webm720: string; mp4720: string },
  rootMargin = "40% 0px",
  minWidth = "(min-width: 768px)",
});
```

### Regole
- Suona solo se: host vicino (IO), `prefers-reduced-motion: no-preference`, `minWidth`, `!navigator.connection?.saveData` (optional chaining: Safari e Firefox si comportano come oggi), `document.visibilityState === "visible"`.
- Pausa in tutti gli altri casi. Mai `currentTime`: la clip riprende dal punto di pausa, come Era (main.pretty.js:393-396).
- **Scelta della sorgente al primo play**, non nel markup. Il `<video>` nasce senza `src` e senza `<source>`: senza JS non si scarica nulla e resta il poster.
  - larghezza resa = `max(boxW, boxH × 16/9) × devicePixelRatio`; se ≤ 1.408 → 720p, altrimenti 1080p. Esempi: 1366×768 in corridoio DPR 1 → 1.366 → 720p; 1440×900 DPR 1 → 1.600 → 1080p; 768×1024 DPR 2 → 2.550 → 1080p.
  - formato: WebM se `canPlayType('video/webm; codecs="vp9"') === "probably"`, altrimenti MP4. Da provare a mano su Safari macOS e iPad (≥ 768): se scatta, MP4 anche lì (condizione di idea-media.md P2).
  - la scelta non cambia più nella sessione (niente scambi a metà su resize).
- Attributi: `muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback aria-hidden tabIndex={-1}`. Niente `autoPlay`.
- Nessuna estensione di `lib/ui/overlays.ts`: nessun apritore di VideoLightbox sta vicino al Congedo (idea-media.md:113).
- Cleanup: disconnect, rimozione dei listener, `pause()`.

### Test (condizioni del critico, idea-media.md:113)
- `home.spec.ts` desktop-1440 con goto che salta l'intro: scroll al Congedo → `video.paused === false`; ritorno in cima → `true`; di nuovo giù → `currentTime ≥` valore letto prima.
- mobile-390 e reduced-motion su desktop: nessuna richiesta che finisca in `.mp4` o `.webm` (`page.on("request")`). La guardia ignora già `net::ERR_ABORTED` (e2e/helpers.ts:95).
- Unitario: `Congedo.tsx` non contiene `autoPlay` né `currentTime =`.

---

## 7. Capitolo 17: Congedo, «la cartolina», e il footer

### 7.0 Stato attuale
- Commento di apertura «Niente GSAP» (Congedo.tsx:9-11). Poster `piscina-lusso.jpg` scelto per non ripetere la villa del territorio (:13-20).
- Sezione `relative aspect-video min-h-[70svh] w-full overflow-hidden bg-cream-deep` (:82-86): 1440×810 a 1440.
- Poster `next/image` con `sizes="(max-width: 767px) 200vw, 100vw"`, quality 60, `scale-[1.14] object-[16%_50%] origin-bottom-right` (:99-106).
- Video `scale-[1.14]` per mangiare il logo bruciato (:108-124, commento :110-114), sorgenti da `heroCinematic` (:122-123, media.ts:19-22).
- Titolo e CTA in `dt-row absolute inset-x-0 bottom-[12vh]` (:126), h2 d1 bianco `max-w-[12ch]` con `INK_ON_VIDEO` (:30-32, :127-133), CTA `ghost-dark` (:135-143).
- Footer in flusso, `bg-cream`, nessun ref, nessun GSAP, nessuna posizione fissa (Footer.tsx:12-25, :38). È renderizzato da 17 rotte; in home è fratello di `<main>` (page.tsx:94).

### 7.1 Il gesto
Da 1024 con motion ok la banda diventa uno schermo sticky alto 100svh. Scorrendo, il video si ritira in una cornice rettangolare `inset(8% 22% 8% 22%)`: una cartolina ferma al centro dello schermo, sull'avorio. Mentre la cartolina si forma, il footer sale da sotto, cresce da 0,75 a 1 e passa da opacità 0,02 a 1. Il bordo alto del footer arriva esattamente sul bordo basso della cartolina e da lì scorrono insieme.

### 7.2 Geometria (1440×900, 1svh = 9 px)
| Grandezza | Valore |
|---|---|
| Altezza della sezione W | 100svh + 80svh = **180svh = 1.620 px** |
| Schermo sticky S | 100svh, `top: 0` |
| Corsa sticky | 80svh = 720 px |
| Footer | `margin-top: −8svh` (−72 px), in flusso, `position: relative; z-index: 1` |
| Timeline | da «W top = viewport top» a «footer top al 40 %»: 172svh − 40svh = **132svh = 1.188 px** (720 sticky + 468 liberi) |
| Ingresso del footer nel viewport | s = 80svh − 8svh = 72svh → progresso 72/132 = **0,545** |
| Finestra finale | x 316,8 → 1.123,2 (806 px), y 72 → 828 (756 px) |

Timeline (durata normalizzata 1):
| Posizione | Bersaglio | Da → a |
|---|---|---|
| 0 → 0,54 | bordo basso della finestra (`b`) | 0 % → 8 % |
| 0 → 0,85 | bordi alto, destro, sinistro (`t`, `r`, `l`) | 0 % → 8 %, 0 % → 22 %, 0 % → 22 % |
| 0,545 → 1 | footer | `scale .75 → 1`, `opacity .02 → 1`, origine `50% 0%` |

Il bordo basso chiude prima degli altri: quando il footer entra (0,545) la finestra ha già il suo bordo basso al 92 %, quindi il footer, che durante lo sticky sta sempre sotto il 92 %, non copre mai il video. Al rilascio il bordo alto del footer e il bordo basso della finestra coincidono (92svh) e restano incollati.

### 7.3 Codice (schema)
```ts
useGSAP(() => {
  const W = sectionRef.current!, S = screenRef.current!, clip = clipRef.current!, marker = markerRef.current!;
  const footer = document.querySelector<HTMLElement>("footer[data-postcard-foot]");
  const mm = gsap.matchMedia();
  mm.add({ lg: `${MQ.motionOk} and ${MQ.lg}`, tab: `${MQ.motionOk} and ${MQ.desktop} and ${MQ.belowLg}`, phone: `${MQ.motionOk} and ${MQ.belowDesktop}` }, (ctx) => {
    const { lg, tab } = ctx.conditions as Record<string, boolean>;
    const end = lg ? { t: 8, r: 22, b: 8, l: 22 } : tab ? { t: 4, r: 14, b: 4, l: 14 } : { t: 4, r: 10, b: 4, l: 10 };
    const box = { t: 0, r: 0, b: 0, l: 0 };
    const paint = () => {
      const v = `${box.t}% ${box.r}% ${box.b}% ${box.l}%`;
      clip.style.clipPath = `inset(${v})`;
      marker.style.inset = v;                  // il rettangolo del tema segue la finestra
    };
    const st = lg
      ? { trigger: W, start: "top top", endTrigger: footer, end: "clamp(top 40%)", scrub: 0.85 }
      : { trigger: S, start: "bottom bottom", end: "clamp(bottom 30%)", scrub: 0.85 };
    const tl = gsap.timeline({ defaults: { ease: "dtCartolina" },
      scrollTrigger: { ...st, invalidateOnRefresh: true,
        onToggle: (s) => { clip.style.willChange = s.isActive ? "clip-path" : "";
                           if (footer) footer.style.willChange = s.isActive ? "transform, opacity" : ""; } } });
    if (lg) tl.to(box, { b: end.b, duration: 0.54, onUpdate: paint }, 0)
              .to(box, { t: end.t, r: end.r, l: end.l, duration: 0.85, onUpdate: paint }, 0);
    else    tl.to(box, { ...end, duration: 0.8, onUpdate: paint }, 0);
    const at = lg ? 0.545 : 0;
    if (footer) {
      // stato dipinto SOLO se il footer è fuori schermo: mai un lampo visibile → nascosto
      if (footer.getBoundingClientRect().top > innerHeight) gsap.set(footer, { scale: 0.75, opacity: 0.02, transformOrigin: "50% 0%" });
      tl.fromTo(footer, { scale: 0.75, opacity: 0.02 }, { scale: 1, opacity: 1, duration: 1 - at, immediateRender: false }, at);
    }
    // atterraggio a pagina già scrollata (ancora, bfcache): niente fade da .02 su un footer in vista
    const trig = tl.scrollTrigger!;
    if (trig.progress > 0) { tl.progress(trig.progress); trig.getTween()?.progress(1); }
    // rete di tastiera
    const onFocus = () => {
      const top = footer!.getBoundingClientRect().top;
      if (top > innerHeight * 0.4) getLenis()?.scrollTo(scrollY + top - innerHeight * 0.4, { immediate: true, force: true });
      trig.getTween()?.progress(1);
    };
    footer?.addEventListener("focusin", onFocus);
    return () => { footer?.removeEventListener("focusin", onFocus); clip.style.clipPath = ""; marker.style.inset = ""; };
  });
}, { scope: sectionRef });
```
- `clamp()` nell'`end` tiene la fine dentro la pagina (documentazione ScrollTrigger via context7): il footer è alto ~1.037 px (stima) e supera i 60svh che servono, ma il clamp copre schermi bassissimi.
- `getTween().progress(1)` chiude lo smorzamento dello scrub (documentazione `getTween()` via context7).
- `immediateRender: false` sul `fromTo` del footer evita la trappola nota della timeline scrubbata (memoria domus-wow-layer, «fromTo più avanti ha immediateRender true»); lo stato armato lo scrive la `set` guardata.
- Il footer sta fuori dallo scope di `useGSAP`: `querySelector` su `document` è voluto; il revert del context ripulisce i suoi transform.

### 7.4 DOM
```tsx
<section ref={sectionRef} id="congedo" aria-labelledby="congedo-title" className="dt-postcard relative">
  <div ref={screenRef} className="dt-postcard_screen pointer-events-none relative aspect-video min-h-[70svh] w-full overflow-hidden">
    <div ref={clipRef} className="pointer-events-auto absolute inset-0 bg-cream-deep">
      <Image src="/media/congedo-drone-poster.jpg" alt="" fill quality={60}
             sizes="(max-width: 767px) 270vw, (max-width: 1023px) 166vw, 134vw"
             className="object-cover" style={{ objectPosition: "var(--pc-focus)" }} />
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "var(--pc-focus)" }}
             muted loop playsInline preload="none" disablePictureInPicture disableRemotePlayback aria-hidden tabIndex={-1} />
    </div>
    <div ref={markerRef} data-bg="foto" aria-hidden className="pointer-events-none absolute inset-0" />
    <div className="dt-postcard_copy pointer-events-auto absolute">
      <h2 id="congedo-title" className="max-w-[12ch] text-balance font-display text-d1 text-white" style={INK_ON_VIDEO}>{c.title}</h2>
      <Cta href="#contatti" variant="ghost-dark" arrow={false} className="mt-8 !text-d4 !font-light" style={INK_ON_VIDEO}>{c.cta}</Cta>
    </div>
  </div>
</section>
```
Cosa sparisce: `overflow-hidden` e `bg-cream-deep` dalla sezione (un `overflow: hidden` sul genitore di uno sticky lo rende il contenitore di scorrimento e lo sticky non si aggancia più); `scale-[1.14]`, `origin-bottom-right` e il commento di :110-114; `bottom-[12vh]` e `dt-row` sul blocco di testo.

CSS nuovo, da mettere dopo il blocco `.dt-railway` (globals.css:2066-2126), lontano dai moduli media:
```css
/* ---------- La cartolina del congedo (A19, Alberto, 13 set.) ---------- */
.dt-postcard { --pc-x: 10%; --pc-y: 4%; --pc-gap: 5vw; --pc-focus: 12% 50%; }
@media (min-width: 768px)  { .dt-postcard { --pc-x: 14%; --pc-gap: 3vw; } }
@media (min-width: 1024px) { .dt-postcard { --pc-x: 22%; --pc-y: 8%; --pc-focus: 50% 50%; } }
.dt-postcard_copy {
  left: calc(var(--pc-x) + var(--pc-gap));
  bottom: calc(var(--pc-y) + 6%);
  max-width: calc(100% - 2 * (var(--pc-x) + var(--pc-gap)));
}
@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  html[data-corridoi] .dt-postcard { height: 180svh; }
  html[data-corridoi] .dt-postcard_screen { position: sticky; top: 0; height: 100svh; aspect-ratio: auto; min-height: 0; }
  html[data-corridoi] footer[data-postcard-foot] { position: relative; z-index: 1; margin-top: -8svh; }
}
```
Le regole non stratificate battono le utility di Tailwind (memoria domus-cta-system), quindi `position: sticky` e `aspect-ratio: auto` vincono su `relative` e `aspect-video`.

`--pc-focus` sotto 1024 (`12% 50%`) è un punto di partenza, non una misura: il vecchio `16% 50%` era misurato su `piscina-lusso.jpg` (Congedo.tsx:87-93). Sul nuovo poster si misura come l'11 settembre, luminanza media dei pixel sotto il rettangolo del titolo a 390 e a 768 per 8 %, 12 %, 16 % e 24 %, e si tiene il valore più scuro. Nel fotogramma d'apertura a sinistra ci sono prato e siepi scure, al centro le tende bianche e i lettini: il titolo deve cadere sul verde.

Footer: prop `postcard?: boolean` che scrive solo `data-postcard-foot`; `app/page.tsx:94` passa `<Footer postcard />`. Le altre 16 rotte non cambiano.

Antenati dello sticky: `section` (nessun transform, nessun overflow), `<main className="flex-1">` (page.tsx:75), `div#main` (layout.tsx:297), `body` (layout.tsx:241), `html` con `overflow-x: clip` (globals.css:211-217, `clip` non crea un contenitore di scorrimento). Il ritaglio sta su un figlio dello sticky, il transform sul footer, che non è antenato di niente di sticky o fisso.

Pittura: il footer ha `z-index: 1` e viene dopo nel DOM, quindi copre la fascia bassa della sezione (fuori dalla finestra). WhatsAppFloat (`fixed z-50`, WhatsAppFloat.tsx:26) resta sopra. La testata da lg è `relative` (Header.tsx:202).

### 7.5 Titolo sempre dentro la finestra
Il blocco di testo è posizionato in CSS dentro il rettangolo finale, in percentuale della scatola: vale fermo, a metà e a fine gesto, con o senza JS.

| Larghezza | Finestra finale | Blocco testo: sinistra, fondo, larghezza max | d1 | Parola più lunga (stima) |
|---|---|---|---|---|
| 1920×1080 | 1.075 × 907 | 480 px, 14 % (151 px), 960 px | 108 px | «VERKAUFEN» ~700 px |
| 1440×900 | 806 × 756 | 360 px, 126 px, 720 px | 90 px (`min(10vh, 6.5vw)`, globals.css:136) | ~583 px |
| 1024×768 | 573 × 645 | 256 px, 108 px, 512 px | 66,6 px | ~431 px |
| 768×1024 (banda 768×717) | 553 × 660 | 131 px, 72 px, 506 px | 50 px | ~324 px |
| 390×844 (banda 390×591) | 312 × 544 | 58 px, 59 px, 273 px | 40,8 px (globals.css:293) | ~264 px |

Le larghezze delle parole sono stimate con 0,72 em per lettera maiuscola Playfair: il test sotto le misura davvero nelle cinque lingue.

**Scarto dichiarato dall'assegnazione** («mobile 4% 32%»): in Era 4 %/32 % si applica a una scatola alta tre volte la larghezza (era-catalog.md §14-15). Sulla banda del telefono (390×591) lascerebbe una fessura di 140 px in cui il d1 non entra. Qui: `inset(4% 10%)` sotto 768 e `inset(4% 14%)` fra 768 e 1023. Da registrare come decisione di lavoro in §11.2.

### 7.6 Comportamento per larghezza
| Larghezza | Sticky | Gesto | Video |
|---|---|---|---|
| ≥ 1440 | sì, 180svh | tabella 7.2 | 1080p (DPR 1 a 1440 rende 1.600 px) |
| 1280-1439 | sì | uguale; a 1366×768 DPR 1 rende 1.366 px | 720p a 1366, 1080p sopra 1.408 px resi |
| 1024-1279 | sì | uguale | 720p a DPR 1, 1080p a DPR 2 |
| 768-1023 | no | trigger banda `bottom bottom → clamp(bottom 30%)`, clip → `inset(4% 14%)` in 0,8, footer .75→1 da 0 a 1, nessun margine negativo | sì (soglia 768, DESIGN.md:401) |
| 390 | no | uguale con `inset(4% 10%)` | mai: resta il poster |

Il footer sotto 1024 entra dal fondo del viewport esattamente all'inizio del range (è attaccato alla banda), quindi la `set` guardata lo arma quando è ancora fuori.

### 7.7 Reduced-motion e senza JS
- Nessun `html[data-corridoi]`, nessuna timeline: la banda è `aspect-video min-h-[70svh]`, piena, senza ritaglio, col testo dentro il rettangolo che sarebbe la finestra.
- Il video non riceve mai una sorgente: resta il poster.
- Footer in flusso, scala 1, opacità 1.

### 7.8 Focus e clic
- La CTA sta sopra il livello del ritaglio e dentro la finestra in ogni stato: cliccabile sempre. Lo schermo sticky ha `pointer-events: none` (altrimenti la sua scatola trasparente intercetterebbe i clic sul footer che gli scorre sopra), il ritaglio e il testo `pointer-events: auto`. `clip-path` limita anche il bersaglio del video alla finestra.
- I link del footer: `opacity` e mai `visibility`. Rete `focusin` (7.3): se il footer non è ancora arrivato al 40 %, la pagina salta lì senza animazione e lo scrub si chiude. Verifica del conto: un link a y px dal bordo alto del footer, portato in vista dal browser, lascia il footer sopra il 40 % se y ≥ 496 px (a 900 px di viewport); sotto, il salto al 40 % lo mette a 360 + y < 856 px, dentro lo schermo.
- Il marcatore del tema e il livello del ritaglio sono `aria-hidden` o decorativi; il titolo resta `h2#congedo-title`.

### 7.9 LCP e CLS
- Sezione in fondo alla pagina: nessun candidato LCP.
- Altezza del corridoio scritta in CSS sotto l'attributo di boot: nessuno spostamento dopo l'idratazione.
- Solo `clip-path`, `transform`, `opacity`.
- Costo di pittura: un `clip-path` scritto da JS non viene composto e ridipinge un video 1080p a ogni fotogramma. Budget: pannello Performance a 1440 con CPU 4×, meno di 4 ms di paint per fotogramma durante lo sticky. Se sfora: quattro lastre avorio (`scaleX`/`scaleY` dai bordi, composte dalla GPU) sopra il video al posto del `clip-path`, stesso aspetto, `pointer-events: none`. Le lastre ricordano le tende di Open Domus (capitolo 9): usarle solo se la misura lo impone, e dirlo.

### 7.10 Test
- `e2e/home.spec.ts`, «la banda del congedo si ritira in una cartolina» (desktop-1440, motion ok):
  - `html` ha `data-corridoi`; lo schermo a metà corsa ha `getBoundingClientRect().top === 0`;
  - a W top + 40svh il `clip-path` letto è `inset(t% r% b% l%)` con 0 < t < 8;
  - con il footer al 40 %: `inset(8% 22% 8% 22%)` ± 0,2; footer `opacity === "1"` e matrice di scala 1;
  - in tre punti (0, metà, fine) `elementFromPoint` al centro della CTA restituisce il link della CTA;
  - `#congedo-title` sta dentro il rettangolo della finestra, calcolato dal rettangolo dello schermo e dagli inset, nelle 5 lingue (cambio lingua dal selettore della testata), a 1024, 1440 e 1920 (progetto con viewport personalizzato).
- Antenati: dalla sezione a `html`, `getComputedStyle(el).transform === "none"` e `overflow-y` né `hidden` né `auto` né `scroll` (lo stesso controllo va messo nei sei corridoi).
- Tastiera: Tab dalla CTA al primo link del footer con il footer al 90 % → entro 1 s `opacity === "1"`.
- mobile-390: lo schermo non è sticky; a fine range `inset(4% 10% 4% 10%)`; titolo dentro la finestra; nessuna richiesta video.
- `e2e/motion.spec.ts` (reduced): nessun `data-corridoi`, `clip-path` `none`, footer transform `none`, schermo `position: relative`.
- Conta dei corridoi (critic.md punto 25): a 1440 con motion ok la home ha sei elementi sticky attivi; con reduced motion zero.
- Unitari: `congedo-cartolina.test.ts` (nessun `scale-[1.14]` né `1.14` in Congedo.tsx fuori dai commenti, nessun `overflow-hidden` sulla `section`, i percorsi di `media.ts` esistono in `public/`, `sizes` del poster = stringa della scheda); `media-file.test.ts` (sezione 8.8).
- Test esistenti da tenere d'occhio: `home.spec.ts:96-98` (link del footer visibili: con `opacity` restano visibili per Playwright), `consent-reviews.spec.ts:133-135` e `errors.spec.ts:67` (clic nel footer: Playwright aspetta la stabilità, lo scrub dura 0,85 s).

### 7.11 Distinzione
Unico corridoio in cui un'immagine si **restringe** (il tuffo scala 1→2, la finestra di Open Domus si apre e scala 1,84, la rotaia e HorizonStory traslano, le stelle fanno il morph) e l'unico che consegna la fine a un altro blocco in flusso. Ease `dtCartolina`, scrub 0.85, 80svh sticky + 52svh liberi.

### 7.12 Altezza aggiunta alla home
| Viewport | Congedo oggi | Congedo nuovo | Margine footer | Aggiunta |
|---|---|---|---|---|
| **1440×900** | 810 px | 1.620 px | −72 px | **+738 px (0,82 schermi)** |
| 1024×768 | 576 px | 1.382 px | −61 px | +745 px |
| 1920×1080 | 1.080 px | 1.944 px | −86 px | +778 px |

Gli altri capitoli di questa corsia non aggiungono altezza.

### 7.13 Rischi aperti
- **Stessa villa, stesso volo, in apertura e in chiusura.** `public/media/hero-aerial.jpg` (pannello del territorio di HorizonStory, HorizonStory.tsx:309) è la stessa villa ripresa dallo stesso volo del tratto 0-9,1 s (verificato a vista oggi). È proprio il doppione che Congedo.tsx:13-19 aveva evitato col poster. Oggi sul desktop c'è già (la clip di 4 s è quel volo); col nuovo poster ci sarebbe anche sul telefono. Proposta per Alberto e per la corsia di HorizonStory: il territorio con un fermo del drone largo sul quartiere (tratto 75,1-81,1 s, fotogramma ~1.950, da estrarre e guardare: nessuna persona nel foglio dei tempi), oppure accettare il doppione.
- ScrollTrigger in fondo alla home sotto sei corridoi: con tutti i corridoi sticky e le altezze in CSS non ci sono pin-spacer che spostano le misure, ma il test «schermo a top 0 a metà corsa» è la prova. Se fallisce, il progresso della timeline si calcola da `getBoundingClientRect()` di W a ogni evento `scroll` di Lenis, con `gsap.quickTo` per lo smorzamento.

---

## 8. Catena dei media

### 8.1 Fatti misurati oggi
Master: `C:\Users\alber\Downloads\Tradate Via Cima rossa.mov`.
- Stream (ffprobe): 0 audio AAC, 1 video H.264 3840×2160 25 fps bt709 39,6 Mbps, 2 dati, 3 copertina MJPEG. `-map 0:v:0` prende lo stream 1 (il video), non la copertina. 3.639 fotogrammi, `start_time` 0.
- **Tagli di scena per indice di fotogramma** (decodifica da 0 con `setpts=N/(25*TB)` e `select='gt(scene,0.3)'`): 228, 315, 460, 600, 731, 809, 889, 1005, 1056. Coincidono con i tempi di media-nuovi.md (9,12 s = fotogramma 228).
- **`-ss` prima di `-i` non è preciso su questo file**: cinque strisce estratte con `-ss 9.00`, `23.88`, `29.12`, `35.44`, `40.08` erano già tutte oltre il taglio. Tutti i comandi qui sotto tagliano per indice (`trim=start_frame:end_frame`) decodificando dall'inizio con `-t` come limite.
- Tratti scelti (con un fotogramma di margine dai tagli): drone **0-226** (227 fotogrammi, 9,08 s); uliveto **601-729** (129, 5,16 s); acqua **890-1003** (114, 4,56 s).
- **Raccordo del loop** (SSIM a 960×540, «primo contro ultimo» e, fra parentesi, «primo contro secondo» come passo normale): drone 0,170 (0,840); uliveto 0,128 (0,375); acqua 0,468 (0,740). Nessuno dei tre si raccorda da solo: il salto si vedrebbe a ogni giro.
- **Prova del grafo di raccordo** sul drone (480×270): 202 fotogrammi, 8,08 s; primo contro ultimo 0,891 contro 0,949 del passo normale, cioè il 94 %: il raccordo vale un passo di fotogramma.
- **Persona a 45,2 s**: il fotogramma 1.130 mostra una donna seduta sul lettino. La riga «40,2-50,4 dettagli, persone: no» di media-nuovi.md è sbagliata. Fotogrammi fermi verificati senza persone: 770, 850, 1.185.
- **Foto**: 5977×3985, Sony ILCE-7M3, nessun tag GPS, metadati con `Artist: davide salerno` e `Copyright: davidesalernofotografo@gmail.com`. Le foto sono firmate da un fotografo: serve la licenza (8.9) e i metadati non vanno pubblicati (contengono un indirizzo e-mail).
- File attuali: `domus-hero.mp4` 4,0 s, 100 fotogrammi, 10,8 Mbps, 5.404.642 byte, con traccia dati; `hero-aerial.jpg` 2560×1280; `recensione-clienti.jpg` 1280×720 col titolo cotto fino al 19,9 %; `attico-tradate.jpg` 1200×800 è un render 3D anche se sta in `reali/`; `raffaela-team-sede.jpg` ha il titolo «Domus Tua al cinema» cotto.
- Strumenti presenti: ffmpeg/ffprobe (WinGet Gyan), `node_modules/sharp`. Assenti: ImageMagick, exiftool, cwebp.

### 8.2 Clip: variabili e mezzanino (Git Bash)
Il mezzanino è un file lossless 1920×1080 già tagliato, senza logo e raccordato. Tutte le codifiche partono da lì, non dal 4K e non dall'H.264 da 1080 di oggi.
```bash
SRC="/c/Users/alber/Downloads/Tradate Via Cima rossa.mov"
WORK="/c/Users/alber/AppData/Local/Temp/domus-media"   # fuori dal repo
OUT="/c/Users/alber/domus-tua-site/public/media"
mkdir -p "$WORK"
CROP="crop=iw*0.90:ih*0.90:iw*0.10:ih*0.10"            # 3456x1944 da x=384 y=216: via il logo, 16:9 invariato

# loop_mezz NOME PRIMO FINE_ESCLUSIVA FOTOGRAMMI_DI_DISSOLVENZA
loop_mezz () {
  local name=$1 a=$2 b=$3 d=$4 fps=25
  local n=$((b - a)); local body=$((n - d))
  local offset; offset=$(awk "BEGIN{printf \"%.2f\", ($body - $d)/$fps}")
  local dur;    dur=$(awk "BEGIN{printf \"%.2f\", $d/$fps}")
  local tmax;   tmax=$(awk "BEGIN{printf \"%.2f\", $b/$fps + 0.2}")
  ffmpeg -v error -y -t "$tmax" -i "$SRC" -filter_complex \
"[0:v:0]trim=start_frame=$a:end_frame=$b,setpts=PTS-STARTPTS,$CROP,scale=1920:1080:flags=lanczos,format=yuv420p,split[x][y];\
[x]trim=start_frame=0:end_frame=$d,setpts=PTS-STARTPTS[head];\
[y]trim=start_frame=$d,setpts=PTS-STARTPTS[body];\
[body][head]xfade=transition=fade:duration=$dur:offset=$offset,format=yuv420p[v]" \
    -map "[v]" -an -c:v ffv1 -level 3 "$WORK/$name-mezz.mkv"
}

loop_mezz congedo-drone 0   227  25   # uscita 202 fotogrammi, 8,08 s, dissolvenza 1,0 s
loop_mezz acqua         890 1004 20   # uscita 94 fotogrammi, 3,76 s, dissolvenza 0,8 s
loop_mezz uliveto       601 730  25   # uscita 104 fotogrammi, 4,16 s: solo se usato (vedi 8.6)
```
Come si raccorda: il corpo va dal fotogramma `d` alla fine; negli ultimi `d` fotogrammi si dissolve nei primi `d`. L'uscita comincia con il fotogramma `a+d` e finisce con `a+d−1`: il giro successivo è un passo di un fotogramma. La sintassi del grafo è stata provata oggi sul drone.

### 8.3 Codifiche
```bash
X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -g 50 -keyint_min 50 -sc_threshold 0 \
      -colorspace bt709 -color_primaries bt709 -color_trc bt709 -movflags +faststart -map_metadata -1 -an"
VP9="-c:v libvpx-vp9 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -g 50 -pix_fmt yuv420p -map_metadata -1 -an"

enc () {   # enc NOME
  local M="$WORK/$1-mezz.mkv"
  ffmpeg -v error -y -i "$M" $X264 -crf 23 -maxrate 6M -bufsize 12M -level 4.1 "$OUT/$1-1080.mp4"
  ffmpeg -v error -y -i "$M" -vf scale=1280:720:flags=lanczos $X264 -crf 24 -maxrate 3M -bufsize 6M -level 3.1 "$OUT/$1-720.mp4"
  ffmpeg -v error -y -i "$M" $VP9 -crf 34 -tile-columns 2 "$OUT/$1-1080.webm"
  ffmpeg -v error -y -i "$M" -vf scale=1280:720:flags=lanczos $VP9 -crf 36 -tile-columns 1 "$OUT/$1-720.webm"
  ffmpeg -v error -y -i "$M" -frames:v 1 "$WORK/$1-poster.png"            # primo fotogramma dell'uscita
}
enc congedo-drone
enc acqua
# enc uliveto   # solo se usato

rm "$OUT/domus-hero.mp4"   # sostituito: resta nella storia git
```
Pesi attesi (stime da verificare con `ls -l`): drone 1080 MP4 ≤ 6,1 MB (tetto `maxrate` 6 Mbps × 8,08 s), 720 MP4 ≤ 3 MB, WebM circa la metà; acqua in proporzione ai 3,76 s. Muto: `-an` e nessuna traccia dati (`-map_metadata -1`, e il mezzanino ha solo il video).

### 8.4 Controlli dopo la codifica
```bash
check () {   # check NOME
  local f="$OUT/$1-1080.mp4" n
  ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,nb_frames -of compact "$f"   # solo video, niente audio né dati
  ffprobe -v debug "$f" 2>&1 | grep -m2 -oE "type:'(moov|mdat)'"                                     # faststart: moov prima di mdat
  n=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$f")
  ffmpeg -v error -y -i "$f" -vf "select='eq(n\,0)+eq(n\,1)+eq(n\,$((n-1)))',scale=480:270" -fps_mode passthrough "$WORK/$1-s%d.png"
  echo "raccordo (ultimo->primo):"; ffmpeg -hide_banner -i "$WORK/$1-s3.png" -i "$WORK/$1-s1.png" -lavfi ssim -f null - 2>&1 | grep -oE "All:[0-9.]+"
  echo "passo normale (primo->secondo):"; ffmpeg -hide_banner -i "$WORK/$1-s1.png" -i "$WORK/$1-s2.png" -lavfi ssim -f null - 2>&1 | grep -oE "All:[0-9.]+"
  # 6 s da guardare: ultimi 3 s del giro e primi 3 s del giro dopo
  ffmpeg -v error -y -stream_loop 1 -i "$f" -ss "$(awk "BEGIN{print $n/25-3}")" -t 6 -c:v libx264 -crf 18 -an "$WORK/$1-raccordo.mp4"
  # logo: il primo fotogramma a piena risoluzione, angolo in alto a sinistra
  ffmpeg -v error -y -i "$f" -frames:v 1 -vf "crop=640:200:0:0" "$WORK/$1-angolo-logo.png"
}
check congedo-drone; check acqua
```
Criteri: raccordo ≥ 0,9 × passo normale; nessuna lettera del logo in `*-angolo-logo.png`; nessun banding nel cielo e nell'acqua a vista sui fotogrammi 0, metà e ultimo; `*-raccordo.mp4` guardato due volte senza scatto. Dopo la sostituzione dei file: kill del server, `rm -rf .next` (la cache di Turbopack serve file vecchi, memoria domus-wow-layer), poi DevTools a 1024, 1366 e 1440 per vedere quale sorgente sceglie `useAmbientVideo` e quanto pesa.

### 8.5 Fermi dal 4K (per le bande delle pagine interne)
```bash
still () {   # still NOME INDICE
  ffmpeg -v error -y -t "$(awk "BEGIN{print $2/25+0.2}")" -i "$SRC" -map 0:v:0 \
    -vf "select='eq(n\,$2)',$CROP" -fps_mode passthrough -frames:v 1 "$WORK/$1.png"
}
still villa-salotto-ombrellone 770
still villa-facciata-lettini  850
still villa-vetrata-lanterne 1185
still villa-uliveto            660   # da guardare prima di usarlo
```
3456×1944 in uscita, poi sharp (8.6). Sono fermi di un H.264 a 39,6 Mbps: nitidi per una banda da 1440 px resi, meno di uno scatto reflex. Mai un fermo dai tratti con persone (18,4-24, 45,2 circa, 54,4-59,1, 65,5-75,1, 81-122,7, 122,7-145,5).

### 8.6 Foto: conversione con sharp
`scripts/media/villa-foto.mjs` (nuovo), da lanciare con `node scripts/media/villa-foto.mjs` dalla radice del repo:
```js
import sharp from "sharp";
import { join } from "node:path";

const SRC = "C:/Users/alber/Downloads";
const WORK = "C:/Users/alber/AppData/Local/Temp/domus-media";
const OUT = "public/images/reali";

const jobs = [
  [join(SRC, "_DSC2014.jpg"), "villa-portico-tenda"],
  [join(SRC, "_DSC2016.jpg"), "villa-piscina-facciata"],
  [join(SRC, "_DSC2022.jpg"), "villa-fronte-acqua"],
  [join(SRC, "_DSC2024.jpg"), "villa-angolo-piscina"],
  [join(SRC, "_DSC2025.jpg"), "villa-lettini"],
  [join(WORK, "villa-salotto-ombrellone.png"), "villa-salotto-ombrellone"],
  [join(WORK, "villa-facciata-lettini.png"), "villa-facciata-lettini"],
  [join(WORK, "villa-vetrata-lanterne.png"), "villa-vetrata-lanterne"],
];

for (const [src, name] of jobs) {
  const info = await sharp(src)
    .rotate()                                              // orientamento EXIF applicato prima di togliere i metadati
    .resize({ width: 2560, withoutEnlargement: true, kernel: "lanczos3" })
    .jpeg({ quality: 82, mozjpeg: true, chromaSubsampling: "4:2:0", progressive: true })
    .toFile(join(OUT, `${name}.jpg`));                     // sharp non copia EXIF, XMP né IPTC senza keepMetadata()
  console.log(name, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}

for (const clip of ["congedo-drone", "acqua"]) {
  await sharp(join(WORK, `${clip}-poster.png`))
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(`public/media/${clip}-poster.jpg`);
}
```
- Dimensioni: 2560×1707 per le foto 3:2, 2560×1440 per i fermi 16:9, 1920×1080 per i poster. 2560 è il massimo che il loader chiede (`deviceSizes`, next.config.ts:149); oltre è peso inutile nel repo. `quality` nei componenti resta fra 60, 75 e 78 (next.config.ts:146).
- Nessuna variante a mano: AVIF e WebP li genera l'ottimizzatore (next.config.ts:141).
- `_DSC2014 (1).jpg` è un doppione (SHA1 identico, media-nuovi.md:9): non si converte.
- Nomi neutri: nessun riferimento alla via né al comune della villa, né nei file né negli `alt`.
- Per /open-domus in home (capitolo 9) la finestra scala 1,84: con la foto larga 2560 la resa regge se la corsia del capitolo 9 impagina l'immagine alla larghezza della finestra e non a tutto schermo. Conto da fare in quella corsia con `npm run probe:crop`.

### 8.7 Allocazione «media → pagina → capitolo»
**Home (`/`)**, in ordine di pagina. Nessun file compare due volte.
| Cap. | Media oggi | Media dopo | Villa? |
|---|---|---|---|
| 1 Hero | `/media/hero-raffaela.jpg` | invariato (patto della porta) | no |
| 2 Posizionamento | `reali/consulenza.jpg` | invariato | no |
| 4 HorizonStory | `/media/hero-aerial.jpg` | invariato, oppure fermo del drone sul quartiere (rischio 7.13) | sì (dall'alto) |
| 5 StarReviews | `reali/premio-team.jpg` | invariato | no |
| 6 Voci | copertine YouTube | invariato | no |
| 7 Paths | `raffaela-specchio-profilo.jpg`, `villa-pool.jpg` | invariato (`villa-pool` è un'altra casa) | no |
| 8 Method | `raffaela-ritratto.jpg`, `video-villa-mozart.jpg`, `handshake.jpg` | invariato | no |
| 9 OpenDomus | `open-domus-teresa.jpg` | finestra: **`villa-fronte-acqua.jpg`** (solo qui); contenuto: `open-domus-teresa.jpg` | sì |
| 11 Services | riga 1 `home_staging_01` (render), riga 2 `villa-tramonto.jpg`, riga 3 `rendering_01` (render) (Services.tsx:237-241) | riga 1 **`villa-lettini.jpg`** (proposta alla corsia 11); righe 2 e 3 invariate | sì |
| 12 CostiChiari | nessuno | loop **`acqua-*`** + `acqua-poster.jpg` | superficie d'acqua |
| 13 FeaturedTestimonial | `recensione-clienti.jpg` | invariato | no |
| 15 Team | `raffaela-founder.jpg`, `raffaela-specchio-sorriso.jpg`, `team-red.jpg`, `team-group.jpg` | invariato | no |
| 16 Contact | `raffaela-keys.jpg` | invariato (lo stesso file compare di nuovo a 64 px nella conferma, site.ts:483 e Contact.tsx:932-937: esistente) | no |
| 17 Congedo | `domus-hero.mp4` + poster `piscina-lusso.jpg` | loop **`congedo-drone-*`** + `congedo-drone-poster.jpg` | sì (dall'alto) |

In home la villa comparirebbe quattro volte riconoscibile (territorio, finestra, Services, congedo) più l'acqua. PRODUCT.md:166 vieta la stessa **foto** due volte, non la stessa casa, ma quattro apparizioni leggono «un'agenzia con una villa». Proposta: tenere finestra e congedo, e decidere con Alberto su territorio (7.13) e Services.

**Bande di PageHero delle pagine interne.** Oggi 9 su 11 usano repertorio (docs/da-chiedere-alla-cliente.md:168-173).
| Pagina | Banda oggi (file:riga) | Banda dopo | Altri media della pagina (unicità) |
|---|---|---|---|
| /vendi | `premium_02_living_dining_piante` (VendiContent.tsx:912) | **`villa-piscina-facciata.jpg`** | BeforeAfter render, FeaturedTestimonial `recensione-clienti`, Contact `raffaela-keys` |
| /acquista | `hero_04_living_moderno_bianco` (AcquistaContent.tsx:527) | **`villa-lettini.jpg`** | FeaturedTestimonial con `consulenza` (:614), Contact |
| /open-domus | `premium_05_living_accenti_senape` (OpenDomusPageContent.tsx:726) | **`villa-portico-tenda.jpg`** | `raffaela-founder` (:822), Contact |
| /servizi | `premium_03_cucina_moderna` (ServiziContent.tsx:228) | **`villa-angolo-piscina.jpg`** | oggi lo stesso render compare anche a :217: il cambio toglie un doppione esistente |
| /metodo | `hero_01_attico_travi_salotto` (MetodoContent.tsx:198) | **`villa-vetrata-lanterne.jpg`** (fermo 1.185) | atti del Metodo (ritratto, villa-mozart, handshake), Contact |
| /recensioni | `premium_01_living_tv_divano` (RecensioniContent.tsx:105) | **`villa-salotto-ombrellone.jpg`** (fermo 770) | FeaturedTestimonial, Contact |
| /privacy | `hero_01` (PrivacyContent.tsx:412) | **`villa-facciata-lettini.jpg`** (fermo 850) | nessuno |
| /cookie | `hero_01` (CookieContent.tsx:418) | `villa-uliveto.jpg` (fermo 660, da guardare) oppure invariato | nessuno |
| /chi-siamo | `hero_01` (ChiSiamoContent.tsx:250) | invariato: serve lo scatto della sede con insegna (§2.6); `raffaela-team-sede.jpg` ha il titolo cotto e `attico-tradate.jpg` è un render | Team, `villa-pool` (:267), `premio-top-agency` (:327) |
| /domande-frequenti | `consulenza.jpg` (FaqContent.tsx:223) | invariato | Contact |
| /lavora-con-noi | `consulenza.jpg` (LavoraConNoiContent.tsx:753) | invariato | `team-group` (:905) |
| /case/[slug] | nessuna PageHero | **nessun cambio** (pagina di conversione) | |

Regola di questa tabella: al più una foto della villa per pagina, ed è provvisoria finché arrivano le 9 foto chieste in §2.6. La banda di PageHero è l'LCP della pagina (`preload`, PageHero.tsx:120): i file da 2560 px passano dal loader come i render di oggi, stessa `sizes="100vw"` e `quality={60}`.

**Uliveto.** Come loop è sconsigliato: la camera si muove (SSIM 0,375 fra fotogrammi vicini) e la dissolvenza di 1 s sdoppia tronco e chioma. Se serve, usarlo come fermo (`villa-uliveto.jpg`).

### 8.8 Alt text (italiano; le altre quattro lingue nei rispettivi oggetti `copy`)
| File | alt |
|---|---|
| `villa-fronte-acqua.jpg` | Facciata di una villa contemporanea vista dal bordo della piscina, con l'acqua in primo piano |
| `villa-piscina-facciata.jpg` | Villa contemporanea con rivestimento color rame, piscina e lettini bianchi, alberi alti sulla destra |
| `villa-portico-tenda.jpg` | Portico con tenda da sole aperta e poltrone da esterno, una statua scura in primo piano e la piscina sullo sfondo |
| `villa-angolo-piscina.jpg` | Angolo della piscina con la facciata della villa a sinistra e una siepe alta con alberi a destra |
| `villa-lettini.jpg` | Due lettini bianchi sul bordo della piscina, dietro la villa con la tenda da sole |
| `villa-vetrata-lanterne.jpg` | Vetrata del soggiorno aperta sul portico, con due lanterne bianche sul muretto in pietra |
| `villa-salotto-ombrellone.jpg` | Divani bianchi da esterno sotto un ombrellone, fra un muro in pietra e la siepe |
| `villa-facciata-lettini.jpg` | Facciata della villa con il portico, i lettini bianchi e la piscina in primo piano |
| `villa-uliveto.jpg` | Giardino con ulivi, prato e un vialetto in pietra accanto alla casa |
| `congedo-drone-poster.jpg`, `acqua-poster.jpg`, i `<video>` | `alt=""` e `aria-hidden`: decorativi, la sezione ha il suo titolo (come Congedo.tsx:101 e :120) |

Test `app/lib/__tests__/media-file.test.ts` (nuovo): per ogni file in `public/images/reali/villa-*.jpg` e `public/media/*-poster.jpg`, `sharp(f).metadata()` non ha `exif`, `xmp` né `iptc`; nessun nome file in `public/` contiene «cima» o «tradate-via»; ogni percorso citato in `media.ts` esiste; `alt` non vuoto per ogni `villa-*` usata in una PageHero.

### 8.9 Codice da toccare per i media
- `app/lib/media.ts`: nuovo `ambient = { congedo: { webm1080, mp41080, webm720, mp4720, poster }, acqua: {...} }`. `heroCinematic.mp4` (media.ts:19) punta a `/media/congedo-drone-1080.mp4` e `webm` (:22) a `/media/congedo-drone-1080.webm`: il video dell'hero resta spento (`enabled: false`, :18) ma non punta più a un file cancellato.
- `Congedo.tsx`: scheda 7; commenti di :9-20 e :87-98 riscritti con chi ha chiesto cosa (A19 di Alberto) e com'è fatto oggi.
- Le 8 chiamate di PageHero della tabella 8.7 (solo `image` e `alt` nei 5 `copy`).
- `docs/hero-video.md`: il banner in cima con i file nuovi, la ricetta di 8.2-8.4 e le misure vere.
- DESIGN.md: :411 (l'ombra resta, il motivo delle tende bianche resta), :503 (nuova `sizes` del poster), :513-516 (1.32 → 1.30 e overscan), :559-560 (la banda: niente più scala 1.14, cartolina A19), :583 (i quattro punti di lettere su immagine restano quattro: la banda di congedo non cambia punto), :587 e :573 (li riscrive chi registra A18-A20). PRODUCT.md:166-171 (repertorio sostituito nelle bande).

### 8.10 Note per `docs/da-chiedere-alla-cliente.md`
**Sostituire il testo di 2.2** (docs/da-chiedere-alla-cliente.md:139-144):
> **2.2 La foto aerea del territorio in home — [BLOCCANTE]**
> Nel capitolo "Perché scegliere Domus Tua" il pannello sul territorio è illustrato con una ripresa da drone di una villa con giardino e piscina. Il 13 settembre abbiamo ricevuto l'originale in 4K del vostro video tour di quella villa, con il logo DomusTua Immobiliare impresso: la ripresa viene da lì, e i "watermark" che avevamo ritagliato erano il vostro logo. Sui diritti del file non ci serve altro. Resta una domanda: **il proprietario della villa ha autorizzato la pubblicazione sul sito** di riprese dall'alto, foto e video della casa? E l'immobile è ancora affidato a voi?
> *In alternativa (la strada più semplice):* una vera foto aerea del territorio di Tradate, orizzontale, minimo 2560 pixel sul lato lungo, di cui abbiate i diritti.
> *Collegata alla domanda a voce 21.*

**Sostituire il testo di 6.2** (:360-362):
> **6.2 Chi ha girato la clip aerea di chiusura — [BLOCCANTE]**
> La clip col drone che chiude la home viene dallo stesso video tour del punto 2.2, prodotto da Domus Tua. Ci serve solo una conferma scritta: l'avete girato voi o un videomaker per vostro conto, e in quel caso con quale accordo sui diritti. Per mostrare la villa vale l'autorizzazione del proprietario chiesta al punto 2.2.

**Chiudere 6.5** (:373-375):
> **6.5 Una versione della clip di chiusura senza logo — chiusa il 13 settembre.** Dall'originale in 4K il logo si toglie tagliando il 10 % in alto e a sinistra, senza ingrandire oltre la risoluzione del file: la clip non è più ingrandita del 14 % e l'inquadratura sotto la frase finale si può scegliere. Se preferite comunque un file nativo senza logo, lo usiamo al suo posto.

**Aggiungere 2.13**:
> **2.13 La licenza delle foto della villa — [BLOCCANTE]**
> Le cinque foto professionali della villa del video tour (portico con la tenda, facciata con la piscina, lettini) portano nei dati del file la firma del fotografo Davide Salerno. Ci servono: la licenza d'uso per il sito (per quanto tempo, se si possono ritagliare e animare, cioè aprire a finestra o ingrandire durante lo scorrimento); se va citato l'autore, e dove; la stessa autorizzazione del proprietario del punto 2.2. Nei file pubblicati togliamo i dati del file, compreso il contatto del fotografo: se la licenza chiede di mantenerli, ditecelo.

Nel punto 2.3 (liberatorie) nessuna aggiunta: nelle cinque foto e nei tratti usati del video non ci sono persone.

---

## 9. Voci di registro e domande

Da scrivere nella spec §11 (non in questa corsia, ma con queste parole):
- **A19** (Alberto, 13 set., «Sticky dove serve»): la cartolina del congedo come corridoio sticky da 1024 px con motion ok. Supera il commento «Niente GSAP» di Congedo.tsx:9-11 e la riga 4.15 della spec.
- **D nuova**: finestra del congedo sotto 1024 a `inset(4% 14%)` e `inset(4% 10%)` invece di 4 %/32 %, perché il d1 deve stare dentro la finestra.
- **D nuova**: `.dt-still-trim--top` 1.32 → 1.30 con overscan 10 % per la testimonianza; tetto 1,43 invariato.
- **D nuova**: scrub ed ease della rotaia del team resi unici (0.72, `dtRail`) per A20.
- **D nuova**: gesti di FeaturedTestimonial e Contact solo in home (`gesture`), `/case/[slug]` presidiata da un test.

Domande per Alberto (di forma, non di budget):
1. Territorio e congedo mostrano la stessa villa dallo stesso volo: cambio il fermo del territorio (drone sul quartiere) o accetti il doppione?
2. Services in home: la riga 1 con `villa-lettini.jpg` (quarta apparizione della villa) o resta il render finché arrivano le foto di §2.7?
3. Social: le righe che s'incastrano sono per te un comportamento diverso dai gradini di HorizonStory, o togliamo il gesto a Social?
4. Contact: l'assegnazione diceva «sale più lenta» e «ctn-up 10→−10», che in Era sale più veloce. Ho scelto il ritardo (−3,5 → +3,5): va bene?
