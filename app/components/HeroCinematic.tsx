"use client";

// HeroCinematic — l'hero della rivista bianca (direttiva cliente 2026-09-10,
// rif. immobiliaregoldengoal.it) con la FOTO DIETRO LA SCRITTA (richiesta di
// Alberto, 2026-09-11: «come era prima del cambiamento», cioè la foto che fa
// da fondo al lockup, non un media dopo il testo). La foto reale è la banda
// alta del primo schermo e sopra ci stanno SOLO il lockup «Domus Tua» nel
// font del logo a 13vw e la firma calligrafica: a quella misura le lettere
// si leggono su qualunque stanza. Sovratitolo, H1 a d3, CTA e voto seguono
// sull'avorio, nello stesso primo schermo — a 38 px un titolo sopra un
// divano non si legge, e il velo scuro che prima lo salvava è ciò che la
// cliente ha bocciato (punti 10 e 13: vignettatura no, niente nero). Niente
// curve, niente scritte piccole. Del vecchio hero cinematografico restano il
// rito d'ingresso delle lettere dopo il preloader (`data-hero-char/tchar/
// schar`) e il mount del <video> dopo il primo paint. Vedi docs/hero-video.md.
import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star } from "./Icons";
import { Cta } from "./primitives/Cta";
import { site, ratingLabel } from "../lib/site";
import { heroCinematic } from "../lib/media";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";
import { INTRO_EVENT, HERO_REST_MS, HERO_REST_WARM_MS } from "../lib/motion/intro-constants";
import { hasIntroFired } from "./motion/Preloader";

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
//
// 2026-09-10 (chiamata cliente): via `subcopy` e `founder` (la riga «RR Con
// Raffaela Rizza e il team») e via il bottone del video, sostituito da «Vendi
// casa» → /vendi. `place`/`awardChip`/`noCost` non si mostrano più qui (le
// chip in piccolo sono state tolte); il sigillo Wikicasa torna in Voci (spec
// §4.1), le chiavi restano finché quel capitolo non le riprende.
// ─────────────────────────────────────────────────────────────────────────────
const copy = {
  it: {
    badge: "Agenzia immobiliare a Tradate · dal 2007",
    title1: "Vendi casa a Tradate",
    title2: "al prezzo giusto, nei tempi giusti.",
    ctaValuta: "Richiedi la valutazione del tuo immobile",
    ctaCerco: "Cerco casa",
    ctaVendi: "Vendi casa",
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
    ctaValuta: "Request a valuation of your property",
    ctaCerco: "I’m looking for a home",
    ctaVendi: "Sell your home",
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
    ctaValuta: "Demandez l’estimation de votre bien",
    ctaCerco: "Je cherche un bien",
    ctaVendi: "Vendre",
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
    ctaValuta: "Bewertung Ihrer Immobilie anfordern",
    ctaCerco: "Ich suche ein Zuhause",
    ctaVendi: "Verkaufen",
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
    ctaValuta: "Solicita la valoración de tu inmueble",
    ctaCerco: "Busco casa",
    ctaVendi: "Vender casa",
    reviews: `${site.reviewsCount} reseñas de Google`,
    place: "En Tradate desde 2007",
    awardChip: "Tres años consecutivos entre las 400 mejores agencias de Italia — Wikicasa Top Agency",
    noCost: "Sin costes por adelantado",
    heroAlt: "Raffaela Rizza presenta el salón de un ático luminoso con terraza ofrecido por Domus Tua",
  },
};

/**
 * La rete CSS dell'hero (`dt-rest-failsafe`, delay HERO_REST_MS in
 * globals.css) è già scattata? Dal 2026-08-17 (opzione D) quella rete non è
 * più «se il JS non arriva mai» a 6 s: scatta a INTRO_T.dive + 200 ms, DENTRO
 * l'intro, perché il film del preloader è tutto CSS e la porta si apre anche
 * senza JS — le lettere devono accendersi quando l'arco le scopre. Sul
 * telefono lento misurato (JS a 8-12 s) questo effect arriva DOPO: se
 * rifacesse l'ingresso da zero, le lettere già accese sparirebbero e
 * rientrerebbero. Quindi si legge l'orologio: `currentTime` dell'animazione
 * CSS del nodo (conta dal suo start time, delay compreso: ≥ HERO_REST_MS
 * vuol dire che la rete è almeno cominciata); di riserva il tempo dal boot
 * script (`__dtPreT0`) o, senza di lui, dall'origine — che è in anticipo
 * sul primo paint, quindi al più si dichiara «scattata» una rete che sta per
 * scattare, mai il contrario.
 */
