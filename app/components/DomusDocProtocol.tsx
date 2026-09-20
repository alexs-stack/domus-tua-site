"use client";

import { useRef } from "react";
import Hairline, { useHairlineSheet } from "./motion/Hairline";
import Reveal from "./Reveal";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
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
      "Verifichiamo documenti, catasto e urbanistica prima di mettere la casa sul mercato, così i controlli non arrivano in trattativa.",
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
    footnote: "Domus D.O.C. è uno standard interno di Domus Tua, applicato a ogni incarico: non una certificazione rilasciata da terzi.",
  },
  en: {
    eyebrow: "Proprietary protocol",
    subtitle: "Domus di Origine Certificata",
    intro:
      "We check paperwork, land registry and planning before the home goes to market, so the checks never land mid-negotiation.",
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
    footnote: "Domus D.O.C. is an internal Domus Tua standard applied to every mandate: not a certification issued by a third party.",
  },
  fr: {
    eyebrow: "Protocole propriétaire",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Nous vérifions documents, cadastre et urbanisme avant la mise sur le marché, pour que les contrôles n’arrivent pas en négociation.",
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
    footnote: "Domus D.O.C. est un standard interne de Domus Tua, appliqué à chaque mandat : non une certification délivrée par un tiers.",
  },
  de: {
    eyebrow: "Eigenes Protokoll",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Wir prüfen Unterlagen, Kataster und Baurecht, bevor das Haus auf den Markt kommt, damit keine Prüfung mitten in die Verhandlung fällt.",
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
    footnote: "Domus D.O.C. ist ein interner Standard von Domus Tua für jeden Auftrag: keine von Dritten ausgestellte Zertifizierung.",
  },
  es: {
    eyebrow: "Protocolo propietario",
    subtitle: "Domus di Origine Certificata",
    intro:
      "Verificamos documentos, catastro y urbanismo antes de sacar la casa al mercado, para que los controles no lleguen en plena negociación.",
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
    footnote: "Domus D.O.C. es un estándar interno de Domus Tua, aplicado a cada encargo: no una certificación emitida por terceros.",
  },
} as const;

type Props = {
  /** Resta nella firma per le pagine interne (/metodo, /vendi, /acquista), ma
      non rende più alcun fondo né tappa `data-tone`: la rivista bianca ha un
      solo avorio (2026-09-10). */
  tone?: "cream" | "paper" | "cream-deep";
  id?: string;
  /** In home (2026-09-20, Alberto: «riassumere e eliminare diversi copy»):
      ogni pilastro porta solo la riga per chi vende — il lettore della home
      e' chi deve vendere (page.tsx, STORY) — e il doppio valore per esteso
      resta su /vendi, /acquista e /metodo. Il capitolo era il piu' lungo della
      home per parole (233) senza una foto: 1.573 px a 1440×900. */
  compact?: boolean;
};

export default function DomusDocProtocol({ id = "domus-doc", compact = false }: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  const sheetRef = useRef<HTMLDivElement | null>(null);
  // I `li` hanno per chiave il titolo del pilastro e cambiano nodo con la lingua:
  // il foglio si riarma a ogni cambio (A20 di Alberto: flip per lettera anche nei
  // pilastri, spec §2.3; righe del foglio D26).
  useHairlineSheet(sheetRef, "doc", [locale]);

  // Riga piana, multi-istanza (home, /vendi, /metodo, /acquista): niente card.
  // Il gesto del capitolo 10 (A20 di Alberto, spec §3.11) vale su tutte e quattro:
  // le righe sopra i pilastri si tirano da sinistra e la spina fra le colonne
  // scende dall'alto (Hairline, valori in chapters.ts); ferme restano disegnate
  // (D26). Titoli per lettera con SplitTitle (A20).
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
            <SplitTitle as="h2" className="mt-6 font-display text-d2">
              Domus D.O.C.
            </SplitTitle>
            {/* Nome esteso — coerente ovunque: "Domus D.O.C. — Domus di Origine Certificata" */}
            <Reveal>
              <p className="mt-4 font-display text-d4 font-light text-stone">{c.subtitle}</p>
            </Reveal>
            <Lead className="mt-6">{c.intro}</Lead>
          </div>
        </div>

        {/* Checklist: i 5 pilastri in due colonne, trattino rosso; ognuno con il
            beneficio per chi vende e per chi compra. Il foglio è rigato (D26):
            una riga di 1 px sopra ogni pilastro e, da md, la spina fra le due
            colonne. La spina sta nel wrapper e non nella `ul`, così la lista
            resta fatta solo di `li` (spec §3.11). */}
        <div ref={sheetRef} data-doc-sheet className="relative mt-10">
          <Hairline chapter="doc" axis="y" className="hidden md:block" />
          <ul className="grid gap-x-[4vw] gap-y-6 text-body text-graphite md:grid-cols-2">
            {c.pillars.map((p) => (
              <li key={p.t} className="relative flex gap-3 pt-6">
                <Hairline chapter="doc" />
                <span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-red" />
                <div>
                  <SplitTitle as="h3" font="display-400" className="font-display text-d4 font-light">
                    {p.t}
                  </SplitTitle>
                  {compact ? (
                    <p className="mt-2">{p.seller}</p>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Reveal>
          <p className="mt-8 max-w-[800px] text-body text-stone">{c.footnote}</p>
        </Reveal>
        <Reveal delay={100}>
          <Cta href="#contatti" variant="ghost" className="mt-6">
            {c.cta}
          </Cta>
        </Reveal>
      </div>
    </section>
  );
}
