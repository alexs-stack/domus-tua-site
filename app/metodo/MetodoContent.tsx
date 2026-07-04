"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import Method from "../components/Method";
import DomusDocProtocol from "../components/DomusDocProtocol";
import OpenDomus from "../components/OpenDomus";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";
import SectionDivider from "../components/SectionDivider";
import { SegnoDomusBadge } from "../components/BrandMotif";
import { ArrowUpRight } from "../components/Icons";
import { useLocale } from "../components/i18n/LocaleProvider";

const copy = {
  it: {
    heroEyebrow: "Il sistema Domus Tua",
    heroTitle: () => (
      <>
        Non un annuncio.
        <br />
        <span className="text-red-soft">Un metodo.</span>
      </>
    ),
    heroSubcopy:
      "Ogni vendita e ogni acquisto seguono un percorso chiaro fatto di cura, documenti, marketing e assistenza fino al rogito. È il modo in cui lavoriamo dal 2007.",
    heroAlt: "Attico con travi a vista e salotto elegante",
    heroPrimary: "Inizia dal tuo immobile",
    heroSecondary: "Vedi i nove passi",
    highlightsEyebrow: "Cinque fasi, una garanzia",
    highlightsTitle: "Cura, trasparenza, accompagnamento.",
    highlightsIntro:
      "Il metodo si sviluppa in cinque fasi ancorate al protocollo Domus D.O.C.: intervista analitica per capire la tua casa, i tuoi obiettivi e i tuoi tempi; valutazione e certificazione D.O.C., con stima professionale sul valore reale e verifica tecnico-legale; Marketing+ con foto, video emozionale, home staging e campagne mirate su portali e social; il sistema Open Domus, con visite organizzate e selezionate senza viavai di curiosi; e la multi-proposta, che mette più offerte a confronto per vendere al prezzo concordato.",
    item1Title: "Documenti verificati",
    item1Copy:
      "Controlliamo tutto prima: conformità, titoli, pratiche. Si arriva al rogito senza sorprese.",
    item2Title: "Marketing che racconta",
    item2Copy:
      "Foto, video, rendering e campagne mirate per portare la casa davanti alle persone giuste.",
    item3Title: "Assistenza fino al rogito",
    item3Copy:
      "Un riferimento umano in ogni passaggio, dalla prima telefonata alla firma.",
    docEyebrow: "Al centro del metodo",
    docTitle: "Domus D.O.C., la nostra garanzia di fiducia.",
    docCopy:
      "Ogni fase del metodo confluisce nel protocollo Domus di Origine Certificata: dalla valutazione e certificazione D.O.C. fino alla multi-proposta, documenti, conformità, trasparenza, preparazione e tutela sono verificati prima di mettere in vendita.",
    docLink: "Scopri il protocollo Domus D.O.C.",
  },
  en: {
    heroEyebrow: "The Domus Tua system",
    heroTitle: () => (
      <>
        Not a listing.
        <br />
        <span className="text-red-soft">A method.</span>
      </>
    ),
    heroSubcopy:
      "Every sale and every purchase follows a clear path built on care, paperwork, marketing and support right through to the deed. It’s how we’ve worked since 2007.",
    heroAlt: "Penthouse with exposed beams and an elegant living room",
    heroPrimary: "Start with your property",
    heroSecondary: "See the nine steps",
    highlightsEyebrow: "Five phases, one guarantee",
    highlightsTitle: "Care, transparency, guidance.",
    highlightsIntro:
      "The method unfolds in five phases anchored to the Domus D.O.C. protocol: an analytical interview to understand your home, your goals and your timing; valuation and D.O.C. certification, with a professional estimate of the real value and a technical and legal check; Marketing+ with photography, an emotional video, home staging and targeted campaigns across portals and social; the Open Domus system, with organised and selected viewings and no parade of the merely curious; and the multi-offer stage, which puts several offers side by side to sell at the agreed price.",
    item1Title: "Verified documents",
    item1Copy:
      "We check everything up front: compliance, titles, procedures. You reach the deed with no surprises.",
    item2Title: "Marketing that tells a story",
    item2Copy:
      "Photography, video, renderings and targeted campaigns to place the home in front of the right people.",
    item3Title: "Support through to the deed",
    item3Copy:
      "A human point of reference at every step, from the first phone call to the signature.",
    docEyebrow: "At the heart of the method",
    docTitle: "Domus D.O.C., our promise of trust.",
    docCopy:
      "Every phase of the method flows into the Domus of Certified Origin protocol: from valuation and D.O.C. certification through to the multi-offer stage, documents, compliance, transparency, preparation and protection are all verified before listing.",
    docLink: "Discover the Domus D.O.C. protocol",
  },
  fr: {
    heroEyebrow: "Le système Domus Tua",
    heroTitle: () => (
      <>
        Pas une annonce.
        <br />
        <span className="text-red-soft">Une méthode.</span>
      </>
    ),
    heroSubcopy:
      "Chaque vente et chaque achat suivent un parcours clair fait de soin, de documents, de marketing et d’accompagnement jusqu’à l’acte notarié. C’est notre façon de travailler depuis 2007.",
    heroAlt: "Attique avec poutres apparentes et salon élégant",
    heroPrimary: "Commencez par votre bien",
    heroSecondary: "Voir les neuf étapes",
    highlightsEyebrow: "Cinq phases, une garantie",
    highlightsTitle: "Soin, transparence, accompagnement.",
    highlightsIntro:
      "La méthode se déploie en cinq phases ancrées au protocole Domus D.O.C. : un entretien analytique pour comprendre votre bien, vos objectifs et vos délais ; l’estimation et la certification D.O.C., avec une évaluation professionnelle de la valeur réelle et une vérification technique et juridique ; Marketing+ avec photos, vidéo émotionnelle, home staging et campagnes ciblées sur les portails et les réseaux ; le système Open Domus, avec des visites organisées et sélectionnées, sans défilé de curieux ; et la multi-proposition, qui met plusieurs offres en regard pour vendre au prix convenu.",
    item1Title: "Documents vérifiés",
    item1Copy:
      "Nous vérifions tout en amont : conformité, titres, démarches. On arrive à l’acte sans mauvaises surprises.",
    item2Title: "Un marketing qui raconte",
    item2Copy:
      "Photos, vidéos, rendus et campagnes ciblées pour présenter la maison aux bonnes personnes.",
    item3Title: "Un accompagnement jusqu’à l’acte",
    item3Copy:
      "Un interlocuteur humain à chaque étape, du premier appel à la signature.",
    docEyebrow: "Au cœur de la méthode",
    docTitle: "Domus D.O.C., notre garantie de confiance.",
    docCopy:
      "Chaque phase de la méthode se rejoint dans le protocole Domus d’Origine Certifiée : de l’estimation et la certification D.O.C. jusqu’à la multi-proposition, documents, conformité, transparence, préparation et protection sont vérifiés avant la mise en vente.",
    docLink: "Découvrir le protocole Domus D.O.C.",
  },
  de: {
    heroEyebrow: "Das Domus-Tua-System",
    heroTitle: () => (
      <>
        Kein Inserat.
        <br />
        <span className="text-red-soft">Eine Methode.</span>
      </>
    ),
    heroSubcopy:
      "Jeder Verkauf und jeder Kauf folgt einem klaren Weg aus Sorgfalt, Unterlagen, Marketing und Begleitung bis zum Notartermin. So arbeiten wir seit 2007.",
    heroAlt: "Penthouse mit sichtbaren Balken und elegantem Wohnzimmer",
    heroPrimary: "Beginnen Sie mit Ihrer Immobilie",
    heroSecondary: "Die neun Schritte ansehen",
    highlightsEyebrow: "Fünf Phasen, eine Garantie",
    highlightsTitle: "Sorgfalt, Transparenz, Begleitung.",
    highlightsIntro:
      "Die Methode entfaltet sich in fünf Phasen, verankert im Protokoll Domus D.O.C.: ein analytisches Gespräch, um Ihre Immobilie, Ihre Ziele und Ihren Zeitrahmen zu verstehen; Bewertung und D.O.C.-Zertifizierung, mit einer professionellen Schätzung des realen Werts und einer technisch-rechtlichen Prüfung; Marketing+ mit Fotos, emotionalem Video, Home Staging und gezielten Kampagnen auf Portalen und Social Media; das System Open Domus, mit organisierten und ausgewählten Besichtigungen ohne Kommen und Gehen Neugieriger; und die Multi-Angebot-Phase, die mehrere Angebote gegenüberstellt, um zum vereinbarten Preis zu verkaufen.",
    item1Title: "Geprüfte Unterlagen",
    item1Copy:
      "Wir prüfen alles vorab: Konformität, Eigentumstitel, Verfahren. So kommt man ohne Überraschungen zum Notartermin.",
    item2Title: "Marketing, das erzählt",
    item2Copy:
      "Fotos, Videos, Renderings und gezielte Kampagnen, um das Haus den richtigen Menschen zu zeigen.",
    item3Title: "Begleitung bis zum Notartermin",
    item3Copy:
      "Ein menschlicher Ansprechpartner bei jedem Schritt, vom ersten Anruf bis zur Unterschrift.",
    docEyebrow: "Im Zentrum der Methode",
    docTitle: "Domus D.O.C., unser Versprechen für Vertrauen.",
    docCopy:
      "Jede Phase der Methode mündet in das Protokoll Domus mit zertifizierter Herkunft: von der Bewertung und D.O.C.-Zertifizierung bis zur Multi-Angebot-Phase werden Unterlagen, Konformität, Transparenz, Vorbereitung und Schutz vor dem Verkauf geprüft.",
    docLink: "Das Protokoll Domus D.O.C. entdecken",
  },
  es: {
    heroEyebrow: "El sistema Domus Tua",
    heroTitle: () => (
      <>
        No un anuncio.
        <br />
        <span className="text-red-soft">Un método.</span>
      </>
    ),
    heroSubcopy:
      "Cada venta y cada compra siguen un recorrido claro hecho de cuidado, documentos, marketing y acompañamiento hasta la escritura. Es como trabajamos desde 2007.",
    heroAlt: "Ático con vigas a la vista y salón elegante",
    heroPrimary: "Empieza por tu inmueble",
    heroSecondary: "Ver los nueve pasos",
    highlightsEyebrow: "Cinco fases, una garantía",
    highlightsTitle: "Cuidado, transparencia, acompañamiento.",
    highlightsIntro:
      "El método se desarrolla en cinco fases ancladas al protocolo Domus D.O.C.: una entrevista analítica para entender tu casa, tus objetivos y tus tiempos; valoración y certificación D.O.C., con una estimación profesional del valor real y una verificación técnica y legal; Marketing+ con fotos, vídeo emotivo, home staging y campañas específicas en portales y redes; el sistema Open Domus, con visitas organizadas y seleccionadas, sin ir y venir de curiosos; y la multipropuesta, que pone varias ofertas en comparación para vender al precio acordado.",
    item1Title: "Documentos verificados",
    item1Copy:
      "Lo comprobamos todo antes: conformidad, títulos, trámites. Se llega a la escritura sin sorpresas.",
    item2Title: "Un marketing que cuenta",
    item2Copy:
      "Fotos, vídeos, renders y campañas específicas para poner la casa delante de las personas adecuadas.",
    item3Title: "Acompañamiento hasta la escritura",
    item3Copy:
      "Una referencia humana en cada paso, desde la primera llamada hasta la firma.",
    docEyebrow: "En el centro del método",
    docTitle: "Domus D.O.C., nuestra garantía de confianza.",
    docCopy:
      "Cada fase del método confluye en el protocolo Domus de Origen Certificado: desde la valoración y certificación D.O.C. hasta la multipropuesta, los documentos, la conformidad, la transparencia, la preparación y la protección se verifican antes de poner en venta.",
    docLink: "Descubre el protocolo Domus D.O.C.",
  },
};

