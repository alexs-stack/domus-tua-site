"use client";

/**
 * DomusTuaPreloader
 * ---------------------------------------------------------------------------
 * Preloader "a gomma". Un foglio pieno copre la pagina; una gomma percorre il
 * logo DomusTua con un unico tratto continuo (lobo sinistro → giro del rombo →
 * lobo destro, senza mai ripassare) e dentro la forma del logo compare il sito
 * sottostante. Quando la pagina è pronta la cancellatura si allarga a tutto lo
 * schermo e il componente si smonta da solo.
 *
 * Uso: una sola volta, nel layout principale, come primo figlio di <body>.
 *   <DomusTuaPreloader />
 *
 * - Solo React 18+, nessuna dipendenza. Stili inline: funziona con qualsiasi
 *   sistema di styling (Tailwind, CSS Modules, styled-components…).
 * - SSR-safe: il foglio è già nell'HTML del server, quindi copre la pagina dal
 *   primo frame, prima ancora dell'idratazione.
 * - Se la pagina è ancora in caricamento a disegno finito, il cuore batte
 *   finché non è pronta (con un tempo massimo, vedi `maxWait`).
 * - Rispetta "riduci movimento": logo statico e dissolvenza.
 * - Espone lo stato su <html data-gomma="active | reveal | done"> per
 *   agganciare via CSS eventuali animazioni d'ingresso del sito.
 * - Se JavaScript non parte, il foglio sparisce da solo (noscript + failsafe CSS).
 *
 * NEL SITO DOMUS TUA (22 set. 2026, Alberto: «devi sostituire l'entrata ad arco
 * del preloader con questo, al centro dello schermo, affianco a Raffaela, alla
 * sua destra»). Il componente è arrivato scritto per un sito generico; qui è la
 * PORTA del sipario, non il sipario intero, e non si monta nel layout: lo monta
 * Preloader.tsx in un portale dentro la shell (PreloaderShell.tsx, lo slot
 * `[data-pre-gomma]`) quando l'atto I ha finito, sotto la sagoma di Raffaela.
 * Geometria del logo, tracciato, tempi e logica sono quelli consegnati. Gli
 * adattamenti sono di forma, e servono solo a convivere col sipario che c'era:
 * - l'attributo su <html> è `data-gomma`, non `data-preloader`: quello è la
 *   macchina a stati del boot script di layout.tsx (film, porta corta, reti CSS,
 *   blocco dello scroll), e il valore "done" lasciato per sempre avrebbe murato
 *   la pagina;
 * - la classe è `dt-gomma` (e la keyframe `dt-gomma-failsafe`): `.dt-preloader`
 *   è già la shell, con le sue regole in globals.css;
 * - `SPEEDS` e `BOX` sono esportati (intro-constants.ts ricopia i tempi e il
 *   test intro-clocks li confronta; Preloader.tsx usa la scatola per centrare
 *   la foto dell'hero sul rombo del logo), e il logo e l'allargamento portano
 *   `data-gomma-logo` / `data-gomma-swell`: Preloader.tsx li legge per far
 *   sparire la sagoma di Raffaela (HTML sopra il foglio) insieme alla cancellatura.
 */
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

/* ── Tempi ──────────────────────────────────────────────────────────────── */

export type PreloaderSpeed = "lenta" | "normale" | "veloce";

export interface PreloaderTimings {
  /** Attesa iniziale a foglio pieno (ms). */
  delay: number;
  /** Durata del tratto della gomma (ms). */
  draw: number;
  /** Pausa a logo completo prima dell'uscita (ms). */
  hold: number;
  /** Durata dell'uscita, la cancellatura che si allarga (ms). */
  exit: number;
  /** Periodo del battito mentre si aspetta il caricamento (ms). */
  beat: number;
}

export const SPEEDS: Record<PreloaderSpeed, PreloaderTimings> = {
  lenta: { delay: 300, draw: 3300, hold: 480, exit: 1350, beat: 1150 },
  normale: { delay: 300, draw: 2300, hold: 360, exit: 1050, beat: 1150 },
  veloce: { delay: 200, draw: 1500, hold: 240, exit: 820, beat: 1150 },
};

/* ── Geometria del logo ──────────────────────────────────────────────────
   Ricostruita dal marchio, in "unità logo" (origine = centro del rombo).
   Non modificare: il tratto della gomma è calcolato su questi valori.      */

export const BOX = { x: -48.9, y: -48.9, w: 97.8, h: 90.4 } as const;

