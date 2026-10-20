import { Palette } from 'lucide-react';
import { Dropdown } from '@/shared/ui/dropdown';
import { useLocale } from '@/shared/i18n';
import { defaultThemeId, themes, themeSwatches, type ThemeId } from '@/shared/theme/themes';

const themeOptions = [...themes].sort((a, b) => Number(b.id === defaultThemeId) - Number(a.id === defaultThemeId));

export function ThemeSwitcher({ theme, onThemeChange }: { theme: ThemeId; onThemeChange: (value: string) => void }) {
  const { t } = useLocale('common');
  const selected = themes.find(item => item.id === theme)!;
  return <Dropdown id="header-theme" value={theme} onValueChange={onThemeChange} aria-label={t('Theme, current: {{name}}', { name: selected.name })}
    triggerContent={<span className="inline-flex"><Palette data-theme-icon size={20} strokeWidth={1.5} aria-hidden="true" /></span>}
    showChevron={false}
    className="size-11 min-w-11 justify-center gap-0 rounded-full border-0 bg-transparent p-0 text-lunara-header-body transition-colors hover:bg-lunara-preference-hover hover:text-lunara-header-ink focus-visible:outline-lunara-ink data-[state=open]:bg-lunara-preference-active data-[state=open]:text-lunara-on-preference-active data-[state=open]:hover:text-lunara-on-preference-active"
    contentClassName="w-72">
    {themeOptions.map(item => <option key={item.id} value={item.id}>
      <span className="flex items-center gap-3" data-theme-option={item.id}>
        <svg aria-hidden="true" width={60} height={20} viewBox="0 0 60 20" className="shrink-0 overflow-hidden rounded-sm border border-lunara-control-border">
          {themeSwatches(item).map((color, index, colors) => <rect key={index} x={index * 60 / colors.length} width={60 / colors.length} height={20} fill={color} />)}
        </svg><span>{item.name}</span>
      </span>
    </option>)}
  </Dropdown>;
}
