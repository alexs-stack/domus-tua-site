"use client";

import Reveal from "./Reveal";
import { SegnoDomus, SegnoDomusBadge, SegnoTick } from "./BrandMotif";
import { ArrowUpRight, ArrowRight, Star } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

// Domus D.O.C. — Domus di Origine Certificata.
// Protocollo proprietario in 5 pilastri: Documenti, Conformità, Trasparenza, Preparazione, Tutela.
// Ogni pilastro porta un beneficio per chi vende E uno per chi compra (doppio valore).
// Posizionamento: "il protocollo Domus Tua per rendere più chiaro, verificato e sicuro il
// percorso immobiliare". CTA: "Scopri come proteggiamo la vendita".

type Pillar = { t: string; seller: string; buyer: string };

const copy = {
  it: {
    eyebrow: "Protocollo proprietario",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Il protocollo Domus Tua per rendere più chiaro, verificato e sicuro il percorso immobiliare. Si controlla prima, non dopo: chi vende ha una trattativa più solida, chi compra non ha sorprese.",
    sellerLabel: "Chi vende",
    buyerLabel: "Chi compra",
    cta: "Scopri come proteggiamo la vendita",
    pillars: [
      {
        t: "Documenti",
        seller: "Tutte le carte raccolte e pronte: la trattativa non salta per un documento mancante.",
        buyer: "Sai cosa stai comprando, nero su bianco, fin dalla prima visita.",
      },
      {
        t: "Conformità",
        seller: "Catasto, urbanistica e impianti in regola prima di vendere: niente stop al rogito.",
        buyer: "Nessun abuso o difformità nascosta dietro le mura.",
      },
      {
        t: "Trasparenza",
        seller: "Acquirenti più sicuri e informati: offerte più concrete e serie.",
        buyer: "Decidi con tutte le informazioni in mano, senza zone d’ombra.",
      },
      {
        t: "Preparazione",
        seller: "La casa si presenta al suo valore reale, valorizzata e raccontata bene.",
        buyer: "Capisci subito il potenziale dell’immobile, non solo lo stato di fatto.",
      },
      {
        t: "Tutela",
        seller: "Un riferimento umano che protegge la vendita in ogni fase, fino al rogito.",
        buyer: "Un percorso accompagnato e sicuro fino alla firma dal notaio.",
      },
    ] as Pillar[],
    footnote: "Un unico protocollo per ogni incarico Domus Tua: verifiche certificate e servizi completi.",
  },
  en: {
    eyebrow: "Proprietary protocol",
    subtitle: "Domus di Origine Certificata",
    intro:
      "The Domus Tua protocol that makes the property journey clearer, verified and safer. We check beforehand, not after: sellers get a stronger negotiation, buyers face no surprises.",
    sellerLabel: "For sellers",
    buyerLabel: "For buyers",
    cta: "See how we protect your sale",
    pillars: [
      {
        t: "Documents",
        seller: "Every paper gathered and ready: the deal won’t collapse over a missing document.",
        buyer: "You know what you’re buying, in black and white, from the very first viewing.",
      },
      {
        t: "Compliance",
        seller: "Land registry, planning and systems in order before selling: no block at the deed.",
        buyer: "No hidden breach or irregularity behind the walls.",
      },
      {
        t: "Transparency",
        seller: "More confident, informed buyers: more concrete, serious offers.",
        buyer: "You decide with every piece of information in hand, with no grey areas.",
      },
      {
        t: "Preparation",
        seller: "The home shows at its true value, enhanced and told well.",
        buyer: "You grasp the property’s potential right away, not just its current state.",
      },
      {
        t: "Protection",
        seller: "A human point of reference protecting the sale at every step, up to the deed.",
        buyer: "A guided, safe path all the way to signing at the notary.",
      },
    ] as Pillar[],
    footnote: "One protocol for every Domus Tua mandate: certified checks and complete services.",
  },
  fr: {
    eyebrow: "Protocole propriétaire",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Le protocole Domus Tua qui rend le parcours immobilier plus clair, vérifié et sûr. On contrôle avant, pas après : le vendeur a une négociation plus solide, l’acquéreur n’a aucune surprise.",
    sellerLabel: "Pour les vendeurs",
    buyerLabel: "Pour les acquéreurs",
    cta: "Découvrez comment nous protégeons la vente",
    pillars: [
      {
        t: "Documents",
        seller: "Tous les papiers réunis et prêts : la négociation ne capote pas pour un document manquant.",
        buyer: "Vous savez ce que vous achetez, noir sur blanc, dès la première visite.",
      },
      {
        t: "Conformité",
        seller: "Cadastre, urbanisme et installations en règle avant de vendre : aucun blocage à l’acte.",
        buyer: "Aucune infraction ni non-conformité cachée derrière les murs.",
      },
      {
        t: "Transparence",
        seller: "Des acquéreurs plus sûrs et informés : des offres plus concrètes et sérieuses.",
        buyer: "Vous décidez avec toutes les informations en main, sans zones d’ombre.",
      },
      {
        t: "Préparation",
        seller: "Le bien se présente à sa vraie valeur, mis en valeur et bien raconté.",
        buyer: "Vous saisissez tout de suite le potentiel du bien, pas seulement son état.",
      },
      {
        t: "Protection",
        seller: "Un interlocuteur humain qui protège la vente à chaque étape, jusqu’à l’acte.",
        buyer: "Un parcours accompagné et sûr jusqu’à la signature chez le notaire.",
      },
    ] as Pillar[],
    footnote: "Un seul protocole pour chaque mandat Domus Tua : vérifications certifiées et services complets.",
  },
  de: {
    eyebrow: "Eigenes Protokoll",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Das Domus-Tua-Protokoll, das den Immobilienweg klarer, geprüft und sicherer macht. Wir prüfen vorher, nicht danach: Verkäufer erhalten eine solidere Verhandlung, Käufer erleben keine Überraschungen.",
    sellerLabel: "Für Verkäufer",
    buyerLabel: "Für Käufer",
    cta: "Sehen Sie, wie wir den Verkauf schützen",
    pillars: [
      {
        t: "Unterlagen",
        seller: "Alle Papiere gesammelt und bereit: Der Deal scheitert nicht an einem fehlenden Dokument.",
        buyer: "Sie wissen, was Sie kaufen – schwarz auf weiß, ab der ersten Besichtigung.",
      },
      {
        t: "Konformität",
        seller: "Kataster, Baurecht und Anlagen vor dem Verkauf in Ordnung: kein Stopp beim Notar.",
        buyer: "Kein verborgener Verstoß oder Mangel hinter den Mauern.",
      },
      {
        t: "Transparenz",
        seller: "Sicherere, informierte Käufer: konkretere, seriösere Angebote.",
        buyer: "Sie entscheiden mit allen Informationen in der Hand, ohne Grauzonen.",
      },
      {
        t: "Vorbereitung",
        seller: "Die Immobilie zeigt ihren wahren Wert, aufgewertet und gut erzählt.",
        buyer: "Sie erfassen sofort das Potenzial, nicht nur den Ist-Zustand.",
      },
      {
        t: "Schutz",
        seller: "Ein menschlicher Ansprechpartner, der den Verkauf in jeder Phase schützt, bis zum Notar.",
        buyer: "Ein begleiteter, sicherer Weg bis zur Unterschrift beim Notar.",
      },
    ] as Pillar[],
    footnote: "Ein Protokoll für jeden Domus-Tua-Auftrag: zertifizierte Prüfungen und vollständige Leistungen.",
  },
  es: {
    eyebrow: "Protocolo propietario",
    subtitle: "Domus di Origine Certificata",
    intro:
      "El protocolo Domus Tua para hacer más claro, verificado y seguro el recorrido inmobiliario. Se comprueba antes, no después: quien vende tiene una negociación más sólida, quien compra no tiene sorpresas.",
    sellerLabel: "Para quien vende",
    buyerLabel: "Para quien compra",
    cta: "Descubre cómo protegemos la venta",
    pillars: [
      {
        t: "Documentos",
        seller: "Todos los papeles reunidos y listos: la negociación no se cae por un documento que falta.",
        buyer: "Sabes qué estás comprando, negro sobre blanco, desde la primera visita.",
      },
      {
        t: "Conformidad",
        seller: "Catastro, urbanismo e instalaciones en regla antes de vender: sin bloqueos en la escritura.",
        buyer: "Ninguna infracción ni disconformidad oculta detrás de las paredes.",
      },
      {
        t: "Transparencia",
        seller: "Compradores más seguros e informados: ofertas más concretas y serias.",
        buyer: "Decides con toda la información en la mano, sin zonas oscuras.",
      },
      {
        t: "Preparación",
        seller: "La casa se presenta a su valor real, revalorizada y bien contada.",
        buyer: "Entiendes enseguida el potencial del inmueble, no solo su estado actual.",
      },
      {
        t: "Protección",
        seller: "Una referencia humana que protege la venta en cada fase, hasta la escritura.",
        buyer: "Un recorrido acompañado y seguro hasta la firma ante notario.",
      },
    ] as Pillar[],
    footnote: "Un único protocolo para cada encargo de Domus Tua: verificaciones certificadas y servicios completos.",
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

            <div className="relative grid gap-y-12 lg:grid-cols-[0.95fr_1px_1.05fr] lg:gap-x-14 lg:gap-y-0">
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
                {/* Nome esteso — coerente ovunque: "Domus D.O.C. — Domus di Origine Certificata" */}
                <p className="mt-1 font-display text-lg text-red-dark">{c.subtitle}</p>
                <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
                  {c.intro}
                </p>

                <a
                  href="#contatti"
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-red py-3.5 pl-6 pr-2.5 text-sm font-semibold text-cream transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
                >
                  {c.cta}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </a>
              </div>

              {/* Divisore verticale hairline tra intro e pilastri (solo desktop) */}
              <div className="hidden lg:block" aria-hidden>
                <span className="block h-full w-px bg-gradient-to-b from-transparent via-line to-transparent" />
              </div>

              {/* 5 pilastri — ognuno con beneficio per chi vende E per chi compra. */}
              <ul className="flex flex-col">
                {c.pillars.map((p, i) => (
                  <li
                    key={p.t}
                    className="group border-t border-line py-5 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-soft font-display text-sm font-semibold text-red-dark transition-colors duration-300 group-hover:bg-red group-hover:text-white">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2">
                        <SegnoTick className="h-4 w-4 text-red-dark" />
                        <p className="font-display text-lg font-medium text-ink">{p.t}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 pl-12 sm:grid-cols-2">
                      <div>
                        <p className="flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-red-dark">
                          <ArrowUpRight className="h-3 w-3" />
                          {c.sellerLabel}
                        </p>
                        <p className="mt-1 text-[0.85rem] leading-relaxed text-graphite">{p.seller}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-stone">
                          <ArrowRight className="h-3 w-3 text-red" />
                          {c.buyerLabel}
                        </p>
                        <p className="mt-1 text-[0.85rem] leading-relaxed text-stone">{p.buyer}</p>
                      </div>
                    </div>
                  </li>
                ))}
                <li className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-[0.8rem] text-stone">
                  <Star className="h-3.5 w-3.5 shrink-0 text-red" />
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
