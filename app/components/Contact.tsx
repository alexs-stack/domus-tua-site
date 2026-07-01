"use client";

import { useState } from "react";
import { Phone, Whatsapp, Mail, Pin, ArrowUpRight } from "./Icons";
import { site } from "../lib/site";
import WordReveal from "./WordReveal";
import { useLocale } from "./i18n/LocaleProvider";

// Percorsi lead. `msg` alimenta il messaggio WhatsApp; `key` è il tipo lead
// (utile per una futura integrazione CRM: lead type + source page + immobile selezionato).
const leadOptions = [
  { key: "Vendere", label: "Vendo casa", msg: "Vorrei vendere casa" },
  { key: "Acquistare", label: "Cerco casa", msg: "Sto cercando casa" },
  { key: "Open Domus", label: "Open Domus", msg: "Vorrei informazioni su Open Domus" },
  { key: "Altro", label: "Altro", msg: "Vorrei informazioni" },
] as const;
type Intent = (typeof leadOptions)[number]["key"];

const copy = {
  it: {
    eyebrow: "Parla con Domus Tua",
    title: "Inizia dal primo passo: una valutazione seria della tua casa.",
    subcopy:
      "Raccontaci il tuo immobile o cosa stai cercando. Ti aiuteremo a capire valore, possibilità e il percorso migliore, senza impegno.",
    leadVendere: "Vendo casa",
    leadAcquistare: "Cerco casa",
    leadOpenDomus: "Open Domus",
    leadAltro: "Altro",
    nameLabel: "Nome e cognome",
    namePlaceholder: "Es. Maria Rossi",
    phoneLabel: "Telefono",
    phonePlaceholder: "Es. 333 1234567",
    placeLabelSell: "Dove si trova l'immobile",
    placeLabelBuy: "Zona che cerchi",
    placePlaceholder: "Es. Tradate, centro",
    messageLabel: "Messaggio",
    messagePlaceholder: "Raccontaci qualcosa in più…",
    submit: "Richiedi una valutazione",
    sentPrefix: "Stiamo aprendo WhatsApp. Se non si apre,",
    sentLink: "scrivici al",
    privacy: "Inviando accetti di essere ricontattato. Nessuno spam, mai.",
    contactPhoneSub: "Lun–Sab",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Scrivici una mail",
  },
  en: {
    eyebrow: "Talk to Domus Tua",
    title: "Start with the first step: a serious valuation of your home.",
    subcopy:
      "Tell us about your property or what you're looking for. We'll help you understand its value, your options and the best path forward, with no obligation.",
    leadVendere: "Selling my home",
    leadAcquistare: "Looking for a home",
    leadOpenDomus: "Open Domus",
    leadAltro: "Other",
    nameLabel: "Full name",
    namePlaceholder: "E.g. Maria Rossi",
    phoneLabel: "Phone",
    phonePlaceholder: "E.g. 333 1234567",
    placeLabelSell: "Where the property is located",
    placeLabelBuy: "Area you're looking in",
    placePlaceholder: "E.g. Tradate, centre",
    messageLabel: "Message",
    messagePlaceholder: "Tell us a little more…",
    submit: "Request a valuation",
    sentPrefix: "We're opening WhatsApp. If it doesn't open,",
    sentLink: "message us at",
    privacy: "By sending you agree to be contacted back. No spam, ever.",
    contactPhoneSub: "Mon–Sat",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Send us an email",
  },
  fr: {
    eyebrow: "Parlez à Domus Tua",
    title: "Commencez par la première étape : une estimation sérieuse de votre bien.",
    subcopy:
      "Parlez-nous de votre bien ou de ce que vous recherchez. Nous vous aiderons à en comprendre la valeur, les possibilités et la meilleure voie à suivre, sans engagement.",
    leadVendere: "Je vends",
    leadAcquistare: "Je cherche",
    leadOpenDomus: "Open Domus",
    leadAltro: "Autre",
    nameLabel: "Nom et prénom",
    namePlaceholder: "Ex. Maria Rossi",
    phoneLabel: "Téléphone",
    phonePlaceholder: "Ex. 333 1234567",
    placeLabelSell: "Où se situe le bien",
    placeLabelBuy: "Secteur recherché",
    placePlaceholder: "Ex. Tradate, centre",
    messageLabel: "Message",
    messagePlaceholder: "Dites-nous en un peu plus…",
    submit: "Demander une estimation",
    sentPrefix: "Nous ouvrons WhatsApp. S'il ne s'ouvre pas,",
    sentLink: "écrivez-nous au",
    privacy: "En envoyant, vous acceptez d'être recontacté. Jamais de spam.",
    contactPhoneSub: "Lun–Sam",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Écrivez-nous un e-mail",
  },
  de: {
    eyebrow: "Sprechen Sie mit Domus Tua",
    title: "Beginnen Sie mit dem ersten Schritt: einer fundierten Bewertung Ihrer Immobilie.",
    subcopy:
      "Erzählen Sie uns von Ihrer Immobilie oder wonach Sie suchen. Wir helfen Ihnen, Wert, Möglichkeiten und den besten Weg zu verstehen – unverbindlich.",
    leadVendere: "Ich verkaufe",
    leadAcquistare: "Ich suche",
    leadOpenDomus: "Open Domus",
    leadAltro: "Sonstiges",
    nameLabel: "Vor- und Nachname",
    namePlaceholder: "Z. B. Maria Rossi",
    phoneLabel: "Telefon",
    phonePlaceholder: "Z. B. 333 1234567",
    placeLabelSell: "Wo sich die Immobilie befindet",
    placeLabelBuy: "Gesuchte Gegend",
    placePlaceholder: "Z. B. Tradate, Zentrum",
    messageLabel: "Nachricht",
    messagePlaceholder: "Erzählen Sie uns etwas mehr…",
    submit: "Bewertung anfordern",
    sentPrefix: "Wir öffnen WhatsApp. Falls es sich nicht öffnet,",
    sentLink: "schreiben Sie uns an",
    privacy: "Mit dem Absenden erklären Sie sich mit einer Kontaktaufnahme einverstanden. Niemals Spam.",
    contactPhoneSub: "Mo–Sa",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Schreiben Sie uns eine E-Mail",
  },
  es: {
    eyebrow: "Habla con Domus Tua",
    title: "Empieza por el primer paso: una valoración seria de tu casa.",
    subcopy:
      "Cuéntanos sobre tu inmueble o qué estás buscando. Te ayudaremos a entender su valor, las posibilidades y el mejor camino, sin compromiso.",
    leadVendere: "Vendo casa",
    leadAcquistare: "Busco casa",
    leadOpenDomus: "Open Domus",
    leadAltro: "Otro",
    nameLabel: "Nombre y apellidos",
    namePlaceholder: "Ej. Maria Rossi",
    phoneLabel: "Teléfono",
    phonePlaceholder: "Ej. 333 1234567",
    placeLabelSell: "Dónde se encuentra el inmueble",
    placeLabelBuy: "Zona que buscas",
    placePlaceholder: "Ej. Tradate, centro",
    messageLabel: "Mensaje",
    messagePlaceholder: "Cuéntanos algo más…",
    submit: "Solicita una valoración",
    sentPrefix: "Estamos abriendo WhatsApp. Si no se abre,",
    sentLink: "escríbenos al",
    privacy: "Al enviar aceptas ser contactado. Nada de spam, nunca.",
    contactPhoneSub: "Lun–Sáb",
    contactWhatsappSub: "WhatsApp",
    contactMailSub: "Escríbenos un correo",
  },
} as const;

