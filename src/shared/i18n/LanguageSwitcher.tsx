import { Languages } from "lucide-react";
import { useLanguageSwitcher } from "./useLanguageSwitcher";

export function LanguageSwitcher() {
  const { language, changeLanguage, label } = useLanguageSwitcher();
  return <div role="group" aria-label={label} data-language-switcher className="inline-flex shrink-0 items-center gap-1 rounded-full border border-lunara-border bg-lunara-cream p-1 font-body text-xs text-lunara-body">
    <Languages size={14} className="ml-1 hidden sm:block" aria-hidden="true" />
    {([{ code: "en", label: "EN", name: "English" }, { code: "vi", label: "VI", name: "Tiếng Việt" }] as const).map(option =>
      <button key={option.code} type="button" lang={option.code} aria-label={option.name} aria-pressed={language === option.code} onClick={() => changeLanguage(option.code)}
        className={`min-h-8 min-w-8 rounded-full px-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink ${language === option.code ? "bg-lunara-rose-strong text-white" : "text-lunara-body hover:bg-lunara-blush"}`}>
        {option.label}
      </button>
    )}
  </div>;
}
