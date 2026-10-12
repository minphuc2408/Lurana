import { useState } from "react";
import { Package, Truck, CheckCircle, Clock, Search, ChevronDown, ChevronUp, MapPin, Star } from "lucide-react";

const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=200";
const lilyImage = "https://images.unsplash.com/photo-1766050917257-27675ab4e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGxpbHklMjBmbG93ZXIlMjBtaW5pbWFsaXN0JTIwY2xlYW58ZW58MXx8fHwxNzczNTUyOTYxfDA&ixlib=rb-4.1.0&q=80&w=200";
const sunflowerImage = "https://images.unsplash.com/photo-1770704516784-ef5f1eaf0c06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBkYWlzeSUyMGJyaWdodCUyMHllbGxvdyUyMHNwcmluZ3xlbnwxfHx8fDE3NzM1NTI5NjF8MA&ixlib=rb-4.1.0&q=80&w=200";
const mixedImage = "https://images.unsplash.com/photo-1763817976891-ba82007167bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGZsb3dlciUyMGFycmFuZ2VtZW50JTIwY29sb3JmdWwlMjBtYXJrZXR8ZW58MXx8fHwxNzczNTUyOTYyfDA&ixlib=rb-4.1.0&q=80&w=200";

type OrderStatus = "Delivered" | "In Transit" | "Processing" | "Cancelled";

const orders = [
  {
    id: "LN-2026-1042",
    date: "March 10, 2026",
    status: "Delivered" as OrderStatus,
    items: [{ name: "Blush Peony Bouquet", qty: 1, price: 1200, image: peonyImage }],
    delivery: 150,
    address: "456 Sampaguita St, Makati City",
    tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
    trackStep: 4,
    rating: 5,
  },
  {
    id: "LN-2026-0987",
    date: "February 22, 2026",
    status: "Delivered" as OrderStatus,
    items: [
      { name: "White Lily Elegance", qty: 2, price: 1100, image: lilyImage },
      { name: "Sunshine Daisy Mix", qty: 1, price: 850, image: sunflowerImage },
    ],
    delivery: 300,
    address: "789 Rosal Street, BGC, Taguig",
    tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
    trackStep: 4,
    rating: 5,
  },
  {
    id: "LN-2026-1198",
    date: "March 14, 2026",
    status: "In Transit" as OrderStatus,
    items: [{ name: "Garden Party Mix", qty: 1, price: 1350, image: mixedImage }],
    delivery: 150,
    address: "123 Orchid Avenue, Quezon City",
    tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
    trackStep: 3,
    rating: null,
  },
  {
    id: "LN-2026-1201",
    date: "March 15, 2026",
    status: "Processing" as OrderStatus,
    items: [{ name: "Blush Peony Bouquet", qty: 2, price: 1200, image: peonyImage }],
    delivery: 500,
    address: "55 Tulip Drive, Pasig City",
    tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
    trackStep: 2,
    rating: null,
  },
];

const statusConfig: Record<OrderStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Delivered: { color: "#7A9E7E", bg: "#EDF7EF", icon: <CheckCircle size={14} /> },
  "In Transit": { color: "#5B8DD9", bg: "#EDF3FC", icon: <Truck size={14} /> },
  Processing: { color: "#C17B8A", bg: "#FDF0F3", icon: <Clock size={14} /> },
  Cancelled: { color: "#9A7080", bg: "#F5F0F0", icon: <Package size={14} /> },
};

