import React, { useRef, useEffect, useState } from "react";

const StreetViewModal = ({ open, onClose, location, hoarding }) => {
  const mapContainerRef = useRef(null);
  const [viewMode, setViewMode] = useState("street"); // "map" or "street"
  const mapRef = useRef(null);
  const streetViewRef = useRef(null);

  useEffect(() => {
    if (open && location && window.google) {
      // Initialize Map
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: location,
        zoom: 15,
        streetViewControl: false,
      });
      mapRef.current = map;

      // Add Marker
      new window.google.maps.Marker({
        position: location,
        map,
        title: hoarding?.title || "Hoarding Location",
      });

      // Initialize Street View
      const panorama = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
        position: location,
        pov: { heading: 34, pitch: 10 },
        zoom: 1,
      });

      map.setStreetView(panorama);
    }
  }, [open, location]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50">
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 z-20"
        onClick={onClose}
      >
        ✕ Close
      </button>

      {/* Toggle Buttons */}
      <div className="absolute top-4 left-4 flex gap-3 z-20">
        <button
          onClick={() => setViewMode("map")}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === "map"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          🗺️ Map View
        </button>
        <button
          onClick={() => setViewMode("street")}
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === "street"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          🚗 Street View
        </button>
      </div>

      {/* Main View Section */}
      <div className="flex-1 relative">
        <div
          ref={mapContainerRef}
          className={`absolute inset-0 transition-opacity duration-300 ${
            viewMode === "map" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        ></div>

        <div
          ref={streetViewRef}
          className={`absolute inset-0 transition-opacity duration-300 ${
            viewMode === "street" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        ></div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-white w-full p-6 flex flex-col md:flex-row items-center justify-between shadow-lg border-t border-gray-200 z-10">
        <div className="text-left space-y-1">
          <h2 className="text-xl font-bold text-gray-900">{hoarding?.title}</h2>
          <p className="text-gray-700">📍 {hoarding?.locationName}</p>
          <p className="text-sm text-gray-500">Size: {hoarding?.size}</p>
          <p className="text-sm text-gray-500">Price: ₹{hoarding?.price}</p>
        </div>

        <button
          onClick={() => alert(`Booking request for ${hoarding?.title}`)}
          className="mt-4 md:mt-0 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700"
        >
          📅 Book Now
        </button>
      </div>
    </div>
  );
};

export default StreetViewModal;
