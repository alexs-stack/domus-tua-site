"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import Atmosphere from "./motion/Atmosphere";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";

// ═══════════════════════════════════════════════════════════════════════════
// IL METODO — riscritto (2026-08-04) sulla grammatica di codrops/
// OnScrollFilter: il filo rosso lascia il posto a tre ATTI. Ogni atto ha un
// titolo in due metà che si separano in scrub (la variante senza Flip del
// riferimento: niente re-parenting dentro React) e una foto reale che si
// rivela dentro una maschera circolare filtrata feTurbulence +
// feDisplacementMap — il bordo del cerchio che cresce è organico, come
// inchiostro che si allarga sulla carta. I nove passaggi restano tutti,
// tre fogli di dossier per atto.
// Reduced-motion / no-JS: la maschera nasce già aperta (r = finale nel
// markup), i titoli fermi al loro posto — sezione completa e statica.
// Lo stato "chiuso" (r=0) esiste SOLO via JS sotto motionOk.
// ═══════════════════════════════════════════════════════════════════════════

const copy = {
  it: {
    eyebrow: "Il Metodo Domus Tua",
    title: "Un percorso chiaro, dalla prima stima alla firma.",
    subcopy:
      "Ogni vendita e ogni acquisto seguono nove passaggi precisi: niente improvvisazione, solo un metodo costruito in oltre quindici anni di lavoro sul territorio.",
    cta: "Inizia dal tuo immobile",
    acts: [
      { up: "Prima,", down: "le persone", alt: "Raffaela Rizza, fondatrice di Domus Tua, in ascolto" },
      { up: "Poi,", down: "il racconto", alt: "Il racconto video di una villa seguita da Domus Tua" },
      { up: "Infine,", down: "la firma", alt: "La stretta di mano che chiude una compravendita seguita da Domus Tua" },
    ],
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
    acts: [
      { up: "First,", down: "the people", alt: "Raffaela Rizza, founder of Domus Tua, listening" },
      { up: "Then,", down: "the story", alt: "The video story of a villa listed by Domus Tua" },
      { up: "Finally,", down: "the signing", alt: "The handshake closing a sale assisted by Domus Tua" },
    ],
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
    acts: [
      { up: "D'abord,", down: "les personnes", alt: "Raffaela Rizza, fondatrice de Domus Tua, à l'écoute" },
      { up: "Puis,", down: "le récit", alt: "Le récit vidéo d'une villa proposée par Domus Tua" },
      { up: "Enfin,", down: "la signature", alt: "La poignée de main qui conclut une vente accompagnée par Domus Tua" },
    ],
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
    acts: [
      { up: "Zuerst", down: "die Menschen", alt: "Raffaela Rizza, Gründerin von Domus Tua, beim Zuhören" },
      { up: "Dann", down: "die Geschichte", alt: "Die Video-Geschichte einer Villa im Angebot von Domus Tua" },
      { up: "Zuletzt", down: "die Unterschrift", alt: "Der Handschlag zum Abschluss eines von Domus Tua begleiteten Verkaufs" },
    ],
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
    acts: [
      { up: "Primero,", down: "las personas", alt: "Raffaela Rizza, fundadora de Domus Tua, escuchando" },
      { up: "Luego,", down: "el relato", alt: "El relato en vídeo de una villa ofrecida por Domus Tua" },
      { up: "Al final,", down: "la firma", alt: "El apretón de manos que cierra una compraventa acompañada por Domus Tua" },
    ],
    steps: [
      { title: "Primera escucha", copy: "Partimos de ti: objetivos, plazos, expectativas. Antes que las casas están las personas." },
      { title: "Valoración", copy: "Análisis del mercado local y de tu inmueble para definir valor y estrategia, sin ilusiones." },
      { title: "Verificación documental", copy: "Títulos, conformidad y documentos comprobados antes de empezar: se llega a la firma sin sorpresas." },
      { title: "Preparación del inmueble", copy: "Valorizamos los espacios con consejos específicos y, cuando hace falta, home staging." },
      { title: "Relato visual", copy: "Fotos, vídeos emotivos y renders: la casa contada con el cuidado que merece." },
      { title: "Marketing y anticipo social", copy: "Campañas multicanal y anticipos en redes para presentarla ante las personas adecuadas." },
      { title: "Open Domus y visitas cualificadas", copy: "Visitas ordenadas y el evento Open Domus para compradores realmente interesados." },
      { title: "Propuesta y negociación", copy: "Gestionamos propuestas y negociación con transparencia, protegiendo tus intereses." },
      { title: "Escritura", copy: "Te acompañamos paso a paso hasta la firma, con asistencia completa." },
    ],
  },
} as const;

const stepNumbers = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const;

/* Gli atti: foto reale + parametri del filtro di dissolvenza (variati per
   atto come nelle sette varianti del riferimento) + geometria del viewBox. */
