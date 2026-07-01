import Header from "./components/Header";
import Hero from "./components/Hero";
import HomeSearchGateway from "./components/HomeSearchGateway";
import Stats from "./components/Stats";
import Authority from "./components/Authority";
import Paths from "./components/Paths";
import Method from "./components/Method";
import OpenDomus from "./components/OpenDomus";
import DomusDocProtocol from "./components/DomusDocProtocol";
import Services from "./components/Services";
import BeforeAfter from "./components/BeforeAfter";
import SocialVideoWall from "./components/SocialVideoWall";
import Listings from "./components/Listings";
import FeaturedTestimonial from "./components/FeaturedTestimonial";
import Reviews from "./components/Reviews";
import Social from "./components/Social";
import Team from "./components/Team";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import SectionDivider from "./components/SectionDivider";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <HomeSearchGateway />
        <Stats />
        <Authority />
        <SocialVideoWall />
        <Paths />
        <Method />
        <OpenDomus />
        <DomusDocProtocol tone="cream-deep" />
        <Services />
        <BeforeAfter />
        <Listings />
        <FeaturedTestimonial />
        <div className="bg-paper">
          <SectionDivider tone="paper" />
        </div>
        <Reviews />
        <Social />
        <div className="bg-cream">
          <SectionDivider tone="cream" />
        </div>
        <Team />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
