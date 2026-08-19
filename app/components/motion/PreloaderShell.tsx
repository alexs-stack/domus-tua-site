// PreloaderShell — il markup dell'INTERA intro, reso dal SERVER.
//
// Perché sta qui e non più in Preloader.tsx (client, chunk in ritardo).
// La baseline di Fase 0 (docs/mobile-parity-2.md §5.3) ha misurato ciò che
// nessuno aveva guardato: sotto CPU ×4 e Slow-4G il chunk del preloader
// atterrava DOPO il failsafe del boot script — il sipario cadeva muto a 1,8 s
// e l'intro non suonava, né a 390 né a 1440. Nessuna scelta A/B «al mount del
// chunk» poteva ripararlo: l'atto I doveva esistere PRIMA del JavaScript.
// Quindi il lockup sta nel primo HTML (opzione C dell'audit, §3.2). Poi la
// misura di Fase 1 (JS della home a 8-12 s sul telefono lento: porta e tuffo
// GSAP mai suonati) ha portato all'opzione D (§8.5): TUTTO il film — atto I,
// linea di carica, porta ad arco, tuffo, congedo, anelli, autohide — è
// @keyframes CSS in globals.css («Preloader»), su questi nodi, e parte
// nell'istante in cui vengono dipinti — con `html[data-preloader]` già messo
// dal boot script inline che sta PRIMA di questo markup nel body.
// Preloader.tsx non rende più niente e non muove più la maschera: al mount
// trova questa shell (`#dt-preloader`), legge quanto tempo è già passato
// sull'orologio CSS, mette i timer di handoff/chiusura e gestisce lo skip;
// GSAP guida solo in ripiego (browser senza @property).
//
// Vincoli, e come sono rispettati:
// - Nessun `cookies()`/`headers()`: renderebbe dinamiche TUTTE le rotte. Il
//   payoff è l'unico testo tradotto → escono TUTTE e cinque le varianti,
//   ciascuna con `data-pre-payoff="xx"`; il boot script mette
//   `html[data-locale=xx]` leggendo il cookie dt_locale (default it) e la CSS
//   mostra solo la variante che combacia. Stesso contratto di LocaleProvider.
// - Stesso markup a OGNI larghezza (nessuna diramazione SSR per viewport, che
//   sarebbe un mismatch di idratazione — e comunque il film è uno solo): le
//   differenze del telefono sono solo CSS (globals.css, blocco ≤767.98).
// - Nascosto quando `html[data-preloader]` manca (`.dt-preloader{display:none}`
//   in globals.css): reduced-motion e no-JS non mettono mai l'attributo, quindi
//   lì non esiste. Nessuno stato «nascosto» resta nascosto senza JS: senza JS
//   l'attributo non c'è e la pagina è completa.
// - `aria-hidden`: è decorativo; e un h2 prima dell'h1 di pagina sporcherebbe
//   l'outline, per questo il lockup è in <div>/<span>, non in heading.
// - Ogni lettera porta `--i`, l'indice del proprio gruppo, per lo stagger CSS
//   (`calc(base + var(--i) * stagger)`): il titolo conta di seguito attraverso
//   «Domus» e «Tua» perché il desktop faceva UN solo tween su tutti i chars
//   («Tua» parte 5×0,075 s dopo «Domus»); la firma, i caps e il payoff hanno
//   il loro contatore, come i quattro fromTo che c'erano prima.
import type { CSSProperties } from "react";
import { MarkBadge } from "./MarkBadge";

// Il payoff è l'unico testo tradotto del lockup (il marchio è uguale ovunque).
// L'ordine e le chiavi sono quelle di lib/i18n/dictionaries (it è il default).
export const PAYOFF: Record<string, [string, string]> = {
  it: ["Vendere senza stress.", "Acquistare con sicurezza."],
  en: ["Sell stress-free.", "Buy with confidence."],
  fr: ["Vendre sans stress.", "Acheter en sécurité."],
  de: ["Verkaufen ohne Stress.", "Kaufen mit Sicherheit."],
  es: ["Vender sin estrés.", "Comprar con seguridad."],
};

