"use client";

import Reveal from "./Reveal";
import { ArrowUpRight } from "./Icons";
import { useLocale } from "./i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Il Metodo Domus Tua",
    title: "Un percorso chiaro, dalla prima stima alla firma.",
    subcopy:
      "Ogni vendita e ogni acquisto seguono nove passaggi precisi: niente improvvisazione, solo un metodo costruito in oltre quindici anni di lavoro sul territorio.",
    cta: "Inizia dal tuo immobile",
    full: "Scopri il metodo completo",
    steps: [
      { title: "Primo ascolto", copy: "Partiamo da te: obiettivi, tempi, aspettative. Prima delle case vengono le persone." },
      { title: "Valutazione", copy: "Analisi del mercato locale e del tuo immobile per definire valore e strategia, senza illusioni." },
      { title: "Verifica documentale", copy: "Titoli, conformità e documenti controllati prima di partire: si arriva alla firma senza sorprese." },
      { title: "Preparazione immobile", copy: "Valorizziamo gli spazi con consigli mirati e, dove serve, home staging." },
      { title: "Racconto visivo", copy: "Foto, video emozionali e rendering: la casa raccontata con la cura che merita." },
      { title: "Marketing e social preview", copy: "Campagne multicanale e anteprime social per portarla davanti alle persone giuste." },
      { title: "Open Domus e visite qualificate", copy: "Visite ordinate e l'evento Open Domus per acquirenti realmente interessati." },
      { title: "Proposta e trattativa", copy: "Gestiamo proposte e negoziazione con trasparenza, tutelando i tuoi interessi." },
      { title: "Rogito", copy: "Ti accompagniamo passo dopo passo fino alla firma, con assistenza completa." },
    ],
  },
  en: {
    eyebrow: "The Domus Tua Method",
    title: "A clear journey, from the first estimate to signing.",
    subcopy:
      "Every sale and every purchase follows nine precise steps: no improvisation, only a method built over more than fifteen years of work in the local area.",
    cta: "Start with your property",
    full: "Discover the full method",
    steps: [
      { title: "First, we listen", copy: "We start with you: goals, timing, expectations. People come before homes." },
      { title: "Valuation", copy: "Analysis of the local market and your property to define value and strategy, without illusions." },
      { title: "Document check", copy: "Titles, compliance and documents verified before we begin: we reach the signing without surprises." },
      { title: "Property preparation", copy: "We enhance your spaces with targeted advice and, where needed, home staging." },
      { title: "Visual storytelling", copy: "Photos, emotional videos and renderings: the home told with the care it deserves." },
      { title: "Marketing and social preview", copy: "Multichannel campaigns and social previews to bring it in front of the right people." },
      { title: "Open Domus and qualified viewings", copy: "Orderly viewings and the Open Domus event for genuinely interested buyers." },
      { title: "Offer and negotiation", copy: "We handle offers and negotiation with transparency, protecting your interests." },
      { title: "Deed of sale", copy: "We accompany you step by step all the way to signing, with complete assistance." },
    ],
  },
  fr: {
    eyebrow: "La Méthode Domus Tua",
    title: "Un parcours clair, de la première estimation à la signature.",
    subcopy:
      "Chaque vente et chaque achat suivent neuf étapes précises : aucune improvisation, seulement une méthode construite en plus de quinze ans de travail sur le territoire.",
    cta: "Commencez par votre bien",
    full: "Découvrir la méthode complète",
    steps: [
      { title: "Première écoute", copy: "Nous partons de vous : objectifs, délais, attentes. Avant les maisons viennent les personnes." },
      { title: "Estimation", copy: "Analyse du marché local et de votre bien pour définir valeur et stratégie, sans illusions." },
      { title: "Vérification documentaire", copy: "Titres, conformité et documents contrôlés avant de commencer : on arrive à la signature sans surprises." },
      { title: "Préparation du bien", copy: "Nous valorisons les espaces avec des conseils ciblés et, si nécessaire, du home staging." },
      { title: "Récit visuel", copy: "Photos, vidéos émotionnelles et rendus : la maison racontée avec le soin qu'elle mérite." },
      { title: "Marketing et aperçu social", copy: "Campagnes multicanales et aperçus sur les réseaux pour la présenter aux bonnes personnes." },
      { title: "Open Domus et visites qualifiées", copy: "Des visites ordonnées et l'événement Open Domus pour des acheteurs réellement intéressés." },
      { title: "Offre et négociation", copy: "Nous gérons offres et négociation en toute transparence, en protégeant vos intérêts." },
      { title: "Acte de vente", copy: "Nous vous accompagnons pas à pas jusqu'à la signature, avec une assistance complète." },
    ],
  },
  de: {
    eyebrow: "Die Domus Tua Methode",
    title: "Ein klarer Weg, von der ersten Schätzung bis zur Unterschrift.",
    subcopy:
      "Jeder Verkauf und jeder Kauf folgt neun präzisen Schritten: keine Improvisation, nur eine Methode, die in über fünfzehn Jahren Arbeit vor Ort gewachsen ist.",
    cta: "Beginnen Sie mit Ihrer Immobilie",
    full: "Die ganze Methode entdecken",
    steps: [
      { title: "Erstes Zuhören", copy: "Wir beginnen bei Ihnen: Ziele, Zeitrahmen, Erwartungen. Vor den Häusern kommen die Menschen." },
      { title: "Bewertung", copy: "Analyse des lokalen Marktes und Ihrer Immobilie, um Wert und Strategie festzulegen, ohne Illusionen." },
      { title: "Dokumentenprüfung", copy: "Titel, Konformität und Unterlagen werden vorab geprüft: So kommt man ohne Überraschungen zur Unterschrift." },
      { title: "Vorbereitung der Immobilie", copy: "Wir werten die Räume mit gezielten Ratschlägen und, wo nötig, Home Staging auf." },
      { title: "Visuelles Storytelling", copy: "Fotos, emotionale Videos und Renderings: das Zuhause erzählt mit der Sorgfalt, die es verdient." },
      { title: "Marketing und Social-Vorschau", copy: "Multikanal-Kampagnen und Social-Vorschauen, um sie den richtigen Menschen zu zeigen." },
      { title: "Open Domus und qualifizierte Besichtigungen", copy: "Geordnete Besichtigungen und das Event Open Domus für wirklich interessierte Käufer." },
      { title: "Angebot und Verhandlung", copy: "Wir führen Angebote und Verhandlungen transparent und schützen Ihre Interessen." },
      { title: "Kaufvertrag", copy: "Wir begleiten Sie Schritt für Schritt bis zur Unterschrift, mit umfassender Betreuung." },
    ],
  },
  es: {
    eyebrow: "El Método Domus Tua",
    title: "Un recorrido claro, desde la primera tasación hasta la firma.",
    subcopy:
      "Cada venta y cada compra siguen nueve pasos precisos: nada de improvisación, solo un método construido en más de quince años de trabajo en el territorio.",
    cta: "Empieza por tu inmueble",
    full: "Descubre el método completo",
    steps: [
      { title: "Primera escucha", copy: "Partimos de ti: objetivos, plazos, expectativas. Antes que las casas están las personas." },
      { title: "Valoración", copy: "Análisis del mercado local y de tu inmueble para definir valor y estrategia, sin ilusiones." },
      { title: "Verificación documental", copy: "Títulos, conformidad y documentos comprobados antes de empezar: se llega a la firma sin sorpresas." },
      { title: "Preparación del inmueble", copy: "Valorizamos los espacios con consejos específicos y, cuando hace falta, home staging." },
      { title: "Relato visual", copy: "Fotos, vídeos emotivos y renders: la casa contada con el cuidado que merece." },
      { title: "Marketing y anticipo social", copy: "Campañas multicanal y anticipos en redes para presentarla ante las personas adecuadas." },
      { title: "Open Domus y visitas cualificadas", copy: "Visitas ordenadas y el evento Open Domus para compradores realmente interesados." },
      { title: "Escritura", copy: "Te acompañamos paso a paso hasta la firma, con asistencia completa." },
    ],
  },
} as const;

