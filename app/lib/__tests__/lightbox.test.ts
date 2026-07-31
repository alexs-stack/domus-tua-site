// Lightbox delle fotografie — contratto del componente.
//
// I test di comportamento (tastiera, swipe, focus) girano nel browser durante la verifica:
// qui restano le regole che si possono verificare in modo deterministico — quali sorgenti
// possono finire a schermo intero e quali garanzie il markup deve continuare a dare.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { isAllowedRemoteImage, isDisplayableImage } from "../images";

const APP_DIR = path.join(process.cwd(), "app");
const LIGHTBOX = fs.readFileSync(path.join(APP_DIR, "components", "PropertyLightbox.tsx"), "utf8");
const GALLERY = fs.readFileSync(path.join(APP_DIR, "components", "PropertyGallery.tsx"), "utf8");

describe("lightbox — sorgenti ammesse", () => {
  test("asset locali del sito", () => {
    assert.equal(isDisplayableImage("/images/reali/villa-pool.jpg"), true);
  });

  test("foto RealSmart in HTTPS", () => {
    assert.equal(isDisplayableImage("https://cloud2.realsmart.it/media/foto.jpg"), true);
    assert.equal(isAllowedRemoteImage("https://realsmart.it/x.jpg"), true);
  });

  test("nessuna immagine esterna né in chiaro", () => {
    assert.equal(isDisplayableImage("https://evil.example.com/foto.jpg"), false);
    assert.equal(isDisplayableImage("http://cloud2.realsmart.it/foto.jpg"), false);
    assert.equal(isDisplayableImage("//evil.example.com/foto.jpg"), false);
    assert.equal(isDisplayableImage("javascript:alert(1)"), false);
    assert.equal(isDisplayableImage("data:image/svg+xml,<svg/>"), false);
    // Un host che *finisce* per realsmart.it senza esserne sottodominio non passa.
    assert.equal(isAllowedRemoteImage("https://notrealsmart.it/x.jpg"), false);
  });

  test("il lightbox filtra le sorgenti prima di mostrarle", () => {
    // Anche se una sorgente non consentita arrivasse fin qui per un errore a monte.
    assert.match(LIGHTBOX, /images\.filter\(isDisplayableImage\)/);
  });
});

