import React, { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../firebase";

const DEFAULT_HERO_DATA = {
  video: {
    src: "/Sun.mp4",
    filters: {
      brightness: 1.2,
      contrast: 1.15,
      saturate: 1.1,
    },
  },
  overlay: {
    enabled: true,
    from: "rgba(0, 0, 0, 0.4)",
    via: "rgba(0, 0, 0, 0.3)",
    to: "rgba(0, 0, 0, 0.4)",
  },
  cta: {
    text: "Search Media",
    link: "#search",
    bgColor: "#eab308", // yellow-500
    hoverColor: "#facc15", // yellow-400
    textColor: "#000000",
  },
};

export default function Hero() {
  const [heroData, setHeroData] = useState(DEFAULT_HERO_DATA);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(firestore, "hero_section", "main"),
      (docSnap) => {
        if (docSnap.exists()) {
          // Merge with default to ensure no missing fields break UI
          const data = docSnap.data();
          setHeroData({
            video: { ...DEFAULT_HERO_DATA.video, ...data.video },
            overlay: { ...DEFAULT_HERO_DATA.overlay, ...data.overlay },
            cta: { ...DEFAULT_HERO_DATA.cta, ...data.cta },
          });
        }
        // Set loading to false after first snapshot (whether data exists or not)
        setIsLoading(false);
      },
      (error) => {
        // Even on error, stop loading to show default data
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const { video, overlay, cta } = heroData;

  const overlayStyle = overlay.enabled
    ? {
      background: `linear-gradient(to bottom, ${overlay.from}, ${overlay.via}, ${overlay.to})`,
    }
    : {};

  const videoFilter = `brightness(${video.filters.brightness}) contrast(${video.filters.contrast}) saturate(${video.filters.saturate})`;

  // Show loading skeleton while fetching data
  if (isLoading) {
    return (
      <section
        id="home"
        className="relative w-full min-h-[60vh] md:min-h-[80vh] lg:min-h-screen flex items-center md:items-end justify-center overflow-hidden pb-16 md:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-gray-900"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800 animate-pulse"></div>
        <div className="relative z-10 text-center">
          <div className="h-12 w-40 bg-gray-700 rounded-full animate-pulse"></div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="home"
      className="relative w-full min-h-[60vh] md:min-h-[80vh] lg:min-h-screen flex items-center md:items-end justify-center overflow-hidden pb-16 md:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 animate-fadeIn"
      style={{ animation: 'fadeIn 0.5s ease-in' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <video
        ref={(el) => {
          if (el) {
            el.playbackRate = 1.0;
            // Ensure video plays smoothly
            el.play().catch(() => { });
          }
        }}
        className="absolute top-0 left-0 w-full h-full object-cover"
        src={video.src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onLoadedData={(e) => {
          e.target.play().catch(() => { });
        }}
        onEnded={(e) => {
          // Ensure seamless loop by immediately restarting
          e.target.currentTime = 0;
          e.target.play().catch(() => { });
        }}
        style={{
          filter: videoFilter,
          objectFit: 'cover',
          willChange: 'transform'
        }}
      ></video>

      {overlay.enabled && (
        <div
          className="absolute inset-0"
          style={overlayStyle}
        ></div>
      )}

      <div className="absolute bottom-8 sm:bottom-10 md:bottom-12 lg:bottom-16 left-0 right-0 z-10 text-center w-full px-4">
        <a
          href="#search"
          className="inline-block font-bold 
                     px-6 py-2.5 
                     sm:px-8 sm:py-3 
                     md:px-10 md:py-3.5 
                     lg:px-12 lg:py-4 
                     rounded-full 
                     text-sm 
                     sm:text-base 
                     md:text-lg 
                     lg:text-xl 
                     transition-all duration-300 
                     shadow-lg hover:shadow-2xl 
                     transform hover:scale-105 
                     active:scale-95
                     whitespace-nowrap"
          style={{
            backgroundColor: isHovered ? '#FFD700' : '#FDB913',
            color: '#000000',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {cta.text}
        </a>
      </div>
    </section>
  );
}
