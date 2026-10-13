import { cn } from "@/shared/lib/utils";
import type { CustomOrderModel } from "../hooks/useCustomOrder";
import type { FormData } from "../custom-order.types";
export function OccasionStep(model: CustomOrderModel) {
  const {
    formData,
    setFormData,
    occasions
  } = model;
  return <div>
              <h2 className="font-display [font-size:1.8rem] text-lunara-ink [margin-bottom:6px]">What's the occasion?</h2>
              <p className="[font-size:0.85rem] text-lunara-body [margin-bottom:24px]">Choose the event for your arrangement</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {occasions.map(occ => <button key={occ} onClick={() => setFormData({
        ...formData,
        occasion: occ
      })} className={cn("py-3 px-4 rounded-xl transition-all [font-size:0.85rem] [cursor:pointer]", formData.occasion === occ ? "[border:1px_solid_#C17B8A]" : "[border:1px_solid_#F0DDD5]", formData.occasion === occ ? "bg-[#FDF0F3]" : "bg-white", formData.occasion === occ ? "text-lunara-rose-strong" : "text-lunara-body", formData.occasion === occ ? "[font-weight:500]" : "[font-weight:400]")}>
                    {occ}
                  </button>)}
              </div>
            </div>;
}