describe("lightbox — accessibilità", () => {
  test("è un dialog modale con titolo accessibile", () => {
    assert.match(LIGHTBOX, /role="dialog"/);
    assert.match(LIGHTBOX, /aria-modal="true"/);
    assert.match(LIGHTBOX, /aria-label=\{c\.dialogTitle\(title\)\}/);
  });

  test('lo stato "immagine X di Y" è annunciabile', () => {
    assert.match(LIGHTBOX, /aria-live="polite"/);
    assert.match(LIGHTBOX, /counter: \(i: number, n: number\) => `Immagine \$\{i\} di \$\{n\}`/);
  });

  test("Escape, frecce e Home/End sono gestiti", () => {
    for (const key of ["Escape", "ArrowRight", "ArrowLeft", "Home", "End"]) {
      assert.ok(LIGHTBOX.includes(`e.key === "${key}"`), `manca la gestione di ${key}`);
    }
  });

  test("focus trap e ritorno del focus alla foto di partenza", () => {
    assert.match(LIGHTBOX, /e\.key !== "Tab"/);
    assert.match(LIGHTBOX, /restoreRef\.current = document\.activeElement/);
    assert.match(LIGHTBOX, /if \(target && document\.contains\(target\)\) target\.focus\(\)/);
  });

  test("lo sfondo non è interagibile: scroll bloccato e Lenis fermo", () => {
    assert.match(LIGHTBOX, /html\.style\.overflow = "hidden"/);
    assert.match(LIGHTBOX, /getLenis\(\)\?\.stop\(\)/);
    assert.match(LIGHTBOX, /getLenis\(\)\?\.start\(\)/);
  });

  test("gli alt non sono inventati: titolo reale + posizione", () => {
    assert.match(LIGHTBOX, /alt=\{`\$\{title\} — immagine \$\{index \+ 1\}`\}/);
    // Le miniature sono decorative: alt vuoto, l'etichetta sta sul bottone.
    assert.match(LIGHTBOX, /<Image src=\{src\} alt="" fill/);
  });

  test("le animazioni rispettano reduced motion", () => {
    assert.match(LIGHTBOX, /motion-safe:transition-opacity/);
    // Nessuna dipendenza di rendering pesante: si guardano gli IMPORT, non le parole nei
    // commenti (il commento in testa al file cita apposta WebGL per dire che non c'è).
    const imports = LIGHTBOX.match(/^import .*$/gm)?.join("\n") ?? "";
    assert.doesNotMatch(imports, /"(ogl|three|gsap)/);
  });

  test("i target touch arrivano a 44px", () => {
    // h-11 = 44px (chiusura), h-12 = 48px (frecce).
    assert.match(LIGHTBOX, /h-11 w-11/);
    assert.match(LIGHTBOX, /h-12 w-12/);
  });

  test("safe area e 100dvh: la barra del browser non copre la foto", () => {
    assert.match(LIGHTBOX, /height: "100dvh"/);
    assert.match(LIGHTBOX, /env\(safe-area-inset-bottom\)/);
    assert.match(LIGHTBOX, /env\(safe-area-inset-top\)/);
  });
});

describe("lightbox — prestazioni", () => {
  test("si precarica solo l'immagine successiva", () => {
    assert.match(LIGHTBOX, /const nextSrc = total > 1 \? safeImages\[\(index \+ 1\) % total\] : null/);
    // Una sola foto grande montata alla volta: la successiva è solo precaricata.
    assert.equal(LIGHTBOX.match(/sizes="100vw"/g)?.length, 2);
  });

  test("le miniature non montano l'intera galleria", () => {
    // Nel feed reale c'è una scheda con 71 foto: la striscia usa una finestra scorrevole.
    assert.match(LIGHTBOX, /const THUMB_WINDOW = \d+;/);
    assert.match(LIGHTBOX, /\.slice\(thumbStart, thumbStart \+ THUMB_WINDOW \* 2 \+ 1\)/);
    assert.doesNotMatch(LIGHTBOX, /safeImages\.map\(\(src, i\) => \(\s*<button/);
  });

  test("il componente si monta solo all'apertura", () => {
    assert.match(GALLERY, /zoomFrom !== null && \(\s*<PropertyLightbox/);
  });

  test("le miniature del lightbox restano lazy", () => {
    assert.match(LIGHTBOX, /loading="lazy"/);
  });
});

describe("lightbox — dati", () => {
  test("una sola immagine: niente frecce, niente miniature", () => {
    assert.match(LIGHTBOX, /\{total > 1 && \(/);
    assert.match(LIGHTBOX, /if \(total < 2\) return;/);
  });

  test("nessuna immagine: il dialog non si apre affatto", () => {
    assert.match(LIGHTBOX, /if \(total === 0\) return null;/);
  });

  test("immagine non caricabile: messaggio esplicito, non un buco nero", () => {
    assert.match(LIGHTBOX, /onError=\{\(\) => setBroken/);
    assert.match(LIGHTBOX, /broken\[index\] \? \(/);
  });

  test("la galleria apre esattamente la foto su cui si è cliccato", () => {
    assert.match(GALLERY, /onClick=\{\(\) => setZoomFrom\(active\)\}/);
    assert.match(GALLERY, /startIndex=\{zoomFrom\}/);
  });

  test("l'apertura è un <button>: click e tastiera senza codice in più", () => {
    assert.match(GALLERY, /<button\s+type="button"\s+onClick=\{\(\) => setZoomFrom\(active\)\}/);
    assert.match(GALLERY, /aria-label=\{c\.open\(active \+ 1\)\}/);
  });
});
