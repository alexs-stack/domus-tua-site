"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { Handoff } from "../lib/assistant/types";

// Mini-form per lasciare una richiesta scritta all'agenzia, dentro la chat.
//
// Vincoli che questo componente rispetta:
//  • il successo si mostra SOLO dopo la conferma del server (che a sua volta aspetta il
//    provider): mai un "inviato!" ottimistico;
//  • se il canale email non è configurato, l'errore è comprensibile e i canali umani
//    restano in vista;
//  • la conversazione non viene allegata: parte solo ciò che l'utente scrive qui.

type Stato = "compila" | "invio" | "inviato" | "errore";

const MESSAGGI_ERRORE: Record<string, string> = {
  "nome-mancante": "Manca il nome.",
  "contatto-mancante": "Serve un'email o un numero di telefono per ricontattarti.",
  "contatto-non-valido": "Controlla l'email o il numero di telefono.",
  "messaggio-mancante": "Scrivi due righe su cosa ti serve.",
  "consenso-mancante": "Serve il consenso al trattamento dei dati.",
  "troppi-link": "Il messaggio contiene troppi link. Togline qualcuno e riprova.",
  "rate-limited": "Hai già inviato alcune richieste. Riprova tra qualche minuto.",
  "email-non-configurata":
    "Non riesco a inoltrare la richiesta in questo momento. Scrivici su WhatsApp o chiamaci: ti rispondiamo subito.",
  "invio-fallito":
    "Non sono riuscito a inviare la richiesta. Riprova, oppure scrivici su WhatsApp.",
};
const ERRORE_GENERICO = "Qualcosa non ha funzionato. Riprova o scrivici su WhatsApp.";

export default function AssistantLeadForm({
  handoff,
  whatsappUrl,
  phoneHref,
}: {
  handoff: Extract<Handoff, { kind: "email" }>;
  whatsappUrl?: string;
  phoneHref: string;
}) {
  const id = useId();
  const [stato, setStato] = useState<Stato>("compila");
  const [errore, setErrore] = useState("");
  const messaggioRef = useRef<HTMLTextAreaElement | null>(null);

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (stato === "invio") return;

      const form = new FormData(e.currentTarget);
      setStato("invio");
      setErrore("");

      try {
        const res = await fetch("/api/assistant/lead", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            nome: String(form.get("nome") ?? ""),
            email: String(form.get("email") ?? "") || undefined,
            telefono: String(form.get("telefono") ?? "") || undefined,
            messaggio: String(form.get("messaggio") ?? ""),
            immobile: handoff.listingSlug,
            consenso: form.get("consenso") === "on",
            pagePath: window.location.pathname,
            // Honeypot: invisibile a chi usa il sito, compilato dai bot.
            azienda: String(form.get("azienda") ?? ""),
          }),
        });

        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string };
        if (data.ok) {
          setStato("inviato");
          return;
        }
        setErrore(MESSAGGI_ERRORE[data.code ?? ""] ?? ERRORE_GENERICO);
        setStato("errore");
      } catch {
        setErrore(ERRORE_GENERICO);
        setStato("errore");
      }
    },
    [handoff.listingSlug, stato],
  );

  if (stato === "inviato") {
    return (
      <p
        role="status"
        className="mt-3 rounded-2xl border border-line bg-cream px-4 py-3 text-[0.86rem] leading-relaxed text-graphite"
      >
        Richiesta inviata. Ti ricontattiamo appena possibile.
      </p>
    );
  }

  const inputClass =
    "min-h-11 w-full rounded-xl border border-line bg-paper px-3 py-2 text-[0.88rem] text-ink placeholder:text-stone/60 focus:border-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";
  const labelClass = "block text-[0.78rem] font-semibold text-graphite";

  return (
    <form
      onSubmit={submit}
      className="mt-3 w-full space-y-3 rounded-2xl border border-line bg-cream p-3.5"
      aria-labelledby={`${id}-titolo`}
    >
      <p id={`${id}-titolo`} className="text-[0.86rem] font-semibold text-ink">
        Lascia una richiesta
      </p>

      <div className="space-y-1">
        <label className={labelClass} htmlFor={`${id}-nome`}>
          Nome
        </label>
        <input id={`${id}-nome`} name="nome" required maxLength={80} autoComplete="name" className={inputClass} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass} htmlFor={`${id}-email`}>
            Email
          </label>
          <input id={`${id}-email`} name="email" type="email" maxLength={120} autoComplete="email" className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor={`${id}-telefono`}>
            Telefono
          </label>
          <input id={`${id}-telefono`} name="telefono" type="tel" maxLength={40} autoComplete="tel" className={inputClass} />
        </div>
      </div>
      <p className="text-[0.72rem] text-stone">Basta uno dei due: serve per ricontattarti.</p>

      <div className="space-y-1">
        <label className={labelClass} htmlFor={`${id}-messaggio`}>
          Messaggio
        </label>
        <textarea
          ref={messaggioRef}
          id={`${id}-messaggio`}
          name="messaggio"
          required
          rows={3}
          maxLength={1500}
          defaultValue={handoff.body}
          className={`${inputClass} resize-y`}
        />
      </div>

      {/* Honeypot: fuori dal flusso visivo e dalla navigazione, invisibile agli screen reader. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${id}-azienda`}>Azienda</label>
        <input id={`${id}-azienda`} name="azienda" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="flex items-start gap-2.5 text-[0.78rem] leading-snug text-graphite">
        <input
          name="consenso"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        />
        <span>
          Acconsento al trattamento dei dati per essere ricontattato.{" "}
          <a href="/privacy" className="underline hover:text-red">
            Informativa
          </a>
        </span>
      </label>

      {errore && (
        <p role="alert" className="rounded-xl border border-red/25 bg-red-soft/40 px-3 py-2 text-[0.8rem] text-red-dark">
          {errore}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={stato === "invio"}
          className="inline-flex min-h-11 items-center rounded-full bg-red px-4 py-2.5 text-[0.85rem] font-semibold text-white transition-colors duration-200 hover:bg-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red disabled:cursor-not-allowed disabled:opacity-50"
        >
          {stato === "invio" ? "Invio…" : "Invia richiesta"}
        </button>

        {/* Canali umani sempre in vista: se l'email non parte, restano questi. */}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-4 py-2.5 text-[0.85rem] font-semibold text-graphite transition-colors duration-200 hover:border-red/40 hover:text-ink"
          >
            WhatsApp
          </a>
        )}
        <a
          href={phoneHref}
          className="inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-4 py-2.5 text-[0.85rem] font-semibold text-graphite transition-colors duration-200 hover:border-red/40 hover:text-ink sm:hidden"
        >
          Chiama
        </a>
      </div>
    </form>
  );
}
