import { Outlet } from 'react-router';
import { CheckoutFlowProvider } from '@/features/cart';

export function CheckoutLayout() {
  return <CheckoutFlowProvider><div className="font-body text-lunara-body [--lunara-ink:#4B2432] [--lunara-body:#746B69] [--lunara-border:#E7DCD3] [--lunara-surface:#FAF7F2] [--lunara-blush:#F3E7DF]"><Outlet /></div></CheckoutFlowProvider>;
}