const ACTS = [
  {
    img: "/images/reali/raffaela-ritratto.jpg",
    vw: 900,
    vh: 1080,
    freq: 0.03,
    oct: 3,
    scale: 60,
  },
  {
    img: "/images/reali/video-villa-mozart.jpg",
    vw: 1280,
    vh: 880,
    freq: 0.012,
    oct: 3,
    scale: 110,
  },
  {
    img: "/images/reali/handshake.jpg",
    vw: 1280,
    vh: 880,
    freq: 0.09,
    oct: 1,
    scale: 45,
  },
] as const;

const coverR = (w: number, h: number) => Math.ceil(Math.hypot(w / 2, h / 2)) + 40;

export default function Method() {
  const { locale } = useLocale();
  const c = copy[locale];
  const rootRef = useRef<HTMLElement | null>(null);
  const segnoWrapRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const acts = gsap.utils.toArray<HTMLElement>("[data-met-act]", root);
        const cleanups: Array<() => void> = [];

        acts.forEach((act) => {
          const mask = act.querySelector<SVGCircleElement>("[data-met-mask]");
          const image = act.querySelector<SVGImageElement>("[data-met-img]");
          const up = act.querySelector<HTMLElement>("[data-met-up]");
          const down = act.querySelector<HTMLElement>("[data-met-down]");
          const cards = gsap.utils.toArray<HTMLElement>("[data-met-card]", act);
          if (!mask || !image) return;

          const rFinal = Number(mask.dataset.rFinal || 0);

          // L'apertura del riferimento, in scrub: il cerchio filtrato cresce,
          // la foto si posa (scala e flash che rientrano), le due metà del
          // titolo si separano dal centro comune verso i loro binari.
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: act,
              start: "clamp(top 82%)",
              end: "+=48%",
              scrub: true,
            },
          });
          tl.fromTo(mask, { attr: { r: 0 } }, { attr: { r: rFinal } }, 0)
            .fromTo(
              image,
              { scale: 1.26, transformOrigin: "50% 50%", filter: "brightness(1.3) saturate(1.12)" },
              { scale: 1, filter: "brightness(1) saturate(1)" },
              0
            );
          if (up && down) {
            tl.fromTo(up, { xPercent: 16, yPercent: 52 }, { xPercent: 0, yPercent: 0 }, 0).fromTo(
              down,
              { xPercent: -10, yPercent: -52 },
              { xPercent: 0, yPercent: 0 },
              0
            );
          }

          // I fogli del dossier: cascata al passaggio, replay direzionale
          // (niente clearProps: romperebbe restart/reverse).
          if (cards.length) {
            const enter = gsap.fromTo(
              cards,
              { y: 26, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: dur.short,
                ease: "domus",
                stagger: 0.1,
                scrollTrigger: { trigger: act, start: "top 70%", toggleActions: "restart none none reverse" },
              }
            );
            const safety = window.setTimeout(() => enter.progress(1), 2500);
            const onFocus = () => enter.progress(1);
            act.addEventListener("focusin", onFocus, { once: true });
            cleanups.push(() => {
              window.clearTimeout(safety);
              act.removeEventListener("focusin", onFocus);
            });
          }
        });

        // Il Segno in chiusura: il cuore non è più cucito dal filo — appare
        // con la stessa lingua degli atti, un'apertura turbolenta ma piccola,
        // come un timbro di ceralacca. Replay a ogni passaggio.
        const segno = segnoWrapRef.current;
        const segnoMask = segno?.querySelector<SVGCircleElement>("[data-met-segno-mask]");
        if (segno && segnoMask) {
          const rFinal = Number(segnoMask.dataset.rFinal || 0);
          gsap.set(segnoMask, { attr: { r: 0 } });
          gsap.to(segnoMask, {
            attr: { r: rFinal },
            duration: 1.1,
            ease: "domus.inOut",
            scrollTrigger: {
              trigger: segno,
              start: "top 82%",
              toggleActions: "restart none none reverse",
            },
          });
        }

        // Tween e trigger creati nel context vengono revertiti da useGSAP;
        // qui restano solo timer e listener raccolti sopra.
        return () => {
          cleanups.forEach((fn) => fn());
        };
      });
    },
    { scope: rootRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <section ref={rootRef} id="metodo" className="relative overflow-hidden bg-cream-deep text-ink">
      {/* Aria: il nome del metodo in filigrana + bagliori caldi. */}
      <Atmosphere word="Metodo Domus Tua" glow drift={-1} wordClassName="right-[1%] top-[2.5%] text-[8.5vw]" />
      <div className="relative mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        {/* Header */}
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight balance sm:text-5xl">
            {c.title}
          </h2>
          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-stone">{c.subcopy}</p>
          <Cta href="#contatti" variant="cta" size="md" className="mt-8">
            {c.cta}
          </Cta>
        </Reveal>

        {/* I tre atti del metodo */}
        <div className="mt-20 flex flex-col gap-24 lg:mt-28 lg:gap-36">
          {ACTS.map((a, i) => {
            const act = c.acts[i];
            const rf = coverR(a.vw, a.vh);
            const reversed = i % 2 === 1;
            return (
              <div key={act.up} data-met-act className="relative">
                {/* Il titolo in due metà: si separano in scrub mentre la foto
                    si apre — la variante React del Flip del riferimento. */}
                <h3 className="relative z-10 font-display font-medium leading-[0.98] tracking-[-0.01em]">
                  <span
                    data-met-up
                    className={`block text-[clamp(2.4rem,6vw,5.4rem)] ${reversed ? "lg:ml-[30%]" : ""}`}
                  >
                    {act.up}
                  </span>
                  <span
                    data-met-down
                    className={`block text-[clamp(2.4rem,6vw,5.4rem)] text-red ${
                      reversed ? "lg:ml-[12%]" : "lg:ml-[22%]"
                    }`}
                  >
                    {act.down}
                  </span>
                </h3>

                <div
                  className={`mt-6 grid gap-10 lg:mt-2 lg:grid-cols-[minmax(0,52fr)_minmax(0,48fr)] lg:items-center lg:gap-16 ${
                    reversed ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  {/* La foto dentro la maschera turbolenta (rif. OnScrollFilter:
                      feTurbulence + feDisplacementMap sul cerchio della mask).
                      r parte GIÀ al valore finale: senza JS / reduced-motion la
                      foto è intera; lo stato chiuso esiste solo via GSAP. */}
                  <svg
                    viewBox={`0 0 ${a.vw} ${a.vh}`}
                    className={`h-auto w-full ${reversed ? "lg:col-start-2" : ""}`}
                    role="img"
                    aria-label={act.alt}
                  >
                    <defs>
                      <filter id={`dt-met-f${i}`}>
                        <feTurbulence type="fractalNoise" baseFrequency={a.freq} numOctaves={a.oct} result="noise" />
                        <feDisplacementMap
                          in="SourceGraphic"
                          in2="noise"
                          scale={a.scale}
                          xChannelSelector="R"
                          yChannelSelector="G"
                        />
                      </filter>
                      <mask id={`dt-met-m${i}`}>
                        <circle
                          data-met-mask
                          data-r-final={rf}
                          cx="50%"
                          cy="50%"
                          r={rf}
                          fill="white"
                          style={{ filter: `url(#dt-met-f${i})` }}
                        />
                      </mask>
                    </defs>
                    <image
                      data-met-img
                      href={a.img}
                      width={a.vw}
                      height={a.vh}
                      mask={`url(#dt-met-m${i})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </svg>

                  {/* I tre fogli del dossier dell'atto */}
                  <ol className={`flex flex-col gap-6 ${reversed ? "lg:col-start-1 lg:row-start-1" : ""}`} start={i * 3 + 1}>
                    {c.steps.slice(i * 3, i * 3 + 3).map((s, j) => (
                      <li key={s.title}>
                        <div
                          data-met-card
                          className={`rounded-2xl border border-line bg-paper p-5 shadow-[0_18px_40px_-30px_rgba(26,24,22,0.4)] sm:p-6 ${
                            j % 2 ? "lg:-rotate-[0.35deg]" : "lg:rotate-[0.35deg]"
                          }`}
                        >
                          <p aria-hidden className="tnum font-display text-[0.72rem] font-semibold tracking-[0.18em] text-red">
                            {stepNumbers[i * 3 + j]}
                          </p>
                          <h4 className="mt-1.5 font-display text-xl font-medium tracking-tight sm:text-[1.3rem]">
                            {s.title}
                          </h4>
                          <p className="mt-2 text-[0.95rem] leading-relaxed text-stone">{s.copy}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>

        {/* Il Segno in chiusura: il cuore appare con la stessa apertura
            turbolenta degli atti — il percorso diventa casa. Senza JS /
            reduced-motion: già completo. */}
        <div ref={segnoWrapRef} className="mt-20 flex justify-center pb-2 lg:mt-24">
          <svg viewBox="0 0 64 60" fill="none" aria-hidden className="h-14 w-14 text-red">
            <defs>
              <filter id="dt-met-fh">
                <feTurbulence type="fractalNoise" baseFrequency="0.14" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="14" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <mask id="dt-met-mh">
                <circle
                  data-met-segno-mask
                  data-r-final="48"
                  cx="32"
                  cy="30"
                  r="48"
                  fill="white"
                  style={{ filter: "url(#dt-met-fh)" }}
                />
              </mask>
            </defs>
            <path
              d="M32 14 C 26 3, 10 2, 6 13 C 2 24, 12 36, 32 52 C 52 36, 62 24, 58 13 C 54 2, 38 3, 32 14 Z"
              mask="url(#dt-met-mh)"
              fill="var(--color-red)"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
