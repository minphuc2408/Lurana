export type Language = "en" | "vi";
export const LANGUAGE_STORAGE_KEY = "lunara_language";
export const supportedLanguages: Language[] = ["en", "vi"];

export function normalizeLanguage(language?: string): Language {
  return language?.toLowerCase().split("-")[0] === "vi" ? "vi" : "en";
}

export function readLanguage(storage?: Pick<Storage, "getItem">): Language {
  try { return normalizeLanguage(storage?.getItem(LANGUAGE_STORAGE_KEY) ?? undefined); }
  catch { return "en"; }
}

export function saveLanguage(language: Language, storage?: Pick<Storage, "setItem">) {
  try { storage?.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Storage can be disabled. */ }
}

export interface LocalizedNameFields {
  name?: string | null;
  name_en?: string | null;
  name_vi?: string | null;
  /** Compatibility alias for APIs that use name_vn for Vietnamese. */
  name_vn?: string | null;
}

export function getLocalizedName(value: LocalizedNameFields, language: string): string {
  const candidates = normalizeLanguage(language) === "vi"
    ? [value.name_vi, value.name_vn, value.name_en, value.name]
    : [value.name_en, value.name, value.name_vi, value.name_vn];
  return candidates.find(candidate => candidate?.trim())?.trim() ?? "";
}

export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().trim();
}
