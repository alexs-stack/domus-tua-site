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
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star } from "./Icons";
import { Cta } from "./primitives/Cta";
import { site, ratingLabel } from "../lib/site";
import { heroCinematic } from "../lib/media";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, durDt, painted } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { ROLES, staggerEach, groupDelay } from "../lib/motion/text-roles";
import { afterCurtain, foldNetFired } from "../lib/motion/fold";
import { chapters } from "../lib/motion/chapters";
import SplitChars from "./motion/SplitChars";
import { useCorridor } from "./motion/useCorridor";

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
    ctaValuta: "Richiedi la valutazione",
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
    ctaValuta: "Request a valuation",
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
    ctaValuta: "Demander l’estimation",
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
    ctaValuta: "Bewertung anfordern",
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
    ctaValuta: "Solicita la valoración",
    ctaCerco: "Busco casa",
    ctaVendi: "Vender casa",
    reviews: `${site.reviewsCount} reseñas de Google`,
    place: "En Tradate desde 2007",
    awardChip: "Tres años consecutivos entre las 400 mejores agencias de Italia — Wikicasa Top Agency",
    noCost: "Sin costes por adelantado",
    heroAlt: "Raffaela Rizza presenta el salón de un ático luminoso con terraza ofrecido por Domus Tua",
  },
};

// ─── LE MISURE DEL TUFFO ─────────────────────────────────────────────────
// Alberto, 13 settembre 2026: il tuffo sticky dell'hero come era-residence
// (A18-A20, CAT §2), con la foto che sale fino a 0,80·tImg così il segno chiaro
// a quattro punte del file resta sotto il ritaglio (A23, D24; spec coreografia
// §3.2). Le misure usano offsetHeight e offsetTop, che i transform non
// toccano, come Era. `[data-hero-zoom]` ha già in SSR l'altezza resa della
// foto (classe aspect col rapporto del file e min-h-full): tImg è la sua
// altezza.
function heroBox(root: HTMLElement) {
  const bandH = root.querySelector<HTMLElement>("[data-hero-media]")?.offsetHeight ?? 0;
  const tImg = Math.max(bandH, root.querySelector<HTMLElement>("[data-hero-zoom]")?.offsetHeight ?? 0);
  return { bandH, tPrime: 0.8 * tImg };
}

/**
 * Salita della foto, A23 di Alberto (13 settembre 2026): fino a 0,80·tImg. Quando
 * 0,80·tImg < bandH (schermi più alti che larghi, per esempio 1024×1366) la salita resta 0:
 * altrimenti la foto scenderebbe e scoprirebbe il fondo avorio della banda (D24).
 */
function photoRise(root: HTMLElement): number {
  const { bandH, tPrime } = heroBox(root);
  return Math.max(0, tPrime - bandH);
}

/**
 * Salita del testo, A20 di Alberto (fedeltà letterale al tuffo di Era, spec §3.2):
 * L = max(1,25·t′ − bandH, 1,05·B), B = fondo del contenuto del blocco + 24 px.
 */
function textLift(root: HTMLElement): number {
  const { bandH, tPrime } = heroBox(root);
  const block = root.querySelector<HTMLElement>("[data-hero-block-lift]");
  const last = block?.lastElementChild as HTMLElement | null | undefined;
  const b = block && last ? last.offsetTop + last.offsetHeight - block.offsetTop + 24 : 0;
  return Math.max(1.25 * tPrime - bandH, 1.05 * b);
}

