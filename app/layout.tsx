import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

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
        <div className="grain" aria-hidden />
        <div className="scroll-progress" aria-hidden />
        {children}
      </body>
    </html>
  );
}
