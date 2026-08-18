import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Pinyon_Script } from "next/font/google";
import "./globals.css";
import { jsonLdScript, organizationJsonLd, webSiteJsonLd, siteUrl } from "./lib/site";
import { defaultLocale, type Locale } from "./lib/i18n/dictionaries";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import PreviewBadge from "./components/PreviewBadge";
import CookieConsent from "./components/CookieConsent";
import AssistantMount from "./components/AssistantMount";
import MobileActionBar from "./components/MobileActionBar";
import SiteAnalytics from "./components/SiteAnalytics";
import SmoothScroll from "./components/motion/SmoothScroll";
import SurfaceFlow from "./components/motion/SurfaceFlow";
import { ChromeMount } from "./components/motion/ChromeMount";
import PreloaderShell from "./components/motion/PreloaderShell";
import Preloader from "./components/motion/Preloader";
import { INTRO_KEY, PRE_FAILSAFE_MS } from "./lib/motion/intro-constants";
import { getDemoStatus, demoChecklist } from "./lib/demoStatus";

// Anti-flash del preloader: marca <html data-preloader> PRIMA del primo paint,
// solo alla prima visita di sessione e senza reduced-motion.
//
// UN SOLO MONTAGGIO, A OGNI LARGHEZZA (onda «parità mobile 2», 2026-08-17).
// Qui c'era scritto che sul telefono l'intro era «un altro montaggio, non lo
// stesso più veloce (1,7 s contro 4,63 s)» e che il failsafe mobile era 1,8 s
// «cioè quanto dura l'intro stessa». La baseline di Fase 0 (docs/mobile-parity-2.md
// §5.3) ha misurato che sotto CPU ×4 e Slow-4G quel montaggio non suonava
// affatto: il chunk `ssr:false` arrivava DOPO il failsafe, il sipario cadeva
// muto e l'LCP della home era il banner cookie che aspettava quel chunk. Poi
// la misura di Fase 1 (CPU ×4 + Slow-4G, 390) ha visto che anche con l'atto I
// in CSS il JS della home atterra a 8-12 s: porta e tuffo, ancora GSAP, non
// suonavano mai sul telefono lento. Ora (opzione D, docs/mobile-parity-2.md
// §8.5):
//   • IL FILM INTERO — atto I (lockup, sagoma, marchio, payoff), linea di
//     carica, porta ad arco, tuffo, congedo, anelli, autohide — è markup reso
//     dal SERVER (<PreloaderShell/> qui sotto) animato da @keyframes CSS
//     (globals.css) che partono al primo paint, deterministiche, senza
//     aspettare nessun chunk (le custom property della maschera sono
//     registrate con @property: è ciò che le rende interpolabili);
//   • Preloader.tsx è importato STATICAMENTE (non più dynamic ssr:false): il
//     suo codice viaggia col bundle del layout; rende null e al mount legge
//     l'orologio CSS, mette i timer di handoff (INTRO_T.dive) e chiusura
//     (INTRO_MS), gestisce lo skip, e guida con GSAP SOLO in ripiego (browser
//     senza @property, keyframe mai partite: `html[data-pre-gsap]`) — 4,63 s,
//     uguali su telefono e desktop (INTRO_T in lib/motion/intro-constants.ts);
//   • senza JS l'attributo non esiste mai → overlay display:none (globals.css).
//
// IL FAILSAFE È UNO, ED È DERIVATO: `PRE_FAILSAFE_MS` (INTRO_MS + 600 = 5,23 s)
// da lib/motion/intro-constants.ts, interpolato qui sotto. Sta DOPO la fine del
// film — non deve mai tagliare un'intro CSS legittima, che ora suona intera
// anche senza JS — e dopo l'autohide CSS (INTRO_MS + 100: prima l'overlay
// sfuma, poi cade l'attributo e con lui overflow:hidden). È un setTimeout: su
// un thread bloccato dall'idratazione scatta più tardi, accettato — la pagina
// sotto è già visibile. Se il JS arriva prima lo cancella (Preloader.tsx) e
// chiude lui a INTRO_MS; se arriva dopo, `__dtPreArmed` gli dice che il
// sipario era previsto e già ritirato, e lui spara l'handoff senza replicare
// l'intro (mobile-parity §5.3). La rete riarmata negli abort di Preloader.tsx
// è di nuovo lo stesso numero, e il test app/lib/__tests__/intro-clocks.test.ts
// pretende che restino uguali.
// `__dtPreT0` è l'istante in cui l'attributo è stato messo: è l'orologio di
// riserva di Preloader e HeroCinematic se `getAnimations()` non c'è.
// `data-locale` (dal cookie dt_locale, default it — stesso contratto di
// LocaleProvider) serve alla CSS per mostrare il payoff nella lingua giusta
// fra le cinque varianti che la shell rende: niente cookies() nel layout, o
// tutte le rotte diventerebbero dinamiche.
//
// Il banner cookie viaggia sullo stesso meccanismo, e per una ragione misurata:
// era l'elemento LCP della home. Montandosi solo all'idratazione dipingeva a
// 5,6s su rete lenta — 5,2 dei quali di puro "render delay", contro 453ms di
// TTFB. Non arrivava tardi: ESISTEVA tardi. Ora il markup è nell'HTML e questo
// script decide prima del paint se mostrarlo, esattamente come per il sipario.
// Non si mostra sotto il sipario: lì sposterebbe il focus su "Accetta" mentre
// è coperto (Invio per saltare l'intro accetterebbe i cookie alla cieca), e ci
// pensa CookieConsent a metterlo al handoff. `pre` è vero → niente
// `data-consent` pre-paint → il banner arriva su INTRO_EVENT. Conseguenza da
// sapere: sulla PRIMA visita l'elemento LCP non è più il banner.
// Il deep-link con ancora (/#contatti) esce di scena QUI e non più a
// idratazione avvenuta: la coreografia dell'arco presuppone la pagina in cima
// e combatterebbe lo scroll all'ancora, quindi l'intro non parte comunque —
// ma decidendolo prima del paint si risparmiano anche il primo fotogramma
// (che altrimenti lampeggerebbe espresso per tutto il tempo dell'idratazione),
// l'overflow:hidden inutile e i byte della sagoma. Il "budget intro" della
// sessione si segna speso, che è ciò che faceva `finish(true)` dal componente:
// stesso contratto, deciso prima.
// La SAGOMA si precarica da qui, e solo se l'intro suona: nella shell l'<img> è
// `loading="lazy"` perché la shell sta nell'HTML di OGNI visita (anche di
// ritorno, display:none) e un img eager la scaricherebbe sempre — ma lazy vuol
// dire fuori dal preload scanner, e sul desktop a 1,6 Mbps la sagoma «saltava
// dentro» a ~2 s (pellicola 1440, 2026-08-18). Due <link rel=preload as=image>
// con `media` (mobile ≤767.98 / desktop ≥768: la stessa soglia del <source>
// della shell) appesi al <head> prima del paint: sulla prima visita partono
// col documento, sulle visite di ritorno non esistono. `type=image/webp` così
// chi non legge il webp non lo scarica per niente.
const preloaderBootScript = `try{var h=document.documentElement;var lc=/(^|; )dt_locale=(it|en|fr|de|es)(;|$)/.exec(document.cookie);h.setAttribute("data-locale",lc?lc[2]:"it");var m=matchMedia("(prefers-reduced-motion: no-preference)").matches;var deep=!!location.hash;if(deep){try{sessionStorage.setItem("${INTRO_KEY}","1")}catch(e){}}var pre=!deep&&m&&!sessionStorage.getItem("${INTRO_KEY}");if(pre){h.setAttribute("data-preloader","");window.__dtPreArmed=1;window.__dtPreT0=performance.now();var lk=function(u,q){var l=document.createElement("link");l.rel="preload";l.as="image";l.type="image/webp";l.href=u;l.media=q;l.setAttribute("fetchpriority","high");document.head.appendChild(l)};lk("/media/raffaela-sagoma-m.webp","(max-width: 767.98px)");lk("/media/raffaela-sagoma.webp","(min-width: 768px)");window.__dtPreFailsafe=setTimeout(function(){try{sessionStorage.setItem("${INTRO_KEY}","1")}catch(e){}h.removeAttribute("data-preloader")},${PRE_FAILSAFE_MS})}if(m){h.setAttribute("data-hero-rest",pre?"intro":"");h.setAttribute("data-hero-intro",pre?"intro":"")}if(!pre&&!/(^|; )dt_consent=(accepted|rejected)(;|$)/.test(document.cookie)){h.setAttribute("data-consent","")}}catch(e){}`;
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
// Il sito come entità + la sua ricerca interna. Nodo distinto dall'organizzazione, che
// referenzia via @id: un grafo con due nodi collegati, non due dichiarazioni scollegate.
const webSite = webSiteJsonLd();

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
        {/* IL SIPARIO, RESO DAL SERVER — il film intero, non più il solo fondo.
            Fino al 2026-08-17 qui c'era un pannello espresso vuoto
            (`.dt-preloader-boot`) e il lockup arrivava col chunk dinamico,
            «quando la rete voleva» — cioè, misurato, dopo il failsafe. Ora il
            markup di PreloaderShell è nel primo HTML: la CSS lo anima da
            subito e fino in fondo (globals.css «Preloader»: atto I, linea,
            porta, tuffo), Preloader.tsx orchestra handoff, skip e chiusura
            sull'orologio CSS. Compare solo sotto `html[data-preloader]` (messo
            dallo script qui sopra, che sta PRIMA nel body: le animazioni CSS
            partono già armate) e senza attributo è display:none: senza JS,
            con reduced-motion, alla seconda visita non esiste. */}
        <PreloaderShell />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(webSite) }}
        />
        <div className="grain" aria-hidden />
        <SmoothScroll />
        {/* La superficie continua: si accende solo dove ci sono almeno due
            tappe `data-tone` (cioè in home), altrove non fa nulla. */}
        <SurfaceFlow />
        {/* L'orchestratore dell'intro (timer di handoff e chiusura, skip,
            ripiego GSAP): importato STATICAMENTE, così il suo codice viaggia
            col bundle del layout invece che in un chunk che atterra dopo
            l'idratazione (la causa dell'intro muta in laboratorio, audit
            §5.3). Rende null: nessun markup, solo effetti; non legge
            window nel render, quindi nessun mismatch. Sta fuori da
            LocaleProvider (deve esserci prima di tutto) e prima di #main. */}
        <Preloader />
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
