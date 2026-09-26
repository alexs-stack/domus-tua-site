"use client";

// HoverDistort — distorsione "liquida" WebGL al passaggio del mouse
// (progressive enhancement, fase WebGL del WOW layer).
// - Gate: desktop ≥1024 + pointer fine + motion ok + !saveData; mount in idle.
// - L'immagine resta il next/image sottostante (SEO/LCP/ottimizzazione
//   intatti): il canvas usa la STESSA risorsa già in cache (currentSrc) come
//   texture e vive sopra come layer decorativo aria-hidden, visibile solo
//   durante l'hover. Qualunque errore/contesto perso → canvas via, resta
//   l'hover CSS esistente. OGL è importato dinamicamente (~30kB solo qui).
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, MQ } from "../../lib/motion/gsap";

type Props = {
  children: ReactNode;
  className?: string;
};

const VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform sampler2D tMap;
uniform vec2 uRes;
uniform vec2 uImgRes;
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}
// Campionamento "cover": il canvas ritaglia l'immagine come object-fit: cover.
vec2 cover(vec2 uv, vec2 res, vec2 img) {
  float ra = res.x / res.y;
  float ia = img.x / img.y;
  vec2 s = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  // Micro-zoom guidato dall'hover (sostituisce lo scale CSS mentre il canvas
  // è attivo: un solo owner dell'ingrandimento).
  float zoom = 1.0 + 0.045 * uHover;
  vec2 uvC = (cover(vUv, uRes, uImgRes) - 0.5) / zoom + 0.5;

  // Influenza radiale attorno al puntatore, tessuta con due rumori lenti:
  // il bordo dell'onda resta organico, mai geometrico.
  float d = distance(vUv, uMouse);
  float infl = smoothstep(0.5, 0.05, d) * uHover;
  float n1 = noise(vUv * 7.0 + uTime * 0.25);
  float n2 = noise(vUv * 11.0 - uTime * 0.2 + 4.7);
  vec2 disp = (vec2(n1, n2) - 0.5) * 0.06 * infl;

  vec3 col = texture2D(tMap, uvC + disp).rgb;
  // Velatura calda in-brand (mai blu/freddo) dove l'onda tocca.
  col = mix(col, col * vec3(1.05, 0.985, 0.93), infl * 0.3);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function HoverDistort({ children, className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();

      mm.add(`${MQ.motionOk} and ${MQ.finePointer} and (min-width: 1024px)`, () => {
        // Effetto costoso: si accende solo dove ha senso. Oltre a reduced motion, puntatore
        // fine e larghezza desktop (i gate della matchMedia qui sopra), si rinuncia su
        // connessioni a consumo ridotto e su macchine deboli — un canvas WebGL a tutto schermo
        // su due core con 4 GB di RAM costa più di quanto valga.
        const nav = navigator as Navigator & {
          connection?: { saveData?: boolean };
          deviceMemory?: number;
        };
        if (nav.connection?.saveData) return;
        if ((nav.deviceMemory ?? 8) < 4) return;
        if ((nav.hardwareConcurrency ?? 8) < 4) return;

        let cancelled = false;
        let cleanupGl: (() => void) | null = null;

        const init = async () => {
          const img = root.querySelector("img");
          const src = img?.currentSrc || img?.src;
          if (!img || !src) return;

          const { Renderer, Program, Mesh, Triangle, Texture } = await import("ogl");
          if (cancelled) return;

          const renderer = new Renderer({
            dpr: Math.min(2, window.devicePixelRatio || 1),
            alpha: true,
            antialias: false,
            powerPreference: "low-power",
          });
          const gl = renderer.gl;
          const canvas = gl.canvas as HTMLCanvasElement;
          canvas.setAttribute("aria-hidden", "true");
          Object.assign(canvas.style, {
            position: "absolute",
            inset: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            opacity: "0",
            visibility: "hidden",
          });
          root.appendChild(canvas);

          const texture = new Texture(gl, { generateMipmaps: false });
          const program = new Program(gl, {
            vertex: VERTEX,
            fragment: FRAGMENT,
            uniforms: {
              tMap: { value: texture },
              uRes: { value: [1, 1] },
              uImgRes: { value: [1, 1] },
              uMouse: { value: [0.5, 0.5] },
              uHover: { value: 0 },
              uTime: { value: 0 },
            },
          });
          const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

          // Stessa risorsa ottimizzata già in cache del browser (same-origin).
          const texImage = new Image();
          let ready = false;
          texImage.onload = () => {
            texture.image = texImage;
            program.uniforms.uImgRes.value = [texImage.naturalWidth, texImage.naturalHeight];
            ready = true;
          };
          texImage.src = src;

          const setSize = () => {
            const r = root.getBoundingClientRect();
            const w = Math.round(r.width);
            const h = Math.round(r.height);
            if (!w || !h) return;
            renderer.setSize(w, h);
            Object.assign(canvas.style, { width: "100%", height: "100%" });
            program.uniforms.uRes.value = [w, h];
          };
          setSize();
          const ro = new ResizeObserver(setSize);
          ro.observe(root);

          // Mentre il canvas è l'owner visivo, lo zoom CSS dell'img sottostante
          // va congelato (doppio zoom = salto quando il layer sparisce).
          const prevTransform = img.style.transform;
          const prevTransition = img.style.transition;

          const hover = { v: 0 };
          const mouse = { x: 0.5, y: 0.5 };
          const mx = gsap.quickTo(mouse, "x", { duration: 0.35, ease: "power3.out" });
          const my = gsap.quickTo(mouse, "y", { duration: 0.35, ease: "power3.out" });

          let ticking = false;
          const tick = (_t: number, delta: number) => {
            program.uniforms.uTime.value += delta / 1000;
            program.uniforms.uMouse.value = [mouse.x, mouse.y];
            program.uniforms.uHover.value = hover.v;
            renderer.render({ scene: mesh });
            if (hover.v < 0.005) stopTick();
          };
          const startTick = () => {
            if (ticking) return;
            ticking = true;
            gsap.ticker.add(tick);
          };
          const stopTick = () => {
            if (!ticking) return;
            ticking = false;
            gsap.ticker.remove(tick);
          };

          const onEnter = () => {
            if (!ready) return;
            img.style.setProperty("transform", "none", "important");
            img.style.setProperty("transition", "none", "important");
            startTick();
            gsap.to(hover, { v: 1, duration: 0.45, ease: "domus", overwrite: "auto" });
            gsap.to(canvas, { autoAlpha: 1, duration: 0.25, ease: "none", overwrite: "auto" });
          };
          const onLeave = () => {
            gsap.to(hover, { v: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" });
            gsap.to(canvas, {
              autoAlpha: 0,
              duration: 0.3,
              delay: 0.15,
              ease: "none",
              overwrite: "auto",
              onComplete() {
                img.style.transform = prevTransform;
                img.style.transition = prevTransition;
              },
            });
          };
          const onMove = (e: PointerEvent) => {
            const r = root.getBoundingClientRect();
            mx((e.clientX - r.left) / r.width);
            // WebGL: origine uv in basso a sinistra.
            my(1 - (e.clientY - r.top) / r.height);
          };
          const onLost = () => cleanupGl?.();

          root.addEventListener("pointerenter", onEnter);
          root.addEventListener("pointerleave", onLeave);
          root.addEventListener("pointermove", onMove, { passive: true });
          canvas.addEventListener("webglcontextlost", onLost);

          cleanupGl = () => {
            stopTick();
            ro.disconnect();
            root.removeEventListener("pointerenter", onEnter);
            root.removeEventListener("pointerleave", onLeave);
            root.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("webglcontextlost", onLost);
            img.style.transform = prevTransform;
            img.style.transition = prevTransition;
            gl.getExtension("WEBGL_lose_context")?.loseContext();
            canvas.remove();
            cleanupGl = null;
          };
        };

        // Mai nel percorso critico: si monta quando il main thread respira.
        // hasIdle in variabile (non inline nell'if): evita il narrowing TS a
        // `never` nel ramo else (stesso pattern di HeroCinematic).
        let idleId = 0;
        let timeoutId = 0;
        const hasIdle = "requestIdleCallback" in window;
        const start = () => {
          init().catch(() => {
            /* WebGL non disponibile: resta l'hover CSS */
          });
        };
        if (hasIdle) {
          idleId = window.requestIdleCallback(start, { timeout: 4000 });
        } else {
          timeoutId = window.setTimeout(start, 1500);
        }

        return () => {
          cancelled = true;
          if (hasIdle && idleId) window.cancelIdleCallback(idleId);
          if (timeoutId) window.clearTimeout(timeoutId);
          cleanupGl?.();
        };
      });
    },
    { scope: rootRef }
  );

  return (
    // Il chiamante controlla il positioning (es. "absolute inset-0"); default
    // relative solo se non specifica nulla — mai due position in conflitto.
    <div ref={rootRef} className={className || "relative"}>
      {children}
    </div>
  );
}
