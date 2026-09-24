// Scelta del provider AI, condivisa dai due percorsi che usano un modello:
// la ricerca in linguaggio naturale (app/lib/ai) e l'assistente (app/lib/assistant).
//
// Due provider possibili, entrambi opt-in via env e SERVER-ONLY:
//  • google    → Gemini  (GEMINI_API_KEY)
//  • anthropic → Claude  (ANTHROPIC_API_KEY)
//
// Senza nessuna chiave il sito NON si rompe: la ricerca ricade sul parser locale
// deterministico e l'assistente sulla risposta di fallback. È il comportamento che i
// test coprono, ed è il motivo per cui questo modulo espone un `null` esplicito invece
// di far finta che un provider ci sia sempre.
//
// Perché un modulo a parte: prima ogni feature leggeva la propria env. Con due provider
// la scelta va fatta in un posto solo, altrimenti ricerca e assistente possono finire su
// modelli di fornitori diversi senza che nessuno se ne accorga.

export type AiProvider = "google" | "anthropic";

/** Chiave Gemini (Google Generative Language API). SERVER-ONLY: mai NEXT_PUBLIC_. */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

/** Chiave Anthropic. SERVER-ONLY. */
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

/**
 * Le sole variabili che contano per la scelta. Parametro esplicito = funzione testabile.
 * L'indice serve ad accettare `process.env` così com'è, senza cast.
 */
export interface ProviderEnv {
  readonly GEMINI_API_KEY?: string;
  readonly ANTHROPIC_API_KEY?: string;
  readonly AI_PROVIDER?: string;
  readonly [key: string]: string | undefined;
}

/**
 * Provider attivo, `null` se non c'è nessuna chiave.
 *
 * Precedenza:
 *  1. `AI_PROVIDER` esplicita, ma solo se la chiave corrispondente esiste davvero —
 *     una variabile scritta male non deve spegnere l'AI in silenzio, né mandare le
 *     chiamate a un provider per cui non abbiamo credenziali;
 *  2. Gemini, se ha la chiave: è il provider scelto per il sito;
 *  3. Claude, se ha la chiave.
 *
 * `AI_PROVIDER=anthropic` è la via per tornare a Claude senza toccare il codice, anche
 * con entrambe le chiavi impostate.
 *
 * Pura di proposito: la precedenza è la classica logica che si rompe in silenzio, e da
 * qui dipendono sia la ricerca sia l'assistente. Coperta da `__tests__/provider.test.ts`.
 */
export function resolveProvider(env: ProviderEnv): AiProvider | null {
  const gemini = (env.GEMINI_API_KEY || "").length > 0;
  const anthropic = (env.ANTHROPIC_API_KEY || "").length > 0;
  const wanted = (env.AI_PROVIDER || "").trim().toLowerCase();
  if ((wanted === "google" || wanted === "gemini") && gemini) return "google";
  if ((wanted === "anthropic" || wanted === "claude") && anthropic) return "anthropic";
  if (gemini) return "google";
  if (anthropic) return "anthropic";
  return null;
}

export const AI_PROVIDER: AiProvider | null = resolveProvider(process.env);

/** Chiave del provider attivo. Stringa vuota se non ce n'è uno. */
export const AI_API_KEY =
  AI_PROVIDER === "google" ? GEMINI_API_KEY : AI_PROVIDER === "anthropic" ? ANTHROPIC_API_KEY : "";

/** true se esiste un provider utilizzabile. Falso = percorsi di fallback, non errori. */
export const aiEnabled = AI_PROVIDER !== null;

/**
 * Default per provider, per i modelli che l'env può sovrascrivere.
 * Il fallback su "anthropic" quando non c'è provider serve solo a tenere le costanti
 * `string` invece di `string | null`: senza chiave nessuno di questi ID viene usato.
 */
export function byProvider<T>(map: Record<AiProvider, T>): T {
  return map[AI_PROVIDER ?? "anthropic"];
}
