import { useEffect, useState } from "react";
import { getCloudinaryUrl } from "../utils/cloudinary";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar";
import { firestore } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useWishlist } from "../context/WishlistContext";
import { Heart } from "lucide-react";
import { normalizeHoardingData } from "../utils/normalizeAvailability";

export default function AdItemDetails() {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const { items, toggle } = useWishlist();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realCategoryName, setRealCategoryName] = useState("");

  const isInWishlist = items.some((i) => i.id === id);

  useEffect(() => {
    if (!id || !category) {
      setLoading(false);
      setError("Invalid category or ID");
      return;
    }

    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        setItem(null);

        // Dynamic Slug Resolution (No hardcoded maps)
        let resolvedKey = null;

        // Search Firestore categories to find the correct ID
        const catsRef = collection(firestore, "categories");
        const catsSnapshot = await getDocs(catsRef);

        const targetSlug = category.toLowerCase().trim();

        for (const docSnap of catsSnapshot.docs) {
          const docId = docSnap.id;
          const docData = docSnap.data();
          const displayName = docData.name || docId;

          const idSlug = docId.toLowerCase().replace(/\s+/g, '-');
          const nameSlug = displayName.toLowerCase().replace(/\s+/g, '-');

          if (idSlug === targetSlug || nameSlug === targetSlug) {
            resolvedKey = docId; // Use the actual case-sensitive doc ID
            setRealCategoryName(displayName);
            break;
          }
        }

        if (!resolvedKey) {
          throw new Error(`Category "${category}" not found in database.`);
        }

        // Fetch the specific hoarding
        const categoryDocRef = doc(firestore, "categories", resolvedKey);
        const hoardingsColRef = collection(categoryDocRef, "hoardings");
        const itemDocRef = doc(hoardingsColRef, id);
        const snapshot = await getDoc(itemDocRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          let processedData = normalizeHoardingData(data, id, resolvedKey);

          if (data.expiryDate && typeof data.expiryDate?.toDate === 'function') {
            processedData.expiryDate = data.expiryDate.toDate().toISOString();
          }

          setItem(processedData);
        } else {
          setError(`Item not found in "${realCategoryName || resolvedKey}".`);
        }
      } catch (err) {
        console.error("Error fetching hoarding details:", err);
        setError(err.message || "Failed to load item.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, category]);

  if (!loading && !item) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto p-6 md:p-10 text-center">
          <p className="text-gray-600 mb-4">{error || "Item not found."}</p>
          <Link to="/" className="text-blue-600 font-semibold underline">← Back to Home</Link>
        </main>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto p-6 md:p-10">
          <p className="text-gray-600">Loading details...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto p-6 md:p-10">
        <Link to={`/${category}`} className="text-blue-600 font-semibold inline-flex items-center gap-2 mb-6 hover:text-blue-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {realCategoryName || category}
        </Link>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="relative bg-gray-100 aspect-square md:aspect-auto">
              <img
                src={getCloudinaryUrl(item.image)}
                alt={item.location}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/800x800?text=Hoarding";
                }}
              />
              <span
                className={`absolute top-4 right-4 text-sm font-semibold px-4 py-2 rounded-full shadow-lg ${item.available ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}
              >
                {item.available ? "Available" : "Not Available"}
              </span>
            </div>

            {/* Details Section */}
            <div className="p-8 flex flex-col">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{item.location}</h1>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Size</div>
                    <div className="text-2xl font-bold text-gray-900">{String(item.size).replace("x", " × ")}</div>
                    <div className="text-sm text-gray-600">feet</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Price</div>
                    <div className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.price)}</div>
                    <div className="text-sm text-gray-600">per month</div>
                  </div>
                </div>

                {item.expiryDate && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm text-blue-600 font-semibold mb-1">Contract Expiry</div>
                    <div className="text-lg font-bold text-blue-900">{new Date(item.expiryDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>
                )}

                <div className="space-y-3 mb-8">
                  <h3 className="font-semibold text-gray-900 text-lg">Location Details</h3>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-700">{item.location}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    navigate('/booking', {
                      state: {
                        item: {
                          id: item.id,
                          location: item.location,
                          size: item.size,
                          price: item.price,
                          image: item.image
                        }
                      }
                    });
                  }}
                  className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-colors shadow-md hover:shadow-lg text-lg flex items-center justify-center gap-2"
                >
                  Book Now
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`India, Maharashtra, ${item.location}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-colors text-center"
                  >
                    View on Map
                  </a>
                  <button
                    onClick={() => toggle({
                      id: item.id,
                      location: item.location,
                      size: item.size,
                      price: item.price,
                      image: item.image,
                      href: `/${category}/${item.id}`
                    })}
                    className={`py-3 px-4 rounded-xl border-2 transition-colors flex items-center justify-center gap-2 font-semibold ${isInWishlist
                      ? 'bg-pink-50 border-pink-300 text-pink-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                  >
                    <Heart size={20} className={isInWishlist ? "fill-pink-600" : ""} />
                    Wishlist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
