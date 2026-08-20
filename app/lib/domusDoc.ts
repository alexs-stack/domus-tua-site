// Copy del blocco "Domus D.O.C." sulla scheda immobile — FONTE UNICA, testabile.
//
// PERCHÉ ESISTE. La scheda diceva, per OGNI immobile: «Questo immobile segue il protocollo
// Domus D.O.C.: documenti, conformità e trasparenza controllati prima della vendita». È
// un'affermazione di conformità sul SINGOLO immobile, che i dati normalizzati non confermano
// per tutti. L'assistente era già prudente (knowledge "domus-doc": «vale per ogni incarico…
// quali verifiche siano già state fatte su un immobile preciso te lo conferma il team: io non
// posso attestarlo»). Qui la pagina viene allineata alla stessa condizione di verità.
//
// DUE VARIANTI, una sola regola:
//  • NEUTRA (default): descrive il METODO dell'agenzia, senza affermare che QUESTO immobile è
//    stato certificato. È il default conservativo, mostrato quando non c'è evidenza esplicita.
//  • VERIFICATA: l'affermazione sul singolo immobile, mostrata SOLO quando un campo di evidenza
//    esplicito la conferma (override `docVerified`, mai dedotto dal testo di marketing).
//
// Il testo di produzione qui è volutamente conservativo. Le formulazioni proposte sono in
// docs/copy-review-domus-doc.md, in attesa dell'approvazione di Domus Tua / consulente legale.

export type DocLocale = "it" | "en" | "fr" | "de" | "es";

export interface DomusDocSafetyCopy {
  /** Occhiello, uguale nelle due varianti. */
  eyebrow: string;
  title: string;
  text: string;
  /** Etichetta del link al protocollo (/metodo#domus-doc). */
  linkLabel: string;
  /** Pilastri/attività del protocollo. */
  points: string[];
}

const EYEBROW = "Domus D.O.C.";

const LINK_LABEL: Record<DocLocale, string> = {
  it: "Scopri il protocollo Domus D.O.C.",
  en: "Discover the Domus D.O.C. protocol",
  fr: "Découvrir le protocole Domus D.O.C.",
  de: "Das Protokoll Domus D.O.C. entdecken",
  es: "Descubre el protocolo Domus D.O.C.",
};

// ── NEUTRA (default) — metodo dell'agenzia, nessuna certificazione del singolo immobile ──
const NEUTRAL: Record<DocLocale, Omit<DomusDocSafetyCopy, "eyebrow" | "linkLabel">> = {
  it: {
    title: "Domus D.O.C., il nostro metodo sui documenti",
    text: "Con Domus D.O.C. controlliamo documenti, conformità e trasparenza prima di portare una casa sul mercato: è il metodo con cui seguiamo ogni incarico: i problemi emergono all'inizio, non davanti al notaio. Quali verifiche siano già state fatte su questo immobile te lo conferma il team.",
    points: ["Controllo dei documenti", "Verifica di conformità", "Trasparenza prima della visita"],
  },
  en: {
    title: "Domus D.O.C., our method for the paperwork",
    text: "With Domus D.O.C. we check documents, compliance and transparency before a home reaches the market: it's the method we follow on every mandate: problems surface at the start, not at the closing table. Which checks have already been done on this property is something the team confirms with you.",
    points: ["Document check", "Compliance review", "Transparency before the viewing"],
  },
  fr: {
    title: "Domus D.O.C., notre méthode sur les documents",
    text: "Avec Domus D.O.C. nous contrôlons documents, conformité et transparence avant de mettre un bien sur le marché : c'est la méthode que nous suivons pour chaque mandat : les problèmes apparaissent au début, pas devant le notaire. Les vérifications déjà effectuées sur ce bien, c'est l'équipe qui vous les confirme.",
    points: ["Contrôle des documents", "Vérification de conformité", "Transparence avant la visite"],
  },
  de: {
    title: "Domus D.O.C., unsere Methode für die Unterlagen",
    text: "Mit Domus D.O.C. prüfen wir Unterlagen, Konformität und Transparenz, bevor eine Immobilie auf den Markt kommt: Es ist die Methode, der wir bei jedem Auftrag folgen: Probleme zeigen sich am Anfang, nicht beim Notartermin. Welche Prüfungen bei dieser Immobilie bereits erfolgt sind, bestätigt Ihnen das Team.",
    points: ["Prüfung der Unterlagen", "Konformitätsprüfung", "Transparenz vor der Besichtigung"],
  },
  es: {
    title: "Domus D.O.C., nuestro método sobre los documentos",
    text: "Con Domus D.O.C. comprobamos documentos, conformidad y transparencia antes de llevar una casa al mercado: es el método que seguimos en cada encargo: los problemas aparecen al principio, no ante el notario. Qué comprobaciones ya se han hecho en esta propiedad te lo confirma el equipo.",
    points: ["Control de los documentos", "Verificación de conformidad", "Transparencia antes de la visita"],
  },
};

