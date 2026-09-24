"use client";

/* useLastra — l'entrata alla Lusion del Congedo (A35 di Alberto; direttive in docs/direttive-video-entrata.md).
   Il poster parte come una miniatura sul margine del testo e, lungo il tratto `e` della timeline del
   corridoio (Congedo.tsx), cresce piegandosi come un foglio fino alla banda piena e piatta. Il DOM
   sta qui; la geometria e gli shader in app/lib/motion/lastra.ts.

   Com'è fatto:
   - vive SOLO dentro MQ.corridor (da 1024×640 con motion ok): al montaggio, se la query è falsa, il
     hook arma il solo ascolto `change` e non fa niente (niente misura, niente attributi, niente
     contesto); quando diventa vera `monta()`, quando torna falsa `smonta()` — le stesse due funzioni
     del montaggio e del cleanup;
   - la via: `gl` (un <canvas> WebGL2 creato QUI, imperativamente, mai in JSX) o `scala` (il ritaglio
     DOM riceve translate + scale: la scatola piatta a k 0). Si parte SEMPRE in `scala`. Il cancello del
     renderer non gira mai al montaggio, che sulla home cade sotto il sipario: parte all'handoff più
     SONDA_PASSO_MS (senza sipario, dal montaggio), e ogni suo task passa da un'`occasione`: idle, scheda
     in vista, scroll fermo, fuori dalla piega, entrata della home finita (sipario e salita dell'hero).
     Con la section a tre schermi (l'ultima chiamata, VICINO_MARGINE) restano solo scheda in vista e fuori
     dalla piega: chi scorre senza fermarsi arriva al Congedo col giudizio già dato.
     Due tempi: `prepara` (contesto su un canvas staccato; nome del renderer, software → scala;
     programma e un draw che paga la pipeline, senza lettura), poi i giri della sonda (il costo di un
     draw del foglio dentro il viewport al netto della lettura readPixels 1×1; lastra.ts,
     `giudizioSonda`): un giro pulito sotto soglia → gl, per la scala serve una conferma, al massimo tre
     giri a 1,5 s l'uno dall'altro. Il giudizio vale per il documento (`ricordo`) e sta sulla section in
     data-lastra-cancello (il costo, o il motivo) e data-lastra-prove (i giri). Solo se passa, il canvas
     entra nello schermo; la texture arriva quando il poster è caricato (`load` del nodo vero, mai
     `new Image()`), in un'altra occasione, e la lastra prende la mano al primo
     `set(e)` con e ≤ 0 o e ≥ 1 (mai a metà piega). Contesto perso → scala per il resto della corsa;
   - la texture: il poster; e mentre il loop muto suona (readyState ≥ 2, non in pausa) il fotogramma
     vivo del <video>, così a `distesa` il DOM continua senza salti. Il loop parte quando vuole
     useAmbientVideo (in vista), anche durante l'entrata: come Lusion, il foglio piega il video che
     suona (Alberto, 20 set.: «andava bene prima quando partiva il video prima dell'effetto»);
   - `k` (la piega): 1 mentre si scorre; nessun evento scroll per IDLE_MS con 0 < e < 1 → k → 0 in
     PIEGA_S (dtCartolina, la firma del capitolo); al primo scroll → k → 1. A e ≤ 0 o ≥ 1 k torna 1.
     Sono `gsap.to` su un proxy fuori dalla timeline (come lo sgombro del Congedo);
   - attributi sulla section, per CSS e test: data-entrata (chiusa | piega | distesa), data-entrata-via
     (gl | scala), data-piegato (in piega con k > 0). In via gl il ritaglio DOM è nascosto finché la
     lastra disegna (CSS, globals.css), a distesa il canvas si nasconde e il DOM entra al pixel;
   - il marcatore data-bg="foto" (A21) segue l'ingombro del foglio: in `chiusa` e `piega` è un 1×1
     con translate + scale (`data-foglio`), a `distesa` torna l'inset che la cartolina gli scrive;
   - le due scatole (A42): `da` è lo slot 16:9 a destra del titolo nella testa in flusso, `a` è lo
     schermo sticky intero; si leggono a OGNI render con getBoundingClientRect (viewport), perché la
     miniatura sta fuori dallo schermo e lo schermo agganciato si sposta rispetto alla pagina. Slot e
     schermo non hanno mai un transform (il reveal muove i membri del gruppo, non lo slot). Il canvas
     è `fixed` sul viewport (misura al resize e a `refreshInit`); il ritaglio DOM e il marcatore
     ricevono trasformate relative allo schermo, che per questo non ritaglia (`overflow: visible`);
   - il refresh (misurato con la sonda a35-wheelto-dev.mjs): ScrollTrigger.refresh() riverte la
     timeline e il tween `e` chiama `onUpdate` con 0; quando lo scrub riporta la timeline al suo
     progresso il tween è già oltre la propria fine e `onUpdate` non rifà nulla — la lastra
     resterebbe «chiusa» a schermo agganciato col video fermato. Quindi fra `refreshInit` e
     `refresh` ogni `set(e)` si ignora, e a `refresh` `e` si rilegge da `eRef` (il progresso vero
     della timeline, che il Congedo espone): niente sfarfallio di stato, niente riavvio del video. */
