import { Palette } from 'lucide-react';
import { Dropdown } from '@/shared/ui/dropdown';
import { useLocale } from '@/shared/i18n';
import { themes, type ThemeId } from '@/shared/theme/themes';

export function ThemeSwitcher({ theme, onThemeChange }: { theme: ThemeId; onThemeChange: (value: string) => void }) {
  const { t } = useLocale('common');
  const selected = themes.find(item => item.id === theme)!;
  return <Dropdown id="header-theme" value={theme} onValueChange={onThemeChange} aria-label={t('Theme, current: {{name}}', { name: selected.name })}
    triggerContent={<span className="inline-flex items-center gap-1.5"><Palette size={16} strokeWidth={1.5} aria-hidden="true" /><span className="hidden lg:inline">{t('Theme')}</span></span>}
    className="w-auto min-w-6 gap-0 border-0 bg-transparent px-0 py-0 text-xs text-lunara-body hover:text-lunara-ink focus-visible:outline-lunara-ink [&>svg]:hidden"
    contentClassName="w-72">
    {themes.map(item => <option key={item.id} value={item.id}>
      <span className="flex items-center gap-3" data-theme-option={item.id}>
        <svg aria-hidden="true" width={60} height={20} viewBox="0 0 60 20" className="shrink-0 overflow-hidden rounded-sm border border-lunara-control-border">
          {[item.background, item.secondary, item.softSurface, item.accent, item.foreground].map((color, index) => <rect key={index} x={index * 12} width={12} height={20} fill={color} />)}
        </svg><span>{item.name}</span>
      </span>
    </option>)}
  </Dropdown>;
}
