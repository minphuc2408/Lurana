import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useCodCheckout, type CodCheckoutModel } from './hooks/useCodCheckout';

const CheckoutContext = createContext<CodCheckoutModel | null>(null);
export function CheckoutFlowProvider({ children }: { children: ReactNode }) {
  const model = useCodCheckout();
  return <CheckoutContext.Provider value={model}>{children}</CheckoutContext.Provider>;
}
export function useCheckoutFlow() {
  const model = useContext(CheckoutContext);
  if (!model) throw new Error('CheckoutFlowProvider is required');
  return model;
}
