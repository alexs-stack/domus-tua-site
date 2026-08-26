// La PAROLA-DESTINAZIONE del sipario deve esserci su OGNI pagina.
//
// Il difetto che questo test blinda: `labelForPath` era uno switch scritto a
// mano su otto rotte e tutto il resto cadeva nel `default: null`. Chi cliccava
// «Lavora con noi» — voce del menu principale — vedeva la porta chiudersi, il
// marchio girare, e sotto il vuoto. Stessa sorte per Servizi, Case vendute,
// le domande frequenti, la valutazione (che è la CTA primaria del sito),
// privacy e cookie.
//
// Qui l'elenco delle rotte non è riscritto: si prende da app/sitemap.ts, che è
// la lista autorevole. Una pagina nuova che entra nel sitemap senza la sua
// etichetta fa fallire questa suite — che è esattamente il controllo mancato.
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { SITEMAP_ROUTES, NON_INDEXABLE_ROUTES } from "../../../sitemap";
import { dictionaries, locales } from "../../../lib/i18n/dictionaries";
import { labelForPath, wordFontSize } from "../transitionLabel";

// Il sitemap usa "" per la home; il sipario riceve sempre un pathname vero.
const PUBLIC_ROUTES = [...SITEMAP_ROUTES, ...NON_INDEXABLE_ROUTES].map((r) => r || "/");

describe("parola-destinazione del sipario", () => {
  test("ogni rotta pubblica ha un'etichetta, in ogni lingua", () => {
    for (const locale of locales) {
      const d = dictionaries[locale];
      for (const route of PUBLIC_ROUTES) {
        const label = labelForPath(route, d);
        assert.ok(
          label && label.trim().length > 0,
          `[${locale}] ${route}: il sipario resterebbe muto`,
        );
      }
    }
  });

  test("le rotte del cliente hanno il nome che si legge nel link", () => {
    const it = dictionaries.it;
    assert.equal(labelForPath("/lavora-con-noi", it), "Lavora con noi");
    assert.equal(labelForPath("/servizi", it), "Servizi");
    assert.equal(labelForPath("/case-vendute", it), "Case vendute");
    assert.equal(labelForPath("/domande-frequenti", it), "Domande frequenti");
    assert.equal(labelForPath("/valutazione-immobile-tradate", it), "Valutazione");
    // E le etichette sono tradotte davvero, non solo presenti.
    assert.equal(labelForPath("/lavora-con-noi", dictionaries.de), "Karriere");
    assert.equal(labelForPath("/case-vendute", dictionaries.en), "Homes sold");
  });

  test("la home resta il nome proprio, identico in ogni lingua", () => {
    for (const locale of locales) {
      assert.equal(labelForPath("/", dictionaries[locale]), "Domus Tua");
    }
  });

  test("lo slash finale non cambia l'etichetta", () => {
    const it = dictionaries.it;
    assert.equal(labelForPath("/lavora-con-noi/", it), labelForPath("/lavora-con-noi", it));
    assert.equal(labelForPath("/", it), "Domus Tua");
  });

  test("/case-vendute non finisce nel ramo del catalogo", () => {
    const it = dictionaries.it;
    assert.equal(labelForPath("/case/villa-tradate", it), it.nav.case);
    assert.equal(labelForPath("/case", it), it.nav.case); // redirect 301 a /acquista
    assert.notEqual(labelForPath("/case-vendute", it), it.nav.case);
  });

  test("una rotta futura non nasce muta: ripiego dallo slug", () => {
    const it = dictionaries.it;
    assert.equal(labelForPath("/pagina-nuova-di-domani", it), "Pagina nuova di domani");
  });

  test("le pagine di servizio interne non vengono annunciate", () => {
    const it = dictionaries.it;
    assert.equal(labelForPath("/area-review", it), null);
    assert.equal(labelForPath("/territory-preview", it), null);
  });

  test("nessuna etichetta sfonda il viewport a 360px", () => {
    // Il layer è `whitespace-nowrap` dentro un pannello `overflow-hidden`:
    // una parola più larga dello spazio utile viene TAGLIATA ai bordi, non
    // mandata a capo. Le etichette nuove sono più lunghe delle storiche
    // («Questions fréquentes» 20 caratteri contro i 13 di «Quiénes somos»),
    // quindi la misura non può più essere fissa — e questo test è il motivo
    // per cui wordFontSize esiste.
    const VW = 360;
    const utili = VW - 2 * 0.06 * VW; // il contenitore ha px-[6vw] per lato
    // Playfair Display corsivo: ~0,52em di avanzamento medio per glifo.
    const EM = 0.52;
    for (const locale of locales) {
      const d = dictionaries[locale];
      for (const route of PUBLIC_ROUTES) {
        const label = labelForPath(route, d) ?? "";
        const m = /clamp\(([\d.]+)rem,\s*([\d.]+)vw/.exec(wordFontSize(label));
        assert.ok(m, `misura non leggibile per «${label}»`);
        const fs = Math.max(parseFloat(m[1]) * 16, (parseFloat(m[2]) / 100) * VW);
        const larghezza = label.length * EM * fs;
        assert.ok(
          larghezza <= utili,
          `[${locale}] ${route}: «${label}» ≈ ${Math.round(larghezza)}px in ${utili}px`,
        );
      }
    }
  });

  test("il corpo rientra quando la parola è lunga", () => {
    // Il layer è whitespace-nowrap: l'etichetta più lunga non può restare
    // alla misura pensata per «Vendi».
    const corta = wordFontSize("Vendi");
    const lunga = wordFontSize("Domande frequenti");
    assert.notEqual(corta, lunga);
    for (const locale of locales) {
      const d = dictionaries[locale];
      for (const route of PUBLIC_ROUTES) {
        const label = labelForPath(route, d) ?? "";
        assert.ok(
          wordFontSize(label).startsWith("clamp("),
          `[${locale}] ${route}: misura non valida per «${label}»`,
        );
      }
    }
  });
});