const stepNumbers = ["01", "02", "03", "04", "05", "06", "07", "08", "09"] as const;

export default function Method({ variant = "full" }: { variant?: "full" | "home" }) {
  const { locale } = useLocale();
  const c = copy[locale];
  const home = variant === "home";

  // In homepage: 3 fasi memorabili (valutazione → Open Domus → rogito) + link al metodo completo.
  // Su /metodo: tutti i 9 passi. Un'unica sorgente di copy, nessuna traduzione duplicata.
  // Fasi-firma per la home: Valutazione (idx 1), Open Domus (idx 6), Rogito (idx 8).
  const steps = home ? [c.steps[1]!, c.steps[6]!, c.steps[8]!] : c.steps;
  const numbers = home ? ["01", "02", "03"] : stepNumbers;
  const ctaHref = home ? "/metodo" : "#contatti";
  const ctaLabel = home ? c.full : c.cta;

  return (
    <section id="metodo" className="relative bg-cream-deep text-ink">
      <div
        className={`mx-auto grid max-w-5xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 ${
          home ? "py-16 sm:py-20" : "py-24 sm:py-32"
        }`}
      >
        {/* Intro sticky */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight balance sm:text-5xl">
              {c.title}
            </h2>
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
              {c.subcopy}
            </p>
            <a
              href={ctaHref}
              className="group mt-9 inline-flex items-center gap-2 rounded-full bg-red py-3 pl-6 pr-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
            >
              {ctaLabel}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>
        </div>

        {/* Timeline (3 fasi in home, 9 passi completi altrove) */}
        <ol className="flex flex-col">
          {steps.map((s, i) => (
            <Reveal key={numbers[i]} delay={Math.min(i, 6) * 45} as="li">
              <div className="group flex gap-6 border-t border-line py-7 transition-colors duration-500 hover:border-red/30">
                <span className="font-display text-2xl font-medium text-graphite transition-colors duration-500 group-hover:text-red sm:text-3xl">
                  {numbers[i]}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-medium tracking-tight sm:text-2xl">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-stone">
                    {s.copy}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
