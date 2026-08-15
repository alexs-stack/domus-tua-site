import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Pinyon_Script } from "next/font/google";
import "./globals.css";
import { jsonLdScript, organizationJsonLd, siteUrl } from "./lib/site";
import { defaultLocale, type Locale } from "./lib/i18n/dictionaries";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import PreviewBadge from "./components/PreviewBadge";
import CookieConsent from "./components/CookieConsent";
import AssistantMount from "./components/AssistantMount";
import MobileActionBar from "./components/MobileActionBar";
import SiteAnalytics from "./components/SiteAnalytics";
import SmoothScroll from "./components/motion/SmoothScroll";
import SurfaceFlow from "./components/motion/SurfaceFlow";
import { ChromeMount, PreloaderMount } from "./components/motion/ChromeMount";
import { getDemoStatus, demoChecklist } from "./lib/demoStatus";

// Anti-flash del preloader: marca <html data-preloader> PRIMA del primo paint,
// solo alla prima visita di sessione e senza reduced-motion.
//
// LA SOGLIA 768 NON C'È PIÙ (fase 3 della parità mobile, 2026-08-11).
// Qui c'era scritto che su mobile l'intro «costerebbe l'LCP della prima visita»
// e che la filosofia del layer è «mobile semplificato». La misura dice altro:
// il telefono scaricava GIÀ il chunk del preloader (22,5 KB) e la sagoma webp
// (79.000 byte) e montava GIÀ 119 nodi a display:none, per un'intro che non
// vedeva mai. Portarla sul telefono non aggiunge quel costo: lo mette a frutto.
// Quel che aggiunge è tempo di thread principale e il trattenimento della
// pagina — ed è per questo che sul telefono l'intro è un ALTRO montaggio, non
// lo stesso più veloce (1,7s contro 4,63s: vedi Preloader.tsx).
// Senza JS l'attributo non esiste mai → overlay display:none (globals.css).
//
// I DUE FAILSAFE, DERIVATI DALLA STESSA REGOLA: "quanto siamo disposti a
// tenere la pagina se il bundle non idrata mai". Sul telefono è 1,8s, cioè
// quanto dura l'intro stessa: tenere un sipario muto più a lungo dell'intro
// vera non ha senso. Su desktop resta 2,5s (era 8s, e su rete lenta teneva
// l'LCP in ostaggio per otto secondi buoni). L'autohide CSS di globals.css è
// lo stesso numero + 0,5s di margine, e la rete riarmata negli abort di
// Preloader.tsx è di nuovo lo stesso numero: tre orologi, una sola regola.
// `__dtPreArmed` resta sul window a dire "il sipario era previsto": è come il
// chunk, se atterra dopo che il failsafe è scattato, capisce di dover
// rimettere in moto Lenis invece di uscire in silenzio (mobile-parity §5.3).
//
// Il banner cookie viaggia sullo stesso meccanismo, e per una ragione misurata:
// era l'elemento LCP della home. Montandosi solo all'idratazione dipingeva a
// 5,6s su rete lenta — 5,2 dei quali di puro "render delay", contro 453ms di
// TTFB. Non arrivava tardi: ESISTEVA tardi. Ora il markup è nell'HTML e questo
// script decide prima del paint se mostrarlo, esattamente come per il sipario.
// Non si mostra sotto il sipario: lì sposterebbe il focus su "Accetta" mentre
// è coperto (Invio per saltare l'intro accetterebbe i cookie alla cieca), e ci
// pensa CookieConsent a metterlo al handoff. La relazione regge invariata ora
// che anche il telefono suona il sipario: `pre` è vero → niente `data-consent`
// pre-paint → il banner arriva su INTRO_EVENT. Conseguenza da sapere: sulla
// PRIMA visita mobile l'elemento LCP non è più il banner.
// Il deep-link con ancora (/#contatti) esce di scena QUI e non più a
// idratazione avvenuta: la coreografia dell'arco presuppone la pagina in cima
// e combatterebbe lo scroll all'ancora, quindi l'intro non parte comunque —
// ma decidendolo prima del paint si risparmiano anche il primo fotogramma
// (che altrimenti lampeggerebbe espresso per tutto il tempo dell'idratazione),
// l'overflow:hidden inutile e i 79 KB della sagoma. Il "budget intro" della
// sessione si segna speso, che è ciò che faceva `finish(true)` dal componente:
// stesso contratto, deciso prima.
const preloaderBootScript = `try{var h=document.documentElement;var m=matchMedia("(prefers-reduced-motion: no-preference)").matches;var deep=!!location.hash;if(deep){try{sessionStorage.setItem("dt-intro-seen","1")}catch(e){}}var pre=!deep&&m&&!sessionStorage.getItem("dt-intro-seen");if(pre){h.setAttribute("data-preloader","");window.__dtPreArmed=1;window.__dtPreFailsafe=setTimeout(function(){try{sessionStorage.setItem("dt-intro-seen","1")}catch(e){}h.removeAttribute("data-preloader")},matchMedia("(max-width: 767.98px)").matches?1800:2500)}if(m){h.setAttribute("data-hero-rest","");h.setAttribute("data-hero-intro","")}if(!pre&&!/(^|; )dt_consent=(accepted|rejected)(;|$)/.test(document.cookie)){h.setAttribute("data-consent","")}}catch(e){}`;