import { useEffect, type RefObject } from "react";
import { afterCurtain, curtainPending } from "../../lib/motion/fold";
import { gsap, ScrollTrigger } from "../../lib/motion/gsap";
import { MQ } from "../../lib/motion/mq";
import {
  CAMPIONI_SONDA,
  CORSA_SVH,
  DPR_MAX,
  DRAW_SONDA,
  IDLE_MS,
  PIEGA_S,
  RENDERER_SOFTWARE,
  SONDA_PASSO_MS,
  SONDA_URGENTE_MS,
  VICINO_MARGINE,
  type Giro,
  type Programma,
  disegna,
  entrataInCorso,
  giro,
  giudizioSonda,
  ingombro,
  occasioneManca,
  programma,
  rettDi,
  scatolaPiatta,
  scatoleSonda,
  sogliaSonda,
  statoDi,
} from "../../lib/motion/lastra";

export type LastraRefs = {
  sectionRef: RefObject<HTMLElement | null>;
  screenRef: RefObject<HTMLElement | null>;
  /** Lo slot 16:9 a destra del titolo, nella testa: la scatola di partenza del foglio. */
  slotRef: RefObject<HTMLElement | null>;
  clipRef: RefObject<HTMLElement | null>;
  markerRef: RefObject<HTMLElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** La verità di `e` dopo un refresh: il progresso della timeline del corridoio riportato su [0, 1]. */
  eRef?: RefObject<() => number>;
};

/** Il ponte verso la timeline del Congedo: `set(e)` a ogni tick del tratto dell'entrata. */
export type Lastra = { set: (e: number) => void; e: () => number };

/** Nessuna lastra montata (sotto MQ.corridor, smontaggio): `set` non fa nulla e `e` vale 1, la banda piena. */
export const LASTRA_NIENTE: Lastra = { set: () => {}, e: () => 1 };

