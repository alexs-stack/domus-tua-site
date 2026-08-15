// Dati aziendali centralizzati — prova che pagine, metadata e dati strutturati
// consumano la FONTE UNICA (app/lib/site.ts), e che i valori non confermati sono
// documentati in modo tipizzato senza finire in pagina.
//
// Difetti coperti: la pagina /contatti mostrava un orario (15:00) in conflitto
// con site.hours e coi dati strutturati (14:30); il CAP/comune/sigla provincia
// erano ricopiati a mano in layout.tsx, con la sigla che divergeva pure dalla
// scheda immobile. Questo test fallisce se una di quelle divergenze rientra.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { site, pendingConfirmation, organizationJsonLd } from "../site";

const APP = path.join(process.cwd(), "app");
const read = (rel: string) => fs.readFileSync(path.join(APP, rel), "utf8");

function productionSources(): string[] {
  const out: string[] = [];
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === "__tests__" || e.name === "__fixtures__") continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(e.name)) out.push(full);
    }
  })(APP);
  return out;
}

describe("fonte unica — indirizzo atomico e di visualizzazione", () => {
  test("la forma di visualizzazione = CAP + comune (non possono divergere)", () => {
    assert.equal(site.address.city, `${site.address.postalCode} ${site.address.locality}`);
  });

  test("i dati strutturati derivano l'indirizzo dalla fonte unica (atomici, non a mano)", () => {
    const ld = organizationJsonLd();
    assert.equal(ld.address.postalCode, site.address.postalCode);
    assert.equal(ld.address.addressLocality, site.address.locality);
    assert.equal(ld.address.addressRegion, site.address.region);
    // I valori atomici sono quelli attesi, non letterali sganciati dalla fonte.
    assert.equal(ld.address.postalCode, "21049");
    assert.equal(ld.address.addressLocality, "Tradate");
  });

  test("la sigla provincia nei dati strutturati è UNA sola (organizzazione e scheda immobile)", () => {
    assert.equal(site.address.region, "VA");
    assert.equal(organizationJsonLd().address.addressRegion, site.address.region);
    assert.match(read("case/[slug]/page.tsx"), /addressRegion:\s*site\.address\.region/);
  });
});

describe("fonte unica — orari (la divergenza risolta)", () => {
  test("la pagina /contatti non fissa più 15:00 e deriva gli orari da site.hours", () => {
    const src = read("contatti/ContattiContent.tsx");
    assert.doesNotMatch(
      src,
      /15[:.]00/,
      "la pagina /contatti mostrava 15:00, in conflitto con site.hours (14:30)"
    );
    assert.match(src, /site\.hours\.weekdays/);
    assert.match(src, /site\.hours\.saturday/);
  });

  test("i dati strutturati usano site.openingHours, coerenti con site.hours", () => {
    assert.deepEqual(organizationJsonLd().openingHours, site.openingHours);
    // 14:30 in entrambe le rappresentazioni della stessa fonte.
    assert.ok(site.hours.weekdays.includes("14:30"));
    assert.ok(site.openingHours.some((h) => h.includes("14:30")));
  });
});

describe("valori non confermati — documentati, non decisi, non resi", () => {
  test("l'orario pomeridiano pubblicato coincide con la fonte unica", () => {
    const p = pendingConfirmation.weekdayAfternoonOpening;
    assert.ok(site.hours.weekdays.includes(p.published), "published deve essere ciò che il sito mostra");
    // Il candidato alternativo NON è pubblicato da nessuna parte (divergenza chiusa).
    const alt = p.candidates.find((c) => c !== p.published)!;
    assert.ok(!site.hours.weekdays.includes(alt));
    assert.ok(!site.openingHours.some((h) => h.includes(alt)));
  });

  test("conserva TUTTI i candidati (non ne sceglie uno come vero)", () => {
    assert.deepEqual([...pendingConfirmation.weekdayAfternoonOpening.candidates].sort(), ["14:30", "15:00"]);
    assert.equal(pendingConfirmation.emailRoles.published.public, site.email.label);
    assert.notEqual(pendingConfirmation.emailRoles.published.public, pendingConfirmation.emailRoles.published.operational);
  });

  test("è SOLO documentazione: nessun componente di produzione la importa/rende", () => {
    const importers = productionSources().filter((f) => /import[^;]*\bpendingConfirmation\b/.test(fs.readFileSync(f, "utf8")));
    assert.deepEqual(
      importers.map((f) => path.relative(process.cwd(), f)),
      [],
      "pendingConfirmation non deve finire in pagina (niente etichette 'da confermare' visibili)"
    );
  });
});

describe("fonte unica — recensioni e riconoscimento", () => {
  test("il conteggio arrotondato deriva da quello esatto (stessa fonte)", () => {
    const exact = parseInt(site.reviewsCount, 10);
    const approx = parseInt(site.reviewsApprox, 10);
    assert.ok(approx % 100 === 0, "l'arrotondato è a centinaia");
    assert.ok(approx <= exact && exact - approx < 100, "arrotondato per difetto, entro la stessa centinaia");
  });

  test("la card OG deriva il voto da site.rating", () => {
    assert.match(read("opengraph-image.tsx"), /site\.rating/);
    assert.doesNotMatch(read("opengraph-image.tsx"), /4,9\s*★/);
  });

  test("il riconoscimento è centralizzato: StarReviews consuma site.award", () => {
    const src = read("components/StarReviews.tsx");
    assert.match(src, /site\.award\.(label|years|href)/);
    assert.doesNotMatch(src, /wikicasa\.it\/agenzia/, "URL del riconoscimento hardcoded invece di site.award.href");
  });

  // Il difetto che questi tre controlli tengono chiuso: il premio era pubblicato come
  // "Top Agency 2026" — un anno solo, senza l'ente e senza la ripetizione. Tre anni
  // consecutivi sono l'unica prova indipendente dal voto Google che l'agenzia possiede,
  // e un anno alla volta la butta via.
  test("la denominazione nomina l'ente e NON incorpora un anno", () => {
    assert.match(site.award.label, /Wikicasa/, "la denominazione deve dire chi assegna il premio");
    assert.doesNotMatch(
      site.award.label,
      /\d{4}/,
      "l'anno sta in `years` (sono tre): incorporarlo nella denominazione riduce il premio a uno"
    );
  });

  test("gli anni sono tre, consecutivi e in ordine", () => {
    const years = [...site.award.years];
    assert.equal(years.length, 3, "il claim pubblicato dice «tre anni consecutivi»");
    for (let i = 1; i < years.length; i++) {
      assert.equal(years[i], years[i - 1] + 1, `anni non consecutivi: ${years.join(", ")}`);
    }
  });

  test("il claim di autorevolezza non rimpicciolisce il premio a fatto provinciale", () => {
    // La versione precedente diceva "più recensite della provincia di Varese":
    // territorio sbagliato (nazionale → provinciale) e criterio sbagliato
    // (fatturato → recensioni), per giunta duplicando la prova del 4,9/531.
    assert.match(site.authority, /Italia/, "il perimetro del premio è nazionale");
    assert.doesNotMatch(
      site.authority,
      /più recensit/i,
      "il criterio della classifica è il fatturato, non le recensioni"
    );
  });
});
