<!-- impeccable:product-schema 1 -->

# Domus Tua Immobiliare — Product Context

## Platform

web

## Users

Famiglie della provincia di Varese (Tradate e comuni limitrofi) che devono
vendere o comprare casa — spesso per la prima volta o dopo molti anni.
Arrivano dal passaparola, da Google (4.9/5, 531 recensioni) e dai social
video-driven del brand. Cercano rassicurazione, chiarezza sui passaggi e una
persona di fiducia, non un portale. Età mista, molti su mobile.

## Product Purpose

Sito vetrina + lead generation dell'agenzia: raccontare il Metodo Domus Tua,
dare prova sociale (recensioni, video, Open Domus), mostrare gli immobili dal
feed RealSmart e convertire in contatti (form lead, WhatsApp, telefono).

## Positioning

"Vendere casa, senza stress. Acquistare casa, con sicurezza." Agenzia
indipendente founder-led (Raffaela Rizza, dal 2007), tra le più recensite
della provincia di Varese. Differenzianti proprietari: Metodo Domus Tua,
Open Domus (format di visita), Domus D.O.C. (protocollo documenti), racconto
video ("ci vedi prima ancora di conoscerci"). Persone prima degli immobili.

## Operating Context

Next.js 16 App Router + React 19 + Tailwind v4, hosting Vercel, pagine
editoriali statiche + ISR RealSmart (12 min). i18n client-side 5 lingue
(it default, SEO solo IT). Motion layer GSAP 3.15 + ScrollTrigger + Lenis ridotto a
quattro primitive (`Reveal`, `TextLines`, `Parallax`, `HorizontalRail`) dal
redesign «rivista bianca» del 2026-09-10 (riferimento pinnato dalla cliente:
immobiliaregoldengoal.it). Widget terzi isolati (Trustindex, IG, YouTube
facade al click).

## Capabilities and Constraints

- Performance: LCP < 2.5s mobile, CLS 0; una sola immagine priority per
  pagina; animare solo transform/opacity/clip-path; reduced-motion = sito
  completo e statico; nessuna nuova libreria di animazione oltre GSAP+Lenis
  (OGL ~30kB ammessa come progressive enhancement, Fase WebGL).
- SEO: testo sempre nell'HTML iniziale; stati nascosti solo via JS; metadata,
  JSON-LD e canonical intoccabili.
- Non toccare: API routes, lib/realsmart, form lead (window.open sincrono),
  i18n, logica BeforeAfter/PropertyCard/Reviews.

## Brand Commitments

- Nome: Domus Tua Immobiliare (mai genericizzare Open Domus, Domus D.O.C.,
  Metodo Domus Tua, il Segno Domus).
- Voce: empatica, raffinata, entusiasta, tecnologica, sicura — mai gergo
  legale, promesse indimostrabili, freddezza corporate o hard-selling.
  Nessun riferimento ad AI nei testi.
- Palette: rosso #d20a0a (un accento per vista) + neutri caldi carta/crema
  (paper/cream/cream-deep) + ink/graphite/stone + darks espresso/wine.
  DIVIETI: niente oro, niente blu, mai nero pieno, niente estetica SaaS,
  niente gradienti viola-blu, niente dark-tech, niente Inter.
- Font: Playfair Display (didone display unica di tutto il sito, la stessa
  del lockup hero/preloader; Fraunces ritirato, ago 2026) + Plus Jakarta Sans
  (UI) + Pinyon Script (il corsivo rosso: la firma nel lockup e una
  parola-ornamento per capitolo).
- Logo ufficiale PNG: non ridisegnare, non animare con morph/draw.
- Motion (dal 2026-09-10): tre gesti soli — righe che salgono, fade-in,
  parallasse leggera — più la rotaia orizzontale del team e il monogramma
  che ruota (orario) nel badge dell'header; niente sezioni
  pinnate, niente transizioni fra le pagine, niente cursore custom. Il
  preloader resta (film ad arco, 4,6 s). Il sito deve restare bello ANCHE FERMO.
- Forma (dal 2026-09-10, direttiva cliente): NIENTE curve (raggi a zero
  tranne le icone tonde), NIENTE card, NIENTE superfici scure fuori dal
  preloader, NIENTE fiori o ornamenti, NIENTE vignettature o veli sulle foto,
  NESSUN testo sotto i 16 px. Un solo fondo avorio (#f9f5ef), titoli
  maiuscoli in vw/vh, paragrafi grandi e leggeri, media squadrati a tutta
  larghezza, un corsivo rosso per capitolo.
- Riferimento pinnato dalla cliente: https://www.immobiliaregoldengoal.it/
  (pulito, professionale, scritte grandi, foto e video grandi, spazi).
  Anti-riferimenti: template SaaS, purple-blue gradients, dark-tech, Inter
  ovunque, e il vecchio stile curvo/smussato a card con cupole e fiori.
- Scritte "Domus Tua": nel font del logo, dietro il token `--font-brand`
  (da ripuntare quando arriva il logo nuovo, non ancora consegnato).

## Evidence on Hand

- Numeri reali: 4.9/5 su 531 recensioni Google (Trustindex, giu 2026),
  dal 2007. Nessuna metrica senza fonte in pagina: il conteggio video ("440+") e le stat
  numeriche della home sono stati rimossi perché non verificabili.
- Foto reali in `public/images/reali/` (founder, team, Open Domus, immobili);
  demo rendering in `public/images/` (da sostituire col feed).
- Video YouTube reali cablati in `app/lib/site.ts`; widget Trustindex reale.
- Dati societari verificati in `app/lib/site.ts` (P.IVA, REA, sede, orari).
- NON fabbricare: premi, numeri di vendite, recensioni, loghi partner.

## Product Principles

1. Fiducia prima dello spettacolo: ogni animazione ha una ragione narrativa.
2. Un solo momento firma per schermata; il resto è disciplina.
3. Il movimento è un di più: tutto funziona e resta bello anche fermo.
4. Warm editorial, non SaaS: carta, serif, rosso usato col contagocce.
5. Mobile è metà del pubblico: niente scroll-hijack, versioni semplificate.

## Accessibility & Inclusion

prefers-reduced-motion rispettato ovunque (contenuto completo, statico);
focus visibile brand; focus trap nel menu; slider BeforeAfter con tastiera e
ARIA; contrasto su superfici scure con cream/red-soft; testo mai nascosto
senza JS (fallback scripting:none); tap target generosi su mobile.
