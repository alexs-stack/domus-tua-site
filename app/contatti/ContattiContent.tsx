"use client";

import { useRef } from "react";
import Reveal from "../components/Reveal";
import TextLines from "../components/motion/TextLines";
import { Pin, ArrowUpRight } from "../components/Icons";
import { site } from "../lib/site";
import { useLocale } from "../components/i18n/LocaleProvider";
import { gsap, useGSAP, MQ, dur } from "../lib/motion/gsap";

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
      { d: "Lunedì – Venerdì", h: site.hours.weekdays },
      { d: "Sabato", h: site.hours.saturday },
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
      { d: "Monday – Friday", h: site.hours.weekdays },
      { d: "Saturday", h: site.hours.saturday },
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
      { d: "Lundi – Vendredi", h: site.hours.weekdays },
      { d: "Samedi", h: site.hours.saturday },
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
      { d: "Montag – Freitag", h: site.hours.weekdays },
      { d: "Samstag", h: site.hours.saturday },
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
      { d: "Lunes – Viernes", h: site.hours.weekdays },
      { d: "Sábado", h: site.hours.saturday },
      { d: "Domingo", h: "Con cita previa" },
    ],
  },
};

export default function ContattiContent() {
  const { locale } = useLocale();
  const c = copy[locale];
  const hoursRef = useRef<HTMLUListElement | null>(null);

  // Righe orari in sequenza. Stato nascosto solo via JS (fromTo post-idratazione):
  // senza JS o con reduced-motion la lista resta visibile e statica.
  useGSAP(
    () => {
      const list = hoursRef.current;
      if (!list) return;
      const rows = list.querySelectorAll("li");
      if (!rows.length) return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motionOk, () => {
        gsap.fromTo(
          rows,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: dur.short,
            ease: "domus",
            stagger: 0.07,
            // Replay a ogni passaggio (richiesta cliente): niente clearProps,
            // romperebbe il restart/reverse del trigger.
            scrollTrigger: {
              trigger: list,
              start: "top 88%",
              toggleActions: "restart none none reverse",
            },
          }
        );
      });
    },
    // revertOnUpdate: al cambio lingua React ricrea le <li> (key = giorno),
    // quindi il context va revertato e ricreato sui nodi nuovi.
    { scope: hoursRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <>
      {/* Intro */}
      <section className="bg-cream">
        <div className="dt-row pt-36 pb-16 sm:pt-40 sm:pb-20">
          <div>
            <Reveal>
              <span className="eyebrow">{c.eyebrow}</span>
            </Reveal>
            {/* H1 fuori dal Reveal: il titolo non va mai nascosto via CSS pre-JS
                (SEO/no-JS). TextLines nasconde le righe solo post-idratazione. */}
            <TextLines as="h1" className="mt-6 max-w-[16ch] font-display text-[clamp(3rem,8vw,9rem)] leading-[0.92]">
              {c.title}
            </TextLines>
            <Reveal delay={100}>
              <p className="lead mt-8">{c.subcopy}</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mappa + orari: mappa squadrata, indirizzo e orari come testo su hairline. */}
      <section className="bg-cream">
        <div className="dt-row py-16 sm:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
            <Reveal>
              <div className="overflow-hidden bg-cream-deep">
                <iframe
                  title={c.mapTitle}
                  src="https://www.google.com/maps?q=Corso+Bernacchi+91,+21049+Tradate+VA&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block h-[320px] w-full sm:h-[400px]"
                />
              </div>
              <a
                href="https://maps.google.com/?q=Domus+Tua+Immobiliare+Corso+Bernacchi+91+Tradate"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 inline-flex items-center gap-2 text-ui font-semibold uppercase tracking-[0.08em] text-ink underline underline-offset-4 transition-colors hover:text-red"
              >
                {c.openMaps}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Reveal>
            <Reveal delay={100}>
              <div className="flex h-full flex-col justify-between border-t border-line pt-8">
                <div>
                  <Pin className="h-6 w-6 text-red" />
                  <p className="mt-5 font-display text-d3 uppercase text-ink">{site.address.street}</p>
                  <p className="mt-2 text-body text-graphite">
                    {site.address.city} ({site.address.province})
                  </p>
                </div>
                <div className="mt-10 border-t border-line pt-6">
                  <p className="text-ui font-semibold uppercase tracking-[0.08em] text-stone">{c.hoursLabel}</p>
                  <ul ref={hoursRef} className="mt-5 flex flex-col gap-3 text-body">
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
