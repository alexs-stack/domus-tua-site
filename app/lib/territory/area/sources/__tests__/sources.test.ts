// Canonicalizzazione, politica delle fonti e collettore.
//
// Nessuno di questi test tocca la rete: il recuperatore è iniettato. È la stessa proprietà che
// rende il collettore utilizzabile in un dry-run — «cosa scaricherei?» senza scaricare niente.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { canonicalizeUrl, registrableDomain, sameCanonicalPage } from "../canonical";
import {
  decideHost,
  isHostUnder,
  isMoreAuthoritative,
  SOURCE_PRIORITY,
  ALLOWED_SOURCE_HOSTS,
  BudgetTracker,
} from "../policy";
import {
  collectSources,
  pageContentHash,
  staleSources,
  ALLOW_ALL_ROBOTS,
  type FetchedPage,
  type PageFetcher,
} from "../collector";
import { parseRobots, isPathAllowed } from "../http";
import type { AreaSourceRecord } from "../../store/repository";

const AREA_KEY = "it|lombardia|va|tradate|";
const NOW = new Date("2026-08-20T10:00:00.000Z");

describe("URL canonico", () => {
  test("la stessa pagina raggiunta in modi diversi produce una riga sola", () => {
    // È il difetto che questo modulo esiste per non avere: senza, la tabella delle fonti si
    // riempie di copie e il rilevamento delle modifiche smette di funzionare.
    const variants = [
      "https://www.comune.tradate.va.it/servizi/",
      "http://comune.tradate.va.it/servizi",
      "https://COMUNE.TRADATE.VA.IT/servizi#contenuto",
      "https://www.comune.tradate.va.it/servizi?utm_source=google&utm_medium=cpc",
      "https://www.comune.tradate.va.it:443/servizi",
      "https://www.comune.tradate.va.it//servizi",
    ];
    const canonicals = new Set(
      variants.map((v) => {
        const r = canonicalizeUrl(v);
        assert.ok(r.ok, v);
        return r.canonical;
      }),
    );
    assert.equal(canonicals.size, 1, `${canonicals.size} forme diverse: ${[...canonicals].join(" | ")}`);
  });

  test("i parametri che SELEZIONANO contenuto restano", () => {
    // È il difetto opposto e peggiore: togliere `?id=` farebbe collassare pagine diverse sulla
    // stessa riga, cioè perdere fonti invece di deduplicarle.
    const a = canonicalizeUrl("https://comune.tradate.va.it/pagina?id=12");
    const b = canonicalizeUrl("https://comune.tradate.va.it/pagina?id=13");
    assert.ok(a.ok && b.ok);
    assert.notEqual(a.canonical, b.canonical);
  });

  test("l'ordine dei parametri non conta", () => {
    assert.ok(
      sameCanonicalPage(
        "https://comune.tradate.va.it/p?b=2&a=1",
        "https://comune.tradate.va.it/p?a=1&b=2",
      ),
    );
  });

  test("la radice conserva la sua barra", () => {
    const r = canonicalizeUrl("https://comune.tradate.va.it/");
    assert.ok(r.ok);
    assert.equal(r.canonical, "https://comune.tradate.va.it/");
  });

  test("schemi non http non sono fonti: sono vettori", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<h1>x", "file:///etc/passwd"]) {
      const r = canonicalizeUrl(bad);
      assert.equal(r.ok, false, bad);
    }
  });

  test("un URL con credenziali si SCARTA, non si ripulisce", () => {
    // Un URL con dentro una password non va sistemato e salvato: va segnalato a chi l'ha
    // incollato.
    const r = canonicalizeUrl("https://utente:segreto@comune.tradate.va.it/p");
    assert.equal(r.ok, false);
    assert.equal(r.ok === false && r.reason, "credentials-in-url");
  });

  test("input storto: scarto motivato, mai un'eccezione", () => {
    for (const bad of ["", "   ", "non un url", "https://", "x".repeat(3000)]) {
      const r = canonicalizeUrl(bad);
      assert.equal(r.ok, false, JSON.stringify(bad.slice(0, 20)));
    }
  });

  test("dominio registrabile: i sottodomini di un ente collassano sullo stesso dominio", () => {
    // Nota sui domini comunali italiani: la forma è `comune.<nome>.<provincia>.it`, e l'unità
    // REGISTRABILE sotto lo spazio provinciale è `<nome>.<provincia>.it` — cioè `tradate.va.it`,
    // non `comune.tradate.va.it`. Va bene così, anzi è la risposta giusta alla domanda che
    // questa funzione pone: tutto ciò che sta sotto `tradate.va.it` ha un registrante solo.
    const forms = ["servizi.comune.tradate.va.it", "www.comune.tradate.va.it", "comune.tradate.va.it"];
    const domains = new Set(forms.map(registrableDomain));
    assert.equal(domains.size, 1, `${[...domains].join(" | ")}`);
    assert.equal(registrableDomain("servizi.comune.tradate.va.it"), "tradate.va.it");

    assert.equal(registrableDomain("trenord.it"), "trenord.it");
    assert.equal(registrableDomain("www.trenord.it"), "trenord.it");
    // `regione.lombardia.it` sta SOTTO `lombardia.it`: il registrante è quello. Ed è esattamente
    // il motivo per cui l'autorizzazione non passa di qui — vedi il test qui sotto.
    assert.equal(registrableDomain("www.regione.lombardia.it"), "lombardia.it");
  });

  test("l'autorizzazione NON passa dal dominio registrabile", () => {
    // Il difetto che questo test ha trovato: autorizzare `regione.lombardia.it` confrontando i
    // domini registrabili avrebbe autorizzato in blocco qualunque sito sotto `lombardia.it`.
    // Un elenco di autorizzazioni non deve concedere più di quanto ci sia scritto.
    assert.equal(isHostUnder("www.regione.lombardia.it", "regione.lombardia.it"), true);
    assert.equal(isHostUnder("regione.lombardia.it", "regione.lombardia.it"), true);
    assert.equal(isHostUnder("qualcunaltro.lombardia.it", "regione.lombardia.it"), false);
    assert.equal(isHostUnder("servizi.comune.tradate.va.it", "comune.tradate.va.it"), true);
    assert.equal(isHostUnder("altrosito.tradate.va.it", "comune.tradate.va.it"), false);
    // Difesa contro il suffisso "quasi uguale": non basta terminare con le stesse lettere.
    assert.equal(isHostUnder("falsocomune.tradate.va.it", "comune.tradate.va.it"), false);
  });

  test("comuni DIVERSI non collassano fra loro", () => {
    // La controprova che conta: se `tradate.va.it` e `gallarate.va.it` collassassero, il
    // controllo di pertinenza dell'area sarebbe scavalcato dal riconoscimento dell'host.
    assert.notEqual(
      registrableDomain("comune.tradate.va.it"),
      registrableDomain("comune.gallarate.va.it"),
    );
  });
});

