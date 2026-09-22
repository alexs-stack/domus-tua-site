"use client";

import { useId, useRef } from "react";
import Image from "next/image";
import Hairline, { useHairlineSheet } from "./motion/Hairline";
import Reveal from "./Reveal";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, ScrollTrigger, useGSAP } from "../lib/motion/gsap";
import { MQ } from "../lib/motion/mq";
import { chapters } from "../lib/motion/chapters";

// Domus D.O.C. — Domus di Origine Certificata.
// Protocollo proprietario in 5 pilastri: Documenti, Conformità, Trasparenza, Preparazione, Tutela.
// Ogni pilastro porta un beneficio per chi vende E uno per chi compra (doppio valore).
// Posizionamento: "il protocollo Domus Tua per rendere più chiaro, verificato e sicuro il
// percorso immobiliare". CTA: "Scopri come proteggiamo la vendita".
//
// A59 (Alberto, 22 set. 2026, sera: «aggiungere animazione e rendere più bella la sezione D.O.C.
// della home, mettendo più foto»). Com'è fatta oggi: IL FOGLIO DELLE FOTO. La lista dei pilastri
// sta a sinistra, in una colonna sola; a destra una cornice sticky (da lg) tiene cinque foto, una
// per pilastro, e sfoglia mentre si legge: il pilastro che passa il 62 % dello schermo diventa
// quello attivo, il suo trattino rosso si allunga, gli altri pilastri scendono in pietra, e la
// sua foto entra dal basso (dall'alto risalendo) con la tendina a spigolo vivo e la scala 1,08 → 1
// — la stessa grammatica del sipario del nastro, senza scala fuori dalla foto —, mentre la
// cornice prende l'altezza del suo sorgente: NESSUNA foto è tagliata, la scatola segue il
// rapporto (la regola dei tre moduli) e la cornice respira fra 2:3 e 3:2. Il sigillo D.O.C. è
// un anello di testo che gira in senso orario (come il monogramma, C06), 24 s a giro, a 16 px.
// Sotto lg la cornice sta sopra la lista, non sticky, e sfoglia lo stesso; con reduced-motion o
// senza JS resta la prima foto, ferma, e i pilastri tutti in grafite: la pagina è completa.

