"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";
import { Close, Mail, Phone, Whatsapp } from "./Icons";
import { assistantCopy } from "./assistantCopy";
import { site } from "../lib/site";
import { setOverlayOpen } from "../lib/overlayState";
import { isDisplayableImage } from "../lib/images";

// Pannello dell'assistente. Montato solo dopo il primo click sul launcher (AssistantMount):
// finché nessuno apre la chat, questo file non arriva nemmeno al browser.
//
// Il testo arriva in streaming (SSE) da /api/assistant e compare mentre viene scritto. Il
// pannello non conosce chiavi né provider: parla solo con la nostra route.

type Card = { slug: string; title: string; zone: string; price: string; url: string; cover: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  listings?: Card[];
  intro?: boolean;
  /** Turno non concluso (errore o interruzione): mostra "Riprova" e non torna nella cronologia. */
  error?: boolean;
};

type Props = { open: boolean; onClose: () => void };

/** Massimo di caratteri accettati dal server: lo diciamo anche qui, per non far scrivere invano. */
const MAX_LEN = 1000;

export default function Assistant({ open, onClose }: Props) {
  const { locale } = useLocale();
  const c = assistantCopy[locale];
  const greeting: Msg = { role: "assistant", content: c.greeting, intro: true };

  const [messages, setMessages] = useState<Msg[]>([greeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  // Turno in corso: chiudere il pannello, cambiare conversazione o premere "interrompi" ferma
  // davvero il lavoro sul server, non solo l'aggiornamento dell'interfaccia.
  const abortRef = useRef<AbortController | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Ultima risposta dell'assistente da annunciare allo screen reader. Si scrive UNA volta, a
  // turno finito: annunciare ogni pezzo dello stream renderebbe la chat illeggibile.
  const [liveReply, setLiveReply] = useState("");

  // Aggiorna il saluto se cambia lingua e la conversazione è solo il saluto.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMessages((m) =>
      m.length === 1 && m[0].intro ? [{ role: "assistant", content: c.greeting, intro: true }] : m,
    );
  }, [c.greeting]);

  // Stato della connessione: senza rete non ha senso far scrivere una domanda che non partirà.
  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  // Se il componente sparisce, la richiesta non deve sopravvivergli.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Si annuncia al registro dei pannelli: mentre la chat è aperta il banner cookie si ritira
  // (due dialog modali insieme = due focus trap che si contendono il Tab).
  useEffect(() => {
    setOverlayOpen("assistant", open);
    return () => setOverlayOpen("assistant", false);
  }, [open]);

  // Scroll in fondo a ogni nuovo messaggio / stato di caricamento.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // All'apertura sposta il focus nel pannello.
  useEffect(() => {
    if (!open) return;
    (inputRef.current ?? dialogRef.current)?.focus();
  }, [open]);

  // Blocca lo scroll del body mentre il dialog è aperto; ripristina alla chiusura/smontaggio.
  // Con Lenis attivo va fermato anche lo scroll virtuale (rotella), non solo quello nativo.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    getLenis()?.stop();
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      getLenis()?.start();
    };
  }, [open]);

  // Chiusura: interrompe il turno in corso (non lasciarlo finire per nessuno) e restituisce
  // il focus al launcher, che vive nel componente padre.
  const close = useCallback(() => {
    abortRef.current?.abort();
    onClose();
  }, [onClose]);

  /** Interrompe la risposta lasciando in pagina il testo già arrivato. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
    inputRef.current?.focus();
  }, []);

  /** Riparte da zero: la conversazione precedente non viene salvata da nessuna parte. */
  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([{ role: "assistant", content: c.greeting, intro: true }]);
    setInput("");
    setLiveReply("");
    inputRef.current?.focus();
  }, [c.greeting]);

  // Trap del Tab dentro il dialog + Escape per chiudere.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey) {
        if (activeEl === first || !dialog.contains(activeEl)) {
          e.preventDefault();
          last.focus();
        }
      } else if (activeEl === last || !dialog.contains(activeEl)) {
        e.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  const send = useCallback(
    async (text: string, history?: Msg[]) => {
      const q = text.trim().slice(0, MAX_LEN);
      if (!q || loading) return;
      // Base della conversazione: senza i turni non conclusi (non vanno rimandati all'API).
      const base = (history ?? messages).filter((m) => !m.error);
      const next = [...base, { role: "user" as const, content: q }];
      setMessages(next);
      setInput("");

      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setMessages([...next, { role: "assistant", content: c.offline, error: true }]);
        setLiveReply(c.offline);
        return;
      }

      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // La risposta arriva in streaming (SSE): accumuliamo il testo e aggiorniamo l'ultimo
      // messaggio a ogni pezzo, così si legge mentre viene scritto.
      let acc = "";
      let cards: Card[] | undefined;
      let failed = false;
      let started = false;
      const push = () => {
        setMessages((m) => {
          const out = [...m];
          const last = out[out.length - 1];
          if (started && last && last.role === "assistant" && !last.intro) {
            out[out.length - 1] = { ...last, content: acc, listings: cards };
          } else {
            started = true;
            out.push({ role: "assistant", content: acc, listings: cards });
          }
          return out;
        });
      };
      const markLastAsUnfinished = () =>
        setMessages((m) => {
          const out = [...m];
          const last = out[out.length - 1];
          if (last && last.role === "assistant") out[out.length - 1] = { ...last, error: true };
          return out;
        });

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            locale,
            messages: next.filter((m) => !m.intro).map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        const reader = res.body?.getReader();
        if (!reader) throw new Error("no-stream");
        const decoder = new TextDecoder();
        let pending = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          // Gli eventi SSE sono separati da una riga vuota.
          const parts = pending.split("\n\n");
          pending = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            let ev: { type?: string; text?: string; listings?: Card[] };
            try {
              ev = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (ev.type === "text" && ev.text) {
              acc += ev.text;
              push();
            } else if (ev.type === "listings") {
              // Le schede arrivano dai nostri strumenti, ma le ricontrolliamo qui: nel <Image>
              // non deve finire una sorgente che non sia nostra, e un link deve restare una
              // scheda immobile del sito — mai un indirizzo esterno.
              cards = (ev.listings ?? []).filter(
                (p) => isDisplayableImage(p.cover) && /^\/case\/[a-z0-9-]+$/i.test(p.url),
              );
              push();
            } else if (ev.type === "error") {
              failed = true;
            }
          }
        }

        if (failed || !acc.trim()) {
          // Se il server ha già spiegato cosa fare (filtri, WhatsApp, telefono) teniamo quel
          // testo e lo marchiamo: compare "Riprova" e non torna nella cronologia.
          if (acc.trim()) {
            markLastAsUnfinished();
            setLiveReply(acc);
          } else {
            setMessages((m) => [...m, { role: "assistant", content: c.error, error: true }]);
            setLiveReply(c.error);
          }
        } else {
          setLiveReply(acc);
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          // Interruzione volontaria: il testo già arrivato resta in pagina, ma marcato — una
          // risposta troncata non va rimandata al modello come se fosse conclusa. Se non era
          // ancora arrivato niente lo diciamo, altrimenti la domanda resterebbe lì senza esito
          // e senza un modo per riprovare.
          if (started) markLastAsUnfinished();
          else setMessages((m) => [...m, { role: "assistant", content: c.stopped, error: true }]);
        } else {
          setMessages((m) => [...m, { role: "assistant", content: c.error, error: true }]);
          setLiveReply(c.error);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setLoading(false);
      }
    },
    [loading, messages, locale, c.error, c.offline, c.stopped],
  );

  // Riprova: re-invia l'ultimo messaggio dell'utente ripartendo dalla storia
  // precedente (senza duplicare quel messaggio e senza i turni non conclusi).
  const retry = useCallback(() => {
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const priorHistory = messages.slice(0, lastUserIdx);
    void send(messages[lastUserIdx].content, priorHistory);
  }, [messages, send]);

  if (!open) return null;

  const conversationStarted = messages.length > 1;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assistant-title"
      tabIndex={-1}
      data-lenis-prevent
      onKeyDown={onKeyDown}
      className="fixed inset-x-3 z-[70] flex flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-[0_50px_100px_-40px_rgba(26,24,22,0.6)] sm:inset-x-auto sm:right-5 sm:w-[390px]"
      style={{
        // 100dvh segue la barra del browser mobile; la safe area tiene il pannello sopra la
        // home indicator invece che sotto.
        bottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        maxHeight: "calc(100dvh - 1.5rem - env(safe-area-inset-bottom) - env(safe-area-inset-top))",
        height: "min(82dvh, 620px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-line bg-cream px-4 py-3">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red text-white">
            <ChatIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span id="assistant-title" className="block truncate font-display text-base font-semibold text-ink">
              {c.title}
            </span>
            <span className="block truncate text-[0.78rem] text-stone">{c.subtitle}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={newChat}
            disabled={!conversationStarted}
            aria-label={c.newChat}
            className="grid h-11 w-11 place-items-center rounded-full text-stone transition-colors duration-200 hover:bg-line/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:pointer-events-none disabled:opacity-30"
          >
            <NewChatIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label={c.close}
            className="grid h-11 w-11 place-items-center rounded-full text-stone transition-colors duration-200 hover:bg-line/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <Close className="h-5 w-5" />
          </button>
        </span>
      </div>

      {/* Annuncio SR: solo l'ultima risposta dell'assistente, una volta sola. */}
      <p aria-live="polite" className="sr-only">
        {liveReply}
      </p>

      {offline && (
        <p role="status" className="border-b border-line bg-red-soft/40 px-4 py-2 text-[0.8rem] text-red-dark">
          {c.offline}
        </p>
      )}

      {/* Messaggi */}
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
            <div
              className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-2.5 text-[0.92rem] leading-relaxed ${
                m.role === "user"
                  ? "bg-red text-white"
                  : m.error
                    ? "border border-red/25 bg-red-soft/50 text-red-dark"
                    : "border border-line bg-cream text-graphite"
              }`}
            >
              {m.content.split("\n").map((line, j) =>
                line.trim() === "" ? <br key={j} /> : <p key={j}>{line}</p>,
              )}
            </div>
            {m.error && (
              <button
                type="button"
                onClick={retry}
                disabled={loading || offline}
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-red/30 bg-paper px-3.5 py-2 text-[0.8rem] font-semibold text-red-dark transition-colors duration-200 hover:border-red hover:bg-red-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RetryIcon className="h-4 w-4" />
                {c.retry}
              </button>
            )}
            {m.listings && m.listings.length > 0 && (
              <div className="mt-3 flex w-full flex-col gap-2">
                {m.listings.slice(0, 4).map((p) => (
                  <a
                    key={p.slug}
                    href={p.url}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-paper p-2.5 transition-colors duration-300 hover:border-red/40"
                  >
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                      <Image src={p.cover} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-sm font-semibold text-ink group-hover:text-red">
                        {p.title}
                      </span>
                      <span className="block truncate text-[0.78rem] text-stone">{p.zone}</span>
                      <span className="block text-[0.8rem] font-semibold text-red-dark">{p.price}</span>
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Suggerimenti (solo all'inizio) */}
        {!conversationStarted && !loading && (
          <div className="flex flex-col items-start gap-2 pt-1">
            {c.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="min-h-11 rounded-full border border-line bg-cream px-4 py-2 text-left text-[0.82rem] text-graphite transition-colors duration-200 hover:border-red/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-1.5 pl-1" aria-hidden>
            <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
          </div>
        )}
      </div>

      {/* Contatti umani: tre canali distinti, sempre raggiungibili senza passare dalla chat. */}
      <div className="flex items-center gap-2 border-t border-line bg-paper px-3 py-2">
        <span className="shrink-0 text-[0.72rem] text-stone">{c.contact.intro}</span>
        <span className="flex flex-1 items-center justify-end gap-1.5">
          <a
            href={site.email.href}
            aria-label={c.contact.email}
            title={c.contact.email}
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-graphite transition-colors duration-200 hover:border-red/40 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <Mail className="h-5 w-5" />
          </a>
          <a
            href={site.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={c.contact.whatsapp}
            title={c.contact.whatsapp}
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-graphite transition-colors duration-200 hover:border-red/40 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <Whatsapp className="h-5 w-5" />
          </a>
          <a
            href={site.phone.href}
            aria-label={c.contact.phone}
            title={c.contact.phone}
            className="grid h-11 w-11 place-items-center rounded-full border border-line text-graphite transition-colors duration-200 hover:border-red/40 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <Phone className="h-5 w-5" />
          </a>
        </span>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2 border-t border-line bg-cream px-3 py-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={c.placeholder}
          maxLength={MAX_LEN}
          disabled={offline}
          className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-stone/60 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:opacity-50"
        />
        {loading ? (
          // Mentre la risposta arriva, lo stesso posto diventa "interrompi": una sola azione
          // possibile alla volta, sempre nello stesso punto sotto il pollice.
          <button
            type="button"
            onClick={stop}
            aria-label={c.stop}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-paper text-graphite transition-colors duration-200 hover:border-red hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
          >
            <StopIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || offline}
            aria-label={c.send}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-safe:active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon className="h-5 w-5" />
          </button>
        )}
      </form>
      <p className="bg-cream px-4 pb-3 text-center text-[0.68rem] leading-snug text-stone">{c.disclaimer}</p>
    </div>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-stone/50 motion-safe:animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

function ChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.1A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
    </svg>
  );
}

function SendIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function StopIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function NewChatIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.1A8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" />
      <path d="M12 8.5v6M9 11.5h6" />
    </svg>
  );
}

function RetryIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v4h-4" />
    </svg>
  );
}
