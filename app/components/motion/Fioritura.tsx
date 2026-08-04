"use client";

// Fioritura — i fiori negli angoli del riferimento era-residence (§11.3 del
// dossier: bouganville con alpha ai bordi dei pannelli), ricostruiti con la
// tecnica di uuuulala/WebGL-typing-tutorial (03_flowers): si campiona un
// disegno su canvas offscreen (una parola in Playfair o un tralcio d'angolo)
// e ogni punto acceso diventa un fiore o una foglia che SBOCCIA — scale che
// cresce con decadimento, poi respiro sinusoidale e micro-rotazione perpetui.
// Porting su canvas 2D puro: niente Three.js (vietato dal budget librerie),
// sprite pre-tinte + setTransform per istanza — poche centinaia di particelle
// bastano e il loop gira solo quando il canvas è in viewport.
//
// Solo decorazione (aria-hidden). Reduced-motion: fioritura già completa,
// disegnata una volta, nessun loop. Senza JS il canvas resta vuoto: nessun
// contenuto vive qui. Quando il cliente consegnerà i suoi fiori (SVG/PNG),
// basterà sostituire makeFlowerSprite/makeLeafSprite con il rasterizzato.
import { useEffect, useRef } from "react";

type Variant = "corner-tl" | "corner-tr" | "corner-bl" | "corner-br";
type Palette = "light" | "dark";

/* Tinte DALLA palette (globals.css @theme): rossi di brand per i petali,
   neutri caldi stone/graphite per le foglie — un erbario, non un prato. */
const TINTS: Record<Palette, { flowers: string[]; leaves: string[]; heart: string }> = {
  light: {
    flowers: ["#d20a0a", "#b21010", "#a30707", "#e0483d", "#efb9b2"],
    leaves: ["#6b665f", "#857b6d", "#46423d"],
    heart: "#fffdf8",
  },
  dark: {
    flowers: ["#f2ebda", "#fbeaea", "#e0483d", "#fffdf8", "#d20a0a"],
    leaves: ["rgba(242,235,218,0.55)", "rgba(227,217,198,0.45)"],
    heart: "#2a100f",
  },
};

const SPRITE = 64; // lato degli sprite pre-renderizzati
const STEP = 3; // passo di campionamento del disegno offscreen

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
    g.globalAlpha = 0.92;
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
  g.translate(SPRITE / 2, SPRITE / 2 + 8);
  g.beginPath();
  g.moveTo(0, 10);
  g.quadraticCurveTo(-10, -8, 0, -28);
  g.quadraticCurveTo(10, -8, 0, 10);
  g.closePath();
  g.globalAlpha = 0.85;
  g.fillStyle = tint;
  g.fill();
  return c;
}

/* Particella: stessa grammatica di crescita del riferimento (deltaScale che
   decade ×0.99, poi respiro sin(age) e deriva di rotazione). */
type Particle = {
  x: number;
  y: number;
  sprite: HTMLCanvasElement;
  isLeaf: boolean;
  scale: number;
  maxScale: number;
  deltaScale: number;
  age: number;
  ageDelta: number;
  rot: number;
  delay: number; // sboccio scaglionato lungo il tralcio
  growing: boolean;
};

/** Disegna il tralcio d'angolo sull'offscreen (orientamento TL, poi specchiato). */
function drawVine(g: CanvasRenderingContext2D, w: number, h: number) {
  g.lineWidth = 9;
  g.lineCap = "round";
  g.strokeStyle = "#fff";
  g.beginPath();
  // Ramo principale: entra dall'angolo e si inarca dentro il quadro
  g.moveTo(-6, h * 0.06);
  g.bezierCurveTo(w * 0.22, h * 0.1, w * 0.34, h * 0.34, w * 0.42, h * 0.62);
  g.bezierCurveTo(w * 0.46, h * 0.76, w * 0.42, h * 0.9, w * 0.34, h * 0.98);
  g.stroke();
  // Ramo secondario: costeggia il bordo alto
  g.beginPath();
  g.moveTo(w * 0.08, -6);
  g.bezierCurveTo(w * 0.3, h * 0.12, w * 0.58, h * 0.14, w * 0.82, h * 0.08);
  g.stroke();
  // Getto corto verso il centro
  g.beginPath();
  g.moveTo(w * 0.2, h * 0.24);
  g.quadraticCurveTo(w * 0.42, h * 0.3, w * 0.56, h * 0.44);
  g.stroke();
}

