"use client";

import Reveal from "./Reveal";
import { SegnoDomus } from "./BrandMotif";
import { Check, ArrowUpRight, Star } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Protocollo proprietario",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Non una promessa, ma un metodo verificabile: prepariamo, controlliamo e rendiamo chiaro ogni passaggio, così vendere è più sereno e acquistare è più sicuro.",
    sellerLabel: "Per chi vende",
    sellerText:
      "Un immobile pronto, documentato e credibile: più fiducia, proposte più qualificate.",
    buyerLabel: "Per chi acquista",
    buyerText:
      "Più informazioni e meno sorprese: si visita e si sceglie con consapevolezza.",
    cta: "Scopri il protocollo",
    pillars: [
      { t: "Verifica documentale", d: "Titoli, conformità e documenti controllati prima di mettere in vendita." },
      { t: "Trasparenza pre-visita", d: "Le informazioni che contano disponibili già prima di entrare in casa." },
      { t: "Immobile preparato", d: "Spazi valorizzati e raccontati con materiali professionali." },
      { t: "Meno sorprese al rogito", d: "Un percorso ordinato che riduce imprevisti e tempi morti." },
    ],
    footnote: "Protocollo applicato a ogni incarico Domus Tua.",
  },
  en: {
    eyebrow: "Proprietary protocol",
    subtitle: "Domus of Certified Origin",
    intro:
      "Not a promise, but a verifiable method: we prepare, check and make every step clear, so selling feels calmer and buying feels more secure.",
    sellerLabel: "For sellers",
    sellerText:
      "A property that is ready, documented and credible: more trust, more qualified offers.",
    buyerLabel: "For buyers",
    buyerText:
      "More information and fewer surprises: you view the property and choose with complete confidence.",
    cta: "Discover the protocol",
    pillars: [
      { t: "Document verification", d: "Titles, compliance and documents checked before listing." },
      { t: "Pre-visit transparency", d: "The information that matters, available before you even step inside." },
      { t: "Prepared property", d: "Spaces enhanced and presented with professional materials." },
      { t: "Fewer surprises at closing", d: "An orderly process that reduces the unexpected and wasted time." },
    ],
    footnote: "A protocol applied to every Domus Tua mandate.",
  },
  fr: {
    eyebrow: "Protocole propriétaire",
    subtitle: "Domus d'Origine Certifiée",
    intro:
      "Non pas une promesse, mais une méthode vérifiable : nous préparons, contrôlons et rendons chaque étape claire, pour vendre plus sereinement et acheter en toute sécurité.",
    sellerLabel: "Pour les vendeurs",
    sellerText:
      "Un bien prêt, documenté et crédible : plus de confiance, des offres plus qualifiées.",
    buyerLabel: "Pour les acquéreurs",
    buyerText:
      "Plus d'informations et moins de surprises : on visite et on choisit en toute connaissance de cause.",
    cta: "Découvrir le protocole",
    pillars: [
      { t: "Vérification documentaire", d: "Titres, conformité et documents contrôlés avant la mise en vente." },
      { t: "Transparence avant visite", d: "Les informations essentielles disponibles avant même d'entrer dans le logement." },
      { t: "Bien préparé", d: "Des espaces valorisés et présentés avec des supports professionnels." },
      { t: "Moins de surprises à l'acte", d: "Un parcours ordonné qui réduit les imprévus et les temps morts." },
    ],
    footnote: "Un protocole appliqué à chaque mandat Domus Tua.",
  },
  de: {
    eyebrow: "Eigenes Protokoll",
    subtitle: "Domus mit zertifizierter Herkunft",
    intro:
      "Kein Versprechen, sondern eine überprüfbare Methode: Wir bereiten vor, prüfen und machen jeden Schritt transparent – so wird Verkaufen entspannter und Kaufen sicherer.",
    sellerLabel: "Für Verkäufer",
    sellerText:
      "Eine Immobilie, die bereit, dokumentiert und glaubwürdig ist: mehr Vertrauen, qualifiziertere Angebote.",
    buyerLabel: "Für Käufer",
    buyerText:
      "Mehr Informationen und weniger Überraschungen: Sie besichtigen und entscheiden mit gutem Gefühl.",
    cta: "Das Protokoll entdecken",
    pillars: [
      { t: "Dokumentenprüfung", d: "Titel, Konformität und Unterlagen werden vor dem Verkauf geprüft." },
      { t: "Transparenz vor der Besichtigung", d: "Die wesentlichen Informationen bereits verfügbar, bevor Sie das Haus betreten." },
      { t: "Vorbereitete Immobilie", d: "Räume aufgewertet und mit professionellen Materialien präsentiert." },
      { t: "Weniger Überraschungen beim Notartermin", d: "Ein geordneter Ablauf, der Unvorhergesehenes und Leerlauf reduziert." },
    ],
    footnote: "Ein Protokoll, das bei jedem Domus-Tua-Auftrag angewendet wird.",
  },
  es: {
    eyebrow: "Protocolo propietario",
    subtitle: "Domus de Origen Certificado",
    intro:
      "No una promesa, sino un método verificable: preparamos, comprobamos y dejamos claro cada paso, para que vender sea más sereno y comprar más seguro.",
    sellerLabel: "Para quien vende",
    sellerText:
      "Un inmueble listo, documentado y creíble: más confianza, propuestas más cualificadas.",
    buyerLabel: "Para quien compra",
    buyerText:
      "Más información y menos sorpresas: se visita y se elige con total tranquilidad.",
    cta: "Descubre el protocolo",
    pillars: [
      { t: "Verificación documental", d: "Títulos, conformidad y documentos comprobados antes de poner en venta." },
      { t: "Transparencia antes de la visita", d: "La información que importa, disponible ya antes de entrar en la casa." },
      { t: "Inmueble preparado", d: "Espacios valorizados y presentados con materiales profesionales." },
      { t: "Menos sorpresas en la escritura", d: "Un recorrido ordenado que reduce imprevistos y tiempos muertos." },
    ],
    footnote: "Un protocolo aplicado a cada encargo de Domus Tua.",
  },
} as const;

