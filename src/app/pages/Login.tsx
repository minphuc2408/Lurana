import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Flower, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const bgImage =
  "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=1080";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const result = login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Invalid credentials.");
      return;
    }

    // Redirect admin to dashboard, regular users to home
    if (result.user?.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", minHeight: "100vh", display: "flex" }}>
      {/* Left: Form */}
      <div
        className="flex-1 flex flex-col justify-center items-center px-8 py-12"
        style={{ backgroundColor: "#FDF6F0", maxWidth: "540px", margin: "0 auto" }}
      >
        {/* Back to Home */}
        <div className="w-full mb-6" style={{ maxWidth: "420px" }}>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5"
            style={{ textDecoration: "none", fontSize: "0.8rem", color: "#9A7080", letterSpacing: "0.05em" }}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2" style={{ textDecoration: "none" }}>
            <Flower size={28} style={{ color: "#C17B8A" }} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.2rem",
                fontWeight: 600,
                color: "#3D2228",
                letterSpacing: "0.1em",
              }}
            >
              lunara
            </span>
          </Link>
          <p style={{ color: "#9A7080", fontSize: "0.85rem", marginTop: "6px" }}>
            Where every bloom tells a story
          </p>
        </div>

        <div
          className="w-full rounded-3xl p-8 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid #F0DDD5", maxWidth: "420px" }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.8rem",
              fontWeight: 600,
              color: "#3D2228",
              marginBottom: "6px",
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#9A7080", marginBottom: "28px" }}>
            Sign in to your Lunara account
          </p>

          <form onSubmit={handleSignIn} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  color: "#6B4C55",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3"
                style={{
                  border: "1px solid #F0DDD5",
                  fontSize: "0.88rem",
                  color: "#3D2228",
                  outline: "none",
                  backgroundColor: "#FDFBF9",
                  transition: "border-color 0.2s",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.78rem",
                  color: "#6B4C55",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-12"
                  style={{
                    border: "1px solid #F0DDD5",
                    fontSize: "0.88rem",
                    color: "#3D2228",
                    outline: "none",
                    backgroundColor: "#FDFBF9",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute",
                    right: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9A7080",
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  backgroundColor: "#FFF0F2",
                  border: "1px solid #F0C0C8",
                  fontSize: "0.82rem",
                  color: "#B05060",
                }}
              >
                {error}
              </div>
            )}

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: "#C17B8A" }}
                />
                <span style={{ fontSize: "0.82rem", color: "#6B4C55" }}>Remember me</span>
              </label>
              <a href="#" style={{ fontSize: "0.82rem", color: "#C17B8A", textDecoration: "none" }}>
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full text-center mt-2"
              style={{
                backgroundColor: loading ? "#D4A0AC" : "#C17B8A",
                color: "white",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.88rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500,
                transition: "background-color 0.2s",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div style={{ flex: 1, height: "1px", backgroundColor: "#F0DDD5" }} />
              <span style={{ fontSize: "0.75rem", color: "#C0A0A8" }}>or continue with</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "#F0DDD5" }} />
            </div>

            {/* Social buttons */}
            <div className="flex gap-3">
              {["Google", "Facebook"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2"
                  style={{
                    border: "1px solid #F0DDD5",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: "#6B4C55",
                  }}
                >
                  {s === "Google" ? "🇬" : "𝒇"} {s}
                </button>
              ))}
            </div>
          </form>

          <p style={{ textAlign: "center", fontSize: "0.82rem", color: "#9A7080", marginTop: "24px" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "#C17B8A", textDecoration: "none", fontWeight: 500 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Image Panel */}
      <div
        className="hidden md:flex flex-1 relative items-end"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 30%, rgba(61,34,40,0.8))",
          }}
        />
        <div className="relative z-10 p-12">
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "1.8rem",
              color: "white",
              fontStyle: "italic",
              lineHeight: 1.4,
              maxWidth: "340px",
            }}
          >
            "Flowers are the music of the ground, from earth's lips spoken without sound."
          </p>
          <p style={{ color: "#D4A0AC", fontSize: "0.82rem", marginTop: "12px" }}>— Edwin Curran</p>
        </div>
      </div>
    </div>
  );
}