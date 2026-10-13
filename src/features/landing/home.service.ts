import { getProducts } from "@/features/shop";
import { heroImage, shopImage, testimonials } from "./data/home.data";
export function getHomeDemoData() {
  const products = getProducts();
  const featuredProducts = [1, 3, 4, 5].map(id => products.find(product => product.id === id)!).map(product => ({ ...product, tag: product.id === 3 ? "New" : product.tag }));
  return { heroImage, shopImage, testimonials: structuredClone(testimonials), featuredProducts };
}
