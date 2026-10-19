import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import { useRef } from 'react';
import { useLocale } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import type { MainLayoutModel } from '../hooks/useMainLayout';

const itemClass = 'flex min-h-11 w-full items-center rounded-lg px-4 py-2.5 text-left text-sm text-lunara-body no-underline outline-none data-[highlighted]:bg-lunara-blush data-[highlighted]:text-lunara-ink data-[highlighted]:outline-2 data-[highlighted]:-outline-offset-2 data-[highlighted]:outline-lunara-rose-strong';
const occasions = ['Birthday', 'Anniversary', 'Wedding', 'Graduation', 'Sympathy'] as const;

export function StorefrontNavigation({ model }: { model: MainLayoutModel }) {
  const inputMethod = useRef('keyboard');
  const { t, language } = useLocale('common');
  const navClass = (active = false) => cn("relative flex min-h-14 w-full items-center justify-between gap-2 px-5 text-left text-base whitespace-nowrap transition-colors hover:text-lunara-rose-strong after:absolute after:inset-x-5 after:bottom-0 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-lunara-rose-strong lg:w-auto lg:justify-center lg:px-1 lg:after:inset-x-0", active ? 'font-medium text-lunara-rose-strong after:scale-x-100 motion-safe:after:animate-[lunara-nav-underline_150ms_ease-out]' : 'text-lunara-ink');
  const menu = (kind: 'flowers' | 'occasions') => {
    const flowers = kind === 'flowers';
    return <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger data-header-submenu-trigger={kind} onPointerDown={() => { inputMethod.current = 'pointer'; }} onKeyDown={() => { inputMethod.current = 'keyboard'; }} className={navClass(flowers && model.isActive('/shop') && model.activeCategory !== 'gift-sets')}>
        {t(flowers ? 'All flowers' : 'Shop by occasion')}<ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content data-storefront-submenu={kind} ref={node => { if (node) node.dataset.inputMethod = inputMethod.current; }} onPointerMove={event => { inputMethod.current = event.currentTarget.dataset.inputMethod = 'pointer'; }} onKeyDown={event => { inputMethod.current = event.currentTarget.dataset.inputMethod = 'keyboard'; }} align="start" sideOffset={4} collisionPadding={16} onCloseAutoFocus={event => { if (model.unavailableFeature) event.preventDefault(); }} className="z-[100] max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] w-64 max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-lunara-border bg-lunara-cream p-2 font-body shadow-lg">
          {flowers ? <>
            <DropdownMenu.Item asChild><Link to="/shop" className={itemClass}>{t('All flowers')}</Link></DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-lunara-border" />
            {model.categories.map(category => <DropdownMenu.Item key={category.code} asChild><Link to={model.categoryHref(category.code)} aria-current={model.isActive('/shop') && model.activeCategory === category.code ? 'page' : undefined} className={itemClass}>{language === 'vi' ? category.name_vi || category.name_en : category.name_en || category.name_vi}</Link></DropdownMenu.Item>)}
            {model.catalogLoading && <DropdownMenu.Label className="px-4 py-3 text-sm text-lunara-body">{t('Loading catalog')}</DropdownMenu.Label>}
            {!!model.catalogError && <DropdownMenu.Item onSelect={model.reloadCatalog} className={itemClass}>{t('Retry')}</DropdownMenu.Item>}
          </> : occasions.map(occasion => <DropdownMenu.Item key={occasion} onSelect={() => model.showUnavailable(occasion)} className={itemClass}>{t(occasion)}</DropdownMenu.Item>)}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>;
  };

  return <nav ref={model.navigationRef} id="storefront-navigation" aria-label={t('Main navigation')} data-main-navigation className={cn('absolute inset-x-0 top-full max-h-[calc(100dvh-100%)] overflow-y-auto border-y border-lunara-border bg-lunara-cream py-2 shadow-sm lg:static lg:max-h-none lg:overflow-visible lg:border-t lg:border-b-0 lg:py-0 lg:shadow-none', model.menuOpen ? 'block' : 'hidden lg:block')}>
    <div className="mx-auto flex max-w-[1240px] flex-col px-2 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:px-8 xl:gap-16">
      <Link to="/" aria-current={model.isActive('/') ? 'page' : undefined} className={navClass(model.isActive('/'))}>{t('Home')}</Link>
      {menu('flowers')}
      {menu('occasions')}
      {model.giftHref ? <Link to={model.giftHref} aria-current={model.isActive('/shop') && model.activeCategory === 'gift-sets' ? 'page' : undefined} className={navClass(model.isActive('/shop') && model.activeCategory === 'gift-sets')}>{t('Gifts')}</Link>
        : <button type="button" onClick={() => model.showUnavailable('Gifts')} className={navClass()}>{t('Gifts')}</button>}
      <button type="button" data-header-contact onClick={() => model.showUnavailable('Contact Us')} className={navClass()}>{t('Contact Us')}</button>
    </div>
  </nav>;
}
