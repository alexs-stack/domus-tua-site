// Barrel dell'integrazione RealSmart.
// Import consigliato dal resto del sito: `import { getLiveListings } from "@/app/lib/realsmart"`.

export type {
  ContractType,
  ListingStatus,
  NormalizedImage,
  NormalizedProperty,
  RealSmartListingRaw,
  RealSmartLocation,
  RealSmartMedia,
} from "./types";

export { normalizeRealSmartListing } from "./normalize";
export { getMockRealSmartListings } from "./mocks";
export { getLiveListings, REVALIDATE_SECONDS } from "./client";
