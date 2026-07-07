"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { Star, Google, ArrowUpRight, Check } from "./Icons";
import { site } from "../lib/site";
import { reviews, reviewSummary, type ReviewCategory } from "../lib/reviews";
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
      "Ogni recensione è una storia di fiducia, cura e accompagnamento. Oltre 500 famiglie hanno vissuto un modo diverso di affrontare la vendita e l’acquisto.",
    averageOver: (count: number | string) => `Media su oltre ${count} recensioni`,
    seeAllGoogle: "Leggi tutte le recensioni su Google",
    verifiedVia: "Recensioni Google verificate tramite Trustindex.",
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
      "Every review is a story of trust, care and guidance. More than 500 families have experienced a different way to approach selling and buying.",
    averageOver: (count: number | string) => `Average across more than ${count} reviews`,
    seeAllGoogle: "Read all reviews on Google",
    verifiedVia: "Google reviews verified via Trustindex.",
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
      "Chaque avis est une histoire de confiance, d’attention et d’accompagnement. Plus de 500 familles ont vécu une autre façon d’aborder la vente et l’achat.",
    averageOver: (count: number | string) => `Moyenne sur plus de ${count} avis`,
    seeAllGoogle: "Lire tous les avis sur Google",
    verifiedVia: "Avis Google vérifiés via Trustindex.",
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
      "Jede Bewertung ist eine Geschichte von Vertrauen, Sorgfalt und Begleitung. Mehr als 500 Familien haben eine andere Art erlebt, Verkauf und Kauf anzugehen.",
    averageOver: (count: number | string) => `Durchschnitt aus über ${count} Bewertungen`,
    seeAllGoogle: "Alle Bewertungen auf Google lesen",
    verifiedVia: "Google-Bewertungen, verifiziert über Trustindex.",
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
      "Cada reseña es una historia de confianza, cuidado y acompañamiento. Más de 500 familias han vivido una forma diferente de afrontar la venta y la compra.",
    averageOver: (count: number | string) => `Media sobre más de ${count} reseñas`,
    seeAllGoogle: "Leer todas las reseñas en Google",
    verifiedVia: "Reseñas de Google verificadas mediante Trustindex.",
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
  const shown = filter === "Tutte" ? reviews : reviews.filter((r) => r.category === filter);
  // In produzione NON mostriamo mai recensioni demo come reali: le card di esempio (con nota
  // "esempi dimostrativi") compaiono solo in anteprima. Vedi docs/reviews-integration.md.
  const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW_BADGE === "true";

  // Auto-altezza del widget Trustindex: lo srcDoc misura la propria altezza e la posta al
  // parent (niente box vuoto sotto le card). Fallback iniziale contenuto, poi si adatta.
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameH, setFrameH] = useState(480);
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow) return;
      const d = e.data as { type?: string; h?: number };
      if (d?.type === "dt-ti-height" && typeof d.h === "number") {
        setFrameH(Math.max(240, Math.min(1800, Math.round(d.h))));
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <section id="recensioni" className="bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {c.title}
            </h2>
            <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-stone">
              {c.subtitle}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-[1.75rem] border border-line bg-cream p-6">
              <div className="flex items-center gap-5">
                <span className="tnum font-display text-6xl font-medium text-ink">
                  {reviewSummary.rating}
                </span>
                <div>
                  <span className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-red" />
                    ))}
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-graphite">
                    {c.averageOver(reviewSummary.count)}
                  </p>
                  <p className="flex items-center gap-1.5 text-[0.8rem] text-stone">
                    <Google className="h-3.5 w-3.5" /> Google · Trustindex · {reviewSummary.label}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[0.8rem] text-stone">{c.verifiedVia}</p>
              <a
                href={site.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 inline-flex items-center gap-2 rounded-full bg-red py-2.5 pl-5 pr-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-dark active:scale-[0.98]"
              >
                {c.seeAllGoogle}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {site.embeds.trustindexLoader ? (
          <Reveal className="mt-12">
            <h3 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              {c.realReviews}
            </h3>
            {/* Nessun box: il widget vive direttamente sulla sezione. Altezza dinamica (auto-resize)
                → niente spazio vuoto sotto le card. Loader Trustindex dentro un srcDoc UTF-8
                (charset corretto, document.currentScript valido) + script che posta l'altezza. */}
            <div className="mt-6">
              <iframe
                ref={frameRef}
                srcDoc={`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:0;background:transparent;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}</style></head><body><script src="${site.embeds.trustindexLoader}"></script><script>(function(){function p(){try{var h=document.body.scrollHeight;if(h>0)parent.postMessage({type:'dt-ti-height',h:h},'*');}catch(e){}}if(window.ResizeObserver){new ResizeObserver(p).observe(document.body);}window.addEventListener('load',p);[300,800,1500,2500,4000].forEach(function(t){setTimeout(p,t);});})();</script></body></html>`}
                title={c.iframeTitle}
                loading="lazy"
                className="w-full"
                style={{ border: 0, height: frameH }}
              />
            </div>
          </Reveal>
        ) : PREVIEW ? (
          <>
            {/* Nota onestà: finché il widget Trustindex non è collegato, queste sono demo.
                Questo ramo è raggiungibile SOLO in anteprima (NEXT_PUBLIC_PREVIEW_BADGE=true):
                in produzione non mostriamo mai recensioni demo come reali. */}
            <Reveal className="mt-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-cream px-4 py-2 text-[0.8rem] text-stone">
                <span className="h-1.5 w-1.5 rounded-full bg-red" />
                {c.demoBanner}
              </p>
            </Reveal>
            {/* Filtri categoria */}
            <Reveal className="mt-6">
              <div className="flex flex-wrap gap-2">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                      filter === f
                        ? "border-red bg-red text-white hover:bg-red-dark"
                        : "border-line bg-paper text-graphite hover:border-red/40 hover:text-ink"
                    }`}
                  >
                    {c.filterLabels[f]}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* Griglia recensioni */}
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 80} className={i === 0 ? "lg:col-span-2" : ""}>
                  <figure
                    className={`flex h-full flex-col rounded-[1.75rem] border border-line p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:border-red/30 hover:shadow-[var(--shadow-card-hover)] ${
                      i === 0 ? "bg-cream-deep sm:p-8" : "bg-cream"
                    }`}
                  >
                    {/* header: fonte + rating */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[0.78rem] font-semibold text-graphite">
                        {r.source === "Google" ? (
                          <Google className="h-4 w-4" />
                        ) : (
                          <Star className="h-3.5 w-3.5 text-red" />
                        )}
                        {c.reviewFrom(r.source)}
                      </span>
                      <span className="flex gap-0.5" aria-label={c.outOf5(r.rating)}>
                        {Array.from({ length: r.rating }).map((_, k) => (
                          <Star key={k} className="h-3.5 w-3.5 text-red" />
                        ))}
                      </span>
                    </div>

                    <blockquote
                      className={`mt-4 flex-1 leading-relaxed text-graphite ${
                        i === 0 ? "font-display text-xl sm:text-2xl" : "text-[0.96rem]"
                      }`}
                    >
                      “{r.text}”
                    </blockquote>

                    <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-cream-deep font-display text-base font-semibold text-graphite ring-1 ring-inset ring-line ${
                          i === 0 ? "sm:h-12 sm:w-12 sm:text-lg" : ""
                        }`}
                      >
                        {r.name.charAt(0)}
                      </span>
                      <span className="flex-1 leading-tight">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                          {r.name}
                          {r.verified && (
                            <span
                              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red text-white"
                              title={c.verifiedReview}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </span>
                        <span className="block text-[0.8rem] text-stone">
                          {r.place} · {formatDate(r.date, locale)}
                        </span>
                      </span>
                      {r.source === "Google" && (
                        <a
                          href={site.googleReviewsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[0.72rem] font-semibold text-red-dark underline-offset-2 hover:underline"
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
          /* Produzione senza widget: nessuna recensione demo, solo prova reale (rating + Google). */
          <Reveal className="mt-10">
            <div className="rounded-[1.75rem] border border-line bg-cream p-8 text-center">
              <p className="mx-auto max-w-md text-[0.98rem] leading-relaxed text-graphite">
                {c.verifiedVia}
              </p>
              <a
                href={site.googleReviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-dark active:scale-[0.98]"
              >
                {c.seeAllGoogle}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
