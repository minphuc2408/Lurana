import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLocale } from '@/shared/i18n';
import { cn } from '@/shared/lib/utils';
import type { ProductsModel } from '../hooks/useProducts';

function pageItems(page: number, total: number): (number | 'gap')[] {
  const pages = new Set([1, total]);
  const start = page <= 4 ? 1 : Math.max(1, Math.min(page - 1, total - 4));
  const end = page <= 4 ? Math.min(5, total) : Math.min(total, Math.max(page + 1, start + 2));
  for (let value = start; value <= end; value++) pages.add(value);
  const result: (number | 'gap')[] = [];
  let previous = 0;
  for (const value of [...pages].sort((a, b) => a - b)) {
    if (value - previous === 2) result.push(previous + 1);
    else if (value - previous > 2) result.push('gap');
    result.push(value); previous = value;
  }
  return result;
}

export function ProductPagination({ page, totalPages, pageHref }: Pick<ProductsModel, 'page' | 'totalPages' | 'pageHref'>) {
  const { t } = useLocale('shop');
  if (!totalPages) return null;
  const base = 'inline-flex min-h-11 min-w-9 items-center justify-center rounded-[2px] border border-lunara-border px-2 text-sm text-lunara-ink no-underline transition-colors hover:border-lunara-pagination-selected-border hover:bg-lunara-pagination-hover sm:min-w-11';
  const controls = [
    { label: 'First page', target: 1, disabled: page <= 1, icon: ChevronsLeft },
    { label: 'Previous page', target: page - 1, disabled: page <= 1, icon: ChevronLeft },
    { label: 'Next page', target: page + 1, disabled: page >= totalPages, icon: ChevronRight },
    { label: 'Last page', target: totalPages, disabled: page >= totalPages, icon: ChevronsRight },
  ];
  const control = ({ label, target, disabled, icon: Icon }: typeof controls[number]) => <li key={label}>{disabled
    ? <span aria-label={t(label)} aria-disabled="true" className={cn(base, 'opacity-35')}><Icon size={16} aria-hidden="true" /></span>
    : <Link to={pageHref(target)} aria-label={t(label)} className={base}><Icon size={16} aria-hidden="true" /></Link>}</li>;
  return <nav data-product-pagination aria-label={t('Product pages')} className="mt-10 sm:mt-12">
    <p aria-live="polite" className="mb-4 text-center text-xs text-lunara-body">{t('Page {{page}} of {{total}}', { page, total: totalPages })}</p>
    <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
      {controls.slice(0, 2).map(control)}
      {pageItems(page, totalPages).map((value, index) => value === 'gap'
        ? <li key={'gap-' + index} className="hidden min-w-6 items-center justify-center text-lunara-body sm:inline-flex"><span aria-hidden="true">…</span><span className="sr-only">{t('More pages')}</span></li>
        : <li key={value} className={cn(totalPages > 3 && value !== page && value !== 1 && value !== totalPages && 'hidden sm:list-item')}><Link to={pageHref(value)} aria-label={t('Go to page {{page}}', { page: value })} aria-current={value === page ? 'page' : undefined} className={cn(base, value === page && 'border-lunara-pagination-selected-border bg-lunara-pagination-selected font-semibold')}>{value}</Link></li>)}
      {controls.slice(2).map(control)}
    </ul>
  </nav>;
}
