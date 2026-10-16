import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useCatalog } from '@/features/shop';
import { useLocale, getLocalizedName } from '@/shared/i18n';
import { pageMetadata } from '@/shared/config/seo';

export function useRouteMetadata() {
  const { pathname } = useLocation();
  const { language } = useLocale();
  const { products } = useCatalog();
  const product = products.find(item => item.slug && pathname === `/shop/${encodeURIComponent(item.slug)}`);
  useEffect(() => {
    const meta = pageMetadata(pathname, language, undefined, product ? { name: getLocalizedName(product, language), description: language === 'vi' ? product.description_vi || product.description_en : product.description_en || product.description_vi, image: product.image } : undefined);
    document.title = meta.title;
    const set = (attribute: 'name' | 'property', key: string, value: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.append(element); }
      element.content = value;
    };
    set('name', 'description', meta.description); set('name', 'robots', meta.robots);
    for (const [key, value] of Object.entries({ title: meta.title, description: meta.description, url: meta.canonical, image: meta.image, locale: meta.locale })) set('property', `og:${key}`, value);
    for (const [key, value] of Object.entries({ title: meta.title, description: meta.description, image: meta.image })) set('name', `twitter:${key}`, value);
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = meta.canonical;
  }, [pathname, language, product]);
}
