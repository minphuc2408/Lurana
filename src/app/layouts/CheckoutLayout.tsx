import { Outlet } from 'react-router';
import { CheckoutFlowProvider } from '@/features/cart';

export function CheckoutLayout() {
  return <CheckoutFlowProvider><div className="font-body text-lunara-body [--lunara-ink:var(--lunara-editorial-ink)] [--lunara-body:var(--lunara-editorial-body)] [--lunara-border:var(--lunara-editorial-border)] [--lunara-surface:var(--lunara-editorial-surface)] [--lunara-blush:var(--lunara-editorial-blush)]"><Outlet /></div></CheckoutFlowProvider>;
}
