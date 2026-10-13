import { useLocale } from "@/shared/i18n";
export function RouteLoading() {
  const { t } = useLocale("common");
  return <div role="status" className="p-8 text-center font-body text-lunara-body">{t("Loading…")}</div>;
}
