// ═══════════════════════════════════════════════════════════════════════════
// ⚠️  DATI DEMO — DA SOSTITUIRE prima del "live".
// Gli immobili qui sotto sono fittizi e servono solo per la preview/presentazione.
// Sorgente reale: gestionale RealSmart (vedi docs/client-assets-needed.md, Priorità 1).
// Non citare questi immobili come reali in demo col cliente.
// ═══════════════════════════════════════════════════════════════════════════
// ⚠️ DATI DEMO / FIXTURE — immobili fittizi. NON importare direttamente nei componenti visibili:
// passa sempre dalla facciata app/lib/listings.ts (getVisibleListings). Quando RealSmart sarà
// collegato, la facciata userà getLiveListings() e questo file resta solo come fallback/demo.
// Le immagini riutilizzano la libreria asset esistente.

export type Property = {
  slug: string;
  title: string;
  zone: string;
  type: "Appartamento" | "Attico" | "Villa";
  status: "Vendita" | "Affitto";
  price: string;
  priceValue: number;
  sqm: string;
  rooms: string;
  beds: string;
  baths: string;
  badges: string[];
  cover: string;
  gallery: string[];
  excerpt: string;
  description: string[];
  features: string[];
};

export const properties: Property[] = [
  {
    slug: "attico-travi-tradate-centro",
    title: "Attico con travi a vista",
    zone: "Tradate, centro",
    type: "Attico",
    status: "Vendita",
    price: "€ 420.000",
    priceValue: 420000,
    sqm: "145 m²",
    rooms: "4 locali",
    beds: "3 camere",
    baths: "2 bagni",
    badges: ["In esclusiva", "Documenti verificati"],
    cover: "/images/hero_02_attico_travi_living.jpg",
    gallery: [
      "/images/hero_02_attico_travi_living.jpg",
      "/images/hero_01_attico_travi_salotto.jpg",
      "/images/premium_03_cucina_moderna.jpg",
      "/images/rendering_03_master_bedroom_legno.jpg",
    ],
    excerpt:
      "Attico luminoso con travi a vista nel cuore di Tradate, ristrutturato con finiture di pregio.",
    description: [
      "Nel cuore di Tradate, un attico che unisce il calore del legno a vista alla luce di ampie vetrate. Gli spazi sono stati ripensati per offrire un open space living-cucina arioso e tre camere riservate.",
      "L'immobile è in classe energetica efficiente, con impianti recenti e documentazione completa e verificata. Pronto da vivere, senza interventi.",
    ],
    features: [
      "Open space living con camino",
      "Cucina abitabile di design",
      "Terrazzo abitabile",
      "Travi a vista restaurate",
      "Posto auto coperto",
      "Classe energetica A",
    ],
  },
  {
    slug: "trilocale-ristrutturato-venegono",
    title: "Trilocale luminoso ristrutturato",
    zone: "Venegono Superiore",
    type: "Appartamento",
    status: "Vendita",
    price: "€ 245.000",
    priceValue: 245000,
    sqm: "95 m²",
    rooms: "3 locali",
    beds: "2 camere",
    baths: "2 bagni",
    badges: ["Open Domus", "Virtual tour"],
    cover: "/images/premium_01_living_tv_divano.jpg",
    gallery: [
      "/images/premium_01_living_tv_divano.jpg",
      "/images/rendering_01_living_divano_grigio.jpg",
      "/images/rendering_02_bedroom_minimal.jpg",
      "/images/rendering_05_bagno_after.jpg",
    ],
    excerpt:
      "Trilocale completamente ristrutturato, pronto da abitare, in zona servita e tranquilla.",
    description: [
      "Un trilocale che non chiede nulla: ristrutturato di recente con materiali di qualità e una distribuzione intelligente degli spazi. Soggiorno luminoso, due camere e doppi servizi.",
      "Ideale come prima casa o come investimento, in una zona comoda a servizi e collegamenti.",
    ],
    features: [
      "Soggiorno open space",
      "Doppi servizi",
      "Cantina e ripostiglio",
      "Infissi a taglio termico",
      "Riscaldamento autonomo",
      "Pronto da abitare",
    ],
  },
  {
    slug: "villa-moderna-castiglione-olona",
    title: "Villa moderna con giardino",
    zone: "Castiglione Olona",
    type: "Villa",
    status: "Vendita",
    price: "€ 590.000",
    priceValue: 590000,
    sqm: "210 m²",
    rooms: "5 locali",
    beds: "4 camere",
    baths: "3 bagni",
    badges: ["Nuova proposta", "Pronta da visitare"],
    cover: "/images/premium_04_living_libreria.jpg",
    gallery: [
      "/images/premium_04_living_libreria.jpg",
      "/images/premium_05_living_accenti_senape.jpg",
      "/images/hero_03_attico_dining_living.jpg",
      "/images/rendering_04_camera_luce_naturale.jpg",
    ],
    excerpt:
      "Villa indipendente su due livelli con ampio giardino privato e finiture contemporanee.",
    description: [
      "Una villa pensata per la famiglia: zona giorno generosa affacciata sul giardino, quattro camere e tre bagni. Gli spazi esterni offrono privacy e luce in ogni stagione.",
      "Soluzione indipendente con ampi parcheggi, in un contesto residenziale di pregio.",
    ],
    features: [
      "Giardino privato 400 m²",
      "Zona giorno open space",
      "Quattro camere matrimoniali",
      "Taverna e lavanderia",
      "Doppio box auto",
      "Impianto fotovoltaico",
    ],
  },
  {
    slug: "bilocale-luminoso-tradate",
    title: "Bilocale luminoso con balcone",
    zone: "Tradate, Abbiate Guazzone",
    type: "Appartamento",
    status: "Vendita",
    price: "€ 165.000",
    priceValue: 165000,
    sqm: "62 m²",
    rooms: "2 locali",
    beds: "1 camera",
    baths: "1 bagno",
    badges: ["Documenti verificati"],
    cover: "/images/rendering_01_living_divano_grigio.jpg",
    gallery: [
      "/images/rendering_01_living_divano_grigio.jpg",
      "/images/rendering_02_bedroom_minimal.jpg",
      "/images/rendering_05_bagno_after.jpg",
    ],
    excerpt: "Bilocale arredabile con balcone, perfetto come prima casa o investimento.",
    description: [
      "Un bilocale efficiente e luminoso, con soggiorno affacciato sul balcone e camera matrimoniale. Spazi ottimizzati e facili da personalizzare.",
      "Posizione comoda, in palazzina ordinata e ben tenuta.",
    ],
    features: [
      "Balcone abitabile",
      "Camera matrimoniale",
      "Cantina di proprietà",
      "Basse spese condominiali",
      "Classe energetica B",
    ],
  },
  {
    slug: "quadrilocale-vista-gornate",
    title: "Quadrilocale con vista aperta",
    zone: "Gornate Olona",
    type: "Appartamento",
    status: "Vendita",
    price: "€ 310.000",
    priceValue: 310000,
    sqm: "118 m²",
    rooms: "4 locali",
    beds: "3 camere",
    baths: "2 bagni",
    badges: ["Open Domus"],
    cover: "/images/premium_05_living_accenti_senape.jpg",
    gallery: [
      "/images/premium_05_living_accenti_senape.jpg",
      "/images/premium_02_living_dining_piante.jpg",
      "/images/rendering_04_camera_luce_naturale.jpg",
    ],
    excerpt: "Ampio quadrilocale con vista aperta, tripla esposizione e terrazzo.",
    description: [
      "Quadrilocale spazioso e luminoso, con tripla esposizione e una vista aperta sul verde. Zona giorno ampia, tre camere e doppi servizi.",
      "Soluzione ideale per famiglie che cercano spazio e luce.",
    ],
    features: [
      "Terrazzo panoramico",
      "Tripla esposizione",
      "Tre camere",
      "Doppi servizi",
      "Box e posto auto",
    ],
  },
  {
    slug: "attico-dining-tradate",
    title: "Attico con zona pranzo conviviale",
    zone: "Tradate",
    type: "Attico",
    status: "Vendita",
    price: "€ 465.000",
    priceValue: 465000,
    sqm: "160 m²",
    rooms: "5 locali",
    beds: "3 camere",
    baths: "2 bagni",
    badges: ["In esclusiva", "Virtual tour"],
    cover: "/images/hero_03_attico_dining_living.jpg",
    gallery: [
      "/images/hero_03_attico_dining_living.jpg",
      "/images/hero_04_living_moderno_bianco.jpg",
      "/images/premium_03_cucina_moderna.jpg",
    ],
    excerpt: "Attico con grande zona pranzo conviviale e living a doppia altezza.",
    description: [
      "Un attico che fa della convivialità il suo punto di forza: zona pranzo ampia aperta sul living, perfetta per ricevere. Tre camere e due bagni completano la soluzione.",
      "Finiture curate e luminosità in ogni ambiente.",
    ],
    features: [
      "Living a doppia altezza",
      "Grande zona pranzo",
      "Tre camere",
      "Terrazzo",
      "Cantina e box",
      "Classe energetica A",
    ],
  },
];

export function getProperty(slug: string) {
  return properties.find((p) => p.slug === slug);
}
