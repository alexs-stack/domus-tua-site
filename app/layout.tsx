import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { site, siteUrl } from "./lib/site";
import { defaultLocale, type Locale } from "./lib/i18n/dictionaries";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import PreviewBadge from "./components/PreviewBadge";
import CookieConsent from "./components/CookieConsent";
import AssistantMount from "./components/AssistantMount";
import MobileActionBar from "./components/MobileActionBar";
import SmoothScroll from "./components/motion/SmoothScroll";
import Preloader from "./components/motion/Preloader";
import PageTransition from "./components/motion/PageTransition";
import Cursor from "./components/motion/Cursor";
import { getDemoStatus, demoChecklist } from "./lib/demoStatus";

// Anti-flash del preloader: marca <html data-preloader> PRIMA del primo paint,
// solo alla prima visita di sessione, senza reduced-motion e SOLO desktop —
// su mobile l'intro costerebbe l'LCP della prima visita (l'overlay ritarda il
// primo paint utile) e la filosofia del layer è "mobile semplificato".
// Senza JS l'attributo non esiste mai → overlay display:none (globals.css).
// Failsafe a 8s: se il bundle non idrata mai, l'attributo va rimosso comunque.
const preloaderBootScript = `try{if(!sessionStorage.getItem("dt-intro-seen")&&matchMedia("(prefers-reduced-motion: no-preference)").matches&&matchMedia("(min-width: 768px)").matches){document.documentElement.setAttribute("data-preloader","");setTimeout(function(){document.documentElement.removeAttribute("data-preloader")},8000)}}catch(e){}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf7f1",
};

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  // opsz = ottica per dimensione (titoli grandi), SOFT = terminali morbidi (calore),
  // italic = corsivo vero (accenti editoriali) invece del finto slant sintetico.
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
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
  alternates: {
    canonical: "/",
  },
  keywords: [
    "agenzia immobiliare Tradate",
    "vendere casa Tradate",
    "comprare casa Varese",
    "valutazione immobile",
    "Domus Tua",
    "Open Domus",
    "home staging",
  ],
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
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
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
      className={`${fraunces.variable} ${jakarta.variable} antialiased`}
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="grain" aria-hidden />
        <SmoothScroll />
        <Preloader />
        <LocaleProvider>
          {/* Dentro LocaleProvider: sipario e cursore usano stringhe tradotte
              (useDict). Il posizionamento è fixed, quindi la posizione nel
              tree non cambia nulla di visivo. */}
          <PageTransition />
          <Cursor />
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
