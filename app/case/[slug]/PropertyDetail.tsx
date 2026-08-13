"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import PropertyGallery from "../../components/PropertyGallery";
import PropertyFacts from "./PropertyFacts";
import ListingCopy from "./ListingCopy";
import { formatListingDescription } from "../../lib/listingCopy/format";
import { isAvailable } from "../../lib/availability";
import PropertyCard from "../../components/PropertyCard";
import ListingsGrid from "../../components/ListingsGrid";
import Badge from "../../components/primitives/Badge";
import Contact from "../../components/Contact";
import DrawOnScroll from "../../components/motion/DrawOnScroll";
import { SegnoDomusBadge, SegnoDomusCorner, SegnoDomusDivider, SegnoTick } from "../../components/BrandMotif";
import { ArrowRight, Whatsapp } from "../../components/Icons";
import { Cta } from "../../components/primitives/Cta";
import { site } from "../../lib/site";
import { buildWhatsAppUrl } from "../../lib/forms/whatsapp";
import { gsap, ScrollTrigger, useGSAP, MQ, dur, stagger } from "../../lib/motion/gsap";
import type { Property } from "../../lib/properties";
import { factApplies, type CoreFactKey } from "../../lib/propertyKind";
import { useLocale } from "../../components/i18n/LocaleProvider";