/** L'indice di stagger come custom property: è la CSS a fare i conti. */
const idx = (i: number) => ({ "--i": i }) as CSSProperties;

// Split per lettere (stessa tecnica del riferimento, resa in SSR): ogni char
// è animabile singolarmente. La riga vive dentro una maschera overflow-hidden
// per il titolo; la firma no (ruota su X e slitta, non deve essere tagliata).
// `offset` è da dove riparte il contatore `--i` (vedi sopra: «Tua» da 5).
function PreChars({
  text,
  script = false,
  offset = 0,
}: {
  text: string;
  script?: boolean;
  offset?: number;
}) {
  const attr = script ? { "data-pre-schar": "" } : { "data-pre-char": "" };
  let n = offset;
  const chars = text.split("").map((ch, i) =>
    ch === " " ? (
      " "
    ) : (
      <span key={i} {...attr} style={idx(n++)} className="dt-pre-char inline-block">
        {ch}
      </span>
    )
  );
  if (script)
    return (
      <span data-pre-sline className="inline-block">
        {chars}
      </span>
    );
  return (
    <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
      <span data-pre-line className="block">
        {chars}
      </span>
    </span>
  );
}

const CAP = "text-[0.68rem] font-semibold uppercase tracking-[0.55em] text-cream/60";

