import { InventoryView, useInventory } from "@/features/inventory";
export default function AdminStockPage() {
  const model = useInventory();
  return <InventoryView {...model} />;
}
