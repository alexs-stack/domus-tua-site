// IL MOTORE DEI REVEAL (A18 «Coreografia piena» e A20 «Fedeltà letterale» di
// Alberto; D21; spec §2.4). Ogni testo e ogni blocco che entra allo scroll
// passa da qui. Due IntersectionObserver condivisi e nessuno ScrollTrigger:
// in fondo alla home, sotto le corse lunghe, gli start calcolati da
// ScrollTrigger arrivavano sfasati. ScrollTrigger resta agli scrub.
//
//   entry     threshold 0, margine 0: si entra a filo del bordo («top bottom»
//             di era-residence, main.pretty.js:908-917). Il bordo è quello
//             della scatola dipinta: un ctn nascosto sta --dt-ctn-y più giù.
//   exitLine  threshold 0, margine −15 % in basso; nel nastro orizzontale
//             −15 % a destra. Risalendo, un gruppo che scende sotto l'85 %
//             esce e l'uscita si vede. Uscito dall'alto resta com'è.
//
// Com'è fatto:
//   - Un gruppo è un [data-reveal-group]; i membri sono i [data-reveal] che
//     non stanno in un gruppo annidato, compreso il gruppo stesso. Il ritardo
//     di un membro dipende dal suo indice fra i membri dello stesso ruolo
//     (indexByRole, D19), più lo scarto `delay` di Reveal
//     (data-reveal-extra). Replay a ogni passaggio nei due versi (C22).
//   - Ogni ruolo si muove con GSAP sui suoi bersagli (spec §2.2): i [data-c]
//     per title e accent, le .dt-line per lead, il membro stesso per ctn e
//     still. Tween nuovo a ogni passaggio, fromTo con overwrite: true in
//     ingresso, to in uscita; lo stato istantaneo è un gsap.set. Nessuno stato
//     nascosto in CSS: prima del JS, senza JS e con reduced-motion il testo è
//     pieno. Il puntatore lo scrive il motore inline sul membro: none da
//     nascosto, di nuovo attivo all'inizio dell'ingresso.
//   - Letture prima delle scritture (spec §9.3): register() accoda il gruppo e
//     un microtask, dopo il commit di React, legge rettangoli e antenati di
//     tutti i gruppi e poi scrive. gsap.set su un bersaglio nuovo legge una
//     volta lo stile calcolato: è la sola lettura dentro la passata di
//     scritture, misurata da 04-reveal-engine.mjs (dt-reveal-arm-write).
//   - Armamento: gruppo passato → shown; in vista (ramo della piega) → shown,
//     perché il server l'ha già dipinto e nasconderlo lo farebbe sparire sotto
//     gli occhi; sotto o a destra → hidden. Dopo ogni passata, e a ogni
//     cambio d'altezza del body, un refresh di ScrollTrigger (D39): i
//     ScrollTrigger di oggi (TextLines) nascono nell'idratazione, prima che
//     split e altezze misurate dal JS finiscano di crescere il documento, e
//     nessuno li rinfrescava (D38 sugli attrezzi e2e; D39: lo fa il motore).
//     Il refresh parte solo a scroll fermo (refreshWhenStill): un
//     ScrollTrigger.refresh() scrolla a 0 e torna alla posizione registrata,
//     e cancellerebbe lo scroll nativo al frammento di un caricamento con
//     ancora (html { scroll-behavior: smooth }, ~1,5 s) o un fling su touch.
//   - Arrivo al frammento (spec §2.4: «già passati (ancore, scroll
//     ripristinato) → shown»): finché lo scroll nativo a location.hash è in
//     corso le notifiche e gli sweep sono istantanei, così i gruppi che
//     l'arrivo attraversa nascono shown senza animare.
//   - Notifiche (noticeAction): la prima notifica di un osservatore non fa
//     uscire, ma fa entrare; un nascosto già passato o che rientra dal bordo
//     alto diventa shown senza animare; decide() riceve la radice dell'asse.
//   - Declassamento: un gruppo con link, bottoni, summary o campi porta ctn a
//     still (regola del 2026-08-04 sui bersagli nei replay).
//   - Reti: 2.500 ms dall'armamento, per i gruppi che nessuna notifica, sweep o
//     chiamata ha mosso da allora; sweep() su refresh di ScrollTrigger, resize
//     (150 ms), ritorno della scheda e salto di almeno un viewport in un solo
//     evento di scroll. sweep() fa entrare (sopra la linea), mostrare (già
//     passati) e, per un gruppo shown finito interamente sotto il viewport (a
//     destra nel nastro) con un salto che l'IO non ha visto, nascondere senza
//     animare, così ridiscendendo rigioca l'ingresso (C22, D40; spec §2.4,
//     «fuori sotto · shown → out»); la fascia 85-100 % la lascia com'è.
//     focusin → shown subito.
//   - trigger "manual" vale solo sotto [data-corridor][data-on] o
//     [data-set-on]; altrove il gruppo va all'IO. Un manuale hidden che
//     interseca per 2.500 ms di fila entra.
//   - Attesa: l'attributo data-reveal-hold sul gruppo, letto a ogni notifica,
//     a ogni sweep() e nelle reti; un corridoio lo può togliere e rimettere,
//     release() lo toglie e rivaluta il gruppo.
//   - resync(): rilegge i membri (righe nuove di un lead, lingua nuova) e porta
//     allo stato del gruppo, senza animare, i membri nuovi e i bersagli GSAP
//     senza tween; i membri di prima tengono stato e transizione (spec §2.3).
//   - Reduced-motion a pagina aperta: via stati, attributi e data-hero-intro.
//   - Sotto [data-motion-freeze] (/case/[slug], A26 e D32) non arma nulla.
import { gsap, ScrollTrigger, MQ, requestRefresh } from "./gsap";
import { ROLES, demote, restVars, tweenVars, type Role } from "./text-roles";

