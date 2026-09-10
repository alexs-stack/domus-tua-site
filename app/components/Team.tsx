"use client";

/* Chi siamo — la rivista bianca (2026-09-10, rif. immobiliaregoldengoal.it):
   intro con il ritratto della fondatrice e la citazione, poi il team su una
   rotaia orizzontale pilotata dallo scroll verticale (HorizontalRail con
   corridoio); sotto 1024 la rotaia è uno scorrimento nativo con snap.
   Un fondo solo, niente card, niente raggi, niente fiori. */

import Image from "next/image";
import Reveal from "./Reveal";
import Parallax from "./motion/Parallax";
import TextLines from "./motion/TextLines";
import HorizontalRail from "./motion/HorizontalRail";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { team, teamInitials, teamRoleLabels } from "../lib/team";

const copy = {
  it: {
    eyebrow: "Chi siamo",
    title: "Persone prima degli immobili.",
    lead: "Dietro ogni casa c’è una storia. Dietro ogni percorso Domus Tua c’è un team che ascolta, guida e accompagna, dalla prima telefonata fino alla firma.",
    body: "Tutto è nato nel 2007 dalla visione di Raffaela Rizza: un’agenzia immobiliare indipendente a Tradate. Non prendiamo un incarico se il prezzo non sta in piedi, controlliamo i documenti prima di pubblicare, e al telefono rispondiamo noi — la stessa persona, dalla prima chiamata al rogito.",
    quote: "“Per noi una casa non è un annuncio: è la storia di una famiglia. La trattiamo così.”",
    role: "Fondatrice · Domus Tua",
    cta: "Conosci Domus Tua",
    founderAlt: "Raffaela Rizza, founder di Domus Tua",
    founderCaption: "Founder & CEO",
    rosterTitle: "Il team",
    rosterIntro: "Un’agenzia a guida femminile che mette le persone al centro. Volti veri, competenze vere.",
  },
  en: {
    eyebrow: "About us",
    title: "People before properties.",
    lead: "Behind every home there is a story. Behind every Domus Tua journey there is a team that listens, guides and supports you, from the first phone call to the signing.",
    body: "It all began in 2007 from Raffaela Rizza’s vision: an independent estate agency in Tradate. We turn down a mandate if the price does not hold up, we check the paperwork before listing, and we answer the phone ourselves — the same person, from the first call to the deed.",
    quote: "“For us a home is not a listing: it’s a family’s story. And we treat it that way.”",
    role: "Founder · Domus Tua",
    cta: "Get to know Domus Tua",
    founderAlt: "Raffaela Rizza, founder of Domus Tua",
    founderCaption: "Founder & CEO",
    rosterTitle: "The team",
    rosterIntro: "A woman-led agency that puts people first. Real faces, real expertise.",
  },
  fr: {
    eyebrow: "Qui sommes-nous",
    title: "Les personnes avant les biens.",
    lead: "Derrière chaque maison, il y a une histoire. Derrière chaque parcours Domus Tua, il y a une équipe qui écoute, guide et accompagne, du premier appel jusqu’à la signature.",
    body: "Tout est né en 2007 de la vision de Raffaela Rizza : une agence immobilière indépendante à Tradate. Nous refusons un mandat si le prix ne tient pas, nous contrôlons les documents avant la mise en ligne, et c’est nous qui répondons au téléphone — la même personne, du premier appel à l’acte.",
    quote: "« Pour nous, une maison n’est pas une annonce : c’est l’histoire d’une famille. Nous la traitons ainsi. »",
    role: "Fondatrice · Domus Tua",
    cta: "Découvrir Domus Tua",
    founderAlt: "Raffaela Rizza, fondatrice de Domus Tua",
    founderCaption: "Fondatrice & CEO",
    rosterTitle: "L’équipe",
    rosterIntro: "Une agence dirigée par des femmes qui place les personnes au centre. Des visages vrais, des compétences vraies.",
  },
  de: {
    eyebrow: "Über uns",
    title: "Menschen vor Immobilien.",
    lead: "Hinter jedem Zuhause steht eine Geschichte. Hinter jedem Weg mit Domus Tua steht ein Team, das zuhört, begleitet und unterstützt – vom ersten Anruf bis zur Unterschrift.",
    body: "Alles begann 2007 mit der Vision von Raffaela Rizza: eine unabhängige Immobilienagentur in Tradate. Wir lehnen einen Auftrag ab, wenn der Preis nicht trägt, wir prüfen die Unterlagen vor der Veröffentlichung, und wir gehen selbst ans Telefon — dieselbe Person, vom ersten Anruf bis zum Notartermin.",
    quote: "„Für uns ist ein Zuhause keine Anzeige: Es ist die Geschichte einer Familie. So behandeln wir es.“",
    role: "Gründerin · Domus Tua",
    cta: "Domus Tua kennenlernen",
    founderAlt: "Raffaela Rizza, Gründerin von Domus Tua",
    founderCaption: "Gründerin & CEO",
    rosterTitle: "Das Team",
    rosterIntro: "Eine von Frauen geführte Agentur, die den Menschen in den Mittelpunkt stellt. Echte Gesichter, echte Kompetenzen.",
  },
  es: {
    eyebrow: "Quiénes somos",
    title: "Personas antes que inmuebles.",
    lead: "Detrás de cada casa hay una historia. Detrás de cada recorrido Domus Tua hay un equipo que escucha, guía y acompaña, desde la primera llamada hasta la firma.",
    body: "Todo nació en 2007 de la visión de Raffaela Rizza: una agencia inmobiliaria independiente en Tradate. No aceptamos un encargo si el precio no se sostiene, comprobamos los documentos antes de publicar, y al teléfono respondemos nosotras — la misma persona, desde la primera llamada hasta la escritura.",
    quote: "“Para nosotros una casa no es un anuncio: es la historia de una familia. Y así la tratamos.”",
    role: "Fundadora · Domus Tua",
    cta: "Conoce Domus Tua",
    founderAlt: "Raffaela Rizza, fundadora de Domus Tua",
    founderCaption: "Fundadora & CEO",
    rosterTitle: "El equipo",
    rosterIntro: "Una agencia dirigida por mujeres que pone a las personas en el centro. Rostros reales, competencias reales.",
  },
};

