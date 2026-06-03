import React from "react";

const galleryItems = [
  { id: 1, img: "down.jpg", title: "Downtown Billboard" },
  { id: 2, img: "high.jpg", title: "Highway Display" },
  { id: 3, img: "mall.jpg", title: "Shopping Mall Board" },
  { id: 4, img: "event.jpg", title: "Event Promotion" },
  { id: 5, img: "city2.jpg", title: "City Center LED" },
  { id: 6, img: "cop.jpg", title: "Corporate Ad Space" },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="py-20 bg-gray-100">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-10 text-gray-900">
          Our Billboard Gallery
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="relative group overflow-hidden rounded-2xl shadow-lg"
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <h3 className="text-white text-lg font-semibold">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
