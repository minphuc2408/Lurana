import { Link } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { LunarraMark } from './LunarraMark';
import { DialogDescription, DialogTitle } from '@/shared/ui/dialog';

export function FeatureUnavailable({ variant = 'page', description, title }: { variant?: 'page' | 'dialog'; description?: string; title?: string } = {}) {
  const { t } = useLocale("common");
  const dialog = variant === 'dialog';
  const Heading = dialog ? DialogTitle : 'h1';
  const Description = dialog ? DialogDescription : 'p';
  return <section data-feature-unavailable className={dialog ? 'flex flex-col items-center text-center' : 'mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center'}>
    <LunarraMark data-notice-flower width={48} height={48} className="mb-6 shrink-0 text-lunara-ink" />
    <Heading className={`p-0 text-center font-display ${dialog ? 'text-2xl' : 'text-4xl'} leading-tight font-medium text-lunara-ink`}>{title || t('Feature unavailable')}</Heading>
    <Description className="mt-4 max-w-prose text-center text-base leading-7 text-lunara-body">{description || t('Feature pending API')}</Description>
    {!dialog && <Link to="/shop" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[2px] bg-lunara-rose-strong px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-lunara-primary-hover">{t('Browse collection')}</Link>}
  </section>;
}
