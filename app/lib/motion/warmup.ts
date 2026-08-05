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
 * TUTTE le immagini della pagina, scaricate e decodificate dietro il sipario.
 *
 * Richiesta esplicita del cliente: «dobbiamo far caricare tutto nel caricamento
 * prima di entrare nel sito». Qui si forza `loading="eager"` sulle pigre e si
 * aspetta la decodifica di ognuna.
 *
 * Il compromesso, dichiarato: sono decine di immagini che entrano in gara con
 * l'immagine LCP dell'hero. È accettabile SOLO perché il sipario è ancora
 * alzato — l'utente non sta guardando la pagina, sta guardando l'intro — e
 * perché la scadenza di `runWarmup` taglia comunque l'attesa. Fuori dal
 * preloader questa funzione non va usata.
 */
export async function warmAllImages(): Promise<void> {
  const tutte = Array.from(document.images);
  const viste = new Set<string>();
  await Promise.all(
    tutte.map(async (img) => {
      // Le pigre non sono nemmeno partite: si sveglia la richiesta.
      if (img.loading === "lazy") img.loading = "eager";
      const src = img.currentSrc || img.src;
      if (!src || viste.has(src)) return;
      viste.add(src);
      if (!img.complete) {
        await new Promise<void>((r) => {
          const fine = () => r();
          img.addEventListener("load", fine, { once: true });
          img.addEventListener("error", fine, { once: true });
        });
      }
      await warmImage(img);
    })
  );
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

    // ⚠️ FINESTRA DI RACCOLTA — il difetto della prima versione.
    // `runWarmup()` parte da un effetto di layout del preloader; le scene si
    // iscrivono da `useEffect`, che React esegue DOPO. Al primo giro il
    // registro era quindi vuoto: il precarico "finiva" in pochi millisecondi
    // senza aver atteso nulla, e il sipario si alzava lo stesso. Funzionava
    // per caso, perché l'intro dura cinque secondi e i lavori erano rapidi —
    // ma su un dispositivo lento sarebbe stato esattamente il difetto che
    // questo modulo doveva togliere.
    //
    // Si drena a giri: fra un giro e l'altro si cede il controllo al browser,
    // così chi si iscrive nel frattempo (o chi si iscrive DENTRO un lavoro)
    // entra nel giro successivo. Si esce quando nessuno si fa più vivo.
    const scadenza = new Promise<void>((r) => setTimeout(r, deadlineMs));
    let scaduto = false;
    void scadenza.then(() => {
      scaduto = true;
    });

    for (let giro = 0; giro < 6 && !scaduto; giro += 1) {
      // Due frame: il primo lascia montare i componenti, il secondo raccoglie
      // chi si è iscritto durante il primo.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (tasks.size === 0) {
        // Nessuno in coda: se è già il secondo giro a vuoto, non arriverà più.
        if (giro > 0) break;
        continue;
      }
      const lotto = [...tasks];
      tasks.clear();
      await Promise.race([Promise.allSettled(lotto.map(safe)), scadenza]);
    }

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