export function OrderHistory() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "All" || o.status === filter;
    return matchSearch && matchFilter;
  });

  const total = (o: typeof orders[0]) =>
    o.items.reduce((sum, i) => sum + i.price * i.qty, 0) + o.delivery;

  return (
    <div style={{ backgroundColor: "#FDF6F0", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F9EDE9 0%, #F5E8E4 100%)", padding: "60px 24px 40px" }}>
        <div className="max-w-4xl mx-auto">
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C17B8A" }}>Your History</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#3D2228", marginTop: "8px" }}>
            Order History
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9A7080" }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full pl-10 pr-4 py-3"
              style={{ border: "1px solid #F0DDD5", backgroundColor: "white", fontSize: "0.88rem", color: "#3D2228", outline: "none" }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["All", "Processing", "In Transit", "Delivered"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-full"
                style={{
                  border: "1px solid",
                  borderColor: filter === f ? "#C17B8A" : "#F0DDD5",
                  backgroundColor: filter === f ? "#C17B8A" : "white",
                  color: filter === f ? "white" : "#6B4C55",
                  fontSize: "0.8rem",
                  cursor: "pointer"
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="flex flex-col gap-4">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Package size={40} style={{ color: "#D4A0AC", margin: "0 auto 12px" }} />
              <p style={{ color: "#9A7080" }}>No orders found.</p>
            </div>
          )}

          {filtered.map((order) => {
            const cfg = statusConfig[order.status];
            const isExpanded = expanded === order.id;

            return (
              <div key={order.id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
                {/* Header Row */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                      <img src={order.items[0].image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#3D2228", fontWeight: 500 }}>{order.id}</span>
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.bg, color: cfg.color, fontSize: "0.7rem", fontWeight: 500 }}
                        >
                          {cfg.icon} {order.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#9A7080", marginTop: "2px" }}>
                        {order.date} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#C17B8A", fontWeight: 600 }}>
                      ₱{total(order).toLocaleString()}
                    </span>
                    {isExpanded ? <ChevronUp size={18} style={{ color: "#9A7080" }} /> : <ChevronDown size={18} style={{ color: "#9A7080" }} />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid #F0DDD5", padding: "20px" }}>
                    {/* Items */}
                    <div className="flex flex-col gap-3 mb-5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="rounded-lg" style={{ width: "52px", height: "60px", objectFit: "cover" }} />
                          <div className="flex-1">
                            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem", color: "#3D2228" }}>{item.name}</div>
                            <div style={{ fontSize: "0.78rem", color: "#9A7080" }}>Qty: {item.qty}</div>
                          </div>
                          <span style={{ fontSize: "0.9rem", color: "#C17B8A" }}>₱{(item.price * item.qty).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tracking */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={14} style={{ color: "#C17B8A" }} />
                        <span style={{ fontSize: "0.8rem", color: "#6B4C55" }}>{order.address}</span>
                      </div>
                      <div className="flex items-center gap-0">
                        {order.tracking.map((step, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="flex items-center w-full">
                              <div className={`w-full h-1 ${i === 0 ? "hidden" : ""}`}
                                style={{ backgroundColor: i < order.trackStep ? "#C17B8A" : "#F0DDD5" }} />
                              <div
                                className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                                style={{
                                  backgroundColor: i < order.trackStep ? "#C17B8A" : "#F0DDD5",
                                  zIndex: 1
                                }}
                              >
                                {i < order.trackStep && <CheckCircle size={12} color="white" />}
                              </div>
                              <div className={`w-full h-1 ${i === order.tracking.length - 1 ? "hidden" : ""}`}
                                style={{ backgroundColor: i + 1 < order.trackStep ? "#C17B8A" : "#F0DDD5" }} />
                            </div>
                            <span style={{ fontSize: "0.62rem", color: i < order.trackStep ? "#C17B8A" : "#9A7080", marginTop: "4px", textAlign: "center" }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4" style={{ borderTop: "1px solid #F0DDD5" }}>
                      {order.status === "Delivered" && !order.rating && (
                        <button className="flex items-center gap-1 px-4 py-2 rounded-full" style={{ backgroundColor: "#F9EDE9", border: "none", color: "#C17B8A", cursor: "pointer", fontSize: "0.8rem" }}>
                          <Star size={13} /> Write a Review
                        </button>
                      )}
                      {order.rating && (
                        <div className="flex items-center gap-1 px-4 py-2 rounded-full" style={{ backgroundColor: "#EDF7EF" }}>
                          {Array.from({ length: order.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="#7A9E7E" color="#7A9E7E" />
                          ))}
                          <span style={{ fontSize: "0.75rem", color: "#7A9E7E", marginLeft: "4px" }}>Reviewed</span>
                        </div>
                      )}
                      <button className="flex items-center gap-1 px-4 py-2 rounded-full" style={{ border: "1px solid #F0DDD5", background: "none", color: "#6B4C55", cursor: "pointer", fontSize: "0.8rem" }}>
                        Reorder
                      </button>
                      <button className="flex items-center gap-1 px-4 py-2 rounded-full" style={{ border: "1px solid #F0DDD5", background: "none", color: "#9A7080", cursor: "pointer", fontSize: "0.8rem" }}>
                        Get Receipt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
