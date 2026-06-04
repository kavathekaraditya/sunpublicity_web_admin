import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";

const DEFAULT_GALLERY_IMAGES = [
  "down.jpg",
  "high.jpg",
  "mall.jpg",
  "event.jpg",
  "city2.jpg",
  "cop.jpg",
];

export default function GallerySection() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(firestore, "hero_section", "gallery"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setImages(data.images || []);
        } else {
          setImages(DEFAULT_GALLERY_IMAGES);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching gallery images:", error);
        setImages(DEFAULT_GALLERY_IMAGES);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <section id="gallery" className="py-20 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-900 animate-pulse">
            Loading Gallery...
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-full h-64 bg-gray-250 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-20 bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-900">
          Our Billboard Gallery
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((imgUrl, index) => (
            <div
              key={index}
              className="relative group overflow-hidden rounded-2xl shadow-lg bg-gray-200"
            >
              <img
                src={imgUrl}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.target.src = "https://placehold.co/800x450?text=Image+Not+Found";
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

