import { Minus, Plus, X } from "lucide-react";
import type { CartModel } from "../hooks/useCheckout";
export function CartItemList(model: CartModel) {
  const {
    items,
    updateQty,
    removeItem
  } = model;
  return <div className="flex flex-col gap-4">
                  {items.map(item => <div key={item.id} className="flex gap-4 p-5 rounded-2xl bg-white [border:1px_solid_#F0DDD5]">
                      <img src={item.image} alt={item.name} className="rounded-xl [width:100px] [height:120px] [object-fit:cover] [flex-shrink:0]" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-display [font-size:1.1rem] text-lunara-ink [font-weight:500]">{item.name}</h3>
                            <span className="[font-size:0.78rem] text-lunara-body">Size: {item.size}</span>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="bg-transparent [border:none] [cursor:pointer] text-lunara-body" aria-label={`Remove ${item.name}`}>
                            <X size={18} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-3 rounded-full px-1 py-1 [border:1px_solid_#F0DDD5]">
                            <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent [border:none] [cursor:pointer] text-lunara-body" aria-label="Decrease quantity">
                              <Minus size={14} />
                            </button>
                            <span className="[font-size:0.9rem] text-lunara-ink [min-width:20px] [text-align:center]">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent [border:none] [cursor:pointer] text-lunara-body" aria-label="Increase quantity">
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-display [font-size:1.1rem] [font-weight:600] text-lunara-rose-strong">
                            ₱{(item.price * item.qty).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>)}
                </div>;
}
