// I RUOLI DEL TESTO della coreografia (A20 «Fedeltà letterale» e A22 «Piatto
// come Era» di Alberto; spec §2.2). Sono i valori degli animatori di
// era-residence (main.pretty.js:401-618, costanti :2858-2863) e valgono in
// tutti i capitoli: il gesto di sezione di ogni capitolo sta altrove, qui c'è
// solo come si muove il testo. Nessuna transformPerspective: le lettere girano
// di taglio, come in Era.
//
// Bersagli, tutti di GSAP (spec §2.2: tween nuovo a ogni passaggio, fromTo con
// overwrite; nessuno stato nascosto in CSS): `title` e `accent` animano i
// `[data-c]` del membro (caratteri resi nel server), `lead` le righe `.dt-line`
// (SplitText nel client), `ctn` e `still` il membro stesso (`targets: null`).
// La corsa di `ctn` sta nella tabella come `var(--dt-ctn-y)`, la parola di spec
// §2.2; GSAP non risolve `var()` dentro `y`, quindi tweenVars() e restVars() la
// traducono in ctnY() (gsap.ts), che dice lo stesso numero del token.
//
// Tetti (D19): stagger per carattere al massimo 1,2 s in ingresso e 0,4 s in
// uscita; indice nel gruppo fermo a 5. I numeri passano da un arrotondamento a
// 1e-6: 1.2 / 24 in virgola mobile vale 0.049999999999999996.
import { ctnY, delayDt, durDt, staggerDt } from "./gsap";

export type Role = "title" | "accent" | "lead" | "ctn" | "still";
export type Pose = Record<string, number | string | boolean>;
export type RoleSpec = {
  /** Selettore dei bersagli GSAP dentro il membro; null = il membro stesso. */
  targets: string | null;
  enter: { from: Pose; to: Pose; duration: number; stagger: number; ease: string; origin: string | null };
  exit: { to: Pose; duration: number; stagger: number; ease: string; origin: string | null };
};

export const ROLES: Record<Role, RoleSpec> = {
  title: {
    targets: "[data-c]",
    enter: {
      from: { opacity: 0, yPercent: 50, rotateY: 90 },
      to: { opacity: 1, yPercent: 0, rotateY: 0 },
      duration: durDt.l,
      stagger: 0.05,
      ease: "dtOut",
      origin: null,
    },
    exit: { to: { opacity: 0, yPercent: -50, rotateY: -90 }, duration: durDt.s, stagger: 0.025, ease: "dtIn", origin: null },
  },
  accent: {
    targets: "[data-c]",
    enter: {
      from: { opacity: 0, rotateX: 90, x: "10vw" },
      to: { opacity: 1, rotateX: 0, x: "0vw" },
      duration: durDt.l,
      stagger: staggerDt,
      ease: "dtOut",
      origin: "50% 100%",
    },
    exit: { to: { opacity: 0, rotateX: -90, x: "-10vw" }, duration: durDt.s, stagger: 0.05, ease: "dtIn", origin: "50% 0%" },
  },
  lead: {
    targets: ".dt-line",
    enter: { from: { yPercent: 110 }, to: { yPercent: 0 }, duration: durDt.l, stagger: staggerDt, ease: "dtOut", origin: null },
    exit: { to: { yPercent: -110 }, duration: durDt.s, stagger: 0.05, ease: "dtIn", origin: null },
  },
  ctn: {
    targets: null,
    enter: {
      from: { opacity: 0, y: "var(--dt-ctn-y)" },
      to: { opacity: 1, y: 0 },
      duration: durDt.l,
      stagger: 0,
      ease: "dtOut",
      origin: null,
    },
    exit: { to: { opacity: 0 }, duration: durDt.s, stagger: 0, ease: "dtIn", origin: null },
  },
  still: {
    targets: null,
    enter: { from: { opacity: 0 }, to: { opacity: 1 }, duration: durDt.l, stagger: 0, ease: "dtOut", origin: null },
    exit: { to: { opacity: 0 }, duration: durDt.s, stagger: 0, ease: "dtIn", origin: null },
  },
};

/** Indice massimo nel gruppo (D19): 20 domande di una FAQ non arrivano a 2,3 s. */
export const INDEX_CAP = 5;
/** Tetti dello stagger per carattere (D19): durL in ingresso, durS in uscita. */
export const STAGGER_CAP = { in: durDt.l, out: durDt.s } as const;
/** Ciò che un replay non deve sfilare di sotto al puntatore (regola del 2026-08-04). */
export const INTERACTIVE = 'a[href], button, summary, input, select, textarea, [tabindex]:not([tabindex="-1"])';

const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Stagger per bersaglio con tetto: min(stagger, cap / max(1, n − 1)). */
export function staggerEach(stagger: number, n: number, cap: number): number {
  return r6(Math.min(stagger, cap / Math.max(1, n - 1)));
}

/** Ritardo di un membro: `i` è il suo indice fra i membri dello stesso `role` nel gruppo. */
export function groupDelay(role: Role, i: number, dir: "in" | "out" = "in"): number {
  const k = Math.min(Math.max(0, i), INDEX_CAP);
  return dir === "in" ? r6(delayDt.reveal + k * staggerDt) : r6((k * staggerDt) / 2);
}

/** Un gruppo che contiene un elemento interattivo declassa `ctn` a `still`: nei replay solo opacità. */
export function demote(role: Role, container: Pick<ParentNode, "querySelector">): Role {
  return role === "ctn" && container.querySelector(INTERACTIVE) !== null ? "still" : role;
}

export type TweenPlan = {
  from: Pose | null;
  to: Pose & { duration: number; delay: number; stagger: number; ease: string; overwrite: true };
  origin: string | null;
};

/** La parola della tabella per la corsa di ctn (spec §2.2); a GSAP arriva ctnY(). */
const CTN_Y = "var(--dt-ctn-y)";

/** Una posa pronta per GSAP: `var(--dt-ctn-y)` diventa ctnY(), il resto passa com'è. */
function resolve(pose: Pose): Pose {
  const out: Pose = {};
  for (const [k, v] of Object.entries(pose)) out[k] = v === CTN_Y ? ctnY() : v;
  return out;
}

/** La posa ferma di un ruolo: dentro (`enter.to`) o fuori (`enter.from`), con l'origine se il ruolo ne ha una. */
export function restVars(role: Role, dir: "in" | "out"): Pose {
  const r = ROLES[role];
  const pose = resolve(dir === "in" ? r.enter.to : r.enter.from);
  return r.enter.origin ? { ...pose, transformOrigin: r.enter.origin } : pose;
}

/** Il tween di un passaggio: fromTo in ingresso, to in uscita, sempre nuovo e con overwrite. */
export function tweenVars(role: Role, dir: "in" | "out", n: number, i: number): TweenPlan {
  const r = ROLES[role];
  if (dir === "in") {
    return {
      from: resolve(r.enter.from),
      to: {
        ...resolve(r.enter.to),
        duration: r.enter.duration,
        delay: groupDelay(role, i, "in"),
        stagger: staggerEach(r.enter.stagger, n, STAGGER_CAP.in),
        ease: r.enter.ease,
        overwrite: true,
      },
      origin: r.enter.origin,
    };
  }
  return {
    from: null,
    to: {
      ...resolve(r.exit.to),
      duration: r.exit.duration,
      delay: groupDelay(role, i, "out"),
      stagger: staggerEach(r.exit.stagger, n, STAGGER_CAP.out),
      ease: r.exit.ease,
      overwrite: true,
    },
    origin: r.exit.origin,
  };
}
