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
// ok). Mobile con motion: i pannelli in colonna tengono la scia scrubbata
// per-pannello. Reduced-motion / no-JS: colonna statica completa, nessuno
// stato nascosto (fromTo solo via JS).
//
// Le foto delle persone arriveranno dal cliente: `image`/`imagePos` in
// app/lib/team.ts. Senza foto, il ritratto è un monogramma tipografico.
import Image from "next/image";
import { useRef } from "react";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";
import { team, teamInitials, teamRoleLabels } from "../lib/team";

const IMG_LAYERS = 8; // la demo immagine di IntroTrailEffect usa 8 copie
const TOP_LAYERS = 2; // nome: trail con rotateY + perspective (riferimento)
const BOTTOM_LAYERS = 3; // cognome: trail in sola y (riferimento)

/* Composizione x alternata del riferimento depth-gallery (basePosition.x:
   -0.9, 0.8, -0.7, 1, -0.7 in unità mondo ≈ 0.24·H): qui in frazioni di
   viewport height, smorzate perché il nome viaggia col ritratto. */
const X_DRIFT = [-0.1, 0.09, -0.08, 0.11, -0.08, 0.09];

/* Unità della master timeline: 1 = un GAP di viaggio camera (una persona).
   INTRO = fermo-immagine iniziale (la prima persona è GIÀ composta al pin
   start: il tuffo comincia dallo scroll); HOLD = coda ferma sull'ultima. */
const INTRO = 0.3;
const HOLD = 0.35;

export default function TeamTrail() {
  const { locale } = useLocale();
  const roleLabels = teamRoleLabels[locale];
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const screen = root.querySelector<HTMLElement>(".dt-tt_screen");
      const world = root.querySelector<HTMLElement>(".dt-tt_world");
      const mood = root.querySelector<HTMLElement>(".dt-tt_mood");
      const units = gsap.utils.toArray<HTMLElement>("[data-tt-unit]", root);
      if (!screen || !world || !units.length) return;
      const N = units.length;

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 1024px)", motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!cond.motionOk) return;

        // ── Mobile/tablet con motion: colonna con scia scrubbata per pannello ──
        if (!cond.desktop) {
          units.forEach((panel) => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: panel,
                start: "top 78%",
                end: "center 45%",
                scrub: true,
                invalidateOnRefresh: true,
              },
              defaults: { duration: 1.4, ease: "power4" },
            });
            tl.fromTo(
              panel.querySelectorAll("[data-tt-img] > *"),
              { y: () => window.innerHeight * 0.55, scale: 45 / 53 },
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
        const GAP = () => window.innerHeight * 1.2071;

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

        // Il mood del riferimento: il fondale vira col blend tra un piano
        // e il successivo (qui tra le due creme della palette). L'ultima
        // rampa è CLAMPATA a finire con lo stop della camera: il congedo
        // resta davvero fermo.
        if (mood) {
          for (let i = 1; i < N; i++) {
            tl.to(
              mood,
              { opacity: i % 2, duration: 0.8 },
              Math.min(i - 0.5 + INTRO, D - HOLD - 0.8)
            );
          }
        }

        return () => {
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
        {/* Mood di profondità: vira tra le due creme col blend (rif. background
            shader della depth gallery). Esiste solo nel corridoio [data-on]. */}
        <div aria-hidden className="dt-tt_mood" />
        {/* role="list" esplicito: il preflight azzera list-style e VoiceOver
            smetterebbe di annunciare la lista come tale. */}
        <ul role="list" className="dt-tt_world">
          {team.map((member, i) => {
            const [first, ...restName] = member.name.split(" ");
            const last = restName.join(" ");
            const nameClass =
              "dt-trail relative z-10 font-display text-[clamp(2.8rem,9vw,7rem)] font-medium leading-none tracking-tight text-ink";
            return (
              <li
                key={member.name}
                data-tt-unit
                className={`dt-tt_unit relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-[9vh] ${
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
                <div data-tt-img className="dt-trail relative h-[46vh] w-[30.5vh] sm:h-[52vh] sm:w-[34.5vh]">
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
                            className="photo-warm object-cover"
                            style={member.imagePos ? { objectPosition: member.imagePos } : undefined}
                          />
                        ) : (
                          /* Segnaposto in attesa delle foto del cliente: monogramma */
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
