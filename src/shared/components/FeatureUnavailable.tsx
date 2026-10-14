import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
export function FeatureUnavailable() {
  const { t } = useLocale("common");
  return <section data-feature-unavailable className="mx-auto max-w-3xl px-6 py-24 text-center"><h1 className="font-display text-4xl font-semibold text-lunara-ink">{t('Feature unavailable')}</h1><p className="my-6 leading-7 text-lunara-body">{t('Feature pending API')}</p><Link to="/shop" className="inline-block rounded-full bg-lunara-rose-strong px-8 py-3 text-white">{t('Browse collection')}</Link></section>;
}
