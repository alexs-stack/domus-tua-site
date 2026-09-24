// Le OPERAZIONI editoriali sul dominio d'area (Prompt 10). SERVER-ONLY.
//
// È lo strato di accesso ai dati che la guida di Next chiama Data Access Layer: ogni operazione
// che scrive passa da qui, e qui — non nella UI — vivono il controllo dei permessi, la
// validazione e la scrittura dell'audit. Tre ragioni, in ordine di importanza:
//
//   1. Le azioni server sono ENDPOINT. Nascondere un pulsante non impedisce a nessuno di
//      chiamare l'azione: il controllo che conta è quello dentro l'operazione.
//   2. Una regola scritta in un posto solo non può divergere da sé stessa.
//   3. L'audit non si può dimenticare se sta nella stessa funzione della scrittura.
//
// COSA QUESTO STRATO NON PERMETTE, per nessun ruolo:
//   • approvare un fatto che il guard deterministico boccia — nemmeno con una motivazione;
//   • approvare una narrativa che non ha superato il cancello;
//   • pubblicare senza dire perché;
//   • riscrivere o cancellare un evento di revisione già registrato.

import type { AreaFact, AreaNarrative, AreaProfile } from "../types";
import type { AreaRepository, AreaSourceRecord } from "../store/repository";
import { validateAreaFact, type FactViolation } from "../factGuard";
import { validateNarrative } from "../writer/narrativeGuard";
import { contentHash } from "../hash";
import { requirePermission, hasPermission, type ReviewSession } from "./auth";

if (typeof window !== "undefined") {
  throw new Error("[territory/area/review] servizio editoriale: modulo server-only.");
}

export class ReviewOperationError extends Error {
  constructor(
    message: string,
    /** I motivi puntuali, quando l'operazione è stata rifiutata da un guard. */
    readonly reasons: string[] = [],
  ) {
    super(message);
    this.name = "ReviewOperationError";
  }
}

// ─────────────────────────────────────────────────────────────
// Viste di lettura
// ─────────────────────────────────────────────────────────────

/** Una riga della coda: quanto basta per decidere cosa aprire. */
export interface QueueRow {
  areaKey: string;
  label: string;
  municipality: string;
  profileStatus: AreaProfile["status"];
  /** Fatti in attesa di una decisione. È il numero che dice se c'è lavoro. */
  candidateFacts: number;
  approvedFacts: number;
  conflictedFacts: number;
  staleSources: number;
  /** Stato della narrativa corrente, o `null` se non ne esiste una. */
  narrativeStatus: AreaNarrative["status"] | null;
  narrativeScore: number | null;
  /** Immobili che dipendono da quest'area: dice quanto pesa una decisione. */
  listings: number;
}

/** Il dettaglio di un'area. Le coordinate NON ci sono se chi guarda non può vederle. */
export interface AreaDetail {
  profile: AreaProfile;
  sources: AreaSourceRecord[];
  facts: Array<AreaFact & { violations: FactViolation[] }>;
  narrative: AreaNarrative | null;
  /** Esito deterministico sulla narrativa corrente: vuoto = nessun ostacolo. */
  narrativeFailures: string[];
  listings: string[];
  history: Awaited<ReturnType<AreaRepository["listReviewEvents"]>>;
  /** I permessi di CHI sta guardando: la UI ne deriva cosa mostrare. */
  permissions: ReturnType<typeof import("./auth").permissionsOf>;
}

export interface ReviewServiceDeps {
  repo: AreaRepository;
  now: () => Date;
  promptVersion: string;
}

export class AreaReviewService {
  constructor(private readonly deps: ReviewServiceDeps) {}

  private get repo(): AreaRepository {
    return this.deps.repo;
  }

  // ── Lettura ──────────────────────────────────────────────

