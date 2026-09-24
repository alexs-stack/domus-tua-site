// Verifica di un deploy, dall'esterno.
//
// Interroga `/api/health` di un ambiente già pubblicato e risponde a una domanda sola: **questo
// deploy è pronto per stare davanti a delle persone?** Non guarda il codice locale — guarda
// quello che è effettivamente in esecuzione. È l'unico modo per accorgersi che il deploy è
// vecchio, che una variabile è rimasta indietro, che il badge di anteprima è acceso in
// produzione.
//
//   npm run verify:deploy -- https://domus-tua.vercel.app
//   npm run verify:deploy -- https://www.domustua.com --commit 3cfaee0
//   npm run verify:deploy -- https://…  --preview     # ambiente di anteprima: vedi sotto
//
// Esce con codice 1 se una verifica obbligatoria fallisce. Le verifiche che falliscono sono,
// letteralmente, la lista di cose ancora da fare in Vercel.
//
// `--preview` non abbassa le soglie: le stesse verifiche restano, ma quelle che dipendono da
// variabili che *volutamente* non si impostano in anteprima (per esempio il feed live o il
// badge spento) diventano avvisi. Serve a distinguere "non è ancora configurato" da "è
// configurato male", che sono due problemi diversi.

type Health = {
  ok?: boolean;
  deploy?: {
    commit?: string | null;
    environment?: string | null;
    siteUrl?: string | null;
    nodeEnv?: string;
    previewBadge?: boolean;
  };
  integrations?: {
    realsmart?: {
      live?: boolean;
      feedConfigured?: boolean;
      productionRuntime?: boolean;
      lastKnownGood?: string;
      runtime?: {
        source?: string;
        ok?: boolean;
        stale?: boolean;
        itemCount?: number;
        lastFetch?: string | null;
        lastAttempt?: string;
      } | null;
      release?: {
        ready?: boolean;
        verdict?: string;
        requireLive?: boolean;
        minListings?: number;
        reasons?: string[];
      };
    };
    soldMap?: { present?: boolean; detected?: number; manual?: number };
    /** I due canali di consegna VERI del form, più il loro OR. WhatsApp non è qui: apre
        una chat dal browser, non recapita niente. Vedi app/lib/demoStatus.ts. */
    leadDelivery?: { email?: boolean; sheet?: boolean; ok?: boolean };
    emailLead?: { configured?: boolean };
    whatsappConfigured?: boolean;
    trustindexLive?: boolean;
    heroVideoLive?: boolean;
    semanticRankingConfigured?: boolean;
    assistant?: {
      enabled?: boolean;
      providerConfigured?: boolean;
      provider?: string | null;
      model?: string;
    };
  };
};

type Check = {
  name: string;
  /** true = passata, false = fallita, null = non applicabile in questo ambiente. */
  pass: boolean | null;
  detail: string;
  /** Se false, un fallimento è solo un avviso (non blocca). */
  required: boolean;
  /** Cosa fare in Vercel se fallisce. */
  fix?: string;
};

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith("http"));
const wantCommit = args.includes("--commit") ? args[args.indexOf("--commit") + 1] : undefined;
const previewMode = args.includes("--preview");

if (!url) {
  console.error("Uso: npm run verify:deploy -- <url> [--commit <sha>] [--preview]");
  process.exit(2);
}

const mark = (c: Check) => (c.pass === null ? "–" : c.pass ? "✓" : c.required ? "✗" : "!");

