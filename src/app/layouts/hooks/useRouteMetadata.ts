import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useLocale } from '@/shared/i18n';
import { pageMetadata } from '@/shared/config/seo';

export function useRouteMetadata() {
  const { pathname } = useLocation();
  const { language } = useLocale();
  useEffect(() => {
    const meta = pageMetadata(pathname, language);
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
  }, [pathname, language]);
}
