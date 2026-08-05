"use client";

// TeamTrail — la parte del team replicata da codrops/IntroTrailEffect, ma a
// piena pagina PER OGNI persona e guidata dallo scroll. Dal riferimento
// prendiamo tutto l'impianto:
//   · il ritratto è una pila di 8 copie identiche nella stessa cella grid
//     (fantasmi a opacity 0.8, il leader — ultimo nel DOM — a 1);
//   · il nome è spezzato in due righe giganti come "Zofia / Dabrowski": la
//     riga alta è una scia di 2 copie con rotateY 160→0 dentro perspective
//     1000, la bassa una scia di 3 copie in sola y (offset -14vh / +18vh);
//   · tutte le copie percorrono lo STESSO tragitto con stagger NEGATIVO
//     (immagine -0.03, testi -0.1/-0.08) e le durate/ease del riferimento
//     (1.4, power4): il leader guida, i fantasmi lo inseguono;
//   · niente Flip: sotto scrub il fromTo equivalente è reversibile e la
//     scia si apre e si richiude seguendo lo scroll (opacity STATICHE:
//     a scroll fermo la pila coincide con un ritratto solo);
//   · l'arco in alto del ritratto è il border-radius 20vw 20vw 0 0 del
//     riferimento — che qui è anche l'arco di brand (rif. Contact).
// Le foto delle singole persone arriveranno dal cliente: `image` in
// app/lib/team.ts. Senza foto, il ritratto è un monogramma tipografico.
//
// Senza JS / reduced-motion: nessuno stato nascosto (fromTo solo via JS),
// i pannelli restano colonna statica completa.
import Image from "next/image";
import { useRef } from "react";
import { SegnoDomus } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";
import { team, teamInitials, teamRoleLabels } from "../lib/team";

const IMG_LAYERS = 8; // la demo immagine del riferimento usa 8 copie
const TOP_LAYERS = 2; // nome: trail con rotateY + perspective (riferimento)
const BOTTOM_LAYERS = 3; // cognome: trail in sola y (riferimento)

export default function TeamTrail() {
  const { locale } = useLocale();
  const roleLabels = teamRoleLabels[locale];
  const rootRef = useRef<HTMLUListElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.utils.toArray<HTMLElement>("[data-tt-panel]", root).forEach((panel) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: panel,
              start: "top 78%",
              end: "center 45%",
              scrub: true,
              invalidateOnRefresh: true,
            },
            // Le costanti del riferimento (gsapAnimation.js): sotto scrub
            // contano i RAPPORTI stagger/durata, che restano quelli.
            defaults: { duration: 1.4, ease: "power4" },
          });
          tl.fromTo(
            panel.querySelectorAll("[data-tt-img] > *"),
            // 45vh → 53vh del riferimento = scale 0.849 → 1; l'ingresso dal
            // basso sostituisce il tragitto del Flip (qui lo detta lo scroll).
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
      });
    },
    { scope: rootRef }
  );

  return (
    <ul ref={rootRef}>
      {team.map((member, i) => {
        const [first, ...restName] = member.name.split(" ");
        const last = restName.join(" ");
        const nameClass =
          "dt-trail relative z-10 font-display text-[clamp(2.8rem,9vw,7rem)] font-medium leading-none tracking-tight text-ink";
        return (
          <li
            key={member.name}
            data-tt-panel
            className={`relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden py-[9vh] ${
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
                      <Image
                        src={member.image}
                        alt={leader ? member.name : ""}
                        fill
                        sizes="(max-width: 640px) 65vw, 25vw"
                        className="photo-warm object-cover"
                        style={member.imagePos ? { objectPosition: member.imagePos } : undefined}
                      />
                    ) : (
                      /* Segnaposto in attesa delle foto del cliente: monogramma */
                      <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-paper ring-1 ring-inset ring-line">
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

            <p
              data-tt-role
              className="mt-7 flex items-center gap-3 text-[0.78rem] font-semibold uppercase tracking-[0.3em] text-stone"
            >
              <span className="text-red">{String(i + 1).padStart(2, "0")}</span>
              {roleLabels[member.role]}
              {member.founder && <span className="h-2 w-2 rounded-full bg-red" aria-hidden="true" />}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