export type GroupState = "hidden" | "revealing" | "shown" | "hiding";
export type Box = { top: number; left: number; bottom: number; right: number };
export type Hit = Box & { hit: boolean };
export type Dir = "in" | "out";
export type Axis = "x" | "y";
export type Notice = { dir: Dir; instant: boolean };
export type RevealApi = { play(dir: Dir, o?: { instant?: boolean }): void; release(): void };
export type RegisterOptions = { trigger: "io" | "manual"; hold: boolean };

export const NET_MS = 2500;
export const EXIT_LINE = 0.85;
export const CUE_ANCESTOR = "[data-corridor][data-on], [data-set-on]";
export const RIBBON = ".dt-horizon[data-on] .dt-horizon_track";
export const FREEZE = "[data-motion-freeze]";
const HOLD = "data-reveal-hold";
const RESIZE_MS = 150;
/** Tetto all'attesa dell'arrivo al frammento (D39): lo chiude anche se il browser non scrolla. */
const STILL_CAP_MS = 4000;

// ── Logica pura (app/lib/__tests__/reveal-engine.test.ts) ─────────────────

export function decide(e: Hit, x: Hit, root: Box, s: GroupState): Dir | null {
  const below = e.top >= root.bottom * EXIT_LINE || e.left >= root.right * EXIT_LINE; // sotto o a destra della linea d'uscita
  if (s === "hidden" || s === "hiding") return e.hit || x.hit ? "in" : null;
  if ((s === "shown" || s === "revealing") && !x.hit && below) return "out";
  return null; // uscito dall'alto o da sinistra: resta shown
}

export function intersects(r: Box, root: Box): boolean {
  return r.top < root.bottom && r.bottom > root.top && r.left < root.right && r.right > root.left;
}

export function exitRoot(root: Box, axis: Axis): Box {
  return axis === "y" ? { ...root, bottom: root.bottom * EXIT_LINE } : { ...root, right: root.right * EXIT_LINE };
}

/** La radice che decide() riceve: in verticale la linea di destra non esiste, nel nastro quella in basso. */
export function rootFor(axis: Axis, vp: Box): Box {
  return axis === "y" ? { ...vp, right: Number.POSITIVE_INFINITY } : { ...vp, bottom: Number.POSITIVE_INFINITY };
}

export function armState(r: Box, root: Box): "passed" | "fold" | "below" {
  if (r.bottom <= root.top || r.right <= root.left) return "passed";
  return intersects(r, root) ? "fold" : "below";
}

/** Nel viewport ed entrato dal bordo alto (dal sinistro nel nastro). */
export function entersFromTop(r: Box, root: Box, axis: Axis = "y"): boolean {
  return intersects(r, root) && (axis === "y" ? r.top < root.top : r.left < root.left);
}