/** Pezzi rossi: lobo sinistro, diagonale interna (alto), "L", diagonale destra. */
const LOGO_RED = [
  "M -2.73 -43.6 A 29.35 29.35 0 0 0 -40.3 -40.3 A 29.35 29.35 0 0 0 -43.6 -2.73 L -35.33 -11 A 17.95 17.95 0 0 1 -32.24 -32.24 A 17.95 17.95 0 0 1 -11 -35.33 Z",
  "M -19.55 -21.96 L -11.48 -13.9 L 4.03 -29.41 L -4.03 -37.47 Z",
  "M -21.96 -19.55 L -13.9 -11.48 L -25.38 0 L 8.06 33.44 L 0 41.5 L -41.5 0 Z",
  "M 2.41 22.97 L 10.47 31.03 L 37.47 4.03 L 29.41 -4.03 Z",
] as const;

/** Pezzo grigio: la "D" (lobo destro + asta), con il suo foro. */
const LOGO_GREY = "M -8.06 -33.44 L 33.44 8.06 L 40.3 1.2 A 29.35 29.35 0 0 0 40.3 -40.3 A 29.35 29.35 0 0 0 -1.2 -40.3 Z M 8.12 -33.38 A 17.95 17.95 0 0 1 32.24 -32.24 A 17.95 17.95 0 0 1 33.38 -8.12 Z";

/** Percorso di Eulero sulle linee d'asse del logo: un solo tratto, nessun ripasso. */
const ERASER_PATH = "M -38.7 -5.68 A 23.65 23.65 0 0 1 -36.27 -36.27 A 23.65 23.65 0 0 1 -0.24 -33.2 L -33.44 0 L 0 33.44 L 33.44 0 L 0.24 -33.2 A 23.65 23.65 0 0 1 36.27 -36.27 A 23.65 23.65 0 0 1 33.2 -0.24";

/** Posizione degli spigoli lungo il tratto (0–1): lì la mano rallenta. */
const CORNERS: readonly number[] = [0.21588, 0.35182, 0.48875, 0.62568, 0.76162];

/** Larghezza della gomma: copre lo spessore del logo anche sugli spigoli vivi. */
const ERASER_WIDTH = 17.92;

/** Se JavaScript non prende il controllo entro 10 s, il foglio svanisce comunque. */
const FAILSAFE_CSS =
  "@keyframes dt-gomma-failsafe{to{opacity:0;visibility:hidden;pointer-events:none}}";
const NOSCRIPT_CSS = "<style>.dt-gomma{display:none!important}</style>";

/* ── Props ──────────────────────────────────────────────────────────────── */

export interface DomusTuaPreloaderProps {
  /** Colore del foglio che viene cancellato. Default "#ffffff" (alternative di marca: "#585957", "#E10716"). */
  sheetColor?: string;
  /** Preset di velocità. Default "normale". */
  speed?: PreloaderSpeed;
  /** Sovrascrive singoli tempi del preset (ms). */
  timings?: Partial<PreloaderTimings>;
  /**
   * Segnale di "pagina pronta". Se omesso si aspetta l'evento `load` della
   * finestra (immagini, font e script caricati). Se lo passi, comanda lui.
   */
  ready?: boolean;
  /** Attesa massima dopo il disegno, poi esce comunque (ms). Default 8000. */
  maxWait?: number;
  /** Rispetta la preferenza di sistema "riduci movimento". Default true. */
  respectReducedMotion?: boolean;
  /** Blocca lo scroll finché il sito non inizia a scoprirsi. Default true. */
  lockScroll?: boolean;
  /** Larghezza del logo: frazione del lato minore dello schermo, limitata tra min e max (px). */
  size?: { ratio?: number; min?: number; max?: number };
  /** Posizione verticale del centro del logo (0 = alto, 1 = basso). Default 0.47. */
  verticalCenter?: number;
  /** z-index del foglio. Default 9999. */
  zIndex?: number;
  /** Chiamato quando inizia l'uscita (il sito comincia a vedersi). */
  onReveal?: () => void;
  /** Chiamato a preloader concluso, subito prima dello smontaggio. */
  onDone?: () => void;
}

/* ── Utilità ────────────────────────────────────────────────────────────── */

type Phase = "delay" | "draw" | "hold" | "wait" | "exit";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInCubic = (t: number) => t * t * t;
/** Partenza e arrivo morbidi, senza fermarsi mai del tutto. */
const easeDraw = (t: number) => 0.35 * t + 0.65 * (0.5 - 0.5 * Math.cos(Math.PI * t));
const bump = (x: number) => (x > 0 && x < 1 ? Math.sin(Math.PI * x) : 0);
/** Doppio battito "tu-tum" su un ciclo 0–1. */
const heartbeat = (c: number) => 1 + 0.075 * bump(c / 0.16) + 0.045 * bump((c - 0.2) / 0.16);

