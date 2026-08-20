"use client";

// TeamTrail — il corridoio di profondità: la parte del team non è una lista
// né una sequenza di pagine, si scorre ATTRAVERSO le persone. Fusione di tre
// riferimenti Codrops, studiati sui sorgenti (reverse-engineering/):
//
//   · IntroTrailEffect — ogni ritratto è una pila di 8 copie identiche nella
//     stessa cella grid (fantasmi 0.8, leader ultimo a 1) e ogni nome è
//     spezzato in due righe giganti con scie di 2-3 copie (rotateY 160 in
//     perspective 1000 sulla riga alta); stagger NEGATIVO, rapporti
//     stagger/durata del riferimento (img ~2%, testi ~6-7%).
//   · Atmospheric Depth Gallery (houmahani/codrops-depth-gallery) — le
//     persone vivono su piani a z = -i·GAP e la camera li attraversa: qui
//     perspective = 120.71svh (fov 45 del riferimento), GAP = perspective
//     (il successivo entra a metà taglia), mondo in translateZ LINEARE, e il
//     cross-fade del riferimento campionato UN GAP AVANTI: opacity IN su
//     [i-1, i], OUT su [i, i+1] — arriva a 0 esattamente quando la camera
//     tocca il piano, mai un pass-through visibile. Composizione x alternata
//     (basePosition del riferimento) e mood che vira col blend.
//   · FullscreenClipEffect (demo 1) — il congedo è una PORTA: mentre la
//     camera attraversa il ritratto, il raggio dell'arco si apre a 0 e
//     l'immagine contro-zooma (la crescita a tutto schermo è emergente
//     dalla prospettiva; ease none sotto scrub, mai inOut).
//
// Meccanica: sticky-screen collaudata (dt-paths) — runway + schermo sticky,
// master timeline in scrub, [data-on] SOLO via JS (desktop ≥1024 + motion
// ok). Sotto lg lo STESSO corridoio senza il pin («parità mobile 2»,
// scheda 19, forma (a)): i pannelli restano in flusso e ognuno fa il PROPRIO
// avvicinamento mentre entra — la prospettiva del corridoio sul pannello, il
// contenuto che arriva da z = −0.5·GAP (due terzi di taglia) e la stessa scia
// del desktop sopra (rotateY della testa, y+scale del ritratto).
// Reduced-motion / no-JS: colonna statica completa, nessuno stato nascosto
// (fromTo solo via JS).
//
// Le foto delle persone arriveranno dal cliente: `image`/`imagePos` in
// app/lib/team.ts. Senza foto, il ritratto è un monogramma tipografico —
// e sotto lg quel pannello smette anche di prenotare uno schermo intero
// (la ragione per esteso sta nel markup, sull'altezza dell'unità).
import Image from "next/image";
import { useEffect, useRef } from "react";
import { SegnoDomus } from "./BrandMotif";
import { makeFlowerSprite, makeLeafSprite } from "./motion/Fioritura";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";
import { registerWarmup, warmImage } from "../lib/motion/warmup";
import { team, teamInitials, teamRoleLabels } from "../lib/team";

const IMG_LAYERS = 8; // la demo immagine di IntroTrailEffect usa 8 copie
const TOP_LAYERS = 2; // nome: trail con rotateY + perspective (riferimento)
const BOTTOM_LAYERS = 3; // cognome: trail in sola y (riferimento)

/* Composizione x alternata del riferimento depth-gallery (basePosition.x:
   -0.9, 0.8, -0.7, 1, -0.7 in unità mondo ≈ 0.24·H): qui in frazioni di
   viewport height, smorzate perché il nome viaggia col ritratto. */
const X_DRIFT = [-0.1, 0.09, -0.08, 0.11, -0.08, 0.09];

/* La geometria del corridoio, in altezze di viewport: perspective = 120.71svh
   (fov 45 del riferimento) e GAP fra due persone PARI alla perspective — il
   piano successivo entra a metà taglia. Un solo numero per i due rami: il
   desktop lo mette sullo schermo sticky (`globals.css`, .dt-tt[data-on]
   .dt-tt_screen) e muove le unità in z; sotto lg la stessa perspective sta su
   OGNI pannello (`.dt-tt:not([data-on]) .dt-tt_unit`) e il contenuto si
   avvicina da −APPROACH·GAP. Con APPROACH = 0.5 la scala di partenza è
   P/(P+0.5·P) = 2/3 esatti, qualunque sia l'altezza del telefono. */
