// Caricamento immobili per i CLI territoriali — RIUSA il pipeline RealSmart esistente.
//
// Nessun secondo parser: da file XML si passa per lo STESSO parseRealSmartPayload + normalize del
// sito; senza file si usa getLiveListings(), la facciata già cablata sul feed pubblico.

import { readFileSync } from "node:fs";
import { XMLParser } from "fast-xml-parser";
import { parseRealSmartPayload } from "../../app/lib/realsmart/parse";
import { normalizeRealSmartListing } from "../../app/lib/realsmart/normalize";
import { getLiveListings } from "../../app/lib/realsmart/client";
import type { NormalizedProperty } from "../../app/lib/realsmart/types";

/** Legge gli immobili da un file XML esplicito, oppure dal feed live. */
export async function loadListings(file?: string): Promise<NormalizedProperty[]> {
  if (file) {
    const xml = readFileSync(file, "utf8");
    const parser = new XMLParser({ ignoreAttributes: true, trimValues: true });
    const raw = parseRealSmartPayload(parser.parse(xml));
    return raw.map(normalizeRealSmartListing);
  }
  return getLiveListings();
}
