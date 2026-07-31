// Registro delle superfici a tutto schermo attive in un dato momento.
//
// Serve a risolvere una classe di conflitti, non un caso singolo: il launcher fisso
// dell'assistente (z-50) si sovrapponeva al menu mobile (z-40), e il pannello aperto
// (z-[60]) occupava esattamente la stessa posizione del banner cookie (z-[60], stesso
// `inset-x-3 bottom-3`). Alzare gli z-index a vicenda è una gara che non finisce: meglio
// che chi apre una superficie lo dichiari, e chi ha elementi fissi si tolga di mezzo.
//
// Volutamente minimale: nessun context provider, nessuna dipendenza. Solo un Set e dei
// sottoscrittori. Client-only — su server `hasOverlay()` risponde false.

export type OverlayName = "cookie-consent" | "mobile-menu" | "quick-look";

const active = new Set<OverlayName>();
const listeners = new Set<() => void>();

/** Dichiara che una superficie è aperta (o chiusa). */
export function setOverlay(name: OverlayName, isActive: boolean): void {
  const before = active.size;
  if (isActive) active.add(name);
  else active.delete(name);
  // Notifica solo quando cambia la risposta a "c'è qualcosa aperto?".
  if ((before === 0) !== (active.size === 0)) {
    for (const listener of listeners) listener();
  }
}

/** true se una qualsiasi superficie a tutto schermo è aperta. */
export function hasOverlay(): boolean {
  return active.size > 0;
}

/** Si iscrive ai cambi. Ritorna la funzione per disiscriversi. */
export function subscribeOverlays(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
