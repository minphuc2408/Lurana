import { getProducts } from '@/features/shop';
import { heroImage, shopImage } from './data/home.data';
export function getHomeContent() {
  return { heroImage, shopImage, testimonials: [] as { name: string; review: string; review_vi: string; stars: number }[],
    featuredProducts: getProducts().filter(product => product.is_featured) };
}
