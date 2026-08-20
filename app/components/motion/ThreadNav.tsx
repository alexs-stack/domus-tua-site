"use client";

// ThreadNav — il filo rosso del Metodo diventa il progresso della pagina:
// un filo che "si cuce" con lo scroll (riempimento rosso sul binario neutro),
// con i nodi posizionati in proporzione alla posizione reale delle sezioni
// nel documento.
// - Parametrico: `chapters` (id sezione + etichetta già tradotta) per le
//   pagine interne; senza prop restano i capitoli della home.
// - DUE GEOMETRIE, GLI STESSI DATI, LO STESSO RUOLO. Da 1024 in su il filo è
//   la colonna verticale sul bordo destro; sotto è una riga orizzontale. In
//   entrambi i casi è una NAV: i nodi sono bottoni che saltano al capitolo e
//   l'attivo si dichiara con aria-current.
// - QUI PRIMA C'ERA SCRITTO IL CONTRARIO, e la riga va riscritta non
//   cancellata (onda «parità mobile 2», scheda 14, verdetto PORT DEI NODI).
//   La stesura del 2026-08-11 declassava la riga mobile a solo PROGRESSO —
//   nodi come TACCHE inerti, aria-hidden, fuori dal tab order — per due
//   difetti veri della stesura ancora precedente:
//   (1) una banda fixed alta 44px a tutta larghezza con i nodi
//       pointer-events auto si mangiava i tocchi destinati ai link del
//       contenuto che le scorreva sotto;
//   (2) a 390px i centri dei nodi cadono anche a 5px l'uno dall'altro, e la
//       regola touch del sito (globals.css, blocco `pointer: coarse`) dice
//       per iscritto che due bersagli da 44px troppo vicini sono PEGGIO di
//       un bersaglio piccolo, perché il tocco diventa ambiguo.
//   Erano difetti di GEOMETRIA, non della navigazione: la conclusione «allora
//   togliamo la nav» era un atto in meno, non un parametro adattato. Adesso
//   i due difetti si pagano dove sono nati:
//   (1) la banda non esiste — il puntatore resta spento sul contenitore, lo
//       riprendono i soli 5 riquadri da 44×44 dei nodi (il resto della riga
//       non blocca niente);
//   (2) i centri non si toccano più: `placeKnots` fa un passaggio di
//       SPAZIATURA MINIMA (44 + 8 px fra i centri) prima di scrivere le
//       percentuali. La proporzione resta quella vera del documento, quando
//       due capitoli sono troppo vicini si scostano del minimo indispensabile.
//   Le etichette invece restano al rail: a 390px quattro parole in fila su
//   una riga da 2px si sovrappongono davvero, e nessuna spaziatura le salva.
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

/** Lato del bersaglio di tocco del nodo, in px. È lo stesso 44 di `.tap-target`
    (globals.css, blocco `pointer: coarse`), che disegna il riquadro: qui serve
    solo a fare i conti della spaziatura. Non è una soglia di larghezza — la
    regola 7 dell'onda riguarda i breakpoint, non le dimensioni del dito. */
const TAP_TARGET = 44;
/** Distanza minima fra due centri: il bersaglio più gli 8px di separazione che
    il blocco touch di globals.css chiede fra due bersagli da 44. */
