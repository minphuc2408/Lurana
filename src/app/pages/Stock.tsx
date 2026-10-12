import { useState } from "react";
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, TrendingDown, RefreshCw, X, Save } from "lucide-react";

const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=200";
const roseImage = "https://images.unsplash.com/photo-1761571259874-bb4871c44340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmbG93ZXIlMjBib3VxdWV0JTIwcGluayUyMHJvc2VzJTIwZWxlZ2FudHxlbnwxfHx8fDE3NzM1NTI5NTd8MA&ixlib=rb-4.1.0&q=80&w=200";
const sunflowerImage = "https://images.unsplash.com/photo-1770704516784-ef5f1eaf0c06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBkYWlzeSUyMGJyaWdodCUyMHllbGxvdyUyMHNwcmluZ3xlbnwxfHx8fDE3NzM1NTI5NjF8MA&ixlib=rb-4.1.0&q=80&w=200";
const lavenderImage = "https://images.unsplash.com/photo-1653821355168-144695e5c0e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXZlbmRlciUyMHB1cnBsZSUyMGZsb3JhbCUyMGVsZWdhbnQlMjB3ZWRkaW5nfGVufDF8fHx8MTc3MzU1Mjk2MXww&ixlib=rb-4.1.0&q=80&w=200";
const lilyImage = "https://images.unsplash.com/photo-1766050917257-27675ab4e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGxpbHklMjBmbG93ZXIlMjBtaW5pbWFsaXN0JTIwY2xlYW58ZW58MXx8fHwxNzczNTUyOTYxfDA&ixlib=rb-4.1.0&q=80&w=200";
const mixedImage = "https://images.unsplash.com/photo-1763817976891-ba82007167bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGZsb3dlciUyMGFycmFuZ2VtZW50JTIwY29sb3JmdWwlMjBtYXJrZXR8ZW58MXx8fHwxNzczNTUyOTYyfDA&ixlib=rb-4.1.0&q=80&w=200";
const tulipImage = "https://images.unsplash.com/photo-1713859747936-a3220ff17982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWxpcCUyMHBhc3RlbCUyMHNwcmluZyUyMGZsb3dlciUyME5ldGhlcmxhbmRzfGVufDF8fHx8MTc3MzU1Mjk2NXww&ixlib=rb-4.1.0&q=80&w=200";
const wildflowerImage = "https://images.unsplash.com/photo-1735302600702-98b1bd15a98e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aWxkZmxvd2VyJTIwbWVhZG93JTIwYWVzdGhldGljJTIwcGFzdGVsfGVufDF8fHx8MTc3MzU1Mjk1OHww&ixlib=rb-4.1.0&q=80&w=200";

type StockItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  image: string;
  supplier: string;
  lastRestocked: string;
};

const initialStock: StockItem[] = [
  { id: 1, name: "Blush Peony Bouquet", category: "Bouquets", price: 1200, stock: 24, threshold: 10, image: peonyImage, supplier: "Flora Fresh PH", lastRestocked: "Mar 10, 2026" },
  { id: 2, name: "Red Rose Romance", category: "Bouquets", price: 1500, stock: 8, threshold: 10, image: roseImage, supplier: "Rosas de Manila", lastRestocked: "Mar 08, 2026" },
  { id: 3, name: "Sunshine Daisy Mix", category: "Arrangements", price: 850, stock: 31, threshold: 15, image: sunflowerImage, supplier: "Sunshine Blooms", lastRestocked: "Mar 12, 2026" },
  { id: 4, name: "Lavender Dreams", category: "Arrangements", price: 950, stock: 3, threshold: 8, image: lavenderImage, supplier: "Violet Valley Farm", lastRestocked: "Mar 01, 2026" },
  { id: 5, name: "White Lily Elegance", category: "Bouquets", price: 1100, stock: 17, threshold: 10, image: lilyImage, supplier: "Pure Petals Co.", lastRestocked: "Mar 09, 2026" },
  { id: 6, name: "Garden Party Mix", category: "Gift Sets", price: 1350, stock: 6, threshold: 8, image: mixedImage, supplier: "Flora Fresh PH", lastRestocked: "Feb 28, 2026" },
  { id: 7, name: "Pastel Tulip Set", category: "Bouquets", price: 900, stock: 22, threshold: 12, image: tulipImage, supplier: "Dutch Tulip Imports", lastRestocked: "Mar 11, 2026" },
  { id: 8, name: "Wildflower Meadow", category: "Dried Flowers", price: 750, stock: 45, threshold: 20, image: wildflowerImage, supplier: "EcoBlooms Farm", lastRestocked: "Mar 05, 2026" },
];

const categories = ["All", "Bouquets", "Arrangements", "Gift Sets", "Dried Flowers"];

type ModalMode = "add" | "edit" | null;

const emptyItem: Omit<StockItem, "id"> = {
  name: "", category: "Bouquets", price: 0, stock: 0, threshold: 10,
  image: peonyImage, supplier: "", lastRestocked: "Mar 17, 2026",
};

