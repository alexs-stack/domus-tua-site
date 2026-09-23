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
// PRIMA DELL'IDRATAZIONE il layout a track c'è già (23 set. 2026): con
// `:root[data-hero-intro]` del boot script e la stessa media query, globals.css
// («I nastri e la rotaia prima del paint») arma schermo, track e pannelli e dà
// alla sezione l'altezza che `size()` qui sotto scriverà, così il ripristino
// dello scroll alla ricarica e le ancore trovano già la pagina finale. Il JS
// resta il solo a mettere [data-on]: le regole gemelle valgono finché manca.
// Chi cambia la corsa, la salita o la coda cambi anche l'altezza lì.
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
import { getLenis } from "./SmoothScroll";
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

/** Il canale del TRACK (A72, 22 set. 2026, notte). Un pannello che vuole un gesto agganciato al
 *  track (containerAnimation, come i sipari) si iscrive qui con useHorizonTrack: il nastro lo chiama
 *  quando il track esiste — subito, se esiste già — col tween e lo schermo, e tiene la pulizia che il
 *  gesto restituisce per quando il track muore (cambio di lingua, di media query, smontaggio). Il
 *  nastro chiama SOLO nel corridoio con motion ok: sotto la soglia il gesto non nasce. Fuori da un
 *  HorizonScroller il hook rende null. Oggi lo usano i pannelli del nastro di Costi chiari: Carmine
 *  (la foto affonda mentre il pannello attraversa lo schermo, chapters.ts `testimonianza`) e Seguici
 *  (il congedo del titolo allo sgancio dello schermo, `social`). */
export type TrackCb = (tween: gsap.core.Tween, screen: HTMLElement) => void | (() => void);
export type TrackSub = (cb: TrackCb) => () => void;
const TrackSlot = createContext<TrackSub | null>(null);
export function useHorizonTrack(): TrackSub | null {
  return useContext(TrackSlot);
}

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

/** La firma di `storia` (chapters.ts): il track del nastro di «Perché Domus Tua». I nastri della
 *  finestra (A57) e di Costi chiari (A72) portano la loro per prop. */
const STORIA = { ease: "dtHorScroll", scrub: 0.25 } as const;

