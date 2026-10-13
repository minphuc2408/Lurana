import { CartSummary } from "./CartSummary";
import { CheckoutForm } from "./CheckoutForm";
import { DeliveryOptions } from "./DeliveryOptions";
import { CartItemList } from "./CartItemList";
import { CheckoutConfirmation } from "./CheckoutConfirmation";
import { cn } from "@/shared/lib/utils";
import { Link } from "react-router";
import { ShoppingBag, ChevronRight } from "lucide-react";
import type { CartModel } from "../hooks/useCheckout";
export function CartView(model: CartModel) {
  const {
    items,
    step
  } = model;
  if (step === "confirmation") {
    return <CheckoutConfirmation {...model} />;
  }
  return <div className="bg-lunara-cream [min-height:100vh] font-body">
      {/* Header */}
      <div className="[background:linear-gradient(135deg,_#F9EDE9_0%,_#F5E8E4_100%)] [padding:50px_24px_30px]">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display [font-size:clamp(2rem,_4vw,_3rem)] [font-weight:600] text-lunara-ink">
            {step === "cart" ? "Your Cart" : "Checkout"}
          </h1>
          {/* Breadcrumb steps */}
          <div className="flex items-center gap-2 mt-3">
            {["cart", "checkout"].map((s, i) => <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center [font-size:0.75rem] [font-weight:600]", step === s || s === "cart" && step === "checkout" ? "bg-lunara-rose-strong" : "bg-lunara-border", step === s || s === "cart" && step === "checkout" ? "text-white" : "text-lunara-body")}>
                    {i + 1}
                  </div>
                  <span className={cn("[font-size:0.82rem] [text-transform:capitalize]", step === s ? "text-lunara-rose-strong" : "text-lunara-body")}>{s}</span>
                </div>
                {i < 1 && <ChevronRight size={14} className="text-lunara-body" />}
              </div>)}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
        {/* Left: Cart or Checkout Form */}
        <div className="lg:col-span-2">
          {step === "cart" ? <>
              {items.length === 0 ? <div className="text-center py-20">
                  <ShoppingBag size={48} className="text-lunara-rose-light [margin:0_auto_16px]" />
                  <p className="text-lunara-body [font-size:1rem]">Your cart is empty.</p>
                  <Link to="/shop" className="text-lunara-rose-strong [font-size:0.88rem] [text-decoration:none]">Browse flowers →</Link>
                </div> : <CartItemList {...model} />}

              {/* Delivery Options */}
              <DeliveryOptions {...model} />
            </> : /* Checkout Form */<CheckoutForm {...model} />}
        </div>

        {/* Right: Order Summary */}
        <div>
          <CartSummary {...model} />
        </div>
      </div>
    </div>;
}
