import { useState } from "react";
import { Link } from "react-router";
import { Minus, Plus, X, ShoppingBag, ChevronRight, Tag, Truck } from "lucide-react";

const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=400";
const lavenderImage = "https://images.unsplash.com/photo-1653821355168-144695e5c0e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXZlbmRlciUyMHB1cnBsZSUyMGZsb3JhbCUyMGVsZWdhbnQlMjB3ZWRkaW5nfGVufDF8fHx8MTc3MzU1Mjk2MXww&ixlib=rb-4.1.0&q=80&w=400";
const lilyImage = "https://images.unsplash.com/photo-1766050917257-27675ab4e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGxpbHklMjBmbG93ZXIlMjBtaW5pbWFsaXN0JTIwY2xlYW58ZW58MXx8fHwxNzczNTUyOTYxfDA&ixlib=rb-4.1.0&q=80&w=400";

const initialCartItems = [
  { id: 1, name: "Blush Peony Bouquet", price: 1200, qty: 1, image: peonyImage, size: "Medium" },
  { id: 2, name: "Lavender Dreams", price: 950, qty: 2, image: lavenderImage, size: "Large" },
  { id: 3, name: "White Lily Elegance", price: 1100, qty: 1, image: lilyImage, size: "Small" },
];

const deliveryOptions = [
  { id: "standard", label: "Standard Delivery", sublabel: "3-5 business days", price: 150 },
  { id: "express", label: "Express Delivery", sublabel: "Next day delivery", price: 300 },
  { id: "sameday", label: "Same-Day Delivery", sublabel: "Order before 12PM", price: 500 },
];

type Step = "cart" | "checkout" | "confirmation";

