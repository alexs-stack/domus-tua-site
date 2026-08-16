"use client";

// /valutazione-immobile-tradate — punto 23 della checklist.
//
// PERCHÉ QUESTA PAGINA ESISTE
// «valutazione immobile» è la ricerca a più alta intenzione commerciale del settore: chi la
// digita sta decidendo se vendere. Il sito non aveva una pagina per rispondere — tutti i
// pulsanti "Richiedi la valutazione" saltavano a un'ancora in fondo alla homepage (§5.4).
//
// ─────────────────────────────────────────────────────────────────────────────
// LA SCALA A DUE LIVELLI (§3.2), CHE È IL CONTENUTO VERO
//
// Non è un espediente per far pagare il secondo livello: entrambi restano senza costi
// anticipati. Serve a distinguere due cose che il mercato confonde di proposito.
//
//   Livello 1 — PRIMO CONFRONTO. Una conversazione, senza sopralluogo. Dà un ordine di
//   grandezza e serve a capire se ha senso muoversi.
//
//   Livello 2 — VALUTAZIONE PROFESSIONALE. Sopralluogo, analisi documentale, relazione
//   motivata. È un lavoro, e come tale ha un nome e un contenuto dichiarati.
//
// Un'unica "valutazione gratuita" indifferenziata è ciò che offre ogni concorrente, e si
// legge come esca. Due livelli con nomi diversi costruiscono una scala di valore, ed è
// quella scala che rende sensato firmare un mandato dopo.
//
// ─────────────────────────────────────────────────────────────────────────────
// LA PAROLA «GRATIS» NON COMPARE QUI DENTRO
// §3.2: la gratuità resta, cambia la parola. In pagina si dice «il primo incontro è senza
// impegno e senza costi»; «valutazione gratuita» sopravvive SOLO nel title, nella meta
// description e nell'indirizzo — dove vive la ricerca e dove nessuno legge una promessa.
// Vedi page.tsx: è l'unica eccezione concessa in tutto il sito alla regola anti-keyword
// dell'§8, ed è limitata a questa pagina.
//
// E NON C'È NESSUN NUMERO
// Niente «scopri in 30 secondi quanto vale casa tua», nessuna stima automatica: è
// esattamente l'inquadratura da calcolatore che §3.2 dice svalutare il servizio che questa
// pagina deve vendere. La pagina fa desiderare una valutazione professionale, non la
// simula.
// ─────────────────────────────────────────────────────────────────────────────

import Contact from "../components/Contact";
import Reveal from "../components/Reveal";
import TextLines from "../components/motion/TextLines";
import { Cta } from "../components/primitives/Cta";
import { useLocale } from "../components/i18n/LocaleProvider";
import type { Locale } from "../lib/i18n/dictionaries";

type Tier = { step: string; name: string; lead: string; items: string[]; note: string };

type Copy = {
  eyebrow: string;
  title: string;
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  tiersEyebrow: string;
  tiersTitle: string;
  tiersIntro: string;
  tiers: [Tier, Tier];
  costTitle: string;
  costBody: string;
  whyTitle: string;
  whyItems: { t: string; c: string }[];
  formEyebrow: string;
};

