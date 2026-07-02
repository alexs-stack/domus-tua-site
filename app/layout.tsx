import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { site } from "./lib/site";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import PreviewBadge from "./components/PreviewBadge";
import CookieConsent from "./components/CookieConsent";

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Domus Tua Immobiliare — Vendere senza stress, acquistare con sicurezza",
    template: "%s · Domus Tua Immobiliare",
  },
  description:
    "Dal 2007 a Tradate, Domus Tua accompagna venditori e acquirenti con un metodo fatto di valutazione, documenti verificati, marketing, Open Domus e assistenza fino al rogito. 4.9/5 da oltre 500 recensioni.",
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

// Dati strutturati per SEO locale (Google). Orari/geo: coordinate reali dal profilo Google;
// gli orari sono da confermare col cliente. aggregateRating volutamente omesso (policy Google).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Domus Tua Immobiliare",
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
  openingHours: ["Mo-Fr 09:00-12:30", "Mo-Fr 15:00-19:00", "Sa 09:00-12:30"],
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
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="grain" aria-hidden />
        <div className="scroll-progress" aria-hidden />
        <LocaleProvider>
          {children}
          <PreviewBadge />
          <CookieConsent />
        </LocaleProvider>
      </body>
    </html>
  );
}