function heroNetFired(node: Element | null | undefined): boolean {
  // Due reti, due orologi: con l'intro (`data-hero-rest="intro"`, boot
  // script) la rete è a HERO_REST_MS dentro il film; senza intro (visita di
  // ritorno) è quella di sempre a HERO_REST_WARM_MS. Confondere le due
  // (2026-08-18) faceva saltare il rito a caldo su una macchina lenta: la
  // rete «scattata» a 3,33 s che a caldo non esiste.
  const withIntro = document.documentElement.getAttribute("data-hero-rest") === "intro";
  const restMs = withIntro ? HERO_REST_MS : HERO_REST_WARM_MS;
  try {
    const anim = node
      ?.getAnimations?.()
      .find((a) => (a as CSSAnimation).animationName === "dt-rest-failsafe");
    if (anim && typeof anim.currentTime === "number") return anim.currentTime >= restMs;
  } catch {
    /* getAnimations assente: la riserva qui sotto */
  }
  const t0 = (window as unknown as { __dtPreT0?: number }).__dtPreT0;
  // Senza intro non c'è __dtPreT0: si conta dall'origine, che precede il
  // primo paint — al più si dichiara scattata una rete che sta per scattare.
  return performance.now() - (typeof t0 === "number" ? t0 : 0) >= restMs;
}

