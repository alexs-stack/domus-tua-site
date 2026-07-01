import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Come Domus Tua srl utilizza i cookie e le tecnologie simili sul proprio sito, e come gestire le tue preferenze.",
};

// ⚠️ ATTENZIONE: testo placeholder redatto per finalità di impaginazione.
// PRIMA DELLA PUBBLICAZIONE deve essere verificato e validato da un legale /
// DPO, in coerenza con i cookie effettivamente installati dal sito e dalle
// piattaforme di terze parti (analytics, social, mappe).

type Block = {
  title: string;
  body: string[];
};

const cookieTypes = [
  {
    label: "Cookie tecnici",
    copy: "Necessari al funzionamento del sito e alla tua navigazione. Non richiedono consenso e non possono essere disattivati.",
  },
  {
    label: "Cookie analitici",
    copy: "Ci aiutano a capire, in forma aggregata, come viene utilizzato il sito per migliorarne i contenuti. Installati solo previo consenso.",
  },
  {
    label: "Cookie di marketing",
    copy: "Consentono di proporti contenuti pertinenti anche su piattaforme di terze parti. Installati solo previo tuo consenso esplicito.",
  },
];

const blocks: Block[] = [
  {
    title: "1. Cosa sono i cookie",
    body: [
      "I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo dell'utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva. Utilizziamo anche tecnologie simili con finalità analoghe.",
    ],
  },
  {
    title: "2. Tipologie di cookie utilizzati",
    body: [
      "Il sito utilizza cookie tecnici, cookie analitici e, previo consenso, cookie di marketing di terze parti. Le principali categorie sono riepilogate nella tabella qui sopra.",
    ],
  },
  {
    title: "3. Gestione del consenso",
    body: [
      "Al primo accesso al sito ti viene mostrato un banner tramite il quale puoi accettare, rifiutare o personalizzare l'uso dei cookie non tecnici. Puoi modificare le tue scelte in qualsiasi momento riaprendo il pannello delle preferenze.",
      "In assenza di consenso vengono installati esclusivamente i cookie tecnici necessari.",
    ],
  },
  {
    title: "4. Cookie di terze parti",
    body: [
      "Alcune funzionalità del sito possono ricorrere a servizi di terze parti (ad esempio strumenti di statistica, mappe o contenuti social) che potrebbero installare propri cookie. Per il dettaglio del trattamento ti invitiamo a consultare le rispettive informative dei fornitori.",
    ],
  },
  {
    title: "5. Come disabilitare i cookie dal browser",
    body: [
      "Puoi gestire o eliminare i cookie anche direttamente dalle impostazioni del tuo browser. La disattivazione dei cookie tecnici potrebbe però compromettere alcune funzionalità del sito.",
    ],
  },
  {
    title: "6. Titolare e contatti",
    body: [
      `Il titolare del trattamento è ${site.legal}, ${site.address.street}, ${site.address.city} (${site.address.province}), P.IVA ${site.vat}.`,
      `Per informazioni sull'uso dei cookie puoi scrivere a ${site.email.label}. Per il trattamento dei dati personali consulta la nostra Privacy Policy.`,
    ],
  },
];

export default function CookiePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Note legali"
          title={
            <>
              Cookie
              <br />
              <span className="text-red-soft">Policy.</span>
            </>
          }
          subcopy="Quali cookie utilizziamo, perché lo facciamo e come puoi gestire in ogni momento le tue preferenze."
          image="/images/hero_01_attico_travi_salotto.jpg"
          alt="Salotto luminoso di un attico con travi a vista"
          primary={{ label: "Contattaci", href: "/contatti" }}
          secondary={{ label: "Privacy Policy", href: "/privacy" }}
        />

        <section className="bg-paper">
          <div className="mx-auto max-w-[820px] px-5 py-24 sm:px-8 sm:py-32">
            <p className="text-[0.82rem] uppercase tracking-[0.16em] text-stone">
              Ultimo aggiornamento: luglio 2026
            </p>

            {/* ⚠️ Avviso interno: testo da validare con un legale prima del go-live. */}
            <div className="mt-6 rounded-2xl border border-line bg-cream-deep px-5 py-4 text-sm leading-relaxed text-graphite">
              Questa policy descrive l’uso dei cookie sul sito. I contenuti sono forniti a
              titolo indicativo e devono essere allineati ai cookie effettivamente installati
              e verificati da un consulente legale prima della pubblicazione.
            </div>

            {/* Tipologie di cookie */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {cookieTypes.map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-line bg-cream p-5"
                >
                  <span className="eyebrow">{c.label}</span>
                  <p className="mt-3 text-sm leading-relaxed text-stone">{c.copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-12">
              {blocks.map((block) => (
                <div key={block.title}>
                  <h2 className="font-display text-2xl font-medium leading-snug tracking-tight text-ink balance sm:text-[1.7rem]">
                    {block.title}
                  </h2>
                  <div className="mt-4 flex flex-col gap-4 text-[1.02rem] leading-relaxed text-stone">
                    {block.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
