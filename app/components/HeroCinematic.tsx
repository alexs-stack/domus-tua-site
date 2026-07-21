"use client";

// HeroCinematic — apertura cinematografica full-bleed di Domus Tua.
// Poster immagine reale (LCP) sempre presente: crop landscape su desktop, ritratto su mobile.
// Video-ready: quando i file /media esistono e enabled=true, il video parte SOLO su desktop,
// senza prefers-reduced-motion e senza data-saver, e viene montato dopo il paint del poster
// (fuori dal percorso LCP). Fallback automatico al poster se il video fallisce.
// Girato del brand (nessuno stock, nessuna finzione): docs/hero-brand-film-shotlist.md.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowRight } from "./Icons";
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
    pause: "Metti in pausa il video",
    play: "Riprendi il video",
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
    pause: "Pause the video",
    play: "Resume the video",
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
    pause: "Mettre la vidéo en pause",
    play: "Reprendre la vidéo",
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
    pause: "Video pausieren",
    play: "Video fortsetzen",
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
    pause: "Pausar el vídeo",
    play: "Reanudar el vídeo",
  },
};

export default function HeroCinematic() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [playVideo, setPlayVideo] = useState(false);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Il video parte solo su desktop, senza reduced-motion, senza data-saver, e se i file sono
  // attivati. Il <video> viene montato SOLO dopo il primo paint del poster (LCP), così la
  // selezione della sorgente non entra nel percorso critico dell'immagine LCP.
  useEffect(() => {
    if (!heroCinematic.enabled) return;
    const okMotion = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    const okWidth = window.matchMedia("(min-width: 768px)").matches;
    // Data-saver / connessioni lente: niente video (rispetta la scelta dell'utente e i costi dati).
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const dataSaver = conn?.saveData === true || (conn?.effectiveType ? /2g/.test(conn.effectiveType) : false);
    if (!okMotion || !okWidth || dataSaver) return;

    // Rimanda il mount del video oltre il paint LCP.
    let timer = 0;
    let idleId = 0;
    const hasIdle = "requestIdleCallback" in window;
    if (hasIdle) {
      idleId = window.requestIdleCallback(() => setPlayVideo(true), { timeout: 2500 });
    } else {
      timer = window.setTimeout(() => setPlayVideo(true), 1200);
    }
    return () => {
      if (hasIdle) window.cancelIdleCallback(idleId);
      else window.clearTimeout(timer);
    };
  }, []);

  // Validazione asset in sviluppo: se il video è attivato ma i file mancano (404), avvisa il
  // team invece di fallire in silenzio. In produzione non gira (nessun costo, nessun rumore).
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !heroCinematic.enabled) return;
    (async () => {
      for (const src of [heroCinematic.mp4, heroCinematic.webm, heroCinematic.poster]) {
        try {
          const r = await fetch(src, { method: "HEAD" });
          if (!r.ok) console.warn(`[HeroCinematic] asset mancante o non servito: ${src} (HTTP ${r.status})`);
        } catch {
          console.warn(`[HeroCinematic] asset non raggiungibile: ${src}`);
        }
      }
    })();
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <section id="top" className="relative flex min-h-[92dvh] w-full items-end overflow-hidden bg-ink text-cream">
      {/* Poster immagine reale (LCP + fallback). Desktop = crop landscape; mobile = crop ritratto.
          Focal point per orientamento così il soggetto non viene mai tagliato male. */}
      <Image
        src={heroCinematic.base}
        alt={heroCinematic.baseAlt}
        fill
        priority
        sizes="100vw"
        className="ken-burns hidden object-cover md:block"
        style={{ objectPosition: heroCinematic.focalDesktop }}
      />
      <Image
        src={heroCinematic.baseMobile}
        alt={heroCinematic.baseMobileAlt}
        fill
        priority
        sizes="100vw"
        className="ken-burns object-cover md:hidden"
        style={{ objectPosition: heroCinematic.focalMobile }}
      />

      {/* Video overlay (opzionale): copre il poster quando disponibile. AV1 → VP9 → H.264. */}
      {playVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          poster={heroCinematic.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => {
            if (process.env.NODE_ENV !== "production")
              console.warn("[HeroCinematic] video non riproducibile → fallback al poster.");
            setPlayVideo(false);
          }}
        >
          <source src={heroCinematic.av1} type='video/webm; codecs="av01.0.05M.08"' />
          <source src={heroCinematic.webm} type="video/webm" />
          <source src={heroCinematic.mp4} type="video/mp4" />
        </video>
      )}

      {/* Gradienti per leggibilità del testo (preservano l'immagine e il contrasto del titolo) */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 to-transparent" />

      {/* Cornice Segno Domus sul canvas */}
      <SegnoDomusVideoFrame />

      {/* Controllo pausa/play discreto (solo se il video è montato). Niente audio in autoplay. */}
      {playVideo && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label={paused ? c.play : c.pause}
          className="absolute bottom-6 right-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-cream/30 bg-ink/40 text-cream backdrop-blur-sm transition-all duration-300 hover:border-cream/60 hover:bg-ink/60 active:scale-95"
        >
          {paused ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          )}
        </button>
      )}

      {/* Contenuto — essenziale: badge, titolo, una frase, fondatrice, 2 CTA. La prova sociale
          secondaria vive nella proof strip subito sotto (Authority), non qui. */}
      <div className="relative z-20 mx-auto w-full max-w-[1240px] px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-36">
        <div className="max-w-3xl">
          <SegnoDomusBadge light className="backdrop-blur-sm">{c.badge}</SegnoDomusBadge>

          <h1 className="mt-6 font-display text-[2.5rem] font-medium leading-[1.02] tracking-[-0.02em] text-cream balance sm:text-6xl lg:text-[4.2rem]">
            <WordReveal as="span" className="block" text={c.title1} immediate />
            <WordReveal as="span" className="block italic text-red-soft" text={c.title2} immediate />
          </h1>

          <p
            className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-cream/85 sm:text-lg"
            style={{ animation: "dt-fade-rise .5s var(--ease-out-expo) both", animationDelay: "0ms" }}
          >
            {c.subcopy}
          </p>

          {/* Fondatrice */}
          <p
            className="mt-5 flex items-center gap-2.5 text-sm font-medium text-cream/80"
            style={{ animation: "dt-fade-rise .5s var(--ease-out-expo) both", animationDelay: "60ms" }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red font-display text-xs font-semibold text-white">
              RR
            </span>
            {c.founder}
          </p>

          {/* CTA — una primaria (valutazione, rosso pieno) + una secondaria (ricerca casa) */}
          <div
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            style={{ animation: "dt-fade-rise .5s var(--ease-out-expo) both", animationDelay: "120ms" }}
          >
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
          </div>
        </div>
      </div>

      {/* Scroll cue: sottile linea verticale, solo desktop (reduced-motion gestito globalmente) */}
      <span
        aria-hidden
        className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 md:block h-8 w-px bg-cream/40"
        style={{ animation: "dt-scrollcue 1.8s var(--ease-soft) infinite" }}
      />
    </section>
  );
}
