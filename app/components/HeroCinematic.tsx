"use client";

// HeroCinematic — apertura cinematografica full-bleed di Domus Tua.
// Canvas video/immagine a tutta larghezza, energia + emozione + prova sociale + sicurezza.
// Video-ready: quando i file /media esistono e enabled=true, parte (desktop, no reduced-motion).
// Finché mancano, resta la foto reale di Raffaella + team come poster. Vedi docs/hero-video.md.
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowRight, Star, Play } from "./Icons";
import { site } from "../lib/site";
import { heroCinematic } from "../lib/media";
import WordReveal from "./WordReveal";
import { SegnoDomusVideoFrame, SegnoDomusBadge } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    badge: "Agenzia immobiliare · Tradate dal 2007",
    title1: "Vendere casa, senza stress.",
    title2: "Acquistare casa, con sicurezza.",
    subcopy:
      "Emozione, documenti verificati e metodo: Domus Tua ti accompagna dalla prima visita al rogito.",
    founder: "Con Raffaela Rizza e il team Domus Tua",
    ctaValuta: "Valuta il tuo immobile",
    ctaCerco: "Cerco casa",
    ctaVideo: "Guarda il video",
    reviews: "Oltre 500 recensioni",
    ratingOn: "Google",
    place: "Tradate · Varese",
  },
  en: {
    badge: "Real estate agency · Tradate since 2007",
    title1: "Sell your home, stress-free.",
    title2: "Buy your home, with confidence.",
    subcopy:
      "Emotion, verified documents and method: Domus Tua guides you from the first viewing to the deed.",
    founder: "With Raffaela Rizza and the Domus Tua team",
    ctaValuta: "Value your property",
    ctaCerco: "I'm looking for a home",
    ctaVideo: "Watch the video",
    reviews: "Over 500 reviews",
    ratingOn: "Google",
    place: "Tradate · Varese",
  },
  fr: {
    badge: "Agence immobilière · Tradate depuis 2007",
    title1: "Vendre sans stress.",
    title2: "Acheter en toute sécurité.",
    subcopy:
      "Émotion, documents vérifiés et méthode : Domus Tua vous accompagne de la première visite à l'acte.",
    founder: "Avec Raffaela Rizza et l'équipe Domus Tua",
    ctaValuta: "Estimez votre bien",
    ctaCerco: "Je cherche un bien",
    ctaVideo: "Voir la vidéo",
    reviews: "Plus de 500 avis",
    ratingOn: "Google",
    place: "Tradate · Varese",
  },
  de: {
    badge: "Immobilienagentur · Tradate seit 2007",
    title1: "Verkaufen ohne Stress.",
    title2: "Kaufen mit Sicherheit.",
    subcopy:
      "Emotion, geprüfte Dokumente und Methode: Domus Tua begleitet Sie von der ersten Besichtigung bis zum Notartermin.",
    founder: "Mit Raffaela Rizza und dem Domus-Tua-Team",
    ctaValuta: "Immobilie bewerten",
    ctaCerco: "Ich suche ein Zuhause",
    ctaVideo: "Video ansehen",
    reviews: "Über 500 Bewertungen",
    ratingOn: "Google",
    place: "Tradate · Varese",
  },
  es: {
    badge: "Agencia inmobiliaria · Tradate desde 2007",
    title1: "Vender sin estrés.",
    title2: "Comprar con seguridad.",
    subcopy:
      "Emoción, documentos verificados y método: Domus Tua te acompaña desde la primera visita hasta la escritura.",
    founder: "Con Raffaela Rizza y el equipo Domus Tua",
    ctaValuta: "Valora tu inmueble",
    ctaCerco: "Busco casa",
    ctaVideo: "Ver el vídeo",
    reviews: "Más de 500 reseñas",
    ratingOn: "Google",
    place: "Tradate · Varese",
  },
};

