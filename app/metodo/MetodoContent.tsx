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
import ManifestoPin from "../components/motion/ManifestoPin";
import ThreadNav from "../components/motion/ThreadNav";
import { useLocale, useDict } from "../components/i18n/LocaleProvider";

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
    heroPrimary: "Richiedi la valutazione del tuo immobile",
    heroSecondary: "Vedi i nove passi",
    highlightsEyebrow: "Nove passaggi, tre momenti",
    highlightsTitle: "Cura, trasparenza, accompagnamento.",
    highlightsIntro:
      "Il metodo si sviluppa in nove passaggi, raccolti in tre momenti — prima le persone, poi il racconto, infine la firma — e ancorati al protocollo Domus D.O.C.: intervista analitica per capire la tua casa, i tuoi obiettivi e i tuoi tempi; valutazione e verifica D.O.C., con stima professionale sul valore reale e controllo tecnico-legale; Marketing+ con foto, video emozionale, home staging e campagne mirate su portali e social; il sistema Open Domus, con visite organizzate e selezionate senza viavai di curiosi; e la multi-proposta, che mette più offerte a confronto per vendere al prezzo concordato.",
    item1Title: "Documenti verificati",
    item1Copy:
      "Controlliamo conformità, titoli e pratiche prima di pubblicare: se c'è un problema, c'è ancora tempo per risolverlo.",
    item2Title: "Marketing che racconta",
    item2Copy:
      "Foto, video, rendering e campagne mirate per portare la casa davanti alle persone giuste.",
    item3Title: "Assistenza fino al rogito",
    item3Copy:
      "Un riferimento umano in ogni passaggio, dalla prima telefonata alla firma.",
    docEyebrow: "Al centro del metodo",
    manifesto:
      "Ascolto, documenti verificati, persone giuste: ogni passo è cucito al successivo, fino alla firma. Noi la chiamiamo fiducia.",
    manifestoHighlight: "fiducia",
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
    heroPrimary: "Request a valuation of your property",
    heroSecondary: "See the nine steps",
    highlightsEyebrow: "Nine steps, three moments",
    highlightsTitle: "Care, transparency, guidance.",
    highlightsIntro:
      "The method unfolds in nine steps, gathered into three moments — first the people, then the story, finally the signature — anchored to the Domus D.O.C. protocol: an analytical interview to understand your home, your goals and your timing; valuation and the D.O.C. check, with a professional estimate of the real value and a technical and legal review; Marketing+ with photography, an emotional video, home staging and targeted campaigns across portals and social; the Open Domus system, with organised and selected viewings and no parade of the merely curious; and the multi-offer stage, which puts several offers side by side to sell at the agreed price.",
    item1Title: "Verified documents",
    item1Copy:
      "We check compliance, titles and procedures before listing: if there is a problem, there is still time to fix it.",
    item2Title: "Marketing that tells a story",
    item2Copy:
      "Photography, video, renderings and targeted campaigns to place the home in front of the right people.",
    item3Title: "Support through to the deed",
    item3Copy:
      "A human point of reference at every step, from the first phone call to the signature.",
    docEyebrow: "At the heart of the method",
    manifesto:
      "Listening, verified documents, the right people: every step is stitched to the next, all the way to the signature. We call it trust.",
    manifestoHighlight: "trust",
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
    heroPrimary: "Demandez l’estimation de votre bien",
    heroSecondary: "Voir les neuf étapes",
    highlightsEyebrow: "Neuf étapes, trois moments",
    highlightsTitle: "Soin, transparence, accompagnement.",
    highlightsIntro:
      "La méthode se déploie en neuf étapes, réunies en trois moments — d'abord les personnes, puis le récit, enfin la signature — ancrées au protocole Domus D.O.C. : un entretien analytique pour comprendre votre bien, vos objectifs et vos délais ; l’estimation et le contrôle D.O.C., avec une évaluation professionnelle de la valeur réelle et une vérification technique et juridique ; Marketing+ avec photos, vidéo émotionnelle, home staging et campagnes ciblées sur les portails et les réseaux ; le système Open Domus, avec des visites organisées et sélectionnées, sans défilé de curieux ; et la multi-proposition, qui met plusieurs offres en regard pour vendre au prix convenu.",
    item1Title: "Documents vérifiés",
    item1Copy:
      "Nous vérifions conformité, titres et démarches avant la mise en ligne : s’il y a un problème, il est encore temps de le régler.",
    item2Title: "Un marketing qui raconte",
    item2Copy:
      "Photos, vidéos, rendus et campagnes ciblées pour présenter la maison aux bonnes personnes.",
    item3Title: "Un accompagnement jusqu’à l’acte",
    item3Copy:
      "Un interlocuteur humain à chaque étape, du premier appel à la signature.",
    docEyebrow: "Au cœur de la méthode",
    manifesto:
      "L’écoute, des documents vérifiés, les bonnes personnes : chaque étape est cousue à la suivante, jusqu’à la signature. Nous appelons cela la confiance.",
    manifestoHighlight: "confiance",
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
    heroPrimary: "Bewertung Ihrer Immobilie anfordern",
    heroSecondary: "Die neun Schritte ansehen",
    highlightsEyebrow: "Neun Schritte, drei Momente",
    highlightsTitle: "Sorgfalt, Transparenz, Begleitung.",
    highlightsIntro:
      "Die Methode entfaltet sich in neun Schritten, gebündelt in drei Momenten — zuerst die Menschen, dann die Erzählung, schließlich die Unterschrift — verankert im Protokoll Domus D.O.C.: ein analytisches Gespräch, um Ihre Immobilie, Ihre Ziele und Ihren Zeitrahmen zu verstehen; Bewertung und D.O.C.-Kontrolle, mit einer professionellen Schätzung des realen Werts und einer technisch-rechtlichen Prüfung; Marketing+ mit Fotos, emotionalem Video, Home Staging und gezielten Kampagnen auf Portalen und Social Media; das System Open Domus, mit organisierten und ausgewählten Besichtigungen ohne Kommen und Gehen Neugieriger; und die Multi-Angebot-Phase, die mehrere Angebote gegenüberstellt, um zum vereinbarten Preis zu verkaufen.",
    item1Title: "Geprüfte Unterlagen",
    item1Copy:
      "Wir prüfen Konformität, Eigentumstitel und Verfahren vor der Veröffentlichung: Gibt es ein Problem, bleibt noch Zeit, es zu lösen.",
    item2Title: "Marketing, das erzählt",
    item2Copy:
      "Fotos, Videos, Renderings und gezielte Kampagnen, um das Haus den richtigen Menschen zu zeigen.",
    item3Title: "Begleitung bis zum Notartermin",
    item3Copy:
      "Ein menschlicher Ansprechpartner bei jedem Schritt, vom ersten Anruf bis zur Unterschrift.",
    docEyebrow: "Im Zentrum der Methode",
    manifesto:
      "Zuhören, geprüfte Unterlagen, die richtigen Menschen: Jeder Schritt ist mit dem nächsten vernäht, bis zur Unterschrift. Wir nennen das Vertrauen.",
    manifestoHighlight: "Vertrauen",
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
    heroPrimary: "Solicita la valoración de tu inmueble",
    heroSecondary: "Ver los nueve pasos",
    highlightsEyebrow: "Nueve pasos, tres momentos",
    highlightsTitle: "Cuidado, transparencia, acompañamiento.",
    highlightsIntro:
      "El método se desarrolla en nueve pasos, reunidos en tres momentos — primero las personas, después el relato, por último la firma — y anclados al protocolo Domus D.O.C.: una entrevista analítica para entender tu casa, tus objetivos y tus tiempos; valoración y control D.O.C., con una estimación profesional del valor real y una verificación técnica y legal; Marketing+ con fotos, vídeo emotivo, home staging y campañas específicas en portales y redes; el sistema Open Domus, con visitas organizadas y seleccionadas, sin ir y venir de curiosos; y la multipropuesta, que pone varias ofertas en comparación para vender al precio acordado.",
    item1Title: "Documentos verificados",
    item1Copy:
      "Comprobamos conformidad, títulos y trámites antes de publicar: si hay un problema, aún hay tiempo para resolverlo.",
    item2Title: "Un marketing que cuenta",
    item2Copy:
      "Fotos, vídeos, renders y campañas específicas para poner la casa delante de las personas adecuadas.",
    item3Title: "Acompañamiento hasta la escritura",
    item3Copy:
      "Una referencia humana en cada paso, desde la primera llamada hasta la firma.",
    docEyebrow: "En el centro del método",
    manifesto:
      "Escucha, documentos verificados, personas adecuadas: cada paso va cosido al siguiente, hasta la firma. Nosotros lo llamamos confianza.",
    manifestoHighlight: "confianza",
    docLink: "Descubre el protocolo Domus D.O.C.",
  },
};

export default function MetodoContent() {
  const { locale } = useLocale();
  const d = useDict();
  const c = copy[locale];

  return (
    <>
      <Header />
      {/* Il filo rosso cuce anche /metodo: capitoli della pagina sul rail */}
      <ThreadNav
        chapters={[
          { id: "top", label: "Domus Tua" },
          { id: "metodo", label: d.nav.metodo },
          { id: "domus-doc", label: "Domus D.O.C." },
          { id: "open-domus", label: d.nav.openDomus },
          { id: "recensioni", label: d.nav.recensioni },
          { id: "contatti", label: d.nav.contatti },
        ]}
      />
      <main className="flex-1">
        <PageHero
          id="top"
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

        {/* Momento firma: il manifesto del metodo, pinnato, si legge con lo
            scroll e l'ago cuce la parola chiave. */}
        <ManifestoPin
          eyebrow={c.docEyebrow}
          text={c.manifesto}
          highlight={c.manifestoHighlight}
          link={{ label: c.docLink, href: "#domus-doc" }}
        />

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
