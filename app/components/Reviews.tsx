"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { Star, Google, Check } from "./Icons";
import { Cta } from "./primitives/Cta";
import TrustindexEmbed from "./TrustindexEmbed";
import { ratingLabel, site } from "../lib/site";
import { nativeReviews, hasApprovedNativeReviews, reviewSummary, type ReviewCategory } from "../lib/reviews";
import { useConsent } from "../lib/consent";
import { useLocale } from "./i18n/LocaleProvider";

const filters: ("Tutte" | ReviewCategory)[] = [
  "Tutte",
  "Venditori",
  "Acquirenti",
  "Open Domus",
  "Esperienza",
];

const copy = {
  it: {
    eyebrow: "Recensioni",
    title: "Lo raccontano le persone che hanno scelto Domus Tua.",
    subtitle:
      `Ogni recensione è una storia di fiducia, cura e accompagnamento. Su Google ne trovi ${site.reviewsCount}, e raccontano un modo diverso di affrontare la vendita e l’acquisto.`,
    averageOver: (count: number | string) => `Media su oltre ${count} recensioni`,
    seeAllGoogle: "Leggi tutte le recensioni su Google",
    verifiedVia: "Recensioni Google verificate tramite Trustindex.",
    consentGate:
      "Il widget delle recensioni è di Trustindex: si carica solo dopo il tuo consenso ai cookie. Puoi leggerle subito su Google.",
    realReviews: "Le recensioni reali dei nostri clienti",
    iframeTitle: "Recensioni Google verificate di Domus Tua (Trustindex)",
    demoBanner:
      "Esempi dimostrativi: le recensioni reali di Google/Trustindex verranno collegate al lancio.",
    reviewFrom: (source: string) => `Recensione ${source}`,
    outOf5: (rating: number | string) => `${rating} su 5`,
    verifiedReview: "Recensione verificata",
    readOnGoogle: "Leggi su Google",
    filterLabels: {
      Tutte: "Tutte",
      Venditori: "Venditori",
      Acquirenti: "Acquirenti",
      "Open Domus": "Open Domus",
      Esperienza: "Esperienza",
    } as Record<(typeof filters)[number], string>,
  },
  en: {
    eyebrow: "Reviews",
    title: "Told by the people who chose Domus Tua.",
    subtitle:
      `Every review is a story of trust, care and guidance. There are ${site.reviewsCount} of them on Google, describing a different way to approach selling and buying.`,
    averageOver: (count: number | string) => `Average across more than ${count} reviews`,
    seeAllGoogle: "Read all reviews on Google",
    verifiedVia: "Google reviews verified via Trustindex.",
    consentGate:
      "The reviews widget is provided by Trustindex: it loads only after you accept cookies. You can read the reviews on Google right away.",
    realReviews: "Real reviews from our clients",
    iframeTitle: "Verified Google reviews of Domus Tua (Trustindex)",
    demoBanner:
      "Demonstrative examples: the real Google/Trustindex reviews will be connected at launch.",
    reviewFrom: (source: string) => `${source} review`,
    outOf5: (rating: number | string) => `${rating} out of 5`,
    verifiedReview: "Verified review",
    readOnGoogle: "Read on Google",
    filterLabels: {
      Tutte: "All",
      Venditori: "Sellers",
      Acquirenti: "Buyers",
      "Open Domus": "Open Domus",
      Esperienza: "Experience",
    } as Record<(typeof filters)[number], string>,
  },
  fr: {
    eyebrow: "Avis",
    title: "Racontés par ceux qui ont choisi Domus Tua.",
    subtitle:
      `Chaque avis est une histoire de confiance, d’attention et d’accompagnement. Il y en a ${site.reviewsCount} sur Google, et ils racontent une autre façon d’aborder la vente et l’achat.`,
    averageOver: (count: number | string) => `Moyenne sur plus de ${count} avis`,
    seeAllGoogle: "Lire tous les avis sur Google",
    verifiedVia: "Avis Google vérifiés via Trustindex.",
    consentGate:
      "Le widget d’avis est fourni par Trustindex : il ne se charge qu’après votre consentement aux cookies. Vous pouvez lire les avis sur Google dès maintenant.",
    realReviews: "Les avis authentiques de nos clients",
    iframeTitle: "Avis Google vérifiés de Domus Tua (Trustindex)",
    demoBanner:
      "Exemples de démonstration : les vrais avis Google/Trustindex seront connectés au lancement.",
    reviewFrom: (source: string) => `Avis ${source}`,
    outOf5: (rating: number | string) => `${rating} sur 5`,
    verifiedReview: "Avis vérifié",
    readOnGoogle: "Lire sur Google",
    filterLabels: {
      Tutte: "Tous",
      Venditori: "Vendeurs",
      Acquirenti: "Acheteurs",
      "Open Domus": "Open Domus",
      Esperienza: "Expérience",
    } as Record<(typeof filters)[number], string>,
  },
  de: {
    eyebrow: "Bewertungen",
    title: "Erzählt von den Menschen, die sich für Domus Tua entschieden haben.",
    subtitle:
      `Jede Bewertung ist eine Geschichte von Vertrauen, Sorgfalt und Begleitung. Auf Google sind es ${site.reviewsCount}, und sie zeigen eine andere Art, Verkauf und Kauf anzugehen.`,
    averageOver: (count: number | string) => `Durchschnitt aus über ${count} Bewertungen`,
    seeAllGoogle: "Alle Bewertungen auf Google lesen",
    verifiedVia: "Google-Bewertungen, verifiziert über Trustindex.",
    consentGate:
      "Das Bewertungs-Widget stammt von Trustindex: Es lädt erst nach Ihrer Cookie-Einwilligung. Die Bewertungen können Sie sofort auf Google lesen.",
    realReviews: "Die echten Bewertungen unserer Kunden",
    iframeTitle: "Verifizierte Google-Bewertungen von Domus Tua (Trustindex)",
    demoBanner:
      "Beispielhafte Darstellung: Die echten Google-/Trustindex-Bewertungen werden zum Launch verbunden.",
    reviewFrom: (source: string) => `${source}-Bewertung`,
    outOf5: (rating: number | string) => `${rating} von 5`,
    verifiedReview: "Verifizierte Bewertung",
    readOnGoogle: "Auf Google lesen",
    filterLabels: {
      Tutte: "Alle",
      Venditori: "Verkäufer",
      Acquirenti: "Käufer",
      "Open Domus": "Open Domus",
      Esperienza: "Erfahrung",
    } as Record<(typeof filters)[number], string>,
  },
  es: {
    eyebrow: "Reseñas",
    title: "Lo cuentan las personas que han elegido Domus Tua.",
    subtitle:
      `Cada reseña es una historia de confianza, cuidado y acompañamiento. En Google hay ${site.reviewsCount}, y cuentan una forma diferente de afrontar la venta y la compra.`,
    averageOver: (count: number | string) => `Media sobre más de ${count} reseñas`,
    seeAllGoogle: "Leer todas las reseñas en Google",
    verifiedVia: "Reseñas de Google verificadas mediante Trustindex.",
    consentGate:
      "El widget de reseñas es de Trustindex: se carga solo tras tu consentimiento de cookies. Puedes leer las reseñas en Google ahora mismo.",
    realReviews: "Las reseñas reales de nuestros clientes",
    iframeTitle: "Reseñas de Google verificadas de Domus Tua (Trustindex)",
    demoBanner:
      "Ejemplos demostrativos: las reseñas reales de Google/Trustindex se conectarán en el lanzamiento.",
    reviewFrom: (source: string) => `Reseña de ${source}`,
    outOf5: (rating: number | string) => `${rating} de 5`,
    verifiedReview: "Reseña verificada",
    readOnGoogle: "Leer en Google",
    filterLabels: {
      Tutte: "Todas",
      Venditori: "Vendedores",
      Acquirenti: "Compradores",
      "Open Domus": "Open Domus",
      Esperienza: "Experiencia",
    } as Record<(typeof filters)[number], string>,
  },
};

