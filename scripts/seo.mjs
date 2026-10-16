import { readFileSync } from 'node:fs';
import { pageMetadata, publicSeoPaths } from '../src/shared/config/seo.ts';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export function renderSeoHtml(html, path, site) {
  const meta = pageMetadata(path, 'vi', site);
  const tags = [
    `<title>${escape(meta.title)}</title>`,
    `<meta name="description" content="${escape(meta.description)}" />`,
    `<meta name="robots" content="${meta.robots}" />`,
    `<link rel="canonical" href="${meta.canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Lunara Shop" />`,
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${meta.canonical}" />`,
    `<meta property="og:image" content="${meta.image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="${meta.locale}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(meta.title)}" />`,
    `<meta name="twitter:description" content="${escape(meta.description)}" />`,
    `<meta name="twitter:image" content="${meta.image}" />`,
  ];
  return html.replace(/<html lang="[^"]*">/, '<html lang="vi">').replace(/<!-- lunara:seo:start -->[\s\S]*?<!-- lunara:seo:end -->/,
    `<!-- lunara:seo:start -->\n${tags.join('\n')}\n<!-- lunara:seo:end -->`);
}

export function seoPlugin(site) {
  return {
    name: 'lunara-seo', enforce: 'post',
    transformIndexHtml: { order: 'pre', handler: html => renderSeoHtml(html, '/', site) },
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return; // Skip the Worker build.
      this.emitFile({ type: 'asset', fileName: 'shop/index.html', source: renderSeoHtml(String(html.source), '/shop', site) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: site.indexable
        ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cart\nDisallow: /orders/\nSitemap: ${site.origin}/sitemap.xml\n`
        : 'User-agent: *\nDisallow: /\n' });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${site.indexable ? publicSeoPaths.map(path => `<url><loc>${site.origin}${path}</loc></url>`).join('') : ''}</urlset>\n` });
      if (!site.indexable) this.emitFile({ type: 'asset', fileName: '_headers', source:
        readFileSync(new URL('../public/_headers', import.meta.url), 'utf8') + '\n/*\n  X-Robots-Tag: noindex, nofollow\n' });
    },
  };
}
