import { cn } from "@/shared/lib/utils";
import { Flower, Palette, Package, MessageSquare } from "lucide-react";
import type { CustomOrderModel } from "../hooks/useCustomOrder";
import type { FormData } from "../custom-order.types";
export function CustomOrderProgress(model: CustomOrderModel) {
  const {
    step,
    totalSteps
  } = model;
  return <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {[{
        icon: <Flower size={16} />,
        label: "Occasion"
      }, {
        icon: <Palette size={16} />,
        label: "Style"
      }, {
        icon: <Package size={16} />,
        label: "Details"
      }, {
        icon: <MessageSquare size={16} />,
        label: "Contact"
      }].map((s, i) => <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", i + 1 <= step ? "bg-lunara-rose-strong" : "bg-lunara-border", i + 1 <= step ? "text-white" : "text-lunara-body")}>
                  {s.icon}
                </div>
                <span className={cn("[font-size:0.72rem] [letter-spacing:0.05em]", i + 1 <= step ? "text-lunara-rose-strong" : "text-lunara-body")}>{s.label}</span>
              </div>)}
          </div>
          <div className="h-1 rounded-full bg-lunara-border">
            <progress value={(step - 1) / (totalSteps - 1) * 100} max="100" aria-label="Progress" className="h-full rounded-full transition-all duration-500 block w-full appearance-none overflow-hidden [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-current [&::-moz-progress-bar]:bg-current text-lunara-rose-strong" />
          </div>
        </div>;
}
