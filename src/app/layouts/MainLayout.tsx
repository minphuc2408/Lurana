import { useLocale, LanguageSwitcher } from "@/shared/i18n";
import { useMainLayout } from "./hooks/useMainLayout";
import { cn } from "@/shared/lib/utils";
import { Outlet, Link } from "react-router";
import { ShoppingBag, User, Menu, X, Flower, ChevronDown, LogOut } from "lucide-react";
import { StorefrontFooter } from "./components/StorefrontFooter";
import { ZaloContact } from "./components/ZaloContact";
export function MainLayout() {
  const { t } = useLocale("common");
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
              <Flower size={24} className="hidden min-[360px]:block text-lunara-rose-strong" />
              <span className="font-display [font-size:1.5rem] sm:[font-size:1.8rem] [font-weight:600] text-lunara-ink [letter-spacing:0.08em]">
                lunara
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-4">
            {navLinks.map(link => <Link key={link.to} to={link.to} className={cn("[text-decoration:none] [font-size:0.85rem] [letter-spacing:0.12em] [text-transform:uppercase] [padding-bottom:2px] [transition:all_0.2s_ease]", isActive(link.to) ? "text-lunara-rose-strong" : "text-lunara-body", isActive(link.to) ? "[font-weight:500]" : "[font-weight:400]", isActive(link.to) ? "[border-bottom:1px_solid_#C17B8A]" : "[border-bottom:1px_solid_transparent]")}>
                {t(link.label)}
              </Link>)}

            {/* Admin Dropdown — only for admin users */}
            {user?.role === "admin" && <div className="relative">
                <button onClick={() => setAdminOpen(!adminOpen)} className={cn("flex items-center gap-1 [font-size:0.85rem] [letter-spacing:0.12em] [text-transform:uppercase] bg-transparent [border:none] [cursor:pointer] [padding:0]", location.pathname.startsWith("/admin") ? "text-lunara-rose-strong" : "text-lunara-body", location.pathname.startsWith("/admin") ? "[font-weight:500]" : "[font-weight:400]")}>
                  {t("Admin")}{" "}<ChevronDown size={14} />
                </button>
                {adminOpen && <div className="absolute top-8 right-0 w-44 rounded-xl shadow-lg overflow-hidden z-50 bg-lunara-cream [border:1px_solid_#F0DDD5]">
                    <Link to="/admin/dashboard" onClick={() => setAdminOpen(false)} className="block px-4 py-3 [text-decoration:none] [font-size:0.85rem] text-lunara-body [letter-spacing:0.05em]">
                      {t("Dashboard")}</Link>
                    <Link to="/admin/stock" onClick={() => setAdminOpen(false)} className="block px-4 py-3 [text-decoration:none] [font-size:0.85rem] text-lunara-body [letter-spacing:0.05em]">
                      {t("Stock Management")}</Link>
                  </div>}
              </div>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/cart" className="relative text-lunara-body" aria-label={t("Cart, items: {{count}}", { count: itemCount })}>
              <ShoppingBag size={22} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white bg-lunara-rose-strong [font-size:0.6rem] [font-weight:600]">{itemCount}</span>
            </Link>
            <Link to="/profile" className="text-lunara-body" aria-label={t("Profile")}>
              <User size={22} />
            </Link>

            {/* Logged-in: show user greeting + sign out; Guest: show Sign In */}
            {user ? <div className="hidden lg:flex items-center gap-3">
                <span className="[font-size:0.78rem] text-lunara-body [letter-spacing:0.05em]">
                  {t("Hi,")}{" "}<strong className="text-lunara-ink">{user.name.split(" ")[0]}</strong>
                  {user.role === "admin" && <span className="[margin-left:6px] bg-lunara-rose-strong text-white [font-size:0.65rem] [padding:1px_7px] [border-radius:999px] [letter-spacing:0.08em] [text-transform:uppercase] [vertical-align:middle]">
                      {t("admin")}</span>}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-1 px-4 py-2 rounded-full bg-transparent [border:1px_solid_#C17B8A] text-lunara-rose-strong [cursor:pointer] [font-size:0.78rem] [letter-spacing:0.08em]">
                  <LogOut size={13} />
                  {t("Sign Out")}</button>
              </div> : <Link to="/login" className="hidden lg:block px-4 py-2 rounded-full bg-lunara-rose-strong text-white [text-decoration:none] [font-size:0.78rem] [letter-spacing:0.08em]">
                {t("Sign In")}</Link>}

            <button onClick={() => setMenuOpen(!menuOpen)} aria-label={t(menuOpen ? "Close" : "Open menu")} aria-expanded={menuOpen} className="lg:hidden bg-transparent [border:none] [cursor:pointer] text-lunara-body">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && <div className="lg:hidden px-6 pb-4 flex flex-col gap-4 [border-top:1px_solid_#F0DDD5]">
            {navLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className={cn("[text-decoration:none] [font-size:0.9rem] [letter-spacing:0.1em] [text-transform:uppercase] [padding-top:8px]", isActive(link.to) ? "text-lunara-rose-strong" : "text-lunara-body")}>
                {t(link.label)}
              </Link>)}

            {/* Admin mobile links — only for admin */}
            {user?.role === "admin" && <>
                <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className="[text-decoration:none] [font-size:0.9rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase]">
                  {t("Admin Dashboard")}</Link>
                <Link to="/admin/stock" onClick={() => setMenuOpen(false)} className="[text-decoration:none] [font-size:0.9rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase]">
                  {t("Stock Management")}</Link>
              </>}

            {/* Mobile auth */}
            {user ? <button onClick={handleLogout} className="[text-align:left] bg-transparent [border:none] [cursor:pointer] [font-size:0.9rem] text-lunara-rose-strong [letter-spacing:0.1em] [text-transform:uppercase] [padding-top:4px]">
                {t("Sign Out")}</button> : <Link to="/login" onClick={() => setMenuOpen(false)} className="[text-decoration:none] [font-size:0.9rem] text-lunara-rose-strong [letter-spacing:0.1em] [text-transform:uppercase]">
                {t("Sign In")}</Link>}
          </div>}
      </nav>

      <Outlet />

      <StorefrontFooter />
      <ZaloContact />
    </div>;
}