describe("politica delle fonti", () => {
  test("la gerarchia mette le autorità pubbliche davanti alle secondarie", () => {
    // Un fatto preso da una fonte secondaria quando ne esisteva una primaria non è "quasi
    // altrettanto buono": il giorno in cui qualcuno lo contesta non c'è come difenderlo.
    assert.ok(isMoreAuthoritative("municipality", "secondary"));
    assert.ok(isMoreAuthoritative("region", "transport-operator"));
    assert.ok(!isMoreAuthoritative("secondary", "municipality"));
    assert.ok(SOURCE_PRIORITY.secondary > SOURCE_PRIORITY.national);
  });

  test("un host non elencato non si interroga", () => {
    // Un ricercatore libero su internet trova, prima o poi, un portale immobiliare — e torna
    // con «quartiere tranquillo e ben servito».
    const d = decideHost("www.unportaleimmobiliare.it", AREA_KEY);
    assert.equal(d.allowed, false);
    assert.equal(d.reason, "host-not-allowed");
  });

  test("un host elencato si interroga", () => {
    const d = decideHost("www.comune.tradate.va.it", AREA_KEY);
    assert.equal(d.allowed, true);
    assert.equal(d.entry?.owner, "Comune di Tradate");
  });

  test("il sito di un comune NON è una fonte su un altro comune", () => {
    // Il controllo che nessuno si aspetta: il sito del Comune di Tradate è ottimo, ma non su
    // Gallarate — e un fatto sbagliato così non lo rivelerebbe nessuna lettura del testo.
    const d = decideHost("www.comune.tradate.va.it", "it|||gallarate|");
    assert.equal(d.allowed, false);
    assert.equal(d.reason, "wrong-area");
  });

  test("un ente sovraordinato vale per tutte le aree", () => {
    assert.equal(decideHost("www.regione.lombardia.it", "it|||gallarate|").allowed, true);
  });

  test("ogni riga dell'elenco ammesso dichiara perché è lì", () => {
    for (const entry of ALLOWED_SOURCE_HOSTS) {
      assert.ok(entry.note.trim().length > 0, `${entry.domain}: riga senza motivo`);
      assert.ok(entry.owner.trim().length > 0, `${entry.domain}: riga senza ente`);
    }
  });

  test("il budget conta le richieste e impone una pausa per host", () => {
    // La pausa non è una difesa nostra: un comune di quindicimila abitanti non ha
    // un'infrastruttura pensata per raffiche di richieste.
    const t = new BudgetTracker({ ...{ maxRequests: 2, maxBytesPerPage: 1, timeoutMs: 1, maxAttempts: 1, minDelayPerHostMs: 1000 } });
    assert.equal(t.canRequest(), true);
    t.record("host.it", 1000);
    assert.equal(t.delayFor("host.it", 1200), 800);
    assert.equal(t.delayFor("altro.it", 1200), 0);
    t.record("host.it", 2200);
    assert.equal(t.canRequest(), false);
  });
});