export default function HeroCinematic() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [playVideo, setPlayVideo] = useState(false);

  // Il video parte solo su desktop e se l'utente non ha ridotto le animazioni,
  // e solo se i file sono attivati. Su mobile / reduced-motion resta la foto (leggera).
  // Il <video> viene montato SOLO dopo il primo paint del poster (LCP), così la
  // selezione della sorgente non entra nel percorso critico dell'immagine LCP.
  useEffect(() => {
    if (!heroCinematic.enabled) return;
    const okMotion = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    const okWidth = window.matchMedia("(min-width: 768px)").matches;
    if (!okMotion || !okWidth) return;

    // Rimanda il mount del video oltre il paint LCP.
    let raf = 0;
    let idleId = 0;
    // Feature-detect via "in": i tipi DOM danno requestIdleCallback come sempre presente,
    // ma alcuni browser (Safari datati) non ce l'hanno, quindi serve il fallback setTimeout.
    const hasIdle = "requestIdleCallback" in window;
    if (hasIdle) {
      idleId = window.requestIdleCallback(() => setPlayVideo(true), { timeout: 2500 });
    } else {
      raf = window.setTimeout(() => setPlayVideo(true), 1200);
    }

    return () => {
      if (hasIdle) window.cancelIdleCallback(idleId);
      else window.clearTimeout(raf);
    };
  }, []);

  const chips = ["Open Domus", "Domus D.O.C.", c.place];

  return (
    <section id="top" className="relative flex min-h-[92dvh] w-full items-end overflow-hidden bg-ink text-cream">
      {/* Base sempre presente: foto reale (poster finché non c'è il video) */}
      <Image
        src={heroCinematic.base}
        alt={heroCinematic.baseAlt}
        fill
        priority
        sizes="100vw"
        className="ken-burns object-cover"
        style={{ objectPosition: "50% 35%" }}
      />

      {/* Video overlay (opzionale, video-ready): copre la base quando disponibile */}
      {playVideo && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          poster={heroCinematic.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setPlayVideo(false)}
        >
          <source src={heroCinematic.webm} type="video/webm" />
          <source src={heroCinematic.mp4} type="video/mp4" />
        </video>
      )}

      {/* Gradienti per leggibilità del testo */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 to-transparent" />

      {/* Cornice Segno Domus sul canvas */}
      <SegnoDomusVideoFrame />

      {/* Contenuto */}
      <div className="relative z-20 mx-auto w-full max-w-[1240px] px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-36">
        <div className="max-w-3xl">
          <SegnoDomusBadge light className="backdrop-blur-sm">{c.badge}</SegnoDomusBadge>

          <h1 className="mt-6 font-display text-[2.5rem] font-medium leading-[1.02] tracking-[-0.02em] text-cream balance sm:text-6xl lg:text-[4.2rem]">
            <WordReveal as="span" className="block" text={c.title1} />
            <WordReveal as="span" className="block text-red-soft" text={c.title2} startDelay={240} />
          </h1>

          <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-cream/85 sm:text-lg">
            {c.subcopy}
          </p>

          {/* Founder label */}
          <p className="mt-5 flex items-center gap-2.5 text-sm font-medium text-cream/80">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red font-display text-xs font-semibold text-white">
              RR
            </span>
            {c.founder}
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#contatti"
              className="group flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-7 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              {c.ctaValuta}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href="#cerca"
              className="group flex items-center justify-center gap-2 rounded-full border border-cream/35 bg-cream/5 px-7 py-4 text-base font-semibold text-cream backdrop-blur-sm transition-all duration-300 hover:bg-cream/15"
            >
              {c.ctaCerco}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href={heroCinematic.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2.5 px-3 py-4 text-base font-medium text-cream/85 transition-colors hover:text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Play className="h-3.5 w-3.5" />
              </span>
              {c.ctaVideo}
            </a>
          </div>

          {/* Trust chips */}
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-cream/15 pt-6">
            <a href="#recensioni" className="flex items-center gap-2 hover:opacity-90">
              <span className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-red-soft" />
                ))}
              </span>
              <span className="text-sm font-semibold text-cream">
                {site.rating}/5 {c.ratingOn}
              </span>
            </a>
            <span className="text-sm font-medium text-cream/75">{c.reviews}</span>
            {chips.map((t) => (
              <span key={t} className="text-[0.82rem] font-medium text-cream/70">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
