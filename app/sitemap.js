import { SITE_URL, getColecciones, serverSupabase } from '../lib/seo';

export const revalidate = 3600;

export default async function sitemap() {
  const ahora = new Date();
  const fijas = ['', '/catalogo', '/vendedores', '/contacto', '/conviertete-en-vendedor', '/aviso-legal', '/privacidad', '/condiciones', '/cookies'].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: ahora,
    changeFrequency: p === '' || p === '/catalogo' ? 'daily' : 'monthly',
    priority: p === '' ? 1 : p === '/catalogo' ? 0.9 : 0.4,
  }));
  const sb = serverSupabase();
  if (!sb) return fijas;
  let cartas = [];
  try {
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from('listings').select('id, created_at').eq('status', 'available').order('created_at', { ascending: false }).range(from, from + 999);
      if (error || !data) break;
      cartas = cartas.concat(data);
      if (data.length < 1000) break;
    }
  } catch {}
  let tiendas = [];
  try {
    const { data } = await sb.from('sellers_public').select('id');
    tiendas = data || [];
  } catch {}
  const colecciones = await getColecciones();
  return [
    ...fijas,
    ...colecciones.map((c) => ({ url: `${SITE_URL}/coleccion/${c.slug}`, lastModified: ahora, changeFrequency: 'daily', priority: 0.8 })),
    ...tiendas.map((s) => ({ url: `${SITE_URL}/tienda/${s.id}`, lastModified: ahora, changeFrequency: 'daily', priority: 0.7 })),
    ...cartas.map((c) => ({ url: `${SITE_URL}/carta/${c.id}`, lastModified: c.created_at ? new Date(c.created_at) : ahora, changeFrequency: 'weekly', priority: 0.6 })),
  ];
}