describe("collettore", () => {
  const page = (text: string, status = 200): FetchedPage => ({ status, text, truncated: false });

  /** Un recuperatore finto che registra cosa è stato chiesto. */
  function fakeFetcher(responses: Record<string, FetchedPage>): PageFetcher & { calls: string[] } {
    const calls: string[] = [];
    const fetcher: PageFetcher = async (url) => {
      calls.push(url);
      const r = responses[url];
      if (!r) throw new Error("ECONNREFUSED");
      return r;
    };
    return Object.assign(fetcher, { calls });
  }

  const URL_A = "https://comune.tradate.va.it/servizi";
  const noSleep = async () => {};

  test("raccoglie una fonte ammessa e la registra con la sua provenienza", async () => {
    const fetcher = fakeFetcher({ [URL_A]: page("La biblioteca comunale è aperta dal lunedì.") });
    const r = await collectSources({
      candidates: [{ url: "https://www.comune.tradate.va.it/servizi/", areaKey: AREA_KEY }],
      now: NOW,
      fetcher,
      robots: ALLOW_ALL_ROBOTS,
      sleep: noSleep,
    });
    assert.equal(r.collected.length, 1);
    const [c] = r.collected;
    assert.equal(c.record.canonicalUrl, URL_A);
    assert.equal(c.record.owner, "Comune di Tradate");
    assert.equal(c.record.sourceType, "municipality");
    assert.equal(c.record.status, "active");
    assert.equal(c.outcome, "new");
    assert.ok(Date.parse(c.record.reviewBy) > NOW.getTime());
  });

  test("un host non ammesso non costa nemmeno una richiesta", async () => {
    // I cancelli sono ordinati dal più economico al più caro: uno scarto non deve mai pagare
    // una richiesta.
    const fetcher = fakeFetcher({});
    const r = await collectSources({
      candidates: [{ url: "https://portale-immobiliare.it/tradate", areaKey: AREA_KEY }],
      now: NOW,
      fetcher,
      robots: ALLOW_ALL_ROBOTS,
      sleep: noSleep,
    });
    assert.equal(r.collected.length, 0);
    assert.equal(r.rejected[0].reason, "host-not-allowed");
    assert.equal(fetcher.calls.length, 0);
    assert.equal(r.requests, 0);
  });

  test("robots.txt non si aggira", async () => {
    // Una pagina che dice di non essere raccolta non si raccoglie. Il fatto si prende altrove
    // o non si prende: il valore di un fatto d'area non giustifica un accesso non voluto.
    const fetcher = fakeFetcher({ [URL_A]: page("contenuto") });
    const r = await collectSources({
      candidates: [{ url: URL_A, areaKey: AREA_KEY }],
      now: NOW,
      fetcher,
      robots: async () => false,
      sleep: noSleep,
    });
    assert.equal(r.collected.length, 0);
    assert.equal(r.rejected[0].reason, "robots-disallowed");
    assert.equal(fetcher.calls.length, 0);
  });

  test("due candidati che sono la stessa pagina si scaricano una volta", async () => {
    const fetcher = fakeFetcher({ [URL_A]: page("contenuto") });
    const r = await collectSources({
      candidates: [
        { url: "https://www.comune.tradate.va.it/servizi", areaKey: AREA_KEY },
        { url: "https://comune.tradate.va.it/servizi/?utm_source=x", areaKey: AREA_KEY },
      ],
      now: NOW,
      fetcher,
      robots: ALLOW_ALL_ROBOTS,
      sleep: noSleep,
    });
    assert.equal(r.collected.length, 1);
    assert.equal(fetcher.calls.length, 1);
  });

  test("una fonte invariata si riconosce e non si tocca", async () => {
    const text = "La biblioteca comunale è aperta dal lunedì al sabato.";
    const known: AreaSourceRecord = {
      sourceId: "as_x",
      areaKey: AREA_KEY,
      url: URL_A,
      canonicalUrl: URL_A,
      owner: "Comune di Tradate",
      sourceType: "municipality",
      retrievedAt: "2026-02-01T00:00:00.000Z",
      reviewBy: "2027-02-01T00:00:00.000Z",
      contentHash: pageContentHash(text),
      status: "active",
    };
    const r = await collectSources({
      candidates: [{ url: URL_A, areaKey: AREA_KEY }],
      now: NOW,
      fetcher: fakeFetcher({ [URL_A]: page(text) }),
      robots: ALLOW_ALL_ROBOTS,
      known: [known],
      sleep: noSleep,
    });
    assert.equal(r.collected[0].outcome, "unchanged");
    assert.equal(r.collected[0].record.status, "active");
  });

  test("una fonte CAMBIATA non torna attiva da sola", async () => {
    // I fatti che ne dipendono potrebbero non essere più veri: riportarla attiva in automatico
    // li lascerebbe pubblicati.
    const known: AreaSourceRecord = {
      sourceId: "as_x",
      areaKey: AREA_KEY,
      url: URL_A,
      canonicalUrl: URL_A,
      owner: "Comune di Tradate",
      sourceType: "municipality",
      retrievedAt: "2026-02-01T00:00:00.000Z",
      reviewBy: "2027-02-01T00:00:00.000Z",
      contentHash: pageContentHash("testo vecchio"),
      status: "active",
    };
    const r = await collectSources({
      candidates: [{ url: URL_A, areaKey: AREA_KEY }],
      now: NOW,
      fetcher: fakeFetcher({ [URL_A]: page("testo nuovo e diverso") }),
      robots: ALLOW_ALL_ROBOTS,
      known: [known],
      sleep: noSleep,
    });
    assert.equal(r.collected[0].outcome, "changed");
    assert.equal(r.collected[0].record.status, "changed");
  });

  test("una data che cambia da sola non conta come modifica", async () => {
    // Un CMS istituzionale cambia a ogni richiesta — una data in fondo, un contatore. Un hash
    // del grezzo direbbe «cambiata» tutte le volte, e nessuno guarderebbe più le segnalazioni.
    assert.equal(
      pageContentHash("Aggiornato il 12/03/2026 alle 10:30. La biblioteca è aperta."),
      pageContentHash("Aggiornato il 19/08/2026 alle 16:45. La biblioteca è aperta."),
    );
  });

  test("un 404 non si ritenta, un 500 sì", async () => {
    // Un errore del server può essere transitorio; una pagina che non c'è non ricompare.
    const notFound = fakeFetcher({ [URL_A]: page("", 404) });
    await collectSources({
      candidates: [{ url: URL_A, areaKey: AREA_KEY }],
      now: NOW,
      fetcher: notFound,
      robots: ALLOW_ALL_ROBOTS,
      sleep: noSleep,
    });
    assert.equal(notFound.calls.length, 1);

    const serverError = fakeFetcher({ [URL_A]: page("", 503) });
    await collectSources({
      candidates: [{ url: URL_A, areaKey: AREA_KEY }],
      now: NOW,
      fetcher: serverError,
      robots: ALLOW_ALL_ROBOTS,
      sleep: noSleep,
    });
    assert.equal(serverError.calls.length, 2);
  });

  test("una pagina irraggiungibile è uno scarto motivato, non un'eccezione", async () => {
    const r = await collectSources({
      candidates: [{ url: URL_A, areaKey: AREA_KEY }],
      now: NOW,
      fetcher: fakeFetcher({}),
      robots: ALLOW_ALL_ROBOTS,
      sleep: noSleep,
    });
    assert.equal(r.rejected[0].reason, "unreachable");
    assert.equal(r.collected.length, 0);
  });

  test("il budget si esaurisce e lo si dichiara", async () => {
    const responses: Record<string, FetchedPage> = {};
    const candidates = Array.from({ length: 5 }, (_, i) => {
      const url = `https://comune.tradate.va.it/p${i}`;
      responses[url] = page(`contenuto ${i}`);
      return { url, areaKey: AREA_KEY };
    });
    const r = await collectSources({
      candidates,
      now: NOW,
      fetcher: fakeFetcher(responses),
      robots: ALLOW_ALL_ROBOTS,
      budget: { maxRequests: 2, maxBytesPerPage: 1024, timeoutMs: 100, maxAttempts: 1, minDelayPerHostMs: 0 },
      sleep: noSleep,
    });
    assert.equal(r.collected.length, 2);
    assert.equal(r.budgetExhausted, true);
    assert.ok(r.rejected.some((x) => x.reason === "budget-exhausted"));
  });

  test("il collettore NON produce fatti né approvazioni", async () => {
    // Produce evidenza candidata. I fatti li estrae un altro passaggio, e li approva un umano.
    const r = await collectSources({
      candidates: [{ url: URL_A, areaKey: AREA_KEY }],
      now: NOW,
      fetcher: fakeFetcher({ [URL_A]: page("contenuto") }),
      robots: ALLOW_ALL_ROBOTS,
      sleep: noSleep,
    });
    const serialized = JSON.stringify(r.collected[0].record);
    assert.doesNotMatch(serialized, /approved/);
    assert.ok(!("facts" in r.collected[0]));
  });
});

