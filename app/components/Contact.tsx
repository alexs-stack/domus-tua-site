"use client";

import { useState } from "react";
import { Phone, Whatsapp, Mail, Pin, ArrowUpRight } from "./Icons";
import { site } from "../lib/site";
import WordReveal from "./WordReveal";

const contacts = [
  { icon: Phone, label: site.phone.label, sub: "Lun–Sab", href: site.phone.href },
  { icon: Whatsapp, label: site.whatsapp.label, sub: "WhatsApp", href: site.whatsapp.href },
  { icon: Mail, label: site.email.label, sub: "Scrivici una mail", href: site.email.href },
  {
    icon: Pin,
    label: `${site.address.street}`,
    sub: `${site.address.city} (${site.address.province})`,
    href: "https://maps.google.com/?q=Domus+Tua+Immobiliare+Corso+Bernacchi+91+Tradate",
  },
];

// Percorsi lead. `msg` alimenta il messaggio WhatsApp; `key` è il tipo lead
// (utile per una futura integrazione CRM: lead type + source page + immobile selezionato).
const leadOptions = [
  { key: "Vendere", label: "Vendo casa", msg: "Vorrei vendere casa" },
  { key: "Acquistare", label: "Cerco casa", msg: "Sto cercando casa" },
  { key: "Open Domus", label: "Open Domus", msg: "Vorrei informazioni su Open Domus" },
  { key: "Altro", label: "Altro", msg: "Vorrei informazioni" },
] as const;
type Intent = (typeof leadOptions)[number]["key"];

export default function Contact() {
  const [intent, setIntent] = useState<Intent>("Vendere");
  const [sent, setSent] = useState(false);

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
            <span className="eyebrow">Parla con Domus Tua</span>
            <WordReveal
              as="h2"
              className="mt-5 block font-display text-4xl font-medium leading-[1.04] tracking-tight text-ink balance sm:text-[3.2rem]"
              text="Inizia dal primo passo: una valutazione seria della tua casa."
            />
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-stone">
              Raccontaci il tuo immobile o cosa stai cercando. Ti aiuteremo a capire valore,
              possibilità e il percorso migliore, senza impegno.
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
                    {opt.label}
                  </button>
                ))}
              </div>

              <Field name="name" label="Nome e cognome" placeholder="Es. Maria Rossi" required />
              <Field name="phone" label="Telefono" placeholder="Es. 333 1234567" type="tel" required />
              <Field
                name="place"
                label={intent === "Vendere" ? "Dove si trova l'immobile" : "Zona che cerchi"}
                placeholder="Es. Tradate, centro"
              />
              <div className="flex flex-col gap-2">
                <label htmlFor="note" className="text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-stone">
                  Messaggio
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  placeholder="Raccontaci qualcosa in più…"
                  className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-ink placeholder:text-stone/60 transition-colors focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                />
              </div>

              <button
                type="submit"
                className="group mt-1 flex items-center justify-center gap-2 rounded-full bg-red py-4 pl-6 pr-3 text-base font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-[0.98]"
              >
                Richiedi una valutazione
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </button>
              {sent ? (
                <p
                  role="status"
                  className="rounded-2xl border border-red/25 bg-red-soft/60 px-4 py-3 text-center text-sm text-red-dark"
                >
                  Stiamo aprendo WhatsApp. Se non si apre,{" "}
                  <a href={site.whatsapp.href} className="font-semibold underline">
                    scrivici al {site.whatsapp.label}
                  </a>
                  .
                </p>
              ) : (
                <p className="text-center text-[0.72rem] text-stone">
                  Inviando accetti di essere ricontattato. Nessuno spam, mai.
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
