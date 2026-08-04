"use client";

// HorizonStory — il set piece della home dopo la ricerca, in tre atti
// (tecnica dal dossier reverse-engineering/era-residence §11, contenuti nostri):
// 1. fondale: la foto aerea reale resta pinnata (sticky) mentre...
// 2. ...la cupola crema — arco ribassato, variante Domus del semicerchio del
//    riferimento — le sale sopra dal basso, col titolo curvato su un textPath
//    circolare le cui parole si distendono lungo l'arco in scrub;
// 3. i pannelli orizzontali (HorizonScroller): manifesto + territorio.
// Mobile / reduced-motion: fondale semplice, cupola statica, pannelli in
// colonna — tutto visibile senza JS.
import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import HorizonScroller from "./motion/HorizonScroller";
import Fioritura from "./motion/Fioritura";
import ReviewsWall from "./ReviewsWall";
import Reveal from "./Reveal";
import { SegnoDomus } from "./BrandMotif";
import { ArrowRight, ArrowUpRight, Play, Star } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";

const copy = {
  it: {
    backdropAlt: "Vista aerea dei tetti e del verde attorno a Tradate",
    domeTitle: "Perché scegliere Domus Tua",
    domeLeft: "Tradate",
    domeRight: "dal 2007",
    eyebrow: "La promessa",
    statement: (
      <>
        Vendere senza stress.
        <br />
        Acquistare con sicurezza.
        <br />
        Persone, prima degli immobili.
      </>
    ),
    lead: "Dal 2007 accompagniamo le famiglie di Tradate e provincia in ogni passaggio: valutazione, documenti verificati, marketing curato e assistenza fino al rogito.",
    cap: "Tradate · Varese",
    stairs: ["Tra la", "Pineta", "e Milano"],
    subtitle: "Il territorio che abitiamo",
    territory:
      "Lavoriamo dove viviamo: Tradate e i comuni della provincia di Varese, tra il verde del Parco Pineta e i collegamenti per Milano e Malpensa. Conosciamo il valore di ogni via, perché è anche la nostra.",
    cta: "Vedi le case disponibili",
    imageAlt: "Attico con terrazzo a Tradate seguito da Domus Tua",
    revCap: "Recensioni",
    revTitle: "Lo specchio del nostro lavoro.",
    revOf: "su 5",
    revCount: `${site.reviewsCount} recensioni Google verificate`,
    revBody:
      "Il giudizio che conta è il riflesso di chi ci ha scelto: famiglie che hanno venduto o comprato casa con noi e l'hanno raccontato, con nome e cognome.",
    revCta: "Leggi le recensioni",
    revAlt: "Raffaela Rizza sorride alla sua immagine riflessa nello specchio della sede",
    thanksWord: "Grazie",
    vidCap: "Video recensioni",
    vidTitle: "Le voci, in prima persona.",
    vidBody:
      "Le storie più belle non le scriviamo noi: le raccontano i clienti davanti alla camera. Guardale sul nostro canale, prima ancora di conoscerci.",
    vidCta: "Guarda le video recensioni",
    vidAlt: "Raffaela Rizza in sede accanto allo specchio, sorridente verso la camera",
    vidAlt2: "Raffaela Rizza di profilo osserva il proprio riflesso nello specchio",
  },
  en: {
    backdropAlt: "Aerial view of the rooftops and greenery around Tradate",
    domeTitle: "Why choose Domus Tua",
    domeLeft: "Tradate",
    domeRight: "since 2007",
    eyebrow: "Our promise",
    statement: (
      <>
        Selling without stress.
        <br />
        Buying with confidence.
        <br />
        People before properties.
      </>
    ),
    lead: "Since 2007 we have guided families in Tradate and its province through every step: valuation, verified paperwork, thoughtful marketing and assistance all the way to closing.",
    cap: "Tradate · Varese",
    stairs: ["Between the", "Pineta park", "and Milan"],
    subtitle: "The land we call home",
    territory:
      "We work where we live: Tradate and the towns of the Varese province, between the green of the Pineta park and the connections to Milan and Malpensa. We know the value of every street, because it is ours too.",
    cta: "View available homes",
    imageAlt: "Penthouse with terrace in Tradate listed by Domus Tua",
    revCap: "Reviews",
    revTitle: "The mirror of our work.",
    revOf: "out of 5",
    revCount: `${site.reviewsCount} verified Google reviews`,
    revBody:
      "The judgement that matters is the reflection of those who chose us: families who sold or bought a home with us and told the story, with their full name.",
    revCta: "Read the reviews",
    revAlt: "Raffaela Rizza smiling at her reflection in the office mirror",
    thanksWord: "Thank you",
    vidCap: "Video reviews",
    vidTitle: "The voices, first-hand.",
    vidBody:
      "The best stories are not written by us: clients tell them on camera. Watch them on our channel, even before meeting us.",
    vidCta: "Watch the video reviews",
    vidAlt: "Raffaela Rizza by the mirror, smiling at the camera",
    vidAlt2: "Raffaela Rizza in profile looking at her reflection in the mirror",
  },
  fr: {
    backdropAlt: "Vue aérienne des toits et de la verdure autour de Tradate",
    domeTitle: "Pourquoi choisir Domus Tua",
    domeLeft: "Tradate",
    domeRight: "depuis 2007",
    eyebrow: "Notre promesse",
    statement: (
      <>
        Vendre sans stress.
        <br />
        Acheter en confiance.
        <br />
        Les personnes avant les biens.
      </>
    ),
    lead: "Depuis 2007, nous accompagnons les familles de Tradate et de sa province à chaque étape : estimation, documents vérifiés, marketing soigné et assistance jusqu'à l'acte.",
    cap: "Tradate · Varese",
    stairs: ["Entre la", "Pineta", "et Milan"],
    subtitle: "Le territoire que nous habitons",
    territory:
      "Nous travaillons là où nous vivons : Tradate et les communes de la province de Varese, entre le vert du parc Pineta et les liaisons vers Milan et Malpensa. Nous connaissons la valeur de chaque rue, parce qu'elle est aussi la nôtre.",
    cta: "Voir les biens disponibles",
    imageAlt: "Attique avec terrasse à Tradate proposé par Domus Tua",
    revCap: "Avis",
    revTitle: "Le miroir de notre travail.",
    revOf: "sur 5",
    revCount: `${site.reviewsCount} avis Google vérifiés`,
    revBody:
      "Le jugement qui compte est le reflet de ceux qui nous ont choisis : des familles qui ont vendu ou acheté avec nous et l'ont raconté, avec leur nom.",
    revCta: "Lire les avis",
    revAlt: "Raffaela Rizza souriant à son reflet dans le miroir de l'agence",
    thanksWord: "Merci",
    vidCap: "Avis en vidéo",
    vidTitle: "Les voix, à la première personne.",
    vidBody:
      "Les plus belles histoires, ce ne sont pas nous qui les écrivons : les clients les racontent face caméra. Regardez-les sur notre chaîne, avant même de nous rencontrer.",
    vidCta: "Voir les avis en vidéo",
    vidAlt: "Raffaela Rizza près du miroir, souriant à la caméra",
    vidAlt2: "Raffaela Rizza de profil, observant son reflet dans le miroir",
  },
  de: {
    backdropAlt: "Luftaufnahme der Dächer und des Grüns rund um Tradate",
    domeTitle: "Warum Domus Tua",
    domeLeft: "Tradate",
    domeRight: "seit 2007",
    eyebrow: "Unser Versprechen",
    statement: (
      <>
        Verkaufen ohne Stress.
        <br />
        Kaufen mit Sicherheit.
        <br />
        Menschen vor Immobilien.
      </>
    ),
    lead: "Seit 2007 begleiten wir Familien in Tradate und Umgebung bei jedem Schritt: Bewertung, geprüfte Unterlagen, sorgfältiges Marketing und Betreuung bis zum Notartermin.",
    cap: "Tradate · Varese",
    stairs: ["Zwischen dem", "Pineta-Park", "und Mailand"],
    subtitle: "Unser Zuhause, unser Gebiet",
    territory:
      "Wir arbeiten dort, wo wir leben: Tradate und die Gemeinden der Provinz Varese, zwischen dem Grün des Pineta-Parks und den Verbindungen nach Mailand und Malpensa. Wir kennen den Wert jeder Straße — denn es sind auch unsere.",
    cta: "Verfügbare Immobilien ansehen",
    imageAlt: "Penthouse mit Terrasse in Tradate im Angebot von Domus Tua",
    revCap: "Bewertungen",
    revTitle: "Der Spiegel unserer Arbeit.",
    revOf: "von 5",
    revCount: `${site.reviewsCount} verifizierte Google-Bewertungen`,
    revBody:
      "Das Urteil, das zählt, ist das Spiegelbild derer, die uns gewählt haben: Familien, die mit uns verkauft oder gekauft haben — und es mit vollem Namen erzählen.",
    revCta: "Bewertungen lesen",
    revAlt: "Raffaela Rizza lächelt ihrem Spiegelbild im Büro zu",
    thanksWord: "Danke",
    vidCap: "Video-Bewertungen",
    vidTitle: "Die Stimmen, aus erster Hand.",
    vidBody:
      "Die schönsten Geschichten schreiben nicht wir: Unsere Kunden erzählen sie vor der Kamera. Sehen Sie sie auf unserem Kanal — noch bevor Sie uns kennenlernen.",
    vidCta: "Video-Bewertungen ansehen",
    vidAlt: "Raffaela Rizza am Spiegel, lächelnd in die Kamera",
    vidAlt2: "Raffaela Rizza im Profil, den Blick auf ihr Spiegelbild gerichtet",
  },
  es: {
    backdropAlt: "Vista aérea de los tejados y el verde alrededor de Tradate",
    domeTitle: "Por qué elegir Domus Tua",
    domeLeft: "Tradate",
    domeRight: "desde 2007",
    eyebrow: "Nuestra promesa",
    statement: (
      <>
        Vender sin estrés.
        <br />
        Comprar con seguridad.
        <br />
        Personas antes que inmuebles.
      </>
    ),
    lead: "Desde 2007 acompañamos a las familias de Tradate y su provincia en cada paso: valoración, documentos verificados, marketing cuidado y asistencia hasta la escritura.",
    cap: "Tradate · Varese",
    stairs: ["Entre el", "parque Pineta", "y Milán"],
    subtitle: "El territorio que habitamos",
    territory:
      "Trabajamos donde vivimos: Tradate y los municipios de la provincia de Varese, entre el verde del parque Pineta y las conexiones con Milán y Malpensa. Conocemos el valor de cada calle, porque también es la nuestra.",
    cta: "Ver las casas disponibles",
    imageAlt: "Ático con terraza en Tradate ofrecido por Domus Tua",
    revCap: "Reseñas",
    revTitle: "El espejo de nuestro trabajo.",
    revOf: "sobre 5",
    revCount: `${site.reviewsCount} reseñas de Google verificadas`,
    revBody:
      "El juicio que cuenta es el reflejo de quienes nos eligieron: familias que vendieron o compraron casa con nosotros y lo contaron, con nombre y apellido.",
    revCta: "Leer las reseñas",
    revAlt: "Raffaela Rizza sonríe a su reflejo en el espejo de la agencia",
    thanksWord: "Gracias",
    vidCap: "Videorreseñas",
    vidTitle: "Las voces, en primera persona.",
    vidBody:
      "Las mejores historias no las escribimos nosotros: las cuentan los clientes ante la cámara. Míralas en nuestro canal, incluso antes de conocernos.",
    vidCta: "Mira las videorreseñas",
    vidAlt: "Raffaela Rizza junto al espejo, sonriendo a la cámara",
    vidAlt2: "Raffaela Rizza de perfil, observando su reflejo en el espejo",
  },
} as const;

