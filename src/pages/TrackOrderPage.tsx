import { OrderLookupView, useOrderLookup } from '@/features/orders';
export default function TrackOrderPage() {
  const model = useOrderLookup();
  return <OrderLookupView {...model} />;
}
