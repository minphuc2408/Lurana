import { useState } from "react";
import { Flower, Calendar, Palette, Package, MessageSquare, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";

const occasions = ["Birthday", "Wedding", "Anniversary", "Graduation", "Sympathy", "Just Because", "Valentine's Day", "Mother's Day", "Corporate Event", "Other"];
const colorSchemes = [
  { name: "Blush & Ivory", colors: ["#F8C8C8", "#FDFAF5"] },
  { name: "Rose & Burgundy", colors: ["#D4677A", "#7A2035"] },
  { name: "Lavender & Sage", colors: ["#B89EC4", "#7A9E7E"] },
  { name: "Sunflower Yellow", colors: ["#F5D060", "#D4A520"] },
  { name: "Pure White", colors: ["#F5F5F5", "#E0E0E0"] },
  { name: "Tropical Brights", colors: ["#FF8C61", "#56C3A0"] },
];
const flowerTypes = ["Roses", "Peonies", "Tulips", "Lilies", "Sunflowers", "Lavender", "Wildflowers", "Orchids", "Carnations", "No Preference"];
const sizes = [
  { name: "Petite", desc: "Perfect for single person", price: "₱600–₱800" },
  { name: "Classic", desc: "Our most popular size", price: "₱900–₱1,400" },
  { name: "Grande", desc: "A statement arrangement", price: "₱1,500–₱2,500" },
  { name: "Luxe", desc: "Extravagant & unforgettable", price: "₱3,000+" },
];

type FormData = {
  occasion: string;
  colors: string[];
  flowers: string[];
  size: string;
  budget: string;
  date: string;
  recipient: string;
  message: string;
  name: string;
  email: string;
  phone: string;
};

export function Request() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    occasion: "",
    colors: [],
    flowers: [],
    size: "",
    budget: "",
    date: "",
    recipient: "",
    message: "",
    name: "",
    email: "",
    phone: "",
  });

  const totalSteps = 4;

  const toggleArray = (key: "colors" | "flowers", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  };

  if (submitted) {
    return (
      <div style={{ backgroundColor: "#FDF6F0", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Jost', sans-serif" }}>
        <div className="text-center px-8 py-12 rounded-3xl shadow-lg mx-4" style={{ backgroundColor: "white", maxWidth: "520px", width: "100%", border: "1px solid #F0DDD5" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#F9EDE9" }}>
            <CheckCircle size={36} style={{ color: "#C17B8A" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.2rem", fontWeight: 600, color: "#3D2228", marginBottom: "12px" }}>
            Request Received!
          </h2>
          <p style={{ color: "#6B4C55", fontSize: "0.92rem", lineHeight: 1.7, marginBottom: "8px" }}>
            Thank you, <strong>{formData.name}</strong>! We've received your custom flower request for <strong>{formData.occasion || "a special occasion"}</strong>.
          </p>
          <p style={{ color: "#9A7080", fontSize: "0.82rem", marginBottom: "32px" }}>
            Our floral artists will review your request and contact you within 24 hours at <strong>{formData.email}</strong>.
          </p>
          <button
            onClick={() => { setSubmitted(false); setStep(1); setFormData({ occasion: "", colors: [], flowers: [], size: "", budget: "", date: "", recipient: "", message: "", name: "", email: "", phone: "" }); }}
            className="px-8 py-3 rounded-full"
            style={{ backgroundColor: "#C17B8A", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#FDF6F0", minHeight: "100vh", fontFamily: "'Jost', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #F9EDE9 0%, #F5E8E4 100%)", padding: "60px 24px 40px" }}>
        <div className="max-w-3xl mx-auto text-center">
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C17B8A" }}>Bespoke Florals</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#3D2228", marginTop: "8px" }}>
            Custom Flower Request
          </h1>
          <p style={{ color: "#6B4C55", fontSize: "0.92rem", marginTop: "12px" }}>
            Tell us your vision and our floral artists will bring it to life
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {[
              { icon: <Flower size={16} />, label: "Occasion" },
              { icon: <Palette size={16} />, label: "Style" },
              { icon: <Package size={16} />, label: "Details" },
              { icon: <MessageSquare size={16} />, label: "Contact" },
            ].map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: i + 1 <= step ? "#C17B8A" : "#F0DDD5",
                    color: i + 1 <= step ? "white" : "#9A7080"
                  }}
                >
                  {s.icon}
                </div>
                <span style={{ fontSize: "0.72rem", color: i + 1 <= step ? "#C17B8A" : "#9A7080", letterSpacing: "0.05em" }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 rounded-full" style={{ backgroundColor: "#F0DDD5" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%`, backgroundColor: "#C17B8A" }}
            />
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}>
          {/* Step 1: Occasion */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#3D2228", marginBottom: "6px" }}>What's the occasion?</h2>
              <p style={{ fontSize: "0.85rem", color: "#9A7080", marginBottom: "24px" }}>Choose the event for your arrangement</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {occasions.map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setFormData({ ...formData, occasion: occ })}
                    className="py-3 px-4 rounded-xl transition-all"
                    style={{
                      border: `1px solid ${formData.occasion === occ ? "#C17B8A" : "#F0DDD5"}`,
                      backgroundColor: formData.occasion === occ ? "#FDF0F3" : "white",
                      color: formData.occasion === occ ? "#C17B8A" : "#6B4C55",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontWeight: formData.occasion === occ ? 500 : 400
                    }}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Style */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#3D2228", marginBottom: "6px" }}>Choose your style</h2>
              <p style={{ fontSize: "0.85rem", color: "#9A7080", marginBottom: "24px" }}>Select color palette and flower preferences</p>

              <div className="mb-8">
                <h3 style={{ fontSize: "0.82rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B4C55", marginBottom: "16px" }}>Color Palette</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.name}
                      onClick={() => toggleArray("colors", scheme.name)}
                      className="flex items-center gap-3 p-4 rounded-xl transition-all"
                      style={{
                        border: `1px solid ${formData.colors.includes(scheme.name) ? "#C17B8A" : "#F0DDD5"}`,
                        backgroundColor: formData.colors.includes(scheme.name) ? "#FDF0F3" : "white",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <div className="flex gap-1">
                        {scheme.colors.map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full" style={{ backgroundColor: c, border: "1px solid rgba(0,0,0,0.1)" }} />
                        ))}
                      </div>
                      <span style={{ fontSize: "0.8rem", color: "#3D2228" }}>{scheme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: "0.82rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B4C55", marginBottom: "16px" }}>Preferred Flowers</h3>
                <div className="flex flex-wrap gap-2">
                  {flowerTypes.map((flower) => (
                    <button
                      key={flower}
                      onClick={() => toggleArray("flowers", flower)}
                      className="px-4 py-2 rounded-full transition-all"
                      style={{
                        border: `1px solid ${formData.flowers.includes(flower) ? "#C17B8A" : "#F0DDD5"}`,
                        backgroundColor: formData.flowers.includes(flower) ? "#C17B8A" : "white",
                        color: formData.flowers.includes(flower) ? "white" : "#6B4C55",
                        fontSize: "0.82rem",
                        cursor: "pointer"
                      }}
                    >
                      {flower}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#3D2228", marginBottom: "6px" }}>Arrangement details</h2>
              <p style={{ fontSize: "0.85rem", color: "#9A7080", marginBottom: "24px" }}>Size, budget, and delivery date</p>

              <div className="mb-8">
                <h3 style={{ fontSize: "0.82rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#6B4C55", marginBottom: "16px" }}>Arrangement Size</h3>
                <div className="grid grid-cols-2 gap-3">
                  {sizes.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => setFormData({ ...formData, size: s.name })}
                      className="p-4 rounded-xl text-left transition-all"
                      style={{
                        border: `1px solid ${formData.size === s.name ? "#C17B8A" : "#F0DDD5"}`,
                        backgroundColor: formData.size === s.name ? "#FDF0F3" : "white",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#9A7080", marginTop: "2px" }}>{s.desc}</div>
                      <div style={{ fontSize: "0.82rem", color: "#C17B8A", marginTop: "4px", fontWeight: 500 }}>{s.price}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
                    <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} /> Needed By
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl px-4 py-3"
                    style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Recipient Name</label>
                  <input
                    type="text"
                    placeholder="For whom is this?"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    className="w-full rounded-xl px-4 py-3"
                    style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                  />
                </div>
                <div className="col-span-2">
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Additional Notes</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your vision, any allergies, special wishes..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl px-4 py-3"
                    style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9", resize: "none" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", color: "#3D2228", marginBottom: "6px" }}>Your contact details</h2>
              <p style={{ fontSize: "0.85rem", color: "#9A7080", marginBottom: "24px" }}>So our team can reach you about your order</p>

              <div className="flex flex-col gap-4">
                {[
                  { key: "name", label: "Full Name", placeholder: "Maria Santos", type: "text" },
                  { key: "email", label: "Email Address", placeholder: "maria@example.com", type: "email" },
                  { key: "phone", label: "Phone Number", placeholder: "+63 912 345 6789", type: "tel" },
                ].map((field) => (
                  <div key={field.key}>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.key as keyof FormData] as string}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full rounded-xl px-4 py-3"
                      style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                    />
                  </div>
                ))}

                {/* Summary */}
                <div className="rounded-xl p-5 mt-2" style={{ backgroundColor: "#F9EDE9", border: "1px solid #F0DDD5" }}>
                  <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#3D2228", marginBottom: "12px" }}>Request Summary</h4>
                  <div className="flex flex-col gap-1">
                    {[
                      { label: "Occasion", value: formData.occasion || "Not specified" },
                      { label: "Colors", value: formData.colors.join(", ") || "Not specified" },
                      { label: "Flowers", value: formData.flowers.join(", ") || "Not specified" },
                      { label: "Size", value: formData.size || "Not specified" },
                      { label: "Date Needed", value: formData.date || "Not specified" },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-2">
                        <span style={{ fontSize: "0.78rem", color: "#9A7080", minWidth: "80px" }}>{item.label}:</span>
                        <span style={{ fontSize: "0.78rem", color: "#3D2228" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 rounded-full"
              style={{ border: "1px solid #F0DDD5", backgroundColor: "transparent", color: step === 1 ? "#D0C0C4" : "#6B4C55", cursor: step === 1 ? "not-allowed" : "pointer", fontSize: "0.85rem" }}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={() => step === totalSteps ? setSubmitted(true) : setStep(step + 1)}
              className="flex items-center gap-2 px-8 py-3 rounded-full"
              style={{ backgroundColor: "#C17B8A", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem", letterSpacing: "0.08em" }}
            >
              {step === totalSteps ? "Submit Request" : "Continue"} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
