"use client";

// HorizonStory — «Perché scegliere Domus Tua»: il capitolo dopo la ricerca,
// coi PANNELLI ORIZZONTALI pilotati dallo scroll (HorizonScroller) che il
// redesign aveva tolto e che Alberto ha chiesto di riavere (2026-09-11:
// «mantenendo quelle animazioni che non erano curve … lo scroll orizzontale
// nella sezione perché domus tua»). Nella grammatica della rivista bianca:
// via il fondale aereo (punto 6 della cliente, «togliere foto dopo ricerca»),
// la cupola (una curva), i fiori e i veli. La stessa ripresa aerea è poi
// tornata come foto del pannello territorio (360c76b, qui sotto): se il punto
// 6 escluda anche quella è una domanda aperta. Resta il gesto — manifesto e
// territorio cuciti in orizzontale
// mentre la pagina scende, da lg in su con motion ok, in colonna altrove
// (HorizonScroller: [data-on] lo mette solo JS). Sopra i pannelli, il video in
// evidenza del capitolo «Come lavoriamo» (che questo sostituisce): stava in
// fondo, largo 420px, con 700px di vuoto accanto — adesso è la colonna
// verticale della riga a due colonne, subito sotto la testa di capitolo.
import Image from "next/image";
import Reveal from "./Reveal";
import ScriptWord from "./motion/ScriptWord";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import RevealGroup from "./motion/RevealGroup";
import HorizonScroller, { HorizonEnter } from "./motion/HorizonScroller";
import StoryVideo from "./StoryVideo";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site, territoryLabel, territoryLabelBy } from "../lib/site";

