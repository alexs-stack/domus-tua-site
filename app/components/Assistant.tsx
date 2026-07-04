"use client";

import { useEffect, useRef, useState } from "react";
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

  // Focus sull'input all'apertura.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!ENABLED) return null;

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
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
        setMessages((m) => [...m, { role: "assistant", content: data.reply as string, listings: data.listings }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: c.error, error: true }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: c.error, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={c.launcher}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red text-white shadow-[0_20px_40px_-16px_rgba(210,10,10,0.7)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          <ChatIcon className="h-6 w-6" />
        </button>
      )}

      {/* Pannello */}
      {open && (
        <div
          role="dialog"
          aria-label={c.title}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          className="fixed inset-x-3 bottom-3 z-50 flex h-[72vh] max-h-[620px] flex-col overflow-hidden rounded-[1.6rem] border border-line bg-paper shadow-[0_50px_100px_-40px_rgba(26,24,22,0.6)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:h-[600px] sm:w-[390px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-line bg-cream px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red text-white">
                <ChatIcon className="h-5 w-5" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-base font-semibold text-ink">{c.title}</span>
                <span className="block text-[0.78rem] text-stone">{c.subtitle}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={c.close}
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone transition-colors duration-200 hover:bg-line/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Messaggi */}
          <div ref={listRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[0.92rem] leading-relaxed ${
                    m.role === "user"
                      ? "bg-red text-white"
                      : m.error
                        ? "border border-red/25 bg-red-soft/50 text-red-dark"
                        : "border border-line bg-cream text-graphite"
                  }`}
                >
                  {m.content}
                </div>
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
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
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
