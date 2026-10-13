import { getProduct, getProducts } from "@/features/shop";
import { inventoryMetadata } from "./data/inventory-metadata";
import { categories } from "./data/inventory.data";
import type { StockItem } from "./inventory.types";
export function getInventoryDemoData() {
  const initialStock: StockItem[] = getProducts().map(product => ({
    name: product.name, category: product.category, price: product.price, image: product.image,
    ...inventoryMetadata.find(item => item.id === product.id)!,
  }));
  const emptyItem: Omit<StockItem, "id"> = { name: "", category: "Bouquets", price: 0, stock: 0, threshold: 10, image: getProduct(1)!.image, supplier: "", lastRestocked: "Mar 17, 2026" };
  return { initialStock, categories: [...categories], emptyItem };
}
