"use client";

// IL METODO — rivista bianca (2026-09-10, rif. immobiliaregoldengoal.it
// «I nostri valori»): titolo d1 su tre righe allineato a destra, poi i tre
// atti come righe piane e i nove passi numerati 01.–09. Via le maschere
// feTurbulence, gli atti in scrub, Atmosphere, CharFlip, Fioritura e il
// monogramma di chiusura. I testi sono gli stessi (copy conservato).
//
// 2026-09-11 — due correzioni di impaginazione:
// 1. La griglia era `lg:grid-cols-[1fr_1.2fr]`, cioè una frazione che non
//    esisteva in nessun'altra sezione: il capitolo apriva il testo a una x
//    sua. Ora è il template condiviso (`lg:grid-cols-2`, gutter 6vw, rientro
//    6vw sul testo), le stesse due linee verticali di Percorsi.
// 2. Gli atti sono SPECCHIATI (foto a destra, `lg:order-2`) perché la testa
//    di capitolo è l'unico titolo allineato a destra della home — come il
//    riferimento ne ha uno per pagina — e il margine destro va usato quattro
//    volte, non una: testa, atto, atto, atto. Togliere il `text-right`
//    avrebbe reso il Metodo identico a ogni altro capitolo.
import Image from "next/image";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import Parallax from "./motion/Parallax";
import { Cta } from "./primitives/Cta";
import { useLocale } from "./i18n/LocaleProvider";
import { site, yearsActive } from "../lib/site";
import { youtubeWatch } from "../lib/videos";

/* `subcopy` e `cta` restano nel copy (i testi si conservano) ma il capitolo
   non li rende più: la CTA di valutazione vive nell'hero e in Contatti.
   `word` è la parola-ornamento dell'atto, derivata dal suo titolo. */
