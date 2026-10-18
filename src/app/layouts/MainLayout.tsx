import { useLocale, LanguageSwitcher } from '@/shared/i18n';
import { useMainLayout } from './hooks/useMainLayout';
import { Outlet, Link } from 'react-router';
import { FileText, Headphones, Heart, Menu, Phone, Search, ShoppingCart, Truck, X } from 'lucide-react';
import { FeatureUnavailable } from '@/shared/components/FeatureUnavailable';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/shared/ui/dialog';
import { StorefrontFooter } from './components/StorefrontFooter';
import { StorefrontNavigation } from './components/StorefrontNavigation';
import { ZaloContact } from './components/ZaloContact';
import { ThemeSwitcher } from './components/ThemeSwitcher';

const utilityClass = 'inline-flex min-h-8 min-w-8 items-center justify-center gap-1.5 rounded-sm text-[10px] text-lunara-body transition-colors hover:text-lunara-ink sm:text-xs';
const actionClass = 'relative inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 rounded-sm text-lunara-body no-underline transition-colors hover:text-lunara-rose-strong lg:min-w-[84px]';

export function MainLayout() {
  const { t } = useLocale('common');
  const model = useMainLayout();
  const description = t('Navigation feature coming soon', { feature: model.unavailableFeature ? t(model.unavailableFeature) : '' });

  return <div className="min-h-screen bg-lunara-cream font-body" data-d1-storefront>
    <header data-storefront-header className="sticky top-0 z-50 bg-lunara-cream shadow-md shadow-lunara-ink/10">
      <div data-header-utility className="border-b border-lunara-border bg-lunara-utility">
        <div className="mx-auto flex h-[35px] max-w-[var(--lunara-header-max-width)] items-center justify-between gap-2 px-5 sm:px-8">
          <p className="flex min-w-0 items-center gap-2 text-[10px] text-lunara-ink sm:text-xs"><Truck size={14} strokeWidth={1.5} aria-hidden="true" /><span className="hidden min-w-0 truncate sm:inline">{t('Flower delivery • Scheduled with care')}</span></p>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <button type="button" data-header-support aria-label={t('Customer support')} onClick={() => model.showUnavailable('Customer support')} className={utilityClass}><Headphones size={14} strokeWidth={1.5} aria-hidden="true" /><span className="hidden md:inline">{t('Customer support')}</span></button>
            <span aria-hidden="true" className="hidden h-4 w-px bg-lunara-border lg:block" />
            <button type="button" data-header-hotline aria-label={t('Hotline')} onClick={() => model.showUnavailable('Hotline')} className={utilityClass}><Phone size={14} strokeWidth={1.5} aria-hidden="true" /><span className="hidden lg:inline">{t('Hotline')}</span></button>
            <span aria-hidden="true" className="hidden h-4 w-px bg-lunara-border lg:block" />
            <ThemeSwitcher theme={model.theme} onThemeChange={model.setTheme} />
            <LanguageSwitcher compact />
          </div>
        </div>
      </div>

      <div data-header-main className="mx-auto grid max-w-[var(--lunara-header-max-width)] grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-3 px-5 pt-4 pb-4 sm:gap-x-6 sm:px-8 lg:min-h-24 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-8 lg:py-4 xl:gap-x-12">
        <Link to="/" aria-label={t('Lunara Shop')} className="group flex w-fit shrink-0 items-center gap-2.5 no-underline sm:gap-3 lg:pr-4">
          <svg data-storefront-logo-art className="size-8 shrink-0 transition-transform motion-safe:group-hover:scale-105 motion-reduce:transition-none sm:size-10" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <path d="M20 28C16 33 11 38 8 43" stroke="var(--lunara-rose)" strokeWidth="2" strokeLinecap="round" />
            <path d="M17 31C13 30 8 32 6 35C9 37 15 36 17 31Z" fill="var(--lunara-rose-light)" stroke="var(--lunara-rose-strong)" strokeWidth="0.8" />
            <path d="M13 36C12 40 14 43 17 44C19 41 18 37 13 36Z" fill="var(--lunara-rose-light)" stroke="var(--lunara-rose-strong)" strokeWidth="0.8" />
            <path d="M24 16C18 8 13 14 15 22C17 29 23 30 25 28C27 25 29 22 24 16Z" fill="var(--lunara-rose-light)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
            <path d="M24 16C31 8 36 14 34 22C32 29 26 30 24 28C22 25 20 22 24 16Z" fill="var(--lunara-rose-light)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
            <path d="M14 20C10 23 11 29 17 29C22 29 23 25 21 21C19 18 16 18 14 20Z" fill="var(--lunara-rose-light)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
            <path d="M34 20C38 23 37 29 31 29C26 29 25 25 27 21C29 18 32 18 34 20Z" fill="var(--lunara-rose-light)" stroke="var(--lunara-rose)" strokeWidth="0.75" />
            <path d="M24 12C20 16 20 24 24 26C28 24 28 16 24 12Z" fill="var(--lunara-rose)" fillOpacity="0.9" stroke="var(--lunara-rose-strong)" strokeWidth="0.75" />
            <path d="M22 17C23 15 25 15 26 17C27 20 25 23 24 24C23 23 21 20 22 17Z" fill="var(--lunara-rose-strong)" />
            <path d="M21 27C23 29 25 29 27 27C26 30 22 30 21 27Z" fill="var(--lunara-rose-strong)" />
          </svg>
          <span data-storefront-logo className="font-display text-[28px] leading-none font-normal tracking-tight whitespace-nowrap text-lunara-ink sm:text-[32px]">{t('Lunara Shop')}</span>
        </Link>

        <div className="col-span-2 row-start-2 flex min-w-0 items-center gap-3 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <button ref={model.menuButtonRef} type="button" data-header-menu-toggle aria-label={t(model.menuOpen ? 'Close' : 'Open menu')} aria-expanded={model.menuOpen} aria-controls="storefront-navigation" onClick={model.toggleMenu} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-lunara-border text-lunara-ink lg:hidden">{model.menuOpen ? <X size={21} strokeWidth={1.5} /> : <Menu size={21} strokeWidth={1.5} />}</button>
          <form id="header-search" role="search" action={import.meta.env.BASE_URL + 'shop'} method="get" onSubmit={model.submitSearch} className="flex min-h-[50px] min-w-0 flex-1 items-center gap-2 rounded-full border-0 bg-lunara-cream py-1 pr-1 pl-4 shadow-sm shadow-lunara-ink/15 transition-shadow focus-within:shadow-md focus-within:shadow-lunara-ink/15 sm:pl-5">
            <Search size={20} strokeWidth={1.5} aria-hidden="true" className="hidden shrink-0 text-lunara-body sm:block" />
            <input ref={model.searchInputRef} type="search" name="q" value={model.searchTerm} onChange={event => model.setSearchTerm(event.target.value)} aria-label={t('Search flowers')} placeholder={t('Find flowers, gifts...')} className="min-h-10 w-full min-w-0 border-0 bg-transparent px-1 text-base text-lunara-ink outline-none placeholder:text-lunara-body focus:outline-none focus-visible:outline-none focus-visible:ring-0 sm:px-2" />
            <button type="submit" aria-label={t('Search')} className="inline-flex min-h-10 min-w-14 shrink-0 items-center justify-center rounded-full bg-lunara-rose-strong text-white transition-colors hover:bg-lunara-ink sm:min-w-[70px]"><Search size={21} strokeWidth={1.75} aria-hidden="true" /></button>
          </form>
        </div>

        <div data-header-actions className="col-start-2 row-start-1 flex items-center justify-end gap-0 sm:gap-2 lg:col-start-3 lg:gap-4">
          <Link to="/orders/track" data-header-tracking aria-label={t('Track your order')} aria-current={model.isActive('/orders/track') ? 'page' : undefined} className={actionClass}><FileText size={26} strokeWidth={1.5} aria-hidden="true" /><span className="hidden text-xs whitespace-nowrap lg:inline xl:text-sm">{t('Track your order')}</span></Link>
          <button type="button" data-header-wishlist aria-label={t('Wishlist')} onClick={() => model.showUnavailable('Wishlist')} className={actionClass}><Heart size={26} strokeWidth={1.5} aria-hidden="true" /><span className="hidden text-xs lg:inline xl:text-sm">{t('Wishlist')}</span></button>
          <Link to="/cart" data-header-cart aria-label={t('Cart, items: {{count}}', { count: model.itemCount })} aria-current={model.isActive('/cart') || model.isActive('/checkout') ? 'page' : undefined} className={actionClass}>
            <span className="relative"><ShoppingCart size={28} strokeWidth={1.5} aria-hidden="true" />{model.itemCount > 0 && <span data-header-cart-count className="absolute -top-2 -right-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-lunara-rose-strong px-1 text-[10px] leading-none font-semibold text-white">{model.itemCount}</span>}</span><span className="hidden text-xs lg:inline xl:text-sm">{t('Cart')}</span>
          </Link>
        </div>
      </div>

      <StorefrontNavigation model={model} />
    </header>

    <Outlet /><StorefrontFooter /><ZaloContact />
    <Dialog open={model.unavailableFeature !== null} onOpenChange={open => { if (!open) model.closeUnavailable(); }}>
      <DialogContent className="rounded-2xl border-lunara-border bg-lunara-cream font-body" onCloseAutoFocus={event => { event.preventDefault(); model.restoreNoticeFocus(); }}>
        <DialogTitle className="sr-only">{model.unavailableFeature ? t(model.unavailableFeature) : ''}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <FeatureUnavailable inline description={description} />
        <DialogClose asChild><button type="button" className="rounded-full bg-lunara-rose-strong px-6 py-3 text-white">{t('Close')}</button></DialogClose>
      </DialogContent>
    </Dialog>
  </div>;
}
