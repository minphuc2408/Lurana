import { CustomersTable } from "./CustomersTable";
import { cn } from "@/shared/lib/utils";
import { colorClass } from "@/shared/lib/color-classes";
import { Search, Package, UserCheck, Star } from "lucide-react";
import type { AdminCustomersModel } from "../hooks/useAdminCustomers";
export function AdminCustomersView(model: AdminCustomersModel) {
  const {
    search,
    setSearch,
    filter,
    setFilter,
    totalSpent,
    vipCount,
    activeCount,
    customers
  } = model;
  return <div className="p-6 font-body">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[{
        label: "Total Customers",
        value: customers.length,
        icon: <UserCheck size={18} />,
        color: "#5B8DD9",
        bg: "#EDF3FC"
      }, {
        label: "Active Customers",
        value: activeCount,
        icon: <UserCheck size={18} />,
        color: "#7A9E7E",
        bg: "#EDF7EF"
      }, {
        label: "VIP Members",
        value: vipCount,
        icon: <Star size={18} />,
        color: "#D4A020",
        bg: "#FDF8E8"
      }, {
        label: "Total Revenue",
        value: `₱${totalSpent.toLocaleString()}`,
        icon: <Package size={18} />,
        color: "#C17B8A",
        bg: "#FDF0F3"
      }].map(s => <div key={s.label} className="rounded-2xl p-5 bg-white [border:1px_solid_#F0DDD5]">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colorClass(s.bg, "backgroundColor"))}>
              <span className={cn("", colorClass(s.color, "color"))}>{s.icon}</span>
            </div>
            <div className="font-display [font-size:1.7rem] [font-weight:600] text-lunara-ink [line-height:1]">
              {s.value}
            </div>
            <div className="[font-size:0.78rem] text-lunara-body [margin-top:4px]">{s.label}</div>
          </div>)}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white [border:1px_solid_#F0DDD5] [width:fit-content]">
          {(["All", "Active", "Inactive", "VIP"] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-1.5 rounded-lg [border:none] [cursor:pointer] [font-size:0.78rem] [transition:all_0.15s]", filter === f ? "bg-lunara-rose-strong" : "bg-transparent", filter === f ? "text-white" : "text-lunara-body", filter === f ? "[font-weight:500]" : "[font-weight:400]")}>
              {f}
            </button>)}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="[position:absolute] [left:12px] [top:50%] [transform:translateY(-50%)] text-lunara-body" />
          <input type="text" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-full pl-9 pr-4 py-2.5 [border:1px_solid_#F0DDD5] bg-white [font-size:0.82rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink [width:240px]" aria-label="Search name or email..." />
        </div>
      </div>

      {/* Customer Table */}
      <CustomersTable {...model} />
    </div>;
}