describe("fonti scadute", () => {
  const source = (over: Partial<AreaSourceRecord>): AreaSourceRecord => ({
    sourceId: "as_x",
    areaKey: AREA_KEY,
    url: "https://comune.tradate.va.it/a",
    canonicalUrl: "https://comune.tradate.va.it/a",
    owner: "Comune di Tradate",
    sourceType: "municipality",
    retrievedAt: "2026-01-01T00:00:00.000Z",
    reviewBy: "2027-01-01T00:00:00.000Z",
    contentHash: "h",
    status: "active",
    ...over,
  });

  test("scaduta non è la stessa cosa di cambiata", () => {
    // Una fonte scaduta può essere identica a sei mesi fa: il punto è che nessuno l'ha
    // guardata, e un fatto che nessuno ricontrolla smette lentamente di essere un fatto.
    const stale = source({ sourceId: "as_vecchia", reviewBy: "2026-01-01T00:00:00.000Z" });
    const fresh = source({ sourceId: "as_fresca" });
    const out = staleSources([stale, fresh], NOW);
    assert.deepEqual(out.map((s) => s.sourceId), ["as_vecchia"]);
  });

  test("una fonte già rifiutata non rientra fra quelle da ricontrollare", () => {
    const rejected = source({ reviewBy: "2026-01-01T00:00:00.000Z", status: "rejected" });
    assert.deepEqual(staleSources([rejected], NOW), []);
  });
});

