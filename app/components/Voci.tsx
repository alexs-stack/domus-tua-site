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
//
// COREOGRAFIA (Alberto, 13 settembre 2026: A18-A20; spec coreografia §3.7, CAT §4):
// il carosello arriva da destra. A ogni ingresso dal basso le tessere in vista si
// aprono col parallelogramma di Era e l'immagine scorre da xPercent 25 a 0; al primo
// ingresso per montaggio scorre anche la rotaia. Risalendo, sotto la linea del 70 %,
// si richiudono verso sinistra: replay nei due versi, come chiede C22 dal 4 agosto.
// Innesco a IntersectionObserver (firma `voci` in chapters.ts), perché subito dopo i
// 360svh delle stelle ScrollTrigger sfasava. Niente scala 1,5 di Era: sopra
// `dt-still-trim` (1,43) non c'è margine di pixel. ECCEZIONE MOTIVATA alla regola del
// 4 agosto «nei replay nessun bersaglio che si sposta sotto il puntatore»: il link non
// riceve mai clip né transform, la rotaia trasla solo al primo ingresso sul bordo
// basso del viewport, nei replay si muovono solo clip e immagine dentro il link, il cui
// box resta cliccabile. Il play resta fuori dall'immagine che scorre.
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
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import { ratingLabel, site } from "../lib/site";
import { wallVideos, youtubeWatch } from "../lib/videos";
import { gsap, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters } from "../lib/motion/chapters";
import { clipSlant } from "../lib/motion/clip";

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