export default function DomusDocProtocol({
  tone = "cream",
  id = "domus-doc",
}: {
  tone?: "cream" | "paper" | "cream-deep";
  id?: string;
}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const bg = tone === "paper" ? "bg-paper" : tone === "cream-deep" ? "bg-cream-deep" : "bg-cream";
  return (
    <section id={id} className={bg}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.2rem] border border-line bg-paper p-8 shadow-[0_50px_100px_-70px_rgba(26,24,22,0.6)] sm:p-12">
            {/* watermark motif */}
            <span className="pointer-events-none absolute -right-6 -top-6 opacity-[0.06]" aria-hidden>
              <SegnoDomus className="h-40 w-72" embrace={false} />
            </span>

            <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              {/* Intro */}
              <div>
                {/* Sigillo D.O.C. — firma visiva del protocollo */}
                <div className="mb-6 flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-red text-red">
                  <SegnoDomus className="h-3 w-8" embrace={false} />
                  <span className="mt-0.5 text-[0.58rem] font-bold tracking-[0.14em]">D.O.C.</span>
                </div>
                <span className="eyebrow">{c.eyebrow}</span>
                <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-[3rem]">
                  Domus D.O.C.
                </h2>
                <p className="mt-1 font-display text-lg text-red-dark">{c.subtitle}</p>
                <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
                  {c.intro}
                </p>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-cream p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-red-dark">
                      {c.sellerLabel}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">
                      {c.sellerText}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-line bg-cream p-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-red-dark">
                      {c.buyerLabel}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">
                      {c.buyerText}
                    </p>
                  </div>
                </div>

                <a
                  href="/metodo"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                >
                  {c.cta}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              </div>

              {/* Pilastri */}
              <ul className="flex flex-col gap-3">
                {c.pillars.map((p, i) => (
                  <li
                    key={p.t}
                    className="flex items-start gap-4 rounded-2xl border border-line bg-cream p-5 transition-colors duration-300 hover:border-red/30"
                  >
                    <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-soft font-display text-sm font-semibold text-red-dark">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-red-dark" />
                        <p className="font-display text-lg font-medium text-ink">{p.t}</p>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-stone">{p.d}</p>
                    </div>
                  </li>
                ))}
                <li className="mt-1 flex items-center gap-2 pl-1 text-[0.8rem] text-stone">
                  <Star className="h-3.5 w-3.5 text-red" />
                  {c.footnote}
                </li>
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
