// Caso studio Open Domus — configurazione TIPIZZATA (Prompt 6).
//
// Regole di integrità:
//  • Ogni metrica numerica ha `verified`. In PRODUZIONE si mostrano SOLO le metriche
//    verified:true CON un valore: mai numeri inventati. Finché il cliente non fornisce i
//    numeri reali, restano verified:false → la sezione racconta la storia in modo QUALITATIVO.
//  • Il video testimonianza è SOLO quello verificato del canale (title/thumbnail/URL coerenti):
//    riusiamo `featuredVideo` (single source content.ts). Nessun video non confermato.

import { featuredVideo, type VerifiedVideo } from "./content";

export const openDomusChapterKeys = ["prima", "preparazione", "evento", "risultato"] as const;
export type OpenDomusChapterKey = (typeof openDomusChapterKeys)[number];

export type CaseMetricKey =
  | "preparationDays"
  | "reach"
  | "attendees"
  | "qualifiedVisits"
  | "offers"
  | "daysToAgreement";

export interface CaseMetric {
  key: CaseMetricKey;
  /** Valore leggibile (es. "18", "1.200", "12"). Vuoto finché non verificato. */
  value: string;
  /** In produzione la metrica si mostra SOLO se true (e con valore). Mai inventare. */
  verified: boolean;
}

export const openDomusCase = {
  /** Testimonianza reale e verificata del canale (storia "venduta al primo Open Domus"). */
  story: featuredVideo as VerifiedVideo,
  /** Media per capitolo (foto reali esistenti; il "prima/dopo" reale le sostituirà). */
  media: {
    prima: "/images/reali/villa-tramonto.jpg",
    preparazione: "/images/reali/consulenza.jpg",
    evento: "/images/reali/open-domus-teresa.jpg",
    risultato: "/images/reali/handshake.jpg",
  } satisfies Record<OpenDomusChapterKey, string>,
  /**
   * Metriche del caso reale. TUTTE verified:false finché il cliente non consegna i numeri:
   * in produzione non si mostra alcuna cifra (storia qualitativa). Per attivarne una:
   * impostare value + verified:true.
   */
  metrics: [
    { key: "preparationDays", value: "", verified: false },
    { key: "reach", value: "", verified: false },
    { key: "attendees", value: "", verified: false },
    { key: "qualifiedVisits", value: "", verified: false },
    { key: "offers", value: "", verified: false },
    { key: "daysToAgreement", value: "", verified: false },
  ] as CaseMetric[],
} as const;

/** Metriche mostrabili in produzione: solo verificate E con valore. Mai numeri inventati. */
export function verifiedOpenDomusMetrics(): CaseMetric[] {
  return openDomusCase.metrics.filter((m) => m.verified && m.value.trim().length > 0);
}
