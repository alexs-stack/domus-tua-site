"use client";

import Image from "next/image";
import { useRef } from "react";
import Reveal from "./Reveal";
import MaskReveal from "./motion/MaskReveal";
import Parallax from "./motion/Parallax";
import TextLines from "./motion/TextLines";
import Fioritura from "./motion/Fioritura";
import { Star, Play } from "./Icons";
import { testimonialVideo, youtubeWatch } from "../lib/videos";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ } from "../lib/motion/gsap";

type Props = {
  quote?: string;
  author?: string;
  context?: string;
  image?: string;
  alt?: string;
  videoHref?: string;
};

const copy = {
  it: {
    eyebrow: "Una storia, tra centinaia",
    quote:
      "Ci hanno ascoltato prima ancora di parlare di prezzo. L’appartamento è stato venduto al primo Open Domus, e noi sereni dall’inizio alla fine.",
    author: "Cliente Domus Tua",
    context: "Venduto al primo Open Domus, Tradate",
    alt: "Raffaela Rizza con una cliente nella video recensione Domus Tua",
    watchVideo: "Guarda la video recensione",
    watchVideoAria: "Guarda la video recensione su YouTube",
  },
  en: {
    eyebrow: "One story, among hundreds",
    quote:
      "They listened to us before we even talked about price. The apartment sold at the very first Open Domus, and we felt at ease from start to finish.",
    author: "Domus Tua client",
    context: "Sold at the first Open Domus, Tradate",
    alt: "Raffaela Rizza with a client in the Domus Tua video testimonial",
    watchVideo: "Watch the video testimonial",
    watchVideoAria: "Watch the video testimonial on YouTube",
  },
  fr: {
    eyebrow: "Une histoire, parmi des centaines",
    quote:
      "Ils nous ont écoutés avant même de parler de prix. L’appartement a été vendu dès le premier Open Domus, et nous avons été sereins du début à la fin.",
    author: "Client Domus Tua",
    context: "Vendu au premier Open Domus, Tradate",
    alt: "Raffaela Rizza avec une cliente dans le témoignage vidéo Domus Tua",
    watchVideo: "Voir le témoignage vidéo",
    watchVideoAria: "Voir le témoignage vidéo sur YouTube",
  },
  de: {
    eyebrow: "Eine Geschichte, unter Hunderten",
    quote:
      "Sie haben uns zugehört, noch bevor über den Preis gesprochen wurde. Die Wohnung wurde schon beim ersten Open Domus verkauft, und wir waren von Anfang bis Ende entspannt.",
    author: "Domus Tua Kundin",
    context: "Beim ersten Open Domus verkauft, Tradate",
    alt: "Raffaela Rizza mit einer Kundin im Domus Tua Video-Testimonial",
    watchVideo: "Video-Testimonial ansehen",
    watchVideoAria: "Video-Testimonial auf YouTube ansehen",
  },
  es: {
    eyebrow: "Una historia, entre cientos",
    quote:
      "Nos escucharon antes incluso de hablar de precio. El piso se vendió en el primer Open Domus, y estuvimos tranquilos de principio a fin.",
    author: "Cliente de Domus Tua",
    context: "Vendido en el primer Open Domus, Tradate",
    alt: "Raffaela Rizza con una clienta en el testimonio en vídeo de Domus Tua",
    watchVideo: "Ver el testimonio en vídeo",
    watchVideoAria: "Ver el testimonio en vídeo en YouTube",
  },
};

