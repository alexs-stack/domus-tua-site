import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import PropertySearch from "../components/PropertySearch";
import Contact from "../components/Contact";

export const metadata: Metadata = {
  title: "Case in vendita a Tradate e provincia",
  description:
    "Le case selezionate da Domus Tua: appartamenti, attici e ville a Tradate e in provincia di Varese. Immobili raccontati con cura, documenti verificati.",
};

export default function CasePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Le nostre case"
          title={
            <>
              Case selezionate,
              <br />
              <span className="text-red-soft">raccontate con cura.</span>
            </>
          }
          subcopy="Ogni immobile è verificato, preparato e raccontato con materiali professionali. Trova la casa giusta, con tutte le informazioni che contano."
          image="/images/premium_04_living_libreria.jpg"
          alt="Living elegante con libreria"
          primary={{ label: "Cerca con noi", href: "#contatti" }}
          secondary={{ label: "Parla con un consulente", href: "/contatti" }}
        />
        <PropertySearch />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
