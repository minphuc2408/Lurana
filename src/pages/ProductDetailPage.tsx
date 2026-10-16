import { ProductDetailView, useProductDetail } from '@/features/shop';
export default function ProductDetailPage() {
  const model = useProductDetail();
  return <ProductDetailView {...model} />;
}
