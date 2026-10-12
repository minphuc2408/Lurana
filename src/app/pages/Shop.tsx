import { useState } from "react";
import { Link } from "react-router";
import { Heart, ShoppingBag, SlidersHorizontal, Search, X } from "lucide-react";

const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=600";
const roseImage = "https://images.unsplash.com/photo-1761571259874-bb4871c44340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmbG93ZXIlMjBib3VxdWV0JTIwcGluayUyMHJvc2VzJTIwZWxlZ2FudHxlbnwxfHx8fDE3NzM1NTI5NTd8MA&ixlib=rb-4.1.0&q=80&w=600";
const sunflowerImage = "https://images.unsplash.com/photo-1770704516784-ef5f1eaf0c06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBkYWlzeSUyMGJyaWdodCUyMHllbGxvdyUyMHNwcmluZ3xlbnwxfHx8fDE3NzM1NTI5NjF8MA&ixlib=rb-4.1.0&q=80&w=600";
const lavenderImage = "https://images.unsplash.com/photo-1653821355168-144695e5c0e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXZlbmRlciUyMHB1cnBsZSUyMGZsb3JhbCUyMGVsZWdhbnQlMjB3ZWRkaW5nfGVufDF8fHx8MTc3MzU1Mjk2MXww&ixlib=rb-4.1.0&q=80&w=600";
const lilyImage = "https://images.unsplash.com/photo-1766050917257-27675ab4e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGxpbHklMjBmbG93ZXIlMjBtaW5pbWFsaXN0JTIwY2xlYW58ZW58MXx8fHwxNzczNTUyOTYxfDA&ixlib=rb-4.1.0&q=80&w=600";
const mixedImage = "https://images.unsplash.com/photo-1763817976891-ba82007167bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGZsb3dlciUyMGFycmFuZ2VtZW50JTIwY29sb3JmdWwlMjBtYXJrZXR8ZW58MXx8fHwxNzczNTUyOTYyfDA&ixlib=rb-4.1.0&q=80&w=600";
const tulipImage = "https://images.unsplash.com/photo-1713859747936-a3220ff17982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWxpcCUyMHBhc3RlbCUyMHNwcmluZyUyMGZsb3dlciUyME5ldGhlcmxhbmRzfGVufDF8fHx8MTc3MzU1Mjk2NXww&ixlib=rb-4.1.0&q=80&w=600";
const wildflowerImage = "https://images.unsplash.com/photo-1735302600702-98b1bd15a98e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aWxkZmxvd2VyJTIwbWVhZG93JTIwYWVzdGhldGljJTIwcGFzdGVsfGVufDF8fHx8MTc3MzU1Mjk1OHww&ixlib=rb-4.1.0&q=80&w=600";

const products = [
  { id: 1, name: "Blush Peony Bouquet", price: 1200, category: "Bouquets", image: peonyImage, tag: "Bestseller", rating: 4.9, reviews: 87 },
  { id: 2, name: "Red Rose Romance", price: 1500, category: "Bouquets", image: roseImage, tag: "New", rating: 4.8, reviews: 34 },
  { id: 3, name: "Sunshine Daisy Mix", price: 850, category: "Arrangements", image: sunflowerImage, tag: "", rating: 4.7, reviews: 62 },
  { id: 4, name: "Lavender Dreams", price: 950, category: "Arrangements", image: lavenderImage, tag: "Popular", rating: 4.9, reviews: 115 },
  { id: 5, name: "White Lily Elegance", price: 1100, category: "Bouquets", image: lilyImage, tag: "", rating: 4.6, reviews: 28 },
  { id: 6, name: "Garden Party Mix", price: 1350, category: "Gift Sets", image: mixedImage, tag: "Seasonal", rating: 4.8, reviews: 51 },
  { id: 7, name: "Pastel Tulip Set", price: 900, category: "Bouquets", image: tulipImage, tag: "", rating: 4.7, reviews: 43 },
  { id: 8, name: "Wildflower Meadow", price: 750, category: "Dried Flowers", image: wildflowerImage, tag: "Eco-Friendly", rating: 4.5, reviews: 19 },
];

const categories = ["All", "Bouquets", "Arrangements", "Dried Flowers", "Gift Sets"];

