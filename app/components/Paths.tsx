"use client";

// Paths — "Due percorsi, un solo metodo", riscritto (2026-08-04) sulla
// grammatica di moussamamadou/scroll-trigger-gsap-section: un fondale pinnato
// col titolo gigante e poi ogni percorso è una PAGINA PIENA che si alza dal
// basso (clip-path inset 100%→0, in scrub) — lo stesso gesto della cupola di
// "Perché scegliere Domus Tua", qui al servizio della scelta vendo/compro.
// Dentro ogni pagina: la foto respira (scale 1.35→1.18), le righe del titolo
// salgono dai loro binari (data-line del riferimento: yPercent 120 + rotate),
// i tre punti scivolano dentro dal lato del percorso (come i video del
// riferimento) e il percorso precedente si vela quando arriva il successivo.
// Meccanica: sticky-screen già collaudata dal sito (dt-wall/dt-starrev) al
// posto dei work_item `position:fixed` del riferimento — niente trappole di
// stacking con main/footer-uncover.
// Mobile / reduced-motion / no-JS: intro + pannelli in colonna, tutto
// visibile e statico ([data-on] arriva solo via JS, desktop ≥1024).
import Image from "next/image";
import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import Fioritura from "./motion/Fioritura";
import { Cta } from "./primitives/Cta";
import { Check } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";
import { gsap, ScrollTrigger, useGSAP, MQ } from "../lib/motion/gsap";

gsap.registerPlugin(SplitText);

const paths = [
  {
    id: "vendi",
    href: "/vendi",
    image: "/images/reali/consulenza.jpg",
  },
  {
    id: "acquista",
    href: "/acquista",
    image: "/images/reali/villa-pool.jpg",
  },
] as const;

const INTRO_IMG = "/images/reali/raffaela-team-sede.jpg";

