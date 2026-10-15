import { useLocale } from '@/shared/i18n';
import { createPortal } from 'react-dom';

export function ZaloContact() {
  const { t } = useLocale('common');
  return createPortal(<details className="group fixed right-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-[45] font-body" data-zalo-contact>
    <summary aria-label={t('Chat with Lunara on Zalo')} className="relative list-none [&::-webkit-details-marker]:hidden cursor-pointer h-[60px] w-[60px] overflow-hidden rounded-full bg-white border-2 border-[#0068FF] text-[#0068FF] shadow-lg transition-[width,box-shadow,background-color] duration-[400ms] ease-in-out group-hover:w-[208px] group-focus-within:w-[208px] group-open:w-[208px] group-hover:bg-[#F8FBFF] group-hover:shadow-xl focus-visible:outline-offset-4 motion-reduce:duration-200">
      <span className="absolute top-1 right-1 flex items-center justify-center w-12 h-12 rounded-full bg-[#0068FF]">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute w-10 h-10 fill-white"><path d="M24 5C12.4 5 4 12.2 4 22c0 5.7 2.7 10.1 7.3 13.2L9 43l9-4.7c1.9.5 3.9.7 6 .7 11.6 0 20-7.2 20-17S35.6 5 24 5Z" /></svg>
        <span className="relative text-[#0068FF] font-semibold text-sm tracking-tight">Zalo</span>
      </span>
      <span aria-hidden="true" data-zalo-label className="absolute inset-y-0 left-3 right-[60px] flex items-center overflow-hidden whitespace-nowrap text-sm font-semibold">{t('Chat with Lunara')}</span>
    </summary>
    <div role="status" className="absolute bottom-full right-0 mb-3 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-lunara-border bg-lunara-cream p-5 shadow-xl text-lunara-body">
      <p className="font-display text-lg font-semibold text-lunara-ink mb-2">{t('Zalo Support')}</p>
      <p className="text-sm leading-6">{t('Our Zalo contact will be available soon.')}</p>
    </div>
  </details>, document.body);
}
