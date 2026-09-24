// Scelta del provider AI e traduzione dello schema dei filtri per Gemini.
//
// Due pezzi di logica che, sbagliati, non fanno rumore: la ricerca torna al parser locale e
// l'assistente al messaggio di cortesia, entrambi comportamenti legittimi in altri contesti.
// Nessuna rete: sono funzioni pure.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveProvider } from "../provider";
import { SET_FILTERS_TOOL, toGeminiSchema } from "../parseQuery";

describe("scelta del provider", () => {
  it("senza chiavi non c'è provider: è il caso del fallback, non un errore", () => {
    assert.equal(resolveProvider({}), null);
    assert.equal(resolveProvider({ GEMINI_API_KEY: "", ANTHROPIC_API_KEY: "" }), null);
  });

  it("con la sola chiave presente vince quel provider", () => {
    assert.equal(resolveProvider({ GEMINI_API_KEY: "AIza-x" }), "google");
    assert.equal(resolveProvider({ ANTHROPIC_API_KEY: "sk-ant-x" }), "anthropic");
  });

  it("con entrambe le chiavi vince Gemini", () => {
    assert.equal(
      resolveProvider({ GEMINI_API_KEY: "AIza-x", ANTHROPIC_API_KEY: "sk-ant-x" }),
      "google",
    );
  });

  it("AI_PROVIDER esplicita ha la precedenza sull'ordine di default", () => {
    assert.equal(
      resolveProvider({
        GEMINI_API_KEY: "AIza-x",
        ANTHROPIC_API_KEY: "sk-ant-x",
        AI_PROVIDER: "anthropic",
      }),
      "anthropic",
    );
  });

  it("accetta gli alias e ignora spazi e maiuscole", () => {
    const env = { GEMINI_API_KEY: "AIza-x", ANTHROPIC_API_KEY: "sk-ant-x" };
    assert.equal(resolveProvider({ ...env, AI_PROVIDER: " Claude " }), "anthropic");
    assert.equal(resolveProvider({ ...env, AI_PROVIDER: "GEMINI" }), "google");
  });

  it("AI_PROVIDER senza la chiave corrispondente viene ignorata, non spegne l'AI", () => {
    // Il caso che conta: variabile scritta a mano su Vercel, chiave mai aggiunta.
    // Mandare le chiamate a un provider senza credenziali sarebbe un errore silenzioso.
    assert.equal(
      resolveProvider({ GEMINI_API_KEY: "AIza-x", AI_PROVIDER: "anthropic" }),
      "google",
    );
    assert.equal(resolveProvider({ AI_PROVIDER: "anthropic" }), null);
  });

  it("un valore sconosciuto non impedisce la scelta di default", () => {
    assert.equal(resolveProvider({ GEMINI_API_KEY: "AIza-x", AI_PROVIDER: "mistral" }), "google");
  });
});

describe("schema dei filtri tradotto per Gemini", () => {
  const tradotto = toGeminiSchema(SET_FILTERS_TOOL.input_schema);

  it("i tipi diventano maiuscoli a ogni livello di annidamento", () => {
    assert.equal(tradotto.type, "OBJECT");
    const props = tradotto.properties as Record<string, Record<string, unknown>>;
    assert.equal(props.comune.type, "STRING");
    assert.equal(props.maxBudget.type, "NUMBER");
    assert.equal(props.features.type, "ARRAY");
    assert.equal((props.features.items as Record<string, unknown>).type, "STRING");
  });

  it("enum e descrizioni sopravvivono: sono ciò che guida il modello", () => {
    const props = tradotto.properties as Record<string, Record<string, unknown>>;
    assert.deepEqual(props.contract.enum, ["Tutte", "Vendita", "Affitto"]);
    assert.ok((props.features.items as Record<string, unknown>).enum);
    assert.match(String(props.comune.description), /comuni disponibili/);
  });

  it("copre gli stessi campi dello schema Anthropic: i due provider non possono divergere", () => {
    const originali = Object.keys(SET_FILTERS_TOOL.input_schema.properties ?? {});
    const convertiti = Object.keys(tradotto.properties as Record<string, unknown>);
    assert.deepEqual(convertiti, originali);
  });

  it("un `required` vuoto non viene emesso", () => {
    assert.equal("required" in tradotto, false);
    assert.deepEqual(toGeminiSchema({ type: "object", required: ["a"] }).required, ["a"]);
  });

  it("le chiavi che Gemini non conosce non passano", () => {
    const conRumore = { type: "string", $schema: "http://json-schema.org/draft-07/schema#" };
    assert.deepEqual(toGeminiSchema(conRumore as never), { type: "STRING" });
  });
});
