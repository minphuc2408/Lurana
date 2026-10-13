import type { Product } from "../shop.types";
export const peonyImage = "https://images.unsplash.com/photo-1764423805989-ec426dfb8de8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaW5rJTIwcGVvbnklMjBib3VxdWV0JTIwcm9tYW50aWMlMjBzb2Z0fGVufDF8fHx8MTc3MzU1Mjk1N3ww&ixlib=rb-4.1.0&q=80&w=600";
export const roseImage = "https://images.unsplash.com/photo-1761571259874-bb4871c44340?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmbG93ZXIlMjBib3VxdWV0JTIwcGluayUyMHJvc2VzJTIwZWxlZ2FudHxlbnwxfHx8fDE3NzM1NTI5NTd8MA&ixlib=rb-4.1.0&q=80&w=600";
export const sunflowerImage = "https://images.unsplash.com/photo-1770704516784-ef5f1eaf0c06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5mbG93ZXIlMjBkYWlzeSUyMGJyaWdodCUyMHllbGxvdyUyMHNwcmluZ3xlbnwxfHx8fDE3NzM1NTI5NjF8MA&ixlib=rb-4.1.0&q=80&w=600";
export const lavenderImage = "https://images.unsplash.com/photo-1653821355168-144695e5c0e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXZlbmRlciUyMHB1cnBsZSUyMGZsb3JhbCUyMGVsZWdhbnQlMjB3ZWRkaW5nfGVufDF8fHx8MTc3MzU1Mjk2MXww&ixlib=rb-4.1.0&q=80&w=600";
export const lilyImage = "https://images.unsplash.com/photo-1766050917257-27675ab4e33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGxpbHklMjBmbG93ZXIlMjBtaW5pbWFsaXN0JTIwY2xlYW58ZW58MXx8fHwxNzczNTUyOTYxfDA&ixlib=rb-4.1.0&q=80&w=600";
export const mixedImage = "https://images.unsplash.com/photo-1763817976891-ba82007167bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGZsb3dlciUyMGFycmFuZ2VtZW50JTIwY29sb3JmdWwlMjBtYXJrZXR8ZW58MXx8fHwxNzczNTUyOTYyfDA&ixlib=rb-4.1.0&q=80&w=600";
export const tulipImage = "https://images.unsplash.com/photo-1713859747936-a3220ff17982?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWxpcCUyMHBhc3RlbCUyMHNwcmluZyUyMGZsb3dlciUyME5ldGhlcmxhbmRzfGVufDF8fHx8MTc3MzU1Mjk2NXww&ixlib=rb-4.1.0&q=80&w=600";
export const wildflowerImage = "https://images.unsplash.com/photo-1735302600702-98b1bd15a98e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aWxkZmxvd2VyJTIwbWVhZG93JTIwYWVzdGhldGljJTIwcGFzdGVsfGVufDF8fHx8MTc3MzU1Mjk1OHww&ixlib=rb-4.1.0&q=80&w=600";
export const products: Product[] = [{
  id: 1,
  name: "Blush Peony Bouquet",
  price: 1200,
  category: "Bouquets",
  image: peonyImage,
  tag: "Bestseller",
  rating: 4.9,
  reviews: 87
}, {
  id: 2,
  name: "Red Rose Romance",
  price: 1500,
  category: "Bouquets",
  image: roseImage,
  tag: "New",
  rating: 4.8,
  reviews: 34
}, {
  id: 3,
  name: "Sunshine Daisy Mix",
  price: 850,
  category: "Arrangements",
  image: sunflowerImage,
  tag: "",
  rating: 4.7,
  reviews: 62
}, {
  id: 4,
  name: "Lavender Dreams",
  price: 950,
  category: "Arrangements",
  image: lavenderImage,
  tag: "Popular",
  rating: 4.9,
  reviews: 115
}, {
  id: 5,
  name: "White Lily Elegance",
  price: 1100,
  category: "Bouquets",
  image: lilyImage,
  tag: "",
  rating: 4.6,
  reviews: 28
}, {
  id: 6,
  name: "Garden Party Mix",
  price: 1350,
  category: "Gift Sets",
  image: mixedImage,
  tag: "Seasonal",
  rating: 4.8,
  reviews: 51
}, {
  id: 7,
  name: "Pastel Tulip Set",
  price: 900,
  category: "Bouquets",
  image: tulipImage,
  tag: "",
  rating: 4.7,
  reviews: 43
}, {
  id: 8,
  name: "Wildflower Meadow",
  price: 750,
  category: "Dried Flowers",
  image: wildflowerImage,
  tag: "Eco-Friendly",
  rating: 4.5,
  reviews: 19
}];
export const categories = ["All", "Bouquets", "Arrangements", "Dried Flowers", "Gift Sets"];
