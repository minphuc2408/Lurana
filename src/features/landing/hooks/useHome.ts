import { getHomeContent } from "../home.service";
import { useCatalog } from '@/features/shop';
export function useHome() {
  const catalog = useCatalog();
  return { ...getHomeContent(), ...catalog, featuredProducts: catalog.products.filter(product => product.is_featured) };
}
export type HomeModel = ReturnType<typeof useHome>;