/**
 * Che cosa fa una notifica dell'IO: decide() con tre regole intorno (D21, Scelte del commit 4).
 * (a) La prima notifica di un osservatore non fa uscire, ma fa entrare.
 * (b) Un nascosto già passato, o che rientra dal bordo alto, diventa shown senza animare.
 * (c) decide() riceve la radice dell'asse, rootFor(axis, vp).
 */
export function noticeAction(first: boolean, s: GroupState, e: Hit, x: Hit, vp: Box, axis: Axis): Notice | null {
  if ((s === "hidden" || s === "hiding") && (armState(e, vp) === "passed" || entersFromTop(e, vp, axis))) {
    return { dir: "in", instant: true };
  }
  const d = decide(e, x, rootFor(axis, vp), s);
  if (d === null || (d === "out" && first)) return null;
  return { dir: d, instant: false };
}

/** Indice di ogni membro fra i membri dello stesso ruolo, nell'ordine del DOM (spec §2.2). */
export function indexByRole(roles: Role[]): number[] {
  const seen = new Map<Role, number>();
  return roles.map((r) => {
    const i = seen.get(r) ?? 0;
    seen.set(r, i + 1);
    return i;
  });
}

/** Lo scarto `delay` di Reveal: data-reveal-extra in ms, restituito in secondi. */
export function extraSeconds(attr: string | null): number {
  const ms = attr === null ? 0 : Number(attr);
  return Number.isFinite(ms) && ms > 0 ? ms / 1000 : 0;
}

export function netAction(s: GroupState, r: Box, root: Box): "in" | "shown" | null {
  if (s !== "hidden") return null;
  if (armState(r, root) === "passed") return "shown";
  return intersects(r, root) ? "in" : null;
}

/**
 * Che cosa fa sweep() con un gruppo (spec §2.4). Un nascosto già passato si mostra, un nascosto
 * sopra la linea d'uscita entra. Un gruppo shown o revealing finito interamente sotto il
 * viewport (a destra nel nastro) esce: dopo un salto di almeno un viewport verso l'alto (Home,
 * barra di scorrimento, ancora) l'IO non vede nessun cambio d'intersezione, e senza questa
 * uscita, istantanea e fuori schermo, ridiscendendo non rigiocherebbe l'ingresso (C22, D40;
 * «fuori sotto · shown → out»). La fascia 85-100 % resta com'è: al refresh un gruppo appena
 * uscito lì non deve rientrare, e uno in vista non deve uscire.
 */
export function sweepAction(s: GroupState, r: Box, root: Box, axis: Axis): "in" | "shown" | "out" | null {
  if (s === "shown" || s === "revealing") {
    const below = r.top >= root.bottom || (axis === "x" && r.left >= root.right);
    return below ? "out" : null;
  }
  if (armState(r, root) === "passed") return "shown";
  return intersects(r, exitRoot(root, axis)) ? "in" : null;
}

export function effectiveTrigger(requested: "io" | "manual", hasCueAncestor: boolean): "io" | "manual" {
  return requested === "manual" && hasCueAncestor ? "manual" : "io";
}

export function manualNetDue(s: GroupState, since: number | null, now: number): boolean {
  return s === "hidden" && since !== null && now - since >= NET_MS;
}

// ── Stato della pagina ────────────────────────────────────────────────────

type Member = { el: HTMLElement; declared: Role; role: Role; i: number; extra: number };
type Group = {
  el: HTMLElement;
  requested: "io" | "manual";
  mode: "io" | "manual";
  axis: Axis;
  state: GroupState;
  members: Member[];
  rect: Box;
  eHit: boolean;
  xHit: boolean;
  primedE: boolean;
  primedX: boolean;
  since: number | null;
  armed: boolean;
  /** Nessuna notifica, rete o chiamata l'ha mosso dopo l'armamento: solo allora vale la rete dei 2.500 ms. */
  untouched: boolean;
  /** Ha avuto un tween: solo allora uno stato istantaneo deve prima ucciderlo (killTweensOf riscorre la timeline globale). */
  live: boolean;
  stopFold: () => void;
  timers: { manual: number; settle: number };
};

