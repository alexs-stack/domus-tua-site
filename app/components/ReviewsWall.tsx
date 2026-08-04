"use client";

// ReviewsWall — "il muro delle voci", sticky grid scroll IDENTICO al
// riferimento Codrops di Théo Plawinski (MIT, clonato per studio in
// reverse-engineering/codrops-sticky-grid-scroll): runway di 425vh con
// wrapper sticky; il wrapper viene scoperto in parallasse inversa
// (from yPercent -100 sull'ingresso); il titolo, otticamente centrato,
// sfuma dentro al 57%; poi la timeline in scrub (top 25% → bottom bottom):
// 1. le colonne della griglia volano dentro da sopra/sotto (dy oltre il
//    viewport, stagger 0.06 dal fondo o dalla testa, power1.inOut);
// 2. la griglia zooma DENTRO (scale 2.05, power3.inOut) mentre le colonne
//    laterali si aprono (xPercent ∓40) e la centrale si divarica (±40);
// 3. nel varco aperto il contenuto prende la scena: titolo che sale al suo
//    posto e descrizione+bottone in fade — toggle NON in scrub, direzionale.
//
// Contenuti: SOLO i video reali del canale (wallVideos, fonte unica
// app/lib/videos.ts). Il layout del riferimento esiste solo sotto [data-on]
// (JS, desktop ≥1024 + motion ok): mobile/reduced-motion = colonna statica
// completa, nessuno stato nascosto.
import { useRef } from "react";
import YoutubeThumb from "./YoutubeThumb";
import { Play } from "./Icons";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { wallVideos, youtubeWatch } from "../lib/videos";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";

const WALL_MQ = "(min-width: 1024px)";
const NUM_COLUMNS = 3;

const copy = {
  it: {
    title: "Il muro delle voci.",
    description:
      "Le storie vere del canale: le recensioni dei clienti, le case vendute con Open Domus, il team che conosci prima di incontrarlo.",
    cta: "Apri il canale YouTube",
  },
  en: {
    title: "The wall of voices.",
    description:
      "Real stories from the channel: client reviews, homes sold with Open Domus, and the team you get to know before meeting them.",
    cta: "Open the YouTube channel",
  },
  fr: {
    title: "Le mur des voix.",
    description:
      "Les histoires vraies de la chaîne : les avis des clients, les maisons vendues avec Open Domus, l'équipe que l'on connaît avant de la rencontrer.",
    cta: "Ouvrir la chaîne YouTube",
  },
  de: {
    title: "Die Wand der Stimmen.",
    description:
      "Echte Geschichten vom Kanal: Kundenbewertungen, mit Open Domus verkaufte Häuser und das Team, das man kennt, bevor man es trifft.",
    cta: "YouTube-Kanal öffnen",
  },
  es: {
    title: "El muro de las voces.",
    description:
      "Las historias reales del canal: las reseñas de los clientes, las casas vendidas con Open Domus y el equipo que conoces antes de conocerlo.",
    cta: "Abrir el canal de YouTube",
  },
} as const;

