"use client";

// HeroCinematic — apertura cinematografica full-bleed di Domus Tua.
// Canvas video/immagine a tutta larghezza, energia + emozione + prova sociale + sicurezza.
// Video-ready: quando i file /media esistono e enabled=true, parte (desktop, no reduced-motion).
// Finché mancano, resta la foto reale di Raffaella + team come poster. Vedi docs/hero-video.md.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowRight, Star, Play } from "./Icons";
import { site } from "../lib/site";
import { heroCinematic } from "../lib/media";
import WordReveal from "./WordReveal";
import Signature from "./Signature";
import Magnetic from "./motion/Magnetic";
import { SegnoDomusVideoFrame, SegnoDomusBadge } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";
import { INTRO_EVENT, isIntroRunning } from "./motion/Preloader";

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
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const mediaDepthRef = useRef<HTMLDivElement | null>(null);
  const frameWrapRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentDepthRef = useRef<HTMLDivElement | null>(null);
  const cueRef = useRef<HTMLSpanElement | null>(null);

  // Partenza cinematica "frame-in": uscendo dallo scroll il canvas full-bleed si
  // contrae in una tavola editoriale con angoli arrotondati (clip-path) mentre
  // resta "indietro" in profondità; il contenuto sale più veloce e sfuma, la
  // cornice Segno svanisce. Solo scrub post-idratazione: SSR/LCP intatti.
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const mm = gsap.matchMedia();
      // Gate desktop: su mobile il clip-path per frame sul layer LCP full-viewport
      // costerebbe un repaint/maschera a ogni tick di scroll (Safari iOS, Android low-end).
      mm.add(`${MQ.motionOk} and ${MQ.desktop}`, () => {
        const scrub = {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        } as const;
        // will-change solo quando lo scrub è attivo (revert lo rimuove).
        gsap.set(mediaRef.current, { willChange: "transform" });
        const tl = gsap.timeline({ scrollTrigger: scrub, defaults: { ease: "none" } });
        tl.fromTo(
          mediaRef.current,
          { clipPath: "inset(0% 0% 0% 0% round 0rem)" },
          {
            clipPath: "inset(6% 4% 10% 4% round 2.5rem)",
            // yPercent deve restare sotto l'inset bottom al netto dello scale
            // (1.05 spinge il bordo giù di ~2%): con 6 il bordo inferiore
            // arrotondato resta visibile (~2%) per tutto lo scrub.
            yPercent: 6,
            scale: 1.05,
          },
          0
        )
          .to(contentRef.current, { yPercent: -14, opacity: 0.2 }, 0)
          .to(frameWrapRef.current, { opacity: 0 }, 0);
        // Lo scroll cue sparisce appena il racconto comincia.
        gsap.to(cueRef.current, {
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top-=1", end: "top top-=140", scrub: true },
        });
      });
    },
    { scope: sectionRef }
  );

  // Coreografia d'ingresso — SOLO al handoff del preloader (prima visita di
  // sessione): il sipario copre la pagina, quindi è sicuro nascondere gli
  // stati DOPO il primo paint (LCP già registrata) e rivelarli in sequenza:
  // canvas che si apre (clip + scale sul wrapper, mai sull'IMG: il ken-burns
  // resta l'unico owner del transform dell'immagine), parole dell'H1 che
  // salgono dalle maschere con micro-rotazione, badge/copy/CTA/chips in coda.
  // Nelle visite successive non si nasconde nulla: restano i dt-fade-rise CSS
  // (che con reduced-motion vengono azzerati dalla regola globale).
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      if (!document.documentElement.hasAttribute("data-preloader")) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const words = section.querySelectorAll<HTMLElement>(".word-reveal .w");
        const badge = section.querySelector<HTMLElement>("[data-hero-badge]");
        const seq = gsap.utils.toArray<HTMLElement>("[data-hero-seq]", section);

        // Le CSS animation dt-fade-rise (fill both) vincerebbero sugli inline
        // style di GSAP: in modalità intro il timone passa tutto a GSAP.
        seq.forEach((el) => {
          el.style.animation = "none";
        });

        gsap.set(mediaRef.current, {
          clipPath: "inset(16% 10% 16% 10% round 2.5rem)",
          scale: 1.12,
        });
        // LCP: Chromium esclude le immagini full-viewport ("background"), quindi
        // l'LCP della home è il TESTO dell'hero. Sotto il sipario opaco gli
        // elementi restano DIPINTI a opacity 0.02 (opacity:0 li toglierebbe dai
        // candidati LCP fino a fine intro = LCP da 10s); lo stato coreografico
        // vero viene applicato al handoff, quando il sipario li copre ancora.
        gsap.set([...words, ...(badge ? [badge] : []), ...seq], { opacity: 0.02 });
        gsap.set([frameWrapRef.current, cueRef.current], { autoAlpha: 0 });

        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          // Stati di partenza reali, applicati mentre la zona è ancora coperta
          // dal sipario in apertura (si apre dal basso: l'H1 è l'ultima area).
          gsap.set(words, { yPercent: 130, rotate: 2.5, transformOrigin: "0% 100%", opacity: 1 });
          if (badge) gsap.set(badge, { y: 24, autoAlpha: 0 });
          gsap.set(seq, { y: 28, autoAlpha: 0 });
          const tl = gsap.timeline({ defaults: { ease: "domus" } });
          tl.to(
            mediaRef.current,
            {
              clipPath: "inset(0% 0% 0% 0% round 0rem)",
              scale: 1,
              duration: dur.hero,
              ease: "domus.inOut",
              // Libera clip/scale: lo scrub "frame-in" resta l'unico owner.
              clearProps: "clipPath,scale",
            },
            0
          );
          if (badge) tl.to(badge, { y: 0, autoAlpha: 1, duration: dur.short }, 0.12);
          tl.to(words, { yPercent: 0, rotate: 0, duration: dur.reveal, stagger: 0.055 }, 0.2)
            .to(seq, { y: 0, autoAlpha: 1, duration: dur.short, stagger: 0.09 }, 0.62)
            .to(frameWrapRef.current, { autoAlpha: 1, duration: 0.7, ease: "none" }, 0.9)
            .to(cueRef.current, { autoAlpha: 1, duration: 0.5, ease: "none" }, 1.2);
        };

        // Parte all'uscita del preloader (una sola timeline percepita);
        // safety: se l'evento va perso, si rivela comunque.
        window.addEventListener(INTRO_EVENT, play, { once: true });
        const safety = window.setTimeout(play, 4500);
        return () => {
          window.removeEventListener(INTRO_EVENT, play);
          window.clearTimeout(safety);
        };
      });
    },
    { scope: sectionRef }
  );

  // Profondità "camera viva" al puntatore — solo desktop + pointer fine +
  // motion ok. I target sono layer DEDICATI, senza altri owner del transform:
  // mediaRef ha già clip/scale/yPercent del frame-in, l'IMG il ken-burns CSS,
  // contentRef lo yPercent dello scrub e .w/[data-hero-seq] le timeline
  // d'intro — qui si muovono solo il wrapper media (±10px) e il blocco testo
  // (∓5px, direzione opposta = profondità). Nessun effetto sull'LCP: solo
  // transform post-idratazione, il paint del testo non cambia.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const media = mediaDepthRef.current;
      const content = contentDepthRef.current;
      if (!section || !media || !content) return;

      const mm = gsap.matchMedia();
      // Sintassi a oggetto: il callback rientra a ogni toggle di una singola
      // query, quindi le condizioni vanno riverificate TUTTE qui dentro.
      mm.add(
        { motionOk: MQ.motionOk, desktop: MQ.desktop, fine: MQ.finePointer },
        (ctx) => {
          const { motionOk, desktop, fine } = ctx.conditions as Record<string, boolean>;
          if (!motionOk || !desktop || !fine) return;

          // Overscan solo mentre l'effetto è attivo (stesso pattern di Paths):
          // ±10px non scoprono mai i bordi del layer video (scale 1), la foto
          // ha già il ken-burns ≥1.06. Niente will-change: mediaRef promuove
          // già un layer full-viewport, un secondo pinnato in GPU
          // raddoppierebbe la texture (vedi nota ken-burns in globals.css).
          gsap.set(media, { scale: 1.04 });

          const mediaX = gsap.quickTo(media, "x", { duration: 0.8, ease: "power3.out" });
          const mediaY = gsap.quickTo(media, "y", { duration: 0.8, ease: "power3.out" });
          const contentX = gsap.quickTo(content, "x", { duration: 0.8, ease: "power3.out" });
          const contentY = gsap.quickTo(content, "y", { duration: 0.8, ease: "power3.out" });

          // Parte solo a intro conclusa: durante il sipario il puntatore può
          // già muoversi sull'hero ma il timone è della coreografia sopra.
          // Safety allineato al handoff: se l'evento va perso, si arma comunque.
          let active = !isIntroRunning();
          const arm = () => {
            active = true;
          };
          let safety = 0;
          if (!active) {
            window.addEventListener(INTRO_EVENT, arm, { once: true });
            safety = window.setTimeout(arm, 4500);
          }

          const onMove = (e: PointerEvent) => {
            if (!active) return;
            const r = section.getBoundingClientRect();
            const nx = gsap.utils.clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1);
            const ny = gsap.utils.clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1);
            mediaX(nx * 10);
            mediaY(ny * 10);
            contentX(nx * -5);
            contentY(ny * -5);
          };
          const onLeave = () => {
            // Rientro morbido al centro (stessa molla dei quickTo).
            mediaX(0);
            mediaY(0);
            contentX(0);
            contentY(0);
          };

          section.addEventListener("pointermove", onMove, { passive: true });
          section.addEventListener("pointerleave", onLeave);
          return () => {
            window.removeEventListener(INTRO_EVENT, arm);
            window.clearTimeout(safety);
            section.removeEventListener("pointermove", onMove);
            section.removeEventListener("pointerleave", onLeave);
            // Il revert del context azzera scale/x/y inline sui due layer.
          };
        }
      );
    },
    { scope: sectionRef }
  );

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

  // Chip di prova: gli asset proprietari sono cliccabili verso le rispettive sezioni
  // (hero solo in homepage → ancore same-page). Il luogo resta statico.
  const chips: { label: string; href?: string }[] = [
    { label: "Open Domus", href: "#open-domus" },
    { label: "Domus D.O.C.", href: "#domus-doc" },
    { label: c.place },
  ];

  return (
    <section ref={sectionRef} id="top" className="relative flex min-h-[92dvh] w-full items-end overflow-hidden bg-ink text-cream">
      {/* Canvas media (foto + eventuale video) in un layer parallax unico */}
      <div ref={mediaRef} className="absolute inset-0">
        {/* Layer profondità puntatore: mediaRef è già owner di clip/scale del
            frame-in e l'IMG del ken-burns — il transform x/y vive SOLO qui.
            Il clip-path del genitore ritaglia comunque l'overscan. */}
        <div ref={mediaDepthRef} className="absolute inset-0">
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
        </div>
      </div>

      {/* Gradienti per leggibilità del testo */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 to-transparent" />

      {/* Cornice Segno Domus sul canvas (svanisce durante il frame-in) */}
      <div ref={frameWrapRef}>
        <SegnoDomusVideoFrame />
      </div>

      {/* Contenuto */}
      <div ref={contentRef} className="relative z-20 mx-auto w-full max-w-[1240px] px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-36">
        {/* Il x/y del parallasse puntatore sta su questo blocco interno:
            contentRef è già owner dello yPercent del frame-in. */}
        <div ref={contentDepthRef} className="max-w-3xl">
          <span data-hero-badge className="inline-flex">
            <SegnoDomusBadge light className="backdrop-blur-sm">{c.badge}</SegnoDomusBadge>
          </span>

          {/* Le due righe sono maschere (overflow-hidden) per la risalita delle
              parole al handoff del preloader; il pb/-mb compensato evita di
              tagliare i discendenti in stato statico. */}
          <h1 className="mt-6 font-display text-[2.5rem] font-medium leading-[1.02] tracking-[-0.02em] text-cream balance sm:text-6xl lg:text-[4.2rem]">
            <WordReveal
              as="span"
              className="block overflow-hidden pb-[0.12em] -mb-[0.12em]"
              text={c.title1}
              immediate
            />
            <WordReveal
              as="span"
              className="block overflow-hidden pb-[0.14em] -mb-[0.14em] italic text-red-soft"
              text={c.title2}
              immediate
            />
          </h1>

          <p
            data-hero-seq
            className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-cream/85 sm:text-lg"
            style={{ animation: "dt-fade-rise .5s var(--ease-out-expo) both", animationDelay: "0ms" }}
          >
            {c.subcopy}
          </p>

          {/* Founder label */}
          <p
            data-hero-seq
            className="mt-5 flex items-center gap-2.5 text-sm font-medium text-cream/80"
            style={{ animation: "dt-fade-rise .5s var(--ease-out-expo) both", animationDelay: "60ms" }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red font-display text-xs font-semibold text-white">
              RR
            </span>
            {c.founder}
            {/* Firma della fondatrice (placeholder, da sostituire con quella reale) */}
            <Signature light className="ml-1 hidden h-8 w-auto opacity-90 sm:block" />
          </p>

          {/* CTA */}
          <div
            data-hero-seq
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            style={{ animation: "dt-fade-rise .5s var(--ease-out-expo) both", animationDelay: "120ms" }}
          >
            {/* CTA primaria magnetica (solo pointer fine + motion ok) */}
            <Magnetic className="w-full sm:w-auto" strength={0.18}>
              <a
                href="#contatti"
                className="group flex w-full items-center justify-center gap-2 rounded-full bg-red py-4 pl-7 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                {c.ctaValuta}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </a>
            </Magnetic>
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
          <div
            data-hero-seq
            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-cream/15 pt-6"
            style={{ animation: "dt-fade-rise .5s var(--ease-out-expo) both", animationDelay: "180ms" }}
          >
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
            {chips.map((ch) =>
              ch.href ? (
                <a
                  key={ch.label}
                  href={ch.href}
                  className="text-[0.82rem] font-medium text-cream/70 underline-offset-4 transition-colors duration-300 hover:text-cream hover:underline"
                >
                  {ch.label}
                </a>
              ) : (
                <span key={ch.label} className="text-[0.82rem] font-medium text-cream/70">
                  {ch.label}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Scroll cue: sottile linea verticale, solo desktop (reduced-motion gestito
          globalmente). Il pulse CSS sta sull'elemento interno: l'animazione CSS
          vincerebbe sull'opacity inline di GSAP, quindi il fade allo scroll è
          sul wrapper esterno. */}
      <span
        ref={cueRef}
        aria-hidden
        className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 md:block"
      >
        <span
          className="block h-8 w-px bg-cream/40"
          style={{ animation: "dt-scrollcue 1.8s var(--ease-soft) infinite" }}
        />
      </span>
    </section>
  );
}