export function Shop() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<number[]>([]);
  const [added, setAdded] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "low") return a.price - b.price;
    if (sortBy === "high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const toggleLike = (id: number) => setLiked((prev) => prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]);
  const toggleAdd = (id: number) => setAdded((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  return (
    <div style={{ backgroundColor: "#FDF6F0", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F9EDE9 0%, #F5E8E4 100%)", padding: "60px 24px 40px" }}>
        <div className="max-w-7xl mx-auto text-center">
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C17B8A" }}>Our Collection</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 600, color: "#3D2228", marginTop: "8px" }}>
            The Lunara Shop
          </h1>
          <p style={{ color: "#6B4C55", fontSize: "0.92rem", marginTop: "12px" }}>Discover handcrafted arrangements for every occasion</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9A7080" }} />
            <input
              type="text"
              placeholder="Search flowers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full pl-10 pr-4 py-3"
              style={{ border: "1px solid #F0DDD5", backgroundColor: "white", fontSize: "0.88rem", color: "#3D2228", outline: "none" }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9A7080" }}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full px-5 py-3"
              style={{ border: "1px solid #F0DDD5", backgroundColor: "white", fontSize: "0.85rem", color: "#6B4C55", outline: "none" }}
            >
              <option value="featured">Featured</option>
              <option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 rounded-full px-5 py-3"
              style={{ border: "1px solid #C17B8A", backgroundColor: filterOpen ? "#C17B8A" : "white", color: filterOpen ? "white" : "#C17B8A", fontSize: "0.85rem", cursor: "pointer" }}
            >
              <SlidersHorizontal size={16} /> Filters
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-5 py-2 rounded-full"
              style={{
                border: "1px solid",
                borderColor: activeCategory === cat ? "#C17B8A" : "#F0DDD5",
                backgroundColor: activeCategory === cat ? "#C17B8A" : "white",
                color: activeCategory === cat ? "white" : "#6B4C55",
                fontSize: "0.82rem",
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {cat}
            </button>
          ))}
          <span style={{ fontSize: "0.82rem", color: "#9A7080", alignSelf: "center", marginLeft: "8px" }}>
            {sorted.length} products
          </span>
        </div>

        {/* Product Grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: "#9A7080", fontSize: "1rem" }}>No flowers found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sorted.map((product) => (
              <div
                key={product.id}
                className="group rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ backgroundColor: "white" }}
              >
                <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                    className="group-hover:scale-105"
                  />
                  {product.tag && (
                    <span
                      className="absolute top-3 left-3 px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#C17B8A", color: "white", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
                    >
                      {product.tag}
                    </span>
                  )}
                  <button
                    onClick={() => toggleLike(product.id)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all"
                    style={{ backgroundColor: "white", border: "none", cursor: "pointer" }}
                  >
                    <Heart
                      size={16}
                      style={{ color: "#C17B8A" }}
                      fill={liked.includes(product.id) ? "#C17B8A" : "none"}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#3D2228", fontWeight: 500, marginBottom: "4px" }}>
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-3">
                    <span style={{ fontSize: "0.75rem", color: "#C17B8A" }}>★ {product.rating}</span>
                    <span style={{ fontSize: "0.72rem", color: "#9A7080" }}>({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: "0.95rem", color: "#C17B8A", fontWeight: 500 }}>₱{product.price.toLocaleString()}</span>
                    <button
                      onClick={() => toggleAdd(product.id)}
                      className="flex items-center gap-1 px-3 py-2 rounded-full"
                      style={{
                        backgroundColor: added.includes(product.id) ? "#C17B8A" : "transparent",
                        border: "1px solid #C17B8A",
                        color: added.includes(product.id) ? "white" : "#C17B8A",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <ShoppingBag size={12} />
                      {added.includes(product.id) ? "Added" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Cart CTA */}
        {added.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <Link
              to="/cart"
              className="flex items-center gap-3 px-8 py-4 rounded-full shadow-2xl"
              style={{ backgroundColor: "#3D2228", color: "white", textDecoration: "none", fontSize: "0.85rem" }}
            >
              <ShoppingBag size={18} />
              View Cart ({added.length} item{added.length > 1 ? "s" : ""})
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
