import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import type { MainLayoutModel } from '../hooks/useMainLayout';
import { LayoutGroup, m } from 'motion/react';
import { motionTimings } from '@/shared/lib/motion';
import { storefrontContactPath } from '@/shared/config/storefront-footer';

const NavigationLink = m.create(Link);

const destinations = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Explore' },
  { to: '/about', label: 'About Us' },
  { to: '/orders/track', label: 'Track your order' },
  { to: storefrontContactPath, label: 'Contact Us' },
] as const;

export function StorefrontNavigation({ model }: { model: MainLayoutModel }) {
  const { t } = useLocale('common');
  const navClass = (active = false) => cn("group/navigation relative flex min-h-14 w-full items-center justify-between gap-2 px-5 text-left text-base whitespace-nowrap no-underline transition-colors lg:w-auto lg:justify-center lg:px-1", active ? 'font-medium text-lunara-nav-active hover:text-lunara-nav-active' : 'text-lunara-nav-ink hover:text-lunara-nav-hover focus-visible:text-lunara-nav-hover');

  return <LayoutGroup id="storefront-navigation"><m.nav ref={model.navigationRef} id="storefront-navigation" initial={false} animate={model.menuOpen ? { opacity: [0.85, 1], y: [-6, 0] } : { opacity: 1, y: 0 }} aria-label={t('Main navigation')} data-main-navigation className={cn('absolute inset-x-0 top-full max-h-[calc(100dvh-100%)] overflow-y-auto bg-lunara-cream py-2 shadow-sm lg:static lg:max-h-none lg:overflow-visible lg:py-0 lg:shadow-none', model.menuOpen ? 'block' : 'hidden lg:block')}>
    <div className="mx-auto flex max-w-[1240px] flex-col px-2 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-8 xl:gap-16">
      {destinations.map(({ to, label }) => <NavigationLink key={to} to={to} data-header-tracking={to === '/orders/track' ? '' : undefined} data-header-contact={to === storefrontContactPath ? '' : undefined} aria-current={model.isActive(to) ? to === storefrontContactPath ? 'location' : 'page' : undefined} className={navClass(model.isActive(to))}>
        <span data-navigation-label className="relative inline-flex leading-6">
          {t(label)}
          {model.isActive(to)
            ? <m.span key="active" data-navigation-indicator aria-hidden="true" layoutId="active-link" initial={{ opacity: 0.25, scaleX: 0.45 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: motionTimings.navigation }} className="pointer-events-none absolute inset-x-0 -bottom-1.5 h-0.5 origin-left rounded-full bg-lunara-nav-active" />
            : <span key="hover" data-navigation-hover aria-hidden="true" className="pointer-events-none absolute inset-x-0 -bottom-1.5 h-px origin-left scale-x-0 rounded-full bg-lunara-nav-active opacity-0 transition-[transform,opacity] duration-300 group-hover/navigation:scale-x-100 group-hover/navigation:opacity-65 group-focus-visible/navigation:scale-x-100 group-focus-visible/navigation:opacity-65 motion-reduce:transition-opacity" />}
        </span>
      </NavigationLink>)}
    </div>
  </m.nav></LayoutGroup>;
}
