"use client";

// HorizonScroller — pannelli cuciti in orizzontale mentre la pagina scorre in
// verticale (tecnica del riferimento era-residence, §11 del dossier in
// reverse-engineering/; A12 di Alberto, 2026-09-11: il nastro resta): screen
// sticky + track flex, l'altezza della sezione È la larghezza del track così la
// velocità del gesto resta 1:1. Il track scorre con la curva "dtHorScroll"
// (scrub 0.25) e fa da containerAnimation per i sipari dei media.
//
// Contratto coi contenuti (attributi e componenti fra i discendenti):
//   data-horizon-stair           righe del titolo a gradini (parallasse contraria)
//   data-horizon-slide           media col reveal a sipario (clip-path)
//   data-horizon-slide-img       il media dentro lo slide (scale 1.15 → 1)
//   <HorizonEnter>               il gruppo di testo che entra al cue del nastro
//
// I TESTI NON LI ANIMA QUESTO COMPONENTE (A20 di Alberto; spec 2026-09-13
// §2.4): titoli, lead e blocchi sono gruppi del motore dei reveal
// (app/lib/motion/reveal-engine.ts). Nel nastro un gruppo a IO entra quando è
// in scena ed esce, risalendo, a destra della linea dell'85 %. <HorizonEnter>
// è un gruppo manuale: col nastro acceso lo fanno entrare il cue «top 70%»
// della radice e uscire la risalita sotto quel punto; sotto la soglia qui
// sotto il motore lo passa all'IO.
//
// Il set piece ORIZZONTALE vive SOLO con MQ.corridor (D22: 1024 px di
// larghezza, 640 di altezza, motion ok): l'attributo
// [data-on] che accende il layout a track viene messo esclusivamente via JS,
// quindi con reduced-motion o senza JS i pannelli restano in colonna, statici
// e completi — nessuno stato nascosto o clippato. La <section> porta
// data-corridor (A19): corridors.spec.ts conta gli host accesi.
//
// Sotto quella soglia la stessa storia si racconta in VERTICALE. Non è una
// versione ridotta: è lo stesso film senza lo schermo sticky (verdetto 15
// dell'onda «parità mobile 2», PORT-SENZA-PIN). Gli attributi del contratto qui
// sopra non nominano un asse, quindi il ramo in colonna li riusa TUTTI —
// sipario e gradini — e sposta solo il punto da cui si guarda: dove il nastro
// innesca sulla corsa della sezione sticky, qui innesca ogni pezzo quando entra
// davvero in campo.
// L'onda precedente aveva tradotto tre di questi in «fermo» o «reveal a
// blocco»: le note che lo giustificavano sono riscritte una per una là dove
// stava il taglio, perché due di quelle misure rispondevano a un'altra domanda.
// Quello che il ramo in colonna non fa, mai: mettere [data-on] (tutto il layout
// a track in globals.css gli pende sotto), scrivere un'altezza sulla radice,
// pinnare o chiedere un refresh. La colonna resta la colonna.
import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import type { ChapterId } from "../../lib/motion/chapters";
import type { RevealApi } from "../../lib/motion/reveal-engine";
import { gsap, ScrollTrigger, useGSAP, MQ, requestRefresh, whenStill } from "../../lib/motion/gsap";
import RevealGroup from "./RevealGroup";

/** Il sipario del media: dura più di un reveal perché il clip-path deve
 *  attraversare tutta la larghezza dell'immagine con la scala interna che
 *  cammina insieme a lui. Vale a OGNI larghezza. Qui c'era scritto che sul
 *  telefono «la finestra utile è più corta» e il ramo mobile correva in
 *  dur.reveal: la finestra era corta perché l'innesco stava a "top 90%", cioè
 *  il sipario si apriva su un'immagine ancora fuori campo. Quel difetto è già
 *  stato curato spostando l'innesco a "top 70%" (la misura sta nel ramo);
 *  accorciare anche la durata era curare due volte lo stesso sintomo, e
 *  toglieva al telefono il momento di firma del capitolo. */
const CURTAIN_DUR = 1.6;

