import type { Metadata } from "next";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import Stats from "../components/Stats";
import Team from "../components/Team";
import Reveal from "../components/Reveal";
import Contact from "../components/Contact";
import SectionDivider from "../components/SectionDivider";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "Dal 2007 a Tradate, Domus Tua è l'agenzia immobiliare indipendente nata dalla visione di Raffaela Rizza. Professionalità, innovazione e integrità al servizio delle persone.",
};

export default function ChiSiamoPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Chi siamo"
          title={
            <>
              Persone prima
              <br />
              <span className="text-red-soft">degli immobili.</span>
            </>
          }
          subcopy="Dietro ogni casa c'è una storia. Dietro ogni percorso Domus Tua c'è un team che ascolta, guida e accompagna, dalla prima telefonata fino alla firma."
          image="/images/hero_01_attico_travi_salotto.jpg"
          alt="Attico luminoso con travi a vista"
          primary={{ label: "Conosciamoci", href: "#contatti" }}
          secondary={{ label: "Il team", href: "#chi-siamo" }}
        />

        {/* Storia */}
        <section className="bg-paper">
          <div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-line">
                  <Image
                    src="/images/reali/open-domus-teresa.jpg"
                    alt="Raffaela Rizza con una cliente nella sede Domus Tua di Tradate"
                    fill
                    sizes="(max-width: 1024px) 100vw, 560px"
                    className="object-cover object-center"
                  />
                </div>
              </Reveal>
              <Reveal delay={100}>
                <span className="eyebrow">La nostra storia</span>
                <h2 className="mt-5 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink balance sm:text-[3rem]">
                  Tutto è nato nel {site.since}, a Tradate.
                </h2>
                <div className="mt-6 flex flex-col gap-4 text-[1.02rem] leading-relaxed text-stone">
                  <p>
                    Domus Tua nasce dalla visione di Raffaela Rizza: un’agenzia immobiliare
                    indipendente dove la compravendita non è una transazione, ma un passaggio
                    importante nella vita delle persone.
                  </p>
                  <p>
                    In oltre quindici anni abbiamo costruito un metodo che unisce cura, documenti,
                    marketing e tecnologia. Restando però fedeli a ciò che conta di più: l’ascolto e
                    la fiducia.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <Highlights
          tone="cream"
          eyebrow="I nostri valori"
          title="Tre parole che non sono slogan, ma pratica quotidiana."
          items={[
            {
              title: "Professionalità",
              copy: "Competenza, metodo e rigore in ogni fase, dalla valutazione al rogito.",
            },
            {
              title: "Innovazione",
              copy: "Rendering, video, marketing e strumenti digitali al servizio del risultato.",
            },
            {
              title: "Integrità",
              copy: "Trasparenza totale e rispetto delle persone, sempre. Anche quando è più difficile.",
            },
          ]}
        />

        <Stats />
        <Team />
        <div className="bg-cream-deep">
          <SectionDivider tone="cream-deep" />
        </div>
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