const copy = {
  it: {
    backToAll: "Tutte le case",
    keyFacts: "Dati principali",
    factGroups: {
      principali: "Dati principali",
      esterni: "Esterni e pertinenze",
      comfort: "Comfort e impianti",
      spazi: "Spazi",
      forza: "Punti di forza",
    },
    moreFacts: "Altre {n} voci",
    moreFactsOne: "Un'altra voce",
    description: "Descrizione",
    features: "Caratteristiche",
    specSqm: "Superficie",
    specRooms: "Locali",
    specBeds: "Camere",
    specBaths: "Bagni",
    specType: "Tipologia",
    specStatus: "Stato",
    specEnergy: "Classe energetica",
    requestVisit: "Richiedi una visita",
    whatsapp: "Parla con Domus Tua",
    refLabel: "Rif.",
    assistTitle: "Con te in ogni passo",
    assistPoints: [
      "Documenti e informazioni",
      "Visita organizzata",
      "Assistenza alla proposta",
      "Accompagnamento fino al rogito",
    ],
    soldTitle: "Questo immobile è stato venduto",
    soldText:
      "È stato venduto — ma possiamo aiutarti a trovarne uno simile. Raccontaci cosa cerchi: molte case le troviamo noi.",
    soldCta: "Cerco una casa simile",
    notRightTitle: "Non è quella giusta?",
    notRightText:
      "Raccontaci cosa cerchi: seguiamo anche richieste su misura, prima ancora che l’immobile arrivi online.",
    notRightCta: "Raccontaci cosa cerchi",
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Una casa verificata, prima ancora di entrare.",
    safetyText:
      "Questo immobile segue il protocollo Domus di Origine Certificata: documenti, conformità e trasparenza controllati prima della vendita. Così visiti e scegli con serenità, senza sorprese.",
    safetyLink: "Scopri il protocollo Domus D.O.C.",
    safetyPoints: ["Documenti in ordine", "Conformità controllata", "Trasparenza pre-visita"],
    related: "Altre case da scoprire",
    viewAll: "Vedi tutte le case",
  },
  en: {
    backToAll: "All properties",
    keyFacts: "Key facts",
    factGroups: {
      principali: "Key facts",
      esterni: "Outdoor & extras",
      comfort: "Comfort & systems",
      spazi: "Spaces",
      forza: "Highlights",
    },
    moreFacts: "{n} more",
    moreFactsOne: "1 more",
    description: "Description",
    features: "Features",
    specSqm: "Surface",
    specRooms: "Rooms",
    specBeds: "Bedrooms",
    specBaths: "Bathrooms",
    specType: "Type",
    specStatus: "Status",
    specEnergy: "Energy class",
    requestVisit: "Request a viewing",
    whatsapp: "Talk to Domus Tua",
    refLabel: "Ref.",
    assistTitle: "With you every step",
    assistPoints: [
      "Documents and information",
      "Organised viewing",
      "Support with the offer",
      "Guidance up to the deed",
    ],
    soldTitle: "This property has been sold",
    soldText:
      "It’s been sold — but we can help you find a similar one. Tell us what you’re after: we find many homes ourselves.",
    soldCta: "Find me a similar home",
    notRightTitle: "Not the right one?",
    notRightText:
      "Tell us what you’re after: we also handle bespoke requests, before a home even goes online.",
    notRightCta: "Tell us what you’re looking for",
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "A verified home, before you even step inside.",
    safetyText:
      "This property follows the Domus of Certified Origin protocol: documents, compliance and transparency checked before the sale. So you view and choose with peace of mind, no surprises.",
    safetyLink: "Discover the Domus D.O.C. protocol",
    safetyPoints: ["Documents in order", "Compliance checked", "Pre-visit transparency"],
    related: "More homes to discover",
    viewAll: "View all properties",
  },
  fr: {
    backToAll: "Tous les biens",
    keyFacts: "Données clés",
    factGroups: {
      principali: "Données clés",
      esterni: "Extérieurs et dépendances",
      comfort: "Confort et installations",
      spazi: "Espaces",
      forza: "Points forts",
    },
    moreFacts: "{n} autres",
    moreFactsOne: "1 autre",
    description: "Description",
    features: "Caractéristiques",
    specSqm: "Surface",
    specRooms: "Pièces",
    specBeds: "Chambres",
    specBaths: "Salles de bain",
    specType: "Type",
    specStatus: "Statut",
    specEnergy: "Classe énergétique",
    requestVisit: "Demander une visite",
    whatsapp: "Parler à Domus Tua",
    refLabel: "Réf.",
    assistTitle: "À vos côtés à chaque étape",
    assistPoints: [
      "Documents et informations",
      "Visite organisée",
      "Assistance à l’offre",
      "Accompagnement jusqu’à l’acte",
    ],
    soldTitle: "Ce bien a été vendu",
    soldText:
      "Il a été vendu — mais nous pouvons vous aider à en trouver un similaire. Dites-nous ce que vous cherchez.",
    soldCta: "Je cherche un bien similaire",
    notRightTitle: "Ce n’est pas le bon ?",
    notRightText:
      "Dites-nous ce que vous cherchez : nous suivons aussi les demandes sur mesure, avant même la mise en ligne.",
    notRightCta: "Dites-nous ce que vous cherchez",
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Un logement vérifié, avant même d’entrer.",
    safetyText:
      "Ce bien suit le protocole Domus d’Origine Certifiée : documents, conformité et transparence contrôlés avant la vente. Vous visitez et choisissez en toute sérénité, sans surprises.",
    safetyLink: "Découvrir le protocole Domus D.O.C.",
    safetyPoints: ["Documents en ordre", "Conformité contrôlée", "Transparence avant visite"],
    related: "D’autres biens à découvrir",
    viewAll: "Voir tous les biens",
  },
  de: {
    backToAll: "Alle Immobilien",
    keyFacts: "Eckdaten",
    factGroups: {
      principali: "Eckdaten",
      esterni: "Außenbereiche und Zubehör",
      comfort: "Komfort und Anlagen",
      spazi: "Räume",
      forza: "Highlights",
    },
    moreFacts: "{n} weitere",
    moreFactsOne: "1 weitere",
    description: "Beschreibung",
    features: "Ausstattung",
    specSqm: "Wohnfläche",
    specRooms: "Zimmer",
    specBeds: "Schlafzimmer",
    specBaths: "Badezimmer",
    specType: "Typ",
    specStatus: "Status",
    specEnergy: "Energieklasse",
    requestVisit: "Besichtigung anfragen",
    whatsapp: "Mit Domus Tua sprechen",
    refLabel: "Ref.",
    assistTitle: "An Ihrer Seite bei jedem Schritt",
    assistPoints: [
      "Unterlagen und Informationen",
      "Organisierte Besichtigung",
      "Unterstützung beim Angebot",
      "Begleitung bis zum Notartermin",
    ],
    soldTitle: "Diese Immobilie wurde verkauft",
    soldText:
      "Sie ist verkauft — aber wir helfen Ihnen, eine ähnliche zu finden. Sagen Sie uns, was Sie suchen.",
    soldCta: "Ähnliche Immobilie suchen",
    notRightTitle: "Nicht die richtige?",
    notRightText:
      "Sagen Sie uns, was Sie suchen: Wir betreuen auch maßgeschneiderte Anfragen, noch bevor eine Immobilie online geht.",
    notRightCta: "Sagen Sie uns, was Sie suchen",
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Eine geprüfte Immobilie, noch bevor Sie eintreten.",
    safetyText:
      "Diese Immobilie folgt dem Protokoll Domus di Origine Certificata: Unterlagen, Konformität und Transparenz werden vor dem Verkauf geprüft. So besichtigen und entscheiden Sie mit Ruhe, ohne Überraschungen.",
    safetyLink: "Das Protokoll Domus D.O.C. entdecken",
    safetyPoints: ["Unterlagen in Ordnung", "Konformität geprüft", "Transparenz vor der Besichtigung"],
    related: "Weitere Immobilien entdecken",
    viewAll: "Alle Immobilien ansehen",
  },
  es: {
    backToAll: "Todas las propiedades",
    keyFacts: "Datos principales",
    factGroups: {
      principali: "Datos principales",
      esterni: "Exteriores y anexos",
      comfort: "Confort e instalaciones",
      spazi: "Espacios",
      forza: "Puntos fuertes",
    },
    moreFacts: "{n} más",
    moreFactsOne: "1 más",
    description: "Descripción",
    features: "Características",
    specSqm: "Superficie",
    specRooms: "Estancias",
    specBeds: "Dormitorios",
    specBaths: "Baños",
    specType: "Tipo",
    specStatus: "Estado",
    specEnergy: "Clase energética",
    requestVisit: "Solicita una visita",
    whatsapp: "Habla con Domus Tua",
    refLabel: "Ref.",
    assistTitle: "Contigo en cada paso",
    assistPoints: [
      "Documentos e información",
      "Visita organizada",
      "Asistencia en la propuesta",
      "Acompañamiento hasta la escritura",
    ],
    soldTitle: "Este inmueble se ha vendido",
    soldText:
      "Se ha vendido — pero podemos ayudarte a encontrar uno parecido. Cuéntanos qué buscas.",
    soldCta: "Busco una casa parecida",
    notRightTitle: "¿No es la adecuada?",
    notRightText:
      "Cuéntanos qué buscas: también gestionamos peticiones a medida, antes incluso de que el inmueble esté online.",
    notRightCta: "Cuéntanos qué buscas",
    safetyEyebrow: "Domus D.O.C.",
    safetyTitle: "Una casa verificada, antes incluso de entrar.",
    safetyText:
      "Esta propiedad sigue el protocolo Domus di Origine Certificata: documentos, conformidad y transparencia comprobados antes de la venta. Así visitas y eliges con tranquilidad, sin sorpresas.",
    safetyLink: "Descubre el protocolo Domus D.O.C.",
    safetyPoints: ["Documentos en orden", "Conformidad comprobada", "Transparencia previa a la visita"],
    related: "Más casas por descubrir",
    viewAll: "Ver todas las casas",
  },
};