function formatDate(iso: string, locale: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(locale === "en" ? "en-GB" : locale, { month: "long", year: "numeric" });
}

export default function Reviews() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tutte");
  // In produzione NON mostriamo mai recensioni demo come reali: `nativeReviews`
  // torna le APPROVATE (oggi nessuna) o, solo in anteprima, le demo — mai
  // fabbricate. Vedi app/lib/reviews.ts e docs/reviews-integration.md.
  const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_BADGE === "true";
  const native = nativeReviews({ preview: PREVIEW });
  const shown = filter === "Tutte" ? native : native.filter((r) => r.category === filter);
  // Le card mostrate sono demo (da etichettare) o approvate (reali, prima parte)?
  const showingDemo = native.length > 0 && !hasApprovedNativeReviews;

  // GATE DI CONSENSO. Trustindex è un terzo che carica script e cookie propri: prima del
  // consolidamento l'iframe partiva al primo render, cioè PRIMA di qualsiasi scelta
  // dell'utente. Ora il widget si monta solo con consenso "accepted" (unica implementazione:
  // app/lib/consent.ts, la stessa che scrive il banner). Senza consenso resta la prova reale
  // e non demo: voto, media e link diretto a Google.
  const consent = useConsent();
  const showTrustindex = site.embeds.trustindexLoader.length > 0 && consent === "accepted";
  const awaitingConsent = site.embeds.trustindexLoader.length > 0 && consent !== "accepted";
  // Le recensioni approvate sono di prima parte (nessun cookie): si mostrano
  // anche se il consenso a Trustindex è negato — negarlo non deve nascondere le
  // NOSTRE recensioni. Le demo, invece, restano fuori dallo stato "attesa
  // consenso" (lì la pagina mostra la prova reale: voto + link a Google).
  const showNativeCards = shown.length > 0 && (hasApprovedNativeReviews || !awaitingConsent);

  return (
    <section id="recensioni" className="dt-chapter relative bg-cream">
      <div className="dt-row relative">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16">
          {/* Reveal spezzato in due: il titolo TextLines resta nudo (niente doppio-hide) */}
          <div>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <TextLines as="h2" className="mt-6 max-w-[20ch] font-display text-d1">
              {c.title}
            </TextLines>
            <Reveal delay={100}>
              <p className="lead mt-8">{c.subtitle}</p>
            </Reveal>
          </div>

          {/* Riepilogo del voto: testo su hairline, niente card né contatore (2026-09-10).
              Il voto arriva da site.rating (localizzato da ratingLabel), il conteggio da
              reviewSummary: nessun numero scritto a mano. */}
          <Reveal delay={100}>
            <div className="border-t border-line pt-6">
              <p className="tnum font-display text-d1 text-ink">{ratingLabel(locale)}/5</p>
              {/* Oro: è il voto, non il marchio (vedi globals.css) */}
              <span className="mt-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-gold" />
                ))}
              </span>
              <p className="mt-4 text-body font-medium text-graphite">{c.averageOver(reviewSummary.count)}</p>
              <p className="mt-1 flex items-center gap-2 text-ui text-stone">
                <Google className="h-4 w-4" /> Google · Trustindex · {reviewSummary.label}
              </p>
              <p className="mt-4 text-ui text-stone">{c.verifiedVia}</p>
              <Cta
                href={site.googleReviewsUrl}
                variant="ghost"
                size="md"
                className="mt-6"
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.seeAllGoogle}
              </Cta>
            </div>
          </Reveal>
        </div>

        {showTrustindex ? (
          <Reveal className="mt-16 border-t border-line pt-10">
            <h3 className="font-display text-d2">{c.realReviews}</h3>
            {/* Nessun box: il widget vive direttamente sulla sezione (iframe
                estratto in TrustindexEmbed, condiviso col capitolo stelle). */}
            <div className="mt-8">
              <TrustindexEmbed title={c.iframeTitle} />
            </div>
          </Reveal>
        ) : showNativeCards ? (
          <>
            {/* Nota onestà: quando le card sono DEMO (nessuna recensione nativa
                approvata) va sempre detto. In produzione le demo non arrivano
                mai qui (nativeReviews torna []); l'etichetta è la cintura in più. */}
            {showingDemo ? (
              <Reveal className="mt-14">
                <p className="border-t border-line pt-5 text-ui font-semibold uppercase tracking-[0.08em] text-stone">
                  {c.demoBanner}
                </p>
              </Reveal>
            ) : null}
            {/* Filtri categoria */}
            <Reveal className="mt-8">
              {/* Filtri come link maiuscoli sottolineati: il selezionato è rosso. */}
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`tap-target min-h-11 text-ui font-semibold uppercase tracking-[0.08em] underline-offset-4 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                      filter === f ? "text-red underline" : "text-graphite hover:text-ink"
                    }`}
                  >
                    {c.filterLabels[f]}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* Griglia recensioni */}
            {/* Voci separate da hairline: niente card, niente ombre (2026-09-10). */}
            <div className="mt-10 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 80} className={i === 0 ? "lg:col-span-2" : ""}>
                  <figure className="flex h-full flex-col border-t border-line py-8">
                    {/* header: fonte + rating */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-ui font-semibold uppercase tracking-[0.08em] text-graphite">
                        {r.source === "Google" ? (
                          <Google className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4 text-red" />
                        )}
                        {c.reviewFrom(r.source)}
                      </span>
                      <span className="flex gap-0.5" aria-label={c.outOf5(r.rating)}>
                        {Array.from({ length: r.rating }).map((_, k) => (
                          <Star key={k} className="h-4 w-4 text-gold" />
                        ))}
                      </span>
                    </div>

                    <blockquote
                      className={`mt-5 flex-1 text-graphite ${
                        i === 0 ? "font-display text-d3" : "text-body"
                      }`}
                    >
                      “{r.text}”
                    </blockquote>

                    <figcaption className="mt-6 flex items-center gap-4 border-t border-line pt-5">
                      <span className="flex-1 leading-tight">
                        <span className="flex items-center gap-2 text-ui font-semibold uppercase tracking-[0.08em] text-ink">
                          {r.name}
                          {/* Il bollino "verificata" è SOLO per le recensioni
                              approvate reali: una demo non può portarlo (prima il
                              vecchio `verified:true` glielo dava, sembrando vera). */}
                          {r.status === "approved" && (
                            <span className="flex h-4 w-4 items-center justify-center text-red" title={c.verifiedReview}>
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-ui text-stone">
                          {r.place} · {formatDate(r.date, locale)}
                        </span>
                      </span>
                      {r.source === "Google" && (
                        <a
                          href={site.googleReviewsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-ui font-semibold uppercase tracking-[0.08em] text-red-dark underline underline-offset-4"
                        >
                          {c.readOnGoogle}
                        </a>
                      )}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          /* Nessun widget montato — perché non è collegato oppure perché manca il consenso.
             In entrambi i casi: nessuna recensione demo, solo prova reale (rating + Google). */
          <Reveal className="mt-14">
            <div className="border-t border-line pt-8">
              <p className="lead">{awaitingConsent ? c.consentGate : c.verifiedVia}</p>
              <Cta
                href={site.googleReviewsUrl}
                variant="cta"
                size="md"
                className="mt-8"
                target="_blank"
                rel="noopener noreferrer"
              >
                {c.seeAllGoogle}
              </Cta>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