export default function HeroCinematic() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [playVideo, setPlayVideo] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  // L'ingresso delle lettere è partito in questo montaggio (spec §2.3): un cambio lingua dopo non lo rifà.
  const lettersPlayed = useRef(false);

  // Ingresso delle lettere a OGNI load, coi ruoli del testo di Era: `title` su
  // lockup e H1, `accent` sulla firma (A20 e A22 di Alberto, 13 settembre 2026;
  // spec coreografia §2.2 e §2.5). Lettere piatte, senza prospettiva (A22). I
  // tempi di Era superano il «ritmo disteso» di C21 (3 agosto); il video resta
  // spento come C21 chiede (media.ts). Ritardi dall'ordine nel gruppo: lockup
  // 0,3 s, H1 0,4 s, firma 0,3 s. Col sipario partono all'handoff (afterCurtain
  // di fold.ts, subito se l'handoff è già partito), senza sipario 150 ms dopo
  // l'armamento. Stato dipinto a 0,02 e rete CSS `dt-rest-failsafe` restano
  // quelli di globals.css su `data-hero-char/tchar/schar`; lockup, firma e H1
  // non portano `data-reveal`, quindi il motore dei gruppi non li tocca.
  // Cambio lingua (spec §2.3): LocaleProvider passa alla lingua del cookie in un
  // effetto passivo, dopo questo layout effect, e SplitChars crea span nuovi per
  // le lettere in più. Con `dependencies: [locale]` e `revertOnUpdate` l'effetto
  // si rifà sugli span di oggi: prima dell'ingresso si riarma; a ingresso partito
  // le lettere si accendono senza replay; a rete CSS già scattata si accendono
  // solo gli span nati dopo, e gli altri finiscono la loro animazione CSS.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const html = document.documentElement;
      if (!section) return;
      if (!html.hasAttribute("data-preloader") && !html.hasAttribute("data-hero-intro")) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const titleChars = gsap.utils.toArray<HTMLElement>("[data-hero-char]", section);
        const taglineChars = gsap.utils.toArray<HTMLElement>("[data-hero-tchar]", section);
        const scriptChars = gsap.utils.toArray<HTMLElement>("[data-hero-schar]", section);
        const allChars = [...titleChars, ...taglineChars, ...scriptChars];
        if (allChars.length === 0) return;
        const accendi = (els: HTMLElement[]) => {
          els.forEach((el) => {
            el.style.animation = "none";
          });
          gsap.set(els, { opacity: 1 });
        };

        if (lettersPlayed.current) {
          accendi(allChars);
          return;
        }
        // Rete CSS già scattata (JS arrivato tardi): nessun ingresso. Si accendono solo gli span
        // la cui animazione CSS non è ancora partita, cioè quelli nati col cambio lingua.
        if (foldNetFired(allChars[0], "dt-rest-failsafe")) {
          accendi(allChars.filter((el) => !foldNetFired(el, "dt-rest-failsafe")));
          return;
        }
        allChars.forEach((el) => {
          el.style.animation = "none";
        });
        gsap.set(allChars, { opacity: painted });

        let played = false;
        const play = () => {
          if (played) return;
          played = true;
          lettersPlayed.current = true;
          const title = ROLES.title.enter;
          const accent = ROLES.accent.enter;
          gsap.set(allChars, { willChange: "transform" });
          // Origine dei ruoli (spec §2.2): `accent` gira dalla linea di base, 50 % 100 %; `title` resta al centro.
          if (title.origin) gsap.set([...titleChars, ...taglineChars], { transformOrigin: title.origin });
          if (accent.origin) gsap.set(scriptChars, { transformOrigin: accent.origin });
          gsap
            .timeline({ onComplete: () => gsap.set(allChars, { clearProps: "willChange" }) })
            .fromTo(
              titleChars,
              { ...title.from },
              {
                ...title.to,
                duration: title.duration,
                ease: title.ease,
                stagger: staggerEach(title.stagger, titleChars.length, durDt.l),
                overwrite: true,
              },
              groupDelay("title", 0),
            )
            .fromTo(
              taglineChars,
              { ...title.from },
              {
                ...title.to,
                duration: title.duration,
                ease: title.ease,
                stagger: staggerEach(title.stagger, taglineChars.length, durDt.l),
                overwrite: true,
              },
              groupDelay("title", 1),
            )
            .fromTo(
              scriptChars,
              { ...accent.from },
              {
                ...accent.to,
                duration: accent.duration,
                ease: accent.ease,
                stagger: staggerEach(accent.stagger, scriptChars.length, durDt.l),
                overwrite: true,
              },
              groupDelay("accent", 0),
            );
        };

        if (html.hasAttribute("data-preloader")) return afterCurtain(play);
        const t = window.setTimeout(play, 150);
        return () => window.clearTimeout(t);
      });
    },
    { scope: sectionRef, dependencies: [locale], revertOnUpdate: true },
  );

  // Il tuffo (A18-A20 e A23 di Alberto; spec coreografia §3.2, CAT §2). Da
  // MQ.corridor lo schermo resta agganciato col bordo basso per 200svh: foto e
  // testo salgono a due velocità (dtEase, 0 → 0,6) e la foto scala 1 → 2
  // dall'origine 50 % 75 % (dtIn, 0,4 → 1). Il flip delle lettere sta sui
  // caratteri e i lift sui wrapper: nodi diversi. Nessun tween tocca un nodo
  // con utility translate-*, perché GSAP riscrive la proprietà `translate` e
  // toglierebbe il 26 % della firma: per questo la firma ha un wrapper suo.
  // Sotto il gate (spec §3.2), da 768 la foto scala fino a 1,12 in scrub
  // mentre la banda passa sotto la testata; sotto 768 salgono solo lockup e
  // firma, di 8svh. Fuoco (A19; spec §2.7 e §3.2): se l'elemento interseca il
  // viewport e non è ritagliato da `[data-hero-block]` il hook non sposta la
  // pagina (a p 0 la CTA sporge di ~18 px sotto il bordo a 1440×900 e 1024×768:
  // la porta in vista lo scroll nativo del fuoco, senza salti; D52); altrimenti
  // torna a `st.start`, dove H1 e CTA sono in vista senza transform. La bisezione
  // di default del hook guarda solo il viewport e non vede `overflow: clip`.
  useCorridor(sectionRef, {
    id: "hero",
    stick: "bottom",
    deps: [locale],
    focus: (el, st) => {
      const r = el.getBoundingClientRect();
      const clip = sectionRef.current?.querySelector("[data-hero-block]")?.getBoundingClientRect();
      const dentro =
        r.bottom > 0 && r.top < window.innerHeight && (!clip || (r.top >= clip.top && r.bottom <= clip.bottom));
      return dentro ? null : st.start;
    },
    build: (tl, q) => {
      const root = sectionRef.current;
      if (!root) return;
      const zoom = q("[data-hero-zoom]");
      tl.to(zoom, { y: () => -photoRise(root), ease: "dtEase", duration: 0.6 }, 0)
        .to(q("[data-hero-lift], [data-hero-block-lift]"), { y: () => -textLift(root), ease: "dtEase", duration: 0.6 }, 0)
        .to(zoom, { scale: 2, ease: chapters.hero.signature.ease, duration: 0.6 }, 0.4);
    },
    phone: (q) => {
      const root = sectionRef.current;
      const band = q("[data-hero-media]")[0];
      if (!root || !band) return;
      // Spec §3.2 (A20): lift di 12svh da 768 e di 8svh sotto. La banda è 60svh (--dt-band-h,
      // patto della porta), quindi un svh è la sua altezza divisa per 60.
      const svh = () => band.offsetHeight / 60;
      const headH = () => document.querySelector<HTMLElement>("header")?.offsetHeight ?? 0;
      const mm = gsap.matchMedia();
      mm.add(MQ.desktop, () => {
        const zoom = q("[data-hero-zoom]");
        gsap
          .timeline({
            defaults: { ease: "none", immediateRender: false },
            scrollTrigger: { trigger: band, start: 0, end: () => `bottom ${headH()}px`, scrub: true, invalidateOnRefresh: true },
          })
          .to(zoom, { scale: 1.12, ease: "dtIn", duration: 1 }, 0)
          .to(zoom, { y: () => -0.5 * photoRise(root), ease: "dtEase", duration: 1 }, 0)
          .to(q("[data-hero-lift]"), { y: () => -12 * svh(), ease: "dtEase", duration: 1 }, 0);
      });
      mm.add(MQ.belowDesktop, () => {
        gsap.to(q("[data-hero-lift]"), {
          y: () => -8 * svh(),
          ease: "dtEase",
          immediateRender: false,
          scrollTrigger: { trigger: band, start: 0, end: () => `bottom ${headH()}px`, scrub: true, invalidateOnRefresh: true },
        });
      });
      return () => mm.revert();
    },
  });

  // Il video parte solo su desktop e se l'utente non ha ridotto le animazioni,
  // e solo se i file sono attivati. Oggi `heroCinematic.enabled=false`
  // (media.ts, scelta cliente 2026-08-03): il gate non decide nulla.
  //
  // Sotto 768 niente video. I file sono il loop del drone di app/lib/media.ts
  // (1080 e 720, MP4 e WebM). Se la cliente riaccende il video (C21 lo tiene
  // spento): gate `MQ.motionOk` a ogni larghezza; `<source media="(max-width:
  // 767.98px)">` col 720 PRIMA del 1080; `preload="none"`; mai con
  // `navigator.connection.saveData`. Prova: `perf:report` a 390 senza
  // richieste `.mp4`.
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
    <section
      ref={sectionRef}
      id="top"
      data-corridor="hero"
      data-stick="bottom"
      className="relative bg-cream"
    >
      {/* Il marcatore del tema del monogramma sta FUORI dallo schermo sticky
          (spec coreografia §3.2, correzione bloccante 4 di homeA): copre la
          banda e, sotto il gate dei corridoi, tutto il corridoio fino alla
          cima di Posizionamento (globals.css). Lo legge il rilevatore di A21. */}
      <span
        aria-hidden
        data-bg="foto"
        className="pointer-events-none absolute left-0 top-0 h-[var(--dt-band-h)] w-px"
      />
      {/* Lo schermo del corridoio (A19 di Alberto): sticky solo sotto il gate,
          in CSS prima del paint. Nessuno stile qui: transform e ritagli stanno
          sui discendenti. */}
      <div data-corridor-screen>
        {/* LA BANDA CON LA FOTO DIETRO LA SCRITTA. `data-hero-media` resta per
            sonde ed e2e; il poster è la foto reale, candidato LCP della home;
            il <video> arriva dopo il primo paint, se e quando il cliente lo
            riaccende (media.ts). NESSUN VELO sopra la foto: la cliente ha
            bocciato vignettature e nero. L'inquadratura parte dall'alto
            (`objectPosition` 0 % in verticale), la stessa della sagoma del
            preloader che deve coincidere con questa foto (intro-clocks.test.ts):
            il lockup sta al CENTRO della banda e sotto resta in campo
            Raffaela; il 10 % orizzontale conta solo sul telefono, dove
            la foto è più larga della scatola e il taglio la terrebbe altrimenti
            fuori campo (l'avambraccio ingrandito che il cliente aveva
            segnalato, docs/foto-mobile.md). Il rettangolo avorio profondo
            precede la foto, come per ogni media del sito. */}
        <div
          data-hero-media
          className="relative flex h-[var(--dt-band-h)] w-full flex-col bg-cream-deep"
        >
          {/* Il ritaglio sta QUI, non sulla banda: la banda deve lasciar sbordare
              la firma sul bordo basso, come la calligrafia del riferimento che
              scavalca il bordo del video. */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Lo zoom del tuffo (A23): alto già in SSR quanto la foto resa
                (rapporto del file 2000×1415, mai meno della banda), così a
                riposo il ritaglio mostra gli stessi pixel di sempre e il patto
                della porta regge. Origine della scala 50 % 75 % (CAT §2). */}
            <div
              data-hero-zoom
              className="absolute inset-x-0 top-0 aspect-[2000/1415] min-h-full origin-[50%_75%]"
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
            </div>
          </div>

          {/* Lockup nel font del logo (`font-brand`, richiesta cliente: «stesso
              font del logo in tutte le scritte Domus Tua») e coi colori del
              logo, al centro della banda, SULLA foto: a 13vw le lettere si
              leggono anche dove la stanza è piena.
              NON è l'h1 (vedi la nota sopra `copy`).
              Le lettere animate stanno in uno span aria-hidden intorno a
              SplitChars: il nome leggibile vive nello span sr-only — un
              aria-label su un <div> senza ruolo verrebbe ignorato dalle AT e
              segnalato da axe (aria-prohibited-attr). Nel tuffo sale col testo
              (`data-hero-lift`, A19 di Alberto). */}
          <div
            data-hero-lift
            className="dt-row relative z-10 flex flex-1 flex-col items-center justify-center pb-[clamp(2rem,6vh,4rem)] pt-[clamp(1.5rem,4vh,3rem)] text-center"
          >
            {/* Minuscolo come il logo («DomusTua»): la regola globale mette in
                maiuscolo solo h1-h4, e questo è un div apposta. */}
            <div className="font-brand text-hero font-extrabold tracking-[-0.02em]">
              <span className="sr-only">Domus Tua</span>
              {/* Due righe centrate, come il lockup di sempre (posizioni chieste
                  da Alberto, 2026-09-10 sera); il font resta quello del logo.
                  Caratteri di SplitChars con la crenatura di `brand-800` (A20,
                  D20); `upper={false}` perché il lockup è minuscolo. */}
              <span aria-hidden className="block text-graphite">
                <SplitChars font="brand-800" locale={locale} upper={false} charAttr="data-hero-char">
                  Domus
                </SplitChars>
              </span>
              <span aria-hidden className="block text-red">
                <SplitChars font="brand-800" locale={locale} upper={false} charAttr="data-hero-char">
                  Tua
                </SplitChars>
              </span>
            </div>
          </div>

          {/* Firma PIÙ IN BASSO (richiesta cliente 2026-09-10), e sul BORDO della
              banda: prima cadeva sulla parte affollata della stanza — finestre,
              divano, la sua stessa mano — dove il rosso sottile spariva. Qui
              scavalca il confine foto/avorio, che è il gesto del riferimento
              (la calligrafia a cavallo del bordo del video). Metà lettera sta
              sulla foto, metà sull'avorio: si legge su entrambi.
              Il wrapper porta il lift del tuffo (A19 e A20 di Alberto, spec
              coreografia §3.2): lo span tiene `translate-y-[26%]`, che un tween
              di GSAP cancellerebbe. `.script-word` (globals.css:351-368) è fuori
              dai layer e impone `position: relative`: la firma sta nel flusso
              della banda, e il wrapper con lei, così il lockup non si sposta.
              `!text-…` perché `.script-word` vincerebbe sull'utility (regola
              unlayered-beats-utilities). Le lettere sono di SplitChars, con la
              crenatura di `script-400` (D20). */}
          <div data-hero-lift className="relative z-10 block">
            <span
              data-hero-script
              aria-hidden
              className="script-word dt-row relative block translate-y-[26%] text-center !text-[clamp(2.2rem,6vw,5.5rem)]"
              style={{ "--script-tuck": "0" } as React.CSSProperties}
            >
              <SplitChars font="script-400" locale={locale} upper={false} charAttr="data-hero-schar">
                Raffaela Rizza
              </SplitChars>
            </span>
          </div>
        </div>

        {/* Sotto la foto, sull'avorio e ancora nel primo schermo: sovratitolo,
            H1, CTA e voto, centrati come il lockup. Nel tuffo il contenuto sale
            (`data-hero-block-lift`) e sparisce sotto il bordo della foto, perché
            `data-hero-block` ritaglia con `clip` sotto il gate (globals.css):
            nessun testo d'inchiostro passa sopra la foto. */}
        {/* L'attacco tiene conto della firma: il Pinyon ha aste discendenti
            lunghe e, centrata com'e', cadeva esattamente sull'occhiello — «AGENZIA
            IMMOBILIARE A TRADATE» con dentro la coda della «ff» di Raffaela.
            Sotto lg la firma e' piu' piccola e serve meno aria. */}
        <div data-hero-block>
          <div
            data-hero-block-lift
            className="dt-row flex flex-col items-center pb-[clamp(2.5rem,7vh,4.5rem)] pt-[clamp(2.5rem,5vh,4rem)] text-center"
          >
            {/* Sovratitolo: cosa fa l'agenzia e dove, prima ancora della promessa.
                16 px, non di meno: la cliente non vuole scritte piccole. */}
            <p className="text-balance text-ui font-semibold uppercase tracking-[0.08em] text-stone">
              {c.badge}
            </p>
            <h1 className="mx-auto mt-3 max-w-[28ch] font-display text-d3">
              <span className="sr-only">{`${c.title1} ${c.title2}`}</span>
              {/* H1 maiuscolo per la regola globale di h1-h4, a peso 500
                  (globals.css:318-322): crenatura di `display-500` col maiuscolo
                  della lingua (A20, D20). */}
              <span aria-hidden className="block">
                <SplitChars font="display-500" locale={locale} upper charAttr="data-hero-tchar">
                  {c.title1}
                </SplitChars>
              </span>
              <span aria-hidden className="block">
                <SplitChars font="display-500" locale={locale} upper charAttr="data-hero-tchar">
                  {c.title2}
                </SplitChars>
              </span>
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
        </div>
      </div>
      {/* Lo spaziatore della corsa (200svh; A19 di Alberto, D22: layout in CSS
          prima del paint): in SSR è nascosto, lo accende la CSS dei corridoi
          sotto il gate. */}
      <div data-corridor-run aria-hidden className="hidden" />
    </section>
  );
}
