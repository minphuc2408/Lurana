import { Languages } from "lucide-react";
import { useLanguageSwitcher } from "./useLanguageSwitcher";
import { cn } from '@/shared/lib/utils';

export function LanguageSwitcher({ compact = false, appearance = 'default' }: { compact?: boolean; appearance?: 'default' | 'storefront' }) {
  const { language, changeLanguage, label } = useLanguageSwitcher();
  const storefront = appearance === 'storefront';
  return <div role="group" aria-label={label} data-language-switcher className={cn('inline-flex shrink-0 items-center rounded-full border font-body text-lunara-body', storefront ? 'h-11 gap-0 border-lunara-preference-border bg-lunara-preference-surface p-0.5 text-xs' : cn('border-lunara-border bg-lunara-cream text-xs', compact ? 'gap-0 px-0.5' : 'gap-0.5 p-0.5'))}>
    {!storefront && <Languages size={14} className="ml-1 hidden sm:block" aria-hidden="true" />}
    {([{ code: "en", label: "EN", name: "English" }, { code: "vi", label: "VI", name: "Tiếng Việt" }] as const).map(option =>
      <button key={option.code} type="button" lang={option.code} aria-label={option.name} aria-pressed={language === option.code} onClick={() => changeLanguage(option.code)}
        className={cn('group/language min-h-11 rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink', storefront ? 'inline-flex min-w-11 items-center justify-center p-0 text-xs sm:min-w-12 sm:text-sm' : 'min-w-11 px-2', language === option.code ? storefront ? 'text-lunara-on-preference-active' : 'bg-lunara-rose-strong text-white' : storefront ? 'text-lunara-header-ink' : 'text-lunara-body hover:bg-lunara-blush')}>
        {storefront ? <span data-language-pill className={cn('inline-flex h-9 min-w-10 items-center justify-center rounded-full px-2 transition-colors sm:min-w-11', language === option.code ? 'bg-lunara-preference-active' : 'group-hover/language:bg-lunara-preference-hover')}>{option.label}</span> : option.label}
      </button>
    )}
  </div>;
}
