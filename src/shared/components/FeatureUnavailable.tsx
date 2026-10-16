import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
export function FeatureUnavailable({ inline = false, description }: { inline?: boolean; description?: string } = {}) {
  const { t } = useLocale("common");
  const Heading = inline ? 'h2' : 'h1';
  return <section data-feature-unavailable className={inline ? 'py-4 text-center' : 'mx-auto max-w-3xl px-6 py-24 text-center'}><Heading className={`font-display ${inline ? 'text-2xl' : 'text-4xl'} font-semibold text-lunara-ink`}>{t('Feature unavailable')}</Heading><p className="my-6 leading-7 text-lunara-body">{description || t('Feature pending API')}</p>{!inline && <Link to="/shop" className="inline-block rounded-full bg-lunara-rose-strong px-8 py-3 text-white">{t('Browse collection')}</Link>}</section>;
}
