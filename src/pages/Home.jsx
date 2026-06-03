import Navbar from "../component/Navbar";
import Hero from "../component/Hero";
import ContactSection from "../component/ContactSection";
import GallerySection from "../component/GallerySection";
import SearchSection from "../component/SearchSection";
export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <GallerySection />
      <div className="overflow-x-hidden">
        <SearchSection />
         <ContactSection />
      </div>
    </>
  );
}
