import { useLocale, LanguageSwitcher } from '@/shared/i18n';
import { useMainLayout } from './hooks/useMainLayout';
import { cn } from '@/shared/lib/utils';
import { Outlet, Link } from 'react-router';
import { ShoppingBag, Menu, X, Search } from 'lucide-react';
import { StorefrontFooter } from './components/StorefrontFooter';
import { ZaloContact } from './components/ZaloContact';
import { ThemeSwitcher } from './components/ThemeSwitcher';
export function MainLayout() {
  const { t } = useLocale("common");
  const { searchOpen, searchTerm, setSearchTerm, searchInputRef, searchButtonRef, openSearch, closeSearch, submitSearch,
    itemCount, menuOpen, toggleMenu, setMenuOpen, navLinks, isActive, theme, setTheme } = useMainLayout();
  return <div className="min-h-screen bg-lunara-cream font-body" data-d1-storefront>
    <header data-storefront-header className="sticky top-0 z-50 h-[72px] border-b border-lunara-border bg-lunara-cream sm:h-20">
      <div className="relative mx-auto flex h-full max-w-[1240px] items-center justify-between gap-1 px-5 sm:gap-3 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2 no-underline"><span data-storefront-logo className="font-display text-2xl font-normal leading-none tracking-tight text-lunara-ink sm:text-[26px]">{t('Lunara Shop')}</span></Link>
        <nav aria-label={t('Main navigation')} data-main-navigation className="hidden items-center gap-8 lg:flex">{navLinks.map(link => <Link key={link.to} to={link.to} className={cn('text-sm font-medium', isActive(link.to) ? 'font-medium text-lunara-rose-strong underline underline-offset-8' : 'text-lunara-body')}>{t(link.label)}</Link>)}</nav>
        <div className="flex shrink-0 items-center gap-0 sm:gap-6">
          <button ref={searchButtonRef} type="button" data-header-search-toggle aria-label={t(searchOpen ? 'Close search' : 'Search')} aria-expanded={searchOpen} aria-controls="header-search" onClick={searchOpen ? closeSearch : openSearch} className={cn('inline-flex min-h-11 min-w-6 items-center justify-center gap-1.5 text-xs text-lunara-body transition-colors hover:text-lunara-ink', searchOpen && 'xl:hidden')}>
            {searchOpen ? <X size={16} strokeWidth={1.5} aria-hidden="true" /> : <Search size={16} strokeWidth={1.5} aria-hidden="true" />}<span className="hidden lg:inline">{t(searchOpen ? 'Close search' : 'Search')}</span>
          </button>
          {searchOpen && <form id="header-search" role="search" action="/shop" method="get" onSubmit={submitSearch} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); closeSearch(); } }} className="absolute inset-x-0 top-full flex items-center gap-2 border-b border-lunara-border bg-lunara-cream px-5 py-3 sm:px-8 xl:static xl:border-0 xl:bg-transparent xl:p-0">
            <div className="relative min-w-0 flex-1 xl:w-48">
              <input ref={searchInputRef} type="search" name="q" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} aria-label={t('Search flowers')} placeholder={t('Search flowers...')} className="min-h-11 w-full rounded-[2px] border border-lunara-border bg-lunara-surface py-2 pr-11 pl-3 text-base text-lunara-ink placeholder:text-lunara-body sm:text-xs" />
              <button type="submit" aria-label={t('Search')} className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-lunara-body hover:text-lunara-ink"><Search size={16} strokeWidth={1.5} aria-hidden="true" /></button>
            </div>
            <button type="button" aria-label={t('Close search')} onClick={closeSearch} className="inline-flex min-h-11 min-w-6 items-center justify-center text-lunara-body hover:text-lunara-ink"><X size={16} strokeWidth={1.5} aria-hidden="true" /></button>
          </form>}
          <Link to="/cart" data-header-cart aria-label={t('Cart, items: {{count}}', { count: itemCount })} className="inline-flex min-h-11 min-w-6 items-center justify-center gap-1.5 text-xs whitespace-nowrap sm:gap-2 text-lunara-body transition-colors hover:text-lunara-ink"><ShoppingBag size={16} strokeWidth={1.5} aria-hidden="true" /><span className="hidden sm:inline">{t('Cart')}</span>{itemCount > 0 && <span data-header-cart-count className="min-w-4 rounded-full bg-lunara-rose-strong px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">{itemCount}</span>}</Link>
          <button type="button" data-header-menu-toggle aria-label={t(menuOpen ? 'Close' : 'Open menu')} aria-expanded={menuOpen} onClick={toggleMenu} className="inline-flex min-h-11 min-w-6 items-center justify-center text-lunara-ink lg:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <LanguageSwitcher />
          <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
        </div>
      </div>
      {menuOpen && <div className="absolute inset-x-0 top-full flex flex-col gap-4 border-y border-lunara-border bg-lunara-cream px-5 py-5 lg:hidden">{navLinks.map(link => <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)} className="text-sm uppercase tracking-wider text-lunara-ink">{t(link.label)}</Link>)}</div>}
    </header>
    <Outlet /><StorefrontFooter /><ZaloContact />
  </div>;
}
