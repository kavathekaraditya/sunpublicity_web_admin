import Navbar from "../component/Navbar";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { firestore } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { normalizeHoardingData } from "../utils/normalizeAvailability";
import { getCloudinaryUrl } from "../utils/cloudinary";

export default function DynamicCategoryPage() {
    const { category: categorySlug } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categoryName, setCategoryName] = useState("");

    const [query, setQuery] = useState("");
    const [size, setSize] = useState("All");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1) Find the real category name/ID from the slug
                // We'll fetch all categories to find a match
                const catsRef = collection(firestore, "categories");
                const catsSnap = await getDocs(catsRef);

                let targetCategory = null;
                for (const docSnap of catsSnap.docs) {
                    const id = docSnap.id;
                    const data = docSnap.data();
                    const name = data.name || id;

                    // Compare slugified versions
                    const slug = name.toLowerCase().replace(/\s+/g, '-');
                    if (slug === categorySlug || id.toLowerCase().replace(/\s+/g, '-') === categorySlug) {
                        targetCategory = { id, name };
                        break;
                    }
                }

                if (!targetCategory) {
                    throw new Error("Category not found");
                }

                setCategoryName(targetCategory.name);

                // 2) Fetch hoardings for this category
                const colRef = collection(doc(firestore, "categories", targetCategory.id), "hoardings");
                const snapshot = await getDocs(colRef);
                const list = snapshot.docs.map((doc) =>
                    normalizeHoardingData(doc.data(), doc.id, targetCategory.name)
                );

                setItems(list);
            } catch (err) {
                console.error("Error loading dynamic category:", err);
                setError(err.message || "Failed to load hoardings");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [categorySlug]);

    const filtered = useMemo(() => {
        return items.filter((b) => {
            const matchesQuery = b.location.toLowerCase().includes(query.toLowerCase());
            const matchesSize = size === "All" ? true : b.size === size;
            return matchesQuery && matchesSize;
        });
    }, [items, query, size]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading {categorySlug}...</div>;
    if (error) return <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-bold">{error}</p>
        <Link to="/" className="text-blue-600 underline">Back to Home</Link>
    </div>;

    return (
        <>
            <Navbar />
            <main className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 capitalize">{categoryName}</h1>

                {/* Simple Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <input
                        type="text"
                        placeholder="Filter by location..."
                        className="flex-1 border px-4 py-2 rounded-lg"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <select
                        className="border px-4 py-2 rounded-lg"
                        value={size}
                        onChange={e => setSize(e.target.value)}
                    >
                        <option value="All">All Sizes</option>
                        {Array.from(new Set(items.map(i => i.size))).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {filtered.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 group">
                            <div className="aspect-video relative overflow-hidden">
                                <img
                                    src={getCloudinaryUrl(item.image)}
                                    alt={item.location}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    onError={(e) => e.target.src = "https://placehold.co/800x450?text=Hoarding"}
                                />
                                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${item.available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {item.available ? 'AVAILABLE' : 'BOOKED'}
                                </span>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-2 truncate">{item.location}</h3>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-1">{item.size} ft | {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.price)}/mo</p>
                                <Link
                                    to={`/${categorySlug}/${item.id}`}
                                    className="block w-full text-center py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            No hoardings found.
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