// ⚠️ DATI DEMO / FIXTURE — `p` e `related` arrivano dalla facciata getVisibleListing/
// getVisibleListings (oggi fixture demo, domani RealSmart). Qui nessun dato viene
// inventato: la striscia "related" è opzionale e, se assente, mostra solo il link a /acquista.
export default function PropertyDetail({ p, related }: { p: Property; related?: Property[] }) {
  const { locale, d } = useLocale();
  const c = copy[locale];

  // Striscia sotto la gallery: SOLO i quattro numeri che si leggono a colpo d'occhio.
  // Tipologia, piano, contratto e classe energetica vivono nel box "Dati principali" della
  // sidebar: ripeterli qui era la duplicazione più evidente della vecchia scheda.
  // Il filtro su "—" resta perché Terreno/Commerciale non hanno locali, camere o bagni.
  // `p.rooms` vale "4 locali": giusto sulle card, dove il numero sta accanto a un'icona e
  // senza etichetta. Qui l'etichetta c'è già, e "Locali / 4 locali" ripete il sostantivo
  // dentro il suo stesso rigo. Si toglie solo in questa vista: la sorgente non cambia.
  const bare = (value: string) => value.replace(/\s+(?:local[ei]|camere?|bagn[oi])$/i, "");

  // Il filtro su "—" copre il caso normale (un terreno non ha locali → il feed
  // dà "—"); `factApplies` copre il caso di rumore (il feed che riporta comunque
  // camere/bagni su un commerciale): camere e bagni sono residenziali e non
  // vanno su un negozio o un terreno, i locali non su un terreno. Un posto solo
  // per la regola: lib/propertyKind.ts.
  const specs = (
    [
      { factKey: "superficie", core: "sqm", label: c.specSqm, value: p.sqm },
      { factKey: "locali", core: "rooms", label: c.specRooms, value: p.rooms },
      { factKey: "camere", core: "beds", label: c.specBeds, value: p.beds },
      { factKey: "bagni", core: "baths", label: c.specBaths, value: p.baths },
    ] satisfies { factKey: string; core: CoreFactKey; label: string; value: string }[]
  )
    .filter((s) => s.value && s.value !== "—" && factApplies(p.type, s.core))
    .map((s) => ({ ...s, value: bare(s.value) }));

  // Un fatto, un posto solo. I quattro numeri della striscia stanno sopra la piega, in
  // display, ed erano ripetuti tali e quali dentro "Dati principali" — con perfino una
  // formattazione diversa ("4 locali" contro "4"), che è peggio di una ripetizione: sembra
  // che due fonti non vadano d'accordo. La striscia li tiene, il box tiene tutto il resto.
  // L'elenco è DERIVATO da ciò che la striscia ha davvero reso: su un terreno senza locali
  // la striscia non li mostra, e allora il box torna a essere il loro unico posto.
  const specKeys = specs.map((s) => s.factKey);

  // Etichetta del <details> quando un gruppo supera le voci immediatamente visibili.
  const moreFactsLabel = (n: number) =>
    n === 1 ? c.moreFactsOne : c.moreFacts.replace("{n}", String(n));

  // Con i dati live ogni caratteristica è già distribuita nei box: la vecchia lista
  // "Caratteristiche" sotto la descrizione resta solo per le fixture demo, che non hanno fatti.
  const hasFacts = (p.facts?.length ?? 0) > 0;

  // Composizione della descrizione. La funzione è pura e deterministica: gira identica in
  // SSR e dopo l'idratazione (nessun mismatch), e il testo resta per intero nell'HTML
  // iniziale. useMemo perché il risultato dipende solo dai paragrafi dell'immobile.
  const copyBlocks = useMemo(() => formatListingDescription(p.description), [p.description]);

  // Specs strip: micro-ingresso dei soli VALORI (dd) della striscia sotto la
  // gallery. I numeri restano nell'HTML SSR: nascosti solo post-idratazione e
  // mai a lungo (start alto + timeout di sicurezza — pagina di conversione).
  // La strip vive fuori dalla grid dell'aside sticky: nessun transform su suoi antenati.
  const specsRef = useRef<HTMLDListElement | null>(null);
  useGSAP(
    () => {
      const strip = specsRef.current;
      if (!strip) return;
      const values = Array.from(strip.querySelectorAll<HTMLElement>("dd"));
      if (values.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.set(values, { opacity: 0, y: 8 });
        // Replay a ogni passaggio (richiesta cliente): tween persistente in
        // closure (niente clearProps, romperebbe restart/reverse) — restart a
        // ogni ingresso, reverse risalendo oltre l'inizio.
        let tween: gsap.core.Tween | null = null;
        const st = ScrollTrigger.create({
          trigger: strip,
          start: "top 92%",
          onEnter: () => {
            if (!tween) {
              tween = gsap.fromTo(
                values,
                { opacity: 0, y: 8 },
                {
                  opacity: 1,
                  y: 0,
                  duration: dur.micro,
                  ease: "domus",
                  stagger: stagger.chars,
                  paused: true,
                }
              );
            }
            tween.restart();
          },
          onLeaveBack: () => tween?.reverse(),
        });

        // Rete di sicurezza: i dati chiave non restano mai nascosti se il
        // trigger non scatta mai; a tween creato ci pensano restart/reverse.
        const showAll = () => {
          if (tween) return;
          st.kill();
          gsap.set(values.filter((el) => !gsap.isTweening(el)), { clearProps: "opacity,transform" });
        };
        const safety = window.setTimeout(showAll, 2500);
        return () => {
          window.clearTimeout(safety);
          st.kill();
          tween?.kill();
        };
      });
    },
    { scope: specsRef }
  );

  // Related: solo altre case fornite via props (stessa sorgente). Mai fetch/invenzione.
  // Difesa in profondità: anche se a monte arrivasse un venduto, qui non viene mai reso —
  // stesso predicato di disponibilità della selezione (app/lib/related.ts), niente stato
  // "venduto" duplicato a mano.
  const relatedItems = (related ?? [])
    .filter((r) => r.slug !== p.slug && isAvailable(r))
    .slice(0, 3);

  // WhatsApp precompilato con titolo + riferimento immobile → conversazione già in contesto.
  const waTalk = buildWhatsAppUrl(
    site.whatsapp.href,
    `Ciao Domus Tua, sono interessato/a a "${p.title}"${p.ref ? ` (rif. ${p.ref})` : ""}. Vorrei più informazioni o una visita.`,
  );
  // CTA per immobile venduto: cerco una casa simile.
  const waSimilar = buildWhatsAppUrl(
    site.whatsapp.href,
    `Ciao Domus Tua, "${p.title}" risulta venduto: sto cercando una casa simile, potete aiutarmi?`,
  );

  return (
    <main className="flex-1 bg-paper">
      <div className="mx-auto max-w-[1240px] px-5 pt-32 sm:px-8 sm:pt-36">
        {/* Breadcrumb: orientamento Home › Case › immobile corrente (allineato al JSON-LD). */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone">
          <Link href="/" className="transition-colors hover:text-ink">
            Domus Tua
          </Link>
          <span aria-hidden className="text-line">/</span>
          <Link href="/acquista" className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
            <ArrowRight className="h-3.5 w-3.5 rotate-180" aria-hidden />
            {d.nav.case}
          </Link>
          <span aria-hidden className="text-line">/</span>
          <span aria-current="page" className="max-w-[16rem] truncate font-medium text-graphite">
            {p.title}
          </span>
        </nav>

        {/* Stato "venduto": messaggio chiaro + CTA "cerco una casa simile" (WhatsApp).
            Difensivo: oggi gli immobili venduti sono esclusi dalle pagine generate, ma se il
            cliente decidesse di mostrarli come prova sociale la scheda resta convertente. */}
        {p.sold && (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-red/30 bg-red-soft/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-medium text-red-dark">{c.soldTitle}</p>
              <p className="mt-1 max-w-lg text-sm text-graphite">{c.soldText}</p>
            </div>
            <Cta
              href={waSimilar}
              variant="cta-solid"
              size="sm"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 self-start sm:self-auto"
            >
              {c.soldCta}
            </Cta>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-red">
              {p.zone}
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
              {p.title}
            </h1>
          </div>
          <span className="tnum font-display text-4xl font-medium text-ink">{p.price}</span>
        </div>

        {/* Gallery hero */}
        <div className="mt-8">
          {/* Alt della foto principale da campi VERIFICATI (titolo + zona
              dell'annuncio), non dal nome file né generato a runtime. */}
          <PropertyGallery
            images={p.gallery}
            title={p.title}
            principalAlt={p.zone ? `${p.title}, ${p.zone}` : p.title}
          />
        </div>

        {/* Key facts strip sotto la gallery */}
        <div className="mt-6 overflow-x-auto">
          <dl ref={specsRef} className="flex min-w-max gap-8 rounded-[2rem] border border-line bg-cream px-7 py-5 sm:min-w-0 sm:justify-between">
            {specs.map((s) => (
              <div key={s.label} className="shrink-0">
                <dt className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-graphite">
                  {s.label}
                </dt>
                <dd className="tnum mt-1 font-display text-xl font-medium text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Contenuti: narrativa a sinistra, dati strutturati e conversione a destra.
          L'ordine su mobile (aside prima, descrizione poi, blocco fiducia in coda) è dichiarato
          con `order-*`; su desktop la colonna sinistra occupa entrambe le righe della griglia,
          così la card di conversione e il blocco fiducia restano incolonnati a destra. */}
      <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr] lg:items-start lg:gap-16">
          {/* ── Colonna destra: conversione + box dei dati ───────────────────────── */}
          <aside className="order-1 flex flex-col gap-4 lg:order-none lg:col-start-2 lg:row-start-1">
            {/* NIENTE sticky. Un elemento sticky continua a occupare il suo posto nel flusso ma
                si sposta mentre si scorre: seguito dai box dei dati, finirebbe per COPRIRLI.
                La conversione resta comunque sempre a portata: la card è in cima alla colonna,
                il pulsante WhatsApp è fisso in basso e il modulo contatti chiude la pagina. */}
            <div className="rounded-[2rem] border border-line bg-cream p-7">
              {p.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {p.badges.map((b) => (
                    <Badge key={b} variant="outline">
                      {b}
                    </Badge>
                  ))}
                </div>
              )}

              {p.ref && (
                <p className={`text-sm font-medium text-stone ${p.badges.length > 0 ? "mt-5" : ""}`}>
                  {c.refLabel} {p.ref}
                </p>
              )}

              <Cta href="#contatti" variant="cta" size="md" className="mt-5 w-full">
                {c.requestVisit}
              </Cta>
              <Cta
                href={waTalk}
                variant="ghost"
                size="md"
                arrow={false}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full"
              >
                <Whatsapp className="h-5 w-5 text-red" /> {c.whatsapp}
              </Cta>
            </div>

            {/* Box dei dati: uno per gruppo con contenuto, mai box vuoti, mai "—". */}
            <PropertyFacts
              facts={p.facts}
              labels={c.factGroups}
              moreLabel={moreFactsLabel}
              hiddenKeys={specKeys}
            />
          </aside>

          {/* ── Colonna sinistra: il racconto ─────────────────────────────────────── */}
          <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-2">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              {c.description}
            </h2>
            <div className="mt-6">
              <ListingCopy blocks={copyBlocks.blocks} />
            </div>

            {/* Il gradino di conversione in coda al racconto. Su mobile la card con le CTA
                sta in cima alla colonna e a fine descrizione è lontanissima: qui l'invito
                torna sotto il pollice, con le stesse etichette e le stesse primitive. */}
            {copyBlocks.blocks.length > 0 && (
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Cta href="#contatti" variant="cta" size="md">
                  {c.requestVisit}
                </Cta>
                <Cta
                  href={waTalk}
                  variant="ghost"
                  size="md"
                  arrow={false}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Whatsapp className="h-5 w-5 text-red" /> {c.whatsapp}
                </Cta>
              </div>
            )}

            {/* Fallback per le fixture demo, che non hanno fatti strutturati: con i dati live
                queste voci sono già distribuite nei box e la lista non viene renderizzata. */}
            {!hasFacts && p.features.length > 0 && (
              <>
                <h2 className="mt-12 font-display text-2xl font-medium tracking-tight text-ink">
                  {c.features}
                </h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[0.95rem] text-graphite">
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red"
                      >
                        <SegnoTick className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Blocco sicurezza / documenti — legato a Domus D.O.C. */}
            <div className="relative mt-12 overflow-hidden rounded-[2rem] border border-line bg-cream p-7 sm:p-9">
              {/* Wrapper inline statico: il corner resta absolute rispetto al box relative. */}
              <DrawOnScroll>
                <SegnoDomusCorner className="right-5 top-5 opacity-70" rotate={90} size={30} />
              </DrawOnScroll>
              <SegnoDomusBadge>{c.safetyEyebrow}</SegnoDomusBadge>
              <h2 className="mt-4 max-w-xl font-display text-2xl font-medium leading-snug tracking-tight text-ink balance">
                {c.safetyTitle}
              </h2>
              <p className="mt-3 max-w-xl text-[0.98rem] leading-relaxed text-graphite">
                {c.safetyText}
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5">
                {c.safetyPoints.map((point) => (
                  <li key={point} className="inline-flex items-center gap-2 text-[1rem] text-ink">
                    <span
                      aria-hidden
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red"
                    >
                      <SegnoTick className="h-3 w-3" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href="/metodo"
                className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
              >
                {c.safetyLink}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* ── Elemento secondario finale della sidebar ──────────────────────────── */}
          <div className="order-3 rounded-[2rem] border border-line bg-paper p-6 lg:order-none lg:col-start-2 lg:row-start-2">
            <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-graphite">
              {c.assistTitle}
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {c.assistPoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[1rem] leading-snug text-graphite">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-soft text-red"
                  >
                    <SegnoTick className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Related properties strip: solo se fornite via props (stessa sorgente). */}
      {relatedItems.length > 0 && (
        <section data-testid="related-listings" className="mx-auto max-w-[1240px] px-5 pb-4 sm:px-8">
          <SegnoDomusDivider className="mb-12" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              {c.related}
            </h2>
            <Link
              href="/acquista"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-red transition-colors hover:text-red-dark"
            >
              {c.viewAll}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Ingresso batch per-card (once + safety focus/timeout in ListingsGrid:
              le card contengono link). Il contenitore non viene mai animato. */}
          <ListingsGrid className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((r) => (
              <PropertyCard key={r.slug} p={r} />
            ))}
          </ListingsGrid>
        </section>
      )}

      {/* Lead block "Non è quella giusta?" — converte anche chi non ama questa specifica casa. */}
      <section className="mx-auto max-w-[1240px] px-5 pb-4 pt-16 sm:px-8">
        <div className="flex flex-col items-start gap-4 rounded-[2rem] border border-line bg-cream p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink">
              {c.notRightTitle}
            </h2>
            <p className="mt-2 max-w-xl text-graphite">{c.notRightText}</p>
          </div>
          <Cta href="#contatti" variant="cta" size="md" className="shrink-0">
            {c.notRightCta}
          </Cta>
        </div>
      </section>

      {/* Dalla scheda l'intento parte da "cerco casa" (buyer), il lead porta il
          riferimento immobile e la zona precompila la zona desiderata. */}
      <Contact initialIntent="buyer" propertyRef={`${p.title} (${p.slug})`} initialPlace={p.zone} />
    </main>
  );
}
