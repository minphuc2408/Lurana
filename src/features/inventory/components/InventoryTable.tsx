import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Edit2, Trash2 } from "lucide-react";
import type { InventoryModel } from "../hooks/useInventory";
export function InventoryTable(model: InventoryModel) {
  const {
    filtered,
    stockStatus,
    openEdit,
    handleDelete
  } = model;
  return <div className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
        <div className="overflow-x-auto">
          <table className="[width:100%] [border-collapse:collapse]">
            <thead>
              <tr className="bg-lunara-surface">
                {["Product", "Category", "Price", "Stock", "Status", "Supplier", "Last Restocked", "Actions"].map(h => <th key={h} className="[text-align:left] [padding:13px_16px] [font-size:0.7rem] [letter-spacing:0.1em] [text-transform:uppercase] text-lunara-body [font-weight:500] [white-space:nowrap]">
                    {h}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
            const status = stockStatus(item);
            return <tr key={item.id} className="[border-top:1px_solid_#F0DDD5]">
                    <td className="[padding:13px_16px]">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="rounded-lg flex-shrink-0 [width:40px] [height:46px] [object-fit:cover]" />
                        <span className="font-display [font-size:0.95rem] text-lunara-ink [font-weight:500]">{item.name}</span>
                      </div>
                    </td>
                    <td className="[padding:13px_16px]">
                      <span className="px-3 py-1 rounded-full bg-lunara-blush text-lunara-rose-strong [font-size:0.7rem]">
                        {item.category}
                      </span>
                    </td>
                    <td className="[padding:13px_16px] [font-size:0.88rem] text-lunara-ink [font-weight:500]">₱{item.price.toLocaleString()}</td>
                    <td className="[padding:13px_16px]">
                      <div className="flex items-center gap-2">
                        <span className={cn("[font-size:0.9rem] [font-weight:500]", item.stock <= item.threshold ? "text-[#806000]" : "text-lunara-ink")}>{item.stock}</span>
                        <div className="h-1.5 w-14 rounded-full overflow-hidden bg-lunara-border">
                          <progress value={Math.min(item.stock / (item.threshold * 3) * 100, 100)} max="100" aria-label="Progress" className={cn("h-full rounded-full block w-full appearance-none overflow-hidden [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-current [&::-moz-progress-bar]:bg-current", item.stock === 0 ? "text-[#B42318]" : item.stock <= item.threshold ? "text-[#806000]" : "text-[#426647]")} />
                        </div>
                      </div>
                    </td>
                    <td className="[padding:13px_16px]">
                      <span className={cn("px-3 py-1 rounded-full [font-size:0.7rem] [font-weight:500]", colorClass(status.bg, "backgroundColor"), colorClass(status.color, "color"))}>
                        {status.label}
                      </span>
                    </td>
                    <td className="[padding:13px_16px] [font-size:0.82rem] text-lunara-body">{item.supplier}</td>
                    <td className="[padding:13px_16px] [font-size:0.78rem] text-lunara-body">{item.lastRestocked}</td>
                    <td className="[padding:13px_16px]">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-lunara-blush [border:none] [cursor:pointer] text-lunara-rose-strong">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FFF0F0] [border:none] [cursor:pointer] text-[#B42318]">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>;
          })}
            </tbody>
          </table>
        </div>
      </div>;
}
