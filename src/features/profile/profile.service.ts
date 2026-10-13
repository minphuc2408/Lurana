import { getProduct } from "@/features/shop";
import { recentOrders, tabs } from "./data/profile.data";
export function getProfileDemoData() {
  return { peonyImage: getProduct(1)!.image, recentOrders: structuredClone(recentOrders), tabs: [...tabs], wishlistItems: [getProduct(1)!, getProduct(4)!] };
}
