"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import Atmosphere from "./motion/Atmosphere";
import DrawOnScroll from "./motion/DrawOnScroll";
import { SegnoDomus } from "./BrandMotif";
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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const trackRef = useRef<SVGPathElement | null>(null);
  const threadRef = useRef<SVGPathElement | null>(null);
  const segnoWrapRef = useRef<HTMLDivElement | null>(null);

  // "Il filo rosso del metodo": un filo si cuce in scrub attraverso i nove
  // passaggi — fogli di dossier alternati lungo il tracciato — e alla fine
  // curva verso il centro, dove il Segno Domus si disegna: il percorso
  // diventa casa. Niente contatori, niente numeri protagonisti.
  // - Il tracciato è costruito A RUNTIME dai centri reali dei nodi: regge
  //   breakpoint, cambio lingua e resize senza geometrie hardcodate.
  // - Senza JS il filo non esiste (decorativo): resta la lista completa.
  //   Reduced-motion: filo già cucito per intero, nessuna animazione.
  useGSAP(
    () => {
      const wrap = wrapRef.current;
      const list = listRef.current;
      const svg = svgRef.current;
      const track = trackRef.current;
      const thread = threadRef.current;
      if (!wrap || !list || !svg || !track || !thread) return;

      const items = gsap.utils.toArray<HTMLLIElement>(list.querySelectorAll("li"));
      const nodes = items
        .map((li) => li.querySelector<HTMLElement>("[data-step-node]"))
        .filter((n): n is HTMLElement => n !== null);
      if (!items.length || nodes.length !== items.length) return;

      // Cuce il tracciato per i centri reali dei nodi, con anse alternate
      // dentro il canale centrale; l'ultimo tratto scende verso il Segno.
      const buildPath = () => {
        const wr = wrap.getBoundingClientRect();
        if (!wr.width || !wr.height) return;
        const desktop = window.matchMedia("(min-width: 1024px)").matches;
        const amp = desktop ? 56 : 10;
        const pts = nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return { x: r.left + r.width / 2 - wr.left, y: r.top + r.height / 2 - wr.top };
        });
        let d = `M ${pts[0].x} ${Math.max(0, pts[0].y - 56)} L ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          const dir = i % 2 === 0 ? 1 : -1;
          const dy = b.y - a.y;
          d += ` C ${a.x + amp * dir} ${a.y + dy * 0.3}, ${b.x + amp * dir} ${b.y - dy * 0.3}, ${b.x} ${b.y}`;
        }
        // Chiusura: dal nono passo al Segno (misurato, non stimato).
        const segno = segnoWrapRef.current;
        if (segno) {
          const sr = segno.getBoundingClientRect();
          const end = { x: sr.left + sr.width / 2 - wr.left, y: sr.top - wr.top - 10 };
          const last = pts[pts.length - 1];
          d += ` C ${last.x} ${last.y + (end.y - last.y) * 0.5}, ${end.x} ${last.y + (end.y - last.y) * 0.45}, ${end.x} ${end.y}`;
        }
        svg.setAttribute("viewBox", `0 0 ${wr.width} ${wr.height}`);
        track.setAttribute("d", d);
        thread.setAttribute("d", d);
      };
      buildPath();

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // Filo rosso cucito in scrub lungo tutto il percorso.
        let drawTween: gsap.core.Tween | null = null;
        const makeDraw = () => {
          drawTween?.scrollTrigger?.kill();
          drawTween?.kill();
          const len = thread.getTotalLength() + 2;
          gsap.set(thread, { strokeDasharray: len, strokeDashoffset: len });
          drawTween = gsap.to(thread, {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: { trigger: wrap, start: "top 62%", end: "bottom 72%", scrub: true },
          });
        };
        makeDraw();

        // Il foglio che il filo sta attraversando si "accende" (nodo rosso,
        // foglio dritto): linea di attivazione al 62% del viewport.
        const triggers = items.map((li) =>
          ScrollTrigger.create({
            trigger: li,
            start: "top 62%",
            end: "bottom 62%",
            toggleClass: { targets: li, className: "step-active" },
          })
        );

        // Ingresso dei fogli: ciascuno dal proprio lato, una volta sola
        // (nessun link nei fogli: autoAlpha è sicuro).
        const desktop = () => window.matchMedia("(min-width: 1024px)").matches;
        const enter = gsap.fromTo(
          items,
          {
            y: 26,
            x: (i: number) => (desktop() ? (i % 2 ? 36 : -36) : 0),
            autoAlpha: 0,
          },
          {
            y: 0,
            x: 0,
            autoAlpha: 1,
            duration: dur.short,
            ease: "domus",
            stagger: 0.08,
            clearProps: "opacity,visibility,transform",
            scrollTrigger: { trigger: list, start: "top 80%", once: true },
          }
        );
        const safety = window.setTimeout(() => enter.progress(1), 2500);

        // Resize / cambio lingua / font: si ricuce il tracciato e si
        // ricalibra lo scrub (coalescente, mai nel frame della notifica).
        let raf = 0;
        let firstRo = true;
        const ro = new ResizeObserver(() => {
          if (firstRo) {
            firstRo = false;
            return;
          }
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            buildPath();
            makeDraw();
            ScrollTrigger.refresh();
          });
        });
        ro.observe(wrap);

        return () => {
          window.clearTimeout(safety);
          cancelAnimationFrame(raf);
          ro.disconnect();
          triggers.forEach((t) => t.kill());
          drawTween?.scrollTrigger?.kill();
          drawTween?.kill();
          gsap.set(thread, { clearProps: "strokeDasharray,strokeDashoffset" });
        };
      });
    },
    { scope: rootRef, dependencies: [locale] }
  );

  return (
    <section ref={rootRef} id="metodo" className="relative overflow-hidden bg-cream-deep text-ink">
      {/* Aria: il nome del metodo in filigrana dietro il filo (nome proprio,
          identico in ogni lingua) + bagliori caldi. */}
      <Atmosphere word="Metodo Domus Tua" glow drift={-1} wordClassName="right-[1%] top-[2.5%] text-[8.5vw]" />
      <div className="relative mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
        {/* Header */}
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight balance sm:text-5xl">
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

        {/* Il filo rosso + i fogli del dossier */}
        <div ref={wrapRef} className="relative mt-16 lg:mt-20">
          <svg
            ref={svgRef}
            aria-hidden
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* Traccia di fondo (il percorso che aspetta) + filo rosso (scrub) */}
            <path ref={trackRef} fill="none" stroke="var(--color-line)" strokeWidth="1.5" strokeLinecap="round" />
            <path ref={threadRef} fill="none" stroke="var(--color-red)" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <ol ref={listRef} className="relative flex flex-col gap-9 lg:gap-12">
            {c.steps.map((s, i) => (
              <li
                key={stepNumbers[i]}
                className={`dt-step relative pl-16 lg:w-[calc(50%-4.5rem)] lg:pl-0 ${
                  i % 2 ? "lg:self-end" : "lg:self-start"
                }`}
              >
                {/* Nodo sul filo: il numero è wayfinding (l'ol dà già
                    la numerazione agli screen reader), non protagonista. */}
                <span
                  data-step-node
                  aria-hidden
                  className={`dt-step-node tnum absolute left-0 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper font-display text-[0.7rem] font-semibold text-graphite shadow-[0_6px_16px_-10px_rgba(26,24,22,0.5)] ${
                    i % 2
                      ? "lg:left-auto lg:right-full lg:mr-[4.5rem] lg:translate-x-1/2"
                      : "lg:left-full lg:ml-[4.5rem] lg:-translate-x-1/2"
                  }`}
                >
                  {stepNumbers[i]}
                </span>

                {/* Foglio del dossier: micro-rotazione alternata, si raddrizza
                    quando il filo lo attraversa. */}
                <div
                  data-step-card
                  className={`rounded-2xl border border-line bg-paper p-5 shadow-[0_18px_40px_-30px_rgba(26,24,22,0.4)] transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:p-6 ${
                    i % 2 ? "lg:rotate-[0.4deg]" : "lg:-rotate-[0.4deg]"
                  }`}
                >
                  <h3 className="font-display text-xl font-medium tracking-tight sm:text-[1.35rem]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-stone">{s.copy}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Il filo chiude sul Segno: il percorso diventa casa. */}
          <div ref={segnoWrapRef} className="mt-14 flex justify-center pb-2 lg:mt-16">
            <DrawOnScroll duration={1.2} stagger={0.25}>
              <SegnoDomus className="h-9 w-24" />
            </DrawOnScroll>
          </div>
        </div>
      </div>
    </section>
  );
}
