import { Link } from "react-router";
import { ArrowRight, Star, Truck, RefreshCw, Heart } from "lucide-react";

const heroImage = "https://images.unsplash.com/photo-1769867296317-bb70cd68b565?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb3NlJTIwZ2FyZGVuJTIwcm9tYW50aWMlMjBwaW5rJTIwYWVzdGhldGljJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NzM1NTI5NjV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=1080";
const shopImage = "https://images.unsplash.com/photo-1758262616385-58fb145e16eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG93ZXIlMjBzaG9wJTIwYm90YW5pY2FsJTIwYXJyYW5nZW1lbnQlMjB3aGl0ZXxlbnwxfHx8fDE3NzM1NTI5NTd8MA&ixlib=rb-4.1.0&q=80&w=1080";
const sunflowerImage = "https://images.unsplash.com/photo-1770704516784-ef5f1eaf0c06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBkYWlzeSUyMGJyaWdodCUyMHllbGxvdyUyMHNwcmluZ3xlbnwxfHx8fDE3NzM1NTI5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const lavenderImage = "https://images.unsplash.com/photo-1653821355168-144695e5c0e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXZlbmRlciUyMHB1cnBsZSUyMGZsb3JhbCUyMGVsZWdhbnQlMjB3ZWRkaW5nfGVufDF8fHx8MTc3MzU1Mjk2MXww&ixlib=rb-4.1.0&q=80&w=1080";
const lilyImage = "https://images.unsplash.com/photo-1766050917257-27675ab4e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGxpbHklMjBmbG93ZXIlMjBtaW5pbWFsaXN0JTIwY2xlYW58ZW58MXx8fHwxNzczNTUyOTYxfDA&ixlib=rb-4.1.0&q=80&w=1080";

const featuredProducts = [
  { id: 1, name: "Blush Peony Bouquet", price: "₱1,200", image: peonyImage, tag: "Bestseller" },
  { id: 2, name: "Sunshine Daisy Mix", price: "₱850", image: sunflowerImage, tag: "New" },
  { id: 3, name: "Lavender Dreams", price: "₱950", image: lavenderImage, tag: "Popular" },
  { id: 4, name: "White Lily Elegance", price: "₱1,100", image: lilyImage, tag: "" },
];

const testimonials = [
  { name: "Sofia M.", review: "The most beautiful arrangement I've ever received. Lunara truly understands what flowers should feel like.", stars: 5 },
  { name: "Isabella R.", review: "My wedding was absolutely perfect. The florals exceeded every expectation I had!", stars: 5 },
  { name: "Andrea T.", review: "Fast delivery and the flowers stayed fresh for over two weeks. Will always come back!", stars: 5 },
];

