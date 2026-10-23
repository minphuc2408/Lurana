import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dropdown } from '@/shared/ui/dropdown';
import { useLocale } from '@/shared/i18n';

export interface AdminPaginationProps {
  total: number; page: number; pageSize: number; setPage: (page: number) => void;
  setPageSize?: (size: number) => void; loading?: boolean; label: string; maxOffset?: number;
}
export function AdminPagination({ total, page, pageSize, setPage, setPageSize, loading, label, maxOffset }: AdminPaginationProps) {
  const { t } = useLocale('admin');
  const pager = useRef<HTMLElement | null>(null);
  const resetScroll = () => pager.current?.parentElement?.querySelector<HTMLElement>(':scope > .admin-records, :scope > .admin-gallery-grid')?.scrollTo({ top: 0, left: 0 });
  const navigate = (value: number) => { resetScroll(); setPage(value); };
  const pages = Math.max(1, Math.min(Math.ceil(total / pageSize), maxOffset == null ? Infinity : Math.floor(maxOffset / pageSize) + 1));
  const current = Math.min(page, pages - 1);
  const visible = [...new Set([0, current - 1, current, current + 1, pages - 1].filter(value => value >= 0 && value < pages))].sort((a, b) => a - b);
  return <nav ref={pager} data-admin-pagination aria-label={label} className="admin-pagination">
    <div className="flex min-w-0 items-center gap-3"><span className="whitespace-nowrap text-xs text-lunara-body">{t('{{from}}–{{to}} of {{total}}', { from: total ? current * pageSize + 1 : 0, to: Math.min((current + 1) * pageSize, total), total })}</span>
      {setPageSize && <Dropdown aria-label={t('Rows per page')} disabled={loading} value={pageSize} onValueChange={value => { resetScroll(); setPageSize(Number(value)); }} className="admin-page-size">{[5, 10, 20, 50].map(size => <option key={size} value={size}>{t('{{count}} per page', { count: size })}</option>)}</Dropdown>}
    </div>
    <div className="flex shrink-0 items-center gap-1"><button type="button" aria-label={t('Previous')} disabled={loading || current === 0} onClick={() => navigate(current - 1)} className="admin-page-button"><ChevronLeft size={16} aria-hidden="true" /></button>
      <span className="px-2 text-xs sm:hidden">{current + 1} / {pages}</span><div className="hidden items-center gap-1 sm:flex">{visible.map((value, index) => <span key={value} className="flex items-center gap-1">{index > 0 && value - visible[index - 1] > 1 && <span className="px-1 text-xs text-lunara-body">…</span>}<button type="button" aria-label={t('Go to page {{page}}', { page: value + 1 })} aria-current={value === current ? 'page' : undefined} disabled={loading} onClick={() => navigate(value)} className="admin-page-button">{value + 1}</button></span>)}</div>
      <button type="button" aria-label={t('Next')} disabled={loading || current >= pages - 1} onClick={() => navigate(current + 1)} className="admin-page-button"><ChevronRight size={16} aria-hidden="true" /></button>
    </div>
  </nav>;
}
