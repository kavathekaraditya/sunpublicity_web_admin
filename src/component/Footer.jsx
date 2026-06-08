import { Link, useNavigate, useLocation } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path, id) => {
    if (location.pathname !== path) {
      navigate(path);
      // Wait for route change to finish, then scroll
      setTimeout(() => {
        if (id) {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } else {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }, 100);
    } else {
      if (id) {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Company Info */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-wide">Sun Publicity</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your trusted partner for premium outdoor advertising. We offer strategic billboard, hoarding, and digital display placements to maximize your brand's visibility.
          </p>
          <div className="flex gap-4 pt-2">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Facebook size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Twitter size={20} />
            </a>
            <a href="https://www.instagram.com/sun_publicity5710/" className="text-gray-400 hover:text-white transition-colors">
              <Instagram size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/"
                onClick={(e) => { e.preventDefault(); handleNavigation("/", null); }}
                className="hover:text-white transition-colors"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/"
                onClick={(e) => { e.preventDefault(); handleNavigation("/", null); }}
                className="hover:text-white transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/view-map"
                onClick={(e) => { e.preventDefault(); handleNavigation("/view-map", null); }}
                className="hover:text-white transition-colors"
              >
                Map View
              </Link>
            </li>
            <li>
              <Link
                to="/wishlist"
                onClick={(e) => { e.preventDefault(); handleNavigation("/wishlist", null); }}
                className="hover:text-white transition-colors"
              >
                Wishlist
              </Link>
            </li>
            <li>
              <Link
                to="/"
                onClick={(e) => { e.preventDefault(); handleNavigation("/", "contact"); }}
                className="hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/hording"
                onClick={(e) => { e.preventDefault(); handleNavigation("/hording", null); }}
                className="hover:text-white transition-colors"
              >
                Highway Hordings
              </Link>
            </li>
            <li>
              <Link
                to="/digital-board"
                onClick={(e) => { e.preventDefault(); handleNavigation("/digital-board", null); }}
                className="hover:text-white transition-colors"
              >
                Digital Boards
              </Link>
            </li>
            <li>
              <Link
                to="/auto-promotion"
                onClick={(e) => { e.preventDefault(); handleNavigation("/auto-promotion", null); }}
                className="hover:text-white transition-colors"
              >
                Auto Promotions
              </Link>
            </li>
            <li>
              <Link
                to="/shop-boards"
                onClick={(e) => { e.preventDefault(); handleNavigation("/shop-boards", null); }}
                className="hover:text-white transition-colors"
              >
                Shop Light Boards
              </Link>
            </li>
            <li>
              <Link
                to="/wall-paintings"
                onClick={(e) => { e.preventDefault(); handleNavigation("/wall-paintings", null); }}
                className="hover:text-white transition-colors"
              >
                Wall Paintings
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <span>123 Ad Avenue, Media Hub, Mumbai, Maharashtra, 400001</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-blue-500 shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-blue-500 shrink-0" />
              <span>contact@sunpublicity.com</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-800 text-sm text-center text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Sun Publicity. All rights reserved.</p>
        <div className="flex gap-4">
          <Link
            to="/privacy-policy"
            onClick={(e) => { e.preventDefault(); handleNavigation("/privacy-policy", null); }}
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-service"
            onClick={(e) => { e.preventDefault(); handleNavigation("/terms-of-service", null); }}
            className="hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}

