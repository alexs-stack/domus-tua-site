"use client";

// HeroCinematic — apertura cinematografica full-bleed di Domus Tua.
// Canvas video/immagine a tutta larghezza, energia + emozione + prova sociale + sicurezza.
// Video-ready: quando i file /media esistono e enabled=true, parte (desktop, no reduced-motion).
// Finché mancano, resta la foto reale di Raffaela + team come poster. Vedi docs/hero-video.md.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import SurfaceVeil from "./motion/SurfaceVeil";
import { Star, Play } from "./Icons";
import { Cta } from "./primitives/Cta";
import { site } from "../lib/site";
import { heroCinematic } from "../lib/media";
import { youtubeWatch } from "../lib/videos";
import Magnetic from "./motion/Magnetic";
import { SegnoDomusVideoFrame } from "./BrandMotif";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur, dist, stagger } from "../lib/motion/gsap";
import { INTRO_EVENT } from "./motion/Preloader";
import { getLenis } from "./motion/SmoothScroll";

// ─────────────────────────────────────────────────────────────────────────────
// L'H1 È UNA PROMESSA, NON IL MARCHIO.
//
// Fino al 15 agosto 2026 l'H1 tecnico di questa pagina era il lockup «Domus Tua»: la
// pagina più importante del sito non diceva né cosa fa l'agenzia né dove. Il marchio
// resta protagonista a schermo (è il ponte visivo con il preloader) ma non è più
// l'intestazione: il lockup è tipografia di marca, e il nome vive già nel logo di
// testata, nel <title> e nei dati strutturati.
//
// `title1`/`title2` compongono una frase sola, spezzata sul divisore: la seconda metà
// è la parte che porta l'argomento. Tre cose la reggono, e vanno tenute insieme se un
// giorno la si riscrive:
//   • è all'imperativo — parla a una persona, non descrive un'attività;
//   • contiene «a Tradate» — è la chiave con cui le persone cercano davvero, e nessuna
//     versione precedente ce l'aveva;
//   • «al prezzo giusto» attacca la paura numero uno di chi vende (svendere), non la
//     quarta (lo stress); «nei tempi giusti» non promette né lentezza né velocità, ed è
//     coerente con la FAQ che si rifiuta di promettere tempi di vendita.
// È asimmetrica di proposito: parla al proprietario. Chi compra ha la CTA secondaria.
// ─────────────────────────────────────────────────────────────────────────────
const copy = {
  it: {
    badge: "Agenzia immobiliare a Tradate · dal 2007",
    title1: "Vendi casa a Tradate",
    title2: "al prezzo giusto, nei tempi giusti.",
    subcopy:
      "Valutazione professionale, documenti verificati prima di andare sul mercato, marketing curato e Open Domus. Un unico metodo, dalla prima stima alla firma dal notaio.",
    founder: "Con Raffaela Rizza e il team Domus Tua",
    ctaValuta: "Richiedi la valutazione del tuo immobile",
    ctaCerco: "Cerco casa",
    ctaVideo: "Guarda il video",
    reviews: `${site.reviewsCount} recensioni Google`,
    place: "A Tradate dal 2007",
    awardChip: "3 anni consecutivi fra le migliori 400 agenzie d'Italia — Wikicasa Top Agency",
    noCost: "Nessun costo anticipato",
    heroAlt: "Raffaela Rizza presenta il soggiorno di un attico luminoso con terrazza proposto da Domus Tua",
  },
  en: {
    badge: "Estate agency in Tradate · since 2007",
    title1: "Sell your home in Tradate",
    title2: "at the right price, in the right time.",
    subcopy:
      "Professional valuation, paperwork verified before going to market, careful marketing and Open Domus. One method, from the first estimate to the signing at the notary.",
    founder: "With Raffaela Rizza and the Domus Tua team",
    ctaValuta: "Request a valuation of your property",
    ctaCerco: "I'm looking for a home",
    ctaVideo: "Watch the video",
    reviews: `${site.reviewsCount} Google reviews`,
    place: "In Tradate since 2007",
    awardChip: "Three years running among Italy's top 400 agencies — Wikicasa Top Agency",
    noCost: "No upfront costs",
    heroAlt: "Raffaela Rizza presenting the living room of a bright penthouse with terrace offered by Domus Tua",
  },
  fr: {
    badge: "Agence immobilière à Tradate · depuis 2007",
    title1: "Vendez votre bien à Tradate",
    title2: "au juste prix, dans les bons délais.",
    subcopy:
      "Estimation professionnelle, documents vérifiés avant la mise sur le marché, marketing soigné et Open Domus. Une seule méthode, de la première estimation à la signature chez le notaire.",
    founder: "Avec Raffaela Rizza et l'équipe Domus Tua",
    ctaValuta: "Demandez l'estimation de votre bien",
    ctaCerco: "Je cherche un bien",
    ctaVideo: "Voir la vidéo",
    reviews: `${site.reviewsCount} avis Google`,
    place: "À Tradate depuis 2007",
    awardChip: "Trois années consécutives parmi les 400 meilleures agences d'Italie — Wikicasa Top Agency",
    noCost: "Aucun frais d'avance",
    heroAlt: "Raffaela Rizza présente le séjour d'un penthouse lumineux avec terrasse proposé par Domus Tua",
  },
  de: {
    badge: "Immobilienagentur in Tradate · seit 2007",
    title1: "Verkaufen Sie Ihr Haus in Tradate",
    title2: "zum richtigen Preis, in der richtigen Zeit.",
    subcopy:
      "Professionelle Bewertung, vor dem Markteintritt geprüfte Unterlagen, sorgfältiges Marketing und Open Domus. Eine Methode, von der ersten Schätzung bis zur Unterschrift beim Notar.",
    founder: "Mit Raffaela Rizza und dem Domus-Tua-Team",
    ctaValuta: "Bewertung Ihrer Immobilie anfordern",
    ctaCerco: "Ich suche ein Zuhause",
    ctaVideo: "Video ansehen",
    reviews: `${site.reviewsCount} Google-Bewertungen`,
    place: "In Tradate seit 2007",
    awardChip: "Drei Jahre in Folge unter Italiens besten 400 Agenturen — Wikicasa Top Agency",
    noCost: "Keine Kosten im Voraus",
    heroAlt: "Raffaela Rizza präsentiert das Wohnzimmer eines hellen Penthouses mit Terrasse im Angebot von Domus Tua",
  },
  es: {
    badge: "Agencia inmobiliaria en Tradate · desde 2007",
    title1: "Vende tu casa en Tradate",
    title2: "al precio justo, en el tiempo justo.",
    subcopy:
      "Valoración profesional, documentos verificados antes de salir al mercado, marketing cuidado y Open Domus. Un único método, desde la primera estimación hasta la firma ante notario.",
    founder: "Con Raffaela Rizza y el equipo Domus Tua",
    ctaValuta: "Solicita la valoración de tu inmueble",
    ctaCerco: "Busco casa",
    ctaVideo: "Ver el vídeo",
    reviews: `${site.reviewsCount} reseñas de Google`,
    place: "En Tradate desde 2007",
    awardChip: "Tres años consecutivos entre las 400 mejores agencias de Italia — Wikicasa Top Agency",
    noCost: "Sin costes por adelantado",
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
  const frameWrapRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
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
      // Gate desktop, e il gemello mobile qui sotto NON è il frame-in: il
      // clip-path per frame sul layer full-viewport costerebbe un
      // repaint/maschera a ogni tick di scroll (Safari iOS, Android low-end).
      // Il frame-in NON torna sul telefono, nemmeno in Fase 2. La deriva
      // d'uscita di sola trasformazione prevista dal verdetto 10 di
      // docs/mobile-parity.md è un'altra cosa ed è arrivata: quella non dipinge
      // niente.
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

      // Il gemello mobile: una DERIVA D'USCITA, non una camera. Sul telefono
      // questa foto oggi è ferma a qualunque quota di scroll — Parallax qui non
      // gira e `.ken-burns` non esiste più — quindi l'unica cosa che si muove è
      // la pagina che le passa sopra. Il canvas resta indietro di poco mentre
      // l'hero esce: è profondità, non un movimento.
      //
      // yPercent POSITIVO, e non è indifferente: il layer è `inset-0` senza
      // overscan, quindi verso l'alto scoprirebbe una banda espresso in fondo
      // alla sezione. Verso il basso il vuoto si apre in cima, cioè sopra il
      // bordo alto del viewport, dove non c'è nessuno a vederlo.
      // Ampiezza a metà di dist.parallax: quello è il massimo di un fondale che
      // attraversa tutta la pagina, qui la corsa è un hero solo.
      mm.add(`${MQ.motionOk} and ${MQ.belowDesktop}`, () => {
        // will-change solo mentre lo scrub è vivo (il revert lo toglie):
        // §1.5c dell'audit conta i livelli promossi, e questo ne aggiunge uno.
        gsap.set(mediaRef.current, { willChange: "transform" });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
          defaults: { ease: "none" },
        });
        tl.to(mediaRef.current, { yPercent: dist.parallax * 50 }, 0);
        // NIENTE `frameWrapRef` QUI DENTRO, ed è una rinuncia consapevole.
        // Sembrava lo scambio giusto (i marchi d'angolo restano accesi per
        // tutto l'hero sul telefono, perché a spegnerli era il frame-in che su
        // mobile non gira), ma darebbe alla cornice DUE padroni: la timeline
        // d'ingresso non è gated per larghezza — `data-hero-intro` è messo a
        // ogni larghezza — e su un telefono la porta comunque da autoAlpha 0 a
        // 1 a t=1,7s. Uno scrub che scrive la stessa opacità mentre l'altra
        // timeline la sta ancora accendendo è una lite, e la lite si vede.
        // La deriva della foto vale da sola: è quella che il telefono non
        // aveva. La cornice si spegnerà quando avrà un padrone solo.
        //
        // Chanel, allora, sul costo e non sull'effetto: la deriva è UNA tween
        // di solo `yPercent` agganciata allo scrub che l'hero ha già — nessun
        // ScrollTrigger nuovo, nessun layer nuovo, nessun paint.
      });
    },
    { scope: sectionRef }
  );

  // Coreografia d'ingresso — a OGNI load (rif. era-residence: anche al
  // refresh le scritte rientrano). Il canvas non si muove in nessuno dei due
  // percorsi: resta a scale 1 (il perché è nel commento della gsap.set qui
  // sotto). Quel che cambia è solo QUANDO partono le lettere:
  // - CON preloader (prima visita di sessione): al handoff INTRO_EVENT, cioè
  //   mentre il tuffo dentro la porta ad arco è ancora in corso.
  // - SENZA preloader (refresh/visite successive): subito dopo l'idratazione.
  //   L'attributo html[data-hero-intro] (inline script, pre-paint) le tiene a
  //   opacity 0.02: dipinte ma invisibili, così non c'è flash prima del reveal.
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
        // Gli elementi restano DIPINTI a opacity 0.02 invece che a 0: lo stato
        // coreografico vero si applica solo un attimo prima del reveal, così
        // non c'è nessun lampo di testo composto.
        //
        // Qui c'era scritto che 0.02 serviva a tenerli fra i candidati LCP,
        // «perché Chromium esclude le immagini full-viewport e quindi l'LCP
        // della home è il TESTO dell'hero». Misurato (2026-08-11): l'LCP della
        // home è il banner cookie, `p#cookie-consent-desc`. Questo H1 non è
        // candidato affatto — `Chars` lo spezza in span inline-block e la
        // frammentazione lo toglie di mezzo da sola. L'esclusione delle
        // immagini full-viewport resta un'assunzione documentata e mai
        // misurata: vedi docs/mobile-parity.md §7.1.
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
          // Ritmo disteso (richiesta cliente 2026-08-03): durate a dur.hero e
          // stagger più larghi — le lettere si posano, non sfrecciano.
          const tl = gsap.timeline({ defaults: { ease: "domus" } });
          tl.to(
              titleChars,
              {
                opacity: 1,
                yPercent: 0,
                rotateY: 0,
                duration: dur.hero,
                stagger: 0.08,
                ease: "dtOut",
              },
              0.2
            )
            .to(
              scriptChars,
              {
                opacity: 1,
                x: "0vw",
                rotateX: 0,
                duration: dur.hero,
                stagger: 0.07,
                ease: "dtOut",
              },
              0.85
            )
            .to(
              taglineChars,
              {
                opacity: 1,
                yPercent: 0,
                rotateY: 0,
                duration: dur.hero,
                stagger: 0.032,
                ease: "dtOut",
              },
              0.7
            )
            .to(frameWrapRef.current, { autoAlpha: 1, duration: 0.7, ease: "none" }, 1.7)
            .to(cueRef.current, { autoAlpha: 1, duration: 0.5, ease: "none" }, 2.1);
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
        // opacity, MAI autoAlpha. Qui sotto non c'è solo del testo: c'è il CTA
        // PRIMARIO ("Valuta il tuo immobile"), il secondario, il link alle
        // recensioni. autoAlpha scrive visibility:hidden, e quello li toglie dal
        // tab order — chi naviga col Tab salta la conversione dell'hero. Toglie
        // anche l'unica cosa da cui la rete del focusin qui sotto poteva
        // scattare. L'altra metà del guaio la chiude pointer-events: senza,
        // opacity 0 lascerebbe un bersaglio invisibile in mezzo all'hero.
        gsap.set(rest, { opacity: 0, pointerEvents: "none", y: 28 });

        let revealed = false;
        // `fast` = il dito. Il perché sta nel commento del gesto touch più giù:
        // è un parametro e non una seconda timeline perché la coreografia è la
        // stessa, cambia solo il tempo.
        const reveal = (fast = false) => {
          if (revealed) return;
          revealed = true;
          section.removeEventListener("focusin", onFocusIn);
          gsap.to(rest, {
            opacity: 1,
            // pointer-events non si interpola: GSAP lo scrive all'attacco della
            // tween di ciascun elemento, quindi il CTA torna cliccabile subito,
            // mentre sta ancora salendo.
            pointerEvents: "auto",
            y: 0,
            duration: fast ? dur.micro : dur.short,
            stagger: fast ? stagger.chars : 0.08,
            ease: "domus",
            overwrite: true,
          });
        };
        // Tastiera: mai lasciare CTA invisibili nel tab order — al primo focus
        // dentro l'hero il blocco si rivela comunque.
        // (Qui c'era scritto che con autoAlpha il blocco «non è nemmeno
        // focalizzabile, il focusin arriva dai link ancora visibili sopra». Era
        // esatto, ed era il difetto: voleva dire che al CTA primario col Tab non
        // ci si arrivava proprio. Adesso ci si arriva, e questa rete scatta dal
        // CTA stesso.)
        function onFocusIn() {
          reveal();
        }
        section.addEventListener("focusin", onFocusIn);

        // Il PRIMO gesto di scroll non scorre la pagina: rivela il blocco e
        // basta (richiesta cliente — l'immagine resta piena dietro). Lo scroll
        // vero riparte al gesto successivo, ~0.9s dopo (fine del reveal).
        // Se si arriva già scrollati (ancora, restore) non si blocca nulla.
        //
        // ROTELLA SÌ, DITO NO (2026-08-11, wave "parità mobile"). Il fermo era
        // su entrambi. Misurato su un telefono: `getLenis()?.stop()` mette
        // `lenis-stopped` su <html>, che in globals.css è `overflow: hidden` —
        // quindi non è un rallentamento, è un blocco duro, e durava 991ms
        // (docs/mobile-parity.md §1.5a). Col mouse quel fermo-immagine è una
        // finezza: la rotella è un gesto ripetuto e discreto, se ne fa un altro.
        // Col dito è una pagina che non risponde al primo scorrimento — cioè la
        // prima impressione del sito è che sia rotto. Il gesto resta identico
        // dove funziona, sparisce dove tradisce. Il blocco NON è la firma: la
        // firma è che il blocco sotto si compone; e quella arriva comunque.
        let holding = false;
        const release = () => {
          if (!holding) return;
          holding = false;
          getLenis()?.start();
        };
        const onWheelGesture = () => {
          if (revealed) return;
          holding = true;
          getLenis()?.stop();
          reveal();
          // Fine del reveal: lo scroll torna all'utente (nessun hijack lungo).
          window.setTimeout(release, 950);
        };
        // Dito: rivela e basta, come già fa la tastiera qui sotto. Nessuno stop,
        // nessun timer da cui dipendere — la pagina non smette mai di scorrere,
        // e non ci torna (decisione chiusa, docs/mobile-parity.md §9.2).
        //
        // MA SENZA IL FERMO IL BLOCCO SI COMPONE SU UNA PAGINA IN CORSA, e il
        // tempo della rotella qui non regge: dur.short più 0.08 di stagger fanno
        // ~0.84s da capo a fondo, mentre una scorsa di pollice porta via
        // 700-1000px in mezzo secondo. Il CTA finirebbe di salire i suoi 28px
        // quando è già uscito dallo schermo — un'animazione che nessuno vede
        // mai finire. Sul dito la composizione va chiusa prima che la vista
        // cambi: dur.micro e lo stagger più stretto del vocabolario, cioè tutti
        // e quattro i blocchi in moto entro ~0.18s e l'ultimo posato a ~0.48s.
        // La rotella tiene il suo tempo disteso: lì la pagina sta ferma per
        // costruzione, e il blocco si compone davanti a occhi fermi.
        const onTouchGesture = () => {
          if (revealed) return;
          reveal(true);
        };

        /**
         * Tastiera: rivela e basta, senza annullare il tasto.
         *
         * Prima i tasti di scorrimento (frecce, PagSu/Giù, Fine, Inizio e
         * SPAZIO) venivano annullati per tenere ferma l'immagine anche da
         * tastiera. Ma il listener sta su `window` e non guardava il bersaglio:
         * chi scriveva nella ricerca in hero, prima di aver mai scrollato,
         * perdeva la barra spaziatrice — le parole si attaccavano fra loro.
         *
         * È lo stesso difetto che e2e/tastiera.spec.ts sorveglia dall'onda 9,
         * quando un listener del preloader rese i campi inservibili in
         * produzione. La lezione di allora vale anche per un gesto legittimo:
         * chi naviga da tastiera deve avere lo scorrimento standard. La pagina
         * scorre e il blocco si rivela — la sola cosa che si perde è il fermo
         * immagine, che è una finezza, non una funzione.
         */
        const onFirstKey = (e: KeyboardEvent) => {
          if (revealed || e.metaKey || e.ctrlKey || e.altKey) return;
          reveal();
        };
        window.addEventListener("wheel", onWheelGesture, { passive: true });
        window.addEventListener("touchmove", onTouchGesture, { passive: true });
        window.addEventListener("keydown", onFirstKey);

        // Arrivo già scrollato (ancora, restore del browser): nessun blocco.
        const onScroll = () => {
          if (window.scrollY > 24) reveal();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => {
          section.removeEventListener("focusin", onFocusIn);
          window.removeEventListener("wheel", onWheelGesture);
          window.removeEventListener("touchmove", onTouchGesture);
          window.removeEventListener("keydown", onFirstKey);
          window.removeEventListener("scroll", onScroll);
          release();
        };
      });
    },
    { scope: sectionRef }
  );

  // (La profondità "camera viva" al puntatore — foto ±10px, testo ∓5px — è
  // stata ritirata su richiesta del cliente, 2026-08-03: l'hero resta fermo
  // sotto il mouse, insieme all'overscan a scale 1.04 che la accompagnava.)

  // Il video parte solo su desktop e se l'utente non ha ridotto le animazioni,
  // e solo se i file sono attivati. Su mobile / reduced-motion resta la foto: è
  // una scelta di peso (megabyte e batteria), non un effetto in attesa di gemello.
  // Il <video> viene montato SOLO dopo il primo paint del poster (LCP), così la
  // selezione della sorgente non entra nel percorso critico dell'immagine LCP.
  // Il verdetto sta dentro gsap.matchMedia e non in due `.matches` letti a mano:
  // così un tablet ruotato lo ri-valuta, invece di restare col responso del
  // primo render (foto per sempre in orizzontale, o video rimasto in verticale).
  useEffect(() => {
    if (!heroCinematic.enabled) return;
    const mm = gsap.matchMedia();
    mm.add(`${MQ.motionOk} and ${MQ.desktop}`, () => {
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
        // Il <video> è montato da uno state React, che il revert di GSAP non sa
        // disfare: se non lo rimettiamo giù a mano, chi restringe la finestra
        // sotto i 768 si tiene il video acceso. Il poster torna a fare da hero.
        setPlayVideo(false);
      };
    });
    return () => mm.revert();
  }, []);

  // `site.rating` è il valore macchina ("4.9"): in italiano, francese, tedesco e
  // spagnolo il separatore decimale è la virgola, e "4.9" letto da un italiano è un
  // refuso, non un numero. L'inglese resta col punto.
  const ratingDisplay = locale === "en" ? site.rating : site.rating.replace(".", ",");

  // Barra prove. Quattro prove DIVERSE fra loro, che è il punto: il voto Google
  // (volume), il premio Wikicasa (giudizio di terzi su base nazionale), l'anzianità
  // (radicamento) e il costo (rischio zero per chi si affida). Le due chip che stavano
  // qui prima — Open Domus e Domus D.O.C. — non sono prove ma nomi di servizi, hanno
  // una sezione ciascuna a pochi centimetri di scroll e ripeterle qui rubava lo spazio
  // all'unica prova indipendente che l'agenzia possiede.
  const chips: { label: string; href?: string }[] = [
    { label: c.awardChip, href: site.award.href },
    { label: c.place },
    { label: c.noCost },
  ];

  return (
    <section ref={sectionRef} id="top" data-surface="dark" className="relative flex min-h-[100dvh] w-full overflow-hidden bg-espresso text-cream">
      {/* Canvas media (foto + eventuale video) in un layer parallax unico */}
      <div ref={mediaRef} className="absolute inset-0">
        {/* Layer profondità puntatore: mediaRef è già owner di clip/scale del
            frame-in e l'IMG del ken-burns — il transform x/y vive SOLO qui.
            Il clip-path del genitore ritaglia comunque l'overscan. */}
        <div className="absolute inset-0">
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
            className="object-cover"
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
          espresso: la foto resta a scale 1 anche dentro l'arco, e questo velo è
          ciò che la fa leggere come la stessa "stanza" del pannello preloader. */}
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
        <div className="flex w-full flex-1 flex-col items-center">
          {/* Lockup: didone + script sovrapposto, come nel preloader.
              NON è più l'h1 (vedi la nota sopra `copy`): è tipografia di marca, e il
              titolo della pagina è la promessa qui sotto. Le lettere animate sono
              aria-hidden per costruzione (vedi Chars), quindi il nome leggibile vive
              nello span sr-only — un aria-label su un <div> senza ruolo verrebbe
              ignorato dalle AT e segnalato da axe (aria-prohibited-attr). */}
          <div className="relative">
            <div className="font-hero text-[clamp(3rem,min(14vh,19vw),8rem)] font-medium leading-[0.95] tracking-[-0.01em] text-cream">
              <span className="sr-only">Domus Tua</span>
              <Chars text="Domus" className="block" />
              <Chars text="Tua" className="block" />
            </div>
            <span
              data-hero-script
              aria-hidden
              className="pointer-events-none absolute -bottom-[0.5em] left-1/2 -translate-x-1/2 whitespace-nowrap font-script text-[clamp(2rem,min(6.5vh,9vw),4rem)] leading-none text-red [text-shadow:0_2px_28px_rgba(26,24,22,0.6)]"
            >
              <Chars text="Raffaela Rizza" variant="script" />
            </span>
          </div>

          {/* Sovratitolo: cosa fa l'agenzia e dove, prima ancora della promessa.
              NIENTE `dt-hero-rest` qui, di proposito: quel gruppo resta invisibile fino
              al primo scroll (vedi globals.css), e un sovratitolo che dice "agenzia
              immobiliare a Tradate" solo a chi scorre non serve a niente — è la prima
              cosa che deve esserci nel primo fotogramma, insieme al lockup e all'H1. */}
          <p className="mt-10 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-cream/70">
            {c.badge}
          </p>

          {/* L'H1 (posizione della riga "A place · to return to"): una frase sola,
              spezzata sul divisore. Le lettere animate sono aria-hidden (vedi Chars):
              il testo leggibile vive nello span sr-only — un aria-label qui sarebbe
              vietato (axe: aria-prohibited-attr). */}
          <h1 className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-hero text-[clamp(1.4rem,2.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.012em] text-cream">
            <span className="sr-only">{`${c.title1} ${c.title2}`}</span>
            <Chars variant="tagline" text={c.title1} />
            <span aria-hidden className="hidden h-px w-10 bg-cream/40 sm:block" />
            <Chars variant="tagline" text={c.title2} className="italic text-red-soft" />
          </h1>

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
                fornito dal cliente (docs/da-chiedere-alla-cliente.md §2.12). */}
          </p>

          {/* CTA */}
          <div
            data-hero-seq
            className="dt-hero-rest mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
          >
            {/* CTA primaria magnetica (solo pointer fine + motion ok) */}
            <Magnetic className="w-full sm:w-auto" strength={0.18}>
              <Cta href="#contatti" variant="cta-solid" size="lg" className="w-full">
                {c.ctaValuta}
              </Cta>
            </Magnetic>
            <Cta href="#cerca" variant="ghost-dark" size="lg">
              {c.ctaCerco}
            </Cta>
            {/* Un video PRECISO, non il canale.
                Puntava alla home di @DOMUSTUASRLIMMOBILIARE: chi cliccava "Guarda il
                video" atterrava su una griglia di decine di clip e doveva scegliere da
                solo — cioè non guardava niente. Qui va la storia in evidenza (la villa
                di Roberta, venduta al primo Open Domus), che è anche il video già
                incorporato più in basso nella pagina. */}
            <Cta
              href={youtubeWatch(site.videos.featured.id)}
              variant="ghost-dark"
              size="lg"
              arrow={false}
              target="_blank"
              rel="noopener noreferrer"
              className="!pl-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Play className="h-3.5 w-3.5" />
              </span>
              {c.ctaVideo}
            </Cta>
          </div>

          {/* Trust chips */}
          <div
            data-hero-seq
            className="tap-list dt-hero-rest mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-cream/15 pt-6"
          >
            <a href="#recensioni" className="tap-target flex items-center gap-2 hover:opacity-90">
              <span className="flex gap-0.5">
                {/* Oro come tutte le stelle del voto; qui la tacca chiara
                    della rampa, perché il fondo è espresso. */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-gold-light" />
                ))}
              </span>
              {/* Voto e conteggio in UN elemento solo: erano due, e affiancati
                  dicevano "4.9/5 Google" e poi "531 recensioni Google" — la stessa
                  parola due volte in dieci centimetri. */}
              <span className="text-sm font-semibold text-cream">
                {ratingDisplay}/5 · {c.reviews}
              </span>
            </a>
            {chips.map((ch) => {
              // La destinazione del premio è fuori dal sito (profilo Wikicasa): apre in
              // una scheda nuova come ogni altro link esterno del sito, e con rel
              // completo. Le ancore same-page restano nella stessa scheda.
              const external = ch.href?.startsWith("http");
              return ch.href ? (
                <a
                  key={ch.label}
                  href={ch.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="tap-target text-[0.82rem] font-medium text-cream/70 underline-offset-4 transition-colors duration-300 hover:text-cream hover:underline"
                >
                  {ch.label}
                </a>
              ) : (
                <span key={ch.label} className="text-[0.82rem] font-medium text-cream/70">
                  {ch.label}
                </span>
              );
            })}
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
      {/* Il salto più violento della home: foto scura contro crema, ΔRGB 520.
          Il velo porta il colore della pagina DENTRO la foto prima della
          giuntura, così i due bordi si incontrano già dello stesso colore. */}
      <SurfaceVeil edge="bottom" tone="cream-deep" height="30svh" />
    </section>
  );
}
