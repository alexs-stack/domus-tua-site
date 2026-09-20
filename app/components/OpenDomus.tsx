"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import Reveal from "./Reveal";
import RevealGroup from "./motion/RevealGroup";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import { useCorridor } from "./motion/useCorridor";
import { getLenis } from "./motion/SmoothScroll";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { gsap, ScrollTrigger } from "../lib/motion/gsap";
import { sweep, type RevealApi } from "../lib/motion/reveal-engine";
import {
  FINESTRA,
  PHONE_CLIP,
  SHUTTER_L,
  SHUTTER_R,
  SIZES_FINESTRA,
  finestraFocusY,
  offsetInside,
} from "../lib/motion/finestra";

// `cardTitle` e `videoAria` non si rendono più (via la card flottante e il
// player disegnato a mano sulla foto): l'annuncio del play lo scrive
// LazyYouTubeEmbed nella lingua corrente. `title` è diventato `head` + `claim`:
// il titolo lungo occupava quattro righe in mezza colonna e leggeva come un
// errore di impaginazione, la frase è scesa nel paragrafo editoriale.
// `villaAlt` descrive la foto della finestra in home (A19, spec 2026-09-13 §7.5):
// quel che si vede, senza luoghi né frasi sulla vendita.
const copy = {
  it: {
    eyebrow: "Il nostro format esclusivo",
    head: "Open Domus.",
    claim: "Un’esperienza preparata per vendere meglio.",
    intro:
      "Un format proprietario che unisce preparazione, accoglienza, documentazione e prequalifica: la visita diventa un momento ordinato e consapevole, per chi vende e per chi cerca casa.",
    sellerLabel: "Per chi vende",
    buyerLabel: "Per chi compra",
    sellerBenefits: [
      "Immobile preparato e valorizzato prima dell'evento",
      "Acquirenti prequalificati e visite senza caos",
      "Feedback raccolti e proposta più rapida e concreta",
    ],
    buyerBenefits: [
      "Vedi la casa al suo meglio, con luce e ordine curati",
      "Documentazione e informazioni disponibili già in visita",
      "Nessuna pressione: capisci con calma se è la casa giusta",
    ],
    cta: "Scopri Open Domus",
    cardTitle: "Venduta al primo Open Domus.",
    cardText: "La storia vera di Teresa, raccontata da lei.",
    videoAria: "Guarda la storia di Teresa, venduta al primo Open Domus",
    imageAlt: "Raffaela Rizza con Teresa, cliente che ha venduto al primo Open Domus",
    villaAlt: "Facciata di una villa contemporanea vista dal bordo della piscina, con l'acqua in primo piano",
  },
  en: {
    eyebrow: "Our signature format",
    head: "Open Domus.",
    claim: "An experience designed to sell better.",
    intro:
      "A proprietary format combining preparation, hospitality, documentation and pre-qualification: the viewing becomes an orderly, considered moment, for sellers and for buyers.",
    sellerLabel: "For sellers",
    buyerLabel: "For buyers",
    sellerBenefits: [
      "Property prepared and enhanced ahead of the event",
      "Pre-qualified buyers and viewings free of chaos",
      "Feedback collected and a faster, more concrete offer",
    ],
    buyerBenefits: [
      "See the home at its best, with light and order cared for",
      "Documentation and information available during the viewing",
      "No pressure: understand calmly if it's the right home",
    ],
    cta: "Discover Open Domus",
    cardTitle: "Sold at the very first Open Domus.",
    cardText: "Teresa's true story, told in her own words.",
    videoAria: "Watch Teresa's story, sold at the first Open Domus",
    imageAlt: "Raffaela Rizza with Teresa, the client who sold at the first Open Domus",
    villaAlt: "Facade of a contemporary villa seen from the edge of the pool, with the water in the foreground",
  },
  fr: {
    eyebrow: "Notre format signature",
    head: "Open Domus.",
    claim: "Une expérience pensée pour mieux vendre.",
    intro:
      "Un format propre à Domus Tua qui allie préparation, accueil, documentation et préqualification : la visite devient un moment ordonné et réfléchi, pour ceux qui vendent comme pour ceux qui cherchent.",
    sellerLabel: "Pour les vendeurs",
    buyerLabel: "Pour les acquéreurs",
    sellerBenefits: [
      "Bien préparé et valorisé avant l'événement",
      "Acquéreurs préqualifiés et visites sans chaos",
      "Retours recueillis et offre plus rapide et concrète",
    ],
    buyerBenefits: [
      "Voyez la maison sous son meilleur jour, lumière et ordre soignés",
      "Documentation et informations disponibles dès la visite",
      "Sans pression : comprenez sereinement si c'est la bonne maison",
    ],
    cta: "Découvrir Open Domus",
    cardTitle: "Vendue dès le premier Open Domus.",
    cardText: "La véritable histoire de Teresa, racontée par elle-même.",
    videoAria: "Regardez l'histoire de Teresa, vendue au premier Open Domus",
    imageAlt: "Raffaela Rizza avec Teresa, la cliente qui a vendu au premier Open Domus",
    villaAlt: "Façade d’une villa contemporaine vue depuis le bord de la piscine, avec l’eau au premier plan",
  },
  de: {
    eyebrow: "Unser eigenes Format",
    head: "Open Domus.",
    claim: "Ein Erlebnis, das auf besseren Verkauf ausgelegt ist.",
    intro:
      "Ein eigenes Format, das Vorbereitung, Empfang, Dokumentation und Vorqualifizierung vereint: Die Besichtigung wird zu einem geordneten, bewussten Moment – für Verkäufer wie für Suchende.",
    sellerLabel: "Für Verkäufer",
    buyerLabel: "Für Käufer",
    sellerBenefits: [
      "Immobilie vor dem Termin vorbereitet und aufgewertet",
      "Vorqualifizierte Käufer und Besichtigungen ohne Chaos",
      "Feedback gesammelt und ein schnelleres, konkreteres Angebot",
    ],
    buyerBenefits: [
      "Sehen Sie das Zuhause von seiner besten Seite, Licht und Ordnung gepflegt",
      "Unterlagen und Informationen schon bei der Besichtigung verfügbar",
      "Ohne Druck: in Ruhe verstehen, ob es das richtige Zuhause ist",
    ],
    cta: "Open Domus entdecken",
    cardTitle: "Beim ersten Open Domus verkauft.",
    cardText: "Die wahre Geschichte von Teresa, von ihr selbst erzählt.",
    videoAria: "Sehen Sie die Geschichte von Teresa, verkauft beim ersten Open Domus",
    imageAlt: "Raffaela Rizza mit Teresa, der Kundin, die beim ersten Open Domus verkauft hat",
    villaAlt: "Fassade einer modernen Villa vom Beckenrand aus gesehen, mit dem Wasser im Vordergrund",
  },
  es: {
    eyebrow: "Nuestro formato exclusivo",
    head: "Open Domus.",
    claim: "Una experiencia preparada para vender mejor.",
    intro:
      "Un formato propio que combina preparación, acogida, documentación y precualificación: la visita se convierte en un momento ordenado y consciente, para quien vende y para quien busca casa.",
    sellerLabel: "Para quien vende",
    buyerLabel: "Para quien compra",
    sellerBenefits: [
      "Inmueble preparado y revalorizado antes del evento",
      "Compradores precualificados y visitas sin caos",
      "Comentarios recogidos y una propuesta más rápida y concreta",
    ],
    buyerBenefits: [
      "Ve la casa en su mejor versión, con luz y orden cuidados",
      "Documentación e información disponibles ya en la visita",
      "Sin presión: entiende con calma si es la casa adecuada",
    ],
    cta: "Descubre Open Domus",
    cardTitle: "Vendida en el primer Open Domus.",
    cardText: "La historia real de Teresa, contada por ella misma.",
    videoAria: "Mira la historia de Teresa, vendida en el primer Open Domus",
    imageAlt: "Raffaela Rizza con Teresa, la clienta que vendió en el primer Open Domus",
    villaAlt: "Fachada de una villa contemporánea vista desde el borde de la piscina, con el agua en primer plano",
  },
};

