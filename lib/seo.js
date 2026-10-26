import { createClient } from '@supabase/supabase-js';
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

export async function getListing(id) {
  const sb = serverSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.from('listings').select('*').eq('id', id).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

export async function getSeller(id) {
  const sb = serverSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.from('sellers_public').select('*').eq('id', id).maybeSingle();
    return data || null;
  } catch {
    return null;
  }
}

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
