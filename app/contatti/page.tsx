import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import Contact from "../components/Contact";
import Reveal from "../components/Reveal";
import { Pin, ArrowUpRight } from "../components/Icons";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Domus Tua Immobiliare, Corso Bernacchi 91, Tradate (VA). Telefono 0331 844898, WhatsApp 346 6042314. Scrivici per una valutazione o per cercare casa.",
};

const orari = [
  { d: "Lunedì – Venerdì", h: "9:00 – 12:30 · 15:00 – 19:00" },
  { d: "Sabato", h: "9:00 – 12:30" },
  { d: "Domenica", h: "Su appuntamento" },
];

export default function ContattiPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-paper">
        {/* Intro */}
        <section className="bg-cream">
          <div className="mx-auto max-w-[1240px] px-5 pt-36 pb-16 sm:px-8 sm:pt-40 sm:pb-20">
            <Reveal className="max-w-3xl">
              <span className="eyebrow">Contatti</span>
              <h1 className="mt-5 font-display text-[2.6rem] font-medium leading-[1.03] tracking-tight text-ink balance sm:text-6xl">
                Parliamo della tua casa.
              </h1>
              <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-stone">
                Che tu voglia vendere o cercare casa, siamo a Tradate, a un passo. Passa in agenzia,
                chiama o scrivici: ti rispondiamo presto e con attenzione.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Mappa + orari */}
        <section className="bg-paper">
          <div className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
              <Reveal>
                <div className="overflow-hidden rounded-[2rem] border border-line bg-cream-deep">
                  <iframe
                    title="Mappa Domus Tua Immobiliare"
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
                    Apri in Google Maps
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
                      Orari
                    </p>
                    <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                      {orari.map((o) => (
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

        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