const copy = {
  it: {
    eyebrow: "Il Metodo Domus Tua",
    title: "Un percorso chiaro, dalla prima stima alla firma.",
    subcopy:
      `Ogni vendita e ogni acquisto seguono nove passaggi precisi: niente improvvisazione, solo un metodo costruito in ${yearsActive()} anni di lavoro sul territorio.`,
    cta: "Richiedi la valutazione",
    actVideo: "Guarda la video recensione",
    allSteps: "Vedi i nove passi",
    acts: [
      { up: "Prima,", down: "le persone", word: "Ascolto", alt: "Raffaela Rizza, fondatrice di Domus Tua, in ascolto" },
      { up: "Poi,", down: "il racconto", word: "Racconto", alt: "Il racconto video di una villa seguita da Domus Tua" },
      { up: "Infine,", down: "la firma", word: "Firma", alt: "La stretta di mano che chiude una compravendita seguita da Domus Tua" },
    ],
    steps: [
      { title: "Primo ascolto", copy: "Partiamo da te: obiettivi, tempi, aspettative. Prima delle case vengono le persone." },
      { title: "Valutazione", copy: "Analisi del mercato locale e del tuo immobile per definire valore e strategia, senza illusioni." },
      { title: "Verifica documentale", copy: "Titoli, conformità e documenti controllati prima di partire: se c'è un problema emerge adesso, non davanti al notaio." },
      { title: "Preparazione immobile", copy: "Valorizziamo gli spazi con consigli mirati e, dove serve, home staging." },
      { title: "Racconto visivo", copy: "Foto, video emozionali e rendering: la casa raccontata con la cura che merita." },
      { title: "Marketing e social preview", copy: "Campagne multicanale e anteprime social per portarla davanti alle persone giuste." },
      { title: "Open Domus e visite qualificate", copy: "Visite ordinate e l'evento Open Domus per acquirenti realmente interessati." },
      { title: "Proposta e trattativa", copy: "Gestiamo proposte e negoziazione con trasparenza, tutelando i tuoi interessi." },
      { title: "Rogito", copy: "Prepariamo i documenti per il notaio e controlliamo i conteggi prima che tu firmi." },
    ],
  },
  en: {
    eyebrow: "The Domus Tua Method",
    title: "A clear journey, from the first estimate to signing.",
    subcopy:
      `Every sale and every purchase follows nine precise steps: no improvisation, only a method built over ${yearsActive()} years of work in the local area.`,
    cta: "Request a valuation",
    actVideo: "Watch the video review",
    allSteps: "See the nine steps",
    acts: [
      { up: "First,", down: "the people", word: "Listening", alt: "Raffaela Rizza, founder of Domus Tua, listening" },
      { up: "Then,", down: "the story", word: "Story", alt: "The video story of a villa listed by Domus Tua" },
      { up: "Finally,", down: "the signing", word: "Signing", alt: "The handshake closing a sale assisted by Domus Tua" },
    ],
    steps: [
      { title: "First, we listen", copy: "We start with you: goals, timing, expectations. People come before homes." },
      { title: "Valuation", copy: "Analysis of the local market and your property to define value and strategy, without illusions." },
      { title: "Document check", copy: "Titles, compliance and documents verified before we begin: if there is a problem it surfaces now, not in front of the notary." },
      { title: "Property preparation", copy: "We enhance your spaces with targeted advice and, where needed, home staging." },
      { title: "Visual storytelling", copy: "Photos, emotional videos and renderings: the home told with the care it deserves." },
      { title: "Marketing and social preview", copy: "Multichannel campaigns and social previews to bring it in front of the right people." },
      { title: "Open Domus and qualified viewings", copy: "Orderly viewings and the Open Domus event for genuinely interested buyers." },
      { title: "Offer and negotiation", copy: "We handle offers and negotiation with transparency, protecting your interests." },
      { title: "Deed of sale", copy: "We prepare the documents for the notary and check the figures before you sign." },
    ],
  },
  fr: {
    eyebrow: "La Méthode Domus Tua",
    title: "Un parcours clair, de la première estimation à la signature.",
    subcopy:
      `Chaque vente et chaque achat suivent neuf étapes précises : aucune improvisation, seulement une méthode construite en ${yearsActive()} ans de travail sur le territoire.`,
    cta: "Demander l’estimation",
    actVideo: "Voir l’avis en vidéo",
    allSteps: "Voir les neuf étapes",
    acts: [
      { up: "D'abord,", down: "les personnes", word: "Écoute", alt: "Raffaela Rizza, fondatrice de Domus Tua, à l'écoute" },
      { up: "Puis,", down: "le récit", word: "Récit", alt: "Le récit vidéo d'une villa proposée par Domus Tua" },
      { up: "Enfin,", down: "la signature", word: "Signature", alt: "La poignée de main qui conclut une vente accompagnée par Domus Tua" },
    ],
    steps: [
      { title: "Première écoute", copy: "Nous partons de vous : objectifs, délais, attentes. Avant les maisons viennent les personnes." },
      { title: "Estimation", copy: "Analyse du marché local et de votre bien pour définir valeur et stratégie, sans illusions." },
      { title: "Vérification documentaire", copy: "Titres, conformité et documents contrôlés avant de commencer : s'il y a un problème, il ressort maintenant et non devant le notaire." },
      { title: "Préparation du bien", copy: "Nous valorisons les espaces avec des conseils ciblés et, si nécessaire, du home staging." },
      { title: "Récit visuel", copy: "Photos, vidéos émotionnelles et rendus : la maison racontée avec le soin qu'elle mérite." },
      { title: "Marketing et aperçu social", copy: "Campagnes multicanales et aperçus sur les réseaux pour la présenter aux bonnes personnes." },
      { title: "Open Domus et visites qualifiées", copy: "Des visites ordonnées et l'événement Open Domus pour des acheteurs réellement intéressés." },
      { title: "Offre et négociation", copy: "Nous gérons offres et négociation en toute transparence, en protégeant vos intérêts." },
      { title: "Acte de vente", copy: "Nous préparons les documents pour le notaire et vérifions les décomptes avant votre signature." },
    ],
  },
  de: {
    eyebrow: "Die Domus Tua Methode",
    title: "Ein klarer Weg, von der ersten Schätzung bis zur Unterschrift.",
    subcopy:
      `Jeder Verkauf und jeder Kauf folgt neun präzisen Schritten: keine Improvisation, nur eine Methode, die in ${yearsActive()} Jahren Arbeit vor Ort gewachsen ist.`,
    cta: "Bewertung anfordern",
    actVideo: "Video-Bewertung ansehen",
    allSteps: "Die neun Schritte ansehen",
    acts: [
      { up: "Zuerst", down: "die Menschen", word: "Zuhören", alt: "Raffaela Rizza, Gründerin von Domus Tua, beim Zuhören" },
      { up: "Dann", down: "die Geschichte", word: "Erzählen", alt: "Die Video-Geschichte einer Villa im Angebot von Domus Tua" },
      { up: "Zuletzt", down: "die Unterschrift", word: "Unterschrift", alt: "Der Handschlag zum Abschluss eines von Domus Tua begleiteten Verkaufs" },
    ],
    steps: [
      { title: "Erstes Zuhören", copy: "Wir beginnen bei Ihnen: Ziele, Zeitrahmen, Erwartungen. Vor den Häusern kommen die Menschen." },
      { title: "Bewertung", copy: "Analyse des lokalen Marktes und Ihrer Immobilie, um Wert und Strategie festzulegen, ohne Illusionen." },
      { title: "Dokumentenprüfung", copy: "Titel, Konformität und Unterlagen werden vorab geprüft: Gibt es ein Problem, zeigt es sich jetzt und nicht beim Notar." },
      { title: "Vorbereitung der Immobilie", copy: "Wir werten die Räume mit gezielten Ratschlägen und, wo nötig, Home Staging auf." },
      { title: "Visuelles Storytelling", copy: "Fotos, emotionale Videos und Renderings: das Zuhause erzählt mit der Sorgfalt, die es verdient." },
      { title: "Marketing und Social-Vorschau", copy: "Multikanal-Kampagnen und Social-Vorschauen, um sie den richtigen Menschen zu zeigen." },
      { title: "Open Domus und qualifizierte Besichtigungen", copy: "Geordnete Besichtigungen und das Event Open Domus für wirklich interessierte Käufer." },
      { title: "Angebot und Verhandlung", copy: "Wir führen Angebote und Verhandlungen transparent und schützen Ihre Interessen." },
      { title: "Kaufvertrag", copy: "Wir bereiten die Unterlagen für den Notar vor und prüfen die Abrechnungen, bevor Sie unterschreiben." },
    ],
  },
  es: {
    eyebrow: "El Método Domus Tua",
    title: "Un recorrido claro, desde la primera tasación hasta la firma.",
    subcopy:
      `Cada venta y cada compra siguen nueve pasos precisos: nada de improvisación, solo un método construido en ${yearsActive()} años de trabajo en el territorio.`,
    cta: "Solicita la valoración",
    actVideo: "Ver la reseña en vídeo",
    allSteps: "Ver los nueve pasos",
    acts: [
      { up: "Primero,", down: "las personas", word: "Escucha", alt: "Raffaela Rizza, fundadora de Domus Tua, escuchando" },
      { up: "Luego,", down: "el relato", word: "Relato", alt: "El relato en vídeo de una villa ofrecida por Domus Tua" },
      { up: "Al final,", down: "la firma", word: "Firma", alt: "El apretón de manos que cierra una compraventa acompañada por Domus Tua" },
    ],
    steps: [
      { title: "Primera escucha", copy: "Partimos de ti: objetivos, plazos, expectativas. Antes que las casas están las personas." },
      { title: "Valoración", copy: "Análisis del mercado local y de tu inmueble para definir valor y estrategia, sin ilusiones." },
      { title: "Verificación documental", copy: "Títulos, conformidad y documentos comprobados antes de empezar: si hay un problema sale ahora, no delante del notario." },
      { title: "Preparación del inmueble", copy: "Valorizamos los espacios con consejos específicos y, cuando hace falta, home staging." },
      { title: "Relato visual", copy: "Fotos, vídeos emotivos y renders: la casa contada con el cuidado que merece." },
      { title: "Marketing y anticipo social", copy: "Campañas multicanal y anticipos en redes para presentarla ante las personas adecuadas." },
      { title: "Open Domus y visitas cualificadas", copy: "Visitas ordenadas y el evento Open Domus para compradores realmente interesados." },
      { title: "Propuesta y negociación", copy: "Gestionamos propuestas y negociación con transparencia, protegiendo tus intereses." },
      { title: "Escritura", copy: "Preparamos los documentos para el notario y comprobamos las cuentas antes de que firmes." },
    ],
  },
} as const;

