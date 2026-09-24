"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale } from "./i18n/LocaleProvider";
import { getLenis } from "./motion/SmoothScroll";
import { readAssistantStream } from "../lib/assistant/client";
import AssistantLeadForm from "./AssistantLeadForm";
import { Cta } from "./primitives/Cta";
import { hasOverlay, subscribeOverlays } from "../lib/ui/overlays";
import { site } from "../lib/site";
import type { Handoff } from "../lib/assistant/types";

// Telefono: dalla fonte unica app/lib/site.ts (dato pubblico, sicuro nel bundle client).
// NON da lib/assistant/config, che legge variabili server-only.
const PHONE_HREF = site.phone.href;

// Assistente conversazionale on-brand. Opt-in: mostrato solo se
// NEXT_PUBLIC_ENABLE_ASSISTANT === "true" (il backend richiede ANTHROPIC_API_KEY).
const ENABLED = process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === "true";

type Card = { slug: string; title: string; zone: string; price: string; url: string; cover: string };
type Msg = {
  role: "user" | "assistant";
  content: string;
  listings?: Card[];
  handoffs?: Handoff[];
  intro?: boolean;
  error?: boolean;
  /** La risposta è arrivata a metà: mostriamo una nota sotto al testo già ricevuto. */
  incomplete?: boolean;
};

