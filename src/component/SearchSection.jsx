import { useEffect, useState, useRef, useMemo } from "react";
import { Globe2, Monitor, Landmark, Bus, Building2, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";
import { normalizeHoardingData } from "../utils/normalizeAvailability";
import { getCloudinaryUrl } from "../utils/cloudinary";

export default function SearchSection() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoardings, setHoardings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firestoreCategories, setFirestoreCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Rule 1: Use useEffect with [] for initial category load (Real-time enabled)
  useEffect(() => {
    setCategoriesLoading(true);
    const categoriesRef = collection(firestore, "categories");

    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const fetched = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          name: docSnap.data().name || docSnap.id,
          icon: docSnap.data().icon || "Monitor",
          active: docSnap.data().active ?? true,
          order: docSnap.data().order || 0
        }))
        .filter(cat => cat.active)
        .sort((a, b) => a.order - b.order);

      setFirestoreCategories(fetched);
      setCategoriesLoading(false);
    }, (error) => {
      console.error("❌ Error listening to categories:", error);
      setCategoriesLoading(false);
    });

    // Animation trigger
    const t = setTimeout(() => setMounted(true), 50);

    return () => {
      unsubscribe();
      clearTimeout(t);
    };
  }, []);

  // Rule 2 & 3: Load hoardings for the clicked category (Real-time enabled)
  useEffect(() => {
    if (!selectedCategory) {
      setHoardings([]);
      return;
    }

    // Rule 3: Clean state every time category changes
    setHoardings([]);
    setLoading(true);

    const categoryDocRef = doc(firestore, "categories", selectedCategory.id);
    const hoardingsColRef = collection(categoryDocRef, "hoardings");

    const unsubscribe = onSnapshot(hoardingsColRef, (snapshot) => {
      const fetchedHoardings = snapshot.docs.map((docSnap) =>
        normalizeHoardingData(docSnap.data(), docSnap.id, selectedCategory.name)
      );

      setHoardings(fetchedHoardings);
      setLoading(false);
      console.log(`✅ Real-time update: ${fetchedHoardings.length} hoardings for ${selectedCategory.name}`);
    }, (error) => {
      console.error("❌ Error listening to hoardings:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  const handleCategoryClick = (category) => {
    if (selectedCategory?.id === category.id) return;
    setSelectedCategory(category);
  };

  // Helper for dynamic icons based on Firestore string
  const getIcon = (iconName) => {
    switch (iconName) {
      case "Monitor": return <Monitor size={36} />;
      case "Building2": return <Building2 size={36} />;
      case "Landmark": return <Landmark size={36} />;
      case "Bus": return <Bus size={36} />;
      case "Globe2": return <Globe2 size={36} />;
      case "Plane": return <Plane size={36} />;
      default: return <Landmark size={36} />;
    }
  };

  const availableCount = useMemo(() => hoardings.filter(h => h.available).length, [hoardings]);

  return (
    <section id="search" className="w-full bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Search Outdoor Media By Category
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select a category from the live database to view and map the best hoarding locations.
          </p>
        </div>

        {/* Dynamic Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 mb-12">
          {categoriesLoading ? (
            // Simple Skeleton for categories
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 animate-pulse rounded-2xl" />
            ))
          ) : (
            firestoreCategories.map((category, index) => (
              <div
                key={category.id}
                className={`group relative flex flex-col items-center justify-center text-center space-y-3 rounded-2xl p-6 backdrop-blur transition-all duration-500 ease-out cursor-pointer ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  } ${selectedCategory?.id === category.id
                    ? 'bg-blue-600 text-white shadow-xl scale-105'
                    : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-105'
                  }`}
                style={{ transitionDelay: `${index * 75}ms` }}
                onClick={() => handleCategoryClick(category)}
                role="button"
                tabIndex={0}
              >
                <div className={`p-4 rounded-full transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${selectedCategory?.id === category.id ? 'bg-white/20' : 'bg-blue-50'
                  }`}>
                  <div className={selectedCategory?.id === category.id ? 'text-white' : 'text-blue-600'}>
                    {getIcon(category.icon)}
                  </div>
                </div>
                <p className={`text-sm md:text-base font-semibold transition-colors duration-300 ${selectedCategory?.id === category.id ? 'text-white' : 'text-gray-900'
                  }`}>
                  {category.name}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Categories Results View */}
        {!loading && selectedCategory && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Category Status Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-full text-blue-600">
                  {getIcon(selectedCategory.icon)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500">Showing all media in this category</p>
                    <button
                      onClick={() => navigate(`/view-map?category=${selectedCategory.id}`)}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe2 size={14} />
                      View All on Map
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 px-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{availableCount}</div>
                  <div className="text-xs text-gray-400 font-medium uppercase">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{hoardings.length}</div>
                  <div className="text-xs text-gray-400 font-medium uppercase">Total</div>
                </div>
              </div>
            </div>

            {/* 2. Hoardings Cards List */}
            {hoardings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-900">No media found</h3>
                <p className="text-gray-500">This category currently has no hoardings listed in the database.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {hoardings.map((h) => (
                  <div
                    key={h.id}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Media Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
                      <img
                        src={getCloudinaryUrl(h.image)}
                        alt={h.location}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => e.target.src = "https://placehold.co/800x450?text=Hoarding+Image"}
                      />
                      <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-lg text-white ${h.available ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        {h.available ? 'AVAILABLE' : 'BOOKED'}
                      </span>
                    </div>

                    <div className="p-6">
                      <h4 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">
                        {h.name || h.location || "Premium Hoarding"}
                      </h4>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-1">{h.locationAddress || h.location}</p>

                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50 mb-4">
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase">Dimensions</p>
                          <p className="text-sm font-bold text-gray-700">{h.size || "Standard"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase">Price/mo</p>
                          <p className="text-sm font-bold text-blue-600">
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(h.price || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const route = selectedCategory.name.toLowerCase().replace(/\s+/g, '-');
                            navigate(`/${route}/${h.id}`);
                          }}
                          className="flex-1 py-2.5 rounded-xl border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors text-sm"
                        >
                          Details
                        </button>
                        <button
                          disabled={!h.available}
                          onClick={() => navigate('/booking', { state: { item: h } })}
                          className={`flex-2 py-2.5 px-6 rounded-xl font-bold text-sm shadow-sm transition-all ${h.available ? 'bg-yellow-500 hover:bg-yellow-400 text-black' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Initial Empty State */}
        {!loading && !selectedCategory && !categoriesLoading && (
          <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe2 className="text-blue-600" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Outdoor Locations</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Click any category above to fetch real-time hoardings and see them on the map.</p>
          </div>
        )}
      </div>
    </section>
  );
}