/* Le foto degli atti, con la misura VERA del sorgente: tutte e tre sono
   riprese larghe (1.73, 2.54, 1.77), quindi tutte e tre stanno in `dt-media-full`
   (16:9) e nessuna viene ingrandita. Nel quadrato di prima il ritratto —
   763×442, il file più piccolo del sito — teneva il 58% dell'inquadratura e
   saliva di 1,37×: il volto usciva tagliato e molle. In 16:9 la scatola è
   larga 39vw (~562 px a 1440): il ritratto scende a 0,74×, la villa a 0,63×,
   la stretta di mano a 0,29×.
   `pos`: il ritratto non ha aria sopra la testa nel sorgente, quindi il taglio
   si prende i 9 px di troppo dal basso (`50% 0%`), non dai capelli.
   `video`: handshake.jpg è la copertina della video recensione e porta il
   pulsante play COTTO nei pixel; senza un link leggerebbe come un player
   rotto, quindi l'atto porta al video vero (scelta del 2026-08-06). */
const ACT_IMAGES = [
  { src: "/images/reali/raffaela-ritratto.jpg", ratio: 763 / 442, pos: "50% 0%", video: null },
  { src: "/images/reali/video-villa-mozart.jpg", ratio: 1280 / 505, pos: undefined, video: null },
  { src: "/images/reali/handshake.jpg", ratio: 1920 / 1087, pos: undefined, video: site.videos.reviews[0].id },
] as const;

