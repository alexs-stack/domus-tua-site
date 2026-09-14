# Corsia «sistema»: testo, tempi, uscite, inneschi, H1

2026-09-13. Base: A18 «Coreografia piena», A19 «Sticky dove serve», A20 «Fedeltà letterale» di Alberto (memoria domus-coreografia-era.md:13-16). A18-A20 superano C03 e il Don't di DESIGN.md:587: si registrano come direttive di Alberto e vanno girate alla cliente come domanda.

Le mappature idea-type.md e idea-timing.md sono scritte prima di A18-A20. Dove escludono per C03 (flip per lettera, lead a righe, uscite speculari, «nessuna sezione condivide») qui sono superate. Le condizioni tecniche restano e sono citate punto per punto.

---

## 0. Perimetro

Questa corsia decide:
- le grammatiche di testo e blocchi (accento, titolo, lead, blocco, riga) e la tendina rettangolare delle foto;
- un solo motore d'innesco per tutti i reveal;
- la regola degli H1 sopra la piega (14 pagine interne e la home);
- il lessico dei tempi in CSS e GSAP, e lo strato UI di transitions.dev;
- le API che le corsie dei capitoli usano: `RevealGroup`, `Reveal`, `SplitTitle`, `ScriptWord`, `Lead`, `Hairline`, `ClipMedia`, `useCorridor`, `useAmbientVideo`, `fold.ts`, `chapters.ts`;
- la guardia su /case/[slug];
- i test di sistema.

Non decide: il gesto di ogni capitolo, le corse dei corridoi, il preloader corto (corsia preloader), il monogramma (corsia feedback).

Vincoli di questa corsia:
- nessun testo nascosto in CSS: gli stati nascosti li scrive JS, oppure una regola che vale solo sotto l'attributo che mette lo script inline del layout (§1.8, §2);
- nessun blur (DESIGN.md:580): transitions.dev entra senza `--blur-*` e senza i `filter` dei suoi snippet;
- nessun pin di GSAP: corridoi = `position: sticky` + altezza del wrapper;
- opacity, mai autoAlpha, su tutto ciò che può contenere un link o un campo;
- /case/[slug] fermo (§6).

---

## 1. Le metafore del testo

### 1.1 I ruoli

Fonti: main.pretty.js:401-672 (animatori), :2858-2863 (costanti); catalogo §C5. In Era `html{font-size:1vw}` (README.md:34), quindi `x: "10rem"` vale 10vw.

