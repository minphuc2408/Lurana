import { useTranslation } from "react-i18next";
import { normalizeLanguage } from "./language";

export function useLocale(namespace = "common") {
  const { t, i18n } = useTranslation(namespace);
  return { t, language: normalizeLanguage(i18n.resolvedLanguage ?? i18n.language) };
}