export default function FeaturedTestimonial(props: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  const cardRef = useRef<HTMLDivElement | null>(null);
  const glyphRef = useRef<HTMLSpanElement | null>(null);
  const starsRef = useRef<HTMLSpanElement | null>(null);

  // Un'unica timeline all'ingresso della card: la virgoletta si "posa"
  // (scala + rotazione), poi le stelle sbocciano in sequenza. Solo transform.
  // TextLines resta autonomo: ha la sua maschera per righe.
  useGSAP(
    () => {
      const card = cardRef.current;
      if (!card) return;
      const mm = gsap.matchMedia();

      // DUE CONTESTI. L'ingresso non dipende dal puntatore né dalla larghezza;
      // la parallasse sì. Tenerli insieme vorrebbe dire che GSAP reverte e
      // ricostruisce ANCHE l'ingresso a ogni attraversamento dei 1024 — e la
      // timeline riparte dal suo from-state (virgoletta a scale 0.7 e ruotata,
      // stelle a 0.6) con `toggleActions` che sullo slot onLeave non fa nulla:
      // se la card è già passata, resta rimpicciolita e storta fino a un nuovo
      // ingresso dall'alto.
      mm.add(MQ.motionOk, () => {
        const tl = gsap.timeline({
          // Replay a ogni passaggio: restart all'ingresso, reverse risalendo
          // (niente clearProps: la timeline resta riavvolgibile).
          scrollTrigger: { trigger: card, start: "top 82%", toggleActions: "restart none none reverse" },
        });
        if (glyphRef.current) {
          tl.fromTo(
            glyphRef.current,
            { scale: 0.7, rotate: -6 },
            {
              scale: 1,
              rotate: 0,
              duration: 1,
              ease: "expo.out",
            },
            0
          );
        }
        if (starsRef.current) {
          tl.fromTo(
            starsRef.current.children,
            { scale: 0.6, transformOrigin: "50% 50%" },
            {
              scale: 1,
              duration: 0.6,
              ease: "back.out(1.6)",
              stagger: 0.06,
            },
            0.55
          );
        }
      });

      /* PARALLASSE DA PUNTATORE A LENTE LUNGA.
           Rif. _refs/three-skull — vedi docs/effetti-reference.md §2.5.
           Due piani che TRASLANO, mai che ruotano: il tilt su una card
           editoriale con dentro una citazione lunga la fa "ondeggiare" e il
           testo diventa faticoso. La traslazione dà profondità senza spostare
           niente di leggibile.
           Quote fisse: 5% per la fotografia (piano lontano), 3% in senso
           CONTRARIO per la virgoletta (piano vicino). È l'opposizione a fare
           la profondità, non l'ampiezza.
           quickTo = smorzamento critico: il piano insegue il puntatore senza
           rimbalzare e senza creare una tween nuova a ogni mousemove.
           Sul dito resta spenta PER SEMPRE, e non è un buco della parità
           mobile: senza puntatore non c'è nessun bersaglio da inseguire, e
           l'effetto semplicemente non esiste.
           La soglia sta nelle condizioni e non in un window.matchMedia letto a
           mano: prima si decideva una volta sola all'idratazione, e un tablet
           ruotato restava con la scelta di prima. */
      mm.add(`${MQ.motionOk} and ${MQ.lg} and ${MQ.finePointer}`, () => {
        const photo = card.querySelector<HTMLElement>("[data-ft-photo]");
        const glyph = glyphRef.current;
        const set = (el: HTMLElement | null, amt: number) =>
          el
            ? {
                x: gsap.quickTo(el, "x", { duration: 0.7, ease: "power3" }),
                y: gsap.quickTo(el, "y", { duration: 0.7, ease: "power3" }),
                amt,
              }
            : null;
        const planes = [set(photo, 0.05), set(glyph, -0.03)].filter(Boolean) as {
          x: gsap.QuickToFunc;
          y: gsap.QuickToFunc;
          amt: number;
        }[];
        const onMove = (e: PointerEvent) => {
          const r = card.getBoundingClientRect();
          // Bersaglio fisso al centro della card: normalizzato -1..1.
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          planes.forEach((p) => {
            p.x(nx * r.width * p.amt);
            p.y(ny * r.height * p.amt);
          });
        };
        const onLeave = () => planes.forEach((p) => (p.x(0), p.y(0)));
        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerleave", onLeave);
        return () => {
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: cardRef }
  );

  const defaults = {
    quote: c.quote,
    author: c.author,
    context: c.context,
    image: "/images/reali/consulenza.jpg",
    alt: c.alt,
    videoHref: youtubeWatch(testimonialVideo.id),
  };

  const { quote, author, context, image, alt, videoHref } = { ...defaults, ...props };

  return (
    <section data-tone="paper" className="relative bg-paper">
      {/* LA LASTRA — la fotografia non è più una colonna dentro una card: è una
          banda a tutta larghezza con la citazione sopra, in crema.
          Il `py` esterno NON è un ripensamento: la superficie continua deve
          restare visibile sopra e sotto, così la lastra legge come CONTENUTO
          dentro la pagina e non come un secondo fondo che la interrompe. È la
          differenza fra «immagine grande» e il «taglio» che abbiamo tolto. */}
      <div className="py-16 sm:py-24">
        <div ref={cardRef} className="relative isolate overflow-hidden bg-ink">
          {/* Il sipario da destra era già il gesto di questa sezione: ora
              attraversa tutto lo schermo invece di mezza card.
              data-ft-photo: il piano lontano della parallasse da puntatore.
              Sta DENTRO la maschera e FUORI dal Parallax di scroll, così i due
              movimenti non si contendono la stessa transform.
              Il Parallax di scroll è `mobile`: sul telefono la parallasse da
              puntatore non esiste (non c'è puntatore) e questa lastra è la
              fotografia più grande della home. Restava l'unica immagine a
              piena larghezza completamente immobile — che è precisamente il
              momento in cui una foto grande legge come uno sfondo incollato.
              Il velo sta anch'esso DENTRO la maschera: fuori, prima che il
              sipario si apra, si vedrebbe un rettangolo scuro a tutta pagina —
              esattamente la giuntura che non vogliamo. */}
          <MaskReveal from="right" zoom={1.1} className="absolute inset-0" innerClassName="absolute inset-0">
            <div data-ft-photo className="absolute inset-0">
              <Parallax speed={0.12} scale={1.12} mobile className="absolute inset-0" innerClassName="absolute inset-0">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  sizes="100vw"
                  // Niente `priority`: l'unica immagine prioritaria del sito è
                  // l'hero. 75 è uno dei valori configurati in images.qualities.
                  quality={75}
                  className="photo-warm object-cover"
                  // A tutta larghezza il ritaglio è severo: il sorgente è quasi
                  // quadrato (1920×1625) e centrato terrebbe in campo la
                  // scrivania tagliando i volti. 42% inquadra la consulenza.
                  style={{ objectPosition: "50% 42%" }}
                />
              </Parallax>
            </div>
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/45 to-ink/20"
            />
          </MaskReveal>

          {/* IL TRALCIO — DENTRO la lastra, nell'angolo in alto a sinistra
              (2026-08-09, direttiva cliente: «i fiori vanno dentro la card, in
              questo caso l'immagine»). Prima nasceva sul crema e scavalcava il
              bordo alto della lastra; adesso l'`overflow: hidden` della lastra
              lo rifila e il tralcio fiorisce sulla fotografia.
              Sta DOPO la MaskReveal (quindi sopra la foto e il velo) e PRIMA
              della colonna di testo (quindi sotto la citazione): l'ordine del
              DOM è l'ordine di pittura, ed è così che la regola «mai un fiore
              sopra un testo» regge da sola. In alto a sinistra, poi, il testo
              non c'è: la prima riga della colonna è il tondo del video, ancorato
              a destra.
              `palette="dark"`: il fondo qui è fotografia velata di scuro, e su
              quella i rossi di brand si spengono. È la stessa scelta già presa
              per i due tralci che vivono su una foto (Metodo, lastra Servizi).
              Acceso anche sotto lg (onda «parità mobile 2», verdetto 6): a 390
              l'angolo alto a sinistra è libero come sul desktop — la prima
              riga della colonna è il tondo del video, a destra — e il box è
              117px quadrati (`w-[30vw]`), con dpr 1,5 e tetto 900 dentro
              Fioritura. È l'unica Fioritura della sezione. */}
          <Fioritura
            variant="corner-tl"
            palette="dark"
            className="pointer-events-none absolute left-0 top-0 h-[16vh] w-[30vw] lg:h-[26vh] lg:w-[12vw]"
          />

          {/* La colonna di testo detta l'altezza della lastra: la foto è
              `absolute inset-0` e si adatta, quindi non esiste una misura
              scritta due volte che possa divergere. */}
          <div className="relative mx-auto flex min-h-[74svh] max-w-[1240px] flex-col justify-between gap-12 px-5 py-12 sm:px-8 sm:py-16">
            {/* In alto solo il richiamo al video: l'angolo alto-sinistro resta
                libero per il tralcio (regola: mai un fiore sopra un testo). */}
            <div className="flex justify-end">
              <Reveal>
                <a
                  href={videoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={c.watchVideoAria}
                  className="group flex h-16 w-16 items-center justify-center rounded-full bg-paper/90 text-red shadow-lg transition-transform duration-300 hover:scale-110"
                >
                  <Play className="h-6 w-6" />
                </a>
              </Reveal>
            </div>

            <div>
              <Reveal>
                <span className="eyebrow eyebrow-light">{c.eyebrow}</span>
                {/* Segno tipografico editoriale: virgoletta fuori scala. Sul
                    velo scuro il rosso al 20% sparirebbe: qui sta al 55%. */}
                <span
                  ref={glyphRef}
                  aria-hidden
                  className="mt-2 block font-display text-[5.5rem] italic leading-[0.5] text-red/55"
                >
                  “
                </span>
              </Reveal>
              {/* IL CUORE DELLA SEZIONE. Era `text-2xl/[2rem]`, cioè un
                  paragrafo: adesso è un gradino display (d3, che porta con sé
                  la propria interlinea) e le righe salgono dalla maschera.
                  `exit`: risalendo la pagina la citazione se ne va dalla parte
                  opposta invece di restare ferma. */}
              <TextLines
                as="blockquote"
                exit
                stagger={0.1}
                className="mt-6 font-display text-d3 font-medium tracking-tight text-paper"
              >
                {quote}
              </TextLines>
              <Reveal delay={120}>
                {/* Le stelle del VOTO sono oro in tutto il sito (eccezione
                    dichiarata in globals.css): il rosso resta il marchio, non
                    la valutazione. */}
                <span ref={starsRef} className="mt-8 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-gold" />
                  ))}
                </span>
                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-paper/25 pt-6">
                  <div className="leading-tight">
                    <span className="block text-sm font-semibold text-paper">{author}</span>
                    <span className="block text-[0.8rem] text-paper/75">{context}</span>
                  </div>
                  <a
                    href={videoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 rounded-full border border-paper/35 bg-paper/10 py-2.5 pl-2.5 pr-5 text-sm font-semibold text-paper transition-all duration-300 hover:border-paper hover:bg-paper hover:text-ink"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 group-hover:scale-110">
                      <Play className="h-3.5 w-3.5" />
                    </span>
                    {c.watchVideo}
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