export default function MetodoContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow={c.heroEyebrow}
          title={c.heroTitle()}
          subcopy={c.heroSubcopy}
          image="/images/hero_01_attico_travi_salotto.jpg"
          alt={c.heroAlt}
          primary={{ label: c.heroPrimary, href: "#contatti" }}
          secondary={{ label: c.heroSecondary, href: "#metodo" }}
        />

        <Highlights
          tone="paper"
          eyebrow={c.highlightsEyebrow}
          title={c.highlightsTitle}
          intro={c.highlightsIntro}
          items={[
            {
              title: c.item1Title,
              copy: c.item1Copy,
            },
            {
              title: c.item2Title,
              copy: c.item2Copy,
            },
            {
              title: c.item3Title,
              copy: c.item3Copy,
            },
          ]}
        />

        <Method />

        {/* Ponte narrativo verso il protocollo Domus D.O.C. */}
        <section className="bg-cream">
          <div className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-8 sm:pt-24">
            <div className="mx-auto max-w-2xl text-center">
              <SegnoDomusBadge className="mx-auto">{c.docEyebrow}</SegnoDomusBadge>
              <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-5xl">
                {c.docTitle}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[1.02rem] leading-relaxed text-stone">
                {c.docCopy}
              </p>
              <a
                href="#domus-doc"
                className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-red-dark transition-colors hover:text-red"
              >
                {c.docLink}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </section>

        <DomusDocProtocol tone="cream" id="domus-doc" />
        <OpenDomus />
        <Reviews />
        <div className="bg-cream-deep">
          <SectionDivider tone="cream-deep" />
        </div>
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