const groups = new Map<Element, Group>();
const queue = new Set<Group>();
let io: { entry: IntersectionObserver; x: IntersectionObserver; y: IntersectionObserver } | null = null;
let flushQueued = false;
let resizeTimer = 0;
let jumpRaf = 0;
let lastX = 0;
let lastY = 0;
/** Lo scroll nativo al frammento di un caricamento con ancora è in corso (D39). */
let arriving = false;
let arrivalChecked = false;
let arrivalRaf = 0;
/** Un refresh chiesto a scroll in corso: parte a scrollEnd di ScrollTrigger o al tetto. */
let refreshDue = false;
let stillCap = 0;

const isRole = (v: string | null): v is Role => v !== null && Object.prototype.hasOwnProperty.call(ROLES, v);
const boxOf = (r: DOMRectReadOnly): Box => ({ top: r.top, left: r.left, bottom: r.bottom, right: r.right });
const viewport = (): Box => ({ top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth });
const axisOf = (el: Element): Axis => (el.closest(RIBBON) ? "x" : "y");
const modeOf = (g: Group) => effectiveTrigger(g.requested, g.el.closest(CUE_ANCESTOR) !== null);
const held = (g: Group) => g.el.hasAttribute(HOLD);
const noop = () => {};

function setState(g: Group, s: GroupState): void {
  g.state = s;
  g.el.setAttribute("data-reveal-state", s);
}

/** Legge i membri senza scrivere: il declassamento lo scrive writeRoles() nella passata di scritture. */
function collect(el: HTMLElement): Member[] {
  const candidates = [
    ...(el.matches("[data-reveal]") ? [el] : []),
    ...Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]")).filter((m) => m.closest("[data-reveal-group]") === el),
  ];
  const found: { el: HTMLElement; declared: Role; role: Role }[] = [];
  for (const m of candidates) {
    const declared = m.getAttribute("data-reveal");
    if (!isRole(declared)) continue;
    const role = demote(declared, el);
    found.push({ el: m, declared, role });
  }
  const index = indexByRole(found.map((f) => f.role));
  return found.map((f, k) => ({ ...f, i: index[k], extra: extraSeconds(f.el.getAttribute("data-reveal-extra")) }));
}

function writeRoles(g: Group): void {
  for (const m of g.members) {
    if (m.declared === m.role) continue;
    m.el.setAttribute("data-reveal", m.role);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[reveal] ctn → still: il gruppo contiene un elemento interattivo (spec §2.2)", m.el);
    }
  }
}

/** I bersagli GSAP di un membro: i suoi [data-c] o le sue .dt-line, oppure il membro stesso (ctn, still). */
function targetsOf(m: Member): HTMLElement[] {
  const sel = ROLES[m.role].targets;
  return sel === null ? [m.el] : Array.from(m.el.querySelectorAll<HTMLElement>(sel));
}

/** Il puntatore segue lo stato: via da nascosto, di nuovo attivo dall'inizio dell'ingresso, prima che l'opacità salga. */
function pointer(m: Member, dir: Dir): void {
  m.el.style.pointerEvents = dir === "in" ? "" : "none";
}

/**
 * Una passata (armamento, sweep, rete) raccoglie gli stati istantanei e li scrive in coda, un
 * gsap.set per ruolo e verso: 64 set uno per uno costano 54 ms a 390 con CPU ×4, uno solo su
 * 64 bersagli 10 ms (misurato per spec §9.3); i set-tween a durata zero restano nella timeline
 * globale fino al tick dopo, e un killTweensOf per gruppo li riscorrerebbe tutti.
 */
let batch: Map<string, { role: Role; dir: Dir; targets: HTMLElement[]; kill: HTMLElement[] }> | null = null;

function pass(fn: () => void): void {
  const mine = batch === null;
  if (mine) batch = new Map();
  try {
    fn();
  } finally {
    if (mine && batch) {
      const done = batch;
      batch = null;
      for (const { role, dir, targets, kill } of done.values()) {
        if (kill.length) gsap.killTweensOf(kill);
        gsap.set(targets, restVars(role, dir));
      }
    }
  }
}

/** Bersagli GSAP fermi nello stato di `dir`, senza animare: un gsap.set è istantaneo per costruzione. */
function rest(targets: HTMLElement[], role: Role, dir: Dir, live: boolean): void {
  if (batch) {
    const key = `${role}|${dir}`;
    const b = batch.get(key) ?? { role, dir, targets: [], kill: [] };
    b.targets.push(...targets);
    if (live) b.kill.push(...targets);
    batch.set(key, b);
    return;
  }
  if (live) gsap.killTweensOf(targets);
  gsap.set(targets, restVars(role, dir));
}

