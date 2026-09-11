"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SendCta, CtaButton } from "./primitives/Cta";
import { site, callback } from "../lib/site";
import { buildWhatsAppUrl } from "../lib/forms/whatsapp";
import { formatLeadMessage, submitLead, type Lead, type LeadIntent } from "../lib/forms/lead";
import { isEmailFormat, isPhoneFormat } from "../lib/forms/contactChannel";
import { CONVERSIONS, trackConversion } from "../lib/analytics";
import Reveal from "./Reveal";
import TextLines from "./motion/TextLines";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";

// Percorsi lead. `key` è il tipo lead (LeadIntent) — utile per una futura integrazione
// CRM: lead type + source page + immobile selezionato (vedi docs/form-backend-next-step.md).
const leadOptions = [
  { key: "seller" },
  { key: "buyer" },
  { key: "question" },
  { key: "open-domus" },
] as const;

const copy = {
  it: {
    eyebrow: "Parla con Domus Tua",
    badge: "Primo passo",
    title: "Inizia dal primo passo: una valutazione seria della tua casa.",
    subcopy:
      "Raccontaci il tuo immobile o cosa stai cercando. Ti aiuteremo a capire valore, possibilità e il percorso migliore, senza impegno.",
    leadSeller: "Voglio vendere",
    leadBuyer: "Cerco casa",
    leadQuestion: "Ho una domanda",
    leadOpenDomus: "Open Domus",
    leadCareer: "Lavora con noi",
    nameLabel: "Nome e cognome",
    namePlaceholder: "Es. Maria Rossi",
    phoneLabel: "Telefono",
    phonePlaceholder: "Es. 333 1234567",
    emailLabel: "Email",
    emailPlaceholder: "Es. maria@email.it",
    surfaceLabel: "Superficie (m²)",
    surfacePlaceholder: "Es. 120",
    timingLabel: "Tempistica",
    timingLabelSell: "In quanto tempo vorresti vendere?",
    timingPlaceholder: "Quando vorresti procedere?",
    timing: {
      asap: "Il prima possibile",
      within3: "Entro 3 mesi",
      within12: "Da 3 a 12 mesi",
      exploring: "Sto solo valutando",
    },
    placeLabelSell: "Indirizzo dell’immobile",
    placeLabelBuy: "Zona desiderata",
    placeLabelOpen: "Zona di interesse",
    placePlaceholderSell: "Es. via Roma 12, Tradate — o anche solo il comune",
    placePlaceholderBuy: "Es. Tradate, Varese e dintorni",
    typeLabel: "Tipologia",
    typePlaceholder: "Es. Trilocale, villa, ufficio",
    budgetLabel: "Budget indicativo",
    budgetPlaceholder: "Es. fino a 250.000 €",
    featuresLabel: "Caratteristiche",
    featuresPlaceholder: "Es. giardino, box, ascensore",
    messageLabel: "Messaggio",
    messageLabelOptional: "Messaggio (facoltativo)",
    messagePlaceholderSell: "Raccontaci qualcosa in più sull’immobile…",
    messagePlaceholderQuestion: "Come possiamo aiutarti?",
    submitSeller: "Richiedi la valutazione",
    submitBuyer: "Trova la casa giusta",
    submitQuestion: "Invia la richiesta",
    submitOpenDomus: "Scopri se Open Domus è adatto al tuo immobile",
    submitCareer: "Invia la candidatura",
    errName: "Inserisci il tuo nome.",
    errContact: "Lasciaci un telefono o un’email per ricontattarti.",
    errEmail: "Controlla l’indirizzo email.",
    errPhone: "Controlla il numero di telefono.",
    sentPrefix: "Stiamo aprendo WhatsApp. Se non si apre,",
    sentLink: "scrivici al",
    gdpr: "Usiamo i tuoi dati solo per rispondere alla tua richiesta.",
    consentPre: "Ho letto l’",
    consentLinkText: "informativa privacy",
    consentPost: " e acconsento al trattamento dei miei dati per essere ricontattato.",
    errConsent: "Per procedere accetta l’informativa privacy.",
    reassure:
      "Ti ricontattiamo personalmente entro 24 ore lavorative. Nessun preventivo automatico, nessun dato ceduto a terzi. E se poi non è il momento giusto, va benissimo.",
    contactPhoneSub: "Lun–Sab",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Scrivici una mail",
    // §6.6 — un testo sopra il modulo PER OGNI intento. Il documento ne scrive uno solo,
    // per il proprietario, ma qui lo stesso modulo serve quattro pubblici con le tab: la
    // frase del §6.6 sopra «Cerco casa» direbbe la cosa sbagliata alla persona sbagliata.
    // Sul ramo venditore la frase è quella del documento, parola per parola.
    subcopyBy: {
      seller: "Raccontaci il tuo immobile. Ti diciamo cosa vale, cosa serve e qual è il percorso migliore.",
      buyer: "Raccontaci cosa stai cercando. Ti diciamo cosa c’è, cosa sta per arrivare e cosa conviene guardare.",
      question: "Scrivici la domanda. Ti risponde una persona, non un modulo automatico.",
      "open-domus": "Raccontaci l’immobile. Ti diciamo se Open Domus è il formato giusto per venderlo.",
      career: "Raccontaci chi sei. Leggiamo tutte le candidature che arrivano.",
    } as Record<LeadIntent, string>,
    sentTitleOk: "Abbiamo ricevuto la tua richiesta.",
    sentTitlePending: "Il tuo messaggio è pronto su WhatsApp.",
    sentNotDelivered:
      "Il modulo non è riuscito a registrarla dai nostri sistemi: manda il messaggio che si è aperto, oppure chiamaci allo",
    nextTitle: "Cosa succede adesso",
    nextTitleIfFailed: "Cosa succede appena ci arriva",
    nextWhen: "Ti richiamiamo entro 24 ore lavorative, e poi resta la stessa persona fino al rogito.",
    nextNumberPre: "Se ti arriva una chiamata dallo",
    nextNumberPost: ", siamo noi.",
    prepareTitle: "Cosa puoi preparare, se ce l’hai",
    prepareBy: {
      seller:
        "Planimetria catastale, atto di provenienza e attestato energetico. Se non li trovi non è un problema: la verifica dei documenti è compresa nel metodo.",
      buyer:
        "Quanto vuoi investire e le zone che escludi. Le esclusioni servono più delle preferenze: accorciano la ricerca invece di allungarla.",
      question: "Niente. Se la domanda riguarda un immobile preciso, tieni a portata il riferimento.",
      "open-domus":
        "Le foto che hai dell’immobile e i documenti che ti ritrovi in casa. Al resto della preparazione pensiamo noi.",
      career: "Il curriculum, se ne hai uno. Altrimenti bastano due righe su cosa sai fare.",
    } as Record<LeadIntent, string>,
    resend: "Manda un’altra richiesta",
    aboutProperty: "Richiesta per questo immobile:",
    keysAlt: "Raffaela Rizza con le chiavi di casa",
  },
  en: {
    eyebrow: "Talk to Domus Tua",
    badge: "First step",
    title: "Start with the first step: a serious valuation of your home.",
    subcopy:
      "Tell us about your property or what you’re looking for. We’ll help you understand its value, your options and the best path forward, with no obligation.",
    leadSeller: "I want to sell",
    leadBuyer: "I’m looking for a home",
    leadQuestion: "I have a question",
    leadOpenDomus: "Open Domus",
    leadCareer: "Work with us",
    nameLabel: "Full name",
    namePlaceholder: "E.g. Maria Rossi",
    phoneLabel: "Phone",
    phonePlaceholder: "E.g. 333 1234567",
    emailLabel: "Email",
    emailPlaceholder: "E.g. maria@email.it",
    surfaceLabel: "Surface area (m²)",
    surfacePlaceholder: "E.g. 120",
    timingLabel: "Timing",
    timingLabelSell: "How soon would you like to sell?",
    timingPlaceholder: "When would you like to proceed?",
    timing: {
      asap: "As soon as possible",
      within3: "Within 3 months",
      within12: "3 to 12 months",
      exploring: "Just exploring",
    },
    placeLabelSell: "Address of the property",
    placeLabelBuy: "Preferred area",
    placeLabelOpen: "Area of interest",
    placePlaceholderSell: "E.g. via Roma 12, Tradate — or just the town",
    placePlaceholderBuy: "E.g. Tradate, Varese and nearby",
    typeLabel: "Property type",
    typePlaceholder: "E.g. two-bed flat, villa, office",
    budgetLabel: "Indicative budget",
    budgetPlaceholder: "E.g. up to €250,000",
    featuresLabel: "Features",
    featuresPlaceholder: "E.g. garden, garage, lift",
    messageLabel: "Message",
    messageLabelOptional: "Message (optional)",
    messagePlaceholderSell: "Tell us a little more about the property…",
    messagePlaceholderQuestion: "How can we help you?",
    submitSeller: "Request a valuation",
    submitBuyer: "Find the right home",
    submitQuestion: "Send your request",
    submitOpenDomus: "See if Open Domus suits your property",
    submitCareer: "Send your application",
    errName: "Please enter your name.",
    errContact: "Leave us a phone number or an email so we can reply.",
    errEmail: "Please check the email address.",
    errPhone: "Please check the phone number.",
    sentPrefix: "We’re opening WhatsApp. If it doesn’t open,",
    sentLink: "message us at",
    gdpr: "We use your data only to reply to your request.",
    consentPre: "I have read the ",
    consentLinkText: "privacy policy",
    consentPost: " and consent to the processing of my data to be contacted back.",
    errConsent: "Please accept the privacy policy to continue.",
    reassure:
      "We get back to you personally within 24 working hours. No automated estimate, no data passed to third parties. And if it turns out not to be the right moment, that is absolutely fine.",
    contactPhoneSub: "Mon–Sat",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Send us an email",
    subcopyBy: {
      seller: "Tell us about your property. We’ll tell you what it’s worth, what it needs and which route makes sense.",
      buyer: "Tell us what you’re looking for. We’ll tell you what’s available, what’s coming and what’s worth seeing.",
      question: "Write us your question. A person answers, not an autoresponder.",
      "open-domus": "Tell us about the property. We’ll tell you whether Open Domus is the right format to sell it.",
      career: "Tell us who you are. We read every application that reaches us.",
    } as Record<LeadIntent, string>,
    sentTitleOk: "Your request has reached us.",
    sentTitlePending: "Your message is ready in WhatsApp.",
    sentNotDelivered:
      "The form could not log it on our systems: send the message that just opened, or call us on",
    nextTitle: "What happens next",
    nextTitleIfFailed: "What happens once it reaches us",
    nextWhen: "We call you back within 24 working hours, and the same person stays with you to the deed.",
    nextNumberPre: "If a call comes in from",
    nextNumberPost: ", that’s us.",
    prepareTitle: "What you can get ready, if you have it",
    prepareBy: {
      seller:
        "Cadastral floor plan, deed of provenance and energy certificate. If you can’t find them it’s no problem: checking the paperwork is part of the method.",
      buyer:
        "How much you want to spend, and the areas you rule out. Exclusions help more than preferences: they shorten the search instead of widening it.",
      question: "Nothing. If your question is about a specific property, keep its reference to hand.",
      "open-domus":
        "Whatever photos of the property you have, and the documents you keep at home. The rest of the preparation is ours.",
      career: "A CV, if you have one. Otherwise a couple of lines on what you can do.",
    } as Record<LeadIntent, string>,
    resend: "Send another request",
    aboutProperty: "Request about this property:",
    keysAlt: "Raffaela Rizza holding the keys to a home",
  },
  fr: {
    eyebrow: "Parlez à Domus Tua",
    badge: "Première étape",
    title: "Commencez par la première étape : une estimation sérieuse de votre bien.",
    subcopy:
      "Parlez-nous de votre bien ou de ce que vous recherchez. Nous vous aiderons à en comprendre la valeur, les possibilités et la meilleure voie à suivre, sans engagement.",
    leadSeller: "Je veux vendre",
    leadBuyer: "Je cherche un bien",
    leadQuestion: "J’ai une question",
    leadOpenDomus: "Open Domus",
    leadCareer: "Rejoignez-nous",
    nameLabel: "Nom et prénom",
    namePlaceholder: "Ex. Maria Rossi",
    phoneLabel: "Téléphone",
    phonePlaceholder: "Ex. 333 1234567",
    emailLabel: "E-mail",
    emailPlaceholder: "Ex. maria@email.it",
    surfaceLabel: "Surface (m²)",
    surfacePlaceholder: "Ex. 120",
    timingLabel: "Échéance",
    timingLabelSell: "Dans quel délai souhaitez-vous vendre ?",
    timingPlaceholder: "Quand souhaitez-vous avancer ?",
    timing: {
      asap: "Dès que possible",
      within3: "Sous 3 mois",
      within12: "De 3 à 12 mois",
      exploring: "Je me renseigne",
    },
    placeLabelSell: "Adresse du bien",
    placeLabelBuy: "Secteur souhaité",
    placeLabelOpen: "Secteur d’intérêt",
    placePlaceholderSell: "Ex. via Roma 12, Tradate — ou simplement la commune",
    placePlaceholderBuy: "Ex. Tradate, Varese et alentours",
    typeLabel: "Type de bien",
    typePlaceholder: "Ex. trois-pièces, villa, bureau",
    budgetLabel: "Budget indicatif",
    budgetPlaceholder: "Ex. jusqu’à 250 000 €",
    featuresLabel: "Caractéristiques",
    featuresPlaceholder: "Ex. jardin, garage, ascenseur",
    messageLabel: "Message",
    messageLabelOptional: "Message (facultatif)",
    messagePlaceholderSell: "Dites-nous en un peu plus sur le bien…",
    messagePlaceholderQuestion: "Comment pouvons-nous vous aider ?",
    submitSeller: "Demander l’estimation",
    submitBuyer: "Trouver le bon logement",
    submitQuestion: "Envoyer la demande",
    submitOpenDomus: "Découvrez si Open Domus convient à votre bien",
    submitCareer: "Envoyer ma candidature",
    errName: "Veuillez indiquer votre nom.",
    errContact: "Laissez-nous un téléphone ou un e-mail pour vous recontacter.",
    errEmail: "Veuillez vérifier l’adresse e-mail.",
    errPhone: "Veuillez vérifier le numéro de téléphone.",
    sentPrefix: "Nous ouvrons WhatsApp. S’il ne s’ouvre pas,",
    sentLink: "écrivez-nous au",
    gdpr: "Nous utilisons vos données uniquement pour répondre à votre demande.",
    consentPre: "J’ai lu la ",
    consentLinkText: "politique de confidentialité",
    consentPost: " et je consens au traitement de mes données pour être recontacté.",
    errConsent: "Veuillez accepter la politique de confidentialité pour continuer.",
    reassure:
      "Nous vous recontactons personnellement sous 24 heures ouvrées. Aucun devis automatique, aucune donnée cédée à des tiers. Et si ce n’est finalement pas le bon moment, c’est très bien ainsi.",
    contactPhoneSub: "Lun–Sam",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Écrivez-nous un e-mail",
    subcopyBy: {
      seller: "Parlez-nous de votre bien. Nous vous disons ce qu’il vaut, ce qu’il lui faut et quel est le meilleur parcours.",
      buyer: "Dites-nous ce que vous cherchez. Nous vous disons ce qui existe, ce qui arrive et ce qui mérite une visite.",
      question: "Écrivez-nous votre question. C’est une personne qui répond, pas un automate.",
      "open-domus": "Parlez-nous du bien. Nous vous dirons si Open Domus est le bon format pour le vendre.",
      career: "Dites-nous qui vous êtes. Nous lisons toutes les candidatures qui nous parviennent.",
    } as Record<LeadIntent, string>,
    sentTitleOk: "Nous avons bien votre demande.",
    sentTitlePending: "Votre message est prêt dans WhatsApp.",
    sentNotDelivered:
      "Le formulaire n’a pas pu l’enregistrer sur nos systèmes : envoyez le message qui vient de s’ouvrir, ou appelez-nous au",
    nextTitle: "Ce qui se passe maintenant",
    nextTitleIfFailed: "Ce qui se passe dès que nous la recevons",
    nextWhen: "Nous vous rappelons sous 24 heures ouvrées, et c’est la même personne jusqu’à l’acte.",
    nextNumberPre: "Si un appel arrive du",
    nextNumberPost: ", c’est nous.",
    prepareTitle: "Ce que vous pouvez préparer, si vous l’avez",
    prepareBy: {
      seller:
        "Plan cadastral, titre de propriété et diagnostic de performance énergétique. Si vous ne les trouvez pas, ce n’est pas grave : la vérification des documents fait partie de la méthode.",
      buyer:
        "Votre budget et les secteurs que vous excluez. Les exclusions servent plus que les préférences : elles raccourcissent la recherche au lieu de l’élargir.",
      question: "Rien. Si votre question porte sur un bien précis, gardez sa référence sous la main.",
      "open-domus":
        "Les photos que vous avez du bien et les documents que vous gardez chez vous. Le reste de la préparation, c’est nous.",
      career: "Un CV, si vous en avez un. Sinon, deux lignes sur ce que vous savez faire.",
    } as Record<LeadIntent, string>,
    resend: "Envoyer une autre demande",
    aboutProperty: "Demande concernant ce bien :",
    keysAlt: "Raffaela Rizza tenant les clés d’une maison",
  },
  de: {
    eyebrow: "Sprechen Sie mit Domus Tua",
    badge: "Erster Schritt",
    title: "Beginnen Sie mit dem ersten Schritt: einer fundierten Bewertung Ihrer Immobilie.",
    subcopy:
      "Erzählen Sie uns von Ihrer Immobilie oder wonach Sie suchen. Wir helfen Ihnen, Wert, Möglichkeiten und den besten Weg zu verstehen – unverbindlich.",
    leadSeller: "Ich möchte verkaufen",
    leadBuyer: "Ich suche ein Zuhause",
    leadQuestion: "Ich habe eine Frage",
    leadOpenDomus: "Open Domus",
    leadCareer: "Arbeiten Sie mit uns",
    nameLabel: "Vor- und Nachname",
    namePlaceholder: "Z. B. Maria Rossi",
    phoneLabel: "Telefon",
    phonePlaceholder: "Z. B. 333 1234567",
    emailLabel: "E-Mail",
    emailPlaceholder: "Z. B. maria@email.it",
    surfaceLabel: "Fläche (m²)",
    surfacePlaceholder: "Z. B. 120",
    timingLabel: "Zeitrahmen",
    timingLabelSell: "In welchem Zeitraum möchten Sie verkaufen?",
    timingPlaceholder: "Wann möchten Sie starten?",
    timing: {
      asap: "So bald wie möglich",
      within3: "Innerhalb von 3 Monaten",
      within12: "3 bis 12 Monate",
      exploring: "Ich informiere mich nur",
    },
    placeLabelSell: "Adresse der Immobilie",
    placeLabelBuy: "Gewünschte Gegend",
    placeLabelOpen: "Gegend von Interesse",
    placePlaceholderSell: "Z. B. via Roma 12, Tradate — oder auch nur die Gemeinde",
    placePlaceholderBuy: "Z. B. Tradate, Varese und Umgebung",
    typeLabel: "Immobilientyp",
    typePlaceholder: "Z. B. Dreizimmerwohnung, Villa, Büro",
    budgetLabel: "Richtbudget",
    budgetPlaceholder: "Z. B. bis 250.000 €",
    featuresLabel: "Ausstattung",
    featuresPlaceholder: "Z. B. Garten, Garage, Aufzug",
    messageLabel: "Nachricht",
    messageLabelOptional: "Nachricht (optional)",
    messagePlaceholderSell: "Erzählen Sie uns etwas mehr über die Immobilie…",
    messagePlaceholderQuestion: "Wie können wir Ihnen helfen?",
    submitSeller: "Bewertung anfordern",
    submitBuyer: "Das passende Zuhause finden",
    submitQuestion: "Anfrage senden",
    submitOpenDomus: "Prüfen Sie, ob Open Domus zu Ihrer Immobilie passt",
    submitCareer: "Bewerbung senden",
    errName: "Bitte geben Sie Ihren Namen ein.",
    errContact: "Hinterlassen Sie uns eine Telefonnummer oder E-Mail für den Rückruf.",
    errEmail: "Bitte prüfen Sie die E-Mail-Adresse.",
    errPhone: "Bitte prüfen Sie die Telefonnummer.",
    sentPrefix: "Wir öffnen WhatsApp. Falls es sich nicht öffnet,",
    sentLink: "schreiben Sie uns an",
    gdpr: "Wir verwenden Ihre Daten ausschließlich zur Beantwortung Ihrer Anfrage.",
    consentPre: "Ich habe die ",
    consentLinkText: "Datenschutzerklärung",
    consentPost: " gelesen und willige in die Verarbeitung meiner Daten zur Kontaktaufnahme ein.",
    errConsent: "Bitte akzeptieren Sie die Datenschutzerklärung, um fortzufahren.",
    reassure:
      "Wir melden uns persönlich innerhalb von 24 Werkstunden. Kein automatischer Kostenvoranschlag, keine Weitergabe von Daten an Dritte. Und wenn es doch nicht der richtige Moment ist, ist das völlig in Ordnung.",
    contactPhoneSub: "Mo–Sa",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Schreiben Sie uns eine E-Mail",
    subcopyBy: {
      seller: "Erzählen Sie uns von Ihrer Immobilie. Wir sagen Ihnen, was sie wert ist, was sie braucht und welcher Weg der richtige ist.",
      buyer: "Sagen Sie uns, was Sie suchen. Wir sagen Ihnen, was es gibt, was kommt und was sich anzusehen lohnt.",
      question: "Schreiben Sie uns Ihre Frage. Es antwortet ein Mensch, kein Automat.",
      "open-domus": "Erzählen Sie uns von der Immobilie. Wir sagen Ihnen, ob Open Domus das richtige Format für den Verkauf ist.",
      career: "Erzählen Sie uns, wer Sie sind. Wir lesen jede Bewerbung, die bei uns ankommt.",
    } as Record<LeadIntent, string>,
    sentTitleOk: "Ihre Anfrage ist bei uns angekommen.",
    sentTitlePending: "Ihre Nachricht liegt bereit in WhatsApp.",
    sentNotDelivered:
      "Das Formular konnte sie in unseren Systemen nicht erfassen: Senden Sie die geöffnete Nachricht, oder rufen Sie uns an unter",
    nextTitle: "Was jetzt passiert",
    nextTitleIfFailed: "Was passiert, sobald sie bei uns ankommt",
    nextWhen: "Wir rufen Sie innerhalb von 24 Arbeitsstunden zurück — und es bleibt dieselbe Person bis zum Notartermin.",
    nextNumberPre: "Wenn ein Anruf von",
    nextNumberPost: " kommt, sind wir das.",
    prepareTitle: "Was Sie bereitlegen können, falls vorhanden",
    prepareBy: {
      seller:
        "Katasterplan, Eigentumsnachweis und Energieausweis. Finden Sie sie nicht, ist das kein Problem: die Prüfung der Unterlagen gehört zur Methode.",
      buyer:
        "Ihr Budget und die Lagen, die Sie ausschließen. Ausschlüsse helfen mehr als Wünsche: Sie verkürzen die Suche, statt sie zu verbreitern.",
      question: "Nichts. Betrifft die Frage eine bestimmte Immobilie, halten Sie deren Referenz bereit.",
      "open-domus":
        "Die Fotos, die Sie von der Immobilie haben, und die Unterlagen, die zu Hause liegen. Um den Rest der Vorbereitung kümmern wir uns.",
      career: "Einen Lebenslauf, falls vorhanden. Sonst genügen zwei Zeilen dazu, was Sie können.",
    } as Record<LeadIntent, string>,
    resend: "Eine weitere Anfrage senden",
    aboutProperty: "Anfrage zu dieser Immobilie:",
    keysAlt: "Raffaela Rizza mit den Schlüsseln eines Hauses",
  },
  es: {
    eyebrow: "Habla con Domus Tua",
    badge: "Primer paso",
    title: "Empieza por el primer paso: una valoración seria de tu casa.",
    subcopy:
      "Cuéntanos sobre tu inmueble o qué estás buscando. Te ayudaremos a entender su valor, las posibilidades y el mejor camino, sin compromiso.",
    leadSeller: "Quiero vender",
    leadBuyer: "Busco casa",
    leadQuestion: "Tengo una pregunta",
    leadOpenDomus: "Open Domus",
    leadCareer: "Trabaja con nosotras",
    nameLabel: "Nombre y apellidos",
    namePlaceholder: "Ej. Maria Rossi",
    phoneLabel: "Teléfono",
    phonePlaceholder: "Ej. 333 1234567",
    emailLabel: "Correo",
    emailPlaceholder: "Ej. maria@email.it",
    surfaceLabel: "Superficie (m²)",
    surfacePlaceholder: "Ej. 120",
    timingLabel: "Plazos",
    timingLabelSell: "¿En cuánto tiempo te gustaría vender?",
    timingPlaceholder: "¿Cuándo quieres avanzar?",
    timing: {
      asap: "Lo antes posible",
      within3: "En menos de 3 meses",
      within12: "De 3 a 12 meses",
      exploring: "Solo estoy valorando",
    },
    placeLabelSell: "Dirección del inmueble",
    placeLabelBuy: "Zona deseada",
    placeLabelOpen: "Zona de interés",
    placePlaceholderSell: "Ej. via Roma 12, Tradate — o solo el municipio",
    placePlaceholderBuy: "Ej. Tradate, Varese y alrededores",
    typeLabel: "Tipología",
    typePlaceholder: "Ej. piso de tres ambientes, villa, oficina",
    budgetLabel: "Presupuesto orientativo",
    budgetPlaceholder: "Ej. hasta 250.000 €",
    featuresLabel: "Características",
    featuresPlaceholder: "Ej. jardín, garaje, ascensor",
    messageLabel: "Mensaje",
    messageLabelOptional: "Mensaje (opcional)",
    messagePlaceholderSell: "Cuéntanos algo más sobre el inmueble…",
    messagePlaceholderQuestion: "¿Cómo podemos ayudarte?",
    submitSeller: "Solicita la valoración",
    submitBuyer: "Encuentra la casa ideal",
    submitQuestion: "Enviar la solicitud",
    submitOpenDomus: "Descubre si Open Domus encaja con tu inmueble",
    submitCareer: "Enviar la candidatura",
    errName: "Introduce tu nombre.",
    errContact: "Déjanos un teléfono o un correo para poder responderte.",
    errEmail: "Revisa la dirección de correo.",
    errPhone: "Revisa el número de teléfono.",
    sentPrefix: "Estamos abriendo WhatsApp. Si no se abre,",
    sentLink: "escríbenos al",
    gdpr: "Usamos tus datos solo para responder a tu solicitud.",
    consentPre: "He leído la ",
    consentLinkText: "política de privacidad",
    consentPost: " y doy mi consentimiento al tratamiento de mis datos para que me contacten.",
    errConsent: "Para continuar, acepta la política de privacidad.",
    reassure:
      "Te contactamos personalmente en 24 horas laborables. Sin presupuesto automático, sin ceder datos a terceros. Y si al final no es el momento adecuado, no pasa nada.",
    contactPhoneSub: "Lun–Sáb",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Escríbenos un correo",
    subcopyBy: {
      seller: "Cuéntanos tu inmueble. Te decimos cuánto vale, qué necesita y cuál es el mejor camino.",
      buyer: "Cuéntanos qué buscas. Te decimos qué hay, qué está por llegar y qué merece una visita.",
      question: "Escríbenos la pregunta. Responde una persona, no un automático.",
      "open-domus": "Cuéntanos el inmueble. Te decimos si Open Domus es el formato adecuado para venderlo.",
      career: "Cuéntanos quién eres. Leemos todas las candidaturas que nos llegan.",
    } as Record<LeadIntent, string>,
    sentTitleOk: "Tu solicitud nos ha llegado.",
    sentTitlePending: "Tu mensaje está listo en WhatsApp.",
    sentNotDelivered:
      "El formulario no ha podido registrarla en nuestros sistemas: manda el mensaje que se ha abierto, o llámanos al",
    nextTitle: "Qué pasa ahora",
    nextTitleIfFailed: "Qué pasa en cuanto nos llegue",
    nextWhen: "Te llamamos en menos de 24 horas laborables, y sigue siendo la misma persona hasta la escritura.",
    nextNumberPre: "Si te entra una llamada del",
    nextNumberPost: ", somos nosotras.",
    prepareTitle: "Qué puedes preparar, si lo tienes",
    prepareBy: {
      seller:
        "Plano catastral, título de propiedad y certificado energético. Si no los encuentras no pasa nada: la comprobación de los documentos está incluida en el método.",
      buyer:
        "Cuánto quieres invertir y las zonas que descartas. Las exclusiones sirven más que las preferencias: acortan la búsqueda en vez de ampliarla.",
      question: "Nada. Si la pregunta es sobre un inmueble concreto, ten a mano su referencia.",
      "open-domus":
        "Las fotos que tengas del inmueble y los documentos que guardes en casa. Del resto de la preparación nos ocupamos nosotras.",
      career: "El currículum, si lo tienes. Si no, bastan dos líneas sobre lo que sabes hacer.",
    } as Record<LeadIntent, string>,
    resend: "Enviar otra solicitud",
    aboutProperty: "Solicitud sobre este inmueble:",
    keysAlt: "Raffaela Rizza con las llaves de una casa",
  },
} as const;

