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

export function pageMetadata(pathname: string, language: string, site = siteConfiguration) {
  const vi = language === 'vi';
  const path = pathname.replace(/\/$/, '') || '/';
  const routes: Record<string, [string, string, string, string]> = {
    '/': ['Hoa tươi và quà tặng | Lunara Shop', 'Gửi trọn yêu thương với hoa tươi và quà tặng từ Lunara Shop. Khám phá bộ sưu tập và đặt hoa giao tận nơi.', 'Fresh flowers and gifts | Lunara Shop', 'Send thoughtful flowers and gifts with Lunara Shop. Explore our collection and order flowers for delivery.'],
    '/shop': ['Bộ sưu tập hoa tươi | Lunara Shop', 'Khám phá các mẫu hoa tươi tại Lunara Shop, chọn kích thước và xem giá, khu vực giao hàng trước khi đặt hoa.', 'Shop flowers | Lunara Shop', 'Explore fresh flowers at Lunara Shop, choose your bouquet size and check prices and delivery areas.'],
    '/cart': ['Giỏ hàng và đặt hoa | Lunara Shop', 'Kiểm tra giỏ hàng, thông tin giao hoa và xác nhận đơn COD.', 'Cart and checkout | Lunara Shop', 'Review your flowers, delivery details and COD order.'],
    '/orders/track': ['Tra cứu đơn hoa | Lunara Shop', 'Tra cứu đơn hoa bằng mã đơn và số điện thoại.', 'Track your order | Lunara Shop', 'Look up your flower order using its number and phone.'],
  };
  const fallback: [string, string, string, string] = path.startsWith('/admin')
    ? ['Quản trị cửa hàng | Lunara Shop', 'Khu vực quản trị Lunara Shop.', 'Shop administration | Lunara Shop', 'Lunara Shop administration.']
    : ['Trang chưa có | Lunara Shop', 'Khám phá bộ sưu tập hoa tại Lunara Shop.', 'Page unavailable | Lunara Shop', 'Explore the flower collection at Lunara Shop.'];
  const copy = routes[path] || fallback;
  const publicPage = (publicSeoPaths as readonly string[]).includes(path);
  return { title: copy[vi ? 0 : 2], description: copy[vi ? 1 : 3],
    robots: site.indexable && publicPage ? 'index, follow' : 'noindex, nofollow',
    canonical: `${site.origin}${publicPage ? path : '/'}`, image: `${site.origin}/og-image.png`,
    locale: vi ? 'vi_VN' : 'en_US', language: vi ? 'vi' : 'en' };
}
