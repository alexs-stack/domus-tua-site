// La REDAZIONE d'area: coda e dettaglio (Prompt 10).
//
// Non è una pagina pubblica e non deve sembrarlo. Tre difese, in ordine:
//   • senza `AREA_REVIEW_SECRET` la rotta risponde 404 — non «accesso negato», che rivelerebbe
//     che c'è qualcosa dietro;
//   • senza sessione valida si vede solo il campo del token;
//   • ogni azione ricontrolla i permessi lato server: i pulsanti nascosti non sono una difesa.
//
// Grafica volutamente scarna. È uno strumento interno, e il tempo speso a farlo somigliare al
// sito è tempo tolto a ciò che questa pagina deve fare: mostrare, accanto a ogni fatto, il
// motivo per cui non si può approvare.

import { notFound } from "next/navigation";

import { currentSession, reviewService } from "./session";
import { isReviewConfigured } from "../lib/territory/area/review/auth";
import { AreaReviewSignIn, AreaReviewQueue, AreaReviewDetail } from "./ui";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false }, title: "Redazione d'area" };

export default async function AreaReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  // Redazione non configurata = non esiste. 404, non 403.
  if (!isReviewConfigured()) notFound();

  const session = await currentSession();
  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <AreaReviewSignIn />
      </main>
    );
  }

  // Lo storage può non essere configurato: si dice, invece di far cadere la pagina con uno
  // stack trace. È lo stesso fail-closed del resto del dominio, reso leggibile.
  let queue;
  try {
    queue = await reviewService().queue(session);
  } catch (err) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Redazione d&apos;area</h1>
        <p className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm">
          Storage non disponibile: {err instanceof Error ? err.message : String(err)}
        </p>
      </main>
    );
  }

  const { area } = await searchParams;
  const detail = area ? await reviewService().detail(session, area) : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-4">
        <h1 className="text-2xl font-semibold">Redazione d&apos;area</h1>
        <p className="text-sm text-gray-600">
          {session.actor} · {session.role}
        </p>
      </header>

      {detail ? (
        <AreaReviewDetail detail={detail} />
      ) : (
        <AreaReviewQueue rows={queue} />
      )}
    </main>
  );
}
