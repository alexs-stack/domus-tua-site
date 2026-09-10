"use client";

// Voci — "Cosa dicono di noi" (rivista bianca, 2026-09-10, punto 9 della
// cliente: rifare «Il muro delle voci»). Riferimento: la sezione
// «COSA DICONO DI NOI» di immobiliaregoldengoal.it — titolo enorme e uno
// slider orizzontale con due frecce.
//
// Il titolo È il numero (4,9/5 · 531 recensioni Google), letto da site.ts e
// mai scritto a mano. Sotto, i sei video reali del canale in un carosello a
// scorrimento NATIVO (overflow + scroll-snap, le frecce fanno scrollBy):
// nessun pin, nessun ScrollTrigger, nessuna sezione sticky. In coda il widget
// Trustindex, invariato e dietro lo stesso cancello del consenso di prima.
import { useRef, useState } from "react";
import Image from "next/image";
import YoutubeThumb from "./YoutubeThumb";
import VideoLightbox from "./VideoLightbox";
import TrustindexEmbed from "./TrustindexEmbed";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { ArrowLeft, ArrowRight, Play } from "./Icons";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { useConsent } from "../lib/consent";
import { ratingLabel, site } from "../lib/site";
import { wallVideos, youtubeWatch } from "../lib/videos";

const copy = {
  it: {
    eyebrow: "Cosa dicono di noi",
    google: "recensioni Google",
    description:
      "Le storie vere del canale: le recensioni dei clienti, le case raccontate in video e vendute con Open Domus, il team che conosci prima di incontrarlo.",
    listLabel: "Le storie in video",
    play: "Guarda",
    prev: "Video precedente",
    next: "Video successivo",
    widgetTitle: "Verificate da Trustindex",
    widgetNote: "Recensioni Google verificate tramite Trustindex.",
    consentGate:
      "Il widget delle recensioni è di Trustindex: si carica solo dopo il tuo consenso ai cookie. Puoi leggerle subito su Google.",
    iframeTitle: "Recensioni Google verificate di Domus Tua (Trustindex)",
    googleCta: "Leggi le recensioni su Google",
    awardHint: "apri il profilo di Domus Tua (scheda nuova)",
    all: "Leggi tutte le recensioni",
  },
  en: {
    eyebrow: "What they say about us",
    google: "Google reviews",
    description:
      "Real stories from the channel: client reviews, homes told in video and sold with Open Domus, and the team you get to know before meeting them.",
    listLabel: "The stories on video",
    play: "Watch",
    prev: "Previous video",
    next: "Next video",
    widgetTitle: "Verified by Trustindex",
    widgetNote: "Google reviews verified via Trustindex.",
    consentGate:
      "The reviews widget is provided by Trustindex: it loads only after your cookie consent. You can read the reviews on Google right now.",
    iframeTitle: "Verified Google reviews of Domus Tua (Trustindex)",
    googleCta: "Read the reviews on Google",
    awardHint: "open the Domus Tua profile (new tab)",
    all: "Read all reviews",
  },
  fr: {
    eyebrow: "Ce qu'ils disent de nous",
    google: "avis Google",
    description:
      "Les histoires vraies de la chaîne : les avis des clients, les biens racontés en vidéo et vendus avec Open Domus, l’équipe que l’on connaît avant de la rencontrer.",
    listLabel: "Les histoires en vidéo",
    play: "Regarder",
    prev: "Vidéo précédente",
    next: "Vidéo suivante",
    widgetTitle: "Vérifiés par Trustindex",
    widgetNote: "Avis Google vérifiés via Trustindex.",
    consentGate:
      "Le widget d’avis est fourni par Trustindex : il ne se charge qu’après votre consentement aux cookies. Vous pouvez lire les avis sur Google dès maintenant.",
    iframeTitle: "Avis Google vérifiés de Domus Tua (Trustindex)",
    googleCta: "Lire les avis sur Google",
    awardHint: "ouvrir le profil de Domus Tua (nouvel onglet)",
    all: "Lire tous les avis",
  },
  de: {
    eyebrow: "Was man über uns sagt",
    google: "Google-Bewertungen",
    description:
      "Echte Geschichten vom Kanal: Kundenbewertungen, im Video erzählte und mit Open Domus verkaufte Häuser und das Team, das man kennt, bevor man es trifft.",
    listLabel: "Die Geschichten im Video",
    play: "Ansehen",
    prev: "Vorheriges Video",
    next: "Nächstes Video",
    widgetTitle: "Von Trustindex verifiziert",
    widgetNote: "Google-Bewertungen, verifiziert über Trustindex.",
    consentGate:
      "Das Bewertungs-Widget stammt von Trustindex: es lädt erst nach Ihrer Cookie-Einwilligung. Die Bewertungen können Sie sofort auf Google lesen.",
    iframeTitle: "Verifizierte Google-Bewertungen von Domus Tua (Trustindex)",
    googleCta: "Bewertungen auf Google lesen",
    awardHint: "das Profil von Domus Tua öffnen (neuer Tab)",
    all: "Alle Bewertungen lesen",
  },
  es: {
    eyebrow: "Lo que dicen de nosotros",
    google: "reseñas de Google",
    description:
      "Las historias reales del canal: las reseñas de los clientes, las casas contadas en vídeo y vendidas con Open Domus y el equipo que conoces antes de conocerlo.",
    listLabel: "Las historias en vídeo",
    play: "Ver",
    prev: "Vídeo anterior",
    next: "Vídeo siguiente",
    widgetTitle: "Verificadas por Trustindex",
    widgetNote: "Reseñas de Google verificadas mediante Trustindex.",
    consentGate:
      "El widget de reseñas es de Trustindex: se carga solo tras tu consentimiento de cookies. Puedes leer las reseñas en Google ahora mismo.",
    iframeTitle: "Reseñas de Google verificadas de Domus Tua (Trustindex)",
    googleCta: "Leer las reseñas en Google",
    awardHint: "abrir el perfil de Domus Tua (nueva pestaña)",
    all: "Leer todas las reseñas",
  },
} as const;

