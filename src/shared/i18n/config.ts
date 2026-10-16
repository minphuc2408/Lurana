import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";
import { readLanguage, saveLanguage, normalizeLanguage, supportedLanguages } from "./language";

function storage() {
  try { return typeof window === "undefined" ? undefined : window.localStorage; }
  catch { return undefined; }
}

export const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  resources,
  lng: readLanguage(storage(), typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]),
  supportedLngs: supportedLanguages,
  fallbackLng: "en",
  fallbackNS: "common",
  defaultNS: "common",
  ns: Object.keys(resources.en),
  keySeparator: false,
  nsSeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

function updateLanguage(language: string) {
  const normalized = normalizeLanguage(language);
  saveLanguage(normalized, storage());
  if (typeof document !== "undefined") document.documentElement.lang = normalized;
}
i18n.on("languageChanged", updateLanguage);
updateLanguage(i18n.resolvedLanguage ?? i18n.language);