// Arco del titolo curvato: cerchio largo (r=1800, centro sotto il viewBox) →
// curvatura dolce, coerente con l'arco ribassato della cupola. startOffset 25%
// = apice del cerchio (il path parte dal punto più a sinistra).
const ARC_PATH = "M 800,1900 m -1800,0 a 1800,1800 0 1,1 3600,0 a 1800,1800 0 1,1 -3600,0";

export default function HorizonStory({ children }: { children?: ReactNode }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const domeRef = useRef<HTMLDivElement | null>(null);

  // La firma della cupola: le parole del titolo curvato si distendono lungo
  // l'arco mentre la sezione attraversa il viewport (rif. §11.4 del dossier).
  useGSAP(
    () => {
      const dome = domeRef.current;
      if (!dome) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const texts = dome.querySelectorAll("[data-dome-text]");
        if (!texts.length) return;
        gsap.fromTo(
          texts,
          { wordSpacing: "0em" },
          {
            wordSpacing: "0.55em",
            ease: "none",
            scrollTrigger: { trigger: dome, start: "top bottom", end: "bottom top", scrub: 0.25 },
          }
        );
      });
    },
    { scope: domeRef, dependencies: [locale] }
  );

  return (
    <>
      {/* Atto 1 — fondale: la foto resta pinnata mentre la cupola le sale sopra. */}
      <div className="relative z-0 h-[160svh]">
        <div className="sticky top-0 h-svh overflow-hidden">
          <Image
            src="/media/hero-aerial.jpg"
            alt={c.backdropAlt}
            fill
            sizes="100vw"
            quality={60}
            className="object-cover"
          />
        </div>
      </div>

      {/* Atti 2 e 3 vivono in UN SOLO contenitore curvo: il trattamento-luce di
          .bg-cream (bloom dall'alto) riparte a ogni elemento che porta la classe,
          e due superfici separate creavano una linea d'ombra al confine. Con la
          cupola come wrapper la pagina che sale è davvero una sola. */}
      <div className="dt-dome relative z-10 -mt-[60svh] bg-cream">
        {/* Atto 2 — l'intro sotto l'arco. Il titolo curvato è decorativo
            (aria-hidden): il testo leggibile vive nell'h2 sr-only. */}
        <div ref={domeRef} className="mx-auto max-w-[1600px] px-5 pb-6 pt-[16svh] sm:px-8">
          <h2 className="sr-only">{c.domeTitle}</h2>
          <div aria-hidden className="mx-auto w-full max-w-[1240px]">
            <svg viewBox="0 0 1600 460" width="100%" height="100%" className="block">
              <defs>
                <path id="dt-dome-arc" d={ARC_PATH} />
              </defs>
              <text
                data-dome-text
                textAnchor="middle"
                fill="currentColor"
                className="font-display uppercase text-ink"
                style={{ fontSize: 96, letterSpacing: "0.02em" }}
              >
                <textPath href="#dt-dome-arc" startOffset="25%">
                  {c.domeTitle}
                </textPath>
              </text>
            </svg>
          </div>
          <Reveal className="mt-4 flex items-center justify-center gap-4">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-graphite">
              {c.domeLeft}
            </span>
            <SegnoDomus className="h-4 w-10" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-graphite">
              {c.domeRight}
            </span>
          </Reveal>
          <Reveal delay={120} className="mx-auto mt-8 h-14 w-px bg-red/40" as="div">
            <span className="sr-only" />
          </Reveal>
        </div>

        {/* Atto 3 — i pannelli orizzontali (stessa superficie curva, nessun
            proprio sfondo: la luce resta quella del wrapper). */}
        <HorizonScroller id="storia" refreshKey={locale}>
        {/* Pannello manifesto */}
        <div className="dt-horizon_panel dt-horizon_panel--statement relative flex items-center justify-center">
          {/* L'angolo fiorito del riferimento (era-residence §11.3): il tralcio
              sboccia dall'angolo alto e deriva con la parallasse dei fiori. */}
          <div
            aria-hidden
            data-horizon-flower="drift-y"
            className="pointer-events-none absolute -left-6 -top-8 z-10 hidden h-[44vh] w-[20vw] lg:block"
          >
            <Fioritura variant="corner-tl" className="h-full w-full" />
          </div>
          <div className="mx-auto max-w-[1000px] px-5 py-20 text-center sm:px-8 lg:py-0">
            <Reveal>
              <span className="eyebrow eyebrow--center justify-center">{c.eyebrow}</span>
            </Reveal>
            {/* Reveal per-carattere (animatore "h" del riferimento, §7 del
                dossier): orchestrato da HorizonScroller al pin della sezione —
                un trigger di posizione qui suonerebbe a sipario ancora chiuso. */}
            <h2
              key={locale}
              data-horizon-reveal="chars"
              className="mt-6 font-display text-[clamp(1.9rem,4.6vw,4.3rem)] font-medium uppercase leading-[1.06] tracking-[-0.01em] text-ink"
            >
              {c.statement}
            </h2>
            <Reveal delay={160}>
              <p className="mx-auto mt-8 max-w-xl text-[0.98rem] leading-relaxed text-stone sm:text-base">
                {c.lead}
              </p>
            </Reveal>
            <Reveal delay={240} className="mt-8 flex justify-center">
              <SegnoDomus className="h-5 w-12" />
            </Reveal>
          </div>
        </div>

        {/* Pannello territorio */}
        <div className="dt-horizon_panel dt-horizon_panel--territory relative flex items-center">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center lg:gap-0 lg:py-0">
            <div className="dt-horizon_stairs">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red">
                {c.cap}
              </p>
              <h2 className="mt-6 font-display font-medium uppercase leading-[0.95] tracking-[-0.01em] text-ink">
                {c.stairs.map((line, i) => (
                  <span
                    key={line}
                    data-horizon-stair
                    className={`block text-[clamp(2.6rem,7vw,6.5rem)] ${
                      i === 1 ? "lg:ml-[9vw]" : i === 2 ? "lg:ml-[4vw]" : ""
                    }`}
                  >
                    {line}
                  </span>
                ))}
              </h2>
              <div data-horizon-reveal="track" className="mt-10 max-w-md">
                <h3 className="font-display text-xl font-medium text-ink sm:text-2xl">
                  {c.subtitle}
                </h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-stone sm:text-base">
                  {c.territory}
                </p>
                <Link
                  href="/acquista"
                  className="tap-target group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
                >
                  {c.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div
              data-horizon-slide
              className="relative aspect-[4/3] w-full overflow-hidden rounded-card lg:aspect-auto lg:h-[72vh]"
            >
              <Image
                data-horizon-slide-img
                src="/images/reali/attico-tradate.jpg"
                alt={c.imageAlt}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
          {/* La scritta in fiori (tecnica WebGL-typing, canvas 2D): il nome del
              territorio fiorisce come una firma botanica sotto i gradini. */}
          <div
            aria-hidden
            data-horizon-flower="drift-x"
            className="pointer-events-none absolute bottom-[7vh] left-[5vw] z-10 hidden h-[13vh] w-[30vw] lg:block"
          >
            <Fioritura word="Tradate" variant="corner-bl" className="h-full w-full" />
          </div>
        </div>

        {/* Pannello recensioni — lo specchio: il riflesso è il giudizio di chi
            ci ha scelto. Numeri SOLO da site.ts (fonte unica verificata). */}
        <div className="dt-horizon_panel relative flex items-center">
          {/* La parola che le recensioni ci lasciano, fiorita come una dedica. */}
          <div
            aria-hidden
            data-horizon-flower="drift-x"
            className="pointer-events-none absolute bottom-[6vh] left-[6vw] z-10 hidden h-[12vh] w-[24vw] lg:block"
          >
            <Fioritura word={c.thanksWord} variant="corner-bl" className="h-full w-full" />
          </div>
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-10 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] lg:items-center lg:gap-16 lg:py-0">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red">
                {c.revCap}
              </p>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.2vw,3.9rem)] font-medium leading-[1.04] tracking-[-0.01em] text-ink">
                {c.revTitle}
              </h2>
              <div data-horizon-reveal="track" className="mt-9 max-w-md">
                <p className="flex items-end gap-3">
                  <span className="tnum font-display text-6xl font-medium leading-none text-ink sm:text-7xl">
                    {site.rating}
                  </span>
                  <span className="pb-1 text-sm font-semibold uppercase tracking-[0.14em] text-graphite">
                    {c.revOf}
                  </span>
                </p>
                <p className="mt-3 flex items-center gap-1.5" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-red" />
                  ))}
                </p>
                <p className="mt-2 text-sm font-medium text-graphite">{c.revCount}</p>
                <p className="mt-5 text-[0.95rem] leading-relaxed text-stone sm:text-base">
                  {c.revBody}
                </p>
                <Link
                  href="/recensioni"
                  className="tap-target group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
                >
                  {c.revCta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div
              data-horizon-slide
              className="relative aspect-[3/4] w-full overflow-hidden rounded-card lg:aspect-auto lg:h-[74vh]"
            >
              <Image
                data-horizon-slide-img
                src="/images/reali/raffaela-specchio-riflesso.jpg"
                alt={c.revAlt}
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Pannello video recensioni — la voce diretta dei clienti, sul canale
            reale dell'agenzia (stesso target della CTA di Authority). */}
        <div className="dt-horizon_panel relative flex items-center">
          {/* Chiusura del set piece: il tralcio fiorisce dall'angolo basso. */}
          <div
            aria-hidden
            data-horizon-flower="drift-y"
            className="pointer-events-none absolute -bottom-6 -right-5 z-10 hidden h-[38vh] w-[17vw] lg:block"
          >
            <Fioritura variant="corner-br" className="h-full w-full" />
          </div>
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-10 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)] lg:items-center lg:gap-16 lg:py-0">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red">
                {c.vidCap}
              </p>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.2vw,3.9rem)] font-medium leading-[1.04] tracking-[-0.01em] text-ink">
                {c.vidTitle}
              </h2>
              <div data-horizon-reveal="track" className="mt-8 max-w-md">
                <p className="text-[0.95rem] leading-relaxed text-stone sm:text-base">{c.vidBody}</p>
                <a
                  href={site.social.youtube.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target group mt-7 inline-flex items-center gap-3 text-sm font-semibold text-red transition-colors hover:text-red-dark"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 ease-soft group-hover:scale-105">
                    <Play className="ml-0.5 h-4 w-4" />
                  </span>
                  {c.vidCta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
            <div className="relative">
              <div
                data-horizon-slide
                className="relative aspect-[4/3] w-full overflow-hidden rounded-card lg:h-[64vh] lg:aspect-auto"
              >
                <Image
                  data-horizon-slide-img
                  src="/images/reali/raffaela-specchio-sorriso.jpg"
                  alt={c.vidAlt}
                  fill
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="object-cover"
                />
              </div>
              {/* Carta secondaria: il profilo allo specchio, sfalsata come una
                  polaroid appoggiata (solo desktop: sotto ruberebbe spazio). */}
              <div
                data-horizon-slide
                className="absolute -bottom-10 -left-14 hidden w-[15vw] overflow-hidden rounded-card shadow-card lg:block"
              >
                <Image
                  data-horizon-slide-img
                  src="/images/reali/raffaela-specchio-profilo.jpg"
                  alt={c.vidAlt2}
                  width={640}
                  height={480}
                  sizes="15vw"
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        </HorizonScroller>

        {/* Atto 4 — dall'ultimo fotogramma orizzontale lo scroll torna
            verticale e il muro delle voci si compone (stessa superficie
            curva: nessuna cucitura di luce). */}
        <ReviewsWall />

        {/* Atto 5 — i capitoli che continuano la stessa pagina (es. le cinque
            stelle): DENTRO la superficie curva, così il trattamento-luce di
            .bg-cream non riparte e il confine non disegna la linea d'ombra
            che spezzava lo scroll (stessa lezione degli atti 2-3). */}
        {children}
      </div>
    </>
  );
}