  /** La coda, ordinata per lavoro da fare: prima le aree con più decisioni in sospeso. */
  async queue(session: ReviewSession | null): Promise<QueueRow[]> {
    requirePermission(session, "read");
    const now = this.deps.now();
    const profiles = await this.repo.listProfiles();
    const contexts = await this.repo.listPropertyContexts({ retired: false });

    const rows: QueueRow[] = [];
    for (const profile of profiles) {
      const facts = await this.repo.listFacts(profile.areaKey);
      const sources = await this.repo.listSources(profile.areaKey);
      const narrative = await this.repo.getNarrative(profile.areaKey, "it");
      rows.push({
        areaKey: profile.areaKey,
        label: profile.label,
        municipality: profile.municipalityAreaKey,
        profileStatus: profile.status,
        candidateFacts: facts.filter((f) => f.status === "draft").length,
        approvedFacts: facts.filter((f) => f.status === "approved").length,
        conflictedFacts: facts.filter((f) => f.conflicts.length > 0).length,
        staleSources: sources.filter(
          (s) => s.status === "stale" || Date.parse(s.reviewBy) < now.getTime(),
        ).length,
        narrativeStatus: narrative?.status ?? null,
        narrativeScore: narrative?.qualityScore ?? null,
        listings: contexts.filter((c) => c.areaKey === profile.areaKey).length,
      });
    }

    // Prima ciò che aspetta una decisione umana: conflitti, poi candidati, poi il resto.
    return rows.sort(
      (a, b) =>
        b.conflictedFacts - a.conflictedFacts ||
        b.candidateFacts - a.candidateFacts ||
        (a.areaKey < b.areaKey ? -1 : 1),
    );
  }

  /**
   * Il dettaglio, con l'esito dei guard GIÀ calcolato su ogni fatto.
   *
   * Il punto è che il revisore vede il motivo del blocco accanto al fatto, invece di premere
   * "approva" e ricevere un errore. Un'interfaccia che nasconde i motivi finché non si prova
   * insegna a riprovare, non a correggere.
   */
  async detail(session: ReviewSession | null, areaKey: string): Promise<AreaDetail | null> {
    requirePermission(session, "read");
    const profile = await this.repo.getProfile(areaKey);
    if (!profile) return null;

    const now = this.deps.now();
    const [sources, rawFacts, narrative, contexts, history] = await Promise.all([
      this.repo.listSources(areaKey),
      this.repo.listFacts(areaKey),
      this.repo.getNarrative(areaKey, "it"),
      this.repo.listPropertyContexts({ areaKey, retired: false }),
      this.repo.listReviewEvents({ areaKey, limit: 100 }),
    ]);

    const sourceByUrl = new Map(sources.map((s) => [s.canonicalUrl, s]));
    const facts = rawFacts.map((fact) => ({
      ...fact,
      violations: validateAreaFact({
        fact,
        areaKey,
        now,
        source: sourceByUrl.get(fact.source.url) ?? undefined,
        existingFacts: rawFacts,
      }).violations,
    }));

    const approved = rawFacts.filter((f) => f.status === "approved");
    const narrativeFailures = narrative
      ? validateNarrative({
          narrative,
          approvedFacts: approved,
          now,
          promptVersion: this.deps.promptVersion,
        }).failures.map((x) => `${x.code}: ${x.message}`)
      : [];

    const { permissionsOf } = await import("./auth");
    return {
      profile,
      sources,
      facts,
      narrative,
      narrativeFailures,
      listings: contexts.map((c) => c.realSmartCode),
      history,
      permissions: permissionsOf(session!),
    };
  }

  // ── Scrittura ────────────────────────────────────────────

