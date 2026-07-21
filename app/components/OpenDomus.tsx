"use client";

// OpenDomus — il caso studio firma di Domus Tua (Prompt 6).
// Esperienza scroll-led in 4 capitoli (Prima → Preparazione → Open Domus → Risultato) con
// un pannello visivo STICKY su desktop (niente scroll-hijacking: solo position:sticky +
// IntersectionObserver) e una narrazione verticale pulita su mobile. Indicatore di avanzamento
// nel linguaggio Segno Domus. Contenuti e metriche da config tipizzata (app/lib/openDomusCase):
// le metriche numeriche si mostrano SOLO se verificate; altrimenti storia qualitativa.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "./Reveal";
import LazyYouTubeEmbed from "./LazyYouTubeEmbed";
import { ArrowUpRight, ArrowRight } from "./Icons";
import { SegnoDomus } from "./BrandMotif";
import {
  openDomusCase,
  openDomusChapterKeys,
  verifiedOpenDomusMetrics,
  type OpenDomusChapterKey,
  type CaseMetricKey,
} from "../lib/openDomusCase";
import { useLocale } from "./i18n/LocaleProvider";

type ChapterCopy = { tag: string; title: string; body: string; alt: string };

const copy = {
  it: {
    eyebrow: "Il caso Open Domus",
    title: "Una casa, quattro capitoli. La storia di un Open Domus.",
    intro:
      "Open Domus non è una visita: è un percorso preparato. Ecco come lo viviamo, dalla prima stima alla firma — raccontato passo dopo passo.",
    chapters: {
      prima: {
        tag: "Prima",
        title: "La casa e la sfida di chi vende.",
        body: "Un immobile con grande potenziale ma raccontato male: foto deboli, documenti da mettere in ordine e un prezzo da definire con lucidità. Il punto di partenza, senza filtri.",
        alt: "L'immobile prima della preparazione Domus Tua",
      },
      preparazione: {
        tag: "Preparazione",
        title: "Documenti, immagine e campagna.",
        body: "Verifica documentale, home staging dove serve, servizio fotografico e video emozionale, poi una campagna multicanale con anteprima social. La casa è pronta a farsi vedere al suo valore reale.",
        alt: "La fase di preparazione: consulenza e documenti verificati",
      },
      evento: {
        tag: "Open Domus",
        title: "L'evento e i visitatori qualificati.",
        body: "Un solo giorno, visite ordinate e acquirenti prequalificati. Accoglienza curata, documentazione a disposizione, feedback raccolti sul momento. Nessun caos: solo persone davvero interessate.",
        alt: "L'evento Open Domus con visitatori qualificati",
      },
      risultato: {
        tag: "Risultato",
        title: "L'esito e la voce del cliente.",
        body: "Proposte concrete e una trattativa più solida, fino alla firma. Ma il risultato migliore lo raccontano i clienti: la loro storia, con parole loro.",
        alt: "La consegna delle chiavi: la vendita conclusa",
      },
    } satisfies Record<OpenDomusChapterKey, ChapterCopy>,
    metricLabels: {
      preparationDays: "giorni di preparazione",
      reach: "persone raggiunte",
      attendees: "presenze all'evento",
      qualifiedVisits: "visite qualificate",
      offers: "proposte ricevute",
      daysToAgreement: "giorni fino all'accordo",
    } satisfies Record<CaseMetricKey, string>,
    storyCaption: openDomusCase.story.title,
    progress: "Il percorso",
    ctaSeller: "Voglio un Open Domus per la mia casa",
    ctaFull: "Come funziona Open Domus",
  },
  en: {
    eyebrow: "The Open Domus case",
    title: "One home, four chapters. The story of an Open Domus.",
    intro:
      "Open Domus isn't a viewing: it's a prepared journey. Here's how we run it, from the first estimate to the signing — told step by step.",
    chapters: {
      prima: {
        tag: "Before",
        title: "The home and the seller's challenge.",
        body: "A property with great potential but poorly told: weak photos, documents to sort out and a price to set with clarity. The starting point, unfiltered.",
        alt: "The property before Domus Tua's preparation",
      },
      preparazione: {
        tag: "Preparation",
        title: "Documents, image and campaign.",
        body: "Document checks, home staging where needed, a photo shoot and an emotional video, then a multichannel campaign with a social preview. The home is ready to be seen at its true value.",
        alt: "The preparation stage: consultation and verified documents",
      },
      evento: {
        tag: "Open Domus",
        title: "The event and qualified visitors.",
        body: "A single day, orderly viewings and pre-qualified buyers. Cared-for hospitality, documentation on hand, feedback gathered on the spot. No chaos: only genuinely interested people.",
        alt: "The Open Domus event with qualified visitors",
      },
      risultato: {
        tag: "Result",
        title: "The outcome and the client's voice.",
        body: "Concrete offers and a stronger negotiation, all the way to signing. But the best result is told by the clients: their story, in their own words.",
        alt: "Handing over the keys: the sale closed",
      },
    } satisfies Record<OpenDomusChapterKey, ChapterCopy>,
    metricLabels: {
      preparationDays: "days of preparation",
      reach: "people reached",
      attendees: "event attendees",
      qualifiedVisits: "qualified visits",
      offers: "offers received",
      daysToAgreement: "days to agreement",
    } satisfies Record<CaseMetricKey, string>,
    storyCaption: openDomusCase.story.title,
    progress: "The journey",
    ctaSeller: "I want an Open Domus for my home",
    ctaFull: "How Open Domus works",
  },
  fr: {
    eyebrow: "Le cas Open Domus",
    title: "Une maison, quatre chapitres. L'histoire d'un Open Domus.",
    intro:
      "Open Domus n'est pas une visite : c'est un parcours préparé. Voici comment nous le vivons, de la première estimation à la signature — raconté étape par étape.",
    chapters: {
      prima: {
        tag: "Avant",
        title: "Le bien et le défi du vendeur.",
        body: "Un bien à fort potentiel mais mal raconté : photos faibles, documents à mettre en ordre et prix à définir avec lucidité. Le point de départ, sans filtre.",
        alt: "Le bien avant la préparation Domus Tua",
      },
      preparazione: {
        tag: "Préparation",
        title: "Documents, image et campagne.",
        body: "Vérification documentaire, home staging si nécessaire, shooting photo et vidéo émotionnelle, puis une campagne multicanale avec aperçu social. La maison est prête à se montrer à sa vraie valeur.",
        alt: "La phase de préparation : conseil et documents vérifiés",
      },
      evento: {
        tag: "Open Domus",
        title: "L'événement et les visiteurs qualifiés.",
        body: "Une seule journée, des visites ordonnées et des acquéreurs préqualifiés. Un accueil soigné, la documentation à disposition, les retours recueillis sur place. Aucun chaos : seulement des personnes vraiment intéressées.",
        alt: "L'événement Open Domus avec des visiteurs qualifiés",
      },
      risultato: {
        tag: "Résultat",
        title: "Le résultat et la voix du client.",
        body: "Des offres concrètes et une négociation plus solide, jusqu'à la signature. Mais le meilleur résultat, ce sont les clients qui le racontent : leur histoire, avec leurs mots.",
        alt: "La remise des clés : la vente conclue",
      },
    } satisfies Record<OpenDomusChapterKey, ChapterCopy>,
    metricLabels: {
      preparationDays: "jours de préparation",
      reach: "personnes touchées",
      attendees: "présents à l'événement",
      qualifiedVisits: "visites qualifiées",
      offers: "offres reçues",
      daysToAgreement: "jours jusqu'à l'accord",
    } satisfies Record<CaseMetricKey, string>,
    storyCaption: openDomusCase.story.title,
    progress: "Le parcours",
    ctaSeller: "Je veux un Open Domus pour mon bien",
    ctaFull: "Comment fonctionne Open Domus",
  },
  de: {
    eyebrow: "Der Open-Domus-Fall",
    title: "Ein Zuhause, vier Kapitel. Die Geschichte eines Open Domus.",
    intro:
      "Open Domus ist keine Besichtigung: Es ist ein vorbereiteter Weg. So erleben wir ihn, von der ersten Schätzung bis zur Unterschrift — Schritt für Schritt erzählt.",
    chapters: {
      prima: {
        tag: "Vorher",
        title: "Die Immobilie und die Herausforderung des Verkäufers.",
        body: "Eine Immobilie mit großem Potenzial, aber schlecht präsentiert: schwache Fotos, zu ordnende Unterlagen und ein Preis, der klar festzulegen ist. Der Ausgangspunkt, ungeschönt.",
        alt: "Die Immobilie vor der Vorbereitung durch Domus Tua",
      },
      preparazione: {
        tag: "Vorbereitung",
        title: "Unterlagen, Bild und Kampagne.",
        body: "Dokumentenprüfung, Home Staging wo nötig, Fotoshooting und emotionales Video, dann eine Multikanal-Kampagne mit Social-Vorschau. Das Zuhause ist bereit, sich in seinem wahren Wert zu zeigen.",
        alt: "Die Vorbereitungsphase: Beratung und geprüfte Unterlagen",
      },
      evento: {
        tag: "Open Domus",
        title: "Das Event und die qualifizierten Besucher.",
        body: "Ein einziger Tag, geordnete Besichtigungen und vorqualifizierte Käufer. Gepflegter Empfang, Unterlagen zur Hand, Feedback direkt gesammelt. Kein Chaos: nur wirklich Interessierte.",
        alt: "Das Open-Domus-Event mit qualifizierten Besuchern",
      },
      risultato: {
        tag: "Ergebnis",
        title: "Das Ergebnis und die Stimme des Kunden.",
        body: "Konkrete Angebote und eine solidere Verhandlung, bis zur Unterschrift. Aber das beste Ergebnis erzählen die Kunden: ihre Geschichte, in ihren Worten.",
        alt: "Die Schlüsselübergabe: der Verkauf abgeschlossen",
      },
    } satisfies Record<OpenDomusChapterKey, ChapterCopy>,
    metricLabels: {
      preparationDays: "Tage Vorbereitung",
      reach: "erreichte Personen",
      attendees: "Teilnehmer am Event",
      qualifiedVisits: "qualifizierte Besichtigungen",
      offers: "erhaltene Angebote",
      daysToAgreement: "Tage bis zur Einigung",
    } satisfies Record<CaseMetricKey, string>,
    storyCaption: openDomusCase.story.title,
    progress: "Der Weg",
    ctaSeller: "Ich möchte ein Open Domus für mein Zuhause",
    ctaFull: "So funktioniert Open Domus",
  },
  es: {
    eyebrow: "El caso Open Domus",
    title: "Una casa, cuatro capítulos. La historia de un Open Domus.",
    intro:
      "Open Domus no es una visita: es un recorrido preparado. Así lo vivimos, desde la primera tasación hasta la firma — contado paso a paso.",
    chapters: {
      prima: {
        tag: "Antes",
        title: "La casa y el reto de quien vende.",
        body: "Un inmueble con gran potencial pero mal contado: fotos flojas, documentos por ordenar y un precio por definir con lucidez. El punto de partida, sin filtros.",
        alt: "El inmueble antes de la preparación de Domus Tua",
      },
      preparazione: {
        tag: "Preparación",
        title: "Documentos, imagen y campaña.",
        body: "Verificación documental, home staging donde hace falta, sesión de fotos y vídeo emotivo, y luego una campaña multicanal con anticipo social. La casa está lista para mostrarse a su valor real.",
        alt: "La fase de preparación: asesoramiento y documentos verificados",
      },
      evento: {
        tag: "Open Domus",
        title: "El evento y los visitantes cualificados.",
        body: "Un solo día, visitas ordenadas y compradores precualificados. Acogida cuidada, documentación disponible, comentarios recogidos en el momento. Sin caos: solo personas realmente interesadas.",
        alt: "El evento Open Domus con visitantes cualificados",
      },
      risultato: {
        tag: "Resultado",
        title: "El desenlace y la voz del cliente.",
        body: "Ofertas concretas y una negociación más sólida, hasta la firma. Pero el mejor resultado lo cuentan los clientes: su historia, con sus palabras.",
        alt: "La entrega de las llaves: la venta cerrada",
      },
    } satisfies Record<OpenDomusChapterKey, ChapterCopy>,
    metricLabels: {
      preparationDays: "días de preparación",
      reach: "personas alcanzadas",
      attendees: "asistentes al evento",
      qualifiedVisits: "visitas cualificadas",
      offers: "ofertas recibidas",
      daysToAgreement: "días hasta el acuerdo",
    } satisfies Record<CaseMetricKey, string>,
    storyCaption: openDomusCase.story.title,
    progress: "El recorrido",
    ctaSeller: "Quiero un Open Domus para mi casa",
    ctaFull: "Cómo funciona Open Domus",
  },
};

