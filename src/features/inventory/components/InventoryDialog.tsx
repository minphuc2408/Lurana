import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { X, Save } from "lucide-react";
import type { InventoryModel } from "../hooks/useInventory";
export function InventoryDialog(model: InventoryModel) {
  const {
    modal,
    setModal,
    formData,
    setFormData,
    handleSave
  } = model;
  return <Dialog open={modal !== null} onOpenChange={open => !open && setModal(null)}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-lunara-border bg-white p-8 font-body sm:max-w-lg"><DialogDescription className="sr-only">Edit demo inventory. Changes apply to this page session.</DialogDescription>
            <div className="flex items-center justify-between mb-6">
              <DialogTitle className="font-display [font-size:1.5rem] text-lunara-ink">
                {modal === "add" ? "Add New Product" : "Edit Product"}
              </DialogTitle>

            </div>
            <div className="flex flex-col gap-4">
              {[{
          key: "name",
          label: "Product Name",
          type: "text"
        }, {
          key: "supplier",
          label: "Supplier",
          type: "text"
        }].map(f => <div key={f.key}>
                  <label className="[display:block] [font-size:0.74rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={`inventorydialog-1-${f.key}`}>{f.label}</label>
                  <input type={f.type} value={formData[f.key as keyof typeof formData] as string} onChange={e => setFormData({
            ...formData,
            [f.key]: e.target.value
          })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={`inventorydialog-1-${f.key}`} />
                </div>)}
              <div>
                <label className="[display:block] [font-size:0.74rem] text-lunara-body [letter-spacing:0.1em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={"inventorydialog-2"}>Category</label>
                <select value={formData.category} onChange={e => setFormData({
            ...formData,
            category: e.target.value
          })} className="w-full rounded-xl px-4 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={"inventorydialog-2"}>
                  {["Bouquets", "Arrangements", "Gift Sets", "Dried Flowers"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{
            key: "price",
            label: "Price (₱)"
          }, {
            key: "stock",
            label: "Stock Qty"
          }, {
            key: "threshold",
            label: "Min Threshold"
          }].map(f => <div key={f.key}>
                    <label className="[display:block] [font-size:0.7rem] text-lunara-body [letter-spacing:0.08em] [text-transform:uppercase] [margin-bottom:6px]" htmlFor={`inventorydialog-3-${f.key}`}>{f.label}</label>
                    <input type="number" value={formData[f.key as keyof typeof formData] as number} onChange={e => setFormData({
              ...formData,
              [f.key]: Number(e.target.value)
            })} className="w-full rounded-xl px-3 py-3 [border:1px_solid_#F0DDD5] [font-size:0.88rem] text-lunara-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lunara-ink bg-lunara-surface" id={`inventorydialog-3-${f.key}`} />
                  </div>)}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-full [border:1px_solid_#F0DDD5] bg-transparent text-lunara-body [cursor:pointer] [font-size:0.85rem]">
                  Cancel
                </button>
                <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-lunara-rose-strong text-white [border:none] [cursor:pointer] [font-size:0.85rem]">
                  <Save size={15} /> {modal === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </DialogContent></Dialog>;
}