export default function PreloaderShell() {
  return (
    <div id="dt-preloader" aria-hidden className="dt-preloader">
      <div data-pre-panel className="absolute inset-0 overflow-hidden bg-espresso">
        {/* Profondità calda, mai nero piatto (stesse regole di .bg-ink).
            Il gradiente sta in globals.css (`.dt-pre-fondo`): è il primo colore
            che il visitatore vede, e la sorgente dev'essere una. */}
        <div className="dt-pre-fondo absolute inset-0" />
        <div className="grain !absolute !z-0" aria-hidden />

        {/* La "sagoma" di Raffaela: il RITAGLIO con canale alpha della stessa
            foto dell'hero (stesso canvas 2000×1415, fornito dal cliente), con
            la stessa geometria object-cover dell'immagine sotto — silhouette
            pulita sul fondo del preloader, e quando l'arco la attraversa
            sagoma e foto coincidono pixel su pixel: la stanza "torna".
            Entra in dissolvenza da 0,15 s (CSS: `dt-pre-in-fade`). */}
        <div data-pre-figure className="absolute inset-0">
          {/* WebP, non PNG: stesso canvas e stesso canale alpha, 79 KB invece
              di 809. Il preloader è la PRIMA cosa che scarica un visitatore
              nuovo, in concorrenza con la foto dell'hero sulla stessa banda.
              Sotto i 768 la variante `-m` (1000×708, stesso aspect, ~26 KB):
              il telefono ne mostra una striscia centrale a object-cover, e il
              ricampionamento a metà larghezza non si vede — legge 2 dell'onda
              «parità mobile 2», l'`_ld` di Lusion. Stesso aspect = stessa
              geometria object-cover = coincide ancora con la foto sotto.
              Il PNG resta come fallback per i browser senza WebP.
              Resta un <img> e non next/image: qui serve il controllo pixel-su-
              pixel con la foto sotto, non il resize automatico.
              `loading="lazy"`, ed è la riga che tiene in piedi il vecchio
              patto: prima il markup dell'overlay nasceva solo se l'intro doveva
              suonare, proprio per non scaricare la sagoma a ogni visita di
              ritorno (il browser scarica un <img> eager anche dentro un
              antenato display:none). Ora il markup è nell'HTML sempre, ma un
              <img> lazy senza box — l'overlay è display:none senza
              `data-preloader` — non parte mai; con l'attributo è in viewport
              dal primo layout e parte subito. Zero byte per chi torna, come
              prima. */}
          <picture>
            <source
              media="(max-width: 767.98px)"
              srcSet="/media/raffaela-sagoma-m.webp"
              type="image/webp"
            />
            <source srcSet="/media/raffaela-sagoma.webp" type="image/webp" />
            <img
              src="/media/raffaela-sagoma.png"
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 70%" }}
            />
          </picture>
        </div>

        {/* Anelli eco della porta (solo variante arco, vedi globals.css):
            la maschera li taglia dove c'è il buco, restano i profili. Seguono
            l'arco via transform (`--arch-s`, `--arch-y`), mai via layout. */}
        <div data-pre-arch-echo="2" />
        <div data-pre-arch-echo="1" />

        <div
          data-pre-content
          className="relative flex h-full flex-col items-center justify-between py-10 sm:py-12"
        >
          {/* Alto: il marchio ufficiale (variante per fondo scuro: la "Tua"
              del monogramma resta rossa), con l'anello che gira in CSS
              (`dt-pre-spin`, 6 s, anello e monogramma in versi opposti — lo
              stesso gesto dell'header) — gira anche prima del JS. */}
          <span data-pre-badge className="text-cream/85">
            <MarkBadge className="h-14 w-14" dark />
          </span>

          {/* Centro: lockup al centro; caps in colonna a destra da 768 in su
              (a sinistra c'è la sagoma di Raffaela: la colonna la bilancia),
              in riga sotto la firma sul telefono — presenti a ogni larghezza,
              cambia solo dove stanno. */}
          <div className="relative flex w-full flex-col items-center justify-center px-[6vw] md:flex-row">
            <div className="relative text-center">
              <div className="font-hero text-[11vh] font-medium leading-[0.95] tracking-[-0.01em] text-cream">
                <PreChars text="Domus" />
                <PreChars text="Tua" offset={5} />
              </div>
              <span className="pointer-events-none absolute -bottom-[0.52em] left-1/2 -translate-x-1/2 whitespace-nowrap font-script text-[5.2vh] leading-none text-red [text-shadow:0_2px_28px_rgba(28,21,18,0.55)]">
                <PreChars text="Raffaela Rizza" script />
              </span>
            </div>
            <span
              data-pre-caps
              className="mt-[11vh] flex flex-row items-center gap-4 md:absolute md:right-[7vw] md:top-1/2 md:mt-0 md:-translate-y-1/2 md:flex-col md:items-start md:gap-3"
            >
              <span data-pre-cap style={idx(0)} className={CAP}>
                Immobiliare
              </span>
              <span data-pre-cap style={idx(1)} className={CAP}>
                dal 2007
              </span>
            </span>
          </div>

          {/* Basso: linea di carica + promessa. La linea NON è un progresso —
              non è mai stata legata a un caricamento vero, malgrado il nome —
              è la scansione dell'attesa (atto II, CSS: `dt-pre-track` con
              `linear()` campionata dalla CustomEase `dtLoader` di gsap.ts;
              GSAP solo in ripiego). Sul telefono è più spessa e più corta
              (globals.css), non assente. */}
          <div data-pre-foot className="flex flex-col items-center">
            <span data-pre-progress className="block h-16 w-px overflow-hidden bg-cream/20 opacity-0">
              <span data-pre-track className="block h-full w-full bg-cream" />
            </span>
            <p className="mt-5 text-center text-[0.82rem] font-medium leading-relaxed text-cream/70">
              {Object.entries(PAYOFF).map(([loc, [p1, p2]]) => (
                <span key={loc} data-pre-payoff={loc}>
                  <span className="block overflow-hidden">
                    <span data-pre-word="1" style={idx(0)} className="block">
                      {p1}
                    </span>
                  </span>
                  <span className="block overflow-hidden">
                    <span data-pre-word="2" style={idx(1)} className="block">
                      {p2}
                    </span>
                  </span>
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