// L'uscita del parallelogramma di Era, per A20 di Alberto (fedeltà letterale: animateSlide,
// CAT §4; spec coreografia §3.7): da un quadrilatero più largo della tessera a una linea
// sul bordo sinistro, in 0,6 s.
const SLIDE_OUT_FROM = "polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)";
const SLIDE_OUT_TO = "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)";
const SLIDE_OUT_DUR = 0.6;

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

  useGSAP(
    (_context, contextSafe) => {
      const rail = railRef.current;
      if (!rail || !contextSafe) return;
      const sig = chapters.voci.signature;
      if (!("io" in sig.trigger) || !("dur" in sig.time)) return;
      const { rootMargin, threshold } = sig.trigger.io;
      const { dur, delay, stagger } = sig.time;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const slides = gsap.utils.toArray<HTMLElement>("[data-voci-slide]", rail);
        const inners = (list: HTMLElement[]) =>
          list.map((s) => s.querySelector<HTMLElement>("[data-voci-slide-inner]")).filter((n): n is HTMLElement => !!n);
        // Tessere in vista nella rotaia (A20, spec §3.7): offsetLeft − scrollLeft, che la traslazione della rotaia non tocca.
        const inVista = () =>
          slides.filter((s) => {
            const li = s.closest("li");
            if (!li) return false;
            const left = li.offsetLeft - rail.offsetLeft - rail.scrollLeft;
            return left < rail.clientWidth && left + li.offsetWidth > 0;
          });
        const tutti = [rail, ...slides, ...inners(slides)];

        let state: "shown" | "hidden" = "shown";
        let primoIngresso = false;
        // A20, spec §3.7 e §2.4 («Armamento»): stato chiuso scritto solo se al montaggio la rotaia è sotto la piega.
        if (rail.getBoundingClientRect().top > window.innerHeight) {
          const v = inVista();
          gsap.set(v, { clipPath: clipSlant(0) });
          gsap.set(inners(v), { xPercent: 25 });
          gsap.set(rail, { xPercent: 25 });
          state = "hidden";
          primoIngresso = true;
        }

        const enter = contextSafe(() => {
          state = "shown";
          const v = inVista();
          const resto = slides.filter((s) => !v.includes(s));
          gsap.set([...resto, ...inners(resto)], { clearProps: "clipPath,transform" });
          if (primoIngresso) {
            primoIngresso = false;
            gsap.fromTo(
              rail,
              { xPercent: 25 },
              { xPercent: 0, duration: dur, ease: sig.ease, overwrite: true, onComplete: () => gsap.set(rail, { clearProps: "transform" }) },
            );
          }
          gsap.fromTo(
            v,
            { clipPath: clipSlant(0) },
            {
              clipPath: clipSlant(1),
              duration: dur,
              delay,
              stagger,
              ease: sig.ease,
              overwrite: true,
              onComplete: () => gsap.set(v, { clearProps: "clipPath" }),
            },
          );
          gsap.fromTo(
            inners(v),
            { xPercent: 25 },
            {
              xPercent: 0,
              duration: dur,
              delay,
              stagger,
              ease: sig.ease,
              overwrite: true,
              onComplete: () => gsap.set(inners(v), { clearProps: "transform" }),
            },
          );
        });

        const exit = contextSafe(() => {
          state = "hidden";
          const v = inVista();
          gsap.fromTo(v, { clipPath: SLIDE_OUT_FROM }, { clipPath: SLIDE_OUT_TO, duration: SLIDE_OUT_DUR, ease: sig.ease, overwrite: true });
          gsap.fromTo(inners(v), { xPercent: 0 }, { xPercent: -25, duration: SLIDE_OUT_DUR, ease: sig.ease, overwrite: true });
        });

        let primoCallback = true;
        const io = new IntersectionObserver(
          ([e]) => {
            if (!e) return;
            // Il primo callback arriva all'observe e descrive la posizione dell'armamento, non un
            // passaggio: con la rotaia fra il 70 % e il 100 % del viewport (ricarica a metà pagina, D22)
            // le tessere restano aperte (spec §2.4, «Armamento»: in viewport nessuna uscita).
            if (primoCallback) {
              primoCallback = false;
              if (!e.isIntersecting) return;
            }
            if (e.isIntersecting) {
              if (state === "hidden") enter();
            } else if (state === "shown" && e.rootBounds && e.boundingClientRect.top > e.rootBounds.bottom) {
              exit();
            }
          },
          { rootMargin, threshold },
        );
        io.observe(rail);

        // Tastiera (spec §2.4, «Reti»: focusin in un gruppo non shown → shown, applicata alla rotaia
        // per A18-A20): una tessera che prende il fuoco a rotaia chiusa si apre subito.
        const onFocus = contextSafe(() => {
          if (state === "shown") return;
          state = "shown";
          primoIngresso = false;
          gsap.killTweensOf(tutti);
          gsap.set(tutti, { clearProps: "clipPath,transform" });
        });
        rail.addEventListener("focusin", onFocus);

        return () => {
          io.disconnect();
          rail.removeEventListener("focusin", onFocus);
          gsap.killTweensOf(tutti);
          gsap.set(tutti, { clearProps: "clipPath,transform" });
        };
      });
    },
    { scope: railRef },
  );

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
        <SplitTitle as="h2" className="mt-6 max-w-[16ch] font-display text-d2">
          {c.listLabel}
        </SplitTitle>
        <Reveal delay={80}>
          <p className="tnum mt-4 text-ui text-graphite">
            {`${ratingLabel(locale)}/5 · ${site.reviewsCount} ${c.google}`}
          </p>
        </Reveal>
        <Lead className="mt-6">{c.description}</Lead>
      </div>

      {/* Carosello nativo. Da desktop TRE tessere per schermata (32vw): a 58vw
          se ne vedeva una e un terzo, e il carosello sembrava rotto. Sul
          telefono la tessera è a tutta larghezza (niente margini, snap al
          centro): una foto per volta, senza spicchi della successiva. */}
      <div className="relative mt-[clamp(3rem,8vh,6rem)] overflow-x-clip">
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
                    giorno in cui arrivano i fotogrammi puliti. `data-bg="foto"`:
                    la copertina è zona foto per il segno fisso (A21 di
                    Alberto, spec coreografia §6.1). */}
                <span data-voci-slide className="dt-media-full block" data-bg="foto">
                  {/* L'immagine che scorre da destra (A20 di Alberto, spec coreografia §3.7): absolute
                      a filo della tessera, così `fill` di next/image ha il suo
                      contenitore e `dt-still-trim` resta sull'img. */}
                  <span data-voci-slide-inner className="absolute inset-0 block">
                    <YoutubeThumb
                      id={v.id}
                      alt=""
                      sizes="(max-width: 768px) 143vw, (max-width: 1024px) 66vw, 46vw"
                      className="dt-still-trim object-cover"
                    />
                  </span>
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
