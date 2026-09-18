// IL TUFFO DELLE 11 PAGEHERO, LETTO DAL SORGENTE E DAI FILE.
//
// A20 di Alberto (13 settembre 2026, «Fedeltà letterale»): tuffo sticky su tutte
// le PageHero, dentro un corridoio che da 1024 px e 640 px d'altezza con motion ok
// è alto 100svh + 120svh (spec §5.1, D22). D33: la foto base con `preload` resta
// l'LCP a 100vw da 1024; lo strato nitido a 200vw arriva dopo, solo a DPR 1 e solo
// per sorgenti più larghe di 1920 px. Spec §7.4: una foto della villa per pagina,
// `villa-fronte-acqua.jpg` solo in home. Qui si rileggono i sorgenti e le
// intestazioni JPEG; il movimento lo prova e2e/page-hero-dive.spec.ts.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BAND_SIZES, DIVE, DIVE_BOTTOM_SEL, SHARP_SIZES, diveDeltas, type DiveBox } from "../motion/page-dive";
import { chapters, scrubOf } from "../motion/chapters";

const ROOT = process.cwd();
const leggi = (p: string) => readFileSync(join(ROOT, p), "utf8");

/** Commenti via prima di cercare, come logo-colore.test.ts: i file spiegano i divieti nominandoli. */
function soloCodice(testo: string): string {
  return testo.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Larghezza e altezza dal marcatore SOF di un JPEG, senza dipendenze. */
function jpeg(p: string): { w: number; h: number } {
  const b = readFileSync(join(ROOT, p));
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const m = b[i + 1];
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    }
    i += 2 + len;
  }
  throw new Error(`${p}: nessun marcatore SOF`);
}

/** Il blocco `<PageHero … />` di un file di contenuto, senza commenti. */
function bloccoPageHero(file: string): string {
  const t = soloCodice(leggi(file));
  const i = t.indexOf("<PageHero");
  assert.notEqual(i, -1, `${file}: nessun <PageHero`);
  return t.slice(i, t.indexOf("/>", i) + 2);
}
const imageDi = (blocco: string) => /image="([^"]+)"/.exec(blocco)?.[1] ?? "";
const srcWidthDi = (blocco: string) => Number(/srcWidth=\{(\d+)\}/.exec(blocco)?.[1] ?? Number.NaN);