/* Quanto il ritratto pana dentro la cornice, in senso contrario alla corsa
   della rotaia: ±4 %, la stessa misura della Parallax verticale (spec §3.5).
   Una quota, letta in due modi: `data-depth` dal tween GSAP da 1024 in su,
   `--depth` dalla regola CSS che sotto la soglia fa lo stesso pan sul dito. */
const DEPTH = 4;

export default function Team() {
  const { locale } = useLocale();
  const c = copy[locale];
  const roles = teamRoleLabels[locale];

  return (
    <section id="chi-siamo" className="dt-chapter bg-cream">
      {/* ── L'intro: ritratto della fondatrice e citazione ─────────────── */}
      <div className="dt-row grid gap-[6vw] lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Parallax speed={-0.04}>
          <div className="relative aspect-[4/5]">
            <Image
              src="/images/reali/raffaela-founder.jpg"
              style={{ objectPosition: "18% 45%" }}
              alt={c.founderAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </Parallax>

        <div>
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <TextLines as="h2" className="mt-6 font-display text-d1">
            {c.title}
          </TextLines>
          <Reveal>
            <p className="lead mt-8">{c.lead}</p>
          </Reveal>
          <Reveal delay={80}>
            <p className="mt-4 max-w-[60ch] text-body text-graphite">{c.body}</p>
          </Reveal>
          <Reveal delay={140}>
            <blockquote className="mt-8 font-display text-d3 text-ink">{c.quote}</blockquote>
            <p className="mt-4 text-body text-stone">Raffaela Rizza · {c.role}</p>
          </Reveal>
          <Reveal delay={200}>
            <Cta href="#contatti" variant="ghost" className="mt-8">
              {c.cta}
            </Cta>
          </Reveal>
        </div>
      </div>

      {/* ── La rotaia del team: ritratti grandi, pilotati dallo scroll ──── */}
      <div className="mt-[10vh]">
        <div className="dt-row">
          <p className="eyebrow">{c.rosterTitle}</p>
          <p className="lead mt-4">{c.rosterIntro}</p>
        </div>
        {/* Le regole di `.dt-rail_track` (globals.css) sono unlayered e battono
            le utility: gap, padding e allineamento passano solo col `!`.
            `items-start`: i ritratti restano allineati in alto anche quando
            un nome va a capo nella didascalia. */}
        <HorizontalRail
          runway={120}
          snapMobile
          cursor=""
          className="mt-10"
          trackClassName="!items-start !gap-[3vw] !px-[5vw] md:!px-[8vw]"
        >
          {team.map((m) => (
            /* tabIndex: sotto 1024 (e con reduced-motion) la rotaia è una
               regione che scorre, e una regione che scorre senza nulla di
               focalizzabile è una violazione WCAG 2.1.1 che axe segnala
               (scrollable-region-focusable). Il contenitore è di HorizontalRail,
               quindi a essere raggiungibili da tastiera sono le tessere: il
               Tab passa da una persona all'altra e lo scroller le segue.
               Lo snap lo detta il CSS (`[data-snap]` → center), non le utility. */
            <figure key={m.name} tabIndex={0} className="w-[78vw] shrink-0 sm:w-[52vw] lg:w-[34vw]">
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
                {m.image ? (
                  <div
                    className="dt-rail_pan"
                    data-depth={DEPTH}
                    style={{ "--depth": DEPTH } as React.CSSProperties}
                  >
                    <Image
                      src={m.image}
                      alt={m.name}
                      fill
                      // Il pannello del pan è il 118 % della tessera.
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 62vw, 40vw"
                      className="object-cover"
                      style={{ objectPosition: m.imagePos }}
                    />
                  </div>
                ) : (
                  /* Monogramma finché la foto non arriva (app/lib/team.ts). */
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center font-display text-d1 text-stone"
                  >
                    {teamInitials(m.name)}
                  </span>
                )}
              </div>
              <figcaption className="mt-5">
                <span className="block font-display text-d3 uppercase text-ink">{m.name}</span>
                <span className="mt-1 block text-body text-stone">{roles[m.role]}</span>
              </figcaption>
            </figure>
          ))}
        </HorizontalRail>
      </div>
    </section>
  );
}