type Pillar = { t: string; seller: string; buyer: string; alt: string };

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
        alt: "Uno studio luminoso con la scrivania in rovere sotto le travi bianche e la finestra ad arco sulle colline",
      },
      {
        t: "Conformità",
        seller: "Controlliamo catasto, urbanistica e impianti prima di pubblicare, non durante la trattativa.",
        buyer: "Se c’è un problema, lo troviamo noi — quando c’è ancora tempo per risolverlo.",
        alt: "L'ingresso di una villa con la scala in rovere e il parapetto di vetro, un ulivo in vaso sotto la finestra ad arco",
      },
      {
        t: "Trasparenza",
        seller: "Acquirenti più sicuri e informati: offerte più concrete e serie.",
        buyer: "Decidi con tutte le informazioni in mano, senza zone d’ombra.",
        alt: "Raffaela Rizza nel soggiorno di una villa, che mostra la vetrata aperta sul prato e sulla piscina",
      },
      {
        t: "Preparazione",
        seller: "La casa si presenta al suo valore reale, valorizzata e raccontata bene.",
        buyer: "Capisci subito il potenziale dell’immobile, non solo lo stato di fatto.",
        alt: "Il salotto a doppia altezza di una villa, con il divano di lino e la piscina oltre la vetrata",
      },
      {
        t: "Tutela",
        seller: "Un riferimento umano che protegge la vendita in ogni fase, fino al rogito.",
        buyer: "Un percorso accompagnato e sicuro fino alla firma dal notaio.",
        alt: "Raffaela Rizza sotto il portico di una villa, col glicine sulla pergola e la piscina sul prato",
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
        alt: "A bright study with an oak desk under white beams and an arched window over the hills",
      },
      {
        t: "Compliance",
        seller: "We check land registry, planning and building systems before listing, not during negotiations.",
        buyer: "If there is a problem, we are the ones who find it — while there is still time to fix it.",
        alt: "The entrance of a villa with an oak staircase and glass balustrade, a potted olive tree under the arched window",
      },
      {
        t: "Transparency",
        seller: "More confident, informed buyers: more concrete, serious offers.",
        buyer: "You decide with every piece of information in hand, with no grey areas.",
        alt: "Raffaela Rizza in the living room of a villa, showing the glass wall open onto the lawn and the pool",
      },
      {
        t: "Preparation",
        seller: "The home shows at its true value, enhanced and told well.",
        buyer: "You grasp the property’s potential right away, not just its current state.",
        alt: "The double-height living room of a villa, with a linen sofa and the pool beyond the glass wall",
      },
      {
        t: "Protection",
        seller: "A human point of reference protecting the sale at every step, up to the deed.",
        buyer: "A guided, safe path all the way to signing at the notary.",
        alt: "Raffaela Rizza under the portico of a villa, with wisteria on the pergola and the pool on the lawn",
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
        alt: "Un bureau lumineux avec une table en chêne sous les poutres blanches et une fenêtre en arc sur les collines",
      },
      {
        t: "Conformité",
        seller: "Nous vérifions cadastre, urbanisme et installations avant la mise en ligne, pas pendant la négociation.",
        buyer: "S’il y a un problème, c’est nous qui le trouvons — quand il est encore temps de le régler.",
        alt: "L’entrée d’une villa avec l’escalier en chêne et le garde-corps en verre, un olivier en pot sous la fenêtre en arc",
      },
      {
        t: "Transparence",
        seller: "Des acquéreurs plus sûrs et informés : des offres plus concrètes et sérieuses.",
        buyer: "Vous décidez avec toutes les informations en main, sans zones d’ombre.",
        alt: "Raffaela Rizza dans le séjour d’une villa, montrant la baie vitrée ouverte sur la pelouse et la piscine",
      },
      {
        t: "Préparation",
        seller: "Le bien se présente à sa vraie valeur, mis en valeur et bien raconté.",
        buyer: "Vous saisissez tout de suite le potentiel du bien, pas seulement son état.",
        alt: "Le salon à double hauteur d’une villa, avec le canapé en lin et la piscine derrière la baie vitrée",
      },
      {
        t: "Protection",
        seller: "Un interlocuteur humain qui protège la vente à chaque étape, jusqu’à l’acte.",
        buyer: "Un parcours accompagné et sûr jusqu’à la signature chez le notaire.",
        alt: "Raffaela Rizza sous le portique d’une villa, la glycine sur la pergola et la piscine sur la pelouse",
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
        alt: "Ein helles Arbeitszimmer mit Eichenschreibtisch unter weißen Balken und einem Bogenfenster zu den Hügeln",
      },
      {
        t: "Konformität",
        seller: "Wir prüfen Kataster, Baurecht und Anlagen vor der Veröffentlichung, nicht während der Verhandlung.",
        buyer: "Wenn es ein Problem gibt, finden wir es — solange noch Zeit bleibt, es zu lösen.",
        alt: "Der Eingang einer Villa mit Eichentreppe und Glasgeländer, ein Olivenbaum im Topf unter dem Bogenfenster",
      },
      {
        t: "Transparenz",
        seller: "Sicherere, informierte Käufer: konkretere, seriösere Angebote.",
        buyer: "Sie entscheiden mit allen Informationen in der Hand, ohne Grauzonen.",
        alt: "Raffaela Rizza im Wohnzimmer einer Villa, die Glasfront zum Rasen und zum Pool geöffnet",
      },
      {
        t: "Vorbereitung",
        seller: "Die Immobilie zeigt ihren wahren Wert, aufgewertet und gut erzählt.",
        buyer: "Sie erfassen sofort das Potenzial, nicht nur den Ist-Zustand.",
        alt: "Das doppelt hohe Wohnzimmer einer Villa mit Leinensofa und dem Pool hinter der Glasfront",
      },
      {
        t: "Schutz",
        seller: "Ein menschlicher Ansprechpartner, der den Verkauf in jeder Phase schützt, bis zum Notar.",
        buyer: "Ein begleiteter, sicherer Weg bis zur Unterschrift beim Notar.",
        alt: "Raffaela Rizza unter dem Portikus einer Villa, Glyzinie auf der Pergola und der Pool auf dem Rasen",
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
        alt: "Un estudio luminoso con escritorio de roble bajo las vigas blancas y una ventana en arco sobre las colinas",
      },
      {
        t: "Conformidad",
        seller: "Comprobamos catastro, urbanismo e instalaciones antes de publicar, no durante la negociación.",
        buyer: "Si hay un problema, lo encontramos nosotros — cuando aún hay tiempo para resolverlo.",
        alt: "La entrada de una villa con la escalera de roble y la barandilla de cristal, un olivo en maceta bajo la ventana en arco",
      },
      {
        t: "Transparencia",
        seller: "Compradores más seguros e informados: ofertas más concretas y serias.",
        buyer: "Decides con toda la información en la mano, sin zonas oscuras.",
        alt: "Raffaela Rizza en el salón de una villa, mostrando la cristalera abierta al césped y a la piscina",
      },
      {
        t: "Preparación",
        seller: "La casa se presenta a su valor real, revalorizada y bien contada.",
        buyer: "Entiendes enseguida el potencial del inmueble, no solo su estado actual.",
        alt: "El salón a doble altura de una villa, con el sofá de lino y la piscina tras la cristalera",
      },
      {
        t: "Protección",
        seller: "Una referencia humana que protege la venta en cada fase, hasta la escritura.",
        buyer: "Un recorrido acompañado y seguro hasta la firma ante notario.",
        alt: "Raffaela Rizza bajo el pórtico de una villa, con la glicina en la pérgola y la piscina en el césped",
      },
    ] as Pillar[],
    footnote: "Domus D.O.C. es un estándar interno de Domus Tua, aplicado a cada encargo: no una certificación emitida por terceros.",
  },
} as const;

