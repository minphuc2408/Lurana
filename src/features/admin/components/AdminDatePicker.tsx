import * as Popover from '@radix-ui/react-popover';
import { DayPicker, useNavigation, type CaptionProps } from 'react-day-picker';
import { enUS, vi } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { vietnamDate } from '@/shared/lib/format';
import { useLocale } from '@/shared/i18n';
import { Dropdown } from '@/shared/ui/dropdown';
import { useAdminCalendar } from '../hooks/useAdminPresentation';

function CalendarCaption({ displayMonth }: CaptionProps) {
  const { language, t } = useLocale('admin');
  const { goToMonth, previousMonth, nextMonth } = useNavigation();
  const year = displayMonth.getFullYear();
  return <div className="admin-calendar-caption"><button type="button" className="admin-page-button" aria-label={t('Previous month')} onClick={() => previousMonth && goToMonth(previousMonth)}><ChevronLeft size={17} /></button>
    <Dropdown aria-label={t('Month')} value={displayMonth.getMonth()} onValueChange={month => goToMonth(new Date(year, Number(month), 1))} className="admin-calendar-select">{Array.from({ length: 12 }, (_, month) => <option key={month} value={month}>{new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long' }).format(new Date(2026, month, 1))}</option>)}</Dropdown>
    <Dropdown aria-label={t('Year')} value={year} onValueChange={value => goToMonth(new Date(Number(value), displayMonth.getMonth(), 1))} className="admin-calendar-select !w-20">{Array.from({ length: 121 }, (_, index) => year - 100 + index).map(value => <option key={value} value={value}>{value}</option>)}</Dropdown>
    <button type="button" className="admin-page-button" aria-label={t('Next month')} onClick={() => nextMonth && goToMonth(nextMonth)}><ChevronRight size={17} /></button></div>;
}
export function AdminDatePicker({ name, label, value, onChange, required = false }: { name: string; label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  const { t, language } = useLocale('admin');
  const calendar = useAdminCalendar(value);
  const select = (date?: Date) => {
    onChange(date ? `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '');
    calendar.setOpen(false);
  };
  return <div className="min-w-0"><span className="mb-2 block text-xs text-lunara-body">{label}</span><input type="hidden" name={name} value={value} />
    <Popover.Root open={calendar.open} onOpenChange={calendar.setOpen}><Popover.Trigger asChild><button data-admin-date={name} type="button" aria-label={label} className="admin-input inline-flex w-full items-center justify-between gap-2 px-3 py-2 text-sm"><span>{value ? value.split('-').reverse().join('/') : t('Choose date')}</span><CalendarDays size={16} className="shrink-0 text-lunara-body" aria-hidden="true" /></button></Popover.Trigger>
      <Popover.Portal><Popover.Content data-admin-calendar align="start" sideOffset={8} collisionPadding={12} className="admin-calendar font-body" aria-label={label}>
        <DayPicker mode="single" selected={calendar.selected} defaultMonth={calendar.selected} onSelect={date => { if (date || !required) select(date); }} locale={language === 'vi' ? vi : enUS} weekStartsOn={1} showOutsideDays fixedWeeks initialFocus today={new Date(`${vietnamDate()}T12:00:00`)} components={{ Caption: CalendarCaption }}
          labels={{ labelDay: date => new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'full' }).format(date) }} />
        <div className="flex items-center justify-between gap-2 border-t border-lunara-border pt-2"><button type="button" className="admin-filter-tab" onClick={() => select(new Date(`${vietnamDate()}T12:00:00`))}>{t('Today')}</button>{!required && <button type="button" className="admin-filter-tab" onClick={() => select()}>{t('Clear date')}</button>}</div>
      </Popover.Content></Popover.Portal>
    </Popover.Root>
  </div>;
}
