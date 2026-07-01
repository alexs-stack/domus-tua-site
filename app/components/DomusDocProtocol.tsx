"use client";

import Reveal from "./Reveal";
import { SegnoDomus, SegnoDomusBadge } from "./BrandMotif";
import { Check, ArrowUpRight, Star } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Protocollo proprietario",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Il protocollo Domus Tua per rendere più chiaro, verificato e sicuro il percorso immobiliare.",
    sellerLabel: "Per chi vende",
    sellerText:
      "Un immobile pronto, documentato e credibile: più fiducia, proposte più qualificate.",
    buyerLabel: "Per chi acquista",
    buyerText:
      "Più informazioni e meno sorprese: si visita e si sceglie con consapevolezza.",
    cta: "Scopri come proteggiamo la vendita",
    pillars: [
      { t: "Documenti in ordine", d: "Titoli, atti e pratiche raccolti e verificati prima di mettere in vendita." },
      { t: "Conformità controllata", d: "Urbanistica, catasto e impianti allineati per arrivare al rogito senza sorprese." },
      { t: "Trasparenza pre-visita", d: "Le informazioni che contano disponibili già prima di entrare in casa." },
      { t: "Immobile preparato", d: "Spazi valorizzati e raccontati con materiali professionali." },
      { t: "Tutela in ogni fase", d: "Trattativa seguita e passaggi protetti fino alla firma, per entrambe le parti." },
    ],
    footnote: "Protocollo applicato a ogni incarico Domus Tua.",
  },
  en: {
    eyebrow: "Proprietary protocol",
    subtitle: "Domus of Certified Origin",
    intro:
      "The Domus Tua protocol that makes the property journey clearer, verified and more secure.",
    sellerLabel: "For sellers",
    sellerText:
      "A property that is ready, documented and credible: more trust, more qualified offers.",
    buyerLabel: "For buyers",
    buyerText:
      "More information and fewer surprises: you view the property and choose with complete confidence.",
    cta: "See how we protect your sale",
    pillars: [
      { t: "Documents in order", d: "Titles, deeds and paperwork gathered and verified before listing." },
      { t: "Compliance checked", d: "Planning, land registry and systems aligned to reach the deed with no surprises." },
      { t: "Pre-visit transparency", d: "The information that matters, available before you even step inside." },
      { t: "Prepared property", d: "Spaces enhanced and presented with professional materials." },
      { t: "Protection at every stage", d: "The negotiation followed and every step safeguarded through to signing, for both parties." },
    ],
    footnote: "A protocol applied to every Domus Tua mandate.",
  },
  fr: {
    eyebrow: "Protocole propriétaire",
    subtitle: "Domus d'Origine Certifiée",
    intro:
      "Le protocole Domus Tua pour rendre le parcours immobilier plus clair, vérifié et sûr.",
    sellerLabel: "Pour les vendeurs",
    sellerText:
      "Un bien prêt, documenté et crédible : plus de confiance, des offres plus qualifiées.",
    buyerLabel: "Pour les acquéreurs",
    buyerText:
      "Plus d'informations et moins de surprises : on visite et on choisit en toute connaissance de cause.",
    cta: "Découvrez comment nous protégeons la vente",
    pillars: [
      { t: "Documents en ordre", d: "Titres, actes et démarches réunis et vérifiés avant la mise en vente." },
      { t: "Conformité contrôlée", d: "Urbanisme, cadastre et installations alignés pour arriver à l'acte sans surprises." },
      { t: "Transparence avant visite", d: "Les informations essentielles disponibles avant même d'entrer dans le logement." },
      { t: "Bien préparé", d: "Des espaces valorisés et présentés avec des supports professionnels." },
      { t: "Protection à chaque étape", d: "Une négociation suivie et des étapes sécurisées jusqu'à la signature, pour les deux parties." },
    ],
    footnote: "Un protocole appliqué à chaque mandat Domus Tua.",
  },
  de: {
    eyebrow: "Eigenes Protokoll",
    subtitle: "Domus mit zertifizierter Herkunft",
    intro:
      "Das Domus-Tua-Protokoll, das den Immobilienweg klarer, geprüft und sicherer macht.",
    sellerLabel: "Für Verkäufer",
    sellerText:
      "Eine Immobilie, die bereit, dokumentiert und glaubwürdig ist: mehr Vertrauen, qualifiziertere Angebote.",
    buyerLabel: "Für Käufer",
    buyerText:
      "Mehr Informationen und weniger Überraschungen: Sie besichtigen und entscheiden mit gutem Gefühl.",
    cta: "Sehen Sie, wie wir den Verkauf schützen",
    pillars: [
      { t: "Unterlagen in Ordnung", d: "Titel, Urkunden und Vorgänge werden vor dem Verkauf gesammelt und geprüft." },
      { t: "Geprüfte Konformität", d: "Baurecht, Kataster und Anlagen abgestimmt, um ohne Überraschungen zum Notartermin zu kommen." },
      { t: "Transparenz vor der Besichtigung", d: "Die wesentlichen Informationen bereits verfügbar, bevor Sie das Haus betreten." },
      { t: "Vorbereitete Immobilie", d: "Räume aufgewertet und mit professionellen Materialien präsentiert." },
      { t: "Schutz in jeder Phase", d: "Begleitete Verhandlung und abgesicherte Schritte bis zur Unterschrift, für beide Seiten." },
    ],
    footnote: "Ein Protokoll, das bei jedem Domus-Tua-Auftrag angewendet wird.",
  },
  es: {
    eyebrow: "Protocolo propietario",
    subtitle: "Domus de Origen Certificado",
    intro:
      "El protocolo Domus Tua para hacer el recorrido inmobiliario más claro, verificado y seguro.",
    sellerLabel: "Para quien vende",
    sellerText:
      "Un inmueble listo, documentado y creíble: más confianza, propuestas más cualificadas.",
    buyerLabel: "Para quien compra",
    buyerText:
      "Más información y menos sorpresas: se visita y se elige con total tranquilidad.",
    cta: "Descubre cómo protegemos la venta",
    pillars: [
      { t: "Documentos en regla", d: "Títulos, escrituras y trámites reunidos y comprobados antes de poner en venta." },
      { t: "Conformidad comprobada", d: "Urbanismo, catastro e instalaciones alineados para llegar a la escritura sin sorpresas." },
      { t: "Transparencia antes de la visita", d: "La información que importa, disponible ya antes de entrar en la casa." },
      { t: "Inmueble preparado", d: "Espacios valorizados y presentados con materiales profesionales." },
      { t: "Protección en cada fase", d: "Negociación acompañada y pasos protegidos hasta la firma, para ambas partes." },
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
                <SegnoDomusBadge>{c.eyebrow}</SegnoDomusBadge>
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
                  href="#contatti"
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
