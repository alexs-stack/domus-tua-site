"use client";

// Fioritura — i fiori negli angoli del riferimento era-residence (§11.3 del
// dossier) e la scritta che si digita da sola, ricostruiti sul SORGENTE vero
// di uuuulala/WebGL-typing-tutorial (js/03_flowers.js, MIT). Dal riferimento
// prendiamo la grammatica esatta:
//   · ogni punto acceso del disegno → una particella, 80% corolle / 20% foglie;
//   · taglie pow() spinte: una folla di fiori minuti e rare corolle "eroiche";
//   · sboccio con decadimento (deltaScale che decade), poi RESPIRO ASSOLUTO
//     maxScale + A·sin(age): i fiori piccoli pulsano dentro/fuori l'esistenza
//     — è il dettaglio che rende viva la scena — e derivano di rotazione;
//   · foglie piantate sullo stelo (il corpo cresce mezzo sprite sopra il punto)
//     e disegnate DOPO le corolle (ordine di pittura del riferimento);
//   · modalità typing: la parola si scrive lettera per lettera con un caret
//     che lampeggia a onda quadra morbida (sign(sin πt)·sin^0.2, periodo 1s)
//     e si spegne a parola conclusa; fuori viewport si riavvolge e ridigita.
// Porting su canvas 2D puro: niente Three.js (vietato dal budget librerie),
// sprite pre-tinte + setTransform per istanza — poche centinaia di particelle
// bastano e il loop gira solo quando il canvas è in viewport.
//
// Solo decorazione (aria-hidden). Reduced-motion: fioritura già completa,
// disegnata una volta, nessun caret né loop. Senza JS il canvas resta vuoto:
// nessun contenuto vive qui. Quando il cliente consegnerà i suoi fiori
// (SVG/PNG), basterà sostituire makeFlowerSprite/makeLeafSprite.
import { useEffect, useRef } from "react";

type Variant = "corner-tl" | "corner-tr" | "corner-bl" | "corner-br" | "center";
type Palette = "light" | "dark";

/* Tinte DALLA palette (globals.css @theme): rossi di brand per i petali,
   neutri caldi stone/graphite per le foglie — un erbario, non un prato.
   Il caret è rosso Domus sul chiaro, crema sul scuro. */
const TINTS: Record<
  Palette,
  { flowers: string[]; leaves: string[]; heart: string; caret: string }
> = {
  light: {
    flowers: ["#d20a0a", "#b21010", "#a30707", "#e0483d", "#efb9b2"],
    leaves: ["#6b665f", "#857b6d", "#46423d"],
    heart: "#fffdf8",
    caret: "#d20a0a",
  },
  dark: {
    flowers: ["#f2ebda", "#fbeaea", "#e0483d", "#fffdf8", "#d20a0a"],
    leaves: ["rgba(242,235,218,0.55)", "rgba(227,217,198,0.45)"],
    heart: "#2a100f",
    caret: "#f2ebda",
  },
};

const SPRITE = 64; // lato degli sprite pre-renderizzati

/* Cadenza del typing (frame a ~60fps): attesa col solo caret che lampeggia,
   poi una lettera ogni TYPE_STEP (~250ms, battitura umana); a parola finita
   il caret insiste ancora TYPE_TAIL frame e poi si spegne. */
const TYPE_WAIT = 55;
const TYPE_STEP = 15;
const TYPE_TAIL = 200;

function makeFlowerSprite(tint: string, heart: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = SPRITE;
  const g = c.getContext("2d")!;
  g.translate(SPRITE / 2, SPRITE / 2);
  for (let i = 0; i < 5; i++) {
    g.save();
    g.rotate((i * 2 * Math.PI) / 5);
    g.beginPath();
    g.ellipse(0, -13, 7.5, 14, 0, 0, 2 * Math.PI);
    // Petali traslucidi: gli strati si sommano ad acquerello come le
    // opacity .3 del riferimento (qui più coprenti: siamo su fondi caldi).
    g.globalAlpha = 0.85;
    g.fillStyle = tint;
    g.fill();
    g.restore();
  }
  g.globalAlpha = 1;
  g.beginPath();
  g.arc(0, 0, 4.5, 0, 2 * Math.PI);
  g.fillStyle = heart;
  g.fill();
  return c;
}

