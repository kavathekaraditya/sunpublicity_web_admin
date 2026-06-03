import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import Navbar from "../component/Navbar";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useLocation } from "react-router-dom";
import UnipoleData from "../data/unipoleData";

export default function MapHoardings() {
  const maharashtraBounds = useMemo(
    () => ({ north: 22.1, south: 15.6, west: 72.6, east: 80.9 }),
    []
  );

  const center = useMemo(() => ({ lat: 19.7515, lng: 75.7139 }), []); // Maharashtra approx center

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const options = useMemo(
    () => ({
      mapTypeId: "hybrid", // satellite with labels; good for 3D tilt
      gestureHandling: "greedy",
      zoomControl: true,
      rotateControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      restriction: { latLngBounds: maharashtraBounds, strictBounds: true },
      minZoom: 5,
      maxZoom: 20,
      ...(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
        ? { mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID }
        : {}),
    }),
    [maharashtraBounds]
  );

  const mapRef = useRef(null);
  const onLoad = useCallback((m) => {
    mapRef.current = m;
    try {
      m.setCenter(center);
      m.setZoom(7);
      m.setTilt(67.5);
      m.setHeading(20);
    } catch (_) {}
  }, [center]);

  // Parse focus params
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const [focus, setFocus] = useState(null); // {lat, lng, title}

  useEffect(() => {
    const lat = parseFloat(params.get("lat"));
    const lng = parseFloat(params.get("lng"));
    const query = params.get("query");
    if (!mapRef.current) return;
    // If lat/lng provided, focus directly
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      const p = { lat, lng };
      setFocus({ ...p, title: "Selected" });
      try {
        mapRef.current.panTo(p);
        mapRef.current.setZoom(16);
        mapRef.current.setTilt(67.5);
      } catch (_) {}
      return;
    }
    // Else, attempt geocoding query (optional)
    if (query) {
      const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!key) return;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${key}`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          const result = data?.results?.[0];
          const loc = result?.geometry?.location;
          if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
            const p = { lat: loc.lat, lng: loc.lng };
            setFocus({ ...p, title: query });
            try {
              mapRef.current.panTo(p);
              mapRef.current.setZoom(16);
              mapRef.current.setTilt(67.5);
            } catch (_) {}
          }
        })
        .catch(() => {});
    }
  }, [params]);

  if (!isLoaded) return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-6">Loading Map...</main>
    </>
  );

  // Collect markers from datasets with coordinates (currently UnipoleData)
  const markers = UnipoleData.map((d) => ({
    id: d.id,
    position: { lat: d.lat, lng: d.lng },
    title: d.name,
  }));

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto p-0 md:p-6">
        <div className="h-[70vh] md:h-[78vh] rounded-none md:rounded-xl overflow-hidden border border-gray-200">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={center}
            zoom={7}
            options={options}
            onLoad={onLoad}
          >
            {markers.map((m) => (
              <Marker key={m.id} position={m.position} title={m.title} />
            ))}
            {focus && (
              <Marker position={{ lat: focus.lat, lng: focus.lng }} title={focus.title || "Selected"} />
            )}
          </GoogleMap>
        </div>
      </main>
    </>
  );
}
