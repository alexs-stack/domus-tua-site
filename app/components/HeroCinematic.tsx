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
import Magnetic from "./motion/Magnetic";
import { SegnoDomusVideoFrame } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";
import { INTRO_EVENT, isIntroRunning } from "./motion/Preloader";
import { getLenis } from "./motion/SmoothScroll";

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
    heroAlt: "Raffaela Rizza presenta il soggiorno di un attico luminoso con terrazza proposto da Domus Tua",
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
    heroAlt: "Raffaela Rizza presenting the living room of a bright penthouse with terrace offered by Domus Tua",
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
    heroAlt: "Raffaela Rizza présente le séjour d'un penthouse lumineux avec terrasse proposé par Domus Tua",
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
    heroAlt: "Raffaela Rizza präsentiert das Wohnzimmer eines hellen Penthouses mit Terrasse im Angebot von Domus Tua",
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
    heroAlt: "Raffaela Rizza presenta el salón de un ático luminoso con terraza ofrecido por Domus Tua",
  },
};

// Split in lettere reso in SSR (niente SplitText nel chunk della home):
// ogni char è uno <span> animabile; gli spazi restano nodi di testo normali.
// I wrapper sono aria-hidden: il testo accessibile vive sull'aria-label del
// genitore (h1/p), i motori di ricerca leggono comunque il testo nel DOM.
function Chars({
  text,
  variant = "title",
  className = "",
}: {
  text: string;
  variant?: "title" | "tagline" | "script";
  className?: string;
}) {
  const attr =
    variant === "tagline"
      ? { "data-hero-tchar": "" }
      : variant === "script"
        ? { "data-hero-schar": "" }
        : { "data-hero-char": "" };
  return (
    <span aria-hidden className={className}>
      {text.split("").map((ch, i) =>
        ch === " " ? (
          " "
        ) : (
          <span key={i} {...attr} className="inline-block will-change-transform">
            {ch}
          </span>
        )
      )}
    </span>
  );
}

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

  // Coreografia d'ingresso — a OGNI load (rif. era-residence: anche al
  // refresh le scritte rientrano). Due percorsi:
  // - CON preloader (prima visita di sessione): il canvas parte a scale 0.75
  //   (è ciò che si vede DENTRO la porta ad arco) e arriva a 1 durante il
  //   tuffo; le lettere partono al handoff INTRO_EVENT.
  // - SENZA preloader (refresh/visite successive): niente scale sul canvas,
  //   le lettere rientrano subito dopo l'idratazione. L'attributo
  //   html[data-hero-intro] (inline script, pre-paint) le tiene a opacity
  //   0.02: dipinte per l'LCP ma invisibili, senza flash prima del reveal.
  // Subcopy/founder/CTA/recensioni NON sono di questa timeline:
  // appaiono al primo scroll (vedi blocco data-hero-rest più sotto).
  useGSAP(
    () => {
      const section = sectionRef.current;
      const html = document.documentElement;
      if (!section) return;
      const withPreloader = html.hasAttribute("data-preloader");
      if (!withPreloader && !html.hasAttribute("data-hero-intro")) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // Reveal per LETTERE (rif. era-residence, animatore "h"): i chars del
        // lockup e della riga motto salgono ruotando su Y; lo script arriva
        // come l'animatore "a" (rotateX + slittamento orizzontale).
        const titleChars = gsap.utils.toArray<HTMLElement>("[data-hero-char]", section);
        const taglineChars = gsap.utils.toArray<HTMLElement>("[data-hero-tchar]", section);
        const scriptChars = gsap.utils.toArray<HTMLElement>("[data-hero-schar]", section);
        const allChars = [...titleChars, ...taglineChars, ...scriptChars];

        // Il failsafe CSS (opacity a 1 dopo 6s) va spento: comanda GSAP.
        allChars.forEach((el) => {
          el.style.animation = "none";
        });

        // La foto resta FERMA a scale 1 durante l'intro: la "sagoma" di
        // Raffaela nel preloader è la stessa foto con la stessa geometria
        // object-cover — quando l'arco passa su di lei, sagoma e foto
        // coincidono pixel su pixel e la stanza si materializza intorno.
        // LCP: Chromium esclude le immagini full-viewport ("background"), quindi
        // l'LCP della home è il TESTO dell'hero. Gli elementi restano DIPINTI a
        // opacity 0.02 (opacity:0 li toglierebbe dai candidati LCP); lo stato
        // coreografico vero viene applicato solo un attimo prima del reveal.
        gsap.set(allChars, { opacity: 0.02 });
        gsap.set([frameWrapRef.current, cueRef.current], { autoAlpha: 0 });

        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          // Stati di partenza reali, applicati mentre la zona è ancora coperta
          // dal sipario (l'arco si apre dal centro-basso: il lockup è coperto
          // fino all'ultimo istante del tuffo).
          // Stati iniziali del riferimento (README §7): titoli/motto per
          // lettere con rotazione su Y, script per lettere con rotazione su X
          // e slittamento orizzontale (origine al piede del glifo).
          gsap.set([...titleChars, ...taglineChars], {
            opacity: 0,
            yPercent: 50,
            rotateY: 90,
            transformPerspective: 800,
          });
          gsap.set(scriptChars, {
            opacity: 0,
            rotateX: 90,
            x: "6vw",
            transformOrigin: "center bottom",
            transformPerspective: 800,
          });
          const tl = gsap.timeline({ defaults: { ease: "domus" } });
          tl.to(
              titleChars,
              {
                opacity: 1,
                yPercent: 0,
                rotateY: 0,
                duration: dur.reveal,
                stagger: 0.05,
                ease: "dtOut",
              },
              0.15
            )
            .to(
              scriptChars,
              {
                opacity: 1,
                x: "0vw",
                rotateX: 0,
                duration: dur.reveal,
                stagger: 0.045,
                ease: "dtOut",
              },
              0.5
            )
            .to(
              taglineChars,
              {
                opacity: 1,
                yPercent: 0,
                rotateY: 0,
                duration: dur.reveal,
                stagger: 0.018,
                ease: "dtOut",
              },
              0.45
            )
            .to(frameWrapRef.current, { autoAlpha: 1, duration: 0.7, ease: "none" }, 1.0)
            .to(cueRef.current, { autoAlpha: 1, duration: 0.5, ease: "none" }, 1.3);
        };

        if (withPreloader) {
          // Parte all'uscita del preloader (una sola timeline percepita);
          // safety: se l'evento va perso, si rivela comunque.
          window.addEventListener(INTRO_EVENT, play, { once: true });
          const safety = window.setTimeout(play, 6000);
          return () => {
            window.removeEventListener(INTRO_EVENT, play);
            window.clearTimeout(safety);
          };
        }
        // Refresh/visita successiva: le scritte rientrano subito (un respiro
        // dopo l'idratazione, per non competere col primo paint).
        const t = window.setTimeout(play, 150);
        return () => window.clearTimeout(t);
      });
    },
    { scope: sectionRef }
  );

  // Il "resto" dell'hero (subcopy, founder, CTA, recensioni) appare SOLO al
  // primo scroll (richiesta cliente, rif. era-residence: all'ingresso restano
  // lockup e motto). L'attributo html[data-hero-rest] è messo pre-paint
  // dall'inline script (solo motion ok): qui GSAP prende il timone, nasconde
  // con transform reale e rivela su ScrollTrigger once. Senza JS o con
  // reduced-motion l'attributo non c'è / il blocco non parte: tutto visibile.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const html = document.documentElement;
      if (!section || !html.hasAttribute("data-hero-rest")) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const rest = gsap.utils.toArray<HTMLElement>(".dt-hero-rest", section);
        if (!rest.length) return;
        // Il failsafe CSS (animation 6s) va spento: da qui comanda GSAP.
        // L'attributo html resta (lo rileggono i remount di StrictMode/HMR):
        // gli inline style di GSAP vincono comunque sull'opacity di classe.
        rest.forEach((el) => {
          el.style.animation = "none";
        });
        gsap.set(rest, { autoAlpha: 0, y: 28 });

        let revealed = false;
        const reveal = () => {
          if (revealed) return;
          revealed = true;
          section.removeEventListener("focusin", onFocusIn);
          gsap.to(rest, {
            autoAlpha: 1,
            y: 0,
            duration: dur.short,
            stagger: 0.08,
            ease: "domus",
            overwrite: true,
          });
        };
        // Tastiera: mai lasciare CTA invisibili nel tab order — al primo focus
        // dentro l'hero il blocco si rivela comunque (autoAlpha gestisce anche
        // la visibility, quindi finché è nascosto non è nemmeno focalizzabile:
        // il focusin arriva dai link ancora visibili sopra).
        function onFocusIn() {
          reveal();
        }
        section.addEventListener("focusin", onFocusIn);

        // Il PRIMO gesto di scroll non scorre la pagina: rivela il blocco e
        // basta (richiesta cliente — l'immagine resta piena dietro). Lo scroll
        // vero riparte al gesto successivo, ~0.9s dopo (fine del reveal).
        // Se si arriva già scrollati (ancora, restore) non si blocca nulla.
        let holding = false;
        const release = () => {
          if (!holding) return;
          holding = false;
          getLenis()?.start();
        };
        const onFirstGesture = (e: Event) => {
          if (revealed) return;
          // Solo gesti "di scorrimento": un click non deve consumare il turno.
          if (e.type === "keydown") {
            const k = (e as KeyboardEvent).key;
            const scrollKeys = [
              "ArrowDown",
              "ArrowUp",
              "PageDown",
              "PageUp",
              "End",
              "Home",
              " ",
            ];
            if (!scrollKeys.includes(k)) return;
            e.preventDefault();
          }
          holding = true;
          getLenis()?.stop(); // la pagina resta ferma sull'immagine piena
          reveal();
          // Fine del reveal: lo scroll torna all'utente (nessun hijack lungo).
          window.setTimeout(release, 950);
        };
        window.addEventListener("wheel", onFirstGesture, { passive: true });
        window.addEventListener("touchmove", onFirstGesture, { passive: true });
        window.addEventListener("keydown", onFirstGesture);

        // Arrivo già scrollato (ancora, restore del browser): nessun blocco.
        const onScroll = () => {
          if (window.scrollY > 24) reveal();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => {
          section.removeEventListener("focusin", onFocusIn);
          window.removeEventListener("wheel", onFirstGesture);
          window.removeEventListener("touchmove", onFirstGesture);
          window.removeEventListener("keydown", onFirstGesture);
          window.removeEventListener("scroll", onScroll);
          release();
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

          const mediaX = gsap.quickTo(media, "x", { duration: 0.8, ease: "power3.out" });
          const mediaY = gsap.quickTo(media, "y", { duration: 0.8, ease: "power3.out" });
          const contentX = gsap.quickTo(content, "x", { duration: 0.8, ease: "power3.out" });
          const contentY = gsap.quickTo(content, "y", { duration: 0.8, ease: "power3.out" });

          // Parte solo a intro conclusa: durante il sipario il puntatore può
          // già muoversi sull'hero ma il timone è della coreografia sopra.
          // Safety allineato al handoff: se l'evento va perso, si arma comunque.
          // L'overscan (±10px senza scoprire i bordi) si applica SOLO all'arm:
          // durante l'intro la foto deve restare a scale 1, identica alla
          // sagoma nel preloader (continuità pixel su pixel sotto l'arco).
          let active = !isIntroRunning();
          const arm = () => {
            active = true;
            gsap.set(media, { scale: 1.04 });
          };
          if (active) gsap.set(media, { scale: 1.04 });
          let safety = 0;
          let armTimer = 0;
          // INTRO_EVENT parte all'INIZIO del tuffo: overscan e parallasse
          // aspettano che l'arco abbia FINITO di attraversare la foto
          // (dur.hero), altrimenti lo scatto a 1.04 romperebbe la continuità
          // sagoma→foto proprio nel momento in cui si vede.
          const onIntroDone = () => {
            armTimer = window.setTimeout(arm, dur.hero * 1000 + 200);
          };
          if (!active) {
            window.addEventListener(INTRO_EVENT, onIntroDone, { once: true });
            safety = window.setTimeout(arm, 7600);
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
            window.removeEventListener(INTRO_EVENT, onIntroDone);
            window.clearTimeout(safety);
            window.clearTimeout(armTimer);
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
    <section ref={sectionRef} id="top" className="relative flex min-h-[100dvh] w-full overflow-hidden bg-espresso text-cream">
      {/* Canvas media (foto + eventuale video) in un layer parallax unico */}
      <div ref={mediaRef} className="absolute inset-0">
        {/* Layer profondità puntatore: mediaRef è già owner di clip/scale del
            frame-in e l'IMG del ken-burns — il transform x/y vive SOLO qui.
            Il clip-path del genitore ritaglia comunque l'overscan. */}
        <div ref={mediaDepthRef} className="absolute inset-0">
          {/* Base sempre presente: foto reale (poster finché non c'è il video) */}
          <Image
            src={heroCinematic.base}
            alt={c.heroAlt}
            fill
            priority
            // Qualità 78 (non 60): la sorgente è una foto WhatsApp già molto
            // compressa e ricampionata — una seconda compressione aggressiva
            // la sgranerebbe visibilmente sull'immagine luminosa a tutto schermo.
            quality={78}
            sizes="100vw"
            className="ken-burns object-cover"
            style={{ objectPosition: "50% 70%" }}
          />

          {/* Video overlay (opzionale, video-ready): copre la base quando disponibile */}
          {playVideo && (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "50% 70%" }}
              poster={heroCinematic.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onError={() => setPlayVideo(false)}
            >
              {heroCinematic.webm && <source src={heroCinematic.webm} type="video/webm" />}
              <source src={heroCinematic.mp4} type="video/mp4" />
            </video>
          )}
        </div>
      </div>

      {/* Gradienti per leggibilità del testo centrato (lockup in alto, CTA in
          basso): velo scuro simmetrico, centro dell'immagine libero. Toni
          espresso: durante l'intro (canvas a scale 0.75 dentro l'arco) i bordi
          esposti leggono come "stanza" continua col pannello del preloader. */}
      <div className="absolute inset-0 bg-gradient-to-b from-espresso/75 via-espresso/20 to-espresso/85" />

      {/* Cornice Segno Domus sul canvas (svanisce durante il frame-in) */}
      <div ref={frameWrapRef}>
        <SegnoDomusVideoFrame />
      </div>

      {/* Contenuto — layout rif. era-residence (§6.1): lockup di marca centrato
          in alto (lo stesso del preloader: continuità dentro l'arco), riga del
          motto subito sotto, conversione in basso. */}
      <div
        ref={contentRef}
        className="relative z-20 mx-auto flex w-full max-w-[1240px] flex-col items-center px-5 pb-16 pt-28 text-center sm:px-8 sm:pt-32"
      >
        {/* Il x/y del parallasse puntatore sta su questo blocco interno:
            contentRef è già owner dello yPercent del frame-in. */}
        <div ref={contentDepthRef} className="flex w-full flex-1 flex-col items-center">
          {/* Lockup: didone + script sovrapposto, come nel preloader */}
          <div className="relative">
            <h1
              aria-label="Domus Tua — agenzia immobiliare a Tradate"
              className="font-hero text-[clamp(3rem,min(14vh,19vw),8rem)] font-medium leading-[0.95] tracking-[-0.01em] text-cream"
            >
              <Chars text="Domus" className="block" />
              <Chars text="Tua" className="block" />
            </h1>
            <span
              data-hero-script
              aria-hidden
              className="pointer-events-none absolute -bottom-[0.5em] left-1/2 -translate-x-1/2 whitespace-nowrap font-script text-[clamp(2rem,min(6.5vh,9vw),4rem)] leading-none text-red [text-shadow:0_2px_28px_rgba(26,24,22,0.6)]"
            >
              <Chars text="Raffaela Rizza" variant="script" />
            </span>
          </div>

          {/* Riga del motto (posizione della riga "A place · to return to").
              Le lettere animate sono aria-hidden (vedi Chars): il testo leggibile vive
              nello span sr-only — aria-label su un <p> è vietato (axe: aria-prohibited-attr). */}
          <p className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-hero text-[clamp(1.4rem,2.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.012em] text-cream">
            <span className="sr-only">{`${c.title1} ${c.title2}`}</span>
            <Chars variant="tagline" text={c.title1} />
            <span aria-hidden className="hidden h-px w-10 bg-cream/40 sm:block" />
            <Chars variant="tagline" text={c.title2} className="italic text-red-soft" />
          </p>

          {/* Spazio respiro: l'immagine resta protagonista al centro */}
          <div className="flex-1" />

          <p data-hero-seq className="dt-hero-rest max-w-xl text-[0.98rem] leading-relaxed text-cream/85 sm:text-base">
            {c.subcopy}
          </p>

          {/* Founder label */}
          <p
            data-hero-seq
            className="dt-hero-rest mt-4 flex items-center justify-center gap-2.5 text-sm font-medium text-cream/80"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red font-display text-xs font-semibold text-white">
              RR
            </span>
            {c.founder}
            {/* Nessuna firma grafica: il tracciato calligrafico che stava qui era generico,
                non la firma reale di Raffaela Rizza. Si reintroduce solo con l'SVG/PNG
                fornito dal cliente (docs/client-assets-needed.md). */}
          </p>

          {/* CTA */}
          <div
            data-hero-seq
            className="dt-hero-rest mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
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
              href={site.social.youtube.href}
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
            className="dt-hero-rest mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-cream/15 pt-6"
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