const copy = {
  it: {
    eyebrow: "Due percorsi, un solo metodo",
    heading: "Che tu venda o acquisti, il nostro lavoro è proteggere le tue scelte.",
    introAlt: "Il team Domus Tua nella sede di Tradate",
    paths: {
      vendi: {
        tag: "Per chi vende",
        title: "Vendi casa con metodo, non con improvvisazione.",
        copy: "Valutiamo, prepariamo, raccontiamo e promuoviamo il tuo immobile con un percorso pensato per ridurre stress, tempi morti e incertezze.",
        points: [
          "Valutazione professionale e documenti verificati",
          "Foto, video, rendering e home staging",
          "Campagne marketing e Open Domus",
        ],
        cta: "Voglio vendere casa",
        alt: "Consulenza Domus Tua: il percorso di vendita spiegato al tavolo",
      },
      acquista: {
        tag: "Per chi acquista",
        title: "Acquista casa con più risposte e meno dubbi.",
        copy: "Ti accompagniamo nelle visite, nella documentazione, nella proposta e in ogni passaggio fino al rogito.",
        points: [
          "Informazioni chiare già prima della visita",
          "Documentazione verificata e trasparente",
          "Supporto su proposta, compromesso e rogito",
        ],
        cta: "Cerco casa",
        alt: "Villa con piscina seguita da Domus Tua",
      },
    },
  },
  en: {
    eyebrow: "Two paths, one method",
    heading: "Whether you sell or buy, our job is to protect your choices.",
    introAlt: "The Domus Tua team at the Tradate office",
    paths: {
      vendi: {
        tag: "For those selling",
        title: "Sell your home with method, not improvisation.",
        copy: "We appraise, prepare, tell the story of and promote your property through a process designed to reduce stress, downtime and uncertainty.",
        points: [
          "Professional appraisal and verified documents",
          "Photography, video, rendering and home staging",
          "Marketing campaigns and Open Domus",
        ],
        cta: "I want to sell my home",
        alt: "Domus Tua consultation: the selling journey explained at the table",
      },
      acquista: {
        tag: "For those buying",
        title: "Buy your home with more answers and fewer doubts.",
        copy: "We guide you through viewings, documentation, the offer and every step up to the closing.",
        points: [
          "Clear information even before the viewing",
          "Verified and transparent documentation",
          "Support with offer, preliminary contract and closing",
        ],
        cta: "I'm looking for a home",
        alt: "Villa with pool listed by Domus Tua",
      },
    },
  },
  fr: {
    eyebrow: "Deux parcours, une seule méthode",
    heading: "Que vous vendiez ou achetiez, notre métier est de protéger vos choix.",
    introAlt: "L'équipe Domus Tua dans l'agence de Tradate",
    paths: {
      vendi: {
        tag: "Pour ceux qui vendent",
        title: "Vendez votre bien avec méthode, pas à l'improviste.",
        copy: "Nous évaluons, préparons, mettons en valeur et faisons la promotion de votre bien grâce à un parcours pensé pour réduire le stress, les temps morts et les incertitudes.",
        points: [
          "Évaluation professionnelle et documents vérifiés",
          "Photos, vidéos, rendus et home staging",
          "Campagnes marketing et Open Domus",
        ],
        cta: "Je veux vendre mon bien",
        alt: "Consultation Domus Tua : le parcours de vente expliqué à la table",
      },
      acquista: {
        tag: "Pour ceux qui achètent",
        title: "Achetez votre bien avec plus de réponses et moins de doutes.",
        copy: "Nous vous accompagnons lors des visites, dans les démarches, dans l'offre et à chaque étape jusqu'à la signature.",
        points: [
          "Des informations claires dès avant la visite",
          "Une documentation vérifiée et transparente",
          "Un accompagnement pour l'offre, le compromis et la signature",
        ],
        cta: "Je cherche un bien",
        alt: "Villa avec piscine proposée par Domus Tua",
      },
    },
  },
  de: {
    eyebrow: "Zwei Wege, eine Methode",
    heading: "Ob Sie verkaufen oder kaufen: Unsere Aufgabe ist es, Ihre Entscheidungen zu schützen.",
    introAlt: "Das Domus Tua Team im Büro in Tradate",
    paths: {
      vendi: {
        tag: "Für Verkäufer",
        title: "Verkaufen Sie Ihre Immobilie mit Methode, nicht mit Improvisation.",
        copy: "Wir bewerten, bereiten vor, inszenieren und bewerben Ihre Immobilie mit einem Ablauf, der Stress, Leerlauf und Unsicherheiten reduziert.",
        points: [
          "Professionelle Bewertung und geprüfte Unterlagen",
          "Fotos, Videos, Renderings und Home Staging",
          "Marketingkampagnen und Open Domus",
        ],
        cta: "Ich möchte meine Immobilie verkaufen",
        alt: "Domus Tua Beratung: der Verkaufsweg, am Tisch erklärt",
      },
      acquista: {
        tag: "Für Käufer",
        title: "Kaufen Sie Ihre Immobilie mit mehr Antworten und weniger Zweifeln.",
        copy: "Wir begleiten Sie bei Besichtigungen, bei den Unterlagen, beim Angebot und bei jedem Schritt bis zum Notartermin.",
        points: [
          "Klare Informationen schon vor der Besichtigung",
          "Geprüfte und transparente Unterlagen",
          "Unterstützung bei Angebot, Vorvertrag und Notartermin",
        ],
        cta: "Ich suche eine Immobilie",
        alt: "Villa mit Pool im Angebot von Domus Tua",
      },
    },
  },
  es: {
    eyebrow: "Dos recorridos, un solo método",
    heading: "Tanto si vendes como si compras, nuestro trabajo es proteger tus decisiones.",
    introAlt: "El equipo Domus Tua en la oficina de Tradate",
    paths: {
      vendi: {
        tag: "Para quien vende",
        title: "Vende tu casa con método, no con improvisación.",
        copy: "Valoramos, preparamos, contamos y promocionamos tu inmueble con un recorrido pensado para reducir el estrés, los tiempos muertos y la incertidumbre.",
        points: [
          "Valoración profesional y documentos verificados",
          "Fotos, vídeos, renders y home staging",
          "Campañas de marketing y Open Domus",
        ],
        cta: "Quiero vender mi casa",
        alt: "Consultoría Domus Tua: el recorrido de venta explicado en la mesa",
      },
      acquista: {
        tag: "Para quien compra",
        title: "Compra tu casa con más respuestas y menos dudas.",
        copy: "Te acompañamos en las visitas, en la documentación, en la oferta y en cada paso hasta la firma.",
        points: [
          "Información clara ya antes de la visita",
          "Documentación verificada y transparente",
          "Apoyo en la oferta, el contrato preliminar y la firma",
        ],
        cta: "Busco casa",
        alt: "Villa con piscina ofrecida por Domus Tua",
      },
    },
  },
} as const;

