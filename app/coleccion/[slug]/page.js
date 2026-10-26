import Link from 'next/link';
import { notFound } from 'next/navigation';
import CardTile from '../../../components/CardTile';
import { euros } from '../../../lib/format';
import { getCatalogo, getColecciones } from '../../../lib/seo';
import { ordenar } from '../../../lib/orden';

async function datos(slug) {
  const colecciones = await getColecciones();
  const col = colecciones.find((c) => c.slug === slug);
  if (!col) return null;
  const cat = await getCatalogo();
  const cartas = ordenar(cat.listings.filter((l) => l.collection === col.nombre), 'alfabetico');
  const precios = cartas.map((l) => Number(l.price)).filter((n) => !Number.isNaN(n) && n > 0);
  const juegos = [...new Set(cartas.map((l) => l.game).filter(Boolean))];
  const vendedores = new Set(cartas.map((l) => l.seller_id)).size;
  return { col, cartas, juegos, vendedores, min: precios.length ? Math.min(...precios) : null, max: precios.length ? Math.max(...precios) : null };
}

function intro(d) {
  const { col, cartas, juegos, vendedores, min, max } = d;
  const n = cartas.length;
  const juego = juegos.length ? ` de ${juegos.join(' y ')}` : '';
  const precio = min !== null ? ` Los precios van desde ${euros(min)}${max !== min ? ` hasta ${euros(max)}` : ''}.` : '';
  return `Cartas${juego} de la colección ${col.nombre} a la venta en AkibaTrade: ${n} ${n === 1 ? 'carta disponible' : 'cartas disponibles'} de ${vendedores} ${vendedores === 1 ? 'vendedor' : 'vendedores'}.${precio}`;
}

export async function generateMetadata({ params }) {
  const d = await datos(params.slug);
  if (!d) return { title: 'Colección no encontrada', robots: { index: false } };
  const description = intro(d);
  const first = d.cartas.find((l) => l.front_url);
  return {
    title: `${d.col.nombre} · cartas TCG en venta`,
    description,
    alternates: { canonical: `/coleccion/${params.slug}` },
    openGraph: {
      title: `${d.col.nombre} · cartas TCG en venta · AkibaTrade`,
      description,
      url: `/coleccion/${params.slug}`,
      images: first ? [{ url: first.front_url }] : undefined,
    },
  };
}

export default async function Page({ params }) {
  const d = await datos(params.slug);
  if (!d) notFound();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.akibatrade.com/' },
      { '@type': 'ListItem', position: 2, name: 'Cartas', item: 'https://www.akibatrade.com/catalogo' },
      { '@type': 'ListItem', position: 3, name: d.col.nombre, item: `https://www.akibatrade.com/coleccion/${params.slug}` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="small">
        <Link href="/catalogo">← Todas las cartas</Link>
      </p>
      <h1>{d.col.nombre}</h1>
      <p className="muted">{intro(d)}</p>
      <p className="small">
        <Link href={`/catalogo?coleccion=${encodeURIComponent(d.col.nombre)}`}>Filtrar esta colección en el catálogo →</Link>
      </p>
      <div className="grid">
        {d.cartas.map((l) => (
          <CardTile key={l.id} listing={l} />
        ))}
      </div>
    </>
  );
}