export default function ReviewsWall() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const descRef = useRef<HTMLParagraphElement | null>(null);
  const btnRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLUListElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const wrapper = wrapperRef.current;
      const content = contentRef.current;
      const title = titleRef.current;
      const desc = descRef.current;
      const btn = btnRef.current;
      const grid = gridRef.current;
      if (!section || !wrapper || !content || !title || !desc || !btn || !grid) return;

      const mm = gsap.matchMedia();
      mm.add({ desktop: WALL_MQ, motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!cond.desktop || !cond.motionOk) return;

        // Misure a font pronti (il titolo è Playfair): creato in async, quindi
        // trigger e set vanno revertiti a mano nel cleanup.
        let cancelled = false;
        const kills: Array<() => void> = [];
        document.fonts.ready.then(() => {
          if (cancelled) return;

          // La geometria del riferimento si accende solo ora.
          section.setAttribute("data-on", "");

          const tiles = gsap.utils.toArray<HTMLElement>("[data-wall-tile]", grid);
          if (!tiles.length) return;
          // Stesso bucketing del riferimento: item -> colonna per indice.
          const columns: HTMLElement[][] = Array.from({ length: NUM_COLUMNS }, () => []);
          tiles.forEach((tile, i) => columns[i % NUM_COLUMNS].push(tile));

          // Stato iniziale del contenuto: descrizione e bottone spenti; il
          // titolo, da solo, otticamente centrato nel content (stessa matematica
          // del riferimento: offset in percentuale dell'altezza del contenitore).
          gsap.set([desc, btn], { opacity: 0, pointerEvents: "none" });
          const dyTitle = (content.offsetHeight - title.offsetHeight) / 2;
          const titleOffsetY = (dyTitle / content.offsetHeight) * 100;
          gsap.set(title, { yPercent: titleOffsetY });

          // 1. Parallasse di scoperta del wrapper sull'ingresso della sezione.
          const parallax = gsap.from(wrapper, {
            yPercent: -100,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true },
          });

          // 2. Il titolo sfuma dentro quando la sezione raggiunge il 57%.
          const titleFade = gsap.from(title, {
            opacity: 0,
            duration: 0.7,
            ease: "power1.out",
            scrollTrigger: {
              trigger: section,
              start: "top 57%",
              toggleActions: "play none none reset",
            },
          });

          // Toggle del contenuto: NON in scrub, direzionale (come il riferimento).
          let toggleTl: gsap.core.Timeline | null = null;
          const toggleContent = (isVisible: boolean) => {
            toggleTl?.kill();
            toggleTl = gsap
              .timeline({ defaults: { overwrite: true } })
              .to(title, {
                yPercent: isVisible ? 0 : titleOffsetY,
                duration: 0.7,
                ease: "power2.inOut",
              })
              .to(
                [desc, btn],
                {
                  opacity: isVisible ? 1 : 0,
                  duration: 0.4,
                  ease: `power1.${isVisible ? "inOut" : "out"}`,
                  pointerEvents: isVisible ? "all" : "none",
                },
                isVisible ? "-=90%" : "<"
              );
          };

          // 3a. Composizione: le colonne volano dentro da fuori viewport.
          const reveal = gsap.timeline();
          const wh = window.innerHeight;
          const dy = wh - (wh - grid.offsetHeight) / 2;
          columns.forEach((column, colIndex) => {
            const fromTop = colIndex % 2 === 0;
            reveal.from(
              column,
              {
                y: dy * (fromTop ? -1 : 1),
                stagger: { each: 0.06, from: fromTop ? "end" : "start" },
                ease: "power1.inOut",
              },
              "grid-reveal"
            );
          });

          // 3b. Zoom dentro: il muro si apre come un sipario sul contenuto.
          const zoom = gsap.timeline({ defaults: { duration: 1, ease: "power3.inOut" } });
          zoom.to(grid, { scale: 2.05 });
          zoom.to(columns[0], { xPercent: -40 }, "<");
          zoom.to(columns[2], { xPercent: 40 }, "<");
          zoom.to(
            columns[1],
            {
              yPercent: (index: number) =>
                (index < Math.floor(columns[1].length / 2) ? -1 : 1) * 40,
              duration: 0.5,
              ease: "power1.inOut",
            },
            "-=0.5"
          );

          // 3d. Uscita (richiesta cliente 2026-08-04, cucitura col capitolo
          // stelle): le card continuano la corsa fino a USCIRE dal viewport e
          // il contenuto sfuma — la sezione consegna uno sfondo pulito su cui
          // il capitolo successivo fa apparire la stella.
          const exit = gsap.timeline({ defaults: { duration: 1, ease: "power2.in" } });
          exit.to(columns[0], { xPercent: -150 }, 0);
          exit.to(columns[2], { xPercent: 150 }, 0);
          exit.to(
            columns[1],
            {
              yPercent: (index: number) =>
                (index < Math.floor(columns[1].length / 2) ? -1 : 1) * 170,
            },
            0
          );
          exit.to(content, { opacity: 0, duration: 0.55, ease: "power1.in" }, 0.1);
          // Il bottone svanito non deve restare cliccabile (il pointerEvents
          // "all" del toggle vive sul figlio e scavalcherebbe il none del padre).
          exit.to(btn, { pointerEvents: "none", duration: 0.01 }, 0.55);

          // 3c. Master in scrub sulla runway, col toggle direzionale in coda.
          const master = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 25%",
              end: "bottom bottom",
              scrub: true,
            },
          });
          master
            .add(reveal)
            .add(zoom, "-=0.6")
            .add(() => toggleContent(master.scrollTrigger!.direction === 1), "-=0.32")
            .add(exit, "+=0.25");

          // Tastiera: il bottone è in fade (raggiungibile col Tab anche spento)
          // e le card possono essere ancora in volo — il focus porta lo scroll
          // al punto "scena composta" del runway (non alla fine: con l'uscita
          // in coda, fine runway = muro già svuotato).
          const scrollToComposed = () => {
            const st = master.scrollTrigger;
            if (!st) return;
            const target = st.start + (st.end - st.start) * 0.68;
            if (Math.abs(window.scrollY - target) < 4) return;
            window.scrollTo({ top: target, behavior: "auto" });
            ScrollTrigger.update();
          };
          const onBtnFocus = () => {
            toggleContent(true);
            scrollToComposed();
          };
          btn.addEventListener("focusin", onBtnFocus);
          const onGridFocus = () => {
            const p = master.scrollTrigger?.progress ?? 1;
            if (p < 0.55 || p > 0.85) scrollToComposed();
          };
          grid.addEventListener("focusin", onGridFocus);

          // La sezione è appena diventata alta 425vh: i trigger a valle vanno
          // rimisurati (ThreadNav compreso).
          ScrollTrigger.refresh();

          kills.push(() => {
            btn.removeEventListener("focusin", onBtnFocus);
            grid.removeEventListener("focusin", onGridFocus);
            for (const t of [parallax, titleFade]) {
              t.scrollTrigger?.kill();
              t.kill();
            }
            master.scrollTrigger?.kill();
            master.kill();
            toggleTl?.kill();
            gsap.set([title, desc, btn, grid, ...tiles], { clearProps: "all" });
            section.removeAttribute("data-on");
          });
        });

        return () => {
          cancelled = true;
          kills.forEach((kill) => kill());
        };
      });
    },
    { scope: sectionRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <section ref={sectionRef} className="dt-wall relative">
      <div ref={wrapperRef} className="dt-wall_wrapper px-5 sm:px-8">
        <div
          ref={contentRef}
          className="dt-wall_content mx-auto max-w-[1240px] py-24 text-center sm:py-28"
        >
          <h2
            ref={titleRef}
            className="max-w-[16ch] font-display text-[clamp(2.2rem,6.4vw,6rem)] font-medium leading-[1.08] tracking-[-0.02em] text-ink"
          >
            {c.title}
          </h2>
          <p
            ref={descRef}
            className="mt-6 max-w-md text-[0.8rem] font-medium uppercase leading-relaxed tracking-[0.08em] text-graphite"
          >
            {c.description}
          </p>
          {/* Il ref GSAP (opacity + pointerEvents) vive sul wrapper: il bottone
              dentro eredita i pointer-events e resta cliccabile quando acceso. */}
          <div ref={btnRef} className="mt-8 flex justify-center">
            <Cta
              href={site.social.youtube.href}
              variant="cta"
              size="md"
              target="_blank"
              rel="noopener noreferrer"
            >
              {c.cta}
            </Cta>
          </div>
        </div>

        <div className="dt-wall_gallery mx-auto mt-2 max-w-[1240px] pb-24 lg:mt-0 lg:max-w-none lg:pb-0">
          <ul ref={gridRef} className="dt-wall_grid grid grid-cols-2 gap-4 sm:gap-5">
            {wallVideos.map((v) => (
              <li
                key={v.id}
                data-wall-tile
                className="dt-wall_item relative aspect-video overflow-hidden rounded-card bg-espresso"
              >
                <a
                  href={youtubeWatch(v.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={v.title}
                  className="group absolute inset-0 block"
                >
                  <YoutubeThumb
                    id={v.id}
                    alt=""
                    sizes="(min-width: 1024px) 17vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.05]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 ease-soft group-hover:scale-110">
                    <Play className="ml-0.5 h-3 w-3" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
