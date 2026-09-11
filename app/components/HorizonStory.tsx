"use client";

// HorizonStory — «Perché scegliere Domus Tua»: il capitolo dopo la ricerca,
// coi PANNELLI ORIZZONTALI pilotati dallo scroll (HorizonScroller) che il
// redesign aveva tolto e che Alberto ha chiesto di riavere (2026-09-11:
// «mantenendo quelle animazioni che non erano curve … lo scroll orizzontale
// nella sezione perché domus tua»). Nella grammatica della rivista bianca:
// via il fondale aereo (punto 6 della cliente), la cupola (una curva), i fiori
// e i veli; resta il gesto — manifesto e territorio cuciti in orizzontale
// mentre la pagina scende, da lg in su con motion ok, in colonna altrove
// (HorizonScroller: [data-on] lo mette solo JS). Sotto, il video in evidenza
// del capitolo «Come lavoriamo», che questo sostituisce (stesso copy).
import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import HorizonScroller from "./motion/HorizonScroller";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site, territoryLabel, territoryLabelBy } from "../lib/site";

const copy = {
  it: {
    backdropAlt: "Vista aerea dei tetti e del verde attorno a Tradate",
    domeTitle: "Perché scegliere Domus Tua",
    domeLeft: "Tradate",
    domeRight: "dal 2007",
    eyebrow: "La promessa",
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
    lead: "Dal 2007 con le famiglie di Tradate e provincia: valutiamo sui dati, verifichiamo i documenti prima del mercato, raccontiamo la casa e restiamo fino al rogito.",
    cap: "Tradate · Varese",
    stairs: ["Tra la", "Pineta", "e Milano"],
    subtitle: "Il territorio che abitiamo",
    territory:
      `Lavoriamo dove viviamo: Tradate e i comuni di ${territoryLabel}, tra il verde del Parco Pineta e i collegamenti per Milano e Malpensa. Conosciamo il valore di ogni via, perché è anche la nostra: è da lì che nasce la valutazione che ti diamo.`,
    cta: "Vedi le case in vendita",
    imageAlt: "Attico con terrazzo a Tradate seguito da Domus Tua",
  },
  en: {
    backdropAlt: "Aerial view of the rooftops and greenery around Tradate",
    domeTitle: "Why choose Domus Tua",
    domeLeft: "Tradate",
    domeRight: "since 2007",
    eyebrow: "Our promise",
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
    lead: "Since 2007 alongside the families of Tradate and its province: we value on data, check the paperwork before going to market, tell the home's story and stay through to the deed.",
    cap: "Tradate · Varese",
    stairs: ["Between the", "Pineta park", "and Milan"],
    subtitle: "The land we call home",
    territory:
      `We work where we live: Tradate and the towns of ${territoryLabelBy.en}, between the green of the Pineta park and the connections to Milan and Malpensa. We know the value of every street, because it is ours too — and that is where the valuation we give you comes from.`,
    cta: "See the homes for sale",
    imageAlt: "Penthouse with terrace in Tradate listed by Domus Tua",
  },
  fr: {
    backdropAlt: "Vue aérienne des toits et de la verdure autour de Tradate",
    domeTitle: "Pourquoi choisir Domus Tua",
    domeLeft: "Tradate",
    domeRight: "depuis 2007",
    eyebrow: "Notre promesse",
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
    lead: "Depuis 2007 aux côtés des familles de Tradate et de sa province : nous estimons sur des données, contrôlons les documents avant la mise en vente, racontons le bien et restons jusqu'à l'acte.",
    cap: "Tradate · Varese",
    stairs: ["Entre la", "Pineta", "et Milan"],
    subtitle: "Le territoire que nous habitons",
    territory:
      `Nous travaillons là où nous vivons : Tradate et les communes de ${territoryLabelBy.fr}, entre le vert du parc Pineta et les liaisons vers Milan et Malpensa. Nous connaissons la valeur de chaque rue, parce qu’elle est aussi la nôtre : c’est de là que naît l’estimation que nous vous donnons.`,
    cta: "Voir les biens à vendre",
    imageAlt: "Attique avec terrasse à Tradate proposé par Domus Tua",
  },
  de: {
    backdropAlt: "Luftaufnahme der Dächer und des Grüns rund um Tradate",
    domeTitle: "Warum Domus Tua",
    domeLeft: "Tradate",
    domeRight: "seit 2007",
    eyebrow: "Unser Versprechen",
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
    lead: "Seit 2007 an der Seite der Familien in Tradate und Umgebung: Wir bewerten anhand von Daten, prüfen die Unterlagen vor dem Markteintritt, erzählen das Haus und bleiben bis zum Notartermin.",
    cap: "Tradate · Varese",
    stairs: ["Zwischen dem", "Pineta-Park", "und Mailand"],
    subtitle: "Unser Zuhause, unser Gebiet",
    territory:
      `Wir arbeiten dort, wo wir leben: Tradate und die Gemeinden ${territoryLabelBy.de}, zwischen dem Grün des Pineta-Parks und den Verbindungen nach Mailand und Malpensa. Wir kennen den Wert jeder Straße — denn es sind auch unsere, und daraus entsteht Ihre Bewertung.`,
    cta: "Immobilien zum Verkauf ansehen",
    imageAlt: "Penthouse mit Terrasse in Tradate im Angebot von Domus Tua",
  },
  es: {
    backdropAlt: "Vista aérea de los tejados y el verde alrededor de Tradate",
    domeTitle: "Por qué elegir Domus Tua",
    domeLeft: "Tradate",
    domeRight: "desde 2007",
    eyebrow: "Nuestra promesa",
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
    lead: "Desde 2007 junto a las familias de Tradate y su provincia: valoramos con datos, comprobamos los documentos antes del mercado, contamos la casa y seguimos hasta la escritura.",
    cap: "Tradate · Varese",
    stairs: ["Entre el", "parque Pineta", "y Milán"],
    subtitle: "El territorio que habitamos",
    territory:
      `Trabajamos donde vivimos: Tradate y los municipios de ${territoryLabelBy.es}, entre el verde del parque Pineta y las conexiones con Milán y Malpensa. Conocemos el valor de cada calle, porque también es la nuestra: de ahí nace la valoración que te damos.`,
    cta: "Ver las casas en venta",
    imageAlt: "Ático con terraza en Tradate ofrecido por Domus Tua",
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
        <TextLines as="h2" className="mt-6 max-w-[16ch] font-display text-d1">
          {c.domeTitle}
        </TextLines>
        <Reveal delay={120}>
          <span aria-hidden className="script-word pl-[14vw]">
            {c.scriptWord}
          </span>
        </Reveal>
      </div>

      {/* I pannelli orizzontali: manifesto e territorio. Da lg in su con
          motion ok lo screen è sticky e il track scorre in orizzontale mentre
          la pagina scende (l'altezza della sezione È la larghezza del track);
          senza JS, con reduced-motion o sotto lg restano due blocchi in
          colonna, completi e statici. Sopra i pannelli non c'è più nessuna
          foto aerea né velo: solo l'avorio della pagina. */}
      <div className="mt-[clamp(3rem,8vh,6rem)]">
        <HorizonScroller id="storia" refreshKey={locale}>
          {/* Pannello manifesto: il titolo entra per carattere (animatore «h»
              del riferimento), orchestrato da HorizonScroller al pin. */}
          <div className="dt-horizon_panel dt-horizon_panel--statement relative flex items-center justify-center">
            <div className="mx-auto max-w-[1000px] px-[5vw] py-20 text-center lg:py-0">
              <h3 key={locale} data-horizon-reveal="chars" className="font-display text-d2">
                {c.statement}
              </h3>
              <Reveal delay={160}>
                <p className="lead mx-auto mt-8">{c.lead}</p>
              </Reveal>
            </div>
          </div>

          {/* Pannello territorio: i gradini del titolo cavalcano la foto in
              parallasse contraria, la foto si apre a sipario (clip-path). */}
          <div className="dt-horizon_panel dt-horizon_panel--territory relative flex items-center">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-[5vw] py-20 lg:grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center lg:gap-0 lg:py-0">
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
                <div data-horizon-reveal="track" className="mt-10 max-w-[50ch]">
                  <h4 className="font-display text-d4">{c.subtitle}</h4>
                  <p className="mt-4 text-body text-graphite">{c.territory}</p>
                  <Cta href="/acquista" variant="ghost" className="mt-7">
                    {c.cta}
                  </Cta>
                </div>
              </div>
              <div
                data-horizon-slide
                className="relative aspect-[4/3] w-full overflow-hidden lg:aspect-auto lg:h-[72vh]"
              >
                <Image
                  data-horizon-slide-img
                  src="/images/reali/attico-tradate.jpg"
                  alt={c.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </HorizonScroller>
      </div>

      {/* Il video in evidenza è VERTICALE (girato col telefono, come le storie
          del canale): in un riquadro 16:9 mostrerebbe le bande sfocate di
          YouTube. Sta quindi in colonna, col suo titolo accanto. Si carica
          solo al click. */}
      <div className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-[6vw] lg:grid-cols-[2fr_3fr] lg:items-center">
        <div className="mx-auto w-full max-w-[420px] lg:mx-0">
          <LazyYouTubeEmbed id={site.videos.featured.id} title={site.videos.featured.title} aspect="portrait" />
        </div>
        <Reveal delay={200}>
          <p className="max-w-[16ch] font-display text-d3 uppercase">{site.videos.featured.title}</p>
        </Reveal>
      </div>
    </section>
  );
}