/** Che cosa fa una passata (sweep, rete, release) con l'esito di sweepAction() o netAction(). */
function applySweep(g: Group, a: "in" | "shown" | "out", instant: boolean): void {
  if (a === "out") apply(g, "out", true);
  else apply(g, "in", a === "shown" || instant);
}

// ── Scroll in corso e arrivo al frammento (D39) ────────────────────────────

/**
 * Il refresh di D39, consegnato a scroll fermo. ScrollTrigger.refresh() forza _refreshAll:
 * scrollBehavior ad "auto", scroll a 0, misure, ritorno alla posizione registrata; due scroll
 * programmatici che cancellano uno scroll nativo in corso, cioè l'arrivo smooth al frammento
 * (html { scroll-behavior: smooth }, ~1,5 s) o un fling su touch. ScrollTrigger.isScrolling()
 * legge i suoi eventi di scroll sul documento e "scrollEnd" arriva 200 ms dopo l'ultimo: è la
 * stessa attesa dei refresh automatici di ScrollTrigger. Il tetto STILL_CAP_MS chiude solo
 * l'attesa dell'arrivo: il refresh rimandato non parte mai a scroll in corso.
 */
function refreshWhenStill(): void {
  if (!arriving && !ScrollTrigger.isScrolling()) {
    requestRefresh();
    return;
  }
  refreshDue = true;
}

function armCap(): void {
  if (!stillCap) stillCap = window.setTimeout(onStill, STILL_CAP_MS);
}

/** scrollEnd di ScrollTrigger, o il tetto dell'arrivo: l'arrivo è finito e, a scroll fermo, il refresh rimandato parte. */
function onStill(): void {
  window.clearTimeout(stillCap);
  stillCap = 0;
  arriving = false;
  cancelAnimationFrame(arrivalRaf);
  arrivalRaf = 0;
  // Al tetto con lo scroll ancora in corso il refresh aspetta il suo scrollEnd.
  if (!refreshDue || ScrollTrigger.isScrolling()) return;
  refreshDue = false;
  requestRefresh();
}

/** Alla prima passata: c'è un frammento nell'URL e il browser deve ancora portarcelo (l'ancora non è in vista). */
function fragmentPending(): boolean {
  const id = location.hash.slice(1);
  if (!id) return false;
  let target: HTMLElement | null = null;
  try {
    target = document.getElementById(decodeURIComponent(id));
  } catch {
    target = document.getElementById(id);
  }
  if (!target) return false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return target.getBoundingClientRect().top >= window.innerHeight && window.scrollY < max - 1;
}

/**
 * L'arrivo al frammento finisce quando scrollY, dopo essersi mosso, resta fermo per due
 * fotogrammi (Chrome ripete lo scroll al frammento a ogni layout fino a load, quindi
 * «fermo» e non «arrivato a un numero»), oppure a scrollEnd o al tetto (onStill).
 */
function watchArrival(): void {
  arriving = true;
  armCap();
  let last = window.scrollY;
  let moved = false;
  let still = 0;
  const tick = () => {
    arrivalRaf = 0;
    if (!arriving) return;
    const y = window.scrollY;
    if (y !== last) {
      moved = true;
      still = 0;
    } else if (moved && ++still >= 2) {
      arriving = false;
      return;
    }
    last = y;
    arrivalRaf = requestAnimationFrame(tick);
  };
  arrivalRaf = requestAnimationFrame(tick);
}

function apply(g: Group, dir: Dir, instant: boolean): void {
  window.clearTimeout(g.timers.settle);
  g.untouched = false;
  let longest = 0;
  for (const m of g.members) {
    const targets = targetsOf(m);
    if (!targets.length) continue;
    pointer(m, dir);
    if (instant) {
      rest(targets, m.role, dir, g.live);
      continue;
    }
    const plan = tweenVars(m.role, dir, targets.length, m.i);
    if (dir === "in" && m.extra) plan.to.delay += m.extra;
    if (plan.origin) gsap.set(targets, { transformOrigin: plan.origin });
    if (plan.from) gsap.fromTo(targets, plan.from, plan.to);
    else gsap.to(targets, plan.to);
    longest = Math.max(longest, plan.to.delay + plan.to.duration + plan.to.stagger * (targets.length - 1));
  }
  g.live = !instant;
  if (instant) {
    setState(g, dir === "in" ? "shown" : "hidden");
    return;
  }
  setState(g, dir === "in" ? "revealing" : "hiding");
  g.timers.settle = window.setTimeout(() => setState(g, dir === "in" ? "shown" : "hidden"), Math.ceil(longest * 1000));
}

