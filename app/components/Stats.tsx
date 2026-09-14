"use client";

import Reveal from "./Reveal";
import { ratingLabel, site, yearsActive } from "../lib/site";
import { useLocale } from "./i18n/LocaleProvider";

// ⚠️ SOLO NUMERI VERIFICABILI.
// Questa sezione mostrava quattro cifre di cui non esiste fonte (269.395 m² valutati,
// 6.433 persone, 1.523 transazioni, 92% venduto): erano segnaposto di design rimasti in
// pagina come se fossero dati dell'agenzia. Ora ogni cifra deriva da app/lib/site.ts, dove
// la fonte è annotata (Google/Trustindex per voto e recensioni, Registro Imprese per l'anno
// di costituzione). Nessun numero nuovo può entrare qui senza fonte: vedi il test di
// content integrity in app/lib/__tests__/content-integrity.test.ts.
//
// 2026-09-10: via contatori animati, odometro, marquee e pillole — una riga sola,
// statica, sul fondo avorio (stile «rivista bianca»).

const copy = {
  it: {
    eyebrow: "I numeri di Domus Tua",
    labels: {
      reviews: "Recensioni Google verificate",
      rating: "Valutazione media",
      years: "Anni a Tradate",
    },
    tokens: [
      "Valutazione professionale",
      "Documenti verificati",
      "Open Domus",
      "Home staging",
      "Rendering & virtual",
      "Emotional video",
      "Marketing immobiliare",
      "Assistenza fino al rogito",
    ],
  },
  en: {
    eyebrow: "The Domus Tua numbers",
    labels: {
      reviews: "Verified Google reviews",
      rating: "Average rating",
      years: "Years in Tradate",
    },
    tokens: [
      "Professional valuation",
      "Verified documents",
      "Open Domus",
      "Home staging",
      "Rendering & virtual tours",
      "Emotional video",
      "Real estate marketing",
      "Support through to closing",
    ],
  },
  fr: {
    eyebrow: "Les chiffres de Domus Tua",
    labels: {
      reviews: "Avis Google vérifiés",
      rating: "Note moyenne",
      years: "Ans à Tradate",
    },
    tokens: [
      "Estimation professionnelle",
      "Documents vérifiés",
      "Open Domus",
      "Home staging",
      "Rendu & visite virtuelle",
      "Vidéo émotionnelle",
      "Marketing immobilier",
      "Accompagnement jusqu'à l'acte",
    ],
  },
  de: {
    eyebrow: "Die Zahlen von Domus Tua",
    labels: {
      reviews: "Verifizierte Google-Bewertungen",
      rating: "Durchschnittsnote",
      years: "Jahre in Tradate",
    },
    tokens: [
      "Professionelle Bewertung",
      "Geprüfte Dokumente",
      "Open Domus",
      "Home Staging",
      "Rendering & virtuell",
      "Emotionales Video",
      "Immobilienmarketing",
      "Begleitung bis zum Notartermin",
    ],
  },
  es: {
    eyebrow: "Los números de Domus Tua",
    labels: {
      reviews: "Reseñas de Google verificadas",
      rating: "Valoración media",
      years: "Años en Tradate",
    },
    tokens: [
      "Tasación profesional",
      "Documentos verificados",
      "Open Domus",
      "Home staging",
      "Renderizado y virtual",
      "Vídeo emocional",
      "Marketing inmobiliario",
      "Asistencia hasta la escritura",
    ],
  },
};

export default function Stats() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <section className="dt-chapter relative bg-cream">
      <div className="dt-row">
        <Reveal>
          <span className="eyebrow">{c.eyebrow}</span>
          <p className="tnum mt-6 font-display text-d1 uppercase text-ink">
            {ratingLabel(locale)}/5 · {site.reviewsCount}
          </p>
          <p className="lead mt-4">
            {c.labels.rating} · {c.labels.reviews}
          </p>
          <p className="tnum mt-8 border-t border-line pt-6 text-body text-graphite">
            {yearsActive()} {c.labels.years.toLowerCase()}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
