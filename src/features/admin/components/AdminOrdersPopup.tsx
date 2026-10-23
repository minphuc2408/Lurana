import type { RefObject } from 'react';
import { useLocale } from '@/shared/i18n';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { useAdminApiOrders } from '../hooks/useAdminApiOrders';
import { AdminApiOrdersView } from './AdminApiOrdersView';
import { AdminOrderDetailsDialog } from './AdminOrderDetailsDialog';

export function AdminOrdersPopup({ initialOrder, onClose, returnFocusRef }: {
  initialOrder?: string;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement>;
}) {
  const { t } = useLocale('admin');
  const model = useAdminApiOrders({ initialOrder, loadList: !initialOrder, followQuery: false });
  if (initialOrder) return <AdminOrderDetailsDialog model={model} onClose={onClose} returnFocusRef={returnFocusRef} />;
  return <Dialog open onOpenChange={open => { if (!open && !model.pending) onClose(); }}>
    <DialogContent data-testid="admin-orders-dialog" data-admin-workspace-dialog showCloseButton={!model.pending}
      onCloseAutoFocus={event => { event.preventDefault(); returnFocusRef.current?.focus(); }}
      className="border-lunara-border bg-lunara-admin-panel font-body text-lunara-ink">
      <div className="admin-dialog-heading"><DialogTitle>{t('Orders')}</DialogTitle></div>
      <DialogDescription className="sr-only">{t('Search orders')}</DialogDescription>
      <AdminApiOrdersView {...model} embedded />
    </DialogContent>
  </Dialog>;
}