// Le due frecce: cerchio a filo, l'unica curva ammessa (icon-button).
const arrowClass =
  "flex h-14 w-14 items-center justify-center rounded-full border border-ink text-ink transition-colors duration-300 hover:border-red hover:bg-red hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";

export default function Voci() {
  const { locale } = useLocale();
  const c = copy[locale];
  const awardYears = site.award.years.join(" · ");

  // Il cancello del consenso è lo stesso di StarReviews/Reviews: senza
  // «accepted» il widget non nasce e resta la via verso Google.
  const consent = useConsent();
  const showTrustindex = site.embeds.trustindexLoader.length > 0 && consent === "accepted";
  const awaitingConsent = site.embeds.trustindexLoader.length > 0 && consent !== "accepted";

  // Il video aperto in pagina, o null (stesso schema del vecchio muro).
  const [open, setOpen] = useState<{ id: string; title: string } | null>(null);
  const railRef = useRef<HTMLUListElement | null>(null);

  // Le frecce spostano di poco più di mezza rotaia: lo snap fa il resto.
  const scrollBy = (dir: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.6, behavior: "smooth" });
  };

  return (
    <section id="recensioni" className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <TextLines as="h2" className="tnum mt-6 font-display text-d1 font-medium text-ink">
          {`${ratingLabel(locale)}/5 · ${site.reviewsCount} ${c.google}`}
        </TextLines>
        <Reveal>
          <p className="lead mt-8">{c.description}</p>
        </Reveal>
      </div>

      {/* Carosello nativo: la rotaia sfora i margini (px-[8vw] sulla lista,
          non sulla sezione) così la tessera successiva si vede spuntare. */}
      <div className="relative mt-[clamp(3rem,8vh,6rem)]">
        <ul
          ref={railRef}
          aria-label={c.listLabel}
          className="flex snap-x snap-mandatory gap-[3vw] overflow-x-auto px-[5vw] pb-4 [scrollbar-width:none] scroll-px-[5vw] md:px-[8vw] md:scroll-px-[8vw] [&::-webkit-scrollbar]:hidden"
        >
          {wallVideos
              /* Il video in evidenza vive già nel capitolo «Come lavoriamo»
                 (in verticale, come è stato girato): qui restano le voci dei
                 clienti, non lo stesso film due volte. */
              .filter((v) => v.id !== site.videos.featured.id)
              .map((v) => (
            <li key={v.id} className="w-[86vw] shrink-0 snap-start lg:w-[58vw]">
              {/* Resta un LINK con l'href vero: chi ha JS guarda in pagina,
                  chi non ce l'ha (o usa cmd/ctrl/tasto centrale) trova YouTube. */}
              <a
                href={youtubeWatch(v.id)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${c.play}: ${v.title}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  setOpen({ id: v.id, title: v.title });
                }}
                className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
              >
                <span className="relative block aspect-video overflow-hidden bg-cream-deep">
                  <YoutubeThumb
                    id={v.id}
                    alt=""
                    sizes="(max-width: 1024px) 86vw, 58vw"
                    className="object-cover"
                  />
                  <span className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 group-hover:scale-105">
                    <Play className="ml-1 h-7 w-7" />
                  </span>
                </span>
                <span className="mt-4 block text-body text-ink">{v.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="dt-row mt-6 flex gap-3">
          <button type="button" aria-label={c.prev} onClick={() => scrollBy(-1)} className={arrowClass}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button type="button" aria-label={c.next} onClick={() => scrollBy(1)} className={arrowClass}>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Il sigillo, come una riga di testo: niente chip, niente pillola. */}
      <div className="dt-row mt-[clamp(3rem,8vh,6rem)]">
        <Reveal>
          <a
            href={site.award.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${site.award.label} ${awardYears} — ${c.awardHint}`}
            className="inline-flex items-center gap-4 text-body text-ink"
          >
            <Image
              src="/badges/wikicasa-top-agency.svg"
              alt=""
              width={84}
              height={40}
              unoptimized
            />
            <span>
              <span className="font-semibold">{site.award.label}</span>{" "}
              <span className="text-graphite">{awardYears}</span>
            </span>
          </a>
        </Reveal>
      </div>

      {/* Il widget Trustindex (invariato) dietro il cancello del consenso.
          `data-reviews-widget` è l'appiglio della suite e2e. */}
      <div className="dt-row mt-[clamp(4rem,10vh,8rem)]">
        <div data-reviews-widget>
          <p className="text-ui font-semibold uppercase tracking-[0.08em] text-graphite">
            {c.widgetTitle}
          </p>
          {showTrustindex ? (
            <div className="mt-6">
              <TrustindexEmbed title={c.iframeTitle} />
            </div>
          ) : (
            <div className="mt-6">
              <p className="max-w-[50ch] text-body text-graphite">
                {awaitingConsent ? c.consentGate : c.widgetNote}
              </p>
              <Cta
                href={site.googleReviewsUrl}
                variant="ghost"
                className="mt-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.googleCta}
              </Cta>
            </div>
          )}
        </div>
        <div className="mt-8">
          <Cta href="/recensioni" variant="ghost">
            {c.all}
          </Cta>
        </div>
      </div>

      <VideoLightbox video={open} onClose={() => setOpen(null)} />
    </section>
  );
}