function makeLeafSprite(tint: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = SPRITE;
  const g = c.getContext("2d")!;
  // Base dello stelo in basso, punta in alto: il draw pianta la base sul
  // punto campionato e solleva il corpo (rif. position.y += .5*scale).
  g.translate(SPRITE / 2, SPRITE / 2);
  g.beginPath();
  g.moveTo(0, 28);
  g.quadraticCurveTo(-11, 4, 0, -28);
  g.quadraticCurveTo(11, 4, 0, 28);
  g.closePath();
  g.globalAlpha = 0.8;
  g.fillStyle = tint;
  g.fill();
  return c;
}

/* Particella: stessa grammatica di crescita del riferimento (deltaScale che
   decade, respiro assoluto sin(age), deriva di rotazione). delay0/deltaScale0
   servono al replay del typing (riavvolgere e ridigitare). */
type Particle = {
  x: number;
  y: number;
  sprite: HTMLCanvasElement;
  isLeaf: boolean;
  scale: number;
  maxScale: number;
  deltaScale: number;
  deltaScale0: number;
  age: number;
  ageDelta: number;
  rot: number;
  delay: number;
  delay0: number;
  growing: boolean;
};

/** Disegna il tralcio d'angolo sull'offscreen (orientamento TL, poi specchiato).
    Secondo giro (2026-08-05, "più fiori negli angoli"): rami lungo ENTRAMBI i
    bordi, getti interni, rametti corti e gemme piene ai capi — i dischi
    diventano i grappoli di corolle dove ogni ramo finisce. */
function drawVine(g: CanvasRenderingContext2D, w: number, h: number) {
  g.lineWidth = 9;
  g.lineCap = "round";
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  // Ramo principale: entra dall'angolo e si inarca dentro il quadro
  g.beginPath();
  g.moveTo(-6, h * 0.06);
  g.bezierCurveTo(w * 0.22, h * 0.1, w * 0.34, h * 0.34, w * 0.42, h * 0.62);
  g.bezierCurveTo(w * 0.46, h * 0.76, w * 0.42, h * 0.9, w * 0.34, h * 0.98);
  g.stroke();
  // Ramo secondario: costeggia il bordo alto
  g.beginPath();
  g.moveTo(w * 0.08, -6);
  g.bezierCurveTo(w * 0.3, h * 0.12, w * 0.58, h * 0.14, w * 0.82, h * 0.08);
  g.stroke();
  // Terzo ramo: scende lungo il bordo sinistro
  g.beginPath();
  g.moveTo(-6, h * 0.3);
  g.bezierCurveTo(w * 0.12, h * 0.42, w * 0.14, h * 0.62, w * 0.1, h * 0.84);
  g.stroke();
  // Getto verso il centro
  g.beginPath();
  g.moveTo(w * 0.2, h * 0.24);
  g.quadraticCurveTo(w * 0.42, h * 0.3, w * 0.56, h * 0.44);
  g.stroke();
  // Due rametti corti che si staccano dal ramo principale
  g.beginPath();
  g.moveTo(w * 0.36, h * 0.4);
  g.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.6, h * 0.3);
  g.stroke();
  g.beginPath();
  g.moveTo(w * 0.42, h * 0.66);
  g.quadraticCurveTo(w * 0.54, h * 0.68, w * 0.62, h * 0.78);
  g.stroke();
  // Gemme piene ai capi dei rami: grappoli fitti di particelle
  const buds: [number, number, number][] = [
    [w * 0.82, h * 0.08, 12],
    [w * 0.56, h * 0.44, 10],
    [w * 0.34, h * 0.98, 11],
    [w * 0.1, h * 0.84, 10],
    [w * 0.6, h * 0.3, 9],
    [w * 0.62, h * 0.78, 9],
  ];
  for (const [x, y, r] of buds) {
    g.beginPath();
    g.arc(x, y, r, 0, 2 * Math.PI);
    g.fill();
  }
}

