"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "./i18n/LocaleProvider";

// Assistente conversazionale on-brand. Opt-in: mostrato solo se
// NEXT_PUBLIC_ENABLE_ASSISTANT === "true" (il backend richiede ANTHROPIC_API_KEY).
const ENABLED = process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true";

type Card = { slug: string; title: string; zone: string; price: string; url: string; cover: string };
type Msg = { role: "user" | "assistant"; content: string; listings?: Card[]; intro?: boolean; error?: boolean };

const copy = {
  it: {
    launcher: "Apri l’assistente Domus Tua",
    title: "Assistente Domus Tua",
    subtitle: "Ti aiuto a trovare casa",
    close: "Chiudi",
    placeholder: "Scrivi qui la tua domanda…",
    send: "Invia",
    greeting: "Ciao! Sono l’assistente di Domus Tua. Posso aiutarti a trovare casa o raccontarti come lavoriamo. Cosa stai cercando?",
    suggestions: ["Trilocale con giardino a Tradate", "Cos’è Domus D.O.C.?", "Vorrei vendere casa"],
    error: "Ops, qualcosa è andato storto. Riprova o scrivici su WhatsApp.",
    retry: "Riprova",
    disclaimer: "Assistente virtuale. Gli immobili citati provengono dai nostri annunci.",
  },
  en: {
    launcher: "Open the Domus Tua assistant",
    title: "Domus Tua assistant",
    subtitle: "I’ll help you find a home",
    close: "Close",
    placeholder: "Type your question here…",
    send: "Send",
    greeting: "Hi! I’m the Domus Tua assistant. I can help you find a home or explain how we work. What are you looking for?",
    suggestions: ["Two-bed with garden in Tradate", "What is Domus D.O.C.?", "I’d like to sell my home"],
    error: "Oops, something went wrong. Please try again or message us on WhatsApp.",
    retry: "Try again",
    disclaimer: "Virtual assistant. Any listings shown come from our own portfolio.",
  },
  fr: {
    launcher: "Ouvrir l’assistant Domus Tua",
    title: "Assistant Domus Tua",
    subtitle: "Je vous aide à trouver un bien",
    close: "Fermer",
    placeholder: "Écrivez votre question ici…",
    send: "Envoyer",
    greeting: "Bonjour ! Je suis l’assistant de Domus Tua. Je peux vous aider à trouver un bien ou vous expliquer notre méthode. Que cherchez-vous ?",
    suggestions: ["Trois-pièces avec jardin à Tradate", "Qu’est-ce que Domus D.O.C. ?", "Je voudrais vendre mon bien"],
    error: "Oups, une erreur est survenue. Réessayez ou écrivez-nous sur WhatsApp.",
    retry: "Réessayer",
    disclaimer: "Assistant virtuel. Les biens mentionnés proviennent de nos annonces.",
  },
  de: {
    launcher: "Domus-Tua-Assistenten öffnen",
    title: "Domus-Tua-Assistent",
    subtitle: "Ich helfe Ihnen, ein Zuhause zu finden",
    close: "Schließen",
    placeholder: "Schreiben Sie hier Ihre Frage…",
    send: "Senden",
    greeting: "Hallo! Ich bin der Assistent von Domus Tua. Ich helfe Ihnen, ein Zuhause zu finden, oder erkläre, wie wir arbeiten. Wonach suchen Sie?",
    suggestions: ["Dreizimmerwohnung mit Garten in Tradate", "Was ist Domus D.O.C.?", "Ich möchte verkaufen"],
    error: "Ups, etwas ist schiefgelaufen. Bitte erneut versuchen oder auf WhatsApp schreiben.",
    retry: "Erneut versuchen",
    disclaimer: "Virtueller Assistent. Genannte Objekte stammen aus unseren Angeboten.",
  },
  es: {
    launcher: "Abrir el asistente de Domus Tua",
    title: "Asistente Domus Tua",
    subtitle: "Te ayudo a encontrar casa",
    close: "Cerrar",
    placeholder: "Escribe aquí tu pregunta…",
    send: "Enviar",
    greeting: "¡Hola! Soy el asistente de Domus Tua. Puedo ayudarte a encontrar casa o contarte cómo trabajamos. ¿Qué estás buscando?",
    suggestions: ["Piso de tres ambientes con jardín en Tradate", "¿Qué es Domus D.O.C.?", "Quiero vender mi casa"],
    error: "Vaya, algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.",
    retry: "Reintentar",
    disclaimer: "Asistente virtual. Los inmuebles mostrados provienen de nuestros anuncios.",
  },
} as const;

