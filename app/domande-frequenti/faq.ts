// Domande frequenti del sito — FONTE UNICA.
//
// Vive qui, e non dentro il componente, perché serve a TRE consumatori:
//   • la pagina /domande-frequenti (tutte e cinque le lingue);
//   • i blocchi compatti in coda a /vendi e /acquista (sottoinsiemi, stesso testo);
//   • il JSON-LD FAQPage in page.tsx (solo italiano, come tutti i metadata del sito).
// Se divergessero, i motori leggerebbero risposte diverse da quelle in pagina — che è
// esattamente il tipo di markup che Google considera spam.
//
// ⚠️ REGOLA PER CHI AGGIUNGE UNA VOCE
// Ogni risposta deve essere verificabile leggendo il sito. Niente promesse su tempi di
// vendita, prezzi ottenibili o esiti di trattativa: sono proprio le affermazioni che
// PRODUCT.md vieta, e sono anche quelle che un cliente ricorda quando non si avverano.
// La provenienza di ogni risposta è annotata qui sotto, gruppo per gruppo.
//
// ⚠️ NON è la FAQ di /lavora-con-noi (app/lavora-con-noi/faq.ts), che risponde a chi si
// candida e ha un suo JSON-LD. E non è la FAQ di /open-domus, che entra nel dettaglio del
// format: qui c'è solo la voce di riepilogo, che rimanda a quella pagina.

import type { Locale } from "../lib/i18n/dictionaries";
import { site } from "../lib/site";

export type FaqEntryId =
  | "costi"
  | "prezzo"
  | "prima-online"
  | "doc"
  | "tempi"
  | "open-domus"
  | "documenti-acquisto"
  | "info-visita"
  | "richiesta-su-misura"
  | "dopo-proposta"
  | "zone"
  | "sede-orari"
  | "storia"
  | "contatti";

export type FaqEntry = { id: FaqEntryId; q: string; a: string };
export type FaqGroupId = "vendere" | "acquistare" | "agenzia";
export type FaqGroup = { id: FaqGroupId; title: string; entries: FaqEntry[] };

const orari = `${site.hours.weekdays} da lunedì a venerdì, ${site.hours.saturday} il sabato`;

