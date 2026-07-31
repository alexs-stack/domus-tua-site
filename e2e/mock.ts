// Stream SSE simulato per gli E2E.
//
// I test intercettano `/api/assistant` e rispondono con eventi scritti a mano. Così si
// verifica il CONTRATTO della UI — parsing dello stream, comparsa delle card, moduli, stati
// d'errore — senza dipendere da un provider AI, dal feed RealSmart o dalla rete.
//
// È deliberatamente l'unico punto in cui gli E2E "fingono": tutto il resto (routing, build,
// idratazione, accessibilità) è l'applicazione vera.

import type { Page, Route } from "@playwright/test";
import type { AssistantEvent } from "../app/lib/assistant/types";

/** Serializza gli eventi nel formato che il client si aspetta. */
export function sseBody(eventi: AssistantEvent[]): string {
  return eventi.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store, no-transform",
};

/** Fa rispondere `/api/assistant` con gli eventi indicati. */
export async function mockAssistant(page: Page, eventi: AssistantEvent[], status = 200) {
  await page.route("**/api/assistant", async (route: Route) => {
    await route.fulfill({ status, headers: SSE_HEADERS, body: sseBody(eventi) });
  });
}

/**
 * Come sopra, ma lo stream resta aperto: serve a verificare lo streaming visibile e il
 * pulsante "ferma". `release()` chiude lo stream quando il test lo decide.
 */
export async function mockAssistantLento(page: Page) {
  let sblocca: (() => void) | null = null;
  const attesa = new Promise<void>((r) => {
    sblocca = r;
  });

  await page.route("**/api/assistant", async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: SSE_HEADERS,
      body:
        sseBody([{ type: "text", value: "Sto cercando" }]) +
        // Lo stream resta senza `done`: la UI deve restare in stato "in corso".
        "",
    });
    await attesa;
  });

  return { rilascia: () => sblocca?.() };
}

/** Fa rispondere `/api/assistant/lead` con l'esito indicato. */
export async function mockLead(page: Page, body: { ok: boolean; code?: string }, status = 200) {
  await page.route("**/api/assistant/lead", async (route: Route) => {
    await route.fulfill({
      status,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  });
}

/** Due immobili di prova, nella forma esatta che il server invia. */
export const CARD_PROVA = [
  {
    slug: "villa-giardino-tradate",
    title: "Villa con giardino",
    zone: "Tradate",
    price: "€ 280.000",
    type: "Villa",
    url: "/case/villa-giardino-tradate",
    cover: "/images/hero_02_attico_travi_living.jpg",
  },
  {
    slug: "villetta-lonate",
    title: "Villetta a schiera",
    zone: "Lonate Ceppino",
    price: "€ 320.000",
    type: "Villa",
    url: "/case/villetta-lonate",
    cover: "/images/premium_01_living_tv_divano.jpg",
  },
];

/**
 * Registra una scelta sui cookie PRIMA di navigare.
 *
 * Il banner non compare all'istante: aspetta la fine dell'animazione di intro (o 6 s di
 * sicurezza). Cercarlo subito e non trovarlo lasciava il launcher bloccato per tutta la
 * durata del test — un difetto del banco di prova che sembrava un difetto del prodotto.
 * Chi vuole verificare il banner lo fa nel test dedicato, che pulisce i cookie apposta.
 */
export async function consensoGiaDato(page: Page) {
  await page.context().addCookies([
    { name: "dt_consent", value: "rejected", url: "http://127.0.0.1:3210" },
  ]);
}

/**
 * Apre il pannello dell'assistente.
 *
 * Parte da /privacy, non dalla homepage: l'assistente è montato nel layout ed è quindi
 * identico ovunque, ma la home carica hero, video e animazioni che allungano il test senza
 * aggiungere nulla a ciò che si sta verificando.
 */
export async function apriAssistente(page: Page) {
  await consensoGiaDato(page);
  await page.goto("/privacy");
  await page.getByRole("button", { name: /assistente/i }).click();
  await page.getByRole("dialog").waitFor();
}

/**
 * La bolla VISIBILE che contiene un testo.
 *
 * Serve perché ogni risposta compare due volte nel DOM: nella bolla e nell'annuncio
 * `aria-live` per gli screen reader (`p.sr-only`). Sono entrambi voluti — cercare il testo
 * senza distinguerli fa fallire i test per "strict mode violation" su un comportamento
 * corretto.
 */
export function bolla(page: Page, testo: string | RegExp) {
  return page.getByRole("dialog").locator("p:not(.sr-only)").filter({ hasText: testo });
}
