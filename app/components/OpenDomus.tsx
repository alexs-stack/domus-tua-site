"use client";

import Image from "next/image";
import Reveal from "./Reveal";
import RevealGroup from "./motion/RevealGroup";
import HorizonScroller from "./motion/HorizonScroller";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site } from "../lib/site";
import { chapters, scrubOf } from "../lib/motion/chapters";
import { PORTA, SIZES_FINESTRA, leadDistance } from "../lib/motion/finestra";
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
// `portaAlt` è la foto del terzo pannello del nastro (A57): Raffaela sulla soglia.
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
    portaAlt: "Raffaela Rizza sulla soglia di una villa, con il braccio aperto verso il giardino e il glicine",
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
    portaAlt: "Raffaela Rizza on the threshold of a villa, her arm open towards the garden and the wisteria",
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
    portaAlt: "Raffaela Rizza sur le seuil d’une villa, le bras ouvert vers le jardin et la glycine",
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
    portaAlt: "Raffaela Rizza auf der Schwelle einer Villa, den Arm zum Garten und zur Glyzinie hin geöffnet",
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
    portaAlt: "Raffaela Rizza en el umbral de una villa, con el brazo abierto hacia el jardín y la glicina",
  },
};

// Il poster è il fotogramma della storia di Teresa: 1280×510, cioè 2,5:1. Dentro una scatola
// 16:9 con `object-cover` viene reso largo 1,41 volte la scatola, quindi i pixel che servono
// non sono quelli della colonna.
const TERESA_POSTER = "/images/reali/open-domus-teresa.jpg";
const TERESA_SIZES = "(max-width:1024px) 141vw, 60vw";

type Props = {
  /** Il nastro della finestra (A57/A58): solo in home (D28). /metodo e /open-domus rendono il capitolo senza. */
  finestra?: boolean;
};

