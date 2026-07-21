"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Phone, Whatsapp, Mail, Pin, ArrowUpRight } from "./Icons";
import { SegnoDomusBadge } from "./BrandMotif";
import { site } from "../lib/site";
import { buildWhatsAppUrl } from "../lib/forms/whatsapp";
import { formatLeadMessage, submitLead, type Lead, type LeadIntent } from "../lib/forms/lead";
import WordReveal from "./WordReveal";
import Signature from "./Signature";
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
    nameLabel: "Nome e cognome",
    namePlaceholder: "Es. Maria Rossi",
    contactLabel: "Telefono o email",
    contactPlaceholder: "Es. 333 1234567 o maria@email.it",
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
    submitSeller: "Richiedi una valutazione",
    submitBuyer: "Trova la casa giusta",
    submitQuestion: "Invia la richiesta",
    submitOpenDomus: "Scopri Open Domus",
    errName: "Inserisci il tuo nome.",
    errContact: "Lasciaci un telefono o un’email per ricontattarti.",
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
    nameLabel: "Full name",
    namePlaceholder: "E.g. Maria Rossi",
    contactLabel: "Phone or email",
    contactPlaceholder: "E.g. 333 1234567 or maria@email.it",
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
    submitSeller: "Request a valuation",
    submitBuyer: "Find the right home",
    submitQuestion: "Send your request",
    submitOpenDomus: "Discover Open Domus",
    errName: "Please enter your name.",
    errContact: "Leave us a phone number or an email so we can reply.",
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
    nameLabel: "Nom et prénom",
    namePlaceholder: "Ex. Maria Rossi",
    contactLabel: "Téléphone ou e-mail",
    contactPlaceholder: "Ex. 333 1234567 ou maria@email.it",
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
    submitSeller: "Demander une estimation",
    submitBuyer: "Trouver le bon logement",
    submitQuestion: "Envoyer la demande",
    submitOpenDomus: "Découvrir Open Domus",
    errName: "Veuillez indiquer votre nom.",
    errContact: "Laissez-nous un téléphone ou un e-mail pour vous recontacter.",
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
    nameLabel: "Vor- und Nachname",
    namePlaceholder: "Z. B. Maria Rossi",
    contactLabel: "Telefon oder E-Mail",
    contactPlaceholder: "Z. B. 333 1234567 oder maria@email.it",
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
    submitSeller: "Bewertung anfordern",
    submitBuyer: "Das passende Zuhause finden",
    submitQuestion: "Anfrage senden",
    submitOpenDomus: "Open Domus entdecken",
    errName: "Bitte geben Sie Ihren Namen ein.",
    errContact: "Hinterlassen Sie uns eine Telefonnummer oder E-Mail für den Rückruf.",
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
    nameLabel: "Nombre y apellidos",
    namePlaceholder: "Ej. Maria Rossi",
    contactLabel: "Teléfono o correo",
    contactPlaceholder: "Ej. 333 1234567 o maria@email.it",
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
    submitSeller: "Solicita una valoración",
    submitBuyer: "Encuentra la casa ideal",
    submitQuestion: "Enviar la solicitud",
    submitOpenDomus: "Descubre Open Domus",
    errName: "Introduce tu nombre.",
    errContact: "Déjanos un teléfono o un correo para poder responderte.",
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
  const [errors, setErrors] = useState<{ name?: string; contact?: string; consent?: string }>({});

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

  const leadLabels: Record<LeadIntent, string> = {
    seller: c.leadSeller,
    buyer: c.leadBuyer,
    question: c.leadQuestion,
    "open-domus": c.leadOpenDomus,
  };

  const submitLabels: Record<LeadIntent, string> = {
    seller: c.submitSeller,
    buyer: c.submitBuyer,
    question: c.submitQuestion,
    "open-domus": c.submitOpenDomus,
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const val = (k: string) => ((data.get(k) as string) || "").trim();

    // Honeypot anti-spam: un umano non vede/compila "company". Se pieno → bot, esci in silenzio.
    if (val("company")) return;

    const name = val("name");
    const contact = val("contact");
    const consent = data.get("consent") != null;

    // Validazione client-side: nome + contatto + consenso privacy obbligatori.
    const nextErrors: { name?: string; contact?: string; consent?: string } = {};
    if (!name) nextErrors.name = c.errName;
    if (!contact) nextErrors.contact = c.errContact;
    if (!consent) nextErrors.consent = c.errConsent;
    if (nextErrors.name || nextErrors.contact || nextErrors.consent) {
      setErrors(nextErrors);
      // A11y: porta il focus sul primo campo non valido (dopo il re-render).
      const form = e.currentTarget;
      const firstInvalid = nextErrors.name ? "name" : nextErrors.contact ? "contact" : "consent";
      requestAnimationFrame(() =>
        form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus(),
      );
      return;
    }
    setErrors({});

    const lead: Lead = {
      intent,
      name,
      contact,
      place: val("place") || undefined,
      propertyType: val("propertyType") || undefined,
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

    // Canale immediato: WhatsApp precompilato (apertura sincrona col gesto = niente popup block).
    const url = buildWhatsAppUrl(site.whatsapp.href, formatLeadMessage(lead));
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <section id="contatti" className="bg-cream-deep text-ink">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Left: pitch + contatti */}
          <div>
            <div>
              <SegnoDomusBadge>{c.badge}</SegnoDomusBadge>
            </div>
            <span className="eyebrow mt-4">{c.eyebrow}</span>
            <WordReveal
              as="h2"
              className="mt-5 block font-display text-4xl font-medium leading-[1.04] tracking-tight text-ink balance sm:text-[3.2rem]"
              text={c.title}
            />
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
              {c.subcopy}
            </p>

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
            {/* Firma della fondatrice: trattamento tipografico del nome (vedi Signature.tsx). */}
            <Signature className="mt-5" />

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
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
                    className={`rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                      intent === opt.key ? "bg-red text-white" : "text-stone hover:text-ink"
                    }`}
                  >
                    {leadLabels[opt.key]}
                  </button>
                ))}
              </div>

              {/* Nome + contatto: sempre presenti e obbligatori. */}
              <Field
                name="name"
                label={c.nameLabel}
                placeholder={c.namePlaceholder}
                required
                autoComplete="name"
                error={errors.name}
              />
              <Field
                name="contact"
                label={c.contactLabel}
                placeholder={c.contactPlaceholder}
                required
                error={errors.contact}
              />

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

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="group mt-1 flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-6 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitLabels[intent]}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  {submitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </span>
              </button>
              {sent ? (
                <p
                  role="status"
                  className="rounded-2xl border border-red/25 bg-red-soft/60 px-4 py-3 text-center text-sm text-red-dark"
                >
                  {c.sentPrefix}{" "}
                  <a href={site.whatsapp.href} className="font-semibold underline">
                    {c.sentLink} {site.whatsapp.label}
                  </a>
                  .
                </p>
              ) : null}
            </form>
          </div>
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
  if (intent === "seller") {
    return (
      <>
        <Field name="place" label={c.placeLabelSell} placeholder={c.placePlaceholderSell} />
        <Field name="propertyType" label={c.typeLabel} placeholder={c.typePlaceholder} />
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
        />
        <Field name="budget" label={c.budgetLabel} placeholder={c.budgetPlaceholder} />
        <Field name="propertyType" label={c.typeLabel} placeholder={c.typePlaceholder} />
        <Field name="features" label={c.featuresLabel} placeholder={c.featuresPlaceholder} />
      </>
    );
  }
  if (intent === "open-domus") {
    return <Field name="place" label={c.placeLabelOpen} placeholder={c.placePlaceholderBuy} />;
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
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
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