/** cubic-bezier(x1, y1, x2, y2), come una CustomEase a un segmento: y in funzione di x, per bisezione. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const b = (p1: number, p2: number, t: number) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      if (b(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return b(y1, y2, (lo + hi) / 2);
  };
}

const CONTENUTI = [
  "app/vendi/VendiContent.tsx",
  "app/acquista/AcquistaContent.tsx",
  "app/servizi/ServiziContent.tsx",
  "app/metodo/MetodoContent.tsx",
  "app/chi-siamo/ChiSiamoContent.tsx",
  "app/recensioni/RecensioniContent.tsx",
  "app/open-domus/OpenDomusPageContent.tsx",
  "app/lavora-con-noi/LavoraConNoiContent.tsx",
  "app/domande-frequenti/FaqContent.tsx",
  "app/privacy/PrivacyContent.tsx",
  "app/cookie/CookieContent.tsx",
] as const;

describe("i conti del tuffo (spec §5.1)", () => {
  test("Δb e Δt alle tre larghezze stimate in lane-globali §1.3", () => {
    assert.deepEqual(diveDeltas({ vh: 900, bandTop: 430, bandH: 810, textBottom: 403 }), { db: 340, dt: 427 });
    assert.deepEqual(diveDeltas({ vh: 768, bandTop: 400, bandH: 576, textBottom: 381 }), { db: 208, dt: 405 });
    assert.deepEqual(diveDeltas({ vh: 1080, bandTop: 550, bandH: 1080, textBottom: 600 }), { db: 550, dt: 687.5 });
  });

  test("una banda che sta tutta nello schermo non sale, il testo esce lo stesso", () => {
    assert.deepEqual(diveDeltas({ vh: 1366, bandTop: 400, bandH: 576, textBottom: 381 }), { db: 0, dt: 405 });
  });

  test("tempi, scale e soglie sono quelli della spec", () => {
    assert.equal(DIVE.liftEnd, 0.6);
    assert.equal(DIVE.zoomStart, 0.4);
    assert.equal(DIVE.zoomTo, 2);
    assert.equal(DIVE.origin, "50% 75%");
    assert.equal(DIVE.textMargin, 24);
    assert.equal(DIVE.bandFactor, 1.25);
    assert.equal(DIVE.tabletScale, 1.08);
    assert.equal(DIVE.phoneScale, 1.06);
    assert.equal(DIVE.sharpAt, 0.4);
    assert.equal(DIVE.sharpMinSrc, 1920);
    assert.equal(DIVE.sharpIdleMs, 2500);
  });

  test("sizes: 200vw sotto 768, 108vw fino a 1023, 100vw da 1024; strato nitido 200vw (D33)", () => {
    assert.equal(BAND_SIZES, "(max-width: 767.98px) 200vw, (max-width: 1023.98px) 108vw, 100vw");
    assert.equal(SHARP_SIZES, "200vw");
  });

  test("a p 0,8 il bordo alto della scatola che scala: sopra l'asse del segno a 1440×900, sotto a 1024×768", () => {
    // Spec §5.1 (timeline di A20) contro spec §5.1 e §6.1 (tema foto del segno di D34 a p 0,8 su /vendi).
    // dtIn ha le cifre di spec §2.6; l'asse del segno sta a --dt-head-h / 2, con
    // --dt-head-h = clamp(4.5rem, 10vh, 6.5rem) (globals.css:162, lane-globali.md:320).
    const dtIn = bezier(0.5, 0, 0.75, 0);
    const bordoAlto = (b: DiveBox, p: number) => {
      const { db } = diveDeltas(b);
      const s = p <= DIVE.zoomStart ? 1 : 1 + (DIVE.zoomTo - 1) * dtIn((p - DIVE.zoomStart) / (1 - DIVE.zoomStart));
      return b.bandTop - db - 0.75 * b.bandH * (s - 1);
    };
    const asse = (vh: number) => Math.min(Math.max(72, 0.1 * vh), 104) / 2;
    const larga: DiveBox = { vh: 900, bandTop: 430, bandH: 810, textBottom: 403 };
    const stretta: DiveBox = { vh: 768, bandTop: 400, bandH: 576, textBottom: 381 };
    assert.ok(Math.abs(bordoAlto(larga, 0.8) + 28.6) < 1, `1440×900: bordo alto a ${bordoAlto(larga, 0.8).toFixed(1)} px`);
    assert.ok(bordoAlto(larga, 0.8) <= asse(900), "a 1440×900 il centro del segno sta sulla foto");
    assert.ok(Math.abs(bordoAlto(stretta, 0.8) - 107.6) < 1, `1024×768: bordo alto a ${bordoAlto(stretta, 0.8).toFixed(1)} px`);
    // Oggi a 1024×768, a p 0,8, il centro del segno sta sopra la foto e il tema resta grafite.
    // Se questa riga cade, la timeline o la testata sono cambiate.
    assert.ok(bordoAlto(stretta, 0.8) > asse(768), "a 1024×768 il centro del segno sta sopra la foto a p 0,8");
    let lo = 0.8;
    let hi = 1;
    for (let i = 0; i < 30; i += 1) {
      const mid = (lo + hi) / 2;
      if (bordoAlto(stretta, mid) > asse(768)) lo = mid;
      else hi = mid;
    }
    assert.ok(hi > 0.85 && hi < 0.88, `a 1024×768 la foto arriva sull'asse del segno a p ${hi.toFixed(3)}`);
  });
});

describe("PageHero, PageHeroDive e PageHeroBand (spec §5.1)", () => {
  test("PageHero resta server, senza Parallax e senza TextLines, e segna i testi del tuffo", () => {
    const hero = soloCodice(leggi("app/components/PageHero.tsx"));
    assert.doesNotMatch(hero, /["']use client["']/);
    assert.doesNotMatch(hero, /\bParallax\b/);
    assert.doesNotMatch(hero, /\bTextLines\b/);
    assert.match(hero, /<PageHeroDive\b/);
    assert.match(hero, /<PageHeroBand\b/);
    // Due gruppi (D50, giro di correzione 1 dei commit 6-7): uno per la testa e uno annidato
    // per la colonna del lead, che da lg sta accanto al titolo e sotto lg nasce fuori dal
    // viewport. lead-migrazione.test.ts ne pretende due; questo commit non tocca i gruppi.
    assert.equal((hero.match(/<RevealGroup\b/g) ?? []).length, 2, "PageHero vuole i due RevealGroup di D50");
    assert.match(hero, /data-dive-content/);
    assert.match(hero, /data-dive-band/);
    assert.ok((hero.match(/data-dive-text/g) ?? []).length >= 5, "servono data-dive-text su occhiello, h1, lead, CTA e prove");
    assert.match(hero, /srcWidth:\s*number/);
    assert.match(hero, /objectPosition\?:\s*string/);
    assert.doesNotMatch(hero, /data-dive-band[^>]*data-bg/, "data-bg sta sulla scatola che scala, non sulla banda");
  });

  test("PageHeroDive: corridoio page-dive in cima, dtEase e dtIn, nessun pin", () => {
    const dive = soloCodice(leggi("app/components/motion/PageHeroDive.tsx"));
    assert.match(dive, /^\s*["']use client["']/);
    assert.match(dive, /useCorridor\(\s*ref,\s*\{/);
    assert.match(dive, /id:\s*"page-dive"/);
    assert.match(dive, /stick:\s*"top"/);
    assert.match(dive, /data-corridor="page-dive"/);
    assert.match(dive, /data-stick="top"/);
    assert.match(dive, /data-corridor-screen/);
    assert.match(dive, /data-corridor-run/);
    assert.match(dive, /ease:\s*"dtEase"/);
    assert.match(dive, /ease:\s*"dtIn"/);
    assert.match(dive, /endTrigger:\s*band/);
    assert.doesNotMatch(dive, /\bpin\s*:|pinSpacing|anticipatePin|refreshPriority/);
  });

  test("PageHeroDive: il fondo del testo di Δt comprende la calligrafia (spec §5.1)", () => {
    // Il contenuto esce dall'alto prima dello zoom, calligrafia compresa: measure() legge DIVE_BOTTOM_SEL e non i soli
    // data-dive-text, e ScriptWord porta ancora la classe che il selettore cerca.
    assert.equal(DIVE_BOTTOM_SEL, "[data-dive-text], .script-word");
    const dive = soloCodice(leggi("app/components/motion/PageHeroDive.tsx"));
    assert.match(dive, /querySelectorAll<HTMLElement>\(DIVE_BOTTOM_SEL\)/);
    assert.doesNotMatch(dive, /querySelectorAll<HTMLElement>\("\[data-dive-text\]"\)/);
    assert.match(soloCodice(leggi("app/components/motion/ScriptWord.tsx")), /["`]script-word\b/);
  });

  test("PageHeroBand: base LCP con preload, strato nitido dopo l'idle e solo a DPR 1, data-bg sulla scatola", () => {
    const band = soloCodice(leggi("app/components/motion/PageHeroBand.tsx"));
    assert.match(band, /^\s*["']use client["']/);
    assert.match(band, /<div[^>]*\bdata-dive-zoom\b[^>]*\bdata-bg="foto"/);
    assert.match(band, /data-dive-inner/);
    const base = /<Image\s+data-dive-base[\s\S]*?\/>/.exec(band)?.[0] ?? "";
    assert.match(base, /\bpreload\b/);
    assert.match(base, /sizes=\{BAND_SIZES\}/);
    assert.match(base, /quality=\{60\}/);
    assert.doesNotMatch(base, /fetchPriority/);
    const sharp = /<Image\s+data-dive-sharp[\s\S]*?onLoad/.exec(band)?.[0] ?? "";
    assert.match(sharp, /sizes=\{SHARP_SIZES\}/);
    assert.match(sharp, /fetchPriority="low"/);
    assert.doesNotMatch(sharp, /\bpreload\b/);
    assert.match(band, /devicePixelRatio\s*!==\s*1/);
    assert.match(band, /largest-contentful-paint/, "D33: lo strato nitido aspetta la voce LCP della foto base");
    assert.match(band, /requestIdleCallback/);
    assert.match(band, /DIVE\.sharpMinSrc/);
    assert.match(band, /MQ\.corridor/);
  });

  test("globals.css dà 120svh di corsa al corridoio page-dive", () => {
    assert.match(leggi("app/globals.css"), /\[data-corridor="page-dive"\]\s*\{[^}]*--corridor-run:\s*120svh/);
  });

  test("chapters.ts registra la firma del tuffo delle pagine interne", () => {
    // Dal registro dei capitoli, non dal testo del file: la voce "page-dive" ripete la firma dell'hero (A20, spec §5.1).
    const firma = chapters["page-dive"].signature;
    assert.equal(firma.ease, "dtIn");
    assert.equal(scrubOf("page-dive"), true);
    assert.ok("st" in firma.trigger, "page-dive vuole un innesco in scroll");
    assert.deepEqual((firma.trigger as { st: [string, string] }).st, ["top top", "bottom bottom"]);
  });

  test("ogni chiamante passa la larghezza vera del file della banda", () => {
    for (const file of CONTENUTI) {
      const blocco = bloccoPageHero(file);
      const image = imageDi(blocco);
      assert.ok(image.startsWith("/images/"), `${file}: image non trovata`);
      const { w } = jpeg(join("public", image));
      assert.equal(srcWidthDi(blocco), w, `${file}: srcWidth deve valere ${w} (${image})`);
    }
  });
});

describe("bande della villa, gruppo 1 (spec §7.4)", () => {
  const GRUPPO_1 = [
    {
      file: "app/vendi/VendiContent.tsx",
      image: "/images/reali/villa-piscina-facciata.jpg",
      pos: "50% 55%",
      alt: [
        "Villa contemporanea con rivestimento color rame, piscina e lettini bianchi, alberi alti sulla destra",
        "Contemporary villa with copper-coloured cladding, a pool and white sun loungers, tall trees on the right",
        "Villa contemporaine au revêtement couleur cuivre, piscine et transats blancs, grands arbres sur la droite",
        "Moderne Villa mit kupferfarbener Verkleidung, Pool und weißen Liegen, hohe Bäume auf der rechten Seite",
        "Villa contemporánea con revestimiento color cobre, piscina y tumbonas blancas, árboles altos a la derecha",
      ],
      vecchi: [
        "Living luminoso con zona pranzo",
        "Bright living area with dining space",
        "Séjour lumineux avec coin repas",
        "Helles Wohnzimmer mit Essbereich",
        "Salón luminoso con zona de comedor",
      ],
    },
    {
      file: "app/acquista/AcquistaContent.tsx",
      image: "/images/reali/villa-lettini.jpg",
      pos: "50% 50%",
      alt: [
        "Due lettini bianchi sul bordo della piscina, dietro la villa con la tenda da sole",
        "Two white sun loungers at the edge of the pool, with the villa and its awning behind",
        "Deux transats blancs au bord de la piscine, avec derrière la villa et son store",
        "Zwei weiße Liegen am Poolrand, dahinter die Villa mit der Markise",
        "Dos tumbonas blancas al borde de la piscina, detrás la villa con el toldo",
      ],
      vecchi: [
        "Living moderno bianco e luminoso",
        "Bright, modern white living room",
        "Séjour moderne, blanc et lumineux",
        "Helles, modernes weißes Wohnzimmer",
        "Salón moderno blanco y luminoso",
      ],
    },
    {
      file: "app/servizi/ServiziContent.tsx",
      image: "/images/reali/villa-angolo-piscina.jpg",
      pos: "50% 60%",
      alt: [
        "Angolo della piscina con la facciata della villa a sinistra e una siepe alta con alberi a destra",
        "Corner of the pool with the villa's façade on the left and a tall hedge with trees on the right",
        "Angle de la piscine avec la façade de la villa à gauche et une haute haie avec des arbres à droite",
        "Ecke des Pools mit der Fassade der Villa links und einer hohen Hecke mit Bäumen rechts",
        "Esquina de la piscina con la fachada de la villa a la izquierda y un seto alto con árboles a la derecha",
      ],
      vecchi: ["Cucina moderna luminosa", "Bright modern kitchen", "Cuisine moderne et lumineuse", "Helle moderne Küche", "Cocina moderna y luminosa"],
    },
    {
      file: "app/open-domus/OpenDomusPageContent.tsx",
      image: "/images/reali/villa-portico-tenda.jpg",
      pos: "50% 60%",
      alt: [
        "Portico con tenda da sole aperta e poltrone da esterno, una statua scura in primo piano e la piscina sullo sfondo",
        "Porch with an open awning and outdoor armchairs, a dark statue in the foreground and the pool in the background",
        "Portique avec store ouvert et fauteuils d'extérieur, une statue sombre au premier plan et la piscine à l'arrière-plan",
        "Säulengang mit ausgefahrener Markise und Gartensesseln, eine dunkle Statue im Vordergrund und der Pool im Hintergrund",
        "Porche con el toldo abierto y sillones de exterior, una estatua oscura en primer plano y la piscina al fondo",
      ],
      vecchi: [
        "Living moderno con accenti senape",
        "Modern living room with mustard accents",
        "Séjour moderne aux accents moutarde",
        "Modernes Wohnzimmer mit senffarbenen Akzenten",
        "Salón moderno con acentos mostaza",
      ],
    },
  ] as const;

  for (const g of GRUPPO_1) {
    test(`${g.file}: ${g.image} a ${g.pos}, larghezza vera e alt nelle cinque lingue`, () => {
      const blocco = bloccoPageHero(g.file);
      assert.equal(imageDi(blocco), g.image);
      assert.match(blocco, new RegExp(`objectPosition="${g.pos}"`));
      assert.equal(srcWidthDi(blocco), jpeg(join("public", g.image)).w);
      const testo = leggi(g.file);
      for (const a of g.alt) assert.ok(testo.includes(`"${a}"`), `${g.file}: manca l'alt «${a}»`);
      for (const a of g.vecchi) assert.ok(!testo.includes(`"${a}"`), `${g.file}: resta l'alt di repertorio «${a}»`);
    });
  }

  test("nessuna testa usa villa-fronte-acqua e nessuna foto della villa si ripete fra le PageHero", () => {
    const ville = CONTENUTI.map((f) => imageDi(bloccoPageHero(f))).filter((i) => i.includes("/villa-"));
    assert.ok(!ville.some((i) => i.endsWith("villa-fronte-acqua.jpg")), "villa-fronte-acqua.jpg sta solo nella finestra della home (§7.4)");
    assert.equal(new Set(ville).size, ville.length, `foto della villa ripetuta: ${ville.join(", ")}`);
  });
});

describe("bande della villa, gruppo 2: fermi 16:9 con object-position misurato (spec §7.4)", () => {
  const posizioni = JSON.parse(leggi("app/lib/motion/band-positions.json")) as Record<string, string>;
  const uliveto = existsSync(join(ROOT, "public/images/reali/villa-uliveto.jpg"));
  const GRUPPO_2 = [
    {
      rotta: "/metodo",
      file: "app/metodo/MetodoContent.tsx",
      image: "/images/reali/villa-vetrata-lanterne.jpg",
      fermo: true,
      alt: [
        "Vetrata del soggiorno aperta sul portico, con due lanterne bianche sul muretto in pietra",
        "Living-room glass doors opening onto the porch, with two white lanterns on the low stone wall",
        "Baie vitrée du séjour ouverte sur le portique, avec deux lanternes blanches sur le muret en pierre",
        "Glasfront des Wohnzimmers zum Säulengang hin geöffnet, mit zwei weißen Laternen auf der niedrigen Steinmauer",
        "Cristalera del salón abierta al porche, con dos faroles blancos sobre el murete de piedra",
      ],
    },
    {
      rotta: "/recensioni",
      file: "app/recensioni/RecensioniContent.tsx",
      image: "/images/reali/villa-salotto-ombrellone.jpg",
      fermo: true,
      alt: [
        "Divani bianchi da esterno sotto un ombrellone, fra un muro in pietra e la siepe",
        "White outdoor sofas under a parasol, between a stone wall and the hedge",
        "Canapés d'extérieur blancs sous un parasol, entre un mur en pierre et la haie",
        "Weiße Gartensofas unter einem Sonnenschirm, zwischen einer Steinmauer und der Hecke",
        "Sofás blancos de exterior bajo una sombrilla, entre un muro de piedra y el seto",
      ],
    },
    {
      // D63 (coordinatore, 18 set. 2026): /privacy è l'unica banda senza fermo del video tour. Il suo
      // (villa-facciata-lettini.jpg) non esiste — scartato dal commit 12 per R1, una persona seduta dietro
      // la vetrata — e nessuna delle sette foto della villa è libera, perché ognuna sta già in un'altra
      // testa. La rotta tiene la foto di oggi coi suoi attributi: nessun `objectPosition`, quindi il
      // ritaglio 4:5 del telefono resta centrato, e nessun import di band-positions.json.
      rotta: "/privacy",
      file: "app/privacy/PrivacyContent.tsx",
      image: "/images/hero_01_attico_travi_salotto.jpg",
      fermo: false,
      alt: [
        "Salotto luminoso di un attico con travi a vista",
        "Bright penthouse living room with exposed beams",
        "Salon lumineux d’un attique aux poutres apparentes",
        "Helles Wohnzimmer eines Penthouses mit sichtbaren Balken",
        "Salón luminoso de un ático con vigas a la vista",
      ],
    },
    {
      rotta: "/cookie",
      file: "app/cookie/CookieContent.tsx",
      image: "/images/reali/villa-uliveto.jpg",
      fermo: true,
      alt: [
        "Giardino con ulivi, prato e un vialetto in pietra accanto alla casa",
        "Garden with olive trees, a lawn and a stone path beside the house",
        "Jardin avec des oliviers, une pelouse et une allée en pierre à côté de la maison",
        "Garten mit Olivenbäumen, Rasen und einem Steinweg neben dem Haus",
        "Jardín con olivos, césped y un sendero de piedra junto a la casa",
      ],
    },
  ] as const;

  for (const g of GRUPPO_2) {
    test(`${g.file}: fermo della villa se il file esiste, object-position da band-positions.json, alt nelle cinque lingue`, () => {
      const blocco = bloccoPageHero(g.file);
      const testo = leggi(g.file);
      if (g.rotta === "/cookie" && !uliveto) {
        assert.equal(imageDi(blocco), "/images/hero_01_attico_travi_salotto.jpg", "senza villa-uliveto.jpg /cookie tiene la banda di oggi");
        assert.ok(!("/cookie" in posizioni), "band-positions.json non deve avere /cookie senza il file");
        assert.doesNotMatch(blocco, /objectPosition=/);
        return;
      }
      assert.equal(imageDi(blocco), g.image);
      assert.equal(srcWidthDi(blocco), jpeg(join("public", g.image)).w);
      for (const a of g.alt) assert.ok(testo.includes(`"${a}"`), `${g.file}: manca l'alt «${a}»`);
      if (!g.fermo) {
        assert.doesNotMatch(blocco, /objectPosition=/, `${g.file}: D63 lascia la banda coi suoi attributi di oggi`);
        assert.doesNotMatch(testo, /band-positions\.json/, `${g.file}: D63 non consuma la misura`);
        return;
      }
      assert.match(posizioni[g.rotta] ?? "", /^(30|40|50|60|70)% 50%$/);
      assert.ok(blocco.includes(`objectPosition={bandPositions["${g.rotta}"]}`), `${g.file}: objectPosition non legge band-positions.json`);
      assert.match(testo, /import bandPositions from "\.\.\/lib\/motion\/band-positions\.json";/);
    });
  }
});

describe("calligrafia sulla banda della villa (spec §7.4, nota di D15)", () => {
  const esito = JSON.parse(
    leggi("docs/superpowers/specs/2026-09-13-coreografia-era-residence/misure/18/calligrafia-esito.json"),
  ) as Record<string, string>;
  const FILE: Record<string, string> = {
    "/vendi": "app/vendi/VendiContent.tsx",
    "/acquista": "app/acquista/AcquistaContent.tsx",
    "/servizi": "app/servizi/ServiziContent.tsx",
    "/open-domus": "app/open-domus/OpenDomusPageContent.tsx",
    "/metodo": "app/metodo/MetodoContent.tsx",
    "/recensioni": "app/recensioni/RecensioniContent.tsx",
  };

  test("l'esito a occhio copre le sei rotte della villa con scriptWord", () => {
    assert.deepEqual(Object.keys(esito), Object.keys(FILE));
    for (const v of Object.values(esito)) assert.match(v, /^(leggibile|illeggibile)$/);
  });

  test("PageHero: scriptInset porta la colonna del titolo a lg:pb-[5.5vw], senza resta lg:pb-[4.5vw]", () => {
    const hero = soloCodice(leggi("app/components/PageHero.tsx"));
    assert.match(hero, /scriptInset\?:\s*boolean/);
    assert.match(hero, /scriptInset = false/);
    assert.match(hero, /scriptInset \? "lg:-mb-\[6vw\] lg:pb-\[5\.5vw\]" : "lg:-mb-\[6vw\] lg:pb-\[4\.5vw\]"/);
  });

  for (const [rotta, file] of Object.entries(FILE)) {
    test(`${file}: scriptInset solo se la calligrafia di ${rotta} è illeggibile`, () => {
      const blocco = bloccoPageHero(file);
      assert.match(blocco, /scriptWord=/);
      assert.equal(/\bscriptInset\b/.test(blocco), esito[rotta] === "illeggibile", `${rotta}: esito ${esito[rotta]}`);
    });
  }
});

// Spec §7.4: tre teste su undici tengono la foto che hanno oggi. /chi-siamo aspetta uno scatto della
// sede o del team da almeno 2560 px (domanda 2.15); /lavora-con-noi e /domande-frequenti tengono
// `consulenza.jpg`. Tutte e tre le sorgenti sono larghe 1920 px, cioè non oltre DIVE.sharpMinSrc:
// lo strato nitido di D33 non si monta e la banda resta la sola foto.
describe("gruppo 3: foto invariate (spec §7.4)", () => {
  const GRUPPO_3 = [
    { file: "app/chi-siamo/ChiSiamoContent.tsx", image: "/images/hero_01_attico_travi_salotto.jpg" },
    { file: "app/lavora-con-noi/LavoraConNoiContent.tsx", image: "/images/reali/consulenza.jpg" },
    { file: "app/domande-frequenti/FaqContent.tsx", image: "/images/reali/consulenza.jpg" },
  ] as const;

  for (const g of GRUPPO_3) {
    test(`${g.file}: banda di oggi, larghezza vera, niente strato nitido`, () => {
      const blocco = bloccoPageHero(g.file);
      assert.equal(imageDi(blocco), g.image);
      assert.doesNotMatch(blocco, /objectPosition=/);
      const w = srcWidthDi(blocco);
      assert.equal(w, jpeg(join("public", g.image)).w);
      assert.ok(w <= DIVE.sharpMinSrc, `${g.file}: sorgente da ${w} px, lo strato nitido si monterebbe`);
    });
  }
});
