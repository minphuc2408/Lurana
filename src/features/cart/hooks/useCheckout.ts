import { useState } from "react";
import { useCart } from "./useCart";
import { deliveryOptions } from "../data/cart.data";
import { calculateCart, validateCheckout } from "../cart.service";
import type { CheckoutForm, Step } from "../cart.types";
export function useCheckout() {
  const cart = useCart();
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("cart");
  const [delivery, setDelivery] = useState("standard");
  const [form, setForm] = useState<CheckoutForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: ""
  });
  const [demoReference, setDemoReference] = useState("");
  const handleApplyCoupon = () => {
    const valid = coupon.toLowerCase() === "lunara10";
    setCouponApplied(valid);
    setCouponError(valid ? "" : "This coupon code is not valid.");
  };
  const advance = () => {
    if (!cart.items.length) return;
    if (step === "cart") {
      setStep("checkout");
      return;
    }
    const {
      notes: _notes,
      ...required
    } = form;
    const message = validateCheckout(required);
    setError(message);
    if (message) return;
    setDemoReference(`DEMO-${Math.floor(Math.random() * 9000 + 1000)}`);
    setStep("confirmation");
  };
  return {
    ...cart,
    coupon,
    setCoupon,
    couponApplied,
    couponError,
    error,
    step,
    setStep,
    delivery,
    setDelivery,
    form,
    setForm,
    deliveryOptions,
    handleApplyCoupon,
    advance,
    demoReference,
    ...calculateCart(cart.items, delivery, couponApplied, deliveryOptions)
  };
}
export type CartModel = ReturnType<typeof useCheckout>;
