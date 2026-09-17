// Il registro delle firme di capitolo: A20 di Alberto (13 set., «Fedeltà
// letterale»): due capitoli della home non condividono ease, tempo o innesco.
// Soglie di D18.
//
// Com'è fatto oggi: una voce per ognuno dei 17 capitoli della home, nella
// tabella di spec §3.1, più il tuffo delle 11 PageHero ("page-dive"). Il tuffo
// ripete la coppia dell'hero, ed è dichiarato in spec §5.1.
// - chapters.test.ts applica D18 alle 17 voci.
// - `curve` porta le cifre di ogni CustomEase: il test costruisce la curva da
//   lì anche prima che il consumatore la registri in gsap.ts (spec §2.6).
// - useCorridor legge qui lo scrub dei corridoi (`scrubOf`).
// - `el` e le stringhe di `st` descrivono l'innesco scritto nel componente.
//   chapters.test.ts le confronta col codice dei nastri di oggi (nastro e
//   stelle); la rotaia riceve scrub ed ease da Team.tsx, e gesti-coda.test.ts
//   li confronta con la voce `team`.
// - Gli id sono chiavi del registro, non id del DOM: la ricerca è `ricerca`
//   (la section è #cerca), come la legge il commit 9.
// Nessun import: lo leggono i test in Node e i componenti client.

export const HOME_ORDER = [
  "hero",
  "posizionamento",
  "ricerca",
  "storia",
  "recensioni",
  "voci",
  "paths",
  "method",
  "finestra",
  "doc",
  "servizi",
  "costi",
  "testimonianza",
  "social",
  "team",
  "contatti",
  "cartolina",
] as const;

export type HomeChapterId = (typeof HOME_ORDER)[number];
export type ChapterId = HomeChapterId | "page-dive";
/** I corridoi costruiti da useCorridor; nastro, stelle e rotaia hanno meccaniche loro. */
export type CorridorId = "hero" | "finestra" | "cartolina" | "page-dive";

export type Time = { scrub: number | true } | { dur: number; delay: number; stagger?: number };
export type Trigger =
  | { st: [start: string, end: string]; el: string }
  | { io: { rootMargin: string; threshold: number } };
export type Signature = { ease: string; curve?: string; time: Time; trigger: Trigger };
export type Chapter = {
  id: ChapterId;
  gesture: string;
  signature: Signature;
  secondary?: Array<{ ease: string; curve?: string; note: string }>;
  frozen?: string[];
};

const DT_IN = "0.5,0,0.75,0";
const DT_EASE = "0.25,0.1,0.25,1";
const DT_IN_OUT = "0.75,0,0.25,1";
const DOMUS_IN_OUT = "M0,0 C0.66,0 0.22,1 1,1";
const DT_RAIL = "0.5,0,0.5,1";
const DT_CARTOLINA = "0.45,0,0.15,1";

