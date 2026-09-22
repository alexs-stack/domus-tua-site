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
// A47 (22 set. 2026): la foto della finestra, il suo cielo e le bande del segno, misurati da
// scripts/media/finestra.mjs sul WebP col cielo trasparente (come tinte.json per le teste).
import foto from "../lib/motion/finestra.json";

// `cardTitle` e `videoAria` non si rendono più (via la card flottante e il
// player disegnato a mano sulla foto): l'annuncio del play lo scrive
// LazyYouTubeEmbed nella lingua corrente. `title` è diventato `head` + `claim`:
// il titolo lungo occupava quattro righe in mezza colonna e leggeva come un
// errore di impaginazione, la frase è scesa nel paragrafo editoriale.
// `villaAlt` descrive la foto della finestra in home (A19, spec 2026-09-13 §7.5):
// quel che si vede, senza luoghi né frasi sulla vendita. Da A46 il cielo della foto è
// trasparente e al suo posto c'è la carta: l'alt non nomina più «un cielo azzurro».
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
    villaAlt: "Facciata a terrazze bianche di una residenza contemporanea che sale, con le pergole di legno, il glicine in fiore, il basamento in travertino e le colline",
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
    villaAlt: "White terraced facade of a contemporary residence rising up, with wooden pergolas, wisteria in bloom, a travertine base and the hills",
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
    villaAlt: "Façade en terrasses blanches d’une résidence contemporaine qui s’élève, avec ses pergolas en bois, la glycine en fleurs, le soubassement en travertin et les collines",
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
    villaAlt: "Weiße Terrassenfassade einer modernen Residenz, die in die Höhe steigt, mit Holzpergolen, blühender Glyzinie, Travertinsockel und den Hügeln",
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
    villaAlt: "Fachada de terrazas blancas de una residencia contemporánea que se eleva, con pérgolas de madera, la glicina en flor, el basamento de travertino y las colinas",
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

  // A45 (Alberto, 21 set. 2026: «non hai fatto quello che ti ho chiesto per la sezione rifatta
  // di era residence di architecture»): in home la finestra porta il TITOLO del capitolo, enorme,
  // appoggiato al bordo alto della foto, come «ARCHITECTURE» su era-residence — in inchiostro sul
  // cielo trasparente da A46 —; il corpo qui sotto allora non ripete l'h2 (occhiello, claim,
  // intro, liste e rilancio restano).
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
          {!finestra && (
            <SplitTitle as="h2" className="mt-6 font-display text-d2">
              {c.head}
            </SplitTitle>
          )}
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
    <Finestra villaAlt={c.villaAlt} titolo={c.head.replace(/\.$/, "")} locale={locale}>
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
   Con reduced-motion e senza JS: nessuna delle due cose, la foto è ferma.
   A47 (Alberto, 22 set. 2026): la foto è la facciata che SALE, 9:16, intera, e il
   capitolo posa sopra di lei dal 55 % della sua altezza (globals.css «LA FINESTRA DI
   OPEN DOMUS», finestra.ts `sopra`): lo stage è alto quanto la foto (più il capitolo
   se sfora), resta agganciato per la pista mostrando il primo schermo della foto, poi
   scorre via e la facciata continua sotto la piega — «Architecture» di era. La rete di
   fuoco porta il contenuto a `contentTop` dalla cima dello stage, senza la scala. */