type Copy = (typeof copy)[keyof typeof copy];

// Props opzionali per il prefill da scheda immobile. Quando il form parte da una
// listing (`/case/<slug>`) la CTA "Richiedi una visita" apre già l'intento giusto
// (di norma "buyer" / cerca casa), collega il riferimento immobile al lead e può
// suggerire la zona. Senza props il comportamento di default (no-listing) resta invariato.
export default function Contact({
  initialIntent,
  propertyRef,
  initialPlace,
  compact = false,
}: {
  initialIntent?: LeadIntent;
  propertyRef?: string;
  initialPlace?: string;
  /** Su /contatti la pagina ha gia' la sua testa: occhiello, h1 e paragrafo.
   *  Senza questo, il capitolo ne apriva una seconda cinquecento pixel sotto
   *  la prima — due teste di pagina identiche, una sotto l'altra. */
  compact?: boolean;
} = {}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const [intent, setIntent] = useState<LeadIntent>(initialIntent ?? "seller");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /**
   * Esito REALE della consegna al server, letto da submitLead.
   *
   * «pending» non è uno stato di attesa cosmetico: è l'unico onesto finché la POST non ha
   * risposto. In quella finestra la conferma può dire che WhatsApp si sta aprendo — che è
   * vero, è appena successo — ma non che la richiesta è arrivata, perché non lo sappiamo.
   */
  const [delivery, setDelivery] = useState<"pending" | "ok" | "failed">("pending");
  /** L'URL WhatsApp col messaggio già composto, per il link di scampo. */
  const [waUrl, setWaUrl] = useState<string>(site.whatsapp.href);
  /**
   * L'intento con cui si è inviato, congelato al submit.
   *
   * Serve perché «cosa preparare» cambia per pubblico, e le tab restano cliccabili anche
   * dopo l'invio: senza congelarlo, chi tocca «Cerco casa» per curiosità vedrebbe cambiare
   * sotto gli occhi i documenti da preparare per una richiesta che ha già mandato.
   */
  const [sentIntent, setSentIntent] = useState<LeadIntent>("seller");
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    consent?: string;
  }>({});
  // La conferma CAMBIA L'ALTEZZA DELLA PAGINA, e Lenis va avvisato: tiene in cache
  // l'altezza del documento e il suo autoResize è debounced, quindi nell'istante dopo
  // l'invio ogni scrollTo verso il fondo resta clampato al limite vecchio (un link del
  // footer focusabile ma coperto, WCAG 2.4.7). Fuori dalla guardia reduced-motion di
  // proposito: un link coperto lo è per tutti.
  useEffect(() => {
    if (!sent) return;
    getLenis()?.resize();
  }, [sent, delivery]);

  // Deep-link: /contatti?intent=buyer (o seller/question/open-domus) preseleziona il tab giusto,
  // quando non è già forzato via prop (es. dalla scheda immobile). Utile per le CTA "Cerco casa"
  // che arrivano da altre pagine (es. /acquista). Letto solo lato client (no mismatch di hydration).
  useEffect(() => {
    if (initialIntent) return;
    const qi = new URLSearchParams(window.location.search).get("intent");
    if (qi === "seller" || qi === "buyer" || qi === "question" || qi === "open-domus") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntent(qi);
    }
  }, [initialIntent]);

  // I recapiti come righe di testo: titolo d4 + link 19 px, niente card né icone.
  const contacts: { title: string; label: string; href: string; note?: string }[] = [
    { title: c.phoneLabel, label: site.phone.label, href: site.phone.href, note: c.contactPhoneSub },
    { title: c.contactWhatsappSub, label: site.whatsapp.label, href: site.whatsapp.href },
    { title: c.emailLabel, label: site.email.label, href: site.email.href },
    {
      title: `${site.address.city} (${site.address.province})`,
      label: site.address.street,
      href: "https://maps.google.com/?q=Domus+Tua+Immobiliare+Corso+Bernacchi+91+Tradate",
    },
  ];

  // `career` non ha una tab qui (leadOptions ne elenca quattro): le candidature
  // hanno il form dedicato di /lavora-con-noi. Le etichette esistono comunque
  // perché i Record sono esaustivi su LeadIntent.
  const leadLabels: Record<LeadIntent, string> = {
    seller: c.leadSeller,
    buyer: c.leadBuyer,
    question: c.leadQuestion,
    "open-domus": c.leadOpenDomus,
    career: c.leadCareer,
  };

  const submitLabels: Record<LeadIntent, string> = {
    seller: c.submitSeller,
    buyer: c.submitBuyer,
    question: c.submitQuestion,
    "open-domus": c.submitOpenDomus,
    career: c.submitCareer,
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const val = (k: string) => ((data.get(k) as string) || "").trim();

    // Honeypot anti-spam: un umano non vede/compila "company". Se pieno → bot, esci in silenzio.
    if (val("company")) return;

    const name = val("name");
    const phone = val("phone");
    const email = val("email");
    const consent = data.get("consent") != null;

    // Validazione client-side (specchio del server, app/lib/forms/validateLead.ts):
    // nome obbligatorio; ALMENO UNO fra telefono ed email, e quello lasciato deve
    // avere un formato plausibile; consenso privacy obbligatorio.
    const nextErrors: { name?: string; phone?: string; email?: string; consent?: string } = {};
    if (!name) nextErrors.name = c.errName;
    if (!phone && !email) {
      nextErrors.phone = c.errContact;
    } else {
      if (phone && !isPhoneFormat(phone)) nextErrors.phone = c.errPhone;
      if (email && !isEmailFormat(email)) nextErrors.email = c.errEmail;
    }
    if (!consent) nextErrors.consent = c.errConsent;
    if (nextErrors.name || nextErrors.phone || nextErrors.email || nextErrors.consent) {
      setErrors(nextErrors);
      // A11y: porta il focus sul primo campo non valido (dopo il re-render).
      const form = e.currentTarget;
      const firstInvalid = nextErrors.name
        ? "name"
        : nextErrors.phone
          ? "phone"
          : nextErrors.email
            ? "email"
            : "consent";
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus(),
      );
      return;
    }
    setErrors({});

    const lead: Lead = {
      intent,
      name,
      phone: phone || undefined,
      email: email || undefined,
      place: val("place") || undefined,
      propertyType: val("propertyType") || undefined,
      surface: val("surface") || undefined,
      timing: val("timing") || undefined,
      budget: val("budget") || undefined,
      features: val("features") || undefined,
      message: val("message") || undefined,
      consent: true,
      sourcePage: typeof window !== "undefined" ? window.location.pathname : undefined,
      // Riferimento immobile: presente solo se il form parte da una scheda listing.
      propertyRef: propertyRef || undefined,
    };

    // Cattura server-side (email e/o Google Sheet, se configurati) — best-effort, non blocca
    // il flusso. `submitting` disabilita il bottone durante la scrittura e dà feedback.
    //
    // L'ESITO SI LEGGE. Prima si buttava via con `void`, e la conseguenza era che la conferma
    // diceva la stessa cosa in ogni caso: richiesta registrata, 429 di rate limit, 502 del
    // provider, rete caduta, e persino il `{ok:false, reason:"not-delivered"}` che l'API
    // restituisce quando NESSUN canale è configurato (app/api/lead/route.ts:98-105). Il
    // server era già onesto; era il client a non ascoltarlo.
    setSubmitting(true);
    setDelivery("pending");
    void submitLead(lead)
      .then((r) => setDelivery(r.ok ? "ok" : "failed"))
      .catch(() => setDelivery("failed"))
      .finally(() => setSubmitting(false));

    // La conversione. Va registrata QUI, dopo la validazione e prima di aprire WhatsApp:
    // è il momento in cui la richiesta esiste davvero. Passa solo il tipo di richiesta,
    // mai il contenuto del lead — quello ha il suo canale (submitLead) ed è l'unico
    // autorizzato a vederlo. Vedi app/lib/analytics.ts.
    trackConversion(CONVERSIONS.valutazione, "modulo", { intent });

    // Canale immediato: WhatsApp precompilato (apertura sincrona col gesto = niente popup block).
    //
    // L'URL si TIENE. Serve al link di scampo della conferma: chi lo clicca è esattamente chi
    // ha avuto il popup bloccato, cioè chi ha più bisogno del messaggio già scritto — e prima
    // si ritrovava mandato al WhatsApp generico, a riscriversi tutto a mano.
    const url = buildWhatsAppUrl(site.whatsapp.href, formatLeadMessage(lead));
    setWaUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
    setSentIntent(intent);
  }

  return (
    <section id="contatti" className="dt-chapter bg-cream text-ink">
      <div className="dt-row">
        {/* Testa di capitolo a tutta riga. Il d1 maiuscolo non sta in mezza colonna:
            «VALUTAZIONE» da solo è più largo della colonna sinistra a ogni larghezza
            desktop, quindi il titolo sta sopra la griglia, come nella pagina contatti
            del riferimento. */}
        {!compact && (
          <>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            <TextLines as="h2" className="mt-6 max-w-[22ch] font-display text-d2">
              {c.title}
            </TextLines>
          </>
        )}

        {/* Le due colonne del template condiviso: `1fr 1.1fr` era l'ennesima
            proporzione su misura, e faceva partire il modulo 34 px piu' a
            sinistra della colonna di ogni altro capitolo. */}
        <div
          className={`grid gap-[6vw] lg:grid-cols-2 lg:items-start ${
            compact ? "" : "mt-[clamp(2.5rem,6vh,4rem)]"
          }`}
        >
          {/* Sinistra: paragrafo per intento, recapiti, foto quadrata */}
          <div>
            {/* §6.6 — un testo sopra il modulo per OGNI intento (sul ramo venditore la
                frase del documento parola per parola). `key` rimonta il Reveal al cambio
                tab, così il paragrafo rientra invece di cambiare di scatto. */}
            <Reveal key={intent}>
              <p className="lead">{c.subcopyBy[intent]}</p>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {contacts.map((item) => (
                  <div key={item.href}>
                    <h3 className="font-display text-d4 font-light">{item.title}</h3>
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="mt-2 block text-body underline-offset-4 hover:underline"
                    >
                      {item.label}
                    </a>
                    {item.note ? <p className="text-body text-stone">{item.note}</p> : null}
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Foto quadrata, senza arco né filtro (via arch-frame). */}
            <Reveal delay={120}>
              <div className="relative mt-10 aspect-square">
                <Image
                  src="/images/reali/raffaela-keys.jpg"
                  alt={c.keysAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>

          {/* Destra: il modulo a filo — campi col solo bordo inferiore, niente card */}
          <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-8">
            {/* Honeypot anti-spam: fuori schermo, non focusabile, ignorato dagli screen reader. */}
            <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
              <label htmlFor="company">Company</label>
              <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            {/* L'immobile da cui si arriva, DETTO: chi clicca «Richiedi una visita» sulla
                scheda deve vedere nominata la casa che stava guardando. */}
            {propertyRef ? (
              <p className="text-body text-stone">
                {c.aboutProperty} <span className="font-semibold text-ink">{propertyRef}</span>
              </p>
            ) : null}
            {/* Le tab dell'intento: testo maiuscolo 16 px, riga rossa sotto quella scelta
                (`!` sui colori del bordo: vedi la nota sopra `fieldCls`). */}
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {leadOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={intent === opt.key}
                  onClick={() => setIntent(opt.key)}
                  className="inline-flex min-h-11 items-center border-b-2 border-transparent! text-ui font-semibold uppercase tracking-[0.08em] text-stone transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red aria-pressed:border-red! aria-pressed:text-ink"
                >
                  {leadLabels[opt.key]}
                </button>
              ))}
            </div>

            {/* Nome sempre presente e obbligatorio. */}
            <Field
              name="name"
              label={c.nameLabel}
              placeholder={c.namePlaceholder}
              required
              autoComplete="name"
              autoCapitalize="words"
              error={errors.name}
            />
            {/* Telefono ed email in campi DISTINTI (canali separati). Ne serve
                almeno uno: l'errore "lascia un recapito" vive sul telefono, il
                primo dei due. Tastiere mobili dedicate (tel / email). */}
            <div className="grid gap-8 sm:grid-cols-2">
              <Field
                name="phone"
                type="tel"
                label={c.phoneLabel}
                placeholder={c.phonePlaceholder}
                autoComplete="tel"
                inputMode="tel"
                autoCapitalize="none"
                spellCheck={false}
                error={errors.phone}
              />
              <Field
                name="email"
                type="email"
                label={c.emailLabel}
                placeholder={c.emailPlaceholder}
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                error={errors.email}
              />
            </div>

            {/* Campi dinamici per intento. `initialPlace` (zona della scheda) precompila
                la zona desiderata quando il form parte da un immobile. */}
            <IntentFields intent={intent} c={c} initialPlace={initialPlace} />

            {/* Consenso privacy: obbligatorio perché il lead viene salvato (GDPR). */}
            <div>
              <label className="flex items-start gap-3 text-ui text-stone">
                <input
                  type="checkbox"
                  name="consent"
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={errors.consent ? "consent-error" : undefined}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                />
                <span>
                  {c.consentPre}
                  <a href="/privacy" className="underline underline-offset-4 hover:text-ink">
                    {c.consentLinkText}
                  </a>
                  {c.consentPost}
                </span>
              </label>
              {errors.consent ? (
                <span id="consent-error" role="alert" className="mt-2 block text-ui text-red-dark">
                  {errors.consent}
                </span>
              ) : null}
            </div>

            {/* A invio avvenuto il pulsante sparisce e lascia il posto al comando esplicito
                di reinvio: chi torna da WhatsApp e non è sicuro non deve poter ripremere a
                vuoto, ma la correzione legittima («ho sbagliato il numero») resta possibile. */}
            {sent ? (
              <CtaButton
                type="button"
                variant="ghost"
                arrow={false}
                onClick={() => {
                  setSent(false);
                  setDelivery("pending");
                }}
                className="self-start"
              >
                {c.resend}
              </CtaButton>
            ) : (
              <SendCta submitting={submitting} size="lg" className="sm:self-start">
                {submitLabels[intent]}
              </SendCta>
            )}
            {/* §6.6 — sta SOTTO il pulsante: si legge nell'istante in cui si esita a premerlo. */}
            <p className="text-body text-stone">{c.reassure}</p>
            {sent ? (
              <div role="status" className="border-t border-ink! pt-6 text-body text-ink">
                {/* L'unica riga che cambia con l'esito: «Abbiamo ricevuto la tua richiesta»
                    si dice SOLO quando un canale ha davvero preso in carico il lead. */}
                <p className="font-display text-d4 font-light uppercase">
                  {delivery === "ok" ? c.sentTitleOk : c.sentTitlePending}
                </p>

                {/* Il canale immediato: in tutti gli esiti la scheda WhatsApp si è aperta
                    col messaggio dentro, e il link di scampo porta lo stesso messaggio. */}
                <p className="mt-3">
                  {c.sentPrefix}{" "}
                  <a href={waUrl} className="font-semibold underline underline-offset-4">
                    {c.sentLink} {site.whatsapp.label}
                  </a>
                  .
                </p>

                {/* Quando il server NON ha preso il lead, lo si dice e si indica la via che funziona. */}
                {delivery === "failed" ? (
                  <p className="mt-3">
                    {c.sentNotDelivered}{" "}
                    <a href={site.phone.href} className="font-semibold underline underline-offset-4">
                      {site.phone.label}
                    </a>
                    .
                  </p>
                ) : null}

                {/* §6.6 — chi chiama (nome e volto), da quale numero, entro quando, cosa
                    preparare. Il titolo cambia con l'esito: «cosa succede adesso» presuppone
                    che la richiesta sia arrivata. */}
                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-ui font-semibold uppercase tracking-[0.08em] text-stone">
                    {delivery === "failed" ? c.nextTitleIfFailed : c.nextTitle}
                  </p>
                  <div className="mt-4 flex items-start gap-4">
                    {/* Il volto: la stessa foto accanto al modulo, quadrata come tutte. */}
                    <Image
                      src={callback.photo}
                      alt=""
                      width={64}
                      height={64}
                      className="h-16 w-16 shrink-0 object-cover"
                    />
                    <div>
                      <p>
                        <span className="font-semibold">{callback.name}</span>
                        <span className="text-stone"> · {callback.role}</span>
                      </p>
                      <p>{c.nextWhen}</p>
                      <p>
                        {c.nextNumberPre}{" "}
                        <span className="font-semibold">{callback.phoneLabel}</span>
                        {c.nextNumberPost}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4">
                    <span className="font-semibold">{c.prepareTitle}:</span>{" "}
                    {c.prepareBy[sentIntent]}
                  </p>
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}

// Campi mostrati in base all'intento selezionato.
// SELLER   → comune immobile, tipologia, messaggio
// BUYER    → zona desiderata, tipologia, budget, caratteristiche
// QUESTION → (solo nome + contatto + messaggio)
// OPEN DOMUS → zona di interesse
function IntentFields({
  intent,
  c,
  initialPlace,
}: {
  intent: LeadIntent;
  c: Copy;
  initialPlace?: string;
}) {
  const timingOptions = [
    { value: c.timing.asap },
    { value: c.timing.within3 },
    { value: c.timing.within12 },
    { value: c.timing.exploring },
  ];
  if (intent === "seller") {
    return (
      <>
        {/* §6.6 chiede «Indirizzo dell'immobile», e l'etichetta ora lo dice. Ma
            `autoComplete` resta `address-level2` e NON diventa `street-address`: quello
            farebbe comparire l'autofill dell'indirizzo di casa di CHI VISITA, che non è
            l'immobile in questione — e riempirebbe il campo con il dato sbagliato senza
            che nessuno se ne accorga. Il placeholder dice che basta anche solo il comune:
            l'etichetta chiede quello che serve, il placeholder toglie la barriera. */}
        <Field name="place" label={c.placeLabelSell} placeholder={c.placePlaceholderSell} autoComplete="address-level2" autoCapitalize="words" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="propertyType" label={c.typeLabel} placeholder={c.typePlaceholder} />
          <Field name="surface" label={c.surfaceLabel} placeholder={c.surfacePlaceholder} inputMode="numeric" autoCapitalize="none" spellCheck={false} />
        </div>
        {/* La tempistica come DOMANDA, che è la forma del §6.6. La select è la stessa che
            serve l'acquirente, quindi l'etichetta neutra resta e la domanda si aggiunge
            solo qui — stesso schema di placeLabelSell/placeLabelBuy. */}
        <Select name="timing" label={c.timingLabelSell} placeholder={c.timingPlaceholder} options={timingOptions} />
        {/* «(facoltativo)» solo su questo ramo: qui i campi sono otto e sapere quale si può
            saltare vale qualcosa. Sul ramo «Ho una domanda» il messaggio È la richiesta, e
            marcarlo facoltativo suonerebbe come «non ci interessa cosa scrivi». */}
        <TextArea name="message" label={c.messageLabelOptional} placeholder={c.messagePlaceholderSell} />
      </>
    );
  }
  if (intent === "buyer") {
    return (
      <>
        <Field
          name="place"
          label={c.placeLabelBuy}
          placeholder={c.placePlaceholderBuy}
          defaultValue={initialPlace}
          autoComplete="address-level2"
          autoCapitalize="words"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="budget" label={c.budgetLabel} placeholder={c.budgetPlaceholder} inputMode="numeric" />
          <Field name="surface" label={c.surfaceLabel} placeholder={c.surfacePlaceholder} inputMode="numeric" autoCapitalize="none" spellCheck={false} />
        </div>
        <Field name="propertyType" label={c.typeLabel} placeholder={c.typePlaceholder} />
        <Field name="features" label={c.featuresLabel} placeholder={c.featuresPlaceholder} />
        <Select name="timing" label={c.timingLabel} placeholder={c.timingPlaceholder} options={timingOptions} />
      </>
    );
  }
  if (intent === "open-domus") {
    return <Field name="place" label={c.placeLabelOpen} placeholder={c.placePlaceholderBuy} autoComplete="address-level2" autoCapitalize="words" />;
  }
  // question
  return (
    <TextArea name="message" label={c.messageLabel} placeholder={c.messagePlaceholderQuestion} />
  );
}

// Etichetta 16 px maiuscola e campo col solo bordo inferiore (stesso canone di
// HomeSearchGateway): niente scatola, niente raggio, 19 px nel campo.
// `border-ink!`: il `* { border-color: line }` di globals.css è unlayered e batte le utility.
const labelCls = "block text-ui font-semibold uppercase tracking-[0.08em] text-stone";
const fieldCls =
  "block w-full border-0 border-b bg-transparent py-3 text-body text-ink placeholder:text-stone transition-colors focus:border-red! focus:outline-none";

// La freccia della tendina: `appearance-none` toglie quella del browser.
function Caret() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
    >
      <path d="M3 6l5 5 5-5" />
    </svg>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  error,
  defaultValue,
  autoComplete,
  inputMode,
  autoCapitalize,
  spellCheck,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  /** Tastiera mobile: "numeric" per gli importi, "email"/"tel" dove il campo è univoco. */
  inputMode?: "text" | "numeric" | "tel" | "email" | "url";
  /**
   * Maiuscola automatica di iOS. "words" per nomi e comuni, "none" dove si scrive
   * un indirizzo email: "Mario@…" passa, ma l'autocorrezione su un indirizzo no.
   */
  autoCapitalize?: "none" | "words" | "sentences";
  /** false su email e riferimenti: l'autocorrezione di iOS li riscrive e il lead si perde. */
  spellCheck?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        autoCorrect={spellCheck === false ? "off" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${fieldCls} ${error ? "border-red!" : "border-ink!"}`}
      />
      {error ? (
        <span id={`${name}-error`} role="alert" className="mt-2 block text-ui text-red-dark">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function TextArea({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        placeholder={placeholder}
        className={`${fieldCls} resize-y border-ink!`}
      />
    </div>
  );
}

// Select opzionale (tempistica): la prima voce vuota è il placeholder, così il
// campo non forza una scelta e "non valorizzato" resta un esito valido.
function Select({
  name,
  label,
  placeholder,
  options,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: { value: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      <span className="relative block">
        <select id={name} name={name} defaultValue="" className={`${fieldCls} appearance-none border-ink! pr-8`}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value}
            </option>
          ))}
        </select>
        <Caret />
      </span>
    </div>
  );
}
