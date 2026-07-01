import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppFloat from "../components/WhatsAppFloat";
import PageHero from "../components/PageHero";
import Highlights from "../components/Highlights";
import Method from "../components/Method";
import OpenDomus from "../components/OpenDomus";
import Reviews from "../components/Reviews";
import Contact from "../components/Contact";

export const metadata: Metadata = {
  title: "Il Metodo Domus Tua",
  description:
    "Il sistema proprietario Domus Tua: valutazione, documenti verificati, preparazione, marketing, Open Domus, trattativa e assistenza fino al rogito. Un percorso, non un annuncio.",
};

export default function MetodoPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero
          eyebrow="Il sistema Domus Tua"
          title={
            <>
              Non un annuncio.
              <br />
              <span className="text-red-soft">Un metodo.</span>
            </>
          }
          subcopy="Ogni vendita e ogni acquisto seguono un percorso chiaro fatto di cura, documenti, marketing e assistenza fino al rogito. È il modo in cui lavoriamo dal 2007."
          image="/images/hero_01_attico_travi_salotto.jpg"
          alt="Attico con travi a vista e salotto elegante"
          primary={{ label: "Inizia dal tuo immobile", href: "#contatti" }}
          secondary={{ label: "Vedi gli otto passi", href: "#metodo" }}
        />

        <Highlights
          tone="paper"
          eyebrow="Tre pilastri"
          title="Cura, trasparenza, accompagnamento."
          intro="Tre principi attraversano ogni fase del metodo e fanno la differenza tra mettere una casa sul mercato e venderla davvero bene."
          items={[
            {
              title: "Documenti verificati",
              copy: "Controlliamo tutto prima: conformità, titoli, pratiche. Si arriva al rogito senza sorprese.",
            },
            {
              title: "Marketing che racconta",
              copy: "Foto, video, rendering e campagne mirate per portare la casa davanti alle persone giuste.",
            },
            {
              title: "Assistenza fino al rogito",
              copy: "Un riferimento umano in ogni passaggio, dalla prima telefonata alla firma.",
            },
          ]}
        />

        <Method />
        <OpenDomus />
        <Reviews />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
