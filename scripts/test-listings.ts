/**
 * Test immobili (Prompt 7): precedenza stato "venduto" (manuale > OCR) e selezione "in evidenza"
 * (mai venduti; ordine featured → recenti → immagini forti).
 *
 * Eseguibile con: npm run test:listings (usa tsx, come test:parser).
 */

import { resolveSold, type DetectedItem } from "../app/lib/realsmart/soldOverrides";
import { selectFeatured } from "../app/lib/listings";
import { normalizedToProperty } from "../app/lib/realsmart/toProperty";
import type { NormalizedProperty } from "../app/lib/realsmart/types";
import type { Property } from "../app/lib/properties";

let failures = 0;
const ok = (cond: boolean, msg: string) => {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
};

// ─── 1. resolveSold: precedenza manuale > OCR, e OCR valido solo se la copertina combacia ───
const COVER = "https://cloud2.realsmart.it/x/724-1.jpg";
const detected: Record<string, DetectedItem> = {
  "100": { sold: true, cover: COVER }, // OCR: venduto, copertina X
  "200": { sold: true, cover: COVER }, // OCR: venduto ma l'agenzia lo corregge a mano
};
const manual: Record<string, boolean> = {
  "200": false, // override manuale: forza DISPONIBILE (falso positivo OCR)
  "300": true, // override manuale: forza VENDUTO (nessun dato OCR)
};

ok(resolveSold("100", COVER, manual, detected) === true, "OCR venduto + copertina invariata → venduto");
ok(resolveSold("100", "https://.../altra.jpg", manual, detected) === false, "OCR venduto ma copertina cambiata → NON venduto (dato stantìo)");
ok(resolveSold("200", COVER, manual, detected) === false, "override manuale=false vince sull'OCR venduto → disponibile");
ok(resolveSold("300", COVER, manual, detected) === true, "override manuale=true forza venduto senza OCR");
ok(resolveSold("999", COVER, manual, detected) === false, "nessun manuale, nessun OCR → disponibile");

// ─── 2. selectFeatured: mai venduti; ordine featured → recenti → foto reale → più immagini ───
const PLACEHOLDER = "/images/premium_01_living_tv_divano.jpg";
function mk(p: Partial<Property> & { slug: string }): Property {
  return {
    title: p.slug,
    zone: "Tradate",
    type: "Appartamento",
    status: "Vendita",
    price: "€ 100.000",
    priceValue: 100000,
    sqm: "80 m²",
    rooms: "3 locali",
    beds: "2 camere",
    baths: "1 bagno",
    badges: [],
    cover: "/images/reali/villa-pool.jpg",
    gallery: ["/images/reali/villa-pool.jpg"],
    excerpt: "",
    description: [],
    features: [],
    ...p,
  } as Property;
}

const listing = [
  mk({ slug: "sold-recent", sold: true, ref: "S1", updatedAt: "2026-07-20" }),
  mk({ slug: "avail-old", updatedAt: "2026-01-01", cover: "/images/reali/attico-tradate.jpg", gallery: ["a", "b", "c"] }),
  mk({ slug: "avail-recent", updatedAt: "2026-07-19", cover: "/images/reali/villa-tramonto.jpg", gallery: ["a", "b"] }),
  mk({ slug: "avail-placeholder", updatedAt: "2026-07-19", cover: PLACEHOLDER, gallery: [PLACEHOLDER] }),
  mk({ slug: "manual-featured", ref: "F1", updatedAt: "2020-01-01", cover: PLACEHOLDER, gallery: [PLACEHOLDER] }),
];

const picked = selectFeatured(listing, { limit: 3, featuredRefs: ["F1"] });
const slugs = picked.map((p) => p.slug);

ok(!slugs.includes("sold-recent"), "un immobile venduto NON compare tra gli in evidenza");
ok(slugs[0] === "manual-featured", "il featured manuale (F1) è primo, anche se vecchio/placeholder");
// Tra i disponibili non-featured, a parità di data (avail-recent vs avail-placeholder) vince la foto reale.
const iRecent = slugs.indexOf("avail-recent");
const iPlaceholder = slugs.indexOf("avail-placeholder");
ok(iRecent !== -1 && (iPlaceholder === -1 || iRecent < iPlaceholder), "a parità di data, la foto reale batte il placeholder");
ok(picked.length === 3, "rispetta il limite (3)");
ok(selectFeatured(listing, { limit: 3, featuredRefs: [] }).every((p) => !p.sold), "nessun venduto anche senza featured manuale");

// ─── 3. normalizedToProperty: foto mancanti → copertina di ripiego, niente dati inventati ───
function mkNorm(p: Partial<NormalizedProperty>): NormalizedProperty {
  return {
    id: "1",
    slug: "casa-test",
    title: "Casa test",
    description: "",
    price: 0,
    priceLabel: "Prezzo su richiesta",
    contract: "vendita",
    type: "Appartamento",
    town: "Tradate",
    province: "VA",
    sqm: 0,
    rooms: 0,
    bedrooms: 0,
    baths: 0,
    features: [],
    images: [],
    status: "published",
    badges: [],
    publishedAt: "",
    updatedAt: "",
    sourceRef: { codice: "1" },
    ...p,
  };
}

const noPhotos = normalizedToProperty(mkNorm({ images: [] }));
ok(noPhotos.cover.startsWith("/images/"), "foto mancanti → copertina di ripiego locale (nessun URL rotto)");
ok(noPhotos.gallery.length === 1 && noPhotos.gallery[0] === noPhotos.cover, "gallery mai vuota: ripiega sulla copertina");
ok(noPhotos.sqm === "—" && noPhotos.rooms === "—", "campi ignoti restano '—' (nessun dato inventato)");
ok(noPhotos.energyClass === undefined, "classe energetica mancante resta undefined (non inventata)");

const withPhotos = normalizedToProperty(
  mkNorm({ images: [{ src: "https://cloud2.realsmart.it/a.jpg" }, { src: "https://cloud2.realsmart.it/b.jpg" }] as NormalizedProperty["images"] }),
);
ok(withPhotos.cover === "https://cloud2.realsmart.it/a.jpg" && withPhotos.gallery.length === 2, "con foto: copertina = prima immagine, gallery completa");

console.log("");
if (failures > 0) {
  console.error(`✗ Test immobili: ${failures} problema/i.`);
  process.exit(1);
}
console.log("✓ Test immobili: tutti i check superati.");
