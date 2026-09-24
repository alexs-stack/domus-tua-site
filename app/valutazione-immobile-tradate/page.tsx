import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import { jsonLdScript, site, siteUrl } from "../lib/site";
import ValutazioneContent from "./ValutazioneContent";

// ⚠️ L'UNICA PAGINA DEL SITO IN CUI «GRATUITA» PUÒ COMPARIRE — e solo qui dentro.
//
// §3.2 del Documento finale di sintesi: la gratuità resta, cambia la parola. Nel corpo del
// sito si dice «il primo incontro è senza impegno e senza costi», perché «gratis» è
// registro da volantino e suggerisce un calcolatore automatico, cioè svaluta il servizio
// che si vuole far percepire come professionale.
//
// Ma `valutazione immobile gratuita` è la ricerca a più alta intenzione commerciale del
// settore, e title, meta description e indirizzo sono esattamente il posto in cui quella
// parola serve: lì vive la ricerca, e nessuno legge una URL come una promessa.
//
// Lo stesso vale per lo slug, che è la URL più "da parola chiave" di tutto il sito. È
// deliberato ed è limitato a questa pagina: l'§8 mette in guardia dal riempire il sito di
// parole chiave, e questa è l'eccezione dichiarata, non l'inizio di un'abitudine.
const title = "Valutazione immobile gratuita a Tradate";
const description =
  "Come funziona la valutazione Domus Tua: primo confronto senza impegno, poi sopralluogo, analisi documentale e relazione motivata. Il primo incontro è senza impegno e senza costi.";
const pageUrl = `${siteUrl}/valutazione-immobile-tradate`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/valutazione-immobile-tradate" },
  openGraph: { title, description },
};

/**
 * Il servizio come dato strutturato (punto 26: fra i tipi mancanti c'era `Service`).
 *
 * Descrive ciò che la pagina dichiara e nulla di più: due livelli, area servita, nessun
 * prezzo. `offers` con `price: 0` sarebbe la tentazione ovvia ed è sbagliata — la
 * valutazione non è un prodotto gratuito, è il primo passo di un mandato che si paga a
 * vendita conclusa. Dichiararla "0" la rimetterebbe esattamente nella casella "esca" da
 * cui §3.2 la vuole tirare fuori.
 */
const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${pageUrl}#service`,
  name: "Valutazione immobiliare",
  serviceType: "Valutazione immobiliare",
  provider: { "@id": `${siteUrl}/#organization` },
  areaServed: ["Tradate", "Provincia di Varese", "Alta provincia di Como"],
  url: pageUrl,
  description,
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Valutazione in due livelli",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Primo confronto",
        description:
          "Conversazione senza sopralluogo e senza impegno: ordine di grandezza e verifiche consigliate prima della vendita.",
      },
      {
        "@type": "OfferCatalog",
        name: "Valutazione professionale",
        description:
          "Sopralluogo, analisi documentale (catasto, urbanistica, titoli e planimetrie) e relazione motivata con il prezzo consigliato.",
      },
    ],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: site.name, item: siteUrl },
    { "@type": "ListItem", position: 2, name: title, item: pageUrl },
  ],
};

export default function ValutazionePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <Header />
      <ValutazioneContent />
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