export const faq: Record<Locale, FaqGroup[]> = {
  it: [
    {
      id: "vendere",
      title: "Vendere casa",
      entries: [
        {
          id: "costi",
          q: "Quanto costa vendere casa con Domus Tua?",
          a: "Il primo incontro è senza impegno e senza costi, e non ci sono costi anticipati: si paga solo a vendita conclusa. Foto, video, home staging e certificazione dei documenti fanno parte del metodo, non sono extra da aggiungere in fondo.",
        },
        {
          id: "prezzo",
          q: "Come stabilite il prezzo della mia casa?",
          a: "Con una valutazione professionale costruita su dati reali: caratteristiche dell'immobile, zona e domanda del momento. Un prezzo troppo alto lascia la casa ferma per mesi, uno troppo basso lascia valore sul tavolo: il nostro lavoro è trovare quello giusto e spiegarti perché.",
        },
        {
          id: "prima-online",
          q: "Cosa succede prima che la casa vada online?",
          a: "Il lavoro più importante. Valutiamo l'immobile, verifichiamo conformità, titoli e planimetrie, prepariamo la casa con consigli mirati e — dove serve — home staging, poi realizziamo foto, video e contenuti e programmiamo l'Open Domus. Quando l'annuncio esce, tutto è già a posto.",
        },
        {
          id: "doc",
          q: "Che cos'è il protocollo Domus D.O.C.?",
          a: "Domus di Origine Certificata è il nostro protocollo sui documenti: conformità, titoli e trasparenza controllati prima di andare sul mercato, non durante la trattativa. È il modo in cui si arriva al rogito senza sorprese, per chi vende e per chi compra.",
        },
        {
          id: "tempi",
          q: "In quanto tempo si vende una casa?",
          a: "Non lo promettiamo, e diffida di chi lo fa: dipende dall'immobile, dalla zona, dal prezzo e dal momento del mercato. Quello che possiamo garantirti è di partire con il prezzo giusto, i documenti in ordine e la casa raccontata bene — cioè le tre cose che i tempi li accorciano davvero.",
        },
        {
          id: "open-domus",
          q: "Che cos'è un Open Domus?",
          a: "È il nostro format di visita: una giornata dedicata in cui la casa è preparata, i documenti sono già disponibili e gli acquirenti prequalificati visitano per appuntamento, senza viavai di curiosi. Sulla pagina Open Domus trovi come si svolge, passo per passo.",
        },
      ],
    },
    {
      id: "acquistare",
      title: "Acquistare casa",
      entries: [
        {
          id: "documenti-acquisto",
          q: "Come faccio a sapere se una casa ha i documenti in ordine?",
          a: "Te lo diciamo noi, prima della proposta. La documentazione degli immobili che seguiamo viene verificata a monte e condivisa con te appena disponibile: sai esattamente che cosa stai acquistando.",
        },
        {
          id: "info-visita",
          q: "Posso avere le informazioni prima della visita?",
          a: "Sì, ed è il modo in cui preferiamo lavorare. Caratteristiche, documenti e contesto arrivano prima che tu entri in casa, così la visita serve a capire se è la tua — non a scoprire com'è fatta.",
        },
        {
          id: "richiesta-su-misura",
          q: "Non trovo quello che cerco tra gli annunci. Posso lasciarvi lo stesso una richiesta?",
          a: "Certo, ed è una buona idea. Molte richieste le seguiamo prima ancora che l'immobile arrivi online: raccontaci zona, budget e quello che conta per te, e ti richiamiamo noi.",
        },
        {
          id: "dopo-proposta",
          q: "Mi seguite anche dopo la proposta?",
          a: "Fino alla firma. Ti assistiamo nel presentare la proposta, nella trattativa e in ogni adempimento che porta al rogito: hai un riferimento umano in ogni passaggio, non un numero verde.",
        },
      ],
    },
    {
      id: "agenzia",
      title: "Domus Tua",
      entries: [
        {
          id: "zone",
          q: "In quali zone lavorate?",
          a: `Tradate e i comuni della provincia di ${site.address.province}, fra il verde del Parco Pineta e i collegamenti per Milano e Malpensa. Lavoriamo dove viviamo: conosciamo il valore di ogni via perché è anche la nostra.`,
        },
        {
          id: "sede-orari",
          q: "Dove siete e quando siete aperti?",
          a: `In ${site.address.street}, ${site.address.city} (${site.address.province}). Siamo aperti ${orari}. Se preferisci, fissiamo un appuntamento fuori orario: basta chiedere.`,
        },
        {
          id: "storia",
          q: "Da quanto tempo esistete?",
          a: `Dal ${site.since}. Siamo un'agenzia indipendente a guida femminile, con ${site.rating} su 5 e ${site.reviewsCount} recensioni Google verificate: è il giudizio delle famiglie che hanno venduto o comprato casa con noi.`,
        },
        {
          id: "contatti",
          q: "Come vi contatto?",
          a: `Come preferisci: telefono ${site.phone.label}, WhatsApp ${site.whatsapp.label}, email ${site.email.label} oppure il modulo di contatto del sito. Ti rispondiamo noi, di persona.`,
        },
      ],
    },
  ],

  en: [
    {
      id: "vendere",
      title: "Selling a home",
      entries: [
        {
          id: "costi",
          q: "How much does it cost to sell with Domus Tua?",
          a: "The first meeting carries no obligation and no cost, and there are no upfront costs: you pay only once the sale is closed. Photography, video, home staging and document certification are part of the method, not extras added at the end.",
        },
        {
          id: "prezzo",
          q: "How do you set the price of my home?",
          a: "With a professional valuation built on real data: the property's features, the area and current demand. Price it too high and the home sits still for months; too low and you leave value on the table. Our job is to find the right figure and explain why.",
        },
        {
          id: "prima-online",
          q: "What happens before the home goes online?",
          a: "The most important work. We value the property, check compliance, titles and floor plans, prepare the home with targeted advice and — where it helps — home staging, then produce photography, video and content and schedule the Open Domus. By the time the listing appears, everything is already in order.",
        },
        {
          id: "doc",
          q: "What is the Domus D.O.C. protocol?",
          a: "Domus of Certified Origin is our paperwork protocol: compliance, titles and transparency checked before going to market, not during the negotiation. It is how you reach the deed with no surprises — whether you are selling or buying.",
        },
        {
          id: "tempi",
          q: "How long does it take to sell a home?",
          a: "We don't promise a figure, and be wary of anyone who does: it depends on the property, the area, the price and the moment. What we can promise is starting with the right price, the paperwork in order and the home well told — the three things that genuinely shorten the wait.",
        },
        {
          id: "open-domus",
          q: "What is an Open Domus?",
          a: "It is our viewing format: a dedicated day where the home is prepared, the documents are already available and pre-qualified buyers visit by appointment, with no parade of the merely curious. The Open Domus page walks through how it unfolds.",
        },
      ],
    },
    {
      id: "acquistare",
      title: "Buying a home",
      entries: [
        {
          id: "documenti-acquisto",
          q: "How do I know a home's paperwork is in order?",
          a: "We tell you, before the offer. The documentation of the homes we handle is checked up front and shared with you as soon as it is available: you know exactly what you are buying.",
        },
        {
          id: "info-visita",
          q: "Can I have the information before the viewing?",
          a: "Yes, and it is how we prefer to work. Features, documents and context reach you before you step inside, so the viewing is about deciding whether the home is yours — not about discovering what it looks like.",
        },
        {
          id: "richiesta-su-misura",
          q: "I can't find what I'm looking for in the listings. Can I still leave a request?",
          a: "Of course, and it is a good idea. We follow many requests before the property even goes online: tell us the area, the budget and what matters to you, and we'll call you back.",
        },
        {
          id: "dopo-proposta",
          q: "Do you stay with me after the offer?",
          a: "All the way to the signature. We support you in presenting the offer, in the negotiation and in every step leading to the deed: you have a human point of reference throughout, not a call centre.",
        },
      ],
    },
    {
      id: "agenzia",
      title: "Domus Tua",
      entries: [
        {
          id: "zone",
          q: "Which areas do you cover?",
          a: `Tradate and the towns of the ${site.address.province} province, between the green of the Pineta park and the connections to Milan and Malpensa. We work where we live: we know the value of every street because it is ours too.`,
        },
        {
          id: "sede-orari",
          q: "Where are you and when are you open?",
          a: `At ${site.address.street}, ${site.address.city} (${site.address.province}). We are open ${site.hours.weekdays} Monday to Friday and ${site.hours.saturday} on Saturday. If it suits you better, we can arrange an appointment outside those hours — just ask.`,
        },
        {
          id: "storia",
          q: "How long have you been around?",
          a: `Since ${site.since}. We are an independent, women-led agency with ${site.rating} out of 5 from ${site.reviewsCount} verified Google reviews: the verdict of the families who sold or bought a home with us.`,
        },
        {
          id: "contatti",
          q: "How do I get in touch?",
          a: `Whichever way suits you: phone ${site.phone.label}, WhatsApp ${site.whatsapp.label}, email ${site.email.label} or the contact form on this site. You'll hear back from us, in person.`,
        },
      ],
    },
  ],

  fr: [
    {
      id: "vendere",
      title: "Vendre un bien",
      entries: [
        {
          id: "costi",
          q: "Combien coûte la vente avec Domus Tua ?",
          a: "Le premier rendez-vous est sans engagement et sans frais, et il n'y a aucun frais d'avance : vous ne payez qu'une fois la vente conclue. Photos, vidéo, home staging et certification des documents font partie de la méthode, ce ne sont pas des suppléments ajoutés à la fin.",
        },
        {
          id: "prezzo",
          q: "Comment fixez-vous le prix de mon bien ?",
          a: "Par une estimation professionnelle fondée sur des données réelles : caractéristiques du bien, quartier et demande du moment. Trop haut, le bien reste immobile des mois ; trop bas, vous laissez de la valeur sur la table. Notre travail est de trouver le juste prix et de vous expliquer pourquoi.",
        },
        {
          id: "prima-online",
          q: "Que se passe-t-il avant la mise en ligne ?",
          a: "Le travail le plus important. Nous estimons le bien, vérifions conformité, titres et plans, préparons la maison avec des conseils ciblés et — si nécessaire — du home staging, puis réalisons photos, vidéo et contenus et programmons l'Open Domus. Quand l'annonce paraît, tout est déjà en ordre.",
        },
        {
          id: "doc",
          q: "Qu'est-ce que le protocole Domus D.O.C. ?",
          a: "Domus d'Origine Certifiée est notre protocole documentaire : conformité, titres et transparence contrôlés avant la mise sur le marché, et non pendant la négociation. C'est ainsi qu'on arrive à l'acte sans mauvaises surprises, que l'on vende ou que l'on achète.",
        },
        {
          id: "tempi",
          q: "En combien de temps vend-on un bien ?",
          a: "Nous ne le promettons pas, et méfiez-vous de qui le promet : cela dépend du bien, du quartier, du prix et du moment. Ce que nous garantissons, c'est de partir avec le bon prix, les documents en règle et une maison bien racontée — les trois choses qui raccourcissent vraiment les délais.",
        },
        {
          id: "open-domus",
          q: "Qu'est-ce qu'un Open Domus ?",
          a: "C'est notre format de visite : une journée dédiée où la maison est préparée, les documents déjà disponibles et les acquéreurs préqualifiés visitent sur rendez-vous, sans défilé de curieux. La page Open Domus détaille chaque étape.",
        },
      ],
    },
    {
      id: "acquistare",
      title: "Acheter un bien",
      entries: [
        {
          id: "documenti-acquisto",
          q: "Comment savoir si les documents d'un bien sont en règle ?",
          a: "Nous vous le disons, avant l'offre. La documentation des biens que nous suivons est vérifiée en amont et partagée avec vous dès qu'elle est disponible : vous savez exactement ce que vous achetez.",
        },
        {
          id: "info-visita",
          q: "Puis-je avoir les informations avant la visite ?",
          a: "Oui, et c'est notre façon de travailler. Caractéristiques, documents et contexte vous parviennent avant que vous entriez : la visite sert à décider si le bien est le vôtre, pas à découvrir à quoi il ressemble.",
        },
        {
          id: "richiesta-su-misura",
          q: "Je ne trouve pas ce que je cherche dans les annonces. Puis-je quand même vous laisser une demande ?",
          a: "Bien sûr, et c'est une bonne idée. Nous suivons beaucoup de demandes avant même que le bien soit en ligne : dites-nous le secteur, le budget et ce qui compte pour vous, nous vous rappelons.",
        },
        {
          id: "dopo-proposta",
          q: "M'accompagnez-vous aussi après l'offre ?",
          a: "Jusqu'à la signature. Nous vous assistons dans la présentation de l'offre, dans la négociation et dans chaque démarche menant à l'acte : vous avez un interlocuteur humain à chaque étape, pas un numéro vert.",
        },
      ],
    },
    {
      id: "agenzia",
      title: "Domus Tua",
      entries: [
        {
          id: "zone",
          q: "Dans quels secteurs travaillez-vous ?",
          a: `Tradate et les communes de la province de ${site.address.province}, entre le vert du parc Pineta et les liaisons vers Milan et Malpensa. Nous travaillons là où nous vivons : nous connaissons la valeur de chaque rue, parce qu'elle est aussi la nôtre.`,
        },
        {
          id: "sede-orari",
          q: "Où êtes-vous et quels sont vos horaires ?",
          a: `${site.address.street}, ${site.address.city} (${site.address.province}). Nous sommes ouverts ${site.hours.weekdays} du lundi au vendredi et ${site.hours.saturday} le samedi. Sur demande, nous fixons aussi un rendez-vous en dehors de ces horaires.`,
        },
        {
          id: "storia",
          q: "Depuis quand existez-vous ?",
          a: `Depuis ${site.since}. Nous sommes une agence indépendante dirigée par des femmes, avec ${site.rating} sur 5 et ${site.reviewsCount} avis Google vérifiés : le jugement des familles qui ont vendu ou acheté avec nous.`,
        },
        {
          id: "contatti",
          q: "Comment vous contacter ?",
          a: `Comme vous préférez : téléphone ${site.phone.label}, WhatsApp ${site.whatsapp.label}, e-mail ${site.email.label} ou le formulaire du site. C'est nous qui vous répondons, en personne.`,
        },
      ],
    },
  ],

  de: [
    {
      id: "vendere",
      title: "Verkaufen",
      entries: [
        {
          id: "costi",
          q: "Was kostet der Verkauf mit Domus Tua?",
          a: "Das erste Gespräch ist unverbindlich und kostenfrei, und es fallen keine Vorabkosten an: Sie zahlen erst nach erfolgreichem Verkauf. Fotos, Video, Home Staging und die Zertifizierung der Unterlagen gehören zur Methode und sind keine Extras am Ende.",
        },
        {
          id: "prezzo",
          q: "Wie bestimmen Sie den Preis meiner Immobilie?",
          a: "Mit einer professionellen Bewertung auf Basis echter Daten: Eigenschaften der Immobilie, Lage und aktuelle Nachfrage. Zu hoch angesetzt bleibt die Immobilie monatelang stehen, zu niedrig verschenken Sie Wert. Unsere Aufgabe ist der richtige Preis — und die Erklärung dazu.",
        },
        {
          id: "prima-online",
          q: "Was passiert, bevor die Immobilie online geht?",
          a: "Die wichtigste Arbeit. Wir bewerten die Immobilie, prüfen Konformität, Titel und Grundrisse, bereiten das Haus mit gezielten Hinweisen und — wo es hilft — mit Home Staging vor, erstellen dann Fotos, Video und Inhalte und planen den Open Domus. Wenn das Inserat erscheint, ist alles bereits in Ordnung.",
        },
        {
          id: "doc",
          q: "Was ist das Protokoll Domus D.O.C.?",
          a: "Domus di Origine Certificata ist unser Unterlagen-Protokoll: Konformität, Titel und Transparenz werden vor dem Markteintritt geprüft, nicht während der Verhandlung. So kommt man ohne Überraschungen zum Notartermin — beim Verkauf wie beim Kauf.",
        },
        {
          id: "tempi",
          q: "Wie lange dauert ein Verkauf?",
          a: "Wir versprechen keine Zahl, und seien Sie misstrauisch, wenn es jemand tut: Es hängt von der Immobilie, der Lage, dem Preis und dem Zeitpunkt ab. Versprechen können wir den richtigen Startpreis, geordnete Unterlagen und eine gut erzählte Immobilie — die drei Dinge, die die Dauer wirklich verkürzen.",
        },
        {
          id: "open-domus",
          q: "Was ist ein Open Domus?",
          a: "Unser Besichtigungsformat: ein eigener Tag, an dem das Haus vorbereitet ist, die Unterlagen bereitliegen und vorqualifizierte Interessenten nach Termin kommen — ohne Schaulustige. Auf der Seite Open Domus steht Schritt für Schritt, wie es abläuft.",
        },
      ],
    },
    {
      id: "acquistare",
      title: "Kaufen",
      entries: [
        {
          id: "documenti-acquisto",
          q: "Woher weiß ich, ob die Unterlagen einer Immobilie in Ordnung sind?",
          a: "Wir sagen es Ihnen, vor dem Angebot. Die Unterlagen der Immobilien, die wir betreuen, werden im Vorfeld geprüft und mit Ihnen geteilt, sobald sie vorliegen: Sie wissen genau, was Sie kaufen.",
        },
        {
          id: "info-visita",
          q: "Bekomme ich die Informationen schon vor der Besichtigung?",
          a: "Ja, und so arbeiten wir am liebsten. Eigenschaften, Unterlagen und Umfeld erreichen Sie, bevor Sie eintreten: Die Besichtigung dient der Entscheidung, nicht der Entdeckung.",
        },
        {
          id: "richiesta-su-misura",
          q: "Ich finde nichts Passendes in den Angeboten. Kann ich trotzdem eine Anfrage hinterlassen?",
          a: "Natürlich, und es ist eine gute Idee. Viele Anfragen betreuen wir, bevor eine Immobilie überhaupt online geht: Sagen Sie uns Gegend, Budget und was Ihnen wichtig ist — wir melden uns.",
        },
        {
          id: "dopo-proposta",
          q: "Begleiten Sie mich auch nach dem Angebot?",
          a: "Bis zur Unterschrift. Wir unterstützen Sie beim Angebot, in der Verhandlung und bei jedem Schritt bis zum Notartermin: Sie haben durchgehend einen persönlichen Ansprechpartner, keine Hotline.",
        },
      ],
    },
    {
      id: "agenzia",
      title: "Domus Tua",
      entries: [
        {
          id: "zone",
          q: "In welchen Gebieten arbeiten Sie?",
          a: `Tradate und die Gemeinden der Provinz ${site.address.province}, zwischen dem Grün des Pineta-Parks und den Verbindungen nach Mailand und Malpensa. Wir arbeiten dort, wo wir leben: Wir kennen den Wert jeder Straße, denn es sind auch unsere.`,
        },
        {
          id: "sede-orari",
          q: "Wo sind Sie und wann haben Sie geöffnet?",
          a: `${site.address.street}, ${site.address.city} (${site.address.province}). Geöffnet ${site.hours.weekdays} von Montag bis Freitag und ${site.hours.saturday} am Samstag. Auf Wunsch vereinbaren wir auch einen Termin außerhalb dieser Zeiten.`,
        },
        {
          id: "storia",
          q: "Seit wann gibt es Sie?",
          a: `Seit ${site.since}. Wir sind eine unabhängige, von Frauen geführte Agentur mit ${site.rating} von 5 aus ${site.reviewsCount} verifizierten Google-Bewertungen: das Urteil der Familien, die mit uns verkauft oder gekauft haben.`,
        },
        {
          id: "contatti",
          q: "Wie erreiche ich Sie?",
          a: `Wie es Ihnen lieber ist: Telefon ${site.phone.label}, WhatsApp ${site.whatsapp.label}, E-Mail ${site.email.label} oder das Kontaktformular. Sie hören von uns — persönlich.`,
        },
      ],
    },
  ],

  es: [
    {
      id: "vendere",
      title: "Vender casa",
      entries: [
        {
          id: "costi",
          q: "¿Cuánto cuesta vender con Domus Tua?",
          a: "El primer encuentro es sin compromiso y sin coste, y no hay costes por adelantado: se paga solo cuando la venta se cierra. Fotos, vídeo, home staging y certificación de los documentos forman parte del método, no son extras que aparecen al final.",
        },
        {
          id: "prezzo",
          q: "¿Cómo fijáis el precio de mi casa?",
          a: "Con una valoración profesional basada en datos reales: características del inmueble, zona y demanda del momento. Un precio demasiado alto deja la casa parada meses; uno demasiado bajo deja valor sobre la mesa. Nuestro trabajo es dar con el correcto y explicarte por qué.",
        },
        {
          id: "prima-online",
          q: "¿Qué pasa antes de que la casa salga online?",
          a: "El trabajo más importante. Valoramos el inmueble, comprobamos conformidad, títulos y planos, preparamos la casa con consejos concretos y —donde hace falta— home staging, y después hacemos fotos, vídeo y contenidos y programamos el Open Domus. Cuando el anuncio aparece, todo está ya en orden.",
        },
        {
          id: "doc",
          q: "¿Qué es el protocolo Domus D.O.C.?",
          a: "Domus di Origine Certificata es nuestro protocolo documental: conformidad, títulos y transparencia comprobados antes de salir al mercado, no durante la negociación. Así se llega a la escritura sin sorpresas, tanto si vendes como si compras.",
        },
        {
          id: "tempi",
          q: "¿Cuánto se tarda en vender una casa?",
          a: "No lo prometemos, y desconfía de quien lo haga: depende del inmueble, la zona, el precio y el momento. Lo que sí garantizamos es salir con el precio correcto, los documentos en regla y la casa bien contada: las tres cosas que de verdad acortan los plazos.",
        },
        {
          id: "open-domus",
          q: "¿Qué es un Open Domus?",
          a: "Es nuestro formato de visita: una jornada dedicada en la que la casa está preparada, los documentos ya disponibles y los compradores precualificados visitan con cita, sin desfile de curiosos. En la página Open Domus está el paso a paso.",
        },
      ],
    },
    {
      id: "acquistare",
      title: "Comprar casa",
      entries: [
        {
          id: "documenti-acquisto",
          q: "¿Cómo sé si una casa tiene los documentos en regla?",
          a: "Te lo decimos nosotras, antes de la propuesta. La documentación de los inmuebles que llevamos se comprueba de antemano y se comparte contigo en cuanto está disponible: sabes exactamente qué estás comprando.",
        },
        {
          id: "info-visita",
          q: "¿Puedo tener la información antes de la visita?",
          a: "Sí, y es como preferimos trabajar. Características, documentos y contexto te llegan antes de entrar: la visita sirve para decidir si la casa es la tuya, no para descubrir cómo es.",
        },
        {
          id: "richiesta-su-misura",
          q: "No encuentro lo que busco entre los anuncios. ¿Puedo dejaros igualmente una petición?",
          a: "Claro, y es buena idea. Muchas peticiones las seguimos antes de que el inmueble llegue a estar online: cuéntanos zona, presupuesto y lo que te importa, y te llamamos nosotras.",
        },
        {
          id: "dopo-proposta",
          q: "¿Me acompañáis también después de la propuesta?",
          a: "Hasta la firma. Te asistimos al presentar la propuesta, en la negociación y en cada trámite hasta la escritura: tienes una referencia humana en cada paso, no un número de atención.",
        },
      ],
    },
    {
      id: "agenzia",
      title: "Domus Tua",
      entries: [
        {
          id: "zone",
          q: "¿En qué zonas trabajáis?",
          a: `Tradate y los municipios de la provincia de ${site.address.province}, entre el verde del parque Pineta y las conexiones con Milán y Malpensa. Trabajamos donde vivimos: conocemos el valor de cada calle porque también es la nuestra.`,
        },
        {
          id: "sede-orari",
          q: "¿Dónde estáis y cuándo abrís?",
          a: `En ${site.address.street}, ${site.address.city} (${site.address.province}). Abrimos ${site.hours.weekdays} de lunes a viernes y ${site.hours.saturday} los sábados. Si te viene mejor, fijamos una cita fuera de ese horario: solo hay que pedirlo.`,
        },
        {
          id: "storia",
          q: "¿Desde cuándo existís?",
          a: `Desde ${site.since}. Somos una agencia independiente dirigida por mujeres, con ${site.rating} sobre 5 y ${site.reviewsCount} reseñas de Google verificadas: el juicio de las familias que vendieron o compraron casa con nosotras.`,
        },
        {
          id: "contatti",
          q: "¿Cómo os contacto?",
          a: `Como prefieras: teléfono ${site.phone.label}, WhatsApp ${site.whatsapp.label}, correo ${site.email.label} o el formulario de la web. Te respondemos nosotras, en persona.`,
        },
      ],
    },
  ],
};

/** Tutte le domande di una lingua, in ordine di pagina. Usato dal JSON-LD e dai test. */
export function faqFlat(locale: Locale): FaqEntry[] {
  return faq[locale].flatMap((group) => group.entries);
}

/** Sottoinsieme per i blocchi compatti in coda a /vendi e /acquista. */
export function faqPick(locale: Locale, ids: readonly FaqEntryId[]): FaqEntry[] {
  const all = faqFlat(locale);
  return ids.map((id) => all.find((e) => e.id === id)).filter((e): e is FaqEntry => e !== undefined);
}

/** Le domande mostrate in coda a /vendi. */
export const FAQ_SELLER: readonly FaqEntryId[] = ["costi", "prezzo", "tempi", "doc"];
/** Le domande mostrate in coda a /acquista. */
export const FAQ_BUYER: readonly FaqEntryId[] = [
  "documenti-acquisto",
  "info-visita",
  "richiesta-su-misura",
  "dopo-proposta",
];
