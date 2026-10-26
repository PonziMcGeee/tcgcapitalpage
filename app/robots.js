import { SITE_URL } from '../lib/seo';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/vendedor', '/mis-compras', '/favoritos', '/api/', '/nueva-contrasena'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