const copy: Record<Locale, Copy> = {
  it: {
    eyebrow: "Valutazione immobile · Tradate e provincia",
    title: "Quanto vale davvero la tua casa.",
    lead: "Non lo dice un calcolatore in trenta secondi. Lo dice chi viene a vederla, controlla i documenti e mette per iscritto come è arrivato a quel numero. Il primo incontro è senza impegno e senza costi.",
    ctaPrimary: "Richiedi la valutazione del tuo immobile",
    ctaSecondary: "Come funziona",
    tiersEyebrow: "Come funziona",
    tiersTitle: "Due passaggi, non uno.",
    tiersIntro:
      "Il primo serve a capire se ha senso muoversi. Il secondo è il documento su cui si decide un prezzo. Sono due cose diverse e le teniamo distinte, perché chiamarle entrambe «valutazione» è il modo più rapido per non farne bene nessuna.",
    tiers: [
      {
        step: "01",
        name: "Primo confronto",
        lead: "Una conversazione, in ufficio o al telefono. Senza sopralluogo e senza impegno.",
        items: [
          "Ci racconti l'immobile: dove si trova, quanto è grande, in che stato è",
          "Ti diamo un ordine di grandezza sulla base di quello che il mercato di quella via sta facendo adesso",
          "Ti diciamo cosa servirebbe verificare prima di metterlo in vendita",
        ],
        note: "Serve a rispondere a una domanda sola: ha senso muoversi adesso? Se la risposta è no, te lo diciamo.",
      },
      {
        step: "02",
        name: "Valutazione professionale",
        lead: "Il lavoro vero, quando decidi di procedere. Anche questo senza costi anticipati.",
        items: [
          "Sopralluogo: veniamo a vedere l'immobile, non lo stimiamo da una piantina",
          "Analisi documentale: catasto, urbanistica, titoli e planimetrie, prima del mercato e non durante la trattativa",
          "Relazione motivata: il prezzo consigliato, scritto, con i dati e i confronti da cui nasce",
        ],
        note: "La relazione resta tua, anche se poi decidi di non vendere con noi.",
      },
    ],
    costTitle: "Cosa costa, e quando.",
    costBody:
      "Nessun costo anticipato, in nessuno dei due passaggi. Si paga solo a vendita conclusa, e fotografie, video, home staging e verifica dei documenti sono compresi nel metodo. Se non vendiamo, non ci pagate.",
    whyTitle: "Perché il prezzo giusto conta più di quanto sembri.",
    whyItems: [
      {
        t: "Troppo alto",
        c: "L'immobile resta fermo per mesi. Chi cerca lo vede riapparire settimana dopo settimana e comincia a chiedersi cosa non va: quando poi il prezzo scende, arriva letto come una debolezza.",
      },
      {
        t: "Troppo basso",
        c: "Si vende in fretta, e resta il dubbio — legittimo — di aver lasciato sul tavolo dei soldi che nessuno restituisce.",
      },
      {
        t: "Giusto",
        c: "Attira le persone che possono davvero comprare, nel momento in cui l'annuncio è più visibile: le prime settimane. È lì che si gioca quasi tutto.",
      },
    ],
    formEyebrow: "Raccontaci il tuo immobile",
  },
  en: {
    eyebrow: "Property valuation · Tradate and province",
    title: "What your home is actually worth.",
    lead: "Not something a calculator decides in thirty seconds. It's decided by someone who comes to see it, checks the paperwork and writes down how they reached that figure. The first meeting carries no obligation and no cost.",
    ctaPrimary: "Request a valuation of your property",
    ctaSecondary: "How it works",
    tiersEyebrow: "How it works",
    tiersTitle: "Two steps, not one.",
    tiersIntro:
      "The first tells you whether it's worth moving. The second is the document a price is decided on. They are different things and we keep them apart, because calling them both «a valuation» is the quickest way to do neither well.",
    tiers: [
      {
        step: "01",
        name: "First conversation",
        lead: "A conversation, in the office or by phone. No visit and no obligation.",
        items: [
          "You tell us about the property: where it is, how big, what condition",
          "We give you a ballpark based on what the market on that street is doing now",
          "We tell you what would need checking before putting it up for sale",
        ],
        note: "It answers one question: does it make sense to move now? If the answer is no, we say so.",
      },
      {
        step: "02",
        name: "Professional valuation",
        lead: "The real work, when you decide to proceed. Also with no upfront cost.",
        items: [
          "Site visit: we come and see it, we don't value it from a floor plan",
          "Document analysis: land registry, planning, titles and plans — before market, not during negotiation",
          "Written report: the recommended price, in writing, with the data and comparisons behind it",
        ],
        note: "The report is yours, even if you then decide not to sell with us.",
      },
    ],
    costTitle: "What it costs, and when.",
    costBody:
      "No upfront cost, at either step. You pay only once the sale closes, and photography, video, home staging and document checks are part of the method. If we don't sell, you don't pay us.",
    whyTitle: "Why the right price matters more than it seems.",
    whyItems: [
      {
        t: "Too high",
        c: "The property sits for months. Buyers watch it reappear week after week and start wondering what's wrong: when the price finally drops, it reads as weakness.",
      },
      {
        t: "Too low",
        c: "It sells fast, and leaves the entirely reasonable doubt that money was left on the table — money nobody gives back.",
      },
      {
        t: "Right",
        c: "It attracts people who can actually buy, in the window where the listing is most visible: the first weeks. That's where nearly everything is decided.",
      },
    ],
    formEyebrow: "Tell us about your property",
  },
  fr: {
    eyebrow: "Estimation immobilière · Tradate et sa province",
    title: "Ce que vaut vraiment votre bien.",
    lead: "Pas ce qu'un calculateur décide en trente secondes. Ce que décide quelqu'un qui vient le voir, vérifie les documents et écrit comment il est arrivé à ce chiffre. Le premier rendez-vous est sans engagement et sans frais.",
    ctaPrimary: "Demandez l'estimation de votre bien",
    ctaSecondary: "Comment ça marche",
    tiersEyebrow: "Comment ça marche",
    tiersTitle: "Deux étapes, pas une.",
    tiersIntro:
      "La première dit s'il est pertinent d'avancer. La seconde est le document sur lequel se décide un prix. Ce sont deux choses différentes et nous les gardons distinctes : les appeler toutes deux « estimation » est le moyen le plus rapide de n'en réussir aucune.",
    tiers: [
      {
        step: "01",
        name: "Premier échange",
        lead: "Une conversation, en agence ou par téléphone. Sans visite et sans engagement.",
        items: [
          "Vous nous racontez le bien : où il est, sa taille, son état",
          "Nous donnons un ordre de grandeur d'après ce que fait le marché de cette rue aujourd'hui",
          "Nous vous disons ce qu'il faudrait vérifier avant la mise en vente",
        ],
        note: "Cela répond à une seule question : est-il pertinent d'avancer maintenant ? Si la réponse est non, nous le disons.",
      },
      {
        step: "02",
        name: "Estimation professionnelle",
        lead: "Le vrai travail, quand vous décidez d'avancer. Là aussi sans frais d'avance.",
        items: [
          "Visite : nous venons voir le bien, nous ne l'estimons pas sur plan",
          "Analyse documentaire : cadastre, urbanisme, titres et plans, avant le marché et non pendant la négociation",
          "Rapport motivé : le prix conseillé, par écrit, avec les données et les comparaisons dont il découle",
        ],
        note: "Le rapport vous appartient, même si vous décidez ensuite de ne pas vendre avec nous.",
      },
    ],
    costTitle: "Ce que ça coûte, et quand.",
    costBody:
      "Aucun frais d'avance, à aucune des deux étapes. Vous ne payez qu'à la vente conclue, et photos, vidéo, home staging et vérification des documents font partie de la méthode. Si nous ne vendons pas, vous ne nous payez pas.",
    whyTitle: "Pourquoi le juste prix compte plus qu'il n'y paraît.",
    whyItems: [
      {
        t: "Trop haut",
        c: "Le bien reste des mois. Les acquéreurs le voient réapparaître semaine après semaine et se demandent ce qui cloche : quand le prix baisse enfin, il se lit comme une faiblesse.",
      },
      {
        t: "Trop bas",
        c: "Cela se vend vite, et laisse le doute — légitime — d'avoir laissé de l'argent sur la table, que personne ne rend.",
      },
      {
        t: "Juste",
        c: "Il attire les personnes qui peuvent réellement acheter, au moment où l'annonce est la plus visible : les premières semaines. C'est là que presque tout se joue.",
      },
    ],
    formEyebrow: "Parlez-nous de votre bien",
  },
  de: {
    eyebrow: "Immobilienbewertung · Tradate und Provinz",
    title: "Was Ihre Immobilie wirklich wert ist.",
    lead: "Das entscheidet kein Rechner in dreißig Sekunden. Das entscheidet jemand, der sie ansieht, die Unterlagen prüft und aufschreibt, wie er auf diese Zahl gekommen ist. Das erste Gespräch ist unverbindlich und kostenfrei.",
    ctaPrimary: "Bewertung Ihrer Immobilie anfordern",
    ctaSecondary: "So funktioniert es",
    tiersEyebrow: "So funktioniert es",
    tiersTitle: "Zwei Schritte, nicht einer.",
    tiersIntro:
      "Der erste sagt, ob sich ein Schritt lohnt. Der zweite ist das Dokument, auf dessen Basis ein Preis entsteht. Das sind zwei verschiedene Dinge, und wir halten sie getrennt: beide «Bewertung» zu nennen ist der schnellste Weg, keine von beiden gut zu machen.",
    tiers: [
      {
        step: "01",
        name: "Erstes Gespräch",
        lead: "Ein Gespräch, im Büro oder am Telefon. Ohne Besichtigung und ohne Verpflichtung.",
        items: [
          "Sie erzählen uns von der Immobilie: wo sie liegt, wie groß sie ist, in welchem Zustand",
          "Wir nennen eine Größenordnung, ausgehend davon, was der Markt in dieser Straße gerade macht",
          "Wir sagen Ihnen, was vor dem Verkauf zu prüfen wäre",
        ],
        note: "Es beantwortet eine einzige Frage: Lohnt es sich jetzt? Wenn nicht, sagen wir es.",
      },
      {
        step: "02",
        name: "Professionelle Bewertung",
        lead: "Die eigentliche Arbeit, wenn Sie weitermachen wollen. Auch hier ohne Vorabkosten.",
        items: [
          "Besichtigung: Wir kommen vorbei, wir bewerten nicht nach Grundriss",
          "Unterlagenanalyse: Kataster, Baurecht, Titel und Pläne — vor dem Markt, nicht während der Verhandlung",
          "Begründeter Bericht: der empfohlene Preis, schriftlich, mit den Daten und Vergleichen dahinter",
        ],
        note: "Der Bericht gehört Ihnen, auch wenn Sie sich danach gegen uns entscheiden.",
      },
    ],
    costTitle: "Was es kostet, und wann.",
    costBody:
      "Keine Vorabkosten, in keinem der beiden Schritte. Bezahlt wird erst nach erfolgreichem Verkauf, und Fotos, Video, Home Staging und Unterlagenprüfung gehören zur Methode. Verkaufen wir nicht, zahlen Sie nichts.",
    whyTitle: "Warum der richtige Preis mehr zählt, als es scheint.",
    whyItems: [
      {
        t: "Zu hoch",
        c: "Die Immobilie steht monatelang. Interessenten sehen sie Woche für Woche wieder auftauchen und fragen sich, was nicht stimmt: Sinkt der Preis dann, wirkt das wie Schwäche.",
      },
      {
        t: "Zu niedrig",
        c: "Es verkauft sich schnell — und lässt den berechtigten Zweifel, Geld liegen gelassen zu haben, das niemand zurückgibt.",
      },
      {
        t: "Richtig",
        c: "Er zieht die Menschen an, die wirklich kaufen können, genau dann, wenn das Inserat am sichtbarsten ist: in den ersten Wochen. Dort entscheidet sich fast alles.",
      },
    ],
    formEyebrow: "Erzählen Sie uns von Ihrer Immobilie",
  },
  es: {
    eyebrow: "Valoración de inmuebles · Tradate y provincia",
    title: "Cuánto vale de verdad tu casa.",
    lead: "No lo decide una calculadora en treinta segundos. Lo decide quien viene a verla, comprueba los documentos y escribe cómo ha llegado a esa cifra. El primer encuentro es sin compromiso y sin coste.",
    ctaPrimary: "Solicita la valoración de tu inmueble",
    ctaSecondary: "Cómo funciona",
    tiersEyebrow: "Cómo funciona",
    tiersTitle: "Dos pasos, no uno.",
    tiersIntro:
      "El primero sirve para saber si tiene sentido moverse. El segundo es el documento sobre el que se decide un precio. Son dos cosas distintas y las mantenemos separadas: llamar «valoración» a ambas es la forma más rápida de no hacer bien ninguna.",
    tiers: [
      {
        step: "01",
        name: "Primer contacto",
        lead: "Una conversación, en la oficina o por teléfono. Sin visita y sin compromiso.",
        items: [
          "Nos cuentas el inmueble: dónde está, cuánto mide, en qué estado",
          "Te damos un orden de magnitud según lo que el mercado de esa calle está haciendo ahora",
          "Te decimos qué habría que verificar antes de ponerlo a la venta",
        ],
        note: "Responde a una sola pregunta: ¿tiene sentido moverse ahora? Si la respuesta es no, te lo decimos.",
      },
      {
        step: "02",
        name: "Valoración profesional",
        lead: "El trabajo de verdad, cuando decides seguir. También sin costes por adelantado.",
        items: [
          "Visita: vamos a verlo, no lo tasamos desde un plano",
          "Análisis documental: catastro, urbanismo, títulos y planos, antes del mercado y no durante la negociación",
          "Informe motivado: el precio recomendado, por escrito, con los datos y comparaciones de los que nace",
        ],
        note: "El informe es tuyo, aunque después decidas no vender con nosotras.",
      },
    ],
    costTitle: "Qué cuesta, y cuándo.",
    costBody:
      "Sin costes por adelantado, en ninguno de los dos pasos. Se paga solo cuando la venta se cierra, y fotos, vídeo, home staging y verificación de documentos están incluidos en el método. Si no vendemos, no nos pagáis.",
    whyTitle: "Por qué el precio justo importa más de lo que parece.",
    whyItems: [
      {
        t: "Demasiado alto",
        c: "El inmueble se queda parado meses. Quien busca lo ve reaparecer semana tras semana y empieza a preguntarse qué falla: cuando el precio baja, se lee como debilidad.",
      },
      {
        t: "Demasiado bajo",
        c: "Se vende rápido, y deja la duda —legítima— de haber dejado sobre la mesa un dinero que nadie devuelve.",
      },
      {
        t: "Justo",
        c: "Atrae a quien puede comprar de verdad, en el momento en que el anuncio es más visible: las primeras semanas. Ahí se juega casi todo.",
      },
    ],
    formEyebrow: "Cuéntanos tu inmueble",
  },
};