| Ruolo | Dove | Split | Ingresso | Uscita |
|---|---|---|---|---|
| `accent` («a») | `.script-word`, una per capitolo, aria-hidden (DESIGN.md:586) | caratteri, nel server | from `opacity 0, rotateX 90, x 10vw`, origine `50% 100%` → `opacity 1, rotateX 0, x 0`; durL, stagger 0.1, dtOut (main.pretty.js:414-428) | `opacity 0, rotateX −90, x −10vw`, origine `50% 0%`; durS, stagger 0.05, dtIn (:431-441) |
| `title` («h») | h1-h4 display, titoli-copertina, lockup e H1 della home | parole + caratteri, nel server | from `opacity 0, yPercent 50, rotateY 90` → 0; durL, stagger 0.05, dtOut (:468-481) | `opacity 0, yPercent −50, rotateY −90`; durS, stagger 0.025, dtIn (:484-493) |
| `lead` («p») | `p.lead` | righe con maschera, SplitText nel client | `yPercent 110 → 0`; durL, stagger 0.1, dtOut (:521-530) | `yPercent −110`; durS, stagger 0.05, dtIn (:533-541) |
| `ctn` | eyebrow, paragrafi di corpo, blocchi con CTA, numeri | nessuno | `opacity 0, y var(--dt-ctn-y) → 0`; durL, dtOut (:550-586) | `opacity 0` sul posto; durS, dtIn, stagger 0.05 |
| `still` | card e tessere cliccabili (regola 2026-08-04, memoria domus-wow-layer.md:49) | nessuno | solo opacity; durL, dtOut | solo opacity; durS, dtIn |
| `line` | hairline, divisori | nessuno | asse y (Era): `inset(0 0 100% 0) → inset(0)`; asse x (hairline orizzontali, dove l'asse y su 1 px non si vede): `inset(0 100% 0 0) → inset(0)`; durL, dtOut (:588-618) | y: `inset(100% 0 0 0)`; x: `inset(0 0 0 100%)`; durS, dtIn |
| `curtain` | foto nei tre moduli media | nessuno | `clipClosed(from) → inset(0%)`; 2·durL = 2.4 s, dtOut, ritardo durM (catalogo §6c, JS:2653-2670) | `clipClosed(lato opposto)`; durS, dtIn |

- `--dt-ctn-y`: 3.333vw da 1024 px, 11.54vw sotto (Era 3.333rem da 992, 11.54rem sotto). Soglia `MQ.lg` del sito (gsap.ts:138), non 992: niente terza soglia. Valgono 48 px a 1440, 89 px a 768, 45 px a 390. La vecchia regola «mai oltre 60 px» (gsap.ts:103) cade con A20.
- Prospettiva: `accent` e `title` usano `transformPerspective: 800`. In css/ di Era non c'è nessuna perspective (idea-type.md:78), ma il sipario del preloader ruota le stesse lettere con `perspective(800px)` (globals.css:907-923, presidiato da intro-clocks.test.ts:319-321). Una sola rotazione nel sito, dal sipario ai titoli.

### 1.2 Regole comuni

1. **Tween nuovo a ogni passaggio**, come Era. Ingresso `gsap.fromTo(targets, from, { ...to, overwrite: true })`, uscita `gsap.to(targets, { ...out, overwrite: true })`. Nessun tween persistente riavviato con `restart()`: `overwrite: true` svuota un tween in pausa sugli stessi target (idea-timing.md:327; gsap-core.js:2405-2408, 2592-2594). Con tween nuovi l'ultimo comando vince, che è il comportamento voluto.
2. **Ritardo nel gruppo**: `delayDt.reveal + i × staggerDt` = 0.3 + i × 0.1 in ingresso, con `i` = posizione del `[data-reveal]` nel gruppo (Era: `delay (r ?? .3) + i*.1`, main.pretty.js:414-428). In uscita `i × 0.05`. **Tetto i = 5** (0.8 s in ingresso): FaqList scala 45 ms per voce (FaqList.tsx:28) e 20 domande arriverebbero a 2.3 s. Decisione di lavoro (D).
3. **Stagger per carattere con tetto**: `each = min(stagger, tetto / max(1, n − 1))`, tetto durL (1.2 s) in ingresso e durS (0.4 s) in uscita. Fino a 25 caratteri resta il 0.05 di Era; l'H1 della home («al prezzo giusto, nei tempi giusti.», 34 caratteri) scende a 0.036. Senza tetto un d2 da 45 caratteri spenderebbe 2.2 s di solo stagger. D.
4. **Solo transform, opacity, clip-path**. Nessun `will-change` in CSS su caratteri, righe o blocchi (misura di globals.css:1782-1789: 252 livelli, 432 MB). GSAP con `force3D: "auto"` promuove durante il tween e torna 2D alla fine. Via `.reveal:not(.is-in){will-change}` (globals.css:515-517).
5. **Mai `clearProps`** sui target di un gruppo che rigioca (memoria domus-wow-layer.md:49, regola 1).
6. **Stati nascosti di `ctn` e `still`**: `pointer-events: none`, con la rete `focusin` (§3.4).
7. **Overflow orizzontale**: `#main { overflow-x: clip }` (il nodo è layout.tsx:297). L'accento parte da x 10vw e la rotazione in prospettiva allarga i caratteri; un transform estende l'area scrollabile del documento e farebbe fallire mobile-motion.spec.ts:38-54 e home.spec.ts:219-227. `clip` non crea un contenitore di scroll, quindi gli sticky dei corridoi restano validi; `hidden` li romperebbe.

### 1.3 Chi spezza il testo: caratteri nel server, righe nel client

**Titoli e accento: `SplitChars`, reso nel server**, come l'hero di oggi (HeroCinematic.tsx:169-200).
- I caratteri non dipendono dalla larghezza: `autoSplit` serve alle righe, non alle lettere.
- Lo split esiste al primo paint: lo stato dipinto (§2) si applica ai caratteri senza mutare il DOM dopo l'idratazione e senza layout shift.
- Il cambio lingua è un render React: non serve la `key` di rimontaggio che TextLines usa perché SplitText stacca i nodi di testo (TextLines.tsx:55-57).
- SplitText esce da titoli e manifesto (HorizonScroller.tsx:38, :204-211, :517-524) e resta solo in `Lead`, registrato localmente come oggi (TextLines.tsx:15-17).

**Lead: SplitText nel client.** Opzioni: `type: "lines"`, `mask: "lines"`, `tag: "span"`, `linesClass: "dt-line"`, `aria: "none"`, `autoSplit: true`.
- Le righe dipendono da larghezza e font: autoSplit rifà lo split al resize e quando il font arriva, e richiama `onSplit` ogni volta (context7 /websites/gsap_v3, «onSplit»).
- `onSplit` non ritorna un tween (i tween li crea il motore): riporta le righe nuove allo stato del gruppo senza animare. shown → `yPercent 0`; hidden → `110`; un tween in corsa → il suo stato d'arrivo.
- Split dopo `Promise.race([document.fonts.ready, 3000 ms])`: con un font lento si spezza sul fallback e autoSplit rifà le righe all'arrivo.
- Cambio lingua: `key={locale}` più `dependencies: [locale]` con `revertOnUpdate` (TextLines.tsx:186-195; memoria domus-wow-layer.md:40).

### 1.4 Crenatura

Il problema: un carattere in un inline-block perde le coppie di kerning. La doc di GSAP propone `font-kerning: none` (context7, «Tips & Limitations»). L'hero lo subisce già oggi.

Scartato `font-kerning: none`: toglie il kerning anche ai titoli fermi (reduced-motion, no-JS), e il Playfair maiuscolo ha coppie che si vedono a 7rem (AV, LT, TA, «L’»).

**Decisione: compensazione misurata e congelata in una tabella.**
- `scripts/kern-table.ts` (Playwright, già nel repo) apre il build, prende la `font` calcolata di un titolo per ogni chiave, e misura su canvas a 100 px `kern(a,b) = w("ab") − w("a") − w("b")` con `ctx.fontKerning = "normal"`.
- Output `app/lib/motion/kern-table.json`: solo |k| ≥ 0.002 em, arrotondati a 0.001 em.
- Chiavi per ruolo, non per il nome hashato di next/font: `display-400`, `display-500`, `brand-800` (lockup, HeroCinematic.tsx:460), `script-400` (Pinyon).
- Glifi: maiuscole latine con gli accentati di it/fr/de/es, cifre, `’ ' « » - : ? ! & / , .`; per il Pinyon anche le minuscole.
- `SplitChars` scrive `--k: <k>em` sul carattere di sinistra della coppia; CSS `.dt-c { margin-inline-end: var(--k, 0em) }`. In em il valore segue i `clamp()` dei titoli senza rimisurare.
- Maiuscolo: se il tag ha `text-transform: uppercase` (h1-h4, DESIGN.md:566) la coppia si cerca su `toLocaleUpperCase(locale)`; «ß» si cerca come «SS».
- Accento: `padding-inline: 0.2em; margin-inline: -0.2em calc(-0.2em + var(--k, 0em))` sul carattere, come Era (06-initials-split.css:42-54): le aste del Pinyon escono dalla scatola e un livello composto su Safari può tagliarle.
- Quando cambia un font (globals.css:76-79 aspetta i font Adobe) la tabella si rigenera nello stesso commit.

Perché non a runtime: una misura dopo `fonts.ready` sposta i caratteri dopo il primo paint e può cambiare l'a capo (CLS). La tabella dà un primo paint già crenato, identico con JS, senza JS e con reduced-motion.

### 1.5 A capo nelle cinque lingue

- Ogni parola è `inline-block; white-space: nowrap`, e fra due parole resta uno spazio vero come nodo di testo (pattern di HeroCinematic.tsx:165-168 e :186-189). È l'equivalente di `smartWrap` (context7, «smartWrap»): l'a capo cade solo fra parole.
- Lo split è lo stesso con JS, senza JS e con reduced-motion, quindi le righe non cambiano fra i tre stati.
- `text-wrap: balance` (`.balance`, globals.css:488-490) lavora anche sugli atomi inline.
- Rischio: una parola tedesca lunga in una colonna stretta. Senza `hyphens` oggi non va a capo neppure il testo intero; lo split non peggiora, ma va provato: la rete anti-traboccamento (mobile-motion.spec.ts:27-55) gira anche con `dt_locale=de` e `fr` su `/`, `/vendi`, `/metodo` (§7).

### 1.6 Accessibilità

- **Heading (h1-h4) col ruolo title**: `aria-label` col testo piano sul tag; parole e caratteri in uno span `aria-hidden`. Il `textContent` resta la frase intera (parole separate da spazi veri): motori e «trova nella pagina» leggono il testo una volta. È la strategia `aria: "auto"` di SplitText (context7, «Built-in Aria»).
- **Title su un tag non heading** (Team.tsx:183 usa `as="p"`): `aria-label` su `p` e `blockquote` è vietato (axe `aria-prohibited-attr`, lo ricorda TextLines.tsx:82-85). Si rende uno `sr-only` col testo e lo split `aria-hidden`, come HeroCinematic.tsx:461-465 e :499-502.
- Nessun elemento interattivo dentro un title: `SplitChars` lo rifiuta in sviluppo (aria-hidden nasconderebbe il link, context7 «Nested element accessibility limitation»).
- **Accento**: già `aria-hidden`, nessun label.
- **Lead**: `aria: "none"`, il testo resta nelle righe, parole intere.
- Dopo l'armamento lo stato nascosto è opacity 0, non 0.02: axe salta l'opacity 0 ma misurerebbe il contrasto di un testo a 0.02.

### 1.7 Nodi e budget

- Un title di n caratteri e w parole aggiunge n + w + 1 elementi. Il manifesto di oggi ne fa circa 68 (HorizonScroller.tsx:175-185).
- Nessun livello permanente (§1.2 punto 4).
- Ordine di grandezza sulla home: una ventina di titoli da 20-45 caratteri, meno di 1.500 nodi. Il numero vero lo fissa il primo run del test (§7): conta `[data-c]` dopo una passata intera a 1440 e fallisce oltre il +20 %.
- Contemporaneità: al massimo due gruppi in movimento per schermata; un gruppo che entra mentre il precedente esce non condivide target, nessun conflitto.
- Misura prima/dopo con Playwright headless, CPU ×4: `querySelectorAll("*").length`, livelli composti durante una passata, long task all'ingresso di un d1.

### 1.8 Mai stato nascosto in CSS

- Oggi `.reveal` parte a opacity 0 in CSS (globals.css:508-512) e si riapre solo con `@media (scripting: none)` (:526-532): con JS lento eyebrow e lead delle pagine interne compaiono solo all'idratazione.
- Regola nuova: l'unico stato prima del JS è quello **dipinto a 0.02**, e solo sotto `:root[data-hero-intro]`. Lo script inline lo mette a ogni rotta quando c'è motion ok (layout.tsx:102, ramo `if(m){…}`); nessuno lo toglie (grep di `removeAttribute("data-hero-intro")` vuoto). Senza JS l'attributo non esiste e il testo è pieno.
- Da JS in poi ogni gruppo porta `data-reveal-armed` e gli stati li scrive il motore.

---

## 2. H1 sopra la piega e la home

### 2.1 Dove

- 11 PageHero (PageHero.tsx:83-89): acquista, chi-siamo, cookie, domande-frequenti, lavora-con-noi, metodo, open-domus, privacy, recensioni, servizi, vendi;
- /contatti (ContattiContent.tsx:138), /case-vendute (CaseVenduteContent.tsx:210-216), /valutazione-immobile-tradate (ValutazioneContent.tsx:351-356);
- la home: lockup e H1 dell'hero (HeroCinematic.tsx:460-466, :499-503).

Oggi le 14 interne passano per TextLines: HTML dipinto, poi dopo `fonts.ready` le righe vanno a yPercent 112 e risalgono (TextLines.tsx:76, :100-117). È il lampo visibile → nascosto → visibile (idea-type.md:49). La home non ce l'ha: dipinge le lettere a 0.02 prima del paint (globals.css:1175-1184; HeroCinematic.tsx:253).

### 2.2 La regola

**1. Prima del paint.** La CSS dipinge ogni `[data-reveal]` non armato a 0.02, con una rete:

```css
:root[data-hero-intro] [data-reveal]:not([data-reveal-armed]) {
  opacity: var(--dt-painted);
  animation: dt-reveal-failsafe 0.5s ease 6s forwards;
}
:root[data-hero-intro="intro"] [data-reveal]:not([data-reveal-armed]) {
  animation-delay: 3.33s;
}
@keyframes dt-reveal-failsafe { to { opacity: 1; } }
```

- 0.02 e non 0: a opacity 0 Chromium toglie l'elemento dai candidati LCP (memoria domus-wow-layer.md:23). Col testo dipinto l'LCP resta il primo paint.
- `:root[…]` e non `html[…]`: intro-clocks.test.ts:264-270 cerca con `indexOf` la PRIMA occorrenza di `html[data-hero-intro="intro"]` e pretende il delay entro 260 caratteri. Un nuovo `html[…]` scritto prima di globals.css:1182 lo romperebbe.
- Keyframe nuova `dt-reveal-failsafe`: intro-clocks.test.ts:251-252 conta esattamente quattro `dt-rest-failsafe`.
- 6 s = `HERO_REST_WARM_MS`, 3.33 s = `HERO_REST_MS` (intro-constants.ts:139, :150). Se la corsia preloader aggiunge la corta su ogni rotta (`data-hero-intro="short"`), aggiunge qui il suo delay e lo presidia nel suo test.

**2. All'armamento** (layout effect, quindi prima del paint del commit), per i gruppi in viewport: caratteri o righe allo stato di partenza del ruolo (opacity 0), contenitore con `opacity: 1; animation: none` inline e `data-reveal-armed`, nello stesso task. Nessun fotogramma intermedio: prima il contenitore a 0.02, poi i caratteri a 0.

**3. Quando parte l'ingresso.**
- Con un sipario in corso (`html[data-preloader]`, film intero o corto): all'handoff `INTRO_EVENT`, mentre la porta si apre. Se l'evento è già passato, `hasIntroFired()`; rete a `HERO_REST_MS` (stessa logica di HeroCinematic.tsx:314-333).
- Senza sipario (ricarica senza corta, navigazione client, ancora): 150 ms dopo l'armamento (HeroCinematic.tsx:336), per non competere col primo paint.

**4. Rete già scattata.** Se il JS arriva dopo la rete CSS (telefono lento, HeroCinematic.tsx:121-135), l'ingresso non si rifà: `foldNetFired(el)` legge `currentTime` di `dt-reveal-failsafe` con la tecnica di `heroNetFired` (HeroCinematic.tsx:136-156), spostata in `app/lib/motion/fold.ts`. Il gruppo nasce shown.

**5. Lead sopra la piega.** Resta non armato (0.02 con la rete CSS) finché SplitText non ha spezzato; poi si arma come al punto 2. Se la rete scatta prima dello split, nasce shown.

**6. LCP.**
- PageHero: il candidato è la foto con `preload` (PageHero.tsx:120; image.md:265-293 in node_modules/next/dist/docs). Il tuffo sticky che la scala è della corsia PageHero.
- /contatti, /case-vendute, /valutazione: il candidato probabile è H1 o lead; col testo dipinto il timestamp resta il primo paint. Da misurare (§7): LCP con motion ok ≤ LCP con reduce + 100 ms, stessa macchina.

**7. Reduced-motion.** Il boot script non mette l'attributo: niente stato dipinto, niente armamento, pagina piena e ferma. Se la preferenza cambia a pagina aperta, il `matchMedia` del motore toglie stili inline e `data-reveal-armed`.

### 2.3 La home

- Lockup, firma e H1 restano resi nel server con gli attributi di oggi (`data-hero-char/schar/tchar`, letti da mobile-motion.spec.ts:212 e :1185), più `data-reveal="title"` (lockup, H1) e `data-reveal="accent"` (firma).
- Il loro stato dipinto resta la regola di globals.css:1178-1184, già presidiata.
- La timeline dell'hero passa ai ruoli: from/to del §1.1, durL, stagger col tetto. Ritardi dall'ordine nel gruppo: lockup 0.3 s, firma 0.4 s, H1 0.5 s. Oggi 0.2 / 0.85 / 0.7 s con 1.4 s e stagger 0.08 / 0.07 / 0.032 (HeroCinematic.tsx:279-311). Cambia in modo visibile: lo mostra la corsia hero.
- Il patto della porta non si tocca: i transform stanno sui caratteri, mai sulla banda (intro-clocks.test.ts:423-432).

---

## 3. Inneschi: un solo motore

### 3.1 Perché IntersectionObserver

- ScrollTrigger in fondo alla home arrivava sfasato sotto le corse lunghe (memoria domus-motion-architecture.md:26); Reveal.tsx:34-44 usa un IO per questo.
- Una toggleAction `restart` riporta le righe a nascoste alla creazione se lo scroll ha già passato lo start, e annulla un `progress(1)` scritto prima (idea-type.md:159-162).
- Un IO misura la geometria resa, transform compresi: funziona dentro il nastro di HorizonScroller senza `containerAnimation` (idea-type.md:138).

### 3.2 Semantica

Un IO condiviso per la pagina, `threshold: 0`, `rootMargin: "0px"`: è l'innesco «top bottom» di Era (main.pretty.js:908-917). Stati per gruppo: `hidden`, `revealing`, `shown`, `hiding`.

```ts
// app/lib/motion/reveal-engine.ts
export function decide(e: Box & { hit: boolean }, root: Box, s: GroupState): "in" | "out" | null {
  if (e.hit) return s === "hidden" || s === "hiding" ? "in" : null;
  // fuori, e davanti (sotto o a destra): non ancora visto
  if (e.top >= root.bottom || e.left >= root.right) return s === "shown" || s === "revealing" ? "out" : null;
  return null; // uscito dall'alto o da sinistra: resta com'è
}
```

- Entra dal basso: ingresso.
- Esce dal basso (si risale): uscita speculare, più rapida (§1.1).
- Esce dall'alto: niente. Rientra dall'alto: niente, è ancora shown.
- Sull'asse x vale la stessa funzione senza configurazione: nel nastro orizzontale «a destra» equivale a «sotto». L'IO ritaglia sugli antenati con overflow, quindi lo schermo sticky del nastro conta.
- `root` = `entry.rootBounds`, o `innerWidth × innerHeight` se è null.

### 3.3 Armamento

In layout effect, per ogni gruppo:
- già passato (`bottom <= 0` o `right <= 0`): shown subito, senza animare. Copre l'ancora nell'URL e lo scroll ripristinato: senza, «nulla dall'alto» lascerebbe nascosto un titolo sopra il punto d'arrivo;
- in viewport: §2.2 (sipario o 150 ms);
- sotto o a destra: hidden; decide la prima notifica dell'IO.

### 3.4 Reti

- **Rete guardata a 2500 ms dall'armamento**: un gruppo ancora hidden con `top < innerHeight && bottom > 0` entra; uno hidden già passato diventa shown. Mai su gruppi sotto la piega (il difetto di Reveal.tsx:44, idea-timing.md:95-98, corretto in HorizonScroller.tsx:149-161).
- **`sweep()`** con le stesse regole: sull'evento `refresh` di ScrollTrigger, al resize (debounce 150 ms), a `visibilitychange` visibile.
- **`focusin`** in un gruppo non shown: shown subito (schema di HorizonScroller.tsx:471-477).

### 3.5 Gruppi manuali

`trigger="manual"`: il gruppo non è osservato e riceve `play("in" | "out")` dal set piece.
- Il titolo di StarReviews, che deve arrivare col beat finale dello scrub (StarReviews.tsx:704-712; idea-type.md:135).
- I testi di un corridoio agganciati a un punto della timeline (`cues` di useCorridor, §5.6).

### 3.6 HorizonScroller

- I reveal `enter` e `track` (HorizonScroller.tsx:481-504) diventano gruppi del motore. `track` non ha più bisogno di `containerAnimation`.
- `enter` («pannello già in vista al pin», HorizonScroller.tsx:11) diventa gruppo manuale, con un cue a «top 70%» della radice come oggi (:487).
- Il manifesto (`data-horizon-reveal="chars"`, HorizonStory.tsx:251) diventa `SplitTitle`: stagger da 0.03 (HorizonScroller.tsx:544) al ruolo title. È il set piece di A12: il cambio si mostra ad Alberto.
- Sotto 1024 il ramo colonna non ha più trigger propri per i testi (:124-265): stesso motore.

### 3.7 Cosa resta su ScrollTrigger

Solo lo scrub: corridoi, nastri, parallasse. Nessun reveal di testo.

---

## 4. Il lessico dei tempi

### 4.1 Tabella unica

Regola dei nomi: CSS `--dur-dt-<k>` ↔ GSAP `durDt.<k>`; CSS `--ease-dt-<kebab>` ↔ GSAP `"dt<Pascal>"`; `--stagger-dt` ↔ `staggerDt`; `--delay-dt-reveal` ↔ `delayDt.reveal`.

| Era | CSS | GSAP | Valore | Fonte | Stato oggi |
|---|---|---|---|---|---|
| durS | `--dur-dt-s` | `durDt.s` | 0.4 s | main.pretty.js:2858 | nuovo |
| durM | `--dur-dt-m` | `durDt.m` | 0.8 s | :2859 | nuovo |
| durL | `--dur-dt-l` | `durDt.l` | 1.2 s | :2860 | nuovo |
| stagger | `--stagger-dt` | `staggerDt` | 0.1 s | :2861 | nuovo |
| delayReveal | `--delay-dt-reveal` | `delayDt.reveal` | 0.3 s | :2862 | nuovo |
| Out | `--ease-dt-out` | `"dtOut"` | 0.25,1,0.5,1 | :2863 | GSAP c'è (gsap.ts:73), CSS nuovo |
| In | `--ease-dt-in` | `"dtIn"` | 0.5,0,0.75,0 | :2863 | nuovo |
| InOut | `--ease-dt-in-out` | `"dtInOut"` | 0.75,0,0.25,1 | :2863 (la CSS di Era scrive 0.76,0,0.24,1: si usa il valore JS da tutt'e due le parti) | nuovo |
| Ease | `--ease-dt-ease` | `"dtEase"` | 0.25,0.1,0.25,1 | :2863; è la parola chiave CSS `ease` | nuovo |
| diveIn | `--ease-dt-dive-in` | `"dtDiveIn"` | 0.6,0,0,1 | :2863 | GSAP c'è (gsap.ts:72) |
| horScroll | `--ease-dt-hor-scroll` | `"dtHorScroll"` | 0.25,0,0.75,1 | :2863 | GSAP c'è (gsap.ts:78) |
| loaderEase | nessuna: la CSS usa `linear()` (globals.css:1093-1111) | `"dtLoader"` | path a cinque segmenti | JS:24 | invariato (gsap.ts:79-82) |
| (stato dipinto) | `--dt-painted` | `painted` | 0.02 | HeroCinematic.tsx:253 | nuovo |
| (corsa ctn) | `--dt-ctn-y` | `ctnY()` | 3.333vw ≥ 1024, 11.54vw sotto | main.pretty.js:550-586 | nuovo |

- CustomEase nuove una per riga, `CustomEase.create("dtIn", "0.5,0,0.75,0");`: la regex di intro-clocks.test.ts:73 legge questa forma.
- Nessun token senza consumatore nello stesso commit (condizione di idea-timing.md:221): `dtIn` entra con le uscite, `dtInOut` e `dtEase` con i primi consumatori (§4.4, firme di capitolo).

### 4.2 Riconciliazione

- **Non si rinominano** `domus.inOut`, `dtOut`, `dtDiveIn` (intro-clocks.test.ts:73, :187-188, :219, :224, :304). `dtOut` diventa la «Out» di tutto il sito.
- `"domus"` resta ai consumatori di sezione e UI che ce l'hanno (HorizonScroller.tsx:134 e :464, ContattiContent.tsx:106, RotatingMark.tsx:75 e :80, link-draw globals.css:685) finché le corsie non li migrano. Nessun testo la usa più.
- `expo.out` 1.05 s di TextLines (TextLines.tsx:103-104) e `--ease-out-expo` 0.9 s di `.reveal` (globals.css:511) diventano dtOut con durL. DESIGN.md:496 si riscrive.
- `dur.hero` 1.4 muore con la migrazione dell'hero. `dur.reveal` 0.9 resta al blocco congelato di /case/[slug] (§6). `dur.transition` 1.1 resta a RotatingMark.tsx:80 finché decide la corsia feedback (Era: 1.2 Out, idea-timing.md:170).
- Via `stagger.words`, `stagger.lines`, `dist.*` (nessun consumatore, idea-timing.md:10-11); `stagger.chars` muore con lo split del manifesto.
- CSS: restano `--ease-out-expo` (link-underline), `--ease-soft` (PropertyGallery.tsx:325, congelato), `--ease-domus`, `--dur-micro` (globals.css:609). Via `--dur-short/reveal/hero/transition` (globals.css:171-174), che nessuno legge.
- Dove vivono i token nuovi:
  - `--ease-dt-*` in `@theme`: generano le utility `ease-dt-out` ecc.;
  - `--dur-dt-*`, `--stagger-dt`, `--delay-dt-reveal`, `--dt-painted`, `--dt-ctn-y` in un `:root` fuori da `@theme`: non sono un namespace di Tailwind e li legge anche JS.
- **Collisione con Tailwind 4**: `--ease-in`, `--ease-out`, `--ease-in-out` sono di serie (node_modules/tailwindcss/theme.css:434-436) e pilotano le utility omonime. Il prefisso `dt-` è obbligatorio, e per la stessa ragione non si installano `--ease-in-out` ed `--ease-out` di transitions.dev (_root.css:19-20).

### 4.3 Firme di capitolo (A20)

A20: due capitoli della home non condividono ease, durata né range di trigger. Le metafore del testo invece sono identiche ovunque. Le due regole stanno insieme se si tengono separate.
- Testo e UI: lessico chiuso del §4.1.
- Gesto di capitolo: registro `app/lib/motion/chapters.ts`, una voce per capitolo `{ id, ease, scrub | dur, start, end }`. Ogni corsia legge la firma dal registro, non la scrive al punto di chiamata.
- Ease ammesse nelle firme: quelle del lessico, `"none"` e le famiglie di serie di GSAP (`power1-4.in/out/inOut`, `sine`, `expo`, `circ`). Con le sole sette ease del lessico diciassette capitoli non potrebbero averne una diversa ciascuno.
- `chapters.test.ts` fallisce se due voci condividono l'ease, lo scrub o la durata, o la coppia start/end.

### 4.4 Lo strato UI di transitions.dev

**Cosa si installa**, in un `:root` fuori da `@theme`, solo coi consumatori:
- durate `--duration-micro` 80ms, `--duration-quick` 150ms, `--duration-fast` 250ms, `--duration-medium` 350ms, `--duration-slow` 400ms (SKILL.md:130-138);
- `--ease-smooth-out: cubic-bezier(0.22, 1, 0.36, 1)` (SKILL.md:144);
- `--distance-medium` 12px, `--scale-small` .98, `--scale-medium` .97, `--scale-tiny` .99 (SKILL.md:155-168).

**Cosa non si installa**: `--blur-small/medium/large` e ogni `--*-blur` (DESIGN.md:580); `--ease-bounce*` (il sito si muove per attenuazione, globals.css:570-578); `--ease-in-out` ed `--ease-out` (§4.2).

**Regola dell'uscita**: una superficie UI si chiude più in fretta di come si apre. Dropdown 250 → 150 ms, pannello 400 → 350 ms, tooltip 150 ms (+80 di attesa) → 50 ms, accordion 250 → 150 ms.

**Snippet**, col blocco reduced-motion di ognuno (SKILL.md:193):

1. **Tooltip dei social** (17-tooltip.md) su `.dt-social__tip` (globals.css:1623-1656; markup SocialLinks.tsx:28-37). Del snippet si prendono tempi, scala e attesa solo in ingresso. Restano il quadrato rosso, raggio 0 e nessuna ombra.
   ```css
   :root { --tt-in-dur: var(--duration-quick); --tt-out-dur: 50ms; --tt-delay: var(--duration-micro); --tt-scale: var(--scale-small); }
   .dt-social__tip { translate: -50% 0; transform: scale(var(--tt-scale)); transform-origin: 50% 100%; opacity: 0;
     transition: opacity var(--tt-out-dur) ease-out, transform var(--tt-out-dur) ease-out; }
   .dt-social__link:hover .dt-social__tip,
   .dt-social__link:focus-visible .dt-social__tip { opacity: 1; transform: scale(1);
     transition-duration: var(--tt-in-dur); transition-timing-function: ease-out; transition-delay: var(--tt-delay); }
   @media (prefers-reduced-motion: reduce) { .dt-social__tip { transition: none !important; } }
   ```
   Il tip è figlio del link: il puntatore che ci passa sopra tiene l'hover, che è la condizione del snippet.

2. **Menu del telefono** (07-panel-reveal.md) su `#mobile-menu` (Header.tsx:277-283), senza `filter`:
   ```css
   :root { --panel-open-dur: var(--duration-slow); --panel-close-dur: var(--duration-medium);
     --panel-translate-y: var(--distance-medium); --panel-ease: var(--ease-smooth-out); }
   .t-panel-slide { transform: translateY(var(--panel-translate-y)); opacity: 0; pointer-events: none;
     transition: transform var(--panel-close-dur) var(--panel-ease), opacity var(--panel-close-dur) var(--panel-ease);
     will-change: transform, opacity; }
   .t-panel-slide[data-open="true"] { transform: translateY(0); opacity: 1; pointer-events: auto;
     transition: transform var(--panel-open-dur) var(--panel-ease), opacity var(--panel-open-dur) var(--panel-ease); }
   @media (prefers-reduced-motion: reduce) { .t-panel-slide { transition: none !important; } }
   ```
   - Lo stato chiuso resta `hidden` (fuori dal DOM accessibile, Header.tsx:266-267). Apertura: `hidden = false`, `data-open="false"`, reflow, `data-open="true"`. Chiusura: `data-open="false"`, poi `hidden = true` dopo `--panel-close-dur` letto da `getComputedStyle` (0 con reduced-motion).
   - Il commento «Nessuna coreografia» (Header.tsx:267-268) e DESIGN.md:491 si riscrivono come richiesta di Alberto (13 settembre).

3. **Lingua** (05-menu-dropdown.md) su LanguageSwitcher.tsx:56-61, `data-origin="top-right"`. CSS del snippet invariata con `--dropdown-open-dur: var(--duration-fast)`, `--dropdown-close-dur: var(--duration-quick)`, `--dropdown-pre-scale: var(--scale-medium)`, `--dropdown-closing-scale: var(--scale-tiny)`, `--dropdown-ease: var(--ease-smooth-out)`. In più `.t-dropdown:not(.is-open):not(.is-closing) { visibility: hidden }`: la lista chiusa resta fuori dal Tab come oggi con `invisible` (:60). Qui `visibility` è giusta: è UI chiusa, non uno stato di reveal.

4. **Accordion** (21-accordion.md) su FaqList.tsx:29-51, sulla FAQ di LavoraConNoiContent.tsx:976-980 e su OpenDomusPageContent.tsx:911-940.
   - Struttura `details.t-acc > summary.t-acc-head + .t-acc-panel > .t-acc-panel-inner > p`; padding solo sull'inner (SKILL.md:210). Via il `filter` di `.t-acc-panel-inner`.
   - `<details>` resta: si apre senza JS e il testo sta nell'HTML (FaqList.tsx:6-9). Con JS il click sul summary fa `preventDefault`: in apertura `open = true`, al frame dopo `data-open="true"`; in chiusura `data-open="false"`, poi `open = false` dopo `--acc-collapse`. L'evento `toggle` (per esempio da «trova nella pagina») riallinea `data-open`.
   - Senza JS non c'è `data-open`: `.t-acc:not([data-open]) .t-acc-panel { grid-template-rows: 1fr }`.
   - `--acc-expand: var(--duration-fast)`, `--acc-collapse: var(--duration-quick)`, `--acc-chevron: var(--duration-fast)`, `--acc-ease: var(--ease-smooth-out)`. Il «+» ruota di 45° come oggi (FaqList.tsx:43): è simmetrico, lo `scaleY` del snippet non serve.
   - A `transitionend` di `grid-template-rows`: `requestRefresh()` (§5.9). L'altezza della pagina cambia sopra i trigger scrubbati (memoria domus-wow-layer.md:41).

### 4.5 Tabella «transitions refine»

Esclusi app/case/[slug], PropertyGallery e PropertyCard (§6). Utility nuova `transition-ui` (Tailwind `@utility`): `transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke; transition-duration: var(--duration-fast); transition-timing-function: var(--ease-dt-ease)`.

| Dove | Oggi | Uso | Token |
|---|---|---|---|
| globals.css:1457-1460 `.dt-btn` | colori 0.25s `ease` | hover di colore | `var(--duration-fast) var(--ease-dt-ease)`: valore identico |
| globals.css:1608-1611 `.dt-social__link` | colori 0.25s `ease` | hover di colore | come sopra |
| globals.css:1612-1613 `.dt-social__link` | `translate .3s ease`, `box-shadow .3s domus` | cambio di posizione | `var(--duration-fast) var(--ease-smooth-out)` |
| globals.css:1639 `.dt-social__tip` | `translate .3s ease, opacity .25s ease` | tooltip | snippet 17 |
| globals.css:653 `.link-underline` | `background-size .4s out-expo, color .3s ease` | sottolineatura disegnata: nessun uso in transitions.dev | background-size resta; color → `var(--duration-fast) var(--ease-dt-ease)` |
| globals.css:685 `.link-draw::after` | `transform .35s domus` | come sopra | resta |
| Header.tsx:202 | `transition-colors duration-300`, ease di serie (theme.css:493) | cambio di stato della barra | `transition-ui` (0.3 → 0.25 s; DESIGN.md:490 da aggiornare) |
| Header.tsx:240 | `transition-[text-decoration-color] duration-200` | nessuno: `hover:underline` accende `text-decoration-line`, che non si interpola | via |
| Header.tsx:277-283 | nessuna, `hidden` | pannello | snippet 07 |
| LanguageSwitcher.tsx:59-61 | `transition-opacity duration-200` + `invisible` | dropdown | snippet 05 |
| LanguageSwitcher.tsx:50, :73 | `transition-colors` | hover di colore | `transition-ui` |
| FaqList.tsx:39, :43 | colori 300; rotate 300 | accordion | snippet 21 |
| LavoraConNoiContent.tsx:976, :980 | colori 300; rotate 300 | accordion | snippet 21 |
| OpenDomusPageContent.tsx:913, :919, :936 | colori 300; rotate 300; `grid transition-all 300 ease-[cubic-bezier(0.32,0.72,0,1)]` | accordion | snippet 21 |
| MobileActionBar.tsx:88 | `transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]` | barra che entra ed esce | `transition-[transform,opacity]`, ingresso `--duration-slow`, uscita `--duration-medium`, `--ease-smooth-out` |
| WhatsAppFloat.tsx:26 | idem | idem | idem |
| Assistant.tsx:437, :686 | `transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]` | colore e scala al passaggio | `transition-[background-color,transform] duration-(--duration-fast) ease-(--ease-smooth-out)` |
| PropertySearch.tsx:754 | idem | idem | idem |
| FaqContent.tsx:265 | `transition-[width,opacity] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]` | indicatore che scorre | `duration-(--duration-fast) ease-(--ease-smooth-out)` |
| Voci.tsx:126 | `transition-colors duration-300` | hover di colore | `transition-ui` |
| Voci.tsx:229, FeaturedTestimonial.tsx:145, LazyYouTubeEmbed.tsx:90, OpenDomusPageContent.tsx:828 | `transition-transform duration-300`, scala 1.05 / 1.10 | enfasi al passaggio | `duration-(--duration-fast) ease-(--ease-smooth-out)` (DESIGN.md:509: 0.3 → 0.25 s) |
| LazyYouTubeEmbed.tsx:59, OpenDomusPageContent.tsx:826 | `duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]` | zoom al passaggio | `duration-(--dur-dt-l) ease-(--ease-dt-out)`: 1.2 s identico, curva Out (Era card durL Out, 04-components-hover.css:79-94) |
| CaseVenduteContent.tsx:291 | `duration-700 ease-soft` | zoom al passaggio | idem (0.7 → 1.2 s) |
| ContattiContent.tsx:175, ChiSiamoContent.tsx:310, FaqTeaser.tsx:80, FaqContent.tsx:297 e :304, PropertySearch.tsx:987, CareerApplication.tsx:514 | freccia `transition-transform duration-300` | spostamento | `duration-(--duration-fast) ease-(--ease-smooth-out)` |
| ContattiContent.tsx:172; ChiSiamoContent.tsx:307, :345; FaqTeaser.tsx:77; FaqContent.tsx:256, :272, :294, :301; CaseVenduteContent.tsx:311; Reviews.tsx:265; BeforeAfter.tsx:304; CareerApplication.tsx:506; PropertyMap.tsx:181; PropertySearch.tsx:712, :924, :934, :944, :953, :974; VideoLightbox.tsx:136; CaseQuickLook.tsx:261; Assistant.tsx:488, :496, :537, :598, :628, :644, :657, :693 | `transition-colors` 200/300 o di serie | hover di colore | `transition-ui` |
| PropertySearch.tsx:849, :865, :881 | `transition-colors` al focus | campo di ricerca | `transition-ui` |
| RailProgress.tsx:165 | `transition-opacity duration-500` | stato | resta: nessun uso corrispondente |
| Contact.tsx:797, :1046; CareerApplication.tsx:695, :735, :775 | `transition-colors` | campi dei form | restano: i form lead non si toccano |
| PropertyCard.tsx:131, :139, :161 | 1600 ms; `transition-all 300` | card | restano: la card è resa in /case/[slug] (PropertyDetail.tsx:625) |
| PropertyGallery.tsx:42, :75, :315, :325; app/case/[slug]/* | varie | pagina di conversione | restano (§6) |

Dopo la tabella non resta nessun `ease-[cubic-bezier(` in app/**/*.tsx fuori dalla guardia: le 11 copie contate in idea-timing.md:222-223 meno PropertyCard.tsx:131 e PropertyGallery.tsx:42, che restano congelate.

---

## 5. API delle primitive

### 5.1 File

| File | Tipo | Contenuto |
|---|---|---|
| `app/lib/motion/gsap.ts` | modifica | `durDt`, `staggerDt`, `delayDt`, `painted`, `ctnY()`; CustomEase `dtIn`, `dtInOut`, `dtEase`; `MQ.corridor`; `requestRefresh()`; via token morti |
| `app/lib/motion/text-roles.ts` | nuovo | tabella `ROLES` del §1.1, `staggerEach()`, `groupDelay()`, `tweenIn/tweenOut/setHidden/setShown` |
| `app/lib/motion/reveal-engine.ts` | nuovo | IO condiviso, `decide()`, armamento, reti, `sweep()`, `play()` |
| `app/lib/motion/fold.ts` | nuovo | `curtainPending()`, `afterCurtain()`, `foldNetFired()` |
| `app/lib/motion/kern.ts` + `kern-table.json` | nuovo | lettura della tabella; `scripts/kern-table.ts` la genera |
| `app/lib/motion/clip.ts` | nuovo | `clipOpen`, `clipClosed()`, `clipFrame()`, `clipSlant()`, `assertStraight()` |
| `app/lib/motion/chapters.ts` | nuovo | registro delle firme di capitolo (§4.3) |
| `app/components/motion/RevealGroup.tsx` | nuovo, client | gruppo, contesto, registrazione |
| `app/components/Reveal.tsx` | riscritto, client | ruolo `ctn` / `still` |
| `app/components/motion/SplitChars.tsx` | nuovo, puro | parole e caratteri col kerning |
| `app/components/motion/SplitTitle.tsx`, `ScriptWord.tsx` | nuovi, client | ruoli title e accent |
| `app/components/motion/Lead.tsx` | nuovo, client | ruolo lead (unico import di SplitText) |
| `app/components/motion/Hairline.tsx`, `ClipMedia.tsx` | nuovi | ruoli line e curtain |
| `app/components/motion/useCorridor.ts` | nuovo | corridoi sticky |
| `app/components/motion/useAmbientVideo.ts` | nuovo | video d'ambiente |
| `app/components/motion/MotionFreeze.tsx` | nuovo | guardia di /case/[slug] (§6) |
| `app/components/motion/TextLines.tsx` | rimosso | alias di `SplitTitle` per un commit, poi via |

### 5.2 `RevealGroup` e `Reveal`

```tsx
type RevealGroupProps = {
  as?: ElementType;
  className?: string;
  id?: string;
  children: ReactNode;
  /** "io" (default): il motore osserva il gruppo. "manual": lo pilota il set piece. */
  trigger?: "io" | "manual";
  /** Solo con trigger="manual": riceve i comandi del gruppo. */
  onReady?: (api: { play(dir: "in" | "out", o?: { instant?: boolean }): void }) => void;
};
```

- Markup: `<Tag data-reveal-group data-reveal-trigger="io">`. I figli portano `data-reveal="<ruolo>"`; il motore li trova con `querySelectorAll` dentro il gruppo (esclusi i gruppi annidati) e ne legge l'ordine per i ritardi.
- I figli possono essere server component: PageHero resta senza `"use client"` (PageHero.tsx:29) e avvolge la testa in un `RevealGroup`.
- Registrazione in `useGSAP` con `revertOnUpdate` e `dependencies: [locale]`: al cambio lingua i nodi nuovi ricevono lo stato corrente del gruppo, senza animare.
- `Reveal`: `<Reveal role="ctn" | "still" as className>`. Dentro un `RevealGroup` è un figlio; fuori crea un gruppo di sé. La prop `delay` in ms resta per un commit come scarto aggiunto, con un avviso in sviluppo; poi via (i ritardi li dà l'ordine, §1.2).
- CSS del ruolo `ctn` (dopo globals.css:436, così lo slice di moduli-media.test.ts non cambia):

```css
.reveal[data-reveal-armed]:not(.is-in) {
  opacity: 0; transform: translateY(var(--dt-ctn-y)); pointer-events: none;
  transition: opacity var(--dur-dt-s) var(--ease-dt-in) var(--reveal-out-delay, 0s),
              transform 0s linear calc(var(--dur-dt-s) + var(--reveal-out-delay, 0s));
}
.reveal[data-reveal-armed].is-in {
  opacity: 1; transform: none;
  transition: opacity var(--dur-dt-l) var(--ease-dt-out) var(--reveal-delay, 0s),
              transform var(--dur-dt-l) var(--ease-dt-out) var(--reveal-delay, 0s);
}
.reveal[data-reveal="still"][data-reveal-armed]:not(.is-in) { transform: none; }
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal[data-reveal-armed], .reveal[data-reveal-armed].is-in { opacity: 1; transform: none; transition: none; }
}
```

  L'uscita sfuma sul posto e il transform torna allo stato di partenza solo a opacità zero. Se si rientra entro 0.4 s il transform è ancora 0 e l'opacità risale senza salti (meccanica verificata in idea-timing.md:290-292).

### 5.3 `SplitTitle` e `ScriptWord`

```tsx
type SplitTitleProps = {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "div" | "blockquote"; // default "h2"
  className?: string;
  id?: string;
  /** Stringhe, <br/> e <span className> (il rosso di PageHero). Altri elementi: errore in sviluppo. */
  children: ReactNode;
  font?: "display-400" | "display-500" | "brand-800"; // chiave della tabella di kerning
};
type ScriptWordProps = { className?: string; style?: CSSProperties; children: string };
```

- `SplitTitle` rende `data-reveal="title"`. Heading: `aria-label` + span `aria-hidden`; altri tag: `sr-only` + span `aria-hidden` (§1.6).
- `ScriptWord` rende `<span aria-hidden data-reveal="accent" class="script-word">` con `font="script-400"`.
- `SplitChars({ text, font, locale, upper })`: `<span class="dt-w" data-w>` per parola, `<span class="dt-c" data-c style="--k:…">` per carattere, spazi veri fra le parole.
- CSS: `.dt-w { display: inline-block; white-space: nowrap }`, `.dt-c { display: inline-block; margin-inline-end: var(--k, 0em) }`, compensazione dell'accento del §1.4.
- TextLines non si annida mai in Reveal (memoria domus-wow-layer.md:28): con i gruppi il problema sparisce, un elemento ha un ruolo solo.

### 5.4 `Lead`

```tsx
type LeadProps = { as?: "p"; className?: string; children: string };
```

- Rende `<p class="lead" data-reveal="lead">`; split, `onSplit` e cambio lingua del §1.3.
- Fuori da un gruppo crea il proprio.

### 5.5 `Hairline`, `ClipMedia`, `clip.ts`

```tsx
type HairlineProps = { axis?: "x" | "y"; className?: string };        // <span aria-hidden data-reveal="line" data-axis>
type ClipMediaProps = { from?: "left" | "right" | "top" | "bottom"; className?: string; children: ReactNode };
                                                                      // <div data-reveal="curtain" data-from>
```

```ts
// app/lib/motion/clip.ts : solo forme a spigolo vivo (C01)
export type Side = "left" | "right" | "top" | "bottom";
export const clipOpen = "inset(0% 0% 0% 0%)";
export function clipClosed(from: Side): string;   // left → "inset(0% 100% 0% 0%)" (catalogo §6c), right → "inset(0% 0% 0% 100%)"…
export function opposite(from: Side): Side;
export function clipFrame(v: number, h: number): string;  // clipFrame(8, 22) → "inset(8% 22% 8% 22%)" (cartolina, catalogo §15)
export function clipSlant(p: number): string;     // parallelogramma di Era, polygon(100% 0%,100% 0%,101% 100%,125% 100%) → pieno (catalogo §4)
export function assertStraight(v: string): void;  // rifiuta round, circle(, ellipse(, path(, url(
```

- Sempre quattro valori in percentuale, così GSAP interpola stringhe con la stessa forma.
- Il clip sta sul modulo media (`.dt-media-*`), mai su un antenato di sticky o fixed, mai sulla foto LCP.
- Mai una scala aggiunta a una copertina con `.dt-still-trim` (tetto 1.43, DESIGN.md:593); `sizes` resta la regola dei pixel resi (DESIGN.md:498-506).
- `will-change: clip-path` solo durante il tween, tolto nel cleanup (schema di Parallax.tsx:114-122).

### 5.6 `useCorridor`

```ts
export type Cue = { at: number; forward: () => void; backward?: () => void };
export type CorridorOptions = {
  id: string;           // chiave in chapters.ts: da lì arrivano scrub e range (A20)
  run: number;          // svh di scroll oltre lo schermo: wrapper alto 100svh + run
  build: (tl: gsap.core.Timeline, q: <T extends Element = HTMLElement>(sel: string) => T[]) => void; // durata 1
  cues?: Cue[];
  phone?: (q: <T extends Element = HTMLElement>(sel: string) => T[]) => void | (() => void); // < 1024, motion ok, mai sticky
  deps?: unknown[];     // es. [locale]
};
export function useCorridor(ref: RefObject<HTMLElement | null>, o: CorridorOptions): void;
```

Markup e CSS:
```tsx
<section ref={ref} data-corridor="page-dive" style={{ "--corridor-run": 120 } as CSSProperties}>
  <div data-corridor-screen>…</div>
</section>
```
```css
[data-corridor][data-on] { height: calc(100svh + var(--corridor-run, 0) * 1svh); }
[data-corridor][data-on] > [data-corridor-screen] { position: sticky; top: 0; height: 100svh; overflow: clip; }
```

Comportamento:
- `MQ.corridor = "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (min-height: 640px)"`. Sotto 640 px di altezza uno schermo da 100svh taglierebbe i contenuti.
- Ramo corridoio: `data-on` via JS (come HorizontalRail.tsx:90-107); `gsap.timeline({ defaults: { ease: "none", immediateRender: false }, scrollTrigger: { trigger: wrapper, start, end, scrub, invalidateOnRefresh: true, onUpdate } })`; `build(tl, q)`; `requestRefresh()`. `immediateRender: false` di default evita la trappola del fromTo più avanti in una timeline scrubbata (memoria domus-wow-layer.md:49, regola 4).
- Cues: il motore tiene l'ultimo progress. `last < at ≤ p` → `forward`; `p < at ≤ last` → `backward`. A un refresh con la pagina già oltre un cue, i `forward` con `at ≤ p` scattano una volta.
- Rete: se il wrapper è tutto sopra il viewport e `tl.progress() < 1` dopo un refresh, `tl.progress(1)` e i cue mancanti (la trappola ScrollTrigger in fondo alla home).
- Ramo telefono: nessun `data-on`, nessuna altezza, nessuno sticky; la corsia sceglie il suo equivalente (reveal a gruppo, o scrub sul passaggio naturale «top bottom → bottom top»). Niente scroll-hijack.
- Reduced-motion e no-JS: niente.
- Regole scritte nel commento del hook:
  - transform solo sui discendenti dello schermo, mai su wrapper, schermo o loro antenati;
  - nessun antenato con `overflow: hidden` (romperebbe lo sticky; `clip` va bene);
  - il contenuto dello schermo deve stare in 100svh nella lingua più lunga (test §7);
  - un corridoio per componente client: `build` è una funzione e non passa da un server component (PageHero usa un figlio client).
- Home: tre corridoi nuovi (tuffo dell'hero, finestra di Open Domus, cartolina del Congedo) più i tre di oggi (`.dt-horizon`, `.dt-starrev_runway`, `.dt-railway`), che restano sulle loro meccaniche. Pagine interne: un corridoio per PageHero.

### 5.7 `useAmbientVideo`

```ts
export function useAmbientVideo(
  video: RefObject<HTMLVideoElement | null>,
  host: RefObject<HTMLElement | null>,
  o?: { warm?: string /* rootMargin del precarico, default "50% 0px" */; minWidth?: string /* default MQ.desktop */ },
): void;
```

- Gate: `MQ.motionOk` e `minWidth` (768 per DESIGN.md:401), e `navigator.connection?.saveData !== true` con optional chaining (Safari e Firefox non hanno l'API).
- Due IO sul host: `warm` mette `preload="auto"`; `rootMargin "0px"` fa `play().catch(() => {})` in vista e `pause()` fuori.
- `visibilitychange` nascosto: pausa. Preferenza cambiata a pagina aperta: pausa.
- Mai `currentTime` scritto: riprende dove era.
- Il host riceve `data-ambient="playing|paused|off"` per i test.
- Markup obbligatorio: `<video muted loop playsInline preload="none" aria-hidden>` con webm prima di mp4, poster `next/image` sotto (Congedo.tsx:99-124). Il hook avvisa in sviluppo se manca `muted` o `playsInline`.
- Niente segmenti col seek: `timeupdate` arriva circa quattro volte al secondo, il salto indietro sfora fino a 250 ms e il browser scaricherebbe il file lungo a pezzi. Ogni loop è un file suo, tagliato alla codifica (0-9.1 drone, 24-29.2 uliveto, 35.6-40.2 acqua; 1920×1080 H.264 + WebM, faststart, muto; media-nuovi.md:43-63).
- Consumatori: Congedo (sostituisce l'effect di Congedo.tsx:52-79), la banda dell'acqua di CostiChiari, gli altri loop che le corsie scelgono. Con due consumatori il hook ha senso (condizione di idea-media P1).

### 5.8 `fold.ts`

```ts
export function curtainPending(): boolean;                 // html[data-preloader] e !hasIntroFired()
export function afterCurtain(cb: () => void): () => void;  // INTRO_EVENT once + rete HERO_REST_MS (o il valore della corta)
export function foldNetFired(el: Element): boolean;        // generalizza heroNetFired (HeroCinematic.tsx:136-156)
```

### 5.9 `gsap.ts`: aggiunte

```ts
export const durDt = { s: 0.4, m: 0.8, l: 1.2 } as const;
export const staggerDt = 0.1;
export const delayDt = { reveal: 0.3 } as const;
export const painted = 0.02;
export const ctnY = () => (matchMedia(MQ.lg).matches ? "3.333vw" : "11.54vw");
CustomEase.create("dtIn", "0.5,0,0.75,0");
CustomEase.create("dtInOut", "0.75,0,0.25,1");
CustomEase.create("dtEase", "0.25,0.1,0.25,1");
// MQ.corridor, vedi §5.6
export const requestRefresh = (() => { let raf = 0;
  return () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => ScrollTrigger.refresh()); }; })();
```

Il commento di gsap.ts:3-25 si riscrive sul lessico del §4.1 (oggi elenca token morti e una CustomEase per `--ease-soft` che non esiste, idea-timing.md:14).

---

## 6. Guardia su /case/[slug]

Dichiarazione: su /case/[slug] (PropertyDetail, PropertyGallery) il movimento della pagina non cambia.

- `MotionFreeze`: contesto React + `<div data-motion-freeze>` intorno al contenuto di `app/case/[slug]/page.tsx`.
- Dentro la guardia `Reveal` usa l'implementazione di oggi (Reveal.tsx:18-61) e la CSS di oggi, scoperta sotto `[data-motion-freeze] .reveal` (0.9 s out-expo, 2.5rem, globals.css:508-521). Lo usa ListingCopy.tsx:131 e :151.
- PropertyCard (resa a PropertyDetail.tsx:625) e PropertyGallery tengono le loro classi (§4.5).
- La testata (menu, lingua) e il footer (tooltip dei social) sono gli stessi componenti su ogni pagina: prendono lo strato UI anche su /case/[slug]. Se Alberto li vuole fermi anche lì, basta `:root:has([data-motion-freeze]) :is(.t-panel-slide, .t-dropdown, .dt-social__tip) { transition: none !important; }` (`:has` da Chrome 105, Safari 15.4, Firefox 121; senza, animano).
- `case-guard.test.ts` (§7) presidia i file.

---

## 7. Test

### 7.1 Unit (`npm test`, package.json:11)

| File | Cosa pretende |
|---|---|
| `motion-tokens.test.ts` (nuovo) | ogni `--ease-dt-*` di globals.css ha le stesse quattro cifre della CustomEase `dt*` di gsap.ts; `--dur-dt-s/m/l`, `--stagger-dt`, `--delay-dt-reveal` = `durDt`, `staggerDt`, `delayDt`; nessuna definizione di `--ease-in`, `--ease-out`, `--ease-in-out`; nessun `--blur-` e nessun `*-blur:`; nessun `ease-[cubic-bezier(` in app/**/*.tsx fuori dalla guardia; CustomEase una per riga |
| `text-roles.test.ts` (nuovo) | `ROLES` = i valori del §1.1 (Era, A20); `staggerEach(0.05, 25, 1.2) === 0.05`, `staggerEach(0.05, 34, 1.2) < 0.05`; `groupDelay(9) === groupDelay(5)` |
| `reveal-engine.test.ts` (nuovo) | matrice di `decide()`: entra dal basso, esce dal basso, esce dall'alto, rientra dall'alto, esce a destra, esce a sinistra, per i quattro stati; CSS: `dt-reveal-failsafe` con 6s e 3.33s (= `HERO_REST_WARM_MS`, `HERO_REST_MS`); nessun `html[data-hero-intro="intro"] [data-reveal]`; reduced-motion neutralizza `.reveal[data-reveal-armed].is-in`; nessun `will-change` su `.reveal`; `#main` con `overflow-x: clip` |
| `chapters.test.ts` (nuovo) | nessuna coppia di capitoli con stessa ease, stesso scrub o durata, stessa coppia start/end; ease solo fra quelle ammesse (§4.3) |
| `clip.test.ts` (nuovo) | `assertStraight`; nessun `round`, `circle(`, `ellipse(` in un contesto `clip-path` di app/**/*.tsx e globals.css |
| `no-pin.test.ts` (nuovo) | nessun `pin:`, `pinSpacing`, `anticipatePin` nel codice di app/ (commenti tolti come logo-colore.test.ts:44-46) |
| `kern-table.test.ts` (nuovo) | le quattro chiavi; valori entro ±0.2 em |
| `case-guard.test.ts` (nuovo) | app/case/[slug]/**, PropertyGallery.tsx, PropertyCard.tsx: nessun import di RevealGroup, SplitTitle, ScriptWord, Lead, Hairline, ClipMedia, useCorridor, useAmbientVideo, reveal-engine, text-roles; nessun `data-reveal=` né `data-corridor`; elenco congelato delle classi `duration-*`, `ease-*`, `transition*`, `delay-*` per file; `page.tsx` rende `MotionFreeze`; globals.css tiene il blocco congelato |
| `intro-clocks.test.ts` | invariato da questa corsia: CSS in `:root[…]`, keyframe nuova, nessun nome di ease cambiato. Lo aggiorna solo la corsia preloader |
| `moduli-media.test.ts` | invariato: CSS nuova dopo globals.css:436 |

### 7.2 E2E (suite `playwright.site.config.ts`, motion ok salvo dove forzato, playwright.site.config.ts:25-27; fixture `goto` salta il sipario, helpers.ts:120-139)

`e2e/text-motion.spec.ts` (nuovo):
1. **Ingresso in fondo alla home** (1440 e 390): passata con la rotella oltre `#recensioni` fino a `#servizi` e `#contatti`; ogni `[data-reveal="title"] [data-c]` in viewport arriva a opacity 1 e transform identità entro 3.5 s (ritardo 0.8 + stagger 1.2 + durata 1.2 + margine).
2. **Uscita dal basso**: con un titolo in vista si risale finché è sotto il bordo; entro 1.3 s i suoi caratteri hanno opacity < 0.1.
3. **Nulla dall'alto**: un titolo passato sopra il bordo resta a opacity 1.
4. **Ancora**: `/#contatti`; i gruppi sopra l'ancora sono shown all'armamento, risalendo i caratteri sono già a 1 al primo campione.
5. **Nessun lampo sugli H1**: su /vendi, /contatti, /case-vendute, /valutazione-immobile-tradate e /, uno `addInitScript` campiona a ogni frame da DOMContentLoaded l'opacità calcolata dell'H1 o del suo primo `[data-c]`; la serie non passa mai da ≥ 0.9 a ≤ 0.1. Due varianti: con `goto` (senza sipario) e con `page.goto` a sessione fresca (col sipario).
6. **LCP**: stesse pagine, `PerformanceObserver("largest-contentful-paint")`; con motion ok ≤ con `reducedMotion: "reduce"` + 100 ms, stesso worker.
7. **Cambio lingua** su /metodo: dopo lo switch, `aria-label` degli heading e testo dei caratteri nella lingua nuova; righe del lead ricostruite senza testo vecchio.
8. **Budget nodi** su / a 1440 dopo una passata intera (§1.7).
9. **Tailwind emette i token**: `getComputedStyle(documentElement).getPropertyValue("--ease-dt-in")` e `--duration-fast` non vuoti sul build.

Accessibilità con motion ok (nuovo describe in a11y.spec.ts, `test.use({ contextOptions: { reducedMotion: "no-preference" } })`): su `/` e `/metodo` passata a gradini fino in fondo, attesa di 3.5 s, poi `a11yViolations(page)` = []. Il resto di a11y.spec.ts resta con reduce (a11y.spec.ts:11).

Traboccamento: la rete di mobile-motion.spec.ts:27-55 gira anche con cookie `dt_locale=de` e `fr` su `/`, `/vendi`, `/metodo`.

Corridoi (in home.spec.ts accanto a :126-217, o `e2e/corridors.spec.ts`):
- a 1440 su `/` ci sono 3 `[data-corridor][data-on]` più i tre nastri di oggi; a 390 nessun `[data-corridor][data-on]`; su /vendi 1 a 1440;
- per ogni `[data-corridor][data-on] > [data-corridor-screen]`: `scrollHeight ≤ clientHeight + 1` a 1024×768 e 1440×900, in it e de.

motion.spec.ts (reduce, motion.spec.ts:6), aggiunte al test di :22-43 e accanto a :58-98: nessun `[data-corridor][data-on]`; nessun `[data-reveal-armed]`; `[data-c]` a opacity 1 e transform `none`; nessuna `.dt-line`.

`e2e/ui-transitions.spec.ts` (nuovo):
- menu del telefono a 390: apertura `data-open="true"`; chiusura e `hidden` di nuovo entro 450 ms; il test del bottone `/menu/i` resta verde;
- FAQ su /domande-frequenti: click su un summary → `details[open]` e `data-open="true"`; secondo click → `open` falso entro 250 ms; con reduce subito;
- tooltip di un social a 1440: opacity 1 entro 350 ms dall'hover.

`e2e/ambient-video.spec.ts` (nuovo):
- desktop-1440: scroll al Congedo → `video.paused === false`; in cima → `true`; di nuovo giù → `currentTime ≥` il valore letto prima;
- mobile-390, e 1440 con reduce: nessuna richiesta che finisca in `.mp4` o `.webm`.

Guardia (in `pages.spec.ts` o nuovo): su una scheda /case/[slug] dei mock, `[data-motion-freeze] .reveal` ha `transition-duration` con `0.9s`; nessun `[data-reveal-armed]`.

---

## 8. Ordine dei lavori, documenti, registro

Commit, ognuno con typecheck, lint, `npm test` e la parte di e2e che tocca:
1. Test a motion attivo sul comportamento di oggi (text-motion 1-3 contro TextLines): deve esistere prima della migrazione (condizione di idea-type.md:136).
2. Lessico: gsap.ts, token CSS, `text-roles.ts`, `motion-tokens.test.ts`, `text-roles.test.ts`.
3. Motore, `RevealGroup`, `Reveal` riscritto, CSS del ruolo ctn, `reveal-engine.test.ts`, `MotionFreeze` e guardia.
4. `SplitChars`, tabella di kerning, `SplitTitle`, `ScriptWord`; TextLines diventa alias; migrazione dei 32 punti di chiamata; poi TextLines via.
5. `Lead`; migrazione di `p.lead` fuori da Reveal.
6. Regola degli H1 (stato dipinto, `fold.ts`), test 5-6.
7. `useCorridor`, `ClipMedia`, `Hairline`, `clip.ts`, `chapters.ts`, `useAmbientVideo` (Congedo migrato), test relativi.
8. Strato transitions.dev e tabella refine, `ui-transitions.spec.ts`.
9. Documenti.

Dopo ogni modifica a globals.css si verifica sul build di produzione (la suite lo usa, playwright.site.config.ts:18-21), non su Turbopack dev, che serve la CSS vecchia (memoria domus-wow-layer.md:18).

Documenti da aggiornare (prima `git fetch` e confronto con origin/claude/rivista-bianca: Alberto li tocca dal portatile):
- DESIGN.md: :490 (0.25 s), :491 (menu che si apre), :496 (cellula: ruoli e tempi), :509 (play 0.25 s), :573 e :587 (gesti e corridoi secondo A18-A20);
- .impeccable/design.json:358;
- spec §3.5 (:188-192) e registro §11: A18, A19, A20 con le parole di Alberto; la numerazione D e delle domande si concorda con la corsia documenti (proposta del critic.md:16-29: D16 per il flip tolto in 7d2d1d8 e ora rimesso da A20, D17 per il lessico, domanda 12 sul replay del 4 agosto, domanda 13 su A18-A20 da mostrare alla cliente);
- D nuove di questa corsia: tetto dello stagger per carattere, tetto dell'ordine nel gruppo, soglia 1024 per `--dt-ctn-y`, kerning in tabella, `min-height: 640px` dei corridoi;
- commenti: gsap.ts:3-25, Reveal.tsx:14-17 («de-blur»), Header.tsx:264-268, Congedo.tsx:9-11 («Niente GSAP»).

---

## 9. Rischi e domande

- **Testo invisibile prima dell'idratazione.** Lo stato dipinto vale per ogni `[data-reveal]` sotto `data-hero-intro`: su un telefono lento il testo del primo schermo resta a 0.02 fino all'armamento, con la rete a 6 s (3.33 s col film). A20 accetta il rischio; va misurato a CPU ×4 e Slow 4G il tempo al primo testo leggibile su /vendi e /contatti, prima e dopo.
- **LCP** di /contatti, /case-vendute, /valutazione: da misurare (test 6 e Lighthouse mobile).
- **Tetti di stagger e di ordine**: sono decisioni di lavoro, non valori di Era. Vanno mostrati ad Alberto con una pellicola di un d1 lungo.
- **Kerning**: la tabella va rigenerata a ogni cambio di font; il Pinyon spezzato può perdere gli attacchi fra lettere anche con la compensazione. Controllo a occhio nelle cinque lingue a 768, 1024, 1440.
- **Manifesto e hero** cambiano ritmo (set piece A12, ingresso A16): pellicola prima/dopo per Alberto.
- **Chrome su /case/[slug]**: menu, lingua e tooltip animano anche lì (§6). Domanda per Alberto: fermi anche quelli?
- **Nome dell'attributo**: `data-hero-intro` fa da «motion ok con JS» per tutto il sito. Rinominarlo toccherebbe intro-clocks.test.ts:264-273; resta, documentato.
- **Firme di capitolo**: l'unicità stretta di A20 obbliga a ease fuori dal lessico per i gesti di capitolo (§4.3). Se Alberto intendeva che anche i gesti usino solo le ease di Era, l'unicità va letta sulla terna e non su ogni campo: domanda per lui.
- **Replay del 2026-08-04**: A18 lo rafforza («uscite speculari») ma il registro non lo contiene (idea-timing.md:385-388); si registra insieme ad A18.
