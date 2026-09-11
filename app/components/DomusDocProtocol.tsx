"use client";

import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { SegnoDomus } from "./BrandMotif";
import { Cta } from "./primitives/Cta";
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
      "Il protocollo interno di Domus Tua per la verifica documentale e tecnico-urbanistica degli immobili che trattiamo: anticipa i controlli invece di subirli in trattativa. Chi vende ha una trattativa più solida, chi compra vede i problemi quando c’è ancora tempo per risolverli.",
    // ─────────────────────────────────────────────────────────────────────────
    // PROMESSE DI AZIONE, NON DI RISULTATO.
    //
    // Questo blocco diceva «nessun abuso o difformità nascosta», «niente stop al
    // rogito», «la trattativa non salta per un documento mancante», «verifiche
    // certificate». Sono esiti che un mediatore NON controlla: dipendono dal Comune,
    // dal notaio, dalla banca dell'acquirente, da difformità non ispezionabili a vista.
    // Una sola di quelle frasi, contraddetta da un rogito andato storto, è una
    // contestazione con il testo del sito come prova.
    //
    // La regola: non si promette che non ci saranno sorprese, si dichiara con
    // precisione cosa si fa perché non ce ne siano. È anche più persuasivo — è
    // specifico e verificabile, e nessun concorrente scrive così.
    //
    // «certificato/certificazione» non si usa mai riferito all'immobile: Domus D.O.C.
    // è un protocollo INTERNO, non una certificazione rilasciata da terzi.
    // ─────────────────────────────────────────────────────────────────────────
    sellerLabel: "Chi vende",
    buyerLabel: "Chi compra",
    cta: "Scopri come proteggiamo la vendita",
    pillars: [
      {
        t: "Documenti",
        seller: "Raccogliamo tutti i documenti prima di partire: è la causa più frequente di trattative che saltano.",
        buyer: "Sai cosa stai comprando, nero su bianco, fin dalla prima visita.",
      },
      {
        t: "Conformità",
        seller: "Controlliamo catasto, urbanistica e impianti prima di pubblicare, non durante la trattativa.",
        buyer: "Se c’è un problema, lo troviamo noi — quando c’è ancora tempo per risolverlo.",
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
    footnote: "Un unico protocollo per ogni incarico Domus Tua: verifiche documentali e tecnico-urbanistiche svolte prima della messa sul mercato. Domus D.O.C. è uno standard interno di Domus Tua, non una certificazione rilasciata da terzi.",
  },
  en: {
    eyebrow: "Proprietary protocol",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Domus Tua's internal protocol for the document and planning checks on the properties we handle: it brings the checks forward instead of meeting them mid-negotiation. Sellers get a stronger negotiation, buyers see the problems while there is still time to fix them.",
    sellerLabel: "For sellers",
    buyerLabel: "For buyers",
    cta: "See how we protect your sale",
    pillars: [
      {
        t: "Documents",
        seller: "We gather every document before going to market: a missing paper is the most common reason deals fall through.",
        buyer: "You know what you’re buying, in black and white, from the very first viewing.",
      },
      {
        t: "Compliance",
        seller: "We check land registry, planning and building systems before listing, not during negotiations.",
        buyer: "If there is a problem, we are the ones who find it — while there is still time to fix it.",
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
    footnote: "One protocol for every Domus Tua mandate: document and planning checks carried out before going to market. Domus D.O.C. is an internal Domus Tua standard, not a certification issued by a third party.",
  },
  fr: {
    eyebrow: "Protocole propriétaire",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Le protocole interne de Domus Tua pour la vérification documentaire et technique des biens que nous traitons : il anticipe les contrôles au lieu de les subir en négociation. Le vendeur a une négociation plus solide, l’acquéreur voit les problèmes quand il est encore temps de les régler.",
    sellerLabel: "Pour les vendeurs",
    buyerLabel: "Pour les acquéreurs",
    cta: "Découvrez comment nous protégeons la vente",
    pillars: [
      {
        t: "Documents",
        seller: "Nous réunissons tous les documents avant de commencer : c’est la cause la plus fréquente des négociations qui échouent.",
        buyer: "Vous savez ce que vous achetez, noir sur blanc, dès la première visite.",
      },
      {
        t: "Conformité",
        seller: "Nous vérifions cadastre, urbanisme et installations avant la mise en ligne, pas pendant la négociation.",
        buyer: "S’il y a un problème, c’est nous qui le trouvons — quand il est encore temps de le régler.",
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
    footnote: "Un seul protocole pour chaque mandat Domus Tua : vérifications documentaires et techniques réalisées avant la mise sur le marché. Domus D.O.C. est un standard interne de Domus Tua, non une certification délivrée par un tiers.",
  },
  de: {
    eyebrow: "Eigenes Protokoll",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Das interne Protokoll von Domus Tua für die Unterlagen- und Baurechtsprüfung der Immobilien, die wir betreuen: Es zieht die Prüfungen vor, statt sie in der Verhandlung zu erleiden. Verkäufer erhalten eine solidere Verhandlung, Käufer sehen Probleme, solange noch Zeit bleibt, sie zu lösen.",
    sellerLabel: "Für Verkäufer",
    buyerLabel: "Für Käufer",
    cta: "Sehen Sie, wie wir den Verkauf schützen",
    pillars: [
      {
        t: "Unterlagen",
        seller: "Wir sammeln alle Unterlagen, bevor es losgeht: ein fehlendes Papier ist der häufigste Grund für geplatzte Verhandlungen.",
        buyer: "Sie wissen, was Sie kaufen – schwarz auf weiß, ab der ersten Besichtigung.",
      },
      {
        t: "Konformität",
        seller: "Wir prüfen Kataster, Baurecht und Anlagen vor der Veröffentlichung, nicht während der Verhandlung.",
        buyer: "Wenn es ein Problem gibt, finden wir es — solange noch Zeit bleibt, es zu lösen.",
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
    footnote: "Ein Protokoll für jeden Domus-Tua-Auftrag: Unterlagen- und Baurechtsprüfungen vor dem Markteintritt. Domus D.O.C. ist ein interner Standard von Domus Tua, keine von Dritten ausgestellte Zertifizierung.",
  },
  es: {
    eyebrow: "Protocolo propietario",
    subtitle: "Domus di Origine Certificata",
    intro:
      "El protocolo interno de Domus Tua para la verificación documental y técnico-urbanística de los inmuebles que gestionamos: adelanta los controles en lugar de sufrirlos en la negociación. Quien vende tiene una negociación más sólida, quien compra ve los problemas cuando aún hay tiempo de resolverlos.",
    sellerLabel: "Para quien vende",
    buyerLabel: "Para quien compra",
    cta: "Descubre cómo protegemos la venta",
    pillars: [
      {
        t: "Documentos",
        seller: "Reunimos todos los documentos antes de empezar: es la causa más frecuente de negociaciones que se caen.",
        buyer: "Sabes qué estás comprando, negro sobre blanco, desde la primera visita.",
      },
      {
        t: "Conformidad",
        seller: "Comprobamos catastro, urbanismo e instalaciones antes de publicar, no durante la negociación.",
        buyer: "Si hay un problema, lo encontramos nosotros — cuando aún hay tiempo para resolverlo.",
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
    footnote: "Un único protocolo para cada encargo de Domus Tua: verificaciones documentales y técnico-urbanísticas realizadas antes de salir al mercado. Domus D.O.C. es un estándar interno de Domus Tua, no una certificación emitida por terceros.",
  },
} as const;

type Props = {
  /** Resta nella firma per le pagine interne (/metodo, /vendi, /acquista), ma
      non rende più alcun fondo né tappa `data-tone`: la rivista bianca ha un
      solo avorio (2026-09-10). */
  tone?: "cream" | "paper" | "cream-deep";
  id?: string;
};

export default function DomusDocProtocol({ id = "domus-doc" }: Props) {
  const { locale } = useLocale();
  const c = copy[locale];

  // Riga piana, multi-istanza (home + pagine interne): niente card, niente
  // lampo, niente timeline GSAP — solo Reveal e TextLines.
  return (
    <section id={id} className="dt-chapter bg-cream">
      <div className="dt-row">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Sigillo D.O.C.: fermo, 96 px. La scritta è a 16 px (text-ui). */}
          <div
            aria-hidden
            className="relative flex h-24 w-24 shrink-0 flex-col items-center justify-center text-red"
          >
            <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full">
              <circle cx="48" cy="48" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <SegnoDomus className="h-4 w-12" />
            <span className="mt-1 text-ui font-bold tracking-[0.14em]">D.O.C.</span>
          </div>

          <div>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <TextLines as="h2" className="mt-6 font-display text-d2">
              Domus D.O.C.
            </TextLines>
            {/* Nome esteso — coerente ovunque: "Domus D.O.C. — Domus di Origine Certificata" */}
            <Reveal>
              <p className="mt-4 font-display text-d4 font-light text-stone">{c.subtitle}</p>
            </Reveal>
            <Reveal>
              <p className="lead mt-6">{c.intro}</p>
            </Reveal>
          </div>
        </div>

        {/* Checklist: i 5 pilastri in due colonne, trattino rosso; ognuno con il
            beneficio per chi vende e per chi compra. */}
        <ul className="mt-12 grid gap-x-[4vw] gap-y-6 text-body text-graphite md:grid-cols-2">
          {c.pillars.map((p) => (
            <li key={p.t} className="flex gap-3">
              <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-red" />
              <div>
                <h3 className="font-display text-d4 font-light">{p.t}</h3>
                <p className="mt-2">
                  <span className="block text-ui font-semibold uppercase tracking-[0.08em] text-red">
                    {c.sellerLabel}
                  </span>
                  {p.seller}
                </p>
                <p className="mt-2 text-stone">
                  <span className="block text-ui font-semibold uppercase tracking-[0.08em]">
                    {c.buyerLabel}
                  </span>
                  {p.buyer}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <Reveal>
          <p className="mt-10 max-w-[800px] text-body text-stone">{c.footnote}</p>
        </Reveal>
        <Reveal delay={100}>
          <Cta href="#contatti" variant="ghost" className="mt-8">
            {c.cta}
          </Cta>
        </Reveal>
      </div>
    </section>
  );
}