export function Cart() {
  const [items, setItems] = useState(initialCartItems);
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [delivery, setDelivery] = useState("standard");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", notes: ""
  });

  const updateQty = (id: number, delta: number) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = deliveryOptions.find((d) => d.id === delivery)?.price ?? 150;
  const discount = couponApplied ? Math.floor(subtotal * 0.1) : 0;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = () => {
    if (coupon.toLowerCase() === "lunara10") setCouponApplied(true);
  };

  if (step === "confirmation") {
    return (
      <div style={{ backgroundColor: "#FDF6F0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif" }}>
        <div className="text-center px-6 py-12 rounded-3xl shadow-lg" style={{ backgroundColor: "white", maxWidth: "480px", width: "100%", border: "1px solid #F0DDD5" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#F9EDE9" }}>
            <span style={{ fontSize: "2rem" }}>🌸</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "#3D2228", marginBottom: "12px" }}>
            Order Confirmed!
          </h2>
          <p style={{ color: "#6B4C55", fontSize: "0.92rem", marginBottom: "8px", lineHeight: 1.7 }}>
            Thank you for your order. We'll prepare your beautiful blooms with love and care.
          </p>
          <p style={{ color: "#9A7080", fontSize: "0.82rem", marginBottom: "32px" }}>
            Order #LN-2026-{Math.floor(Math.random() * 9000 + 1000)} · Confirmation sent to {form.email || "your email"}
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/orders" className="py-3 rounded-full text-center" style={{ backgroundColor: "#C17B8A", color: "white", textDecoration: "none", fontSize: "0.85rem" }}>
              Track My Order
            </Link>
            <Link to="/shop" className="py-3 rounded-full text-center" style={{ border: "1px solid #C17B8A", color: "#C17B8A", textDecoration: "none", fontSize: "0.85rem" }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#FDF6F0", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F9EDE9 0%, #F5E8E4 100%)", padding: "50px 24px 30px" }}>
        <div className="max-w-7xl mx-auto">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#3D2228" }}>
            {step === "cart" ? "Your Cart" : "Checkout"}
          </h1>
          {/* Breadcrumb steps */}
          <div className="flex items-center gap-2 mt-3">
            {["cart", "checkout"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: step === s || (s === "cart" && step === "checkout") ? "#C17B8A" : "#F0DDD5",
                      color: step === s || (s === "cart" && step === "checkout") ? "white" : "#9A7080",
                      fontSize: "0.75rem",
                      fontWeight: 600
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontSize: "0.82rem", color: step === s ? "#C17B8A" : "#9A7080", textTransform: "capitalize" }}>{s}</span>
                </div>
                {i < 1 && <ChevronRight size={14} style={{ color: "#C0A0A8" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
        {/* Left: Cart or Checkout Form */}
        <div className="lg:col-span-2">
          {step === "cart" ? (
            <>
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag size={48} style={{ color: "#D4A0AC", margin: "0 auto 16px" }} />
                  <p style={{ color: "#9A7080", fontSize: "1rem" }}>Your cart is empty.</p>
                  <Link to="/shop" style={{ color: "#C17B8A", fontSize: "0.88rem", textDecoration: "none" }}>Browse flowers →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-5 rounded-2xl" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className="rounded-xl"
                        style={{ width: "100px", height: "120px", objectFit: "cover", flexShrink: 0 }}
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", fontWeight: 500 }}>{item.name}</h3>
                            <span style={{ fontSize: "0.78rem", color: "#9A7080" }}>Size: {item.size}</span>
                          </div>
                          <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#C0A0A8" }}>
                            <X size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 rounded-full px-1 py-1" style={{ border: "1px solid #F0DDD5" }}>
                            <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "none", border: "none", cursor: "pointer", color: "#6B4C55" }}>
                              <Minus size={14} />
                            </button>
                            <span style={{ fontSize: "0.9rem", color: "#3D2228", minWidth: "20px", textAlign: "center" }}>{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "none", border: "none", cursor: "pointer", color: "#6B4C55" }}>
                              <Plus size={14} />
                            </button>
                          </div>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", fontWeight: 600, color: "#C17B8A" }}>
                            ₱{(item.price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery Options */}
              <div className="mt-8 p-6 rounded-2xl" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "#3D2228", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Truck size={18} style={{ color: "#C17B8A" }} /> Delivery Options
                </h3>
                <div className="flex flex-col gap-3">
                  {deliveryOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
                      style={{
                        border: `1px solid ${delivery === opt.id ? "#C17B8A" : "#F0DDD5"}`,
                        backgroundColor: delivery === opt.id ? "#FDF0F3" : "transparent",
                        transition: "all 0.2s"
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input type="radio" name="delivery" value={opt.id} checked={delivery === opt.id} onChange={() => setDelivery(opt.id)} style={{ accentColor: "#C17B8A" }} />
                        <div>
                          <div style={{ fontSize: "0.88rem", color: "#3D2228", fontWeight: 500 }}>{opt.label}</div>
                          <div style={{ fontSize: "0.76rem", color: "#9A7080" }}>{opt.sublabel}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.88rem", color: "#C17B8A", fontWeight: 500 }}>₱{opt.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Checkout Form */
            <div className="p-6 rounded-2xl" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", color: "#3D2228", marginBottom: "24px" }}>Delivery Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "firstName", label: "First Name", placeholder: "Maria" },
                  { key: "lastName", label: "Last Name", placeholder: "Santos" },
                  { key: "email", label: "Email Address", placeholder: "maria@example.com", full: true },
                  { key: "phone", label: "Phone Number", placeholder: "+63 912 345 6789", full: true },
                  { key: "address", label: "Street Address", placeholder: "123 Bloom Street, Barangay Floralia", full: true },
                  { key: "city", label: "City", placeholder: "Manila" },
                ].map((field) => (
                  <div key={field.key} className={field.full ? "col-span-2" : ""}>
                    <label style={{ display: "block", fontSize: "0.8rem", color: "#6B4C55", letterSpacing: "0.08em", marginBottom: "6px", textTransform: "uppercase" }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full rounded-xl px-4 py-3"
                      style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#6B4C55", letterSpacing: "0.08em", marginBottom: "6px", textTransform: "uppercase" }}>
                    Special Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Any special requests for your arrangement..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl px-4 py-3"
                    style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9", resize: "none" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="rounded-2xl p-6 sticky top-24" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#3D2228", marginBottom: "20px" }}>Order Summary</h3>

            <div className="flex flex-col gap-3 pb-4" style={{ borderBottom: "1px solid #F0DDD5" }}>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span style={{ color: "#6B4C55" }}>{item.name} × {item.qty}</span>
                  <span style={{ color: "#3D2228" }}>₱{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 py-4" style={{ borderBottom: "1px solid #F0DDD5" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6B4C55" }}>Subtotal</span>
                <span style={{ color: "#3D2228" }}>₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#6B4C55" }}>Delivery</span>
                <span style={{ color: "#3D2228" }}>₱{deliveryFee}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#7A9E7E" }}>Discount (10%)</span>
                  <span style={{ color: "#7A9E7E" }}>-₱{discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between py-4" style={{ borderBottom: "1px solid #F0DDD5" }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", fontWeight: 600 }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "#C17B8A", fontWeight: 600 }}>₱{total.toLocaleString()}</span>
            </div>

            {/* Coupon */}
            {!couponApplied && (
              <div className="flex gap-2 mt-4">
                <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2" style={{ border: "1px solid #F0DDD5", backgroundColor: "#FDFBF9" }}>
                  <Tag size={14} style={{ color: "#9A7080" }} />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    style={{ border: "none", outline: "none", fontSize: "0.82rem", color: "#3D2228", background: "transparent", width: "100%" }}
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl"
                  style={{ backgroundColor: "#F5E8E4", border: "none", color: "#C17B8A", fontSize: "0.82rem", cursor: "pointer", fontWeight: 500 }}
                >
                  Apply
                </button>
              </div>
            )}
            {couponApplied && (
              <p style={{ fontSize: "0.78rem", color: "#7A9E7E", marginTop: "8px" }}>✓ Coupon LUNARA10 applied!</p>
            )}

            <button
              onClick={() => step === "cart" ? setStep("checkout") : setStep("confirmation")}
              className="w-full py-4 rounded-full mt-6 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#C17B8A", color: "white", border: "none", cursor: "pointer", fontSize: "0.88rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}
            >
              {step === "cart" ? "Proceed to Checkout" : "Place Order"} <ChevronRight size={16} />
            </button>

            {step === "checkout" && (
              <button
                onClick={() => setStep("cart")}
                className="w-full py-3 rounded-full mt-3"
                style={{ background: "none", border: "1px solid #F0DDD5", color: "#9A7080", cursor: "pointer", fontSize: "0.82rem" }}
              >
                ← Back to Cart
              </button>
            )}

            <p style={{ fontSize: "0.72rem", color: "#9A7080", textAlign: "center", marginTop: "12px" }}>
              🔒 Secure checkout · 100% satisfaction guaranteed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
