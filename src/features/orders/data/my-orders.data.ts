import type { OrderStatus } from "../my-orders.types";
export const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=200";
export const lilyImage = "https://images.unsplash.com/photo-1766050917257-27675ab4e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGxpbHklMjBmbG93ZXIlMjBtaW5pbWFsaXN0JTIwY2xlYW58ZW58MXx8fHwxNzczNTUyOTYxfDA&ixlib=rb-4.1.0&q=80&w=200";
export const sunflowerImage = "https://images.unsplash.com/photo-1770704516784-ef5f1eaf0c06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBkYWlzeSUyMGJyaWdodCUyMHllbGxvdyUyMHNwcmluZ3xlbnwxfHx8fDE3NzM1NTI5NjF8MA&ixlib=rb-4.1.0&q=80&w=200";
export const mixedImage = "https://images.unsplash.com/photo-1763817976891-ba82007167bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGZsb3dlciUyMGFycmFuZ2VtZW50JTIwY29sb3JmdWwlMjBtYXJrZXR8ZW58MXx8fHwxNzczNTUyOTYyfDA&ixlib=rb-4.1.0&q=80&w=200";
export const orders = [{
  id: "LN-2026-1042",
  date: "March 10, 2026",
  status: "Delivered" as OrderStatus,
  items: [{
    name: "Blush Peony Bouquet", name_en: "Blush Peony Bouquet", name_vi: "Bó mẫu đơn hồng phấn",
    qty: 1,
    price: 1200,
    image: peonyImage
  }],
  delivery: 150,
  address: "456 Sampaguita St, Makati City",
  tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
  trackStep: 4,
  rating: 5
}, {
  id: "LN-2026-0987",
  date: "February 22, 2026",
  status: "Delivered" as OrderStatus,
  items: [{
    name: "White Lily Elegance", name_en: "White Lily Elegance", name_vi: "Ly trắng thanh lịch",
    qty: 2,
    price: 1100,
    image: lilyImage
  }, {
    name: "Sunshine Daisy Mix", name_en: "Sunshine Daisy Mix", name_vi: "Hoa cúc ngập nắng",
    qty: 1,
    price: 850,
    image: sunflowerImage
  }],
  delivery: 300,
  address: "789 Rosal Street, BGC, Taguig",
  tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
  trackStep: 4,
  rating: 5
}, {
  id: "LN-2026-1198",
  date: "March 14, 2026",
  status: "In Transit" as OrderStatus,
  items: [{
    name: "Garden Party Mix", name_en: "Garden Party Mix", name_vi: "Sắc hoa vườn",
    qty: 1,
    price: 1350,
    image: mixedImage
  }],
  delivery: 150,
  address: "123 Orchid Avenue, Quezon City",
  tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
  trackStep: 3,
  rating: null
}, {
  id: "LN-2026-1201",
  date: "March 15, 2026",
  status: "Processing" as OrderStatus,
  items: [{
    name: "Blush Peony Bouquet", name_en: "Blush Peony Bouquet", name_vi: "Bó mẫu đơn hồng phấn",
    qty: 2,
    price: 1200,
    image: peonyImage
  }],
  delivery: 500,
  address: "55 Tulip Drive, Pasig City",
  tracking: ["Order placed", "Preparing your flowers", "Out for delivery", "Delivered"],
  trackStep: 2,
  rating: null
}];
