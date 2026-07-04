import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { site } from "./lib/site";
import { defaultLocale, type Locale } from "./lib/i18n/dictionaries";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import PreviewBadge from "./components/PreviewBadge";
import CookieConsent from "./components/CookieConsent";
import AssistantMount from "./components/AssistantMount";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf7f1",
};

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.domustua.com";

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
  // Favicon ufficiale del cliente (da depositare in /public/favicon.ico — vedi docs/logo-assets.md).
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon.ico" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Domus Tua Immobiliare",
    title: "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza",
    description:
      "Un metodo completo per vendere e acquistare casa con cura, trasparenza e assistenza fino al rogito. Tradate (VA), dal 2007.",
    // OG provvisorio (foto reale). Ideale: /public/og-image.png dedicato 1200x630. Vedi docs.
    images: [
      {
        url: "/images/hero_01_attico_travi_salotto.jpg",
        width: 1920,
        height: 1067,
        alt: "Domus Tua Immobiliare — Tradate",
      },
    ],
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
  telephone: "+390331844898",
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
  return (
    <html
      lang="it"
      className={`${fraunces.variable} ${jakarta.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-paper text-ink">
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
        <div className="scroll-progress" aria-hidden />
        <LocaleProvider>
          <div id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
            {children}
          </div>
          <PreviewBadge />
          <CookieConsent />
          <AssistantMount />
        </LocaleProvider>
      </body>
    </html>
  );
}
