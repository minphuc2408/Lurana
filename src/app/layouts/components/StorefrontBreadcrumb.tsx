import { useLocation } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { BreadcrumbTrail, type BreadcrumbTrailItem } from '@/shared/components/BreadcrumbTrail';

/** Storefront route trail; excludes query values and customer-entered data. */
export function StorefrontBreadcrumb() {
  const { pathname: locationPath } = useLocation();
  const pathname = locationPath.replace(/\/+$/, '') || '/';
  const { t } = useLocale('common');
  if (pathname === '/' || pathname.startsWith('/shop/')) return null;

  const pages: Record<string, string> = {
    '/shop': 'Explore', '/about': 'About Us', '/orders/track': 'Track your order',
    '/cart': 'Cart', '/checkout': 'Checkout',
  };
  const trail: BreadcrumbTrailItem[] = [{ to: '/', label: t('Home') }];
  if (pathname === '/checkout') trail.push({ to: '/cart', label: t('Cart') });
  trail.push({ label: t(pages[pathname] || 'Page unavailable') });

  return <div data-breadcrumb-surface className={pathname === '/shop' ? 'bg-lunara-shop-intro' : undefined}>
    <BreadcrumbTrail items={trail} className="mx-auto w-full max-w-[var(--lunara-content-max-width)] px-5 pt-6 pb-4 text-center [&_ol]:justify-center sm:px-8 sm:pt-8 sm:pb-5" />
  </div>;
}