// Split in lettere reso in SSR (niente SplitText nel chunk della home):
// ogni char è uno <span> animabile; gli spazi restano nodi di testo normali.
// I wrapper sono aria-hidden: il testo accessibile vive nello span sr-only
// del genitore, i motori di ricerca leggono comunque il testo nel DOM.
// Niente `will-change-transform` in classe: lo scrive GSAP un attimo prima
// dell'ingresso e lo toglie a ingresso finito (vedi `play()` più giù).
//
// Le PAROLE sono `inline-block` + `whitespace-nowrap` a loro volta: fra due
// inline-block adiacenti il browser trova un'opportunità di a-capo (CSS Text
// §5.2, atomic inline), e un H1 a 22ch spezzerebbe «Tradate» a metà riga.
// Nel vecchio hero non si vedeva perché il titolo stava su una riga sola.
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
      {text.split(" ").map((word, w) => (
        <Fragment key={w}>
          {w > 0 && " "}
          <span className="inline-block whitespace-nowrap">
            {word.split("").map((ch, i) => (
              <span key={i} {...attr} className="inline-block">
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export default function HeroCinematic() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [playVideo, setPlayVideo] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Coreografia d'ingresso delle lettere — a OGNI load (anche al refresh le
  // scritte rientrano). Quel che cambia è solo QUANDO partono:
  // - CON preloader (prima visita di sessione): al handoff INTRO_EVENT, cioè
  //   mentre il tuffo dentro la porta ad arco è ancora in corso.
  // - SENZA preloader (refresh/visite successive): subito dopo l'idratazione.
  //   L'attributo html[data-hero-intro] (inline script, pre-paint) le tiene a
  //   opacity 0.02: dipinte ma invisibili, così non c'è flash prima del reveal.
  // Video e blocco CTA NON sono di questa timeline: sono visibili da subito
  // (il rito «appare al primo scroll» è caduto con l'hero a schermo intero).
  useGSAP(
    () => {
      const section = sectionRef.current;
      const html = document.documentElement;
      if (!section) return;
      const withPreloader = html.hasAttribute("data-preloader");
      if (!withPreloader && !html.hasAttribute("data-hero-intro")) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        // Reveal per LETTERE: i chars del lockup e della riga motto salgono
        // salendo dalla maschera (niente flip: tre gesti soli, come il riferimento).
        const titleChars = gsap.utils.toArray<HTMLElement>("[data-hero-char]", section);
        const taglineChars = gsap.utils.toArray<HTMLElement>("[data-hero-tchar]", section);
        const scriptChars = gsap.utils.toArray<HTMLElement>("[data-hero-schar]", section);
        const allChars = [...titleChars, ...taglineChars, ...scriptChars];

        // La rete CSS è già scattata (JS arrivato dopo INTRO_T.dive + 200 ms:
        // il telefono lento, o un refresh con idratazione tarda)? Allora le
        // lettere sono già accese, o si stanno accendendo in CSS: NON si
        // rifà l'ingresso — né si toccano le loro animazioni, che finiscono da
        // sole a opacity 1. Il film percepito è «le lettere si sono accese
        // quando la porta si è aperta», che è il film giusto; solo, l'ha
        // suonato la CSS.
        if (heroNetFired(allChars[0])) return;

        // Il failsafe CSS (opacity a 1 a HERO_REST_MS) va spento: comanda GSAP.
        allChars.forEach((el) => {
          el.style.animation = "none";
        });

        // Gli elementi restano DIPINTI a opacity 0.02 invece che a 0: lo stato
        // coreografico vero si applica solo un attimo prima del reveal, così
        // non c'è nessun lampo di testo composto. (L'H1 non è candidato LCP:
        // `Chars` lo spezza in span inline-block e la frammentazione lo toglie
        // di mezzo da sola; il candidato è il poster del video qui sotto.)
        gsap.set(allChars, { opacity: 0.02 });

        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          // Stati di partenza reali, applicati mentre la zona è ancora coperta
          // dal sipario. will-change SOLO per la finestra dell'ingresso:
          // promosso qui, demosso a timeline finita (onComplete).
          gsap.set(allChars, { willChange: "transform" });
          gsap.set([...titleChars, ...taglineChars], {
            opacity: 0,
            yPercent: 50,
          });
          gsap.set(scriptChars, {
            opacity: 0,
            x: "6vw",
            transformOrigin: "center bottom",
          });
          // Ritmo disteso (richiesta cliente 2026-08-03): durate a dur.hero e
          // stagger larghi — le lettere si posano, non sfrecciano.
          const tl = gsap.timeline({
            defaults: { ease: "domus" },
            // Le lettere sono ferme da qui in poi: i livelli promossi tornano giù.
            onComplete: () => gsap.set(allChars, { clearProps: "willChange" }),
          });
          tl.to(
            titleChars,
            {
              opacity: 1,
              yPercent: 0,
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
                duration: dur.hero,
                stagger: 0.032,
                ease: "dtOut",
              },
              0.7
            );
        };

        if (withPreloader) {
          // Parte all'uscita del preloader (una sola timeline percepita).
          // Se l'handoff è GIÀ partito — Preloader.tsx idratato a tuffo
          // cominciato spara INTRO_EVENT nel proprio layout effect, che
          // nell'albero precede questo: l'evento è passato prima che il
          // listener esista — si parte adesso, senza aspettare la rete.
          if (hasIntroFired()) {
            play();
            return;
          }
          // Safety: se l'evento va perso, si rivela comunque — HERO_REST_MS
          // (intro-constants.ts: dive + 200 ms, lo stesso numero della rete
          // CSS `data-hero-rest`, qui contato dal mount), non un numero sparso.
          window.addEventListener(INTRO_EVENT, play, { once: true });
          const safety = window.setTimeout(play, HERO_REST_MS);
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

  // Il video parte solo su desktop e se l'utente non ha ridotto le animazioni,
  // e solo se i file sono attivati. Oggi `heroCinematic.enabled=false`
  // (media.ts, scelta cliente 2026-08-03): il gate non decide nulla.
  //
  // KEEP OFF MOTIVATO sotto 768: MANCA L'ASSET — `domus-hero.mp4` è 5,4 MB a
  // 1920×1080, senza webm né variante mobile. La ricetta per quando arriva
  // `hero-mobile.mp4` (≤ 3 MB, 720p, stesso taglio) e il cliente riaccende il
  // video: gate `MQ.motionOk` a ogni larghezza; `<source media="(max-width:
  // 767.98px)">` PRIMA del sorgente 1080p; `preload="none"`; mai con
  // `navigator.connection.saveData` o rete 2g. Prova: `perf:report` a 390
  // senza richieste `.mp4` finché l'asset mobile non c'è.
  //
  // Il <video> viene montato SOLO dopo il primo paint del poster (LCP), così la
  // selezione della sorgente non entra nel percorso critico dell'immagine LCP.
  // Il verdetto sta dentro gsap.matchMedia e non in due `.matches` letti a
  // mano: così un tablet ruotato lo ri-valuta invece di restare col responso
  // del primo render.
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

  // La regola del separatore decimale vive in site.ts (`ratingLabel`): stava qui, e
  // intanto /recensioni scriveva "4.9/5" in italiano. Una regola sola, un posto solo.
  const ratingDisplay = ratingLabel(locale);

  return (
    <section ref={sectionRef} id="top" className="relative bg-cream">
      {/* LA BANDA CON LA FOTO DIETRO LA SCRITTA. `data-hero-media` resta per
          sonde ed e2e; il poster è la foto reale, candidato LCP della home;
          il <video> arriva dopo il primo paint, se e quando il cliente lo
          riaccende (media.ts). NESSUN VELO sopra la foto: la cliente ha
          bocciato vignettature e nero. L'inquadratura parte dall'alto
          (`objectPosition` 0 % in verticale): il lockup sta in ALTO nella
          banda, sul soffitto chiaro della stanza, e sotto resta in campo
          Raffaela; il 10 % orizzontale conta solo sul telefono, dove
          la foto è più larga della scatola e il taglio la terrebbe altrimenti
          fuori campo (l'avambraccio ingrandito che il cliente aveva
          segnalato, docs/foto-mobile.md). Il rettangolo avorio profondo
          precede la foto, come per ogni media del sito. */}
      <div
        data-hero-media
        className="relative flex h-[var(--dt-band-h)] w-full flex-col overflow-hidden bg-cream-deep"
      >
        <Image
          src={heroCinematic.base}
          alt={c.heroAlt}
          fill
          // `preload`, non `priority` (deprecata in Next 16, come in PageHero):
          // è l'unica immagine prioritaria del sito, la LCP della home.
          preload
          // Qualità 78 (non 60): la sorgente è una foto WhatsApp già molto
          // compressa e ricampionata — una seconda compressione aggressiva
          // la sgranerebbe visibilmente a tutta larghezza.
          quality={78}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "10% 0%" }}
        />
        {playVideo && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "10% 0%" }}
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

        {/* Lockup nel font del logo (`font-brand`, richiesta cliente: «stesso
            font del logo in tutte le scritte Domus Tua») e coi colori del
            logo, in alto SULLA foto (sul soffitto chiaro: a 13vw le lettere
            si leggono anche dove la stanza è piena, ma il soffitto è meglio).
            NON è l'h1 (vedi la nota sopra `copy`).
            Le lettere animate sono aria-hidden per costruzione (Chars): il
            nome leggibile vive nello span sr-only — un aria-label su un <div>
            senza ruolo verrebbe ignorato dalle AT e segnalato da axe
            (aria-prohibited-attr). */}
        <div className="dt-row relative z-10 flex flex-1 flex-col items-center pb-[clamp(2rem,6vh,4rem)] pt-[clamp(1.5rem,4vh,3rem)] text-center">
          {/* Minuscolo come il logo («DomusTua»): la regola globale mette in
              maiuscolo solo h1-h4, e questo è un div apposta. */}
          <div className="font-brand text-hero font-extrabold tracking-[-0.02em]">
            <span className="sr-only">Domus Tua</span>
            {/* Due righe centrate, come il lockup di sempre (posizioni chieste
                da Alberto, 2026-09-10 sera); il font resta quello del logo. */}
            <Chars text="Domus" className="block text-graphite" />
            <Chars text="Tua" className="block text-red" />
          </div>
          {/* Firma PIÙ IN BASSO (richiesta cliente 2026-09-10): staccata sotto
              il lockup, non più sovrapposta al piede delle lettere.
              `!text-…` perché `.script-word` è fuori dai layer e vincerebbe
              sull'utility (regola unlayered-beats-utilities). */}
          <span
            data-hero-script
            aria-hidden
            className="script-word mt-[0.25em] block !text-[clamp(2.2rem,6vw,5.5rem)]"
          >
            <Chars text="Raffaela Rizza" variant="script" />
          </span>
        </div>
      </div>

      {/* Sotto la foto, sull'avorio e ancora nel primo schermo: sovratitolo,
          H1, CTA e voto, centrati come il lockup. */}
      <div className="dt-row flex flex-col items-center pb-[clamp(2.5rem,7vh,5rem)] pt-[clamp(1.5rem,4vh,3rem)] text-center">
        {/* Sovratitolo: cosa fa l'agenzia e dove, prima ancora della promessa.
            16 px, non di meno: la cliente non vuole scritte piccole. */}
        <p className="text-ui font-semibold uppercase tracking-[0.08em] text-stone">{c.badge}</p>
        <h1 className="mx-auto mt-3 max-w-[28ch] font-display text-d3">
          <span className="sr-only">{`${c.title1} ${c.title2}`}</span>
          <Chars variant="tagline" text={c.title1} className="block" />
          <Chars variant="tagline" text={c.title2} className="block" />
        </h1>
        <div className="mt-6 flex w-full max-w-[640px] flex-col items-center gap-4">
          <Cta href="/valutazione-immobile-tradate" variant="cta-solid" size="lg" arrow={false}>
            {c.ctaValuta}
          </Cta>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Cta href="/vendi" variant="ghost" arrow={false}>
              {c.ctaVendi}
            </Cta>
            <Cta href="#cerca" variant="ghost" arrow={false}>
              {c.ctaCerco}
            </Cta>
          </div>
          {/* Voto e conteggio in UN elemento solo, 16 px. Oro solo sulle
              stelle: l'unica eccezione cromatica già sancita. */}
          <a href="#recensioni" className="mt-2 flex items-center gap-3 text-ui text-ink">
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-gold" />
              ))}
            </span>
            <span className="font-semibold">
              {ratingDisplay}/5 · {c.reviews}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
