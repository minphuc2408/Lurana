import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { ShoppingBag, User, Menu, X, Flower, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/request", label: "Custom Orders" },
    { to: "/orders", label: "My Orders" },
  ];

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", backgroundColor: "#FDF6F0", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav
        style={{
          backgroundColor: "rgba(253,246,240,0.95)",
          borderBottom: "1px solid #F0DDD5",
          backdropFilter: "blur(8px)",
        }}
        className="sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div className="flex items-center gap-2">
              <Flower size={24} style={{ color: "#C17B8A" }} />
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.8rem",
                  fontWeight: 600,
                  color: "#3D2228",
                  letterSpacing: "0.08em",
                }}
              >
                lunara
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: isActive(link.to) ? "#C17B8A" : "#6B4C55",
                  fontWeight: isActive(link.to) ? 500 : 400,
                  borderBottom: isActive(link.to) ? "1px solid #C17B8A" : "1px solid transparent",
                  paddingBottom: "2px",
                  transition: "all 0.2s ease",
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin Dropdown — only for admin users */}
            {user?.role === "admin" && (
              <div className="relative">
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className="flex items-center gap-1"
                  style={{
                    fontSize: "0.85rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: location.pathname.startsWith("/admin") ? "#C17B8A" : "#6B4C55",
                    fontWeight: location.pathname.startsWith("/admin") ? 500 : 400,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Admin <ChevronDown size={14} />
                </button>
                {adminOpen && (
                  <div
                    className="absolute top-8 right-0 w-44 rounded-xl shadow-lg overflow-hidden z-50"
                    style={{ backgroundColor: "#FDF6F0", border: "1px solid #F0DDD5" }}
                  >
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setAdminOpen(false)}
                      className="block px-4 py-3"
                      style={{
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        color: "#6B4C55",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/stock"
                      onClick={() => setAdminOpen(false)}
                      className="block px-4 py-3"
                      style={{
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        color: "#6B4C55",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Stock Management
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative" style={{ color: "#6B4C55" }}>
              <ShoppingBag size={22} />
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#C17B8A", fontSize: "0.6rem", fontWeight: 600 }}
              >
                3
              </span>
            </Link>
            <Link to="/profile" style={{ color: "#6B4C55" }}>
              <User size={22} />
            </Link>

            {/* Logged-in: show user greeting + sign out; Guest: show Sign In */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#6B4C55",
                    letterSpacing: "0.05em",
                  }}
                >
                  Hi, <strong style={{ color: "#3D2228" }}>{user.name.split(" ")[0]}</strong>
                  {user.role === "admin" && (
                    <span
                      style={{
                        marginLeft: "6px",
                        backgroundColor: "#C17B8A",
                        color: "white",
                        fontSize: "0.65rem",
                        padding: "1px 7px",
                        borderRadius: "999px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        verticalAlign: "middle",
                      }}
                    >
                      admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #C17B8A",
                    color: "#C17B8A",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:block px-4 py-2 rounded-full"
                style={{
                  backgroundColor: "#C17B8A",
                  color: "white",
                  textDecoration: "none",
                  fontSize: "0.78rem",
                  letterSpacing: "0.08em",
                }}
              >
                Sign In
              </Link>
            )}

            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6B4C55" }}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div
            className="md:hidden px-6 pb-4 flex flex-col gap-4"
            style={{ borderTop: "1px solid #F0DDD5" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isActive(link.to) ? "#C17B8A" : "#6B4C55",
                  paddingTop: "8px",
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin mobile links — only for admin */}
            {user?.role === "admin" && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    color: "#6B4C55",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Admin Dashboard
                </Link>
                <Link
                  to="/admin/stock"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    color: "#6B4C55",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Stock Management
                </Link>
              </>
            )}

            {/* Mobile auth */}
            {user ? (
              <button
                onClick={handleLogout}
                style={{
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#C17B8A",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  paddingTop: "4px",
                }}
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                style={{
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  color: "#C17B8A",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>

      <Outlet />

      {/* Footer */}
      <footer style={{ backgroundColor: "#3D2228", color: "#F5DDD5" }} className="mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Flower size={20} style={{ color: "#D4A0AC" }} />
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  color: "#F5DDD5",
                }}
              >
                lunara
              </span>
            </div>
            <p style={{ fontSize: "0.88rem", lineHeight: "1.8", color: "#C0A0A8", maxWidth: "300px" }}>
              Crafting nature's most beautiful moments into timeless floral arrangements. Bringing joy,
              one bloom at a time.
            </p>
          </div>
          <div>
            <h4
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#F5DDD5",
                marginBottom: "16px",
              }}
            >
              Shop
            </h4>
            <div className="flex flex-col gap-2">
              {["Bouquets", "Arrangements", "Dried Flowers", "Gift Sets"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    color: "#C0A0A8",
                    letterSpacing: "0.05em",
                  }}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#F5DDD5",
                marginBottom: "16px",
              }}
            >
              Connect
            </h4>
            <div className="flex flex-col gap-2">
              {["Instagram", "Facebook", "Pinterest", "Contact Us"].map((item) => (
                <a
                  key={item}
                  href="#"
                  style={{
                    textDecoration: "none",
                    fontSize: "0.85rem",
                    color: "#C0A0A8",
                    letterSpacing: "0.05em",
                  }}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid #5A3540",
            padding: "16px 24px",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "#8A6070",
          }}
        >
          © 2026 Lunara Flower Shop. All rights reserved. Made with love & flowers.
        </div>
      </footer>
    </div>
  );
}