const MIN_KNOT_PITCH = TAP_TARGET + 8;

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

      /** Nodi in proporzione alla posizione reale della sezione nel documento.
          `minPitch` > 0 accende la spaziatura minima fra i centri (vedi sopra):
          serve dove i nodi sono bersagli per il dito e la proporzione pura li
          farebbe cadere a 5px l'uno dall'altro. */
      const placeKnots = (edge: "top" | "left", lead: number, minPitch = 0) => {
        const max = ScrollTrigger.maxScroll(window);
        // maxScroll vale 0 per un istante durante certi refresh (su /acquista
        // la griglia si rimonta: PropertySearch.tsx:590 e :624). Si salta il
        // giro dei nodi e basta — quello che il ramo misura DOPO, la soglia
        // di comparsa, non divide per max e prima restava indietro per tutta
        // la sessione perché questo return usciva da place() intero.
        if (max <= 0) return;

        // Solo i capitoli che esistono su questa pagina: gli altri restano
        // dove li ha messi spreadKnots e non partecipano alla spaziatura.
        const placed: Array<{ k: HTMLButtonElement; frac: number }> = [];
        knots.forEach((k) => {
          const target = document.getElementById(k.dataset.knot || "");
          if (!target) return;
          const y = target.getBoundingClientRect().top + window.scrollY;
          const frac = gsap.utils.clamp(
            0,
            1,
            (y - window.innerHeight * lead) / max
          );
          placed.push({ k, frac });
        });
        if (!placed.length) return;

        if (!minPitch) {
          placed.forEach(({ k, frac }) => {
            k.style[edge] = `${(frac * 100).toFixed(2)}%`;
          });
          return;
        }

        // SPAZIATURA MINIMA, in pixel e non in percentuale: il vincolo è il
        // dito (44px + 8 di separazione), e 8px sono una frazione diversa a
        // 360 e a 1023. Le frazioni arrivano già in ordine crescente (i
        // capitoli sono in ordine di documento), quindi bastano due passate:
        // in avanti si allontanano i troppo vicini, all'indietro si rientra
        // dentro il bordo. `pitch` non può superare lo spazio disponibile —
        // con sei capitoli su /metodo a 360px il passo scende da solo invece
        // di spingere l'ultimo nodo fuori schermo.
        const len = edge === "left" ? root.clientWidth : root.clientHeight;
        const half = TAP_TARGET / 2;
        const room = Math.max(len - TAP_TARGET, 0);
        const pitch = Math.min(minPitch, room / Math.max(placed.length - 1, 1));
        const px = placed.map(({ frac }) =>
          gsap.utils.clamp(half, len - half, frac * len)
        );
        for (let i = 1; i < px.length; i++) px[i] = Math.max(px[i], px[i - 1] + pitch);
        for (let i = px.length - 1; i > 0; i--) {
          px[i] = Math.min(px[i], len - half);
          px[i - 1] = Math.min(px[i - 1], px[i] - pitch);
        }
        placed.forEach(({ k }, i) => {
          k.style[edge] = `${((px[i] / len) * 100).toFixed(2)}%`;
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
       * Capitolo attivo: un trigger leggero per sezione. Accende il nodo
       * (`data-active`) e dichiara `aria-current`.
       * SENZA PARAMETRO, da «parità mobile 2» (scheda 14). Qui c'era un
       * `markCurrent` che spegneva `aria-current` sul ramo mobile, e aveva
       * senso finché la riga era solo PROGRESSO (aria-hidden, fuori dal tab
       * order): adesso è una nav a ogni larghezza, quindi i due rami chiedono
       * la stessa cosa e un parametro che vale sempre `true` è un ramo morto
       * travestito da opzione.
       */
      const watchChapters = () => {
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
        // OPACITY, NON autoAlpha: qui dentro ci sono da quattro a sei bottoni
        // che saltano al capitolo, e `visibility: hidden` li toglierebbe dal
        // tab order (la regola sta in lib/motion/gsap.ts).
        //
        // IL PUNTATORE SI ACCENDE SUI NODI, ESATTAMENTE COME SUL RAMO MOBILE —
        // e questa riga è una correzione, non una simmetria di gusto. Prima il
        // bottone si riprendeva l'evento da sé con `lg:pointer-events-auto` e
        // qui si scriveva `pointerEvents` sul ROOT credendo di poterlo
        // richiudere: non funziona in nessuno dei due versi. `pointer-events`
        // è ereditata, ma un figlio che dichiara `auto` resta bersaglio anche
        // dentro un antenato a `none` — quindi il filo invisibile teneva vivi
        // sei bersagli sul bordo destro, ed è il difetto che quel commento
        // diceva di aver chiuso. Da qui il puntatore ce l'ha una sorgente
        // sola: il JS del ramo, sui nodi.
        const hidden: gsap.TweenVars = { opacity: 0, x: 8 };
        const fadeRail = fader({ opacity: 1, x: 0 }, hidden);
        const reveal = (show: boolean) => {
          gsap.set(knots, { pointerEvents: show ? "auto" : "none" });
          fadeRail(show);
        };
        const closeGate = openGate(hidden);
        gsap.set(knots, { pointerEvents: "none" });

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

        const unwatchChapters = watchChapters();

        /* IL FILO SOPRA LE SUPERFICI SCURE.
           Il chrome sovrapposto — la parte di schermo sempre ferma e sempre
           visibile — restava cieco ai cambi di superficie: sopra i pannelli di
           "Due percorsi" o sopra il footer, traccia e etichette sparivano.
           Il campione si prende a SINISTRA del binario, non al suo centro: al
           centro elementFromPoint colpirebbe il binario stesso. Vedi
           lib/ui/surface per il motivo per cui un IntersectionObserver qui non
           basta.
           DENTRO IL RAMO, non in un useEffect al mount: prima girava a ogni
           larghezza — scroll e resize passivi più un rAF — anche per un
           elemento display:none. Il ramo mobile ne ha uno gemello (più sotto,
           col suo punto di campionamento), acceso da «parità mobile 2» insieme
           al rename `data-tone` → `data-rail-tone`: finché l'attributo scritto
           era `data-tone`, cioè la tappa di SurfaceFlow, su una riga VISIBILE
           in cima alla home sarebbe stato una tappa fantasma nel flusso di
           colore. Qui sul rail nessuno dei due problemi c'è mai stato (la
           colonna sotto lg è display:none), ma l'attributo è lo stesso: chi
           legge il chrome legge `data-rail-tone`, sempre. */
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

      /* ─── RAMO TELEFONO/TABLET: LA RIGA, CHE È UNA NAV ───────────────── */
      mm.add(`${MQ.motionOk} and ${MQ.belowLg}`, () => {
        // DENTRO L'ALBERO ACCESSIBILE, come il rail. L'aria-hidden sul
        // contenitore e il tabIndex -1 sui bottoni che stavano qui erano la
        // conseguenza del declassamento a progresso: caduto quello, cadono
        // anche loro. Il markup resta uno solo per i due rami (il breakpoint
        // si conosce solo a runtime), e adesso non ha più bisogno di essere
        // smontato da JS in nessuno dei due.

        // OPACITY, NON autoAlpha: qui dentro ci sono da quattro a sei bottoni
        // che saltano al capitolo, e `visibility: hidden` li toglierebbe dal
        // tab order (la regola sta in lib/motion/gsap.ts).
        //
        // IL PUNTATORE VIVE SUI NODI, MAI SUL CONTENITORE — ed è la stessa
        // riga del rail (il ramo qui sopra), perché il difetto che chiude è lo
        // stesso: un contenitore acceso qui sarebbe la banda a tutta larghezza
        // che si mangiava i tocchi del contenuto, e là sarebbero sei bersagli
        // vivi sotto un filo invisibile. Restano vivi i soli riquadri da 44×44
        // dei nodi, e solo mentre il filo è acceso.
        const hidden: gsap.TweenVars = { opacity: 0, y: -8 };
        const fadeRow = fader({ opacity: 1, y: 0 }, hidden);
        const reveal = (show: boolean) => {
          gsap.set(knots, { pointerEvents: show ? "auto" : "none" });
          fadeRow(show);
        };
        const closeGate = openGate(hidden);
        gsap.set(knots, { pointerEvents: "none" });

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
          placeKnots("left", lead, MIN_KNOT_PITCH);
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

        const unwatchChapters = watchChapters();

        /* IL FILO SOPRA LE SUPERFICI SCURE, ANCHE QUI. Il campionamento era
           spento sotto lg per una ragione sola, ed era vera: watchSurfaceTone
           scriveva `data-tone`, cioè lo STESSO attributo con cui le sezioni si
           dichiarano tappa del flusso di colore — su una nav display:none era
           innocuo, su una riga visibile in cima alla home sarebbe stato una
           tappa fantasma. Adesso scrive `data-rail-tone` (lib/ui/surface.ts,
           trappola 1 dell'onda) e il motivo non c'è più: la riga vira come il
           rail, con lo stesso rAF coalescente e lo stesso costo (un hit-test
           per frame DI SCROLL, zero a pagina ferma).
           IL PUNTO CAMPIONATO STA SOTTO LA BANDA, non sulla riga: da quando i
           nodi hanno il puntatore, un campione all'altezza della riga
           colpirebbe il bersaglio da 44px di un nodo invece della pagina
           (elementFromPoint salta ciò che è pointer-events:none — il
           contenitore e il binario sì, i nodi no). Sotto il bersaglio più
           basso c'è di nuovo la pagina, e a mezza schermata di distanza la
           superficie è la stessa. */
        const stopTone = watchSurfaceTone(root, () => {
          const r = root.getBoundingClientRect();
          if (r.width === 0) return null;
          return { x: window.innerWidth / 2, y: r.bottom + TAP_TARGET };
        });

        // Rete di sicurezza: se la pagina apre già scrollata (ancora nell'URL,
        // posizione ripristinata dal browser) l'onUpdate può non arrivare mai
        // e il filo resterebbe spento con mezza pagina alle spalle.
        const failsafe = window.setTimeout(() => {
          if (!shownRef.current && window.scrollY > revealAt) reveal(true);
        }, 2500);

        return () => {
          ScrollTrigger.removeEventListener("refresh", place);
          seam.kill();
          unwatchChapters();
          stopTone();
          clearTimeout(failsafe);
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
           scrive `data-rail-tone` (rinominato in quest'onda: prima era
           `data-tone`, cioè la tappa di SurfaceFlow — vedi lib/ui/surface.ts),
           quindi `bg-line` può virare al chiaro sui fondi scuri. Sotto lg il
           campionamento ADESSO GIRA (era la trappola che teneva spenta la nav
           mobile, ed è caduta col rename): la riga resta comunque un nero
           trasparente, perché a 2px di spessore su una piega di colore un
           beige pieno si perderebbe — il `data-rail-tone` lì serve ai NODI. */
        className="absolute left-0 right-0 top-1/2 -mt-px h-[2px] bg-ink/15 transition-colors duration-500 lg:bottom-0 lg:left-1/2 lg:right-auto lg:top-0 lg:mt-0 lg:h-auto lg:w-px lg:-translate-x-1/2 lg:bg-line lg:group-data-[rail-tone=dark]:bg-cream/25"
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
          // BOTTONE A OGNI LARGHEZZA (onda «parità mobile 2», scheda 14: PORT
          // dei nodi). Il markup è uno solo per i due rami — il breakpoint si
          // conosce solo a runtime — e il puntatore lo accende il JS sui NODI,
          // mai sul contenitore, in ENTRAMBI i rami (`lg` e `belowLg`): niente
          // banda a tutta larghezza che si mangi i tocchi del contenuto, e
          // nessun bersaglio vivo sotto un filo ancora invisibile. Qui resta
          // solo lo stato di riposo (`pointer-events-none`), che è anche ciò
          // che vale senza JS.
          // IL BERSAGLIO È `.dt-knot`, cioè un riquadro da 44×44 disegnato da
          // un `::before` quadrato e centrato (globals.css, blocco «ThreadNav:
          // il bersaglio del nodo»): il pallino resta 8px, il dito ne trova 44
          // — e la geometria della riga non cambia di un pixel. `.tap-target`
          // non andava bene: il suo ::before prende la LARGHEZZA
          // dell'elemento, che per un pallino sono 8px.
          // Che due bersagli non si sovrappongano è affare di `placeKnots`,
          // che tiene i centri a 52px l'uno dall'altro (44 + 8) prima di
          // scrivere le percentuali: su /metodo, a 390px, due capitoli
          // arrivavano a 5px.
          className="group dt-knot pointer-events-none absolute top-1/2 flex h-2 w-2 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center lg:left-1/2 lg:h-6 lg:w-6"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full border border-stone/60 bg-paper transition-[transform,background-color,border-color] duration-300 group-hover:scale-125 group-hover:border-red group-data-[active=true]:scale-150 group-data-[active=true]:border-red group-data-[active=true]:bg-red group-data-[rail-tone=dark]:border-cream/50 group-data-[rail-tone=dark]:bg-cream/85"
          />
          {/* Etichetta: scivola dal filo verso sinistra su hover/attivo. Sulla
              riga orizzontale non c'è, e resta l'unica cosa che il ramo mobile
              non porta: a 390px quattro parole in fila su una riga alta 2px si
              sovrappongono davvero, e nessuna spaziatura le salva. Il nome del
              capitolo lì lo dice l'`aria-label` del bottone — che è come lo
              legge chi naviga con lo screen reader anche sul rail. */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-full mr-3 hidden translate-x-1 whitespace-nowrap text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-stone opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-data-[active=true]:translate-x-0 group-data-[active=true]:text-red group-data-[active=true]:opacity-100 group-data-[rail-tone=dark]:text-cream/85 lg:block"
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
