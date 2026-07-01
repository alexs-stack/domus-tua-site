# Il Segno Domus — sistema d’identità

Guida operativa al **Segno Domus**, la firma visiva ricorrente di Domus Tua.
Questo documento è il riferimento *pratico* per chi implementa: cosa significa il
segno, perché nasce dal logo, e **quale componente usare, dove e con quale misura**.

La grammatica concettuale (linea-tetto rossa + linea-abbraccio grigia) è raccontata
in `docs/brand-motif.md`; la palette e il tono in `docs/brand-direction.md`. Qui si
scende al livello del codice: i componenti vivono in **`app/components/BrandMotif.tsx`**.

---

## 1. Cos’è

Il Segno Domus non è un secondo logo: è la sua **grammatica ridotta a due tratti**,
riproposta sulle superfici del brand come firma discreta.

- **Linea-tetto (rossa)** — il segmento diagonale che scende come lo spiovente del
  tetto nel logo. Significa **riparo, casa, direzione, protezione**. È l’unico punto
  di rosso: colore `--color-red` (`#d20a0a`), stroke sottile (2.4px).
- **Abbraccio (grigio)** — la curva morbida e a bassa opacità sotto il tetto.
  Significa **accompagnamento e cura** — il lato umano, il “Tua”. Colore
  `--color-graphite`, opacità ~0.45, più fine del tetto (1.6px).
- **Angolo (firma)** — i bracket ad angolo (`SegnoDomusCorner`) sono la **firma
  Domus Tua** apposta su una superficie: incorniciano un contenuto premium senza
  ridisegnare nulla, come una sigla in un angolo.

> In una riga: **il rosso protegge, il grigio accoglie, l’angolo firma.**

---

## 2. Perché deriva dal logo attuale

Vincolo di brand (vedi `docs/logo-assets.md`): **il logo non si ridisegna**. Il Segno
Domus rispetta questo vincolo perché non aggiunge forme nuove — le *cita*:

- **Stessa geometria.** La linea-tetto è il path dello spiovente del logo casa+cuore;
  la curva-abbraccio nasce dalla rotondità del corpo-casa e dalla forma del cuore.
- **Stessa coppia cromatica.** Grafite come struttura, rosso come accento singolo:
  esattamente la logica **“Domus grigio + Tua rosso”**.
- **Stessa misura.** Il logo è lineare e sottile, con un solo pieno rosso (il cuore).
  Il Segno eredita questa disciplina: **linee, non campiture; un solo rosso per volta.**

Il Segno è quindi la firma del marchio replicabile ovunque, mentre il **logo vero e
proprio resta agli angoli di brand** (header, footer). I due non convivono da vicino.

---

## 3. I componenti (`app/components/BrandMotif.tsx`)

| Componente | Cos’è | Uso tipico |
| --- | --- | --- |
| **`SegnoDomus`** / `SegnoDomusLine` | Il segno base: linea-tetto (+ abbraccio opzionale via `embrace`). | Firma inline: eyebrow di sezione, sopra un titolo, nel footer. |
| **`MotifCorner`** | Accento d’angolo singolo in forte trasparenza (`opacity ~0.12`). | Watermark leggero nell’angolo di una card, sotto il contenuto. |
| **`SegnoDomusCorner`** | Un bracket ad angolo (rosso + grigio). Posizionabile via `className`, orientabile con `rotate`, dimensionabile con `size`. | Mattoncino base per cornici; raramente da solo. |
| **`SegnoDomusFrame`** | Quattro `SegnoDomusCorner` attorno ai `children`. | Incornicia **una** card premium (es. una scheda D.O.C., un blocco “fiducia”). |
| **`SegnoDomusVideoFrame`** | Overlay assoluto: 4 angoli + linea-tetto in alto, in trasparenza. Va in un contenitore `relative overflow-hidden`. | Cornice di un video/hero cinematografico o di un poster. |
| **`SegnoDomusDivider`** | Divisore con segno al centro e hairline sfumate ai lati (`tone: "line" \| "cream"`). Con `segno-hover-draw`. | Passaggio tra due sezioni, come firma al posto di un bordo piatto. |
| **`SegnoDomusBackground`** | Texture tenue di linee-tetto ripetute, con mask radiale (`opacity` regolabile, default 0.05). | Fondo di una banda piena (es. CTA), a bassissima opacità. |
| **`SegnoDomusBadge`** | Pill con mini-segno + etichetta (`light` per fondi scuri). | Eyebrow/etichetta di fiducia sopra un titolo o su un hero. |

Tutti i componenti sono `aria-hidden` (decorativi) e usano `--color-red` /
`--color-graphite` / `--color-line`: **nessun colore fuori palette**.

### Animazioni (già in `globals.css`)

- **`segno-draw`** — la linea-tetto “si disegna” una volta al load. Riservata allo **Hero**.
- **`segno-hover-draw`** — la linea si ridisegna al passaggio (usata da `SegnoDomusDivider`
  e attivabile su `.group:hover`).
- Entrambe rispettano `prefers-reduced-motion`: a movimento ridotto il segno resta statico e completo.

---

## 4. Uso sul web — quale componente, dove

**Regola d’oro: al massimo un segno “forte” per schermata.** Il forte è il segno in
primo piano (badge, divisore, cornice, linea nell’eyebrow). Le texture e i watermark
in trasparenza (`SegnoDomusBackground`, `MotifCorner`) non contano come “forti” purché
restino sotto la soglia dell’attenzione.

