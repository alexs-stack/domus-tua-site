"use client";

// ThreadNav — il filo rosso del Metodo diventa il progresso della pagina:
// un filo che "si cuce" con lo scroll (riempimento rosso sul binario neutro),
// con i nodi posizionati in proporzione alla posizione reale delle sezioni
// nel documento.
// - Parametrico: `chapters` (id sezione + etichetta già tradotta) per le
//   pagine interne; senza prop restano i capitoli della home.
// - DUE GEOMETRIE, GLI STESSI DATI, DUE RUOLI DIVERSI (wave "parità mobile",
//   2026-08-11). Da 1024 in su il filo è la colonna verticale sul bordo
//   destro ed è una NAV vera: c'è spazio per le etichette, i nodi sono
//   bottoni che saltano al capitolo, l'attivo si dichiara con aria-current.
//   Sotto, quella colonna vuota non esiste — ma il bordo ALTO sì: il filo
//   diventa una riga sottile al bordo alto dello schermo, ed è solo PROGRESSO.
//   I nodi restano al loro posto sulla riga come TACCHE: non si toccano, non
//   si tabulano, non esistono per lo screen reader.
//   Questo CONTRADDICE per iscritto il commento che stava qui in origine
//   («solo desktop ≥1024 … sotto la soglia il rail è display:none e la nav
//   vera resta l'header»): il filo esiste anche sotto — la nav vera, però,
//   resta l'header, ed è esattamente il motivo per cui sotto lg il filo è
//   aria-hidden e fuori dal tab order.
// - CORREZIONE DELLA PRIMA STESURA DEL RAMO MOBILE (stessa wave, dopo
//   revisione). Era una banda alta 44px con nodi cliccabili. Due difetti
//   veri, non di gusto:
//   (1) 44px di banda fixed a tutta larghezza, con i nodi pointer-events
//       auto, si mangiavano i tocchi destinati ai link del contenuto che le
//       scorreva sotto — metà bersaglio stava sopra la pagina, non sopra il
//       chrome;
//   (2) a 390px i centri dei nodi cadono anche a 5px l'uno dall'altro, e la
//       regola touch del sito (globals.css, blocco `pointer: coarse`) dice
//       per iscritto che due bersagli da 44px troppo vicini sono PEGGIO di
//       un bersaglio piccolo, perché il tocco diventa ambiguo.
//   Togliere la navigazione toglie tutti e due i difetti in un colpo, ed è
//   la traduzione più onesta: sul rail si può fare una nav perché c'è posto
//   per le etichette, a 390px non c'è.
// - UN SOLO CANCELLO, ED È JS. Il markup nasce `hidden` (display:none) e
//   nessuna classe lo riapre: lo riapre il ramo che parte, che gira solo
//   dentro MQ.motionOk. Senza JS, e con reduced-motion, la pagina è completa
//   per costruzione — non per merito di un `opacity: 0` scritto nel markup
//   (c'era, ed era uno stato nascosto in SSR: la Legge 4 lo vieta).
// - Appare quando il primo capitolo è alle spalle (l'hero è scuro e va
//   lasciato pulito).
// - Etichette: SOLO stringhe già tradotte del dizionario nav + nome brand.
// - Il fill anima solo transform (quickSetter, zero layout).
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, MQ, dur } from "../../lib/motion/gsap";
import { getLenis } from "./SmoothScroll";
import { watchSurfaceTone } from "../../lib/ui/surface";
import { SegnoDomus } from "../BrandMotif";
import { useDict } from "../i18n/LocaleProvider";

export type ThreadChapter = { id: string; label: string };

