"use client";

// IL METODO — rivista bianca (2026-09-10, rif. immobiliaregoldengoal.it
// «I nostri valori»): titolo d1 su tre righe allineato a destra, poi i tre
// atti come righe piane e i nove passi numerati 01.–09. Via le maschere
// feTurbulence, gli atti in scrub, Atmosphere, CharFlip, Fioritura e il
// monogramma di chiusura. I testi sono gli stessi (copy conservato).
// Movimento dal 13 settembre (A20 di Alberto, spec §3.9): le foto degli atti
// si aprono con la tendina di ClipMedia a verso alternato, atti 1 e 3 da
// sinistra e atto 2 da destra, in home e su /metodo (MetodoContent rende lo
// stesso componente); la parallasse sulle foto è tolta (D23).
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
import RevealGroup from "./motion/RevealGroup";
import ScriptWord from "./motion/ScriptWord";
import SplitTitle from "./motion/SplitTitle";
import Lead from "./motion/Lead";
import ClipMedia from "./motion/ClipMedia";
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
      { up: "Prima,", down: "le persone", word: "Ascolto" },
      { up: "Poi,", down: "le immagini", word: "Racconto" },
      { up: "Infine,", down: "il rogito", word: "Firma" },
    ],
    // Gli alt delle tre foto degli atti (ACT_IMAGES), nell'ordine: media-file.test li legge da qui.
    actAlts: [
      "Raffaela Rizza, fondatrice di Domus Tua, allo specchio: il riflesso sorride a chi guarda",
      "La facciata di una villa moderna sulla piscina, con le sdraio bianche e le siepi",
      "Raffaela Rizza consegna le chiavi davanti alla villa",
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
      { up: "First,", down: "the people", word: "Listening" },
      { up: "Then,", down: "the images", word: "Story" },
      { up: "Finally,", down: "the deed", word: "Signing" },
    ],
    actAlts: [
      "Raffaela Rizza, founder of Domus Tua, at the mirror: her reflection smiles at the viewer",
      "The facade of a modern villa over its pool, with white sun loungers and hedges",
      "Raffaela Rizza handing over the keys in front of the villa",
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
      { up: "D'abord,", down: "les personnes", word: "Écoute" },
      { up: "Puis,", down: "les images", word: "Récit" },
      { up: "Enfin,", down: "l’acte", word: "Signature" },
    ],
    actAlts: [
      "Raffaela Rizza, fondatrice de Domus Tua, devant le miroir : son reflet sourit à qui regarde",
      "La façade d'une villa moderne sur sa piscine, avec les bains de soleil blancs et les haies",
      "Raffaela Rizza remet les clés devant la villa",
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
      { up: "Zuerst", down: "die Menschen", word: "Zuhören" },
      { up: "Dann", down: "die Bilder", word: "Erzählen" },
      { up: "Zuletzt", down: "der Notartermin", word: "Unterschrift" },
    ],
    actAlts: [
      "Raffaela Rizza, Gründerin von Domus Tua, vor dem Spiegel: ihr Spiegelbild lächelt den Betrachter an",
      "Die Fassade einer modernen Villa am Pool, mit weißen Liegen und Hecken",
      "Raffaela Rizza übergibt die Schlüssel vor der Villa",
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
      { up: "Primero,", down: "las personas", word: "Escucha" },
      { up: "Luego,", down: "las imágenes", word: "Relato" },
      { up: "Al final,", down: "la escritura", word: "Firma" },
    ],
    actAlts: [
      "Raffaela Rizza, fundadora de Domus Tua, ante el espejo: su reflejo sonríe a quien mira",
      "La fachada de una villa moderna sobre la piscina, con tumbonas blancas y setos",
      "Raffaela Rizza entrega las llaves delante de la villa",
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

/* Le foto degli atti (A61 di Alberto, 22 set. 2026, sera: «dobbiamo cambiare le immagini di
   Prima, le persone / Poi, le immagini / Infine, il rogito: nella prima sempre una foto di
   Raffaela, magari quelle allo specchio, e le altre scegli tu»). Scelte mie (D-A61):
   - «Prima, le persone»: Raffaela allo specchio, di spalle, col riflesso che guarda chi legge
     (`raffaela-specchio-riflesso.jpg`, 3:4, l'unica delle tre allo specchio non ancora montata:
     `-sorriso` sta nella rotaia del team e `-profilo` in Percorsi, e una foto non si ripete
     nella pagina);
   - «Poi, le immagini»: la casa raccontata, il salotto a doppia altezza con la piscina dietro
     la vetrata (`villa-salotto-doppio.jpg`, 3:2), senza persone: l'atto parla delle immagini;
   - «Infine, il rogito»: Raffaela che consegna le chiavi davanti alla villa
     (`raffaela-chiavi-alta.jpg`, 2:3). Al posto di `handshake.jpg`, la copertina col play cotto
     nei pixel; il link al video della recensione resta.
   La scatola è la metà (42vw, al massimo 640 px) col RAPPORTO DEL SORGENTE (la regola dei tre
   moduli: la scatola segue il sorgente, non la griglia), quindi nessuna foto è tagliata e nessuna
   è ingrandita: `sizes` dichiara la scatola. `video`: l'atto del rogito porta al video vero
   della recensione (scelta del 2026-08-06). */
const ACT_IMAGES = [
  { src: "/images/reali/raffaela-specchio-riflesso.jpg", w: 1920, h: 2560, video: null },
  // A69 (Alberto, 22 set., sera: «salotto doppio non mi piace, usa questa»): la facciata sulla piscina, 3:2.
  { src: "/images/reali/villa-piscina-facciata.jpg", w: 2560, h: 1707, video: null },
  { src: "/images/reali/raffaela-chiavi-alta.jpg", w: 2560, h: 3816, video: site.videos.reviews[0].id },
] as const;

/* Le misure vere della scatola: 90vw sotto 768 (dt-row a 5vw), 84vw fino a 1024 (dt-row a 8vw,
   ancora impilata), poi i 42vw della metà col tetto a 640 px. */
const ACT_SIZES = "(max-width:767px) 90vw, (max-width:1023px) 84vw, (max-width:1523px) 42vw, 640px";

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
        <SplitTitle as="h2" className="ml-auto mt-6 max-w-[20ch] text-right font-display text-d1">
          {c.title}
        </SplitTitle>
      </div>

      {/* I tre atti, una riga ciascuno. Il lead dell'atto è l'indice dei suoi
          tre passi: il copy non ha un testo d'atto e non se ne inventa uno —
          i passi lo dicono per esteso qui sotto. Il passo fra le righe era
          clamp(4rem,10vh,8rem): tre righe alte quanto la foto 16:9 (340 px a
          1440) separate da 90 px di avorio; dal 2026-09-20 e' quello dei
          blocchi interni (Alberto: «riducendo la distanza … tra una foto e un
          testo, sia alto-basso che sinistra-destra»). */}
      {c.acts.map((a, i) => {
        const steps = c.steps.slice(i * 3, i * 3 + 3);
        const img = ACT_IMAGES[i];
        return (
          <div
            key={a.word}
            className="dt-row mt-[clamp(2.5rem,6vh,4.5rem)] grid gap-[6vw] lg:grid-cols-2 lg:items-center"
          >
            {/* Colonna media: a destra da lg, sull'asse della testa di
                capitolo. La scatola e' la META' (605 px) e non la larghezza
                della traccia (562): cosi' il suo bordo sinistro cade sulla
                mezzeria della pagina, dove cade quello di ogni altra riga del
                sito — con la traccia il Metodo apriva una quarta linea
                verticale tutta sua. Il rapporto resta quello della banda:
                le tre riprese sono larghe (1,73 · 2,54 · 1,77) e in un
                quadrato andrebbero ingrandite. */}
            <div className="lg:order-2 lg:justify-self-end">
              {/* A61: la scatola prende il rapporto del sorgente (stile inline: batte il quadrato
                  del modulo, che sta fuori dai layer). */}
              <ClipMedia
                chapter="method"
                from={i % 2 ? "right" : "left"}
                className="dt-media-half"
                style={{ aspectRatio: `${img.w} / ${img.h}` }}
              >
                <Image src={img.src} alt={c.actAlts[i]} fill sizes={ACT_SIZES} className="object-cover" />
              </ClipMedia>
            </div>
            <div className="lg:pr-[6vw]">
              <SplitTitle as="h3" className="font-display text-d2">
                {`${a.up} ${a.down}`}
              </SplitTitle>
              {/* La parola d'atto sta DOPO il titolo, come ogni altra
                  calligrafia del sito: la grammatica e' una sola, e attraversa
                  l'ultima riga del titolo. Sopra la foto, da sola in mezzo
                  all'avorio, era un'etichetta rossa lasciata nel corridoio —
                  la sola calligrafia del sito che non attraversasse niente.
                  E il titolo dell'atto non ripete piu' la parola: «Racconto»
                  sopra «IL RACCONTO» era la stessa parola stampata due volte,
                  una in rosso sull'altra. Ora i titoli dicono la cosa (le
                  immagini, il rogito) e la calligrafia dice l'atto. */}
              <ScriptWord>{a.word}</ScriptWord>
              <Lead className="mt-6">{steps.map((s) => s.title).join(" · ")}</Lead>
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
          Il numero è decorativo: l'ordine lo dà già l'<ol>.

          LA GRIGLIA DEI PASSI SEGUE LA PAROLA PIÙ LUNGA DELLE CINQUE LINGUE.
          Audit del 21 settembre 2026 (blocco 23), difetto V04, secondo giro: a
          768 px la griglia era già a tre colonne (194,6 px l'una) e il titolo a
          d3 (24 px): «Dokumentenprüfung» (275,6 px, una parola sola, nowrap per
          lettera) usciva dallo schermo di 19,6 px; a 1440, a d3 (40,3 px), la
          stessa parola è larga 462 px in una colonna di 365 e correva per 97 px
          nel margine destro. Due colonne fra 768 e 1023 (307 px a 768: entra con
          31 px d'aria; il nono passo resta solo in fondo a sinistra) e tre da
          1024 con il titolo a d4 (23-28 px: 297 px a 1440 in 365; a 1024 sfiora
          la colonna di 7 px dentro il margine di 82). Lo stesso criterio dei
          ruoli di /lavora-con-noi: la taglia segue la colonna (DESIGN.md). */}
      {compact ? (
        <div className="dt-row mt-[clamp(2rem,5vh,3.5rem)]">
          <Cta href="/metodo" variant="ghost">
            {c.allSteps}
          </Cta>
        </div>
      ) : (
      <ol className="dt-row mt-[clamp(4rem,10vh,8rem)] grid gap-x-[4vw] gap-y-16 md:grid-cols-2 lg:grid-cols-3">
        {c.steps.map((s, i) => (
          <li key={s.title}>
            <RevealGroup>
              <Reveal>
                <span aria-hidden className="tnum block font-display text-d1 font-light text-graphite">
                  {String(i + 1).padStart(2, "0")}.
                </span>
              </Reveal>
              <SplitTitle as="h4" className="mt-4 font-display text-d3 lg:text-d4">
                {s.title}
              </SplitTitle>
              <Reveal>
                <p className="mt-3 text-body text-graphite">{s.copy}</p>
              </Reveal>
            </RevealGroup>
          </li>
        ))}
      </ol>
      )}
    </section>
  );
}
