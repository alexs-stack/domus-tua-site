"use client";

import Reveal from "../components/Reveal";
import { Pin, ArrowUpRight } from "../components/Icons";
import { SegnoDomusDivider } from "../components/BrandMotif";
import { site } from "../lib/site";
import { useLocale } from "../components/i18n/LocaleProvider";

const copy = {
  it: {
    eyebrow: "Contatti",
    title: "Parliamo della tua casa.",
    subcopy:
      "Che tu voglia vendere o cercare casa, siamo a Tradate, a un passo. Passa in agenzia, chiama o scrivici: ti rispondiamo presto e con attenzione.",
    mapTitle: "Mappa Domus Tua Immobiliare",
    openMaps: "Apri in Google Maps",
    hoursLabel: "Orari",
    hours: [
      { d: "Lunedì – Venerdì", h: "9:00 – 12:30 · 15:00 – 19:00" },
      { d: "Sabato", h: "9:00 – 12:30" },
      { d: "Domenica", h: "Su appuntamento" },
    ],
  },
  en: {
    eyebrow: "Contact",
    title: "Let’s talk about your home.",
    subcopy:
      "Whether you want to sell or find a home, we’re right here in Tradate, just a step away. Stop by the agency, call or write to us: we reply quickly and with genuine care.",
    mapTitle: "Domus Tua Immobiliare map",
    openMaps: "Open in Google Maps",
    hoursLabel: "Opening hours",
    hours: [
      { d: "Monday – Friday", h: "9:00 – 12:30 · 15:00 – 19:00" },
      { d: "Saturday", h: "9:00 – 12:30" },
      { d: "Sunday", h: "By appointment" },
    ],
  },
  fr: {
    eyebrow: "Contact",
    title: "Parlons de votre maison.",
    subcopy:
      "Que vous souhaitiez vendre ou trouver une maison, nous sommes à Tradate, à deux pas. Passez à l’agence, appelez-nous ou écrivez-nous : nous vous répondons vite et avec attention.",
    mapTitle: "Carte Domus Tua Immobiliare",
    openMaps: "Ouvrir dans Google Maps",
    hoursLabel: "Horaires",
    hours: [
      { d: "Lundi – Vendredi", h: "9:00 – 12:30 · 15:00 – 19:00" },
      { d: "Samedi", h: "9:00 – 12:30" },
      { d: "Dimanche", h: "Sur rendez-vous" },
    ],
  },
  de: {
    eyebrow: "Kontakt",
    title: "Sprechen wir über Ihr Zuhause.",
    subcopy:
      "Ob Sie verkaufen oder ein Zuhause finden möchten – wir sind in Tradate, nur einen Schritt entfernt. Kommen Sie in unser Büro, rufen Sie an oder schreiben Sie uns: Wir antworten schnell und mit Sorgfalt.",
    mapTitle: "Karte Domus Tua Immobiliare",
    openMaps: "In Google Maps öffnen",
    hoursLabel: "Öffnungszeiten",
    hours: [
      { d: "Montag – Freitag", h: "9:00 – 12:30 · 15:00 – 19:00" },
      { d: "Samstag", h: "9:00 – 12:30" },
      { d: "Sonntag", h: "Nach Vereinbarung" },
    ],
  },
  es: {
    eyebrow: "Contacto",
    title: "Hablemos de tu casa.",
    subcopy:
      "Tanto si quieres vender como encontrar casa, estamos en Tradate, a un paso. Pásate por la agencia, llámanos o escríbenos: te respondemos pronto y con atención.",
    mapTitle: "Mapa Domus Tua Immobiliare",
    openMaps: "Abrir en Google Maps",
    hoursLabel: "Horario",
    hours: [
      { d: "Lunes – Viernes", h: "9:00 – 12:30 · 15:00 – 19:00" },
      { d: "Sábado", h: "9:00 – 12:30" },
      { d: "Domingo", h: "Con cita previa" },
    ],
  },
};

export default function ContattiContent() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <>
      {/* Intro */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1240px] px-5 pt-36 pb-16 sm:px-8 sm:pt-40 sm:pb-20">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">{c.eyebrow}</span>
            <h1 className="mt-5 font-display text-[2.6rem] font-medium leading-[1.03] tracking-tight text-ink balance sm:text-6xl">
              {c.title}
            </h1>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-stone">
              {c.subcopy}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mappa + orari */}
      <section className="bg-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
          <SegnoDomusDivider className="mb-12 sm:mb-14" />
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
            <Reveal>
              <div className="overflow-hidden rounded-[2rem] border border-line bg-cream-deep">
                <iframe
                  title={c.mapTitle}
                  src="https://www.google.com/maps?q=Corso+Bernacchi+91,+21049+Tradate+VA&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-[320px] w-full sm:h-[400px]"
                />
                <a
                  href="https://maps.google.com/?q=Domus+Tua+Immobiliare+Corso+Bernacchi+91+Tradate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-2 border-t border-line bg-paper px-5 py-4 text-sm font-semibold text-ink transition-colors hover:text-red"
                >
                  {c.openMaps}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="flex h-full flex-col justify-between rounded-[2rem] border border-line bg-cream p-7">
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-soft text-red">
                    <Pin className="h-5 w-5" />
                  </span>
                  <p className="mt-5 font-display text-xl font-medium text-ink">
                    {site.address.street}
                  </p>
                  <p className="text-stone">
                    {site.address.city} ({site.address.province})
                  </p>
                </div>
                <div className="mt-8 border-t border-line pt-6">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-stone">
                    {c.hoursLabel}
                  </p>
                  <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                    {c.hours.map((o) => (
                      <li key={o.d} className="flex justify-between gap-4">
                        <span className="text-graphite">{o.d}</span>
                        <span className="text-right font-medium text-ink">{o.h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