export default function Assistant() {
  const { locale } = useLocale();
  const c = copy[locale];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: c.greeting, intro: true }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  // Elemento a cui restituire il focus alla chiusura (chi aveva il focus all'apertura).
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Ultima risposta dell'assistente da annunciare allo screen reader (solo quella).
  const [liveReply, setLiveReply] = useState("");

  // Aggiorna il saluto se cambia lingua e la conversazione è solo il saluto.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMessages((m) =>
      m.length === 1 && m[0].intro ? [{ role: "assistant", content: c.greeting, intro: true }] : m,
    );
  }, [c.greeting]);

  // Scroll in fondo a ogni nuovo messaggio / stato di caricamento.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // All'apertura: memorizza il focus corrente e spostalo sul dialog/input.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
    // Preferisci l'input; in fallback il dialog stesso.
    (inputRef.current ?? dialogRef.current)?.focus();
  }, [open]);

  // Blocca lo scroll del body mentre il dialog è aperto; ripristina alla chiusura/smontaggio.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [open]);

  // Chiusura: ripristina il focus al launcher (o a chi lo aveva prima).
  const close = useCallback(() => {
    setOpen(false);
    const target = returnFocusRef.current;
    if (target && document.contains(target)) target.focus();
    else launcherRef.current?.focus();
    returnFocusRef.current = null;
  }, []);

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
      const q = text.trim();
      if (!q || loading) return;
      // Base della conversazione: senza gli avvisi di errore (non vanno rimandati all'API).
      const base = (history ?? messages).filter((m) => !m.error);
      const next = [...base, { role: "user" as const, content: q }];
      setMessages(next);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            locale,
            messages: next.filter((m) => !m.intro).map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = (await res.json()) as { ok?: boolean; reply?: string; listings?: Card[] };
        if (data.ok && data.reply) {
          const reply = data.reply;
          setMessages((m) => [...m, { role: "assistant", content: reply, listings: data.listings }]);
          setLiveReply(reply);
        } else {
          setMessages((m) => [...m, { role: "assistant", content: c.error, error: true }]);
          setLiveReply(c.error);
        }
      } catch {
        setMessages((m) => [...m, { role: "assistant", content: c.error, error: true }]);
        setLiveReply(c.error);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, locale, c.error],
  );

  // Riprova: re-invia l'ultimo messaggio dell'utente ripartendo dalla storia
  // precedente (senza duplicare quel messaggio e senza gli avvisi di errore).
  const retry = useCallback(() => {
    const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;
    const priorHistory = messages.slice(0, lastUserIdx);
    void send(messages[lastUserIdx].content, priorHistory);
  }, [messages, send]);

  if (!ENABLED) return null;

  return (
    <>
      {/* Launcher — resta montato (nascosto quando il dialog è aperto) così il focus può
          tornare qui alla chiusura. Sopra la sede WhatsApp (bottom-5), quindi bottom-24. */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={c.launcher}
        aria-expanded={open}
        className={`fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red text-white shadow-[0_20px_40px_-16px_rgba(210,10,10,0.7)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
          open ? "pointer-events-none scale-90 opacity-0" : "opacity-100"
        }`}
        {...(open ? { tabIndex: -1, "aria-hidden": true } : {})}
      >
        <ChatIcon className="h-6 w-6" />
      </button>

      {/* Pannello — z sopra la sede WhatsApp (z-50). */}
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="assistant-title"
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className="fixed inset-x-3 bottom-3 z-[60] flex flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-[0_50px_100px_-40px_rgba(26,24,22,0.6)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[390px]"
          style={{ height: "min(85dvh, 620px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-line bg-cream px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-white">
                <ChatIcon className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span id="assistant-title" className="block font-display text-base font-semibold text-ink">
                  {c.title}
                </span>
                <span className="block text-[0.78rem] text-stone">{c.subtitle}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={c.close}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-stone transition-colors duration-200 hover:bg-line/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Annuncio SR: solo l'ultima risposta dell'assistente. */}
          <p aria-live="polite" className="sr-only">
            {liveReply}
          </p>

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
                    disabled={loading}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-red/30 bg-paper px-3.5 py-2 text-[0.8rem] font-semibold text-red-dark transition-colors duration-200 hover:border-red hover:bg-red-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:cursor-not-allowed disabled:opacity-40"
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
            {messages.length === 1 && !loading && (
              <div className="flex flex-col items-start gap-2 pt-1">
                {c.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-line bg-cream px-4 py-2 text-left text-[0.82rem] text-graphite transition-colors duration-200 hover:border-red/40 hover:text-ink"
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
              maxLength={1000}
              className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-stone/60 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={c.send}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
          <p className="bg-cream px-4 pb-3 text-center text-[0.68rem] leading-snug text-stone/80">{c.disclaimer}</p>
        </div>
      )}
    </>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-stone/50"
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

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
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

function RetryIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v4h-4" />
    </svg>
  );
}
