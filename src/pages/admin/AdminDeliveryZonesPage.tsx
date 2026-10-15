import { AdminDeliveryZonesView, useAdminDeliveryZones } from '@/features/admin';
export default function AdminDeliveryZonesPage() {
  const model = useAdminDeliveryZones();
  return <AdminDeliveryZonesView {...model} />;
}
