import type { ComponentProps, ReactNode } from 'react';
import { useLocale } from '@/shared/i18n';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/shared/ui/dialog';
import { FeatureUnavailable } from './FeatureUnavailable';

type FeatureUnavailableDialogProps = {
  description: string;
  title?: string;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>['onCloseAutoFocus'];
};

/** Shared notice frame; callers retain their own copy and business state. */
export function FeatureUnavailableDialog({ description, title, trigger, open, onOpenChange, onCloseAutoFocus }: FeatureUnavailableDialogProps) {
  const { t } = useLocale('common');
  return <Dialog open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
    <DialogContent data-feature-notice onCloseAutoFocus={onCloseAutoFocus} className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-[2px] border-0 bg-lunara-cream px-6 pt-10 pb-6 font-body text-lunara-ink shadow-xl sm:px-8 sm:pt-12 sm:pb-8">
      <FeatureUnavailable variant="dialog" title={title} description={description} />
      <DialogClose asChild><button type="button" data-notice-close className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-[2px] bg-lunara-rose-strong px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-lunara-primary-hover">{t('Close')}</button></DialogClose>
    </DialogContent>
  </Dialog>;
}