const PERSP_VH = 1.2071;
const APPROACH = 0.5;

/* Unità della master timeline: 1 = un GAP di viaggio camera (una persona).
   INTRO = fermo-immagine iniziale (la prima persona è GIÀ composta al pin
   start: il tuffo comincia dallo scroll); HOLD = coda ferma sull'ultima. */
const INTRO = 0.3;
const HOLD = 0.35;

/* Risoluzione del fondale rispetto allo schermo. Il canvas contiene solo
   sfocature — due blob e fiori fuori fuoco — e a meta' scala l'area da
   rasterizzare e' un quarto. Il canvas resta steso a schermo intero via CSS. */
const BG_SCALE = 0.5;

/* I mood del riferimento (galleryData: background + 2 blob per piano), qui
   nel registro Domus — creme calde, sabbie, un solo rossore sulla founder.
   Il fondale li fonde con lo STESSO blend del cross-fade dei piani. */
const MOODS = [
  { bg: "#f6efdd", b1: "#eec2b8", b2: "#e2d2b4" },
  { bg: "#efe7d6", b1: "#e6d3ae", b2: "#d9c7ae" },
  { bg: "#f4ecda", b1: "#e9cfc4", b2: "#d2c2a6" },
  { bg: "#efe6d2", b1: "#e3c9a8", b2: "#dcc4ba" },
  { bg: "#f5eedd", b1: "#eac6bb", b2: "#d8c8b0" },
  { bg: "#efe7d6", b1: "#e8d4b2", b2: "#e0c8be" },
];

const hexRgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const lerpRgb = (a: [number, number, number], b: [number, number, number], t: number) =>
  [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as [number, number, number];
/* Il softening del fragment shader: blob mescolato 35% verso il fondo. */
const soften = (c: [number, number, number], bg: [number, number, number]) => lerpRgb(c, bg, 0.35);

export default function TeamTrail() {
  const { locale } = useLocale();
  const roleLabels = teamRoleLabels[locale];
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* Le foto del corridoio, decodificate dietro il sipario.
     `loading="eager"` le mette in rete subito, ma la DECODIFICA resta pigra:
     il browser la fa al primo disegno, cioe' nel frame in cui la camera arriva
     sul piano. `decode()` la anticipa qui, dove nessuno se ne accorge. */
  useEffect(() => {
    return registerWarmup(async () => {
      const root = rootRef.current;
      if (!root) return;
      const foto = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
      // Una per URL: le otto copie del ritratto sono la stessa immagine.
      const viste = new Set<string>();
      await Promise.all(
        foto
          .filter((img) => {
            const src = img.currentSrc || img.src;
            if (!src || viste.has(src)) return false;
            viste.add(src);
            return true;
          })
          .map(warmImage)
      );
    });
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const screen = root.querySelector<HTMLElement>(".dt-tt_screen");
      const world = root.querySelector<HTMLElement>(".dt-tt_world");
      const atmo = root.querySelector<HTMLCanvasElement>(".dt-tt_bg");
      const units = gsap.utils.toArray<HTMLElement>("[data-tt-unit]", root);
      if (!screen || !world || !units.length) return;
      const N = units.length;

      const mm = gsap.matchMedia();
      // `lg` e non `desktop`: la soglia dei set piece (1024). Quello che cambia
      // qui NON è la trasformazione — è il PIN. Sopra 1024 il corridoio può
      // permettersi uno schermo sticky e un runway di `len×140vh`, perché la
      // camera attraversa davvero i piani sovrapposti in Z; sotto, sei pannelli
      // pinnati 1,2 vh l'uno sarebbero sette schermate rubate (legge 4 di
      // «parità mobile 2»). Il ramo qui sotto è il gemello, e fa lo STESSO tipo
      // di trasformazione senza pin. La chiave si chiama `lg` come la sua
      // media query: `desktop` in `MQ` è 768 e leggerlo qui ingannava.
      mm.add({ lg: MQ.lg, motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { lg: boolean; motionOk: boolean };
        if (!cond.motionOk) return;

        // ── Sotto lg: lo stesso corridoio, in flusso ──────────────────────
        // PORT-SENZA-PIN, forma (a) (scheda 19). In flusso i pannelli stanno
        // uno sotto l'altro e non si sovrappongono in Z: la camera non può
        // attraversarli. Ma la sovrapposizione era il MEZZO, non l'effetto —
        // quello che si guarda è che la persona ARRIVA DA LONTANO. Quindi ogni
        // pannello si porta addosso la prospettiva del corridoio (120.71svh, la
        // stessa dello schermo sticky) e il suo contenuto entra da z = −0.5·GAP,
        // cioè a due terzi di taglia, crescendo fino a 1 mentre il pannello
        // sale: è il tuffo del desktop misurato su una persona sola invece che
        // su sei. Sopra ci resta la scia di IntroTrail com'era — rotateY 160
        // della testa, y+scale del ritratto, stagger negativo — con le distanze
        // del desktop, non più gonfiate: le 55vh di corsa del ritratto erano il
        // rimpiazzo dell'avvicinamento che mancava; adesso l'avvicinamento c'è
        // e il ritratto torna alle 14vh del desktop.
        //
        // NON portata: la composizione x alternata (X_DRIFT). Sul desktop
        // l'unità è offset in x e la prospettiva la fa scivolare di lato mentre
        // si avvicina, ma quell'offset resta addosso al pannello a fine corsa —
        // in una colonna da 390 px vorrebbe dire contenuto fuori asse per
        // sempre. Il tipo di trasformazione è l'avvicinamento, non la deriva.
        //
        // Alleggerimenti nominati (regola Chanel): niente canvas atmosfera —
        // i 60 fiori in profondità, i 18 petali di velocità e i due blob del
        // fondale non si dipingono mai qui (il ramo esce prima, e `.dt-tt_bg`
        // è `display:none` senza [data-on]); niente pin, niente schermo sticky,
        // niente runway; i pannelli senza foto restano alti quanto il loro
        // contenuto; `will-change` solo per la finestra in cui il pannello è in
        // corsa (sotto, sul trigger).
        //
        // Le due soglie reggono anche adesso che i pannelli senza foto sono
        // più corti dello schermo (~553px contro 664, a 390×664 — vedi la nota
        // sull'altezza nel markup). I conti sulla geometria: "top 78%" scatta
        // comunque appena il pannello entra da sotto, e "center 45%" chiude
        // quando è TUTTO in campo (bordo alto a +22px invece di -33). La
        // finestra di scrub perde il 10% (495px invece di 551) e due pannelli
        // consecutivi continuano a non sovrapporsi: il successivo comincia
        // ~57px di scroll DOPO che il precedente ha finito. Nessuna soglia da
        // ritoccare — ancorare la fine al bordo alto le renderebbe uguali, ma
        // toglierebbe al pannello con la foto la chiusura in centro schermo,
        // che è esattamente ciò che quel formato si guadagna.
        if (!cond.lg) {
          /* Il punto di partenza dell'avvicinamento, in px. Funzione e non
             costante: `invalidateOnRefresh` la rilegge alla rotazione (la barra
             URL non fa più refresh, `ScrollTrigger.config({ignoreMobileResize})`
             in gsap.ts). */
          const zFrom = () => -APPROACH * PERSP_VH * window.innerHeight;

          units.forEach((panel) => {
            /* I quattro blocchi del pannello si avvicinano INSIEME: con la
               prospettiva sul pannello e l'origine al suo centro, quattro
               fratelli allo stesso z si proiettano esattamente come un unico
               gruppo a quello z. Nessun wrapper da aggiungere al DOM per
               portare il tuffo — e nessuna riga di markup che il desktop
               dovrebbe poi ignorare. */
            const blocks = panel.querySelectorAll<HTMLElement>(
              "[data-tt-top], [data-tt-img], [data-tt-bottom], [data-tt-role]"
            );
            const photo = panel.querySelector<HTMLElement>("[data-tt-img]");

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: panel,
                start: "top 78%",
                end: "center 45%",
                scrub: true,
                invalidateOnRefresh: true,
                /* `will-change` A TEMPO, e su un nodo solo: [data-tt-img] porta
                   il filtro `photo-warm` e per tutta la corsa viene scalato
                   dalla prospettiva — senza promozione il filtro si ricalcola a
                   ogni frame. Acceso quando il pannello entra in corsa, spento
                   appena esce: mai un livello permanente (prompt §11). */
                onToggle: (self) =>
                  gsap.set(photo, { willChange: self.isActive ? "transform" : "auto" }),
              },
              defaults: { duration: 1.4, ease: "power4" },
            });
            /* L'avvicinamento è la camera: lineare sotto scrub, come il mondo
               del desktop (`defaults: { ease: "none" }` della master timeline).
               La scia sopra tiene il suo power4. */
            tl.fromTo(blocks, { z: zFrom }, { z: 0, ease: "none" }, 0)
              .fromTo(
                panel.querySelectorAll("[data-tt-img] > *"),
                { y: () => window.innerHeight * 0.14, scale: 45 / 53 },
                { y: 0, scale: 1, stagger: -0.03 },
                0
              )
              .fromTo(
                panel.querySelectorAll("[data-tt-top] > *"),
                { y: () => -window.innerHeight * 0.14, rotateY: 160 },
                { y: 0, rotateY: 0, stagger: -0.1 },
                0
              )
              .fromTo(
                panel.querySelectorAll("[data-tt-bottom] > *"),
                { y: () => window.innerHeight * 0.18 },
                { y: 0, stagger: -0.08 },
                0
              )
              .fromTo(
                panel.querySelector("[data-tt-role]"),
                { autoAlpha: 0, y: 18 },
                { autoAlpha: 1, y: 0, duration: 0.8 },
                0.5
              );
          });
          return;
        }

        // ── Desktop: il corridoio pinnato ─────────────────────────────────
        root.setAttribute("data-on", "");

        // GAP = perspective (120.71svh): il piano successivo appare a metà
        // taglia quando il corrente è a fuoco — la geometria del riferimento.
        // Stesso numero del ramo sotto lg (PERSP_VH): i due rami non sono due
        // corridoi diversi, è lo stesso con e senza pin.
        const GAP = () => window.innerHeight * PERSP_VH;

        // Piazzamento 3D delle unità: z fisso per indice, x alternata.
        // Rifatto a ogni refresh (le funzioni di GAP dipendono dal viewport).
        const layout = () => {
          units.forEach((u, i) => {
            gsap.set(u, {
              z: -i * GAP(),
              x: X_DRIFT[i % X_DRIFT.length] * window.innerHeight,
            });
          });
        };
        layout();
        ScrollTrigger.addEventListener("refreshInit", layout);

        const D = INTRO + (N - 1) + HOLD;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
        });

        // La camera: ferma per il fermo-immagine iniziale, poi il mondo
        // scivola verso l'osservatore, LINEARE (il riferimento muove la
        // camera; sotto scrub è la stessa cosa).
        tl.fromTo(
          world,
          { z: 0 },
          { z: () => (N - 1) * GAP(), duration: N - 1 },
          INTRO
        );

        units.forEach((u, i) => {
          const t = (x: number) => x + INTRO; // posizione timeline (camera a t=x gap)
          const imgLayers = u.querySelectorAll<HTMLElement>("[data-tt-img] > *");
          const leader = imgLayers[imgLayers.length - 1];
          const ghosts = Array.from(imgLayers).slice(0, -1);
          const leaderImg = leader?.querySelector<HTMLElement>("img, [data-tt-mono]");

          // Cross-fade del riferimento: IN lineare su [i-1, i], OUT su
          // [i, i+1] (tocca 0 quando la camera attraversa il piano).
          // autoAlpha: le unità spente non si rasterizzano nemmeno.
          // La PRIMA persona non ha ingresso: a progress 0 è già composta
          // (contratto FIRST VIEWPORT) — nessun tween = stato CSS a riposo.
          if (i > 0) {
            tl.fromTo(u, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1 }, t(i - 1));
          }
          if (i < N - 1) {
            tl.to(u, { autoAlpha: 0, duration: 1 }, t(i));
          }

          // La scia di arrivo (IntroTrail): rapporti stagger/durata del
          // riferimento dentro la banda di avvicinamento [i-1, i].
          if (i > 0) {
            const entry = t(i - 1) + 0.12;
            const entryDur = t(i) - entry - 0.05;
            tl.fromTo(
              imgLayers,
              { y: () => window.innerHeight * 0.14, scale: 45 / 53 },
              { y: 0, scale: 1, duration: entryDur, ease: "power4", stagger: -entryDur * 0.021 },
              entry
            )
              .fromTo(
                u.querySelectorAll("[data-tt-top] > *"),
                { y: () => -window.innerHeight * 0.14, rotateY: 160 },
                { y: 0, rotateY: 0, duration: entryDur, ease: "power4", stagger: -entryDur * 0.071 },
                entry
              )
              .fromTo(
                u.querySelectorAll("[data-tt-bottom] > *"),
                { y: () => window.innerHeight * 0.18 },
                { y: 0, duration: entryDur, ease: "power4", stagger: -entryDur * 0.057 },
                entry + 0.04
              )
              .fromTo(
                u.querySelector("[data-tt-role]"),
                { autoAlpha: 0, y: 16 },
                { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" },
                t(i) - 0.3
              );
          }

          // La porta (FullscreenClip demo 1): mentre la camera attraversa il
          // ritratto, l'arco si apre a 0 e l'immagine contro-zooma. I
          // fantasmi — già perfettamente coincidenti — si spengono: la
          // crescita a tutto schermo è del solo leader. Mai sull'ultima:
          // il capitolo chiude composto.
          if (i < N - 1 && leader) {
            tl.to(ghosts, { autoAlpha: 0, duration: 0.12 }, t(i))
              .to(leader, { borderRadius: "0rem 0rem 0rem 0rem", duration: 0.7 }, t(i) + 0.05);
            if (leaderImg) {
              tl.to(leaderImg, { scale: 1.16, duration: 0.75 }, t(i) + 0.05);
            }
          }
        });

        // ── L'atmosfera del riferimento, a pieno schermo ──────────────────
        // Fondale: colore piatto + i due blob del fragment shader (stessi
        // centri erranti, softening 35%, forza 0.9, raggio che cresce con la
        // profondità, lift di luminanza +0.10·velocità). Fiori: il campo in
        // profondità proiettato con la prospettiva del corridoio (nel
        // riferimento le immagini della galleria SONO fiori), più i petali
        // di velocità di TrailHeadParticles (pool 18, spawn 20/s, vita
        // 0.25-0.6s, drag 0.94^frame). Il mood si fonde con lo STESSO blend
        // del cross-fade dei piani.
        const bctx = atmo?.getContext("2d") ?? null;
        let render: (() => void) | null = null;
        let guardiaRef: ScrollTrigger | null = null;
        if (atmo && bctx) {
          const flowers = ["#d20a0a", "#b21010", "#e0483d", "#efb9b2", "#a30707"].map((t) =>
            makeFlowerSprite(t, "#fffdf8")
          );
          const leaves = ["#857b6d", "#6b665f"].map((t) => makeLeafSprite(t));
          const rgb = MOODS.map((m) => ({ bg: hexRgb(m.bg), b1: hexRgb(m.b1), b2: hexRgb(m.b2) }));

          // Campo di fiori lungo TUTTA la profondità (anche prima e oltre)
          const field = Array.from({ length: 60 }, () => ({
            xo: (Math.random() - 0.5) * 1.35,
            yo: (Math.random() - 0.5) * 1.15,
            z: Math.random(),
            size: 18 + 48 * Math.pow(Math.random(), 2.2),
            rot: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.004,
            age: Math.random() * Math.PI * 2,
            ageD: 0.008 + 0.014 * Math.random(),
            sprite:
              Math.random() < 0.25
                ? leaves[Math.floor(Math.random() * leaves.length)]
                : flowers[Math.floor(Math.random() * flowers.length)],
          }));

          // Petali di velocità: il pool circolare del riferimento
          const pool = Array.from({ length: 18 }, () => ({
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            total: 1,
            size: 0,
            rot: 0,
            sprite: flowers[0],
          }));
          let poolIdx = 0;
          let spawnAcc = 0;

          const st = tl.scrollTrigger!;
          const put = (
            sprite: HTMLCanvasElement,
            x: number,
            y: number,
            size: number,
            rot: number,
            alpha: number
          ) => {
            const k = size / 64;
            bctx.globalAlpha = alpha;
            bctx.setTransform(
              Math.cos(rot) * k,
              Math.sin(rot) * k,
              -Math.sin(rot) * k,
              Math.cos(rot) * k,
              x,
              y
            );
            bctx.drawImage(sprite, -32, -32);
          };

          // Il canvas dorme fuori dal corridoio. Prima lo decideva un
          // `getBoundingClientRect()` A OGNI FRAME: una misura sincrona del
          // layout sessanta volte al secondo, per sapere una cosa che
          // ScrollTrigger gia' sa. Ora e' un booleano aggiornato solo quando
          // il corridoio entra o esce davvero.
          let inScena = false;
          guardiaRef = ScrollTrigger.create({
            trigger: root,
            start: "top bottom+=80",
            end: "bottom top-=80",
            onToggle: (self) => {
              inScena = self.isActive;
            },
          });

          render = () => {
            if (!inScena) return;
            // Il fondale e' fatto di sfocature: due blob e fiori fuori fuoco.
            // Dipingerlo a risoluzione piena significa rasterizzare due
            // gradienti su 1,3 milioni di pixel a ogni frame per un'immagine
            // che non ha un solo bordo netto. A meta' risoluzione l'area da
            // riempire e' un QUARTO e la differenza non si vede: il canvas
            // resta steso a schermo intero via CSS.
            const w = Math.round(screen.clientWidth * BG_SCALE);
            const h = Math.round(screen.clientHeight * BG_SCALE);
            if (!w || !h) return;
            if (atmo.width !== w || atmo.height !== h) {
              atmo.width = w;
              atmo.height = h;
            }
            const P = GAP();
            const camT = Math.min(N - 1, Math.max(0, st.progress * D - INTRO));
            const velN = Math.min(1, Math.abs(st.getVelocity()) / 2600);
            const dt = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.1);

            // 1) fondale: mood fusi col blend dei piani
            const ci = Math.min(N - 1, Math.floor(camT)) % rgb.length;
            const ni = Math.min(N - 1, Math.floor(camT) + 1) % rgb.length;
            const bl = camT - Math.floor(camT);
            const mBg = lerpRgb(rgb[ci].bg, rgb[ni].bg, bl);
            bctx.setTransform(1, 0, 0, 1, 0, 0);
            bctx.globalAlpha = 1;
            bctx.fillStyle = `rgb(${mBg.join(",")})`;
            bctx.fillRect(0, 0, w, h);

            // 2) i due blob erranti del fragment shader
            const at = performance.now() * 0.00028;
            const c1x = 0.5 + Math.sin(at) * 0.13 + Math.sin(at * 1.618) * 0.05;
            const c1y = 0.48 + Math.cos(at * 0.794) * 0.09 + Math.cos(at * 1.272) * 0.03;
            const c2x = 0.35 + Math.cos(at * 0.927) * 0.11 + Math.cos(at * 1.414) * 0.04;
            const c2y = 0.55 + Math.sin(at * 1.175) * 0.07 + Math.sin(at * 0.618) * 0.03;
            const depthProg = N > 1 ? camT / (N - 1) : 0;
            const rad = 0.65 * (1 + depthProg * 0.08) * Math.max(w, h);
            const blob = (cx: number, cy: number, r: number, col: [number, number, number]) => {
              const g = bctx.createRadialGradient(cx, cy, 0, cx, cy, r);
              const c = col.join(",");
              g.addColorStop(0, `rgba(${c},0.9)`);
              g.addColorStop(0.55, `rgba(${c},0.38)`);
              g.addColorStop(1, `rgba(${c},0)`);
              bctx.fillStyle = g;
              bctx.fillRect(0, 0, w, h);
            };
            blob(c1x * w, c1y * h, rad, soften(lerpRgb(rgb[ci].b1, rgb[ni].b1, bl), mBg));
            blob(c2x * w, c2y * h, rad * 0.78, soften(lerpRgb(rgb[ci].b2, rgb[ni].b2, bl), mBg));

            // 3) lift di luminanza con la velocità (shader: +0.10·vel)
            if (velN > 0.02) {
              bctx.fillStyle = `rgba(255,253,248,${(velN * 0.1).toFixed(3)})`;
              bctx.fillRect(0, 0, w, h);
            }

            // 4) il campo di fiori in profondità (prospettiva del corridoio)
            const depthTotal = (N - 1 + 2.4) * P;
            for (const f of field) {
              const rel = f.z * depthTotal - 1.2 * P - camT * P;
              if (rel < -0.28 * P || rel > 2.5 * P) continue;
              const s = P / (P + rel);
              const fog = rel > 0 ? 1 - rel / (2.5 * P) : 1 + rel / (0.28 * P);
              const a = 0.62 * Math.pow(Math.max(0, Math.min(1, fog)), 1.25);
              if (a <= 0.015) continue;
              f.age += f.ageD * (1 + velN * 1.5);
              f.rot += f.spin * (1 + velN * 2);
              const breath = 1 + 0.12 * Math.sin(f.age);
              put(
                f.sprite,
                w / 2 + f.xo * w * s,
                h / 2 + f.yo * h * s,
                f.size * s * breath * BG_SCALE,
                f.rot,
                a
              );
            }

            // 5) i petali di velocità (spawn solo in corsa, come la scia)
            if (velN > 0.12) {
              spawnAcc += dt * 20;
              while (spawnAcc >= 1) {
                spawnAcc -= 1;
                const petal = pool[poolIdx];
                poolIdx = (poolIdx + 1) % pool.length;
                petal.x = w * (0.5 + (Math.random() - 0.5) * 0.52);
                petal.y = h * (0.5 + (Math.random() - 0.5) * 0.4);
                const sp = 40 + 160 * Math.random();
                const ang = Math.random() * Math.PI * 2;
                petal.vx = Math.cos(ang) * sp;
                petal.vy = Math.sin(ang) * sp * 0.6;
                petal.total = petal.life = 0.25 + 0.35 * Math.random();
                petal.size = 8 + 12 * Math.random();
                petal.rot = Math.random() * Math.PI * 2;
                petal.sprite = flowers[Math.floor(Math.random() * flowers.length)];
              }
            } else {
              spawnAcc = 0;
            }
            const drag = Math.pow(0.94, dt * 60);
            for (const petal of pool) {
              if (petal.life <= 0) continue;
              petal.life -= dt;
              if (petal.life <= 0) continue;
              petal.vx *= drag;
              petal.vy *= drag;
              petal.x += petal.vx * dt;
              petal.y += petal.vy * dt;
              put(petal.sprite, petal.x, petal.y, petal.size * BG_SCALE, petal.rot, (petal.life / petal.total) * 0.5);
            }
            bctx.setTransform(1, 0, 0, 1, 0, 0);
            bctx.globalAlpha = 1;
          };
          gsap.ticker.add(render);
        }

        return () => {
          if (render) gsap.ticker.remove(render);
          guardiaRef?.kill();
          ScrollTrigger.removeEventListener("refreshInit", layout);
          root.removeAttribute("data-on");
        };
      });
    },
    { scope: rootRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <div ref={rootRef} className="dt-tt" style={{ "--dt-tt-len": String(team.length - 1 + INTRO + HOLD) } as React.CSSProperties}>
      <div className="dt-tt_screen">
        {/* L'atmosfera a pieno schermo (rif. background shader + trail della
            depth gallery): fondale a blob erranti che vira col blend dei
            piani e fiori Domus che fluttuano in profondità. Esiste solo nel
            corridoio [data-on]; dipinto in canvas 2D, niente WebGL. */}
        <canvas aria-hidden className="dt-tt_bg" />
        {/* role="list" esplicito: il preflight azzera list-style e VoiceOver
            smetterebbe di annunciare la lista come tale. */}
        <ul role="list" className="dt-tt_world">
          {team.map((member, i) => {
            const [first, ...restName] = member.name.split(" ");
            const last = restName.join(" ");
            const nameClass =
              "dt-trail relative z-10 font-display text-[clamp(2.8rem,9vw,7rem)] font-medium leading-none tracking-tight text-ink";
            return (
              /* L'altezza del pannello la decide LA FOTO, non l'indice.
                 Misurato (ago 2026, 390×664): il contenuto di un'unità sta in
                 433px, e cinque persone su sei non hanno ritratto — cinque
                 schermate intere prenotate per un arco vuoto con due iniziali,
                 il tratto di nulla più lungo di tutta la home su un telefono.
                 Sotto lg quei pannelli scendono all'altezza naturale: le 9vh di
                 respiro restano, non è una compressione ma la fine di una
                 prenotazione. Chi la foto ce l'ha si tiene lo schermo pieno: è
                 il formato che la foto si guadagna, e oggi è quello di Raffaela.
                 Sopra lg NULLA cambia — il corridoio 3D pretende che ogni unità
                 sia uno schermo, e con [data-on] le unità sono comunque
                 `inset: 0`; il `lg:` serve al desktop senza [data-on]
                 (reduced-motion, JS spento), dove la colonna resta piena.
                 Si annulla DA SOLO il giorno che il cliente consegna i ritratti:
                 la condizione è `member.image`, non un indice né una data. */
              <li
                key={member.name}
                data-tt-unit
                className={`dt-tt_unit relative flex ${
                  member.image ? "min-h-[100svh]" : "lg:min-h-[100svh]"
                } flex-col items-center justify-center overflow-hidden py-[9vh] ${
                  i % 2 === 0 ? "bg-cream" : "bg-cream-deep"
                }`}
              >
                {/* Nome: la riga alta della scia, con la prospettiva del riferimento */}
                <div data-tt-top className={`${nameClass} -mb-[0.3em]`} style={{ perspective: "1000px" }}>
                  {Array.from({ length: TOP_LAYERS }, (_, l) => (
                    <span
                      key={l}
                      aria-hidden={l < TOP_LAYERS - 1}
                      className="dt-trail_layer text-center"
                      style={{ opacity: (l + 1) / TOP_LAYERS }}
                    >
                      {first}
                    </span>
                  ))}
                </div>

                {/* Il ritratto: 8 copie, arco in alto come il riferimento */}
                {/* `photo-warm` (un filter CSS) sta QUI e non sulle otto copie:
                    per livello sarebbe una rasterizzazione filtrata a testa,
                    otto volte la stessa foto. Sul contenitore il filtro si
                    applica una volta sola al gruppo. */}
                <div data-tt-img className="dt-trail photo-warm relative h-[46vh] w-[30.5vh] sm:h-[52vh] sm:w-[34.5vh]">
                  {Array.from({ length: IMG_LAYERS }, (_, l) => {
                    const leader = l === IMG_LAYERS - 1;
                    return (
                      <div
                        key={l}
                        aria-hidden={!leader}
                        className="dt-trail_layer overflow-hidden rounded-b-[1.2rem] rounded-t-[17rem]"
                        style={{ opacity: leader ? 1 : 0.8 }}
                      >
                        {member.image ? (
                          /* alt vuoto ANCHE sul leader: il nome è già il testo
                             visibile accanto. sizes in px pieni: la larghezza
                             reale è in vh, un hint in vw sottocampionerebbe. */
                          <Image
                            src={member.image}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 65vw, 500px"
                            /* `loading="eager"` e non `priority`: la foto deve
                               essere in rete SUBITO — con lazy arrivava quando
                               la camera le era gia' addosso (misurato: +2,9s
                               dal caricamento, a scroll in corso). `priority`
                               aggiungerebbe anche un <link rel=preload> in
                               testa, rubando banda all'immagine LCP dell'hero:
                               qui basta non aspettare il viewport.
                               Le 8 copie condividono la stessa URL: per il
                               browser resta UNA richiesta. */
                            loading="eager"
                            className="object-cover"
                            style={member.imagePos ? { objectPosition: member.imagePos } : undefined}
                          />
                        ) : (
                          /* Segnaposto in attesa delle foto del cliente: monogramma.
                             Misurato (ago 2026): in app/lib/team.ts la foto ce l'ha
                             SOLO Raffaela — cinque persone su sei sono un arco vuoto
                             che occupava comunque un min-h-[100svh] intero. Sul
                             telefono erano cinque schermate di niente da scorrere.
                             Il collasso all'altezza naturale annunciato qui è FATTO
                             (Fase 2b, sotto lg: vedi l'altezza dell'unità qui sopra);
                             finché le foto non arrivano, il monogramma resta. */
                          <div
                            data-tt-mono
                            className="flex h-full w-full flex-col items-center justify-center gap-5 bg-paper ring-1 ring-inset ring-line"
                          >
                            <span className="font-display text-[clamp(3rem,7vh,5rem)] font-medium text-graphite">
                              {teamInitials(member.name)}
                            </span>
                            <SegnoDomus className="h-4 w-10 text-red" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Cognome: la riga bassa della scia (sola y, 3 copie) */}
                <div data-tt-bottom className={`${nameClass} -mt-[0.3em]`}>
                  {Array.from({ length: BOTTOM_LAYERS }, (_, l) => (
                    <span
                      key={l}
                      aria-hidden={l < BOTTOM_LAYERS - 1}
                      className="dt-trail_layer text-center"
                      style={{ opacity: (l + 1) / BOTTOM_LAYERS }}
                    >
                      {last}
                    </span>
                  ))}
                </div>

                {/* Il progresso del corridoio: qui la sequenza È informazione
                    (a schermo c'è una persona sola per volta). */}
                <p
                  data-tt-role
                  className="mt-7 flex items-center gap-3 text-[0.78rem] font-semibold uppercase tracking-[0.3em] text-stone"
                >
                  <span className="text-red">
                    {String(i + 1).padStart(2, "0")} / {String(team.length).padStart(2, "0")}
                  </span>
                  {roleLabels[member.role]}
                  {member.founder && <span className="h-2 w-2 rounded-full bg-red" aria-hidden="true" />}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
