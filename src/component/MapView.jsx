import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export default function MapView() {
  const [currentLocation, setCurrentLocation] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const maharashtraBounds = useMemo(
    () => ({ north: 22.1, south: 15.6, west: 72.6, east: 80.9 }),
    []
  );

  const options = useMemo(
    () => ({
      mapTypeId: "hybrid",
      gestureHandling: "greedy",
      zoomControl: true,
      rotateControl: true,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      tilt: 67.5,
      heading: 20,
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
  const onMapLoad = useCallback((m) => {
    mapRef.current = m;
    try {
      m.setTilt(67.5);
      m.setHeading(20);
    } catch (_) {}
  }, []);

  const focus3D = useCallback((latLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();
    if (
      lat <= maharashtraBounds.north &&
      lat >= maharashtraBounds.south &&
      lng >= maharashtraBounds.west &&
      lng <= maharashtraBounds.east
    ) {
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(18);
      mapRef.current?.setTilt(67.5);
    }
  }, [maharashtraBounds]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => alert("Unable to fetch location. Please allow location access.")
      );
    }
  }, []);

  if (!isLoaded) return <p className="text-center text-gray-500">Loading Map...</p>;
  if (!currentLocation) return <p className="text-center text-gray-500">Fetching your location...</p>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold text-center mb-3">📍 Find Our Hoardings Near You</h2>
      <GoogleMap
        mapContainerClassName="w-full h-[60vh] md:h-[70vh] lg:h-[75vh] rounded-xl overflow-hidden"
        center={currentLocation}
        zoom={14}
        options={options}
        onLoad={onMapLoad}
        onClick={(e) => e.latLng && focus3D(e.latLng)}
      >
        <Marker position={currentLocation} title="You are here" onClick={() => focus3D({ lat: () => currentLocation.lat, lng: () => currentLocation.lng })} />
        <Marker position={{ lat: currentLocation.lat + 0.002, lng: currentLocation.lng + 0.002 }} title="Hoarding 1" onClick={(e) => focus3D({ lat: () => currentLocation.lat + 0.002, lng: () => currentLocation.lng + 0.002 })} />
        <Marker position={{ lat: currentLocation.lat - 0.002, lng: currentLocation.lng - 0.002 }} title="Hoarding 2" onClick={(e) => focus3D({ lat: () => currentLocation.lat - 0.002, lng: () => currentLocation.lng - 0.002 })} />
      </GoogleMap>
    </div>
  );
}
