import { useMainLayout } from "./hooks/useMainLayout";
import { cn } from "@/shared/lib/utils";
import { Outlet, Link } from "react-router";
import { ShoppingBag, User, Menu, X, Flower, ChevronDown, LogOut } from "lucide-react";
export function MainLayout() {
  const {
    itemCount,
    menuOpen,
    setMenuOpen,
    adminOpen,
    setAdminOpen,
    location,
    navigate,
    user,
    logout,
    navLinks,
    isActive,
    handleLogout
  } = useMainLayout();
  return <div className="font-body bg-lunara-cream [min-height:100vh]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[rgba(253,246,240,0.95)] [border-bottom:1px_solid_#F0DDD5] [backdrop-filter:blur(8px)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 [text-decoration:none]">
            <div className="flex items-center gap-2">
              <Flower size={24} className="text-lunara-rose-strong" />
              <span className="font-display [font-size:1.8rem] [font-weight:600] text-lunara-ink [letter-spacing:0.08em]">
                lunara
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => <Link key={link.to} to={link.to} className={cn("[text-decoration:none] [font-size:0.85rem] [letter-spacing:0.12em] [text-transform:uppercase] [padding-bottom:2px] [transition:all_0.2s_ease]", isActive(link.to) ? "text-lunara-rose-strong" : "text-lunara-body", isActive(link.to) ? "[font-weight:500]" : "[font-weight:400]", isActive(link.to) ? "[border-bottom:1px_solid_#C17B8A]" : "[border-bottom:1px_solid_transparent]")}>
                {link.label}
              </Link>)}

            {/* Admin Dropdown — only for admin users */}
            {user?.role === "admin" && <div className="relative">
                <button onClick={() => setAdminOpen(!adminOpen)} className={cn("flex items-center gap-1 [font-size:0.85rem] [letter-spacing:0.12em] [text-transform:uppercase] bg-transparent [border:none] [cursor:pointer] [padding:0]", location.pathname.startsWith("/admin") ? "text-lunara-rose-strong" : "text-lunara-body", location.pathname.startsWith("/admin") ? "[font-weight:500]" : "[font-weight:400]")}>
                  Admin <ChevronDown size={14} />
                </button>
                {adminOpen && <div className="absolute top-8 right-0 w-44 rounded-xl shadow-lg overflow-hidden z-50 bg-lunara-cream [border:1px_solid_#F0DDD5]">
                    <Link to="/admin/dashboard" onClick={() => setAdminOpen(false)} className="block px-4 py-3 [text-decoration:none] [font-size:0.85rem] text-lunara-body [letter-spacing:0.05em]">
                      Dashboard
                    </Link>
                    <Link to="/admin/stock" onClick={() => setAdminOpen(false)} className="block px-4 py-3 [text-decoration:none] [font-size:0.85rem] text-lunara-body [letter-spacing:0.05em]">
                      Stock Management
                    </Link>
                  </div>}
              </div>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative text-lunara-body" aria-label={"Cart, items: " + itemCount}>
              <ShoppingBag size={22} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white bg-lunara-rose-strong [font-size:0.6rem] [font-weight:600]">{itemCount}</span>
            </Link>
            <Link to="/profile" className="text-lunara-body" aria-label="Profile">
              <User size={22} />
            </Link>

            {/* Logged-in: show user greeting + sign out; Guest: show Sign In */}
            {user ? <div className="hidden md:flex items-center gap-3">
                <span className="[font-size:0.78rem] text-lunara-body [letter-spacing:0.05em]">
                  Hi, <strong className="text-lunara-ink">{user.name.split(" ")[0]}</strong>
                  {user.role === "admin" && <span className="[margin-left:6px] bg-lunara-rose-strong text-white [font-size:0.65rem] [padding:1px_7px] [border-radius:999px] [letter-spacing:0.08em] [text-transform:uppercase] [vertical-align:middle]">
                      admin
                    </span>}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-1 px-4 py-2 rounded-full bg-transparent [border:1px_solid_#C17B8A] text-lunara-rose-strong [cursor:pointer] [font-size:0.78rem] [letter-spacing:0.08em]">
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div> : <Link to="/login" className="hidden md:block px-4 py-2 rounded-full bg-lunara-rose-strong text-white [text-decoration:none] [font-size:0.78rem] [letter-spacing:0.08em]">
                Sign In
              </Link>}

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden bg-transparent [border:none] [cursor:pointer] text-lunara-body">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && <div className="md:hidden px-6 pb-4 flex flex-col gap-4 [border-top:1px_solid_#F0DDD5]">
            {navLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className={cn("[text-decoration:none] [font-size:0.9rem] [letter-spacing:0.1em] [text-transform:uppercase] [padding-top:8px]", isActive(link.to) ? "text-lunara-rose-strong" : "text-lunara-body")}>
                {link.label}
              </Link>)}

            {/* Admin mobile links — only for admin */}
            {user?.role === "admin" && <>
                <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="[text-decoration:none] [font-size:0.9rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase]">
                  Admin Dashboard
                </Link>
                <Link to="/admin/stock" onClick={() => setMenuOpen(false)} className="[text-decoration:none] [font-size:0.9rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase]">
                  Stock Management
                </Link>
              </>}

            {/* Mobile auth */}
            {user ? <button onClick={handleLogout} className="[text-align:left] bg-transparent [border:none] [cursor:pointer] [font-size:0.9rem] text-lunara-rose-strong [letter-spacing:0.1em] [text-transform:uppercase] [padding-top:4px]">
                Sign Out
              </button> : <Link to="/login" onClick={() => setMenuOpen(false)} className="[text-decoration:none] [font-size:0.9rem] text-lunara-rose-strong [letter-spacing:0.1em] [text-transform:uppercase]">
                Sign In
              </Link>}
          </div>}
      </nav>

      <Outlet />

      {/* Footer */}
      <footer className="mt-24 bg-lunara-ink text-[#F5DDD5]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Flower size={20} className="text-lunara-rose-light" />
              <span className="font-display [font-size:1.6rem] [font-weight:600] [letter-spacing:0.1em] text-[#F5DDD5]">
                lunara
              </span>
            </div>
            <p className="[font-size:0.88rem] [line-height:1.8] text-lunara-body [max-width:300px]">
              Crafting nature's most beautiful moments into timeless floral arrangements. Bringing joy,
              one bloom at a time.
            </p>
          </div>
          <div>
            <h4 className="font-display [font-size:1rem] [letter-spacing:0.15em] [text-transform:uppercase] text-[#F5DDD5] [margin-bottom:16px]">
              Shop
            </h4>
            <div className="flex flex-col gap-2">
              {["Bouquets", "Arrangements", "Dried Flowers", "Gift Sets"].map(item => <a key={item} href="#" className="[text-decoration:none] [font-size:0.85rem] text-lunara-body [letter-spacing:0.05em]">
                  {item}
                </a>)}
            </div>
          </div>
          <div>
            <h4 className="font-display [font-size:1rem] [letter-spacing:0.15em] [text-transform:uppercase] text-[#F5DDD5] [margin-bottom:16px]">
              Connect
            </h4>
            <div className="flex flex-col gap-2">
              {["Instagram", "Facebook", "Pinterest", "Contact Us"].map(item => <a key={item} href="#" className="[text-decoration:none] [font-size:0.85rem] text-lunara-body [letter-spacing:0.05em]">
                  {item}
                </a>)}
            </div>
          </div>
        </div>
        <div className="[border-top:1px_solid_#5A3540] [padding:16px_24px] [text-align:center] [font-size:0.78rem] text-[#8A6070]">
          © 2026 Lunara Flower Shop. All rights reserved. Made with love & flowers.
        </div>
      </footer>
    </div>;
}
