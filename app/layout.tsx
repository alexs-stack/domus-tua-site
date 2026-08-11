import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Pinyon_Script } from "next/font/google";
import "./globals.css";
import { jsonLdScript, site, siteUrl } from "./lib/site";
import { defaultLocale, type Locale } from "./lib/i18n/dictionaries";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import PreviewBadge from "./components/PreviewBadge";
import CookieConsent from "./components/CookieConsent";
import AssistantMount from "./components/AssistantMount";
import MobileActionBar from "./components/MobileActionBar";
import SmoothScroll from "./components/motion/SmoothScroll";
import SurfaceFlow from "./components/motion/SurfaceFlow";
import { ChromeMount, PreloaderMount } from "./components/motion/ChromeMount";
import { getDemoStatus, demoChecklist } from "./lib/demoStatus";

// Anti-flash del preloader: marca <html data-preloader> PRIMA del primo paint,
// solo alla prima visita di sessione, senza reduced-motion e SOLO desktop —
// su mobile l'intro costerebbe l'LCP della prima visita (l'overlay ritarda il
// primo paint utile) e la filosofia del layer è "mobile semplificato".
// Senza JS l'attributo non esiste mai → overlay display:none (globals.css).
// Failsafe a 2,5s: se il bundle non idrata mai, l'attributo va rimosso comunque. Era 8s, e
// su una connessione lenta teneva il sipario (e quindi l'LCP) fino a 8 secondi buoni.
// Il banner cookie viaggia sullo stesso meccanismo, e per una ragione misurata:
// era l'elemento LCP della home. Montandosi solo all'idratazione dipingeva a
// 5,6s su rete lenta — 5,2 dei quali di puro "render delay", contro 453ms di
// TTFB. Non arrivava tardi: ESISTEVA tardi. Ora il markup è nell'HTML e questo
// script decide prima del paint se mostrarlo, esattamente come per il sipario.
// Non si mostra sotto il sipario: lì sposterebbe il focus su "Accetta" mentre
// è coperto (Invio per saltare l'intro accetterebbe i cookie alla cieca), e ci
// pensa CookieConsent a metterlo al handoff.
const preloaderBootScript = `try{var h=document.documentElement;var m=matchMedia("(prefers-reduced-motion: no-preference)").matches;var pre=!sessionStorage.getItem("dt-intro-seen")&&m&&matchMedia("(min-width: 768px)").matches;if(pre){h.setAttribute("data-preloader","");window.__dtPreFailsafe=setTimeout(function(){h.removeAttribute("data-preloader")},2500)}if(m){h.setAttribute("data-hero-rest","");h.setAttribute("data-hero-intro","")}if(!pre&&!/(^|; )dt_consent=(accepted|rejected)(;|$)/.test(document.cookie)){h.setAttribute("data-consent","")}}catch(e){}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf7f1",
};

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Didone di marca (richiesta cliente, rif. era-residence.com): nata per il
// lockup di preloader/hero, oggi è IL serif display di tutto il sito
// (--font-display e --font-hero puntano entrambi qui; Fraunces è stato ritirato).
// Lo script calligrafico resta l'accento. Dietro variabili: se il cliente
// licenzia Ambroise François / Sloop Script via Adobe Fonts, lo swap è solo qui.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  // Corsivo vero (accenti editoriali) invece del finto slant sintetico.
  style: ["normal", "italic"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// Skip-link (chrome accessibile). Reso lato server con la lingua di default; l’etichetta
// esiste in tutte e cinque le lingue per parità i18n e per un futuro rendering per-locale.
const skipToContent: Record<Locale, string> = {
  it: "Salta al contenuto",
  en: "Skip to content",
  fr: "Aller au contenu",
  de: "Zum Inhalt springen",
  es: "Saltar al contenido",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza",
    template: "%s · Domus Tua Immobiliare",
  },
  description:
    "Dal 2007 a Tradate, Domus Tua accompagna venditori e acquirenti con un metodo fatto di valutazione, documenti verificati, marketing, Open Domus e assistenza fino al rogito. 4.9/5 da oltre 500 recensioni.",
  // NESSUN canonical qui, ed è deliberato. Un canonical nel layout è un valore EREDITATO da
  // ogni rotta che non lo sovrascrive: le 12 rotte editoriali lo fanno, /privacy e /cookie no
  // — e si ritrovavano a dichiarare la home come propria versione canonica. Un canonical
  // sbagliato è peggio di nessun canonical (Google lo tratta come segnale forte di
  // consolidamento), e la trappola sarebbe scattata su ogni rotta aggiunta da qui in avanti.
  // La home lo dichiara per conto suo in app/page.tsx.
  //
  // Niente `keywords`: Google non lo usa da oltre quindici anni. Come `changeFrequency` nel
  // sitemap, era codice morto che suggerisce a chi legge il repo una leva che non esiste.
  // Le icone (favicon + apple-touch) sono generate dalle file-convention app/icon.tsx e
  // app/apple-icon.tsx (monogramma di marca via next/og): niente metadata manuale qui.
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Domus Tua Immobiliare",
    title: "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza",
    description:
      "Un metodo completo per vendere e acquistare casa con cura, trasparenza e assistenza fino al rogito. Tradate (VA), dal 2007.",
    // og:image = card di marca 1200x630 generata in app/opengraph-image.tsx (file convention).
  },
};

// Dati strutturati per SEO locale (Google). Dati societari/orari/geo VERIFICATI
// (domustua.com + Registro Imprese). aggregateRating volutamente omesso (policy Google).
// L'@id è il perno del grafo: senza, ogni pagina che nomina l'agenzia crea un nodo nuovo e
// scollegato. Le schede immobile ci puntano già (provider/seller → #organization) e ci
// punteranno le pagine persona e servizio: va messo PRIMA di aggiungere altri schema,
// perché farlo dopo significa tornare su tutte le rotte.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${siteUrl}/#organization`,
  name: "Domus Tua Immobiliare",
  legalName: site.legal,
  vatID: site.vat,
  foundingDate: String(site.since),
  url: siteUrl,
  image: `${siteUrl}/images/reali/raffaela-ritratto.jpg`,
  telephone: site.phone.href.replace("tel:", ""),
  email: site.email.label,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: "21049",
    addressLocality: "Tradate",
    addressRegion: "VA",
    addressCountry: "IT",
  },
  geo: { "@type": "GeoCoordinates", latitude: 45.7114282, longitude: 8.905019 },
  areaServed: "Tradate e provincia di Varese",
  openingHours: site.openingHours,
  sameAs: [
    site.social.instagram.href,
    site.social.facebook.href,
    site.social.tiktok.href,
    site.social.youtube.href,
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Calcolato lato server: legge anche env server-only (es. SHEETS_WEBHOOK_URL) senza
  // esporne i valori. Il badge di anteprima riceve solo la checklist derivata (booleani).
  const checklist = demoChecklist(getDemoStatus());
  return (
    <html
      lang="it"
      // data-scroll-behavior: Next 16 non forza più lo scroll istantaneo nelle
      // navigazioni SPA se il CSS ha scroll-behavior smooth — l'attributo
      // ripristina il comportamento corretto (doc: upgrading/version-16).
      data-scroll-behavior="smooth"
      // L'inline script qui sotto può marcare <html data-preloader> prima
      // dell'idratazione: il mismatch sull'attributo è voluto.
      suppressHydrationWarning
      className={`${jakarta.variable} ${playfair.variable} ${pinyon.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-paper text-ink">
        <script dangerouslySetInnerHTML={{ __html: preloaderBootScript }} />
        <a
          href="#main"
          className="sr-only rounded-full bg-ink px-5 py-3 font-medium text-cream shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]"
        >
          {skipToContent[defaultLocale]}
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
        />
        <div className="grain" aria-hidden />
        <SmoothScroll />
        {/* La superficie continua: si accende solo dove ci sono almeno due
            tappe `data-tone` (cioè in home), altrove non fa nulla. */}
        <SurfaceFlow />
        <PreloaderMount />
        <LocaleProvider>
          {/* Dentro LocaleProvider: sipario e cursore usano stringhe tradotte
              (useDict). Il posizionamento è fixed, quindi la posizione nel
              tree non cambia nulla di visivo. */}
          <ChromeMount />
          <div id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
            {children}
          </div>
          <PreviewBadge checklist={checklist} />
          <CookieConsent />
          <AssistantMount />
          <MobileActionBar />
        </LocaleProvider>
      </body>
    </html>
  );
}