// "Assistente Raffaela" è un nome proprio di marca, come Open Domus e Domus D.O.C.:
// resta identico in tutte e cinque le lingue e NON si traduce. La grafia è "Raffaela",
// una sola L — la stessa con cui la fondatrice si firma (vedi app/lib/team.ts).
// Il disclaimer dice in chiaro che porta la sua voce senza essere lei: è la riga che
// tiene insieme il calore della persona e l'onestà verso chi scrive.
const copy = {
  it: {
    launcher: "Scrivi ad Assistente Raffaela",
    title: "Assistente Raffaela",
    subtitle: "Ti aiuto a trovare casa, con calma",
    close: "Chiudi",
    placeholder: "Scrivi qui la tua domanda…",
    send: "Invia",
    greeting: "Ciao, sono Assistente Raffaela. Posso aiutarti a cercare casa, a capire come si vende o a togliere qualche dubbio: qui nessuno ha fretta. Da dove partiamo?",
    whatsappCta: "Parla con noi su WhatsApp",
    suggestions: ["Cerco una villa", "Vorrei vendere casa", "Come funziona Open Domus?", "Voglio parlare con voi"],
    error: "Ops, qualcosa è andato storto. Riprova o scrivici su WhatsApp.",
    rateLimited: "Hai scritto molti messaggi di fila. Riprova tra un minuto, oppure scrivici su WhatsApp.",
    incomplete: "La risposta si è interrotta. Chiedimi di continuare, o scrivici su WhatsApp.",
    retry: "Riprova",
    stop: "Ferma",
    call: "Chiama",
    reset: "Nuova conversazione",
    offline: "Sembri offline. Controlla la connessione e riprova.",
    followUps: ["Confronta le prime due", "Qualcosa in un comune vicino"],
    disclaimer: "Assistente virtuale: porto la voce di Raffaela, non sono lei. La conversazione non viene conservata.",
    privacy: "Informativa privacy",
  },
  en: {
    launcher: "Message Assistente Raffaela",
    title: "Assistente Raffaela",
    subtitle: "I’ll help you find a home, unhurried",
    close: "Close",
    placeholder: "Type your question here…",
    send: "Send",
    greeting: "Hi, I’m Assistente Raffaela. I can help you look for a home, understand how selling works, or clear up a doubt — nobody is in a hurry here. Where shall we start?",
    whatsappCta: "Talk to us on WhatsApp",
    suggestions: ["I’m looking for a villa", "I’d like to sell my home", "How does Open Domus work?", "I’d like to talk to someone"],
    error: "Oops, something went wrong. Please try again or message us on WhatsApp.",
    rateLimited: "That’s a lot of messages in a row. Try again in a minute, or message us on WhatsApp.",
    incomplete: "The answer stopped early. Ask me to continue, or message us on WhatsApp.",
    retry: "Try again",
    stop: "Stop",
    call: "Call",
    reset: "New conversation",
    offline: "You seem to be offline. Check your connection and try again.",
    followUps: ["Compare the first two", "Something in a nearby town"],
    disclaimer: "Virtual assistant: I carry Raffaela’s voice, I am not her. This conversation is not stored.",
    privacy: "Privacy policy",
  },
  fr: {
    launcher: "Écrire à Assistente Raffaela",
    title: "Assistente Raffaela",
    subtitle: "Je vous aide à trouver un bien, sans hâte",
    close: "Fermer",
    placeholder: "Écrivez votre question ici…",
    send: "Envoyer",
    greeting: "Bonjour, je suis Assistente Raffaela. Je peux vous aider à chercher un bien, à comprendre comment vendre ou à lever un doute : ici, rien ne presse. Par où commençons-nous ?",
    whatsappCta: "Parlez-nous sur WhatsApp",
    suggestions: ["Je cherche une villa", "Je voudrais vendre mon bien", "Comment fonctionne Open Domus ?", "Je voudrais vous parler"],
    error: "Oups, une erreur est survenue. Réessayez ou écrivez-nous sur WhatsApp.",
    rateLimited: "Beaucoup de messages d’affilée. Réessayez dans une minute, ou écrivez-nous sur WhatsApp.",
    incomplete: "La réponse s’est interrompue. Demandez-moi de continuer, ou écrivez-nous sur WhatsApp.",
    retry: "Réessayer",
    stop: "Arrêter",
    call: "Appeler",
    reset: "Nouvelle conversation",
    offline: "Vous semblez hors ligne. Vérifiez la connexion et réessayez.",
    followUps: ["Comparez les deux premiers", "Quelque chose dans une commune voisine"],
    disclaimer: "Assistant virtuel : je porte la voix de Raffaela, je ne suis pas elle. Cette conversation n’est pas conservée.",
    privacy: "Politique de confidentialité",
  },
  de: {
    launcher: "Assistente Raffaela schreiben",
    title: "Assistente Raffaela",
    subtitle: "Ich helfe Ihnen in Ruhe bei der Haussuche",
    close: "Schließen",
    placeholder: "Schreiben Sie hier Ihre Frage…",
    send: "Senden",
    greeting: "Hallo, ich bin Assistente Raffaela. Ich helfe Ihnen beim Suchen, beim Verkaufen oder bei einer offenen Frage — hier drängt nichts. Wo fangen wir an?",
    whatsappCta: "Sprechen Sie mit uns auf WhatsApp",
    suggestions: ["Ich suche eine Villa", "Ich möchte verkaufen", "Wie funktioniert Open Domus?", "Ich möchte mit jemandem sprechen"],
    error: "Ups, etwas ist schiefgelaufen. Bitte erneut versuchen oder auf WhatsApp schreiben.",
    rateLimited: "Das waren viele Nachrichten hintereinander. Bitte in einer Minute erneut versuchen oder auf WhatsApp schreiben.",
    incomplete: "Die Antwort wurde unterbrochen. Bitten Sie mich fortzufahren oder schreiben Sie auf WhatsApp.",
    retry: "Erneut versuchen",
    stop: "Stopp",
    call: "Anrufen",
    reset: "Neues Gespräch",
    offline: "Sie scheinen offline zu sein. Prüfen Sie die Verbindung und versuchen Sie es erneut.",
    followUps: ["Die ersten beiden vergleichen", "Etwas in einer Nachbargemeinde"],
    disclaimer: "Virtueller Assistent: Ich spreche mit Raffaelas Stimme, bin aber nicht sie. Dieses Gespräch wird nicht gespeichert.",
    privacy: "Datenschutz",
  },
  es: {
    launcher: "Escribe a Assistente Raffaela",
    title: "Assistente Raffaela",
    subtitle: "Te ayudo a encontrar casa, con calma",
    close: "Cerrar",
    placeholder: "Escribe aquí tu pregunta…",
    send: "Enviar",
    greeting: "Hola, soy Assistente Raffaela. Puedo ayudarte a buscar casa, a entender cómo se vende o a resolver una duda: aquí nadie tiene prisa. ¿Por dónde empezamos?",
    whatsappCta: "Habla con nosotras por WhatsApp",
    suggestions: ["Busco una villa", "Quiero vender mi casa", "¿Cómo funciona Open Domus?", "Quiero hablar con vosotros"],
    error: "Vaya, algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.",
    rateLimited: "Has enviado muchos mensajes seguidos. Inténtalo en un minuto, o escríbenos por WhatsApp.",
    incomplete: "La respuesta se ha interrumpido. Pídeme que continúe, o escríbenos por WhatsApp.",
    retry: "Reintentar",
    stop: "Detener",
    call: "Llamar",
    reset: "Nueva conversación",
    offline: "Pareces estar sin conexión. Comprueba la conexión e inténtalo de nuevo.",
    followUps: ["Compara los dos primeros", "Algo en un municipio cercano"],
    disclaimer: "Asistente virtual: llevo la voz de Raffaela, pero no soy ella. Esta conversación no se conserva.",
    privacy: "Política de privacidad",
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
  // Turno in corso: serve a interromperlo (pulsante "ferma", chiusura del pannello).
  const abortRef = useRef<AbortController | null>(null);
  /**
   * Numero del turno corrente.
   *
   * Serve a impedire che una richiesta ormai superata scriva sullo stato di quella dopo.
   * Il caso che l'ha resa necessaria: premendo «Nuova conversazione» mentre una risposta era
   * in arrivo, il turno annullato eseguiva la sua pulizia e rimuoveva l'ultimo messaggio —
   * che nel frattempo era diventato il SALUTO della conversazione nuova, che spariva.
   */
  const turnoRef = useRef(0);
  // Elemento a cui restituire il focus alla chiusura (chi aveva il focus all'apertura).
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Ultima risposta dell'assistente da annunciare allo screen reader (solo quella).
  const [liveReply, setLiveReply] = useState("");
  // Un'altra superficie a tutto schermo è aperta (banner cookie, menu mobile): il launcher
  // fisso si toglie di mezzo invece di galleggiarci davanti.
  const [blocked, setBlocked] = useState(false);
  // Altezza utile del pannello: su mobile la tastiera riduce la visualViewport e senza
  // questo l'input finirebbe sotto i tasti, cioè fuori dallo schermo.
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setBlocked(hasOverlay());
    sync();
    return subscribeOverlays(sync);
  }, []);

  // La tastiera mobile non emette resize su window: solo su visualViewport. Seguirla è
  // l'unico modo perché il campo di scrittura resti visibile mentre si digita.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return;
    const sync = () => setViewportHeight(vv.height);
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      setViewportHeight(null);
    };
  }, [open]);

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

  // Smontaggio: chiudi il turno in corso, così non si pagano token per una risposta
  // che nessuno leggerà più.
  useEffect(() => () => abortRef.current?.abort(), []);

  // All'apertura: memorizza il focus corrente e spostalo sul dialog/input.
  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement ? active : null;
    // Preferisci l'input; in fallback il dialog stesso.
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

  // Chiusura: interrompe la risposta in corso (nessuno la leggerà: sono token pagati a
  // vuoto) e ripristina il focus al launcher, o a chi lo aveva prima.
  const close = useCallback(() => {
    abortRef.current?.abort();
    setOpen(false);
    const target = returnFocusRef.current;
    // `document.body` non è un punto di ritorno utile: chi usa la tastiera si ritroverebbe
    // all'inizio della pagina invece che sul launcher. Succede su Safari, che a differenza
    // di Chrome non dà il focus a un pulsante quando lo si clicca: all'apertura l'elemento
    // "attivo" era quindi il body.
    if (target && target !== document.body && document.contains(target)) target.focus();
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
      // La bolla dell'assistente nasce vuota e si riempie mentre lo stream arriva.
      setMessages([...next, { role: "assistant", content: "" }]);
      setInput("");
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const mioTurno = ++turnoRef.current;
      /** false quando la conversazione è stata azzerata o un altro turno è partito. */
      const attuale = () => turnoRef.current === mioTurno;
      let streamed = false;
      /** Avviso d'errore già mostrato all'utente: evita di sovrascriverlo con uno generico. */
      let shown = "";

      /** Aggiorna l'ultima bolla (quella in costruzione) senza toccare le precedenti. */
      const patchLast = (patch: (m: Msg) => Msg) => {
        if (!attuale()) return;
        setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? patch(m) : m)));
      };

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            pagePath: window.location.pathname,
            // Gli slug degli immobili già mostrati tornano al server: è così che
            // l'assistente capisce "la seconda" o "confronta le prime due".
            messages: next
              .filter((m) => !m.intro)
              .map((m) => ({
                role: m.role,
                content: m.content,
                ...(m.listings?.length ? { listingSlugs: m.listings.map((l) => l.slug) } : {}),
              })),
          }),
        });

        let reply = "";
        for await (const event of readAssistantStream(res)) {
          if (event.type === "text") {
            streamed = true;
            reply += event.value;
            patchLast((m) => ({ ...m, content: reply }));
          } else if (event.type === "listings") {
            patchLast((m) => ({ ...m, listings: [...(m.listings ?? []), ...event.value] }));
          } else if (event.type === "handoff") {
            patchLast((m) => ({ ...m, handoffs: [...(m.handoffs ?? []), event.value] }));
          } else if (event.type === "incomplete") {
            patchLast((m) => ({ ...m, incomplete: true }));
          } else if (event.type === "error" && !streamed) {
            // Il rate limit è l'unico caso in cui l'utente può fare qualcosa di preciso
            // (aspettare): merita un messaggio suo, non l'errore generico.
            shown = event.value.code === "rate-limited" ? c.rateLimited : c.error;
            patchLast(() => ({ role: "assistant", content: shown, error: true }));
          }
        }

        // Nessun testo e nessun errore già mostrato (es. connessione caduta a metà):
        // meglio l'avviso generico che una bolla vuota. Il messaggio di rate limit,
        // se c'è già, non va sovrascritto.
        if (!reply.trim() && !shown) {
          shown = c.error;
          patchLast(() => ({ role: "assistant", content: c.error, error: true }));
        }
        if (attuale()) setLiveReply(reply.trim() || shown || c.error);
      } catch (err) {
        // Interruzione volontaria: teniamo il testo già arrivato, senza avviso d'errore.
        if (err instanceof DOMException && err.name === "AbortError") {
          // Solo se questo è ancora il turno corrente: dopo un azzeramento l'ultimo
          // messaggio è il saluto nuovo, che non va toccato.
          if (!streamed && attuale()) setMessages((prev) => prev.slice(0, -1));
        } else {
          // Connessione assente: dirlo com'è evita che l'utente riprovi a vuoto
          // pensando che il problema sia il sito.
          const testo = navigator.onLine === false ? c.offline : c.error;
          patchLast(() => ({ role: "assistant", content: testo, error: true }));
          if (attuale()) setLiveReply(testo);
        }
      } finally {
        if (attuale()) {
          abortRef.current = null;
          setLoading(false);
        }
      }
    },
    [loading, messages, c.error, c.rateLimited, c.offline],
  );

  /** Ferma la risposta in corso: annulla la fetch e, a cascata, la chiamata al provider. */
  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /** Riparte da zero. Nulla da cancellare altrove: la conversazione vive solo qui. */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    // Invalida il turno in volo: da qui in poi non può più scrivere nulla.
    turnoRef.current += 1;
    setLoading(false);
    setMessages([{ role: "assistant", content: c.greeting, intro: true }]);
    setInput("");
    setLiveReply("");
    inputRef.current?.focus();
  }, [c.greeting]);

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
        // Aggancio per il footer: da qui globals.css capisce che la chat è montata e
        // riserva lo spazio in fondo alla pagina. Con la chat spenta niente attributo,
        // niente spazio morto — e in produzione oggi è spenta.
        data-assistant-launcher
        className={`fixed right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red text-white shadow-[0_20px_40px_-16px_rgba(210,10,10,0.7)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-reduce:transition-none ${
          open || blocked ? "pointer-events-none scale-90 opacity-0" : "opacity-100"
        }`}
        // Su mobile sta sopra la MobileActionBar (alta ~3.5rem + safe area); su desktop
        // sopra il pulsante WhatsApp fisso (bottom-5). Entrambi calcolati, non a occhio.
        style={{ bottom: "calc(5.25rem + env(safe-area-inset-bottom))" }}
        {...(open || blocked ? { tabIndex: -1, "aria-hidden": true } : {})}
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
          data-lenis-prevent
          onKeyDown={onKeyDown}
          className="fixed inset-x-0 bottom-0 z-[60] flex flex-col overflow-hidden rounded-t-[1.6rem] border border-line bg-paper shadow-[0_50px_100px_-40px_rgba(26,24,22,0.6)] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[390px] sm:rounded-[1.6rem]"
          style={{
            // Con la tastiera aperta seguiamo la visualViewport: il pannello si accorcia e
            // il campo di scrittura resta sopra i tasti. Senza tastiera (o su desktop)
            // vale il limite normale. `dvh` gestisce la barra del browser mobile.
            height: viewportHeight
              ? `min(${Math.round(viewportHeight)}px, 620px)`
              : "min(80dvh, 620px)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
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
            <span className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={reset}
              aria-label={c.reset}
              title={c.reset}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-stone transition-colors duration-200 hover:bg-line/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-reduce:transition-none"
            >
              <RetryIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={close}
              aria-label={c.close}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-stone transition-colors duration-200 hover:bg-line/60 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            </span>
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
                  {m.content
                    ? m.content
                        .split("\n")
                        .map((line, j) => (line.trim() === "" ? <br key={j} /> : <p key={j}>{line}</p>))
                    : /* Bolla ancora vuota: i puntini stanno DENTRO, così l'altezza non salta
                         quando arriva il primo token. */
                      <span className="flex items-center gap-1.5 py-0.5" aria-hidden>
                        <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
                      </span>}
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
                {m.incomplete && (
                  <p className="mt-1.5 max-w-[85%] text-[0.76rem] leading-snug text-stone">
                    {c.incomplete}
                  </p>
                )}
                {m.handoffs?.map((h, k) =>
                  h.kind === "email" ? (
                    // Modulo in chat: l'invio è server-side e il successo compare solo
                    // dopo la conferma del provider.
                    <AssistantLeadForm
                      key={k}
                      handoff={h}
                      whatsappUrl={m.handoffs?.find((x) => x.kind === "whatsapp")?.url}
                      phoneHref={PHONE_HREF}
                    />
                  ) : (
                    <div key={k} className="mt-3 flex flex-wrap gap-2">
                      <Cta
                        href={h.url}
                        variant="cta-solid"
                        size="sm"
                        arrow={false}
                        className="min-h-11"
                        target={h.kind === "whatsapp" ? "_blank" : undefined}
                        rel={h.kind === "whatsapp" ? "noopener noreferrer" : undefined}
                      >
                        {/* L'etichetta WhatsApp la decide QUI il client, non il tool.
                            Il tool server-side la scriveva in italiano fisso («Scrivi su
                            WhatsApp»), e su un sito in cinque lingue quella riga arrivava
                            uguale a chiunque — oltre a essere una nona variante di una
                            famiglia che il §6.7 vuole con UNA formula sola. Il tool non
                            conosce la lingua della conversazione; il client sì, e il
                            dizionario ce l'ha già. Le altre etichette di handoff restano
                            quelle del tool: non sono CTA di famiglia. */}
                        {h.kind === "whatsapp" ? c.whatsappCta : h.label}
                      </Cta>
                      {/* Su mobile la telefonata è spesso il canale più rapido. */}
                      <Cta
                        href={PHONE_HREF}
                        variant="ghost"
                        size="sm"
                        arrow={false}
                        className="min-h-11 sm:hidden"
                      >
                        {c.call}
                      </Cta>
                    </div>
                  ),
                )}
                {m.listings && m.listings.length > 0 && (
                  <div className="mt-3 flex w-full flex-col gap-2">
                    {m.listings.slice(0, 4).map((p) => (
                      <a
                        key={p.slug}
                        href={p.url}
                        className="group flex items-center gap-3 rounded-2xl border border-line bg-paper p-2.5 transition-colors duration-300 hover:border-red/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-reduce:transition-none"
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

            {/* Suggerimenti di seguito: proposti SOLO dopo una risposta con immobili, e
                solo per cose che l'assistente sa davvero fare (confronto, comuni vicini). */}
            {!loading &&
              messages.length > 1 &&
              (messages[messages.length - 1].listings?.length ?? 0) >= 2 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {c.followUps.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="min-h-11 rounded-full border border-line bg-cream px-4 py-2 text-left text-[0.82rem] text-graphite transition-colors duration-200 hover:border-red/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-reduce:transition-none"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

            {/* Suggerimenti iniziali */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-col items-start gap-2 pt-1">
                {c.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="min-h-11 rounded-full border border-line bg-cream px-4 py-2 text-left text-[0.82rem] text-graphite transition-colors duration-200 hover:border-red/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-reduce:transition-none"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[0.8rem] font-semibold text-graphite transition-colors duration-200 hover:border-red/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                >
                  <StopIcon className="h-3.5 w-3.5" />
                  {c.stop}
                </button>
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
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-stone/60 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label={c.send}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-red-dark active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
          <p className="bg-cream px-4 pb-3 text-center text-[0.68rem] leading-snug text-stone">
            {c.disclaimer}{" "}
            <a href="/privacy" className="underline transition-colors duration-200 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red motion-reduce:transition-none">
              {c.privacy}
            </a>
          </p>
        </div>
      )}
    </>
  );
}

// Puntini dell'indicatore di scrittura: respirano (vedi `dt-typing` in globals.css),
// non rimbalzano. Il rimbalzo verticale della prima versione era l'unico gesto del
// sito a muoversi a scatti, e su una superficie che si muove sempre per attenuazione
// si notava. (Il nome della vecchia utility non è citato apposta: il rilevatore
// legge anche i commenti e lo segnalerebbe qui, dove non c'è più.)
function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="dt-typing-dot inline-block h-2 w-2 rounded-full bg-stone/50 motion-reduce:animate-none"
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

function StopIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="2.5" />
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
