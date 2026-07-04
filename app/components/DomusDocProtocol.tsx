"use client";

import Reveal from "./Reveal";
import { SegnoDomus, SegnoDomusBadge } from "./BrandMotif";
import { Check, ArrowUpRight, Star } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Protocollo proprietario",
    subtitle: "La casa di origine certificata",
    intro:
      "Il primo protocollo del territorio che certifica ogni immobile prima della vendita: si controlla prima, non dopo. Chi compra non ha sorprese; chi vende ha una trattativa più solida e tempi più rapidi.",
    sellerLabel: "Per chi vende",
    sellerText:
      "Trattative che non saltano per un documento mancante, acquirenti più sicuri e quindi offerte più concrete, tempi più rapidi e tutto pronto per il rogito.",
    buyerLabel: "Per chi compra",
    buyerText:
      "Nessuna sorpresa dietro le mura, mutuo più semplice da ottenere, documentazione trasparente dalla prima visita e un rogito sereno.",
    cta: "Scopri come proteggiamo la vendita",
    pillars: [
      { t: "Conformità catastale", d: "Lo stato reale dell’immobile corrisponde alla planimetria depositata." },
      { t: "Conformità urbanistica", d: "Titoli e permessi in regola, senza abusi o difformità nascoste." },
      { t: "Impianti e APE", d: "Certificazioni degli impianti e classe energetica verificate." },
      { t: "Provenienza e gravami", d: "Titolo di proprietà, successioni, ipoteche e vincoli verificati e in ordine." },
      { t: "Documentazione completa", d: "Tutti i documenti raccolti e pronti per il notaio, prima della vendita." },
    ],
    footnote: "Protocollo applicato a ogni incarico Domus Tua.",
  },
  en: {
    eyebrow: "Proprietary protocol",
    subtitle: "The home of certified origin",
    intro:
      "The first protocol in the area that certifies every property before the sale: we check beforehand, not after. Buyers face no surprises; sellers get a stronger negotiation and faster timelines.",
    sellerLabel: "For sellers",
    sellerText:
      "Negotiations that don’t collapse over a missing document, more confident buyers and therefore more concrete offers, faster timelines and everything ready for the deed.",
    buyerLabel: "For buyers",
    buyerText:
      "No surprises behind the walls, an easier mortgage to obtain, transparent documentation from the very first viewing and a serene signing.",
    cta: "See how we protect your sale",
    pillars: [
      { t: "Land registry compliance", d: "The property’s actual layout matches the plan filed with the land registry." },
      { t: "Planning compliance", d: "Titles and permits in order, with no hidden breaches or irregularities." },
      { t: "Systems and energy rating", d: "System certifications and the energy performance class verified." },
      { t: "Provenance and encumbrances", d: "Title of ownership, inheritances, mortgages and charges verified and in order." },
      { t: "Complete documentation", d: "Every document gathered and ready for the notary, before the sale." },
    ],
    footnote: "A protocol applied to every Domus Tua mandate.",
  },
  fr: {
    eyebrow: "Protocole propriétaire",
    subtitle: "La maison d’origine certifiée",
    intro:
      "Le premier protocole du territoire qui certifie chaque bien avant la vente : on contrôle avant, pas après. L’acquéreur n’a aucune surprise ; le vendeur bénéficie d’une négociation plus solide et de délais plus courts.",
    sellerLabel: "Pour les vendeurs",
    sellerText:
      "Des négociations qui ne capotent pas pour un document manquant, des acquéreurs plus sûrs et donc des offres plus concrètes, des délais plus courts et tout prêt pour l’acte.",
    buyerLabel: "Pour les acquéreurs",
    buyerText:
      "Aucune surprise derrière les murs, un prêt plus simple à obtenir, une documentation transparente dès la première visite et une signature sereine.",
    cta: "Découvrez comment nous protégeons la vente",
    pillars: [
      { t: "Conformité cadastrale", d: "L’état réel du bien correspond au plan déposé au cadastre." },
      { t: "Conformité urbanistique", d: "Titres et permis en règle, sans infraction ni non-conformité cachée." },
      { t: "Installations et DPE", d: "Certifications des installations et classe énergétique vérifiées." },
      { t: "Provenance et charges", d: "Titre de propriété, successions, hypothèques et servitudes vérifiés et en ordre." },
      { t: "Documentation complète", d: "Tous les documents réunis et prêts pour le notaire, avant la vente." },
    ],
    footnote: "Un protocole appliqué à chaque mandat Domus Tua.",
  },
  de: {
    eyebrow: "Eigenes Protokoll",
    subtitle: "Das Haus mit zertifizierter Herkunft",
    intro:
      "Das erste Protokoll der Region, das jede Immobilie vor dem Verkauf zertifiziert: Es wird vorher geprüft, nicht danach. Käufer erleben keine Überraschungen; Verkäufer erhalten eine solidere Verhandlung und kürzere Fristen.",
    sellerLabel: "Für Verkäufer",
    sellerText:
      "Verhandlungen, die nicht an einem fehlenden Dokument scheitern, sicherere Käufer und damit konkretere Angebote, kürzere Fristen und alles bereit für den Notartermin.",
    buyerLabel: "Für Käufer",
    buyerText:
      "Keine Überraschungen hinter den Mauern, eine einfacher zu erhaltende Finanzierung, transparente Unterlagen ab der ersten Besichtigung und eine entspannte Beurkundung.",
    cta: "Sehen Sie, wie wir den Verkauf schützen",
    pillars: [
      { t: "Katasterkonformität", d: "Der reale Zustand der Immobilie entspricht dem hinterlegten Grundriss." },
      { t: "Baurechtliche Konformität", d: "Titel und Genehmigungen in Ordnung, ohne verborgene Verstöße oder Abweichungen." },
      { t: "Anlagen und Energieausweis", d: "Anlagenzertifizierungen und Energieeffizienzklasse geprüft." },
      { t: "Herkunft und Belastungen", d: "Eigentumstitel, Erbfolgen, Hypotheken und Belastungen geprüft und in Ordnung." },
      { t: "Vollständige Unterlagen", d: "Alle Dokumente gesammelt und bereit für den Notar, vor dem Verkauf." },
    ],
    footnote: "Ein Protokoll, das bei jedem Domus-Tua-Auftrag angewendet wird.",
  },
  es: {
    eyebrow: "Protocolo propietario",
    subtitle: "La casa de origen certificado",
    intro:
      "El primer protocolo del territorio que certifica cada inmueble antes de la venta: se comprueba antes, no después. Quien compra no tiene sorpresas; quien vende cuenta con una negociación más sólida y plazos más rápidos.",
    sellerLabel: "Para quien vende",
    sellerText:
      "Negociaciones que no se caen por un documento que falta, compradores más seguros y por tanto ofertas más concretas, plazos más rápidos y todo listo para la escritura.",
    buyerLabel: "Para quien compra",
    buyerText:
      "Ninguna sorpresa detrás de las paredes, una hipoteca más fácil de obtener, documentación transparente desde la primera visita y una firma tranquila.",
    cta: "Descubre cómo protegemos la venta",
    pillars: [
      { t: "Conformidad catastral", d: "El estado real del inmueble corresponde al plano depositado en el catastro." },
      { t: "Conformidad urbanística", d: "Títulos y permisos en regla, sin infracciones ni disconformidades ocultas." },
      { t: "Instalaciones y certificado energético", d: "Certificaciones de las instalaciones y clase energética verificadas." },
      { t: "Procedencia y cargas", d: "Título de propiedad, sucesiones, hipotecas y gravámenes verificados y en orden." },
      { t: "Documentación completa", d: "Todos los documentos reunidos y listos para el notario, antes de la venta." },
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
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
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