// ── VERIFICATA — affermazione sul singolo immobile, SOLO con evidenza esplicita ──
const VERIFIED: Record<DocLocale, Omit<DomusDocSafetyCopy, "eyebrow" | "linkLabel">> = {
  it: {
    title: "Una casa verificata, prima ancora di entrare.",
    text: "Questo immobile segue il protocollo Domus di Origine Certificata: documenti, conformità e trasparenza controllati prima della vendita. Così visiti e scegli sapendo già cosa c'è nei documenti.",
    points: ["Documenti in ordine", "Conformità controllata", "Trasparenza pre-visita"],
  },
  en: {
    title: "A verified home, before you even step inside.",
    text: "This property follows the Domus of Certified Origin protocol: documents, compliance and transparency checked before the sale. So you view and choose already knowing what the paperwork says.",
    points: ["Documents in order", "Compliance checked", "Pre-visit transparency"],
  },
  fr: {
    title: "Un logement vérifié, avant même d’entrer.",
    text: "Ce bien suit le protocole Domus d’Origine Certifiée : documents, conformité et transparence contrôlés avant la vente. Vous visitez et choisissez en sachant déjà ce que disent les documents.",
    points: ["Documents en ordre", "Conformité contrôlée", "Transparence avant visite"],
  },
  de: {
    title: "Eine geprüfte Immobilie, noch bevor Sie eintreten.",
    text: "Diese Immobilie folgt dem Protokoll Domus di Origine Certificata: Unterlagen, Konformität und Transparenz werden vor dem Verkauf geprüft. So besichtigen und entscheiden Sie und wissen bereits, was in den Unterlagen steht.",
    points: ["Unterlagen in Ordnung", "Konformität geprüft", "Transparenz vor der Besichtigung"],
  },
  es: {
    title: "Una casa verificada, antes incluso de entrar.",
    text: "Esta propiedad sigue el protocolo Domus di Origine Certificata: documentos, conformidad y transparencia comprobados antes de la venta. Así visitas y eliges sabiendo ya lo que dicen los documentos.",
    points: ["Documentos en orden", "Conformidad comprobada", "Transparencia previa a la visita"],
  },
};

function toDocLocale(locale: string): DocLocale {
  return (["it", "en", "fr", "de", "es"] as const).includes(locale as DocLocale)
    ? (locale as DocLocale)
    : "it";
}

/**
 * Copy del blocco Domus D.O.C. per la scheda immobile.
 * `verified` = true SOLO con evidenza esplicita (override docVerified). Altrimenti la variante
 * neutra (metodo), che non afferma nulla di specifico su questo immobile.
 */
export function domusDocSafety(locale: string, verified: boolean): DomusDocSafetyCopy {
  const key = toDocLocale(locale);
  const variant = verified ? VERIFIED[key] : NEUTRAL[key];
  return { eyebrow: EYEBROW, linkLabel: LINK_LABEL[key], ...variant };
}