const copy = {
  it: {
    backdropAlt: "Ripresa col drone di una villa con giardino e piscina",
    domeTitle: "Perché scegliere Domus Tua",
    domeLeft: "Tradate",
    domeRight: "dal 2007",
    eyebrow: "La promessa",
    videoEyebrow: "Storie vere",
    videoLead:
      "Le case che vendiamo le raccontiamo: le persone, le stanze, il risultato. Questa è una di quelle storie.",
    scriptWord: "Come lavoriamo",
    statement: (
      <>
        Vendere senza stress.
        <br />
        Acquistare con sicurezza.
        <br />
        Persone, prima degli immobili.
      </>
    ),
    manifestoAlt: "Divano da esterno sotto un ombrellone, davanti al muro in pietra di una villa",
    cap: "Tradate · Varese",
    stairs: ["Tra la", "Pineta", "e Milano"],
    subtitle: "Il territorio che abitiamo",
    territory:
      // «Tradate e i comuni di la provincia…» era il refuso di H03 (audit del 21
      // settembre 2026, blocco 23): la label di site.ts comincia con l'articolo
      // («la provincia di Varese e l'alta provincia di Como», e lì serve così a
      // CareerApplication), quindi la frase non interpola più un «di» davanti.
      `Lavoriamo dove viviamo: Tradate, ${territoryLabel}, tra il verde del Parco Pineta e i collegamenti per Milano e Malpensa. Conosciamo il valore di ogni via, perché è anche la nostra: è da lì che nasce la valutazione che ti diamo.`,
    cta: "Vedi le case in vendita",
  },
  en: {
    backdropAlt: "Drone shot of a villa with garden and pool",
    domeTitle: "Why choose Domus Tua",
    domeLeft: "Tradate",
    domeRight: "since 2007",
    eyebrow: "Our promise",
    videoEyebrow: "True stories",
    videoLead:
      "We tell the homes we sell in full: the people, the rooms, the result. This is one of those stories.",
    scriptWord: "How we work",
    statement: (
      <>
        Selling without stress.
        <br />
        Buying with confidence.
        <br />
        People before properties.
      </>
    ),
    manifestoAlt: "Outdoor sofa under a parasol, in front of a villa’s stone wall",
    cap: "Tradate · Varese",
    stairs: ["Between the", "Pineta park", "and Milan"],
    subtitle: "The land we call home",
    territory:
      `We work where we live: Tradate and the towns of ${territoryLabelBy.en}, between the green of the Pineta park and the connections to Milan and Malpensa. We know the value of every street, because it is ours too — and that is where the valuation we give you comes from.`,
    cta: "See the homes for sale",
  },
  fr: {
    backdropAlt: "Prise de vue par drone d’une villa avec jardin et piscine",
    domeTitle: "Pourquoi choisir Domus Tua",
    domeLeft: "Tradate",
    domeRight: "depuis 2007",
    eyebrow: "Notre promesse",
    videoEyebrow: "Des histoires vraies",
    videoLead:
      "Les biens que nous vendons, nous les racontons : les personnes, les pièces, le résultat. Voici l'une de ces histoires.",
    scriptWord: "Notre méthode",
    statement: (
      <>
        Vendre sans stress.
        <br />
        Acheter en confiance.
        <br />
        Les personnes avant les biens.
      </>
    ),
    manifestoAlt: "Canapé d’extérieur sous un parasol, devant le mur en pierre d’une villa",
    cap: "Tradate · Varese",
    stairs: ["Entre la", "Pineta", "et Milan"],
    subtitle: "Le territoire que nous habitons",
    territory:
      `Nous travaillons là où nous vivons : Tradate et les communes de ${territoryLabelBy.fr}, entre le vert du parc Pineta et les liaisons vers Milan et Malpensa. Nous connaissons la valeur de chaque rue, parce qu’elle est aussi la nôtre : c’est de là que naît l’estimation que nous vous donnons.`,
    cta: "Voir les biens à vendre",
  },
  de: {
    backdropAlt: "Drohnenaufnahme einer Villa mit Garten und Pool",
    domeTitle: "Warum Domus Tua",
    domeLeft: "Tradate",
    domeRight: "seit 2007",
    eyebrow: "Unser Versprechen",
    videoEyebrow: "Echte Geschichten",
    videoLead:
      "Die Häuser, die wir verkaufen, erzählen wir ganz: die Menschen, die Räume, das Ergebnis. Dies ist eine dieser Geschichten.",
    scriptWord: "So arbeiten wir",
    statement: (
      <>
        Verkaufen ohne Stress.
        <br />
        Kaufen mit Sicherheit.
        <br />
        Menschen vor Immobilien.
      </>
    ),
    manifestoAlt: "Gartensofa unter einem Sonnenschirm vor der Steinmauer einer Villa",
    cap: "Tradate · Varese",
    stairs: ["Zwischen dem", "Pineta-Park", "und Mailand"],
    subtitle: "Unser Zuhause, unser Gebiet",
    territory:
      `Wir arbeiten dort, wo wir leben: Tradate und die Gemeinden ${territoryLabelBy.de}, zwischen dem Grün des Pineta-Parks und den Verbindungen nach Mailand und Malpensa. Wir kennen den Wert jeder Straße — denn es sind auch unsere, und daraus entsteht Ihre Bewertung.`,
    cta: "Immobilien zum Verkauf ansehen",
  },
  es: {
    backdropAlt: "Toma con dron de una villa con jardín y piscina",
    domeTitle: "Por qué elegir Domus Tua",
    domeLeft: "Tradate",
    domeRight: "desde 2007",
    eyebrow: "Nuestra promesa",
    videoEyebrow: "Historias reales",
    videoLead:
      "Las casas que vendemos las contamos enteras: las personas, las habitaciones, el resultado. Esta es una de esas historias.",
    scriptWord: "Cómo trabajamos",
    statement: (
      <>
        Vender sin estrés.
        <br />
        Comprar con seguridad.
        <br />
        Personas antes que inmuebles.
      </>
    ),
    manifestoAlt: "Sofá de exterior bajo una sombrilla, frente al muro de piedra de una villa",
    cap: "Tradate · Varese",
    stairs: ["Entre el", "parque Pineta", "y Milán"],
    subtitle: "El territorio que habitamos",
    territory:
      `Trabajamos donde vivimos: Tradate y los municipios de ${territoryLabelBy.es}, entre el verde del parque Pineta y las conexiones con Milán y Malpensa. Conocemos el valor de cada calle, porque también es la nuestra: de ahí nace la valoración que te damos.`,
    cta: "Ver las casas en venta",
  },
} as const;

