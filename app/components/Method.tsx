"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import Atmosphere from "./motion/Atmosphere";
import CharFlip from "./motion/CharFlip";
import TextLines from "./motion/TextLines";
import Fioritura from "./motion/Fioritura";
import { Cta } from "./primitives/Cta";
import { Play } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { MARK_D, MARK_RED_D, MARK_VIEWBOX } from "./MarkDomus";
import { site } from "../lib/site";
import { youtubeWatch } from "../lib/videos";
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
//
// 2026-08-06 — I PANNELLI. Il cliente ha bocciato proprio questo tratto:
// «scritte grandi, immagini grandi». Le foto stavano in mezza colonna dentro
// un max-w-6xl, cioè ~590px su un monitor da 1920. Adesso gli atti che se lo
// possono permettere diventano PANNELLI larghi (uno a piena larghezza di
// viewport) con il titolo in overlay su un velo.
// La maschera turbolenta NON si tocca: è la cosa più bella della sezione e
// vale più della larghezza. È solo salita di un livello — l'SVG del pannello
// la porta identica, con `preserveAspectRatio="slice"` a fare il ritaglio.
//
// LA LARGHEZZA LA DECIDE IL SORGENTE, NON IL DESIDERIO. Misurati gli header
// dei JPG in public/images/reali (2026-08-06):
//   · raffaela-ritratto.jpg  763×442   → RITAGLIATA il 2026-08-06: l'originale
//     era 765×560 con 39px di bianco puro in alto e 77 in basso, cotti nel
//     file. Nel frame verticale in `slice` quelle fasce diventavano una
//     LASTRA BIANCA di 532×639 con i bordi dritti sulla crema (misurato
//     ΔRGB 78, tre volte la soglia): esattamente «il taglio» che la cliente
//     ha chiesto di togliere, solo dentro una sezione invece che su un
//     confine. Non era una scelta di inquadratura, era imballaggio.
//     Anche così resta in colonna: 763px di sorgente non reggono il pannello.
//   · video-villa-mozart.jpg 1280×505  → anche qui l'originale (1280×720)
//     portava cotta dentro la titolazione della copertina YouTube: tolta dal
//     FILE il 2026-08-06, perché lo stesso scatto lo usa anche la rotaia di
//     Servizi. In un pannello a piena colonna (~1088px) resta sotto 1:1.
//   · handshake.jpg          1920×1087 → regge il full-bleed su un 1920
//     esattamente a 1:1: è la chiusa cinematografica della sezione.
// ═══════════════════════════════════════════════════════════════════════════

