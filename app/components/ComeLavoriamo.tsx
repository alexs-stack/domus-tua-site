"use client";

// ComeLavoriamo — il capitolo dopo la ricerca (rivista bianca, 2026-09-10,
// rif. immobiliaregoldengoal.it «Specialisti nella vendita»): titolo d1 a
// sinistra, la parola corsiva rossa, il lead in colonna stretta, il video
// in pagina a tutta larghezza, e sotto la riga del territorio con la foto
// quadrata. Sostituisce HorizonStory: via fondale aereo, cupola, pannelli
// orizzontali e fiori. I testi sono gli stessi (copy conservato).
import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site, territoryLabel, territoryLabelBy } from "../lib/site";
import type { Locale } from "../lib/i18n/dictionaries";

type Copy = {
  eyebrow: string;
  /** Una stringa sola: TextLines spezza le righe da sé (niente <br/>). */
  statement: string;
  scriptWord: string;
  lead: string;
  /** Conservato dal copy di HorizonStory; qui non ha più una riga sua. */
  cap: string;
  stairs: string[];
  subtitle: string;
  territory: string;
  cta: string;
  imageAlt: string;
};

const copy: Record<Locale, Copy> = {
  it: {
    eyebrow: "La promessa",
    statement: "Vendere senza stress. Acquistare con sicurezza.",
    scriptWord: "Come lavoriamo",
    lead: "Dal 2007 con le famiglie di Tradate e provincia: valutiamo sui dati, verifichiamo i documenti prima del mercato, raccontiamo la casa e restiamo fino al rogito.",
    cap: "Tradate · Varese",
    stairs: ["Tra la", "Pineta", "e Milano"],
    subtitle: "Il territorio che abitiamo",
    territory: `Lavoriamo dove viviamo: Tradate e i comuni di ${territoryLabel}, tra il verde del Parco Pineta e i collegamenti per Milano e Malpensa. Conosciamo il valore di ogni via, perché è anche la nostra: è da lì che nasce la valutazione che ti diamo.`,
    cta: "Vedi le case in vendita",
    imageAlt: "Attico con terrazzo a Tradate seguito da Domus Tua",
  },
  en: {
    eyebrow: "Our promise",
    statement: "Selling without stress. Buying with confidence.",
    scriptWord: "How we work",
    lead: "Since 2007 alongside the families of Tradate and its province: we value on data, check the paperwork before going to market, tell the home's story and stay through to the deed.",
    cap: "Tradate · Varese",
    stairs: ["Between the", "Pineta park", "and Milan"],
    subtitle: "The land we call home",
    territory: `We work where we live: Tradate and the towns of ${territoryLabelBy.en}, between the green of the Pineta park and the connections to Milan and Malpensa. We know the value of every street, because it is ours too — and that is where the valuation we give you comes from.`,
    cta: "See the homes for sale",
    imageAlt: "Penthouse with terrace in Tradate listed by Domus Tua",
  },
  fr: {
    eyebrow: "Notre promesse",
    statement: "Vendre sans stress. Acheter en confiance.",
    scriptWord: "Notre méthode",
    lead: "Depuis 2007 aux côtés des familles de Tradate et de sa province : nous estimons sur des données, contrôlons les documents avant la mise en vente, racontons le bien et restons jusqu'à l'acte.",
    cap: "Tradate · Varese",
    stairs: ["Entre la", "Pineta", "et Milan"],
    subtitle: "Le territoire que nous habitons",
    territory: `Nous travaillons là où nous vivons : Tradate et les communes de ${territoryLabelBy.fr}, entre le vert du parc Pineta et les liaisons vers Milan et Malpensa. Nous connaissons la valeur de chaque rue, parce qu’elle est aussi la nôtre : c’est de là que naît l’estimation que nous vous donnons.`,
    cta: "Voir les biens à vendre",
    imageAlt: "Attique avec terrasse à Tradate proposé par Domus Tua",
  },
  de: {
    eyebrow: "Unser Versprechen",
    statement: "Verkaufen ohne Stress. Kaufen mit Sicherheit.",
    scriptWord: "So arbeiten wir",
    lead: "Seit 2007 an der Seite der Familien in Tradate und Umgebung: Wir bewerten anhand von Daten, prüfen die Unterlagen vor dem Markteintritt, erzählen das Haus und bleiben bis zum Notartermin.",
    cap: "Tradate · Varese",
    stairs: ["Zwischen dem", "Pineta-Park", "und Mailand"],
    subtitle: "Unser Zuhause, unser Gebiet",
    territory: `Wir arbeiten dort, wo wir leben: Tradate und die Gemeinden ${territoryLabelBy.de}, zwischen dem Grün des Pineta-Parks und den Verbindungen nach Mailand und Malpensa. Wir kennen den Wert jeder Straße — denn es sind auch unsere, und daraus entsteht Ihre Bewertung.`,
    cta: "Immobilien zum Verkauf ansehen",
    imageAlt: "Penthouse mit Terrasse in Tradate im Angebot von Domus Tua",
  },
  es: {
    eyebrow: "Nuestra promesa",
    statement: "Vender sin estrés. Comprar con seguridad.",
    scriptWord: "Cómo trabajamos",
    lead: "Desde 2007 junto a las familias de Tradate y su provincia: valoramos con datos, comprobamos los documentos antes del mercado, contamos la casa y seguimos hasta la escritura.",
    cap: "Tradate · Varese",
    stairs: ["Entre el", "parque Pineta", "y Milán"],
    subtitle: "El territorio que habitamos",
    territory: `Trabajamos donde vivimos: Tradate y los municipios de ${territoryLabelBy.es}, entre el verde del parque Pineta y las conexiones con Milán y Malpensa. Conocemos el valor de cada calle, porque también es la nuestra: de ahí nace la valoración que te damos.`,
    cta: "Ver las casas en venta",
    imageAlt: "Ático con terraza en Tradate ofrecido por Domus Tua",
  },
};