export default function OpenDomus({ finestra = false }: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  const lists = [
    { title: c.sellerLabel, items: c.sellerBenefits },
    { title: c.buyerLabel, items: c.buyerBenefits },
  ];

  // RIVISTA BIANCA (2026-09-11): la storia di Teresa era una FOTO 1280×510 schiacciata in un
  // quadrato da 589 px — ne restava il 40 % (ingrandito 1,15 volte) e le due donne erano tagliate
  // alla fronte. Ora è il video da cui quel fotogramma è preso, in una scatola 16:9 larga come la
  // mezza foto del resto della home: il ritaglio toglie solo larghezza (l'altezza resta intera, i
  // volti sono interi) e la sorgente scende a 0,67x — nessun ingrandimento.
  const video = (
    <LazyYouTubeEmbed id={site.videos.openDomus.id} title={site.videos.openDomus.title} poster={TERESA_POSTER} posterSizes={TERESA_SIZES} />
  );
  // In home l'h2 del capitolo è il titolo enorme sulla foto (A45, `.dt-od_titolo`): il claim non lo ripete.
  const claim = (
    <>
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
    </>
  );
  // Doppio valore: chi vende e chi compra, due liste col trattino rosso.
  const liste = lists.map((list) => (
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
  ));
  const cta = (
    <Reveal role="still">
      <Cta href="/open-domus" variant="ghost">
        {c.cta}
      </Cta>
    </Reveal>
  );

  if (!finestra) {
    return (
      <section id="open-domus" className="dt-chapter bg-cream">
        <div className="dt-row grid gap-[6vw] lg:grid-cols-2 lg:items-center">
          {/* La scatola è più larga della colonna della griglia (42vw contro ~39vw): a destra deve
              allinearsi alla fine, o sborda dal margine. */}
          <div className="dt-media-half aspect-video! lg:order-2 lg:justify-self-end">{video}</div>
          <div className="lg:pr-[6vw]">{claim}</div>
        </div>
        {/* La seconda colonna è larga quanto la scatola video (42vw, max 640) e quindi comincia
            sulla SUA stessa linea: con due colonne uguali sarebbe partita 43 px più a destra del
            bordo del video — uno sfasamento che si vede e non si spiega. */}
        <div className="dt-row mt-[5vh] grid gap-[6vw] sm:grid-cols-2 lg:grid-cols-[1fr_min(42vw,640px)]">{liste}</div>
        {/* Il rilancio sta in fondo, a tutta larghezza: nella mezza colonna l'etichetta (44
            caratteri) andava a capo e la freccia restava appesa a destra della prima riga. */}
        <div className="dt-row mt-[4vh]">{cta}</div>
      </section>
    );
  }

  /* LA FINESTRA — un NASTRO come «Tra la Pineta e Milano» (A57 e A58 di Alberto, 22 set. 2026,
     sera; finestra.ts; CSS in globals.css, «LA FINESTRA DI OPEN DOMUS»). Tre pannelli di 100vw:
     1. la facciata che sale, 9:16, INTERA, col cielo trasparente che è la carta e il titolo del
        capitolo in inchiostro sopra (A45, A46, A47). Nel corridoio (HorizonScroller, da 1024×640
        con motion ok) lo schermo si aggancia con la foto a schermo intero DA SUBITO — niente
        tende, niente stage in scala (A58) — e la cornice sale dentro lo schermo (`lead`) finché la
        cima delle terrazze non sta al 10 % del viewport: la posa dello screenshot di A57. Da lì il
        nastro scorre di lato e la foto esce a sinistra; niente chiusura in cartolina (A58);
     2. il claim del format con il video di Teresa, che entra col sipario del nastro
        (`data-horizon-slide`: clip da sinistra e scala 1,15 → 1, lo stesso gesto del territorio);
     3. le due liste con la CTA e Raffaela sulla soglia, a sipario, alta 80svh.
     La firma resta quella del capitolo (chapters.ts `finestra`: dtInOut, scrub 0,15 — D18: due
     capitoli non condividono ease né scrub, quindi il nastro della finestra non copia le cifre di
     `storia` ma il gesto); la salita è lineare (secondaria). I testi dei pannelli sono gruppi del
     motore dei reveal, che nel nastro entrano quando sono in scena (spec §2.4). Sotto la soglia,
     con reduced-motion e senza JS i tre pannelli stanno in colonna, la foto è intera e nulla è
     nascosto. I marcatori del segno (`.dt-od_soggetto`, `data-bg="foto"`) sono le bande scure di
     finestra.json e viaggiano con la foto: elementsFromPoint legge la geometria trasformata. */
  return (
    <HorizonScroller
      id="open-domus"
      corridor="finestra"
      refreshKey={locale}
      className="dt-od bg-cream"
      ease={chapters.finestra.signature.ease}
      scrub={scrubOf("finestra")}
      lead={{
        selector: ".dt-od_cornice",
        distance: (el, screen) => leadDistance({ cima: foto.cielo.cima, fotoH: el.offsetHeight, vh: screen.clientHeight }),
      }}
    >
      <div className="dt-horizon_panel dt-od_panel dt-od_panel--foto">
        {/* La sezione «Architecture» di era-residence (A45): dentro la cornice, il titolo del capitolo,
            enorme, appoggiato al bordo alto della foto, in INCHIOSTRO sul cielo trasparente che è la
            carta (A46). L'h2 sta prima della foto nel DOM (l'ordine di lettura) e sopra di lei nello
            stacking. */}
        <div className="dt-od_cornice">
          <h2 className="dt-od_titolo font-display">{c.head.replace(/\.$/, "")}</h2>
          <div className="dt-od_window">
            <Image src={foto.file} alt={c.villaAlt} fill sizes={SIZES_FINESTRA} className="object-cover" style={{ objectPosition: "50% 0%" }} />
            {/* I marcatori del segno (D34, tema.ts): uno per banda scura di finestra.json — le travi delle
                pergole nella striscia del segno —, assoluti nella scatola con top/bottom in percentuale
                dell'altezza della foto, `data-bg="foto"`: lì le tacche virano all'avorio; sul cielo (la
                carta), sui muri bianchi e sul travertino restano grafite. Come `.dt-testa_soggetto`. */}
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
        </div>
      </div>

      <div className="dt-horizon_panel dt-od_panel dt-od_panel--claim relative flex items-center">
        {/* La riga a due colonne del sito, come il manifesto del nastro: a sinistra occhiello, claim e
            intro; a destra il video di Teresa nella metà 16:9, col sipario. In colonna (sotto la soglia)
            il pannello prende il passo dei blocchi. */}
        <div className="dt-row grid w-full gap-[6vw] py-20 lg:grid-cols-2 lg:items-center lg:py-0 [.dt-horizon:not([data-on])_&]:lg:py-[8vh]">
          <RevealGroup className="lg:pr-[6vw]">{claim}</RevealGroup>
          <div data-horizon-slide data-bg="foto" className="dt-media-half aspect-video! lg:justify-self-end">
            <div data-horizon-slide-img className="absolute inset-0">{video}</div>
          </div>
        </div>
      </div>

      <div className="dt-horizon_panel dt-od_panel dt-od_panel--liste relative flex items-center">
        {/* Le due liste affiancate col rilancio sotto, e a destra Raffaela sulla soglia: la scatola ha il
            rapporto della foto (2:3) e nel nastro è alta 80svh, così la figura è intera a ogni altezza. */}
        <div className="dt-row grid w-full gap-[6vw] py-20 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-center lg:py-0 [.dt-horizon:not([data-on])_&]:lg:py-[8vh]">
          <div>
            <div className="grid gap-[4vw] sm:grid-cols-2">{liste}</div>
            <div className="mt-[4vh]">{cta}</div>
          </div>
          <div data-horizon-slide data-bg="foto" className="dt-od_porta lg:justify-self-end">
            <Image data-horizon-slide-img src={PORTA.file} alt={c.portaAlt} fill sizes={PORTA.sizes} className="object-cover" />
          </div>
        </div>
      </div>
    </HorizonScroller>
  );
}
