import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import FeaturedTestimonial from "../components/FeaturedTestimonial";
import Reviews from "../components/Reviews";
import Stats from "../components/Stats";
import Contact from "../components/Contact";

export const metadata: Metadata = {
  title: "Recensioni dei clienti",
  description:
    "Oltre 500 recensioni e una media di 4.9/5. Le storie di chi ha venduto e acquistato casa con Domus Tua: fiducia, cura e accompagnamento fino al rogito.",
};

export default function RecensioniPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Recensioni"
          title={
            <>
              Lo raccontano
              <br />
              <span className="text-red-soft">le persone.</span>
            </>
          }
          subcopy="Oltre 500 famiglie hanno scelto Domus Tua. Le loro parole raccontano un modo diverso di vivere la compravendita: più umano, più chiaro, più seguito."
          image="/images/premium_01_living_tv_divano.jpg"
          alt="Soggiorno accogliente"
          primary={{ label: "Inizia anche tu", href: "#contatti" }}
          secondary={{ label: "Leggi le recensioni", href: "#recensioni" }}
          trust={["4.9/5 di media", "Oltre 500 recensioni", "Google · Trustindex"]}
        />

        <FeaturedTestimonial />
        <Reviews />
        <Stats />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
