import { useLocale, getLocalizedName } from "@/shared/i18n";
import { ChevronRight, Tag } from "lucide-react";
import type { CartModel } from "../hooks/useCheckout";
export function CartSummary(model: CartModel) {
  const { t, language } = useLocale("cart");
  const {
    items,
    coupon,
    setCoupon,
    couponApplied,
    step,
    setStep,
    subtotal,
    deliveryFee,
    discount,
    total,
    handleApplyCoupon,
    advance,
    couponError,
    error
  } = model;
  return <div className="rounded-2xl p-6 sticky top-24 bg-white [border:1px_solid_#F0DDD5]">
            <h3 className="font-display [font-size:1.3rem] text-lunara-ink [margin-bottom:20px]">{t("Order Summary")}</h3>

            <div className="flex flex-col gap-3 pb-4 [border-bottom:1px_solid_#F0DDD5]">
              {items.map(item => <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 text-lunara-body">{getLocalizedName(item, language)} × {item.qty}</span>
                  <span className="shrink-0 text-lunara-ink">₱{(item.price * item.qty).toLocaleString()}</span>
                </div>)}
            </div>

            <div className="flex flex-col gap-2 py-4 [border-bottom:1px_solid_#F0DDD5]">
              <div className="flex justify-between text-sm">
                <span className="text-lunara-body">{t("Subtotal")}</span>
                <span className="text-lunara-ink">₱{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-lunara-body">{t("Delivery")}</span>
                <span className="text-lunara-ink">₱{deliveryFee}</span>
              </div>
              {couponApplied && <div className="flex justify-between text-sm">
                  <span className="text-[#426647]">{t("Discount (10%)")}</span>
                  <span className="text-[#426647]">-₱{discount.toLocaleString()}</span>
                </div>}
            </div>

            <div className="flex justify-between py-4 [border-bottom:1px_solid_#F0DDD5]">
              <span className="font-display [font-size:1.1rem] text-lunara-ink [font-weight:600]">{t("Total")}</span>
              <span className="font-display [font-size:1.3rem] text-lunara-rose-strong [font-weight:600]">₱{total.toLocaleString()}</span>
            </div>

            {/* Coupon */}
            {!couponApplied && <div className="flex gap-2 mt-4">
                <div className="min-w-0 flex items-center gap-2 flex-1 rounded-xl px-3 py-2 [border:1px_solid_#F0DDD5] bg-lunara-surface">
                  <Tag size={14} className="shrink-0 text-lunara-body" />
                  <input type="text" placeholder={t("Coupon code")} value={coupon} onChange={e => setCoupon(e.target.value)} className="min-w-0 [border:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink [font-size:0.82rem] text-lunara-ink bg-transparent [width:100%]" aria-label={t("Coupon code")} />
                </div>
                <button onClick={handleApplyCoupon} className="px-4 py-2 rounded-xl bg-[#F5E8E4] [border:none] text-lunara-rose-strong [font-size:0.82rem] [cursor:pointer] [font-weight:500]">
                  {t("Apply")}</button>
              </div>}
            {couponApplied && <p className="[font-size:0.78rem] text-[#426647] [margin-top:8px]">{t("✓ Coupon LUNARA10 applied!")}</p>}

            {couponError && <p role="alert" className="mt-3 text-sm text-[#B42318]">{t(couponError)}</p>}{error && <p role="alert" className="mt-3 text-sm text-[#B42318]">{t(error)}</p>}<button onClick={advance} className="w-full py-4 rounded-full mt-6 flex items-center justify-center gap-2 bg-lunara-rose-strong text-white [border:none] [cursor:pointer] [font-size:0.88rem] [letter-spacing:0.1em] [text-transform:uppercase] [font-weight:500]" disabled={items.length === 0}>
              {step === "cart" ? t("Proceed to Checkout") : t("Place Order")} <ChevronRight size={16} />
            </button>

            {step === "checkout" && <button onClick={() => setStep("cart")} className="w-full py-3 rounded-full mt-3 bg-transparent [border:1px_solid_#F0DDD5] text-lunara-body [cursor:pointer] [font-size:0.82rem]">
                {t("← Back to Cart")}</button>}

            <p className="[font-size:0.72rem] text-lunara-body [text-align:center] [margin-top:12px]">
              {t("Demo checkout · No payment is collected")}</p>
          </div>;
}