/** requestIdleCallback e cancelIdleCallback dove ci sono (Safari no: lì l'occasione parte al timer). */
type Idle = Window & {
  requestIdleCallback?: (cb: () => void, o: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** La sonda fra un task e l'altro: il contesto su un canvas staccato, il programma e il campione (0 draw =
    vuoto, clear + readPixels 1×1; DRAW_SONDA draw = pieno, clear + draw + readPixels), che dà i ms. */
type Sonda = { c: HTMLCanvasElement; ctx: WebGL2RenderingContext; p: Programma; campione: (draw: number) => number };

/** Il giudizio del cancello per il documento. La GPU non cambia fra un montaggio e l'altro, quindi un
    rimontaggio (MQ.corridor che torna vera) non rifà la sonda: con `scala` non crea nemmeno il contesto,
    con `gl` lo crea e lo scalda senza misurare. Si ricordano solo il nome (`software`) e la misura, mai
    `webgl2`, `programma` o `persa`, che possono essere di passaggio (il tetto dei contesti, il processo
    della GPU riavviato), e nemmeno un giudizio fatto di soli giri torbidi (la GPU era occupata da altro).
    Vale fino alla ricarica. */
type Ricordo = { via: "gl" | "scala"; motivo: string; giri: number };
let ricordo: Ricordo | null = null;
const ricorda = (r: Ricordo) => {
  ricordo ??= r;
};

/** Il buffer torna trasparente, spinto alla GPU. La sonda disegna il foglio crema dentro il viewport, e
    misura() riscrive le STESSE misure, che non lo puliscono: al primo composito il canvas mostrerebbe la
    sonda sopra la pagina fino all'arrivo del poster. */
function trasparente(g: WebGL2RenderingContext): void {
  g.clearColor(0, 0, 0, 0);
  g.clear(g.COLOR_BUFFER_BIT);
  g.flush();
}

/** Una sonda bocciata o lasciata a metà libera subito il suo contesto, senza aspettare il GC: i
    rimontaggi non accumulano contesti fino al tetto del browser. */
function molla(g: WebGL2RenderingContext): void {
  g.getExtension("WEBGL_lose_context")?.loseContext();
}

export function useLastra(refs: LastraRefs, ponteRef: RefObject<Lastra>): void {
  // I nomi finiscono in Ref: la regola react-hooks/immutability riconosce i ref dal nome (come in useAmbientVideo).
  const { sectionRef, screenRef, slotRef, clipRef, markerRef, videoRef, eRef } = refs;
  useEffect(() => {
    const mq = window.matchMedia(MQ.corridor);
    let smonta: (() => void) | null = null;

    const monta = () => {
      const section = sectionRef.current;
      const screen = screenRef.current;
      const slot = slotRef.current;
      const clip = clipRef.current;
      const marker = markerRef.current;
      if (!section || !screen || !slot || !clip || !marker) return;
      const video = videoRef.current;
      const poster = clip.querySelector<HTMLImageElement>("img");

      // ── misure (coordinate di viewport) ──
      let R: { w: number; h: number } | null = null; // il viewport, cioè il canvas
      let canvas: HTMLCanvasElement | null = null;
      let gl: WebGL2RenderingContext | null = null;
      let prg: Programma | null = null;
      let dpr = 1;
      let aspetto = 16 / 9;
      let via: "gl" | "scala" = "scala";
      let pronta = false; // texture caricata: la lastra può prendere la mano
      let persa = false; // contesto perso: scala per il resto della corsa
      const S = { e: 0, k: 1 };
      let inRefresh = false; // fra refreshInit e refresh di ScrollTrigger: i set(e) del tween sono da buttare
      let ultimo = -1;
      let ultimoStato = "";

      const misura = () => {
        R = { w: window.innerWidth, h: window.innerHeight };
        if (canvas && gl) {
          // Il canvas è fixed e copre il viewport intero: il foglio va dallo slot nella testa allo schermo pieno.
          canvas.style.width = `${R.w}px`;
          canvas.style.height = `${R.h}px`;
          canvas.width = Math.round(R.w * dpr);
          canvas.height = Math.round(R.h * dpr);
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
        ultimo = -1;
      };
      /* Le due scatole di questo fotogramma, in viewport: lo slot (partenza) e lo schermo (arrivo).
         La partenza e' lo slot com'era A e 0, non com'e' ora: col titolo che scorre via lo slot esce
         dal viewport, e il foglio a meta' corsa starebbe sopra il bordo alto (misurato: y −75 a e 0,5).
         Il video invece si stacca dal flusso e cresce da dove stava (Lusion). Il tratto e' lineare
         sullo scroll, quindi la quota dello slot al via e' quella di adesso piu' e · CORSA · vh, esatta,
         senza chiedere niente al trigger. Prima del via (e = 0) la scatola e' lo slot vivo, che scorre. */
      const scatole = (e: number) => {
        const da = rettDi(slot.getBoundingClientRect());
        da.y += e * (CORSA_SVH / 100) * window.innerHeight;
        return { da, a: rettDi(screen.getBoundingClientRect()) };
      };

      // ── attributi ──
      const scrivi = (e: number) => {
        const s = statoDi(e);
        if (s !== ultimoStato) {
          section.setAttribute("data-entrata", s);
          ultimoStato = s;
        }
        const piegato = s === "piega" && S.k > 0.001;
        if (piegato !== section.hasAttribute("data-piegato")) {
          if (piegato) section.setAttribute("data-piegato", "");
          else section.removeAttribute("data-piegato");
        }
      };
      const scriviVia = (v: "gl" | "scala") => {
        via = v;
        section.setAttribute("data-entrata-via", v);
      };

      // ── disegno ──
      const texturaVideo = () => {
        if (!gl || !prg || !video || video.readyState < 2 || video.paused || video.currentTime <= 0) return false;
        gl.bindTexture(gl.TEXTURE_2D, prg.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        return true;
      };
      const render = () => {
        if (!R) return;
        const e = Math.min(1, Math.max(0, S.e));
        const k = S.k;
        scrivi(e);
        const daVideo = via === "gl" && e < 1 && texturaVideo();
        // A e ≥ 1 non c'è più niente da disegnare né da spostare: si sgombra una volta e basta.
        if (e >= 1) {
          if (e === ultimo && !daVideo) return;
          ultimo = e;
          if (marker.hasAttribute("data-foglio")) {
            marker.removeAttribute("data-foglio");
            marker.style.removeProperty("transform");
          }
          if (via !== "gl") clip.style.removeProperty("transform");
          return;
        }
        // Sotto 1 le scatole si rileggono ogni volta: lo schermo scorre finché non è agganciato.
        const { da, a } = scatole(e);
        ultimo = e;
        // Il marcatore: l'ingombro del foglio (relativo allo schermo).
        const box = ingombro(e, da, a, k);
        if (!marker.hasAttribute("data-foglio")) marker.setAttribute("data-foglio", "");
        // L'inset inline che paintClip (Congedo.tsx) lascia a inizio cartolina batterebbe l'`inset: auto` del CSS di data-foglio.
        if (marker.style.inset) marker.style.removeProperty("inset");
        marker.style.transform = `translate(${(box.x - a.x).toFixed(2)}px,${(box.y - a.y).toFixed(2)}px) scale(${box.w.toFixed(2)},${box.h.toFixed(2)})`;
        if (via === "gl" && gl && prg && canvas) {
          disegna(gl, prg, R, da, a, e, k, aspetto);
        } else {
          // Via scala: il ritaglio DOM riceve la scatola piatta, relativa allo schermo.
          const b = scatolaPiatta(e, da, a);
          clip.style.transform = `translate(${(b.x - a.x).toFixed(2)}px,${(b.y - a.y).toFixed(2)}px) scale(${(b.w / a.w).toFixed(4)})`;
        }
      };

      // ── la piega k ──
      let ultimoScroll = performance.now();
      let tweenK: gsap.core.Tween | null = null;
      const versoK = (val: number) => {
        if (tweenK && tweenK.vars.k === val && tweenK.isActive()) return;
        tweenK?.kill();
        tweenK = gsap.to(S, { k: val, duration: PIEGA_S, ease: "dtCartolina", onUpdate: render, overwrite: true });
      };
      // Le scatole sono in viewport: prima del via lo slot scorre con la pagina e fino all'aggancio
      // scorre lo schermo, quindi finche' il foglio non e' disteso si ridisegna a ogni scroll con la
      // section in vista (misurato: a e 0 fermo il foglio restava disegnato dov'era lo slot al load).
      const inVista = () => {
        const r = section.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      };
      const onScroll = () => {
        ultimoScroll = performance.now();
        if (S.e > 0 && S.e < 1 && S.k < 1) versoK(1);
        if (S.e < 1 && inVista()) render();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      const tick = () => {
        if (S.e > 0 && S.e < 1) {
          if (S.k > 0 && performance.now() - ultimoScroll > IDLE_MS && !(tweenK && tweenK.isActive() && tweenK.vars.k === 0)) versoK(0);
        } else if (S.k !== 1 || tweenK?.isActive()) {
          tweenK?.kill();
          S.k = 1;
          render();
        }
      };
      gsap.ticker.add(tick);

      // ── il cancello del renderer (a tempo), la texture ──
      const viaScala = () => {
        if (canvas) {
          canvas.remove();
          canvas = null;
        }
        gl = null;
        prg = null;
        pronta = false;
        scriviVia("scala");
        ultimo = -1;
        render();
      };
      const html = document.documentElement;
      let sonda: Sonda | null = null;
      const giri: Giro[] = [];
      let tAttesa = 0;
      let idAttesa = 0;
      let fermaSipario: () => void = () => {};
      const fermaAttesa = () => {
        window.clearTimeout(tAttesa);
        if (idAttesa) (window as Idle).cancelIdleCallback?.(idAttesa);
        tAttesa = 0;
        idAttesa = 0;
      };
      // L'ultima chiamata (lastra.ts, VICINO_MARGINE): col Congedo a tre schermi il cancello non aspetta più.
      let urgente = false;
      // Il tempo del cancello in attesa di un'occasione: l'ultima chiamata lo anticipa.
      let prossimo: (() => void) | null = null;
      // Il momento buono manca se la scheda è nascosta, a metà piega (0 < e < 1: il foglio è a schermo e un
      // task lungo fermerebbe la distensione) e, finché il Congedo è lontano, se si scorre (la lettura di
      // whenStill) o durante l'entrata della home (sipario e salita dell'hero: lastra.ts, entrataInCorso).
      const daAspettare = () =>
        occasioneManca({
          nascosta: document.hidden,
          e: S.e,
          urgente,
          scorre: ScrollTrigger.isScrolling(),
          entrata: entrataInCorso((a) => html.hasAttribute(a), performance.now()),
        });
      /* L'occasione: `fn` dopo `ms`, in un idle (tetto SONDA_PASSO_MS, perché in una scheda in background
         l'idle può non arrivare mai; senza requestIdleCallback, Safari, al timer), nel momento buono; se no
         si riguarda dopo SONDA_PASSO_MS: un timer, nessun ascolto. Sonda e texture passano di qui: mai
         dentro uno scroll, mai sotto il sipario, finché il Congedo è lontano; all'ultima chiamata niente
         idle e al più SONDA_URGENTE_MS. Un'occasione alla volta. */
      const occasione = (ms: number, fn: () => void) => {
        fermaAttesa();
        prossimo = fn;
        tAttesa = window.setTimeout(
          () => {
            tAttesa = 0;
            const vai = () => {
              idAttesa = 0;
              if (daAspettare()) occasione(SONDA_PASSO_MS, fn);
              else {
                prossimo = null;
                fn();
              }
            };
            const w = window as Idle;
            if (!urgente && typeof w.requestIdleCallback === "function") idAttesa = w.requestIdleCallback(vai, { timeout: SONDA_PASSO_MS });
            else vai();
          },
          urgente ? Math.min(ms, SONDA_URGENTE_MS) : ms,
        );
      };
      const vicino = new IntersectionObserver(
        (voci) => {
          if (!voci.some((v) => v.isIntersecting)) return;
          vicino.disconnect();
          urgente = true;
          if (prossimo) occasione(0, prossimo);
        },
        { rootMargin: VICINO_MARGINE },
      );
      // Il primo tempo, un task: contesto su un canvas staccato, nome del renderer, programma, e un draw
      // sulle scatole della sonda che fa pagare alla GPU la pipeline (7-9 ms, 57 a cache fredda) senza
      // lettura: il thread principale non lo aspetta. Restituisce la sonda, o il motivo della via scala.
      const prepara = (): Sonda | "webgl2" | "software" | "programma" => {
        const c = document.createElement("canvas");
        c.className = "dt-lastra";
        c.setAttribute("aria-hidden", "true");
        let ctx: WebGL2RenderingContext | null = null;
        try {
          ctx = c.getContext("webgl2", { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "default" });
        } catch {
          ctx = null;
        }
        if (!ctx) return "webgl2";
        const dbg = ctx.getExtension("WEBGL_debug_renderer_info");
        const nome = String(dbg ? ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER));
        if (RENDERER_SOFTWARE.test(nome)) {
          molla(ctx);
          return "software";
        }
        let p: Programma;
        try {
          p = programma(ctx);
        } catch {
          molla(ctx);
          return "programma";
        }
        dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1);
        const vp = { w: window.innerWidth, h: window.innerHeight };
        const { da, a } = scatoleSonda(rettDi(slot.getBoundingClientRect()), vp);
        c.width = Math.round(vp.w * dpr);
        c.height = Math.round(vp.h * dpr);
        const g = ctx;
        g.viewport(0, 0, c.width, c.height);
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([0xf9, 0xf5, 0xef, 255]));
        const px = new Uint8Array(4);
        const campione = (draw: number) => {
          const t0 = performance.now();
          if (draw === 0) {
            g.clearColor(0, 0, 0, 0);
            g.clear(g.COLOR_BUFFER_BIT);
          }
          for (let i = 0; i < draw; i += 1) disegna(g, p, vp, da, a, 0.5, 1, 16 / 9, i === 0);
          g.readPixels(0, 0, 1, 1, g.RGBA, g.UNSIGNED_BYTE, px);
          return performance.now() - t0;
        };
        disegna(g, p, vp, da, a, 0.5, 1, 16 / 9);
        trasparente(g);
        return { c, ctx: g, p, campione };
      };
      const caricaTexture = () => {
        if (!gl || !prg || !poster) return;
        // Il poster può essere tornato a caricare (un altro ingresso del srcset) mentre si aspettava l'occasione.
        if (!poster.complete) {
          poster.addEventListener("load", onPosterLoad, { once: true });
          return;
        }
        if (poster.naturalWidth === 0) return;
        const g = gl;
        const p = prg;
        // Due task, mai dentro uno scroll: il bitmap ora, l'upload al fotogramma dopo.
        createImageBitmap(poster)
          .then((bmp) => {
            requestAnimationFrame(() => {
              if (gl !== g) {
                bmp.close();
                return;
              }
              aspetto = poster.naturalWidth / poster.naturalHeight;
              g.bindTexture(g.TEXTURE_2D, p.tex);
              g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, bmp);
              bmp.close();
              pronta = true;
              prova();
            });
          })
          .catch(() => {
            /* niente: resta la via scala */
          });
      };
      // La lastra prende la mano solo fuori dalla piega: a e ≤ 0 o ≥ 1.
      const prova = () => {
        if (via === "gl" || !pronta || persa || !gl) return;
        if (S.e > 0 && S.e < 1) return;
        clip.style.removeProperty("transform");
        scriviVia("gl");
        ultimo = -1;
        render();
      };
      // Il poster pigro arriva di solito mentre si scorre verso il Congedo: bitmap e upload in un'occasione.
      const onPosterLoad = () => occasione(0, caricaTexture);
      const onPersa = (ev: Event) => {
        ev.preventDefault();
        persa = true;
        viaScala();
      };
      // Solo se la sonda passa il canvas entra nello schermo, trasparente; poi la texture. Il poster è pigro
      // (next/image) e senza il film arriverebbe solo avvicinandosi al Congedo, cioè di solito mentre si scorre,
      // quando l'occasione della texture non c'è: lo si chiede subito, come fa il precarico del film
      // (warmAllImages). È la stessa richiesta del currentSrc, solo prima.
      const innesta = (s: Sonda) => {
        canvas = s.c;
        gl = s.ctx;
        prg = s.p;
        s.c.addEventListener("webglcontextlost", onPersa);
        screen.appendChild(s.c);
        misura();
        if (poster && poster.complete && poster.naturalWidth > 0) onPosterLoad();
        else if (poster) {
          poster.addEventListener("load", onPosterLoad, { once: true });
          if (poster.loading === "lazy") poster.loading = "eager";
        }
      };
      // Il giudizio sulla section: il costo su cui poggia (o il motivo) e i giri. gl innesta il canvas, scala molla il contesto.
      const decidi = (esito: "gl" | "scala", motivo: string, n: number) => {
        section.setAttribute("data-lastra-cancello", motivo);
        section.setAttribute("data-lastra-prove", String(n));
        const s = sonda;
        sonda = null;
        if (!s) return;
        if (esito === "gl") innesta(s);
        else molla(s.ctx);
      };
      // Un giro, un task: un pieno che sveglia la GPU (e finisce la pipeline), poi le coppie alternate
      // (vuoto, pieno); il buffer torna trasparente; giudizioSonda dice gl, scala o un altro giro.
      const tenta = () => {
        const s = sonda;
        if (!s) return;
        if (s.ctx.isContextLost()) {
          persa = true;
          decidi("scala", "persa", giri.length);
          return;
        }
        s.campione(DRAW_SONDA);
        const vuoti: number[] = [];
        const pieni: number[] = [];
        for (let i = 0; i < CAMPIONI_SONDA; i += 1) {
          vuoti.push(s.campione(0));
          pieni.push(s.campione(DRAW_SONDA));
        }
        trasparente(s.ctx);
        const px = s.c.width * s.c.height;
        giri.push(giro(vuoti, pieni, px));
        const verdetto = giudizioSonda(giri, sogliaSonda(px));
        if (verdetto.esito === "ancora") {
          occasione(SONDA_PASSO_MS, tenta);
          return;
        }
        const motivo = verdetto.costo.toFixed(2);
        if (giri.some((g) => !g.torbido)) ricorda({ via: verdetto.esito, motivo, giri: giri.length });
        decidi(verdetto.esito, motivo, giri.length);
      };
      // Il primo tempo, poi i giri; un rimontaggio con la sonda già passata non misura.
      const primo = () => {
        const s = prepara();
        if (typeof s === "string") {
          if (s === "software") ricorda({ via: "scala", motivo: s, giri: 0 });
          decidi("scala", s, 0);
          return;
        }
        sonda = s;
        if (ricordo?.via === "gl") decidi("gl", ricordo.motivo, ricordo.giri);
        else occasione(0, tenta);
      };

      // ── il ponte ──
      scriviVia("scala");
      misura();
      render();
      ponteRef.current = {
        set: (e: number) => {
          if (inRefresh) return;
          S.e = e;
          render();
          prova();
        },
        e: () => S.e,
      };
      const onRefreshInit = () => {
        inRefresh = true;
        misura();
      };
      const onRefresh = () => {
        inRefresh = false;
        if (eRef) S.e = eRef.current();
        render();
        prova();
      };
      ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
      ScrollTrigger.addEventListener("refresh", onRefresh);
      const onResize = () => {
        misura();
        render();
      };
      window.addEventListener("resize", onResize);
      // Il cancello (23 set.): mai al montaggio, che sulla home cade sotto il sipario. Parte all'handoff
      // più SONDA_PASSO_MS, o dal montaggio se il sipario non c'è (INTRO_QUIET, ancora, ritorno: lì
      // INTRO_EVENT non parte e afterCurtain aspetterebbe la rete di 6 s). Un rimontaggio riusa il giudizio
      // del documento: `scala` subito e senza contesto, `gl` senza misura.
      const parti = () => occasione(ricordo ? 0 : SONDA_PASSO_MS, primo);
      if (ricordo?.via === "scala") decidi("scala", ricordo.motivo, ricordo.giri);
      else {
        vicino.observe(section);
        if (curtainPending()) fermaSipario = afterCurtain(parti);
        else parti();
      }

      smonta = () => {
        vicino.disconnect();
        fermaAttesa();
        fermaSipario();
        if (sonda) molla(sonda.ctx);
        sonda = null;
        poster?.removeEventListener("load", onPosterLoad);
        ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        gsap.ticker.remove(tick);
        tweenK?.kill();
        ponteRef.current = LASTRA_NIENTE;
        // Prima il listener, poi il contesto: loseContext() lo farebbe scattare dopo lo smontaggio, e viaScala
        // riscriverebbe attributi e trasformate su nodi già ripuliti.
        canvas?.removeEventListener("webglcontextlost", onPersa);
        if (gl) molla(gl);
        canvas?.remove();
        canvas = null;
        gl = null;
        prg = null;
        clip.style.removeProperty("transform");
        marker.removeAttribute("data-foglio");
        marker.style.removeProperty("transform");
        section.removeAttribute("data-entrata");
        section.removeAttribute("data-entrata-via");
        section.removeAttribute("data-piegato");
        section.removeAttribute("data-lastra-cancello");
        section.removeAttribute("data-lastra-prove");
        smonta = null;
      };
    };

    const onChange = () => {
      if (mq.matches) {
        if (!smonta) monta();
      } else {
        smonta?.();
      }
    };
    mq.addEventListener("change", onChange);
    if (mq.matches) monta();
    return () => {
      mq.removeEventListener("change", onChange);
      smonta?.();
    };
    // I ref sono stabili: il hook monta una volta e si smonta col componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