function observe(g: Group): void {
  if (!io) return;
  g.primedE = false;
  g.primedX = false;
  io.entry.observe(g.el);
  io[g.axis].observe(g.el);
}

function unobserve(g: Group): void {
  if (!io) return;
  io.entry.unobserve(g.el);
  io.x.unobserve(g.el);
  io.y.unobserve(g.el);
}

function trackSince(g: Group): void {
  if (g.mode !== "manual") return;
  if (!g.eHit) {
    g.since = null;
    window.clearTimeout(g.timers.manual);
    return;
  }
  if (g.since !== null) return;
  g.since = performance.now();
  window.clearTimeout(g.timers.manual);
  g.timers.manual = window.setTimeout(() => {
    if (!held(g) && manualNetDue(g.state, g.since, performance.now())) apply(g, "in", false);
  }, NET_MS);
}

function onHits(entries: IntersectionObserverEntry[], kind: "entry" | "exit"): void {
  const vp = viewport();
  for (const en of entries) {
    const g = groups.get(en.target);
    if (!g || !g.armed) continue;
    g.rect = boxOf(en.boundingClientRect);
    let first: boolean;
    if (kind === "entry") {
      g.eHit = en.isIntersecting;
      trackSince(g);
      first = !g.primedE;
      g.primedE = true;
    } else {
      g.xHit = en.isIntersecting;
      first = !g.primedX;
      g.primedX = true;
    }
    if (held(g) || g.mode === "manual") continue;
    const n = noticeAction(first, g.state, { ...g.rect, hit: g.eHit }, { ...g.rect, hit: g.xHit }, vp, g.axis);
    // Durante l'arrivo al frammento tutto è istantaneo: i gruppi attraversati nascono shown.
    if (n) apply(g, n.dir, n.instant || arriving);
  }
}

/** Rete dei 2.500 ms per i gruppi di una passata d'armamento: prima tutte le letture, poi le scritture. */
function netPass(batch: Group[]): void {
  const vp = viewport();
  const due = batch.filter((g) => g.armed && g.untouched && g.state === "hidden" && g.mode !== "manual" && !held(g));
  const rects = due.map((g) => boxOf(g.el.getBoundingClientRect()));
  pass(() => {
    due.forEach((g, k) => {
      const a = netAction(g.state, rects[k], vp);
      if (a) applySweep(g, a, arriving);
    });
  });
}

function enqueue(g: Group): void {
  queue.add(g);
  if (flushQueued) return;
  flushQueued = true;
  queueMicrotask(flush);
}

/** La passata d'armamento, nel microtask dopo il commit di React: letture di tutti i gruppi, poi scritture. */
function flush(): void {
  flushQueued = false;
  const pending = [...queue];
  queue.clear();
  if (!window.matchMedia(MQ.motionOk).matches) return;
  const t0 = performance.now();
  const vp = viewport();
  // Prima passata: con un frammento nell'URL e l'ancora fuori vista l'arrivo è in corso.
  if (!arrivalChecked) {
    arrivalChecked = true;
    if (fragmentPending()) watchArrival();
  }
  const ready: Group[] = [];
  for (const g of pending) {
    if (g.armed || groups.get(g.el) !== g || !g.el.isConnected || g.el.closest(FREEZE)) continue;
    g.members = collect(g.el);
    if (!g.members.length) continue;
    g.axis = axisOf(g.el);
    g.mode = modeOf(g);
    g.rect = boxOf(g.el.getBoundingClientRect());
    g.eHit = intersects(g.rect, vp);
    g.xHit = intersects(g.rect, exitRoot(vp, g.axis));
    ready.push(g);
  }
  const t1 = performance.now();
  performance.measure("dt-reveal-arm-read", { start: t0, end: t1 });
  pass(() => {
    for (const g of ready) arm(g, vp);
  });
  performance.measure("dt-reveal-arm-write", { start: t1, end: performance.now() });
  if (!ready.length) return;
  // D39: un refresh dopo la passata, così gli start degli scrub e dei trigger
  // di oggi leggono il layout cresciuto dopo l'idratazione (D38); a scroll
  // fermo, mai dentro l'arrivo al frammento o un fling (refreshWhenStill).
  refreshWhenStill();
  window.setTimeout(() => netPass(ready), NET_MS);
}