/* `sizes` descrive la larghezza dell'IMMAGINE dopo il cover, non della
   scatola: in una 16:9 un sorgente più largo di 16:9 sborda e va chiesto più
   grande (villa-mozart, 2.54, è larga 1,43 volte la scatola). Le tre misure
   sono quelle vere della colonna: 90vw sotto 768 (dt-row a 5vw), 84vw fino a
   1024 (dt-row a 8vw, ancora impilata), poi metà della riga meno il gutter. */
const FULL_ASPECT = 16 / 9;
const coverSizes = (ratio: number) => {
  const k = Math.max(1, ratio / FULL_ASPECT);
  return `(max-width:767px) ${Math.ceil(90 * k)}vw, (max-width:1023px) ${Math.ceil(84 * k)}vw, ${Math.ceil(39 * k)}vw`;
};

export default function Method({ compact = false }: { compact?: boolean } = {}) {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section id="metodo" className="dt-chapter bg-cream">
      {/* Testa di capitolo allineata a destra, come nel riferimento. */}
      <div className="dt-row">
        <Reveal className="text-right">
          <span className="eyebrow">{c.eyebrow}</span>
        </Reveal>
        <TextLines as="h2" className="ml-auto mt-6 max-w-[20ch] text-right font-display text-d1">
          {c.title}
        </TextLines>
      </div>

      {/* I tre atti, una riga ciascuno. Il lead dell'atto è l'indice dei suoi
          tre passi: il copy non ha un testo d'atto e non se ne inventa uno —
          i passi lo dicono per esteso qui sotto. */}
      {c.acts.map((a, i) => {
        const steps = c.steps.slice(i * 3, i * 3 + 3);
        const img = ACT_IMAGES[i];
        return (
          <div
            key={a.word}
            className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-[6vw] lg:grid-cols-2 lg:items-center"
          >
            {/* Colonna media: prima nel DOM — sul telefono l'atto si apre con la
                sua parola — ma a destra da lg, sull'asse della testa di capitolo. */}
            <div className="lg:order-2 lg:text-right">
              {/* Decorativa (aria-hidden): il senso è nel titolo dell'atto.
                  Niente tuck: qui non c'è un titolo da attraversare. */}
              <Reveal>
                <span aria-hidden className="script-word" style={{ "--script-tuck": "0" } as React.CSSProperties}>
                  {a.word}
                </span>
              </Reveal>
              <Parallax speed={-0.04}>
                <div className="dt-media-full mt-8">
                  <Image
                    src={img.src}
                    alt={a.alt}
                    fill
                    sizes={coverSizes(img.ratio)}
                    className="object-cover"
                    style={{ objectPosition: img.pos }}
                  />
                </div>
              </Parallax>
            </div>
            <div className="lg:pr-[6vw]">
              <TextLines as="h3" className="font-display text-d2">
                {`${a.up} ${a.down}`}
              </TextLines>
              <Reveal>
                <p className="lead mt-6">{steps.map((s) => s.title).join(" · ")}</p>
              </Reveal>
              {img.video ? (
                <Reveal delay={100}>
                  <Cta
                    href={youtubeWatch(img.video)}
                    variant="ghost"
                    className="mt-8"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {c.actVideo}
                  </Cta>
                </Reveal>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* I NOVE PASSI STANNO SU /metodo, NON IN HOME.
          In home questo capitolo faceva 4.100 px sul telefono — quasi cinque
          schermate — ed era identico al pixel al #metodo della pagina
          dedicata: stessa testa, stessi tre atti, stessa griglia 01-09. Chi
          scorre la home non deve leggere due volte la stessa cosa; chi vuole
          i nove passi ha un link che ce lo porta.
          Il numero è decorativo: l'ordine lo dà già l'<ol>. */}
      {compact ? (
        <div className="dt-row mt-[clamp(2.5rem,7vh,5rem)]">
          <Cta href="/metodo" variant="ghost">
            {c.allSteps}
          </Cta>
        </div>
      ) : (
      <ol className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-x-[4vw] gap-y-16 md:grid-cols-3">
        {c.steps.map((s, i) => (
          <li key={s.title}>
            <Reveal delay={(i % 3) * 80}>
              <span aria-hidden className="tnum block font-display text-d1 font-light text-graphite">
                {String(i + 1).padStart(2, "0")}.
              </span>
              <h4 className="mt-4 font-display text-d3">{s.title}</h4>
              <p className="mt-3 text-body text-graphite">{s.copy}</p>
            </Reveal>
          </li>
        ))}
      </ol>
      )}
    </section>
  );
}