export default function ComeLavoriamo() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section className="dt-chapter bg-cream">
      {/* Testa di capitolo: eyebrow, titolo d1, corsivo rosso, lead a destra. */}
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <TextLines as="h2" className="mt-6 max-w-[20ch] font-display text-d1">
          {c.statement}
        </TextLines>
        {/* Decorativa (aria-hidden): il senso è già nel titolo e nell'eyebrow.
            Il corsivo si infila sotto la linea di base del titolo: con -0.35em
            (misura del riferimento, che ha due righe) attraversava le lettere
            dell'ultima riga, qui lunga. */}
        <Reveal delay={120}>
          <span aria-hidden className="script-word -mt-[0.1em] block pl-[14vw]">
            {c.scriptWord}
          </span>
        </Reveal>
      </div>
      {/* Il video in evidenza è VERTICALE (girato col telefono, come le storie
          del canale): in un riquadro 16:9 mostrerebbe le bande sfocate di
          YouTube. Sta quindi in colonna, come i video verticali del
          riferimento, con il lead accanto. Si carica solo al click. */}
      <div className="dt-row mt-[clamp(3rem,8vh,6rem)] grid gap-[6vw] lg:grid-cols-[2fr_3fr] lg:items-center">
        <div className="mx-auto w-full max-w-[420px] lg:mx-0">
          <LazyYouTubeEmbed id={site.videos.featured.id} title={site.videos.featured.title} aspect="portrait" />
        </div>
        <Reveal delay={200}>
          <p className="lead">{c.lead}</p>
        </Reveal>
      </div>

      {/* La riga del territorio: foto quadrata + gradini + testo + link. */}
      <div className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-[6vw] lg:grid-cols-2 lg:items-center">
        <Parallax speed={-0.04}>
          <div className="relative aspect-square">
            <Image
              src="/images/reali/attico-tradate.jpg"
              alt={c.imageAlt}
              fill
              sizes="(max-width:1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </Parallax>
        <div>
          <Reveal>
            <span className="eyebrow">{c.subtitle}</span>
          </Reveal>
          <TextLines as="h3" className="mt-6 font-display text-d2">
            {c.stairs.join(" ")}
          </TextLines>
          <Reveal>
            <p className="lead mt-6">{c.territory}</p>
          </Reveal>
          <Reveal delay={100}>
            <Cta href="/acquista" variant="ghost" className="mt-8">
              {c.cta}
            </Cta>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