describe("robots.txt", () => {
  test("un gruppo specifico per noi SOSTITUISCE il generico, non ci si somma", () => {
    // È così che lo standard funziona, ed è il modo in cui un amministratore ci può dare regole
    // diverse da quelle che dà ai motori di ricerca.
    const rules = parseRobots(
      ["User-agent: *", "Disallow: /", "", "User-agent: DomusTuaAreaBot", "Disallow: /riservato"].join("\n"),
    );
    assert.deepEqual(rules.disallow, ["/riservato"]);
    assert.equal(isPathAllowed(rules, "/servizi"), true);
    assert.equal(isPathAllowed(rules, "/riservato/x"), false);
  });

  test("senza un gruppo per noi vale quello generico", () => {
    const rules = parseRobots(["User-agent: *", "Disallow: /admin"].join("\n"));
    assert.equal(isPathAllowed(rules, "/admin/x"), false);
    assert.equal(isPathAllowed(rules, "/servizi"), true);
  });

  test("la regola più specifica vince", () => {
    const rules = parseRobots(
      ["User-agent: *", "Disallow: /documenti", "Allow: /documenti/pubblici"].join("\n"),
    );
    assert.equal(isPathAllowed(rules, "/documenti/interni"), false);
    assert.equal(isPathAllowed(rules, "/documenti/pubblici/a"), true);
  });

  test("i commenti e le righe vuote non confondono l'analisi", () => {
    const rules = parseRobots(
      ["# commento", "", "User-agent: *   # anche qui", "Disallow: /admin   # e qui"].join("\n"),
    );
    assert.deepEqual(rules.disallow, ["/admin"]);
  });

  test("un robots vuoto non vieta niente", () => {
    assert.equal(isPathAllowed(parseRobots(""), "/qualsiasi"), true);
  });
});