// Il poster è il fotogramma della storia di Teresa: 1280×510, cioè 2,5:1.
const TERESA_POSTER = "/images/reali/open-domus-teresa.jpg";

type Props = {
  /** La finestra sticky di A19 e A20: solo in home (D28). /metodo e /open-domus la rendono senza. */
  finestra?: boolean;
};

export default function OpenDomus({ finestra = false }: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  const lists = [
    { title: c.sellerLabel, items: c.sellerBenefits },
    { title: c.buyerLabel, items: c.buyerBenefits },
  ];

  // RIVISTA BIANCA (2026-09-11): la storia di Teresa era una FOTO 1280×510
  // schiacciata in un quadrato da 589 px — ne restava il 40 % (ingrandito
  // 1,15 volte) e le due donne erano tagliate alla fronte. Ora è il video da
  // cui quel fotogramma è preso, in una scatola 16:9 larga come la mezza foto
  // del resto della home: il ritaglio toglie solo larghezza (l'altezza resta
  // intera, i volti sono interi) e la sorgente scende a 0,67x — nessun
  // ingrandimento. Niente Parallax sulla facciata: una scatola che deriva
  // mentre si mira il tasto play è un bersaglio mobile.
  const body = (
    <>
      <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-center">
        {/* La scatola è più larga della colonna della griglia (42vw contro
            ~39vw): a destra deve allinearsi alla fine, o sborda dal margine. */}
        <div className="dt-media-half aspect-video! lg:order-2 lg:justify-self-end">
          <LazyYouTubeEmbed
            id={site.videos.openDomus.id}
            title={site.videos.openDomus.title}
            poster={TERESA_POSTER}
            /* Il fotogramma e' 2,5:1 dentro una scatola 16:9: con
               `object-cover` viene reso largo 1,41 volte la scatola, quindi
               i pixel che servono non sono quelli della colonna. */
            posterSizes="(max-width:1024px) 141vw, 60vw"
          />
        </div>

        <div className="lg:pr-[6vw]">
          <Reveal role="ctn">
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <SplitTitle as="h2" className="mt-6 font-display text-d2">
            {c.head}
          </SplitTitle>
          <Lead className="mt-6">{c.claim}</Lead>
          <Reveal role="ctn">
            <p className="mt-6 max-w-[60ch] text-body text-graphite">{c.intro}</p>
          </Reveal>
        </div>
      </div>

      {/* Doppio valore: chi vende e chi compra, due liste col trattino rosso.
          La seconda colonna è larga quanto la scatola video (42vw, max 640) e
          quindi comincia sulla SUA stessa linea: con due colonne uguali sarebbe
          partita 43 px più a destra del bordo del video — uno sfasamento che si
          vede e non si spiega. */}
      <div className="dt-row mt-[5vh] grid gap-[6vw] sm:grid-cols-2 lg:grid-cols-[1fr_min(42vw,640px)]">
        {lists.map((list) => (
          <div key={list.title}>
            <SplitTitle as="h3" font="display-400" className="font-display text-d4 font-light">
              {list.title}
            </SplitTitle>
            <ul className="mt-4 flex flex-col gap-2 text-body text-graphite">
              {list.items.map((it) => (
                <li key={it} className="flex gap-3">
                  <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-red" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Il rilancio sta in fondo, a tutta larghezza: nella mezza colonna
          l'etichetta (44 caratteri) andava a capo e la freccia restava
          appesa a destra della prima riga. */}
      <div className="dt-row mt-[4vh]">
        <Reveal role="still">
          <Cta href="/open-domus" variant="ghost">
            {c.cta}
          </Cta>
        </Reveal>
      </div>
    </>
  );

  if (!finestra) {
    return (
      <section id="open-domus" className="dt-chapter bg-cream">
        {body}
      </section>
    );
  }
  return (
    <Finestra villaAlt={c.villaAlt} locale={locale}>
      {body}
    </Finestra>
  );
}

/* LA FINESTRA — A19 e A20 di Alberto (13 settembre), spec 2026-09-13 §3.10; CSS in
   globals.css, «LA FINESTRA DI OPEN DOMUS». Com'è fatta oggi, da MQ.corridor:
   - timeline sulla section, «top bottom» → +3 schermi, scrub 0,15 da chapters.ts:
     otturatore 0 → 0,5 e montanti 0,5 → 0,6 in `none`, poi tende a 1,84 e stage
     .75 → 1 in `dtInOut`. Lo stage nasce a .75 di proposito (immediateRender):
     in Era sta già piccolo durante l'otturatore (ERA:2763);
   - il contenuto è un gruppo in attesa (`data-reveal-hold`): a progresso 1 si
     libera, sotto 1 esce e torna in attesa (C22, uscita speculare);
   - la rete di fuoco è un listener focusin sullo stage: il focusin di
     useCorridor sta sull'host e qui riceve `null` da `focus`, quindi non
     scrolla; la formula di §3.10 (offset nel contenuto, senza la scala dello
     stage) la applica il listener sullo stage, che porta il focalizzabile al
     25 % dello schermo dopo lo sgancio;
   - lo stage è l'unico elemento trasformato fuori dallo schermo: sticky lui
     stesso, non è antenato di nulla di sticky.
   Sotto la soglia e con motion ok: nessuno sticky, la foto si apre con due
   rettangoli sfalsati quando è in vista per il 35 % e si richiude uscendo dal basso.
   Con reduced-motion e senza JS: nessuna delle due cose, la foto è ferma. */
function Finestra({ villaAlt, locale, children }: { villaAlt: string; locale: string; children: ReactNode }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const group = useRef<RevealApi | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useCorridor(sectionRef, {
    id: "finestra",
    stick: "top",
    start: "top bottom",
    end: () => `+=${FINESTRA.endVh * window.innerHeight}`,
    build: (tl, q) => {
      tlRef.current = tl;
      const [left] = q(".dt-od_shutter--l");
      const [right] = q(".dt-od_shutter--r");
      const [shutters] = q(".dt-od_shutters");
      const [stage] = q(".dt-od_stage");
      if (!left || !right || !shutters || !stage) return;
      gsap.set(left, { clipPath: SHUTTER_L[0] });
      gsap.set(right, { clipPath: SHUTTER_R[0] });
      tl.fromTo(left, { clipPath: SHUTTER_L[0] }, { clipPath: SHUTTER_L[1], duration: FINESTRA.shutterEnd }, 0)
        .fromTo(right, { clipPath: SHUTTER_R[0] }, { clipPath: SHUTTER_R[1], duration: FINESTRA.shutterEnd }, 0)
        .to(left, { clipPath: SHUTTER_L[2], duration: FINESTRA.mullionEnd - FINESTRA.shutterEnd }, FINESTRA.shutterEnd)
        .to(right, { clipPath: SHUTTER_R[2], duration: FINESTRA.mullionEnd - FINESTRA.shutterEnd }, FINESTRA.shutterEnd)
        .fromTo(
          shutters,
          { scale: 1 },
          { scale: FINESTRA.shutterScale, ease: "dtInOut", duration: 1 - FINESTRA.mullionEnd },
          FINESTRA.mullionEnd,
        )
        .fromTo(
          stage,
          { scale: FINESTRA.stageFrom },
          { scale: 1, ease: "dtInOut", duration: 1 - FINESTRA.mullionEnd, immediateRender: true },
          FINESTRA.mullionEnd,
        );
      // Stato di partenza riscritto per intero a ogni costruzione (A19, spec §3.10): il cue di
      // p 1 scrive a mano `visibility: hidden` sullo schermo e toglie l'attesa, e quei due
      // segni non li reverte nessuno (né useGSAP né la matchMedia del hook). Se il corridoio
      // rinasce sotto p 1 — soglia riattraversata cambiando finestra o preferenza di motion —
      // i cue ripartono da spenti e l'indietro non suona: senza queste due righe le tende
      // resterebbero invisibili per tutta la passata.
      q(".dt-od_screen")[0]?.style.removeProperty("visibility");
      q(".dt-od_content")[0]?.setAttribute("data-reveal-hold", "");
    },
    cues: [
      {
        at: 1,
        forward: () => {
          const s = sectionRef.current;
          s?.querySelector<HTMLElement>(".dt-od_screen")?.style.setProperty("visibility", "hidden");
          s?.querySelector(".dt-od_content")?.removeAttribute("data-reveal-hold");
          group.current?.release();
          sweep();
        },
        backward: () => {
          const s = sectionRef.current;
          s?.querySelector<HTMLElement>(".dt-od_screen")?.style.removeProperty("visibility");
          group.current?.play("out");
          s?.querySelector(".dt-od_content")?.setAttribute("data-reveal-hold", "");
        },
      },
    ],
    // La rete di fuoco è il listener sullo stage, più sotto: il hook non scrolla mai.
    focus: () => null,
    phone: (q) => {
      const [win] = q(".dt-od_window");
      q(".dt-od_content")[0]?.removeAttribute("data-reveal-hold");
      sweep();
      if (!win) return;
      const tl = gsap
        .timeline({ paused: true })
        .fromTo(
          win,
          { clipPath: PHONE_CLIP[0] },
          { clipPath: PHONE_CLIP[1], duration: FINESTRA.phoneOpen, ease: "dtInOut", immediateRender: false },
        )
        .to(win, { clipPath: PHONE_CLIP[2], duration: FINESTRA.phoneSnap, ease: "none" });
      let first = true;
      let open = true;
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e) return;
          if (first) {
            first = false;
            // Stato chiuso solo se al primo callback la foto sta sotto il viewport.
            if (!e.isIntersecting && e.boundingClientRect.top >= window.innerHeight) {
              gsap.set(win, { clipPath: PHONE_CLIP[0] });
              open = false;
            } else {
              tl.progress(1);
            }
            return;
          }
          // Rientro solo oltre la soglia: l'IO chiama anche quando isIntersecting diventa vero
          // con un rapporto appena sopra 0.
          if (e.intersectionRatio >= FINESTRA.phoneThreshold && !open) {
            tl.timeScale(1).restart();
            open = true;
          } else if (!e.isIntersecting && open && e.boundingClientRect.top > 0) {
            tl.timeScale(2).reverse();
            open = false;
          }
        },
        { threshold: FINESTRA.phoneThreshold },
      );
      io.observe(win);
      return () => {
        io.disconnect();
        tl.kill();
        gsap.set(win, { clearProps: "clipPath" });
      };
    },
    deps: [locale],
  });

  // Rete di fuoco di spec §3.10: i focalizzabili stanno nello stage, fratello dello schermo. Il
  // focusin di useCorridor sta sull'host e riceve `null` da `focus`: la formula di §3.10 la applica
  // questo listener, che conosce il contenuto e la sua scala. Col corridoio acceso il Tab porta
  // l'elemento al 25 % dello schermo dopo lo sgancio; senza [data-on] il listener non fa nulla.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>(".dt-od_stage");
    const content = section?.querySelector<HTMLElement>(".dt-od_content");
    if (!section || !stage || !content) return;
    const onFocus = (e: FocusEvent) => {
      const el = e.target;
      const st = tlRef.current?.scrollTrigger;
      if (!section.hasAttribute("data-on") || !st || !(el instanceof Element)) return;
      if (!el.matches(":focus-visible") || !content.contains(el)) return;
      const r = el.getBoundingClientRect();
      if (st.progress >= 1 && r.top >= 0 && r.bottom <= window.innerHeight) return;
      const y = finestraFocusY({ start: st.start, vh: window.innerHeight, offset: offsetInside(content, el) });
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
      ScrollTrigger.update();
      st.getTween()?.progress(1);
    };
    stage.addEventListener("focusin", onFocus);
    return () => stage.removeEventListener("focusin", onFocus);
  }, []);

  return (
    <section ref={sectionRef} id="open-domus" className="dt-od bg-cream" data-corridor="finestra" data-od>
      <div className="dt-od_area">
        <span aria-hidden data-bg="avorio" className="dt-od_mark dt-od_mark--a" />
        <span aria-hidden data-bg="foto" className="dt-od_mark dt-od_mark--f" />
        <div className="dt-od_shutterzone" aria-hidden>
          <div className="dt-od_screen" data-corridor-screen>
            <div className="dt-od_shutters">
              <div className="dt-od_shutter dt-od_shutter--l" />
              <div className="dt-od_shutter dt-od_shutter--r" />
            </div>
          </div>
        </div>
        <div className="dt-od_stage">
          <div className="dt-od_band dt-row">
            <div className="dt-od_window dt-media-half lg:w-full! lg:max-w-none! lg:aspect-video!">
              <Image
                src="/images/reali/villa-fronte-acqua.jpg"
                alt={villaAlt}
                fill
                sizes={SIZES_FINESTRA}
                className="object-cover"
                style={{ objectPosition: "50% 38%" }}
              />
            </div>
          </div>
          <RevealGroup
            hold
            className="dt-od_content dt-chapter"
            onReady={(api) => {
              group.current = api;
            }}
          >
            {children}
          </RevealGroup>
        </div>
        <div className="dt-od_run" aria-hidden />
      </div>
    </section>
  );
}
