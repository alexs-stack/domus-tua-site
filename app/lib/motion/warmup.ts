"use client";

// Precarico — il lavoro pesante si fa DIETRO IL SIPARIO, non durante lo scroll.
//
// IL PROBLEMA (misurato, 2026-08-05)
// Due scene del sito rimandavano lavoro costoso al momento in cui l'utente le
// raggiungeva scorrendo:
//   • il corridoio del team (TeamTrail) chiedeva la foto del ritratto quando la
//     camera ci arrivava sopra — traccia di rete: la richiesta partiva a +2,9s
//     dal caricamento, cioè a scroll già in corso;
//   • Fioritura campiona la scritta pixel per pixel e ne ricava migliaia di
//     particelle dentro il callback dell'IntersectionObserver — cioè nel frame
//     esatto in cui la sezione entra in viewport.
// In entrambi i casi il costo cade sul frame sbagliato e si vede: la pagina
// singhiozza proprio mentre ci si muove.
//
// LA SOLUZIONE
// Un registro di lavori "da scaldare". Chi ha un costo di primo avvio lo
// dichiara qui; il preloader li esegue tutti mentre l'intro è ancora a schermo
// — tempo che l'utente sta già aspettando — e solo dopo alza il sipario.
//
// I VINCOLI (perché questo modulo è così prudente)
//   • SCADENZA DURA. Il precarico non può trattenere nessuno dietro il
//     sipario: su rete lenta si rinuncia e si entra comunque. Un sito che si
//     apre in ritardo è peggio di un sito che singhiozza a metà pagina.
//   • MAI UN'ECCEZIONE. Un lavoro che fallisce non deve impedire agli altri di
//     partire né bloccare l'ingresso: `allSettled`, sempre.
//   • IDEMPOTENTE. Chi torna sul sito salta l'intro: lì il precarico gira a
//     ruota libera (`requestIdleCallback`) e non deve rifare ciò che è fatto.

/** Un lavoro da scaldare. Deve essere idempotente e non lanciare mai. */
export type WarmupTask = () => void | Promise<void>;

const tasks = new Set<WarmupTask>();
let done = false;
let running: Promise<void> | null = null;

/**
 * Dichiara un lavoro da fare dietro il sipario.
 * Se il precarico è GIÀ passato (componente montato tardi, o visitatore di
 * ritorno), il lavoro parte subito: nessuno resta indietro.
 *
 * @returns la funzione per disiscriversi allo smontaggio
 */
export function registerWarmup(task: WarmupTask): () => void {
  if (done) {
    void safe(task);
    return () => {};
  }
  tasks.add(task);
  return () => tasks.delete(task);
}

async function safe(task: WarmupTask): Promise<void> {
  try {
    await task();
  } catch {
    /* un lavoro di riscaldamento che fallisce è un peccato, non un errore */
  }
}

/** Decodifica un'immagine già nel DOM. Silenziosa su qualunque intoppo. */
export async function warmImage(img: HTMLImageElement): Promise<void> {
  try {
    if (img.decode) await img.decode();
  } catch {
    /* immagine non ancora arrivata o formato ostico: pazienza */
  }
}

/**
 * Scalda tutti i lavori dichiarati, entro la scadenza.
 *
 * Torna quando i lavori sono finiti O quando scade il tempo — chi chiama può
 * sempre `await` senza rischiare di bloccare l'ingresso al sito.
 */
export function runWarmup(deadlineMs = 2200): Promise<void> {
  if (running) return running;
  running = (async () => {
    // I font PRIMA di tutto: Fioritura campiona una scritta, e campionarla con
    // il fallback Georgia significa buttare il lavoro e rifarlo dopo lo swap.
    await Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise((r) => setTimeout(r, Math.min(1200, deadlineMs))),
    ]);

    const lavori = [...tasks].map(safe);
    await Promise.race([
      Promise.allSettled(lavori),
      new Promise((r) => setTimeout(r, deadlineMs)),
    ]);

    // `done` anche se si è finiti per scadenza: i lavori rimasti continuano per
    // conto loro e chi si registra dopo parte da solo. Nessuno resta appeso.
    done = true;
    tasks.clear();
  })();
  return running;
}

/** true se il precarico è già passato (i nuovi iscritti partono da soli). */
export function isWarmedUp(): boolean {
  return done;
}

/**
 * Precarico per chi salta l'intro (visitatore di ritorno, reduced-motion).
 * Gira a ruota libera: qui non c'è un sipario a coprire, quindi non deve
 * rubare tempo al primo rendering. Con una rete di sicurezza, perché
 * `requestIdleCallback` su una scheda in background può non arrivare mai.
 */
export function scheduleIdleWarmup(deadlineMs = 2200): void {
  if (done || running) return;
  const go = () => void runWarmup(deadlineMs);
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(go, { timeout: 1500 });
  else window.setTimeout(go, 300);
}
