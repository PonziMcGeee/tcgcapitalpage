import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fetchAllAvailable, fetchSellers } from './data';
import { slugify } from './slug';
import { conditionLabel } from './format';

export const SITE_URL = 'https://www.akibatrade.com';
export const SITE_NAME = 'AkibaTrade';

// Cliente de Supabase para el servidor (sin sesión: solo lee datos públicos)
export function serverSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const getListing = cache(async (id) => {
  const sb = serverSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.from('listings').select('*').eq('id', id).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
});

export const getSeller = cache(async (id) => {
  const sb = serverSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.from('sellers_public').select('*').eq('id', id).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
});

// Todos los datos de una tienda (para pintarla ya en el servidor)
export const getTienda = cache(async (id) => {
  const sb = serverSupabase();
  if (!sb) return null;
  try {
    const [cartas, vendedor, rs] = await Promise.all([
      sb.from('listings').select('*').eq('seller_id', id).order('created_at', { ascending: false }),
      sb.from('sellers_public').select('id, display_name, color, avatar_url, cards_available').eq('id', id).maybeSingle(),
      sb.from('reviews').select('*').eq('seller_id', id).order('created_at', { ascending: false }),
    ]);
    if (cartas.error || !vendedor.data) return null;
    return { listings: cartas.data || [], info: vendedor.data, resenas: rs.data || [] };
  } catch {
    return null;
  }
});

// Cartas disponibles y vendedores para el catálogo (sin los campos pesados que el catálogo no usa)
export const getCatalogo = cache(async () => {
  const sb = serverSupabase();
  if (!sb) return null;
  try {
    const [cartas, vendedores] = await Promise.all([fetchAllAvailable(sb), fetchSellers(sb)]);
    if (cartas.error || !cartas.data) return null;
    const listings = cartas.data.map(({ description, back_url, ...resto }) => resto);
    return { listings, sellers: vendedores.error ? null : vendedores.data };
  } catch {
    return null;
  }
});

export { slugify };

// Colecciones que tienen cartas a la venta: [{ nombre, slug, total }]
export const getColecciones = cache(async () => {
  const cat = await getCatalogo();
  if (!cat) return [];
  const mapa = new Map();
  cat.listings.forEach((l) => {
    if (!l.collection) return;
    const e = mapa.get(l.collection) || { nombre: l.collection, slug: slugify(l.collection), total: 0 };
    e.total += 1;
    mapa.set(l.collection, e);
  });
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
});

const recortar = (t, n) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

export function descripcionCarta(l) {
  const partes = [l.game, l.collection, conditionLabel(l.condition)].filter(Boolean).join(' · ');
  const precio = l.price !== null && l.price !== undefined && l.price !== '' ? ` Precio: ${Number(l.price).toFixed(2).replace('.', ',')} €.` : '';
  const extra = l.description ? ` ${l.description}` : '';
  return recortar(`${l.name} — ${partes}.${precio} Vendida por ${l.seller_name} en AkibaTrade.${extra}`, 200);
}

export function metadataCarta(l, id) {
  if (!l) return { title: 'Carta no encontrada', robots: { index: false } };
  const url = `/carta/${id}`;
  const title = `${l.name}${l.collection ? ` · ${l.collection}` : ''} (${l.game})`;
  const description = descripcionCarta(l);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: l.status === 'sold' ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url,
      type: 'website',
      images: l.front_url ? [{ url: l.front_url, alt: l.name }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: l.front_url ? [l.front_url] : undefined },
  };
}

export function jsonLdCarta(l, id) {
  if (!l) return null;
  const hay = l.price !== null && l.price !== undefined && l.price !== '';
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: l.name,
    description: descripcionCarta(l),
    image: [l.front_url, l.back_url].filter(Boolean),
    category: l.game,
    itemCondition: 'https://schema.org/UsedCondition',
    url: `${SITE_URL}/carta/${id}`,
    ...(hay
      ? {
          offers: {
            '@type': 'Offer',
            price: Number(l.price).toFixed(2),
            priceCurrency: 'EUR',
            availability: l.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            url: `${SITE_URL}/carta/${id}`,
            seller: { '@type': 'Person', name: l.seller_name },
          },
        }
      : {}),
  };
}
