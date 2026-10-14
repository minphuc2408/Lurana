import { useLocale, LanguageSwitcher } from '@/shared/i18n';
import { useMainLayout } from './hooks/useMainLayout';
import { cn } from '@/shared/lib/utils';
import { Outlet, Link } from 'react-router';
import { ShoppingBag, Menu, X, Flower } from 'lucide-react';
import { StorefrontFooter } from './components/StorefrontFooter';
import { ZaloContact } from './components/ZaloContact';
export function MainLayout() {
  const { t } = useLocale("common");
  const { itemCount, menuOpen, setMenuOpen, navLinks, isActive } = useMainLayout();
  return <div className="min-h-screen bg-lunara-cream font-body" data-d1-storefront>
    <nav className="sticky top-0 z-50 border-b border-lunara-border bg-lunara-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-2 no-underline"><Flower size={24} className="hidden text-lunara-rose-strong min-[360px]:block" /><span className="font-display text-2xl font-semibold tracking-wider text-lunara-ink sm:text-3xl">lunara</span></Link>
        <div className="hidden items-center gap-6 lg:flex">{navLinks.map(link => <Link key={link.to} to={link.to} className={cn('text-sm tracking-widest uppercase', isActive(link.to) ? 'font-medium text-lunara-rose-strong underline underline-offset-8' : 'text-lunara-body')}>{t(link.label)}</Link>)}</div>
        <div className="flex items-center gap-4">
          <Link to="/cart" aria-label={t('Cart, items: {{count}}', { count: itemCount })} className="relative text-lunara-body"><ShoppingBag size={22} /><span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lunara-rose-strong text-[10px] text-white">{itemCount}</span></Link>
          <button aria-label={t(menuOpen ? 'Close' : 'Open menu')} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="text-lunara-ink lg:hidden">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          <LanguageSwitcher />
        </div>
      </div>
      {menuOpen && <div className="flex flex-col gap-4 border-t border-lunara-border px-6 py-5 lg:hidden">{navLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-wider text-lunara-ink">{t(link.label)}</Link>)}</div>}
    </nav>
    <Outlet /><StorefrontFooter /><ZaloContact />
  </div>;
}
