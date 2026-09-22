// Il registro delle firme di capitolo: A20 di Alberto (13 set., «Fedeltà
// letterale»): due capitoli della home non condividono ease, tempo o innesco.
// Soglie di D18.
//
// Com'è fatto oggi: una voce per ognuno dei 17 capitoli della home, nella
// tabella di spec §3.1. Le pagine interne non hanno più un capitolo: il tuffo
// delle 11 PageHero ("page-dive", spec §5.1) e i due capitoli di pagina di A28
// ("ingresso" su /vendi, "soglia" su /acquista, commit R) sono morti con A38 e
// A41 (20 set. 2026): la testa di era è ferma, sticky, senza corridoio.
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
export type ChapterId = HomeChapterId;
/** I corridoi costruiti da useCorridor (dal 22 set., A49, la sola cartolina: il tuffo dell'hero è morto); i nastri (storia e, da A57, la finestra), le stelle e la rotaia hanno meccaniche loro. */
export type CorridorId = "cartolina";

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

const DT_IN_OUT = "0.75,0,0.25,1";
const DOMUS_IN_OUT = "M0,0 C0.66,0 0.22,1 1,1";
const DT_RAIL = "0.5,0,0.5,1";
const DT_CARTOLINA = "0.45,0,0.15,1";

export const chapters: Record<ChapterId, Chapter> = {
  // A49/A71 (22 set. 2026, sera): l'hero è la foto alta in flusso, senza corridoio né tuffo (il
  // tuffo dtIn/dtEase di A18-A23 è morto). Il suo gesto di scroll è l'USCITA: la foto si ritira nella
  // cornice della cartolina (ChiusuraFoto, A53), lo stesso motivo delle teste di era e della coda della
  // finestra (A68). La firma è quindi quella della cartolina — dtCartolina, scrub 0,9 — per volontà di
  // Alberto («si chiudesse con l'animazione, come qui», A53; «come nelle altre foto lunga alta», A68):
  // D18 non vale fra i due (D-A49-6, chapters.test.ts `MOTIVO_COMUNE`); l'innesco è diverso (lo strato
  // della foto in home). Il rito delle lettere (ruoli title/accent) resta un tratto secondario.
  hero: {
    id: "hero",
    gesture: "la foto alta in flusso; le lettere entrano coi ruoli quando sono in scena; all'uscita la foto si ritira in inset(8% 22%) (A49, A53)",
    signature: {
      ease: "dtCartolina",
      curve: DT_CARTOLINA,
      time: { scrub: 0.9 },
      trigger: { el: "#top [data-testa-strato]", st: ["top+=${fineSopra} top", "top+=${foto} 10%"] },
    },
    secondary: [{ ease: "dtOut", curve: "0.25,1,0.5,1", note: "il rito delle lettere: ruoli title (lockup, H1) e accent (firma), 1,2 s, all'handoff o alla prima entrata in scena" }],
  },
  posizionamento: {
    id: "posizionamento",
    gesture: "le parole del titolo si allontanano in x (il foglio sopra lo sticky è morto con A49)",
    signature: {
      ease: "none",
      time: { scrub: 0.8 },
      trigger: { el: "#posizionamento h2", st: ["top bottom", "center top"] },
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
  // A57/A58 (22 set. 2026, sera): il nastro della finestra. La firma (ease, scrub) resta quella
  // del capitolo per D18; il gesto è quello di `storia` (HorizonScroller con `lead`, `ease` e
  // `scrub` per prop): la facciata sale lineare dentro lo schermo, poi il track scorre con dtInOut.
  finestra: {
    id: "finestra",
    gesture: "nastro: la facciata sale a schermo intero, poi claim e liste scorrono di lato (A57, A58)",
    signature: {
      ease: "dtInOut",
      curve: DT_IN_OUT,
      time: { scrub: 0.15 },
      trigger: { el: "#open-domus", st: ["top+=salita top", "top+=salita+corsa top"] },
    },
    secondary: [
      { ease: "none", note: "la salita della facciata prima del nastro e la coda della piscina dopo (A65, A67), lineari, scrub 0,15" },
      { ease: "dtOut", curve: "0.25,1,0.5,1", note: "sipario del video e della soglia 1,6 s con scala 1,15→1 (il gesto del nastro)" },
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
      // A59: il foglio delle foto (DomusDocProtocol): la foto del pilastro attivo entra a tendina
      // con la scala 1,08→1 e la cornice prende la sua altezza in 0,8 volte il tempo.
      { ease: "dtOut", curve: "0.25,1,0.5,1", note: "sfoglio 1,1 s: tendina dal basso (dall'alto risalendo), scala 1,08→1, cornice all'altezza del sorgente" },
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
  /* A35 e A42 di Alberto (19-20 set.), qualita/a35/direttive-video-entrata.md: davanti alla
     cartolina sta l'entrata alla Lusion. Il video parte nello slot 16:9 a destra del titolo e
     lungo 100svh cresce piegandosi come un foglio fino allo schermo intero (lastra.ts,
     useLastra.ts); comincia 65svh prima dell'aggancio dello sticky (`start` come funzione
     sull'altezza della testa in flusso); pianerottolo 20svh; poi la cartolina di A19-A20 e il
     footer, sulla stessa timeline (252svh; Congedo.tsx). Il tratto dell'entrata è lineare, un
     `secondary` `none` che chapters.test.ts salta nel confronto delle curve (D18); la
     distensione del foglio a scroll fermo è un gsap.to fuori dalla timeline, in dtCartolina. */
  cartolina: {
    id: "cartolina",
    gesture:
      "l'entrata alla Lusion: dallo slot a destra del titolo il video cresce piegandosi fino allo schermo intero, poi la cartolina: si ritira in inset(8% 22%), il footer sale e cresce",
    signature: {
      ease: "dtCartolina",
      curve: DT_CARTOLINA,
      time: { scrub: 0.9 },
      trigger: { el: '[data-corridor="cartolina"] → footer', st: ["top+=${testa − 65svh} top", "clamp(top 40%)"] },
    },
    secondary: [
      { ease: "none", note: "entrata: e 0→1 lineare su 100svh (A35, A42)" },
      { ease: "dtCartolina", curve: DT_CARTOLINA, note: "footer scale .75→1, opacity 0→1, origine 50% 0%" },
    ],
  },
};

/** Lo scrub di un capitolo in scrub; lancia sui capitoli a tempo. */
export function scrubOf(id: ChapterId): number | true {
  const time = chapters[id].signature.time;
  if (!("scrub" in time)) throw new Error(`chapters.ts: ${id} è a tempo, non ha scrub`);
  return time.scrub;
}
