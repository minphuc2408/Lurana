import { useTranslation } from "react-i18next";
import { normalizeLanguage, type Language } from "./language";

export function useLanguageSwitcher() {
  const { t, i18n } = useTranslation("common");
  return {
    language: normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
    label: t("Language"),
    changeLanguage: (language: Language) => { void i18n.changeLanguage(language); },
  };
}
