"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import { ArrowUpRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, ScrollTrigger, useGSAP, MQ, dur } from "../lib/motion/gsap";

const copy = {
  it: {
    eyebrow: "Il Metodo Domus Tua",
    title: "Un percorso chiaro, dalla prima stima alla firma.",
    subcopy:
      "Ogni vendita e ogni acquisto seguono nove passaggi precisi: niente improvvisazione, solo un metodo costruito in oltre quindici anni di lavoro sul territorio.",
    cta: "Inizia dal tuo immobile",
    steps: [
      { title: "Primo ascolto", copy: "Partiamo da te: obiettivi, tempi, aspettative. Prima delle case vengono le persone." },
      { title: "Valutazione", copy: "Analisi del mercato locale e del tuo immobile per definire valore e strategia, senza illusioni." },
      { title: "Verifica documentale", copy: "Titoli, conformità e documenti controllati prima di partire: si arriva alla firma senza sorprese." },
      { title: "Preparazione immobile", copy: "Valorizziamo gli spazi con consigli mirati e, dove serve, home staging." },
      { title: "Racconto visivo", copy: "Foto, video emozionali e rendering: la casa raccontata con la cura che merita." },
      { title: "Marketing e social preview", copy: "Campagne multicanale e anteprime social per portarla davanti alle persone giuste." },
      { title: "Open Domus e visite qualificate", copy: "Visite ordinate e l'evento Open Domus per acquirenti realmente interessati." },
      { title: "Proposta e trattativa", copy: "Gestiamo proposte e negoziazione con trasparenza, tutelando i tuoi interessi." },
      { title: "Rogito", copy: "Ti accompagniamo passo dopo passo fino alla firma, con assistenza completa." },
    ],
  },
  en: {
    eyebrow: "The Domus Tua Method",
    title: "A clear journey, from the first estimate to signing.",
    subcopy:
      "Every sale and every purchase follows nine precise steps: no improvisation, only a method built over more than fifteen years of work in the local area.",
    cta: "Start with your property",
    steps: [
      { title: "First, we listen", copy: "We start with you: goals, timing, expectations. People come before homes." },
      { title: "Valuation", copy: "Analysis of the local market and your property to define value and strategy, without illusions." },
      { title: "Document check", copy: "Titles, compliance and documents verified before we begin: we reach the signing without surprises." },
      { title: "Property preparation", copy: "We enhance your spaces with targeted advice and, where needed, home staging." },
      { title: "Visual storytelling", copy: "Photos, emotional videos and renderings: the home told with the care it deserves." },
      { title: "Marketing and social preview", copy: "Multichannel campaigns and social previews to bring it in front of the right people." },
      { title: "Open Domus and qualified viewings", copy: "Orderly viewings and the Open Domus event for genuinely interested buyers." },
      { title: "Offer and negotiation", copy: "We handle offers and negotiation with transparency, protecting your interests." },
      { title: "Deed of sale", copy: "We accompany you step by step all the way to signing, with complete assistance." },
    ],
  },
  fr: {
    eyebrow: "La Méthode Domus Tua",
    title: "Un parcours clair, de la première estimation à la signature.",
    subcopy:
      "Chaque vente et chaque achat suivent neuf étapes précises : aucune improvisation, seulement une méthode construite en plus de quinze ans de travail sur le territoire.",
    cta: "Commencez par votre bien",
    steps: [
      { title: "Première écoute", copy: "Nous partons de vous : objectifs, délais, attentes. Avant les maisons viennent les personnes." },
      { title: "Estimation", copy: "Analyse du marché local et de votre bien pour définir valeur et stratégie, sans illusions." },
      { title: "Vérification documentaire", copy: "Titres, conformité et documents contrôlés avant de commencer : on arrive à la signature sans surprises." },
      { title: "Préparation du bien", copy: "Nous valorisons les espaces avec des conseils ciblés et, si nécessaire, du home staging." },
      { title: "Récit visuel", copy: "Photos, vidéos émotionnelles et rendus : la maison racontée avec le soin qu'elle mérite." },
      { title: "Marketing et aperçu social", copy: "Campagnes multicanales et aperçus sur les réseaux pour la présenter aux bonnes personnes." },
      { title: "Open Domus et visites qualifiées", copy: "Des visites ordonnées et l'événement Open Domus pour des acheteurs réellement intéressés." },
      { title: "Offre et négociation", copy: "Nous gérons offres et négociation en toute transparence, en protégeant vos intérêts." },
      { title: "Acte de vente", copy: "Nous vous accompagnons pas à pas jusqu'à la signature, avec une assistance complète." },
    ],
  },
  de: {
    eyebrow: "Die Domus Tua Methode",
    title: "Ein klarer Weg, von der ersten Schätzung bis zur Unterschrift.",
    subcopy:
      "Jeder Verkauf und jeder Kauf folgt neun präzisen Schritten: keine Improvisation, nur eine Methode, die in über fünfzehn Jahren Arbeit vor Ort gewachsen ist.",
    cta: "Beginnen Sie mit Ihrer Immobilie",
    steps: [
      { title: "Erstes Zuhören", copy: "Wir beginnen bei Ihnen: Ziele, Zeitrahmen, Erwartungen. Vor den Häusern kommen die Menschen." },
      { title: "Bewertung", copy: "Analyse des lokalen Marktes und Ihrer Immobilie, um Wert und Strategie festzulegen, ohne Illusionen." },
      { title: "Dokumentenprüfung", copy: "Titel, Konformität und Unterlagen werden vorab geprüft: So kommt man ohne Überraschungen zur Unterschrift." },
      { title: "Vorbereitung der Immobilie", copy: "Wir werten die Räume mit gezielten Ratschlägen und, wo nötig, Home Staging auf." },
      { title: "Visuelles Storytelling", copy: "Fotos, emotionale Videos und Renderings: das Zuhause erzählt mit der Sorgfalt, die es verdient." },
      { title: "Marketing und Social-Vorschau", copy: "Multikanal-Kampagnen und Social-Vorschauen, um sie den richtigen Menschen zu zeigen." },
      { title: "Open Domus und qualifizierte Besichtigungen", copy: "Geordnete Besichtigungen und das Event Open Domus für wirklich interessierte Käufer." },
      { title: "Angebot und Verhandlung", copy: "Wir führen Angebote und Verhandlungen transparent und schützen Ihre Interessen." },
      { title: "Kaufvertrag", copy: "Wir begleiten Sie Schritt für Schritt bis zur Unterschrift, mit umfassender Betreuung." },
    ],
  },
  es: {
    eyebrow: "El Método Domus Tua",
    title: "Un recorrido claro, desde la primera tasación hasta la firma.",
    subcopy:
      "Cada venta y cada compra siguen nueve pasos precisos: nada de improvisación, solo un método construido en más de quince años de trabajo en el territorio.",
    cta: "Empieza por tu inmueble",
    steps: [
      { title: "Primera escucha", copy: "Partimos de ti: objetivos, plazos, expectativas. Antes que las casas están las personas." },
      { title: "Valoración", copy: "Análisis del mercado local y de tu inmueble para definir valor y estrategia, sin ilusiones." },
      { title: "Verificación documental", copy: "Títulos, conformidad y documentos comprobados antes de empezar: se llega a la firma sin sorpresas." },
      { title: "Preparación del inmueble", copy: "Valorizamos los espacios con consejos específicos y, cuando hace falta, home staging." },
      { title: "Relato visual", copy: "Fotos, vídeos emotivos y renders: la casa contada con el cuidado que merece." },
      { title: "Marketing y anticipo social", copy: "Campañas multicanal y anticipos en redes para presentarla ante las personas adecuadas." },
      { title: "Open Domus y visitas cualificadas", copy: "Visitas ordenadas y el evento Open Domus para compradores realmente interesados." },
      { title: "Escritura", copy: "Te acompañamos paso a paso hasta la firma, con asistencia completa." },
    ],
  },
} as const;