export default function HorizonScroller({
  children,
  className = "",
  id,
  corridor,
  refreshKey,
  ease = STORIA.ease,
  scrub = STORIA.scrub,
  lead,
  tail,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Nome del corridoio in chapters.ts (A19), scritto come data-corridor sulla <section>. */
  corridor?: ChapterId;
  /** Cambia (es. locale) → l'intero context viene revertito e ricreato:
      altezza del track, gradini, sipari e cue si rimisurano sul testo nuovo. */
  refreshKey?: string;
  /** A57: la firma del capitolo che monta il nastro (ease e scrub del track); senza, quella di `storia` (D18). */
  ease?: string;
  scrub?: number | true;
  /** A57: la SALITA prima del track. Un elemento del primo pannello che GSAP fa salire di `distance`
      px, lineare e 1:1 con lo scroll, mentre lo schermo è già agganciato; la sezione si allunga di
      altrettanto e il track parte dopo. La finestra di Open Domus ci fa salire la facciata. */
  lead?: { selector: string; distance: (el: HTMLElement, screen: HTMLElement) => number };
  /** A67: la CODA dopo il track. L'elemento dell'ultimo pannello arriva già alzato di `from` px (≤ 0) e,
      finito il track, scende di `distance` px, lineare e 1:1, con gli elementi `also` che scendono di
      altrettanto da 0; la sezione si allunga di altrettanto. La finestra ci fa scendere la piscina. */
  tail?: {
    selector: string;
    also?: string;
    from: (el: HTMLElement, screen: HTMLElement) => number;
    distance: (el: HTMLElement, screen: HTMLElement) => number;
  };
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const api = useRef<RevealApi | null>(null);
  const deliver = useCallback((a: RevealApi) => {
    api.current = a;
  }, []);
  // Gli iscritti al canale del track, ognuno con la pulizia del suo gesto; `live` è il track di oggi.
  const subs = useRef(new Map<TrackCb, (() => void) | undefined>());
  const live = useRef<{ tween: gsap.core.Tween; screen: HTMLElement } | null>(null);
  const subscribe = useCallback<TrackSub>((cb) => {
    subs.current.set(cb, live.current ? cb(live.current.tween, live.current.screen) || undefined : undefined);
    return () => {
      const off = subs.current.get(cb);
      subs.current.delete(cb);
      if (off) off();
    };
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
        // A57: la salita. Misurata a ogni refresh insieme all'altezza: la sezione è alta quanto il
        // track PIÙ la salita, così il gesto resta 1:1 anche nel tratto verticale.
        const leadEl = lead ? root.querySelector<HTMLElement>(lead.selector) : null;
        const tailEl = tail ? root.querySelector<HTMLElement>(tail.selector) : null;
        const tailAlso = tail?.also ? gsap.utils.toArray<HTMLElement>(tail.also, root) : [];
        // Con la salita o la coda le quote sono esplicite e 1:1: la sezione è alta salita + corsa del
        // track + coda + schermo. Senza, resta il conto di storia (altezza = larghezza del track).
        const esplicito = Boolean(leadEl || tailEl);
        let leadPx = 0;
        let run = 0;
        let tailFrom = 0;
        let tailPx = 0;
        // La larghezza del track è quella dei pannelli (`offsetWidth`), NON `scrollWidth`: lo scrollWidth
        // conta anche lo sbordo dei gradini in parallasse (fino a ~80 px), che cambia con lo scroll, e a ogni
        // refresh spostava di altrettanto tutto quel che sta sotto il nastro (misurato il 22 set. sera sulla
        // coda della finestra, 81 px corti a fine sezione).
        const size = () => {
          leadPx = leadEl && lead ? Math.max(0, Math.round(lead.distance(leadEl, screen))) : 0;
          run = Math.max(0, track.offsetWidth - screen.clientWidth);
          tailFrom = tailEl && tail ? Math.min(0, Math.round(tail.from(tailEl, screen))) : 0;
          tailPx = tailEl && tail ? Math.max(0, Math.round(tail.distance(tailEl, screen))) : 0;
          root.style.height = esplicito ? `${leadPx + run + tailPx + screen.clientHeight}px` : `${track.offsetWidth}px`;
        };
        size();
        ScrollTrigger.addEventListener("refreshInit", size);

        if (leadEl) {
          gsap.fromTo(
            leadEl,
            { y: 0 },
            {
              y: () => -leadPx,
              ease: "none",
              scrollTrigger: { trigger: root, start: "top top", end: () => `+=${leadPx}`, scrub, invalidateOnRefresh: true },
            },
          );
        }

        const innesco: ScrollTrigger.Vars = {
          trigger: root,
          start: "2.5% top",
          end: "97.5% bottom",
          scrub,
          invalidateOnRefresh: true,
        };
        // Con la salita o la coda il track parte quando la salita è finita e finisce dopo la sua corsa
        // (chapters.ts `finestra`: "top+=salita top" → "top+=salita+corsa top").
        if (esplicito) {
          innesco.start = () => `top+=${leadPx} top`;
          innesco.end = () => `top+=${leadPx + run} top`;
        }
        const tween = gsap.to(track, {
          x: () => -(track.offsetWidth - screen.clientWidth),
          ease,
          scrollTrigger: innesco,
        });
        // Il track c'è: i gesti dei pannelli iscritti al canale nascono ora (A72).
        live.current = { tween, screen };
        for (const cb of subs.current.keys()) subs.current.set(cb, cb(tween, screen) || undefined);

        if (tailEl) {
          const coda = (): ScrollTrigger.Vars => ({
            trigger: root,
            start: () => `top+=${leadPx + run} top`,
            end: () => `+=${tailPx}`,
            scrub,
            invalidateOnRefresh: true,
          });
          gsap.fromTo(
            tailEl,
            { y: () => tailFrom },
            { y: () => tailFrom - tailPx, ease: "none", immediateRender: true, scrollTrigger: coda() },
          );
          if (tailAlso.length) {
            gsap.fromTo(tailAlso, { y: 0 }, { y: () => -tailPx, ease: "none", immediateRender: true, scrollTrigger: coda() });
          }
        }

        // La rete di fuoco del nastro (A57; la formula di spec §3.10 portata sui pannelli). Il Tab su un
        // focalizzabile di un pannello fuori scena farebbe scorrere lo schermo in orizzontale: `overflow:
        // hidden` scorre lo stesso col focus e il track trasformato resterebbe fuori posto. Si annulla
        // quello scroll e si porta la pagina alla quota in cui il pannello è in scena, invertendo l'ease
        // del track per bisezione; poi lo scrub salta a fine corsa. Solo col focus da tastiera.
        const onFocus = (e: FocusEvent) => {
          const el = e.target;
          const st = tween.scrollTrigger;
          if (!(el instanceof HTMLElement) || !el.matches(":focus-visible") || !st) return;
          screen.scrollLeft = 0;
          const panel = el.closest<HTMLElement>(".dt-horizon_panel") ?? el;
          const run = track.offsetWidth - screen.clientWidth;
          if (run <= 0) return;
          const target = Math.min(run, Math.max(0, panel.offsetLeft));
          const curva = gsap.parseEase(ease) as (t: number) => number;
          let lo = 0;
          let hi = 1;
          for (let i = 0; i < 24; i++) {
            const mid = (lo + hi) / 2;
            if (curva(mid) * run < target) lo = mid;
            else hi = mid;
          }
          const y = st.start + hi * (st.end - st.start);
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
          else window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          ScrollTrigger.update();
          st.getTween()?.progress(1);
        };
        screen.addEventListener("focusin", onFocus);

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
          // I gesti dei pannelli iscritti al canale muoiono col track (A72).
          for (const [cb, off] of subs.current) {
            if (off) off();
            subs.current.set(cb, undefined);
          }
          live.current = null;
          screen.removeEventListener("focusin", onFocus);
          ScrollTrigger.removeEventListener("refreshInit", size);
          root.removeAttribute("data-on");
          root.style.height = "";
          whenStill(() => requestRefresh());
        };
      });
    },
    { scope: rootRef, dependencies: [refreshKey, ease, scrub], revertOnUpdate: true }
  );

  return (
    <EnterSlot.Provider value={deliver}>
      <TrackSlot.Provider value={subscribe}>
        <section ref={rootRef} id={id} data-corridor={corridor} className={`dt-horizon ${className}`}>
          <div className="dt-horizon_screen">
            <div className="dt-horizon_track">{children}</div>
          </div>
        </section>
      </TrackSlot.Provider>
    </EnterSlot.Provider>
  );
}
