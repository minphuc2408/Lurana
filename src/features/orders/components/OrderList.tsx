import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Package, Truck, CheckCircle, Clock, ChevronDown, ChevronUp, MapPin, Star } from "lucide-react";
import type { MyOrdersModel } from "../hooks/useMyOrders";
import type { OrderStatus } from "../my-orders.types";
const statusConfig: Record<OrderStatus, {
  color: string;
  bg: string;
  icon: React.ReactNode;
}> = {
  Delivered: {
    color: "#7A9E7E",
    bg: "#EDF7EF",
    icon: <CheckCircle size={14} />
  },
  "In Transit": {
    color: "#5B8DD9",
    bg: "#EDF3FC",
    icon: <Truck size={14} />
  },
  Processing: {
    color: "#C17B8A",
    bg: "#FDF0F3",
    icon: <Clock size={14} />
  },
  Cancelled: {
    color: "#9A7080",
    bg: "#F5F0F0",
    icon: <Package size={14} />
  }
};
export function OrderList(model: MyOrdersModel) {
  const {
    expanded,
    setExpanded,
    filtered,
    total
  } = model;
  return <div className="flex flex-col gap-4">
          {filtered.length === 0 && <div className="text-center py-16">
              <Package size={40} className="text-lunara-rose-light [margin:0_auto_12px]" />
              <p className="text-lunara-body">No orders found.</p>
            </div>}

          {filtered.map(order => {
      const cfg = statusConfig[order.status];
      const isExpanded = expanded === order.id;
      return <div key={order.id} className="rounded-2xl overflow-hidden bg-white [border:1px_solid_#F0DDD5]">
                {/* Header Row */}
                <button className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-3 cursor-pointer w-full text-left" onClick={() => setExpanded(isExpanded ? null : order.id)} type="button" aria-expanded={isExpanded}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden">
                      <img src={order.items[0].image} alt="" className="[width:100%] [height:100%] [object-fit:cover]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display [font-size:1rem] text-lunara-ink [font-weight:500]">{order.id}</span>
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full [font-size:0.7rem] [font-weight:500]", colorClass(cfg.bg, "backgroundColor"), colorClass(cfg.color, "color"))}>
                          {cfg.icon} {order.status}
                        </span>
                      </div>
                      <div className="[font-size:0.78rem] text-lunara-body [margin-top:2px]">
                        {order.date} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display [font-size:1.1rem] text-lunara-rose-strong [font-weight:600]">
                      ₱{total(order).toLocaleString()}
                    </span>
                    {isExpanded ? <ChevronUp size={18} className="text-lunara-body" /> : <ChevronDown size={18} className="text-lunara-body" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && <div className="[border-top:1px_solid_#F0DDD5] [padding:20px]">
                    {/* Items */}
                    <div className="flex flex-col gap-3 mb-5">
                      {order.items.map((item, i) => <div key={i} className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="rounded-lg [width:52px] [height:60px] [object-fit:cover]" />
                          <div className="flex-1">
                            <div className="font-display [font-size:0.95rem] text-lunara-ink">{item.name}</div>
                            <div className="[font-size:0.78rem] text-lunara-body">Qty: {item.qty}</div>
                          </div>
                          <span className="[font-size:0.9rem] text-lunara-rose-strong">₱{(item.price * item.qty).toLocaleString()}</span>
                        </div>)}
                    </div>

                    {/* Tracking */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={14} className="text-lunara-rose-strong" />
                        <span className="[font-size:0.8rem] text-lunara-body">{order.address}</span>
                      </div>
                      <div className="flex items-center gap-0">
                        {order.tracking.map((step, i) => <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="flex items-center w-full">
                              <div className={cn("", `w-full h-1 ${i === 0 ? "hidden" : ""}`, i < order.trackStep ? "bg-lunara-rose-strong" : "bg-lunara-border")} />
                              <div className={cn("w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center [z-index:1]", i < order.trackStep ? "bg-lunara-rose-strong" : "bg-lunara-border")}>
                                {i < order.trackStep && <CheckCircle size={12} color="white" />}
                              </div>
                              <div className={cn("", `w-full h-1 ${i === order.tracking.length - 1 ? "hidden" : ""}`, i + 1 < order.trackStep ? "bg-lunara-rose-strong" : "bg-lunara-border")} />
                            </div>
                            <span className={cn("[font-size:0.62rem] [margin-top:4px] [text-align:center]", i < order.trackStep ? "text-lunara-rose-strong" : "text-lunara-body")}>
                              {step}
                            </span>
                          </div>)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 [border-top:1px_solid_#F0DDD5]">
                      {order.status === "Delivered" && !order.rating && <button className="flex items-center gap-1 px-4 py-2 rounded-full bg-lunara-blush [border:none] text-lunara-rose-strong [cursor:pointer] [font-size:0.8rem]">
                          <Star size={13} /> Write a Review
                        </button>}
                      {order.rating && <div className="flex items-center gap-1 px-4 py-2 rounded-full bg-[#EDF7EF]">
                          {Array.from({
                length: order.rating
              }).map((_, i) => <Star key={i} size={12} fill="#7A9E7E" color="#7A9E7E" />)}
                          <span className="[font-size:0.75rem] text-[#426647] [margin-left:4px]">Reviewed</span>
                        </div>}
                      <button className="flex items-center gap-1 px-4 py-2 rounded-full [border:1px_solid_#F0DDD5] bg-transparent text-lunara-body [cursor:pointer] [font-size:0.8rem]">
                        Reorder
                      </button>
                      <button className="flex items-center gap-1 px-4 py-2 rounded-full [border:1px_solid_#F0DDD5] bg-transparent text-lunara-body [cursor:pointer] [font-size:0.8rem]">
                        Get Receipt
                      </button>
                    </div>
                  </div>}
              </div>;
    })}
        </div>;
}
