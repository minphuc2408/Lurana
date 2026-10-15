import { Flower } from 'lucide-react';
import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { customerCareLinks, socialLinks, storeLocations } from '@/shared/config/storefront-footer';

const linkClass = 'text-sm leading-7 text-[#F5DDD5] no-underline transition-colors hover:text-white hover:underline underline-offset-4 break-words';
const headingClass = 'font-display text-sm sm:text-base font-semibold tracking-[0.05em] uppercase text-[#F5DDD5] mb-4 leading-relaxed';

export function StorefrontFooter() {
  const { t } = useLocale('common');
  return <footer className="mt-24 bg-lunara-ink text-[#F5DDD5]" data-storefront-footer>
    <div data-footer-grid className="max-w-7xl mx-auto px-6 py-10 lg:py-16 grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.65fr)_minmax(0,1.3fr)] gap-x-6 gap-y-9 lg:gap-10">
      <div className="col-span-2 lg:col-span-1 min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <Flower size={20} className="text-lunara-rose-light" />
          <span className="font-display [font-size:1.6rem] [font-weight:600] [letter-spacing:0.1em] text-[#F5DDD5]">lunara</span>
        </div>
        <p className="[font-size:0.88rem] [line-height:1.8] text-lunara-body [max-width:300px]">
          {t("Crafting nature's most beautiful moments into timeless floral arrangements. Bringing joy, one bloom at a time.")}
        </p>
      </div>
      <nav aria-label={t('Customer Care')} className="min-w-0">
        <h4 className={headingClass}>{t('Customer Care')}</h4>
        <ul className="flex flex-col gap-2">
          <li><Link to="/orders/track" className={linkClass}>{t('Track order')}</Link></li>
          <li><Link to="/admin/login" className={linkClass}>{t('Admin login')}</Link></li>
          {customerCareLinks.map(link => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>{t(link.label)}</a></li>)}
        </ul>
      </nav>
      <nav aria-label={t('Follow Us')} className="min-w-0">
        <h4 className={headingClass}>{t('Follow Us')}</h4>
        <ul className="flex flex-col gap-2">
          {socialLinks.map(link => <li key={link.href}><a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>{link.label}</a></li>)}
        </ul>
      </nav>
      <div className="col-span-2 lg:col-span-1 min-w-0">
        <h4 className={headingClass}>{t('Lunara Flower Shop')}</h4>
        <address className="not-italic flex flex-col gap-5">
          {storeLocations.map(store => <p key={store.id} className="text-sm leading-7">
            <strong className="block font-semibold">{t(store.label)}:</strong>
            <a href={t(store.mapUrlKey)} target="_blank" rel="noopener noreferrer" className={linkClass}>{t(store.addressKey)}</a>
          </p>)}
        </address>
        <div className="mt-6 pt-5 border-t border-[#5A3540] text-sm leading-7">
          <p className="font-semibold">CÔNG TY TNHH LUNARA</p>
          <p>{t('Tax ID')}: 001</p>
        </div>
      </div>
    </div>
    <div className="[border-top:1px_solid_#5A3540] [padding:16px_24px] [text-align:center] [font-size:0.78rem] text-[#8A6070]">
      {t('© 2026 Lunara Flower Shop. All rights reserved. Made with love & flowers.')}
    </div>
  </footer>;
}
