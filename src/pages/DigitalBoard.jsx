import Navbar from "../component/Navbar";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Ruler, IndianRupee, Circle } from "lucide-react";
import { useWishlist } from "../context/WishlistContext.jsx";
import { Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { firestore } from "../firebase";
import { collection, getDocs, doc } from "firebase/firestore";
import { normalizeHoardingData } from "../utils/normalizeAvailability";
import { getCloudinaryUrl } from "../utils/cloudinary";


export default function DigitalBoard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [size, setSize] = useState("All");
  const [price, setPrice] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const { items: wishlistItems, toggle } = useWishlist();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from category sub-collection
        const categoryDocRef = doc(firestore, "categories", "Digital Board");
        const colRef = collection(categoryDocRef, "hoardings");
        const snapshot = await getDocs(colRef);

        const list = snapshot.docs.map((doc) => normalizeHoardingData(doc.data(), doc.id, "Digital Board"));

        setItems(list);
      } catch (err) {
        setError(err.message || "Failed to load LED hoardings");
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((b) => {
      const matchesQuery = b.location.toLowerCase().includes(query.toLowerCase());
      const matchesSize = size === "All" ? true : b.size === size;
      const matchesAvailability = availableOnly ? b.available : true;
      const matchesPrice = (() => {
        if (price === "All") return true;
        if (price === "<10000") return b.price < 10000;
        if (price === "10000-20000") return b.price >= 10000 && b.price <= 20000;
        if (price === ">20000") return b.price > 20000;
        return true;
      })();
      return matchesQuery && matchesSize && matchesPrice && matchesAvailability;
    });
  }, [items, query, size, price, availableOnly]);

  const availableCount = useMemo(() => items.filter((d) => d.available).length, [items]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Digital Board</h1>
          <div className="text-sm md:text-base text-gray-600">
            <span className="font-semibold">{availableCount}</span> Available
          </div>
        </div>

        {/* Filters */}
        <section className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-8 sticky-filters">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Search by Location</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })}
                placeholder="Type location name..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>All</option>
                <option>10x10</option>
                <option>20x10</option>
                <option>40x20</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Price Range</label>
              <select
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All</option>
                <option value="<10000">{"< ₹10,000"}</option>
                <option value="10000-20000">₹10,000 - ₹20,000</option>
                <option value=">20000">{">₹20,000"}</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                />
                <span className="text-sm font-semibold">Available Only</span>
              </label>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && (
            <div className="col-span-full text-center text-gray-500 py-10">Loading LED hoardings...</div>
          )}
          {!loading && error && (
            <div className="col-span-full text-center text-red-500 py-10">{error}</div>
          )}
          {!loading && !error && filtered.map((b) => (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.10)" }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:border-blue-200"
            >
              <div className="aspect-video bg-gray-100 overflow-hidden relative">
                <img
                  src={getCloudinaryUrl(b.image)}
                  alt={b.location}
                  className="w-full h-full object-cover transform transition-transform duration-300 ease-out group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/800x450?text=Digital+Board";
                  }}
                />
                <span
                  className={`absolute top-3 right-3 text-xs font-medium px-3 py-1.5 rounded-full shadow-md ${b.available ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                >
                  {b.available ? "Available" : "Not Available"}
                </span>
              </div>
              <div className="p-5 space-y-3">

                <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Size</div>
                    <div className="font-semibold text-gray-900">{b.size.replace("x", "ft x ")}ft</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Price</div>
                    <div className="font-semibold text-gray-900">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(b.price)}<span className="text-xs font-normal text-gray-500">/month</span></div>
                  </div>
                </div>

                {b.expiryDate && (
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">Expiry:</span> {new Date(b.expiryDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Link
                      to={`/digital-board/${b.id}`}
                      className="flex-1 text-center text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      View Details
                    </Link>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`India, Maharashtra, ${b.location}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View Map
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate('/booking', { state: { item: { id: b.id, location: b.location, size: b.size, price: b.price, image: b.image, href: `/digital-board/${b.id}` } } })}
                      className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors shadow-sm"
                    >
                      Book Now
                    </button>
                    {(() => {
                      const inList = wishlistItems.some((i) => i.id === b.id);
                      return (
                        <button
                          onClick={() => toggle({ id: b.id, location: b.location, size: b.size, price: b.price, image: b.image, href: `/digital-board/${b.id}` })}
                          className={`px-4 py-2.5 rounded-lg border transition-colors ${inList ? 'bg-pink-50 text-pink-600 border-pink-300 hover:bg-pink-100' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          aria-pressed={inList}
                          title={inList ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart size={18} className={inList ? 'fill-pink-600 text-pink-600' : 'text-gray-500'} />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {!loading && !error && filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">No LED hoardings found.</div>
          )}
        </section>
      </main>
    </>
  );
}
