import { useRef } from 'react';
import { Link } from 'react-router';
import { Facebook, Instagram, Linkedin, Phone, Twitter, Youtube, type LucideIcon } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { customerCareLinks, socialLinks, storeLocations } from '@/shared/config/storefront-footer';
import { FeatureUnavailableDialog } from '@/shared/components/FeatureUnavailableDialog';
import { cn } from '@/shared/lib/utils';

const linkClass = 'inline-block text-sm leading-6 text-lunara-footer-link no-underline transition-colors hover:text-lunara-rose-strong hover:underline underline-offset-4 break-words';
const headingClass = 'mb-5 text-sm font-medium tracking-[0.06em] uppercase text-lunara-footer-heading';
const bottomLabels = ['Privacy Policy', 'Shipping Policy'];
const shoppingLabels = ['Frequently Asked Questions', 'Payment Methods'];
const socialIcons: Record<string, LucideIcon> = { Facebook, Twitter, Instagram, Linkedin, Youtube };

function FooterDestination({ label, href, icon: Icon }: { label: string; href?: string; icon?: LucideIcon }) {
  const { t } = useLocale('common');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const className = cn(linkClass, Icon && 'inline-flex min-h-11 items-center gap-2');
  const content = <>{Icon && <Icon size={16} strokeWidth={1.5} aria-hidden="true" />}{t(label)}</>;
  if (href) return <Link to={href} className={className}>{content}</Link>;
  const description = t('Footer feature coming soon', { feature: t(label) });
  return <FeatureUnavailableDialog description={description}
    trigger={<button ref={triggerRef} type="button" data-footer-coming-soon className={cn('text-left', className)}>{content}</button>}
    onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus({ preventScroll: true }); }} />;
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
            <ul data-footer-socials className="flex max-w-sm flex-col items-start">{socialLinks.map(link => <li key={link.label}><FooterDestination {...link} icon={socialIcons[link.label]} /></li>)}</ul>
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
        <section id="contact" tabIndex={-1} aria-labelledby="footer-contact-heading" className="col-span-2 min-w-0 lg:col-span-1">
          <h4 id="footer-contact-heading" className={headingClass}>{t('Contact Us')}</h4>
          <div data-footer-hotline className="mb-5 flex items-center gap-2">
            <Phone size={16} strokeWidth={1.5} aria-hidden="true" />
            <FooterDestination label="Hotline" />
          </div>
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
        </section>
      </div>
      <div data-footer-bottom className="flex flex-col gap-5 border-t border-lunara-border pt-6 text-sm leading-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:pt-8">
        <p>{t('© 2026 Lunara Flower Shop. All rights reserved. Made with love & flowers.')}</p>
        <nav aria-label={t('Customer Care')} className="flex shrink-0 flex-wrap gap-x-7 gap-y-2">{customerCareLinks.filter(link => bottomLabels.includes(link.label)).map(link => <FooterDestination key={link.label} {...link} />)}</nav>
      </div>
    </div>
  </footer>;
}