/* Le cinque foto del foglio (D-A59), una per pilastro, tutte dal set delle foto alte generate
   (A44) più il salotto doppio: nessuna è già montata in home (una foto non si ripete nella
   pagina). Documenti = la scrivania dello studio; Conformità = l'ingresso con la scala, la casa
   com'è; Trasparenza = Raffaela che mostra il soggiorno in piena luce; Preparazione = la casa
   pronta; Tutela = Raffaela sotto il portico, il riferimento umano. `w`/`h` sono le misure del
   sorgente: la cornice prende il loro rapporto. */
const FOTO = [
  { src: "/images/reali/attico-studio-alta.jpg", w: 2560, h: 3816 },
  { src: "/images/reali/villa-ingresso-scala-alta.jpg", w: 2560, h: 3816 },
  { src: "/images/reali/raffaela-salotto-alta.jpg", w: 2560, h: 3816 },
  { src: "/images/reali/villa-salotto-doppio.jpg", w: 2560, h: 1717 },
  { src: "/images/reali/raffaela-portico-alta.jpg", w: 2560, h: 3816 },
] as const;
/* La cornice: larga come la riga sotto lg, da lg al più 42vw / 640 px e non più alta di 80svh
   (globals.css, «IL FOGLIO DELLE FOTO DI DOMUS D.O.C.»). */
const FOTO_SIZES = "(max-width: 1023px) 90vw, 42vw";
/** Il pilastro attivo è quello che attraversa questa quota dello schermo. */
const QUOTA = "62%";

/** Il tratto dello sfoglio, dal registro (chapters.ts `doc`, nota «sfoglio 1,1 s»). */
function sfoglio(): { ease: string; dur: number } {
  const t = chapters.doc.secondary?.find((s) => s.note.startsWith("sfoglio"));
  const m = t && /(\d+),(\d+) s/.exec(t.note);
  if (!t || !m) throw new Error("chapters.doc: manca il tratto «sfoglio» con la durata");
  return { ease: t.ease, dur: Number(`${m[1]}.${m[2]}`) };
}

