import Header from "./components/Header";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import Authority from "./components/Authority";
import Paths from "./components/Paths";
import Method from "./components/Method";
import OpenDomus from "./components/OpenDomus";
import Services from "./components/Services";
import BeforeAfter from "./components/BeforeAfter";
import Listings from "./components/Listings";
import FeaturedTestimonial from "./components/FeaturedTestimonial";
import Reviews from "./components/Reviews";
import Social from "./components/Social";
import Team from "./components/Team";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Authority />
        <Paths />
        <Method />
        <OpenDomus />
        <Services />
        <BeforeAfter />
        <Listings />
        <FeaturedTestimonial />
        <Reviews />
        <Social />
        <Team />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