export function Landing() {
  return (
    <div style={{ fontFamily: "'Jost', sans-serif" }}>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: "90vh", backgroundColor: "#FDF6F0" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12">
          {/* Text */}
          <div className="flex-1 z-10">
            <span style={{ fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C17B8A", fontWeight: 500 }}>
              ✦ Premium Floral Studio
            </span>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(3rem, 6vw, 5.5rem)", fontWeight: 600, lineHeight: 1.1, color: "#3D2228", marginTop: "16px", marginBottom: "24px" }}>
              Where Flowers<br />
              <span style={{ fontStyle: "italic", color: "#C17B8A" }}>Tell Your Story</span>
            </h1>
            <p style={{ fontSize: "1rem", lineHeight: "1.8", color: "#6B4C55", maxWidth: "440px", marginBottom: "40px" }}>
              Handcrafted with love and intention, each arrangement at Lunara is a living work of art designed to express what words cannot.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="flex items-center gap-2 px-8 py-4 rounded-full"
                style={{ backgroundColor: "#C17B8A", color: "white", textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, transition: "all 0.2s ease" }}
              >
                Explore Collection <ArrowRight size={16} />
              </Link>
              <Link
                to="/request"
                className="flex items-center gap-2 px-8 py-4 rounded-full"
                style={{ border: "1px solid #C17B8A", color: "#C17B8A", textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}
              >
                Custom Order
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-10 mt-14">
              {[{ num: "500+", label: "Bouquets Delivered" }, { num: "200+", label: "Happy Clients" }, { num: "5★", label: "Average Rating" }].map((s) => (
                <div key={s.num}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "#3D2228" }}>{s.num}</div>
                  <div style={{ fontSize: "0.75rem", color: "#9A7080", letterSpacing: "0.1em", textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 relative flex justify-center">
            <div
              className="rounded-3xl overflow-hidden shadow-2xl"
              style={{ width: "min(480px, 100%)", aspectRatio: "3/4", position: "relative" }}
            >
              <img
                src={heroImage}
                alt="Beautiful roses"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(61,34,40,0.3))" }} />
            </div>

            {/* Floating badge */}
            <div
              className="absolute top-8 -left-4 rounded-2xl px-5 py-3 shadow-lg"
              style={{ backgroundColor: "white", border: "1px solid #F0DDD5" }}
            >
              <div style={{ fontSize: "0.7rem", color: "#9A7080", letterSpacing: "0.1em", textTransform: "uppercase" }}>Fresh Today</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#3D2228", fontWeight: 500 }}>Spring Collection</div>
            </div>

            {/* Floating heart */}
            <div
              className="absolute bottom-12 -right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: "#C17B8A" }}
            >
              <Heart size={18} color="white" fill="white" />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div style={{ position: "absolute", top: "10%", right: "5%", width: "300px", height: "300px", borderRadius: "50%", backgroundColor: "#F8D7E0", opacity: 0.3, filter: "blur(60px)", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: "200px", height: "200px", borderRadius: "50%", backgroundColor: "#D4B896", opacity: 0.2, filter: "blur(50px)", zIndex: 0 }} />
      </section>

      {/* Features Bar */}
      <section style={{ backgroundColor: "#F5E8E4", padding: "20px 0" }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-10">
          {[
            { icon: <Truck size={18} />, text: "Same-Day Delivery Available" },
            { icon: <RefreshCw size={18} />, text: "7-Day Freshness Guarantee" },
            { icon: <Heart size={18} />, text: "Handcrafted with Love" },
            { icon: <Star size={18} />, text: "Premium Seasonal Blooms" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-2">
              <span style={{ color: "#C17B8A" }}>{f.icon}</span>
              <span style={{ fontSize: "0.82rem", letterSpacing: "0.08em", color: "#6B4C55" }}>{f.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C17B8A" }}>Our Selection</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, color: "#3D2228", marginTop: "8px" }}>
            Featured Arrangements
          </h2>
          <div style={{ width: "60px", height: "2px", backgroundColor: "#C17B8A", margin: "16px auto 0" }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              to="/shop"
              style={{ textDecoration: "none" }}
              className="group"
            >
              <div className="rounded-2xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ backgroundColor: "white" }}>
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
                      style={{ backgroundColor: "#C17B8A", color: "white", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
                    >
                      {product.tag}
                    </span>
                  )}
                  <button
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: "white", border: "none", cursor: "pointer" }}
                  >
                    <Heart size={14} style={{ color: "#C17B8A" }} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#3D2228", marginBottom: "4px", fontWeight: 500 }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: "0.9rem", color: "#C17B8A", fontWeight: 500 }}>{product.price}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/shop"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#C17B8A", borderBottom: "1px solid #C17B8A", paddingBottom: "2px" }}
          >
            View All Products <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* About / Story Section */}
      <section style={{ backgroundColor: "#F9EDE9", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img
              src={shopImage}
              alt="Our shop"
              className="rounded-3xl shadow-xl"
              style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }}
            />
            <div
              className="absolute -bottom-6 -right-6 rounded-2xl p-6 shadow-lg hidden md:block"
              style={{ backgroundColor: "#3D2228", color: "white", maxWidth: "200px" }}
            >
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.5rem", fontWeight: 600, color: "#D4A0AC" }}>5+</div>
              <div style={{ fontSize: "0.78rem", color: "#C0A0A8", letterSpacing: "0.08em" }}>Years of floral artistry & passion</div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C17B8A" }}>Our Story</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 600, color: "#3D2228", margin: "12px 0 20px", lineHeight: 1.2 }}>
              Blooms Crafted with<br />
              <span style={{ fontStyle: "italic" }}>Intention & Soul</span>
            </h2>
            <p style={{ fontSize: "0.92rem", lineHeight: "1.9", color: "#6B4C55", marginBottom: "16px" }}>
              Lunara was born from a deep love of nature's most fleeting gifts — flowers that bloom, dazzle, and teach us to cherish beauty in the moment. Every arrangement we create is a story, a feeling, a memory made tangible.
            </p>
            <p style={{ fontSize: "0.92rem", lineHeight: "1.9", color: "#6B4C55", marginBottom: "32px" }}>
              We source only the finest seasonal blooms, working with local growers to ensure freshness and sustainability in every single arrangement.
            </p>
            <Link
              to="/request"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full"
              style={{ backgroundColor: "#3D2228", color: "white", textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              Request Custom Order <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#C17B8A" }}>Kind Words</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 600, color: "#3D2228", marginTop: "8px" }}>
            What Our Clients Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-2xl p-8" style={{ backgroundColor: "white", border: "1px solid #F0DDD5", boxShadow: "0 4px 20px rgba(193,123,138,0.08)" }}>
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={14} fill="#C17B8A" color="#C17B8A" />
                ))}
              </div>
              <p style={{ fontSize: "0.9rem", lineHeight: "1.8", color: "#6B4C55", fontStyle: "italic", marginBottom: "20px" }}>
                "{t.review}"
              </p>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", fontWeight: 600, color: "#3D2228" }}>— {t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-6 mb-8 rounded-3xl overflow-hidden relative" style={{ backgroundColor: "#3D2228", minHeight: "300px" }}>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-20">
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#D4A0AC", marginBottom: "16px", display: "block" }}>Limited Time</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 600, color: "white", marginBottom: "16px" }}>
            Spring Collection Now Available
          </h2>
          <p style={{ color: "#C0A0A8", fontSize: "0.95rem", maxWidth: "500px", marginBottom: "32px", lineHeight: 1.7 }}>
            Celebrate the season with our curated spring arrangements featuring the freshest peonies, tulips, and wildflowers.
          </p>
          <Link
            to="/shop"
            className="px-10 py-4 rounded-full"
            style={{ backgroundColor: "#C17B8A", color: "white", textDecoration: "none", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 500 }}
          >
            Shop Spring Collection
          </Link>
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15 }} />
      </section>
    </div>
  );
}
