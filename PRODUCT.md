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
(it default, SEO solo IT). Motion layer GSAP 3.15 + ScrollTrigger + Lenis
(2026-07, richiesta cliente "livello awwwards") con primitive in
`app/components/motion/`. Widget terzi isolati (Trustindex, IG, YouTube
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
  (UI) + Pinyon Script (solo accento calligrafico del lockup).
- Logo ufficiale PNG: non ridisegnare, non animare con morph/draw.
- Motion: caldo e cinematografico, mai tech-demo; un solo signature moment
  per viewport; ease firma "domus"; il sito deve restare bello ANCHE FERMO.
- Anti-riferimenti: template SaaS, purple-blue gradients, dark-tech,
  Inter ovunque.

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
