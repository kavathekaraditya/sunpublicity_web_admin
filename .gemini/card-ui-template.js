// This is a template for the improved card UI
// Copy this structure to update remaining category pages

const improvedCardUI = `
<motion.div
  key={b.id}
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.10)" }}
  transition={{ type: "spring", stiffness: 220, damping: 18 }}
  className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:border-blue-200"
>
  <div className="aspect-video bg-gray-100 overflow-hidden relative">
    <img
      src={b.image}
      alt={b.location}
      className="w-full h-full object-cover transform transition-transform duration-300 ease-out group-hover:scale-105"
      onError={(e) => {
        e.currentTarget.src = "https://via.placeholder.com/800x450?text=CATEGORY_NAME";
      }}
    />
    <span
      className={\`absolute top-3 right-3 text-xs font-medium px-3 py-1.5 rounded-full shadow-md \${b.available ? "bg-green-500 text-white" : "bg-red-500 text-white"}\`}
    >
      {b.available ? "Available" : "Not Available"}
    </span>
  </div>
  <div className="p-5 space-y-3">
    <div>
      <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">{b.location}</h3>
      <p className="text-sm text-gray-500">India, Maharashtra</p>
    </div>
    
    <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-gray-100">
      <div>
        <div className="text-xs text-gray-500 mb-1">Size</div>
        <div className="font-semibold text-gray-900">{b.size.replace("x", "ft x ")}ft</div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Price</div>
        <div className="font-semibold text-gray-900">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(b.price)}<span className="text-xs font-normal text-gray-500">/month</span></div>
      </div>
    </div>

    {b.expiryDate && (
      <div className="text-sm text-gray-600">
        <span className="text-gray-500">Expiry:</span> {new Date(b.expiryDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
      </div>
    )}

    <div className="pt-2 flex flex-col gap-2">
      <div className="flex gap-2">
        <Link
          to={\`/ROUTE_NAME/\${b.id}\`}
          className="flex-1 text-center text-sm font-semibold text-blue-600 hover:text-blue-700 px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          View Details
        </Link>
        <a
          href={\`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(\`India, Maharashtra, \${b.location}\`)}\`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 text-center text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Map
        </a>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/booking', { state: { item: { id: b.id, location: b.location, size: b.size, price: b.price, image: b.image, href: \`/ROUTE_NAME/\${b.id}\` } } })}
          className="flex-1 text-sm px-4 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-colors shadow-sm"
        >
          Book Now
        </button>
        {(() => {
          const inList = wishlistItems.some((i) => i.id === b.id);
          return (
            <button
              onClick={() => toggle({ id: b.id, location: b.location, size: b.size, price: b.price, image: b.image, href: \`/ROUTE_NAME/\${b.id}\` })}
              className={\`px-4 py-2.5 rounded-lg border transition-colors \${inList ? 'bg-pink-50 text-pink-600 border-pink-300 hover:bg-pink-100' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}\`}
              aria-pressed={inList}
              title={inList ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart size={18} className={inList ? 'fill-pink-600 text-pink-600' : 'text-gray-500'} />
            </button>
          );
        })()}
      </div>
    </div>
  </div>
</motion.div>
`;

// Routes mapping:
// ShoppingMallDashboard.jsx -> /shop-boards/:id
// EventPromotionDashboard.jsx -> /van-promotions/:id
// CorporateAdSpaceDashboard.jsx -> /wall-paintings/:id
