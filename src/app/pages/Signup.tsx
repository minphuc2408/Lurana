import { useState } from "react";
import { Link } from "react-router";
import { Eye, EyeOff, Flower, Check, ArrowLeft } from "lucide-react";

const bgImage = "https://images.unsplash.com/photo-1769867296317-bb70cd68b565?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb3NlJTIwZ2FyZGVuJTIwcm9tYW50aWMlMjBwaW5rJTIwYWVzdGhldGljJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NzM1NTI5NjV8MA&ixlib=rb-4.1.0&q=80&w=1080";

export function Signup() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "", agree: false });
  const [submitted, setSubmitted] = useState(false);

  const passwordStrength = (p: string) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  };
  const strength = passwordStrength(form.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#E8453C", "#F5A623", "#7A9E7E", "#3D9970"];

  if (submitted) {
    return (
      <div style={{ fontFamily: "'Jost', sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FDF6F0" }}>
        <div className="text-center px-8 py-12 rounded-3xl shadow-sm mx-4" style={{ backgroundColor: "white", maxWidth: "440px", border: "1px solid #F0DDD5" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#F9EDE9" }}>
            <Check size={28} style={{ color: "#C17B8A" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "#3D2228", marginBottom: "10px" }}>
            Welcome to Lunara!
          </h2>
          <p style={{ color: "#6B4C55", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "28px" }}>
            Your account has been created, <strong>{form.firstName}</strong>. Start exploring our beautiful flower collections.
          </p>
          <Link to="/login" className="block py-3 rounded-full" style={{ backgroundColor: "#C17B8A", color: "white", textDecoration: "none", fontSize: "0.85rem" }}>
            Sign In to Your Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", minHeight: "100vh", display: "flex" }}>
      {/* Left: Image */}
      <div
        className="hidden md:flex flex-1 relative items-end"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(61,34,40,0.8))" }} />
        <div className="relative z-10 p-12">
          <div className="flex items-center gap-2 mb-6">
            <Flower size={22} style={{ color: "#D4A0AC" }} />
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 600, color: "white", letterSpacing: "0.1em" }}>lunara</span>
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.7rem", color: "white", fontStyle: "italic", lineHeight: 1.4, maxWidth: "340px" }}>
            "Join our community of flower lovers and bring nature's beauty into every moment."
          </p>
          <div className="flex flex-col gap-2 mt-8">
            {["Free account creation", "Exclusive member discounts", "Early access to seasonal collections", "Custom order tracking"].map((b) => (
              <div key={b} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "#C17B8A" }}>
                  <Check size={11} color="white" />
                </div>
                <span style={{ fontSize: "0.82rem", color: "#D4A0AC" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12" style={{ backgroundColor: "#FDF6F0", maxWidth: "580px", margin: "0 auto" }}>
        {/* Back to Home */}
        <div className="w-full mb-4" style={{ maxWidth: "460px" }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5"
            style={{ textDecoration: "none", fontSize: "0.8rem", color: "#9A7080", letterSpacing: "0.05em" }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2" style={{ textDecoration: "none" }}>
            <Flower size={24} style={{ color: "#C17B8A" }} />
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", fontWeight: 600, color: "#3D2228", letterSpacing: "0.1em" }}>lunara</span>
          </Link>
        </div>

        <div className="w-full rounded-3xl p-8 shadow-sm" style={{ backgroundColor: "white", border: "1px solid #F0DDD5", maxWidth: "460px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 600, color: "#3D2228", marginBottom: "6px" }}>
            Create an account
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#9A7080", marginBottom: "28px" }}>Join the Lunara family today</p>

          <div className="flex flex-col gap-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>First Name</label>
                <input
                  type="text"
                  placeholder="Maria"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Last Name</label>
                <input
                  type="text"
                  placeholder="Santos"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl px-4 py-3"
                style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 pr-12"
                  style={{ border: "1px solid #F0DDD5", fontSize: "0.88rem", color: "#3D2228", outline: "none", backgroundColor: "#FDFBF9" }}
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9A7080" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all"
                        style={{ backgroundColor: i <= strength ? strengthColors[strength] : "#F0DDD5" }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.72rem", color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#6B4C55", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 pr-12"
                  style={{
                    border: `1px solid ${form.confirm && form.confirm !== form.password ? "#E8453C" : "#F0DDD5"}`,
                    fontSize: "0.88rem",
                    color: "#3D2228",
                    outline: "none",
                    backgroundColor: "#FDFBF9"
                  }}
                />
                <button
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9A7080" }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p style={{ fontSize: "0.75rem", color: "#E8453C", marginTop: "4px" }}>Passwords don't match</p>
              )}
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agree}
                onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                style={{ accentColor: "#C17B8A", marginTop: "2px" }}
              />
              <span style={{ fontSize: "0.8rem", color: "#6B4C55", lineHeight: 1.5 }}>
                I agree to the{" "}
                <a href="#" style={{ color: "#C17B8A", textDecoration: "none" }}>Terms of Service</a>{" "}
                and{" "}
                <a href="#" style={{ color: "#C17B8A", textDecoration: "none" }}>Privacy Policy</a>
              </span>
            </label>

            <button
              onClick={() => form.agree && setSubmitted(true)}
              className="w-full py-4 rounded-full mt-2"
              style={{
                backgroundColor: form.agree ? "#C17B8A" : "#F0DDD5",
                color: form.agree ? "white" : "#C0A0A8",
                border: "none",
                cursor: form.agree ? "pointer" : "not-allowed",
                fontSize: "0.88rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500
              }}
            >
              Create Account
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#9A7080", marginTop: "20px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#C17B8A", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}