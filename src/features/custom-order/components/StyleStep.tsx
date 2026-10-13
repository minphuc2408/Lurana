import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import type { CustomOrderModel } from "../hooks/useCustomOrder";
import type { FormData } from "../custom-order.types";
export function StyleStep(model: CustomOrderModel) {
  const {
    formData,
    toggleArray,
    colorSchemes,
    flowerTypes
  } = model;
  return <div>
              <h2 className="font-display [font-size:1.8rem] text-lunara-ink [margin-bottom:6px]">Choose your style</h2>
              <p className="[font-size:0.85rem] text-lunara-body [margin-bottom:24px]">Select color palette and flower preferences</p>

              <div className="mb-8">
                <h3 className="[font-size:0.82rem] [letter-spacing:0.12em] [text-transform:uppercase] text-lunara-body [margin-bottom:16px]">Color Palette</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {colorSchemes.map(scheme => <button key={scheme.name} onClick={() => toggleArray("colors", scheme.name)} className={cn("flex items-center gap-3 p-4 rounded-xl transition-all [cursor:pointer] [text-align:left]", formData.colors.includes(scheme.name) ? "[border:1px_solid_#C17B8A]" : "[border:1px_solid_#F0DDD5]", formData.colors.includes(scheme.name) ? "bg-[#FDF0F3]" : "bg-white")}>
                      <div className="flex gap-1">
                        {scheme.colors.map((c, i) => <div key={i} className={cn("w-5 h-5 rounded-full [border:1px_solid_rgba(0,0,0,0.1)]", colorClass(c, "backgroundColor"))} />)}
                      </div>
                      <span className="[font-size:0.8rem] text-lunara-ink">{scheme.name}</span>
                    </button>)}
                </div>
              </div>

              <div>
                <h3 className="[font-size:0.82rem] [letter-spacing:0.12em] [text-transform:uppercase] text-lunara-body [margin-bottom:16px]">Preferred Flowers</h3>
                <div className="flex flex-wrap gap-2">
                  {flowerTypes.map(flower => <button key={flower} onClick={() => toggleArray("flowers", flower)} className={cn("px-4 py-2 rounded-full transition-all [font-size:0.82rem] [cursor:pointer]", formData.flowers.includes(flower) ? "[border:1px_solid_#C17B8A]" : "[border:1px_solid_#F0DDD5]", formData.flowers.includes(flower) ? "bg-lunara-rose-strong" : "bg-white", formData.flowers.includes(flower) ? "text-white" : "text-lunara-body")}>
                      {flower}
                    </button>)}
                </div>
              </div>
            </div>;
}
