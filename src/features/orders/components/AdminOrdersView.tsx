import { AdminOrdersTable } from "./AdminOrdersTable";
import { cn } from "@/shared/lib/utils";
import { Search } from "lucide-react";
import type { AdminOrdersModel } from "../hooks/useAdminOrders";
export function AdminOrdersView(model: AdminOrdersModel) {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    setPage,
    filtered,
    tabCount,
    tabs
  } = model;
  return <div className="p-6 font-body">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <p className="[font-size:0.78rem] text-lunara-body">
          {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
        </p>
        <div className="relative">
          <Search size={14} className="[position:absolute] [left:12px] [top:50%] [transform:translateY(-50%)] text-lunara-body" />
          <input type="text" placeholder="Search order ID or customer..." value={search} onChange={e => {
          setSearch(e.target.value);
          setPage(1);
        }} className="rounded-full pl-9 pr-4 py-2.5 [border:1px_solid_#F0DDD5] bg-white [font-size:0.82rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink [width:260px]" aria-label="Search order ID or customer..." />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 flex-wrap mb-5 p-1 rounded-xl bg-white [border:1px_solid_#F0DDD5] [width:fit-content]">
        {tabs.map(tab => <button key={tab} onClick={() => {
        setActiveTab(tab);
        setPage(1);
      }} className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-lg [border:none] [cursor:pointer] [font-size:0.78rem] [transition:all_0.15s]", activeTab === tab ? "bg-lunara-rose-strong" : "bg-transparent", activeTab === tab ? "text-white" : "text-lunara-body", activeTab === tab ? "[font-weight:500]" : "[font-weight:400]")}>
            {tab}
            <span className={cn("px-1.5 py-0.5 rounded-full [font-size:0.65rem] [font-weight:600]", activeTab === tab ? "bg-[rgba(255,255,255,0.25)]" : "bg-lunara-border", activeTab === tab ? "text-white" : "text-lunara-body")}>
              {tabCount(tab)}
            </span>
          </button>)}
      </div>

      {/* Orders Table */}
      <AdminOrdersTable {...model} />
    </div>;
}
