import { useLocale } from "@/shared/i18n";
import { OrderList } from "./OrderList";
import { cn } from "@/shared/lib/utils";
import { Search } from "lucide-react";
import type { MyOrdersModel } from "../hooks/useMyOrders";
import type { OrderStatus } from "../my-orders.types";
export function MyOrdersView(model: MyOrdersModel) {
  const { t } = useLocale("orders");
  const {
    search,
    setSearch,
    filter,
    setFilter
  } = model;
  return <div className="bg-lunara-cream [min-height:100vh] font-body">
      {/* Header */}
      <div className="[background:linear-gradient(135deg,_#F9EDE9_0%,_#F5E8E4_100%)] [padding:60px_24px_40px]">
        <div className="max-w-4xl mx-auto">
          <span className="[font-size:0.75rem] [letter-spacing:0.2em] [text-transform:uppercase] text-lunara-rose-strong">{t("Your History")}</span>
          <h1 className="font-display [font-size:clamp(2rem,_4vw,_3rem)] [font-weight:600] text-lunara-ink [margin-top:8px]">
            {t("Order History")}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="[position:absolute] [left:16px] [top:50%] [transform:translateY(-50%)] text-lunara-body" />
            <input type="text" placeholder={t("Search orders...")} value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-full pl-10 pr-4 py-3 [border:1px_solid_#F0DDD5] bg-white [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink" aria-label={t("Search orders...")} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["All", "Processing", "In Transit", "Delivered"] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-2 rounded-full [border:1px_solid] [font-size:0.8rem] [cursor:pointer]", filter === f ? "border-lunara-rose" : "border-lunara-border", filter === f ? "bg-lunara-rose-strong" : "bg-white", filter === f ? "text-white" : "text-lunara-body")}>
                {t(f)}
              </button>)}
          </div>
        </div>

        {/* Orders List */}
        <OrderList {...model} />
      </div>
    </div>;
}