| Contesto | Componente consigliato | Nota |
| --- | --- | --- |
| **Hero** | `SegnoDomus` con `segno-draw`, oppure `SegnoDomusVideoFrame` sull’hero video, con **un** `SegnoDomusBadge` per l’eyebrow. | È l’unico punto in cui il “disegno” animato è ammesso. Vedi `Hero.tsx`, `HeroCinematic.tsx`. |
| **Eyebrow / etichetta di fiducia** | `SegnoDomusBadge` | Uno per sezione. Testo breve e maiuscolo (“Documenti verificati”). |
| **Divisore tra sezioni** | `SegnoDomusDivider` o `SectionDivider.tsx` | Sostituisce l’hairline piatta *ogni tanto*, non tra ogni coppia di sezioni. |
| **Card premium** | `SegnoDomusFrame` (cornice) **oppure** `MotifCorner` (watermark d’angolo) | Mai entrambi sulla stessa card. La cornice per l’elemento “eroe”; il watermark per un tocco discreto. |
| **Sezione asset proprietari** (Domus D.O.C., Open Domus) | `SegnoDomus` come watermark a bassa opacità + il sigillo tondo | Come in `DomusDocProtocol.tsx`: un solo watermark grande dietro, non ripetuto. |
| **Banda CTA / contatti** | `SegnoDomusBackground` (`opacity` 0.04–0.06) | Texture di fondo che incornicia il messaggio; il testo resta pienamente leggibile. |
| **Footer** | `SegnoDomus` (senza abbraccio, piccolo) | Firma di chiusura, lontana dal `Logo` per non competerci. Vedi `Footer.tsx`. |

**Dove NON metterlo sul web:** accanto al logo (header/footer di brand), sopra testo
o titoli, in ogni card di una griglia, in due punti forti della stessa vista.

---

## 5. Uso su brochure, cartolina e frame video

Fuori dal sito il Segno Domus si comporta allo stesso modo: **una firma per superficie**,
mai un pattern da tappezzeria.

- **Brochure (copertina):** un `SegnoDomus` (linea-tetto + abbraccio) sopra il titolo,
  oppure una cornice ad angoli `SegnoDomusFrame` attorno all’immagine di apertura.
  All’interno, al massimo un `SegnoDomusDivider` per aprire una sezione chiave — non su
  ogni pagina. Il logo ufficiale resta in copertina/retro, il Segno vive nel corpo.
- **Cartolina / flyer:** superficie piccola, **un solo elemento**. Preferire il
  `SegnoDomusBadge` (eyebrow di fiducia) *o* la linea-tetto sopra il claim, mai i due
  insieme. Eventuale `SegnoDomusBackground` a opacità minima (≤ 0.05) come texture, solo
  se non c’è già un altro segno forte.
- **Frame video / poster / lower-third:** `SegnoDomusVideoFrame` come cornice
  dell’inquadratura (angoli + linea-tetto in alto, tutto in trasparenza). Gli angoli non
  devono coprire il soggetto né i sottotitoli; su clip verticali social ridurre `size` e
  tenere gli angoli al margine sicuro. Un badge in sovrimpressione (`SegnoDomusBadge light`)
  è ammesso **solo** se il frame non ha già la cornice completa.

Palette invariata anche in stampa: rosso `#d20a0a`, grigi caldi, bianco caldo.
**Niente oro, niente blu, niente nero pieno.**

---

## 6. Uso eccessivo / da evitare (esempi)

- ❌ **Segno su ogni card di una griglia.** Sei schede con sei cornici = tappezzeria.
  La cornice va sulla card “eroe”; le altre restano pulite.
- ❌ **Due segni forti nella stessa vista** — es. `SegnoDomusDivider` + `SegnoDomusBadge`
  + cornice tutti visibili insieme. Se una sezione ha già un forte segnale rosso (CTA
  piena, eyebrow marcata), il Segno si fa da parte.
- ❌ **Segno sopra il testo** — come sottolineatura di parole o dietro un paragrafo ad
  alta opacità. Se sta su un blocco di testo, sta come **sfondo lontano** (≤ 0.06).
- ❌ **Vicino al logo.** Segno + `Logo`/`LogoMark` affiancati si annullano. Header e
  footer sono territorio del logo; il Segno vive nelle sezioni.
- ❌ **`SegnoDomusBackground` a opacità alta** (> 0.08): diventa rumore che compete col
  contenuto. La texture deve “sentirsi” più che vedersi.
- ❌ **Tratti spessi o pieni di rosso**, cuoricini sparsi, “casette” stilizzate ripetute:
  il Segno è un accenno, non un timbro.
- ❌ **Colori fuori palette** (oro, blu, gradienti sgargianti) o l’abbraccio grigio reso
  scuro/opaco: perde la sua natura di eco morbida.
- ❌ **`SegnoDomusFrame` + `MotifCorner` sulla stessa card**: doppia firma d’angolo, ridondante.

---

## 7. Riferimenti tecnici rapidi

- **Colori:** `--color-red` `#d20a0a` (accento), `--color-graphite` `#46423d` (abbraccio/struttura),
  `--color-line` `#e7e2da` (hairline dei divisori), `--color-cream-deep` `#f3eee5` (fade su fondo caldo).
- **Spessori:** 1.4px (abbraccio/dettaglio) → 2.4px (linea-tetto).
- **Opacità superfici:** watermark `~0.06–0.12`, background `0.04–0.08`.
- **Motion:** `--ease-out-expo`; `segno-draw` (solo Hero), `segno-hover-draw` (divisori/hover).
  Sempre disattivate sotto `prefers-reduced-motion`.
- **Accessibilità:** ogni segno è `aria-hidden` — è decorazione, non contenuto.
- **File:** componenti in `app/components/BrandMotif.tsx`; stili in `app/globals.css`
  (blocco *“Segno Domus: pattern & disegno”*); usi reali in `Hero.tsx`, `HeroCinematic.tsx`,
  `SectionDivider.tsx`, `DomusDocProtocol.tsx`, `Footer.tsx`.
