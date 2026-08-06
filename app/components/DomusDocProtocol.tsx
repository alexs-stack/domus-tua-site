"use client";

import { useRef } from "react";
import Reveal from "./Reveal";
import Parallax from "./motion/Parallax";
import CharFlip from "./motion/CharFlip";
import TextLines from "./motion/TextLines";
import Fioritura from "./motion/Fioritura";
import { SegnoDomus, SegnoDomusBadge, SegnoTick } from "./BrandMotif";
import { ArrowUpRight, ArrowRight, Star } from "./Icons";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur, stagger } from "../lib/motion/gsap";

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

  // Componente MULTI-ISTANZA (home + /metodo): tutto scopato ai ref locali.
  const rootRef = useRef<HTMLElement | null>(null);
  const sealRef = useRef<SVGCircleElement | null>(null);

  // Il timbro D.O.C. si "stampa" (cerchio che si disegna + pop del contenuto)
  // e i 5 pilastri entrano in cascata con i numeri che salgono dalla maschera.
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        const seal = sealRef.current;
        const sealBox = root.querySelector<HTMLElement>("[data-doc-seal]");
        const pillars = gsap.utils.toArray<HTMLElement>("[data-doc-pillar]", root);
        const nums = gsap.utils.toArray<HTMLElement>("[data-doc-num]", root);

        // Replay a ogni passaggio: restart all'ingresso, reverse risalendo.
        const tl = gsap.timeline({
          defaults: { ease: "domus" },
          scrollTrigger: { trigger: root, start: "top 72%", toggleActions: "restart none none reverse" },
        });
        if (seal && sealBox) {
          const len = seal.getTotalLength() + 2;
          gsap.set(seal, { strokeDasharray: len, strokeDashoffset: len });
          tl.fromTo(
            sealBox,
            { scale: 0.85, autoAlpha: 0, rotate: -8 },
            { scale: 1, autoAlpha: 1, rotate: 0, duration: dur.short },
            0
          ).to(seal, { strokeDashoffset: 0, duration: dur.reveal, ease: "power2.inOut" }, 0.1);
        }
        if (pillars.length) {
          // Niente clearProps: romperebbe il restart/reverse della timeline.
          tl.fromTo(
            pillars,
            { y: 22, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: dur.short, stagger: stagger.cards * 0.8 },
            0.25
          );
        }
        if (nums.length) {
          tl.fromTo(
            nums,
            { yPercent: 110 },
            { yPercent: 0, duration: dur.short, ease: "expo.out", stagger: stagger.cards * 0.8 },
            0.35
          );
        }
      });
    },
    { scope: rootRef }
  );

  return (
    <section ref={rootRef} id={id} data-tone={tone} className={bg}>
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        {/* `relative` sul Reveal: è il blocco contenitore del tralcio qui sotto.
            Senza, l'ancoraggio dipenderebbe dal `transform` che .reveal si porta
            dietro — vero oggi, ma è una dipendenza invisibile e il fallback
            `scripting: none` la toglie. */}
        <Reveal className="relative">
          {/* IL TRALCIO — sta DENTRO il Reveal e PRIMA della card, e non è un
              dettaglio di stile ma di ordine di pittura: il Reveal ha un
              `filter` (blur) e quindi crea un contesto di impilamento, perciò
              un assoluto messo fuori gli passerebbe SOPRA, addosso ai pilastri.
              Da qui invece la card (posizionata, e successiva nel DOM) lo
              copre: del tralcio resta visibile solo la parte che sporge sopra
              il bordo alto, dentro il respiro della sezione. È il modo più
              semplice di rispettare la regola «mai sopra un testo» senza
              affidarla a una misura che il primo cambio di copy smentisce.
              L'offset negativo è verticale soltanto: uno orizzontale, sotto i
              1290px, spingerebbe il tralcio oltre il bordo della finestra e si
              porterebbe dietro una barra di scorrimento. */}
          <Fioritura variant="corner-tr" className="absolute -top-40 -right-6 hidden h-[26vh] w-[12vw] lg:block" />
          <div className="relative overflow-hidden rounded-[2.2rem] border border-line bg-paper p-8 shadow-[0_50px_100px_-70px_rgba(26,24,22,0.6)] sm:p-12">
            {/* watermark motif: lenta deriva parallax dentro la card (profondità) */}
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.06]" aria-hidden>
              <Parallax speed={-0.12}>
                <SegnoDomus className="h-40 w-72" embrace={false} />
              </Parallax>
            </div>

            <div className="relative grid gap-y-12 lg:grid-cols-[0.95fr_1px_1.05fr] lg:gap-x-14 lg:gap-y-0">
              {/* Intro */}
              <div>
                {/* Sigillo D.O.C. — firma visiva del protocollo: il cerchio è un
                    tratto SVG che si "stampa" all'ingresso (senza JS: completo).
                    Poi la luce lo prende: un lampo che gira intorno al sigillo
                    (rif. _refs/aurelia, vedi docs/effetti-reference.md §2.6). */}
                <div
                  data-doc-seal
                  className="dt-docseal relative mb-6 flex h-16 w-16 flex-col items-center justify-center text-red"
                >
                  <span aria-hidden className="dt-docseal_flash" />
                  <svg aria-hidden viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
                    <circle ref={sealRef} cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <SegnoDomus className="h-3 w-8" embrace={false} />
                  <span className="mt-0.5 text-[0.58rem] font-bold tracking-[0.14em]">D.O.C.</span>
                </div>
                <SegnoDomusBadge>{c.eyebrow}</SegnoDomusBadge>
                {/* TESTA DI CAPITOLO alla scala del riferimento: text-d2 +
                    display-tight, non più 48px fissi. `balance` è via apposta —
                    text-wrap: balance si ricalcola DOPO lo split di CharFlip e
                    fa saltare una riga. Con `exit` il titolo, risalendo la
                    pagina, gira dalla parte opposta invece di spegnersi. */}
                <CharFlip
                  as="h2"
                  className="mt-5 font-display text-d2 display-tight font-medium text-ink"
                  exit
                >
                  Domus D.O.C.
                </CharFlip>
                {/* Nome esteso — coerente ovunque: "Domus D.O.C. — Domus di Origine Certificata" */}
                <TextLines as="p" className="mt-2 font-display text-lg text-red-dark" exit>
                  {c.subtitle}
                </TextLines>
                <TextLines
                  as="p"
                  className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone"
                  exit
                >
                  {c.intro}
                </TextLines>

                <Cta href="#contatti" variant="reveal-cream" size="md" className="mt-8">
                  {c.cta}
                </Cta>
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
                    data-doc-pillar
                    className="group border-t border-line py-5 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="tnum flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-soft font-display text-sm font-semibold text-red-dark transition-colors duration-300 group-hover:bg-red group-hover:text-white">
                        <span data-doc-num className="block">
                          {String(i + 1).padStart(2, "0")}
                        </span>
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