function Finestra({ villaAlt, titolo, locale, children }: { villaAlt: string; titolo: string; locale: string; children: ReactNode }) {
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
      // A47: il contenuto sta sulla foto, a `contentTop` dalla cima dello stage (senza la scala dello stage).
      const y = finestraFocusY({ start: st.start, vh: window.innerHeight, contentTop: offsetInside(stage, content), offset: offsetInside(content, el) });
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
    <section ref={sectionRef} id="open-domus" className="dt-od bg-cream" data-corridor="finestra" data-od data-sopra="foto">
      <div className="dt-od_area">
        <span aria-hidden data-bg="avorio" className="dt-od_mark dt-od_mark--a" />
        {/* A46 (Alberto, 21 set. 2026, sera): il cielo della facciata è trasparente e a schermo
            intero sotto il segno (in alto a sinistra, 4vw × l'asse della testata) c'è il cielo,
            cioè la carta: la zona è `foto-chiara` (tema.ts: le tacche restano grafite), perché
            tacche avorio sull'avorio del cielo sparirebbero. Il cielo copre i due angoli alti
            della foto (cima 0,134: il soggetto comincia più in basso). */}
        <span aria-hidden data-bg="foto-chiara" className="dt-od_mark dt-od_mark--f" />
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
            {/* La sezione «Architecture» di era-residence (A45): dentro la cornice, il titolo del
                capitolo, enorme, appoggiato al bordo alto della foto, e la foto. A46 (Alberto, 21 set.
                2026, sera: «su eraresidence questa foto … ha il cielo mascherato, è no bg … dobbiamo
                fare la stessa cosa»): la foto è il WebP con l'alpha (scripts/media/cielo.mjs), il cielo
                è il fondo pagina e il titolo è in INCHIOSTRO (`.dt-od_titolo`, globals.css), scuro sul
                cielo che è la carta, come «ARCHITECTURE» su era negli screenshot di Alberto; il bianco
                nudo di A40 valeva per il cielo fotografato. A47 (Alberto, 22 set. 2026: «qua perchè hai
                tagliato l'immagine, deve continuare, abbiamo fatto le immagini alte apposta per poterci
                scrollare a schermo intero senza uscire dalla foto»; «questa immagine è tagliata? se si
                mettila completa e scrivici sopra come hai fatto con le altre pagine»): la foto è la
                facciata che SALE, 9:16, INTERA (finestra.json: file, misure, bande del segno), al posto
                della 3:2 col glicine, e la cornice è alta quanto la foto; nel corridoio lo schermo
                agganciato ne mostra il primo schermo (cielo, titolo, la terrazza alta) mentre le tende
                si aprono, poi lo stage scorre via e la facciata prosegue sotto la piega col capitolo
                posato sopra (`.dt-od_content`, qui sotto). La cornice è `relative` (la scatola ritaglia,
                la cornice no): il titolo scala con lo stage come tutto il resto, così a schermo intero
                è più grande. L'h2 sta prima della foto nel DOM (l'ordine di lettura) e sopra di lei
                nello stacking. */}
            <div className="dt-od_cornice">
              <h2 className="dt-od_titolo font-display">{titolo}</h2>
              <div className="dt-od_window">
                <Image
                  src={foto.file}
                  alt={villaAlt}
                  fill
                  sizes={SIZES_FINESTRA}
                  className="object-cover"
                  style={{ objectPosition: "50% 0%" }}
                />
                {/* I marcatori del segno (D34, tema.ts): uno per banda scura di finestra.json — le travi
                    delle pergole nella striscia del segno —, assoluti nella scatola con top/bottom in
                    percentuale dell'altezza della foto, `data-bg="foto"`: lì le tacche virano all'avorio;
                    sul cielo (la carta), sui muri bianchi e sul travertino restano grafite (`foto-chiara`,
                    il marcatore dell'area). Come `.dt-testa_soggetto` di PageHeroTesta. */}
                {foto.segno.map(([da = 0, a = 0]) => (
                  <span
                    key={`${da}-${a}`}
                    aria-hidden
                    data-bg="foto"
                    className="dt-od_soggetto"
                    style={{ top: `${(da * 100).toFixed(2)}%`, bottom: `${((1 - a) * 100).toFixed(2)}%` }}
                  />
                ))}
              </div>
              {/* A47: il capitolo sta DENTRO la cornice, dopo la foto — lo spazio sopra la foto delle teste
                  (A48/A54): da lg posa sulla facciata dal 55 % della sua altezza, in bianco con l'ombra;
                  sotto lg la segue in inchiostro. Resta il gruppo in attesa che il cue di p 1 libera. */}
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
          </div>
        </div>
        <div className="dt-od_run" aria-hidden />
      </div>
    </section>
  );
}
