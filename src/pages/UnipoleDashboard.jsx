import Navbar from "../component/Navbar";
import { useMemo, useState } from "react";
import { getCloudinaryUrl } from "../utils/cloudinary";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Ruler, IndianRupee, Circle, Lightbulb, Building2, Calendar } from "lucide-react";
import UnipoleData, { STATES } from "../data/unipoleData";

const CITY_COORDS = {
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
};

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function UnipoleDashboard() {
  const [state, setState] = useState("All");
  const [city, setCity] = useState("All");
  const [category, setCategory] = useState("Unipole"); // Unipole / Monopole / All
  const [radius, setRadius] = useState(25);
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const minPrice = useMemo(() => Math.min(...UnipoleData.map((d) => d.price)), []);
  const maxPrice = useMemo(() => Math.max(...UnipoleData.map((d) => d.price)), []);
  const [priceFrom, setPriceFrom] = useState(minPrice);

  const citiesForState = useMemo(() => {
    if (state === "All") return ["All", ...Array.from(new Set(UnipoleData.map((d) => d.city)))];
    const found = STATES.find((s) => s.state === state);
    return ["All", ...(found ? found.cities : [])];
  }, [state]);

  const filtered = useMemo(() => {
    const center = city !== "All" ? CITY_COORDS[city] : null;
    return UnipoleData.filter((d) => {
      const matchesState = state === "All" ? true : d.state === state;
      const matchesCity = city === "All" ? true : d.city === city;
      const matchesCategory = category === "All" ? true : d.category === category;
      const matchesPrice = d.price >= priceFrom;
      const matchesAvail = availabilityOnly ? d.available : true;
      const withinRadius = center ? haversineKm(center, { lat: d.lat, lng: d.lng }) <= radius : true;
      return matchesState && matchesCity && matchesCategory && matchesPrice && matchesAvail && withinRadius;
    });
  }, [state, city, category, priceFrom, availabilityOnly, radius]);

  const [active, setActive] = useState(null);

  const headerBg = "url('/unipole/unipole-hero.jpg')";

  return (
    <>
      <Navbar />
      <header className="relative w-full h-[260px] md:h-[320px] bg-cover bg-center" style={{ backgroundImage: headerBg }}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center text-white">
          <h1 className="text-2xl md:text-4xl font-extrabold">Unipole Hoarding Advertising</h1>
          <p className="mt-3 max-w-3xl text-sm md:text-base text-gray-200">
            Unipole hoardings are tall, single-pole outdoor advertisement boards placed on highways and main city roads for maximum brand visibility. Browse available ad locations, prices, and details below.
          </p>
        </div>
      </header>

      <main className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
        {/* Filters */}
        <section className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-8 sticky-filters">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">State</label>
              <select value={state} onChange={(e) => { setState(e.target.value); setCity("All"); }} onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option>All</option>
                {STATES.map((s) => (
                  <option key={s.state}>{s.state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)} onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                {citiesForState.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Unipole</option>
                <option>Monopole</option>
                <option>All</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Radius</label>
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r} km</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Cost From</label>
              <div className="flex items-center gap-3">
                <input type="range" min={minPrice} max={maxPrice} value={priceFrom} onChange={(e) => setPriceFrom(Number(e.target.value))} onFocus={(e) => e.target.scrollIntoView({ behavior: 'auto', block: 'nearest' })} className="w-full" />
                <div className="text-sm font-semibold whitespace-nowrap">₹{priceFrom.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 select-none">
                <input type="checkbox" className="h-4 w-4" checked={availabilityOnly} onChange={(e) => setAvailabilityOnly(e.target.checked)} />
                <span className="text-sm font-semibold">Available Only</span>
              </label>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((b) => (
            <motion.div key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.10)" }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="aspect-video bg-gray-100">
                <img src={getCloudinaryUrl(b.imageURL)} alt={b.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://placehold.co/800x450?text=Unipole"; }} />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500" /> {b.name}
                  </h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${b.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    <Circle size={10} fill={b.available ? "#15803d" : "#b91c1c"} className={b.available ? "text-green-700" : "text-red-700"} />
                    {b.available ? "Available" : "Not Available"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Ruler size={16} className="text-gray-500" /> Size: {b.size.replace("x", "ft x ")}ft
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Lightbulb size={16} className="text-gray-500" /> Lighting: {b.lighting}
                </div>
                <div className="text-sm text-gray-600">Location: India, Maharashtra, {b.city}</div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  <IndianRupee size={16} className="text-gray-500" /> Cost From: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(b.price)}
                </div>
                <div className="pt-2 flex gap-2">
                  <button onClick={() => setActive(b)} className="text-sm font-semibold text-blue-600 hover:text-blue-700">Check Availability</button>
                  <button onClick={() => setActive(b)} className="text-sm font-semibold text-gray-700 hover:text-gray-900">Book Now</button>
                  <a
                    href={`https://www.google.com/maps?q=${b.lat},${b.lng}&z=15`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-gray-700 hover:text-gray-900"
                  >
                    View on Map
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-10">No hoardings found with selected filters.</div>
          )}
        </section>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setActive(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="relative z-[61] w-[95%] max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="bg-gray-100">
                  <img src={getCloudinaryUrl(active.imageURL)} alt={active.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://placehold.co/800x600?text=Unipole"; }} />
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="text-xl font-bold flex items-center gap-2"><Building2 size={18} className="text-gray-500" /> {active.name}</h3>
                  <div className="text-sm text-gray-600 flex items-center gap-2"><MapPin size={16} className="text-gray-500" /> {active.city}, {active.state}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2"><Ruler size={16} className="text-gray-500" /> Size: {active.size.replace("x", "ft x ")}ft</div>
                  <div className="text-sm text-gray-600 flex items-center gap-2"><Lightbulb size={16} className="text-gray-500" /> Lighting: {active.lighting}</div>
                  <div className="text-sm text-gray-600">Orientation: {active.orientation}</div>
                  <div className="text-sm text-gray-600">Height: {active.height}</div>
                  <div className="text-sm text-gray-600">Traffic: {active.traffic}</div>
                  <div className="pt-1 text-base font-semibold flex items-center gap-2"><IndianRupee size={18} className="text-gray-500" /> Cost From: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(active.price)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${active.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      <Circle size={10} fill={active.available ? "#15803d" : "#b91c1c"} className={active.available ? "text-green-700" : "text-red-700"} />
                      {active.available ? "Available" : "Not Available"}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12} /> Monthly pricing</span>
                  </div>
                  <div className="flex gap-3 pt-3">
                    <a href={`https://www.google.com/maps?q=${active.lat},${active.lng}`} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Open in Google Maps</a>
                    <a href={`mailto:sunadvertise@gmail.com?subject=Booking%20enquiry%20for%20${encodeURIComponent(active.name)}&body=Hi%2C%20I%27d%20like%20to%20book%20this%20site.`} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Contact to Book</a>
                    <a href={`https://wa.me/919545454454?text=${encodeURIComponent("Inquiry for: " + active.name)}`} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600">WhatsApp</a>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                <iframe
                  title="map"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${active.lat},${active.lng}&z=15&output=embed`}
                />
              </div>
              <button onClick={() => setActive(null)} className="absolute top-3 right-3 bg-black/60 text-white rounded-full px-2 py-1 text-xs">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
