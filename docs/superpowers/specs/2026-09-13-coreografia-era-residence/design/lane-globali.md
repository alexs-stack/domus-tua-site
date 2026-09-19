# Corsia globali: pagine interne, monogramma, cambio di tema, preloader

Data 2026-09-13, branch `claude/rivista-bianca`. Direttive di partenza: A18 «Coreografia piena», A19 «Sticky dove serve», A20 «Fedeltà letterale» (memoria `domus-coreografia-era.md:13-16`). Vanno scritte in spec §11 come direttive di Alberto prima del codice. Superano C03 della cliente (spec:367) e il Don't di `DESIGN.md:587`: vanno girate alla cliente come domanda, mai attribuite a lei.

Strumenti usati: skill `gsap-scrolltrigger` (trigger sul corridoio non sticky, `refreshPriority`, `invalidateOnRefresh`); skill `transitions-dev` (token del cambio colore, senza blur); doc di Next 16 in `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md:265-293` (`preload`, `priority` deprecata); context7 `/websites/gsap_v3` su SplitText (`autoSplit` con `onSplit` che restituisce l'animazione: GSAP la ricrea e la risincronizza al ri-split). Misure fatte con PIL sulle sorgenti (sezione 1.9).

---

## 0. Fatti di codice che reggono la corsia

1. `PageHero` è un server component senza hook (`PageHero.tsx:29`). La banda è `Parallax speed={-0.04} mobile={false}` con margini negativi e `-z-10` (`PageHero.tsx:113-121`), l'immagine è `Image fill preload sizes="100vw" quality={60}` (`:120`). Da lg la colonna del titolo porta `lg:-mb-[6vw] lg:pb-[4.5vw]` (`:72-74`): la calligrafia entra nella banda per 1,5vw. Il `pt` sta sulla section (`:60`).
2. Undici pagine lo usano: `VendiContent.tsx:907`, `AcquistaContent.tsx:522`, `ServiziContent.tsx:224`, `MetodoContent.tsx:193`, `ChiSiamoContent.tsx:246`, `RecensioniContent.tsx:101`, `OpenDomusPageContent.tsx:721`, `LavoraConNoiContent.tsx:749`, `FaqContent.tsx:219`, `PrivacyContent.tsx:408`, `CookieContent.tsx:414`.
3. L'H1 di PageHero passa da `TextLines` solo se `title` è una stringa (`PageHero.tsx:83-89`). Otto chiamanti su undici passano una funzione che rende JSX (`title: () => (`, 5 lingue ciascuno: Cookie, Metodo, Vendi, Acquista, Privacy, OpenDomus, Recensioni, Faq; per esempio `AcquistaContent.tsx:25`, `CookieContent.tsx:19` tipo `() => ReactNode`). Quindi oggi quegli H1 sono un `<h1>` fermo (`PageHero.tsx:88`), non animato. Servizi, Chi siamo e Lavora con noi sono da verificare. Gli H1 in `TextLines` fuori da PageHero, con titolo stringa, sono `ContattiContent.tsx:138` (stringhe a `:14-70`), `CaseVenduteContent.tsx:210`, `ValutazioneContent.tsx:351`: lì oggi c'è già il passaggio visibile, nascosto dallo split (yPercent 112, `TextLines.tsx:100-117`), visibile al trigger.
4. Testata: `sticky top-0 z-50 … lg:relative` (`Header.tsx:202`); `RotatingMark` solo da xl dentro il link del logo (`Header.tsx:221-223`), unico import (`Header.tsx:7`). Motivo scritto: badge e cuore del logo a sedici pixel sembravano «un errore di montaggio» (`Header.tsx:215-220`).
5. `RotatingMark`: gate solo `MQ.motionOk` (`RotatingMark.tsx:44`), riposo 30°/s (`:45`), armamento solo `wheel`/`touchmove` (`:55-56`), `30 + 10 * Math.abs(velocity)` senza tetto (`:73`), rientro `dur.transition` 1,1 s con «domus» (`:79-80`), ticker con `dt = min(deltaMS, 100)` (`:61`). Commento scaduto sui versi opposti (`:9-15`).
6. `MarkBadge`: tacche `stroke="currentColor"` (`MarkBadge.tsx:54`), monogramma che non si tinge (`:67-79`). `logo-colore.test.ts:77` vieta le prop `dark|variant`, `:85-86` i filtri `invert|brightness-0|grayscale`, `:55-67` pretende solo #595a58 e #e30716.
7. Boot script: `pre=!deep&&m&&!sessionStorage.getItem(KEY)`, nessun controllo di rotta (`layout.tsx:102`). La chiave si scrive a fine film (`Preloader.tsx:263-272`), dal failsafe `fine` e con l'ancora (`layout.tsx:102`). Oggi il film intero suona sulla prima rotta caricata nella sessione, e l'e2e lo pretende anche su /acquista (`mobile-motion.spec.ts:386`, `["/", "/acquista"]`).
8. Patto della porta: sagoma a `top: calc(var(--dt-head-h) + 1px)` e `height: var(--dt-band-h)` (`globals.css:858-866`), presidiato da `intro-clocks.test.ts:405-436`. Sulle pagine interne la banda di PageHero comincia sotto il titolo, a una quota che cambia con lingua e larghezza (`PageHero.tsx:71-75`): lì il patto non esiste.
9. Film: porta `2.25s` `cubic-bezier(0.66, 0, 0.22, 1)`, tuffo `3.13s` `cubic-bezier(0.6, 0, 0, 1)`, autohide `4.73s` (`globals.css:1069-1077`); `--arch-k: 0.972` (`intro-clocks.test.ts:190`); skip in CSS (`globals.css:1134-1150`).
10. Lenis `lerp 0.1`, `anchors: true` (`SmoothScroll.tsx:108-114`). `next.config.ts:146` `qualities: [60, 75, 78]`, `:149` `deviceSizes` fino a 2560.
11. `/case/[slug]` monta Header e WhatsAppFloat (`case/[slug]/page.tsx:251-254`); `PropertyDetail` ha già un ScrollTrigger sui valori (`PropertyDetail.tsx:324-359`).
12. Componenti della home montati su pagine interne: `OpenDomus` su /metodo (`MetodoContent.tsx:10`) e /open-domus (`OpenDomusPageContent.tsx:746`); `Method` su /metodo (`MetodoContent.tsx:8`); `Services` su /servizi (`ServiziContent.tsx:5`); `DomusDocProtocol` su /vendi, /acquista, /metodo; `FeaturedTestimonial` su /vendi, /acquista, /recensioni; `CostiChiari` su /vendi (`VendiContent.tsx:14`); `Team` su /chi-siamo (`ChiSiamoContent.tsx:10`); `Contact` su otto pagine.
13. `.reveal` è nascosto in CSS ma sbloccato da `@media (scripting: none)` e da reduced-motion (`globals.css:508-540`).

---

## 1. Il tuffo sticky sulle 11 PageHero (A20)

### 1.1 Cosa si vede (1440×900, motion ok)

- Scroll 0: la pagina è identica a oggi.
- Primi 90 px (`--dt-head-h`, `globals.css:162`): la testata scorre via come oggi (`Header.tsx:202`).
- Poi la testa si ferma. Occhiello, H1, lead, CTA e prove salgono più veloci della banda ed escono dall'alto. La banda sale finché il suo bordo basso tocca il fondo dello schermo.
- La foto si ingrandisce da 1 a 2 con origine 50% 75%: si entra nell'acqua o sul terrazzo.
- A fine corridoio lo schermo si sgancia, la foto ingrandita scorre via e arriva il primo capitolo.
- Risalendo tutto torna indietro in scrub: uscita e rientro sono speculari per costruzione.

Sulle pagine interne nessun pannello sale sopra lo schermo col margine negativo: è il gesto di Posizionamento in home (altra corsia), e qui non si aggiungono gesti di sezione.

### 1.2 Markup

`PageHero` resta server. Due client component nuovi: `PageHeroDive` (schermo e timeline) e `PageHeroBand` (immagine base e strato nitido). Il `Parallax` esce da PageHero (`PageHero.tsx:5`, `:113-121`).

```tsx
<section id={id} className="dt-dive relative isolate bg-cream">            {/* il corridoio */}
  <PageHeroDive>                                                            {/* div[data-dive-screen].dt-dive_screen */}
    <div data-dive-content className="pt-[clamp(2rem,6vh,4rem)]">           {/* pt spostato qui da :60 */}
      <div className="dt-row lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-x-[5vw]">
        {/* colonna del titolo: data-dive-text su occhiello e h1; h1 con data-paint-h1 */}
        <div data-dive-band data-bg="foto"
             className="relative -z-10 -mx-[5vw] mt-[clamp(1.5rem,4vh,3rem)] md:-mx-[8vw] lg:col-start-1 lg:col-end-3 lg:row-start-2 lg:mt-0">
          <PageHeroBand src={image} alt={alt} objectPosition={objectPosition}
                        srcWidth={srcWidth} srcRatio={srcRatio} />       {/* div[data-dive-zoom].dt-media-full, origin 50% 75% */}
        </div>
        {/* colonna del lead: data-dive-text su lead, CTA, prove */}
      </div>
    </div>
  </PageHeroDive>
</section>
```

Prop nuove di PageHero: `objectPosition` (default «50% 50%»), `srcWidth` e `srcRatio` (per i `sizes`, 1.7).

CSS, in un blocco nuovo dopo `globals.css:436` (così lo slice di `moduli-media.test.ts:57-63` non si rompe):

```css
@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .dt-dive[data-on] { height: calc(100svh + var(--dive-run, 120svh)); }
  .dt-dive[data-on] .dt-dive_screen { position: sticky; top: 0; height: 100svh; overflow: hidden; }
}
```

`overflow: hidden` e non `clip`, per Safari sotto 16: sta sullo sticky stesso, non su un antenato. `data-on` lo scrive solo il JS, come `.dt-railway[data-on]` (`motion.spec.ts:64-65`): senza JS e con reduced-motion l'impaginato è quello di oggi.

Antenati dello sticky: section con `isolate` (nessun transform né ritaglio), `#main` flex (`layout.tsx:297`), body (`layout.tsx:241`), `html{overflow-x:clip}` che non crea un contenitore di scorrimento (`Header.tsx:73-80`). Dentro lo schermo non ci sono sticky o fixed. L'indice sticky delle FAQ (`FaqContent.tsx:233-236`) sta nella section dopo.

### 1.3 Timeline da 1024 px con motion ok

`gsap.matchMedia().add(\`${MQ.motionOk} and ${MQ.lg}\`)`. Timeline di durata 1 con ScrollTrigger:

- `trigger`: la section (il corridoio, non lo sticky: catalogo §12 avverte che uno sticky come trigger si misura male al refresh)
- `start: "top top"`, `end: "bottom bottom"`, `scrub: true`, `invalidateOnRefresh: true`
- `refreshPriority: -1`: è il primo trigger della pagina e cambia l'altezza di tutto quel che segue

| Posizione | Bersaglio | Da → a | Ease |
|---|---|---|---|
| 0 → 0.6 | `[data-dive-content]` | `y` 0 → −Δt | `dtEase` = `CustomEase.create("dtEase", "0.25,0.1,0.25,1")` (Ease di Era, catalogo D) |
| 0 → 0.6 | `[data-dive-band]` | `y` 0 → +(Δt − Δb) | `dtEase` (la banda, figlia del contenuto, si muove in tutto di −Δb) |
| 0.4 → 1.0 | `[data-dive-zoom]` | `scale` 1 → 2, `transformOrigin` 50% 75% | `dtIn` = `CustomEase.create("dtIn", "0.5,0,0.75,0")` (In di Era) |

Tutti `fromTo` con `immediateRender: false` sui tween dopo il primo (trappola della timeline scrubbata). Se la corsia dell'hero crea già `dtEase` e `dtIn` in `gsap.ts`, si riusano; altrimenti entrano in `gsap.ts` in questo commit, col loro consumatore.

Valori letti al refresh:

- `vh = innerHeight`
- `bandTop`, `bandBottom`: posizione della banda nello schermo a progresso 0
- `textBottom`: il bordo basso più basso fra i `[data-dive-text]` (occhiello, h1, lead, CTA, prove), esclusa `.script-word`
- `Δb = max(0, bandBottom − vh)`
- `Δt = max(1.25 · Δb, textBottom + 24)`

Il fattore 1,25 è quello di Era (`.hero-s` contro `.hero-w_bg`, catalogo §2). Il secondo termine garantisce che il testo sia uscito prima che lo zoom arrivi.

Corsa: `--dive-run: 120svh`, quindi corridoio di 220svh.

| Viewport | bandH | Δb | Δt | Allungamento della pagina |
|---|---|---|---|---|
| 1024×768 | 576 | ≈ 208 | ≈ 405 | ≈ +690 px |
| 1440×900 | 810 | ≈ 340 | ≈ 427 | ≈ +740 px |
| 1920×1080 | 1080 | ≈ 550 | ≈ 687 | ≈ +700 px |

Stime, con un blocco di testo di ~460 px a 1440 (`DESIGN.md:394`): si misurano con Playwright.

A 1440 la fase A dura 648 px di scroll e porta il testo di 427 px (0,66 px per px); la fase B dura altri 648 px. Il tuffo della home è un'altra corsia e ha una sua corsa: le pagine interne tengono 120svh perché subito sotto c'è il primo capitolo di conversione.

### 1.4 Nessuna scritta sopra la foto

Bordo alto della banda durante lo zoom: `bandTop + y_band + 0.75 · bandH · (1 − s)`.

La condizione, a ogni progresso p: o il testo è uscito (`textBottom + y_content < 0`), oppure `gap = (Δt − Δb)·e(p) + (bandTop − textBottom) − 0.75·bandH·(s − 1) > 0`.

A 1440:
- il testo esce a `e ≥ 403/427 = 0,944`, cioè p ≈ 0,48;
- lì `s − 1 = dtIn(0,13) ≈ 0,005`, cioè 3 px di risalita, e il gap vale ≈ 106 px;
- la scala che copre davvero (s > 1,1) arriva dopo p ≈ 0,7, a testo uscito.

La calligrafia resta l'eccezione dichiarata (`DESIGN.md:583`): può finire sulla foto.

Test nuovo `e2e/page-hero-dive.spec.ts` (motion no-preference; 1024×768, 1440×900, 1920×1080; /vendi e /domande-frequenti, dove il lead è più alto del titolo, `PageHero.tsx:65-66`): 21 quote equidistanti nel corridoio; per ogni `[data-dive-text]` con `rect.bottom > 0`, l'area d'intersezione col rettangolo di `[data-dive-zoom]` vale 0.

### 1.5 Sotto 1024 px

Nessun corridoio, nessun `data-on`, nessuno sticky. L'equivalente non sticky sta su `[data-dive-zoom]`:

- `scale` 1 → 1.08 da 768 a 1023,98 px; 1 → 1.06 sotto 768
- origine 50% 75%, `ease: "none"`, `scrub: true`
- `trigger`: la section, `start: "top top"`; `endTrigger`: `[data-dive-band]`, `end: "bottom top"`

A scroll 0 il progresso è 0: identico a oggi. Il touch resta nativo (`SmoothScroll.tsx:6`), niente scroll-hijack. Sostituisce il `mobile={false}` di oggi (`PageHero.tsx:115`).

### 1.6 L'H1 dipinto e mai nascosto

Sequenza, uguale per le 11 PageHero e per i tre H1 di `ContattiContent.tsx:138`, `CaseVenduteContent.tsx:210`, `ValutazioneContent.tsx:351`:

1. **Boot script** (`layout.tsx:102`), solo se `m`: `h.setAttribute("data-dt-paint", short ? "short" : "")`. Senza JS lo script non gira e l'attributo non c'è; con reduced-motion `m` è falso.
2. **CSS**, nel blocco dell'hero-rest (`globals.css:1166-1189`), con una keyframe sua per non toccare il conteggio di `intro-clocks.test.ts:251-252`:
   ```css
   html[data-dt-paint] [data-paint-h1] { opacity: 0.02; animation: dt-paint-net 0.5s ease 2.5s forwards; }
   html[data-dt-paint="short"] [data-paint-h1] { animation: dt-paint-net 0.5s ease 1.08s forwards; }
   @keyframes dt-paint-net { to { opacity: 1; } }
   ```
   2,5 s = `PAINT_NET_MS`; 1,08 s = `HERO_REST_SHORT_MS` (4.5). È lo schema di `data-hero-intro` (`globals.css:1178-1184`): dipinto a 0,02 dal primo paint, mai 0, mai `visibility`.
3. **Primitiva per lettere** (corsia tipografia; qui il contratto che le serve). Dentro `mm.add(MQ.motionOk)`:
   - se la rete `dt-paint-net` è già scattata (`getAnimations()`, `currentTime ≥ delay`, come `heroNetFired`, `HeroCinematic.tsx:136-156`), niente ingresso: si prepara solo lo split per i replay;
   - altrimenti `Promise.race([document.fonts.ready, 400 ms])`, poi `SplitText.create(h1, { type: "words,chars", smartWrap: true, autoSplit: true, aria: "auto" })`. `aria: "auto"` mette `aria-label` sull'h1, che lo ammette; va controllato con axe a motion ok (critica §26). Lo split regge i figli JSX (`<br/>`, span): va verificato nelle 5 lingue, perché il commento di `PageHero.tsx:81-82` dava per necessaria una stringa;
   - nello stesso frame: `gsap.set(chars, { opacity: 0, yPercent: 50, rotateY: 90, transformPerspective: 800, transformOrigin: "50% 100%" })` e poi `h1.style.animation = "none"; h1.style.opacity = "1"`. Nessun frame visibile→nascosto: prima dello split l'h1 era a 0,02;
   - partenza: con la corta in pagina a `INTRO_EVENT` (0,88 s) o subito se `hasIntroFired()` (`Preloader.tsx:110-112`); senza intro 150 ms dopo l'idratazione (come `HeroCinematic.tsx:336`);
   - valori: 1,2 s `dtOut` (`gsap.ts:73`), stagger `min(0.05, 0.6 / nChars)`, tetto totale 1,8 s (Era `h`: durL 1,2, stagger 0,05, catalogo C5).
4. **Replay e uscita**: l'H1 sta dentro lo schermo sticky, quindi nessun ScrollTrigger sull'H1 (un trigger su un figlio di una sticky può scattare a metà corsa: condizione di timing P4, `StarReviews.tsx:707`). La sua uscita è il tuffo stesso. Tornando a progresso 0 le lettere sono già al loro posto.
5. **Navigazione client**: `finish()` della corta riscrive `data-dt-paint=""`, così una pagina interna aperta con un Link ha la rete a 2,5 s e il JS già caricato fa lo split subito.

**LCP.** L'immagine della banda è in `preload` (`PageHero.tsx:119-120`). L'H1 spezzato in lettere inline-block si frammenta e smette di essere candidato (stesso ragionamento di `HeroCinematic.tsx:248-252`). Prima dello split l'H1 a 0,02 può essere un candidato precoce: l'immagine lo sostituisce quando si dipinge. Misura in 4.10.

**CLS.** A scroll 0 `data-on` allunga la section sotto la piega: il capitolo successivo passa da ≈1330 a 1980 px, fuori vista, quindi CLS 0. Con un'ancora (`/vendi#contatti`) o uno scroll ripristinato:
- nello stesso callback sincrono che scrive `data-on`, se `scrollY > sectionTop`, subito `window.scrollBy(0, altezzaNuova − altezzaVecchia)`;
- il contenuto a schermo non si sposta prima del paint, e lo spostamento dovuto allo scroll non conta nel layout shift.

Test: su `/vendi#contatti` a 1440, la `top` del bersaglio prima e dopo l'idratazione resta entro ±2 px; somma dei `layout-shift` senza `hadRecentInput` = 0.

### 1.7 I `sizes` durante lo zoom (D04, `DESIGN.md:499`)

- **Da 1024 a riposo.** Scatola 16:9 larga 100vw; sorgente 3:2 (1,5 < 1,78), quindi resa larga quanto la scatola: `100vw` è giusto. A fine zoom la foto è resa 200vw.
- **Strato nitido.** La base resta a `100vw`, così i byte dell'LCP non cambiano. In `PageHeroBand`, solo nel ramo del corridoio e solo se `srcWidth > 1920`, si monta un secondo `<Image sizes="200vw" quality={60} fetchPriority="low">`:
  - dopo `requestIdleCallback` con timeout 2500;
  - a opacità 0 finché `img.decode()` non risolve;
  - poi `gsap.set` a 1 quando il progresso supera 0,4, e di nuovo a 0 sotto 0,4;
  - stessa scatola e stesso `objectPosition`: lo scambio non si vede.
- **Tetto.** `deviceSizes` si ferma a 2560 (`next.config.ts:149`). A 1440 con DPR 1 servono 2880 px e ne arrivano 2560 (1,125×, in movimento); con DPR 2 il fotogramma finale è ingrandito 2,25×. Accettato e dichiarato.
- **Da 768 a 1023,98.** 16:9 con zoom 1,08: `108vw`.
- **Sotto 768.** Scatola 4:5 con sorgente 3:2: resa larga 1,25 · 1,5 = 1,875 volte la scatola; con lo zoom 1,06 fa 199vw, quindi `200vw`. Oggi `100vw` sotto 768 (`PageHero.tsx:120`) è un errore preesistente di D04: il loader manda metà dei pixel.
- **Formula in PageHero.** Sul telefono `ceil(125 · srcRatio · 1.06)vw` se `srcRatio > 0.8`: villa (1,5) 200vw; `hero_01` (1920×1067, 1,8) 239vw; `consulenza.jpg` (1920×1625, 1,18) 157vw. Stringa per la villa: `(max-width: 767.98px) 200vw, (max-width: 1023.98px) 108vw, 100vw`.
- **Condizione.** Misurare i byte dell'LCP a 390 con DPR 3 e Slow-4G prima e dopo: al massimo +150 ms di LCP mediano. Se si sfora, sotto 768 `sizes` scende a 133vw (DPR 2 effettivo), dichiarato come deroga a D04.

### 1.8 CTA cliccabili e fuoco

- Lead e CTA si muovono col contenuto, solo transform, mai a opacità nascosta: sono cliccabili finché si vedono. Dopo p ≈ 0,5 stanno sopra lo schermo.
- Tastiera: un `focusin` su `[data-dive-content]` con `st.progress > 0.01` porta lo scroll a `st.start` (`getLenis()?.scrollTo(st.start, { immediate: true })`, altrimenti `window.scrollTo`). Il fuoco resta visibile. È lo stesso gesto della runway di `StarReviews.tsx:540`.
- I `Reveal` di lead e CTA (`PageHero.tsx:127-142`) misurano con IntersectionObserver le posizioni vere: quando il contenuto esce dall'alto perdono `is-in` e rientrano risalendo (`Reveal.tsx:36`). È l'uscita speculare, e non richiede codice.
- Test: /vendi a 1440, scroll a metà corridoio, Tab fino alla CTA piena: il suo rettangolo sta dentro il viewport.

### 1.9 La calligrafia sul bordo della banda

La calligrafia scavalca il bordo alto per 1,5vw (`PageHero.tsx:67-74`), nella fascia x 14-36 %, y 0-2,67 % della banda (16:9 da lg). Misura con PIL: fascia ricampionata a 200×10, contrasto WCAG contro `--color-red` #d20a0a (`globals.css:44`); rosso su avorio fa 5,1:1.

Quota di pixel della fascia con contrasto ≥ 3:1 col rosso, a `objectPosition` verticale 0 % / 50 % / 100 %:

| Foto | Pixel | L media a 50 % | ≥ 3:1 (0 / 50 / 100 %) |
|---|---|---|---|
| _DSC2014 portico | 5977×3985 | 0,17 | 0 / 0 / 0 % |
| _DSC2016 facciata intera | 5977×3985 | 0,23 | 0 / 0 / 0 % |
| _DSC2022 facciata sull'acqua | 5977×3985 | 0,11 | 0 / 1 / 6 % |
| _DSC2024 angolo piscina | 5977×3985 | 0,28 | 0 / 0 / 1 % |
| _DSC2025 lettini | 5977×3985 | 0,29 | 0 / 28 / 10 % |
| premium_02 (/vendi oggi) | 1920×1080 | 0,40 | 23 % |
| hero_04 (/acquista oggi) | 1920×1067 | 0,59 | 100 % |
| premium_03 (/servizi oggi) | 1920×1080 | 0,35 | 1 % |
| hero_01 (/metodo, /chi-siamo, legali) | 1920×1067 | 0,52 | 62 % |
| premium_01 (/recensioni oggi) | 1920×1080 | 0,21 | 0 % |
| premium_05 (/open-domus oggi) | 1920×1067 | 0,48 | 0 % |
| consulenza (/lavora, /faq) | 1920×1625 | 0,59 | 100 / 81 / 31 % |

Per i sedici-noni pieni `objectPosition` non cambia la fascia: il valore è uno solo.

**Lettura.** Sulle cinque foto della villa il terzo basso delle lettere sulla foto sta sotto 3:1: nell'angolo alto a sinistra ci sono cielo, soffitto del portico e alberi a luminanza media. Oggi è già così su /recensioni, /open-domus e /servizi; peggiora su /acquista e /metodo. La parola la reggono i due terzi sull'avorio. Niente ombra né velo (C14, `DESIGN.md:580`).

Nel tuffo il contenuto sale più veloce della banda: `(Δt − Δb) · e(p)` supera 1,5vw (22 px a 1440) già a p ≈ 0,17. La calligrafia lascia la foto nei primi 180 px di scroll del corridoio.

**Decisione di lavoro da far vedere ad Alberto.** Si accetta il calo di lettura del terzo basso. Se su una pagina la parola non si legge a occhio, lì `lg:pb-[5.5vw]` riduce l'attraversamento a 0,5vw. Si rivede D15, non una direttiva.

### 1.10 Le 11 pagine: foto di oggi e proposta

Condizioni per tutte le foto della villa:
- autorizzazione del proprietario e diritti sui file (`docs/da-chiedere-alla-cliente.md` §2.2 e §6.2, domanda bloccante);
- nomi neutri senza indirizzo (`media-nuovi.md:35`): `public/images/reali/villa-facciata.jpg` (2016), `villa-lettini.jpg` (2025), `villa-portico.jpg` (2014), `villa-bordo-piscina.jpg` (2024), `villa-fronte-acqua.jpg` (2022);
- esportate a 2560×1707, JPEG q85, sRGB, **EXIF e GPS rimossi**;
- alt nelle 5 lingue che descrive quel che si vede (lezione di c2949a3).

| Rotta | Chiamata | Oggi | Calligrafia | Proposta | objectPosition | Perché | Condizioni |
|---|---|---|---|---|---|---|---|
| /vendi | `VendiContent.tsx:912` | `premium_02_living_dining_piante.jpg`, repertorio | «Con metodo» | _DSC2016 facciata intera | 50% 55% | la casa intera, il bene che si vende | in pagina c'è `CostiChiari`: se prende il loop dell'acqua dello stesso tour, la stessa villa compare due volte con scatti diversi (ammesso da «una foto in un posto», da far vedere) |
| /acquista | `AcquistaContent.tsx:527` | `hero_04_living_moderno_bianco.jpg`, repertorio | «Senza dubbi» | _DSC2025 lettini | 50% 50% | chi compra si immagina seduto lì | nessuna villa altrove in pagina |
| /servizi | `ServiziContent.tsx:228` | `premium_03_cucina_moderna.jpg`, repertorio (anche `:217`, riga di EditorialRows non resa per D10) | «Su misura» | _DSC2014 portico arredato | 50% 60% | home staging e foto professionali sono il servizio: questo è uno scatto di quel servizio | `Services` è in pagina (`ServiziContent.tsx:236`): se la corsia media gli dà _DSC2014, /servizi prende _DSC2024 |
| /metodo | `MetodoContent.tsx:198` | `hero_01_attico_travi_salotto.jpg`, repertorio | «Nove passi» | _DSC2024 angolo piscina | 50% 60% | il bordo della vasca è una linea che porta avanti, come il percorso | Method (`raffaela-ritratto`, `video-villa-mozart`, `handshake`, `Method.tsx:173-175`), OpenDomus, DomusDoc: nessuna villa |
| /open-domus | `OpenDomusPageContent.tsx:726` | `premium_05_living_accenti_senape.jpg`, repertorio | «Tre ore» | _DSC2022 facciata sull'acqua | 50% 70% | la casa aperta, la stessa immagine della finestra in home | solo se l'`OpenDomus` in pagina (`:746`) non rende _DSC2022: la finestra con _DSC2022 va dietro una prop della home (2.2) |
| /recensioni | `RecensioniContent.tsx:105` | `premium_01_living_tv_divano.jpg`, repertorio | «Le voci» | fotogramma del tour a 59,1-65,5 s («piscina e tenda, inquadratura bassa»), estratto con `crop=iw*0.90:ih*0.90:iw*0.10:ih*0.10` e scalato a 2560×1440 | da misurare | nessun volto: le voci stanno nel video della testimonianza subito sotto | se il fotogramma H.264 a 8 bit è molle, _DSC2016 (in uso su /vendi, altra pagina: ammesso) |
| /chi-siamo | `ChiSiamoContent.tsx:250` | `hero_01`, repertorio | «Dal 2007» | resta, per ora | - | nessuna foto della villa racconta le persone; `reali/raffaela-team-sede.jpg` è 1280×720 (misurato) e mai usata, troppo piccola per una banda a tutta larghezza con zoom a 2 | domanda ad Alberto: uno scatto della sede o del team di almeno 2560 px |
| /lavora-con-noi | `LavoraConNoiContent.tsx:753` | `reali/consulenza.jpg`, reale | «Insieme» | resta | 50% 50% | foto vera | sorgente da 1920: il fotogramma finale a 1440 è ingrandito 1,5×. Ci sono persone: lo zoom è una scala uniforme, non una distorsione, ma l'origine 50% 75% va guardata sui volti |
| /domande-frequenti | `FaqContent.tsx:223` | `reali/consulenza.jpg`, reale | «Domande» | resta | 50% 50% | foto vera | come sopra |
| /privacy | `PrivacyContent.tsx:412` | `hero_01`, repertorio | nessuna | _DSC2024 (in uso su /metodo) | 50% 60% | senza calligrafia la fascia non conta | pagina a basso traffico |
| /cookie | `CookieContent.tsx:418` | `hero_01`, repertorio | nessuna | _DSC2016 (in uso su /vendi) | 50% 55% | come sopra | come sopra |

Risultato: le teste di repertorio passano da nove su undici (`PRODUCT.md:170-171`) a una (/chi-siamo). Rischio da dichiarare: una villa sola illustra sette pagine.

### 1.11 Test del tuffo

- Nuovo `e2e/page-hero-dive.spec.ts` (motion no-preference):
  - (a) a scroll 0 le trasformate di `[data-dive-content]`, `[data-dive-band]` e `[data-dive-zoom]` sono l'identità sulle 11 rotte, a 1440;
  - (b) a metà corridoio `.dt-dive[data-on]` c'è e la scala è > 1;
  - (c) nessun testo sulla foto (1.4);
  - (d) il fuoco sulla CTA riporta all'inizio (1.8);
  - (e) l'ancora non salta (1.6);
  - (f) a 390 e 768 nessun `data-on`, `position` dello schermo ≠ sticky, scala finale ≤ 1,06 e ≤ 1,08.
- `motion.spec.ts`: con reduced-motion `.dt-dive` senza `data-on` su /vendi. Il test della parallasse di PageHero (`motion.spec.ts:108-173`) va sostituito: PageHero non usa più `Parallax`.
- `mobile-motion.spec.ts:27-53` (nessun traboccamento su 8 rotte) deve restare verde: la scala 2 sta dentro l'`overflow: hidden` dello schermo.
- Unit nuovo `app/components/__tests__/corridoi.test.ts`: in home i corridoi sticky sono sei, elencati per nome; `dt-dive` esiste solo in PageHero; nessun `pin:` in `app/` (con `soloCodice` di `logo-colore.test.ts:44-46`).
- `a11y.spec.ts` gira solo con reduced-motion (`:11`): serve una passata di axe con motion ok su /vendi e /metodo (critica §26).
- `moduli-media.test.ts`: `.dt-media-full` resta 16:9, PageHero tiene `!aspect-[4/5] md:!aspect-video`.

---

## 2. Le altre sezioni delle pagine interne

### 2.1 La regola

Sulle pagine interne nessun gesto di sezione nuovo. Cambiano tre cose.
- **I titoli.** La primitiva per lettere di A20 prende il posto di `TextLines` (32 occorrenze in 26 file), con l'uscita del sistema. I valori sono della corsia tipografia.
- **I blocchi `.reveal`.** Prendono l'uscita del sistema (corsia timing).
- **I componenti condivisi con la home.** Si portano dietro il loro gesto se **non** è un corridoio sticky. I corridoi della home restano della home, dietro una prop con default `false`: A19 elenca sei corridoi in home, e sotto un tuffo un secondo corridoio raddoppierebbe la sosta.

### 2.2 Pagina per pagina

Gesti dei componenti condivisi: quelli dell'assegnazione di partenza.

| Rotta | Sezioni dopo PageHero | Movimento sulla pagina interna |
|---|---|---|
| /metodo | Highlights, `Method` completo, `DomusDocProtocol`, `OpenDomus`, `Contact` | Method: tendine sulle foto dei tre atti (condiviso, ammesso); i nove passi solo testo. DomusDoc: righe che si tirano. OpenDomus: **niente finestra** (`finestra={false}`), il resto com'è oggi. Contact: colonna del form più lenta. |
| /vendi | Highlights, EditorialRows (lista numerata), BeforeAfter, `DomusDocProtocol`, `FeaturedTestimonial`, FaqTeaser, `CostiChiari`, `Contact` | BeforeAfter fermo (timing P5). DomusDoc, FeaturedTestimonial (la foto affonda uscendo), CostiChiari (l'acqua che sale; `preload="none"`, IntersectionObserver, da 768), Contact: il loro gesto. Quattro gesti in fila su una pagina di conversione: da guardare. |
| /acquista | Highlights, EditorialRows, PropertySearch, `DomusDocProtocol`, `FeaturedTestimonial`, FaqTeaser, `Contact` | PropertySearch invariato (`search.spec.ts:35`). Gli altri tre col loro gesto. |
| /servizi | `Services`, EditorialRows, BeforeAfter, `Contact` | Services: zoom d'ingresso 1,15 → 1 subito dopo il tuffo 1 → 2. Due gesti di scala in fila, di verso opposto: A20 vale per la home, qui è dichiarato. |
| /open-domus | `OpenDomus`, Highlights, EditorialRows, `Contact`, sezioni proprie | OpenDomus senza finestra; sezioni proprie solo testo e uscite. |
| /recensioni | `FeaturedTestimonial`, Reviews, Stats, `Contact` | FeaturedTestimonial e Contact col loro gesto; Reviews e Stats solo testo. |
| /chi-siamo | Storia (`villa-pool.jpg`, `ChiSiamoContent.tsx:267`), Highlights, Stats, `Team`, `Contact` | Team: la rotaia resta com'è oggi (corridoio già esistente, `Team.tsx:220`, se `compact` non la toglie: da verificare). |
| /lavora-con-noi | sezioni proprie, CareerApplication | solo testo e uscite; il form non si muove. |
| /domande-frequenti | FaqList con indice sticky, `Contact` | solo testo; nessun transform sugli antenati dell'indice (`FaqContent.tsx:233-235`). |
| /privacy, /cookie | testo legale | solo testo. |

### 2.3 Pagine senza PageHero

/contatti (`ContattiContent.tsx:138`), /case-vendute (`CaseVenduteContent.tsx:210`), /valutazione-immobile-tradate (`ValutazioneContent.tsx:351`): senza banda, quindi senza tuffo. Hanno l'H1 dipinto con le lettere (1.6), la corta (4) e il segno (3). Le tessere di /case-vendute (`CaseVenduteContent.tsx:283-292`) sono cliccabili: nei replay solo opacità (regola di lavoro del 2026-08-04).

### 2.4 /case/[slug] invariata, con guardia

- **Niente di A18-A20:** né tuffo, né primitiva per lettere, né segno staccato (la testata tiene il `RotatingMark` che gira sul posto da xl, come oggi), né corta. Il ScrollTrigger dei valori (`PropertyDetail.tsx:324-359`) non si tocca.
- **Il film intero.** Oggi suona anche lì alla prima atterrata della sessione, con la sagoma di Raffaela sopra una scheda immobile (critica §9). **Proposta D20:** il boot script esclude `/case/` anche dal film. È un cambio di movimento su quella pagina (4,63 s in meno): serve il sì di Alberto. L'alternativa letterale è lasciarla com'è oggi, cioè film alla prima atterrata e mai la corta.
- **Guardia unit** `app/lib/__tests__/case-slug-invariata.test.ts`, con `soloCodice`:
  1. `case/[slug]/page.tsx`, `PropertyDetail.tsx` e `PropertyGallery.tsx` non importano `PageHero`, `PageHeroDive`, `PageHeroBand`, `MarkSegno` né la primitiva per lettere, e non contengono `data-bg` né `data-dive`;
  2. il boot script contiene l'esclusione di `/case/` nel `gate` (regex sul template);
  3. `Header.tsx` non monta `MarkSegno` quando `pathname.startsWith("/case/")`.
- **Guardia e2e:** `/case/<slug>` a 1440, motion ok, sessione nuova: nessun `data-preloader` visto (se passa D20), nessun `[data-segno]`, nessuna `.dt-dive`.
- **Commento in testa a `PropertyDetail.tsx`:** «Pagina di conversione: fuori dalla coreografia A18-A20 (spec §11). Guardia: app/lib/__tests__/case-slug-invariata.test.ts.»
- Gli snapshot di `property-detail.spec.ts:51-57` nascondono testata, cookie e wa.me: senza segno montato non cambiano.

---

## 3. Il monogramma sempre visibile e il cambio di tema (A18)

### 3.1 Perché A13 lo metteva solo da xl, e cosa cambia

A13 lo metteva solo da xl per due ragioni, entrambe legate al badge **dentro** la testata:
- accanto al cuore del logo, sedici pixel dopo, sembrava un errore di montaggio (`Header.tsx:215-220`);
- da 1024 la riga non ha posto: logo a 150 px, sei voci e la lingua (`Header.tsx:224-246`).

Un segno che vive nel margine **dopo** che la testata è uscita non ha nessuno dei due problemi: da 1024 è possibile.

Sotto 1024 la testata è sticky col logo, e quindi col cuore, sempre a schermo (`Header.tsx:202`): «sempre visibile» è già vero. Un badge rotante lì andrebbe a scatti (touch nativo, velocità di Lenis azzerata dopo 400 ms, idea-feedback:29) e starebbe in un margine di 5vw, cioè 19 px a 390: niente posto.

### 3.2 La forma: tre varianti

**M1, «Il cuore che si stacca» (raccomandata)**

- **Da 1280.** A scroll 0 il segno fisso sta esattamente sopra lo slot della testata: rettangolo misurato con `getBoundingClientRect()` di un segnaposto da 56 px lasciato in `Header.tsx:221-223`. Il primo schermo è identico. Nei primi `--dt-head-h` px di scroll (90 a 1440×900), in scrub, il centro scivola da `8vw + 28px` a `4vw` e la taglia scende da 56 alla misura del margine; la y resta sull'asse della testata (`headH / 2`). Risalendo torna nello slot.
- **Da 1024 a 1279,98.** Niente badge in testata a scroll 0 (A13 intatta). Fra `0.5·headH` e `headH` di scroll, in scrub, il segno compare nel margine: opacità 0 → 1 e scala 0,8 → 1. Speculare risalendo.
- **Misura.** `clamp(40px, 3.75vw, 56px)`, centro a 4vw: a 1024 occupa x 21-61 di un margine da 82 px; a 1280 x 27-75 su 102; a 1440 54 px, x 31-85 su 115; a 1920 56 px, x 49-105 su 154.
- **Pro:** si legge come lo stesso cuore che lascia la testata, e corregge l'errore di feedback P2, dove il segno compariva 85 px più a sinistra e più piccolo (idea-feedback:194). Testata a scroll 0 invariata. Un'istanza sola che gira, niente orologio condiviso.
- **Contro:** un elemento fisso nuovo su ogni pagina (l'inventario di `DESIGN.md:400` cambia; eccezione dichiarata a D14). Il rosso del cuore in ogni schermata pesa sulla regola del rosso contato (`DESIGN.md:347`): dichiarato.

**M2, «Compare nel margine solo da xl»** (feedback P2)

48 px a 4vw, ingresso 0,6 s e uscita 0,3 s a tempo, con un IntersectionObserver sulla testata.
- Pro: A13 intatta a ogni larghezza.
- Contro: due cuori in due posti e di due misure, quindi si legge come un secondo logo; niente fra 1024 e 1279; è a tempo, non legato allo scroll come in Era.

**M3, «Fisso nello slot della testata, a 8vw»**

Il segno resta dov'è oggi.
- Contro: a 8vw cominciano titoli e occhielli (`globals.css:440-442`), quindi starebbe sopra il testo di ogni capitolo. **Esclusa.**

**Montaggio di M1**
- Client component nuovo `app/components/motion/MarkSegno.tsx`, reso da Header come fratello **dopo** `<header>` (Header restituisce un frammento): fuori dal contesto di impilamento `lg:relative z-50` (`Header.tsx:202`).
- `aria-hidden`, `pointer-events-none`, classe `dt-segno`, attributo `hidden` in SSR, `z-40`: sotto il banner cookie z-60 (`CookieConsent.tsx:197`) e i dialoghi z-70 (`VideoLightbox.tsx:103`); il preloader z-96 lo copre.
- Nel ramo `${MQ.motionOk} and ${MQ.lg}`: `gsap.set(el, { opacity, x, y, scale })` **prima** di togliere `hidden`; il revert di matchMedia lo rimette.
- Non è un link: il cuore cliccabile resta il logo in testata, e il segno lascia passare il clic.
- Da 1280, nel ramo attivo, il badge della testata diventa segnaposto: opacità 0 nello stesso frame in cui compare il segno fisso (mai due cuori), e il suo ticker non parte (`RotatingMark` riceve `inert` dal Header).
- Su `/case/*`, con reduced-motion o senza JS, `RotatingMark` resta com'è oggi.
- In `gsap.ts:131-141` si aggiunge `xl: "(min-width: 1280px)"`, documentata nel commento «DUE SOGLIE» (`gsap.ts:114-121`) come soglia di chrome.

### 3.3 Il cambio di tema: tre varianti

**T1, «Le tacche virano» (raccomandata)**

- **Cosa cambia.** Le tacche prendono `color` grafite #46423d (`--color-ink`, `globals.css:55`) sull'avorio e avorio #f9f5ef (`--color-cream`, `:59`) quando il centro del segno sta su una zona `[data-bg="foto"]`. Una zona `[data-bg="foto-chiara"]` tiene la grafite: è la distinzione light/dark di Era (catalogo C1). Il monogramma resta #595a58 e #e30716 (`logo-colore.test.ts:55-67`): nessuna prop, nessun filtro, nessun disco.
- **CSS:**
  ```css
  .dt-segno { color: var(--color-ink); transition: color var(--td-duration-fast) var(--td-ease-smooth-out); }
  .dt-segno[data-tema="foto"] { color: var(--color-cream); }
  @media (prefers-reduced-motion: reduce) { .dt-segno { transition: none; } }
  ```
- **Token transitions.dev.** `--td-duration-fast: 250ms` e `--td-ease-smooth-out: cubic-bezier(0.22, 1, 0.36, 1)` (`_root.css:13` e `:18`, usi «icon swap» e «position change»). Si installano **col prefisso `--td-`**: `_root.css:19-20` definisce `--ease-out` e `--ease-in-out`, che Tailwind 4 ha già, e i nomi nudi li sovrascriverebbero in tutto il sito (la stessa trappola di timing P1). I token di blur (`_root.css:36-38`) non si installano.
- **Rilevatore**, una volta per frame solo quando cambia lo scroll di Lenis, più al resize e a `ScrollTrigger.refresh`:
  - (a) zone = `document.querySelectorAll("[data-bg]")`, ricalcolate al cambio di `pathname`;
  - (b) candidate = zone il cui rettangolo contiene il centro `(cx, cy)`, non `display:none` e non `visibility:hidden`;
  - (c) `top = document.elementFromPoint(cx, cy)`: il segno, `pointer-events-none`, non conta, e nemmeno gli strati foto `pointer-events-none`;
  - (d) vince la candidata la cui `section` più vicina (o `[data-bg-scope]`) contiene `top`. Così un pannello che copre una zona sticky (Posizionamento sopra l'hero, la cartolina, il footer) la spegne;
  - (e) si scrive `data-tema`.

  È la lezione di 6a33f85: sovrapposizione ≠ visibilità (idea-feedback:231). La soglia resta quella di Era, il centro del singolo elemento fisso (catalogo C1).
- **Contratto con le altre corsie.** Chi possiede una zona foto mette `data-bg` sull'elemento il cui rettangolo coincide con la foto **visibile**, e lo aggiorna quando un ritaglio ne cambia l'area:
  - banda dell'hero: `data-bg="foto"` dopo la `className` di `[data-hero-media]` (`HeroCinematic.tsx:407-409`). La regex `data-hero-media[\s\S]{0,200}h-\[var\(--dt-band-h\)\]` (`intro-clocks.test.ts:424`) resta verde se l'attributo sta dopo la classe;
  - banda di PageHero: `[data-dive-band]` (1.2);
  - Congedo e cartolina: la section (`Congedo.tsx:82-86`) o la cornice della cartolina, aggiornata dall'`inset`;
  - cinque stelle: `.dt-starrev_intro` (`StarReviews.tsx:654`), acceso da `onUpdate` solo nel tratto del film in cui la foto copre l'angolo;
  - foto del territorio in HorizonStory;
  - tessere della rotaia;
  - tessere di Voci;
  - finestra di Open Domus.
- **Pro:** sono le parole di Alberto, il logo resta intatto, è la tecnica di Era con un test di visibilità.
- **Contro:** tacche da 1 px a opacità 0,5-0,9 (`MarkBadge.tsx:55-56`) si leggono poco sulle foto in entrambi i colori; un hit-test per frame (costo basso); un contratto di attributi su ogni zona foto.
- **Guardia:** `app/components/__tests__/data-bg.test.ts`, con elenco esplicito delle zone più una regola sui margini negativi `-mx-[5vw]`/`-mx-[8vw]` e sulle section `w-full` con Image o video (idea-feedback:232).

**T2, «Il segno si toglie di mezzo»** (feedback P3)

Opacità 0 sopra le foto.
- Pro: nessun colore da gestire.
- Contro: non è «sempre visibile» e non è un cambio di tema. Nei sei corridoi il cuore sparisce.

**T3, «Nessun cambio»**

Tacche sempre grafite.
- Pro: zero codice.
- Contro: non è quel che ha chiesto Alberto, e le tacche grafite su una foto scura spariscono.

**Esclusi**
- monogramma ricolorato o variante chiara: C19 e direttiva cliente del 2026-08-26 (`logo-colore.test.ts:1-4`);
- disco o pastiglia sotto il segno: C19, C01;
- ombre, aloni, `mix-blend-mode: difference`: C14, `DESIGN.md:580`. La regex del test non vieta il blend, ma il blend ricolora il marchio;
- verso invertito: C06.

**Punto nuovo da dichiarare.** Le tacche avorio del monogramma sopra le foto: non sono lettere, nessuna ombra. Va aggiunto all'elenco di `DESIGN.md:583`.

**Eccezione da misurare.** A 1280 il palco delle cinque stelle comincia a ~52 px (`StarReviews.tsx:698`, `max-w-[1240px] px-8`). Se il segno copre del testo lì, quella zona prende `data-bg="nastro"`, il segno va a opacità 0 in 0,3 s, e l'eccezione si dichiara.

### 3.4 La velocità

- **Formula:** `speed = 30 + 10 · Math.min(Math.abs(velocity), VMAX)`. Sempre oraria: `Math.abs`, mai `Math.sign` (C06).
- **VMAX** si fissa con una misura Playwright headless a 1440×900 su tre casi: colpo di rotella, End/Home nativi, clic su un'ancora con `anchors: true`. Valore provvisorio 60 px/frame, cioè al massimo 630°/s. Il tetto va messo comunque: oggi un End nativo dopo l'armamento dà una velocità pari all'intero salto (idea-feedback:148).
- **Ease invariate** (`DESIGN.md:529`): accelerazione 0,3 s «domus» (`gsap.ts:66`); rientro dopo 100 ms di quiete in `dur.transition` 1,1 s «domus» (`gsap.ts:90`).
- **Armamento** `once` e `passive`: `wheel`, `touchmove`, `keydown` su ArrowUp/Down, PageUp/Down, Space, Home, End. Il `keydown` si ignora se il bersaglio è `input`, `textarea`, `select` o contenteditable.
- **Ticker** con `dt = min(deltaMS, 100)` (`RotatingMark.tsx:61`); niente `gsap.set` mentre il segno è nascosto o c'è `html[data-preloader]`.
- **Test nuovo** `app/components/__tests__/mark-orario.test.ts`: con `soloCodice`, `MarkSegno.tsx` e `RotatingMark.tsx` contengono `Math.abs(velocity)` e `Math.min(`, e non contengono `Math.sign(`. Il commento scaduto di `RotatingMark.tsx:9-15` si riscrive.

### 3.5 Stati e test

- **Reduced-motion:** nessun segno fisso; testata come oggi (badge fermo da xl, `RotatingMark.tsx:20-22`).
- **Senza JS:** `hidden` resta; testata come oggi.
- **Sotto 1024:** nessun segno; il logo nella testata sticky.
- **`/case/*`:** nessun segno; `RotatingMark` in testata come oggi.
- **Preloader attivo:** coperto; ticker fermo.
- **`e2e/segno.spec.ts` nuovo** (motion no-preference):
  - 1440, scroll 0: il rettangolo del segno coincide con lo slot entro ±1 px e il badge della testata ha opacità 0;
  - scroll 1200: centro a 4vw ±1 px;
  - /vendi a scroll 200: `data-tema="foto"`; su `#voci`: grafite;
  - 1279: a scroll 0 nessun badge in testata, a scroll 200 segno a opacità 1;
  - 1023 e reduced-motion: `hidden`;
  - su /, /vendi e /metodo, un viewport alla volta, a 1024, 1280 e 1440: intersezione del rettangolo del segno con h1-h3, `a` e `button` = 0, salvo le zone `nastro` dichiarate.

---

## 4. Il preloader corto su ogni rotta (A18, A20)

### 4.1 La porta sulle pagine interne: tre opzioni

**A. Film intero senza sagoma sulle pagine interne.** 4,63 s, `[data-pre-figure]` spento.
- Pro: A02 uguale ovunque.
- Contro: 4,63 s di scroll fermo su chi arriva da Google su /vendi, contro C05 «preloader più veloce»; la porta si apre su titolo e banda senza la stanza che torna.

**B. Corta alla prima entrata su una pagina interna (raccomandata).** 2,38 s, porta e tuffo, senza sagoma.
- Il film resta della home e suona al primo caricamento completo di «/» nella sessione, anche se la sessione è cominciata altrove.
- Pro: il film sta dove il patto regge, la corta dappertutto (A20 alla lettera); chi atterra su una pagina interna aspetta la metà; nessuna geometria da mantenere.
- Contro: chi visita solo pagine interne non vede mai il film intero; il pannello espresso compare a ogni caricamento (D05, domanda aperta 7).

**C. Film con la banda di quella pagina come sagoma.**
- Servirebbe un ritaglio con canale alpha per ogni foto di testa (11 file per 2 taglie) e un token di scatola condiviso.
- La banda di PageHero comincia a una quota che dipende da titolo, lingua e larghezza (`PageHero.tsx:71-75`): nessuna scatola fissa, e il patto non si potrebbe presidiare come in `intro-clocks.test.ts:414-421`.
- **Esclusa.**

### 4.2 La macchina a stati

Chiave `dt-intro-seen` (`INTRO_KEY`, `intro-constants.ts:21`), quattro stati:
- assente;
- `"1"` (`INTRO_FILM`): il film è stato armato, scritto dal boot script **all'armamento** come `hasVisited` di Era (`main.pretty.js:1-10`);
- `"c"` (`INTRO_SHORT`): è stata armata una corta e mai il film;
- `"q"` (`INTRO_QUIET`): silenzio, per la fixture e2e.

Scrivere all'armamento è sicuro: il boot script gira una volta per documento, e StrictMode e HMR non lo rieseguono (idea-preloader:311-315).

Condizioni, in ordine:

```
gate  = m && !deep && vis && !caso && k !== "q" && nav !== "back_forward"
pre   = gate && home && k !== "1"                    // film intero
short = gate && !pre && cssOk && !(ricarica && ultimaY > 0.5 · innerHeight)
```

| # | Caso | Chiave prima | Rotta | Esito | Chiave dopo |
|---|---|---|---|---|---|
| 1 | prima entrata, scheda visibile | assente | / | film intero, sagoma | `"1"` al boot |
| 2 | prima entrata | assente | interna | corta senza sagoma | `"c"` |
| 3 | ricarica o nuova entrata | `"1"` | / | corta con sagoma (patto intatto) | `"1"` |
| 4 | prima entrata in home dopo una corta | `"c"` | / | film intero | `"1"` |
| 5 | entrata successiva | `"1"` o `"c"` | interna | corta senza sagoma | invariata |
| 6 | navigazione client (Link) | qualsiasi | qualsiasi | niente: il boot script non gira | invariata |
| 7 | back/forward | qualsiasi | qualsiasi | niente | invariata |
| 8 | ancora nell'URL | qualsiasi | qualsiasi | niente | `"1"` solo su «/» (oggi su ogni rotta, `layout.tsx:102`) |
| 9 | reduced-motion | qualsiasi | qualsiasi | niente | invariata |
| 10 | scheda nascosta o prerender al boot | qualsiasi | qualsiasi | niente, e la sessione non si consuma | invariata |
| 11 | ricarica a metà pagina (scroll salvato > 50vh) | qualsiasi | qualsiasi | niente | invariata |
| 12 | `/case/*` | qualsiasi | /case/* | niente (D20) | invariata |
| 13 | senza `@property` o `mask-composite` | `"1"`/`"c"` | qualsiasi | niente corta (nessun ripiego GSAP); il film intero col suo ripiego come oggi | invariata |
| 14 | `?intro` | tolta | / film; interna corta | come righe 1-2 | come righe 1-2 |
| 15 | fixture e2e | `"q"` | qualsiasi | niente | `"q"` |

Una scheda nascosta **a metà** film chiude il sipario come oggi (`Preloader.tsx:759-762`), e la chiave è già `"1"`: al caricamento successivo parte la corta. Dichiarato.

### 4.3 Il boot script (`layout.tsx:102`)

Costanti interpolate, nessun numero sparso (`intro-clocks.test.ts:137`). Nel template string i backslash delle regex vanno raddoppiati.

```js
try{
var h=document.documentElement; /* data-locale come oggi */
var m=matchMedia("(prefers-reduced-motion: no-preference)").matches;
var deep=!!location.hash, p=location.pathname, home=p==="/", caso=/^\/case\//.test(p);
var ne=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];
var nav=ne?ne.type:"navigate";
var vis=document.visibilityState==="visible"&&!document.prerendering;
var cssOk=typeof CSS!=="undefined"&&"registerProperty" in CSS&&CSS.supports("mask-composite","add");
if(!deep&&/[?&]intro(&|=|$)/.test(location.search)){try{sessionStorage.removeItem("${INTRO_KEY}")}catch(e){}}
if(deep&&home){try{sessionStorage.setItem("${INTRO_KEY}","${INTRO_FILM}")}catch(e){}}
var k=null;try{k=sessionStorage.getItem("${INTRO_KEY}")}catch(e){}
var ly=0;if(nav==="reload"){try{var s=JSON.parse(sessionStorage.getItem("${LAST_Y_KEY}")||"null");if(s&&s.p===p)ly=s.y}catch(e){}}
var gate=m&&!deep&&vis&&!caso&&k!=="${INTRO_QUIET}"&&nav!=="back_forward";
var pre=gate&&home&&k!=="${INTRO_FILM}";
var short=gate&&!pre&&cssOk&&!(ly>innerHeight*${RELOAD_KEEP_Y});
var lk=function(u,q){/* preload della sagoma, come oggi */};
if(pre){ /* ramo di oggi, invariato, più: */ try{sessionStorage.setItem("${INTRO_KEY}","${INTRO_FILM}")}catch(e){} }
else if(short){
  h.setAttribute("data-preloader",home?"short":"short-page");
  window.__dtPreArmed=1;window.__dtPreT0=performance.now();
  if(home){lk("/media/raffaela-sagoma-m.webp","(max-width: 767.98px)");lk("/media/raffaela-sagoma.webp","(min-width: 768px)")}
  if(!k){try{sessionStorage.setItem("${INTRO_KEY}","${INTRO_SHORT}")}catch(e){}}
  var fineS=function(){h.removeAttribute("data-preloader")};
  window.__dtPreFailsafe=setTimeout(fineS,${PRE_SHORT_FAILSAFE_MS});
}
if(m){var v=pre?"intro":short?"short":"";h.setAttribute("data-hero-rest",v);h.setAttribute("data-hero-intro",v);h.setAttribute("data-dt-paint",short?"short":"")}
if(!pre&&!short&&!/(^|; )dt_consent=(accepted|rejected)(;|$)/.test(document.cookie)){h.setAttribute("data-consent","")}
}catch(e){}
```

Tre punti che si rompono se sbagliati:
- `fineS` non scrive la chiave: se scrivesse `"1"` dopo una corta interna, la home non darebbe più il film;
- `finish(true)` deve scrivere `"1"` solo fuori dalla corta (4.5);
- il banner cookie aspetta l'handoff anche nella corta (`!pre&&!short`), come oggi col film (`layout.tsx:66-75`).

`Preloader.tsx` scrive `{p, y}` in `LAST_Y_KEY` al `pagehide` (listener nel primo `useEffect`, `Preloader.tsx:204-226`).

### 4.4 La corta

**Tempi**, orologio CSS, t = 0 al primo paint:
- **porta** 0 → 1,10 s, `cubic-bezier(0.66, 0, 0.22, 1)` (domus.inOut, `gsap.ts:67`), `--arch-y` 104vh → 15vh, `--arch-w` 24 → 36vw (40 → 58vw e 16vh sotto 768, `globals.css:1322-1330`);
- **tuffo** 0,88 → 2,38 s, `cubic-bezier(0.6, 0, 0, 1)` (dtDiveIn), dal valore della porta a progresso 0,8: `--arch-k` resta 0,972, perché 0,88/1,10 = 0,8;
- **sagoma**, solo su «/»: `dt-pre-in-fade 0.3s linear 0s both`. Finisce a 0,30 s con la porta a 95,6vh; la porta arriva al fondo della banda verso 0,46 s (idea-preloader:195);
- **handoff** `INTRO_EVENT` a 0,88 s, all'`animationstart` del tuffo (`Preloader.tsx:539-545`); fine 2,38 s, autohide 2,48 s, failsafe 2,98 s.

Totale 2,38 s, il 51 % dei 4,63: «stesso film dimezzato» (A02) applicato a porta e tuffo. In Era la corta è il 37 % (3,75 su 10,15, catalogo §1).

**Cosa salta:** tutto `[data-pre-content]`, cioè badge sul disco, lockup, firma, didascalie, linea di carica, payoff (Era `.preloader_ctn{display:none}`, `main.pretty.js:105-107`). Nella corta spariscono tre delle quattro contraddizioni del preloader (C04, disco carta C19, lockup Playfair C18, `DESIGN.md:549-553`). Restano il pannello espresso e l'arco.

**Costanti** in `intro-constants.ts`, tutte derivate:

```ts
export const INTRO_FILM = "1";
export const INTRO_SHORT = "c";
export const INTRO_QUIET = "q";
export const LAST_Y_KEY = "dt-last-y";
export const RELOAD_KEEP_Y = 0.5;
export const SHORT_T = {
  dive: 0.8 * INTRO_T.archDur,      // 0,88
  archDur: INTRO_T.archDur,         // 1,10
  diveDur: INTRO_T.diveDur,         // 1,50
  figureDur: 0.3 * TEMPO,
} as const;
export const SHORT_MS = Math.round((SHORT_T.dive + SHORT_T.diveDur) * 1000);   // 2380
export const PRE_SHORT_AUTOHIDE_MS = SHORT_MS + 100;                            // 2480
export const PRE_SHORT_FAILSAFE_MS = SHORT_MS + 600;                            // 2980
export const HERO_REST_SHORT_MS = Math.round((SHORT_T.dive + 0.2) * 1000);     // 1080
export const PAINT_NET_MS = 2500;
```

Il commento di `intro-constants.ts:20` («una volta per sessione») si riscrive.

**CSS**, in `globals.css` dopo `:1077` e prima dello skip (`:1124`). Stessa specificità (0,3,1) della regola di `:1072`, quindi deve venire dopo:

```css
html[data-preloader^="short"] .dt-preloader [data-pre-content] { display: none; }
html[data-preloader="short"] .dt-preloader [data-pre-figure] { animation: dt-pre-in-fade 0.3s linear 0s both; }
html[data-preloader="short-page"] .dt-preloader [data-pre-figure] { display: none; }
html[data-preloader^="short"]:not([data-pre-gsap]) .dt-preloader { animation-delay: 0s, 0.88s, 2.48s; }
html[data-hero-rest="short"] .dt-hero-rest { animation: dt-rest-failsafe 0.5s ease 1.08s forwards; }
html[data-hero-intro="short"] :is([data-hero-char], [data-hero-tchar], [data-hero-schar]) { animation: dt-rest-failsafe 0.5s ease 1.08s forwards; }
```

Tutti i lettori usano `hasAttribute("data-preloader")` (`Preloader.tsx:84`, `:205`, `:235`; `HeroCinematic.tsx:222`; `SmoothScroll.tsx:97`): i valori «short» e «short-page» non rompono niente.

**`Preloader.tsx`:**
- `const short = html.getAttribute("data-preloader")?.startsWith("short") ?? false`;
- con `short && !cssDrives`: `fireIntro(); finish(true); return;`, nessun ripiego;
- `diveAt`, `endAt` e `diveDur` da `SHORT_T` e `SHORT_MS` al posto di `:432-434`;
- `unwill()` subito; `scaldata = Promise.resolve()`, così `finish` non aspetta `runWarmup` fino a 4,5 s (`:403-404`, `:417-420`);
- nella corta nessun `pointerdown` né `keydown` (`:763-764`); restano `visibilitychange` e il cambio di reduced-motion (`:750-762`);
- `finish(completed)`: `if (completed && !short) sessionStorage.setItem(INTRO_KEY, INTRO_FILM)`; a corta finita `html.setAttribute("data-dt-paint", "")`;
- abort: riarmo del failsafe con `PRE_SHORT_FAILSAFE_MS` se `short` (`:798-801`);
- `window.scrollTo(0, 0)` resta (`:325`): con la riga 11 della tabella tocca solo chi è a meno di mezzo schermo dalla cima.

**`HeroCinematic.tsx`:** la rete di sicurezza (`:328`) usa `HERO_REST_SHORT_MS` quando `data-hero-rest="short"`; `heroNetFired` (`:136-156`) legge tre casi: intro, short, a caldo.

### 4.5 Lo skip: nella corta non c'è

1. La finestra utile è 0,88 s, prima del tuffo.
2. La regola dello skip (`globals.css:1134-1136`) manda la porta alla sua fine con un delay negativo: l'arco scatterebbe da ~95vh a 15vh.
3. La chiusura è garantita a 2,38, 2,48 o 2,98 s.
4. La corta di Era non ha skip.

Restano le chiusure per scheda nascosta e per reduced-motion attivato in corsa. Senza listener di tasti niente `preventDefault` che possa toccare un campo (`Preloader.tsx:728-737`). Il film intero tiene il suo skip (`DESIGN.md:545`). Decisione di lavoro D19.

### 4.6 `?intro`

La chiave si toglie prima di leggerla e dentro `!deep` (condizione di idea-preloader:279): con `/?intro` la home rifà il film intero, su una pagina interna parte la corta. La canonical della home è già «/» (`app/page.tsx:34`). Si documenta in `DESIGN.md:545` come strumento di verifica per Alberto e la cliente, senza link in pagina.

### 4.7 La linea di carica del film

La curva è già `loaderEase` di Era (`gsap.ts:79-81` = `main.pretty.js:24`). Si cambia solo la longhand `animation-timing-function` di `globals.css:1093-1111`: dai 17 punti a passo fisso ai 17 punti su ancoraggi e punti di errore massimo.

```
linear(0 0%, 0.154 6.5%, 0.283 12.9%, 0.378 18.6%, 0.414 21.2%, 0.442 23.8%, 0.482 28.2%, 0.504 31.3%, 0.54 39.6%, 0.584 52.2%, 0.595 53.9%, 0.615 55.8%, 0.75 65%, 0.826 71.4%, 0.866 76%, 0.91 82.6%, 1 100%)
```

Errore massimo da 0,0087 a 0,0032, medio da 0,00168 a 0,00137 (idea-preloader:121). Resta il ripiego `cubic-bezier(0.2, 0.45, 0, 0.25)` (`:1092`). Il commento di `:1078-1087` passa da «ogni 1/16» a «ancoraggi del path più punti di errore massimo». Nella corta la linea non c'è.

### 4.8 La ricarica a metà pagina

Riga 11 della tabella, decisione di lavoro D21. `Preloader.tsx:322-325` riporta in cima chi ricarica. Con la home più lunga di 3-4 schermi (memoria :14) una corta a ogni ricarica butterebbe via la posizione. A18 dice «alle ricariche»: la corta suona sulle ricariche vicino alla cima.

### 4.9 LCP e CLS: attesi e misura

**Attesi.**
- LCP invariato: la foto di testa è in `preload` (`PageHero.tsx:119`, `HeroCinematic.tsx:421`) e l'overlay è un layer fixed che non ritarda il paint (`Preloader.tsx:54-55`). Il pannello ha solo gradienti (`globals.css:810-813`), che non sono candidati. Nella corta interna non c'è sagoma.
- CLS 0: overlay fixed; corridoio che cresce sotto la piega (1.6).

**Misura**, script nuovo `scripts/probe-intro-reload.mjs`, Playwright headless su build `next start` (non Turbopack dev, che serve la CSS con un'edizione di ritardo):
- **rotte:** /, /vendi, /contatti;
- **larghezze e rete:** 390 con CPU ×4 e Slow-4G via CDP; 1440 senza freno e con CPU ×4;
- **sequenza:** primo caricamento, ricarica, navigazione nuova; 5 giri per caso, HEAD contro ramo;
- **raccolta** con `addInitScript`: `largest-contentful-paint` (buffered, tag e url), `layout-shift` senza `hadRecentInput`, istante in cui cade `data-preloader`;
- **soglie:** LCP mediano della ricarica ≤ HEAD + 100 ms e ≤ 2,5 s a 390 Slow-4G; CLS = 0; attributo caduto entro `SHORT_MS + 600` ms.

### 4.10 Cosa cambia in `intro-clocks.test.ts` e negli e2e

**`intro-clocks.test.ts`**
- `:130-143` failsafe: resta `setTimeout(fine,${PRE_FAILSAFE_MS})`, si aggiunge `setTimeout(fineS,${PRE_SHORT_FAILSAFE_MS})`; la lista vietata di `:137` diventa `/\b(1800|2500|4500|5230|2380|2980)\b/`.
- `:145-148` chiave: `getItem("${INTRO_KEY}")` una volta sola. Asserzioni nuove sugli stati interpolati (`${INTRO_FILM}`, `${INTRO_SHORT}`, `${INTRO_QUIET}`); il ramo `short` non contiene `setItem("${INTRO_KEY}","${INTRO_FILM}")`; `fineS` non scrive la chiave.
- Nuovo: il `gate` contiene `back_forward`, l'esclusione di `/case/`, `visibilityState`, `prerendering`; `short` dipende da `registerProperty` e `mask-composite`; il ramo `?intro` sta dentro `!deep` e prima di `getItem`.
- `:158-164` autohide: restano due occorrenze della shorthand; si aggiunge il testo esatto `animation-delay: 0s, ${SHORT_T.dive}s, ${PRE_SHORT_AUTOHIDE_MS / 1000}s`.
- `:175-195` porta e tuffo: invariato; si aggiunge `SHORT_T.dive / SHORT_T.archDur === 0.8`, quindi `--arch-k` invariato.
- Nuovo: `0.45 ≤ SHORT_MS / INTRO_MS ≤ 0.55` («dimezzata»); `PRE_SHORT_AUTOHIDE_MS = SHORT_MS + 100`; `PRE_SHORT_FAILSAFE_MS = SHORT_MS + 600`.
- `:197-212` linea: 17 punti, dentro il campo 12-20, verde.
- `:229-241` skip: invariato; nessuna regola `[data-pre-skip]` nomina `short`.
- `:250-275` hero-rest: le reti `dt-rest-failsafe` passano da **quattro a sei** (due a 1,08 s = `HERO_REST_SHORT_MS`). La regex di `:273` diventa `h\.setAttribute\("data-hero-rest",v\)` più l'asserzione `v=pre\?"intro":short\?"short":""`.
- Nuovo: due regole `dt-paint-net`, a `PAINT_NET_MS` e a `HERO_REST_SHORT_MS`; `data-dt-paint` solo dentro `if(m)`.
- `:364-385` Preloader: `SHORT_MS` e `SHORT_T` importati; il ramo `short` non attacca `pointerdown` e `keydown`; `finish` scrive la chiave solo con `!short`.
- `:405-436` patto: invariato; si aggiunge che `short-page` spegne `[data-pre-figure]` e che `^="short"` spegne `[data-pre-content]`.

**e2e**
- `mobile-motion.spec.ts:386` (`["/", "/acquista"]`): il film intero solo su «/». /acquista diventa il test della corta interna: attributo `short-page` visto, `[data-pre-content]` e `[data-pre-figure]` a `display:none`, durata < `SHORT_MS + 170`.
- `mobile-motion.spec.ts:804-815` (g): alla seconda navigazione suona la corta.
- `mobile-motion.spec.ts:1027-1093`: diventa «alla seconda navigazione della home suona la corta con la sagoma». Le asserzioni `visto === false` (`:1057-1060`) e `getAnimations(...).length === 0` (`:1069-1075`) si ribaltano.
- `mobile-motion.spec.ts:1142-1168`: reduced-motion anche sulla visita di ritorno.
- `home.spec.ts:40-49`: l'H1 resta visibile entro 4 s; titolo e commento cambiano.
- `helpers.ts:120-130`: la fixture `goto` scrive `INTRO_QUIET`.
- Nuovi: `page.goBack()` senza sipario; `/?intro` con chiave `"1"` rifà il film; `/case/<slug>` alla prima atterrata senza sipario (se passa D20); ricarica a 2 schermi su / senza corta.

---

## 5. Superfici da aggiornare

Prima del codice: A18, A19 e A20 nel registro. Poi i documenti col costruito, nello stesso commit che lo applica. Prima di toccare spec, `DESIGN.md` e `PRODUCT.md`: `git fetch` e confronto con `origin/claude/rivista-bianca` (Alberto li aggiorna dal portatile).

### 5.1 Spec `docs/superpowers/specs/2026-09-10-redesign-rivista-bianca-design.md`

**§11.1, Alberto, dopo A17 (`:406`):**

| ID | Data | Parole esatte | Stato e applicazione | Fonte |
|---|---|---|---|---|
| A18 | 2026-09-13, risposta alla domanda sul budget di movimento | «Coreografia piena» | **Da applicare.** Ogni capitolo della home con un comportamento suo legato allo scroll, entrate e uscite speculari, monogramma sempre visibile con cambio di tema sopra le foto, versione corta del preloader alle ricariche. Supera C03 e il Don't di `DESIGN.md` sui tre nastri: domanda aperta 13. | transcript 2026-09-13; memoria `domus-coreografia-era.md` |
| A19 | 2026-09-13, risposta alla domanda sui corridoi | «Sticky dove serve» | **Da applicare.** Sei corridoi sticky in home (tuffo dell'hero, «Perché Domus Tua», cinque stelle, finestra di Open Domus, rotaia del team, cartolina del congedo), da 1024 px con motion ok, sempre `position: sticky` su un corridoio, mai il pin di GSAP. Domanda aperta 13. | come sopra |
| A20 | 2026-09-13, risposta alla domanda sull'impianto | «Fedeltà letterale» | **Da applicare.** In home un comportamento diverso per capitolo (easing, durata e trigger); tuffo sticky sulle 11 PageHero; flip per lettera su tutti i titoli; preloader corto su ogni rotta. Il rischio su LCP e H1 è accettato e si ingegnerizza: stato dipinto a 0,02 dal boot script, mai testo nascosto in CSS. Domanda aperta 13. | come sopra |

**§11.1, stati da riscrivere:**
- C03 (`:367`): «**Superata da A18-A20** (Alberto, 13 set.), da mostrare alla cliente: domanda aperta 13. Restano tolte transizioni di pagina, `Cursor`, `Magnetic`.»
- C05 (`:369`): aggiungere «Dal 13 settembre (A18, A20) il film resta 4,63 s alla prima apertura della home; ogni altro caricamento completo ha la corta da 2,38 s.»
- C06 (`:370`): «segno fisso da 1024 px (M1), velocità `30 + 10·min(|v|, VMAX)`, sempre oraria.»

**§11.2, decisioni di lavoro.** I numeri seguono l'allocazione della critica (§2): D16 flip, D17 lessico, D18 barra. Per questa corsia:

| ID | Parole | Stato |
|---|---|---|
| D19 | «nella corta niente skip: la finestra utile è 0,88 s e lo skip farebbe scattare la porta» | da applicare |
| D20 | «/case/[slug] fuori da ogni sipario: pagina di conversione» | **richiede il sì di Alberto** |
| D21 | «ricarica a metà pagina: niente corta» | da far vedere ad Alberto |
| D22 | «sulle pagine interne la corta senza sagoma: il patto vale solo per la banda della home» | da applicare |
| D23 | «il segno si stacca dalla testata e scivola nel margine; le tacche virano sopra `data-bg="foto"`, il monogramma no» | da applicare |
| D24 | «nel tuffo la base resta a 100vw per l'LCP; lo strato a 200vw arriva dopo, a opacità 0» | da applicare |
| D25 | «foto della villa nelle teste di sette pagine» | condizionata alla §2.2 del documento per la cliente |

**§11.2, note alle voci esistenti:**
- D05 (`:419`): «dal 13 settembre il pannello compare anche per 2,38 s a ogni caricamento completo».
- D14 (`:428`): «eccezione: il segno fisso da 1024 px (D23)».
- D15 (`:429`): «PageHero con corridoio (A20); la calligrafia sulle foto della villa legge meno (misura in lane-globali §1.9)».

**§11.3 domande:**
- 12: il replay del 4 agosto (critica).
- 13: «A18-A20 contro C03: la cliente vede la coreografia e decide».
- 14: «una villa sola illustra sette pagine interne».

**Altre sezioni:**
- §3.5 (`:188-193`): il titolo «tre gesti e basta» riceve l'aggiornamento del 13 settembre col rimando ad A18-A20.
- §4 (`:217-226`): nota sul segno.
- §5 (`:228-237`): PageHero col tuffo.
- §6 (`:252-255`): macchina a stati del preloader.

### 5.2 `DESIGN.md`

- `:345` Regola dell'unico fondo: «…il pannello del preloader: 4,63 s alla prima apertura della home, 2,38 s agli altri caricamenti completi (Alberto, 13 set.).»
- `:394` Primo schermo delle pagine interne: il tuffo (corridoio 220svh da 1024, zoom 1 → 2 a 50% 75%, equivalenti sotto), `objectPosition` per pagina.
- `:400` Elementi fissi: il segno da 1024 px.
- `:401` Breakpoint: «il segno fisso da lg; in testata da xl solo a scroll 0».
- `:405` Elevation: le teste delle pagine interne si ingrandiscono nel tuffo, sempre senza velo.
- `:488` Navigation: il monogramma si stacca.
- `:509` Media a tutta larghezza: via «l'hero delle pagine interne la spegne sul telefono», dentro l'equivalente 1,06 e 1,08.
- `:499-504` La regola dei `sizes`: aggiungere PageHero (1.7).
- `:529` Monogramma rotante: riscritto con M1, T1, tetto, armamento da tastiera.
- `:542-557` Preloader: tempi della corta, macchina a stati, `?intro`, linea a 17 punti; «Quando suona» riscritto.
- `:573` Do del movimento e `:587` Don't sui tre nastri: riscritti con i sei corridoi più il tuffo delle pagine interne, citando A18-A20.
- `:582` Don't sull'espresso: «l'espresso del preloader resta una domanda aperta; dal 13 settembre torna nella corta per scelta di Alberto, non si estende altrove».
- `:583` punti su immagine: aggiungere le tacche avorio del segno.
- `:591` Don't sul repertorio: la testa di /chi-siamo resta l'unica eccezione.

### 5.3 `PRODUCT.md`

- `:127-141` Motion: via «tre gesti», «TRE nastri», «Nessun'altra sezione è pinnata»; il preloader «una volta per sessione» diventa film sulla home e corta altrove; tutto con «(Alberto, 13 set.; da mostrare alla cliente)».
- `:153-156` Testata: «il monogramma solo da xl» → segno fisso da 1024.
- `:168-171` Media: «nella testa di nove pagine interne su undici» → «in una» (/chi-siamo).

### 5.4 `.impeccable/design.json`

- `:381-383` voce `parallax`: via il riferimento all'hero delle pagine interne.
- Voci nuove `page-hero-dive` (valori di 1.3 e 1.5), `segno` (M1 e T1, token `--td-*`), `preloader-short` (valori di 4.4).
- `:401-403` `rotating-mark`: riscritta.
- `:406-408` `preloader`: aggiungere la macchina a stati.
- `:545`, `:550` («non torna nella sessione»), `:613`, `:622`, `:627`: riscritte come in `DESIGN.md`.

### 5.5 `docs/da-chiedere-alla-cliente.md`

Sotto «Sul nuovo aspetto del sito», dopo `:415`:

> 27. **Più movimento di quello che avevate chiesto: va bene?** Nella chiamata del 10 settembre avete chiesto di «eliminare tante animazioni e transizioni». Il 13 settembre Alberto ha scelto la strada opposta, prendendo come modello il sito di Era Residence. Ogni capitolo della home si muove con lo scroll in un modo suo. In sei punti della home, e in apertura di ogni pagina interna, la pagina si ferma mentre scorrete e la foto si apre fino a riempire lo schermo. I titoli entrano lettera per lettera. Il simbolo del logo resta sempre visibile in alto a sinistra, e sopra le foto il suo cerchio di tacche diventa chiaro. A ogni apertura di pagina torna per 2,4 secondi la porta dell'animazione d'apertura; quella intera, 4,6 secondi, resta alla prima apertura della home. Restano fuori le cose che avevate escluso: niente curve, niente fiori, niente nero nelle pagine, niente veli sulle foto. Ve lo facciamo vedere in chiamata: tenete questa versione, la riduciamo, o torniamo a poche animazioni?
>
> 28. **Le foto della villa in apertura di sette pagine.** Useremmo le foto professionali della villa del video in apertura di Vendi, Acquista, Servizi, Metodo, Open Domus, Privacy e Cookie, al posto delle immagini di repertorio. Il proprietario ha autorizzato l'uso sul sito (vedi 2.2 e 6.2)? E vi va bene che una casa sola illustri tante pagine?

Alla 22 (`:411`) aggiungere: «Dopo la scelta del 13 settembre il fondo scuro compare anche per 2,4 secondi a ogni apertura di pagina.»

### 5.6 Commento di contratto in `app/page.tsx:60-73`

Da «La tecnica dei movimenti che restano» in poi:

> La tecnica dei movimenti viene dall'altro riferimento, era-residence.com (dossier reverse-engineering/era-residence), senza le sue cupole, i suoi fiori e le sue transizioni di pagina. Dal 13 settembre (Alberto, A18-A20 in spec §11, da mostrare alla cliente perché supera C03): ogni capitolo ha un gesto suo legato allo scroll e nessun capitolo condivide easing, durata o trigger; entrate e uscite speculari. Sei corridoi da 1024 px con motion ok, tutti position: sticky su un corridoio e nessuno col pin di GSAP: il tuffo dell'hero, «Perché Domus Tua», le cinque stelle, la finestra di Open Domus, la rotaia del team e la cartolina del congedo; sotto 1024 e con reduced-motion nessun corridoio e la pagina completa. A scroll 0 il primo schermo è quello descritto sopra (patto della porta). Il monogramma resta a schermo e sopra le foto le sue tacche virano; il logo non cambia colore. Il preloader intero suona alla prima apertura della home, la corta a ogni altro caricamento completo. Nessun cambio di tono fra i capitoli, perché il fondo è uno.

### 5.7 Commenti di codice da riallineare

- `Header.tsx:199-201` e `:210-220`
- `RotatingMark.tsx:3-15`
- `MarkBadge.tsx:67-76` (la «pastiglia chiara»)
- `PageHero.tsx:20-29`, `:81-82`, `:106-121`
- `Parallax.tsx:33-36` (PageHero non è più un chiamante)
- `gsap.ts:111-121` (MQ e `xl`) e `:68-78` (`dtEase`, `dtIn`)
- `layout.tsx:19-21`, `:76-92`, `:243-253`
- `intro-constants.ts:20`
- `Preloader.tsx:3-4`, `:52`
- `PropertyDetail.tsx`: commento di guardia (2.4)
- `motion.spec.ts:108-117`

---

## 6. Domande ad Alberto, di forma e non di budget

1. Il segno: M1 «il cuore che si stacca» da 1024 px con le tacche che virano (T1)? È la forma raccomandata.
2. D20: `/case/[slug]` fuori anche dal film intero, o come oggi?
3. D21: ricaricando a più di mezzo schermo dalla cima, niente corta?
4. La calligrafia sulle foto della villa legge meno (1.9): va bene così, o si riduce l'attraversamento a 0,5vw su quelle pagine?
5. /chi-siamo: quale scatto in testa (sede o team, almeno 2560 px)?
6. Una villa sola su sette pagine: la portiamo alla cliente insieme alla domanda 28?

## 7. Ordine di lavoro e rischi

**Ordine**
1. Registro: A18-A20 in §11 (5.1).
2. Test prima: `intro-clocks` rosso con le costanti nuove (4.10), poi costanti, boot script, CSS della corta, `Preloader.tsx`, fixture `"q"`; e2e del preloader.
3. Stato dipinto degli H1 (1.6), insieme alla primitiva della corsia tipografia.
4. `PageHeroDive` e `PageHeroBand`, CSS del corridoio, `sizes`, test del tuffo; esportazione delle foto (1.10).
5. `MarkSegno`, `data-bg` e rilevatore, test del segno; misura di VMAX.
6. Documenti (5.2-5.7); memoria: aggiungere `domus-coreografia-era.md` a `MEMORY.md` (critica §30).

**Rischi**
- Turbopack serve `globals.css` con un'edizione di ritardo: toccare due volte e misurare su `next start`.
- Ordine di refresh: il corridoio è il primo trigger, `refreshPriority: -1`; i trigger creati dopo `fonts.ready` vengono dopo.
- Cambio lingua: ogni split si rifà (key per locale, `TextLines.tsx:195`); il corridoio con `invalidateOnRefresh` rilegge Δt.
- Ripristino dello scroll alla ricarica mentre il corridoio si arma: da misurare a 1440 su /vendi (posizione ripristinata ±2 px).
- Peso dello strato nitido a 2560 (stima 350-500 KB AVIF q60): da misurare.
- Un hit-test per frame nel rilevatore: da misurare nel pannello Performance a 1440.
- `document.prerendering` esiste solo in Chromium: altrove vale `undefined`, e il ramo funziona lo stesso.
- Il fondo espresso a ogni caricamento allarga l'esposizione a C17 (domanda aperta 7).
