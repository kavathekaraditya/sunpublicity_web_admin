import Navbar from "../component/Navbar";
import { useEffect, useState } from "react";
import { firestore } from "../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function ContactMessagesDashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const q = query(
          collection(firestore, "contactMessages"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages(list);
      } catch (err) {
        setError(err.message || "Failed to load contact messages");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-6 md:p-10 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Contact Messages</h1>

        {loading && (
          <div className="text-gray-500 py-10">Loading messages...</div>
        )}

        {!loading && error && (
          <div className="text-red-500 py-10">{error}</div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="text-gray-500 py-10">No messages yet.</div>
        )}

        {!loading && !error && messages.length > 0 && (
          <div className="bg-white rounded-xl shadow-md divide-y">
            {messages.map((m) => (
              <div key={m.id} className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                  <div className="font-semibold text-gray-900">
                    {m.name || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {m.email}
                    {m.phone && (
                      <span className="ml-2">• {m.phone}</span>
                    )}
                    {m.createdAt && m.createdAt.toDate && (
                      <span className="ml-2">
                        {m.createdAt
                          .toDate()
                          .toLocaleString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-line">
                  {m.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