/** Scrive e non legge il layout: g.rect, g.axis e g.mode li ha letti flush(). */
function arm(g: Group, vp: Box): void {
  writeRoles(g);
  for (const m of g.members) m.el.setAttribute("data-reveal-armed", "");
  g.el.setAttribute("data-reveal-mode", g.mode);
  g.armed = true;
  const group = g.el;
  const where = held(g) ? "below" : armState(g.rect, vp);
  if (where === "fold") {
    // Piega: in vista all'armamento il gruppo nasce shown. Il testo è già
    // dipinto dal server e nasconderlo lo farebbe sparire sotto gli occhi (D21).
    play(group, "in", { instant: true });
    g.stopFold = noop;
  } else {
    apply(g, where === "below" ? "out" : "in", true);
  }
  g.untouched = true;
  observe(g);
}

function disarm(g: Group): void {
  queue.delete(g);
  if (!g.armed) return;
  unobserve(g);
  g.stopFold();
  g.stopFold = noop;
  window.clearTimeout(g.timers.manual);
  window.clearTimeout(g.timers.settle);
  g.since = null;
  g.armed = false;
  for (const m of g.members) {
    const targets = targetsOf(m);
    if (g.live) gsap.killTweensOf(targets);
    // Il gruppo smette di rigiocare: solo qui gli stili inline si tolgono.
    gsap.set(targets, { clearProps: "opacity,transform,transformOrigin" });
    m.el.style.removeProperty("pointer-events");
    m.el.removeAttribute("data-reveal-armed");
  }
  g.live = false;
  g.el.removeAttribute("data-reveal-state");
  g.el.removeAttribute("data-reveal-mode");
}

function onFocusIn(ev: FocusEvent): void {
  let node = ev.target instanceof Element ? ev.target.closest("[data-reveal-group]") : null;
  while (node) {
    const g = groups.get(node);
    if (g?.armed && g.state !== "shown") apply(g, "in", true);
    node = node.parentElement?.closest("[data-reveal-group]") ?? null;
  }
}

/** Un salto (ancora, ripristino, fuoco di un corridoio con immediate) scavalca gruppi che l'IO non vede: sweep(). */
function onScroll(): void {
  const x = window.scrollX;
  const y = window.scrollY;
  const jumped = Math.abs(y - lastY) >= window.innerHeight || Math.abs(x - lastX) >= window.innerWidth;
  lastX = x;
  lastY = y;
  if (!jumped || jumpRaf) return;
  jumpRaf = requestAnimationFrame(() => {
    jumpRaf = 0;
    sweep();
  });
}

function onMotionChange(e: MediaQueryListEvent): void {
  if (e.matches) {
    for (const g of groups.values()) enqueue(g);
    return;
  }
  for (const g of groups.values()) disarm(g);
  document.documentElement.removeAttribute("data-hero-intro");
}

function install(): void {
  if (io) return;
  io = {
    entry: new IntersectionObserver((es) => onHits(es, "entry"), { threshold: 0, rootMargin: "0px" }),
    y: new IntersectionObserver((es) => onHits(es, "exit"), { threshold: 0, rootMargin: "0px 0px -15% 0px" }),
    x: new IntersectionObserver((es) => onHits(es, "exit"), { threshold: 0, rootMargin: "0px -15% 0px 0px" }),
  };
  ScrollTrigger.addEventListener("refresh", sweep);
  ScrollTrigger.addEventListener("scrollEnd", onStill);
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(sweep, RESIZE_MS);
  });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") sweep();
  });
  document.addEventListener("focusin", onFocusIn);
  window.matchMedia(MQ.motionOk).addEventListener("change", onMotionChange);
  // D39: i ScrollTrigger di oggi (TextLines) nascono nell'idratazione, e dopo
  // crescono il documento gli split dei titoli e le altezze misurate dal JS
  // (nastro, rotaia: +5.872 px a 1440 negli effetti passivi, un task dopo);
  // nessuno li rinfrescava (D38 sugli attrezzi e2e). A ogni cambio d'altezza
  // del body un refresh, uno per fotogramma e a scroll fermo (refreshWhenStill);
  // senza pin il refresh non cambia il layout, quindi non si richiama da sé.
  new ResizeObserver(refreshWhenStill).observe(document.body);
}

