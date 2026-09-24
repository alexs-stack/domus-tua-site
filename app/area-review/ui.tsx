"use client";

// I componenti della redazione d'area.
//
// Client components solo per una ragione: `useActionState`, che dà il riscontro dell'azione
// senza ricaricare la pagina e senza scrivere a mano lo stato di caricamento. Nessuna logica di
// dominio qui dentro — le decisioni le prende il servizio, questi componenti disegnano e basta.
//
// LA COSA CHE QUESTA INTERFACCIA DEVE FARE BENE: mostrare, accanto a ogni fatto, il motivo per
// cui non si può approvare. Un'interfaccia che nasconde i motivi finché non si preme il pulsante
// insegna a riprovare; una che li mostra prima insegna a correggere.

import { useActionState } from "react";

import {
  signIn,
  signOut,
  approveFact,
  rejectFact,
  approveNarrative,
  publishProfile,
  unpublishProfile,
  markInsufficient,
  requestRegeneration,
  type ActionResult,
} from "./actions";
import type { AreaDetail, QueueRow } from "../lib/territory/area/review/service";

// ─────────────────────────────────────────────────────────────
// Pezzi comuni
// ─────────────────────────────────────────────────────────────

function Feedback({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return (
    <div
      role="status"
      className={`mt-2 rounded border p-3 text-sm ${
        state.ok ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
      }`}
    >
      <p>{state.message}</p>
      {state.reasons && state.reasons.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-xs">
          {state.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

const FIELD = "w-full rounded border border-gray-300 px-3 py-2 text-sm";
const BUTTON = "rounded bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50";
const BUTTON_QUIET = "rounded border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50";

// ─────────────────────────────────────────────────────────────
// Accesso
// ─────────────────────────────────────────────────────────────

export function AreaReviewSignIn() {
  const [state, action, pending] = useActionState(signIn, null);
  return (
    <>
      <h1 className="text-2xl font-semibold">Redazione d&apos;area</h1>
      <p className="mt-3 text-sm text-gray-600">
        Incolla il token emesso da <code>npm run area:token</code>. Non esiste una pagina di
        accesso pubblica: il token porta l&apos;identità e il ruolo di una persona, ed è ciò che
        finisce nell&apos;audit.
      </p>
      <form action={action} className="mt-6 flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="token">
          Token
        </label>
        <input id="token" name="token" type="password" required className={FIELD} autoComplete="off" />
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? "Verifica…" : "Entra"}
        </button>
      </form>
      <Feedback state={state} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Coda
// ─────────────────────────────────────────────────────────────

export function AreaReviewQueue({ rows }: { rows: QueueRow[] }) {
  const [, exit, exiting] = useActionState(signOut, null);

  if (rows.length === 0) {
    return (
      <div className="mt-10">
        <p className="text-sm text-gray-600">
          Nessuna area in coda. È l&apos;esito corretto finché l&apos;automazione non ha ancora
          incontrato immobili con un&apos;area risolvibile.
        </p>
        <form action={exit} className="mt-8">
          <button type="submit" disabled={exiting} className={BUTTON_QUIET}>
            Esci
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="py-2">Area</th>
            <th className="py-2">Stato</th>
            <th className="py-2 text-right">Da decidere</th>
            <th className="py-2 text-right">Approvati</th>
            <th className="py-2 text-right">Conflitti</th>
            <th className="py-2 text-right">Fonti scadute</th>
            <th className="py-2 text-right">Immobili</th>
            <th className="py-2">Narrativa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.areaKey} className="border-b align-top">
              <td className="py-2">
                <a
                  className="font-medium underline"
                  href={`/area-review?area=${encodeURIComponent(row.areaKey)}`}
                >
                  {row.label}
                </a>
                <div className="font-mono text-[0.7rem] text-gray-500">{row.areaKey}</div>
              </td>
              <td className="py-2">{row.profileStatus}</td>
              {/* I numeri incolonnati a destra: si confrontano a colpo d'occhio fra righe. */}
              <td className="py-2 text-right tabular-nums">{row.candidateFacts}</td>
              <td className="py-2 text-right tabular-nums">{row.approvedFacts}</td>
              <td className="py-2 text-right tabular-nums">
                {row.conflictedFacts > 0 ? <strong>{row.conflictedFacts}</strong> : row.conflictedFacts}
              </td>
              <td className="py-2 text-right tabular-nums">{row.staleSources}</td>
              <td className="py-2 text-right tabular-nums">{row.listings}</td>
              <td className="py-2">
                {row.narrativeStatus ?? "—"}
                {row.narrativeScore !== null ? ` (${row.narrativeScore})` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form action={exit} className="mt-8">
        <button type="submit" disabled={exiting} className={BUTTON_QUIET}>
          Esci
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dettaglio
// ─────────────────────────────────────────────────────────────

/** Un modulo con una motivazione obbligatoria. È la forma di quasi tutte le azioni qui. */
function ReasonForm({
  action,
  areaKey,
  label,
  placeholder,
  required = true,
  extra,
}: {
  action: (prev: ActionResult | null, data: FormData) => Promise<ActionResult>;
  areaKey: string;
  label: string;
  placeholder: string;
  required?: boolean;
  extra?: Record<string, string>;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <div>
      <form action={run} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="areaKey" value={areaKey} />
        {Object.entries(extra ?? {}).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input
          name="reason"
          required={required}
          placeholder={placeholder}
          className={`${FIELD} max-w-md flex-1`}
          aria-label={`Motivazione per: ${label}`}
        />
        <button type="submit" disabled={pending} className={BUTTON_QUIET}>
          {pending ? "…" : label}
        </button>
      </form>
      <Feedback state={state} />
    </div>
  );
}

export function AreaReviewDetail({ detail }: { detail: AreaDetail }) {
  const { profile, facts, sources, narrative, narrativeFailures, listings, history, permissions } = detail;
  const can = (p: string) => permissions.includes(p as never);

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div>
        <a className="text-sm underline" href="/area-review">
          ← Coda
        </a>
        <h2 className="mt-3 text-xl font-semibold">{profile.label}</h2>
        <p className="font-mono text-xs text-gray-500">{profile.areaKey}</p>
        <p className="mt-1 text-sm">
          Stato: <strong>{profile.status}</strong>
          {profile.approvedBy ? ` · approvato da ${profile.approvedBy}` : ""}
          {` · ${listings.length} immobili dipendono da quest'area`}
        </p>
      </div>

      {/* ── Fatti ─────────────────────────────────────────── */}
      <section>
        <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">
          Fatti ({facts.length})
        </h3>
        {facts.length === 0 && (
          <p className="mt-3 text-sm text-gray-600">
            Nessun fatto. Finché non ce n&apos;è almeno uno approvato, la sezione non compare sul
            sito — ed è il comportamento voluto.
          </p>
        )}
        <ul className="mt-4 flex flex-col gap-6">
          {facts.map((fact) => (
            <li key={fact.id} className="border-l-2 border-gray-200 pl-4">
              <p className="text-[0.7rem] uppercase tracking-wide text-gray-500">
                {fact.category} · {fact.scope} · <span className="font-mono">{fact.status}</span>
              </p>
              <p className="mt-1">{fact.text}</p>
              <p className="mt-1 text-xs text-gray-600">
                {fact.source.owner} ·{" "}
                <a href={fact.source.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                  fonte
                </a>{" "}
                · rivedere entro {fact.reviewBy.slice(0, 10)}
              </p>

              {/* I motivi del blocco, PRIMA del pulsante. */}
              {fact.violations.length > 0 && (
                <ul className="mt-2 list-disc rounded border border-amber-300 bg-amber-50 py-2 pl-8 pr-3 text-xs">
                  {fact.violations.map((v, i) => (
                    <li key={i}>
                      <span className="font-mono">{v.code}</span> — {v.message}
                      {v.evidence ? ` («${v.evidence}»)` : ""}
                    </li>
                  ))}
                </ul>
              )}

              {can("approve-fact") && fact.status !== "approved" && (
                <div className="mt-3 flex flex-col gap-2">
                  <ReasonForm
                    action={approveFact}
                    areaKey={profile.areaKey}
                    extra={{ factId: fact.id }}
                    label="Approva"
                    placeholder="Nota (facoltativa)"
                    required={false}
                  />
                  <ReasonForm
                    action={rejectFact}
                    areaKey={profile.areaKey}
                    extra={{ factId: fact.id }}
                    label="Rifiuta"
                    placeholder="Perché si rifiuta (obbligatorio)"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Fonti ─────────────────────────────────────────── */}
      <section>
        <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">
          Fonti ({sources.length})
        </h3>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {sources.map((s) => (
            <li key={s.sourceId}>
              <a href={s.canonicalUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                {s.canonicalUrl}
              </a>
              <span className="text-gray-600">
                {" "}
                — {s.owner} · {s.sourceType} · <span className="font-mono">{s.status}</span> · rivedere
                entro {s.reviewBy.slice(0, 10)}
              </span>
            </li>
          ))}
          {sources.length === 0 && <li className="text-gray-600">Nessuna fonte registrata.</li>}
        </ul>
      </section>

      {/* ── Narrativa ─────────────────────────────────────── */}
      <section>
        <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">Narrativa</h3>
        {!narrative && <p className="mt-3 text-sm text-gray-600">Nessuna narrativa generata.</p>}
        {narrative && (
          <div className="mt-4">
            <p className="text-sm">
              <strong>{narrative.title}</strong> · <span className="font-mono">{narrative.status}</span>
              {typeof narrative.qualityScore === "number" ? ` · punteggio ${narrative.qualityScore}/100` : " · nessun punteggio"}
            </p>
            <p className="mt-3 max-w-[68ch] text-sm leading-relaxed">{narrative.intro}</p>
            {narrative.sections.map((s, i) => (
              <div key={i} className="mt-4 max-w-[68ch]">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{s.heading}</p>
                <p className="mt-1 text-sm leading-relaxed">{s.body}</p>
                <p className="mt-1 font-mono text-[0.7rem] text-gray-500">{s.factIds.join(", ")}</p>
              </div>
            ))}

            {narrativeFailures.length > 0 && (
              <ul className="mt-4 list-disc rounded border border-red-300 bg-red-50 py-2 pl-8 pr-3 text-xs">
                {narrativeFailures.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {can("approve-narrative") && narrative.status !== "approved" && (
                <ReasonForm
                  action={approveNarrative}
                  areaKey={profile.areaKey}
                  label="Approva narrativa"
                  placeholder="Nota (facoltativa)"
                  required={false}
                />
              )}
              {can("regenerate") && (
                <ReasonForm
                  action={requestRegeneration}
                  areaKey={profile.areaKey}
                  label="Rigenera"
                  placeholder="Perché rigenerare"
                />
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Pubblicazione ─────────────────────────────────── */}
      <section>
        <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">Pubblicazione</h3>
        <div className="mt-4 flex flex-col gap-2">
          {can("publish") && profile.status !== "approved" && (
            <ReasonForm
              action={publishProfile}
              areaKey={profile.areaKey}
              label="Pubblica"
              placeholder="Perché quest'area esce (obbligatorio)"
            />
          )}
          {can("publish") && profile.status === "approved" && (
            <ReasonForm
              action={unpublishProfile}
              areaKey={profile.areaKey}
              label="Ritira"
              placeholder="Perché si ritira (obbligatorio)"
            />
          )}
          {can("approve-narrative") && profile.status !== "insufficient-evidence" && (
            <ReasonForm
              action={markInsufficient}
              areaKey={profile.areaKey}
              label="Prove insufficienti"
              placeholder="Cosa manca, per chi riaprirà"
            />
          )}
        </div>
      </section>

      {/* ── Storia ────────────────────────────────────────── */}
      <section>
        <h3 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide">
          Storia ({history.length})
        </h3>
        <ol className="mt-4 flex flex-col gap-1 text-xs">
          {history.map((e) => (
            <li key={e.id}>
              <span className="font-mono">{e.at.slice(0, 16).replace("T", " ")}</span> · {e.actor} ·{" "}
              <strong>{e.action}</strong> · {e.subject}/{e.subjectId}
              {e.reason ? ` — ${e.reason}` : ""}
            </li>
          ))}
          {history.length === 0 && <li className="text-gray-600">Nessun evento.</li>}
        </ol>
      </section>
    </div>
  );
}