/** Mappa tempo (0–1) → frazione di tratto percorsa, con rallentamenti sugli spigoli. */
function createTimeMap(corners: readonly number[]): (tau: number) => number {
  const n = 800;
  const table = new Float64Array(n + 1);
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const s = (i - 0.5) / n;
    let slow = 0;
    for (const c of corners) slow += Math.exp(-(((s - c) / 0.03) ** 2));
    acc += 1 / (1 - 0.55 * Math.min(1, slow));
    table[i] = acc;
  }
  for (let i = 0; i <= n; i++) table[i] = (table[i] ?? 0) / acc;
  return (tau) => {
    let lo = 0;
    let hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if ((table[mid] ?? 0) < tau) lo = mid;
      else hi = mid;
    }
    const a = table[lo] ?? 0;
    const b = table[hi] ?? 1;
    const f = b > a ? (tau - a) / (b - a) : 0;
    return clamp((lo + f) / n, 0, 1);
  };
}

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/* ── Componente ─────────────────────────────────────────────────────────── */

export default function DomusTuaPreloader({
  sheetColor = "#ffffff",
  speed = "normale",
  timings,
  ready,
  maxWait = 8000,
  respectReducedMotion = true,
  lockScroll = true,
  size,
  verticalCenter = 0.47,
  zIndex = 9999,
  onReveal,
  onDone,
}: DomusTuaPreloaderProps) {
  // ID stabili tra server e client, ripuliti per usarli dentro url(#…)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `dt-clip-${uid}`;
  const maskId = `dt-mask-${uid}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGGElement>(null);
  const eraserRef = useRef<SVGPathElement>(null);
  const swellRef = useRef<SVGPathElement>(null);
  const [finished, setFinished] = useState(false);

  // Valori sempre aggiornati, letti dal ciclo di animazione senza farlo ripartire
  const options = { speed, timings, maxWait, respectReducedMotion, lockScroll, size, verticalCenter };
  const optionsRef = useRef(options);
  const callbacksRef = useRef({ onReveal, onDone });
  const readyRef = useRef(false);

  useEffect(() => {
    optionsRef.current = options;
    callbacksRef.current = { onReveal, onDone };
  });

  // Pagina pronta: prop `ready` se presente, altrimenti evento `load` della finestra
  useEffect(() => {
    if (typeof ready === "boolean") {
      readyRef.current = ready;
      return;
    }
    const sync = () => {
      readyRef.current = document.readyState === "complete";
    };
    sync();
    window.addEventListener("load", sync);
    return () => window.removeEventListener("load", sync);
  }, [ready]);

  // Animazione: parte una volta al montaggio, tutto via DOM (nessun re-render per frame)
  useEffect(() => {
    const root = rootRef.current;
    const logo = logoRef.current;
    const eraser = eraserRef.current;
    const swell = swellRef.current;
    if (!root || !logo || !eraser || !swell) return;

    const o = optionsRef.current;
    const t: PreloaderTimings = { ...SPEEDS[o.speed], ...o.timings };
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    let finishedHere = false;

    root.style.animation = "none"; // JS ha preso il controllo: disattiva il failsafe CSS
    html.dataset.gomma = "active";
    if (o.lockScroll) html.style.overflow = "hidden";

    const len = eraser.getTotalLength();
    eraser.setAttribute("stroke-dasharray", `${len} ${len + 2}`);
    const progressAt = createTimeMap(CORNERS);

    const geo = { s: 1, cx: 0, cy: 0, w: 0, h: 0 };
    let pulse = 1;

    const layout = () => {
      const w = root.clientWidth || window.innerWidth;
      const h = root.clientHeight || window.innerHeight;
      const px = clamp(Math.min(w, h) * (o.size?.ratio ?? 0.26), o.size?.min ?? 132, o.size?.max ?? 240);
      geo.w = w;
      geo.h = h;
      geo.s = px / BOX.w;
      geo.cx = w / 2;
      geo.cy = h * o.verticalCenter;
      const k = geo.s * pulse;
      const mx = BOX.x + BOX.w / 2;
      const my = BOX.y + BOX.h / 2;
      logo.setAttribute("transform", `translate(${geo.cx} ${geo.cy}) scale(${k}) translate(${-mx} ${-my})`);
    };

    // Larghezza del tratto che copre tutto lo schermo, in unità logo
    const coverWidth = () => {
      const dx = Math.max(geo.cx, geo.w - geo.cx);
      const dy = Math.max(geo.cy, geo.h - geo.cy);
      return 2 * (Math.hypot(dx, dy) / geo.s + 60);
    };

    const setDraw = (p: number, width: number) => {
      eraser.setAttribute("stroke-dashoffset", (len * (1 - p)).toFixed(3));
      eraser.setAttribute("stroke-width", width.toFixed(3));
    };

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      html.dataset.gomma = "reveal";
      root.style.pointerEvents = "none"; // il sito è già cliccabile durante l'uscita
      if (o.lockScroll) html.style.overflow = prevOverflow;
      callbacksRef.current.onReveal?.();
    };

    const finish = () => {
      finishedHere = true;
      html.dataset.gomma = "done";
      callbacksRef.current.onDone?.();
      setFinished(true);
    };

    let raf = 0;
    let fadeTimer = 0;
    const start = performance.now();
    const isReady = (now: number) =>
      readyRef.current || now - start > t.delay + t.draw + t.hold + o.maxWait;

    window.addEventListener("resize", layout);
    layout();
    setDraw(0, 0);

    const reduceMotion =
      o.respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      // Nessun tratto: logo già cancellato, poi dissolvenza del foglio
      setDraw(1, ERASER_WIDTH);
      const wait = (now: number) => {
        if (now - start < 700 || !isReady(now)) {
          raf = requestAnimationFrame(wait);
          return;
        }
        reveal();
        root.style.transition = "opacity 500ms ease";
        root.style.opacity = "0";
        fadeTimer = window.setTimeout(finish, 520);
      };
      raf = requestAnimationFrame(wait);
    } else {
      let phase: Phase = "delay";
      let t0 = start;
      const go = (next: Phase, now: number) => {
        phase = next;
        t0 = now;
      };

      const tick = (now: number) => {
        const e = now - t0;
        if (phase === "delay") {
          if (e >= t.delay) go("draw", now);
        } else if (phase === "draw") {
          const k = Math.min(1, e / t.draw);
          setDraw(progressAt(easeDraw(k)), ERASER_WIDTH * easeOutCubic(Math.min(1, e / 220)));
          if (k >= 1) go("hold", now);
        } else if (phase === "hold") {
          if (e >= t.hold) go(isReady(now) ? "exit" : "wait", now);
        } else if (phase === "wait") {
          // Pagina ancora in caricamento: il cuore batte
          const c = (e % t.beat) / t.beat;
          pulse = heartbeat(c);
          layout();
          if (c > 0.45 && isReady(now)) {
            pulse = 1;
            layout();
            go("exit", now);
          }
        } else {
          // Uscita: la cancellatura si allarga fino a scoprire tutto
          reveal();
          const k = Math.min(1, e / t.exit);
          swell.setAttribute("stroke-width", (coverWidth() * easeInCubic(k)).toFixed(2));
          if (k >= 1) {
            finish();
            return;
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimer);
      window.removeEventListener("resize", layout);
      if (o.lockScroll) html.style.overflow = prevOverflow;
      if (!finishedHere) html.dataset.gomma = "done";
    };
  }, []);

  if (finished) return null;

  return (
    <div
      ref={rootRef}
      className="dt-gomma"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        color: sheetColor,
        animation: "dt-gomma-failsafe 400ms ease 10s forwards",
      }}
    >
      <style>{FAILSAFE_CSS}</style>
      <noscript dangerouslySetInnerHTML={{ __html: NOSCRIPT_CSS }} />
      <span style={srOnly}>Caricamento in corso</span>
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      >
        <defs>
          <clipPath id={clipId}>
            {LOGO_RED.map((d) => (
              <path key={d} d={d} />
            ))}
            <path d={LOGO_GREY} clipRule="evenodd" />
          </clipPath>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <rect width="100%" height="100%" fill="#fff" />
            <g ref={logoRef} data-gomma-logo="">
              <g clipPath={`url(#${clipId})`}>
                <path
                  ref={eraserRef}
                  d={ERASER_PATH}
                  fill="none"
                  stroke="#000"
                  strokeWidth={0}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
              </g>
              <path
                ref={swellRef}
                data-gomma-swell=""
                d={ERASER_PATH}
                fill="none"
                stroke="#000"
                strokeWidth={0}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="currentColor" mask={`url(#${maskId})`} />
      </svg>
    </div>
  );
}
