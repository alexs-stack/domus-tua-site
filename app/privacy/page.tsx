import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import { site } from "../lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Informativa sul trattamento dei dati personali di Domus Tua srl ai sensi del Regolamento UE 2016/679 (GDPR).",
};

// ⚠️ ATTENZIONE: testo placeholder redatto per finalità di impaginazione.
// PRIMA DELLA PUBBLICAZIONE deve essere verificato e validato da un legale /
// DPO, in particolare finalità, basi giuridiche e tempi di conservazione.

type Block = {
  title: string;
  body: string[];
};

const blocks: Block[] = [
  {
    title: "1. Titolare del trattamento",
    body: [
      `Il titolare del trattamento dei dati è ${site.legal}, con sede in ${site.address.street}, ${site.address.city} (${site.address.province}), P.IVA ${site.vat}.`,
      `Per ogni richiesta relativa ai tuoi dati personali puoi scrivere a ${site.email.label} o telefonare al ${site.phone.label}.`,
    ],
  },
  {
    title: "2. Dati che raccogliamo",
    body: [
      "Raccogliamo i dati che ci fornisci volontariamente tramite il form di contatto e i canali di messaggistica del sito: nome e cognome, numero di telefono, eventuale indirizzo email e le informazioni sull'immobile o sulla ricerca che desideri condividere con noi.",
      "Possiamo inoltre raccogliere dati tecnici di navigazione (ad esempio indirizzo IP e cookie), trattati come descritto nella Cookie Policy.",
    ],
  },
  {
    title: "3. Finalità del trattamento",
    body: [
      "Utilizziamo i tuoi dati per rispondere alle tue richieste, fornirti una valutazione o una consulenza immobiliare, gestire il rapporto di collaborazione e, ove necessario, adempiere agli obblighi di legge.",
      "Con il tuo consenso, potremmo contattarti per comunicazioni informative e commerciali relative ai nostri servizi.",
    ],
  },
  {
    title: "4. Base giuridica",
    body: [
      "Il trattamento si fonda sull'esecuzione di misure precontrattuali e contrattuali richieste dall'interessato (art. 6.1.b GDPR), sul consenso per le finalità di marketing (art. 6.1.a GDPR) e sull'adempimento di obblighi di legge (art. 6.1.c GDPR).",
    ],
  },
  {
    title: "5. Conservazione dei dati",
    body: [
      "Conserviamo i dati per il tempo strettamente necessario alle finalità per cui sono stati raccolti e nel rispetto dei termini di legge applicabili. I dati trattati per finalità di marketing sono conservati fino alla revoca del consenso.",
    ],
  },
  {
    title: "6. Comunicazione dei dati",
    body: [
      "I tuoi dati possono essere trattati da personale autorizzato e da fornitori di servizi che agiscono come responsabili del trattamento (ad esempio servizi di hosting, gestionali e strumenti di comunicazione). Non diffondiamo i tuoi dati a terzi per finalità proprie senza il tuo consenso.",
    ],
  },
  {
    title: "7. I tuoi diritti",
    body: [
      "In qualità di interessato hai diritto di accedere ai tuoi dati, chiederne la rettifica o la cancellazione, limitarne od opporti al trattamento, richiederne la portabilità e revocare in qualsiasi momento il consenso prestato.",
      `Per esercitare questi diritti puoi contattarci a ${site.email.label}. Hai inoltre diritto di proporre reclamo all'Autorità Garante per la protezione dei dati personali.`,
    ],
  },
  {
    title: "8. Contatti",
    body: [
      `${site.legal} — ${site.address.street}, ${site.address.city} (${site.address.province}). Telefono ${site.phone.label} · Email ${site.email.label}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Note legali"
          title={
            <>
              Privacy
              <br />
              <span className="text-red-soft">Policy.</span>
            </>
          }
          subcopy="Come Domus Tua raccoglie, utilizza e protegge i tuoi dati personali. La tua fiducia merita trasparenza, in ogni passaggio."
          image="/images/hero_01_attico_travi_salotto.jpg"
          alt="Salotto luminoso di un attico con travi a vista"
          primary={{ label: "Contattaci", href: "/contatti" }}
          secondary={{ label: "Cookie Policy", href: "/cookie" }}
        />

        <section className="bg-paper">
          <div className="mx-auto max-w-[820px] px-5 py-24 sm:px-8 sm:py-32">
            <p className="text-[0.82rem] uppercase tracking-[0.16em] text-stone">
              Ultimo aggiornamento: luglio 2026
            </p>

            {/* ⚠️ Avviso interno: testo da validare con un legale prima del go-live. */}
            <div className="mt-6 rounded-2xl border border-line bg-cream-deep px-5 py-4 text-sm leading-relaxed text-graphite">
              Questa informativa è redatta ai sensi del Regolamento UE 2016/679 (GDPR). I
              contenuti sono forniti a titolo indicativo e devono essere verificati da un
              consulente legale prima della pubblicazione.
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