export default function Contact() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [intent, setIntent] = useState<Intent>("Vendere");
  const [sent, setSent] = useState(false);

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

  const leadLabels: Record<Intent, string> = {
    Vendere: c.leadVendere,
    Acquistare: c.leadAcquistare,
    "Open Domus": c.leadOpenDomus,
    Altro: c.leadAltro,
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get("name") as string) || "";
    const place = (data.get("place") as string) || "";
    const note = (data.get("note") as string) || "";
    const opt = leadOptions.find((o) => o.key === intent) ?? leadOptions[0];
    // CRM-ready: lead type = intent. In futuro qui si allegheranno source page e immobile.
    const text = encodeURIComponent(
      `Ciao Domus Tua, sono ${name}. ${opt.msg}` +
        (place ? ` (zona: ${place})` : "") +
        ".\n" +
        (note ? `${note}\n` : "") +
        `(Richiesta dal sito · ${intent})`
    );
    window.open(`https://wa.me/393466042314?text=${text}`, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <section id="contatti" className="bg-cream-deep text-ink">
      <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {/* Left: pitch + contatti */}
          <div>
            <span className="eyebrow">{c.eyebrow}</span>
            <WordReveal
              as="h2"
              className="mt-5 block font-display text-4xl font-medium leading-[1.04] tracking-tight text-ink balance sm:text-[3.2rem]"
              text={c.title}
            />
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
              {c.subcopy}
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {contacts.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-paper p-4 transition-colors duration-300 hover:border-red/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-soft text-red-dark">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold text-ink">{c.label}</span>
                    <span className="block text-[0.78rem] text-stone">{c.sub}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="rounded-[2rem] border border-line bg-paper p-6 shadow-[0_40px_90px_-60px_rgba(26,24,22,0.5)] sm:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

              <Field name="name" label={c.nameLabel} placeholder={c.namePlaceholder} required />
              <Field name="phone" label={c.phoneLabel} placeholder={c.phonePlaceholder} type="tel" required />
              <Field
                name="place"
                label={intent === "Vendere" ? c.placeLabelSell : c.placeLabelBuy}
                placeholder={c.placePlaceholder}
              />
              <div className="flex flex-col gap-2">
                <label htmlFor="note" className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
                  {c.messageLabel}
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  placeholder={c.messagePlaceholder}
                  className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink placeholder:text-stone/60 transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                />
              </div>

              <button
                type="submit"
                className="group mt-1 flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-6 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                {c.submit}
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
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
              ) : (
                <p className="text-center text-[0.72rem] text-stone">
                  {c.privacy}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
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
        required={required}
        className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink placeholder:text-stone/60 transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      />
    </div>
  );
}
