import { Languages } from "lucide-react";
import { useLanguageSwitcher } from "./useLanguageSwitcher";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, changeLanguage, label } = useLanguageSwitcher();
  return <div role="group" aria-label={label} data-language-switcher className={`inline-flex shrink-0 items-center rounded-full border border-lunara-border bg-lunara-cream font-body text-xs text-lunara-body ${compact ? "gap-0 px-0.5" : "gap-0.5 p-0.5"}`}>
    <Languages size={14} className="ml-1 hidden sm:block" aria-hidden="true" />
    {([{ code: "en", label: "EN", name: "English" }, { code: "vi", label: "VI", name: "Tiếng Việt" }] as const).map(option =>
      <button key={option.code} type="button" lang={option.code} aria-label={option.name} aria-pressed={language === option.code} onClick={() => changeLanguage(option.code)}
        className={`min-h-11 min-w-11 px-2 rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink ${language === option.code ? "bg-lunara-rose-strong text-white" : "text-lunara-body hover:bg-lunara-blush"}`}>
        {option.label}
      </button>
    )}
  </div>;
}