export default function HorizonStory() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section id="perche-domus-tua" className="dt-chapter bg-cream">
      {/* Testa di capitolo: eyebrow, titolo d1 (era il titolo curvato della
          cupola: ora è un titolo e basta), corsivo rosso. */}
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <SplitTitle as="h2" className="mt-6 max-w-[16ch] font-display text-d1">
          {c.domeTitle}
        </SplitTitle>
        <ScriptWord className="pl-[14vw]">{c.scriptWord}</ScriptWord>
      </div>

      {/* Il video in evidenza è VERTICALE (girato col telefono, come le storie
          del canale): in un riquadro 16:9 mostrerebbe le bande sfocate di
          YouTube, quindi sta nella COLONNA (dt-media-column--tall, 9:16).
          Composizione del riferimento (§5, riga «squadra vincente»): la colonna
          risale sotto il titolo di capitolo (-10vw) e il testo scende (+10vw),
          così le due colonne non partono mai dalla stessa quota e accanto al
          video non resta mezzo schermo vuoto. Il margine della riga (12vw)
          tiene i 10vw di risalita lontani dalla calligrafia della testa; era
          16vw/14vw, e a 1440 lasciava 349 px di avorio fra la testa e la
          riga (misura del 2026-09-20). */}
      <div className="dt-row mt-[clamp(2.5rem,6vh,4.5rem)] grid gap-[6vw] lg:mt-[12vw] lg:grid-cols-2">
        {/* A60 (Alberto, 22 set. 2026, sera): il file vero della storia di Roberta, 1080×1920, al
            posto della facciata di YouTube — «mettilo al posto della preview youtube, con la logica
            di audio che si attiva in automatico, e quando esci dalla sezione scrollando la pagina,
            si disattiva». Il tetto a 420 px era il conto della copertina 16:9 di YouTube stirata in
            9:16 (1.280 px di sorgente per 1.911 resi): col fotogramma vero 1080×1920 il tetto si
            toglie, come promesso, e la colonna torna piena (605 px a 1440, 640 al massimo). La
            voce parte in vista e si ferma fuori vista (useAmbientVideo, A44). */}
        <StoryVideo
          className="dt-media-column dt-media-column--tall lg:-mt-[10vw]"
          title={site.videos.featured.title}
          poster="/media/open-domus-roberta-poster.jpg"
          sources={{
            hd: { webm: "/media/open-domus-roberta-1080.webm", mp4: "/media/open-domus-roberta-1080.mp4" },
            sd: { webm: "/media/open-domus-roberta-720.webm", mp4: "/media/open-domus-roberta-720.mp4" },
            ar: 9 / 16,
            sdWidth: 720,
          }}
        />
        {/* Il rientro delle altre righe torna insieme al modulo pieno. */}
        <RevealGroup className="lg:mt-[10vw] lg:pl-[6vw]">
          <Reveal>
            <span className="eyebrow">{c.videoEyebrow}</span>
          </Reveal>
          <Reveal>
            {/* Non un heading: il titolo del capitolo è uno solo, sopra. */}
            <p className="mt-6 max-w-[16ch] font-display text-d3 uppercase">{site.videos.featured.title}</p>
          </Reveal>
          <Lead className="mt-8">{c.videoLead}</Lead>
        </RevealGroup>
      </div>

      {/* I pannelli orizzontali: manifesto e territorio. Con MQ.corridor
          (D22: 1024 px di larghezza, 640 di altezza, motion ok) lo screen è
          sticky e il track scorre in orizzontale mentre la pagina scende
          (l'altezza della sezione È la larghezza del track); senza JS, con
          reduced-motion o sotto quella soglia restano due blocchi in
          colonna, completi e statici. Sopra i pannelli non c'è più nessuna
          foto aerea né velo: solo l'avorio della pagina. */}
      <div className="mt-[clamp(3rem,7vh,5rem)]">
        <HorizonScroller id="storia" corridor="storia" refreshKey={locale}>
          {/* Pannello manifesto (A12 di Alberto: il nastro resta; A20: titolo
              per lettera e lead a righe, spec §2.4). Manifesto e lead sono un
              gruppo solo, <HorizonEnter>: col nastro acceso lo fa entrare il
              cue «top 70%» della radice e uscire la risalita sotto quel punto;
              sotto MQ.corridor (D22) entra con l'IO del motore.
              La variante `[.dt-horizon:not([data-on])_&]` vale SOLO quando il
              nastro non è acceso (reduced-motion, niente JS, sotto la soglia):
              lì i pannelli sono blocchi in colonna e `lg:py-0` — giusto dentro
              uno schermo sticky da 100svh — li faceva combaciare, con la fine
              del manifesto attaccata all'eyebrow del territorio. */}
          <div className="dt-horizon_panel dt-horizon_panel--statement relative flex items-center">
            {/* Il manifesto era una colonna di testo centrata, larga al piu' 1000
                px, sola in un pannello di 100vw: 292 px di avorio per lato a
                1440, e nel passaggio al territorio 761 px di nulla (misura del
                2026-09-20, screenshot di Alberto). Ora e' la riga a due colonne
                del sito: a sinistra le tre frasi, a bandiera; a destra una
                fotografia nella meta' forzata a 16:9 (il sorgente e' 16:9,
                2560×1440: nessun taglio, nessun ingrandimento). Il lead che
                stava sotto le frasi non c'e' piu': ripeteva Posizionamento
                parola per parola (valutare sui dati, documenti prima, raccontare,
                fino al rogito). Sotto la soglia del nastro le due colonne si
                impilano, foto sotto le frasi. */}
            <HorizonEnter className="dt-row grid w-full gap-[6vw] py-20 lg:grid-cols-2 lg:items-center lg:py-0 [.dt-horizon:not([data-on])_&]:lg:py-[8vh]">
              <SplitTitle as="h3" className="font-display text-d2">
                {c.statement}
              </SplitTitle>
              <div data-horizon-slide data-bg="foto" className="dt-media-half !aspect-video lg:justify-self-end">
                <Image
                  data-horizon-slide-img
                  src="/images/reali/villa-salotto-ombrellone.jpg"
                  alt={c.manifestoAlt}
                  fill
                  sizes="(max-width: 1023px) 90vw, (max-width: 1523px) 42vw, 640px"
                  className="object-cover"
                />
              </div>
            </HorizonEnter>
          </div>

          {/* Pannello territorio: i gradini del titolo cavalcano la foto in
              parallasse contraria, la foto si apre a sipario (clip-path).
              A destra il rientro è 5vw nel nastro e 8vw in colonna: i 5vw
              servono al pannello quando è largo un viewport, ma in pagina
              mettevano titolo e foto su una linea verticale tutta loro.
              IL RIENTRO SINISTRO È 9,5vw DA 1024 IN SU COL NASTRO ACCESO
              (D68, per A27 di Alberto: il segno non copre niente e gli resta
              almeno 16 px d'aria). Da 1024 il monogramma fisso (MarkSegno) sta
              nel margine col centro a 4vw, e il suo bordo destro arriva a
              4vw + clamp(40px, 3,75vw, 56px) / 2: 84,6 px a 1440, 75,2 a 1280,
              61,0 a 1024. Chi gli si avvicina davvero non è l'h3 — la sua
              scatola resta ferma al posto di layout — ma il gradino di mezzo
              «Pineta»: ha `lg:ml-[9vw]` e la parallasse contraria di
              HorizonScroller lo porta a xPercent −25 nella posa di fine corsa,
              cioè a 1,115 · rientro − 0,024 · larghezza px dal bordo sinistro.
              Con 8vw restava a 5,8 / 7,7 / 9,3 px dal segno (1024 / 1280 /
              1440), sotto la riserva; il rientro che tocca esattamente i 16 px
              è 8,9vw a 1024, e 9,5vw porta il gradino a 22,9 / 29,1 / 33,4 px e
              l'h3 col link a 36,5 / 46,2 / 52,6, al prezzo di 15,4 px di
              larghezza utile a 1024 (misure/20-territorio.mjs). In colonna la
              variante `[.dt-horizon:not([data-on])_&]` tiene 8vw sui due lati:
              lì nessun gradino cavalca la foto e il titolo è già a 20,9 px dal
              segno. A 1920 il pannello è centrato dal max-w e sta a 209 px. */}
          <div className="dt-horizon_panel dt-horizon_panel--territory relative flex items-center">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-[5vw] py-20 lg:pl-[9.5vw] [.dt-horizon:not([data-on])_&]:lg:px-[8vw] lg:grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center lg:gap-0 lg:py-0 [.dt-horizon:not([data-on])_&]:lg:py-[8vh]">
              <div className="dt-horizon_stairs">
                <p className="eyebrow">{c.cap}</p>
                <h3 className="mt-6 font-display leading-[0.95] tracking-[-0.01em]">
                  {c.stairs.map((line, i) => (
                    <span
                      key={line}
                      data-horizon-stair
                      // NON `text-d2`: i gradini vivono dentro un pannello del
                      // nastro orizzontale largo ~918px, e a 7,6vw una riga in
                      // maiuscolo lo sfora di ~190px (misurato) finendo sotto
                      // l'overflow:clip della sezione.
                      className={`block text-[clamp(2.6rem,7vw,6.5rem)] ${
                        i === 1 ? "lg:ml-[9vw]" : i === 2 ? "lg:ml-[4vw]" : ""
                      }`}
                    >
                      {line}
                    </span>
                  ))}
                </h3>
                {/* Gruppo del motore (spec §2.4): nel nastro entra quando è in
                    scena e, risalendo, esce a destra della linea dell'85 %; in
                    colonna entra dal basso. Col link dentro, il ruolo ctn scende
                    a still: nei replay solo opacità (D21).
                    `dt-horizon_text`: col nastro acceso il gruppo rende gli 11vw
                    che i gradini prendono per cavalcare la foto, più 2rem di
                    canale (globals.css), così lead, h4 e link si fermano prima
                    della foto e non ci finiscono sotto né a filo — audit del 21
                    settembre 2026 (blocco 23), difetto H03, due giri. */}
                <RevealGroup className="dt-horizon_text mt-10 max-w-[50ch]">
                  <SplitTitle as="h4" className="font-display text-d4">
                    {c.subtitle}
                  </SplitTitle>
                  <Reveal as="p" className="mt-4 text-body text-graphite">
                    {c.territory}
                  </Reveal>
                  <Reveal>
                    <Cta href="/acquista" variant="ghost" className="mt-7">
                      {c.cta}
                    </Cta>
                  </Reveal>
                </RevealGroup>
              </div>
              {/* L'ALT DICE COSA SI VEDE, NON COSA VORREMMO: e' una ripresa quasi
                  a picco su UNA villa privata con piscina, non «i tetti e il
                  verde attorno a Tradate». docs/da-chiedere-alla-cliente.md
                  §2.2 lo segna come bloccante — immobile, autorizzazione del
                  proprietario e diritti sono ancora da chiarire — e fino ad
                  allora la descrizione non puo' promettere un luogo.
                  Il territorio si illustra col territorio: la ripresa col
                  drone, non il render 3D di un attico (era
                  ingrandito 1,7× dentro una scatola alta 72vh). La sorgente è
                  2560×1280, cioè PANORAMICA: sta in una banda 16:9, dove si
                  taglia l'11% e non si ingrandisce nulla; in un ritratto ne
                  resterebbe un terzo. */}
              {/* Zona foto del monogramma (A21 di Alberto, spec §6.1): sopra
                  questa foto le tacche del segno virano all'avorio. */}
              <div data-horizon-slide data-bg="foto" className="dt-media-full">
                <Image
                  data-horizon-slide-img
                  src="/media/hero-aerial.jpg"
                  alt={c.backdropAlt}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </HorizonScroller>
      </div>

    </section>
  );
}
