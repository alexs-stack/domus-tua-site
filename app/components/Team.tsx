"use client";

/* Chi siamo — la rivista bianca (2026-09-10, rif. immobiliaregoldengoal.it):
   intro con il ritratto della fondatrice e la citazione, poi il team su una
   rotaia orizzontale pilotata dallo scroll verticale (HorizontalRail con
   corridoio); sotto 1024 la rotaia è uno scorrimento nativo con snap.
   Un fondo solo, niente card, niente raggi, niente fiori.

   La rotaia, rivista lo stesso giorno: le tessere sono i ritratti che
   esistono davvero (oggi la fondatrice) più le foto di gruppo reali di
   app/lib/team.ts, grandi — «carosello o scroll orizzontale con le foto
   grandi», direttiva cliente. Niente più monogrammi vuoti al posto delle
   colleghe: i sei nomi con il ruolo stanno in un elenco sotto la rotaia.

   2026-09-11 — UNA CORNICE SOLA. Le tessere avevano tre rapporti e tre
   larghezze: bordo basso frastagliato, e la più alta dettava l'altezza di
   tutte. Ora ogni foto sta in `.dt-media-column` (4:5) e ogni didascalia è
   un'etichetta di una riga. Anche l'intro passa a un modulo (`.dt-media-half`,
   1:1): in tutto il capitolo le foto si fermano su due sole linee verticali. */

import Image from "next/image";
import Reveal from "./Reveal";
import Parallax from "./motion/Parallax";
import TextLines from "./motion/TextLines";
import HorizontalRail from "./motion/HorizontalRail";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { team, teamPhotos, teamRoleLabels } from "../lib/team";

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

/* UNA cornice sola per tutte le tessere: `.dt-media-column` (4:5). Prima erano
   tre (4:5, 3:2, 4:3) con tre larghezze diverse: il bordo basso della rotaia
   era frastagliato e la tessera più alta dettava l'altezza. La larghezza a
   desktop la porta il modulo (42vw, max 640): qui si dichiara solo quella dei
   viewport stretti, uguale per tutte. */
const TILE = "w-[78vw] sm:w-[52vw] lg:w-auto";
/* Il pannello del pan è il 118 % della tessera: la `sizes` misura quello. */
/* `sizes` descrive i PIXEL CHIESTI, non la larghezza della scatola: con
   `object-cover` una foto piu' larga della cornice viene resa piu' larga
   della cornice, e la parte in piu' esce dal taglio. In una scatola 4:5 una
   sorgente 3:2 e' resa larga 1,5 volte l'ALTEZZA della scatola, cioe' 1,9
   volte la sua larghezza. Con i vecchi numeri il loader mandava 719 px per
   1.134 che ne servivano, e le tessere erano molli. */
const TILE_SIZES = "(max-width: 640px) 146vw, (max-width: 1024px) 98vw, 79vw";

type Tile = {
  src: string;
  alt: string;
  pos?: string;
  /** Etichetta di UNA riga (16px maiuscolo): un nome o un luogo, non una frase.
      Il ruolo non sta qui: lo dice la rosa sotto la rotaia, una volta sola. */
  caption: string;
};

