import { useLocale, LanguageSwitcher } from '@/shared/i18n';
import { useMainLayout } from './hooks/useMainLayout';
import { Outlet, Link } from 'react-router';
import { Heart, Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import { FeatureUnavailableDialog } from '@/shared/components/FeatureUnavailableDialog';
import { StorefrontFooter } from './components/StorefrontFooter';
import { StorefrontNavigation } from './components/StorefrontNavigation';
import { StorefrontBreadcrumb } from './components/StorefrontBreadcrumb';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { ZaloContact } from './components/ZaloContact';
import { useWishlist, WishlistDrawer } from '@/features/shop';
import { cn } from '@/shared/lib/utils';
import { featureFlags } from '@/shared/config/features';
import { LazyMotion, domMax, MotionConfig, m, useReducedMotion } from 'motion/react';
import { motionEase, motionTimings } from '@/shared/lib/motion';

const actionClass = 'relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-lunara-header-body no-underline transition-colors hover:text-lunara-header-ink';

export function MainLayout() {
  const { t } = useLocale('common');
  const model = useMainLayout();
  const wishlist = useWishlist();
  const reducedMotion = useReducedMotion();
  const tapFeedback = reducedMotion === false ? { scale: 0.94 } : undefined;
  const description = t('Navigation feature coming soon', { feature: model.unavailableFeature ? t(model.unavailableFeature) : '' });

  return <LazyMotion features={domMax} strict><MotionConfig reducedMotion="user" transition={{ type: 'tween', ease: motionEase, duration: motionTimings.feedback }}><div className="min-h-screen bg-lunara-cream font-body" data-d1-storefront>
    <header ref={model.headerRef} data-storefront-header className="sticky top-0 z-50 bg-lunara-cream shadow-md shadow-lunara-ink/10">
      <div data-header-main className="mx-auto grid max-w-[var(--lunara-header-max-width)] grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-3 px-5 pt-4 pb-4 sm:gap-x-6 sm:px-8 lg:min-h-24 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-x-8 lg:py-4 xl:gap-x-12">
        <Link to="/" aria-label={t('Lunara Shop')} className="group flex w-fit shrink-0 items-center gap-2.5 no-underline sm:gap-3 lg:pr-4">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" aria-hidden="true" data-storefront-logo-art className="size-8 shrink-0 transition-transform motion-safe:group-hover:scale-105 motion-reduce:transition-none sm:size-10" />
          <span data-storefront-logo className="font-display text-[28px] leading-none font-normal tracking-tight whitespace-nowrap text-lunara-header-ink sm:text-[32px]">{t('Lunara Shop')}</span>
        </Link>

        <div className="col-span-2 row-start-3 flex min-w-0 items-center gap-3 sm:row-start-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <button ref={model.menuButtonRef} type="button" data-header-menu-toggle aria-label={t(model.menuOpen ? 'Close' : 'Open menu')} aria-expanded={model.menuOpen} aria-controls="storefront-navigation" onClick={model.toggleMenu} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-lunara-border text-lunara-ink lg:hidden">{model.menuOpen ? <X size={21} strokeWidth={1.5} /> : <Menu size={21} strokeWidth={1.5} />}</button>
          <form id="header-search" role="search" action={import.meta.env.BASE_URL + 'shop'} method="get" onSubmit={model.submitSearch} className="flex min-h-[50px] min-w-0 flex-1 items-center gap-2 rounded-full border-0 bg-lunara-cream px-4 py-1 shadow-sm shadow-lunara-ink/15 transition-shadow focus-within:shadow-md focus-within:shadow-lunara-ink/15 sm:px-5">
            <Search size={20} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-lunara-header-body" />
            <input ref={model.searchInputRef} type="search" name="q" enterKeyHint="search" value={model.searchTerm} onChange={event => model.setSearchTerm(event.target.value)} aria-label={t('Search flowers')} placeholder={t('Find flowers, gifts...')} className="min-h-10 w-full min-w-0 border-0 bg-transparent px-1 text-base text-lunara-header-ink outline-none placeholder:text-lunara-header-body focus:outline-none focus-visible:outline-none focus-visible:ring-0 sm:px-2" />
          </form>
        </div>

        <div data-header-actions className="col-span-2 row-start-2 flex items-center justify-end gap-0 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:gap-2 lg:col-start-3 lg:gap-4">
          <div data-header-preferences className="mr-2 flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeSwitcher theme={model.theme} onThemeChange={model.setTheme} />
            <LanguageSwitcher appearance="storefront" />
          </div>
          <m.button type="button" data-header-account whileTap={tapFeedback} aria-label={t('Customer account')} title={t('Customer account')} aria-haspopup="dialog" onClick={() => model.showUnavailable('Customer account')} className={actionClass}><UserRound size={26} strokeWidth={1.5} aria-hidden="true" /></m.button>
          <m.button type="button" data-header-wishlist whileTap={tapFeedback} aria-label={t('Wishlist')} title={t('Wishlist')} aria-haspopup="dialog" aria-expanded={wishlist.open} onClick={wishlist.show} className={cn(actionClass, 'hidden md:inline-flex')}><span className="relative"><Heart size={26} strokeWidth={1.5} aria-hidden="true" />{wishlist.items.length > 0 && <m.span key={wishlist.items.length} initial={false} animate={{ scale: reducedMotion === false ? [1, 1.16, 1] : 1 }} data-header-wishlist-count className="absolute -top-2 -right-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-lunara-header-count px-1 text-[10px] font-semibold text-lunara-on-header-count">{wishlist.items.length}</m.span>}</span></m.button>
          <Link to="/cart" data-header-cart aria-label={t('Cart, items: {{count}}', { count: model.itemCount })} aria-current={model.isActive('/cart') || model.isActive('/checkout') ? 'page' : undefined} className={actionClass}>
            <span className="relative"><ShoppingCart size={28} strokeWidth={1.5} aria-hidden="true" />{model.itemCount > 0 && <m.span key={model.itemCount} initial={false} animate={{ scale: reducedMotion === false ? [1, 1.16, 1] : 1 }} data-header-cart-count className="absolute -top-2 -right-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-lunara-header-count px-1 text-[10px] leading-none font-semibold text-lunara-on-header-count">{model.itemCount}</m.span>}</span>
          </Link>
        </div>
      </div>

      <StorefrontNavigation model={model} />
    </header>

    <StorefrontBreadcrumb /><Outlet /><StorefrontFooter />{featureFlags.zaloContact && <ZaloContact />}<WishlistDrawer />
    <FeatureUnavailableDialog description={description} open={model.unavailableFeature !== null}
      onOpenChange={open => { if (!open) model.closeUnavailable(); }}
      onCloseAutoFocus={event => { event.preventDefault(); model.restoreNoticeFocus(); }} />
  </div></MotionConfig></LazyMotion>;
}
