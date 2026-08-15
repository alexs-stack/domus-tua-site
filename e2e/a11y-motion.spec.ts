import { test, expect, contrastViolations } from "./helpers";

// Contrasto CON IL MOVIMENTO ACCESO — il punto cieco di a11y.spec.ts.
//
// a11y.spec.ts gira tutto con `reducedMotion: "reduce"`, e per una ragione buona: con le
// animazioni accese axe misurerebbe il contrasto di un testo a metà dissolvenza. Il prezzo di
// quella scelta però è preciso: ogni stato nascosto vive DENTRO `gsap.matchMedia(MQ.motionOk)`,
// quindi con reduced-motion non viene mai impostato. La suite di accessibilità, per come è
// costruita, non può vedere un difetto che esiste solo quando le animazioni ci sono — cioè
// nella condizione della maggioranza delle persone che visitano il sito.
//
// Questo file copre esattamente quel varco, e lo fa senza reintrodurre i falsi positivi:
//
//   • **niente scroll.** Le rivelazioni legate allo scroll restano nel loro stato iniziale, che
//     è stabile e duraturo — non un fotogramma di passaggio.
//   • **si aspetta che si posi.** Quel che era a metà dissolvenza a pagina caricata ha finito.
//   • **solo `color-contrast`.** È l'unica regola che dipende da come la pagina è dipinta.
//
// Il discrimine che rende il test onesto: un fade-up nascosto sta a `opacity: 0`, e axe salta
// gli elementi invisibili — non li segnala. Resta segnalato solo il testo PIENAMENTE VISIBILE a
// cui è stato tolto il fondale: un titolo chiaro il cui velo scuro è finito dentro il sipario e
// viene ritagliato via finché il sipario non si apre. Quello non è un fotogramma: è come sta la
// pagina finché nessuno ci scorre sopra, ed è ciò che Lighthouse ha misurato sulla home
// (rapporto 1,03 — crema su crema) mentre questa suite era verde.
//
// La regola che il test difende è già scritta nel repo, sul velo delle lastre del nastro
// Servizi: «è quello che tiene il contrasto del testo su cinque fotografie diverse, non la
// fortuna». Un velo dentro una MaskReveal è fortuna: tiene solo se l'animazione è partita.

const PAGES = ["/", "/acquista", "/vendi", "/metodo", "/open-domus", "/contatti", "/servizi", "/chi-siamo"];

for (const path of PAGES) {
  test(`${path}: il testo ha il suo fondale anche prima che le animazioni partano`, async ({
    page,
    goto,
  }) => {
    await goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Ci si ferma in cima e si lascia posare quel che è già entrato. NON si scorre: sotto la
    // piega gli stati nascosti devono restare come sono, perché è quello lo stato in esame.
    await page.waitForTimeout(1_500);

    const violazioni = await contrastViolations(page);
    expect(
      violazioni,
      `Testo senza fondale con il movimento acceso su ${path}:\n${JSON.stringify(violazioni, null, 2)}`,
    ).toEqual([]);
  });
}
