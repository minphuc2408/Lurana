import { useRef } from 'react';
import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { customerCareLinks, socialLinks, storeLocations } from '@/shared/config/storefront-footer';
import { FeatureUnavailable } from '@/shared/components/FeatureUnavailable';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/shared/ui/dialog';

const linkClass = 'inline-block text-sm leading-6 text-lunara-body no-underline transition-colors hover:text-lunara-rose-strong hover:underline underline-offset-4 break-words';
const headingClass = 'mb-5 text-sm font-medium tracking-[0.06em] uppercase text-lunara-ink';
const bottomLabels = ['Privacy Policy', 'Shipping Policy'];
const shoppingLabels = ['Frequently Asked Questions', 'Payment Methods'];

function FooterDestination({ label, href }: { label: string; href?: string }) {
  const { t } = useLocale('common');
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (href) return <Link to={href} className={linkClass}>{t(label)}</Link>;
  const description = t('Footer feature coming soon', { feature: t(label) });
  return <Dialog>
    <DialogTrigger asChild><button ref={triggerRef} type="button" data-footer-coming-soon className={'text-left ' + linkClass}>{t(label)}</button></DialogTrigger>
    <DialogContent onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus({ preventScroll: true }); }} className="rounded-2xl border-lunara-border bg-lunara-cream font-body">
      <DialogTitle className="sr-only">{t(label)}</DialogTitle>
      <DialogDescription className="sr-only">{description}</DialogDescription>
      <FeatureUnavailable inline description={description} />
      <DialogClose asChild><button type="button" className="rounded-full bg-lunara-rose-strong px-6 py-3 text-white">{t('Close')}</button></DialogClose>
    </DialogContent>
  </Dialog>;
}

export function StorefrontFooter() {
  const { t } = useLocale('common');
  const shoppingLinks = customerCareLinks.filter(link => shoppingLabels.includes(link.label));
  const aboutLinks = customerCareLinks.filter(link => !shoppingLabels.includes(link.label) && !bottomLabels.includes(link.label));
  return <footer className="mt-24 bg-lunara-surface font-body text-lunara-body" data-storefront-footer>
    <div className="mx-auto max-w-[1440px] px-5 pt-12 pb-6 sm:px-8 lg:pt-16 lg:pb-8">
      <div data-footer-grid className="grid grid-cols-2 gap-x-6 gap-y-10 pb-12 lg:grid-cols-[1.65fr_0.8fr_1fr_1.4fr] lg:gap-x-12 lg:pb-14">
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <Link to="/" className="mb-5 inline-block font-display text-[32px] leading-none tracking-tight text-lunara-ink no-underline">{t('Lunara Shop')}</Link>
          <p className="max-w-sm text-sm leading-7">{t("Crafting nature's most beautiful moments into timeless floral arrangements. Bringing joy, one bloom at a time.")}</p>
          <nav aria-label={t('Follow Us')} className="mt-7">
            <h4 className={headingClass}>{t('Follow Us')}</h4>
            <ul className="flex max-w-sm flex-wrap gap-x-5 gap-y-2">{socialLinks.map(link => <li key={link.label}><FooterDestination {...link} /></li>)}</ul>
          </nav>
        </div>
        <nav aria-label={t('Shopping')} className="min-w-0">
          <h4 className={headingClass}>{t('Shopping')}</h4>
          <ul className="flex flex-col gap-3">
            <li><Link to="/shop" className={linkClass}>{t('All flowers')}</Link></li>
            <li><Link to="/orders/track" className={linkClass}>{t('Track order')}</Link></li>
            {shoppingLinks.map(link => <li key={link.label}><FooterDestination {...link} /></li>)}
            <li><Link to="/admin/login" className={linkClass}>{t('Admin login')}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t('About Lunarra')} className="min-w-0">
          <h4 className={headingClass}>{t('About Lunarra')}</h4>
          <ul className="flex flex-col gap-3">{aboutLinks.map(link => <li key={link.label}><FooterDestination {...link} /></li>)}</ul>
        </nav>
        <div className="col-span-2 min-w-0 lg:col-span-1">
          <h4 className={headingClass}>{t('Contact Us')}</h4>
          <address className="grid gap-5 not-italic sm:grid-cols-3 lg:grid-cols-1">
            {storeLocations.map(store => <p key={store.id} className="text-sm leading-6">
              <strong className="block font-medium text-lunara-ink">{t(store.label)}:</strong>
              <a href={t(store.mapUrlKey)} target="_blank" rel="noopener noreferrer" className={linkClass}>{t(store.addressKey)}</a>
            </p>)}
          </address>
          <div className="mt-6 text-xs leading-6">
            <p className="font-medium text-lunara-ink">CÔNG TY TNHH LUNARA</p>
            <p>{t('Tax ID')}: 001</p>
          </div>
        </div>
      </div>
      <div data-footer-bottom className="flex flex-col gap-5 border-t border-lunara-border pt-6 text-sm leading-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:pt-8">
        <p>{t('© 2026 Lunara Flower Shop. All rights reserved. Made with love & flowers.')}</p>
        <nav aria-label={t('Customer Care')} className="flex shrink-0 flex-wrap gap-x-7 gap-y-2">{customerCareLinks.filter(link => bottomLabels.includes(link.label)).map(link => <FooterDestination key={link.label} {...link} />)}</nav>
      </div>
    </div>
  </footer>;
}