const stepNumbers = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const;

export default function Method() {
  const { locale } = useLocale();
  const c = copy[locale];
  const rootRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLOListElement | null>(null);
  const spineFillRef = useRef<HTMLSpanElement | null>(null);
  const progressFillRef = useRef<HTMLSpanElement | null>(null);
  const rollRef = useRef<HTMLSpanElement | null>(null);

  // Due regimi (il markup è UNO solo, verticale di default → SSR/no-JS/
  // reduced-motion vedono sempre la lista completa):
  // - Mobile/tablet + motion ok: spina verticale che si riempie in scrub,
  //   passo attivo via toggleClass, ingressi sobri per riga.
  // - Desktop + motion ok: la classe .dt-method-h (vedi globals.css) rimonta
  //   il layout in orizzontale e la sezione si PINNA: i nove passi scorrono
  //   in scrub, la linea di progresso si riempie, il contatore gigante 01→09
  //   ruota a rullo, i titoli salgono dalle maschere (containerAnimation).
  //   Lo sticky della vecchia intro non serve più: il pin fa il lavoro.
  useGSAP(
    () => {
      const root = rootRef.current;
      const list = listRef.current;
      if (!root || !list) return;
      const mm = gsap.matchMedia();

      // ── Verticale (mobile/tablet) ─────────────────────────────────────
      mm.add(`${MQ.motionOk} and (max-width: 1023.98px)`, () => {
        const triggers: ScrollTrigger[] = [];

        if (spineFillRef.current) {
          gsap.fromTo(
            spineFillRef.current,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: { trigger: list, start: "top 62%", end: "bottom 55%", scrub: true },
            }
          );
        }

        const items = gsap.utils.toArray<HTMLLIElement>(list.querySelectorAll("li"));
        items.forEach((li) => {
          const row = li.querySelector<HTMLElement>(".dt-step-row") ?? li;
          triggers.push(
            ScrollTrigger.create({
              trigger: li,
              // La linea al 62% del viewport partiziona la lista: un solo
              // passo attivo alla volta.
              start: "top 62%",
              end: "bottom 62%",
              toggleClass: { targets: row, className: "step-active" },
            })
          );
        });

        // Ingresso sobrio per riga (via il blur paint-heavy di Reveal).
        const enter = gsap.fromTo(
          items,
          { y: 22, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: dur.short,
            ease: "domus",
            stagger: 0.07,
            clearProps: "all",
            scrollTrigger: { trigger: list, start: "top 82%", once: true },
          }
        );
        const safety = window.setTimeout(() => enter.progress(1), 2500);

        return () => {
          window.clearTimeout(safety);
          triggers.forEach((t) => t.kill());
        };
      });

      // ── Orizzontale pinnato (desktop) ─────────────────────────────────
      mm.add(`${MQ.motionOk} and (min-width: 1024px)`, () => {
        const wrap = wrapRef.current;
        const roll = rollRef.current;
        if (!wrap) return;

        root.classList.add("dt-method-h");
        const items = gsap.utils.toArray<HTMLLIElement>(list.querySelectorAll("li"));
        const titles = gsap.utils.toArray<HTMLElement>(list.querySelectorAll("[data-step-title]"));
        const dist = () => Math.max(0, list.scrollWidth - wrap.clientWidth);

        gsap.set(titles, { yPercent: 110 });

        let index = -1;
        const setActive = (next: number) => {
          if (next === index) return;
          index = next;
          items.forEach((li, j) => {
            li.querySelector(".dt-step-row")?.classList.toggle("step-active", j === index);
          });
          if (roll) gsap.to(roll, { y: `${-index}em`, duration: 0.5, ease: "domus" });
        };

        const tween = gsap.to(list, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${dist() + window.innerHeight * 0.25}`,
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate(self) {
              if (progressFillRef.current) {
                gsap.set(progressFillRef.current, { scaleX: self.progress });
              }
              setActive(Math.round(self.progress * (items.length - 1)));
            },
          },
        });
        setActive(0);

        // Titoli in maschera: entrano quando il pannello attraversa la scena.
        const titleTriggers = titles.map((t, i) =>
          ScrollTrigger.create({
            trigger: items[i],
            containerAnimation: tween,
            start: "left 88%",
            once: true,
            onEnter: () => gsap.to(t, { yPercent: 0, duration: 0.7, ease: "domus" }),
          })
        );
        // Safety: se i trigger non scattano (resize strani), tutto visibile.
        const safety = window.setTimeout(
          () => titles.forEach((t) => gsap.set(t, { yPercent: 0 })),
          4000
        );

        return () => {
          window.clearTimeout(safety);
          titleTriggers.forEach((t) => t.kill());
          root.classList.remove("dt-method-h");
          items.forEach((li) => li.querySelector(".dt-step-row")?.classList.remove("step-active"));
        };
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} id="metodo" className="relative overflow-hidden bg-cream-deep text-ink">
      <div
        data-method-pin
        className="mx-auto flex w-full max-w-[1240px] flex-col justify-center px-5 py-24 sm:px-8 sm:py-32"
      >
        {/* Header: intro + contatore gigante a rullo (solo layout orizzontale) */}
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
              <h2 className="mt-5 max-w-2xl font-display text-4xl font-medium leading-[1.05] tracking-tight balance sm:text-5xl">
                {c.title}
              </h2>
              <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-stone">{c.subcopy}</p>
              <a
                href="#contatti"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                {c.cta}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            </Reveal>
          </div>

          {/* Contatore a rullo: esiste solo nel layout orizzontale (aria-hidden,
              i numeri veri sono nei passi). */}
          <div data-method-counter aria-hidden className="tnum hidden items-baseline gap-2 font-display">
            <span className="block h-[1em] overflow-hidden text-[5.5rem] font-medium leading-none text-red">
              <span ref={rollRef} className="block will-change-transform">
                {stepNumbers.map((n) => (
                  <span key={n} className="block h-[1em] leading-none">
                    {n}
                  </span>
                ))}
              </span>
            </span>
            <span className="text-2xl text-stone">/ {stepNumbers[stepNumbers.length - 1]}</span>
          </div>
        </div>

        {/* Track dei passi: colonna con spina (default) / riga pinnata (desktop) */}
        <div ref={wrapRef} className="relative mt-12 lg:mt-16">
          <span aria-hidden data-method-spine className="absolute bottom-2 left-0 top-2 w-px bg-line">
            <span
              ref={spineFillRef}
              className="absolute inset-0 origin-top scale-y-0 bg-red will-change-transform"
            />
          </span>
          <ol ref={listRef} data-method-track className="flex flex-col pl-7 sm:pl-9">
            {c.steps.map((s, i) => (
              <li key={stepNumbers[i]}>
                <div className="group dt-step-row flex gap-6 border-t border-line py-7 transition-colors duration-500 hover:border-red/30">
                  <span className="dt-step-num font-display text-2xl font-medium text-graphite transition-colors duration-500 group-hover:text-red sm:text-3xl">
                    {stepNumbers[i]}
                  </span>
                  <div className="flex-1">
                    <h3 className="overflow-hidden font-display text-xl font-medium tracking-tight sm:text-2xl">
                      <span data-step-title className="block">
                        {s.title}
                      </span>
                    </h3>
                    <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-stone">
                      {s.copy}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Linea di progresso orizzontale (solo layout orizzontale) */}
          <div data-method-progress aria-hidden className="mt-10 hidden h-px w-full bg-line">
            <span
              ref={progressFillRef}
              className="block h-full origin-left scale-x-0 bg-red will-change-transform"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
