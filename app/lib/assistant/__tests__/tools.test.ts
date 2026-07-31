// I cinque tool, con fixture controllate: nessuna rete, nessun feed.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAssistantTools } from "../tools";
import type { AssistantEvent } from "../types";
import type { SearchListingsResult } from "../tools/searchListings";
import type { ListingDetailsResult } from "../tools/getListingDetails";
import type { WhatsAppHandoffResult } from "../tools/prepareWhatsAppHandoff";
import type { EmailEnquiryResult } from "../tools/prepareEmailEnquiry";
import { fixtureListings, unavailableListings } from "./fixtures";

/** Costruisce i tool raccogliendo gli eventi emessi verso la UI. */
function harness(listings = fixtureListings()) {
  const events: AssistantEvent[] = [];
  const tools = createAssistantTools({ listings, emit: (e) => events.push(e) });
  return { tools, events };
}

/** I tool dell'AI SDK ricevono anche un contesto di esecuzione: nei test non serve. */
const CALL = {} as never;

const search = (tools: ReturnType<typeof harness>["tools"], input: Record<string, unknown>) =>
  tools.search_listings.execute!(input as never, CALL) as Promise<SearchListingsResult>;

describe("search_listings", () => {
  it("trova gli immobili corrispondenti e mostra le card", async () => {
    const { tools, events } = harness();
    const result = await search(tools, { query: "villa a Tradate con giardino" });

    assert.equal(result.esito, "ok");
    if (result.esito !== "ok") return;
    assert.ok(result.mostrati.length > 0);
    assert.ok(result.mostrati.every((l) => l.comune === "Tradate"));

    const listingEvents = events.filter((e) => e.type === "listings");
    assert.equal(listingEvents.length, 1, "le card devono essere emesse una sola volta");
  });

  it("aggancia il comune scritto in chiaro dall'utente", async () => {
    // Regressione: con i dati live la chiave di zona è "Tradate (VA)"; se non la
    // traducessimo, il filtro comune non scatterebbe mai.
    const { tools } = harness();
    const result = await search(tools, { query: "casa a Venegono Superiore" });

    assert.equal(result.esito, "ok");
    if (result.esito !== "ok") return;
    assert.ok(result.mostrati.every((l) => l.comune === "Venegono Superiore"));
  });

  it("i filtri espliciti vincono su quelli dedotti dalla frase", async () => {
    const { tools } = harness();
    const result = await search(tools, { query: "ville a Tradate", prezzoMax: 300000 });

    assert.equal(result.esito, "ok");
    if (result.esito !== "ok") return;
    assert.ok(result.mostrati.every((l) => (l.prezzoEuro ?? 0) <= 300000));
    assert.ok(!result.mostrati.some((l) => l.slug === "villa-cara-tradate"));
  });

  it("con zero risultati non emette card e lo dichiara", async () => {
    const { tools, events } = harness();
    const result = await search(tools, { query: "villa a Tradate", prezzoMax: 1000 });

    assert.equal(result.esito, "nessun-risultato");
    assert.equal(
      events.filter((e) => e.type === "listings").length,
      0,
      "una ricerca vuota non deve mostrare card",
    );
  });

  it("non mostra mai un immobile venduto", async () => {
    const { tools } = harness();
    const result = await search(tools, { query: "attico panoramico" });

    if (result.esito === "ok") {
      assert.ok(!result.mostrati.some((l) => l.slug === "attico-venduto-tradate"));
    }
  });

  it("distingue il dato mancante dal dato negativo", async () => {
    const { tools } = harness();
    const result = await search(tools, { query: "trilocale a Venegono Superiore" });

    assert.equal(result.esito, "ok");
    if (result.esito !== "ok") return;
    const trilocale = result.mostrati.find((l) => l.slug === "trilocale-venegono");
    assert.ok(trilocale);
    // Il feed non fornisce mq e bagni: devono essere null, mai 0.
    assert.equal(trilocale.mq, null);
    assert.equal(trilocale.bagni, null);
    assert.notEqual(trilocale.locali, null);
  });

  it("con catalogo non consultabile non cita nessun immobile", async () => {
    const { tools, events } = harness(unavailableListings());
    const result = await search(tools, { query: "villa a Tradate" });

    assert.equal(result.esito, "non-disponibile");
    assert.equal(events.length, 0);
  });

  it("un comune fuori catalogo viene dichiarato, non aggirato", async () => {
    // Comportamento cambiato nell'audit finale: prima il comune sconosciuto veniva
    // scartato in silenzio e si cercava ovunque. Sul feed reale questo faceva sì che
    // "casa a Milano" restituisse case di Tradate senza avvisare — l'utente non aveva
    // modo di accorgersene. Ora l'assistente lo dichiara.
    const { tools } = harness();
    const result = await search(tools, { query: "casa", comune: "Atlantide" });
    assert.equal(result.esito, "comune-non-coperto");
  });

  it("la traduzione nome comune → chiave di zona resta corretta", async () => {
    // Regressione dell'onda 1.5: la traduzione veniva saltata in alcuni percorsi e
    // "Tradate" non combaciava con la chiave di catalogo "Tradate (VA)".
    const { tools } = harness();
    const result = await search(tools, { query: "villa a Tradate" });

    assert.equal(result.esito, "ok");
    if (result.esito !== "ok") return;
    assert.ok(result.mostrati.length > 0);
    assert.ok(result.mostrati.every((l) => l.comune === "Tradate"));
  });
});

