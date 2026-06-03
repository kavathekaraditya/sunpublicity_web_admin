import React, { useEffect, useState } from "react";
import { getCloudinaryUrl } from "../utils/cloudinary";
import Navbar from "../component/Navbar";
import { useWishlist } from "../context/WishlistContext.jsx";
import { Link } from "react-router-dom";
import { MapPin, Ruler, IndianRupee, Circle, Heart } from "lucide-react";
import { normalizeAvailability } from "../utils/normalizeAvailability";

export default function Wishlist() {
  const { items, remove } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <Navbar />
      <section
        className="relative w-full min-h-screen flex flex-col items-center justify-center bg-cover bg-center text-white"
        style={{
          backgroundImage: "url('/billboard-bg.jpg')",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Main content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10">
          <h1 className={`text-3xl md:text-4xl font-bold text-center mb-8 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            Your Wishlist
          </h1>

          {items.length === 0 ? (
            <div className={`text-center text-white/80 text-lg transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Your wishlist is empty. Browse categories and add hoardings you like.
            </div>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
              {items.map((b, index) => (
                <div
                  key={b.id}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} hover:shadow-xl hover:-translate-y-1`}
                  style={{ transitionDelay: `${index * 75}ms` }}
                >
                  {/* Image with availability badge */}
                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={getCloudinaryUrl(b.image)}
                      alt={b.location}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/800x450?text=Billboard";
                      }}
                    />
                    {/* Availability badge */}
                    <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${normalizeAvailability(b) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      <Circle size={10} fill={normalizeAvailability(b) ? "#15803d" : "#b91c1c"} className={normalizeAvailability(b) ? "text-green-700" : "text-red-700"} />
                      {normalizeAvailability(b) ? "Available" : "Not Available"}
                    </span>
                  </div>

                  {/* Card content */}
                  <div className="p-4 space-y-3">
                    {/* Location/Title */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 flex items-start gap-2 flex-1">
                        <MapPin size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{b.location}</span>
                      </h3>
                    </div>

                    {/* Size */}
                    {b.size && (
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <Ruler size={16} className="text-gray-500" />
                        Size: {String(b.size).replace("x", "ft x ")}ft
                      </div>
                    )}

                    {/* Location details if available */}
                    {(b.city || b.state) && (
                      <div className="text-sm text-gray-600">
                        Location: {[b.city, b.state].filter(Boolean).join(", ")}
                      </div>
                    )}

                    {/* Price */}
                    {b.price != null && (
                      <div className="text-sm font-semibold flex items-center gap-2">
                        <IndianRupee size={16} className="text-gray-500" />
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(b.price)} / month
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Link
                          to={b.href ?? `/billboard/${b.id}`}
                          className="flex-1 text-center text-sm font-semibold px-3 py-2 rounded-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </Link>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.location)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center text-sm font-semibold px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          View Map
                        </a>
                      </div>
                      <button
                        className="w-full text-sm font-semibold px-3 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                      >
                        Book Now
                      </button>
                      <button
                        onClick={() => remove(b.id)}
                        className="w-full text-sm font-semibold px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Heart size={16} fill="currentColor" />
                        Remove from Wishlist
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </section>
    </>
  );
}
