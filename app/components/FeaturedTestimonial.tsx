"use client";

// La testimonianza in evidenza — sul chiaro (rivista bianca, 2026-09-10):
// il fotogramma della recensione a sinistra, a destra eyebrow, il titolo
// reale del video in Playfair d2, un lead che dice cosa si sta per vedere e
// il link che apre il video in pagina (VideoLightbox, lo schema di Voci.tsx).
//
// PERCHÉ NON C'È PIÙ LA CITAZIONE. Le frasi tra virgolette che stavano qui
// le avevamo scritte noi e firmate «Cliente Domus Tua»
// (docs/da-chiedere-alla-cliente.md §1.2), e PRODUCT.md vieta le recensioni
// inventate. La sola cosa vera è il video: parole del cliente, non nostre.
import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import LamaMedia from "./motion/LamaMedia";
import { gsap, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import VideoLightbox from "./VideoLightbox";
import { Play } from "./Icons";
import { Cta } from "./primitives/Cta";
import { testimonialVideo, youtubeWatch } from "../lib/videos";
import { useLocale } from "./i18n/LocaleProvider";

type Props = {
  /** `quote`, `author`, `context`: accettati per contratto, non più resi. */
  quote?: string;
  author?: string;
  context?: string;
  image?: string;
  alt?: string;
  videoHref?: string;
  /** Solo la home lo passa (D28): la cornice sta ferma e dentro la foto
      affonda del 10 % mentre il capitolo esce (A20 di Alberto, spec
      2026-09-13 §3.14). Senza, resta la deriva di Parallax di oggi. */
  gesture?: boolean;
};

// `quote`, `author`, `context` restano nel record ma non vengono più resi:
// erano parole nostre attribuite a un cliente generico (§1.2), non sue.
const copy = {
  it: {
    eyebrow: "Una storia, tra centinaia",
    quote:
      "Ci hanno ascoltato prima ancora di parlare di prezzo. L’appartamento è stato venduto al primo Open Domus, e noi sereni dall’inizio alla fine.",
    author: "Cliente Domus Tua",
    context: "Venduto al primo Open Domus, Tradate",
    lead: "La recensione in video di un cliente, registrata dopo la vendita. Parole sue, non nostre.",
    alt: "Raffaela Rizza con una cliente nella video recensione Domus Tua",
    play: "Guarda",
    watchVideo: "Guarda la recensione video",
  },
  en: {
    eyebrow: "One story, among hundreds",
    quote:
      "They listened to us before we even talked about price. The apartment sold at the very first Open Domus, and we felt at ease from start to finish.",
    author: "Domus Tua client",
    context: "Sold at the first Open Domus, Tradate",
    lead: "A client’s video review, recorded after the sale. Their words, not ours.",
    alt: "Raffaela Rizza with a client in the Domus Tua video testimonial",
    play: "Watch",
    watchVideo: "Watch the video review",
  },
  fr: {
    eyebrow: "Une histoire, parmi des centaines",
    quote:
      "Ils nous ont écoutés avant même de parler de prix. L’appartement a été vendu dès le premier Open Domus, et nous avons été sereins du début à la fin.",
    author: "Client Domus Tua",
    context: "Vendu au premier Open Domus, Tradate",
    lead: "L’avis vidéo d’un client, enregistré après la vente. Ses mots, pas les nôtres.",
    alt: "Raffaela Rizza avec une cliente dans le témoignage vidéo Domus Tua",
    play: "Regarder",
    watchVideo: "Voir l’avis vidéo",
  },
  de: {
    eyebrow: "Eine Geschichte, unter Hunderten",
    quote:
      "Sie haben uns zugehört, noch bevor über den Preis gesprochen wurde. Die Wohnung wurde schon beim ersten Open Domus verkauft, und wir waren von Anfang bis Ende entspannt.",
    author: "Domus Tua Kundin",
    context: "Beim ersten Open Domus verkauft, Tradate",
    lead: "Die Videobewertung eines Kunden, aufgenommen nach dem Verkauf. Seine Worte, nicht unsere.",
    alt: "Raffaela Rizza mit einer Kundin im Domus Tua Video-Testimonial",
    play: "Ansehen",
    watchVideo: "Die Videobewertung ansehen",
  },
  es: {
    eyebrow: "Una historia, entre cientos",
    quote:
      "Nos escucharon antes incluso de hablar de precio. El piso se vendió en el primer Open Domus, y estuvimos tranquilos de principio a fin.",
    author: "Cliente de Domus Tua",
    context: "Vendido en el primer Open Domus, Tradate",
    lead: "La reseña en vídeo de un cliente, grabada tras la venta. Sus palabras, no las nuestras.",
    alt: "Raffaela Rizza con una clienta en el testimonio en vídeo de Domus Tua",
    play: "Ver",
    watchVideo: "Ver la reseña en vídeo",
  },
};

export default function FeaturedTestimonial(props: Props) {
  const { locale } = useLocale();
  const c = copy[locale];

  // Il video aperto in pagina, o null (stesso schema di Voci.tsx).
  const [open, setOpen] = useState<{ id: string; title: string } | null>(null);

  const image = props.image ?? "/images/reali/recensione-clienti.jpg";
  const alt = props.alt ?? c.alt;
  const href = props.videoHref ?? youtubeWatch(testimonialVideo.id);
  const title = testimonialVideo.title;

  // Il clic semplice apre il video in pagina; cmd/ctrl/shift/tasto centrale
  // — o un `videoHref` diverso dal video-testimonianza — lasciano fare al link.
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (props.videoHref || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setOpen({ id: testimonialVideo.id, title });
  };

  const gesture = props.gesture ?? false;
  const frameRef = useRef<HTMLAnchorElement | null>(null);
  const sinkRef = useRef<HTMLDivElement | null>(null);

  // La foto affonda dentro la cornice ferma (A20 di Alberto, spec 2026-09-13
  // §3.14): il contenitore alto il 110 % scende di 9,0909 % di sé, cioè del
  // 10 % della cornice, mentre il bordo basso della cornice va dal fondo alla
  // cima del viewport. Solo con motion ok e solo in home (D28). Nessuno stato
  // iniziale scritto: yPercent 0 è lo stato del CSS.
  useGSAP(
    () => {
      const frame = frameRef.current;
      const sink = sinkRef.current;
      if (!gesture || !frame || !sink) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          sink,
          { yPercent: 0 },
          {
            yPercent: 9.0909,
            ease: "dtAffonda",
            scrollTrigger: {
              trigger: frame,
              start: "bottom bottom",
              end: "bottom top",
              scrub: 1.2,
              invalidateOnRefresh: true,
              onToggle: (self) => {
                sink.style.willChange = self.isActive ? "transform" : "";
              },
            },
          },
        );
        return () => {
          sink.style.willChange = "";
        };
      });
    },
    { dependencies: [gesture], revertOnUpdate: true },
  );

  // `dt-still-trim--top` toglie la banda col titolo cotta in cima alla
  // copertina di YouTube («VIDEO RECENSIONE / APPARTAMENTO VENDUTO AL PRIMO
  // OPEN DOMUS»): sopra un titolo gia' stampato nei pixel non se ne mette un
  // secondo. Il cuore Domus in basso a destra resta: e' il loro marchio, non la
  // grafica di YouTube. Il trim vale SOLO su quella copertina (D218): su
  // `consulenza.jpg` di /acquista tagliava la testa di Raffaela al 72 % senza
  // un titolo cotto da togliere (D201).
  const cotta = image.endsWith("recensione-clienti.jpg");
  const foto = (
    <Image
      src={image}
      alt={alt}
      fill
      sizes={gesture ? "(max-width:1024px) 132vw, 61vw" : "(max-width:1024px) 132vw, 56vw"}
      // Niente `priority`: l'unica immagine prioritaria del sito è l'hero.
      quality={75}
      className={cotta ? "dt-still-trim--top object-cover" : "object-cover"}
    />
  );
  // 56px sul telefono, 96 da desktop: la stessa regola del carosello delle
  // voci — il cerchio grande copriva i volti sulla tessera.
  const play = (
    <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red text-white transition-transform duration-300 group-hover:scale-105 lg:h-24 lg:w-24">
      <Play className="ml-1 h-5 w-5 lg:h-7 lg:w-7" />
    </span>
  );

  // Il link è la cornice: non si muove mai, il bersaglio del dito resta fermo e
  // l'outline di focus sta fuori dal suo overflow. `data-bg="foto"` dice al
  // monogramma che qui sotto c'è una foto (A21, spec §6.1). In home (`gesture`)
  // il link E' il modulo e dentro la foto affonda (D28/D30).
  const linkHome = (
    <a
      ref={frameRef}
      data-sink-frame
      data-bg="foto"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${c.play}: ${title}`}
      onClick={onClick}
      className="dt-media-half !aspect-video group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
    >
      {/* Con `gesture` il contenitore è alto il 110 % (overscan del 10 %) e la
          sizes sale a 61vw: cornice 605×340 a 1440, cover 665 px × 1,30 =
          865 px (spec §3.14). */}
      <div ref={sinkRef} data-sink="" className="absolute inset-x-0 bottom-0 top-[-10%]">
        {foto}
      </div>
      {play}
    </a>
  );
  // Fuori dalla home (D206: D28 superata) la foto entra con la lama (A36): il
  // link AVVOLGE il modulo e non riceve clip ne' transform (D208, come Voci); il
  // cerchio del play sta dentro il ritaglio, dopo l'interno, e entra con la
  // foto. `data-bg` passa sul modulo: avorio da chiusa, foto dall'entrata (D210).
  // La copertina cotta entra col solo bordo (X 0, D218); `consulenza.jpg` di
  // /acquista da sinistra con scivolo 10 (la cliente tocca il bordo destro).
  const linkLama = (
    <a
      ref={frameRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${c.play}: ${title}`}
      onClick={onClick}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
    >
      <LamaMedia
        id={cotta ? "testimonianza-recensione" : "testimonianza-consulenza"}
        className="dt-media-half !aspect-video"
        data-bg="foto"
        data-sink-frame=""
        sopra={play}
      >
        {foto}
      </LamaMedia>
    </a>
  );

  return (
    <section className="dt-chapter bg-cream">
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-center">
        {/* Il fotogramma è 1280×720: sta nel modulo «banda» (16:9), non in un
            quadrato — il file porta il titolo del video cotto nella fascia
            alta e un taglio 1:1 lo mozzerebbe. In home la cornice sta ferma
            e la foto affonda dentro (A20, D28); su /vendi, /acquista e
            /recensioni entra con la lama (A36, D206-D207: via la deriva
            ±0,56 % di Parallax, sotto la soglia di percezione). Il cerchio
            rosso è l'unica curva. */}
        {gesture ? linkHome : linkLama}

        <div className="lg:pl-[6vw]">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          {/* Il titolo È quello del video sul canale: non si traduce, non si riscrive. */}
          <SplitTitle as="h2" className="mt-6 font-display text-d2">
            {title}
          </SplitTitle>
          <Lead className="mt-6">{c.lead}</Lead>
          <Reveal delay={140}>
            <Cta
              href={href}
              variant="ghost"
              className="mt-8"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${c.watchVideo}: ${title}`}
              onClick={onClick}
            >
              {c.watchVideo}
            </Cta>
          </Reveal>
        </div>
      </div>

      <VideoLightbox video={open} onClose={() => setOpen(null)} />
    </section>
  );
}
