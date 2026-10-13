export type StockItem = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  image: string;
  supplier: string;
  lastRestocked: string;
};
export type ModalMode = "add" | "edit" | null;
