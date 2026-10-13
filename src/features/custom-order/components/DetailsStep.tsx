import { cn } from "@/shared/lib/utils";
import { Calendar } from "lucide-react";
import type { CustomOrderModel } from "../hooks/useCustomOrder";
import type { FormData } from "../custom-order.types";
export function DetailsStep(model: CustomOrderModel) {
  const {
    formData,
    setFormData,
    sizes
  } = model;
  return <div>
              <h2 className="font-display [font-size:1.8rem] text-lunara-ink [margin-bottom:6px]">Arrangement details</h2>
              <p className="[font-size:0.85rem] text-lunara-body [margin-bottom:24px]">Size, budget, and delivery date</p>

              <div className="mb-8">
                <h3 className="[font-size:0.82rem] [letter-spacing:0.12em] [text-transform:uppercase] text-lunara-body [margin-bottom:16px]">Arrangement Size</h3>
                <div className="grid grid-cols-2 gap-3">
                  {sizes.map(s => <button key={s.name} onClick={() => setFormData({
          ...formData,
          size: s.name
        })} className={cn("p-4 rounded-xl text-left transition-all [cursor:pointer]", formData.size === s.name ? "[border:1px_solid_#C17B8A]" : "[border:1px_solid_#F0DDD5]", formData.size === s.name ? "bg-[#FDF0F3]" : "bg-white")}>
                      <div className="font-display [font-size:1.1rem] text-lunara-ink [font-weight:500]">{s.name}</div>
                      <div className="[font-size:0.75rem] text-lunara-body [margin-top:2px]">{s.desc}</div>
                      <div className="[font-size:0.82rem] text-lunara-rose-strong [margin-top:4px] [font-weight:500]">{s.price}</div>
                    </button>)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="[display:block] [font-size:0.78rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"detailsstep-1"}>
                    <Calendar size={12} className="[display:inline] [margin-right:4px]" /> Needed By
                  </label>
                  <input type="date" value={formData.date} onChange={e => setFormData({
          ...formData,
          date: e.target.value
        })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"detailsstep-1"} />
                </div>
                <div>
                  <label className="[display:block] [font-size:0.78rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"detailsstep-2"}>Recipient Name</label>
                  <input type="text" placeholder="For whom is this?" value={formData.recipient} onChange={e => setFormData({
          ...formData,
          recipient: e.target.value
        })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"detailsstep-2"} />
                </div>
                <div className="col-span-2">
                  <label className="[display:block] [font-size:0.78rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"detailsstep-3"}>Additional Notes</label>
                  <textarea rows={4} placeholder="Describe your vision, any allergies, special wishes..." value={formData.message} onChange={e => setFormData({
          ...formData,
          message: e.target.value
        })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface [resize:none]" id={"detailsstep-3"} />
                </div>
              </div>
            </div>;
}
