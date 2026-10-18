import { Palette } from 'lucide-react';
import { Dropdown } from '@/shared/ui/dropdown';
import { useLocale } from '@/shared/i18n';
import { themes, themeSwatches, type ThemeId } from '@/shared/theme/themes';

export function ThemeSwitcher({ theme, onThemeChange }: { theme: ThemeId; onThemeChange: (value: string) => void }) {
  const { t } = useLocale('common');
  const selected = themes.find(item => item.id === theme)!;
  return <Dropdown id="header-theme" value={theme} onValueChange={onThemeChange} aria-label={t('Theme, current: {{name}}', { name: selected.name })}
    triggerContent={<span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="hidden h-2.5 w-2.5 rounded-full bg-lunara-rose-strong sm:block" /><Palette size={16} strokeWidth={1.5} aria-hidden="true" /><span className="hidden sm:inline">{t('Theme')}</span></span>}
    className="min-h-8 w-auto min-w-8 gap-0 border-0 bg-transparent px-0 py-0 text-[10px] text-lunara-body hover:text-lunara-ink focus-visible:outline-lunara-ink sm:text-xs [&>svg]:hidden"
    contentClassName="w-72">
    {themes.map(item => <option key={item.id} value={item.id}>
      <span className="flex items-center gap-3" data-theme-option={item.id}>
        <svg aria-hidden="true" width={60} height={20} viewBox="0 0 60 20" className="shrink-0 overflow-hidden rounded-sm border border-lunara-control-border">
          {themeSwatches(item).map((color, index, colors) => <rect key={index} x={index * 60 / colors.length} width={60 / colors.length} height={20} fill={color} />)}
        </svg><span>{item.name}</span>
      </span>
    </option>)}
  </Dropdown>;
}