// ── API ───────────────────────────────────────────────────────────────────

export function sweep(): void {
  const t0 = performance.now();
  const vp = viewport();
  const reads: { g: Group; axis: Axis; mode: "io" | "manual"; rect: Box }[] = [];
  for (const g of groups.values()) {
    if (!g.armed) continue;
    reads.push({ g, axis: axisOf(g.el), mode: modeOf(g), rect: boxOf(g.el.getBoundingClientRect()) });
  }
  pass(() => {
    for (const { g, axis, mode, rect } of reads) {
      if (axis !== g.axis && io) {
        io[g.axis].unobserve(g.el);
        g.axis = axis;
        g.primedX = false;
        io[axis].observe(g.el);
      }
      if (mode !== g.mode) {
        g.mode = mode;
        g.el.setAttribute("data-reveal-mode", mode);
      }
      if (mode === "io") {
        window.clearTimeout(g.timers.manual);
        g.since = null;
      }
      g.rect = rect;
      if (held(g) || mode === "manual") continue;
      const a = sweepAction(g.state, rect, vp, g.axis);
      if (a) applySweep(g, a, arriving);
    }
  });
  performance.measure("dt-reveal-sweep", { start: t0, end: performance.now() });
}

export function play(el: Element, dir: Dir, o?: { instant?: boolean }): void {
  const g = groups.get(el);
  if (!g || !g.armed) return;
  const instant = o?.instant === true;
  const already = dir === "in" ? g.state === "shown" || g.state === "revealing" : g.state === "hidden" || g.state === "hiding";
  if (already && !instant) return;
  apply(g, dir, instant);
}

/**
 * Rilegge i membri e porta allo stato corrente del gruppo, senza animare, i membri nuovi
 * e i bersagli GSAP che non hanno tween (in corsa o in attesa del loro delay). I membri
 * di prima tengono attributi, transizione e stato (spec §2.3; lane-sistema §5.2).
 */
export function resync(group: HTMLElement): void {
  const g = groups.get(group);
  if (!g || !g.armed) return;
  const before = new Set(g.members.map((m) => m.el));
  const members = collect(g.el);
  const dir: Dir = g.state === "shown" || g.state === "revealing" ? "in" : "out";
  // Un bersaglio in corsa, o in attesa del suo delay, ha un tween: lo si lascia finire.
  const quiet = members.map((m) => targetsOf(m).filter((t) => gsap.getTweensOf(t).length === 0));
  g.members = members;
  writeRoles(g);
  members.forEach((m, k) => {
    if (!before.has(m.el)) {
      m.el.setAttribute("data-reveal-armed", "");
      pointer(m, dir);
    }
    if (quiet[k].length) rest(quiet[k], m.role, dir, false);
  });
}

export function register(el: HTMLElement, o: RegisterOptions): { api: RevealApi; unregister: () => void } {
  install();
  if (o.hold) el.setAttribute(HOLD, "");
  const g: Group = {
    el,
    requested: o.trigger,
    mode: o.trigger,
    axis: "y",
    state: "shown",
    members: [],
    rect: { top: 0, left: 0, bottom: 0, right: 0 },
    eHit: false,
    xHit: false,
    primedE: false,
    primedX: false,
    since: null,
    armed: false,
    untouched: false,
    live: false,
    stopFold: noop,
    timers: { manual: 0, settle: 0 },
  };
  groups.set(el, g);
  enqueue(g);
  const api: RevealApi = {
    play: (dir, p) => play(el, dir, p),
    release: () => {
      const rect = g.armed ? boxOf(el.getBoundingClientRect()) : null;
      el.removeAttribute(HOLD);
      if (!rect || g.mode === "manual") return;
      const a = sweepAction(g.state, rect, viewport(), g.axis);
      if (a) applySweep(g, a, arriving);
    },
  };
  return {
    api,
    unregister: () => {
      disarm(g);
      if (groups.get(el) === g) groups.delete(el);
    },
  };
}
