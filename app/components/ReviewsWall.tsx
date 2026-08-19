"use client";

// ReviewsWall — "il muro delle voci", sticky grid scroll IDENTICO al
// riferimento Codrops di Théo Plawinski (MIT, clonato per studio in
// reverse-engineering/codrops-sticky-grid-scroll): runway di 520vh con
// wrapper sticky (i 425vh del riferimento più la corsa d'uscita delle card:
// la matematica sta in globals.css, .dt-wall[data-on]); il wrapper viene
// scoperto in parallasse inversa (from yPercent -100 sull'ingresso); il
// titolo, otticamente centrato, sfuma dentro al 57%; poi la timeline in
// scrub (top 25% → bottom bottom):
// 1. le colonne della griglia volano dentro da sopra/sotto (dy oltre il
//    viewport, stagger 0.06 dal fondo o dalla testa, power1.inOut);
// 2. la griglia zooma DENTRO (scale 2.05, power3.inOut) mentre le colonne
//    laterali si aprono (xPercent ∓40) e la centrale si divarica (±40);
// 3. nel varco aperto il contenuto prende la scena: titolo che sale al suo
//    posto e descrizione+bottone in fade — toggle NON in scrub, direzionale.
//
// Contenuti: SOLO i video reali del canale (wallVideos, fonte unica
// app/lib/videos.ts). Il layout del riferimento esiste solo sotto [data-on]
// (JS, desktop ≥1024 + motion ok).
//
// Sotto lg il muro non è più fermo (wave "parità mobile", 2026-08-11): la
// griglia a due colonne compone in diagonale, UN TRIGGER PER TESSERA; e dal
// 2026-08-18 (onda «parità mobile 2», scheda 17) le due colonne SCORRONO IN
// VERSI OPPOSTI in scrub sulla traversata — la cosa che si legge del set piece
// desktop (le colonne non sono un blocco) senza il runway da 520vh né lo
// schermo sticky, che sarebbero scroll rubato. Qui era
// scritto «con UN solo trigger» ed era la scelta sbagliata: misurata, faceva
// accadere due terzi della diagonale sotto il bordo dello schermo (la
// contabilità sta nel ramo). La riga che stava qui — «mobile/reduced-motion =
// colonna statica completa» — resta vera per reduced-motion e per il no-JS
// (l'HTML servito è già completo e nessuno stato nascosto vive fuori da
// matchMedia), non più per il telefono.
import { useRef } from "react";
import YoutubeThumb from "./YoutubeThumb";
import { Play } from "./Icons";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { wallVideos, youtubeWatch } from "../lib/videos";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, dist, stagger } from "../lib/motion/gsap";

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
      mm.add({ lg: MQ.lg, motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { lg: boolean; motionOk: boolean };
        if (!cond.motionOk) return;
        if (!cond.lg) {
          // Il muro su due colonne. Il gesto del desktop dice "le voci
          // arrivano e compongono": a 390px la traduzione onesta non è la
          // stessa rotaia più stretta, è lo stagger in ordine di DOM — su due
          // colonne si legge come una diagonale che scende. Nessun runway,
          // nessuno sticky, nessun [data-on], nessun ScrollTrigger.refresh()
          // (l'altezza della sezione non cambia).
          //
          // E niente document.fonts.ready: qui non si misura niente. Ad
          // aspettare i font è la centratura ottica del titolo, che è roba del
          // ramo desktop — questo ramo non deve ereditarne l'attesa né la
          // contabilità di cancelled/kills.
          const tiles = gsap.utils.toArray<HTMLElement>("[data-wall-tile]", grid);
          if (!tiles.length) return;

          // La quota d'ingresso, scritta una volta sola: la usano i trigger e
          // la loro rete di sicurezza, e devono dire lo stesso numero.
          const startPct = 90;
          // UN TRIGGER PER TESSERA (ScrollTrigger.batch, lo stesso idioma di
          // SocialVideoWall), e non uno solo sulla griglia com'era in prima
          // stesura. Il conto di allora: la griglia è alta 314px, le tre righe
          // stanno a y locale 0/110/220 e "top 85%" scattava con la cima a
          // 564px — la terza riga era a 784px, centoventi sotto il bordo di un
          // viewport da 664. Quando entrava in campo le sue tessere erano già
          // al 97% di opacità: la diagonale c'era, ma succedeva altrove.
          // Adesso ogni coppia si prende il proprio ingresso, in scena — e
          // proprio perché l'ingresso si vede, la corsa può dimezzarsi.
          //
          // opacity, non autoAlpha: ogni tessera è un link al video e
          // visibility:hidden la toglierebbe dal tab order.
          // E `pointerEvents: none` a fare l'altra metà del lavoro: senza,
          // una tessera invisibile resta un bersaglio VIVO che apre YouTube.
          // È la coppia obbligata della regola (lib/motion/gsap.ts): opacity
          // tiene il link raggiungibile col Tab, pointer-events lo tiene fuori
          // dal dito finché non c'è niente da vedere.
          gsap.set(tiles, { y: dist.rise / 2, opacity: 0, pointerEvents: "none" });
          ScrollTrigger.batch(tiles, {
            start: `top ${startPct}%`,
            // once: il muro si compone una volta e resta composto — sei
            // tessere che rientrano a ogni risalita sarebbero un tic.
            once: true,
            onEnter: (els) =>
              gsap.to(els, {
                y: 0,
                opacity: 1,
                pointerEvents: "auto",
                duration: dur.reveal,
                stagger: stagger.cards,
                ease: "domus",
              }),
          });

          /* REGOLA CHANEL — ciò che esce è la rete `focusin`.
             Questo ramo metteva tre cose (i trigger, un listener focusin sulla
             griglia, un timeout) e non ne toglieva nessuna. Ma le due reti
             erano la stessa rete: il timeout qui sotto è guardato dalla
             posizione e i trigger sono `once`, quindi quando il focus da
             tastiera arriva sulle tessere la griglia è per forza in scena —
             cioè il trigger è già scattato e non c'è niente da accendere. Né
             il listener era portante per la tastiera: le tessere sono spente
             in opacity, non in visibility, e dall'ordine di tabulazione non
             escono mai. Resta il timeout, che invece un lavoro ce l'ha. */

          // Il timeout secco a 2500 ms di Footer e SocialVideoWall qui
          // rivelerebbe il muro a tutti, perché la sezione sta a quindici
          // schermate dalla cima e nessuno ci arriva in due secondi e mezzo.
          // La rete accende solo le tessere che hanno passato la quota
          // d'ingresso e sono rimaste spente: cioè solo se un trigger ha
          // davvero mancato il colpo.
          const safety = window.setTimeout(() => {
            const late = tiles.filter(
              (tile) =>
                !gsap.isTweening(tile) &&
                Number(gsap.getProperty(tile, "opacity")) === 0 &&
                tile.getBoundingClientRect().top < (window.innerHeight * startPct) / 100
            );
            if (late.length) gsap.set(late, { y: 0, opacity: 1, pointerEvents: "auto" });
          }, 2500);

          /* LE DUE COLONNE SI MUOVONO IN VERSI OPPOSTI (onda «parità mobile 2»,
             scheda 17: PORT-SENZA-PIN). Sul desktop il muro fa tre cose: le
             colonne volano dentro, la griglia zooma, le colonne si aprono. Il
             telefono non può avere lo zoom — vuole il runway da 520vh e uno
             schermo sticky, cioè lo scroll rubato che la legge 4 vieta — ma la
             cosa che si LEGGE di quel set piece è che le colonne non sono un
             blocco: scorrono a velocità diverse e la griglia si apre. Quello
             si porta senza rubare niente: mentre la sezione attraversa il
             viewport, la colonna di sinistra sale e quella di destra scende
             (yPercent ∓, come le due metà del desktop), in scrub sulla
             traversata naturale.
             NIENTE WRAPPER NUOVI: le colonne del markup mobile sono le tessere
             pari e dispari di una `grid-cols-2` (non esistono elementi
             colonna, nemmeno sul desktop: là il bucketing è `i % 3` in JS).
             `yPercent` su un grid item è transform, quindi non tocca il
             layout — e le tessere restano dove il grid le mette.
             L'ampiezza è quella di casa per una parallasse (`dist.parallax`,
             il 13% di sé), dimezzata come tutte le parallassi del telefono
             dalla Fase 2: un muro non è un carosello. */
          const pari = tiles.filter((_, i) => i % 2 === 0);
          const dispari = tiles.filter((_, i) => i % 2 === 1);
          const AMPIEZZA = (dist.parallax * 100) / 2;
          const drift = gsap.timeline({
            scrollTrigger: {
              trigger: grid,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
              /* `will-change` A TEMPO, e sulle tessere solo mentre la griglia
                 è in corsa: sei miniature YouTube promosse per sempre sono sei
                 livelli di composizione che il telefono si porta dietro per
                 tutta la pagina (prompt §11). */
              onToggle: (self) =>
                gsap.set(tiles, { willChange: self.isActive ? "transform" : "auto" }),
            },
          });
          drift
            .fromTo(pari, { yPercent: AMPIEZZA }, { yPercent: -AMPIEZZA, ease: "none" }, 0)
            .fromTo(dispari, { yPercent: -AMPIEZZA }, { yPercent: AMPIEZZA, ease: "none" }, 0);

          // Set, tween e trigger li revoca il contesto di matchMedia: nascono
          // in sincrono, non dopo un await come quelli del ramo desktop,
          // quindi non serve (e non si deve) ripulirli a mano. È anche ciò che
          // tiene separati i due teardown: attraversando i 1024 nessuno dei
          // due rami tocca i target dell'altro — il clearProps del desktop
          // resta affare del desktop. A mano resta solo il timeout.
          return () => window.clearTimeout(safety);
        }

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

          // La sezione è appena diventata alta 520vh: i trigger a valle vanno
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
          {/* mx-auto: sotto lg il content è un blocco normale, quindi la
              scatola da 16ch si appoggiava a sinistra e il testo centrato al
              suo interno finiva ~20px fuori asse rispetto a paragrafo e
              bottone. Sopra lg il content è flex con align-items:center e il
              margine auto dà lo stesso risultato di prima. */}
          <h2
            ref={titleRef}
            className="mx-auto max-w-[16ch] font-display text-d2 display-tight font-medium text-ink"
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
                {/* Il titolo è VISIBILE, non solo in aria-label.
                    Era il copy migliore del sito e non lo leggeva nessuno: «Villa di
                    Roberta, venduta al primo Open Domus», «Teresa, venduta al primo
                    Open Domus». Nascosto in un attributo dava sei miniature mute — niente
                    da leggere per chi guarda, niente da indicizzare per Google e nessun
                    motivo per cliccare. Il testo era già scritto: bastava tirarlo fuori.
                    Con il titolo nel flusso, l'aria-label non serve più (anzi: duplicherebbe
                    il nome accessibile del link). */}
                <a
                  href={youtubeWatch(v.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group absolute inset-0 block"
                >
                  <YoutubeThumb
                    id={v.id}
                    alt=""
                    sizes="(min-width: 1024px) 17vw, 50vw"
                    className="object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.05]"
                  />
                  {/* Velo più deciso in basso: prima serviva solo a dare profondità,
                      adesso deve reggere del testo bianco su una miniatura qualsiasi. */}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/25 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="absolute inset-x-2.5 bottom-2.5 pr-10 text-left text-[0.72rem] font-medium leading-snug text-white sm:text-sm">
                    {v.title}
                  </span>
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