/** Il canale con cui <HorizonEnter> consegna la sua api al nastro che la
 *  contiene (spec §2.4). Il gruppo si registra nel suo layout effect, che
 *  gira prima dell'effetto del nastro: al momento del cue l'api c'è già. */
const EnterSlot = createContext<((api: RevealApi) => void) | null>(null);

/** Il gruppo di testo che il nastro fa entrare al suo cue: `enter` di spec §2.4,
 *  manuale con cue a «top 70%» della radice, che esce risalendo (A18 di
 *  Alberto). Oggi lo usa il pannello del manifesto in HorizonStory. Resta
 *  manuale solo sotto [data-corridor][data-on] (CUE_ANCESTOR del motore): in
 *  colonna, o fuori da un HorizonScroller, il motore lo fa entrare con l'IO. */
export function HorizonEnter({ className, children }: { className?: string; children: ReactNode }) {
  const deliver = useContext(EnterSlot);
  return (
    <RevealGroup trigger="manual" className={className} onReady={deliver ?? undefined}>
      {children}
    </RevealGroup>
  );
}

export default function HorizonScroller({
  children,
  className = "",
  id,
  corridor,
  refreshKey,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Nome del corridoio in chapters.ts (A19), scritto come data-corridor sulla <section>. */
  corridor?: ChapterId;
  /** Cambia (es. locale) → l'intero context viene revertito e ricreato:
      altezza del track, gradini, sipari e cue si rimisurano sul testo nuovo. */
  refreshKey?: string;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const api = useRef<RevealApi | null>(null);
  const deliver = useCallback((a: RevealApi) => {
    api.current = a;
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      // Il nastro è un corridoio sticky: gate MQ.corridor (D22), cioè 1024 px
      // di larghezza, 640 di altezza e motion ok. Sotto la soglia, a qualunque
      // larghezza, gira il ramo in colonna qui sotto.
      mm.add({ desktop: MQ.corridor, motionOk: MQ.motionOk }, (ctx) => {
        const c = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!c.motionOk) return;

        // ── Ramo in colonna: stessa storia, asse verticale ─────────────────
        // Il gesto del nastro è "attraversare quattro capitoli di lato". Col
        // dito quel gesto non esiste, e un carosello a snap sarebbe un
        // ridisegno travestito da porting (le ragioni stanno in
        // docs/mobile-parity.md §3.1). Qui resta la colonna e si sposta l'ASSE
        // dei trigger: ogni capitolo si apre quando lo si raggiunge, invece di
        // arrivare tutto insieme. Gli ATTI del nastro però sono gli stessi —
        // sipario e gradini — perché senza lo schermo sticky si perde il nastro,
        // non la coreografia. I testi qui non hanno trigger propri: sono gruppi
        // del motore dei reveal, che sotto MQ.corridor li fa entrare con l'IO
        // (spec §2.4).
        if (!c.desktop) {
          // ── Titolo a gradini: le righe scivolano, in pixel clampati ───────
          // Il desktop fa uno scrub ORIZZONTALE (`xPercent` wrap([-5,25,-15]) →
          // wrap([5,-25,25])) e questo ramo teneva le righe ferme. La misura
          // che lo giustificava rispondeva però a un'altra domanda: parlava di
          // uno scrub VERTICALE — a 390px il titolo sta a 41,6px con leading
          // .95, fra l'inchiostro di due righe maiuscole restano ~10px e
          // direzioni alternate le avrebbero fatte toccare già a ±12px. È vero,
          // e vale sull'asse Y. Sull'asse X due righe `display:block` una sotto
          // l'altra non si toccano mai, qualunque cosa facciano.
          //
          // Rimisurato sull'asse giusto (audit §4.3): a 390 ogni riga è larga
          // 350px in un contenitore che parte a left 20 — 20px di margine per
          // lato. Coi valori desktop in PERCENTUALE la terza riga partirebbe a
          // 20 − 52 = −32px: testo tagliato e documento che sborda. Quindi la
          // stessa corsa, in PIXEL clampati a ±16 (dentro i 20 di margine):
          // è il 64% delle ampiezze desktop, cioè lo stesso rapporto fra corsa
          // e aria disponibile su un contenitore sette volte più stretto.
          // Le direzioni e i rapporti fra le tre righe restano quelli.
          //
          // Alleggerimento nominato: `x` è transform (composited, zero layout,
          // niente `will-change` permanente), il trigger è il titolo stesso —
          // nessuna altezza scritta, nessun pin, nessun refresh — e la sezione
          // prende `overflow-x: clip` (globals.css, blocco dt-horizon) come
          // rete contro lo sbordo a ogni larghezza.
          const stairs = gsap.utils.toArray<HTMLElement>("[data-horizon-stair]", root);
          const stairsHead = stairs[0]?.parentElement;
          if (stairs.length && stairsHead) {
            gsap.fromTo(
              stairs,
              { x: gsap.utils.wrap([-3, 16, -10]) },
              {
                x: gsap.utils.wrap([3, -16, 16]),
                ease: "none",
                scrollTrigger: {
                  // La traversata del titolo, non della sezione: senza pin la
                  // finestra utile è quella in cui il titolo si vede. Il
                  // titolo può fare da trigger a ciò che contiene perché le
                  // righe si muovono in x: il suo rettangolo cambia in
                  // orizzontale, e start/end leggono solo top e bottom.
                  trigger: stairsHead,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 0.25,
                },
              }
            );
          }

          // ── Media a sipario: il momento di firma, ed è senza asse ─────────
          // clip-path da inset(0% 100% 0% 0%) a inset(0) più la scala interna
          // 1.15 → 1: si apre da sinistra a destra e su un telefono legge
          // identico al desktop. Qui era scritto che per questo restavano
          // anche l'innesco e la durata del desktop — «è lo stesso momento, non
          // una versione ridotta». Misurato, il risultato era il contrario di
          // quell'intenzione: su un viewport da 664px, con "top 90%", il
          // sipario del territorio era aperto all'88% prima che l'immagine
          // fosse tutta in campo, e quello delle recensioni finiva prima di
          // essere visibile. Il momento c'era e si vedeva a metà. Quindi il
          // telefono entra più tardi: a "top 70%" l'immagine è in campo.
          //
          // La cura si fermava lì per metà: insieme all'innesco era stata
          // accorciata anche la DURATA (dur.reveal, 0,9 s), e le due cose non
          // avevano la stessa ragione. Spostato l'innesco, la finestra utile
          // c'è tutta: il sipario torna a CURTAIN_DUR — 1,6 s, gli stessi del
          // desktop. Stesso gesto, stessa curva, stesso tempo: cambia solo
          // dove capita.
          gsap.utils.toArray<HTMLElement>("[data-horizon-slide]", root).forEach((el) => {
            // La polaroid del pannello video è `hidden lg:block`: qui non ha
            // box, e un trigger su un nodo non renderizzato è un trigger speso
            // a vuoto.
            if (!el.getClientRects().length) return;
            const img = el.querySelector<HTMLElement>("[data-horizon-slide-img]");
            gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" });
            if (img) gsap.set(img, { scale: 1.15 });
            let stl: gsap.core.Timeline | null = null;
            ScrollTrigger.create({
              trigger: el,
              start: "top 70%",
              onEnter: () => {
                if (!stl) {
                  stl = gsap.timeline({ paused: true });
                  stl.to(
                    el,
                    { clipPath: "inset(0% 0% 0% 0%)", duration: CURTAIN_DUR, ease: "dtOut" },
                    0
                  );
                  if (img) stl.to(img, { scale: 1, duration: CURTAIN_DUR, ease: "dtOut" }, 0);
                }
                stl.restart();
              },
              onLeaveBack: () => stl?.reverse(),
            });
          });

          return;
        }

        const screen = root.querySelector<HTMLElement>(".dt-horizon_screen");
        const track = root.querySelector<HTMLElement>(".dt-horizon_track");
        if (!screen || !track) return;

        // Layout orizzontale SOLO da qui in poi (CSS su [data-on] in globals).
        // Il refresh fa rileggere al motore dei reveal i gruppi registrati
        // prima di questo effetto: col nastro acceso <HorizonEnter> diventa
        // manuale e i gruppi del track prendono l'asse x. A scroll fermo (D53,
        // whenStill di gsap.ts): il nastro monta con l'arrivo nativo al
        // frammento ancora in volo (/#cerca, /#contatti) e un refresh forzato
        // lo cancellerebbe. L'attesa si annulla nel cleanup.
        root.setAttribute("data-on", "");
        const stopRefresh = whenStill(() => requestRefresh());

        // Altezza sezione = larghezza track: la distanza verticale da percorrere
        // coincide con quella orizzontale. Rimisurata a ogni refresh (trappola
        // nota: altezze dinamiche + ScrollTrigger, vedi dossier WOW layer).
        const size = () => {
          root.style.height = `${track.scrollWidth}px`;
        };
        size();
        ScrollTrigger.addEventListener("refreshInit", size);

        const tween = gsap.to(track, {
          x: () => -(track.scrollWidth - screen.clientWidth),
          ease: "dtHorScroll",
          scrollTrigger: {
            trigger: root,
            start: "2.5% top",
            end: "97.5% bottom",
            scrub: 0.25,
            invalidateOnRefresh: true,
          },
        });

        // ── Il cue di <HorizonEnter> (spec §2.4) ───────────────────────────
        // «top 70%» della radice: lo schermo sticky è entrato per il 30 % della
        // sua altezza. Entrata e uscita le suona il motore coi valori dei ruoli
        // (spec §2.2); qui si decide solo quando. A un refresh oltre il cue
        // (ricarica a metà pagina, rotazione) l'entrata scatta una volta: un
        // gruppo già passato il motore non lo rigioca.
        const forward = () => api.current?.play("in");
        const backward = () => api.current?.play("out");
        ScrollTrigger.create({
          trigger: root,
          start: "top 70%",
          onEnter: forward,
          onLeaveBack: backward,
          onRefresh: (self) => {
            if (self.progress > 0) forward();
          },
        });

        // ── Titolo a gradini: le righe scivolano in direzioni alternate ────
        const stairs = gsap.utils.toArray<HTMLElement>("[data-horizon-stair]", track);
        if (stairs.length) {
          gsap.fromTo(
            stairs,
            { xPercent: gsap.utils.wrap([-5, 25, -15]) },
            {
              xPercent: gsap.utils.wrap([5, -25, 25]),
              ease: "none",
              scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.25 },
            }
          );
        }

        // ── Media a sipario: clip-path + scale interna ─────────────────────
        gsap.utils.toArray<HTMLElement>("[data-horizon-slide]", track).forEach((el) => {
          const img = el.querySelector<HTMLElement>("[data-horizon-slide-img]");
          gsap.set(el, { clipPath: "inset(0% 100% 0% 0%)" });
          if (img) gsap.set(img, { scale: 1.15 });
          // Replay a ogni passaggio: timeline persistente in closure —
          // restart all'ingresso, reverse risalendo oltre l'inizio.
          let stl: gsap.core.Timeline | null = null;
          ScrollTrigger.create({
            trigger: el,
            containerAnimation: tween,
            start: "left 90%",
            onEnter: () => {
              if (!stl) {
                stl = gsap.timeline({ paused: true });
                stl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: CURTAIN_DUR, ease: "dtOut" }, 0);
                if (img) stl.to(img, { scale: 1, duration: CURTAIN_DUR, ease: "dtOut" }, 0);
              }
              stl.restart();
            },
            onLeaveBack: () => stl?.reverse(),
          });
        });

        return () => {
          stopRefresh();
          ScrollTrigger.removeEventListener("refreshInit", size);
          root.removeAttribute("data-on");
          root.style.height = "";
          whenStill(() => requestRefresh());
        };
      });
    },
    { scope: rootRef, dependencies: [refreshKey], revertOnUpdate: true }
  );

  return (
    <EnterSlot.Provider value={deliver}>
      <section ref={rootRef} id={id} data-corridor={corridor} className={`dt-horizon ${className}`}>
        <div className="dt-horizon_screen">
          <div className="dt-horizon_track">{children}</div>
        </div>
      </section>
    </EnterSlot.Provider>
  );
}
