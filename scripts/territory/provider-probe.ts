// Sonda LIVE del provider Overpass (Prompt 11) — SEPARATA dai test e OPT-IN.
//
// I test unitari usano SOLO fixture: non toccano mai la rete. Questa sonda invece esegue UNA vera
// chiamata all'endpoint Overpass per un'origine, per verificare in produzione che il contratto regga
// (endpoint sani, categorie coperte, evidenza presente). NON parte da sola: richiede il flag esplicito
// TERRITORY_LIVE_PROBE=1, così nessun run accidentale genera traffico esterno.
//
// USO (esplicito, cittadinanza rispettata — una sola chiamata):
//   TERRITORY_LIVE_PROBE=1 npm run territory:provider-probe -- --lat=45.708 --lng=8.906 [--radius=1500]
//
// Stampa: numero di POI per categoria, evidenza del primo POI, salute degli endpoint. MAI coordinate
// esatte dei POI, mai payload grezzo.

import "../load-env";

import { OsmOverpassProvider } from "../../app/lib/territory/provider/osm";
import { KNOWN_OVERPASS_MIRRORS } from "../../app/lib/territory/provider/endpoints";
import { TERRITORY_POI_CATEGORIES } from "../../app/lib/territory/categories";

function flag(name: string): string | undefined {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : undefined;
}

async function main(): Promise<void> {
  if (process.env.TERRITORY_LIVE_PROBE !== "1") {
    console.error(
      "✗ Sonda live disattivata. È OPT-IN: esporta TERRITORY_LIVE_PROBE=1 per eseguire UNA chiamata reale.",
    );
    process.exit(1);
  }

  const lat = Number(flag("lat"));
  const lng = Number(flag("lng"));
  const radius = Number(flag("radius") ?? "1500");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    console.error("✗ Servono --lat e --lng validi.");
    process.exit(1);
  }

  // Mirror opt-in solo se richiesti esplicitamente; default = istanza principale.
  const useMirrors = process.env.TERRITORY_OVERPASS_MIRRORS === "1";
  const provider = new OsmOverpassProvider(useMirrors ? { endpoints: KNOWN_OVERPASS_MIRRORS } : {});

  console.log(`Sonda Overpass · origine ~(${lat.toFixed(3)}, ${lng.toFixed(3)}) · raggio ${radius} m`);
  const started = Date.now();
  const places = await provider.searchNearby({
    origin: { lat, lng },
    radiusMeters: radius,
    categories: [...TERRITORY_POI_CATEGORIES],
    language: "it",
  });
  const ms = Date.now() - started;

  const perCategory = new Map<string, number>();
  for (const p of places) perCategory.set(p.category, (perCategory.get(p.category) ?? 0) + 1);

  console.log(`✓ ${places.length} POI in ${ms} ms`);
  for (const c of TERRITORY_POI_CATEGORIES) console.log(`  ${c.padEnd(18)} ${perCategory.get(c) ?? 0}`);
  if (places[0]) console.log(`  evidenza(primo): ${places[0].evidence.key}=${places[0].evidence.value}`);

  console.log("Salute endpoint:");
  for (const h of provider.endpointHealth()) {
    console.log(`  ${h.endpoint} · ${h.state} · ok=${h.totalOk} fail=${h.totalFail}`);
  }
}

main().catch((err) => {
  console.error("✗ sonda fallita:", err instanceof Error ? `${err.name}: ${err.message}` : err);
  process.exit(1);
});