export default function Paths() {
  const { locale } = useLocale();
  const c = copy[locale];
  const sectionRef = useRef<HTMLElement | null>(null);
  const runwayRef = useRef<HTMLDivElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const runway = runwayRef.current;
      const screen = screenRef.current;
      if (!section || !runway || !screen) return;

      const mm = gsap.matchMedia();
      mm.add({ desktop: "(min-width: 1024px)", motionOk: MQ.motionOk }, (ctx) => {
        const cond = ctx.conditions as { desktop: boolean; motionOk: boolean };
        if (!cond.desktop || !cond.motionOk) return;

        section.setAttribute("data-on", "");

        const introImg = screen.querySelector<HTMLElement>("[data-paths-intro-img]");
        const introTxt = screen.querySelector<HTMLElement>("[data-paths-intro-txt]");
        const panels = gsap.utils.toArray<HTMLElement>("[data-paths-panel]", screen);
        const imgs = panels.map((p) => p.querySelector<HTMLElement>("[data-paths-img]"));
        const veils = panels.map((p) => p.querySelector<HTMLElement>("[data-paths-veil]"));
        if (!introImg || panels.length !== 2) return;

        // Stato iniziale SOLO via JS: le pagine aspettano sotto il bordo.
        panels.forEach((p, i) => {
          gsap.set(p, { clipPath: "inset(100% 0% 0% 0%)" });
          if (imgs[i]) gsap.set(imgs[i], { scale: 1.35, yPercent: 8 });
          if (veils[i]) gsap.set(veils[i], { opacity: 0 });
        });

        // I tre punti scivolano dentro dal lato del percorso (i "video" del
        // riferimento): vendi da destra, acquista da sinistra.
        const rows = panels.map((p) => gsap.utils.toArray<HTMLElement>("[data-paths-point]", p));

        // Master in scrub sulla runway. Scala interna: 10 unità.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: runway,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
        });
        tl
          // Fondale: la foto del team respira mentre si legge il titolo...
          .fromTo(introImg, { scale: 1.05 }, { scale: 1.16, duration: 3.2 }, 0)
          // ...e il titolo deriva piano verso l'alto quando la pagina lo copre.
          .to(introTxt, { yPercent: -14, duration: 2.2 }, 1.0)
          // Percorso 1 (vendi): la pagina si alza dal basso.
          .to(panels[0], { clipPath: "inset(0% 0% 0% 0%)", duration: 2.0 }, 1.2)
          .to(imgs[0], { scale: 1.18, yPercent: 0, duration: 2.4 }, 1.2)
          .fromTo(
            rows[0],
            { x: () => window.innerWidth * 0.55, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.5, stagger: 0.3 },
            2.3
          )
          // Respiro di lettura (2 unità di quiete), poi il velo si posa sul
          // primo percorso mentre il secondo gli sale sopra.
          .to(veils[0], { opacity: 0.45, duration: 1.6 }, 5.4)
          .to(panels[1], { clipPath: "inset(0% 0% 0% 0%)", duration: 2.0 }, 5.4)
          .to(imgs[1], { scale: 1.18, yPercent: 0, duration: 2.4 }, 5.4)
          .fromTo(
            rows[1],
            { x: () => window.innerWidth * -0.55, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.5, stagger: 0.3 },
            6.5
          )
          // Coda di lettura del secondo percorso prima dello sgancio.
          .to({}, { duration: 1.6 }, 8.4);

        // Le righe dei titoli (grammatica data-line del riferimento): toggle
        // direzionale, NON in scrub — salgono dai binari quando la pagina è
        // quasi composta, tornano giù risalendo. Split a font pronti.
        let cancelled = false;
        const kills: Array<() => void> = [];
        document.fonts.ready.then(() => {
          if (cancelled) return;
          const starts = ["21% top", "51% top"];
          panels.forEach((panel, i) => {
            const title = panel.querySelector<HTMLElement>("[data-paths-title]");
            const extras = gsap.utils.toArray<HTMLElement>("[data-paths-el]", panel);
            if (!title) return;
            const split = SplitText.create(title, {
              type: "lines",
              tag: "span",
              linesClass: "dt-paths_line",
              mask: "lines",
              aria: "none",
            });
            gsap.set(split.lines, { yPercent: 120, rotate: 2 });
            // Solo opacity sugli extra (dentro c'è il CTA link: deve restare
            // nel tab order anche da spento).
            gsap.set(extras, { opacity: 0, y: 18 });
            let tw: gsap.core.Timeline | null = null;
            const play = () => {
              if (!tw) {
                tw = gsap
                  .timeline({ paused: true })
                  .to(split.lines, { yPercent: 0, rotate: 0, duration: 1.1, ease: "dtOut", stagger: 0.09 }, 0)
                  .to(extras, { opacity: 1, y: 0, duration: 0.8, ease: "domus", stagger: 0.08 }, 0.25);
              }
              tw.restart();
            };
            const st = ScrollTrigger.create({
              trigger: runway,
              start: starts[i],
              onEnter: play,
              onLeaveBack: () => tw?.reverse(),
            });
            kills.push(() => {
              st.kill();
              tw?.kill();
              split.revert();
            });
          });
        });

        // Tastiera dentro una pagina pinnata: porta lo scroll al beat in cui
        // quella pagina è composta (pattern di StarReviews/ReviewsWall).
        const composed = [0.44, 0.88];
        const onFocus = (i: number) => () => {
          const st = tl.scrollTrigger;
          if (!st) return;
          const target = st.start + (st.end - st.start) * composed[i];
          if (Math.abs(window.scrollY - target) < 4) return;
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(target, { immediate: true });
          else window.scrollTo({ top: target, behavior: "auto" });
          ScrollTrigger.update();
        };
        const offs = panels.map((panel, i) => {
          const fn = onFocus(i);
          panel.addEventListener("focusin", fn);
          return () => panel.removeEventListener("focusin", fn);
        });

        // La sezione è appena diventata alta 520vh: rimisura i trigger a valle.
        ScrollTrigger.refresh();

        return () => {
          cancelled = true;
          kills.forEach((kill) => kill());
          offs.forEach((off) => off());
          tl.scrollTrigger?.kill();
          tl.kill();
          section.removeAttribute("data-on");
        };
      });
    },
    { scope: sectionRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <section ref={sectionRef} className="dt-paths relative bg-paper">
      <div ref={runwayRef} className="dt-paths_runway">
        <div ref={screenRef} className="dt-paths_screen relative">
          {/* Fondale — il team, pinnato, col titolo gigante (rif. hero "Just
              scroll it"): è la pagina su cui i due percorsi saliranno. */}
          <div className="dt-paths_intro relative flex min-h-[72svh] items-end overflow-hidden lg:min-h-0">
            <div data-paths-intro-img className="absolute inset-0">
              <Image
                src={INTRO_IMG}
                alt={c.introAlt}
                fill
                sizes="100vw"
                quality={75}
                className="photo-warm object-cover"
              />
            </div>
            {/* Scrim caldo per la leggibilità (mai nero pieno: wine/espresso) */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-wine/85 via-espresso/35 to-espresso/15" />
            <Fioritura
              variant="corner-tr"
              palette="dark"
              className="absolute -right-4 -top-6 hidden h-[34vh] w-[15vw] lg:block"
            />
            <div
              data-paths-intro-txt
              className="relative mx-auto w-full max-w-[1240px] px-5 pb-16 pt-28 sm:px-8 lg:pb-[9vh]"
            >
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red-soft">
                {c.eyebrow}
              </span>
              <h2 className="mt-5 max-w-[16ch] font-display text-[clamp(2.3rem,5.6vw,5.4rem)] font-medium leading-[1.02] tracking-[-0.01em] text-cream balance">
                {c.heading}
              </h2>
            </div>
          </div>

          {/* I due percorsi: pagine piene che si alzano dal basso. */}
          {paths.map((p, i) => {
            const t = c.paths[p.id];
            return (
              <article
                key={p.id}
                id={p.id}
                data-paths-panel
                className="dt-paths_panel relative flex min-h-[92svh] items-center overflow-hidden"
              >
                <div data-paths-img className="absolute inset-0">
                  <Image
                    src={p.image}
                    alt={t.alt}
                    fill
                    sizes="100vw"
                    quality={75}
                    className="photo-warm object-cover"
                  />
                </div>
                <div
                  aria-hidden
                  className={`absolute inset-0 ${
                    i === 0
                      ? "bg-gradient-to-r from-wine/85 via-espresso/45 to-espresso/20"
                      : "bg-gradient-to-l from-wine/85 via-espresso/45 to-espresso/20"
                  }`}
                />
                {i === 1 && (
                  <Fioritura
                    variant="corner-br"
                    palette="dark"
                    className="absolute -bottom-6 -right-4 hidden h-[36vh] w-[16vw] lg:block"
                  />
                )}
                {/* Il velo che si posa quando il percorso successivo sale */}
                <div aria-hidden data-paths-veil className="pointer-events-none absolute inset-0 bg-espresso" style={{ opacity: 0 }} />
                <div
                  className={`relative mx-auto flex w-full max-w-[1240px] px-5 py-24 sm:px-8 ${
                    i === 0 ? "justify-start" : "justify-end"
                  }`}
                >
                  <div className="max-w-xl">
                    <p data-paths-el className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red-soft">
                      {t.tag}
                    </p>
                    <h3
                      data-paths-title
                      className="mt-5 font-display text-[clamp(2rem,4.4vw,4rem)] font-medium leading-[1.05] tracking-[-0.01em] text-cream balance"
                    >
                      {t.title}
                    </h3>
                    <p data-paths-el className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-cream/80 sm:text-base">
                      {t.copy}
                    </p>
                    <ul className="mt-8 flex flex-col gap-3.5">
                      {t.points.map((pt) => (
                        <li
                          key={pt}
                          data-paths-point
                          className="flex items-start gap-3 text-[0.95rem] text-cream/90"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream/15 text-cream">
                            <Check className="h-3 w-3" />
                          </span>
                          {pt}
                        </li>
                      ))}
                    </ul>
                    <div data-paths-el className="mt-9">
                      <Cta href={p.href} variant="cta-solid" size="md">
                        {t.cta}
                      </Cta>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
