import { Fragment } from 'react';
import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';

export interface BreadcrumbTrailItem {
  to?: string;
  label: string;
}

export function BreadcrumbTrail({ items, className }: { items: BreadcrumbTrailItem[]; className?: string }) {
  const { t } = useLocale('common');
  return <nav data-storefront-breadcrumb aria-label={t('Breadcrumb')} className={cn('text-sm leading-6 text-lunara-ink', className)}>
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {items.map((item, index) => <Fragment key={item.to || index}>
        {index > 0 && <li aria-hidden="true">/</li>}
        <li className="min-w-0 break-words">{item.to ? <Link to={item.to} data-back-to-collection={item.to === '/shop' ? '' : undefined} className="inline-flex min-h-8 items-center no-underline transition-colors hover:text-lunara-text-hover hover:underline hover:underline-offset-4">{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>
      </Fragment>)}
    </ol>
  </nav>;
}