  /**
   * Approva un FATTO.
   *
   * Il guard deterministico gira di nuovo QUI, e non è ridondanza: fra il momento in cui la
   * pagina è stata disegnata e il momento in cui si preme il pulsante può essere passata un'ora,
   * e in quell'ora la fonte può essere scaduta o un altro revisore può aver approvato un fatto
   * quasi identico. Il verdetto che conta è quello dell'istante della scrittura.
   */
  async approveFact(
    session: ReviewSession | null,
    input: { areaKey: string; factId: string; reason?: string },
  ): Promise<AreaFact> {
    const actor = requirePermission(session, "approve-fact");
    const now = this.deps.now();

    const fact = await this.repo.getFact(input.factId);
    if (!fact) throw new ReviewOperationError(`Fatto ${input.factId} inesistente.`);

    const existing = await this.repo.listFacts(input.areaKey);
    const sources = await this.repo.listSources(input.areaKey);
    const { violations } = validateAreaFact({
      fact,
      areaKey: input.areaKey,
      now,
      source: sources.find((s) => s.canonicalUrl === fact.source.url) ?? undefined,
      existingFacts: existing,
    });
    if (violations.length > 0) {
      // Nessun ruolo può forzare questo, nemmeno con una motivazione: un fatto che viola i
      // guard non è un fatto su cui manca un'autorizzazione, è un fatto da correggere.
      throw new ReviewOperationError(
        `Il fatto ${input.factId} non è approvabile.`,
        violations.map((v) => `${v.code}: ${v.message}`),
      );
    }

    const before = contentHash(fact);
    const approved: AreaFact = {
      ...fact,
      status: "approved",
      approvedBy: actor.actor,
      approvedAt: now.toISOString(),
    };
    await this.repo.putFact(input.areaKey, approved);
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "fact",
      subjectId: input.factId,
      action: "approve",
      actor: actor.actor,
      at: now.toISOString(),
      ...(input.reason ? { reason: input.reason } : {}),
      beforeHash: before,
      afterHash: contentHash(approved),
    });
    return approved;
  }

  /** Rifiuta un fatto. La motivazione è obbligatoria: un rifiuto senza motivo non insegna niente. */
  async rejectFact(
    session: ReviewSession | null,
    input: { areaKey: string; factId: string; reason: string },
  ): Promise<AreaFact> {
    const actor = requirePermission(session, "approve-fact");
    if (!input.reason?.trim()) {
      throw new ReviewOperationError("Un rifiuto richiede una motivazione.");
    }
    const now = this.deps.now();
    const fact = await this.repo.getFact(input.factId);
    if (!fact) throw new ReviewOperationError(`Fatto ${input.factId} inesistente.`);

    const rejected: AreaFact = { ...fact, status: "rejected" };
    await this.repo.putFact(input.areaKey, rejected);
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "fact",
      subjectId: input.factId,
      action: "reject",
      actor: actor.actor,
      at: now.toISOString(),
      reason: input.reason,
      beforeHash: contentHash(fact),
      afterHash: contentHash(rejected),
    });
    return rejected;
  }

  /**
   * Corregge il TESTO di un fatto.
   *
   * La correzione riporta il fatto a bozza, sempre. Un fatto approvato il cui testo cambia non è
   * più il fatto che è stato approvato: rimetterlo in coda costa trenta secondi a qualcuno,
   * lasciarlo approvato significa avere in pagina una frase che nessuno ha letto.
   */
  async editFact(
    session: ReviewSession | null,
    input: { areaKey: string; factId: string; text: string; reason: string },
  ): Promise<AreaFact> {
    const actor = requirePermission(session, "edit-fact");
    if (!input.text?.trim()) throw new ReviewOperationError("Il testo non può essere vuoto.");
    if (!input.reason?.trim()) throw new ReviewOperationError("Una correzione richiede una motivazione.");

    const now = this.deps.now();
    const fact = await this.repo.getFact(input.factId);
    if (!fact) throw new ReviewOperationError(`Fatto ${input.factId} inesistente.`);

    const edited: AreaFact = {
      ...fact,
      text: input.text.trim(),
      status: "draft",
      approvedBy: undefined,
      approvedAt: undefined,
    };
    await this.repo.putFact(input.areaKey, edited);
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "fact",
      subjectId: input.factId,
      action: "manual-edit",
      actor: actor.actor,
      at: now.toISOString(),
      reason: input.reason,
      beforeHash: contentHash(fact),
      afterHash: contentHash(edited),
    });
    return edited;
  }

  /**
   * Approva una NARRATIVA.
   *
   * Richiede che il cancello sia già stato superato: il punteggio deve esserci ed essere almeno
   * 95, e lo strato deterministico non deve avere obiezioni. Non è il revisore a valutare la
   * conformità — quella è meccanica — ma a decidere se il testo, conforme, è anche quello che
   * l'agenzia vuole dire.
   */
  async approveNarrative(
    session: ReviewSession | null,
    input: { areaKey: string; reason?: string },
  ): Promise<AreaNarrative> {
    const actor = requirePermission(session, "approve-narrative");
    const now = this.deps.now();

    const narrative = await this.repo.getNarrative(input.areaKey, "it");
    if (!narrative) throw new ReviewOperationError(`Nessuna narrativa corrente per ${input.areaKey}.`);

    const approvedFacts = (await this.repo.listFacts(input.areaKey)).filter((f) => f.status === "approved");
    const { failures } = validateNarrative({
      narrative,
      approvedFacts,
      now,
      promptVersion: this.deps.promptVersion,
    });
    if (failures.length > 0) {
      throw new ReviewOperationError(
        "La narrativa non ha superato la validazione deterministica.",
        failures.map((f) => `${f.code}: ${f.message}`),
      );
    }
    if (typeof narrative.qualityScore !== "number" || narrative.qualityScore < 95) {
      throw new ReviewOperationError(
        `Punteggio ${narrative.qualityScore ?? "assente"}: la pubblicazione richiede almeno 95.`,
      );
    }

    const approved: AreaNarrative = {
      ...narrative,
      status: "approved",
      approvedBy: actor.actor,
      approvedAt: now.toISOString(),
    };
    await this.repo.putNarrative(approved);
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "narrative",
      subjectId: `${input.areaKey}:it`,
      action: "approve",
      actor: actor.actor,
      at: now.toISOString(),
      ...(input.reason ? { reason: input.reason } : {}),
      beforeHash: contentHash(narrative),
      afterHash: contentHash(approved),
    });
    return approved;
  }

  /**
   * PUBBLICA il profilo: da qui in poi la sezione compare sul sito.
   *
   * La motivazione è obbligatoria, e non è burocrazia: è l'unica riga che, fra sei mesi, spiega
   * perché quest'area è uscita e un'altra no.
   */
  async publishProfile(
    session: ReviewSession | null,
    input: { areaKey: string; reason: string },
  ): Promise<AreaProfile> {
    const actor = requirePermission(session, "publish");
    if (!input.reason?.trim()) {
      throw new ReviewOperationError("La pubblicazione richiede una motivazione.");
    }
    const now = this.deps.now();

    const profile = await this.repo.getProfile(input.areaKey);
    if (!profile) throw new ReviewOperationError(`Profilo ${input.areaKey} inesistente.`);

    const narrative = await this.repo.getNarrative(input.areaKey, "it");
    if (narrative && narrative.status !== "approved") {
      throw new ReviewOperationError(
        `La narrativa è "${narrative.status}": approvarla prima di pubblicare il profilo.`,
      );
    }
    const approvedFacts = (await this.repo.listFacts(input.areaKey)).filter((f) => f.status === "approved");
    if (approvedFacts.length === 0) {
      // Un profilo senza fatti approvati pubblicherebbe una sezione vuota, cioè
      // un'intestazione senza contenuto.
      throw new ReviewOperationError("Nessun fatto approvato: non c'è nulla da pubblicare.");
    }

    const published: AreaProfile = {
      ...profile,
      status: "approved",
      approvedBy: actor.actor,
      approvedAt: now.toISOString(),
    };
    await this.repo.putProfile(published);
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "profile",
      subjectId: input.areaKey,
      action: "publish",
      actor: actor.actor,
      at: now.toISOString(),
      reason: input.reason,
      beforeHash: contentHash(profile),
      afterHash: contentHash(published),
    });
    return published;
  }

  /** RITIRA un profilo dal sito. Stessa regola: serve una motivazione. */
  async unpublishProfile(
    session: ReviewSession | null,
    input: { areaKey: string; reason: string },
  ): Promise<AreaProfile> {
    const actor = requirePermission(session, "publish");
    if (!input.reason?.trim()) {
      throw new ReviewOperationError("Il ritiro richiede una motivazione.");
    }
    const now = this.deps.now();
    const profile = await this.repo.getProfile(input.areaKey);
    if (!profile) throw new ReviewOperationError(`Profilo ${input.areaKey} inesistente.`);

    const withdrawn: AreaProfile = {
      ...profile,
      status: "draft",
      approvedBy: undefined,
      approvedAt: undefined,
    };
    await this.repo.putProfile(withdrawn);
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "profile",
      subjectId: input.areaKey,
      action: "unpublish",
      actor: actor.actor,
      at: now.toISOString(),
      reason: input.reason,
      beforeHash: contentHash(profile),
      afterHash: contentHash(withdrawn),
    });
    return withdrawn;
  }

  /**
   * Segna un'area come «prove insufficienti».
   *
   * È uno stato FINALE e legittimo, non una rinuncia: dice «l'abbiamo guardata, le fonti non
   * bastano». Senza, quell'area resterebbe per sempre in coda come se nessuno l'avesse mai
   * aperta, e la coda smetterebbe di indicare dove c'è lavoro.
   */
  async markInsufficientEvidence(
    session: ReviewSession | null,
    input: { areaKey: string; reason: string },
  ): Promise<AreaProfile> {
    const actor = requirePermission(session, "approve-narrative");
    if (!input.reason?.trim()) {
      throw new ReviewOperationError("Serve una motivazione: dice a chi riaprirà cosa manca.");
    }
    const now = this.deps.now();
    const profile = await this.repo.getProfile(input.areaKey);
    if (!profile) throw new ReviewOperationError(`Profilo ${input.areaKey} inesistente.`);

    const marked: AreaProfile = { ...profile, status: "insufficient-evidence" };
    await this.repo.putProfile(marked);
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "profile",
      subjectId: input.areaKey,
      action: "validate",
      actor: actor.actor,
      at: now.toISOString(),
      reason: input.reason,
      beforeHash: contentHash(profile),
      afterHash: contentHash(marked),
    });
    return marked;
  }

  /** Accoda una rigenerazione della narrativa. Non genera: mette in coda. */
  async requestRegeneration(
    session: ReviewSession | null,
    input: { areaKey: string; reason: string },
  ): Promise<boolean> {
    const actor = requirePermission(session, "regenerate");
    const now = this.deps.now();
    const created = await this.repo.enqueueJob({
      // L'istante entra nella chiave: due richieste di rigenerazione a distanza di ore sono due
      // richieste, non una duplicata.
      idempotencyKey: `generate-narrative:${input.areaKey}:${now.toISOString()}`,
      jobType: "generate-narrative",
      targetId: input.areaKey,
      state: "pending",
      attempts: 0,
      availableAt: now.toISOString(),
      createdAt: now.toISOString(),
      runMetadata: { requestedBy: actor.actor, reason: input.reason },
    });
    await this.repo.appendReviewEvent({
      areaKey: input.areaKey,
      subject: "narrative",
      subjectId: `${input.areaKey}:it`,
      action: "generate",
      actor: actor.actor,
      at: now.toISOString(),
      ...(input.reason ? { reason: input.reason } : {}),
    });
    return created;
  }

  /** true se questa sessione può vedere le coordinate. La UI lo chiede prima di mostrarle. */
  canSeeCoordinates(session: ReviewSession | null): boolean {
    return session !== null && hasPermission(session, "view-coordinates");
  }
}