const copy = {
  it: {
    eyebrow: "Il Metodo Domus Tua",
    title: "Un percorso chiaro, dalla prima stima alla firma.",
    subcopy:
      "Ogni vendita e ogni acquisto seguono nove passaggi precisi: niente improvvisazione, solo un metodo costruito in oltre quindici anni di lavoro sul territorio.",
    cta: "Inizia dal tuo immobile",
    actVideo: "Guarda la video recensione",
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
    actVideo: "Watch the video review",
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
    actVideo: "Voir l’avis en vidéo",
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
    actVideo: "Video-Bewertung ansehen",
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
    actVideo: "Ver la reseña en vídeo",
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
   atto come nelle sette varianti del riferimento) + geometria del viewBox.
   `bleed` è la LARGHEZZA CONCESSA, e la detta la risoluzione del sorgente
   (vedi la nota in testa al file):
     none   → resta nella griglia a due colonne, foto invariata;
     column → pannello a piena larghezza della colonna editoriale;
     screen → pannello full-bleed, largo quanto il viewport. */
const ACTS = [
  {
    img: "/images/reali/raffaela-ritratto.jpg",
    /** Id YouTube quando la foto è la copertina di un video (vedi atto 3). */
    video: null,
    vw: 900,
    vh: 1080,
    vy: 0,
    vbh: 1080,
    freq: 0.03,
    oct: 3,
    scale: 60,
    bleed: "none",
  },
  {
    // La titolazione incisa nella copertina YouTube («VILLA IN VENDITA A
    // TRADATE…») non c'è più: il 2026-08-06 è stata tolta DAL FILE, non solo
    // da questa inquadratura. Prima il viewBox partiva a y=215 per nasconderla
    // qui, ma lo stesso file è usato anche dalla rotaia di Servizi, dove la
    // scritta restava in bella vista su una lastra grande. Un ritaglio che
    // vale in un posto solo non è un ritaglio, è una pezza.
    img: "/images/reali/video-villa-mozart.jpg",
    video: null,
    vw: 1280,
    vh: 505,
    vy: 0,
    vbh: 505,
    freq: 0.012,
    oct: 3,
    scale: 110,
    bleed: "column",
  },
  {
    // Il viewBox passa da 1280 a 1920 di larghezza: frequenza e spostamento
    // del filtro sono in user space, quindi vanno RISCALATI o la grana del
    // bordo d'inchiostro cambia. 0.09×1280/1920 = 0.06 e 45×1920/1280 = 68:
    // stesso bordo di prima, su una tela più grande.
    img: "/images/reali/handshake.jpg",
    // La copertina della video recensione "Felicemente venduta": il pannello
    // porta al video vero, così il player cotto nella foto dice la verità.
    video: site.videos.reviews[0].id,
    vw: 1920,
    vh: 1087,
    vy: 0,
    vbh: 1087,
    freq: 0.06,
    oct: 1,
    scale: 68,
    bleed: "screen",
  },
] as const;

const coverR = (w: number, h: number) => Math.ceil(Math.hypot(w / 2, h / 2)) + 40;

/* Le due metà d'atto: la misura del riferimento (era-residence §2) portata da
   6vw a 6.4vw e con un tetto molto più alto — a 1920 il titolo passa da 115px
   a 123px, a 3440 da 86px (era già al massimo) a 240px. */
const HALF = "text-[clamp(2.2rem,5vw,5.4rem)]";

/* IL VELO DEI PANNELLI. Sta in HTML e non dentro la maschera SVG di
   proposito: la maschera parte CHIUSA, e un velo che si aprisse insieme alla
   foto lascerebbe il titolo in overlay illeggibile (crema su crema) per mezza
   schermata di scroll. Così invece il titolo si legge in tutti e due gli
   stati — velo sulla carta prima, velo sulla foto dopo.
   La sfumatura verticale non è un vezzo: la home ha UNA superficie continua
   (SurfaceFlow) e una fascia scura che comincia di netto è esattamente «il
   taglio» che abbiamo appena tolto. Qui i bordi alto e basso svaniscono, e
   quello che resta è una foto con la sua ombra, non un fondale.
   DUE RAMPE E NON UNA, perché il titolo occupa una frazione diversa del
   pannello: sul full-bleed sta dentro il primo terzo e vale la rampa del
   brief (transparent al 62%), sul pannello a piena colonna arriva a metà
   larghezza e con quella rampa la coda della seconda metà cadeva sul prato
   illuminato a 1.9:1 — misurato. Lì la protezione si allunga fino all'82%.
   Il velo NON serve a scurire la foto: serve a reggere il testo, e finisce
   dove il testo finisce. */
const VELO_MASK = "linear-gradient(180deg, transparent 0%, #000 9%, #000 91%, transparent 100%)";
const VELO_RAMP = {
  column: "linear-gradient(90deg, rgba(28,21,18,.76) 0%, rgba(28,21,18,.58) 48%, transparent 82%)",
  screen: "linear-gradient(90deg, rgba(28,21,18,.72), transparent 62%)",
} as const;
const veloStyle = (bleed: "column" | "screen") =>
  ({
    background: VELO_RAMP[bleed],
    maskImage: VELO_MASK,
    WebkitMaskImage: VELO_MASK,
  }) as const;

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
    <section ref={rootRef} id="metodo" data-tone="cream-deep" className="relative overflow-hidden bg-cream-deep text-ink">
      {/* Aria: il nome del metodo in filigrana + bagliori caldi. */}
      <Atmosphere word="Metodo Domus Tua" glow drift={-1} wordClassName="right-[1%] top-[2.5%] text-[8.5vw]" />
      {/* Respiro ASIMMETRICO: sopra quello di sempre, sotto meno della metà.
          Tolta la cucitura fra Metodo e Open Domus (vedi page.tsx), quello che
          restava a separare i due capitoli erano solo due padding pieni: il
          monogramma di chiusura finiva a mezzo schermo dal capitolo dopo. */}
      <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-24 sm:px-8 sm:pb-16 sm:pt-32">
        {/* Header — testa di capitolo.
            Il Reveal è SPEZZATO (stesso schema di OpenDomus): titolo e
            sottotitolo restano nudi, perché CharFlip e TextLines hanno già il
            loro stato nascosto e un secondo fade sopra darebbe il
            doppio-hide. Via anche `balance`: il bilanciamento si ricalcola
            dopo lo split di SplitText e fa saltare una riga.
            `exit` su entrambi: risalendo la pagina il capitolo si smonta
            invece di restare fermo — è quello che fa leggere continua una
            home lunga. */}
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <CharFlip as="h2" delay={0.1} className="mt-5 font-display text-d2 display-tight font-medium" exit>
          {c.title}
        </CharFlip>
        {/* mt-10 e non mt-6: con `.display-tight` (interlinea .92) le
            discendenti dell'ultima riga escono dal box del titolo, e a 109px
            di corpo sono una decina di pixel che si mangiano l'aria. */}
        <TextLines as="p" className="mt-10 max-w-xl text-[1.02rem] leading-relaxed text-stone" exit>
          {c.subcopy}
        </TextLines>
        <Reveal delay={100}>
          <Cta href="#contatti" variant="cta" size="md" className="mt-8">
            {c.cta}
          </Cta>
        </Reveal>

        {/* I tre atti del metodo */}
        <div className="mt-20 flex flex-col gap-24 lg:mt-28 lg:gap-36">
          {ACTS.map((a, i) => {
            const act = c.acts[i];
            // Il raggio copre il RITAGLIO (vbh), non l'altezza del file: con
            // un viewBox che parte sotto la titolazione incisa, misurarlo
            // sull'originale farebbe finire l'apertura a metà scrub.
            const rf = coverR(a.vw, a.vbh);
            const viewBox = `0 ${a.vy} ${a.vw} ${a.vbh}`;
            const reversed = i % 2 === 1;
            const panel = a.bleed !== "none";

            /* La maschera turbolenta (rif. OnScrollFilter: feTurbulence +
               feDisplacementMap sul cerchio della mask). Estratta qui perché
               il pannello largo e la griglia storica montano ESATTAMENTE la
               stessa cosa: allargare la foto non doveva costare la maschera.
               r parte GIÀ al valore finale: senza JS / reduced-motion la foto
               è intera; lo stato chiuso esiste solo via GSAP. */
            const svgDefs = (
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
                  {/* Centro in coordinate assolute e non più in `50%`: le
                      percentuali si risolvono sulla DIMENSIONE del viewport
                      SVG e ignorano l'origine del viewBox, quindi con un
                      viewBox che parte a y=215 il cerchio si aprirebbe sopra
                      il ritaglio, fuori campo. */}
                  <circle
                    data-met-mask
                    data-r-final={rf}
                    cx={a.vw / 2}
                    cy={a.vy + a.vbh / 2}
                    r={rf}
                    fill="white"
                    style={{ filter: `url(#dt-met-f${i})` }}
                  />
                </mask>
              </defs>
            );
            const photo = (
              <image
                data-met-img
                href={a.img}
                width={a.vw}
                height={a.vh}
                mask={`url(#dt-met-m${i})`}
                preserveAspectRatio="xMidYMid slice"
              />
            );

            // I tre fogli del dossier dell'atto (identici nei due impianti).
            const dossier = c.steps.slice(i * 3, i * 3 + 3).map((s, j) => (
              <li key={s.title}>
                <div
                  data-met-card
                  className={`h-full rounded-2xl border border-line bg-paper p-5 shadow-[0_18px_40px_-30px_rgba(26,24,22,0.4)] sm:p-6 ${
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
            ));

            /* ATTO A PANNELLO — la foto prende tutta la larghezza che il suo
               sorgente regge, il titolo ci sta sopra e il dossier scende
               sotto in tre colonne. La meccanica di separazione in scrub è
               identica: sono sempre [data-met-up] / [data-met-down] dentro
               [data-met-act], e il GSAP qui sopra non sa nemmeno che sono
               cambiati di posto. */
            if (panel) {
              return (
                <div key={act.up} data-met-act className="relative">
                  <div
                    className={`relative ${
                      a.bleed === "screen"
                        ? // Full-bleed: margine negativo e non translate — un
                          // transform qui creerebbe un containing block di
                          // troppo, e il ritaglio lo fa già l'overflow-hidden
                          // della sezione.
                          "mx-[calc(50%_-_50vw)] w-screen"
                        : "w-full"
                    }`}
                  >
                    {/* Il titolo viene PRIMA della foto nell'ordine del
                        documento (è la testa dell'atto e lo screen reader la
                        deve incontrare per prima) e sopra nell'ordine di
                        pittura, che è quello che fa l'assoluto + z. */}
                    <h3 className="absolute inset-0 z-20 flex flex-col justify-center px-6 font-display font-medium leading-[0.98] tracking-[-0.01em] text-cream sm:px-10 lg:px-[6vw]">
                      <span data-met-up className={`block ${HALF}`}>
                        {act.up}
                      </span>
                      {/* Sul velo il rosso di marca (#d20a0a) scende a 1.4:1
                          di contrasto: su fondo scuro smette di essere un
                          colore da testo. La metà bassa passa al rosa cipria
                          del brand — resta "l'altra voce" del titolo, ma si
                          legge. */}
                      <span data-met-down className={`block text-red-soft ${HALF} lg:ml-[7%]`}>
                        {act.down}
                      </span>
                    </h3>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-10"
                      style={veloStyle(a.bleed === "screen" ? "screen" : "column")}
                    />
                    {/* Un solo tralcio in tutta la sezione. Stava nel margine
                        esterno della colonna: a 1280 ne restavano fuori 120px
                        su 224 (tagliati dall'overflow della sezione) e in
                        ogni caso cadeva sulla testa dell'atto. Qui sta DENTRO
                        il pannello, nell'angolo che il titolo non occupa (il
                        titolo vive a sinistra), sopra la foto e sotto il
                        testo: non può essere tagliato e non tocca nessuna
                        parola. Opacità 0.5 perché il fondo è fotografia
                        velata di scuro — su crema il tetto sarebbe 0.40. */}
                    {i === 1 ? (
                      <Fioritura
                        variant="corner-br"
                        palette="dark"
                        className="absolute bottom-2 right-4 z-[15] hidden h-[26vh] w-[12vw] lg:block"
                      />
                    ) : null}

                    <svg
                      viewBox={viewBox}
                      // `slice` anche sull'SVG, non solo sull'<image>: il
                      // pannello ha un'altezza sua e senza questo il disegno
                      // verrebbe incorniciato al centro con due bande vuote.
                      preserveAspectRatio="xMidYMid slice"
                      className={`block w-full ${
                        a.bleed === "screen" ? "h-[clamp(22rem,74svh,44rem)]" : "h-[clamp(17rem,46svh,27rem)]"
                      }`}
                      role="img"
                      aria-label={act.alt}
                    >
                      {svgDefs}
                      {photo}
                    </svg>
                  </div>

                  {/* IL PULSANTE PLAY NON È NOSTRO: è cotto dentro
                      handshake.jpg, che è la copertina della video recensione
                      "Felicemente venduta". Al centro esatto di una foto non
                      si può ritagliare via, e ricostruirlo a mano lascia una
                      sbavatura sul logo (provato). Su un pannello cinematico
                      che non porta da nessuna parte quel pulsante legge come
                      un player rotto: allora il pannello DIVENTA il video.
                      Un difetto trasformato in affordance, non nascosto. */}
                  {a.video ? (
                    <div className="mt-4 flex justify-end">
                      <a
                        href={youtubeWatch(a.video)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2.5 rounded-full border border-line bg-paper py-2.5 pl-3 pr-5 text-sm font-semibold text-ink transition-all duration-300 hover:border-red hover:text-red"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red text-cream transition-transform duration-300 group-hover:scale-110">
                          <Play className="h-3.5 w-3.5" />
                        </span>
                        {c.actVideo}
                      </a>
                    </div>
                  ) : null}

                  <ol className="mt-10 grid gap-6 sm:grid-cols-3 lg:mt-12" start={i * 3 + 1}>
                    {dossier}
                  </ol>
                </div>
              );
            }

            /* ATTO IN COLONNA — resta così per una ragione sola: il sorgente.
               raffaela-ritratto.jpg è 763×442 (dopo il ritaglio delle fasce
               bianche, vedi in testa al file) e in questo frame verticale è
               già mostrato sopra 1:1. Allargarlo lo sgranerebbe, e una foto
               sgranata a tutta pagina è peggio di una foto giusta a mezza
               pagina. */
            return (
              <div key={act.up} data-met-act className="relative">
                {/* Il titolo in due metà: si separano in scrub mentre la foto
                    si apre — la variante React del Flip del riferimento. */}
                <h3 className="relative z-10 font-display font-medium leading-[0.98] tracking-[-0.01em]">
                  <span data-met-up className={`block ${HALF} ${reversed ? "lg:ml-[30%]" : ""}`}>
                    {act.up}
                  </span>
                  <span
                    data-met-down
                    className={`block ${HALF} text-red ${reversed ? "lg:ml-[12%]" : "lg:ml-[22%]"}`}
                  >
                    {act.down}
                  </span>
                </h3>

                <div
                  className={`mt-6 grid gap-10 lg:mt-2 lg:grid-cols-[minmax(0,52fr)_minmax(0,48fr)] lg:items-center lg:gap-16 ${
                    reversed ? "lg:grid-flow-dense" : ""
                  }`}
                >
                  <svg
                    viewBox={viewBox}
                    className={`h-auto w-full ${reversed ? "lg:col-start-2" : ""}`}
                    role="img"
                    aria-label={act.alt}
                  >
                    {svgDefs}
                    {photo}
                  </svg>

                  <ol className={`flex flex-col gap-6 ${reversed ? "lg:col-start-1 lg:row-start-1" : ""}`} start={i * 3 + 1}>
                    {dossier}
                  </ol>
                </div>
              </div>
            );
          })}
        </div>

        {/* Il Segno in chiusura: qui c'era un cuore GENERICO ridisegnato a mano.
            Ora c'è il monogramma depositato (2026-08-06, direttiva cliente):
            il percorso diventa casa, e la casa è la nostra. L'apertura
            turbolenta resta identica, ma agisce sul GRUPPO — il brand book
            vieta di animare i tracciati del logo, non di mascherarlo.
            Frequenza e spostamento riscalati sul nuovo viewBox (99×92 invece
            di 64×60): 0.14×64/99 ≈ 0.09 e 14×99/64 ≈ 22, così il bordo
            d'inchiostro ha la stessa grana di prima.
            Senza JS / reduced-motion: già completo. */}
        <div ref={segnoWrapRef} className="mt-14 flex justify-center pb-2 lg:mt-16">
          <svg
            viewBox={MARK_VIEWBOX}
            aria-hidden
            className="h-[clamp(4rem,7vw,6.5rem)] w-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Regione esplicita: con spostamento 22 il default (-10%/120%) taglierebbe il bordo. */}
              <filter id="dt-met-fh" x="-40%" y="-40%" width="180%" height="180%">
                <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <mask id="dt-met-mh">
                <circle
                  data-met-segno-mask
                  data-r-final="76"
                  cx="49.5"
                  cy="46"
                  r="76"
                  fill="white"
                  style={{ filter: "url(#dt-met-fh)" }}
                />
              </mask>
            </defs>
            <g mask="url(#dt-met-mh)">
              <path fill="#595a58" fillRule="evenodd" d={MARK_D} />
              <path fill="#e30716" fillRule="evenodd" d={MARK_RED_D} />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
