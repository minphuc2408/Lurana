import { useLocale } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Truck } from "lucide-react";
import type { CartModel } from "../hooks/useCheckout";
export function DeliveryOptions(model: CartModel) {
  const { t } = useLocale("cart");
  const {
    delivery,
    setDelivery,
    deliveryOptions
  } = model;
  return <div className="mt-8 p-6 rounded-2xl bg-white [border:1px_solid_#F0DDD5]">
                <h3 className="font-display [font-size:1.2rem] text-lunara-ink [margin-bottom:16px] [display:flex] [align-items:center] [gap:8px]">
                  <Truck size={18} className="text-lunara-rose-strong" /> {t("Delivery Options")}</h3>
                <div className="flex flex-col gap-3">
                  {deliveryOptions.map(opt => <label key={opt.id} className={cn("flex items-center justify-between p-4 rounded-xl cursor-pointer [transition:all_0.2s]", delivery === opt.id ? "[border:1px_solid_#C17B8A]" : "[border:1px_solid_#F0DDD5]", delivery === opt.id ? "bg-[#FDF0F3]" : "bg-transparent")}>
                      <div className="min-w-0 flex items-center gap-3">
                        <input type="radio" name="delivery" value={opt.id} checked={delivery === opt.id} onChange={() => setDelivery(opt.id)} className="accent-lunara-rose" />
                        <div className="min-w-0">
                          <div className="[font-size:0.88rem] text-lunara-ink [font-weight:500]">{t(opt.label)}</div>
                          <div className="[font-size:0.76rem] text-lunara-body">{t(opt.sublabel)}</div>
                        </div>
                      </div>
                      <span className="shrink-0 ml-2 [font-size:0.88rem] text-lunara-rose-strong [font-weight:500]">₱{opt.price}</span>
                    </label>)}
                </div>
              </div>;
}