export const chapters: Record<ChapterId, Chapter> = {
  hero: {
    id: "hero",
    gesture: "tuffo: testo e foto salgono a due velocità, foto 1→2",
    signature: {
      ease: "dtIn",
      curve: DT_IN,
      time: { scrub: true },
      trigger: { el: "#top", st: ["top ${stickTop}px", "bottom bottom"] },
    },
    secondary: [{ ease: "dtEase", curve: DT_EASE, note: "salita di foto, testo e firma, da 0 a 0,6" }],
  },
  posizionamento: {
    id: "posizionamento",
    gesture: "foglio a bordo dritto sopra lo sticky, parole che si allontanano in x",
    signature: {
      ease: "none",
      time: { scrub: 0.8 },
      trigger: { el: "[data-hero-cover] h2", st: ["top bottom", "center top"] },
    },
  },
  ricerca: {
    id: "ricerca",
    gesture: "aggancio del pannello: opacità .02→1, scala .75→1, origine 50% 50%",
    signature: {
      ease: "circ.out",
      time: { scrub: 0.35 },
      trigger: { el: "[data-dock]", st: ["top 95%", "top 55%"] },
    },
  },
  storia: {
    id: "storia",
    gesture: "nastro orizzontale (invariato)",
    signature: {
      ease: "dtHorScroll",
      curve: "0.25,0,0.75,1",
      time: { scrub: 0.25 },
      trigger: { el: "#storia", st: ["2.5% top", "97.5% bottom"] },
    },
    secondary: [
      { ease: "none", note: "gradini, scrub 0,25" },
      { ease: "dtOut", curve: "0.25,1,0.5,1", note: "sipario 1,6 s con scala 1,15→1" },
    ],
  },
  recensioni: {
    id: "recensioni",
    gesture: "film delle cinque stelle (invariato, A12)",
    signature: {
      ease: "power4.inOut",
      time: { scrub: 0.6 },
      trigger: { el: ".dt-starrev_runway", st: ["top 55%", "bottom bottom"] },
    },
    frozen: ["none", "power2.inOut", "power2.in", "power2.out", "power3.out", "power1.inOut", "sine.inOut"],
  },
  voci: {
    id: "voci",
    gesture: "carosello da destra, tessere a parallelogramma",
    signature: {
      ease: "domus.inOut",
      curve: DOMUS_IN_OUT,
      time: { dur: 1.0, delay: 0, stagger: 0.15 },
      trigger: { io: { rootMargin: "0px 0px -30% 0px", threshold: 0 } },
    },
    secondary: [
      { ease: "domus.inOut", curve: DOMUS_IN_OUT, note: "uscita 0,6 s; ul xPercent 25→0 in 1,0 s al primo ingresso" },
    ],
  },
  paths: {
    id: "paths",
    gesture: "colonne in controfase ±10% con sosta al centro",
    signature: {
      ease: "dtSosta",
      curve: "M0,0 C0.25,0.45 0.3,0.5 0.5,0.5 C0.7,0.5 0.75,0.55 1,1",
      time: { scrub: 0.5 },
      trigger: { el: "[data-paths-row]", st: ["top 125%", "bottom -25%"] },
    },
  },
  method: {
    id: "method",
    gesture: "tendina a verso alternato sulle foto degli atti",
    signature: {
      ease: "power4.out",
      time: { dur: 2.4, delay: 0.8 },
      trigger: { io: { rootMargin: "0px 0px -10% 0px", threshold: 0 } },
    },
    secondary: [{ ease: "power4.in", note: "uscita 0,4 s" }],
  },
  finestra: {
    id: "finestra",
    gesture: "finestra: otturatore, montanti, scala 1,84, stage .75→1",
    signature: {
      ease: "dtInOut",
      curve: DT_IN_OUT,
      time: { scrub: 0.15 },
      trigger: { el: ".dt-od_area", st: ["top bottom", "+=300%"] },
    },
    secondary: [
      { ease: "none", note: "otturatore e montanti" },
      { ease: "dtInOut", curve: DT_IN_OUT, note: "sotto 1024 otturatore a tempo 1,3 s, poi 0,2 s none" },
    ],
  },
  doc: {
    id: "doc",
    gesture: "righe che si tirano, poi la spina",
    signature: {
      ease: "power1.out",
      time: { dur: 0.8, delay: 0.2, stagger: 0.08 },
      trigger: { io: { rootMargin: "0px 0px -40% 0px", threshold: 0 } },
    },
    secondary: [
      { ease: "power1.out", note: "spina 1,12 s" },
      { ease: "circ.in", note: "uscita 0,5 s" },
    ],
  },
  servizi: {
    id: "servizi",
    gesture: "zoom d'ingresso 1,15→1, origine 50% 100%",
    signature: {
      ease: "sine.out",
      time: { scrub: 1.0 },
      trigger: { el: "#servizi [data-zoom-box]", st: ["top bottom", "bottom bottom"] },
    },
  },
  costi: {
    id: "costi",
    gesture: "l'acqua sale: clip dal basso e loop in vista",
    signature: {
      ease: "expo.out",
      time: { dur: 1.8, delay: 0 },
      trigger: { io: { rootMargin: "0px 0px -20% 0px", threshold: 0 } },
    },
    secondary: [{ ease: "sine.in", note: "uscita 0,7 s" }],
  },
  testimonianza: {
    id: "testimonianza",
    gesture: "la foto affonda dentro la cornice ferma",
    signature: {
      ease: "dtAffonda",
      curve: "0.5,0,0.8,0.45",
      time: { scrub: 1.2 },
      trigger: { el: "[data-sink-frame]", st: ["bottom bottom", "bottom top"] },
    },
  },
  social: {
    id: "social",
    gesture: "il titolo si congeda: scala 1→1,12 e opacità 1→0, origine 0% 100%",
    signature: {
      ease: "expo.in",
      time: { scrub: 1.3 },
      trigger: { el: "blocco eyebrow e titolo di Social", st: ["center center", "bottom top"] },
    },
  },
  team: {
    id: "team",
    gesture: "rotaia orizzontale e pan",
    signature: {
      ease: "dtRail",
      curve: DT_RAIL,
      time: { scrub: 0.7 },
      trigger: { el: ".dt-railway", st: ["top ${top}px", "bottom ${top + rail.offsetHeight}px"] },
    },
    secondary: [{ ease: "dtRail", curve: DT_RAIL, note: "pan ±4%" }],
  },
  contatti: {
    id: "contatti",
    gesture: "la colonna del modulo resta indietro",
    signature: {
      ease: "power1.in",
      time: { scrub: 1.1 },
      trigger: { el: "griglia di #contatti", st: ["top 70%", "bottom 30%"] },
    },
  },
  cartolina: {
    id: "cartolina",
    gesture: "cartolina: la banda si ritira in inset(8% 22%), il footer sale e cresce",
    signature: {
      ease: "dtCartolina",
      curve: DT_CARTOLINA,
      time: { scrub: 0.9 },
      trigger: { el: '[data-corridor="cartolina"] → footer', st: ["top top", "clamp(top 40%)"] },
    },
    secondary: [{ ease: "dtCartolina", curve: DT_CARTOLINA, note: "footer scale .75→1, opacity 0→1, origine 50% 0%" }],
  },
  "page-dive": {
    id: "page-dive",
    gesture: "tuffo delle 11 PageHero: la coppia dell'hero, dichiarata (spec §5.1)",
    signature: {
      ease: "dtIn",
      curve: DT_IN,
      time: { scrub: true },
      trigger: { el: '[data-corridor="page-dive"]', st: ["top top", "bottom bottom"] },
    },
    secondary: [{ ease: "dtEase", curve: DT_EASE, note: "salita del testo e della banda, da 0 a 0,6" }],
  },
};

/** Lo scrub di un capitolo in scrub; lancia sui capitoli a tempo. */
export function scrubOf(id: ChapterId): number | true {
  const time = chapters[id].signature.time;
  if (!("scrub" in time)) throw new Error(`chapters.ts: ${id} è a tempo, non ha scrub`);
  return time.scrub;
}
