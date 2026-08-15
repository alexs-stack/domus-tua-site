"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, MQ } from "../lib/motion/gsap";
import { Phone, Whatsapp, Mail, Pin } from "./Icons";
import { SendCta } from "./primitives/Cta";
import { SegnoDomusBadge } from "./BrandMotif";
import { site } from "../lib/site";
import { buildWhatsAppUrl } from "../lib/forms/whatsapp";
import { formatLeadMessage, submitLead, type Lead, type LeadIntent } from "../lib/forms/lead";
import { isEmailFormat, isPhoneFormat } from "../lib/forms/contactChannel";
import { CONVERSIONS, trackConversion } from "../lib/analytics";
import CharFlip from "./motion/CharFlip";
import TextLines from "./motion/TextLines";
import Atmosphere from "./motion/Atmosphere";
import CameraIn from "./motion/CameraIn";
import Fioritura from "./motion/Fioritura";
import { useLocale } from "./i18n/LocaleProvider";

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
    timingPlaceholder: "Quando vorresti procedere?",
    timing: {
      asap: "Il prima possibile",
      within3: "Entro 3 mesi",
      within12: "Da 3 a 12 mesi",
      exploring: "Sto solo valutando",
    },
    placeLabelSell: "Comune dell’immobile",
    placeLabelBuy: "Zona desiderata",
    placeLabelOpen: "Zona di interesse",
    placePlaceholderSell: "Es. Tradate, centro",
    placePlaceholderBuy: "Es. Tradate, Varese e dintorni",
    typeLabel: "Tipologia",
    typePlaceholder: "Es. Trilocale, villa, ufficio",
    budgetLabel: "Budget indicativo",
    budgetPlaceholder: "Es. fino a 250.000 €",
    featuresLabel: "Caratteristiche",
    featuresPlaceholder: "Es. giardino, box, ascensore",
    messageLabel: "Messaggio",
    messagePlaceholderSell: "Raccontaci qualcosa in più sull’immobile…",
    messagePlaceholderQuestion: "Come possiamo aiutarti?",
    submitSeller: "Richiedi la valutazione del tuo immobile",
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
    contactPhoneSub: "Lun–Sab",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Scrivici una mail",
    keysAlt: "Raffaela Rizza con le chiavi di casa",
  },
  en: {
    eyebrow: "Talk to Domus Tua",
    badge: "First step",
    title: "Start with the first step: a serious valuation of your home.",
    subcopy:
      "Tell us about your property or what you’re looking for. We’ll help you understand its value, your options and the best path forward, with no obligation.",
    leadSeller: "I want to sell",
    leadBuyer: "Looking for a home",
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
    timingPlaceholder: "When would you like to proceed?",
    timing: {
      asap: "As soon as possible",
      within3: "Within 3 months",
      within12: "3 to 12 months",
      exploring: "Just exploring",
    },
    placeLabelSell: "Where the property is",
    placeLabelBuy: "Preferred area",
    placeLabelOpen: "Area of interest",
    placePlaceholderSell: "E.g. Tradate, centre",
    placePlaceholderBuy: "E.g. Tradate, Varese and nearby",
    typeLabel: "Property type",
    typePlaceholder: "E.g. two-bed flat, villa, office",
    budgetLabel: "Indicative budget",
    budgetPlaceholder: "E.g. up to €250,000",
    featuresLabel: "Features",
    featuresPlaceholder: "E.g. garden, garage, lift",
    messageLabel: "Message",
    messagePlaceholderSell: "Tell us a little more about the property…",
    messagePlaceholderQuestion: "How can we help you?",
    submitSeller: "Request a valuation of your property",
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
    contactPhoneSub: "Mon–Sat",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Send us an email",
    keysAlt: "Raffaela Rizza holding the keys to a home",
  },
  fr: {
    eyebrow: "Parlez à Domus Tua",
    badge: "Première étape",
    title: "Commencez par la première étape : une estimation sérieuse de votre bien.",
    subcopy:
      "Parlez-nous de votre bien ou de ce que vous recherchez. Nous vous aiderons à en comprendre la valeur, les possibilités et la meilleure voie à suivre, sans engagement.",
    leadSeller: "Je veux vendre",
    leadBuyer: "Je cherche",
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
    timingPlaceholder: "Quand souhaitez-vous avancer ?",
    timing: {
      asap: "Dès que possible",
      within3: "Sous 3 mois",
      within12: "De 3 à 12 mois",
      exploring: "Je me renseigne",
    },
    placeLabelSell: "Où se situe le bien",
    placeLabelBuy: "Secteur souhaité",
    placeLabelOpen: "Secteur d’intérêt",
    placePlaceholderSell: "Ex. Tradate, centre",
    placePlaceholderBuy: "Ex. Tradate, Varese et alentours",
    typeLabel: "Type de bien",
    typePlaceholder: "Ex. trois-pièces, villa, bureau",
    budgetLabel: "Budget indicatif",
    budgetPlaceholder: "Ex. jusqu’à 250 000 €",
    featuresLabel: "Caractéristiques",
    featuresPlaceholder: "Ex. jardin, garage, ascenseur",
    messageLabel: "Message",
    messagePlaceholderSell: "Dites-nous en un peu plus sur le bien…",
    messagePlaceholderQuestion: "Comment pouvons-nous vous aider ?",
    submitSeller: "Demandez l’estimation de votre bien",
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
    contactPhoneSub: "Lun–Sam",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Écrivez-nous un e-mail",
    keysAlt: "Raffaela Rizza tenant les clés d’une maison",
  },
  de: {
    eyebrow: "Sprechen Sie mit Domus Tua",
    badge: "Erster Schritt",
    title: "Beginnen Sie mit dem ersten Schritt: einer fundierten Bewertung Ihrer Immobilie.",
    subcopy:
      "Erzählen Sie uns von Ihrer Immobilie oder wonach Sie suchen. Wir helfen Ihnen, Wert, Möglichkeiten und den besten Weg zu verstehen – unverbindlich.",
    leadSeller: "Ich möchte verkaufen",
    leadBuyer: "Ich suche",
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
    timingPlaceholder: "Wann möchten Sie starten?",
    timing: {
      asap: "So bald wie möglich",
      within3: "Innerhalb von 3 Monaten",
      within12: "3 bis 12 Monate",
      exploring: "Ich informiere mich nur",
    },
    placeLabelSell: "Wo sich die Immobilie befindet",
    placeLabelBuy: "Gewünschte Gegend",
    placeLabelOpen: "Gegend von Interesse",
    placePlaceholderSell: "Z. B. Tradate, Zentrum",
    placePlaceholderBuy: "Z. B. Tradate, Varese und Umgebung",
    typeLabel: "Immobilientyp",
    typePlaceholder: "Z. B. Dreizimmerwohnung, Villa, Büro",
    budgetLabel: "Richtbudget",
    budgetPlaceholder: "Z. B. bis 250.000 €",
    featuresLabel: "Ausstattung",
    featuresPlaceholder: "Z. B. Garten, Garage, Aufzug",
    messageLabel: "Nachricht",
    messagePlaceholderSell: "Erzählen Sie uns etwas mehr über die Immobilie…",
    messagePlaceholderQuestion: "Wie können wir Ihnen helfen?",
    submitSeller: "Bewertung Ihrer Immobilie anfordern",
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
    contactPhoneSub: "Mo–Sa",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Schreiben Sie uns eine E-Mail",
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
    timingPlaceholder: "¿Cuándo quieres avanzar?",
    timing: {
      asap: "Lo antes posible",
      within3: "En menos de 3 meses",
      within12: "De 3 a 12 meses",
      exploring: "Solo estoy valorando",
    },
    placeLabelSell: "Dónde está el inmueble",
    placeLabelBuy: "Zona deseada",
    placeLabelOpen: "Zona de interés",
    placePlaceholderSell: "Ej. Tradate, centro",
    placePlaceholderBuy: "Ej. Tradate, Varese y alrededores",
    typeLabel: "Tipología",
    typePlaceholder: "Ej. piso de tres ambientes, villa, oficina",
    budgetLabel: "Presupuesto orientativo",
    budgetPlaceholder: "Ej. hasta 250.000 €",
    featuresLabel: "Características",
    featuresPlaceholder: "Ej. jardín, garaje, ascensor",
    messageLabel: "Mensaje",
    messagePlaceholderSell: "Cuéntanos algo más sobre el inmueble…",
    messagePlaceholderQuestion: "¿Cómo podemos ayudarte?",
    submitSeller: "Solicita la valoración de tu inmueble",
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
    contactPhoneSub: "Lun–Sáb",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Escríbenos un correo",
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
}: {
  initialIntent?: LeadIntent;
  propertyRef?: string;
  initialPlace?: string;
} = {}) {
  const { locale } = useLocale();
  const c = copy[locale];
  const [intent, setIntent] = useState<LeadIntent>(initialIntent ?? "seller");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    consent?: string;
  }>({});
  const formRef = useRef<HTMLFormElement | null>(null);
  const sentRef = useRef<HTMLParagraphElement | null>(null);
  const checkRef = useRef<SVGPathElement | null>(null);

  // Micro-feedback puramente cosmetici (la validazione/focus resta in
  // handleSubmit): shake sui campi in errore, check che si disegna al successo.
  useEffect(() => {
    const keys = Object.keys(errors) as Array<keyof typeof errors>;
    if (!keys.length || !formRef.current) return;
    if (!window.matchMedia(MQ.motionOk).matches) return;
    const targets = keys
      .map((k) => formRef.current!.querySelector(`[name="${k}"]`))
      .filter(Boolean);
    if (targets.length) {
      gsap.fromTo(
        targets,
        { x: 0 },
        { x: 6, duration: 0.06, repeat: 5, yoyo: true, ease: "none", clearProps: "x", overwrite: "auto" }
      );
    }
  }, [errors]);

  useEffect(() => {
    if (!sent) return;
    if (!window.matchMedia(MQ.motionOk).matches) return;
    if (sentRef.current) {
      gsap.from(sentRef.current, { y: 10, opacity: 0, duration: 0.5, ease: "domus" });
    }
    const check = checkRef.current;
    if (check) {
      const len = check.getTotalLength() + 2;
      gsap.fromTo(
        check,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, duration: 0.6, delay: 0.15, ease: "power2.inOut" }
      );
    }
  }, [sent]);

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

  const contacts = [
    { icon: Phone, label: site.phone.label, sub: c.contactPhoneSub, href: site.phone.href },
    { icon: Whatsapp, label: site.whatsapp.label, sub: c.contactWhatsappSub, href: site.whatsapp.href },
    { icon: Mail, label: site.email.label, sub: c.contactMailSub, href: site.email.href },
    {
      icon: Pin,
      label: `${site.address.street}`,
      sub: `${site.address.city} (${site.address.province})`,
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

    // Cattura server-side (Google Sheet se configurato) — best-effort, non blocca il flusso.
    // `submitting` disabilita il bottone durante la scrittura (niente doppio invio) e dà feedback.
    setSubmitting(true);
    void submitLead(lead).finally(() => setSubmitting(false));

    // La conversione. Va registrata QUI, dopo la validazione e prima di aprire WhatsApp:
    // è il momento in cui la richiesta esiste davvero. Passa solo il tipo di richiesta,
    // mai il contenuto del lead — quello ha il suo canale (submitLead) ed è l'unico
    // autorizzato a vederlo. Vedi app/lib/analytics.ts.
    trackConversion(CONVERSIONS.valutazione, "modulo", { intent });

    // Canale immediato: WhatsApp precompilato (apertura sincrona col gesto = niente popup block).
    const url = buildWhatsAppUrl(site.whatsapp.href, formatLeadMessage(lead));
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <section id="contatti" data-tone="cream-deep" className="relative bg-cream-deep text-ink">
      <Atmosphere glow />
      {/* Angolo fiorito (solo desktop): il congedo del filo botanico che
          attraversa la home.
          LO SCUDO TAGLIA SOLO IN ORIZZONTALE. Serviva a impedire che i tralci
          sbordassero a destra portandosi dietro una barra di scorrimento, ma
          `overflow: hidden` li rifilava anche in basso: il tralcio finiva
          tranciato di netto sulla giuntura con la fascia sotto (2026-08-09,
          segnalazione cliente: «sono tagliati, vorrei che fossero continui
          anche sotto»). `overflow-x: clip` è l'unica forma che consente di
          lasciare `visible` sull'altro asse — con `hidden` il CSS degraderebbe
          il verticale ad `auto`, e la sezione si ritroverebbe una barra di
          scorrimento propria.
          Il tralcio scavalca la giuntura e resta VISIBILE sopra la fascia che
          segue senza bisogno di uno z-index: è un discendente posizionato, e
          i discendenti posizionati si dipingono dopo gli sfondi in flusso dei
          fratelli successivi. Niente z-index apposta: alzarlo lo porterebbe
          anche sopra il form, che sotto i 1300px gli passa accanto. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-x-clip">
        <Fioritura
          variant="corner-br"
          className="absolute -bottom-[12vh] -right-5 hidden h-[42vh] w-[16vw] lg:block"
        />
      </div>
      <div className="relative mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <CameraIn className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Left: pitch + contatti */}
          <div>
            <div>
              <SegnoDomusBadge>{c.badge}</SegnoDomusBadge>
            </div>
            <span className="eyebrow mt-4">{c.eyebrow}</span>
            {/* Testa di capitolo: d2 e i caratteri che girano uno a uno, come
                le altre teste della home (era WordReveal a 48/51px fissi).
                `balance` tolta: su un titolo splittato il text-wrap si
                ricalcola dopo lo split e fa saltare una riga. Interlinea e
                tracking li detta `display-tight`, che è unlayered.
                d3 e non d2: questa testa vive in mezza colonna (~534px anche
                su un 1920) e a 146px diventava una torre di 10 righe alta
                1289px, più del form che le sta accanto. Vedi la regola sulla
                colonna accanto ai token in globals.css. */}
            <CharFlip
              as="h2"
              exit
              className="mt-5 font-display text-d3 display-tight font-medium text-ink"
            >
              {c.title}
            </CharFlip>
            {/* Paragrafo d'apertura: righe che salgono dalla maschera, con
                l'uscita dalla parte opposta risalendo la pagina. Qui non c'è
                nessun Reveal attorno, quindi niente doppio-hide. */}
            <TextLines
              as="p"
              exit
              className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone"
            >
              {c.subcopy}
            </TextLines>

            <figure className="arch-frame mt-8 w-full max-w-[15rem] border border-line">
              <Image
                src="/images/reali/raffaela-keys.jpg"
                alt={c.keysAlt}
                width={480}
                height={640}
                sizes="(min-width: 1024px) 15rem, 60vw"
                className="photo-warm h-auto w-full object-cover"
              />
            </figure>
            {/* Nessuna firma grafica: il tracciato che stava qui era un calligrafico generico,
                non la firma reale della fondatrice. L'animazione DrawOnScroll resta pronta:
                appena arriva l'SVG vero (docs/da-chiedere-alla-cliente.md §2.12) basta rimetterlo qui. */}

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {contacts.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-paper p-4 transition-colors duration-300 hover:border-red/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold text-ink">{item.label}</span>
                    <span className="block text-[0.78rem] text-stone">{item.sub}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-[2rem] border border-line bg-paper p-6 pb-28 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)] sm:p-8 sm:pb-8">
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Honeypot anti-spam: fuori schermo, non focusabile, ignorato dagli screen reader. */}
              <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-cream p-1.5 sm:grid-cols-4">
                {leadOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={intent === opt.key}
                    onClick={() => setIntent(opt.key)}
                    // min-h-11 = 44px: erano 40, e questo è il primo comando del form.
                    className={`inline-flex min-h-11 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                      intent === opt.key ? "bg-red text-white" : "text-stone hover:text-ink"
                    }`}
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
              <div className="grid gap-5 sm:grid-cols-2">
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
                <label className="flex items-start gap-3 text-[0.8rem] leading-relaxed text-stone">
                  <input
                    type="checkbox"
                    name="consent"
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "consent-error" : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  />
                  <span>
                    {c.consentPre}
                    <a href="/privacy" className="underline underline-offset-2 hover:text-ink">
                      {c.consentLinkText}
                    </a>
                    {c.consentPost}
                  </span>
                </label>
                {errors.consent ? (
                  <span id="consent-error" role="alert" className="mt-2 block text-[0.72rem] text-red-dark">
                    {errors.consent}
                  </span>
                ) : null}
              </div>

              <SendCta submitting={submitting} size="lg" className="mt-1 w-full">
                {submitLabels[intent]}
              </SendCta>
              {sent ? (
                <p
                  ref={sentRef}
                  role="status"
                  className="flex items-center justify-center gap-2.5 rounded-2xl border border-red/25 bg-red-soft/60 px-4 py-3 text-center text-sm text-red-dark"
                >
                  {/* Check che si disegna (senza JS/reduced-motion: già completo) */}
                  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-red">
                    <path
                      ref={checkRef}
                      d="M4.5 12.5l5 5L19.5 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    {c.sentPrefix}{" "}
                    <a href={site.whatsapp.href} className="font-semibold underline">
                      {c.sentLink} {site.whatsapp.label}
                    </a>
                    .
                  </span>
                </p>
              ) : null}
            </form>
          </div>
        </CameraIn>
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
        <Field name="place" label={c.placeLabelSell} placeholder={c.placePlaceholderSell} autoComplete="address-level2" autoCapitalize="words" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="propertyType" label={c.typeLabel} placeholder={c.typePlaceholder} />
          <Field name="surface" label={c.surfaceLabel} placeholder={c.surfacePlaceholder} inputMode="numeric" autoCapitalize="none" spellCheck={false} />
        </div>
        <Select name="timing" label={c.timingLabel} placeholder={c.timingPlaceholder} options={timingOptions} />
        <TextArea name="message" label={c.messageLabel} placeholder={c.messagePlaceholderSell} />
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
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
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
        className={`rounded-xl border bg-cream px-4 py-3 text-sm text-ink placeholder:text-stone/60 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
          error ? "border-red" : "border-line"
        }`}
      />
      {error ? (
        <span id={`${name}-error`} role="alert" className="text-[0.72rem] text-red-dark">
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
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={3}
        placeholder={placeholder}
        className="rounded-xl border border-line bg-cream px-4 py-3 text-sm text-ink placeholder:text-stone/60 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
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
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue=""
        className="rounded-xl border border-line bg-cream px-4 py-3 text-sm text-ink transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.value}
          </option>
        ))}
      </select>
    </div>
  );
}