export default function Fioritura({
  word,
  typing = false,
  variant = "corner-tl",
  palette = "light",
  className = "",
}: {
  /** Se presente: la scritta in fiori (Playfair corsivo). Altrimenti: tralcio d'angolo. */
  word?: string;
  /** Solo con `word`: la scritta si digita da sola — caret lampeggiante e
      lettere che sbocciano una dopo l'altra — a ogni ingresso in viewport. */
  typing?: boolean;
  variant?: Variant;
  palette?: Palette;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isTyping = Boolean(word && typing) && !reduced;
    // 100px come textureFontSize del riferimento: le misure dei fiori sotto
    // sono calibrate su questo corpo.
    const fontPx = word ? 100 : 88;
    const tints = TINTS[palette];
    const flowerSprites = tints.flowers.map((t) => makeFlowerSprite(t, tints.heart));
    const leafSprites = tints.leaves.map((t) => makeLeafSprite(t));

    let particles: Particle[] = [];
    let widths: number[] = []; // larghezze dei prefissi (typing): posizione del caret
    let texW = 0;
    let texH = 0;
    let raf = 0;
    let frame = 0;
    let running = false;
    let started = reduced; // reduced: già fiorito, niente attesa di scroll
    let cancelled = false;

    /* Campiona il disegno offscreen → particelle in coordinate texture. */
    const build = (fontFamily: string) => {
      const off = document.createElement("canvas");
      const g = off.getContext("2d")!;
      // Passo di campionamento: sulle scritte OGNI pixel come il riferimento
      // (è la densità di micro-fiori a rendere leggibile la parola); sui
      // tralci passo 2 per tenere i conti bassi.
      const step = word ? 1 : 2;
      if (word) {
        // Peso 400 (il minimo del variable Playfair): più il tratto è sottile,
        // più la parola resta LEGGIBILE una volta vestita di fiori — il
        // riferimento usa un Baskerville weight 100 per lo stesso motivo.
        g.font = `italic 400 ${fontPx}px ${fontFamily}`;
        const m = g.measureText(word);
        texW = Math.ceil(m.width) + 24;
        texH = Math.ceil(fontPx * 1.3);
        off.width = texW;
        off.height = texH;
        g.font = `italic 400 ${fontPx}px ${fontFamily}`;
        g.fillStyle = "#fff";
        g.fillText(word, 12, fontPx * 1.02);
        // Prefissi per il typing: widths[k] = larghezza di word.slice(0, k)
        widths = isTyping
          ? Array.from({ length: word.length + 1 }, (_, k) =>
              g.measureText(word.slice(0, k)).width
            )
          : [];
      } else {
        texW = texH = 320;
        off.width = texW;
        off.height = texH;
        drawVine(g, texW, texH);
      }

      const data = g.getImageData(0, 0, texW, texH).data;
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < texH; y += step) {
        for (let x = 0; x < texW; x += step) {
          if (data[(x + y * texW) * 4 + 3] > 0) pts.push({ x, y });
        }
      }
      // Tetto di sicurezza per canvas: mai oltre queste istanze (le scritte
      // reggono migliaia di micro-sprite; su schermi piccoli si scende)
      const small = window.matchMedia("(max-width: 640px)").matches;
      const cap = word ? (small ? 2200 : 3500) : 1500;
      while (pts.length > cap) pts.splice(Math.floor(Math.random() * pts.length), 1);

      particles = pts.map((p) => {
        const isLeaf = Math.random() < 0.2; // 80/20 corolle/foglie (riferimento)
        const sprite = isLeaf
          ? leafSprites[Math.floor(Math.random() * leafSprites.length)]
          : flowerSprites[Math.floor(Math.random() * flowerSprites.length)];
        // pow() spinta come il riferimento (.9·rand^20 / .1+.7·rand^7): folla
        // minuta + rare corolle eroiche. Sulle scritte le MISURE del
        // riferimento: quad 1.2 unità × fontScaleFactor .085 ≈ 13% dell'em a
        // taglia piena — col nostro sprite da 64px (mult 1.15) il tetto è
        // ~0.18; il micro-floor tiene la parola leggibile anche da ferma.
        const maxScale = isLeaf
          ? word
            ? 0.02 + 0.14 * Math.pow(Math.random(), 7)
            : 0.1 + 0.38 * Math.pow(Math.random(), 7)
          : word
            ? 0.02 + 0.16 * Math.pow(Math.random(), 18)
            : 0.05 + 0.62 * Math.pow(Math.random(), 9);
        // Sboccio: scaglionato lungo il disegno — o al battere della lettera
        let delay = ((p.x + p.y) / (texW + texH)) * 55 + Math.random() * 22;
        if (isTyping && word) {
          let letter = 0;
          for (let k = word.length - 1; k >= 0; k--) {
            if (p.x - 12 >= widths[k] - fontPx * 0.06) {
              letter = k;
              break;
            }
          }
          delay = TYPE_WAIT + letter * TYPE_STEP + Math.random() * 10;
        }
        const deltaScale = 0.02 + 0.06 * Math.random();
        return {
          x: p.x + 2.4 * (Math.random() - 0.5) * step,
          y: p.y + 2.4 * (Math.random() - 0.5) * step,
          sprite,
          isLeaf,
          scale: reduced ? maxScale : 0,
          maxScale,
          deltaScale,
          deltaScale0: deltaScale,
          age: Math.PI * Math.random(),
          ageDelta: 0.012 + 0.02 * Math.random(),
          rot: (Math.random() - 0.5) * Math.PI,
          delay,
          delay0: delay,
          growing: !reduced,
        };
      });
      // Corolle prima, foglie sopra: l'ordine di pittura del riferimento
      particles.sort((a, b) => Number(a.isLeaf) - Number(b.isLeaf));
    };

    /* Mappa texture → canvas (contain) rispettando l'ancoraggio del variant. */
    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height || !texW) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(rect.width * dpr);
      const ph = Math.round(rect.height * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      const fit = Math.min(rect.width / texW, rect.height / texH);
      const ox =
        variant === "center"
          ? (rect.width - texW * fit) / 2
          : variant.endsWith("tr") || variant.endsWith("br")
            ? rect.width - texW * fit
            : 0;
      const oy =
        variant === "center"
          ? (rect.height - texH * fit) / 2
          : variant.endsWith("bl") || variant.endsWith("br")
            ? rect.height - texH * fit
            : 0;
      const flipX = variant.endsWith("tr") || variant.endsWith("br") ? -1 : 1;
      const flipY = variant.endsWith("bl") || variant.endsWith("br") ? -1 : 1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pw, ph);
      const half = SPRITE / 2;
      for (const p of particles) {
        // Il respiro assoluto può portare la scala sotto zero: come nel
        // riferimento la corolla si specchia e riappare (mai skippata).
        if (Math.abs(p.scale) <= 0.004) continue;
        // Le scritte non si specchiano; i tralci sì (l'angolo è l'origine)
        const tx = word ? p.x : flipX === -1 ? texW - p.x : p.x;
        const ty = word ? p.y : flipY === -1 ? texH - p.y : p.y;
        const cx = (ox + tx * fit) * dpr;
        let cy = (oy + ty * fit) * dpr;
        const s = p.scale * fit * dpr * (word ? 1.15 : 1.9);
        // Foglia piantata sul punto: il corpo cresce mezzo sprite verso l'alto
        if (p.isLeaf) cy -= 27 * Math.abs(s);
        const cos = Math.cos(p.rot) * s;
        const sin = Math.sin(p.rot) * s;
        ctx.setTransform(cos, sin, -sin, cos, cx, cy);
        ctx.drawImage(p.sprite, -half, -half);
      }

      // Caret del typing: onda quadra morbida del riferimento (roundPulse),
      // avanza a ogni lettera battuta e si spegne a parola conclusa.
      if (isTyping && word && widths.length) {
        const len = word.length;
        const typed =
          frame < TYPE_WAIT
            ? 0
            : Math.min(len, Math.floor((frame - TYPE_WAIT) / TYPE_STEP) + 1);
        const done = typed >= len && frame > TYPE_WAIT + len * TYPE_STEP + TYPE_TAIL;
        const t = (2 * frame) / 60;
        if (!done && Math.sin(Math.PI * t) > 0) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = Math.pow(Math.sin(Math.PI * (t % 1)), 0.2);
          ctx.fillStyle = tints.caret;
          const cw = Math.max(1.5, fontPx * 0.045 * fit) * dpr;
          const ch = fontPx * 0.82 * fit * dpr;
          const cx = (ox + (12 + widths[typed]) * fit) * dpr;
          const cyTop = (oy + fontPx * 0.24 * fit) * dpr;
          ctx.fillRect(cx, cyTop, cw, ch);
          ctx.globalAlpha = 1;
        }
      }
    };

    const tick = () => {
      if (cancelled) return;
      frame++;
      let alive = false;
      for (const p of particles) {
        if (p.delay > 0) {
          p.delay -= 1;
          alive = true;
          continue;
        }
        p.age += p.ageDelta;
        if (p.growing) {
          p.deltaScale *= 0.985;
          p.scale += p.deltaScale * 0.16;
          if (p.scale >= p.maxScale) p.growing = false;
          alive = true;
        } else if (!p.isLeaf) {
          // Respiro ASSOLUTO (rif. maxScale + .2·sin(age) su taglie 0–0.9):
          // le corolle minute pulsano dentro e fuori l'esistenza — è quello
          // che rende vivo il quadro. Più la deriva di rotazione. L'ampiezza
          // segue le taglie del modo (rif. 0.2/0.9 ≈ 22% del massimo).
          p.scale = p.maxScale + (word ? 0.04 : 0.07) * Math.sin(p.age);
          p.rot += 0.0012 * Math.cos(p.age);
        } else {
          // Il riferimento congela le foglie; qui un'oscillazione minima di
          // sola rotazione ("tutti animati", richiesta 2026-08-05).
          p.rot += 0.0006 * Math.cos(0.6 * p.age);
        }
      }
      // Il respiro è lento: a regime basta metà cadenza. Col typing il caret
      // chiede il frame pieno (il canvas è piccolo, il costo è suo amico).
      if (alive || isTyping || frame % 2 === 0) draw();
      if (running) raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Font pronti (Playfair per le scritte), poi campionamento e innesco a vista
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const family = getComputedStyle(canvas).fontFamily || "Georgia, serif";
      build(family);
      if (reduced) {
        draw();
        return;
      }
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            started = true;
            start();
          } else {
            stop();
            // Replay del typing: fuori dal viewport la scena si riavvolge,
            // al prossimo ingresso la parola si ridigita da capo.
            if (isTyping) {
              frame = 0;
              for (const p of particles) {
                p.delay = p.delay0;
                p.deltaScale = p.deltaScale0;
                p.scale = 0;
                p.growing = true;
              }
            }
          }
        },
        // Soglia 0, non 0.15: dentro un antenato position:fixed (il footer
        // dell'uncover) Chromium riporta intersectionRatio SEMPRE 0 pur con
        // isIntersecting true — una soglia >0 non scatterebbe mai e il canvas
        // resterebbe bianco. Con soglia 0 il callback iniziale basta a partire;
        // il costo del loop nel footer coperto è mezzo cadenzato e accettabile.
        { threshold: 0 }
      );
      io.observe(canvas);
      ro = new ResizeObserver(() => {
        if (started) draw();
      });
      ro.observe(canvas);
    });

    return () => {
      cancelled = true;
      stop();
      io?.disconnect();
      ro?.disconnect();
    };
  }, [word, typing, variant, palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none font-display ${className}`}
    />
  );
}
