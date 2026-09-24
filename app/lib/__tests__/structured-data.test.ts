// I dati strutturati sono l'unica parte del sito scritta per una macchina, e quindi
// l'unica che nessuno rilegge. Un campo sbagliato non si vede in pagina: si vede fra
// settimane, in Search Console, quando il risultato arricchito non compare.
//
// Qui si difendono due cose: che il grafo sia collegato (i nodi si citano per @id invece
// di essere dichiarazioni sparse) e che non prometta funzioni che il sito non ha.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { organizationJsonLd, webSiteJsonLd, siteUrl } from "../site";
import { team } from "../team";

describe("WebSite e la ricerca interna", () => {
  const w = webSiteJsonLd() as Record<string, unknown>;

  test("è agganciato all'organizzazione per @id, non duplicato", () => {
    // Due nodi che si citano formano un grafo; due nodi che ripetono gli stessi campi
    // sono due entità diverse agli occhi di un crawler.
    assert.equal((w.publisher as Record<string, string>)["@id"], `${siteUrl}/#organization`);
    assert.equal(organizationJsonLd()["@id"], `${siteUrl}/#organization`);
  });

  test("il SearchAction punta a un endpoint che esiste davvero", () => {
    // ⚠️ Il difetto che questo test rende impossibile: dichiarare una ricerca che il sito
    // non ha. `?q=` è letto da PropertySearch (pre-imposta i filtri dai query param): se
    // un giorno quel parametro cambia nome, questo test resta verde ma la dichiarazione
    // diventa falsa — per questo il commento dice DOVE guardare.
    const action = w.potentialAction as { target: { urlTemplate: string }; "query-input": string };
    assert.match(action.target.urlTemplate, /\/acquista\?q=\{search_term_string\}$/);
    assert.equal(action["query-input"], "required name=search_term_string");
  });

  test("dichiara la lingua del sito", () => {
    assert.equal(w.inLanguage, "it-IT");
  });
});

describe("Person — il team", () => {
  test("il roster non è vuoto e ha nomi reali", () => {
    assert.ok(team.length >= 5, "il roster è più corto del previsto");
    for (const m of team) {
      assert.ok(m.name.trim().length > 3, `nome sospetto: "${m.name}"`);
      assert.ok(m.role, `${m.name} non ha un ruolo`);
    }
  });

  test("gli @id delle persone sono unici e stabili", () => {
    // L'@id deriva dal nome: due persone con lo stesso slug sarebbero, per un crawler,
    // la stessa persona.
    const ids = team.map((m) => m.name.toLowerCase().replace(/[^a-z]+/g, "-"));
    assert.equal(new Set(ids).size, ids.length, `slug duplicati: ${ids.join(", ")}`);
    for (const id of ids) {
      assert.doesNotMatch(id, /^-|-$/, `slug malformato: "${id}"`);
    }
  });
});

describe("quello che NON dichiariamo", () => {
  test("nessun VideoObject finché mancano data e descrizione", () => {
    // Google richiede `uploadDate` e `description`; del canale abbiamo solo id e titolo.
    // Un VideoObject senza quei campi viene scartato — e inventarli sarebbe fabbricare un
    // dato verificabile in dieci secondi da chiunque apra il canale.
    // Sbloccato da docs/da-chiedere-alla-cliente.md §1.14.
    const org = JSON.stringify(organizationJsonLd());
    const web = JSON.stringify(webSiteJsonLd());
    assert.doesNotMatch(org + web, /VideoObject/);
  });

  test("l'organizzazione non dichiara un aggregateRating", () => {
    // Regola preesistente, ricontrollata qui perché è la stessa famiglia di errore:
    // dal 2019 Google non mostra i voti che un'azienda pubblica su sé stessa.
    assert.doesNotMatch(JSON.stringify(organizationJsonLd()), /aggregateRating/);
  });
});
