import { getSeller } from '../../../lib/seo';

export async function generateMetadata({ params }) {
  const s = await getSeller(params.id);
  if (!s) return { title: 'Tienda no encontrada', robots: { index: false } };
  const n = s.cards_available || 0;
  const title = `Tienda de ${s.display_name}`;
  const description = `Cartas TCG de ${s.display_name} en AkibaTrade${n ? `: ${n} ${n === 1 ? 'carta' : 'cartas'} en venta` : ''}. Compra directamente al vendedor.`;
  return {
    title,
    description,
    alternates: { canonical: `/tienda/${params.id}` },
    openGraph: { title: `${title} · AkibaTrade`, description, url: `/tienda/${params.id}`, type: 'website' },
  };
}

export default function TiendaLayout({ children }) {
  return children;
}
