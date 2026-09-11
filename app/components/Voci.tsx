"use client";

// Voci — "Cosa dicono di noi" (rivista bianca, 2026-09-10, punto 9 della
// cliente: rifare «Il muro delle voci»). Riferimento: la sezione
// «COSA DICONO DI NOI» di immobiliaregoldengoal.it — titolo enorme e uno
// slider orizzontale con due frecce.
//
// Il voto e il conteggio si leggono da site.ts e non si scrivono mai a mano —
// ma dal 2026-09-11 non sono più il titolo d1 del capitolo: lo stesso numero
// stava già nell'hero e nelle cinque stelle qui sopra, due volte enorme. Qui
// è una riga a 16px sotto l'eyebrow.
//
// Sotto, i video reali del canale in un carosello a
// scorrimento NATIVO (overflow + scroll-snap, le frecce fanno scrollBy):
// nessun pin, nessun ScrollTrigger, nessuna sezione sticky. In coda il widget
// Trustindex, invariato e dietro lo stesso cancello del consenso di prima.
import { useRef, useState } from "react";
import Image from "next/image";
import YoutubeThumb from "./YoutubeThumb";
import VideoLightbox from "./VideoLightbox";
import TrustindexEmbed from "./TrustindexEmbed";
import Reveal from "./Reveal";
import { ArrowLeft, ArrowRight, Play } from "./Icons";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { useConsent } from "../lib/consent";
import TextLines from "./motion/TextLines";
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
    <section id="voci" className="dt-chapter bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        {/* Il voto NON è più il titolo d1 di questo capitolo: lo dicono già
            l'hero e le cinque stelle (#recensioni), che sta qui sopra — tre
            volte lo stesso numero, due delle quali enormi. Qui resta la riga
            del conteggio a 16px, sempre da site.ts (mai scritta a mano). */}
        {/* Un titolo ci vuole: senza, questo era l'unico capitolo della home
            senza testa in Playfair, e il salto dall'occhiello al carosello
            leggeva come un buco. Ma NON e' il voto: quello lo dicono gia'
            l'hero e le cinque stelle qui sopra. E' il nome della cosa che si
            guarda, e il conteggio gli sta sotto a 16px. */}
        <TextLines as="h2" className="mt-6 max-w-[16ch] font-display text-d2">
          {c.listLabel}
        </TextLines>
        <Reveal delay={80}>
          <p className="tnum mt-4 text-ui text-graphite">
            {`${ratingLabel(locale)}/5 · ${site.reviewsCount} ${c.google}`}
          </p>
        </Reveal>
        <Reveal delay={140}>
          <p className="lead mt-6">{c.description}</p>
        </Reveal>
      </div>

      {/* Carosello nativo. Da desktop TRE tessere per schermata (32vw): a 58vw
          se ne vedeva una e un terzo, e il carosello sembrava rotto. Sul
          telefono la tessera è a tutta larghezza (niente margini, snap al
          centro): una foto per volta, senza spicchi della successiva. */}
      <div className="relative mt-[clamp(3rem,8vh,6rem)]">
        <ul
          ref={railRef}
          aria-label={c.listLabel}
          className="flex snap-x snap-mandatory overflow-x-auto pb-4 [scrollbar-width:none] md:gap-[3vw] md:px-[8vw] md:scroll-px-[8vw] [&::-webkit-scrollbar]:hidden"
        >
          {wallVideos
              /* Il video in evidenza vive già nel capitolo «Come lavoriamo»
                 (in verticale, come è stato girato): qui restano le voci dei
                 clienti, non lo stesso film due volte. */
              .filter((v) => v.id !== site.videos.featured.id)
              .map((v) => (
            <li
              key={v.id}
              className="w-full shrink-0 snap-center md:w-[46vw] md:snap-start lg:w-[32vw]"
            >
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
                {/* La copertina è 16:9 come il video: il modulo «banda».
                    `dt-still-trim` rifila la grafica cotta dentro la copertina
                    YouTube — la banda col titolo in alto, il ritratto in cerchio
                    con le stelline e il logo «VIDEO RECENSIONE» in basso a
                    sinistra — tenendo il 70% in basso a destra, dove c'e' solo
                    il filmato. Altrimenti sopra un titolo e un play gia'
                    stampati nei pixel ce ne mettevamo altri due. Sparisce il
                    giorno in cui arrivano i fotogrammi puliti. */}
                <span className="dt-media-full block">
                  <YoutubeThumb
                    id={v.id}
                    alt=""
                    sizes="(max-width: 768px) 143vw, (max-width: 1024px) 66vw, 46vw"
                    className="dt-still-trim object-cover"
                  />
                  {/* 56px sul telefono: il cerchio da 96 copriva le facce su
                      una tessera larga uno schermo. 96 resta da desktop. */}
                  <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 group-hover:scale-105 lg:h-24 lg:w-24">
                    <Play className="ml-1 h-5 w-5 lg:h-7 lg:w-7" />
                  </span>
                </span>
                {/* Sul telefono la foto è a filo dello schermo: il margine del
                    testo se lo prende la didascalia, non la tessera. */}
                <span className="mt-4 block px-[5vw] text-body text-ink md:px-0">{v.title}</span>
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