// `viewportFit: "cover"` — la riga che rende veri tutti gli `env(safe-area-inset-*)`
// del progetto (parità mobile, fase 4).
//
// Senza `viewport-fit=cover` il browser tiene la pagina DENTRO l'area sicura e ogni
// `env(safe-area-inset-*)` risolve a zero. Misurato: `bottom = 0px`, `top = 0px`.
// Cioè MobileActionBar, il launcher della chat e la regola del footer in globals.css
// scrivevano `calc(qualcosa + 0px)` da sempre: un'aritmetica che sembrava rispettare
// la barra gesti dell'iPhone e non la rispettava, perché non c'era niente da
// rispettare — la pagina finiva sopra di essa e basta.
//
// Da qui in avanti l'inset è un numero vero (34px su un iPhone col notch, 21 in
// orizzontale) e TUTTO ciò che è ancorato al fondo si alza nello stesso istante.
// Per questo l'attributo non arriva mai da solo: nello stesso commit ogni elemento
// ancorato al bordo è stato ricontato uno per uno.
//   · MobileActionBar   `calc(0.75rem + env(…))`  — l'inset compare UNA volta, i
//     12px sono il margine gemello di `inset-x-3`, non un compenso allo zero: sale
//     e basta, senza raddoppiare.
//   · launcher chat      `calc(5.25rem + env(…))` — 84px è l'altezza della barra
//     azioni più il suo margine; l'inset compare una volta anche qui, quindi i due
//     salgono insieme e la distanza fra loro resta quella disegnata.
//   · pannello chat      `bottom-0` + `padding-bottom: env(…)` — è un foglio a filo
//     del bordo: giusto che il fondo lo tocchi, è il CONTENUTO a doversene stare
//     fuori. Idioma corretto, invariato.
//   · banner cookie      era `bottom-3` SENZA `env()`: l'unico che con l'inset vero
//     sarebbe finito sotto la barra gesti. Corretto in CookieConsent.tsx.
//   · footer `pb-28`     112px di padding contro un ingombro che passa da 64 a 98px:
//     stringe, ma tiene. Non lo tocco (vedi nota in globals.css).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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

// Dati strutturati per SEO locale (schema.org RealEstateAgent). Estratti in
// app/lib/site.ts (organizationJsonLd) per essere verificabili da un test —
// vedi app/lib/__tests__/golive.test.ts. `aggregateRating` resta volutamente
// omesso (policy Google, nessun contenuto recensioni idoneo).
const jsonLd = organizationJsonLd();

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
        {/* IL PRIMO FOTOGRAMMA DEL SIPARIO, RESO DAL SERVER.
            Qui la documentazione dava per assodato che «l'overlay è già montato
            dallo script inline prima dell'idratazione». Non lo è: lo script
            mette un ATTRIBUTO, il markup dell'overlay arriva col chunk dinamico
            (ssr:false). Fra il primo paint e l'atterraggio del chunk si vedeva
            quindi l'hero, e poi calava l'espresso — un salto che su desktop
            dura 150ms e nessuno nota, e che su un telefono in 4G lenta dura un
            secondo pieno. Questo pannello è il fondo e basta: nessuna immagine,
            nessun testo, nessuna richiesta di rete: solo il colore e il
            gradiente che l'overlay vero ha già (`.dt-pre-fondo`, sorgente
            unica in globals.css). Compare solo sotto `html[data-preloader]` e
            sparisce appena il vero overlay prende il timone
            (`html[data-pre-live]`, messo da Preloader.tsx) — altrimenti
            resterebbe visibile DENTRO il buco dell'arco durante il tuffo. */}
        <div className="dt-preloader-boot dt-pre-fondo" aria-hidden />
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
          {/* IL BANNER COOKIE STA PRIMA DI #main, ED È UNA SCELTA DI TASTIERA.
              Era in fondo al body, e ci poteva stare finché rubava il focus
              all'idratazione: chi non vede lo schermo ci finiva dentro comunque.
              Ora non lo ruba più (vedi CookieConsent.tsx), quindi la posizione nel
              documento È l'ordine di tabulazione — e in fondo al body, su una home
              lunga 46 schermate, i tre comandi del consenso sarebbero stati
              l'ultima cosa raggiungibile con il Tab di una pagina intera.
              Qui invece il primo Tab dopo lo skip-link li trova, che è esattamente
              dove stanno per gli occhi. È `position: fixed`: nulla cambia a video,
              e neppure nell'ordine di pittura — sopra ci sono solo `.grain`
              (z-60, ancora prima nel body, quindi resta sotto) e il pannello chat
              (z-60, ancora dopo), che comunque non può aprirsi mentre il banner è
              a schermo perché il launcher si toglie di mezzo. */}
          <CookieConsent />
          <div id="main" tabIndex={-1} className="flex flex-1 flex-col focus:outline-none">
            {children}
          </div>
          <PreviewBadge checklist={checklist} />
          <AssistantMount />
          <MobileActionBar />
          {/* In fondo di proposito: non rende nulla a schermo e non deve competere per
              la banda del primo fotogramma. Vedi SiteAnalytics.tsx per il perché non
              passa dal gate del consenso.

              `VERCEL` è impostata da Vercel su ogni deploy e non esiste altrove: è la
              risposta esatta alla domanda «gli endpoint /_vercel/* esistono qui?». La
              lettura avviene QUI, nel server component, e non dentro il componente client:
              la variante NEXT_PUBLIC_ arriva al browser solo se nella dashboard è rimasta
              attiva l'esposizione automatica delle variabili di sistema, cioè una
              condizione che si può spegnere per sbaglio e che fallirebbe in silenzio. */}
          <SiteAnalytics enabled={Boolean(process.env.VERCEL)} />
        </LocaleProvider>
      </body>
    </html>
  );
}
