import { useLocale, getLocalizedName } from "@/shared/i18n";
import { InventoryTable } from "./InventoryTable";
import { InventoryDialog } from "./InventoryDialog";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Plus, Search, AlertTriangle, Package, TrendingDown, RefreshCw } from "lucide-react";
import type { InventoryModel } from "../hooks/useInventory";
export function InventoryView(model: InventoryModel) {
  const { t, language } = useLocale("inventory");
  const {
    stockItems,
    search,
    setSearch,
    category,
    setCategory,
    modal,
    lowStock,
    openAdd,
    categories
  } = model;
  return <div className="p-6 font-body">
      {/* Page Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="[font-size:0.72rem] text-lunara-body">{t("Manage your product inventory")}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-lunara-rose-strong text-white [border:none] [cursor:pointer] [font-size:0.82rem]">
          <Plus size={15} /> {t("Add Product")}</button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && <div className="flex items-start gap-3 p-4 rounded-2xl mb-5 bg-[#FDF8E8] [border:1px_solid_#F0E0A0]">
          <AlertTriangle size={17} className="text-[#806000] [flex-shrink:0] [margin-top:2px]" />
          <div>
            <span className="[font-size:0.85rem] text-lunara-ink [font-weight:500]">{t("Stock Alert:")}{" "}</span>
            <span className="[font-size:0.82rem] text-lunara-body">
              {t("stockAlert", { count: lowStock.length })}{" "}{lowStock.map(i => getLocalizedName(i, language)).join(", ")}
            </span>
          </div>
        </div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[{
        label: "Total Products",
        value: stockItems.length,
        icon: <Package size={17} />,
        color: "#C17B8A",
        bg: "#FDF0F3"
      }, {
        label: "In Stock",
        value: stockItems.filter(i => i.stock > i.threshold).length,
        icon: <RefreshCw size={17} />,
        color: "#7A9E7E",
        bg: "#EDF7EF"
      }, {
        label: "Low Stock",
        value: lowStock.filter(i => i.stock > 0).length,
        icon: <TrendingDown size={17} />,
        color: "#D4A020",
        bg: "#FDF8E8"
      }, {
        label: "Out of Stock",
        value: stockItems.filter(i => i.stock === 0).length,
        icon: <AlertTriangle size={17} />,
        color: "#E8453C",
        bg: "#FFF0F0"
      }].map(s => <div key={s.label} className="rounded-2xl p-5 bg-white [border:1px_solid_#F0DDD5]">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", colorClass(s.bg, "backgroundColor"))}>
              <span className={cn("", colorClass(s.color, "color"))}>{s.icon}</span>
            </div>
            <div className="font-display [font-size:2rem] [font-weight:600] text-lunara-ink [line-height:1]">{s.value}</div>
            <div className="[font-size:0.78rem] text-lunara-body [margin-top:4px]">{t(s.label)}</div>
          </div>)}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="[position:absolute] [left:14px] [top:50%] [transform:translateY(-50%)] text-lunara-body" />
          <input type="text" placeholder={t("Search products...")} value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-full pl-10 pr-4 py-2.5 [border:1px_solid_#F0DDD5] bg-white [font-size:0.85rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink" aria-label={t("Search products...")} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => <button key={cat} onClick={() => setCategory(cat)} className={cn("px-4 py-2 rounded-full [border:1px_solid] [font-size:0.78rem] [cursor:pointer]", category === cat ? "border-lunara-rose" : "border-lunara-border", category === cat ? "bg-lunara-rose-strong" : "bg-white", category === cat ? "text-white" : "text-lunara-body")}>
              {t(cat)}
            </button>)}
        </div>
      </div>

      {/* Stock Table */}
      <InventoryTable {...model} />

      {/* Add/Edit Modal */}
      {modal && <InventoryDialog {...model} />}
    </div>;
}