export default function Team({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const roles = teamRoleLabels[locale];

  // Prima i ritratti (chi ha una foto in app/lib/team.ts), poi i gruppi.
  const tiles: Tile[] = [
    ...team.flatMap((m): Tile[] =>
      m.image ? [{ src: m.image, alt: m.name, pos: m.imagePos, caption: m.name }] : [],
    ),
    ...teamPhotos.map(
      (p): Tile => ({
        src: p.src,
        alt: p.alt[locale],
        pos: p.pos,
        caption: p.label[locale],
      }),
    ),
  ];

  return (
    <section id="chi-siamo" className="dt-chapter bg-cream">
      {/* ── L'intro: ritratto della fondatrice e citazione ───────────────
          Due colonne uguali e il modulo mezzo (1:1): la foto è 1024×682, e la
          cornice 4:5 di prima ne teneva il 53 % ingrandendola: cornice che
          segue la sorgente, non la griglia. */}
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-center">
        <Parallax speed={-0.04}>
          <div className="dt-media-half">
            <Image
              src="/images/reali/raffaela-founder.jpg"
              style={{ objectPosition: "18% 50%" }}
              alt={c.founderAlt}
              fill
              /* Scatola quadrata, sorgente 3:2: resa larga 1,5 volte il lato. */
              sizes="(max-width: 1024px) 150vw, 63vw"
              className="object-cover"
            />
          </div>
        </Parallax>

        <div className="lg:pl-[6vw]">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          {/* `compact`: sotto un PageHero che dice già «Persone prima degli
              immobili» (/chi-siamo) il titolo resta un paragrafo display,
              non un secondo h2 con le stesse parole.
              d2 e non d1 in entrambi i casi: accanto a una foto il titolo sta
              in mezza colonna, e lì un d1 legge come un errore di stampa. */}
          {compact ? (
            <TextLines as="p" className="mt-6 font-display text-d2 uppercase">
              {c.title}
            </TextLines>
          ) : (
            <TextLines as="h2" className="mt-6 font-display text-d2">
              {c.title}
            </TextLines>
          )}
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

      {/* ── La rotaia del team: foto grandi, pilotate dallo scroll ──────── */}
      <div className="mt-[10vh]">
        <div className="dt-row">
          <p className="eyebrow">{c.rosterTitle}</p>
          <p className="lead mt-4">{c.rosterIntro}</p>
        </div>
        {/* Le regole di `.dt-rail_track` (globals.css) sono unlayered e battono
            le utility: gap, padding e allineamento passano solo col `!`.
            `items-start`: le foto ora hanno tutte la stessa altezza, ma una
            didascalia che andasse a capo non deve alzare la tessera accanto. */}
        <HorizontalRail
          runway={120}
          snapMobile
          className="mt-10"
          trackClassName="!items-start !gap-[3vw] !px-[5vw] md:!px-[8vw]"
        >
          {tiles.map((t) => (
            /* tabIndex: sotto 1024 (e con reduced-motion) la rotaia è una
               regione che scorre, e una regione che scorre senza nulla di
               focalizzabile è una violazione WCAG 2.1.1 che axe segnala
               (scrollable-region-focusable). Il contenitore è di HorizontalRail,
               quindi a essere raggiungibili da tastiera sono le tessere: il
               Tab passa da una foto all'altra e lo scroller le segue.
               Lo snap lo detta il CSS (`[data-snap]` → center), non le utility. */
            <figure key={t.src} tabIndex={0} className={`shrink-0 ${TILE}`}>
              <div className="dt-media-column">
                <div
                  className="dt-rail_pan"
                  data-depth={DEPTH}
                  style={{ "--depth": DEPTH } as React.CSSProperties}
                >
                  <Image
                    src={t.src}
                    alt={t.alt}
                    fill
                    sizes={TILE_SIZES}
                    className="object-cover"
                    style={{ objectPosition: t.pos }}
                  />
                </div>
              </div>
              {/* Un'etichetta, non una frase: 16px maiuscolo, una riga sola. */}
              <figcaption className="mt-4 text-ui font-semibold uppercase tracking-[0.08em] text-ink">
                {t.caption}
              </figcaption>
            </figure>
          ))}
        </HorizontalRail>

        {/* La rosa: i sei nomi con il ruolo, dalla fonte unica. Le foto
            singole arriveranno dal cliente; fino ad allora nessuna tessera
            vuota e nessun volto finto. */}
        <ul className="dt-row mt-10 grid gap-x-[4vw] gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <li key={m.name}>
              <span className="block font-display text-d3 uppercase text-ink">{m.name}</span>
              <span className="block text-body text-stone">{roles[m.role]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