export default function ValutazioneContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <main className="flex-1 bg-paper">
      <section className="relative bg-cream-deep">
        <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-32 sm:px-8 sm:pb-20 sm:pt-36">
          <Reveal>
            <span className="eyebrow">{c.eyebrow}</span>
          </Reveal>
          <TextLines
            as="h1"
            className="mt-5 max-w-[24ch] font-display text-d2 display-tight font-medium text-ink balance"
          >
            {c.title}
          </TextLines>
          <Reveal delay={120}>
            <p className="mt-7 max-w-2xl text-[1.05rem] leading-relaxed text-graphite">{c.lead}</p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Cta href="#richiesta" variant="cta" size="md">
                {c.ctaPrimary}
              </Cta>
              <Cta href="#come-funziona" variant="ghost" size="md">
                {c.ctaSecondary}
              </Cta>
            </div>
          </Reveal>
        </div>
      </section>

      {/* I DUE LIVELLI — il contenuto vero della pagina (§3.2). */}
      <section id="come-funziona" className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
          <Reveal>
            <span className="eyebrow">{c.tiersEyebrow}</span>
          </Reveal>
          <TextLines
            as="h2"
            className="mt-5 max-w-[20ch] font-display text-d3 display-tight font-medium text-ink"
          >
            {c.tiersTitle}
          </TextLines>
          <Reveal delay={120}>
            <p className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-graphite">
              {c.tiersIntro}
            </p>
          </Reveal>

          <ol className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
            {c.tiers.map((t, i) => (
              <li key={t.step}>
                <Reveal delay={140 + i * 90}>
                  <div className="flex h-full flex-col rounded-card border border-line bg-cream p-7 sm:p-9">
                    <span className="tnum font-display text-3xl font-medium leading-none text-red">
                      {t.step}
                    </span>
                    <h3 className="mt-5 font-display text-2xl font-medium leading-snug text-ink">
                      {t.name}
                    </h3>
                    <p className="mt-3 text-[0.98rem] leading-relaxed text-graphite">{t.lead}</p>
                    <ul className="mt-6 space-y-3 border-t border-line pt-6">
                      {t.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-[0.95rem] leading-snug text-graphite"
                        >
                          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-auto border-l-2 border-red pl-4 pt-6 text-[0.9rem] italic leading-relaxed text-stone">
                      {t.note}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <TextLines
                as="h2"
                className="max-w-[18ch] font-display text-d3 display-tight font-medium text-ink"
              >
                {c.costTitle}
              </TextLines>
              <Reveal delay={120}>
                <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-graphite">
                  {c.costBody}
                </p>
              </Reveal>
            </div>

            {/* Perché il prezzo giusto conta: le tre conseguenze, non tre aggettivi.
                È l'argomento che rende desiderabile il livello 2 senza doverlo vantare. */}
            <div>
              <h2 className="font-display text-2xl font-medium leading-snug text-ink sm:text-[1.7rem]">
                {c.whyTitle}
              </h2>
              <dl className="mt-8 space-y-6">
                {c.whyItems.map((w, i) => (
                  <Reveal key={w.t} delay={100 + i * 80}>
                    <div className="border-t border-line pt-5">
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-red">
                        {w.t}
                      </dt>
                      <dd className="mt-2 text-[0.98rem] leading-relaxed text-graphite">{w.c}</dd>
                    </div>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Il modulo, con l'intento già impostato su "vendo": chi arriva qui non deve
          scegliere una scheda prima di poter scrivere. */}
      <div id="richiesta">
        <Contact initialIntent="seller" />
      </div>
    </main>
  );
}