export default function ThreadNav({
  chapters: chaptersProp,
}: {
  /** Capitoli della pagina (id sezione esistente + etichetta tradotta). Default: home. */
  chapters?: ThreadChapter[];
} = {}) {
  const d = useDict();
  const rootRef = useRef<HTMLElement | null>(null);
  const fillRef = useRef<HTMLSpanElement | null>(null);
  const shownRef = useRef(false);

  // Capitoli della home: id reali delle sezioni, etichette già tradotte.
  const chapters: ThreadChapter[] = chaptersProp ?? [
    { id: "top", label: "Domus Tua" },
    { id: "metodo", label: d.nav.metodo },
    { id: "recensioni", label: d.nav.recensioni },
    { id: "contatti", label: d.nav.contatti },
  ];

  useGSAP(
    () => {
      const root = rootRef.current;
      const fill = fillRef.current;
      if (!root || !fill) return;

      const knots = gsap.utils.toArray<HTMLButtonElement>("[data-knot]", root);

      /* ─── QUELLO CHE I DUE RAMI CONDIVIDONO ─────────────────────────────
         Non la geometria — quella diverge, ed è tutto il senso della
         revisione — ma la matematica dei capitoli e i due gesti di base:
         aprire il cancello e accendere il filo. Sono funzioni locali e non
         ternari dentro un corpo unico: da quando i due rami hanno ruoli
         diversi (nav / progresso) un corpo solo sarebbe una fila di `if`
         travestiti. L'idioma del sito per questo è due mm.add fratelli
         (Footer, LiquidReveal). */

      /** Apre il cancello del ramo. Torna la chiusura, da chiamare in cleanup. */
      const openGate = (hidden: gsap.TweenVars) => {
        // Display PRIMA, stato nascosto DOPO. GSAP costruisce la cache delle
        // transform leggendo quella CALCOLATA, e su un elemento display:none
        // il `-translate-y-1/2` del rail — che è una percentuale — si
        // risolverebbe a zero e la colonna resterebbe scentrata di mezza
        // altezza. Nessuno vede il lampo: siamo dentro un layout effect, fra
        // le due righe il browser non dipinge.
        root.classList.remove("hidden");
        gsap.set(root, hidden);
        return () => root.classList.add("hidden");
      };

      /** Accensione/spegnimento del filo: un solo tween sul root. */
      const fader =
        (shown: gsap.TweenVars, hidden: gsap.TweenVars) => (show: boolean) => {
          shownRef.current = show;
          gsap.to(root, {
            ...(show ? shown : hidden),
            // dur.short, non lo 0.5 di prima: mezzo secondo non è nessuna
            // delle durate della firma, e la comparsa del chrome non ha
            // motivo di avere un tempo tutto suo.
            duration: dur.short,
            ease: "domus",
            overwrite: "auto",
          });
        };

      /** Nodi in proporzione alla posizione reale della sezione nel documento. */
      const placeKnots = (edge: "top" | "left", lead: number) => {
        const max = ScrollTrigger.maxScroll(window);
        // maxScroll vale 0 per un istante durante certi refresh (su /acquista
        // la griglia si rimonta: PropertySearch.tsx:590 e :624). Si salta il
        // giro dei nodi e basta — quello che il ramo misura DOPO, la soglia
        // di comparsa, non divide per max e prima restava indietro per tutta
        // la sessione perché questo return usciva da place() intero.
        if (max <= 0) return;
        knots.forEach((k) => {
          const target = document.getElementById(k.dataset.knot || "");
          if (!target) return;
          const y = target.getBoundingClientRect().top + window.scrollY;
          const frac = gsap.utils.clamp(
            0,
            1,
            (y - window.innerHeight * lead) / max
          );
          k.style[edge] = `${(frac * 100).toFixed(2)}%`;
        });
      };

      /** Distribuzione di ripiego lungo l'asse del ramo. */
      const spreadKnots = (edge: "top" | "left") => {
        // In JS e non nel markup: l'asse dipende dal ramo, e un `top`
        // stampato in SSR vincerebbe (inline batte classi) sul centraggio
        // verticale della riga orizzontale. Serve solo ai capitoli la cui
        // sezione non esiste su questa pagina: gli altri li rimpiazza subito
        // placeKnots().
        knots.forEach((k, i) => {
          k.style[edge] = `${(i / Math.max(knots.length - 1, 1)) * 100}%`;
        });
      };

      /**
       * Capitolo attivo: un trigger leggero per sezione.
       * `markCurrent` solo dove il filo è davvero una nav — sul progresso
       * mobile il nodo si illumina e basta, l'attributo non ha nessuno che
       * lo legga (il ramo è aria-hidden).
       */
      const watchChapters = (markCurrent: boolean) => {
        const sts = chapters.map(({ id }) => {
          const el = document.getElementById(id);
          const knot = knots.find((k) => k.dataset.knot === id);
          if (!el || !knot) return null;
          return ScrollTrigger.create({
            trigger: el,
            start: "top 55%",
            end: "bottom 55%",
            onToggle(self) {
              knot.dataset.active = self.isActive ? "true" : "false";
              if (!markCurrent) return;
              // "page" come le voci dell'header (Header.tsx): i due chrome
              // di navigazione dicono la stessa cosa nello stesso modo.
              // (Non è ancora vero per TUTTO il sito: l'indice di
              // domande-frequenti scrive "true" — file di un altro, altra
              // decisione, altro turno.)
              if (self.isActive) knot.setAttribute("aria-current", "page");
              else knot.removeAttribute("aria-current");
            },
          });
        });
        return () => {
          sts.forEach((st) => st?.kill());
          // Uccidere i trigger non ripulisce quello che hanno SCRITTO: senza
          // questo, al passaggio di soglia il ramo nuovo eredita un nodo
          // ancora `data-active="true"` (onToggle scatta solo sui CAMBI, e
          // per lui non è cambiato niente) e un aria-current appeso a un
          // filo che nel frattempo è diventato aria-hidden.
          knots.forEach((k) => {
            delete k.dataset.active;
            k.removeAttribute("aria-current");
          });
        };
      };

      /** L'asse appartiene al ramo: nessun `top`/`left` sopravvive al cambio. */
      const clearAxis = () => {
        // Un `left` rimasto appeso vincerebbe sul centraggio del rail
        // verticale al primo tablet ruotato oltre i 1024 (e un `top` farebbe
        // lo stesso danno tornando indietro).
        knots.forEach((k) => {
          k.style.top = "";
          k.style.left = "";
        });
      };

      const mm = gsap.matchMedia();

      /* ─── RAMO DESKTOP: LA COLONNA, CHE È UNA NAV ────────────────────── */
      mm.add(`${MQ.motionOk} and ${MQ.lg}`, () => {
        // OPACITY + pointer-events, mai autoAlpha: qui dentro ci sono da
        // quattro a sei bottoni che saltano al capitolo, e `visibility: hidden`
        // li toglierebbe dal tab order (la regola sta in lib/motion/gsap.ts).
        // Il puntatore va spento a mano perché i nodi si riprendono l'evento da
        // soli con `lg:pointer-events-auto`: senza questa riga, finché il filo
        // è invisibile resterebbero sei bersagli vivi sul bordo destro.
        const hidden: gsap.TweenVars = { opacity: 0, x: 8, pointerEvents: "none" };
        const reveal = fader({ opacity: 1, x: 0, pointerEvents: "auto" }, hidden);
        const closeGate = openGate(hidden);

        // ENTRAMBI GLI ASSI, in tutti e due i rami. La quickSetter costruisce
        // la sua cache leggendo la transform attuale e poi scrive un asse
        // solo: se l'altro arriva sporco dal ramo precedente (scaleX 0 dopo
        // una sessione sulla riga orizzontale) resta a zero per sempre e il
        // filo è invisibile. Ogni ramo dichiara tutte e due le scale prima di
        // prendere il timone — ed è anche il motivo per cui nel markup non
        // c'è nessuna transform: sarebbe un altro stato nascosto in SSR.
        gsap.set(fill, { scaleX: 1, scaleY: 0 });
        spreadKnots("top");

        // Sul rail verticale l'intero documento è schiacciato in 44vh: uno
        // scarto del 15% di viewport vale mezzo pixel, e 0.4 resta com'era.
        const lead = 0.4;
        let revealAt = window.innerHeight * 0.55;
        const place = () => {
          placeKnots("top", lead);
          // Rimisurata a ogni refresh e non catturata al montaggio: una
          // finestra che cambia altezza senza scendere sotto i 1024 (barra
          // degli strumenti, split screen) lascerebbe la soglia tarata sul
          // viewport di prima.
          revealAt = window.innerHeight * 0.55;
        };
        place();
        ScrollTrigger.addEventListener("refresh", place);

        const setFill = gsap.quickSetter(fill, "scaleY");
        // Un solo trigger globale: cuce il fill e decide la visibilità.
        const seam = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate(self) {
            setFill(self.progress);
            const show = self.scroll() > revealAt;
            if (show !== shownRef.current) reveal(show);
          },
        });

        const unwatchChapters = watchChapters(true);

        /* IL FILO SOPRA LE SUPERFICI SCURE.
           Il chrome sovrapposto — la parte di schermo sempre ferma e sempre
           visibile — restava cieco ai cambi di superficie: sopra i pannelli di
           "Due percorsi" o sopra il footer, traccia e etichette sparivano.
           Il campione si prende a SINISTRA del binario, non al suo centro: al
           centro elementFromPoint colpirebbe il binario stesso. Vedi
           lib/ui/surface per il motivo per cui un IntersectionObserver qui non
           basta.
           SOLO SUL RAIL, da questa wave. Prima l'effetto partiva a ogni
           larghezza da un useEffect al mount: scroll e resize passivi più un
           rAF per un elemento display:none. Ma il motivo vero per non
           riaccenderlo sul telefono è un altro: watchSurfaceTone scrive
           `data-tone="dark"`, lo STESSO attributo che SurfaceFlow legge come
           tappa del flusso di colore e che globals.css usa per togliere gli
           sfondi. Su una nav display:none era innocuo; su una riga visibile in
           cima alla home diventerebbe una tappa fantasma nel flusso. Il prezzo
           lo paga la traccia, che sopra le superfici scure resta beige invece
           di scendere a cream/25: si legge lo stesso (è chiara su scuro), è
           solo un filo più forte. Chi spariva davvero erano le ETICHETTE
           (text-stone su grafite) — e sul filo orizzontale non ci sono. */
        const stopTone = watchSurfaceTone(root, () => {
          const r = root.getBoundingClientRect();
          if (r.width === 0) return null;
          return { x: r.left - 28, y: r.top + r.height / 2 };
        });

        return () => {
          ScrollTrigger.removeEventListener("refresh", place);
          seam.kill();
          unwatchChapters();
          stopTone();
          clearAxis();
          closeGate();
          // Il revert di GSAP riporta il filo allo stato del markup: se lo
          // specchio restasse "acceso", il ramo nuovo non chiamerebbe mai
          // reveal(true) e il filo resterebbe spento per sempre.
          shownRef.current = false;
        };
      });

      /* ─── RAMO TELEFONO/TABLET: LA RIGA, CHE È SOLO PROGRESSO ────────── */
      mm.add(`${MQ.motionOk} and ${MQ.belowLg}`, () => {
        // FUORI DALL'ALBERO ACCESSIBILE E FUORI DAL TAB ORDER. Un indicatore
        // di progresso che ripete voce per voce la nav dell'header è rumore
        // per chi legge a schermo letto, e i nodi qui non portano da nessuna
        // parte: non sono bersagli. Il markup però è uno solo per i due rami
        // (il breakpoint si conosce solo a runtime: renderizzare `<span>` di
        // qua e `<button>` di là vorrebbe dire indovinare la larghezza in
        // SSR), quindi la strada è aria-hidden sul contenitore + tabIndex -1
        // sui bottoni. Servono ENTRAMBI: un focusable dentro un sottoalbero
        // aria-hidden è la violazione classica, il Tab ci finirebbe dentro
        // senza che nulla venga annunciato.
        root.setAttribute("aria-hidden", "true");
        knots.forEach((k) => {
          k.tabIndex = -1;
        });

        // OPACITY, NON autoAlpha. Il motivo di ieri (visibility:hidden toglie
        // i nodi dal tab order e la rete focusin non scatterebbe) è caduto
        // insieme alla navigazione: qui dentro il Tab non entra più per
        // scelta. Resta valido l'altro: la riga non ha mai il puntatore, né
        // accesa né spenta (`pointer-events-none` nel markup, che da lg in su
        // si riapre solo sui nodi del rail), quindi non c'è niente da
        // nascondere davvero e l'opacità basta da sola.
        const hidden: gsap.TweenVars = { opacity: 0, y: -8 };
        const reveal = fader({ opacity: 1, y: 0 }, hidden);
        const closeGate = openGate(hidden);

        gsap.set(fill, { scaleY: 1, scaleX: 0 });
        spreadKnots("left");

        // ANTICIPO DEL NODO, DIVERSO DAL RAIL. Qui la tacca e la testa del
        // riempimento stanno sulla STESSA riga di 2px e l'occhio le legge
        // insieme, quindi l'anticipo si allinea al trigger che accende la
        // tacca (`top 55%`): il filo tocca la tacca esattamente quando la
        // tacca si accende. È la cucitura, ed è il senso del componente.
        const lead = 0.55;
        // SOGLIA DI COMPARSA. Sul rail è mezzo viewport; qui no, perché la
        // riga sta in alto e in alto, durante l'hero, c'è l'immagine scura.
        // Non una frazione a occhio ma il fondo del PRIMO capitolo,
        // rimisurato a ogni refresh: gli hero non sono alti uguali sulle
        // cinque rotte che montano il filo.
        let revealAt = window.innerHeight * 0.9;
        const place = () => {
          placeKnots("left", lead);
          const first = document.getElementById(chapters[0]?.id || "");
          // La riga è fixed: il suo bordo basso in coordinate viewport è una
          // costante, e non va scritta a mano da nessuna parte.
          const band = root.getBoundingClientRect().bottom;
          revealAt = first
            ? first.getBoundingClientRect().bottom + window.scrollY - band
            : window.innerHeight * 0.9;
        };
        place();
        ScrollTrigger.addEventListener("refresh", place);

        const setFill = gsap.quickSetter(fill, "scaleX");
        const seam = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate(self) {
            setFill(self.progress);
            const show = self.scroll() > revealAt;
            if (show !== shownRef.current) reveal(show);
          },
        });

        const unwatchChapters = watchChapters(false);

        // La rete `focusin` che stava qui è sparita con la navigazione:
        // accendeva il filo quando il Tab entrava in un nodo, e nel filo di
        // progresso col Tab non ci entra più nessuno. Resta l'altra, che col
        // focus non c'entra: se la pagina apre già scrollata (ancora
        // nell'URL, posizione ripristinata dal browser) l'onUpdate può non
        // arrivare mai e il filo resterebbe spento con mezza pagina alle
        // spalle.
        const failsafe = window.setTimeout(() => {
          if (!shownRef.current && window.scrollY > revealAt) reveal(true);
        }, 2500);

        return () => {
          ScrollTrigger.removeEventListener("refresh", place);
          seam.kill();
          unwatchChapters();
          clearTimeout(failsafe);
          root.removeAttribute("aria-hidden");
          knots.forEach((k) => k.removeAttribute("tabindex"));
          clearAxis();
          closeGate();
          shownRef.current = false;
        };
      });
    },
    // La chiave stringa evita ri-esecuzioni per nuove reference dell'array
    // chapters (i trigger dipendono solo dagli id, le etichette sono JSX).
    // revertOnUpdate: senza, il cambio lingua ri-eseguirebbe il callback SENZA
    // revert e accumulerebbe matchMedia + trigger + listener refresh a ogni switch.
    {
      scope: rootRef,
      dependencies: [d, chapters.map((c) => c.id).join("|")],
      revertOnUpdate: true,
    }
  );

  const goTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -90 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      ref={rootRef}
      aria-label="Domus Tua"
      // NESSUNO STATO NASCOSTO NEL MARKUP. Solo `hidden`, cioè display:none,
      // che è assenza e non un nascondiglio: senza JS il filo non c'è e la
      // pagina è completa per costruzione. Nemmeno una classe `motion-safe:`
      // lo riapre — il cancello è uno solo ed è il ramo matchMedia, che gira
      // dentro MQ.motionOk: con reduced-motion nessun ramo parte e `hidden`
      // resta dov'è, a qualunque larghezza.
      //
      // Due geometrie disgiunte, non una ristretta. Sotto lg: una riga alta
      // 8px — quanto basta al binario da 2px e alle tacche da 8 — incollata al
      // BORDO ALTO dello schermo. Da lg: colonna sul bordo destro.
      //
      // `top-0` e non «sotto la pill», ed è una correzione misurata. La prima
      // stesura la metteva a 88px per stare sotto l'header. Ma la pill si
      // RITIRA a ogni scroll in discesa (Header.tsx, `yTo(-160)`), e il filo si
      // accende solo dopo il primo capitolo: nei fatti, per tutto il tempo in
      // cui la riga esiste la pill non è lì. Misurato scendendo: `pill.top` è
      // −93.6px a scrollY 1200, 3000, 5100, 6950, 8600, 9700. La riga restava
      // quindi sospesa sopra il contenuto, ancorata a un riferimento assente.
      // Al bordo non può mai finire sopra niente, ed è anche l'idioma che una
      // barra di avanzamento ha già: si legge senza doverla cercare.
      //
      // z-30 e ci resta: la pill sta a z-50 e l'overlay del menu a z-40, il
      // filo passa sotto entrambi. `pointer-events-none` da un capo all'altro,
      // e da lg in su sono i soli nodi del rail a riprendersi il puntatore:
      // niente di ciò che scorre sotto la riga può mai essere bloccato da lei.
      className="group pointer-events-none fixed inset-x-0 top-0 z-30 hidden h-2 lg:inset-x-auto lg:right-6 lg:top-1/2 lg:h-[44vh] lg:w-6 lg:-translate-y-1/2"
    >
      {/* Binario + filo che si cuce (solo transform) */}
      <span
        aria-hidden
        /* Il binario ha DUE colori perché ha due modi di sapere dov'è. Sul
           rail lo sa: `watchSurfaceTone` campiona la superficie accanto e
           scrive `data-tone`, quindi `bg-line` può virare al chiaro sui fondi
           scuri. Sotto lg quel campionamento non gira — di proposito: `data-tone`
           è anche la tappa di SurfaceFlow, e stamparlo su un elemento visibile
           della home falserebbe il flusso di colore. Senza campionamento un
           beige pieno resterebbe beige anche sul fondo sbagliato, quindi qui il
           binario è un nero trasparente: si stacca su crema come su scuro senza
           dover sapere niente di ciò che ha sotto. */
        className="absolute left-0 right-0 top-1/2 -mt-px h-[2px] bg-ink/15 transition-colors duration-500 lg:bottom-0 lg:left-1/2 lg:right-auto lg:top-0 lg:mt-0 lg:h-auto lg:w-px lg:-translate-x-1/2 lg:bg-line lg:group-data-[tone=dark]:bg-cream/25"
      />
      <span
        ref={fillRef}
        aria-hidden
        className="absolute left-0 right-0 top-1/2 -mt-px h-[2px] origin-left bg-red lg:bottom-0 lg:left-1/2 lg:right-auto lg:top-0 lg:mt-0 lg:h-auto lg:w-[1.5px] lg:origin-top lg:-translate-x-1/2"
      />
      {/* Il Segno chiude il filo, come la firma chiude il Metodo. Sulla riga
          orizzontale non c'è capo libero dove metterlo: la sua estremità è il
          bordo dello schermo, e a 24px di larghezza finirebbe addosso
          all'ultima tacca (su /metodo i capitoli sono sei). Resta al rail. */}
      <SegnoDomus
        className="absolute -bottom-5 left-1/2 hidden h-2 w-6 -translate-x-1/2 text-red/70 lg:block"
        embrace={false}
      />
      {chapters.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          data-knot={id}
          aria-label={label}
          onClick={() => goTo(id)}
          // BOTTONE SOLO DA lg IN SU. Sotto è una tacca: `pointer-events-none`
          // e nessuna area attorno — il riquadro è il pallino da 8px e basta.
          // Il click resta appeso perché il markup è uno solo, ma senza
          // puntatore né tab (vedi il ramo mobile) non lo raggiunge nessuno.
          // Le tacche possono anche toccarsi fra loro: su /metodo, a 390px,
          // due centri arrivano a 5px. Da bersagli era il difetto peggiore
          // del ramo; da tacche è la texture del filo.
          className="group pointer-events-none absolute top-1/2 flex h-2 w-2 -translate-x-1/2 -translate-y-1/2 items-center justify-center lg:left-1/2 lg:h-6 lg:w-6 lg:cursor-pointer lg:pointer-events-auto"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full border border-stone/60 bg-paper transition-[transform,background-color,border-color] duration-300 group-hover:scale-125 group-hover:border-red group-data-[active=true]:scale-150 group-data-[active=true]:border-red group-data-[active=true]:bg-red group-data-[tone=dark]:border-cream/50 group-data-[tone=dark]:bg-cream/85"
          />
          {/* Etichetta: scivola dal filo verso sinistra su hover/attivo. Sulla
              riga orizzontale non c'è: a 390px quattro parole in fila su una
              riga alta 2px si sovrappongono — ed è anche il motivo per cui
              laggiù il filo non è una nav ma un progresso (la nav vera, sul
              telefono, è l'header). */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-full mr-3 hidden translate-x-1 whitespace-nowrap text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-data-[active=true]:translate-x-0 group-data-[active=true]:text-red group-data-[active=true]:opacity-100 group-data-[tone=dark]:text-cream/85 lg:block"
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
