import { useState } from "react";
import type { StockItem, ModalMode } from "../inventory.types";
import { getInventoryDemoData } from "../inventory.service";
export function useInventory() {
  const {
    initialStock,
    categories,
    emptyItem
  } = getInventoryDemoData();
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStock);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState<ModalMode>(null);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<Omit<StockItem, "id">>(emptyItem);
  const filtered = stockItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || item.category === category;
    return matchSearch && matchCat;
  });
  const lowStock = stockItems.filter(i => i.stock <= i.threshold);
  const stockStatus = (item: StockItem) => {
    if (item.stock === 0) return {
      label: "Out of Stock",
      color: "#E8453C",
      bg: "#FFF0F0"
    };
    if (item.stock <= item.threshold) return {
      label: "Low Stock",
      color: "#D4A020",
      bg: "#FDF8E8"
    };
    return {
      label: "In Stock",
      color: "#7A9E7E",
      bg: "#EDF7EF"
    };
  };
  const openAdd = () => {
    setFormData(emptyItem);
    setEditingItem(null);
    setModal("add");
  };
  const openEdit = (item: StockItem) => {
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price,
      stock: item.stock,
      threshold: item.threshold,
      image: item.image,
      supplier: item.supplier,
      lastRestocked: item.lastRestocked
    });
    setEditingItem(item);
    setModal("edit");
  };
  const handleSave = () => {
    if (modal === "add") setStockItems(prev => [...prev, {
      id: Date.now(),
      ...formData
    }]);else if (modal === "edit" && editingItem) setStockItems(prev => prev.map(i => i.id === editingItem.id ? {
      ...i,
      ...formData
    } : i));
    setModal(null);
  };
  const handleDelete = (id: number) => setStockItems(prev => prev.filter(i => i.id !== id));
  return {
    stockItems,
    search,
    setSearch,
    category,
    setCategory,
    modal,
    setModal,
    formData,
    setFormData,
    filtered,
    lowStock,
    stockStatus,
    openAdd,
    openEdit,
    handleSave,
    handleDelete,
    categories
  };
}
export type InventoryModel = ReturnType<typeof useInventory>;
