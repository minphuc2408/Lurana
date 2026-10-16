import { useLocale, LanguageSwitcher } from '@/shared/i18n';
import { useMainLayout } from './hooks/useMainLayout';
import { cn } from '@/shared/lib/utils';
import { Outlet, Link, Form } from 'react-router';
import { ShoppingBag, Menu, X, Flower, Search } from 'lucide-react';
import { StorefrontFooter } from './components/StorefrontFooter';
import { ZaloContact } from './components/ZaloContact';
export function MainLayout() {
  const { t } = useLocale("common");
  const { searchQuery, itemCount, menuOpen, setMenuOpen, navLinks, isActive } = useMainLayout();
  return <div className="min-h-screen bg-lunara-cream font-body" data-d1-storefront>
    <nav className="sticky top-0 z-50 border-b border-lunara-border bg-lunara-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2 no-underline"><Flower size={24} className="hidden text-lunara-rose-strong min-[360px]:block" /><span data-storefront-logo className="font-display text-2xl font-semibold tracking-wider text-lunara-ink sm:text-3xl">{t('Lunara Shop')}</span></Link>
        <div className="hidden items-center gap-6 lg:flex">{navLinks.map(link => <Link key={link.to} to={link.to} className={cn('text-sm font-medium', isActive(link.to) ? 'font-medium text-lunara-rose-strong underline underline-offset-8' : 'text-lunara-body')}>{t(link.label)}</Link>)}</div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Form role="search" action="/shop" method="get" className="relative hidden xl:block">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-lunara-body" />
            <input key={searchQuery} name="q" defaultValue={searchQuery} aria-label={t('Search flowers')} placeholder={t('Search flowers...')} className="min-h-11 w-48 rounded-full border border-lunara-border bg-lunara-blush/50 py-2 pr-4 pl-10 text-xs text-lunara-ink placeholder:text-lunara-body" />
          </Form>
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
