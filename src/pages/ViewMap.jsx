import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Navbar from "../component/Navbar";
import { GoogleMap, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { firestore } from "../firebase";
import { collection, getDocs, doc, onSnapshot } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import { normalizeHoardingData } from "../utils/normalizeAvailability";
import { getCloudinaryUrl } from "../utils/cloudinary";

const MAP_LIBRARIES = ["marker"];

/**
 * AdvancedMarker Component
 * Manages Google Maps AdvancedMarkerElement manually for high performance and custom HTML.
 */
function AdvancedMarker({ map, position, title, data, onClick }) {
  useEffect(() => {
    if (!map || !position || !window.google?.maps?.marker) return;

    const { AdvancedMarkerElement, PinElement } = window.google.maps.marker;

    // Create a custom pin based on availability
    const pin = new PinElement({
      background: data?.available ? "#22c55e" : "#ef4444",
      borderColor: "#ffffff",
      glyphColor: "#ffffff",
      scale: 1,
    });

    const marker = new AdvancedMarkerElement({
      map,
      position,
      title,
      content: pin.element,
    });

    marker.addListener("click", () => {
      if (onClick) onClick(data);
    });

    return () => {
      marker.map = null; // Cleanup marker when component unmounts
    };
  }, [map, position, title, data, onClick]);

  return null;
}

export default function ViewMap() {
  const [hoardings, setHoardings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [firestoreCategories, setFirestoreCategories] = useState([]);

  // Filter states
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All Categories";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedArea, setSelectedArea] = useState("All Areas");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const navigate = useNavigate();
  const [map, setMap] = useState(null);

  const maharashtraBounds = useMemo(() => ({ north: 22.1, south: 15.6, west: 72.6, east: 80.9 }), []);
  const center = useMemo(() => ({ lat: 19.7515, lng: 75.7139 }), []);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const options = useMemo(() => ({
    mapTypeId: "hybrid",
    gestureHandling: "greedy",
    zoomControl: true,
    rotateControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    restriction: { latLngBounds: maharashtraBounds, strictBounds: true },
    minZoom: 5,
    maxZoom: 20,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
  }), [maharashtraBounds]);

  const handleResetFilters = useCallback(() => {
    setSelectedCategory("All Categories");
    setSelectedArea("All Areas");
    setShowAvailableOnly(false);
    setShowFilters(true);
  }, []);

  // Rule 1: Use useEffect with [] for initial category load (Real-time enabled)
  useEffect(() => {
    const categoriesRef = collection(firestore, "categories");

    const unsubscribe = onSnapshot(categoriesRef, (snapshot) => {
      const fetched = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          name: docSnap.data().name || docSnap.id,
          active: docSnap.data().active ?? true
        }))
        .filter(cat => cat.active);

      setFirestoreCategories(fetched);
    }, (err) => {
      console.error("❌ Error listening to categories:", err);
    });

    return () => unsubscribe();
  }, []);

  // Rule 2 & 3: Load hoardings for the selected category + Clean state
  // Real-time update enabled with onSnapshot
  useEffect(() => {
    let unsubscribes = [];
    setLoadingData(true);
    setError(null);

    // Helper to setup listeners for specific categories
    const setupListeners = () => {
      // Determine which categories to listen to
      const targetCategories = selectedCategory === "All Categories"
        ? firestoreCategories
        : firestoreCategories.filter(cat => cat.id === selectedCategory);

      if (targetCategories.length === 0) {
        setHoardings([]);
        setLoadingData(false);
        return;
      }

      // Track data per category to merge later
      let categoryData = {};

      targetCategories.forEach(category => {
        const colRef = collection(doc(firestore, "categories", category.id), "hoardings");

        const unsub = onSnapshot(colRef, (snapshot) => {
          const docs = snapshot.docs.map(docSnap =>
            normalizeHoardingData(docSnap.data(), docSnap.id, category.name)
          );

          categoryData[category.id] = docs;

          // Merge all results and update state
          const flattened = Object.values(categoryData).flat();
          setHoardings(flattened);
          setLoadingData(false);
        }, (err) => {
          console.error(`❌ Error listening to category ${category.id}:`, err);
          setError("Some data failed to load in real-time.");
        });

        unsubscribes.push(unsub);
      });
    };

    setupListeners();

    return () => {
      unsubscribes.forEach(u => u());
    };
  }, [selectedCategory, firestoreCategories]);

  // Auto-pan to selected area
  useEffect(() => {
    if (selectedArea !== "All Areas" && map) {
      const hoardingsInArea = filteredHoardings.filter(h => {
        const parts = h.location?.split(',') || [];
        const area = (parts[1] || parts[0])?.trim();
        return area === selectedArea;
      });

      if (hoardingsInArea.length > 0) {
        const first = hoardingsInArea[0];
        if (first.lat && first.lng) {
          map.panTo({ lat: Number(first.lat), lng: Number(first.lng) });
          map.setZoom(13);
        }
      }
    }
  }, [selectedArea, map]);

  // Auto-pan to selected marker
  useEffect(() => {
    if (selected && map) {
      map.panTo({ lat: Number(selected.lat), lng: Number(selected.lng) });
      map.setZoom(15);
    }
  }, [selected, map]);

  const availableAreas = useMemo(() => {
    const areas = hoardings.map(h => {
      const parts = h.location?.split(',') || [];
      // Usually "Street, Area, City..." -> index 1 is area/city
      // If short "Jaysingpur, Maharashtra" -> index 0 is area
      return (parts[1] || parts[0])?.trim();
    }).filter(Boolean);
    return ["All Areas", ...new Set(areas)].sort();
  }, [hoardings]);

  const filteredHoardings = useMemo(() => {
    return hoardings.filter((h) => {
      const parts = h.location?.split(',') || [];
      const area = (parts[1] || parts[0])?.trim();

      if (selectedArea !== "All Areas" && area !== selectedArea) return false;
      if (showAvailableOnly && !h.available) return false;
      return true;
    });
  }, [hoardings, selectedArea, showAvailableOnly]);

  const markers = useMemo(() =>
    filteredHoardings
      .filter(h => h.lat && h.lng) // Filter out items without coordinates
      .map((h) => ({
        id: h.id,
        position: { lat: Number(h.lat), lng: Number(h.lng) },
        title: h.name || h.locationAddress || "Hoarding",
        data: h,
      })), [filteredHoardings]
  );

  if (!isLoaded) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto p-6 flex justify-center items-center h-screen">
          <div className="text-xl font-semibold text-gray-600">Loading Map Engine...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-0 md:p-6">
        {/* Filters */}
        <div className="bg-white border-b md:border md:rounded-xl md:mb-4 shadow-sm md:sticky md:top-4 md:z-10">
          <div className="flex items-center justify-between p-4 border-b bg-white md:rounded-t-xl">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">Dynamic Map Filter</h2>
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {markers.length} found
              </span>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className={`w-5 h-5 text-gray-600 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden md:block'} p-4 bg-white md:rounded-b-xl`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Category (Auto Load)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="All Categories">Select Category...</option>
                  {firestoreCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Area (Dynamic)</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={showAvailableOnly} onChange={(e) => setShowAvailableOnly(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">Available Only</span>
                </label>
                <button onClick={handleResetFilters} className="text-xs text-blue-600 hover:underline text-left">Clear All Filters</button>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="h-[70vh] md:h-[75vh] rounded-none md:rounded-xl overflow-hidden border border-gray-200 relative shadow-inner">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={center}
            zoom={7}
            options={options}
            onLoad={setMap}
          >
            {/* Rule 4: Dynamic Advanced Markers - Only render if map is ready */}
            {map && markers.map((m) => (
              <AdvancedMarker
                key={m.id}
                map={map}
                position={m.position}
                title={m.title}
                data={m.data}
                onClick={setSelected}
              />
            ))}

            {selected && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="w-64 p-1">
                  <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={getCloudinaryUrl(selected.image || selected.imageUrl)}
                      alt={selected.name}
                      className="w-full h-full object-cover"
                      onError={(e) => e.target.src = "https://placehold.co/400x300?text=No+Image"}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{selected.name || selected.location || "Hoarding"}</h3>
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{selected.locationAddress || selected.location}</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/${selected.categoryName.toLowerCase().replace(/\s+/g, '-')}/${selected.id}`)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm"
                    >
                      View Full Details
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${selected.lat},${selected.lng}`;
                        window.open(url, "_blank");
                      }}
                      className="w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Open in Maps
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {loadingData && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-2xl z-10 text-sm font-bold text-blue-600 animate-bounce">
              Fetching Hoardings...
            </div>
          )}
        </div>

        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center font-medium">{error}</div>}
      </main>
    </>
  );
}
