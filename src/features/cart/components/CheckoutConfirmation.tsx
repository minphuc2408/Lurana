import { Link } from "react-router";
import type { CartModel } from "../hooks/useCheckout";
export function CheckoutConfirmation(model: CartModel) {
  const {
    demoReference
  } = model;
  return <div className="bg-lunara-cream [min-height:100vh] [display:flex] [align-items:center] [justify-content:center] font-body">
        <div className="text-center px-6 py-12 rounded-3xl shadow-lg bg-white [max-width:480px] [width:100%] [border:1px_solid_#F0DDD5]">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-lunara-blush">
            <span className="[font-size:2rem]">🌸</span>
          </div>
          <h2 className="font-display [font-size:2rem] [font-weight:600] text-lunara-ink [margin-bottom:12px]">
            Demo Checkout Complete
          </h2>
          <p className="text-lunara-body [font-size:0.92rem] [margin-bottom:8px] [line-height:1.7]">
            This is a checkout preview. No order was placed, payment taken, or email sent.
          </p>
          <p className="text-lunara-body [font-size:0.82rem] [margin-bottom:32px]">Preview reference: {demoReference}</p>
          <div className="flex flex-col gap-3">
            <Link to="/orders" className="py-3 rounded-full text-center bg-lunara-rose-strong text-white [text-decoration:none] [font-size:0.85rem]">
              View Demo Orders
            </Link>
            <Link to="/shop" className="py-3 rounded-full text-center [border:1px_solid_#C17B8A] text-lunara-rose-strong [text-decoration:none] [font-size:0.85rem]">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>;
}