export default function Fioritura({
  word,
  variant = "corner-tl",
  palette = "light",
  className = "",
}: {
  /** Se presente: la scritta in fiori (Playfair corsivo). Altrimenti: tralcio d'angolo. */
  word?: string;
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
    const tints = TINTS[palette];
    const flowerSprites = tints.flowers.map((t) => makeFlowerSprite(t, tints.heart));
    const leafSprites = tints.leaves.map((t) => makeLeafSprite(t));

    let particles: Particle[] = [];
    let texW = 0;
    let texH = 0;
    let raf = 0;
    let running = false;
    let started = reduced; // reduced: già fiorito, niente attesa di scroll
    let cancelled = false;

    /* Campiona il disegno offscreen → particelle in coordinate texture. */
    const build = (fontFamily: string) => {
      const off = document.createElement("canvas");
      const g = off.getContext("2d")!;
      if (word) {
        const fontPx = 88;
        g.font = `italic 500 ${fontPx}px ${fontFamily}`;
        const m = g.measureText(word);
        texW = Math.ceil(m.width) + 24;
        texH = Math.ceil(fontPx * 1.3);
        off.width = texW;
        off.height = texH;
        g.font = `italic 500 ${fontPx}px ${fontFamily}`;
        g.fillStyle = "#fff";
        g.fillText(word, 12, fontPx * 1.02);
      } else {
        texW = texH = 320;
        off.width = texW;
        off.height = texH;
        drawVine(g, texW, texH);
      }

      const data = g.getImageData(0, 0, texW, texH).data;
      const pts: { x: number; y: number }[] = [];
      for (let y = 0; y < texH; y += STEP) {
        for (let x = 0; x < texW; x += STEP) {
          if (data[(x + y * texW) * 4 + 3] > 0) pts.push({ x, y });
        }
      }
      // Tetto di sicurezza: mai più di ~1200 istanze per canvas
      while (pts.length > 1200) pts.splice(Math.floor(Math.random() * pts.length), 1);

      particles = pts.map((p) => {
        const isLeaf = Math.random() > 0.62;
        const sprite = isLeaf
          ? leafSprites[Math.floor(Math.random() * leafSprites.length)]
          : flowerSprites[Math.floor(Math.random() * flowerSprites.length)];
        // Poche corolle grandi, tante minute (pow come nel riferimento)
        const maxScale = isLeaf
          ? 0.09 + 0.3 * Math.pow(Math.random(), 5)
          : 0.07 + 0.42 * Math.pow(Math.random(), 6);
        return {
          x: p.x + 2.4 * (Math.random() - 0.5) * STEP,
          y: p.y + 2.4 * (Math.random() - 0.5) * STEP,
          sprite,
          isLeaf,
          scale: reduced ? maxScale : 0,
          maxScale,
          deltaScale: 0.02 + 0.06 * Math.random(),
          age: Math.PI * Math.random(),
          ageDelta: 0.012 + 0.02 * Math.random(),
          rot: (Math.random() - 0.5) * Math.PI,
          // Lo sboccio corre lungo il disegno: chi sta più avanti fiorisce dopo
          delay: ((p.x + p.y) / (texW + texH)) * 55 + Math.random() * 22,
          growing: !reduced,
        };
      });
    };

    /* Mappa texture → canvas (contain) rispettando l'angolo di ancoraggio. */
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
      const ox = variant.endsWith("tr") || variant.endsWith("br") ? rect.width - texW * fit : 0;
      const oy = variant.endsWith("bl") || variant.endsWith("br") ? rect.height - texH * fit : 0;
      const flipX = variant.endsWith("tr") || variant.endsWith("br") ? -1 : 1;
      const flipY = variant.endsWith("bl") || variant.endsWith("br") ? -1 : 1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pw, ph);
      const half = SPRITE / 2;
      for (const p of particles) {
        if (p.scale <= 0.005) continue;
        // Le scritte non si specchiano; i tralci sì (l'angolo è l'origine)
        const tx = word ? p.x : flipX === -1 ? texW - p.x : p.x;
        const ty = word ? p.y : flipY === -1 ? texH - p.y : p.y;
        const cx = (ox + tx * fit) * dpr;
        const cy = (oy + ty * fit) * dpr;
        const s = p.scale * fit * dpr * (word ? 1.5 : 1.9);
        const cos = Math.cos(p.rot) * s;
        const sin = Math.sin(p.rot) * s;
        ctx.setTransform(cos, sin, -sin, cos, cx, cy);
        ctx.drawImage(p.sprite, -half, -half);
      }
    };

    let frame = 0;
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
        } else {
          // Respiro: la corolla oscilla, la foglia resta ferma (rif. 03_flowers)
          if (!p.isLeaf) {
            p.scale = p.maxScale + 0.055 * p.maxScale * Math.sin(p.age);
            p.rot += 0.0012 * Math.cos(p.age);
          }
        }
      }
      // A regime basta metà cadenza: il respiro è lento, il costo si dimezza
      if (alive || frame % 2 === 0) draw();
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
          }
        },
        { threshold: 0.15 }
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
  }, [word, variant, palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none font-display ${className}`}
    />
  );
}
