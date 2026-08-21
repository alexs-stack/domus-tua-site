"use client";

// HorizonStory — il set piece della home dopo la ricerca, in tre atti
// (tecnica dal dossier reverse-engineering/era-residence §11, contenuti nostri):
// 1. fondale: la foto aerea reale resta pinnata (sticky) mentre...
// 2. ...la cupola crema — arco ribassato, variante Domus del semicerchio del
//    riferimento — le sale sopra dal basso, col titolo curvato e FERMO su un
//    textPath circolare (perché fermo: vedi la nota sull'SVG, atto 2);
// 3. i pannelli orizzontali (HorizonScroller): manifesto + territorio.
// Mobile: fondale semplice, pannelli in colonna — con la stessa coreografia,
// sull'asse verticale e senza pin (ramo mobile di HorizonScroller: chars del
// manifesto, gradini, sipario e deriva del tralcio, verdetto 15 dell'onda
// «parità mobile 2»).
// Reduced-motion o senza JS: tutto fermo, tutto visibile.
import type { ReactNode } from "react";
import { territoryLabel, territoryLabelBy } from "../lib/site";
import Image from "next/image";
import SurfaceVeil from "./motion/SurfaceVeil";
import Link from "next/link";
import HorizonScroller from "./motion/HorizonScroller";
import Fioritura from "./motion/Fioritura";
import ReviewsWall from "./ReviewsWall";
import Reveal from "./Reveal";
import { SegnoDomus } from "./BrandMotif";
import { ArrowRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    backdropAlt: "Vista aerea dei tetti e del verde attorno a Tradate",
    domeTitle: "Perché scegliere Domus Tua",
    domeLeft: "Tradate",
    domeRight: "dal 2007",
    eyebrow: "La promessa",
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

// Arco del titolo curvato: cerchio largo (r=1800, centro sotto il viewBox) →
// curvatura dolce, coerente con l'arco ribassato della cupola. startOffset 25%
// = apice del cerchio (il path parte dal punto più a sinistra).
const ARC_PATH = "M 800,1900 m -1800,0 a 1800,1800 0 1,1 3600,0 a 1800,1800 0 1,1 -3600,0";

export default function HorizonStory({ children }: { children?: ReactNode }) {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <>
      {/* Atto 1 — fondale: la foto resta pinnata mentre la cupola le sale sopra. */}
      <div className="relative z-0 h-[160svh]">
        {/* `bg-cream-deep`: sul desktop non si vede — la foto copre il pannello
            per intero — ma sotto i 768 la foto diventa una fascia centrata
            (globals.css, «Le foto a tutto schermo diventano fasce») e attorno a
            lei ci vuole il crema del capitolo, non il vuoto. Il tono è quello
            del velo qui sotto: un campo solo, nessuna giuntura. */}
        <div className="sticky top-0 h-svh overflow-hidden bg-cream-deep">
          {/* Il wrapper esiste per la fascia: `Image fill` si posiziona da sé
              su `inset-0` del pannello, e la geometria del telefono va scritta
              su un nodo che possiamo governare. */}
          <div className="dt-mob-band dt-mob-band--centro absolute inset-0">
            <Image
              src="/media/hero-aerial.jpg"
              alt={c.backdropAlt}
              fill
              sizes="100vw"
              // A differenza dell'hero in PageHero, qui la foto non ha velature scure:
              // è il fondale a schermo intero del primo atto, quindi resta il soggetto
              // — quality 60 la rendeva visibilmente sgranata sui tetti/alberi.
              quality={75}
              className="object-cover"
            />
          </div>
          {/* La ricerca (crema) consegna alla foto aerea: senza velo il bordo
              è un taglio da ΔRGB 583. Qui il crema entra dentro il cielo. */}
          <SurfaceVeil edge="top" tone="cream-deep" height="22svh" />
        </div>
      </div>

      {/* Atti 2 e 3 vivono in UN SOLO contenitore curvo: il trattamento-luce di
          .bg-cream (bloom dall'alto) riparte a ogni elemento che porta la classe,
          e due superfici separate creavano una linea d'ombra al confine. Con la
          cupola come wrapper la pagina che sale è davvero una sola. */}
      <div data-tone-keep="cream" className="dt-dome relative z-10 -mt-[60svh] bg-cream">
        {/* Atto 2 — l'intro sotto l'arco. Il titolo curvato è decorativo
            (aria-hidden): il testo leggibile vive nell'h2 sr-only. */}
        <div className="mx-auto max-w-[1600px] px-5 pb-6 pt-[16svh] sm:px-8">
          <h2 className="sr-only">{c.domeTitle}</h2>
          {/* Qui le parole del titolo si distendevano lungo l'arco in scrub
              (word-spacing 0 → 0.55em, rif. §11.4 del dossier). TOLTO — e non
              è una svista, non rimettercelo. Il motivo non è la larghezza:
              word-spacing è una proprietà di LAYOUT, quindi ogni fotogramma
              dello scrub rifaceva il layout del testo e costringeva il
              textPath a rimisurare e ripiazzare ogni glifo lungo la curva.
              La Fase 2 si era limitata a chiuderlo dentro MQ.lg contando il
              taglio come regola Chanel: mezza misura, perché la legge «solo
              transform, opacity, clip-path» non ha una clausola «tranne che
              sul desktop». Con il tween se n'è andato l'unico useGSAP del
              file, e con lui uno ScrollTrigger in scrub acceso per tutta la
              sezione. Il titolo fermo si legge benissimo: il gesto è l'arco,
              non il respiro delle parole. Il credito Chanel della parità
              mobile ora lo paga lo scrub dei gradini in HorizonScroller.
              L'SVG resta identico, `data-dome-text` compreso: è un marcatore
              inerte, nessuno lo interroga più. */}
          <div aria-hidden className="mx-auto w-full max-w-[1240px]">
            <svg viewBox="0 0 1600 460" width="100%" height="100%" className="block">
              <defs>
                <path id="dt-dome-arc" d={ARC_PATH} />
              </defs>
              <text
                data-dome-text
                textAnchor="middle"
                fill="currentColor"
                className="font-display uppercase text-ink"
                style={{ fontSize: 96, letterSpacing: "0.02em" }}
              >
                <textPath href="#dt-dome-arc" startOffset="25%">
                  {c.domeTitle}
                </textPath>
              </text>
            </svg>
          </div>
          <Reveal className="mt-4 flex items-center justify-center gap-4">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-graphite">
              {c.domeLeft}
            </span>
            <SegnoDomus className="h-4 w-10" />
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-graphite">
              {c.domeRight}
            </span>
          </Reveal>
          <Reveal delay={120} className="mx-auto mt-8 h-14 w-px bg-red/40" as="div">
            <span className="sr-only" />
          </Reveal>
        </div>

        {/* Atto 3 — i pannelli orizzontali (stessa superficie curva, nessun
            proprio sfondo: la luce resta quella del wrapper). */}
        <HorizonScroller id="storia" refreshKey={locale}>
        {/* Pannello manifesto */}
        <div className="dt-horizon_panel dt-horizon_panel--statement relative flex items-center justify-center">
          {/* L'angolo fiorito del riferimento (era-residence §11.3): il tralcio
              sboccia dall'angolo alto e deriva con la parallasse dei fiori.
              Acceso anche sotto lg (onda «parità mobile 2», verdetto 6): delle
              due Fioriture di questo capitolo è QUESTA che resta a 390 — «una
              per sezione» — con box 117px quadrati (`w-[30vw]`), dpr 1,5 e
              tetto 900 dentro Fioritura; l'angolo alto a sinistra del
              manifesto è aria anche in colonna (il testo è centrato e parte
              sotto py-20). La deriva `drift-y` sotto lg la fa HorizonScroller
              nel suo ramo mobile (Fase 3): qui c'è il tralcio, lì il moto. */}
          <div
            aria-hidden
            data-horizon-flower="drift-y"
            className="pointer-events-none absolute -left-6 -top-8 z-10 h-[22vh] w-[30vw] lg:h-[44vh] lg:w-[20vw]"
          >
            <Fioritura variant="corner-tl" className="h-full w-full" />
          </div>
          <div className="mx-auto max-w-[1000px] px-5 py-20 text-center sm:px-8 lg:py-0">
            <Reveal>
              <span className="eyebrow eyebrow--center justify-center">{c.eyebrow}</span>
            </Reveal>
            {/* Reveal per-carattere (animatore "h" del riferimento, §7 del
                dossier): orchestrato da HorizonScroller al pin della sezione —
                un trigger di posizione qui suonerebbe a sipario ancora chiuso. */}
            <h2
              key={locale}
              data-horizon-reveal="chars"
              className="mt-6 font-display text-d3 display-tight font-medium uppercase text-ink"
            >
              {c.statement}
            </h2>
            <Reveal delay={160}>
              <p className="mx-auto mt-8 max-w-xl text-[0.98rem] leading-relaxed text-stone sm:text-base">
                {c.lead}
              </p>
            </Reveal>
            <Reveal delay={240} className="mt-8 flex justify-center">
              <SegnoDomus className="h-5 w-12" />
            </Reveal>
          </div>
        </div>

        {/* Pannello territorio */}
        <div className="dt-horizon_panel dt-horizon_panel--territory relative flex items-center">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-10 px-5 py-20 sm:px-8 lg:grid lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)] lg:items-center lg:gap-0 lg:py-0">
            <div className="dt-horizon_stairs">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-red">
                {c.cap}
              </p>
              <h2 className="mt-6 font-display font-medium uppercase leading-[0.95] tracking-[-0.01em] text-ink">
                {c.stairs.map((line, i) => (
                  <span
                    key={line}
                    data-horizon-stair
                    // NON `text-d2`: i gradini vivono dentro un pannello del
                    // nastro orizzontale largo ~918px, e a 7,6vw una riga in
                    // maiuscolo lo sfora di ~190px (misurato) finendo sotto
                    // l'overflow:clip della sezione. Questa era già la misura
                    // più grande del sito: qui "più grande" vorrebbe dire
                    // "tagliato".
                    className={`block text-[clamp(2.6rem,7vw,6.5rem)] ${
                      i === 1 ? "lg:ml-[9vw]" : i === 2 ? "lg:ml-[4vw]" : ""
                    }`}
                  >
                    {line}
                  </span>
                ))}
              </h2>
              <div data-horizon-reveal="track" className="mt-10 max-w-md">
                <h3 className="font-display text-xl font-medium text-ink sm:text-2xl">
                  {c.subtitle}
                </h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-stone sm:text-base">
                  {c.territory}
                </p>
                <Link
                  href="/acquista"
                  className="tap-target group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
                >
                  {c.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
            <div
              data-horizon-slide
              className="relative aspect-[4/3] w-full overflow-hidden rounded-card lg:aspect-auto lg:h-[72vh]"
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
          {/* La scritta in fiori (tecnica WebGL-typing, canvas 2D): il nome del
              territorio fiorisce come una firma botanica sotto i gradini.
              Sotto lg resta `hidden` per la regola «una Fioritura per sezione
              a 390» (docs/effetti-reference.md; onda «parità mobile 2»,
              verdetto 6): il capitolo tiene il tralcio del manifesto qui
              sopra, e fra le due questa è la più cara (una scritta campiona
              ogni pixel: 2 200 particelle a passo 1). Non è la dottrina
              «tradurre»: è un tetto di densità, e vale anche sul tablet. */}
          <div
            aria-hidden
            data-horizon-flower="drift-x"
            className="pointer-events-none absolute bottom-[7vh] left-[5vw] z-10 hidden h-[13vh] w-[30vw] lg:block"
          >
            <Fioritura word="Tradate" variant="corner-bl" className="h-full w-full" />
          </div>
        </div>

        {/* QUI STAVANO DUE PANNELLI RECENSIONI, E SONO STATI TOLTI.
            («Lo specchio del nostro lavoro» e «Le voci, in prima persona».)

            La home aveva CINQUE sezioni di recensioni — questi due, il muro delle voci,
            «Cinque stelle, una alla volta» e «Parola per parola» — e in nessuna delle
            cinque si leggeva una parola scritta da un cliente. Cinque titoli diversi per
            dire la stessa cosa non sono cinque prove: sono una prova sola, ripetuta
            cinque volte, e ogni ripetizione la indebolisce.

            Sono caduti questi due perché erano i più deboli: bellissimi da guardare, ma
            parlavano DI recensioni invece di mostrarne una. Restano il muro delle voci
            (Atto 4), che porta i titoli veri delle storie dei clienti, e StarReviews
            (Atto 5), che porta voto, premio e il widget di verifica.

            Il set piece orizzontale torna a due pannelli — la promessa e il territorio —
            che è poi il suo arco naturale: chi siamo, e dove. */}

        </HorizonScroller>

        {/* Atto 4 — dall'ultimo fotogramma orizzontale lo scroll torna
            verticale e il muro delle voci si compone (stessa superficie
            curva: nessuna cucitura di luce). */}
        <ReviewsWall />

        {/* Atto 5 — i capitoli che continuano la stessa pagina (es. le cinque
            stelle): DENTRO la superficie curva, così il trattamento-luce di
            .bg-cream non riparte e il confine non disegna la linea d'ombra
            che spezzava lo scroll (stessa lezione degli atti 2-3). */}
        {children}
      </div>
    </>
  );
}