async function main() {
  const base = url!.replace(/\/$/, "");
  let health: Health;
  try {
    const res = await fetch(`${base}/api/health`, { headers: { "cache-control": "no-cache" } });
    if (!res.ok) {
      console.error(`✗ ${base}/api/health ha risposto ${res.status}`);
      process.exit(1);
    }
    health = (await res.json()) as Health;
  } catch (err) {
    console.error(`✗ ${base}/api/health non raggiungibile: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  // Forma della risposta: se manca il blocco `deploy`, l'ambiente sta eseguendo una versione
  // di /api/health precedente a questa. Dirlo è più utile che riportare dieci `undefined`
  // come se fossero configurazioni mancanti.
  if (!health.deploy) {
    console.error(
      `\n✗ ${base} espone una versione precedente di /api/health (manca il blocco "deploy").\n` +
        "  La verifica non è applicabile finché l'ambiente non viene ridistribuito con questo codice.\n",
    );
    process.exit(1);
  }

  const local = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(base);
  const d = health.deploy ?? {};
  const i = health.integrations ?? {};
  const isProduction = d.environment === "production";
  // In anteprima alcune variabili restano volutamente vuote: il fallimento diventa avviso.
  const hard = (required: boolean) => (previewMode ? false : required);

  const checks: Check[] = [
    {
      name: "commit deployato",
      // Fuori da Vercel il commit non esiste: in locale non è un errore, in un deploy sì.
      pass: local
        ? null
        : wantCommit
          ? (d.commit ?? "").startsWith(wantCommit.slice(0, 7))
          : !!d.commit,
      detail: wantCommit
        ? `atteso ${wantCommit.slice(0, 7)}, in esecuzione ${d.commit ?? "sconosciuto"}`
        : `in esecuzione ${d.commit ?? "sconosciuto (fuori da Vercel?)"}`,
      required: true,
      fix: "Redeploy del commit giusto, oppure il deploy non è ancora terminato.",
    },
    {
      name: "ambiente dichiarato",
      pass: local ? null : d.environment !== null && d.environment !== undefined,
      detail: `${d.environment ?? "nessuno"} (NODE_ENV: ${d.nodeEnv ?? "?"})`,
      required: true,
    },
    {
      name: "NEXT_PUBLIC_SITE_URL impostato",
      pass: !!d.siteUrl,
      detail: d.siteUrl ?? "mancante",
      required: true,
      fix: "Vercel → Settings → Environment Variables → NEXT_PUBLIC_SITE_URL (per ambiente).",
    },
    {
      name: "badge di anteprima spento in produzione",
      // In anteprima il badge PUÒ essere acceso: è il suo posto.
      pass: isProduction ? d.previewBadge === false : true,
      detail: d.previewBadge
        ? isProduction
          ? "acceso IN PRODUZIONE"
          : "acceso (consentito fuori dalla produzione)"
        : "spento",
      required: true,
      fix: "Rimuovi NEXT_PUBLIC_PREVIEW_BADGE dall'ambiente Production.",
    },
    {
      name: "RealSmart live",
      pass: i.realsmart?.live === true && i.realsmart?.feedConfigured === true,
      detail: `live: ${i.realsmart?.live}, feed configurato: ${i.realsmart?.feedConfigured}`,
      required: hard(true),
      fix: "NEXT_PUBLIC_USE_REALSMART=true + REALSMART_* nell'ambiente.",
    },
    {
      // Cancello di RILASCIO (Prompt 3): un deploy di PRODUZIONE non deve promuovere un catalogo
      // vuoto/implausibile con il feed richiesto. `release.ready` viene dal gate server-side
      // (evaluateRelease). In anteprima è un avviso; in produzione è bloccante.
      name: "catalogo pronto al rilascio",
      pass: i.realsmart?.release ? i.realsmart.release.ready === true : null,
      detail: i.realsmart?.release
        ? `verdetto ${i.realsmart.release.verdict}` +
          `, sorgente ${i.realsmart.runtime?.source ?? "?"}` +
          `, immobili ${i.realsmart.runtime?.itemCount ?? "?"}` +
          `, soglia ${i.realsmart.release.minListings ?? "?"}`
        : "campo release assente (endpoint /api/health precedente a Prompt 3)",
      required: hard(true),
      fix: "Verifica che il feed live risponda con abbastanza immobili. Override esplicito solo se necessario: REALSMART_ALLOW_EMPTY_RELEASE=true (auditabile).",
    },
    {
      name: "mappa dei venduti presente",
      pass: i.soldMap?.present === true,
      detail: `${i.soldMap?.detected ?? 0} da OCR + ${i.soldMap?.manual ?? 0} manuali`,
      required: true,
      fix: "Esegui npm run detect-sold e committa sold-detected.json: senza, un venduto può comparire fra i disponibili.",
    },
    {
      name: "lead del form: almeno un canale di consegna",
      // Il caso da impedire è che il form accetti la richiesta e non la consegni a
      // nessuno. Prima questo controllo passava anche con la sola "destinazione whatsapp",
      // che consegna a zero: WhatsApp apre una chat dal BROWSER: se la persona non preme
      // invio, del lead non resta traccia da nessuna parte. I canali server sono due, la
      // notifica email e il Google Sheet, e ne basta uno.
      pass: i.leadDelivery?.ok === true,
      detail: `canali: ${
        [i.leadDelivery?.email ? "email" : null, i.leadDelivery?.sheet ? "sheet" : null]
          .filter(Boolean)
          .join(" + ") || "nessuno"
      }`,
      required: hard(true),
      fix: "RESEND_API_KEY + LEAD_EMAIL_TO per la notifica email, oppure SHEETS_WEBHOOK_URL per archiviare i lead. Almeno uno dei due.",
    },
    {
      name: "WhatsApp configurato",
      pass: i.whatsappConfigured === true,
      detail: String(i.whatsappConfigured),
      required: true,
      fix: "Il numero vive in app/lib/site.ts: se è false, è un problema di codice, non di Vercel.",
    },
    {
      name: "chatbot: acceso solo con un provider",
      // Il caso da impedire è uno solo: widget visibile e provider assente.
      pass: !(i.assistant?.enabled === true && i.assistant?.providerConfigured !== true),
      detail: `visibile: ${i.assistant?.enabled}, provider: ${i.assistant?.provider ?? "—"} (${i.assistant?.providerConfigured}), modello: ${i.assistant?.model ?? "—"}`,
      required: true,
      fix: "Imposta GEMINI_API_KEY (o ANTHROPIC_API_KEY), oppure togli NEXT_PUBLIC_ENABLE_ASSISTANT.",
    },
    {
      name: "recensioni Trustindex collegate",
      pass: i.trustindexLive === true,
      detail: String(i.trustindexLive),
      required: hard(true),
      fix: "TRUSTINDEX_WIDGET_URL nell'ambiente.",
    },
    {
      name: "ranking semantico",
      pass: i.semanticRankingConfigured === true,
      detail: String(i.semanticRankingConfigured),
      // Opzionale: senza, la ricerca resta su parole chiave e funziona comunque.
      required: false,
      // Riguarda SOLO l'ordinamento degli immobili. Il retrieval della knowledge base è
      // lessicale per scelta misurata e non si accende da qui: vedi docs/assistant-knowledge.md.
      fix: "GEMINI_API_KEY basta (gli embeddings li fa Gemini). VOYAGE_API_KEY solo se si preferisce Voyage. Senza nessuna delle due, la ricerca usa le parole chiave e funziona.",
    },
    {
      name: "hero video",
      pass: i.heroVideoLive === true,
      detail: String(i.heroVideoLive),
      // Opzionale: senza, resta il poster, che è una foto reale.
      required: false,
      fix: "Carica il video dell'hero (docs/hero-video.md); senza, resta il poster.",
    },
  ];

  console.log(`\nVerifica deploy — ${base}`);
  console.log(`Ambiente: ${d.environment ?? "sconosciuto"}${previewMode ? " (modalità anteprima)" : ""}\n`);

  for (const c of checks) {
    console.log(` ${mark(c)} ${c.name.padEnd(42)} ${c.detail}`);
  }

  const failed = checks.filter((c) => c.pass === false && c.required);
  const warned = checks.filter((c) => c.pass === false && !c.required);

  if (warned.length) {
    console.log("\nAvvisi (non bloccanti):");
    for (const c of warned) console.log(`  ! ${c.name} — ${c.fix ?? ""}`);
  }

  if (failed.length) {
    console.log("\nDa fare prima di pubblicare:");
    for (const c of failed) console.log(`  ✗ ${c.name} — ${c.fix ?? ""}`);
    console.log("");
    process.exit(1);
  }

  console.log("\nTutte le verifiche obbligatorie superate.\n");
}

void main();
