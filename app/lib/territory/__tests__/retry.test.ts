// Politica di retry (app/lib/territory/retry.ts): backoff+jitter, dead-letter, retry-due, retry-after.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  backoffDelayMs,
  nextRetryState,
  isRetryDue,
  MAX_ATTEMPTS,
  BACKOFF_BASE_MS,
  BACKOFF_CAP_MS,
} from "../retry";

describe("backoffDelayMs", () => {
  test("cresce (in media) col numero di tentativi ed è limitato dal cap", () => {
    const r = () => 1; // jitter massimo → ritardo = exp
    assert.equal(backoffDelayMs(1, { random: r }), BACKOFF_BASE_MS);
    assert.equal(backoffDelayMs(2, { random: r }), BACKOFF_BASE_MS * 2);
    assert.equal(backoffDelayMs(3, { random: r }), BACKOFF_BASE_MS * 4);
    assert.equal(backoffDelayMs(100, { random: r }), BACKOFF_CAP_MS);
  });
  test("jitter: mai sotto la metà del ritardo esponenziale", () => {
    assert.equal(backoffDelayMs(1, { random: () => 0 }), BACKOFF_BASE_MS / 2);
  });
  test("onora Retry-After se maggiore del backoff", () => {
    assert.equal(backoffDelayMs(1, { random: () => 0, retryAfterMs: 5 * BACKOFF_BASE_MS }), 5 * BACKOFF_BASE_MS);
  });
});

describe("nextRetryState", () => {
  const now = new Date("2026-08-13T10:00:00.000Z");
  test("incrementa i tentativi e programma il prossimo", () => {
    const s = nextRetryState(0, now, { random: () => 1 });
    assert.equal(s.attempts, 1);
    assert.equal(s.deadLettered, false);
    assert.ok(s.nextAttemptAt && Date.parse(s.nextAttemptAt) > now.getTime());
  });
  test("oltre MAX_ATTEMPTS → dead-letter, niente nextAttemptAt", () => {
    const s = nextRetryState(MAX_ATTEMPTS - 1, now, { random: () => 1 });
    assert.equal(s.deadLettered, true);
    assert.equal(s.nextAttemptAt, undefined);
  });
});

describe("isRetryDue", () => {
  const now = new Date("2026-08-13T10:00:00.000Z");
  test("nessuno stato → dovuto", () => {
    assert.equal(isRetryDue(undefined, now), true);
  });
  test("dead-letter → mai dovuto", () => {
    assert.equal(isRetryDue({ deadLettered: true }, now), false);
  });
  test("nextAttemptAt futuro → non dovuto; passato → dovuto", () => {
    assert.equal(isRetryDue({ nextAttemptAt: "2026-08-13T11:00:00.000Z" }, now), false);
    assert.equal(isRetryDue({ nextAttemptAt: "2026-08-13T09:00:00.000Z" }, now), true);
  });
});
