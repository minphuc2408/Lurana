export const publicSeoPaths = ['/', '/shop'] as const;
export interface SiteConfiguration { origin: string; indexable: boolean }
export function getSiteConfiguration(env: Record<string, string | undefined>, staging = false): SiteConfiguration {
  const origin = new URL(env.VITE_SITE_URL || 'https://lunara.minphuc2408.workers.dev');
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('VITE_SITE_URL must be a public HTTPS origin');
  return { origin: origin.origin, indexable: !staging && env.VITE_SITE_INDEXABLE !== 'false' };
}
declare const __LUNARA_SITE_CONFIGURATION__: SiteConfiguration | undefined;
export const siteConfiguration = typeof __LUNARA_SITE_CONFIGURATION__ === 'undefined'
  ? getSiteConfiguration({}) : __LUNARA_SITE_CONFIGURATION__;

export interface ProductMetadata { name: string; description?: string | null; image?: string }
export function pageMetadata(pathname: string, language: string, site = siteConfiguration, product?: ProductMetadata) {
  const vi = language === 'vi';
  const path = pathname.replace(/\/$/, '') || '/';
  const routes: Record<string, [string, string, string, string]> = {
    '/': ['Hoa tươi và quà tặng | Lunarra', 'Gửi trọn yêu thương với hoa tươi và quà tặng từ Lunarra. Khám phá bộ sưu tập và đặt hoa giao tận nơi.', 'Fresh flowers and gifts | Lunarra', 'Send thoughtful flowers and gifts with Lunarra. Explore our collection and order flowers for delivery.'],
    '/shop': ['Bộ sưu tập hoa tươi | Lunarra', 'Khám phá các mẫu hoa tươi tại Lunarra, chọn kích thước và xem giá, khu vực giao hàng trước khi đặt hoa.', 'Shop flowers | Lunarra', 'Explore fresh flowers at Lunarra, choose your bouquet size and check prices and delivery areas.'],
    '/cart': ['Giỏ hoa của bạn | Lunarra', 'Kiểm tra sản phẩm và số lượng trước khi tiến hành đặt hoa.', 'Your flower cart | Lunarra', 'Review your flowers and quantities before checkout.'],
    '/checkout': ['Thông tin giao hoa và thanh toán | Lunarra', 'Điền thông tin giao hoa, chọn thiệp và kiểm tra đơn COD trước khi xác nhận.', 'Flower delivery and payment | Lunarra', 'Enter delivery details, choose your card and review your COD order.'],
    '/orders/track': ['Tra cứu đơn hoa | Lunarra', 'Tra cứu đơn hoa bằng mã đơn và số điện thoại.', 'Track your order | Lunarra', 'Look up your flower order using its number and phone.'],
  };
  const fallback: [string, string, string, string] = path.startsWith('/admin')
    ? ['Quản trị cửa hàng | Lunarra', 'Khu vực quản trị Lunarra.', 'Shop administration | Lunarra', 'Lunarra administration.']
    : ['Trang chưa có | Lunarra', 'Khám phá bộ sưu tập hoa tại Lunarra.', 'Page unavailable | Lunarra', 'Explore the flower collection at Lunarra.'];
  const productPage = /^\/shop\/[^/]+$/.test(path);
  const description = product?.description || (vi ? 'Khám phá mẫu hoa thủ công tại Lunarra. Chọn kích cỡ và đặt hoa giao tận nơi.' : 'Discover a handcrafted arrangement at Lunarra. Choose your size and arrange delivery.');
  const copy = productPage ? [product ? `${product.name} | Lunarra` : 'Chi tiết mẫu hoa | Lunarra', description, product ? `${product.name} | Lunarra` : 'Flower details | Lunarra', description] : routes[path] || fallback;
  const publicPage = (publicSeoPaths as readonly string[]).includes(path) || (productPage && Boolean(product));
  return { title: copy[vi ? 0 : 2], description: copy[vi ? 1 : 3],
    robots: site.indexable && publicPage ? 'index, follow' : 'noindex, nofollow',
    canonical: `${site.origin}${publicPage || productPage ? path : '/'}`, image: productPage && product?.image ? product.image : `${site.origin}/og-image.png`,
    locale: vi ? 'vi_VN' : 'en_US', language: vi ? 'vi' : 'en' };
}