describe("get_listing_details", () => {
  const details = (tools: ReturnType<typeof harness>["tools"], slug: string) =>
    tools.get_listing_details.execute!({ slug } as never, CALL) as Promise<ListingDetailsResult>;

  it("restituisce i dettagli di un immobile esistente", async () => {
    const { tools } = harness();
    const result = await details(tools, "villa-giardino-tradate");

    assert.equal(result.esito, "ok");
    if (result.esito !== "ok") return;
    assert.equal(result.immobile.comune, "Tradate");
    assert.equal(result.immobile.mq, 180);
    assert.equal(result.immobile.disponibile, true);
  });

  it("non descrive un immobile inesistente", async () => {
    const { tools } = harness();
    const result = await details(tools, "villa-inventata-dall-utente");
    assert.equal(result.esito, "non-trovato");
  });

  it("non descrive un immobile venduto", async () => {
    const { tools } = harness();
    const result = await details(tools, "attico-venduto-tradate");
    assert.equal(result.esito, "non-trovato");
  });

  it("con catalogo non consultabile non risponde nel merito", async () => {
    const { tools } = harness(unavailableListings());
    const result = await details(tools, "villa-giardino-tradate");
    assert.equal(result.esito, "non-disponibile");
  });
});

describe("prepare_whatsapp_handoff", () => {
  const prepare = (tools: ReturnType<typeof harness>["tools"], input: Record<string, unknown>) =>
    tools.prepare_whatsapp_handoff.execute!(input as never, CALL) as Promise<WhatsAppHandoffResult>;

  it("prepara il link ma non invia nulla", async () => {
    const { tools, events } = harness();
    const result = await prepare(tools, { motivo: "vorrei vendere casa" });

    assert.equal(result.inviato, false);
    const handoff = events.find((e) => e.type === "handoff");
    assert.ok(handoff && handoff.value.kind === "whatsapp");
    if (!handoff || handoff.value.kind !== "whatsapp") return;
    assert.match(handoff.value.url, /^https:\/\/wa\.me\/393466042314\?text=/);
    // Il testo deve essere codificato, non incollato grezzo.
    assert.ok(!handoff.value.url.includes(" "));
  });

  it("include l'immobile solo se esiste davvero", async () => {
    const { tools, events } = harness();
    await prepare(tools, { motivo: "informazioni", slugImmobile: "villa-inventata" });

    const handoff = events.find((e) => e.type === "handoff");
    assert.ok(handoff && handoff.value.kind === "whatsapp");
    if (!handoff || handoff.value.kind !== "whatsapp") return;
    assert.ok(!handoff.value.message.includes("villa-inventata"));
  });

  it("cita l'immobile reale con titolo, zona e link", async () => {
    const { tools, events } = harness();
    await prepare(tools, { motivo: "informazioni", slugImmobile: "villa-giardino-tradate" });

    const handoff = events.find((e) => e.type === "handoff");
    assert.ok(handoff && handoff.value.kind === "whatsapp");
    if (!handoff || handoff.value.kind !== "whatsapp") return;
    assert.match(handoff.value.message, /Villa con giardino/);
    assert.match(handoff.value.message, /\/case\/villa-giardino-tradate/);
  });
});

describe("prepare_email_enquiry", () => {
  it("apre il canale email senza dichiarare alcun invio", async () => {
    const { tools, events } = harness();
    const result = (await tools.prepare_email_enquiry.execute!(
      { oggetto: "Informazioni", riepilogo: "Cerca una villa a Tradate" } as never,
      CALL,
    )) as EmailEnquiryResult;

    assert.equal(result.inviato, false);
    assert.equal(result.destinatario, "immobiliare@domustua.it");

    const handoff = events.find((e) => e.type === "handoff");
    assert.ok(handoff && handoff.value.kind === "email");
    if (!handoff || handoff.value.kind !== "email") return;
    assert.equal(handoff.value.to, "immobiliare@domustua.it");
  });
});

describe("retrieve_agency_knowledge", () => {
  it("ammette di non sapere quando non ci sono fonti verificate", async () => {
    const { tools } = harness();
    const result = (await tools.retrieve_agency_knowledge.execute!(
      { domanda: "Qual è la capitale del Perù?" } as never,
      CALL,
    )) as { esito: string };

    assert.equal(result.esito, "nessuna-fonte");
  });
});