export default function OpenDomus() {
  const { locale } = useLocale();
  const c = copy[locale];
  const keys = openDomusChapterKeys;
  const metrics = verifiedOpenDomusMetrics();

  const [active, setActive] = useState(0);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  // Capitolo attivo = quello che attraversa il centro dello schermo. Nessuno scroll-hijacking:
  // scroll nativo + position:sticky + IntersectionObserver (solo aggiornamento di stato).
  useEffect(() => {
    const els = chapterRefs.current.filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const goTo = (idx: number) => {
    chapterRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="open-domus" className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
        {/* Intestazione */}
        <Reveal className="max-w-2xl">
          <span className="eyebrow">{c.eyebrow}</span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
            {c.title}
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-stone sm:text-lg">{c.intro}</p>
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          {/* Pannello visivo STICKY (desktop) — immagini in crossfade per capitolo + progresso */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-line bg-cream">
                {keys.map((k, i) => (
                  <Image
                    key={k}
                    src={openDomusCase.media[k]}
                    alt={c.chapters[k].alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className={`object-cover transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                      active === i ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
                {/* Tag capitolo attivo */}
                <span className="absolute left-5 top-5 rounded-full bg-paper/90 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-red-dark backdrop-blur-sm">
                  {c.chapters[keys[active]!].tag}
                </span>
              </div>

              {/* Indicatore di avanzamento — linguaggio Segno Domus */}
              <div className="mt-6">
                <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-stone">
                  {c.progress}
                </p>
                <ol className="flex flex-col gap-1">
                  {keys.map((k, i) => {
                    const done = i <= active;
                    return (
                      <li key={k}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          aria-current={active === i ? "step" : undefined}
                          className="group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-300 hover:bg-cream-deep"
                        >
                          <span
                            className={`flex h-7 w-9 shrink-0 items-center justify-center transition-colors duration-500 ${
                              done ? "text-red" : "text-line"
                            }`}
                          >
                            <SegnoDomus className="h-3 w-8" embrace={active === i} />
                          </span>
                          <span
                            className={`text-sm transition-colors duration-300 ${
                              active === i ? "font-semibold text-ink" : done ? "text-graphite" : "text-stone"
                            }`}
                          >
                            <span className="tnum tabular-nums text-red-dark">{String(i + 1).padStart(2, "0")}</span>{" "}
                            {c.chapters[k].tag}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>

          {/* Capitoli */}
          <div className="flex flex-col gap-14 lg:gap-24">
            {keys.map((k, i) => {
              const ch = c.chapters[k];
              const isLast = i === keys.length - 1;
              return (
                <article
                  key={k}
                  ref={(el) => {
                    chapterRefs.current[i] = el;
                  }}
                  data-idx={i}
                  className="scroll-mt-28"
                >
                  {/* Immagine inline (solo mobile: desktop usa il pannello sticky) */}
                  <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-line lg:hidden">
                    <Image
                      src={openDomusCase.media[k]}
                      alt={ch.alt}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-red-dark backdrop-blur-sm">
                      {String(i + 1).padStart(2, "0")} · {ch.tag}
                    </span>
                  </div>

                  <Reveal>
                    <p className="hidden items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-red-dark lg:flex">
                      <SegnoDomus className="h-2.5 w-7" embrace={false} />
                      {String(i + 1).padStart(2, "0")} · {ch.tag}
                    </p>
                    <h3 className="mt-3 font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-3xl">
                      {ch.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-stone">{ch.body}</p>

                    {/* Ultimo capitolo: metriche verificate (se presenti) + video testimonianza reale */}
                    {isLast && (
                      <>
                        {metrics.length > 0 && (
                          <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                            {metrics.map((m) => (
                              <div key={m.key}>
                                <dt className="font-display text-3xl font-medium leading-none text-red">
                                  {m.value}
                                </dt>
                                <dd className="mt-1.5 text-[0.82rem] leading-snug text-stone">
                                  {c.metricLabels[m.key]}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}

                        <figure className="mt-8">
                          <LazyYouTubeEmbed
                            id={openDomusCase.story.id}
                            title={openDomusCase.story.title}
                          />
                          <figcaption className="mt-3 text-sm text-stone">{c.storyCaption}</figcaption>
                        </figure>
                      </>
                    )}
                  </Reveal>
                </article>
              );
            })}
          </div>
        </div>

        {/* CTA venditore + link alla pagina completa */}
        <Reveal className="mt-14 flex flex-col items-start gap-4 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="#contatti"
            className="group inline-flex items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-cream transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
          >
            {c.ctaSeller}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </a>
          <Link
            href="/open-domus"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
          >
            {c.ctaFull}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