type Props = {
  /** Resta nella firma per le pagine interne (/metodo, /vendi, /acquista), ma
      non rende più alcun fondo né tappa `data-tone`: la rivista bianca ha un
      solo avorio (2026-09-10). */
  tone?: "cream" | "paper" | "cream-deep";
  id?: string;
  /** In home (2026-09-20, Alberto: «riassumere e eliminare diversi copy»):
      ogni pilastro porta solo la riga per chi vende — il lettore della home
      e' chi deve vendere (page.tsx, STORY) — e il doppio valore per esteso
      resta su /vendi, /acquista e /metodo. */
  compact?: boolean;
};

export default function DomusDocProtocol({ id = "domus-doc", compact = false }: Props) {
  const { locale } = useLocale();
  const c = copy[locale];
  const rootRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const anello = useId();
  // I `li` hanno per chiave il titolo del pilastro e cambiano nodo con la lingua:
  // il foglio si riarma a ogni cambio (A20 di Alberto: flip per lettera anche nei
  // pilastri, spec §2.3; righe del foglio D26).
  useHairlineSheet(sheetRef, "doc", [locale]);

  // Lo sfoglio delle foto (A59). Con motion ok: la foto del pilastro attivo entra a tendina, la
  // cornice prende la sua altezza; senza, non si scrive nulla (la prima foto è quella del CSS).
  useGSAP(
    () => {
      const root = rootRef.current;
      const cornice = root?.querySelector<HTMLElement>("[data-doc-cornice]");
      const sheet = sheetRef.current;
      if (!root || !cornice || !sheet) return;
      const foto = gsap.utils.toArray<HTMLElement>("[data-doc-foto]", cornice);
      const pilastri = gsap.utils.toArray<HTMLElement>("[data-doc-pilastro]", sheet);
      if (foto.length !== FOTO.length || pilastri.length !== FOTO.length) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const { ease, dur } = sfoglio();
        let attivo = 0;
        let z = foto.length;
        const altezza = (i: number) => (cornice.clientWidth * FOTO[i].h) / FOTO[i].w;
        const marca = (i: number) => pilastri.forEach((p, k) => p.toggleAttribute("data-doc-attivo", k === i));
        const vai = (i: number, dir: number) => {
          if (i === attivo) return;
          attivo = i;
          marca(i);
          const f = foto[i];
          const img = f.querySelector("img");
          gsap.set(f, { zIndex: ++z });
          // Scendendo la foto nuova entra dal basso; risalendo, dall'alto (l'uscita speculare, A18).
          gsap.fromTo(
            f,
            { clipPath: dir >= 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" },
            { clipPath: "inset(0% 0% 0% 0%)", duration: dur, ease, overwrite: "auto" },
          );
          if (img) gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: dur, ease, overwrite: "auto" });
          gsap.to(cornice, { height: altezza(i), duration: dur * 0.8, ease, overwrite: "auto" });
        };
        gsap.set(foto, { clipPath: (i: number) => (i === 0 ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)"), zIndex: (i: number) => i });
        gsap.set(cornice, { height: altezza(0) });
        sheet.setAttribute("data-doc-vivo", "");
        marca(0);
        const posa = () => gsap.set(cornice, { height: altezza(attivo) });
        ScrollTrigger.addEventListener("refreshInit", posa);
        const trigger = pilastri.map((p, i) =>
          ScrollTrigger.create({
            trigger: p,
            start: `top ${QUOTA}`,
            end: `bottom ${QUOTA}`,
            onToggle: (self) => {
              if (self.isActive) vai(i, self.direction);
            },
          }),
        );
        return () => {
          ScrollTrigger.removeEventListener("refreshInit", posa);
          trigger.forEach((t) => t.kill());
          sheet.removeAttribute("data-doc-vivo");
          pilastri.forEach((p) => p.removeAttribute("data-doc-attivo"));
          gsap.set(cornice, { clearProps: "height" });
          gsap.set(foto, { clearProps: "clipPath,zIndex" });
        };
      });
    },
    { scope: rootRef, dependencies: [locale], revertOnUpdate: true },
  );

  // Riga piana, multi-istanza (home, /vendi, /metodo, /acquista): niente card.
  // Il gesto del capitolo 10 (A20 di Alberto, spec §3.11) vale su tutte e quattro:
  // le righe sopra i pilastri si tirano da sinistra e la spina fra la lista e la
  // cornice scende dall'alto (Hairline, valori in chapters.ts); ferme restano
  // disegnate (D26). Titoli per lettera con SplitTitle (A20).
  return (
    <section ref={rootRef} id={id} className="dt-chapter bg-cream">
      <div className="dt-row">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {/* Sigillo D.O.C. (A59): 160 px, l'anello di testo a 16 px gira in senso orario in CSS
              (globals.css), la sigla in Playfair al centro. Decorativo: il nome esteso sta nel
              sottotitolo qui accanto. */}
          <div aria-hidden className="dt-doc_sigillo">
            <svg viewBox="0 0 160 160" className="dt-doc_anello">
              <defs>
                <path id={anello} d="M80 18a62 62 0 1 1-.01 0" />
              </defs>
              <text className="dt-doc_anello-testo">
                <textPath href={`#${anello}`}>Domus di Origine Certificata ·</textPath>
              </text>
            </svg>
            <span className="dt-doc_sigla font-display">D.O.C.</span>
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

        {/* Il foglio: a sinistra i 5 pilastri in colonna col trattino rosso, ognuno con il
            beneficio per chi vende (e per chi compra, fuori dalla home); a destra la cornice
            delle foto, sticky da lg. Il foglio è rigato (D26): una riga di 1 px sopra ogni
            pilastro e, da lg, la spina fra la lista e la cornice. La spina sta nel wrapper e non
            nella `ul`, così la lista resta fatta solo di `li` (spec §3.11). */}
        <div ref={sheetRef} data-doc-sheet className="dt-doc_foglio relative mt-10 grid gap-[6vw] lg:grid-cols-2 lg:items-start">
          <Hairline chapter="doc" axis="y" className="hidden lg:block" />
          <div>
            <ul className="grid text-body text-graphite">
              {/* A64 (Alberto, 22 set., sera: «distanzia di più i pilastri … al momento è troppo veloce e non
                  si fa in tempo a vedere quella successiva»): passo doppio (py-12) e la riga in misura lead,
                  così fra uno sfoglio e l'altro passano ~220 px di scroll a 1440. */}
              {c.pillars.map((p) => (
                <li key={p.t} data-doc-pilastro className="dt-doc_pilastro relative flex gap-3 py-12">
                  <Hairline chapter="doc" />
                  <span aria-hidden className="dt-doc_tratto mt-3 h-px w-6 shrink-0 bg-red" />
                  <div>
                    <SplitTitle as="h3" font="display-400" className="font-display text-d3 font-light">
                      {p.t}
                    </SplitTitle>
                    {compact ? (
                      <p className="mt-3 text-lead">{p.seller}</p>
                    ) : (
                      <>
                        <p className="mt-2">
                          <span className="block text-ui font-semibold uppercase tracking-[0.08em] text-red-dark">
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
            <Reveal>
              <p className="mt-8 max-w-[800px] text-body text-stone">{c.footnote}</p>
            </Reveal>
            <Reveal delay={100}>
              <Cta href="#contatti" variant="ghost" className="mt-6">
                {c.cta}
              </Cta>
            </Reveal>
          </div>

          <div data-doc-cornice data-bg="foto" className="dt-doc_cornice lg:justify-self-end">
            {FOTO.map((f, i) => (
              <div key={f.src} data-doc-foto className="dt-doc_foto">
                <Image src={f.src} alt={c.pillars[i]?.alt ?? ""} fill sizes={FOTO_SIZES} className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