export function Stock() {
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStock);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<Omit<StockItem, "id">>(emptyItem);

  const filtered = stockItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || item.category === category;
    return matchSearch && matchCat;
  });

  const lowStock = stockItems.filter((i) => i.stock <= i.threshold);

  const stockStatus = (item: StockItem) => {
    if (item.stock === 0) return { label: "Out of Stock", color: "#E8453C", bg: "#FFF0F0" };
    if (item.stock <= item.threshold) return { label: "Low Stock", color: "#D4A020", bg: "#FDF8E8" };
    return { label: "In Stock", color: "#7A9E7E", bg: "#EDF7EF" };
  };

  const openAdd = () => { setFormData(emptyItem); setEditingItem(null); setModal("add"); };
  const openEdit = (item: StockItem) => {
    setFormData({ name: item.name, category: item.category, price: item.price, stock: item.stock, threshold: item.threshold, image: item.image, supplier: item.supplier, lastRestocked: item.lastRestocked });
    setEditingItem(item);
    setModal("edit");
  };
  const handleSave = () => {
    if (modal === "add") setStockItems((prev) => [...prev, { id: Date.now(), ...formData }]);
    else if (modal === "edit" && editingItem) setStockItems((prev) => prev.map((i) => i.id === editingItem.id ? { ...i, ...formData } : i));
    setModal(null);
  };
  const handleDelete = (id: number) => setStockItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="p-6" style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Page Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p style={{ fontSize: "0.72rem", color: "#9A7080" }}>Manage your product inventory</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full"
          style={{ backgroundColor: "#C17B8A", color: "white", border: "none", cursor: "pointer", fontSize: "0.82rem" }}
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-5" style={{ backgroundColor: "#FDF8E8", border: "1px solid #F0E0A0" }}>
          <AlertTriangle size={17} style={{ color: "#D4A020", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <span style={{ fontSize: "0.85rem", color: "#3D2228", fontWeight: 500 }}>Stock Alert: </span>
            <span style={{ fontSize: "0.82rem", color: "#6B4C55" }}>
              {lowStock.length} product{lowStock.length > 1 ? "s" : ""} need restocking — {lowStock.map((i) => i.name).join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: stockItems.length, icon: <Package size={17} />, color: "#C17B8A", bg: "#FDF0F3" },
          { label: "In Stock", value: stockItems.filter((i) => i.stock > i.threshold).length, icon: <RefreshCw size={17} />, color: "#7A9E7E", bg: "#EDF7EF" },
          { label: "Low Stock", value: lowStock.filter((i) => i.stock > 0).length, icon: <TrendingDown size={17} />, color: "#D4A020", bg: "#FDF8E8" },
          { label: "Out of Stock", value: stockItems.filter((i) => i.stock === 0).length, icon: <AlertTriangle size={17} />, color: "#E8453C", bg: "#FFF0F0" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-5" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "#3D2228", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: "#6B4C55", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9A7080" }} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full pl-10 pr-4 py-2.5"
            style={{ border: "1px solid #F0DDD5", backgroundColor: "white", fontSize: "0.85rem", color: "#3D2228", outline: "none" }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-4 py-2 rounded-full"
              style={{
                border: "1px solid",
                borderColor: category === cat ? "#C17B8A" : "#F0DDD5",
                backgroundColor: category === cat ? "#C17B8A" : "white",
                color: category === cat ? "white" : "#6B4C55",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#FDFBF9" }}>
                {["Product", "Category", "Price", "Stock", "Status", "Supplier", "Last Restocked", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "13px 16px",
                      fontSize: "0.7rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#9A7080",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = stockStatus(item);
                return (
                  <tr key={item.id} style={{ borderTop: "1px solid #F0DDD5" }}>
                    <td style={{ padding: "13px 16px" }}>
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="rounded-lg flex-shrink-0" style={{ width: "40px", height: "46px", objectFit: "cover" }} />
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.95rem", color: "#3D2228", fontWeight: 500 }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span className="px-3 py-1 rounded-full" style={{ backgroundColor: "#F9EDE9", color: "#C17B8A", fontSize: "0.7rem" }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: "0.88rem", color: "#3D2228", fontWeight: 500 }}>₱{item.price.toLocaleString()}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "0.9rem", color: item.stock <= item.threshold ? "#D4A020" : "#3D2228", fontWeight: 500 }}>{item.stock}</span>
                        <div className="h-1.5 w-14 rounded-full overflow-hidden" style={{ backgroundColor: "#F0DDD5" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((item.stock / (item.threshold * 3)) * 100, 100)}%`,
                              backgroundColor: item.stock === 0 ? "#E8453C" : item.stock <= item.threshold ? "#D4A020" : "#7A9E7E",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <span className="px-3 py-1 rounded-full" style={{ backgroundColor: status.bg, color: status.color, fontSize: "0.7rem", fontWeight: 500 }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: "0.82rem", color: "#6B4C55" }}>{item.supplier}</td>
                    <td style={{ padding: "13px 16px", fontSize: "0.78rem", color: "#9A7080" }}>{item.lastRestocked}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "#F9EDE9", border: "none", cursor: "pointer", color: "#C17B8A" }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "#FFF0F0", border: "none", cursor: "pointer", color: "#E8453C" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(61,34,40,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="rounded-3xl p-8 w-full max-w-lg shadow-2xl" style={{ backgroundColor: "white", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", color: "#3D2228" }}>
                {modal === "add" ? "Add New Product" : "Edit Product"}
              </h2>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9A7080" }}>
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { key: "name", label: "Product Name", type: "text" },
                { key: "supplier", label: "Supplier", type: "text" },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: "0.74rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={formData[f.key as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    className="w-full rounded-xl px-4 py-3"
                    style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: "0.74rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                >
                  {["Bouquets", "Arrangements", "Gift Sets", "Dried Flowers"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: "price", label: "Price (₱)" },
                  { key: "stock", label: "Stock Qty" },
                  { key: "threshold", label: "Min Threshold" },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: "0.7rem", color: "#6B4C55", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>{f.label}</label>
                    <input
                      type="number"
                      value={formData[f.key as keyof typeof formData] as number}
                      onChange={(e) => setFormData({ ...formData, [f.key]: Number(e.target.value) })}
                      className="w-full rounded-xl px-3 py-3"
                      style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-3 rounded-full"
                  style={{ border: "1px solid #F0DDD5", background: "none", color: "#9A7080", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full"
                  style={{ backgroundColor: "#C17B8A", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  <Save size={15} /> {modal === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
